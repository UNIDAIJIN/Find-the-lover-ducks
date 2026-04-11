# INFIERNO TRIP シューティング 引き継ぎ書

## 概要
コンセプト：メキシコ × 地獄 × トリップ のサイケデリックシューティング。
カレートリップとの連動を想定しているが、現在はデバッグ用にDキーで起動。

## 関連ファイル
| ファイル | 役割 |
|---|---|
| `src/ui_shooting.js` | シューティングゲーム本体（全ロジック・描画） |
| `src/se.js` | テクノBGM（`startShootingBgm` / `stopShootingBgm`） |
| `src/sprites.js` | skull_a / skull_b / skull_r / pepper を追加済み |
| `src/main.js` | import・インスタンス生成・D起動・update/draw フック |

## 起動フロー（main.js）
```
Dキー押下
  → bgmCtl.setOverride("about:blank")
  → startShootingBgm()
  → shooting.start(cb)
      cb: stopShootingBgm() + bgmCtl.setOverride(null) + EN加算
```

## ゲームフェーズ
`idle` → `countdown`（3秒）→ `playing` → `result`

## 操作
| キー | 内容 |
|---|---|
| ←→↑↓ | 移動 |
| Z | 射撃 |
| B | 体力全回復（デバッグ） |
| Z（リザルト） | フィールドへ戻る |

## 敵仕様
| タイプ | スプライト | 動き | HP |
|---|---|---|---|
| small | skull_a | サイン波で直進 | 1 |
| zigzag | skull_b | 左右ジグザグ | 1 |
| shooter | skull_r | 直進＋プレイヤーへ弾発射 | 3 |
| ボス EL JIGOKU | skull_r（拡大2.5倍） | 横往復、フェーズで弾数増加 | 20+wave*5 |

## ウェーブ仕様
- 敵全滅 → 次ウェーブ（80フレーム後）
- wave1: smallのみ / wave2〜: zigzag混入 / wave3〜: shooter混入
- 3ウェーブごとにボス出現
- ウェーブが進むほど出現数が増える（最大17体）

## スコア・報酬
| 対象 | 点数 |
|---|---|
| small | 100pt |
| shooter | 300pt |
| ボス | 3000pt |
| 報酬換算 | スコア ÷ 10 = EN |

## 演出
- 背景：色相シフト虹グラデ＋うねる横縞＋放射光線
- 画面揺れ（wobble）：常時サイン波
- スローモーション：600フレームごとに180フレーム発動
- ヒットフラッシュ：被弾時に赤フラッシュ＋大きい揺れ
- テキストポップ（敵撃破時）：CALIENTE!! / VIVA!! / あつい / MUERTO! / INFIERNO! / ヤバい!!
- BGM：Web Audio API 手続き型テクノ（BPM138、4つ打ち＋フリジアンベース）

## 体力
- ライフ3（唐辛子アイコン pepper.png）
- 被弾後90フレーム無敵

## 未実装・TODO
- [ ] 終了条件を「ライフ0でゲームオーバー」に確認（現状リザルト画面には遷移する）
- [ ] 正式な起動トリガー（チキンカレー後の特定ゾーン入場 or カセットアイテム）
- [ ] BGMスロー時にピッチを下げる
- [ ] パワーアップアイテム（3WAY弾など）
- [ ] 難易度バランス調整
- [ ] メキシカンスカルスプライトを専用デザインに（現在は既存のスプライトを色相回転で代用）
- [ ] ボス撃破時の演出強化
