// Static files sample
const firstDate = new Date('2023-01-26T06:00Z');
const lastDate = new Date('2023-02-02T06:00Z');


// Data manager class
class DataManager {

  HFRadars = {};
  CombinedRadars = {};

  constructor(){
    // EVENT LISTENERS
    window.eventBus.on('LoadedHFRadarData', (HFRadarData) => { // From loadRawHFData.js
      this.addHFRadarData(HFRadarData);
    });
    window.eventBus.on('LoadedDropedHFRadarData', (HFRadarData) => { // From loadRawHFData.js
      this.addHFRadarData(HFRadarData);
    });
  }


  // INTERNAL METHODS
  addHFRadarData(HFRadarData){

    
    // Combined files do not have PatternUUID. Some radials do not have PatternUUID
    if (HFRadarData.header.PatternUUID == undefined){
      HFRadarData.header.PatternUUID = 'noUUID' + HFRadarData.header.Site;
    }
    // Find UUID
    let UUID = HFRadarData.header.PatternUUID.replaceAll(" ", "");



    // Check if it is combined radar data (tots)
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




  // PUBLIC METHODS
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


  // Load static files
  loadStaticFiles(){
    // Create promises array
    let movingDate = new Date(firstDate.toISOString());
    let promises = [];
    while (movingDate <= lastDate){
      promises.push(window.loadData(movingDate.toISOString()));
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
        promises.push(window.readFile(file));
    }

    Promise.all(promises).then(values => {
      let lastHFRadar;
      for (let i = 0; i < values.length; i++){
        lastHFRadar = this.addHFRadarData(values[i]);
      }
      window.eventBus.emit('HFRadarDataLoaded', lastHFRadar.lastLoadedTimestamp);
    })
  }


  // Resolve promises
  store(promises){

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
  hasDataOnTmst; // Has data on selected timestamp
  isAnimated; // User decides
  pointVariable;

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
  }

  getRadarOrigin(){
    let locationStr = this.header.Origin;
    let location = locationStr.replace(/\s\s+/g, ',').replace(',', '').replace('\r', '').split(',');
    location = location.reverse();
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
}



class CombinedRadars extends HFRadar {

  dataGrid = {};

  constructor (CombinedRadarData){
    super(CombinedRadarData);

    this.createDataGrid(CombinedRadarData, 50, 100); // Consider using power of two numbers to create image and upsample later
  }


  createDataGrid(CombinedRadarData, resolutionLong, resolutionLat){
    let data = CombinedRadarData.data;
    
    // Calculate range
    let minLat = 999;
    let minLong = 999;
    let maxLat = -999;
    let maxLong = -999;
  
    for (let i = 0; i< data.length; i++){
      if (data[i]['Longitude (deg)'] > maxLong) maxLong = data[i]['Longitude (deg)'];
      if (data[i]['Longitude (deg)'] < minLong) minLong = data[i]['Longitude (deg)'];
      if (data[i]['Latitude (deg)'] > maxLat) maxLat = data[i]['Latitude (deg)'];
      if (data[i]['Latitude (deg)'] < minLat) minLat = data[i]['Latitude (deg)'];
    }
  
    // Margins
    maxLat += 0.013;
    minLat -= 0.013;
    maxLong += 0.017;
    minLong -= 0.017;
  
    let rangeLat = maxLat - minLat;
    let rangeLong = maxLong - minLong;

    let resLat = resolutionLat || 4000;
    let resLong = resolutionLong || 2000;
    let stepLat = rangeLat / resLat;
    let stepLong = rangeLong / resLong;
  
    // Create typed array
    let dataGrid = new Float32Array(resLat * resLong * 2);

    for (let ii = 0; ii < dataGrid.length / 2; ii++){

      let i = Math.floor( ii / resLong); // Lat index
      let j = ii % resLong; // Long index
      
      let long = minLong + j * stepLong;
      let lat = minLat + i * stepLat;

      // Bilinear interpolation
      // Find four closest points
      let dataPointIndices = [0, 0, 0, 0];
      let dataPointDistances = [999, 999, 999, 999];
      for (let kk = 0; kk< data.length; kk++){
        // Calculate distance
        let dd = this.calcDistance(long, lat, data[kk]['Longitude (deg)'], data[kk]['Latitude (deg)']);
        // Find closest points
        for (let ll = 0; ll < dataPointIndices.length; ll++){
          if (dd < dataPointDistances[ll]){
            dataPointDistances[ll] = dd; // Store distance
            dataPointIndices[ll] = kk; // Store data point index
            ll = dataPointIndices.length; // Break from for
          }
        }
      }

      // Define final values
      // TODO: remove values that are too far away
      // Find distance sumatory to normalize weights
      let totalDist = 0;
      let totalDistInv = 0;
      for (let ll = 0; ll < dataPointIndices.length; ll++){
        totalDist += dataPointDistances[ll]; 
        dataPointDistances[ll] = 1/dataPointDistances[ll]; // Invert distance values (closer should have more weight)
        totalDistInv += dataPointDistances[ll];
        
      }
      // Interpolate
      // TODO: use only values that are close
      let UValue = 0;
      let VValue = 0;
      for (let ll = 0; ll < dataPointIndices.length; ll++){
        let dataPoint = data[dataPointIndices[ll]];
        UValue += dataPoint['U-comp (cm/s)'] * (dataPointDistances[ll] / totalDistInv);
        VValue += dataPoint['V-comp (cm/s)'] * (dataPointDistances[ll] / totalDistInv);
      }

      // TODO WARNING HARDCODED FIX
      if (totalDist > 0.2){
        UValue = undefined;
        VValue = undefined;
      }



      // Assign
      dataGrid[ii * 2] = UValue;
      dataGrid[ii * 2 + 1] = VValue;
    }

    // Get timestamp
    let timestamp = this.getTimestamp(CombinedRadarData);
    // Store data grid
    if (this.dataGrid[timestamp]){
      console.log("Overwritting data grid");
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
  }


  // Calculate distance
  calcDistance(x, y, a, b){
    return Math.sqrt((x-a)*(x-a) + (y-b)*(y-b));
  }
}

export default DataManager
