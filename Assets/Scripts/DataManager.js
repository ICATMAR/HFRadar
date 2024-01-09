// Static files sample
const firstDate = new Date('2023-01-26T06:00Z');
const lastDate = new Date('2023-02-02T06:00Z');
const DAYSTOLOAD = 3;
const SEARCHHOURS = 24*7;

// Data manager class
class DataManager {

  HFRadars = {};
    // https://ows.emodnet-bathymetry.eu/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng8&TRANSPARENT=true&LAYERS=emodnet:mean_2016&TILED=TRUE&WIDTH=2048&HEIGHT=2048&CRS=EPSG%3A3857&STYLES=&BBOX=0.0%2C4836921.25%2C556597.45%2C5311971.85
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


    // Status
    this.isLoading = false;


    // Load data availability
    if (window.FileManager){
      this.isLoading = true;
      window.FileManager.loadDataAvailability()
        .then(r => {
          this.isLoading = false;
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
      let data = HFRadar.data || HFRadar.waveHourlyData;
      let site = HFRadar.header.Site.replace(' ""', '').replaceAll(" ", "").replaceAll("\r", "");
      // Iterate timestamps
      Object.keys(data).forEach(tmst => {
        tmst = tmst.substring(0,13) + 'Z';
        // If it does not exist, create
        if (this.hourlyDataAvailability[tmst] == undefined){
          this.hourlyDataAvailability[tmst] = {};
        }
        // Add site
        this.hourlyDataAvailability[tmst][site] = 2;
      })
    });
    // TODO: optimize
    this.generateDailyDataAvailability(this.hourlyDataAvailability);
  }



