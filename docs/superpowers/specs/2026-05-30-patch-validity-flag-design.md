# Flag de validade por patch — Design

**Data:** 2026-05-30
**Roadmap:** issue #1 — "Flag de validade"
**Status:** aprovado, pronto pra plano

## Problema

Uma build guarda `patch` como texto livre (ex `"3.0.3"`, `"3.0"`, `"Season 13"`, ou vazio). Quando o usuário consome uma build (Viewer) ou navega na lista, não há sinal de que ela foi feita pra um patch antigo da Blizzard e pode estar desatualizada. Queremos sinalizar isso de forma honesta e sem ruído.

## Escopo (v1)

- **Inclui:** badge de validade no **Viewer** (read-only) e na **lista de builds**.
- **Fora (deferido):** badge no editor (BuildForge), aviso no export Markdown, integração com `PatchNote`/ingest. A gente adiciona depois se fizer falta.

## Fonte do "patch atual"

Config estática — novo campo em `backend/app/config.py`:

```python
current_patch: str = "3.0"   # sobrescrevível via .env (CURRENT_PATCH=...)
```

Atualizado à mão a cada patch da Blizzard. **Não** depende do ingest (que é outro item do roadmap e hoje deixa `PatchNote` vazio). Quando o ingest existir, dá pra migrar pra um híbrido (usa `PatchNote` se houver, senão a config) numa linha — mas isso está fora deste escopo.

## Exposição (backend)

Novo endpoint leve, sem tocar no `/api/meta/patch/latest` (que é do ingest):

```
GET /api/meta/current-patch  ->  {"patch": "3.0"}
```

Implementado em `backend/app/routers/meta.py`, lendo `settings.current_patch`.

## Lógica de comparação (frontend, pura)

A lógica mora no frontend porque o status é puramente derivado pra UI; tanto o Viewer quanto a lista já carregam as builds, então não é preciso tocar no modelo `Build`/CRUD nem inflar `BuildOut` com dado transitório.

`frontend/src/patchStatus.js` — função pura:

```js
export function patchStatus(buildPatch, currentPatch) { ... }
```

Regras:
1. Extrai `major.minor` de cada lado via regex `/(\d+)\.(\d+)/` (pega o primeiro match; tolera "3.0.3", "patch 3.0", "v3.0", etc.).
2. Se `buildPatch` é vazio/nulo **ou** não casa o regex → `"unknown"`.
3. Se `currentPatch` não parseia → trata como sem referência → `"unknown"` (degrada com segurança).
4. Compara `[major, minor]` numericamente:
   - build `<` atual → `"outdated"`;
   - build `>=` atual → `"current"`.

Retorna uma das strings: `"current" | "outdated" | "unknown"`.

## UI

Componente `frontend/src/components/PatchBadge.jsx`, props `{ status }`:

| status     | render                                                              |
|------------|---------------------------------------------------------------------|
| `current`  | **nada** (sem badge — só sinaliza quando há algo a avisar)          |
| `outdated` | badge âmbar "desatualizada", `title` = "Patch atual: {currentPatch}" |
| `unknown`  | badge cinza "patch ?", `title` explicando que o patch da build é desconhecido |

Estilo discreto, alinhado ao visual existente (mesma pegada dos hints de fonte/confiança do DamageLab).

**Pontos de uso:**
- **Viewer** (`frontend/src/App.jsx:165`) — ao lado de `patch {build.patch}`.
- **Lista de builds** — ao lado de cada item (no mesmo componente que já lista as builds).

## Fluxo de dados

- `App` busca `current-patch` **1x** no mount (mesmo padrão já usado pra `skillsById`), guarda em estado.
- Passa `currentPatch` pro Viewer e pra lista.
- Cada ponto de uso chama `patchStatus(build.patch, currentPatch)` e renderiza `<PatchBadge status={...} />`.
- Se a chamada de `current-patch` falhar, `currentPatch` fica vazio → todo status vira `unknown` (degrada sem quebrar a tela).

## Testes

- **Backend:** teste do endpoint `GET /api/meta/current-patch` (status 200 + corpo `{"patch": ...}` refletindo a config). Mantém a suíte verde (hoje 18 passam).
- **Frontend:** não há harness JS no projeto. A util `patchStatus` é pura e simples; verificação manual + no navegador:
  - build patch `"2.4"` com atual `"3.0"` → âmbar "desatualizada";
  - build patch `"3.0.3"` → sem badge;
  - build patch vazio → cinza "patch ?".

## Arquivos tocados

- `backend/app/config.py` — campo `current_patch`.
- `backend/app/routers/meta.py` — endpoint `GET /api/meta/current-patch`.
- `backend/tests/` — teste do endpoint.
- `frontend/src/api.js` — `currentPatch()` (fetch do endpoint).
- `frontend/src/patchStatus.js` — util pura (novo).
- `frontend/src/components/PatchBadge.jsx` — componente (novo).
- `frontend/src/App.jsx` — busca current-patch, passa pro Viewer + lista, renderiza badge.

## Não-objetivos

- Não comparar nível de hotfix (major.minor só — patch de hotfix não marca desatualizada).
- Não buscar o patch atual da Blizzard automaticamente (sem scraping/ingest aqui).
- Não bloquear nada: a flag é puramente informativa.
