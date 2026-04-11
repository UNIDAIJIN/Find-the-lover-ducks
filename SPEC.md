# ゲーム仕様書

最終更新: 2026-04-11

> **このファイルの使い方**
> - 前半「作業レシピ / API早見表」は毎回の作業時にまず見る。手順と非自明な落とし穴だけ。
> - 後半「ゲーム内容カタログ」はマップ/NPC/アイテムの現状一覧。参考データ（コード優先で陳腐化に注意）。
> - 作業手順を変えた/新しい落とし穴に引っかかったら、ここを更新してから次に進む。

---

## 🔧 作業レシピ

### レシピ: NPCを追加する

1. **スプライトを登録**: `src/sprites.js` に `myNpc: loadSprite("assets/sprites/myNpc.png"),`
2. **データファイルを作成**: `src/data/npcs/my_npc.js`
   ```js
   export const myNpcNpc = {
     kind:      "npc",
     name:      "my_npc",           // getNpcByName で参照する名前
     spriteKey: "myNpc",            // sprites.js のキー
     x:         120,
     y:         160,
     talkHit:   { x: 0, y: 0, w: 16, h: 16 },
     solid:     true,

     // --- A. 単純な会話のみ ---
     talkType:  "sign",             // "sign" / "talk"（省略時talk）
     talkPages: [["1ページ目"], ["2ページ目"]],

     // --- B. イベント駆動 ---
     event: { type: "my_event_type", /* 任意データ */ },
   };
   ```
3. **マップに登録**: `src/npcs.js` の `NPCS_BY_MAP` に import + `resolve(myNpcNpc)` を追加
4. （イベント駆動なら）`src/npc_events.js` に `ev.type === "my_event_type"` の分岐を追加

**よくあるミス**:
- ❌ マップデータ(`src/data/maps/*.js`)に NPC を書く → 反映されない。必ず `npcs.js`
- ❌ `spriteKey` の誤字 → 画像が出ないだけでエラーは出ない
- ❌ `talkHit` の `w:0` にすると会話不能になる（装飾NPC用）

---

### レシピ: アイテムを追加する

1. **データファイル**: `src/data/items/` に追加 or 既存ファイルに追記
   ```js
   { id: "my_item", name: "アイテム名", bgmSrc: null, throwDmg: 0 }
   ```
   - `bgmSrc`: 使用時にBGM一時上書き（不要なら `null`）
   - `throwDmg`: 投げダメージ（通常 0 か 1）
2. **items.js に登録**: `ALL_ITEMS = [..., myItems]` に import して追加
3. （マップに落とすなら）`src/pickups.js` の `PICKUPS_BY_MAP` に `{ itemId: "my_item", x, y }`
4. （使用時に特殊処理するなら）`src/main.js` の `onUseItem` に分岐追加

**よくあるミス**:
- ❌ `items.js` に追加し忘れ → `itemName(id)` が id そのものを返す
- ❌ pickup 座標はマップ画像座標（カメラ座標ではない）

---

### レシピ: マップを追加する

1. **画像を配置**: `assets/maps/mymap.png`, `mymap_col.png`, `mymap_top.png`（topは任意）
2. **データファイル**: `src/data/maps/mymap.js`
   ```js
   export const mymapMap = {
     bgSrc:    "assets/maps/mymap.png",
     bgTopSrc: "assets/maps/mymap_top.png",  // 任意、上レイヤ
     colSrc:   "assets/maps/mymap_col.png",
     bgmSrc:   "assets/audio/bgm0.mp3",
     spawn:    { x: 100, y: 100 },
     doors: [
       { id: 1, to: "outdoor",
         trigger:   { x, y, w: 16, h: 8 },
         entryAt:   { x, y },
         entryWalk: { dx: 0, dy: 1, frames: 20 } },
     ],
   };
   ```
3. **maps.js に登録**: import + `MAPS` に追加
4. **接続先マップ**: 相手の `doors[]` にも同じ `id` のドアを追加（**id一致が必須**）

**ドアの座標計算**: `CLAUDE.md` と MEMORY.md のドアパターンに従う。敷居底辺中心 (cx,cy) から計算。

