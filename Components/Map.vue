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


      <!-- Widget base layer options-->
      <widgetMapOptions></widgetMapOptions>


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
import WidgetMapOptions from "./WidgetMapOptions.vue";
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
    window.eventBus.on('SelectedDateChanged', (tmst) =>{
      this.selectedDateChanged(tmst);
    });
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
    window.eventBus.on('SidePanelRadarActiveChange', (HFRadar) => {
      // Hide / show HF points
      this.updateHFRadarPointsVisibility(HFRadar);
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

    // EXTERNAL EVENTS
    // RADARS
    radarTypePointsActiveChanged: function(radarType, active){
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        if (radar.constructor.name == radarType && radar.isActivated){
          radar.pointsVisible = active;
          // Update map layers
          this.updateHFRadarPointsVisibility(radar);
        }
      });
    },
    radarTypeVisibilityChanged: function(radarType, areVisible){
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        if (radar.constructor.name == radarType){
          radar.isActivated = areVisible;
          this.updateHFRadarPointsVisibility(radar);
        }
      });
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
          // Contours
          //this.layers.contours,
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
      // Make all radars inactive
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        window.DataManager.HFRadars[key].hasDataOnTmst = false;
      });


      // Get current active radars on that date
      let activeRadars = window.DataManager.getRadarsDataOn(tmst);
      if (activeRadars.length != 0 ){
        for (let i = 0; i < activeRadars.length; i++){
          let HFRadar = activeRadars[i];
          HFRadar.hasDataOnTmst = true;

          // WARNING: createImage might be useful to create HFRadar previews.
          // TODO: HFRadar.data.timestamp {dataPoints: [X], imgData: ...}
          if (HFRadar.images[tmst] == undefined){
            //let imgData = window.createImage(HFRadar, tmst);
            //HFRadar.images[tmst] = imgData;
            HFRadar.images[tmst] = null;
          }
          this.updateHFRadarData(HFRadar, tmst, HFRadar.images[tmst]);
        }

        }

      // Vector - HFRadar Icons
      this.updateHFRadarIcons();
    },

    // Remove HFRadar layers HFData, HFIcon, HFPoints
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



    // Update HFRadar icons
    // Show current radars and change the opacity of the icon if they have no data on that day
    updateHFRadarIcons: function(){
      let radars = window.DataManager.HFRadars;
      // If layer does not exists, create one
      if (!this.layers['HFIcons']){
        this.layers['HFIcons'] = new ol.layer.Vector({
          name: 'HFIcons',
          source: new ol.source.Vector({
            features: []
          })
        });
        // Add to map
        this.map.addLayer(this.layers['HFIcons']);
      }

      let layerIcons = this.layers['HFIcons'];
      // Get current features
      //let features = layerIcons.getSource().getFeatures();
      // debugger;
      // Update features (one per HFRadar)
      Object.keys(radars).forEach(key => {
        // Only for radars, not for tots (combined)
        let radar = radars[key];
        if (!radar.dataGrid) {
        
          // Create feature style
          let featStyle = new ol.style.Style({
            image: new ol.style.Icon({
              src: 'Assets/Images/antenna.png',
              width: 10,
              height: 10,
              scale: [0.5, 0.5],
              opacity: radar.hasDataOnTmst ? 1 : 0.3,
            })
          });

          let feature = layerIcons.getSource().getFeatureById(key);
          // Create feature if it does not exist
          if (feature == null){
            // let locationStr = radar.header.Origin;
            // let location = locationStr.replace(/\s\s+/g, ',').replace(',', '').replace('\r', '').split(',');
            // location = location.reverse();
            let location = radar.getRadarOrigin();
            feature = new ol.Feature({
              name: 'HFRadarIcon' + key,
              geometry: new ol.geom.Point(ol.proj.fromLonLat(location)),
            });
            // Set feature id
            feature.setId(key);
            feature.setStyle(featStyle);
            layerIcons.getSource().addFeature(feature);
          } else
            feature.setStyle(featStyle);
        }

      }); // End of HFRadars iteration
      
    },



    // Update HFRadar data
    updateHFRadarData: function(HFRadar, tmst, imgData) {
      // ID of the radar
      let radarID = HFRadar.UUID;
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
      let location = HFRadar.getRadarOrigin();
      this.centerOnCoord(location);

      
      // Vector - Features layer
      // Show radar points
      // TODO: is this optimal?
      // Check if there is dataPoint feature defined
      let pointFeature;
      //HFRadar.pointFeature = 'SNR (dB)'; // TODO HACK
      //pointFeature = HFRadar.pointFeature;
      
      let featPoints = [];
      for (let i = 0; i<HFRadar.data[tmst].length; i++){
        let dataPoint = HFRadar.data[tmst][i];
        let featPoint = new ol.Feature({
          geometry: new ol.geom.Point(ol.proj.fromLonLat([dataPoint['Longitude (deg)'], dataPoint['Latitude (deg)']])),
        });
        // Define radius / color according to data point feature
        let pointRadius = 2;
        let pointColor = [255, 255, 255, 0.2];
        if (pointFeature !== undefined){
          let value = dataPoint[pointFeature];
          let featMax = HFRadar.dataPointFeatures[pointFeature].max;
          let featMin = HFRadar.dataPointFeatures[pointFeature].min;
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
      if (HFRadar.isActivated && HFRadar.pointsVisible)
        this.map.addLayer(this.layers[radarPointsLayerName]);



    },



    // Update HFRadar points visibility
    updateHFRadarPointsVisibility: function(radar){
      let radarPointsLayerName = 'HFPoints' + radar.UUID;
      if (!radar.isActivated || !radar.pointsVisible){
        // Remove layer
        if (this.getMapLayer(radarPointsLayerName)) this.map.removeLayer(this.getMapLayer(radarPointsLayerName));
      } else if (radar.isActivated && radar.pointsVisible){
        // Add layer
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
      let closestRadar = undefined;
      // Find closest points or radars
      let radars = window.DataManager.HFRadars;
      if (Object.keys(radars).length != 0){
        // Iterate radar points and radars
        Object.keys(radars).forEach(key => {
          let radar = radars[key];
          // If radar has data, then check the proximity
          if (radar.hasDataOnTmst && radar.isActivated){ // AND IS SELECTED? TWO RADARS TOGETHER, HOW TO SELECT ONE OR THE OTHER DATAPOINT?
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
        // Check if the radar is closest than a datapoint
        Object.keys(radars).forEach(key => {
          let radar = radars[key];
          // Radar distance
          let location = radar.getRadarOrigin();
          // Find if a radar is the closest
          let dist = this.getDistance(location, coord);
          if (dist < distMin && radar.hasDataOnTmst){
            distMin = dist;
            closestRadar = radar;
          }
        });
        // If a radar is closest
        if (closestRadar !== undefined){
          window.eventBus.emit('ClickedHFRadar', closestRadar);
        }
        
        
        // If point is closest, emit only if click is close to point in pixels
        // Limit by distance in pixels
        else if (closestDataPoint){
          let epsg3857coord = ol.proj.fromLonLat([closestDataPoint['Longitude (deg)'], closestDataPoint['Latitude (deg)']]);
          let pixelCoord = this.map.getPixelFromCoordinate(epsg3857coord);

          let pixelDistance = Math.sqrt(Math.pow(evt.originalEvent.clientX - pixelCoord[0],2) + Math.pow(evt.originalEvent.clientY - pixelCoord[1],2));
          // Click distance to point
          if (pixelDistance < 60){
            window.eventBus.emit('ClickedDataPoint', {"dataPoint": closestDataPoint, "radar": selRadar});
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
    




    // UTILS
    getDistance: function(posA, posB){
      return Math.sqrt( Math.pow(posA[0] - posB[0], 2) + Math.pow(posA[1] - posB[1], 2));
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
    "widgetMapOptions": WidgetMapOptions,
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