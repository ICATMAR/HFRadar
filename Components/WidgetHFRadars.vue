<template>
  <!-- Container -->
  <div id='widgetHFRadars' class="widget" ref='widgetHFRadars'>

    <!-- Title -->
    <div class="titleWidget" :class="{'titleWidget-closed': !isVisible}">
      <h4>High-Freq. Radars</h4>
      <div class="icon-str" @click="infoClicked()">i</div>
      <div class="icon-str icon-str-close" v-show="isVisible" @click="crossClicked()"></div>
      <div class="icon-str icon-str-open" v-show="!isVisible" @click="openClicked()"></div>
      <!-- TODO GRAPH ICON - REPRESENTATION -->
    </div>


    <!-- Existing radars -->
    <div id="existingRadarsContainer" v-show="isVisible">
      <div v-for="radar in radars">
        <button class="widgetButtonHFRadar" 
          :class="{'widgetButtonHFRadar-active': radar.isActivated, 'widgetButtonHFRadar-unavailable': radar.hasDataOnTimestamp}" 
          @click="radarActivatedChanged(radar)">
            {{ radar.Site }}
        </button>
      </div>
    </div>


    <!-- Buttons animation and points -->
    <div id="buttonsContainer" v-show="isVisible">

      <!-- On/Off particle animation -->
      <div class='widgetButtonContainer'>
        <onOffButton :checked="true" :inSize="'18px'" @change="particlesButtonClicked($event)"></onOffButton>
        <span class='widgetSpan'>particles</span>
      </div>

      <!-- On/Off points -->
      <div class='widgetButtonContainer'>
        <onOffButton :checked="true" :inSize="'18px'" @change="pointsButtonClicked($event)"></onOffButton>
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
  </div>
</template>


<script>

// Import components
import LegendGUI from "./LegendGUI.vue";
import OnOffButton from "./OnOffButton.vue";

export default {
  name: 'widgetHFRadars', // Caps, no -
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
          window.eventBus.emit('WidgetHFRadars_updateLegend', this.legend);
        })
        .catch(e => console.error("something went wrong here: " + e));
    }



    // Default values
    this.currentRange = this.defaultLegendRange;
    this.currentUnits = this.defaultUnits;
    

    // EVENTS
    // On radars load
    // Store a version of the radar here
    window.eventBus.on('HFRadarDataLoaded', ()=>{
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        if (radar.constructor.name == "HFRadar"){
          let availableTimestamps = Object.keys(radar.data);
          if (this.radars[key] == undefined){
            this.radars[key] = {
              UUID: key, 
              Site: radar.Site.replace(' ""', ''), // TODO: prettify
              isActivated: radar.isActivated,
              availableTimestamps,
            }
          }
        }
      });
    });
    // When mouse clicks a data point
    window.eventBus.on('Map_ClickedDataPoint', e => {
      let dataPoint = e.dataPoint;
      let radar = e.radar;
      let currentValue = '';
      if (dataPoint['Velocity (cm/s)'] && radar.constructor.name == "HFRadar"){
        currentValue = dataPoint['Velocity (cm/s)'].toFixed(1);
      }
      this.$refs.legendGUI.setCurrentValue(currentValue);
    })


    
  },
  data (){
    return {
      defaultLegendName: 'BlueWhiteRed',
      defaultLegendRange: [-100, 100], // TODO: this is defined in the data manager, or it should be in DataTypes somewhere?
      defaultUnits: 'cm/s',
      selectedLegends: ['BlueWhiteRed.png', 'GreenBlueWhiteOrangeRed.png', 'ModifiedOccam.png', 'DarkScaleColors.png' ],
      isVisible: false,
      radars: {},
    }
  },
  methods: {
    // LEGEND EMITS
    legendChanged: function(legendObj){
      window.eventBus.emit('WidgetHFRadars_LegendChanged', legendObj);
    },


    rangeClicked: function(e){
      
      // 50, 100, 150, 200
      let it = 4*(this.currentRange[1])/200;

      let farRange = Math.round((it % 4)*50 + 50);

      this.currentRange[1] = farRange;
      this.currentRange[0] = -farRange;

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
      // Deactivate all radars
      window.eventBus.emit("WidgetHFRadars_VisibilityChanged", false);
      this.isVisible = false;
    },
    openClicked: function(){
      window.eventBus.emit("WidgetHFRadars_VisibilityChanged", true);
      this.isVisible = true;
      // Get activated states (assumes that the emit is executed faster?) // WARN WATCH
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        if (radar.constructor.name == "HFRadar"){
          if (this.radars[key] == undefined){
            // Create new radar
            // should never happen
            debugger;
          } else {
            this.radars[key].isActivated = radar.isActivated;
          }
        }
      })
    },
    particlesButtonClicked: function(e){
      window.eventBus.emit('WidgetHFRadars_AnimationActiveChanged', e.target.checked);
    },
    pointsButtonClicked: function(e){
      window.eventBus.emit('WidgetHFRadars_PointsActiveChanged', e.target.checked);
    },
    // HF Radars
    radarActivatedChanged: function(rr){
      rr.isActivated = !rr.isActivated;
      let radar = window.DataManager.HFRadars[rr.UUID];
      radar.isActivated = rr.isActivated;
      
      
      window.eventBus.emit('SidePanelRadarActiveChange', window.DataManager.HFRadars[radar.UUID]);
    },

  },
  components: {
    "legendGUI": LegendGUI,
    "onOffButton": OnOffButton,
  }
}
</script>




<style scoped>
#widgetHFRadars {
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



#existingRadarsContainer {
  display: flex;
  flex-direction: row;
  align-items: center;
}

</style>