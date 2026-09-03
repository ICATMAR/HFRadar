<template>

  <div id="overlay-somo-buoy-data" ref="containerbuoyInfo">
  <!-- Container. Only one buoy, so no v-for: the overlay is bound to this
       element directly (see mounted) -->
    <div :id="buoyName" ref="buoyContainer" class="buoyContainer">
      <!-- Buoy icon -->
      <div style="position: relative; display: flex">
        <img class="icon-str icon-medium icon-img"
        @click="buoyIconClicked()"
        src="/HFRadar/Assets/Images/buoy.svg">
        <!-- Indicator of ICATMAR -->
        <div class="icon-marker-icatmar"></div>
      </div>


      <!-- Buoy panel -->
      <Transition>
      <div class="wavepanel" v-if="buoyData.showInfo"
        :class="[!isTooFar ? 'showOverlayMap' : 'hideOverlayMap']">
        <!-- Site -->
        <div class="buoyTitle">
          <div v-show="buoyData.isLoading" class="lds-ring">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <span><strong>{{ buoyName }}'s buoy</strong></span>
          <a href="https://icatmar.github.io/boiasomorrostro/" target="_blank" rel="noopener noreferrer" class="icon-str"><span class="fa">&#xf08e;</span></a>
        </div>

        <!-- Buoy data -->
        <div v-if="buoyData.hasData">
          <!-- Wind -->
          <div v-if="Object.keys(buoyData.data).includes('WSPD')">
            <span>
              <strong>Wind: </strong>
              {{(buoyData.data['WSPD']).toFixed(1)}} m/s,
              {{ bearing2compassRose(buoyData.data['WDIR']) }}
              <span class="fa" :style="{transform: 'rotate('+ (buoyData.data['WDIR']-45+180) +'deg)' }">&#xf124;</span>
            </span>
          </div>
          <!-- Water temperature (SBE37, at 0.5 m) -->
          <div v-if="Object.keys(buoyData.data).includes('TEMP')">
            <span>
              <strong>Water temperature (0.5m): </strong>
              {{buoyData.data['TEMP'].toFixed(1)}} ºC
            </span>
          </div>

          <!-- Extra data -->
          <Transition>
          <div v-show="buoy.showAllData">

            <!-- METEO -->
            <!-- Relative wind (measured on the moving buoy, before the correction) -->
            <div v-if="Object.keys(buoyData.data).includes('WRSP')">
              <span>
                <strong>Relative wind: </strong>
                {{(buoyData.data['WRSP']).toFixed(1)}} m/s,
                {{ bearing2compassRose(buoyData.data['WRDR']) }}
                <span class="fa" :style="{transform: 'rotate('+ (buoyData.data['WRDR']-45+180) +'deg)' }">&#xf124;</span>
              </span>
            </div>
            <!-- Air temperature -->
            <div v-if="Object.keys(buoyData.data).includes('DRYT')">
              <span>
                <strong>Air temperature: </strong>
                   {{ buoyData.data['DRYT'].toFixed(1) }} ºC
              </span>
            </div>
            <!-- Dew point temperature -->
            <div v-if="Object.keys(buoyData.data).includes('DEWT')">
              <span>
                <strong>Dew point: </strong>
                {{ buoyData.data['DEWT'].toFixed(1) }} ºC
              </span>
            </div>
            <!-- Wet bulb temperature -->
            <div v-if="Object.keys(buoyData.data).includes('WETT')">
              <span>
                <strong>Wet bulb temperature: </strong>
                {{ buoyData.data['WETT'].toFixed(1) }} ºC
              </span>
            </div>
            <!-- Air pressure -->
            <div v-if="Object.keys(buoyData.data).includes('ATMS')">
              <span>
                <strong>Air pressure: </strong>
                {{buoyData.data['ATMS'].toFixed(1)}} mb
              </span>
            </div>
            <!-- Relative humidity -->
            <div v-if="Object.keys(buoyData.data).includes('RELH')">
              <span>
                <strong>Relative humidity: </strong>
                {{buoyData.data['RELH'].toFixed(0)}} %
              </span>
            </div>
            <!-- Air density -->
            <div v-if="Object.keys(buoyData.data).includes('ADNS')">
              <span>
                <strong>Air density: </strong>
                {{buoyData.data['ADNS'].toFixed(2)}} kg/m³
              </span>
            </div>

            <!-- CTD -->
            <!-- Salinity -->
            <div v-if="Object.keys(buoyData.data).includes('PSAL')">
              <span>
                <strong>Salinity: </strong>
                {{buoyData.data['PSAL'].toFixed(1)}} psu
              </span>
            </div>
            <!-- Dissolved oxygen -->
            <div v-if="Object.keys(buoyData.data).includes('DOX1')">
              <span>
                <strong>Dissolved oxygen: </strong>
                {{buoyData.data['DOX1'].toFixed(2)}} ml/L
              </span>
            </div>
            <!-- Sea pressure -->
            <div v-if="Object.keys(buoyData.data).includes('PRES')">
              <span>
                <strong>Sea pressure: </strong>
                {{buoyData.data['PRES'].toFixed(2)}} dbar
              </span>
            </div>
            <!-- Electrical conductivity -->
            <div v-if="Object.keys(buoyData.data).includes('CNDC')">
              <span>
                <strong>Electrical conductivity: </strong>
                {{buoyData.data['CNDC'].toFixed(2)}} S/m
              </span>
            </div>

          </div>
          </Transition>

          <!-- Button showAllData ON OFF-->
          <div class="button-container">
            <button v-show="!buoy.showAllData" class="more-data-button" @click="buoy.showAllData = true">+</button>
            <button v-show="buoy.showAllData" class="more-data-button" @click="buoy.showAllData = false">-</button>
          </div>

        </div>

        <!-- Latest timestamp -->
        <div v-else-if="buoy.latestTmst != undefined">
          <span><strong>Latest data: </strong>{{ timeAgo(buoy.latestTmst) }}</span>
        </div>
        <!-- Nothing could be loaded -->
        <div v-else>
          <span>No data available</span>
        </div>

      </div>
      </Transition>

    </div>
  </div>

