<template>
  
  <!-- Download data top-right button -->
  <button class="download-button clickable" @click="isVisible = !isVisible" v-if="!isVisible"><span>Download data</span></button>

  <Transition>
    <div class="container" v-if="isVisible">

      <!-- Close -->
      <div class="close-panel-cross clickable" @click="isVisible = false"><span>&#x2715</span></div>

      <!-- Title -->
      <div class="container-title">
        <span>Download settings</span>
      </div>

      <!-- Subtitle -->
      <div class="container-subtitle">
        <span>Sea surface velocities</span>
      </div>



      <!-- File format option -->
      <div class="option-container">
        <span>Choose the file format</span>
        <!-- Button group -->
        <div class="button-group">
          <button class="clickable" :class="[selFormat == 'tuv' ? 'button-active' : '']" @click="selFormat = 'tuv'"><span>.tuv</span></button>
          <button class="unavailable" :class="[selFormat == 'nc' ? 'button-active' : '']" @click="selFormat = 'nc'"><span>.nc</span></button>
          <button class="unavailable" :class="[selFormat == 'geojson' ? 'button-active' : '']" @click="selFormat = 'geojson'"><span>.geojson</span></button>
        </div>
        <!-- Warning -->
        <span v-if="selFormat=='tuv'">Warning: tuv files do not have a quality control.</span>
      </div>


      <!-- File format option -->
      <div class="option-container">
        <span>Select the time span</span>
        <!-- Button group -->
        <div class="button-group">
          <button class="clickable" :class="[selTimespan == 'selected' ? 'button-active' : '']" @click="selTimespan = 'selected'"><span>Selected time</span></button>
          <button class="unavailable" :class="[selTimespan == 'lastDay' ? 'button-active' : '']" @click="selTimespan = 'lastDay'"><span>Last 24h</span></button>
          <button class="unavailable" :class="[selTimespan == 'lastWeek' ? 'button-active' : '']" @click="selTimespan = 'lastWeek'"><span>Last week</span></button>
        </div>
      </div>
      

      <!-- Text -->
      <div class="container-text">
        <span>Estimated file size: {{ selTimespan == 'selected' ? estimatedSize : selTimespan == 'lastDay' ? Math.round(estimedSize*24) : Math.round(estimatedSize* 24*7) }} MB
        </span>
      </div>
      
      <!-- Download buttons -->
      <div class="buttons-container">
        <!-- Download -->
        <button class="btn-download" :class="[canDownload ? 'clickable' : 'unavailable']" @click="downloadClicked">Download</button>
        <!-- Close -->
        <button class="btn-cancel clickable" @click="isVisible = false">Cancel</button>
      </div>

      <!-- Warning no data available -->
      <span v-if="!canDownload">Waiting until most recent data is loaded...</span>
    </div>
  </Transition>
</template>


<script>

export default {
  name: "DownloadDataMenu",
  mounted(){
    this.isVisible = true;

    window.eventBus.on('HFRadarDataLoaded', () => {
      this.canDownload = true;
    })
  },
  data() {
    return {
      isVisible: false,
      canDownload: false,
      selFormat: 'tuv',
      selTimespan: 'selected',
      estimatedSize: 0.078,
    }
  },
  methods: {
    // USER INTERACTION
    // Information about cookies settings is in index.html
    downloadClicked: function(e){
      // TODO
      // If multiple files, need to zip them into a folder
      // Also need to prepare the URL
      let tmst = GUIManager.currentTmst;
      if (tmst == undefined) {
        debugger;
        return;
      }

      let baseURL = '/data/observational/hf_radar/currents/';
      let date = new Date(tmst);
      let dateISO = date.toISOString();
      dateISO = dateISO.substring(0, 14) + '00:00.000Z'; // Hourly
      let year = dateISO.substring(0,4);
      let month = dateISO.substring(5,7);
      let day = dateISO.substring(8,10);
      let hour = dateISO.substring(11,13);

      let url = baseURL + 'L3/tuv/' + year + '/' + month + '/TOTL_ROSE_' + year + '_' + month + '_' + day + '_' + hour + '00.tuv';

      // Download file
      let link = document.createElement('a');
      link.download = 'ICATMAR_Currents_' + dateISO + '.tuv';
      link.href = url;
      link.click();
      link.delete;


      



      //this.isVisible = false;
    },
  }
}

</script>



<style scoped>


.download-button {
  position: fixed; 
  background: var(--blue);
  padding: 5px;
  top: 40px;
  right: 10px;
  z-index: 10;
}

.download-button:hover {
  background: var(--lightBlue)
}

.container {
  position: absolute;
  top: 65px;
  right: 30px;

  max-width: 500px;
  width: 80%;

  display: flex;
  flex-direction: column;
  background: rgb(20 120 167 / 80%);
  padding: 20px;
  border-radius: 20px;

  user-select: none;
}

.close-panel-cross {
  position: absolute;
  padding: 15px;
  right: 0px;
  top: 0px;
  border-radius: 10px;
}

.container-title > span {
  font-size: large;
}

.container-subtitle {

}

.container-subtitle > span {
  font-size: medium;
}

.option-container {
  display: flex;
  align-items: center;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: space-between;
  padding: 20px;    
}
.button-group {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  padding: 5px
}

.button-group > button {
  border-radius: 5px;
}

.container-text {
  padding-bottom: 20px
}

.buttons-container {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
}

.btn-download {
  padding: 15px;
}

.btn-cancel {
  font-size: small;
}

/* Transitions for elements */
.v-enter-active,
.v-leave-active {
  transition: all 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: translate(10vw, -10vh) scale(0.5);
}

</style>