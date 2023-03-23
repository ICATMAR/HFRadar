<template>
  <!-- Container -->
     <div id='animationCanvas' ref='animationCanvas'>

      <!-- Animation Canvas will be appended by code -->

      <!-- Animation legend -->
      <!-- todo v:for for different data types? -->
      <div class="widgetContainer">
        <Transition>
          <widgetCombinedRadars ref="widgetCombinedRadars" v-show="combinedRadarsExist"></widgetCombinedRadars>
        </Transition>
        <Transition>
          <widgetHFRadars ref="widgetHFRadars" v-show="radarsExist"></widgetHFRadars>
        </Transition>
      </div>

  </div>
</template>


<script>

// Import components
//import Map from 'Components/Map.vue'
import WidgetCombinedRadars from "./WidgetCombinedRadars.vue";
import WidgetHFRadars from "./WidgetHFRadars.vue";

export default {
  name: 'animationCanvas', // Caps, no -
  created() {
    
  },
  mounted() {
    // EVENT LISTENERS
    // New HFRadar data
    window.eventBus.on('HFRadarDataLoaded', (tmst) =>{
      // Iterate all radars
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        
        // Check if there is radar data on that tmst
        if (radar.data[tmst] != undefined){
          // Make all radars with data visible
          //radar.isActivated = true;
          // Activate widget
          if (radar.constructor.name == "CombinedRadars")
            this.combinedRadarsExist = true;
          else if (radar.constructor.name == "HFRadar" && radar.isActivated)
            this.radarsExist = true;
          
          // Create animation for radar
          // If canvas does not have animation engine
          if (radar.animEngine == undefined){
            this.createAnimationEngine(radar, tmst);
          }
          // Update animation
          else {
            // Update existing animation
            if (radar.dataGrid)
              radar.animEngine.setCombinedRadarData(radar.dataGrid[tmst]);
            else
              radar.animEngine.setHFRadarData(radar.data[tmst]);
            let wasStopped = radar.animEngine.isStopped;
            radar.animEngine.isStopped = false;
            // Restart animation if it was stopped
            if (wasStopped)
              radar.animEngine.update();
            }
        }
        // If radar does not have data on that timestamp
        else if (radar.animEngine != undefined) {
          // Make it not visible
          //radar.isActivated = false;
          // Stop animation
          radar.animEngine.isStopped = true;
          // Clear canvas
          radar.animEngine.clearCanvas();
        }
      })
    });





    // Selected date changed (slider moves or drag and drop files)
    window.eventBus.on('SelectedDateChanged', (tmst) =>{
      // Keep the visibility of the radars that is set on the GUI
      // Iterate all radars
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        // If it is visible and has data, update data and start animation
        if (radar.data[tmst] != undefined && radar.isActivated && radar.animEngine){
          // Update existing animation
          // For HFRadar
          if (radar.dataGrid == undefined)
            radar.animEngine.setHFRadarData(radar.data[tmst]);
          // For combined
          else
            radar.animEngine.setCombinedRadarData(radar.dataGrid[tmst])

          let wasStopped = radar.animEngine.isStopped;
          // Only activate animation if animation is visible.
          if (wasStopped && radar.animationVisible){
            radar.animEngine.isStopped = false;
            radar.animEngine.update();
          }
        }
        // Otherwise, stop animation
        else {
          if (radar.animEngine){
            radar.animEngine.isStopped = true;
            radar.animEngine.clearCanvas();
          } 
          // Create animation engine
          else if (radar.data[tmst] != undefined) {
            this.createAnimationEngine(radar, tmst);
          }
          
        }


        // Show widget
        if (radar.data[tmst] != undefined && radar.isActivated && radar.constructor.name == "CombinedRadars"){
          if (radar.constructor.name == "CombinedRadars")
            this.combinedRadarsExist = true;
        } else {
          this.combinedRadarsExist = false;
        }
        // HF Radars widget
        this.radarsExist = false; // TODO: PUT IN A FUNCTION (USED TWICE IN THIS COMPONENT)
        Object.keys(window.DataManager.HFRadars).forEach(key => {
          let rr = window.DataManager.HFRadars[key];
          if (rr.constructor.name == "HFRadar" && rr.isActivated && rr.data[tmst] != undefined)
            this.radarsExist = true;
        });


      });
      

    });



    // Legend changes
    // TODO: UNIFY COMBINEDRADARS AND HFRADARS EVENT
    window.eventBus.on('WidgetCombinedRadars_LegendChanged', (legendObj)=> {
      this.legendCombinedRadars = legendObj.legend;
      this.legendCombinedRadars.legendRange = legendObj.legendRange; // TODO: FIX DATA STRUCTURE
      // Iterate radars
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        if (radar.constructor.name == "CombinedRadars"){
          if (radar.animEngine)
            radar.animEngine.updateLegend(JSON.parse(JSON.stringify(this.legendCombinedRadars)));
        }
      });
    });
    window.eventBus.on('WidgetHFRadars_LegendChanged', (legendObj)=> {
      this.legendHFRadar = legendObj.legend;
      this.legendHFRadar.legendRange = legendObj.legendRange; // TODO: FIX DATA STRUCTURE
      // Iterate radars
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        if (radar.constructor.name == "HFRadar"){
          if (radar.animEngine)
            radar.animEngine.updateLegend(JSON.parse(JSON.stringify(this.legendHFRadar)));
        }
      });
    });


    // TODO: COMBINE FUNCTIONS
    // Animation for combined radars stopped
    window.eventBus.on('WidgetCombinedRadars_AnimationActiveChanged', (active) => {
      
      // Iterate radars and stop animations for combined radars
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        if (radar.constructor.name == "CombinedRadars"){
          radar.animationVisible = active;
          // Update animation engine
          this.updateRadarAnimationState(radar);
        }
      });
    });
    // Animation for combined radars stopped
    window.eventBus.on('WidgetHFRadars_AnimationActiveChanged', (active) => {
      
      // Iterate radars and stop animations for combined radars
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        if (radar.constructor.name == "HFRadar"){
          radar.animationVisible = active;
          // Update animation engine
          this.updateRadarAnimationState(radar);
        }
      });
    });


    // When animation starts/stops
    window.eventBus.on('SidePanelRadarActiveChange', (inRadar) => {

      // Gotta be careful with .vue, as it tracks objects and its properties.
      let radar = window.DataManager.HFRadars[inRadar.UUID];

      // Hide/show widget?
      if (radar.constructor.name == "CombinedRadars")
        this.combinedRadarsExist = radar.isActivated;
      else if (radar.constructor.name == "HFRadar"){
        this.radarsExist = false;
        Object.keys(window.DataManager.HFRadars).forEach(key => {
          let rr = window.DataManager.HFRadars[key];
          if (rr.constructor.name == "HFRadar" && rr.isActivated)
            this.radarsExist = true;
        });
      }
      
      this.updateRadarAnimationState(radar);

    })
  },
  data (){
    return {
      dataTypes: [],
      combinedRadarsExist: false,
      radarsExist: false,
      legendCombinedRadars: undefined,
      legendHFRadar: undefined,
    }
  },
  methods: {
    //onclick: function(e){},

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
    updateRadarAnimationState(radar){
      if (radar.animEngine){
        // Animation re-starts
        if (radar.animEngine.isStopped && radar.isActivated && radar.animationVisible){
          radar.animEngine.isStopped = false;
          radar.animEngine.update();
        } 
        // Animation stops
        else if ((!radar.animEngine.isStopped && !radar.isActivated) || !radar.animationVisible){
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
      // Create animation
      if (radar.constructor.name == "CombinedRadars"){ // Combined Radar (tots)
        let legend = this.legendCombinedRadars == undefined ? undefined : JSON.parse(JSON.stringify(this.legendCombinedRadars));
        radar.animEngine = new AnimationEngine(canvas, this.$parent.map, {"CombinedRadarData": radar.dataGrid[tmst]}, legend);
      } else{
        let legend = this.legendHFRadar == undefined ? undefined : JSON.parse(JSON.stringify(this.legendHFRadar));
        radar.animEngine = new AnimationEngine(canvas, this.$parent.map, {"HFRadarData": radar.data[tmst]}, legend);
      }
      
      // Stop animation if radar is not activated
      radar.animEngine.isStopped = !radar.isActivated;
      radar.animEngine.clearCanvas();

      // Bind events
      // Map events for animation
      this.$parent.map.on('moveend', radar.animEngine.onMapMoveEnd);
      this.$parent.map.on('movestart', radar.animEngine.onMapMoveStart);
            
      console.log("Creating animation");
    },



    // PUBLIC METHODS
    // updateAnimation: function(radar, data, map){
    //   debugger;
    //   // NEVER CALLED?
    //   // Update animation engine
    //   if (radar.animEngine == undefined){
    //     if (radar.hasDataOnTmst){
    //       // Create canvas
    //       let canvas = this.createCanvas("canvasHFRadarAnimation");
    //       this.$refs["animationCanvas"].appendChild(canvas);
    //       // Create animation
    //       if (radar.dataGrid) // Combined Radar (tots)
    //           radar.animEngine = new AnimationEngine(canvas, map, {"CombinedRadarData": data}, JSON.parse(JSON.stringify(this.legend)));
    //         else
    //           radar.animEngine = new AnimationEngine(canvas, map, {"HFRadarData": data}, JSON.parse(JSON.stringify(this.legend)));
          
    //       // Test
    //       // let ctx = canvas.getContext("2d");
    //       // ctx.fillStyle="blue";
    //       // ctx.fillRect(0,0, canvas.width, canvas.height);
    //     }

    //   } else {
    //     if (radar.hasDataOnTmst){
    //       debugger;
    //       // Update existing animation
    //       radar.animEngine.setHFRadarData(data);
    //       let wasStopped = radar.animEngine.isStopped;
    //       radar.animEngine.isStopped = false;
    //       if (wasStopped)
    //         radar.animEngine.update();
          
    //     } else
    //       radar.animEngine.isStopped = true;
    //       radar.animEngine.clearCanvas();
    //   }
    //   // Map events for animation
    //   map.on('moveend', radar.animEngine.onMapMoveEnd);
    //   map.on('movestart', radar.animEngine.onMapMoveStart);
    // },

  },
  components: {
    "widgetCombinedRadars": WidgetCombinedRadars,
    "widgetHFRadars": WidgetHFRadars,
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
  right: 123px;
  width: 264px;
  display: flex;
  flex-direction: column;
}

.widgetContainer > * {
  padding-bottom: 30px;
  padding-top: 30px;
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