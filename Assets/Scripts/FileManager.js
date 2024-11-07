// Loads and stores the urls of the loaded files for later download









class FileManager {

  legendsFilePath = './Assets/Legends/';

  LEGENDNAMES = [
    'GreenBlueWhiteOrangeRed',
    'BlueWhiteRed',
    'ModifiedOccam',
    'white',
    'black',
    'DarkScaleColors',
    'absModifiedOccam',
    'absColdOccam',
    'Alg2',
    'Green',
    'Inferno',
    'Occam',
    'OccamCold',
    'OccamPastel',
    'TwoSidedBlueWhiteRed',
    'TwoSidedDarkScaleColors',
    'TwoSidedGreenBlueWhiteOrangeRed',
    'TwoSidedOccam',
    'Zebra'
  ];

  BASELAYERURLS = [
    './Assets/BaseLayer/Imagery.png',
    './Assets/BaseLayer/Bathymetry.png',
    // './Assets/BaseLayer/Ocean.png',
    // './Assets/BaseLayer/OSM.png'
  ];

  requestedFiles = [];
  loadedFilesLog = [];



  constructor(){
    // WEB WORKER
    // Capture web worker messages
    if (window.DataWorker){
      window.DataWorker.onmessage = (e) => {
        // Interaction with main thread and web worker can be slow, avoid doing postmessage repeatedly
        let result = e.data;
        // Loaded data from worker
        if (result[0] == 'loadDataFromRepository'){
          this.petitionsSolved++;
        } else if (result[0] == 'loadStaticFilesRepository'){
          let data = result[1];
          for (let i = 0; i < data.length; i++){
            window.DataManager.addHFRadarData(data[i]);
          }
          // First-load and load due to user interaction
          window.eventBus.emit('HFRadarDataLoaded');
        }
        // Keep track of requested files
        else if (result[0] == 'requestedFiles'){
          let reqFiles = result[1];
          this.requestedFiles.push(...reqFiles);
        }
        // Keep track of loaded files
        else if (result[0] == 'loadedFilesLog'){
          let loadedLog = result[1];
          this.loadedFilesLog.push(...loadedLog);
        }
      }
    }
  }



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
    let numCols = this.getParamFromTable(rawText, 'TableColumns')*1;

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

    // Combined radar data file fix (Site Country)
    let siteIndex = tableHeaders.indexOf('Site');
    if (siteIndex != -1){
      let counter = 0;
      for (let i = siteIndex; i < numCols; i++){
        tableHeaders[i] = 'Site Contri';
        counter++;
      }
      tableHeaders = tableHeaders.slice(0, tableHeaders.length - counter);
    }

    // Table columns check
    let numTableColumns = 1*this.getParamFromTable(rawText, 'TableColumns');
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


    // Get metadata
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
  getParamFromTable = function(rawText, param){

    let paramIndex = rawText.indexOf(param) + param.length;
    let cols = rawText.substring(paramIndex, paramIndex + 200).split('\n');
    return cols[0].replaceAll(':', '').replaceAll(' ', '');

  }




  loadDataFromRepository = function(timestamp, fileTypes){

    //let baseURL = 'https://icatmar.github.io/HFRadarData/'
    let baseURL = '/data/observational/hf_radar/currents/'
    let wavesBaseURL = '/data/observational/hf_radar/waves/'

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
      // Totals
      urls.push(baseURL + 'L3/tuv/' + year + '/' + month + '/TOTL_CATS_' + year + '_' + month + '_' + day + '_' + hour + '00.tuv');
    }
    // Currents geojson
    if (fileTypes.includes('geojson')){
      // Totals CATS
      urls.push(baseURL + 'L3/geojson/' + year + '/' + month + '/TOTL_CATS_' + year + '_' + month + '_' + day + '_' + hour + '00.geojson');
    }
    // Currents netcdf
    if (fileTypes.includes('nc')){
      // Totals CATS
      urls.push(baseURL + 'L3/netcdf/' + year + '/' + month + '/TOTL_CATS_' + year + '_' + month + '_' + day + '_' + hour + '00.nc');
    }
    // Radials
    if (fileTypes.includes('ruv')){
      //  Creus
      urls.push(baseURL + 'L2/CREU/' + year + '/' + month + '/RDLm_CREU_' + year + '_' + month + '_' + day + '_' + hour + '00_l2b.ruv');
      // Begur
      urls.push(baseURL + 'L2/BEGU/' + year + '/' + month + '/RDLm_BEGU_' + year + '_' + month + '_' + day + '_' + hour + '00_l2b.ruv');
      // Arenys
      urls.push(baseURL + 'L2/AREN/' + year + '/' + month + '/RDLm_AREN_' + year + '_' + month + '_' + day + '_' + hour + '00_l2b.ruv');
      // Port de Barcelona
      urls.push(baseURL + 'L2/PBCN/' + year + '/' + month + '/RDLm_PBCN_' + year + '_' + month + '_' + day + '_' + hour + '00_l2b.ruv');
      // Port Ginesta
      urls.push(baseURL + 'L2/GNST/' + year + '/' + month + '/RDLm_GNST_' + year + '_' + month + '_' + day + '_' + hour + '00_l2b.ruv');
    }
    // Waves and wind
    if (fileTypes.includes('wls')){
      // Waves Creus
      urls.push(wavesBaseURL + 'CREU/WVLM_CREU_' + year + '_' + month + '_01_0000.wls');
      // Waves Begur
      urls.push(wavesBaseURL + 'BEGU/WVLM_BEGU_' + year + '_' + month + '_01_0000.wls');
      // Waves Arenys
      urls.push(wavesBaseURL + 'AREN/WVLM_AREN_' + year + '_' + month + '_01_0000.wls');
      // Waves Port de Barcelona
      urls.push(wavesBaseURL + 'PBCN/WVLM_PBCN_' + year + '_' + month + '_01_0000.wls');
      // Waves Port Ginesta
      urls.push(wavesBaseURL + 'GNST/WVLM_GNST_' + year + '_' + month + '_01_0000.wls');
    }



