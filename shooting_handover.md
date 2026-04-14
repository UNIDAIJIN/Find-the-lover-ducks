# 引き継ぎ書

最終確認日: 2026-04-14

このファイルは「次のセッションで何を読むべきか」「今の実装がどこまで進んでいるか」「ローカル差分が何か」を短時間で把握するための引き継ぎ用メモ。
古いシューティング専用メモを置き換えた。実装の正本はコードで、特に `src/main.js` / `src/npc_events.js` / `src/ui_shooting.js` を優先すること。

## まず読むファイル

1. `src/main.js`
2. `src/npc_events.js`
3. `src/ui_shooting.js`
4. `src/data/quests.js`
5. `SPEC.md`
6. `quest_impl.md` は参考程度。実装状況と一部ズレる可能性あり

## ローカル起動

ビルド不要。静的配信で動く。

```bash
cd /Users/ishiharariku/Desktop/game
python3 -m http.server 8080 --bind 127.0.0.1
```

ブラウザは `http://127.0.0.1:8080`

## 現在の未コミット差分

主な差分:

- `src/main.js`
  `theater` 演出と、`theater -> outdoor` 復帰後1分の雨演出を追加
- `src/maps.js`
  仮想マップ `theater` を追加
- `src/data/maps/outdoor.js`
  `id:34` のドアを追加。`2512,1323` の trigger から `theater` に入る
- `src/sprites.js`
  `assets/sprites/movie.png` を `SPRITES.movie` として追加
- `src/audio_bgm.js`
  `bgm_movie.mp3` の音量補正を追加

今回の差分は `theater` 関連のまとまった実装。次セッションで消さないこと。

## 実装の大枠

今の追加要素は大きく5本ある。

1. 地獄ゲートから入る `shooting_lobby`
2. ロビー内の7枚ドアごとのシューティング
3. ピザ配達バイト
4. クエストの追加達成条件
5. `theater` 仮想マップ演出

## theater 演出

### 導線

- `src/data/maps/outdoor.js`
- `outdoor` に `id: 34` のドアを追加
- trigger は `2512,1323,16x8`
- 遷移先は `theater`
- `theater` から戻る時は同じ `doorId: 34` を使って `outdoor` に復帰

### マップ構成

- `src/maps.js`
- `theater` は黒背景 + 透明当たり判定の仮想マップ
- `spawn` は中央付近。通常のフィールド描画は使わず、`src/main.js` の専用描画分岐で映像を出している

### 映像仕様

- `src/sprites.js`
  `movie.png` は `384x180`。横2フレームの画像として扱う
- `src/main.js`
  `drawTheaterScene()` で `192x180` + `192x180` の2フレームを表示
- 演出内容:
  - ゆっくりフェードイン
  - 微小な揺れ
  - ブラー気味のフレーム切り替え
  - 青い被膜
  - 映写機っぽいフリッカーと粒ノイズ
- 左からスライドインは廃止済み
- `PRESS Z` 表示は出さない

### 入力と進行

- `theater` 中は `Z` 以外の入力を無効化
- 流れ:
  1. 入場後5秒上映
  2. ダイアログ表示
     - 「白黒の映画だ。」
     - 「女が砂糖をたべる映像が30分くらい続いている。」
  3. ダイアログを閉じる
  4. さらに5秒待機
  5. `Z` で `outdoor` に戻る
- ダイアログ後の待機は `startMs` と別に `exitWaitStartMs` を持っている。映像の再フェードインを避けるため

### theater 専用BGM

- `theater` 滞在中だけ `assets/audio/bgm_movie.mp3`
- `src/audio_bgm.js` でこの曲だけ音量補正 `1.8x`

### 復帰後の雨

- `theater -> outdoor` を `doorId:34` で戻った時だけ発火
- `src/main.js` に簡易雨エフェクトを実装
- 持続時間は60秒
- 雨は縦線。青っぽい薄い全体被膜あり
- 他の遷移では雨は発火しない

## シューティング導線

### 入口

- `src/data/npcs/gate.js`
- NPC `gate` は `showWhenBgm: "assets/audio/duckJ.mp3"` の時だけ表示
- 話しかけると `shootingTrigger: true` により `shooting_lobby` に遷移

### ロビー構成

