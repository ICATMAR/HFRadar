// HFRadar class (for data managing purposes)
class HFRadar {

    // data = {};
    // waveData = {};
    // waveDataHourly = {};
    // windData = {};
    headers = {}; // Headers contain some time information too
    images = {};
  
    // Legend
    legendRange = [-100, 100];
  
  
    constructor(HFRadarData){
  
      this.header = HFRadarData.header;
  
      // Define header
      let keys = Object.keys(HFRadarData.header)
      // TO FIX - IS THIS NECESSARY?
      for (let i = 0; i < keys.length; i++){
        let key = keys[i];
        // Fix Site string
        if (key == 'Site')
          HFRadarData.header[key] = HFRadarData.header[key].replace(' ""', '').replaceAll(" ", "").replaceAll("\r", "");
        if (HFRadarData.header[key] != undefined)
          this[key] = HFRadarData.header[key];
      }
  
      // UUID
      this.UUID = HFRadarData.header.Site; //HFRadarData.header.PatternUUID.replaceAll(" ", "");
  
      // Store data
      this.addRadarData(HFRadarData);
  
    }
  
    // PUBLIC METHODS
    // Ingest new data
    // Could use the HFRadarData.header.UUID to identify the files. Timestamp works better for accessibility.
    addRadarData(HFRadarData){
  
      // Process wave history data
      if (HFRadarData.header.FileType.includes('Wave')){
        this.waveData = this.waveData || {};
        this.windData = this.windData || {};
        for (let i = 0; i < HFRadarData.data.length; i++){
          let wData = HFRadarData.data[i];
          if (wData.MWHT != "999.00"){
            this.waveData[wData.TMST] = wData;
          }
          this.windData[wData.TMST] = wData;
        }
        // TODO: calculate hourly wave and wind data
        // Hourly data
        this.waveHourlyData = this.waveHourlyData || {};
        this.windHourlyData = this.windHourlyData || {};
        let sDate = new Date(HFRadarData.data[0].TMST);
        let eDate = new Date(HFRadarData.data[HFRadarData.data.length-1].TMST);
        let movingDate = new Date(sDate.getTime());
        movingDate.setUTCHours(0);
        movingDate.setUTCMinutes(0);
        // 10 min interval
        let num10minSteps = Math.ceil((eDate.getTime() - movingDate.getTime()) / (1000 * 60 * 10)); // Wave data is collected every 10 min
        let waveCount = 0;
        let windCount = 0;
        let wHeights = [];
        let wPeriods = [];
        let wBearings = [];
        let windBearings = [];
        let sources = [];
        // Helper function to calculate average angle and stds
        const avgBearings = function(bearings){
          let sumSin = bearings.reduce((sum, value) => sum + Math.sin(value * Math.PI/180), 0);
          let sumCos = bearings.reduce((sum, value) => sum + Math.cos(value * Math.PI/180), 0);
          let bearing = (Math.atan2(sumSin/bearings.length, sumCos/bearings.length) * 180 / Math.PI);
          if (bearing < 0)
            bearing += 360;
          return bearing;
        }
        // TODO STD
        // TODO ANGLE STD https://en.wikipedia.org/wiki/Directional_statistics#Standard_deviation
        // Interate in 10 min intervals
        for (let i = 0; i < num10minSteps; i++){
          if (movingDate.getUTCMinutes() == 40){
            let tmst = movingDate.toISOString().substring(0, 14) + "00:00.000Z";
            // Wave parameters
            if (waveCount != 0){
              // Calculate parameters
              let heightMean = wHeights.reduce((sum, value) => sum + value, 0) / waveCount;
              let periodMean = wPeriods.reduce((sum, value) => sum + value, 0) / waveCount;
              let bearingMean = avgBearings(wBearings);           
              // TODO: RANGE CELLS
              // TODO: STD
              this.waveHourlyData[tmst] = {
                "MWHT": heightMean,
                "MWPD": periodMean,
                "WAVB": bearingMean,
                "TMST": tmst,
                "N": waveCount,
                sources,
              };
            }
            // Wind parameters
            if (windCount != 0){
              let windBearingMean = avgBearings(windBearings);
              this.windHourlyData[tmst] = {
                "WNDB": windBearingMean,
                "TMST": tmst,
                "N": windCount,
                sources,
              }
            }
            
            // Reset
            waveCount = 0;
            windCount = 0;
            wHeights = [];
            wPeriods = [];
            wBearings = [];
            windBearings = [];
            sources = [];
          }
  
  
          // Keep values for averaging
          let wvData = this.waveData[movingDate.toISOString()];
          let wdData = this.windData[movingDate.toISOString()];
          // Missing date
          if (wvData != undefined){
             // If wave data exists
            if (wvData["MWHT"] != "999.00"){
              wHeights.push(1 * wvData["MWHT"]);
              wPeriods.push(1 * wvData["MWPD"]);
              wBearings.push(1 * wvData["WAVB"])
              waveCount++;
            }
          }
          if (wdData != undefined){
            // Wind data (always exist?)
            if (wdData["WNDB"] != "999.00"){
              windBearings.push(1 * wdData["WNDB"]);
              windCount++;
            }
          }
            
         
          sources.push(wvData || wdData);
          // Increase time stamp
          movingDate.setUTCMinutes(movingDate.getUTCMinutes() + 10);
  
        }
  
        return;
      }
      
      // Process radar data
      this.data = this.data || {};
      // Get timestamp
      let timestamp = this.getTimestamp(HFRadarData);
  
      // Check if timestamp already exists
      if (this.data[timestamp] != undefined) 
        console.warn ("Overwritting. HFRadar: " + HFRadarData.header.Site + " on timestamp: " + timestamp);
  
      // Store data
      this.data[timestamp] = HFRadarData.data;
      // Store header too
      this.headers[timestamp] = HFRadarData.header;
  
      // Store latest data timestamp
      this.lastLoadedTimestamp = timestamp;
      // Store most recent timestamp
      if (this.latestTimestamp != undefined){
        if (new Date(this.latestTimestamp) < new Date(timestamp))
          this.latestTimestamp = timestamp;
      } else
        this.latestTimestamp = timestamp;
  
      // Create data features
      this.updateDataPointFeatures(HFRadarData.data);
    }
  
  
    // Update and create data features
    updateDataPointFeatures(dataPoints){
      
      // Create data point features
      if (this.dataPointFeatures == undefined){
        this.dataPointFeatures = {};
      }
      
      // Iterate data points
      for (let i = 0; i < dataPoints.length; i++){
        let dataPoint = dataPoints[i];
        // Iterate features
        Object.keys(dataPoint).forEach(key => {
          let value = dataPoint[key];
          // Create feature if it does not exist
          if (this.dataPointFeatures[key] == undefined){
            this.dataPointFeatures[key] = {
              "max": value,
              "min": value,
              // TODO: HERE COULD BE CUSTOM VISUALIZATION OPTIONS SPECIFIC FOR EACH FEATURE
            }
          }
          // Calculate range (max min)
          if (value > this.dataPointFeatures[key].max)
            this.dataPointFeatures[key].max = value;
          if (value < this.dataPointFeatures[key].min)
            this.dataPointFeatures[key].min = value;
  
        });
      }
  
    }
  
  
  
