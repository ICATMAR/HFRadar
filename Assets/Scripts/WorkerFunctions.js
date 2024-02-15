// This functions are used by the worker. They are defined here so they can be used by the main thread in case that web workers do not work.

requestedFiles = [];
loadedFilesLog =  [];

  parseText = function(rawText){
    // Get FileType
    let fileType = getParamFromTable(rawText, 'FileType');

    // Radials and Currents map
    if (fileType.includes('RadialMap') || fileType.includes('CurrentMap'))
      return parseRadialCurrentMapText(rawText);
    else if (fileType.includes('WaveHistory'))
      return parseWaveHistoryText(rawText);
  }

  // Parse text
  parseRadialCurrentMapText = function(rawText){
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
    headerText = headerText.replaceAll('%', '').replaceAll('\r', '');
    let headerRows = headerText.split('\n');
    let header = {};
    // Iterate columns
    for (let i = 0; i < headerRows.length; i++) {
      let itemName = headerRows[i].split(':')[0];
      header[itemName] = headerRows[i].split(':')[1];
    }

    // TODO: COMBINED RADAR DATA DOES NOT HAVE PATTERNUUID. IT HAS AN EXTRA TABLE WITH THE LOCATION OF THE RADARS. SHOULD ADD..
    return {header, 'data': out, rawText};
  }



  // Parse wave files
  parseWaveHistoryText = function(rawText){
    // Number of table columns
    let rawColNum = rawText.substring(rawText.indexOf('%TableColumns: '), rawText.indexOf('%TableColumnTypes:')).replace('\n', '').replace('%TableColumns: ', '');
    let colNum = parseFloat(rawColNum);

    // Column abbrevation headers
    let rawAbrHeaders = rawText.substring(rawText.indexOf('%TableColumnTypes: '), rawText.indexOf('%TableRows: ')).replace('\n', '').replace('%TableColumnTypes: ', '');
    let abrHeaders = rawAbrHeaders.trim().split(' ');

    // Validate
    if (colNum != abrHeaders.length){
      console.error("Column number does not match header number: " + colNum + " vs " + abrHeaders.length);
      debugger;
    }

    // Get start date
    let dstr = rawText.substring(rawText.indexOf('%TimeStamp: '), rawText.indexOf('%TimeZone: ')).replace('\n', '').replace('%TimeStamp: ', '').trim().replaceAll('  ', ' ').split(' ');
    let startDate = new Date(dstr[0]+'-'+dstr[1]+'-'+dstr[2]);

    // Get data from table
    let tableLines = rawText.substring(rawText.indexOf('%TableStart:'), rawText.indexOf('%TableEnd:')).split('\n');
    let data = [];
    // Iterate lines
    for (let i = 0; i < tableLines.length; i++){
      let line = tableLines[i];
      if (line.startsWith('%') || line.length < 5)
        continue;
      
      let values = line.trim().split(/\s+/).filter(Boolean);
      // Validate
      if (colNum != values.length){
        console.error('Number of values does not match number of columns: ' + colNum + " vs " + values.length);
        console.log(i);
        console.log(tableLines[i-1]);
        console.log(tableLines[i]);
        debugger;
      }
      // Iterate values
      // Store values
      let dataRow = {};
      for (let j = 0; j < values.length; j++){
        dataRow[abrHeaders[j]] = values[j];
      }
      // Add time ISO
      dataRow.TMST = new Date(startDate.getTime() + 1000*dataRow.TIME).toISOString();
      data.push(dataRow);
      
    }


    // Get metadata wave history
    let headerText = rawText.substring(0, rawText.indexOf('%TableType'));
    headerText = headerText.replaceAll('%', '');
    let headerRows = headerText.split('\n');
    let header = {};
    // Iterate columns
    for (let i = 0; i < headerRows.length; i++) {
      let rowText = headerRows[i].replace('\r', '');
      if (rowText.length == 0)
        continue;

      let itemName = rowText.split(':')[0];
      header[itemName] = rowText.split(':')[1].trim();
    }


    return {header, data, rawText};
  }




  // Extract values from table
  getParamFromTable = function(rawText, param, tableType){

    let paramIndex = rawText.indexOf(param) + param.length;
    let cols = rawText.substring(paramIndex, paramIndex + 200).split('\n');
    return cols[0].replaceAll(':', '').replaceAll(' ', '');

  }




  loadDataFromRepository = function(timestamp, fileTypes){
    

    //let baseURL = 'https://icatmar.github.io/HFRadarData/'
    let baseURL = '/data/observational/hf_radar/currents/';
    let wavesBaseURL = '/data/observational/hf_radar/waves/';

    let date = new Date(timestamp);
    //date = firstDate; // HACK
    let dateISO = date.toISOString();
    dateISO = dateISO.substring(0, 14) + '00:00.000Z'; // Hourly
    let year = dateISO.substring(0,4);
    let month = dateISO.substring(5,7);
    let day = dateISO.substring(8,10);
    let hour = dateISO.substring(11,13);


    let promises = [];
    let urls = [];
    
    // Currents
    if (fileTypes.includes('tuv')){
      // Totals Roses
      urls.push(baseURL + 'L3/tuv/' + year + '/' + month + '/TOTL_ROSE_' + year + '_' + month + '_' + day + '_' + hour + '00.tuv');
    }
    // Radials
    if (fileTypes.includes('ruv')){
      // Begur
      urls.push(baseURL + 'L2/BEGU/' + year + '/' + month + '/RDLm_BEGU_' + year + '_' + month + '_' + day + '_' + hour + '00_l2b.ruv');
      //  Creus
      urls.push(baseURL + 'L2/CREU/' + year + '/' + month + '/RDLm_CREU_' + year + '_' + month + '_' + day + '_' + hour + '00_l2b.ruv');
      // Arenys
      urls.push(baseURL + 'L2/AREN/' + year + '/' + month + '/RDLm_AREN_' + year + '_' + month + '_' + day + '_' + hour + '00.ruv');
      // Port de Barcelona
      urls.push(baseURL + 'L2/PBCN/' + year + '/' + month + '/RDLm_PBCN_' + year + '_' + month + '_' + day + '_' + hour + '00.ruv');
      // Port Ginesta
      urls.push(baseURL + 'L2/GNST/' + year + '/' + month + '/RDLm_GNST_' + year + '_' + month + '_' + day + '_' + hour + '00.ruv');
    }
    // Waves and wind
    if (fileTypes.includes('wls')){
      // Waves Begur
      urls.push(wavesBaseURL + 'BEGU/' + year + '/WVLM_BEGU_' + year + '_' + month + '_01_0000.wls');
      // Waves Creus
      urls.push(wavesBaseURL + 'CREU/' + year + '/WVLM_CREU_' + year + '_' + month + '_01_0000.wls');
      // Waves Arenys
      urls.push(wavesBaseURL + 'AREN/' + year + '/WVLM_AREN_' + year + '_' + month + '_01_0000.wls');
      // Waves Port de Barcelona
      urls.push(wavesBaseURL + 'PBCN/' + year + '/WVLM_PBCN_' + year + '_' + month + '_01_0000.wls');
      // Waves Port Ginesta
      urls.push(wavesBaseURL + 'GNST/' + year + '/WVLM_GNST_' + year + '_' + month + '_01_0000.wls');
    }


    for (let i = 0; i < urls.length; i++){
      // Check if this file was already requested
      if (requestedFiles.indexOf(urls[i]) != -1){
        continue;}
      // Request file
      requestedFiles.push(urls[i]);
      promises.push(
        fetch(urls[i])
          .then( r => r.text()) // https://stackoverflow.com/questions/32545632/how-can-i-download-a-file-using-window-fetch
          .then (res => {
            if (res[0] == '<')
              throw new Error('File not found: ' + urls[i])
            loadedFilesLog.push({"url": urls[i], "contentTxt": res});
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
  loadStaticFilesRepository = async function(startDate, endDate, fileTypes){
    
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
      promises.push(this.loadDataFromRepository(movingDate.toISOString(), fileTypes));
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


  // Get requested files
  getRequestedFiles = function(){
    return requestedFiles;
  }
  // Get loaded files log
  getLoadedFilesLog = function(){
    return loadedFilesLog;
  }








// Export funcions for the web worker
if (typeof self !== 'undefined'){
  self.workerFunctions = {
    loadStaticFilesRepository,
    loadDataFromRepository,
    parseText,
    getRequestedFiles,
    getLoadedFilesLog,
  }
}