  // Checks if to load data when the user or the app interacts with the interface
  loadOnInteraction(tmst){
    // Check if data is loaded, otherwise load
    let key = tmst.substring(0,13) + 'Z';
    // No data exists on that date
    if (this.hourlyDataAvailability[key] == undefined)
      return;
    // Data exists and its loaded
    let keys = Object.keys(this.hourlyDataAvailability[key]);
    if (this.hourlyDataAvailability[key][keys[0]] == 2)
      return;
    // Data is currently being loaded
    if (this.hourlyDataAvailability[key][keys[0]] == 3)
      return;
    // First load current file
    this.loadStaticFilesRepository(tmst, tmst).then(hfRadar => {
      if (hfRadar != undefined){
        window.eventBus.emit('HFRadarDataLoaded', hfRadar.lastLoadedTimestamp);
      }
    });

    let sD = new Date(tmst);
    let eD = new Date(tmst);
    // When playing forward or backward, this function is called. Maybe need to recheck data availability. Also write if the file is being loaded
    // TODO HERE
    sD.setUTCDate(sD.getUTCDate() - 1);
    eD.setUTCDate(eD.getUTCDate() + 1);

    // Iterate dates
    let arrayDates = [];
    let movingDate = new Date(sD.toISOString());
    while (movingDate < eD){
      // Check if the date exists or is already loaded
      let key = movingDate.toISOString().substring(0,13) + 'Z';
      // Data exists on date
      if (this.hourlyDataAvailability[key] != undefined){
        // Radar files are not loaded
        let keys = Object.keys(this.hourlyDataAvailability[key]);
        if (this.hourlyDataAvailability[key][keys[0]] == true){
          arrayDates.push(movingDate.toISOString());
          // Set the state to loading
          Object.keys(this.hourlyDataAvailability[key]).forEach(kk => {
            this.hourlyDataAvailability[key][kk] = 3;
          });
        }
      }

      // Add 1h
      movingDate.setUTCHours(movingDate.getUTCHours() + 1);

    }
    
    if (arrayDates.length != 0){
      this.isLoading = true;
    }

    this.loadDatedStaticFilesRepository(arrayDates).then(hfRadar => {
      this.isLoading = false;
      if (hfRadar != undefined)
        window.eventBus.emit('HFRadarDataLoaded'); });

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
  async loadLatestStaticFilesRepository(){
    // Hourly
    let now = new Date();
    let str = now.toISOString();
    let nowISODate = str.substring(0, 14) + '00:00.000Z';
    now = new Date(nowISODate);
    // Reduce 1 hour
    now.setUTCHours(now.getUTCHours() - 1); // Most recent data is from 1h ago. Currents are calculated with +1h, 0h, -1h files, thus there is a delay of 1h always.
    let lastDate = now.toISOString();
    // Petition latest dataset
    let hfRadar = await this.loadStaticFilesRepository(lastDate, lastDate);

    if (hfRadar != undefined)
      return hfRadar;

    // If current does not exist, try one hour before repeateadly
    let counter = 0;
    while (hfRadar == undefined && counter <= SEARCHHOURS) {
      // Reduce time one hour
      now.setUTCHours(now.getUTCHours() - 1);
      counter++;
      hfRadar = await this.loadStaticFilesRepository(now.toISOString(), now.toISOString());
    }

    if (hfRadar != undefined)
      console.log('Data is delayed by ' + counter + ' hours.');
    else
      console.log('Data is delayed by more than 25 hours.');

    return hfRadar;
  }

  // Load files from a repository given a start and ending dates. Returns a promise
  loadStaticFilesRepository(startDate, endDate){
    
    // Find dates
    let now = new Date();
    let str = now.toISOString();
    let nowISODate = str.substring(0, 14) + '00:00.000Z';
    now = new Date(nowISODate);

    let movingDate;
    if (startDate == undefined){
      movingDate = new Date(nowISODate);
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
      promises.push(window.FileManager.loadDataFromRepository(movingDate.toISOString()));
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
              if (lastHFRadar.data == undefined)
                lastHFRadar = undefined;
            }
          }
        }
      }

      return lastHFRadar;
    })

  }

  // Given an array of dates (ISOString), load those dates. Returns a promise
  loadDatedStaticFilesRepository(arrayDates){

    // Array of promises
    let promises = [];
    for (let i = 0; i < arrayDates.length; i++) {
      promises.push(window.FileManager.loadDataFromRepository(arrayDates[i]));
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
      return lastHFRadar;
    })
  }


  // Load static files
  loadStaticFiles(){
    // Create promises array
    let movingDate = new Date(firstDate.toISOString());
    let promises = [];
    while (movingDate <= lastDate){
      promises.push(window.FileManager.loadData(movingDate.toISOString()));
      // Add 1h
      movingDate.setUTCHours(movingDate.getUTCHours() + 1);
    }

    Promise.all(promises).then(values => {

      let lastHFRadar;
      for (let i = 0; i < values.length; i++){
        lastHFRadar = this.addHFRadarData(values[i]);
      }
      
      window.eventBus.emit('HFRadarDataLoaded', lastHFRadar.lastLoadedTimestamp);
    });
  }


  // Load files that were dropped
  loadDroppedFiles(files){
    console.log(files.length + " files dropped.");
    let promises = [];
    // Iterate files
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        // Read files
        promises.push(window.FileManager.readFile(file));
    }

    Promise.all(promises).then(values => {
      let lastHFRadar;
      for (let i = 0; i < values.length; i++){
        lastHFRadar = this.addHFRadarData(values[i]);
      }
      window.eventBus.emit('HFRadarDataLoaded', lastHFRadar.lastLoadedTimestamp);
    })
  }


// End of class
}















// HFRadar class (for data managing purposes)
class HFRadar {

  // data = {};
  // waveData = {};
  // waveDataHourly = {};
  // windData = {};
  headers = {}; // Headers contain some time information too
  images = {};

  // Legend
  legendRange = [-100, 100];


  constructor(HFRadarData){

    this.header = HFRadarData.header;

    // Define header
    let keys = Object.keys(HFRadarData.header)
    // TO FIX - IS THIS NECESSARY?
    for (let i = 0; i < keys.length; i++){
      let key = keys[i];
      // Fix Site string
      if (key == 'Site')
        HFRadarData.header[key] = HFRadarData.header[key].replace(' ""', '').replaceAll(" ", "").replaceAll("\r", "");
      if (HFRadarData.header[key] != undefined)
        this[key] = HFRadarData.header[key];
    }

    // UUID
    this.UUID = HFRadarData.header.Site; //HFRadarData.header.PatternUUID.replaceAll(" ", "");

    // Store data
    this.addRadarData(HFRadarData);

  }

