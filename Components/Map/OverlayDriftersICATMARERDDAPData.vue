<template>

  <div id="overlay-drifters-icatmar-erddap-data" ref="containerErddapInfo">
    <!-- Container -->
    <div v-for="(deployment_id, index) in Object.keys(platformsData)" :id="deployment_id" :ref="deployment_id"
      class="ERDDAPContainer"
      :class="[!isTooFar && isAdvancedInterfaceOnOff && isExternalObsVisible ? 'showOverlayMap' : 'hideOverlayMap']">



      <!-- Platform panel -->
      <Transition>
        <div class="platformPanel" v-if="platformsData[deployment_id].showInfo && platformsData[deployment_id].hasData">
          <!-- Site -->
          <div class="platformTitle">
            <div v-show="platformsData[deployment_id].isLoading" class="lds-ring">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            <span><strong>{{ platforms[deployment_id]['drifter_type'] }} Drifter</strong></span>
            <a href="https://erddap.ifremer.fr/erddap/index.html" target="_blank" rel="noopener noreferrer"
              class="icon-str">i</a>
          </div>

          <!-- Platform data -->
          <div v-if="platformsData[deployment_id].hasData">


            <!-- 3D widget -->
            <Transition>
              <div class="sketchfab-embed-wrapper"
                v-show="platforms[deployment_id].hide3Dwidget == undefined || !platforms[deployment_id].hide3Dwidget">
                <iframe title="Drifter" frameborder="0" allowfullscreen mozallowfullscreen="true"
                  webkitallowfullscreen="true" allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking
                  execution-while-out-of-viewport execution-while-not-rendered web-share :src="[platforms[deployment_id]['drifter_type'].includes('SVP') ? 'https://sketchfab.com/models/5a689f0b306e4f25b5d25dd6b80de7e9/embed' :
                    platforms[deployment_id]['drifter_type'].includes('CODE') ? 'https://sketchfab.com/models/b7cb794037b446449cef213427231317/embed' :
                      platforms[deployment_id]['drifter_type'].includes('STOKES') ? 'https://sketchfab.com/models/57a114fa7a8f466e828942bd7d32da5a/embed' :
                        '']"> </iframe>
                <!-- <p style="font-size: 13px; font-weight: normal; margin: 5px; color: #4A4A4A;"> <a
                    href="https://sketchfab.com/3d-models/oceanographic-argo-profiling-float-439474c830744c95b48dc90cfff6fdbe?utm_medium=embed&utm_campaign=share-popup&utm_content=439474c830744c95b48dc90cfff6fdbe"
                    target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Oceanographic Argo
                    Profiling Float </a>
                </p> -->
              </div>
            </Transition>

            <!-- Button show / hide 3D widget-->
            <div class="button-container">
              <button v-show="!platforms[deployment_id].hide3Dwidget" class="more-data-button hide3Dwidget"
                @click="platforms[deployment_id].hide3Dwidget = true">Hide 3D</button>
              <button v-show="platforms[deployment_id].hide3Dwidget" class="more-data-button hide3Dwidget"
                @click="platforms[deployment_id].hide3Dwidget = false">Show 3D</button>
            </div>


            <!-- Temperature -->
            <div v-if="Object.keys(platformsData[deployment_id].data).includes('temperature')">
              <span>
                <strong>Water temperature: </strong>
                {{ platformsData[deployment_id].data.temperature }} ºC
              </span>
            </div>


            <!-- Show trajectory -->
            <!-- Go to date -->

            <!-- Extra data -->
            <Transition>
              <div v-if="platforms[deployment_id].showAllData">

                <!-- Time difference from now -->
                <div v-if="Object.keys(platformsData[deployment_id].data).includes('tmstTimeDiffStr')">
                  <span>
                    <strong>Collected </strong>
                    {{ platformsData[deployment_id].data.tmstTimeDiffStr }}
                  </span>
                </div>

                <!-- Institution -->
                <div v-if="Object.keys(platformsData[deployment_id].data).includes('institution')">
                  <span>
                    <strong title="institution">Institution: </strong>
                    {{ platformsData[deployment_id].data['institution'] }}
                  </span>
                </div>

                <!-- Project -->
                <div v-if="Object.keys(platformsData[deployment_id].data).includes('project')">
                  <span>
                    <strong title="project">Project: </strong>
                    {{ platformsData[deployment_id].data['project'] }}
                  </span>
                </div>

                <!-- Principal investigator -->
                <div v-if="Object.keys(platformsData[deployment_id].data).includes('pi_name')">
                  <span>
                    <strong>Principal investigator(s): </strong>
                    {{ platformsData[deployment_id].data['pi_name'] }}
                  </span>
                </div>

                <!-- Exercise (campanya) -->
                <div v-if="Object.keys(platformsData[deployment_id].data).includes('exercise')">
                  <span>
                    <strong>Exercise: </strong>
                    {{ platformsData[deployment_id].data['exercise'] }}
                  </span>
                </div>

                <!-- Deployment id-->
                <div v-if="Object.keys(platformsData[deployment_id].data).includes('deployment_id')">
                  <span>
                    <strong title="deployment_id / fileNumber">Deployment Id: </strong>
                    {{ platformsData[deployment_id].data['deployment_id'] }}
                  </span>
                </div>


              </div>
            </Transition>

            <!-- Button showAllData ON OFF-->
            <div class="button-container">
              <button v-show="!platforms[deployment_id].showAllData" class="more-data-button"
                @click="platforms[deployment_id].showAllData = true">+</button>
              <button v-show="platforms[deployment_id].showAllData" class="more-data-button"
                @click="platforms[deployment_id].showAllData = false">-</button>
            </div>

          </div>

        </div>
      </Transition>


      <!-- Platform icon -->
      <img class="icon-str icon-medium icon-img panel-icon-right" @click="ERDDAPIconClicked(deployment_id)"
        src='/HFRadar/Assets/Images/drifter.svg' v-if="platformsData[deployment_id].hasData"
        :style="{ 'opacity': Object.keys(platformsData[deployment_id].data).includes('tmstTimeDiffStr') ? (platformsData[deployment_id].data.tmstTimeDiffStr.includes('hour') ? 0.5 : 0.1) : 1 }"
        :title="Object.keys(platformsData[deployment_id].data).includes('tmstTimeDiffStr') ? 'Drifter, ' + platformsData[deployment_id].data.tmstTimeDiffStr : ''">


    </div>
  </div>

