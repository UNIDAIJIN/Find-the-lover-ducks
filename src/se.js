// se.js – shared sound effect helpers
const SE_PATH = "assets/audio/se/";

function makeSe(name, vol) {
  const a = new Audio(SE_PATH + name);
  a.volume = vol;
  a.preload = "auto";
  return a;
}

function play(a) {
  try { a.currentTime = 0; a.play().catch(() => {}); } catch (_) {}
}

const _cursor  = makeSe("se_cursor.mp3",  0.5);
const _confirm = makeSe("se_confirm.mp3", 0.5);
const _suzu    = makeSe("se_suzu.mp3",    0.8);

export function playCursor()  { play(_cursor);  }
export function playConfirm() { play(_confirm); }
export function playSuzu()    { play(_suzu);    }
