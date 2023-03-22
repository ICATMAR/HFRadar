<template>
  <!-- Container -->
  <div id="app-manager" ref="appManager">

    <div id="map-container" >
      <!-- Map -->
      <mapOL></mapOL>

      <!-- Side planel -->
      <side-panel></side-panel>
    </div>

    <!-- Central Panel -->
    <!-- <central-panel></central-panel> -->

    <!-- Banner -->
    <img class="Banner" src="Assets/Banner.png">
  </div>
</template>



<script>


// Import components
import Map from "./Map.vue"
import SidePanel from "./SidePanel.vue"
// import CentralPanel from "./CentralPanel.vue"


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
    //window.DataManager.loadStaticFiles();
    window.DataManager.loadStaticFilesRepository(); // Real-time data
    //window.DataManager.loadStaticFilesRepository('2023-03-02T11:00Z', '2023-03-07T16:00Z'); // Specific dates with data

    // Load legends
    window.FileManager.loadLegends().then (values => {
      window.eventBus.emit('AppManagerLegendsLoaded', values);
    });
  },
  data (){
    return {

    }
  },
  methods: {
    //onclick: function(e){},
  },
  components: {
    "mapOL": Map,
    "side-panel": SidePanel,
    // "central-panel": CentralPanel,
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

  .Banner {
    width: 100px;
    position:absolute;
    top: 20px;
    left: 60px;
  }
  @media screen and (max-width: 1000px) {
    .Banner {
      width: 60px;
    }
  }
</style>