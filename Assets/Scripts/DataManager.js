// Import classes
import {HFRadar, CombinedRadars} from './HFRadarClass.js';
import { GeoJSONWrapper } from './GeoJSONWrapperClass.js';

// Static files sample
const firstDate = new Date('2023-01-26T06:00Z');
const lastDate = new Date('2023-02-02T06:00Z');
const DAYSTOLOAD = 3;
const SEARCHHOURS = 24*14;

// Data manager class
class DataManager {

  HFRadars = {};
  geoJSONWrappers = {};
  //https://ows.emodnet-bathymetry.eu/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng8&TRANSPARENT=true&LAYERS=emodnet:mean_2016&TILED=TRUE&WIDTH=2048&HEIGHT=2048&CRS=EPSG%3A4326&STYLES=&BBOX=39.8,0,43,5
  // EPSG 3857 projection works better
  //https://ows.emodnet-bathymetry.eu/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng8&TRANSPARENT=true&LAYERS=emodnet:mean_2016&TILED=TRUE&WIDTH=2048&HEIGHT=2048&CRS=EPSG%3A3857&STYLES=&BBOX=0.0%2C4836921.25%2C556597.45%2C5311971.85
  LANDMAKSURL = './Assets/Images/LandMask_0_39.8_5_43.png';
  LANDMASKBBOX = [0.0, 4836921.25, 556597.45, 5311971.85];// [0, 39.8, 5, 43];
  

  constructor(){
    // EVENT LISTENERS

    // This event can be called from this class, from FileManager.js or AppManager.vue
    window.eventBus.on('HFRadarDataLoaded', () => {
      // Update data availability
      this.updateHourlyDataAvailability();
      window.eventBus.emit('DataManager_DataAvailabilityUpdated');
    });
    // User clicked on data streams bar
    window.eventBus.on('DataStreamsBar_SelectedDateChanged', tmst => {
      this.loadOnInteraction(tmst);
    });
    // User changed TMST hash on the URL
    window.eventBus.on('GUIManager_URLDateChanged', tmst => {
      this.loadOnInteraction(tmst);
    });
    
    // User clicked to view radials
    window.eventBus.on("WidgetHFRadars_VisibilityChanged", radialsVisible => {
      if (radialsVisible)
        this.loadOnInteraction(window.GUIManager.currentTmst);
    });


    // Status
    this.pendingRequests = 0;


    // Load data availability
    if (window.FileManager){
      this.pendingRequests++;
      window.eventBus.emit("DataManager_pendingRequestsChange", this.pendingRequests);
      window.FileManager.loadDataAvailability()
        .then(r => {
          this.pendingRequests--;
          window.eventBus.emit("DataManager_pendingRequestsChange", this.pendingRequests);
          this.hourlyDataAvailability = r;
          this.generateDailyDataAvailability(r);
          window.eventBus.emit('DataManager_HourlyDataAvailabilityLoaded');
        })
        .catch(e => {throw e})
    }

    // Load land mask
    this.loadLandMask();
  }


  // INTERNAL METHODS
  addHFRadarData(HFRadarData){

    
    // // Combined files do not have PatternUUID. Some radials do not have PatternUUID
    // if (HFRadarData.header.PatternUUID == undefined){
    //   HFRadarData.header.PatternUUID = 'noUUID' + HFRadarData.header.Site;
    // }
    // Find UUID
    //let UUID = HFRadarData.header.PatternUUID.replaceAll(" ", "");
    // UUID does not work for wave data, it seems maybe using the site is better as ID
    let site = HFRadarData.header.Site.replace(' ""', '').replaceAll(" ", "").replaceAll("\r", "");
    let UUID = site;

    // Empty data
    if (HFRadarData.data.length == 0){
      console.log("Radar " + HFRadarData.header.Site + " does not contain data.");
      return;
    }

    // Combined radar data (tots)
    if (HFRadarData.header.FileType.includes('tots')){
      if (this.HFRadars[UUID] != undefined){
        this.HFRadars[UUID].addRadarData(HFRadarData);
      } else {
        console.log("New combined currents! Site: " + HFRadarData.header.Site);
        // Create combined
        let tots = new CombinedRadars(HFRadarData);
        this.HFRadars[UUID] = tots;
      }
      // Store latest datastamp of currents
      let radarTmst = this.HFRadars[UUID].getTimestamp(HFRadarData);
      let latestDataTmst = window.DataManager.latestDataTmst;
      window.DataManager.latestDataTmst = latestDataTmst == undefined ? radarTmst : new Date(radarTmst) > new Date(latestDataTmst) ? radarTmst : latestDataTmst;

      return this.HFRadars[UUID];
    }


    
    // HFRadar exists
    if (this.HFRadars[UUID] != undefined){
      this.HFRadars[UUID].addRadarData(HFRadarData);
    } else {
      console.log("New Radar! Site: " + HFRadarData.header.Site);
      // Create HFRadar
      let hFRadar = new HFRadar(HFRadarData);
      this.HFRadars[UUID] = hFRadar;
    }
    return this.HFRadars[UUID];
  }

