/* Build Detail — full build sheet: skills, rotation, gear, radar, damage snapshot, sources. */
import { useMemo, useState } from "react";
import { CLASSES, BUCKETS } from "../data/taxonomy.js";
import { computeDamage } from "../lib/damage.js";
import { patchStatus } from "../lib/patchStatus.js";
import { fmt } from "../lib/format.js";
import { toAPI } from "../lib/buildShape.js";
import { buildToMarkdown } from "../markdown.js";
import Panel from "../components/primitives/Panel.jsx";
import Glyph from "../components/primitives/Glyph.jsx";
import TierPlate from "../components/primitives/TierPlate.jsx";
import SourceBadge from "../components/primitives/SourceBadge.jsx";
import PatchBadge from "../components/primitives/PatchBadge.jsx";
import Radar from "../components/primitives/Radar.jsx";

// ── SkillPip ─────────────────────────────────────────────────────────────────

function SkillPip({ s }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 9,
        background: s.key ? "var(--accent-wash)" : "var(--input)",
        border: `1px solid ${s.key ? "var(--accent-dim)" : "var(--line)"}`,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          flex: "0 0 auto",
          borderRadius: 7,
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(160deg, #ffffff10, #0c0907)",
          border: "1px solid var(--line)",
          fontFamily: "var(--f-display)",
          color: s.key ? "var(--accent)" : "var(--muted)",
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        {(s.name || "?").slice(0, 1)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            color: "var(--text)",
            fontFamily: "var(--f-ui)",
            fontWeight: 600,
          }}
        >
          {s.name || "—"}{" "}
          {s.key && <span style={{ color: "var(--accent)", fontSize: 11 }}>★</span>}
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--f-ui)" }}>
          {s.element || "—"} · {s.role || "—"}
        </div>
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            style={{
              width: 5,
              height: 16,
              borderRadius: 2,
              background: i < (s.ranks || 0) ? "var(--accent)" : "var(--line)",
              opacity: i < (s.ranks || 0) ? 1 : 0.5,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── MiniMult ─────────────────────────────────────────────────────────────────

function MiniMult({ label, v }) {
  return (
    <div
      style={{
        padding: "9px 11px",
        borderRadius: 9,
        background: "var(--input)",
        border: "1px solid var(--line)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: ".1em",
          color: "var(--faint)",
          fontFamily: "var(--f-ui)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--f-num)",
          fontSize: 18,
          fontWeight: 600,
          color: "var(--ember)",
        }}
      >
        ×{(v || 1).toFixed(2)}
      </div>
    </div>
  );
}

// ── style helpers ─────────────────────────────────────────────────────────────

const statLabel = {
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: ".12em",
  color: "var(--faint)",
  fontFamily: "var(--f-ui)",
  marginBottom: 4,
};

const primaryBtn = {
  fontFamily: "var(--f-ui)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
  padding: "9px 14px",
  borderRadius: 9,
  border: "1px solid var(--accent)",
  color: "#0c0907",
  background: "var(--accent)",
};

const ghostBtn = {
  fontFamily: "var(--f-ui)",
  fontSize: 13,
  cursor: "pointer",
  whiteSpace: "nowrap",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "9px 14px",
  borderRadius: 9,
  border: "1px solid var(--line)",
  color: "var(--muted)",
  background: "transparent",
};

// ── BuildDetail (default export) ──────────────────────────────────────────────

export default function BuildDetail({ build, currentPatch, onBack, onLab, onCompare, onEdit }) {
  const cm = CLASSES[build.class] || { color: "#9c8a76", rune: "?" };
  const dmg = useMemo(() => computeDamage(build.combat), [build]);
  const [md, setMd] = useState(null);

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
        ← Voltar à tier list
      </button>

      {/* hero */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 16,
          padding: 24,
          marginBottom: 18,
          background: `linear-gradient(120deg, ${cm.color}1c, var(--panel) 46%)`,
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.5,
            background: `radial-gradient(60% 120% at 100% 0%, ${cm.color}22, transparent 60%)`,
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            gap: 20,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <Glyph cls={build.class} size={72} />
          <div style={{ flex: 1, minWidth: 260 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <h1
                style={{
                  fontFamily: "var(--f-display)",
                  fontSize: 34,
                  fontWeight: 700,
                  color: "var(--text)",
                  margin: 0,
                  lineHeight: 1.05,
                }}
              >
                {build.name}
              </h1>
              <PatchBadge
                status={patchStatus(build.patch, currentPatch)}
                buildPatch={build.patch}
                currentPatch={currentPatch}
              />
            </div>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 14,
                color: "var(--muted)",
                fontFamily: "var(--f-ui)",
              }}
            >
              <span style={{ color: cm.color, fontWeight: 600 }}>{build.class}</span> ·{" "}
              {build.archetype} · {build.objective}
            </p>
            <p
              style={{
                margin: "12px 0 0",
                maxWidth: 620,
                fontSize: 14,
                lineHeight: 1.6,
                color: "var(--muted-2)",
              }}
            >
              {build.blurb}
            </p>
            {build.sources && build.sources.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  marginTop: 14,
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: ".12em",
                    color: "var(--faint)",
                    fontFamily: "var(--f-ui)",
                  }}
                >
                  Referências
                </span>
                {build.sources.map((s, i) => (
                  <SourceBadge key={i} s={s} />
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <TierPlate tier={build.tier} size={64} />
            <button onClick={() => onLab(build)} style={primaryBtn}>
              Abrir no Damage Lab →
            </button>
            <button onClick={() => onEdit(build)} style={ghostBtn}>
              Editar no Forge
            </button>
            <button onClick={() => onCompare(build)} style={ghostBtn}>
              + Comparar
            </button>
            <button
              onClick={() => setMd(buildToMarkdown(toAPI(build)))}
              style={ghostBtn}
            >
              Exportar Markdown
            </button>
          </div>
        </div>
      </section>

      {/* body grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 18,
          alignItems: "start",
        }}
        className="detail-grid"
      >
        {/* left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Skills */}
          <Panel title="Skill bar">
            {build.skills.length > 0 ? (
              <div
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
                className="skill-grid"
              >
                {build.skills.map((s, i) => (
                  <SkillPip key={i} s={s} />
                ))}
              </div>
            ) : (
              <p
                className="font-ui text-faint text-[13px]"
                style={{ margin: 0, textAlign: "center", padding: "12px 0" }}
              >
                Nenhuma skill cadastrada
              </p>
            )}
          </Panel>

          {/* Rotation */}
          <Panel title="Rotação de combate">
            {build.rotation.length > 0 ? (
              <ol
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                {build.rotation.map((r, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 12px",
                        borderRadius: 8,
                        background: "var(--input)",
                        border: "1px solid var(--line)",
                        color: "var(--text)",
                        fontFamily: "var(--f-ui)",
                        fontSize: 13,
                      }}
                    >
                      <b style={{ fontFamily: "var(--f-num)", color: "var(--accent)" }}>{i + 1}</b>
                      {r}
                    </span>
                    {i < build.rotation.length - 1 && (
                      <span style={{ color: "var(--faint)" }}>→</span>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p
                className="font-ui text-faint text-[13px]"
                style={{ margin: 0, textAlign: "center", padding: "12px 0" }}
              >
                Rotação não definida
              </p>
            )}
          </Panel>

          {/* Gear */}
          <Panel title="Gear & Aspects">
            {build.gear.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {build.gear.map((g, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      padding: "10px 12px",
                      borderRadius: 9,
                      background: "var(--input)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <span
                      style={{
                        width: 70,
                        flex: "0 0 auto",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: ".08em",
                        color: "var(--faint)",
                        fontFamily: "var(--f-ui)",
                      }}
                    >
                      {g.slot}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13.5,
                          color: "var(--text)",
                          fontFamily: "var(--f-ui)",
                          fontWeight: 600,
                        }}
                      >
                        {g.item}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{g.affixes}</div>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "3px 8px",
                        borderRadius: 999,
                        fontFamily: "var(--f-ui)",
                        color: g.type === "Unique" ? "#e2a23a" : "var(--accent)",
                        border: `1px solid ${g.type === "Unique" ? "#e2a23a55" : "var(--accent-dim)"}`,
                        background: g.type === "Unique" ? "#e2a23a12" : "var(--accent-wash)",
                      }}
                    >
                      {g.type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className="font-ui text-faint text-[13px]"
                style={{ margin: 0, textAlign: "center", padding: "12px 0" }}
              >
                Nenhum item cadastrado
              </p>
            )}
          </Panel>
        </div>

        {/* right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Radar */}
          <Panel title="Perfil da build">
            {build.attributes.length > 0 ? (
              <Radar data={build.attributes} color={cm.color} size={240} />
            ) : (
              <p
                className="font-ui text-faint text-[13px]"
                style={{ margin: 0, textAlign: "center", padding: "12px 0" }}
              >
                sem atributos
              </p>
            )}
          </Panel>

          {/* Damage snapshot */}
          <Panel title="Snapshot de dano">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: 14,
              }}
            >
              <div>
                <div style={statLabel}>DPS esperado</div>
                <div
                  style={{
                    fontFamily: "var(--f-num)",
                    fontSize: 36,
                    fontWeight: 700,
                    color: "var(--accent)",
                    lineHeight: 1,
                  }}
                >
                  {fmt(dmg.expected_dps)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={statLabel}>Hit esperado</div>
                <div
                  style={{
                    fontFamily: "var(--f-num)",
                    fontSize: 22,
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {fmt(dmg.expected_hit)}
                </div>
              </div>
            </div>

            {/* 3-column MiniMult grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
              }}
            >
              <MiniMult label="Crit" v={dmg.crit_multiplier} />
              <MiniMult label="Vulnerable" v={dmg.vulnerable_multiplier} />
              <MiniMult label="Overpower" v={dmg.overpower_multiplier} />
            </div>

            {/* Per-bucket breakdown */}
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {dmg.buckets.map((b) => {
                const bm = BUCKETS[b.bucket] || { label: b.bucket, color: "var(--accent)" };
                return (
                  <div
                    key={b.bucket}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 12.5,
                      fontFamily: "var(--f-ui)",
                    }}
                  >
                    <span style={{ color: "var(--muted)" }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: bm.color,
                          marginRight: 7,
                        }}
                      />
                      {bm.label}{" "}
                      <span style={{ color: "var(--faint)" }}>
                        (+{Math.round(b.additive_sum * 100)}%)
                      </span>
                    </span>
                    <span style={{ fontFamily: "var(--f-num)", color: "var(--text)" }}>
                      ×{b.multiplier.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => onLab(build)}
              style={{ ...ghostBtn, width: "100%", marginTop: 14, justifyContent: "center" }}
            >
              Ajustar na calculadora ao vivo →
            </button>
          </Panel>
        </div>
      </div>

      {/* Markdown export panel */}
      {md !== null && (
        <div style={{ marginTop: 18 }}>
          <Panel title="Markdown">
            <textarea
              value={md}
              readOnly
              rows={14}
              className="w-full rounded-lg border border-line bg-input p-3 font-num text-[12px] text-text"
            />
            <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => navigator.clipboard.writeText(md)}
                style={ghostBtn}
              >
                Copiar
              </button>
              <button
                onClick={() => setMd(null)}
                style={ghostBtn}
              >
                Fechar
              </button>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
