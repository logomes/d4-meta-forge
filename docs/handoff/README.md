# Handoff: D4 Meta Forge

## Overview
**D4 Meta Forge** é um app web (desktop-first) para **criar, versionar, comparar e otimizar builds de Diablo 4**. Ele combina três coisas que hoje vivem espalhadas em sites de referência (Maxroll, Icy-Veins, D4Builds, Mobalytics):

1. Um **agregador de meta / tier list** com builds próprias em formato "FORGE".
2. Uma **calculadora de dano** baseada na engine real de *buckets* do D4 (modificadores do mesmo bucket **somam**; buckets diferentes **multiplicam** entre si).
3. Um **editor de builds (Forge)** para registrar identidade, skills, gear e atributos.

As fontes externas aparecem apenas como **link-outs de referência** (nome · tier · data · URL) — nunca como conteúdo rehospedado.

O protótipo nasceu do projeto open-source `logomes/d4-meta-forge` (backend Python com engine de buckets + frontend React/Vite com Recharts). Este handoff reimplementa e expande o frontend numa direção visual própria.

## About the Design Files
Os arquivos deste bundle são **referências de design feitas em HTML/JSX (React via Babel standalone)** — protótipos que mostram o visual e o comportamento pretendidos, **não** código de produção para copiar diretamente.

A tarefa é **recriar estes designs no ambiente do codebase alvo** usando seus padrões estabelecidos. O projeto original usa **React + Vite**, então o caminho natural é:
- React funcional + hooks (já é o que o protótipo usa).
- Substituir o radar SVG manual por **Recharts** (`<RadarChart>`), que o repo já adota, ou manter o SVG leve (incluso e sem dependências).
- Trocar os estilos inline por **CSS Modules / Tailwind / styled-components** conforme a convenção do time — os tokens estão listados abaixo.
- A engine de dano (`calcDamage`) deve espelhar o backend Python; mantenha-a como fonte única de verdade (idealmente no backend, com o front só renderizando).

Se nenhum ambiente existir ainda, React + Vite + TypeScript é a escolha recomendada por alinhar com o repo original.

## Fidelity
**Alta fidelidade (hifi).** Cores, tipografia, espaçamento, estados e interações são finais e devem ser recriados fielmente. As únicas exceções intencionalmente "abertas":
- Os **glifos de classe** usam runas Unicode como placeholders — substituir por ícones reais das 6 classes quando houver assets.
- O **conteúdo das builds** (nomes de skills/itens, números) é ilustrativo/plausível — ligar aos dados reais (`d4data`/JSON do jogo) na implementação.

## Arquitetura de navegação
App de página única com 5 views trocadas por estado (`view`), sem rota de URL no protótipo — na produção, mapeie para rotas:

| View | Rota sugerida | Entrada |
|---|---|---|
| `hub` — Meta Hub (tier list) | `/` ou `/meta` | logo, nav "Meta Hub" |
| `detail` — Build Detail | `/build/:id` | clique num card do Hub |
| `lab` — Damage Lab | `/lab/:id?` | nav "Damage Lab", botões "Abrir no Damage Lab" |
| `compare` — Comparar | `/compare?ids=` | nav "Comparar" → bandeja → "Comparar (n)" |
| `forge` — Forge (editor) | `/forge/:id?` | nav "Forge", botão "+ Nova build", "Editar no Forge" |

Header **sticky** (blur 10px, borda inferior) presente em todas as views: logo (chama-flama SVG + wordmark), nav, botão "+ Nova build" e pill de patch.

---

## Screens / Views

### 1. Meta Hub (`view-hub.jsx`)
**Propósito:** descobrir builds da temporada por tier, classe e tipo de conteúdo.

