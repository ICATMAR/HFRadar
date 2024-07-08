<template>
  <div class="top-right-section">
    <div class="container-section">

      <!-- Repository -->
      <a href="https://github.com/ICATMAR/HFRadar" target="_blank" title="Github repository">
        <svg height="32" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="32" data-view-component="true" class="clickable github-logo">
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
        </svg>
      </a>


      <!-- Cookie banner -->
      <cookie-banner></cookie-banner>

      <!-- Download data menu -->
      <download-data-menu></download-data-menu>

      <!-- Active sync -->
      <div class="hiddenInMobile activeSyncButton clickable" :class="[isActiveSyncOn ? 'activeSyncButtonOn' : '']" @click="changeActiveSync" title="Latest data is updated automatically when active"><span>Active Sync</span></div>
      <div class="visibleInMobile activeSyncButton activeSyncButtonIcon icon-str clickable" :class="[isActiveSyncOn ? 'activeSyncButtonOn' : '']" @click="changeActiveSync" title="Latest data is updated automatically when active">
        <span class="fa">&#xf2f1;</span>
      </div>

    </div>

  </div>
</template>






<script>

// Import components
import CookieBanner from "./CookieBanner.vue";
import DownloadDataMenu from "./DownloadDataMenu.vue";

export default {
  name: "TopRightSection",
  created() {

  },
  mounted() {
    this.isActiveSyncOn = window.GUIManager.activeSync;

    // When user clicks on timeline or changes the current date, deactivate as long as we are not in the latest date
    // Selected date changed (slider moves or drag and drop files)
    window.eventBus.on('DataStreamsBar_SelectedDateChanged', (tmst) =>{
      if (tmst != window.DataManager.latestDataTmst){
        this.isActiveSyncOn = false;
        window.GUIManager.activeSync = this.isActiveSyncOn;
      }
    });
  },
  data() {
    return {
      isActiveSyncOn: false
    }
  },
  methods: {
    // USER ACTIONS
    // onClick: function(e){
    // },
    changeActiveSync: function(e) {
      this.isActiveSyncOn = !this.isActiveSyncOn;
      window.GUIManager.activeSync = this.isActiveSyncOn;
      // If it is activated, force to be on the latest date
      if (this.isActiveSyncOn){
        // HACK: do not send tmst so that DataManager knows that it is sent from TopRightSection
        window.DataManager.loadOnInteraction().then(hfRadar => {
          window.eventBus.emit('TopRightCanvas_ActiveSyncClickedAndOn', window.DataManager.latestDataTmst);
        });
      }
    },
  },
  components: {
    "cookie-banner": CookieBanner,
    "download-data-menu": DownloadDataMenu,
  }
}
</script>



<style scoped>
.top-right-section {
  position: fixed;
  top: 6px;
  right: 35px;
  margin: 0px;
  padding: 0px;
  z-index: 10;
}

.container-section{
  display: flex;
  flex-direction: row-reverse;
}

.container-section > * {
  padding-left: 3px;
  padding-right: 3px;
}


.github-logo {
  background: white;
  border-radius: 50%;
  border-color: black !important;
  border-width: thick;
  border: double;
  width: 28px;
  height: 28px;
}

.activeSyncButton {
  background: gray;
  border-radius: 50px;
  margin-left: 3px;
  margin-right: 3px;
  padding-left: 10px;
  padding-right: 10px;
}

.activeSyncButtonOn {
  background: green;
}

.activeSyncButtonIcon{
  padding: 0px;
  text-align: center;
}
</style>