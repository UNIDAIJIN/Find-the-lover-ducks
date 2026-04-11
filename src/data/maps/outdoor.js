// data/maps/outdoor.js
export const outdoorMap = {
  bgSrc:          "assets/maps/outdoor.png",
  bgTopSrc:       "assets/maps/outdoor_top.png",
  bgMidSrc:       "assets/maps/outdoor_mid.png",
  bgShrineSrc:    "assets/maps/outdoor_shrine.png",
  bgShrineTopSrc: "assets/maps/outdoor_shrine_top.png",
  colSrc:         "assets/maps/outdoor_col.png",
  bgmSrc:         "assets/audio/bgm0.mp3",
  spawn:          { x: 2358, y: 3106 },
  doors: [
    {
      id:      1,
      to:      "indoor_01",
      trigger: null, // TODO: outdoor → indoor_01 のドア位置未設定
      entryAt: null, // TODO: indoor_01 から戻ったときの出現位置
    },
    {
      id:        2,
      to:        "pool",
      trigger:   { x: 1957, y: 3233, w: 16, h: 8 }, // 底辺中心 (1965,3237)
      entryAt:   { x: 1955, y: 3230 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        3,
      to:        "vj_room01",
      trigger:   { x: 2411, y: 2155, w: 16, h: 8 }, // 中心 (2419,2159)
      entryAt:   { x: 2412, y: 2144 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        8,
      to:        "hole",
      trigger:   null, // hole 側からのみ使用
      entryAt:   { x: 1449, y: 2126 }, // 穴7の上に出現
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        5,
      to:        "inn",
      trigger:   { x: 1700, y: 1581, w: 16, h: 8 }, // 底辺中心 (1708,1585)
      entryAt:   { x: 1700, y: 1573 },
      entryWalk: { dx: -1, dy: 1, frames: 20 },
    },
    {
      id:        4,
      to:        "moritasaki_room",
      trigger:   { x: 2641, y: 3355, w: 16, h: 8 }, // 底辺中心 (2649,3359)
      entryAt:   { x: 2641, y: 3347 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        6,
      to:        "ura_ketchupug",
      trigger:   { x: 2562, y: 1877, w: 16, h: 8 }, // 底辺中心 (2570,1881)
      entryAt:   { x: 2562, y: 1869 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        9,
      to:        "charch",
      trigger:   { x: 1035, y: 3247, w: 16, h: 8 }, // 底辺中心 (1043,3251)
      entryAt:   { x: 1035, y: 3239 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        10,
      to:        "stair1",
      trigger:   { x: 2272, y: 1465, w: 16, h: 8 }, // 底辺中心 (2280,1469)
      entryAt:   { x: 2272, y: 1457 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        11,
      to:        "stair2",
      trigger:   { x: 2795, y: 1461, w: 16, h: 8 }, // 底辺中心 (2803,1465)
      entryAt:   { x: 2795, y: 1453 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        12,
      to:        "stair3",
      trigger:   { x: 2790, y: 1690, w: 16, h: 8 }, // 底辺中心 (2798,1694)
      entryAt:   { x: 2790, y: 1682 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        13,
      to:        "stair1",
      trigger:   { x: 2600, y: 1424, w: 182, h: 8 }, // x: 2600〜2782, y中心 1428
      entryAt:   { x: 2685, y: 1410 },
      entryWalk: { dx: 1, dy: -1, frames: 20 },
    },
    {
      id:        14,
      to:        "stair2",
      trigger:   { x: 2879, y: 1571, w: 8, h: 80 }, // x:2879, y:1571〜1651
      entryAt:   { x: 2879, y: 1611 },
      entryWalk: { dx: 1, dy: 0, frames: 20 },
    },
    {
      id:        15,
      to:        "stair3",
      trigger:   { x: 3573, y: 1896, w: 16, h: 8 }, // 底辺中心 (3581,1900)
      entryAt:   { x: 3573, y: 1890 },
      entryWalk: { dx: 1, dy: 0, frames: 20 },
    },
    {
      id:        16,
      to:        "hisaro",
      trigger:   { x: 2193, y: 2881, w: 16, h: 8 }, // 底辺中心 (2201,2885)
      entryAt:   { x: 2193, y: 2873 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        17,
      to:        "workmen",
      trigger:   { x: 2072, y: 1665, w: 16, h: 8 }, // 底辺中心 (2080,1669)
      entryAt:   { x: 2072, y: 1657 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        18,
      to:        "house01",
      trigger:   { x: 2989, y: 1720, w: 16, h: 8 }, // 底辺中心 (2997,1724)
      entryAt:   { x: 2989, y: 1712 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        19,
      to:        "house02",
      trigger:   { x: 3059, y: 1720, w: 16, h: 8 }, // 底辺中心 (3067,1724)
      entryAt:   { x: 3059, y: 1712 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        20,
      to:        "house03",
      trigger:   { x: 3219, y: 1720, w: 16, h: 8 }, // 底辺中心 (3227,1724)
      entryAt:   { x: 3219, y: 1712 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        21,
      to:        "house04",
      trigger:   { x: 3289, y: 1720, w: 16, h: 8 }, // 底辺中心 (3297,1724)
      entryAt:   { x: 3289, y: 1712 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        22,
      to:        "house05",
      trigger:   { x: 3359, y: 1720, w: 16, h: 8 }, // 底辺中心 (3367,1724)
      entryAt:   { x: 3359, y: 1712 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        23,
      to:        "house06",
      trigger:   { x: 3119, y: 1820, w: 16, h: 8 }, // 底辺中心 (3127,1824)
      entryAt:   { x: 3119, y: 1812 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        24,
      to:        "house07",
      trigger:   { x: 3189, y: 1820, w: 16, h: 8 }, // 底辺中心 (3197,1824)
      entryAt:   { x: 3189, y: 1812 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        25,
      to:        "house08",
      trigger:   { x: 3259, y: 1820, w: 16, h: 8 }, // 底辺中心 (3267,1824)
      entryAt:   { x: 3259, y: 1812 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        26,
      to:        "house09",
      trigger:   { x: 3019, y: 1920, w: 16, h: 8 }, // 底辺中心 (3027,1924)
      entryAt:   { x: 3019, y: 1912 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        27,
      to:        "house10",
      trigger:   { x: 3089, y: 1920, w: 16, h: 8 }, // 底辺中心 (3097,1924)
      entryAt:   { x: 3089, y: 1912 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        28,
      to:        "house11",
      trigger:   { x: 3159, y: 1920, w: 16, h: 8 }, // 底辺中心 (3167,1924)
      entryAt:   { x: 3159, y: 1912 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        29,
      to:        "umi_house1",
      trigger:   { x: 1377, y: 1783, w: 16, h: 8 }, // 底辺中心 (1385,1787)
      entryAt:   { x: 1377, y: 1775 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        30,
      to:        "umi_house2",
      trigger:   { x: 1448, y: 1844, w: 16, h: 8 }, // 底辺中心 (1456,1848)
      entryAt:   { x: 1448, y: 1836 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        31,
      to:        "umi_house3",
      trigger:   { x: 1518, y: 1914, w: 16, h: 8 }, // 底辺中心 (1526,1918)
      entryAt:   { x: 1518, y: 1906 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        32,
      to:        "d_hole",
      trigger:   { x: 1593, y: 2731, w: 16, h: 8 }, //
      entryAt:   { x: 1598, y: 2726 },
      entryWalk: { dx: 1, dy: 0, frames: 20 },
    },
    {
      id:        33,
      to:        "inugoya",
      trigger:   { x: 2987, y: 1925, w: 16, h: 8 }, // 底辺中心 (2995,1929)
      entryAt:   { x: 2987, y: 1917 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
  ],

  // ---- 穴ワープ ----
  // id: この穴のID  to: ペアの穴ID (null = 未接続)
  // trigger: 踏むと落下する矩形  exitAt: 出てくる位置
  holes: [
    // 赤ペア  waypoints = カメラ中心が通る中継点（行き順）、帰りは逆順を使う
    { id: 1, to: 2, helmetRequired: true,
      trigger: { x: 1198, y: 2091, w: 20, h: 20 }, exitAt: { x: 1208, y: 2101 },
      waypoints: [
        { x: 1050, y: 2000 }, { x: 1750, y: 1980 },
        { x: 1820, y: 2280 }, { x: 1500, y: 2400 },
        { x: 1447, y: 2299 },
      ] },
    { id: 2, to: 1, helmetRequired: true,
      trigger: { x: 1437, y: 2289, w: 20, h: 20 }, exitAt: { x: 1447, y: 2299 },
      waypoints: [
        { x: 1500, y: 2400 }, { x: 1820, y: 2280 },
        { x: 1750, y: 1980 }, { x: 1050, y: 2000 },
        { x: 1208, y: 2101 },
      ] },
    // 青ペア
    { id: 3, to: 4, helmetRequired: true,
      trigger: { x: 1768, y: 2151, w: 20, h: 20 }, exitAt: { x: 1778, y: 2161 },
      waypoints: [
        { x: 1900, y: 2000 }, { x: 1000, y: 2050 },
        { x: 950,  y: 2420 }, { x: 1200, y: 2380 },
        { x: 1306, y: 2324 },
      ] },
    { id: 4, to: 3, helmetRequired: true,
      trigger: { x: 1296, y: 2314, w: 20, h: 20 }, exitAt: { x: 1306, y: 2324 },
      waypoints: [
        { x: 1200, y: 2380 }, { x: 950,  y: 2420 },
        { x: 1000, y: 2050 }, { x: 1900, y: 2000 },
        { x: 1778, y: 2161 },
      ] },
    // 緑ペア
    { id: 5, to: 6, helmetRequired: true,
      trigger: { x: 1580, y: 2303, w: 20, h: 20 }, exitAt: { x: 1590, y: 2313 },
      waypoints: [
        { x: 1700, y: 2500 }, { x: 1950, y: 2380 },
        { x: 1850, y: 2100 }, { x: 1100, y: 2180 },
        { x: 1134, y: 2409 },
      ] },
    { id: 6, to: 5, helmetRequired: true,
      trigger: { x: 1124, y: 2399, w: 20, h: 20 }, exitAt: { x: 1134, y: 2409 },
      waypoints: [
        { x: 1100, y: 2180 }, { x: 1850, y: 2100 },
        { x: 1950, y: 2380 }, { x: 1700, y: 2500 },
        { x: 1590, y: 2313 },
      ] },
    // 別マップへ
    { id: 7, to: null, destMap: 'hole', trigger: { x: 1445, y: 2132, w: 20, h: 20 }, exitAt: { x: 1455, y: 2142 }, helmetRequired: true },
  ],
};
