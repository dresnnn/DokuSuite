"""Pydantic models related to uploads."""

from pydantic import BaseModel, ConfigDict, Field

# Only images are accepted for uploads.
ALLOWED_MIME_PREFIX = "image/"
# Maximum allowed size of an uploaded file in bytes (10 MiB).
MAX_FILE_SIZE = 10 * 1024 * 1024


class UploadIntentRequest(BaseModel):
    """Client request to obtain a signed upload URL."""

    content_type: str = Field(
        ..., alias="contentType", description="MIME type of the file (image/* only)"
    )
    size: int = Field(..., ge=1, description="Size of the file in bytes")

    model_config = ConfigDict(populate_by_name=True)


class UploadIntent(BaseModel):
    object_key: str
    url: str
    fields: dict[str, str]
    expires_in: int
