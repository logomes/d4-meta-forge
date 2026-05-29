# Coeficientes reais de dano por skill — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o `base_hit` da calculadora derivar de coeficientes reais de skill (`base_hit = dano_da_arma × coef(skill, rank)`) a partir de uma tabela curada estática, mantendo o fluxo manual como fallback.

**Architecture:** Tabela curada `skill_coefficients.json` (estática, versionada) é a fonte de verdade, lida em runtime por um loader com cache LRU. A engine de buckets (`damage.py`) permanece pura sobre `base_hit`. A resolução `arma×coef` acontece numa camada de transporte no router (`DamageRequest` → `CombatProfile`). O frontend ganha input de dano-de-arma + seletor de skill por classe + exibição da resolução, com degradação graciosa para o `base_hit` manual.

**Tech Stack:** FastAPI + Pydantic (backend, Python 3.14, venv em `backend/.venv`), pytest + httpx (testes), React 18 + Vite (frontend, JS/JSX — sem harness de teste JS; verificação via navegador).

---

## File Structure

**Backend**
- Create: `backend/app/data/skill_coefficients.json` — tabela curada (fonte de verdade).
- Create: `backend/app/skill_coefficients.py` — loader + modelos Pydantic (`Skill`, `Coefficient`, `SkillCatalog`) + `coefficient_at`.
- Modify: `backend/app/damage.py` — adiciona DTO de saída `ResolvedSkill` e campo opcional `DamageResult.resolved` (a engine `compute()` NÃO o preenche; permanece pura).
- Modify: `backend/app/routers/calc.py` — `DamageRequest`, resolução de `base_hit`, `GET /api/calc/skills`, `POST /api/calc/damage` estendido.
- Modify: `backend/requirements.txt` — adiciona `pytest`.
- Create: `backend/tests/conftest.py` — fixture `client` (FastAPI `TestClient`).
- Create: `backend/tests/test_skill_coefficients.py` — testes do loader.
- Create: `backend/tests/test_calc_skills.py` — testes dos endpoints.

**Frontend**
- Modify: `frontend/src/api.js` — `getSkills()`.
- Modify: `frontend/src/components/BuildForge.jsx` — input de dano-de-arma, seletor de skill por classe, rank, exibição da resolução, fallback; `profile` inclui os campos novos.
- Modify: `frontend/src/components/BuildCompare.jsx` — `profileFromBuild` propaga `weapon_damage`/`skill_id`/`skill_rank`.
- Modify: `frontend/src/markdown.js` — sheet inclui arma/skill/rank quando presentes.

**Convenção de teste:** o backend usa pytest. O frontend NÃO tem harness de teste JS (decisão do repo); tarefas de frontend são verificadas via navegador (Playwright/manual), como nas features anteriores.

---

### Task 1: Harness de testes do backend (pytest)

**Files:**
- Modify: `backend/requirements.txt`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_smoke.py`

- [ ] **Step 1: Adicionar pytest às dependências**

Editar `backend/requirements.txt`, acrescentando ao final:

```
pytest>=8,<9
```

- [ ] **Step 2: Instalar no venv**

Run: `backend/.venv/bin/pip install "pytest>=8,<9"`
Expected: `Successfully installed pytest-8.x.x` (httpx já está instalado).

- [ ] **Step 3: Criar pacote de testes vazio**

Criar `backend/tests/__init__.py` com conteúdo vazio (arquivo em branco).

- [ ] **Step 4: Criar a fixture do cliente**

Criar `backend/tests/conftest.py`:

```python
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as c:
        yield c
