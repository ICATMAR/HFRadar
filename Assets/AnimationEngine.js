// Classes defined here:

// AnimationEngine
// SourceWMS
// SourceHFRadar
// ParticleSystem
// Particle

// Constants
const earthRadius = 6378;
const HFRADARRANGE = [-100, 100];
const LEGENDURLS = [
  './Assets/Legends/GreenBlueWhiteOrangeRed.png',
  './Assets/Legends/BlueWhiteRed.png',
  './Assets/Legends/ModifiedOccam.png'
];

class AnimationEngine {
  // Static variables
  static numActiveAnimations = 0;

  // Variables
  prevTime = 0;
  canvasParticles = undefined;
  source = undefined;
  particles = undefined;
  frameTime = 0;
  FRAMERATE = 40; // in ms
  isDestroyed = false;
  isStopped = false;
  

  // Constructor
  /*
  * inCanvas: canvas element
  * inMap: OLmap
  * animInfo: {
  *   wmsURL: ..
  *   animation: {
  *     type: 'velocity', 'wave', or 'whiteWave'
  *     format: 'value_angle' or 'east_north'
  *   }
  * } or {
  *   HFRadarData: [Length][Latitude(deg), Longitude (deg), U-Comp (cms/s), V-comp (cms/s)]
  * }
  * 
  * isHFRadar: radar flag data
  */
  constructor(inCanvas, inMap, animInfo, legend){
    AnimationEngine.numActiveAnimations += 1; // Count the active animations

    this.canvasParticles = inCanvas; // Canvas
    this.map = inMap; // OL map
    // Set height and width of the canvas
    this.canvasParticles.width = this.map.getViewport().offsetWidth;
    this.canvasParticles.height = this.map.getViewport().offsetHeight;
    // Set up variable for when map is moving
    this.mapIsMoving = false;
    // https://stackoverflow.com/questions/11565471/removing-event-listener-which-was-added-with-bind
    // Bind the event listeners
    this.onMapMoveStart = this.onMapMoveStart.bind(this);
    this.onMapMoveEnd = this.onMapMoveEnd.bind(this);

    // Create WMS source
    if (animInfo.wmsURL){
      this.source = new SourceWMS(animInfo.animation);
      // Create particle system
      this.particles = new ParticleSystem(this.canvasParticles, this.source, this.map);
      this.particles.clear();

      // Define callback when data is loaded
      //this.source.defineOnLoadCallback(this.particles.repositionParticles.bind(this.particles));
      this.source.defineOnLoadCallback(this.onSourceLoad.bind(this));

      // Load data
      this.source.updateWMSSource(animInfo.wmsURL, animInfo.animation);

      // Start drawing loop (only once)
      this.update();
    }

    // Create HFRadar source
    if (animInfo.HFRadarData){
      this.source = new SourceHFRadar(animInfo.HFRadarData);
      // Create particle system
      this.particles = new ParticleSystemHF(this.canvasParticles, this.source, this.map, this.legend);
      this.particles.clear();
      // Start drawing loop (must call it only once)
      this.update();
    }

    // Create CombinedRadar source
    if (animInfo.CombinedRadarData){
      this.source = new SourceCombinedRadar(animInfo.CombinedRadarData);
      // Create particle system
      this.particles = new ParticleSystem(this.canvasParticles, this.source, this.map);
      this.particles.clear();
      this.particles.repositionParticles();
      // Start drawing loop (only once)
      this.update();
    }

    // Load color legends if it was not passed as a constructor
    // TODO: THIS SHOULD NOT BE NECESSARY
    if (!legend){
      window.getLegend(LEGENDURLS[0], 20)
        .then(legend => {
          this.legend = legend;
          this.particles.updateLegend(legend);
          console.log("Legend was undefined")
        });
    } else {
      this.legend = legend;
      this.particles.updateLegend(legend);
    }
  }

  destroyer(){
    AnimationEngine.numActiveAnimations += -1;
    this.isDestroyed = true;
  }

  // Functions
  setWMSSource(wmsURL, animation){
    // Create source
    this.source = new SourceWMS(animation);
    // Create particle system
    this.particles = new ParticleSystem(this.canvasParticles, this.source, this.map);
    this.particles.clear();

    // Define callback when data is loaded
    //this.source.defineOnLoadCallback(this.particles.repositionParticles.bind(this.particles));
    this.source.defineOnLoadCallback(this.onSourceLoad.bind(this));

    // Load data
    this.source.updateWMSSource(wmsURL, animation);
  }


  setHFRadarData(HFRadarData){
    this.source.updateData(HFRadarData);
    this.particles.updateSource(this.source);
    this.particles.clear();
  }

