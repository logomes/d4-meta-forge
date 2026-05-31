# Redesign Completo (linguagem Meta Forge) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recriar o handoff Claude Design ("D4 Meta Forge") no codebase real (React+Vite+Tailwind), com 5 views ligadas à API, sistema de temas em runtime e a flag de validade por patch.

**Architecture:** CSS custom properties carregam os tokens de tema (obsidian/abyss/parchment) e o accent (computado em JS); Tailwind `theme.extend` referencia as vars, então componentes usam classes utilitárias + cores semânticas via var. Conteúdo rico das builds vive no dict `data` do `Build` (sem migração); `lib/buildShape.js` faz a ponte API↔UI. A engine de dano é espelhada em `lib/damage.js` (paridade exata com `backend/app/damage.py`, overpower como multiplicador dedicado) para o slider ao vivo do Damage Lab; o número autoritativo vem de `POST /api/calc/damage`.

**Tech Stack:** React 18 + Vite + Tailwind (frontend, sem harness JS — verificação por `npm run build` + navegador + checks pontuais em `node`); FastAPI + Pydantic + SQLModel + pytest (backend, rodar de `backend/`).

**Referência de design:** `docs/handoff/` (handoff preservado no repo). `docs/handoff/app/*.jsx` são a fonte visual a portar; `docs/handoff/app/forge-ui.jsx` tem os primitivos e a engine; `docs/handoff/app/data.js` mostra o shape de dados; `docs/handoff/app/app.jsx` tem os tokens de tema (THEMES/FONTS/ACCENTS).

**Spec:** `docs/superpowers/specs/2026-05-31-redesign-completo-design.md`

---

## File Structure

**Criar:**
- `frontend/src/theme/tokens.css` — CSS vars por tema (obsidian/abyss/parchment)
- `frontend/src/theme/fonts.css` — import Google Fonts (Cinzel/Spectral/Oswald)
- `frontend/src/data/taxonomy.js` — `CLASSES`, `TIERS`, `BUCKETS`, `ACCENTS`
- `frontend/src/lib/format.js` — `fmt`, `pct`
- `frontend/src/lib/patchStatus.js` — `patchStatus`
- `frontend/src/lib/damage.js` — `calcDamage` (mirror do backend)
- `frontend/src/lib/buildShape.js` — `toUI`, `toAPI`, `EMPTY_COMBAT`, `newBuild`
- `frontend/src/components/primitives/{Panel,Chip,Glyph,TierPlate,SourceBadge,PatchBadge,Radar}.jsx`
- `frontend/src/components/AppShell.jsx`
- `frontend/src/views/{MetaHub,BuildDetail,DamageLab,CompareView,Forge}.jsx`

**Modificar:**
- `frontend/src/index.css` — importar theme css, bg via var
- `frontend/tailwind.config.js` — `theme.extend`
- `frontend/src/api.js` — `currentPatch()`
- `frontend/src/App.jsx` — roteamento por `view` + carga de dados
- `backend/app/config.py` — `current_patch`
- `backend/app/routers/meta.py` — `GET /api/meta/current-patch`

**Remover (absorvidos pelas views):**
- `frontend/src/components/BuildForge.jsx` → `views/Forge.jsx`
- `frontend/src/components/BuildCompare.jsx` → `views/CompareView.jsx`

**Preservados e reaproveitados:** `frontend/src/markdown.js`, `frontend/src/components/SkillIcon.jsx`.

---

# FASE 0 — Fundação

## Task 1: Backend — `current_patch` na config

**Files:**
- Modify: `backend/app/config.py`

- [ ] **Step 1: Ler a config atual**

Run: `sed -n '1,40p' backend/app/config.py`
Expected: ver a classe `Settings` (com `database_url`, `cors_origins`, etc).

- [ ] **Step 2: Adicionar o campo `current_patch`**

Em `backend/app/config.py`, dentro da classe `Settings`, adicionar o campo (junto aos demais campos simples):

```python
    current_patch: str = "3.0"  # sobrescrevível via CURRENT_PATCH; patch atual da Blizzard
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/config.py
git commit -m "feat(config): add current_patch setting"
```

## Task 2: Backend — endpoint `GET /api/meta/current-patch` (TDD)

**Files:**
- Modify: `backend/app/routers/meta.py`
- Test: `backend/tests/test_meta.py` (criar se não existir; senão adicionar o teste)

- [ ] **Step 1: Escrever o teste que falha**

Primeiro, descobrir o padrão de teste existente:

Run: `ls backend/tests/ && sed -n '1,30p' backend/tests/test_*.py | head -40`
Expected: ver como os testes montam o `TestClient` (provável `from fastapi.testclient import TestClient` + `from app.main import app`).

Criar/abrir `backend/tests/test_meta.py` e adicionar (ajustando o import do client ao padrão do projeto):

```python
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_current_patch_returns_configured_value():
    res = client.get("/api/meta/current-patch")
    assert res.status_code == 200
    body = res.json()
    assert "patch" in body
    assert isinstance(body["patch"], str)
    assert body["patch"]  # não-vazio (default "3.0")
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `cd backend && .venv/bin/python -m pytest tests/test_meta.py::test_current_patch_returns_configured_value -v`
Expected: FAIL (404 — rota inexistente).

- [ ] **Step 3: Implementar o endpoint**

Em `backend/app/routers/meta.py`, garantir o import das settings (seguir o padrão do arquivo; provável `from ..config import settings` ou `get_settings`). Adicionar a rota:

```python
@router.get("/current-patch")
def current_patch():
    return {"patch": settings.current_patch}
```

Se o arquivo usa `get_settings()` (Depends), usar:

```python
from ..config import get_settings


@router.get("/current-patch")
def current_patch(settings=Depends(get_settings)):
    return {"patch": settings.current_patch}
```

(Conferir como as outras rotas em `meta.py` acessam settings e seguir o mesmo estilo.)

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `cd backend && .venv/bin/python -m pytest tests/test_meta.py -v`
Expected: PASS.

- [ ] **Step 5: Rodar a suíte toda (não quebrou nada)**

Run: `cd backend && .venv/bin/python -m pytest -q`
Expected: tudo verde (18+ testes).

- [ ] **Step 6: Commit**

```bash
git add backend/app/routers/meta.py backend/tests/test_meta.py
git commit -m "feat(meta): GET /api/meta/current-patch from config"
```

## Task 3: Backend — teste de contrato da engine com overpower

**Files:**
- Test: `backend/tests/test_damage.py` (adicionar teste; criar se não existir)

- [ ] **Step 1: Escrever o teste**

Confirma o contrato que o mirror JS vai espelhar (overpower como multiplicador dedicado). Adicionar a `backend/tests/test_damage.py`:

```python
from app.damage import CombatProfile, Modifier, compute


def test_overpower_is_dedicated_multiplier_not_bucket():
    profile = CombatProfile(
        base_hit=10000,
        hits_per_second=2.0,
        crit_chance=0.5,
        crit_damage_bonus=1.5,
        vulnerable_uptime=0.8,
        vulnerable_bonus=0.2,
        overpower_chance=0.3,
        overpower_bonus=1.0,
        modifiers=[
            Modifier(name="skill", bucket="additive", value=1.0),
            Modifier(name="lh", bucket="lucky_hit", value=0.5),
        ],
    )
    r = compute(profile)
    crit = 1 + 0.5 * 1.5          # 1.75
    vuln = 1 + 0.8 * 0.2          # 1.16
    op = 1 + 0.3 * 1.0            # 1.30
    bucket = (1 + 1.0) * (1 + 0.5)  # additive * lucky_hit = 2.0 * 1.5 = 3.0
    expected_hit = 10000 * bucket * crit * vuln * op
    assert abs(r.expected_hit - expected_hit) < 1e-6
    assert abs(r.expected_dps - expected_hit * 2.0) < 1e-6
    assert abs(r.overpower_multiplier - op) < 1e-9
