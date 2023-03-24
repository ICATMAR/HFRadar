<template>
  <!-- Container -->
  <div id='widgetCombinedRadars' class="widget" ref='widgetCombinedRadars'>

    <!-- Title -->
    <div class="titleWidget" :class="{'titleWidget-closed': !isVisible}">
      <h4>Currents</h4>
      <div class="icon-str" @click="infoClicked()">i</div>
      <div class="icon-str icon-str-close" v-show="isVisible" @click="crossClicked()"></div>
      <div class="icon-str icon-str-open" v-show="!isVisible" @click="openClicked()"></div>
      <!-- TODO GRAPH ICON -->
    </div>

    <!-- Buttons animation and points -->
    <div id="buttonsContainer" v-show="isVisible">

      <!-- On/Off particle animation -->
      <div class='buttonContainer'>
        <onOffButton :checked="true" :inSize="'18px'" @change="particlesButtonClicked($event)"></onOffButton>
        <span>particles</span>
      </div>

      <!-- On/Off points -->
      <div class='buttonContainer'>
        <onOffButton :checked="true" :inSize="'18px'" @change="pointsButtonClicked($event)"></onOffButton>
        <span>points</span>
      </div>
      <!-- Maybe point variable too here? -->
    </div>

    <!-- Animation legend -->
    <legendGUI ref="legendGUI" v-show="isVisible"
      :legendName="defaultLegendName" 
      :legendRange="defaultLegendRange"
      :defaultUnits="defaultUnits"
      :selectedLegends="selectedLegends"

      @legendChanged="legendChanged"
      @rangeClicked="rangeClicked()"
      @unitsClicked="unitsClicked()"

      ></legendGUI>

      <div :style="{'padding-bottom': isVisible ? '30px' : '10px'}"></div>
  </div>
</template>


<script>

// Import components
import LegendGUI from "./LegendGUI.vue";
import OnOffButton from "./OnOffButton.vue";

export default {
  name: 'widgetCombinedRadars', // Caps, no -
  created() {

  },
  mounted() {

    // Load default legend
    if (!this.legend){
      console.log('./Assets/Legends/' + this.defaultLegendName + '.png');
      window.FileManager.getLegend('./Assets/Legends/' + this.defaultLegendName + '.png', 20)
        .then(legend => {
          // Set default legend
          this.legend = legend;
          // Update animation canvas
          // TODO HOW TO RELATE WIDGET WITH ANIMATION PARAMETERS?
          window.eventBus.emit('WidgetCombinedRadars_updateLegend', this.legend);
        })
        .catch(e => console.error("something went wrong here: " + e));
    }



    // Default values
    this.currentRange = this.defaultLegendRange;
    this.currentUnits = this.defaultUnits;
    

    // EVENTS
    // When legends are loaded
    // window.eventBus.on('AppManagerLegendsLoaded', (legends) => {
      // Store legends when successfully loaded
      // this.legends = [];
      // legends.forEach(ll => {
      //   if (ll.status == 'fulfilled'){
      //     this.legends.push(ll.value);
      //   }
      // })
      // this.legendsLoaded = true;
      // this.legendSrc = this.legends[this.legendIndex].img.src;
      // this.emitLegendChanged(this.legends[this.legendIndex]);
    // });


    // When mouse clicks a data point
    // TODO: legendRange should be for each data displayed
    // TODO: this event should have information about the data type. It is possible that it should be received in AnimationCanvas.vue
    window.eventBus.on('ClickedDataPoint', e => {
      let dataPoint = e.dataPoint;
      let radar = e.radar;
      let currentValue = '';
      if (dataPoint['Velocity (cm/s)'] && radar.constructor.name == "CombinedRadars"){
        currentValue = dataPoint['Velocity (cm/s)'].toFixed(1);
      }
      this.$refs.legendGUI.setCurrentValue(currentValue);
    })


    
  },
  data (){
    return {
      defaultLegendName: 'absModifiedOccam',
      defaultLegendRange: [0, 100], // TODO: this is defined in the data manager, or it should be in DataTypes somewhere?
      defaultUnits: 'cm/s',
      selectedLegends: ['absModifiedOccam.png', 'absColdOccam.png', 'absGrayScale.png', 'absGrayScaleReverse.png' ],
      isVisible: true,
    }
  },
  methods: {
    // LEGEND EMITS
    legendChanged: function(legendObj){
      window.eventBus.emit('WidgetCombinedRadars_LegendChanged', legendObj);
    },


    rangeClicked: function(e){
      
      // 50, 100, 150, 200
      let it = 4*(this.currentRange[1])/200;

      let farRange = Math.round((it % 4)*50 + 50);

      this.currentRange[1] = farRange;

      this.$refs.legendGUI.setRange(this.currentRange);
    },

    unitsClicked: function(e){
      let units = ['cm/s', 'm/s', 'mph', 'km/h'];
      let transformFunc = [
        (value) => {return value}, // cm/s
        (value) => {return (value/100).toFixed(2)}, // m/s
        (value) => {return (2.2369*value/100).toFixed(2)}, // mph
        (value) => {return (3.6*value/100).toFixed(2)} // km/h
      ];

      // Find current units
      let currentIndex = units.indexOf(this.currentUnits);
      let nextIndex = (currentIndex+1) % units.length;
      this.currentUnits = units[nextIndex];
      this.$refs.legendGUI.setUnits(this.currentUnits, transformFunc[nextIndex]);
    },



    // USER INTERACTION
    infoClicked: function(e){
      window.eventBus.emit("Widget_InfoClicked");
    },
    crossClicked: function(e){
      // Deactivate all CombinedRadars
      window.eventBus.emit("WidgetCombinedRadars_VisibilityChanged", false);
      this.isVisible = false;
    },
    openClicked: function(){
      window.eventBus.emit("WidgetCombinedRadars_VisibilityChanged", true);
      this.isVisible = true;
    },
    particlesButtonClicked: function(e){
      window.eventBus.emit('WidgetCombinedRadars_AnimationActiveChanged', e.target.checked);
    },
    pointsButtonClicked: function(e){
      window.eventBus.emit('WidgetCombinedRadars_PointsActiveChanged', e.target.checked);
    }

  },
  components: {
    "legendGUI": LegendGUI,
    "onOffButton": OnOffButton,
  }
}
</script>




<style scoped>
#widgetCombinedRadars {
  z-index: 11;
}

#buttonsContainer {
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: center;
}

.buttonContainer {
  display:flex;
  flex-wrap: nowrap;
  padding: 10px;
}

#buttonsWidget > div {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
}

span {
  color: white;
  text-shadow: 0px 0px 4px black;
  font-size: small;
  padding-left: 3px;
  padding-right: 3px;
}
</style>