"""Curated catalog of D4 damage sources mapped to engine buckets.

The damage engine (``damage.py``) keeps bucket assignment OUT of its core:
same-bucket modifiers add, different buckets multiply. This catalog is the
curated mapping of common in-game damage sources to the right bucket, so the
calculator is structurally correct without hard-coding game balance into the
engine. Vulnerable / Critical / Overpower are intentionally absent here — they
have dedicated fields on ``CombatProfile``.

Numbers are sensible defaults / rough starting points, not patch-exact values.
"""
from __future__ import annotations

from pydantic import BaseModel

ADDITIVE = "additive"  # every "[+]% damage" affix sums into this single bucket


class DamageSource(BaseModel):
    id: str
    label: str
    bucket: str
    kind: str  # "additive" | "multiplicative"
    group: str  # UI grouping label
    default_value: float
    note: str = ""


class DamageCatalog(BaseModel):
    damage_sources: list[DamageSource]


_ADD = "Aditivo [+] (somam no mesmo bucket)"
_MUL = "Multiplicativo [x] (cada um é seu próprio bucket)"


def _add(id: str, label: str, value: float, note: str = "") -> DamageSource:
    return DamageSource(id=id, label=label, bucket=ADDITIVE, kind="additive",
                        group=_ADD, default_value=value, note=note)


def _mul(id: str, label: str, bucket: str, value: float, note: str = "") -> DamageSource:
    return DamageSource(id=id, label=label, bucket=bucket, kind="multiplicative",
                        group=_MUL, default_value=value, note=note)


DAMAGE_SOURCES: list[DamageSource] = [
    # --- Additive [+] bucket: these all stack additively, then multiply once. ---
    _add("skill_dmg", "+% Skill Damage", 0.30),
    _add("core_dmg", "+% Core Skill Damage", 0.30),
    _add("element_dmg", "+% [Elemento] Damage (Fire/Shock/Cold/...)", 0.20),
    _add("dmg_close", "+% Damage to Close", 0.25),
    _add("dmg_distant", "+% Damage to Distant", 0.25),
    _add("dmg_injured", "+% Damage to Injured", 0.20),
    _add("dmg_cc", "+% Damage to Crowd Controlled", 0.20),
    _add("dot", "+% Damage over Time", 0.20),
    _add("dmg_healthy", "+% Damage while Healthy", 0.15),
    _add("main_stat", "Main Stat (Int/Str/Dex/Wil)", 0.10,
         note="Atributo primário entra no bucket aditivo."),
    # --- Multiplicative [x]: each its own bucket so they multiply independently. ---
    _mul("aspect_x", "[x] Aspect / Unique (genérico)", "aspect_x", 0.20,
         note="Para um [x] específico, renomeie o bucket pra não somar com outro."),
    _mul("glyph_x", "[x] Paragon Glyph", "glyph_x", 0.15),
    _mul("ultimate_x", "[x] Ultimate Skill", "ultimate_x", 0.30),
    _mul("lucky_hit_x", "[x] Lucky Hit proc", "lucky_hit_x", 0.20),
    _mul("boss_x", "[x] Damage vs Bosses", "boss_x", 0.20),
    _mul("berserking", "[x] Berserking (Barbarian)", "berserking", 0.25),
    _mul("tal_rasha", "[x] Tal Rasha (Sorcerer)", "tal_rasha", 0.75),
    _mul("constellation", "[x] Elemental Constellation (Sorcerer)", "constellation", 0.40),
]

CATALOG = DamageCatalog(damage_sources=DAMAGE_SOURCES)
