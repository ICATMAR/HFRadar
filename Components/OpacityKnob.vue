<template>
  <div id="knob">
    <!-- https://www.youtube.com/watch?v=ELUSz0L8vTA&ab_channel=QuickCodingTuts -->
    <div class="slider clickable" :title="$t('Opacity')">
      <div class="knob" ref="knob" @mousedown="knobMouseDown" @touchstart="knobMouseDown">
      </div>
    </div>
  </div>
</template>




<script>

export default {
  name: "opacityKnob",
  props: {
    size: String
  },
  created() {
    
  },
  mounted() {
    // Declare listening events
    this.setAngle(120);
  },
  data() {
    return {
      // hidePanel: true,
      sizeKnob: this.size || "70px"
    }
  },
 
  methods: {
    // Set angle
    setAngle(angle){
      this.$refs.knob.style.transform = `rotate(${angle}deg)`;
    },
    // Remove event listeners
    removeEventListeners: function(){
      // Knob event
      document.removeEventListener("mousemove", this.mouseMoveRotateKnob);
      document.removeEventListener("touchmove", this.mouseMoveRotateKnob);
      // Document event
      document.removeEventListener("mouseup", this.removeEventListeners);
      document.removeEventListener("touchend", this.removeEventListeners);
    },
    mouseMoveRotateKnob: function (e) {
      // If it is a mouse event
      if (e.clientX){
        e.preventDefault();
        e.stopPropagation();
      }
      // Get the center of the knob
      let bbox = this.$refs.knob.getBoundingClientRect();
      let centerX = bbox.x + bbox.width/2;
      let centerY = bbox.y + bbox.height/2;
      // Get the pointer location (mouse or touch)
      let pointerX = e.clientX ? e.clientX : e.touches[0].clientX;
      let pointerY = e.clientY ? e.clientY : e.touches[0].clientY;

      // Get the vector from the mouse to the center of the knob
      let vecX = centerX - pointerX;
      let vecY = centerY - pointerY;
      // Calculate angle
      let angleRad = Math.atan2(vecY, vecX);
      let angle = angleRad * 180 / Math.PI - 90;
      
      // 0-360 range
      angle = (angle+360)%360;
      
      // Limit angles
      let limit = 120;
      if (angle < 180 && angle > 120) angle = 120;
      if (angle > 180 && angle < 240) angle = 360-limit;

      // Normalize value
      if (angle > 180)
       angle = angle - 360;
      let normValue = (angle + limit)/(limit*2);

      this.$emit("change", normValue);
      // Rotate knob
      this.$refs.knob.style.transform = `rotate(${angle}deg)`;

    },
    // USER ACTIONS
    knobMouseDown: function (e) {
      // Create event listeners 
      //e.preventDefault();
      //e.stopPropagation();
      // Mouse move changes angle
      document.addEventListener("mousemove", this.mouseMoveRotateKnob);
      document.addEventListener("touchmove", this.mouseMoveRotateKnob);
      // Mouse up removes event listeners
      document.addEventListener("mouseup", this.removeEventListeners);
      document.addEventListener("touchend", this.removeEventListeners);
    },
  },
  components: {
  }
}
</script>






<style scoped>
.slider::before {
    width: v-bind('sizeKnob');
    height: v-bind('sizeKnob');
    border-radius: 50%;

    background-image: url('Assets/Images/opacity-knob.png');
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center center;

    box-shadow: 0px 0px 4px rgb(0, 0, 0);
    
  }

  .slider::before, .knob {
    width: v-bind('sizeKnob');
    height: v-bind('sizeKnob'); 
    position: relative;
    cursor: pointer;
  }

  .knob::before, .knob::after, .slider::before {
    content: '';
    position: absolute;
    border-radius: 50%;
  }

  .knob::before {
    top: calc(v-bind('sizeKnob')/7);
    left: 50%;
    transform:translateX(-50%);
    width: calc(v-bind('sizeKnob')/7);;
    height: calc(v-bind('sizeKnob')/7);;
    background: white;
    box-shadow: 0px 0px 4px rgb(0, 0, 0);
  }

  .knob:hover::before {
    background: white;
  }
</style>