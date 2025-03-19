<template>

  <div class="logo-cookie-banner icon-str clickable" @click="isVisible = !isVisible" v-if="!isVisible"
    title="Cookies and privacy">
    <span class="fa">&#xf563</span>
  </div>



  <Transition>
    <div class="container" v-if="isVisible">

      <!-- Title -->
      <div class="banner-title">
        <span>Cookies settings</span>
      </div>
      <!-- Text -->
      <div class="banner-text">
        <span>We use cookies and collect information to improve the user
          experience and track our impact. No commercial use is given to the data.
        </span>
      </div>

      <!-- Accept and deny buttons -->
      <div class="buttons-container">
        <!-- Accept -->
        <button class="btn-accept" @click="acceptClicked">Accept</button>
        <button class="btn-deny" @click="denyClicked">Deny</button>
      </div>
    </div>
  </Transition>
</template>


<script>

export default {
  name: "CookieBanner",
  mounted() {
    this.isVisible = true;
    // If cookies are set, hide banner
    if (localStorage.getItem('cookie-analytics')) {
      let paramsStr = localStorage.getItem('cookie-analytics');
      let params = JSON.parse(paramsStr);
      if (params.analytics_storage == 'granted') {
        this.isVisible = false;
      }
    }
    // Clear cache
    if (!localStorage.getItem('cache-cleared')){
      localStorage.setItem('cache-cleared', new Date().toISOString());
      this.clearCachedFiles();
    } else {
      let date = new Date(localStorage.getItem('cache-cleared'));
      let now = new Date();
      // Clear cache every 7 days?
      
    }
  },
  data() {
    return {
      isVisible: false,
    }
  },
  methods: {
    // USER INTERACTION
    // Information about cookies settings is in index.html
    acceptClicked: function (e) {
      this.isVisible = false;
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
    },
    // Deny cookies (update ga and delete cookies)
    denyClicked: function (e) {
      this.isVisible = false;
      // Google analytics and delete cookies
      let params = {
        ad_storage: 'denied',
        ads_data_redaction: 'false',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
      }
      gtag('consent', 'update', params);
      // Remove cookies if they exist
      localStorage.clear();
    },

    // Clear cached files
    clearCachedFiles: function () {
      if ('caches' in window) {
        // Clear all caches
        caches.keys().then(function (cacheNames) {
          cacheNames.forEach(function (cacheName) {
            caches.delete(cacheName);
          });
          // Reload the page after clearing the cache
          window.location.reload(true);
        });
      } else {
        console.warn('Cache API not supported in this browser.');
      }
    }

  }
}

</script>



<style scoped>
.logo-cookie-banner {
  width: 28px;
  height: 28px;

  margin: 0px;
  margin-left: 3px;
  margin-right: 3px;

}

.container {
  position: fixed;
  bottom: 100px;
  left: 20px;
  right: 20px;

  max-width: 500px;
  width: 80%;

  display: flex;
  flex-direction: column;
  background: rgb(20 120 167 / 80%);
  padding: 20px;
  border-radius: 20px;

  user-select: none;
}

.banner-title>span {
  font-size: large;
}

.banner-text {
  padding-bottom: 20px
}

.buttons-container {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
}

.btn-deny {
  background-color: rgb(136, 136, 136);
  border: 2px solid gray;
  cursor: auto;
}

.btn-deny:hover {
  background-color: rgb(136, 136, 136);
  border: 2px solid gray;
  cursor: auto;
}



/* Transitions for elements */
.v-enter-active,
.v-leave-active {
  transition: all 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: translate(40vw, -70vh) scale(0.5);
}
</style>