**col.png のルール**: アルファチャンネルで判定。**不透明=壁、透明=歩ける**。色は見ない。

---

### レシピ: NPCイベントタイプを追加する

`src/npc_events.js` の `runNpcEvent()` 内に分岐を追加。

```js
if (ev.type === "my_type") {
  const { dialog, choice, fade, ... } = ctx;
  // 処理
  return true;  // ← handled=true を返すのを忘れずに
}
```

**ctx で使えるもの（要確認は `src/main.js` の `runNpcEvent(act, {...})` 呼び出し箇所）**:

| キー | 用途 |
|---|---|
| `dialog` | ダイアログUI |
| `choice` | 選択肢UI |
| `shop` | ショップUI |
| `fade` | 画面フェード |
| `inventory` | インベントリ操作 |
| `sprites` | SPRITES 参照 |
| `party` | `{ leader, p2, p3, p4 }` |
| `nowMs` | rAFの現在時刻取得（freeze防止用、必ずこれを使う） |
| `lockInput` / `unlockInput` | 入力ロック |
| `teleportPlayer(x,y)` | パーティ全員を瞬間移動（followersも同期） |
| `stopBgm` | BGM停止 |
| `getBgmSrc` | 現在のBGM上書き src 取得 |
| `achieveQuest(id)` | クエスト達成 |
| `toast` | トースト表示 |
| `letterbox` | レターボックス演出 |
| `jumprope` | 縄跳びミニゲーム |
| `getNpcByName(name)` | NPC取得 |
| `getPlayerPos()` | `{x,y}` 取得 |
| `triggerRedScreen` | 赤フラッシュ（careful演出用） |
| `showExclamations` | 頭上「！」表示 |
| `isTripActive` | トリップ中判定 |
| `startTrip` / `startGoodTrip` | トリップ開始 |

---

## 🎛 主要API早見表

### dialog （`src/ui_dialog.js`）
```js
dialog.open(pages, onClose?, type?, autoMs?)
// pages: [["1ページ目"], ["2ページ目"]]  ← 配列の配列
// type:  "talk"（デフォルト） / "sign"
// autoMs: >0 で指定ms後に自動閉じ
dialog.close()
dialog.isActive()
dialog.setVoice(type)        // NPC別ボイス
dialog.onPageChange(fn|null) // ページ切替コールバック
dialog.onTypingDone(fn|null) // タイピング完了コールバック
```

### choice （`src/ui_choice.js`）
```js
choice.open(options, cb, question?)
// options: ["はい", "いいえ"]
// cb(idx): 選択時
// question: 文字列を渡すとダイアログ一体型（inline）になる ← 基本こっち
choice.close()
choice.isActive()
```
→ 書き方の定番は下の「選択肢パターン集」を参照。

---

## 💬 選択肢パターン集

### 基本原則
- 質問文字列は `choice.open` の **第3引数** に渡す（ダイアログ一体型）。単独で `choice.open(opts, cb)` だけ呼ぶと浮いたUIになる
- コールバック冒頭で `if (typeof choice.close === "function") choice.close();` を呼ぶのが慣例（既存イベント全部この形）
- 分岐後の次のセリフは `dialog.open(...)` で新しく開き直す（閉じるのは自動）

### パターン1: 1ページセリフ → 選択肢（最頻出）
```js
dialog.open([[welcomeLine]], () => {
  choice.open(options, (idx) => {
    if (typeof choice.close === "function") choice.close();
    if (idx === 0) {
      // はい
      dialog.open([["オーケー！"]]);
    } else {
      // いいえ
      dialog.open(ev.onNo || [["……"]]);
    }
  }, questionLine);  // ← ここに質問文字列
});
```
実例: `inn_stay`, `hisaro_sunlover`, `nidhogg_give`

