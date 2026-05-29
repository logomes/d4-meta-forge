import { useEffect, useState } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, ResponsiveContainer,
} from "recharts";
import { calcDamage } from "../api.js";

const COLORS = ["#c0461f", "#d4af37", "#4ea3d9", "#6aa84f", "#a064c9"];
const PALETTE = {
  text: "#e7dccd", muted: "#9c8a76", panel: "#17120f", border: "#2a201a", line: "#3a2c22", gold: "#d4af37",
};

const num = (v, f = 0) => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : f;
};
const fmtDps = (n) => (n == null ? "—" : n >= 1000 ? Math.round(n).toLocaleString("en-US") : n.toFixed(1));

function profileFromBuild(b) {
  const c = b.data?.combat;
  if (!c) return null;
  const hasSkill = c.skill_id && num(c.weapon_damage) > 0;
  if (num(c.base_hit) <= 0 && !hasSkill) return null;
  return {
    base_hit: num(c.base_hit),
    hits_per_second: num(c.hits_per_second, 1),
    crit_chance: num(c.crit_chance),
    crit_damage_bonus: num(c.crit_damage_bonus),
    vulnerable_uptime: num(c.vulnerable_uptime),
    vulnerable_bonus: num(c.vulnerable_bonus),
    overpower_chance: num(c.overpower_chance),
    overpower_bonus: num(c.overpower_bonus),
    skill_id: c.skill_id || null,
    skill_rank: num(c.skill_rank, 1),
    weapon_damage: num(c.weapon_damage) > 0 ? num(c.weapon_damage) : null,
    modifiers: (c.modifiers || []).map((m) => ({
      name: m.name || "", bucket: m.bucket || "additive", value: num(m.value),
    })),
  };
}

function mergeAttributes(builds) {
  const names = [];
  for (const b of builds)
    for (const a of b.data?.attributes || [])
      if (!names.includes(a.attribute)) names.push(a.attribute);
  return names.map((attribute) => {
    const row = { attribute };
    builds.forEach((b, i) => {
      const a = (b.data?.attributes || []).find((x) => x.attribute === attribute);
      row[`b${i}`] = a ? num(a.value) : 0;
    });
    return row;
  });
}

export default function BuildCompare({ builds }) {
  const [dps, setDps] = useState({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      builds.map(async (b) => {
        const p = profileFromBuild(b);
        if (!p) return [b.id, null];
        try {
          const r = await calcDamage(p);
          return [b.id, r.expected_dps];
        } catch {
          return [b.id, null];
        }
      }),
    ).then((pairs) => { if (!cancelled) setDps(Object.fromEntries(pairs)); });
    return () => { cancelled = true; };
  }, [builds]);

  const radarData = mergeAttributes(builds);
  const attrNames = radarData.map((r) => r.attribute);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg p-4" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.border}` }}>
        <h3 className="mb-3 text-sm font-bold tracking-wide" style={{ color: PALETTE.gold }}>RADAR SOBREPOSTO</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="70%">
              <PolarGrid stroke={PALETTE.line} />
              <PolarAngleAxis dataKey="attribute" tick={{ fill: PALETTE.muted, fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 10]} tick={{ fill: PALETTE.muted, fontSize: 9 }} stroke={PALETTE.line} />
              {builds.map((b, i) => (
                <Radar key={b.id} name={b.name} dataKey={`b${i}`}
                  stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.25} />
              ))}
              <Legend wrapperStyle={{ fontSize: 11, color: PALETTE.muted }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-lg p-4" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.border}` }}>
        <h3 className="mb-3 text-sm font-bold tracking-wide" style={{ color: PALETTE.gold }}>TABELA DE CRITÉRIOS</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ color: PALETTE.text }}>
            <thead>
              <tr style={{ color: PALETTE.muted }}>
                <th className="pb-2 text-left font-normal">Critério</th>
                {builds.map((b, i) => (
                  <th key={b.id} className="pb-2 pl-3 text-right font-normal" style={{ color: COLORS[i % COLORS.length] }}>{b.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Row label="DPS esperado" values={builds.map((b) => dps[b.id])} format={fmtDps} />
              {attrNames.map((attr) => (
                <Row key={attr} label={attr}
                  values={builds.map((b) => {
                    const a = (b.data?.attributes || []).find((x) => x.attribute === attr);
                    return a ? num(a.value) : null;
                  })}
                  format={(v) => (v == null ? "—" : v)} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Row({ label, values, format }) {
  const nums = values.filter((v) => typeof v === "number");
  const max = nums.length ? Math.max(...nums) : null;
  return (
    <tr style={{ borderTop: "1px solid #2a201a" }}>
      <td className="py-1.5" style={{ color: "#9c8a76" }}>{label}</td>
      {values.map((v, i) => {
        const best = max != null && v === max && nums.length > 1;
        return (
          <td key={i} className="py-1.5 pl-3 text-right"
            style={{ color: best ? "#d4af37" : "#e7dccd", fontWeight: best ? 700 : 400 }}>
            {format(v)}
          </td>
        );
      })}
    </tr>
  );
}
