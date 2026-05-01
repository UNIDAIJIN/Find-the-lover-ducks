# 引き継ぎ書

最終確認日: 2026-05-01

このファイルは「次のセッションで何を読むべきか」「今の実装がどこまで進んでいるか」「ローカル差分が何か」を短時間で把握するための引き継ぎ用メモ。
実装の正本はコード。特に `src/main.js` / `src/input.js` / `src/mobile_controller.js` / `src/data/quests.js` / `src/data/maps/*` を優先すること。

## まず読むファイル

1. `src/main.js`
2. `src/input.js`
3. `src/mobile_controller.js`
4. `src/title.js`
5. `src/data/quests.js`
6. `src/data/maps/outdoor.js`
7. `src/data/maps/flowers.js`
8. `src/data/npcs/red_door_vj_room01.js`
9. `src/npcs.js`
10. `SPEC.md`

`quest_impl.md` は参考程度。実装状況と一部ズレる可能性あり。

## ローカル起動

ビルド不要。静的配信で動く。

```bash
cd /Users/ishiharariku/Desktop/game
python3 -m http.server 8080 --bind 127.0.0.1
```

ブラウザは `http://127.0.0.1:8080`

## 現在の未コミット差分

`git status --short --branch` で確認した現状:

- `assets/maps/.DS_Store`
- `assets/maps/house04.png`
- `assets/maps/flowers.png` 未追跡
- `assets/maps/flowers_col.png` 未追跡
- `assets/maps/flowers_top.png` 未追跡
- `src/data/maps/flowers.js` 未追跡
- `src/data/maps/outdoor.js`
- `src/data/npcs/minami_vj_room01.js`
- `src/data/npcs/red_door_vj_room01.js`
- `src/input.js`
- `src/main.js`
- `src/maps.js`
- `src/mobile_controller.js`
- `src/npcs.js`
- `src/title.js`

次に触る時は、これらをユーザー作業込みの現行差分として扱うこと。勝手に戻さない。

## 直近で入った大きな変更

### クエスト16

- `src/data/quests.js`
- 旧: `ピザ名人 / ピザを5枚とどける`
- 新: `炎上 / 配達中のピザを食べてしまう`
- 配達中に `pizza` を食べると `STATE.flags.pizzaAte = true`
- ピザの使用メッセージに `ナツミはピザをたべてしまった！` を入れている
- メッセージ後、1秒待ってからクエストアラートで `achieveQuest("16")`
- `pizzaSuccessCount >= 5` での達成は撤去済み

### ゲームパッド

- `src/input.js`
- Gamepad API 対応済み
- モバイルコントローラー相当の操作だけを割り当てる方針
- 現在の割り当て:
  - 左スティック / 十字: 移動
  - A / button 0: `z`
  - B / button 1: `x`
  - L1 / button 4: `s`
  - R1 / button 5: `l`
  - SELECT / button 8: `v`
- `src/ui_menu.js` の操作説明は、`C` デバッグ表記を出さず、ゲームパッド表記を追加済み

### 音楽停止

- `V` / SELECT が音楽停止操作
- 操作説明にも反映済み

### セーブ / ロード

- L1 にセーブ、R1 にロードを割り当て済み
- キーボードでは `S` セーブ、`L` ロード

### デバッグ高速移動とダッシュ

- `src/main.js`
- 旧: `C` がデバッグ高速移動
- 新: `B` がデバッグ高速移動 / 当たり判定表示 / 座標表示
- `C` は通常ダッシュ
- `C` ダッシュ:
  - 通常速度の `1.6x`
  - `space` / `space_boss` では無効
  - 走っている間、既存の震え表現を等倍時間で使う
  - 足元の土埃を4人全員から出す
- 月の石デバッグ切替は `M` に移動済み

### モバイル

- `src/title.js`
- モバイル版のみタイトル下に `POCKET EDITION` を表示
- `src/main.js` から `createTitle({ pocketEdition: MOBILE })` で渡している
- `src/mobile_controller.js`
- タッチスティックは `stickTouchId` を追跡する形に修正済み。別指の `touchmove/touchend` でスティックが崩れにくい

## upper / ground 管理

### 何のための状態か

- `src/col.js`
- 当たり判定色:
  - 透明: 通れる
  - 緑: 階段ゾーン
  - 青: `upper` の時だけ壁
  - 黄: `ground` の時だけ壁
  - その他の不透明色: 壁
- `src/main.js` で `heightLevel` / `charHeight` / `stairZonePrev` を持つ
- 緑の階段ゾーンに入った瞬間に `ground` と `upper` を切り替える

### 現方針

- upper / ground の切り替え判定は `outdoor` だけで使う
- ただし upper 位置にある家もあるので、屋内に入った時に `charHeight` 自体は消さない
- 屋内や別マップの当たり判定では一時的に `heightLevel = "ground"` として扱う
- `outdoor` に戻ったら保存していた `charHeight.leader` から高さを戻す

### ニューゲーム持ち越し対策

- `startNewGameFlow()` で以下をリセットする
  - `current.id = ""`
  - `mapReady = false`
  - `resetHeightState()`
- キャラ選択後と、暗転して `moritasaki_room` を読む直前にも `resetHeightState()` を呼ぶ
- `resetHeightState()` は全員 `ground` に戻し、`syncStairZonePrev()` で階段踏み状態も同期する
- 目的は、前回プレーで `upper` のまま終わった状態がニューゲームに混ざる事故を防ぐこと

## talkHit / hidden の注意

`hidden: true` のNPCは、見えないだけでなく会話判定から外れる可能性がある。見えない当たり判定ボックスやトークヒットだけ必要なものは `noRender: true` を使う。

