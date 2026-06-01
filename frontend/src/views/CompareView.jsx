/* Compare — overlay radars + criteria table for 2+ selected builds. */
import { useMemo } from "react";
import { CLASSES } from "../data/taxonomy.js";
import { computeDamage } from "../lib/damage.js";
import { fmt, pct } from "../lib/format.js";
import Panel from "../components/primitives/Panel.jsx";

// ── style helpers ─────────────────────────────────────────────────────────────

const thCmp = {
  padding: "12px 14px",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: ".08em",
  color: "var(--faint)",
  textAlign: "center",
  fontWeight: 600,
};
const tdCmp = { padding: "11px 14px", fontSize: 13.5, textAlign: "center" };

// ── CompareRadar ──────────────────────────────────────────────────────────────

function CompareRadar({ builds, size = 300, max = 10 }) {
  const cx = size / 2, cy = size / 2, R = size * 0.36;
  const attrs = (builds[0]?.attributes || []).map((a) => a.attribute);
  const n = attrs.length;

  // If no axes, render empty placeholder
  if (n === 0) {
    return (
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ display: "block", overflow: "visible" }}>
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          style={{ fontFamily: "var(--f-ui)", fontSize: 11, fill: "var(--faint)" }}>
          sem atributos
        </text>
      </svg>
    );
  }

  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i, rad) => [cx + Math.cos(angle(i)) * rad, cy + Math.sin(angle(i)) * rad];
  const rings = [0.25, 0.5, 0.75, 1];
  const polyRing = (rad) => attrs.map((_, i) => point(i, rad).join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ display: "block", overflow: "visible" }}>
      {rings.map((r, k) => (
        <polygon key={k} points={polyRing(R * r)} fill="none" stroke="var(--line)" strokeWidth="1" opacity={0.6} />
      ))}
      {attrs.map((_, i) => {
        const [x, y] = point(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" strokeWidth="1" opacity={0.4} />;
      })}
      {builds.map((b) => {
        const color = (CLASSES[b.class] || {}).color || "#9c8a76";
        const bAttrs = b.attributes || [];
        const shape = attrs
          .map((_, i) => point(i, R * (Math.max(0, Math.min(max, bAttrs[i]?.value ?? 0)) / max)).join(","))
          .join(" ");
        return (
          <polygon key={b.id} points={shape} fill={color} fillOpacity="0.14" stroke={color} strokeWidth="2" />
        );
      })}
      {attrs.map((a, i) => {
        const [x, y] = point(i, R + 18);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            style={{ fontFamily: "var(--f-ui)", fontSize: 10, fill: "var(--muted)" }}>
            {a}
          </text>
        );
      })}
    </svg>
  );
}

// ── CompareView (default export) ──────────────────────────────────────────────

export default function CompareView({ builds, onBack, onOpen }) {
  // Hooks must run unconditionally and before any early return (Rules of Hooks).
  // Harmless for <2 builds — computeDamage tolerates empty/seeded combat.
  const rows = useMemo(
    () => (builds || []).map((b) => ({ b, dmg: computeDamage(b.combat) })),
    [builds],
  );

  // Guard: need at least 2 builds
  if (!builds || builds.length < 2) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: "60px 24px",
          textAlign: "center",
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: "transparent",
            border: "none",
            color: "var(--muted)",
            fontFamily: "var(--f-ui)",
            fontSize: 13,
            cursor: "pointer",
            padding: 0,
          }}
        >
          ← Voltar
        </button>
        <p
          style={{
            fontFamily: "var(--f-ui)",
            fontSize: 15,
            color: "var(--muted)",
            margin: 0,
          }}
        >
          Selecione 2+ builds no Meta Hub para comparar.
        </p>
      </div>
    );
  }

  const attrs = (builds[0].attributes || []).map((a) => a.attribute);
  const best = (vals) => Math.max(...vals);

  const metricRows = [
    { label: "Tier", get: ({ b }) => b.tier, hi: false },
    { label: "Objetivo", get: ({ b }) => b.objective, hi: false },
    { label: "Pit clear", get: ({ b }) => b.pit, fmt: (v) => `+${v}`, hi: true },
    { label: "Uso", get: ({ b }) => b.pop, fmt: pct, hi: true },
    { label: "DPS esperado", get: ({ dmg }) => dmg.expected_dps, fmt: fmt, hi: true },
    { label: "Hit esperado", get: ({ dmg }) => dmg.expected_hit, fmt: fmt, hi: true },
    ...attrs.map((a, ai) => ({
      label: a,
      get: ({ b }) => b.attributes?.[ai]?.value ?? 0,
      hi: true,
    })),
  ];

  return (
    <div>
      {/* back button */}
      <button
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          background: "transparent",
          border: "none",
          color: "var(--muted)",
          fontFamily: "var(--f-ui)",
          fontSize: 13,
          cursor: "pointer",
          marginBottom: 18,
          padding: 0,
        }}
      >
        ← Voltar
      </button>

      <h1
        style={{
          fontFamily: "var(--f-display)",
          fontSize: 34,
          fontWeight: 700,
          color: "var(--text)",
          margin: "0 0 20px",
        }}
      >
        Comparativo · {builds.length} builds
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 360px) 1fr",
          gap: 18,
          alignItems: "start",
        }}
        className="cmp-grid"
      >
        {/* Radar + legend */}
        <Panel title="Perfil sobreposto">
          <CompareRadar builds={builds} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
            {builds.map((b) => {
              const color = (CLASSES[b.class] || {}).color || "#9c8a76";
              return (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span
                    style={{ width: 12, height: 12, borderRadius: 3, background: color, flexShrink: 0 }}
                  />
                  <span style={{ fontFamily: "var(--f-ui)", fontSize: 13, color: "var(--text)" }}>
                    {b.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--f-ui)",
                      fontSize: 11,
                      color: "var(--faint)",
                      marginLeft: "auto",
                    }}
                  >
                    {b.class}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Criteria table */}
        <Panel title="Critérios" pad={0}>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--f-ui)" }}
            >
              <thead>
                <tr>
                  <th style={{ ...thCmp, textAlign: "left" }}>Critério</th>
                  {rows.map(({ b }) => {
                    const color = (CLASSES[b.class] || {}).color || "#9c8a76";
                    return (
                      <th key={b.id} style={thCmp}>
                        <button
                          onClick={() => onOpen(b)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color,
                            fontFamily: "var(--f-display)",
                            fontSize: 14,
                            fontWeight: 600,
                          }}
                        >
                          {b.name}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {metricRows.map((mr, ri) => {
                  const vals = rows.map(mr.get);
                  const top = mr.hi
                    ? best(vals.map((v) => (typeof v === "number" ? v : -Infinity)))
                    : null;
                  return (
                    <tr key={ri} style={{ borderTop: "1px solid var(--line)" }}>
                      <td style={{ ...tdCmp, color: "var(--muted)", textAlign: "left" }}>
                        {mr.label}
                      </td>
                      {rows.map((r, ci) => {
                        const v = mr.get(r);
                        const isTop = mr.hi && typeof v === "number" && v === top;
                        return (
                          <td
                            key={ci}
                            style={{
                              ...tdCmp,
                              color: isTop ? "var(--accent)" : "var(--text)",
                              fontWeight: isTop ? 700 : 400,
                              fontFamily:
                                typeof v === "number" ? "var(--f-num)" : "var(--f-ui)",
                            }}
                          >
                            {mr.fmt ? mr.fmt(v) : v}
                            {isTop && (
                              <span style={{ marginLeft: 5, fontSize: 10 }}>▲</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