### パターン2: 複数ページセリフ → 選択肢
最後のページのコールバックで choice を開く。pages は `dialog.open(pages, cb)` の cb が最終ページ完了時に呼ばれる。
```js
dialog.open([
  ["オニイサン、オネエサン、イイトコキタネー"],
  ["ココ、ウラノカレーショップアルヨー"],
  ["イマ「サバカレー」「チキンカレー」ネ"],
], () => {
  choice.open(["はい", "いいえ"], (sel) => {
    if (typeof choice.close === "function") choice.close();
    if (sel === 0) showCurry();
    else           showKimokimo();
  }, "「サバカレー」二スルカ");
});
```
実例: `ura_yahhy_shop`

### パターン3: 早期リターン（金額不足など）
分岐内で条件を満たさない場合はその場で return。fade など次の処理には進まない。
```js
if (idx === 0) {
  const price = ev.price | 0;
  if (price > 0 && STATE.money < price) {
    dialog.open([["おかねたりないよー。"]]);
    return;  // ← fade に進まず終了
  }
  if (price > 0) STATE.money -= price;
  // ...続きの処理
}
```
実例: `inn_stay`

### パターン4: 選択肢 → フェード暗転 → 処理 → 明転
```js
if (idx === 0) {
  if (typeof lockInput === "function") lockInput();
  const t = typeof nowMs === "function" ? nowMs() : performance.now();
  fade.startCutFade(t, {
    outMs:  400,
    holdMs: 1000,
    inMs:   600,
    onBlack: () => {
      // 暗転中に状態変更（テレポート、スキン変更など）
      if (ev.restAt && teleportPlayer) teleportPlayer(ev.restAt.x, ev.restAt.y);
      setTimeout(() => playInnJingle(), 1000);
    },
    onEnd: () => {
      if (typeof unlockInput === "function") unlockInput();
    },
  });
}
```
**注意**: `nowMs` は ctx から渡されるものを必ず使う。`performance.now()` 直呼びは freeze の原因。

### パターン5: 多段選択肢（選択肢 → 別の選択肢）
関数として切り出して再帰的に呼ぶ。`cleanup()` ヘルパを用意して dialog/choice の残留コールバックをクリアすると安全。
```js
function cleanup() {
  if (typeof dialog.onPageChange === "function") dialog.onPageChange(null);
  if (typeof dialog.onTypingDone === "function") dialog.onTypingDone(null);
  if (typeof choice.close === "function") choice.close();
}

function showChickenChoice() {
  cleanup();
  choice.open(["はい", "いいえ"], (sel) => {
    cleanup();
    if (sel === 0) showAiyo("チキンカレー");
    else           showKimokimo();
  }, "「チキンカレー」ダナ？");
}

function showSabaChoice() {
  cleanup();
  choice.open(["はい", "いいえ"], (sel) => {
    cleanup();
    if (sel === 0) showAiyo("サバカレー");
    else           showChickenChoice();  // ← 別の選択肢へ
  }, "「サバカレー」二スルカ");
}
```
実例: `ura_yahhy_shop`

### パターン6: 「ここから1秒待ってから続き」を挟むとき
`lockInput()` → `setTimeout` → `unlockInput()` → 次のdialog/choice。
```js
dialog.open([["そっか、そうなんだ。"]], () => {
  if (typeof lockInput === "function") lockInput();
  setTimeout(() => {
    if (typeof unlockInput === "function") unlockInput();
    dialog.open([["このラバーダックってやつ、しってる？"]], () => {
      choice.open(["はい", "いいえ"], (idx) => { /* ... */ }, "きみたちのもの？");
    });
  }, 1000);
});
```
実例: `nidhogg_give`

### ⚠️ 選択肢まわりの落とし穴
1. **`question` 引数を忘れる** → 浮いた見た目になる。必ず第3引数を渡す
2. **`choice.close()` を呼び忘れる** → たまに前の状態が残る。お決まりで冒頭に書く
3. **暗転と選択肢を同時進行させる** → `lockInput()` を挟んでから fade する。選択肢中に暗転開始すると入力が混線する
4. **選択肢コールバック内で `return` しない** → 金額不足などで早期終了したつもりが後続処理も走る
5. **`dialog.open` の pages を `[["..."]]` ではなく `["..."]` にする** → 配列の配列が正（1pageでも `[[...]]`）

