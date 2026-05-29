# Ícones de skill (hot-link, reference-only) — Design

**Data:** 2026-05-29
**Projeto:** d4-meta-forge
**Frente do roadmap:** imagens de itens/skills (1ª versão — só skills)
**Status:** aprovado (design), pendente de implementação

## Problema

O planner não exibe imagens. Sites tipo Maxroll/D4Builds mostram ícones das
skills. Queremos exibir o ícone da skill selecionada na calculadora e no
viewer da build, sem re-hospedar arte da Blizzard.

## Decisões (fechadas no brainstorming)

1. **Escopo: só skills** (não itens). Skills têm id estável no catálogo curado
   (`skill_coefficients.json`); itens de gear são texto livre (sem id), então
   mapear nome→imagem seria frágil — fica fora desta versão.
2. **Fonte: hot-link via `icon_url`** por skill no catálogo, apontando para uma
   fonte que já hospeda o ícone. **Não re-hospedamos** arte da Blizzard
   (postura reference-only do projeto). Fallback para placeholder quando
   ausente ou quebrado.
3. **Onde aparece (v1):** ícone ao lado da **skill selecionada** — no DamageLab
   (`combat.skill_id`) e no Viewer da build. A lista de skills da build
   (`data.skills`, texto livre, sem id) **não** recebe ícone nesta versão.
4. `icon_url` é **opcional**: a engenharia (mecanismo + placeholder) entra
   completa; os URLs são preenchidos best-effort e crescem incrementalmente.

## Modelo de dados

`backend/app/skill_coefficients.py` — adicionar ao modelo `Skill`:

```python
    icon_url: str | None = None
```

`backend/app/data/skill_coefficients.json` — cada skill pode ganhar
`"icon_url": "https://.../icon.png"` (hot-link). Entradas sem o campo
continuam válidas (default `None`).

O endpoint `GET /api/calc/skills` já devolve o catálogo inteiro via
`SkillCatalog`, então `icon_url` flui ao frontend **sem mudança de endpoint**.

## Componente `SkillIcon` (frontend)

Novo componente reutilizável, ex.: `frontend/src/components/SkillIcon.jsx`.

- Props: `url` (string | null), `size` (número, default ex. 28), `alt`.
- Se `url` presente: renderiza `<img src={url} width=size height=size>` com
  `onError` que troca para o placeholder (estado local `failed`).
- Se `url` ausente ou `failed`: renderiza um **placeholder neutro** — um ícone
  lucide (ex.: `Sparkles`) num quadrado com a borda/cor do tema (`PALETTE`).
- Responsabilidade única: exibir um ícone de skill com degradação graciosa.
  Não busca dados nem conhece o catálogo.

## Onde aparece

### DamageLab (`BuildForge.jsx`)
Já existe `selectedSkill` (objeto do catálogo, agora com `icon_url`). Renderizar
`<SkillIcon url={selectedSkill.icon_url} />` ao lado da skill selecionada
(junto da linha "fonte: … · conf: …"). Sem novo fetch (DamageLab já busca
`getSkills`).

### Viewer (`App.jsx`)
O Viewer hoje **não** busca o catálogo. Para mostrar ícone + nome da skill de
combate:

- **`App` passa a buscar `getSkills()` uma vez** (na montagem) e monta um mapa
  `skillsById = { id: skill }`.
- Passa `skillsById` como prop ao `Viewer` e ao `ExportPanel`.
- `ExportPanel` **deixa de fazer fetch próprio** — usa o `skillsById` recebido
  (deduplica o fetch; deriva o mapa de nomes a partir dele).
- No `Viewer`, quando `build.data.combat?.skill_id` existir, exibir
  `<SkillIcon url={skillsById[id]?.icon_url} />` + o nome
  (`skillsById[id]?.name || id`).

DamageLab mantém o próprio fetch (precisa da lista completa para o picker).

## Fluxo de dados

```
skill_coefficients.json (icon_url) → /api/calc/skills (SkillCatalog)
  → DamageLab.skillCat        → selectedSkill.icon_url → <SkillIcon>
  → App.skillsById (1 fetch)  → Viewer  (combat.skill_id → icon + nome)
                              → ExportPanel (mapa de nomes p/ markdown)
```

## Sourcing dos URLs

Best-effort: pesquisar URLs de ícone hot-linkáveis para as 6 skills curadas
(Hammer of the Ancients, Whirlwind, Fireball, Ball Lightning, Bone Spear,
Barrage). Preencher `icon_url` no JSON onde encontrar fonte estável; o resto
fica no placeholder. Risco baixo — ícone ausente/errado é cosmético, não afeta
cálculo. Citar a fonte/base de URLs num comentário/nota se pertinente.

## Tratamento de erros

- `icon_url` ausente → placeholder direto.
- Hot-link quebrado (404/rede/CORS de imagem não se aplica a `<img>` para
  exibição) → `onError` troca para o placeholder. A UI nunca quebra.
- Catálogo indisponível no Viewer (fetch falhou) → sem ícone/nome resolvido;
  cai no `skill_id` (slug) como hoje. Não bloqueia a renderização da build.

## Testes

- **Backend (pytest):**
  - `Skill` aceita `icon_url` e default é `None` quando omitido.
  - `GET /api/calc/skills` inclui o campo `icon_url` nas entradas.
- **Frontend:** sem harness JS (convenção do projeto). Verificação no navegador:
  skill com `icon_url` mostra a imagem no DamageLab e no Viewer; skill sem
  `icon_url` (ou URL quebrado) mostra o placeholder; markdown segue resolvendo
  o nome via `skillsById`.

## Fora de escopo (YAGNI)

- Ícones de itens/gear (texto livre — frágil).
- Ícones na lista de skills da build (`data.skills` sem id) e no picker
  (exigiria dropdown custom).
- Re-hospedar/baixar ícones no repo (contra reference-only).
- Linkar a lista de skills da build ao catálogo (mudança estrutural maior).
