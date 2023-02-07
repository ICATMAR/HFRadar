const earthRadius = 6378;

const createImage = function(HFRadarData){

  let data = HFRadarData.data;

  // Calculate range
  let minLat = 999;
  let minLong = 999;
  let maxLat = -999;
  let maxLong = -999;

  for (let i = 0; i< data.length; i++){
    if (data[i]['Longitude (deg)'] > maxLong) maxLong = data[i]['Longitude (deg)'];
    if (data[i]['Longitude (deg)'] < minLong) minLong = data[i]['Longitude (deg)'];
    if (data[i]['Latitude (deg)'] > maxLat) maxLat = data[i]['Latitude (deg)'];
    if (data[i]['Latitude (deg)'] < minLat) minLat = data[i]['Latitude (deg)'];
  }

  // Margins
  maxLat += 0.01;
  minLat -= 0.01;
  maxLong += 0.01;
  minLong -= 0.01;

  let rangeLat = maxLat - minLat;
  let rangeLong = maxLong - minLong;
  let ratio = rangeLat/rangeLong;
  ratio = ratio / Math.cos((maxLat*0.5 + minLat*0.5) * Math.PI / 180); // epsg 3857 correction // https://stackoverflow.com/questions/7477003/calculating-new-longitude-latitude-from-old-n-meters
  // Create canvas
  let canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = canvas.width * ratio;
  // Create context
  let ctx = canvas.getContext('2d');
  ctx.translate(0, canvas.height)
  ctx.scale(1,-1);
  
  

  // Paint canvas
  // First do points
  for (let i = 0; i< data.length; i++){
    let dataPoint = data[i];

    let x = (dataPoint['Longitude (deg)'] - minLong) / rangeLong
    let y = (dataPoint['Latitude (deg)'] - minLat) / rangeLat;

    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(x*canvas.width, y*canvas.height, 5, 0, 2*Math.PI)
    ctx.fill();

    let factor = 0.04;
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x*canvas.width, y*canvas.height);
    // https://stackoverflow.com/questions/7477003/calculating-new-longitude-latitude-from-old-n-meters
    let nextLong = dataPoint['Longitude (deg)'] + (factor * dataPoint['U-comp (cm/s)'] / earthRadius) * (180 / Math.PI) / Math.cos(dataPoint['Latitude (deg)'] * Math.PI / 180);
    let nextLat = dataPoint['Latitude (deg)'] + (factor * dataPoint['V-comp (cm/s)'] / earthRadius) * (180 / Math.PI);

    let nextX = (nextLong - minLong) / rangeLong;
    let nextY = (nextLat - minLat) / rangeLat;

    //ctx.lineTo(x*canvas.width + dataPoint['U-comp'] * factor, y*canvas.height + dataPoint['V-comp'] * factor * 0.75);
    ctx.lineTo(nextX * canvas.width, nextY * canvas.height);
    ctx.stroke();


    
  }

  

  // Check the data
  // let iimm = new Image();
  // iimm.src = canvas.toDataURL();
  // iimm.width = canvas.width;
  // iimm.height = canvas.height;
  // iimm.style.position = 'absolute';
  // iimm.style.zIndex = 3;
  // document.body.appendChild(iimm);


  // Turn into the content of a OL.source
  return {
    url: canvas.toDataURL(),
    imageExtent: [minLong, minLat, maxLong, maxLat],
    projection: 'EPSG:4326'
  }
}

export default createImage;