### fade （`src/fx_fade.js`）
```js
fade.startCutFade(nowMs, {
  outMs:  400,   // 暗転までの時間
  holdMs: 1000,  // 完全暗転の保持時間
  inMs:   600,   // 明転までの時間
  onBlack: () => { /* 完全暗転時に1回実行（teleport等） */ },
  onEnd:   () => { /* 明転完了時（unlockInput等） */ },
})
fade.startMapFade(id, opt, nowMs, loadMapFn)  // マップ遷移用
fade.startIrisFade(nowMs, {...})              // アイリス（エンディング等）
```
**必ず `nowMs`（ctxで渡されるrAFの時刻関数）を使う**。`performance.now()` 直呼びは freeze の原因。

### shop （`src/ui_shop.js`）
```js
shop.open(items, closeLabel, shopName, cb, initialCursor?)
// items: [{ id, name, price }]
// cb(id, savedCursor): 購入 or id=null でキャンセル
// 4項目超でスクロール、money窓込みで中央寄せ
```

### inventory
```js
inventory.addItem(id)
```

---

## 🗂 データ配置チートシート

| 種類 | データファイル | 集約ファイル | 追加先 |
|---|---|---|---|
| NPC | `src/data/npcs/*.js` | `src/npcs.js` | `NPCS_BY_MAP[map]` |
| マップ | `src/data/maps/*.js` | `src/maps.js` | `MAPS` |
| アイテム | `src/data/items/*.js` | `src/items.js` | `ALL_ITEMS` |
| 配置物 | `src/pickups.js` 直書き | - | `PICKUPS_BY_MAP[map]` |
| イベント | `src/npc_events.js` 内分岐 | - | `runNpcEvent` |
| スプライト | - | `src/sprites.js` | `SPRITES` |

---

## ⚠️ ハマりポイント集

1. **NPCがマップに出ない** → `src/npcs.js` の `NPCS_BY_MAP` に入ってるか？（マップデータには書かない）
2. **z-order がおかしい（先頭が常に上）** → `loadMap` で `charHeight` を "ground" にリセットしてるか確認。階段マップの state 持ち越しで発生した過去あり
3. **ドアで別の場所に出る** → 両マップのドアの `id` が一致しているか
4. **fade が途中で止まる** → `performance.now()` を直接使っていないか。必ず ctx の `nowMs` を使う
5. **選択肢の見た目が浮く** → `choice.open(opts, cb)` の3番目に質問文字列を渡してダイアログ一体型にする
6. **typewriter括弧が空になる** → `queueMsg` に `typed` メタを渡す必要あり（過去バグ）
7. **BGM が鳴らない** → ユーザー操作前は遅延ロード。初回はクリック/キーが必要
8. **col.png が効かない** → 色ではなくアルファで判定。不透明=壁

---

## ゲーム概要

- **ジャンル**: HTML5 Canvas RPG（フィールド探索型）
- **画面サイズ**:
  - フィールド: 192×180px（CSS 3×スケール）
  - タイトル / キャラ選択 / エンディング / バトル: 256×240px
- **技術スタック**: 素のHTML5 Canvas + ES Modules（バンドラーなし）
- **衝突判定**: col.png のアルファチャンネルベース（不透明ピクセル = 壁）
- **フォント**: PixelMplus10
- **デバッグ**: `const DEBUG = true`（本番では `false` に切り替え）
- **モバイル対応**: `?m` URLパラメータでタッチコントローラー表示

---

## マップ一覧

