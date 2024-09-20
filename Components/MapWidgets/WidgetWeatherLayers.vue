<template>
  <!-- Container -->
  <div id='widgetWeatherLayers' ref='widgetWeatherLayers'>

    <!-- Desktop -->
    <template class="isHiddenInMobile">
      <div class="vertical-container">
        <div class="clickable cLayerContainer" :key="cLayer" v-for="(cLayer, index) in climaLayers">
          <button :class="[selClimaLayer == cLayer ? 'button-active' : 'clickable']" @click='climaLayerClicked(cLayer)'
            :title="$t(cLayer)">
            <span class="fa" v-html="climaIcons[index]"></span>
          </button>
          <span @click='climaLayerClicked(cLayer)'>{{ $t(cLayer) }}</span>
        </div>
      </div>
    </template>

    <!-- Mobile -->
    <template class="isShownInMobile">
      <div class="vertical-container">
        <!-- Selected clima layer -->
        <div class="cLayerContainer">
          <button class='button-active' :title="$t(selClimaLayer)">
            <span class="fa" v-html="climaIcons[climaLayers.indexOf(selClimaLayer)]"></span>
          </button>
          <span>{{ $t(selClimaLayer) }}</span>
        </div>
        <!-- Other clima layers-->
        <div class="horizontal-container">
          <div class="clickable cLayerContainer cLayerIconOnly" :key="cLayer" v-for="(cLayer, index) in climaLayers">
            <button :class="[selClimaLayer == cLayer ? 'button-active' : 'clickable']"
              @click='climaLayerClicked(cLayer)' :title="$t(cLayer)">
              <span class="fa" v-html="climaIcons[index]"></span>
            </button>
          </div>
        </div>
      </div>

    </template>

    <!-- WMTS graphic legend -->
    <wmts-legend ref="wmtsLegend"></wmts-legend>

    <!-- Current date -->
    <span>{{ $t('Date') }}: {{ currentDate }}</span>

    <!-- Data source attribution -->
    <span class="wrapText">{{ $t('Data from') }}: <a title="Weather data source" :href="sourceDoi" target="_blank">{{
      productName }}</a></span>



  </div>
</template>


<script>

// Import components
import WMTSLegend from './WMTSLegend.vue';

