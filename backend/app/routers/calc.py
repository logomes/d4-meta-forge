from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import Field

from ..damage import CombatParams, CombatProfile, DamageResult, ResolvedSkill, compute
from ..damage_sources import CATALOG, DamageCatalog
from ..skill_coefficients import SkillCatalog, coefficient_at, get, load

router = APIRouter(prefix="/api/calc", tags=["calc"])


class DamageRequest(CombatParams):
    """Transport model: base_hit optional, plus optional skill-resolution fields."""
    base_hit: float | None = Field(default=None, gt=0)
    skill_id: str | None = None
    skill_rank: int = Field(default=1, ge=1)
    weapon_damage: float | None = Field(default=None, gt=0)


@router.post("/damage", response_model=DamageResult)
def calc_damage(req: DamageRequest) -> DamageResult:
    resolved: ResolvedSkill | None = None
    base = req.base_hit

    if req.skill_id and req.weapon_damage is not None:
        skill = get(req.skill_id)
        coef = coefficient_at(req.skill_id, req.skill_rank)
        if skill is not None and coef is not None:
            base = req.weapon_damage * coef
            resolved = ResolvedSkill(
                skill_id=skill.id, name=skill.name, rank=req.skill_rank,
                coefficient=coef, weapon_damage=req.weapon_damage,
                source=skill.source, confidence=skill.confidence, patch=load().patch,
            )

    if base is None or base <= 0:
        raise HTTPException(
            status_code=422,
            detail="Informe base_hit > 0 ou skill_id + weapon_damage que resolvam um base válido.",
        )

    params = req.model_dump(exclude={"base_hit", "skill_id", "skill_rank", "weapon_damage"})
    profile = CombatProfile(base_hit=base, **params)
    result = compute(profile)
    result.resolved = resolved
    return result


@router.get("/skills", response_model=SkillCatalog)
def skills() -> SkillCatalog:
    """Curated per-skill damage coefficients (source of truth for base_hit)."""
    return load()


@router.get("/catalog", response_model=DamageCatalog)
def catalog() -> DamageCatalog:
    """Curated damage-source → bucket mapping and skill presets."""
    return CATALOG
