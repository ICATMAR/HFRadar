<template>
    <div id="app-map">
      <!-- LAYOUT -->
      <!-- OL map -->
      <div id="map" ref="OLMap" v-on:drop="onDropFile($event)" v-on:dragover="onDragOver($event)"></div>

      



      <!-- OVERLAYS -->
      <!-- Progress bar load tiles -->
      <div v-show="!progress.isLoaded" class="position-absolute m-0 btn-dark" style="width: 100%; height: 10px; opacity: 0.8; top:0" :style="{'max-width': progress.progressPercent + '%'}">
        <div class="spinner-border text-dark" style="position: relative; margin-top: 20px; margin-left: 20px" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Progress bar load WMS tiles -->
      <div v-show="!wmsProgress.isLoaded" class="position-absolute m-0 btn-dark" style="background: var(--blue); width: 100%; height: 5px; opacity: 0.8; top:0px" :style="{'max-width': wmsProgress.progressPercent + '%'}">
        <div class="spinner-border" style="position: relative; margin-top: 20px; margin-left: 40px; color:var(--blue)" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Overlay wave data -->
      <overlay-wave-data ref="overlayWaveData"></overlay-wave-data>

      <!-- Overlay puertos del estado buoys data -->
      <overlay-buoy-data ref="overlayBuoyData"></overlay-buoy-data>

      <!-- Overlay obsea buoys data -->
      <overlay-obsea-data ref="overlayOBSEAData"></overlay-obsea-data>

      <!-- <time-slider></time-slider> -->

      <!-- Bottom Section -->
      <bottom-section></bottom-section>

      <!-- Direction for WMS layers -->
      <climaDirectionCanvas ref="climaDirectionCanvas"></climaDirectionCanvas>
       

      <!-- Animation Canvas -->
      <animationCanvas ref="animationCanvas"></animationCanvas>


    </div>
</template>











