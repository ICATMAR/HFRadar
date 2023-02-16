<template>
  <!-- Container -->
  <div id='legendGUI' ref='legendGUI' @mouseover="mouseOver" @mouseleave="mouseLeave">

    <div v-show="legendsLoaded">
      <img class="selLegend" :src="legendSrc">
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
      window.eventBus.emit('legendChanged_LegendGUI', this.legends[index]);
    }
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
  right: 10px;
  z-index: 10;

  align-items: flex-end;
  display: flex;
  flex-direction: column-reverse;
  
}

img {
  width:100px; 
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
  width: 102px;
  cursor:pointer;
}
</style>