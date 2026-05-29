# Ícones de skill (hot-link, reference-only) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir o ícone da skill selecionada (calculadora + viewer da build) via um `icon_url` opcional hot-linkado no catálogo curado, com placeholder gracioso quando ausente/quebrado.

**Architecture:** Campo opcional `icon_url` por skill no `skill_coefficients.json` flui pelo `GET /api/calc/skills` existente. Um componente `SkillIcon` renderiza `<img>` com fallback de placeholder (`onError`). O DamageLab usa o `selectedSkill.icon_url`; o Viewer usa um mapa `skillsById` que o `App` busca uma vez e repassa (o `ExportPanel` passa a reusar esse mapa, deduplicando o fetch). Não re-hospedamos arte da Blizzard.

**Tech Stack:** FastAPI + Pydantic + pytest (backend, venv em `backend/.venv`); React 18 + Vite + lucide-react (frontend, JSX — sem harness de teste JS, verificação via `npm run build` + navegador).

---

## File Structure

- Modify: `backend/app/skill_coefficients.py` — `icon_url: str | None = None` no modelo `Skill`.
- Modify: `backend/app/data/skill_coefficients.json` — `icon_url` best-effort por skill.
- Modify: `backend/tests/test_skill_coefficients.py` — teste do default `None`.
- Modify: `backend/tests/test_calc_skills.py` — teste de que o endpoint expõe `icon_url`.
- Create: `frontend/src/components/SkillIcon.jsx` — componente de ícone com placeholder.
- Modify: `frontend/src/components/BuildForge.jsx` — `SkillIcon` ao lado da skill selecionada no DamageLab.
- Modify: `frontend/src/App.jsx` — `skillsById` (1 fetch) repassado a `Viewer` (ícone+nome da skill de combate) e a `ExportPanel` (que deixa de buscar sozinho).

**Convenção de teste:** backend usa pytest (TDD). Frontend NÃO tem harness JS — tarefas de frontend são verificadas com `npm run build` + navegador.

---

### Task 1: Backend — campo `icon_url` no modelo `Skill`

**Files:**
- Modify: `backend/app/skill_coefficients.py`
- Modify: `backend/tests/test_skill_coefficients.py`
- Modify: `backend/tests/test_calc_skills.py`

- [ ] **Step 1: Escrever os testes que falham**

Acrescentar ao final de `backend/tests/test_skill_coefficients.py`:

```python
def test_skill_icon_url_defaults_none():
    from app.skill_coefficients import Coefficient, Skill
    s = Skill(id="x", name="X", class_name="Barbarian", coefficient=Coefficient(base=0.5))
    assert s.icon_url is None
```

Acrescentar ao final de `backend/tests/test_calc_skills.py`:

```python
def test_skills_endpoint_exposes_icon_url(client):
    res = client.get("/api/calc/skills")
    assert res.status_code == 200
    assert all("icon_url" in s for s in res.json()["skills"])
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `cd backend && .venv/bin/python -m pytest tests/test_skill_coefficients.py::test_skill_icon_url_defaults_none tests/test_calc_skills.py::test_skills_endpoint_exposes_icon_url -v`
Expected: FAIL (`Skill` não aceita/expõe `icon_url` ainda — o atributo não existe / não aparece no JSON).

- [ ] **Step 3: Adicionar o campo ao modelo**

Em `backend/app/skill_coefficients.py`, na classe `Skill`, adicionar a linha `icon_url` logo após `note`:

```python
class Skill(BaseModel):
    id: str
    name: str
    class_name: str
    category: str = ""
    tags: list[str] = []
    coefficient: Coefficient
    ranks: int = 5
    source: str = ""
    confidence: Literal["low", "medium", "high"] = "medium"
    note: str | None = None
    icon_url: str | None = None
