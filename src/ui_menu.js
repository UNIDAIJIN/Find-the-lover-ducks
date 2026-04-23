// ui_menu.js  – タブ選択 → にゅん展開のメインメニュー
import { playCursor, playConfirm, playItemJingle, playUseItemSe } from "./se.js";
import { QUESTS } from "./data/quests.js";
import { STATE } from "./state.js";

export function createMenu({
  BASE_W,
  BASE_H,
  input,
  inventory,       // data: getSnapshot / addItem / resetItems
  itemName,
  itemBgmSrc,
  stopBgm,
  unlockBgm,
  setOverrideBgm,
  toast,
  onUseItem,   // (id) => bool  true なら標準BGM切り替えをスキップ
} = {}) {

  // =====================
  // State
  // =====================
  let phase     = "closed"; // "closed" | "tabs" | "open" | "closing"
  let tabIdx    = 0;
  let animStart = 0;
  let closeStart = 0;

  // item cursor (もちもの タブ)
  let itemCursor    = 0;
  let itemScrollRow = 0;

  // quest (クエスト タブ)
  let questScroll      = 0;
  let questCursor      = 0;
  let questCondScrollX = 0;   // cond 列の横スクロールオフセット
  let questCondScrollT = 0;   // カーソルがこの行に来た時刻

  // =====================
  // Constants / Layout
  // =====================
  const TABS           = ["もちもの", "クエスト", "そうさ"];
  const ANIM_MS        = 260;
  const ITEM_VISIBLE   = 9;
  const QUEST_ROWS     = 8; // パネル内に表示できる行数

  const TAB_W   = 58;
  const TAB_H   = 16;
  const TAB_GAP = 2;
  const totalTabW = TABS.length * TAB_W + (TABS.length - 1) * TAB_GAP;
  const tabBarX   = ((BASE_W - totalTabW) / 2) | 0;
  const tabBarY   = 6;

  const PAN_X = 8;
  const PAN_Y = tabBarY + TAB_H + 3;
  const PAN_W = BASE_W - 16;
  const PAN_H = BASE_H - PAN_Y - 32; // 下部に所持金小窓スペース確保

  // =====================
  // Helpers
  // =====================
  function now() {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
  }

  function easeOutBack(t) {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function getItems() {
    return inventory ? inventory.getSnapshot() : [];
  }

  function clampScroll(n) {
    const maxSR = Math.max(0, n - ITEM_VISIBLE);
    itemScrollRow = Math.max(0, Math.min(itemScrollRow, maxSR));
  }

  function moveCursor(items, idx) {
    const n = items.length;
    if (n <= 0) { itemCursor = 0; itemScrollRow = 0; return; }
    itemCursor = Math.max(0, Math.min(n - 1, idx));
    if (itemCursor < itemScrollRow) itemScrollRow = itemCursor;
    if (itemCursor >= itemScrollRow + ITEM_VISIBLE) itemScrollRow = itemCursor - ITEM_VISIBLE + 1;
    clampScroll(n);
  }

  // =====================
  // Public API
  // =====================
  function isOpen() { return phase !== "closed"; }

  function toggle() {
    if (phase === "closed") {
      phase  = "tabs";
      tabIdx = 0;
      input.clear();
    } else {
      phase = "closed";
      input.clear();
    }
  }

  function close() {
    phase = "closed";
    input.clear();
  }

  // =====================
  // Update
  // =====================
  function update() {
    if (phase === "closed") return;

    if (phase === "tabs") {
      if (input.consume("x")) { phase = "closed"; input.clear(); return; }
      if (input.consume("ArrowLeft"))  { tabIdx = (tabIdx - 1 + TABS.length) % TABS.length; playCursor(); }
      if (input.consume("ArrowRight")) { tabIdx = (tabIdx + 1) % TABS.length; playCursor(); }
      if (input.consume("z")) {
        phase     = "open";
        animStart = now();
        playConfirm();
        if (tabIdx === 0) {
          const unique = [...new Map(getItems().map(id => [id, id])).keys()];
          itemCursor = Math.max(0, Math.min(itemCursor, unique.length - 1));
          clampScroll(unique.length);
        } else if (tabIdx === 1) {
          questCondScrollX = 0;
          questCondScrollT = now();
        }
      }
      return;
    }

    if (phase === "open") {
      const elapsed = now() - animStart;
      if (elapsed < ANIM_MS) return; // アニメ中は入力ブロック

      if (input.consume("x")) { phase = "closing"; closeStart = now(); input.clear(); return; }

      if (tabIdx === 0) {
        const items = getItems();
        const unique = [...new Map(items.map(id => [id, id])).keys()];
        const n = unique.length;
        if (n > 0) {
          if (input.consume("ArrowUp"))   { moveCursor(unique, itemCursor - 1); playCursor(); }
          if (input.consume("ArrowDown")) { moveCursor(unique, itemCursor + 1); playCursor(); }
          if (input.consume("z")) {
            const id   = unique[itemCursor];
            const name = itemName(id);
            const src  = itemBgmSrc(id);
            close();
            if (src && typeof stopBgm === "function") stopBgm();
            playUseItemSe();
            if (toast) toast.show(`${name} をつかった。`);
            const handled = typeof onUseItem === "function" && onUseItem(id);
            if (!handled && src) {
              setTimeout(() => {
                unlockBgm(); setOverrideBgm(src);
              }, 670);
            }
          }
        }
      } else if (tabIdx === 1) {
        const prev = questCursor;
        if (input.consume("ArrowUp"))   { questCursor = Math.max(0, questCursor - 1); playCursor(); }
        if (input.consume("ArrowDown")) { questCursor = Math.min(QUESTS.length - 1, questCursor + 1); playCursor(); }
        if (questCursor !== prev) {
          questCondScrollX = 0;
          questCondScrollT = now();
        }
        // スクロールビューをカーソルに追従
        if (questCursor < questScroll) questScroll = questCursor;
        if (questCursor >= questScroll + QUEST_ROWS) questScroll = questCursor - QUEST_ROWS + 1;
      }
      // そうさ: x で戻るのみ（上でハンドル済み）
    }

    if (phase === "closing") {
      if (now() - closeStart >= ANIM_MS) {
        phase = "tabs";
      }
    }
  }

  // =====================
  // Draw
  // =====================
  function drawTabBar(ctx) {
    ctx.font = "10px PixelMplus10";
    ctx.textBaseline = "top";
    for (let i = 0; i < TABS.length; i++) {
      const tx  = tabBarX + i * (TAB_W + TAB_GAP);
      const ty  = tabBarY;
      const sel = i === tabIdx;

      // 影（2pxオフセット単色）
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(tx + 2, ty + 2, TAB_W, TAB_H);
      // 本体
      ctx.fillStyle = sel ? "#fff" : "#000";
      ctx.fillRect(tx, ty, TAB_W, TAB_H);

      // 枠
      ctx.strokeStyle = "#fff";
      ctx.lineWidth   = 1;
      ctx.strokeRect(tx + 0.5, ty + 0.5, TAB_W - 1, TAB_H - 1);
      // テキスト
      ctx.fillStyle = sel ? "#000" : "#fff";
      const tw = ctx.measureText(TABS[i]).width;
      if (sel) ctx._skipTextShadow = true;
      ctx.fillText(TABS[i], (tx + (TAB_W - tw) / 2) | 0, ty + 3);
      if (sel) ctx._skipTextShadow = false;
    }
  }

  function drawPanelContent(ctx, tab) {
    ctx.font = "10px PixelMplus10";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#fff";

    const cx = PAN_X + 10;
    const cy = PAN_Y + 8;

    if (tab === 0) {
      // もちもの（1行1種、右端に個数）
      const items = getItems();
      if (items.length <= 0) {
        ctx.fillText("（なし）", cx, cy);
        return;
      }
      // 重複をまとめて unique リスト化
      const countMap = new Map();
      const unique = [];
      for (const id of items) {
        if (!countMap.has(id)) { countMap.set(id, 0); unique.push(id); }
        countMap.set(id, countMap.get(id) + 1);
      }
      const n        = unique.length;
      const nameX    = cx + 12;
      const countX   = PAN_X + PAN_W - 16;
      const startIdx = itemScrollRow;
      const endIdx   = Math.min(n, startIdx + ITEM_VISIBLE);
      for (let idx = startIdx; idx < endIdx; idx++) {
        const yy     = cy + (idx - startIdx) * 12;
        const id     = unique[idx];
        const cnt    = countMap.get(id);
        const cntStr = `×${cnt}`;
        if (idx === itemCursor) ctx.fillText("▶", cx, yy);
        ctx.fillText(itemName(id), nameX, yy);
        ctx.fillStyle = "#aaa";
        const cw = ctx.measureText(cntStr).width;
        ctx.fillText(cntStr, countX - cw, yy);
        ctx.fillStyle = "#fff";
      }
      // スクロールバー
      if (n > ITEM_VISIBLE) {
        const trackX  = PAN_X + PAN_W - 5;
        const trackH  = ITEM_VISIBLE * 12;
        const thumbH  = Math.max(4, Math.round(trackH * ITEM_VISIBLE / n));
        const maxSR   = n - ITEM_VISIBLE;
        const thumbY  = cy + Math.round((trackH - thumbH) * itemScrollRow / maxSR);
        ctx.fillStyle = "#333";
        ctx.fillRect(trackX, cy, 2, trackH);
        ctx.fillStyle = "#fff";
        ctx.fillRect(trackX, thumbY, 2, thumbH);
      }

    } else if (tab === 1) {
      // クエスト（実績）リスト
      const ROW_H   = 12;
      const numX    = cx;
      const titleX  = cx + 22;
      const condX   = cx + 90;
      const headerY = cy;
      const listY   = cy + 14;

      // ヘッダー
      ctx.fillStyle = "#aaa";
      ctx.fillText("No", numX, headerY);
      ctx.fillText("名称", titleX, headerY);
      ctx.fillText("達成条件", condX, headerY);
      ctx.strokeStyle = "#444";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAN_X + 4, headerY + 11);
      ctx.lineTo(PAN_X + PAN_W - 4, headerY + 11);
      ctx.stroke();

      const COND_CLIP_W = 65;  // ~6.5 全角文字分
      const COND_PAUSE  = 500; // スクロール開始前のポーズ (ms)
      const COND_SPEED  = 0.04; // px/ms
      const COND_GAP    = 24;  // ループ折り返し時の間隔 (px)

      const start = questScroll;
      const end   = Math.min(QUESTS.length, start + QUEST_ROWS);
      for (let i = start; i < end; i++) {
        const q       = QUESTS[i];
        const yy      = listY + (i - start) * ROW_H;
        const done    = STATE.achievedQuests.has(q.id);
        const isCur   = i === questCursor;

        // カーソル行: 色反転ボックス
        if (isCur) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(PAN_X + 4, yy - 1, PAN_W - 8, ROW_H);
        }

        const textColor = isCur ? "#000" : (done ? "#fff" : "#555");
        ctx.fillStyle = textColor;
        if (isCur) ctx._skipTextShadow = true;
        ctx.fillText(q.id,                       numX,    yy);
        ctx.fillText(done ? q.title : "？？？",  titleX,  yy);

        // cond 列：クリップ＆マーキー
        const condText = done ? q.cond : "？？？？？";
        const fullW    = ctx.measureText(condText).width;
        const maxScroll = Math.max(0, fullW - COND_CLIP_W);

        let scrollX = 0;
        const loopW = fullW + COND_GAP;
        if (isCur && fullW > COND_CLIP_W) {
          const elapsed = now() - questCondScrollT;
          if (elapsed >= COND_PAUSE) {
            scrollX = ((elapsed - COND_PAUSE) * COND_SPEED) % loopW;
          }
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(condX, yy - 1, COND_CLIP_W, ROW_H + 1);
        ctx.clip();
        ctx.fillStyle = textColor;
        ctx.fillText(condText, condX - scrollX, yy);
        // ループ用の2枚目
        if (isCur && fullW > COND_CLIP_W) {
          ctx.fillText(condText, condX - scrollX + loopW, yy);
        }
        ctx.restore();
        if (isCur) ctx._skipTextShadow = false;
      }

      // スクロールバー（白い四角が位置を示す）
      if (QUESTS.length > QUEST_ROWS) {
        const trackX = PAN_X + PAN_W - 5;
        const trackH = QUEST_ROWS * ROW_H;
        const thumbH = Math.max(4, Math.round(trackH * QUEST_ROWS / QUESTS.length));
        const maxScroll = QUESTS.length - QUEST_ROWS;
        const thumbY = listY + Math.round((trackH - thumbH) * questScroll / maxScroll);
        // トラック
        ctx.fillStyle = "#333";
        ctx.fillRect(trackX, listY, 2, trackH);
        // サム
        ctx.fillStyle = "#fff";
        ctx.fillRect(trackX, thumbY, 2, thumbH);
      }
    } else {
      // そうさ
      const rows = [
        ["矢印キー",  "いどう"],
        ["Z",         "けってい・はなす"],
        ["X",         "メニュー・キャンセル"],
        ["S",         "セーブ"],
        ["L",         "ロード"],
        ["V",         "おんがくていし"],
      ];
      const descX = PAN_X + PAN_W - 10;
      ctx.textAlign = "right";
      rows.forEach(([key, desc], i) => {
        ctx.textAlign = "left";
        ctx.fillStyle = "#aaa";
        ctx.fillText(key, cx, cy + i * 14);
        ctx.textAlign = "right";
        ctx.fillStyle = "#fff";
        ctx.fillText(desc, descX, cy + i * 14);
      });
      ctx.textAlign = "left";
    }
  }

  function drawPanel(ctx) {
    let t;
    if (phase === "closing") {
      t = 1 - Math.min(1, (now() - closeStart) / ANIM_MS);
    } else {
      t = Math.min(1, (now() - animStart) / ANIM_MS);
    }
    const e = Math.max(0, easeOutBack(t));

    // 展開の起点: パネル中央（常に同じ位置から開く）
    const originX = (PAN_X + PAN_W / 2) | 0;
    const originY = tabBarY + TAB_H + 3;

    const pw = (PAN_W * e) | 0;
    const ph = (PAN_H * e) | 0;
    const px = (originX - pw / 2) | 0;

    ctx.save();

    // 影（2pxオフセット単色、クリップ前に描画）
    if (pw > 4 && ph > 4) {
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(px + 2, originY + 2, pw, ph);
    }

    // パネル外へはみ出さないようクリップ
    ctx.beginPath();
    ctx.rect(PAN_X - 1, PAN_Y - 1, PAN_W + 2, PAN_H + 2);
    ctx.clip();

    ctx.fillStyle = "#000";
    ctx.fillRect(px, originY, pw, ph);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth   = 1;
    if (pw > 1 && ph > 1) ctx.strokeRect(px + 0.5, originY + 0.5, pw - 1, ph - 1);

    // コンテンツはアニメ終盤でフェードイン（closing時は非表示）
    if (phase !== "closing" && t >= 0.82) {
      ctx.globalAlpha = (t - 0.82) / 0.18;
      drawPanelContent(ctx, tabIdx);
    }

    ctx.restore();
  }

  function drawMoneyWindow(ctx) {
    if (tabIdx !== 0) return; // もちものタブのみ
    const MW = 72, MH = 16;
    const mx = PAN_X + PAN_W - MW;
    const my = PAN_Y + PAN_H + 4;
    ctx.fillStyle = "#000";
    ctx.fillRect(mx, my, MW, MH);
    ctx.fillRect(mx - 1, my - 1, MW + 2, 1);
    ctx.fillRect(mx - 1, my + MH, MW + 2, 1);
    ctx.fillRect(mx - 1, my - 1, 1, MH + 2);
    ctx.fillRect(mx + MW, my - 1, 1, MH + 2);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.strokeRect(mx + 0.5, my + 0.5, MW - 1, MH - 1);
    ctx.font = "normal 10px PixelMplus10";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "right";
    ctx.fillText(STATE.money + " EN", mx + MW - 6, my + 3);
    ctx.textAlign = "left";
  }

  function draw(ctx) {
    if (phase === "closed") return;
    drawTabBar(ctx);
    if (phase === "open" || phase === "closing") {
      drawPanel(ctx);
      drawMoneyWindow(ctx);
    }
  }

  return {
    isOpen,
    toggle,
    close,
    update,
    draw,
  };
}
