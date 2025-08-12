from pydantic import BaseModel, ConfigDict, Field


class UploadIntentRequest(BaseModel):
    content_type: str = Field(..., alias="contentType")
    size: int = Field(..., ge=1)

    model_config = ConfigDict(populate_by_name=True)


class UploadIntent(BaseModel):
    object_key: str
    url: str
    fields: dict[str, str]
    expires_in: int