  setCombinedRadarData (CombinedRadarData){
    this.source.updateData(CombinedRadarData);
    this.particles.updateSource(this.source);
    this.particles.clear();
    this.particles.repositionParticles();
  }


  // Update legend colors
  updateLegend(legend){
    this.legend = legend;
    this.particles.updateLegend(legend);
  }


  // Update the animation
  update(){
    // Check if it is deleted before anything else, to stop de loop
    if (this.canvasParticles.parentElement == null){
      console.log("destroyed")
      return;
    }
    if (this.isDestroyed){
      console.log("destroyed by destroyer");
      return;
    }
    if (this.isStopped){
      console.log("Animation stopped");
      return;
    }
    
    // Update timer
    let timeNow = performance.now();
    let dt = (timeNow - this.prevTime) / 1000; // in seconds;
    this.frameTime = dt;
    this.prevTime = timeNow;

    // If data is loaded and layer is visible
    if (this.source){
      //console.log(this.source.wmsURL);
      if (this.source.isReady)
        if (!this.mapIsMoving)
          this.particles.draw(dt);
    }

    // Loop
    //var that = this;
    //setTimeout(function() {that.update()}, that.FRAMERATE); // Frame rate in milliseconds
    setTimeout(() => this.update() , this.FRAMERATE);
  }


  // Callback when source is loaded
  onSourceLoad(){
    console.log("Source loaded!");
    // Reposition particles when data is loaded
    this.particles.repositionParticles();
  }

  clearCanvas(){
    if (this.particles)
      this.particles.clear();
  }

  resizeCanvas(){
    // Resize animation canvas
    this.canvasParticles.width = this.map.getViewport().offsetWidth;
    this.canvasParticles.height = this.map.getViewport().offsetHeight;
    // Resize num of particles
    if (typeof this.particles.resizeNumParticles === 'function')
      this.particles.resizeNumParticles();
  }


  // Callback when map size changes
  onMapMoveEnd(){
    this.resizeCanvas();
    this.mapIsMoving = false;
    if (this.source) {
      if (this.source.isReady){
        this.particles.repositionParticles();
      }
    }
    if (this.legend)
      this.updateLegend(this.legend);
  }
  onMapMoveStart() {
    if (this.particles)
      this.particles.clear();
    this.mapIsMoving = true;
  }




  // PUBLIC METHOD
  static getNumActiveAnimations(){
    return AnimationEngine.numActiveAnimations;
  }
  
}








// Class that defines the source from a single WMS image
class SourceWMS {
  // Variables
  imgDataEast;
  imgDataNorth;

  canvasLongLatStep = 0.02;
  colorrange;

  //medBBOX = [-19, 36, 31, 45]; // LONG, LAT -18.12, 36.3, 45.98, 30.18 from https://resources.marine.copernicus.eu/product-detail/MEDSEA_ANALYSISFORECAST_WAV_006_017/INFORMATION
  // WMS service does not always provide the BBOX given, be careful. Check with the URL
  medBBOX = [-17, 30, 30, 45];
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
    wmsURL = SourceWMS.setWMSParameter(wmsURL, 'BBOX', JSON.stringify(this.bbox).replace('[', '').replace(']', ''));
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
    this.colorrange = this.colorrange.map((e) => parseFloat(e));


    // Paint this image streched in a canvas of width and height related to the bounding box
    // Each pixel corresponds to a lat-long
    this.longExtension = Math.abs(this.bbox[0] - this.bbox[1]);
    this.latExtension = Math.abs(this.bbox[2] - this.bbox[3]);

    // Make canvas lat-long relationship
    let canvas = document.createElement('canvas');
    canvas.width = this.longExtension / this.canvasLongLatStep;
    canvas.height = this.latExtension / this.canvasLongLatStep;

    let ctx = canvas.getContext('2d');
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
    return wmsURL.replace(currentContent, paramContent);
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












// HFRadar data source
class SourceHFRadar {

  constructor(HFRadarData){
    this.data = HFRadarData;
    this.isReady = true;
  }

  updateData(HFRadarData){
    this.data = HFRadarData;
  }
}


// Combined Radar data source
class SourceCombinedRadar {

  constructor (CombinedRadarData){
    this.dataGrid = CombinedRadarData;
    this.isReady = true;
    this.animation = {
      type: 'velocity'
    };
  }

  updateData(CombinedRadarData) {
    this.dataGrid = CombinedRadarData;
    // SOMETHING ELSE HERE?
  }


