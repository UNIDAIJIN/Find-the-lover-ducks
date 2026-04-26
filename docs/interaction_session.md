# Interaction Session 仕様

最終更新: 2026-04-26

## 目的

フィールド上の会話、選択肢、ショップ、短い演出、フェード待ち、アイテム使用後メッセージなどを「ひとつの操作不能セッション」として扱う。

これにより、以下を防ぐ。

- 会話中の待機時間にインベントリを開ける
- 会話中の待機時間に再度NPCへ話しかけられる
- `Z` 連打で同じNPCイベントや別イベントが重複起動する
- UIが閉じた直後の押しっぱなし/連打入力がフィールド操作に持ち越される
- `input.lock()` / `input.unlock()` の散在により、演出ごとに入力制御がずれる

## 対象範囲

Interaction Session に含めるもの。

- NPC会話
- 看板、調べる系
- pickup取得メッセージ
- アイテム使用後の待機、メッセージ
- 宝掘り
- 電話イベント
- メカナツミ進化などのフィールド上イベント
- タイムマシン設置/発動前後
- ダイビング開始前後の会話
- バトル開始前後の会話
- ムービー後のメッセージ
- ショップ、選択肢
- 短い演出待ち
- フェード待ち

Interaction Session に含めないもの。

- Phone Brawl 本体
- 通常バトル本体
- 縄跳び本体
- シューティング本体
- ダイビング本体
- タイトル、キャラクターセレクト、ロード画面

ミニゲーム/バトルはそれぞれ専用の `active/update` と入力管理を持つ。Interaction Session は開始前の会話/待機と、終了後にフィールドへ戻るまでの会話/待機だけを担当する。

## 入力仕様

Session active 中に許可する入力は、現在表示されているUIのための入力だけ。

### dialog active

- 許可: `Z`
- 用途: 文字送り、ページ送り、閉じる
- 禁止: 移動、メニュー、再会話、pickup取得、セーブ/ロード、デバッグキー

### choice active

- 許可: 上下左右、`Z`、`X`
- 用途: 選択肢移動、決定、キャンセル
- 禁止: フィールド操作全般

### shop active

- 許可: 上下、`Z`、`X`
- 用途: 店UI操作
- 禁止: フィールド操作全般

### fade / wait / 演出中

- 許可: なし
- `Z` も無効
- UIが出ていない待機中にイベントを開始できない

### session 終了時

- 必ず `input.clear()` する
- 押しっぱなし、連打、タッチ仮想ボタンの残り入力を捨てる

## 不変条件

- Session active 中は `tryInteract()` が実行されない
- Session active 中は `menu.toggle()` が実行されない
- Session active 中はフィールド移動が進まない
- Session active 中は pickup 取得イベントが開始されない
- Session active 中はセーブ/ロード/デバッグキーが反応しない
- `Z` は「今表示されているUIを進める」ためだけに使える
- `Z` は新しいフィールドイベント開始には使えない
- UIが閉じて次の `setTimeout` 待ちに入った瞬間は、すべての入力が無効になる
- Session の終了判定は、UI active 状態と tracked timer/interval の両方が空になってから行う

## モジュール設計

`src/interaction_session.js` を新設する。

### createInteractionSession(options)

想定API。

```js
const interactionSession = createInteractionSession({
  input,
  isUiActive: () => dialog.isActive() || choice.isActive() || shop.isActive() || fade.isActive(),
});
```

返すオブジェクト。

```js
{
  begin,
  end,
  isActive,
  blockFieldInput,
  wrapCallback,
  trackSync,
  scheduleReleaseCheck,
}
```

### begin()

Session を開始する。

- すでに active の場合は再初期化しない
- `input.clear()` だけ行う
- pending timer/interval の集合は新規開始時のみ空にする

### end()

Session を明示終了する。

- active を false にする
- tracked timer/interval を空にする
- pending count を 0 にする
- `input.clear()` する

通常は手動で呼ばない。ミニゲーム/バトル本体へ処理を渡す時など、明示的に session を切りたい場合だけ使う。

### isActive()

Session active か返す。

### blockFieldInput()

`update()` のフィールド処理直前で使う。

戻り値:

- `true`: フィールド処理を止める
- `false`: 通常通りフィールド処理へ進む

内部動作:

- release check を予約
- `input.clear()` する
- active 中なら `true`

### wrapCallback(fn)

`dialog.open`, `choice.open`, `shop.open` の callback を包む。

callback 実行中に登録された `setTimeout` / `setInterval` を Session に紐づける。

### trackSync(fn)

NPCイベント起動直後など、同期的に `dialog.open` や `choice.open` が呼ばれる処理を包む。

例:

```js
interactionSession.begin();
const handled = interactionSession.trackSync(() => runNpcEvent(act, ctx));
```

### scheduleReleaseCheck()

UIやtimerが終わったあと、次のtickで終了可能か確認する。

終了条件:

- session active
- tracked timeout がない
- tracked interval がない
- pending count が 0
- `isUiActive()` が false

条件を満たしたら `end()` 相当の終了処理を行う。

## timer / interval 追跡仕様

Session 内の callback 実行中だけ、一時的に `globalThis.setTimeout`, `clearTimeout`, `setInterval`, `clearInterval` をラップする。

理由:

- 既存コードは `dialog.open(..., () => setTimeout(...))` が多い
- 全イベントを一度に書き換えるのは危険
- callback 内で予約された待機だけを session に紐づければ、既存コードを保ったまま「待機中入力不可」を実現できる

追跡対象:

- `trackSync(fn)` 中に登録された timer/interval
- `wrapCallback(fn)` 経由で実行された callback 中に登録された timer/interval
- tracked timer/interval の handler 内でさらに登録された timer/interval

