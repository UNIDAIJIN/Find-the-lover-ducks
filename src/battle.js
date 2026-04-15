// battle.js
import { drawBattleScreen } from "./battle_ui.js";
import { playCursor, playConfirm } from "./se.js";
import { SPRITES } from "./sprites.js";
import { STATE } from "./state.js";

export function createBattleSystem(cfg) {
  const {
    BASE_W,
    BASE_H,
    itemName,
    itemBgmSrc,
    itemThrowDmg,
    unlockBgm,
    setOverrideBgm,
    getFieldInventorySnapshot,
    onExitToField,
    onLoseExit,
    onRunExit,
  } = cfg;

  const DUCK_WIN_COUNT = 10;

  function duckLine(text, extra = {}) {
    return {
      lines: ["ミナミ「」"],
      typed: { prefix: "ミナミ「", text, suffix: "」", charMs: 60 },
      ...extra,
    };
  }

  const DUCK_REACTIONS = [
    null, // 0
    duckLine("なんだこれは！"),
    duckLine("このおとはなんなんだ！"),
    duckLine("こんなものいたくもかゆくもない！"),
    duckLine("うるさい！うるさい！"),
    duckLine("ぐぐぐ、クソガキども！"),
    duckLine("ちからがぬける・・・！"),
    duckLine("やめろ！それをこっちにむけるな！"),
    duckLine("おい！やめろ！"),
    duckLine("クソ！フハハ！オモシロイ！"),
    duckLine("フハハ！フハハハ！", { win: true }),
  ];

  const bossImg = SPRITES.minami;

  // =====================
  // SE (Sound Effects)
  // =====================
  const SE_PATH = "assets/audio/se/";
  function makeSe(name, vol = 0.6) {
    const a = new Audio(SE_PATH + name);
    a.volume = vol;
    a.preload = "auto";
    return a;
  }
  const se_hit    = makeSe("se_hit.mp3",    0.6);
  const se_chibi  = makeSe("se_chibi.mp3",  0.7);
  const se_koke   = makeSe("se_koke.mp3",   0.7);
  const se_doku   = makeSe("se_doku.mp3",   0.6);
  const se_encount = makeSe("se_encount.mp3", 0.9);

  function playSe(a) {
    try {
      a.currentTime = 0;
      a.play().catch(() => {});
    } catch (_e) {}
  }

  // YOU WIN ジングル（1〜4で切り替え）
  const JINGLE_PATTERN = 2;

  // LOSE ジングル（下降マイナー）
  let _loseJinglePlayed = false;
  function playLoseJingle() {
    if (_loseJinglePlayed) return;
    _loseJinglePlayed = true;
    try {
      if (!_jingleCtx) _jingleCtx = new (window.AudioContext || window.webkitAudioContext)();
      const ac = _jingleCtx;
      const now = ac.currentTime;

      function tone2(freq, start, dur, vol, type = "sine", attack = 0.03, release = 0.5) {
        const osc = ac.createOscillator();
        const g   = ac.createGain();
        osc.connect(g); g.connect(ac.destination);
        osc.type = type;
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, now + start);
        g.gain.linearRampToValueAtTime(vol, now + start + attack);
        g.gain.setValueAtTime(vol, now + start + dur - release);
        g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
      }
      function organ2(freq, start, dur, vol) {
        tone2(freq,       start, dur, vol,        "triangle", 0.03, 0.5);
        tone2(freq * 2,   start, dur, vol * 0.55, "sawtooth", 0.03, 0.5);
        tone2(freq * 3,   start, dur, vol * 0.30, "sawtooth", 0.03, 0.5);
        tone2(freq * 4,   start, dur, vol * 0.15, "sawtooth", 0.03, 0.5);
        tone2(freq * 0.5, start, dur, vol * 0.25, "triangle", 0.03, 0.5);
      }
      // 上から崩れ落ちるように積み上げ → Am
      const notes = [440.00, 329.63, 261.63, 220.00]; // A5→E4→C4→A3（上から下へ）
      const step = 0.28;
      const hold = 1.6;
      const vol  = 0.32;
      notes.forEach((f, i) => organ2(f, i * step, hold + (notes.length - i) * step, vol / notes.length));
    } catch (_e) {}
  }
  let _jingleCtx = null;
  function playYouWinJingle() {
    try {
      if (!_jingleCtx) _jingleCtx = new (window.AudioContext || window.webkitAudioContext)();
      const ac = _jingleCtx;
      const now = ac.currentTime;

      function tone(freq, start, dur, vol, type = "sine", attack = 0.01, release = 0.15) {
        const osc = ac.createOscillator();
        const g   = ac.createGain();
        osc.connect(g); g.connect(ac.destination);
        osc.type = type;
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, now + start);
        g.gain.linearRampToValueAtTime(vol, now + start + attack);
        g.gain.setValueAtTime(vol, now + start + dur - release);
        g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
      }

      // オルガン1音：基音(triangle)＋倍音(sawtooth)で輪郭を出す
      function organ(freq, start, dur, vol) {
        tone(freq,       start, dur, vol,        "triangle",  0.03, 0.5);
        tone(freq * 2,   start, dur, vol * 0.55, "sawtooth",  0.03, 0.5);
        tone(freq * 3,   start, dur, vol * 0.30, "sawtooth",  0.03, 0.5);
        tone(freq * 4,   start, dur, vol * 0.15, "sawtooth",  0.03, 0.5);
        tone(freq * 0.5, start, dur, vol * 0.25, "triangle",  0.03, 0.5);
      }
      function chord(notes, start, dur, vol) {
        notes.forEach(f => organ(f, start, dur, vol / notes.length));
      }

      // 音を1本ずつずらして入れ、最後に全部鳴り揃う
      // step: 各音の入るタイミング間隔, hold: 最後の音からの余韻
      function buildChord(notes, step, hold, vol) {
        const total = hold + notes.length * step;
        notes.forEach((f, i) => organ(f, i * step, total - i * step, vol / notes.length));
      }

      if (JINGLE_PATTERN === 1) {
        // ── パターン1: C major（下から積み上げ）
        buildChord([261.63, 329.63, 392.00, 523.25], 0.28, 1.6, 0.32);

      } else if (JINGLE_PATTERN === 2) {
        // ── パターン2: F major（下から積み上げ）
        buildChord([174.61, 261.63, 349.23, 523.25], 0.28, 1.6, 0.32);

      } else if (JINGLE_PATTERN === 3) {
        // ── パターン3: C major（上から積み下げ→神聖感）
        buildChord([523.25, 392.00, 329.63, 261.63], 0.28, 1.6, 0.32);

      } else if (JINGLE_PATTERN === 4) {
        // ── パターン4: Am（下から積み上げ→切なさ残る）
        buildChord([220.00, 261.63, 329.63, 440.00], 0.28, 1.6, 0.32);
      }
    } catch (_e) {}
  }

  // タイプライター用ビープ（低め）
  let _typeCtx = null;
  function playTypeBeep() {
    try {
      if (!_typeCtx) _typeCtx = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = _typeCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.value = 220;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    } catch (_e) {}
  }

  let st = null;

  const CMD = ["こうげき", "ガード", "もちもの", "にげる"];
  const ACTION_ORDER = ["RIKU", "NINO", "NATSUMI", "MAKI"];
  const DISPLAY_ORDER = ["RIKU", "NATSUMI", "NINO", "MAKI"];

  function roll(min, max) {
    return (min + ((Math.random() * (max - min + 1)) | 0)) | 0;
  }

  function makeParty() {
    const byName = new Map([
      [
        "RIKU",
        { name: "RIKU", hp: 160, maxHp: 160, lv: 10, res: 8, atkMin: 12, atkMax: 18, status: "DOKU" },
      ],
      [
        "NINO",
        { name: "NINO", hp: 130, maxHp: 130, lv: 10, res: 20, atkMin: 31, atkMax: 35, status: "BLIND" },
      ],
      [
        "NATSUMI",
        { name: "NATSUMI", hp: 100, maxHp: 100, lv: 10, res: 5, atkMin: 8, atkMax: 10, status: "CONRAN" },
      ],
      [
        "MAKI",
        { name: "MAKI", hp: 80, maxHp: 80, lv: 10, res: 0, atkMin: 1, atkMax: 7, status: "CHIBI" },
      ],
    ]);

    if (STATE.flags.mechaNatsumi) {
      const natsumi = byName.get("NATSUMI");
      if (natsumi) {
        natsumi.hp = 999;
        natsumi.maxHp = 999;
        natsumi.atkMin = 5000;
        natsumi.atkMax = 6000;
      }
    }

    return ACTION_ORDER.map((n) => ({
      ...byName.get(n),
      action: null,
      guarding: false,
    }));
  }

  function isAlive(c) {
    return (c.hp | 0) > 0;
  }

  function partyIndexByName(name) {
    if (!st) return -1;
    for (let i = 0; i < st.party.length; i++) if (st.party[i].name === name) return i;
    return -1;
  }

  function activeChar() {
    if (!st) return null;
    return st.party[st.activePartyIdx | 0] || null;
  }

  // =========================
  // Visual hooks (flash / uiKick)
  // =========================
  function setFlash(f) {
    if (!st) return;
    const now = st.now | 0;
    st.flashColor = String(f?.color ?? "#0f0");
    st.flashAlpha = Math.max(0, Math.min(1, Number(f?.alpha ?? 0.22)));
    st.flashUntil = Math.max(st.flashUntil | 0, now + ((f?.ms | 0) || 120));
  }

  function setUiKick(k) {
    if (!st) return;
    const now = st.now | 0;
    const ms = (k?.ms | 0) || 120;
    const mode = k?.mode === "tilt" ? "tilt" : "sidestep";

    st.uiKickMode = mode;
    st.uiKickUntil = Math.max(st.uiKickUntil | 0, now + ms);

    if (mode === "sidestep") {
      st.uiKickDx = (k?.dx | 0) || 10;
      st.uiKickAngle = 0;
    } else {
      st.uiKickDx = (k?.dx | 0) || 4;
      st.uiKickAngle = Number(k?.angle ?? 0.14);
    }
  }

  // =========================
  // Message queue (+apply +center)
  // =========================
  function queueMsg(lines, opt = {}) {
    if (!st) return;
    st.msgQueue.push({
      lines: (lines || []).slice(),
      onClose: typeof opt.onClose === "function" ? opt.onClose : null,
      autoMs: opt.autoMs ?? 0,
      noSkip: !!opt.noSkip,

      shake: opt.shake || null,
      apply: typeof opt.apply === "function" ? opt.apply : null,

      flash: opt.flash || null,
      uiKick: opt.uiKick || null,

      center: !!opt.center,
      centerStyle: opt.centerStyle || "phase",

      // タイプライター: { prefix, text, suffix, charMs }
      typed: opt.typed || null,
    });
    pumpMsg();
  }

  function queueEvent(opt = {}) {
    queueMsg([], opt);
  }

  function pumpMsg() {
    if (!st) return;
    if (st.msg) return;
    const next = st.msgQueue.shift();
    if (!next) return;

    st.msg = {
      lines: next.lines,
      onClose: next.onClose,
      autoMs: next.autoMs,
      noSkip: next.noSkip,

      shake: next.shake,
      apply: next.apply,
      flash: next.flash,
      uiKick: next.uiKick,

      center: next.center,
      centerStyle: next.centerStyle,

      typed: next.typed || null,
      typedCount: 0,
      typedDone: !next.typed,
    };
    st.msgSince = st.now | 0;

    if (st.msg.shake) setShake(st.msg.shake.mode, st.msg.shake.amp, st.msg.shake.ms);
    if (st.msg.flash) setFlash(st.msg.flash);
    if (st.msg.uiKick) setUiKick(st.msg.uiKick);
    if (st.msg.apply) st.msg.apply();
  }

  function closeMsg() {
    if (!st || !st.msg) return;
    const cb = st.msg.onClose;
    st.msg = null;
    st.msgSince = 0;
    if (cb) cb();
    pumpMsg();
  }

  function endToField(result = "lose") {
    st = null;
    if (typeof onExitToField === "function") onExitToField(result);
  }

  // =========================
  // START（★ここが “立ちはだかった” の本命）
  // =========================
  function start(inputOrKeys) {
    _loseJinglePlayed = false;
    const inv = getFieldInventorySnapshot ? getFieldInventorySnapshot() : [];

    const now0 = (
      typeof performance !== "undefined" && performance.now ? performance.now() : Date.now()
    ) | 0;

    st = {
      phase: "intro", // ★ まずintroにしておく（COMMAND PHASEに潰されない）
      cmds: CMD.slice(),
      boss: { name: "VJボスのミナミ", hp: 50000, maxHp: 50000 },
      party: makeParty(),

      activeDispIdx: 0,
      activePartyIdx: 0,
      menuIdx: 0,

      invItems: inv.slice(),
      invCursor: 0,
      ducksThrown: 0,

      queue: [],

      msg: null,
      msgQueue: [],
      msgSince: 0,

      now: now0,

      shakeUntil: 0,
      shakeAmp: 0,
      shakeMode: "boss",

      flashUntil: 0,
      flashColor: "#0f0",
      flashAlpha: 0.22,

      bossFlashUntil: 0,
      bossFadeFrom: 0,
      bossFadeDur: 0,
      logFadeFrom: 0,
      logFadeDur: 0,
      showYouWin: false,
      uboaQueued: false,
      bossFrozen: false,

      uiKickUntil: 0,
      uiKickMode: "none",
      uiKickDx: 0,
      uiKickAngle: 0,

      uiTheme: "normal",

      autoResolve: false,
      autoStepAt: 0,

      // ★ UIで参照するなら必ず持たせる（未定義事故を潰す）
      commandPhaseSince: now0,

      // エンカウント演出
      encFlashFrom: now0,
      encFlashMs:   600,
    };

    // 入力を掃除
    if (inputOrKeys && typeof inputOrKeys.clear === "function") inputOrKeys.clear();
    if (inputOrKeys instanceof Set) inputOrKeys.clear();

    // SE
    playSe(se_encount);

    // ★ ここで戦闘開始文（フラッシュ後に表示）
    queueMsg([`ブイジェイのボス ミナミが たちはだかった！`], {
      autoMs: 2000,
      center: false,
      onClose: () => {
        if (!st) return;
        st.phase = "choose";
        st.commandPhaseSince = st.now | 0;
        seekNextChooserDisplay(0);
      },
    });
  }

  function allChosenOrDead() {
    if (!st) return false;
    return st.party.every((c) => !isAlive(c) || !!c.action);
  }

  function seekNextChooserDisplay(fromDispIdx) {
    if (!st) return;

    for (let k = 0; k < DISPLAY_ORDER.length; k++) {
      const di = (fromDispIdx + k) % DISPLAY_ORDER.length;
      const name = DISPLAY_ORDER[di];
      const pi = partyIndexByName(name);
      if (pi < 0) continue;
      const c = st.party[pi];
      if (isAlive(c) && !c.action) {
        st.activeDispIdx = di;
        st.activePartyIdx = pi;
        st.menuIdx = 0;
        return;
      }
    }

    requestBeginResolve(true);
  }

  // -------------------------
  // Resolve enter with banner
  // -------------------------
  function requestBeginResolve(auto = true) {
    if (!st) return;
    if (st.phase === "resolve") return;

    st.phase = "pre_resolve";
    st.autoResolve = false;
    st.autoStepAt = 0;

    queueMsg(["BATTLE PHASE"], {
      autoMs: 520,
      center: true,
      centerStyle: "phase",
      onClose: () => {
        beginResolveNow(auto);
      },
    });
  }

  function beginResolveNow(auto = true) {
    if (!st) return;

    st.phase = "resolve";
    st.autoResolve = !!auto;
    st.autoStepAt = (st.now | 0) + 180;

    for (const c of st.party) c.guarding = false;

    const q = [];
    for (let i = 0; i < st.party.length; i++) {
      const c = st.party[i];
      if (!isAlive(c)) continue;
      if (!c.action) continue;
      q.push({ kind: "ally", idx: i, action: c.action });
    }
    q.push({ kind: "boss" });
    st.queue = q;
  }

  function finishTurnBackToChoose() {
    if (!st) return;
    for (const c of st.party) c.action = null;
    st.phase = "choose";
    st.commandPhaseSince = st.now | 0; // ★ “再表示開始”をここで更新
    st.menuIdx = 0;
    st.autoResolve = false;
    st.autoStepAt = 0;
    seekNextChooserDisplay(0);
  }

  function setShake(mode, amp, ms) {
    if (!st) return;
    const now = st.now | 0;
    st.shakeMode = mode === "ui" ? "ui" : "boss";
    st.shakeAmp = Math.max(0, amp | 0);
    st.shakeUntil = Math.max(st.shakeUntil | 0, now + (ms | 0));
  }

  function applyGuardedDamage(baseDam, target, isGuarding) {
    const afterRes = Math.max(0, (baseDam | 0) - (target.res | 0));
    if (!isGuarding) return afterRes | 0;
    return (afterRes / 2) | 0;
  }

  function makiEvadeMaybe(target) {
    if (!target || target.name !== "MAKI") return false;
    return Math.random() < 0.3;
  }

  // ★ DEAD反映：HPを0にするapplyの瞬間に status を DEAD にする
  function applyHpAndMaybeDead(target, nextHp) {
    target.hp = nextHp | 0;
    if ((target.hp | 0) <= 0) target.status = "DEAD";
  }

  function enqueueDeathIfNeededBy(prevHp, nextHp, name, targetRef) {
    if (!st) return;
    if ((prevHp | 0) > 0 && (nextHp | 0) <= 0) {
      queueMsg([`${name}が しんじゃった！`], { autoMs: 550 });
    }
  }

  // -------------------------
  // Status behaviors
  // -------------------------
  // ① リク毒：リクの行動後のみ
  function enqueueRikuPoisonAfterRikuAction() {
    if (!st) return;
    const pi = partyIndexByName("RIKU");
    if (pi < 0) return;
    const r = st.party[pi];
    if (!r || !isAlive(r)) return;

    const prev = r.hp | 0;
    const dam = 10;
    const nextHp = Math.max(0, prev - dam);

    // 仕様：攻撃後に「即」毒ダメージ＋揺れ → 毒メッセージ
    queueEvent({
      autoMs: 90,
      shake: { mode: "ui", amp: 4, ms: 200 },
      flash: { color: "#0f0", alpha: 0.22, ms: 120 },
      apply: () => {
        playSe(se_doku);
        applyHpAndMaybeDead(r, nextHp);
      },
    });

    queueMsg([`RIKU はどくで10ダメージをうけた！`], { autoMs: 550 });

    enqueueDeathIfNeededBy(prev, nextHp, r.name, r);
  }

  function tryNatsumiConfusionMisattack(attacker) {
    if (!st) return false;
    if (!attacker || attacker.name !== "NATSUMI") return false;
    if (Math.random() >= 0.3) return false;

    const candidates = st.party.filter((x) => isAlive(x) && x.name !== "NATSUMI");
    const target = candidates.length ? candidates[(Math.random() * candidates.length) | 0] : attacker;

    const prev = target.hp | 0;
    const dam = 20;
    const nextHp = Math.max(0, prev - dam);

    queueMsg([`NATSUMIは まちがえて${target.name}を こうげきした！`], { autoMs: 650 });

    queueMsg([`${target.name}に${dam}のダメージ！`], {
      autoMs: 550,
      shake: { mode: "ui", amp: 4, ms: 200 },
      apply: () => {
        playSe(se_hit);
        applyHpAndMaybeDead(target, nextHp);
      },
    });

    enqueueDeathIfNeededBy(prev, nextHp, target.name, target);
    return true;
  }

  function ninoDarkMissMaybe() {
    return Math.random() < 0.3;
  }

  // =================
  // Enemy actions
  // =================
  function bossAct() {
    if (st.bossFrozen) {
      st.bossFrozen = false;
      queueMsg([`ミナミはこおっていて動けなかった！`], { autoMs: 900 });
      return;
    }

    const aoe = Math.random() < 0.2;

    if (aoe) {
      queueMsg([`${st.boss.name}は おおあばれした！`], { autoMs: 550 });

      for (const name of DISPLAY_ORDER) {
        const pi = partyIndexByName(name);
        if (pi < 0) continue;
        const c = st.party[pi];
        if (!isAlive(c)) continue;

        if (makiEvadeMaybe(c)) {
          queueMsg([`${c.name}は 小さくて攻撃が当たらなかった！`], {
            autoMs: 550,
            uiKick: { mode: "sidestep", ms: 120, dx: 10 },
            apply: () => {
              playSe(se_chibi);
            },
          });
          continue;
        }

        const base = roll(50, 60);
        const prev = c.hp | 0;
        const dam = applyGuardedDamage(base, c, !!c.guarding);
        const nextHp = Math.max(0, prev - dam);

        queueEvent({
          autoMs: 140,
          shake: { mode: "ui", amp: 4, ms: 200 },
          apply: () => {
            playSe(se_hit);
            applyHpAndMaybeDead(c, nextHp);
          },
        });

        queueMsg([`${c.name}に${dam}のダメージ！`], { autoMs: 550 });

        enqueueDeathIfNeededBy(prev, nextHp, c.name, c);
      }
      return;
    }

    const alive = st.party.filter((c) => isAlive(c));
    if (!alive.length) return;

    const t = alive[(Math.random() * alive.length) | 0];

    if (makiEvadeMaybe(t)) {
      queueMsg([`${st.boss.name}は ${t.name}を どついた！`], { autoMs: 550 });
      queueMsg([`${t.name}は 小さくて攻撃が当たらなかった！`], {
        autoMs: 550,
        uiKick: { mode: "sidestep", ms: 120, dx: 10 },
        apply: () => {
          playSe(se_chibi);
        },
      });
      return;
    }

    const base = roll(70, 90);
    const prev = t.hp | 0;
    const dam = applyGuardedDamage(base, t, !!t.guarding);
    const nextHp = Math.max(0, prev - dam);

    queueMsg([`${st.boss.name}は ${t.name}を どついた！`], { autoMs: 550 });

    queueEvent({
      autoMs: 140,
      shake: { mode: "ui", amp: 5, ms: 220 },
      apply: () => {
        playSe(se_hit);
        applyHpAndMaybeDead(t, nextHp);
      },
    });

    queueMsg([`${t.name}に${dam}のダメージ！`], { autoMs: 550 });

    enqueueDeathIfNeededBy(prev, nextHp, t.name, t);
  }

  // =================
  // Ally actions
  // =================
  function allyAttackFlavor(name) {
    const bossName = st?.boss?.name ?? "VJボスのミナミ";
    if (name === "RIKU") return `うわっ！RIKUは${bossName}をおもいっきりけ\nっちゃった！`;
    if (name === "NATSUMI") return `あぁっ！NATSUMIは${bossName}をぼくとうでな\nぐっちゃった！`;
    if (name === "NINO") return `げげっ！NINOは${bossName}にみがきあげたス\nトレートをうちこんじゃった！`;
    if (name === "MAKI") return `えぇっ！MAKIは${bossName}のあしにかみつい\nちゃった！`;
    return `${name}の こうげき。`;
  }

  function allyAct(step) {
    const c = st.party[step.idx];
    if (!c || !isAlive(c) || !c.action) return;

    const a = c.action;

    if (a.type === "guard") {
      c.guarding = true;
      queueMsg([`${c.name}は ガードした。`], { autoMs: 550 });

      if (c.name === "RIKU") enqueueRikuPoisonAfterRikuAction();
      return;
    }

    if (a.type === "run") {
      queueMsg([`${c.name}たちはにげだした！`], {
        autoMs: 1200,
        noSkip: true,
        onClose: () => {
          if (typeof onRunExit === "function") {
            onRunExit(() => { st = null; });
          } else {
            endToField();
          }
        },
      });
      return;
    }

    if (a.type === "item") {
      const id = a.itemId;
      const dmg = (typeof itemThrowDmg === "function" ? itemThrowDmg(id) : 0) | 0;
      const isRubberDuck = String(id).startsWith("rubber_duck");

      queueMsg([`${c.name}は ${itemName(id)}を なげつけた！`], { autoMs: 550 });

      const prevBoss = st.boss.hp | 0;
      const nextBossHp = Math.max(0, prevBoss - dmg);

      queueEvent({
        autoMs: 120,
        shake: { mode: "boss", amp: 3, ms: 180 },
        apply: () => {
          playSe(se_hit);
          st.boss.hp = nextBossHp;
          if (isRubberDuck) st.ducksThrown = (st.ducksThrown | 0) + 1;
        },
      });

      if (dmg > 0) queueMsg([`ミナミに${dmg}のダメージ！`], { autoMs: 550 });

      if (id === "ice_cream") {
        queueMsg([`ミナミはこおりついた！`], {
          autoMs: 800,
          apply: () => { st.bossFrozen = true; },
        });
      }

      if (isRubberDuck) {
        const src = typeof itemBgmSrc === "function" ? itemBgmSrc(id) : null;
        queueMsg([`ラバーダックからおんがくがながれた！`], {
          autoMs: 0,
          apply: () => { if (src) { unlockBgm(); setOverrideBgm(src); } },
        });
      }

      // ボスリアクション
      if (isRubberDuck) {
        queueEvent({
          autoMs: 1,
          apply: () => {
            const reaction = DUCK_REACTIONS[st.ducksThrown | 0];
            if (!reaction) return;
            if (reaction.win) {
              queueUboaFinale();
            } else {
              queueMsg(reaction.lines, { autoMs: 2000, noSkip: true, typed: reaction.typed || null });
            }
          },
        });
      }

      if (c.name === "RIKU") enqueueRikuPoisonAfterRikuAction();
      return;
    }

    if (a.type === "attack") {
      if (tryNatsumiConfusionMisattack(c)) {
        if (c.name === "RIKU") enqueueRikuPoisonAfterRikuAction();
        return;
      }

      queueMsg([allyAttackFlavor(c.name)], { autoMs: 650 });

      if (c.name === "NINO" && ninoDarkMissMaybe()) {
        queueMsg([`からぶりーーーー！！`], {
          autoMs: 650,
          uiKick: { mode: "tilt", ms: 140, dx: 4, angle: 0.14 },
          apply: () => {
            playSe(se_koke);
          },
        });

        if (c.name === "RIKU") enqueueRikuPoisonAfterRikuAction();
        return;
      }

      const prevBoss = st.boss.hp | 0;
      const dmg = roll(c.atkMin, c.atkMax);
      const nextBossHp = Math.max(0, prevBoss - dmg);

      queueEvent({
        autoMs: 120,
        shake: { mode: "boss", amp: 4, ms: 200 },
        apply: () => {
          playSe(se_hit);
          st.boss.hp = nextBossHp;
        },
      });

      queueMsg([`ミナミに${dmg}のダメージ！`], { autoMs: 550 });

      if (c.name === "RIKU") enqueueRikuPoisonAfterRikuAction();
      return;
    }
  }

  function queueUboaFinale() {
    if (st.uboaQueued) return;
    st.uboaQueued = true;
    queueMsg(["ミナミ「」"], { autoMs: 2000, noSkip: true, typed: { prefix: "ミナミ「", text: "フハハ！フハハハ！", suffix: "」", charMs: 60 } });
    queueMsg(["ミナミ「」"], { autoMs: 1500, noSkip: true, typed: { prefix: "ミナミ「", text: "フハ・・・・、", suffix: "」", charMs: 60 } });
    const EFFECT_MS = 3000;
    queueMsg(["ミナミ「」"], {
      autoMs: EFFECT_MS,
      noSkip: true,
      typed: { prefix: "ミナミ「", text: "ウボァーーーーー！！", suffix: "」", charMs: 60 },
      apply: () => {
        st.bossFlashUntil = (st.now | 0) + EFFECT_MS;
        st.bossFadeFrom   = st.now | 0;
        st.bossFadeDur    = EFFECT_MS;
        st.logFadeFrom    = st.now | 0;
        st.logFadeDur     = EFFECT_MS;
      },
    });
    queueEvent({
      autoMs: 3000,
      apply:   () => { st.showYouWin = true; setOverrideBgm("about:blank"); playYouWinJingle(); },
      onClose: () => endToField("win"),
    });
  }

  function resolveOneStep() {
    if (!st) return;
    if (st.msg) return;

    if (st.msgQueue.length) {
      pumpMsg();
      return;
    }

    if ((st.boss.hp | 0) <= 0) {
      queueUboaFinale();
      return;
    }

    if ((st.ducksThrown | 0) >= DUCK_WIN_COUNT) {
      // 特殊勝利は item アクション内で既にキューに積まれる。ここでは二重発火を防ぐだけ。
      return;
    }

    if (st.party.every((c) => !isAlive(c))) {
      st.uiTheme = "red";
      queueMsg(["ぜんめつした。"], { autoMs: 3500, apply: () => { setOverrideBgm("about:blank"); playLoseJingle(); }, onClose: () => {
        if (typeof onLoseExit === "function") {
          onLoseExit(() => { st = null; });
        } else {
          endToField();
        }
      } });
      return;
    }

    const step = st.queue.shift();
    if (!step) {
      finishTurnBackToChoose();
      return;
    }

    if (step.kind === "ally") return allyAct(step);
    if (step.kind === "boss") return bossAct();
  }

  function update(input, t) {
    if (!st) return;
    st.now = t | 0;

    // タイプライター進行
    if (st.msg && st.msg.typed && !st.msg.typedDone) {
      const elapsed = (st.now | 0) - (st.msgSince | 0);
      const count = Math.floor(elapsed / (st.msg.typed.charMs || 60));
      const prev = st.msg.typedCount | 0;
      st.msg.typedCount = Math.min(count, st.msg.typed.text.length);
      if (st.msg.typedCount > prev) playTypeBeep();
      if (st.msg.typedCount >= st.msg.typed.text.length) st.msg.typedDone = true;
    }

    if (st.msg && (st.msg.autoMs | 0) > 0) {
      if (((st.now | 0) - (st.msgSince | 0)) >= (st.msg.autoMs | 0)) closeMsg();
    }
    if (!st) return; // closeMsg が endToField を呼んで st を null にした場合

    // intro / pre_resolve はメッセージ駆動なので入力無しでOK
    if (st.phase === "intro" || st.phase === "pre_resolve") return;

    if (st.phase === "resolve") {
      if (!st.msg && !st.msgQueue.length && st.autoResolve) {
        if ((st.now | 0) >= (st.autoStepAt | 0)) {
          resolveOneStep();
          st.autoStepAt = (st.now | 0) + 120;
        }
      }
      return;
    }

    if (st.msg) return;

    if (input.consume("ArrowUp")) {
      if (st.phase === "items") invMove(-1);
      else st.menuIdx = (st.menuIdx + st.cmds.length - 1) % st.cmds.length;
      playCursor();
    }
    if (input.consume("ArrowDown")) {
      if (st.phase === "items") invMove(+1);
      else st.menuIdx = (st.menuIdx + 1) % st.cmds.length;
      playCursor();
    }
  }

  function confirm(input) {
    if (!st) return;

    if (st.msg) {
      if (st.msg.noSkip) return; // Z 無効
      closeMsg();
      return;
    }

    if (st.phase === "intro" || st.phase === "pre_resolve") return;

    if (st.phase === "resolve") {
      resolveOneStep();
      return;
    }

    const c = activeChar();
    if (!c || !isAlive(c)) {
      seekNextChooserDisplay((st.activeDispIdx + 1) % DISPLAY_ORDER.length);
      if (input) input.clear();
      return;
    }

    if (st.phase === "items") {
      const id = st.invItems[st.invCursor | 0];
      if (!id) return;

      playConfirm();
      st.invItems.splice(st.invCursor | 0, 1);
      if (st.invCursor >= st.invItems.length) st.invCursor = Math.max(0, st.invItems.length - 1);

      c.action = { type: "item", itemId: id };
      st.phase = "choose";
      st.invAnimOpen = false;
      st.invAnimSince = st.now | 0;

      if (allChosenOrDead()) requestBeginResolve(true);
      else seekNextChooserDisplay((st.activeDispIdx + 1) % DISPLAY_ORDER.length);

      if (input) input.clear();
      return;
    }

    const cmd = st.cmds[st.menuIdx];

    playConfirm();

    if (cmd === "こうげき") {
      c.action = { type: "attack" };
      if (allChosenOrDead()) requestBeginResolve(true);
      else seekNextChooserDisplay((st.activeDispIdx + 1) % DISPLAY_ORDER.length);
      if (input) input.clear();
      return;
    }

    if (cmd === "ガード") {
      c.action = { type: "guard" };
      if (allChosenOrDead()) requestBeginResolve(true);
      else seekNextChooserDisplay((st.activeDispIdx + 1) % DISPLAY_ORDER.length);
      if (input) input.clear();
      return;
    }

    if (cmd === "もちもの") {
      st.phase = "items";
      st.invAnimOpen = true;
      st.invAnimSince = st.now | 0;
      st.invCursor = Math.max(0, Math.min(st.invCursor | 0, st.invItems.length - 1));
      if (input) input.clear();
      return;
    }

    if (cmd === "にげる") {
      c.action = { type: "run" };
      requestBeginResolve(true);
      if (input) input.clear();
      return;
    }
  }

  function cancel(input) {
    if (!st) return;
    if (st.msg) return;
    if (st.phase === "intro" || st.phase === "pre_resolve") return;

    if (st.phase === "items") {
      playCursor();
      st.phase = "choose";
      st.invAnimOpen = false;
      st.invAnimSince = st.now | 0;
      st.commandPhaseSince = st.now | 0;
      if (input) input.clear();
      return;
    }
  }

  function invMove(dy) {
    const n = st.invItems.length | 0;
    if (n <= 0) return;
    st.invCursor = Math.max(0, Math.min(n - 1, (st.invCursor | 0) + dy));
  }

  function draw(ctx) {
    if (!st) return;
    drawBattleScreen(ctx, st, {
      BASE_W,
      BASE_H,
      bossImg,
      bossFrameW: 16,
      bossFrameH: 16,
      bossScale: 4.55,
      DISPLAY_ORDER,
      ACTION_ORDER,
      itemName,

      uiTheme: st.uiTheme || "normal",

      flashUntil: st.flashUntil,
      flashColor: st.flashColor,
      flashAlpha: st.flashAlpha,

      bossFlashUntil: st.bossFlashUntil,
      bossFadeFrom:   st.bossFadeFrom,
      bossFadeDur:    st.bossFadeDur,
      logFadeFrom:    st.logFadeFrom,
      logFadeDur:     st.logFadeDur,
      showYouWin:     st.showYouWin,

      uiKickUntil: st.uiKickUntil,
      uiKickMode: st.uiKickMode,
      uiKickDx: st.uiKickDx,
      uiKickAngle: st.uiKickAngle,

      now: st.now,
      msgSince: st.msgSince,

      commandPhaseSince: st.commandPhaseSince | 0,
    });
  }

  return {
    isActive: () => !!st,
    start,
    update,
    confirm,
    cancel,
    draw,
  };
}
