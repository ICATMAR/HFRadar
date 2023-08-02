<template>
  <!-- Container -->
  <div>

    <!-- Side panel content-->
    <div id='side-panel' ref='sidepanel' v-show="showPanel">
      <div class="accordion">

        <div class="accordion-item" v-for="(radar, index) in visibleRadars" :key="radar['UUID']">
          <h2 class="accordion-header" >
            <button class="accordion-button" :ref="'HFRadarHeader' + index" type="button" data-bs-toggle="collapse"
              @click="onHeaderClick($event, index)">
              {{radar["FileType"].includes('tots') ? 'Combined Currents ' + radar["Site"] : 'HF Radar ' + radar["Site"]}}
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
              Selected Data Point {{ radarNameOfDatapoint }}
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

      <!-- Fill empty space -->
      <div class="sidePanelFiller"></div>
    </div>

    <div id='side-arrow' @click="onSideArrowClick"></div>
  </div>
</template>


<script>

// Import components
import onoffButton from './OnOffButton.vue'

export default {
  name: 'SidePanel',
  created() {
    
  },
  mounted() {
    // EVENT LISTENERS
    window.eventBus.on('HFRadarDataLoaded', (tmst) => {
      if (tmst != undefined)
        this.updateInformation(tmst);
    });

    window.eventBus.on('Widget_InfoClicked', () => {
      this.showPanel = this.showPanel ? false : true;
      window.eventBus.emit('SidePanelSizechanged', this.showPanel);
    });

    // Selected date changes
    window.eventBus.on('DataStreamsBar_SelectedDateChanged', (tmst) => {
      this.updateInformation(tmst);
      this.dataPointContent = '';
      this.isDataPointVisible = false;
    });

    // On HF Radar clikc on Map.vue
    window.eventBus.on('Map_ClickedHFRadar', radar => {
      console.log(radar);
      console.log("Clicked HF Radar")
      //TODO: ACTIVATE RADAR
      this.showPanel = true;
      window.eventBus.emit('SidePanelSizechanged', this.showPanel);
    });

    // On DataPoint click on Map.vue
    window.eventBus.on('Map_ClickedDataPoint', e => {
      let dataPoint = e.dataPoint;
      let HFRadar = e.radar;

      // Create HTML content
      let str = '';
      let keys = Object.keys(dataPoint);
      for (let i = 0; i < keys.length; i++){
        str += '<p><strong>' + keys[i] + '</strong>: ' + dataPoint[keys[i]] + '<br></p>';
      }
      
      this.dataPointContent = str;
      this.radarNameOfDatapoint = '( HF Radar' + HFRadar.Site.replaceAll('\"', '') + ')';

      // Accordion effects
      let collapse = new window.bootstrap.Collapse(this.$refs.dataPoint, {toggle: false});
      collapse.show();
      this.isDataPointVisible = true;

      for (let i = 0; i < this.visibleRadars.length; i++){
        
        collapse = new window.bootstrap.Collapse(this.$refs['HFRadar' + i], {toggle: false});
        collapse.hide();
        
        this.$refs['HFRadarHeader' + i].classList.add("collapsed");
      }

      // Show side panel
      this.showPanel = true;
      window.eventBus.emit('SidePanelSizechanged', this.showPanel);
         
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
        radarNameOfDatapoint: '',
        showPanel: false,
    }
  },
  methods: {
    // USER ACTIONS
    onHeaderClick: function(e, index){
      // Toggle header
      if (this.$refs['HFRadar'+index].classList.contains("show"))
        e.target.classList.add("collapsed");
      else
        e.target.classList.remove("collapsed");

      // Toggle body
      new window.bootstrap.Collapse(this.$refs['HFRadar'+index], {toggle: true});

    },
    // On hide/show panel
    onSideArrowClick(){
      this.showPanel = this.showPanel ? false : true;
      window.eventBus.emit('SidePanelSizechanged', this.showPanel);
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
          //this.visibleRadars.push({UUID: HFRadar.headers[tmst]['UUID'], header: HFRadar.headers[tmst], data: HFRadar.data[tmst]});
          this.visibleRadars.push(HFRadar);
        }
      }
    }
  },
  components: {
    'onoffButton': onoffButton,
  }
}
</script>




<style scoped>
#side-panel{
  min-width: 500px;
  max-width: 500px;
  height: 100vh;
  max-height: 100vh;
  overflow-y: auto;

  display: flex;
  overflow-y: auto;
  flex-direction: column;
  flex-wrap: nowrap;
}

.accordion-body{
  max-height: 50vh;
  overflow-y: auto;
  font-size: small;
}

.accordion-body ::v-deep p{
  margin-bottom: 0.3rem;
}


.accordion-button::after {
  background-color: rgba(207, 207, 207, 0.74);
  border-radius: 50%;
}


.sidePanelFiller {
  background-image: url('Assets/Images/TramaCorp.png');
  background-size: 100% 100%;
  width: 100%;
  height: 100%;
}

.onoffRadar {
  position:absolute;
  right: 60px;
}

#side-arrow {
  cursor: pointer;
  position:absolute;
  margin-left: -40px;
  width: 40px;
  height: 60px;
  border-top-left-radius: 50%;
  border-bottom-left-radius: 50%;


  background: var(--red);
  color: white;
  top:50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
    font-size: large;
}

#side-arrow::after {
  content: '►';
  
  
}

</style>