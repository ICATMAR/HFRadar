<template>
  <div ref="climaDirectionCanvas" class="climaDirectionCanvas"></div>

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
  created() { },
  mounted() {
    // Canvas size
    this.createCanvas('dirCanvas');

    // WMTS data retriever
    this.dataRetriever = window.WMTSDataRetriever; // TODO: this class should be a singleton

    // EVENTS
    // Clima layer
    window.eventBus.on('WidgetWeatherLayers_ClimaLayerChange', infoWMTS => {
      this.setClimaLayer(infoWMTS);
    });
    // When the side panel is open/hidden
    window.eventBus.on('SidePanelSizechanged', (isSidePanelOpen) => {
      //setTimeout(()=> this.map.updateSize(), 100);
      //this.map.updateSize();
    });
  },
  data() {
    return {

    }
  },
  methods: {
    // INTERNAL
    // Create canvas
    createCanvas: function (canvasID) {
      let canvas = document.createElement("canvas");
      canvas.className = "position-absolute pe-none h-100 w-100";
      canvas.id = canvasID;
      this.canvas = canvas;

      // Test
      canvas.style["background-color"] = "rgba(1, 0, 0, 0.0)";

      this.$refs.climaDirectionCanvas.appendChild(canvas);

      return canvas;
    },

    // New clima layer selected
    setClimaLayer: function (infoWMTS) {
      // Hide if undefined (send undefined when closing widget)
      if (infoWMTS == undefined) {
        this.$refs.climaDirectionCanvas.style.display = 'none';
        // Remove callback events if defined
        if (this.animEngine != undefined) {
          // removeEventListener Map events for animation
          this.$parent.map.un('moveend', this.animEngine.onMapMoveEnd);
          this.$parent.map.un('movestart', this.animEngine.onMapMoveStart);
          // Set to stopped
          this.animEngine.isStopped = true;
        }
        return;
      } else {
        this.$refs.climaDirectionCanvas.style.display = 'revert';
      }
      // Check if it has animation parameter
      if (infoWMTS.dataSet.animation) {
        // OL map
        if (this.map == undefined) {
          this.map = this.$parent.map;
        }

        // Force key to identify in AnimationEngine
        infoWMTS.isWMTS = true;

        // Force arrows
        infoWMTS.dataSet.animation.useArrows = true;

        // Create animation engine
        if (this.animEngine == undefined) {
          this.animEngine = new AnimationEngine(this.canvas, this.map, infoWMTS, undefined);
          // Bind events
          // Map events for animation
          this.$parent.map.on('moveend', this.animEngine.onMapMoveEnd);
          this.$parent.map.on('movestart', this.animEngine.onMapMoveStart);
        } else {
          if (this.animEngine.isStopped) {
            // Map events for animation
            this.$parent.map.on('moveend', this.animEngine.onMapMoveEnd);
            this.$parent.map.on('movestart', this.animEngine.onMapMoveStart);
          }
          this.animEngine.isStopped = false;
          this.animEngine.setWMTSSource(infoWMTS);
        }
        return
      }
      // Hide animation layer
      else {
        if (this.animEngine != undefined) {
          // removeEventListener Map events for animation
          this.$parent.map.un('moveend', this.animEngine.onMapMoveEnd);
          this.$parent.map.un('movestart', this.animEngine.onMapMoveStart);
          // Stop animation
          this.animEngine.isStopped = true;
          // Clear canvas
          this.animEngine.clearCanvas();
        }

      }
    },


    // PUBLIC
    // Update canvas size and drawings
    onMapMoveEnd: function () {
      // OL map
      if (this.map == undefined) {
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
.climaDirectionCanvas {
  background: none;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0px;
  pointer-events: none;
}
</style>