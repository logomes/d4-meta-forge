# Coeficientes reais de dano por skill — Design

**Data:** 2026-05-29
**Projeto:** d4-meta-forge
**Frente do roadmap:** issue #1 — "coeficientes reais de dano por skill"
**Status:** aprovado (design), pendente de implementação

## Problema

Hoje o `base_hit` (dano base por golpe) usado pela engine de dano é digitado à
mão nos presets de `backend/app/damage_sources.py`. Isso torna os números
arbitrários e desconectados do jogo. Queremos que o `base_hit` derive de
coeficientes reais de skill (% de dano de arma por rank), no padrão dos
calculadores tipo Maxroll/D4Builds.

## Decisões (fechadas no brainstorming)

1. **Fonte de verdade = tabela curada estática** (`skill_coefficients.json`),
   versionada no git e lida em runtime. **Sem scraping em produção.**
2. **Origem dos valores:** curadoria a partir de tabelas publicadas da
   comunidade (Maxroll, D4Builds, planilhas), com `patch` + `source` por
   entrada. Coeficiente é fato numérico; a fonte é sempre citada.
   - _Por quê não o d4data:_ sondagem em `blizzhackers/d4data` (29/05/2026)
     mostrou que os `.pow.json` **não** trazem o coeficiente por-rank como
     número limpo — ele vive em descrições com tokens de fórmula + tabelas
     GameBalance, exigindo parse frágil. Além disso o repo está parado desde
     ago/2024 (~patch 1.5). Abordagem descartada.
3. **Cálculo do base:** `base_hit = weapon_damage × coef(skill, rank)`.
   O atributo principal (str/int/dex) continua entrando como **bucket**, não no
   base — mantém a engine coerente.
4. **Escopo:** skills de dano principais de **todas as classes**, em passadas
   incrementais. O app degrada com elegância quando falta coeficiente.
5. **Engine de buckets (`damage.py`) permanece pura** — continua recebendo
   `base_hit`. A resolução `weapon×coef` acontece numa camada acima.

## Modelo de dados

Arquivo novo: `backend/app/data/skill_coefficients.json` (versionado).

```jsonc
{
  "patch": "Season X / 2.x",            // patch de referência da tabela
  "sources": {
    "maxroll":  { "label": "Maxroll",  "url": "https://maxroll.gg/..." },
    "d4builds": { "label": "D4Builds", "url": "https://d4builds.gg/..." }
  },
  "skills": [
    {
      "id": "barbarian_hota",           // slug estável, único
      "name": "Hammer of the Ancients",
      "class_name": "Barbarian",
      "category": "Core",               // Basic | Core | Defensive | ...
      "tags": ["physical", "overpower"],
      "coefficient": { "base": 0.60, "per_rank": 0.06 },
      "ranks": 5,
      "source": "maxroll",              // chave em `sources`
      "confidence": "high",             // high | medium | low
      "note": null
    }
  ]
}
```

- **Fórmula do coeficiente:** `coef(rank) = base + per_rank · (rank − 1)`.
  A grande maioria das skills de D4 escala linearmente por rank; este modelo é
  fiel e simples. Skills com escala não-linear ficam fora desta passada (ou
  marcadas `confidence: "low"` com a melhor aproximação linear + `note`).
- **Rastreabilidade:** `source`, `confidence` e `patch` (global) permitem
  auditar e atualizar cada entrada.

## Backend

### `backend/app/skill_coefficients.py` (novo)

Espelha o padrão de `gamedata.py` (cache LRU). Carrega o JSON e expõe:

- `load() -> dict` — payload completo (com `patch`/`sources`), cacheado.
- `list_skills() -> list[Skill]` — todas as entradas (para o catálogo da API).
- `get(skill_id: str) -> Skill | None`.
- `coefficient_at(skill_id: str, rank: int) -> float | None` — aplica a fórmula
  linear; retorna `None` se a skill não existe (sinaliza fallback).

`Skill` é um `pydantic.BaseModel` espelhando o schema acima.

### `backend/app/damage.py`

**Inalterado.** Continua puro sobre `base_hit`. A engine de buckets não conhece
coeficientes nem armas.

