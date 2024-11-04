// Scripts that obtain data from the CMEMS WMTS API
// https://help.marine.copernicus.eu/en/articles/6478168-how-to-use-wmts-to-visualize-data#h_2523403b15

// Examples
// https://wmts.marine.copernicus.eu/teroWmts/?service=WMTS&version=1.0.0&request=GetTile&tilematrixset=EPSG:4326&style=range:0/6,cmap:gray&tilematrix=5&tilerow=8&tilecol=32&layer=MEDSEA_MULTIYEAR_WAV_006_012/med-hcmr-wav-rean-h_202105/VHM0&time=2025-04-30T09:00:00.000Z
// https://wmts.marine.copernicus.eu/teroWmts/?service=WMTS&version=1.0.0&request=GetTile&tilematrixset=EPSG:3857&style=range:0/6,cmap:gray&tilematrix=6&tilerow=23&tilecol=32&layer=MEDSEA_ANALYSISFORECAST_WAV_006_017/cmems_mod_med_wav_anfc_4.2km_PT1H-i_202311/VHM0&time=2024-04-30T09:00:00.000Z
import WMTSProducts from './WMTSDataProducts.js';
import WMTSCustomDefinitions from './WMTSCustomDefinitions.js';

export class WMTSDataRetriever {

  // Requests - keep track of what is requested
  activeRequests = [];
  // Store GetCapabilities XML per product
  productsXML = {};

  // From CMEMS Catalogue
  products = WMTSProducts;

  // Custom dataType definitions
  // These are useful for the interface, UI
  customDefinitions = WMTSCustomDefinitions;



  dataSets = [];





  // CONSTRUCTOR
  constructor(onLoadCallback, verbose) {
    // Verbose
    if (verbose) {
      this.printLog = this.printLogConsole;
      this.printWarn = this.printWarnConsole;
    } else { // Empty callable function
      this.printLog = () => { };
      this.printWarn = () => { };
    }


    // Load WMTS
    // Loading control
    let loading = 0;
    let loaded = 0;
    // Iterate data types
    Object.keys(this.products).forEach(productKey => {
      let product = this.products[productKey];
      product.name = productKey;

      // Get Capabilities
      loading++;
      this.loadWMTSProduct(product)
        .then(() => {
          this.printLog(this.dataSets);
          // Callback when all capabilities have been loaded
          loaded++;
          this.printLog("Total left to load: " + (loading - loaded));

          // All products loaded
          if (loading - loaded == 0) {
            if (onLoadCallback)
              onLoadCallback()
          }
        });
    });

  }






