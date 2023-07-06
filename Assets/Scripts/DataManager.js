// Static files sample
const firstDate = new Date('2023-01-26T06:00Z');
const lastDate = new Date('2023-02-02T06:00Z');
const DAYSTOLOAD = 3;
const SEARCHHOURS = 24*7;

// Data manager class
class DataManager {

  HFRadars = {};

  constructor(){
    // EVENT LISTENERS
    window.eventBus.on('LoadedHFRadarData', (HFRadarData) => { // From FileManager.js
      this.addHFRadarData(HFRadarData);
    });
    window.eventBus.on('LoadedDropedHFRadarData', (HFRadarData) => { // From FileManager.js
      this.addHFRadarData(HFRadarData);
    });
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





    // Load data availability
    if (window.FileManager){
      window.FileManager.loadDataAvailability()
        .then(r => {
          this.hourlyDataAvailability = r;
          this.generateDailyDataAvailability(r);
          window.eventBus.emit('DataManager_HourlyDataAvailabilityLoaded');
        })
        .catch(e => {throw e})
    }
  }


  // INTERNAL METHODS
  addHFRadarData(HFRadarData){

    
    // Combined files do not have PatternUUID. Some radials do not have PatternUUID
    if (HFRadarData.header.PatternUUID == undefined){
      HFRadarData.header.PatternUUID = 'noUUID' + HFRadarData.header.Site;
    }
    // Find UUID
    let UUID = HFRadarData.header.PatternUUID.replaceAll(" ", "");

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
            this.dailyDataAvailability[date][radarName] = hourlyAvail[radarname];
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
      let data = HFRadar.data;
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
    // First load current file
    this.loadStaticFilesRepository(tmst, tmst).then(hfRadar => {
      if (hfRadar != undefined){
        window.eventBus.emit('HFRadarDataLoaded', hfRadar.lastLoadedTimestamp);
      }
    });
    console.log("RELOADING DATA MAYBE!!");
    let sD = new Date(tmst);
    let eD = new Date(tmst);
    // When playing forward or backward, this function is called. Maybe need to recheck data availability. Also write if the file is being loaded
    // TODO HERE
    sD.setUTCDate(sD.getUTCDate() - 1);
    eD.setUTCDate(eD.getUTCDate() + 1);
    // Use web worker to load the rest of the files
    if (window.DataWorker){
      window.DataWorker.postMessage(['loadStaticFilesRepository', [sD.toISOString(), eD.toISOString()]]);
    } 
    // Fallback option
    else {
      window.DataManager.loadStaticFilesRepository(sD.toISOString(), eD.toISOString()).then((hfRadar) => {
      if (hfRadar != undefined)
        window.eventBus.emit('HFRadarDataLoaded');
      });
    }
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
      if (radar.data[timestamp] != undefined){
        
        radar.currentData = radar.data[timestamp];
        
        radarsData.push(radar);
      } else
        radar.currentData = "undefined";
    }
     return radarsData;
  }

  // Get start and end dates of loaded data
  getStartEndDates(){
    let startDate = new Date();
    let endDate = new Date(1970);
    // Iterate radars to find latest and earliest dates
    let keys = Object.keys(this.HFRadars);
    for (let i = 0; i < keys.length; i++){
      Object.keys(this.HFRadars[keys[i]].data).forEach(tmst => {
        if (new Date(tmst) < startDate)
          startDate = new Date(tmst);
        if (new Date(tmst) > endDate )
          endDate = new Date(tmst);
      });
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }
  }

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
            if (promiseResult.status == 'fulfilled'){
              
              lastHFRadar = this.addHFRadarData(promiseResult.value);
              // Make it inactive it is radial?
              if (lastHFRadar != undefined){
                if (lastHFRadar.constructor.name == "HFRadar")
                  lastHFRadar.isActivated = false;
                else
                  lastHFRadar.isActivated = true;
              }
              
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
        lastHFRadar.isActivated = true;
      }
      window.eventBus.emit('HFRadarDataLoaded', lastHFRadar.lastLoadedTimestamp);
    })
  }


// End of class
}















// HFRadar class (for data managing purposes)
class HFRadar {

  data = {};
  headers = {}; // Headers contain some time information too
  images = {};
  // GUI state variables
  isActivated; // User decides
  pointsVisible = true; // User decides // Different for CombinedRadars
  animationVisible = true; // User decides
  hasDataOnTmst; // Has data on selected timestamp
  isAnimated; // User decides
  pointFeature; // Dots are reactive
  // Legend
  legendRange = [-100, 100];


  constructor(HFRadarData){

    this.header = HFRadarData.header;

    // Define header
    let keys = Object.keys(HFRadarData.header)
    // TO FIX - IS THIS NECESSARY?
    for (let i = 0; i < keys.length; i++){
      let key = keys[i];
      if (HFRadarData.header[key] != undefined)
        this[key] = HFRadarData.header[key];
    }

    // UUID
    this.UUID = HFRadarData.header.PatternUUID.replaceAll(" ", "");

    // Store data
    this.addRadarData(HFRadarData);

  }

  // PUBLIC METHODS
  // Ingest new data
  // Could use the HFRadarData.header.UUID to identify the files. Timestamp works better for accessibility.
  addRadarData(HFRadarData){
    // Get timestamp
    let timestamp = this.getTimestamp(HFRadarData)

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
    let location = locationStr.replace(/\s\s+/g, ',').replace(',', '').replace('\r', '').split(',');
    location = location.slice(0,2).reverse();
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
    this.pointsVisible = false; 
    this.addRadarData(CombinedRadarData, 100, 200); // Consider using power of two numbers to create image and upsample later
  }


  addRadarData(CombinedRadarData, resolutionLong, resolutionLat){
    if (this.dataGrid == undefined)
     this.dataGrid = {};


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
