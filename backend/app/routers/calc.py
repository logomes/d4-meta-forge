from __future__ import annotations

from fastapi import APIRouter

from ..damage import CombatProfile, DamageResult, compute

router = APIRouter(prefix="/api/calc", tags=["calc"])


@router.post("/damage", response_model=DamageResult)
def calc_damage(profile: CombatProfile) -> DamageResult:
    return compute(profile)
