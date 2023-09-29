<template>
  <!-- Container -->
     <div id='animationCanvas' ref='animationCanvas'>

      <!-- Animation Canvas will be appended by code -->

      <!-- Animation legend -->
      <!-- todo v:for for different data types? -->
      <div class="widgetContainer" v-show="isAdvancedInterfaceOnOff">
        <Transition>
          <widgetCombinedRadars ref="widgetCombinedRadars" v-show="combinedRadarsExist"></widgetCombinedRadars>
        </Transition>
        <Transition>
          <widgetHFRadars ref="widgetHFRadars" v-show="radarsExist"></widgetHFRadars>
        </Transition>
      </div>

      <!-- Legend GUI for non-advanced-->
      <legendGUI class="widgetContainer" v-show="!isAdvancedInterfaceOnOff"
        ></legendGUI>

  </div>
</template>


<script>

// Import components
//import Map from 'Components/Map.vue'
import WidgetCombinedRadars from "../MapWidgets/WidgetCombinedRadars.vue";
import WidgetHFRadars from "../MapWidgets/WidgetHFRadars.vue";
import LegendGUI from "../MapWidgets/LegendGUI.vue";

export default {
  name: 'animationCanvas', // Caps, no -
  created() {
    
  },
  mounted() {
    // EVENT LISTENERS
    // New HFRadar data
    window.eventBus.on('HFRadarDataLoaded', (tmst) =>{
      // Find selected timestamp
      tmst = window.GUIManager.currentTmst || tmst;

      // Iterate all radars
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        // Check if there is radar data on that tmst
        if (radar.data[tmst] != undefined){
  
          // Activate widget
          if (radar.constructor.name == "CombinedRadars")
            this.combinedRadarsExist = true;
          else if (radar.constructor.name == "HFRadar")
            this.radarsExist = true;
          
          // Create animation for radar
          // If canvas does not have animation engine
          if (radar.animEngine == undefined){
            this.createAnimationEngine(radar, tmst);
          }
          // Update animation
          else {
            // Update existing animation
            if (radar.constructor.name == "CombinedRadars"){
              radar.animEngine.setCombinedRadarData(radar.dataGrid[tmst]);
              // Start combined radars animation (TODO: and activate widget?)
              let wasStopped = radar.animEngine.isStopped;
              radar.animEngine.isStopped = false;
              // Restart animation if it was stopped
              if (wasStopped)
                radar.animEngine.update();
            } else if (radar.constructor.name == "HFRadar"){
              radar.animEngine.setHFRadarData(radar.data[tmst]);
              // Start animation according to GUIManager
              let guiState = window.GUIManager.widgetHFRadars;
              let shouldAnimate = guiState.areParticlesVisible && guiState.isVisible && guiState.radarsVisible[radar.Site];
              if (shouldAnimate && radar.animEngine.isStopped){
                radar.animEngine.isStopped = false;
                radar.animEngine.update();
              }
            }
          }
        }
        // If radar does not have data on that timestamp
        else if (radar.animEngine != undefined) {
          // Stop animation
          radar.animEngine.isStopped = true;
          // Clear canvas
          radar.animEngine.clearCanvas();
        }
      })
    });





    // Selected date changed (slider moves or drag and drop files)
    window.eventBus.on('DataStreamsBar_SelectedDateChanged', (tmst) =>{
      // Keep the visibility of the radars that is set on the GUI
      this.radarsExist = false; // Reset and redefine if HF Radar exists on time stamp
      this.combinedRadarsExist = false;
      // Iterate all radars
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        // If it is visible and has data, update data and start animation
        if (radar.data[tmst] != undefined){
          // Create animation engine if it does not exist
          if (radar.animEngine == undefined) {
            this.createAnimationEngine(radar, tmst); // TODO: DOES THIS CREATE AN ANIMATION THAT IS AUTOMATICALLY VISIBLE? PROBABLY YES, need to check!
            // Halt animation just in case
            radar.animEngine.isStopped = true;
            radar.animEngine.clearCanvas();
          }

          // Update radar data and visibility
          // For HFRadar
          if (radar.constructor.name == "HFRadar"){
            // Show widget
            this.radarsExist = true;
            // Update data
            radar.animEngine.setHFRadarData(radar.data[tmst]);
            // TODO: DECIDE IF TO SHOW RADAR DATA OR NOT ACCORDING TO GUIMANAGER
            let guiState = window.GUIManager.widgetHFRadars;
            let shouldAnimate = guiState.isVisible && guiState.areParticlesVisible && guiState.radarsVisible[radar.Site];
            
            // Start animation
            if (radar.animEngine.isStopped && shouldAnimate){
              radar.animEngine.isStopped = false;
              radar.animEngine.update();
            }
          }// For combined
          else if (radar.constructor.name == "CombinedRadars"){
            // Show widget
            this.combinedRadarsExist = true;
            // Update data
            radar.animEngine.setCombinedRadarData(radar.dataGrid[tmst]);
            // Start animation
            if (radar.animEngine.isStopped && window.GUIManager.widgetCombinedRadars.isVisible && window.GUIManager.widgetCombinedRadars.areParticlesVisible) {
              radar.animEngine.isStopped = false;
              radar.animEngine.update();
            }
          }
          
          
        }
        // Otherwise, stop animation
        else if (radar.animEngine){
          radar.animEngine.isStopped = true;
          radar.animEngine.clearCanvas();
        }
      }); // End of Object.keys for each
      

    }); // End of window.eventBus



    // Legend changes
    window.eventBus.on('WidgetCombinedRadars_LegendChanged', (legendObj)=> {
      this.radarTypeLegendChanged("CombinedRadars", legendObj);
    });
    window.eventBus.on('WidgetHFRadars_LegendChanged', (legendObj)=> {
      this.radarTypeLegendChanged("HFRadar", legendObj);
    });

    // Animation for radars stopped
    window.eventBus.on('WidgetCombinedRadars_AnimationActiveChanged', (active) => {
      this.radarTypeAnimationActiveChanged("CombinedRadars", active);
    });
    window.eventBus.on('WidgetHFRadars_AnimationActiveChanged', (active) => {
      this.radarTypeAnimationActiveChanged("HFRadar", active);
    });

    // Activate / Deactivate all radars and update animation
    window.eventBus.on('WidgetCombinedRadars_VisibilityChanged', (areVisible) => {
      this.radarTypeVisibilityChanged("CombinedRadars", areVisible);
    });
    window.eventBus.on('WidgetHFRadars_VisibilityChanged', (areVisible) => {
      this.radarTypeVisibilityChanged("HFRadar", areVisible);
    });


    // When animation starts/stops
    window.eventBus.on('WidgetHFRadars_RadarActiveChange', (inRadar) => {
      // Gotta be careful with .vue, as it tracks objects and its properties.
      let radar = window.DataManager.HFRadars[inRadar.UUID]; // should I remove this line? or is it related to .vue tracking?
      this.updateRadarAnimationState(radar);
    });


    // Advanced interface
    window.eventBus.on("AdvancedInterfaceOnOff", state => this.isAdvancedInterfaceOnOff = state);

    
  },
  data (){
    return {
      dataTypes: [],
      combinedRadarsExist: false,
      radarsExist: false,
      legendCombinedRadars: undefined,
      legendHFRadar: undefined,
      isAdvancedInterfaceOnOff: false,
    }
  },
  methods: {
    // EXTERNAL EVENTS
    // Events common to CombinedRadars and HFRadar
    // Legend changed
    radarTypeLegendChanged: function(radarType, legendObj){
      let legend = legendObj.legend;
      legend.legendRange = legendObj.legendRange; // TODO: FIX DATA STRUCTURE
      if (radarType == "CombinedRadars"){
        this.legendCombinedRadars = legend;
      } else if (radarType == "HFRadar"){
        this.legendHFRadar = legend;
      }
      // Iterate radars
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        if (radar.constructor.name == radarType){
          if (radar.animEngine)
            radar.animEngine.updateLegend(JSON.parse(JSON.stringify(legend)));
        }
      });
    },
    // Animation on off
    radarTypeAnimationActiveChanged: function(radarType, active){
      // Iterate radars and stop animations for combined radars
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        if (radar.constructor.name == radarType && radar.data[window.GUIManager.currentTmst] != undefined){
          // Update animation engine
          this.updateRadarAnimationState(radar);
        }
      });
    },
    // Overall visibility on off
    radarTypeVisibilityChanged: function(radarType, areVisible){
      let tmst = GUIManager.currentTmst;
      // Iterate all radars
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        
        if (radar.constructor.name == radarType){
          // HF Radar
          if (radarType == "HFRadar"){
            // GUI Info
            let isRadarActivated = window.GUIManager.widgetHFRadars.radarsVisible[radar.Site]  && window.GUIManager.widgetHFRadars.areParticlesVisible;
            // Visible
            if (areVisible && isRadarActivated && radar.animEngine && radar.data[tmst] != undefined){
              radar.animEngine.setHFRadarData(radar.data[tmst]);
              radar.animEngine.isStopped = false;
              radar.animEngine.update();
            }
          } 
          // Combined radar
          else if (radarType == "CombinedRadars") {
            // Visible
            if (areVisible && radar.animEngine && radar.data[tmst] != undefined){
              radar.animEngine.setCombinedRadarData(radar.dataGrid[tmst]);
              // Re-start if it was stopped
              if (radar.animEngine.isStopped){
                radar.animEngine.isStopped = false;
                radar.animEngine.update();
              }
            }
            // Not visible
            else if (!areVisible && radar.animEngine){
              radar.animEngine.isStopped = true;
              radar.animEngine.clearCanvas();
            }
          }

          // Not visible
          if (!areVisible || radar.data[tmst] == undefined){
            if (radar.animEngine){
              radar.animEngine.isStopped = true;
              radar.animEngine.clearCanvas();
            }
          }
        }
      });
    },
    

    // INTERNAL METHODS
    // Create canvas
    createCanvas: function(canvasID){
      let canvas = document.createElement("canvas");
      canvas.className = "position-absolute pe-none h-100 w-100";
      // Test
      //canvas.style["background-color"] = "red";
      canvas.id = canvasID;
      return canvas;
    },

    // Update animation data
    // TODO: ALL NEEDS REFACTORING
    updateRadarAnimationData(radar, tmst){
      // If it is visible and has data, update data and start animation
      if (radar.data[tmst] != undefined && radar.animEngine){
        // Update radar data
        // For HFRadar
        if (radar.constructor.name == "HFRadar")
          radar.animEngine.setHFRadarData(radar.data[tmst]);
        // For combined
        else if (radar.constructor.name == "CombinedRadars")
          radar.animEngine.setCombinedRadarData(radar.dataGrid[tmst]);
      }
      if (radar.data[tmst] == undefined){
        radar.animEngine.isStopped = true;
        radar.animEngine.clearCanvas();
      }
    },

    // Updates animations
    updateRadarAnimationState(radar){
      let isActive = false;
      if (radar.constructor.name == "HFRadar")
        isActive = window.GUIManager.widgetHFRadars.radarsVisible[radar.Site] && window.GUIManager.widgetHFRadars.areParticlesVisible;
      else if (radar.constructor.name == "CombinedRadars")
        isActive = window.GUIManager.widgetCombinedRadars.isVisible && window.GUIManager.widgetCombinedRadars.areParticlesVisible;

      
      if (radar.animEngine){
        // Animation re-starts
        if (radar.animEngine.isStopped && isActive){
          radar.animEngine.isStopped = false;
          radar.animEngine.update();
        } 
        // Animation stops
        else if (!radar.animEngine.isStopped && !isActive){
          radar.animEngine.isStopped = true;
          radar.animEngine.clearCanvas();
        }
      }
    },



    // Create animation engine
    createAnimationEngine(radar, tmst){
  
      // Create canvas
      let canvas = this.createCanvas("canvasHFRadarAnimation");
      this.$refs["animationCanvas"].appendChild(canvas);

      

      //let legend = radar.legend;// == undefined ? undefined : JSON.parse(JSON.stringify(this.legend));
      let isRadarActivated = false;
      // Create animation
      if (radar.constructor.name == "CombinedRadars"){ // Combined Radar (tots)
        let legend = this.legendCombinedRadars == undefined ? undefined : JSON.parse(JSON.stringify(this.legendCombinedRadars));
        radar.animEngine = new AnimationEngine(canvas, this.$parent.map, {"CombinedRadarData": radar.dataGrid[tmst]}, legend);
        let guiState = window.GUIManager.widgetCombinedRadars;
        isRadarActivated = guiState.isVisible && guiState.areParticlesVisible;
      } else{
        let legend = this.legendHFRadar == undefined ? undefined : JSON.parse(JSON.stringify(this.legendHFRadar));
        radar.animEngine = new AnimationEngine(canvas, this.$parent.map, {"HFRadarData": radar.data[tmst]}, legend);
        let guiState = window.GUIManager.widgetHFRadars;
        isRadarActivated = guiState.isVisible && guiState.radarsVisible[radar.Site];
      }
      
      // Stop animation if radar is not activated

      radar.animEngine.isStopped = !isRadarActivated;
      radar.animEngine.clearCanvas();

      // Bind events
      // Map events for animation
      this.$parent.map.on('moveend', radar.animEngine.onMapMoveEnd);
      this.$parent.map.on('movestart', radar.animEngine.onMapMoveStart);
            
      console.log("Creating animation");
    },


  },
  components: {
    "widgetCombinedRadars": WidgetCombinedRadars,
    "widgetHFRadars": WidgetHFRadars,
    "legendGUI": LegendGUI,
  }
}
</script>




<style scoped>
#animationCanvas {
  background: none;
  position:absolute;
  width: 100%;
  height: 100%;
  top: 0px;
  pointer-events: none;
}

.widgetContainer {
  position: absolute;
  bottom: 100px;
  right: clamp(8px, 4%, 40px);
  width: 264px;
  display: flex;
  flex-direction: column;
  z-index: 5;
}

/* Mobile */
@media screen and (max-width: 770px) {
  .widgetContainer {
    bottom: 150px;
  }
}



.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

</style>