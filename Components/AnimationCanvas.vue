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
    // When legends are loaded
    window.eventBus.on('legendsLoaded', (legends) => {
      this.legends;
      console.log(legends)
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

    // PUBLIC METHODS
    createAnimation: function(data, map){
      // Update animation engine
      if (this.animEngine == undefined){
        // Create canvas
        let canvas = this.createCanvas("canvasHFRadarAnimation");
        this.$refs["animationCanvas"].appendChild(canvas);
        // Create animation
        this.animEngine = new AnimationEngine(canvas, map, {"HFRadarData": data});
        // Test
        // let ctx = canvas.getContext("2d");
        // ctx.fillStyle="blue";
        // ctx.fillRect(0,0, canvas.width, canvas.height);

      } else {
        // Update existing animation
        this.animEngine.setHFRadarData(data);
      }
      // Map events for animation
      map.on('moveend', this.animEngine.onMapMoveEnd);
      map.on('movestart', this.animEngine.onMapMoveStart);
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