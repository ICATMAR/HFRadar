<template>
  <!-- Container -->
  <div id="app-manager" ref="appManager">

    <div style="display:flex;flex-direction: row;">
    <!-- Map -->
    <mapOL></mapOL>

    <!-- Side planel -->
    <side-panel></side-panel>
    </div>

    <!-- Central Panel -->
    <central-panel></central-panel>

    <!-- Banner -->
    <img class="Banner" src="Assets/Banner.png">
  </div>
</template>



<script>


// Import components
import Map from "./Map.vue"
import SidePanel from "./SidePanel.vue"
import CentralPanel from "./CentralPanel.vue"


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
    "central-panel": CentralPanel,
  }
}
</script>


<style scoped>
#app-manager {
    width: 100vw;
    height: 100vh;
    position: fixed;
  }

  .Banner {
    width: 230px;
    position:absolute;
    top: 10px;
    left: 10px;
  }
  @media screen and (max-width: 800px) {
    .Banner {
      width: 150px;
    }
  }
</style>