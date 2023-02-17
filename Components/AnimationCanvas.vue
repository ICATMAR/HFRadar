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
    window.eventBus.on('RadarVisibilityChange', (radar) => {
      
      if (radar.animEngine){
        // Animation re-starts
        if (radar.animEngine.isStopped && radar.isVisible){
          radar.animEngine.isStopped = !radar.isVisible;
          radar.animEngine.update();

        } 
        // Animation stops
        else if (!radar.animEngine.isStopped && !radar.isVisible){
          radar.animEngine.isStopped = !radar.isVisible;
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
          // Update existing animation
          radar.animEngine.setHFRadarData(data);
          radar.animEngine.isStopped = false;
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