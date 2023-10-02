<template>
  
  <div id="central-panel">
    <div class="container" v-show="!hidePanel">

      <!-- Closing cross -->
      <button class="closing-cross roundButton icon-svg" @click="closePanelClicked">X</button>

      <!-- Info panel -->
      <!-- <info-panel v-show="panelName == 'infoPanel'"></info-panel> -->

      <!-- Sea panel -->
      <!-- <sea-panel v-show="panelName == 'seaPanel'"></sea-panel> -->

      <!-- Wind panel -->
      <!-- <wind-panel v-show="panelName == 'windPanel'"></wind-panel> -->

      <!-- CMEMS panel -->
      <!-- <cmems-panel v-show="panelName == 'cmemsPanel'" :isVisible="!hidePanel && panelName == 'cmemsPanel'"></cmems-panel> -->

    </div>
  </div>
  
  <div class="overlayContainer" @click="closePanelClicked" v-show="!hidePanel">
  </div>
</template>






<script>
// import InfoPanel from '/CasablancaBuoy/Components//Panels/InfoPanel.vue';
// import SeaPanel from "/CasablancaBuoy/Components/Panels/SeaPanel.vue"
// import WindPanel from "/CasablancaBuoy/Components/Panels/WindPanel.vue"
// import ExternalDataCMEMSPanel from '/CasablancaBuoy/Components/Panels/ExternalDataCMEMSPanel.vue';

export default {
  name: "CentralPanel",
  created() {

  },
  mounted() {
    // Declare listening events
    
    window.eventBus.on('CloseCentralPanel', () => {
      this.hidePanel = true;
    });
    window.eventBus.on('OpenCentralPanel', (panelName) => {
      if (this.panelName == panelName){
        this.hidePanel = !this.hidePanel;
      } else{
        this.hidePanel = false;
      }
      this.panelName = panelName;
      this.$forceUpdate();
    });

  },
  data() {
    return {
      hidePanel: true,
      panelName: '',
    }
  },
  methods: {
    // USER ACTIONS
    closePanelClicked: function(e){
      // Send event
      // Maybe do it as "emit", as only the parent reacts to it.
      // TODO: arrange events better?
      window.eventBus.emit('CloseCentralPanel');
    },
  },
  components: {
    // "sea-panel": SeaPanel,
    // "wind-panel": WindPanel,
    // "info-panel": InfoPanel,
    // "cmems-panel": ExternalDataCMEMSPanel,
  }
}
</script>



<style scoped>

.overlayContainer {
  position: fixed;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  background: rgb(198 240 255 / 70%);
  right: 0;
  bottom: 0;
  top: 0;
  left: 0;
  z-index: 10;
}



#central-panel {
  z-index: 15;
  background-color: #d7effab3;
  max-width: 700px;
  max-height: 90vh!important;
  position: relative;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  
  overflow-y: auto;

  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
}
#central-panel > div {
  max-height: 90vh !important;
  
}
@media screen and (max-width: 800px) {
  #central-panel {
    width: 100vw;
    margin: 0;
    right: 0;
    max-height: 100%!important;
    overflow-y: auto;
  }
  #central-panel>div {
    max-height: 100% !important;
    
  }
}

.closing-cross {
  position: absolute;
  right: 10px;
  margin-top: 10px;
}
</style>