<template>
  <!-- Container -->
  <!-- https://www.w3schools.com/howto/howto_css_switch.asp -->
  <div id='onoffButton' ref='onoffButton' @click="e => e.stopPropagation()">
    <!-- Rounded switch -->
    <label class="switch">
      <input type="checkbox" :checked="checked" @mousedown="(e) => {e.stopPropagation(); e.preventDefault(); $emit('change', $event)}">
      <span class="slider round"></span>
    </label>
  </div>
</template>


<script>

// Import components
//import Map from 'Components/Map.vue'

export default {
  name: 'onoffButton', // Caps, no -
  props: {
    checked: Boolean,
  },
  created() {
    
  },
  mounted() {

  },
  
  data (){
    return {
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
#onoffButton {
  display:flex;
}


/* The switch - the box around the slider */
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}


input:checked + .slider {
  background-color: var(--red);
}

input:focus + .slider {
  box-shadow: 0 0 1px var(--red);
}

input:checked + .slider:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>