### Camada de resolução (`backend/app/routers/calc.py`)

O `POST /api/calc/damage` aceita campos **opcionais** novos no corpo:
`skill_id`, `skill_rank`, `weapon_damage`.

Lógica de resolução do `base_hit`:

```
se skill_id e weapon_damage informados e coefficient_at(skill_id, rank) != None:
    base_hit = weapon_damage × coefficient_at(skill_id, rank)
    (anexa metadados ao retorno: coef usado, source, confidence, patch)
senão:
    base_hit = base_hit do corpo (fluxo manual atual, intacto)
```

Validação: exige `base_hit > 0` **ou** (`skill_id` + `weapon_damage` que
resolvam para um base válido). Mantém o contrato atual quando nenhum campo novo
é enviado.

O `DamageResult` ganha um bloco opcional `resolved` com `{ coefficient, source,
confidence, patch }` para transparência no front (nulo no modo manual).

### Endpoints

- `GET /api/calc/skills` (novo) — retorna o catálogo de coeficientes
  (`patch`, `sources`, `skills[]`), pronto para agrupar por `class_name` no
  front.
- `POST /api/calc/damage` (estendido) — aceita os campos opcionais acima.

## Frontend (`frontend/src/components/BuildForge.jsx` + `api.js`)

- `api.js`: novo `getSkills()` → `GET /api/calc/skills`.
- **Input "dano da arma"** no perfil de combate (DamageLab).
- **Seletor de skill** passa a ser populado por `getSkills()`, agrupado por
  classe (`<optgroup>`), substituindo os presets manuais de
  `damage_sources.py` no fluxo principal.
- Ao escolher **skill + rank + dano de arma** → `base_hit` é calculado e
  exibido (read-only, com opção de override manual).
- **Transparência:** ao lado do base_hit, exibir `coef · fonte · patch ·
  confiança` (vindos de `result.resolved` ou do catálogo).
- **Fallback gracioso:** sem skill selecionada, ou coeficiente ausente → volta
  ao `base_hit` manual com aviso sutil ("sem coeficiente curado — usando base
  manual").

## Persistência

O perfil de combate salvo (`build.data.combat`) passa a guardar
`weapon_damage`, `skill_id`, `skill_rank`, além dos campos atuais, garantindo
round-trip ao reabrir/editar a build. `profileFromBuild` (em `BuildCompare.jsx`)
e o `markdown.js` são atualizados para incluir os novos campos quando presentes.

## Tratamento de erros

- **Coeficiente ausente** (skill sem entrada): degrada para `base_hit` manual +
  aviso no front. Nunca quebra o cálculo.
- **Arquivo de dados ausente/corrompido:** `skill_coefficients.py` levanta erro
  claro no startup do endpoint `/skills`; `/damage` no modo manual continua
  funcionando (não depende do arquivo).
- **Patch defasado:** o front exibe o `patch` da tabela como badge, deixando
  explícito a que versão os números se referem.

## Testes (backend, pytest)

1. `coefficient_at` aplica a escala linear corretamente (rank 1..5).
2. `coefficient_at` retorna `None` para skill inexistente.
3. Resolução `base_hit = weapon × coef` no `/damage` (valor esperado conferido).
4. `/damage` sem campos novos = comportamento manual atual (regressão).
5. `/damage` com `skill_id` inexistente → cai no fallback manual (não erra).
6. `GET /api/calc/skills` retorna `patch`, `sources` e `skills[]` bem-formados.

## Dados (curadoria)

Eu curo o `skill_coefficients.json` a partir de tabelas publicadas, citando
`source`/`patch`. Primeira passada: cobertura ampla das classes com o que for
verificável com confiança; entradas duvidosas ficam `confidence: "low"` ou de
fora. A estrutura e o app já suportam crescimento incremental.

## Fora de escopo (YAGNI)

- Parse automático do d4data (descartado por fragilidade).
- Coeficientes de escala não-linear sofisticada (aproximação linear por ora).
- Atributo principal no cálculo do base (segue como bucket).
- Ingest de fontes, flag de validade por patch automatizada, auth/share —
  outras frentes do roadmap, não esta.
