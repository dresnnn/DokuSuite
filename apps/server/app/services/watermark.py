from __future__ import annotations

from datetime import datetime
from io import BytesIO

from PIL import Image, ImageDraw, ImageFont


def apply_watermark(data: bytes) -> bytes:
    """Overlay logo and current date onto image bytes."""
    with Image.open(BytesIO(data)) as im:
        im = im.convert("RGBA")
        watermark = Image.new("RGBA", im.size)
        draw = ImageDraw.Draw(watermark)
        text = f"DokuSuite {datetime.utcnow().date().isoformat()}"
        try:
            font = ImageFont.load_default()
        except Exception:  # pragma: no cover - fallback
            font = None
        position = (10, im.height - 20)
        draw.text(position, text, fill=(255, 255, 255, 128), font=font)
        combined = Image.alpha_composite(im, watermark)
        out = BytesIO()
        combined.convert("RGB").save(out, format="JPEG")
        return out.getvalue()