| ID | 名前 | BGM | 備考 |
|---|---|---|---|
| `outdoor` | アウトドア（メインフィールド） | bgm0.mp3 | スポーン(2358,3106)、穴ワープ7本 |
| `indoor_01` | インドア01 | bgm0.mp3 | - |
| `pool` | プール | bgm0.mp3 | 水中エフェクトあり |
| `moritasaki_room` | モリタサキ・イン・ザ・プールの家 | bgm0.mp3 | - |
| `inn` | イン | bgm0.mp3 | - |
| `hisaro` | ヒサロ（日サロ「サン・ラヴァー」） | bgm0.mp3 | - |
| `workmen` | ワークメン（道具屋） | bgm0.mp3 | - |
| `vj_room01` | VJルーム01 | bgm0.mp3 | ボス戦の入口 |
| `vj_room02` | VJルーム02（エンディング部屋） | - | doors[] 空 |
| `hole` | 穴の中 | - | ニーズヘッグがいる |
| `seahole` | シーホール | - | 水中エフェクト、doors[] 空（孤立） |
| `ura_ketchupug` | ウラケチャパグ | - | カレー屋 |
| `charch` | チャーチ | bgm0.mp3 | - |
| `stair1/2/3` | ステア1〜3 | - | 共通col.png |
| `battle_01` | バトル（黒画面） | - | 1px黒背景 |

### ドア接続（outdoor 起点）

| ドアID | 接続先 | outdoor側 trigger 参考 |
|---|---|---|
| 1 | indoor_01 | **trigger: null（TODO）** |
| 2 | pool | x:1957, y:3236 |
| 3 | vj_room01 | x:2411, y:2155 |
| 4 | moritasaki_room | x:2641, y:3355 |
| 5 | inn | x:1700, y:1581 |
| 6 | ura_ketchupug | x:2562, y:1877 |
| 8 | hole（出口のみ） | entryAt: 1449,2126 |
| 9 | charch | - |
| 10〜15 | stair1/2/3 | 各種 |
| 16 | hisaro | - |
| 17 | workmen | - |

### 穴ワープ（outdoor 内、7本）

すべて `helmetRequired: true`（ヘルメット着用必須）。
1〜6は赤/青/緑ペアでoutdoor内同士を接続。7番のみ `hole` マップへ。

---

## NPC一覧

### outdoor

| name | 位置(x,y) | イベントタイプ | 内容 |
|---|---|---|---|
| board | 2689, 3352 | -(talkPages) | 看板「ここは モリタサキ〜」 |
| seats | 2678, 3318 | -(talkPages) | 同上 |
| cat1 | 2656, 3307 | -(talkPages) | 同上 |
| fan_flower | 2625, 3349 | 会話なし | 装飾（talkHit w:0） |
| careful | 3724, 1806 | `careful_letterbox` | ジョーズ演出 → シャチが突進 → seaholeへ遷移 |
| orca3 | 3780, 1810 | なし | careful演出の相方（orca3→orca2→orcaと変化） |
| chinanago×3 | 2493〜2525, 3328 | 会話なし | 装飾（talkHit w:0） |
| balloondog | 1104, 3211 | 会話なし | 装飾（talkHit w:0） |
| yahhy | 2280, 3350 | `yahhy_jumprope` | 縄跳びミニゲーム起動 |
| mori-girl | 1664, 2296 | `mori_girl` | 非着用:「穴に飛び込みたい〜」、着用:「ヘルメットだ。いいなあ。」 |

### hisaro

| name | 位置 | イベントタイプ | 内容 |
|---|---|---|---|
| hisaro | 89, 158 | `hisaro_sunlover` | スキン変更（無印→t1→t2の2段階） |

### workmen

| name | 位置 | イベントタイプ | 内容 |
|---|---|---|---|
| workman | 90, 122 | `item_shop` | ぐんて 450EN / ヘルメット 1780EN |
| workmangirl | 168, 112 | 会話なし | 装飾 |

### vj_room01

| name | 位置 | イベントタイプ | 内容 |
|---|---|---|---|
| minami | 66, 121 | `battleTrigger` + `battleWinEnding` | ボス戦起動、勝利でエンディング |
| red_door_block | 153, 114 | -(talkPages) | 「しゃちょうのきょかがないと…」（ブロッカー看板） |

### vj_room02（エンディング部屋）

natsumi / riku_play / maki_play / nino_play の4人、**talkPages 未設定（TODO）**

### hole

| name | イベントタイプ | 内容 |
|---|---|---|
| ニーズヘッグ | `nidhogg_give` | 初回: rubber_duck_C を贈呈、スプライトがnidhogg2に変化 |

### ura_ketchupug

