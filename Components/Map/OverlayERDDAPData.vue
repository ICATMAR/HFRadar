<template>

  <div id="overlay-erddap-data" ref="containerErddapInfo">
    <!-- Container -->
    <!-- <div v-for="platformId in Object.keys(platformsData)" :id="platformId" :ref="platformId" class="ERDDAPContainer" :class="[!isTooFar && isAdvancedInterfaceOnOff ? 'show' : 'hideOverlayMap']"> -->
    <div v-for="(platformId, index) in Object.keys(platformsData)" :id="platformId" :ref="platformId"
      class="ERDDAPContainer"
      :class="[!isTooFar && isAdvancedInterfaceOnOff && isExternalObsVisible ? 'showOverlayMap' : 'hideOverlayMap']">



      <!-- Platform panel -->
      <Transition>
        <div class="platformPanel" v-if="platformsData[platformId].showInfo">
          <!-- Site -->
          <div class="platformTitle">
            <div v-show="platformsData[platformId].isLoading" class="lds-ring">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            <span><strong>{{platforms[platformId]["type"]}}</strong></span>
            <a href="https://erddap.aoml.noaa.gov/gdp/erddap/index.html" target="_blank" rel="noopener noreferrer" class="icon-str">i</a>
          </div>

          <!-- Platform data -->
          <div v-if="platformsData[platformId].hasData">

            <!-- Wind -->
            <div v-if="Object.keys(platformsData[platformId].data).includes('WSPD')">
              <span>
                <strong>Wind: </strong>
                {{ platformsData[platformId].data['windspd'].toFixed(1) }} m/s,
                {{ bearing2compassRose(platformsData[platformId].data['winddir']) }}
                <span class="fa"
                  :style="{ transform: 'rotate(' + (platformsData[platformId].data['winddir'] - 45 + 180) + 'deg)' }">&#xf124;</span>
              </span>
            </div>
            <!-- Currents -->
            <div v-if="Object.keys(platformsData[platformId].data).includes('currentspd')">
              <span>
                <strong>Current: </strong>
                {{ platformsData[platformId].data['currentspd'].toFixed(1) }} m/s,
                {{ bearing2compassRose(platformsData[platformId].data['currentdir']) }}
                <span class="fa"
                  :style="{ transform: 'rotate(' + (platformsData[platformId].data['currentdir'] - 45) + 'deg)' }">&#xf124;</span>
              </span>
            </div>
            <!-- Waves -->
            <div v-if="Object.keys(platformsData[platformId].data).includes('wvht')">
              <span>
                <strong>Waves: </strong>
                {{ platformsData[platformId].data['wvht'].toFixed(1) }} m,
                <!-- {{ platformsData[platformId].data['Tm02(s)'].toFixed(1) }} s, -->
                <!-- {{ bearing2compassRose(platformsData[platformId].data['MeanDir(º)']) }} -->
                <!-- <span class="fa"
                  :style="{ transform: 'rotate(' + (platformsData[platformId].data['MeanDir(º)'] - 45 + 180) + 'deg)' }">&#xf124;</span> -->
              </span>
            </div>

            <!-- Extra data -->
            <Transition>
              <div v-if="platforms[platformId].showAllData">
                <!-- Sea water temperature -->
                <div v-if="Object.keys(platformsData[platformId].data).includes('sst')">
                  <span>
                    <strong>Water temperature: </strong>
                    {{ platformsData[platformId].data['sst'].toFixed(1) }} ºC
                  </span>
                </div>
                <!-- Sea water salinity -->
                <div v-if="Object.keys(platformsData[platformId].data).includes('sss')">
                  <span>
                    <strong>Sea water salinity: </strong>
                    {{ platformsData[platformId].data['sss'].toFixed(1) }} psu
                  </span>
                </div>


                <!-- Air temperature -->
                <div v-if="Object.keys(platformsData[platformId].data).includes('atmp')">
                  <span>
                    <strong>Air temperature: </strong>
                    {{ platformsData[platformId].data['atmp'].toFixed(1) }} ºC
                  </span>
                </div>
                <!-- Relative humidity -->
                <div v-if="Object.keys(platformsData[platformId].data).includes('hur')">
                  <span>
                    <strong>Humidity: </strong>
                    {{ platformsData[platformId].data['hur'].toFixed(1) }} %
                  </span>
                </div>
                <!-- Atmospheric pressure -->
                <div v-if="Object.keys(platformsData[platformId].data).includes('slp')">
                  <span>
                    <strong>Atms. pressure: </strong>
                    {{ platformsData[platformId].data['slp'].toFixed(1) }} hPa
                  </span>
                </div>


              </div>
            </Transition>

            <!-- Button showAllData ON OFF-->
            <div class="button-container">
              <button v-show="!platforms[platformId].showAllData" class="more-data-button"
                @click="platforms[platformId].showAllData = true">+</button>
              <button v-show="platforms[platformId].showAllData" class="more-data-button"
                @click="platforms[platformId].showAllData = false">-</button>
            </div>

          </div>

        </div>
      </Transition>


      <!-- Platform icon -->
      <img class="icon-str icon-medium icon-img panel-icon-right"
        @click="ERDDAPIconClicked(platformId)" src="/HFRadar/Assets/Images/buoy.svg">


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



