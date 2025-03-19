// Class that defines the source from WMTS images
// WMTSDataRetriever needs to be present
// File Manager needs to be present

class SourceWMTS {
  // Variables
  imgDataEast;
  imgDataNorth;

  canvasLongLatStep = 0.02;
  colorrange;

  bbox = [-1, 36, 9, 44];
  medBBOX = [30, -17, 45, 30];
  catseaBBOX = [-1, 36, 9, 44];
  tileMatrixZoomLevel = 6;

  // Constructor
  constructor(infoWMTS) {
    this.animation = infoWMTS.dataSet.animation;
    this.dataSet = infoWMTS.dataSet;
    this.timestamp = infoWMTS.tmst;
  }

  // When all tiles from layer are loaded, call a function
  defineOnLoadCallback(callbackOnLoad) {
    this.callbackFunc = callbackOnLoad; // Defined in Animation Engine
  }

  // Update/Change the WMTS Source
  updateWMTSSource(infoWMTS, bbox) {

    this.bbox = bbox || this.bbox;

    this.dataSet = infoWMTS.dataSet;
    this.animData = infoWMTS.dataSet.animation;
    this.timestamp = infoWMTS.tmst;

    // Viewport changed (loads tiles if necessary)
    this.viewportChange(this.bbox);
  }




  // Check which tiles need loading according to a bounding box (bbox) [minLat, minLong, maxLat, maxLong]
  viewportChange(bbox) {
    // Load all tiles that cover the mediterranean area
    let rowLeft = window.WMTSDataRetriever.lon2tile4326(bbox[1], this.tileMatrixZoomLevel);
    let rowRight = window.WMTSDataRetriever.lon2tile4326(bbox[3], this.tileMatrixZoomLevel);
    let colTop = window.WMTSDataRetriever.lat2tile4326(bbox[2], this.tileMatrixZoomLevel);
    let colBottom = window.WMTSDataRetriever.lat2tile4326(bbox[0], this.tileMatrixZoomLevel);

    // Get tile columns and rows
    let tilesToLoad = [];
    for (let row = rowLeft; row <= rowRight + 1; row++) {
      for (let col = colTop; col <= colBottom + 1; col++) {
        tilesToLoad.push([row, col]);
      }
    }

    let urls = [];

    // Construct WMTS urls
    let templateURL = this.dataSet.template.replace('{Time}', this.timestamp);
    // Projection
    templateURL = templateURL.replace('{TileMatrixSet}', 'EPSG:4326'); //EPSG:4326, 3857
    // Tile matrix
    templateURL = templateURL.replace('{TileMatrix}', this.tileMatrixZoomLevel);

    // Angle format
    if (this.animData.format == 'value_angle') {
      // Prepare url. Template uses the dataSet id in the layer info
      templateURL = templateURL.replace('/' + this.dataSet.id + '&', '/' + this.animData.layerNames[1] + '&');  //url = WMTSDataRetriever.setWMSParameter(url, 'LAYERS', animData.layerNames[1]);
      templateURL = window.WMTSDataRetriever.setWMTSParameter(templateURL, 'style', 'range:0/360,cmap:gray'); // url = WMTSDataRetriever.setWMSParameter(url, 'COLORSCALERANGE', String([-360,360]));
      // Fill urls
      for (let i = 0; i < tilesToLoad.length; i++) {
        urls.push(templateURL.replace('{TileCol}', tilesToLoad[i][0]).replace('{TileRow}', tilesToLoad[i][1]));
      }
    }
    // East-North format
    else if (this.animData.format == 'east_north') {
      // Range (neg, pos)
      let range = this.animData.range || this.dataSet.range;
      templateURL = window.WMTSDataRetriever.setWMTSParameter(templateURL, 'style', 'range:' + range[0] + '/' + range[1] + ',cmap:gray');
      // East-North layer
      let urlEast = templateURL.replace('/' + this.dataSet.id, '/' + this.animData.layerNames[0]);
      let urlNorth = templateURL.replace('/' + this.dataSet.id, '/' + this.animData.layerNames[1]);
      // Fill urls
      for (let i = 0; i < tilesToLoad.length; i++) {
        urls.push(urlEast.replace('{TileCol}', tilesToLoad[i][0]).replace('{TileRow}', tilesToLoad[i][1]));
        urls.push(urlNorth.replace('{TileCol}', tilesToLoad[i][0]).replace('{TileRow}', tilesToLoad[i][1]));
      }
    }


    // Check if it must load, use FileManager
    let mustLoad = false;
    let promises = [];
    for (let i = 0; i < urls.length; i++) {
      if (!window.WMTSTileManager.isTileURLLoaded(urls[i])) {
        mustLoad = true;
        promises.push(window.WMTSDataRetriever.getTileFromURL(urls[i]));
      }
    }

    // Exit if all tiles are already loaded
    if (!mustLoad) {
      this.isReady = true;
      // Callback
      if (this.callbackFunc)
        this.callbackFunc();
      return;
    }

    // Load tiles
    this.isReady = false;
    console.log("Loading WMTS tiles for " + this.dataSet.id);
    
    Promise.allSettled(promises).then((values) => {
      this.isReady = true;
      // Callback
      if (this.callbackFunc)
        this.callbackFunc();
    });

  }