```

- [ ] **Step 2: Rodar e ver passar (o backend já implementa isso)**

Run: `cd backend && .venv/bin/python -m pytest tests/test_damage.py::test_overpower_is_dedicated_multiplier_not_bucket -v`
Expected: PASS (o `compute()` atual já trata overpower assim — este teste trava o contrato).

- [ ] **Step 3: Commit**

```bash
git add backend/tests/test_damage.py
git commit -m "test(damage): lock overpower-as-dedicated-multiplier contract"
```

## Task 4: Frontend — fontes e tokens de tema

**Files:**
- Create: `frontend/src/theme/fonts.css`
- Create: `frontend/src/theme/tokens.css`
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Criar `frontend/src/theme/fonts.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Spectral:wght@400;500;600&family=Oswald:wght@400;500;600;700&display=swap');
```

- [ ] **Step 2: Criar `frontend/src/theme/tokens.css`**

Valores extraídos de `docs/handoff/app/app.jsx` (THEMES + FONTS). Accent é computado em JS (Task 14), só os defaults de fallback ficam aqui.

```css
:root,
[data-theme="obsidian"] {
  --bg: #0b0907;  --panel: #16110d;  --input: #100b08;  --border: #2a2018;  --line: #352a20;
  --text: #ece2d3; --text-dim: #b9ab97; --muted: #9c8a76; --muted-2: #b3a48f; --faint: #6b5d4d;
  --ember: #e2622e;
  --f-display: 'Cinzel', serif;
  --f-ui: 'Spectral', Georgia, serif;
  --f-num: 'Oswald', sans-serif;
  /* accent defaults (Ouro) — sobrescrito em runtime pelo AppShell */
  --accent: #e8c860;
  --accent-dim: #e8c86066;
  --accent-wash: #e8c86016;
  --accent-glow: #e8c86055;
}

[data-theme="abyss"] {
  --bg: #07080a; --panel: #0f1318; --input: #0a0d11; --border: #1c232b; --line: #27303a;
  --text: #dde6ee; --text-dim: #9fb0c0; --muted: #7d8da0; --muted-2: #9aa9bb; --faint: #56616e;
  --ember: #e2622e;
}

[data-theme="parchment"] {
  --bg: #e7ddca; --panel: #f3ecdc; --input: #ece2cc; --border: #ccbd9c; --line: #d8cbac;
  --text: #2a2114; --text-dim: #5a4d36; --muted: #6f5f44; --muted-2: #564a34; --faint: #9a8966;
  --ember: #b5471f;
}
```

- [ ] **Step 3: Atualizar `frontend/src/index.css`**

Substituir o conteúdo inteiro por:

```css
@import "./theme/fonts.css";
@import "./theme/tokens.css";
@tailwind base;
@tailwind components;
@tailwind utilities;

