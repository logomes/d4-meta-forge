// Pure transform: a FORGE build (JSON) -> a shareable Markdown build sheet.
// No engine math here — the combat profile is exported as config; live DPS
// lives in the calculator.

const esc = (v) => String(v ?? "").replace(/\|/g, "\\|").trim();

export function buildToMarkdown(build) {
  const d = build.data || {};
  const out = [];

  out.push(`# ${esc(build.name)}  [${esc(build.tier)}]`, "");
  out.push(`**Classe:** ${esc(build.class_name) || "—"} · **Arquétipo:** ${esc(build.archetype) || "—"} · **Patch:** ${esc(build.patch) || "—"}`);
  if (build.objective) out.push(`**Objetivo:** ${esc(build.objective)}`);
  out.push("");

  if (Array.isArray(d.attributes) && d.attributes.length) {
    out.push("## Atributos", "", "| Critério | Valor |", "|---|---|");
    for (const a of d.attributes) out.push(`| ${esc(a.attribute)} | ${esc(a.value)} |`);
    out.push("");
  }

  if (Array.isArray(d.skills) && d.skills.length) {
    out.push("## Skills", "");
    for (const s of d.skills) {
      const tags = [s.element, s.ranks != null ? `${esc(s.ranks)}/5` : null, s.role]
        .filter(Boolean).map(esc).join(" · ");
      out.push(`- **${esc(s.name)}**${tags ? ` — ${tags}` : ""}`);
    }
    out.push("");
  }

  if (Array.isArray(d.gear) && d.gear.length) {
    out.push("## Gear", "", "| Slot | Item | Tipo | Affixes |", "|---|---|---|---|");
    for (const g of d.gear) out.push(`| ${esc(g.slot)} | ${esc(g.item)} | ${esc(g.type)} | ${esc(g.affixes)} |`);
    out.push("");
  }

  const c = d.combat;
  if (c) {
    out.push("## Perfil de combate", "");
    out.push(`- Base hit: ${esc(c.base_hit)} · Hits/s: ${esc(c.hits_per_second)}`);
    out.push(`- Crit: ${esc(c.crit_chance)} chance · +${esc(c.crit_damage_bonus)} dmg`);
    out.push(`- Vulnerable: ${esc(c.vulnerable_uptime)} uptime · +${esc(c.vulnerable_bonus)}`);
    if (Number(c.overpower_chance) > 0) out.push(`- Overpower: ${esc(c.overpower_chance)} chance · +${esc(c.overpower_bonus)}`);
    if (Array.isArray(c.modifiers) && c.modifiers.length) {
      out.push("", "| Modifier | Bucket | Valor |", "|---|---|---|");
      for (const m of c.modifiers) out.push(`| ${esc(m.name)} | ${esc(m.bucket)} | ${esc(m.value)} |`);
    }
    out.push("");
  }

  if (d.paragon?.boards?.length) {
    out.push("## Paragon", "");
    for (const b of d.paragon.boards) out.push(`- ${esc(b.name)}${b.glyph ? ` — glyph: ${esc(b.glyph)}` : ""}`);
    if (d.paragon.rule) out.push(`- _${esc(d.paragon.rule)}_`);
    out.push("");
  }

  out.push("---", "_Gerado por D4 Meta Forge._");
  return out.join("\n");
}
