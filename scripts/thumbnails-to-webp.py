"""Shrink the screenshots from build-template-thumbnails.mjs into card-sized WebP."""
import sys, pathlib
from PIL import Image

SHOTS = pathlib.Path(".design-sources/template-shots")
OUT = pathlib.Path("assets/templates")
OUT.mkdir(parents=True, exist_ok=True)

# A card is about 170pt wide in a two-column grid; 640 covers that at @3x.
SIZE = (640, 480)
BANNER = 56

total = 0
for name in sys.argv[1:]:
    src = SHOTS / f"{name}.png"
    if not src.exists():
        print(f"  missing {name}")
        continue
    im = Image.open(src).convert("RGB")
    # The website puts a "this is a sample" bar above the page. It belongs to
    # the sample, not the template, so it does not belong in the thumbnail.
    im = im.crop((0, BANNER, im.width, im.height))
    im = im.resize(SIZE, Image.LANCZOS)
    dest = OUT / f"{name}.webp"
    im.save(dest, "WEBP", quality=78, method=6)
    total += dest.stat().st_size
    print(f"  {name:16} {dest.stat().st_size/1024:6.0f} KB")

print(f"\n{len(sys.argv)-1} thumbnails, {total/1024:.0f} KB total")
