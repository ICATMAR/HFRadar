// Google analytics event manager class
class GAnalyticsManager {

  constructor(){
    // EVENTS
    //https://developers.google.com/analytics/devguides/collection/ga4/events?client_type=gtag
    //https://developers.google.com/analytics/devguides/collection/ga4/event-parameters?client_type=gtag
    //https://support.google.com/analytics/answer/9267568#mark

    //gtag("event", "advanced_interface", {
      // "file_type": "csv",
      // "aggregation_type": "port",
      // "myCustomVariable": "gerard",
    //});

    // If user clicks on advanced interface, send the event once per page load
    window.eventBus.on('AdvancedInterfaceOnOff', (state) => {
      if (state){
        if(this.eventAdvancedInterfaceOnce == undefined){
          gtag("event", "advanced_interface", {});
          this.eventAdvancedInterfaceOnce = true;
        }
      }
    });


    window.eventBus.on('DownloadDataMenu_Download', el => {
      // {fileFormat: 'tuv', date: latestTmst, processStage: 'L3', numFiles}

      // Ecommerce analytics - array items
      // https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtag#implementation
      // https://developers.google.com/analytics/devguides/collection/ga4/set-up-ecommerce
      gtag("event", "purchase", {
        value: 1,
        currency: el.fileFormat,
        items : [{
          item_id: "hfradar_" + el.processStage + "_" + el.fileFormat,
          item_name: "HFRadar " + el.processStage + " as " + el.fileFormat,
          item_category: el.processStage,
          item_category2: el.date,
          item_variant: el.fileFormat,
          price: 1,
          quantity: el.numFiles,
        }]
      });
    });

  }
}


export default GAnalyticsManager;