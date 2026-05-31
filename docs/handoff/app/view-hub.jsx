/* Meta Hub — tier list of builds with class/content filters and source attribution. */
const { useState: useStateHub, useMemo: useMemoHub } = React;

function BuildCard({ build, onOpen, onCompare, comparing, selectedForCompare }) {
  const [hover, setHover] = useStateHub(false);
  const cm = window.D4.classes[build.class];
  const keySkill = build.skills.find((s) => s.key) || build.skills[0];
  const active = selectedForCompare;
  return (
    <article
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={() => (comparing ? onCompare(build) : onOpen(build))}
      style={{
        width: 312, cursor: "pointer", position: "relative",
        background: "var(--panel)", borderRadius: 12, padding: 16,
        border: `1px solid ${active ? cm.color : hover ? "var(--accent-dim)" : "var(--border)"}`,
        boxShadow: hover ? `0 10px 30px #0009, 0 0 0 1px ${cm.color}22, inset 0 1px 0 #ffffff0a`
          : "0 2px 10px #0006, inset 0 1px 0 #ffffff08",
        transform: hover ? "translateY(-3px)" : "none",
        transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
        overflow: "hidden",
      }}>
      {/* class color edge */}
      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: cm.color, opacity: 0.85 }} />
      {comparing && (
        <span style={{
          position: "absolute", top: 12, right: 12, width: 20, height: 20, borderRadius: 6,
          border: `1.5px solid ${active ? cm.color : "var(--line)"}`,
          background: active ? cm.color : "transparent", display: "grid", placeItems: "center",
          color: "#0c0907", fontSize: 13, fontWeight: 800,
        }}>{active ? "✓" : ""}</span>
      )}
      <header style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Glyph cls={build.class} size={46} />
        <div style={{ minWidth: 0 }}>
          <h3 style={{
            fontFamily: "var(--f-display)", fontSize: 18, fontWeight: 600, color: "var(--text)",
            margin: 0, lineHeight: 1.15, letterSpacing: ".01em",
          }}>{build.name}</h3>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--muted)", fontFamily: "var(--f-ui)" }}>
            <span style={{ color: cm.color }}>{build.class}</span> · {build.archetype}
          </p>
        </div>
      </header>

      <p style={{ margin: "12px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "var(--muted-2)",
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {build.blurb}
      </p>

      {/* objective + key skill */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
        <span style={chipStyleHub("var(--accent)")}>{build.objective}</span>
        <span style={chipStyleHub()}>{keySkill.name}</span>
      </div>

      {/* stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
        <Metric label="Pit clear" value={`+${build.pit}`} />
        <PopBar value={build.pop} color={cm.color} />
      </div>

      {/* footer: sources + patch */}
      <footer style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {build.sources.map((s, i) => <SourceBadge key={i} s={s} compact />)}
        </div>
        <PatchFlag build={build} />
      </footer>
    </article>
  );
}

function chipStyleHub(color) {
  return {
    fontSize: 11, fontFamily: "var(--f-ui)", padding: "3px 9px", borderRadius: 999,
    border: `1px solid ${color ? "var(--accent-dim)" : "var(--line)"}`,
    color: color || "var(--muted)",
    background: color ? "var(--accent-wash)" : "transparent", whiteSpace: "nowrap",
  };
}

function Metric({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--faint)", fontFamily: "var(--f-ui)" }}>{label}</div>
      <div style={{ fontFamily: "var(--f-num)", fontSize: 18, fontWeight: 600, color: "var(--text)" }}>{value}</div>
    </div>
  );
}

function PopBar({ value, color }) {
  return (
    <div>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--faint)", fontFamily: "var(--f-ui)" }}>Uso</div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 5 }}>
        <div style={{ flex: 1, height: 5, borderRadius: 999, background: "var(--input)", overflow: "hidden" }}>
          <div style={{ width: `${Math.round(value * 100)}%`, height: "100%", borderRadius: 999,
            background: `linear-gradient(90deg, ${color}, ${color}aa)` }} />
        </div>
        <span style={{ fontFamily: "var(--f-num)", fontSize: 12, color: "var(--muted)" }}>{Math.round(value * 100)}%</span>
      </div>
    </div>
  );
}

function FilterChip({ active, color, onClick, children }) {
  const [h, setH] = useStateHub(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        fontFamily: "var(--f-ui)", fontSize: 13, cursor: "pointer",
        padding: "7px 14px", borderRadius: 8,
        border: `1px solid ${active ? (color || "var(--accent)") : h ? "var(--accent-dim)" : "var(--border)"}`,
        background: active ? "var(--accent-wash)" : "transparent",
        color: active ? (color || "var(--accent)") : "var(--muted)",
        transition: "all .15s ease",
      }}>{children}</button>
  );
}

