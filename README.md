# D4 Meta Forge

Sistema próprio para **criar, versionar e comparar builds de Diablo 4**, com
calculadora de dano e um agregador de *metadados* das melhores fontes da
comunidade. Monorepo pronto para GitHub e deploy.

> **Não é um scraper.** A decisão de arquitetura mais importante deste projeto
> é como obtemos dados de forma legítima — ver abaixo.

---

## Estratégia de dados (legal e sustentável)

| Camada | Fonte | Como usamos |
|---|---|---|
| **Game data** (skills, aspects, uniques, affixes, glyphs) | [`DiabloTools/d4data`](https://github.com/DiabloTools/d4data) — JSON parseado pela comunidade | Cache local via `scripts/fetch_gamedata.py`. Assets continuam **propriedade da Blizzard**; só lemos JSON público. |
| **Patch notes** | [Blizzard oficial](https://news.blizzard.com/en-us/diablo4) | Gating de validade da build (campo `patch`). |
| **Maxroll / Icy-Veins / d4builds / Mobalytics** | sites de guia | **Só referências** (nome, classe, tier, URL, data). **Nunca** rehospedamos o corpo dos guias — ToS + copyright. Link-out com atribuição, respeitando `robots.txt`. |
| **Builds** | nós | Conteúdo **original** no formato FORGE JSON. 100% nosso. |

Isso evita DMCA, evita scrapers que quebram a cada hotfix, e mantém o projeto
defensável.

---

## Arquitetura

```
┌─────────────┐     REST/JSON      ┌──────────────────────────┐
│  Frontend   │ ◄────────────────► │  Backend (FastAPI)        │
│  React+Vite │                    │  • builds CRUD            │
│  (FORGE UI) │                    │  • damage engine          │
└─────────────┘                    │  • meta: sources/patch    │
                                   │  • gamedata search        │
                                   └──────────┬───────────────┘
                                              │
                          ┌───────────────────┼───────────────────┐
                          ▼                   ▼                   ▼
                   SQLite/Postgres     d4data JSON cache     robots-aware
                   (builds, refs)      (skills/aspects)      ingest (RSS)
```

### Backend (`backend/app`)
- `damage.py` — **engine de dano**: modifiers no mesmo *bucket* somam
  (additive); buckets multiplicam entre si. A atribuição de bucket vem do
  caller (game data), nunca hard-coded — fica correta entre patches.
- `models.py` — `Build`, `SourceRef`, `PatchNote` (SQLModel).
- `routers/` — `builds` (CRUD), `calc` (dano), `meta` (sources/patch/gamedata).
- `gamedata.py` — leitura do cache d4data. `ingest.py` — fetch respeitando robots.

### Frontend (`frontend/src`)
- `App.jsx` — shell conectado à API (lista + viewer + radar).
- O **editor completo é o artifact FORGE** já entregue: salve como
  `src/components/BuildForge.jsx` e troque `<Viewer/>` por
  `<BuildForge build={selected} onSave={saveBuild} />`.

---

## Quickstart (local)

```bash
# backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload          # http://localhost:8000/docs

# frontend (outro terminal)
cd frontend
npm install
npm run dev                            # http://localhost:5173
```

Seed automático: a build **Tal Rasha Convergence Sorc** já entra no banco.

### Testar a calculadora
```bash
curl -X POST localhost:8000/api/calc/damage -H 'content-type: application/json' -d '{
  "base_hit": 10000,
  "hits_per_second": 3,
  "crit_chance": 0.6, "crit_damage_bonus": 1.5,
  "vulnerable_uptime": 0.9, "vulnerable_bonus": 0.2,
  "modifiers": [
    {"name":"Tal Rasha 3 elem","bucket":"tal_rasha","value":0.75},
    {"name":"Elemental Constellation","bucket":"constellation","value":0.4},
    {"name":"+Fire dmg","bucket":"additive","value":1.2}
  ]
}'
```

---

## Deploy

```bash
docker compose up --build      # api :8000  ·  web :8080
```

- **Frontend** → Vercel/Netlify (`frontend/`, build `npm run build`, output `dist`).
- **Backend** → Fly.io / Railway / Render (Docker). Setar `DATABASE_URL`
  (Postgres) e `CORS_ORIGINS` com o domínio do front.
- CI em `.github/workflows/ci.yml` (ruff + import check + build do front).

---

## Game data
```bash
# edite FILES em scripts/fetch_gamedata.py com os paths atuais do d4data
python scripts/fetch_gamedata.py      # popula backend/data/gamedata/*.json
```

---

## Roadmap
- [ ] Engine: calibrar buckets com números reais por skill (a partir do d4data).
- [ ] Comparador de builds (radar sobreposto + tabela de critérios).
- [ ] Export Markdown → folha de entrada do d4builds.gg a partir do JSON.
- [ ] Ingest: parser de RSS/sitemap por publisher → `SourceRef`.
- [ ] Flag de validade: comparar `build.patch` vs. patch atual da Blizzard.
- [ ] Auth (multi-usuário) + share links.

## Licença / atribuição
Código sob MIT (sugerido). Game data e nomes são propriedade da Blizzard
Entertainment; consulte a ToS da Blizzard e dos repositórios upstream.
```
