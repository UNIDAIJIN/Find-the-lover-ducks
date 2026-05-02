// data/maps/dark_throne.js
// ロビー流用：背景は shootingBackdrop で procedural 描画
const BLACK_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR42mP8z8AAAAMBAQAYk7kAAAAASUVORK5CYII=";
const CLEAR_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2XcAAAAASUVORK5CYII=";

export const darkThroneMap = {
  bgSrc:  BLACK_1PX,
  colSrc: CLEAR_1PX,
  bgmSrc: "assets/audio/bgm0.mp3",
  bgW: 256,
  bgH: 240,
  shootingBackdrop: true,
  spawn: { x: 120, y: 100 },
  doors: [
    {
      id:        42,
      to:        "shooting_lobby",
      trigger:   { x: 120, y: 68, w: 16, h: 8 }, // ドア底辺中心(128,72)基準
      entryAt:   { x: 120, y: 80 },
      entryWalk: { dx: 0, dy: 1, frames: 10 },
    },
  ],
};
