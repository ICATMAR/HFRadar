<template>
  
  <!-- Download data top-right button -->
  <button class="hiddenInMobile download-button clickable" @click="downloadIconClicked" v-if="!isVisible"><span>Download data</span></button>

  <button class="visibleInMobile download-button-icon icon-str clickable" @click="downloadIconClicked" v-if="!isVisible">
    <span class="fa">&#xf019;</span>
  </button>

  <Transition>
    <div class="container" v-if="isVisible">

      <!-- Close -->
      <div class="close-panel-cross clickable" @click="isVisible = false"><span>&#x2715</span></div>

      <!-- Title -->
      <div class="container-title">
        <span>Download settings</span>
      </div>


      <!-- Variable option -->
      <div class="option-container">
        <span>Select the variable</span>
        <!-- Button group -->
        <div class="button-group">
          <button class="clickable" :class="[selVariable == 'currents' ? 'button-active' : '']" @click="selVariable = 'currents'"><span>Sea surface velocities</span></button>
          <button class="clickable" :class="[selVariable == 'waves' ? 'button-active' : '']" @click="selVariable = 'waves'"><span>Waves</span></button>
        </div>
      </div>



      <!-- File format option -->
      <div class="option-container" v-if="selVariable == 'currents'">
        <span>Choose the file format</span>
        <!-- Button group -->
        <div class="button-group">
          <!-- <button class="clickable" :class="[selFormat == 'tuv' ? 'button-active' : '']" @click="selFormat = 'tuv'"><span>.tuv</span></button> -->
          <button class="clickable" :class="[selFormat == 'nc' ? 'button-active' : '']" @click="selFormat = 'nc'"><span>netCDF</span></button>
          <button class="clickable" :class="[selFormat == 'geojson' ? 'button-active' : '']" @click="selFormat = 'geojson'"><span>geojson</span></button>
        </div>
        <!-- Warning -->
        <span v-if="selFormat=='tuv'">Warning: tuv files do not have a quality control.</span>
      </div>


      <!-- Time span option -->
      <div class="option-container" v-if="selVariable == 'currents'">
        <span>Select the time span</span>
        <!-- Button group -->
        <div class="button-group">
          <button class="clickable" :class="[selTimespan == 'selected' ? 'button-active' : '']" @click="selTimespan = 'selected'"><span>Displayed time</span></button>
          <button class="clickable" :class="[selTimespan == 'lastDay' ? 'button-active' : '']" @click="selTimespan = 'lastDay'"><span>Last 24h</span></button>
          <button class="clickable" :class="[selTimespan == 'last3days' ? 'button-active' : '']" @click="selTimespan = 'last3days'"><span>Last 3 days</span></button>
        </div>
      </div>

      <!-- Time span option -->
      <div class="option-container" v-if="selVariable == 'waves'">
        <span>Select the time span</span>
        <!-- Button group -->
        <div class="button-group">
          <button class="clickable button-active"><span>Latest month</span></button>
        </div>
      </div>
      

      <!-- Estimated file size -->
      <div class="container-text">
        <span v-if="selVariable == 'currents'">Estimated file size: {{ selTimespan == 'selected' ? estimatedSize[selFormat] : selTimespan == 'lastDay' ? Math.round(estimatedSize[selFormat]*24) : Math.round(estimatedSize[selFormat]* 24*7) }} MB
        </span>

        <span v-if="selVariable == 'waves'">Estimated maximum file size: 4 MB
        </span>
      </div>


      <!-- Disclaimer -->
      <div class="container-text disclaimer">
        <span>These data are public and free of charge. User assumes all risk for use of data. 
          User must display citation in any publication o product using data. User must contact ICATMAR prior to any commercial use of data.
          HF radar sea surface current velocity dataset by ICATMAR is licensed under a <a class="clickable" href="https://creativecommons.org/licenses/by/4.0/" target="_blank">CC-BY-4.0</a>.
        </span>
      </div>

      <!-- Cookies warning -->
      <div class="container-text disclaimer" v-if="mustShowCookieWarning">
        <span><strong>Downloading the data implies acknowledgment of our use of cookies to monitor download activity and improve our services.
        </strong></span>
      </div>
      
      <!-- Download buttons -->
      <div class="buttons-container">
        <!-- Download -->
        <button class="btn-download" :class="[canDownload ? 'clickable' : 'unavailable']" @click="downloadClicked">Download</button>
        <!-- Close -->
        <button class="btn-cancel clickable" @click="isVisible = false">Cancel</button>
      </div>

      <!-- Warning no data available -->
      <div class="container-text" v-if="!canDownload">
        <span>Downloading data...</span>
      </div>

      <!-- Horizontal white line -->
      <div class="white-line"></div>

      <div class="buttons-container">
        <button class="btn-ftp clickable" onclick="window.open('https://icatmar.cat/visors/servei-de-dades/', '_blank')">
          Access FTP server .
          <span class="fa"> &#xf1c0</span>.
        </button>
      </div>
      
      
    </div>
  </Transition>
</template>


<script>