html { background: var(--bg); }
body { margin: 0; background: var(--bg); color: var(--text); font-family: var(--f-ui); }
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/theme/ frontend/src/index.css
git commit -m "feat(theme): CSS-var design tokens + fonts (obsidian/abyss/parchment)"
```

## Task 5: Frontend — Tailwind `theme.extend`

**Files:**
- Modify: `frontend/tailwind.config.js`

- [ ] **Step 1: Reescrever `frontend/tailwind.config.js`**

```js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        panel: "var(--panel)",
        input: "var(--input)",
        border: "var(--border)",
        line: "var(--line)",
        text: "var(--text)",
        "text-dim": "var(--text-dim)",
        muted: "var(--muted)",
        "muted-2": "var(--muted-2)",
        faint: "var(--faint)",
        ember: "var(--ember)",
        accent: "var(--accent)",
        "accent-dim": "var(--accent-dim)",
        "accent-wash": "var(--accent-wash)",
        "accent-glow": "var(--accent-glow)",
      },
      fontFamily: {
        display: ["Cinzel", "serif"],
        ui: ["Spectral", "Georgia", "serif"],
        num: ["Oswald", "sans-serif"],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Verificar o build**

Run: `cd frontend && npm run build`
Expected: build sem erros (Tailwind aceita as cores via var).

- [ ] **Step 3: Commit**

```bash
git add frontend/tailwind.config.js
git commit -m "feat(theme): map design tokens into Tailwind theme.extend"
```

## Task 6: Frontend — `data/taxonomy.js`

**Files:**
- Create: `frontend/src/data/taxonomy.js`

- [ ] **Step 1: Criar `frontend/src/data/taxonomy.js`**

Valores de `docs/handoff/app/data.js` (CLASSES/TIERS/BUCKETS) e `app/app.jsx` (ACCENTS).

```js
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

// accents selecionáveis em runtime (chave hex → rótulo PT-BR)
export const ACCENTS = { "#e8c860": "Ouro", "#e2622e": "Fogo", "#5ab4e8": "Gelo", "#7fb653": "Veneno" };

export const CLASS_LIST = Object.keys(CLASSES);
export const TIER_LIST = ["S", "A", "B", "C", "D"];
export const BUCKET_KEYS = Object.keys(BUCKETS);
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/data/taxonomy.js
git commit -m "feat(data): class/tier/bucket/accent taxonomy"
```

## Task 7: Frontend — `lib/format.js`

**Files:**
- Create: `frontend/src/lib/format.js`

- [ ] **Step 1: Criar `frontend/src/lib/format.js`**

De `docs/handoff/app/forge-ui.jsx` (fmt/pct).

```js
export const fmt = (n) => {
  n = Number(n) || 0;
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return Math.round(n).toLocaleString("en-US");
  return n.toFixed(1);
};

export const pct = (n) => Math.round((Number(n) || 0) * 100) + "%";
```

- [ ] **Step 2: Verificar rápido em node**

Run: `cd frontend && node --input-type=module -e "import('./src/lib/format.js').then(m=>{console.assert(m.fmt(1500)==='1,500','fmt k'); console.assert(m.fmt(2e6)==='2.00M','fmt M'); console.assert(m.pct(0.5)==='50%','pct'); console.log('ok')})"`
Expected: `ok` (sem erros de assert).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/format.js
git commit -m "feat(lib): number/percent formatters"
```

## Task 8: Frontend — `lib/patchStatus.js`

**Files:**
- Create: `frontend/src/lib/patchStatus.js`

- [ ] **Step 1: Criar `frontend/src/lib/patchStatus.js`**

Conforme spec `2026-05-30-patch-validity-flag-design.md`: regex major.minor, 3 estados.

```js
// Deriva o status de validade de uma build comparando seu patch ao patch atual.
// Retorna "current" | "outdated" | "unknown".
const RE = /(\d+)\.(\d+)/;

function parse(s) {
  if (!s || typeof s !== "string") return null;
  const m = s.match(RE);
  if (!m) return null;
  return [Number(m[1]), Number(m[2])];
}

export function patchStatus(buildPatch, currentPatch) {
  const b = parse(buildPatch);
  const c = parse(currentPatch);
  if (!b || !c) return "unknown";
  if (b[0] < c[0] || (b[0] === c[0] && b[1] < c[1])) return "outdated";
  return "current";
}
```

- [ ] **Step 2: Verificar em node**

Run: `cd frontend && node --input-type=module -e "import('./src/lib/patchStatus.js').then(({patchStatus:p})=>{console.assert(p('2.4','3.0')==='outdated','a'); console.assert(p('3.0.3','3.0')==='current','b'); console.assert(p('3.1','3.0')==='current','c'); console.assert(p('','3.0')==='unknown','d'); console.assert(p('3.0','')==='unknown','e'); console.assert(p('patch 2.9','3.0')==='outdated','f'); console.log('ok')})"`
Expected: `ok`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/patchStatus.js
git commit -m "feat(lib): pure patchStatus (current/outdated/unknown)"
```

## Task 9: Frontend — `lib/damage.js` (mirror, paridade com backend)

**Files:**
- Create: `frontend/src/lib/damage.js`

- [ ] **Step 1: Criar `frontend/src/lib/damage.js`**

Espelha `backend/app/damage.py::compute()` exatamente: overpower é multiplicador dedicado; buckets ordenados por nome; chaves de saída iguais às do backend.

```js
// Mirror puro de backend/app/damage.py::compute().
// Mesma regra: modifiers do mesmo bucket SOMAM; buckets MULTIPLICAM.
// Crit, vulnerable e overpower são multiplicadores dedicados (não buckets).
export function calcDamage(c) {
  const sums = {};
  (c.modifiers || []).forEach((m) => {
    sums[m.bucket] = (sums[m.bucket] || 0) + (Number(m.value) || 0);
  });
  const buckets = Object.keys(sums)
    .sort()
    .map((bucket) => {
      const additive_sum = sums[bucket];
      return { bucket, additive_sum, multiplier: 1 + additive_sum };
    });
  const bucketMult = buckets.reduce((p, b) => p * b.multiplier, 1);

  const crit_multiplier = 1 + (c.crit_chance || 0) * (c.crit_damage_bonus || 0);
  const vulnerable_multiplier = 1 + (c.vulnerable_uptime || 0) * (c.vulnerable_bonus || 0);
  const overpower_multiplier = 1 + (c.overpower_chance || 0) * (c.overpower_bonus || 0);

  const base_hit = Number(c.base_hit) || 0;
  const expected_hit =
    base_hit * bucketMult * crit_multiplier * vulnerable_multiplier * overpower_multiplier;
  const expected_dps = expected_hit * (Number(c.hits_per_second) || 1);

  return {
    base_hit,
    buckets,
    bucketMult,
    crit_multiplier,
    vulnerable_multiplier,
    overpower_multiplier,
    expected_hit,
    expected_dps,
  };
}
```

- [ ] **Step 2: Verificar paridade com o backend em node**

Usa exatamente os números do teste backend (Task 3): bucket=3.0, crit=1.75, vuln=1.16, op=1.30, base=10000, hps=2.0 → expected_hit = 10000·3·1.75·1.16·1.30 = 79170; dps = 158340.

Run: `cd frontend && node --input-type=module -e "import('./src/lib/damage.js').then(({calcDamage})=>{const r=calcDamage({base_hit:10000,hits_per_second:2,crit_chance:0.5,crit_damage_bonus:1.5,vulnerable_uptime:0.8,vulnerable_bonus:0.2,overpower_chance:0.3,overpower_bonus:1.0,modifiers:[{name:'s',bucket:'additive',value:1.0},{name:'l',bucket:'lucky_hit',value:0.5}]}); console.assert(Math.abs(r.expected_hit-79170)<1e-6,'hit '+r.expected_hit); console.assert(Math.abs(r.expected_dps-158340)<1e-6,'dps '+r.expected_dps); console.log('ok')})"`
Expected: `ok` (paridade exata com o backend).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/damage.js
git commit -m "feat(lib): damage engine mirror (parity with backend compute)"
```

## Task 10: Frontend — `lib/buildShape.js` (ponte API↔UI)

**Files:**
- Create: `frontend/src/lib/buildShape.js`

- [ ] **Step 1: Criar `frontend/src/lib/buildShape.js`**

```js
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
    tags: d.tags || [],
    pop: typeof d.pop === "number" ? d.pop : 0,
    pit: typeof d.pit === "number" ? d.pit : 0,
    skills: d.skills || [],
    rotation: d.rotation || [],
    gear: d.gear || [],
    attributes: d.attributes || [],
    combat: { ...EMPTY_COMBAT, ...(d.combat || {}) },
    sources: d.sources || [],
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
```

- [ ] **Step 2: Verificar round-trip em node**

Run: `cd frontend && node --input-type=module -e "import('./src/lib/buildShape.js').then(({toUI,toAPI})=>{const api={id:'x',name:'N',class_name:'Rogue',archetype:'A',tier:'S',patch:'3.0',objective:'Boss',data:{blurb:'b',pop:0.3,pit:140,skills:[{name:'Barrage'}],combat:{base_hit:6200}}}; const ui=toUI(api); console.assert(ui.class==='Rogue'&&ui.pop===0.3&&ui.pit===140&&ui.skills.length===1,'toUI'); console.assert(ui.combat.base_hit===6200&&ui.combat.hits_per_second===3,'combat defaults'); const back=toAPI(ui); console.assert(back.class_name==='Rogue'&&back.data.pop===0.3&&back.data.blurb==='b','toAPI'); console.log('ok')})"`
Expected: `ok`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/buildShape.js
git commit -m "feat(lib): buildShape bridge (toUI/toAPI/newBuild)"
```

## Task 11: Frontend — `api.currentPatch()`

**Files:**
- Modify: `frontend/src/api.js`

- [ ] **Step 1: Adicionar a função**

Em `frontend/src/api.js`, após `latestPatch`:

```js
export const currentPatch = () => request(`/api/meta/current-patch`);
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api.js
git commit -m "feat(api): currentPatch() fetch"
```

## Task 12: Frontend — primitivos `Panel` e `Chip`

**Files:**
- Create: `frontend/src/components/primitives/Panel.jsx`
- Create: `frontend/src/components/primitives/Chip.jsx`

- [ ] **Step 1: Criar `Panel.jsx`**

Porta `Panel` de `docs/handoff/app/view-detail.jsx` para classes Tailwind + vars.

```jsx
export default function Panel({ title, right, children, pad = 18 }) {
  return (
    <section
      className="rounded-[14px] border border-border bg-panel"
      style={{ padding: pad }}
    >
      {title && (
        <div className="mb-3.5 flex items-center justify-between">
          <h3 className="m-0 font-ui text-[11px] font-bold uppercase tracking-[.16em] text-accent">
            {title}
          </h3>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
```

- [ ] **Step 2: Criar `Chip.jsx`**

```jsx
// Chip discreto; `accent` pinta com a cor de destaque.
export default function Chip({ accent = false, children }) {
  return (
    <span
      className={
        "whitespace-nowrap rounded-full border px-2.5 py-[3px] font-ui text-[11px] " +
        (accent
          ? "border-accent-dim bg-accent-wash text-accent"
          : "border-line text-muted")
      }
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 3: Build sanity**

Run: `cd frontend && npm run build`
Expected: build ok.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/primitives/Panel.jsx frontend/src/components/primitives/Chip.jsx
git commit -m "feat(ui): Panel + Chip primitives"
```

## Task 13: Frontend — primitivos `Glyph` e `TierPlate`

**Files:**
- Create: `frontend/src/components/primitives/Glyph.jsx`
- Create: `frontend/src/components/primitives/TierPlate.jsx`

- [ ] **Step 1: Criar `Glyph.jsx`**

Porta de `docs/handoff/app/forge-ui.jsx`. Cor da classe é dado dinâmico → estilo inline.

```jsx
import { CLASSES } from "../../data/taxonomy.js";

export default function Glyph({ cls, size = 44 }) {
  const meta = CLASSES[cls] || { color: "#9c8a76", rune: "?" };
  const r = size * 0.16;
  return (
    <div
      className="relative grid flex-[0_0_auto] place-items-center"
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: `radial-gradient(120% 120% at 50% 0%, ${meta.color}33, #0c0907 78%)`,
        border: `1px solid ${meta.color}66`,
        boxShadow: `inset 0 1px 0 ${meta.color}55, 0 2px 10px #0008`,
      }}
    >
      <span
        className="font-display font-semibold leading-none"
        style={{ fontSize: size * 0.46, color: meta.color, textShadow: `0 0 12px ${meta.color}aa` }}
      >
        {meta.rune}
      </span>
      <span
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: -1,
          width: size * 0.5,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)`,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Criar `TierPlate.jsx`**

```jsx
import { TIERS } from "../../data/taxonomy.js";

