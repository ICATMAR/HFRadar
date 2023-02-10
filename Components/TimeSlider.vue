<template>
  <!-- Container -->
  <div id='timeSlider' ref='timeSlider'>
    <!-- Tooltip -->
    <div id="toolTip" ref="toolTip" style="display: flex; justify-content: center;">
      <div>{{ timeStr }}</div>
    </div>

    <!-- Slider and data availability-->
    <div>
      <!-- Data availability -->
      <div id = 'dataAvailability'>
        <div>
          <template v-for="(isAvailable, index) in isDataAvailableAtHour">
            <div class="circle" v-show="isAvailable" v-bind:style="'left: ' + 100*index/numHours + '%'"></div>
          </template>
        </div>
      </div>
      <!-- Slider -->
      <input type="range" ref="slider" id="slider" min="0" max="10" v-on:click="onClick($event)" v-on:change="onChange($event)" v-on:input="onInput($event)">
    </div>

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

      let currentDate = new Date(tmst);
      this.$refs.slider.value = currentDate.getTime()/(1000*60*60);

      this.timeStr = currentDate.toISOString();

      
      this.updateDataAvailability(sDate, eDate);
    })
    
  },
  data (){
    return {
      timeStr:'Loading latest data...',
      isDataAvailableAtHour: new Array(),
      numHours: 1,
    }
  },
  methods: {
    onClick: function(e){
      e.preventDefault();
      //e.stopPropagation();
    },

    // When element loses focus (mouseup)
    // Slider change
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


    // INTERNAL EVENTS
    updateDataAvailability: function(sDate, eDate){
      let timeDiff = eDate.getTime() - sDate.getTime();
      this.numHours = timeDiff/(1000*60*60);
      this.isDataAvailableAtHour = new Array(this.numHours).fill(false);

      // TODO ITERATE ALL LOADED RADARS AND CHECK TIMESTAMPS
      if (window.DataManager){
        let HFRadars = window.DataManager.HFRadars;
        for (let i = 0; i < Object.keys(HFRadars).length; i++){

          let HFRadar = HFRadars[Object.keys(HFRadars)[i]];
          let timestamps = Object.keys(HFRadar.data);
          for (let j = 0; j<timestamps.length; j++){
            let tmpDate = new Date(timestamps[j]);
            let hourIndex = (tmpDate.getTime() - sDate.getTime())/(1000*60*60);
            this.isDataAvailableAtHour[hourIndex] = true;
          }
        }

      }
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

#dataAvailability {
  
  pointer-events: none;
  width: 100%;
  display: flex;
  justify-content: center;
  /* background: rgba(184, 238, 255, 0.5);
  border-radius: 5px; */
  /* position: relative;
  display: flex;
  justify-content: center; */
  
}

#dataAvailability > div {
  position:relative;
  width: 100%; 
  top: 8px;
  margin-left: 8px;
  margin-right: 8px
}

.circle {
  position:absolute;
  top: 50%;
  border-radius: 100%;
  background-color: rgb(255, 125, 49);
  padding: 2px;
  transform: translateX(-2px);
  -ms-transform: translateX(-2px);
}
</style>