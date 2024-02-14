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
          <button class="clickable" :class="[selTimespan == 'lastDay' ? 'button-active' : '']" @click="selTimespan = 'lastDay'"><span>Last 24h</span></button>
          <button class="clickable" :class="[selTimespan == 'last3days' ? 'button-active' : '']" @click="selTimespan = 'last3days'"><span>Last 3 days</span></button>
        </div>
      </div>
      

      <!-- Text -->
      <div class="container-text">
        <span>Estimated file size: {{ selTimespan == 'selected' ? estimatedSize : selTimespan == 'lastDay' ? Math.round(estimatedSize*24) : Math.round(estimatedSize* 24*7) }} MB
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
    //this.isVisible = true;

    window.eventBus.on('HFRadarDataLoaded', () => {
      if (window.GUIManager.intialLoadDone) // Just avoids a first initial load of the latest current file
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
      // Check the time span selected
      // Download single file
      if (this.selTimespan == 'selected'){
        this.downloadSelectedTmst();
      }
      // Last 24h
      else if (this.selTimespan == 'lastDay'){
        this.downloadLast24h();
      }
      // Last 3 days
      else if (this.selTimespan == 'last3days'){
        this.downloadLast3days();
      }
      // TODO
      // If we want a week, these files need to be loaded first. FileManager.requested files can be used
      
      //this.isVisible = false;
    },

    // Download single file
    downloadSelectedTmst: function(){
      // If timestamp is defined continue
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

      // Event for GA tracker
      window.eventBus.emit('DownloadDataMenu_Download', {fileFormat: 'tuv', processStage: 'L3', date: dateISO, numFiles: 1});

      // Download file
      let link = document.createElement('a');
      link.download = 'ICATMAR_Currents_' + dateISO + '.tuv';
      link.href = url;
      link.click();
      link.delete;
    },

    // Download last 24h
    downloadLast24h: function(){
      this.donwloadLatestMultipleFiles(24, 'latest24h');
    },
    // Download last 3 days
    downloadLast3days: function(){
      this.donwloadLatestMultipleFiles(24*7, 'latest3days');
    },

    // Download multiple files
    donwloadLatestMultipleFiles: function(hours, filename){
      // Get current date
      let movingDate = new Date();

      let latestTmst = DataManager.latestDataTmst;
      if (latestTmst == undefined){
        debugger;
        return;
      }

      // Create JSZip
      let zip = new JSZip();
      // Keep track of number of files
      let numFiles = 0;

      // Iterate all files
      for (let i = 0; i < hours; i++){
        let movingDate = new Date(latestTmst);
        movingDate.setHours(movingDate.getHours() - i);
        // Get ISO string
        let tmpStr = movingDate.toISOString();
        tmpStr = tmpStr.replaceAll('-','_');
        // Generate key that is the same as the tmst in the file name
        // /data/observational/hf_radar/currents/L3/tuv/2024/01/TOTL_ROSE_2024_01_31_0900.tuv
        let keyStr = tmpStr.substring(0,10) + '_' + tmpStr.substring(11,13) + '00.tuv';
        // Find the file
        // TODO: consider optimizing this search (only done when downloading...)
        for (let j = 0; j < FileManager.loadedFilesLog.length; j++){
          let log = FileManager.loadedFilesLog[j];
          if (log.url.includes(keyStr)){
            // Create filename
            // Respect original name?
            let strParts = log.url.split('/');
            let filename = 'ICATMAR_' + strParts[strParts.length - 1];
            zip.file(filename, log.contentTxt);

            numFiles++;

            // Exit search loop
            j = FileManager.loadedFilesLog.length;
          }
        }
      }

      // Event for GA tracker
      window.eventBus.emit('DownloadDataMenu_Download', {fileFormat: 'tuv', processStage: 'L3', date: latestTmst, numFiles});

      // Generate zip and download
      zip.generateAsync({type:"blob"})
      .then(function(content) {
        let blobUrl = URL.createObjectURL(content);
        let link = document.createElement('a');
        link.download = 'ICATMAR_'+ filename +'.zip';
        link.href = blobUrl;
        link.click();
        link.delete;
      });
    }



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
  padding-bottom: 20px;
  text-align: center;
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