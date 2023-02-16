<template>
    <div id="app-map">
      <!-- LAYOUT -->
      <!-- OL map -->
      <div id="map" ref="OLMap" v-on:drop="onDropFile($event)" v-on:dragover="onDragOver($event)"></div>

      <!-- Time Range Bar
      <time-range-bar ref="timeRangeBar" id="time-range-bar" 
        @changeSelDates="onTimeRangeChange($event)" 
        @changeLimits="onTimeRangeChangeLimits($event)">
      </time-range-bar>
       -->

      


      <!-- OVERLAYS -->
      <!-- Progress bar load tiles -->
      <div v-show="!progress.isLoaded" class="position-absolute m-0 btn-dark" style="width: 100%; height: 10px; opacity: 0.8; top:0" :style="{'max-width': progress.progressPercent + '%'}">
        <div class="spinner-border text-dark" style="position: relative; margin-top: 20px; margin-left: 20px" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <time-slider></time-slider>

      <!-- Animation Canvas -->
      <animationCanvas ref="animationCanvas"></animationCanvas>

      <!-- Legends -->
      <legendGUI ref="legendGUI"></legendGUI>
      <!-- <div style="position:absolute; top: 120px; left: 20px">
        <div v-for="legend in legends">
          <img :src="legend.img.src" style="width:100px; height:20px">
        </div>
      </div> -->

      <!-- Tracks on the timeline -->
      <!-- <tracks-timeline ref="tracksTimeLine" @clickTrackMark="setSelectedTrack" style="bottom: 120px; position: relative; z-index: 2"></tracks-timeline> -->

      <!-- Track info panel -->
      <!--track-panel></track-panel-->

      <!-- Legend -->
      <!--wms-legend @legendClicked="changeStyle($event)" ref="legendWMS" class="position-absolute top-0 end-0 d-sm-flex me-2 mt-5"></wms-legend-->
      
      <!-- WMS graphic legend -->
      <!-- <img v-if="WMSLegendURL != ''" id='wmsLegend' :src="WMSLegendURL"> -->

    </div>
</template>











<script>
import AnimationCanvas from "./AnimationCanvas.vue";
import TimeSlider from "./TimeSlider.vue";
import LegendGUI from "./LegendGUI.vue";
// import TimeRangeBar from "TimeRangeBar.vue";
// import TracksTimeLine from "TracksTimeLine.vue";
//import WMSLegend from "WMSLegend.vue";

