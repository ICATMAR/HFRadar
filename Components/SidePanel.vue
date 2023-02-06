<template>
  <!-- Container -->
  <div id='side-panel' ref='sidepanel'>
    side panel
    <div>
      HERE GOES INFORMATION ABOUT THE RADAR
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
#side-panel{
  min-width: 500px;
  background: rgb(240, 240, 255);
  height: 100vh;
}
</style>