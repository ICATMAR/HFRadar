<template>

  <div id="overlay-argo-erddap-data" ref="containerErddapInfo">
    <!-- Container -->
    <div v-for="(platformCode, index) in Object.keys(platformsData)" :id="platformCode" :ref="platformCode"
      class="ERDDAPContainer"
      :class="[!isTooFar && isAdvancedInterfaceOnOff && isExternalObsVisible ? 'showOverlayMap' : 'hideOverlayMap']">



      <!-- Platform panel -->
      <Transition>
        <div class="platformPanel" v-if="platformsData[platformCode].showInfo && platformsData[platformCode].hasData">
          <!-- Site -->
          <div class="platformTitle">
            <div v-show="platformsData[platformCode].isLoading" class="lds-ring">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            <span><strong>{{ platforms[platformCode]["type"] }}</strong></span>
            <a href="https://erddap.aoml.noaa.gov/gdp/erddap/index.html" target="_blank" rel="noopener noreferrer"
              class="icon-str">i</a>
          </div>

          <!-- Platform data -->
          <div v-if="platformsData[platformCode].hasData">

            <!-- Wind -->
            <div v-if="Object.keys(platformsData[platformCode].data).includes('windspd')">
              <span>
                <strong>Wind: </strong>
                {{ platformsData[platformCode].data['windspd'].toFixed(1) }} m/s,
                {{ bearing2compassRose(platformsData[platformCode].data['winddir']) }}
                <span class="fa"
                  :style="{ transform: 'rotate(' + (platformsData[platformCode].data['winddir'] - 45 + 180) + 'deg)' }">&#xf124;</span>
              </span>
            </div>
            <!-- Currents -->
            <div v-if="Object.keys(platformsData[platformCode].data).includes('currentspd')">
              <span>
                <strong>Current: </strong>
                {{ platformsData[platformCode].data['currentspd'].toFixed(1) }} m/s,
                {{ bearing2compassRose(platformsData[platformCode].data['currentdir']) }}
                <span class="fa"
                  :style="{ transform: 'rotate(' + (platformsData[platformCode].data['currentdir'] - 45) + 'deg)' }">&#xf124;</span>
              </span>
            </div>
            <!-- Current UO -->
            <div v-if="Object.keys(platformsData[platformCode].data).includes('uo')">
              <span>
                <strong>UO: </strong>
                {{ platformsData[platformCode].data['uo'].toFixed(1) }} m/s
              </span>
            </div>
            <!-- Waves -->
            <div v-if="Object.keys(platformsData[platformCode].data).includes('wvht')">
              <span>
                <strong>Waves: </strong>
                {{ platformsData[platformCode].data['wvht'].toFixed(1) }} m
                <!-- {{ platformsData[platformCode].data['Tm02(s)'].toFixed(1) }} s, -->
                <!-- {{ bearing2compassRose(platformsData[platformCode].data['MeanDir(º)']) }} -->
                <!-- <span class="fa"
                  :style="{ transform: 'rotate(' + (platformsData[platformCode].data['MeanDir(º)'] - 45 + 180) + 'deg)' }">&#xf124;</span> -->
              </span>
            </div>

            <!-- Extra data -->
            <Transition>
              <div v-if="platforms[platformCode].showAllData">
                <!-- Sea water temperature -->
                <div v-if="Object.keys(platformsData[platformCode].data).includes('sst')">
                  <span>
                    <strong>Water temperature: </strong>
                    {{ platformsData[platformCode].data['sst'].toFixed(1) }} ºC
                  </span>
                </div>
                <!-- Sea water salinity -->
                <div v-if="Object.keys(platformsData[platformCode].data).includes('sss')">
                  <span>
                    <strong>Sea water salinity: </strong>
                    {{ platformsData[platformCode].data['sss'].toFixed(1) }} psu
                  </span>
                </div>
                <!-- Water level -->
                <div v-if="Object.keys(platformsData[platformCode].data).includes('waterlevel')">
                  <span>
                    <strong>Water level: </strong>
                    {{ platformsData[platformCode].data['waterlevel'].toFixed(1) }} m
                  </span>
                </div>


                <!-- Sea water potential temperature -->
                <div v-if="Object.keys(platformsData[platformCode].data).includes('ztmp')">
                  <span>
                    <strong>Water potential temperature: </strong>
                    {{ platformsData[platformCode].data['ztmp'].toFixed(1) }} ºC
                  </span>
                </div>
                <!-- Sea water potential salinity -->
                <div v-if="Object.keys(platformsData[platformCode].data).includes('zsal')">
                  <span>
                    <strong>Water potential salinity: </strong>
                    {{ platformsData[platformCode].data['zsal'].toFixed(1) }} psu
                  </span>
                </div>


                <!-- Air temperature -->
                <div v-if="Object.keys(platformsData[platformCode].data).includes('atmp')">
                  <span>
                    <strong>Air temperature: </strong>
                    {{ platformsData[platformCode].data['atmp'].toFixed(1) }} ºC
                  </span>
                </div>
                <!-- Relative humidity -->
                <div v-if="Object.keys(platformsData[platformCode].data).includes('hur')">
                  <span>
                    <strong>Humidity: </strong>
                    {{ platformsData[platformCode].data['hur'].toFixed(1) }} %
                  </span>
                </div>
                <!-- Atmospheric pressure -->
                <div v-if="Object.keys(platformsData[platformCode].data).includes('slp')">
                  <span>
                    <strong>Atms. pressure: </strong>
                    {{ platformsData[platformCode].data['slp'].toFixed(1) }} hPa
                  </span>
                </div>

                <!-- Code -->
                <div>
                  <span>
                    <strong>Code: </strong>
                    {{ platformCode }}
                  </span>
                </div>
              </div>
            </Transition>

            <!-- Button showAllData ON OFF-->
            <div class="button-container">
              <button v-show="!platforms[platformCode].showAllData" class="more-data-button"
                @click="platforms[platformCode].showAllData = true">+</button>
              <button v-show="platforms[platformCode].showAllData" class="more-data-button"
                @click="platforms[platformCode].showAllData = false">-</button>
            </div>

          </div>

        </div>
      </Transition>


      <!-- Platform icon -->
      <img class="icon-str icon-medium icon-img panel-icon-right" @click="ERDDAPIconClicked(platformCode)" :src="[platforms[platformCode]['type'].includes('SHIP') ? '/HFRadar/Assets/Images/boat.svg' :
        platforms[platformCode]['type'].includes('DRIFTING') ? '/HFRadar/Assets/Images/drifter.svg' :
          platforms[platformCode]['type'].includes('GLIDERS') ? '/HFRadar/Assets/Images/drifter.svg' :
            '/HFRadar/Assets/Images/buoy.svg']" v-show="platformsData[platformCode].hasData">


    </div>
  </div>

