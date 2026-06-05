<template>
  
  <div id="overlay-msm-buoy-data" ref="containerbuoyInfo">
  <!-- Container -->
    <div v-for="buoyName in Object.keys(buoysData)" :id="buoyName" :ref="buoyName" class="buoyContainer"
      :class="[!isTooFar]">
      <!-- Buoy icon -->
      <!-- <div style="padding: 10px; border-radius:5px; background-color: red">Boya</div> -->
      <div style="position: relative; display: flex">
        <img class="icon-str icon-medium icon-img" 
        @click="buoyIconClicked(buoyName)" 
        src="/HFRadar/Assets/Images/buoy.svg">
        <!-- Indicator of ICATMAR -->
        <div class="icon-marker-icatmar"></div>
      </div>
      

      <!-- Buoy panel -->
      <Transition>
      <div class="wavepanel" v-if="buoysData[buoyName].showInfo">
        <!-- Site -->
        <div class="buoyTitle">
          <span><strong>{{ buoyName }}'s buoy</strong></span>
          <a href="https://www.icatmar.cat/" target="_blank" rel="noopener noreferrer" class="icon-str">i</a>
        </div>

        <!-- Buoy data -->
        <div v-if="buoysData[buoyName].hasData">
          <!-- Waves -->
          <div v-if="Object.keys(buoysData[buoyName].data).includes('VGHS')">
            <span>
              <strong>Waves: </strong>
              {{buoysData[buoyName].data['VGHS'].toFixed(2)}} m, 
              {{buoysData[buoyName].data['VMTA'].toFixed(1)}} s, 
              {{ bearing2compassRose(buoysData[buoyName].data['VMDR']) }}
              <span class="fa" :style="{transform: 'rotate('+ (buoysData[buoyName].data['VMDR']-45+180) +'deg)' }">&#xf124;</span>
            </span>
          </div>
          <!-- Wind -->
          <div v-if="Object.keys(buoysData[buoyName].data).includes('WSPD')">
            <span>
              <strong>Wind: </strong>
              {{buoysData[buoyName].data['WSPD'].toFixed(1)}} m/s, 
              {{ bearing2compassRose(buoysData[buoyName].data['WDIR']) }}
              <span class="fa" :style="{transform: 'rotate('+ (buoysData[buoyName].data['WDIR']-45+180) +'deg)' }">&#xf124;</span>
            </span>
          </div>
          <!-- Currents -->
          <div v-if="Object.keys(buoysData[buoyName].data).includes('CurrentSpeed')">
            <span>
              <strong>Current: </strong>
              {{buoysData[buoyName].data['CurrentSpeed(cm/s)'].toFixed(1)}} cm/s, 
              {{ bearing2compassRose(buoysData[buoyName].data['CurrentDir(º)']) }}
              <span class="fa" :style="{transform: 'rotate('+ (buoysData[buoyName].data['CurrentDir(º)']-45) +'deg)' }">&#xf124;</span>
            </span>
          </div>
          
          <!-- Extra data -->
          <Transition>
          <div v-show="buoys[buoyName].showAllData">
            <!-- Wave max -->
            <div v-if="Object.keys(buoysData[buoyName].data).includes('WMHM')">
              <span>
                <strong>Wave max: </strong>
                {{buoysData[buoyName].data['WMHM'].toFixed(1)}} m, 
                {{buoysData[buoyName].data['VTPK'].toFixed(1)}} s
                <template v-if="buoysData[buoyName].data['VPED'] != undefined">,
                  {{ bearing2compassRose(buoysData[buoyName].data['VPED']) }}
                  <span class="fa" :style="{transform: 'rotate('+ (buoysData[buoyName].data['VPED']-45+180) +'deg)' }">&#xf124;</span>
                </template>
              </span>
            </div>

            <!-- Wind -->
            <div v-if="Object.keys(buoysData[buoyName].data).includes('GSPD')">
              <span>
                <strong>Wind: </strong>
                {{buoysData[buoyName].data['GSPD'].toFixed(1)}} m/s, 
                {{ bearing2compassRose(buoysData[buoyName].data['GDIR']) }}
                <span class="fa" :style="{transform: 'rotate('+ (buoysData[buoyName].data['GDIR']-45+180) +'deg)' }">&#xf124;</span>
              </span>
            </div>

            <!-- Water temperature -->
            <div v-if="Object.keys(buoysData[buoyName].data).includes('temperature')">
              <span>
                <strong>Water temperature: </strong>
                {{buoysData[buoyName].data['temperature'].toFixed(1)}} ºC
              </span>
            </div>
            <!-- Salinity -->
            <div v-if="Object.keys(buoysData[buoyName].data).includes('Salinity')">
              <span>
                <strong>Salinity: </strong>
                {{buoysData[buoyName].data['Salinity(PSU)'].toFixed(1)}} psu
              </span>
            </div>
            <!-- Air temperature -->
            <div v-if="Object.keys(buoysData[buoyName].data).includes('DRYT')">
              <span>
                <strong>Air temperature: </strong>
                {{buoysData[buoyName].data['DRYT'].toFixed(1)}} ºC
              </span>
            </div>
            <!-- Air pressure -->
            <div v-if="Object.keys(buoysData[buoyName].data).includes('ATMS')">
              <span>
                <strong>Air pressure: </strong>
                {{buoysData[buoyName].data['ATMS'].toFixed(1)}} mb
              </span>
            </div>

            <!-- Relative humidity -->
            <div v-if="Object.keys(buoysData[buoyName].data).includes('RELH')">
              <span>
                <strong>Relative humidity: </strong>
                {{buoysData[buoyName].data['RELH'].toFixed(1)}} % 
              </span>
            </div>

          </div>
          </Transition>

          <!-- Button showAllData ON OFF-->
          <div class="button-container">
            <button v-show="!buoys[buoyName].showAllData" class="more-data-button" @click="buoys[buoyName].showAllData = true">+</button>
            <button v-show="buoys[buoyName].showAllData" class="more-data-button" @click="buoys[buoyName].showAllData = false">-</button>
          </div>
          
        </div>

        <!-- Latest timestamp TODO: only when ahead of latest? -->
        <div v-else-if="new Date(currentTmst) > new Date(buoys[buoyName].latestTmst)">
          <span><strong>Latest data: </strong>{{ buoys[buoyName].latestTmst }}</span>
        </div>
        
      </div>
      </Transition>

    </div>
  </div>

