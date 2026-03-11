// col.js
export function makeColStore() {
  const img = new Image();
  const c = document.createElement("canvas");
  const x = c.getContext("2d", { willReadFrequently: true });
  x.imageSmoothingEnabled = false;

  return {
    img, c, x, ready: false, data: null, w: 0, h: 0,
    load(src, cb) {
      this.ready = false; this.data = null;
      img.onload = () => {
        this.w = img.naturalWidth | 0;
        this.h = img.naturalHeight | 0;
        c.width = this.w; c.height = this.h;
        x.clearRect(0, 0, this.w, this.h);
        x.drawImage(img, 0, 0);
        this.data = x.getImageData(0, 0, this.w, this.h).data;
        this.ready = true;
        cb && cb();
      };
      img.onerror = () => {
        this.ready = false; this.data = null; this.w = 0; this.h = 0;
        cb && cb();
      };
      img.src = src;
    },
    read(px, py) {
      if (!this.ready || !this.data) return { r: 0, g: 0, b: 0, a: 0 };
      if (px < 0 || py < 0 || px >= this.w || py >= this.h) return { r: 0, g: 0, b: 0, a: 0 };
      const i = ((py | 0) * this.w + (px | 0)) * 4;
      return { r: this.data[i] | 0, g: this.data[i+1] | 0, b: this.data[i+2] | 0, a: this.data[i+3] | 0 };
    },
    isWallAt(px, py) {
      if (!this.ready || !this.data) return false;
      if (px < 0 || py < 0 || px >= this.w || py >= this.h) return true;
      const i = ((py | 0) * this.w + (px | 0)) * 4;
      return (this.data[i + 3] | 0) > 0; // any opaque pixel = wall
    },
  };
}
