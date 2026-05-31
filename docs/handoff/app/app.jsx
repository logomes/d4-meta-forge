/* Root app: shell, header nav, view routing, theme tokens, Tweaks. */
const { useState: useStateApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#e8c860",
  "theme": "obsidian",
  "font": "serif",
  "density": "normal"
}/*EDITMODE-END*/;

const ACCENTS = { "#e8c860": "Ouro", "#e2622e": "Fogo", "#5ab4e8": "Gelo", "#7fb653": "Veneno" };

const THEMES = {
  obsidian: { "--bg": "#0b0907", "--panel": "#16110d", "--input": "#100b08", "--border": "#2a2018", "--line": "#352a20",
    "--text": "#ece2d3", "--text-dim": "#b9ab97", "--muted": "#9c8a76", "--muted-2": "#b3a48f", "--faint": "#6b5d4d", "--ember": "#e2622e" },
  abyss: { "--bg": "#07080a", "--panel": "#0f1318", "--input": "#0a0d11", "--border": "#1c232b", "--line": "#27303a",
    "--text": "#dde6ee", "--text-dim": "#9fb0c0", "--muted": "#7d8da0", "--muted-2": "#9aa9bb", "--faint": "#56616e", "--ember": "#e2622e" },
  parchment: { "--bg": "#e7ddca", "--panel": "#f3ecdc", "--input": "#ece2cc", "--border": "#ccbd9c", "--line": "#d8cbac",
    "--text": "#2a2114", "--text-dim": "#5a4d36", "--muted": "#6f5f44", "--muted-2": "#564a34", "--faint": "#9a8966", "--ember": "#b5471f" },
};

const FONTS = {
  serif:  { "--f-display": "'Cinzel', serif", "--f-ui": "'Spectral', Georgia, serif", "--f-num": "'Oswald', sans-serif" },
  modern: { "--f-display": "'Oswald', sans-serif", "--f-ui": "'Outfit', sans-serif", "--f-num": "'Oswald', sans-serif" },
};

const ZOOM = { compacto: 0.9, normal: 1, amplo: 1.08 };

function withAlpha(hex, a) { return hex + a; }