</template>


<script>

// Somorrostro buoy, in front of Barcelona. Same panel as OverlayMSMBuoys, but
// for a single buoy, and the data does not come from the MSM API: it is read
// from the logger files the ICATMAR data repository publishes, which is what
// the buoy's own web application falls back on (see boiasomorrostro/wind/wind.js).

// Buoy location, same values as boiasomorrostro's main.js
const BUOY_NAME = 'Somorrostro';
const LATITUDE = 41.375694;
const LONGITUDE = 2.216194;

// GitHub Pages is not on the proxy's allowlist, but it serves the files with
// access-control-allow-origin: *, so they are fetched directly.
const REPO_URL = 'https://icatmar.github.io/data/observational/insitu/Boies/SOMO/';

const MINUTE = 60 * 1000;
const REFRESH_LIMIT = 15 * MINUTE;  // the buoy reports every 15 min
// The logger writes 1000 m/s for a failed wind reading and the repository
// serves it raw. On those rows the direction columns still hold
// plausible-looking numbers, so dropping the whole wind reading on its speed is
// what keeps a bogus bearing off the panel too. The strongest real reading in
// the record is 27 m/s, so the exact threshold hardly matters.
const MAX_WIND_SPEED = 500;
const WIND_PARAMS = ['WSPD', 'WDIR', 'WRSP', 'WRDR', 'WCDR'];
// Averaging the 15-minute samples into the hour has to go around the circle for
// these: 350º and 10º average to 0º, not to 180º.
const DIRECTION_PARAMS = ['WDIR', 'WRDR', 'WCDR'];

// The two logger files this overlay reads, and the code each of their columns
// is stored under - the same codes the ERDDAP datasets built from these files
// publish. The SAMI file (raw encoded frames, pH only exists once ERDDAP has
// run its regression), the ADCP's Doppler.dat and the Status/System files are
// left out.
const SENSORS = {
  METEO: {
    file: 'BoiaSomorrostro_cr1000xs_Meteo.dat',
    columns: {
      'WindDir_True': 'WDIR',   // WDIR is "wind from direction (true north)"
      'Corr_WindS': 'WSPD',
      'Corr_WindDir': 'WCDR',   // corrected, but magnetic - not the same as WDIR
      'Rel_WindDir': 'WRDR',
      'Rel_WS': 'WRSP',
      'BP': 'ATMS',
      'RH': 'RELH',
      'AirTemp': 'DRYT',
      'DP': 'DEWT',
      'AD': 'ADNS',
      'WBT': 'WETT',
    },
  },
  CTD: {
    // SBE37, at 0.5 m
    file: 'BoiaSomorrostro_cr1000xs_SBE37_SMPO.dat',
    columns: {
      'SBE37Temp': 'TEMP',
      'SBE37Sal': 'PSAL',
      'SBE37OXY': 'DOX1',
      'SBE37Pres': 'PRES',
      'SBE37Cond': 'CNDC',
    },
  },
};