  // Calculate if there is data on a day
  generateDailyDataAvailability(hourlyDataAvailability){
    // Iterate hourly data
    this.dailyDataAvailability = {};
    Object.keys(hourlyDataAvailability).forEach(tmst => {
      // Current availability for that hour
      let hourlyAvail = hourlyDataAvailability[tmst];
      // Use the date without time
      let date = tmst.substring(0,10);
      // If it does not exist, create
      if (!this.dailyDataAvailability[date]){
        this.dailyDataAvailability[date] = hourlyAvail; // TODO: if hourly has more info (now has only CREU: 'true', BEGU: 'true'...), this could be more complex
      }
      // If it exist, check that all are present
      else {
        // Compare keys in daily and hourly
        // Iterate daily
        Object.keys(hourlyAvail).forEach(radarName => {
          if (Object.keys(this.dailyDataAvailability[date]).includes(radarName) == false){
            // Assign unregistered radar to dailyData
            this.dailyDataAvailability[date][radarName] = hourlyAvail[radarName];
          }
        })
      }
    }) // end of forEach
  }

  // When new radar data is loaded, update the data availability
  updateHourlyDataAvailability(){
    // Iterate radars
    Object.keys(this.HFRadars).forEach(key => {
      let HFRadar = this.HFRadars[key];
      let data = HFRadar.data;// || HFRadar.waveHourlyData;
      let site = HFRadar.header.Site.replace(' ""', '').replaceAll(" ", "").replaceAll("\r", "");
      // Iterate timestamps
      if (data != undefined){
        Object.keys(data).forEach(tmst => {
          tmst = tmst.substring(0,13) + 'Z';
          // If it does not exist, create
          if (this.hourlyDataAvailability[tmst] == undefined){
            this.hourlyDataAvailability[tmst] = {};
          }
          // Add site
          this.hourlyDataAvailability[tmst][site] = 2;
        });
      }
    });
    // TODO: optimize
    this.generateDailyDataAvailability(this.hourlyDataAvailability);
  }



  // Checks if to load data when the user or the app interacts with the interface
  loadOnInteraction(tmst, fileTypes){
    // HACK: If no timestamp is defined, it is called from Active Sync button. Otherwise user clicked somewhere else
    // This hack is related to a problem encountered with order of the events. Active Sync is turned off, but this happens
    // after loadOnInteraction is called, therefore all the files are reloaded and data is overwritten. To avoid this,
    // force the calling of loadOnInteraction from TopRightMenu.vue to be different from the rest, i.e. without tmst.
    if (tmst == undefined)
      tmst = new Date().toISOString();
    else
      window.GUIManager.activeSync = false;
    // End of hack
    
    // Decide if to load radials according to the GUIManager
    fileTypes = fileTypes || ['tuv', 'wls'];
    if (GUIManager.isAdvancedInterface){
      if (GUIManager.widgetHFRadars.isVisible){
        fileTypes.push('ruv');
      }
    }
    // First load current file
    this.loadStaticFilesRepository(tmst, tmst, fileTypes).then(hfRadar => {
      if (hfRadar != undefined){
        window.eventBus.emit('HFRadarDataLoaded', hfRadar.lastLoadedTimestamp);
      }
    });

    let sD = new Date(tmst);
    let eD = new Date(tmst);
    // When playing forward or backward, this function is called. Maybe need to recheck data availability. Also write if the file is being loaded
    // TODO HERE
    sD.setUTCDate(sD.getUTCDate() - 1);
    // Limit end date to current time
    eD.setUTCDate(eD.getUTCDate() + 1);
    eD = Math.min(new Date(), eD);

    // Iterate dates
    let arrayDates = [];
    let movingDate = new Date(sD.toISOString());
    while (movingDate < eD){
      // Check if the date exists or is already loaded
      // let key = movingDate.toISOString().substring(0,13) + 'Z';
      // // Data exists on date
      // if (this.hourlyDataAvailability[key] != undefined){
      //   // Radar files are not loaded
      //   let keys = Object.keys(this.hourlyDataAvailability[key]);
      //   if (this.hourlyDataAvailability[key][keys[0]] == true){
      //     arrayDates.push(movingDate.toISOString());
      //     // Set the state to loading
      //     Object.keys(this.hourlyDataAvailability[key]).forEach(kk => {
      //       this.hourlyDataAvailability[key][kk] = 3;
      //     });
      //   }
      // }

      // Add 1h
      arrayDates.push(movingDate.toISOString());
      movingDate.setUTCHours(movingDate.getUTCHours() + 1);

    }
    

    return this.loadDatedStaticFilesRepository(arrayDates, fileTypes).then(hfRadar => {
      if (hfRadar != undefined)
        window.eventBus.emit('HFRadarDataLoaded');
      return hfRadar;  
    });
      

    // // Use web worker to load the rest of the files
    // if (window.DataWorker){
    //   window.DataWorker.postMessage(['loadStaticFilesRepository', [sD.toISOString(), eD.toISOString()]]);
    // } 
    // // Fallback option
    // else {
    //   window.DataManager.loadStaticFilesRepository(sD.toISOString(), eD.toISOString()).then((hfRadar) => {
    //   if (hfRadar != undefined)
    //     window.eventBus.emit('HFRadarDataLoaded');
    //   });
    // }
  }


