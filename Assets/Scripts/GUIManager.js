
// GUIManager class
class GUIManager {

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
  currentRadars = [];

  // Memory allocation
  tempArray = [undefined, undefined];

  constructor(){
    // TODO: USE URL
    // URL configuration
    // Get configuration from window location hash
    let tmst = window.location.getHashValue('TIME');
    this.setNewTmst(tmst);


    // EVENTS
    // Hash changes
    // event.newURL, event.oldURL
    window.onhashchange = (event) => {
      // Internal change (app changed hash)
      if (window.location.isInternalChange)
        window.location.isInternalChange = false;
      // User changed hash
      else {
        console.log("HAS CHANGE");
        // Check if timestamp changed
        let tmst = window.location.getHashValue('TIME');
        if (tmst != this.currentTmst){
          this.setNewTmst(tmst);
          // TODO
          // > Event to DataStreamsBar > DatastreamsBar event to all
        }
      }
      
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
    // When invalid date, set default (now)
    if (isNaN(d.getTime())){
      if (tmst != undefined)
        console.warn('Invalid timestamp on URL, please use ISO standard i.e., TIME=2024-02-12T05:00:00.000Z');

      let now = new Date();
      let str = now.toISOString();
      let nowISODate = str.substring(0, 14) + '00:00.000Z';
      this.currentTmst = this.currentTmst || nowISODate;
    }
    else {
      let formatedTmst = tmst.substring(0, 14) + '00:00.000Z';
      this.currentTmst = formatedTmst;
    }

    window.location.setHashValue('TIME', this.currentTmst);
  }


  // Selected date changes
  selectedDateChanged(tmst){
    // Set current timestamp
    this.currentTmst = tmst;
    // Get radars on that date
    this.currentRadars = window.DataManager.getRadarsDataOn(this.currentTmst);
    // Set URL config
    window.location.setHashValue('TIME', this.currentTmst);
  }


  // Mouse is moving in map
  mouseMoveInMap(screenPosCoords){
    //debugger;
    // Particles are visible and no point is selected
    if (this.widgetCombinedRadars.isVisible && this.widgetCombinedRadars.areParticlesVisible && !this.isDataPointSelected){
      // Get combined radar
      let combinedRadar;
      let radars = this.currentRadars;
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