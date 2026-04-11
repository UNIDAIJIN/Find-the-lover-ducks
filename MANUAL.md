# 手作業マニュアル

リミット中に Claude なしで NPC / マップ / アイテムを追加するための手順書。
**コピペして 4〜5 箇所いじるだけ**で動くところまで持っていく前提で書いている。

> 参考: より広い設計は `SPEC.md` / `CLAUDE.md` を見る。
> ここは**ひたすら手順と雛形**だけ。

---

## 目次
1. [NPC を追加する](#1-npc-を追加する)
2. [マップを追加する](#2-マップを追加する)
3. [アイテムを追加する](#3-アイテムを追加する)
4. [マップにアイテムを置く（pickup）](#4-マップにアイテムを置くpickup)
5. [よくあるミス早見表](#5-よくあるミス早見表)

---

## 1. NPC を追加する

### 触るファイル（4 箇所）

| # | ファイル | 何をする |
|---|---|---|
| ① | `assets/sprites/〇〇.png` | 画像を配置 |
| ② | `src/sprites.js` | `SPRITES` にキー追加 |
| ③ | `src/data/npcs/〇〇.js` | データファイル新規作成 |
| ④ | `src/npcs.js` | import して `NPCS_BY_MAP[マップ名]` に追加 |

### ① 画像配置

`assets/sprites/my_npc.png` を配置。サイズ基準: 1 コマ 16×16px を横に 2 コマ並べた 32×16px（歩行アニメ）か、
静止の 16×16px。装飾だけなら任意サイズで OK。

### ② `src/sprites.js` にスプライト登録

`SPRITES = {` の中の適当なグループに 1 行追加するだけ:

```js
my_npc: loadSprite("assets/sprites/my_npc.png"),
```

### ③ データファイル新規作成: `src/data/npcs/my_npc.js`

**A. セリフだけ喋る NPC**

```js
export const myNpcNpc = {
  kind:      "npc",
  name:      "my_npc",           // 一意な識別子
  spriteKey: "my_npc",           // ② で登録したキー
  x:         120,                // マップ画像座標
  y:         160,
  talkHit:   { x: 0, y: 0, w: 16, h: 16 },  // 話しかけ判定
  solid:     true,               // 通り抜け不可
  talkType:  "talk",             // "talk"（フキダシ） / "sign"（看板）
  talkPages: [
    ["1ページ目のセリフ"],
    ["2ページ目のセリフ"],
  ],
};
```

**B. 装飾（話しかけ不可）**

```js
export const myNpcNpc = {
  kind:      "npc",
  name:      "my_npc",
  spriteKey: "my_npc",
  x:         120, y: 160,
  talkHit:   { x: 0, y: 0, w: 0, h: 0 },  // ← w:0 h:0 で話しかけ不可
  solid:     true,
};
```

**C. ショップ**

```js
export const myNpcNpc = {
  kind:      "npc",
  name:      "my_shop",
  spriteKey: "my_npc",
  x:         120, y: 160,
  talkHit:   { x: 0, y: 0, w: 16, h: 16 },
  solid:     true,
  event: {
    type:      "item_shop",
    shopName:  "よろずや",
    greeting:  [["いらっしゃい！"]],
    byeDialog: [["まいどあり！"]],
    items: [
      { id: "gunter",  name: "ぐんて",    price:  450 },
      { id: "helmet",  name: "ヘルメット", price: 1780 },
    ],
  },
};
```

**D. 宿屋**

```js
export const myNpcNpc = {
  kind:      "npc",
  name:      "my_inn",
  spriteKey: "my_npc",
  x:         100, y: 120,
  talkHit:   { x: 0, y: 0, w: 16, h: 16 },
  solid:     true,
  event: {
    type:     "inn_stay",
    price:    300,
    welcome:  "ようこそ宿屋へ。",
    question: "一泊300ENです、お泊まりですか？",
    options:  ["はい", "いいえ"],
    onNo:     [["またどうぞ。"]],
    restAt:   { x: 140, y: 120 },  // 起床時の位置
  },
};
```

### ④ `src/npcs.js` に登録

ファイル上部の import 列に追加:

```js
import { myNpcNpc } from "./data/npcs/my_npc.js";
```

`NPCS_BY_MAP` の該当マップ配列に `resolve(myNpcNpc)` を追加:

```js
export const NPCS_BY_MAP = {
  outdoor: [
    resolve(boardNpc),
    // ...
    resolve(myNpcNpc),  // ← 追加
  ],
  // ...
};
```

マップにまだエントリがないなら新規でキーを追加:

```js
my_map: [
  resolve(myNpcNpc),
],
```

### 動作確認

1. ローカルサーバを立てる: `python3 -m http.server 8080`
2. ブラウザで `http://localhost:8080` を開く
3. 該当マップへ移動 → 話しかけて動作確認

### NPC で使えるイベントタイプ（既存）

| type | 用途 | 必須データ |
|---|---|---|
| `item_shop` | ショップ | `items`, `greeting`, `byeDialog` |
| `inn_stay` | 宿屋 | `price`, `welcome`, `question`, `restAt` |
| `yahhy_jumprope` | 縄跳びミニゲーム | `greeting` |
| `hisaro_sunlover` | 日焼けスキン | `lines`, `onYesFinalPages`, `onNoDialog` |
| `nidhogg_give` | アイテム贈呈 | `giveItem`, `dialogGive`, `dialogAlready` |
| `ura_yahhy_shop` | カレー屋トリップ | 固定データ不要 |
| `mori_girl` | ヘルメット分岐会話 | 固定データ不要 |
| `keeper_talk` | クエスト20達成分岐会話 | 固定データ不要 |
| `d_sword_give` | 伝説の剣贈呈 | `giveItem` |
| `careful_letterbox` | シャチ輸送カットシーン | 固定データ不要 |
| `cactus_14` | サボリサボテン | 固定データ不要 |

**新しいタイプが欲しい場合**は `src/npc_events.js` の `runNpcEvent()` に分岐を追加する（Claude 案件推奨）。

---

## 2. マップを追加する

### 触るファイル（4〜5 箇所）

| # | ファイル | 何をする |
|---|---|---|
| ① | `assets/maps/〇〇.png` 他 | 画像 3 枚を配置 |
| ② | `src/data/maps/〇〇.js` | データファイル新規作成 |
| ③ | `src/maps.js` | import + `MAPS` に追加 |
| ④ | 隣接マップ側の `doors[]` | 入口になるドアを追加（**id 一致必須**） |
| ⑤ | `src/npcs.js` / `src/pickups.js` | 必要なら NPC/アイテムも追加 |

### ① 画像配置

| 画像 | 役割 | 必須？ |
|---|---|---|
| `my_map.png` | 背景 | 必須 |
| `my_map_col.png` | 衝突判定（不透明=壁、透明=歩ける） | 必須 |
| `my_map_top.png` | 上レイヤ（キャラの上に描く） | 任意 |

**col.png のルール**: 色は見ていない。**アルファチャンネル**で判定。
ピクセルが完全に透明 = 歩ける、不透明 = 壁。半透明でも壁扱い。

### ② データファイル新規作成: `src/data/maps/my_map.js`

```js
export const myMapMap = {
  bgSrc:    "assets/maps/my_map.png",
  bgTopSrc: "assets/maps/my_map_top.png",   // 省略可
  colSrc:   "assets/maps/my_map_col.png",
  bgmSrc:   "assets/audio/bgm0.mp3",
  spawn:    { x: 100, y: 100 },             // 初回スポーン位置
  doors: [
    {
      id:        99,                        // ← 相手側と一致必須
      to:        "outdoor",
      trigger:   { x: 92, y: 145, w: 16, h: 8 },
      entryAt:   { x: 92, y: 131 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
  ],
};
```

### ③ `src/maps.js` に登録

import を追加:

```js
import { myMapMap } from "./data/maps/my_map.js";
```

`MAPS` オブジェクトに追加:

```js
export const MAPS = {
  outdoor: outdoorMap,
  // ...
  my_map: myMapMap,  // ← 追加
};
```

### ④ 隣接マップに入口ドアを追加

たとえば `outdoor` → `my_map` で行き来するなら、`src/data/maps/outdoor.js` の `doors[]` に:

```js
{
  id:        99,                          // ← my_map 側と同じ ID
  to:        "my_map",
  trigger:   { x: 2400, y: 3100, w: 16, h: 8 },
  entryAt:   { x: 2400, y: 3094 },
  entryWalk: { dx: 0, dy: 1, frames: 20 },
},
```

### ドアの座標計算ルール（超重要）

**敷居の底辺中心**を (cx, cy) とする（プレイヤーの足が当たる 1 ピクセル）。

```
trigger = { x: cx - 8, y: cy - 4, w: 16, h: 8 }
```

`entryAt` は入場方向で変わる:

| 入場方向 | entryWalk | entryAt |
|---|---|---|
| 下（縦ドアを下に歩いて入る） | `{dx:0, dy:1}` | `{ x: cx-8, y: cy-12 }` |
| 左（右壁ドアを左に歩いて入る） | `{dx:-1, dy:0}` | `{ x: cx-8, y: cy-10 }` |
| 右（左壁ドアを右に歩いて入る） | `{dx:1, dy:0}` | `{ x: cx+8, y: cy-10 }` |
| 右下（斜めドア） | `{dx:1, dy:1}` | `{ x: cx-12, y: cy-12 }` |

**実際は数ピクセル微調整が必要**。基準値として使う → 試す → 調整。

### ⚠ ドア ID 一致が最重要

A→B と B→A のドアは**同じ id** を持つこと。違うと `entryAt` が見つからず変な場所にスポーンする。

```js
// outdoor.js
{ id: 33, to: "inugoya", ... }

// inugoya.js
{ id: 33, to: "outdoor", ... }  // ← 同じ 33
```

---

## 3. アイテムを追加する

### 触るファイル（1〜3 箇所）

| # | ファイル | 何をする |
|---|---|---|
| ① | `src/data/items/〇〇.js` | 既存ファイルに追記 or 新規 |
| ② | `src/items.js` | 新規ファイルなら import & `ALL_ITEMS` に追加 |
| ③ | `src/main.js` の `onUseItem` | 使用時の特殊処理があるなら |

### ① 既存カテゴリに追加する場合（推奨）

たとえば食べ物なら `src/data/items/food.js` に 1 行追加:

```js
{ id: "my_item", name: "アイテム名", bgmSrc: null, throwDmg: 0 },
```

**フィールド意味**:
- `id`: 一意な識別子（`STATE.collectedItems` や `inventory.addItem(id)` で使う）
- `name`: 画面表示名
- `bgmSrc`: 使用時に BGM を一時上書きする場合のファイルパス（不要なら `null`）
- `throwDmg`: バトルで投げたときのダメージ（通常 0、投擲武器なら 1）

### ② 新規カテゴリを作る場合

1. `src/data/items/my_category.js` を新規作成:

   ```js
   export const myCategoryItems = [
     { id: "my_item_1", name: "アイテム1", bgmSrc: null, throwDmg: 0 },
     { id: "my_item_2", name: "アイテム2", bgmSrc: null, throwDmg: 0 },
   ];
   ```

2. `src/items.js` に追加:

   ```js
   import { myCategoryItems } from "./data/items/my_category.js";
   // ...
   const ALL_ITEMS = [...rubberDucks, ..., ...myCategoryItems];
   ```

### ③ 使用時に特殊処理をする場合

`src/main.js` を `onUseItem` で grep → 既存の分岐に合わせて追加する。
BGM 上書きだけなら ② の `bgmSrc` で足りるので、特殊処理不要なことが多い。

---

## 4. マップにアイテムを置く（pickup）

### 触るファイル（1 箇所）

`src/pickups.js` の `PICKUPS_BY_MAP` に 1 行追加するだけ。

```js
export const PICKUPS_BY_MAP = {
  outdoor: [
    { itemId: "rubber_duck_A", x: 2567, y: 3258 },
    // ↓ 追加
    { itemId: "my_item", x: 1000, y: 2000 },
  ],
  // ...
};
```

### 条件付きで出現させる（フラグゲート）

`requireFlag` を指定すると、`STATE.flags.〇〇 === true` のときだけ出現。

```js
{ itemId: "rubber_duck_D", x: 133, y: 123, requireFlag: "innDuckSpawned" },
```

フラグは NPC イベント等で `STATE.flags.innDuckSpawned = true` としてから
`spawnPickup(itemId, x, y)` を呼ぶと出現する（`inn_stay` の `firstStaySpawn` 参照）。

### 座標の取り方

マップ**画像**の座標（左上 0,0）。カメラ座標ではない。
ペイントソフトで `my_map.png` を開いて、置きたい場所のピクセル座標をそのまま書く。

### 取得済み判定

アイテムは `STATE.collectedItems` に ID で記録される。既取得なら自動的に出現しない。
セーブデータにも永続化される。

---

## 5. よくあるミス早見表

### NPC
- ❌ マップデータ (`src/data/maps/*.js`) に NPC を書く → 反映されない。**必ず** `src/npcs.js`
- ❌ `spriteKey` の誤字 → 画像が出ないだけでエラーは出ない（デバッグ困難）
- ❌ `talkHit` の `w:0 h:0` にしたまま会話させようとする → 装飾用の判定
- ❌ `talkPages` を `["セリフ"]` と書く → 正しくは **配列の配列** `[["セリフ"]]`
- ❌ 同じ `name` の NPC を重複させる → `getNpcByName` で後勝ちになる

### マップ
- ❌ ドアの `id` が両側で不一致 → `entryAt` が見つからず spawn にフォールバック
- ❌ `col.png` の色を見ていると思っている → **アルファチャンネル**で判定
- ❌ `trigger` を敷居の**上**に置いている → 底辺中心を基準にする
- ❌ 新マップを `maps.js` の `MAPS` に追加し忘れる → ドア通過でエラー

### アイテム
- ❌ `items.js` の `ALL_ITEMS` に追加し忘れ → `itemName(id)` が id 文字列そのままを返す
- ❌ pickup 座標をカメラ座標で書く → マップ画像座標が正
- ❌ `id` に記号やスペースを入れる → 英数字 + アンダースコア推奨

### 共通
- ❌ BGM が鳴らない → ユーザー初回操作前は遅延ロード。クリックかキー入力が必要
- ❌ 選択肢の見た目が浮く → `choice.open(opts, cb)` の**第 3 引数**に質問文字列を渡す
- ❌ フェードが途中で止まる → `performance.now()` 直呼びではなく ctx の `nowMs` を使う

---

## セーブデータをリセットしたいとき

ブラウザの DevTools で:

```js
localStorage.removeItem("game_save_v1")
```

または「ニューゲーム」から開始すれば自動的に `resetProgress()` が走る。

---

## 動作確認チェックリスト

NPC / マップ / アイテムどれを追加しても、最後に必ずこれをチェック:

- [ ] コンソールエラーなし（F12 → Console）
- [ ] 該当マップに到達できる（ドア通過 OK）
- [ ] NPC の見た目が正しい（スプライト表示 OK）
- [ ] 話しかけ判定が効く（`Z` キーで反応）
- [ ] セリフが最後まで進む（複数ページの場合）
- [ ] セーブ（`S`）→ リロード → ロード（`L`）で状態復元