  // PUBLIC METHODS
  // Ingest new data
  // Could use the HFRadarData.header.UUID to identify the files. Timestamp works better for accessibility.
  addRadarData(HFRadarData){

    // Process wave history data
    if (HFRadarData.header.FileType.includes('Wave')){
      this.waveData = this.waveData || {};
      this.windData = this.windData || {};
      for (let i = 0; i < HFRadarData.data.length; i++){
        let wData = HFRadarData.data[i];
        if (wData.MWHT != "999.00"){
          this.waveData[wData.TMST] = wData;
        }
        this.windData[wData.TMST] = wData;
      }
      // TODO: calculate hourly wave and wind data
      // Hourly data
      this.waveHourlyData = this.waveHourlyData || {};
      this.windHourlyData = this.windHourlyData || {};
      let sDate = new Date(HFRadarData.data[0].TMST);
      let eDate = new Date(HFRadarData.data[HFRadarData.data.length-1].TMST);
      let movingDate = new Date(sDate.getTime());
      movingDate.setUTCHours(0);
      movingDate.setUTCMinutes(0);
      // 10 min interval
      let num10minSteps = Math.ceil((eDate.getTime() - movingDate.getTime()) / (1000 * 60 * 10)); // Wave data is collected every 10 min
      let waveCount = 0;
      let windCount = 0;
      let wHeights = [];
      let wPeriods = [];
      let wBearings = [];
      let windBearings = [];
      let sources = [];
      // Helper function to calculate average angle and stds
      const avgBearings = function(bearings){
        let sumSin = bearings.reduce((sum, value) => sum + Math.sin(value * Math.PI/180), 0);
        let sumCos = bearings.reduce((sum, value) => sum + Math.cos(value * Math.PI/180), 0);
        let bearing = (Math.atan2(sumSin/bearings.length, sumCos/bearings.length) * 180 / Math.PI);
        if (bearing < 0)
          bearing += 360;
        return bearing;
      }
      // TODO STD
      // TODO ANGLE STD https://en.wikipedia.org/wiki/Directional_statistics#Standard_deviation
      // Interate in 10 min intervals
      for (let i = 0; i < num10minSteps; i++){
        if (movingDate.getUTCMinutes() == 40){
          let tmst = movingDate.toISOString().substring(0, 14) + "00:00.000Z";
          // Wave parameters
          if (waveCount != 0){
            // Calculate parameters
            let heightMean = wHeights.reduce((sum, value) => sum + value, 0) / waveCount;
            let periodMean = wPeriods.reduce((sum, value) => sum + value, 0) / waveCount;
            let bearingMean = avgBearings(wBearings);           
            // TODO: RANGE CELLS
            // TODO: STD
            this.waveHourlyData[tmst] = {
              "MWHT": heightMean,
              "MWPD": periodMean,
              "WAVB": bearingMean,
              "TMST": tmst,
              "N": waveCount,
              sources,
            };
          }
          // Wind parameters
          if (windCount != 0){
            let windBearingMean = avgBearings(windBearings);
            this.windHourlyData[tmst] = {
              "WNDB": windBearingMean,
              "TMST": tmst,
              "N": windCount,
              sources,
            }
          }
          
          // Reset
          waveCount = 0;
          windCount = 0;
          wHeights = [];
          wPeriods = [];
          wBearings = [];
          windBearings = [];
          sources = [];
        }


        // Keep values for averaging
        let wvData = this.waveData[movingDate.toISOString()];
        let wdData = this.windData[movingDate.toISOString()];
        // Missing date
        if (wvData != undefined){
           // If wave data exists
          if (wvData["MWHT"] != "999.00"){
            wHeights.push(1 * wvData["MWHT"]);
            wPeriods.push(1 * wvData["MWPD"]);
            wBearings.push(1 * wvData["WAVB"])
            waveCount++;
          }
        }
        if (wdData != undefined){
          // Wind data (always exist?)
          if (wdData["WNDB"] != "999.00"){
            windBearings.push(1 * wdData["WNDB"]);
            windCount++;
          }
        }
          
       
        sources.push(wvData || wdData);
        // Increase time stamp
        movingDate.setUTCMinutes(movingDate.getUTCMinutes() + 10);

      }

      return;
    }
    
    // Process radar data
    this.data = this.data || {};
    // Get timestamp
    let timestamp = this.getTimestamp(HFRadarData);

    // Check if timestamp already exists
    if (this.data[timestamp] != undefined) 
      console.warn ("Overwritting. HFRadar: " + HFRadarData.header.Site + " on timestamp: " + timestamp);

    // Store data
    this.data[timestamp] = HFRadarData.data;
    // Store header too
    this.headers[timestamp] = HFRadarData.header;

    // Store latest data timestamp
    this.lastLoadedTimestamp = timestamp;

    // Create data features
    this.updateDataPointFeatures(HFRadarData.data);
  }