<script>
import AnimationCanvas from "./AnimationCanvas.vue";
import ClimaDirectionCanvas from "./ClimaDirectionCanvas.vue";
import BottomSection from "../BottomSection/BottomSection.vue";
import OverlayWaveData from "./OverlayWaveData.vue";
import OverlayBuoyData from "./OverlayBuoyData.vue";
import OverlayOBSEAData from "./OverlayOBSEAData.vue";

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
        // Contours bathymetry
        contours: new ol.layer.Tile({
          name: 'contours',
          source: new ol.source.TileWMS({
                  url: 'https://ows.emodnet-bathymetry.eu/wms',
                  params: {'LAYERS': 'emodnet:contours', 'TILED': true},
                  serverType: 'geoserver',
                  crossOrigin: 'anonymous',
                  cacheSize: 500
          }),
          maxResolution: 500
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

        // Clima data (weather and sea)
        data: new ol.layer.Tile({
          name: 'data',
          zIndex: -2,
        }),

        // Shoreline
        shoreline: new ol.layer.VectorTile({
          name: 'shoreline',
          maxZoom: 22,
          source: new ol.source.VectorTile({
            attributions: '© European Environment Agency',
            format: new ol.format.MVT(),
            url: 'data/shoreline-tiles/{z}/{x}/{y}.pbf',
            maxZoom: 10, // Defined in MVT folders
            zDirection: -1
          }),
          style: new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: 'rgba(0,0,0,0.7)',
              width: 1
            })
          }),
        }),

        // Land mask
        // landMask: new ol.layer.Image({
        //   name: 'landMask',
        //   source: new ol.source.ImageStatic({
        //     // https://ows.emodnet-bathymetry.eu/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng8&TRANSPARENT=true&LAYERS=emodnet:mean_2016&TILED=TRUE&WIDTH=2048&HEIGHT=2048&CRS=EPSG%3A3857&STYLES=&BBOX=0.0%2C4836921.25%2C556597.45%2C5311971.85
        //     url: './Assets/Images/LandMask_0_39.8_5_43.png',
        //     imageExtent: [0.0, 4836921.25, 556597.45, 5311971.85],
        //     projection: 'EPSG:3857'
        //   }),
        //   zIndex: -2,
        //   opacity: 0.8
        // }),
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
      if (tmst != undefined)
        this.selectedDateChanged(tmst);
    });
    // Selected date changed (slider moves or drag and drop files)
    window.eventBus.on('DataStreamsBar_SelectedDateChanged', this.selectedDateChanged);
    // Initial load and user changing hash TIME in URL
    window.eventBus.on('GUIManager_URLDateChanged', this.selectedDateChanged);
    // User clicked on Active sync and turned it on
    window.eventBus.on('TopRightCanvas_ActiveSyncClickedAndOn', this.selectedDateChanged);
    // TODO: COMBINE TWO NEXT EVENTS
    // Show/Hide points of a radar
    window.eventBus.on('WidgetCombinedRadars_PointsActiveChanged', (active)=> {
      // Iterate radars and stop animations
      this.radarTypePointsActiveChanged("CombinedRadars", active);
    })
    // Show/hide points of HF Radar
    window.eventBus.on('WidgetHFRadars_PointsActiveChanged', (active)=> {
      // Iterate radars and stop animations
      this.radarTypePointsActiveChanged("HFRadar", active);
    });
    // Widget clsoes combined radars
    window.eventBus.on('WidgetCombinedRadars_VisibilityChanged', (areVisible) => {
      // Remove HF points
      this.radarTypeVisibilityChanged("CombinedRadars", areVisible);
    });
    window.eventBus.on('WidgetHFRadars_VisibilityChanged', (areVisible) => {
      // Remove HF points
      this.radarTypeVisibilityChanged("HFRadar", areVisible);
    });

    // WidgetMapOptions
    // Change base layer
    window.eventBus.on('WidgetMapOptions_BaseLayerClicked', (baseLayerName) => {
      this.setBaseLayer(baseLayerName);
    });
    // Change isobaths
    window.eventBus.on('WidgetMapOptions_IsobathsVisibilityChange', (isVisible) => {
      //
    });
    


    // When the side panel is hiden
    window.eventBus.on('SidePanelSizechanged', (isSidePanelOpen) => {
      setTimeout(()=> this.map.updateSize(), 100);
      this.map.updateSize();
    });
    // When radar is activated / deactivated
    window.eventBus.on('WidgetHFRadars_RadarActiveChange', (HFRadar) => {
      // Hide / show HF points
      this.updateHFRadarPointsVisibility(HFRadar);
    });


    // Clima layer
    window.eventBus.on('WidgetWeatherLayers_ClimaLayerChange', infoWMS => {
      this.setClimaLayer(infoWMS);
    });
    // Change clima layer style
    window.eventBus.on('WMSLegend_LegendClicked', style => {
      this.changeStyle(style);
    });


    // Advanced interface
    window.eventBus.on('AdvancedInterfaceOnOff', state => {
      setTimeout(()=> this.map.updateSize(), 100);
      this.map.updateSize();
    });
    
    // URL Hash change
    window.eventBus.on('GUIManager_URLViewChanged', mapView => {
      let long = parseFloat(mapView.split(",")[0]);
      let lat = parseFloat(mapView.split(",")[1]);
      let zoom = parseFloat(mapView.split(",")[2]);
      this.map.getView().animate({
          center: ol.proj.fromLonLat([long, lat]),
          zoom: Math.min(15, zoom),
          duration: 1000,
        });
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
      // WMS Data layer
      wmsProgress: {
        loading: 0,
        loaded: 1,
        isLoaded: true,
      },
      isLayerDataReady: false,
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

    // EXTERNAL EVENTS
    // RADARS
    radarTypePointsActiveChanged: function(radarType, active){
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        if (radar.constructor.name == radarType){
          // Update map layers
          this.updateHFRadarPointsVisibility(radar);
        }
      });
    },
    radarTypeVisibilityChanged: function(radarType, areVisible){
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        if (radar.constructor.name == radarType){
          this.updateHFRadarPointsVisibility(radar);
        }
      });
    },

    // PRIVATE METHODS
    // Figure clicked (TODO: emit)
    initMap: function () {
      //debugger;
      // Intial conditions
      let longInit = 3.25;
      let latInit = 41.47;
      let zoomInit = 9;
      if (window.GUIManager.mapView != undefined){
        longInit = parseFloat(window.GUIManager.mapView.split(",")[0]) || longInit;
        latInit = parseFloat(window.GUIManager.mapView.split(",")[1]) || latInit;
        zoomInit = parseFloat(window.GUIManager.mapView.split(",")[2]) || zoomInit;
      }
      
      // Initialize map
      this.map = new ol.Map({
        layers : [
          // Data layer
          this.layers.data,
          // Base layer
          this.layers.baseLayer,
          //this.layers.bathymetry,
          // Graticule layer
          this.layers.graticule,
          // Contours
          //this.layers.contours,
          // Raw HF Data
          // this.layers.rawHFData,
          // 12 nm
          //this.layers.eez12nm,
          // Shoreline
          this.layers.shoreline,
          
          // Ports
          //this.layers.portsLayer,
          // Fishing effort
          //this.layers.fishingEffort,
          // Land Mask
          //this.layers.landMask,

        ],
        target: 'map',
        //controls: ol.control.defaults({ attributionOptions: { collapsible: true } }),
        view: new ol.View({
          center: ol.proj.fromLonLat([longInit, latInit]),
          zoom: zoomInit,
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
          let radar = activeRadars[i];

          // WARNING: createImage might be useful to create radar previews.
          // TODO: HFRadar.data.timestamp {dataPoints: [X], imgData: ...}
          if (radar.images[tmst] == undefined){
            //let imgData = window.createImage(HFRadar, tmst);
            //radar.images[tmst] = imgData;
            radar.images[tmst] = null;
          }
          this.updateRadarData(radar, tmst, radar.images[tmst]);
        }

      }

    },

    // Remove HFRadar layers HFData, HFPoints
    removeHFlayers: function(){
      this.map.getLayers().getArray().slice().forEach(layerItem => {
          if (layerItem != undefined){
            let layerName = layerItem.get('name');
            if (layerName.includes('HFData') || 
            layerName.includes('HFPoints') || 
            layerName.includes('HFSelPoint')){
              this.map.removeLayer(layerItem);
            }
          }
        });
    },






    // Update radar data
    updateRadarData: function(radar, tmst, imgData) {
      // ID of the radar
      let radarID = radar.UUID;
      // let radarImgLayerName = 'HFData' + radarID;
      // // Image-Static data layer
      // // Add image layer with HF Radar data
      // this.layers[radarImgLayerName] = new ol.layer.Image({
      //   name: radarImgLayerName,
      //   source: new ol.source.ImageStatic({
      //     url: imgData.url,
      //     imageExtent: imgData.imageExtent,
      //     projection: imgData.projection
      //   }),
      // });
      // if (this.getMapLayer(radarImgLayerName)) this.map.removeLayer(this.getMapLayer(radarImgLayerName)); // Remove layer before adding. Not optimal but prettier
      //this.map.addLayer(this.layers[radarImgLayerName]);

      
      

      // Center on latest radar location
      //let location = radar.getRadarOrigin();
      //this.centerOnCoord(location);

      
      // Vector - Features layer
      // Show radar points
      // TODO: is this optimal?
      // Check if there is dataPoint feature defined
      let pointFeature;
      //radar.pointFeature = 'SNR (dB)'; // TODO HACK
      //pointFeature = radar.pointFeature;
      
      let featPoints = [];
      for (let i = 0; i<radar.data[tmst].length; i++){
        let dataPoint = radar.data[tmst][i];
        let featPoint = new ol.Feature({
          geometry: new ol.geom.Point(ol.proj.fromLonLat([dataPoint['Longitude (deg)'], dataPoint['Latitude (deg)']])),
        });
        // Define radius / color according to data point feature
        let pointRadius = 2;
        let pointColor = [255, 255, 255, 0.2];
        if (pointFeature !== undefined){
          let value = dataPoint[pointFeature];
          let featMax = radar.dataPointFeatures[pointFeature].max;
          let featMin = radar.dataPointFeatures[pointFeature].min;
          let normValue = (value - featMin)/(featMax - featMin);
          pointRadius *= normValue * 10;
        }


        featPoint.setStyle( new ol.style.Style({
          image: new ol.style.Circle({
            radius: pointRadius,
            fill: new ol.style.Fill({
              color: pointColor,
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
      // Add if radar is active
      // TODO: should this layer be created when it is not visible?
      let pointsVisible = false;
      if (radar.constructor.name == "HFRadar")
        pointsVisible = window.GUIManager.widgetHFRadars.isVisible && window.GUIManager.widgetHFRadars.arePointsVisible && window.GUIManager.widgetHFRadars.radarsVisible[radar.Site]
      else if (radar.constructor.name == "CombinedRadars")
        pointsVisible = window.GUIManager.widgetCombinedRadars.isVisible && window.GUIManager.widgetCombinedRadars.arePointsVisible;

      if (pointsVisible)
        this.map.addLayer(this.layers[radarPointsLayerName]);

    },



    // Update HFRadar points visibility
    updateHFRadarPointsVisibility: function(radar){
      let radarPointsLayerName = 'HFPoints' + radar.UUID;
      let guiState = radar.constructor.name == "HFRadar" ? window.GUIManager.widgetHFRadars : window.GUIManager.widgetCombinedRadars;
      // Remove layer
      if (radar.data == undefined){
        if (this.getMapLayer(radarPointsLayerName)) this.map.removeLayer(this.getMapLayer(radarPointsLayerName));
        if (this.getMapLayer('HFSelPoint')) this.map.removeLayer(this.getMapLayer('HFSelPoint'));
      }
      else if (!guiState.isVisible || !guiState.arePointsVisible || radar.data[window.GUIManager.currentTmst] == undefined){
        // Remove layer
        if (this.getMapLayer(radarPointsLayerName)) this.map.removeLayer(this.getMapLayer(radarPointsLayerName));
        if (this.getMapLayer('HFSelPoint')) this.map.removeLayer(this.getMapLayer('HFSelPoint'));
      } 
      // Add layer only if
      else if (guiState.isVisible && guiState.arePointsVisible){
        // Remove layers first
        if (this.getMapLayer(radarPointsLayerName)) this.map.removeLayer(this.getMapLayer(radarPointsLayerName));
        if (this.getMapLayer('HFSelPoint')) this.map.removeLayer(this.getMapLayer('HFSelPoint'));
        
        // If HFRadar is hidden
        if (radar.constructor.name == "HFRadar"){
          if (!guiState.radarsVisible[radar.Site]){
            return;
          }
        }

        // Add layer
        // Create if it does not exist
        if (this.layers[radarPointsLayerName] == undefined){
          this.updateRadarData(radar, window.GUIManager.currentTmst, undefined);
        } else
          this.map.addLayer(this.layers[radarPointsLayerName]);
      }
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
      let selRadar;
      // Find closest points or radars
      let radars = window.DataManager.getRadarsDataOn(window.GUIManager.currentTmst);//window.DataManager.HFRadars;
      if (Object.keys(radars).length != 0){
        // Iterate radar points and radars
        Object.keys(radars).forEach(key => {
          let radar = radars[key];
          // GUI state
          let guiState = radar.constructor.name == "HFRadar" ? window.GUIManager.widgetHFRadars : window.GUIManager.widgetCombinedRadars;
          // If radar has data, then check the proximity
          if (guiState.isVisible && guiState.arePointsVisible){ // AND IS SELECTED? TWO RADARS TOGETHER, HOW TO SELECT ONE OR THE OTHER DATAPOINT?
            for (let j = 0; j < radar.currentData.length; j++){
              let dataPoint = radar.currentData[j]; 
              // Calculate distance (could do it in km with the right formula, but this is interaction and it does not matter that much)
              let dist = Math.sqrt( Math.pow(dataPoint['Longitude (deg)'] - coord[0], 2) + Math.pow(dataPoint['Latitude (deg)'] - coord[1], 2));              
              // Find closest point
              if (dist < distMin){
                distMin = dist;
                closestDataPoint = dataPoint;
                selRadar = radar;
              }
            }
          }
        });

        
        
        // If point is closest, emit only if click is close to point in pixels
        // Limit by distance in pixels
        if (closestDataPoint){
          let epsg3857coord = ol.proj.fromLonLat([closestDataPoint['Longitude (deg)'], closestDataPoint['Latitude (deg)']]);
          let pixelCoord = this.map.getPixelFromCoordinate(epsg3857coord);

          let pixelDistance = Math.sqrt(Math.pow(evt.originalEvent.clientX - pixelCoord[0],2) + Math.pow(evt.originalEvent.clientY - pixelCoord[1],2));
          // Click distance to point
          if (pixelDistance < 60){
            window.eventBus.emit('Map_ClickedDataPoint', {"dataPoint": closestDataPoint, "radar": selRadar});
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
      // Source needs to reload (previous line triggers onTilesLoad)
      this.isLayerDataReady = false;
      // Update ForecastBar if it exists
      // this.$emit('changeWMSStyle', newStyle);
    },

    
    // Mouse move on map
    onMouseMove: function(event){
      // Return if map is moving
      if (this.isMapMoving)
        return;
      // Get lat long coordinates
      let coord = this.map.getCoordinateFromPixel([event.clientX, event.clientY]);
      //console.log(window.DataManager.isThereLand(...coord));
      coord = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');
      // Emit
      this.$emit('mouseMove', coord);
      // LEGEND TOOLTIPS
      // Change currents tooltip
      window.eventBus.emit('Map_MouseMove', [event.clientX, event.clientY, coord[0], coord[1]]);


      // Change legend tooltip value
      if (this.isLayerDataReady && !this.isRendering){
        let color = this.getDataAtPixel(event.clientX, event.clientY);
        window.eventBus.emit('Map_MouseOnData_WMSColor', color);
      }
      
    },

    // Map moves
    onMapMoveEnd: function(){
      this.isMapMoving = false;
      // If data is loaded, update the pixel information once the map move finishes
      // TODO: this could be optimized --> get a canvas with all data and relate lat-long to that canvas
      if (this.isLayerDataReady){

        if (this.getMapLayer('data') != undefined){
          if (this.getMapLayer('data').getOpacity() != 0){  
            this.updateSourceData();
            if (this.$refs.directionCanvas){
              this.$refs.directionCanvas.onMapMoveEnd();
            }
          }
        }
      }
      // Get center coordinates and zoom level
      let zoomLevel = this.map.getView().getZoom();
      let coord = this.map.getView().getCenter();
      let longlat = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');
      // Emit (GUIManager uses this event. TODO: Others such as AnimationEngine that register to map events could use this?)
      window.eventBus.emit('Map_MapMoveEnd', [longlat[0].toFixed(3), longlat[1].toFixed(3), zoomLevel.toFixed(2)]);
      // Hide/show wave info
      if (this.$refs.overlayWaveData){
        this.$refs.overlayWaveData.updatePanel(zoomLevel);
      }
      // Hide/show buoy info
      if (this.$refs.overlayBuoyData){
        this.$refs.overlayBuoyData.updatePanel(zoomLevel);
      }
      // Hide/show obsea info
      if (this.$refs.overlayOBSEAData){
        this.$refs.overlayOBSEAData.updatePanel(zoomLevel);
      }

    },
    onMapMoveStart: function(){
      this.isMapMoving = true;
    },




    // Declare loading tile events
    registerLoadTilesEvents: function(source, progress){
      // Source is a ol.source
      progress = progress || this.progress;
      progress.loading = 0;
      progress.loaded = 0;
      progress.isLoaded = false;
      progress.progressPercent = 0;

      source.on('tileloadstart',() => {
        progress.loading += 1;
        progress.isLoaded = false;
      });
      source.on('tileloadend', (e) => {
        progress.loaded += 1;
        progress.progressPercent = 100*progress.loaded/progress.loading;
        if (progress.loading == progress.loaded){
          this.onTilesLoaded(e); // TODO: could reference the isLayerDataReady to source, so we control if a source is ready
          progress.isLoaded = true;
        }
      });
      source.on('tileloaderror', (e) => {
        progress.loaded += 1;
        progress.progressPercent = 100*progress.loaded/progress.loading;
        if (progress.loading == progress.loaded){
          this.onTilesLoaded(e); // TODO: could reference the isLayerDataReady to source, so we control if a source is ready
          progress.isLoaded = true;
        }
      });
    },


    // Store pixel information once tiles are loaded
    onTilesLoaded: function(e){   
      if (e.target.name == 'wmsSource'){
        this.isLayerDataReady = true;
        this.updateSourceData();
      }
    },

    // Update the data pixels
    // This function can be called consecutively and as it is async, it can happen that all the layers are hidden.
    // To solve it, we need to keep the state when it is being rendered.
    updateSourceData: async function(){
      let map = this.map;

      // Reset array if it was rendered and store visible layers
      if (!this.isRendering){
        this.isRendering = true;

        this.visibilityArray = [];
        // Store visible layers state
        map.getLayers().forEach(ll => {
          this.visibilityArray.push(ll.getVisible());
        });
      }

      // Wait 800 ms
      await new Promise(res => setTimeout(res, 200));

      this.isRendering = true;

      // Hide all layers but the data layer
      map.getLayers().forEach(ll => {
          if (ll.C.name != "data")
            ll.setVisible(false);
        });
      
      // Force map render
      map.renderSync();

      // Get ol layer
      let layer = this.getMapLayer('data');
      // If layer was hidden by the user during the delay
      if (layer == undefined){
        this.isRendering = false;
        this.isLayerDataReady = false;
        // Restore map
        map.getLayers().forEach((ll, i) => {
          ll.setVisible(this.visibilityArray[i]);
        });
        return;
      }
      // Get canvas
      let tmpCnv = layer.getRenderer().getImage();
      // Set to willReadFrequently, as suggested by a warning when doing readbacks.
      let ctx = tmpCnv.getContext("2d", { willReadFrequently: true });
      // Store width to access pixels
      this.layerDataWidth = tmpCnv.width;
  
      
      // Get data
      this.layerData = ctx.getImageData(0,0,tmpCnv.width,tmpCnv.height);
      // For mobile versions, the canvas is scaled through a style. Openlayers does not have build in function 
      // to provide this scaling factor.
      // Get the width of the map container
      let mapEl = map.getTargetElement();
      if (this.layerData == undefined)
        debugger;
      this.layerData.scaleFactorX = mapEl.offsetWidth / tmpCnv.width;
      this.layerData.scaleFactorY = mapEl.offsetHeight / tmpCnv.height;

      // Debug data layer for mobile
      // for (let i = 0; i< this.layerData.width*this.layerData.height; i++ ){
      //   let alpha = this.layerData.data[i*4 + 3];
      //   if (alpha == 0){
      //     this.layerData.data[i*4] = 0;
      //     this.layerData.data[i*4 + 1] = 0;
      //     this.layerData.data[i*4 + 2] = 0;
      //     this.layerData.data[i*4 + 3] = 255;
      //   } else {
      //     this.layerData.data[i*4] = 255;
      //     this.layerData.data[i*4 + 1] = 0;
      //     this.layerData.data[i*4 + 2] = 0;
      //     this.layerData.data[i*4 + 3] = 255;
      //   }
      // }
      // ctx.putImageData(this.layerData, 0,0);

      // Debug, Test the data
      // tmpCnv.style['pointer-events'] = 'none';
      // tmpCnv.id = 'tmpCnv';
      // let el = document.getElementById('tmpCnv');
      // if (el)
      //   el.remove();
      // document.body.appendChild(tmpCnv); 


      // Restore map
      map.getLayers().forEach((ll, i) => {
        ll.setVisible(this.visibilityArray[i]);
      });
      map.renderSync();
      
      this.isRendering = false;

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
    centerOnCoord(coord, forceCenter){
      // Center map to track
      let view = this.map.getView();
      let currentZoom = view.getZoom();
      // Get extent
      let bbox = this.map.getView().calculateExtent(this.map.getSize());
      let coord3857 = ol.proj.fromLonLat([coord[0], coord[1]]);
      let isInsideBBOX = false;
      if (coord3857[0] > bbox[0] && coord3857[0] < bbox[2] && coord3857[1] > bbox[1] && coord3857[1] < bbox[3] )
        isInsideBBOX = true;

      // If point of interest is too far away from the center...
      // Get pixels from coordinate
      // let coordPixel = this.map.getPixelFromCoordinate(coord3857);
      // let centerBBOXPixel = this.map.getPixelFromCoordinate([bbox[2]*0.5 + bbox[0]*0.5, bbox[3]*0.5+bbox[1]*0.5]);
      // let distPixels = this.getDistance(coordPixel, centerBBOXPixel);
      // // Relationship
      // let smallestAspect = Math.min(...this.map.getSize());
      // let ratio = (smallestAspect-distPixels) / smallestAspect;
      // if (ratio < 0.6)
      //   forceCenter = true;
      

      if (!isInsideBBOX || forceCenter){ 
        view.animate({
          center: ol.proj.fromLonLat([coord[0], coord[1]]),
          zoom: Math.max(9.5, currentZoom),
          duration: 1000,
        });
      }
    },





    // UTILS
    getDistance: function(posA, posB){
      return Math.sqrt( Math.pow(posA[0] - posB[0], 2) + Math.pow(posA[1] - posB[1], 2));
    },







    // PUBLIC METHODS
    // Get OL map object
    getOLMap: function(){
      return this.map;
    },



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
      source.name="wmsSource";
      this.getMapLayer('data').setSource(source);
      // Tracking the load progress
      this.isLayerDataReady = false;
      this.registerLoadTilesEvents(source, this.wmsProgress);
      
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
    "animationCanvas": AnimationCanvas,
    "climaDirectionCanvas": ClimaDirectionCanvas,
    "bottom-section": BottomSection,
    "overlay-wave-data": OverlayWaveData,
    "overlay-buoy-data": OverlayBuoyData,
    "overlay-obsea-data": OverlayOBSEAData,
},
  computed: {
      //foo: function () {}
  }
}
</script>











<style scoped>

#app-map {
  width: 100%;
  height: 100%;
  position: relative;
}

#map {
  width: 100%;
  height: 100%;
  /* background-color: rgb(255, 138, 138); */
  background-color: var(--darkBlue);
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