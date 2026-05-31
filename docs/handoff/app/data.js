/* D4 Meta Forge — illustrative content.
   Build names use descriptive skill/item terms (Blizzard game data); layouts & copy are original.
   "Sources" are reference link-outs only (name · tier · date · url) — never rehosted content. */
(function () {
  const CLASSES = {
    Sorcerer:    { color: "#5ab4e8", short: "Sorc",  rune: "\u16C1" },
    Barbarian:   { color: "#d0593a", short: "Barb",  rune: "\u16A2" },
    Druid:       { color: "#7fb653", short: "Druid", rune: "\u16B7" },
    Necromancer: { color: "#a98fe0", short: "Necro", rune: "\u16CF" },
    Rogue:       { color: "#34c79a", short: "Rogue", rune: "\u16B9" },
    Spiritborn:  { color: "#e0a93a", short: "SB",    rune: "\u16D2" },
  };

  const TIERS = {
    S: { color: "#e8c860", label: "Meta-defining" },
    A: { color: "#e2622e", label: "Excelente" },
    B: { color: "#5aa6dc", label: "Sólida" },
    C: { color: "#8a9296", label: "Situacional" },
    D: { color: "#6a6258", label: "Off-meta" },
  };

  // ---- builds (1–2 per class across tiers) ----
  const builds = [
    {
      id: "sb-quill-eagle",
      name: "Quill Volley Eagle",
      class: "Spiritborn", archetype: "Quill Volley · Eagle", tier: "S",
      objective: "Pit Pushing", tags: ["Pit", "Speedfarm", "Endgame"],
      patch: "3.1.2", valid: true, pop: 0.31, pit: 152,
      blurb: "Pênas teleguiadas com uptime de Vulnerable absurdo. Escala em buckets de Lucky Hit e mantém Pit clear próximo do topo da temporada.",
      skills: [
        { name: "Quill Volley", element: "Physical", ranks: 5, role: "Core", key: true },
        { name: "The Hunter", element: "Physical", ranks: 1, role: "Ultimate" },
        { name: "Counterattack", element: "Physical", ranks: 1, role: "Defensiva" },
        { name: "Armored Hide", element: "—", ranks: 1, role: "Barreira" },
        { name: "Vortex", element: "—", ranks: 3, role: "Agrupamento" },
        { name: "Toxic Skin", element: "Poison", ranks: 3, role: "DoT" },
      ],
      rotation: ["Vortex p/ agrupar", "The Hunter", "Spam Quill Volley", "Armored Hide on-cooldown"],
      gear: [
        { slot: "Arma", item: "Rod of Kepeleke", type: "Unique", affixes: "Quill Volley consome todos os recursos" },
        { slot: "Peito", item: "Aspect of the Bounding Conduit", type: "Aspect", affixes: "+Move speed pós-Evade" },
        { slot: "Anel", item: "Band of First Breath", type: "Unique", affixes: "Resolve gera dano" },
        { slot: "Amuleto", item: "Aspect of Noxious Ice", type: "Aspect", affixes: "Vulnerable em frio" },
      ],
      attributes: [
        { attribute: "Dano", value: 10 }, { attribute: "Sobrevivência", value: 6 },
        { attribute: "Mobilidade", value: 9 }, { attribute: "Facilidade", value: 7 },
        { attribute: "Dep. de Gear", value: 8 },
      ],
      combat: {
        base_hit: 14200, hits_per_second: 4.2, crit_chance: 0.62, crit_damage_bonus: 1.9,
        vulnerable_uptime: 0.95, vulnerable_bonus: 0.2,
        modifiers: [
          { name: "Quill Volley dmg", bucket: "additive", value: 1.4 },
          { name: "Lucky Hit proc", bucket: "lucky_hit", value: 0.6 },
          { name: "The Hunter window", bucket: "ultimate", value: 0.55 },
        ],
      },
      sources: [
        { site: "Maxroll", tier: "S", date: "12 mai", url: "https://maxroll.gg/d4/build-guides" },
        { site: "Icy-Veins", tier: "S", date: "09 mai", url: "https://www.icy-veins.com/d4/" },
        { site: "D4Builds", tier: "S", date: "14 mai", url: "https://d4builds.gg/" },
      ],
    },
    {
      id: "sorc-tal-rasha",
      name: "Tal Rasha Convergence",
      class: "Sorcerer", archetype: "Chain Lightning · 3 Elementos", tier: "S",
      objective: "Pit Pushing", tags: ["Pit", "Boss"],
      patch: "3.1.2", valid: true, pop: 0.24, pit: 146,
      blurb: "Cicla três elementos para manter as 4 stacks de Tal Rasha, empilhando o bucket de Convergência sobre Chain Lightning. A seed original do Forge.",
      skills: [
        { name: "Chain Lightning", element: "Shock", ranks: 5, role: "Core", key: true },
        { name: "Fireball", element: "Fire", ranks: 1, role: "Elemento" },
        { name: "Frost Nova", element: "Cold", ranks: 1, role: "Vulnerable" },
        { name: "Teleport", element: "—", ranks: 1, role: "Mobilidade" },
        { name: "Ice Armor", element: "Cold", ranks: 3, role: "Barreira" },
        { name: "Familiar", element: "Shock", ranks: 5, role: "Trigger" },
      ],
      rotation: ["Frost Nova → Vulnerable", "Fireball (stack fogo)", "Spam Chain Lightning", "Teleport reposiciona"],
      gear: [
        { slot: "Amuleto", item: "Tal Rasha's Iridescent Loop", type: "Unique", affixes: "+Dano por elemento ativo" },
        { slot: "Arma", item: "Aspect of Concentration", type: "Aspect", affixes: "Mana intacta = +dano" },
        { slot: "Luvas", item: "Aspect of Ancient Flame", type: "Aspect", affixes: "Conjuração rápida" },
        { slot: "Botas", item: "Aspect of the Tempest", type: "Aspect", affixes: "Shock encadeia +" },
      ],
      attributes: [
        { attribute: "Dano", value: 9 }, { attribute: "Sobrevivência", value: 5 },
        { attribute: "Mobilidade", value: 8 }, { attribute: "Facilidade", value: 6 },
        { attribute: "Dep. de Gear", value: 9 },
      ],
      combat: {
        base_hit: 10000, hits_per_second: 3, crit_chance: 0.6, crit_damage_bonus: 1.5,
        vulnerable_uptime: 0.9, vulnerable_bonus: 0.2,
        modifiers: [
          { name: "Tal Rasha 3 elem", bucket: "tal_rasha", value: 0.75 },
          { name: "Elemental Constellation", bucket: "constellation", value: 0.4 },
          { name: "+Fire dmg", bucket: "additive", value: 1.2 },
        ],
      },
      sources: [
        { site: "Maxroll", tier: "S", date: "11 mai", url: "https://maxroll.gg/d4/build-guides" },
        { site: "D4Builds", tier: "A", date: "10 mai", url: "https://d4builds.gg/" },
      ],
    },
    {
      id: "necro-blood-wave",
      name: "Blood Wave Tides",
      class: "Necromancer", archetype: "Blood Wave · Overpower", tier: "A",
      objective: "Boss Killing", tags: ["Boss", "Pit"],
      patch: "3.1.2", valid: true, pop: 0.18, pit: 138,
      blurb: "Ondas de sangue com chance de Overpower garantida. Burst de boss colossal, mas o ritmo de cast pune o clear de trash.",
      skills: [
        { name: "Blood Wave", element: "Shadow", ranks: 5, role: "Ultimate", key: true },
        { name: "Blood Surge", element: "Shadow", ranks: 5, role: "Core" },
        { name: "Bone Storm", element: "Physical", ranks: 1, role: "Defensiva" },
        { name: "Decrepify", element: "Shadow", ranks: 1, role: "Curse" },
        { name: "Corpse Tendrils", element: "Shadow", ranks: 3, role: "Agrupamento" },
        { name: "Blood Mist", element: "Shadow", ranks: 1, role: "Escape" },
      ],
      rotation: ["Corpse Tendrils agrupa", "Decrepify", "Blood Surge build", "Blood Wave (Overpower)"],
      gear: [
        { slot: "Arma", item: "Aspect of Swelling Curse", type: "Aspect", affixes: "Curse → +dano" },
        { slot: "Peito", item: "Aspect of Reanimation", type: "Aspect", affixes: "Overpower stacking" },
        { slot: "Anel", item: "Ring of Starless Skies", type: "Unique", affixes: "Resource spend = +dmg" },
        { slot: "Botas", item: "Aspect of the Embalmer", type: "Aspect", affixes: "Blood Orbs geram corpses" },
      ],
      attributes: [
        { attribute: "Dano", value: 8 }, { attribute: "Sobrevivência", value: 8 },
        { attribute: "Mobilidade", value: 4 }, { attribute: "Facilidade", value: 5 },
        { attribute: "Dep. de Gear", value: 7 },
      ],
      combat: {
        base_hit: 28000, hits_per_second: 0.9, crit_chance: 0.45, crit_damage_bonus: 1.6,
        vulnerable_uptime: 0.7, vulnerable_bonus: 0.2,
        modifiers: [
          { name: "Overpower bônus", bucket: "overpower", value: 1.5 },
          { name: "Blood Wave dmg", bucket: "additive", value: 1.1 },
          { name: "Curse multiplier", bucket: "curse", value: 0.35 },
        ],
      },
      sources: [
        { site: "Icy-Veins", tier: "A", date: "08 mai", url: "https://www.icy-veins.com/d4/" },
        { site: "Maxroll", tier: "A", date: "11 mai", url: "https://maxroll.gg/d4/build-guides" },
      ],
    },
    {
      id: "druid-stormclaw",
      name: "Stormclaw Werewolf",
      class: "Druid", archetype: "Shred · Lightning", tier: "A",
      objective: "Speedfarm", tags: ["Speedfarm", "Pit"],
      patch: "3.1.1", valid: false, pop: 0.14, pit: 129,
      blurb: "Werewolf melee que converte dano físico em raio. Velocidade de farm excelente — porém ainda calibrado para o patch anterior.",
      skills: [
        { name: "Shred", element: "Shock", ranks: 5, role: "Core", key: true },
        { name: "Cataclysm", element: "Shock", ranks: 1, role: "Ultimate" },
        { name: "Wolves", element: "Physical", ranks: 1, role: "Companion" },
        { name: "Storm Strike", element: "Shock", ranks: 1, role: "Builder" },
        { name: "Blood Howl", element: "—", ranks: 3, role: "Sustain" },
        { name: "Earthen Bulwark", element: "Earth", ranks: 1, role: "Barreira" },
      ],
      rotation: ["Cataclysm liga", "Blood Howl", "Shred spam", "Earthen Bulwark on-hit"],
      gear: [
        { slot: "Arma", item: "Aspect of the Rampaging Werebeast", type: "Aspect", affixes: "Shred crit window" },
        { slot: "Peito", item: "Mad Wolf's Glee", type: "Unique", affixes: "Permanente Werewolf" },
        { slot: "Botas", item: "Tempest Roar", type: "Unique", affixes: "Storm = Werewolf" },
        { slot: "Anel", item: "Aspect of Nature's Savagery", type: "Aspect", affixes: "Earth/Storm sinergia" },
      ],
      attributes: [
        { attribute: "Dano", value: 7 }, { attribute: "Sobrevivência", value: 7 },
        { attribute: "Mobilidade", value: 9 }, { attribute: "Facilidade", value: 8 },
        { attribute: "Dep. de Gear", value: 6 },
      ],
      combat: {
        base_hit: 8400, hits_per_second: 5.5, crit_chance: 0.58, crit_damage_bonus: 1.4,
        vulnerable_uptime: 0.6, vulnerable_bonus: 0.2,
        modifiers: [
          { name: "Shred dmg", bucket: "additive", value: 1.0 },
          { name: "Werewolf dmg", bucket: "werewolf", value: 0.5 },
          { name: "Lightning conversion", bucket: "elemental", value: 0.45 },
        ],
      },
      sources: [
        { site: "D4Builds", tier: "A", date: "02 mai", url: "https://d4builds.gg/" },
        { site: "Mobalytics", tier: "B", date: "29 abr", url: "https://mobalytics.gg/diablo-4" },
      ],
    },
    {
      id: "barb-bash",
      name: "Bash Earthstriker",
      class: "Barbarian", archetype: "Bash · Overpower", tier: "B",
      objective: "All-rounder", tags: ["Pit", "Boss", "Leveling"],
      patch: "3.1.2", valid: true, pop: 0.11, pit: 121,
      blurb: "O cavalo de batalha confiável. Bash carrega Overpower via Earthstriker — fácil de pilotar, teto menor que os tops da meta.",
      skills: [
        { name: "Bash", element: "Physical", ranks: 5, role: "Core", key: true },
        { name: "War Cry", element: "—", ranks: 1, role: "Buff" },
        { name: "Rallying Cry", element: "—", ranks: 1, role: "Sustain" },
        { name: "Steel Grasp", element: "Physical", ranks: 1, role: "Agrupamento" },
        { name: "Ground Stomp", element: "Physical", ranks: 3, role: "CC" },
        { name: "Wrath of the Berserker", element: "—", ranks: 1, role: "Ultimate" },
      ],
      rotation: ["Steel Grasp puxa", "War Cry + Rallying", "Wrath of the Berserker", "Bash até Overpower"],
      gear: [
        { slot: "Arma 2H", item: "Aspect of Earthstriker", type: "Aspect", affixes: "12º hit = Overpower" },
        { slot: "Peito", item: "Aspect of the Iron Warrior", type: "Aspect", affixes: "Iron Skin Unstoppable" },
        { slot: "Luvas", item: "Fists of Fate", type: "Unique", affixes: "Lucky Hit aleatório" },
        { slot: "Botas", item: "Aspect of Bul-Kathos", type: "Aspect", affixes: "Leap fissura" },
      ],
      attributes: [
        { attribute: "Dano", value: 6 }, { attribute: "Sobrevivência", value: 9 },
        { attribute: "Mobilidade", value: 5 }, { attribute: "Facilidade", value: 9 },
        { attribute: "Dep. de Gear", value: 4 },
      ],
      combat: {
        base_hit: 16000, hits_per_second: 1.8, crit_chance: 0.4, crit_damage_bonus: 1.3,
        vulnerable_uptime: 0.65, vulnerable_bonus: 0.2,
        modifiers: [
          { name: "Overpower bônus", bucket: "overpower", value: 1.2 },
          { name: "Bash dmg", bucket: "additive", value: 0.9 },
          { name: "Berserk dmg", bucket: "berserk", value: 0.3 },
        ],
      },
      sources: [
        { site: "Maxroll", tier: "B", date: "10 mai", url: "https://maxroll.gg/d4/build-guides" },
        { site: "Icy-Veins", tier: "B", date: "07 mai", url: "https://www.icy-veins.com/d4/" },
      ],
    },
    {
      id: "rogue-barrage",
      name: "Barrage Heartseeker",
      class: "Rogue", archetype: "Barrage · Ricochet", tier: "B",
      objective: "Speedfarm", tags: ["Speedfarm", "Helltides"],
      patch: "3.1.2", valid: true, pop: 0.09, pit: 118,
      blurb: "Flechas ricocheteando em Vulnerable via Heartseeker. Clear de tela instantâneo em densidade — single target depende de imbuements.",
      skills: [
        { name: "Barrage", element: "Physical", ranks: 5, role: "Core", key: true },
        { name: "Heartseeker", element: "Physical", ranks: 1, role: "Builder" },
        { name: "Shadow Imbuement", element: "Shadow", ranks: 1, role: "Imbue" },
        { name: "Dash", element: "—", ranks: 1, role: "Mobilidade" },
        { name: "Concealment", element: "—", ranks: 3, role: "Burst" },
        { name: "Rain of Arrows", element: "Physical", ranks: 1, role: "Ultimate" },
      ],
      rotation: ["Shadow Imbuement", "Concealment p/ burst", "Barrage spam", "Dash reposiciona"],
      gear: [
        { slot: "Arco", item: "Aspect of Bursting Venoms", type: "Aspect", affixes: "Imbue explode" },
        { slot: "Peito", item: "Beastfall Boots", type: "Unique", affixes: "Core gasta toda energia" },
        { slot: "Anel", item: "Aspect of Branching Volleys", type: "Aspect", affixes: "Barrage +projéteis" },
        { slot: "Luvas", item: "Aspect of Corruption", type: "Aspect", affixes: "Imbue em Vulnerable" },
      ],
      attributes: [
        { attribute: "Dano", value: 6 }, { attribute: "Sobrevivência", value: 5 },
        { attribute: "Mobilidade", value: 9 }, { attribute: "Facilidade", value: 7 },
        { attribute: "Dep. de Gear", value: 7 },
      ],
      combat: {
        base_hit: 6200, hits_per_second: 6.5, crit_chance: 0.55, crit_damage_bonus: 1.7,
        vulnerable_uptime: 0.85, vulnerable_bonus: 0.2,
        modifiers: [
          { name: "Barrage dmg", bucket: "additive", value: 0.8 },
          { name: "Shadow Imbue", bucket: "imbuement", value: 0.6 },
          { name: "Ricochet hits", bucket: "lucky_hit", value: 0.3 },
        ],
      },
      sources: [
        { site: "D4Builds", tier: "B", date: "09 mai", url: "https://d4builds.gg/" },
        { site: "Mobalytics", tier: "B", date: "05 mai", url: "https://mobalytics.gg/diablo-4" },
      ],
    },
  ];

  // bucket metadata for the Damage Lab visualizer
  const BUCKETS = {
    additive:      { label: "Aditivo (skill/elemental)", color: "#5ab4e8" },
    tal_rasha:     { label: "Tal Rasha", color: "#e8c860" },
    constellation: { label: "Constellation", color: "#a98fe0" },
    lucky_hit:     { label: "Lucky Hit", color: "#34c79a" },
    ultimate:      { label: "Ultimate", color: "#e2622e" },
    overpower:     { label: "Overpower", color: "#d0593a" },
    curse:         { label: "Curse", color: "#9b7fd4" },
    werewolf:      { label: "Werewolf", color: "#7fb653" },
    elemental:     { label: "Elemental", color: "#5ab4e8" },
    berserk:       { label: "Berserk", color: "#d0593a" },
    imbuement:     { label: "Imbuement", color: "#34c79a" },
  };

  window.D4 = {
    patch: { current: "3.1.2", label: "Season of the Forge" },
    classes: CLASSES, tiers: TIERS, buckets: BUCKETS, builds,
  };
})();
