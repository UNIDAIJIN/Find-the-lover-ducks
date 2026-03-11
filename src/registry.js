// registry.js
// Central registry of major engine systems.
// Import REGISTRY instead of requiring main.js to track each module individually.
//
// Data modules (SPRITES, MAPS, items, npcs, etc.) are NOT included here —
// those are static data and are imported directly where needed.

import { createInput }        from "./input.js";
import { createBgm }          from "./audio_bgm.js";
import { createSea }          from "./fx_sea.js";
import { createDialog }       from "./ui_dialog.js";
import { createChoice }       from "./ui_choice.js";
import { createFade }         from "./fx_fade.js";
import { createInventory }    from "./ui_inventory.js";
import { createFollowers }    from "./party_followers.js";
import { createBattleSystem } from "./battle.js";
import { runNpcEvent }        from "./npc_events.js";

export const REGISTRY = {
  createInput,
  createBgm,
  createSea,
  createDialog,
  createChoice,
  createFade,
  createInventory,
  createFollowers,
  createBattleSystem,
  runNpcEvent,
};