  // Fetch the WMS capabilities and assign to dataSet
  loadWMTSProduct = async function (product) {

    // Fetch
    let rawText = await fetch(product.wmtsURL).then(r => r.text());
    let parser = new DOMParser();
    let rawXML = parser.parseFromString(rawText, 'application/xml');
    product.xml = rawXML;
    // Show available layers
    this.printLog('------------- New product loaded-----------\nAvailable products:');
    rawXML.querySelectorAll('Layer').forEach(ll => {
      this.printLog(ll.querySelector('Name').textContent);
    });

    // Iterate available datasets and compare to selected datasets from product
    rawXML.querySelectorAll('Layer').forEach(ll => {
      let id = ll.querySelector('Id').textContent;
      // Get custom dataSet definitions
      let custDef = this.customDefinitions[id] || {};
      // Copy properties to dataSet object
      let dataSet = JSON.parse(JSON.stringify(custDef));
      // Assign properties from WMTS or from custom definitions
      dataSet.id = id;
      if (!product.dataSets.includes(dataSet.id)) {
        return;
      }
      dataSet.name = ll.querySelector('Name').textContent;
      dataSet.unit = dataSet.unit || ll.querySelector('Unit').textContent;
      if (dataSet.unit == 'degree') { dataSet.unit = 'º'; dataSet.range = [0, 360]; }
      // Assign product properties
      dataSet.doi = product.doi;
      dataSet.productName = product.name;
      dataSet.productProvider = product.xml.getElementsByTagNameNS("http://www.opengis.net/ows/1.1", "ProviderName")[0].textContent;
      // Dataset template
      dataSet.template = this.getResourceURL(rawXML, ll);
      // Add date to template
      dataSet.template += '&time={Time}';
      // Add style range and color map
      if (dataSet.range == undefined)
        debugger;
      dataSet.template = dataSet.template.replace('{Style}', 'range:' + dataSet.range[0] + '/' + dataSet.range[1] + ',cmap:gray');

      // Find if the product belongs to a time scale
      // Iterate through Dimensions (elevation, time)
      ll.querySelectorAll("Dimension").forEach(dd => {
        // Elevation
        if (dd.getElementsByTagName("ows:Identifier")[0].textContent == "elevation") {
          // Get elevation values
          let values = dd.querySelectorAll("Value");
          if (values.length > 1) {
            let elevationArray = [];
            values.forEach(vv => {
              elevationArray.push(vv.textContent);
            });
            dataSet.elevation = elevationArray;
          } else if (values[0].textContent != '0') {
            debugger;
          }
        }
        // Time dimension
        if (dd.getElementsByTagName("ows:Identifier")[0].textContent == "time") {
          // Text content example: '1993-01-01T00:00:00Z/2022-07-31T23:00:00Z/PT1H'
          let values = dd.querySelectorAll("Value");
          if (values.length == 1) {
            let timeStr = values[0].textContent;
            dataSet.startTmst = timeStr.split('/')[0];
            // Only store end time if it is not forecast
            let endTmst = timeStr.split('/')[1];
            if (new Date(endTmst) < new Date())
              dataSet.endTmst = endTmst;
            let timeInterval = timeStr.split('/')[2];
            dataSet.timeScale = timeInterval == 'PT1H' ? 'h' : timeInterval == 'P1D' ? 'd' : '';
            if (dataSet.timeScale == '') {
              this.printLog("Skipped " + dataSet.name + " at " + timeInterval)
            } else {
              // TODO Time scale corrections
              // Hourly (min correction)
              if (dataSet.timeScale == 'h' && endTmst.substring(14, 16) != '00') {
                debugger;
              } else if (dataSet.timeScale == 'd' && (endTmst.substring(14, 16) != '00' || endTmst.substring(11, 13) != '00')) {
                debugger;
              }
            }
          } else {
            // Calculate time interval
            let timeDiff = Math.abs(new Date(values[0].textContent).getTime() - new Date(values[1].textContent).getTime()) / (1000 * 60 * 60 * 24);
            // Monthly
            if (timeDiff > 25 && timeDiff < 32)
              dataSet.timeScale = 'm';
            else {
              dataSet.timeScale = '';
              this.printLog("Skipped " + dataSet.name + " at " + timeDiff + " days")
            }
            // Store dates
            dataSet.dates = [];
            values.forEach(vv => {
              dataSet.dates.push(vv.textContent);
            });
            // Sort dates
            dataSet.dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
            // Store start and end dates
            dataSet.startTmst = dataSet.dates[0];
            // Only store end time if it is not forecast
            let endTmst = dataSet.dates[dataSet.dates.length - 1];
            if (new Date(endTmst) < new Date())
              dataSet.endTmst = endTmst;
          }

        }
      });

      // Store selected dataSets (defined in products variable);
      if (dataSet.timeScale != '') {
        if (product.dataSets.includes(dataSet.id)) {
          this.dataSets.push(dataSet);
          this.printLog(dataSet.name + " at " + dataSet.timeScale);
        }
      }


    });

  }





