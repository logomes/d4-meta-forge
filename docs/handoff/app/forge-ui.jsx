/* Shared primitives for D4 Meta Forge: damage engine, formatters, glyphs, badges, radar. */

// ---------- damage engine (mirrors backend: same bucket adds, buckets multiply) ----------
function calcDamage(c) {
  const critMult = 1 + (c.crit_chance || 0) * (c.crit_damage_bonus || 0);
  const vulnMult = 1 + (c.vulnerable_uptime || 0) * (c.vulnerable_bonus || 0);
  const groups = {};
  (c.modifiers || []).forEach((m) => { (groups[m.bucket] ||= []).push(m); });
  const buckets = Object.entries(groups).map(([bucket, mods]) => {
    const add = mods.reduce((s, m) => s + (Number(m.value) || 0), 0);
    return { bucket, mods, additive_sum: add, multiplier: 1 + add };
  });
  const bucketMult = buckets.reduce((p, b) => p * b.multiplier, 1);
  const expected_hit = (Number(c.base_hit) || 0) * critMult * vulnMult * bucketMult;
  const expected_dps = expected_hit * (Number(c.hits_per_second) || 1);
  return { critMult, vulnMult, buckets, bucketMult, expected_hit, expected_dps };
}

const fmt = (n) => {
  n = Number(n) || 0;
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return Math.round(n).toLocaleString("en-US");
  return n.toFixed(1);
};
const pct = (n) => Math.round((Number(n) || 0) * 100) + "%";

// ---------- class glyph: a runed gem plate tinted to the class color ----------
function Glyph({ cls, size = 44 }) {
  const meta = window.D4.classes[cls] || { color: "#9c8a76", rune: "?" };
  const r = size * 0.16;
  return (
    <div style={{
      width: size, height: size, flex: "0 0 auto", display: "grid", placeItems: "center",
      borderRadius: r, position: "relative",
      background: `radial-gradient(120% 120% at 50% 0%, ${meta.color}33, #0c0907 78%)`,
      border: `1px solid ${meta.color}66`,
      boxShadow: `inset 0 1px 0 ${meta.color}55, 0 2px 10px #0008`,
    }}>
      <span style={{
        fontFamily: "var(--f-display)", fontSize: size * 0.46, lineHeight: 1,
        color: meta.color, textShadow: `0 0 12px ${meta.color}aa`, fontWeight: 600,
      }}>{meta.rune}</span>
      <span style={{
        position: "absolute", bottom: -1, left: "50%", transform: "translateX(-50%)",
        width: size * 0.5, height: 2, background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)`,
      }} />
    </div>
  );
}

// ---------- tier plate ----------
function TierPlate({ tier, size = 56 }) {
  const meta = window.D4.tiers[tier] || { color: "#9c8a76" };
  return (
    <div style={{
      width: size, height: size, flex: "0 0 auto", display: "grid", placeItems: "center",
      borderRadius: 8, position: "relative", overflow: "hidden",
      background: `linear-gradient(160deg, ${meta.color}2e, #0c0907 70%)`,
      border: `1px solid ${meta.color}`, boxShadow: `0 0 18px ${meta.color}40, inset 0 1px 0 ${meta.color}66`,
    }}>
      <span style={{
        fontFamily: "var(--f-display)", fontWeight: 700, fontSize: size * 0.52, lineHeight: 1,
        color: meta.color, textShadow: `0 0 16px ${meta.color}cc`,
      }}>{tier}</span>
    </div>
  );
}

// ---------- small source link-out badge ----------
const SOURCE_MARK = {
  "Maxroll": "MX", "Icy-Veins": "IV", "D4Builds": "D4", "Mobalytics": "MB",
};
function SourceBadge({ s, compact }) {
  const t = window.D4.tiers[s.tier] || { color: "#9c8a76" };
  return (
    <a href={s.url} target="_blank" rel="noopener noreferrer" title={`${s.site} — referência externa · ${s.date}`}
      onClick={(e) => e.stopPropagation()}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none",
        padding: compact ? "3px 7px" : "5px 9px", borderRadius: 6,
        border: "1px solid var(--line)", background: "var(--input)", color: "var(--muted)",
        fontSize: 11.5, fontFamily: "var(--f-ui)", whiteSpace: "nowrap",
      }}>
      <span style={{
        fontFamily: "var(--f-num)", fontWeight: 600, fontSize: 10, letterSpacing: ".06em",
        color: "var(--text)", opacity: 0.9,
      }}>{SOURCE_MARK[s.site] || s.site.slice(0, 2)}</span>
      <span>{s.site}</span>
      {!compact && <span style={{ color: t.color, fontWeight: 700, fontFamily: "var(--f-num)" }}>{s.tier}</span>}
      <span style={{ opacity: 0.5, fontSize: 10 }}>↗</span>
    </a>
  );
}

// ---------- patch validity flag ----------
function PatchFlag({ build }) {
  const ok = build.valid;
  const color = ok ? "#6fae5a" : "#e2a23a";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontFamily: "var(--f-ui)",
      color, padding: "2px 8px", borderRadius: 999,
      border: `1px solid ${color}55`, background: `${color}14`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color, boxShadow: `0 0 6px ${color}` }} />
      {ok ? `patch ${build.patch}` : `${build.patch} · desatualizada`}
    </span>
  );
}

// ---------- custom SVG radar (no chart lib) ----------
function Radar({ data, color = "var(--accent)", size = 220, max = 10 }) {
  const cx = size / 2, cy = size / 2, R = size * 0.38;
  const n = data.length;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i, rad) => [cx + Math.cos(angle(i)) * rad, cy + Math.sin(angle(i)) * rad];
  const rings = [0.25, 0.5, 0.75, 1];
  const poly = (rad) => data.map((_, i) => point(i, rad).join(",")).join(" ");
  const shape = data.map((d, i) => point(i, R * (Math.max(0, Math.min(max, d.value)) / max)).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ display: "block", overflow: "visible" }}>
      {rings.map((r, k) => (
        <polygon key={k} points={poly(R * r)} fill="none" stroke="var(--line)" strokeWidth="1" opacity={0.7} />
      ))}
      {data.map((_, i) => {
        const [x, y] = point(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" strokeWidth="1" opacity={0.5} />;
      })}
      <polygon points={shape} fill={color} fillOpacity="0.28" stroke={color} strokeWidth="2"
        style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
      {data.map((d, i) => {
        const [x, y] = point(i, R * (Math.max(0, Math.min(max, d.value)) / max));
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}
      {data.map((d, i) => {
        const [x, y] = point(i, R + 18);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            style={{ fontFamily: "var(--f-ui)", fontSize: 10, fill: "var(--muted)" }}>
            {d.attribute}
          </text>
        );
      })}
    </svg>
  );
}

Object.assign(window, { calcDamage, fmt, pct, Glyph, TierPlate, SourceBadge, PatchFlag, Radar });
