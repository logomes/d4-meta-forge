export const CLASSES = {
  Sorcerer:    { color: "#5ab4e8", short: "Sorc",  rune: "ᛁ" },
  Barbarian:   { color: "#d0593a", short: "Barb",  rune: "ᚢ" },
  Druid:       { color: "#7fb653", short: "Druid", rune: "ᚷ" },
  Necromancer: { color: "#a98fe0", short: "Necro", rune: "ᛏ" },
  Rogue:       { color: "#34c79a", short: "Rogue", rune: "ᚹ" },
  Spiritborn:  { color: "#e0a93a", short: "SB",    rune: "ᛒ" },
};

export const TIERS = {
  S: { color: "#e8c860", label: "Meta-defining" },
  A: { color: "#e2622e", label: "Excelente" },
  B: { color: "#5aa6dc", label: "Sólida" },
  C: { color: "#8a9296", label: "Situacional" },
  D: { color: "#6a6258", label: "Off-meta" },
};

export const BUCKETS = {
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

export const ACCENTS = { "#e8c860": "Ouro", "#e2622e": "Fogo", "#5ab4e8": "Gelo", "#7fb653": "Veneno" };

export const CLASS_LIST = Object.keys(CLASSES);
export const TIER_LIST = ["S", "A", "B", "C", "D"];
export const BUCKET_KEYS = Object.keys(BUCKETS);
