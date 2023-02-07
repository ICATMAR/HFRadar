
class DataManager {

  visibleHFRadars = [];
  HFRadars = [];

  constructor(){

    window.eventBus.on('LoadedHFRadarData', (HFRadarData) => { // From loadRawHFData.js
      this.HFRadars.push(HFRadarData); // TODO: CHECK UUID, MAYBE DATA WAS ALREADY LOADED
      this.visibleHFRadars = [HFRadarData];
    });
  }


}

export default DataManager