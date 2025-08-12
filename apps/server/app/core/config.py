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

    # Hetzner S3 configuration
    s3_endpoint_url: str = "https://example.com"
    s3_region: str = "us-east-1"
    s3_bucket: str = "dokusuite"
    s3_access_key: str = "test"
    s3_secret_key: str = "test"
    s3_presign_ttl: int = 3600  # seconds
    s3_cors_origin: str = "*"

    # Public share base URL
    share_base_url: str = "https://example.com/share"

    # SMTP mail configuration
    smtp_host: str = "localhost"
    smtp_port: int = 25
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from: str = "no-reply@example.com"

    # Pydantic v2 style config
    model_config = SettingsConfigDict(env_prefix="DOKUSUITE_")


settings = Settings()  # load from env at import time
