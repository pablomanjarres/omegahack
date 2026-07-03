<p align="center"><a href="https://pablomanjarres.com/oss/omegahack"><img src=".github/banner.png" alt="OmegaHack / CAROL" width="100%" /></a></p>

<h1 align="center">CAROL</h1>

<p align="center"><em>PQRSD for Colombian alcaldías: receive, validate, classify, and never miss the legal deadline.</em></p>

<p align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://turborepo.com/"><img src="https://img.shields.io/badge/Turborepo-2.5-EF4444?logo=turborepo&logoColor=white" alt="Turborepo" /></a>
  <a href="https://pnpm.io/"><img src="https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white" alt="pnpm" /></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white" alt="Next.js" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18_and_19-149ECA?logo=react&logoColor=white" alt="React" /></a>
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Postgres_%2B_pgvector-3FCF8E?logo=supabase&logoColor=white" alt="Supabase Postgres and pgvector" /></a>
  <a href="https://www.anthropic.com/"><img src="https://img.shields.io/badge/Claude-Anthropic-D97757?logo=anthropic&logoColor=white" alt="Anthropic Claude" /></a>
  <a href="https://deno.com/"><img src="https://img.shields.io/badge/Deno-edge_functions-000000?logo=deno&logoColor=white" alt="Deno" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38BDF8?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /></a>
</p>

<p align="center">
  <a href="#license"><img src="https://img.shields.io/badge/License-MIT-22C55E.svg" alt="MIT License" /></a>
  <a href="https://omega-landing-zeta.vercel.app"><img src="https://img.shields.io/badge/status-v1.0_pilot-6366F1" alt="Status: v1.0 pilot" /></a>
  <a href="https://pablomanjarres.com/portfolio/projects/omegahack"><img src="https://img.shields.io/badge/Portfolio-write--up-FF7043?logo=readme&logoColor=white" alt="Portfolio write-up" /></a>
  <a href="https://pablomanjarres.com/oss/omegahack"><img src="https://img.shields.io/badge/Landing-pablo--oss-000000?logo=vercel&logoColor=white" alt="Landing page" /></a>
</p>

<p align="center">
  <a href="https://omega-landing-zeta.vercel.app"><img src="https://img.shields.io/badge/%E2%96%B6_Live_demo-omega--landing-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Open the live demo" /></a>
</p>

<p align="center"><b>Live demo:</b> <a href="https://omega-landing-zeta.vercel.app">omega-landing-zeta.vercel.app</a></p>

---

## What CAROL is

CAROL is the PQRSD engine an alcaldía runs so citizen petitions never miss their legal deadline. A petition arrives from a web form, an email, or an n8n webhook. CAROL strips the personal data, checks the petition against Ley 1755/2015, routes it to one of 26 secretarías and 16 comunas, and starts the legal clock on Colombian business days. The legal team then works one queue, ordered by tutela risk and time left.

PQRSD (Peticiones, Quejas, Reclamos, Sugerencias, Denuncias) are the formal channels every Colombian can use to petition or report to a government office. Each one carries a response deadline in law, and a missed deadline can turn into a tutela (a constitutional injunction). CAROL was built for OmegaHack, aimed at the Alcaldía de Medellín, and it is multi-tenant from the first row.

The name spells out the job: **C**ontrol, **A**utomatización, **R**azonamiento, **O**rganización, **L**ogística.

## Highlights

- **Multi-channel intake.** Web form, email, or `POST /pqrs/intake` from n8n. Anonymous or identified.
- **Idempotent radicado.** Every petition gets a `MED-YYYYMMDD-XXXXXX` radicado plus a SHA-256 `source_hash` over the raw text, so a re-send never files a duplicate.
- **Habeas data on every text.** PII is detected and handled per Ley 1581/2012. Each PQR is stored three ways: `raw_text` (protected original), `display_text` (clean, shown to staff), and `llm_text` (no PII, the only form sent to a model).
- **AI validity and classification.** A validity agent (Claude or Gemini) checks each petition, the Article 16 gates of Ley 1755/2015 bounce the invalid ones, and the classifier sorts the rest into a `tipo`, one of 26 official secretaría codes, a comuna (1 to 16) or corregimiento, and namespaced tags.
- **A real Colombian deadline engine.** `@omega/deadline-engine` counts business days on `America/Bogota`: Ley Emiliani movable holidays, Easter-derived days, per-tenant suspensions, and the prórroga rule (an extension of at most 2x the original term). Fully offline, with property-based tests and 100% line coverage.
- **Tutela risk and priority.** The workbench queue is ordered by tutela risk score and remaining days, so the highest-risk petitions surface first.
- **Problem Groups.** PQRs cluster by embedding similarity plus tag overlap plus comuna, and a group is flagged `hot` when it crosses volume and velocity thresholds. Recurring territorial problems become visible.
- **Public transparency.** The `/transparencia` dashboard is public and enforces k-anonymity of at least 5 at the database level.
- **Append-only audit.** Every state change emits a `pqr_events` row. The full history of a petition reconstructs from that event log.
- **Multi-tenant by RLS.** Every business table carries `tenant_id`. The `app_operational` role only sees its own tenant, and the `qa_bank` knowledge schema sits behind a separate `app_qa_reader` role that cannot read `public.*` at all.

