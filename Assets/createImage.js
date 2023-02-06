const createImage = function(data){

  // Calculate range
  let minLat = 999;
  let minLong = 999;
  let maxLat = -999;
  let maxLong = -999;

  for (let i = 0; i< data.length; i++){
    if (data[i].Longitude > maxLong) maxLong = data[i].Longitude;
    if (data[i].Longitude < minLong) minLong = data[i].Longitude;
    if (data[i].Latitude > maxLat) maxLat = data[i].Latitude;
    if (data[i].Latitude < minLat) minLat = data[i].Latitude;
  }

  // Margins
  maxLat += 0.01;
  minLat -= 0.01;
  maxLong += 0.01;
  minLong -= 0.01;

  let rangeLat = maxLat - minLat;
  let rangeLong = maxLong - minLong;
  let ratio = rangeLat/rangeLong;
  // Create canvas
  let canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = canvas.width * ratio;
  console.log(rangeLong/rangeLat)
  // Create context
  let ctx = canvas.getContext('2d');

  // Paint canvas
  // First do points
  for (let i = 0; i< data.length; i++){
    let dataPoint = data[i];

    let x = (dataPoint.Longitude - minLong) / rangeLong
    let y = (dataPoint.Latitude - minLat) / rangeLat;

    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(x*canvas.width, y*canvas.height, 5, 0, 2*Math.PI)
    ctx.fill();

    let factor = 0.5;
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x*canvas.width, y*canvas.height);
    ctx.lineTo(x*canvas.width + dataPoint['U-comp'] * factor, y*canvas.height + dataPoint['V-comp'] * factor * 0.75);
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