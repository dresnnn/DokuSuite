from __future__ import annotations

from io import BytesIO

import imagehash
from PIL import Image


def compute_phash(data: bytes) -> str:
    """Return the perceptual hash of the given image bytes."""
    with Image.open(BytesIO(data)) as img:
        return str(imagehash.phash(img))
