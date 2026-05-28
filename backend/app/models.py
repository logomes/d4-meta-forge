from __future__ import annotations

import time

from pydantic import BaseModel
from sqlmodel import JSON, Column, Field, SQLModel


def _now() -> float:
    return time.time()


class Build(SQLModel, table=True):
    """Original build definition (FORGE JSON). 100% our content."""

    id: str = Field(primary_key=True)
    name: str = Field(index=True)
    class_name: str = Field(index=True)
    archetype: str = ""
    tier: str = "B"
    patch: str = ""
    objective: str = ""
    data: dict = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: float = Field(default_factory=_now)
    updated_at: float = Field(default_factory=_now)


class SourceRef(SQLModel, table=True):
    """Attribution-only reference to a third-party guide. Never stores bodies."""

    id: str = Field(primary_key=True)
    site: str = Field(index=True)  # maxroll | icy-veins | d4builds | mobalytics
    title: str
    url: str
    kind: str = "guide"  # guide | tierlist | patch
    class_name: str | None = Field(default=None, index=True)
    patch: str | None = None
    last_seen: float = Field(default_factory=_now)


class PatchNote(SQLModel, table=True):
    version: str = Field(primary_key=True)
    title: str = ""
    url: str = ""
    released_at: str = ""
    summary: str = ""
    fetched_at: float = Field(default_factory=_now)


class BuildIn(BaseModel):
    name: str
    class_name: str
    archetype: str = ""
    tier: str = "B"
    patch: str = ""
    objective: str = ""
    data: dict = {}


class BuildOut(BuildIn):
    id: str
    created_at: float
    updated_at: float
