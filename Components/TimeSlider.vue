<template>
  <!-- Container -->
  <div id='timeSlider' ref='timeSlider'>
    <input type="range" ref="slider" id="slider" min="0" max="10" v-on:click="onClick($event)">
  </div>
</template>


<script>

// Import components
//import Map from 'Components/Map.vue'

export default {
  name: 'timeSlider', // Caps, no -
  created() {
    
  },
  mounted() {
    window.eventBus.on('StaticDataLoaded', () => {
      let startEndDates = window.DataManager.getStartEndDates();
      // Calculate number of hours in between
      let sDate = new Date(startEndDates.startDate);
      let eDate = new Date(startEndDates.endDate);

      this.$refs.slider.min = sDate.getTime()/(1000*60*60);
      this.$refs.slider.max = eDate.getTime()/(1000*60*60);

      // let timeDiff = eDate.getTime() - sDate.getTime();
      // let numHours = timeDiff/(1000*60*60);
    })
    
  },
  data (){
    return {
      
    }
  },
  methods: {
    onClick: function(e){
      e.preventDefault();
      //e.stopPropagation();
      console.log(e);
      console.log(new Date(e.target.value*1000*60*60))
    },
  },
  components: {
    //'map': Map,
  }
}
</script>




<style scoped>
#timeSlider {
  position:absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  -ms-transform: translateX(-50%);
  z-index: 10;
}
</style>