from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://shivthedev@/orchestra?host=/var/run/postgresql"
    cors_origins: list[str] = ["http://localhost:5173"]
    debug: bool = True
    redis_url: str = "redis://localhost:6379/0"
    redis_stream_maxlen: int = 1000
    redis_stream_ttl_seconds: int = 86_400
    workflow_files_dir: str = ""

    executor_mode: str = "inprocess"  # "docker" or "inprocess"
    agent_runner_image: str = "andromeda-agent-runner:latest"
    container_cpus: float = 1.0
    container_memory: str = "512m"
    container_timeout: int = 120

    class Config:
        env_file = ".env"


settings = Settings()
