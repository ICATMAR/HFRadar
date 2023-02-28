<template>
  <!-- Container -->
     <div id='animationCanvas' ref='animationCanvas'>

      <!-- Animation Canvas will be appended by code -->

  </div>
</template>


<script>

// Import components
//import Map from 'Components/Map.vue'

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
          radar.isActivated = true;
          
          
          // Create animation for radar
          // If canvas does not have animation engine
          if (radar.animEngine == undefined){
            // Create canvas
            let canvas = this.createCanvas("canvasHFRadarAnimation");
            this.$refs["animationCanvas"].appendChild(canvas);
            // Create animation
            if (radar.dataGrid) // Combined Radar (tots)
              radar.animEngine = new AnimationEngine(canvas, this.$parent.map, {"CombinedRadarData": radar.dataGrid[tmst]}, this.legend);
            else
              radar.animEngine = new AnimationEngine(canvas, this.$parent.map, {"HFRadarData": radar.data[tmst]}, this.legend);
           


            // Bind events
            // Map events for animation
            this.$parent.map.on('moveend', radar.animEngine.onMapMoveEnd);
            this.$parent.map.on('movestart', radar.animEngine.onMapMoveStart);
                  
            console.log("Creating animation");
          }
          // Update animation
          else {
            // Update existing animation
            radar.animEngine.setHFRadarData(radar.data[tmst]);
            let wasStopped = radar.animEngine.isStopped;
            radar.animEngine.isStopped = false;
            // Restart animation if it was stopped
            if (wasStopped)
              radar.animEngine.update();
            }
        }
        // If radar does not have data on that timestamp
        else {
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
          radar.animEngine.setHFRadarData(radar.data[tmst]);
          let wasStopped = radar.animEngine.isStopped;
          radar.animEngine.isStopped = false;
          if (wasStopped)
            radar.animEngine.update();
        }
        // Otherwise, stop animation
        else {
          if (radar.animEngine){
            radar.animEngine.isStopped = true;
            radar.animEngine.clearCanvas();
          }
          
        }
      });
      

    });


    // When legend changes
    window.eventBus.on('legendChanged_LegendGUI', (legend)=> {
      this.legend = legend;
      // Iterate radars
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        if (radar.animEngine)
          radar.animEngine.updateLegend(legend);
      });
    });
    // When animation starts/stops
    window.eventBus.on('SidePanelRadarActiveChange', (radar) => {
      
      if (radar.animEngine){
        // Animation re-starts
        if (radar.animEngine.isStopped && radar.isActivated){
          radar.animEngine.isStopped = !radar.isActivated;
          radar.animEngine.update();

        } 
        // Animation stops
        else if (!radar.animEngine.isStopped && !radar.isActivated){
          radar.animEngine.isStopped = !radar.isActivated;
          radar.animEngine.clearCanvas();
        }
      }
    })
  },
  data (){
    return {
      
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
    updateAnimations(tmst){

    },

    // PUBLIC METHODS
    updateAnimation: function(radar, data, map){
      debugger;
      // Update animation engine
      if (radar.animEngine == undefined){
        if (radar.hasDataOnTmst){
          // Create canvas
          let canvas = this.createCanvas("canvasHFRadarAnimation");
          this.$refs["animationCanvas"].appendChild(canvas);
          // Create animation
          radar.animEngine = new AnimationEngine(canvas, map, {"HFRadarData": data}, this.legend);
          // Test
          // let ctx = canvas.getContext("2d");
          // ctx.fillStyle="blue";
          // ctx.fillRect(0,0, canvas.width, canvas.height);
        }

      } else {
        if (radar.hasDataOnTmst){
          debugger;
          // Update existing animation
          radar.animEngine.setHFRadarData(data);
          let wasStopped = radar.animEngine.isStopped;
          radar.animEngine.isStopped = false;
          if (wasStopped)
            radar.animEngine.update();
          
        } else
          radar.animEngine.isStopped = true;
          radar.animEngine.clearCanvas();
      }
      // Map events for animation
      map.on('moveend', radar.animEngine.onMapMoveEnd);
      map.on('movestart', radar.animEngine.onMapMoveStart);
    },

  },
  components: {
    //'map': Map,
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
</style>