export const shootingLobbyMap = {
  bgSrc: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR42mP8z8AAAAMBAQAYk7kAAAAASUVORK5CYII=",
  colSrc: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2XcAAAAASUVORK5CYII=",
  bgmSrc: null,
  bgW: 256,
  bgH: 240,
  shootingBackdrop: true,
  spawn: { x: 120, y: 184 },
  doors: [
    {
      id:      42,
      to:      "dark_throne",
      trigger: { x: 0, y: 0, w: 0, h: 0 },
      entryAt: { x: 120, y: 60 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
  ],
};
