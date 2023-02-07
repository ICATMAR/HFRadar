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
        rawHFData: new ol.layer.Image({
          //: new ol.source.ImageStatic({
            //url: 'data/SeaHabitats_0_39.8_5_43.png',
            //imageExtent: [0, 39.8, 5, 43],
            //projection: 'EPSG:4326'
            //imageExtent: [0.0, 4836921.25, 556597.45, 5311971.85],
             //projection: 'EPSG:3857'
           //}),
        })


    };


    this.layerData = undefined;
    this.pixelColor = [0, 0, 0, 0];

  },

  mounted () {
    this.initMap();
    this.$refs.OLMap.addEventListener('mousemove', this.onMouseMove);
    // EVENT LISTENERS
    window.eventBus.on('LoadedHFRadarData', (HFRadarData) => { // From loadRawHFData.js
      let imgData = window.createImage(HFRadarData);
      this.updateHFRadarData(HFRadarData, imgData);
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
        let files = event.dataTransfer.files;
        console.log(files.length + " files dropped.");
        // Iterate files
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            // Read files
            window.readFile(file);
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
      const selectInteraction = new ol.interaction.Select({style: null});
      selectInteraction.on('select', (e) => {
        // Nothing clicked
        if (e.selected[0] === undefined)
          return false;
        // Track line is cliked
        if (e.selected[0].getProperties().featType == "trackLine"){
          this.setSelectedTrack(e.selected[0].getProperties().id);
        }
        // Port is clicked
        // else if (e.selected[0].getProperties().featType == "port") {
        //   portClicked(e);
        // }
      });

      // Add interaction to map
      this.map.addInteraction(selectInteraction);

      // Map single click
      // this.map.on('singleclick',  (evt) => {
      //   //document.getElementById('info').innerHTML = '';
      //   debugger;
      //   let view = this.map.getView();
      //   const viewResolution = view.getResolution();
      //   const url = this.layers.seaHabitats.getSource().getFeatureInfoUrl(
      //     evt.coordinate,
      //     viewResolution,
      //     'EPSG:3857',
      //     {'INFO_FORMAT': 'text/html'}
      //   );
      //   if (url) {
      //     fetch(url)
      //       .then((response) => response.text())
      //       .then((html) => {
      //         console.log(html);
      //         //document.getElementById('info').innerHTML = html;
      //       });
      //   }
      // });
      
      // Register tile load progress
      Object.keys(this.baseLayerSources).forEach(key => {
        let blSource = this.baseLayerSources[key];
        this.registerLoadTilesEvents(blSource);
      });
      //this.registerLoadTilesEvents(this.layers.seaHabitats);

    },





    // Update HFRadar data
    updateHFRadarData: function(HFRadarData, imgData) {

      // Add image layer with HF Radar data
      this.layers.rawHFData = new ol.layer.Image({
        name: 'rawHFData',
        source: new ol.source.ImageStatic({
          url: imgData.url,
          imageExtent: imgData.imageExtent,
          projection: imgData.projection
        }),
      });
      if (this.getMapLayer('rawHFData')) this.map.removeLayer(this.getMapLayer('rawHFData')); // Remove layer before adding. Not optimal but prettier
      this.map.addLayer(this.layers.rawHFData);


      // Create Radar icon
      // Get radar location
      let locationStr = HFRadarData.header.Origin;
      let location = locationStr.replace(/\s\s+/g, ',').replace(',', '').split(',');
      // Create feature
      let feature =  new ol.Feature({
              geometry: new ol.geom.Point(ol.proj.fromLonLat(location.reverse())),
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
      this.layers.HFIcon = new ol.layer.Vector({
        name: 'HFIcon',
        source: new ol.source.Vector({
          features: [feature]
        })
      });
      // Add to map
      if (this.getMapLayer('HFIcon')) this.map.removeLayer(this.getMapLayer('HFIcon'));
      this.map.addLayer(this.layers.HFIcon);

      // Show radar points
      // TODO: is this optimal?
      let featPoints = [];
      for (let i = 0; i<HFRadarData.data.length; i++){
        let dataPoint = HFRadarData.data[i];
        let featPoint = new ol.Feature({
          geometry: new ol.geom.Point(ol.proj.fromLonLat([dataPoint.Longitude, dataPoint.Latitude])),
        });
        featPoint.setStyle( new ol.style.Style({
          image: new ol.style.Circle({
            radius: 2,
            fill: new ol.style.Fill({
              color: [255, 0, 0, 0.5],
              opacity: 0.5,
            })
          })
        }))
        featPoints[i] = featPoint;
      }
      this.layers.HFPoints = new ol.layer.Vector({
        name: 'HFPoints',
        source: new ol.source.Vector({
          features: featPoints
        })
      })
      if (this.getMapLayer('HFPoints')) this.map.removeLayer(this.getMapLayer('HFPoints'));
      this.map.addLayer(this.layers.HFPoints);


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
  




    // INTERNAL EVENTS
    // Change the styles (WMSLegend.vue emit)
    changeStyle: function(newStyle){
      // Get params
      let params = this.getMapLayer('data').getSource().getParams();
      // Check if the new style is the current
      if (params.STYLES == newStyle)
        return;
      // If style is different, update source
      params.STYLES = newStyle;
      // Set params
      this.getMapLayer('data').getSource().updateParams(params);
      // Source needs to reload
      this.isLayerDataReady = false;
      // Update ForecastBar if it exists
      this.$emit('changeWMSStyle', newStyle);
    },

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
    // Update WMS data source. This function is called from AppManager.vue
    updateSourceWMS: function (infoWMS){
      // Create tile grid for faster rendering for low resolution WMS
      let extent = ol.proj.get('EPSG:3857').getExtent();
      let tileSize = 512;
      let maxResolution = ol.extent.getWidth(extent) / tileSize;
      let resolutions = new Array(6);
      for (let i = 0; i < resolutions.length; i++){
        resolutions[i] = maxResolution / Math.pow(2,i);
      }
      // Assign to openlayers WMS tile source
      infoWMS.tileGrid = new ol.tilegrid.TileGrid({
        extent: extent,
        resolutions: resolutions,
        tileSize: tileSize
      });
      
      // Avoid cross origin problems when getting pixel data (The canvas has been tainted by cross-origin data.)
      infoWMS.crossOrigin='anonymous';
      infoWMS.cacheSize = 500;

      // Create OL source from ForecastBar.vue object
      let source = new ol.source.TileWMS(infoWMS);
      this.getMapLayer('data').setSource(source);
      // Tracking the load progress
      this.registerLoadTilesEvents(source);
      
      // Update legend
      if (this.$refs.legendWMS)
        this.$refs.legendWMS.setWMSLegend(infoWMS);
      if (this.WMSLegendURL != undefined){
        let url = source.getLegendUrl(this.map.getView().getResolution()) + '&TRANSPARENT=TRUE';
        url += '&PALETTE=' + infoWMS.params.STYLES.split('/')[1];
        url += '&COLORSCALERANGE=' + infoWMS.params.COLORSCALERANGE;
        this.WMSLegendURL = url;

        //https://nrt.cmems-du.eu/thredds/wms/med-cmcc-sal-an-fc-d?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image%2Fpng&LAYER=so&SCALE=2544411.053285503&TRANSPARENT=TRUE
      }
    },

    
    // HIDDEN BECAUSE: it is not as simple as updating the date. Each data type has two WMS services associated sometimes (reanalysis and forecast).
    //                 Depending on the date one or the other service will be used. Additionally, the date in Layers panel need to change, thus the connection
    //                  between Map.vue and LayerPanel.vue has to be made anyway.
    // Update the date of the WMS source
    // updateWMSDate: function(date){ // yyyy-mm-dd
    //   // Get data layer
    //   let dataLayer = this.getMapLayer('data');
    //   if (dataLayer == undefined) // No data layer is present
    //     return;
        
    //   let wmsSource = dataLayer.getSource();
    //   if (wmsSource == null) // No source yet
    //     return;
    //   // Get parameters and modify them
    //   debugger;
    //   let params = wmsSource.getParams();
    //   // TODO: We are adding yyyy-mm-dd with Thh:mm:ss:mmm. It can be that the hours/minutes change depending on the WMS service and the date. Be careful
    //   params.TIME = date + params.TIME.substring(10);
    //   // Use params.TIME to change from reanalysis to forecast and viceversa
    //   let dataTypes = preLoadedDataTypes;
    //   debugger;
      
    //   wmsSource.updateParams(params);
    //   // TODO: not as simple as that, because it can switch from reanalysis to forecast.

    // },

    
    // Get OL map object
    getOLMap: function(){
      return this.map;
    },

    // Receive selected track and show it
    // This event can come from HaulInfo.vue or TracksTimeLine
    setSelectedTrack: function(id){
      
      // If id is undefined, it hides the selected mark
      if (this.$refs.tracksTimeLine){
        if (id == undefined)
          this.$refs.tracksTimeLine.hideSelectedTrack(id);
        else{
          this.$refs.tracksTimeLine.showSelectedTrack(id);
        }
      }

      // Center timeline
      let feature = FishingTracks.getFeatureById(id);
      if (this.$refs['timeRangeBar']){
        let trackDate = new Date(feature.properties.info.Date);
        this.$refs['timeRangeBar'].centerOnDate(trackDate);
      }

      // Center map to track
      let view = this.map.getView();
      let coord = [...feature.geometry.coordinates[0]];
      let currentZoom = view.getZoom();
      let longCorrection = 0;//currentZoom > 11 ? 0.1 : 0.3;
      view.animate({
        center: ol.proj.fromLonLat([coord[0] + longCorrection, coord[1]]),
        zoom: Math.max(9.5, currentZoom),
        duration: 1000,
      });

      // Update map style
      FishingTracks.setSelectedTrack(id);
      this.fishingTracks.updateStyle();

      

      // Emit to open side panel fishing tracks and to udate WMS date in layers panel
      this.$emit('onTrackClicked', id);
      
    },

    setEffortLayerOpacity: function(opacity){
      let effortLayer = this.getMapLayer('fishingEffort');
      effortLayer.setOpacity(parseFloat(opacity));
    },
    setEffortMap: function(inUrl){
      let effortLayer = this.getMapLayer('fishingEffort');
      // let olSource = effortLayer.getSource(); // setUrl does not exists for ol.Layer.Image
      let source = new ol.source.ImageStatic({
        url: inUrl, // 'data/fishingEffort_<effortType>_<year>_<gear>'
        imageExtent: [-1, 39, 6, 44],
        projection: 'EPSG:4326'
      });
      // Assign new source to layer
      effortLayer.setSource(source);
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




    // Panel was open or closed by clicking a tab
    onTabClicked: function(){
      if (this.$refs['timeRangeBar']){
        this.$refs['timeRangeBar'].onTabOpenClose();
      }
    },




    // CALLBACKS
    // Once the fishing tracks have been loaded
    onLoadTracks: function(){
      // Add to layer
      this.map.addLayer(this.fishingTracks.getLayer());
      // TODO;
      // Update start and end dates
      // Get start and end from timerange
      //this.fishingTracks.setStartEndDates(); // Set starting and ending dates in fishing tracks
      
      // Track lines overlay
      //let gjson = this.fishingTracks.getGeoJSON();
      let gjson = FishingTracks.getGeoJSON();
      if (this.$refs.tracksTimeLine){
        this.$refs.tracksTimeLine.setFeatures(gjson.features);
      }

      // Emit geojson loaded
      this.$emit('onFishingTracksLoad', gjson);
      
      // OPTIONS:
      // PAINT IN A CANVAS -> TRANSFORM TO IMAGE -> MAKE IMAGE AS BACKGROUND OF TIMERANGE
      // OVERLAY, BUT BELOW TIMERANGE?
      // CREATE A VUE OVERLAY INSIDE TIMERANGE?
    },


  },
  components: {
    // "time-range-bar": TimeRangeBar,
    // "tracks-timeline": TracksTimeLine,
    //"wms-legend": WMSLegend
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