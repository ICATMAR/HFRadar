<template>
  <!-- Container -->
  <div id='widgetHFRadars' class="widget" ref='widgetHFRadars'>

    <!-- Title -->
    <div class="titleWidget" :class="{'titleWidget-closed': !isVisible}">
      <h4>High-Freq. Radars</h4>
      <onOffButton ref="onOffCurrents" :checked="false" :inSize="'18px'" @change="radialsOnOffButtonClicked($event)"></onOffButton>

      <div class="icon-str" @click="infoClicked()" v-show="isVisible">i</div>
      <!-- TODO GRAPH ICON - REPRESENTATION -->
    </div>

    <Transition>
    <div v-show="isVisible && !isLoading">
      <!-- Existing radars -->
      <div id="existingRadarsContainer">
        <div v-for="radar in radarsVue">
          <button 
            :class="{'widgetButtonHFRadar-active': radar.isActivated && radar.hasDataOnTimestamp, 'widgetButtonHFRadar-unavailable': !radar.hasDataOnTimestamp}" class="widgetButtonHFRadar"  
            @click="radarActivatedChanged(radar)">
              {{ radar.Site }}
          </button>
        </div>
      </div>


      <!-- Buttons animation and points -->
      <div id="buttonsContainer">

        <!-- On/Off particle animation -->
        <div class='widgetButtonContainer'>
          <onOffButton ref="onOffParticles" :checked="true" :inSize="'15px'" @change="particlesButtonClicked($event)"></onOffButton>
          <span class='widgetSpan'>particles</span>
        </div>

        <!-- On/Off points -->
        <div class='widgetButtonContainer'>
          <onOffButton ref="onOffPoints" :checked="true" :inSize="'15px'" @change="pointsButtonClicked($event)"></onOffButton>
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
    </Transition>

    <div v-show="isVisible && isLoading">
      <span>LOADING...</span>
    </div>

  </div>
  
</template>


<script>

