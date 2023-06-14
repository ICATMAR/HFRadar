
// GUIManager class
class GUIManager {

  // Currents widget
  widgetCombinedRadars = {
    isVisible: true,
    areParticlesVisible: true,
    arePointsVisible: false,
  }

  // Data point selected
  isDataPointSelected = false;

  // Current timestamp
  currentTmst = undefined;
  currentRadars = [];

  // Memory allocation
  tempArray = [undefined, undefined];

  constructor(config){
    // TODO: config file

    // EVENTS
    // New HFRadar data
    window.eventBus.on('HFRadarDataLoaded', (tmst) =>{
      if (tmst != undefined)
        this.selectedDateChanged(tmst);
    });
    // Selected date changed (slider moves or drag and drop files)
    window.eventBus.on('SelectedDateChanged', (tmst) =>{
      this.selectedDateChanged(tmst);
    });

    // WidgetCombinedRadars
    window.eventBus.on("WidgetCombinedRadars_VisibilityChanged", value => {
      this.widgetCombinedRadars.isVisible = value;
      this.isDataPointSelected = false;
    });
    window.eventBus.on("WidgetCombinedRadars_AnimationActiveChanged", value => {
      this.widgetCombinedRadars.areParticlesVisible = value;
    });
    window.eventBus.on("WidgetCombinedRadars_PointsActiveChanged", value => {
      this.widgetCombinedRadars.arePointsVisible = value;
      this.isDataPointSelected = false;
    });


    // Map
    // Data point selection
    window.eventBus.on('Map_ClickedDataPoint', () => this.isDataPointSelected = true);//{"dataPoint": closestDataPoint, "radar": selRadar});
    window.eventBus.on('DeselectedDataPoint', () => this.isDataPointSelected = false);
    // Mouse events
    // Mouse move in map
    window.eventBus.on('Map_MouseMove', screenPosCoords => this.mouseMoveInMap(screenPosCoords));


  }



  // Selected date changes
  selectedDateChanged(tmst){
    console.log('++++++++++++++' + tmst);
    // Set current timestamp
    this.currentTmst = tmst;
    // Get radars on that date
    this.currentRadars = window.DataManager.getRadarsDataOn(this.currentTmst);
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
          if (HFRadar.constructor.name == 'CombinedRadars' && HFRadar.isActivated){
            combinedRadar = HFRadar;
          }
        }
      }
      // Get value and send it
      if (combinedRadar !== undefined){
        let value = this.tempArray;
        combinedRadar.getValueAtTmstLongLat(this.currentTmst, screenPosCoords[2], screenPosCoords[3], value);
        let magnitude = '';
        if (!(value[0] == undefined || isNaN(value[0]))) // Inside negated
          magnitude = (Math.sqrt(value[0]*value[0] + value[1]*value[1])).toFixed(1);
        window.eventBus.emit('GUIManager_MouseMovingCurrentsValue', magnitude);
        
      }
    }

  }


}

export default GUIManager;