</template>


<script>

// ERDDAP DRIFTERS ICATMAR
// https://erddap.icatmar.cat/erddap/index.html

// Data website: https://erddap.icatmar.cat/erddap/tabledap/socat_data_drifters_ICATMAR.html

// This component requires a proxy server to avoid CORS policies from the ERDDAP server? For testing yes, but for deployment?
// https://github.com/ICATMAR/ProxyServerAPI





export default {
  name: 'overlay-drifters-icatmar-erddap-data',
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
      queryPlatformsURL: "https://erddap.icatmar.cat/erddap/tabledap/socat_data_drifters_ICATMAR.jsonlKVP" +
        "?{parameters}" +
        "&time>={startDate}&time<={endDate}&longitude>={longMin}&longitude<={longMax}&latitude>={latMin}&latitude<={latMax}" +
        "&distinct()",
      //bbox: [0, 5, 39.5, 44], // long, lat
      //DEBUGGING LINE FOR GALICIA'S DRIFTERS, PLEASE UNCOMMENT
      bbox: [-15, 6, 35, 46], // long, lat
      queryTrajectoryURL: 'https://erddap.icatmar.cat/erddap/tabledap/socat_data_drifters_ICATMAR.jsonlKVP' +
        '?time,latitude,longitude,temperature' +
        '&deployment_id={deployment_id}',
      parameters: [
        'deployment_id',
        'drifter_type',
        'institution',
        'project',
        'pi_name',
        'exercise',
        'latitude',
        'longitude',
        'time',
        'temperature'
      ],
      platforms: {},
      platformsData: {},
      requestStatus: {}, // Stores requested timestamps
      requestedDailyData: {}, // Stores promises and results of promises by daily tmst
      requestedTrajectories: {}, // Stores requested trajectories by platform number
    }
  },
  methods: {
    // USER ACTIONS
    ERDDAPIconClicked: function (deployment_id) {
      this.platformsData[deployment_id].showInfo = !this.platformsData[deployment_id].showInfo;
      // Show / hide trajectory
      if (this.platformsData[deployment_id].showInfo) {
        // Show trajectory
        if (this.platforms[deployment_id].olTrajectoryLayer == undefined) {
          // Load trajectory
          this.getTrajectoryFrom(deployment_id).then(() => {
            // Add trajectory to map
            this.addTrajectoryToMap(deployment_id);
          });
        } else
          // Add the layer to the map
          this.map.addLayer(this.platforms[deployment_id].olTrajectoryLayer);
      } else if (!this.platformsData[deployment_id].showInfo) {
        // Remove trajectory from map
        // Find layers with trajectory on the map and remove them
        let layersToRemove = [];
        this.map.getLayers().forEach(layer => {
          if (layer.get('name').includes('drifterTrajectory_' + deployment_id)) {
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
      Object.keys(platforms).forEach(deployment_id => {
        let platform = platforms[deployment_id];
        this.platformsData[deployment_id].hasData = false;
        // Iterate tmst
        let halfHourinMs = 1000 * 60 * 29; // Only show half an hour?
        let visibleTimeSpan = 1000 * 60 * 60 * 24 * 11; // 11 days (11 ahead, 11 behind)
        let closestTimeDiff = 10e12; // Variable to store the closest time difference from a platform with several data points
        // Pick up closest data
        Object.keys(platform.data).forEach(dataTmst => {
          let timeDiff = Math.abs(new Date(dataTmst).getTime() - new Date(tmst).getTime());
          let isAhead = new Date(dataTmst).getTime() > new Date(tmst).getTime() > 0; // Is the data ahead of the current time?
          if (timeDiff < visibleTimeSpan && timeDiff < closestTimeDiff) {
            closestTimeDiff = timeDiff;
            this.platformsData[deployment_id].hasData = true;
            // Empty observed properties
            this.platformsData[deployment_id].data = {};

            // Iterate props and assign to platformsData (vue uses this object)
            Object.keys(platform.data[dataTmst]).forEach(key => {
              this.platformsData[deployment_id].data[key] = platform.data[dataTmst][key];
            });

            // Change layer location
            this.$nextTick(() => {
              platform.coord3857 = ol.proj.fromLonLat([platform.data[dataTmst].longitude, platform.data[dataTmst].latitude]);

              if (platform.olLayer != undefined) {
                platform.olLayer.setElement(this.$refs[deployment_id]);
                platform.olLayer.setPosition(platform.coord3857); // For some reason vue and the map element have to be redefined
                // Opacity if it not in the closest time, and show when it sampled
                if (closestTimeDiff > halfHourinMs) {
                  // Show time difference from now in hours or days
                  this.platformsData[deployment_id].data.tmstTimeDiffStr = closestTimeDiff > 1000 * 60 * 60 * 24 ?
                    Math.round(closestTimeDiff / (1000 * 60 * 60 * 24)) + ' days' :
                    Math.round(closestTimeDiff / (1000 * 60 * 60)) + ' hours';
                  this.platformsData[deployment_id].data.tmstTimeDiffStr += isAhead ? ' ahead' : ' ago';
                  this.platformsData[deployment_id].data.tmstTimeDiffStr += ' from selected time';
                }
              } else {
                debugger;
              }

              if (deployment_id != platform.olLayer.C.element.id) {
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
            this.addTrajectoryToMap(deployment_id);
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
        Object.keys(this.platforms).forEach(deployment_id => {
          this.platformsData[deployment_id].isLoading = true;
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
            Object.keys(this.platforms).forEach(deployment_id => {
              this.platformsData[deployment_id].isLoading = false;
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


    // Get the trajectory from a platform number
    getTrajectoryFrom(deployment_id) {
      if (this.requestedTrajectories[deployment_id] != undefined) {
        return new Promise((resolve, reject) => {
          resolve(this.requestedTrajectories[deployment_id]);
        });
      }
      // Load the data
      else {
        // Set platform to loading
        this.platformsData[deployment_id].isLoading = true;
        // Prepare url
        let url = this.queryTrajectoryURL.replace('{deployment_id}', deployment_id);

        console.log(url.replace('jsonlKVP', 'htmlTable'));
        const encodedUrl = encodeURIComponent(url);
        let proxyFullURL = this.proxyURL + '?url=' + encodedUrl;
        let promise = this.getDataFromURL(proxyFullURL)
          .then(res => {
            // Store response
            this.requestedTrajectories[deployment_id] = res;
            // Platform trajectory loaded
            this.platformsData[deployment_id].isLoading = false;
            // Parse raw text and structure data
            this.parseTrajectoryRawTextAndStructureData(res, deployment_id);
          });
        this.requestedTrajectories[deployment_id] = promise;
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
        if (platforms[jsRow.deployment_id] == undefined) {
          platforms[jsRow.deployment_id] = {
            "deployment_id": jsRow.deployment_id,
            "drifter_type": jsRow.drifter_type,
            "institution": jsRow.institution,
            "project": jsRow.project,
            "pi_name": jsRow.pi_name,
            "exercise": jsRow.exercise,
            "location": [jsRow.longitude, jsRow.latitude], // Initializing location
            "temperature": jsRow.temperature,
            "data": {},
          }
        }
        // Fill the platform with data on given timestamps
        let platform = platforms[jsRow.deployment_id];
        // Fill with profile data?
        if (platform.data[jsRow.time] != undefined) {
          //TODO: data is reloaded with the same values debugger;
          // Keep the one with more data
          if (Object.keys(jsRow).length - 3 > Object.keys(platform.data[jsRow.time]).length) {
            // TODO: WHAT ABOUT DUPLICATED DATA? ERDDAP PROBLEM'S --> TODO use &distinct() in the query!
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
    parseTrajectoryRawTextAndStructureData(res, deployment_id) {
      let rows = res.split('\n');
      rows.pop(); // Delete empty

      this.platforms[deployment_id].trajectory = [];
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
        this.platforms[deployment_id].trajectory.push({
          "time": jsRow.time,
          "latitude": jsRow.latitude,
          "longitude": jsRow.longitude,
          "temperature": jsRow.temperature
        });
      });

      return this.platforms[deployment_id].trajectory;
    },



    // Update vue and map
    addPlatformsToMap() {
      // Iterate platforms to create vue objects and map layers
      Object.keys(this.platforms).forEach(deployment_id => {
        this.addPlatformToMap(deployment_id, 0);
      });
    },
    // Add platform to map
    addPlatformToMap(deployment_id, count) {
      let platform = this.platforms[deployment_id];

      // Platform was already added to map
      if (platform.olLayer != undefined)
        return;

      // Create vue object
      if (this.platformsData[deployment_id] == undefined) {
        this.platformsData[deployment_id] = { "hasData": false, "showInfo": false, "isLoading": false };
        this.platforms[deployment_id].coord3857 = ol.proj.fromLonLat([this.platforms[deployment_id].location[0], this.platforms[deployment_id].location[1]]);
      }

      this.$nextTick(() => {
        if (this.$refs[deployment_id] == undefined) {
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
          name: deployment_id,
          position: this.platforms[deployment_id].coord3857,
          positioning: 'center-right',//Object.keys(this.platforms).length % 2 == 1 ? 'center-right' : 'center-left',
          element: this.$refs[deployment_id],
          stopEvent: false,
        });
        platformInfo.getElement().classList.add('no-pointer-events');
        platformInfo.getElement().parentElement.classList.add('no-pointer-events');
        platformInfo.element.classList.add('no-pointer-events'); // Remove pointer events, container takes more space than necessary and blocks visible icons
        this.map.addOverlay(platformInfo);
        console.log("Added ICATMAR drifter from ERDDAP");
        platform.olLayer = platformInfo;
      });
    },
    // Add trajectory to map
    addTrajectoryToMap(deployment_id, numPoints) {
      let trajectory = this.platforms[deployment_id].trajectory;
      // Remove all trajectories from map
      // Find layers with trajectory on the map and remove them
      let layersToRemove = [];
      this.map.getLayers().forEach(layer => {
        if (layer.get('name').includes('drifterTrajectory')) {
          layersToRemove.push(layer);
        }
      });
      // Remove layers
      layersToRemove.forEach(layer => {
        this.map.removeLayer(layer);
      });

      // Do not reuse already created trajectory layer as opacity changes with time
      //if (this.platforms[deployment_id].olTrajectoryLayer != undefined)

      // No data in trajectory
      if (trajectory == undefined || trajectory.length == 0) {
        debugger;
        console.warn("No trajectory for platform " + deployment_id);
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
      let tmst = this.platformsData[deployment_id].data.time;
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
      olTrajectoryLayer.set('name', 'drifterTrajectory_' + deployment_id); // Set name for easy identification
      // Add the layer to the map
      this.map.addLayer(olTrajectoryLayer);
      this.platforms[deployment_id].olTrajectoryLayer = olTrajectoryLayer;
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