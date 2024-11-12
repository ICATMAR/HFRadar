


class WMTSTileManager {

  // Store loaded tiles based on URL
  // Store grayscale image (and colored image? --> this may change on user input for legend type)
  loadedTiles = {};

  // Current legend
  // Legends are loaded in FileManager, triggered by WMTSLegend.vue. This component sets the currentLegend
  // As loadProcessStoreTile is called from Map.vue when defining the wmts source, it is hard to make the 
  // data connection from Map.vue and WMTSLegend.vue so better store the information here
  currentLegend = {};
  currentRangeTransformFunc = undefined;

  constructor() {

  }


  // Tile processing
  // Legend structure can be seen in FileManager.js
  loadProcessStoreTile = (imageTile, src, inLegend) => {
    let legend = inLegend || this.currentLegend;
    // Tile image that will be finally used by OpenLayers
    const tileImg = imageTile.getImage();
    tileImg.crossOrigin = 'anonymous';
    // Standardize
    src = this.standardizeURL(src);
    // If src was already loaded
    if (this.loadedTiles[src] != undefined) {
      this.processTile(this.loadedTiles[src].grayImage, tileImg, legend);
    } else {
      // Clone the image to avoid the event source.on('tileloadend') linked to tileImg.onload
      const grayImage = tileImg.cloneNode(true);
      grayImage.onload = () => {
        this.loadedTiles[src] = { 'grayImage': grayImage }
        this.processTile(grayImage, tileImg, legend); // Triggers source.on('tileloadend')
      }
      // Work with the grayImage.onload event instead of the tileImg.load event that is linked to the tile
      grayImage.src = src;
    }
  }


  processTile = (grayImage, tileImg, legend) => {
    // Create a canvas, paint it, get pixels, modify pixels, get pixels from canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = grayImage.width;
    canvas.height = grayImage.height;
    context.drawImage(grayImage, 0, 0);
    const imageData = context.getImageData(0, 0, grayImage.width, grayImage.height);
    const modifiedImageData = this.processTileColors(imageData, legend);
    context.putImageData(modifiedImageData, 0, 0);
    tileImg.src = canvas.toDataURL(); // Triggers source.on('tileloadend')
  }


  // uses legend colors and legend range to process tile
  // This is defined in WMTSLegend.
  processTileColors = (imageData, legend) => {
    let data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let value = this.currentRangeTransformFunc(data[i] / 255);
      let colorIndex = Math.floor(value * (legend.colorsRGB.length - 1));
      // Assing colors
      data[i] = legend.colorsRGB[colorIndex][0];
      data[i + 1] = legend.colorsRGB[colorIndex][1];
      data[i + 2] = legend.colorsRGB[colorIndex][2];
    }
    return imageData;
  }


  isTileURLLoaded = (url) => {
    let standardUrl = this.standardizeURL(url);
    if (this.loadedTiles[standardUrl] != undefined)
      return true;
    else
      return false;
  }


  // Standardize / Sort WMTS parameters in url
  standardizeURL = (url) => {
    // SERVICE
    // VERSION
    // REQUEST
    // TILEMATRIXSET
    // STYLE
    // TILEMATRIX
    // TILEROW
    // TILECOL
    // LAYER
    // TIME
    // Define the desired order of parameters
    const parameterOrder = [
      'service',
      'version',
      'request',
      'tilematrixset',
      'style',
      'tilematrix',
      'tilerow',
      'tilecol',
      'layer',
      'time'
    ];

    // Separate base URL and query string
    const [baseUrl, queryString] = url.split('?');
    if (!queryString) return url; // If there's no query string, return the URL as is

    // Parse query string into an array of key-value pairs
    const params = new URLSearchParams(queryString);

    // Create an object to store the sorted parameters based on the desired order
    const sortedParams = [];

    // Add parameters in the specified order if they exist in the original URL
    parameterOrder.forEach(param => {
      if (params.has(param)) {
        sortedParams.push(`${param}=${params.get(param)}`);
        params.delete(param); // Remove from params once added
      }
    });

    // Append any remaining parameters (in case there are unexpected ones not in the desired order)
    for (const [key, value] of params.entries()) {
      sortedParams.push(`${key}=${value}`);
    }

    // Reconstruct and return the URL with sorted parameters
    return `${baseUrl}?${sortedParams.join('&')}`;
  }


}


export default WMTSTileManager;