    getRadarOrigin(){
      let locationStr = this.header.Origin;
      let location = locationStr.trim().replace(/\s\s+/g, ',').replace('\r', '').split(',');
      location = location.slice(0,2).reverse();
      location[0] = parseFloat(location[0]);
      location[1] = parseFloat(location[1]);
      return location;
    }
  
    getTimestamp(HFRadarData){
      // Get timestamp
      let tmst = HFRadarData.header.TimeStamp;
      let ttRaw = tmst.split(" ");
      let tt = [];
      for (let i = 0; i < ttRaw.length; i++){
        if (ttRaw[i].length != 0) tt.push(ttRaw[i]);
      }
      let dd = new Date(tt[0] +"-"+ tt[1]+"-"+ tt[2]+"T"+ tt[3]+":"+ tt[4]+ 'Z');
      return dd.toISOString();
    }
  
  
    getLegendRange(){
      return this.legendRange;
    }
  }
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  class CombinedRadars extends HFRadar {
  
    dataGrid = {};
    legendRange = [0, 100];
  
    constructor (CombinedRadarData){
      
      super(CombinedRadarData);
      // WARN, HACK, TODO: for some reason when calling super, the addRadarData from CombinedRadars is called but
      // the data structure is not store, e.g. this.dataGrid is empty. addRadarData needs to be called again. This only happens
      // once when the CombinedRadar is created: new CombinedRadars();
      this.addRadarData(CombinedRadarData); // Consider using power of two numbers to create image and upsample later
    }
  
  
    addRadarData(CombinedRadarData, resolutionLong, resolutionLat){
      if (this.dataGrid == undefined)
       this.dataGrid = {};
      if (this.data == undefined)
        this.data = {};
  
  
      // Get timestamp
      let timestamp = this.getTimestamp(CombinedRadarData);
  
      // Store data grid
      if (this.dataGrid[timestamp]){
        console.log("Overwritting data grid");
      }
      this.data[timestamp] = CombinedRadarData.data;
      // Store header too
      this.headers[timestamp] = CombinedRadarData.header;
  
  
  
  
      let data = CombinedRadarData.data;
      
      // Calculate range
      let minLat = 999;
      let minLong = 999;
      let maxLat = -999;
      let maxLong = -999;
  
      let distances = [];
    
      for (let i = 0; i< data.length; i++){
        if (data[i]['Longitude (deg)'] > maxLong) maxLong = data[i]['Longitude (deg)'];
        if (data[i]['Longitude (deg)'] < minLong) minLong = data[i]['Longitude (deg)'];
        if (data[i]['Latitude (deg)'] > maxLat) maxLat = data[i]['Latitude (deg)'];
        if (data[i]['Latitude (deg)'] < minLat) minLat = data[i]['Latitude (deg)'];
        // Store distances (assuming that points are adjacent!)
        if (i< data.length -1) {
          distances.push( this.calcDistance( data[i]['Longitude (deg)'], data[i]['Latitude (deg)'],
                                           data[i+1]['Longitude (deg)'], data[i+1]['Latitude (deg)'] ));
        }
      }
      // Calculate distance between two adjacent points
      // WARN: in erroneous files this might fail, i.e., we are assuming that points are adjacent.
      distances.sort(); // Sort the distances
      let distanceLimit = distances[Math.floor(distances.length/2)]; // Take the median (most points are adjacent)
      let areaOriginalDataPoint = distanceLimit * distanceLimit;
  
    
    
      // Margins
      maxLat += 0.013;
      minLat -= 0.013;
      maxLong += 0.017;
      minLong -= 0.017;
      // TODO: make it regular for temporal animation? i.e. each timestamp has different a dataGrid. This adds an extra step when
      // interpolating dataGrids (the index of the cell grid has to be calculated again)
      let rangeLat = maxLat - minLat;
      let rangeLong = maxLong - minLong;
  
      //console.log(rangeLat)
      //console.log(rangeLong)
  
      let resLat = resolutionLat || Math.ceil(rangeLat * 150);//300;
      let resLong = resolutionLong || Math.ceil(rangeLong * 125);//250;
      let stepLat = rangeLat / resLat;
      let stepLong = rangeLong / resLong;
  
  
      // Create grid for fast look-up of distances
      // The cell size is related to the distance between adjacent points (distanceLimit) and
      // the range in lat or long. We want to minimize the number of data points per cell (ideally 1) because
      // the computation expense comes from calculating distances between the dataGrid point (for animation) and the original data points.
  
      // WARN: in erroneous files it might be better to have a predefined grid?
      const LOOKUPGRIDRESOLUTION = Math.ceil(Math.max(rangeLat, rangeLong)/(distanceLimit * Math.sqrt(2)));
      let numCols = LOOKUPGRIDRESOLUTION;
  
      // Predefined grid
      // const MINLONG = 3.0;
      // const MAXLONG = 3.2;
      // const MINLAT = 41.0;
      // const MAXLAT = 41.5;
      // const LOOKUPGRIDRESOLUTION = Math.max(resLat, resLong)/10; // Predefined grid
      // let numCols = Math.round((MAXLONG - MINLONG) * LOOKUPGRIDRESOLUTION);
      // let numRows = Math.round((MAXLAT - MINLAT) * LOOKUPGRIDRESOLUTION);
      // let numGridCells = numCols * numRows;
      let lookupGrid = new Array(); // TODO: PREALLOCATE MEMORY?
      // Fill lookupGrid with point indices
      for (let i = 0; i < data.length; i++){
        let long =  data[i]['Longitude (deg)'];
        let lat = data[i]['Latitude (deg)'];
        // let colIndex = Math.floor((long - MINLONG) * LOOKUPGRIDRESOLUTION); // Predefined grid
        // let rowIndex = Math.floor((lat - MINLAT) * LOOKUPGRIDRESOLUTION); // Predefined grid
        let colIndex = Math.floor((long - minLong) * LOOKUPGRIDRESOLUTION);
        let rowIndex = Math.floor((lat - minLat) * LOOKUPGRIDRESOLUTION);
        // Store grid indices of cells
        let gridCellIndex = rowIndex * numCols + colIndex; 
        if (lookupGrid[gridCellIndex] == undefined)
          lookupGrid[gridCellIndex] = [i];
        else
          lookupGrid[gridCellIndex].push(i);
      }
      
  
    
      // Create typed array
      let dataGrid = new Float32Array(resLat * resLong * 2);
      // let debug_numberOfIterationsPerDataGridPoint = 0;
      for (let ii = 0; ii < dataGrid.length / 2; ii++){
  
        let i = Math.floor( ii / resLong); // Lat index
        let j = ii % resLong; // Long index
        
        let long = minLong + j * stepLong;
        let lat = minLat + i * stepLat;
        // Transform to check land mask
        let coord = ol.proj.transform([long, lat], 'EPSG:4326', 'EPSG:3857');
        // If point is found in land, write as undefined and continue
        if (window.DataManager.isThereLand(...coord)){
          // Assign
          dataGrid[ii * 2] = undefined;
          dataGrid[ii * 2 + 1] = undefined;
          continue;
        }
  
  
  
        // Interpolation
        // Find four closest points using the grid
        let dataPointDistances = []; // TODO OPTIMIZE MEMORY
        // let colIndex = Math.floor((long - MINLONG) * LOOKUPGRIDRESOLUTION); // Predefined grid
        // let rowIndex = Math.floor((lat - MINLAT) * LOOKUPGRIDRESOLUTION); // Predefined grid
        let colIndex = Math.floor((long - minLong) * LOOKUPGRIDRESOLUTION);
        let rowIndex = Math.floor((lat - minLat) * LOOKUPGRIDRESOLUTION);
        let gridCellIndex = rowIndex * numCols + colIndex;
        
  
        // Iterate surrounding 9 cells
        colIndex--;
        rowIndex--;
        for (let cc = 0; cc < 9; cc++){ // Iterate surrounding cells
          let tmpR = rowIndex + Math.floor(cc/3); // Row
          let tmpC = colIndex + cc%3 // Col
          gridCellIndex = tmpR * numCols + tmpC;
  
          // First test, use only the ones inside the cell
          let gridCell = lookupGrid[gridCellIndex];
          if (gridCell !== undefined){
            
            for (let kk = 0; kk < gridCell.length; kk++){
              let indexData = gridCell[kk];
              // Calculate distance
              let dd = this.calcDistance(long, lat, data[indexData]['Longitude (deg)'], data[indexData]['Latitude (deg)']);
              //debug_numberOfIterationsPerDataGridPoint++;
              if (dd < distanceLimit){
                dataPointDistances.push([dd, indexData]);
              }
              // Exit loop if four points are found
              if (dataPointDistances.length >= 4)
                kk = gridCell.length;
            }
  
          } // End if girdCell
  
        }// End cc for
  
  
  
        // for (let dIndex = 0; dIndex < data.length; dIndex++){
        //   // Calculate distance
        //   let dd = this.calcDistance(long, lat, data[dIndex]['Longitude (deg)'], data[dIndex]['Latitude (deg)']);
        //   //debug_numberOfIterationsPerDataGridPoint++;
        //   if (dd < distanceLimit){
        //     dataPointDistances.push([dd, dIndex]);
        //   }
        // }
  
  
  
        // Interpolate
        // TODO: something wrong with the distance calculation?
        let UValue = undefined;
        let VValue = undefined;
  
        let threePointInterpPossible = dataPointDistances.length >= 3;
        // let closestDataPoint = undefined;
        // let secondClosest = undefined;
        if (dataPointDistances.length != 0){
          dataPointDistances.sort( (a,b) => a[0] - b[0] );
          let dataPoint = data[dataPointDistances[0][1]];
          // closestDataPoint = dataPoint;
          // Nearest neighbour
          if (dataPointDistances.length == 1){
            UValue = dataPoint['U-comp (cm/s)'];
            VValue = dataPoint['V-comp (cm/s)'];
          }
          // Other interpolation methods (triangular with areas and linear interpolation)
          else {
            // Check if it is possible to do interpolation between three points
            // Three points that form a triangle
            if (threePointInterpPossible){
              // Calculate interpolation of a triangle using areas
              let getTriangleArea = (x0, y0, x1, y1, x2, y2) => {
                return Math.abs(0.5 *  ( x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1) ));
              }
  
              let A = data[dataPointDistances[0][1]];
              let B = data[dataPointDistances[1][1]];
              let C = data[dataPointDistances[2][1]];
  
              // Area P - B - C
              let areaA = getTriangleArea(long, lat, B['Longitude (deg)'], B['Latitude (deg)'], C['Longitude (deg)'], C['Latitude (deg)']);
              // Area P - A - C
              let areaB = getTriangleArea(long, lat, A['Longitude (deg)'], A['Latitude (deg)'], C['Longitude (deg)'], C['Latitude (deg)']);
              // Area P - A - B
              let areaC = getTriangleArea(long, lat, A['Longitude (deg)'], A['Latitude (deg)'], B['Longitude (deg)'], B['Latitude (deg)']);
  
              //let areas = calcVoronoiArea(long, lat, A['Longitude (deg)'], A['Latitude (deg)'], B['Longitude (deg)'], B['Latitude (deg)'], C['Longitude (deg)'], C['Latitude (deg)']);
              let totalArea = getTriangleArea(A['Longitude (deg)'], A['Latitude (deg)'], B['Longitude (deg)'], B['Latitude (deg)'], C['Longitude (deg)'], C['Latitude (deg)']);
              
              // Total area should match the sum of the three areas. Otherwise the point is outside the triangle
              let isInsideTriangle = Math.abs(areaA + areaB + areaC - totalArea) < 10e-16;
  
              //console.log(Math.abs(areaA + areaB + areaC - totalArea));
  
              if (isInsideTriangle) {
                let w1 = areaA / totalArea;
                let w2 = areaB / totalArea;
                let w3 = areaC / totalArea;
  
                // Comparison with distances
                // let dw1 = 1 / dataPointDistances[0][0];
                // let dw2 = 1 / dataPointDistances[1][0];
                // let dw3 = 1 / dataPointDistances[2][0];
                // let ddw1 = dw1 / (dw1 + dw2 + dw3);
                // let ddw2 = dw2 / (dw1 + dw2 + dw3);
                // let ddw3 = dw3 / (dw1 + dw2 + dw3);
  
                UValue = A['U-comp (cm/s)'] * w1 + B['U-comp (cm/s)'] * w2 + C['U-comp (cm/s)'] * w3;
                VValue = A['V-comp (cm/s)'] * w1 + B['V-comp (cm/s)'] * w2 + C['V-comp (cm/s)'] * w3;
  
              }
              else
              threePointInterpPossible = false;
            }
  
            // Linear interpolation
            if (!threePointInterpPossible) {
              let d1 = dataPointDistances[0][0];
              let d2 = dataPointDistances[1][0];
              let totD = d1 + d2;
              let dataPoint1 = data[dataPointDistances[0][1]];
              let dataPoint2 = data[dataPointDistances[1][1]];
              // secondClosest = dataPoint2;
  
              UValue = dataPoint1['U-comp (cm/s)'] * (1 - d1/totD) + dataPoint2['U-comp (cm/s)'] * (d1 / totD);
              VValue = dataPoint1['V-comp (cm/s)'] * (1 - d1/totD) + dataPoint2['V-comp (cm/s)'] * (d1 / totD);
            }
          } // End of linear or triangular interpolation
  
        } // End of -is there a close point-
  
  
        // When using tuv files there is no quality control and some values are out of range
        if (Math.abs(UValue) > 250 || Math.abs(VValue) > 250){
          UValue = undefined;
          VValue = undefined;
        }
  
        // Assign
        // undefined turns into NaN for FloatArray32
        dataGrid[ii * 2] = UValue;
        dataGrid[ii * 2 + 1] = VValue;
  
  
        // Point towards the data point location
        // if (closestDataPoint != undefined){
        //   dataGrid[ii * 2] = (closestDataPoint['Longitude (deg)'] - long) * 1000;
        //   dataGrid[ii * 2 + 1] = (closestDataPoint['Latitude (deg)'] - lat) * 1000;
        // }
        // if (secondClosest != undefined){
        //   dataGrid[ii * 2] = (secondClosest['Longitude (deg)'] - long) * 1000;
        //   dataGrid[ii * 2 + 1] = (secondClosest['Latitude (deg)'] - lat) * 1000;
        // } else {
        //   dataGrid[ii * 2] = undefined;
        //   dataGrid[ii * 2 + 1] = undefined;
        // }
  
      }
      //console.log("numberOfIterationsPerDataGridPoint: " + debug_numberOfIterationsPerDataGridPoint/dataGrid.length);
      
      this.dataGrid[timestamp] = {
        dataGrid,
        minLat,
        maxLat,
        minLong,
        maxLong,
        stepLong,
        stepLat,
        rangeLong,
        rangeLat,
        "numLongPoints": resLong,
        "numLatPoints": resLat,
        "originalData": CombinedRadarData.data,
        "areaOriginalDataPoint": areaOriginalDataPoint, // This is used in the animation engine to calculate the density of the data source 
      }
  
      
      // Store last loaded timestamp
      this.lastLoadedTimestamp = timestamp;
      // Store most recent timestamp
      if (this.latestTimestamp != undefined){
        if (new Date(this.latestTimestamp) < new Date(timestamp))
          this.latestTimestamp = timestamp;
      } else
        this.latestTimestamp = timestamp;
  
    }
  
  
    // Calculate distance
    calcDistance(x, y, a, b){
      return Math.sqrt((x-a)*(x-a) + (y-b)*(y-b));
    }
  
  
    // Get value at Lon-Lat
    // THIS FUNCTION IS DUPLICATED IN AnimationEngine.js --> REFACTOR, BUT HOW? AnimationEngine only gets data, not whole Radar class
    getValueAtTmstLongLat(tmst, long, lat, value){
      
      let grid = this.dataGrid[tmst]; 
  
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
  
      // Find value
      let index = latIndex * grid.numLongPoints + longIndex;
      value[0] = grid.dataGrid[ index * 2];
      value[1] = grid.dataGrid[ index * 2 + 1];
  
      return value;
    }
  }


  export {HFRadar, CombinedRadars}