    for (let i = 0; i < urls.length; i++){
      // Check if this file was already requested, only if activeSync is off
      let fileWasRequested = this.requestedFiles.indexOf(urls[i]) != -1;
      
      // Skip file
      if (fileWasRequested && !window.GUIManager.activeSync){
        continue;
      }
      // Keep track of requested files
      if (!fileWasRequested){
        this.requestedFiles.push(urls[i]);
      }
     
      // Request file
      promises.push(
        fetch(urls[i])
          .then( r => r.text()) // https://stackoverflow.com/questions/32545632/how-can-i-download-a-file-using-window-fetch
          .then (res => {
            if (res[0] == '<')
              throw new Error('File not found: ' + urls[i]);
            this.loadedFilesLog.push({"url": urls[i], "contentTxt": res});
            return parseText(res);
          })
        );
    }

    //console.log("Promises length: " + promises.length + ". Activesync: " + window.GUIManager.activeSync + ". Tmst: " + timestamp)

    return Promise.allSettled(promises)
      //.then(values => console.log(values))
  }






  // Load demo data in case the pipeline is broken
  loadDemoData = function(){
    let baseURL = window.location.href.replace('index.html', '');
    baseURL = baseURL.split('#')[0];
    baseURL += 'data/demoData';

    let year = 2024;
    let month = '07';
    let day = '01';
    let hour = '01';


    let urls = [];
    let promises = [];
    
    // Totals
    urls.push(baseURL + '/TOTL_CATS_' + year + '_' + month + '_' + day + '_' + hour + '00.tuv');
    // Radials
    //  Creus
    urls.push(baseURL + '/RDLm_CREU_' + year + '_' + month + '_' + day + '_' + hour + '00_l2b.ruv');
    // Begur
    urls.push(baseURL + '/RDLm_BEGU_' + year + '_' + month + '_' + day + '_' + hour + '00_l2b.ruv');
    // Arenys
    urls.push(baseURL + '/RDLm_AREN_' + year + '_' + month + '_' + day + '_' + hour + '00_l2b.ruv');
    // Port de Barcelona
    urls.push(baseURL + '/RDLm_PBCN_' + year + '_' + month + '_' + day + '_' + hour + '00_l2b.ruv');
    // Port Ginesta
    urls.push(baseURL + '/RDLm_GNST_' + year + '_' + month + '_' + day + '_' + hour + '00_l2b.ruv');
    // Waves and wind
    // Waves Creus
    urls.push(baseURL + '/WVLM_CREU_' + year + '_' + month + '_01_0000.wls');
    // Waves Begur
    urls.push(baseURL + '/WVLM_BEGU_' + year + '_' + month + '_01_0000.wls');
    // Waves Arenys
    urls.push(baseURL + '/WVLM_AREN_' + year + '_' + month + '_01_0000.wls');
    // Waves Port de Barcelona
    urls.push(baseURL + '/WVLM_PBCN_' + year + '_' + month + '_01_0000.wls');
    // Waves Port Ginesta
    urls.push(baseURL + '/WVLM_GNST_' + year + '_' + month + '_01_0000.wls');

    
    for (let i = 0; i < urls.length; i++){
      // Check if this file was already requested
      // No need to use autoSync here, because when demoData is loaded it means that the repo is not working or not updated
      if (this.requestedFiles.indexOf(urls[i]) != -1){
        continue;
      }
      // Request file
      this.requestedFiles.push(urls[i]);
      promises.push(
        fetch(urls[i])
          .then( r => r.text()) // https://stackoverflow.com/questions/32545632/how-can-i-download-a-file-using-window-fetch
          .then (res => {
            if (res[0] == '<')
              throw new Error('File not found: ' + urls[i]);
            this.loadedFilesLog.push({"url": urls[i], "contentTxt": res});
            return parseText(res);
          })
        );
    }

    return Promise.allSettled(promises)
  }


  // Returns a promise of loading the data
  loadRawHFData = function(timestamp){

    let baseURL = window.location.href.replace('index.html', '');
    baseURL = baseURL.split('#')[0];

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
      .then (res => this.parseText(res))
      .catch(e => { throw e });

    

  }



  // Reads files from drag and drop
  readFile = function(file, fileExtension){
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.fileName = file.name;
      reader.fileExtension = fileExtension;

      // On load file
      reader.addEventListener('load', e => {
        try {
          // Store in Data Manager
          // Parse HF files
          if (reader.fileExtension == 'wls' || fileExtension == 'tuv' || fileExtension == 'ruv')
            resolve(this.parseText(reader.result));
          // Parse geojson
          else if (reader.fileExtension == 'geojson'){
            let parsedGeoJSON = JSON.parse(reader.result);
            parsedGeoJSON.fileName = reader.fileName;
            resolve(parsedGeoJSON);
          }
        }
        catch (e){
          debugger;
          reject(e);
        }
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












// Data availability (generated from python script)
loadDataAvailability = function(){
  let baseURL = window.location.href.replace('index.html', '');
  baseURL = baseURL.split('#')[0];
  let url = baseURL + 'data/hfRadarDataAvailability.json'
  return fetch(url)
    .then(r => r.json())
    .catch(e => {throw e})
}














  // LEGENDS
  // Load legends
  // TODO: DO NOT LOAD THEM TWICE
  loadLegends = function(steps){
    let promises = [];
    steps = steps || 50;

    for (let i = 0; i < this.LEGENDNAMES.length; i++){
      promises.push(this.getLegend(this.LEGENDNAMES[i], steps));
    }

    return new Promise(resolve => resolve(Promise.allSettled(promises)));
  }

  // Get legends
  getLegend = function(legendName, steps){

    return new Promise ((resolve, reject) => {

      if (legendName == undefined) {debugger};

      let img = new Image();
      img.src = this.legendsFilePath + legendName + '.png';
      

      img.onload = () => {
        console.log('Legend loaded')
        // Create canvas
        let canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        let ctx = canvas.getContext("2d");
        // Paint image and get image data
        ctx.drawImage(img, 0,0);
        let imgData = ctx.getImageData(0, Math.floor(canvas.height/2), canvas.width, 1); // one line in the middle
        let pixels = imgData.data;
        
        //img.style.position = "absolute";
        //img.style.top = "0px";
        //document.body.append(img);

        // Store the color according to the number of steps
        // WARN: Alpha is not considered
        steps = steps || 10;
        let colorsStr = [];
        let colorsRGB = [];
        let colorsFloat32 = new Float32Array(steps*3);
        for (let i = 0; i< steps; i++){
          let tmp = i * canvas.width / steps;
          let pixelPosition = Math.floor((canvas.width / steps) / 2 + tmp); // Pixel index + Half step (take the middle of the area, not the start)
          // RGB as string
          colorsStr[i] = 'rgb(' + pixels[pixelPosition*4] + ',' + pixels[pixelPosition*4 + 1] + ',' + pixels[pixelPosition*4+2] + ')';
          // RBG as array
          colorsRGB[i] = [pixels[pixelPosition*4], pixels[pixelPosition*4+1], pixels[pixelPosition*4+2]];
          // RGB as typed array (runs 5x faster in Animation.js)
          colorsFloat32[i*3] = pixels[pixelPosition*4];
          colorsFloat32[i*3 + 1] = pixels[pixelPosition*4 + 1];
          colorsFloat32[i*3 + 2] = pixels[pixelPosition*4 + 2];
        }

        resolve({colorsStr, colorsRGB, colorsFloat32, img, legendName});
      }
      img.onerror = () => reject();
      
    });

  }





  // Base layer
  loadBaseLayerIcons = function(){
    let promises = [];

    for (let i = 0; i < this.BASELAYERURLS.length; i++){
      promises.push(this.loadImage(this.BASELAYERURLS[i]));
    }

    return new Promise(resolve => resolve(Promise.allSettled(promises)));
  }
  // Load image
  loadImage = function(url){

    return new Promise ((resolve, reject) => {
      let img = new Image();
      img.src = url;
      let name = url.split('/').reverse()[0].replace('.png', '');
        
      img.onload = () => {
        
        resolve({name, img});
      }
      img.onerror = (e) => console.error(e);
    });

  }



}


export default FileManager;