// This component requires a proxy server to avoid CORS policies from the ERDDAP server. The proxy server looks like this:
/*
const express = require('express');
const request = require('request');
const app = express();
// Middleware to add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
// REST API
app.get('/proxy', (req, res) => {
  console.log("Request received");
  const url = req.query.url;
  // If no URL is provided, return an error
  if (!url) {
    return res.status(400).send('Error: Missing "url" query parameter.');
  }
  //url = 'https://osmc.noaa.gov/erddap/tabledap/OSMC_flattened.jsonlKVP?platform_type,platform_code,platform_id,longitude,latitude,time,observation_depth,sst,atmp,precip,sss,ztmp,zsal,slp,windspd,winddir,wvht,waterlevel,clouds,dewpoint,uo,vo,wo,rainfall_rate,hur,sea_water_elec_conductivity,rlds,rsds,waterlevel_met_res,waterlevel_wrt_lcd,water_col_ht,wind_to_direction&time>=2024-08-21T17:22:15.676Z&time<=2024-08-22T17:22:15.676Z&longitude>=0&longitude<=5&latitude>=39.5&latitude<=44'
  request(url)
    .on('error', (err) => {
      console.error('Error with the request:', err);
      res.status(500).send('Error: Unable to retrieve data.');
    })
    .pipe(res);
});
app.listen(3000, () => {
  console.log('Proxy server running on port 3000');
});


// npm init -y
// npm install express request
// node server.js
*/




