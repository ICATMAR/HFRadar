// Loads and stores the urls of the loaded files for later download









class FileManager {

  LEGENDURLS = [
    './Assets/Legends/GreenBlueWhiteOrangeRed.png',
    './Assets/Legends/BlueWhiteRed.png',
    './Assets/Legends/ModifiedOccam.png',
    './Assets/Legends/absGrayScale.png',
    './Assets/Legends/absGrayScaleReverse.png',
    './Assets/Legends/DarkScaleColors.png',
    './Assets/Legends/absModifiedOccam.png',
    './Assets/Legends/absColdOccam.png',
  ];

  BASELAYERURLS = [
    './Assets/BaseLayer/Imagery.png',
    './Assets/BaseLayer/Bathymetry.png',
    // './Assets/BaseLayer/Ocean.png',
    // './Assets/BaseLayer/OSM.png'
  ];

  constructor(){
    // WEB WORKER
    // Capture web worker messages
    if (window.DataWorker){
      window.DataWorker.onmessage = (e) => {
        let result = e.data;
        console.log(result);
      }
    }
  }





  // Parse text web worker
  parseTextWorker = function(rawText, callback){
    if (window.DataWorker){
      window.DataWorker.postMessage(['parseText', rawText]);
      window.DataWorker.onmessage = (e) => {
        callback(e.data);
      }
    } else
      callback(window.workerFunctions.parseText(rawText));
    
  }


  // Parse text
  parseText = function(rawText){
    if (window.DataWorker)
      window.DataWorker.postMessage(['parseText', rawText]);
    
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

    // Combined radar data file fix
    let siteIndex = tableHeaders.indexOf('Site');
    if (siteIndex != -1){
      for (let i = siteIndex; i < numCols; i++)
        tableHeaders[i] = 'Site Contri';
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
            return this.parseText(res);
          })
        );
    }



    return Promise.allSettled(promises)
      //.then(values => console.log(values))


  }





  // Returns a promise of loading the data
  loadRawHFData = function(timestamp){

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
      .then (res => this.parseText(res))
      .catch(e => { throw e });

    

  }



  // Reads files from drag and drop
  readFile = function(file){
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.fileName = file.name;

      // On load file
      reader.addEventListener('load', e => {
        // Store in Data Manager
        resolve(this.parseText(reader.result));
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



























  // LEGENDS
  // Load legends
  loadLegends = function(steps){
    let promises = [];
    steps = steps || 50;

    for (let i = 0; i < this.LEGENDURLS.length; i++){
      promises.push(this.getLegend(this.LEGENDURLS[i], steps));
    }

    return new Promise(resolve => resolve(Promise.allSettled(promises)));
  }

  // Get legends
  getLegend = function(url, steps){

    return new Promise ((resolve, reject) => {

      let img = new Image();
      img.src = url;
      

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

        // Legend name
        let str = url.split('/');
        let legendName = str[str.length-1];

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