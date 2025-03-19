
import SourceWMS from './SourceWMS.js';
import {SourceHFRadar, SourceCombinedRadar} from './SourceHFRadars.js';
import {ParticleSystem, ParticleSystemHF} from './ParticleSystems.js';
import SourceWMTS from './SourceWMTS.js';

// Classes defined here:

// AnimationEngine
// ParticleSystem
// Particle

// Constants
const LEGENDNAMES = [
  'GreenBlueWhiteOrangeRed',
  'BlueWhiteRed',
  'ModifiedOccam',
  'absModifiedOccam'
];

class AnimationEngine {
  // Static variables
  static numActiveAnimations = 0;

  // Variables
  prevTime = 0;
  canvasParticles = undefined;
  bbox = [];
  source = undefined;
  particles = undefined;
  frameTime = 0;
  FRAMERATE = 40; // in ms
  isDestroyed = false;
  isStopped = false;
  
  useArrows = false;
  

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
    // Calculate geographic extent of the canvas
    this.calculateCanvasGeographicExtent();
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

      // Define if using arrows
      this.useArrows = animInfo.animation.useArrows == true;

      // Define callback when data is loaded
      //this.source.defineOnLoadCallback(this.particles.repositionParticles.bind(this.particles));
      this.source.defineOnLoadCallback(this.onSourceLoad.bind(this));

      // Load data
      this.source.updateWMSSource(animInfo.wmsURL, animInfo.animation);

      // Start drawing loop (only once)
      this.update();
    }
    
    // Create WMTS source
    if (animInfo.isWMTS) {
      this.source = new SourceWMTS(animInfo);
      // Create particle system
      this.particles = new ParticleSystem(this.canvasParticles, this.source, this.map);
      this.particles.clear();
      // Define if using arrows
      this.useArrows = animInfo.dataSet.animation.useArrows == true;

      // Define callback when data is loaded
      this.source.defineOnLoadCallback(this.onSourceLoad.bind(this));

      // Load data only in the view
      this.calculateCanvasGeographicExtent();
      // Load tiles. this.update is called with the callback (see lines above) when the tiles are loaded.
      this.source.updateWMTSSource(animInfo, this.bbox);

      // Start drawing loop (only once)
      //this.update();
    }

    // Create HFRadar source
    if (animInfo.HFRadarData){
      this.source = new SourceHFRadar(animInfo.HFRadarData);
      // Create particle system
      this.particles = new ParticleSystemHF(this.canvasParticles, this.source, this.map, legend);
      this.particles.clear();
      // Start drawing loop (must call it only once)
      this.update();
    }

    // Create CombinedRadar source
    if (animInfo.CombinedRadarData){
      //this.useArrows = true;
      this.source = new SourceCombinedRadar(animInfo.CombinedRadarData);
      //this.source.animation.useArrows = true;
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
      window.FileManager.getLegend(LEGENDNAMES[3], 20)
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


  setWMTSSource(infoWMTS){
    // Create source
    this.source = new SourceWMTS(infoWMTS);
    // Create particle system
    this.particles = new ParticleSystem(this.canvasParticles, this.source, this.map);
    this.particles.clear();

    // Define callback when data is loaded
    this.source.defineOnLoadCallback(this.onSourceLoad.bind(this));

    // Load data
    this.source.updateWMTSSource(infoWMTS, this.bbox);
  }


  setHFRadarData(HFRadarData){
    this.source.updateData(HFRadarData);
    this.particles.updateSource(this.source);
    this.particles.clear();
  }

  setCombinedRadarData (CombinedRadarData){
    this.source.updateData(CombinedRadarData);
    this.particles.updateSource(this.source);
    //this.particles.clear();
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


    // DEBUGGER FRAME RATE
    //***********************************************
    if (false) {
      if (this.timeCounter == undefined){
        this.timeCounter = 0;
        this.fpsArray = [];
        this.particles.drawCalls = 0;
      }
      this.timeCounter += dt;
      this.fpsArray.push(dt);
      if (this.timeCounter > 1){
        let sum = 0;
        this.fpsArray.forEach(el => sum+= el);
        let avg = sum/this.fpsArray.length;

        // Debug message
        console.log("Average FPS from last second: " + this.fpsArray.length/this.timeCounter + ". Average time: " + avg);
        console.log("Framerate: " + this.FRAMERATE);
        console.log("Num particles: " + this.particles.numParticles);
        console.log("Num draw calls / nºparticles: " + this.particles.drawCalls/this.particles.numParticles);
        console.log("Num draw calls: " + this.particles.drawCalls); 

        // Reset
        this.timeCounter = 0;
        this.fpsArray = [];
        this.particles.drawCalls = 0;

      }
    }
    // **********************************************
    

    // If data is loaded and layer is visible
    if (this.source){
      //console.log(this.source.wmsURL);
      if (this.source.isReady)
        if (!this.mapIsMoving){
          this.particles.draw(dt);
        }
    }

    // Do not loop if using arrows and particles have been painted
    if (this.useArrows)
      return;

    // Loop otherwise
    setTimeout(() => this.update() , this.FRAMERATE); // Frame rate in milliseconds
  }


  // Callback when source is loaded
  onSourceLoad(){
    console.log("Source loaded!");
    // Reposition particles when data is loaded
    this.particles.repositionParticles();
    // Update with draw for arrows
    if (this.useArrows)
      this.update();
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

  calculateCanvasGeographicExtent(){
    // Calculate map extent in long lat
    let extent = this.map.getView().calculateExtent();
    let mapExtentMin = ol.proj.transform([extent[0], extent[1]], 'EPSG:3857', 'EPSG:4326');
    let mapExtentMax = ol.proj.transform([extent[2], extent[3]], 'EPSG:3857', 'EPSG:4326');
    this.canvasParticles.mapMinLong = this.bbox[1] = mapExtentMin[0];
    this.canvasParticles.mapMinLat = this.bbox[0] = mapExtentMin[1];
    this.canvasParticles.mapMaxLong = this.bbox[3] = mapExtentMax[0];
    this.canvasParticles.mapMaxLat = this.bbox[2] = mapExtentMax[1];
  }


  // Callback when map size changes
  onMapMoveEnd(){
    this.calculateCanvasGeographicExtent();
    this.resizeCanvas();
    this.mapIsMoving = false;
    if (this.source) {
      // WMTSSource (dynamic loading)
      if (this.source.constructor.name == 'SourceWMTS')
        this.source.viewportChange(this.bbox); // Draw call when tiles are all loaded
      if (this.source.isReady){
        this.particles.repositionParticles();
        if (this.useArrows && this.source.constructor.name != 'SourceWMTS') // Update and draw once for arrows
          this.update();
      }
      // Source is not ready
      else {
        // TODO: 
        // In the case of dynamically loading WMTS Tiles (instead of loading the whole MED once), something should be done here.
        // Some kind of callback? What if the map keeps moving? The callbacks should be cancelled. Probably better to use promises, because they can be cancelled.
        // Actually when the tiles are loaded a callback is called
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









export default AnimationEngine;







