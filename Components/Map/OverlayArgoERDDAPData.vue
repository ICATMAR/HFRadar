<template>

  <div id="overlay-argo-erddap-data" ref="containerErddapInfo">
    <!-- Container -->
    <div v-for="(platformNumber, index) in Object.keys(platformsData)" :id="platformNumber" :ref="platformNumber"
      class="ERDDAPContainer"
      :class="[!isTooFar && isAdvancedInterfaceOnOff && isExternalObsVisible ? 'showOverlayMap' : 'hideOverlayMap']">



      <!-- Platform panel -->
      <Transition>
        <div class="platformPanel"
          v-if="platformsData[platformNumber].showInfo && platformsData[platformNumber].hasData">
          <!-- Site -->
          <div class="platformTitle">
            <div v-show="platformsData[platformNumber].isLoading" class="lds-ring">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            <span><strong>Argo profiling float</strong></span>
            <a href="https://erddap.ifremer.fr/erddap/index.html" target="_blank" rel="noopener noreferrer"
              class="icon-str">i</a>
          </div>

          <!-- Platform data -->
          <div v-if="platformsData[platformNumber].hasData">


            <!-- 3D widget -->
            <Transition>
              <div class="sketchfab-embed-wrapper"
                v-show="platforms[platformNumber].hide3Dwidget == undefined || !platforms[platformNumber].hide3Dwidget">
                <iframe title="Oceanographic Argo Profiling Float" frameborder="0" allowfullscreen
                  mozallowfullscreen="true" webkitallowfullscreen="true"
                  allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking execution-while-out-of-viewport
                  execution-while-not-rendered web-share
                  src="https://sketchfab.com/models/439474c830744c95b48dc90cfff6fdbe/embed"> </iframe>
                <!-- <p style="font-size: 13px; font-weight: normal; margin: 5px; color: #4A4A4A;"> <a
                    href="https://sketchfab.com/3d-models/oceanographic-argo-profiling-float-439474c830744c95b48dc90cfff6fdbe?utm_medium=embed&utm_campaign=share-popup&utm_content=439474c830744c95b48dc90cfff6fdbe"
                    target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Oceanographic Argo
                    Profiling Float </a>
                </p> -->
              </div>
            </Transition>

            <!-- Button show / hide 3D widget-->
            <div class="button-container">
              <button v-show="!platforms[platformNumber].hide3Dwidget" class="more-data-button hide3Dwidget"
                @click="platforms[platformNumber].hide3Dwidget = true">Hide 3D</button>
              <button v-show="platforms[platformNumber].hide3Dwidget" class="more-data-button hide3Dwidget"
                @click="platforms[platformNumber].hide3Dwidget = false">Show 3D</button>
            </div>



            <!-- Surface data-->
            <template v-if="Object.keys(platformsData[platformNumber].data).includes('surfaceData')">

              <!-- Surface water temperature -->
              <div v-if="Object.keys(platformsData[platformNumber].data.surfaceData).includes('temp_adjusted')">
                <span>
                  <strong title="Surface water temperature">Water temperature: </strong>
                  {{ platformsData[platformNumber].data.surfaceData.temp_adjusted.toFixed(1) }} °C

                  <!-- Depth -->
                  <template
                    v-if="Object.keys(platformsData[platformNumber].data.surfaceData).includes('pres_adjusted')">
                    at {{ platformsData[platformNumber].data.surfaceData.pres_adjusted.toFixed(1) }} m depth
                  </template>
                </span>
              </div>

            </template>





            <!-- Show trajectory -->
            <!-- Show profile -->
            <!-- Go to date -->

            <!-- Extra data -->
            <Transition>
              <div v-if="platforms[platformNumber].showAllData">

                <!-- Surface data-->
                <template v-if="Object.keys(platformsData[platformNumber].data).includes('surfaceData')">
                  <!-- Salinity -->
                  <div v-if="Object.keys(platformsData[platformNumber].data.surfaceData).includes('psal_adjusted')">
                    <span>
                      <strong title="Surface salinity">Salinity: </strong>
                      {{ platformsData[platformNumber].data.surfaceData.psal_adjusted.toFixed(1) }} psu

                      <!-- Depth -->
                      <template
                        v-if="Object.keys(platformsData[platformNumber].data.surfaceData).includes('pres_adjusted')">
                        at {{ platformsData[platformNumber].data.surfaceData.pres_adjusted.toFixed(1) }} m depth
                      </template>
                    </span>
                  </div>
                </template>

                <!-- Platform number -->
                <div v-if="Object.keys(platformsData[platformNumber].data).includes('platform_number')">
                  <span>
                    <strong title="platform_number / fileNumber">ID: </strong>
                    {{ platformsData[platformNumber].data['platform_number'] }}
                  </span>
                </div>

                <!-- Project name -->
                <div v-if="Object.keys(platformsData[platformNumber].data).includes('project_name')">
                  <span>
                    <strong title="project_name">Project: </strong>
                    {{ platformsData[platformNumber].data['project_name'] }}
                  </span>
                </div>

                <!-- Platform type -->
                <div v-if="Object.keys(platformsData[platformNumber].data).includes('platform_type')">
                  <span>
                    <strong title="platform_type">Type: </strong>
                    {{ platformsData[platformNumber].data['platform_type'] }}
                  </span>
                </div>

                <!-- Cycle number -->
                <div v-if="Object.keys(platformsData[platformNumber].data).includes('cycle_number')">
                  <span>
                    <strong title="platform_type">Number of cycles: </strong>
                    {{ platformsData[platformNumber].data['cycle_number'] }}
                  </span>
                </div>

                <!-- Time difference from now -->
                <div v-if="Object.keys(platformsData[platformNumber].data).includes('tmstTimeDiffStr')">
                  <span>
                    <strong>Collected </strong>
                    {{ platformsData[platformNumber].data.tmstTimeDiffStr }}
                  </span>
                </div>
                <!-- Principal investigator -->
                <div v-if="Object.keys(platformsData[platformNumber].data).includes('pi_name')">
                  <span>
                    <strong>Principal investigator(s): </strong>
                    {{ platformsData[platformNumber].data['pi_name'] }}
                  </span>
                </div>
                <!-- Data mode -->
                <div v-if="Object.keys(platformsData[platformNumber].data).includes('data_mode')">
                  <span>
                    <strong>Mode: </strong>
                    {{ platformsData[platformNumber].data['data_mode'] == 'R' ? 'Real-time' :
                      platformsData[platformNumber].data['data_mode'] == 'A' ? 'Real-time with adjustments' :
                        platformsData[platformNumber].data['data_mode'] == 'D' ? 'Delayed mode' :
                          platformsData[platformNumber].data['data_mode'] }}
                  </span>
                </div>
                <!-- Data center -->
                <div v-if="Object.keys(platformsData[platformNumber].data).includes('data_center')">
                  <span>
                    <strong>Data center: </strong>
                    {{ platformsData[platformNumber].data['data_center'] }}
                  </span>
                </div>
                <!-- Date of creation -->
                <div v-if="Object.keys(platformsData[platformNumber].data).includes('date_creation')">
                  <span>
                    <strong>Date of creation: </strong>
                    {{ new Date(platformsData[platformNumber].data['date_creation']).toLocaleDateString() }}
                  </span>
                </div>


              </div>
            </Transition>

            <!-- Button showAllData ON OFF-->
            <div class="button-container">
              <button v-show="!platforms[platformNumber].showAllData" class="more-data-button"
                @click="platforms[platformNumber].showAllData = true">+</button>
              <button v-show="platforms[platformNumber].showAllData" class="more-data-button"
                @click="platforms[platformNumber].showAllData = false">-</button>
            </div>

          </div>

        </div>
      </Transition>


      <!-- Platform icon -->
      <img class="icon-str icon-medium icon-img panel-icon-right" @click="ERDDAPIconClicked(platformNumber)"
        src='/HFRadar/Assets/Images/argo.svg' v-if="platformsData[platformNumber].hasData"
        :style="{ 'opacity': Object.keys(platformsData[platformNumber].data).includes('tmstTimeDiffStr') ? (platformsData[platformNumber].data.tmstTimeDiffStr.includes('hour') ? 0.5 : 0.1) : 1 }"
        :title="Object.keys(platformsData[platformNumber].data).includes('tmstTimeDiffStr') ? 'Argo float, ' + platformsData[platformNumber].data.tmstTimeDiffStr : ''">
      <!-- Indicator of ICATMAR -->
        <div class="icon-marker-icatmar"
          v-if="platformsData[platformNumber].hasData && platforms[platformNumber].pi_name == 'Emilio GARCýA-LADONA'"
          :style="{ 'opacity': Object.keys(platformsData[platformNumber].data).includes('tmstTimeDiffStr') ? (platformsData[platformNumber].data.tmstTimeDiffStr.includes('hour') ? 0.5 : 0.25) : 1 }">
        </div>


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
      bbox: [0, 9, 38, 44.5], // long, lat
      queryTrajectoryURL: 'https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats.jsonlKVP?' +
        'platform_number,cycle_number,time,latitude,longitude' +
        '&platform_number="{platformNumber}"',
      querySurfaceData: 'https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats.jsonlKVP?' +
        'platform_number,cycle_number,time,pres_adjusted,temp_adjusted,psal_adjusted,doxy,temp_doxy,turbidity,chla,nitrate' +
        '&platform_number="{platformNumber}"&cycle_number={cycleNumber}&pres_adjusted>=0&pres_adjusted<=5', // 0 - 5 meters
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
      requestedDailyData: {}, // Stores promises and results of promises by daily tmst
      requestedTrajectories: {}, // Stores requested trajectories by platform number
      requestedSurfaceData: {}, // Stores requested surface data by platform number and cycle number
    }
  },
  methods: {
    // USER ACTIONS
    ERDDAPIconClicked: function (platformNumber) {
      this.platformsData[platformNumber].showInfo = !this.platformsData[platformNumber].showInfo;
      // Show / hide trajectory
      if (this.platformsData[platformNumber].showInfo) {
        // Show trajectory
        if (this.platforms[platformNumber].olTrajectoryLayer == undefined) {
          // Load trajectory
          this.getTrajectoryFrom(platformNumber).then(() => {
            // Add trajectory to map
            this.addTrajectoryToMap(platformNumber);
          });
        } else
          // Add the layer to the map
          this.map.addLayer(this.platforms[platformNumber].olTrajectoryLayer);
      } else if (!this.platformsData[platformNumber].showInfo) {
        // Remove trajectory from map
        // Find layers with trajectory on the map and remove them
        let layersToRemove = [];
        this.map.getLayers().forEach(layer => {
          if (layer.get('name').includes('argoTrajectory_' + platformNumber)) {
            layersToRemove.push(layer);
          }
        });
        // Remove layers
        layersToRemove.forEach(layer => {
          this.map.removeLayer(layer);
        });
      }

      // Load surface data
      if (this.platformsData[platformNumber].showInfo) {
        // Get surface data
        let cycleNumber = this.platformsData[platformNumber].data.cycle_number;
        this.getSurfaceData(platformNumber, cycleNumber).then(() => {
          this.updateContent(window.GUIManager.currentTmst);
        });
      }
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
      Object.keys(platforms).forEach(platformNumber => {
        let platform = platforms[platformNumber];
        this.platformsData[platformNumber].hasData = false;
        // Iterate tmst
        let halfHourinMs = 1000 * 60 * 29; // Only show half an hour?
        let visibleTimeSpan = 1000 * 60 * 60 * 24 * 11; // 11 days (11 ahead, 11 behind)
        let closestTimeDiff = 10e12; // Variable to store the closest time difference from a platform with several data points
        // Pick up closest data
        Object.keys(platform.data).forEach(dataTmst => {
          let timeDiff = Math.abs(new Date(dataTmst).getTime() - new Date(tmst).getTime());
          let isAhead = new Date(dataTmst).getTime() > new Date(tmst).getTime(); // Is the data ahead of the current time?
          if (timeDiff < visibleTimeSpan && timeDiff < closestTimeDiff) {
            closestTimeDiff = timeDiff;
            this.platformsData[platformNumber].hasData = true;
            // Empty observed properties
            this.platformsData[platformNumber].data = {};

            // Iterate props and assign to platformsData (vue uses this object)
            Object.keys(platform.data[dataTmst]).forEach(key => {
              this.platformsData[platformNumber].data[key] = platform.data[dataTmst][key];
            });

            // Change layer location
            this.$nextTick(() => {
              platform.coord3857 = ol.proj.fromLonLat([platform.data[dataTmst].longitude, platform.data[dataTmst].latitude]);

              if (platform.olLayer != undefined) {
                platform.olLayer.setElement(this.$refs[platformNumber]);
                platform.olLayer.setPosition(platform.coord3857); // For some reason vue and the map element have to be redefined
                // Opacity if it not in the closest time, and show when it sampled
                if (closestTimeDiff > halfHourinMs) {
                  // Show time difference from now in hours or days
                  this.platformsData[platformNumber].data.tmstTimeDiffStr = closestTimeDiff > 1000 * 60 * 60 * 24 ?
                    Math.round(closestTimeDiff / (1000 * 60 * 60 * 24)) + ' days' :
                    Math.round(closestTimeDiff / (1000 * 60 * 60)) + ' hours';
                  this.platformsData[platformNumber].data.tmstTimeDiffStr += isAhead ? ' ahead' : ' ago';
                  this.platformsData[platformNumber].data.tmstTimeDiffStr += ' from selected time';
                }
              } else {
                debugger;
              }

              if (platformNumber != platform.olLayer.C.element.id) {
                debugger;
              }
            });

          }

        });

        // Update trajectories points and opacities
        if (platform.olTrajectoryLayer != undefined) {
          // If layer is in map, update it
          let ll = this.$parent.getMapLayer(platform.olTrajectoryLayer.get('name'));
          if (ll != undefined) {
            this.map.removeLayer(ll);
            // Update trajectory layer
            this.addTrajectoryToMap(platformNumber);
          }
        }

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
        Object.keys(this.platforms).forEach(platformNumber => {
          this.platformsData[platformNumber].isLoading = true;
        });

        // Prepare start / end of day
        let startDate = new Date(dayTmst + 'T00:00Z');
        let endDate = new Date(dayTmst + 'T00:00Z');
        endDate.setUTCDate(endDate.getUTCDate() + 10); // 10 days after to get all data
        startDate.setUTCDate(startDate.getUTCDate() - 10); // 10 days before to get all data

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
            Object.keys(this.platforms).forEach(platformNumber => {
              this.platformsData[platformNumber].isLoading = false;
            });
            // Create data structure
            this.parseRawTextAndStructureData(res);
            // Map and vue data structure if required
            this.addPlatformsToMap();
          })
          .catch(e => {
            debugger;
            console.error("Error loading ERDDAP data: ", e);
            // Set all platforms to not loading
            Object.keys(this.platforms).forEach(platformNumber => {
              this.platformsData[platformNumber].isLoading = false;
            });
          });
        this.requestedDailyData[dayTmst] = promise;
        return promise
      }
    },


    // Get the trajectory from a platform number
    getTrajectoryFrom(platformNumber) {
      if (this.requestedTrajectories[platformNumber] != undefined) {
        return new Promise((resolve, reject) => {
          resolve(this.requestedTrajectories[platformNumber]);
        });
      }
      // Load the data
      else {
        // Set platform to loading
        this.platformsData[platformNumber].isLoading = true;
        // Prepare url
        let url = this.queryTrajectoryURL.replace('{platformNumber}', platformNumber);

        console.log(url.replace('jsonlKVP', 'htmlTable'));
        const encodedUrl = encodeURIComponent(url);
        let proxyFullURL = this.proxyURL + '?url=' + encodedUrl;
        let promise = this.getDataFromURL(proxyFullURL)
          .then(res => {
            // Store response
            this.requestedTrajectories[platformNumber] = res;
            // Platform trajectory loaded
            this.platformsData[platformNumber].isLoading = false;
            // Parse raw text and structure data
            this.parseTrajectoryRawTextAndStructureData(res, platformNumber);
          });
        this.requestedTrajectories[platformNumber] = promise;
        return promise;
      }

    },


    // Get surface data (water temperature, salinity, etc.) of a given profile
    getSurfaceData(platformNumber, cycleNumber) {
      // Check if the data was already requested
      if (this.requestedSurfaceData[platformNumber + cycleNumber] != undefined) {
        return new Promise((resolve, reject) => {
          resolve(this.requestedSurfaceData[platformNumber + cycleNumber]);
        });
      }

      // Load the data
      // Is this else necessary?
      else {
        // Set platform to loading
        // TODO: there are several loading processes! The loading will be set to false by one of them before the others finishes. Create an array or a counter
        this.platformsData[platformNumber].isLoading = true;
        // Prepare url
        let url = this.querySurfaceData.replace('{platformNumber}', platformNumber).replace('{cycleNumber}', cycleNumber);

        console.log(url.replace('jsonlKVP', 'htmlTable'));
        const encodedUrl = encodeURIComponent(url);
        let proxyFullURL = this.proxyURL + '?url=' + encodedUrl;
        let promise = this.getDataFromURL(proxyFullURL)
          .then(res => {
            // Store response
            this.requestedSurfaceData[platformNumber + cycleNumber] = res;
            // Parse raw text and structure data
            this.parseSurfaceRawTextAndStructureData(res, platformNumber, cycleNumber);
            // Platform trajectory loaded
            this.platformsData[platformNumber].isLoading = false;
          });
        this.requestedSurfaceData[platformNumber + cycleNumber] = promise;
        return promise;
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
        if (platforms[jsRow.platform_number] == undefined) {
          platforms[jsRow.platform_number] = {
            "platform_type": jsRow.platform_type,
            "platform_number": jsRow.platform_number,
            "float_serial_no": jsRow.float_serial_no,
            "project_name": jsRow.project_name,
            "pi_name": jsRow.pi_name,
            "location": [jsRow.longitude, jsRow.latitude], // Initializing location?
            "data": {},
          }
        }
        // Fill the platform with data on given timestamps
        let platform = platforms[jsRow.platform_number];
        // Fill with profile data?
        if (platform.data[jsRow.time] != undefined) {
          //TODO: data is reloaded with the same values debugger;
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
          // Add all parameters to data
          // TODO: should there be a profile here? there is one profile per TMST
          // TODO: request on demand from user? or at least the SST and SSS?
          for (let i = 0; i < this.parameters.length; i++) {
            if (jsRow[this.parameters[i]] != undefined) {
              platform.data[jsRow.time][this.parameters[i]] = jsRow[this.parameters[i]];
            }
          }

        }

      });
      //console.log(platforms);
    },

    // Parse trajectories raw text
    parseTrajectoryRawTextAndStructureData(res, platformNumber) {
      let rows = res.split('\n');
      rows.pop(); // Delete empty

      this.platforms[platformNumber].trajectory = [];
      // Iterate data rows
      rows.forEach(row => {
        let jsRow = JSON.parse(row);
        // Remove nulls
        Object.keys(jsRow).forEach((key) => {
          if (jsRow[key] === null) {
            delete jsRow[key];
          }
        });
        // Define trajectory
        this.platforms[platformNumber].trajectory.push({
          "time": jsRow.time,
          "latitude": jsRow.latitude,
          "longitude": jsRow.longitude,
          "cycle_number": jsRow.cycle_number
        });
      });

      return this.platforms[platformNumber].trajectory;
    },

    // Parse surface data raw text
    parseSurfaceRawTextAndStructureData(res, platformNumber, cycleNumber) {
      let rows = res.split('\n');
      rows.pop(); // Delete empty

      let platforms = this.platforms;

      // Keep the data with the lowest pressure (surface data)
      let min = 5;
      let indexMin = -1;
      for (let i = 0; i < rows.length; i++) {
        let jsRow = JSON.parse(rows[i]);
        if (jsRow.pres_adjusted != undefined && jsRow.pres_adjusted < min) {
          min = jsRow.pres_adjusted;
          indexMin = i;
        }
      }
      if (indexMin == -1) {
        // No surface data found
        // Store the query response as empty or somehow? In update content maybe it is needed some definitions or declarations.
        return;
      }
      // Surface row data
      let jsRow = JSON.parse(rows[indexMin]);
      // Remove nulls
      Object.keys(jsRow).forEach((key) => {
        if (jsRow[key] === null) {
          delete jsRow[key];
        }
      });

      // Define surface data
      if (platforms[platformNumber].data[jsRow.time] == undefined) {
        platforms[platformNumber].data[jsRow.time] = {};

        if (platforms[platformNumber].data[jsRow.time].surfaceData == undefined) {
          platforms[platformNumber].data[jsRow.time].surfaceData = {};
        }
      }

      // Fill with surface data
      platforms[platformNumber].data[jsRow.time].surfaceData = {
        "pres_adjusted": jsRow.pres_adjusted,
        "temp_adjusted": jsRow.temp_adjusted,
        "psal_adjusted": jsRow.psal_adjusted,
        "doxy": jsRow.doxy,
        "temp_doxy": jsRow.temp_doxy,
        "turbidity": jsRow.turbidity,
        "chla": jsRow.chla,
        "nitrate": jsRow.nitrate,
      };

    },

    // Update vue and map
    addPlatformsToMap() {
      // Iterate platforms to create vue objects and map layers
      Object.keys(this.platforms).forEach(platformNumber => {
        this.addPlatformToMap(platformNumber, 0);
      });
    },
    // Add platform to map
    addPlatformToMap(platformNumber, count) {
      let platform = this.platforms[platformNumber];

      // Platform was already added to map
      if (platform.olLayer != undefined)
        return;

      // Create vue object
      if (this.platformsData[platformNumber] == undefined) {
        this.platformsData[platformNumber] = { "hasData": false, "showInfo": false, "isLoading": false };
        this.platforms[platformNumber].coord3857 = ol.proj.fromLonLat([this.platforms[platformNumber].location[0], this.platforms[platformNumber].location[1]]);
      }

      this.$nextTick(() => {
        if (this.$refs[platformNumber] == undefined) {
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
          name: platformNumber,
          position: this.platforms[platformNumber].coord3857,
          positioning: 'center-right',//Object.keys(this.platforms).length % 2 == 1 ? 'center-right' : 'center-left',
          element: this.$refs[platformNumber],
          stopEvent: false,
        });
        platformInfo.getElement().classList.add('no-pointer-events');
        platformInfo.getElement().parentElement.classList.add('no-pointer-events');
        platformInfo.element.classList.add('no-pointer-events'); // Remove pointer events, container takes more space than necessary and blocks visible icons
        this.map.addOverlay(platformInfo);
        console.log("Added Argo float from ERDDAP");
        platform.olLayer = platformInfo;
      });
    },
    // Add trajectory to map
    addTrajectoryToMap(platformNumber, numPoints) {
      let trajectory = this.platforms[platformNumber].trajectory;
      // Remove all trajectories from map
      // Find layers with trajectory on the map and remove them
      let layersToRemove = [];
      this.map.getLayers().forEach(layer => {
        if (layer.get('name').includes('argoTrajectory')) {
          layersToRemove.push(layer);
        }
      });
      // Remove layers
      layersToRemove.forEach(layer => {
        this.map.removeLayer(layer);
      });

      // Do not reuse already created trajectory layer as opacity changes with time
      //if (this.platforms[platformNumber].olTrajectoryLayer != undefined)

      // No data in trajectory
      if (trajectory == undefined || trajectory.length == 0) {
        debugger;
        console.warn("No trajectory for platform " + platformNumber);
        return;
      }

      // Get map
      if (this.map == undefined) {
        this.map = this.$parent.map;
      }

      // Line and point features
      let coords3857 = trajectory.map(p => ol.proj.fromLonLat([p.longitude, p.latitude]));
      numPoints = numPoints == undefined ? coords3857.length : numPoints;
      let lineFeatures = [];
      let pointFeatures = [];
      // Overlay time
      let tmst = this.platformsData[platformNumber].data.time;
      let tmstGetTime = new Date(tmst).getTime();
      // Create line segments and points with different opacity
      for (let i = 0; i < numPoints; i++) {

        // Set style with opacity based on time difference
        let timeDiff = Math.abs(new Date(trajectory[i].time).getTime() - tmstGetTime);
        //let opacity = timeDiff < 1000 * 60 * 60 ? 1 : timeDiff < 1000 * 60 * 60 * 24 ? 0.8 : timeDiff < 1000 * 60 * 60 * 24 * 7 ? 0.6 : 0.4;
        let opacity = Math.max(1 - timeDiff / (1000 * 60 * 60 * 24 * 30), 0.15); // 30 days max opacity
        // Do not create point if it is the overlay
        if (trajectory[i].time != tmst) {

          // Create point features
          let pointFeature = new ol.Feature({
            geometry: new ol.geom.Point(coords3857[i]),
            data: trajectory[i], // Store metadata for click interaction
          });

          pointFeature.setStyle(new ol.style.Style({
            image: new ol.style.Circle({
              radius: 6 * opacity,
              fill: new ol.style.Fill({ color: 'rgba(0, 153, 255, ' + opacity + ')' }),
              stroke: new ol.style.Stroke({ color: '#fff', width: 2 * opacity }),
            }),
          }));
          pointFeatures.push(pointFeature);
        }


        // Create line segment feature
        if (i == coords3857.length - 1) {
          // Last point, no line segment
          continue;
        }
        // Create line segment feature
        let lineFeature = new ol.Feature({
          geometry: new ol.geom.LineString([coords3857[i], coords3857[i + 1]])
        });

        lineFeature.setStyle(new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: 'rgba(0, 122, 255, ' + opacity + ')', // Blue with opacity
            width: 3 * opacity,
          }),
        }));
        lineFeatures.push(lineFeature);


      }



      // Create vector layer for trajectory
      let olTrajectoryLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
          features: [...lineFeatures, ...pointFeatures], // Add line and points
        }),
      });
      olTrajectoryLayer.set('name', 'argoTrajectory_' + platformNumber); // Set name for easy identification
      // Add the layer to the map
      this.map.addLayer(olTrajectoryLayer);
      this.platforms[platformNumber].olTrajectoryLayer = olTrajectoryLayer;
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

.hide3Dwidget {
  font-size: small;
  height: 14px;
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