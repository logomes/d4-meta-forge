from __future__ import annotations

from fastapi import APIRouter

from ..damage import CombatProfile, DamageResult, compute
from ..damage_sources import CATALOG, DamageCatalog

router = APIRouter(prefix="/api/calc", tags=["calc"])


@router.post("/damage", response_model=DamageResult)
def calc_damage(profile: CombatProfile) -> DamageResult:
    return compute(profile)


@router.get("/catalog", response_model=DamageCatalog)
def catalog() -> DamageCatalog:
    """Curated damage-source → bucket mapping and skill presets."""
    return CATALOG
