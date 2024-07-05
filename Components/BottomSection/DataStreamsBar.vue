<template>
  <div id="data-streams-bar">
    <!-- A div with the same width as TimeRange -->
    <div class="streamsContainer" ref="streamsContainer">
      <canvas class="streamsCanvas" @mousemove="onMouseMoveCanvas" @mouseleave="onMouseLeaveCanvas" ref="dataStreamsCanvas" @click="streamsContainerClicked"></canvas>
      <!-- <div class="trackMark" :class="{active: ff.selected}" @click="onTrackClicked" :id="ff.properties.id"
        :key="ff.properties.id" v-for="ff in features" :style="setFeatureStyle(ff)">
        &#11044;
      </div> -->
    </div>

  </div>
</template>


<script>
// REQUIERES palette.js
// Import components here

export default {
  name: "data-streams-bar",
  created() {

  },
  mounted() {
    // Data manager
    this.DataManager = DataManager;

    // Zoom level
    this.isDailyVisible = true;

    // TODO: ANOTHER OPTION IS TO USE PATH
    this.canvas = this.$refs.dataStreamsCanvas;
    let parentEl = this.canvas.parentElement;
    this.canvas.height = 30; // TODO: DEPENDANT ON THE NUMBER OF STREAMS TO DISPLAY
    this.canvas.width = parentEl.offsetWidth;
    this.ctx = this.canvas.getContext('2d');



    // EVENTS
    window.addEventListener("resize", () =>{
      this.canvas.width = parentEl.offsetWidth;
      this.updateCanvas();
    });
    // Initial load and user changing hash TIME in URL
    window.eventBus.on('GUIManager_URLDateChanged', tmst => {
      this.updateCanvas();
    });
    // TODO: there is a bit of overkill here. HFRadarDataLoaded is useful to display the first loaded radar data.
    // In principle, 'DataManager_DataAvailabilityUpdated', should be called after the trigger 'HFRadarDataLoaded', but
    // it does not work on the first radar load. It works on the posterior loads, thus this.updateCanvas() is called twice.
    // It probably does not affect performance, but it is an overkill.
    // New HFRadar data
    window.eventBus.on('HFRadarDataLoaded', (tmst) =>{
      this.updateCanvas();
    });
    // When radar data is loaded, update data availability
    window.eventBus.on('DataManager_DataAvailabilityUpdated', () => {
      this.updateCanvas();
    });


    // When the side panel is hiden
    window.eventBus.on('SidePanelSizechanged', (isSidePanelOpen) => {
      setTimeout(()=> this.updateCanvas(), 100);
      this.updateCanvas();
    });

    // Advanced interface
    window.eventBus.on('AdvancedInterfaceOnOff', state => {
      setTimeout(()=> this.updateCanvas(), 100);
      this.updateCanvas();
    });






    

    // This number decides when to paint one point a day or 24 points a day
    this.maxHourlyPoints = 24 * 30;
    // Memory allocation
    this.movingDate = new Date();


    // If HourlyDataAvailability is already loaded
    if (this.DataManager.getHourlyDataAvailability()){
      this.dailyData = this.DataManager.getDailyDataAvailability();
      this.hourlyData = this.DataManager.getHourlyDataAvailability();
    }
    else {
      // HourlyDataAvailability is loaded before this vue component. But just in case, we keep this code (low internet connection?)
      window.eventBus.on('DataManager_HourlyDataAvailabilityLoaded', () => {
        this.hourlyData = this.DataManager.getHourlyDataAvailability();
        this.dailyData = this.DataManager.getDailyDataAvailability();
        this.updateCanvas();
      })
    }
  },
  data() {
    return {
      startDate: new Date(2023, 3, 1),
      endDate: new Date(),
    }
  },
  methods: {
    // USER INTERACTION
    streamsContainerClicked: function(event) {
      // TODO: CHANGE RANGE SLIDER TIME
      let width = event.target.offsetWidth;
      let mouseX = 0;
      if (event.offsetX)
        mouseX = event.offsetX;
      else if (event.touches)
        mouseX = event.touches[0].offsetX;
      else
        console.log("Something went wrong");
      
      let perc = 100 * mouseX / width;

      let totalTimeSpan = this.endDate.getTime() - this.startDate.getTime();
      let clickedDate = new Date(this.startDate.getTime() + totalTimeSpan * perc / 100);
      let minutes = clickedDate.getUTCMinutes();
      let hours = clickedDate.getUTCHours() + Math.floor(minutes / 30);
      clickedDate.setUTCHours(hours);
      let formatedTmst = clickedDate.toISOString().substring(0, 14) + '00:00.000Z';

      //this.timeStr = this.formatTimestampString(clickedDate.toISOString());
      
      
      // Date change event
      window.eventBus.emit('DataStreamsBar_SelectedDateChanged', formatedTmst);
      this.updateCanvas();

      this.$emit('clicked', perc);
    },
    // MOUSE MOVE
    onMouseMoveCanvas: function(event) {
      let width = event.target.offsetWidth;
      let mouseX = 0;
      if (event.offsetX)
        mouseX = event.offsetX;
      else if (event.touches)
        mouseX = event.touches[0].offsetX;
      else
        console.log("Something went wrong");
      
      let percLeft = 100 * mouseX / width;
      // Paint canvas
      this.updateCanvas();
      // Paint line
      let canvas = this.canvas;
      let ctx = this.ctx;
      let posX = canvas.width * percLeft / 100;

      ctx.beginPath();
      ctx.moveTo(posX, 0);
      ctx.lineTo(posX, canvas.height);
      ctx.strokeStyle = "red";
      ctx.stroke();
    },
    // Clear canvas when leaving it
    onMouseLeaveCanvas: function(){
      this.updateCanvas();
    },
    
    
    // INTERNAL METHODS
    // Paint data streams on canvas
    updateCanvas: function(){
      
      this.dailyData = this.DataManager.getDailyDataAvailability();

      if (this.dailyData == undefined)
        return;
      
      let canvas = this.canvas;
      let ctx = this.ctx;

      let radarNames = ['CATS','CREU','BEGU','AREN','PBCN','GNST'];
      let loadedColor = 'darkBlue';
      let existsColor = 'rgb(127, 127, 127)';
      // Time varying color (update canvas is painted contiously when loading data)
      let maxValue = 255;
      let dt = new Date().getTime()/(6*10) % 10;
      let loadingColor = 'rgb('+ (255 - dt*10) +', '+ (245 - dt*10) +', 0)';
      
      canvas.width = canvas.clientWidth;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // For daily maximum representation
      if (this.timeSpanInHours > this.maxHourlyPoints){ // Use daily data
        this.isDailyVisible = true;
        // Calculate number of days
        let numDays = (this.endDate.getTime() - this.startDate.getTime()) / (1000 * 3600 * 24);
        numDays += 1; // First and end days count too
        // Calculate first day proportion
        let startOfFirstDay = new Date(this.startDate.toISOString().substring(0, 10) + 'T00:00:00.000Z');
        let dayDiff = 1 - (this.startDate.getTime()  - startOfFirstDay.getTime()) / (1000 * 3600 * 24);
        // Set this to calculate the 
        this.endDate = new Date(this.endDate.toISOString().substring(0, 10) + 'T00:00:00.000Z');
        //if (numDays != Math.floor(numDays)) console.error("Num days should be integer!!");
        // Iterate for each day
        let movingDate = this.movingDate;
        movingDate.setTime(this.startDate.getTime());
        
        for (let i = 0; i< Math.ceil(numDays); i++){
          let key = movingDate.toISOString().substring(0, 10); // Daily
          let ddData = this.dailyData[key];
          if (ddData != undefined){
            // Paint            
            for (let j = 0; j < radarNames.length; j++){
              // If measure exists in dataset
              if (ddData[radarNames[j]]){
                // Calculate position in canvas
                let posX = ((i + dayDiff - 0.5)/(numDays-1)) * canvas.width; // Use the start day difference to position the points
                let padding = canvas.height * 0.2;
                let posY = padding + j * (canvas.height-padding) / radarNames.length;
                // Calculate width?
                // Calculate height (use datatypes max?)
                let factor = 1;
                let radius = j == 0 ? 2 : 1.3;
                
                ctx.beginPath();
                let radMod = Math.min(3, radius * factor * factor);
                ctx.arc(posX, posY, radMod, 2 * Math.PI, 0, false);
                ctx.fillStyle = ddData[radarNames[j]] == 2 ? loadedColor : ddData[radarNames[j]] == 3 ? loadingColor : existsColor;
                ctx.fill();
              }
            }

          } else {
           //console.log(movingDate.toISOString().substring(10));
          }

          // Increase one day
          movingDate.setUTCDate(movingDate.getUTCDate() + 1);
          movingDate.setUTCHours(0);
        }

        //console.log(this.dailyData);


        // Start index
        // let sIdx = DataManager.getHourlyDataIndex(this.startDate);
        // End index
        // let eIdx = DataManager.getHourlyDataIndex(this.endDate);

        // Count number of days

        // First and last days may not have full width (does it matter, on over 500 days?)

        // Divide total width with number of days to get width per day

        // Paint bars
        // Get max per data type

        
      } else { // Use hourly data
        this.isDailyVisible = false;
        if (Object.keys(this.hourlyData).length == 0){
          console.log("Hourly data is empty but it was loaded?");
          debugger;
          return;
        }
        // Calculate number of half hours
        let numHours = (this.endDate.getTime() - this.startDate.getTime()) / (1000 * 3600);
        
        // TODO
        // Here should be some time corrections maybe?
        // Calculate first half hour proportion
        //let startOfFirstDay = new Date(this.startDate.toISOString().substring(0, 10) + 'T00:00:00.000Z');
        //let dayDiff = 1 - (this.startDate.getTime() - startOfFirstDay.getTime()) / (1000 * 3600 * 24);
        // Set this to calculate the 
        //this.endDate = new Date(this.endDate.toISOString().substring(0, 10) + 'T00:00:00.000Z');

        // Set moving date
        let movingDate = this.movingDate;
        movingDate.setTime(this.startDate.getTime());
        
        // Iterate hours
        for (let i = 0; i < Math.ceil(numHours); i++) {
          // Hourly key
          let key = movingDate.toISOString();
          key = key.substring(0,13) + 'Z';

          let hhData = this.hourlyData[key];
          if (hhData != undefined) {
            // Paint
            for (let j = 0; j < radarNames.length; j++) {
              // If measure exists in dataset
              if (hhData[radarNames[j]]) {
                // Calculate position in canvas
                //let posX = ((i + dayDiff - 0.5) / (numDays - 1)) * canvas.width; // Use the start day difference to position the points
                let posX = canvas.width * i / numHours; // Use the start day difference to position the points
                let padding = canvas.height * 0.2;
                let posY = padding + j * (canvas.height - padding) / radarNames.length;
                // Calculate width?
                // Calculate height (use datatypes max?)
                let factor = 1;
                let radius = j == 0 ? 2 : 1.3;

                ctx.beginPath();
                let radMod = Math.min(3, radius * factor * factor);
                ctx.arc(posX, posY, radMod, 2 * Math.PI, 0, false);
                ctx.fillStyle = hhData[radarNames[j]] == 2 ? loadedColor : hhData[radarNames[j]] == 3 ? loadingColor : existsColor;
                ctx.fill();
              }
            }

          } else {
            //debugger; // Hourly data not defined
          }


          // Increase an hour
          movingDate.setUTCMinutes(movingDate.getUTCMinutes() + 60);
          //console.log(movingDate.toISOString());
        }

      }

      // Paint selected date
      // TODO: this is called several times, not OPTIMAL!
      let selTmst = window.GUIManager.currentTmst;
      if (selTmst != undefined){
        let currentDate = new Date(selTmst);
        let timeSpan = this.endDate.getTime() - this.startDate.getTime();
        let perc = (currentDate.getTime() - this.startDate.getTime()) / timeSpan;
        let posX = perc * canvas.width;
        ctx.beginPath();
        ctx.moveTo(posX, 0);
        ctx.lineTo(posX, canvas.height);
        ctx.strokeStyle = 'red';
        ctx.stroke();
      
      }


      // If DataManager is loading, make an effect in the canvas
      if (window.DataManager.pendingRequests != 0){
        setTimeout(this.updateCanvas, 40);
      }
    },

    







    // PUBLIC METHODS
    // Set data
    setDailyData: function(data){
      this.dailyData = data;
    },
    setHourlyData: function(data){
      this.hourlyData = data;
    },
    // Set start and end dates
    setStartEndDates: function (sDate, eDate) {

      this.startDate.setTime(sDate.getTime());
      this.endDate.setTime(eDate.getTime());
      this.timeSpanInHours = (this.endDate.getTime() - this.startDate.getTime()) / 36e5;

      // Load hourly data if timespan is smaller than X
      // Number of points should be smaller or equal than the number of pixels available, but
      // from daily points to 24 points per day is quite a big jump. So we set a minimum for showing the hourly data
      // TODO: Consider using the minimum radius of the circles here (default is 1, thus diameter is 2 pixels)
      if (this.timeSpanInHours <= Math.max(this.$refs.dataStreamsCanvas.width, this.maxHourlyPoints)){
        
        // DATA IS ALWAYS LOADED FIRST?
        // Load data (DataManager loads the file if it was not loaded already, taking into account the start and end dates).
        // TODO: in our case, the start-end date is always less than 6 months and the static files are divided into 6 months periods,
        // thus providing the start and end dates should be enough. If static files are to be partitioned into smaller parts, please revise here
        // let onLoad = (res) => {
        //   this.sethourlyData(res); // Store hourly data
        //   this.setDailyData(this.DataManager.getDataAvailability()); // Store daily maximum data (gets updated when API is used)
        //   if (!this.DataManager.OBSEADataRetriever.isLoading) // Update canvas once all files are loaded
        //     this.updateCanvas();
        // }
        // // Load data (hourly)
        // this.DataManager.getHourlyData(this.startDate, this.endDate)
        //   .then(res => onLoad(res)).catch(e => console.error('DataStreamsBar.vue\n' + e));


      }

      this.updateCanvas();
      //console.log("Updating canvas and start and end dates from data streams");
    },

    updateCurrentDate: function(isoString){
      // Get data for this date
      // Check zoom level
      // Use daily data when zoom level is close and nothing is loading
      if (!this.isDailyVisible) { 
        let key = isoString.substring(0,13) + 'Z';
        let hhData = this.hourlyData[key];
        if (hhData != undefined){
          window.eventBus.emit('DataStreamsBar_dataHourlyUpdate', hhData);
        }
      } else {
        // Daily value
        let key = isoString.substring(0,10);
        let ddData= this.dailyData[key];
        if (ddData != undefined){
          //ddData.timestamp = key;
          window.eventBus.emit('DataStreamsBar_dataDailyUpdate', ddData);
        }
      }

      this.updateCanvas();
    },



  },
  components: {
  },
  computed: {

  }
}


