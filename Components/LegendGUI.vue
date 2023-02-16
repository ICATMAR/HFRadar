<template>
  <!-- Container -->
  <div id='legendGUI' ref='legendGUI' @mouseover="mouseOver" @mouseleave="mouseLeave">

    <div v-show="legendsLoaded">
      <img class="selLegend" :src="legendSrc">
      <div class="rangeValuesBox">
        <div class="leftRange">-100 cm/s</div>
        <div class="middleRange">0</div>
        <div class="rightRange">100 cm/s</div>
      </div>
    </div>

    <!-- Drop-down with other legends -->
    <span v-show="isMouseOver">
      <div v-for="legend, index, in legends" @click="legendClicked($event, index)">
        <img :src="legend.img.src">
      </div>
    </span>
  </div>
  
</template>


<script>

// Import components
//import Map from 'Components/Map.vue'

export default {
  name: 'legendGUI', // Caps, no -
  created() {
    
  },
  mounted() {
    // When legends are loaded
    window.eventBus.on('legendsLoaded', (legends) => {
      this.legends = legends;
      this.legendsLoaded = true;
      this.legendSrc = legends[this.legendIndex].img.src;
      this.emitLegendChanged(this.legends[this.legendIndex]);
    })
  },
  data (){
    return {
      legends: [],
      legendIndex: 0,
      legendSrc: '',
      isMouseOver: false,
    }
  },
  methods: {
    // USER INTERACTION
    mouseOver: function(){
      this.isMouseOver = true;
    },
    mouseLeave: function(){
      this.isMouseOver = false;
    },
    // Legend clicked
    legendClicked: function(e, index){
      this.legendIndex = index;
      this.legendSrc = this.legends[index].img.src;
      // Emit
      this.emitLegendChanged(this.legends[index]);
    },

    // EVENT EMITTER
    emitLegendChanged(legend){
      window.eventBus.emit('legendChanged_LegendGUI', legend);
    },
  },
  components: {
    //'map': Map,
  }
}
</script>




<style scoped>
#legendGUI {
  position: absolute;
  /* width: 80%; */
  bottom: 90px;
  right: 10%;
  z-index: 10;

  align-items: flex-end;
  display: flex;
  flex-direction: column-reverse;
  
}

img {
  width:200px; 
  height:20px;
  border-radius: 5px;
}

.selLegend {
  margin-top: 10px;
  margin-bottom: 10px;
}

.selLegend:hover, img:hover {
  border-radius: 5px;
  border: 2px solid white;
  height: 22px;
  width: 202px;
  cursor:pointer;
}

.rangeValuesBox {
  display: flex;
  justify-content: space-between;
  color: white;
  font-size: small;
}

.leftRange {
  transform: translateX(-50%);
  -ms-transform: translateX(-50%);
}

.middleRange {
  transform: translateX(-50%);
  -ms-transform: translateX(-50%);
}

.rightRange {
  transform: translateX(50%);
}
</style>