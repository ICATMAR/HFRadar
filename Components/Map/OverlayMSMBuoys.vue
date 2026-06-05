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
          <div v-if="buoys[buoyName].params.includes('Hm0')">
            <span>
              <strong>Waves: </strong>
              {{buoysData[buoyName].data['Hm0(m)'].toFixed(2)}} m, 
              {{buoysData[buoyName].data['Tm02(s)'].toFixed(1)}} s, 
              {{ bearing2compassRose(buoysData[buoyName].data['MeanDir(º)']) }}
              <span class="fa" :style="{transform: 'rotate('+ (buoysData[buoyName].data['MeanDir(º)']-45+180) +'deg)' }">&#xf124;</span>
            </span>
          </div>
          <!-- Wind -->
          <div v-if="buoys[buoyName].params.includes('WindSpeed')">
            <span>
              <strong>Wind: </strong>
              {{buoysData[buoyName].data['WindSpeed(m/s)'].toFixed(1)}} m/s, 
              {{ bearing2compassRose(buoysData[buoyName].data['WindDir(º)']) }}
              <span class="fa" :style="{transform: 'rotate('+ (buoysData[buoyName].data['WindDir(º)']-45+180) +'deg)' }">&#xf124;</span>
            </span>
          </div>
          <!-- Currents -->
          <div v-if="buoys[buoyName].params.includes('CurrentSpeed')">
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
            <div v-if="buoys[buoyName].params.includes('Hmax')">
              <span>
                <strong>Wave max: </strong>
                {{buoysData[buoyName].data['Hmax(m)'].toFixed(1)}} m, 
                {{buoysData[buoyName].data['Tp(s)'].toFixed(1)}} s
                <template v-if="buoysData[buoyName].data['MeanDirPeak(º)'] != undefined">,
                  {{ bearing2compassRose(buoysData[buoyName].data['MeanDirPeak(º)']) }}
                  <span class="fa" :style="{transform: 'rotate('+ (buoysData[buoyName].data['MeanDirPeak(º)']-45+180) +'deg)' }">&#xf124;</span>
                </template>
              </span>
            </div>

            <!-- Water temperature -->
            <div v-if="buoys[buoyName].params.includes('WaterTemp')">
              <span>
                <strong>Water temperature: </strong>
                {{buoysData[buoyName].data['WaterTemp(ºC)'].toFixed(1)}} ºC
              </span>
            </div>
            <!-- Salinity -->
            <div v-if="buoys[buoyName].params.includes('Salinity')">
              <span>
                <strong>Salinity: </strong>
                {{buoysData[buoyName].data['Salinity(PSU)'].toFixed(1)}} psu
              </span>
            </div>
            <!-- Air temperature -->
            <div v-if="buoys[buoyName].params.includes('AirTemp')">
              <span>
                <strong>Air temperature: </strong>
                {{buoysData[buoyName].data['AirTemp(ºC)'].toFixed(1)}} ºC
              </span>
            </div>
            <!-- Air pressure -->
            <div v-if="buoys[buoyName].params.includes('AirTemp')">
              <span>
                <strong>Air pressure: </strong>
                {{buoysData[buoyName].data['AirPressure(mb)'].toFixed(1)}} mb
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
      // buoys: {
      //   "Begur": {
      //     id: '2798',
      //     params: ['Hm0', 'Hmax', 'Tm02', 'Tp','MeanDir','MeanDirPeak', 
      //               'WindSpeed', 'WindDir',
      //               'CurrentSpeed', 'CurrentDir',
      //               'WaterTemp',
      //               'AirTemp',
      //               'Salinity',
      //               'AirPressure'],
      //     location: [3.65, 41.90],
      //     coord3857: undefined,
      //     data: {}, // tmst1: {Hm0: value, Tm02: value...}, tmst2: {...} 
      //   },
      //   "Barcelona": {
      //     id: '1731',
      //     params: ['Hm0', 'Hmax', 'Tm02', 'Tp','MeanDir', 
      //               'WaterTemp'],
      //     location: [2.2072, 41.323],
      //     coord3857: undefined,
      //     data: {}, // tmst1: {Hm0: value, Tm02: value...}, tmst2: {...} 
      //   },
      //   "Tarragona": {
      //     id: '1712',
      //     params: ['Hm0', 'Hmax', 'Tm02', 'Tp','MeanDir','MeanDirPeak',
      //             'WaterTemp'],
      //     location: [1.1900, 41.070],
      //     coord3857: undefined,
      //     data: {}
      //   },
      //   "Tarragona offshore": {
      //     id: '2720',
      //     params: ['Hm0', 'Hmax', 'Tm02', 'Tp','MeanDir','MeanDirPeak', 
      //               'WindSpeed', 'WindDir',
      //               'CurrentSpeed', 'CurrentDir',
      //               'WaterTemp',
      //               'AirTemp',
      //               'Salinity',
      //               'AirPressure'],
      //     location: [1.4673, 40.6851],
      //     coord3857: undefined,
      //     data: {},
      //   },
      //   "Valencia": {
      //     id: '2630',
      //     params: ['Hm0', 'Hmax', 'Tm02', 'Tp','MeanDir','MeanDirPeak', 
      //               'WindSpeed', 'WindDir',
      //               'CurrentSpeed', 'CurrentDir',
      //               'WaterTemp',
      //               'AirTemp',
      //               'Salinity',
      //               'AirPressure'],
      //     location: [0.2020, 39.5205],
      //     coord3857: undefined,
      //     data: {},
      //   },
      //   "Dragonera": {
      //     id: '2820',
      //     params: ['Hm0', 'Hmax', 'Tm02', 'Tp','MeanDir','MeanDirPeak', 
      //               'WindSpeed', 'WindDir',
      //               'CurrentSpeed', 'CurrentDir',
      //               'WaterTemp',
      //               'AirTemp',
      //               'Salinity',
      //               'AirPressure'],
      //     location: [	2.0953, 39.5630],
      //     coord3857: undefined,
      //     data: {},
      //   }
      // },
      // https://movil.puertos.es/cma2/app/CMA/adhoc/station_data?station=2798&params=Hm0,Tm02,Tp,MeanDir,MeanDirPeak&from=20231107@0000&to=20231128@0000
      //url: 'https://movil.puertos.es/cma2/app/CMA/adhoc/station_data?station={{id}}&params={{params}}&from={{sYear}}{{sMonth}}{{sDay}}@{{sHour}}{{sMinute}}&to={{eYear}}{{eMonth}}{{eDay}}@{{eHour}}{{eMinute}}', 
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
              promise: getData(proxyFullURL).then(r => {
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
      }
      

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
      debugger;
      let buoy = this.buoys[buoyName];
      let header = result.content[0];
      let content = result.content[1];
      content.forEach(c => {
        let date = new Date(c[0] * 1000);
        let tmst = date.toISOString();
        if (buoy.data[tmst] != undefined){
          //console.warn("Overwritting buoy data for " + buoyName + " buoy at " + tmst);
        } else {
          buoy.data[tmst] = {}
          for (let i = 1; i < header.length; i++){
            buoy.data[tmst][header[i]] = parseFloat(c[i][0]);
          }
        }
      })

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