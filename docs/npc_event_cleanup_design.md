# NPCイベント整理 設計書

最終更新: 2026-04-26

## 目的

NPCイベントを、今後追加・修正しやすい形に整理する。

今の `src/npc_events.js` は、以下が同じ場所に混ざりやすい。

- NPCごとのセリフ
- 選択肢文言
- フラグ条件
- アイテム付与、所持金増減、クエスト達成
- BGM停止、フェード、画面演出、ミニゲーム起動
- NPC画像変更や位置変更

外枠が埋まってきた段階では、イベント追加よりも「既存イベントを壊さず読める形にする」ことを優先する。

## 基本方針

1. いきなり大規模なイベントエンジンを作らない
2. 既存の `event.type` 方式は維持する
3. NPC固有の文章・設定は `src/data/events/*.js` または `src/data/npcs/*.js` 側へ寄せる
4. `src/npc_events.js` は「イベントタイプの実行ロジック」に寄せる
5. `main.js` はフィールド状態とctx提供に集中させる
6. 1回の作業では1イベントタイプ、または1NPCだけ整理する
7. 整理前後でゲーム内挙動を変えない

## 責務分離

### src/data/npcs/*.js

NPCの配置と見た目を書く。

書くもの:

- `kind`
- `name`
- `spriteKey`
- `x`, `y`
- `talkHit`
- `solid`
- `event`

原則として、長い会話本文や複雑なイベント本文はここに直接書かない。

### src/data/events/*.js

NPCイベントのデータを書く。

書くもの:

- 会話ページ
- 質問文
- 選択肢ラベル
- yes/no後の会話
- 金額、報酬、必要アイテム
- フラグ名
- fade時間などの調整値

書かないもの:

- `dialog.open` の呼び出し
- `setTimeout` のネスト
- `fade.startCutFade` の直接呼び出し
- `STATE` の直接更新
- `ctx` の直接参照

### src/npc_events.js

イベントタイプを実行する。

書くもの:

- `ev.type` ごとの分岐
- データを読んで `dialog`, `choice`, `shop`, `fade` を呼ぶ処理
- `STATE.flags` 更新
- アイテム付与
- クエスト達成
- NPC画像変更
- 演出・ミニゲーム開始のctx呼び出し

注意:

- 各イベントは必ず `true` を返す
- 対応できないイベントだけ `false` を返す
- 長くなったイベントタイプは helper 関数に切り出す

### src/main.js

フィールド側の実体を持つ。

書くもの:

- `runNpcEvent(act, ctx)` に渡すctx
- マップ、actor、party、BGM、ミニゲーム、画面解像度などの実処理
- Interaction Session の開始・終了

書かない方向に寄せたいもの:

- NPC固有の長い会話
- NPCイベントごとの細かい分岐
- 特定NPCだけの状態遷移

## イベントデータの標準形

### 単純会話

```js
export const sampleTalkEvent = {
  type: "talk_pages",
  talkType: "talk",
  pages: [
    ["こんにちは。"],
    ["いい天気だね。"],
  ],
};
```

### 選択肢つき会話

```js
export const sampleChoiceEvent = {
  type: "yes_no_dialog",
  introPages: [
    ["ちょっと頼みがあるんだ。"],
  ],
  question: "聞いてくれる？",
  options: ["はい", "いいえ"],
  onYesPages: [
    ["ありがとう。"],
  ],
  onNoPages: [
    ["そっか。"],
  ],
};
```

### 報酬つきイベント

```js
export const sampleRewardEvent = {
  type: "give_item_once",
  flag: "sampleRewardGiven",
  introPages: [
    ["これをあげる。"],
  ],
  itemId: "sample_item",
  afterPages: [
    ["たいせつにしてね。"],
  ],
  alreadyPages: [
    ["もうあげたよ。"],
  ],
};
```

## event.type の整理方針

### 汎用化しやすいもの

優先して共通タイプに寄せる。

- ただ話すだけ
- 1回だけアイテムを渡す
- 条件を満たしたら会話が変わる
- yes/noで分岐する
- お金を払ってfadeする
- ショップを開く
- 特定BGM中だけ反応する

候補:

- `talk_pages`
- `conditional_talk`
- `yes_no_dialog`
- `give_item_once`
- `pay_and_fade`
- `item_shop`

### 固有タイプのまま残すもの

無理に汎用化しない。

- `hisaro_sunlover`
- `ura_yahhy_shop`
- `nidhogg_give`
- `careful_letterbox`
- `phone_brawl`
- ミニゲーム開始を含むイベント
- NPC移動、画像差し替え、複数タイマーを含む演出

理由:

- 汎用化すると引数が増えすぎる
- バグった時に追いにくくなる
- 演出の意味がコードから消える

## 1イベント整理の手順

1. 対象NPCまたは `event.type` を1つ選ぶ
2. 現在の挙動を読む
3. セリフ、選択肢、調整値をデータ側へ移す
4. `npc_events.js` に残すのは実行手順だけにする
5. `main.js` にNPC固有処理がある場合はctx化できるか見る
6. `node --check` を通す
7. 実際の起動経路を1回確認する

## 作業時の禁止事項

- 複数NPCを同時に大きく整理しない
- 会話文を意味変更しない
- フラグ名を安易に変えない
- `STATE.flags` の既存キーを削除しない
- `event.type` を変える時は参照元を全検索する
- BGM停止・復帰を直接増やさない
- Interaction Session を迂回するイベント開始を増やさない

## チェックリスト

整理後に見ること。

- `runNpcEvent` が `true` を返している
- `choice.close()` が必要な選択肢で呼ばれている
- `dialog.onPageChange(null)` / `dialog.onTypingDone(null)` の戻し忘れがない
- `lockInput()` したら必ず `unlockInput()` される
- `setTimeout` 待ち中も Interaction Session が効く
- BGMを止める場合はスタック方式と衝突しない
- アイテム付与後に必要なクエスト判定が走る
- 初回/2回目以降の会話が崩れていない
- 対象NPCに再度話しかけても重複起動しない

## 優先順位

### 優先1: 既に整理を始めたもの

- `hisaro_sunlover`

理由:

- すでに `src/data/events/hisaro_sunlover.js` へ文章を寄せ始めている
- 今後の見本にしやすい

### 優先2: 汎用化できる小型イベント

- 単純会話
- yes/no会話
- 1回だけ報酬を渡すイベント

理由:

- 失敗時の影響範囲が小さい
- パターンを作ると後続が速い

### 優先3: 大型イベント

- `ura_yahhy_shop`
- `nidhogg_give`
- `careful_letterbox`

理由:

- 演出、BGM、タイマー、フラグが絡む
- 先に小型イベントで型を固めた方が安全

## 目標形

最終的に、NPCを見る時の読み順をこうする。

1. `src/data/npcs/*.js` で配置と `event.type` を見る
2. `src/data/events/*.js` で会話と設定を見る
3. `src/npc_events.js` でその `event.type` の実行手順を見る
4. `src/main.js` はctx提供やミニゲーム起動の実体だけ見る

これにより、「このNPCは何をするか」と「どう実行されるか」を分けて追えるようにする。
