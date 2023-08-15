<template>
  <div class="overlayContainer" @click="overlayClicked">
    <div class="calendarContainer" @click.stop="">
      <!-- Info -->
      <div class="white-text" style="padding:10px">Select the date (UTC-0)</div>
      <!-- YEAR -->
      <!-- Calendar -->
      <div class="yearContainer" v-show="timeScaleToShow == 'year'">
        <button v-for="yy in years" class="clickable white-text"
          :class="[yy.isSelected ? 'yearButton button-active' : yy.num % 2 == 0 ? 'yearButton' : 'yearButton even']"
          @click="onYearClicked($event)" :key="yy.num" :id="yy.num" :title="yy.num"
          >{{yy.name}}</button>
      </div>
      <!-- MONTH -->
      <!-- Selected date -->
      <div class="text-white selectedDateContainer" v-show="timeScaleToShow == 'month'">
        <div class="clickable" @click="changeYearClicked(-1)">&lt;</div>
        <div class="clickable" @click="timeScaleToShow = 'year'">{{ tempTmst.substring(0,4) }}</div>
        <div class="clickable" @click="changeYearClicked(1)">></div>
      </div>
      <!-- Calendar -->
      <div class="timeline" ref="monthTimeline" v-show="timeScaleToShow == 'month'">
        <button v-for="mm in months" class="monthButton clickable white-text"
          :class="[mm.isSelected ? 'button-active' : '']"
          @click="onMonthClicked($event)" :key="mm.key" :id="mm.key" :title="$i18n.t(mm.title) + ', ' + mm.year"
          >{{$t(mm.title)}}</button>
      </div>
      <!-- DAY -->
        <!-- Selected date -->
      <div class="text-white selectedDateContainer" v-show="timeScaleToShow == 'day'">
        <div class="clickable" @click="changeMonthClicked(-1)">&lt;</div>
        <div class="clickable" @click="timeScaleToShow = 'month'">{{monthAbbr[parseInt(tempTmst.substring(5,7))-1][2]}} , {{ tempTmst.substring(0,4) }}</div>
        <div class="clickable" @click="changeMonthClicked(1)">></div>
      </div>
        <!-- Calendar -->
      <div class="timeline daysContainer" ref="dayTimeline" v-show="timeScaleToShow == 'day'" >
        <button v-for="dd in days" class="clickable white-text dayButton" :class="[dd.hasData == false ? 'noData' : dd.isSelected ? 'button-active' : '']"
          @click="onDayClicked($event)" :key="dd.key" :id="dd.key" :title="dd.title"
          >{{dd.name}}</button>
      </div>
      <!-- HOUR -->
        <!-- Selected date -->
      <div class="text-white selectedDateContainer" v-show="timeScaleToShow == 'hour'">
        <div class="clickable" @click="changeDayClicked(-1)">&lt;</div>
        <div class="clickable" @click="timeScaleToShow = 'day'">{{ parseInt(tempTmst.substring(8,10)) }} , {{monthAbbr[parseInt(tempTmst.substring(5,7))-1][2]}} , {{ tempTmst.substring(0,4) }}</div>
        <div class="clickable" @click="changeDayClicked(1)">></div>
      </div>
        <!-- Calendar -->
      <div class="timeline" ref="dayTimeline" v-show="timeScaleToShow == 'hour'">
        <button v-for="hh in hours" class="clickable white-text hourButton" :class="[hh.hasData == false ? 'noData' : hh.isSelected ? 'button-active' : '']"
          @click="onHourClicked($event)" :key="hh.key" :id="hh.key" :title="hh.title"
          >{{hh.name}}:00</button>
      </div>


      <!-- Cancel / Ok -->
      <div class="acceptContainer">
        <button class="closeButton" @click="cancelClicked">Cancel</button>
        <button class="acceptButton" @click="acceptClicked">OK</button>
      </div>

      
    </div>


  </div>
</template>