  // Load land mask
  loadLandMask(){
    // Mask from 0-5 lon, 38.5-43 lat
    //https://ows.emodnet-bathymetry.eu/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng8&TRANSPARENT=true&LAYERS=emodnet:mean_2016&TILED=TRUE&WIDTH=2048&HEIGHT=2048&CRS=EPSG%3A3857&STYLES=&BBOX=0.0%2C4836921.25%2C556597.45%2C5311971.85
    let img = new Image();
    img.src = this.LANDMAKSURL;
    img.onload = () => {
      // Create canvas and get image data
      let canvas = document.createElement('canvas');
      let ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      // Flip image and draw
      //ctx.scale(1,-1);
      ctx.drawImage(img, 0, 0);//-canvas.height);
      // Get data
      this.landMask = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    img.onerror = (e) => console.error(e);
  }





  // PUBLIC METHODS
  // Get data availability
  getHourlyDataAvailability(){
    // Load data
    if (!this.hourlyDataAvailability){
      debugger;
      return false;
    }
    
    return this.hourlyDataAvailability;   
  }

  getDailyDataAvailability(){
    if (!this.dailyDataAvailability){
      debugger;
      return false;
    }

    return this.dailyDataAvailability;
  }

  // Returns and array with radar data available on a specific date
  getRadarsDataOn(timestamp){
    let radarsData = [];
    let keys = Object.keys(this.HFRadars);
    for (let i = 0; i < keys.length; i++){
      let radar = this.HFRadars[keys[i]];
      if (radar.data){
        if (radar.data[timestamp] != undefined){
        
          radar.currentData = radar.data[timestamp];
          
          radarsData.push(radar);
        } else
          radar.currentData = "undefined";
      }
    }
     return radarsData;
  }

  // Get start and end dates of loaded data
  getStartEndDatesTotals(){
    let startDate = new Date();
    let endDate = new Date(1970);
    let combinedRadarsExists = false;
    // Iterate radars to find latest and earliest dates
    let keys = Object.keys(this.HFRadars);
    for (let i = 0; i < keys.length; i++){
      let radar = this.HFRadars[keys[i]];
      if (radar.constructor.name == 'CombinedRadars'){
        combinedRadarsExists = true;
        Object.keys(radar.data).forEach(tmst => {
          if (new Date(tmst) < startDate)
            startDate = new Date(tmst);
          if (new Date(tmst) > endDate )
            endDate = new Date(tmst);
        });
      }
    }

    if (!combinedRadarsExists)
      return undefined;

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }
  }




