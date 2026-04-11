// data/maps/moritasaki_room.js
export const moritasakiRoomMap = {
  bgSrc:  "assets/maps/moritasaki_room.png",
  colSrc: "assets/maps/moritasaki_room_col.png",
  bgmSrc: "assets/audio/bgm0.mp3",
  spawn:  { x: 128, y: 160 },
  doors: [
    {
      id:        4,
      to:        "outdoor",
      trigger:   { x: 191, y: 158, w: 16, h: 8 }, // 底辺中心 (199,162) 基準
      entryAt:   { x: 191, y: 152 },               // outdoor から戻ったとき出現位置
      entryWalk: { dx: -1, dy: 0, frames: 20 },    // 左へ20フレーム自動歩行
    },
  ],
};
