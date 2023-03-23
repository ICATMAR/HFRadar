<template>
  <!-- Container -->
  <div id='legendGUI' ref='legendGUI' @mouseleave="isMouseOver = false">

    <div v-show="legendsLoaded">
      <!-- Tooltip -->
      <div id="toolTipContainer" v-show="!isMouseOver && currentValue !=''">
        <div class="tooltipLegend" ref="tooltipLegend">{{transformFunc(currentValue)}} {{units}}</div>
        <div class="tooltipLegendBar" ref="tooltipLegendBar">|</div>
      </div>

      <!-- Legend -->
      <img class="selLegend" :src="legendSrc" @click="isMouseOver = true">
      <div class="rangeValuesBox">
        <div class="leftRange" @click=rangeClicked()>{{transformFunc(legendRange[0])}}</div>
        <div class="middleRange" @click=unitsClicked()>{{ units }}</div>
        <div class="rightRange" @click=rangeClicked()>{{transformFunc(legendRange[1])}}</div>
      </div>
    </div>

    <!-- Drop-down with other legends -->
    <span v-show="isMouseOver">
      <div v-for="legend, index, in legends" >
        <img v-if="selectedLegends.includes(legend.legendName)" :src="legend.img.src" @click="legendClicked($event, index)">
      </div>
    </span>
  </div>
  
</template>


<script>

// Import components
//import Map from 'Components/Map.vue'

export default {
  name: 'legendGUI', // Caps, no -
  props: [
    'legendName',
    'legendRange',
    'defaultUnits',
    'selectedLegends',
  ],
  created() {
    this.units = this.defaultUnits;
  },
  mounted() {
    // When legends are loaded
    // TODO: default legend index? shoud be set when data is loaded?
    window.eventBus.on('AppManagerLegendsLoaded', (legends) => {
      // Store legends when successfully loaded
      this.legends = [];
      legends.forEach(ll => {
        if (ll.status == 'fulfilled'){
          this.legends.push(ll.value);
        }
      });
      this.legendsLoaded = true;


      // Find index according to default legend name     
      for (let i = 0; i < this.legends.length; i++){
        if (this.legends[i].img.src.includes('/' + this.legendName)){
          this.legendIndex = i;
          i = this.legends.length; // Exit loop
        }
      }

      this.legendSrc = this.legends[this.legendIndex].img.src;
      this.emitLegendChanged(this.legends[this.legendIndex]);
    });
    // When mouse clicks a data point
    // TODO: move this event to widget
    window.eventBus.on('ClickedDataPoint', e => {
      let dataPoint = e.dataPoint;
      
      if (dataPoint['Velocity (cm/s)']){
        this.showCurrentValue(dataPoint['Velocity (cm/s)']);
      } else
        this.currentValue = '';
    })
    // When map deselects a data point
    window.eventBus.on('DeselectedDataPoint', () => {
      this.currentValue = '';
    });

  },
  data (){
    return {
      legends: [],
      legendsLoaded: false,
      legendIndex: 6, // Is ovewritten by widget data type
      legendSrc: '',
      isMouseOver: false,
      // Tooltip
      //legendRange: [-100, 100], // Legend range is changed in AnimationCanvas.vue, when the animation is created
      currentValue: '',
      transformFunc: (value) => {return value},
    }
  },
  methods: {
    // USER INTERACTION
    // Legend clicked
    legendClicked: function(e, index){
      this.legendIndex = index;
      this.legendSrc = this.legends[index].img.src;
      this.legends[index].legendRange = this.legendRange; // TODO: CHANGE RANGE OPTION
      // Emit
      this.emitLegendChanged(this.legends[index]);
    },


    unitsClicked: function(e){
      this.$emit('unitsClicked');
    },
    rangeClicked: function(e){
      this.$emit('rangeClicked');
    },



    // EVENT EMITTER
    emitLegendChanged(legend){
      // TODO: FIX DATA STRUCTURE: legend contains colors and img, range is dependent on the data type
      //window.eventBus.emit('LegendGUI_legendChanged', {legend, "legendRange": this.legendRange});
      // TODO: EMIT ON WIDGET, NOT ON LEGEND
      let legendObj =  {legend, "legendRange": this.legendRange};
      this.$emit('legendChanged', legendObj);
    },


    // PUBLIC FUNCTIONS
    // Set range
    setRange: function(range){
      this.legendRange[0] = range[0];
      this.legendRange[1] = range[1];
      
      this.emitLegendChanged(this.legends[this.legendIndex]);
    },
    // Set units and transformation function
    setUnits: function(units, transformFunc){
      this.units = units;
      this.transformFunc = transformFunc;
    },
    // Show current value
    showCurrentValue: function(value){
      this.currentValue = value.toFixed(1);
      this.$refs.tooltipLegend.style.left = (100 * (this.currentValue - this.legendRange[0]) / (this.legendRange[1] - this.legendRange[0])) + '%';
      this.$refs.tooltipLegendBar.style.left = (100 * (this.currentValue - this.legendRange[0]) / (this.legendRange[1] - this.legendRange[0])) + '%';
    }
  },
  components: {
    //'map': Map,
  }
}
</script>




<style scoped>
#legendGUI {
  /* position: absolute; */
  /* width: 80%; */
  bottom: 90px;
  right: 10%;
  z-index: 10;
  pointer-events: all;

  align-items: flex-end;
  display: flex;
  flex-direction: column-reverse;
  
}

img {
  width:200px; 
  height:20px;
  border-radius: 5px;
}


#toolTipContainer {
  position:relative;
}
.tooltipLegend {
  position:absolute;
  top: -8px;
  color:white;
  font-size: small;
  text-shadow: 0px 0px 4px black;
  transform: translateX(-50%);
  -ms-transform: translateX(-50%);
  white-space: nowrap;
}
.tooltipLegendBar {
  position:absolute;
  top: 6px;
  font-size:large;
  text-shadow: 0px 0px 5px black;
  color:white;
  transform: translateX(-50%);
  -ms-transform: translateX(-50%);
}
.selLegend {
  margin-top: 10px;
  margin-bottom: 10px;
}

.selLegend:hover, img:hover {
  border-radius: 5px;
  border: 2px solid var(--lightBlue);
  height: 22px;
  width: 202px;
  cursor:pointer;
}

.rangeValuesBox {
  display: flex;
  justify-content: space-between;
  color: white;
  text-shadow: 0px 0px 4px black;
  font-size: small;
  margin-top: -10px;
}

.rangeValuesBox > * {
  padding-left: 10px;
  padding-right: 10px;
  cursor: pointer;
}

.leftRange {
  transform: translateX(-50%);
  -ms-transform: translateX(-50%);
}

/* .middleRange {
  transform: translateX(-50%);
  -ms-transform: translateX(-50%);
} */

.rightRange {
  transform: translateX(50%);
  -ms-transform: translateX(50%);
}
</style>