function NavTab({ active, onClick, children }) {
  const [h, setH] = useStateApp(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        fontFamily: "var(--f-ui)", fontSize: 13.5, cursor: "pointer", padding: "8px 4px", background: "none", border: "none",
        color: active ? "var(--text)" : h ? "var(--text-dim)" : "var(--muted)", position: "relative", letterSpacing: ".01em",
      }}>
      {children}
      <span style={{ position: "absolute", left: 0, right: 0, bottom: -2, height: 2, borderRadius: 2,
        background: active ? "var(--accent)" : "transparent", boxShadow: active ? "0 0 8px var(--accent-glow)" : "none" }} />
    </button>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useStateApp("hub");
  const [selected, setSelected] = useStateApp(null);
  const [labBuild, setLabBuild] = useStateApp(null);
  const [comparing, setComparing] = useStateApp(false);
  const [compareIds, setCompareIds] = useStateApp([]);
  const [forgeBuild, setForgeBuild] = useStateApp(null);
  const [rev, setRev] = useStateApp(0);

  const D4 = window.D4;
  const accent = t.accent || "#e8c860";
  const vars = {
    ...THEMES[t.theme] || THEMES.obsidian,
    ...FONTS[t.font] || FONTS.serif,
    "--accent": accent,
    "--accent-dim": withAlpha(accent, "66"),
    "--accent-wash": withAlpha(accent, "16"),
    "--accent-glow": withAlpha(accent, "55"),
  };

  const open = (b) => { setSelected(b); setView("detail"); setComparing(false); window.scrollTo(0, 0); };
  const toLab = (b) => { setLabBuild(b); setView("lab"); window.scrollTo(0, 0); };
  const toggleCompareId = (b) => setCompareIds((ids) => ids.includes(b.id) ? ids.filter((x) => x !== b.id) : [...ids, b.id]);
  const addCompare = (b) => { setCompareIds((ids) => ids.includes(b.id) ? ids : [...ids, b.id]); setComparing(true); setView("hub"); window.scrollTo(0, 0); };
  const cmpBuilds = D4.builds.filter((b) => compareIds.includes(b.id));

  const openForge = (b) => { setForgeBuild(b); setView("forge"); setComparing(false); window.scrollTo(0, 0); };
  const saveForge = (b) => {
    if (b.id === "__new__") {
      const slug = (b.name || "build").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "build";
      b = { ...b, id: `${slug}-${Date.now().toString(36)}` };
      D4.builds.push(b);
    } else {
      const i = D4.builds.findIndex((x) => x.id === b.id);
      if (i >= 0) D4.builds[i] = b; else D4.builds.push(b);
    }
    setRev((r) => r + 1);
    setSelected(b); setView("detail"); window.scrollTo(0, 0);
  };

  return (
    <div style={{ ...vars, minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--f-ui)" }}>
      {/* ambient top glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(80% 50% at 50% -10%, var(--accent-wash), transparent 60%)" }} />

      {/* header */}
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "color-mix(in srgb, var(--bg) 82%, transparent)",
        backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "13px 28px", display: "flex", alignItems: "center", gap: 28 }}>
          <button onClick={() => { setView("hub"); setComparing(false); }} style={{ display: "flex", alignItems: "center", gap: 11, background: "none", border: "none", cursor: "pointer" }}>
            <FlameMark />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: "var(--f-display)", fontSize: 17, fontWeight: 700, letterSpacing: ".12em", color: "var(--accent)", lineHeight: 1 }}>D4 META FORGE</div>
              <div style={{ fontFamily: "var(--f-ui)", fontSize: 10, letterSpacing: ".1em", color: "var(--faint)", marginTop: 2 }}>builds · meta · calculadora</div>
            </div>
          </button>

          <nav style={{ display: "flex", gap: 22, marginLeft: 12 }}>
            <NavTab active={view === "hub" && !comparing} onClick={() => { setView("hub"); setComparing(false); }}>Meta Hub</NavTab>
            <NavTab active={view === "lab"} onClick={() => toLab(labBuild || selected || D4.builds[0])}>Damage Lab</NavTab>
            <NavTab active={view === "forge"} onClick={() => openForge({ id: "__new__" })}>Forge</NavTab>
            <NavTab active={comparing || view === "compare"} onClick={() => { setComparing(true); setView("hub"); }}>Comparar</NavTab>
          </nav>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => openForge({ id: "__new__" })} style={{ display: "inline-flex", alignItems: "center", gap: 7,
              fontFamily: "var(--f-ui)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "7px 14px", borderRadius: 9,
              border: "1px solid var(--accent)", color: "var(--accent)", background: "var(--accent-wash)" }}>
              <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> Nova build
            </button>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--f-ui)", fontSize: 12, color: "var(--muted)",
              padding: "5px 11px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--panel)" }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "#6fae5a", boxShadow: "0 0 6px #6fae5a" }} />
              Patch {D4.patch.current}
            </span>
          </div>
        </div>
      </header>

      {/* content */}
      <main style={{ position: "relative", zIndex: 1, maxWidth: 1240, margin: "0 auto", padding: "30px 28px 90px", zoom: ZOOM[t.density] || 1 }}>
        {view === "hub" && (
          <MetaHub onOpen={open} comparing={comparing} compareIds={compareIds} onCompare={toggleCompareId} rev={rev} />
        )}
        {view === "detail" && selected && (
          <BuildDetail build={selected} onBack={() => setView("hub")} onLab={toLab} onCompare={addCompare} onEdit={openForge} />
        )}
        {view === "forge" && (
          <Forge build={forgeBuild} onSave={saveForge} onCancel={() => setView(forgeBuild && forgeBuild.id !== "__new__" ? "detail" : "hub")} onLab={toLab} />
        )}
        {view === "lab" && (
          <DamageLab initialBuild={labBuild} onOpen={open} />
        )}
        {view === "compare" && (
          <CompareView builds={cmpBuilds} onBack={() => { setView("hub"); }} onOpen={open} />
        )}
      </main>

      {/* compare tray */}
      {comparing && view === "hub" && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 30,
          background: "color-mix(in srgb, var(--panel) 92%, transparent)", backdropFilter: "blur(10px)",
          borderTop: "1px solid var(--accent-dim)", boxShadow: "0 -8px 30px #0008" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto", padding: "12px 28px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--f-ui)", fontSize: 13, color: "var(--muted)" }}>
              Modo comparação — selecione 2+ builds.
            </span>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {cmpBuilds.map((b) => (
                <span key={b.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--f-ui)", fontSize: 12,
                  padding: "4px 9px", borderRadius: 999, border: `1px solid ${D4.classes[b.class].color}`, color: "var(--text)" }}>
                  <span style={{ width: 7, height: 7, borderRadius: 999, background: D4.classes[b.class].color }} />{b.name}
                  <button onClick={() => toggleCompareId(b)} style={{ background: "none", border: "none", color: "var(--faint)", cursor: "pointer", padding: 0 }}>✕</button>
                </span>
              ))}
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
              <button onClick={() => { setComparing(false); setCompareIds([]); }} style={{ fontFamily: "var(--f-ui)", fontSize: 13,
                background: "none", border: "1px solid var(--line)", color: "var(--muted)", padding: "8px 14px", borderRadius: 9, cursor: "pointer" }}>Cancelar</button>
              <button disabled={compareIds.length < 2} onClick={() => setView("compare")}
                style={{ fontFamily: "var(--f-ui)", fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 9, cursor: compareIds.length < 2 ? "not-allowed" : "pointer",
                  border: "1px solid var(--accent)", background: compareIds.length < 2 ? "transparent" : "var(--accent)",
                  color: compareIds.length < 2 ? "var(--faint)" : "#0c0907", opacity: compareIds.length < 2 ? 0.6 : 1 }}>
                Comparar ({compareIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      <TweaksPanel>
        <TweakSection label="Aparência" />
        <TweakColor label="Cor de destaque" value={t.accent} options={Object.keys(ACCENTS)} onChange={(v) => setTweak("accent", v)} />
        <TweakRadio label="Tema" value={t.theme} options={["obsidian", "abyss", "parchment"]} onChange={(v) => setTweak("theme", v)} />
        <TweakRadio label="Tipografia" value={t.font} options={["serif", "modern"]} onChange={(v) => setTweak("font", v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Densidade" value={t.density} options={["compacto", "normal", "amplo"]} onChange={(v) => setTweak("density", v)} />
      </TweaksPanel>
    </div>
  );
}

function FlameMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
      <path d="M16 3c2 5-3 7-3 12 0 0-3-2-3-5-3 3-4 6-4 9a10 10 0 0 0 20 0c0-6-5-9-7-13-1 2-2 3-3 4 0-3 1-5 3-7-1 0-2 .3-3 1z"
        fill="var(--accent)" opacity="0.92" />
      <path d="M16 12c1 3-2 4-2 7a4 4 0 0 0 8 0c0-3-3-4-4-7-1 1.5-1.5 2.5-2 4z" fill="var(--ember)" />
    </svg>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
