<template>
  <!-- Container -->
     <div id='animationCanvas' ref='animationCanvas'>

      <!-- Animation Canvas will be appended by code -->

      <!-- Animation legend -->
      <!-- todo v:for for different data types? -->
      <div class="widgetsBottomRightContainer">
        <Transition>
          <widgetCombinedRadars></widgetCombinedRadars>
        </Transition>
        <Transition>
          <widgetHFRadars v-show="isAdvancedInterfaceOnOff"></widgetHFRadars>
        </Transition>
        <!-- Disclaimer -->
        <div class="widgetDataSource"><span>Data source: <a style="color:white; pointer-events: all;" href="https://www.icatmar.cat" target="_blank">ICATMAR</a></span></div>
      </div>


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
        this.updateRadarAnimationState(radar, tmst);
      })
    });


    // Selected date changed (slider moves or drag and drop files)
    window.eventBus.on('DataStreamsBar_SelectedDateChanged', (tmst) =>{
      // Iterate all radars
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        this.updateRadarAnimationState(radar, tmst);
      }); 
    }); 
    // Initial load and user changing hash TIME in URL
    window.eventBus.on('GUIManager_URLDateChanged', tmst => {
      // Iterate all radars
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        this.updateRadarAnimationState(radar, tmst);
      }); 
    });



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
        if (radar.constructor.name == radarType){
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
          this.updateRadarAnimationState(radar, tmst);
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


    // Updates animations
    updateRadarAnimationState(radar, tmst){
      
      // Check if radar has data on timestamp
      let isLoaded = radar.data != undefined;
      let hasData = false;
      tmst = tmst || window.GUIManager.currentTmst;
      if (isLoaded)
        hasData = radar.data[tmst] != undefined;
      
      // Check if radar is active
      let isActive = false;
      if (radar.constructor.name == "HFRadar")
        isActive = window.GUIManager.widgetHFRadars.isVisible && 
                  window.GUIManager.widgetHFRadars.radarsVisible[radar.Site] && 
                  window.GUIManager.widgetHFRadars.areParticlesVisible;
      else if (radar.constructor.name == "CombinedRadars")
        isActive = window.GUIManager.widgetCombinedRadars.isVisible && window.GUIManager.widgetCombinedRadars.areParticlesVisible;
    
      // Can be active if has data and GUI is showing data
      isActive = isActive && hasData && isLoaded;
      
      if (radar.animEngine){
        // Animation data and state
        if (isActive){
          // Set radar data
          radar.constructor.name == "CombinedRadars" ? radar.animEngine.setCombinedRadarData(radar.dataGrid[tmst]) : radar.animEngine.setHFRadarData(radar.data[tmst]);
          // Animation re-starts
          if (radar.animEngine.isStopped){
            radar.animEngine.isStopped = false;
            radar.animEngine.update();
          }
        }
        // Animation stops
        else if (!radar.animEngine.isStopped && !isActive){
          radar.animEngine.isStopped = true;
          radar.animEngine.clearCanvas();
        }
      } 
      // No animation engine
      else if (isActive){
        this.createAnimationEngine(radar, tmst);
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



.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

</style>