<template>
  
  <div id="overlay-wave-data" ref="containerWaveInfo">
  <!-- Container -->
    <div v-for="key in Object.keys(radarData)" :id="key" :ref="key"  :class="[isTooFar ? 'hide' : 'show']">
      <!-- Wave panel -->
      <div class="wavepanel" v-show="radarData[key].hasData">
        <!-- Site -->
        <div><span><strong>{{ radarData[key].site }}</strong></span></div>
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
      if (tmst)
        this.updateContent(tmst);
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
    // INTERNAL
    updateContent: function(tmst){
      // Get radars
      let radars = window.DataManager.getRadarsDataOn(tmst);
      // Iterate radars
      radars.forEach(radar => {
        // Check if radar is HFRadar and if it was wave data
        if (radar.constructor.name == "HFRadar" && radar.waveHourlyData){
          // Check if there is data on that date
          if (radar.waveHourlyData[tmst] || radar.windHourlyData[tmst]){
            // Create if it does not exist and create map overlay
            if (this.radarData[radar.UUID] == undefined){
              this.radarData[radar.UUID] = {"site": radar.Site, "hasData": true};

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
              })
            
            }

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
.wavepanel {
  margin-right: 20px;
  background: rgb(15 48 98 / 71%);/*var(--darkBlue);*/
  padding: 10px;
  border-radius: 17px;

  transition: all 1s;
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