  getValueAtLongLat(long, lat, value){
    
    let grid = this.dataGrid; 

    let longIndex = Math.floor(grid.numLongPoints * (long - grid.minLong) / grid.rangeLong);
    let latIndex = Math.floor(grid.numLatPoints * (lat - grid.minLat) / grid.rangeLat);
    longIndex = longIndex == -1 ? 0 : longIndex;
    latIndex = latIndex == -1 ? 0 : latIndex;

    // Indices are outside the data grid
    if (longIndex < 0 || latIndex < 0 || longIndex >= grid.numLongPoints || latIndex >= grid.numLatPoints){
      //console.log("Index out of bounds. longIndex: " + longIndex + ", latIndex: " + latIndex + ", Resolution: " + grid.numLongPoints + "x" + grid.numLatPoints);
      value[0] = undefined;
      value[1] = undefined;
      return value;
    }

    // Find value
    let index = latIndex * grid.numLongPoints + longIndex;
    value[0] = grid.dataGrid[ index * 2];
    value[1] = grid.dataGrid[ index * 2 + 1];

    return value;
  }
}











class ParticleSystemHF {

  constructor(canvas, source, olMap, legend){
    // Canvas
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    // Source
    this.source = source;
    // Map
    this.map = olMap;
    // Legend
    this.legend = legend;
    // Num particles
    this.numParticles = source.data.length;
    // Create particles
    this.particles = [];
    
    for (let i = 0; i < this.numParticles; i++){
      this.particles[i] = new ParticleHF(this, this.source.data[i], legend);
    }
  }


  // Clear canvas and reset particles. Important when the map moves, because some undesired lines appear
  clear(){
    this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
  }
  

  // Update source
  updateSource(source){
    // Source
    this.source = source;
    // Num particles
    this.numParticles = source.data.length;
    // Create particles
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++){
      this.particles[i] = new ParticleHF(this, this.source.data[i], this.legend);
    }
  }

  repositionParticles(){
    for (let i = 0; i < this.numParticles; i++)
      this.particles[i].repositionParticle();

  }

  updateLegend(legend){
    this.legend = legend;
    for (let i = 0; i < this.numParticles; i++)
      this.particles[i].updateLegend(legend);
  }



  draw(dt){
    // Trail effect
    // https://codepen.io/Tyriar/pen/BfizE
    this.ctx.fillStyle = 'rgba(255, 255, 255, .95)';
    this.ctx.globalCompositeOperation = "destination-in";
    this.ctx.fillRect(0,0, this.canvas.width, this.canvas.height);
    this.ctx.globalCompositeOperation = "source-over";
    // Trail color
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';

    // Line style
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    
    for (let i = 0; i < this.numParticles; i++)
      this.particles[i].draw(dt);
    this.ctx.stroke();

  }
}







class ParticleHF {

  constructor(particleSystem, dataPoint, legend){
    this.particleSystem = particleSystem;
    this.dataPoint = dataPoint;
    this.legend = legend;

    this.life = Math.random();
    this.color = [255,255,255];

    // Create two vertices per data point to define the movement of the particle
    // Measuring position
    this.lat = dataPoint['Latitude (deg)'];
    this.long = dataPoint['Longitude (deg)'];

    // Current magnitude
    let u = dataPoint['U-comp (cm/s)'];
    let v = dataPoint['V-comp (cm/s)'];
    this.magnitude = Math.sqrt(u*u + v*v);
    // Direction from radar
    this.signedMagnitude = this.dataPoint['Velocity (cm/s)'];

    // Color according to magnitude (if legend does not exist)
    if (!this.legend || dataPoint["Site Contri #1"] !== undefined){
      let colorLegend = [
        [93.3, 'b40023'], 
        [86.7, 'dc1820'],
        [80, 'ed2d1c'],
        [73.3, 'f54020'],
        [66.7, 'fa7034'],
        [60, 'fc964b'],
        [53.3, 'ffb664'],
        [46.7, 'fcd97d'],
        [40, 'ffee9f'],
        [33.3, 'eef7d9'],
        [26.7, 'c6e7b5'],
        [20, '97daa8'],
        [13.3, '80cdc1'],
        [6.7, '3c9dc2'],
        [0, '2468b4']
      ];
      colorLegend.reverse();
      let binIndex = colorLegend.length - 1;
      for (let i = 0; i < colorLegend.length-1; i++){
        if (this.magnitude > colorLegend[i][0] && this.magnitude < colorLegend[i+1][0])
          binIndex = i;
      }
      this.color = colorLegend[binIndex][1];
    }
    // Use loaded legend
    else{
      this.defineColorWithLegend();
    }
    
      

    
    // From dataPoint origin, move along the dir to define start and ending points of drawing path
    this.nextLong = dataPoint['Longitude (deg)'] + ((u/this.magnitude) / earthRadius) * (180 / Math.PI) / Math.cos(dataPoint['Latitude (deg)'] * Math.PI / 180);
    this.nextLat = dataPoint['Latitude (deg)'] + ((v/this.magnitude) / earthRadius) * (180 / Math.PI);
    // Move the starting point a bit backward
    this.long = dataPoint['Longitude (deg)'] + ((-u*0.5/this.magnitude) / earthRadius) * (180 / Math.PI) / Math.cos(dataPoint['Latitude (deg)'] * Math.PI / 180);
    this.lat = dataPoint['Latitude (deg)'] + ((-v*0.5/this.magnitude) / earthRadius) * (180 / Math.PI);

    // Get points in pixel coordinates and position particle's path on screen
    this.repositionParticle();
  
    this.isCreated = true;
  }