  // Get resource URL
  getResourceURL = function (rawXML, ll) {
    let template = '';
    // Using resource oriented architectural style
    // https://www.ogc.org/standard/wmts/
    if (ll.querySelector('ResourceURL')) {
      template = ll.querySelector('ResourceURL').attributes.template.textContent;
      if (template.includes('http://')) {
        template = template.replace('http://', 'https://'); // WARN: BUG FROM WMTS?
      }
      debugger;
      return template;
    }
    // Using procedure oriented architectural style
    else {
      // Find the 'ows:Operation' element with name='GetCapabilities'
      let operations = rawXML.getElementsByTagNameNS('http://www.opengis.net/ows/1.1', 'Operation');
      let template;

      for (let operation of operations) {
        // Get link
        let hrefEls = operation.getElementsByTagNameNS('http://www.opengis.net/ows/1.1', 'Get');
        let href = hrefEls[0].getAttributeNS('http://www.w3.org/1999/xlink', 'href');
        if (operation.getAttribute('name') === 'GetTile') {
          template = href;
          break;
        }
      }
      if (template == undefined) { debugger; }
      // Get layer url information
      let layer = ll.getElementsByTagNameNS('http://www.opengis.net/ows/1.1', 'Identifier')[0].textContent;
      // WMTS url elements
      template +=
        '/?service=WMTS' +
        '&version=1.0.0' +
        '&request=GetTile' +
        '&tilematrixset={TileMatrixSet}' +
        '&style={Style}' +
        '&tilematrix={TileMatrix}' +
        '&tilerow={TileRow}' +
        '&tilecol={TileCol}' +
        '&layer=' + layer; //e.g. &layer=MEDSEA_MULTIYEAR_WAV_006_012/med-hcmr-wav-rean-h_202105/VHM0
      return template;
    }

  }





  // Get the best dataSet according to the id, timeScale and timestamp
  getDataSet = function (id, timeScale, tmst) {
    // No data sets loaded
    if (this.dataSets.length == 0) {
      this.printLog("*** --- No dataSets have been loaded");
      console.error("No dataSets have been loaded")
      return;
    }
    // Get dataSets with the id
    let selDataSets = this.dataSets.filter((dataSet) => dataSet.id == id);
    if (selDataSets.length == 0) {
      this.printLog("There are no dataSets with id: " + id);
      console.error("There are no dataSets with id: " + id)
      return;
    }

    // Get dataSets with tmst inside
    let withTmstDataSets = selDataSets.filter((dataSet) => new Date(dataSet.startTmst) < new Date(tmst)); // && new Date(dataSet.endTmst) > new Date(tmst)
    if (withTmstDataSets.length == 0) {
      this.printLog("No dataSet with id=" + id + " contains the selected timestamp: " + tmst);
      console.error("No dataSet with id=" + id + " contains the selected timestamp: " + tmst);
      return undefined;
    }

    // Get dataSets in the timeScale
    let tScaleDataSets = withTmstDataSets.filter((dataSet) => dataSet.timeScale == timeScale);
    if (tScaleDataSets.length == 0) {
      this.printLog("DataSet does not have the timeScale of " + timeScale);
      console.warn("DataSet for " + id + " does not have timeScale of " + timeScale + ". Using alternatives."); //return;
      tScaleDataSets = withTmstDataSets; // Take other timeScales?
    }
    // Select oldest first if possible (usually reanalysis)
    // Sort by date (oldest first)
    tScaleDataSets.sort((dataSetA, dataSetB) => new Date(dataSetA.startTmst) - new Date(dataSetB.startTmst));
    // Check if tmst is inside range
    let selectedDataSet;
    for (let i = 0; i < tScaleDataSets.length; i++) {
      // If no endTmst, it is forecast
      if (tScaleDataSets[i].endTmst == undefined) {
        selectedDataSet = tScaleDataSets[i];
        break;
      }
      // tmst is inside range
      if (new Date(tScaleDataSets[i].startTmst) < new Date(tmst) && new Date(tScaleDataSets[i].endTmst) > new Date(tmst)) {
        selectedDataSet = tScaleDataSets[i];
        break;
      }
    }
    if (selectedDataSet == undefined) {
      this.printLog("No dataSet with id=" + id + " contains the selected timestamp: " + tmst + " at a timeScale of " + timeScale);
      this.console.error("No dataSet with id=" + id + " contains the selected timestamp: " + tmst + " at a timeScale of " + timeScale);
    }

    return selectedDataSet;
  }