</template>


<script>



export default {
  name: 'overlay-msm-buoys',
  created(){},
  mounted() {
    // Create buoysData and add to map
    // Fetch from API
    fetch('https://api.icatmar.cat/MSM_fast_api/buoys').then(res => res.json()).then(apiData => {
      if (apiData.buoys == undefined) {
        console.error("Error loading buoys data from API");
        return;
      }

      // Fill buoysData
      for (let i = 0; i < apiData.buoys.length; i++) {
        let buoyName = apiData.buoys[i].name;
        this.buoys[buoyName] = {
          id: apiData.buoys[i].id,
          lon: apiData.buoys[i].lon,
          lat: apiData.buoys[i].lat,
          latestTmst: apiData.buoys[i].latestTimestamp,
          data: {}, // tmst1: {Hm0: value, Tm02: value...}, tmst2: {...}
        };
        this.buoysData[buoyName] = { "hasData": false, "showInfo": false };
        this.buoys[buoyName].coord3857 = ol.proj.fromLonLat([this.buoys[buoyName].lon, this.buoys[buoyName].lat]);
      }

      console.log("Added MSM buoys: " + Object.keys(this.buoys));


      // First initialization
      // Get map
      if (this.map == undefined) {
        this.map = this.$parent.map;
      }
      // Relate overlay with map
      this.$nextTick(() => {
        Object.keys(this.buoys).forEach(buoyName => {
          // Buoy info
          const buoyInfo = new ol.Overlay({
            position: this.buoys[buoyName].coord3857,
            positioning: 'center-left',
            element: this.$refs[buoyName],
            stopEvent: false,
          });
          this.map.addOverlay(buoyInfo);
        });

        // Trigger interface update
        this.selectedDateChanged(window.GUIManager.currentTmst);
      });
      
    });



    

    // EVENTS
    // HFRadarLoaded
    window.eventBus.on('HFRadarDataLoaded', tmst => {
      if (tmst)
        this.selectedDateChanged(tmst);
    });
    // Selected date changed (slider moves or drag and drop files)
    window.eventBus.on('DataStreamsBar_SelectedDateChanged', this.selectedDateChanged);
    // Initial load and user changing hash TIME in URL
    window.eventBus.on('GUIManager_URLDateChanged', this.selectedDateChanged);
    // User clicked on Active sync and turned it on
    window.eventBus.on('TopRightCanvas_ActiveSyncClickedAndOn', this.selectedDateChanged);

  },
  data () {
    return {
      once: false,
      proxyURL: 'https://api.icatmar.cat/proxy/',
      buoysData: {},
      isTooFar: false,
      // https://portus.puertos.es/
      buoys:{},
      params: ['VGHS', 'VMTA', 'VMDR',
        'VMHM', 'VTPK', 'VPED',
        'temperature',
        'WDIR', 'WSPD', 'GDIR', 'GSPD',
        'RELH', 'DRYT', 'ATMS'],
      url: 'https://api.icatmar.cat/MSM_fast_api/buoys/{{id}}/data?start_date={{startDate}}&end_date={{endDate}}&parameters={{params}}',
      requests: {},
    }
  },
  methods: {
    // USER ACTIONS
    buoyIconClicked: function(buoyName){
      this.buoysData[buoyName].showInfo = !this.buoysData[buoyName].showInfo;
    },
    // INTERNAL
    selectedDateChanged: function(tmst){
      

      // Hide all data from buoyData
      Object.keys(this.buoys).forEach(buoyName => {
        this.buoysData[buoyName].hasData = false;
      });

      // Add one day before and after of the tmst
      let currentDate = new Date(tmst);
      let sDate = new Date(currentDate.getTime() - 24 * 60 * 60  * 1000);
      let eDate = new Date(currentDate.getTime() + 24 * 60 * 60  * 1000);
      // Iterate buoys
      Object.keys(this.buoys).forEach(buoyName => {
        let buoy = this.buoys[buoyName];
        // Check if the buoy data has all timestamps (timestep of 1h)
        if (buoy.data[tmst] == undefined){
          // Load data (yesteray, today, tomorrow)
          // Generate url
          // Id
          let url = this.url.replace('{{id}}', buoy.id);
          // Params
          let paramsStr = '';
          this.params.forEach(p => paramsStr += p + ",");
          paramsStr = paramsStr.substring(0, paramsStr.length - 1);
          url = url.replace('{{params}}', paramsStr);
          // Start date
          url = url.replace('{{startDate}}', sDate.toISOString().substring(0, 19) + 'Z');
          // End date
          url = url.replace('{{endDate}}', eDate.toISOString().substring(0, 19) + 'Z');

          // Proxy
          let proxyFullURL = url;//this.proxyURL + '?url=' + encodeURIComponent(url);
          // Request data for the first time
          if (this.requests[proxyFullURL] == undefined) {
            this.requests[proxyFullURL] = {
              promise: this.getData(proxyFullURL).then(r => {
                this.requests[proxyFullURL].response = r;
                this.requests[proxyFullURL].lastResolved = Date.now();
                return r;
              }),
              response: undefined,
              lastResolved: undefined,
            };
          }
          // Resolve promise and update content
          this.requests[proxyFullURL].promise.then(r => {
            this.parseAPIResult(r, buoyName);
            // Update buoys content once loaded
            this.updateContent(buoyName, tmst);
          });
        }
        // Data already exists
        else {
          // Update buoys content
          this.updateContent(buoyName, tmst);
        }
      });
    },

    // Keep track of requests as API is slow
    async getData(url) {
      // Already resolved
      if (this.requests[url] && this.requests[url].lastResolved != undefined){
        if (this.requests[url].lastResolved > Date.now() - 60 * 60 * 1000) {
          return new Promise((resolve) => resolve(this.requests[url].response));
        }
        return fetch(url).then(res => res.json());
      }
      // Fetch
      return fetch(url).then(res => res.json());


    },

    updateContent: function(buoyName, tmst){
      if (this.buoys[buoyName].data[tmst] == undefined){
        this.buoysData[buoyName].hasData = false;
        return;
      }

      
      this.buoysData[buoyName].hasData = true;
      this.buoysData[buoyName].data = {};
      
      Object.keys(this.buoys[buoyName].data[tmst]).forEach(key => {
        this.buoysData[buoyName].data[key] = this.buoys[buoyName].data[tmst][key];
      });
      //console.log(this.buoysData[buoyName].data)
    },


    parseAPIResult(result, buoyName){
      let dataArray = result.data;
      for (let i = 0; i < dataArray.length; i++) {
        let dd = dataArray[i];
        let date = new Date(dd.timestamp);
        // Hourly dataset
        if (date.getMinutes() >= 30)
          date.setHours(date.getHours() + 1);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);

        let tmst = date.toISOString();

        // Look for parameters inside the data array
        Object.keys(dd.data).forEach(sensor => {
          let sensorData = dd.data[sensor]; // {RELH: '1232', DRYT: '1232', ...}
          Object.keys(sensorData).forEach(param => {
            // Contemplated parameter --> not really needed as we request the parameters to the API
            if (this.params.includes(param)) {
              // Add to buoy data
              if (this.buoys[buoyName].data[tmst] == undefined){
                this.buoys[buoyName].data[tmst] = {};
              }
              // If parameter already exists, add to array for averaging later, if not create array
              let value = parseFloat(sensorData[param]);
              if (this.buoys[buoyName].data[tmst][param] != undefined){
                this.buoys[buoyName].data[tmst][param].push(value);
              } else {
                this.buoys[buoyName].data[tmst][param] = [value];
              }
            }
          });
        });
      }
      // Average values
      Object.keys(this.buoys[buoyName].data).forEach(tmst => {
        Object.keys(this.buoys[buoyName].data[tmst]).forEach(param => {
          let values = this.buoys[buoyName].data[tmst][param];
          let sum = values.reduce((a, b) => a + b, 0);
          let avg = sum / values.length;
          this.buoys[buoyName].data[tmst][param] = avg;
        });
      });

    },

    // Bearing to direction
    bearing2compassRose(bearing){
      if (bearing == undefined)
        debugger;
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

    // Timestime to current time ago
    timeAgo(tmst) {
      let now = Date.now(window.GUIManager.currentTmst);
      let diff = now - new Date(tmst).getTime();

      if (diff < 60 * 1000) {
        return "Just now";
      } else if (diff < 60 * 60 * 1000) {
        let minutes = Math.floor(diff / (60 * 1000));
        return minutes + " minute" + (minutes > 1 ? "s" : "") + " ago";
      } else if (diff < 24 * 60 * 60 * 1000) {
        let hours = Math.floor(diff / (60 * 60 * 1000));
        return hours + " hour" + (hours > 1 ? "s" : "") + " ago";
      } else {
        let days = Math.floor(diff / (24 * 60 * 60 * 1000));
        return days + " day" + (days > 1 ? "s" : "") + " ago";
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
  computed: {
    currentTmst() {
      return window.GUIManager.currentTmst;
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

.buoyContainer {
  display: flex;
  align-items: center;
}

.buoyTitle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: solid 2px white;
}
.wavepanel {
  background: rgb(15 48 98 / 71%);/*var(--darkBlue);*/
  padding: 10px;
  border-radius: 17px;

  transition: all 1s;
}

.button-container {
  display: flex;
  width: 100%;
  justify-content: center;
}
.more-data-button {
  height: 10px;
  background: var(--blue);
  width: 80%;
  padding: 5px;
  margin-top: 5px;
}
.more-data-button:hover{
  background: var(--lightBlue);
}


.v-enter-active,
.v-leave-active {
  transition: all 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>