from __future__ import annotations

from functools import cached_property

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./d4meta.db"
    cors_origins: list[str] = ["http://localhost:5173"]
    gamedata_dir: str = "./data/gamedata"
    gamedata_repo: str = "https://raw.githubusercontent.com/DiabloTools/d4data/master"
    user_agent: str = "d4-meta-forge/0.1 (+https://github.com/youruser/d4-meta-forge)"
    current_patch: str = "3.0"  # sobrescrevível via CURRENT_PATCH; patch atual da Blizzard

    @cached_property
    def connect_args(self) -> dict:
        return {"check_same_thread": False} if self.database_url.startswith("sqlite") else {}

    @cached_property
    def effective_database_url(self) -> str:
        # Render/Heroku entregam `postgres://`; o SQLAlchemy 2.x exige `postgresql://`
        # e usamos o driver psycopg 3 (`+psycopg`). SQLite passa intacto.
        url = self.database_url
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg://", 1)
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url


settings = Settings()
