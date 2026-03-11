# Find-the-lover-ducks

# Find the Lover Ducks

A modular HTML Canvas RPG engine.

This project is built with ES Modules and designed to keep gameplay systems separated into independent modules.

The goal is to maintain a simple and extendable architecture so new systems can be added without modifying the core loop.

---

## Run

Open `index.html` in a browser.

No build step is required.

---

## Controls

Arrow Keys  
Move

Z  
Interact / Confirm

X  
Open inventory

---

## Engine Structure

main.js  
Game loop  
Map loading  
Actor update  
Rendering

battle.js  
Battle system

maps.js  
Map data and loading

npc_events.js  
Special NPC event logic

npcs.js  
NPC definitions

party_followers.js  
Follower movement system

ui_dialog.js  
Message window

ui_choice.js  
Choice window

ui_inventory.js  
Inventory UI

fx_fade.js  
Fade transitions

fx_sea.js  
Sea animation

audio_bgm.js  
Background music control

---

## Rendering Order

sea  
background  
actors  
inventory  
dialog  
choice  
fade

---

## Code Rules

When modifying code:

Do not break existing systems.

Prefer extending modules rather than modifying `main.js`.

Always output full code when modifying a file.

Maintain ES module imports.

Do not remove existing features.

---

## Notes

This engine is designed to stay lightweight and readable.

Systems are intentionally separated so new mechanics can be added as independent modules without restructuring the entire project.