```

- [ ] **Step 5: Escrever o teste de fumaça**

Criar `backend/tests/test_smoke.py`:

```python
def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}
```

- [ ] **Step 6: Rodar e verificar que passa**

Run: `cd backend && .venv/bin/python -m pytest tests/test_smoke.py -v`
Expected: `1 passed`. (Confirma que `TestClient` sobe o app, lifespan/seed inclusive.)

- [ ] **Step 7: Commit**

```bash
cd /home/lucgomes/Projetos/d4-meta-forge
git add backend/requirements.txt backend/tests/__init__.py backend/tests/conftest.py backend/tests/test_smoke.py
git commit -m "test: add pytest harness with TestClient fixture"
```

---

### Task 2: Arquivo de dados semente `skill_coefficients.json`

Primeira passada: poucas entradas reais por classe, suficientes para testar e demonstrar. A curadoria ampla é a Task 8.

**Files:**
- Create: `backend/app/data/skill_coefficients.json`

- [ ] **Step 1: Criar o diretório de dados e o arquivo semente**

Criar `backend/app/data/skill_coefficients.json`:

```json
{
  "patch": "seed (não-oficial — placeholder até curadoria)",
  "sources": {
    "seed": { "label": "Seed (valores de exemplo)", "url": "" }
  },
  "skills": [
    {
      "id": "barbarian_hota",
      "name": "Hammer of the Ancients",
      "class_name": "Barbarian",
      "category": "Core",
      "tags": ["physical", "overpower"],
      "coefficient": { "base": 0.60, "per_rank": 0.06 },
      "ranks": 5,
      "source": "seed",
      "confidence": "low",
      "note": "valor de exemplo; substituir na curadoria"
    },
    {
      "id": "sorcerer_fireball",
      "name": "Fireball",
      "class_name": "Sorcerer",
      "category": "Core",
      "tags": ["fire"],
      "coefficient": { "base": 0.40, "per_rank": 0.04 },
      "ranks": 5,
      "source": "seed",
      "confidence": "low",
      "note": "valor de exemplo; substituir na curadoria"
    }
  ]
}
```

- [ ] **Step 2: Validar que é JSON bem-formado**

Run: `cd backend && .venv/bin/python -c "import json,pathlib; json.loads(pathlib.Path('app/data/skill_coefficients.json').read_text()); print('ok')"`
Expected: `ok`

- [ ] **Step 3: Commit**

```bash
cd /home/lucgomes/Projetos/d4-meta-forge
git add backend/app/data/skill_coefficients.json
git commit -m "data: add seed skill_coefficients.json (placeholder values)"
```

---

### Task 3: Loader `skill_coefficients.py`

**Files:**
- Create: `backend/app/skill_coefficients.py`
- Create: `backend/tests/test_skill_coefficients.py`

- [ ] **Step 1: Escrever os testes que falham**

Criar `backend/tests/test_skill_coefficients.py`:

```python
from app import skill_coefficients as sc


def test_load_returns_catalog():
    cat = sc.load()
    assert cat.patch
    assert isinstance(cat.skills, list) and len(cat.skills) >= 1


def test_get_known_skill():
    skill = sc.get("barbarian_hota")
    assert skill is not None
    assert skill.name == "Hammer of the Ancients"
    assert skill.class_name == "Barbarian"


def test_get_unknown_skill_is_none():
    assert sc.get("does_not_exist") is None


def test_coefficient_at_linear_scaling():
    # base 0.60, +0.06/rank  ->  rank1=0.60, rank3=0.72, rank5=0.84
    assert sc.coefficient_at("barbarian_hota", 1) == 0.60
    assert round(sc.coefficient_at("barbarian_hota", 3), 4) == 0.72
    assert round(sc.coefficient_at("barbarian_hota", 5), 4) == 0.84


def test_coefficient_at_clamps_rank():
    # rank acima do máximo é limitado a `ranks`; abaixo de 1 vira 1
    assert sc.coefficient_at("barbarian_hota", 99) == sc.coefficient_at("barbarian_hota", 5)
    assert sc.coefficient_at("barbarian_hota", 0) == sc.coefficient_at("barbarian_hota", 1)


def test_coefficient_at_unknown_is_none():
    assert sc.coefficient_at("does_not_exist", 1) is None
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `cd backend && .venv/bin/python -m pytest tests/test_skill_coefficients.py -v`
Expected: FAIL com `ModuleNotFoundError: No module named 'app.skill_coefficients'`.

- [ ] **Step 3: Implementar o loader**

Criar `backend/app/skill_coefficients.py`:

