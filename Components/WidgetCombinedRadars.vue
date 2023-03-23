<template>
  <!-- Container -->
  <div id='widgetCombinedRadars' ref='widgetCombinedRadars'>

    <!-- On/Off particle animation -->

    <!-- On/Off points -->
    <!-- Maybe point variable too here? -->

    <!-- Animation legend -->
    <!-- Todo: add unit? -->
    <legendGUI ref="legendGUI"
      :legendName="defaultLegendName" 
      :legendRange="defaultLegendRange"
      :defaultUnits="defaultUnits"
      :selectedLegends="selectedLegends"

      @rangeClicked="rangeClicked()"
      @unitsClicked="unitsClicked()"
      ></legendGUI>
  </div>
</template>


<script>

// Import components
import LegendGUI from "./LegendGUI.vue";


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
    // window.eventBus.on('ClickedDataPoint', e => {
    //   let dataPoint = e.dataPoint;
      
    //   if (dataPoint['Velocity (cm/s)']){
    //     this.currentValue = dataPoint['Velocity (cm/s)'].toFixed(1);
    //     this.$refs.tooltipLegend.style.left = (100 * (this.currentValue - this.legendRange[0]) / (this.legendRange[1] - this.legendRange[0])) + '%';
    //     this.$refs.tooltipLegendBar.style.left = (100 * (this.currentValue - this.legendRange[0]) / (this.legendRange[1] - this.legendRange[0])) + '%';
    //   } else
    //     this.currentValue = '';
    // })
    // // When map deselects a data point
    // window.eventBus.on('DeselectedDataPoint', () => {
    //   this.currentValue = '';
    // });


    
  },
  data (){
    return {
      defaultLegendName: 'absModifiedOccam',
      defaultLegendRange: [0, 100], // TODO: this is defined in the data manager, or it should be in DataTypes somewhere?
      defaultUnits: 'cm/s',
      selectedLegends: ['absModifiedOccam.png', 'absColdOccam.png', 'absGrayScale.png', 'absGrayScaleReverse.png' ]
    }
  },
  methods: {
    // LEGEND EMITS
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
    }

  },
  components: {
    "legendGUI": LegendGUI,
  }
}
</script>




<style scoped>
#widgetCombinedRadars {
  background-color: red;
  user-select: none;
}
</style>