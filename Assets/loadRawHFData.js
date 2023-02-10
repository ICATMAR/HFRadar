


// Parse text
const parseText = function(rawText){
  // Index header
  let tableStartIndex = rawText.indexOf('TableStart:') + 12;
  let tableEndIndex = rawText.indexOf('%TableEnd:');

  let tableStr = rawText.substring(tableStartIndex, tableEndIndex);

  // Index data start
  // let lastMetadataIndex = rawText.indexOf('RngCell') + 8;
  let headerRowsRaw = tableStr.substring(tableStr.indexOf('%%'), tableStr.indexOf('%%') + 500).split('\n');
  let dataStartIndex = tableStr.indexOf('%%') + headerRowsRaw[0].length + headerRowsRaw[1].length + 3;

  // Num columns
  let numCols = getParamFromTable(rawText, 'TableColumns')*1;
  console.log(numCols)

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
  if (tableHeaders[15] == 'Site'){ // Hardcoded index
    for (let i = 15; i<numCols; i++)
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
const getParamFromTable = function(rawText, param, tableType){

  let paramIndex = rawText.indexOf(param) + param.length;
  let cols = rawText.substring(paramIndex, paramIndex + 200).split('\n');
  return cols[0].replaceAll(':', '').replaceAll(' ', '');

}




// Returns a promise of loading the data
const loadRawHFData = function(timestamp){

  let baseURL = window.location.href.replace('index.html', '');

  let date = new Date(timestamp);
  //date = firstDate; // HACK
  let dateISO = date.toISOString();
  dateISO = dateISO.substring(0, 14) + '00:00.000Z'; // Hourly
  let year = dateISO.substring(0,4);
  let month = dateISO.substring(5,7);
  let day = dateISO.substring(8,10);
  let hour = dateISO.substring(11,13);


  let url = baseURL + 'data/Radials4Conchy/RDLm_CREU_' + year + '_' + month + '_' + day + '_' + hour + '00.ruv';

  return fetch(url)
    .then (r => r.text())
    .then (res => parseText(res))
    .catch(e => { throw e });

  

}



// Reads files from drag and drop
const readFile = function(file){
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.fileName = file.name;

    // On load file
    reader.addEventListener('load', e => {
      // Store in Data Manager
      resolve(parseText(reader.result));
    });
    reader.addEventListener('error', e => {
      console.error('Could not read file ' + reader.file.name);
      console.error(e);
      reject(e);
    })
    // Read as text
    reader.readAsText(file);
  })
  
}



export { loadRawHFData, readFile };