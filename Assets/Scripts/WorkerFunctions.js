// This functions are used by the worker. They are defined here so they can be used by the main thread in case that web workers do not work.


// Parse text
// This function takes quite a while as it has to deal with strings.
function parseText(rawText){

  // Extract values from table
  getParamFromTable = function(rawText, param, tableType){

    let paramIndex = rawText.indexOf(param) + param.length;
    let cols = rawText.substring(paramIndex, paramIndex + 200).split('\n');
    return cols[0].replaceAll(':', '').replaceAll(' ', '');

  }
  
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
  let numTableColumns = 1 * getParamFromTable(rawText, 'TableColumns');
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











// Export functions for the main thread
if (typeof window !== 'undefined'){
  window.workerFunctions = {
    parseText,
  };
}


// Export funcions for the web worker
if (typeof self !== 'undefined'){
  self.workerFunctions = {
    parseText,
  }
}