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
      canvas.className = "position-absolute pe-none vh-100 vw-100";
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

      } else {
        // Update existing animation
        this.animEngine.setHFRadarData(data);
      }
      // Map events for animation
      this.map.on('moveend', this.animEngine.onMapMoveEnd);
      this.map.on('movestart', this.animEngine.onMapMoveStart);
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
}
</style>