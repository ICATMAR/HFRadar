
// GUIManager class
class GUIManager {

  firstDate = new Date('2023-04-01T00:00Z');


  // Currents widget
  widgetCombinedRadars = {
    isVisible: true,
    areParticlesVisible: true,
    arePointsVisible: false,
  }

  // HF Radar widget
  // TODO: INTEGRAT, NOW NOT USED IN APP
  widgetHFRadars = {
    isVisible: false,
    areParticlesVisible: true,
    arePointsVisible: false,
    radarsVisible: {
      'BEGU': true,
      'CREU': true,
      'AREN': true,
      'PBCN': true,
      'GNST': true,
    }
  }

  // Advanced interface
  isAdvancedInterface = false;

  // Data point selected
  isDataPointSelected = false;

  // Current timestamp
  currentTmst = undefined;
  currentRadars = undefined;

  // Memory allocation
  tempArray = [undefined, undefined];

  constructor(){
    // HASH - URL configuration
    // Get configuration from window location hash
    // Time <TIME=2024-02-14T11:00:00.000Z>
    let tmst = window.location.getHashValue('TIME');
    this.setNewTmst(tmst);
    window.location.isInternalChange = false;

    // Map View <VIEW=long,lat,zoom>
    this.mapView = window.location.getHashValue('VIEW');


    // EVENTS
    // Hash changes
    // event.newURL, event.oldURL
    window.onhashchange = (event) => {
      // Internal change (app changed hash)
      if (window.location.isInternalChange)
        window.location.isInternalChange = false;
      // User changed hash
      else {
        // Check if timestamp changed
        let tmst = window.location.getHashValue('TIME');
        if (tmst != this.currentTmst){
          this.setNewTmst(tmst);
          // Check if event.newURL and event.oldURL have different time
          let oldTmst = window.location.getHashValue("TIME", event.oldURL);
          let newTmst = window.location.getHashValue("TIME", event.newURL);
          if (oldTmst != newTmst)
            window.eventBus.emit('GUIManager_URLDateChanged', this.currentTmst);
        }
        // Check if map view changed
        let mapView = window.location.getHashValue('VIEW');
        if (mapView != this.mapView){
          this.setMapView(mapView);
          window.eventBus.emit('GUIManager_URLViewChanged', this.mapView);
        }
      }
      window.location.isInternalChange = false;      
    };
    // New HFRadar data
    window.eventBus.on('HFRadarDataLoaded', (tmst) =>{
      if (tmst != undefined)
        this.selectedDateChanged(tmst);
    });
    // Selected date changed (slider moves or drag and drop files)
    window.eventBus.on('DataStreamsBar_SelectedDateChanged', (tmst) =>{
      this.selectedDateChanged(tmst);
    });


    // Advanced interface button
    window.eventBus.on('AdvancedInterfaceOnOff', state => {
      this.isAdvancedInterface = state;
    })


    // Map
    window.eventBus.on('Map_MapMoveEnd', values => {
      this.setMapView(values.toString());
      window.location.isInternalChange = false;
    });
    // Data point selection
    window.eventBus.on('Map_ClickedDataPoint', () => this.isDataPointSelected = true);//{"dataPoint": closestDataPoint, "radar": selRadar});
    window.eventBus.on('DeselectedDataPoint', () => this.isDataPointSelected = false);
    // Mouse events
    // Mouse move in map
    window.eventBus.on('Map_MouseMove', screenPosCoords => this.mouseMoveInMap(screenPosCoords));


  }



  // INTERNAL
  setNewTmst(tmst){
    let d = new Date(tmst);
    let isInvalid = isNaN(d.getTime());

    // Invalid date, 
    if (isInvalid){
      if (tmst != undefined)
        console.warn('Invalid timestamp on URL, please use ISO standard i.e., TIME=2024-02-12T05:00:00.000Z');
    } 
    // Outside of range
    else {
      let latestTmst = window.DataManager.latestDataTmst || new Date().toISOString();
      
      let latestDate = new Date(latestTmst);
      if (d < this.firstDate || d > latestDate) console.warn('Timestamp outside of range (before April 2023 or after current time now');
      // Set to last or first tmst
      if (d < this.firstDate){
        tmst = this.firstDate.toISOString();
      } 
      // Last date
      else if (d >= latestDate){
        tmst = latestDate.toISOString();
      }
    }

    // Set default (now or previous)
    if (isInvalid) {
      let now = new Date();
      let str = now.toISOString();
      let nowISODate = str.substring(0, 14) + '00:00.000Z';
      this.currentTmst = this.currentTmst || nowISODate;
    }
    else {
      let formatedTmst = tmst.substring(0, 14) + '00:00.000Z';
      this.currentTmst = formatedTmst;
    }

    // If we are in the latest data value, remove hash
    if (this.currentTmst == window.DataManager.latestDataTmst){
      window.location.removeHash('TIME');
    } else {
      window.location.setHashValue('TIME', this.currentTmst);
    }
    
  }

  // Input is a string
  setMapView(values){
    let itemsIn = values.split(",");
    // Three values must be provided
    if (itemsIn.length == 3){
      let isAnyNaN = itemsIn.some(el => isNaN(parseFloat(el)));
      if (!isAnyNaN)
        this.mapView = values;
    }
      
    window.location.setHashValue('VIEW', this.mapView);
  }

  // Selected date changes
  selectedDateChanged(tmst){
    // Set current timestamp
    this.currentTmst = tmst;
    // Get radars on that date
    this.currentRadars = window.DataManager.getRadarsDataOn(this.currentTmst);
    // Set URL config
    // If we are in the latest data value, remove hash
    if (this.currentTmst == window.DataManager.latestDataTmst)
      window.location.removeHash('TIME');
    else
      window.location.setHashValue('TIME', this.currentTmst);
  }


  // Mouse is moving in map
  mouseMoveInMap(screenPosCoords){
    //debugger;
    // Particles are visible and no point is selected
    if (this.widgetCombinedRadars.isVisible && this.widgetCombinedRadars.areParticlesVisible && !this.isDataPointSelected){
      // Get combined radar
      let combinedRadar;
      let radars = this.currentRadars || window.DataManager.getRadarsDataOn(this.currentTmst);
      if (radars.length != 0 ){
        for (let i = 0; i < radars.length; i++){
          let HFRadar = radars[i];
          if (HFRadar.constructor.name == 'CombinedRadars'){
            combinedRadar = HFRadar;
          }
        }
      }
      // Get value and send it
      if (combinedRadar !== undefined){
        let value = this.tempArray;
        combinedRadar.getValueAtTmstLongLat(this.currentTmst, screenPosCoords[2], screenPosCoords[3], value);

        window.eventBus.emit('GUIManager_MouseMovingCurrentsValue', value);
        
      }
    }

  }


}

export default GUIManager;