export default function TierPlate({ tier, size = 56 }) {
  const meta = TIERS[tier] || { color: "#9c8a76" };
  return (
    <div
      className="relative grid flex-[0_0_auto] place-items-center overflow-hidden rounded-lg"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(160deg, ${meta.color}2e, #0c0907 70%)`,
        border: `1px solid ${meta.color}`,
        boxShadow: `0 0 18px ${meta.color}40, inset 0 1px 0 ${meta.color}66`,
      }}
    >
      <span
        className="font-display font-bold leading-none"
        style={{ fontSize: size * 0.52, color: meta.color, textShadow: `0 0 16px ${meta.color}cc` }}
      >
        {tier}
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Build sanity**

Run: `cd frontend && npm run build`
Expected: build ok.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/primitives/Glyph.jsx frontend/src/components/primitives/TierPlate.jsx
git commit -m "feat(ui): Glyph + TierPlate primitives"
```

## Task 14: Frontend — primitivos `SourceBadge` e `PatchBadge`

**Files:**
- Create: `frontend/src/components/primitives/SourceBadge.jsx`
- Create: `frontend/src/components/primitives/PatchBadge.jsx`

- [ ] **Step 1: Criar `SourceBadge.jsx`**

Porta de `docs/handoff/app/forge-ui.jsx`. Link-out reference-only; `stopPropagation` para não disparar o clique do card.

```jsx
import { TIERS } from "../../data/taxonomy.js";

const SOURCE_MARK = { Maxroll: "MX", "Icy-Veins": "IV", D4Builds: "D4", Mobalytics: "MB" };

export default function SourceBadge({ s, compact }) {
  const t = TIERS[s.tier] || { color: "#9c8a76" };
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noopener noreferrer"
      title={`${s.site} — referência externa · ${s.date || ""}`}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-input font-ui text-[11.5px] text-muted no-underline"
      style={{ padding: compact ? "3px 7px" : "5px 9px" }}
    >
      <span className="font-num text-[10px] font-semibold tracking-[.06em] text-text opacity-90">
        {SOURCE_MARK[s.site] || (s.site || "").slice(0, 2)}
      </span>
      <span>{s.site}</span>
      {!compact && (
        <span className="font-num font-bold" style={{ color: t.color }}>
          {s.tier}
        </span>
      )}
      <span className="text-[10px] opacity-50">↗</span>
    </a>
  );
}
```

- [ ] **Step 2: Criar `PatchBadge.jsx`**

Recebe `status` (de `patchStatus`) — não o `valid` do mock. Sem badge quando `current`.

```jsx
// status: "current" | "outdated" | "unknown"
// current => nada (só sinaliza quando há algo a avisar).
export default function PatchBadge({ status, buildPatch, currentPatch }) {
  if (status === "current") return null;
  const outdated = status === "outdated";
  const color = outdated ? "#e2a23a" : "#8a9296";
  const label = outdated ? `${buildPatch || "?"} · desatualizada` : "patch ?";
  const title = outdated
    ? `Patch atual: ${currentPatch || "?"}`
    : "O patch desta build é desconhecido";
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1.5 rounded-full font-ui text-[11px]"
      style={{ color, padding: "2px 8px", border: `1px solid ${color}55`, background: `${color}14` }}
    >
      <span
        style={{ width: 6, height: 6, borderRadius: 999, background: color, boxShadow: `0 0 6px ${color}` }}
      />
      {label}
    </span>
  );
}
```

- [ ] **Step 3: Build sanity**

Run: `cd frontend && npm run build`
Expected: build ok.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/primitives/SourceBadge.jsx frontend/src/components/primitives/PatchBadge.jsx
git commit -m "feat(ui): SourceBadge + PatchBadge (status-derived) primitives"
```

## Task 15: Frontend — primitivo `Radar`

**Files:**
- Create: `frontend/src/components/primitives/Radar.jsx`

- [ ] **Step 1: Criar `Radar.jsx`**

Porta de `docs/handoff/app/forge-ui.jsx` (SVG manual, sem lib). `color` é dinâmico (cor da classe).

```jsx
export default function Radar({ data, color = "var(--accent)", size = 220, max = 10 }) {
  const cx = size / 2,
    cy = size / 2,
    R = size * 0.38;
  const n = data.length;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i, rad) => [cx + Math.cos(angle(i)) * rad, cy + Math.sin(angle(i)) * rad];
  const rings = [0.25, 0.5, 0.75, 1];
  const poly = (rad) => data.map((_, i) => point(i, rad).join(",")).join(" ");
  const shape = data
    .map((d, i) => point(i, R * (Math.max(0, Math.min(max, d.value)) / max)).join(","))
    .join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ display: "block", overflow: "visible" }}>
      {rings.map((r, k) => (
        <polygon key={k} points={poly(R * r)} fill="none" stroke="var(--line)" strokeWidth="1" opacity={0.7} />
      ))}
      {data.map((_, i) => {
        const [x, y] = point(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" strokeWidth="1" opacity={0.5} />;
      })}
      <polygon
        points={shape}
        fill={color}
        fillOpacity="0.28"
        stroke={color}
        strokeWidth="2"
        style={{ filter: `drop-shadow(0 0 8px ${color})` }}
      />
      {data.map((d, i) => {
        const [x, y] = point(i, R * (Math.max(0, Math.min(max, d.value)) / max));
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}
      {data.map((d, i) => {
        const [x, y] = point(i, R + 18);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontFamily: "var(--f-ui)", fontSize: 10, fill: "var(--muted)" }}
          >
            {d.attribute}
          </text>
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 2: Build sanity**

Run: `cd frontend && npm run build`
Expected: build ok.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/primitives/Radar.jsx
git commit -m "feat(ui): Radar primitive (manual SVG, no chart lib)"
```

## Task 16: Frontend — `AppShell` + troca de tema/accent

**Files:**
- Create: `frontend/src/components/AppShell.jsx`

- [ ] **Step 1: Criar `AppShell.jsx`**

Header sticky (blur), nav por tabs, slot de conteúdo, troca de tema/accent. O accent é aplicado computando as 4 vars derivadas no elemento raiz (igual ao handoff `app/app.jsx`). Tema via `data-theme`.

```jsx
import { useEffect } from "react";
import { ACCENTS } from "../data/taxonomy.js";

const THEME_LIST = ["obsidian", "abyss", "parchment"];
const TABS = [
  { key: "hub", label: "Meta Hub" },
  { key: "lab", label: "Damage Lab" },
  { key: "forge", label: "Forge" },
  { key: "compare", label: "Comparar" },
];

function NavTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="relative cursor-pointer border-0 bg-transparent px-1 py-2 font-ui text-[13.5px] tracking-[.01em]"
      style={{ color: active ? "var(--text)" : "var(--muted)" }}
    >
      {children}
      <span
        className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded"
        style={{
          background: active ? "var(--accent)" : "transparent",
          boxShadow: active ? "0 0 8px var(--accent-glow)" : "none",
        }}
      />
    </button>
  );
}

export default function AppShell({ view, onNav, theme, setTheme, accent, setAccent, onNew, patchLabel, children }) {
  // aplica tema + accent (com vars derivadas) no <html>
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--accent-dim", accent + "66");
    root.style.setProperty("--accent-wash", accent + "16");
    root.style.setProperty("--accent-glow", accent + "55");
  }, [theme, accent]);

  return (
    <div className="min-h-screen bg-bg text-text">
      <header
        className="sticky top-0 z-50 border-b border-border"
        style={{ backdropFilter: "blur(10px)", background: "color-mix(in srgb, var(--bg) 82%, transparent)" }}
      >
        <div className="mx-auto flex max-w-[1180px] items-center gap-6 px-6 py-3">
          <button onClick={() => onNav("hub")} className="cursor-pointer border-0 bg-transparent font-display text-[17px] font-bold tracking-[.12em] text-accent">
            D4 META FORGE
          </button>
          <nav className="flex items-center gap-5">
            {TABS.map((t) => (
              <NavTab key={t.key} active={view === t.key} onClick={() => onNav(t.key)}>
                {t.label}
              </NavTab>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={onNew}
              className="cursor-pointer rounded-lg border border-accent bg-accent px-3 py-1.5 font-ui text-[13px] font-semibold"
              style={{ color: "#0c0907" }}
            >
              + Nova build
            </button>
            {patchLabel && (
              <span className="rounded-full border border-line px-2.5 py-1 font-ui text-[11px] text-muted">
                {patchLabel}
              </span>
            )}
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="cursor-pointer rounded-md border border-line bg-input px-2 py-1 font-ui text-[12px] text-text outline-none"
            >
              {THEME_LIST.map((th) => (
                <option key={th} value={th}>{th}</option>
              ))}
            </select>
            <div className="flex items-center gap-1.5">
              {Object.keys(ACCENTS).map((hex) => (
                <button
                  key={hex}
                  title={ACCENTS[hex]}
                  onClick={() => setAccent(hex)}
                  className="h-4 w-4 cursor-pointer rounded-full border"
                  style={{ background: hex, borderColor: accent === hex ? "var(--text)" : "transparent" }}
                />
              ))}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-6 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Build sanity**

Run: `cd frontend && npm run build`
Expected: build ok.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/AppShell.jsx
git commit -m "feat(ui): AppShell with sticky header, nav, theme/accent switch"
```

