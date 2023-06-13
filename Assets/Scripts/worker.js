// This is a web worker with the goal to parallelize parsing HFRadar data
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers

// Import worker functions that are common to the main thread
importScripts('WorkerFunctions.js');

onmessage = async (e) => {
  let message = e.data;

  console.log('Using web worker for: ' + message[0]);




  // For example message[0] = the function, message[1] inputs of the function
  if (message[0] == 'parseText'){
    let result = workerFunctions.parseText(message[1]);
    self.postMessage(['parseText', result]);
  }





  // Load files
  else if (message[0] == 'loadDataFromRepository'){
    let promises = workerFunctions.loadDataFromRepository(message[1]);

    hfRadarData = [];
    // Resolve promises
    await promises.then(values => {
      for (let i = 0; i < values.length; i++){
        let filesOnDatePromiseResult = values[i];
        // If promise was fullfiled (I think always)
        if (filesOnDatePromiseResult.status == 'fulfilled'){
          hfRadarData.push(filesOnDatePromiseResult.value);
        }
      }
    });

    self.postMessage(['loadDataFromRepository', hfRadarData]);
  }





  // Load static files from repository
  else if (message[0] == 'loadStaticFilesRepository'){
    let hfRadarData = await workerFunctions.loadStaticFilesRepository(...message[1]);
    self.postMessage(['loadStaticFilesRepository', hfRadarData]);
  }

}