| name | イベントタイプ | 内容 |
|---|---|---|
| ウラヤッヒー | `ura_yahhy_shop` | ぐねぐねサバカレー（トリップ）/ ぎらぎらチキンカレー（グッドトリップ） |

### indoor_01

ricky / ohara / minami（battleTrigger）の3人

---

## アイテム一覧

### ラバーダック

| ID | 名前 | BGM | 特記 |
|---|---|---|---|
| rubber_duck_A | ラバーダックA | duckA.mp3 | - |
| rubber_duck_B | ラバーダックB | duckB.mp3 | 入手でbgm0に戻す |
| rubber_duck_C | ラバーダックC | duckC.mp3 | ニーズヘッグから入手 |
| rubber_duck_D | ラバーダックD | duckD.mp3 | inn に落ちている |
| rubber_duck_E | ラバーダックE | duckE.mp3 | - |
| rubber_duck_F | ラバーダックF | duckF.mp3 | seahole に落ちている、入手でbgm0に戻す |
| rubber_duck_G | ラバーダックG（good） | duckG-good.mp3 | グッドトリップ中に出現 |
| rubber_duck_G_bad | ラバーダックG（bad） | duckG-bad.mp3 | トリップ中に出現 |
| rubber_duck_H | ラバーダックH | duckH.mp3 | 赤いダックスプライト |
| rubber_duck_I | ラバーダックI | duckI.mp3 | pool に落ちている、入手でbgm0に戻す |
| rubber_duck_J | ラバーダックJ | duckJ.mp3 | - |

### 装備品

| ID | 名前 | 価格 | 効果 |
|---|---|---|---|
| gunter | ぐんて | 450EN | 使用で消費。BGM復元あり |
| helmet | ヘルメット | 1780EN | 使用で `STATE.helmeted` トグル。着用で穴ワープ可能、MET.PNGオーバーレイ表示 |

### マップ上の配置

| マップ | アイテム | 座標(x,y) |
|---|---|---|
| outdoor | rubber_duck_A | 2567, 3258 |
| outdoor | rubber_duck_E | 2156, 2077 |
| outdoor | rubber_duck_H | 2960, 1460 |
| outdoor | rubber_duck_J | 3132, 987 |
| inn | rubber_duck_D | 108, 124 |
| seahole | rubber_duck_F | 120, 156 |
| pool | rubber_duck_I | 151, 293 |
| charch | rubber_duck_B | 192, 127 |

---

## ミニゲーム：縄跳び

- **起動**: outdoor の yahhy（2280,3350）に話しかける
- **操作**: `Z` キーでジャンプ（22フレームの放物線）
- **判定**: angle = π（縄が最下点）のときに空中にいればカウント+1
- **失敗**: 縄がボトムを通過したときに地上にいると MISS → 90フレーム後に終了
- **速度加速**: カウントに比例して縄が速くなる（最大 BASE_SPEED + 0.07）
- **カウントダウン**: 3→2→1→スタート！（各52フレーム）、縄は回転中
- **背景**: 青空（#87ceeb）+ 砂浜（#f5dfa0）、FLOOR_Y=160 を境界
- **ハイスコア**: `STATE.flags.jumpropeBest` に保存（永続）
- **報酬**:
  - 3回以上: 50EN
  - 10回以上: 200EN
  - 20回以上: 500EN
  - 50回以上: 2000EN

---

## STATE 構造

```js
STATE = {
  current:        { id, bgW, bgH },          // 現在のマップ
  cam:            { x, y },                  // カメラ座標
  leader/p2/p3/p4: { x, y, frame, last, dir, img }, // パーティ4人
  collectedItems: Set<string>,               // 収集済みアイテムID（永続）
  money:          number,                    // 所持金（EN）
  helmeted:       boolean,                   // ヘルメット着用状態
  flags:          {},                        // 汎用フラグ
  achievedQuests: Set<string>,               // 達成クエストID（未使用）
}
```

### 使用中フラグ（STATE.flags.*）