## Task 17: Frontend — `App.jsx` esqueleto de roteamento + carga de dados

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Reescrever `App.jsx` com o shell e estado**

As views ainda não existem; usar placeholders que serão substituídos nas Tasks 18–22. Carrega builds (via `toUI`) e o patch atual no mount.

```jsx
import { useEffect, useMemo, useState } from "react";
import AppShell from "./components/AppShell.jsx";
import { listBuilds, getBuild, currentPatch as fetchCurrentPatch } from "./api.js";
import { toUI, newBuild } from "./lib/buildShape.js";

export default function App() {
  const [view, setView] = useState("hub");
  const [theme, setTheme] = useState("obsidian");
  const [accent, setAccent] = useState("#e8c860");

  const [builds, setBuilds] = useState([]);
  const [selected, setSelected] = useState(null); // build de UI
  const [labBuild, setLabBuild] = useState(null);
  const [forgeBuild, setForgeBuild] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [curPatch, setCurPatch] = useState("");

  const reload = () =>
    listBuilds()
      .then((rows) => setBuilds(rows.map(toUI)))
      .catch(() => setBuilds([]));

  useEffect(() => {
    reload();
    fetchCurrentPatch()
      .then((r) => setCurPatch(r.patch || ""))
      .catch(() => setCurPatch(""));
  }, []);

  const nav = (v) => {
    setView(v);
    window.scrollTo(0, 0);
  };
  const open = (b) => {
    setSelected(b);
    nav("detail");
  };
  const toLab = (b) => {
    setLabBuild(b);
    nav("lab");
  };
  const openForge = (b) => {
    setForgeBuild(b || newBuild());
    nav("forge");
  };
  const toggleCompareId = (b) =>
    setCompareIds((ids) => (ids.includes(b.id) ? ids.filter((x) => x !== b.id) : [...ids, b.id]));
  const addCompare = (b) => {
    setCompareIds((ids) => (ids.includes(b.id) ? ids : [...ids, b.id]));
    setComparing(true);
    nav("hub");
  };
  const cmpBuilds = useMemo(() => builds.filter((b) => compareIds.includes(b.id)), [builds, compareIds]);

  return (
    <AppShell
      view={view}
      onNav={nav}
      theme={theme}
      setTheme={setTheme}
      accent={accent}
      setAccent={setAccent}
      onNew={() => openForge(null)}
      patchLabel={curPatch ? `patch ${curPatch}` : null}
    >
      {view === "hub" && (
        <div className="font-ui text-muted">
          Meta Hub — {builds.length} builds carregadas (placeholder)
        </div>
      )}
      {view === "detail" && selected && (
        <div className="font-ui text-muted">Detail: {selected.name} (placeholder)</div>
      )}
      {view === "lab" && <div className="font-ui text-muted">Damage Lab (placeholder)</div>}
      {view === "compare" && (
        <div className="font-ui text-muted">Compare: {cmpBuilds.length} builds (placeholder)</div>
      )}
      {view === "forge" && forgeBuild && (
        <div className="font-ui text-muted">Forge: {forgeBuild.name} (placeholder)</div>
      )}
    </AppShell>
  );
}
```

- [ ] **Step 2: Verificação no navegador (F0 completa)**

Subir backend e frontend:
Run (terminal 1): `cd backend && .venv/bin/uvicorn app.main:app --reload`
Run (terminal 2): `cd frontend && npm run dev`
Abrir `http://localhost:5173`. Conferir:
- Header sticky aparece com "D4 META FORGE", tabs, "+ Nova build", pill "patch 3.0".
- Trocar o `select` de tema (obsidian/abyss/parchment) muda as cores ao vivo.
- Clicar nos 4 dots de accent muda a cor de destaque (texto do logo, sublinhado da tab ativa).
- Clicar nas tabs troca o placeholder; "Meta Hub" mostra a contagem de builds (0 num banco vazio — sem erro).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat(app): AppShell routing skeleton + data load (builds, current-patch)"
```

---

# FASE 1 — Leitura (Meta Hub + Build Detail)

## Task 18: Frontend — `views/MetaHub.jsx`

**Files:**
- Create: `frontend/src/views/MetaHub.jsx`
- Modify: `frontend/src/App.jsx` (substituir placeholder do hub)

**Referência:** `docs/handoff/app/view-hub.jsx`. Portar `BuildCard`, `Metric`, `PopBar`, `FilterChip`, `MetaHub`, `PulseStat` para classes Tailwind + vars, trocando `window.D4` por imports e `build.sources`/cor de classe por `taxonomy`. Usar `<PatchBadge status={patchStatus(build.patch, currentPatch)} buildPatch={build.patch} currentPatch={currentPatch} />` no lugar do `<PatchFlag>`.

- [ ] **Step 1: Criar `views/MetaHub.jsx`**

Estrutura (portar o conteúdo de `docs/handoff/app/view-hub.jsx`, com estas mudanças exatas):
- Imports no topo:
```jsx
import { useMemo, useState } from "react";
import { CLASSES, TIERS } from "../data/taxonomy.js";
import { patchStatus } from "../lib/patchStatus.js";
import Glyph from "../components/primitives/Glyph.jsx";
import TierPlate from "../components/primitives/TierPlate.jsx";
import SourceBadge from "../components/primitives/SourceBadge.jsx";
import PatchBadge from "../components/primitives/PatchBadge.jsx";
```
- Assinatura: `export default function MetaHub({ builds, currentPatch, onOpen, comparing, compareIds, onCompare })`.
- Trocar `const D4 = window.D4;` e `D4.builds` por a prop `builds`; `D4.classes`→`CLASSES`; `D4.tiers`→`TIERS`.
- No hero, trocar `D4.patch.label` por `currentPatch ? \`patch ${currentPatch}\` : "—"` e a contagem de fontes "4" por um valor derivado simples (manter "4").
- No rodapé do `BuildCard`, substituir `<PatchFlag build={build} />` por:
```jsx
<PatchBadge
  status={patchStatus(build.patch, currentPatch)}
  buildPatch={build.patch}
  currentPatch={currentPatch}
/>
```
- Converter os objetos `style={{...}}` que usam tokens (`var(--panel)`, etc.) preferencialmente para classes Tailwind equivalentes (`bg-panel`, `border-border`, `text-muted`, `font-ui`, `font-display`, `font-num`); manter inline os estilos que dependem de cor dinâmica (`cm.color`, gradientes de tier) ou cálculos (largura de barra, transform de hover).
- Estado de filtros idêntico ao handoff (`cls`, `tag`, `sort`), mas `rev` não é necessário — remover o param `rev` e do array de deps usar `[cls, tag, sort, builds]`.
- Empty states em PT-BR já vêm do handoff.

- [ ] **Step 2: Ligar no `App.jsx`**

Substituir o bloco placeholder do hub por:
```jsx
{view === "hub" && (
  <MetaHub
    builds={builds}
    currentPatch={curPatch}
    onOpen={open}
    comparing={comparing}
    compareIds={compareIds}
    onCompare={comparing ? toggleCompareId : addCompare}
  />
)}
```
E adicionar o import no topo: `import MetaHub from "./views/MetaHub.jsx";`

- [ ] **Step 3: Seed de dados para verificação**

