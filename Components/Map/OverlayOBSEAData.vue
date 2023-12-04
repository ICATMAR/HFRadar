<template>
  
  <div id="overlay-OBSEA-data" ref="containerOBSEAInfo">
  <!-- Container -->
    <!-- <div v-for="stationId in Object.keys(stationsData)" :id="stationId" :ref="stationId" class="OBSEAContainer" :class="[!isTooFar && isAdvancedInterfaceOnOff ? 'show' : 'hide']"> -->
    <div v-for="stationId in Object.keys(stationsData)" :id="stationId" :ref="stationId" class="OBSEAContainer">
      <!-- Station panel -->
      <Transition>
      <div class="stationPanel" v-if="stationsData[stationId].showInfo">
        <!-- Site -->
        <div class="stationTitle">
          <span><strong>OBSEA station</strong></span>
          <a href="https://obsea.es/" target="_blank" rel="noopener noreferrer" class="icon-str">i</a>
        </div>

        <!-- Station data -->
        <div v-if="stationsData[stationId].hasData">

          <!-- Wind -->
          <div v-if="Object.keys(stationsData[stationId].data).includes('WSPD')">
            <span>
              <strong>Wind: </strong>
              {{stationsData[stationId].data['WSPD'].toFixed(1)}} {{stations[stationId].params['WSPD'].units}}, 
              {{ bearing2compassRose(stationsData[stationId].data['WDIR']) }}
              <span class="fa" :style="{transform: 'rotate('+ (stationsData[stationId].data['WDIR']-45+180) +'deg)' }">&#xf124;</span>
            </span>
          </div>
          <!-- Currents -->
          <div v-if="Object.keys(stationsData[stationId].data).includes('CSPD')">
            <span>
              <strong>Current: </strong>
              {{stationsData[stationId].data['CSPD'].toFixed(1)}} {{stations[stationId].params['CSPD'].units}}, 
              {{ bearing2compassRose(stationsData[stationId].data['CSPD']) }}
              <span class="fa" :style="{transform: 'rotate('+ (stationsData[stationId].data['CSPD']-45) +'deg)' }">&#xf124;</span>
            </span>
          </div>
          <!-- Waves -->
          <div v-if="Object.keys(stationsData[stationId].data).includes('VHM0')">
            <span>
              <strong>Waves: </strong>
              {{stationsData[stationId].data['Hm0(m)'].toFixed(2)}} m, 
              {{stationsData[stationId].data['Tm02(s)'].toFixed(1)}} s, 
              {{ bearing2compassRose(stationsData[stationId].data['MeanDir(º)']) }}
              <span class="fa" :style="{transform: 'rotate('+ (stationsData[stationId].data['MeanDir(º)']-45+180) +'deg)' }">&#xf124;</span>
            </span>
          </div>
          
          <!-- Extra data -->
          <Transition>
          <div v-if="stations[stationId].showAllData">
            <!-- Wave max -->
            <div v-if="stations[stationId].params.includes('Hmax')">
              <span>
                <strong>Wave max: </strong>
                {{stationsData[stationId].data['Hmax(m)'].toFixed(1)}} m, 
                {{stationsData[stationId].data['Tp(s)'].toFixed(1)}} s
                <template v-if="stationsData[stationId].data['MeanDirPeak(º)'] != undefined">,
                  {{ bearing2compassRose(stationsData[stationId].data['MeanDirPeak(º)']) }}
                  <span class="fa" :style="{transform: 'rotate('+ (stationsData[stationId].data['MeanDirPeak(º)']-45+180) +'deg)' }">&#xf124;</span>
                </template>
              </span>
            </div>

            <!-- Water temperature -->
            <div v-if="stations[stationId].params.includes('WaterTemp')">
              <span>
                <strong>Water temperature: </strong>
                {{stationsData[stationId].data['WaterTemp(ºC)'].toFixed(1)}} ºC
              </span>
            </div>
            <!-- Salinity -->
            <div v-if="stations[stationId].params.includes('Salinity')">
              <span>
                <strong>Salinity: </strong>
                {{stationsData[stationId].data['Salinity(PSU)'].toFixed(1)}} psu
              </span>
            </div>
            <!-- Air temperature -->
            <div v-if="stations[stationId].params.includes('AirTemp')">
              <span>
                <strong>Air temperature: </strong>
                {{stationsData[stationId].data['AirTemp(ºC)'].toFixed(1)}} ºC
              </span>
            </div>
            <!-- Air pressure -->
            <div v-if="stations[stationId].params.includes('AirTemp')">
              <span>
                <strong>Air pressure: </strong>
                {{stationsData[stationId].data['AirPressure(mb)'].toFixed(1)}} mb
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
      <img class="icon-str icon-medium icon-img" @click="OBSEAIconClicked(stationId)" src="/HFRadar/Assets/Images/buoy.svg">


    </div>
  </div>