  repositionParticle(){
    let coord = ol.proj.transform([this.long, this.lat], 'EPSG:4326', 'EPSG:3857');
    this.startPoint = this.particleSystem.map.getPixelFromCoordinate(coord);
    
    coord = ol.proj.transform([this.nextLong, this.nextLat], 'EPSG:4326', 'EPSG:3857');
    this.endPoint = this.particleSystem.map.getPixelFromCoordinate(coord);
  }


  
  updateLegend(legend){
    this.legend = legend;
    this.defineColorWithLegend();
  }
  // These values depend on the variable range defined at the beginning of the file
  defineColorWithLegend(legend){
    legend = legend || this.legend;
    if(legend == undefined)
      return;

    let steps = legend.colorsStr.length;
    let range = HFRADARRANGE;
    let unitStep = (range[1] - range[0])/steps;
    let mag = this.signedMagnitude;
    // Find color according to magnitude and legend
    // Top bottom limits
    if (mag < range[0])
      this.color = legend.colorsStr[0];
    else
      this.color = legend.colorsStr[steps -1];
    for (let i = 0; i < steps-1; i++){
      let lowLim = range[0] + i*unitStep;
      let highLim = range[0] + (i+1)*unitStep;
      if (mag > lowLim && mag < highLim){
        this.color = legend.colorsStr[i];
        i = steps;
      }
    }
  }




  // Draw particle (wave)
  draw(dt){
    if (!this.isCreated)
      return;
    // Prevent error? TODO: STARTS DRAWING BEFORE DATA IS LOADED?
    if (!this.startPoint || this.startPoint == null){
      this.repositionParticle();
      return;
    }
    // Update life
    let lifeIncrement = 0.01*2 + this.magnitude*0.001; // speed etc..
    this.life += lifeIncrement;
    // Reset life
    if (this.life > 1){
      this.life = 0;
    }

    // Interpolated pixel positioning
    let interpCoeff = 1 - this.life;
    let nextCoeff = 1 - (this.life + lifeIncrement);
    let x = this.startPoint[0]*interpCoeff + this.endPoint[0] * (1- interpCoeff);
    let y = this.startPoint[1]*interpCoeff + this.endPoint[1] * (1- interpCoeff);

    let nextX = this.startPoint[0]*nextCoeff + this.endPoint[0] * (1- nextCoeff);
    let nextY = this.startPoint[1]*nextCoeff + this.endPoint[1] * (1- nextCoeff);
    
    
    // Varying alpha (strongest alpha in the middle of the path)
    let alphaFactor = 16 * Math.pow((1 - this.life) * (this.life), 2);



    // Draw in canvas
    let canvas = this.particleSystem.canvas;
    let ctx = this.particleSystem.ctx;
    
    // Change line width according to distance to radar?
    ctx.stroke();
    ctx.beginPath();
    ctx.lineWidth = 10;
    // Change color according to legend?
    //let colorStr = 'rgba(' + this.color[0] + ',' + this.color[1] + ',' + this.color[2] + ', ' + alphaFactor * 0.5 + ')'
    alphaFactor = Math.round(Math.min(alphaFactor*255, 255));
    // Check the format of the color
    let colorStr = '';
    if (this.color[0] == 'r')
      colorStr = this.color.replace(')', ', ' + alphaFactor/255 + ')');
    else // Hex
      colorStr =  '#' + this.color + alphaFactor.toString(16).padStart(2,'0');
    ctx.strokeStyle = colorStr; // Makes the app go slow, consider something different
    ctx.moveTo(x, y)
    ctx.lineTo(nextX, nextY);
  }



  
}












// Class that manages the particle system
class ParticleSystem {
  // Variables
  fullScreenNumParticles = 10000;
  speedFactor = 0.7;
  fullScreenPixels = 1920 * 1080;

  // Constructor
  constructor(canvas, source, olMap){
    // Canvas
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    // Source
    this.source = source;
    // Map
    this.map = olMap;
    // Number of particles
    this.resizeNumParticles();
    
    // Create particles
    this.particles = [];
    for (let i = 0; i < this.fullScreenNumParticles; i++){
      if (this.source.constructor.name == 'SourceCombinedRadar'){
        this.particles[i] = new ParticleCombinedRadar(this);
      }
      else
        this.particles[i] = new Particle(this);
    }
  }


