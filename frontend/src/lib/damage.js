// Mirror puro de backend/app/damage.py::compute().
// Mesma regra: modifiers do mesmo bucket SOMAM; buckets MULTIPLICAM.
// Crit, vulnerable e overpower são multiplicadores dedicados (não buckets).
export function computeDamage(c) {
  const sums = {};
  (c.modifiers || []).forEach((m) => {
    sums[m.bucket] = (sums[m.bucket] || 0) + (Number(m.value) || 0);
  });
  const buckets = Object.keys(sums)
    .sort()
    .map((bucket) => {
      const additive_sum = sums[bucket];
      return { bucket, additive_sum, multiplier: 1 + additive_sum };
    });
  const bucketMult = buckets.reduce((p, b) => p * b.multiplier, 1);

  const crit_multiplier = 1 + (c.crit_chance || 0) * (c.crit_damage_bonus || 0);
  const vulnerable_multiplier = 1 + (c.vulnerable_uptime || 0) * (c.vulnerable_bonus || 0);
  const overpower_multiplier = 1 + (c.overpower_chance || 0) * (c.overpower_bonus || 0);

  const base_hit = Number(c.base_hit) || 0;
  const expected_hit =
    base_hit * bucketMult * crit_multiplier * vulnerable_multiplier * overpower_multiplier;
  const expected_dps = expected_hit * (Number(c.hits_per_second) || 1);

  return {
    base_hit,
    buckets,
    bucketMult,
    crit_multiplier,
    vulnerable_multiplier,
    overpower_multiplier,
    expected_hit,
    expected_dps,
  };
}
