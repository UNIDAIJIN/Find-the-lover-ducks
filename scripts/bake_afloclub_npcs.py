from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MAP_PATH = ROOT / "assets/maps/afloclub.png"
OUT_PATH = ROOT / "assets/maps/afloclub_baked.png"
SPRITES_DIR = ROOT / "assets/sprites"

NPCS = [
    {"sprite": "ac_1.png", "x": 159, "y": 124},
    {"sprite": "ac_2.png", "x": 80, "y": 160},
    {"sprite": "ac_3.png", "x": 64, "y": 139},
    {"sprite": "ac_4.png", "x": 123, "y": 151},
    {"sprite": "ac_5.png", "x": 40, "y": 166},
    {"sprite": "ac_6.png", "x": 95, "y": 123},
]


def main():
    base = Image.open(MAP_PATH).convert("RGBA")
    ordered = sorted(NPCS, key=lambda npc: npc["y"])
    for npc in ordered:
      sprite = Image.open(SPRITES_DIR / npc["sprite"]).convert("RGBA")
      frame = sprite.crop((0, 0, 16, 16))
      base.alpha_composite(frame, (npc["x"], npc["y"]))
    base.save(OUT_PATH)
    print(f"wrote {OUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
