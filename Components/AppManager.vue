<template>
  <!-- Container -->
  <div id="app-manager" ref="appManager">

    <div id="map-container" >
      <!-- Map -->
      <mapOL></mapOL>

      <!-- Side planel -->
      <side-panel v-show="isAdvancedInterfaceOnOff"></side-panel>

      <!-- Menu Left -->
      <menu-left></menu-left>
    </div>

    <!-- Central Panel -->
    <central-panel></central-panel>

    <!-- ICONS -->
    <a href="https://icatmar.cat/">
      <img class="logo clickable icatmar-logo" src="Assets/Images/icatmar-mini-logo.svg">
    </a>
    <a href="https://icatmar.cat/visors/xarxa-observacional/">
      <img class="logo clickable obs-logo" src="Assets/Images/ocea-mini-1.svg">
    </a>
    <!-- Repository -->
    <a href="https://github.com/ICATMAR/HFRadar" target="_blank">
      <svg height="32" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="32" data-view-component="true" class="logo clickable github-logo">
          <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
      </svg>
    </a>

    <!-- Top Right Section -->
    <top-right-section></top-right-section>

    <!-- Cookie banner -->
    <cookie-banner></cookie-banner>

    <!-- Download data menu -->
    <download-data-menu></download-data-menu>

    <!-- Loading circle -->
    <Transition name="fade">
        <div class="loading-circle" v-show="dataManagerIsLoading"></div>
    </Transition>
  </div>
</template>



<script>


// Import components
import Map from "./Map/Map.vue";
import SidePanel from "./SidePanel.vue";
import MenuLeft from "./MapWidgets/MenuLeft.vue";
import CentralPanel from "./Panels/CentralPanel.vue";
import TopRightSection from "./TopRightSection/TopRightSection.vue";
import CookieBanner from "./CookieBanner.vue";
import DownloadDataMenu from "./DownloadDataMenu.vue";


export default {
  name: "AppManager",
  created() {
    
  },
  mounted() {
    // Mobile bottom bar full height fix
    // https://dev.to/admitkard/mobile-issue-with-100vh-height-100-100vh-3-solutions-3nae
    this.$refs.appManager.style.height = window.innerHeight + 'px';
    window.onresize =  () => {
      this.$refs.appManager.style.height = window.innerHeight + 'px';
    }; 

    // Load data
    // Check if we are working in the latest date
    let nowISODate = new Date().toISOString().substring(0, 14) + '00:00.000Z';
    if (nowISODate == window.GUIManager.currentTmst){
      this.loadLatestCurrents();
    } else {
      window.DataManager.loadOnInteraction(window.GUIManager.currentTmst);
    }
    
    
    //window.DataManager.loadStaticFilesRepository().then((lastHFRadar) => {
      //window.eventBus.emit('HFRadarDataLoaded', lastHFRadar.lastLoadedTimestamp);
    //});

    
    //window.DataManager.loadStaticFilesRepository('2023-03-02T11:00Z', '2023-03-07T16:00Z'); // Specific dates with data

    // Load legends
    window.FileManager.loadLegends().then (values => {
      window.eventBus.emit('AppManagerLegendsLoaded', values);
    });
    window.FileManager.loadBaseLayerIcons().then(values => {
      window.eventBus.emit('AppManager_BaseLayerIconsLoaded', values);
    });


    // EVENTS
    // Advanced interface
    window.eventBus.on("AdvancedInterfaceOnOff", state => {
      if (!state) // Emits an event that resizes the map canvas
        window.eventBus.emit('SidePanelSizechanged', this.showPanel);
      this.isAdvancedInterfaceOnOff = state;
    });
    // DataManager is loading
    window.eventBus.on("DataManager_pendingRequestsChange", pendingRequests => {
      this.dataManagerIsLoading = pendingRequests > 0;
    });
  },
  data (){
    return {
      isAdvancedInterfaceOnOff: false,
      dataManagerIsLoading: false,
    }
  },
  methods: {
    //onclick: function(e){},

    // INTERNAL
    loadLatestCurrents: function(){
      // First files of real-time data --> load them first to show something on the website
      let fileTypes = ['tuv']; // Only load tuv files at the beginning
      window.DataManager.loadLatestStaticFilesRepository(fileTypes).then(hfRadar => {
        let tmst;
        if (hfRadar != undefined){
          tmst = hfRadar.lastLoadedTimestamp;
          window.eventBus.emit('HFRadarDataLoaded', hfRadar.lastLoadedTimestamp);
        }
        return tmst;
      })
      // Load the rest of the files
      .then((tmst) =>{
        // Add wave files that will create radar objects
        fileTypes.push('wls');
        // Reduce tmst by 1h, as this timestamp is already loaded.
        if (tmst != undefined){
          let tmp = new Date(tmst);
          tmp.setUTCHours(tmp.getUTCHours() - 1);
          tmst = tmp.toISOString();
        }
        // Load data
        let useWorker = true;
        
        // Use web worker to load the rest of the files
        // TODO: with web worker is hard to track pending requests? should this be managed from DataManager instead of here?
        if (window.DataWorker && useWorker){
          // File manager emits HFRadarDataLoaded
          window.DataWorker.postMessage(['loadStaticFilesRepository', [undefined, tmst, fileTypes]]);
        } 
        // Fallback option
        else {
          window.DataManager.loadStaticFilesRepository(undefined, tmst, fileTypes).then((hfRadar) => {
          if (hfRadar != undefined)
            window.eventBus.emit('HFRadarDataLoaded');
          });
          
          
        }
        
      });
    }
  },
  components: {
    "mapOL": Map,
    "side-panel": SidePanel,
    "menu-left": MenuLeft,
    "central-panel": CentralPanel,
    "top-right-section": TopRightSection,
    "cookie-banner": CookieBanner,
    "download-data-menu": DownloadDataMenu,
  }
}
</script>


<style scoped>
#app-manager {
    width: 100vw;
    height: 100vh;
    position: fixed;
  }

  #map-container {
    display:flex;
    flex-direction: row;
    width: 100%;
    height: 100%;
    position:fixed;
  }

.logo {
  width: clamp(70px, 7vw, 100px);
  height: clamp(70px, 7vw, 100px);
  position: fixed;
  top: 10px;
  padding: 0px;
  margin: 0px;
  z-index: 10;
}

.icatmar-logo {
  left: 50px;
}

.obs-logo {
  left: clamp(110px, 9vw, 140px);
}

.github-logo {
  background: white;
  border-radius: 50%;
  border-color: black !important;
  border-width: thick;
  border: double;
  width: 28px;
  height: 28px;

  right: 35px;
  top: 6px;
}
</style>