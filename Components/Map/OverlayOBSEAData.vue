<template>
  
  <div id="overlay-OBSEA-data" ref="containerOBSEAInfo">
  <!-- Container -->
    <!-- <div v-for="stationId in Object.keys(stationsData)" :id="stationId" :ref="stationId" class="OBSEAContainer" :class="[!isTooFar && isAdvancedInterfaceOnOff ? 'show' : 'hide']"> -->
    <div v-for="(stationId, index) in Object.keys(stationsData)" :id="stationId" :ref="stationId" class="OBSEAContainer" :class="[!isTooFar && isAdvancedInterfaceOnOff ? 'show' : 'hide']">

      <!-- Station icon -->
      <img v-if="index%2 == 1" class="icon-str icon-medium icon-img obsea-icon-left" @click="OBSEAIconClicked(stationId)" src="/HFRadar/Assets/Images/buoy.svg">


      <!-- Station panel -->
      <Transition>
      <div class="stationPanel" v-if="stationsData[stationId].showInfo">
        <!-- Site -->
        <div class="stationTitle">
          <div v-show="stationsData[stationId].isLoading" class="lds-ring"><div></div><div></div><div></div><div></div></div>
          <span><strong>OBSEA station</strong></span>
          <a href="https://obsea.es/" target="_blank" rel="noopener noreferrer" class="icon-str">i</a>
        </div>

        <!-- Station data -->
        <div v-if="stationsData[stationId].hasData">

          <!-- Wind -->
          <div v-if="Object.keys(stationsData[stationId].data).includes('WSPD')">
            <span>
              <strong>Wind: </strong>
              {{stationsData[stationId].data['WSPD'].toFixed(1)}} {{stations[stationId].props['WSPD'].units}}, 
              {{ bearing2compassRose(stationsData[stationId].data['WDIR']) }}
              <span class="fa" :style="{transform: 'rotate('+ (stationsData[stationId].data['WDIR']-45+180) +'deg)' }">&#xf124;</span>
            </span>
          </div>
          <!-- Currents -->
          <div v-if="Object.keys(stationsData[stationId].data).includes('CSPD')">
            <span>
              <strong>Current: </strong>
              {{stationsData[stationId].data['CSPD'].toFixed(1)}} {{stations[stationId].props['CSPD'].units}}, 
              {{ bearing2compassRose(stationsData[stationId].data['CSPD']) }}
              <span class="fa" :style="{transform: 'rotate('+ (stationsData[stationId].data['CSPD']-45) +'deg)' }">&#xf124;</span>
            </span>
          </div>
          <!-- Waves -->
          <div v-if="Object.keys(stationsData[stationId].data).includes('VHM0')">
            <span>
              <strong>Waves: </strong>
              {{stationsData[stationId].data['VHM0'].toFixed(1)}} {{stations[stationId].props['VHM0'].units}}, 
              {{stationsData[stationId].data['Tm02(s)'].toFixed(1)}} s, 
              {{ bearing2compassRose(stationsData[stationId].data['MeanDir(º)']) }}
              <span class="fa" :style="{transform: 'rotate('+ (stationsData[stationId].data['MeanDir(º)']-45+180) +'deg)' }">&#xf124;</span>
            </span>
          </div>
          
          <!-- Extra data -->
          <Transition>
          <div v-if="stations[stationId].showAllData">
            <!-- Sea water temperature -->
            <div v-if="Object.keys(stationsData[stationId].data).includes('TEMP')">
              <span>
                <strong>Water temperature: </strong>
                {{stationsData[stationId].data['TEMP'].toFixed(1)}} ºC
              </span>
            </div>
            <!-- Sea water salinity -->
            <div v-if="Object.keys(stationsData[stationId].data).includes('PSAL')">
              <span>
                <strong>Sea water salinity: </strong>
                {{stationsData[stationId].data['PSAL'].toFixed(1)}} psu
              </span>
            </div>


            <!-- Air temperature -->
            <div v-if="Object.keys(stationsData[stationId].data).includes('AIRT')">
              <span>
                <strong>Air temperature: </strong>
                {{stationsData[stationId].data['AIRT'].toFixed(1)}} ºC
              </span>
            </div>
            <!-- Relative humidity -->
            <div v-if="Object.keys(stationsData[stationId].data).includes('RELH')">
              <span>
                <strong>Humidity: </strong>
                {{stationsData[stationId].data['RELH'].toFixed(1)}} %
              </span>
            </div>
            <!-- Atmospheric pressure -->
            <div v-if="Object.keys(stationsData[stationId].data).includes('CAPH')">
              <span>
                <strong>Atms. pressure: </strong>
                {{stationsData[stationId].data['CAPH'].toFixed(1)}} {{stations[stationId].props['CAPH'].units}}
              </span>
            </div>

            <!-- Crude oil -->
            <div v-if="Object.keys(stationsData[stationId].data).includes('COIL')">
              <span>
                <strong>Crude oil in water: </strong>
                {{stationsData[stationId].data['COIL'].toFixed(1)}} {{stations[stationId].props['COIL'].units}}
              </span>
            </div>
            <!-- Refined fuels -->
            <div v-if="Object.keys(stationsData[stationId].data).includes('RFUL')">
              <span>
                <strong>Refined fuels in water: </strong>
                {{stationsData[stationId].data['RFUL'].toFixed(1)}} {{stations[stationId].props['RFUL'].units}}
              </span>
            </div>
            
            

          </div>
          </Transition>

          <!-- Button showAllData ON OFF-->
          <div class="button-container">
            <button v-show="!stations[stationId].showAllData" class="more-data-button" @click="stations[stationId].showAllData = true">+</button>
            <button v-show="stations[stationId].showAllData" class="more-data-button" @click="stations[stationId].showAllData = false">-</button>
          </div>
          
        </div>
        
      </div>
      </Transition>


      <!-- Station icon -->
      <img v-if="index%2 == 0" class="icon-str icon-medium icon-img obsea-icon-right" @click="OBSEAIconClicked(stationId)" src="/HFRadar/Assets/Images/buoy.svg">


    </div>
  </div>

