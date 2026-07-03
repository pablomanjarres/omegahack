# OmegaHack

> CAROL: a pipeline of agents that receives, de-identifies, classifies, and legally clocks a Colombian city hall's citizen complaints.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=flat&logo=turborepo&logoColor=white)
![Next.js 14](https://img.shields.io/badge/Next.js%2014-000000?style=flat&logo=nextdotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white)
![Postgres + pgvector](https://img.shields.io/badge/Postgres%20%2B%20pgvector-4169E1?style=flat&logo=postgresql&logoColor=white)
![Claude](https://img.shields.io/badge/Claude-D97757?style=flat&logo=anthropic&logoColor=white)
![Vitest](https://img.shields.io/badge/tested%20with-Vitest-6E9F18?style=flat&logo=vitest&logoColor=white)
![Status](https://img.shields.io/badge/status-hackathon%20build-c8542a?style=flat)
[![Portfolio](https://img.shields.io/badge/portfolio-pablomanjarres.com-c8542a?style=flat)](https://pablomanjarres.com/portfolio/projects/omegahack)

Colombian public entities are legally required to answer every citizen PQRSD (petition, complaint, claim, suggestion, or report) inside strict business-day deadlines set by Ley 1755/2015, and to protect personal data under Ley 1581/2012. Miss a deadline and the citizen can file a *tutela*. CAROL is the backend that keeps that from happening. Complaints arrive through any channel, a chain of agents validates and scrubs them, a classifier routes each one to the right secretaría, and a legal-deadline engine tracks every clock in Colombian business days. Built for the OmegaHack 2026 challenge (Alcaldía de Medellín).

## Highlights

- **Legal deadline engine.** Colombian business-day math with Ley Emiliani movable holidays, Easter-derived dates, per-tenant suspensions, and the Ley 1755/2015 rule that an extension cannot exceed 2× the original term. Zero runtime dependencies, fully offline, **407 tests at 100% line coverage**, including a fast-check property test at 10,000 iterations.
- **Multi-agent intake pipeline.** Validate the schema, compute a SHA-256 `source_hash` for idempotent dedup, classify with Claude, preserve text in three forms (`raw` / `display` / `llm`) while redacting PII into `llm_text`, derive validity against municipal-competence gates, then summarize, tag, and cluster into a problem group. The run emits a structured intake event, and a Postgres trigger mirrors every `pqr_events` row into an append-only `pqr_audit` log.
- **Structured classification.** A Claude 3.5 Sonnet classifier turns free-text complaints into one of 6 PQRSD types, 26 official secretaría codes, a comuna (1–16) or corregimiento, namespaced tags, and signals like a 0–1 `tutela_risk_score`.
- **PII by law.** `@omega/habeas-data` sorts every field into four Ley 1581/2012 sensitivity levels (public / semiprivate / private / sensitive), and only the PII-free `llm_text` ever reaches a model.
- **Public transparency with k-anonymity.** Comuna density maps (Leaflet) and secretaría SLA rankings (Recharts) built from aggregate views. Any bucket with fewer than 5 complaints is suppressed before it leaves the server (k≥5).
- **Tenant isolation in the database.** Every business table carries `tenant_id` under RLS. Three role-scoped Postgres clients (`app_operational`, `app_qa_reader`, service-role) issue `SET ROLE` on connect, so queries can only touch their tenant's rows.

## How it works

Turborepo monorepo: four frontends, eleven shared TypeScript packages, four Supabase edge functions (Deno), one Postgres with pgvector and RLS.

```
apps/
  landing      CAROL citizen portal (Vite + TanStack Router + React 19): radicar, seguimiento por radicado (MED-YYYYMMDD-XXXXXX)
  web          public "transparencia" dashboards (Next.js 14, Leaflet, Recharts, k-anonymity)
  workbench    legal queue: bandeja, PQR detail, problem groups, auditoría
  secretaria   sectoral + director view per secretaría
packages/
  intake-agent    orchestrator: validate → source_hash → classify → format-preserve/redact → validity → resumen → tags → group
  classifier      Claude PQRSD classifier (tipo, secretaría, comuna, tags, señales)
  deadline-engine Colombian business-day deadline math (407 tests, 100% lines)
  habeas-data     PII classification + redaction (Ley 1581/2012)
  problem-groups  cosine-similarity clustering, flags "hot" clusters by member volume in a rolling window
  rag             heading-aware chunking + hybrid (vector + FTS) retriever, 1024-dim embeddings
  search · tags · db · config-ts · config-eslint
services/edge-functions/   intake-agent · pqr-nella-indexer · qa-ingest · reembed-pqr
```

An alternate n8n + Gemini intake path (see `docs/n8n.md`) is documented to converge on the same tables as the TypeScript pipeline: `public.pqr` plus a `public.pqr_events` audit row.

## Tech stack

The citizen portal runs on Vite 7 + TanStack Router + React 19; the three dashboards are Next.js 14 + React 18. Shared across the repo: TypeScript, Turborepo, Tailwind CSS. Data sits on Supabase (Postgres + pgvector + Row-Level Security) with Deno edge functions. Claude 3.5 Sonnet (Anthropic) classifies; Azure `nella-embeddings` (1024-dim) powers retrieval. Tests run on Vitest + fast-check.

## Getting started

```bash
pnpm install
cp .env.example .env    # fill in Supabase, Anthropic, and role-scoped Postgres URLs

pnpm dev                # run every app via Turborepo
# or a single surface:
pnpm --filter @omega/landing dev      # citizen portal
pnpm --filter @omega/web dev          # transparencia   (:3000)
pnpm --filter @omega/workbench dev    # legal queue      (:3001)
pnpm --filter @omega/secretaria dev   # sectoral view    (:3002)

pnpm test                                   # turbo run test
pnpm --filter @omega/deadline-engine test   # 407 legal-deadline tests
```

Minimal `.env` (placeholders only, never commit real values):

```env
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
DATABASE_URL_OPERATIONAL=postgresql://<user>:<pass>@<host>:5432/postgres
ANTHROPIC_API_KEY=sk-ant-...
```

---

Built for **OmegaHack 2026**, Alcaldía de Medellín. Part of [pablomanjarres.com/portfolio](https://pablomanjarres.com/portfolio/projects/omegahack).