  // Evaluate if there is land or not
  isThereLand(lon, lat){ // EPSG:3857
    if (this.landMask == undefined)
      return false;
    let landMask = this.landMask;
    let bbox = this.LANDMASKBBOX;

    // Get indices
    let lonRange = bbox[2] - bbox[0];
    let latRange = bbox[3] - bbox[1];
    let indexLon = (lon - bbox[0]) / lonRange;
    let indexLat = (lat - bbox[1]) / latRange;
    indexLat = 1 - indexLat;

    // If outside the box, return false
    if (indexLon < 0 || indexLon > 1 || indexLat < 0 || indexLat > 1)
      return "Outside bounds";

    // Find value in image data
    let index = Math.floor(indexLat * landMask.height) * landMask.width + Math.floor(indexLon * landMask.width);
    let alphaValue = landMask.data[index * 4 + 3];
    if (alphaValue < 255)
      return true
    else 
      return false
  }







  // Tries to load the most recent file by using the current date and searching backwards until a file is found. Returns a HFRadar.
  // File types are the kind of files to load: ['tuv','ruv','wls'] --> currents, radials, waves
  async loadLatestStaticFilesRepository(fileTypes){
    // Hourly
    let now = new Date();
    let str = now.toISOString();
    let nowISODate = str.substring(0, 14) + '00:00.000Z';
    now = new Date(nowISODate);
    // Reduce 1 hour
    now.setUTCHours(now.getUTCHours() - 1); // Most recent data is from 1h ago. Currents are calculated with +1h, 0h, -1h files, thus there is a delay of 1h always.
    let lastDate = now.toISOString();
    // Petition latest dataset
    let hfRadar = await this.loadStaticFilesRepository(lastDate, lastDate, fileTypes);

    if (hfRadar != undefined)
      return hfRadar;

    // If current does not exist, try one hour before repeateadly
    let counter = 0;
    while (hfRadar == undefined && counter <= SEARCHHOURS) {
      // Reduce time one hour
      now.setUTCHours(now.getUTCHours() - 1);
      counter++;
      hfRadar = await this.loadStaticFilesRepository(now.toISOString(), now.toISOString(), fileTypes);
    }

    if (hfRadar != undefined)
      console.log('Data is delayed by ' + counter + ' hours.');
    else
      console.log('Data is delayed by more than '+ (SEARCHHOURS) +' hours.');

    // Only assign latest date if it is actually the latest
    if (this.latestDataTmst != undefined && hfRadar != undefined){
      if (new Date(this.latestDataTmst) < new Date(hfRadar.lastLoadedTimestamp) && hfRadar.constructor.name == "CombinedRadars"){
        this.latestDataTmst = hfRadar.lastLoadedTimestamp;
      }
    } else if (hfRadar != undefined){
      if (hfRadar.constructor.name == "CombinedRadars")
        this.latestDataTmst = hfRadar.lastLoadedTimestamp;
    } else {
      // Load backup file with some date that is never removed
      hfRadar = await this.loadDemoData();
    }

    

    return hfRadar;
  }

  // Load files from a repository given a start and ending dates. Returns a promise
  // File types are the kind of files to load: ['tuv','ruv','wls'] --> currents, radials, waves
  loadStaticFilesRepository(startDate, endDate, fileTypes){
    this.pendingRequests++;
    window.eventBus.emit("DataManager_pendingRequestsChange", this.pendingRequests);

    // Find dates
    let now = new Date();
    let str = now.toISOString();
    let nowISODate = str.substring(0, 14) + '00:00.000Z';
    now = new Date(nowISODate);

    let movingDate;
    if (startDate == undefined){
      movingDate = endDate == undefined ? new Date(nowISODate) : new Date(endDate);
      movingDate.setDate(movingDate.getDate() - DAYSTOLOAD); // Days before
    } 
    // If a period is specified
    else {
      movingDate = new Date(startDate);
    }
    // If a period is specified
    if (endDate != undefined){
      now = new Date(endDate);
    }

    // Array of promises
    let promises = [];
    while(movingDate <= now){
      promises.push(window.FileManager.loadDataFromRepository(movingDate.toISOString(), fileTypes));
      // Add 1h
      movingDate.setUTCHours(movingDate.getUTCHours() + 1);
    }

    let lastHFRadar;
    // Resolve promises
    return Promise.allSettled(promises).then(values => {
      for (let i = 0; i < values.length; i++){
        let filesOnDatePromiseResult = values[i];
        // If promise was fullfiled (I think always)
        if (filesOnDatePromiseResult.status == 'fulfilled'){
          
          for (let j = 0; j < filesOnDatePromiseResult.value.length; j++){
            let promiseResult = filesOnDatePromiseResult.value[j];
            if (promiseResult.status == 'fulfilled' && promiseResult.value != undefined){
              lastHFRadar = this.addHFRadarData(promiseResult.value);
            }
          }
        }
      }

      this.pendingRequests--;
      window.eventBus.emit("DataManager_pendingRequestsChange", this.pendingRequests);

      return lastHFRadar;
    })

  }