  updateSource(source){
    this.source = source;
  }


  // Functions
  // Set num particles according to the number of pixels and source
  resizeNumParticles(){
    //if (this.source.constructor.name == 'SourceWMS'){
      let numPixels = this.canvas.width * this.canvas.height;
      let numParticlesFactor = numPixels / this.fullScreenPixels;
      // Active number of animations
      numParticlesFactor /= AnimationEngine.getNumActiveAnimations();
      // Define number of particles
      this.numParticles = Math.min(Math.round(numParticlesFactor * this.fullScreenNumParticles), this.fullScreenNumParticles);
    //} else if (this.source.constructor.name == 'SourceHFRadar'){
    //}
  }
  // Reposition particles
  repositionParticles(){
    for (let i = 0; i < this.numParticles; i++)
      this.particles[i].repositionParticle();
  }

  // Clear canvas and reset particles. Important when the map moves, because some undesired lines appear
  clear(){
    this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
  }

  draw(dt) {
    
    // Trail effect
    // https://codepen.io/Tyriar/pen/BfizE
    this.ctx.fillStyle = 'rgba(255, 255, 255, .9)';
    this.ctx.globalCompositeOperation = "destination-in";
    this.ctx.fillRect(0,0, this.canvas.width, this.canvas.height);
    this.ctx.globalCompositeOperation = "source-over";
    // Trail color
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';

    // Line style
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    for (let i = 0; i < this.numParticles; i++)
      this.particles[i].draw(dt);
    this.ctx.stroke();
  }


  updateLegend(legend){
    this.legend = legend;
    for (let i = 0; i < this.numParticles; i++)
      this.particles[i].updateLegend(legend);
  }

}






// Particle class
class Particle {
  // Variables
  numVerticesPath = 20;
  stepInPixels = 20; // Step (ideally in lat, long, not in pixels)
  color = [0,0,0];

  // Constructor
  constructor(particleSystem){
    this.particleSystem = particleSystem;
    this.life = Math.random();
    
    // Variable for optimization
    this.valueVec2 = [0,0];
    this.pointVec2 = [0,0];
    // Variables for drawing
    this.prevPos = [0,0];
    this.currentPos = [0,0];

    // Define color with legend (if present)
    this.defineColorWithLegend();

    // Drawing function
    if (particleSystem.source.animation.type == 'velocity'){
      this.draw = this.drawVelocity;
      this.numVerticesPath = 20;
      this.stepInPixels = 20;
    }
    else if (particleSystem.source.animation.type == 'wave'){
      this.draw = this.drawWaves;
      this.numVerticesPath = 8;
      this.stepInPixels = 20;
    }
    else if (particleSystem.source.animation.type == 'whiteWave'){
      this.draw = this.drawWaves;
      this.numVerticesPath = 4;
      this.stepInPixels = 20;
      this.color = [255,255,255];
      this.particleSystem.speedFactor = 6;
    }

    this.vertices = new Float32Array(this.numVerticesPath * 2); // XY values
    this.verticesValue = new Float32Array(this.numVerticesPath); // Wind/Current/Wave
  }

  // Functions
  // Reposition particle
  repositionParticle(){
    // Reset previous position for painting path
    this.prevPos[0] = undefined;
    this.prevPos[1] = undefined;
    // Generate starting vertex with initial value
    this.generatePoint(this.pointVec2, this.valueVec2);
    // Assign initial position
    this.vertices[0] = this.pointVec2[0];
    this.vertices[1] = this.pointVec2[1];

    // Create vertices path
    for (var i = 1; i < this.numVerticesPath; i++){
      // Make step
      // North is inverted because of pixels (less pixels, more north)
      this.pointVec2[0] += this.valueVec2[0] * this.stepInPixels || 0; // 0 if there is no data
      this.pointVec2[1] -= this.valueVec2[1] * this.stepInPixels || 0; // 0 if there is no data
      // Assign positions to vertices array
      this.vertices[i*2] = this.pointVec2[0];
      this.vertices[i*2 + 1] = this.pointVec2[1];
      // Get new value according to point
      //this.valueVec2 = this.particleSystem.source.getValueAtPixel(this.pointVec2, this.valueVec2); // Is rounding the pixel movement, could be done with floats
      
      // Transform pixel to long lat
      let coord = this.particleSystem.map.getCoordinateFromPixel(this.pointVec2);
      coord = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');
      // Get new value according to longitude and latitude
      this.valueVec2 = this.particleSystem.source.getValueAtLongLat(coord[0], coord[1], this.valueVec2);
      // Assign values
      if (this.valueVec2[0] !== undefined)
        this.verticesValue[i] = Math.sqrt(this.valueVec2[0]*this.valueVec2[0] + this.valueVec2[1]*this.valueVec2[1]);
    }
    
  }


