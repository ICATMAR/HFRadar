// This functions are used by the worker. They are defined here so they can be used by the main thread in case that web workers do not work.


  // Parse text
  parseText = function(rawText){
    // Index header
    let tableStartIndex = rawText.indexOf('TableStart:') + 12;
    let tableEndIndex = rawText.indexOf('%TableEnd:');

    let tableStr = rawText.substring(tableStartIndex, tableEndIndex);

    // Index data start
    // let lastMetadataIndex = rawText.indexOf('RngCell') + 8;
    let headerRowsRaw = tableStr.substring(tableStr.indexOf('%%'), tableStr.indexOf('%%') + 1000).split('\n');
    let dataStartIndex = tableStr.indexOf('%%') + headerRowsRaw[0].length + headerRowsRaw[1].length + 3;

    // Num columns
    let numCols = getParamFromTable(rawText, 'TableColumns')*1;

    // Col names
    let tableHeaders = headerRowsRaw[0];
    let tableUnits = headerRowsRaw[1];
    // Fixes
    tableHeaders = tableHeaders.replaceAll(' Distance', '-Distance');
    tableHeaders = tableHeaders.replaceAll(' comp', '-comp');
    tableHeaders = tableHeaders.replaceAll(' StdDev', '-StdDev');
    
    
    tableHeaders = tableHeaders.replaceAll('%', '').replace( /\s\s+/g, ',').replaceAll(' ', ',').split(','); // Remove starting %%, remove spaces in between, split
    tableHeaders.shift();
    tableUnits = tableUnits.replaceAll('%', '').replace( /\s\s+/g, ',').replaceAll(' ', ',').split(',');
    tableUnits.shift();

    // Combined radar data file fix
    let siteIndex = tableHeaders.indexOf('Site');
    if (siteIndex != -1){
      for (let i = siteIndex; i < numCols; i++)
        tableHeaders[i] = 'Site Contri';
    }

    // Table columns check
    let numTableColumns = 1*getParamFromTable(rawText, 'TableColumns');
    if (tableHeaders.length != tableUnits.length || tableHeaders.length != numTableColumns || numTableColumns != numCols){
      console.error('Table columns missmatch when reading table.');
    }

    // Table headers
    for (let i = 0; i < tableHeaders.length; i++)
      tableHeaders[i] += ' ' + tableUnits[i];


    let dataStr = tableStr.substring(dataStartIndex, tableEndIndex);
    let dataRows = dataStr.split('\n');


    let out = [];
    for (let i = 0; i < dataRows.length; i++){
      let dataRow = dataRows[i].replace( /\s\s+/g, ',').replaceAll(' ', ',').split(',');
      dataRow.shift();
      if (dataRow.length == numTableColumns){ // Some lines at the end of file? %TableEnd
        out[i] = {};
        for (let j = 0; j < dataRow.length; j++){
          out[i][tableHeaders[j]] = dataRow[j] * 1;
        }
      }
      
    }



    // Get metadata
    let headerText = rawText.substring(0, rawText.indexOf('%TableType'));
    headerText = headerText.replaceAll('%', '');
    let headerRows = headerText.split('\n');
    let header = {};
    // Iterate columns
    for (let i = 0; i < headerRows.length; i++) {
      let itemName = headerRows[i].split(':')[0];
      header[itemName] = headerRows[i].split(':')[1];
    }

    // TODO: COMBINED RADAR DATA DOES NOT HAVE PATTERNUUID. IT HAS AN EXTRA TABLE WITH THE LOCATION OF THE RADARS. SHOULD ADD..
    return {header, 'data': out};
  }




  // Extract values from table
  getParamFromTable = function(rawText, param, tableType){

    let paramIndex = rawText.indexOf(param) + param.length;
    let cols = rawText.substring(paramIndex, paramIndex + 200).split('\n');
    return cols[0].replaceAll(':', '').replaceAll(' ', '');

  }




  loadDataFromRepository = function(timestamp){

    //let baseURL = 'https://icatmar.github.io/HFRadarData/'
    let baseURL = '/HFRadarData/'

    let date = new Date(timestamp);
    //date = firstDate; // HACK
    let dateISO = date.toISOString();
    dateISO = dateISO.substring(0, 14) + '00:00.000Z'; // Hourly
    let year = dateISO.substring(0,4);
    let month = dateISO.substring(5,7);
    let day = dateISO.substring(8,10);
    let hour = dateISO.substring(11,13);


    let promises = [];
    let urls = [
      // Begur
      baseURL + 'BEGU/RDLm_BEGU_' + year + '_' + month + '_' + day + '_' + hour + '00.ruv',
      //  Creus
      baseURL + 'CREU/RDLm_CREU_' + year + '_' + month + '_' + day + '_' + hour + '00.ruv',
      // Totals Roses
      baseURL + 'ROSE/TOTL_ROSE_' + year + '_' + month + '_' + day + '_' + hour + '00.tuv'
    ];

    for (let i = 0; i < urls.length; i++){
      promises.push(
        fetch(urls[i])
          .then( r => r.text()) // https://stackoverflow.com/questions/32545632/how-can-i-download-a-file-using-window-fetch
          .then (res => {
            if (res[0] == '<')
              throw new Error('File not found: ' + urls[i])
            return parseText(res);
          })
        );
    }



    return Promise.allSettled(promises)
      //.then(values => console.log(values))
  }



  // Static files sample
  const firstDate = new Date('2023-01-26T06:00Z');
  const lastDate = new Date('2023-02-02T06:00Z');
  const DAYSTOLOAD = 3;
  loadStaticFilesRepository = async function(startDate, endDate){
    
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
      // Request radar files on date
      promises.push(this.loadDataFromRepository(movingDate.toISOString()));
      // Add 1h
      movingDate.setUTCHours(movingDate.getUTCHours() + 1);
    }

    let hfRadarData = [];
    // Resolve promises
    await Promise.allSettled(promises).then(values => {
      for (let i = 0; i < values.length; i++){
        let filesOnDatePromiseResult = values[i];
        // If promise was fullfiled (I think always)
        if (filesOnDatePromiseResult.status == 'fulfilled'){
          
          for (let j = 0; j < filesOnDatePromiseResult.value.length; j++){
            let promiseResult = filesOnDatePromiseResult.value[j];
            if (promiseResult.status == 'fulfilled'){          
              hfRadarData.push(promiseResult.value);
            }
          }
        }
      }

    });

    return hfRadarData;
  }








// Export funcions for the web worker
if (typeof self !== 'undefined'){
  self.workerFunctions = {
    loadStaticFilesRepository,
    loadDataFromRepository,
    parseText,
  }
}