export default {
  name: 'overlay-erddap-data',
  created() { },
  mounted() {
    // Get ERDDAP sites
    //this.loadERDDAPAPI();


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
        this.loadERDDAPAPI();
      }
    });
    // External observations visible
    window.eventBus.on("WidgetMapOptions_ExternalObsVisibilityChanged", state => {
      this.isExternalObsVisible = state;
    });
  },
  data() {
    return {
      isExternalObsVisible: false,
      isAdvancedInterfaceOnOff: false,
      isTooFar: false,
      queryPlatformsURL: "https://osmc.noaa.gov/erddap/tabledap/OSMC_flattened.jsonlKVP" +
        "?{parameters}" +
        "&time>={startDate}&time<={endDate}&longitude>={longMin}&longitude<={longMax}&latitude>={latMin}&latitude<={latMax}",
      bbox: [0, 5, 39.5, 44], // long, lat
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
    }
  },
  methods: {
    // USER ACTIONS
    ERDDAPIconClicked: function (platformId) {
      this.platformsData[platformId].showInfo = !this.platformsData[platformId].showInfo;
    },
    // INTERNAL
    // Use API to get observed variables and platforms
    loadERDDAPAPI: async function () {
      // Using ERDDAP API
      let platforms = this.platforms;

      var startDate = new Date();
      var endDate = new Date();
      startDate.setUTCDate(startDate.getUTCDate() - 1);

      // Prepare url
      let url = this.queryPlatformsURL.replace('{parameters}', this.parameters.join());
      url = url.replace('{startDate}', startDate.toISOString());
      url = url.replace('{endDate}', endDate.toISOString());
      url = url.replace('{longMin}', this.bbox[0]).replace('{longMax}', this.bbox[1]).replace('{latMin}', this.bbox[2]).replace('{latMax}', this.bbox[3]);

      console.log(url);
      const encodedUrl = encodeURIComponent(url);
      let proxyURL = "http://localhost:3000/proxy?url=" + encodedUrl;

      await fetch(proxyURL).then(r => r.text()).then(res => {
        var rows = res.split('\n');
        rows.pop(); // Delete empty

        // Get number of different platforms
        rows.forEach(row => {
          var jsRow = JSON.parse(row);
          // Define platform
          if (platforms[jsRow.platform_id] == undefined) {
            platforms[jsRow.platform_id] = {
              "type": jsRow.platform_type,
              "location": [jsRow.longitude, jsRow.latitude],
              "id": jsRow.platform_id,
              "data": {},
            }
          }
          // Fill the platform with data on given timestamps
          let platform = platforms[jsRow.platform_id];
          // Define tmst object
          if (platform.data[jsRow.time] != undefined) {
            debugger;
          }
          platform.data[jsRow.time] = {};

          // Add parameters to data
          for (let i = 3; i < this.parameters.length; i++) {
            if (jsRow[this.parameters[i]] != null) {
              platform.data[jsRow.time][this.parameters[i]] = jsRow[this.parameters[i]];
            }
          }
          // Check if it is a drifter (lat long changes)
          // When platform is moving, it is a drifter. // TODO: mooring buoys also move (borneo), is it reflected here? does it matter?
          if (jsRow.longitude != platform.longitude || jsRow.latitude != platform.latitude) {
            platform.isDrifter = true;
          }
        });
        console.log(platforms);
        // Once all rows have been iterated, define location for non-drifters
      });



      // Iterate platforms to create vue objects and map layers
      Object.keys(this.platforms).forEach(platformKey => {
        let platform = this.platforms[platformKey];

        // Create vue object
        if (this.platformsData[platformKey] == undefined) {
          this.platformsData[platformKey] = { "hasData": false, "showInfo": false, "isLoading": false };
          this.platforms[platformKey].coord3857 = ol.proj.fromLonLat([this.platforms[platformKey].location[0], this.platforms[platformKey].location[1]]);
        }

        // Add to map
        if (true) {//(!platform.isDrifter){
          // Add platform to map
          let addPlatformToMap = (count) => {
            this.$nextTick(() => {
              if (this.$refs[platformKey] == undefined) {
                if (count > 2){
                  debugger;
                  console.error("Could not find html element with vue ref")
                  return
                }
                addPlatformToMap(count++);
                return;
              }
              // Get map
              if (this.map == undefined) {
                this.map = this.$parent.map;
              }
              // Relate overlay with map
              // Platform info
              const platformInfo = new ol.Overlay({
                position: this.platforms[platformKey].coord3857,
                positioning: 'center-right',//Object.keys(this.platforms).length % 2 == 1 ? 'center-right' : 'center-left',
                element: this.$refs[platformKey],
                stopEvent: false,
              });
              platformInfo.element.style['pointerEvents'] = 'none';// Remove pointer events, container takes more space than necessary and blocks visible icons
              this.map.addOverlay(platformInfo);
              console.log("Added ERDDAP platform");
              this.selectedDateChanged(window.GUIManager.currentTmst, true);
            })
          }
          addPlatformToMap(0);
        }
      });


    },



    selectedDateChanged: function (tmst, doNotRegisterRequest) {
      if (tmst == undefined || this.once == undefined)
        return;

      let platforms = this.platforms;
      // Hide all data from platforms
      Object.keys(platforms).forEach(platformId => {
        this.platformsData[platformId].hasData = false;
      });

      // Add one day before and after of the tmst
      let movingDate = new Date(tmst);
      let sDate = new Date(movingDate.getTime() - 24 * 60 * 60 * 1000);
      let eDate = new Date(movingDate.getTime() + 24 * 60 * 60 * 1000);

      debugger;
      // Register requested timestamps. This should only happen when all the datastreams and platforms are loaded
      if (doNotRegisterRequest == undefined || doNotRegisterRequest == false) {
        // Check if the tmst was requested
        if (this.requestStatus[tmst] != undefined) {
          //console.log("ERDDAP data was already requested for timestamp " + tmst);
          Object.keys(platforms).forEach(platformId => {
            this.updateContent(platformId, tmst);
          });
          return;
        }


        // Check if any part of the time period was already loaded
        // End date
        movingDate = new Date(tmst);
        for (let i = 0; i < 24; i++) {
          movingDate.setHours(movingDate.getHours() + 1);
          if (this.requestStatus[movingDate.toISOString()] != undefined) {
            eDate.setTime(movingDate.getTime()); // Set new ending date
            i = 24; // Exit for
          }
        }
        // Start date
        movingDate = new Date(tmst);
        for (let i = 0; i < 24; i++) {
          movingDate.setHours(movingDate.getHours() - 1);
          if (this.requestStatus[movingDate.toISOString()] != undefined) {
            sDate.setTime(movingDate.getTime()); // Set new starting date
            i = 24; // Exit for
          }
        }


        // TODO: 
        // The problem is that when entering a new date, half of the data requested will be
        // already loaded. Playing with if's might be worth it (if forward date was requested
        // it means that the following forward dates were resquested too. same with before date, as they
        // belong to a 48h window request).

        // Register requests
        // Platforms must be loaded
        // WARN: could it be that this is exectued when only one platform exists?
        if (Object.keys(platforms).length != 0) {
          movingDate = new Date(sDate.getTime());
          //console.log("Registering timestamps ERDDAP")
          for (let i = 0; i < 24 * 2; i++) {
            this.requestStatus[movingDate.toISOString()] = 1;
            movingDate.setHours(movingDate.getHours() + 1);
          }
        }

      }






      let url = this.url;
      // Iterate data streams to fetch data
      for (let i = 0; i < Object.keys(platforms).length; i++) {
        let platform = platforms[Object.keys(platforms)[i]];
        this.platformsData[platform.id].isLoading = true;
        //console.log("LOADING...");

        // Loading keepup
        let requested = 0;
        let loaded = 0;
        // Iterate parameters (temp, wind, etc...)
        for (let j = 0; j < Object.keys(platform.props).length; j++) {
          let param = platform.props[Object.keys(platform.props)[j]];


          // Iterate datastreams
          for (let k = 0; k < param.datastreams.length; k++) {
            let datastream = param.datastreams[k];

            // Check latest data available
            if (new Date(datastream.latestTmst) > sDate) {
              // Fetch data
              let streamURL = url.replace('{{datastream}}', datastream.id).replace('{{sDate}}', sDate.toISOString()).replace('{{eDate}}', eDate.toISOString());

              // Keep track of requested URLs
              // During loading platforms and datastreams, once a datastream is loaded
              // it is automatically requestd. This keeps track of the requested urls,
              // as during loading they could be requested everytime a new datastream
              // is loaded
              if (this.requestedURLs == undefined) {
                this.requestedURLs = [];
              }
              // URL was not requested
              if (!this.requestedURLs.includes(streamURL)) {
                this.requestedURLs.push(streamURL)
                //console.log(datastream.id + ", " + param.name + ", "+ platform.id.substring(5));
                requested++;

                fetch(streamURL).then(res => res.json()).then(r => {
                  //console.log("Storing " + param.name);
                  this.parseAPIResult(platform, param, datastream, r.value)
                  this.updateContent(platform.id, window.GUIManager.currentTmst); // It can happen that the user changed dates and that the current timestamp is not the same as requested. Therefore use GUI.currentTmst instead of tmst
                  loaded++;
                  if (loaded == requested) {
                    this.platformsData[platform.id].isLoading = false;
                    //console.log("LOADED");
                  }
                });
              }
              // URL was already requested, try updating content
              else {
                this.updateContent(platform.id, tmst);
              }

            }
          }


        }
        // If nothing was requested
        if (requested == 0) {
          this.platformsData[platform.id].isLoading = false;
          //console.log("LOADED (no data to load)")
        }
      }

      return;

    },

    updateContent: function (platformId, tmst) {

      // No data in that timestamp
      if (this.platforms[platformId].data[tmst] == undefined) {
        this.platformsData[platformId].hasData = false;
        return;
      }
      // Has data
      this.platformsData[platformId].hasData = true;
      // Empty observed properties
      this.platformsData[platformId].data = {};

      // Iterate props and assign to platformsData (vue uses this object)
      Object.keys(this.platforms[platformId].data[tmst]).forEach(key => {
        this.platformsData[platformId].data[key] = this.platforms[platformId].data[tmst][key];
      });
      // console.log(this.platformsData[platformId].data)
      // console.log(this.platforms[platformId].data[tmst]);
      //console.log(this.platforms);
    },


    parseAPIResult(platform, param, datastream, data) {
      for (let i = 0; i < data.length; i++) {
        let tmst = data[i].resultTime;
        if (platform.data[tmst] == undefined)
          platform.data[tmst] = {};

        param.units = datastream.units;
        if (platform.data[tmst][param.name] != undefined) {
          //console.warn("Overwritting data");

        }
        platform.data[tmst][param.name] = data[i].result;
      }
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