```python
"""Curated per-skill damage coefficients (static, versioned source of truth).

The damage engine (``damage.py``) stays pure over ``base_hit``. This module
loads the curated table and resolves a skill's % weapon-damage coefficient at a
given rank, so a real ``base_hit = weapon_damage * coefficient_at(...)`` can be
computed in the transport layer. Values are curated from published community
tables; each entry carries source/confidence and the table carries a patch.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel

_DATA_PATH = Path(__file__).resolve().parent / "data" / "skill_coefficients.json"


class Coefficient(BaseModel):
    base: float
    per_rank: float = 0.0


class Skill(BaseModel):
    id: str
    name: str
    class_name: str
    category: str = ""
    tags: list[str] = []
    coefficient: Coefficient
    ranks: int = 5
    source: str = ""
    confidence: str = "medium"
    note: str | None = None


class SkillCatalog(BaseModel):
    patch: str
    sources: dict[str, dict] = {}
    skills: list[Skill] = []


@lru_cache(maxsize=1)
def load() -> SkillCatalog:
    raw = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
    return SkillCatalog(**raw)


def list_skills() -> list[Skill]:
    return load().skills


def get(skill_id: str) -> Skill | None:
    return next((s for s in load().skills if s.id == skill_id), None)


def coefficient_at(skill_id: str, rank: int) -> float | None:
    skill = get(skill_id)
    if skill is None:
        return None
    clamped = max(1, min(rank, skill.ranks))
    return skill.coefficient.base + skill.coefficient.per_rank * (clamped - 1)
```

- [ ] **Step 4: Rodar e verificar que passa**

Run: `cd backend && .venv/bin/python -m pytest tests/test_skill_coefficients.py -v`
Expected: `6 passed`.

- [ ] **Step 5: Commit**

```bash
cd /home/lucgomes/Projetos/d4-meta-forge
git add backend/app/skill_coefficients.py backend/tests/test_skill_coefficients.py
git commit -m "feat: add skill coefficient loader with linear per-rank scaling"
```

---

### Task 4: Resolução de base_hit + endpoints

**Files:**
- Modify: `backend/app/damage.py` (após a classe `DamageResult`, linhas ~52-66)
- Modify: `backend/app/routers/calc.py` (arquivo inteiro)
- Create: `backend/tests/test_calc_skills.py`

- [ ] **Step 1: Escrever os testes que falham**

Criar `backend/tests/test_calc_skills.py`:

```python
def test_skills_catalog(client):
    res = client.get("/api/calc/skills")
    assert res.status_code == 200
    body = res.json()
    assert "patch" in body and "skills" in body
    ids = [s["id"] for s in body["skills"]]
    assert "barbarian_hota" in ids


def test_damage_resolves_base_from_skill(client):
    # base_hit = weapon_damage * coef(rank). hota rank1 coef = 0.60
    # weapon_damage 1000 -> base_hit 600. Sem modifiers/crit/vuln/op => dps = 600 * hits.
    res = client.post("/api/calc/damage", json={
        "skill_id": "barbarian_hota", "skill_rank": 1, "weapon_damage": 1000,
        "hits_per_second": 1,
    })
    assert res.status_code == 200
    body = res.json()
    assert body["base_hit"] == 600.0
    assert body["resolved"] is not None
    assert body["resolved"]["coefficient"] == 0.60
    assert body["resolved"]["name"] == "Hammer of the Ancients"


def test_damage_manual_path_unchanged(client):
    # Sem campos de skill: usa base_hit do corpo (regressão do contrato atual).
    res = client.post("/api/calc/damage", json={"base_hit": 10000, "hits_per_second": 2})
    assert res.status_code == 200
    body = res.json()
    assert body["base_hit"] == 10000
    assert body["expected_dps"] == 20000
    assert body["resolved"] is None


def test_damage_unknown_skill_falls_back_to_manual(client):
    res = client.post("/api/calc/damage", json={
        "skill_id": "nope", "weapon_damage": 1000, "base_hit": 500, "hits_per_second": 1,
    })
    assert res.status_code == 200
    body = res.json()
    assert body["base_hit"] == 500  # caiu no manual
    assert body["resolved"] is None


def test_damage_requires_base_or_skill(client):
    res = client.post("/api/calc/damage", json={"hits_per_second": 1})
    assert res.status_code == 422
```

