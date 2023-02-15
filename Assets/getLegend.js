const LEGENDURLS = [
  './Assets/Legends/GreenBlueWhiteOrangeRed.png',
  './Assets/Legends/BlueWhiteRed.png',
  './Assets/Legends/ModifiedOccam.png'
];

const loadLegends = function(steps){
  let promises = [];
  steps = steps || 50;

  for (let i = 0; i < LEGENDURLS.length; i++){
    promises.push(getLegend(LEGENDURLS[i], steps));
  }

  return new Promise(resolve => resolve(Promise.all(promises)));
}


const getLegend = function(url, steps){

  return new Promise ((resolve, reject) => {

    let img = new Image();
    img.src = url;

    img.onload = () => {
      console.log('Legend loaded')
      // Create canvas
      let canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      let ctx = canvas.getContext("2d");
      // Paint image and get image data
      ctx.drawImage(img, 0,0);
      let imgData = ctx.getImageData(0, Math.floor(canvas.height/2), canvas.width, 1); // one line in the middle
      let pixels = imgData.data;
      
      //img.style.position = "absolute";
      //img.style.top = "0px";
      //document.body.append(img);

      // Store the color according to the number of steps
      // WARN: Alpha is not considered
      steps = steps || 10;
      let colorsStr = [];
      let colorsRGB = [];
      for (let i = 0; i< steps; i++){
        let tmp = i * canvas.width / steps;
        let pixelPosition = Math.floor((canvas.width / steps) / 2 + tmp); // Pixel index + Half step (take the middle of the area, not the start)
        // RGB as string
        colorsStr[i] = 'rgb(' + pixels[pixelPosition*4] + ',' + pixels[pixelPosition*4 + 1] + ',' + pixels[pixelPosition*4+2] + ')';
        // RBG as array
        colorsRGB[i] = [pixels[pixelPosition*4], pixels[pixelPosition*4+1], pixels[pixelPosition*4+2]]
      }


      resolve({colorsStr, colorsRGB, img});
    }
    img.onerror = () => reject();
    
  });

}

export {loadLegends, getLegend};