```

(Não alterar mais nada no arquivo.)

- [ ] **Step 4: Rodar e verificar que passa**

Run: `cd backend && .venv/bin/python -m pytest tests/ -q`
Expected: todos passam (16 anteriores + 2 novos = 18).

- [ ] **Step 5: Commit**

```bash
cd /home/lucgomes/Projetos/d4-meta-forge
git add backend/app/skill_coefficients.py backend/tests/test_skill_coefficients.py backend/tests/test_calc_skills.py
git commit -m "feat: add optional icon_url to Skill model

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Componente `SkillIcon`

**Files:**
- Create: `frontend/src/components/SkillIcon.jsx`

- [ ] **Step 1: Criar o componente**

Criar `frontend/src/components/SkillIcon.jsx` com EXATAMENTE:

```jsx
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

// Exibe o ícone de uma skill via hot-link (reference-only). Sem `url`, ou se a
// imagem falhar ao carregar, cai num placeholder neutro. Não busca dados.
export default function SkillIcon({ url, size = 28, alt = "" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [url]); // reset ao trocar de skill

  const box = {
    width: size, height: size, borderRadius: 6, flex: "0 0 auto",
    border: "1px solid #3a2c22", background: "#120d0a",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  };

  if (url && !failed) {
    return (
      <img src={url} alt={alt} width={size} height={size}
        onError={() => setFailed(true)}
        style={{ ...box, objectFit: "cover" }} />
    );
  }
  return (
    <span style={box} role="img" aria-label={alt || "skill"}>
      <Sparkles size={Math.round(size * 0.55)} color="#9c8a76" />
    </span>
  );
}
```

- [ ] **Step 2: Verificar build**

Run: `cd frontend && npm run build`
Expected: build conclui sem erros (o aviso de chunk-size é pré-existente).

- [ ] **Step 3: Commit**

```bash
cd /home/lucgomes/Projetos/d4-meta-forge
git add frontend/src/components/SkillIcon.jsx
git commit -m "feat: add SkillIcon component with graceful placeholder

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: DamageLab — ícone ao lado da skill selecionada

**Files:**
- Modify: `frontend/src/components/BuildForge.jsx`

- [ ] **Step 1: Importar `SkillIcon`**

Em `frontend/src/components/BuildForge.jsx`, logo após a linha de import do `api.js` (`import { calcDamage, getCatalog, getSkills } from "../api.js";`), adicionar:

```jsx
import SkillIcon from "./SkillIcon.jsx";
```

- [ ] **Step 2: Renderizar o ícone no bloco da skill selecionada**

Em `DamageLab`, substituir o bloco atual:

```jsx
          {selectedSkill && (
            <div className="self-end text-[11px]" style={{ color: PALETTE.muted }}>
              fonte: {selectedSkill.source || "—"} · conf: {selectedSkill.confidence}
            </div>
          )}
```

por:

```jsx
          {selectedSkill && (
            <div className="flex items-center gap-2 self-end">
              <SkillIcon url={selectedSkill.icon_url} size={28} alt={selectedSkill.name} />
              <span className="text-[11px]" style={{ color: PALETTE.muted }}>
                fonte: {selectedSkill.source || "—"} · conf: {selectedSkill.confidence}
              </span>
            </div>
          )}
```

- [ ] **Step 3: Verificar build**

Run: `cd frontend && npm run build`
Expected: build sem erros.

- [ ] **Step 4: Commit**

```bash
cd /home/lucgomes/Projetos/d4-meta-forge
git add frontend/src/components/BuildForge.jsx
git commit -m "feat: show skill icon next to the selected skill in DamageLab

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: App + Viewer + ExportPanel — `skillsById` e ícone no Viewer

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Importar `SkillIcon`**

Em `frontend/src/App.jsx`, após a linha `import BuildCompare from "./components/BuildCompare.jsx";`, adicionar:

```jsx
import SkillIcon from "./components/SkillIcon.jsx";
```

- [ ] **Step 2: Estado + fetch de `skillsById` no `App`**

Em `App()`, logo após `const [error, setError] = useState("");`, adicionar o estado:

