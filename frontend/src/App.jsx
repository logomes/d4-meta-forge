import { useEffect, useState } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import { Flame, AlertTriangle, Plus, Pencil, X, GitCompare, FileDown, Copy, Download } from "lucide-react";
import { listBuilds, saveBuild } from "./api.js";
import { buildToMarkdown } from "./markdown.js";
import BuildForge from "./components/BuildForge.jsx";
import BuildCompare from "./components/BuildCompare.jsx";

const TIER = { S: "#d4af37", A: "#d05a3e", B: "#4ea3d9", C: "#7a8a8f", D: "#5a5a5a" };

function newBuild() {
  return { id: "new", name: "Nova Build", class_name: "Sorcerer", archetype: "", tier: "B", patch: "", objective: "", data: {} };
}

export default function App() {
  const [builds, setBuilds] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [showMd, setShowMd] = useState(false);
  const [error, setError] = useState("");

  const refresh = (pick) =>
    listBuilds()
      .then((rows) => {
        setBuilds(rows);
        setSelected((s) => (pick ? rows.find((b) => b.id === pick) || rows[0] || null : s || rows[0] || null));
        setError("");
      })
      .catch((e) => setError(e.message));

  useEffect(() => { refresh(); }, []);

  const handleSave = async (payload) => {
    const saved = await saveBuild(payload);
    await refresh(saved.id);
    setSelected(saved);
    setEditing(false);
  };

  const startNew = () => { setSelected(newBuild()); setEditing(true); setComparing(false); setShowMd(false); };
  const toggleCompare = () => { setComparing((c) => !c); setEditing(false); setShowMd(false); };
  const toggleCompareId = (id) =>
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <div style={{ color: "#e7dccd", fontFamily: "Georgia, serif", minHeight: "100vh" }}>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame size={26} color="#c0461f" />
            <div>
              <h1 className="text-xl font-black" style={{ color: "#d4af37", letterSpacing: "0.1em" }}>D4 META FORGE</h1>
              <p className="text-xs" style={{ color: "#9c8a76" }}>builds + meta + calculator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleCompare}
              className="inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm"
              style={{ color: comparing ? "#0c0a09" : "#9c8a76", background: comparing ? "#d4af37" : "transparent", border: "1px solid #3a2c22" }}>
              <GitCompare size={15} /> {comparing ? "Sair da comparação" : "Comparar"}
            </button>
            <button onClick={startNew}
              className="inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm"
              style={{ color: "#d4af37", border: "1px solid #d4af37", background: "transparent" }}>
              <Plus size={15} /> Nova build
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded p-3 text-sm"
            style={{ background: "rgba(192,70,31,0.12)", color: "#e08a7a" }}>
            <AlertTriangle size={16} /> API offline ({error}). Suba o backend: <code>uvicorn app.main:app</code>
          </div>
        )}

        {comparing && (
          <p className="mb-2 text-xs" style={{ color: "#9c8a76" }}>
            Modo comparação: selecione 2 ou mais builds.
          </p>
        )}
        <div className="mb-5 flex flex-wrap gap-2">
          {builds.map((b) => {
            const active = comparing ? compareIds.includes(b.id) : selected?.id === b.id;
            return (
              <button key={b.id}
                onClick={() => (comparing ? toggleCompareId(b.id) : (setSelected(b), setEditing(false), setShowMd(false)))}
                className="rounded px-3 py-1.5 text-sm"
                style={{
                  background: active ? "#1f1814" : "transparent",
                  border: `1px solid ${active ? "#d4af37" : "#3a2c22"}`,
                }}>
                <b style={{ color: TIER[b.tier] || "#9c8a76" }}>[{b.tier}]</b> {b.name}
              </button>
            );
          })}
        </div>

        {comparing ? (
          compareIds.length >= 2 ? (
            <BuildCompare builds={builds.filter((b) => compareIds.includes(b.id))} />
          ) : (
            <p className="text-sm" style={{ color: "#9c8a76" }}>
              Selecione pelo menos 2 builds acima para ver o comparativo.
            </p>
          )
        ) : (
          <>
            {selected && editing && (
              <div>
                <div className="mb-3 flex justify-end">
                  <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 text-xs" style={{ color: "#9c8a76" }}>
                    <X size={13} /> Cancelar edição
                  </button>
                </div>
                <BuildForge build={selected} onSave={handleSave} />
              </div>
            )}

            {selected && !editing && (
              <div>
                <div className="mb-3 flex justify-end gap-2">
                  <button onClick={() => setShowMd((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm"
                    style={{ color: "#9c8a76", border: "1px solid #3a2c22", background: "transparent" }}>
                    <FileDown size={13} /> Export MD
                  </button>
                  <button onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm"
                    style={{ color: "#d4af37", border: "1px solid #3a2c22", background: "transparent" }}>
                    <Pencil size={13} /> Editar
                  </button>
                </div>
                {showMd && <ExportPanel build={selected} onClose={() => setShowMd(false)} />}
                <Viewer build={selected} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Viewer({ build }) {
  const d = build.data || {};
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <section className="md:col-span-3 rounded-lg p-5"
        style={{ background: "#17120f", border: "1px solid #2a201a" }}>
        <h2 className="text-2xl font-black" style={{ color: "#e7dccd" }}>{build.name}</h2>
        <p className="mt-1 text-sm" style={{ color: "#9c8a76" }}>
          {build.class_name} · {build.archetype} · patch {build.patch}
        </p>
        <p className="mt-2 text-sm" style={{ color: "#d4af37" }}>{build.objective}</p>
        {Array.isArray(d.skills) && (
          <ul className="mt-4 space-y-1 text-sm">
            {d.skills.map((s, i) => (
              <li key={i} style={{ color: "#e7dccd" }}>
                <b>{s.name}</b> <span style={{ color: "#9c8a76" }}>{s.ranks}/5 · {s.role}</span>
              </li>
            ))}
          </ul>
        )}
        {d.combat && (
          <p className="mt-4 text-xs" style={{ color: "#9c8a76" }}>
            Perfil de combate salvo · clique em <b style={{ color: "#d4af37" }}>Editar</b> para abrir a calculadora ao vivo.
          </p>
        )}
      </section>

      <section className="md:col-span-2 rounded-lg p-3"
        style={{ background: "#17120f", border: "1px solid #2a201a" }}>
        {Array.isArray(d.attributes) && (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={d.attributes} outerRadius="72%">
                <PolarGrid stroke="#3a2c22" />
                <PolarAngleAxis dataKey="attribute" tick={{ fill: "#9c8a76", fontSize: 9 }} />
                <Radar dataKey="value" stroke="#c0461f" fill="#c0461f" fillOpacity={0.45} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}

function ExportPanel({ build, onClose }) {
  const md = buildToMarkdown(build);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable; textarea selection still works */ }
  };
  const download = () => {
    const slug = (build.name || "build").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "build"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="mb-4 rounded-lg p-4" style={{ background: "#17120f", border: "1px solid #2a201a" }}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-wide" style={{ color: "#d4af37" }}>EXPORT MARKDOWN</h3>
        <div className="flex items-center gap-2">
          <button onClick={copy} className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs"
            style={{ color: "#9c8a76", border: "1px solid #3a2c22" }}>
            <Copy size={12} /> {copied ? "Copiado!" : "Copiar"}
          </button>
          <button onClick={download} className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs"
            style={{ color: "#9c8a76", border: "1px solid #3a2c22" }}>
            <Download size={12} /> Baixar .md
          </button>
          <button onClick={onClose} className="inline-flex items-center gap-1.5 text-xs" style={{ color: "#9c8a76" }}>
            <X size={12} /> Fechar
          </button>
        </div>
      </div>
      <textarea readOnly value={md} spellCheck={false}
        style={{ width: "100%", height: 260, background: "#120d0a", color: "#e7dccd", border: "1px solid #3a2c22", borderRadius: 6, padding: 12, fontFamily: "ui-monospace, monospace", fontSize: 12, whiteSpace: "pre", overflow: "auto" }} />
    </div>
  );
}
