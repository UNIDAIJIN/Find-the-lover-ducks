// npc_events.js
export function runNpcEvent(act, ctx) {
  const ev = act?.event;
  if (!ev || !ev.type) return false;

  if (ev.type === "hisaro_sunlover") {
    const { choice, dialog, fade, sprites, party, nowMs } = ctx;

    const lines = ev.lines || ["……"];
    const options = ev.options || ["はい", "いいえ"];

    // 2ページ想定：
    // page0: ここは〜
    // page1: きみも〜（このページで choice を出す）
    const pages = [
      [lines[0] ?? "……"],
      [lines[1] ?? "……"],
    ];

    // ★同じイベントで何回も choice を出さないためのガード
    let choiceShown = false;
    let finished = false;

    // choice位置（メッセージ窓の上に積む）
    function placeChoiceAboveDialog() {
      if (typeof dialog.getRect !== "function") return;
      if (typeof choice.setAnchor !== "function") return;

      const r = dialog.getRect();

      const pad = 10;
      const rowH = 14;
      const choiceW = 78;
      const choiceH = pad * 2 + (options.length | 0) * rowH;

      choice.setAnchor({
        x: (r.x + r.w - 8 - choiceW) | 0,
        y: (r.y - 6 - choiceH) | 0,
        w: choiceW,
        h: choiceH,
      });
    }

    // ★このイベント専用のページ変化ハンドラ（ワンショット運用）
    function onPageChange(pageIndex) {
      if (finished) return;
      // 2ページ目に入った瞬間だけ choice を出す
      if (pageIndex === 1 && !choiceShown) {
        choiceShown = true;
        placeChoiceAboveDialog();

        // 「やいていくかい？」が表示されている状態で choice を開く
        choice.open(options, (idx) => {
          // ★選択が確定した瞬間に “連動” を解除して二度と出ないようにする
          finished = true;
          if (typeof dialog.onPageChange === "function") dialog.onPageChange(null);

          // ★次の表示に入る前に choice を必ず閉じる
          if (typeof choice.close === "function") choice.close();

          if (idx === 0) {
            // YES：フェードアウト→黒保持→差し替え→フェードイン→台詞
            const t = typeof nowMs === "function"
              ? nowMs()
              : (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now());

            fade.startCutFade(t, {
              outMs: ev.fadeOutMs ?? 240,
              holdMs: ev.holdMs ?? 3000,
              inMs: ev.fadeInMs ?? 240,
              onBlack: () => {
                if (ev.partySkin === "t2") {
                  party.leader.img = sprites.p1_t2 || party.leader.img;
                  party.p2.img = sprites.p2_t2 || party.p2.img;
                  party.p3.img = sprites.p3_t2 || party.p3.img;
                  party.p4.img = sprites.p4_t2 || party.p4.img;
                }
              },
              onEnd: () => {
                // ★ここでも念のため choice を閉じる（残骸対策）
                if (typeof choice.close === "function") choice.close();
                dialog.open(ev.onYesDialog || [["……"]]);
              },
            });
          } else {
            // NO
            dialog.open(ev.onNoDialog || [["……"]]);
          }
        });
      }
    }

    // いったん前の登録が残ってたら消す（保険）
    if (typeof dialog.onPageChange === "function") dialog.onPageChange(null);

    // 登録
    if (typeof dialog.onPageChange === "function") dialog.onPageChange(onPageChange);

    // 質問文を2ページで表示
    dialog.open(pages, () => {
      // ダイアログが閉じたら後始末（保険）
      finished = true;
      if (typeof dialog.onPageChange === "function") dialog.onPageChange(null);
      if (typeof choice.close === "function") choice.close();
    });

    return true;
  }

  return false;
}