<script>
export default {
  name: "Calendar",
  emits: ["hideCalendar"],
  created() {
    // Start and end dates if startDate and endDate are flexible
    this.startDate = new Date(2023, 3, 1); 
    this.endDate = new Date();

    // Start/End year and month
    this.startYear = this.startDate.getUTCFullYear();
    this.startMonth = this.startDate.getUTCMonth();
    this.startHour = this.startDate.getUTCHours();
    this.endYear = this.endDate.getUTCFullYear();
    this.endMonth = this.endDate.getUTCMonth();

    // Month names
    this.monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    this.monthAbbr = [
      ['J', 'Jan', 'January'],
      ['F', 'Feb', 'February'],
      ['M', 'Mar', 'March'],
      ['A', 'Apr', 'April'],
      ['M', 'May', 'May'],
      ['J', 'Jun', 'June'],
      ['J', 'Jul', 'July'],
      ['A', 'Aug', 'August'],
      ['S', 'Sep', 'September'],
      ['O', 'Oct', 'October'],
      ['N', 'Nov', 'November'],
      ['D', 'Dec', 'December']
    ];

    // Start end dates


  },
  mounted() {

    this.createHTML(this.tempTmst);
     
    // EVENTS
    window.eventBus.on("HFRadarDataLoaded", tmst => {
      //console.log(tmst);
      //let tempTmst = window.GUIManager.currentTmst;
      //this.createHTML(tempTmst);
    });
    
  },
  data (){
    return {
      months: [],
      years: [],
      days: [],
      hours: [],
      timeScaleToShow: 'year',
      tempTmst: '2023-08-11T06:00:00.000Z',
    }
  },
  methods: {
    // USER INTERACTION
    onYearClicked: function(e){
      let year = e.target.id;
      // Modify tempTmst
      this.tempTmst = year + this.tempTmst.substring(4);
      // Update HTML (TODO: not optimal)
      this.createHTML(this.tempTmst);
      this.timeScaleToShow = 'month';
    },
    onMonthClicked: function(e){
      // Get selected month
      let month = parseInt(e.target.id.split('-')[0]);
      
      // Modify tempTmst
      this.tempTmst = this.tempTmst.substring(0,5) + String((month+1)).padStart(2, '0') + this.tempTmst.substring(7);
      // Update HTML
      this.createHTML(this.tempTmst);
      this.timeScaleToShow = 'day';
    },
    onDayClicked: function(e){
      let day = parseInt(e.target.id.split('-')[0]);
      this.tempTmst = this.tempTmst.substring(0,8) + String(day).padStart(2, '0') + this.tempTmst.substring(10);
      this.createHTML(this.tempTmst);
      this.timeScaleToShow = 'hour';
    },
    onHourClicked: function(e){
      let hour = parseInt(e.target.id.split('-')[0]);
      this.tempTmst = this.tempTmst.substring(0,11) + String(hour).padStart(2, '0') + this.tempTmst.substring(13);
      this.timeScaleToShow = 'year';
      // Same functionality (TODO: should be in a separate function - acceptClicked is for the button and I am reusing it, bad programming!)
      this.acceptClicked();
    },


    changeYearClicked: function(incr){
      let currentDate = new Date(this.tempTmst);
      currentDate.setUTCFullYear(currentDate.getUTCFullYear() + incr);
      let cYear = currentDate.getUTCFullYear();
      // Find limits
      if (cYear >= this.startYear && cYear <= this.endYear){
        this.tempTmst = currentDate.toISOString();
        this.createHTML(this.tempTmst);
      }
    },
    changeMonthClicked: function(incr){
      let currentDate = new Date(this.tempTmst);
      currentDate.setUTCMonth(currentDate.getUTCMonth() + incr);
      let cYear = currentDate.getUTCFullYear();
      let cMonth = currentDate.getUTCMonth();
      // Find limits
      let isBeforeStartDate = (cYear == this.startYear && cMonth < this.startMonth || cYear < this.startYear);
      let isAfterEndDate = (cYear == this.endYear && cMonth > this.endMonth || cYear > this.endYear);
      // If inside limits, update
      if (!isBeforeStartDate && !isAfterEndDate){
        this.tempTmst = currentDate.toISOString();
        this.createHTML(this.tempTmst);
      }
    },
    changeDayClicked: function(incr){
      let currentDate = new Date(this.tempTmst);
      currentDate.setUTCDate(currentDate.getUTCDate() + incr);
      // Set hours to 0, so the end date is not surpassed when comparing dates (only year, month and day should be taken into account)
      // TODO: It affects negatively the start date (hour should be set to 23:59), but it is not as relevant as the last dataset
      currentDate.setUTCHours(0);
      // Find limits
      if (currentDate > this.startDate && currentDate < this.endDate){
        this.tempTmst = currentDate.toISOString();
        this.createHTML(this.tempTmst);
      }
    },

    acceptClicked: function(){
      // Change GUI timestamp
      window.GUIManager.currentTmst = this.tempTmst;
      // Send event
      window.eventBus.emit('Calendar_SelectedDate', this.tempTmst);
      // Hide the window
      this.$emit('hideCalendar');
    },
    cancelClicked: function(){
      // Hide window
      this.$emit('hideCalendar');
    },

    overlayClicked: function(){
      // Hide window
      this.$emit('hideCalendar');
    },



    // INTERNAL METHODS
    createHTML: function(tmst) {
      let startYear = this.startYear;
      let startMonth = this.startMonth;
      let endYear = this.endYear;
      let endMonth = this.endMonth;

      // Selected date
      let selDate = new Date(tmst);
      let selYear = selDate.getUTCFullYear();
      let selMonth = selDate.getUTCMonth();
      let selDay = selDate.getUTCDate();
      let selHour = selDate.getUTCHours();



      // YEARS
      let totalYears = endYear - startYear;
      this.years = [{ num: startYear, name: startYear, wght: 1, isSelected: selYear == startYear}];
      // Fill years
      for (let i = 1; i<=totalYears; i++){
          this.years.push({num: startYear + i, name: startYear + 1, wght: 1, isSelected: selYear == startYear + i});
      }

      // MONTHS
      this.months = [];
      // Only one year of data
      if (selYear == startYear && selYear == endYear){
        startMonth = this.startDate.getUTCMonth();
        endMonth = this.endDate.getUTCMonth();
      } 
      // Selected start year
      else if (selYear == startYear){
        startMonth = this.startDate.getUTCMonth();
        endMonth = 11;
      } 
      // Selected end year
      else if (selYear == endYear){
        startMonth = 0;
        endMonth = this.endDate.getUTCMonth();
      }

      // Fill months
      for (let i = startMonth; i <= endMonth; i++){
          this.months.push({num: i, wght: 1, key: i + "-" + (selYear), year: selYear,  name: this.monthNum2Str(i), title: this.monthAbbr[i][2], isSelected: selMonth == i});
      }

      // DAYS
      this.days = [];
      let startDay = 1;
      let endDay = this.getDaysInMonth(selYear, selMonth);
      // Get data availability
      let dailyData = window.DataManager.getDailyDataAvailability();
      
      // First month of data
      if (selMonth == startMonth && selYear == startYear){
        startDay = this.startDate.getUTCDate();
      } 
      // Last month of data
      else if (selMonth == endMonth && selYear == endYear){
        endDay = this.endDate.getUTCDate();
      }
      // Fill days
      for (let i = startDay; i <= endDay; i++){ 
        let dataExists = dailyData[selYear + '-' + String((selMonth+1)).padStart(2, '0') + '-' + String((i)).padStart(2, '0')];
        this.days.push({
                    num: i,
                    wght: 1,
                    key: i + "-" + selMonth + "-" + selYear,
                    title: i + "-" + (selMonth+1) + "-" + selYear,
                    year: selYear,
                    month: selMonth+1,
                    name: i,
                    isSelected: selDay == i,
                    hasData: dataExists != undefined,
                  });
      }
    

      // HOURS
      this.hours = [];
      // Iterate data availability
      let hourlyData = window.DataManager.getHourlyDataAvailability();

      for (let i = 0; i < 24; i++){
        let dataExists = hourlyData[selYear + '-' + String((selMonth+1)).padStart(2, '0') + '-' + String((selDay)).padStart(2, '0') + "T" + String((i)).padStart(2, '0') + "Z"];

        this.hours.push({
          num: i,
          key: i + "-" + selDay + "-" + selMonth + "-" + selYear,
          title: selDay + "-" + (selMonth+1) + "-" + selYear + " T" + String(i).padStart(2,'0'),
          year: selYear,
          month: selMonth+1,
          day: selDay,
          name: i,
          isSelected: selHour == i,
          hasData: dataExists != undefined,
        })
      }

    },
    // Month num to Month string
    monthNum2Str: function(monthNum){
      return this.monthNames[monthNum];
    },

    // Days in a month
    getDaysInMonth: function(year, month) {
      return new Date(year, month, 0).getDate(); // getUTCDate returns daysInMonth - 1
    },

  },
  components: {

  }
}
</script>