export default {
  name: 'app-map',
  created (){
    // Declare non-reactive variables
    this.map= undefined;
    this.baseLayerSources = {
      'Bathymetry' : new ol.source.XYZ ({ // https://openlayers.org/en/latest/examples/xyz.html
        url: 'https://tiles.emodnet-bathymetry.eu/2020/baselayer/web_mercator/{z}/{x}/{y}.png', // https://tiles.emodnet-bathymetry.eu/
        attributions: "© EMODnet Bathymetry Consortium",
        cacheSize: 500,
        crossOrigin: 'anonymous',
      }),
      'OSM': new ol.source.OSM ({ // https://openlayers.org/en/latest/examples/canvas-tiles.html
        cacheSize: 500,
        crossOrigin: 'anonymous',
      }),
      'Imagery': new ol.source.XYZ ({ // https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/0
        url: 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png',
        attributions: '© Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
        cacheSize: 500,
        crossOrigin: 'anonymous',
      }),
      'Ocean': new ol.source.XYZ ({ // https://openlayers.org/en/latest/examples/canvas-tiles.html
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}.png',
        attributions: 'Esri, Garmin, GEBCO, NOAA NGDC, and other contributors',
        cacheSize: 500,
        crossOrigin: 'anonymous',
      }),
    },
    this.layers = {
        // Base layers
        baseLayer: new ol.layer.Tile({
          name: 'baseLayer',
          source: this.baseLayerSources['Imagery'],
          zIndex: -3,
        }),

        graticule: new ol.layer.Graticule({
          name: 'graticule',
          showLabels: true,
          wrapX: false,
          lonLabelPosition: 1,
          strokeStyle: new ol.style.Stroke({
            color: 'rgba(0,0,0,0.2)',
            width: 2,
            lineDash: [0.5, 4],
          }),
          lonLabelStyle: new ol.style.Text({
            font: '12px Calibri,sans-serif',
            textAlign: 'center',
            textBaseline: 'top',
            fill: new ol.style.Fill({
              color: 'rgba(0,0,0,0.9)',
            }),
            stroke: new ol.style.Stroke({
              color: 'rgba(255,255,255,0.5)',
              width: 3
            })
          }),
          latLabelStyle: new ol.style.Text({
            font: '12px Calibri,sans-serif',
            textAlign: 'end',
            textBaseline: 'top',
            fill: new ol.style.Fill({
              color: 'rgba(0,0,0,0.9)',
            }),
            stroke: new ol.style.Stroke({
              color: 'rgba(255,255,255,0.5)',
              width: 3
            })
          }),
        }),
        // rawHFData: new ol.layer.Image({
        //   //: new ol.source.ImageStatic({
        //     //url: 'data/SeaHabitats_0_39.8_5_43.png',
        //     //imageExtent: [0, 39.8, 5, 43],
        //     //projection: 'EPSG:4326'
        //     //imageExtent: [0.0, 4836921.25, 556597.45, 5311971.85],
        //      //projection: 'EPSG:3857'
        //    //}),
        // })


    };


    this.layerData = undefined;
    this.pixelColor = [0, 0, 0, 0];

  },

  mounted () {
    this.initMap();
    this.$refs.OLMap.addEventListener('mousemove', this.onMouseMove);
    // EVENT LISTENERS
    // New HFRadar data
    window.eventBus.on('HFRadarDataLoaded', (tmst) =>{
      this.selectedDateChanged(tmst);
    });
    // Selected date changed (slider moves or drag and drop files)
    window.eventBus.on('SelectedDateChanged', (tmst) =>{
      this.selectedDateChanged(tmst);
    });
    

  },
  umounted () {
    this.$refs.OLMap.removeEventListener('mousemove', this.onMouseMove);
    this.map.un('moveend', this.onMapMoveEnd);
    this.map.un('movestart', this.onMapMoveStart); 
  },
  data () {
    return {
      progress: {
        loading: 0,
        loaded: 1
      },
      isLayerDataReady: false,
      WMSLegendURL: '',
      visibleHFRadars: [],
    }
  },
  methods: {
    // USER ACTIONS
    // DRAG & DROP FILES
    onDragOver: function(event) {
        event.preventDefault();
        event.stopPropagation();
    },
    // On drop event
    onDropFile: function(event) {
        event.preventDefault();
        event.stopPropagation();
        if (window.DataManager){
          window.DataManager.loadDroppedFiles(event.dataTransfer.files);
        }
    },
    // PRIVATE METHODS
    // Figure clicked (TODO: emit)
    initMap: function () {
      //debugger;
      // Initialize map
      this.map = new ol.Map({
        layers : [
          // Data layer
          //this.layers.data,
          // Base layer
          this.layers.baseLayer,
          //this.layers.bathymetry,
          // Graticule layer
          this.layers.graticule,
          // Raw HF Data
          // this.layers.rawHFData,
          // 12 nm
          //this.layers.eez12nm,
          // Shoreline
          //this.layers.shoreline,
          
          // Ports
          //this.layers.portsLayer,
          // Fishing effort
          //this.layers.fishingEffort,
          // Sea habitats
          //this.layers.seaHabitats
        ],
        target: 'map',
        //controls: ol.control.defaults({ attributionOptions: { collapsible: true } }),
        view: new ol.View({
          center: ol.proj.fromLonLat([3.25,42.25]),
          zoom: 10,
          maxZoom: 22,
          extent: ol.proj.fromLonLat([-28,20]).concat(ol.proj.fromLonLat([40, 50]))
        }),
      });
      // Set css
      document.getElementsByClassName('ol-attribution')[0].style.bottom = 'auto';
      document.getElementsByClassName('ol-attribution')[0].style.top = '.5em';

      // Declare onmapmove events
      this.map.on('moveend', this.onMapMoveEnd);
      this.map.on('movestart', this.onMapMoveStart);

      // Declare interactions
      // Interaction (tracks clicked)
      // const selectInteraction = new ol.interaction.Select({style: null});
      // selectInteraction.on('select', (e) => {
      //   console.log(e);
      //   // Nothing clicked
      //   if (e.selected[0] === undefined)
      //     return false;
      //   // Track line is cliked
      //   if (e.selected[0].getProperties().featType == "trackLine"){
      //     this.setSelectedTrack(e.selected[0].getProperties().id);
      //   }
      //   // Port is clicked
      //   // else if (e.selected[0].getProperties().featType == "port") {
      //   //   portClicked(e);
      //   // }
      // });

      // // Add interaction to map
      // this.map.addInteraction(selectInteraction);

      // Map single click
      this.map.on('singleclick', this.onMapClick);
      

      // Register tile load progress
      Object.keys(this.baseLayerSources).forEach(key => {
        let blSource = this.baseLayerSources[key];
        this.registerLoadTilesEvents(blSource);
      });
      //this.registerLoadTilesEvents(this.layers.seaHabitats);

    },




  





    // HFRADAR
    // Selected date change, thus upate radar data
    selectedDateChanged: function(tmst){
      // Remove layers
      this.removeHFlayers();
      // Get current active radars on that date
      let activeRadars = window.DataManager.getRadarsDataOn(tmst);
      if (activeRadars.length != 0 ){
        for (let i = 0; i < activeRadars.length; i++){
          let HFRadar = activeRadars[i];
          // TODO: HFRadar.data.timestamp {dataPoints: [X], imgData: ...}
          if (HFRadar.images[tmst] == undefined){
            let imgData = window.createImage(HFRadar, tmst);
            HFRadar.images[tmst] = imgData;
          }
          this.updateHFRadarData(HFRadar, tmst, HFRadar.images[tmst]);
          this.updateVisibleRadars(HFRadar);
          // Update animation canvas
          // TODO: SHOULD CHECK HOW MANY ACTIVE. RIGHT NOW ONLY ONE ACTIVE.
          if (this.$refs.animationCanvas){
            this.$refs.animationCanvas.createAnimation(HFRadar.data[tmst], this.map)
          }
        }


      }

      
    },

    // Remove HFRadar layers HFData, HFIcon, HFPoints
    removeHFlayers: function(){
      this.map.getLayers().getArray().slice().forEach(layerItem => {
          if (layerItem != undefined){
            let layerName = layerItem.get('name');
            if (layerName.includes('HFData') || 
            layerName.includes('HFPoints') || 
            layerName.includes('HFIcon') || // Temporary - in the future this layer should not be deleted
            layerName.includes('HFSelPoint')){
              this.map.removeLayer(layerItem);
            }
          }
        });
    },

    // Update HFRadar data
    updateHFRadarData: function(HFRadar, tmst, imgData) {
      // ID of the radar
      let radarID = HFRadar.header.PatternUUID;
      let radarImgLayerName = 'HFData' + radarID;
      // Image-Static layer
      // Add image layer with HF Radar data
      this.layers[radarImgLayerName] = new ol.layer.Image({
        name: radarImgLayerName,
        source: new ol.source.ImageStatic({
          url: imgData.url,
          imageExtent: imgData.imageExtent,
          projection: imgData.projection
        }),
      });
      if (this.getMapLayer(radarImgLayerName)) this.map.removeLayer(this.getMapLayer(radarImgLayerName)); // Remove layer before adding. Not optimal but prettier
      //this.map.addLayer(this.layers[radarImgLayerName]);



      // Vector - Icon layer
      // Create Radar icon
      // Get radar location
      let locationStr = HFRadar.header.Origin;
      let location = locationStr.replace(/\s\s+/g, ',').replace(',', '').split(',');
      location = location.reverse();
       // Center on coordinate
       this.centerOnCoord(location);
      
      // Create feature
      let feature =  new ol.Feature({
              geometry: new ol.geom.Point(ol.proj.fromLonLat(location)),
              name: 'HF Radar',
            });
      // Create style
      let featStyle = new ol.style.Style({
                image: new ol.style.Icon({
                  // anchor: [0.5, 46],
                  // anchorXUnits: 'fraction',
                  // anchorYUnits: 'pixels',
                  src: 'Assets/antenna.png',
                  width: 10,
                  height: 10,
                  scale: [0.5, 0.5]
                })
              });
      feature.setStyle(featStyle);

      // Create layer with feature
      let radarIconLayerName = 'HFIcon' + radarID;
      this.layers[radarIconLayerName] = new ol.layer.Vector({
        name: radarIconLayerName,
        source: new ol.source.Vector({
          features: [feature]
        })
      });
      // Add to map
      if (this.getMapLayer(radarIconLayerName)) this.map.removeLayer(this.getMapLayer(radarIconLayerName));
      this.map.addLayer(this.layers[radarIconLayerName]);


      // Vector - Features layer
      // Show radar points
      // TODO: is this optimal?
      let featPoints = [];
      for (let i = 0; i<HFRadar.data[tmst].length; i++){
        let dataPoint = HFRadar.data[tmst][i];
        let featPoint = new ol.Feature({
          geometry: new ol.geom.Point(ol.proj.fromLonLat([dataPoint['Longitude (deg)'], dataPoint['Latitude (deg)']])),
        });
        featPoint.setStyle( new ol.style.Style({
          image: new ol.style.Circle({
            radius: 2,
            fill: new ol.style.Fill({
              color: [255, 255, 255, 0.2],
              opacity: 0.5,
            })
          })
        }))
        featPoints[i] = featPoint;
      }
      let radarPointsLayerName = 'HFPoints' + radarID;
      this.layers[radarPointsLayerName] = new ol.layer.Vector({
        name: radarPointsLayerName,
        source: new ol.source.Vector({
          features: featPoints
        })
      })
      if (this.getMapLayer(radarPointsLayerName)) this.map.removeLayer(this.getMapLayer(radarPointsLayerName));
      this.map.addLayer(this.layers[radarPointsLayerName]);


    },


    // Update the visible radars
    updateVisibleRadars: function(HFRadar){
      // Check if the radar is already shown
      let isSet = false;
      for (let i = 0; i < this.visibleHFRadars.length; i++){
        let id = HFRadar.header.PatternUUID;
        if (id == this.visibleHFRadars[i].header.PatternUUID){
          this.visibleHFRadars[i] = HFRadar;
          isSet = true;
        }
      }
      // If the radar was not present, add to the map
      if (!isSet)
        this.visibleHFRadars.push(HFRadar);
      console.log(this.visibleHFRadars.length + " loaded radars.")
    },








    // Get layer function
    getMapLayer: function(layerName){
      let selLayer = undefined;
      this.map.getLayers().forEach(layerItem => {
        //console.log(layerItem.get('name'));
        if (layerItem.get('name') == layerName)
          selLayer = layerItem;
      })
      return selLayer;
    },
  

    // USER EVENTS
    // MAP CLICK
    onMapClick: function(evt) {
      let distMin = 999;
      let coord = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
      let closestDataPoint;
      // Find closest points
      if (this.visibleHFRadars.length != 0){
        let radars = this.visibleHFRadars;
        for (let i = 0; i < radars.length; i++){
          let radar = radars[i];
          
          for (let j = 0; j < radar.currentData.length; j++){
            let dataPoint = radar.currentData[j]; 
            // Calculate distance (could do it in km with the right formula, but this is interaction and it does not matter that much)
            let dist = Math.sqrt( Math.pow(dataPoint['Longitude (deg)'] - coord[0], 2) + Math.pow(dataPoint['Latitude (deg)'] - coord[1], 2));
            // Find closest point
            if (dist < distMin){
              distMin = dist;
              closestDataPoint = dataPoint;
            }
          }
        }
        // Limit by distance in pixels
        if (closestDataPoint){
          let epsg3857coord = ol.proj.fromLonLat([closestDataPoint['Longitude (deg)'], closestDataPoint['Latitude (deg)']]);
          let pixelCoord = this.map.getPixelFromCoordinate(epsg3857coord);

          let pixelDistance = Math.sqrt(Math.pow(evt.originalEvent.clientX - pixelCoord[0],2) + Math.pow(evt.originalEvent.clientY - pixelCoord[1],2));
          // Click distance to point
          if (pixelDistance < 60){
            window.eventBus.emit('ClickedDataPoint', closestDataPoint);
            // Create map layer with styled point
              let featPoint = new ol.Feature({
                geometry: new ol.geom.Point(epsg3857coord),
              });
              featPoint.setStyle( new ol.style.Style({
                image: new ol.style.Circle({
                  radius: 4,
                  fill: new ol.style.Fill({
                    color: [255, 255, 0, 0.5],
                    opacity: 0.5,
                  })
                })
              }))
            this.layers.HFSelPoint = new ol.layer.Vector({
              name: 'HFSelPoint',
              source: new ol.source.Vector({
                features: [featPoint]
              })
            })
            if (this.getMapLayer('HFSelPoint')) this.map.removeLayer(this.getMapLayer('HFSelPoint'));
            this.map.addLayer(this.layers.HFSelPoint);
          }
          // Too far away from any point (more than X pixels away)
          else {
            // Remove layer
            if (this.getMapLayer('HFSelPoint')) this.map.removeLayer(this.getMapLayer('HFSelPoint'));
            // Remove info from side panel
            window.eventBus.emit('DeselectedDataPoint');
          }

        }
      }
    },

    // INTERNAL EVENTS
    // Mouse move on map
    onMouseMove: function(event){
      // Return if map is moving
      if (this.isMapMoving)
        return;
      // Get lat long coordinates
      let coord = this.map.getCoordinateFromPixel([event.clientX, event.clientY]);
      coord = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');
      // Emit
      this.$emit('mouseMove', coord);
      // Change legend tooltip value
      if (this.$refs.legendWMS){
        if (this.isLayerDataReady){
          let color = this.getDataAtPixel(event.clientX, event.clientY);
          this.$refs.legendWMS.showValueAtColor(color);
        }
      }
    },

    // Map moves
    onMapMoveEnd: function(){
      this.isMapMoving = false;
      // If data is loaded, update the pixel information once the map move finishes
      // TODO: this could be optimized --> get a canvas with all data and relate lat-long to that canvas
      if (this.isLayerDataReady)
        this.updateSourceData();
    },
    onMapMoveStart: function(){
      this.isMapMoving = true;
    },




    // Declare loading tile events
    registerLoadTilesEvents: function(source){
      // Source is a ol.source
      let progress = this.progress;
      progress.loading = 0;
      progress.loaded = 0;
      progress.isLoaded = false;
      progress.progressPercent = 0;
      this.isLayerDataReady = false;
      source.on('tileloadstart',() => {
        progress.loading += 1;
        progress.isLoaded = false;
      });
      source.on('tileloadend', () => {
        progress.loaded += 1;
        progress.progressPercent = 100*progress.loaded/progress.loading;
        if (progress.loading == progress.loaded){
          this.onTilesLoaded(); // TODO: could reference the isLayerDataReady to source, so we control if a source is ready
          progress.isLoaded = true;
        }
      });
      source.on('tileloaderror', () => {
        progress.loaded += 1;
        progress.progressPercent = 100*progress.loaded/progress.loading;
        if (progress.loading == progress.loaded){
          this.onTilesLoaded(); // TODO: could reference the isLayerDataReady to source, so we control if a source is ready
          progress.isLoaded = true;
        }
      });
    },


    // Store pixel information once tiles are loaded
    onTilesLoaded: function(){   
      //this.isLayerDataReady = true;
      //this.updateSourceData();
    },

    // Update the data pixels
    updateSourceData: function(){
      // Get ol layer
      let layer = this.getMapLayer('data');
      // Get canvas
      let tmpCnv = layer.getRenderer().getImage();
      // Get data
      this.layerData = tmpCnv.getContext("2d").getImageData(0,0,tmpCnv.width,tmpCnv.height);
      // Store width to access pixels
      this.layerDataWidth = tmpCnv.width;
    },


    // Get pixel data
    getDataAtPixel: function(x , y){
      let imgArrayPos = (x + y * this.layerDataWidth) * 4; // + 1,2,3 if you want (R)GBA
      let imgData = this.layerData.data;
      let color = this.pixelColor;
      color[0] = imgData[imgArrayPos]
      color[1] = imgData[imgArrayPos+1]
      color[2] = imgData[imgArrayPos+2]
      color[3] = imgData[imgArrayPos+3];
      return color;
    },

    // Center on the coordinate
    centerOnCoord(coord){
      // Center map to track
      let view = this.map.getView();
      let currentZoom = view.getZoom();
      view.animate({
        center: ol.proj.fromLonLat([coord[0], coord[1]]),
        zoom: Math.max(9.5, currentZoom),
        duration: 1000,
      });
    },


    // The time range has changed. Update the track lines
    onTimeRangeChange: function(dates){
      // Set starting and ending dates in fishing tracks
      this.fishingTracks.setStartEndDates(dates[0], dates[1]);
    },
     // The timeline has changed. Update the track lines
    onTimeRangeChangeLimits: function(dates){
      // Set starting and ending dates of tracks-timeline
      if (this.$refs.tracksTimeLine)
        this.$refs.tracksTimeLine.setStartEndDates(dates[0], dates[1]);
    },
    








    // PUBLIC METHODS
    // Get OL map object
    getOLMap: function(){
      return this.map;
    },


    




    setBaseLayer: function(baseLayerName){
      let source = this.baseLayerSources[baseLayerName];
      if (source == undefined){
        console.error('Base layer name does not exist in array of base layers: ' + baseLayerName);
        return;
      }

      let baseLayer = this.getMapLayer('baseLayer');
      baseLayer.setSource(source);
    },
    setLayerOpacity: function(params){
      let layerName = params[0];
      let opacity = params[1];
      // Get layer
      let layer = this.getMapLayer(layerName);
      if (layer == undefined){
        console.log(layerName + ' does not exist. Wrong layer name. Cannot set opacity.');
        return;
      }
      // Set opacity
      layer.setOpacity(parseFloat(opacity));
    },
    setClimaLayer: function(urlParams){
      let climaLayer = this.getMapLayer('data');
      if (urlParams == undefined){
        // Remove clima layer
        if (climaLayer != undefined)
          this.map.removeLayer(climaLayer);
        // Remove legend url
        this.WMSLegendURL = '';
        
        return;
      }
      // Add layer if it is not included
      if (climaLayer == undefined)
        this.map.addLayer(this.layers.data);
      // Update parameters
      this.updateSourceWMS(urlParams);
      
    },





  },
  components: {
    "time-slider": TimeSlider,
    "animationCanvas": AnimationCanvas,
    "legendGUI": LegendGUI,
},
  computed: {
      //foo: function () {}
  }
}
</script>











<style scoped>

#app-map {
  background-color: red;
  width: 100%;
  height: 100vh;
  position: relative;
}

#map {
  width: 100%;
  height: 100vh;
  background-color: rgb(255, 138, 138);
  z-index: 0; 
}


/* #time-range-bar {
  background:white;
  bottom: 0; 
  height: 90px; 
  width: 100%;
}

#wmsLegend {
  top: 130px; 
  left: 15px;
  position: absolute; 
  z-index: 2;
  box-shadow: 0 0 4px black;
  background: #527db3cf;
  padding: 10px;
  max-height: 200px;
} */

</style>