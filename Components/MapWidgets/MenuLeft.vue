<template>
    <div id="menuLeft" class="menuLeft">

      <!-- Advanced menu -->
      <div id="advancedMenuContainer" class="clickable">
        <onOffButton ref="advancedOnOffButton" :checked="false" :inSize="'18px'" @change="advancedOnOffButtonClicked($event)"></onOffButton>
        <span @click="advancedOnOffButtonClicked">Advanced interface</span>
      </div>

      <widgetMapOptions v-show="isAdvancedInterfaceOnOff"></widgetMapOptions>

      <widgetDroppedFiles></widgetDroppedFiles>
  
    </div>
  </template>
  


  
  
  <script>
  import OnOffButton from "../OnOffButton.vue";
  import WidgetDroppedFiles from "./WidgetDroppedFiles.vue";
  import WidgetMapOptions from "./WidgetMapOptions.vue"

  export default {
    name: "menuLeft",
    created(){

    },
    mounted(){
      // Advanced interface dependant on hash and GUIManager
      this.isAdvancedInterfaceOnOff = window.GUIManager.isAdvancedInterface;
      // Emits an event (provoke click)
      this.$refs.advancedOnOffButton.setChecked(this.isAdvancedInterfaceOnOff);
      //window.eventBus.emit("AdvancedInterfaceOnOff", this.isAdvancedInterfaceOnOff);
    },
    unmounted(){
  
    },
    data(){
      return {
        isAdvancedInterfaceOnOff: false,
      }
    },
    methods: {
      advancedOnOffButtonClicked: function(e){
        // OnOff Button was clicked
        if (e.target.value != undefined){ 
          this.isAdvancedInterfaceOnOff = e.target.checked;
          // Emit
          window.eventBus.emit("AdvancedInterfaceOnOff", e.target.checked);
        } 
        // Text was clicked --> Invoke click on the element, which calls again this function
        else {
          this.$refs.advancedOnOffButton.setChecked(!this.isAdvancedInterfaceOnOff);
        }
      },
  
    },
    components: {
    "widgetMapOptions": WidgetMapOptions,
    "widgetDroppedFiles": WidgetDroppedFiles,
    "onOffButton": OnOffButton,
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

    z-index: 5;
  }

  #advancedMenuContainer{
    display: flex;
    flex-direction: row;
    align-items: center;
    padding-left: 18px;
    padding-bottom: 8px;
    padding-top: 8px;
  }

  @media screen and  (max-width: 770px) {
    #menuLeft {
      top: 90px;
    }
  }

  </style>