## How it works

A PQR flows through one pipeline (`@omega/intake-agent`) and lands as a single row plus an event. The same pipeline runs two ways: in TypeScript/Deno from the apps, or as an n8n workflow with Gemini agents for external integrations. Both produce the exact same database state.

```
   citizen
      │
      ▼                         intake channels
 apps/web  ·  n8n webhook  ·  external (Mercurio CSV, email)
      │
      ▼
 @omega/intake-agent                    the 8-step pipeline
   ├─ 1. validate schema
   ├─ 2. radicado + source_hash          idempotency (MED-YYYYMMDD-XXXXXX)
   ├─ 3. format-preserve                 raw_text / display_text / llm_text
   ├─ 4. @omega/habeas-data              PII redaction (Ley 1581/2012)
   ├─ 5. validity agent                  Claude or Gemini
   ├─ 6. Article 16 gates                Ley 1755/2015, bounce invalid petitions
   ├─ 7. @omega/classifier               tipo · secretaría · comuna · tags
   └─ 8. @omega/deadline-engine          legal deadline in business days
      │
      ▼
 Postgres (pgvector + RLS)               pqr, pqr_events, secretarias,
      │                                  comunas, tags, problem_groups, qa_bank
      ▼
 apps/workbench  ·  apps/secretaria  ·  apps/web (/transparencia)
```

Once a PQR is stored, `@omega/problem-groups` clusters it against its tenant, `@omega/rag` and `@omega/search` power the workbench's "similar cases" and "applicable normativa" panels, and the deadline keeps counting down until a response with an immutable audit trail closes it out.

## What's inside

A pnpm + Turborepo monorepo: four apps, eleven shared packages, four Deno edge functions, one RLS test suite, and a set of corpus scripts.

### Apps (`apps/`)

| App | Port | What it serves |
| --- | --- | --- |
| `@omega/web` | 3000 | Public site and the `/transparencia` dashboard (k-anonymity of at least 5). Next.js 14, Leaflet maps, Recharts. |
| `@omega/workbench` | 3001 | The legal team's queue (cola jurídica), ordered by tutela risk and deadline. Next.js 14. |
| `@omega/secretaria` | 3002 | Per-secretaría sectoral view of assigned PQRs. Next.js 14. |
| `@omega/landing` | dev | The CAROL marketing site and the citizen portal mock (`/portal`). Vite 7, React 19, TanStack Router, Radix UI. This is the live demo. |

### Packages (`packages/`)

| Package | What it does |
| --- | --- |
| `@omega/intake-agent` | The 8-step PQR pipeline: validate, radicado, format-preserve, redact, validity, gates, classify, deadline. |
| `@omega/classifier` | Claude classification into `tipo`, one of 26 secretarías, comuna or corregimiento, and namespaced tags. Ships an `eval` harness. |
| `@omega/deadline-engine` | Colombian business-day legal deadline math (Ley Emiliani, Easter-derived holidays, per-tenant suspensions, at most 2x prórroga). Offline, 100% line coverage. |
| `@omega/habeas-data` | PII detection and controlled handling per Ley 1581/2012: cédulas, addresses, health data. |
| `@omega/problem-groups` | Clusters PQRs by embedding similarity plus tag overlap plus comuna, and flags hot recurring groups. |
| `@omega/rag` | Heading-aware chunking, Azure `nella-embeddings` (1024-dim), a hybrid vector plus full-text retriever, and the Nella client. |
| `@omega/search` | PQR search with filters: comuna, secretaría, estado, tipo, tags. |
| `@omega/tags` | The tag taxonomy across namespaces: `tema`, `subtema`, `ubicacion`, `actor`, `vulnerabilidad`, `sentimiento`. |
| `@omega/db` | Role-scoped Postgres client factories (`operational`, `qa_reader`, `service_role`) that run `SET ROLE` on connect, plus generated types. |
| `@omega/config-ts` | Shared tsconfig bases (library and Next.js). |
| `@omega/config-eslint` | Shared ESLint configs (library and Next.js). |