export default {
  name: 'widgetWeatherLayers', // Caps, no -
  created() {
    // Create data retriever
    this.dataRetriever = window.WMTSDataRetriever;
  },
  mounted() {
    // EVENTS
    // Date changed
    window.eventBus.on('DataStreamsBar_SelectedDateChanged', this.updateClimaLayer);
    // Initial load and user changing hash TIME in URL
    window.eventBus.on('GUIManager_URLDateChanged', this.updateClimaLayer);
    // User clicked on Active sync and turned it on
    window.eventBus.on('TopRightCanvas_ActiveSyncClickedAndOn', this.updateClimaLayer);

  },
  data() {
    return {
      climaLayers: [
        'Current',
        'Sea Surface Temperature',
        'Sea Temperature Anomaly',
        'Sea Bottom Temperature',
        'Chlorophyll',
        'Salinity',
        'Wave Significant Height',
        //'Wind', 
      ],
      // https://origin.fontawesome.com/search?o=r&m=free&f=classic
      climaIcons: [
        '&#xf773;',
        '&#xf2c9;<sub>~</sub>',
        '&#x2206; &#xf2c9;',
        '&#xf2c9;<sup>~</sup>',
        'C<sub>hl</sub>',
        '‰',
        '&#xe515;',
        //'&#xf72e', 
      ],
      selClimaLayer: '',
      isClimaLayerVisible: false,
      climaOpacity: 1,
      // Defaults
      WMTSLegendURL: '',
      sourceDoi: '',
      productName: '',
      currentDate: '',
    }
  },
  methods: {
    // USER INTERACTION
    climaLayerClicked: function (cLayer) {
      this.selClimaLayer = cLayer;
      // Update clima layer
      this.updateClimaLayer();
    },


    // PRIVATE METHODS
    updateClimaLayer: function () {
      if (this.selClimaLayer == undefined || this.selClimaLayer == '')
        return
      if (!this.isClimaLayerVisible)
        return

      // Get date
      let date = window.GUIManager.currentTmst;
      if (date == undefined) {
        setTimeout(this.updateClimaLayer, 1000);
        console.log("Current date not found. Trying to update clima layer in 1s.");
        return;
      }
      // Get clima URL
      // Get clima URL
      let id = this.dataRetriever.getDataSetIdFromDataName(this.selClimaLayer);
      if (id == undefined) {
        debugger;
        // It should not be shown if this dataset does not exist or the name is not found
        console.log(this.selClimaLayer + " not found.");
        window.eventBus.emit('WidgetWeatherLayers_ClimaLayerChange', undefined);
        return;
      }

      let dataSet = this.dataRetriever.getDataSet(id, 'h', date);
      if (dataSet == undefined) {
        // TODO: SHOW THAT IT IS NOT AVAILABLE
        // --> Should I also check if the URLs work? maybe try a getValueAt? It doubles the requests, but it improves the UI. 
        // Actually the best would be to catch the error of requesting a wmts tile. Can we get this from Openlayers? Otherwise, force getValueAt
        // Maybe the WMTS always provides data, as the service now returns the closest timestamp.
        debugger;
      }
      // Attribution link
      this.sourceDoi = dataSet.doi;
      this.productName = dataSet.productProvider + ' - ' + dataSet.productName;
      // Other properties for mapMouseMove event
      this.timeScale = dataSet.timeScale;
      this.currentTmst = date;
      // Direction properties of dataSet (can be shown in legend WMTS)
      this.dataSetAnimation = dataSet.animation;

      let wmtsParams = {
        dataSet,
        tmst: date,
        // style TODO (range and style) https://help.marine.copernicus.eu/en/articles/6478168-how-to-use-wmts-to-visualize-data#h_1fab3939db
      };

      // Update legend
      this.$refs.wmtsLegend.selectLegendsAssociatedWithDataSet(id);
      window.eventBus.emit('WidgetWeatherLayers_ClimaLayerChange', wmtsParams);

      // let infoWMS = this.dataRetriever.getDataTypeURL(this.selClimaLayer, date, 'h');
      // this.sourceDoi = infoWMS == undefined ? 'https://resources.marine.copernicus.eu/products' : infoWMS.doi;
      // // If source is not found, it will send undefined
      // window.eventBus.emit('WidgetWeatherLayers_ClimaLayerChange', infoWMS);
      // // Set legend
      // this.$refs.wmsLegend.setWMSLegend(infoWMS);
    },


    // PUBLIC METHODS
    setVisible: function (isVisible) {
      this.isClimaLayerVisible = isVisible;
      if (isVisible) {
        // Default clima layer if not defined
        this.selClimaLayer = this.selClimaLayer == '' ? 'Sea Surface Temperature' : this.selClimaLayer;
        this.updateClimaLayer();
      } else {
        window.eventBus.emit('WidgetWeatherLayers_ClimaLayerChange', undefined);
      }
    }

  },
  components: {
    'wmts-legend': WMTSLegend,
  }
}
</script>




<style scoped>
#widgetWeatherLayers {
  z-index: 11;
  user-select: none;

  padding-top: 0px !important;
  margin-top: -8px !important;

  max-height: 100%;

  display: flex;
  flex-direction: column !important;
  align-items: flex-start !important;
}


.vertical-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 8px;
}

.isShownInMobile {
  display: none;
}

.isHiddenInMobile {
  display: block;
}


.cLayerContainer {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 2px;
  background: #0000003b;
  padding-right: 4px;
  border-radius: 30px;

  height: clamp(10px, 3vh, 30px);
}

span {
  font-size: clamp(0.6rem, 1.2vw, 0.8rem);
}

.wrapText {
  inline-size: 190px;
  overflow-wrap: break-word;
  pointer-events: all;
}



@media screen and (max-width: 500px),
screen and (max-height: 850px) {

  /* TODO: ELEMENTS IN A ROW, AS IN WINDY */
  .cLayerIconOnly {
    background: none;
    padding: 0px;
    margin: 1px;
  }

  .horizontal-container {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: flex-start;
    padding: 8px;
  }

  .isShownInMobile {
    display: block;
  }

  .isHiddenInMobile {
    display: none;
  }

}
</style>