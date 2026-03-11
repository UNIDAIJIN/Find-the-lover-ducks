// items.js
import { rubberDucks } from "./data/items/rubber_duck.js";

const ALL_ITEMS = [...rubberDucks];
const ITEM_MAP = new Map(ALL_ITEMS.map((d) => [d.id, d]));

export const START_INVENTORY = [];

export function itemName(id)     { return ITEM_MAP.get(id)?.name    ?? id;   }
export function itemBgmSrc(id)   { return ITEM_MAP.get(id)?.bgmSrc  ?? null; }
export function itemThrowDmg(id) { return ITEM_MAP.get(id)?.throwDmg ?? 0;   }
