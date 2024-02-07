<template>
  <!-- Container -->
  <div id='widgetCombinedRadars' class="widget" ref='widgetCombinedRadars'>

    <!-- Title -->
    <div class="titleWidget" :class="{'titleWidget-closed': !isVisible}">
      <h4>Currents</h4>
      <onOffButton ref="onOffCurrents" :checked="true" :inSize="'18px'" @change="currentsOnOffButtonClicked($event)"></onOffButton>

      <div class="icon-str" @click="infoClicked()" v-show="isVisible">i</div>
      <!-- TODO GRAPH ICON -->
    </div>

    <Transition>
    <div v-show="isVisible">
    <!-- Buttons animation and points -->
    <div id="buttonsContainer">

      <!-- On/Off particle animation -->
      <div class='widgetButtonContainer'>
        <onOffButton ref="onOffParticles" :checked="areParticlesVisible" :inSize="'15px'" @change="particlesButtonClicked($event)"></onOffButton>
        <span class='widgetSpan'>particles</span>
      </div>

      <!-- On/Off points -->
      <div class='widgetButtonContainer'>
        <onOffButton ref="onOffPoints" :checked="arePointsVisible" :inSize="'15px'" @change="pointsButtonClicked($event)"></onOffButton>
        <span class='widgetSpan'>points</span>
      </div>
      <!-- Maybe point variable too here? -->
    </div>
  

    <!-- Animation legend -->
    <legendGUI ref="legendGUI"
      :legendName="defaultLegendName" 
      :legendRange="defaultLegendRange"
      :defaultUnits="defaultUnits"
      :selectedLegends="selectedLegends"

      @legendChanged="legendChanged"
      @rangeClicked="rangeClicked()"
      @unitsClicked="unitsClicked()"

    ></legendGUI>
    </div>
    </Transition>

    
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
    // When new data loads, usually the widget also should be shown (with particles on) --> not necessarily?
    // window.eventBus.on('HFRadarDataLoaded', tmst => {
    //   this.currentsOnOffButtonClicked({target: {checked: true}});
    // });


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
    });

    // User moves mouse on map
    window.eventBus.on('GUIManager_MouseMovingCurrentsValue', magnitude => {
      this.$refs.legendGUI.setCurrentValue(magnitude);
    });


    // Advanced interface
    window.eventBus.on("AdvancedInterfaceOnOff", state => {
      // Reset state in simple interface
      if (!state){
        let initialGUIState = this.getInitialState();
        Object.keys(initialGUIState).forEach(key => {
          this[key] = initialGUIState[key];
        });
        // Fake button actions
        this.$refs.onOffCurrents.setChecked(true);
        this.$refs.onOffParticles.setChecked(this.areParticlesVisible);
        this.$refs.onOffPoints.setChecked(this.arePointsVisible);
        if (this.$refs.legendGUI.legendsLoaded){
          this.$refs.legendGUI.setLegendColorScale(this.defaultLegendName);
          this.$refs.legendGUI.setRange(this.defaultLegendRange);
        }
      }
    });
    
  },
  data (){
    return this.getInitialState();
  },
  methods: {
    // INITIAL STATE
    getInitialState: function(){
      return {
        defaultLegendName: 'absModifiedOccam',
        defaultLegendRange: [0, 100], // TODO: this is defined in the data manager, or it should be in DataTypes somewhere?
        defaultUnits: 'cm/s',
        selectedLegends: ['absModifiedOccam.png', 'absColdOccam.png', 'white.png', 'black.png' ],
        isVisible: true,
        areParticlesVisible: true,
        arePointsVisible: false,
      }
    },


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
    currentsOnOffButtonClicked: function(e){
        this.isVisible = e.target.checked;
        window.GUIManager.widgetCombinedRadars.isVisible = e.target.checked;
        window.GUIManager.isDataPointSelected = false;
        window.eventBus.emit("WidgetCombinedRadars_VisibilityChanged", e.target.checked);
        if (e.target.checked)
          this.$refs.onOffParticles.setChecked(true); // TODO: This triggers the button (particlesButtonClicked), not optimal

    },
    infoClicked: function(e){
      window.eventBus.emit("Widget_InfoClicked");
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



.v-enter-active,
.v-leave-active {
  transition: all 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

</style>