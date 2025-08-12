from io import BytesIO

from PIL import ExifTags, Image, ImageOps

# EXIF tag for orientation
ORIENTATION_TAG = next((k for k, v in ExifTags.TAGS.items() if v == "Orientation"), None)


def get_orientation(image: Image.Image) -> int | None:
    """Return the EXIF orientation value if present."""
    if ORIENTATION_TAG is None:
        return None
    exif = image.getexif()
    return exif.get(ORIENTATION_TAG)


def normalize_orientation(data: bytes) -> bytes:
    """Return image bytes with EXIF orientation applied."""
    with Image.open(BytesIO(data)) as image:
        corrected = ImageOps.exif_transpose(image)
        output = BytesIO()
        corrected.save(output, format=image.format)
        return output.getvalue()
