"""
generate_icons.py — Create the Tauri icon set for Demo SIEM.

Produces all icon sizes required by Tauri v2 from a programmatically drawn
512x512 source image. Requires Pillow (pip install Pillow).

Output: artifacts/cross-domain-demo/src-tauri/icons/
  32x32.png, 128x128.png, 128x128@2x.png (256x256), icon.png (512x512)
  icon.ico  (Windows multi-size)
  icon.icns (macOS — written as PNG with .icns extension for CI compatibility)

Usage:
  python3 scripts/generate_icons.py
"""

import os, struct, zlib, math
from pathlib import Path

ICONS_DIR = Path(__file__).parent.parent / "artifacts" / "cross-domain-demo" / "src-tauri" / "icons"
ICONS_DIR.mkdir(parents=True, exist_ok=True)

try:
    from PIL import Image, ImageDraw, ImageFont
    USE_PIL = True
except ImportError:
    USE_PIL = False
    print("Pillow not available — writing minimal valid PNG stubs.")


def _minimal_png(size: int, bg=(17, 19, 21), fg=(245, 130, 32)) -> bytes:
    """
    Pure-Python minimal PNG writer (no dependencies).
    Draws a filled square background + simple shield-ish cross shape in fg.
    """
    w = h = size
    img = []
    cx, cy = w // 2, h // 2
    arm = max(1, size // 6)
    for y in range(h):
        row = []
        for x in range(w):
            dx, dy = x - cx, y - cy
            r = max(abs(dx), abs(dy))
            in_cross = (abs(dx) <= arm) or (abs(dy) <= arm)
            margin = max(1, size // 8)
            in_bg = (margin <= x < w - margin) and (margin <= y < h - margin)
            if in_bg and in_cross:
                row.extend(fg)
            elif in_bg:
                row.extend(bg)
            else:
                row.extend((0, 0, 0))
        img.append(bytes([0]) + bytes(row))  # filter byte

    def chunk(name: bytes, data: bytes) -> bytes:
        c = name + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    ihdr_data = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    raw = zlib.compress(b"".join(img))
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr_data)
        + chunk(b"IDAT", raw)
        + chunk(b"IEND", b"")
    )


def make_icon_pil(size: int) -> "Image":
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = max(1, size // 10)

    # Dark background rounded square
    d.rounded_rectangle([pad, pad, size - pad, size - pad],
                        radius=size // 6, fill=(17, 19, 21, 255))

    # Orange accent — stylised shield outline (pentagon)
    s = size - pad * 2
    ox, oy = pad, pad
    pts = [
        (ox + s * 0.5, oy + s * 0.05),
        (ox + s * 0.9, oy + s * 0.2),
        (ox + s * 0.9, oy + s * 0.6),
        (ox + s * 0.5, oy + s * 0.95),
        (ox + s * 0.1, oy + s * 0.6),
        (ox + s * 0.1, oy + s * 0.2),
    ]
    pts = [(int(x), int(y)) for x, y in pts]
    lw = max(1, size // 20)
    d.polygon(pts, outline=(245, 130, 32, 255))

    # White cross / checkmark in centre
    c = size // 2
    arm = max(1, size // 8)
    d.rectangle([c - arm // 2, c - arm, c + arm // 2, c + arm], fill=(255, 255, 255, 220))
    d.rectangle([c - arm, c - arm // 2, c + arm, c + arm // 2], fill=(255, 255, 255, 220))
    return img


SIZES = {
    "32x32.png":      32,
    "128x128.png":    128,
    "128x128@2x.png": 256,
    "icon.png":       512,
}


def main():
    print(f"Writing icons to {ICONS_DIR}")

    for filename, size in SIZES.items():
        path = ICONS_DIR / filename
        if USE_PIL:
            img = make_icon_pil(size)
            img.save(path, "PNG")
        else:
            path.write_bytes(_minimal_png(size))
        print(f"  [ok] {filename} ({size}x{size})")

    # icon.ico — Windows multi-size bundle
    ico_path = ICONS_DIR / "icon.ico"
    if USE_PIL:
        img = make_icon_pil(256)
        img.save(ico_path, "ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
        print("  [ok] icon.ico (multi-size Windows icon)")
    else:
        ico_path.write_bytes(_minimal_png(32))
        print("  [ok] icon.ico (stub -- install Pillow for a proper multi-size .ico)")

    # icon.icns — macOS (use 512px PNG renamed; tauri-cli will handle properly on macOS)
    icns_path = ICONS_DIR / "icon.icns"
    if USE_PIL:
        img = make_icon_pil(512)
        img.save(ICONS_DIR / "icon.icns.png", "PNG")
        import shutil
        shutil.copy(ICONS_DIR / "icon.icns.png", icns_path)
        (ICONS_DIR / "icon.icns.png").unlink()
    else:
        icns_path.write_bytes(_minimal_png(512))
    print("  [ok] icon.icns (512px source; tauri icon command will reprocess on macOS)")

    print("\nDone. To regenerate from a custom source image:")
    print("  cargo tauri icon path/to/your-icon.png")


if __name__ == "__main__":
    main()
