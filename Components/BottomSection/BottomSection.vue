<template>
  <div id="bottom-section">

    <!-- Time Range Bar -->
    <Transition><!-- Vue transition -->
      <time-range-bar v-show="isAdvancedInterfaceOnOff"></time-range-bar>
    </Transition>

  </div>
</template>



<script>
import TimeRangeBar from "./TimeRangeBar.vue"

export default {
  name:"BottomSection",
  mounted() {
    // EVENTS
    window.eventBus.on('AdvancedInterfaceOnOff', state => this.isAdvancedInterfaceOnOff = state);

  },
  data() {
    return {
      isAdvancedInterfaceOnOff: true,
    }
  },
  methods :{

  },
  components: {
    "time-range-bar": TimeRangeBar,
  }
}
</script>



    DataTicker



<style scoped>

#bottom-section {
  position: absolute;
  bottom: 0px;
  left: 0px;
  right: 300px;
  pointer-events: none;
}


/* Mobile */
@media screen and (max-width: 770px) {
  #bottom-section {
    right: 0px;
  }
}


/* Transitions for elements */
.v-enter-active,
.v-leave-active {
  transition: all 0.3s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  height: 0;
  transform: translateY(20px);
}
</style>