  // Generate new point
  // Could be done more intelligent, like taking the extent of the layer from openlayers or the WMS service
  generatePoint(point, value, callStackNum){
    callStackNum = callStackNum || 1;
    // Generate random X,Y number
    point[0] = Math.random() * this.particleSystem.canvas.width;
    point[1] = Math.random() * this.particleSystem.canvas.height;
    // Check if it has data
    if (point[0] == undefined || isNaN(point[0]) || point[0] == null)
      console.error(point);
    // Get value at pixel
    // Transform pixel to long lat
    let coord = this.particleSystem.map.getCoordinateFromPixel(point); // returns [long,lat]?
    if (coord == null && callStackNum < 20){ // Library is not loaded yet?
      this.generatePoint(point, value, callStackNum + 1);
    } else if (callStackNum >= 20) // Library is not yet loaded
      return;
    coord = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');
    // Get value at long lat from source
    //value = this.particleSystem.source.getValueAtPixel(point, value);
    value = this.particleSystem.source.getValueAtLongLat(coord[0], coord[1], value);
    

    // If pixel does not contain data, throw it again at least 20 times
    if (value[0] == undefined && callStackNum < 20){
      this.generatePoint(point, value, callStackNum + 1); // Recursive function
    }
  }


  // Draw / Update
  drawVelocity(dt){

    // Update life
    this.life += 0.005 + this.particleSystem.speedFactor * 0.1 * this.verticesValue[Math.round(this.life * this.numVerticesPath)];
    // Reset life
    if (this.life > 1 || isNaN(this.life)) {
      this.life = Math.random();
      // Start of vertices path
      this.prevPos[0] = undefined;
      this.prevPos[1] = undefined;
    }

    // Get exact position
    let prevVertPath = Math.floor(this.life * (this.numVerticesPath-1)); // From 0 to numVerticesPath
    let nextVertPath = Math.ceil(this.life * (this.numVerticesPath-1)); // From 0 to numVerticesPath

    // Interpolation value
    let interpCoeff = (nextVertPath - this.life * (this.numVerticesPath-1));
    this.currentPos[0] = interpCoeff * this.vertices[prevVertPath*2]  +
                (1-interpCoeff) * this.vertices[nextVertPath*2];
    this.currentPos[1] = interpCoeff * this.vertices[prevVertPath*2 + 1]  +
                (1-interpCoeff) * this.vertices[nextVertPath*2 + 1];

    // When prevPos is not valid (map moved, source changed, etc)
    if (this.prevPos[0] == undefined){
      this.prevPos[0] = this.currentPos[0];
      this.prevPos[1] = this.currentPos[1];
      return;
    }
      

    // Draw in canvas
    let ctx = this.particleSystem.ctx;

    // Change color
      ctx.stroke();
      ctx.beginPath();
      //ctx.lineWidth = Math.max(value*15, 4);
      //ctx.fillStyle = 'rgba(0, 0, 0, ', alphaFactor*0.0, ')';
      let colorStr = 'rgba(' + this.color[0] + ',' + this.color[1] + ',' + this.color[2] + ', ' + 0.7 + ')'
      ctx.strokeStyle = colorStr; // Makes the app go slow, consider something different

    ctx.moveTo(this.prevPos[0], this.prevPos[1])
    ctx.lineTo(this.currentPos[0], this.currentPos[1]);

    // Assign prevPos
    this.prevPos[0] = this.currentPos[0];
    this.prevPos[1] = this.currentPos[1];

  }


