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
      <div class='widgetButtonContainer'>
        <onOffButton ref="onOffParticles" :checked="areParticlesVisible" :inSize="'18px'" @change="particlesButtonClicked($event)"></onOffButton>
        <span class='widgetSpan'>particles</span>
      </div>

      <!-- On/Off points -->
      <div class='widgetButtonContainer'>
        <onOffButton :checked="arePointsVisible" :inSize="'18px'" @change="pointsButtonClicked($event)"></onOffButton>
        <span class='widgetSpan'>points</span>
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
import OnOffButton from "../OnOffButton.vue";

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
    // When new data loads, usually the widget also should be shown (with particles on)
    window.eventBus.on('HFRadarDataLoaded', tmst => {
      this.openClicked();
    });


    // When mouse clicks a data point
    // TODO: legendRange should be for each data displayed
    // TODO: this event should have information about the data type. It is possible that it should be received in AnimationCanvas.vue
    window.eventBus.on('Map_ClickedDataPoint', e => {
      let dataPoint = e.dataPoint;
      let radar = e.radar;
      let currentValue = '';
      if (dataPoint['Velocity (cm/s)'] && radar.constructor.name == "CombinedRadars"){
        currentValue = dataPoint['Velocity (cm/s)'].toFixed(1);
      }
      this.$refs.legendGUI.setCurrentValue(currentValue);
    })


    window.eventBus.on('GUIManager_MouseMovingCurrentsValue', magnitude => {
      this.$refs.legendGUI.setCurrentValue(magnitude);
    })

    
  },
  data (){
    return {
      defaultLegendName: 'absModifiedOccam',
      defaultLegendRange: [0, 100], // TODO: this is defined in the data manager, or it should be in DataTypes somewhere?
      defaultUnits: 'cm/s',
      selectedLegends: ['absModifiedOccam.png', 'absColdOccam.png', 'absGrayScale.png', 'absGrayScaleReverse.png' ],
      isVisible: true,
      areParticlesVisible: true,
      arePointsVisible: false,
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
      this.isVisible = false;
      window.GUIManager.widgetCombinedRadars.isVisible = false;
      window.GUIManager.isDataPointSelected = false;
      window.eventBus.emit("WidgetCombinedRadars_VisibilityChanged", false);
    },
    openClicked: function(){
      this.isVisible = true;
      window.GUIManager.widgetCombinedRadars.isVisible = true;
      window.GUIManager.widgetCombinedRadars.areParticlesVisible = true;
      this.$refs.onOffParticles.setChecked(true); // TODO: This triggers the button (particlesButtonClicked), not optimal
      window.GUIManager.isDataPointSelected = false;
      window.eventBus.emit("WidgetCombinedRadars_VisibilityChanged", true);
    },
    particlesButtonClicked: function(e){
      window.GUIManager.widgetCombinedRadars.areParticlesVisible = e.target.checked;
      window.eventBus.emit('WidgetCombinedRadars_AnimationActiveChanged', e.target.checked);
    },
    pointsButtonClicked: function(e){
      window.GUIManager.widgetCombinedRadars.arePointsVisible = e.target.checked;
      window.GUIManager.isDataPointSelected = false;
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


#buttonsWidget > div {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
}

</style>