</template>


<script>



export default {
  name: 'overlay-OBSEA-data',
  created(){},
  mounted() {
    // Get OBSEA sites
    //this.loadOBSEAAPI();


    // EVENTS
    // HFRadarLoaded
    window.eventBus.on('HFRadarDataLoaded', tmst => {
      if (tmst)
        this.selectedDateChanged(tmst);
    });
    // Selected date changed (slider moves or drag and drop files)
    window.eventBus.on('DataStreamsBar_SelectedDateChanged', (tmst) =>{
      this.selectedDateChanged(tmst);
    });
    // Advanced interface
    window.eventBus.on("AdvancedInterfaceOnOff", state => {
      this.isAdvancedInterfaceOnOff = state;
      // Get OBSEA sites and load data
      if (this.once == undefined && state == true){
        this.once = true;
        this.loadOBSEAAPI();
      }
    });
  },
  data () {
    return {
      isAdvancedInterfaceOnOff: false,
      isTooFar: false,
      stations: {},
      stationsData: {},
      hideStationId: '41.22342,1.73637',
      requestStatus: {}, // Stores requested timestamps
      // https://data.obsea.es/data-api/Datastreams(313)/Observations?$select=resultTime,result&$top=1000000&$filter=resultQuality/qc_flag%20eq%201%20and%20resultTime%20ge%202022-01-01T00:00:00.000Z%20and%20resultTime%20lt%202023-11-30T14:00:00.000Z&$orderBy=resultTime%20asc
      url: 'https://data.obsea.es/data-api/Datastreams({{datastream}})/Observations?$select=resultTime,result&$filter=resultQuality/qc_flag eq 1 and resultTime ge {{sDate}} and resultTime lt {{eDate}}&$orderBy=resultTime asc', 
    }
  },
  methods: {
    // USER ACTIONS
    OBSEAIconClicked: function(stationId){
      this.stationsData[stationId].showInfo = !this.stationsData[stationId].showInfo;
    },
    // INTERNAL
    // Use API to get observed variables and locations
    loadOBSEAAPI: async function(){
      // Using sensor things API
      // https://data.obsea.es/data-api/ObservedProperties
      // Get observed properties
      let observedProperties = {};
      let locations = {};
      await fetch('https://data.obsea.es/data-api/ObservedProperties').then(r => r.json()).then(res => {

        // Iterate observed properties
        for (let i = 0; i < res.value.length; i++){
          let prop = res.value[i];
          prop.datastreams = [];

          // Get the datastreams of each observed property (e.g. https://data.obsea.es/FROST-Server//v1.1/ObservedProperties(1)/Datastreams)
          fetch(prop["Datastreams@iot.navigationLink"]).then(r => r.json()).then(resDS => {
            // Iterate datastreams
            for (let j = 0; j < resDS.value.length; j++){
              let ds = resDS.value[j];
              // Skip if it is not a 30 min average
              // if (!ds.name.includes("30min_average"))
              //   continue;
              // Skip if no phenomenon time
              if (ds.phenomenonTime == undefined)
                continue;

              // Store property and datastream
              prop.datastreams.push(ds);
              // ?


              // Get location of the station
              fetch(ds["Thing@iot.navigationLink"] + '/Locations').then(r => r.json()).then(resLoc => {
                let loc = resLoc.value[0];
                if (resLoc.value.length > 1){
                  console.warn("More than one location for a station");
                  debugger;
                }

                let stationKey = loc.location.coordinates[0] + "," + loc.location.coordinates[1];
                // If it does not exist, create
                if (locations[stationKey] == undefined){
                  locations[stationKey] = {};
                }
                if (locations[stationKey][prop] != undefined){
                  console.warn("This OBSEA variable is collected twice in the same location? " + prop.name + " at " + loc.name + stationKey);
                }
                // In principle, no circularity
                locations[stationKey][prop.name] = prop;



                // Create vue data structure
                //this.updateStations(stationKey, prop, ds, loc);
                // Create station data object
                let stations = this.stations;
                if (stations[stationKey] == undefined) {
                  stations[stationKey] = {
                    id: stationKey,
                    props: {},
                    location: stationKey.split(","),
                    data: {}, // tmst1: {WDIR: value, WSP: value...}, tmst2: {}...
                  }
                  // Add station to map
                  let addStationToMap = ()=> {
                    this.$nextTick(()=> {
                      if (this.$refs[stationKey] == undefined){
                        addStationToMap();
                        return;
                      }
                      // Get map
                      if (this.map == undefined){
                        this.map = this.$parent.map;
                      }
                      // Relate overlay with map
                      // Station info
                      const stationInfo = new ol.Overlay({
                        position: this.stations[stationKey].coord3857,
                        positioning: Object.keys(this.stations).length%2 == 1 ? 'center-right' : 'center-left',
                        element: this.$refs[stationKey],
                        stopEvent: false,
                      });
                      this.map.addOverlay(stationInfo);
                      console.log("Added OBSEA station");
                      this.selectedDateChanged(window.GUIManager.currentTmst, true);
                    })
                  }
                  addStationToMap();
                }

                // Create props object
                let propObj;
                if (stations[stationKey].props[prop.name] == undefined){
                  propObj =  {
                    "description": prop.description,
                    "name": prop.name,
                    "units": '',
                    // Create datastreams array
                    "datastreams": [],
                  }
                } else {
                  propObj = stations[stationKey].props[prop.name];
                }
                

                // Create datastream object
                let dsObj = {
                  "id": ds["@iot.id"],
                  //"description": ds.description, 
                  "latestTmst": ds.phenomenonTime.split("/")[1],
                  "units": ds.unitOfMeasurement.symbol,
                  "sensorDepth": '',
                };
                // This fetch creates many requests
                // fetch("https://data.obsea.es/data-api/Datastreams("+ ds["@iot.id"] +")/Sensor").then(res => res.json()).then(jj => {
                //   dsObj.sensorDepth = jj.properties.deployment.coordinates.meters_depth;
                // });
                // ADCP currents
                if (ds.name.includes('CSPD')){
                  dsObj.depth = ds.properties["ADCP cell parameters"]["center depth"];
                }

                propObj.datastreams.push(dsObj);
                stations[stationKey].props[prop.name] = propObj;
                
                // Create vue object
                if (this.stationsData[stationKey] == undefined){
                  this.stationsData[stationKey] = {"hasData": false, "showInfo": true, "isLoading": false};
                  this.stations[stationKey].coord3857 = ol.proj.fromLonLat([this.stations[stationKey].location[1], this.stations[stationKey].location[0]]);
                }
                // Load data everytime a new datastream is received
                this.selectedDateChanged(window.GUIManager.currentTmst, true);


              });
            
            }

          });
        }
      });
      //console.log(this.stations)
    },
    


    selectedDateChanged: function(tmst, doNotRegisterRequest){
      if (tmst == undefined || this.once == undefined)
        return;

      let stations = this.stations;
      // Hide all data from stations
      Object.keys(stations).forEach(stationId => {
        this.stationsData[stationId].hasData = false;
      });

      // Add one day before and after of the tmst
      let movingDate = new Date(tmst);
      let sDate = new Date(movingDate.getTime() - 24 * 60 * 60  * 1000);
      let eDate = new Date(movingDate.getTime() + 24 * 60 * 60  * 1000);

      // Register requested timestamps. This should only happen when all the datastreams and stations are loaded
      if (doNotRegisterRequest == undefined || doNotRegisterRequest == false){
        // Check if the tmst was requested
        if (this.requestStatus[tmst] != undefined){
          //console.log("OBSEA data was already requested for timestamp " + tmst);
          Object.keys(stations).forEach(stationId => {
            this.updateContent(stationId, tmst);
          });
          return;
        }

        
        // Check if any part of the time period was already loaded
        // End date
        movingDate = new Date(tmst);
        for (let i = 0; i < 24; i++){
          movingDate.setHours(movingDate.getHours() + 1);
          if (this.requestStatus[movingDate.toISOString()] != undefined){
            eDate.setTime(movingDate.getTime()); // Set new ending date
            i = 24; // Exit for
          }
        }
        // Start date
        movingDate = new Date(tmst);
        for (let i = 0; i < 24; i++){
          movingDate.setHours(movingDate.getHours() - 1);
          if (this.requestStatus[movingDate.toISOString()] != undefined){
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
        // Stations must be loaded
        // WARN: could it be that this is exectued when only one station exists?
        if (Object.keys(stations).length != 0){
          movingDate = new Date(sDate.getTime());
          //console.log("Registering timestamps OBSEA")
          for (let i = 0; i < 24*2; i++){
            this.requestStatus[movingDate.toISOString()] = 1;
            movingDate.setHours(movingDate.getHours() + 1);
          }
        }

      }
      

      



      let url = this.url;
      // Iterate data streams to fetch data
      for (let i = 0; i < Object.keys(stations).length; i++){
        let station = stations[Object.keys(stations)[i]];
        this.stationsData[station.id].isLoading = true;
        //console.log("LOADING...");

        // Loading keepup
        let requested = 0;
        let loaded = 0;
        // Iterate parameters (temp, wind, etc...)
        for (let j = 0; j < Object.keys(station.props).length; j++){
          let param = station.props[Object.keys(station.props)[j]];


          // Iterate datastreams
          for (let k = 0; k < param.datastreams.length; k++){
            let datastream = param.datastreams[k];

            // Check latest data available
            if (new Date(datastream.latestTmst) > sDate) {
              // Fetch data
              let streamURL = url.replace('{{datastream}}', datastream.id).replace('{{sDate}}', sDate.toISOString()).replace('{{eDate}}', eDate.toISOString());
              
              // Keep track of requested URLs
              // During loading stations and datastreams, once a datastream is loaded
              // it is automatically requestd. This keeps track of the requested urls,
              // as during loading they could be requested everytime a new datastream
              // is loaded
              if (this.requestedURLs == undefined){
                this.requestedURLs = []; 
              }
              // URL was not requested
              if (!this.requestedURLs.includes(streamURL)){
                this.requestedURLs.push(streamURL)
                //console.log(datastream.id + ", " + param.name + ", "+ station.id.substring(5));
                requested++;

                fetch(streamURL).then(res => res.json()).then(r => {
                  //console.log("Storing " + param.name);
                  this.parseAPIResult(station, param, datastream, r.value)
                  this.updateContent(station.id, tmst);

                  loaded++;
                  if (loaded == requested){
                    this.stationsData[station.id].isLoading = false;
                    //console.log("LOADED");
                  }
                });
              }
              
            } 
          }
          
          
        }
        // If nothing was requested
        if (requested == 0) {
          this.stationsData[station.id].isLoading = false;
          //console.log("LOADED (no data to load)")
        }
      }

      return;
      
    },

    updateContent: function(stationId, tmst){

      // No data in that timestamp
      if (this.stations[stationId].data[tmst] == undefined){
        this.stationsData[stationId].hasData = false;
        return;
      }
      // Has data
      this.stationsData[stationId].hasData = true;
      // Empty observed properties
      this.stationsData[stationId].data = {};
      
      // Iterate props and assign to stationsData (vue uses this object)
      Object.keys(this.stations[stationId].data[tmst]).forEach(key => {
        this.stationsData[stationId].data[key] = this.stations[stationId].data[tmst][key];
      });
      // console.log(this.stationsData[stationId].data)
      // console.log(this.stations[stationId].data[tmst]);
      //console.log(this.stations);
    },


    parseAPIResult(station, param, datastream, data){
      for (let i = 0; i < data.length; i++){
        let tmst = data[i].resultTime;
        if (station.data[tmst] == undefined)
          station.data[tmst] = {};

        param.units = datastream.units;
        if (station.data[tmst][param.name] != undefined){
          //console.warn("Overwritting data");
          
        }
        station.data[tmst][param.name] = data[i].result;
      }
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
  components: {

  }
}

</script>



<style scoped>

a {
  text-decoration: none;
}

.OBSEAContainer {
  display: flex;
  align-items: center;
}

.obsea-icon-left {
  margin-left: -15px;
}
.obsea-icon-right {
  margin-right: -15px;
}

.stationTitle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: solid 2px white;
}
.stationPanel {
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

.hide {
  opacity: 0;
  transition: all 1s;
}
.show {
  opacity: 1;
  transition: all 1s;
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