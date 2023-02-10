// Static files sample
const firstDate = new Date('2023-01-26T06:00Z');
const lastDate = new Date('2023-02-02T06:00Z');


// Data manager class
class DataManager {

  HFRadars = {};

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

    // TODO: HARDCORE FIX FOR COMBINED DATA FILES. --> should do a different processing for combined files
    if (HFRadarData.header.PatternUUID == undefined){
      HFRadarData.header.PatternUUID = 'Fake UUID';
    }



    // Find UUID
    let UUID = HFRadarData.header.PatternUUID.replaceAll(" ", "");
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
    let tmst = HFRadarData.header.TimeStamp;
    let ttRaw = tmst.split(" ");
    let tt = [];
    for (let i = 0; i < ttRaw.length; i++){
      if (ttRaw[i].length != 0) tt.push(ttRaw[i]);
    }
    let dd = new Date(tt[0] +"-"+ tt[1]+"-"+ tt[2]+"T"+ tt[3]+":"+ tt[4]+ 'Z');
    let timestamp = dd.toISOString();

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
}

export default DataManager