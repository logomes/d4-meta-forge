import { TIERS } from "../../data/taxonomy.js";

const SOURCE_MARK = { Maxroll: "MX", "Icy-Veins": "IV", D4Builds: "D4", Mobalytics: "MB" };

export default function SourceBadge({ s, compact }) {
  const t = TIERS[s.tier] || { color: "#9c8a76" };
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noopener noreferrer"
      title={`${s.site} — referência externa · ${s.date || ""}`}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-input font-ui text-[11.5px] text-muted no-underline"
      style={{ padding: compact ? "3px 7px" : "5px 9px" }}
    >
      <span className="font-num text-[10px] font-semibold tracking-[.06em] text-text opacity-90">
        {SOURCE_MARK[s.site] || (s.site || "").slice(0, 2)}
      </span>
      <span>{s.site}</span>
      {!compact && (
        <span className="font-num font-bold" style={{ color: t.color }}>
          {s.tier}
        </span>
      )}
      <span className="text-[10px] opacity-50">↗</span>
    </a>
  );
}