```jsx
  const [skillsById, setSkillsById] = useState({});
```

E logo após o `useEffect(() => { refresh(); }, []);`, adicionar:

```jsx
  useEffect(() => {
    getSkills()
      .then((cat) => setSkillsById(Object.fromEntries((cat.skills || []).map((s) => [s.id, s]))))
      .catch(() => {});
  }, []);
```

- [ ] **Step 3: Passar `skillsById` para Viewer e ExportPanel**

Em `App()`, no bloco `{selected && !editing && (...)}`, trocar:

```jsx
                {showMd && <ExportPanel build={selected} onClose={() => setShowMd(false)} />}
                <Viewer build={selected} />
```

por:

```jsx
                {showMd && <ExportPanel build={selected} skillsById={skillsById} onClose={() => setShowMd(false)} />}
                <Viewer build={selected} skillsById={skillsById} />
```

- [ ] **Step 4: Viewer mostra ícone + nome da skill de combate**

Substituir a assinatura e o bloco `{d.combat && (...)}` do `Viewer`. Trocar:

```jsx
function Viewer({ build }) {
  const d = build.data || {};
```

por:

```jsx
function Viewer({ build, skillsById = {} }) {
  const d = build.data || {};
  const combatSkill = d.combat?.skill_id ? skillsById[d.combat.skill_id] : null;
```

E trocar o bloco:

```jsx
        {d.combat && (
          <p className="mt-4 text-xs" style={{ color: "#9c8a76" }}>
            Perfil de combate salvo · clique em <b style={{ color: "#d4af37" }}>Editar</b> para abrir a calculadora ao vivo.
          </p>
        )}
```

por:

```jsx
        {d.combat && (
          <div className="mt-4">
            {d.combat.skill_id && (
              <div className="mb-2 flex items-center gap-2">
                <SkillIcon url={combatSkill?.icon_url} size={32} alt={combatSkill?.name || d.combat.skill_id} />
                <span className="text-sm" style={{ color: "#e7dccd" }}>
                  {combatSkill?.name || d.combat.skill_id}
                </span>
              </div>
            )}
            <p className="text-xs" style={{ color: "#9c8a76" }}>
              Perfil de combate salvo · clique em <b style={{ color: "#d4af37" }}>Editar</b> para abrir a calculadora ao vivo.
            </p>
          </div>
        )}
```

- [ ] **Step 5: ExportPanel reusa `skillsById` (remove o fetch próprio)**

Substituir o início do `ExportPanel`. Trocar:

```jsx
function ExportPanel({ build, onClose }) {
  const [skillNames, setSkillNames] = useState({});
  useEffect(() => {
    getSkills()
      .then((cat) => setSkillNames(Object.fromEntries((cat.skills || []).map((s) => [s.id, s.name]))))
      .catch(() => {});
  }, []);
  const md = buildToMarkdown(build, skillNames);
  const [copied, setCopied] = useState(false);
```

por:

```jsx
function ExportPanel({ build, skillsById = {}, onClose }) {
  const skillNames = Object.fromEntries(Object.values(skillsById).map((s) => [s.id, s.name]));
  const md = buildToMarkdown(build, skillNames);
  const [copied, setCopied] = useState(false);
```

(`getSkills` continua importado e usado pelo `App` no Step 2 — não remover o import.)

- [ ] **Step 6: Verificar build**

Run: `cd frontend && npm run build`
Expected: build sem erros (sem variável não-usada — `getSkills` segue usado pelo App).

- [ ] **Step 7: Verificar no navegador**

Subir os servidores:
- `cd backend && .venv/bin/uvicorn app.main:app --port 8000`
- `cd frontend && npm run dev`

Em `http://localhost:5173`:
1. Editar uma build, selecionar uma skill na calculadora → confirmar que um **ícone (ou placeholder)** aparece ao lado de "fonte/conf".
2. Salvar e voltar ao Viewer → confirmar que o **ícone + nome** da skill de combate aparecem no painel da build.
3. Console sem erros novos (o 404 de `favicon.ico` é pré-existente). Como ainda não há `icon_url` curado (Task 5), espera-se o **placeholder** (quadrado com ícone `Sparkles`) — isso é o comportamento correto.