- [ ] **Step 2: Rodar para ver falhar**

Run: `cd backend && .venv/bin/python -m pytest tests/test_calc_skills.py -v`
Expected: FAIL (404 em `/api/calc/skills`; `resolved` ausente; 422 não ocorre ainda).

- [ ] **Step 3: Adicionar o DTO `ResolvedSkill` e o campo em `DamageResult`**

Em `backend/app/damage.py`, localizar a classe `DamageResult` (começa em ~linha 53). Inserir uma nova classe ANTES dela e adicionar o campo `resolved`:

```python
class ResolvedSkill(BaseModel):
    """Output-only metadata when base_hit was resolved from a skill coefficient.

    Pure data — the engine never sets this; the transport layer fills it in.
    """
    skill_id: str
    name: str
    rank: int
    coefficient: float
    weapon_damage: float
    source: str
    confidence: str
    patch: str


class DamageResult(BaseModel):
    base_hit: float
    buckets: list[BucketBreakdown]
    crit_multiplier: float
    vulnerable_multiplier: float
    overpower_multiplier: float
    expected_hit: float
    expected_dps: float
    resolved: ResolvedSkill | None = None
```

(Não alterar `compute()` — ele cria `DamageResult` sem `resolved`, que assume `None` por padrão.)

- [ ] **Step 4: Reescrever o router `calc.py`**

Substituir todo o conteúdo de `backend/app/routers/calc.py` por:

```python
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import Field

from ..damage import CombatProfile, DamageResult, ResolvedSkill, compute
from ..damage_sources import CATALOG, DamageCatalog
from ..skill_coefficients import SkillCatalog, coefficient_at, get, load

router = APIRouter(prefix="/api/calc", tags=["calc"])


class DamageRequest(CombatProfile):
    """Transport model: base_hit optional, plus optional skill-resolution fields."""
    base_hit: float | None = Field(default=None, gt=0)
    skill_id: str | None = None
    skill_rank: int = Field(default=1, ge=1)
    weapon_damage: float | None = Field(default=None, gt=0)


@router.post("/damage", response_model=DamageResult)
def calc_damage(req: DamageRequest) -> DamageResult:
    resolved: ResolvedSkill | None = None
    base = req.base_hit

    if req.skill_id and req.weapon_damage is not None:
        coef = coefficient_at(req.skill_id, req.skill_rank)
        if coef is not None:
            base = req.weapon_damage * coef
            skill = get(req.skill_id)
            resolved = ResolvedSkill(
                skill_id=skill.id, name=skill.name, rank=req.skill_rank,
                coefficient=coef, weapon_damage=req.weapon_damage,
                source=skill.source, confidence=skill.confidence, patch=load().patch,
            )

    if base is None or base <= 0:
        raise HTTPException(
            status_code=422,
            detail="Informe base_hit > 0 ou skill_id + weapon_damage que resolvam um base válido.",
        )

    profile = CombatProfile(
        base_hit=base,
        hits_per_second=req.hits_per_second,
        modifiers=req.modifiers,
        crit_chance=req.crit_chance,
        crit_damage_bonus=req.crit_damage_bonus,
        vulnerable_uptime=req.vulnerable_uptime,
        vulnerable_bonus=req.vulnerable_bonus,
        overpower_chance=req.overpower_chance,
        overpower_bonus=req.overpower_bonus,
    )
    result = compute(profile)
    result.resolved = resolved
    return result


@router.get("/skills", response_model=SkillCatalog)
def skills() -> SkillCatalog:
    """Curated per-skill damage coefficients (source of truth for base_hit)."""
    return load()


@router.get("/catalog", response_model=DamageCatalog)
def catalog() -> DamageCatalog:
    """Curated damage-source → bucket mapping and skill presets."""
    return CATALOG
```

- [ ] **Step 5: Rodar e verificar que passa**

