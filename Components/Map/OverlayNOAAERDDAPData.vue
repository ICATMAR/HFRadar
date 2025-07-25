<template>

  <div id="overlay-noaa-erddap-data" ref="containerErddapInfo">
    <!-- Container -->
    <div v-for="(platformCode, index) in Object.keys(platformsData)" :id="platformCode" :ref="platformCode"
      class="ERDDAPContainer">



      <!-- Platform panel -->
      <Transition>
        <div class="platformPanel" v-if="platformsData[platformCode].showInfo && platformsData[platformCode].hasData"
          :class="[!isTooFar ? 'showOverlayMap' : 'hideOverlayMap']">
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

                <!-- Time difference from now -->
                <div v-if="Object.keys(platformsData[platformCode].data).includes('tmstTimeDiffStr')">
                  <span>
                    <strong>Collected </strong>
                    {{ platformsData[platformCode].data.tmstTimeDiffStr }}
                  </span>
                </div>

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
      <img class="icon-str icon-medium icon-img panel-icon-right clickable"
        v-if="platformsData[platformCode].hasData"
        :class="[!isTooFar ? 'showOverlayMap' : 'hideOverlayMap', { 'icon-selected': platformsData[platformCode].showInfo }]"
        Pregunta-li a ChatGPT @click="ERDDAPIconClicked(platformCode)" :src="[platforms[platformCode]['type'].includes('SHIP') ||platforms[platformCode]['type'].includes('VOSCLIM') ? '/HFRadar/Assets/Images/boat.svg' :
          platforms[platformCode]['type'].includes('DRIFTING') ? '/HFRadar/Assets/Images/drifter.svg' :
            platforms[platformCode]['type'].includes('GLIDERS') ? '/HFRadar/Assets/Images/argo.svg' :
              '/HFRadar/Assets/Images/buoy.svg']"
        :style="{ 'opacity': Object.keys(platformsData[platformCode].data).includes('tmstTimeDiffStr') ? (platformsData[platformCode].data.tmstTimeDiffStr.includes('hour') ? 0.5 : 0.1) : 1 }"
        :title="Object.keys(platformsData[platformCode].data).includes('tmstTimeDiffStr') ? platformsData[platformCode].data.tmstTimeDiffStr + '. Source: NOAA' : 'Source: NOAA'">

      <!-- Marker when far away -->
      <!-- Hide / show depending on zoom level -->
      <div :class="[isTooFar ? 'showOverlayMap' : 'hideOverlayMap']">
        <!-- Marker -->
        <div class="map-marker" title="Source: NOAA" v-if="platformsData[platformCode].hasData"
          :style="{ 'opacity': Object.keys(platformsData[platformCode].data).includes('tmstTimeDiffStr') ? (platformsData[platformCode].data.tmstTimeDiffStr.includes('hour') ? 0.75 : 0.33) : 1 }">
        </div>
      </div>


    </div>
  </div>

</template>


<script>

// ERDDAP AOML NOAA
// https://erddap.aoml.noaa.gov/gdp/erddap/index.html
// Balearic sea platforms in real-time
// Graph website: https://erddap.aoml.noaa.gov/gdp/erddap/tabledap/OSMC_RealTime.graph?longitude,latitude,platform_id&time>=2024-08-16T00:00:00Z&time<=2024-08-23T00:00:00Z&longitude>=0&longitude<=5&latitude>=39.5&latitude<=44&.draw=markers&.marker=5%7C5&.color=0x000000&.colorBar=%7C%7C%7C%7C%7C&.bgColor=0xffccccff
// Dataset url (html): https://osmc.noaa.gov/erddap/tabledap/OSMC_flattened.htmlTable?longitude,latitude,time,platform_type,platform_id&time>=2024-08-16T00:00:00Z&time<=2024-08-23T00:00:00Z&longitude>=0&longitude<=5&latitude>=39.5&latitude<=44&.draw=markers&.marker=5%7C5&.color=0x000000&.colorBar=%7C%7C%7C%7C%7C&.bgColor=0xffccccff
// All data: https://osmc.noaa.gov/erddap/tabledap/OSMC_flattened.htmlTable?platform_id%2Cplatform_code%2Cplatform_type%2Ccountry%2Ctime%2Clatitude%2Clongitude%2Cobservation_depth%2Csst%2Catmp%2Cprecip%2Csss%2Cztmp%2Czsal%2Cslp%2Cwindspd%2Cwinddir%2Cwvht%2Cwaterlevel%2Cclouds%2Cdewpoint%2Cuo%2Cvo%2Cwo%2Crainfall_rate%2Chur%2Csea_water_elec_conductivity%2Csea_water_pressure%2Crlds%2Crsds%2Cwaterlevel_met_res%2Cwaterlevel_wrt_lcd%2Cwater_col_ht%2Cwind_to_direction%2Clon360&time%3E=2024-08-15T00%3A00%3A00Z&latitude%3E=29&latitude%3C=46&longitude%3E=-6&longitude%3C=20