  // Get the tmst for the WMTS call. Returns undefined if the dataSet does not contain the date
  getFormattedTmst = function (dataSet, tmst) {
    // Tmst is before starting date
    // WAITING ON CMEMS RESPONSE --> THE DATES FROM GETCAPABILITIES ARE NOT RIGHT
    if (new Date(tmst) < new Date(dataSet.startTmst)) {
      return;
    }
    let formattedTmst = undefined;
    // Time scale
    let timeScale = dataSet.timeScale;

    // Hourly
    if (timeScale == 'h') {
      formattedTmst = tmst.substring(0, 14) + '00:00.000Z';
      // TODO timeScaleCorrection if they exist
    }
    // Daily
    else if (timeScale == 'd') {
      formattedTmst = tmst.substring(0, 11) + '00:00:00.000Z';
    }
    // Monthly
    else if (timeScale == 'm') {
      // Check if the current month is in the dataSet
      for (let i = 0; i < dataSet.dates.length; i++) {
        if (dataSet.dates[i].substring(0, 7) == tmst.substring(0, 7)) {
          formattedTmst = dataSet.dates[i];
          break;
        }
      }
    }

    // Tmst is after end date (forecast does not have an endTmst)
    // WAITING ON CMEMS RESPONSE --> THE DATES FROM GETCAPABILITIES ARE NOT RIGHT
    if (dataSet.endTmst) {
      if (new Date(formattedTmst) > new Date(dataSet.endTmst))
        return;
    }

    return formattedTmst;
  }






  // Load image given a dataSet and a timestamp
  getImageAt = function (dataSet, tmst) {

    // Get formatted timestamp of dataSet and check if it has data available on that tmst
    let formattedTmst = this.getFormattedTmst(dataSet, tmst);

    if (formattedTmst == undefined) {
      this.printLog(dataSet.id + " at " + dataSet.timeScale + " does not contain the timespan with timestamp " + tmst);
      return; //document.createElement('span').innerHTML = 'No data for--';
    }

    let templateURL = dataSet.template.replace('{Time}', formattedTmst);

    templateURL = templateURL.replace('{TileMatrixSet}', 'EPSG:3857'); //EPSG:4326, 3857
    templateURL = templateURL.replace('{TileMatrix}', '6');
    templateURL = templateURL.replace('{TileRow}', '23');
    templateURL = templateURL.replace('{TileCol}', '32');

    let img = document.createElement('img');
    img.src = templateURL;
    return img;
  }



  // DataSets can have different names (Hs, Hm0, Significant Wave Height, VHM0...)
  // This helper permits to ask for the dataSet without knowing the specific id
  getDataSetIdFromDataName = function (dataName) {
    for (let i = 0; i < this.dataSets.length; i++) {
      let dataSet = this.dataSets[i];
      if (dataSet.shortName == dataName)
        return dataSet.id;
      else if (dataSet.id == dataName)
        return dataSet.id;
      else if (dataSet.altNames)
        if (dataSet.altNames.map(str => str.toLowerCase()).includes(dataName.toLowerCase()))
          return dataSet.id;
        else if (dataSet.name == dataName)
          return dataSet.id;
    }
  }

