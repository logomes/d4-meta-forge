# Redesign completo — Design

**Data:** 2026-05-31
**Roadmap:** issue #1 — redesign do app com a linguagem visual "Meta Forge" (handoff Claude Design)
**Status:** aprovado, pronto pra plano

## Problema

O app atual (BuildForge, Viewer, BuildCompare, DamageLab) funciona — engine de dano por buckets, CRUD de builds, comparador, export Markdown, ícones de skill — mas tem visual cru (Tailwind com `theme.extend` vazio, bg chapado `#0c0a09`, sem sistema de tema, sem identidade). O usuário gerou no Claude Design um handoff hi-fi ("D4 Meta Forge") com 5 telas, sistema de temas e linguagem visual própria. Este design recria esse handoff no codebase real (React + Vite + Tailwind), **ligando tudo à API real** — sem camada de mock em produção.

O handoff é referência de design (single-file, globais `window.*`, estilos inline, sem build). Aqui ele vira código idiomático do projeto.

## Decisões fechadas (brainstorming)

1. **Estilização:** CSS custom properties (tokens de tema) + classes utilitárias Tailwind que referenciam as vars via `theme.extend`. Troca de tema em runtime por `data-theme` no `<html>`. (Não: estilos inline; não: Tailwind puro sem vars.)
2. **Dados:** tudo real — CRUD via `/api/builds` (conteúdo rico no campo `data`), calc autoritativo no backend. `pop`/`pit`/`sources` são campos editáveis no Forge, persistidos no `data` (reais, inseridos pelo usuário; não auto-agregados ainda). Damage Lab usa mirror JS puro só para o slider ao vivo.
3. **Entrega:** 1 spec coeso; plano de implementação em 4 fases (F0 Fundação → F1 Leitura → F2 Lab → F3 Escrita).

## Escopo

- **Inclui:** sistema de tema (obsidian/abyss/parchment + accents), fontes (Cinzel/Spectral/Oswald), primitivos compartilhados, 5 views (Meta Hub, Build Detail, Damage Lab, Compare, Forge), extensão do modelo de dados via `data` blob, reconciliação da engine, e a flag de validade por patch (absorve o spec `2026-05-30-patch-validity-flag-design.md`).
- **Fora (deferido):** react-router (navegação fica por estado `view`, como o handoff); ingest de fontes/PatchNote automático; auth/multi-usuário/share-links; coeficientes reais de dano por skill (item de roadmap à parte). Persistência de tema escolhido (localStorage) é opcional, não bloqueante.

## Arquitetura & estrutura de arquivos

Mantém Vite + React + ESM. Navegação client-side por estado `view` em `App.jsx` (sem react-router). Estrutura nova:

```
frontend/src/
  theme/
    tokens.css        # CSS vars: obsidian (default), abyss, parchment + accents
    fonts.css         # import Cinzel, Spectral, Oswald (Google Fonts)
  lib/
    damage.js         # mirror puro do compute() do backend
    buildShape.js     # toUI(apiBuild) / toAPI(uiBuild)  — ponte data blob ↔ colunas
    patchStatus.js    # current | outdated | unknown (regex major.minor)
    format.js         # fmt, pct
  data/
    taxonomy.js       # CLASSES (cor/short/rune), TIERS (cor/label), BUCKETS (label/cor)
  components/
    primitives/
      Glyph.jsx · TierPlate.jsx · SourceBadge.jsx · PatchBadge.jsx
      Radar.jsx · Panel.jsx · Chip.jsx
    AppShell.jsx      # header sticky (blur), nav, compare tray, theme/accent switch
  views/
    MetaHub.jsx · BuildDetail.jsx · DamageLab.jsx · CompareView.jsx · Forge.jsx
  api.js              # estendido (currentPatch)
  App.jsx             # estado de view + carga de dados via API
  markdown.js         # PRESERVADO (export Markdown)
  components/SkillIcon.jsx  # PRESERVADO (ícone hot-link + placeholder)
```

**Arquivos substituídos/absorvidos:** `components/BuildForge.jsx` → `views/Forge.jsx`; `components/BuildCompare.jsx` → `views/CompareView.jsx`; o Viewer e o DamageLab embutidos no `App.jsx` atual → `views/BuildDetail.jsx` + `views/DamageLab.jsx`. `markdown.js` e `SkillIcon.jsx` são reaproveitados.

### Isolamento das unidades

- **`lib/*`**: funções puras, sem React, testáveis isoladamente. `damage.js` não conhece a UI; `buildShape.js` só traduz formatos; `patchStatus.js`/`format.js` triviais.
- **`components/primitives/*`**: apresentacionais, recebem props, sem fetch. Reusados por todas as views.
- **`views/*`**: cada uma é uma tela; recebem dados + callbacks de navegação do `App`. Não chamam API direto exceto onde a tela é dona da ação (Forge salva, Lab calcula). Carga inicial de listas/detalhe fica no `App`.
- **`AppShell`**: layout/cromo (header, nav, tray, troca de tema). Não conhece conteúdo das views.