  // Given an array of dates (ISOString), load those dates. Returns a promise
  // File types are the kind of files to load: ['tuv','ruv','wls'] --> currents, radials, waves
  loadDatedStaticFilesRepository(arrayDates, fileTypes){
    this.pendingRequests++;
    window.eventBus.emit("DataManager_pendingRequestsChange", this.pendingRequests);

    // Array of promises
    let promises = [];
    for (let i = 0; i < arrayDates.length; i++) {
      promises.push(window.FileManager.loadDataFromRepository(arrayDates[i], fileTypes));
    }

    let lastHFRadar;
    // Resolve promises
    return Promise.allSettled(promises).then(values => {
      for (let i = 0; i < values.length; i++){
        let filesOnDatePromiseResult = values[i];
        // If promise was fullfiled (I think always)
        if (filesOnDatePromiseResult.status == 'fulfilled'){
          for (let j = 0; j < filesOnDatePromiseResult.value.length; j++){
            let promiseResult = filesOnDatePromiseResult.value[j];
            if (promiseResult.status == 'fulfilled'){
              
              lastHFRadar = this.addHFRadarData(promiseResult.value);             
            }
          }
        }
      }

      this.pendingRequests--;
      window.eventBus.emit("DataManager_pendingRequestsChange", this.pendingRequests);

      return lastHFRadar;
    })
  }





  // Load files that were dropped
  loadDroppedFiles(files){
    console.log(files.length + " files dropped.");
    let promisesHFFiles = [];
    let promisesGeoJSON = [];
    // Iterate files
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        let fileExtension = file.name.split('.').pop().toLowerCase();
        // Read files
        if (fileExtension == 'wls' || fileExtension == 'tuv' || fileExtension == 'ruv')
          promisesHFFiles.push(window.FileManager.readFile(file));
        else if (fileExtension == 'geojson')
          promisesGeoJSON.push(window.FileManager.readFile(file, fileExtension))
    }

    // HF files
    Promise.all(promisesHFFiles).then(values => {
      if (values.length == 0)
        return;
      let lastHFRadar;
      for (let i = 0; i < values.length; i++){
        lastHFRadar = this.addHFRadarData(values[i]);
      }
      window.eventBus.emit('HFRadarDataLoaded', lastHFRadar.lastLoadedTimestamp);
    }); 
    // Geojson files
    Promise.all(promisesGeoJSON).then(values => {
      if (values.length == 0)
        return;
      let lastReceived;
      for (let i = 0; i < values.length; i++){
        lastReceived = new GeoJSONWrapper(values[i]);
        let fileName = lastReceived.fileName;
        this.geoJSONWrappers[fileName] = lastReceived;
      }
      window.eventBus.emit('GeoJSONDataLoaded', lastReceived);
    });
  }




  // Load demo data when the pipeline is broken and there is no recent data
  loadDemoData(){
    this.pendingRequests++;
    window.eventBus.emit("DataManager_pendingRequestsChange", this.pendingRequests);

    // Array of promises
    let promises = [];
    promises.push(window.FileManager.loadDemoData());
    

    let lastHFRadar;
    // Resolve promises
    return Promise.allSettled(promises).then(values => {
      for (let i = 0; i < values.length; i++){
        let filesOnDatePromiseResult = values[i];
        // If promise was fullfiled (I think always)
        if (filesOnDatePromiseResult.status == 'fulfilled'){
          for (let j = 0; j < filesOnDatePromiseResult.value.length; j++){
            let promiseResult = filesOnDatePromiseResult.value[j];
            if (promiseResult.status == 'fulfilled'){
              lastHFRadar = this.addHFRadarData(promiseResult.value);             
            }
          }
        }
      }

      this.pendingRequests--;
      window.eventBus.emit("DataManager_pendingRequestsChange", this.pendingRequests);

      return lastHFRadar;
    })
  }



// End of class
}

















export default DataManager
