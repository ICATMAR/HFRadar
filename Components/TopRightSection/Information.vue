<template>
  
  <div class="logo-info icon-str clickable" @click="isVisible = !isVisible" v-if="!isVisible" title="Cookies and privacy">
    <span>i</span>
    <div class="warning-circle" v-if="isWarningOn"></div>
  </div>
  


  <Transition>
    <div class="container" v-if="isVisible">

      <!-- Title -->
      <div class="banner-title">
        <span>Information</span>
      </div>

      <!-- Title -->
      <div class="warning-container" v-if="isWarningOn">
        <div class="banner-title-warning">
          <span>Warning!</span>
        </div>
        <!-- Text -->
        <div class="banner-text-warning">
          <span>Real-time data might be unavailable from the 4th to the {{ lastDay }}th of October 2024 due to manteinance. Sorry for the inconvenience.
          </span>
        </div>
      </div>

      
      <!-- Text -->
      <div class="banner-text">
        <span>This webiste is being developed by Gerard Llorach-Tó. Please do not hesitate to contact me 
          if you find any errors or have suggestions at 
          <a :href="mailtoGerard" v-text="gerardEmail"></a> or at
          <a :href="mailtoIcatmar" v-text="icatmarEmail"></a>.
          If you are familiar with github and issues, please use the
           <a href="https://github.com/ICATMAR/HFRadar" target="_blank">github repository</a>.
        </span>
      </div>
      
      <!-- Accept button -->
      <div class="buttons-container">
        <!-- Accept -->
        <button class="btn-accept" @click="acceptClicked">Close</button>
      </div>
    </div>
  </Transition>
</template>


<script>

export default {
  name: "Information",
  created(){
    const domainCsic = "csic.es";
    const domainIcatmar = "icatmar.cat";

    this.gerardEmail = "gerard.llorach" + "@" + domainCsic;
    this.mailtoGerard = "mailto:" + this.gerardEmail;

    this.icatmarEmail = "info" + "@" + domainIcatmar;
    this.mailtoIcatmar = "mailto:" + this.icatmarEmail;
  },
  mounted(){
    this.isWarningOn = new Date() < new Date(2024, 10 - 1, this.lastDay);
    this.isVisible = this.isWarningOn;
  },
  data() {
    return {
      isVisible: false,
      isWarningOn: false,
      lastDay: 11,
      gerardEmail: "", 
      mailtoGerard: "",
      icatmarEmail: "",
      mailtoIcatmar: "",
    }
  },
  methods: {
    // USER INTERACTION
    // Information about cookies settings is in index.html
    acceptClicked: function(e){
      this.isVisible = false;
    },
  }
}

</script>



<style scoped>

.logo-information{
  width: 28px;
  height: 28px;

  margin: 0px;
  margin-left: 3px;
  margin-right: 3px;
  
}
.container {
  position: fixed;
  left: 20px;
  right: 20px;

  max-width: 800px;
  width: 80%;

  display: flex;
  flex-direction: column;
  background: rgb(20 120 167 / 80%);
  padding: 20px;
  border-radius: 20px;

  user-select: none;
  transform: translateY(-50%);
  top: 50%;
}

.banner-title > span {
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


.banner-title-warning > span {
  font-size: large;
}

.warning-container {
  background: #c16500;
  padding: 5px;
  border-radius: 5px;
  box-shadow: 0 0 4px black;
  margin-bottom: 20px;
  margin-top: 20px;
}



a {
  color: white;
}

.warning-circle {
  width: 12px;
  height: 12px;
  box-shadow: 0 0 4px black;
  background: #ff8500;
  border-radius: 50%;
  position: absolute;
  bottom: 0px;
  right: 0px;
  animation: colorChange 1s infinite;
}
@keyframes colorChange {
  0% {
    background: #ff8500;; /* Starting color */
  }
  50% {
    background: #ffc281;; /* Middle color */
  }
  100% {
    background: #ff8500;; /* End color (same as starting) */
  }
}





/* Transitions for elements */
.v-enter-active,
.v-leave-active {
  transition: all 0.8s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: translate(50vw, -70vh) scale(0.1);
}

</style>