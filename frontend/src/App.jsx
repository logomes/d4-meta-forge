import { useEffect, useMemo, useState } from "react";
import AppShell from "./components/AppShell.jsx";
import { listBuilds, currentPatch as fetchCurrentPatch, saveBuild } from "./api.js";
import { toUI, toAPI, newBuild } from "./lib/buildShape.js";
import MetaHub from "./views/MetaHub.jsx";
import BuildDetail from "./views/BuildDetail.jsx";
import DamageLab from "./views/DamageLab.jsx";
import CompareView from "./views/CompareView.jsx";
import Forge from "./views/Forge.jsx";

export default function App() {
  const [view, setView] = useState("hub");
  const [theme, setTheme] = useState("obsidian");
  const [accent, setAccent] = useState("#e8c860");

  const [builds, setBuilds] = useState([]);
  const [selected, setSelected] = useState(null); // build de UI
  const [labBuild, setLabBuild] = useState(null);
  const [forgeBuild, setForgeBuild] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [curPatch, setCurPatch] = useState("");

  const reload = () =>
    listBuilds()
      .then((rows) => setBuilds(rows.map(toUI)))
      .catch(() => setBuilds([]));

  useEffect(() => {
    reload();
    fetchCurrentPatch()
      .then((r) => setCurPatch(r.patch || ""))
      .catch(() => setCurPatch(""));
  }, []);

  const nav = (v) => {
    setView(v);
    window.scrollTo(0, 0);
  };
  const open = (b) => {
    setSelected(b);
    nav("detail");
  };
  const toLab = (b) => {
    setLabBuild(b);
    nav("lab");
  };
  const openForge = (b) => {
    setForgeBuild(b || newBuild());
    nav("forge");
  };
  const handleSave = async (uiBuild) => {
    const payload = toAPI(uiBuild);
    if (payload.id === "new") delete payload.id; // POST cria id no backend
    await saveBuild(payload);
    await reload();
    nav("hub");
  };

  const toggleCompareId = (b) =>
    setCompareIds((ids) => (ids.includes(b.id) ? ids.filter((x) => x !== b.id) : [...ids, b.id]));
  const addCompare = (b) => {
    setCompareIds((ids) => (ids.includes(b.id) ? ids : [...ids, b.id]));
    setComparing(true);
    nav("hub");
  };
  const cmpBuilds = useMemo(() => builds.filter((b) => compareIds.includes(b.id)), [builds, compareIds]);

  return (
    <AppShell
      view={view}
      onNav={nav}
      theme={theme}
      setTheme={setTheme}
      accent={accent}
      setAccent={setAccent}
      onNew={() => openForge(null)}
      patchLabel={curPatch ? `patch ${curPatch}` : null}
    >
      {view === "hub" && (
        <MetaHub
          builds={builds}
          currentPatch={curPatch}
          onOpen={open}
          comparing={comparing}
          compareIds={compareIds}
          onCompare={comparing ? toggleCompareId : addCompare}
        />
      )}
      {view === "detail" && selected && (
        <BuildDetail
          build={selected}
          currentPatch={curPatch}
          onBack={() => nav("hub")}
          onLab={toLab}
          onCompare={addCompare}
          onEdit={openForge}
        />
      )}
      {view === "lab" && <DamageLab builds={builds} initialBuild={labBuild} onOpen={open} />}
      {view === "compare" && (
        <CompareView builds={cmpBuilds} onBack={() => nav("hub")} onOpen={open} />
      )}
      {view === "forge" && forgeBuild && (
        <Forge build={forgeBuild} onSave={handleSave} onCancel={() => nav("hub")} onLab={toLab} />
      )}
    </AppShell>
  );
}