  // Draw waves
  drawWaves(dt){
    // Value
    let value = this.verticesValue[Math.round(this.life * this.numVerticesPath)];
    // Update life
    this.life += 0.01 + this.particleSystem.speedFactor * 0.01;
    // Reset life
    if (this.life > 1 || isNaN(this.life)) {
      this.life = Math.random();
      // Start of vertices path
      this.prevPos[0] = undefined;
      this.prevPos[1] = undefined;
    }

    // Get exact position
    let prevVertPath = Math.floor(this.life * (this.numVerticesPath - 1)); // From 0 to numVerticesPath
    let nextVertPath = Math.ceil(this.life * (this.numVerticesPath - 1)); // From 0 to numVerticesPath

    // Interpolation value
    let interpCoeff = (nextVertPath - this.life * (this.numVerticesPath - 1));
    this.currentPos[0] = interpCoeff * this.vertices[prevVertPath * 2] +
      (1 - interpCoeff) * this.vertices[nextVertPath * 2];
    this.currentPos[1] = interpCoeff * this.vertices[prevVertPath * 2 + 1] +
      (1 - interpCoeff) * this.vertices[nextVertPath * 2 + 1];

    // When prevPos is not valid (map moved, source changed, etc)
    if (this.prevPos[0] == undefined) {
      this.prevPos[0] = this.currentPos[0];
      this.prevPos[1] = this.currentPos[1];
      return;
    }

    // Varying alpha (strongest alpha in the middle of the path)
    let alphaFactor = 16 * Math.pow((1 - this.life) * (this.life), 2);

    // Draw in canvas
    let ctx = this.particleSystem.ctx;
    // Change linewidth according to value
    ctx.stroke();
    ctx.beginPath();
    ctx.lineWidth = Math.max(value*15, 4);
    //ctx.fillStyle = 'rgba(0, 0, 0, ', alphaFactor*0.0, ')';
    let colorStr = 'rgba(' + this.color[0] + ',' + this.color[1] + ',' + this.color[2] + ', ' + alphaFactor * 0.5 + ')'
    ctx.strokeStyle = colorStr; // Makes the app go slow, consider something different
    ctx.moveTo(this.prevPos[0], this.prevPos[1])
    ctx.lineTo(this.currentPos[0], this.currentPos[1]);

    // Assign prevPos
    this.prevPos[0] = this.currentPos[0];
    this.prevPos[1] = this.currentPos[1];
  }



  updateLegend(legend){
    this.legend = legend;
    this.defineColorWithLegend();
  }
  // These values depend on the variable range defined at the beginning of the file
  defineColorWithLegend(legend){
    return;
    legend = legend || this.legend;
    if(legend == undefined)
      return;

    let steps = legend.colorsStr.length;
    let range = HFRADARRANGE; // HACK, THE SOURCE SHOULD HAVE THE RANGE: this.particleSystem.source.dataRange;
    let unitStep = (range[1] - range[0])/steps;
    let mag = this.signedMagnitude;
    // Find color according to magnitude and legend
    // Top bottom limits
    if (mag < range[0])
      this.color = legend.colorsStr[0];
    else
      this.color = legend.colorsStr[steps -1];
    for (let i = 0; i < steps-1; i++){
      let lowLim = range[0] + i*unitStep;
      let highLim = range[0] + (i+1)*unitStep;
      if (mag > lowLim && mag < highLim){
        this.color = legend.colorsStr[i];
        i = steps;
      }
    }
  }


}











// Particle extension for CombinedRadar particle
class ParticleCombinedRadar extends Particle {

  constructor(particleSystem){
    super(particleSystem);

    particleSystem.speedFactor = 0.01;
    this.stepInPixels = 0.1;
    this.color = [255,255,255];
  }

  // Overwrite
  repositionParticle(){
    // Reset previous position for painting path
    this.prevPos[0] = undefined;
    this.prevPos[1] = undefined;
    // Generate starting vertex with initial value
    this.generatePoint(this.pointVec2, this.valueVec2);

    // Assign initial position
    this.vertices[0] = this.pointVec2[0];
    this.vertices[1] = this.pointVec2[1];

    // Create vertices path
    // There is an advantge of storing pixel location: when painting we dont need to transform from lat-long to screen space
    for (var i = 1; i < this.numVerticesPath; i++){
      // Make step
      // North is inverted because of pixels (less pixels, more north)
      this.pointVec2[0] += this.valueVec2[0] * this.stepInPixels || 0; // 0 if there is no data
      this.pointVec2[1] -= this.valueVec2[1] * this.stepInPixels || 0; // 0 if there is no data
      // Assign positions to vertices array
      this.vertices[i*2] = this.pointVec2[0];
      this.vertices[i*2 + 1] = this.pointVec2[1];

      // Transform pixel to long lat
      let coord = this.particleSystem.map.getCoordinateFromPixel(this.pointVec2);
      coord = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');
      // Get new value according to longitude and latitude
      this.valueVec2 = this.particleSystem.source.getValueAtLongLat(coord[0], coord[1], this.valueVec2);
      // Assign values
      if (this.valueVec2[0] !== undefined)
        this.verticesValue[i] = Math.sqrt(this.valueVec2[0]*this.valueVec2[0] + this.valueVec2[1]*this.valueVec2[1]);
    }
  }



