/* Meta Hub — tier list of builds with class/content filters and source attribution. */
import { useMemo, useState } from "react";
import { CLASSES, TIERS } from "../data/taxonomy.js";
import { patchStatus } from "../lib/patchStatus.js";
import Glyph from "../components/primitives/Glyph.jsx";
import TierPlate from "../components/primitives/TierPlate.jsx";
import SourceBadge from "../components/primitives/SourceBadge.jsx";
import PatchBadge from "../components/primitives/PatchBadge.jsx";

// ── helpers ──────────────────────────────────────────────────────────────────

function chipStyleHub(color) {
  return color
    ? {
        fontSize: 11,
        padding: "3px 9px",
        borderRadius: 999,
        border: "1px solid var(--accent-dim)",
        color: "var(--accent)",
        background: "var(--accent-wash)",
        whiteSpace: "nowrap",
      }
    : {
        fontSize: 11,
        padding: "3px 9px",
        borderRadius: 999,
        border: "1px solid var(--line)",
        color: "var(--muted)",
        background: "transparent",
        whiteSpace: "nowrap",
      };
}

function Metric({ label, value }) {
  return (
    <div>
      <div className="font-ui text-faint text-[10px] uppercase tracking-[.1em]">{label}</div>
      <div className="font-num text-text text-[18px] font-semibold">{value}</div>
    </div>
  );
}

function PopBar({ value, color }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="font-ui text-faint text-[10px] uppercase tracking-[.1em]">Uso</div>
      <div className="mt-[5px] flex items-center gap-[7px]">
        <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-input">
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              borderRadius: 999,
              background: `linear-gradient(90deg, ${color}, ${color}aa)`,
            }}
          />
        </div>
        <span className="font-num text-muted text-[12px]">{pct}%</span>
      </div>
    </div>
  );
}

function FilterChip({ active, color, onClick, children }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      className="cursor-pointer rounded-lg font-ui text-[13px]"
      style={{
        padding: "7px 14px",
        border: `1px solid ${active ? (color || "var(--accent)") : h ? "var(--accent-dim)" : "var(--border)"}`,
        background: active ? "var(--accent-wash)" : "transparent",
        color: active ? (color || "var(--accent)") : "var(--muted)",
        transition: "all .15s ease",
      }}
    >
      {children}
    </button>
  );
}

function PulseStat({ n, label }) {
  return (
    <div className="text-right">
      <div className="font-num text-accent text-[30px] font-semibold leading-none">{n}</div>
      <div className="font-ui text-faint mt-1 text-[10px] uppercase tracking-[.14em]">{label}</div>
    </div>
  );
}

const labelHubStyle = {
  fontFamily: "var(--f-ui)",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: ".12em",
  color: "var(--faint)",
  width: 64,
};

// ── BuildCard ─────────────────────────────────────────────────────────────────

function BuildCard({ build, onOpen, onCompare, comparing, selectedForCompare, currentPatch }) {
  const [hover, setHover] = useState(false);
  const cm = CLASSES[build.class] || { color: "#9c8a76" };
  const keySkill = build.skills?.find((s) => s.key) || build.skills?.[0];
  const active = selectedForCompare;

  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => (comparing ? onCompare(build) : onOpen(build))}
      style={{
        width: 312,
        cursor: "pointer",
        position: "relative",
        background: "var(--panel)",
        borderRadius: 12,
        padding: 16,
        border: `1px solid ${active ? cm.color : hover ? "var(--accent-dim)" : "var(--border)"}`,
        boxShadow: hover
          ? `0 10px 30px #0009, 0 0 0 1px ${cm.color}22, inset 0 1px 0 #ffffff0a`
          : "0 2px 10px #0006, inset 0 1px 0 #ffffff08",
        transform: hover ? "translateY(-3px)" : "none",
        transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
        overflow: "hidden",
      }}
    >
      {/* class color edge */}
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: cm.color,
          opacity: 0.85,
        }}
      />

      {comparing && (
        <span
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 20,
            height: 20,
            borderRadius: 6,
            border: `1.5px solid ${active ? cm.color : "var(--line)"}`,
            background: active ? cm.color : "transparent",
            display: "grid",
            placeItems: "center",
            color: "#0c0907",
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          {active ? "✓" : ""}
        </span>
      )}

      <header className="flex items-center gap-3">
        <Glyph cls={build.class} size={46} />
        <div className="min-w-0">
          <h3
            className="font-display m-0 text-[18px] font-semibold leading-[1.15] tracking-[.01em] text-text"
          >
            {build.name}
          </h3>
          <p className="font-ui m-0 mt-[3px] text-[12px] text-muted">
            <span style={{ color: cm.color }}>{build.class}</span> · {build.archetype}
          </p>
        </div>
      </header>

      <p
        className="mt-3 text-[12.5px] leading-[1.5] text-muted"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {build.blurb}
      </p>

      {/* objective + key skill */}
      <div className="mt-3 flex flex-wrap gap-[6px]">
        <span className="font-ui" style={chipStyleHub("var(--accent)")}>{build.objective}</span>
        <span className="font-ui" style={chipStyleHub()}>{keySkill?.name || "—"}</span>
      </div>

      {/* stats row */}
      <div className="mt-[14px] grid grid-cols-2 gap-[10px]">
        <Metric label="Pit clear" value={`+${build.pit}`} />
        <PopBar value={build.pop} color={cm.color} />
      </div>

      {/* footer: sources + patch */}
      <footer className="mt-[14px] flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <div className="flex flex-wrap gap-[6px]">
          {build.sources?.map((s, i) => (
            <SourceBadge key={i} s={s} compact />
          ))}
        </div>
        <PatchBadge
          status={patchStatus(build.patch, currentPatch)}
          buildPatch={build.patch}
          currentPatch={currentPatch}
        />
      </footer>
    </article>
  );
}