## Sistema de tema

`theme/tokens.css`:
```css
:root, [data-theme="obsidian"] {
  --bg: …; --panel: …; --input: …; --border: …; --line: …;
  --text: …; --muted: …; --muted-2: …; --faint: …; --text-dim: …;
  --accent: …; --accent-dim: …; --accent-wash: …; --accent-glow: …; --ember: …;
}
[data-theme="abyss"]    { /* overrides */ }
[data-theme="parchment"]{ /* overrides */ }
[data-accent="ember"]   { --accent: …; --accent-glow: … }
/* demais accents conforme handoff */
```
Valores exatos extraídos do handoff (`app/app.jsx` THEMES/FONTS/ACCENTS + `D4 Meta Forge.html` global styles).

`tailwind.config.js` — `theme.extend`:
```js
colors: { bg:'var(--bg)', panel:'var(--panel)', input:'var(--input)', border:'var(--border)',
          line:'var(--line)', text:'var(--text)', muted:'var(--muted)', faint:'var(--faint)',
          accent:'var(--accent)', 'accent-dim':'var(--accent-dim)', 'accent-wash':'var(--accent-wash)',
          ember:'var(--ember)' /* … */ },
fontFamily: { display:['Cinzel','serif'], ui:['Spectral','serif'], num:['Oswald','sans-serif'] },
```
Componentes usam classes (`bg-panel text-accent font-display`); cores semânticas vêm das vars. Onde o handoff usa cor dinâmica (cor da classe/tier por build), fica inline `style={{ color: cm.color }}` lendo de `taxonomy.js` — essas são lookup de dados, não tokens de tema, então não viram vars.

`AppShell` seta `data-theme`/`data-accent` no `<html>` (ou no wrapper raiz). Default `obsidian`. Troca via controle no header. Persistência em `localStorage` é opcional (nice-to-have, não bloqueia).

Fontes via `theme/fonts.css` importando Google Fonts (Cinzel, Spectral, Oswald), importado no `index.css`. `index.css` perde o `background` hard-coded (vira `var(--bg)`).

## Modelo de dados (data blob ↔ API)

**Sem migração de schema.** `Build` mantém colunas planas; o resto vai no dict `data` (já existe, `sa_column=Column(JSON)`, fluindo por `BuildIn`/`BuildOut`):

```
data = {
  blurb: str,
  tags: [str],
  pop: float,            # 0..1, % de uso (campo do Forge)
  pit: int,              # pit clear (campo do Forge)
  skills:   [{ name, element, ranks, role, key }],
  rotation: [str],
  gear:     [{ slot, item, type, affixes }],
  attributes:[{ attribute, value }],
  combat:   { base_hit, hits_per_second, crit_chance, crit_damage_bonus,
              vulnerable_uptime, vulnerable_bonus,
              overpower_chance, overpower_bonus, modifiers:[{ name, bucket, value }] },
  sources:  [{ site, tier, date, url }],
}
```

`lib/buildShape.js`:
- `toUI(apiBuild)` → `{ id, name, class: class_name, archetype, tier, patch, objective, ...data }` com defaults seguros (arrays vazios, combat default) para campos ausentes.
- `toAPI(uiBuild)` → `{ name, class_name: uiBuild.class, archetype, tier, patch, objective, data: { blurb, tags, pop, pit, skills, rotation, gear, attributes, combat, sources } }`.

As views consomem o shape de UI; só `buildShape` conhece os dois formatos. `api.saveBuild` recebe o payload já no formato API.

## Reconciliação da engine

`lib/damage.js` espelha `backend/app/damage.py::compute()` **exatamente**, inclusive:
- **Overpower como multiplicador dedicado**: `op_mult = 1 + overpower_chance * overpower_bonus` — não como bucket. (Alinha o mock ao backend; o handoff dobrava overpower num bucket comum — descartado.)
- Saída com as chaves do backend: `{ base_hit, buckets:[{bucket, additive_sum, multiplier}], crit_multiplier, vulnerable_multiplier, overpower_multiplier, expected_hit, expected_dps }`.
- Buckets ordenados por nome (igual ao `sorted(...)` do backend) para casar a ordem de exibição.

O Damage Lab usa `lib/damage.js` para o recálculo a cada frame do slider (sem round-trip). Ao **abrir** uma build ou **salvar**, o número autoritativo vem de `POST /api/calc/damage`. Teste de paridade garante que mirror e backend produzem o mesmo `expected_dps` para um input fixo.

## As 5 telas