Run: `cd backend && .venv/bin/python -m pytest tests/ -v`
Expected: todos passam (smoke + 6 do loader + 5 dos endpoints).

- [ ] **Step 6: Commit**

```bash
cd /home/lucgomes/Projetos/d4-meta-forge
git add backend/app/damage.py backend/app/routers/calc.py backend/tests/test_calc_skills.py
git commit -m "feat: resolve base_hit from skill coefficient; add GET /api/calc/skills"
```

---

### Task 5: `getSkills()` no cliente

**Files:**
- Modify: `frontend/src/api.js` (após `getCatalog`, linha ~31)

- [ ] **Step 1: Adicionar o método**

Em `frontend/src/api.js`, logo após a linha `export const getCatalog = ...`, inserir:

```javascript
export const getSkills = () => request(`/api/calc/skills`);
```

- [ ] **Step 2: Commit**

```bash
cd /home/lucgomes/Projetos/d4-meta-forge
git add frontend/src/api.js
git commit -m "feat: add getSkills() API client"
```

---

### Task 6: DamageLab — dano de arma + seletor de skill + resolução

**Files:**
- Modify: `frontend/src/components/BuildForge.jsx`

- [ ] **Step 1: Incluir os campos novos no `profile` (useMemo)**

Em `BuildForge.jsx`, no `useMemo` que monta `profile` (linhas ~106-121), adicionar os três campos novos ANTES de `modifiers`:

```javascript
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
```

- [ ] **Step 2: Ajustar o guard do efeito de cálculo**

Em `BuildForge.jsx`, no `useEffect` de cálculo (linha ~126), trocar o guard que exige `base_hit > 0` para também aceitar resolução por skill:

Trocar esta linha:

```javascript
    if (profile.base_hit <= 0) { setResult(null); setCalcError("base_hit deve ser > 0"); return; }
```

por:

```javascript
    const resolvable = profile.skill_id && profile.weapon_damage > 0;
    if (profile.base_hit <= 0 && !resolvable) {
      setResult(null);
      setCalcError("Informe base hit > 0, ou selecione uma skill + dano de arma.");
      return;
    }
```

- [ ] **Step 3: Substituir o seletor de preset por skill + arma + rank no `DamageLab`**

Em `BuildForge.jsx`, dentro de `DamageLab` (começa ~linha 259): trocar a busca do catálogo de presets pela de skills e adicionar os controles.

Trocar:

```javascript
  const mods = combat.modifiers || [];
  const [catalog, setCatalog] = useState({ damage_sources: [], skill_presets: [] });
  useEffect(() => { getCatalog().then(setCatalog).catch(() => {}); }, []);
```

por:

```javascript
  const mods = combat.modifiers || [];
  const [catalog, setCatalog] = useState({ damage_sources: [], skill_presets: [] });
  const [skillCat, setSkillCat] = useState({ patch: "", skills: [] });
  useEffect(() => { getCatalog().then(setCatalog).catch(() => {}); }, []);
  useEffect(() => { getSkills().then(setSkillCat).catch(() => {}); }, []);

  const skillsByClass = {};
  for (const s of skillCat.skills) (skillsByClass[s.class_name] ||= []).push(s);
  const selectedSkill = skillCat.skills.find((s) => s.id === combat.skill_id) || null;
```

- [ ] **Step 4: Atualizar o import para incluir `getSkills`**

Em `BuildForge.jsx` linha 6, trocar:

```javascript
import { calcDamage, getCatalog } from "../api.js";
```

por:

```javascript
import { calcDamage, getCatalog, getSkills } from "../api.js";
```

- [ ] **Step 5: Trocar o bloco de UI do preset pelo de skill/arma/rank**

Em `DamageLab`, substituir todo o bloco do preset (linhas ~295-306, o `{catalog.skill_presets.length > 0 && (...)}`) por:

```jsx
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
```

- [ ] **Step 6: Tornar o campo Base hit ciente da resolução**

Em `DamageLab`, trocar o `<Field label="Base hit">` (linha ~308) por uma versão que fica read-only quando a skill resolve o base:

