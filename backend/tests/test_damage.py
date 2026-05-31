from __future__ import annotations

from app.damage import CombatProfile, Modifier, compute


def test_overpower_is_dedicated_multiplier_not_bucket():
    profile = CombatProfile(
        base_hit=10000,
        hits_per_second=2.0,
        crit_chance=0.5,
        crit_damage_bonus=1.5,
        vulnerable_uptime=0.8,
        vulnerable_bonus=0.2,
        overpower_chance=0.3,
        overpower_bonus=1.0,
        modifiers=[
            Modifier(name="skill", bucket="additive", value=1.0),
            Modifier(name="lh", bucket="lucky_hit", value=0.5),
        ],
    )
    r = compute(profile)
    crit = 1 + 0.5 * 1.5
    vuln = 1 + 0.8 * 0.2
    op = 1 + 0.3 * 1.0
    bucket = (1 + 1.0) * (1 + 0.5)
    expected_hit = 10000 * bucket * crit * vuln * op
    assert abs(r.expected_hit - expected_hit) < 1e-6
    assert abs(r.expected_dps - expected_hit * 2.0) < 1e-6
    assert abs(r.overpower_multiplier - op) < 1e-9
