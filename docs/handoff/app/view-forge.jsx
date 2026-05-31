/* Forge — build editor (identity · skills · gear · attributes + live radar).
   Mirrors the repo's BuildForge in the Meta Forge design language. */
const { useState: useStateForge, useMemo: useMemoForge } = React;

const CLASS_LIST = ["Sorcerer", "Barbarian", "Druid", "Necromancer", "Rogue", "Spiritborn"];
const TIER_LIST = ["S", "A", "B", "C", "D"];
const GEAR_TYPES = ["Aspect", "Unique", "Legendary", "Tempering"];

function fInput(props) {
  return <input {...props} style={{ ...forgeInputStyle, ...(props.style || {}) }} />;
}
const forgeInputStyle = {
  width: "100%", fontFamily: "var(--f-ui)", fontSize: 13, color: "var(--text)", background: "var(--input)",
  border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", outline: "none",
};
function FField({ label, children, span }) {
  return (
    <label style={{ display: "block", gridColumn: span ? `span ${span}` : "auto" }}>
      <span style={{ display: "block", fontFamily: "var(--f-ui)", fontSize: 10, textTransform: "uppercase",
        letterSpacing: ".1em", color: "var(--faint)", marginBottom: 5 }}>{label}</span>
      {children}
    </label>
  );
}
function ghostBtnForge(color) {
  return { display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--f-ui)", fontSize: 12, cursor: "pointer",
    padding: "6px 11px", borderRadius: 8, border: `1px solid ${color ? "var(--accent-dim)" : "var(--line)"}`,
    color: color || "var(--muted)", background: color ? "var(--accent-wash)" : "transparent" };
}

