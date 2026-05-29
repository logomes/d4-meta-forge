"""Curated per-skill damage coefficients (static, versioned source of truth).

The damage engine (``damage.py``) stays pure over ``base_hit``. This module
loads the curated table and resolves a skill's % weapon-damage coefficient at a
given rank, so a real ``base_hit = weapon_damage * coefficient_at(...)`` can be
computed in the transport layer. Values are curated from published community
tables; each entry carries source/confidence and the table carries a patch.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel

_DATA_PATH = Path(__file__).resolve().parent / "data" / "skill_coefficients.json"


class Coefficient(BaseModel):
    base: float
    per_rank: float = 0.0


class Skill(BaseModel):
    id: str
    name: str
    class_name: str
    category: str = ""
    tags: list[str] = []
    coefficient: Coefficient
    ranks: int = 5
    source: str = ""
    confidence: str = "medium"
    note: str | None = None


class SkillCatalog(BaseModel):
    patch: str
    sources: dict[str, dict] = {}
    skills: list[Skill] = []


@lru_cache(maxsize=1)
def load() -> SkillCatalog:
    raw = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
    return SkillCatalog(**raw)


def list_skills() -> list[Skill]:
    return load().skills


def get(skill_id: str) -> Skill | None:
    return next((s for s in load().skills if s.id == skill_id), None)


def coefficient_at(skill_id: str, rank: int) -> float | None:
    skill = get(skill_id)
    if skill is None:
        return None
    clamped = max(1, min(rank, skill.ranks))
    return skill.coefficient.base + skill.coefficient.per_rank * (clamped - 1)