  // Update and create data features
  updateDataPointFeatures(dataPoints){
    
    // Create data point features
    if (this.dataPointFeatures == undefined){
      this.dataPointFeatures = {};
    }
    
    // Iterate data points
    for (let i = 0; i < dataPoints.length; i++){
      let dataPoint = dataPoints[i];
      // Iterate features
      Object.keys(dataPoint).forEach(key => {
        let value = dataPoint[key];
        // Create feature if it does not exist
        if (this.dataPointFeatures[key] == undefined){
          this.dataPointFeatures[key] = {
            "max": value,
            "min": value,
            // TODO: HERE COULD BE CUSTOM VISUALIZATION OPTIONS SPECIFIC FOR EACH FEATURE
          }
        }
        // Calculate range (max min)
        if (value > this.dataPointFeatures[key].max)
          this.dataPointFeatures[key].max = value;
        if (value < this.dataPointFeatures[key].min)
          this.dataPointFeatures[key].min = value;

      });
    }

  }



  getRadarOrigin(){
    let locationStr = this.header.Origin;
    let location = locationStr.trim().replace(/\s\s+/g, ',').replace('\r', '').split(',');
    location = location.slice(0,2).reverse();
    location[0] = parseFloat(location[0]);
    location[1] = parseFloat(location[1]);
    return location;
  }

  getTimestamp(HFRadarData){
    // Get timestamp
    let tmst = HFRadarData.header.TimeStamp;
    let ttRaw = tmst.split(" ");
    let tt = [];
    for (let i = 0; i < ttRaw.length; i++){
      if (ttRaw[i].length != 0) tt.push(ttRaw[i]);
    }
    let dd = new Date(tt[0] +"-"+ tt[1]+"-"+ tt[2]+"T"+ tt[3]+":"+ tt[4]+ 'Z');
    return dd.toISOString();
  }


  getLegendRange(){
    return this.legendRange;
  }
}




















class CombinedRadars extends HFRadar {

  dataGrid = {};
  legendRange = [0, 100];

  constructor (CombinedRadarData){
    
    super(CombinedRadarData);
    this.addRadarData(CombinedRadarData, 100, 200); // Consider using power of two numbers to create image and upsample later
  }


