"""Diablo 4 damage model.

Modifiers inside the same *bucket* stack ADDITIVELY; buckets stack
MULTIPLICATIVELY with one another. The bucket assignment for any given affix
is supplied by the caller (sourced from game data / community testing) and is
never hard-coded here, so the engine stays correct across patches.
"""
from __future__ import annotations

from typing import Iterable

from pydantic import BaseModel, Field


class Modifier(BaseModel):
    name: str
    bucket: str = Field(..., description="Bucket key; same-bucket mods add together")
    value: float = Field(..., description="Fractional bonus, e.g. 0.30 for +30%")
    note: str | None = None


class CombatParams(BaseModel):
    hits_per_second: float = Field(1.0, gt=0)
    modifiers: list[Modifier] = Field(default_factory=list)
    crit_chance: float = Field(0.0, ge=0, le=1)
    crit_damage_bonus: float = Field(0.5, ge=0, description="e.g. 0.5 = +50% crit dmg")
    vulnerable_uptime: float = Field(0.0, ge=0, le=1)
    vulnerable_bonus: float = Field(0.0, ge=0)
    overpower_chance: float = Field(0.0, ge=0, le=1)
    overpower_bonus: float = Field(0.0, ge=0)


class CombatProfile(CombatParams):
    base_hit: float = Field(..., gt=0, description="Skill base damage per hit")


class BucketBreakdown(BaseModel):
    bucket: str
    additive_sum: float
    multiplier: float


class ResolvedSkill(BaseModel):
    """Output-only metadata when base_hit was resolved from a skill coefficient.

    Pure data — the engine never sets this; the transport layer fills it in.
    """
    skill_id: str
    name: str
    rank: int
    coefficient: float
    weapon_damage: float
    source: str
    confidence: str
    patch: str


class DamageResult(BaseModel):
    base_hit: float
    buckets: list[BucketBreakdown]
    crit_multiplier: float
    vulnerable_multiplier: float
    overpower_multiplier: float
    expected_hit: float
    expected_dps: float
    resolved: ResolvedSkill | None = None


def _bucketize(modifiers: Iterable[Modifier]) -> dict[str, float]:
    sums: dict[str, float] = {}
    for mod in modifiers:
        sums[mod.bucket] = sums.get(mod.bucket, 0.0) + mod.value
    return sums


def compute(profile: CombatProfile) -> DamageResult:
    """Expected (probability-weighted) hit and DPS for a combat profile."""
    breakdown: list[BucketBreakdown] = []
    product = 1.0
    for bucket, total in sorted(_bucketize(profile.modifiers).items()):
        multiplier = 1.0 + total
        product *= multiplier
        breakdown.append(
            BucketBreakdown(bucket=bucket, additive_sum=total, multiplier=multiplier)
        )

    crit_mult = 1.0 + profile.crit_chance * profile.crit_damage_bonus
    vuln_mult = 1.0 + profile.vulnerable_uptime * profile.vulnerable_bonus
    op_mult = 1.0 + profile.overpower_chance * profile.overpower_bonus

    expected_hit = profile.base_hit * product * crit_mult * vuln_mult * op_mult
    return DamageResult(
        base_hit=profile.base_hit,
        buckets=breakdown,
        crit_multiplier=crit_mult,
        vulnerable_multiplier=vuln_mult,
        overpower_multiplier=op_mult,
        expected_hit=expected_hit,
        expected_dps=expected_hit * profile.hits_per_second,
    )
