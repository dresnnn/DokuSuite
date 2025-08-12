from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "DokuSuite API"
    environment: str = "dev"
    debug: bool = True

    # Pydantic v2 style config
    model_config = SettingsConfigDict(env_prefix="DOKUSUITE_")


settings = Settings()  # load from env at import time
