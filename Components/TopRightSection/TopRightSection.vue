<template>
  <div class="top-right-section">
    <div class="container-section">

      <button>a</button>
      <button>b</button>

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
  },
  data() {
    return {
    }
  },
  methods: {
    // USER ACTIONS
    // onClick: function(e){
    // },
  },
  components: {
    // "sea-panel": SeaPanel,
    // "wind-panel": WindPanel,
    // "info-panel": InfoPanel,
  }
}
</script>



<style scoped>
.top-right-section {
  position: fixed;
  top: 6px;
  right: 6px;
  margin: 0px;
  padding: 0px;
  z-index: 10;


  width: 200px;
  height: 200px;
  background: red;
}

.container-section{
  display: flex;
  flex-direction: row-reverse;
}
</style>