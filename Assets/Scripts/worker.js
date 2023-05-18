// This is a web worker with the goal to parallelize parsing HFRadar data
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers

// Import worker functions that are common to the main thread
importScripts('WorkerFunctions.js');

onmessage = (e) => {
  let message = e.data;

  console.log(message[0]);

  // Should stablish a standard to communicate
  // For example message[0] = the function, message[1] inputs of the function
  if (message[0] == 'parseText'){
    let result = workerFunctions.parseText(message[1]);
    self.postMessage(result);
  }
}
