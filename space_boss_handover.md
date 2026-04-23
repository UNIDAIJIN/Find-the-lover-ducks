# space_boss 引き継ぎ書

最終確認日: 2026-04-20

## 概要

クエスト30個達成後の隠しイベント「超銀河魔王戦」への道中カットシーンマップ。
spacesisters がパーティを宇宙経由でボス戦に運ぶ演出専用マップ。

## 全体フロー（ゲーム進行順）

1. **30クエスト達成** → 電話イベント（ミナミから）
2. **vj_room01** → ミナミ不在、2度目の電話で工場へ誘導
3. **vj_factry** → ミナミ＋spacesisters3体と会話、選択肢ループ
   - 「はい」→ sisters消滅（vanishアニメ）→ `galaxyLastBattle = true`
   - 2回目以降のミナミ: 「いってこい！死ぬなよ！」
4. **kako** → `galaxyLastBattle` フラグ時のみ sisters3体が三角配置で出現
   - 話しかけると順番ジャンプ → 虹色「グッドバイブレーション！」→ spaceWarp で space_boss へ
5. **space_boss** → 本ファイルの主題

## space_boss マップの現状

### 初期化（src/main.js loadMap内）
- BGM: `duckE.mp3`（setOverride）
- `partyVisible = false` — 通常パーティ描画を無効化
- パーティメンバー4体をNPCアクターとして生成（`sb_party_0`〜`sb_party_3`）
  - リーダー順でスプライト割り当て（`getPartySprite`）
  - `glow: true` で発光エフェクト付き
- spacesisters1 1体（`sb_ss1`）はNPCデータから配置、loadMap内で `glow: true` 付与
- O2ダメージ無効、月なし

### 背景描画（drawSpaceBossBackdrop）
- 黒背景 + 120個の星が上→下にスクロール
- `sbBlackHole = true` 時: 画面上端に見切れたブラックホール描画
  - 中心 y=-20、半径50px、紫〜オレンジの降着円盤、ゆっくり回転

### キャラ発光（drawEntry内 glow処理）
- `o.glow` が true のアクターはスプライト描画の前に青白い放射グラデーション
- 脈動: `0.35 + 0.15 * sin(t/600)`

### イベントシーケンス（sbTalk配列）

sbTalk はステップ配列で sbNext() が順次実行する。ステップ型:
- `{ wait: ms, pages: [...] }` — ms待機後にダイアログ
- `{ wait: ms }` — ダイアログなし待機のみ
- `{ fade: true, pages: [...] }` — フェードアウト→フェードイン後にダイアログ
- `{ fade: true }` — フェードのみ（区切り）
- `{ fade: true, onBlack: fn }` — 暗転中にコールバック実行
- `{ pages: [...] }` — 即座にダイアログ
- `{ action: "suck" }` — ブラックホール吸い込みアニメ
- `{ action: "regroup" }` — sisters非表示、4人再配置

現在のシーケンス:
```
1. 5s wait → 「さあ、しばらくおしゃべりでもしてよっか。」「ここからはけっこう遠いからね。」
2. 1s wait → 「なぜ息ができるんだって？」「とうぜん、ぼくらが一緒にいるからさ。」
3. fade → 「そうだね。つまり地球のきみたちの次元に合わせて言うなら、」
         「宇宙人はかならず三つ子で生まれてくると、説明することもできるね。」
         「でも、ぼくの生まれた次元からみればひとつの体さ。」
         「地球では3人分だけどね。」
4. fade → 「はじめて地球にきた日をおぼえているよ。」「きみたちの一人が生まれた日のことさ。」「かわいかったなぁ。」
5. fade → 「おでんは宇宙人が地球に伝えたんだよ。」「カップヌードルもね。」
6. fade → 「ユーフォー？カップ焼きそばの？」「ハハハ、それはちがうよー。」
         「あ、あとはウイダー！ウイダーは宇宙製だよ。」「忘れてた忘れた。」
7. fade → 「ついたよ、そろそろさ。」「覚悟を決めるんだね。」
8. fade（onBlack: ブラックホール出現）
9. 即座 → 「もう後戻りはできない。」「たのしかったよ、しなないでね。」
10. action:suck → 3s待機 → 5体がブラックホールに吸い込まれ(1.5s加速アニメ) → BGM停止 → 暗転10秒
11. action:regroup → sisters非表示、4人をleader位置+40px下に再配置、フェードイン
12. 3s wait → ★ここから未実装
```

### 吸い込みアニメ（sbSuck）
- 対象: sb_party_0〜3 + sb_ss1
- 1.5秒間、加速カーブ（p²）でブラックホール中心へ移動＋縮小＋フェードアウト
- drawEntry内のactor描画時にsbSuck状態を見てx,y,scale,alphaを補間

## 未実装・今後の作業

- **sbTalk の続き**: regroup + 3s wait の後のセリフ・演出が未定
- **ボス戦本体**: space_boss はまだカットシーン道中。実際の戦闘は未着手
- **「たのしかったよ、しなないでね。」**: 一時保留だった行、現在は「もう後戻りはできない。」の次に復活済み

## 関連ファイル

| ファイル | 関連箇所 |
|---|---|
| `src/main.js` | loadMap内 space_boss 初期化（~L2591）、drawSpaceBossBackdrop（~L1190）、sbSuck描画（~L3256）、glow描画（drawEntry内~L2798） |
| `src/npc_events.js` | factry_minami イベント（~L814）、kako_sisters_warp イベント（~L934） |
| `src/npcs.js` | vj_factry NPC定義、space_boss NPC（sb_ss1） |
| `src/data/maps/space_boss.js` | マップデータ（space.jsのコピー） |
| `src/maps.js` | space_boss 登録 |

## 状態変数（モジュールスコープ）

- `sbBlackHole` (bool) — ブラックホール描画フラグ
- `sbSuck` (object|null) — 吸い込みアニメ状態 { targets, start, duration }
- `_sbStars` (array|null) — 星パーティクル

## 注意点

- `NPCS_BY_MAP` は静的配列（モジュール読み込み時に評価）なので、フラグ依存NPCは loadMap 内で動的に追加/フィルタすること
- `input.lock()` 中は `dialog.open` の前に `input.unlock()` しないとZ送りが効かない
- `act._eventBusy` フラグでイベント中の再発火を防止している
- ダイアログのセリフは自動折り返しされるので、手動改行（配列内複数文字列）は基本不要

## Dキーデバッグ

現在: クエスト03（チンアナゴ）以外を全クリ