  // Get value at Long Lat
  getValueAtLongLat(long, lat, value) {

    // Construct WMTS urls
    let templateURL = this.dataSet.template.replace('{Time}', this.timestamp);
    // Projection
    templateURL = templateURL.replace('{TileMatrixSet}', 'EPSG:4326'); //EPSG:4326, 3857
    // Tile matrix
    templateURL = templateURL.replace('{TileMatrix}', this.tileMatrixZoomLevel);
    // Tile column
    let col = window.WMTSDataRetriever.lon2tile4326(long, this.tileMatrixZoomLevel);
    // Tile row
    let row = window.WMTSDataRetriever.lat2tile4326(lat, this.tileMatrixZoomLevel);
    templateURL = templateURL.replace('{TileCol}', col).replace('{TileRow}', row);

    // Angle format
    if (this.animData.format == 'value_angle') {
      // Prepare url. Template uses the dataSet id in the layer info
      templateURL = templateURL.replace('/' + this.dataSet.id + '&', '/' + this.animData.layerNames[1] + '&');  //url = WMTSDataRetriever.setWMSParameter(url, 'LAYERS', animData.layerNames[1]);
      templateURL = window.WMTSDataRetriever.setWMTSParameter(templateURL, 'style', 'range:0/360,cmap:gray'); // url = WMTSDataRetriever.setWMSParameter(url, 'COLORSCALERANGE', String([-360,360]));
      // Get img from WMTSTileManager
      if (!window.WMTSTileManager.isTileURLLoaded(templateURL)) {
        console.warn('WMTS Tile was not loaded in SourceWMTS. Requesting now.');
        window.WMTSDataRetriever.getTileFromURL(templateURL);
        value[0] = undefined; value[1] = undefined; // Reset value
        return value;
      }
      // Get angle from image
      templateURL = window.WMTSTileManager.standardizeURL(templateURL);
      let img = window.WMTSTileManager.loadedTiles[templateURL].grayImage;
      let angleNorm = window.WMTSDataRetriever.getNormValueFromImage(img, long, lat, this.tileMatrixZoomLevel);
      // Outside of bounds
      if (angleNorm == undefined) {
        value[0] = undefined; value[1] = undefined; // Reset value
        return value;
      }
      // Get intensity from angle (is this necessary?)
      let intensity = 1; // TODO: should this be a real value?
      value[1] = - Math.cos(360 * angleNorm * Math.PI / 180) * intensity;
      value[0] = - Math.sin(360 * angleNorm * Math.PI / 180) * intensity;
      return value;
    }
    // East-North format
    else if (this.animData.format == 'east_north') {
      // Range (neg, pos)
      let range = this.animData.range || this.dataSet.range;
      templateURL = window.WMTSDataRetriever.setWMTSParameter(templateURL, 'style', 'range:' + range[0] + '/' + range[1] + ',cmap:gray');
      // East-North layer
      let urlEast = templateURL.replace('/' + this.dataSet.id, '/' + this.animData.layerNames[0]);
      let urlNorth = templateURL.replace('/' + this.dataSet.id, '/' + this.animData.layerNames[1]);
      // Get img from WMTSTileManager
      if (!window.WMTSTileManager.isTileURLLoaded(urlEast) || !window.WMTSTileManager.isTileURLLoaded(urlNorth)) {
        console.warn('WMTS Tile was not loaded in SourceWMTS. Requesting now.');
        window.WMTSDataRetriever.getTileFromURL(urlEast);
        window.WMTSDataRetriever.getTileFromURL(urlNorth);
        value[0] = undefined; value[1] = undefined; // Reset value
        return value;
      }
      // Get values from image
      // Standardize urls
      urlEast = window.WMTSTileManager.standardizeURL(urlEast);
      urlNorth = window.WMTSTileManager.standardizeURL(urlNorth);
      let imgEast = window.WMTSTileManager.loadedTiles[urlEast].grayImage;
      let imgNorth = window.WMTSTileManager.loadedTiles[urlNorth].grayImage;
      let eastNormValue = window.WMTSDataRetriever.getNormValueFromImage(imgEast, long, lat, this.tileMatrixZoomLevel);
      let northNormValue = window.WMTSDataRetriever.getNormValueFromImage(imgNorth, long, lat, this.tileMatrixZoomLevel);
      value[0] = eastNormValue * (range[1] - range[0]) + range[0];
      value[1] = northNormValue * (range[1] - range[0]) + range[0];
      return value;
    }
  }


}

export default SourceWMTS;