**Layout:** container central `max-width: 1240px`, padding `30px 28px 90px`.
- **Hero** (flex, space-between): à esquerda eyebrow (uppercase, `letter-spacing .22em`, cor accent) + `<h1>` "Tier list da temporada" (display 40px/700) + parágrafo (max 540px). À direita, três `PulseStat` (número 30px na cor accent + label uppercase 10px).
- **Barra de filtros:** painel (`--panel`, raio 12, borda) com duas linhas de chips. Linha 1: Classe (Todas + 6 classes, cada uma tinge no hover/ativo com a cor da classe). Linha 2: Conteúdo (Todos/Pit/Boss/Speedfarm) + à direita Ordenar (Tier/Uso/Pit).
- **Linhas de tier (S→D):** cada uma é uma `<section>` com gradiente lateral sutil na cor do tier (`linear-gradient(100deg, {tierColor}0e, transparent 40%)`). Coluna esquerda fixa (70px): `TierPlate` (placa 56px) + label ("Meta-defining", "Excelente"…). Direita: grid flex-wrap de `BuildCard` (312px cada). Tier vazio mostra placeholder tracejado.

**BuildCard (312px):**
- Borda esquerda de 3px na cor da classe; hover eleva `translateY(-3px)` + sombra e borda accent.
- Header: `Glyph` (46px) + nome (display 18/600) + linha "Classe · arquétipo".
- Blurb com `-webkit-line-clamp: 2`.
- Chips: objetivo (accent) + skill-chave.
- Grid 2col: "Pit clear" (+152) e barra de "Uso" (% com fill gradiente na cor da classe).
- Footer (borda-topo): `SourceBadge`s compactos + `PatchFlag`.
- Em **modo comparação**, o card ganha checkbox no canto e o clique alterna seleção em vez de abrir.

### 2. Build Detail (`view-detail.jsx`)
**Propósito:** ficha completa da build.
- Botão "← Voltar à tier list".
- **Hero** (raio 16, gradiente na cor da classe): `Glyph` 72px + nome (display 34) + `PatchFlag` + linha de classe/arquétipo/objetivo + blurb (max 620px) + linha "Referências" com `SourceBadge`s completos. Coluna direita: `TierPlate` 64px + botões "Abrir no Damage Lab" (primário), "Editar no Forge" e "+ Comparar" (ghost).
- **Grid 1.4fr / 1fr** (colapsa para 1col < 920px):
  - Esquerda: **Skill bar** (grid 2col de `SkillPip` — ícone-letra, nome+★ se chave, elemento·papel, 5 pips de rank), **Rotação** (passos numerados com setas), **Gear & Aspects** (linhas slot/item/affixes + badge de tipo; Unique em dourado `#e2a23a`).
  - Direita: **Perfil da build** (`Radar` 240px na cor da classe), **Snapshot de dano** (DPS esperado 36px accent + hit esperado; mini-cards Crit/Vulnerable em `--ember`; lista de buckets com `×multiplicador`).

### 3. Damage Lab (`view-lab.jsx`) — peça central
**Propósito:** calculadora ao vivo que **ensina visualmente** a engine de buckets.
- Header + `<select>` "Carregar build".
- **Grid 340px / 1fr** (colapsa < 920px):
  - **Controles (esquerda):** "Hit base" (sliders base_hit, hits/seg), "Multiplicadores condicionais" (crit chance, crit dmg bônus, vulnerable uptime/bônus), "Modifiers (buckets)" — lista editável: nome (input), bucket (`<select>` de 11 buckets), valor (slider 0–2 → "+%"), botões add/remover. Cada modifier tem borda-esquerda na cor do bucket.
  - **Visualizador (direita):**
    1. **DPS esperado** gigante (`--f-num` 58px, accent, glow), com hit esperado e multiplicador total. O número **anima** (count-up, easing cubic-out, ~650ms) quando inputs mudam.
    2. **Cadeia de multiplicação:** "pedras" horizontais — Base hit `×` Crit `×` Vulnerable `×` (cada bucket). A largura da pedra cresce com a contribuição logarítmica. Glifos "×" entre elas. Ensina *buckets se multiplicam*.
    3. **Dentro de cada bucket:** `BucketBar` com barra empilhada (cada modifier é um segmento proporcional) + legenda. Ensina *modifiers do mesmo bucket somam*.

### 4. Comparar (`view-compare.jsx`)
**Propósito:** confrontar 2+ builds.
- Ativada pela nav "Comparar" → entra em modo seleção no Hub → **bandeja fixa inferior** (blur, borda accent) com chips das builds escolhidas e botão "Comparar (n)" (desabilitado < 2).
- **Grid radar / tabela:** esquerda `CompareRadar` (radares sobrepostos, cada build na cor da sua classe, fill 0.14) + legenda. Direita tabela de critérios (Tier, Objetivo, Pit, Uso, DPS, Hit, 5 atributos); **o melhor valor de cada linha** fica em accent/700 com "▲".

