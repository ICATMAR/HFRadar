<template>
  <div ref="canvasContainer" class="canvasContainer"></div>

</template>


<script>


/*
TODO:
Data could be painted in the map with two methods: canvas or HTML elements
The issue with the canvas is that is resolution dependent and the painting of arrows might be more difficult and not so pretty
With HTML elements we can put them accross the screen and use different icons. CSS can do the size and rotation. Although it might be difficult
to fill the whole screen with equally spaced HTML elements, without causing overflow. Need to try maybe.
*/


export default {
  name: 'climaDirectionCanvas',
  created(){},
  mounted() {
    // Canvas size
    this.createCanvas('dirCanvas');

    // WMS data retriever
    this.dataRetriever = new WMSDataRetriever(); // TODO: this class should be a singleton

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
      canvas.style["background-color"] = "rgba(1, 0, 0, 0.0)";
      
      this.$refs.canvasContainer.appendChild(canvas);

      return canvas;
    },

    // New clima layer selected
    setClimaLayer: function(infoWMS){
      // Hide if undefined (send undefined when closing widget)
      if (infoWMS == undefined){
        this.$refs.canvasContainer.style.display = 'none';
        return;
      }
      // Check if it has animation parameter
      if (infoWMS.animation){
        // OL map
        if (this.map == undefined){
          this.map = this.$parent.map;
        }

        // Prepare WMS url
        let url = infoWMS.url;
        url += '?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true';
        Object.keys(infoWMS.params).forEach(key => {
          url += '&' + key + '=' + infoWMS.params[key];
        });
        infoWMS.wmsURL = url;

        // Force arrows
        infoWMS.animation.useArrows = true;

        // Create animation engine
        if (this.animEngine == undefined){
          this.animEngine = new AnimationEngine(this.canvas, this.map, infoWMS, undefined);
          // Bind events
          // Map events for animation
          this.$parent.map.on('moveend', this.animEngine.onMapMoveEnd);
          this.$parent.map.on('movestart', this.animEngine.onMapMoveStart);
        } else {
          this.animEngine.setWMSSource(infoWMS.wmsURL, infoWMS.animation);
        }
        return
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