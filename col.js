// col.js
export function makeColStore(){
  const img = new Image();
  const c = document.createElement("canvas");
  const x = c.getContext("2d",{willReadFrequently:true});
  x.imageSmoothingEnabled = false;

  return {
    img,c,x,ready:false,data:null,w:0,h:0,
    load(src,cb){
      this.ready=false; this.data=null;
      img.onload=()=>{
        this.w=img.naturalWidth|0;
        this.h=img.naturalHeight|0;
        c.width=this.w; c.height=this.h;
        x.clearRect(0,0,this.w,this.h);
        x.drawImage(img,0,0);
        this.data=x.getImageData(0,0,this.w,this.h).data;
        this.ready=true;
        cb&&cb();
      };
      img.onerror=()=>{
        this.ready=false; this.data=null; this.w=0; this.h=0;
        cb&&cb();
      };
      img.src=src;
    },
    read(px,py){
      if(!this.ready||!this.data) return {r:0,g:0,b:0,a:0};
      if(px<0||py<0||px>=this.w||py>=this.h) return {r:0,g:0,b:0,a:0};
      const i=((py|0)*this.w+(px|0))*4;
      return {r:this.data[i]|0,g:this.data[i+1]|0,b:this.data[i+2]|0,a:this.data[i+3]|0};
    },
    isWallAt(px,py){
      if(!this.ready||!this.data) return false;
      if(px<0||py<0||px>=this.w||py>=this.h) return true;
      const i=((py|0)*this.w+(px|0))*4;
      const r=this.data[i]|0, g=this.data[i+1]|0, b=this.data[i+2]|0;
      return r>250 && g>250 && b>250; // ONLY white is wall
    }
  };
}

// current.markers を作るだけの関数（main側の状態に依存させない）
export function scanMarkers(col){
  const markers = {
    spawn: null,
    outdoorDoor: new Map(),
    indoorDoor: new Map(),
    indoorEntry: new Map()
  };

  if(!col.ready||!col.data) return markers;

  const w = col.w|0, h = col.h|0, d = col.data;

  for(let y=0;y<h;y++){
    let row = (y*w*4)|0;
    for(let x=0;x<w;x++){
      const i = (row + x*4)|0;
      const r = d[i]|0, g = d[i+1]|0, b = d[i+2]|0, a = d[i+3]|0;
      if(!a) continue;

      if(!markers.spawn && r===0 && g===255 && b===0) markers.spawn={x,y};
      if(r===255 && g===0 && b>0 && !markers.outdoorDoor.has(b)) markers.outdoorDoor.set(b,{x,y});
      if(r===0 && g===255 && b>0 && !markers.indoorDoor.has(b)) markers.indoorDoor.set(b,{x,y});
      if(r===255 && g===255 && b>0 && !markers.indoorEntry.has(b)) markers.indoorEntry.set(b,{x,y});
    }
  }
  return markers;
}