</script>





<style scoped>
#data-streams-bar {
  position: relative;
  width: calc(100% - 130px);
  height: 30px;
}

.streamsContainer {
  display: flex;
  height: 100%;
  position: relative;
  border-radius: 1rem 0.3rem 0.3rem 1rem;
  pointer-events: all;
  cursor: pointer;

  background: linear-gradient(90deg, rgba(160, 215, 242, 0) 0%, rgba(160, 215, 242, 0.8) 10%, rgba(160, 215, 242, 0.8) 90%, rgba(160, 215, 242, 0.8) 100%);
  box-shadow: 0 -1px 2px rgba(160, 215, 242, 0.8);
}

.streamsCanvas {
  cursor: pointer;
  width: 100%;
}





.trackMark {
  position: absolute;
  font-size: 0.5rem;
  cursor: pointer;
}

@keyframes selectedTrackAnimation {
  0% {
    text-shadow: 0px 0px 4px black;
  }

  50% {
    text-shadow: 0px 0px 0px black;
  }

  100% {
    text-shadow: 0px 0px 4px black;
  }
}

.trackMark.active {
  font-size: 1rem;
  opacity: 1 !important;
  z-index: 1;
  margin-top: -6.5px;
  margin-left: -4px;
  text-shadow: 0px 0px 4px black;
  animation: selectedTrackAnimation 1s infinite;
}
</style>