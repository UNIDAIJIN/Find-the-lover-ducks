import { playGlassShatter, stopHeartbeat } from "./se.js";
import { controlPrompt } from "./control_prompts.js";

export const PHONE_BRAWL_W = 384;
export const PHONE_BRAWL_H = 360;
const GAME_DIALOG_BASE_W = 192;
const GAME_DIALOG_BASE_H = 180;
const GAME_DIALOG_SCALE = PHONE_BRAWL_W / GAME_DIALOG_BASE_W;

const TOP_H = 24;
const FIELD_Y = 24;
const FIELD_H = 238;
const HAND_Y = 280;
const HAND_H = 74;
const HAND_CARD_W = 70;
const HAND_CENTER_X = PHONE_BRAWL_W / 2 + 8;
const HAND_SPACING = 72;
const ENERGY_Y = 266;
const MID_X = 192;
const BASE_Y = 143;
const PLAYER_BASE_X = 42;
const ENEMY_BASE_X = 332;
const PLAYER_DEPLOY_MIN_X = 62;
const PLAYER_DEPLOY_X = 98;
const PLAYER_DEPLOY_MAX_X = 158;
const ENEMY_DEPLOY_MIN_X = 226;
const ENEMY_DEPLOY_MAX_X = 322;
const PLAYER_DEPLOY_MIN_Y = 54;
const PLAYER_DEPLOY_Y = BASE_Y;
const PLAYER_DEPLOY_MAX_Y = 236;
const ENEMY_DEPLOY_MIN_Y = 54;
const ENEMY_DEPLOY_MAX_Y = 236;
const FIELD_MIN_X = 24;
const FIELD_MAX_X = 360;
const FIELD_MIN_Y = 42;
const FIELD_MAX_Y = 246;
const HAND_SIZE = 5;
const MAX_ENERGY = 10;
const BASE_MAX_HP = 1000;
const DEBUG_START_PLAYER_HP = 0;
const DEBUG_START_ENEMY_HP = 0;
const BASE_HP_SEGMENTS = 4;
const BASE_SEGMENT_HP = BASE_MAX_HP / BASE_HP_SEGMENTS;
const BASE_SEGMENT_DAMAGE = 82;
const BASE_SEGMENT_KNOCKBACK = 92;
const BASE_SEGMENT_KNOCK_DURATION = 1.05;
const BASE_SEGMENT_KNOCK_HEIGHT = 54;
const UNIT_DEATH_EXIT_DURATION = 1.18;
const FINISHER_DURATION = 3.4;
const PLAYER_MOVE_SPEED = 95;
const UNIT_SPEED_SCALE = 0.68;
const TARGET_REFRESH_BASE = 0.16;
const TARGET_REFRESH_JITTER = 0.08;
const TARGET_SEARCH_RADIUS = 148;
const TARGET_SEARCH_MAX_RADIUS = 220;
const TARGET_SEARCH_LANE_Y = 42;
const PLAYER_ENERGY_RATE = 0.66;
const ENEMY_ENERGY_RATE = 0.58;
const CURRY_SETUP_DELAY = 0.68;
const NIDHOGG_FLAME_DURATION = 0.78;
const NIDHOGG_FLAME_TICK = 0.13;
const NIDHOGG_FLAME_OFFSET_X = 11;
const NIDHOGG_FLAME_OFFSET_Y = 8;
const BOSS_LOW_SPIN_RATE = -2.2;
const BOSS_MID_SPIN_RATE = 2.8;
const BOOST_LIGHT_UNIT_THRESHOLD = 28;
const BOOST_TEXT_UNIT_LIMIT = 14;
const PEPPER_VISUAL_LIMIT = 18;
const SPACE_STARS = makeSpaceStars();

const CARDS = [
  { id: "runner", behavior: "runner", name: "MSITP", spriteNo: 1, cost: 4, hp: 82, damage: 14, speed: 29, range: 15, cooldown: 0.88, radius: 7, color: "#ff5ad6", label: "×4 FEVER!", count: 4, formation: "line", attackFx: "melee", summonText: "いっけー！！！", summonTextColor: "rainbow", summonBuff: { type: "speed", factor: 1.28, duration: 5.6 } },
  { id: "guard", behavior: "nidhogg", name: "NIDHOGG", spriteNo: 4, cost: 4, hp: 330, damage: 24, speed: 13, range: 58, cooldown: 1.05, radius: 12, color: "#9b63ff", label: "TANK AoE", armor: 0.72, summonText: "（ ｉ _ ｉ ）", summonTextColor: "#b890ff" },
  { id: "bruiser", behavior: "bruiser", name: "LUCHADOR", spriteNo: 3, cost: 4, hp: 220, damage: 32, speed: 24, range: 18, cooldown: 0.78, radius: 9, color: "#ef3e45", label: "ATK UP", attackFx: "melee", summonText: "ジッゴクゥー！", summonTextColor: "#ef3e45", summonBuff: { type: "attack", factor: 1.32, duration: 4.4 } },
  { id: "blaster", behavior: "tower", name: "ANGLER", spriteNo: 2, cost: 4, hp: 255, damage: 30, speed: 0, range: 82, cooldown: 0.46, radius: 9, color: "#ff9a3d", label: "TOWER", summonText: "イェーイ！楽しんでるぅ？", summonTextColor: "#ff9a3d", spriteFlip: true },
  { id: "sniper", behavior: "ranged", name: "GENERIC N2", spriteNo: 5, cost: 4, hp: 125, damage: 24, speed: 17, range: 70, cooldown: 1.18, radius: 8, color: "#5e8cff", label: "BEAM", deathExplosion: { damage: 18, radius: 24, knockback: 26 }, allowDuplicate: true, summonText: "ピピピ、ホッケ発見。", summonTextColor: "#5e8cff" },
  { id: "medic", behavior: "medic", name: "LEE", spriteNo: 8, cost: 3, hp: 125, damage: -26, speed: 24, range: 56, cooldown: 1.02, radius: 8, color: "#f1c84b", rangeColor: "#4fd18b", label: "GYOZA HEAL", summonText: "イーガーコーテル！", summonTextColor: "#f1c84b" },
  { id: "swarm", behavior: "swarm", name: "CHINANAGO", spriteNo: 7, cost: 3, hp: 72, damage: 13, speed: 39, range: 15, cooldown: 0.55, radius: 6, color: "#9be7ff", label: "×3", count: 3, spriteFlip: true, attackFx: "melee", summonText: "ニョロニョロですね。" },
  { id: "frost", behavior: "cactusCrew", name: "CACTUS CREW", spriteNo: 6, cost: 4, hp: 150, damage: 19, speed: 20, range: 18, cooldown: 0.92, radius: 8, color: "#55c768", label: "×4", count: 4, formation: "crew", summonText: "いくぜ！アミーゴ！", summonTextColor: "#55c768" },
  { id: "spark", behavior: "spark", name: "AFLO CLUB", spriteNo: 9, cost: 5, hp: 46, damage: 24, speed: 43, range: 16, cooldown: 0.12, radius: 6, color: "#4ecbe2", explosionColor: "#1f2329", label: "×6 BOM", count: 6, suicide: true, splash: 36, splashKnockback: 42, spriteFlip: true, formation: "cluster", summonText: "アフロクラブ、サイコー！" },
  { id: "mechanic", behavior: "yahhy", name: "YAHHY", spriteNo: 10, cost: 3, hp: 165, damage: 22, speed: 25, range: 17, cooldown: 0.84, radius: 8, color: "#9c6a3a", label: "CURRY", attackFx: "melee", curry: { radius: 34, duration: 14.4, damage: 8, slow: 0.58 }, summonText: "あちちちち！", summonTextColor: "#9c6a3a" },
];

const MSITP_SOLO_CARD_IDS = ["natsumi", "maki", "nino", "riku"];
const MSITP_SOLO_CARDS = [
  { id: "natsumi", name: "NATSUMI", spriteIndex: 0, color: "#f44", summonText: "いくぞ！" },
  { id: "maki", name: "MAKI", spriteIndex: 1, color: "#c4f", summonText: "いくぞ！" },
  { id: "nino", name: "NINO", spriteIndex: 2, color: "#4af", summonText: "いくぞ！" },
  { id: "riku", name: "RIKU", spriteIndex: 3, color: "#4c4", summonText: "いくぞ！" },
].map((card) => ({
  behavior: "runner",
  spriteNo: 1,
  spriteCardId: "runner",
  cost: 2,
  hp: 82,
  damage: 14,
  speed: 29,
  range: 15,
  cooldown: 0.88,
  radius: 7,
  label: "FEVER",
  attackFx: "melee",
  msitpSolo: true,
  summonTextColor: card.color,
  ...card,
}));

const PLAYER_CARDS = [...CARDS, ...MSITP_SOLO_CARDS];
const CARD_BY_ID = Object.fromEntries(PLAYER_CARDS.map((card) => [card.id, card]));
const PLAYER_DECK_PRESETS = {
  n2_msitp: ["sniper", "sniper", "sniper", ...MSITP_SOLO_CARD_IDS],
  lastbattle2: CARDS.map((card) => card.id),
};

const ENEMY_CARDS = [
  { id: "runner", behavior: "runner", name: "FLY", spriteNo: 1, cost: 3, hp: 70, damage: 13, speed: 43, range: 15, cooldown: 0.58, radius: 6, color: "#d6d0c2", label: "×5 AIR", count: 5, formation: "line", attackFx: "melee", meleeImmune: true, noEnemyFlip: true },
  { id: "guard", behavior: "nidhogg", name: "GRD", spriteNo: 2, cost: 4, hp: 260, damage: 24, speed: 13, range: 58, cooldown: 1.05, radius: 12, color: "#ef3e45", label: "TANK AoE", armor: 0.72, noEnemyFlip: true },
  { id: "bruiser", behavior: "bruiser", name: "BRU", spriteNo: 3, cost: 4, hp: 290, damage: 34, speed: 22, range: 18, cooldown: 0.9, radius: 10, color: "#ff8d4f", label: "HEAVY", attackFx: "melee", noEnemyFlip: true },
  { id: "blaster", behavior: "tower", name: "BLT", spriteNo: 4, cost: 4, hp: 180, damage: 28, speed: 0, range: 82, cooldown: 0.72, radius: 9, color: "#ffe45c", label: "TOWER", noEnemyFlip: true },
  { id: "swarm", behavior: "swarm", name: "SWM", spriteNo: 7, cost: 3, hp: 72, damage: 13, speed: 39, range: 15, cooldown: 0.55, radius: 6, color: "#9be7ff", label: "x3", count: 3, attackFx: "melee", noEnemyFlip: true },
];

