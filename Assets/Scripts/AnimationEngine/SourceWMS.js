// Class that defines the source from a single WMS image
class SourceWMS {
  // Variables
  imgDataEast;
  imgDataNorth;

  canvasLongLatStep = 0.02;
  colorrange;

  //medBBOX = [-19, 36, 31, 45]; // LONG, LAT -18.12, 36.3, 45.98, 30.18 from https://resources.marine.copernicus.eu/product-detail/MEDSEA_ANALYSISFORECAST_WAV_006_017/INFORMATION
  // WMS service does not always provide the BBOX given, be careful. Check with the URL
  medBBOX = [30, -17, 45, 30]; // NOW IT IS LAT
  catseaBBOX = [-1, 36, 9, 44]; // LONG, LAT



  // Constructor
  constructor(animation) {
    this.isReady = false;
    this.animation = animation;
  }

  // When all tiles from layer are loaded, call a function
  defineOnLoadCallback(callbackOnLoad) {
    this.callbackFunc = callbackOnLoad; // Defined in Animation Engine
  }

  // Update/Change the WMS Source
  updateWMSSource(wmsURL, animation) {
    // Keep track of images loaded
    this.isReady = false;
    this.loaded = 0;
    // Store animation information defined in ForecastBar.vue
    this.animation = animation;
    this.wmsURL = wmsURL; // Only for debuggin;


    // Define WMS image url with a standard size
    // SIZE TODO: could be random size or according to lat-long extension?
    wmsURL = SourceWMS.setWMSParameter(wmsURL, 'WIDTH', '2048');
    wmsURL = SourceWMS.setWMSParameter(wmsURL, 'HEIGHT', '1024');

    // BBOX
    this.bbox = this.medBBOX;//this.catseaBBOX;
    //this.bbox3857 = this.medBBOX3857;
    wmsURL = SourceWMS.setWMSParameter(wmsURL, 'BBOX', JSON.stringify(this.bbox).replace('[', '').replace(']', ''));
    // CRS for BBOX (some services only accept 3857 boundaries?)
    //wmsURL = SourceWMS.setWMSParameter(wmsURL, 'CRS', 'EPSG:3857');

    // STYLE gray
    let style = 'boxfill/greyscale';
    wmsURL = SourceWMS.setWMSParameter(wmsURL, 'STYLES', style);

    // PROJECTION EPSG:4326 (lat and long are equally distributed in pixels)
    wmsURL = SourceWMS.setWMSParameter(wmsURL, 'PROJECTION', 'EPSG:4326');

    // OUT OF RANGE PIXELS &ABOVEMAXCOLOR=extend&BELOWMINCOLOR=extend
    wmsURL = SourceWMS.setWMSParameter(wmsURL, 'ABOVEMAXCOLOR', 'extend');
    wmsURL = SourceWMS.setWMSParameter(wmsURL, 'BELOWMINCOLOR', 'extend');

    // COLORRANGE
    this.colorrange = SourceWMS.getWMSParameter(wmsURL, 'COLORSCALERANGE').split('%2C');
    if (this.colorrange.length == 1) // Split by comma
      this.colorrange = SourceWMS.getWMSParameter(wmsURL, 'COLORSCALERANGE').split(',');
    this.colorrange = this.colorrange.map((e) => parseFloat(e));


    // Paint this image streched in a canvas of width and height related to the bounding box
    // Each pixel corresponds to a lat-long
    this.longExtension = Math.abs(this.bbox[0] - this.bbox[1]);
    this.latExtension = Math.abs(this.bbox[2] - this.bbox[3]);

    // Make canvas lat-long relationship
    let canvas = document.createElement('canvas');
    canvas.width = this.longExtension / this.canvasLongLatStep;
    canvas.height = this.latExtension / this.canvasLongLatStep;

    let ctx = canvas.getContext('2d', {willReadFrequently: false});
    //document.body.append(canvas);

    // WMS data layers
    if (animation.layerNames.length == 2){
      for (let i = 0; i < 2; i++) {
        // LAYER east and north or intensity and angle
        wmsURL = SourceWMS.setWMSParameter(wmsURL, 'LAYERS', animation.layerNames[i]);
        // For data stored in intensity and angle, the colorrange of the angle should go from 0 to 360
        if (animation.format == 'value_angle' && i == 1)
          wmsURL = SourceWMS.setWMSParameter(wmsURL, 'COLORSCALERANGE', '0,360');
        // For data stored in east-north, there range should have negative values too
          else if (animation.format == 'east_north'){
            this.colorrange[0] = -this.colorrange[1];
          wmsURL = SourceWMS.setWMSParameter(wmsURL, 'COLORSCALERANGE', this.colorrange.toString());
        } 
        
        // Get WMS image data
        console.log("Loading data source WMS images...");
        let img = new Image();
        img.crossOrigin = "Anonymous";
        // Image is loaded, paint it in the canvas and get the data
        img.onload = () => {
          // Paint streched WMS image in canvas
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
        img.src = wmsURL;
        console.log(wmsURL);
      }
    }
    
  }



  // Set WMS parameter
  static setWMSParameter(wmsURL, paramName, paramContent) {
    // If parameter does not exist
    if (wmsURL.indexOf(paramName + "=") == -1) {
      console.log("Parameter ", paramName, " does not exist in WMS URL");
      return wmsURL + '&' + paramName + '=' + paramContent;
    }
    let currentContent = SourceWMS.getWMSParameter(wmsURL, paramName);
    return wmsURL.replace(paramName + '=' + currentContent, paramName + '=' + paramContent);
  }


  // Get WMS parameter
  static getWMSParameter(wmsURL, paramName) {
    // If parameter does not exist
    if (wmsURL.indexOf(paramName + "=") == -1) {
      console.log("Parameter ", paramName, " does not exist in WMS URL");
      return '';
    }
    let tmpSTR = wmsURL.substr(wmsURL.indexOf(paramName + "="));
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
    if (this.isReady == false){
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
    if (this.animation.format == 'east_north'){
      value[0] = redE * (this.colorrange[1] - this.colorrange[0]) + this.colorrange[0]; // lat
      value[1] = redN * (this.colorrange[1] - this.colorrange[0]) + this.colorrange[0]; // long
    }
    // Images store Intensity and Angle in degrees
    else if (this.animation.format == 'value_angle'){
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

export default SourceWMS;