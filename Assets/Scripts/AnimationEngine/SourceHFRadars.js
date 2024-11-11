// HFRadar data source
class SourceHFRadar {

  constructor(HFRadarData){
    this.data = HFRadarData;
    this.isReady = true;
  }

  updateData(HFRadarData){
    this.data = HFRadarData;
  }
}


// Combined Radar data source
class SourceCombinedRadar {

  constructor (CombinedRadarData){
    this.dataGrid = CombinedRadarData;
    this.isReady = true;
    this.animation = {
      type: 'velocity'
    };
  }

  updateData(CombinedRadarData) {
    this.dataGrid = CombinedRadarData;
    // SOMETHING ELSE HERE?
  }


  getValueAtLongLat(long, lat, value){
    
    let grid = this.dataGrid; 

    let longIndex = Math.floor(grid.numLongPoints * (long - grid.minLong) / grid.rangeLong);
    let latIndex = Math.floor(grid.numLatPoints * (lat - grid.minLat) / grid.rangeLat);
    longIndex = longIndex == -1 ? 0 : longIndex;
    latIndex = latIndex == -1 ? 0 : latIndex;

    // Indices are outside the data grid
    if (longIndex < 0 || latIndex < 0 || longIndex >= grid.numLongPoints || latIndex >= grid.numLatPoints){
      //console.log("Index out of bounds. longIndex: " + longIndex + ", latIndex: " + latIndex + ", Resolution: " + grid.numLongPoints + "x" + grid.numLatPoints);
      value[0] = undefined;
      value[1] = undefined;
      return value;
    }

    // Lat and long are on land
    if (window.DataManager){
      let coord = ol.proj.transform([long, lat], 'EPSG:4326', 'EPSG:3857');
      // If point is found in land, write as undefined and return
      if (window.DataManager.isThereLand(...coord)){
        // Assign
        value[0] = undefined;
        value[1] = undefined;
        return value;
      }
    }

    // Find value
    let index = latIndex * grid.numLongPoints + longIndex;
    value[0] = grid.dataGrid[ index * 2];
    value[1] = grid.dataGrid[ index * 2 + 1];
    // dataGrid returns NaN when it does not have a value. Transform to undefined here
    if (isNaN(value[0])) {
      value[0] = undefined;
      value[1] = undefined;
    }

    return value;
  }
}


export {SourceHFRadar, SourceCombinedRadar}