  // Get data at a specific point
  // Input variables
  // var dataName = "Sea temperature";
  // var lat = 41;
  // var long = 2.9;
  // var date = '2010-01-12T12:00:00.000Z';
  // var timeScale = 'd';
  //TODO: This will change to GetFeatureInfo in July 2024
  getDataAtPoint = async function (dataName, tmst, lat, long, timeScale, direction) {

    let id = this.getDataSetIdFromDataName(dataName);
    let dataSet = this.getDataSet(id, timeScale, tmst);

    if (dataSet == undefined) {
      console.log(dataName);
      console.log(this.dataSets.filter(dt => dt.id == id));
      return; //document.createElement('span').innerHTML = 'No data for ' + dataName + " at " + timeScale + " - req: ";
    }

    // If we want the direction
    if (direction) {
      // Check if direction exists (animation)
      if (dataSet.animation == undefined) {
        console.error("Data set " + dataName + " does not have direction information.");
        return;
      }
    }

    // Get formatted timestamp of dataSet and check if it has data available on that tmst
    let formattedTmst = this.getFormattedTmst(dataSet, tmst);
    if (formattedTmst == undefined) {
      console.error(dataSet.id + " at " + dataSet.timeScale + " does not contain the timespan with timestamp " + tmst);
      return;//document.createElement('span').innerHTML = 'No data for--';
    }
    // Construct WMTS url
    let templateURL = dataSet.template.replace('{Time}', formattedTmst);
    // Projection
    templateURL = templateURL.replace('{TileMatrixSet}', 'EPSG:4326'); //EPSG:4326, 3857
    // Tile matrix
    let tileMatrix = 6;
    templateURL = templateURL.replace('{TileMatrix}', tileMatrix);
    // Find tile
    let tileCol = this.lon2tile4326(long, tileMatrix);
    let tileRow = this.lat2tile4326(lat, tileMatrix);
    templateURL = templateURL.replace('{TileCol}', tileCol);
    templateURL = templateURL.replace('{TileRow}', tileRow);


    // If no direction is requested
    if (direction == undefined || direction == false) {
      // Get value from URL
      return await this.getValueAtPointFromURL(templateURL, dataSet.range, long, lat, tileMatrix);//this.getPreciseValueFromURL(templateURL, dataInfo.range);
    }


    // If direction is requested
    let animData = dataSet.animation;
    // Angle format
    if (animData.format == 'value_angle') {
      // Prepare url. Template uses the dataSet id in the layer info
      templateURL = templateURL.replace('/' + dataSet.id + '&', '/' + animData.layerNames[1] + '&');  //url = WMTSDataRetriever.setWMSParameter(url, 'LAYERS', animData.layerNames[1]);
      templateURL = this.setWMTSParameter(templateURL, 'style', 'range:0/360,cmap:gray'); // url = WMTSDataRetriever.setWMSParameter(url, 'COLORSCALERANGE', String([-360,360]));

      // Get value from URL // WARN, could it happen that it has to go from -360 to 360?
      let value = await this.getValueAtPointFromURL(templateURL, [0, 360], long, lat, tileMatrix);//this.getPreciseValueFromURL(url, [-360, 360]);
      //value = 360 - value; // Inverted colormap! Darker is 0, white is 1 ?
      return value;
    }
    // East-North format
    else if (animData.format == 'east_north') {
      // East-North layer
      let urlEast = templateURL.replace('/' + dataSet.id, '/' + animData.layerNames[0]);
      let urlNorth = templateURL.replace('/' + dataSet.id, '/' + animData.layerNames[1]);
      // Range (neg, pos)
      let range = animData.range || dataSet.range;
      urlEast = this.setWMTSParameter(urlEast, 'style', 'range:' + range[0] + '/' + range[1] + ',cmap:gray');
      urlNorth = this.setWMTSParameter(urlNorth, 'style', 'range:' + range[0] + '/' + range[1] + ',cmap:gray');

      // Call for data at the same time and wait for result
      let [east, north] = await Promise.all([
        this.getValueAtPointFromURL(urlEast, range, long, lat, tileMatrix),
        this.getValueAtPointFromURL(urlNorth, range, long, lat, tileMatrix)
      ]);

      if (east == undefined || north == undefined)
        return undefined;
      else
        // Calculate angle
        return Math.atan2(east, north) * (180 / Math.PI);
    }

  }



  // Calculate tile row and column
  lon2tile4326 = function (lon, tileMatrix) {
    return Math.floor((lon + 180) / 180 * Math.pow(2, tileMatrix));
  }
  lat2tile4326 = function (lat, tileMatrix) {
    return Math.floor((90 - lat) / 180 * Math.pow(2, tileMatrix));
  }






  // Returns the value from a WMTS URL
  getValueAtPointFromURL = async function (url, range, lon, lat, tileMatrix, mustBePrecise) {
    let img = await this.getTileFromURL(url);
    // Remove image from active requests
    this.activeRequests = this.activeRequests.filter(el => el.src != url); // Memory garbage? TODO?

    // Get normalized value from image according to lat long and tileMatrix
    let value = await this.getNormValueFromImage(img, lon, lat, tileMatrix);
    if (value == undefined) {
      this.printWarn("No data at " + url);
      return;
    }
    // Put in range of the data type (normValue * (max-min) + min)
    value = value * (range[1] - range[0]) + range[0];

    // Get precise value
    if (mustBePrecise) {
      let quantStep = (range[1] - range[0]) / 255;
      url = this.setWMTSParameter(url, 'style', 'range:' + (value - quantStep) + '/' + (value + quantStep) + ',cmap:gray');
      // Get image with very small range
      let imgPrec = await this.getTileFromURL(url);
      // Remove image from active requests
      this.activeRequests = this.activeRequests.filter(el => el.src != url); // Memory garbage? TODO?
      // Get pixel value from small-range image
      let valuePrec = await this.getNormValueFromImage(imgPrec, lon, lat, tileMatrix);
      // Put in range (normValue * (max-min) + min)
      valuePrec = valuePrec * (quantStep * 2) + value - quantStep;
      // Return value
      return valuePrec;
    }
    // Get quantized value (255 steps of range)
    else {
      return value;
    }
  }