// Import components
import LegendGUI from "./LegendGUI.vue";
import OnOffButton from "../OnOffButton.vue";

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
    window.eventBus.on('HFRadarDataLoaded', (tmst)=>{
      // Create radar variables for the widget
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        if (radar.constructor.name == "HFRadar"){
          if (this.radarsVue[key] == undefined){
            this.radarsVue[key] = {
              UUID: key, 
              Site: radar.Site,
              isActivated: true,
              hasDataOnTimestamp: false,
            }
          }
        }
      });

      // Update widget when data is loaded
      tmst = window.GUIManager.currentTmst || tmst;
      let radars = window.DataManager.getRadarsDataOn(tmst);
      Object.keys(radars).forEach(i => {
        let radar = radars[i];
        if (radar.constructor.name == "HFRadar")
          this.radarsVue[radar.UUID].hasDataOnTimestamp = true;
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
    // When selected date changes
    window.eventBus.on('DataStreamsBar_SelectedDateChanged', tmst => {
      // Iterate radars
      Object.keys(window.DataManager.HFRadars).forEach(key => {
        let radar = window.DataManager.HFRadars[key];
        if (radar.constructor.name === "HFRadar" && this.radarsVue[radar.UUID] != undefined)
          if (radar.data != undefined)
            this.radarsVue[radar.UUID].hasDataOnTimestamp = radar.data[tmst] != undefined;
          else
            this.radarsVue[radar.UUID].hasDataOnTimestamp = false;
      });
    });


    // Advanced interface
    window.eventBus.on("AdvancedInterfaceOnOff", state => {
      // Reset state in simple interface
      if (!state){
        // Fake button actions
        this.$refs.onOffCurrents.setChecked(false);
        this.$refs.onOffParticles.setChecked(window.GUIManager.widgetHFRadars.areParticlesVisible);
        this.$refs.onOffPoints.setChecked(window.GUIManager.widgetHFRadars.arePointsVisible);
      }
    });
    
  },
  data (){
    return {
      defaultLegendName: 'BlueWhiteRed',
      defaultLegendRange: [-100, 100], // TODO: this is defined in the data manager, or it should be in DataTypes somewhere?
      defaultUnits: 'cm/s',
      selectedLegends: ['BlueWhiteRed.png', 'GreenBlueWhiteOrangeRed.png', 'ModifiedOccam.png', 'DarkScaleColors.png' ],
      isVisible: false,
      isLoading: false,
      radarsVue: {},
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
    radialsOnOffButtonClicked: function(e){
      this.isVisible = e.target.checked;
      window.GUIManager.widgetHFRadars.isVisible = e.target.checked;
      window.GUIManager.isDataPointSelected = false;
      // Activate all radars when visible
      if (this.isVisible){
        let keys = Object.keys(this.radarsVue);
        for (let i = 0; i< keys.length; i++) {
          let key = keys[i];
          let radar = this.radarsVue[key];
          // Check if radar has data
          let DMRadar = window.DataManager.HFRadars[key];
          // Check file status (was it requested, is it loading, etc)
          //let fileStatus = window.DataManager.hourlyDataAvailability[tmst.substring(0,13) + 'Z'][radar.Site];
          // window.DataManager.loadStaticFilesRepository(undefined, tmst, fileTypes).then((hfRadar) => {
          //   window.GUIManager.intialLoadDone = true;
          //   if (hfRadar != undefined)
          //     window.eventBus.emit('HFRadarDataLoaded');
          // });
          if (DMRadar.data == undefined){
            // Load data
            this.isLoading = true;
            i = keys.length; // Exit loop
            window.DataManager.loadStaticFilesRepository(undefined, window.GUIManager.currentTmst, ['tuv','ruv','wls']).then(() => {
              this.isLoading = false;
              console.log("HERE");
              window.eventBus.emit('HFRadarDataLoaded');
            });
          } else if (this.isLoading == false) {
            if (DMRadar.data[window.GUIManager.currentTmst] == undefined)
              radar.hasDataOnTimestamp = false;
            else 
              radar.hasDataOnTimestamp = true;
          }

          radar.isActivated = true;
          window.GUIManager.widgetHFRadars.radarsVisible[key] = radar.isActivated;
          
          return;



          if (DMRadar.data == undefined) // No data structure (wave file is loaded before radar file)
            radar.hasDataOnTimestamp = false;
          else{
            if (DMRadar.data[window.GUIManager.currentTmst] == undefined)
              radar.hasDataOnTimestamp = false;
            else 
              radar.hasDataOnTimestamp = true;
          }
        };
      }

      window.eventBus.emit("WidgetHFRadars_VisibilityChanged", e.target.checked);
    },
    infoClicked: function(e){
      window.eventBus.emit("Widget_InfoClicked");
    },
    particlesButtonClicked: function(e){
      window.GUIManager.widgetHFRadars.areParticlesVisible = e.target.checked;
      window.eventBus.emit('WidgetHFRadars_AnimationActiveChanged', e.target.checked);
    },
    pointsButtonClicked: function(e){
      window.GUIManager.widgetHFRadars.arePointsVisible = e.target.checked;
      window.GUIManager.isDataPointSelected = e.target.checked;
      window.eventBus.emit('WidgetHFRadars_PointsActiveChanged', e.target.checked);
    },

    radarActivatedChanged: function(rr){
      rr.isActivated = !rr.isActivated;
      window.GUIManager.widgetHFRadars.radarsVisible[rr.UUID] = rr.isActivated;
      // Check if radar has data
      let DMRadar = window.DataManager.HFRadars[rr.UUID];
      if (DMRadar.data == undefined) // No data structure (wave file is loaded before radar file)
        rr.hasDataOnTimestamp = false;
      else{
        if (DMRadar.data[window.GUIManager.currentTmst] == undefined)
          rr.hasDataOnTimestamp = false;
        else 
          rr.hasDataOnTimestamp = true;
      }
      // If there is data, emit an event
      if (rr.hasDataOnTimestamp){
        // Emit
        window.eventBus.emit('WidgetHFRadars_RadarActiveChange', window.DataManager.HFRadars[rr.UUID]);
      }
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
  justify-content: center;
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