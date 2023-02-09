<template>
  <!-- Container -->
  <div id='timeSlider' ref='timeSlider'>
    <div id="toolTip" ref="toolTip" style="display: flex; justify-content: center;">
      <div>{{ timeStr }}</div>
    </div>
    <input type="range" ref="slider" id="slider" min="0" max="10" v-on:click="onClick($event)" v-on:change="onChange($event)" v-on:input="onInput($event)">
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
    window.eventBus.on('HFRadarDataLoaded', (tmst) => {
      let startEndDates = window.DataManager.getStartEndDates();
      // Calculate number of hours in between
      let sDate = new Date(startEndDates.startDate);
      let eDate = new Date(startEndDates.endDate);

      this.$refs.slider.min = sDate.getTime()/(1000*60*60);
      this.$refs.slider.max = eDate.getTime()/(1000*60*60);

      this.$refs.slider.value = this.$refs.slider.max;

      this.timeStr = eDate.toISOString();

      // let timeDiff = eDate.getTime() - sDate.getTime();
      // let numHours = timeDiff/(1000*60*60);
    })
    
  },
  data (){
    return {
      timeStr:'Loading latest data...',
    }
  },
  methods: {
    onClick: function(e){
      e.preventDefault();
      //e.stopPropagation();
    },

    // When element loses focus
    onChange: function(e){
      let timestamp = new Date(e.target.value*1000*60*60).toISOString();
      // Date change event
      window.eventBus.emit('SelectedDateChanged', timestamp);
    },

    // When element is dragged
    onInput: function(e){
      // Update self tooltip
      let dd = new Date(e.target.value*1000*60*60);
      this.timeStr = dd.toISOString();
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
  width: 80%;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  -ms-transform: translateX(-50%);
  z-index: 10;
}

#slider {
  width: 100%;
}

#toolTip {
  background: rgba(255, 255, 255, 0.432);
  color: white;
  padding: 5px;
  border-radius: 5px;
  margin-bottom: 5px;
}
</style>