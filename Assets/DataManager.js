// Static files sample
const firstDate = new Date('2023-01-26T06:00Z');
const lastDate = new Date('2023-02-02T06:00Z');


// Data manager class
class DataManager {

  HFRadars = {};

  constructor(){

    window.eventBus.on('LoadedHFRadarData', (HFRadarData) => { // From loadRawHFData.js
      // Find UUID
      let UUID = HFRadarData.header.PatternUUID.replaceAll(" ", "");
      // HFRadar exists
      if (this.HFRadars.UUID != undefined){
        this.HFRadars.UUID.addRadarData(HFRadarData);
      } else {
        // Create HFRadar
        let hFRadar = new HFRadar(HFRadarData);
        this.HFRadars.UUID = hFRadar;
      }
     
    });
  }


  // PUBLIC METHODS
  // Returns and array with radar data available on a specific date
  getRadarsDataOn(timestamp){
    let radarsData = [];
    let keys = Object.keys(this.HFRadars);
    for (let i = 0; i < keys.length; i++){
      if (this.HFRadars[keys[i]].radarData[timestamp] != undefined){
        let radarData = this.HFRadars[keys[i]].radarData[timestamp];
        radarsData.push(radarData);
      }
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
      Object.keys(this.HFRadars[keys[i]].radarData).forEach(tmst => {
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
      
      let lastHFRadarData = values[values.length -1];
      // HACK --> TODO: CHANGE EVENT NAME. AFTER THIS USE TIMESLIDER TO SELECT DATES
      window.eventBus.emit('LoadedDropedHFRadarData', lastHFRadarData);

    });
  }


// End of class
}




// HFRadar class (for data managing purposes)
class HFRadar {

  radarData = {};

  constructor(HFRadarData){

    // Define header
    let keys = Object.keys(HFRadarData.header)

    for (let i = 0; i < keys.length; i++){
      let key = keys[i];
      this.key = HFRadarData.header[key];
    }

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
    if (this.radarData[timestamp] != undefined) 
      console.warn ("Overwritting. HFRadar: " + HFRadarData.header.Site + " on timestamp: " + timestamp);

    // Store data
    this.radarData[timestamp] = HFRadarData.data;
    
  }
}

export default DataManager