import { useEffect, useMemo, useRef, useState } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import { Flame, Plus, Trash2, Save, Swords, Calculator } from "lucide-react";
import { calcDamage, getCatalog, getSkills } from "../api.js";

const PALETTE = {
  gold: "#d4af37", fire: "#c0461f", text: "#e7dccd", muted: "#9c8a76",
  panel: "#17120f", border: "#2a201a", line: "#3a2c22", inputBg: "#120d0a",
};
const TIERS = ["S", "A", "B", "C", "D"];
const CLASSES = ["Sorcerer", "Barbarian", "Druid", "Necromancer", "Rogue", "Spiritborn"];
// Common D4 damage buckets. Same-bucket modifiers add; different buckets multiply.
const BUCKET_HINTS = [
  "additive", "multiplicative", "tal_rasha", "constellation",
  "vulnerable", "crit", "core", "ultimate", "lucky_hit",
];

const num = (v, fallback = 0) => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

const fmt = (n) =>
  n >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : n.toFixed(1);

function Section({ icon: Icon, title, children, right }) {
  return (
    <section className="rounded-lg p-4" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.border}` }}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold tracking-wide" style={{ color: PALETTE.gold }}>
          {Icon && <Icon size={15} color={PALETTE.fire} />} {title}
        </h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wide" style={{ color: PALETTE.muted }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%", background: PALETTE.inputBg, color: PALETTE.text,
  border: `1px solid ${PALETTE.line}`, borderRadius: 6, padding: "6px 8px", fontSize: 13,
};

function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}

function NumberInput(props) {
  return <input type="number" {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}

function ghostBtn(color = PALETTE.muted) {
  return {
    display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12,
    color, background: "transparent", border: `1px solid ${PALETTE.line}`,
    borderRadius: 6, padding: "4px 8px", cursor: "pointer",
  };
}

export default function BuildForge({ build, onSave }) {
  const [meta, setMeta] = useState(() => ({
    name: build?.name || "Nova Build",
    class_name: build?.class_name || CLASSES[0],
    archetype: build?.archetype || "",
    tier: build?.tier || "B",
    patch: build?.patch || "",
    objective: build?.objective || "",
  }));
  const [data, setData] = useState(() => ({
    skills: build?.data?.skills || [],
    gear: build?.data?.gear || [],
    attributes: build?.data?.attributes || [
      { attribute: "Damage", value: 5 },
      { attribute: "Survivability", value: 5 },
      { attribute: "Mobility", value: 5 },
      { attribute: "Ease of Play", value: 5 },
      { attribute: "Gear Dependency", value: 5 },
    ],
    combat: build?.data?.combat || {
      base_hit: 10000, hits_per_second: 3,
      crit_chance: 0.5, crit_damage_bonus: 1.5,
      vulnerable_uptime: 0.8, vulnerable_bonus: 0.2,
      overpower_chance: 0, overpower_bonus: 0,
      modifiers: [{ name: "+Skill dmg", bucket: "additive", value: 1.0 }],
    },
  }));
  const [result, setResult] = useState(null);
  const [calcError, setCalcError] = useState("");
  const [saving, setSaving] = useState(false);

  const setCombat = (patch) => setData((d) => ({ ...d, combat: { ...d.combat, ...patch } }));
  const setModifiers = (mods) => setData((d) => ({ ...d, combat: { ...d.combat, modifiers: mods } }));

  const profile = useMemo(() => {
    const c = data.combat;
    return {
      base_hit: num(c.base_hit),
      hits_per_second: num(c.hits_per_second, 1),
      crit_chance: num(c.crit_chance),
      crit_damage_bonus: num(c.crit_damage_bonus),
      vulnerable_uptime: num(c.vulnerable_uptime),
      vulnerable_bonus: num(c.vulnerable_bonus),
      overpower_chance: num(c.overpower_chance),
      overpower_bonus: num(c.overpower_bonus),
      skill_id: c.skill_id || null,
      skill_rank: num(c.skill_rank, 1),
      weapon_damage: c.weapon_damage ? num(c.weapon_damage) : null,
      modifiers: (c.modifiers || []).map((m) => ({
        name: m.name || "", bucket: m.bucket || "additive", value: num(m.value),
      })),
    };
  }, [data.combat]);

  // Live damage: debounce calls to the backend engine whenever the profile changes.
  const timer = useRef(null);
  useEffect(() => {
    const resolvable = profile.skill_id && profile.weapon_damage > 0;
    if (profile.base_hit <= 0 && !resolvable) {
      setResult(null);
      setCalcError("Informe base hit > 0, ou selecione uma skill + dano de arma.");
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      calcDamage(profile)
        .then((r) => { setResult(r); setCalcError(""); })
        .catch((e) => { setCalcError(e.message); });
    }, 300);
    return () => clearTimeout(timer.current);
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ ...build, ...meta, data });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <Section icon={Flame} title="BUILD" right={
          <button onClick={handleSave} disabled={saving} style={{ ...ghostBtn(PALETTE.gold), borderColor: PALETTE.gold }}>
            <Save size={13} /> {saving ? "Salvando..." : "Salvar"}
          </button>
        }>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Field label="Nome"><TextInput value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} /></Field></div>
            <Field label="Classe">
              <select value={meta.class_name} onChange={(e) => setMeta({ ...meta, class_name: e.target.value })} style={inputStyle}>
                {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Tier">
              <select value={meta.tier} onChange={(e) => setMeta({ ...meta, tier: e.target.value })} style={inputStyle}>
                {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Arquétipo"><TextInput value={meta.archetype} onChange={(e) => setMeta({ ...meta, archetype: e.target.value })} /></Field>
            <Field label="Patch"><TextInput value={meta.patch} onChange={(e) => setMeta({ ...meta, patch: e.target.value })} placeholder="3.0.3" /></Field>
            <div className="col-span-2"><Field label="Objetivo"><TextInput value={meta.objective} onChange={(e) => setMeta({ ...meta, objective: e.target.value })} placeholder="Pit Pushing · Boss" /></Field></div>
          </div>
        </Section>

        <ListEditor
          icon={Swords} title="SKILLS" items={data.skills}
          onChange={(skills) => setData((d) => ({ ...d, skills }))}
          blank={{ name: "", element: "", ranks: 1, role: "" }}
          columns={[
            { key: "name", label: "Skill", flex: 2 },
            { key: "element", label: "Elemento", flex: 1 },
            { key: "ranks", label: "Ranks", flex: 1, type: "number" },
            { key: "role", label: "Papel", flex: 2 },
          ]}
        />

        <ListEditor
          icon={Plus} title="GEAR" items={data.gear}
          onChange={(gear) => setData((d) => ({ ...d, gear }))}
          blank={{ slot: "", item: "", type: "aspect", affixes: "" }}
          columns={[
            { key: "slot", label: "Slot", flex: 1 },
            { key: "item", label: "Item", flex: 2 },
            { key: "type", label: "Tipo", flex: 1 },
            { key: "affixes", label: "Affixes", flex: 2 },
          ]}
        />

        <Section title="ATRIBUTOS (radar)">
          <div className="grid grid-cols-2 gap-3">
            {data.attributes.map((a, i) => (
              <Field key={i} label={a.attribute}>
                <NumberInput min={0} max={10} value={a.value} onChange={(e) => {
                  const attrs = [...data.attributes];
                  attrs[i] = { ...a, value: num(e.target.value) };
                  setData((d) => ({ ...d, attributes: attrs }));
                }} />
              </Field>
            ))}
          </div>
          <div className="mt-3 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data.attributes} outerRadius="72%">
                <PolarGrid stroke={PALETTE.line} />
                <PolarAngleAxis dataKey="attribute" tick={{ fill: PALETTE.muted, fontSize: 9 }} />
                <Radar dataKey="value" stroke={PALETTE.fire} fill={PALETTE.fire} fillOpacity={0.45} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      <div className="space-y-4">
        <DamageLab combat={data.combat} setCombat={setCombat} setModifiers={setModifiers}
          result={result} error={calcError} />
      </div>
    </div>
  );
}

function ListEditor({ icon, title, items, onChange, columns, blank }) {
  const update = (i, key, value) => {
    const next = [...items];
    next[i] = { ...next[i], [key]: value };
    onChange(next);
  };
  return (
    <Section icon={icon} title={title} right={
      <button onClick={() => onChange([...items, { ...blank }])} style={ghostBtn()}>
        <Plus size={13} /> Adicionar
      </button>
    }>
      {items.length === 0 && <p className="text-xs" style={{ color: PALETTE.muted }}>Nenhum item ainda.</p>}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            {columns.map((col) => (
              <input key={col.key} placeholder={col.label} type={col.type || "text"}
                value={item[col.key] ?? ""}
                onChange={(e) => update(i, col.key, col.type === "number" ? num(e.target.value) : e.target.value)}
                style={{ ...inputStyle, flex: col.flex }} />
            ))}
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} style={ghostBtn(PALETTE.fire)} title="Remover">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </Section>
  );
}

function DamageLab({ combat, setCombat, setModifiers, result, error }) {
  const mods = combat.modifiers || [];
  const [catalog, setCatalog] = useState({ damage_sources: [] });
  const [skillCat, setSkillCat] = useState({ patch: "", skills: [] });
  useEffect(() => { getCatalog().then(setCatalog).catch(() => {}); }, []);
  useEffect(() => { getSkills().then(setSkillCat).catch(() => {}); }, []);

  const skillsByClass = useMemo(() => {
    const map = {};
    for (const s of skillCat.skills) (map[s.class_name] ||= []).push(s);
    return map;
  }, [skillCat.skills]);
  const selectedSkill = useMemo(
    () => skillCat.skills.find((s) => s.id === combat.skill_id) ?? null,
    [skillCat.skills, combat.skill_id],
  );

  const updateMod = (i, key, value) => {
    const next = [...mods];
    next[i] = { ...next[i], [key]: value };
    setModifiers(next);
  };
  const addSource = (id) => {
    const src = catalog.damage_sources.find((s) => s.id === id);
    if (src) setModifiers([...mods, { name: src.label, bucket: src.bucket, value: src.default_value }]);
  };

  const groups = {};
  for (const s of catalog.damage_sources) (groups[s.group] ||= []).push(s);
  const buckets = catalog.damage_sources.length
    ? [...new Set(catalog.damage_sources.map((s) => s.bucket))]
    : BUCKET_HINTS;

  const pctFields = [
    ["crit_chance", "Crit chance (0-1)"],
    ["crit_damage_bonus", "Crit dmg bônus (0.5 = +50%)"],
    ["vulnerable_uptime", "Vulnerable uptime (0-1)"],
    ["vulnerable_bonus", "Vulnerable bônus"],
    ["overpower_chance", "Overpower chance (0-1)"],
    ["overpower_bonus", "Overpower bônus"],
  ];

  return (
    <Section icon={Calculator} title="CALCULADORA DE DANO (ao vivo)">
      {skillCat.skills.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-3">
          <div className="col-span-3">
            <Field label={`Skill (coef real${skillCat.patch ? ` · patch ${skillCat.patch}` : ""})`}>
              <select value={combat.skill_id || ""}
                onChange={(e) => setCombat({ skill_id: e.target.value || null })} style={inputStyle}>
                <option value="">— manual (sem coeficiente) —</option>
                {Object.entries(skillsByClass).map(([cls, list]) => (
                  <optgroup key={cls} label={cls}>
                    {list.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Dano da arma">
            <NumberInput value={combat.weapon_damage ?? ""} placeholder="ex: 4000"
              onChange={(e) => setCombat({ weapon_damage: e.target.value })} />
          </Field>
          <Field label="Rank da skill">
            <NumberInput min={1} max={selectedSkill?.ranks || 5} value={combat.skill_rank ?? 1}
              onChange={(e) => setCombat({ skill_rank: num(e.target.value, 1) })} />
          </Field>
          {selectedSkill && (
            <div className="self-end text-[11px]" style={{ color: PALETTE.muted }}>
              fonte: {selectedSkill.source || "—"} · conf: {selectedSkill.confidence}
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label={selectedSkill && combat.weapon_damage ? "Base hit (calculado)" : "Base hit"}>
          <NumberInput value={result?.resolved ? result.base_hit : (selectedSkill && combat.weapon_damage ? "" : combat.base_hit)}
            disabled={!!(selectedSkill && combat.weapon_damage)}
            onChange={(e) => setCombat({ base_hit: e.target.value })} />
        </Field>
        <Field label="Hits / segundo"><NumberInput value={combat.hits_per_second} onChange={(e) => setCombat({ hits_per_second: e.target.value })} /></Field>
        {pctFields.map(([key, label]) => (
          <Field key={key} label={label}>
            <NumberInput step="0.05" value={combat[key]} onChange={(e) => setCombat({ [key]: e.target.value })} />
          </Field>
        ))}
      </div>

      <div className="mt-4 mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-bold tracking-wide" style={{ color: PALETTE.muted }}>MODIFIERS (mesmo bucket soma · buckets multiplicam)</span>
        <button onClick={() => setModifiers([...mods, { name: "", bucket: "additive", value: 0.1 }])} style={ghostBtn()}>
          <Plus size={13} /> Modifier
        </button>
      </div>
      {Object.keys(groups).length > 0 && (
        <div className="mb-2">
          <select defaultValue="" onChange={(e) => { addSource(e.target.value); e.target.value = ""; }} style={inputStyle}>
            <option value="" disabled>+ Adicionar fonte conhecida…</option>
            {Object.entries(groups).map(([group, list]) => (
              <optgroup key={group} label={group}>
                {list.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
      )}
      <datalist id="bucket-hints">{buckets.map((b) => <option key={b} value={b} />)}</datalist>
      <div className="space-y-2">
        {mods.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <input placeholder="Nome" value={m.name ?? ""} onChange={(e) => updateMod(i, "name", e.target.value)} style={{ ...inputStyle, flex: 2 }} />
            <input placeholder="bucket" list="bucket-hints" value={m.bucket ?? ""} onChange={(e) => updateMod(i, "bucket", e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <input type="number" step="0.05" placeholder="0.30" value={m.value ?? ""} onChange={(e) => updateMod(i, "value", num(e.target.value))} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={() => setModifiers(mods.filter((_, j) => j !== i))} style={ghostBtn(PALETTE.fire)} title="Remover">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-xs" style={{ color: "#e08a7a" }}>{error}</p>}
      {result && (
        <div className="mt-4 rounded-lg p-4" style={{ background: PALETTE.inputBg, border: `1px solid ${PALETTE.line}` }}>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide" style={{ color: PALETTE.muted }}>DPS esperado</p>
              <p className="text-3xl font-black" style={{ color: PALETTE.gold }}>{fmt(result.expected_dps)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide" style={{ color: PALETTE.muted }}>Hit esperado</p>
              <p className="text-xl font-bold" style={{ color: PALETTE.text }}>{fmt(result.expected_hit)}</p>
            </div>
          </div>
          {result.resolved && (
            <p className="mt-2 text-[11px]" style={{ color: PALETTE.muted }}>
              base = {fmt(result.resolved.weapon_damage)} (arma) × {result.resolved.coefficient.toFixed(2)} (coef rank {result.resolved.rank})
              {" · "}fonte: {result.resolved.source} · patch {result.resolved.patch} · conf {result.resolved.confidence}
            </p>
          )}
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <Multiplier label="Crit" value={result.crit_multiplier} />
            <Multiplier label="Vulnerable" value={result.vulnerable_multiplier} />
            <Multiplier label="Overpower" value={result.overpower_multiplier} />
          </div>
          {result.buckets.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-[11px] uppercase tracking-wide" style={{ color: PALETTE.muted }}>Buckets</p>
              <div className="space-y-1">
                {result.buckets.map((b) => (
                  <div key={b.bucket} className="flex justify-between text-xs" style={{ color: PALETTE.text }}>
                    <span>{b.bucket} <span style={{ color: PALETTE.muted }}>(+{(b.additive_sum * 100).toFixed(0)}%)</span></span>
                    <span style={{ color: PALETTE.gold }}>×{b.multiplier.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

function Multiplier({ label, value }) {
  return (
    <div className="rounded p-2" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.line}` }}>
      <p style={{ color: PALETTE.muted }}>{label}</p>
      <p className="font-bold" style={{ color: PALETTE.fire }}>×{value.toFixed(2)}</p>
    </div>
  );
}