</template>


<script>



export default {
  name: 'overlay-OBSEA-data',
  created(){},
  mounted() {
    // Get OBSEA sites
    this.loadOBSEAAPI();


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
    });
  },
  data () {
    return {
      isAdvancedInterfaceOnOff: false,
      isTooFar: false,
      stations: {},
      stationsData: {},
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
      await fetch('https://data.obsea.es/data-api/ObservedProperties').then(r => r.json()).then(res => {
        
        res.value.forEach(el => {
          observedProperties[el.name] = el;
        });
      });

      // Each observed property can have different locations. Get sites per property
      for (let i = 0; i < Object.keys(observedProperties).length; i++){
        let prop = Object.keys(observedProperties)[i];
      //Object.keys(observedProperties).forEach(prop => {
        
        await fetch(observedProperties[prop]["Datastreams@iot.navigationLink"]).then(r => r.json()).then(res => {
          observedProperties[prop].sites = [];
          // Iterate datastreams (streams that provide this data in different times and locations)
          res.value.forEach(el => {
            // Skip if it is not a 30 min average
            if (!el.name.includes("30min_average"))
              return;
            // Skip if no phenomenon time
            if (el.phenomenonTime == undefined)
              return;
            // Assign to sites
            observedProperties[prop].sites.push(el);
          });
        });
      };

      // Delete observedProperties without sites
      let deletedProps = [];
      Object.keys(observedProperties).forEach(prop => {
        if (prop == undefined){
          console.log("prop undefined")
        }
        if (observedProperties[prop].sites.length == 0){
          deletedProps.push(observedProperties[prop].name)
          delete observedProperties[prop];
        }
      });
      //console.warn("Deleted observed properties, as no station is collecting them or there is no 30 min average: " + deletedProps);


      // Reorganize data by sites
      let sites = {};
      Object.keys(observedProperties).forEach(prop => {
        observedProperties[prop].sites.forEach(site => {
          let key = site.observedArea.coordinates[0] + "," + site.observedArea.coordinates[1];
          // If it does not exist, create
          if (sites[key] == undefined){
            sites[key] = {};
          }
          if (sites[key][prop] != undefined){
            //console.warn("This OBSEA variable is collected twice in the same location? " + prop + " at " + key);
          }
          // In principle, no circularity
          sites[key][prop] = observedProperties[prop];

        })
      });

      
      

      // Create data structure
      let stations = this.stations;
      for (let i = 0; i < Object.keys(sites).length; i++){
        let key = Object.keys(sites)[i];
        let site = sites[key]
        // Create station data object
        if (stations[key] == undefined) {
          stations[key] = {
            id: key,
            params: {},
            location: key.split(","),
            data: {}, // tmst1: {WDIR: value, WSP: value...}, tmst2: {}...
          }
          // Params
          for (let j = 0; j < Object.keys(site).length; j++){
            let param = Object.keys(site)[j];
            let paramData = site[param];

            let paramObj = {
              "description": paramData.description,
              "name": paramData.name,
              "units": '',
            }
            
            // Get datastream(s)
            paramObj.datastreams = [];
            for (let k = 0; k < site[param].sites.length; k++){
              let dtstm = site[param].sites[k];
              if (dtstm.observedArea.coordinates[0] == stations[key].location[0]){
                let dataStreamObj = {
                  "id": dtstm["@iot.id"],
                  "latestTmst": dtstm.phenomenonTime.split("/")[1],
                  "units": dtstm.unitOfMeasurement.symbol,
                  "sensorDepth": await fetch("https://data.obsea.es/data-api/Datastreams("+ dtstm["@iot.id"] +")/Sensor").then(res => res.json()).then(jj => jj.properties.deployment.coordinates.meters_depth),
                }
                // ADCP currents
                if (dtstm.name.includes('CSPD')){
                  dataStreamObj.depth = dtstm.properties["ADCP cell parameters"]["center depth"];
                }

                paramObj.datastreams.push(dataStreamObj);
                
              }
            }
            stations[key].params[paramData.name] = paramObj;
          }


        }
      }



      // Create stationsData and add to map
      Object.keys(this.stations).forEach(stationId => {
        this.stationsData[stationId] = {"hasData": false, "showInfo": true};
        this.stations[stationId].coord3857 = ol.proj.fromLonLat([this.stations[stationId].location[1], this.stations[stationId].location[0]]);
      });



      // In next tick the objects should already exist, thus add to map overlay
      this.$nextTick(() => {
        // Get map
        if (this.map == undefined){
          this.map = this.$parent.map;
        }
        
        // Relate overlay with map
        Object.keys(this.stations).forEach(stationId => {
          // Station info
          const stationInfo = new ol.Overlay({
            position: this.stations[stationId].coord3857,
            positioning: 'center-right',
            element: this.$refs[stationId],
            stopEvent: false,
          });
          this.map.addOverlay(stationInfo);
        });

        console.log("Added OBSEA stations");
        this.selectedDateChanged(window.GUIManager.currentTmst);
      });


    },
    


    selectedDateChanged: function(tmst){

      let stations = this.stations;
      // Hide all data from stations
      Object.keys(stations).forEach(stationId => {
        this.stationsData[stationId].hasData = false;
      });

      // Add one day before and after of the tmst
      let currentDate = new Date(tmst);
      let sDate = new Date(currentDate.getTime() - 24 * 60 * 60  * 1000);
      let eDate = new Date(currentDate.getTime() + 24 * 60 * 60  * 1000);

      // Check if the tmst was requested
      if (this.requestStatus[tmst] != undefined){
        //console.log("OBSEA data was already requested for timestamp " + tmst);
        Object.keys(stations).forEach(stationId => {
          this.updateContent(stationId, tmst);
        });
        return;
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
        let movingDate = new Date(sDate.getTime());
        //console.log("Registering timestamps OBSEA")
        for (let i = 0; i < 24*2; i++){
          this.requestStatus[movingDate.toISOString()] = 1;
          movingDate.setHours(movingDate.getHours() + 1);
        }
      }

      



      let url = this.url;
      // Iterate data streams to fetch data
      for (let i = 0; i < Object.keys(stations).length; i++){
        let station = stations[Object.keys(stations)[i]];
        // Iterate parameters (temp, wind, etc...)
        for (let j = 0; j < Object.keys(station.params).length; j++){
          let param = station.params[Object.keys(station.params)[j]];


          // Iterate datastreams
          for (let k = 0; k < param.datastreams.length; k++){
            let datastream = param.datastreams[k];

            // Check latest data available
            if (new Date(datastream.latestTmst) > sDate) {
              // Fetch data
              let streamURL = url.replace('{{datastream}}', datastream.id).replace('{{sDate}}', sDate.toISOString()).replace('{{eDate}}', eDate.toISOString());
              //console.log(streamURL);
              fetch(streamURL).then(res => res.json()).then(r => {
                //console.log("Storing " + param.name);
                this.parseAPIResult(station, param, datastream, r.value)
                this.updateContent(station.id, tmst);
              });
            }
          }
          
          
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
      // Create data obj if it does not exist
      if (this.stationsData[stationId].data == undefined)
        this.stationsData[stationId].data = {};
      
      // Iterate params and assign to stationsData (vue uses this object)
      Object.keys(this.stations[stationId].data[tmst]).forEach(key => {
        this.stationsData[stationId].data[key] = this.stations[stationId].data[tmst][key];
      });
      // console.log(this.stationsData[stationId].data)
      // console.log(this.stations[stationId].data[tmst]);
      // console.log(this.stations);
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

.OBSEAContainer {
  display: flex;
  align-items: center;
}

.stationTitle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: solid 2px white;
}
.stationPanel {
  margin-right: 20px;
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