```jsx
        <Field label={selectedSkill && combat.weapon_damage ? "Base hit (calculado)" : "Base hit"}>
          <NumberInput value={result?.resolved ? result.base_hit : combat.base_hit}
            disabled={!!(selectedSkill && combat.weapon_damage)}
            onChange={(e) => setCombat({ base_hit: e.target.value })} />
        </Field>
```

- [ ] **Step 7: Exibir a resolução no painel de resultado**

Em `DamageLab`, dentro do bloco `{result && (...)}`, logo após a `<div>` do DPS/Hit (após a linha ~361 que fecha o primeiro flex), inserir:

```jsx
          {result.resolved && (
            <p className="mt-2 text-[11px]" style={{ color: PALETTE.muted }}>
              base = {fmt(result.resolved.weapon_damage)} (arma) × {result.resolved.coefficient.toFixed(2)} (coef rank {result.resolved.rank})
              {" · "}fonte: {result.resolved.source} · patch {result.resolved.patch} · conf {result.resolved.confidence}
            </p>
          )}
```

- [ ] **Step 8: Verificar no navegador**

Run (dois terminais):
- `cd backend && .venv/bin/uvicorn app.main:app --reload`
- `cd frontend && npm run dev`

Abrir `http://localhost:5173`, clicar **Nova build** → **Editar**. Na calculadora:
1. Selecionar uma skill (ex.: Hammer of the Ancients), preencher **Dano da arma** = 1000, **Rank** = 1.
2. Confirmar: campo "Base hit (calculado)" mostra **600**, DPS atualiza, e a linha "base = 1.000 (arma) × 0.60 (coef rank 1) · fonte… patch…" aparece.
3. Voltar a skill para "— manual —": campo Base hit volta a ser editável; o cálculo usa o valor manual.

Expected: comportamento acima; sem erros no console.

- [ ] **Step 9: Commit**

```bash
cd /home/lucgomes/Projetos/d4-meta-forge
git add frontend/src/components/BuildForge.jsx
git commit -m "feat: skill picker + weapon damage resolve base_hit live in DamageLab"
```

---

### Task 7: Round-trip de persistência (compare + markdown)

**Files:**
- Modify: `frontend/src/components/BuildCompare.jsx` (`profileFromBuild`, linhas ~18-34)
- Modify: `frontend/src/markdown.js` (bloco `Perfil de combate`, linhas ~38-50)

- [ ] **Step 1: Propagar campos de skill no comparador**

Em `BuildCompare.jsx`, na função `profileFromBuild`, alterar o guard e o objeto retornado para considerar resolução por skill. Substituir o corpo da função por:

```javascript
function profileFromBuild(b) {
  const c = b.data?.combat;
  if (!c) return null;
  const hasSkill = c.skill_id && num(c.weapon_damage) > 0;
  if (num(c.base_hit) <= 0 && !hasSkill) return null;
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
}
```

- [ ] **Step 2: Incluir arma/skill no markdown**

Em `frontend/src/markdown.js`, dentro do bloco `if (c) { ... }` (linha ~39), logo após o `out.push("## Perfil de combate", "");`, inserir:

```javascript
    if (c.skill_id) {
      out.push(`- Skill: ${esc(c.skill_id)} (rank ${esc(c.skill_rank ?? 1)}) · Dano de arma: ${esc(c.weapon_damage)}`);
    }
```

- [ ] **Step 3: Verificar no navegador**

Com os servidores rodando (Task 6, Step 8):
1. Criar/editar uma build, selecionar skill + dano de arma + rank, **Salvar**.
2. Reabrir a build (sair e voltar na seleção) → confirmar que skill/arma/rank persistiram e o DPS recalcula.
3. **Export MD** → confirmar a linha "Skill: … (rank …) · Dano de arma: …" no markdown.
4. No modo **Comparar**, com 2 builds (uma resolvida por skill), confirmar que o DPS da build por-skill aparece (não "—").

Expected: persistência e exibição corretas.

- [ ] **Step 4: Commit**

```bash
cd /home/lucgomes/Projetos/d4-meta-forge
git add frontend/src/components/BuildCompare.jsx frontend/src/markdown.js
git commit -m "feat: persist and surface weapon damage + skill in compare and markdown"
```