<style scoped>

.overlayContainer {
  position: fixed;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  background: rgb(198 240 255 / 70%);
  right: 0;
  bottom: 0;
  top: 0;
  left: 0;
  z-index: 10;
}
.calendarContainer {
  position: fixed;
  right: 0;
  bottom: 0;

  width: clamp(200px, 50%, 500px);
  height: fit-content;
  padding: 30px;

  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  background: rgba(20, 120, 167, 0.9);
  border-radius: 10px;

  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: center;
  
  z-index: 10;
}

.timeline {
  display: flex;
  justify-content: flex-start;
  align-content: center;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;

  padding: 20px;
}

/* .monthButton {
  
} */

.daysContainer {
  width: calc(clamp(20px, 6vw, 40px) * 8.5);
}

.dayButton {
  width: clamp(20px, 6vw, 40px);
  height: clamp(20px, 6vw, 40px);
}

.hourButton {
  font-size: clamp(0.6rem, 1.2vw, 0.8rem);
}

.acceptContainer{
  width: 100%;
  padding-top: 20px;
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  align-items: center;

  
}

.closeButton, .acceptButton {
  width: 100px;
}

.isSelected {
  background: yellowgreen;
}

.noData {
  pointer-events: none;
  background: grey;
  user-select: none;
  cursor: default;
}

.selectedDateContainer {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-evenly;
  width: 80%;
}

.selectedDateContainer > div {
  padding: 10px;
}
</style>