from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://orchestra:orchestra@localhost:5434/orchestra"
    cors_origins: list[str] = ["http://localhost:5173"]
    debug: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