function Forge({ build, onSave, onCancel, onLab }) {
  const isNew = !build || build.id === "__new__";
  const [m, setM] = useStateForge(() => ({
    id: build?.id || "__new__",
    name: build?.name || "Nova Build",
    class: build?.class || "Sorcerer",
    tier: build?.tier || "C",
    archetype: build?.archetype || "",
    patch: build?.patch || window.D4.patch.current,
    objective: build?.objective || "",
    blurb: build?.blurb || "",
    valid: build?.valid ?? true,
  }));
  const [skills, setSkills] = useStateForge(() => structuredClone(build?.skills || []));
  const [gear, setGear] = useStateForge(() => structuredClone(build?.gear || []));
  const [attributes, setAttributes] = useStateForge(() => structuredClone(build?.attributes || [
    { attribute: "Dano", value: 5 }, { attribute: "Sobrevivência", value: 5 }, { attribute: "Mobilidade", value: 5 },
    { attribute: "Facilidade", value: 5 }, { attribute: "Dep. de Gear", value: 5 },
  ]));

  const cm = window.D4.classes[m.class];
  const dmg = useMemoForge(() => calcDamage(build?.combat || { base_hit: 10000, hits_per_second: 3, crit_chance: 0.5,
    crit_damage_bonus: 1.5, vulnerable_uptime: 0.8, vulnerable_bonus: 0.2, modifiers: [{ name: "+Skill dmg", bucket: "additive", value: 1 }] }), [build]);

  const set = (k, v) => setM((s) => ({ ...s, [k]: v }));
  const updRow = (list, setList, i, k, v) => { const n = list.slice(); n[i] = { ...n[i], [k]: v }; setList(n); };
  const rmRow = (list, setList, i) => setList(list.filter((_, j) => j !== i));

  const save = () => {
    onSave({
      ...(build || {}),
      ...m,
      sources: build?.sources || [],
      tags: build?.tags || [],
      pop: build?.pop ?? 0.05, pit: build?.pit ?? 100,
      rotation: build?.rotation || [],
      combat: build?.combat || { base_hit: 10000, hits_per_second: 3, crit_chance: 0.5, crit_damage_bonus: 1.5,
        vulnerable_uptime: 0.8, vulnerable_bonus: 0.2, modifiers: [{ name: "+Skill dmg", bucket: "additive", value: 1 }] },
      skills, gear, attributes,
    });
  };

  return (
    <div>
      <button onClick={onCancel} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "transparent",
        border: "none", color: "var(--muted)", fontFamily: "var(--f-ui)", fontSize: 13, cursor: "pointer", marginBottom: 18, padding: 0 }}>← Cancelar</button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Glyph cls={m.class} size={52} />
          <div>
            <div style={{ fontFamily: "var(--f-ui)", fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: "var(--accent)" }}>
              {isNew ? "Nova build · FORGE" : "Editando · FORGE"}
            </div>
            <h1 style={{ fontFamily: "var(--f-display)", fontSize: 32, fontWeight: 700, color: "var(--text)", margin: "4px 0 0", lineHeight: 1 }}>{m.name || "Sem nome"}</h1>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <TierPlate tier={m.tier} size={52} />
          <button onClick={save} style={{ fontFamily: "var(--f-ui)", fontSize: 14, fontWeight: 600, cursor: "pointer",
            padding: "0 22px", borderRadius: 10, border: "1px solid var(--accent)", background: "var(--accent)", color: "#0c0907" }}>
            Salvar build
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, alignItems: "start" }} className="detail-grid">
        {/* left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel title="Identidade">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FField label="Nome" span={2}>{fInput({ value: m.name, onChange: (e) => set("name", e.target.value) })}</FField>
              <FField label="Classe">
                <select value={m.class} onChange={(e) => set("class", e.target.value)} style={forgeInputStyle}>
                  {CLASS_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </FField>
              <FField label="Tier">
                <select value={m.tier} onChange={(e) => set("tier", e.target.value)} style={forgeInputStyle}>
                  {TIER_LIST.map((tt) => <option key={tt} value={tt}>{tt}</option>)}
                </select>
              </FField>
              <FField label="Arquétipo">{fInput({ value: m.archetype, onChange: (e) => set("archetype", e.target.value), placeholder: "Chain Lightning · 3 Elem" })}</FField>
              <FField label="Patch">{fInput({ value: m.patch, onChange: (e) => set("patch", e.target.value), placeholder: "3.1.2" })}</FField>
              <FField label="Objetivo" span={2}>{fInput({ value: m.objective, onChange: (e) => set("objective", e.target.value), placeholder: "Pit Pushing · Boss" })}</FField>
              <FField label="Descrição" span={2}>
                <textarea value={m.blurb} onChange={(e) => set("blurb", e.target.value)} rows={3}
                  style={{ ...forgeInputStyle, resize: "vertical", lineHeight: 1.5 }} placeholder="O que torna a build forte e como ela escala…" />
              </FField>
            </div>
          </Panel>

          <Panel title="Skill bar" right={
            <button onClick={() => setSkills([...skills, { name: "", element: "", ranks: 1, role: "", key: false }])} style={ghostBtnForge("var(--accent)")}>+ Skill</button>
          }>
            {skills.length === 0 && <p style={{ color: "var(--faint)", fontFamily: "var(--f-ui)", fontSize: 12, margin: 0 }}>Nenhuma skill ainda.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {skills.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 7, alignItems: "center" }}>
                  {fInput({ value: s.name, placeholder: "Skill", onChange: (e) => updRow(skills, setSkills, i, "name", e.target.value), style: { flex: 2 } })}
                  {fInput({ value: s.element, placeholder: "Elemento", onChange: (e) => updRow(skills, setSkills, i, "element", e.target.value), style: { flex: 1 } })}
                  {fInput({ type: "number", min: 1, max: 5, value: s.ranks, onChange: (e) => updRow(skills, setSkills, i, "ranks", Math.max(1, Math.min(5, +e.target.value || 1))), style: { width: 56, flex: "0 0 auto" } })}
                  {fInput({ value: s.role, placeholder: "Papel", onChange: (e) => updRow(skills, setSkills, i, "role", e.target.value), style: { flex: 2 } })}
                  <button title="Skill-chave" onClick={() => updRow(skills, setSkills, i, "key", !s.key)}
                    style={{ ...ghostBtnForge(s.key ? "var(--accent)" : null), padding: "6px 9px" }}>★</button>
                  <button title="Remover" onClick={() => rmRow(skills, setSkills, i)} style={{ ...ghostBtnForge("var(--ember)"), padding: "6px 9px" }}>✕</button>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Gear & Aspects" right={
            <button onClick={() => setGear([...gear, { slot: "", item: "", type: "Aspect", affixes: "" }])} style={ghostBtnForge("var(--accent)")}>+ Item</button>
          }>
            {gear.length === 0 && <p style={{ color: "var(--faint)", fontFamily: "var(--f-ui)", fontSize: 12, margin: 0 }}>Nenhum item ainda.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {gear.map((g, i) => (
                <div key={i} style={{ display: "flex", gap: 7, alignItems: "center" }}>
                  {fInput({ value: g.slot, placeholder: "Slot", onChange: (e) => updRow(gear, setGear, i, "slot", e.target.value), style: { flex: 1 } })}
                  {fInput({ value: g.item, placeholder: "Item", onChange: (e) => updRow(gear, setGear, i, "item", e.target.value), style: { flex: 2 } })}
                  <select value={g.type} onChange={(e) => updRow(gear, setGear, i, "type", e.target.value)} style={{ ...forgeInputStyle, flex: "0 0 auto", width: 110 }}>
                    {GEAR_TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
                  </select>
                  {fInput({ value: g.affixes, placeholder: "Affixes", onChange: (e) => updRow(gear, setGear, i, "affixes", e.target.value), style: { flex: 2 } })}
                  <button title="Remover" onClick={() => rmRow(gear, setGear, i)} style={{ ...ghostBtnForge("var(--ember)"), padding: "6px 9px" }}>✕</button>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* right */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel title="Atributos · radar">
            <Radar data={attributes} color={cm.color} size={240} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
              {attributes.map((a, i) => (
                <label key={i} style={{ display: "block" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontFamily: "var(--f-ui)", fontSize: 12, color: "var(--muted)" }}>{a.attribute}</span>
                    <span style={{ fontFamily: "var(--f-num)", fontSize: 13, color: "var(--accent)" }}>{a.value}</span>
                  </div>
                  <input type="range" min={0} max={10} step={1} value={a.value}
                    onChange={(e) => { const n = attributes.slice(); n[i] = { ...a, value: +e.target.value }; setAttributes(n); }}
                    style={{ width: "100%", height: 5, borderRadius: 999, appearance: "none", WebkitAppearance: "none", cursor: "pointer",
                      background: `linear-gradient(90deg, var(--accent) ${a.value * 10}%, var(--input) ${a.value * 10}%)`, outline: "none" }} />
                </label>
              ))}
            </div>
          </Panel>

          <Panel title="Perfil de combate">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--faint)", fontFamily: "var(--f-ui)", marginBottom: 4 }}>DPS atual</div>
                <div style={{ fontFamily: "var(--f-num)", fontSize: 30, fontWeight: 700, color: "var(--accent)", lineHeight: 1 }}>{fmt(dmg.expected_dps)}</div>
              </div>
              <button onClick={() => build && onLab(build)} disabled={isNew}
                style={{ ...ghostBtnForge(), opacity: isNew ? 0.5 : 1, cursor: isNew ? "not-allowed" : "pointer" }}>
                Abrir no Damage Lab →
              </button>
            </div>
            <p style={{ margin: "10px 0 0", fontFamily: "var(--f-ui)", fontSize: 11.5, color: "var(--faint)", lineHeight: 1.5 }}>
              {isNew ? "Salve a build para ajustar o perfil de dano na calculadora ao vivo." : "O perfil de buckets é editado na calculadora ao vivo do Damage Lab."}
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Forge });
