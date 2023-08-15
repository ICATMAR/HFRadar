<template>
  <div ref="canvasContainer" class="canvasContainer"></div>

</template>


<script>

export default {
  name: 'directionCanvas',
  created(){},
  mounted() {
    // Canvas size
    this.createCanvas('dirCanvas');


    // EVENTS
    // Clima layer
    window.eventBus.on('WidgetWeatherLayers_ClimaLayerChange', infoWMS => {
      this.setClimaLayer(infoWMS);
    });
    // When the side panel is open/hidden
    window.eventBus.on('SidePanelSizechanged', (isSidePanelOpen) => {
      //setTimeout(()=> this.map.updateSize(), 100);
      //this.map.updateSize();
    });
  },
  data () {
    return {

    }
  },
  methods: {
    // INTERNAL
    // Create canvas
    createCanvas: function(canvasID){
      let canvas = document.createElement("canvas");
      canvas.className = "position-absolute pe-none h-100 w-100";
      canvas.id = canvasID;
      this.canvas = canvas;

      // Test
      canvas.style["background-color"] = "rgba(1, 0, 0, 0.5)";
      
      this.$refs.canvasContainer.appendChild(canvas);

      return canvas;
    },

    // New clima layer selected
    setClimaLayer: function(infoWMS){
      debugger;
      // Check if it has animation parameter
      if (infoWMS.animation){
        console.log("WORK TO DO HERE");
      }
    },


    // PUBLIC
    // Update canvas size and drawings
    onMapMoveEnd: function(){
      // OL map
      if (this.map == undefined){
        this.map = this.$parent.map;
      }
      // Resize animation canvas
      this.canvas.width = this.map.getViewport().offsetWidth;
      this.canvas.height = this.map.getViewport().offsetHeight;
    }
  },
  components: {

  }
}

</script>



<style scoped>
.canvasContainer {
  background: none;
  position:absolute;
  width: 100%;
  height: 100%;
  top: 0px;
  pointer-events: none;
}
</style>