| キー | 型 | 用途 |
|---|---|---|
| `nidhoggGave` | boolean | ニーズヘッグの初回贈呈フラグ |
| `uraYahhyCooking` | boolean | カレー調理中（再話しかけ防止） |
| `duckGCollected` | boolean | rubber_duck_G / G_bad 取得フラグ |
| `duckBCollected` | boolean | rubber_duck_B 取得フラグ |
| `duckICollected` | boolean | rubber_duck_I 取得フラグ |
| `duckFCollected` | boolean | rubber_duck_F 取得フラグ |
| `jumpropeBest` | number | 縄跳びハイスコア |

---

## スキンシステム

hisaro（日サロ）に話しかけると「やいていくかい？」でスキンが1段階上昇。

| 状態 | 判定 |
|---|---|
| 無印 | p1/p2/p3/p4 スプライト |
| t1（日焼け1段階） | p1_t1/p2_t1/p3_t1/p4_t1 |
| t2（日焼け2段階） | p1_t2/p2_t2/p3_t2/p4_t2 → 「おまえたち、かがやいてるぜ!!」 |

---

## BGM / SE

### BGMファイル

| ファイル | 用途 |
|---|---|
| bgm0.mp3 | フィールド共通デフォルト |
| bgm_battle.mp3 | バトル用（現在はWebAudio APIハートビートを使用） |
| bgm_end.mp3 | エンディング |
| bgm_select.mp3 | 未使用 |
| duckA〜J.mp3 | ラバーダック使用時のBGM一時上書き |
| duckG-good/bad.mp3 | ラバーダックG good/bad 用 |

**特殊BGM機能**:
- ユーザー操作前は遅延ロード
- 水中マップ（pool, seahole）: ローパスフィルターで水中効果
- トリップ（サバカレー）: ピッチ±4%でゆらゆら60秒
- グッドトリップ（チキンカレー）: ピッチ+6% + ディレイエコー60秒

### 主要SE関数（se.js、Web Audio API合成）

`playCursor`, `playConfirm`, `playDoor`, `playZazza`, `playHoleFall`, `playHoleRoll`,
`playWave`, `startHeartbeat/stopHeartbeat`, `playItemJingle`, `playIndianJingle`,
`playCooking`, `playJaws/stopJaws`, `playCrush`, `playTypingVoice(type)`

---

## キャラクター選択

- 背景: 黄×ピンク市松（8px）
- キャラ4人: NATSUMI(p1/赤), MAKI(p2/紫), NINO(p3/水色), RIKU(p4/緑)
- デフォルトカーソル: NATSUMI
- 決定演出: 確認ダイアログ → アイリスクローズ（選択キャラ中心に黒く閉じる、700ms）

---

## NPC イベントタイプ一覧（npc_events.js）

| type | 概要 |
|---|---|
| `hisaro_sunlover` | スキン変更（1ページ選択肢 → フェードでスキン差替） |
| `ura_yahhy_shop` | カレー屋（2種のカレー → トリップ/グッドトリップ発動） |
| `nidhogg_give` | アイテム贈呈（初回のみ）+ スプライト差替 |
| `careful_letterbox` | レターボックス演出 → ジョーズSE → シャチ突進 → 赤フラッシュ → seahole遷移 |
| `item_shop` | 汎用ショップ（shop.open() ベース） |
| `mori_girl` | STATE.helmeted に応じてセリフ分岐 |
| `yahhy_jumprope` | 縄跳びミニゲーム起動 |

---

## TODO / 未実装

1. **outdoor → indoor_01 ドア**: `trigger: null`（座標未設定）
2. **seahole ドア**: `doors: []`（出入口なし、孤立マップ）
3. **vj_room02 ドア**: `doors: []`（エンディング後の戻り手段なし）
4. **vj_room02 NPC会話**: natsumi/riku/maki/nino 全員 `talkPages: []`
5. **rubber_duck_C**: マップ配置なし（ニーズヘッグイベントのみで入手）
6. **achievedQuests**: Set定義のみ、クエストシステム未実装
7. **bgm_select.mp3**: assetsに存在するが使用箇所なし
8. **chinanagoの活性化**: chinanago_off → on の演出ロジック未実装