// This component requires a proxy server to avoid CORS policies from the ERDDAP server. 
// https://github.com/ICATMAR/ProxyServerAPI





export default {
  name: 'overlay-noaa-erddap-data',
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
  },
  data() {
    return {
      proxyURL: 'https://api.icatmar.cat/proxy/',//"http://localhost:3000/proxy",
      isTooFar: false,
      queryPlatformsURL: "https://osmc.noaa.gov/erddap/tabledap/OSMC_flattened.jsonlKVP" +
        "?{parameters}" +
        "&time>={startDate}&time<={endDate}&longitude>={longMin}&longitude<={longMax}&latitude>={latMin}&latitude<={latMax}" +
        "&observation_depth<0.5",// + // Avoid subsurface data
      //'&platform_type="DRIFTING BUOYS"', // Restric to drifters
      queryTrajectoryURL: 'https://osmc.noaa.gov/erddap/tabledap/OSMC_flattened.jsonlKVP' +
        '?platform_code,platform_id,longitude,latitude,time' +
        '&platform_code="{platformCode}"&time>={oldestDate}&distinct()&orderBy("time")',
      bbox: [0, 9, 38, 44.5], // long, lat
      parameters: [
        'platform_type',
        'platform_code',
        'platform_id',
        'longitude',
        'latitude',
        'time',
        'observation_depth',
        'sst',
        'atmp',
        'precip',
        'sss',
        'ztmp',
        'zsal',
        'slp',
        'windspd',
        'winddir',
        'wvht',
        'waterlevel',
        'clouds',
        'dewpoint',
        'uo',
        'vo',
        'wo',
        'rainfall_rate',
        'hur',
        'sea_water_elec_conductivity',
        'rlds',
        'rsds',
        'waterlevel_met_res',
        'waterlevel_wrt_lcd',
        'water_col_ht',
        'wind_to_direction',
      ],
      platforms: {},
      platformsData: {},
      requestStatus: {}, // Stores requested timestamps
      requestedDailyData: {}, // Stores promises and results of promises by daily tmst
      requestedTrajectories: {}, // Stores requested trajectories
    }
  },
  methods: {
    // USER ACTIONS
    ERDDAPIconClicked: function (platformCode) {
      this.platformsData[platformCode].showInfo = !this.platformsData[platformCode].showInfo;

      // Show / hide trajectory
      if (this.platformsData[platformCode].showInfo) {
        // Show trajectory
        if (this.platforms[platformCode].olTrajectoryLayer == undefined) {
          // Load trajectory
          this.getTrajectoryFrom(platformCode).then(() => {
            // Update content
            this.updateContent(window.GUIManager.currentTmst);
            // Add trajectory to map
            this.addTrajectoryToMap(platformCode);
          });
        } else
          // Add the layer to the map
          this.map.addLayer(this.platforms[platformCode].olTrajectoryLayer);
      } else if (!this.platformsData[platformCode].showInfo) {
        // Remove trajectory from map
        // Find layers with trajectory on the map and remove them
        let layersToRemove = [];
        this.map.getLayers().forEach(layer => {
          if (layer.get('name').includes('noaaDrifterTrajectory_' + platformCode)) {
            layersToRemove.push(layer);
          }
        });
        // Remove layers
        layersToRemove.forEach(layer => {
          this.map.removeLayer(layer);
        });
      }
    },
    // INTERNAL
    selectedDateChanged: function (tmst) {
      if (tmst == undefined)
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
        let visibleTimeSpan = 1000 * 60 * 60 * 24 * 11; // 11 days (11 ahead, 11 behind)
        let closestTimeDiff = 10e12;
        // Pick up closest data
        Object.keys(platform.data).forEach(dataTmst => {
          let timeDiff = Math.abs(new Date(dataTmst).getTime() - new Date(tmst).getTime());
          let isAhead = new Date(dataTmst).getTime() > new Date(tmst).getTime() > 0; // Is the data ahead of the current time?
          if (timeDiff < visibleTimeSpan && timeDiff < closestTimeDiff) {
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
                // Opacity if it not in the closest time, and show when it sampled
                if (closestTimeDiff > halfHourinMs) {
                  // Show time difference from now in hours or days
                  this.platformsData[platformCode].data.tmstTimeDiffStr = closestTimeDiff > 1000 * 60 * 60 * 24 ?
                    Math.round(closestTimeDiff / (1000 * 60 * 60 * 24)) + ' days' :
                    Math.round(closestTimeDiff / (1000 * 60 * 60)) + ' hours';
                  this.platformsData[platformCode].data.tmstTimeDiffStr += isAhead ? ' ahead' : ' ago';
                  this.platformsData[platformCode].data.tmstTimeDiffStr += ' from selected time';
                }
              } else {
                debugger;
              }

              if (platformCode != platform.olLayer.C.element.id) {
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
            this.addTrajectoryToMap(platformCode);
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
          })
          .catch(e => {
            debugger;
            console.error("Error loading NOAA ERDDAP data: ", e);
            // Set all platforms to not loading
            Object.keys(this.platforms).forEach(platformCode => {
              this.platformsData[platformCode].isLoading = false;
            });
          });
        this.requestedDailyData[dayTmst] = promise;
        return promise
      }

    },

    // Get the trajectory from a platform number
    getTrajectoryFrom(platformCode) {
      if (this.requestedTrajectories[platformCode] != undefined) {
        return new Promise((resolve, reject) => {
          resolve(this.requestedTrajectories[platformCode]);
        });
      }
      // Load the data
      else {
        // Set platform to loading
        this.platformsData[platformCode].isLoading = true;
        // Prepare url
        let url = this.queryTrajectoryURL.replace('{platformCode}', platformCode);
        // Get oldest date
        let oldestDate = new Date();
        oldestDate.setUTCDate(oldestDate.getUTCDate() - 20); // 20 days ago
        url = url.replace('{oldestDate}', oldestDate.toISOString());

        console.log(url.replace('jsonlKVP', 'htmlTable'));
        const encodedUrl = encodeURIComponent(url);
        let proxyFullURL = this.proxyURL + '?url=' + encodedUrl;
        let promise = this.getDataFromURL(proxyFullURL)
          .then(res => {
            // Store response
            this.requestedTrajectories[platformCode] = res;
            // Platform trajectory loaded
            this.platformsData[platformCode].isLoading = false;
            // Parse raw text and structure data
            this.parseTrajectoryRawTextAndStructureData(res, platformCode);
          });
        this.requestedTrajectories[platformCode] = promise;
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

    // Parse trajectories raw text
    parseTrajectoryRawTextAndStructureData(res, platformCode) {
      let rows = res.split('\n');
      rows.pop(); // Delete empty

      this.platforms[platformCode].trajectory = [];
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
        this.platforms[platformCode].trajectory.push({
          "time": jsRow.time,
          "latitude": jsRow.latitude,
          "longitude": jsRow.longitude,
        });
      });

      return this.platforms[platformCode].trajectory;
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


    // Add trajectory to map
    addTrajectoryToMap(platformCode, numPoints) {
      let trajectory = this.platforms[platformCode].trajectory;
      // Remove all trajectories from map
      // Find layers with trajectory on the map and remove them
      let layersToRemove = [];
      this.map.getLayers().forEach(layer => {
        if (layer.get('name').includes('noaaDrifterTrajectory')) {
          layersToRemove.push(layer);
        }
      });
      // Remove layers
      layersToRemove.forEach(layer => {
        this.map.removeLayer(layer);
      });

      // Do not reuse already created trajectory layer as opacity changes with time
      //if (this.platforms[platformCode].olTrajectoryLayer != undefined)

      // No data in trajectory
      if (trajectory == undefined || trajectory.length == 0) {
        debugger;
        console.warn("No trajectory for platform " + platformCode);
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
      let tmst = this.platformsData[platformCode].data.time;
      let tmstGetTime = new Date(tmst).getTime();
      // Create line segments and points with different opacity
      for (let i = 0; i < numPoints; i++) {

        // Set style with opacity based on time difference
        let timeDiff = Math.abs(new Date(trajectory[i].time).getTime() - tmstGetTime);
        //let opacity = timeDiff < 1000 * 60 * 60 ? 1 : timeDiff < 1000 * 60 * 60 * 24 ? 0.8 : timeDiff < 1000 * 60 * 60 * 24 * 7 ? 0.6 : 0.4;
        let opacity = Math.max(1 - timeDiff / (1000 * 60 * 60 * 24 * 5), 0.15); // 5 days max opacity
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
        // Point for current timestamp
        else {
          // Create point feature for current timestamp
          let pointFeature = new ol.Feature({
            geometry: new ol.geom.Point(coords3857[i]),
            data: trajectory[i], // Store metadata for click interaction
          });

          pointFeature.setStyle(new ol.style.Style({
            image: new ol.style.Circle({
              radius: 8 * opacity,
              fill: new ol.style.Fill({ color: 'rgba(255, 115, 105, ' + opacity + ')' }), // Red for current position
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
      olTrajectoryLayer.set('name', 'noaaDrifterTrajectory_' + platformCode); // Set name for easy identification
      // Add the layer to the map
      this.map.addLayer(olTrajectoryLayer);
      this.platforms[platformCode].olTrajectoryLayer = olTrajectoryLayer;
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