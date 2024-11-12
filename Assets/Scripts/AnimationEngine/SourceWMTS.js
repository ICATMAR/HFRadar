// Class that defines the source from WMTS images
// WMTSDataRetriever needs to be present
// File Manager needs to be present

class SourceWMTS {
  // Variables
  imgDataEast;
  imgDataNorth;

  canvasLongLatStep = 0.02;
  colorrange;

  medBBOX = [30, -17, 45, 30];
  catseaBBOX = [-1, 36, 9, 44];
  tileMatrixZoomLevel = 6;

  // Constructor
  constructor(infoWMTS) {
    this.isReady = false;
    this.animation = infoWMTS.dataSet.animation;
    this.dataSet = infoWMTS.dataSet;
    this.timestamp = infoWMTS.tmst;
  }

  // When all tiles from layer are loaded, call a function
  defineOnLoadCallback(callbackOnLoad) {
    this.callbackFunc = callbackOnLoad; // Defined in Animation Engine
  }

  // Update/Change the WMTS Source
  updateWMTSSource(infoWMTS) {
    // In WMS, it was asking for an image covering the whole BBOX of the mediterranean.
    // In here we should check the tiles that need to be loaded according to:
    // - the med-BBOX -> only load once, but limited to this BBOX
    // - the map view -> may need to add "awaits" and promises in the functions of animation engine. It might be problematic for moving particles?

    // WMTSDataRetriever
    // Has this function to get data at a particular point and timestamp. Nevertheless, here the concept is different, as we want to load a whole
    // area and then find the data in the area. Using the function from WTMSDataRetriever might be slower.
    // getDataAtPoint = async function (dataName, tmst, lat, long, timeScale, direction) {

    // We want to use FileManager, as openlayers map loads some data already.
    // This functions could be coded in WMTSDataRetriever. Question is, whole med-bbox or map-view-bbox (dynamic loading)? Also, which resolution? Maybe try different?

    // Load all tiles that cover the mediterranean area
    let rowLeft = window.WMTSDataRetriever.lon2tile4326(this.medBBOX[1], this.tileMatrixZoomLevel);
    let rowRight = window.WMTSDataRetriever.lon2tile4326(this.medBBOX[3], this.tileMatrixZoomLevel);
    let colTop = window.WMTSDataRetriever.lat2tile4326(this.medBBOX[2], this.tileMatrixZoomLevel);
    let colBottom = window.WMTSDataRetriever.lat2tile4326(this.medBBOX[0], this.tileMatrixZoomLevel);

    let tilesToLoad = [];
    for (let row = rowLeft; row <= rowRight; row++) {
      for (let col = colTop; col <= colBottom; col++) {
        tilesToLoad.push([row, col]);
      }
    }

    let urls = [];

    // Get dataset according to timestamp
    debugger;
    let dataSet = infoWMTS.dataSet;
    let animData = infoWMTS.dataSet.animation;

    // Construct WMTS url
    let templateURL = dataSet.template.replace('{Time}', infoWMTS.tmst);
    // Projection
    templateURL = templateURL.replace('{TileMatrixSet}', 'EPSG:4326'); //EPSG:4326, 3857
    // Tile matrix
    templateURL = templateURL.replace('{TileMatrix}', this.tileMatrixZoomLevel);
    
    // Angle format
    if (animData.format == 'value_angle') {
      // Prepare url. Template uses the dataSet id in the layer info
      templateURL = templateURL.replace('/' + dataSet.id + '&', '/' + animData.layerNames[1] + '&');  //url = WMTSDataRetriever.setWMSParameter(url, 'LAYERS', animData.layerNames[1]);
      templateURL = window.WMTSDataRetriever.setWMTSParameter(templateURL, 'style', 'range:0/360,cmap:gray'); // url = WMTSDataRetriever.setWMSParameter(url, 'COLORSCALERANGE', String([-360,360]));
      // Fill urls
      for (let i = 0; i < tilesToLoad.length; i++){
        urls.push(templateURL.replace('{TileCol}', tilesToLoad[i][0]).replace('{TileRow}', tilesToLoad[i][1]));
      }
    }
    // East-North format
    else if (animData.format == 'east_north') {
      // Range (neg, pos)
      let range = animData.range || dataSet.range;
      templateURL = window.WMTSDataRetriever.setWMTSParameter(templateURL, 'style', 'range:' + range[0] + '/' + range[1] + ',cmap:gray');
      // East-North layer
      let urlEast = templateURL.replace('/' + dataSet.id, '/' + animData.layerNames[0]);
      let urlNorth = templateURL.replace('/' + dataSet.id, '/' + animData.layerNames[1]);
      // Fill urls
      for (let i = 0; i < tilesToLoad.length; i++){
        urls.push(urlEast.replace('{TileCol}', tilesToLoad[i][0]).replace('{TileRow}', tilesToLoad[i][1]));
        urls.push(urlNorth.replace('{TileCol}', tilesToLoad[i][0]).replace('{TileRow}', tilesToLoad[i][1]));
      }
    }




    debugger;


    // Keep track of images loaded
    this.isReady = false;
    this.loaded = 0;
    // Store animation information defined in ForecastBar.vue
    this.animation = animation;
    this.WMTSURL = WMTSURL; // Only for debuggin;


    // Define WMTS image url with a standard size
    // SIZE TODO: could be random size or according to lat-long extension?
    WMTSURL = SourceWMTS.setWMTSParameter(WMTSURL, 'WIDTH', '2048');
    WMTSURL = SourceWMTS.setWMTSParameter(WMTSURL, 'HEIGHT', '1024');

    // BBOX
    this.bbox = this.medBBOX;//this.catseaBBOX;
    //this.bbox3857 = this.medBBOX3857;
    WMTSURL = SourceWMTS.setWMTSParameter(WMTSURL, 'BBOX', JSON.stringify(this.bbox).replace('[', '').replace(']', ''));
    // CRS for BBOX (some services only accept 3857 boundaries?)
    //WMTSURL = SourceWMTS.setWMTSParameter(WMTSURL, 'CRS', 'EPSG:3857');

    // STYLE gray
    let style = 'boxfill/greyscale';
    WMTSURL = SourceWMTS.setWMTSParameter(WMTSURL, 'STYLES', style);

    // PROJECTION EPSG:4326 (lat and long are equally distributed in pixels)
    WMTSURL = SourceWMTS.setWMTSParameter(WMTSURL, 'PROJECTION', 'EPSG:4326');

    // OUT OF RANGE PIXELS &ABOVEMAXCOLOR=extend&BELOWMINCOLOR=extend
    WMTSURL = SourceWMTS.setWMTSParameter(WMTSURL, 'ABOVEMAXCOLOR', 'extend');
    WMTSURL = SourceWMTS.setWMTSParameter(WMTSURL, 'BELOWMINCOLOR', 'extend');

    // COLORRANGE
    this.colorrange = SourceWMTS.getWMTSParameter(WMTSURL, 'COLORSCALERANGE').split('%2C');
    if (this.colorrange.length == 1) // Split by comma
      this.colorrange = SourceWMTS.getWMTSParameter(WMTSURL, 'COLORSCALERANGE').split(',');
    this.colorrange = this.colorrange.map((e) => parseFloat(e));


    // Paint this image streched in a canvas of width and height related to the bounding box
    // Each pixel corresponds to a lat-long
    this.longExtension = Math.abs(this.bbox[0] - this.bbox[1]);
    this.latExtension = Math.abs(this.bbox[2] - this.bbox[3]);

    // Make canvas lat-long relationship
    let canvas = document.createElement('canvas');
    canvas.width = this.longExtension / this.canvasLongLatStep;
    canvas.height = this.latExtension / this.canvasLongLatStep;

    let ctx = canvas.getContext('2d', { willReadFrequently: false });
    //document.body.append(canvas);

    // WMTS data layers
    if (animation.layerNames.length == 2) {
      for (let i = 0; i < 2; i++) {
        // LAYER east and north or intensity and angle
        WMTSURL = SourceWMTS.setWMTSParameter(WMTSURL, 'LAYERS', animation.layerNames[i]);
        // For data stored in intensity and angle, the colorrange of the angle should go from 0 to 360
        if (animation.format == 'value_angle' && i == 1)
          WMTSURL = SourceWMTS.setWMTSParameter(WMTSURL, 'COLORSCALERANGE', '0,360');
        // For data stored in east-north, there range should have negative values too
        else if (animation.format == 'east_north') {
          this.colorrange[0] = -this.colorrange[1];
          WMTSURL = SourceWMTS.setWMTSParameter(WMTSURL, 'COLORSCALERANGE', this.colorrange.toString());
        }

        // Get WMTS image data
        console.log("Loading data source WMTS images...");
        let img = new Image();
        img.crossOrigin = "Anonymous";
        // Image is loaded, paint it in the canvas and get the data
        img.onload = () => {
          // Paint streched WMTS image in canvas
          // For more details: https://developer.mozilla.org/es/docs/Web/CSS/image-rendering
          ctx.clearRect(img, 0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          if (i == 0)
            this.imgDataEast = ctx.getImageData(0, 0, canvas.width, canvas.height); // Store image data
          else
            this.imgDataNorth = ctx.getImageData(0, 0, canvas.width, canvas.height); // Store image data

          this.loaded++;

          // Both layers are loaded
          if (this.loaded == 2) {
            this.isReady = true;
            //document.body.append(canvas);
            // Callback
            if (this.callbackFunc)
              this.callbackFunc();
          }
        };
        // Start loading image
        img.src = WMTSURL;
        console.log(WMTSURL);
      }
    }

  }



  // Set WMTS parameter
  static setWMTSParameter(WMTSURL, paramName, paramContent) {
    // If parameter does not exist
    if (WMTSURL.indexOf(paramName + "=") == -1) {
      console.log("Parameter ", paramName, " does not exist in WMTS URL");
      return WMTSURL + '&' + paramName + '=' + paramContent;
    }
    let currentContent = SourceWMTS.getWMTSParameter(WMTSURL, paramName);
    return WMTSURL.replace(paramName + '=' + currentContent, paramName + '=' + paramContent);
  }


  // Get WMTS parameter
  static getWMTSParameter(WMTSURL, paramName) {
    // If parameter does not exist
    if (WMTSURL.indexOf(paramName + "=") == -1) {
      console.log("Parameter ", paramName, " does not exist in WMTS URL");
      return '';
    }
    let tmpSTR = WMTSURL.substr(WMTSURL.indexOf(paramName + "="));
    let endOfContent = tmpSTR.indexOf('&') == -1 ? tmpSTR.length : tmpSTR.indexOf('&');
    return tmpSTR.substring(paramName.length + 1, endOfContent);
  }


  // Get value at Long Lat
  getValueAtLongLat(long, lat, value) {

    // If is outside bbox
    let minLong = Math.min(this.bbox[0], this.bbox[1]);
    let minLat = Math.min(this.bbox[2], this.bbox[3]);
    if (lat < minLat || lat > Math.max(this.bbox[2], this.bbox[3]) || // lat
      long < minLong || long > Math.max(this.bbox[0], this.bbox[1])) { // long
      value[0] = undefined; value[1] = undefined; // Reset value
      return value;
    }

    // If image is not loaded
    if (this.isReady == false) {
      value[0] = undefined; value[1] = undefined; // Reset value
      return value;
    }


    // Get closest pixel to long lat (nearest-neighbour interpolation)
    let colPixelPos = Math.round((long - minLong) / this.canvasLongLatStep);
    let rowPixelPos = Math.round((lat - minLat) / this.canvasLongLatStep);
    // Invert row pixel position (mirror data on the horizontal axis)
    rowPixelPos = this.imgDataEast.height - rowPixelPos;

    // Index
    let index = rowPixelPos * this.imgDataEast.width + colPixelPos;
    // Get RGB values (grayscale)
    let redE = this.imgDataEast.data[index * 4] / 255; //R east
    let redN = this.imgDataNorth.data[index * 4] / 255; //R north
    let alphaE = this.imgDataEast.data[index * 4 + 3] / 255; // Alpha

    // Low alpha
    if (alphaE < 0.1) {
      value[0] = undefined; value[1] = undefined; // Reset value
      return value;
    }


    // Rescale RGB value to real unit
    // Images store East and North intensity
    if (this.animation.format == 'east_north') {
      value[0] = redE * (this.colorrange[1] - this.colorrange[0]) + this.colorrange[0]; // lat
      value[1] = redN * (this.colorrange[1] - this.colorrange[0]) + this.colorrange[0]; // long
    }
    // Images store Intensity and Angle in degrees
    else if (this.animation.format == 'value_angle') {
      let intensity = redE * (this.colorrange[1] - this.colorrange[0]) + this.colorrange[0];
      let angle = redN * 360;
      value[1] = - 0.1 * Math.cos(angle * Math.PI / 180) * intensity;
      value[0] = - 0.1 * Math.sin(angle * Math.PI / 180) * intensity;
    }

    //console.log(long + ", " + lat + ", " + value);

    return value;
  }

  /*getValueAtPixel(pixel, value) {

    let index = pixel[0] * this.imgDataEast.width + pixel[1];
    if (index > this.imgDataEast.data.length)
      return [0, 0];

    // Get RGB values (grayscale)
    let redE = this.imgDataEast.data[index * 4] / 255; //R east
    let redN = this.imgDataNorth.data[index * 4] / 255; //R north
    // Rescale RGB value to real unit
    value[0] = redE * (this.colorrange[1] - this.colorrange[0]) + this.colorrange[0]; // lat
    value[1] = redN * (this.colorrange[1] - this.colorrange[0]) + this.colorrange[0]; // long

    return value
  }*/

}

export default SourceWMTS;