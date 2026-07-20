from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "PlaceLens AI"
    API_V1_PREFIX: str = "/api"

    DATABASE_URL: str

    FRONTEND_URL: str

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    UPLOAD_DIR: str = "uploads/resumes"
    MAX_UPLOAD_SIZE_MB: int = 5

    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # Email verification
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str
    SMTP_PASSWORD: str
    SMTP_FROM_EMAIL: str

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

settings = Settings()