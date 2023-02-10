<template>
  <!-- Container -->
  <div id='side-panel' ref='sidepanel'>
    <div class="accordion">

      <div class="accordion-item" v-for="(radar, index) in visibleRadars" :key="radar['UUID']">
        <h2 class="accordion-header" :id="'headingSection' + index">
          <button class="accordion-button" type="button" data-bs-toggle="collapse"
            :data-bs-target="'#bodySection' + index" aria-expanded="true"
            :aria-controls="'bodySection' + index" @click="onHeaderClick($event, index)">
            HF Radar #{{index+1}}
          </button>
        </h2>
        <div :ref="'HFRadar' + index" :id="'bodySectionOne' + index" class="accordion-collapse collapse show"
          :aria-labelledby="'headingSectionOne' + index">
          <div class="accordion-body">
            <p v-for="(hItem, key) in radar.header">
              <strong>{{key}}: </strong>{{ hItem }}
              <br>
            </p>
          </div>
        </div>
      </div>



      <!-- Data point ? -->
      <div class="accordion-item" v-show="isDataPointVisible">
        <h2 class="accordion-header" id="headingSection2">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
            data-bs-target="#bodySection2" aria-expanded="false"
            aria-controls="bodySection2">
            Selected Data Point
          </button>
        </h2>
        <div ref="dataPoint" id="bodySection2" class="accordion-collapse collapse"
          aria-labelledby="headingSection2">
          <div class="accordion-body" v-html="dataPointContent">
          </div>
        </div>
      </div>

      <!-- <div class="accordion-item">
        <h2 class="accordion-header" id="panelsStayOpen-headingTwo">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
            data-bs-target="#panelsStayOpen-collapseTwo" aria-expanded="false"
            aria-controls="panelsStayOpen-collapseTwo">
            Accordion Item #2
          </button>
        </h2>
        <div id="panelsStayOpen-collapseTwo" class="accordion-collapse collapse"
          aria-labelledby="panelsStayOpen-headingTwo">
          <div class="accordion-body">
            <strong>This is the second item's accordion body.</strong> It is hidden by default, until the collapse
            plugin adds the appropriate classes that we use to style each element. These classes control the overall
            appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom
            CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the
            <code>.accordion-body</code>, though the transition does limit overflow.
          </div>
        </div>
      </div> -->

      <!-- About setion -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="aboutHeading">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
            data-bs-target="#about" aria-expanded="false"
            aria-controls="about">
            About
          </button>
        </h2>
        <div id="about" class="accordion-collapse collapse"
          aria-labelledby="aboutHeading">
          <div class="accordion-body">
            <p>This application visualizes data from HF Radars (CODAR). The application is developed under the project SOCAT-ICATMAR,
            funded by Generalitat de Catalunya and CSIC.</p>
            <p>The application is developed with OpenLayers, Bootstrap and Vue. Map attributions: © Esri, Maxar, GeoEye, Earthstar
              Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>

// Import components
//import Map from 'Components/Map.vue'

export default {
  name: 'SidePanel',
  created() {
    
  },
  mounted() {
    // EVENT LISTENERS
    // On HFRadar data load
    // TODO: THIS INFORMATION SHOULD COME FROM MAP.VUE.
    // --> Add time slider
    // --> Map.vue (or time slider? -- decide visible radars)
    // --> TimeSlider create events that update information to SidePanel
    // --> Map.vue should be aware of the visible layers for the click events
    // --> Maybe create an AppController? > Receives and sends all user events, stores information about the visible layers etc...
    window.eventBus.on('HFRadarDataLoaded', (tmst) => {
      this.updateInformation(tmst);
    });

    // Selected date changes
    window.eventBus.on('SelectedDateChanged', (tmst) => {
      this.updateInformation(tmst);
      this.dataPointContent = '';
      this.isDataPointVisible = false;
    });

    // On DataPoint click on Map.vue
    window.eventBus.on('ClickedDataPoint', (dataPoint) => {
      // Create HTML content
      let str = '';
      let keys = Object.keys(dataPoint);
      for (let i = 0; i < keys.length; i++){
        str += '<p><strong>' + keys[i] + '</strong>: ' + dataPoint[keys[i]] + '<br></p>';
      }
      
      this.dataPointContent = str;
      let collapse = new window.bootstrap.Collapse(this.$refs.dataPoint, {toggle: false});
      collapse.show();
      this.isDataPointVisible = true;

      for (let i = 0; i < this.visibleRadars.length; i++){
        collapse = new window.bootstrap.Collapse(this.$refs['HFRadar' + i], {toggle: false});
        collapse.hide(); 
      }
         
    });
    // On DataPoint deselected on Map.vue
    window.eventBus.on('DeselectedDataPoint', () => {
      // Remove HTML content
      this.dataPointContent = '';
      let collapse = new window.bootstrap.Collapse(this.$refs.dataPoint, {toggle: false});
      collapse.hide();
      this.isDataPointVisible = false;
    })
  },
  data (){
    return {
        content: '',
        dataPointContent: '',
        isDataPointVisible: false,
        visibleRadars: [],
    }
  },
  methods: {
    // USER ACTIONS
    onHeaderClick: function(e, index){
      new window.bootstrap.Collapse(this.$refs['HFRadar'+index], {toggle: true});
    },
    

    // INTERNAL EVENTS
    updateInformation(tmst){
      // Get current active radars on that date
      let activeRadars = window.DataManager.getRadarsDataOn(tmst);
      this.visibleRadars = [];
      if (activeRadars.length != 0 ){
        for (let i = 0; i < activeRadars.length; i++){
          let HFRadar = activeRadars[i];
          // Update vue data
          this.visibleRadars.push({header: HFRadar.headers[tmst], data: HFRadar.data[tmst]});
        }
      }
    }
  },
  components: {
    //'map': Map,
  }
}
</script>




<style scoped>
#side-panel{
  min-width: 500px;
  max-width: 500px;
  background: rgb(240, 240, 255);
  height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
}

.accordion-body{
  max-height: 50vh;
  overflow-y: auto;
  font-size: small;
}

.accordion-body ::v-deep p{
  margin-bottom: 0.3rem;
}
</style>