- [ ] **Step 8: Commit**

```bash
cd /home/lucgomes/Projetos/d4-meta-forge
git add frontend/src/App.jsx
git commit -m "feat: resolve skill icon+name in Viewer via shared skillsById; dedup ExportPanel fetch

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Sourcing — preencher `icon_url` (best-effort, data-only)

Sem código. Pesquisar URLs de ícone **hot-linkáveis** para as skills curadas e preencher `icon_url` onde houver fonte estável; o resto fica no placeholder.

**Files:**
- Modify: `backend/app/data/skill_coefficients.json`

- [ ] **Step 1: Pesquisar URLs estáveis**

Para cada skill no JSON (barbarian_hota, sorcerer_fireball, barbarian_whirlwind, sorcerer_ball_lightning, necromancer_bone_spear, rogue_barrage), procurar uma URL de ícone pública e hot-linkável (ex.: CDN de wiki/guia). Só usar URLs que carreguem diretamente como imagem.

- [ ] **Step 2: Adicionar `icon_url` às entradas verificadas**

Para cada skill com URL encontrada, adicionar a chave (deixar sem a chave as não-encontradas — o default `None` + placeholder cobrem):

```json
      "icon_url": "https://.../icone.png"
```

- [ ] **Step 3: Validar JSON e testes**

Run: `cd backend && .venv/bin/python -c "import json,pathlib; json.loads(pathlib.Path('app/data/skill_coefficients.json').read_text()); print('ok')"`
Expected: `ok`
Run: `cd backend && .venv/bin/python -m pytest tests/ -q`
Expected: todos passam (18).

- [ ] **Step 4: Verificar no navegador**

Com os servidores rodando, selecionar no DamageLab uma skill que recebeu `icon_url` → a **imagem real** aparece; uma sem `icon_url` → o **placeholder**. Confirmar que um URL inválido (se houver) cai no placeholder via `onError` (a UI não quebra).

- [ ] **Step 5: Commit**

```bash
cd /home/lucgomes/Projetos/d4-meta-forge
git add backend/app/data/skill_coefficients.json
git commit -m "data: add hot-linked skill icon_url where a stable source exists

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Cobertura do spec:**
- Campo `icon_url` no modelo + JSON (flui pelo `/api/calc/skills`) → Task 1 + Task 5.
- Componente `SkillIcon` (hot-link + placeholder + `onError`) → Task 2.
- DamageLab mostra ícone da skill selecionada → Task 3.
- Viewer mostra ícone+nome via `skillsById`; `App` busca 1x; `ExportPanel` deixa de buscar → Task 4.
- Sourcing best-effort dos URLs → Task 5.
- Tratamento de erro (ausente/quebrado → placeholder; catálogo off → slug/sem ícone) → coberto por `SkillIcon` (Task 2) e pelos fallbacks `combatSkill?.` / `|| d.combat.skill_id` (Task 4).
- Testes backend (default None; endpoint expõe campo) → Task 1.

**Placeholders:** os `icon_url` no JSON são dados a buscar (Task 5), não lacunas de plano; os URLs de exemplo (`https://.../...`) são ilustrativos da forma da chave.

**Consistência de tipos:** `icon_url` (snake_case) idêntico no modelo Pydantic, no JSON e ao ser lido no front (`selectedSkill.icon_url`, `combatSkill?.icon_url`). `skillsById` é `{ id: skillObj }` em App/Viewer/ExportPanel; `ExportPanel` deriva `{id:name}` dele para `buildToMarkdown(build, skillNames)` (assinatura já existente). `SkillIcon` recebe `url`/`size`/`alt` de forma idêntica nos dois usos (DamageLab e Viewer).
