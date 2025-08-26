<template>
  <!-- Container -->
  <div id='timeSlider' ref='timeSlider'>
    <!-- Tooltip -->
    <div id="toolTip" ref="toolTip">
      <button v-show="isDataAvailableAtHour.length > 0" class="bbArrow backTime clickable" @click="moveBackward">&lt;</button>
      <div :title=currentTmst>{{ timeStr }}</div>
      <button v-show="isDataAvailableAtHour.length > 0" class="bbArrow forwardTime clickable" @click="moveForward">></button>
    </div>

    <!-- Slider and data availability-->
    <div class="sliderElement" draggable="false">
      <!-- Data availability -->
      <div id ='dataAvailability'>
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
    // HACK: FOR SOME (CSS) REASON THE SLIDER DOES NOT ALLOW DRAGGING
    // THEREFORE CREATE OWN EVENTS
    const slider = this.$refs.slider;
    slider.addEventListener('mousedown', (event) => {
      event.preventDefault(); // Prevent the default drag-and-drop behavior
      slider.focus(); // Ensure the slider is in focus
      // Add an event listener for the mousemove event
      document.addEventListener('mousemove', handleSliderMove);
      handleSliderMove(event);
    });
    // Add an event listener for the mouseup event to stop tracking the slider movement
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', handleSliderMove);
    });
    // Function to handle slider movement
    const handleSliderMove = (event) => {
      const sliderRect = slider.getBoundingClientRect();
      const offsetX = event.clientX - sliderRect.left;
      const percentage = (offsetX / sliderRect.width) * 100;

      // Update the slider value based on the mouse position
      slider.value = Math.round(0.01*percentage*(slider.max-slider.min) + 1*slider.min);
      this.onChange({target: slider});
      //this.onInput({target: slider});
    }





    // EVENTS
    // HFRadar load
    window.eventBus.on('HFRadarDataLoaded', (tmst) => {
      
      let startEndDates = window.DataManager.getStartEndDatesTotals();
      if (startEndDates == undefined)
        return;
      // If tmst is not defined, set it to latest
      tmst = tmst || window.GUIManager.currentTmst;

      // Calculate number of hours in between
      let sDate = new Date(startEndDates.startDate);
      let eDate = new Date(startEndDates.endDate);
      // Time range
      this.$refs.slider.min = sDate.getTime()/(1000*60*60);
      this.$refs.slider.max = eDate.getTime()/(1000*60*60);

      let currentDate = new Date(tmst);
      this.$refs.slider.value = currentDate.getTime()/(1000*60*60);

      this.timeStr = this.formatTimestampString(currentDate.toISOString());
      
      this.updateDataAvailability(sDate, eDate);
      // Date change event
      window.eventBus.emit('TimeSlider_SelectedDateChanged', tmst);
    });

    // Repeated function for date changing events
    const dateHasChanged = tmst => {
      let currentDate = new Date(tmst);
      this.$refs.slider.value = currentDate.getTime()/(1000*60*60);
      this.timeStr = this.formatTimestampString(tmst);
    }
    // Initial load and user changing hash TIME in URL
    window.eventBus.on('GUIManager_URLDateChanged', dateHasChanged);
    // User clicked on Active sync and turned it on
    window.eventBus.on('TopRightCanvas_ActiveSyncClickedAndOn', dateHasChanged);
    // DataStreamsBar in advanced interface
    window.eventBus.on('DataStreamsBar_SelectedDateChanged', dateHasChanged);

    // Automatic minute update
    this.updateTimeString();
    
  },
  data (){
    return {
      timeStr:'Loading latest data...',
      isDataAvailableAtHour: new Array(),
      numHours: 1,
      currentTmst: undefined,
    }
  },
  methods: {
    onClick: function(e){
      e.preventDefault();
      e.stopPropagation();
    },

    // When element loses focus (mouseup)
    // Slider change
    onChange: function(e){
      let timestamp = new Date(e.target.value*1000*60*60).toISOString();
      this.timeStr = this.formatTimestampString(timestamp);
      // Date change event
      window.eventBus.emit('TimeSlider_SelectedDateChanged', timestamp);
      // TODO: mixing between timerangebar and datastreamsbar EMIT UPDATE CURRENT DATE TODO CHANGE
      window.eventBus.emit('DataStreamsBar_SelectedDateChanged', timestamp)
    },

    // When element is dragged
    onInput: function(e){
      // Update self tooltip
      let dd = new Date(e.target.value*1000*60*60);
      this.timeStr = this.formatTimestampString(dd.toISOString());
    },

    // Time arrows clicked
    moveForward: function(){
      let tempValue = parseInt(this.$refs.slider.value) + 1;
      this.$refs.slider.value = parseInt(Math.min(tempValue, this.$refs.slider.max)).toString();
      this.onInput({target: this.$refs.slider});
      this.onChange({target: this.$refs.slider});
    },
    moveBackward: function(){
      let tempValue = parseInt(this.$refs.slider.value) - 1;
      this.$refs.slider.value = parseInt(Math.max(tempValue, this.$refs.slider.min)).toString();
      this.onInput({target: this.$refs.slider});
      this.onChange({target: this.$refs.slider});
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
          if (HFRadar.constructor.name == "CombinedRadars"){
            let timestamps = Object.keys(HFRadar.data);
            for (let j = 0; j<timestamps.length; j++){
              let tmpDate = new Date(timestamps[j]);
              let hourIndex = (tmpDate.getTime() - sDate.getTime())/(1000*60*60);
              this.isDataAvailableAtHour[hourIndex] = true;
            }
          }
        }

      }
    },
    // Update time string to display
    updateTimeString: function(){
      if (this.numHours > 1) {
        let tempValue = parseInt(this.$refs.slider.value);
        this.$refs.slider.value = parseInt(Math.min(tempValue, this.$refs.slider.max)).toString();
        this.onInput({target: this.$refs.slider});
      }

      // Loop
      setTimeout(() => {
        this.updateTimeString();
      }, 30*1000); // Every 30 seconds
    },


    formatTimestampString: function(tmst){
      this.currentTmst = tmst;
      let dd = new Date(tmst);
      let ss = dd.toLocaleString('en-GB');
      ss = ss.substring(0, ss.length - 6) + ':00';
      // Add time difference from now
      let now = new Date();
      let timeDiff = dd.getTime() - now.getTime();
      let hoursDiff = Math.floor(timeDiff/(60*60*1000));
      let minDiff = 60 - Math.floor(timeDiff/(60*1000) - hoursDiff*60);
    
      if (hoursDiff < -24 * 31){
        return ss;
      }
      else if (hoursDiff < -24){
        let daysDiff = Math.floor(hoursDiff / 24);
        hoursDiff = hoursDiff - daysDiff*24;
        return ss + " ("+ daysDiff + "d " + Math.abs(hoursDiff+1) + "h)";
      } else
        return ss + " (" + (hoursDiff+1) + "h " + minDiff + "min)";
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

.bbArrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 100%;
  font-size: large;
  width: 30px;
  margin-left: 5%;
  margin-right: 5%;
  height: 30px;
  background-color: var(--lightBlue);
}

.bbArrow:hover {
  background-color: var(--blue);
}



#toolTip {
  /* background: rgba(255, 255, 255, 0.432); */
  background: rgba(var(--lightBlueRGB), 0.4);
  color: white;
  padding: 5px;
  border-radius: 5px;
  margin-bottom: 5px;

  font-size: clamp(0.6rem, 1.5vw, 1rem);

  display: flex;
  justify-content: center;
  align-items: center;
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
  background-color: var(--red);
  padding: 2px;
  transform: translateX(-2px);
  -ms-transform: translateX(-2px);
}

.sliderElement{
  user-select: all;
  pointer-events: all;
}
</style>