function MetaHub({ onOpen, comparing, compareIds, onCompare, rev }) {
  const D4 = window.D4;
  const [cls, setCls] = useStateHub("Todas");
  const [tag, setTag] = useStateHub("Todos");
  const [sort, setSort] = useStateHub("tier");

  const tagOptions = ["Todos", "Pit", "Boss", "Speedfarm"];
  const order = { S: 0, A: 1, B: 2, C: 3, D: 4 };

  const filtered = useMemoHub(() => {
    let rows = D4.builds.slice();
    if (cls !== "Todas") rows = rows.filter((b) => b.class === cls);
    if (tag !== "Todos") rows = rows.filter((b) => b.tags.includes(tag));
    if (sort === "pop") rows.sort((a, b) => b.pop - a.pop);
    else if (sort === "pit") rows.sort((a, b) => b.pit - a.pit);
    else rows.sort((a, b) => order[a.tier] - order[b.tier] || b.pop - a.pop);
    return rows;
  }, [cls, tag, sort, rev]);

  const byTier = useMemoHub(() => {
    const g = { S: [], A: [], B: [], C: [], D: [] };
    filtered.forEach((b) => g[b.tier].push(b));
    return g;
  }, [filtered]);

  return (
    <div>
      {/* hero */}
      <section style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        flexWrap: "wrap", gap: 18, marginBottom: 22 }}>
        <div>
          <div style={{ fontFamily: "var(--f-ui)", fontSize: 12, letterSpacing: ".22em",
            textTransform: "uppercase", color: "var(--accent)", marginBottom: 8 }}>
            A Forja da Meta · {D4.patch.label}
          </div>
          <h1 style={{ fontFamily: "var(--f-display)", fontSize: 40, fontWeight: 700, color: "var(--text)",
            margin: 0, lineHeight: 1.04, letterSpacing: ".01em" }}>Tier list da temporada</h1>
          <p style={{ margin: "10px 0 0", maxWidth: 540, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.55 }}>
            Builds originais em formato FORGE, com dano calculado pela engine de buckets e referências
            agregadas das melhores fontes da comunidade.
          </p>
        </div>
        <div style={{ display: "flex", gap: 22 }}>
          <PulseStat n={D4.builds.length} label="Builds" />
          <PulseStat n="4" label="Fontes" />
          <PulseStat n={`+${Math.max(...D4.builds.map((b) => b.pit))}`} label="Top Pit" />
        </div>
      </section>

      {/* filters */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24,
        padding: 14, borderRadius: 12, background: "var(--panel)", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <span style={labelHubStyle}>Classe</span>
          <FilterChip active={cls === "Todas"} onClick={() => setCls("Todas")}>Todas</FilterChip>
          {Object.keys(D4.classes).map((c) => (
            <FilterChip key={c} active={cls === c} color={D4.classes[c].color} onClick={() => setCls(c)}>{c}</FilterChip>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <span style={labelHubStyle}>Conteúdo</span>
          {tagOptions.map((t) => (
            <FilterChip key={t} active={tag === t} onClick={() => setTag(t)}>{t}</FilterChip>
          ))}
          <span style={{ ...labelHubStyle, marginLeft: "auto" }}>Ordenar</span>
          {[["tier", "Tier"], ["pop", "Uso"], ["pit", "Pit"]].map(([k, lbl]) => (
            <FilterChip key={k} active={sort === k} onClick={() => setSort(k)}>{lbl}</FilterChip>
          ))}
        </div>
      </div>

      {/* tier rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {["S", "A", "B", "C", "D"].map((t) => {
          const rows = byTier[t];
          const meta = D4.tiers[t];
          return (
            <section key={t} style={{
              display: "flex", gap: 18, alignItems: "stretch", padding: 14, borderRadius: 14,
              background: `linear-gradient(100deg, ${meta.color}0e, transparent 40%)`,
              border: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 70, flex: "0 0 auto" }}>
                <TierPlate tier={t} size={56} />
                <span style={{ fontFamily: "var(--f-ui)", fontSize: 10, textAlign: "center", color: "var(--muted)",
                  textTransform: "uppercase", letterSpacing: ".08em" }}>{meta.label}</span>
              </div>
              <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 14, alignItems: "stretch" }}>
                {rows.length === 0 ? (
                  <div style={{ flex: 1, display: "grid", placeItems: "center", minHeight: 90, color: "var(--faint)",
                    fontFamily: "var(--f-ui)", fontSize: 13, border: "1px dashed var(--line)", borderRadius: 10 }}>
                    Nenhuma build neste tier · contribua com a sua no Forge
                  </div>
                ) : rows.map((b) => (
                  <BuildCard key={b.id} build={b} onOpen={onOpen} onCompare={onCompare}
                    comparing={comparing} selectedForCompare={compareIds.includes(b.id)} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

const labelHubStyle = {
  fontFamily: "var(--f-ui)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".12em",
  color: "var(--faint)", width: 64,
};

function PulseStat({ n, label }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontFamily: "var(--f-num)", fontSize: 30, fontWeight: 600, color: "var(--accent)", lineHeight: 1 }}>{n}</div>
      <div style={{ fontFamily: "var(--f-ui)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".14em", color: "var(--faint)", marginTop: 4 }}>{label}</div>
    </div>
  );
}

Object.assign(window, { MetaHub, BuildCard });
