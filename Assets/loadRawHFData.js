const firstDate = new Date('2023-01-26T06:00Z');
const lastDate = new Date('2023-02-02T06:00Z');


// Parse text
const parseText = function(rawText){
  // Index header
  let tableStartIndex = rawText.indexOf('TableStart:') + 12;
  let tableEndIndex = rawText.indexOf('%TableEnd:');

  // Index data
  let lastMetadataIndex = rawText.indexOf('RngCell') + 8;

  // Col names
  let tableStartStr = rawText.substring(tableStartIndex, lastMetadataIndex);
  let tableStartRows = tableStartStr.split('\n');
  let tableHeaders = tableStartRows[0];
  let tableUnits = tableStartRows[1];

  tableHeaders = tableHeaders.replaceAll(' Distance', '-Distance');
  tableHeaders = tableHeaders.replaceAll(' comp', '-comp');
  
  tableHeaders = tableHeaders.replaceAll('%', '').replace( /\s\s+/g, ',').replaceAll(' ', ',').split(','); // Remove starting %%, remove spaces in between, split
  tableHeaders.shift();
  tableUnits = tableUnits.replaceAll('%', '').replace( /\s\s+/g, ',').replaceAll(' ', ',').split(',');
  tableUnits.shift();

  // Table headers exceptions
  tableHeaders[tableHeaders.indexOf('Spatial')] = 'Spatial Quality';
  tableHeaders[tableHeaders.indexOf('Temporal')] = 'Temporal Quality';
  tableHeaders[tableHeaders.indexOf('Pattern')] = 'Pattern Distance';
  tableHeaders[tableHeaders.indexOf('Velocity')] = 'Velocity Maximum';
  tableHeaders[tableHeaders.lastIndexOf('Velocity')] = 'Velocity Minimum';
  tableHeaders[tableHeaders.lastIndexOf('Spatial')] = 'Spatial Count';
  tableHeaders[tableHeaders.lastIndexOf('Temporal')] = 'Temporal Count';
  tableHeaders[tableHeaders.indexOf('Spectra')] = 'Spectra RngCell';


  let dataStr = rawText.substring(lastMetadataIndex, tableEndIndex);
  let dataRows = dataStr.split('\n');


  let out = [];
  for (let i = 0; i < dataRows.length; i++){
    let dataRow = dataRows[i].replace( /\s\s+/g, ',').replaceAll(' ', ',').split(',');
    dataRow.shift();
    if (dataRow.length == 20){ // Some lines at the end of file? %TableEnd
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


  // Emit event
  window.eventBus.emit('LoadedHFRadarData', {header, 'data': out});

  return {header, 'data': out};
}


// Returns a promise of loading the data
const loadRawHFData = function(timestamp){

  console.log(window.location.href);

  let date = new Date(timestamp);
  date = firstDate; // HACK
  let dateISO = date.toISOString();
  dateISO = dateISO.substring(0, 14) + '00:00.000Z'; // Hourly
  let year = dateISO.substring(0,4);
  let month = dateISO.substring(5,7);
  let day = dateISO.substring(8,10);
  let hour = dateISO.substring(11,13);


  let url = window.location.href + 'data/Radials4Conchy/RDLm_CREU_' + year + '_' + month + '_' + day + '_' + hour + '00.ruv';

  return fetch(url)
    .then (r => r.text())
    .then (res => parseText(res)).catch(e => { throw e });

  

}



// Reads files from drag and drop
const readFile = function(file){
  let reader = new FileReader();
  reader.fileName = file.name;

  // On load file
  reader.addEventListener('load', e => {
    parseText(reader.result);
  });
  reader.addEventListener('error', e => {
    console.error('Could not read file ' + reader.file.name);
    console.error(e);
  })
  // Read as text
  reader.readAsText(file);
}



export { loadRawHFData, readFile };