export function createPhoneBrawl({
  inputTarget = globalThis,
  input = null,
  onEnd = null,
  sprites = {},
  bgmSrc = null,
  gameOverAction = "restart",
  endTiming = "result",
  playerDeckIds = null,
  giveUpAction = "gameOver",
  mobile = false,
} = {}) {
  const state = {
    active: false,
    gameOver: false,
    elapsed: 0,
    playerHp: BASE_MAX_HP,
    enemyHp: BASE_MAX_HP,
    energy: 5,
    enemyEnergy: 4,
    playerX: PLAYER_DEPLOY_X,
    playerY: PLAYER_DEPLOY_Y,
    selectedHandIndex: 0,
    playerHand: [],
    enemyHand: [],
    units: [],
    cardFlights: [],
    pepperThrows: [],
    handEntries: [],
    particles: [],
    floating: [],
    hazards: [],
    nidhoggFlames: [],
    effectPops: [],
    baseBreaks: [],
    handCyclePressTimer: 0,
    lightBoostVisuals: false,
    bossSpin: 0,
    speedFever: { team: null, timer: 0, duration: 0 },
    msitpSoloFeverReady: true,
    feverSfxTimer: 0,
    feverSfxStep: 0,
    pendingEffects: [],
    aiDelay: 1.85,
    shake: 0,
    result: null,
    resultText: "",
    finisher: null,
    victoryCelebration: null,
    defeatChoice: null,
    gameOverFall: null,
    keys: { left: false, right: false, up: false, down: false },
  };

  let audio = null;
  let mediaBgm = null;
  let lastHitSoundAt = 0;
  let endedOnce = false;
  let activePlayerDeckIds = playerDeckIds;
  let activeGiveUpAction = giveUpAction;
  let activeInternalBgm = true;
  let activeEnemyInvincible = false;

  function start(cb = onEnd, options = {}) {
    onEnd = cb || onEnd;
    activePlayerDeckIds = options.playerDeckIds || playerDeckIds;
    activeGiveUpAction = options.giveUpAction || giveUpAction;
    activeInternalBgm = options.internalBgm !== false;
    activeEnemyInvincible = !!options.enemyInvincible;
    endedOnce = false;
    state.active = true;
    reset();
    stopBgm();
    ensureAudio();
    if (options.startAtGameOver === "intervention") {
      startGameOverFall({ intervention: true, result: "giveup" });
    }
  }

  function close() {
    state.active = false;
    state.keys.left = false;
    state.keys.right = false;
    state.keys.up = false;
    state.keys.down = false;
    stopBgm();
  }

  function reset() {
    state.gameOver = false;
    state.elapsed = 0;
    state.playerHp = DEBUG_START_PLAYER_HP || BASE_MAX_HP;
    state.enemyHp = DEBUG_START_ENEMY_HP || BASE_MAX_HP;
    state.energy = 5;
    state.enemyEnergy = 4;
    state.playerX = PLAYER_DEPLOY_X;
    state.playerY = PLAYER_DEPLOY_Y;
    state.selectedHandIndex = 0;
    state.playerHand = makeOpeningHand("player");
    state.enemyHand = makeOpeningHand("enemy");
    state.units = [];
    state.cardFlights = [];
    state.pepperThrows = [];
    state.handEntries = [];
    state.particles = [];
    state.floating = [];
    state.hazards = [];
    state.nidhoggFlames = [];
    state.effectPops = [];
    state.baseBreaks = [];
    state.bossSpin = 0;
    state.speedFever = { team: null, timer: 0, duration: 0 };
    state.msitpSoloFeverReady = true;
    state.feverSfxTimer = 0;
    state.feverSfxStep = 0;
    state.pendingEffects = [];
    state.aiDelay = 1.85;
    state.shake = 0;
    state.result = null;
    state.resultText = "";
    state.finisher = null;
    state.victoryCelebration = null;
    state.defeatChoice = null;
    state.gameOverFall = null;
  }

  function update(dt) {
    if (!state.active) return;

    pollInput();
    state.bossSpin += dt;

    if (state.finisher) {
      updateFinisher(dt);
      updateParticles(dt);
      updateEffectPops(dt);
      updateBaseBreaks(dt);
      state.shake = Math.max(0, state.shake - dt * 24);
      return;
    }

    if (state.victoryCelebration) {
      updateVictoryCelebration(dt);
      updateParticles(dt);
      updateEffectPops(dt);
      updateBaseBreaks(dt);
      state.shake = Math.max(0, state.shake - dt * 24);
      return;
    }

    if (state.defeatChoice) {
      updateDefeatChoice(dt);
      updateParticles(dt);
      updateEffectPops(dt);
      updateBaseBreaks(dt);
      state.shake = Math.max(0, state.shake - dt * 18);
      return;
    }

    if (state.gameOverFall) {
      updateGameOverFall(dt);
      return;
    }

    if (!state.gameOver) {
      updatePlayer(dt);
      state.elapsed += dt;
      state.energy = Math.min(MAX_ENERGY, state.energy + dt * PLAYER_ENERGY_RATE);
      updateAi(dt);
      updateCardFlights(dt);
      updatePepperThrows(dt);
      updateHandEntries(dt);
      state.handCyclePressTimer = Math.max(0, state.handCyclePressTimer - dt);
      updatePendingEffects(dt);
      updateFever(dt);
      updateHazards(dt);
      updateUnits(dt);
      updateNidhoggFlames(dt);
      checkGameOver();
    }

    updateParticles(dt);
    updateEffectPops(dt);
    updateBaseBreaks(dt);
    state.shake = Math.max(0, state.shake - dt * 24);
  }

  function updatePlayer(dt) {
    const dx = (state.keys.right ? 1 : 0) - (state.keys.left ? 1 : 0);
    const dy = (state.keys.down ? 1 : 0) - (state.keys.up ? 1 : 0);
    const len = Math.hypot(dx, dy) || 1;
    const move = PLAYER_MOVE_SPEED * dt;
    state.playerX = clamp(state.playerX + (dx / len) * move, PLAYER_DEPLOY_MIN_X, PLAYER_DEPLOY_MAX_X);
    state.playerY = clamp(state.playerY + (dy / len) * move, PLAYER_DEPLOY_MIN_Y, PLAYER_DEPLOY_MAX_Y);
  }

  function deckForTeam(team) {
    if (team === "enemy") return ENEMY_CARDS;
    return playerDeckFromIds(activePlayerDeckIds);
  }

  function playerDeckFromIds(ids) {
    const resolvedIds = resolvePlayerDeckIds(ids);
    if (!resolvedIds) return CARDS;
    const deck = resolvedIds
      .map((id, index) => {
        const card = CARD_BY_ID[id];
        return card ? makeDeckCard(card, index) : null;
      })
      .filter(Boolean);
    return deck.length >= HAND_SIZE ? deck : CARDS;
  }

  function resolvePlayerDeckIds(ids) {
    if (typeof ids === "string") {
      const value = ids.trim();
      if (!value) return null;
      if (PLAYER_DECK_PRESETS[value]) return PLAYER_DECK_PRESETS[value];
      return value.split(",").map((id) => id.trim()).filter(Boolean);
    }
    if (!Array.isArray(ids) || !ids.length) return null;
    if (ids.length === 1 && PLAYER_DECK_PRESETS[ids[0]]) return PLAYER_DECK_PRESETS[ids[0]];
    return ids;
  }

  function makeDeckCard(card, index) {
    return { ...card, deckKey: `${card.id}:${index}` };
  }

  function cardKey(card) {
    return card?.deckKey || card?.id || "";
  }

  function makeOpeningHand(team) {
    return shuffle([...deckForTeam(team)]).slice(0, HAND_SIZE);
  }

  function replaceUsedCard(hand, usedCard) {
    const usedKey = cardKey(usedCard);
    const slot = hand.findIndex((card) => cardKey(card) === usedKey);
    if (slot < 0) return;
    hand.splice(slot, 1);
    const handKeys = new Set(hand.map((card) => cardKey(card)));
    const team = hand === state.playerHand ? "player" : "enemy";
    const deck = deckForTeam(team);
    const activeIds = activeCardIds(team);
    const blocksActive = (card) => !card.allowDuplicate && activeIds.has(card.id);
    let candidates = deck.filter((card) => !handKeys.has(cardKey(card)) && !blocksActive(card) && cardKey(card) !== usedKey);
    if (!candidates.length) candidates = deck.filter((card) => !handKeys.has(cardKey(card)) && !blocksActive(card));
    if (!candidates.length) candidates = deck.filter((card) => !handKeys.has(cardKey(card)) && cardKey(card) !== usedKey);
    if (!candidates.length) candidates = deck.filter((card) => !handKeys.has(cardKey(card)));
    if (candidates.length) {
      const nextCard = candidates[(Math.random() * candidates.length) | 0];
      hand.splice(slot, 0, nextCard);
      if (team === "player") {
        state.handEntries = state.handEntries.filter((entry) => entry.cardKey !== cardKey(nextCard));
        state.handEntries.push({ cardId: nextCard.id, cardKey: cardKey(nextCard), t: 0, duration: 0.42 });
      }
    }
    if (state.selectedHandIndex >= hand.length) state.selectedHandIndex = 0;
  }

  function activeCardIds(team) {
    return new Set([
      ...state.units.filter((unit) => unit.team === team && unit.hp > 0 && !unit.card.allowDuplicate).map((unit) => unit.card.id),
      ...state.cardFlights.filter((flight) => flight.team === team && !flight.spawned && !flight.card.allowDuplicate).map((flight) => flight.card.id),
    ]);
  }

  function isCardActive(card, team) {
    if (card?.allowDuplicate) return false;
    return !!card && (
      state.units.some((unit) => unit.team === team && unit.hp > 0 && unit.card.id === card.id) ||
      state.cardFlights.some((flight) => flight.team === team && !flight.spawned && flight.card.id === card.id)
    );
  }

  function canDeployCard(card, team, energy) {
    return !!card && energy >= card.cost && !isCardActive(card, team);
  }

  function selectedCard() {
    return state.playerHand[state.selectedHandIndex] || state.playerHand[0] || null;
  }

  function selectNextCard() {
    if (state.gameOver || state.victoryCelebration || state.defeatChoice || state.gameOverFall) return;
    ensureAudio();
    state.selectedHandIndex = (state.selectedHandIndex + 1) % state.playerHand.length;
    state.handCyclePressTimer = 0.13;
    playSelectSound();
  }

  function deploySelectedCard() {
    ensureAudio();
    if (state.gameOverFall) {
      confirmGameOverFall();
      return;
    }
    if (state.defeatChoice) {
      confirmDefeatChoice();
      return;
    }
    if (state.victoryCelebration) {
      confirmVictoryCelebration();
      return;
    }
    if (state.gameOver) {
      confirmGameOver();
      return;
    }
    const card = selectedCard();
    if (!card) return;
    if (state.energy < card.cost) {
      playBuzzerSound();
      floatText(state.playerX, state.playerY - 24, "NO POW", "#ef5b5b");
      return;
    }
    if (isCardActive(card, "player")) {
      playBuzzerSound();
      floatText(state.playerX, state.playerY - 24, "FIELD", "#ef5b5b");
      return;
    }
    launchCardFlight(card, state.playerX, state.playerY);
    state.energy -= card.cost;
    replaceUsedCard(state.playerHand, card);
    playDeploySound();
  }

  function launchCardFlight(card, targetX, targetY) {
    const from = selectedHandCardCenter();
    state.cardFlights.push({
      card,
      team: "player",
      sx: from.x,
      sy: from.y,
      tx: targetX,
      ty: targetY,
      t: 0,
      duration: 0.34,
      spawned: false,
    });
  }

  function selectedHandCardCenter() {
    return {
      x: HAND_CENTER_X,
      y: HAND_Y - 4 + HAND_H / 2,
    };
  }

  function deployCard(card, team, x, y) {
    const count = card.count || 1;
    const offsets = unitSpawnOffsets(card, count, team);
    for (let i = 0; i < count; i += 1) {
      const offset = offsets[i] || { x: 0, y: 0 };
      state.units.push({
        id: `${Date.now()}-${Math.random()}`,
        card,
        variant: i,
        role: unitRole(card, i),
        team,
        x: clamp(x + offset.x, FIELD_MIN_X, FIELD_MAX_X),
        y: clamp(y + offset.y, FIELD_MIN_Y, FIELD_MAX_Y),
        hp: card.hp,
        maxHp: card.hp,
        attackTimer: Math.random() * 0.25,
        hitFlash: 0,
        bob: Math.random() * Math.PI * 2,
        state: "walk",
        setupTimer: card.curry ? CURRY_SETUP_DELAY : card.summonBuff?.type === "attack" && team === "player" ? 0.58 : 0,
        setupEffect: card.curry ? "curry" : card.summonBuff?.type === "attack" && team === "player" ? "pepper" : null,
        slowTimer: 0,
        slowFactor: 1,
        speedBoostTimer: 0,
        speedBoostFactor: 1,
        attackBoostTimer: 0,
        attackBoostFactor: 1,
        hazardTick: 0,
        curryTimer: 0,
        curryPhase: Math.random() * Math.PI * 2,
        knockTimer: 0,
        knockDuration: 0,
        knockStartX: 0,
        knockStartY: 0,
        knockTargetX: 0,
        knockTargetY: 0,
        knockHeight: 0,
        cachedTarget: null,
        targetRefreshTimer: Math.random() * TARGET_REFRESH_BASE,
      });
    }
    queueOrApplySummonEffect(card, team, x, y);
    const completesMsitpSoloFever = team === "player" && card.msitpSolo && state.msitpSoloFeverReady && isMsitpSoloSetComplete();
    if (team === "player") {
      if (completesMsitpSoloFever) speechText(clamp(x, 64, PHONE_BRAWL_W - 64), y - 26, "いっけー！！！", "rainbow", 1.44);
      else speakOnSummon(card, x, y);
    }
    if (team === "player") checkMsitpSoloFever(x, y);
    burst(x, y, card.color, 9 + count * 2, 35);
  }

  function speakOnSummon(card, x, y) {
    const text = Array.isArray(card.summonText)
      ? card.summonText[(Math.random() * card.summonText.length) | 0]
      : card.summonText;
    if (!text) return;
    speechText(clamp(x, 64, PHONE_BRAWL_W - 64), y - 26, text, card.summonTextColor || "#f7f2e8", 1.44);
  }

  function unitRole(card, index) {
    if (card.behavior === "cactusCrew") return index === (card.count || 1) - 1 ? "shooter" : "tank";
    if (card.id === "frost") return index === 0 ? "shooter" : "tank";
    return null;
  }

  function queueOrApplySummonEffect(card, team, x, y) {
    if ((card.summonBuff?.type === "speed" || card.summonBuff?.type === "attack") && team === "player") {
      state.pendingEffects.push({ card, team, x, y, timer: 0.58 });
      return;
    }
    if (card.curry) {
      startCurryPopup(card, team, x, y);
      state.pendingEffects.push({ card, team, x, y, timer: CURRY_SETUP_DELAY, effect: "curry" });
      return;
    }
    applySummonEffect(card, team, x, y);
  }

  function startCurryPopup(card, team, x, y) {
    state.effectPops.push({
      kind: "curry",
      card,
      team,
      x: clamp(x, 38, PHONE_BRAWL_W - 38),
      y: clamp(y - 24, FIELD_Y + 20, FIELD_Y + FIELD_H - 18),
      life: CURRY_SETUP_DELAY,
      maxLife: CURRY_SETUP_DELAY,
    });
  }

  function activeTeamUnits(team) {
    return state.units.filter((unit) => unit.team === team && unit.hp > 0);
  }

  function applySummonEffect(card, team, x, y) {
    if (card.summonBuff) {
      if (card.summonBuff.type === "attack" && team === "player") {
        startPepperThrows(card, team, x, y);
        burst(x, y, card.color, 12, 34);
        return;
      }
      if (card.summonBuff.type === "speed" && team === "player") {
        speechText(clamp(x, 64, PHONE_BRAWL_W - 64), y - 44, "FEVER!", "rainbow", 1.2);
      }
      const targets = activeTeamUnits(team);
      const showUnitText = targets.length <= BOOST_TEXT_UNIT_LIMIT;
      for (const unit of targets) {
        if (card.summonBuff.type === "speed") {
          unit.speedBoostTimer = Math.max(unit.speedBoostTimer, card.summonBuff.duration);
          unit.speedBoostFactor = Math.max(unit.speedBoostFactor, card.summonBuff.factor);
          if (team === "player" && showUnitText) speechText(clamp(unit.x, 42, PHONE_BRAWL_W - 42), unit.y - 22, "FEVER!", "rainbow", 1.1);
        } else if (card.summonBuff.type === "attack") {
          unit.attackBoostTimer = Math.max(unit.attackBoostTimer, card.summonBuff.duration);
          unit.attackBoostFactor = Math.max(unit.attackBoostFactor, card.summonBuff.factor);
          if (team === "player" && showUnitText) speechText(clamp(unit.x, 42, PHONE_BRAWL_W - 42), unit.y - 22, "ATK UP", "#ef3e45", 1.1);
        }
      }
      if (card.summonBuff.type === "speed" && team === "player") {
        state.speedFever = { team, timer: card.summonBuff.duration, duration: card.summonBuff.duration };
        state.feverSfxTimer = 0;
        state.feverSfxStep = 0;
      }
      burst(x, y, card.color, 18, 48);
    }
    if (card.curry) applyCurryEffect(card, team, x, y);
  }

  function checkMsitpSoloFever(x, y) {
    if (!state.msitpSoloFeverReady) return;
    if (!isMsitpSoloSetComplete()) return;
    state.msitpSoloFeverReady = false;
    startMsitpSoloFever(x, y);
  }

  function updateMsitpSoloFeverReadiness() {
    if (!isMsitpSoloSetComplete()) {
      state.msitpSoloFeverReady = true;
    }
  }

  function isMsitpSoloSetComplete() {
    const activeIds = new Set(state.units
      .filter((unit) => unit.team === "player" && unit.hp > 0 && unit.card.msitpSolo)
      .map((unit) => unit.card.id));
    return MSITP_SOLO_CARD_IDS.every((id) => activeIds.has(id));
  }

  function startMsitpSoloFever(x, y) {
    const duration = 5.6;
    const factor = 1.28;
    speechText(clamp(x, 64, PHONE_BRAWL_W - 64), y - 44, "FEVER!", "rainbow", 1.2);
    const targets = activeTeamUnits("player");
    const showUnitText = targets.length <= BOOST_TEXT_UNIT_LIMIT;
    for (const unit of targets) {
      unit.speedBoostTimer = Math.max(unit.speedBoostTimer, duration);
      unit.speedBoostFactor = Math.max(unit.speedBoostFactor, factor);
      if (showUnitText) speechText(clamp(unit.x, 42, PHONE_BRAWL_W - 42), unit.y - 22, "FEVER!", "rainbow", 1.1);
    }
    state.speedFever = { team: "player", timer: duration, duration };
    state.feverSfxTimer = 0;
    state.feverSfxStep = 0;
    burst(x, y, "#ff5ad6", 24, 54);
  }

  function applyCurryEffect(card, team, x, y) {
    if (!card.curry) return;
    state.hazards.push({
      team,
      x,
      y,
      radius: card.curry.radius,
      life: card.curry.duration,
      maxLife: card.curry.duration,
      damage: card.curry.damage,
      slow: card.curry.slow,
      tick: 0,
      chunks: makeCurryChunks(card.curry.radius),
    });
    burst(x, y, card.color, 18, 32);
  }

  function startPepperThrows(card, team, x, y) {
    const thrower = state.units
      .filter((unit) => unit.team === team && unit.card.id === card.id && unit.hp > 0)
      .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
    if (!thrower) return;
    const targets = activeTeamUnits(team);
    if (!targets.length) return;
    const crowded = targets.length > PEPPER_VISUAL_LIMIT;
    if (crowded) {
      for (const target of targets) {
        applyAttackBuffToUnit(card, target, { speech: false, particles: false, sound: false });
      }
      speechText(clamp(x, 64, PHONE_BRAWL_W - 64), y - 44, "ATK UP", "#ef3e45", 1.2);
    }
    const step = crowded ? Math.max(1, Math.ceil(targets.length / PEPPER_VISUAL_LIMIT)) : 1;
    const visualTargets = crowded
      ? targets.filter((_, index) => index % step === 0).slice(0, PEPPER_VISUAL_LIMIT)
      : targets;
    visualTargets.forEach((target, index) => {
      const dist = Math.hypot(target.x - thrower.x, target.y - thrower.y);
      state.pepperThrows.push({
        card,
        team,
        targetId: target.id,
        sx: thrower.x,
        sy: thrower.y - thrower.card.radius - 6,
        tx: target.x,
        ty: target.y - target.card.radius - 4,
        t: 0,
        delay: index * 0.08,
        duration: clamp(0.26 + dist / 340, 0.28, 0.5),
        arc: 18 + Math.min(18, dist * 0.18),
        done: false,
        visualOnly: crowded,
      });
    });
  }

  function applyAttackBuffToUnit(card, unit, opts = {}) {
    if (!card.summonBuff || card.summonBuff.type !== "attack") return;
    unit.attackBoostTimer = Math.max(unit.attackBoostTimer, card.summonBuff.duration);
    unit.attackBoostFactor = Math.max(unit.attackBoostFactor, card.summonBuff.factor);
    if (opts.speech !== false) speechText(clamp(unit.x, 42, PHONE_BRAWL_W - 42), unit.y - 22, "ATK UP", "#ef3e45", 1.1);
    if (opts.particles !== false) burst(unit.x, unit.y, "#ef3e45", 8, 28);
    if (opts.sound !== false) playPepperCatchSound();
  }

  function makeCurryChunks(radius) {
    const chunks = [];
    const colors = ["#f08a24", "#d76a1c", "#e8c76a", "#cfa84f", "#f6d98a"];
    for (let i = 0; i < 22; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random()) * radius * 0.78;
      chunks.push({
        x: Math.cos(a) * d * 1.08,
        y: Math.sin(a) * d * 0.58,
        size: i % 5 === 0 ? 5 : i % 2 === 0 ? 4 : 3,
        color: colors[(Math.random() * colors.length) | 0],
      });
    }
    return chunks;
  }

  function unitSpawnOffsets(card, count, team) {
    if (count <= 1) return [{ x: 0, y: 0 }];
    if (card.formation === "line") {
      return Array.from({ length: count }, (_, i) => ({
        x: 0,
        y: (i - (count - 1) / 2) * 18,
      }));
    }
    if (card.formation === "crew") {
      const forward = team === "player" ? 1 : -1;
      if (card.behavior === "cactusCrew") {
        const meleeCount = Math.max(0, count - 1);
        const offsets = Array.from({ length: meleeCount }, (_, i) => {
          const angle = -Math.PI / 2 + (Math.PI * 2 * i) / meleeCount;
          const radius = 22;
          return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
          };
        });
        offsets.push({ x: 0, y: 0 });
        return offsets;
      }
      return [
        { x: forward * 10, y: -9 },
        { x: forward * 10, y: 9 },
        { x: -forward * 12, y: 0 },
      ];
    }
    if (card.formation === "cluster") {
      const cluster = [
        { x: -8, y: -7 },
        { x: 6, y: -8 },
        { x: -2, y: 2 },
        { x: 10, y: 3 },
        { x: -11, y: 7 },
        { x: 3, y: 10 },
      ];
      return Array.from({ length: count }, (_, i) => cluster[i % cluster.length]);
    }
    return Array.from({ length: count }, (_, i) => {
      const spread = (i - (count - 1) / 2) * 16;
      return {
        x: (team === "player" ? -1 : 1) * Math.abs(spread) * 0.16,
        y: spread,
      };
    });
  }

  function pickAiCard() {
    const affordable = state.enemyHand.filter((card) => canDeployCard(card, "enemy", state.enemyEnergy));
    if (!affordable.length) return null;
    let best = null;
    let bestScore = -Infinity;
    for (const card of affordable) {
      const score = scoreAiCard(card) + Math.random() * 18;
      if (score > bestScore) {
        bestScore = score;
        best = card;
      }
    }
    return best;
  }

  function updateAi(dt) {
    state.enemyEnergy = Math.min(MAX_ENERGY, state.enemyEnergy + dt * ENEMY_ENERGY_RATE);
    state.aiDelay -= dt;
    if (state.aiDelay > 0) return;
    const card = pickAiCard();
    if (!card) {
      state.aiDelay = 0.95;
      return;
    }
    const point = pickAiDeployPoint(card);
    deployCard(card, "enemy", point.x, point.y);
    state.enemyEnergy -= card.cost;
    replaceUsedCard(state.enemyHand, card);
    state.aiDelay = 2.15 + Math.random() * 2.85;
  }

  function updateUnits(dt) {
    for (const unit of state.units) {
      if (unit.exiting) {
        updateUnitExit(unit, dt);
        continue;
      }
      if (unit.hp <= 0) continue;
      unit.hitFlash = Math.max(0, unit.hitFlash - dt * 5);
      unit.attackTimer = Math.max(0, unit.attackTimer - dt);
      unit.slowTimer = Math.max(0, unit.slowTimer - dt);
      unit.speedBoostTimer = Math.max(0, unit.speedBoostTimer - dt);
      unit.attackBoostTimer = Math.max(0, unit.attackBoostTimer - dt);
      unit.hazardTick = Math.max(0, unit.hazardTick - dt);
      unit.curryTimer = Math.max(0, (unit.curryTimer || 0) - dt);
      unit.setupTimer = Math.max(0, (unit.setupTimer || 0) - dt);
      unit.bob += dt * (unit.state === "walk" ? unit.card.speed / 4.8 : 1.8);

      if (updateKnockback(unit, dt)) continue;
      if (unit.setupTimer > 0) {
        unit.state = "idle";
        unit.attackTimer = Math.max(unit.attackTimer, 0.08);
        continue;
      }

      const target = getUnitTarget(unit, dt);
      if (canAttackTarget(unit, target)) {
        unit.state = "attack";
        if (unit.attackTimer <= 0) {
          attack(unit, target);
          unit.attackTimer = unitCooldown(unit);
        }
      } else {
        unit.state = "walk";
        const slow = unit.slowTimer > 0 ? unit.slowFactor : 1;
        const speedBoost = unit.speedBoostTimer > 0 ? unit.speedBoostFactor : 1;
        const move = unit.card.speed * UNIT_SPEED_SCALE * slow * speedBoost * dt;
        moveTowardTarget(unit, target, move, dt);
      }
    }
    for (const unit of state.units) {
      if (unit.hp <= 0 && !unit.deathFxDone) {
        if (state.finisher?.unitId === unit.id) continue;
        unit.deathFxDone = true;
        triggerDeathEffect(unit);
        if (!unit.suicideVanish) startUnitExit(unit);
      }
    }
    state.units = state.units.filter((unit) => {
      if (unit.exiting) return !unit.exitDone;
      return unit.hp > 0 && unit.x > -25 && unit.x < PHONE_BRAWL_W + 25 && unit.y > -25 && unit.y < PHONE_BRAWL_H + 25;
    });
    updateMsitpSoloFeverReadiness();
  }

  function startUnitExit(unit) {
    const dir = unit.team === "enemy" ? 1 : -1;
    const sidePush = 58 + Math.random() * 74;
    const randomX = (Math.random() - 0.5) * 58;
    const upward = 42 + Math.random() * 70;
    unit.exiting = true;
    unit.exitDone = false;
    unit.exitTimer = 0;
    unit.exitDuration = UNIT_DEATH_EXIT_DURATION + Math.random() * 0.22;
    unit.exitStartX = unit.x;
    unit.exitStartY = unit.y;
    unit.exitTargetX = unit.x + dir * sidePush + randomX;
    unit.exitTargetY = unit.y - upward;
    if (dir > 0) unit.exitTargetX = Math.max(unit.exitTargetX, PHONE_BRAWL_W + 24 + Math.random() * 42);
    else unit.exitTargetX = Math.min(unit.exitTargetX, -24 - Math.random() * 42);
    unit.exitTargetY = Math.min(unit.exitTargetY, -18 - Math.random() * 44);
    unit.exitSpin = dir * (Math.PI * (5.4 + Math.random() * 1.6));
    unit.exitAngle = 0;
    unit.exitAlpha = 1;
    unit.state = "dead";
    unit.attackTimer = 999;
  }

  function updateUnitExit(unit, dt) {
    unit.exitTimer += dt;
    unit.bob += dt * 16;
    const p = clamp(unit.exitTimer / Math.max(0.001, unit.exitDuration), 0, 1);
    const eased = 1 - Math.pow(1 - p, 2.35);
    const arc = Math.sin(p * Math.PI) * 36;
    unit.x = unit.exitStartX + (unit.exitTargetX - unit.exitStartX) * eased;
    unit.y = unit.exitStartY + (unit.exitTargetY - unit.exitStartY) * eased - arc;
    unit.exitAngle = unit.exitSpin * eased;
    unit.exitAlpha = 1 - clamp((p - 0.72) / 0.28, 0, 1);
    unit.exitDone = p >= 1 || unit.x < -70 || unit.x > PHONE_BRAWL_W + 70 || unit.y < -80;
  }

  function updateKnockback(unit, dt) {
    if (unit.knockTimer >= unit.knockDuration) return false;
    unit.state = "knockback";
    unit.attackTimer = Math.max(unit.attackTimer, 0.2);
    unit.knockTimer = Math.min(unit.knockDuration, unit.knockTimer + dt);
    const p = unit.knockDuration > 0 ? unit.knockTimer / unit.knockDuration : 1;
    const eased = 1 - Math.pow(1 - p, 2.5);
    unit.x = unit.knockStartX + (unit.knockTargetX - unit.knockStartX) * eased;
    unit.y = unit.knockStartY + (unit.knockTargetY - unit.knockStartY) * eased;
    if (p >= 1) {
      unit.x = unit.knockTargetX;
      unit.y = unit.knockTargetY;
      unit.state = "walk";
      unit.attackTimer = Math.max(unit.attackTimer, 0.18);
    }
    return true;
  }

  function getUnitTarget(unit, dt) {
    unit.targetRefreshTimer = Math.max(0, (unit.targetRefreshTimer || 0) - dt);
    const cached = refreshTargetDistance(unit, unit.cachedTarget);
    if (cached && unit.targetRefreshTimer > 0 && isUsableCachedTarget(unit, cached)) {
      unit.cachedTarget = cached;
      return cached;
    }

    const target = findTarget(unit);
    unit.cachedTarget = target;
    unit.targetRefreshTimer = TARGET_REFRESH_BASE + Math.random() * TARGET_REFRESH_JITTER;
    return target;
  }

  function refreshTargetDistance(unit, target) {
    if (!target) return null;
    if (target.kind === "base") return enemyBaseTarget(unit);
    if (target.kind === "ownBase") return ownBaseTarget(unit);
    if ((target.kind === "unit" || target.kind === "follow") && target.target) {
      const other = target.target;
      return { ...target, dist: Math.hypot(other.x - unit.x, other.y - unit.y) };
    }
    return null;
  }

  function isUsableCachedTarget(unit, target) {
    if (!target) return false;
    if (target.kind === "base" || target.kind === "ownBase") return true;
    const other = target.target;
    return !!other
      && other.hp > 0
      && !other.exiting
      && isFinitePoint(other.x, other.y)
      && isTargetSearchCandidate(unit, other);
  }

  function findTarget(unit) {
    if (unit.card.behavior === "tower") {
      return findRangedTarget(unit);
    }
    switch (unit.card.behavior) {
      case "runner": return findRunnerTarget(unit);
      case "guard": return findGuardTarget(unit);
      case "bruiser": return findBruiserTarget(unit);
      case "ranged": return findRangedTarget(unit);
      case "sniper": return findSniperTarget(unit);
      case "medic": return findMedicTarget(unit);
      case "swarm": return findSwarmTarget(unit);
      case "frost": return findFrostTarget(unit);
      case "cactusCrew": return unit.role === "shooter" ? findCactusShooterTarget(unit) : findGuardTarget(unit);
      case "spark": return findSparkTarget(unit);
      case "yahhy": return findBruiserTarget(unit);
      case "nidhogg": return findRangedTarget(unit);
      default: return findNearestCombatTarget(unit);
    }
  }

  function findRunnerTarget(unit) {
    const blocker = bestEnemyUnit(unit, (other, dist) => {
      if (!isAheadOf(unit, other)) return Infinity;
      if (Math.abs(other.y - unit.y) > 28 && dist > unit.card.range + 8) return Infinity;
      return dist;
    });
    return blocker && blocker.dist <= 42 ? blocker : enemyBaseTarget(unit);
  }

  function findGuardTarget(unit) {
    const own = ownBasePoint(unit.team);
    const threat = bestEnemyUnit(unit, (other, dist) => {
      const baseThreat = distanceToBase(other.x, other.y, own.x, own.y);
      const fastBonus = other.card.speed > 34 ? 18 : 0;
      const bombBonus = other.card.suicide ? 40 : 0;
      return baseThreat * 0.85 + dist * 0.35 - fastBonus - bombBonus;
    });
    return threat || enemyBaseTarget(unit);
  }

  function findBruiserTarget(unit) {
    const heavy = bestEnemyUnit(unit, (other, dist) => {
      const hpPressure = other.maxHp * 0.16 + Math.max(0, other.card.damage) * 0.7;
      return dist * 0.45 - hpPressure;
    });
    return heavy || enemyBaseTarget(unit);
  }

  function findRangedTarget(unit) {
    const target = bestEnemyUnit(unit, (other, dist) => {
      const supportBonus = ["medic", "sniper", "frost", "blaster"].includes(other.card.id) ? 16 : 0;
      return dist - supportBonus;
    });
    return target || enemyBaseTarget(unit);
  }

  function findSniperTarget(unit) {
    const target = bestEnemyUnit(unit, (other, dist) => {
      const supportBonus = ["medic", "sniper", "frost", "spark"].includes(other.card.id) ? 55 : 0;
      const fragileBonus = Math.max(0, 160 - other.maxHp) * 0.2;
      return other.hp * 0.8 + dist * 0.22 - supportBonus - fragileBonus;
    });
    return target || enemyBaseTarget(unit);
  }

  function findMedicTarget(unit) {
    const wounded = bestAllyUnit(unit, (other, dist) => {
      if (other.hp >= other.maxHp) return Infinity;
      const missing = other.maxHp - other.hp;
      return dist - missing * 0.5;
    });
    if (wounded) return wounded;

    const lead = bestAllyUnit(unit, (other, dist) => {
      const advance = unit.team === "player" ? other.x - FIELD_MIN_X : FIELD_MAX_X - other.x;
      const tankBonus = other.maxHp * 0.08;
      return dist * 0.45 - advance * 0.35 - tankBonus;
    });
    return lead ? { ...lead, kind: "follow", desired: 28 } : enemyBaseTarget(unit);
  }

  function findSwarmTarget(unit) {
    const target = bestEnemyUnit(unit, (other, dist) => {
      const fragileBonus = Math.max(0, 150 - other.maxHp) * 0.28;
      const supportBonus = ["sniper", "medic", "spark"].includes(other.card.id) ? 26 : 0;
      return other.hp * 0.7 + dist * 0.32 - fragileBonus - supportBonus;
    });
    return target || enemyBaseTarget(unit);
  }

  function findFrostTarget(unit) {
    const target = bestEnemyUnit(unit, (other, dist) => {
      const speedBonus = other.card.speed * 1.8;
      const tankBonus = other.maxHp * 0.07;
      return dist * 0.36 - speedBonus - tankBonus;
    });
    return target || enemyBaseTarget(unit);
  }

  function findCactusShooterTarget(unit) {
    const ranged = findRangedTarget(unit);
    if (ranged?.kind === "unit" && ranged.dist <= unitRange(unit) * 1.15) return ranged;
    const tank = bestAllyUnit(unit, (other, dist) => {
      if (other.card.id !== "frost" || other.role !== "tank") return Infinity;
      const advance = unit.team === "player" ? other.x - FIELD_MIN_X : FIELD_MAX_X - other.x;
      return dist * 0.5 - advance * 0.25;
    });
    return tank ? { ...tank, kind: "follow", desired: 24 } : ranged;
  }

  function findSparkTarget(unit) {
    const target = bestEnemyUnit(unit, (other, dist) => {
      let cluster = 0;
      let potential = other.hp;
      for (const near of state.units) {
        if (near.team === unit.team || near.id === other.id) continue;
        const nearDist = Math.hypot(near.x - other.x, near.y - other.y);
        if (nearDist <= unit.card.splash) {
          cluster += 1;
          potential += near.hp * 0.45;
        }
      }
      return dist * 0.42 - cluster * 60 - potential * 0.12;
    });
    return target || enemyBaseTarget(unit);
  }

  function findMechanicTarget(unit) {
    if (ownBaseHp(unit.team) < BASE_MAX_HP) return ownBaseTarget(unit);

    const wounded = bestAllyUnit(unit, (other, dist) => {
      if (other.hp >= other.maxHp) return Infinity;
      const missing = other.maxHp - other.hp;
      return dist - missing * 0.35;
    });
    if (wounded) return wounded;

    return findRangedTarget(unit);
  }

  function findNearestCombatTarget(unit) {
    const enemy = bestEnemyUnit(unit, (_other, dist) => dist);
    const base = enemyBaseTarget(unit);
    if (!enemy || base.dist < enemy.dist) return base;
    return enemy;
  }

  function bestEnemyUnit(unit, scoreFn) {
    return bestUnit(unit, (other) => other.team !== unit.team, scoreFn);
  }

  function bestAllyUnit(unit, scoreFn) {
    return bestUnit(unit, (other) => other.team === unit.team && other.id !== unit.id, scoreFn);
  }

  function bestUnit(unit, filterFn, scoreFn) {
    let best = null;
    let bestDist = Infinity;
    let bestScore = Infinity;
    for (const other of state.units) {
      if (other.hp <= 0 || other.exiting || !isFinitePoint(other.x, other.y)) continue;
      if (!isTargetSearchCandidate(unit, other)) continue;
      if (!filterFn(other)) continue;
      const dist = Math.hypot(other.x - unit.x, other.y - unit.y);
      const score = scoreFn(other, dist);
      if (score < bestScore) {
        bestScore = score;
        bestDist = dist;
        best = other;
      }
    }
    return best ? { kind: "unit", target: best, dist: bestDist } : null;
  }

  function isTargetSearchCandidate(unit, other) {
    if (!other || other.id === unit.id) return false;
    const dx = other.x - unit.x;
    const dy = other.y - unit.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const range = unitRange(unit);
    const ally = other.team === unit.team;
    const forward = unit.team === "player" ? dx >= -range - 36 : dx <= range + 36;

    if (!ally && !forward && absDx > range + 36) return false;

    const baseRadius = ally
      ? TARGET_SEARCH_RADIUS + 22
      : Math.min(TARGET_SEARCH_MAX_RADIUS, Math.max(TARGET_SEARCH_RADIUS, range * 1.45 + 84));
    if (absDx * absDx + dy * dy <= baseRadius * baseRadius) return true;

    // 横列が近い相手は少し遠くても候補に残し、前線の詰まりを避ける。
    return absDy <= TARGET_SEARCH_LANE_Y
      && absDx <= TARGET_SEARCH_MAX_RADIUS + (ally ? 12 : 34)
      && (ally || forward);
  }

  function enemyBaseTarget(unit) {
    const base = enemyBasePoint(unit.team);
    return { kind: "base", dist: distanceToBase(unit.x, unit.y, base.x, base.y) };
  }

  function ownBaseTarget(unit) {
    const base = ownBasePoint(unit.team);
    return { kind: "ownBase", dist: Math.hypot(base.x - unit.x, base.y - unit.y) };
  }

  function canAttackTarget(unit, target) {
    if (!target || target.kind === "follow" || target.dist > unitRange(unit)) return false;
    if (target.kind === "base") return unitDamage(unit) > 0;
    if (target.kind === "ownBase") return !!unit.card.repairBase;
    if (target.kind !== "unit" || !target.target) return false;
    if (target.target.hp <= 0 || !isFinitePoint(target.target.x, target.target.y)) return false;
    if (target.target.team === unit.team) return target.target.hp < target.target.maxHp && (unit.card.damage < 0 || unit.card.allyRepair);
    return unitDamage(unit) > 0;
  }

  function unitRange(unit) {
    if (unit.card.id === "frost" && unit.role === "shooter") return 58;
    return unit.card.range;
  }

  function unitDamage(unit) {
    let base = unit.card.id === "frost" && unit.role === "shooter" ? 20 : unit.card.damage;
    if (unit.card.behavior === "cactusCrew" && unit.role === "tank") base = 4;
    return base * (unit.attackBoostTimer > 0 ? unit.attackBoostFactor : 1);
  }

  function unitCooldown(unit) {
    const base = unit.card.id === "frost" && unit.role === "shooter" ? 0.95 : unit.card.cooldown;
    return base / (unit.speedBoostTimer > 0 ? unit.speedBoostFactor : 1);
  }

  function isMeleeUnit(unit) {
    if (unit.card.id === "frost") return unit.role === "tank";
    return unit.card.attackFx === "melee" && !unit.card.suicide && unitDamage(unit) > 0;
  }

  function isNidhoggUnit(unit) {
    return unit.card.behavior === "nidhogg";
  }

  function nidhoggMouthX(unit) {
    return unit.x + (unit.team === "player" ? NIDHOGG_FLAME_OFFSET_X : -NIDHOGG_FLAME_OFFSET_X);
  }

  function nidhoggMouthY(unit) {
    return unit.y - unit.card.radius + NIDHOGG_FLAME_OFFSET_Y;
  }

  function moveTowardTarget(unit, target, move, dt) {
    const goal = targetPoint(unit, target);
    if (!goal) {
      advanceTowardEnemyBase(unit, move, dt);
      return;
    }
    if (target.kind === "follow" && target.dist <= (target.desired || 24)) {
      advanceTowardEnemyBase(unit, move * 0.25, dt);
      return;
    }
    const dx = goal.x - unit.x;
    const dy = goal.y - unit.y;
    const len = Math.hypot(dx, dy) || 1;
    unit.x = clamp(unit.x + (dx / len) * move, FIELD_MIN_X, FIELD_MAX_X);
    unit.y = clamp(unit.y + (dy / len) * move, FIELD_MIN_Y, FIELD_MAX_Y);
  }

  function targetPoint(unit, target) {
    if (!target) return null;
    if (target.kind === "base") return enemyBasePoint(unit.team);
    if (target.kind === "ownBase") return ownBasePoint(unit.team);
    if ((target.kind === "unit" || target.kind === "follow") && target.target) {
      if (target.kind === "follow") {
        const offset = target.desired || 24;
        return { x: target.target.x + (unit.team === "player" ? -offset : offset), y: target.target.y };
      }
      return { x: target.target.x, y: target.target.y };
    }
    return null;
  }

  function advanceTowardEnemyBase(unit, move, dt) {
    const base = enemyBasePoint(unit.team);
    const dx = base.x - unit.x;
    const dy = base.y - unit.y;
    const len = Math.hypot(dx, dy) || 1;
    unit.x = clamp(unit.x + (dx / len) * move, FIELD_MIN_X, FIELD_MAX_X);
    unit.y = clamp(unit.y + (dy / len) * move + (BASE_Y - unit.y) * dt * 0.05, FIELD_MIN_Y, FIELD_MAX_Y);
  }

  function isAheadOf(unit, other) {
    return unit.team === "player" ? other.x >= unit.x - 6 : other.x <= unit.x + 6;
  }

  function ownBasePoint(team) {
    return team === "player" ? { x: PLAYER_BASE_X, y: BASE_Y } : { x: ENEMY_BASE_X, y: BASE_Y };
  }

  function enemyBasePoint(team) {
    return team === "player" ? { x: ENEMY_BASE_X, y: BASE_Y } : { x: PLAYER_BASE_X, y: BASE_Y };
  }

  function ownBaseHp(team) {
    return team === "player" ? state.playerHp : state.enemyHp;
  }

  function scoreAiCard(card) {
    const playerUnits = state.units.filter((unit) => unit.team === "player");
    const enemyUnits = state.units.filter((unit) => unit.team === "enemy");
    const woundedAllies = enemyUnits.filter((unit) => unit.hp < unit.maxHp).length;
    const cluster = largestCluster(playerUnits, card.splash || 34);
    let score = 30 - card.cost * 1.5;

    if (card.id === "runner" && playerUnits.length <= 1) score += 28;
    if (card.id === "guard" && playerUnits.length >= 2) score += 36;
    if (card.id === "bruiser" && playerUnits.some((unit) => unit.maxHp >= 220)) score += 34;
    if (card.id === "blaster" && playerUnits.length >= 1) score += 18;
    if (card.id === "sniper" && playerUnits.some((unit) => ["medic", "sniper", "frost", "spark"].includes(unit.card.id))) score += 44;
    if (card.id === "medic") score += woundedAllies ? 42 + woundedAllies * 8 : -24;
    if (card.id === "swarm" && playerUnits.some((unit) => unit.maxHp <= 150)) score += 26;
    if (card.id === "frost" && playerUnits.some((unit) => unit.card.speed >= 34 || unit.maxHp >= 220)) score += 36;
    if (card.id === "spark") score += cluster.count >= 2 ? 52 + cluster.count * 15 : -18;
    if (card.id === "mechanic") score += state.enemyHp < BASE_MAX_HP ? 50 + (BASE_MAX_HP - state.enemyHp) * 0.08 : woundedAllies * 8;
    if (state.playerHp < 340 && ["runner", "spark", "sniper"].includes(card.id)) score += 24;

    return score;
  }

  function pickAiDeployPoint(card) {
    const xJitter = () => (Math.random() - 0.5) * 18;
    const yJitter = () => (Math.random() - 0.5) * 28;
    const randomY = () => ENEMY_DEPLOY_MIN_Y + Math.random() * (ENEMY_DEPLOY_MAX_Y - ENEMY_DEPLOY_MIN_Y);
    const playerUnits = state.units.filter((unit) => unit.team === "player");
    const enemyUnits = state.units.filter((unit) => unit.team === "enemy");
    const frontX = ENEMY_DEPLOY_MIN_X + 8 + Math.random() * 14;
    const backX = ENEMY_DEPLOY_MAX_X - 8 - Math.random() * 18;
    let x = ENEMY_DEPLOY_MIN_X + Math.random() * (ENEMY_DEPLOY_MAX_X - ENEMY_DEPLOY_MIN_X);
    let y = randomY();

    if (["sniper", "blaster", "frost", "medic", "mechanic"].includes(card.id)) x = backX;
    if (["runner", "guard", "bruiser", "swarm", "spark"].includes(card.id)) x = frontX;

    if (card.id === "spark" && playerUnits.length) {
      const cluster = largestCluster(playerUnits, card.splash || 34);
      y = cluster.y + yJitter();
    } else if (card.id === "medic" && enemyUnits.length) {
      const anchor = enemyUnits.find((unit) => unit.hp < unit.maxHp) || enemyUnits[0];
      y = anchor.y + yJitter();
    } else if (card.id === "mechanic" && state.enemyHp < BASE_MAX_HP) {
      x = ENEMY_BASE_X + xJitter();
      y = BASE_Y + yJitter();
    } else if (playerUnits.length) {
      const front = playerUnits.reduce((best, unit) => (unit.x > best.x ? unit : best), playerUnits[0]);
      y = front.y + yJitter();
    }

    return {
      x: clamp(x, ENEMY_DEPLOY_MIN_X, ENEMY_DEPLOY_MAX_X),
      y: clamp(y, ENEMY_DEPLOY_MIN_Y, ENEMY_DEPLOY_MAX_Y),
    };
  }

  function largestCluster(units, radius) {
    let best = { count: 0, x: MID_X, y: BASE_Y };
    for (const unit of units) {
      let count = 0;
      let x = 0;
      let y = 0;
      for (const other of units) {
        if (Math.hypot(other.x - unit.x, other.y - unit.y) > radius) continue;
        count += 1;
        x += other.x;
        y += other.y;
      }
      if (count > best.count) best = { count, x: x / count, y: y / count };
    }
    return best;
  }

  function attack(unit, target) {
    const card = unit.card;
    if (target.kind === "unit" && target.target?.team === unit.team && (card.damage < 0 || card.allyRepair)) {
      const amount = card.allyRepair || Math.abs(card.damage);
      if (unit.team === "player" && card.id === "medic") {
        throwGyozaHeal(unit, target.target, amount, card.color);
      } else {
        repairUnit(target.target, amount, card.color, unit.x, unit.y);
      }
      return;
    }
    const damage = unitDamage(unit);
    if (damage < 0) return;
    if (target.kind === "ownBase") {
      repairBase(unit.team, card.repairBase);
      const base = ownBasePoint(unit.team);
      beam(unit.x, unit.y, base.x, base.y, card.color, true);
      return;
    }
    if (target.kind === "base") {
      const side = unit.team === "player" ? "enemy" : "player";
      const base = side === "enemy" ? { x: ENEMY_BASE_X, y: BASE_Y } : { x: PLAYER_BASE_X, y: BASE_Y };
      applyBaseDamage(side, Math.ceil(damage), unit);
      if (unit.team === "enemy") beam(unit.x, unit.y, base.x, base.y, card.color, false);
      else if (isNidhoggUnit(unit)) nidhoggFlameFx(nidhoggMouthX(unit), nidhoggMouthY(unit), base.x, base.y - 4, undefined, card.color);
      else if (isMeleeUnit(unit)) meleeHitFx(base.x, base.y - 3, card.color, 1.45);
      else beam(unit.x, unit.y, base.x, base.y, card.color, false);
      if (card.suicide && card.splash) {
        for (const other of state.units) {
          if (other.team === unit.team || other.id === unit.id || other.hp <= 0) continue;
          const dist = Math.hypot(other.x - base.x, other.y - base.y);
          if (dist <= card.splash) damageUnit(other, damage * 0.55);
          if (dist <= card.splash && card.splashKnockback) applyExplosionKnockback(other, base.x, base.y, card.splash, card.splashKnockback);
        }
        explosionFx(base.x, base.y, card.explosionColor || card.color, card.splash);
      }
    } else if (target.target) {
      if (isNidhoggUnit(unit)) nidhoggFlameAttack(unit, target.target, damage);
      else damageUnit(target.target, damage, true, true, unit);
      if (!isNidhoggUnit(unit) && card.suicide && card.splashKnockback) {
        applyExplosionKnockback(target.target, unit.x, unit.y, card.splash || 1, card.splashKnockback);
      }
      if (card.slow) {
        target.target.slowTimer = card.slowTime || 1.5;
        target.target.slowFactor = card.slow;
      }
      if (unit.team === "enemy" && isMeleeUnit(unit)) {
        meleeHitFx(target.target.x, target.target.y - target.target.card.radius + 7, card.color);
      } else if (unit.team === "enemy" && card.id === "blaster") {
        lightningFx(unit.x, unit.y, target.target.x, target.target.y, card.color);
      } else if (unit.team === "enemy") {
        beam(unit.x, unit.y, target.target.x, target.target.y, card.color, false);
      } else if (isNidhoggUnit(unit)) {
        // NIDHOGG draws its own purple flame in nidhoggFlameAttack.
      } else if (isMeleeUnit(unit)) meleeHitFx(target.target.x, target.target.y - target.target.card.radius + 7, card.color);
      else if (card.id === "blaster") fishingLine(unit.x, unit.y, target.target.x, target.target.y, card.color);
      else beam(unit.x, unit.y, target.target.x, target.target.y, card.color, false);
      if (card.splash) {
        for (const other of state.units) {
          if (other.team === unit.team || other.id === target.target.id || other.hp <= 0) continue;
          const dist = Math.hypot(other.x - target.target.x, other.y - target.target.y);
          if (dist <= card.splash) damageUnit(other, damage * 0.45, true, true, unit);
          if (dist <= card.splash && card.splashKnockback) applyExplosionKnockback(other, target.target.x, target.target.y, card.splash, card.splashKnockback);
        }
        if (card.suicide) explosionFx(target.target.x, target.target.y, card.explosionColor || card.color, card.splash);
        else burst(target.target.x, target.target.y, card.color, 18, 60);
      }
    }
    if (card.suicide) {
      unit.suicideVanish = true;
      unit.hp = 0;
    }
  }

  function damageUnit(unit, amount, playSound = true, showFloat = true, attacker = null) {
    if (unit.card.meleeImmune && attacker && isMeleeUnit(attacker)) {
      if (showFloat) floatText(unit.x, unit.y - 14, "MISS", "#dff6ff");
      return;
    }
    const finalAmount = amount * (unit.card.armor || 1);
    unit.hp -= finalAmount;
    unit.hitFlash = 1;
    if (showFloat) floatText(unit.x, unit.y - 14, `-${Math.ceil(finalAmount)}`, "#fff");
    if (playSound) playHitSound();
    if (unit.hp <= 0) burst(unit.x, unit.y, unit.card.color, 12, 52);
  }

  function nidhoggFlameAttack(unit, target, damage) {
    const sx = nidhoggMouthX(unit);
    const sy = nidhoggMouthY(unit);
    const ex = target.x;
    const ey = target.y - target.card.radius * 0.35;
    const ticks = Math.round(NIDHOGG_FLAME_DURATION / NIDHOGG_FLAME_TICK);
    const particle = nidhoggFlameFx(sx, sy, ex, ey, NIDHOGG_FLAME_DURATION, unit.card.color);
    state.nidhoggFlames.push({
      unitId: unit.id,
      targetId: target.id,
      team: unit.team,
      particle,
      x1: sx,
      y1: sy,
      x2: ex,
      y2: ey,
      damageLeft: damage,
      damagePerTick: damage / ticks,
      ticksLeft: ticks,
      tick: NIDHOGG_FLAME_TICK,
      life: NIDHOGG_FLAME_DURATION,
    });
    playHitSound();
  }

  function isInNidhoggFlame(x1, y1, x2, y2, px, py) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy || 1;
    const t = clamp(((px - x1) * dx + (py - y1) * dy) / lenSq, 0, 1);
    const cx = x1 + dx * t;
    const cy = y1 + dy * t;
    const dist = Math.hypot(px - cx, py - cy);
    const radius = 8 + t * 15;
    return dist <= radius;
  }

  function triggerDeathEffect(unit) {
    const ex = unit.card.deathExplosion;
    if (!ex) return;
    explosionFx(unit.x, unit.y, unit.card.explosionColor || "#25324a", ex.radius);
    const dir = unit.team === "player" ? 1 : -1;
    for (const other of state.units) {
      if (other.team === unit.team || other.id === unit.id || other.hp <= 0) continue;
      const dist = Math.hypot(other.x - unit.x, other.y - unit.y);
      if (dist > ex.radius) continue;
      damageUnit(other, ex.damage, false);
      applyKnockback(other, dir * (ex.knockback || 28), (other.y >= unit.y ? 1 : -1) * 14, 0.38, 18);
    }
  }

  function applyKnockback(unit, dx, dy, duration = 0.38, height = 18) {
    unit.knockStartX = unit.x;
    unit.knockStartY = unit.y;
    unit.knockTargetX = clamp(unit.x + dx, FIELD_MIN_X, FIELD_MAX_X);
    unit.knockTargetY = clamp(unit.y + dy, FIELD_MIN_Y, FIELD_MAX_Y);
    unit.knockHeight = height;
    unit.knockDuration = duration;
    unit.knockTimer = 0.001;
    unit.state = "knockback";
    unit.attackTimer = Math.max(unit.attackTimer, duration + 0.08);
  }

  function applyExplosionKnockback(unit, cx, cy, radius, force) {
    if (!unit || unit.hp <= 0) return;
    const dx = unit.x - cx;
    const dy = unit.y - cy;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const falloff = clamp(1.15 - dist / Math.max(1, radius), 0.42, 1);
    const push = force * falloff;
    applyKnockback(unit, (dx / dist) * push, (dy / dist) * push * 0.46, 0.42, 24);
  }

  function applyUnitRepair(unit, amount, color) {
    const repaired = Math.min(amount, unit.maxHp - unit.hp);
    if (repaired <= 0) return 0;
    unit.hp += repaired;
    floatText(unit.x, unit.y - 12, `+${Math.ceil(repaired)}`, color);
    playRepairSound();
    return repaired;
  }

  function repairUnit(unit, amount, color, fromX, fromY) {
    const repaired = applyUnitRepair(unit, amount, color);
    if (repaired <= 0) return;
    beam(fromX, fromY, unit.x, unit.y, color, true);
  }

  function throwGyozaHeal(fromUnit, target, amount, color) {
    if (!fromUnit || !target || target.hp <= 0 || target.hp >= target.maxHp) return;
    const sx = fromUnit.x + (fromUnit.team === "player" ? 6 : -6);
    const sy = fromUnit.y - fromUnit.card.radius - 8;
    const tx = target.x;
    const ty = target.y - target.card.radius - 4;
    const dist = Math.hypot(tx - sx, ty - sy);
    const duration = clamp(0.32 + dist / 300, 0.34, 0.68);
    state.particles.push({
      gyozaHeal: true,
      targetId: target.id,
      sx,
      sy,
      tx,
      ty,
      amount,
      color,
      life: duration,
      maxLife: duration,
      arc: 20 + Math.min(20, dist * 0.18),
      spin: (Math.random() < 0.5 ? -1 : 1) * (5.2 + Math.random() * 1.6),
    });
  }

  function applyBaseDamage(side, amount, attacker = null) {
    if (activeEnemyInvincible && side === "enemy") return;
    const beforeHp = side === "enemy" ? state.enemyHp : state.playerHp;
    const beforeSegments = baseSegmentsRemaining(beforeHp);
    if (side === "enemy") state.enemyHp -= amount;
    else state.playerHp -= amount;
    const afterHp = side === "enemy" ? state.enemyHp : state.playerHp;
    const afterSegments = baseSegmentsRemaining(afterHp);
    state.shake = Math.min(7, state.shake + 3);
    const base = side === "enemy" ? { x: ENEMY_BASE_X, y: BASE_Y } : { x: PLAYER_BASE_X, y: BASE_Y };
    floatText(base.x, base.y - 28, `-${amount}`, "#fff");
    playBaseHitSound();
    const startsFinisher = side === "enemy" && beforeHp > 0 && afterHp <= 0 && attacker?.team === "player";
    if (startsFinisher) {
      startFinisher(attacker);
    }
    if (!startsFinisher) {
      for (let i = afterSegments; i < beforeSegments; i += 1) triggerBaseSegmentBreak(side);
    }
  }

  function startFinisher(unit) {
    if (state.finisher || !unit) return;
    unit.hp = Math.max(1, unit.hp);
    unit.exiting = false;
    unit.knockTimer = unit.knockDuration || 0;
    unit.attackTimer = 999;
    unit.state = "finisher";
    state.shake = Math.max(state.shake, 8);
    state.speedFever = { team: null, timer: 0, duration: 0 };
    state.feverSfxTimer = 0;
    state.finisher = {
      unitId: unit.id,
      timer: 0,
      duration: FINISHER_DURATION,
      startX: unit.x,
      startY: unit.y,
      targetX: Math.min(PHONE_BRAWL_W - 22, ENEMY_BASE_X + 38),
      targetY: BASE_Y + 24,
      slashY: BASE_Y + 2,
      burstDone: false,
      done: false,
    };
  }

  function updateFinisher(dt) {
    const fx = state.finisher;
    if (!fx) return;
    if (fx.done && state.victoryCelebration) {
      updateVictoryCelebration(dt);
      return;
    }
    const slowDt = dt * 0.08;
    fx.timer += dt;
    state.elapsed += slowDt;
    const p = clamp(fx.timer / fx.duration, 0, 1);
    const moveP = clamp((p - 0.08) / 0.5, 0, 1);
    const eased = 1 - Math.pow(1 - moveP, 3.2);
    const unit = state.units.find((u) => u.id === fx.unitId);
    if (unit) {
      unit.hp = Math.max(1, unit.hp);
      unit.x = fx.startX + (fx.targetX - fx.startX) * eased;
      unit.y = fx.startY + (fx.targetY - fx.startY) * eased - Math.sin(moveP * Math.PI) * 18;
      unit.bob += slowDt * 22;
      unit.state = "finisher";
      unit.attackTimer = 999;
    }
    if (p >= 0.58 && !fx.burstDone) {
      const rumble = clamp((p - 0.58) / 0.2, 0, 1);
      state.shake = Math.max(state.shake, 4 + rumble * 14);
    }
    if (p >= 0.78 && !fx.burstDone) {
      fx.burstDone = true;
      fx.burstAt = fx.timer;
      state.enemyHp = 0;
      state.shake = Math.max(state.shake, 22);
      bossFinalExplosionFx(ENEMY_BASE_X, BASE_Y);
    }
    if (fx.burstDone && fx.timer - fx.burstAt >= 2 && !fx.done) {
      fx.done = true;
      state.enemyHp = 0;
      startVictoryCelebration();
    }
  }

  function startVictoryCelebration() {
    state.units = state.units.filter((unit) => unit.team === "player");
    state.victoryCelebration = {
      timer: 0,
      duration: 2.6,
      hold: 5,
      whiteout: true,
      blastX: ENEMY_BASE_X,
      blastY: BASE_Y,
    };
    state.result = "victory";
    state.resultText = "";
    playResultSound("victory");
  }

  function updateVictoryCelebration(dt) {
    const celebration = state.victoryCelebration;
    if (!celebration) return;
    celebration.timer += dt;
    state.elapsed += dt;
    if (celebration.whiteout) {
      const p = clamp(celebration.timer / Math.max(0.01, celebration.duration), 0, 1);
      state.shake = Math.max(state.shake, Math.max(0, 10 * (1 - p)));
    }
    if (celebration.whiteout && celebration.timer >= celebration.duration + celebration.hold) {
      finishVictoryWhiteout();
      return;
    }
    if (celebration.whiteout) return;
    for (const unit of state.units) {
      if (unit.team !== "player" || unit.hp <= 0) continue;
      unit.state = "victory";
      unit.bob += dt * 8.5;
      unit.attackTimer = 999;
    }
  }

  function finishVictoryWhiteout() {
    const payload = {
      result: "victory",
      playerHp: Math.max(0, state.playerHp | 0),
      enemyHp: 0,
      elapsed: state.elapsed,
    };
    if (gameOverAction === "close") {
      close();
      if (!endedOnce && typeof onEnd === "function") {
        endedOnce = true;
        onEnd(payload);
      }
    } else {
      if (endTiming === "result" && !endedOnce && typeof onEnd === "function") {
        endedOnce = true;
        onEnd(payload);
      }
      reset();
    }
  }

  function confirmVictoryCelebration() {
    const celebration = state.victoryCelebration;
    if (celebration?.whiteout) return;
    if (!celebration || celebration.timer < celebration.acceptAfter) return;
    playResetSound();
    const payload = {
      result: "victory",
      playerHp: Math.max(0, state.playerHp | 0),
      enemyHp: 0,
      elapsed: state.elapsed,
    };
    if (gameOverAction === "close") {
      close();
      if (!endedOnce && typeof onEnd === "function") {
        endedOnce = true;
        onEnd(payload);
      }
    } else {
      if (endTiming === "result" && !endedOnce && typeof onEnd === "function") {
        endedOnce = true;
        onEnd(payload);
      }
      reset();
    }
  }

  function baseSegmentsRemaining(hp) {
    return Math.max(0, Math.ceil(Math.max(0, hp) / BASE_SEGMENT_HP));
  }

  function triggerBaseSegmentBreak(side) {
    const base = side === "enemy" ? { x: ENEMY_BASE_X, y: BASE_Y } : { x: PLAYER_BASE_X, y: BASE_Y };
    const attackerTeam = side === "enemy" ? "player" : "enemy";
    const color = side === "enemy" ? "#ef5b5b" : "#4fd18b";
    baseBreakExplosionFx(base.x, base.y, color);
    state.baseBreaks.push({ x: base.x, y: base.y, color, life: 0.62, maxLife: 0.62 });
    state.shake = Math.min(16, state.shake + 9);
    floatText(base.x, base.y + 30, "BREAK", "#f1c84b", 1.05);
    for (const unit of state.units) {
      if (unit.team !== attackerTeam || unit.hp <= 0) continue;
      if (state.finisher?.unitId === unit.id) continue;
      if (!isInBaseBreakBlastZone(unit, side)) continue;
      damageUnit(unit, BASE_SEGMENT_DAMAGE, false);
      if (unit.hp <= 0) continue;
      const dir = side === "enemy" ? -1 : 1;
      const spread = unit.y >= BASE_Y ? 1 : -1;
      const distanceFalloff = clamp(1.2 - Math.abs(unit.x - base.x) / 260, 0.55, 1.1);
      unit.knockStartX = unit.x;
      unit.knockStartY = unit.y;
      unit.knockTargetX = clamp(unit.x + dir * BASE_SEGMENT_KNOCKBACK * distanceFalloff, FIELD_MIN_X, FIELD_MAX_X);
      unit.knockTargetY = clamp(unit.y + spread * (22 + Math.random() * 26), FIELD_MIN_Y, FIELD_MAX_Y);
      unit.knockHeight = BASE_SEGMENT_KNOCK_HEIGHT + Math.random() * 18;
      unit.knockDuration = BASE_SEGMENT_KNOCK_DURATION + Math.random() * 0.18;
      unit.knockTimer = 0.001;
      unit.state = "knockback";
      unit.attackTimer = Math.max(unit.attackTimer, unit.knockDuration + 0.12);
      unit.bob += Math.PI * 0.8;
    }
    playBaseHitSound();
  }

  function isInBaseBreakBlastZone(unit, damagedSide) {
    return damagedSide === "enemy" ? unit.x >= MID_X : unit.x <= MID_X;
  }

  function repairBase(team, amount) {
    if (team === "player") state.playerHp = Math.min(BASE_MAX_HP, state.playerHp + amount);
    else state.enemyHp = Math.min(BASE_MAX_HP, state.enemyHp + amount);
    const base = ownBasePoint(team);
    floatText(base.x, base.y - 28, `+${amount}`, "#4fd18b");
    playRepairSound();
  }

  function distanceToBase(x, y, baseX, baseY) {
    const halfW = 22;
    const halfH = 26;
    const dx = Math.max(Math.abs(x - baseX) - halfW, 0);
    const dy = Math.max(Math.abs(y - baseY) - halfH, 0);
    return Math.hypot(dx, dy);
  }

  function checkGameOver() {
    if (state.finisher) return;
    let result = "";
    let text = "";
    if (state.enemyHp <= 0) {
      result = "victory";
      text = "RIVAL PHONE DOWN";
    } else if (state.playerHp <= 0) {
      startDefeatChoice();
      return;
    }
    if (!result) return;
    finishGame(result, text);
  }

  function startDefeatChoice() {
    if (state.defeatChoice || state.gameOverFall) return;
    state.result = "defeat";
    state.resultText = "YOUR PHONE CRACKED";
    state.defeatChoice = { selected: 0, timer: 0, explosionTimer: 0, showAfter: 2 };
    state.shake = Math.max(state.shake, 10);
    playResultSound("defeat");
  }

  function updateDefeatChoice(dt) {
    const choice = state.defeatChoice;
    if (!choice) return;
    choice.timer += dt;
    choice.explosionTimer -= dt;
    state.elapsed += dt * 0.35;
    if (choice.explosionTimer <= 0) {
      choice.explosionTimer = 0.16 + Math.random() * 0.16;
      const x = PLAYER_BASE_X + (Math.random() - 0.5) * 58;
      const y = BASE_Y + (Math.random() - 0.5) * 74;
      explosionFx(x, y, Math.random() > 0.45 ? "#4fd18b" : "#f7f2e8", 22 + Math.random() * 24);
      state.shake = Math.max(state.shake, 5 + Math.random() * 6);
      playBaseHitSound();
    }
  }

  function moveDefeatChoice(dir) {
    if (!state.defeatChoice || state.defeatChoice.timer < state.defeatChoice.showAfter) return;
    state.defeatChoice.selected = dir > 0 ? 1 : 0;
    playSelectSound();
  }

  function confirmDefeatChoice() {
    const choice = state.defeatChoice;
    if (!choice) return;
    if (choice.timer < choice.showAfter) return;
    if (choice.selected === 0) {
      playResetSound();
      reset();
      return;
    }
    if (activeGiveUpAction === "interventionReturn") {
      startGameOverFall({ intervention: true, result: "giveup" });
      return;
    }
    if (activeGiveUpAction === "return") {
      finishGiveUp();
      return;
    }
    startGameOverFall();
  }

  function finishGiveUp() {
    playResetSound();
    state.result = "giveup";
    state.resultText = "GIVE UP";
    const payload = {
      result: "giveup",
      playerHp: 0,
      enemyHp: Math.max(0, state.enemyHp | 0),
      elapsed: state.elapsed,
    };
    if (gameOverAction === "close") {
      close();
      if (!endedOnce && typeof onEnd === "function") {
        endedOnce = true;
        onEnd(payload);
      }
    } else {
      if (endTiming === "result" && !endedOnce && typeof onEnd === "function") {
        endedOnce = true;
        onEnd(payload);
      }
      reset();
    }
  }

  function startGameOverFall(options = {}) {
    const intervention = !!options.intervention;
    const gameOverText = intervention ? "GAME OVER?" : "GAME OVER";
    const letterStartX = intervention ? MID_X - 81 : MID_X - 72;
    const lastLetterDelay = (gameOverText.length - 1) * 0.12;
    stopGameOverBgm();
    state.defeatChoice = null;
    state.gameOverFall = {
      timer: 0,
      acceptAfter: 4.8,
      intervention,
      result: options.result || "defeat",
      phase: "letters",
      phaseTimer: 0,
      dialogAt: intervention ? lastLetterDelay + 0.82 + 4 : 0,
      shatter: null,
      letters: gameOverText.split("").map((ch, i) => ({
        ch,
        x: letterStartX + i * 18,
        targetY: 154,
        y: -34 - i * 18,
        delay: i * 0.12,
      })),
    };
    state.particles = [];
    state.floating = [];
    state.baseBreaks = [];
    state.effectPops = [];
    state.shake = 0;
    playResultSound("defeat");
  }

  function stopGameOverBgm() {
    stopBgm();
    stopHeartbeat();
  }

  function updateGameOverFall(dt) {
    const over = state.gameOverFall;
    if (!over) return;
    over.timer += dt;
    if (!over.intervention) return;

    if (over.phase === "letters" && over.timer >= over.dialogAt) {
      over.phase = "dialog";
      over.phaseTimer = 0;
      playSelectSound();
      return;
    }
    if (over.phase === "dialog") {
      over.phaseTimer += dt;
      return;
    }
    if (over.phase === "shatter") {
      over.shatter.timer += dt;
      if (over.shatter.timer >= over.shatter.duration) {
        finishInterventionGameOver();
      }
    }
  }

  function confirmGameOverFall() {
    const over = state.gameOverFall;
    if (!over || over.timer < over.acceptAfter) return;
    if (over.intervention) {
      if (over.phase !== "dialog") return;
      const textLength = [..."ちょっとまったー！"].length;
      const visibleCount = Math.min(textLength, Math.floor((over.phaseTimer * 1000) / 60));
      if (visibleCount < textLength) {
        over.phaseTimer = (textLength * 60) / 1000;
        input?.clear?.();
        return;
      }
      over.phase = "shatterPending";
      over.phaseTimer = 0;
      setTimeout(() => {
        if (state.gameOverFall === over && over.phase === "shatterPending") finishInterventionGameOver();
      }, 1200);
      input?.clear?.();
      return;
    }
    playResetSound();
    state.result = "defeat";
    state.resultText = "GAME OVER";
    const payload = {
      result: "defeat",
      playerHp: 0,
      enemyHp: Math.max(0, state.enemyHp | 0),
      elapsed: state.elapsed,
    };
    if (gameOverAction === "close") {
      close();
      if (!endedOnce && typeof onEnd === "function") {
        endedOnce = true;
        onEnd(payload);
      }
    } else {
      if (endTiming === "result" && !endedOnce && typeof onEnd === "function") {
        endedOnce = true;
        onEnd(payload);
      }
      reset();
    }
  }

  function finishInterventionGameOver() {
    if (endedOnce) return;
    const payload = {
      result: state.gameOverFall?.result || "giveup",
      playerHp: 0,
      enemyHp: Math.max(0, state.enemyHp | 0),
      elapsed: state.elapsed,
    };
    endedOnce = true;
    close();
    if (typeof onEnd === "function") {
      onEnd(payload);
    }
  }

  function finishGame(result, text) {
    if (state.gameOver) return;
    state.gameOver = true;
    state.result = result;
    state.resultText = text;
    playResultSound(result);
    if (endTiming === "result" && !endedOnce && typeof onEnd === "function") {
      endedOnce = true;
      onEnd(resultPayload());
    }
  }

  function confirmGameOver() {
    if (!state.gameOver) return;
    playResetSound();
    if (gameOverAction === "close") {
      finishAndClose();
    } else {
      reset();
    }
  }

  function finishAndClose() {
    const payload = resultPayload();
    close();
    if (!endedOnce && typeof onEnd === "function") {
      endedOnce = true;
      onEnd(payload);
    }
  }

  function resultPayload() {
    return {
      result: state.result,
      playerHp: Math.max(0, state.playerHp | 0),
      enemyHp: Math.max(0, state.enemyHp | 0),
      elapsed: state.elapsed,
    };
  }

  function draw(ctx) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.textBaseline = "alphabetic";
    ctx.clearRect(0, 0, PHONE_BRAWL_W, PHONE_BRAWL_H);
    if (state.gameOverFall) {
      drawGameOverFall(ctx);
      ctx.restore();
      return;
    }
    if (state.shake > 0) ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    const finisher = state.finisher;
    if (finisher) {
      drawArena(ctx);
      ctx.save();
      applyFinisherCamera(ctx, finisher);
    }
    state.lightBoostVisuals = state.units.length >= BOOST_LIGHT_UNIT_THRESHOLD;
    drawArena(ctx);
    drawSpeedFever(ctx);
    drawBase(ctx, ENEMY_BASE_X, BASE_Y, "enemy");
    drawBase(ctx, PLAYER_BASE_X, BASE_Y, "player");
    if (!finisher && !state.victoryCelebration) drawPlayer(ctx);
    drawHazards(ctx);
    ctx._phoneBrawlLightBoostVisuals = state.lightBoostVisuals;
    for (const unit of [...state.units].sort((a, b) => a.y - b.y)) drawUnit(ctx, unit);
    ctx._phoneBrawlLightBoostVisuals = false;
    drawParticles(ctx);
    drawEffectPops(ctx);
    drawPepperThrows(ctx);
    drawBaseBreaks(ctx);
    drawFloating(ctx);
    if (finisher) {
      drawFinisherCinematic(ctx, finisher);
      ctx.restore();
      drawFinisherOverlay(ctx, finisher);
      if (state.victoryCelebration) drawVictoryCelebration(ctx);
    } else if (state.victoryCelebration) {
      drawVictoryCelebration(ctx);
    } else if (state.defeatChoice) {
      drawDefeatChoice(ctx);
    } else {
      drawTopUi(ctx);
      drawControls(ctx);
      drawCardFlights(ctx);
    }
    if (state.gameOver) drawResult(ctx);
    ctx.restore();
  }

  function applyFinisherCamera(ctx, fx) {
    const p = clamp(fx.timer / fx.duration, 0, 1);
    const a = 1 - Math.pow(1 - clamp(p / 0.42, 0, 1), 3);
    const scale = 1 + a * 0.42;
    const focusX = ENEMY_BASE_X;
    const focusY = BASE_Y + 8;
    const screenX = MID_X;
    const screenY = BASE_Y + 18;
    ctx.translate(screenX, screenY);
    ctx.scale(scale, scale);
    ctx.translate(-focusX, -focusY);
  }

  function drawFinisherCinematic(ctx, fx) {
    const p = clamp(fx.timer / fx.duration, 0, 1);
    const lineP = clamp((p - 0.23) / 0.14, 0, 1);
    const lineW = PHONE_BRAWL_W * (1 - Math.pow(1 - lineP, 3.4));
    const y = fx.slashY + Math.sin(p * Math.PI) * 3;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.9 * (1 - clamp((p - 0.5) / 0.22, 0, 1));
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(ENEMY_BASE_X + 46 - lineW, y - 1, lineW, 2);
    ctx.fillStyle = "#4ecbe2";
    ctx.fillRect(ENEMY_BASE_X + 42 - lineW * 0.72, y - 5, lineW * 0.72, 2);
    ctx.fillStyle = "#ff00e6";
    ctx.fillRect(ENEMY_BASE_X + 38 - lineW * 0.5, y + 4, lineW * 0.5, 2);
    ctx.globalAlpha = 0.18 * (1 - clamp((p - 0.52) / 0.18, 0, 1));
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, y - 13, PHONE_BRAWL_W, 1);
    ctx.fillRect(0, y + 13, PHONE_BRAWL_W, 1);
    ctx.restore();
  }

  function drawFinisherOverlay(ctx, fx) {
    const p = clamp(fx.timer / fx.duration, 0, 1);
    const a = 0.62 * (1 - clamp((p - 0.9) / 0.1, 0, 1));
    ctx.save();
    const damageFlash = clamp(1 - p / 0.16, 0, 1);
    const burstFlash = clamp(1 - Math.abs(p - 0.78) / 0.13, 0, 1);
    const rumbleFlash = p > 0.58 && p < 0.78 && Math.sin(state.elapsed * 78) > 0 ? 0.12 : 0;
    const flashA = Math.min(0.72, damageFlash * 0.5 + burstFlash * 0.68 + rumbleFlash);
    if (flashA > 0) {
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = flashA;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, PHONE_BRAWL_W, PHONE_BRAWL_H);
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.globalAlpha = a;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, PHONE_BRAWL_W, 18);
    ctx.fillRect(0, PHONE_BRAWL_H - 18, PHONE_BRAWL_W, 18);
    ctx.restore();
  }

  function drawVictoryCelebration(ctx) {
    const celebration = state.victoryCelebration;
    if (!celebration) return;
    if (celebration.whiteout) {
      const p = clamp(celebration.timer / Math.max(0.01, celebration.duration), 0, 1);
      ctx.save();
      if (p < 0.92) {
        const shake = (1 - p) * 10 + Math.sin(celebration.timer * 58) * 1.5;
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      }
      ctx.globalAlpha = clamp((p - 0.62) / 0.38, 0, 1);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, PHONE_BRAWL_W, PHONE_BRAWL_H);
      ctx.restore();
      return;
    }
    const p = Math.min(1, celebration.timer / 0.45);
    const pulse = 1 + Math.sin(celebration.timer * Math.PI * 3.2) * 0.035;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.fillRect(0, 0, PHONE_BRAWL_W, PHONE_BRAWL_H);
    ctx.translate(MID_X, 143);
    ctx.scale(pulse, pulse);
    ctx.textAlign = "center";
    ctx.font = "32px PixelMplus10";
    ctx.fillStyle = "#050507";
    ctx.fillText("YOU WIN!", 2, 2);
    ctx.fillStyle = "#f7f2e8";
    ctx.fillText("YOU WIN!", 0, 0);
    ctx.restore();

    if (celebration.timer >= celebration.acceptAfter) {
      const blink = Math.sin(celebration.timer * Math.PI * 3) > -0.15;
      if (blink) {
        ctx.save();
        ctx.globalAlpha = 0.82;
        ctx.fillStyle = "#bdb5a8";
        ctx.font = "10px PixelMplus10";
        ctx.textAlign = "center";
        const ok = controlPrompt("z", { mobile });
        drawFixedPixelText(ctx, gameOverAction === "close" ? ok + " : BACK" : ok + " : AGAIN", MID_X, 185, 5);
        ctx.restore();
      }
    }
  }

  function drawDefeatChoice(ctx) {
    const choice = state.defeatChoice;
    if (!choice) return;
    if (choice.timer < choice.showAfter) return;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.58)";
    ctx.fillRect(0, 0, PHONE_BRAWL_W, PHONE_BRAWL_H);
    ctx.font = "18px PixelMplus10";
    ctx.textAlign = "left";
    const items = ["CONTINUE", "GIVE UP"];
    const blink = Math.sin(choice.timer / 0.35) > 0;
    for (let i = 0; i < items.length; i += 1) {
      const text = items[i];
      const y = i === 0 ? 144 : 178;
      const x = (MID_X - ctx.measureText(text).width / 2) | 0;
      const selected = choice.selected === i;
      ctx.fillStyle = selected ? "#f7f2e8" : "#888";
      if (selected && blink) ctx.fillText("▶", x - 24, y);
      ctx.fillText(text, x, y);
    }
    ctx.restore();
  }

  function drawGameOverFall(ctx) {
    const over = state.gameOverFall;
    if (over?.phase === "shatterPending") {
      beginGameOverShatter(ctx, over);
    }
    if (over?.phase === "shatter" && over.shatter) {
      drawGameOverShatter(ctx, over);
      return;
    }
    drawGameOverFallScene(ctx, over, true);
  }

  function drawGameOverFallScene(ctx, over, showPrompt) {
    ctx.save();
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, PHONE_BRAWL_W, PHONE_BRAWL_H);
    if (!over) {
      ctx.restore();
      return;
    }
    ctx.textAlign = "center";
    ctx.font = "30px PixelMplus10";
    for (const letter of over.letters) {
      if (letter.ch === " ") continue;
      const local = over.timer - letter.delay;
      if (local < 0) continue;
      const p = clamp(local / 0.82, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3.4);
      const bounce = p >= 1 ? Math.sin((local - 0.82) * Math.PI * 3.8) * 1.4 : 0;
      const y = letter.y + (letter.targetY - letter.y) * eased + bounce;
      ctx.fillStyle = "#1a0000";
      ctx.fillText(letter.ch, letter.x + 2, y + 2);
      ctx.fillStyle = "#ef1d2f";
      ctx.fillText(letter.ch, letter.x, y);
    }
    if (over.intervention && (over.phase === "dialog" || over.phase === "shatterPending")) {
      drawGameOverInterventionDialog(ctx);
    } else if (showPrompt && !over.intervention && over.timer >= over.acceptAfter) {
      const blink = Math.sin(over.timer * Math.PI * 3) > -0.15;
      if (blink) {
        ctx.font = "10px PixelMplus10";
        ctx.fillStyle = "#bdb5a8";
        drawFixedPixelText(ctx, controlPrompt("z", { mobile }) + " : TITLE", MID_X, 206, 5);
      }
    }
    ctx.restore();
  }

  function drawGameOverInterventionDialog(ctx) {
    const over = state.gameOverFall;
    ctx.save();
    ctx.scale(GAME_DIALOG_SCALE, GAME_DIALOG_SCALE);
    const x = 8;
    const y = GAME_DIALOG_BASE_H - 55 - 8;
    const w = GAME_DIALOG_BASE_W - 16;
    const h = 55;
    const text = "ちょっとまったー！";
    const visibleCount = over?.phase === "shatterPending"
      ? [...text].length
      : Math.min([...text].length, Math.floor(((over?.phaseTimer || 0) * 1000) / 60));
    const visibleText = [...text].slice(0, visibleCount).join("");

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x + 3, y + 3, w, h);
    ctx.fillStyle = "#000";
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = "#000";
    ctx.fillRect(x - 1, y - 1, w + 2, 1);
    ctx.fillRect(x - 1, y + h, w + 2, 1);
    ctx.fillRect(x - 1, y - 1, 1, h + 2);
    ctx.fillRect(x + w, y - 1, 1, h + 2);

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

    ctx.font = "normal 10px PixelMplus10";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#fff";
    ctx.fillText(visibleText, x + 10, y + 9);

    if (visibleCount >= [...text].length) {
      const tx = x + w - 10;
      const ty = y + h - 10;
      ctx.beginPath();
      ctx.moveTo(tx - 4, ty);
      ctx.lineTo(tx + 4, ty);
      ctx.lineTo(tx, ty + 5);
      ctx.closePath();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.fill();
    }
    ctx.restore();
  }

  function beginGameOverShatter(ctx, over) {
    const off = document.createElement("canvas");
    off.width = PHONE_BRAWL_W;
    off.height = PHONE_BRAWL_H;
    const offCtx = off.getContext("2d");
    offCtx.imageSmoothingEnabled = false;
    drawGameOverFallScene(offCtx, over, false);

    const cols = 10;
    const rows = 8;
    const sw = PHONE_BRAWL_W / cols;
    const sh = PHONE_BRAWL_H / rows;
    const shards = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const sx = c * sw;
        const sy = r * sh;
        const dx = sx + sw / 2 - MID_X;
        const dy = sy + sh / 2 - PHONE_BRAWL_H / 2;
        const dist = Math.hypot(dx, dy) || 1;
        const speed = 0.42 + Math.random() * 0.32;
        shards.push({
          sx, sy,
          vx: (dx / dist) * speed + (Math.random() - 0.5) * 0.2,
          vy: (dy / dist) * speed + (Math.random() - 0.5) * 0.2,
          rotSpeed: (Math.random() - 0.5) * 0.016,
        });
      }
    }
    over.shatter = { off, shards, timer: 0, duration: 0.78, flashUntil: 0.12 };
    over.phase = "shatter";
    playGlassShatter();
    setTimeout(() => {
      if (state.gameOverFall === over && over.phase === "shatter") finishInterventionGameOver();
    }, (over.shatter.duration * 1000) + 120);
  }

  function drawGameOverShatter(ctx, over) {
    const fx = over.shatter;
    const elapsed = fx.timer * 1000;
    const progress = clamp(fx.timer / fx.duration, 0, 1);
    const sw = PHONE_BRAWL_W / 10;
    const sh = PHONE_BRAWL_H / 8;
    ctx.save();
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, PHONE_BRAWL_W, PHONE_BRAWL_H);
    for (const s of fx.shards) {
      const px = s.sx + s.vx * elapsed;
      const py = s.sy + s.vy * elapsed;
      const rot = s.rotSpeed * elapsed;
      const a = Math.max(0, 1 - progress * 1.35);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate((px + sw / 2) | 0, (py + sh / 2) | 0);
      ctx.rotate(rot);
      ctx.drawImage(fx.off, s.sx, s.sy, sw, sh, (-sw / 2) | 0, (-sh / 2) | 0, sw, sh);
      ctx.restore();
    }
    if (fx.timer < fx.flashUntil) {
      ctx.globalAlpha = 1 - fx.timer / fx.flashUntil;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, PHONE_BRAWL_W, PHONE_BRAWL_H);
    }
    ctx.restore();
  }

  function drawArena(ctx) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, PHONE_BRAWL_W, PHONE_BRAWL_H);
    drawSpaceBackdrop(ctx);

    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(MID_X, FIELD_Y + 16);
    ctx.lineTo(MID_X, FIELD_Y + FIELD_H - 16);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawSpaceBackdrop(ctx) {
    const t = state.elapsed * 1000;
    for (const s of SPACE_STARS) {
      const tw = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
      ctx.globalAlpha = s.a * (0.55 + tw * 0.45);
      ctx.fillStyle = "#fff";
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;
  }

  function drawTopUi(ctx) {
    drawHudBand(ctx, 0, 0, PHONE_BRAWL_W, TOP_H, "#23212a", "#101116");
    drawBaseHpPanel(ctx, 5, 3, 170, 18, "EARTH", state.playerHp, "#4fd18b", false);
    drawBaseHpPanel(ctx, PHONE_BRAWL_W - 175, 3, 170, 18, "BOSS", state.enemyHp, "#ef5b5b", true);
  }

  function drawControls(ctx) {
    drawHudBand(ctx, 0, 262, PHONE_BRAWL_W, 98, "#28232d", "#17161d");
    drawPowPanel(ctx, 6, ENERGY_Y - 6, PHONE_BRAWL_W - 12, 22, state.energy);
    drawHandCyclePrompt(ctx);

    const cardW = HAND_CARD_W;
    const centerX = HAND_CENTER_X;
    const spacing = HAND_SPACING;
    for (const offset of [-2, 2, -1, 1, 0]) {
      const card = handCardAtOffset(offset);
      const depth = Math.abs(offset);
      const y = HAND_Y + (depth === 0 ? -4 : 3);
      const entry = handEntryFor(card);
      const p = entry ? clamp(entry.t / entry.duration, 0, 1) : 1;
      const eased = 1 - Math.pow(1 - p, 3);
      drawWheelCard(ctx, card, centerX + offset * spacing, y + (1 - eased) * 42, cardW, HAND_H, offset === 0, entry ? 0.25 + eased * 0.75 : 1);
    }
  }

  function drawHandCyclePrompt(ctx) {
    const x = 10;
    const y = HAND_Y + 35;
    const pulse = 0.5 + Math.sin(state.elapsed * 5.5) * 0.5;
    const press = clamp(state.handCyclePressTimer / 0.13, 0, 1);
    const pressX = press > 0 ? 2 : 0;
    const pressY = press > 0 ? 1 : 0;
    ctx.save();
    drawPixelLeftTriangleButton(ctx, x - 5 + pressX, y + pressY, 0.78 + pulse * 0.12 - press * 0.2);
    ctx.fillStyle = "#f7f2e8";
    drawCrispControlGlyph(ctx, controlPrompt("x", { mobile }), (x + 3 + pressX) | 0, (y - 4 + pressY) | 0);
    ctx.restore();
  }

  function drawPixelLeftTriangle(ctx, x, y) {
    const rows = [1, 3, 5, 7, 9, 11, 11, 9, 7, 5, 3, 1];
    const max = 11;
    for (let i = 0; i < rows.length; i += 1) {
      const w = rows[i];
      ctx.fillRect(x + max - w, y - 6 + i, w, 1);
    }
  }

  function drawPixelLeftTriangleButton(ctx, x, y, alpha) {
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    drawPixelLeftTriangle(ctx, x + 2, y + 2);
    ctx.fillStyle = "rgba(17,78,90,0.98)";
    drawPixelLeftTriangle(ctx, x - 1, y);
    drawPixelLeftTriangle(ctx, x + 1, y);
    drawPixelLeftTriangle(ctx, x, y - 1);
    drawPixelLeftTriangle(ctx, x, y + 1);
    ctx.fillStyle = `rgba(78,203,226,${alpha})`;
    drawPixelLeftTriangle(ctx, x, y);
    ctx.fillStyle = "rgba(247,242,232,0.38)";
    ctx.fillRect(x + 5, y - 4, 5, 1);
    ctx.fillRect(x + 7, y - 2, 3, 1);
  }

  function drawCrispControlGlyph(ctx, text, cx, y) {
    const glyphs = {
      X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
      B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
    };
    const glyph = glyphs[String(text).toUpperCase()];
    if (!glyph) return;
    const scale = 1;
    const w = glyph[0].length * scale;
    const x = (cx - w / 2) | 0;
    for (let row = 0; row < glyph.length; row += 1) {
      for (let col = 0; col < glyph[row].length; col += 1) {
        if (glyph[row][col] === "1") ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
      }
    }
  }

  function drawHudBand(ctx, x, y, w, h, topColor, bottomColor) {
    ctx.fillStyle = bottomColor;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = topColor;
    ctx.fillRect(x, y, w, Math.max(1, (h * 0.56) | 0));
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    for (let px = x + 6; px < x + w; px += 22) {
      ctx.fillRect(px, y + 2, 2, 1);
    }
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x, y + h - 2, w, 2);
  }

  function drawBaseHpPanel(ctx, x, y, w, h, label, hp, color, alignRight) {
    const labelW = Math.max(alignRight ? 34 : 32, label.length * 6 + 10);
    const valueW = 29;
    const labelX = alignRight ? x + w - labelW - 4 : x + 4;
    const valueX = alignRight ? x + 4 : x + w - valueW - 4;
    const barX = alignRight ? valueX + valueW + 4 : x + labelW + 10;
    const barW = alignRight ? labelX - barX - 4 : valueX - barX - 4;
    const value = Math.max(0, hp | 0);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    roundRect(ctx, x + 1, y + 1, w, h, 5);
    ctx.fill();
    ctx.fillStyle = "#101116";
    roundRect(ctx, x, y, w, h, 5);
    ctx.fill();
    ctx.strokeStyle = colorWithAlpha(color, 0.7);
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    ctx.fillStyle = color;
    roundRect(ctx, labelX, y + 3, labelW, 12, 4);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(labelX + 5, y + 5, Math.max(6, labelW - 12), 1);
    ctx.fillStyle = "#101116";
    ctx.font = "10px PixelMplus10";
    ctx.textAlign = "center";
    drawFixedPixelText(ctx, label, labelX + labelW / 2, y + 13, 5);

    drawSegmentedHp(ctx, barX, y + 4, barW, 9, hp, color);
    ctx.fillStyle = "#23232b";
    roundRect(ctx, valueX, y + 4, valueW, 11, 4);
    ctx.fill();
    ctx.strokeStyle = "rgba(247,242,232,0.18)";
    ctx.strokeRect(valueX + 0.5, y + 4.5, valueW - 1, 10);
    ctx.fillStyle = "#f7f2e8";
    ctx.font = "10px PixelMplus10";
    ctx.textAlign = "center";
    drawFixedPixelText(ctx, String(value), valueX + valueW / 2, y + 13, 5);
  }

  function drawPowPanel(ctx, x, y, w, h, value) {
    const labelW = 42;
    ctx.fillStyle = "rgba(0,0,0,0.48)";
    roundRect(ctx, x + 1, y + 1, w, h, 6);
    ctx.fill();
    ctx.fillStyle = "#101116";
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(78,203,226,0.64)";
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    ctx.fillStyle = "#4ecbe2";
    roundRect(ctx, x + 4, y + 4, labelW, h - 8, 5);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillRect(x + 10, y + 6, labelW - 13, 1);
    ctx.fillStyle = "#061316";
    ctx.font = "10px PixelMplus10";
    ctx.textAlign = "center";
    drawFixedPixelText(ctx, "POW", x + 4 + labelW / 2, y + 15, 6);

    drawEnergyCells(ctx, x + labelW + 9, y + 5, w - labelW - 41, h - 10, value);
    ctx.fillStyle = "#f7f2e8";
    ctx.font = "10px PixelMplus10";
    ctx.textAlign = "right";
    ctx.fillText(`${Math.floor(value)}/${MAX_ENERGY}`, x + w - 7, y + 15);
  }

  function drawEnergyCells(ctx, x, y, w, h, value) {
    const gap = 3;
    const ix = Math.round(x);
    const iy = Math.round(y);
    const ih = Math.round(h);
    const totalW = Math.round(w);
    const baseCellW = Math.floor((totalW - gap * (MAX_ENERGY - 1)) / MAX_ENERGY);
    const extra = totalW - gap * (MAX_ENERGY - 1) - baseCellW * MAX_ENERGY;
    let cx = ix;
    for (let i = 0; i < MAX_ENERGY; i += 1) {
      const cellW = baseCellW + (i < extra ? 1 : 0);
      const fill = clamp(value - i, 0, 1);
      ctx.fillStyle = "#07080c";
      roundRect(ctx, cx, iy + 1, cellW, ih, 3);
      ctx.fill();
      ctx.fillStyle = "#1a1b25";
      roundRect(ctx, cx, iy, cellW, ih, 3);
      ctx.fill();
      if (fill > 0) {
        const full = fill >= 1;
        ctx.fillStyle = full ? "#4ecbe2" : "#2e8390";
        roundRect(ctx, cx + 2, iy + 2, Math.max(1, Math.round((cellW - 4) * fill)), ih - 4, 2);
        ctx.fill();
        if (full) {
          ctx.fillStyle = "rgba(255,255,255,0.52)";
          ctx.fillRect(cx + 5, iy + 3, Math.max(3, cellW - 11), 1);
        }
      }
      ctx.strokeStyle = fill > 0 ? "rgba(247,242,232,0.36)" : "rgba(247,242,232,0.15)";
      ctx.strokeRect(cx + 0.5, iy + 0.5, cellW - 1, ih - 1);
      cx += cellW + gap;
    }
  }

  function handCardAtOffset(offset) {
    if (!state.playerHand.length) return null;
    const index = (state.selectedHandIndex + offset + state.playerHand.length) % state.playerHand.length;
    return state.playerHand[index];
  }

  function handEntryFor(card) {
    if (!card) return null;
    const key = cardKey(card);
    return state.handEntries.find((entry) => entry.cardKey === key || (!entry.cardKey && entry.cardId === card.id)) || null;
  }

  function cardSprite(card) {
    if (!card) return null;
    const spriteId = card.spriteCardId || card.id;
    const spriteIndex = card.spriteIndex || 0;
    const candidates = [
      indexedSprite(sprites.cards?.[spriteId], spriteIndex),
      indexedSprite(sprites.cardImages?.[spriteId], spriteIndex),
      sprites[`card${card.spriteNo}`],
      sprites.ally,
    ];
    return candidates.find(canDrawSprite) || null;
  }

  function unitSprite(unit) {
    if (!unit) return null;
    if (unit.team === "enemy") {
      const spriteId = unit.card.spriteCardId || unit.card.id;
      return sprites.enemyCards?.[spriteId] || sprites.enemy;
    }
    const spriteId = unit.card.spriteCardId || unit.card.id;
    const set = sprites.cards?.[spriteId] || sprites.cardImages?.[spriteId];
    if (Array.isArray(set)) {
      if (unit.card.behavior === "cactusCrew") {
        return unit.role === "shooter" ? (set[2] || firstSprite(set)) : (set[0] || firstSprite(set));
      }
      const baseIndex = unit.card.spriteIndex ?? unit.variant;
      return set[baseIndex % set.length] || firstSprite(set);
    }
    return cardSprite(unit.card);
  }

  function drawWheelCard(ctx, card, cx, y, w, h, selected, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = (selected ? 1 : 0.76) * alpha;
    ctx.translate(cx, y + h / 2);
    drawCard(ctx, card, -w / 2, -h / 2, w, h, selected);
    ctx.restore();
  }

  function drawCardFlights(ctx) {
    for (const flight of state.cardFlights) {
      const p = clamp(flight.t / flight.duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const arc = Math.sin(p * Math.PI) * 22;
      const x = flight.sx + (flight.tx - flight.sx) * eased;
      const y = flight.sy + (flight.ty - flight.sy) * eased - arc;
      ctx.save();
      ctx.globalAlpha = 1 - Math.max(0, p - 0.86) / 0.14;
      ctx.translate(x, y);
      ctx.rotate((p - 0.5) * 0.18);
      drawCard(ctx, flight.card, -HAND_CARD_W / 2, -HAND_H / 2, HAND_CARD_W, HAND_H, true, false);
      ctx.restore();
    }
  }

  function drawPepperThrows(ctx) {
    for (const pepper of state.pepperThrows) {
      const localT = pepper.t - (pepper.delay || 0);
      if (localT < 0) continue;
      const p = clamp(localT / pepper.duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 2.4);
      const target = state.units.find((unit) => unit.id === pepper.targetId && unit.hp > 0);
      const tx = target ? target.x : pepper.tx;
      const ty = target ? target.y - target.card.radius - 4 : pepper.ty;
      const x = pepper.sx + (tx - pepper.sx) * eased;
      const y = pepper.sy + (ty - pepper.sy) * eased - Math.sin(p * Math.PI) * pepper.arc;
      const img = sprites.pepper;
      ctx.save();
      ctx.translate(x | 0, y | 0);
      ctx.rotate(p * Math.PI * 2.8);
      if (canDrawImage(img)) {
        drawImageFit(ctx, img, 0, 0, img.naturalWidth, img.naturalHeight);
      } else {
        ctx.fillStyle = "#ef3e45";
        ctx.fillRect(-2, -5, 4, 10);
        ctx.fillStyle = "#55c768";
        ctx.fillRect(0, -7, 2, 3);
      }
      ctx.restore();
    }
  }

  function drawCard(ctx, card, x, y, w, h, selected, activeOverride = null) {
    const active = activeOverride ?? isCardActive(card, "player");
    const affordable = card && state.energy >= card.cost;
    const playable = affordable && !active;
    ctx.fillStyle = selected ? "#f1c84b" : "#111";
    roundRect(ctx, x - 2, y - 2, w + 4, h + 4, 4);
    ctx.fill();
    ctx.fillStyle = playable ? "#302f34" : "#1d1b1d";
    roundRect(ctx, x, y, w, h, 4);
    ctx.fill();
    if (!card) return;
    const img = cardSprite(card);
    if (canDrawSprite(img)) {
      drawSpriteFit(ctx, img, 0, x + w / 2, y + 31, 30, 30, !!card.spriteFlip);
    } else {
      ctx.fillStyle = card.color;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + 31, 15, 0, Math.PI * 2);
      ctx.fill();
    }
    if (active) {
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = "#000";
      roundRect(ctx, x, y, w, h, 4);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = playable ? "#4ecbe2" : "#70747c";
    ctx.beginPath();
    ctx.arc(x + 13, y + 13, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = playable ? "#061316" : "#e1e3e6";
    ctx.font = "10px PixelMplus10";
    ctx.textAlign = "center";
    drawFixedPixelText(ctx, String(card.cost), x + 13, y + 17, 5);
    ctx.fillStyle = "#f7f2e8";
    ctx.font = "10px PixelMplus10";
    drawFixedPixelText(ctx, card.name, x + w / 2, y + 57, 5);
    ctx.fillStyle = "#bdb5a8";
    ctx.font = "10px PixelMplus10";
    drawFixedPixelText(ctx, active ? "FIELD" : card.label, x + w / 2, y + 69, 5);
  }

  function drawBase(ctx, x, y, team) {
    if (team === "enemy" && state.victoryCelebration) return;
    if (team === "enemy" && canDrawEnemyBaseParts()) {
      drawEnemyBaseParts(ctx, x, y);
      return;
    }
    const img = team === "player" ? sprites.playerBase || sprites.earth : sprites.enemyBase || sprites.boss;
    if (canDrawImage(img)) {
      const size = team === "enemy" ? 100 : 46;
      drawBaseSprite(ctx, img, x, y, size, size);
      return;
    }
    if (team === "enemy") {
      drawEnemyBaseMark(ctx, x, y);
      return;
    }
    ctx.fillStyle = team === "player" ? "#4fd18b" : "#ef5b5b";
    roundRect(ctx, x - 15, y - 22, 30, 44, 5);
    ctx.fill();
    ctx.fillStyle = "#111";
    roundRect(ctx, x - 11, y - 18, 22, 32, 3);
    ctx.fill();
  }

  function canDrawEnemyBaseParts() {
    const parts = sprites.enemyBaseParts;
    return canDrawImage(parts?.low) && canDrawImage(parts?.mid) && canDrawImage(parts?.top);
  }

  function drawEnemyBaseParts(ctx, x, y) {
    const parts = sprites.enemyBaseParts;
    const t = state.bossSpin;
    const finisher = state.finisher;
    const finisherP = finisher ? clamp(finisher.timer / finisher.duration, 0, 1) : 0;
    if (finisher?.burstDone) return;
    let bx = x;
    let by = y;
    if (finisherP > 0.56) {
      const rumble = clamp((finisherP - 0.56) / 0.2, 0, 1);
      bx += Math.sin(state.elapsed * 92) * (1 + rumble * 5);
      by += Math.cos(state.elapsed * 117) * (1 + rumble * 3);
    }
    drawBossPsychedelicPop(ctx, bx, by, t);
    ctx.save();
    const feverA = feverVisualAlpha();
    const blink = finisherP > 0.58 && Math.sin(state.elapsed * 72) > 0;
    if (blink) ctx.globalAlpha = 0.38;
    if (feverA > 0 || finisherP > 0.58) {
      const gray = Math.max(feverA, clamp((finisherP - 0.58) / 0.14, 0, 1));
      const contrast = 1 + Math.max(feverA * 0.55, clamp((finisherP - 0.58) / 0.16, 0, 1) * 1.05);
      const bright = 1 + (blink ? 1.7 : clamp((finisherP - 0.58) / 0.2, 0, 1) * 0.35);
      ctx.filter = `grayscale(${gray.toFixed(3)}) contrast(${contrast.toFixed(3)}) brightness(${bright.toFixed(3)})`;
    }
    drawRotatingBasePart(ctx, parts.low, bx, by, 100, t * BOSS_LOW_SPIN_RATE);
    drawRotatingBasePart(ctx, parts.mid, bx, by, 100, t * BOSS_MID_SPIN_RATE);
    drawBaseSprite(ctx, parts.top, bx, by, 100, 100);
    ctx.restore();
  }

  function drawBossPsychedelicPop(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.72;
    const colors = ["#ff1744", "#ffea00", "#00e676", "#00b0ff", "#ff00e6", "#ff7a00"];
    for (let i = 0; i < 18; i += 1) {
      const a = t * 1.6 + (i * Math.PI * 2) / 18;
      const inner = 17 + (i % 2) * 5;
      const outer = 58 + Math.sin(t * 4 + i) * 6;
      const w = i % 3 === 0 ? 9 : 6;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - 0.045) * inner, Math.sin(a - 0.045) * inner);
      ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
      ctx.lineTo(Math.cos(a + 0.045) * inner, Math.sin(a + 0.045) * inner);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect((Math.cos(a) * (outer - 3)) | 0, (Math.sin(a) * (outer - 3)) | 0, w, w);
    }

    ctx.globalAlpha = 0.58;
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i += 1) {
      const r = 31 + i * 8 + Math.sin(t * 5 + i) * 2;
      ctx.strokeStyle = colors[(i * 2 + (t * 4 | 0)) % colors.length];
      ctx.beginPath();
      ctx.arc(0, 0, r, t * (i % 2 ? -1.8 : 1.4), t * (i % 2 ? -1.8 : 1.4) + Math.PI * 1.35);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRotatingBasePart(ctx, img, x, y, size, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    drawBaseSprite(ctx, img, 0, 0, size, size);
    ctx.restore();
  }

  function drawPlayer(ctx) {
    const card = selectedCard();
    const can = canDeployCard(card, "player", state.energy) && !state.gameOver;
    const x = state.playerX;
    const y = state.playerY;
    const img = cardSprite(card);
    const metrics = spriteMetrics(img);
    ctx.save();
    if (card) {
      const activeRangeColor = card.rangeColor || "rgba(241,200,75,0.36)";
      const rangeColor = can ? activeRangeColor : "rgba(112,116,124,0.18)";
      ctx.fillStyle = can ? colorWithAlpha(activeRangeColor, 0.085) : "rgba(112,116,124,0.035)";
      ctx.strokeStyle = rangeColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(8, card.range || 8), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    if (metrics && card) {
      const r = card.radius || 8;
      const drawX = Math.round(x - metrics.w / 2);
      const drawY = Math.round(y + r + 2 - metrics.h);
      ctx.fillStyle = can ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.14)";
      ctx.beginPath();
      ctx.ellipse(x, y + r + 2, Math.max(8, metrics.w * 0.72), 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = can ? 0.52 : 0.28;
      drawSpriteFrame(ctx, img, 0, drawX, drawY, metrics.w, metrics.h, !!card.spriteFlip);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = can ? "rgba(241,200,75,0.16)" : "rgba(112,116,124,0.16)";
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawUnit(ctx, unit) {
    if (unit.exiting) {
      drawUnitExit(ctx, unit);
      return;
    }
    const r = unit.card.radius;
    const knocking = unit.knockTimer < unit.knockDuration;
    const knockP = knocking ? unit.knockTimer / unit.knockDuration : 1;
    const lift = knocking ? Math.sin(knockP * Math.PI) * unit.knockHeight : 0;
    const walking = unit.state === "walk";
    const step = walking ? Math.abs(Math.sin(unit.bob)) : 0;
    const sway = walking ? Math.sin(unit.bob * 0.5) * 1.1 : 0;
    const settingUpCurry = unit.setupTimer > 0 && unit.setupEffect === "curry";
    const setupJitterX = settingUpCurry ? ((Math.sin(state.elapsed * 42 + unit.variant) * 1.4) | 0) : 0;
    const setupJitterY = settingUpCurry ? (Math.sin(state.elapsed * 32 + unit.variant) > 0 ? -1 : 0) : 0;
    const setupTilt = settingUpCurry ? Math.sin(state.elapsed * 26 + unit.variant) * 0.08 : 0;
    const curryPanic = unit.curryTimer > 0;
    const panicPhase = unit.curryPhase || 0;
    const panicX = curryPanic ? ((Math.sin(state.elapsed * 22 + panicPhase) * 1.8) | 0) : 0;
    const panicY = curryPanic ? (Math.sin(state.elapsed * 35 + panicPhase) > 0 ? 1 : -1) : 0;
    const victoryJump = state.victoryCelebration && !state.victoryCelebration.whiteout && unit.team === "player"
      ? Math.max(0, Math.sin(state.victoryCelebration.timer * Math.PI * 4.2 + unit.variant * 0.7)) * 17
      : 0;
    const y = unit.y - lift - victoryJump - step * 2.2 + Math.sin(unit.bob) * (walking ? 0.4 : 0.5);
    const img = unitSprite(unit);
    const metrics = spriteMetrics(img);
    const airLift = lift + victoryJump;
    const airScale = 1 - clamp(airLift / Math.max(1, unit.knockHeight || 42), 0, 1) * 0.42;
    const shadowW = (metrics ? Math.max(8, metrics.w * 0.75) : r * 1.4) * (1 - step * 0.14) * airScale;
    const shadowH = 3 * (1 - step * 0.22) * airScale;
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(unit.x + panicX + setupJitterX, unit.y + r + 2, shadowW, shadowH, 0, 0, Math.PI * 2);
    ctx.fill();
    const feverGlow = state.speedFever.timer > 0 && unit.team === state.speedFever.team;
    const attackGlow = unit.attackBoostTimer > 0;
    if (metrics) {
      const frame = walking ? ((unit.bob / Math.PI) | 0) % 2 : 0;
      const flip = unit.team === "enemy"
        ? (unit.card.noEnemyFlip ? !!unit.card.spriteFlip : !unit.card.spriteFlip)
        : !!unit.card.spriteFlip;
      const drawX = unit.x - metrics.w / 2 + sway + panicX + setupJitterX;
      const drawY = y + r + 2 - metrics.h + panicY + setupJitterY;
      if (settingUpCurry) {
        ctx.save();
        ctx.translate(drawX + metrics.w / 2, drawY + metrics.h - 2);
        ctx.rotate(setupTilt);
        if (feverGlow) drawUnitBoostGlow(ctx, img, frame, -metrics.w / 2, -metrics.h + 2, metrics.w, metrics.h, flip, state.elapsed + unit.variant * 0.19, "fever");
        if (attackGlow) drawUnitBoostGlow(ctx, img, frame, -metrics.w / 2, -metrics.h + 2, metrics.w, metrics.h, flip, state.elapsed + unit.variant * 0.23, "attack");
        drawCurrySetupSpark(ctx, 0, -metrics.h + 6, state.elapsed + unit.variant);
        if (curryPanic) drawCurryPanicGlow(ctx, img, frame, -metrics.w / 2, -metrics.h + 2, metrics.w, metrics.h, flip, state.elapsed + panicPhase);
        drawSpriteFrame(ctx, img, frame, -metrics.w / 2, -metrics.h + 2, metrics.w, metrics.h, flip);
        if (curryPanic) drawCurryPanicSweat(ctx, -metrics.w / 2, -metrics.h + 2, metrics.w, metrics.h, state.elapsed + panicPhase);
        ctx.restore();
      } else {
        if (feverGlow) drawUnitBoostGlow(ctx, img, frame, drawX, drawY, metrics.w, metrics.h, flip, state.elapsed + unit.variant * 0.19, "fever");
        if (attackGlow) drawUnitBoostGlow(ctx, img, frame, drawX, drawY, metrics.w, metrics.h, flip, state.elapsed + unit.variant * 0.23, "attack");
        if (curryPanic) drawCurryPanicGlow(ctx, img, frame, drawX, drawY, metrics.w, metrics.h, flip, state.elapsed + panicPhase);
        drawSpriteFrame(ctx, img, frame, drawX, drawY, metrics.w, metrics.h, flip);
        if (curryPanic) drawCurryPanicSweat(ctx, drawX, drawY, metrics.w, metrics.h, state.elapsed + panicPhase);
      }
      if (unit.hitFlash > 0) {
        drawSpriteFrameTint(ctx, img, frame, drawX, drawY, metrics.w, metrics.h, flip, "#fff", unit.hitFlash * 0.62);
      }
    } else {
      if (attackGlow) {
        const pulse = 0.68 + 0.28 * Math.sin(state.elapsed * 18 + unit.variant);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = pulse;
        ctx.fillStyle = "#ef3e45";
        ctx.beginPath();
        ctx.arc(unit.x + sway + panicX + setupJitterX, y + panicY + setupJitterY, r + 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = pulse * 0.72;
        ctx.fillStyle = "#ff7a35";
        ctx.beginPath();
        ctx.arc(unit.x + sway + panicX + setupJitterX, y + panicY + setupJitterY, r + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (feverGlow) {
        const hue = (state.elapsed * 420 + unit.variant * 65 + unit.x * 1.7) % 360;
        const pulse = 0.5 + 0.3 * Math.sin(state.elapsed * 18 + unit.variant);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = pulse;
        ctx.fillStyle = `hsl(${hue},100%,62%)`;
        ctx.beginPath();
        ctx.arc(unit.x + sway + panicX, y + panicY, r + 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (curryPanic) {
        const pulse = 0.45 + 0.25 * Math.sin(state.elapsed * 18 + panicPhase);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = pulse;
        ctx.fillStyle = "#ff2d20";
        ctx.beginPath();
        ctx.arc(unit.x + sway + panicX, y + panicY, r + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = unit.hitFlash > 0 ? "#fff" : unit.card.color;
      ctx.beginPath();
      ctx.arc(unit.x + sway + panicX, y + panicY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.fillRect(unit.x + sway + panicX - 4, y + panicY - 3, 2, 2);
      ctx.fillRect(unit.x + sway + panicX + 3, y + panicY - 3, 2, 2);
    }
    const hpW = metrics ? Math.max(18, Math.min(34, metrics.w + 4)) : 18;
    const hpY = metrics ? y + r - metrics.h - 4 : y - r - 7;
    if (unit.state !== "finisher") {
      drawTinyHp(ctx, unit.x - hpW / 2, hpY, hpW, 3, unit.hp / unit.maxHp, unit.team === "player" ? "#4fd18b" : "#ef5b5b");
    }
  }

  function drawUnitExit(ctx, unit) {
    const img = unitSprite(unit);
    const metrics = spriteMetrics(img);
    const p = clamp(unit.exitTimer / Math.max(0.001, unit.exitDuration || UNIT_DEATH_EXIT_DURATION), 0, 1);
    const scale = 1 - p * 0.18;
    const alpha = unit.exitAlpha ?? 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (metrics) {
      const frame = ((unit.bob / Math.PI) | 0) % 2;
      const flip = unit.team === "enemy"
        ? (unit.card.noEnemyFlip ? !!unit.card.spriteFlip : !unit.card.spriteFlip)
        : !!unit.card.spriteFlip;
      ctx.translate(unit.x, unit.y - metrics.h * 0.45);
      ctx.rotate(unit.exitAngle || 0);
      ctx.scale(scale, scale);
      drawSpriteFrame(ctx, img, frame, -metrics.w / 2, -metrics.h / 2, metrics.w, metrics.h, flip);
    } else {
      const r = Math.max(3, unit.card.radius * scale);
      ctx.translate(unit.x, unit.y - r);
      ctx.rotate(unit.exitAngle || 0);
      ctx.fillStyle = unit.card.color;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.fillRect(-4, -3, 2, 2);
      ctx.fillRect(3, -3, 2, 2);
    }
    ctx.restore();
  }

  function drawResult(ctx) {
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(0, 0, PHONE_BRAWL_W, PHONE_BRAWL_H);
    ctx.textAlign = "center";
    ctx.fillStyle = state.result === "victory" ? "#4fd18b" : state.result === "defeat" ? "#ef5b5b" : "#f1c84b";
    ctx.font = "32px PixelMplus10";
    ctx.fillText(state.result.toUpperCase(), MID_X, 150);
    ctx.fillStyle = "#f7f2e8";
    ctx.font = "12px PixelMplus10";
    ctx.fillText(state.resultText, MID_X, 178);
    ctx.fillStyle = "#bdb5a8";
    ctx.font = "10px PixelMplus10";
    const ok = controlPrompt("z", { mobile });
    ctx.fillText(gameOverAction === "close" ? ok + " : BACK" : ok + " : AGAIN", MID_X, 205);
  }

  function drawParticles(ctx) {
    for (const p of state.particles) {
      const a = Math.max(0, Math.min(1, p.life / 0.35));
      ctx.save();
      ctx.globalAlpha = a;
      if (p.bossWhiteoutBlast) {
        const elapsed = p.delay + p.maxLife - p.life;
        if (elapsed < p.delay) {
          ctx.restore();
          continue;
        }
        const progress = clamp((elapsed - p.delay) / p.maxLife, 0, 1);
        const blast = 1 - Math.pow(1 - progress, 2.8);
        const radius = p.startRadius + (p.endRadius - p.startRadius) * blast;
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = Math.min(1, 0.18 + progress * 0.76);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = Math.max(0, 0.8 * (1 - progress));
        ctx.lineWidth = 5 + progress * 20;
        ctx.strokeStyle = "#fff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * (0.74 + progress * 0.08), 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = Math.max(0, 0.35 * (1 - progress));
        ctx.lineWidth = 2 + progress * 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.46, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.beam) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.heal ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(p.x1, p.y1);
        ctx.lineTo(p.x2, p.y2);
        ctx.stroke();
      } else if (p.lightning) {
        const progress = clamp(1 - p.life / p.maxLife, 0, 1);
        ctx.globalAlpha = Math.max(0, 1 - progress);
        ctx.lineJoin = "miter";
        ctx.strokeStyle = "#fff7b0";
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let i = 0; i < p.points.length; i += 1) {
          const pt = p.points[i];
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < p.points.length; i += 1) {
          const pt = p.points[i];
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      } else if (p.gyozaHeal) {
        const progress = clamp(1 - p.life / p.maxLife, 0, 1);
        const eased = 1 - Math.pow(1 - progress, 2.2);
        const target = state.units.find((unit) => unit.id === p.targetId && unit.hp > 0);
        const tx = target ? target.x : p.tx;
        const ty = target ? target.y - target.card.radius - 4 : p.ty;
        const x = p.sx + (tx - p.sx) * eased;
        const y = p.sy + (ty - p.sy) * eased - Math.sin(progress * Math.PI) * p.arc;
        const img = sprites.gyoza;
        ctx.globalAlpha = 1;
        ctx.translate(x | 0, y | 0);
        ctx.rotate(progress * Math.PI * p.spin);
        if (canDrawImage(img)) {
          drawImageFit(ctx, img, 0, 0, 15, 15);
        } else {
          ctx.fillStyle = "#f6d8a8";
          ctx.beginPath();
          ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#8c5f3a";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      } else if (p.fishingLine) {
        if (!isFinitePoint(p.x1, p.y1, p.x2, p.y2, p.life, p.maxLife) || p.maxLife <= 0) {
          ctx.restore();
          continue;
        }
        const progress = clamp(1 - p.life / p.maxLife, 0, 1);
        const slack = Math.sin(progress * Math.PI) * 10;
        const mx = (p.x1 + p.x2) / 2;
        const my = (p.y1 + p.y2) / 2 + slack;
        ctx.globalAlpha = Math.max(0, 1 - progress);
        ctx.strokeStyle = "#050507";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x1, p.y1);
        ctx.quadraticCurveTo(mx, my, p.x2, p.y2);
        ctx.stroke();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x1, p.y1);
        ctx.quadraticCurveTo(mx, my, p.x2, p.y2);
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect((p.x2 - 1) | 0, (p.y2 - 1) | 0, 2, 2);
      } else if (p.nidhoggFlame) {
        const progress = 1 - p.life / p.maxLife;
        drawNidhoggFlame(ctx, p, progress);
      } else if (p.ring) {
        const progress = 1 - p.life / p.maxLife;
        ctx.globalAlpha = Math.max(0, 1 - progress) * p.alpha;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, p.width * (1 - progress * 0.55));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.startRadius + (p.endRadius - p.startRadius) * progress, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.flash) {
        const progress = 1 - p.life / p.maxLife;
        ctx.globalAlpha = Math.max(0, 1 - progress) * p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (0.65 + progress * 0.7), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.melee) {
        const progress = 1 - p.life / p.maxLife;
        ctx.globalAlpha = Math.max(0, 1 - progress);
        ctx.save();
        ctx.translate(p.x | 0, p.y | 0);
        ctx.scale(p.scale || 1, p.scale || 1);
        drawTinyStarBurst(ctx, 0, 0, p.color, progress);
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawBaseBreaks(ctx) {
    for (const fx of state.baseBreaks) {
      const p = clamp(1 - fx.life / fx.maxLife, 0, 1);
      const a = Math.max(0, 1 - p);
      const pulse = Math.sin(Math.min(1, p / 0.22) * Math.PI);
      ctx.save();

      ctx.globalAlpha = 0.28 * a;
      ctx.fillStyle = "#f7f2e8";
      ctx.fillRect(0, FIELD_Y, PHONE_BRAWL_W, FIELD_H);

      ctx.globalAlpha = 0.95 * a;
      ctx.translate(fx.x | 0, fx.y | 0);
      drawBaseBreakBurstShape(ctx, 34 + pulse * 10, "#050507");
      drawBaseBreakBurstShape(ctx, 29 + pulse * 8, "#f7f2e8");
      drawBaseBreakBurstShape(ctx, 22 + pulse * 6, fx.color);

      ctx.globalAlpha = 0.85 * a;
      ctx.strokeStyle = "#f7f2e8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 22 + p * 66, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 10 + p * 92, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  function drawBaseBreakBurstShape(ctx, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 18; i += 1) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 18;
      const rr = i % 2 === 0 ? radius : radius * 0.46;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawEffectPops(ctx) {
    for (const pop of state.effectPops) {
      const maxLife = pop.maxLife || 0.68;
      const p = clamp((maxLife - pop.life) / maxLife, 0, 1);
      const fade = Math.min(1, p / 0.12) * Math.max(0, 1 - Math.max(0, p - 0.78) / 0.22);
      const lift = Math.sin(p * Math.PI) * 5;
      const scale = 1;
      const img = pop.kind === "curry" ? sprites.curry : null;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(pop.x | 0, (pop.y - lift) | 0);
      ctx.scale(scale, scale);
      if (canDrawImage(img)) {
        ctx.fillStyle = "rgba(0,0,0,0.42)";
        roundRect(ctx, -11, -10, 22, 20, 4);
        ctx.fill();
        drawImageFit(ctx, img, 0, 0, img.naturalWidth, img.naturalHeight);
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.62)";
        roundRect(ctx, -25, -10, 50, 18, 6);
        ctx.fill();
        ctx.fillStyle = "#f0a33a";
        ctx.font = "10px PixelMplus10";
        ctx.textAlign = "center";
        ctx.fillText("CURRY", 0, 4);
      }
      ctx.restore();
    }
  }

  function drawHazards(ctx) {
    for (const h of state.hazards) {
      const p = clamp(h.life / h.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = p;
      drawPixelCurry(ctx, h);
      ctx.restore();
    }
  }

  function drawPixelCurry(ctx, h) {
    const rx = h.radius * 1.08;
    const ry = h.radius * 0.58;
    const cx = h.x;
    const cy = h.y + 4;
    ctx.fillStyle = "rgba(45,25,12,0.34)";
    ctx.fillRect((cx - rx + 3) | 0, (cy + ry - 4) | 0, (rx * 2 - 6) | 0, 5);
    ctx.fillStyle = "#7a3f1f";
    for (let yy = -ry; yy <= ry; yy += 3) {
      const span = Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry))) * rx;
      const x0 = Math.round(cx - span);
      const w = Math.max(2, Math.round(span * 2));
      ctx.fillRect(x0, Math.round(cy + yy), w, 3);
    }
    for (const c of h.chunks || []) {
      const px = Math.round(cx + c.x);
      const py = Math.round(cy + c.y);
      ctx.fillStyle = c.color;
      ctx.fillRect(px, py, c.size, c.size);
      if (c.size >= 4) {
        ctx.fillStyle = "rgba(255,238,170,0.35)";
        ctx.fillRect(px, py, 2, 1);
      }
    }
  }

  function drawSpeedFever(ctx) {
    const a = feverVisualAlpha();
    if (a <= 0) return;
    const t = state.elapsed * 100;
    const light = state.lightBoostVisuals;
    ctx.save();

    ctx.globalAlpha = 0.98 * a;
    ctx.globalCompositeOperation = "source-over";
    const stripeH = light ? 28 : 20;
    for (let y = FIELD_Y - stripeH; y < FIELD_Y + FIELD_H + stripeH; y += stripeH) {
      const hue = (state.elapsed * 130 + y * 2.1) % 360;
      ctx.fillStyle = `hsl(${hue},100%,56%)`;
      ctx.fillRect(0, y, PHONE_BRAWL_W, stripeH + 1);
    }

    if (!light) {
      ctx.globalAlpha = 0.64 * a;
      ctx.globalCompositeOperation = "screen";
      for (let y = FIELD_Y + 2; y < FIELD_Y + FIELD_H; y += 32) {
        const hue = (state.elapsed * 190 + y * 1.4) % 360;
        const grad = ctx.createLinearGradient(0, y, PHONE_BRAWL_W, y + 24);
        grad.addColorStop(0, `hsla(${hue},100%,72%,0.2)`);
        grad.addColorStop(0.45, `hsla(${(hue + 75) % 360},100%,66%,1)`);
        grad.addColorStop(1, `hsla(${(hue + 150) % 360},100%,62%,0.15)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, y, PHONE_BRAWL_W, 24);
      }

      ctx.globalAlpha = 0.82 * a;
      for (let i = -2; i < 9; i += 1) {
        const x = ((i * 88 + t * 1.3) % (PHONE_BRAWL_W + 176)) - 88;
        const hue = (state.elapsed * 240 + i * 58) % 360;
        const grad = ctx.createLinearGradient(x, FIELD_Y, x + 82, FIELD_Y + FIELD_H);
        grad.addColorStop(0, `hsla(${hue},100%,62%,0)`);
        grad.addColorStop(0.45, `hsla(${hue},100%,70%,1)`);
        grad.addColorStop(1, `hsla(${(hue + 105) % 360},100%,62%,0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(x, FIELD_Y, 82, FIELD_H);
      }
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.95 * a;
    const feverColors = ["#ff1744", "#ffff00", "#00e676", "#00b0ff", "#ff00e6", "#ff7a00"];
    const starCount = light ? 32 : 92;
    for (let i = 0; i < starCount; i += 1) {
      const x = (i * 31 + t * (1.45 + (i % 5) * 0.18)) % (PHONE_BRAWL_W + 44) - 22;
      const y = FIELD_Y + ((i * 19 + Math.sin(state.elapsed * 5.5 + i) * 20) % FIELD_H);
      const r = i % 7 === 0 ? 5 : i % 3 === 0 ? 3 : 2;
      const color = feverColors[i % feverColors.length];
      ctx.save();
      ctx.translate(x | 0, y | 0);
      ctx.rotate((state.elapsed * 3 + i) % (Math.PI * 2));
      drawFeverStar(ctx, 0, 0, r, color);
      ctx.restore();
      if (i % 4 === 0) {
        ctx.fillStyle = colorWithAlpha(color, 0.72);
        ctx.fillRect((x - 14) | 0, y | 0, 10, 2);
      }
    }
    ctx.restore();
  }

  function feverVisualAlpha() {
    const fever = state.speedFever;
    if (!fever.timer || fever.timer <= 0) return 0;
    return clamp(Math.min(1, fever.timer / 0.6, (fever.duration - fever.timer) / 0.35), 0, 1);
  }

function drawFeverStar(ctx, x, y, r, color = "#ffff00") {
  ctx.save();
  ctx.fillStyle = color;
    ctx.strokeStyle = "#050507";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 === 0 ? r : r * 0.42;
      const px = x + Math.cos(a) * rr;
      const py = y + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  ctx.restore();
}

function drawHitBurst(ctx, x, y, color = "#f7f2e8", progress = 0) {
  const s = 1 + (progress > 0.08 ? 1 : 0);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const px = (xx, yy, ww, hh, fill) => {
    ctx.fillStyle = fill;
    ctx.fillRect(xx, yy, ww, hh);
  };
  const outline = "#050507";
  const hi = "#fff7d6";
  const mid = "#f7f2e8";
  const rows = [
    [-10, -5, 5, 3, hi],
    [-6, -8, 5, 3, hi],
    [-1, -10, 4, 4, hi],
    [4, -8, 5, 3, hi],
    [7, -4, 5, 4, hi],
    [5, 1, 6, 4, hi],
    [1, 5, 5, 4, hi],
    [-4, 6, 5, 3, hi],
    [-9, 3, 6, 4, hi],
    [-12, -1, 5, 4, hi],
    [-6, -5, 13, 11, mid],
    [-9, -2, 18, 5, mid],
    [-3, -7, 7, 15, mid],
    [-5, -2, 10, 4, color],
    [-1, -5, 3, 10, color],
    [-8, 3, 4, 2, color],
    [5, -5, 4, 2, color],
    [-1, -2, 2, 4, hi],
  ];
  for (const [xx, yy, ww, hh] of rows) px(xx - 1, yy - 1, ww + 2, hh + 2, outline);
  for (const [xx, yy, ww, hh, fill] of rows) px(xx, yy, ww, hh, fill);
  ctx.restore();
}

function drawHugeHitStar(ctx, x, y, color = "#f7f2e8", progress = 0) {
  const scale = 1 + Math.sin(Math.min(1, progress / 0.22) * Math.PI) * 0.28;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const points = [
    [0, -18],
    [5, -7],
    [17, -11],
    [9, 0],
    [17, 10],
    [4, 7],
    [0, 19],
    [-5, 7],
    [-18, 11],
    [-9, 0],
    [-17, -10],
    [-4, -7],
  ];
  ctx.fillStyle = "#050507";
  ctx.beginPath();
  for (let i = 0; i < points.length; i += 1) {
    const [px, py] = points[i];
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff45f";
  ctx.beginPath();
  for (let i = 0; i < points.length; i += 1) {
    const [px, py] = points[i];
    const ix = px * 0.78;
    const iy = py * 0.78;
    if (i === 0) ctx.moveTo(ix, iy);
    else ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = color;
  ctx.fillRect(-3, -12, 6, 24);
  ctx.fillRect(-12, -3, 24, 6);
  ctx.fillStyle = "#fff7d6";
  ctx.fillRect(-1, -9, 2, 18);
  ctx.fillRect(-9, -1, 18, 2);
  ctx.restore();
}

function drawImpactStar(ctx, x, y, color = "#f7f2e8", progress = 0) {
  const pulse = 0.72 + Math.sin(Math.min(1, progress / 0.22) * Math.PI) * 0.1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);
  const pts = [
    [0, -13],
    [4, -5],
    [13, -8],
    [7, 0],
    [13, 8],
    [4, 5],
    [0, 13],
    [-4, 5],
    [-13, 8],
    [-7, 0],
    [-13, -8],
    [-4, -5],
  ];
  ctx.fillStyle = "#050507";
  drawPolygon(ctx, pts, 1.18);
  ctx.fillStyle = "#fff7d6";
  drawPolygon(ctx, pts, 0.9);
  ctx.fillStyle = color;
  drawPolygon(ctx, pts, 0.55);
  ctx.fillStyle = "#fff7d6";
  ctx.fillRect(-1, -8, 2, 16);
  ctx.fillRect(-8, -1, 16, 2);

  ctx.fillStyle = "#050507";
  ctx.fillRect(-14, -2, 3, 3);
  ctx.fillRect(11, 4, 3, 3);
  ctx.fillRect(7, -12, 2, 2);
  ctx.fillRect(-8, 11, 2, 2);
  ctx.fillStyle = color;
  ctx.fillRect(-13, -1, 1, 1);
  ctx.fillRect(12, 5, 1, 1);
  ctx.fillRect(7, -12, 1, 1);
  ctx.fillRect(-8, 11, 1, 1);
  ctx.restore();
}

function drawTinyStarBurst(ctx, x, y, color = "#f7f2e8", progress = 0) {
  const spread = 2 + progress * 9;
  const fadeScale = 1 - progress * 0.18;
  ctx.save();
  ctx.translate(x, y);
  drawPixelStar(ctx, 0, 0, 5 * fadeScale, color, "#050507");
  const sparks = [
    [-0.9, -0.55, 3.2, "#fff7d6"],
    [0.85, -0.45, 2.6, color],
    [-0.65, 0.7, 2.4, color],
    [0.45, 0.82, 2.2, "#fff7d6"],
  ];
  for (const [dx, dy, size, fill] of sparks) {
    drawPixelStar(ctx, dx * spread, dy * spread, size * fadeScale, fill, "#050507");
  }
  ctx.restore();
}

function drawNidhoggFlame(ctx, flame, progress) {
  const fade = progress < 0.76 ? 1 : clamp((1 - progress) / 0.24, 0, 1);
  const red = flame.color === "#ef3e45";
  const smokeDark = red ? "#180708" : "#0b0710";
  const smokeA = red ? "#7f1f24" : "#4a285f";
  const smokeB = red ? "#b32a2f" : "#663674";
  const smokeHi = red ? "#ff8a62" : "#9a73a8";
  const reach = 0.12 + 0.88 * (1 - Math.pow(1 - clamp(progress / 0.28, 0, 1), 2.4));
  const dx = flame.x2 - flame.x1;
  const dy = flame.y2 - flame.y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  ctx.save();
  ctx.globalCompositeOperation = "source-over";

  for (let i = 0; i < 15; i += 1) {
    const t = i / 14;
    if (t > reach) continue;
    const wave = Math.sin(flame.phase + i * 1.35 + progress * 10);
    const wobble = Math.cos(flame.phase * 0.7 + i * 1.9 + progress * 8);
    const edgeFade = clamp((reach - t) / 0.18, 0, 1);
    const sideAmpX = t * (3 + t * 7);
    const sideAmpY = t * (2.5 + t * 6);
    const drift = progress * t * 12;
    const x = flame.x1 + dx * t + nx * wave * sideAmpX - (dx / len) * drift;
    const y = flame.y1 + dy * t + ny * wobble * sideAmpY - (dy / len) * drift;
    const r = (4.5 + t * 10.5 + Math.sin(flame.phase + i + progress * 12) * 1.4) * (1 - progress * 0.16);
    const squash = 0.78 + Math.sin(flame.phase + i * 0.6) * 0.18;
    const angle = Math.sin(flame.phase + i) * 0.42;

    ctx.globalAlpha = 0.28 * fade * edgeFade;
    drawSmokeBlob(ctx, x, y, r + 3.6, squash, angle, smokeDark);

    ctx.globalAlpha = 0.42 * fade * edgeFade;
    drawSmokeBlob(ctx, x, y, r, squash, angle, i % 2 === 0 ? smokeA : smokeB);

    ctx.globalAlpha = 0.22 * fade * edgeFade;
    ctx.fillStyle = red ? "#2a0808" : "#120717";
    ctx.fillRect((x + nx * r * 0.32) | 0, (y - r * 0.1) | 0, Math.max(1, r * 0.42) | 0, Math.max(1, r * 0.28) | 0);
    ctx.fillRect((x - nx * r * 0.42) | 0, (y + r * 0.18) | 0, Math.max(1, r * 0.34) | 0, Math.max(1, r * 0.22) | 0);

    if (i % 2 === 0) {
      ctx.globalAlpha = 0.18 * fade * edgeFade;
      drawSmokeBlob(ctx, x - nx * r * 0.45, y - ny * r * 0.35, r * 0.62, squash * 0.9, -angle, smokeHi);
    }
  }
  ctx.restore();
}

function drawSmokeBlob(ctx, x, y, r, squash, angle, color) {
  const pts = [];
  const steps = 10;
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  for (let i = 0; i < steps; i += 1) {
    const a = (i / steps) * Math.PI * 2;
    const jag = 0.82 + ((i * 7) % 5) * 0.055;
    const px = Math.cos(a) * r * jag;
    const py = Math.sin(a) * r * squash * (0.86 + ((i * 3) % 4) * 0.045);
    pts.push([x + px * ca - py * sa, y + px * sa + py * ca]);
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}

function drawPixelStar(ctx, x, y, r, fill, outline) {
  const pts = [];
  for (let i = 0; i < 10; i += 1) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.42;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  ctx.fillStyle = outline;
  drawPolygon(ctx, pts, 1.22);
  ctx.fillStyle = fill;
  drawPolygon(ctx, pts, 0.82);
}

function drawPolygon(ctx, pts, scale = 1) {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i += 1) {
    const px = pts[i][0] * scale;
    const py = pts[i][1] * scale;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawFloating(ctx) {
  ctx.textAlign = "center";
    ctx.font = "10px PixelMplus10";
    for (const f of state.floating) {
      ctx.save();
      const maxLife = f.maxLife || 0.72;
      const age = maxLife - f.life;
      const p = clamp(age / maxLife, 0, 1);
      ctx.globalAlpha = f.kind === "speech"
        ? Math.min(1, p / 0.12) * Math.max(0, 1 - Math.max(0, p - 0.72) / 0.28)
        : Math.max(0, f.life / maxLife);
      ctx.fillStyle = f.color === "rainbow"
        ? `hsl(${(state.elapsed * 520 + f.y * 3) % 360},100%,68%)`
        : f.color;
      const pop = f.kind === "speech" ? Math.sin(Math.min(1, p / 0.18) * Math.PI) * 3 : 0;
      const tx = f.x | 0;
      const ty = (f.y - pop) | 0;
      if (state.speedFever.timer > 0) {
        const fill = ctx.fillStyle;
        ctx.fillStyle = "#050507";
        ctx.fillText(f.text, tx + 1, ty + 1);
        ctx.fillText(f.text, tx - 1, ty + 1);
        ctx.fillStyle = fill;
      }
      ctx.fillText(f.text, tx, ty);
      ctx.restore();
    }
  }

  function updateParticles(dt) {
    for (const p of state.particles) {
      p.life -= dt;
      if (p.gyozaHeal && p.life <= 0 && !p.done) {
        p.done = true;
        const target = state.units.find((unit) => unit.id === p.targetId && unit.hp > 0 && !unit.exiting);
        if (target) {
          const repaired = applyUnitRepair(target, p.amount, p.color);
          if (repaired > 0) {
            burst(target.x, target.y - target.card.radius, p.color, 6, 18);
          }
        }
      }
      if (!p.beam && !p.ring && !p.flash && !p.melee && !p.fishingLine && !p.lightning && !p.nidhoggFlame && !p.gyozaHeal && !p.bossWhiteoutBlast) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 90 * dt;
      }
    }
    state.particles = state.particles.filter((p) => p.life > 0);
    for (const f of state.floating) {
      f.life -= dt;
      if (f.kind !== "speech") f.y -= 18 * dt;
    }
    state.floating = state.floating.filter((f) => f.life > 0);
  }

  function updateFever(dt) {
    if (state.speedFever.timer > 0) {
      state.speedFever.timer = Math.max(0, state.speedFever.timer - dt);
      state.feverSfxTimer -= dt;
      if (state.feverSfxTimer <= 0) {
        playFeverWarpSound(state.feverSfxStep);
        state.feverSfxStep += 1;
        state.feverSfxTimer = 0.18;
      }
    }
  }

  function updatePendingEffects(dt) {
    for (const effect of state.pendingEffects) {
      effect.timer -= dt;
      if (effect.timer <= 0 && !effect.done) {
        effect.done = true;
        if (effect.effect === "curry") applyCurryEffect(effect.card, effect.team, effect.x, effect.y);
        else applySummonEffect(effect.card, effect.team, effect.x, effect.y);
      }
    }
    state.pendingEffects = state.pendingEffects.filter((effect) => !effect.done);
  }

  function updateEffectPops(dt) {
    for (const pop of state.effectPops) pop.life -= dt;
    state.effectPops = state.effectPops.filter((pop) => pop.life > 0);
  }

  function updateBaseBreaks(dt) {
    for (const fx of state.baseBreaks) fx.life -= dt;
    state.baseBreaks = state.baseBreaks.filter((fx) => fx.life > 0);
  }

  function updateHazards(dt) {
    for (const h of state.hazards) {
      h.life -= dt;
      h.tick -= dt;
      for (const unit of state.units) {
        if (unit.team === h.team || unit.hp <= 0) continue;
        const dx = unit.x - h.x;
        const dy = (unit.y - h.y) / 0.62;
        if (Math.hypot(dx, dy) > h.radius) continue;
        unit.slowTimer = Math.max(unit.slowTimer, 0.18);
        unit.slowFactor = Math.min(unit.slowFactor, h.slow);
        unit.curryTimer = Math.max(unit.curryTimer || 0, 0.2);
        if (unit.hazardTick <= 0) {
          damageUnit(unit, h.damage, false);
          unit.hazardTick = 0.55;
        }
      }
      if (h.tick <= 0) {
        h.tick = 0.42;
        state.particles.push({ x: h.x + (Math.random() - 0.5) * h.radius, y: h.y + (Math.random() - 0.5) * h.radius * 0.55, vx: 0, vy: -8 - Math.random() * 14, life: 0.35, color: "#9c6a3a", size: 1.4 + Math.random() * 1.8 });
      }
    }
    state.hazards = state.hazards.filter((h) => h.life > 0);
  }

  function updateNidhoggFlames(dt) {
    for (const flame of state.nidhoggFlames) {
      flame.life -= dt;
      flame.tick -= dt;
      if (flame.damageLeft <= 0) continue;
      const source = state.units.find((unit) => unit.id === flame.unitId && unit.hp > 0);
      if (!source) {
        flame.life = 0;
        flame.damageLeft = 0;
        flame.ticksLeft = 0;
        continue;
      }
      const target = state.units.find((unit) => unit.id === flame.targetId && unit.hp > 0);
      if (target) {
        flame.x1 = nidhoggMouthX(source);
        flame.y1 = nidhoggMouthY(source);
        flame.x2 = target.x;
        flame.y2 = target.y - target.card.radius * 0.35;
        if (flame.particle) {
          flame.particle.x1 = flame.x1;
          flame.particle.y1 = flame.y1;
          flame.particle.x2 = flame.x2;
          flame.particle.y2 = flame.y2;
        }
      }
      while (flame.tick <= 0 && flame.damageLeft > 0 && flame.ticksLeft > 0) {
        const amount = Math.min(flame.damagePerTick, flame.damageLeft);
        applyNidhoggFlameTick(flame, target, amount);
        flame.damageLeft -= amount;
        flame.ticksLeft -= 1;
        flame.tick += NIDHOGG_FLAME_TICK;
      }
    }
    state.nidhoggFlames = state.nidhoggFlames.filter((flame) => flame.life > 0 || (flame.damageLeft > 0 && flame.ticksLeft > 0));
  }

  function applyNidhoggFlameTick(flame, target, amount) {
    if (target && isInNidhoggFlame(flame.x1, flame.y1, flame.x2, flame.y2, target.x, target.y - target.card.radius * 0.35)) {
      damageUnit(target, amount, false, false);
      target.hitFlash = Math.max(target.hitFlash, 0.72);
    }
    for (const other of state.units) {
      if (other.team === flame.team || other.id === flame.targetId || other.hp <= 0) continue;
      if (!isInNidhoggFlame(flame.x1, flame.y1, flame.x2, flame.y2, other.x, other.y - other.card.radius * 0.35)) continue;
      damageUnit(other, amount * 0.55, false, false);
      other.hitFlash = Math.max(other.hitFlash, 0.58);
    }
  }

  function updateCardFlights(dt) {
    for (const flight of state.cardFlights) {
      flight.t += dt;
      if (!flight.spawned && flight.t >= flight.duration) {
        flight.spawned = true;
        deployCard(flight.card, flight.team, flight.tx, flight.ty);
      }
    }
    state.cardFlights = state.cardFlights.filter((flight) => flight.t < flight.duration + 0.08);
  }

  function updatePepperThrows(dt) {
    for (const pepper of state.pepperThrows) {
      pepper.t += dt;
      const localT = pepper.t - (pepper.delay || 0);
      if (pepper.done || localT < pepper.duration) continue;
      pepper.done = true;
      if (pepper.visualOnly) continue;
      const target = state.units.find((unit) => unit.id === pepper.targetId && unit.team === pepper.team && unit.hp > 0);
      if (!target) continue;
      applyAttackBuffToUnit(pepper.card, target);
    }
    state.pepperThrows = state.pepperThrows.filter((pepper) => pepper.t < (pepper.delay || 0) + pepper.duration + 0.08);
  }

  function updateHandEntries(dt) {
    for (const entry of state.handEntries) entry.t += dt;
    state.handEntries = state.handEntries.filter((entry) => entry.t < entry.duration);
  }

  function burst(x, y, color, count, force) {
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const s = force * (0.35 + Math.random() * 0.85);
      state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: 0.25 + Math.random() * 0.25, color, size: 1.2 + Math.random() * 2.2 });
    }
  }

  function explosionFx(x, y, color, radius = 24) {
    state.particles.push(
      { flash: true, x, y, radius: radius * 0.78, life: 0.12, maxLife: 0.12, color: "#111318", alpha: 0.72 },
      { flash: true, x, y, radius: radius * 0.34, life: 0.08, maxLife: 0.08, color: "#d9d5c8", alpha: 0.38 },
      { ring: true, x, y, startRadius: 5, endRadius: radius * 1.35, width: 3, life: 0.30, maxLife: 0.30, color, alpha: 0.95 },
      { ring: true, x, y, startRadius: 2, endRadius: radius * 0.86, width: 2, life: 0.20, maxLife: 0.20, color: "#6d7078", alpha: 0.62 },
    );
    burst(x, y, color, 24, 76);
    burst(x, y, "#090a0c", 12, 62);
    burst(x, y, "#8b8d92", 6, 48);
  }

  function baseBreakExplosionFx(x, y, color) {
    state.particles.push(
      { flash: true, x, y, radius: 46, life: 0.18, maxLife: 0.18, color: "#f7f2e8", alpha: 0.7 },
      { flash: true, x, y, radius: 58, life: 0.24, maxLife: 0.24, color, alpha: 0.52 },
      { flash: true, x, y, radius: 34, life: 0.16, maxLife: 0.16, color: "#111318", alpha: 0.78 },
      { ring: true, x, y, startRadius: 8, endRadius: 70, width: 5, life: 0.46, maxLife: 0.46, color: "#f7f2e8", alpha: 0.92 },
      { ring: true, x, y, startRadius: 4, endRadius: 88, width: 4, life: 0.56, maxLife: 0.56, color, alpha: 0.86 },
      { ring: true, x, y, startRadius: 2, endRadius: 48, width: 3, life: 0.34, maxLife: 0.34, color: "#050507", alpha: 0.72 },
    );
    burst(x, y, color, 52, 150);
    burst(x, y, "#f7f2e8", 22, 125);
    burst(x, y, "#050507", 18, 105);
  }

  function bossFinalExplosionFx(x, y) {
    state.particles.push(
      { flash: true, x, y, radius: 88, life: 0.32, maxLife: 0.32, color: "#f7f2e8", alpha: 0.95 },
      { flash: true, x, y, radius: 118, life: 0.42, maxLife: 0.42, color: "#ff00e6", alpha: 0.44 },
      { flash: true, x, y, radius: 104, life: 0.38, maxLife: 0.38, color: "#00b0ff", alpha: 0.38 },
      { ring: true, x, y, startRadius: 10, endRadius: 118, width: 6, life: 0.78, maxLife: 0.78, color: "#f7f2e8", alpha: 1 },
      { ring: true, x, y, startRadius: 4, endRadius: 148, width: 5, life: 0.92, maxLife: 0.92, color: "#ff00e6", alpha: 0.82 },
      { ring: true, x, y, startRadius: 2, endRadius: 92, width: 4, life: 0.62, maxLife: 0.62, color: "#050507", alpha: 0.76 },
      { bossWhiteoutBlast: true, x, y, startRadius: 82, endRadius: Math.hypot(PHONE_BRAWL_W, PHONE_BRAWL_H), delay: 2, life: 4.6, maxLife: 2.6 },
    );
    burst(x, y, "#f7f2e8", 72, 190);
    burst(x, y, "#ff1744", 34, 170);
    burst(x, y, "#00b0ff", 30, 155);
    burst(x, y, "#050507", 28, 150);
    baseBreakExplosionFx(x, y, "#ef5b5b");
  }

  function beam(x1, y1, x2, y2, color, heal) {
    if (!isFinitePoint(x1, y1, x2, y2)) return;
    state.particles.push({ beam: true, x1, y1, x2, y2, color, heal, life: 0.11 });
  }

  function fishingLine(x1, y1, x2, y2, color) {
    const sx = x1 + 6;
    const sy = y1 - 11;
    const ex = x2;
    const ey = y2 - 5;
    if (!isFinitePoint(sx, sy, ex, ey)) return;
    state.particles.push({ fishingLine: true, x: sx, y: sy, vx: 0, vy: 0, x1: sx, y1: sy, x2: ex, y2: ey, color, life: 0.2, maxLife: 0.2 });
  }

  function lightningFx(x1, y1, x2, y2, color) {
    const sx = x1 + 2;
    const sy = y1 - 13;
    const ex = x2;
    const ey = y2 - 5;
    if (!isFinitePoint(sx, sy, ex, ey)) return;
    const dx = ex - sx;
    const dy = ey - sy;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const points = [];
    const segments = 7;
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const jitter = i === 0 || i === segments ? 0 : ((Math.random() - 0.5) * 14);
      points.push({
        x: sx + dx * t + nx * jitter,
        y: sy + dy * t + ny * jitter,
      });
    }
    state.particles.push({ lightning: true, points, color, life: 0.16, maxLife: 0.16 });
  }

  function nidhoggFlameFx(x1, y1, x2, y2, duration = 0.22, color = "#9b63ff") {
    if (!isFinitePoint(x1, y1, x2, y2)) return null;
    const particle = {
      nidhoggFlame: true,
      x1,
      y1,
      x2,
      y2,
      phase: Math.random() * Math.PI * 2,
      color,
      life: duration,
      maxLife: duration,
    };
    state.particles.push(particle);
    return particle;
  }

  function meleeHitFx(x, y, color, scale = 1) {
    state.particles.push({ melee: true, x, y, vx: 0, vy: 0, color, scale, life: 0.28, maxLife: 0.28, size: 13 });
  }

  function floatText(x, y, text, color, life = 0.72) {
    state.floating.push({ x, y, text, color, life, maxLife: life });
  }

  function speechText(x, y, text, color, life = 1.44) {
    state.floating.push({ kind: "speech", x, y, text, color, life, maxLife: life });
  }

  function ensureAudio() {
    const AudioCtx = inputTarget.AudioContext || inputTarget.webkitAudioContext;
    if (!AudioCtx) return;
    if (!audio) {
      const ctx = new AudioCtx();
      const master = ctx.createGain();
      master.gain.value = 0.46;
      master.connect(ctx.destination);
      audio = { ctx, master, step: 0, timer: 0, noise: makeNoise(ctx) };
    }
    audio.ctx.resume?.();
    if (activeInternalBgm) startBgm();
    else stopBgm();
  }

  function makeNoise(ctx) {
    const b = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
    return b;
  }

  function startBgm() {
    if (bgmSrc) {
      startMediaBgm();
      return;
    }
    if (!audio || audio.timer) return;
    const stepMs = (60 / 128 / 4) * 1000;
    const tick = () => {
      if (!audio || audio.ctx.state !== "running") return;
      const step = audio.step;
      const now = audio.ctx.currentTime + 0.02;
      if (step % 4 === 0) kick(now);
      if (step % 2 === 0) hat(now);
      if (step % 8 === 2 || step % 8 === 6) tone([55, 65.41, 73.42, 49][(step / 2) % 4 | 0], 0.14, "sawtooth", 0.035, now);
      if (step % 16 === 0) for (const f of [220, 261.63, 329.63]) tone(f, 0.08, "triangle", 0.012, now);
      audio.step = (step + 1) % 64;
    };
    tick();
    audio.timer = inputTarget.setInterval(tick, stepMs);
  }

  function startMediaBgm() {
    if (!bgmSrc || typeof Audio === "undefined") return;
    if (!mediaBgm) {
      mediaBgm = new Audio(bgmSrc);
      mediaBgm.loop = true;
      mediaBgm.preload = "auto";
      mediaBgm.volume = 0.22;
    }
    mediaBgm.play().catch(() => {});
  }

  function stopBgm() {
    if (audio?.timer) inputTarget.clearInterval(audio.timer);
    if (audio) audio.timer = 0;
    if (mediaBgm) {
      mediaBgm.pause();
      mediaBgm.currentTime = 0;
    }
  }

  function env(when, gain, dur) {
    const g = audio.ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    g.connect(audio.master);
    return g;
  }

  function tone(freq, dur, type = "square", gain = 0.04, when = audio?.ctx.currentTime || 0) {
    if (!audio) return;
    const o = audio.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    o.connect(env(when, gain, dur));
    o.start(when);
    o.stop(when + dur + 0.04);
  }

  function noise(dur, gain, when = audio?.ctx.currentTime || 0, filterFreq = 7000) {
    if (!audio) return;
    const src = audio.ctx.createBufferSource();
    const filter = audio.ctx.createBiquadFilter();
    src.buffer = audio.noise;
    filter.type = "highpass";
    filter.frequency.setValueAtTime(filterFreq, when);
    src.connect(filter);
    filter.connect(env(when, gain, dur));
    src.start(when);
    src.stop(when + dur + 0.02);
  }

  function kick(when) {
    if (!audio) return;
    const o = audio.ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(132, when);
    o.frequency.exponentialRampToValueAtTime(43, when + 0.16);
    o.connect(env(when, 0.13, 0.22));
    o.start(when);
    o.stop(when + 0.24);
  }

  function hat(when) { noise(0.045, 0.018, when, 8500); }
  function playSelectSound() { tone(660, 0.055, "square", 0.035); }
  function playDeploySound() {
    const now = audio?.ctx.currentTime || 0;
    tone(220, 0.08, "sawtooth", 0.055, now);
    tone(440, 0.1, "square", 0.04, now + 0.06);
  }
  function playBuzzerSound() { tone(92, 0.16, "sawtooth", 0.05); }
  function playRepairSound() { tone(523.25, 0.07, "triangle", 0.035); }
  function playResetSound() { tone(330, 0.05, "triangle", 0.025); }
  function playPepperCatchSound() {
    const now = audio?.ctx.currentTime || 0;
    tone(784, 0.045, "square", 0.025, now);
    tone(1174.66, 0.055, "triangle", 0.018, now + 0.035);
  }
  function playHitSound() {
    if (!audio) return;
    const now = audio.ctx.currentTime;
    if (now - lastHitSoundAt < 0.045) return;
    lastHitSoundAt = now;
    noise(0.08, 0.04, now, 1500);
  }
  function playFeverWarpSound(step = 0) {
    if (!audio) return;
    const now = audio.ctx.currentTime + 0.01;
    const notes = [0, 5, 9, 14, 9, 5];
    const base = 392 * Math.pow(2, notes[step % notes.length] / 12);
    const o = audio.ctx.createOscillator();
    const wob = audio.ctx.createOscillator();
    const wobGain = audio.ctx.createGain();
    o.type = "sine";
    wob.type = "sine";
    o.frequency.setValueAtTime(base, now);
    o.frequency.exponentialRampToValueAtTime(base * 1.82, now + 0.075);
    o.frequency.exponentialRampToValueAtTime(base * 1.18, now + 0.13);
    wob.frequency.setValueAtTime(26, now);
    wobGain.gain.setValueAtTime(base * 0.045, now);
    wob.connect(wobGain);
    wobGain.connect(o.frequency);
    o.connect(env(now, 0.026, 0.15));
    o.start(now);
    wob.start(now);
    o.stop(now + 0.17);
    wob.stop(now + 0.17);
    tone(base * 2.04, 0.045, "triangle", 0.012, now + 0.04);
  }
  function playBaseHitSound() { tone(70, 0.18, "sawtooth", 0.06); noise(0.12, 0.035, audio?.ctx.currentTime || 0, 900); }
  function playResultSound(result) {
    if (!audio) return;
    const now = audio.ctx.currentTime;
    if (result === "victory") {
      tone(523.25, 0.12, "square", 0.05);
      tone(659.25, 0.12, "square", 0.045, now + 0.12);
      tone(783.99, 0.2, "square", 0.04, now + 0.24);
    } else if (result === "defeat") {
      tone(220, 0.16, "sawtooth", 0.05);
      tone(146.83, 0.22, "sawtooth", 0.045, now + 0.14);
    } else {
      tone(392, 0.12, "triangle", 0.04);
    }
  }

  function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    if (["arrowleft", "arrowright", "arrowup", "arrowdown", "a", "d", "w", "s", "x", "z", "enter"].includes(key)) {
      event.preventDefault();
      ensureAudio();
    }
    if (state.gameOverFall) {
      if ((key === "z" || key === "enter") && !event.repeat) confirmGameOverFall();
      return;
    }
    if (state.defeatChoice) {
      if ((key === "arrowup" || key === "w" || key === "arrowleft" || key === "a") && !event.repeat) moveDefeatChoice(-1);
      else if ((key === "arrowdown" || key === "s" || key === "arrowright" || key === "d") && !event.repeat) moveDefeatChoice(1);
      else if ((key === "z" || key === "enter") && !event.repeat) confirmDefeatChoice();
      return;
    }
    if (key === "z" && state.victoryCelebration && !event.repeat) {
      confirmVictoryCelebration();
      return;
    }
    if (key === "arrowleft" || key === "a") state.keys.left = true;
    else if (key === "arrowright" || key === "d") state.keys.right = true;
    else if (key === "arrowup" || key === "w") state.keys.up = true;
    else if (key === "arrowdown" || key === "s") state.keys.down = true;
    else if (key === "x" && !event.repeat) selectNextCard();
    else if (key === "z" && !event.repeat) deploySelectedCard();
    else if (key === "enter" && state.gameOver && !event.repeat) confirmGameOver();
  }

  function handleKeyUp(event) {
    const key = event.key.toLowerCase();
    if (key === "arrowleft" || key === "a") state.keys.left = false;
    else if (key === "arrowright" || key === "d") state.keys.right = false;
    else if (key === "arrowup" || key === "w") state.keys.up = false;
    else if (key === "arrowdown" || key === "s") state.keys.down = false;
  }

  function pollInput() {
    if (!input) return;
    if (state.gameOverFall) {
      if (input.consume("z") || input.consume("Enter")) confirmGameOverFall();
      return;
    }
    if (state.defeatChoice) {
      if (input.consume("ArrowUp") || input.consume("w") || input.consume("ArrowLeft") || input.consume("a")) moveDefeatChoice(-1);
      if (input.consume("ArrowDown") || input.consume("s") || input.consume("ArrowRight") || input.consume("d")) moveDefeatChoice(1);
      if (input.consume("z") || input.consume("Enter")) confirmDefeatChoice();
      return;
    }
    state.keys.left = input.down("ArrowLeft") || input.down("a");
    state.keys.right = input.down("ArrowRight") || input.down("d");
    state.keys.up = input.down("ArrowUp") || input.down("w");
    state.keys.down = input.down("ArrowDown") || input.down("s");
    if (state.victoryCelebration && input.consume("z")) {
      confirmVictoryCelebration();
      return;
    }
    if (input.consume("x")) selectNextCard();
    if (input.consume("z")) deploySelectedCard();
    if (state.gameOver && input.consume("Enter")) confirmGameOver();
  }

  if (!input) {
    inputTarget.addEventListener?.("keydown", handleKeyDown);
    inputTarget.addEventListener?.("keyup", handleKeyUp);
  }

  return {
    start,
    update,
    draw,
    close,
    reset,
    isActive: () => state.active,
    isGameOver: () => state.gameOver,
    getSnapshot: () => ({
      gameOver: state.gameOver,
      playerHp: Math.max(0, state.playerHp | 0),
      enemyHp: Math.max(0, state.enemyHp | 0),
      energy: state.energy,
      enemyEnergy: state.enemyEnergy,
      elapsed: state.elapsed,
      selectedCardId: selectedCard()?.id || null,
      playerHandIds: state.playerHand.map((card) => card.id),
      enemyHandIds: state.enemyHand.map((card) => card.id),
      unitCount: state.units.length,
      playerX: state.playerX,
      playerY: state.playerY,
    }),
    destroy() {
      close();
      if (!input) {
        inputTarget.removeEventListener?.("keydown", handleKeyDown);
        inputTarget.removeEventListener?.("keyup", handleKeyUp);
      }
    },
  };
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = (Math.random() * (i + 1)) | 0;
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function isFinitePoint(...values) {
  return values.every(Number.isFinite);
}

function colorWithAlpha(color, alpha) {
  if (typeof color !== "string") return `rgba(241,200,75,${alpha})`;
  if (color.startsWith("rgba(")) return color.replace(/,\s*[\d.]+\)$/, `,${alpha})`);
  if (color.startsWith("rgb(")) return color.replace("rgb(", "rgba(").replace(")", `,${alpha})`);
  if (/^#[0-9a-f]{6}$/i.test(color)) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return color;
}

function makeSpaceStars() {
  let seed = 0x5eed1234;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  return Array.from({ length: 140 }, () => ({
    x: (rand() * PHONE_BRAWL_W) | 0,
    y: (rand() * (FIELD_Y + FIELD_H)) | 0,
    r: rand() < 0.15 ? 2 : 1,
    a: 0.45 + rand() * 0.55,
    speed: 0.0015 + rand() * 0.004,
    phase: rand() * Math.PI * 2,
  }));
}

function drawTinyHp(ctx, x, y, w, h, pct, color) {
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, Math.max(0, (w - 2) * clamp(pct, 0, 1)), h - 2);
}

function drawPixelHeart(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 3, y - 2, 2, 2);
  ctx.fillRect(x + 1, y - 2, 2, 2);
  ctx.fillRect(x - 4, y, 8, 2);
  ctx.fillRect(x - 3, y + 2, 6, 2);
  ctx.fillRect(x - 1, y + 4, 2, 2);
}

function drawPixelVillainMark(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 4, y - 4, 2, 2);
  ctx.fillRect(x + 2, y - 4, 2, 2);
  ctx.fillRect(x - 3, y - 2, 6, 2);
  ctx.fillRect(x - 4, y, 8, 4);
  ctx.fillStyle = "#ef5b5b";
  ctx.fillRect(x - 2, y + 1, 1, 1);
  ctx.fillRect(x + 1, y + 1, 1, 1);
  ctx.fillStyle = color;
  ctx.fillRect(x - 2, y + 4, 4, 1);
}

function drawEnemyBaseMark(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.36)";
  ctx.beginPath();
  ctx.ellipse(x, y + 28, 24, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ef5b5b";
  ctx.beginPath();
  ctx.moveTo(x - 18, y - 23);
  ctx.lineTo(x - 4, y - 14);
  ctx.lineTo(x, y - 29);
  ctx.lineTo(x + 4, y - 14);
  ctx.lineTo(x + 18, y - 23);
  ctx.lineTo(x + 20, y + 8);
  ctx.lineTo(x + 11, y + 25);
  ctx.lineTo(x - 11, y + 25);
  ctx.lineTo(x - 20, y + 8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#111116";
  ctx.beginPath();
  ctx.moveTo(x - 13, y - 15);
  ctx.lineTo(x, y - 22);
  ctx.lineTo(x + 13, y - 15);
  ctx.lineTo(x + 16, y + 7);
  ctx.lineTo(x + 8, y + 18);
  ctx.lineTo(x - 8, y + 18);
  ctx.lineTo(x - 16, y + 7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ff3347";
  ctx.beginPath();
  ctx.moveTo(x - 11, y - 2);
  ctx.lineTo(x - 3, y);
  ctx.lineTo(x - 3, y + 4);
  ctx.lineTo(x - 12, y + 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 11, y - 2);
  ctx.lineTo(x + 3, y);
  ctx.lineTo(x + 3, y + 4);
  ctx.lineTo(x + 12, y + 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f7f2e8";
  ctx.fillRect(x - 6, y + 11, 12, 2);
  ctx.fillStyle = "#111116";
  ctx.fillRect(x - 3, y + 11, 1, 3);
  ctx.fillRect(x + 2, y + 11, 1, 3);
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(x - 9, y - 12, 18, 1);
  ctx.restore();
}

function drawFixedPixelText(ctx, text, cx, y, advance) {
  const oldAlign = ctx.textAlign;
  const chars = String(text).split("");
  const startX = Math.round(cx - (chars.length * advance) / 2);
  ctx.textAlign = "left";
  for (let i = 0; i < chars.length; i += 1) {
    ctx.fillText(chars[i], startX + i * advance, Math.round(y));
  }
  ctx.textAlign = oldAlign;
}

function drawSegmentedHp(ctx, x, y, w, h, hp, color) {
  const gap = 2;
  const cellW = (w - gap * (BASE_HP_SEGMENTS - 1)) / BASE_HP_SEGMENTS;
  const value = clamp(hp, 0, BASE_MAX_HP);
  for (let i = 0; i < BASE_HP_SEGMENTS; i += 1) {
    const cx = x + i * (cellW + gap);
    const fill = clamp((value - i * BASE_SEGMENT_HP) / BASE_SEGMENT_HP, 0, 1);
    ctx.fillStyle = "rgba(0,0,0,0.64)";
    roundRect(ctx, cx, y + 1, cellW, h, 4);
    ctx.fill();
    ctx.fillStyle = "#20222b";
    roundRect(ctx, cx, y, cellW, h, 4);
    ctx.fill();
    if (fill > 0) {
      ctx.fillStyle = color;
      roundRect(ctx, cx + 1, y + 1, Math.max(1, (cellW - 2) * fill), h - 2, 3);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.42)";
      ctx.fillRect(cx + 4, y + 2, Math.max(2, (cellW - 8) * fill), 1);
    }
    ctx.strokeStyle = "rgba(247,242,232,0.25)";
    ctx.strokeRect(cx + 0.5, y + 0.5, cellW - 1, h - 1);
  }
}

function canDrawSprite(img) {
  return !!spriteMetrics(img);
}

function canDrawImage(img) {
  return !!img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
}

function firstSprite(value) {
  return Array.isArray(value) ? value.find(canDrawSprite) || value[0] : value;
}

function indexedSprite(value, index = 0) {
  if (!Array.isArray(value)) return value;
  return value[index % value.length] || firstSprite(value);
}

function spriteMetrics(img) {
  if (!img || !img.complete || img.naturalWidth < 2 || img.naturalHeight < 1) return null;
  const frameCount = img.frameCount || (img.naturalWidth >= img.naturalHeight * 1.5 ? 2 : 1);
  return {
    w: Math.max(1, Math.floor(img.naturalWidth / frameCount)),
    h: img.naturalHeight,
    frameCount,
  };
}

function drawSpriteFit(ctx, img, frame, cx, cy, maxW, maxH, flip = false) {
  const metrics = spriteMetrics(img);
  if (!metrics) return;
  const scale = Math.min(1, maxW / metrics.w, maxH / metrics.h);
  const w = Math.max(1, Math.round(metrics.w * scale));
  const h = Math.max(1, Math.round(metrics.h * scale));
  drawSpriteFrame(ctx, img, frame, cx - w / 2, cy - h / 2, w, h, flip);
}

function drawImageFit(ctx, img, cx, cy, maxW, maxH) {
  if (!canDrawImage(img)) return;
  const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
}

function drawBaseSprite(ctx, img, cx, cy, maxW, maxH) {
  if (!canDrawImage(img)) return;
  const frameCount = img.naturalWidth >= img.naturalHeight * 1.5 ? 2 : 1;
  const frameW = Math.floor(img.naturalWidth / frameCount);
  const frameH = img.naturalHeight;
  const frame = frameCount > 1 ? ((Date.now() / 360) | 0) % frameCount : 0;
  const scale = Math.min(maxW / frameW, maxH / frameH);
  const w = Math.max(1, Math.round(frameW * scale));
  const h = Math.max(1, Math.round(frameH * scale));
  ctx.drawImage(img, frame * frameW, 0, frameW, frameH, cx - w / 2, cy - h / 2, w, h);
}

function drawSpriteFrame(ctx, img, frame, x, y, w, h, flip = false) {
  const metrics = spriteMetrics(img);
  if (!metrics) return;
  const sx = (frame % metrics.frameCount) * metrics.w;
  const sy = 0;
  const sw = metrics.w;
  const sh = metrics.h;
  ctx.save();
  if (flip) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  } else {
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }
  ctx.restore();
}

function drawSpriteFrameTint(ctx, img, frame, x, y, w, h, flip = false, color = "#fff", alpha = 1) {
  const metrics = spriteMetrics(img);
  if (!metrics || alpha <= 0 || typeof document === "undefined") return;
  const tw = Math.max(1, Math.ceil(w));
  const th = Math.max(1, Math.ceil(h));
  const off = drawSpriteFrameTint.canvas || (drawSpriteFrameTint.canvas = document.createElement("canvas"));
  if (off.width !== tw || off.height !== th) {
    off.width = tw;
    off.height = th;
  }
  const ox = off.getContext("2d");
  ox.imageSmoothingEnabled = false;
  ox.setTransform(1, 0, 0, 1, 0, 0);
  ox.globalAlpha = 1;
  ox.globalCompositeOperation = "source-over";
  ox.clearRect(0, 0, tw, th);
  ox.drawImage(img, (frame % metrics.frameCount) * metrics.w, 0, metrics.w, metrics.h, 0, 0, tw, th);
  ox.globalCompositeOperation = "source-in";
  ox.fillStyle = color;
  ox.fillRect(0, 0, tw, th);

  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.imageSmoothingEnabled = false;
  if (flip) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(off, 0, 0, tw, th, 0, 0, w, h);
  } else {
    ctx.drawImage(off, 0, 0, tw, th, x, y, w, h);
  }
  ctx.restore();
}

function drawUnitBoostGlow(ctx, img, frame, x, y, w, h, flip, phase, type) {
  if (stateLightBoostVisuals(ctx)) {
    drawSimpleUnitBoostGlow(ctx, x, y, w, h, phase, type);
    return;
  }
  if (type === "attack") drawAttackUnitGlow(ctx, img, frame, x, y, w, h, flip, phase);
  else drawFeverUnitGlow(ctx, img, frame, x, y, w, h, flip, phase);
}

function stateLightBoostVisuals(ctx) {
  return !!ctx?._phoneBrawlLightBoostVisuals;
}

function drawSimpleUnitBoostGlow(ctx, x, y, w, h, phase, type) {
  const pulse = type === "attack"
    ? 0.45 + 0.22 * Math.sin(phase * 16)
    : 0.38 + 0.22 * Math.sin(phase * 15);
  const cx = x + w / 2;
  const cy = y + h * 0.58;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = pulse;
  ctx.fillStyle = type === "attack"
    ? "#ef3e45"
    : `hsl(${(phase * 380 + x * 1.4) % 360},100%,62%)`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(7, w * 0.58), Math.max(5, h * 0.34), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFeverUnitGlow(ctx, img, frame, x, y, w, h, flip, phase) {
  const hue = (phase * 420 + x * 1.7) % 360;
  const colorA = `hsl(${hue},100%,62%)`;
  const colorB = `hsl(${(hue + 92) % 360},100%,64%)`;
  const colorC = `hsl(${(hue + 184) % 360},100%,66%)`;
  const pulse = 0.5 + 0.28 * Math.sin(phase * 18);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  drawSpriteFrameTint(ctx, img, frame, x - 1, y, w, h, flip, colorA, pulse * 0.36);
  drawSpriteFrameTint(ctx, img, frame, x + 1, y, w, h, flip, colorB, pulse * 0.36);
  drawSpriteFrameTint(ctx, img, frame, x, y - 1, w, h, flip, colorC, pulse * 0.28);
  drawSpriteFrameTint(ctx, img, frame, x, y + 1, w, h, flip, colorA, pulse * 0.24);
  drawSpriteFrameTint(ctx, img, frame, x, y, w, h, flip, colorB, pulse * 0.22);
  ctx.restore();
}

function drawAttackUnitGlow(ctx, img, frame, x, y, w, h, flip, phase) {
  const pulse = 0.68 + 0.28 * Math.sin(phase * 18);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  drawSpriteFrameTint(ctx, img, frame, x - 2, y, w, h, flip, "#ef3e45", pulse * 0.28);
  drawSpriteFrameTint(ctx, img, frame, x + 2, y, w, h, flip, "#ff2d20", pulse * 0.28);
  drawSpriteFrameTint(ctx, img, frame, x, y - 2, w, h, flip, "#ff7a35", pulse * 0.22);
  drawSpriteFrameTint(ctx, img, frame, x, y + 2, w, h, flip, "#ef3e45", pulse * 0.22);
  drawSpriteFrameTint(ctx, img, frame, x - 1, y, w, h, flip, "#ef3e45", pulse * 0.48);
  drawSpriteFrameTint(ctx, img, frame, x + 1, y, w, h, flip, "#ff2d20", pulse * 0.48);
  drawSpriteFrameTint(ctx, img, frame, x, y - 1, w, h, flip, "#ff7a35", pulse * 0.34);
  drawSpriteFrameTint(ctx, img, frame, x, y + 1, w, h, flip, "#ef3e45", pulse * 0.34);
  drawSpriteFrameTint(ctx, img, frame, x, y, w, h, flip, "#ef3e45", pulse * 0.48);
  ctx.restore();
}

function drawCurryPanicGlow(ctx, img, frame, x, y, w, h, flip, phase) {
  const pulse = 0.52 + 0.28 * Math.sin(phase * 18);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  drawSpriteFrameTint(ctx, img, frame, x - 1, y, w, h, flip, "#ff1e16", pulse * 0.34);
  drawSpriteFrameTint(ctx, img, frame, x + 1, y, w, h, flip, "#ff1e16", pulse * 0.34);
  drawSpriteFrameTint(ctx, img, frame, x, y - 1, w, h, flip, "#ff5a24", pulse * 0.24);
  drawSpriteFrameTint(ctx, img, frame, x, y + 1, w, h, flip, "#ff1e16", pulse * 0.2);
  drawSpriteFrameTint(ctx, img, frame, x, y, w, h, flip, "#ff2d20", pulse * 0.42);
  ctx.restore();
}

function drawCurrySetupSpark(ctx, x, y, phase) {
  const t = phase * 10;
  ctx.save();
  ctx.fillStyle = "#f0a33a";
  ctx.fillRect((x - 7 + Math.sin(t) * 2) | 0, (y + Math.cos(t * 1.2) * 2) | 0, 2, 2);
  ctx.fillStyle = "#f6d98a";
  ctx.fillRect((x + 4 + Math.sin(t * 1.4) * 2) | 0, (y - 3 + Math.cos(t) * 2) | 0, 2, 1);
  ctx.fillStyle = "#9c6a3a";
  ctx.fillRect((x - 1 + Math.sin(t * 1.8) * 3) | 0, (y + 5 + Math.cos(t * 1.5)) | 0, 2, 2);
  ctx.restore();
}

function drawCurryPanicSweat(ctx, x, y, w, h, phase) {
  const baseX = (x + w / 2) | 0;
  const baseY = (y + Math.max(3, h * 0.22)) | 0;
  const tt = phase * 7.2;
  const p1x = baseX + ((Math.sin(tt * 1.7) * Math.max(3, w * 0.28)) | 0);
  const p1y = baseY + ((Math.cos(tt * 2.1) * Math.max(2, h * 0.12)) | 0);
  const p2x = baseX + 3 + ((Math.sin(tt * 1.3 + 1.7) * Math.max(3, w * 0.3)) | 0);
  const p2y = baseY + 1 + ((Math.cos(tt * 1.9 + 0.8) * Math.max(2, h * 0.14)) | 0);
  const p3x = baseX - 2 + ((Math.sin(tt * 1.9 + 2.4) * Math.max(2, w * 0.22)) | 0);
  const p3y = baseY + 4 + ((Math.cos(tt * 1.5 + 1.2) * Math.max(1, h * 0.1)) | 0);
  ctx.save();
  ctx.fillStyle = "#ffd4d0";
  ctx.fillRect(p1x, p1y, 1, 2);
  ctx.fillRect(p2x, p2y, 1, 1);
  ctx.fillRect(p3x, p3y, 1, 1);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export default createPhoneBrawl;
