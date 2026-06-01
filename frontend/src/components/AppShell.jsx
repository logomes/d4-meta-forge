import { useEffect } from "react";
import { ACCENTS } from "../data/taxonomy.js";

const THEME_LIST = ["obsidian", "abyss", "parchment"];
const TABS = [
  { key: "hub", label: "Meta Hub" },
  { key: "lab", label: "Damage Lab" },
  { key: "forge", label: "Forge" },
  { key: "compare", label: "Comparar" },
];

function NavTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="relative cursor-pointer border-0 bg-transparent px-1 py-2 font-ui text-[13.5px] tracking-[.01em]"
      style={{ color: active ? "var(--text)" : "var(--muted)" }}
    >
      {children}
      <span
        className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded"
        style={{
          background: active ? "var(--accent)" : "transparent",
          boxShadow: active ? "0 0 8px var(--accent-glow)" : "none",
        }}
      />
    </button>
  );
}

export default function AppShell({ view, onNav, theme, setTheme, accent, setAccent, onNew, patchLabel, children }) {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--accent-dim", accent + "66");
    root.style.setProperty("--accent-wash", accent + "16");
    root.style.setProperty("--accent-glow", accent + "55");
  }, [theme, accent]);

  return (
    <div className="min-h-screen bg-bg text-text">
      <header
        className="sticky top-0 z-50 border-b border-border"
        style={{ backdropFilter: "blur(10px)", background: "color-mix(in srgb, var(--bg) 82%, transparent)" }}
      >
        <div className="mx-auto flex max-w-[1180px] items-center gap-6 px-6 py-3">
          <button onClick={() => onNav("hub")} className="cursor-pointer border-0 bg-transparent font-display text-[17px] font-bold tracking-[.12em] text-accent">
            D4 META FORGE
          </button>
          <nav className="flex items-center gap-5">
            {TABS.map((t) => (
              <NavTab key={t.key} active={view === t.key} onClick={() => onNav(t.key)}>
                {t.label}
              </NavTab>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={onNew}
              className="cursor-pointer rounded-lg border border-accent bg-accent px-3 py-1.5 font-ui text-[13px] font-semibold"
              style={{ color: "#0c0907" }}
            >
              + Nova build
            </button>
            {patchLabel && (
              <span className="rounded-full border border-line px-2.5 py-1 font-ui text-[11px] text-muted">
                {patchLabel}
              </span>
            )}
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="cursor-pointer rounded-md border border-line bg-input px-2 py-1 font-ui text-[12px] text-text outline-none"
            >
              {THEME_LIST.map((th) => (
                <option key={th} value={th}>{th}</option>
              ))}
            </select>
            <div className="flex items-center gap-1.5">
              {Object.keys(ACCENTS).map((hex) => (
                <button
                  key={hex}
                  title={ACCENTS[hex]}
                  onClick={() => setAccent(hex)}
                  className="h-4 w-4 cursor-pointer rounded-full border"
                  style={{ background: hex, borderColor: accent === hex ? "var(--text)" : "transparent" }}
                />
              ))}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-6 py-8">{children}</main>
    </div>
  );
}
