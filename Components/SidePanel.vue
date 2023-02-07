<template>
  <!-- Container -->
  <div id='side-panel' ref='sidepanel'>
    <div class="accordion" id="accordionPanelsStayOpenExample">

      <!-- HF Radar -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingSectionOne">
          <button class="accordion-button" type="button" data-bs-toggle="collapse"
            data-bs-target="#bodySectionOne" aria-expanded="true"
            aria-controls="bodySectionOne">
            HF Radar #1
          </button>
        </h2>
        <div ref="HFRadar" id="bodySectionOne" class="accordion-collapse collapse show"
          aria-labelledby="headingSectionOne">
          <div class="accordion-body" v-html="content">
          </div>
        </div>
      </div>


      <!-- Data point ? -->
      <div class="accordion-item">
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
    window.eventBus.on('LoadedHFRadarData', (hfRadarData) => {
      // Create HTML content
      let str = '';
      let keys = Object.keys(hfRadarData.header);
      for (let i = 0; i < keys.length; i++){
        str += '<p><strong>' + keys[i] + '</strong>: ' + hfRadarData.header[keys[i]] + '<br></p>';
      }
      this.content = str;
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
      collapse = new window.bootstrap.Collapse(this.$refs.HFRadar, {toggle: false});
      collapse.hide();
    });
    // On DataPoint deselected on Map.vue
    window.eventBus.on('DeselectedDataPoint', () => {
      // Remove HTML content
      this.dataPointContent = '';
      let collapse = new window.bootstrap.Collapse(this.$refs.dataPoint, {toggle: false});
      collapse.hide();
    })
  },
  data (){
    return {
        content: '',
        dataPointContent: '',
    }
  },
  methods: {
    //onclick: function(e){},
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