追跡しないもの:

- 通常のゲームループ外で登録されたグローバルtimer
- BGMフェードなど、session外で開始された処理
- ミニゲーム/バトル本体の内部timer

注意:

- `clearTimeout(id)` / `clearInterval(id)` されたら pending から外す
- interval は `clearInterval` まで pending 扱い
- timer handler が実行されたら pending から外す
- handler 実行中にさらに timer が登録されたら、それも追跡する
- handler が例外を投げても pending は必ず減らす
- `globalThis` の関数は `finally` で必ず元に戻す

## UIラップ仕様

`main.js` 側で作成済みUIをラップする。

```js
const dialogOpenRaw = dialog.open.bind(dialog);
dialog.open = (pages, onClose, ...args) => {
  return dialogOpenRaw(pages, interactionSession.wrapCallback(onClose), ...args);
};
```

同様に対象は以下。

- `dialog.open`
- `choice.open`
- `shop.open`

`dialog.update`, `choice.update`, `shop.update` は各UIに必要な入力を消費するため、Session active 中でも通常通り先に実行する。

## update() の順序

基本順序。

1. loading/title/charSelect など専用画面
2. ミニゲーム/バトルなど専用 active 系
3. fade
4. shop
5. choice
6. dialog
7. `interactionSession.blockFieldInput()`
8. theater/kako movie など map 固有処理
9. menu
10. field input (`X` menu, `Z` tryInteract, save/load/debug, movement)

重要:

- `dialog/choice/shop` より前に session block しない
- UI操作に必要な入力まで止めてしまうため
- field input より前では必ず session block する

## 起動点

Session を開始する場所。

- `tryInteract()` で NPC/看板/調べる系が hit した直後
- pickup取得メッセージを開く直前
- item `onUseItem` の処理開始時
- 電話イベント開始時
- 宝掘り開始時
- メカナツミ進化開始時
- タイムマシン設置/発動開始時
- バトル後/ミニゲーム後にフィールド会話を開く直前

Session を開始しない場所。

- `tryInteract()` で hit しなかった時
- `act.showWhenBgm` など条件不一致でイベントを開始しない時
- ミニゲーム/バトル本体の開始後

## ミニゲーム/バトル境界

ミニゲーム/バトル本体へ入る時は session を終了する。

例:

```js
dialog.open(pages, () => {
  interactionSession.end();
  startPhoneBrawl();
});
```

終了後にフィールド会話へ戻る場合は、戻る側で新しい session を開始する。

```js
startPhoneBrawl(() => {
  interactionSession.begin();
  dialog.open(resultPages);
});
```

対象:

- `startPhoneBrawl`
- battle start
- jumprope start
- shooting start
- diving start

## 既存 input.lock/unlock との関係

初期導入では `input.lock()` / `input.unlock()` を一気に消さない。

理由:

- マップ遷移、専用演出、ミニゲーム境界でまだ必要な箇所がある
- 一括削除すると動作確認範囲が広すぎる

移行方針:

1. Interaction Session を導入する
2. field interaction 系の開始点だけ session に乗せる
3. 動作確認後、session 対象内の明らかに重複した `input.lock/unlock` を減らす
4. ミニゲーム/バトル/マップ遷移のロックは別途判断する

## 実装手順

1. `src/interaction_session.js` を作る
2. `main.js` で `createInteractionSession` を import
3. `dialog/choice/shop.open` を `wrapCallback` で包む
4. `tryInteract()` の起動点を `begin()` + `trackSync()` に変更
5. `update()` の dialog/choice/shop 後、field input 前に `blockFieldInput()` を入れる
6. pickup と item use の開始点に `begin()` を追加
7. 電話、宝掘り、進化、タイムマシンなど field event 開始点を順に session 化
8. ミニゲーム/バトル本体へ入る直前に `end()` する箇所を確認
9. `input.press()` は locked 中に押下登録しないよう維持する
10. `node --check` とブラウザ操作確認

## 動作確認項目

- NPC会話中に `X` でメニューが開かない
- 会話ページ送りは `Z` でできる
- 会話中に `Z` 連打しても同じイベントが重複起動しない
- 会話が閉じて次の会話まで `setTimeout` 待ちの間、`X` と `Z` が効かない
- 選択肢中は上下左右、`Z`、`X` が効く
- 選択肢中にメニューは開かない
- ショップ中は店操作だけできる
- pickup取得後のメッセージ中に再取得/再会話できない
- アイテム使用後の待ち時間に移動/メニュー/再会話できない
- ミニゲーム本体は従来通り操作できる
- バトル本体は従来通り操作できる
- ミニゲーム終了後の会話中は session が効く
- session終了後、押しっぱなしの `Z` / `X` がフィールドに持ち越されない
- タッチ仮想ボタンでも同じ挙動になる

## 注意点

- `dialog/choice/shop` の open wrapper は、UI生成直後に一度だけ設定する
- wrapper を複数回重ねない
- `isUiActive()` に `menu.isOpen()` は含めない。session中は menu を開かせない対象だから
- `fade.isActive()` は含める。フェード中は入力不可にするため
- `input.lock()` 中は UI操作も止まるため、session対象の通常会話では不用意に使わない
- 明示的に `input.lock()` が必要な専用演出は、sessionとは別の理由として残してよい
- session中に外部画面へ移る場合は、境界で `end()` する

## 命名

推奨名:

- ファイル: `src/interaction_session.js`
- 生成関数: `createInteractionSession`
- インスタンス: `interactionSession`

避ける名前:

- `npcInteraction`
- `dialogLock`
- `eventLock`

NPC専用ではなく、フィールド上の短い操作不能区間全体を扱うため。
