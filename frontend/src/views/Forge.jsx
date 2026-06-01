/* Forge — build editor: identity · skills · gear · sources · attributes + live radar. */
import { useState, useMemo } from "react";
import { CLASSES, CLASS_LIST, TIER_LIST } from "../data/taxonomy.js";
import { computeDamage } from "../lib/damage.js";
import { fmt } from "../lib/format.js";
import { EMPTY_COMBAT } from "../lib/buildShape.js";
import Panel from "../components/primitives/Panel.jsx";
import Glyph from "../components/primitives/Glyph.jsx";
import TierPlate from "../components/primitives/TierPlate.jsx";
import Radar from "../components/primitives/Radar.jsx";

const GEAR_TYPES = ["Aspect", "Unique", "Legendary", "Tempering"];

// ── Style helpers ─────────────────────────────────────────────────────────────

const forgeInputCls =
  "w-full rounded-lg border border-line bg-input px-[10px] py-[8px] font-ui text-[13px] text-text outline-none";

function FField({ label, children, span }) {
  return (
    <label
      style={{ display: "block", gridColumn: span ? `span ${span}` : "auto" }}
    >
      <span className="mb-[5px] block font-ui text-[10px] uppercase tracking-[.1em] text-faint">
        {label}
      </span>
      {children}
    </label>
  );
}

function ghostBtnForge(color) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "var(--f-ui)",
    fontSize: 12,
    cursor: "pointer",
    padding: "6px 11px",
    borderRadius: 8,
    border: `1px solid ${color ? "var(--accent-dim)" : "var(--line)"}`,
    color: color || "var(--muted)",
    background: color ? "var(--accent-wash)" : "transparent",
  };
}

// ── Forge (default export) ────────────────────────────────────────────────────

