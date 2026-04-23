# Phone Brawl Handoff

最終更新: 2026-04-20

## 概要

`phone-brawl/` は、本編統合前に仕様を固めるための Canvas 版ミニゲームです。South Park Phone Destroyer 風の横向きラインバトルを、384 x 360 の固定内部解像度で動かしています。

現状の直アクセス入口:

- `http://localhost:8000/phone-brawl/`
- ローカルサーバー例: `python3 -m http.server 8000`

主な実装ファイル:

- `src/ui_phone_brawl.js`: ゲーム本体、カード性能、AI、描画、SE/BGM
- `phone-brawl/index.html`: スタンドアロン起動ページ、画像アセット割り当て

注意:

- このリポジトリでは別AI/別作業者の変更が多数あります。`src/ui_phone_brawl.js` と `phone-brawl/index.html` 以外は、必要がなければ触らないでください。
- `assets/phone_brawl/`、`phone-brawl/`、`src/ui_phone_brawl.js` は未追跡の可能性があります。

## 操作

- 十字キー: 召喚位置カーソルを上下左右に移動
- `X`: 手札ホイールを回して中央カードを選択
- `Z`: 中央カードを召喚
- START ボタンを押すまでゲームは開始しません。

## 画面と基本仕様

- 内部解像度: `384 x 360`
- 横向き対戦:
  - 自分/EARTH: 左
  - 敵/BOSS: 右
- 時間制限なし
- POW ゲージは 10 分割
- HP は 4 分割
- HP セグメントが1つ割れるたびに爆発し、陣地半分より前線にいる攻撃側ユニットだけにダメージと大きなノックバックを与えます。
- 手札はデッキ10枚からランダムで初期5枚。
- 使用したカードは、場にそのカードのユニットが残っている間は再使用不可。
- 使用後の補充カードは下から自然にインする演出です。

## アセット割り当て

`phone-brawl/index.html` でスタンドアロン用の画像を渡しています。

プレイヤーカード:

- MSITP: `p1.png`, `p2.png`, `p3.png`, `p4.png`
- NIDHOGG: `nidhogg2.png`
- LUCHADOR: `lucha.png`
- ANGLER: `angler.png`
- GENERIC N2: `ryousan.png`
- LEE: `lee.png`
- CHINANAGO: `chinanago_on.png`
- CACTUS CREW: `cactus_hat.png`, `cactus.png`, `cactus.png`
- AFLO CLUB: `ac_1.png` - `ac_5.png`, `afloboy2.png`
- YAHHY: `yahhy.png`

本体/その他:

- EARTH 本体: `earth.png`
- BOSS 本体フォールバック: `uraboss.png`
- BOSS 本体3パーツ:
  - `uraboss_low.png`
  - `uraboss_mid.png`
  - `uraboss_top.png`
- 敵ユニット: `assets/phone_brawl/enemy.png`
- カレー: `curry.png`
- 唐辛子: `pepper.png`
- BGM: `assets/audio/duckC.mp3`

## 現在のカード仕様

### MSITP

- 4人組、縦一列気味に召喚
- セリフ: `いっけー！！！`
- 召喚から少し遅れて `FEVER!`
- FEVER 中:
  - 背景が虹色に流れる
  - 全味方が虹色に発光
  - 移動速度と攻撃頻度が上がる
  - ワープ音風SEが鳴る

### NIDHOGG

- タンク寄り、中距離攻撃
- セリフ: `（ ｉ _ ｉ ）`
- 紫のブレス攻撃
- 現在は瞬間火力ではなく、`0.78秒` 持続する火炎/煙ブレス
- 直撃総ダメージは従来1発分と同等になるよう、分割ダメージ
- AoE 判定あり
- 支点オフセット: `右11px / 下8px`
- 最近の調整で丸い泡っぽさを減らし、半透明の黒紫煙へ寄せています。

### ANGLER

- タワー系ユニット、移動しない
- セリフ: `イェーイ！楽しんでるぅ？`
- 白い釣り糸で攻撃
- 攻撃頻度は初期より2倍、HPは元の値に戻し済み
- 紐支点は元座標から `x + 6`, `y - 11`

### GENERIC N2

- 遠距離中サイズ
- セリフ: `ピピピ、ホッケ発見。`
- 死亡時、周囲に小爆発と小ノックバック

