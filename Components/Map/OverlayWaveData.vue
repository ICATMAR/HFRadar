<template>
  
  <div id="overlay-wave-data" ref="containerWaveInfo">
  <!-- Container -->
    <div v-for="key in Object.keys(radarData)" :id="key" :ref="key" class="radarPanelContainer">

      <!-- Wave panel -->
      <div class="wavepanel" :class="[!isTooFar && radarData[key].showInfo ? 'show' : 'hide']">
        <!-- Site -->
        <div class="radarTitle">
          <span><strong>{{ radarData[key].site }}</strong></span>
          <a href="https://www.icatmar.cat" target="_blank" rel="noopener noreferrer" class="icon-str">i</a>
        </div>
        <!-- Data -->
        <div v-if="radarData[key].hasData">
          <!-- Wave data -->
          <div v-show="radarData[key].waveHeight != undefined">
            <span><strong>Waves: </strong>{{ radarData[key].waveHeight }} m, {{ radarData[key].wavePeriod }} s, {{ radarData[key].waveBearing }}</span>
            <span class="fa" :style="{transform: 'rotate('+ (radarData[key].waveBearingValue-45+180) +'deg)' }">&#xf124;</span>
          </div>
          <!-- Wind data -->
          <div v-show="radarData[key].windBearing != undefined">
            <span><strong>Wind direction:</strong> {{ radarData[key].windBearing }}</span>
            <span class="fa" :style="{transform: 'rotate('+ (radarData[key].windBearingValue-45+180) +'deg)' }">&#xf124;</span>
          </div>
        </div>

        <!-- No wind-wave data, but file exists-->
        <div v-else-if="radarData[key].fileStatus == 2"><span>No wave or wind data</span></div>
        
        
        <!-- Loading -->
        <div v-if="radarData[key].fileStatus == 3"><span>Loading...</span></div>
        <!-- No file -->
        <div v-else-if="radarData[key].fileStatus == 0"><span>No file</span></div>

      </div>
      

      
      <!-- Radar icon -->
      <!-- window.eventBus.emit('Map_ClickedHFRadar', closestRadar); -->
      <img 
        class="icon-str icon-big icon-img radarIcon" 
        :class="[radarData[key].fileStatus == 0 ? 'iconNoFile' : radarData[key].fileStatus == 3 ? 'iconLoading' : '']" 
        @click="radarIconClicked(key)"
        src="/HFRadar/Assets/Images/radar.svg">

    </div>
  </div>

</template>


<script>



