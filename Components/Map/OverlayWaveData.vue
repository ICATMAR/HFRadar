<template>
  
  <div id="overlay-wave-data" ref="containerWaveInfo">
  <!-- Container -->
    <div v-for="key in Object.keys(radarData)" :id="key" :ref="key" class="wavepanel" :class="[isTooFar ? 'hide' : 'show']">
      <!-- Wave data -->
      <div><span><strong>Waves: </strong>{{ radarData[key].waveHeight }} m, {{ radarData[key].wavePeriod }} s, {{ radarData[key].waveBearing }}</span></div>
      <!-- Wind data -->
      <div><span><strong>Wind direction:</strong> {{ radarData[key].windBearing }}</span></div>

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
          if (radar.waveHourlyData[tmst]){
            // Create if it does not exist
            if (this.radarData[radar.UUID] == undefined){
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
            this.radarData[radar.UUID] = {
              waveHeight: radar.waveHourlyData[tmst].MWHT.toFixed(2),
              wavePeriod: radar.waveHourlyData[tmst].MWPD.toFixed(1),
              waveBearing: this.bearing2compassRose(radar.waveHourlyData[tmst].WAVB),
              windBearing: this.bearing2compassRose(radar.windHourlyData[tmst].WNDB),
            }

          } else {
            // If it exists, do not show
            if (this.radarData[radar.UUID] != undefined){
              delete this.radarData[radar.UUID];
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
  background: var(--darkBlue);
  padding: 10px;
  border-radius: 17px;

  transition: all 1s;
}

.hide {
  opacity: 0
}
.show {
  opacity: 1
}
</style>