export default {
  name: "DownloadDataMenu",
  mounted(){
    //this.isVisible = true; // debug
    window.eventBus.on('HFRadarDataLoaded', () => {
      this.canDownload = true;  
    });
  },
  data() {
    return {
      isVisible: false,
      canDownload: false,
      selVariable: 'currents',
      selFormat: 'geojson',
      selTimespan: 'selected',
      estimatedSize: {
        'geojson': 0.18,
        'nc': 0.65,
        'tuv': 0.078
      },
    }
  },
  methods: {
    // USER INTERACTION
    // Information about cookies settings is in index.html
    downloadClicked: function(e){
      // Update cookies
      // Google analytics and cookies
      let params = {
        ad_storage: 'denied',
        ads_data_redaction: 'false',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'granted',
      }
      gtag('consent', 'update', params);
      // Store cookies
      localStorage.setItem('cookie-analytics', JSON.stringify(params));

      this.mustShowCookieWarning = false;


      // Check the time span selected
      // Download single file
      if (this.selVariable == "currents"){
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
      } 
      // Waves
      else {
        // Download latest month of waves
        this.downloadWavesLatestMonth();
      }
      
      // TODO
      // If we want a week, these files need to be loaded first. FileManager.requested files can be used
      
      
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

      // Selected format
      let selFormat = this.selFormat;

      let url = '';
      if (selFormat == 'nc')
        url = baseURL + 'L3/netcdf/' + year + '/' + month + '/TOTL_CATS_' + year + '_' + month + '_' + day + '_' + hour + '00.' + selFormat;
      else
        url = baseURL + 'L3/'+ selFormat +'/' + year + '/' + month + '/TOTL_CATS_' + year + '_' + month + '_' + day + '_' + hour + '00.' + selFormat;

      // Event for GA tracker
      window.eventBus.emit('DownloadDataMenu_Download', {fileFormat: selFormat, processStage: 'L3', date: dateISO, numFiles: 1});

      // Download file
      let link = document.createElement('a');
      link.download = 'ICATMAR_Currents_' + dateISO.replaceAll(":", "_") + '.' + selFormat;
      link.href = url;
      link.click();
      link.delete;
    },

    // Download last 24h
    downloadLast24h: function(){
      this.downloadLatestMultipleFiles(24, 'latest24h');
    },
    // Download last 3 days
    downloadLast3days: function(){
      this.downloadLatestMultipleFiles(24*3, 'latest3days');
    },

    // Download multiple files
    downloadLatestMultipleFiles: async function(hours, filename){
      
      // Download latest files
      let fileTypes = [this.selFormat]; // Only load files with the selected format
      let nowDate = new Date();
      let endTime = nowDate.toISOString();
      let startTime = nowDate.setUTCHours(nowDate.getUTCHours() - hours);
      
      this.canDownload = false;
      await window.DataManager.loadStaticFilesRepository(startTime, endTime, fileTypes);
      this.canDownload = true;

      let latestTmst = window.DataManager.latestDataTmst;

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
        tmpStr = tmpStr.replaceAll('-','_').replaceAll(':', '_');
        // Generate key that is the same as the tmst in the file name
        // /data/observational/hf_radar/currents/L3/tuv/2024/01/TOTL_CATS_2024_01_31_0900.tuv
        let keyStr = tmpStr.substring(0,10) + '_' + tmpStr.substring(11,13) + '00.' + this.selFormat;
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
      window.eventBus.emit('DownloadDataMenu_Download', {fileFormat: this.selFormat, processStage: 'L3', date: latestTmst, numFiles});

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

    },

    // Download wave data
    downloadWavesLatestMonth: async function(){

      // Download latest files
      let fileTypes = ['wls']; // Only load files with the selected format
      let nowDate = new Date();
      let nowDateISO = nowDate.toISOString();
      
      this.canDownload = false;
      await window.DataManager.loadStaticFilesRepository(nowDateISO, nowDateISO, fileTypes);
      this.canDownload = true;

      let latestTmst = window.DataManager.latestDataTmst;

      // Create JSZip
      let zip = new JSZip();
      // Keep track of number of files
      let numFiles = 0;

      // Iterate all files
      // Get ISO string
      nowDateISO = nowDateISO.replaceAll('-','_');
      // Generate key that is the same as the tmst in the file name
      // /data/observational/hf_radar/waves/CREU/2024/WVLM_CREU_2024_03_01_0000.wls
      let keyStr = nowDateISO.substring(0,7) + '_01_' + '0000.wls'
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
        }
      }
      
      // Event for GA tracker
      window.eventBus.emit('DownloadDataMenu_Download', {fileFormat: 'wls', processStage: 'none', date: latestTmst, numFiles});

      // Generate zip and download
      zip.generateAsync({type:"blob"})
      .then(function(content) {
        let blobUrl = URL.createObjectURL(content);
        let link = document.createElement('a');
        link.download = 'ICATMAR_wavesLatestMonth_' + nowDateISO.substring(0,10) + '.zip';
        link.href = blobUrl;
        link.click();
        link.delete;
      });
    },


    // Download button clicked
    downloadIconClicked: function(){
      if (localStorage.getItem('cookie-analytics')){
        let params = JSON.parse(localStorage.getItem('cookie-analytics'));
        if (params.analytics_storage == "denied")
          this.mustShowCookieWarning = true;
        else
          this.mustShowCookieWarning = false;
      } else
        this.mustShowCookieWarning = true;

      this.isVisible = true;
    },



  }
}

</script>



<style scoped>


.download-button {
  background: var(--lightBlue);
  height: 28px;

  margin-left: 3px;
  margin-right: 3px;
}

.download-button:hover {
  background: var(--blue) !important;
}

.download-button-icon {
  height: 28px;
  width: 28px;

  margin-left: 3px;
  margin-right: 3px;

  padding: 0px;
}

.download-button:hover {
  background: var(--lightBlue)
}

.container {
  position: fixed;
  top: 40px;
  right: 30px;

  max-width: 500px;
  width: 80%;

  max-height: 80%;
  overflow-y: auto;
  overflow-x: hidden;

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

.disclaimer {
  text-align: justify;
}

a {
  color: white;
}

.buttons-container {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
}

.btn-download {
  padding: 15px;
  max-height: 34px;
}

.btn-cancel {
  font-size: small;
  max-height: 34px;
}

.btn-ftp {
  padding-left: 15px;
  padding-right: 15px;
  max-height: 34px;
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