  addRadarData(CombinedRadarData, resolutionLong, resolutionLat){
    if (this.dataGrid == undefined)
     this.dataGrid = {};
    if (this.data == undefined)
      this.data = {};


    // Get timestamp
    let timestamp = this.getTimestamp(CombinedRadarData);

    // Store data grid
    if (this.dataGrid[timestamp]){
      console.log("Overwritting data grid");
    }
    this.data[timestamp] = CombinedRadarData.data;
    // Store header too
    this.headers[timestamp] = CombinedRadarData.header;




    let data = CombinedRadarData.data;
    
    // Calculate range
    let minLat = 999;
    let minLong = 999;
    let maxLat = -999;
    let maxLong = -999;

    let distances = [];
  
    for (let i = 0; i< data.length; i++){
      if (data[i]['Longitude (deg)'] > maxLong) maxLong = data[i]['Longitude (deg)'];
      if (data[i]['Longitude (deg)'] < minLong) minLong = data[i]['Longitude (deg)'];
      if (data[i]['Latitude (deg)'] > maxLat) maxLat = data[i]['Latitude (deg)'];
      if (data[i]['Latitude (deg)'] < minLat) minLat = data[i]['Latitude (deg)'];
      // Store distances (assuming that points are adjacent!)
      if (i< data.length -1) {
        distances.push( this.calcDistance( data[i]['Longitude (deg)'], data[i]['Latitude (deg)'],
                                         data[i+1]['Longitude (deg)'], data[i+1]['Latitude (deg)'] ));
      }
    }
    // Calculate distance between two adjacent points
    distances.sort();
    let distanceLimit = distances[Math.floor(distances.length/2)];

  
  
    // Margins
    maxLat += 0.013;
    minLat -= 0.013;
    maxLong += 0.017;
    minLong -= 0.017;
  
    let rangeLat = maxLat - minLat;
    let rangeLong = maxLong - minLong;

    let resLat = resolutionLat || 200;
    let resLong = resolutionLong || 100;
    let stepLat = rangeLat / resLat;
    let stepLong = rangeLong / resLong;


    // Create grid for fast look-up
    // TODO: make it regular for temporal animation?
    //console.log("min long-lat: " + minLong + ", " + minLat + "-- max long-lat: " + maxLong + ", " + maxLat);
    const MINLONG = 3.0;
    const MAXLONG = 4.5;
    const MINLAT = 41.0;
    const MAXLAT = 43.5;
    const GRIDRESOLUTION = Math.max(resLat, resLong)/10;
    let numCols = Math.round((MAXLONG - MINLONG) * GRIDRESOLUTION);
    let numRows = Math.round((MAXLAT - MINLAT) * GRIDRESOLUTION);
    let numGridCells = numCols * numRows;
    let grid = new Array(numGridCells); // TODO: PREALLOCATE MEMORY?
    // Fill grid with point indices
    for (let i = 0; i < data.length; i++){
      let long =  data[i]['Longitude (deg)'];
      let lat = data[i]['Latitude (deg)'];
      let colIndex = Math.floor((long - MINLONG) * GRIDRESOLUTION);
      let rowIndex = Math.floor((lat - MINLAT) * GRIDRESOLUTION);
      // Store grid indices of cells
      let gridCellIndex = rowIndex * numCols + colIndex; 
      if (grid[gridCellIndex] == undefined)
        grid[gridCellIndex] = [i];
      else
        grid[gridCellIndex].push(i);
    }
    

  
    // Create typed array
    let dataGrid = new Float32Array(resLat * resLong * 2);

    for (let ii = 0; ii < dataGrid.length / 2; ii++){

      let i = Math.floor( ii / resLong); // Lat index
      let j = ii % resLong; // Long index
      
      let long = minLong + j * stepLong;
      let lat = minLat + i * stepLat;
      // Transform to check land mask
      let coord = ol.proj.transform([long, lat], 'EPSG:4326', 'EPSG:3857');
      // If point is found in land, write as undefined and continue
      if (window.DataManager.isThereLand(...coord)){
        // Assign
        dataGrid[ii * 2] = undefined;
        dataGrid[ii * 2 + 1] = undefined;
        continue;
      }



      // Interpolation
      // Find four closest points using the grid
      let dataPointDistances = []; // TODO OPTIMIZE MEMORY
      let colIndex = Math.floor((long - MINLONG) * GRIDRESOLUTION);
      let rowIndex = Math.floor((lat - MINLAT) * GRIDRESOLUTION);
      let gridCellIndex = rowIndex * numCols + colIndex;
      

      // Iterate surrounding 9 cells
      colIndex--;
      rowIndex--;
      for (let cc = 0; cc < 9; cc++){ // Iterate surrounding cells
        let tmpR = rowIndex + Math.floor(cc/3); // Row
        let tmpC = colIndex + cc%3 // Col
        gridCellIndex = tmpR * numCols + tmpC;

        // First test, use only the ones inside the cell
        let gridCell = grid[gridCellIndex];
        if (gridCell !== undefined){
          
          for (let kk = 0; kk < gridCell.length; kk++){
            let indexData = gridCell[kk];
            // Calculate distance
            let dd = this.calcDistance(long, lat, data[indexData]['Longitude (deg)'], data[indexData]['Latitude (deg)']);
            if (dd < distanceLimit){
              dataPointDistances.push([dd, indexData]);
            }
            // Exit loop if four points are found
            if (dataPointDistances.length >= 4)
              kk = gridCell.length;
          }

        } // End if girdCell

      }// End cc for






      // Interpolate
      // TODO: something wrong with the distance calculation?
      let UValue = undefined;
      let VValue = undefined;
      if (dataPointDistances.length != 0){
        dataPointDistances.sort( (a,b) => a[0] - b[0] );
        let dataPoint = data[dataPointDistances[0][1]];
        // Nearest neighbour
        if (dataPointDistances.length == 1){
          UValue = dataPoint['U-comp (cm/s)'];
          VValue = dataPoint['V-comp (cm/s)'];
        }
        // Linear interpolation
        else {
          let d1 = dataPointDistances[0][0];
          let d2 = dataPointDistances[1][0];
          let totD = d1 + d2;
          let dataPoint1 = data[dataPointDistances[0][1]];
          let dataPoint2 = data[dataPointDistances[1][1]];

          UValue = dataPoint1['U-comp (cm/s)'] * (1 - d1/totD) + dataPoint2['U-comp (cm/s)'] * (d1 / totD);
          VValue = dataPoint1['V-comp (cm/s)'] * (1 - d1/totD) + dataPoint2['V-comp (cm/s)'] * (d1 / totD);
        }

      }
      



      // Assign
      dataGrid[ii * 2] = UValue;
      dataGrid[ii * 2 + 1] = VValue;
    }

    
    this.dataGrid[timestamp] = {
      dataGrid,
      minLat,
      maxLat,
      minLong,
      maxLong,
      stepLong,
      stepLat,
      rangeLong,
      rangeLat,
      "numLongPoints": resLong,
      "numLatPoints": resLat
    }

    this.lastLoadedTimestamp = timestamp;

  }