Se o banco estiver vazio, criar 2 builds via API para ver a tela povoada (usar o shape do `data` blob):
```bash
curl -s -X POST http://localhost:8000/api/builds -H 'Content-Type: application/json' -d '{"name":"Tal Rasha Convergence","class_name":"Sorcerer","archetype":"Chain Lightning","tier":"S","patch":"3.0","objective":"Pit Pushing","data":{"blurb":"Cicla 3 elementos.","tags":["Pit","Boss"],"pop":0.24,"pit":146,"skills":[{"name":"Chain Lightning","element":"Shock","ranks":5,"role":"Core","key":true}],"sources":[{"site":"Maxroll","tier":"S","date":"11 mai","url":"https://maxroll.gg/d4/build-guides"}],"attributes":[{"attribute":"Dano","value":9},{"attribute":"Sobrevivência","value":5},{"attribute":"Mobilidade","value":8},{"attribute":"Facilidade","value":6},{"attribute":"Dep. de Gear","value":9}],"combat":{"base_hit":10000,"hits_per_second":3,"crit_chance":0.6,"crit_damage_bonus":1.5,"vulnerable_uptime":0.9,"vulnerable_bonus":0.2,"overpower_chance":0,"overpower_bonus":0,"modifiers":[{"name":"Tal Rasha","bucket":"tal_rasha","value":0.75}]}}}'
curl -s -X POST http://localhost:8000/api/builds -H 'Content-Type: application/json' -d '{"name":"Stormclaw Werewolf","class_name":"Druid","archetype":"Shred · Lightning","tier":"A","patch":"2.9","objective":"Speedfarm","data":{"blurb":"Werewolf melee.","tags":["Speedfarm","Pit"],"pop":0.14,"pit":129,"skills":[{"name":"Shred","element":"Shock","ranks":5,"role":"Core","key":true}],"sources":[{"site":"D4Builds","tier":"A","date":"02 mai","url":"https://d4builds.gg/"}],"attributes":[{"attribute":"Dano","value":7},{"attribute":"Sobrevivência","value":7},{"attribute":"Mobilidade","value":9},{"attribute":"Facilidade","value":8},{"attribute":"Dep. de Gear","value":6}],"combat":{"base_hit":8400,"hits_per_second":5.5,"crit_chance":0.58,"crit_damage_bonus":1.4,"vulnerable_uptime":0.6,"vulnerable_bonus":0.2,"overpower_chance":0,"overpower_bonus":0,"modifiers":[{"name":"Shred","bucket":"additive","value":1.0}]}}}'
```

- [ ] **Step 4: Verificação no navegador**

Recarregar `http://localhost:5173`. Conferir:
- Tier list mostra a Sorc na linha S e o Druid na linha A.
- Filtros de classe/conteúdo/ordenação funcionam.
- O card do Druid (patch 2.9 < 3.0) mostra o `PatchBadge` âmbar "2.9 · desatualizada"; a Sorc (3.0) não mostra badge.
- SourceBadges abrem em nova aba; clicar no card abre o placeholder de detail (não o link).

- [ ] **Step 5: Build sanity + commit**

Run: `cd frontend && npm run build`
Expected: ok.
```bash
git add frontend/src/views/MetaHub.jsx frontend/src/App.jsx
git commit -m "feat(view): Meta Hub tier list wired to API + patch badges"
```

## Task 19: Frontend — `views/BuildDetail.jsx`

**Files:**
- Create: `frontend/src/views/BuildDetail.jsx`
- Modify: `frontend/src/App.jsx`

**Referência:** `docs/handoff/app/view-detail.jsx`. Portar `SkillPip`, `BuildDetail`, `MiniMult` (o `Panel` agora vem do primitivo). Trocar `calcDamage(build.combat)` pelo import de `lib/damage.js`; cores via `taxonomy`; `<PatchFlag>` → `<PatchBadge>` com status.

- [ ] **Step 1: Criar `views/BuildDetail.jsx`**

Mudanças exatas sobre o handoff:
- Imports:
```jsx
import { useMemo } from "react";
import { CLASSES } from "../data/taxonomy.js";
import { calcDamage } from "../lib/damage.js";
import { patchStatus } from "../lib/patchStatus.js";
import { fmt } from "../lib/format.js";
import Panel from "../components/primitives/Panel.jsx";
import Glyph from "../components/primitives/Glyph.jsx";
import TierPlate from "../components/primitives/TierPlate.jsx";
import SourceBadge from "../components/primitives/SourceBadge.jsx";
import PatchBadge from "../components/primitives/PatchBadge.jsx";
import Radar from "../components/primitives/Radar.jsx";
```
- Assinatura: `export default function BuildDetail({ build, currentPatch, onBack, onLab, onCompare, onEdit })`.
- `window.D4.classes`→`CLASSES`; `window.D4.buckets`→importar `BUCKETS` de taxonomy e usar; `calcDamage` agora retorna `crit_multiplier`/`vulnerable_multiplier`/`overpower_multiplier` (não `critMult`/`vulnMult`) — ajustar o "Snapshot de dano": `MiniMult label="Crit" v={dmg.crit_multiplier}`, `MiniMult label="Vulnerable" v={dmg.vulnerable_multiplier}`, e adicionar `MiniMult label="Overpower" v={dmg.overpower_multiplier}` (grid de 3 colunas).
- Trocar `<PatchFlag build={build} />` por `<PatchBadge status={patchStatus(build.patch, currentPatch)} buildPatch={build.patch} currentPatch={currentPatch} />`.
- O `Panel` interno do handoff é removido (vem do import).
- Converter estilos com tokens para classes Tailwind; manter inline o que usa `cm.color`/gradiente.

- [ ] **Step 2: Ligar no `App.jsx`**

`import BuildDetail from "./views/BuildDetail.jsx";` e substituir o placeholder de detail:
```jsx
{view === "detail" && selected && (
  <BuildDetail
    build={selected}
    currentPatch={curPatch}
    onBack={() => nav("hub")}
    onLab={toLab}
    onCompare={addCompare}
    onEdit={openForge}
  />
)}
```

- [ ] **Step 3: Adicionar export Markdown (preserva `markdown.js`)**

`buildToMarkdown(build, skillNames)` espera o **shape de API** (`build.data`, `build.class_name`) — a view tem shape de UI, então converter com `toAPI`. Adicionar ao `BuildDetail.jsx`:
```jsx
import { useState } from "react";
import { toAPI } from "../lib/buildShape.js";
import { buildToMarkdown } from "../markdown.js";
```
Dentro do componente, um botão "Exportar Markdown" no painel de ações do hero que abre um `<Panel>`/`<textarea>` somente-leitura + botão "Copiar":
```jsx
const [md, setMd] = useState(null);
const exportMd = () => setMd(buildToMarkdown(toAPI(build)));
// ... botão: <button onClick={exportMd} className="...">Exportar Markdown</button>
// ... quando md != null, mostrar:
//   <Panel title="Markdown">
//     <textarea readOnly value={md} rows={12} className="w-full rounded-lg border border-line bg-input p-3 font-num text-[12px] text-text" />
//     <button onClick={() => navigator.clipboard.writeText(md)} className="...">Copiar</button>
//   </Panel>
```

- [ ] **Step 4: Verificação no navegador**

Clicar num card do hub → abre o detail. Conferir hero (Glyph+TierPlate+PatchBadge), skill bar, rotação, gear, radar, snapshot de dano (3 MiniMult: Crit/Vulnerable/Overpower + buckets). Botões "Voltar", "Abrir no Damage Lab", "Editar no Forge", "+ Comparar" navegam. "Exportar Markdown" gera a planilha (skills/gear/atributos/combat) e "Copiar" copia.

- [ ] **Step 5: Build sanity + commit**

Run: `cd frontend && npm run build`
```bash
git add frontend/src/views/BuildDetail.jsx frontend/src/App.jsx
git commit -m "feat(view): Build Detail wired to API + mirror engine + markdown export"
```

---

# FASE 2 — Damage Lab

## Task 20: Frontend — `views/DamageLab.jsx`

**Files:**
- Create: `frontend/src/views/DamageLab.jsx`
- Modify: `frontend/src/App.jsx`