export default {
  name: 'overlay-wave-data',
  created(){},
  mounted() {
    // EVENTS
    // HFRadarLoaded
    window.eventBus.on('HFRadarDataLoaded', tmst => {
      // Create radar data object
      if (Object.keys(this.radarData).length == 0){
        this.createRadarDataObject();
      }
      
      if (tmst)
        this.updateContent(tmst);
      else
        this.updateContent(window.GUIManager.currentTmst);
    });
    // Selected date changed (slider moves or drag and drop files)
    window.eventBus.on('DataStreamsBar_SelectedDateChanged', (tmst) =>{
      this.updateContent(tmst);
    });
  },
  data () {
    return {
      radarData: {},
      isTooFar: false,

    }
  },
  methods: {
    // USER INTERACTION
    radarIconClicked: function(uuid){
      // Hide / show overlay panel
      this.radarData[uuid].showInfo = !this.radarData[uuid].showInfo;
      // Special for advanced interface
      if (!window.GUIManager.isAdvancedInterface){
        // Show radials?
        
        // Show timeline of values?
      }
    },


    // INTERNAL
    createRadarDataObject: function(){
      // Create radar objects and add to map
      let radars = window.DataManager.HFRadars;
      Object.keys(radars).forEach(key => {
        let radar = radars[key];
        if (radar.constructor.name == "HFRadar"){
          // Determine file status
          let tmst = window.GUIManager.currentTmst;
          let fileStatus = window.DataManager.hourlyDataAvailability[tmst.substring(0,13) + 'Z'][radar.Site];
          
          this.radarData[radar.UUID] = {
            "site": radar.Site, 
            "showInfo": true,
            "hasData": false,
            "fileStatus": fileStatus,
          };

          if (this.map == undefined){
            this.map = this.$parent.map;
          }

          // Get radar location
          let location = radar.getRadarOrigin();
          let coord3857 = ol.proj.fromLonLat([location[0], location[1]]);
          // Next tick generates the html in v-for thus we can link the element to the map overlay
          this.$nextTick(() => {
            // Wave info
            const waveInfo = new ol.Overlay({
              position: coord3857,
              positioning: 'center-right',
              element: this.$refs[radar.UUID],
              stopEvent: false,
            });
            this.map.addOverlay(waveInfo);
            waveInfo.element.parentElement.style.zIndex = '1';
          })

        }
      })
      

      
    },

    // Fill the object radarData that shows the data in the interface
    updateContent: function(tmst){

      Object.keys(this.radarData).forEach(uuid => {
        this.radarData[uuid].hasData = false;
      });

      // Get radars
      let radars = window.DataManager.HFRadars;
      // Iterate radars
      Object.keys(radars).forEach(uuid => {
        let radar = radars[uuid];
        // Check if radar is HFRadar and if it was wave data
        if (radar.constructor.name == "HFRadar"){
          if (radar.waveHourlyData){
            // Check if there is data on that date
            if (radar.waveHourlyData[tmst] || radar.windHourlyData[tmst]){

              // Radar has data
              this.radarData[radar.UUID].hasData = true;

              // Update wave data
              if (radar.waveHourlyData[tmst]){
                  this.radarData[radar.UUID].waveHeight = radar.waveHourlyData[tmst].MWHT.toFixed(2);
                  this.radarData[radar.UUID].wavePeriod = radar.waveHourlyData[tmst].MWPD.toFixed(1);
                  this.radarData[radar.UUID].waveBearing = this.bearing2compassRose(radar.waveHourlyData[tmst].WAVB);
                  this.radarData[radar.UUID].waveBearingValue = radar.waveHourlyData[tmst].WAVB;
              } else
                this.radarData[radar.UUID].waveHeight = undefined;
              // Update wind data
              if (radar.windHourlyData[tmst]){
                this.radarData[radar.UUID].windBearingValue = radar.windHourlyData[tmst].WNDB;
                this.radarData[radar.UUID].windBearing = this.bearing2compassRose(radar.windHourlyData[tmst].WNDB);
              } else
              this.radarData[radar.UUID].windBearing = undefined;
            } else {
              // If it exists, do not show data
              if (this.radarData[radar.UUID] != undefined){
                this.radarData[radar.UUID].waveHeight = undefined;
                this.radarData[radar.UUID].windBearing = undefined;
                this.radarData[radar.UUID].hasData = false;
              }
            }
          }

          // File exists and it is loaded
          if (radar.data[tmst] != undefined){
            this.radarData[radar.UUID].fileStatus = 2;
          } 
          // File is loading
          else if (window.DataManager.hourlyDataAvailability[tmst.substring(0,13) + 'Z']) {
            if (window.DataManager.hourlyDataAvailability[tmst.substring(0,13) + 'Z'][radar.Site] == 3) {
              this.radarData[radar.UUID].fileStatus = 3;
              console.log("FILE STATUS LOADING")
            }
          }
          // File does not exist
          else {
            this.radarData[radar.UUID].fileStatus = 0;
          }
          
        }
      });
    },

    // Bearing to direction
    bearing2compassRose(bearing){
      // Define directional ranges in degrees
      const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
      const ranges = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5, 360];
      // Find the index of the range that includes the given bearing
      for (let i = 0; i < ranges.length; i++) {
          if (bearing < ranges[i]) {
              return directions[i];
          }
      }
    },
    
    
    // Hide / Panel depending on zoom level
    updatePanel(zoomLevel){
      if (zoomLevel < 9){
        this.isTooFar = true;
      } else
        this.isTooFar = false;
    }
  },
  components: {

  }
}

</script>



<style scoped>
a {
  text-decoration: none;
}

.radarPanelContainer {
  display: flex;
  align-items: center;
}

.radarTitle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: solid 2px white;
}

.radarIcon {
  width: 35px;
  height: 35px;
  margin-right: -17.5px; /* half of its width */
}
.wavepanel {
  margin-right: 20px;
  background: rgb(15 48 98 / 71%);/*var(--darkBlue);*/
  padding: 10px;
  border-radius: 17px;

  transition: all 1s;
}

.iconNoFile {
  background: var(--red);
}
.iconLoading {
  background: rgb(255, 255, 104);
  animation: loadingColorAnimation 1s infinite;
}

@keyframes loadingColorAnimation {
  0% {background: rgb(255, 255, 104); }
  50% {background: rgb(138, 138, 0); }
  100% {background: rgb(255, 255, 104);}
}

.hide {
  opacity: 0;
  transition: all 1s;
}
.show {
  opacity: 1;
  transition: all 1s;
}
</style>