// ── MetaHub (default export) ──────────────────────────────────────────────────

export default function MetaHub({ builds, currentPatch, onOpen, comparing, compareIds, onCompare }) {
  const [cls, setCls] = useState("Todas");
  const [tag, setTag] = useState("Todos");
  const [sort, setSort] = useState("tier");

  const tagOptions = ["Todos", "Pit", "Boss", "Speedfarm"];
  const order = { S: 0, A: 1, B: 2, C: 3, D: 4 };

  const filtered = useMemo(() => {
    let rows = builds.slice();
    if (cls !== "Todas") rows = rows.filter((b) => b.class === cls);
    if (tag !== "Todos") rows = rows.filter((b) => b.tags?.includes(tag));
    if (sort === "pop") rows.sort((a, b) => b.pop - a.pop);
    else if (sort === "pit") rows.sort((a, b) => b.pit - a.pit);
    else rows.sort((a, b) => order[a.tier] - order[b.tier] || b.pop - a.pop);
    return rows;
  }, [cls, tag, sort, builds]);

  const byTier = useMemo(() => {
    const g = { S: [], A: [], B: [], C: [], D: [] };
    filtered.forEach((b) => g[b.tier]?.push(b));
    return g;
  }, [filtered]);

  const topPit = builds.length > 0 ? Math.max(...builds.map((b) => b.pit), 0) : 0;

  return (
    <div>
      {/* hero */}
      <section
        className="mb-[22px] flex flex-wrap items-end justify-between gap-[18px]"
      >
        <div>
          <div className="font-ui mb-2 text-[12px] uppercase tracking-[.22em] text-accent">
            A Forja da Meta · {currentPatch ? `patch ${currentPatch}` : "—"}
          </div>
          <h1
            className="font-display m-0 text-[40px] font-bold leading-[1.04] tracking-[.01em] text-text"
          >
            Tier list da temporada
          </h1>
          <p className="m-0 mt-[10px] max-w-[540px] text-[14.5px] leading-[1.55] text-muted">
            Builds originais em formato FORGE, com dano calculado pela engine de buckets e referências
            agregadas das melhores fontes da comunidade.
          </p>
        </div>
        <div className="flex gap-[22px]">
          <PulseStat n={builds.length} label="Builds" />
          <PulseStat n="4" label="Fontes" />
          <PulseStat n={`+${topPit}`} label="Top Pit" />
        </div>
      </section>

      {/* filters */}
      <div
        className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-panel p-[14px]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span style={labelHubStyle}>Classe</span>
          <FilterChip active={cls === "Todas"} onClick={() => setCls("Todas")}>
            Todas
          </FilterChip>
          {Object.keys(CLASSES).map((c) => (
            <FilterChip
              key={c}
              active={cls === c}
              color={CLASSES[c].color}
              onClick={() => setCls(c)}
            >
              {c}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span style={labelHubStyle}>Conteúdo</span>
          {tagOptions.map((t) => (
            <FilterChip key={t} active={tag === t} onClick={() => setTag(t)}>
              {t}
            </FilterChip>
          ))}
          <span style={{ ...labelHubStyle, marginLeft: "auto" }}>Ordenar</span>
          {[["tier", "Tier"], ["pop", "Uso"], ["pit", "Pit"]].map(([k, lbl]) => (
            <FilterChip key={k} active={sort === k} onClick={() => setSort(k)}>
              {lbl}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* tier rows */}
      <div className="flex flex-col gap-[14px]">
        {["S", "A", "B", "C", "D"].map((t) => {
          const rows = byTier[t];
          const meta = TIERS[t];
          return (
            <section
              key={t}
              className="flex items-stretch gap-[18px] rounded-[14px] border border-border p-[14px]"
              style={{
                background: `linear-gradient(100deg, ${meta.color}0e, transparent 40%)`,
              }}
            >
              <div className="flex w-[70px] flex-[0_0_auto] flex-col items-center gap-2">
                <TierPlate tier={t} size={56} />
                <span className="font-ui text-center text-[10px] uppercase tracking-[.08em] text-muted">
                  {meta.label}
                </span>
              </div>
              <div className="flex flex-1 flex-wrap items-stretch gap-[14px]">
                {rows.length === 0 ? (
                  <div className="font-ui flex flex-1 min-h-[90px] items-center justify-center rounded-[10px] border border-dashed border-line text-[13px] text-faint">
                    Nenhuma build neste tier · contribua com a sua no Forge
                  </div>
                ) : (
                  rows.map((b) => (
                    <BuildCard
                      key={b.id}
                      build={b}
                      onOpen={onOpen}
                      onCompare={onCompare}
                      comparing={comparing}
                      selectedForCompare={compareIds.includes(b.id)}
                      currentPatch={currentPatch}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
