<template>
    <div id="menuLeft" class="menuLeft">

      <widgetMapOptions></widgetMapOptions>
  
    </div>
  </template>
  


  
  
  <script>
  import WidgetMapOptions from "Components/WidgetMapOptions.vue"

  export default {
    name: "menuLeft",
    created(){

    },
    mounted(){
  
    },
    unmounted(){
  
    },
    data(){
      return {

      }
    },
    methods: {

  
    },
    components: {
      "widgetMapOptions": WidgetMapOptions
    },
    computed: {
  
    }
  }
  </script>
  
  <style scoped>
  #menuLeft {
    position: absolute;

    top: 120px;
    bottom: 130px;

    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;

    pointer-events: none;

  }

  @media screen and  (max-width: 770px) {
    #menuLeft {
      top: 90px;
    }
  }

  </style>