**Referência:** `docs/handoff/app/view-lab.jsx`. Portar `useCountUp`, `LabSlider`, `ChainStone`, `BucketBar`, `DamageLab`, `ChainGlyph`. Trocar `calcDamage` pelo `lib/damage.js`; chaves de saída `critMult`/`vulnMult`→`crit_multiplier`/`vulnerable_multiplier` e incluir overpower na cadeia; `window.D4.builds`/`buckets`/`classes` por props + imports.

- [ ] **Step 1: Criar `views/DamageLab.jsx`**

Mudanças exatas sobre o handoff:
- Imports:
```jsx
import { useState, useMemo, useEffect, useRef } from "react";
import { CLASSES, BUCKETS, BUCKET_KEYS } from "../data/taxonomy.js";
import { calcDamage } from "../lib/damage.js";
import { fmt, pct } from "../lib/format.js";
import Panel from "../components/primitives/Panel.jsx";
import Glyph from "../components/primitives/Glyph.jsx";
```
- Assinatura: `export default function DamageLab({ builds, initialBuild, onOpen })`.
- `window.D4`→props/imports. Fallback de build inicial: se `builds` vazio, usar um combat default (de `EMPTY_COMBAT`); proteger `builds[0]` com optional chaining (a tela deve abrir mesmo sem builds, mostrando os sliders com o default).
- Adicionar controles de **overpower** no painel "Multiplicadores condicionais": dois `LabSlider` — "Overpower chance" (`combat.overpower_chance`, 0..1, step .01, `fmtVal=pct`) e "Overpower bônus" (`combat.overpower_bonus`, 0..3, step .05, `fmtVal=(v)=>"+"+pct(v)`).
- No card de totais e na cadeia de multiplicação, usar `dmg.crit_multiplier`, `dmg.vulnerable_multiplier`, `dmg.overpower_multiplier`; "Multiplicador total" = `(dmg.crit_multiplier * dmg.vulnerable_multiplier * dmg.overpower_multiplier * dmg.bucketMult)`. Adicionar um `ChainStone` "Overpower" (cor `#d0593a`) na cadeia, ao lado de Crit/Vulnerable.
- `dmg.buckets` agora tem `{bucket, additive_sum, multiplier}` (sem `mods`). O `BucketBar` do handoff usa `mods` para desenhar segmentos — como o backend/mirror não devolve `mods`, simplificar o `BucketBar` para uma única barra proporcional ao `additive_sum` (sem segmentar por modifier) OU derivar os mods do `combat.modifiers` filtrando por bucket. **Escolha:** derivar — passar `combat.modifiers` ao Lab e, no render dos buckets, agrupar `combat.modifiers.filter(m=>m.bucket===b.bucket)` para os segmentos/legenda. Isso mantém a visualização rica.
- Converter estilos com tokens para Tailwind; manter inline cálculos (largura de barra, gradientes).
- O `<style>` `.lab-grid` responsivo do handoff (se houver) pode ser omitido; usar grid Tailwind `style={{ gridTemplateColumns: "340px 1fr" }}` como no handoff.

- [ ] **Step 2: Ligar no `App.jsx`**

`import DamageLab from "./views/DamageLab.jsx";` e:
```jsx
{view === "lab" && (
  <DamageLab builds={builds} initialBuild={labBuild} onOpen={open} />
)}
```

- [ ] **Step 3: Verificação no navegador + paridade**

Abrir o Damage Lab (via tab ou "Abrir no Damage Lab" no detail). Conferir:
- Sliders recalculam o DPS ao vivo (count-up anima).
- A cadeia mostra Base × Crit × Vulnerable × Overpower × (buckets).
- **Paridade:** anotar `base_hit, hits_per_second, crit_*, vulnerable_*, overpower_*, modifiers` exibidos e bater contra o backend:
```bash
curl -s -X POST http://localhost:8000/api/calc/damage -H 'Content-Type: application/json' -d '{"base_hit":10000,"hits_per_second":3,"crit_chance":0.6,"crit_damage_bonus":1.5,"vulnerable_uptime":0.9,"vulnerable_bonus":0.2,"overpower_chance":0,"overpower_bonus":0,"modifiers":[{"name":"Tal Rasha","bucket":"tal_rasha","value":0.75}]}'
```
O `expected_dps` retornado deve bater com o do Lab para o mesmo input.

- [ ] **Step 4: Build sanity + commit**

Run: `cd frontend && npm run build`
```bash
git add frontend/src/views/DamageLab.jsx frontend/src/App.jsx
git commit -m "feat(view): Damage Lab live calc (mirror) + overpower controls"
```

## Task 20b (OPCIONAL): Damage Lab — resolver `base_hit` a partir de skill do catálogo + `SkillIcon`

> **Decisão do usuário pendente.** O handoff edita `base_hit` como número cru. A app antiga tinha um recurso a mais: escolher uma skill do catálogo (`GET /api/calc/skills`) e resolver `base_hit = dano_de_arma × coeficiente`, exibindo o `SkillIcon`. Esse recurso **não está no handoff**. Esta task reintroduz ele no novo Lab; pular se o usuário preferir manter o Lab fiel ao handoff (base_hit cru). Preserva `SkillIcon.jsx` em uso.

**Files:**
- Modify: `frontend/src/views/DamageLab.jsx`

- [ ] **Step 1: Carregar o catálogo de skills**

No `DamageLab`, buscar 1x: `import { getSkills } from "../api.js"; import SkillIcon from "../components/SkillIcon.jsx";` e `useEffect` populando `skills` (lista do catálogo, cada item com `{id, name, icon_url, coefficient/base...}` — conferir o shape real via `curl http://localhost:8000/api/calc/skills`).

- [ ] **Step 2: UI de resolução**

Acima do slider "Base hit", uma linha opcional: `<select>` de skill (com `<SkillIcon url={sel?.icon_url} size={28} />`) + input "dano de arma" + rank; ao escolher, setar `combat.base_hit` para o valor resolvido (via `GET /api/calc/damage` ou cálculo local com o coeficiente). Quando nenhuma skill é escolhida, o slider de base_hit cru continua valendo.

- [ ] **Step 3: Verificação no navegador**

Escolher uma skill do catálogo → ícone aparece, `base_hit` é resolvido e o DPS atualiza. Limpar a seleção → volta ao base_hit manual.

- [ ] **Step 4: Build sanity + commit**

Run: `cd frontend && npm run build`
```bash
git add frontend/src/views/DamageLab.jsx
git commit -m "feat(view): Damage Lab optional catalog-skill base_hit resolution + SkillIcon"
```

---

# FASE 3 — Escrita (Compare + Forge)

## Task 21: Frontend — `views/CompareView.jsx`

**Files:**
- Create: `frontend/src/views/CompareView.jsx`
- Modify: `frontend/src/App.jsx`

**Referência:** `docs/handoff/app/view-compare.jsx`. Portar `CompareRadar`, `CompareView`. Trocar `calcDamage` pelo `lib/damage.js` (chaves `expected_dps`/`expected_hit` continuam iguais); `window.D4.classes`→`CLASSES`; `Panel` do primitivo.

- [ ] **Step 1: Criar `views/CompareView.jsx`**

Mudanças exatas:
- Imports:
```jsx
import { useMemo } from "react";
import { CLASSES } from "../data/taxonomy.js";
import { calcDamage } from "../lib/damage.js";
import { fmt, pct } from "../lib/format.js";
import Panel from "../components/primitives/Panel.jsx";
```
- Assinatura: `export default function CompareView({ builds, onBack, onOpen })`.
- `window.D4.classes`→`CLASSES`. As métricas usam `dmg.expected_dps`/`dmg.expected_hit` (inalterado).
- Guarda: se `builds.length < 2`, renderizar um aviso ("Selecione 2+ builds no Meta Hub para comparar.") + botão voltar.
- Converter estilos token→Tailwind; manter inline cor de classe.

- [ ] **Step 2: Ligar no `App.jsx`**

`import CompareView from "./views/CompareView.jsx";` e:
```jsx
{view === "compare" && (
  <CompareView builds={cmpBuilds} onBack={() => nav("hub")} onOpen={open} />
)}
```
Também adicionar, no AppShell ou no hub, o modo comparar: já temos `comparing`/`compareIds`/`addCompare`/`toggleCompareId`. Garantir que ao entrar em "compare" com <2 builds o aviso aparece. (O toggle de "modo comparar" no hub já vem do handoff `view-hub.jsx`; o botão "Comparar" da nav leva à `compare`.)

