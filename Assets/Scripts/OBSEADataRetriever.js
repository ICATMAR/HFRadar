// Using sensor things API
// https://data.obsea.es/data-api/ObservedProperties



// Get observed properties
let observedProperties = {};
await fetch('https://data.obsea.es/data-api/ObservedProperties').then(r => r.json()).then(res => {
  
  res.value.forEach(el => {
    observedProperties[el.name] = el;
  });
});

// Each observed property can have different locations. Get sites per property
for (let i = 0; i < Object.keys(observedProperties).length; i++){
  let prop = Object.keys(observedProperties)[i];
//Object.keys(observedProperties).forEach(prop => {
  
  await fetch(observedProperties[prop]["Datastreams@iot.navigationLink"]).then(r => r.json()).then(res => {
    observedProperties[prop].sites = [];
    // Iterate datastreams (streams that provide this data in different times and locations)
    res.value.forEach(el => {
      // Skip if it is not a 30 min average
      if (!el.name.includes("30min_average"))
        return;
      // Skip if no phenomenon time
      if (el.phenomenonTime == undefined)
        return;
      // Skip if phenomenonTime is older than current date (sensor is not active)
      // let oneWeekAgo = new Date();
      // oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      // let latestTmst = el.phenomenonTime.split('/')[1];
      // if (new Date(latestTmst) < oneWeekAgo)
      //   return;
      // Assign to sites
      observedProperties[prop].sites.push(el);
    });
  });
};

// Delete observedProperties without sites
let deletedProps = [];
Object.keys(observedProperties).forEach(prop => {
  if (prop == undefined){
    console.log("prop undefined")
  }
  if (observedProperties[prop].sites.length == 0){
    deletedProps.push(observedProperties[prop].name)
    delete observedProperties[prop];
  }
});
console.warn("Deleted observed properties, as no data is present: " + deletedProps);


// Reorganize data by sites
let sites = {};
Object.keys(observedProperties).forEach(prop => {
  observedProperties[prop].sites.forEach(site => {
    let key = site.observedArea.coordinates[0] + "," + site.observedArea.coordinates[1];
    // If it does not exist, create
    if (sites[key] == undefined){
      sites[key] = {};
    }
    // If property was already defined
    if (sites[key][prop] != undefined){
      console.warn("This variable is collected twice in the same location? " + prop + " at " + key);
    }
    // In principle, no circularity
    sites[key][prop] = observedProperties[prop];

  })
});




// Create data structure for vue
let stationData = {};
for (let i = 0; i < Object.keys(sites).length; i++){//.forEach(key => {
  let key = Object.keys(sites)[i];
  let site = sites[key]
  // Create station data object
  if (stationData[key] == undefined) {
    stationData[key] = {
      hasData: false,
      showInfo: true,
      params: [],
      location: key.split(","),
      data: {}, // tmst1: {WDIR: value, WSP: value...}, tmst2: {}...
    }
    // Params
    for (let j = 0; j < Object.keys(site).length; j++){//.forEach(param => {
      let param = Object.keys(site)[j];
      let paramData = site[param];

      let paramObj = {
        "description": paramData.description,
        "name": paramData.name,
        "units": '',
      }
      // Get datastream(s)
      paramObj.datastreams = [];
      for (let k = 0; k < site[param].sites.length; k++){//site[param].sites//.forEach(dtstm => {
        let dtstm = site[param].sites[k];
        if (dtstm.observedArea.coordinates[0] == stationData[key].location[0]){
          let dataStreamObj = {
            "id": dtstm["@iot.id"],
            "latestTmst": dtstm.phenomenonTime.split("/")[1],
            "units": dtstm.unitOfMeasurement.symbol,
            "sensorDepth": await fetch("https://data.obsea.es/data-api/Datastreams("+ dtstm["@iot.id"] +")/Sensor").then(res => res.json()).then(jj => jj.properties.deployment.coordinates.meters_depth),
          }
          // ADCP currents
          if (dtstm.name.includes('CSPD')){
            dataStreamObj.depth = dtstm.properties["ADCP cell parameters"]["center depth"];
          }

          paramObj.datastreams.push(dataStreamObj);
        }
      }
      stationData[key].params.push(paramObj);
    }
  }
};


// Given a timestamp, get the data from before and after
let currentTmst = new Date();
currentTmst.setDate(currentTmst.getDate() - 1);
let sDate = new Date(currentTmst.getTime());
let eDate = new Date(currentTmst.getTime());
sDate.setDate(currentTmst.getDate() - 1);
eDate.setDate(currentTmst.getDate() + 1);

// Function to parse result
const parseAPIResult = function(station, param, datastream, data){

  for (let i = 0; i < data.length; i++){
    let tmst = data[i].resultTime;
    if (station.data[tmst] == undefined)
      station.data[tmst] = {};

    param.units = datastream.units;
    station.data[tmst][param.name] = data[i].result;
  }
}

// Base url
let url = `https://data.obsea.es/data-api/Datastreams({{datastream}})/Observations?$select=resultTime,result&$filter=resultQuality/qc_flag eq 1 and resultTime ge {{sDate}} and resultTime lt {{eDate}}&$orderBy=resultTime asc`;

// Iterate data streams to fetch data
for (let i = 0; i < Object.keys(stationData).length; i++){
  let station = stationData[Object.keys(stationData)[i]];
  // Iterate parameters (temp, wind, etc...)
  for (let j = 0; j < station.params.length; j++){
    let param = station.params[j];
    // Iterate datastreams
    for (let k = 0; k < param.datastreams.length; k++){
      let datastream = param.datastreams[k];
      // Check latest data available
      if (new Date(datastream.latestTmst) > sDate) {
        // Fetch data
        let streamURL = url.replace('{{datastream}}', datastream.id).replace('{{sDate}}', sDate.toISOString()).replace('{{eDate}}', eDate.toISOString());
        console.log(streamURL);
        fetch(streamURL).then(res => res.json()).then(r => parseAPIResult(station, param, datastream, r.value));
      }
    }
  }
}