### 5. Forge (`view-forge.jsx`) — editor
**Propósito:** criar/editar build.
- Header: `Glyph` + eyebrow ("Nova build · FORGE" / "Editando") + nome + `TierPlate` + "Salvar build".
- **Grid 1.4fr / 1fr:**
  - Esquerda: **Identidade** (nome, classe `<select>`, tier `<select>`, arquétipo, patch, objetivo, descrição `<textarea>`), **Skill bar** (linhas editáveis: skill, elemento, ranks 1–5, papel, toggle ★, remover), **Gear & Aspects** (slot, item, tipo `<select>`, affixes, remover).
  - Direita: **Atributos · radar** (5 sliders 0–10 com `Radar` ao vivo tingido pela classe), **Perfil de combate** (DPS atual + atalho ao Lab).
- **Salvar:** se `id === "__new__"` gera slug+timestamp e dá push em `D4.builds`; senão atualiza in-place. Depois navega ao detalhe. O Hub relê via contador `rev`. **Na produção: persistir via API/DB** (o protótipo só muta o array em memória).

---

## Interactions & Behavior
- **Navegação:** troca de `view` por estado; todo `onOpen/toLab/openForge` faz `window.scrollTo(0,0)`.
- **Hover de cards/chips/tabs:** transições `.15–.18s ease` (transform, box-shadow, border-color, color). Tabs da nav têm sublinhado accent com glow quando ativas.
- **Count-up do DPS** no Lab: `requestAnimationFrame`, easing `1 - (1-p)³`, ~650ms (hook `useCountUp`).
- **Modo comparação:** cards viram selecionáveis; bandeja inferior fixa; botão habilita com ≥2.
- **Responsivo:** grids `.detail-grid/.lab-grid/.cmp-grid` colapsam para 1 coluna em `≤920px`; `.skill-grid` em `≤560px`. Desktop-first.
- **Validade de patch:** `PatchFlag` mostra verde (`#6fae5a`, "patch 3.1.2") se `valid`, senão âmbar (`#e2a23a`, "desatualizada").

## State Management
Estado no componente raiz `App`:
- `view` — qual tela ("hub"|"detail"|"lab"|"compare"|"forge").
- `selected` — build aberta no detalhe.
- `labBuild` — build carregada no Lab.
- `forgeBuild` — build em edição (`{id:"__new__"}` para nova).
- `comparing` (bool) + `compareIds` (array) — seleção de comparação.
- `rev` — contador para forçar releitura do Hub após salvar.
- Tweaks (`useTweaks`): `accent`, `theme`, `font`, `density` (persistidos pelo host).

No Damage Lab: estado local `combat` (clone do `build.combat`), resetado ao trocar de build; `calcDamage` é memoizado.

**Dados (`data.js`):** `window.D4 = { patch, classes, tiers, buckets, builds }`. Na produção isto vira chamadas de API. A engine `calcDamage` deve viver no backend (paridade com o Python original).

## Design Tokens
Definidos como CSS custom properties no objeto `vars` de `App`, trocáveis por tema. **Tema padrão `obsidian`:**

**Cores — obsidian (default)**
| Token | Hex |
|---|---|
| `--bg` | `#0b0907` |
| `--panel` | `#16110d` |
| `--input` | `#100b08` |
| `--border` | `#2a2018` |
| `--line` | `#352a20` |
| `--text` | `#ece2d3` |
| `--text-dim` | `#b9ab97` |
| `--muted` | `#9c8a76` |
| `--muted-2` | `#b3a48f` |
| `--faint` | `#6b5d4d` |
| `--ember` | `#e2622e` |

**Accent (default ouro `#e8c860`):** `--accent`, `--accent-dim` (accent+`66`), `--accent-wash` (accent+`16`), `--accent-glow` (accent+`55`). Opções de accent: Ouro `#e8c860`, Fogo `#e2622e`, Gelo `#5ab4e8`, Veneno `#7fb653`.