- [ ] **Step 3: Verificação no navegador**

No detail de uma build, "+ Comparar" adiciona à seleção e volta ao hub em modo comparar; selecionar uma 2ª; clicar na tab "Comparar". Conferir radares sobrepostos + tabela com destaque do melhor por linha; clicar num nome abre o detail.

- [ ] **Step 4: Build sanity + commit**

Run: `cd frontend && npm run build`
```bash
git add frontend/src/views/CompareView.jsx frontend/src/App.jsx
git commit -m "feat(view): Compare (overlay radar + criteria table)"
```

## Task 22: Frontend — `views/Forge.jsx` (CRUD real)

**Files:**
- Create: `frontend/src/views/Forge.jsx`
- Modify: `frontend/src/App.jsx`

**Referência:** `docs/handoff/app/view-forge.jsx`. Portar `Forge`, `FField`, `fInput`. Salvar via `toAPI` → `saveBuild`. Adicionar campos `pop`/`pit`/`tags`/`sources` (não estavam no editor do handoff, mas decidimos "tudo real").

- [ ] **Step 1: Criar `views/Forge.jsx`**

Mudanças exatas sobre o handoff:
- Imports:
```jsx
import { useState, useMemo } from "react";
import { CLASSES, CLASS_LIST, TIER_LIST } from "../data/taxonomy.js";
import { calcDamage } from "../lib/damage.js";
import { fmt } from "../lib/format.js";
import { EMPTY_COMBAT } from "../lib/buildShape.js";
import Panel from "../components/primitives/Panel.jsx";
import Glyph from "../components/primitives/Glyph.jsx";
import TierPlate from "../components/primitives/TierPlate.jsx";
import Radar from "../components/primitives/Radar.jsx";
```
- Assinatura: `export default function Forge({ build, onSave, onCancel, onLab })`. O `build` recebido é shape de UI (de `App`/`newBuild`).
- `window.D4.classes`→`CLASSES`; `CLASS_LIST`/`TIER_LIST` do taxonomy; `window.D4.patch.current` → usar `build.patch || ""`.
- Estado `m` inicial a partir do `build` (UI shape): incluir `pop`, `pit`. Remover o campo `valid` (a flag deriva do patch agora).
- O `dmg` usa `build.combat || EMPTY_COMBAT` via `calcDamage`.
- **Novos campos no painel "Identidade"** (ou um painel "Meta" novo): `pop` (number 0..1, step .01), `pit` (number), `tags` (input de texto separado por vírgula → array), `sources` (lista editável: site/tier/date/url — pode ser uma seção simples com add/remove, espelhando o editor de gear). Manter o resto (skills, gear, attributes, blurb) como no handoff.
- `save()`: montar o objeto UI completo e chamar `onSave`:
```jsx
const save = () => {
  onSave({
    ...build,
    ...m,
    tags: typeof m.tags === "string" ? m.tags.split(",").map((s) => s.trim()).filter(Boolean) : m.tags || [],
    skills,
    gear,
    attributes,
    sources,
    combat: build?.combat || EMPTY_COMBAT,
  });
};
```
(O `combat` é editado no Damage Lab, não aqui — preserva o existente.)
- Converter estilos token→Tailwind; manter inline cor de classe.

- [ ] **Step 2: Ligar no `App.jsx` com persistência**

Adicionar o import e o handler de save (usa `toAPI` + `saveBuild`, recarrega a lista):
```jsx
import Forge from "./views/Forge.jsx";
import { saveBuild } from "./api.js";
import { toAPI } from "./lib/buildShape.js";
```
Handler dentro do `App`:
```jsx
const handleSave = async (uiBuild) => {
  const payload = toAPI(uiBuild);
  if (payload.id === "new") delete payload.id; // POST cria id no backend
  await saveBuild(payload);
  await reload();
  nav("hub");
};
```
E o bloco da view:
```jsx
{view === "forge" && forgeBuild && (
  <Forge build={forgeBuild} onSave={handleSave} onCancel={() => nav("hub")} onLab={toLab} />
)}
```
Conferir `api.saveBuild`: ele roteia POST quando `id` ausente/começa com "new", PUT caso contrário — alinhado ao `handleSave` (removemos `id:"new"`).

- [ ] **Step 3: Verificação no navegador (fluxo de ponta a ponta)**

- "+ Nova build" → Forge abre com defaults; preencher nome/classe/tier/patch/objetivo, adicionar 1 skill e 1 gear, ajustar atributos (radar atualiza), preencher pop/pit/tags. Salvar → volta ao hub e a build nova aparece no tier escolhido.
- Abrir a build → "Editar no Forge" → alterar o nome → salvar → hub reflete a mudança (PUT).
- Confirmar no backend: `curl -s http://localhost:8000/api/builds | python3 -m json.tool | head -40` mostra a build com `data` populado (skills/gear/attributes/pop/pit).

- [ ] **Step 4: Build sanity + commit**

Run: `cd frontend && npm run build`
```bash
git add frontend/src/views/Forge.jsx frontend/src/App.jsx
git commit -m "feat(view): Forge editor with real CRUD (toAPI/saveBuild)"
```

## Task 23: Limpeza — remover componentes legados

**Files:**
- Delete: `frontend/src/components/BuildForge.jsx`
- Delete: `frontend/src/components/BuildCompare.jsx`

- [ ] **Step 1: Confirmar que não há mais imports dos legados**

Run: `cd frontend && grep -rn "BuildForge\|BuildCompare" src/ || echo "sem referências"`
Expected: `sem referências` (todas as views novas substituíram). Se aparecer algo, ajustar antes de deletar.

- [ ] **Step 2: Remover os arquivos**

```bash
git rm frontend/src/components/BuildForge.jsx frontend/src/components/BuildCompare.jsx
```

- [ ] **Step 3: Build sanity**

Run: `cd frontend && npm run build`
Expected: ok (nenhum import quebrado).

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: remove legacy BuildForge/BuildCompare (absorbed by views)"
```

## Task 24: Verificação final + suíte backend

- [ ] **Step 1: Suíte backend verde**

Run: `cd backend && .venv/bin/python -m pytest -q`
Expected: todos verdes (18 anteriores + current-patch + overpower contract).

- [ ] **Step 2: Build de produção do frontend**

Run: `cd frontend && npm run build`
Expected: build limpo, sem warnings de import.

- [ ] **Step 3: Smoke test de ponta a ponta no navegador**

Com backend + front no ar: percorrer hub → detail → lab (paridade) → comparar 2 → criar/editar build no forge → trocar tema obsidian/abyss/parchment e os 4 accents. Tudo sem erro no console.

- [ ] **Step 4: Atualizar a memória do projeto**

Anotar em `~/.claude/.../memory/d4_meta_forge_project.md` que o redesign foi implementado (specs/plans desta data, 4 fases, estrutura nova de `theme/`, `lib/`, `views/`, primitivos), e que `pop`/`pit`/`sources` agora são campos do Forge no `data` blob.

- [ ] **Step 5: Commit final (se houver pendências) + merge da branch**

Seguir `superpowers:finishing-a-development-branch` para decidir merge/PR.

---

## Notas de execução

- **CORS:** o backend só libera `http://localhost:5173`. Subir o front nessa porta (matar vites residuais se a 5173 estiver ocupada, senão o Vite usa 5174 e as chamadas quebram).
- **lru_cache:** ao editar `skill_coefficients.json` reiniciar o uvicorn; não afeta este plano diretamente.
- **Sem harness JS:** as funções de `lib/*` são verificadas por checks pontuais em `node --input-type=module` (Tasks 7–10) e pela verificação no navegador; o backend mantém pytest.
- **Reference-only:** ícones de skill (SkillIcon) e SourceBadges são hot-link; nunca rehospedar arte da Blizzard.
- **calcDamage paridade:** se algum dia o backend mudar a fórmula, atualizar `lib/damage.js` junto e refazer o check da Task 9.
