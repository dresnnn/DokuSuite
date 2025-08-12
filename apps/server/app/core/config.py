from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "DokuSuite API"
    environment: str = "dev"
    debug: bool = True
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expires_minutes: int = 60
    admin_email: str = "admin@example.com"
    # For development, default to plain 'admin'. Provide a bcrypt hash via env for production.
    admin_password_hash: str = "admin"

    # Pydantic v2 style config
    model_config = SettingsConfigDict(env_prefix="DOKUSUITE_")


settings = Settings()  # load from env at import time