// The files timestamp their rows with the buoy's own wall clock: at the time of
// writing a file's HTTP Last-Modified is 08:10 UTC while its newest row reads
// 09:45, so the rows are Europe/Madrid (UTC+2 in summer, +1 in winter), not UTC.
// Taking them at face value puts every measurement an hour or two in the future,
// so they are converted to the real instant here, at the only place timestamps
// enter. Drop this if the logger is ever changed to write real UTC.
const BUOY_TIMEZONE = 'Europe/Madrid';

function parseBuoyDate(wallClock) {
  const asIfUTC = new Date(wallClock + 'Z');
  const offset = new Date(asIfUTC.toLocaleString('en-US', { timeZone: 'UTC' }))
    - new Date(asIfUTC.toLocaleString('en-US', { timeZone: BUOY_TIMEZONE }));
  return new Date(asIfUTC.getTime() + offset);
}


export default {
  name: 'overlay-somo-buoy',
  created(){
    // Per sensor: { entries, loadedAt } - the whole parsed logger file. Each
    // file holds months of data in one download, so every window is served
    // from it (see loadRepoFile).
    this.repoFiles = {};
  },
  mounted() {
    // Unlike the MSM buoys there is no catalogue to ask: this is one buoy at a
    // known position, so it is placed straight away.
    this.buoy.coord3857 = ol.proj.fromLonLat([this.buoy.lon, this.buoy.lat]);
    console.log("Added SOMO buoy: " + this.buoyName);

    // First initialization
    // Get map
    if (this.map == undefined) {
      this.map = this.$parent.map;
    }
    // Relate overlay with map
    this.$nextTick(() => {
      // Buoy info
      const buoyInfo = new ol.Overlay({
        position: this.buoy.coord3857,
        positioning: 'center-left',
        element: this.$refs.buoyContainer,
        stopEvent: false,
      });
      // Get map
      if (this.map == undefined) {
        this.map = this.$parent.map;
      }
      this.map.addOverlay(buoyInfo);

      // Trigger interface update
      this.selectedDateChanged(window.GUIManager.currentTmst);
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
      isTooFar: false,
      // https://icatmar.github.io/boiasomorrostro/
      buoyName: BUOY_NAME,
      buoy: {
        lon: LONGITUDE,
        lat: LATITUDE,
        latestTmst: undefined,
        showAllData: false,
        data: {}, // tmst1: {WSPD: value, TEMP: value...}, tmst2: {...}
        dataArray: {}, // tmst1: {WSPD: [value1, value2...], TEMP: [value1, value2...], ...}, tmst2: {...}
      },
      // What the panel shows for the currently selected timestamp
      buoyData: { hasData: false, showInfo: false },
      // Every code the panel knows about, across the two files (see SENSORS)
      params: ['WSPD', 'WDIR', 'WRSP', 'WRDR',
        'DRYT', 'DEWT', 'WETT',
        'ATMS', 'RELH', 'ADNS',
        'TEMP', 'PSAL', 'DOX1', 'PRES', 'CNDC'],
      url: REPO_URL + '{{file}}?time>={{startDate}}&time<={{endDate}}',
      requests: {},
    }
  },
  methods: {
    // USER ACTIONS
    buoyIconClicked: function(){
      this.buoyData.showInfo = !this.buoyData.showInfo;
    },
    // INTERNAL
    selectedDateChanged: function(tmst){
      console.log("Timestamp for buoy SOMO data: " + tmst);
      // Hide the data currently shown
      this.buoyData.hasData = false;

      // Add one day before and after of the tmst
      let currentDate = new Date(tmst);
      let sDate = new Date(currentDate.getTime() - 24 * 60 * 60  * 1000);
      let eDate = new Date(currentDate.getTime() + 24 * 60 * 60  * 1000);
      // Each sensor is its own file, and its own request
      Object.keys(SENSORS).forEach(sensorId => {
        // Check if the buoy data has this sensor's readings for the timestamp
        if (!this.hasSensorData(sensorId, tmst)){
          // Load data (yesterday, today, tomorrow)
          // Generate url. The file itself is downloaded whole, so this is the
          // window's key in this.requests rather than a query the server sees.
          let url = this.buildURL(sensorId, sDate, eDate);

          console.log(url);
          // Request data for the first time
          if (this.requests[url] == undefined) {
            this.requests[url] = {
              promise: this.getData(url, sensorId, sDate, eDate).then(r => {
                this.buoyData.isLoading = false;
                this.requests[url].response = r;
                this.requests[url].lastResolved = Date.now();
                return r;
              }),
              response: undefined,
              lastResolved: undefined,
            };
          }
          // Resolve promise and update content
          this.requests[url].promise.then(r => {
            this.parseAPIResult(r);
            // Update buoy content once loaded
            this.updateContent(tmst);
          });
        }
        // Data already exists
        else {
          // Update buoy content
          this.updateContent(tmst);
        }
      });
    },

    // Whether this sensor has already answered for a timestamp. A sensor that
    // simply has nothing for that hour asks again, but the request cache
    // answers it without going back to the network (see getData).
    hasSensorData: function(sensorId, tmst){
      let data = this.buoy.data[tmst];
      if (data == undefined)
        return false;
      return this.codesOf(sensorId).some(code => data[code] != undefined);
    },

    // The codes a sensor's columns are stored under (see SENSORS)
    codesOf: function(sensorId){
      return Object.values(SENSORS[sensorId].columns);
    },

    // Request url for one sensor over a time range
    buildURL: function(sensorId, sDate, eDate){
      let url = this.url;
      // File
      url = url.replace('{{file}}', SENSORS[sensorId].file);
      // Start date
      url = url.replace('{{startDate}}', sDate.toISOString().substring(0, 19) + 'Z');
      // End date
      url = url.replace('{{endDate}}', eDate.toISOString().substring(0, 19) + 'Z');
      return url;
    },

    // Keep track of requests as the files are large
    async getData(url, sensorId, sDate, eDate) {
      this.buoyData.isLoading = true;
      // Already resolved
      if (this.requests[url] && this.requests[url].lastResolved != undefined){
        if (this.requests[url].lastResolved > Date.now() - 60 * 60 * 1000) {
          return new Promise((resolve) => resolve(this.requests[url].response));
        }
        // Request again if it was resolved more than X time ago
        return this.fetchRepoData(sensorId, sDate, eDate);
      }
      // Fetch
      return this.fetchRepoData(sensorId, sDate, eDate);
    },

    // One sensor's readings inside the window, in the shape the panel parses:
    // { data: { tmst: { METEO: {WSPD: value, ...} } } }
    async fetchRepoData(sensorId, sDate, eDate) {
      const entries = await this.loadRepoFile(sensorId).catch(e => {
        console.error("Could not load " + SENSORS[sensorId].file, e);
        return {};
      });
      // Only the requested window, so a day of scrolling does not carry the
      // whole file into this.buoy.data
      const data = {};
      Object.keys(entries).forEach(tmst => {
        const date = new Date(tmst);
        if (date >= sDate && date <= eDate)
          data[tmst] = entries[tmst];
      });
      return { data: data };
    },

    // The whole parsed logger file, downloaded again only once what we hold has
    // gone stale - the buoy reports every 15 min, so most windows are served
    // without touching the network.
    async loadRepoFile(sensorId) {
      const cached = this.repoFiles[sensorId];
      if (cached != undefined && Date.now() - cached.loadedAt < REFRESH_LIMIT)
        return cached.entries;

      const res = await fetch(REPO_URL + SENSORS[sensorId].file, { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      const entries = this.parseRepoFile(sensorId, await res.text());
      this.repoFiles[sensorId] = { entries: entries, loadedAt: Date.now() };
      return entries;
    },

    // TOA5 logger file: line 1 = file metadata, line 2 = quoted column names,
    // lines 3-4 = units and aggregation, then one row per timestamp (buoy wall
    // clock, see parseBuoyDate).
    parseRepoFile(sensorId, text) {
      const sensor = SENSORS[sensorId];
      const lines = text.trim().split(/\r?\n/); // the logger writes CRLF
      const columns = lines[1].split(',').map(name => name.replace(/"/g, ''));
      const iTime = columns.indexOf('TIMESTAMP');
      if (iTime < 0) throw new Error('Unexpected columns in ' + sensor.file);

      const entries = {};
      lines.slice(4).forEach(line => {
        const cells = line.split(',');
        const values = {};
        columns.forEach((name, i) => {
          const code = sensor.columns[name];
          if (code == undefined) return;
          // Values the logger could not read come as a quoted "NAN"
          const value = parseFloat(cells[i]);
          if (isNaN(value)) return;
          values[code] = value;
        });
        this.dropBogusWind(values);
        const date = parseBuoyDate(cells[iTime].replace(/"/g, '').replace(' ', 'T'));
        entries[date.toISOString()] = { [sensorId]: values };
      });
      return entries;
    },

    // A failed wind reading comes out of the logger as 1000 m/s, with
    // plausible-looking numbers still in the direction columns - the whole wind
    // reading goes, so no bogus bearing reaches the panel (see MAX_WIND_SPEED).
    dropBogusWind(values) {
      if (values['WSPD'] == undefined || values['WSPD'] <= MAX_WIND_SPEED) return;
      WIND_PARAMS.forEach(param => delete values[param]);
    },

    updateContent: function(tmst){
      if (this.buoy.data[tmst] == undefined){
        this.buoyData.hasData = false;
        return;
      }


      this.buoyData.hasData = true;
      this.buoyData.data = {};

      Object.keys(this.buoy.data[tmst]).forEach(key => {
        this.buoyData.data[key] = this.buoy.data[tmst][key];
      });
      //console.log(this.buoyData.data)
    },


    parseAPIResult(response){
      let responseData = response.data;
      if (responseData == undefined || Object.keys(responseData).length == 0) {
        console.log("No data for " + this.buoyName);
        return;
      }

      Object.keys(responseData).forEach(resTimestamp => {
        let dd = responseData[resTimestamp];
        let date = new Date(resTimestamp);
        // Hourly dataset (the buoy reports every 15 min)
        if (date.getMinutes() >= 30)
          date.setHours(date.getHours() + 1);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);

        let tmst = date.toISOString();


        // Look for parameters inside the data array
        Object.keys(dd).forEach(sensor => {
          let sensorData = dd[sensor]; // {WSPD: '4.78', WDIR: '197', ...}
          Object.keys(sensorData).forEach(param => {
            // Contemplated parameter
            if (this.params.includes(param)) {
              // Add to buoy data array
              if (this.buoy.dataArray[tmst] == undefined){
                this.buoy.dataArray[tmst] = {};
              }
              // If parameter already exists, add to array for averaging later, if not create array
              let value = parseFloat(sensorData[param]);
              if (this.buoy.dataArray[tmst][param] != undefined) {
                this.buoy.dataArray[tmst][param].push(value);
              } else {
                this.buoy.dataArray[tmst][param] = [value];
              }
            }
          });
        });
      })
      // Average values
      Object.keys(this.buoy.dataArray).forEach(tmst => {
        Object.keys(this.buoy.dataArray[tmst]).forEach(param => {
          let values = this.buoy.dataArray[tmst][param];
          let avg;
          // Directions have to be averaged around the circle
          if (DIRECTION_PARAMS.includes(param)) {
            let sin = values.reduce((sum, deg) => sum + Math.sin(deg * Math.PI / 180), 0);
            let cos = values.reduce((sum, deg) => sum + Math.cos(deg * Math.PI / 180), 0);
            avg = (Math.atan2(sin, cos) * 180 / Math.PI + 360) % 360;
          } else {
            let sum = values.reduce((a, b) => a + b, 0);
            avg = sum / values.length;
          }
          if (this.buoy.data[tmst] == undefined){
            this.buoy.data[tmst] = {};
          }
          this.buoy.data[tmst][param] = avg;
        });
      });

      this.updateLatestTmst();
    },

    // Newest measurement loaded so far. Only ever moves forward - scrolling
    // back in time loads an old window, it does not make the buoy's latest
    // data older.
    updateLatestTmst(){
      let tmsts = Object.keys(this.buoy.data);
      if (tmsts.length == 0)
        return;
      let newest = new Date(Math.max(...tmsts.map(t => new Date(t))));
      let latest = this.buoy.latestTmst;
      if (latest == undefined || newest > new Date(latest))
        this.buoy.latestTmst = newest.toISOString();
    },

    // Bearing to direction
    bearing2compassRose(bearing){
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
    },
    timeAgo() {
      const selectedDate = new Date(window.GUIManager.currentTmst).getTime();

      return (tmst) => {
        const diff = selectedDate - new Date(tmst).getTime();
        // Data is in the past
        if (diff > 0) {
          if (diff < 60 * 1000) {
            return "Just now";
          } else if (diff < 60 * 60 * 1000) {
            const minutes = Math.floor(diff / (60 * 1000));
            return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
          } else if (diff < 24 * 60 * 60 * 1000) {
            const hours = Math.floor(diff / (60 * 60 * 1000));
            return `${hours} hour${hours > 1 ? "s" : ""} ago`;
          } else {
            const days = Math.floor(diff / (24 * 60 * 60 * 1000));
            return `${days} day${days > 1 ? "s" : ""} ago`;
          }
        } else {
          const days = Math.floor(Math.abs(diff) / (24 * 60 * 60 * 1000));
          return `${days} day${days > 1 ? "s" : ""} ahead from current date`;
        }
      };
    },
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