  // Create a canvas with size 1 and extract the pixel value
  getNormValueFromImage = function (img, lon, lat, tileMatrix) {
    let canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    // TODO: canvas must have image width and height
    // TODO: get image data should target the pixel index

    // TODO: getting the column and row decimals would probably help. There is a smarter way to do this
    let tileCol = this.lon2tile4326(lon, tileMatrix);
    let tileRow = this.lat2tile4326(lat, tileMatrix);
    let tileSize = 180 / Math.pow(2, tileMatrix);
    // Get index columns
    let lonLeft = tileCol * tileSize - 180;
    let indexCol = ((lon - lonLeft) / tileSize) * canvas.width;
    // Get index rows
    let latTop = 90 - tileRow * tileSize;
    let indexRow = ((latTop - lat) / tileSize) * canvas.height;

    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0); // Instead of painting the whole image, maybe paint just a pixel?
    let pixels = ctx.getImageData(Math.floor(indexCol), Math.floor(indexRow), 1, 1);
    let pixel = pixels.data[0];
    // Alpha
    let alpha = pixels.data[3];
    if (alpha == 0)
      return undefined;
    return pixel / 255;
  }



  // Create an image element and load the image
  // HACK: errors are not catched when fetching image urls. If errors are catched, the data does not load
  getTileFromURL = function (url) {
    return new Promise((resolve, reject) => {
      // If tile was already loaded resolve
      if (window.WMTSTileManager.loadedTiles[url] != undefined) {
        resolve(WMTSTileManager.loadedTiles[url].grayImage);
      }
      // Otherwise create and load tile
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.addEventListener('load', () => {
        // Store tile in WMTSTileManager
        WMTSTileManager.loadedTiles[url] = { 'grayImage': img };
        resolve(img);
      });
      img.addEventListener('error', reject); // If reject(img), image does not load
      img.src = url;
      this.activeRequests.push(img);
      //this.printLog(url);
    })
  }






  // Cancels active requests
  cancelActiveRequests = function () {
    this.activeRequests.forEach(el => el.src = "");
    this.activeRequests = [];
  }




  // Set WMTS parameter
  setWMTSParameter(wmtsURL, paramName, paramContent) {
    // If parameter does not exist
    if (wmtsURL.indexOf(paramName + "=") == -1) {
      //console.log("Parameter ", paramName, " does not exist in WMS URL");
      return wmtsURL + '&' + paramName + '=' + paramContent;
    }
    let currentContent = this.getWMTSParameter(wmtsURL, paramName);
    return wmtsURL.replace(paramName + '=' + currentContent, paramName + '=' + paramContent);
  }

  // Get WMTS parameter
  getWMTSParameter(wmtsURL, paramName) {
    // If parameter does not exist
    if (wmtsURL.indexOf(paramName + "=") == -1) {
      console.log("Parameter ", paramName, " does not exist in WMS URL");
      return '';
    }
    let tmpSTR = wmtsURL.substr(wmtsURL.indexOf(paramName + "="));
    let endOfContent = tmpSTR.indexOf('&') == -1 ? tmpSTR.length : tmpSTR.indexOf('&');
    return tmpSTR.substring(paramName.length + 1, endOfContent);
  }


  // Verbose
  printWarnConsole = function (message) {
    console.warn(message);
  }
  printLogConsole = function (message) {
    console.log(message);
  }

}



export default WMTSDataRetriever;