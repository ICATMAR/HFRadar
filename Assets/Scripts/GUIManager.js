
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
      'CREU': true,
      'BEGU': true,
      'TOSS': true,
      'AREN': true,
      'PBCN': true,
      'GNST': true,
      'SCAL': true,
    }
  };

  // TimeRangeBar
  isTimeRangeBarPlaying = false;

  // Advanced interface
  isAdvancedInterface = false;

  // Data point selected
  isDataPointSelected = false;

  // Current timestamp
  currentTmst = undefined;
  currentRadars = undefined;

  // Auto-update
  activeSync = false;
  minBetweenCalls = 5;
  minToCallFromLastData = 50; // July update: T+00:50 first try, then at T+01:03 and at T+01:16.
  minCouldFileChanged = 30; // Some files are generated and then updated later when new data comes.

  // Memory allocation
  tempArray = [undefined, undefined];

  constructor() {
    // HASH - URL configuration
    // Get configuration from window location hash
    // Time <TIME=2024-02-14T11:00:00.000Z>
    let tmst = window.location.getHashValue('TIME');
    if (tmst == undefined) {
      this.activeSync = true;
    }
    this.setNewTmst(tmst);
    window.location.isInternalChange = false;

    // Map View <VIEW=long,lat,zoom>
    this.mapView = window.location.getHashValue('VIEW');

    // Radials <RADIALS=BEGU,CREU,AREN,PBCN...>
    this.radials = window.location.getHashValue('RADIALS');
    if (this.radials != undefined) {
      // Show radials if defined on URL at start
      this.isAdvancedInterface = true;
      this.widgetHFRadars.isVisible = true;
      this.widgetHFRadars.areParticlesVisible = true;
      this.widgetHFRadars.arePointsVisible = false;
      // Do not show totals
      this.widgetCombinedRadars.isVisible = false;
      // Update widget variables
      this.updateWidgetHFRadarAccordingToHash(this.radials);
    }



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
        if (tmst != this.currentTmst) {
          this.setNewTmst(tmst);
          // Check if event.newURL and event.oldURL have different time
          let oldTmst = window.location.getHashValue("TIME", event.oldURL);
          let newTmst = window.location.getHashValue("TIME", event.newURL);
          if (oldTmst != newTmst)
            window.eventBus.emit('GUIManager_URLDateChanged', this.currentTmst);
        }
        // Check if map view changed
        let mapView = window.location.getHashValue('VIEW');
        if (mapView != undefined) {
          if (mapView != this.mapView) {
            this.setMapView(mapView);
            window.eventBus.emit('GUIManager_URLViewChanged', this.mapView);
          }
        }
        // Radials changed
        let radials = window.location.getHashValue('RADIALS');
        if (this.radials != radials) {
          // No radials
          if (radials == undefined) {
            this.radials = undefined;
            // User deleted radials parameter -> turn to normal interface and show currents?
            // For sure hide radials
            window.eventBus.emit('GUIManager_URLRadialsChanged');
          } else {
            // Radials changed
            this.radials = radials;
            this.updateWidgetHFRadarAccordingToHash(radials);
            window.eventBus.emit('GUIManager_URLRadialsChanged', radials);
          }
        }

      }
      window.location.isInternalChange = false;
    };
    // New HFRadar data
    window.eventBus.on('HFRadarDataLoaded', (tmst) => {
      if (tmst != undefined)
        this.selectedDateChanged(tmst);
      // If latestDate is bigger than current date, add TIME to hash
      if (window.DataManager.latestDataTmst != this.currentTmst) {
        // Show TIME hash
        window.location.setHashValue('TIME', this.currentTmst);
      }
      // If we are in the latest date and activeSync is on
      else {
        if (this.activeSync && !this.activeSyncLoopOn) {
          this.activeSyncRadarData();
        }
      }
    });
    // Selected date changed (slider moves or drag and drop files)
    window.eventBus.on('DataStreamsBar_SelectedDateChanged', (tmst) => {
      this.selectedDateChanged(tmst);
    });

    // User clicked on active sync, show the latest current
    window.eventBus.on('TopRightCanvas_ActiveSyncClickedAndOn', (tmst) => {
      this.selectedDateChanged(tmst);
    })

    // Advanced interface button
    window.eventBus.on('AdvancedInterfaceOnOff', state => {
      this.isAdvancedInterface = state;
    })


    // Map
    window.eventBus.on('Map_MapMoveEnd', values => {
      this.setMapView(values.toString());
      window.location.isInternalChange = false;
    });
    // Radials
    // Radials all on/off
    window.eventBus.on("WidgetHFRadars_VisibilityChanged", areVisible => {
      if (!areVisible) {
        // Remove hash
        // GUIManager is updated in the other vue component (WidgetHFRadars)
        window.location.removeHash('RADIALS');
      } else {
        // Set hash of active radars
        this.setHashValueAccordingToWidgetHFRadar();
      }
    });
    window.eventBus.on('WidgetHFRadars_RadarActiveChange', radarId => {
      // GUIManager is updated in the other vue component (WidgetHFRadars)
      // Set hash of active radars
      this.setHashValueAccordingToWidgetHFRadar();
    });

    // Data point selection
    window.eventBus.on('Map_ClickedDataPoint', () => this.isDataPointSelected = true);//{"dataPoint": closestDataPoint, "radar": selRadar});
    window.eventBus.on('DeselectedDataPoint', () => this.isDataPointSelected = false);
    // Mouse events
    // Mouse move in map
    window.eventBus.on('Map_mouseMove', screenPosCoords => this.mouseMoveInMap(screenPosCoords));



  }



  // INTERNAL

  // TIMESTAMP TMST
  setNewTmst(tmst) {
    let d = new Date(tmst);
    let isInvalid = isNaN(d.getTime());

    // Invalid date, 
    if (isInvalid) {
      if (tmst != undefined)
        console.warn('Invalid timestamp on URL, please use ISO standard i.e., TIME=2024-02-12T05:00:00.000Z');
    }
    // Outside of range
    else {
      let latestTmst = window.DataManager.latestDataTmst || new Date().toISOString();

      let latestDate = new Date(latestTmst);
      if (d < this.firstDate || d > latestDate) console.warn('Timestamp outside of range (before April 2023 or after current time now');
      // Set to last or first tmst
      if (d < this.firstDate) {
        tmst = this.firstDate.toISOString();
      }
      // Last date
      else if (d >= latestDate) {
        tmst = latestDate.toISOString();
      }
    }

    // Set default (now or previous)
    if (isInvalid) {
      let now = new Date();
      let str = now.toISOString();
      let nowISODate = str.substring(0, 14) + '00:00.000Z';

      if (tmst == undefined)
        this.currentTmst = window.DataManager.latestDataTmst || nowISODate;
      else
        this.currentTmst = this.currentTmst || nowISODate;
    }
    else {
      let formatedTmst = tmst.substring(0, 14) + '00:00.000Z';
      this.currentTmst = formatedTmst;
    }

    // If we are in the latest data value, remove hash
    if (this.currentTmst == window.DataManager.latestDataTmst) {
      window.location.removeHash('TIME');
    } else {
      window.location.setHashValue('TIME', this.currentTmst);
    }

  }

  // MAP
  // Input is a string
  setMapView(values) {
    let itemsIn = values.split(",");
    // Three values must be provided
    if (itemsIn.length == 3) {
      let isAnyNaN = itemsIn.some(el => isNaN(parseFloat(el)));
      if (!isAnyNaN)
        this.mapView = values;
    }

    window.location.setHashValue('VIEW', this.mapView);
  }


  // RADAR
  // Updates radar visibility variable according to hash string
  updateWidgetHFRadarAccordingToHash(radialsStr) {
    let rStr = radialsStr.toLowerCase();
    let radialsNames = rStr.split(",");
    Object.keys(this.widgetHFRadars.radarsVisible).forEach(rName => {
      if (radialsNames.includes(rName.toLowerCase())) {
        this.widgetHFRadars.radarsVisible[rName] = true;
      } else
        this.widgetHFRadars.radarsVisible[rName] = false;
    });
  };

  // Generate string according to radar variables
  setHashValueAccordingToWidgetHFRadar() {
    let str = '';
    Object.keys(this.widgetHFRadars.radarsVisible).forEach(rName => {
      if (this.widgetHFRadars.radarsVisible[rName]) {
        str += rName + ",";
      }
    });
    str = str.substring(0, str.length - 1); // Remove extra comma
    // If all radars are deactivated
    if (str == '') {
      this.radials = undefined;
      window.location.removeHash("RADIALS");
    } else {
      this.radials = str;
      window.location.setHashValue("RADIALS", this.radials);
    }

  }


  // TMST
  // Selected date changes
  selectedDateChanged(tmst) {
    // Set current timestamp
    this.currentTmst = tmst;
    // Get radars on that date
    this.currentRadars = window.DataManager.getRadarsDataOn(this.currentTmst);
    // Set URL config
    // If we are in the latest data value, remove hash
    if (this.currentTmst == window.DataManager.latestDataTmst) {
      window.location.removeHash('TIME');
    } else
      window.location.setHashValue('TIME', this.currentTmst);
  }


  // AUTO UPDATE - Active sync
  activeSyncRadarData() {
    if (this.activeSync == false) {
      if (this.activeSyncLoopOn == false) { debugger; }// Trying to stop a loop that was already stop (double initialization of loop)
      return
    }
    let minDiff = (new Date().getTime() - new Date(window.DataManager.latestDataTmst).getTime()) / (1000 * 60);

    let latestDate = new Date(window.DataManager.latestDataTmst);

    let startDate;
    // Recent file exists but maybe needs to be updated
    if (minDiff < this.minCouldFileChanged)
      startDate = latestDate;
    // Request for new files by adding one hour to the latest timestamp
    else
      startDate = new Date(latestDate.setUTCHours(latestDate.getUTCHours() + 1)); // Add one hour to the latest hour
    let startTmst = startDate.toISOString();

    if (minDiff > this.minToCallFromLastData || minDiff < this.minCouldFileChanged) {
      // Force reload
      // But not the first time when opening the app
      if (this.firstReloadDone == undefined) {
        this.firstReloadDone = true;
      } else {
        // Force reload (FileManager uses this.activeSync to know if the urls need to be re-requested)
        console.log("Active sync - Requesting new files")
        // Load data
        window.DataManager.loadStaticFilesRepository(startTmst, new Date().toISOString(), ['tuv']).then(hfRadar => {
          if (hfRadar != undefined) {
            window.eventBus.emit('HFRadarDataLoaded', window.DataManager.latestDataTmst);
          }
          // Load wave files (and radials if required)
          let fileTypes = ['wls'];
          // Load radials if required
          if (widgetHFRadars.isVisible)
            fileTypes.push('ruv');
          // Load files  
          window.DataManager.loadStaticFilesRepository(startTmst, new Date().toISOString(), fileTypes);
        });
      }

      // Loop - Set timeout
      if (this.activeSync) {
        this.activeSyncLoopOn = true;
        setTimeout(() => this.activeSyncRadarData(), this.minBetweenCalls * 60 * 1000);
      } else {
        if (this.activeSyncLoopOn == false) {
          debugger;
          // Trying to stop a loop that was already stop (double initialization of loop)
        }
        this.activeSyncLoopOn = false;
      }
    }
  }


  // Mouse is moving in map
  mouseMoveInMap(screenPosCoords) {
    //debugger;
    // Particles are visible and no point is selected
    if (this.widgetCombinedRadars.isVisible && this.widgetCombinedRadars.areParticlesVisible && !this.isDataPointSelected) {
      // Get combined radar
      let combinedRadar;
      let radars = this.currentRadars || window.DataManager.getRadarsDataOn(this.currentTmst);
      if (radars.length != 0) {
        for (let i = 0; i < radars.length; i++) {
          let HFRadar = radars[i];
          if (HFRadar.constructor.name == 'CombinedRadars') {
            combinedRadar = HFRadar;
          }
        }
      }
      // Get value and send it
      if (combinedRadar !== undefined) {
        let value = this.tempArray;
        combinedRadar.getValueAtTmstLongLat(this.currentTmst, screenPosCoords[2], screenPosCoords[3], value);

        window.eventBus.emit('GUIManager_MouseMovingCurrentsValue', value);

      }
    }

  }


}

export default GUIManager;