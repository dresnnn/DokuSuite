from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "DokuSuite API"
    environment: str = "dev"
    debug: bool = True

    class Config:
        env_prefix = "DOKUSUITE_"


settings = Settings()  # load from env at import time