export default function Forge({ build, onSave, onCancel, onLab }) {
  const isNew = !build || build.id === "new";

  const [m, setM] = useState(() => ({
    id: build?.id || "new",
    name: build?.name || "Nova Build",
    class: build?.class || "Sorcerer",
    tier: build?.tier || "C",
    archetype: build?.archetype || "",
    patch: build?.patch || "",
    objective: build?.objective || "",
    blurb: build?.blurb || "",
    pop: typeof build?.pop === "number" ? build.pop : 0,
    pit: typeof build?.pit === "number" ? build.pit : 0,
    tags:
      Array.isArray(build?.tags) ? build.tags.join(", ") : "",
  }));

  const [skills, setSkills] = useState(() =>
    structuredClone(build?.skills || [])
  );
  const [gear, setGear] = useState(() => structuredClone(build?.gear || []));
  const [attributes, setAttributes] = useState(() =>
    structuredClone(
      build?.attributes?.length
        ? build.attributes
        : [
            { attribute: "Dano", value: 5 },
            { attribute: "Sobrevivência", value: 5 },
            { attribute: "Mobilidade", value: 5 },
            { attribute: "Facilidade", value: 5 },
            { attribute: "Dep. de Gear", value: 5 },
          ]
    )
  );
  const [sources, setSources] = useState(() =>
    structuredClone(build?.sources || [])
  );

  const cm = CLASSES[m.class] || { color: "#9c8a76", rune: "?" };
  const dmg = useMemo(
    () => computeDamage(build?.combat || EMPTY_COMBAT),
    [build]
  );

  const set = (k, v) => setM((s) => ({ ...s, [k]: v }));
  const updRow = (list, setList, i, k, v) => {
    const n = list.slice();
    n[i] = { ...n[i], [k]: v };
    setList(n);
  };
  const rmRow = (list, setList, i) => setList(list.filter((_, j) => j !== i));

  const save = () => {
    onSave({
      ...build,
      ...m,
      pop: Number(m.pop) || 0,
      pit: Number(m.pit) || 0,
      tags:
        typeof m.tags === "string"
          ? m.tags
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : m.tags || [],
      skills,
      gear,
      attributes,
      sources,
      combat: build?.combat || EMPTY_COMBAT,
    });
  };

  return (
    <div>
      {/* back */}
      <button
        onClick={onCancel}
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
        ← Cancelar
      </button>

      {/* header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Glyph cls={m.class} size={52} />
          <div>
            <div
              className="font-ui text-[12px] uppercase tracking-[.22em] text-accent"
            >
              {isNew ? "Nova build · FORGE" : "Editando · FORGE"}
            </div>
            <h1
              style={{
                fontFamily: "var(--f-display)",
                fontSize: 32,
                fontWeight: 700,
                color: "var(--text)",
                margin: "4px 0 0",
                lineHeight: 1,
              }}
            >
              {m.name || "Sem nome"}
            </h1>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <TierPlate tier={m.tier} size={52} />
          <button
            onClick={save}
            style={{
              fontFamily: "var(--f-ui)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              padding: "0 22px",
              height: 44,
              borderRadius: 10,
              border: "1px solid var(--accent)",
              background: "var(--accent)",
              color: "#0c0907",
            }}
          >
            Salvar build
          </button>
        </div>
      </div>

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
        {/* ── left column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Identidade */}
          <Panel title="Identidade">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <FField label="Nome" span={2}>
                <input
                  className={forgeInputCls}
                  value={m.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </FField>

              <FField label="Classe">
                <select
                  className={forgeInputCls}
                  value={m.class}
                  onChange={(e) => set("class", e.target.value)}
                >
                  {CLASS_LIST.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </FField>

              <FField label="Tier">
                <select
                  className={forgeInputCls}
                  value={m.tier}
                  onChange={(e) => set("tier", e.target.value)}
                >
                  {TIER_LIST.map((tt) => (
                    <option key={tt} value={tt}>
                      {tt}
                    </option>
                  ))}
                </select>
              </FField>

              <FField label="Arquétipo">
                <input
                  className={forgeInputCls}
                  value={m.archetype}
                  onChange={(e) => set("archetype", e.target.value)}
                  placeholder="Chain Lightning · 3 Elem"
                />
              </FField>

              <FField label="Patch">
                <input
                  className={forgeInputCls}
                  value={m.patch}
                  onChange={(e) => set("patch", e.target.value)}
                  placeholder="3.1.2"
                />
              </FField>

              <FField label="Uso (0–1)">
                <input
                  className={forgeInputCls}
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={m.pop}
                  onChange={(e) => set("pop", e.target.value)}
                />
              </FField>

              <FField label="Pit clear">
                <input
                  className={forgeInputCls}
                  type="number"
                  min={0}
                  value={m.pit}
                  onChange={(e) => set("pit", e.target.value)}
                />
              </FField>

              <FField label="Objetivo" span={2}>
                <input
                  className={forgeInputCls}
                  value={m.objective}
                  onChange={(e) => set("objective", e.target.value)}
                  placeholder="Pit Pushing · Boss"
                />
              </FField>

              <FField label="Tags (vírgula)" span={2}>
                <input
                  className={forgeInputCls}
                  value={m.tags}
                  onChange={(e) => set("tags", e.target.value)}
                  placeholder="Pit, Boss, Speedfarm"
                />
              </FField>

              <FField label="Descrição" span={2}>
                <textarea
                  className={forgeInputCls}
                  value={m.blurb}
                  onChange={(e) => set("blurb", e.target.value)}
                  rows={3}
                  style={{ resize: "vertical", lineHeight: 1.5 }}
                  placeholder="O que torna a build forte e como ela escala…"
                />
              </FField>
            </div>
          </Panel>

          {/* Skill bar */}
          <Panel
            title="Skill bar"
            right={
              <button
                onClick={() =>
                  setSkills([
                    ...skills,
                    { name: "", element: "", ranks: 1, role: "", key: false },
                  ])
                }
                style={ghostBtnForge("var(--accent)")}
              >
                + Skill
              </button>
            }
          >
            {skills.length === 0 && (
              <p className="m-0 font-ui text-[12px] text-faint">
                Nenhuma skill ainda.
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {skills.map((s, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 7, alignItems: "center" }}
                >
                  <input
                    className={forgeInputCls}
                    value={s.name}
                    placeholder="Skill"
                    onChange={(e) =>
                      updRow(skills, setSkills, i, "name", e.target.value)
                    }
                    style={{ flex: 2 }}
                  />
                  <input
                    className={forgeInputCls}
                    value={s.element}
                    placeholder="Elemento"
                    onChange={(e) =>
                      updRow(skills, setSkills, i, "element", e.target.value)
                    }
                    style={{ flex: 1 }}
                  />
                  <input
                    className={forgeInputCls}
                    type="number"
                    min={1}
                    max={5}
                    value={s.ranks}
                    onChange={(e) =>
                      updRow(
                        skills,
                        setSkills,
                        i,
                        "ranks",
                        Math.max(1, Math.min(5, +e.target.value || 1))
                      )
                    }
                    style={{ width: 56, flex: "0 0 auto" }}
                  />
                  <input
                    className={forgeInputCls}
                    value={s.role}
                    placeholder="Papel"
                    onChange={(e) =>
                      updRow(skills, setSkills, i, "role", e.target.value)
                    }
                    style={{ flex: 2 }}
                  />
                  <button
                    title="Skill-chave"
                    onClick={() =>
                      updRow(skills, setSkills, i, "key", !s.key)
                    }
                    style={{
                      ...ghostBtnForge(s.key ? "var(--accent)" : null),
                      padding: "6px 9px",
                    }}
                  >
                    ★
                  </button>
                  <button
                    title="Remover"
                    onClick={() => rmRow(skills, setSkills, i)}
                    style={{
                      ...ghostBtnForge("var(--ember)"),
                      padding: "6px 9px",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </Panel>

          {/* Gear & Aspects */}
          <Panel
            title="Gear & Aspects"
            right={
              <button
                onClick={() =>
                  setGear([
                    ...gear,
                    { slot: "", item: "", type: "Aspect", affixes: "" },
                  ])
                }
                style={ghostBtnForge("var(--accent)")}
              >
                + Item
              </button>
            }
          >
            {gear.length === 0 && (
              <p className="m-0 font-ui text-[12px] text-faint">
                Nenhum item ainda.
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {gear.map((g, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 7, alignItems: "center" }}
                >
                  <input
                    className={forgeInputCls}
                    value={g.slot}
                    placeholder="Slot"
                    onChange={(e) =>
                      updRow(gear, setGear, i, "slot", e.target.value)
                    }
                    style={{ flex: 1 }}
                  />
                  <input
                    className={forgeInputCls}
                    value={g.item}
                    placeholder="Item"
                    onChange={(e) =>
                      updRow(gear, setGear, i, "item", e.target.value)
                    }
                    style={{ flex: 2 }}
                  />
                  <select
                    className={forgeInputCls}
                    value={g.type}
                    onChange={(e) =>
                      updRow(gear, setGear, i, "type", e.target.value)
                    }
                    style={{ flex: "0 0 auto", width: 110 }}
                  >
                    {GEAR_TYPES.map((tp) => (
                      <option key={tp} value={tp}>
                        {tp}
                      </option>
                    ))}
                  </select>
                  <input
                    className={forgeInputCls}
                    value={g.affixes}
                    placeholder="Affixes"
                    onChange={(e) =>
                      updRow(gear, setGear, i, "affixes", e.target.value)
                    }
                    style={{ flex: 2 }}
                  />
                  <button
                    title="Remover"
                    onClick={() => rmRow(gear, setGear, i)}
                    style={{
                      ...ghostBtnForge("var(--ember)"),
                      padding: "6px 9px",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </Panel>

          {/* Sources */}
          <Panel
            title="Fontes"
            right={
              <button
                onClick={() =>
                  setSources([
                    ...sources,
                    { site: "", tier: "S", date: "", url: "" },
                  ])
                }
                style={ghostBtnForge("var(--accent)")}
              >
                + Fonte
              </button>
            }
          >
            {sources.length === 0 && (
              <p className="m-0 font-ui text-[12px] text-faint">
                Nenhuma fonte ainda.
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sources.map((src, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 7, alignItems: "center" }}
                >
                  <input
                    className={forgeInputCls}
                    value={src.site}
                    placeholder="Site"
                    onChange={(e) =>
                      updRow(sources, setSources, i, "site", e.target.value)
                    }
                    style={{ flex: 2 }}
                  />
                  <input
                    className={forgeInputCls}
                    value={src.tier}
                    placeholder="Tier"
                    onChange={(e) =>
                      updRow(sources, setSources, i, "tier", e.target.value)
                    }
                    style={{ flex: "0 0 auto", width: 70 }}
                  />
                  <input
                    className={forgeInputCls}
                    value={src.date}
                    placeholder="Data"
                    onChange={(e) =>
                      updRow(sources, setSources, i, "date", e.target.value)
                    }
                    style={{ flex: 1 }}
                  />
                  <input
                    className={forgeInputCls}
                    value={src.url}
                    placeholder="URL"
                    onChange={(e) =>
                      updRow(sources, setSources, i, "url", e.target.value)
                    }
                    style={{ flex: 3 }}
                  />
                  <button
                    title="Remover"
                    onClick={() => rmRow(sources, setSources, i)}
                    style={{
                      ...ghostBtnForge("var(--ember)"),
                      padding: "6px 9px",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ── right column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Atributos · radar */}
          <Panel title="Atributos · radar">
            <Radar data={attributes} color={cm.color} size={240} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginTop: 14,
              }}
            >
              {attributes.map((a, i) => (
                <label key={i} style={{ display: "block" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 5,
                    }}
                  >
                    <span className="font-ui text-[12px] text-muted">
                      {a.attribute}
                    </span>
                    <span
                      className="font-num text-[13px] text-accent"
                    >
                      {a.value}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={a.value}
                    onChange={(e) => {
                      const n = attributes.slice();
                      n[i] = { ...a, value: +e.target.value };
                      setAttributes(n);
                    }}
                    style={{
                      width: "100%",
                      height: 5,
                      borderRadius: 999,
                      appearance: "none",
                      WebkitAppearance: "none",
                      cursor: "pointer",
                      background: `linear-gradient(90deg, ${cm.color} ${a.value * 10}%, var(--input) ${a.value * 10}%)`,
                      outline: "none",
                    }}
                  />
                </label>
              ))}
            </div>
          </Panel>

          {/* Perfil de combate */}
          <Panel title="Perfil de combate">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <div>
                <div
                  className="mb-1 font-ui text-[10px] uppercase tracking-[.12em] text-faint"
                >
                  DPS atual
                </div>
                <div
                  className="font-num text-[30px] font-bold leading-none text-accent"
                >
                  {fmt(dmg.expected_dps)}
                </div>
              </div>
              <button
                onClick={() => build && onLab(build)}
                disabled={isNew}
                style={{
                  ...ghostBtnForge(),
                  opacity: isNew ? 0.5 : 1,
                  cursor: isNew ? "not-allowed" : "pointer",
                }}
              >
                Abrir no Damage Lab →
              </button>
            </div>
            <p className="m-0 mt-[10px] font-ui text-[11.5px] leading-[1.5] text-faint">
              {isNew
                ? "Salve a build para ajustar o perfil de dano na calculadora ao vivo."
                : "O perfil de buckets é editado na calculadora ao vivo do Damage Lab."}
            </p>
          </Panel>

          {/* bottom action buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={onCancel}
              style={{
                fontFamily: "var(--f-ui)",
                fontSize: 13,
                cursor: "pointer",
                padding: "9px 18px",
                borderRadius: 9,
                border: "1px solid var(--line)",
                color: "var(--muted)",
                background: "transparent",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={save}
              style={{
                fontFamily: "var(--f-ui)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                padding: "9px 22px",
                borderRadius: 10,
                border: "1px solid var(--accent)",
                background: "var(--accent)",
                color: "#0c0907",
              }}
            >
              Salvar build
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
