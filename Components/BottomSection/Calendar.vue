<template>
  <div class="calendarContainer">
    <!-- Year -->
    <div class="yearContainer">
      <button v-for="yy in years" class="clickable white-text"
        :class="[yy.isSelected ? 'yearButton button-active' : yy.num % 2 == 0 ? 'yearButton' : 'yearButton even']"
        @click="onYearClicked($event)" :key="yy.num" :id="yy.num" :title="yy.num"
        >{{yy.name}}</button>
    </div>
    <!-- Month -->
    <div class="timeline" ref="monthTimeline">
      <button v-for="mm in months" class="monthButton clickable white-text"
        :class="[mm.isSelected ? 'button-active' : '']"
        @click="onMonthClicked($event)" :key="mm.key" :id="mm.key" :title="$i18n.t(mm.title) + ', ' + mm.year"
        >{{$t(mm.title)}}</button>
    </div>
    <!-- Day -->
    <div class="timeline daysContainer" ref="dayTimeline" v-show="days.length!=0">
      <button v-for="dd in days" class="clickable white-text dayButton" :class="[dd.hasData == false ? 'noData' : dd.isSelected ? 'button-active' : '']"
        @click="onDayClicked($event)" :key="dd.key" :id="dd.key" :title="dd.title"
        >{{dd.name}}</button>
    </div>
    <!-- Hour -->
    <div class="timeline" ref="dayTimeline" v-show="hours.length!=0">
      <button v-for="hh in hours" class="clickable white-text hourButton" :class="[hh.hasData == false ? 'noData' : hh.isSelected ? 'button-active' : '']"
        @click="onHourClicked($event)" :key="hh.key" :id="hh.key" :title="hh.title"
        >{{hh.name}}:00</button>
    </div>

    <!-- Info local time -->
    <div class="white-text">Date is in UTC+0</div>

    <!-- Cancel / Ok -->
    <div class="acceptContainer">
      <button class="closeButton">Cancel</button>
      <button class="acceptButton">OK</button>
    </div>
  </div>
</template>


<script>
export default {
  name: "Calendar",
  created() {
    // Start and end dates if startDate and endDate are flexible
    this.startDate = new Date(2023, 3, 1); 
    this.endDate = new Date();

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

  },
  mounted() {
     
    // EVENTS
    window.eventBus.on("HFRadarDataLoaded", tmst => {
        this.createHTML();
    });
    
  },
  data (){
    return {
      months: [],
      years: [],
      days: [],
      hours: [],
    }
  },
  methods: {
    createHTML: function() {
      let startYear = this.startDate.getUTCFullYear();
      let startMonth = this.startDate.getUTCMonth();
      let startHour = this.startDate.getUTCHours();
      let endYear = this.endDate.getUTCFullYear();
      let endMonth = this.endDate.getUTCMonth();
      let endHour = this.endDate.getUTCHours();

      // Selected date
      console.log(window.GUIManager.currentTmst);
      let selDate = new Date(window.GUIManager.currentTmst);
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
          title: i + "-" + selDay + "-" + (selMonth+1) + "-" + selYear,
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
.calendarContainer {
  position: fixed;
  right: 0;
  bottom: 0;

  width: clamp(200px, 50%, 500px);
  padding: 30px;

  left: 50%;
  transform: translate(-50%, -50%);

  background: rgba(20, 120, 167, 0.9);
  border-radius: 10px;

  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: center;
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

.monthButton {
  
}

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
</style>