- **Meta Hub** (`view: hub`, default): tier list S→D, filtros (classe / conteúdo / ordenação por tier·uso·pit), `BuildCard` (Glyph, nome, classe·arquétipo, blurb, chips objetivo+key skill, pit/pop, SourceBadges, PatchBadge). Modo comparar (seleção visual). Dados de `listBuilds()` via `toUI`.
- **Build Detail** (`view: detail`): hero (Glyph + TierPlate + PatchBadge + SourceBadges), skill bar, rotação, gear & aspects, radar de atributos, snapshot de dano (crit/vuln/overpower + buckets), ações → Lab / Forge / Comparar. `getBuild(id)`.
- **Damage Lab** (`view: lab`): calculadora ao vivo — sliders (base_hit, hits/s, crit chance/dmg, vuln uptime/bonus) + editor de modifiers por bucket; cadeia de multiplicação visual; barras por bucket. Carrega o `combat` de qualquer build. Recalc via `lib/damage.js`.
- **Compare** (`view: compare`): radares sobrepostos + tabela de critérios (tier, objetivo, pit, uso, DPS, hit, atributos) com destaque do melhor por linha. 2+ builds selecionadas.
- **Forge** (`view: forge`): editor — identidade (nome, classe, tier, arquétipo, patch, objetivo, blurb), skills, gear, atributos (+radar ao vivo), e os campos `pop`/`pit`/`tags`/`sources`. Salva via `toAPI` → `saveBuild`.

## Patch flag (absorve o spec de 2026-05-30)

Substitui o booleano `valid` cravado do mock. Deriva o status de `lib/patchStatus.js`:
- Backend: campo `current_patch: str = "3.0"` em `config.py` (sobrescrevível via `CURRENT_PATCH`); endpoint `GET /api/meta/current-patch → {"patch": "3.0"}` em `routers/meta.py`.
- `App` busca `current-patch` 1x no mount; passa `currentPatch` às views.
- `patchStatus(buildPatch, currentPatch)`: regex `/(\d+)\.(\d+)/`, compara `[major, minor]` numericamente → `current` (>=) | `outdated` (<) | `unknown` (vazio/sem match em qualquer lado).
- `PatchBadge`: **sem badge** quando `current`; âmbar "desatualizada" (`title`: patch atual) quando `outdated`; cinza "patch ?" quando `unknown`. Aparece em Meta Hub (cards) e Build Detail.

O spec `docs/superpowers/specs/2026-05-30-patch-validity-flag-design.md` fica como histórico; sua implementação é coberta aqui (F0 backend + F1 uso na UI).

## API (estendida)

`frontend/src/api.js` ganha `currentPatch()` → `GET /api/meta/current-patch`. Demais funções (`listBuilds`, `getBuild`, `saveBuild`, `deleteBuild`, `calcDamage`, `getCatalog`, `getSkills`, `latestPatch`) permanecem. `saveBuild` já roteia POST/PUT por `id`.

## Fases do plano

- **F0 — Fundação:** `theme/tokens.css` + `fonts.css`, Tailwind `theme.extend`, `index.css` usando vars; `data/taxonomy.js`; primitivos (Glyph, TierPlate, SourceBadge, PatchBadge, Radar, Panel, Chip); `lib/{damage,buildShape,patchStatus,format}.js`; `AppShell` + troca de tema; backend `current_patch` + endpoint + teste; `api.currentPatch`. Verificável: app sobe com shell temático e troca de tema, primitivos renderizam num harness/página de teste.
- **F1 — Leitura:** Meta Hub + Build Detail ligadas a `listBuilds`/`getBuild` via `toUI`, com PatchBadge. Verificável: navegar hub → detail, filtros, badge de patch corretos no navegador.
- **F2 — Damage Lab:** calc ao vivo via `lib/damage.js` + paridade com `POST /api/calc/damage`. Verificável: sliders recalculam; abrir build mostra DPS batendo com backend.
- **F3 — Escrita:** Compare + Forge com CRUD real (`toAPI`/`saveBuild`/`deleteBuild`). Verificável: criar/editar/salvar build, comparar 2+, fluxo de ponta a ponta.

Cada fase verificada no navegador (backend :8000 + front :5173 — CORS só libera 5173) antes da próxima.

## Testes / verificação

- **Backend (pytest, a partir de `backend/`):** endpoint `current-patch` (200 + corpo refletindo config); paridade mirror↔`compute` é verificada no front, mas um teste de `compute` com overpower fixa o contrato. Suíte atual (18) permanece verde.
- **Frontend:** sem harness JS. `npm run build` limpo + verificação manual no navegador por fase (acima). Paridade da engine conferida comparando o número do Lab (mirror) com o de `POST /api/calc/damage` para a mesma build.

## Não-objetivos

- Não adicionar react-router nesta entrega.
- Não implementar ingest/agregação automática de `pop`/`pit`/`sources` (entrada manual no Forge).
- Não tocar em auth/multi-usuário/share-links.
- Não curar coeficientes reais de dano (item separado do roadmap).
- Não rehospedar arte da Blizzard (ícones seguem hot-link, reference-only).