### Edge functions (`services/edge-functions/`, Deno)

| Function | Trigger | What it does |
| --- | --- | --- |
| `intake-agent` | Webhook or manual POST | Runs `@omega/intake-agent` on Deno. |
| `pqr-nella-indexer` | Intake POST + n8n cron | Indexes PQRs into the shared `omega-pqr-corpus` bucket (idempotent). |
| `qa-ingest` | Manual POST | Ingests markdown from the `qa-corpus` bucket into the `qa_bank` schema. |
| `reembed-pqr` | Cron, every minute | Drains `pqr_embedding_jobs` and persists 1024-dim embeddings. |

### Tests and scripts

- `tests/rls` (`@omega/rls-tests`) is the dedicated RLS suite, run with `pnpm test:rls` against the linked database.
- `scripts/` holds the corpus tooling: `benchmark.ts`, `export-pqr-corpus.ts`, `index-pqrs-to-nella.ts`, `verify-nella-index.ts`, `nella-reindex.sh`, and `gen-reference-data-migration.mjs`.

## Tech stack

| Layer | Tools |
| --- | --- |
| Monorepo | Turborepo 2.5, pnpm 10, TypeScript 5.7 |
| Public and internal apps | Next.js 14 (App Router), React 18, Tailwind CSS, Recharts, Leaflet |
| Landing and citizen portal | Vite 7, React 19, TanStack Router and Start, Tailwind CSS 4, Radix UI |
| Data | Supabase Postgres with pgvector, RLS, multi-tenant, three role profiles |
| AI | Anthropic Claude (validity and classification), Azure `nella-embeddings` (1024-dim) |
| Jobs | Deno edge functions on Supabase, one n8n workflow |
| Testing | Vitest, fast-check (property-based), golden fixtures |
| Deploy | Vercel (apps), Supabase (functions and database) |
| Observability | Sentry, Grafana Cloud |

## Getting started

Prerequisites: Node 20 or newer, pnpm 10 or newer, and the Supabase CLI. A new contributor should reach `pnpm dev` in under 10 minutes.

```bash
git clone <repo-url> omegahack
cd omegahack
pnpm install

cp .env.example .env                       # fill in real values
supabase login                             # once per machine
supabase link --project-ref <project-ref>  # config.toml is versioned
pnpm db:push                               # apply migrations to the linked project
pnpm db:types                              # regenerate packages/db/src/types.ts

pnpm dev                                   # all apps in parallel
```

Run a single app:

```bash
pnpm --filter @omega/web        dev        # http://localhost:3000  public site + /transparencia
pnpm --filter @omega/workbench  dev        # http://localhost:3001  legal queue
pnpm --filter @omega/secretaria dev        # http://localhost:3002  sectoral view
pnpm --filter @omega/landing    dev        # the CAROL landing + portal
```

## Verify and test

```bash
pnpm build            # every package and app compiles
pnpm typecheck        # strict TypeScript, no errors
pnpm lint             # ESLint across apps
pnpm test             # vitest across the workspace
pnpm test:rls         # RLS suite against the linked database
pnpm db:diff          # confirm local and remote schema agree
```

Package-focused checks:

```bash
pnpm --filter @omega/deadline-engine test:coverage    # 100% line coverage
pnpm --filter @omega/deadline-engine generate:golden  # regenerate golden fixtures
pnpm --filter @omega/classifier eval                  # classifier evaluation dataset
```

## Compliance

CAROL is built to satisfy Colombian public-sector law by design:

- **Ley 1755/2015** (derecho de petición): valid-petition gates and the business-day deadline engine.
- **Ley 1581/2012** (habeas data): PII detection and the three-form text model, so raw personal data never reaches a model or a public view.
- **Decreto 491/2020**: deadline handling for petitions filed during declared contingencies.

## License

MIT.

---

<p align="center">
  <a href="https://pablomanjarres.com/oss/omegahack">Landing</a> ·
  <a href="https://pablomanjarres.com/portfolio/projects/omegahack">Portfolio write-up</a> ·
  Built by <a href="https://pablomanjarres.com">Pablo Manjarres</a>
</p>
