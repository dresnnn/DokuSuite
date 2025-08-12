from io import BytesIO

from PIL import Image

from app.services.exif import get_orientation, normalize_orientation


def _make_orientation_6_image() -> bytes:
    """Return JPEG bytes with EXIF orientation set to 6 (90° CW)."""
    img = Image.new("RGB", (1, 2), color="red")
    exif = img.getexif()
    exif[274] = 6
    buf = BytesIO()
    img.save(buf, format="JPEG", exif=exif)
    return buf.getvalue()


def test_orientation_flag_is_applied():
    data = _make_orientation_6_image()
    with Image.open(BytesIO(data)) as img:
        assert get_orientation(img) == 6
        original_size = img.size
    normalized = normalize_orientation(data)
    with Image.open(BytesIO(normalized)) as img:
        corrected_size = img.size
    assert original_size[1] > original_size[0]
    assert corrected_size[0] > corrected_size[1]

