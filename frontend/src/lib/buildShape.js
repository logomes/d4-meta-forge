// Ponte entre o Build da API (colunas planas + dict `data`) e o shape rico da UI.

export const EMPTY_COMBAT = {
  base_hit: 10000,
  hits_per_second: 3,
  crit_chance: 0.5,
  crit_damage_bonus: 1.5,
  vulnerable_uptime: 0.8,
  vulnerable_bonus: 0.2,
  overpower_chance: 0,
  overpower_bonus: 0,
  modifiers: [{ name: "+Skill dmg", bucket: "additive", value: 1 }],
};

// Coage para array — protege contra builds legadas/malformadas onde um campo
// de lista veio como string, objeto ou null (ex.: `data.sources` antigo era string).
const arr = (v) => (Array.isArray(v) ? v : []);

// API -> UI: achata class_name e espalha o dict data com defaults seguros.
export function toUI(b) {
  const d = b.data || {};
  return {
    id: b.id,
    name: b.name || "",
    class: b.class_name || "Sorcerer",
    archetype: b.archetype || "",
    tier: b.tier || "C",
    patch: b.patch || "",
    objective: b.objective || "",
    blurb: d.blurb || "",
    tags: arr(d.tags),
    pop: typeof d.pop === "number" ? d.pop : 0,
    pit: typeof d.pit === "number" ? d.pit : 0,
    skills: arr(d.skills),
    rotation: arr(d.rotation),
    gear: arr(d.gear),
    attributes: arr(d.attributes),
    combat: { ...EMPTY_COMBAT, ...(d.combat || {}) },
    sources: arr(d.sources),
  };
}

// UI -> API: remonta colunas planas + empacota o resto em data.
export function toAPI(u) {
  return {
    id: u.id,
    name: u.name,
    class_name: u.class,
    archetype: u.archetype || "",
    tier: u.tier || "C",
    patch: u.patch || "",
    objective: u.objective || "",
    data: {
      blurb: u.blurb || "",
      tags: u.tags || [],
      pop: u.pop || 0,
      pit: u.pit || 0,
      skills: u.skills || [],
      rotation: u.rotation || [],
      gear: u.gear || [],
      attributes: u.attributes || [],
      combat: u.combat || EMPTY_COMBAT,
      sources: u.sources || [],
    },
  };
}

// Build de UI vazia para o Forge "novo".
export function newBuild() {
  return {
    id: "new",
    name: "Nova Build",
    class: "Sorcerer",
    archetype: "",
    tier: "C",
    patch: "",
    objective: "",
    blurb: "",
    tags: [],
    pop: 0,
    pit: 0,
    skills: [],
    rotation: [],
    gear: [],
    attributes: [
      { attribute: "Dano", value: 5 },
      { attribute: "Sobrevivência", value: 5 },
      { attribute: "Mobilidade", value: 5 },
      { attribute: "Facilidade", value: 5 },
      { attribute: "Dep. de Gear", value: 5 },
    ],
    combat: { ...EMPTY_COMBAT },
    sources: [],
  };
}