### LUCHADOR

- 近接中サイズ
- セリフ: `ジッゴクゥー！`
- 召喚後 `0.58秒` 立ち止まり、味方全員へ `pepper.png` を放物線で投げる
- 唐辛子を受け取った味方に `ATK UP`
- 強化中は赤く発光

### LEE

- 回復役
- セリフ: `イーガーコーテル！`
- 味方へ餃子回復
- 攻撃範囲表示は緑

### CACTUS CREW

- 3人組
- セリフ: `待たせたな！ブロ！`
- 前に近接タンク2体、後ろから帽子/遠距離役がついてくる

### AFLO CLUB

- 6人組
- セリフ: `アフロクラブ、サイコー！`
- 固まって出る
- 走って自爆
- 黒系爆発
- 爆発範囲は広め、周囲にダメージとノックバック

### YAHHY

- 近接ユニット
- セリフ: `あちちちち！`
- 召喚後、カレー設置まで歩かず攻撃もしない
- カレー構え風の小揺れあり
- `curry.png` を実寸以下でポップしてから沼を設置
- カレー沼:
  - 持続時間は長め
  - 茶色の液体ににんじん/じゃがいも風ドット
  - 敵が乗ると赤く光り、space の窒息風エフェクトに近い演出
  - スローとスリップダメージ

## 敵側

- 敵デッキは初期寄りの10枚構成
- 敵ユニット画像は共通で `assets/phone_brawl/enemy.png`
- 敵はセリフなし
- 敵の攻撃エフェクトは全部レーザー

## BOSS 本体の現状

BOSS は `uraboss_low/mid/top.png` の3パーツ構成です。

- 描画サイズ: `100 x 100`
- low: 左回転
- mid: 右回転
- top: 固定
- 回転は `state.bossSpin += dt` で毎フレーム進む方式
- 回転速度:
  - `BOSS_LOW_SPIN_RATE = -2.2`
  - `BOSS_MID_SPIN_RATE = 2.8`

直近で入れた未確認変更:

- BOSS本体に `grayscale(1) contrast(1.55)` を適用
- 背面に虹の放射とリングを描く `drawBossPsychedelicPop()` を追加
- ユーザーがこの変更の見た目をまだ確認する前に、引き継ぎ書作成へ移りました。

もし派手すぎる場合:

- `drawBossPsychedelicPop()` 内の `ctx.globalAlpha` を下げる
- 放射本数 `18` を減らす
- `contrast(1.55)` を `contrast(1.25)` くらいへ下げる

## 主要な実装位置

`src/ui_phone_brawl.js`:

- 定数・カード定義: ファイル冒頭
- `deployCard()`: ユニット生成、複数体カード、配置
- `applySummonEffect()`: MSITP FEVER / LUCHADOR ATK UP など
- `applyCurryEffect()`: YAHHY カレー設置
- `attack()`: 攻撃分岐。敵はレーザー、味方は個別エフェクト
- `nidhoggFlameAttack()`: NIDHOGG の持続ブレスと分割ダメージ開始
- `updateNidhoggFlames()`: ブレスの継続ダメージ
- `drawNidhoggFlame()`: 煙っぽいブレス描画
- `drawBase()`: EARTH/BOSS 本体描画
- `drawEnemyBaseParts()`: BOSS 3パーツ回転
- `drawBossPsychedelicPop()`: BOSS 背面の虹演出
- `drawBaseBreaks()`: HPセグメント破壊時の派手な爆発

## 検証

最低限の構文チェック:

```bash
node --check src/ui_phone_brawl.js
```

スタンドアロン確認:

```bash
python3 -m http.server 8000
```

ブラウザ:

```text
http://localhost:8000/phone-brawl/
```

## 次の作業候補

1. BOSS の虹演出が画面上で狙い通りか確認する
2. BOSS の虹がうるさければ透明度/本数を落とす
3. NIDHOGG ブレスがまだ泡に見えるなら、煙玉をさらに重ねて帯状にする
4. 本編統合時は、`phone-brawl/index.html` のアセット渡しを本編側の起動ルートへ移植する
5. 他AIの変更と競合しないよう、統合前に `src/ui_phone_brawl.js` と `phone-brawl/index.html` の扱いを決める
