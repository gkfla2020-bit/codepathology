from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/codepathology"
    REDIS_URL: str = "redis://localhost:6379"
    OPENAI_API_KEY: str = "sk-xxx"
    JWT_SECRET: str = "your-secret-key"
    JWT_EXPIRE_MINUTES: int = 1440
    CORS_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()
