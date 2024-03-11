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
    

    <!-- Top Right Section -->
    <top-right-section></top-right-section>


    <!-- Loading circle -->
    <Transition name="fade">
        <div class="loading-circle" v-show="dataManagerIsLoading && isTimeRangeBarPlaying != true"></div>
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
      // Do not show the loading button when the TimeRangeBar is in playing mode
      this.isTimeRangeBarPlaying = window.GUIManager.isTimeRangeBarPlaying;
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
      // If radials are visible
      if (GUIManager.isAdvancedInterface){
        if (GUIManager.widgetHFRadars.isVisible){
          fileTypes.push('ruv');
        }
      }
      // Load files
      window.DataManager.loadLatestStaticFilesRepository(fileTypes).then(hfRadar => {
        let tmst;
        if (hfRadar != undefined){
          tmst = hfRadar.latestTimestamp; // Use latest timestamp (not last loaded)
          window.eventBus.emit('HFRadarDataLoaded', hfRadar.latestTimestamp);
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
</style>