- `src/data/maps/shooting_lobby.js`
  1x1の透明画像を使った専用マップ。背景は `shootingBackdrop: true` で `drawShootingBackdrop()` を直接描画
- `src/npcs.js`
  `lucha_shooting` と `door_0`〜`door_7` を配置
- `door_0` は出口。屋外へ戻る
- `door_1`〜`door_7` は個別のシューティング入口

### 解放条件

- ロビーで最初に `lucha_shooting` に話しかけるまでドアは使えない
- 初回会話後に `STATE.flags.shootingLobbyLuchaTalked = true`
- この時点でクエスト `12: じごくへん` を達成

### ドアの動作

- 実装は `activateShootingLobbyDoor()` in `src/main.js`
- `door_1`〜`door_7` は1ドア=1回のシューティング
- 開始時:
  - フィールドBGMを `about:blank` で止める
  - `startShootingBgm()`
  - `shooting.start(..., { autoEndOnClear: true })`
- クリア時:
  - 該当ドアに `STATE.flags.shootingCleared_<door name>` を立てる
  - ドアマークを `door_noclear` から `door_clear` にアニメ付きで切替
  - 7枚全部クリアでクエスト `15: 魔王誕生`
- 失敗時:
  - ロビーに戻される
  - 下方向ノックバックあり

### シューティング本体

ファイル: `src/ui_shooting.js`

- フェーズ: `idle -> countdown -> playing -> result`
- 自機:
  - 矢印移動
  - `Z` 射撃
  - `C` シールド
  - `B` でライフ全回復（デバッグ）
- ライフ: 3
- 被弾無敵: 90f
- スロー演出:
  - 600fごとに候補
  - 敵が3体超の時に180f発動
- 敵:
  - `small`
  - `zigzag`
  - `shooter`
- 3waveごとにボス `EL JIGOKU`
- スコア:
  - small/zigzag 100
  - shooter 300
  - boss 3000
- 報酬:
  - `earnedEN = floor(score / 10)`
  - 終了時に所持金へ加算
- `autoEndOnClear: true` のため、ボス撃破後は短い結果表示ののち自動終了

### 既知の状態

- 旧メモにあった「Dキーで起動」はもう主導線ではない。現状の正式導線は `gate -> shooting_lobby -> door`
- ライフ0で `result` へ遷移する処理は実装済み
- ロビー滞在中は `startShootingBgm()` を使い続ける構成

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
- `refreshPizzaJobMarkers()` が表示制御
- 対象NPCに話しかけると `pizza` を消費して配達完了
- 完了後にピザ屋へ戻ると報酬精算

### 報酬テーブル

- 30秒以内: 1500EN
- 60秒以内: 1200EN
- 120秒以内: 1000EN
- 180秒以内: 700EN
- それ以降: 400EN

### 失敗/例外

- 配達中に `pizza` を食べると `STATE.flags.pizzaAte = true`
- その状態でピザ屋に戻るとバイト失敗としてキャンセル
- 配達中にインベントリから `pizza` が消えていたら、ピザ屋会話時に補充する

### クエスト連動

- 配達成功回数 `pizzaSuccessCount >= 5` でクエスト `16: ピザ名人`

### 直近差分

- `pizza_sign.png` がローカル未追跡
- `drawPizzaMarkOverlay()` のY位置調整が `src/main.js` に未コミットで入っている
- この2つはセットの作業

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
- `16` ピザ5回配達
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

`18`, `24`, `25` は定義はあるが、この確認範囲では達成箇所を未追跡。次回必要なら `rg "achieveQuest\\(\"18|24|25"` で即確認すること。

## 次に触る時の優先候補

1. ピザ配達の表示/導線を実機確認して、`pizza_sign` の位置と視認性を最終調整
2. `theater` 演出と雨の強さ/見た目を実機で微調整
3. シューティングの正式入口条件を演出込みで詰める
4. `quest_impl.md` を現行コードに合わせて更新
5. 未接続クエスト `18`, `24`, `25` の実装有無を洗う

## 注意点

- `SPEC.md` の `nowMs` 利用ルールは守ること。フェードや暗転に `performance.now()` を直書きしない
- 既存差分は消さない。特に `src/main.js` の `theater` / 雨実装
- `shooting_lobby` は通常マップ画像を使わない特殊構成なので、背景追加を考えるなら `shootingBackdrop` 分岐も合わせて確認する