  // Calculate distance
  calcDistance(x, y, a, b){
    return Math.sqrt((x-a)*(x-a) + (y-b)*(y-b));
  }


  // Get value at Lon-Lat
  // THIS FUNCTION IS DUPLICATED IN AnimationEngine.js --> REFACTOR, BUT HOW? AnimationEngine only gets data, not whole Radar class
  getValueAtTmstLongLat(tmst, long, lat, value){
    
    let grid = this.dataGrid[tmst]; 

    let longIndex = Math.floor(grid.numLongPoints * (long - grid.minLong) / grid.rangeLong);
    let latIndex = Math.floor(grid.numLatPoints * (lat - grid.minLat) / grid.rangeLat);
    longIndex = longIndex == -1 ? 0 : longIndex;
    latIndex = latIndex == -1 ? 0 : latIndex;

    // Indices are outside the data grid
    if (longIndex < 0 || latIndex < 0 || longIndex >= grid.numLongPoints || latIndex >= grid.numLatPoints){
      //console.log("Index out of bounds. longIndex: " + longIndex + ", latIndex: " + latIndex + ", Resolution: " + grid.numLongPoints + "x" + grid.numLatPoints);
      value[0] = undefined;
      value[1] = undefined;
      return value;
    }

    // Find value
    let index = latIndex * grid.numLongPoints + longIndex;
    value[0] = grid.dataGrid[ index * 2];
    value[1] = grid.dataGrid[ index * 2 + 1];

    return value;
  }
}

export default DataManager