直近修正:

- `src/npcs.js`
  - `timemachineSlotNpc` を `hidden: true` から `noRender: true` に変更
  - つきのいしをはめるトークヒット用
- `src/data/npcs/red_door_vj_room01.js`
  - `red_door_block` を `hidden: true` から `noRender: true` に変更
  - `vj_room01` の通れないドアのボックス用

## flowers マップ追加中

- `src/data/maps/outdoor.js`
  - `flowers` へのドア追加中
- `src/maps.js`
  - `flowersMap` を import / 登録中
- 未追跡:
  - `src/data/maps/flowers.js`
  - `assets/maps/flowers.png`
  - `assets/maps/flowers_col.png`
  - `assets/maps/flowers_top.png`

この一式は未完成の可能性がある。次に触る時はマップ遷移、spawn、当たり判定画像、top画像の重なりを実機確認すること。

## ピザ配達

### 関連箇所

- `src/data/npcs/pizzashop.js`
- `src/npc_events.js` の `pizza_shop`
- `src/main.js` の `startPizzaJob / settlePizzaJob / cancelPizzaJob`

### 現仕様

- ピザ屋NPC: `outdoor` の `pizzashop`
- 受注すると `pizza` アイテムを1個受け取り、配達先をランダム決定
- 配達先候補:
  - `kori`
  - `yahhy`
  - `keeper`
- 配達中は対象NPC頭上に `pizza_sign` マーカーを出す
- 対象NPCに話しかけると `pizza` を消費して配達完了
- 完了後にピザ屋へ戻ると報酬精算
- 配達中に `pizza` を食べるとクエスト `16: 炎上`

### 報酬テーブル

- 30秒以内: 1500EN
- 60秒以内: 1200EN
- 120秒以内: 1000EN
- 180秒以内: 700EN
- それ以降: 400EN

## クエスト状況

クエスト定義の正本は `src/data/quests.js`

現時点でコードから確認できる達成トリガーの例:

- `01` ラバーダック全回収
- `02` ミナミ敗北
- `03` チンアナゴ発見
- `04` バルーンドッグ発見
- `05` ニーズヘッグ初回会話
- `06` 踊ってないサボテン
- `07` ヘルメットで神社侵入
- `08` シャチに乗る
- `09` トリップ10回
- `10` duckHを聴かせる
- `11` チキンカレー後にプール
- `12` シューティングロビー初回会話
- `13` 100000EN
- `14` 伝説の剣取得
- `15` 地獄ドア全制覇
- `16` 配達中のピザを食べる
- `17` なわとび100回
- `19` アフロクラブ入会
- `20` 月到達
- `21` シャーマン全お告げ
- `22` 恐竜時代に行く
- `23` メカナツミ化
- `26` ナツミに10個食べさせる
- `27` 穴10回
- `28` 日焼け最大
- `29` 噴水30秒
- `30` ベンチ10秒

`18`, `24`, `25` は定義はあるが、この確認範囲では達成箇所を未追跡。次回必要なら `rg 'achieveQuest\\("18|24|25'` で確認すること。

## シューティング導線

### 入口

- `src/data/npcs/gate.js`
- NPC `gate` は `showWhenBgm: "assets/audio/duckJ.mp3"` の時だけ表示
- 話しかけると `shootingTrigger: true` により `shooting_lobby` に遷移

### ロビー構成

- `src/data/maps/shooting_lobby.js`
- 背景は `shootingBackdrop: true` で `drawShootingBackdrop()` を直接描画
- `src/npcs.js`
  - `lucha_shooting`
  - `door_0`〜`door_7`
- `door_0` は出口
- `door_1`〜`door_7` は個別のシューティング入口

### 既知の状態

- 旧メモにあった「Dキーで起動」は正式導線ではない
- 正式導線は `gate -> shooting_lobby -> door`
- ロビー初回会話でクエスト `12: じごくへん`
- 7枚全部クリアでクエスト `15: 魔王誕生`

## theater 演出

`theater` 関連は以前のまとまった実装。現在の直近作業の中心ではないが、消さないこと。

- `src/data/maps/outdoor.js`
  - `id: 34` のドアから `theater`
- `src/maps.js`
  - `theater` は黒背景 + 透明当たり判定の仮想マップ
- `src/main.js`
  - `drawTheaterScene()` で専用描画
  - 入場後5秒上映、ダイアログ、さらに5秒待機、`Z` で `outdoor` 復帰
  - `theater -> outdoor` 復帰後だけ60秒の雨演出
- `src/audio_bgm.js`
  - `bgm_movie.mp3` の音量補正あり

## 確認済み

直近作業中に以下の構文チェックは通過済み。

```bash
node --check src/main.js
node --check src/input.js
node --check src/title.js
node --check src/npcs.js
node --check src/data/npcs/red_door_vj_room01.js
```

## 次に触る時の優先候補

1. `flowers` マップ一式の遷移、当たり判定、top画像の表示確認
2. `upper / ground` のニューゲーム持ち越しが再現しないか実機確認
3. `C` ダッシュの速度、土埃、4人分の見た目を実機調整
4. ゲームパッドの L1/R1/SELECT とモバイル操作説明の実機確認
5. クエスト `18`, `24`, `25` の達成箇所を洗う

## 注意点

- `SPEC.md` の `nowMs` 利用ルールは守ること。フェードや暗転に `performance.now()` を直書きしない
- 既存差分は消さない。特に `flowers` 一式、`upper / ground`、入力周り、`noRender` 修正
- 見えない接触判定を作る時は `hidden: true` ではなく `noRender: true` を検討する
- `space` / `space_boss` では通常ダッシュを有効化しない