---

### Task 8: Curadoria — expandir `skill_coefficients.json`

Data-only. Sem código. Substitui os valores-semente por coeficientes reais curados de tabelas publicadas (Maxroll/D4Builds/planilhas), ampliando para as classes.

**Files:**
- Modify: `backend/app/data/skill_coefficients.json`

- [ ] **Step 1: Definir o patch de referência e as fontes**

Atualizar `patch` para o patch/temporada real consultado e preencher `sources` com `{label, url}` de cada fonte usada.

- [ ] **Step 2: Curar as skills de dano principais por classe**

Para cada classe (Barbarian, Sorcerer, Druid, Necromancer, Rogue, Spiritborn), adicionar as skills de dano principais (Basic + Core + chave) com:
- `id` slug estável (`<classe>_<skill>`), `name`, `class_name`, `category`, `tags`.
- `coefficient.base` = % de dano de arma no rank 1; `coefficient.per_rank` = incremento por rank (derivar de dois ranks publicados: `(coef_rankN − coef_rank1) / (N − 1)`).
- `ranks` (normalmente 5), `source` (chave em `sources`), `confidence` (`high` se a fonte é confiável e recente; `low`/omitir se incerto), `note` quando a escala não for linear.

- [ ] **Step 3: Validar JSON e testes**

Run: `cd backend && .venv/bin/python -m pytest tests/ -v`
Expected: testes passam (os de `barbarian_hota`/`sorcerer_fireball` devem permanecer válidos — manter esses ids, ajustando valores conforme curadoria, ou atualizar os testes se os valores mudarem).

> ⚠️ Se a curadoria mudar o `coefficient` de `barbarian_hota`, atualizar os números esperados em `test_coefficient_at_linear_scaling` e `test_damage_resolves_base_from_skill` no mesmo commit.

- [ ] **Step 4: Verificar no navegador**

Com os servidores rodando, abrir a calculadora e confirmar que o seletor de skill lista as classes/skills curadas e que selecionar uma resolve um base coerente.

- [ ] **Step 5: Commit**

```bash
cd /home/lucgomes/Projetos/d4-meta-forge
git add backend/app/data/skill_coefficients.json backend/tests/
git commit -m "data: curate real per-skill damage coefficients across classes"
```

---

## Self-Review

**Cobertura do spec:**
- Modelo de dados `skill_coefficients.json` → Task 2 (semente) + Task 8 (curadoria).
- Loader `skill_coefficients.py` (`load`/`list_skills`/`get`/`coefficient_at`) → Task 3.
- Engine pura + `ResolvedSkill`/`resolved` → Task 4 Step 3.
- Camada de resolução no router + `GET /api/calc/skills` + `POST /api/calc/damage` estendido → Task 4.
- `getSkills()` no front → Task 5.
- Input dano de arma + seletor por classe + base calculado + transparência + fallback → Task 6.
- Persistência (`weapon_damage`/`skill_id`/`skill_rank`) + compare + markdown → Tasks 6-7.
- Testes backend (escala linear, `None` p/ desconhecida, resolução `arma×coef`, fallback manual, regressão, catálogo) → Tasks 3-4.
- Tratamento de erro (coef ausente → fallback; base nem skill → 422) → Task 4 + Task 6 Step 2.

**Nota sobre config:** o spec citou possível setting de path; o plano resolve o caminho do JSON dentro do módulo (`Path(__file__)...`), pois o arquivo embarca com o app — sem necessidade de env var (YAGNI). Sem impacto funcional.

**Consistência de tipos:** `coefficient_at(skill_id, rank)`, `get(skill_id)`, `load()`, `list_skills()` usados de forma idêntica em todas as tarefas. `ResolvedSkill` com os mesmos campos em `damage.py` (definição) e no router (construção) e no front (`result.resolved.{coefficient,weapon_damage,rank,source,patch,confidence}`). `combat.{skill_id,skill_rank,weapon_damage}` idêntico em BuildForge, BuildCompare e markdown.
