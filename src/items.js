// items.js
import { rubberDucks }     from "./data/items/rubber_duck.js";
import { equipmentItems } from "./data/items/equipment.js";
import { foodItems }       from "./data/items/food.js";
import { otsugeItems }     from "./data/items/otsuge.js";

const TEMP_ITEMS = Array.from({ length: 10 }, (_, i) => ({
  id: `temp_item_${i + 1}`,
  name: `仮アイテム${i + 1}`,
  bgmSrc: null,
  throwDmg: 0,
}));

const ALL_ITEMS = [...rubberDucks, ...equipmentItems, ...foodItems, ...otsugeItems];
const ITEM_MAP = new Map([...ALL_ITEMS, ...TEMP_ITEMS].map((d) => [d.id, d]));

export const ALL_ITEM_IDS = ALL_ITEMS.map((d) => d.id);

export const START_INVENTORY_DEBUG = [
  ...ALL_ITEMS.flatMap((d) => d.id === "gunter" ? Array(10).fill(d.id) : [d.id]),
  ...TEMP_ITEMS.map((d) => d.id),
];
export const START_INVENTORY_NORMAL = [];
export const START_INVENTORY_EMPTY = [];

export function itemName(id)     { return ITEM_MAP.get(id)?.name    ?? id;   }
export function itemBgmSrc(id)   { return ITEM_MAP.get(id)?.bgmSrc  ?? null; }
export function itemThrowDmg(id) { return ITEM_MAP.get(id)?.throwDmg ?? 0;   }
