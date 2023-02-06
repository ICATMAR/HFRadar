<template>
  <!-- Container -->
  <div id='side-panel' ref='sidepanel'>
    side panel
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
  background: blue;
  height: 100vh;
}
</style>