**Temas alternativos:** `abyss` (azul-frio, bg `#07080a`/panel `#0f1318`/text `#dde6ee`) e `parchment` (pergaminho claro, bg `#e7ddca`/panel `#f3ecdc`/text `#2a2114`). Ver objeto `THEMES` em `app.jsx`.

**Cores de classe:** Sorcerer `#5ab4e8`, Barbarian `#d0593a`, Druid `#7fb653`, Necromancer `#a98fe0`, Rogue `#34c79a`, Spiritborn `#e0a93a`.

**Cores de tier:** S `#e8c860`, A `#e2622e`, B `#5aa6dc`, C `#8a9296`, D `#6a6258`.

**Tipografia** (Google Fonts). Serif (default): display `Cinzel`, UI `Spectral`, números `Oswald`. Modern: display/números `Oswald`, UI `Outfit`. Variáveis: `--f-display`, `--f-ui`, `--f-num`.
- Escala observada: h1 32–40/700, card title 18/600, body 13–14.5/1.5–1.6, labels uppercase 10–11 com `letter-spacing .1–.22em`, DPS hero 58, números grandes `--f-num`.

**Raio:** cards/painéis 12–16, chips/inputs 7–9, pills 999.
**Sombras:** card `0 2px 10px #0006`; hover `0 10px 30px #0009`; placa de tier `0 0 18px {tierColor}40`; insets `inset 0 1px 0 #ffffff08`.
**Densidade (`--density`):** `zoom` no `<main>` — compacto 0.9 / normal 1 / amplo 1.08.

## Damage Engine (crítico — `forge-ui.jsx → calcDamage`)
Espelha o backend. Regras:
```
critMult   = 1 + crit_chance * crit_damage_bonus
vulnMult   = 1 + vulnerable_uptime * vulnerable_bonus
// modifiers agrupados por bucket; dentro do bucket somam:
bucketMult(b) = 1 + Σ(modifier.value no bucket b)
// buckets multiplicam entre si:
totalBucket   = Π bucketMult(b)
expected_hit  = base_hit * critMult * vulnMult * totalBucket
expected_dps  = expected_hit * hits_per_second
```
Buckets disponíveis: `additive, tal_rasha, constellation, lucky_hit, ultimate, overpower, curse, werewolf, elemental, berserk, imbuement` (cada um com label + cor em `D4.buckets`).

## Assets
- **Nenhuma imagem externa.** Tudo é SVG/CSS: logo chama-flama (inline SVG em `app.jsx`), `Glyph` (placa runada por classe), `TierPlate`, `Radar`/`CompareRadar` (SVG manual sem libs).
- **Fontes:** Google Fonts (Cinzel, Spectral, Oswald, Outfit) — ver `<link>` no HTML.
- **A substituir:** runas de classe (Unicode) → ícones reais; dados de build ilustrativos → dados reais do jogo.

## Files
Protótipo (raiz do projeto), todos incluídos neste bundle:
- `D4 Meta Forge.html` — shell: fontes, estilos globais (scrollbar, range thumb, breakpoints), ordem de scripts.
- `app/data.js` — modelo de dados `window.D4` (classes, tiers, buckets, 6 builds completas).
- `app/forge-ui.jsx` — `calcDamage`, formatadores (`fmt`, `pct`), `Glyph`, `TierPlate`, `SourceBadge`, `PatchFlag`, `Radar`.
- `app/view-hub.jsx` — Meta Hub + `BuildCard`.
- `app/view-detail.jsx` — Build Detail + `Panel`.
- `app/view-lab.jsx` — Damage Lab + visualizador de buckets + `useCountUp`.
- `app/view-compare.jsx` — Comparar + `CompareRadar`.
- `app/view-forge.jsx` — editor Forge.
- `app/app.jsx` — shell, header/nav, roteamento por estado, temas/tokens, Tweaks.
- `tweaks-panel.jsx` — painel de Tweaks (protocolo do host; pode ser descartado na produção).

### Como rodar o protótipo
Abra `D4 Meta Forge.html` num servidor estático (os scripts Babel carregam os `.jsx` por caminho relativo). Ex.: `npx serve` na pasta e abrir o arquivo.
