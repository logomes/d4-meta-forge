// status: "current" | "outdated" | "unknown"
// current => nada (só sinaliza quando há algo a avisar).
export default function PatchBadge({ status, buildPatch, currentPatch }) {
  if (status === "current") return null;
  const outdated = status === "outdated";
  const color = outdated ? "#e2a23a" : "#8a9296";
  const label = outdated ? `${buildPatch || "?"} · desatualizada` : "patch ?";
  const title = outdated
    ? `Patch atual: ${currentPatch || "?"}`
    : "O patch desta build é desconhecido";
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1.5 rounded-full font-ui text-[11px]"
      style={{ color, padding: "2px 8px", border: `1px solid ${color}55`, background: `${color}14` }}
    >
      <span
        style={{ width: 6, height: 6, borderRadius: 999, background: color, boxShadow: `0 0 6px ${color}` }}
      />
      {label}
    </span>
  );
}