  // Overwrite
  generatePoint(point, value, callStackNum){
    callStackNum = callStackNum || 1;
    // TODO: MOVE THIS OUTSIDE THIS RECURSIVE FUNCTION
    // Generate coordinates according to grid and map
    // Get grid
    let grid = this.particleSystem.source.dataGrid; 
    // Get map range
    let extent = this.particleSystem.map.getView().calculateExtent();
    let mapExtentMin = ol.proj.transform([extent[0], extent[1]], 'EPSG:3857', 'EPSG:4326');
    let mapExtentMax = ol.proj.transform([extent[2], extent[3]], 'EPSG:3857', 'EPSG:4326');
    let mapMinLong = mapExtentMin[0];
    let mapMinLat = mapExtentMin[1];
    let mapMaxLong = mapExtentMax[0];
    let mapMaxLat = mapExtentMax[1];
    // Find the area visible and covered by the data grid
    let minLong = Math.max(grid.minLong, mapMinLong);
    let maxLong = Math.min(grid.maxLong, mapMaxLong);
    let minLat = Math.max(grid.minLat, mapMinLat);
    let maxLat = Math.min(grid.maxLat, mapMaxLat);
    let rangeLong = maxLong - minLong;
    let rangeLat = maxLat - minLat;

    let longPoint = Math.random() * rangeLong + minLong;
    let latPoint = Math.random() * rangeLat + minLat;

    // Get value
    value = this.particleSystem.source.getValueAtLongLat(longPoint, latPoint, value);
    // If pixel does not contain data, throw it again at least 20 times
    if (value[0] == undefined && callStackNum < 20){
      this.generatePoint(point, value, callStackNum + 1); // Recursive function
    }

    // Transform point to screen space
    let coord = ol.proj.transform([longPoint, latPoint], 'EPSG:4326', 'EPSG:3857');
    let pixelCoord = this.particleSystem.map.getPixelFromCoordinate(coord);
    // Assign to point
    point[0] = pixelCoord[0];
    point[1] = pixelCoord[1];    
  }

  // Draw / Update
  drawVelocity(dt){

    // Current value
    let value = this.verticesValue[Math.round(this.life * this.numVerticesPath)];

    // Update life
    this.life += 0.005 + this.particleSystem.speedFactor * 0.1 * this.verticesValue[Math.round(this.life * this.numVerticesPath)];
    // Reset life
    if (this.life > 1 || isNaN(this.life)) {
      this.life = Math.random();
      // Start of vertices path
      this.prevPos[0] = undefined;
      this.prevPos[1] = undefined;
    }

    // Get exact position
    let prevVertPath = Math.floor(this.life * (this.numVerticesPath-1)); // From 0 to numVerticesPath
    let nextVertPath = Math.ceil(this.life * (this.numVerticesPath-1)); // From 0 to numVerticesPath

    // Interpolation value
    let interpCoeff = (nextVertPath - this.life * (this.numVerticesPath-1));
    this.currentPos[0] = interpCoeff * this.vertices[prevVertPath*2]  +
                (1-interpCoeff) * this.vertices[nextVertPath*2];
    this.currentPos[1] = interpCoeff * this.vertices[prevVertPath*2 + 1]  +
                (1-interpCoeff) * this.vertices[nextVertPath*2 + 1];

    // When prevPos is not valid (map moved, source changed, etc)
    if (this.prevPos[0] == undefined){
      this.prevPos[0] = this.currentPos[0];
      this.prevPos[1] = this.currentPos[1];
      return;
    }
      
    this.getColorFromLegend(this.color, value);

    // Draw in canvas
    let ctx = this.particleSystem.ctx;

    // Change color
      ctx.stroke();
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      //ctx.fillStyle = 'rgba(0, 0, 0, ', alphaFactor*0.0, ')';
      let colorStr = 'rgba(' + this.color[0] + ',' + this.color[1] + ',' + this.color[2] + ', ' + 0.7 + ')'
      ctx.strokeStyle = colorStr; // Makes the app go slow, consider something different

    ctx.moveTo(this.prevPos[0], this.prevPos[1])
    ctx.lineTo(this.currentPos[0], this.currentPos[1]);

    // Assign prevPos
    this.prevPos[0] = this.currentPos[0];
    this.prevPos[1] = this.currentPos[1];

  }

  getColorFromLegend(color, value){
    let legend = this.legend;
    if(legend == undefined)
      return;
    

    let steps = legend.colorsStr.length;
    let range = HFRADARRANGE; // HACK, THE SOURCE SHOULD HAVE THE RANGE: this.particleSystem.source.dataRange;
    let unitStep = (range[1] - range[0])/steps;
    
    // Find color according to magnitude and legend
    // Top bottom limits
    //debugger;
    // if (value < range[0])
    //   this.color = legend.colorsStr[0];
    // else
    //   this.color = legend.colorsStr[steps -1];

    for (let i = 0; i < steps-1; i++){
      let lowLim = range[0] + i*unitStep;
      let highLim = range[0] + (i+1)*unitStep;
      if (value > lowLim && value < highLim){
        color[0] = legend.colorsRGB[i][0];
        color[1] = legend.colorsRGB[i][1];
        color[2] = legend.colorsRGB[i][2];
        i = steps;
      }
    }
  }

}






export default AnimationEngine;