</template>


<script>

// ERDDAP ARGO IFREMER
// https://erddap.ifremer.fr/erddap/index.html

// Data website: https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats.html

// This component requires a proxy server to avoid CORS policies from the ERDDAP server. 
// https://github.com/ICATMAR/ProxyServerAPI





export default {
  name: 'overlay-argo-erddap-data',
  created() { },
  mounted() {

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
    // Advanced interface
    window.eventBus.on("AdvancedInterfaceOnOff", state => {
      this.isAdvancedInterfaceOnOff = state;
      // Get ERDDAP sites and load data
      if (this.once == undefined && state == true) {
        this.once = true;
        this.selectedDateChanged(window.GUIManager.currentTmst);
      }
    });
    // External observations visible
    window.eventBus.on("WidgetMapOptions_ExternalObsVisibilityChanged", state => {
      this.isExternalObsVisible = state;
    });
  },
  data() {
    return {
      proxyURL: 'https://api.icatmar.cat/proxy/',//"http://localhost:3000/proxy",
      isExternalObsVisible: false,
      isAdvancedInterfaceOnOff: false,
      isTooFar: false,
      queryPlatformsURL: "https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats.jsonlKVP" +
        "?{parameters}" +
        "&time>={startDate}&time<={endDate}&longitude>={longMin}&longitude<={longMax}&latitude>={latMin}&latitude<={latMax}",
      bbox: [0, 5, 39.5, 44], // long, lat
      parameters: [
        'fileNumber',
        'data_type',
        'date_creation',
        'platform_number',
        'project_name',
        'pi_name',
        'cycle_number',
        'data_center',
        'dc_reference', // data center convention ?
        'data_mode', // R-> real-time, A -> real-time with adjustments, D -> delayed mode
        'platform_type', // ARVOR, PROVOR, NAVIS, etc.
        'float_serial_no', // ?
        'time',
        'latitude',
        'longitude',
        // wmo_inst_type? (836-882)
        // config_mission_number ? (5-227)
        // time_qc, position_qc
        // profile_pres_qc, profile_temp_qc, profile_psal_qc
        // pres_qc, pres_adjusted, pres_adjusted_qc, pres_adjusted_error,
        // temp_qc, temp_adjusted, temp_adjusted_qc, temp_adjusted_error,
        // ...
      ],
      platforms: {},
      platformsData: {},
      requestStatus: {}, // Stores requested timestamps
      requestedDailyData: {} // Stores promises and results of promises by daily tmst
    }
  },
  methods: {
    // USER ACTIONS
    ERDDAPIconClicked: function (platformCode) {
      this.platformsData[platformCode].showInfo = !this.platformsData[platformCode].showInfo;
    },
    // INTERNAL
    selectedDateChanged: function (tmst) {
      if (tmst == undefined || this.once == undefined)
        return;

      // Get day
      let dayTmst = tmst.substring(0, 10);
      // Check if the data for the day was already loaded
      this.getDataForDayTmst(dayTmst).then(() => {
        this.updateContent(tmst)
      });

    },

    updateContent: function (tmst) {

      let platforms = this.platforms;

      // Hide all data from platforms
      Object.keys(platforms).forEach(platformCode => {
        let platform = platforms[platformCode];
        this.platformsData[platformCode].hasData = false;
        // Iterate tmst
        let halfHourinMs = 1000 * 60 * 29;
        let closestTimeDiff = 10e12;
        // Pick up closest data
        Object.keys(platform.data).forEach(dataTmst => {
          let timeDiff = Math.abs(new Date(dataTmst).getTime() - new Date(tmst).getTime());
          if (timeDiff < halfHourinMs && timeDiff < closestTimeDiff) {
            closestTimeDiff = timeDiff;
            this.platformsData[platformCode].hasData = true;
            // Empty observed properties
            this.platformsData[platformCode].data = {};

            // Iterate props and assign to platformsData (vue uses this object)
            Object.keys(platform.data[dataTmst]).forEach(key => {
              this.platformsData[platformCode].data[key] = platform.data[dataTmst][key];
            });

            // Change layer location
            this.$nextTick(() => {
              platform.coord3857 = ol.proj.fromLonLat([platform.data[dataTmst].longitude, platform.data[dataTmst].latitude]);

              if (platform.olLayer != undefined) {
                platform.olLayer.setElement(this.$refs[platformCode]);
                platform.olLayer.setPosition(platform.coord3857); // For some reason vue and the map element have to be redefined
              } else {
                debugger;
              }

              if (platformCode != platform.olLayer.C.element.id) {
                debugger;
              }
            });

          }

        });
      });
    },




    // Get the data for a specific day
    getDataForDayTmst(dayTmst) {
      // Return the data (or the promise to load the data)
      if (this.requestedDailyData[dayTmst] != undefined) {
        return new Promise((resolve, reject) => {
          resolve(this.requestedDailyData[dayTmst]);
        });
      }
      // Load the data
      else {
        // Set all platforms to loading
        Object.keys(this.platforms).forEach(platformCode => {
          this.platformsData[platformCode].isLoading = true;
        });

        // Prepare start / end of day
        let startDate = new Date(dayTmst + 'T00:00Z');
        let endDate = new Date(dayTmst + 'T00:00Z');
        endDate.setUTCDate(endDate.getUTCDate() + 1);

        // Prepare url
        let url = this.queryPlatformsURL.replace('{parameters}', this.parameters.join());
        url = url.replace('{startDate}', startDate.toISOString());
        url = url.replace('{endDate}', endDate.toISOString());
        url = url.replace('{longMin}', this.bbox[0]).replace('{longMax}', this.bbox[1]).replace('{latMin}', this.bbox[2]).replace('{latMax}', this.bbox[3]);

        console.log(url.replace('jsonlKVP', 'htmlTable'));
        const encodedUrl = encodeURIComponent(url);
        let proxyFullURL = this.proxyURL + '?url=' + encodedUrl;
        let promise = this.getDataFromURL(proxyFullURL)
          .then(res => {
            // Store response
            this.requestedDailyData[dayTmst] = res;
            // All platforms loaded
            Object.keys(this.platforms).forEach(platformCode => {
              this.platformsData[platformCode].isLoading = false;
            });
            // Create data structure
            this.parseRawTextAndStructureData(res);
            // Map and vue data structure if required
            this.addPlatformsToMap();
          });
        this.requestedDailyData[dayTmst] = promise;
        return promise
      }

    },


    // Get data from URL
    getDataFromURL(url) {
      return fetch(url).then(r => r.text())
    },
    // Parse raw text
    parseRawTextAndStructureData(res) {
      let rows = res.split('\n');
      rows.pop(); // Delete empty

      let platforms = this.platforms;

      // Get number of different platforms
      rows.forEach(row => {
        let jsRow = JSON.parse(row);
        // Remove nulls
        Object.keys(jsRow).forEach((key) => {
          if (jsRow[key] === null) {
            delete jsRow[key];
          }
        });
        // Define platform
        debugger;
        if (platforms[jsRow.platform_code] == undefined) {
          platforms[jsRow.platform_code] = {
            "type": jsRow.platform_type,
            "location": [jsRow.longitude, jsRow.latitude],
            "id": jsRow.platform_id,
            "code": jsRow.platform_code,
            "data": {},
          }
        }
        // Fill the platform with data on given timestamps
        let platform = platforms[jsRow.platform_code];
        // Unexpectedly, it can happen that two platforms share the same id and code. This was found for ships.
        if (platform.data[jsRow.time] != undefined) {
          // Keep the one with more data
          if (Object.keys(jsRow).length - 3 > Object.keys(platform.data[jsRow.time]).length) {
            // TODO: WHAT ABOUT DUPLICATED DATA? ERDDAP PROBLEM'S
            //console.log('Duplicated data for platform type: ' + platform.type + ', id: ' + platform.code + '. Overwritting data.');
            platform.data[jsRow.time] = {};
            // Add parameters to data
            for (let i = 3; i < this.parameters.length; i++) {
              if (jsRow[this.parameters[i]] != undefined) {
                platform.data[jsRow.time][this.parameters[i]] = jsRow[this.parameters[i]];
              }
            }
          } else {
            //console.log('Duplicated data for platform type: ' + platform.type + ', id: ' + platform.code + '. Discarded new data.');
            //console.log(platform.data[jsRow.time]);
            //console.log(jsRow);
          }
        }

        else {
          platform.data[jsRow.time] = {};
          // Add parameters to data
          for (let i = 3; i < this.parameters.length; i++) {
            if (jsRow[this.parameters[i]] != undefined) {
              platform.data[jsRow.time][this.parameters[i]] = jsRow[this.parameters[i]];
            }
          }

        }

        // Check if it is a drifter (lat long changes)
        // When platform is moving, it is a drifter. // TODO: mooring buoys also move (borneo), is it reflected here? does it matter?
        if (jsRow.longitude != platform.longitude || jsRow.latitude != platform.latitude) {
          platform.isDrifting = true;
        }

      });
      //console.log(platforms);
    },
    // Update vue and map
    addPlatformsToMap() {
      // Iterate platforms to create vue objects and map layers
      Object.keys(this.platforms).forEach(platformCode => {
        this.addPlatformToMap(platformCode, 0);
      });
    },
    // Add platform to map
    addPlatformToMap(platformCode, count) {
      let platform = this.platforms[platformCode];

      // Platform was already added to map
      if (platform.olLayer != undefined)
        return;

      // Create vue object
      if (this.platformsData[platformCode] == undefined) {
        this.platformsData[platformCode] = { "hasData": false, "showInfo": false, "isLoading": false };
        this.platforms[platformCode].coord3857 = ol.proj.fromLonLat([this.platforms[platformCode].location[0], this.platforms[platformCode].location[1]]);
      }

      this.$nextTick(() => {
        if (this.$refs[platformCode] == undefined) {
          if (count > 2) {
            debugger;
            console.error("Could not find html element with vue ref")
            return
          }
          this.addPlatformToMap(count++);
          return;
        }
        // Get map
        if (this.map == undefined) {
          this.map = this.$parent.map;
        }
        // Relate overlay with map
        // Platform info
        const platformInfo = new ol.Overlay({
          name: platformCode,
          position: this.platforms[platformCode].coord3857,
          positioning: 'center-right',//Object.keys(this.platforms).length % 2 == 1 ? 'center-right' : 'center-left',
          element: this.$refs[platformCode],
          stopEvent: false,
        });
        platformInfo.getElement().classList.add('no-pointer-events');
        platformInfo.getElement().parentElement.classList.add('no-pointer-events');
        platformInfo.element.classList.add('no-pointer-events'); // Remove pointer events, container takes more space than necessary and blocks visible icons
        this.map.addOverlay(platformInfo);
        console.log("Added NOAA ERDDAP platform");
        platform.olLayer = platformInfo;
      });
    },



    // Bearing to direction
    bearing2compassRose(bearing) {
      if (bearing == undefined)
        return '';
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
    updatePanel(zoomLevel) {
      if (zoomLevel < 9) {
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

.ERDDAPContainer {
  display: flex;
  align-items: center;
  user-select: none;
}

.panel-icon-left {
  margin-left: -15px;
}

.panel-icon-right {
  margin-right: -15px;
}

.platformTitle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: solid 2px white;
}

.platformPanel {
  background: rgb(15 48 98 / 71%);
  /*var(--darkBlue);*/
  padding: 10px;
  border-radius: 17px;
  pointer-events: all;

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

.more-data-button:hover {
  background: var(--lightBlue);
}


/* https://loading.io/css/ */
.lds-ring {
  display: inline-block;
  position: relative;
  width: 20px;
  height: 20px;
}

.lds-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 16px;
  height: 16px;
  margin: 2px;
  border: 2px solid #fff;
  border-radius: 50%;
  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: #fff transparent transparent transparent;
}

.lds-ring div:nth-child(1) {
  animation-delay: -0.45s;
}

.lds-ring div:nth-child(2) {
  animation-delay: -0.3s;
}

.lds-ring div:nth-child(3) {
  animation-delay: -0.15s;
}

@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
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