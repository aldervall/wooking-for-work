# Wooking for Work — Job Hunting Automation

Swedish/European IT job hunting. Three pillars: **Reactive Resume** (CV truth), **AFFiNE** (docs hub), **this repo** (MCP + CrewAI + web UI).

---

## Core Pipeline (Every Job)

> **1. Scrape → 2. Evaluate → 3. Optimize (CrewAI) → 4. Upload to RxResume**

Flow: `@job-scraper` agent → `@research` agent → `@resume-optimizer` agent → manual approval → set `isPublic: true`

---

## Runtime Essentials

- **Backend**: `src/server.js` — Express 5, ESM (`"type": "module"`), Node >= 22, port 3002 (`PORT` env)
- **DB**: `data/wooking.db` — `better-sqlite3` (synchronous), WAL mode. Schema auto-inits on startup (`src/database/db.js`)
- **`npm run dev`** = `node --watch src/server.js`
- **`npm run dev:full`** = backend + Vite frontend concurrently
- **`npm run db:reset`** = `rm -f data/wooking.db && npm run seed`
- **UUID**: `crypto.randomUUID` (preferred) vs `uuid` npm package (legacy in auth.js, scrape.js). Use built-in for new code.
- **Frontend**: Two modes — legacy SPA (`public/`, runtime Babel) or Vite+React (`frontend/`, port 5173)
- No CI, no tests, no lint by design
- `src/middleware/`, `src/session/`, `src/transport/` are empty stubs

---

## Step 1: Scrape — Find Jobs

**Arbetsförmedlingen MCP** (public API, no auth):
- `arbetsformedlingen_af_search_jobs` — 3 location searches (primary/secondary/tertiary city + region), `remote: true`, `radius: [your-radius-km]`
- Keywords: `["IT", "DevSecOps", "systemtekniker", "IT-stöd", "IT-projektledare"]`
- Save results to `job-listings/[source]-YYYY-MM-DD.json`

**LinkedIn MCP** (Xvfb browser, auth via `LINKEDIN_EMAIL`/`LINKEDIN_PASSWORD` in `.env`):
- Start: `xvfb-run uvx linkedin-scraper-mcp@latest --transport streamable-http --port PORT`
- Initialize session (POST `/mcp`), extract `Mcp-Session-Id` header, pass in subsequent calls
- Tools: `search_jobs`, `get_job_details`, `get_company_profile`, `search_people`, `get_person_profile`
- Close session with `close_session` when done
- **LinkedIn has TWO auth paths**: (1) Xvfb browser MCP for scraping (works with .env credentials); (2) OAuth API for profile import (returns 400 if `LINKEDIN_CLIENT_ID` not in `.env`)

**Context7 MCP** (no auth — `context7_resolve-library-id` + `context7_query-docs`):
- Use for unfamiliar tech in job postings to extract keywords

> **AFFiNE MCP is `"enabled": false`** in `opencode.json` — set `AFFINE_BASE_URL`, `AFFINE_API_TOKEN`, `AFFINE_MCP_AUTH_MODE` in `.env` and re-enable to use.

---

## Step 2: Evaluate — Match Job vs Profile

For each high-match job:
1. `arbetsformedlingen_af_get_job` — full listing with description
2. `arbetsformedlingen_af_enrich_job_text` — extract skills with probability scores
3. `context7_query-docs` — research unfamiliar technologies
4. Filter: within [your-city] ±[your-radius]km, active deadline, IT roles
5. Add to AFFiNE (if enabled) with template from `.opencode/rules/job-listings-affine.md`
6. Tag by urgency: `Gott om tid` (>21d green) / `Nära deadline` (8-21d blue) / `Brådskande` (<7d yellow)

---

## Step 3: Optimize — CrewAI Pipeline

### Data Gathering (MCP tools)
Before running CrewAI, collect these into `/tmp/resume-optimizer/`:
1. `arbetsformedlingen_af_get_job` — full job listing JSON
2. `arbetsformedlingen_af_enrich_job_text` — skill enrichment JSON
3. `reactive_resume_get_resume` — current resume JSON (find ID via `reactive_resume_list_resumes`)
4. `get_company_profile` (LinkedIn) — optional company research JSON

### Run the Crew

```bash
PYTHONPATH=src uv run --directory src/resume_optimizer python -m resume_optimizer.main \
  --job-listing /tmp/resume-optimizer/job_listing.json \
  --job-enrichment /tmp/resume-optimizer/job_enrichment.json \
  --resume /tmp/resume-optimizer/resume.json \
  --company-name "Company AB" \
  --company-data /tmp/resume-optimizer/company_data.json
```

> **CRITICAL**: `PYTHONPATH=src` is required — the package uses src-layout (`src/resume_optimizer/src/resume_optimizer/`). Run from repo root.

### Pipeline (5 agents, sequential, Swedish prompts)
1. `job_analyzer` → `output/job_analysis.json` (structured requirements + match scores)
2. `resume_analyzer` → `output/resume_optimization.json` (content suggestions)
3. `company_researcher` → `output/company_research.json` (company insights)
4. `resume_writer` → `output/patch_operations.json` (JSON Patch RFC 6902 ops for RxResume)
5. `report_generator` → `output/final_report.md` (Swedish summary)

### Config
- `OPENAI_API_KEY` in `.env` (required)
- `OPENAI_MODEL` in `.env` (default: `gpt-4o`)
- Agents/tasks defined in YAML (`config/agents.yaml`, `config/tasks.yaml`) — Swedish language
- Models: Pydantic (`models.py`)

---

## Step 4: Upload to Reactive Resume

### CV — Apply Patches
1. Read `output/patch_operations.json` — extract `operations` array + `target_resume_name`
2. `reactive_resume_duplicate_resume` — duplicate base resume (find ID via list)
3. `reactive_resume_patch_resume` — apply the operations array
4. `reactive_resume_update_resume` — set slug: `[company]-[role]-$(date +%s)`
5. `reactive_resume_export_resume_pdf` — generate PDF
6. **CRITICAL**: `reactive_resume_get_resume` on the **NEW** resume ID, save to `resumes/tailored/[company]-[role]-YYYY-MM-DD.json`
7. User reviews → if approved → set `isPublic: true`

### Personligt Brev (Cover Letter) — Separate RxResume Doc
1. `reactive_resume_duplicate_resume` — name: `"[Company] - [Role] - Personligt Brev"`
2. Patch: set `basics.headline` → `"[Role] — Personligt Brev"`, replace `summary` with HTML cover letter
3. Clear all sections (`experience.items`, `education.items`, `skills.items` → `[]`), keep only `sections.profiles`
4. Set layout → patch `metadata.layout` for single page, summary only, empty sidebar
5. `reactive_resume_update_resume` — set slug: `pb-[company]-[role]-$(date +%s)`
6. `reactive_resume_export_resume_pdf`
7. **CRITICAL**: `reactive_resume_get_resume` on new ID, save to `cover-letters/[company]-[role]-YYYY-MM-DD.json`
8. Create markdown at `cover-letters/[company]-[role]-YYYY-MM-DD.md` with link to your RxResume instance

### Critical RxResume Rules
- **Always call `reactive_resume_get_resume` on the NEW ID after duplicate** — saving base data with wrong slug/id breaks links
- **NEVER auto-send** — save locally for user review. Set `isPublic: true` only after manual approval
- Slugs must be unique: CV=`[company]-[role]-$(date +%s)`, PB=`pb-[company]-[role]-$(date +%s)`
- Never mix Swedish and English in the same resume
- Validate operations against [RxResume JSON schema](https://rxresu.me/schema.json)
- RxResume MCP tools: `list_resumes`, `get_resume`, `duplicate_resume`, `patch_resume`, `update_resume`, `export_resume_pdf`, `delete_resume`, `lock_resume`, `unlock_resume`

---

## API Endpoints (Server at `localhost:3002`)

| Route | Notes |
|---|---|
| `GET /api/jobs` | Filter: `state`, `src`, `q`, `minMatch`, `maxDistance`, `remote` |
| `POST /api/jobs` | Create job |
| `GET/PATCH/DELETE /api/jobs/:id` | Standard CRUD |
| `GET /api/activities` | `?jobId=&month=&evidence=` |
| `POST/DELETE /api/activities/:id` | Create/delete |
| `GET /api/runs` | `?jobId=&status=` |
| `POST/PATCH /api/runs` | Run lifecycle |
| `GET /api/profile` / `PATCH /api/profile` | Single-row profile (`id='default'` in `profiles` table) |
| `POST /api/profile/linkedin` | Trigger LinkedIn import with `{url}` body |
| `GET /api/auth/linkedin` | LinkedIn OAuth redirect (returns 400 if unconfigured) |
| `GET /api/auth/linkedin/callback` | OAuth callback |
| `GET /api/auth/linkedin/status` | Check OAuth connection |
| `POST /api/scrape/start` | Start job scrape (async, SSE log stream at `GET /api/scrape/stream`) |
| `GET /health` | Health check |

---

## MCP Servers (configured in `opencode.json`)

| Server | Auth | Status |
|--------|------|--------|
| `arbetsformedlingen` | None (public) | ✅ Enabled |
| `linkedin` | Email+PW (Xvfb browser) | ✅ Enabled |
| `reactive-resume` | OAuth (remote, first-use browser login) | ✅ Enabled |
| `context7` | None (remote) | ✅ Enabled |
| `affine` | Bearer token | ❌ Disabled — set `AFFINE_BASE_URL` + `AFFINE_API_TOKEN` + `AFFINE_MCP_AUTH_MODE` in `.env` |
| `claude-cli` | OAuth (local CLI) | ✅ Enabled |

Agents (`@name`) defined in `.opencode/agents/*.md`: `@job-scraper`, `@resume-tailor`, `@resume-optimizer`, `@affine-docs`, `@research`.

---

## Monthly Activity Report (Aktivitetsrapport)

Mandatory submission every calendar month (by last day) to Arbetsförmedlingen via Unionen A-Kassa. See `.opencode/rules/activity-report.md`. Fields: Yrkesroll, Arbetsgivare, Omfattning, Plats, Annons?, Datum sökt. Template at `cover-letters/mall-aktivitetsrapport.md`.

---

## Critical Constraints

- **Never commit**: `.env`, `resumes/tailored/*`, `cover-letters/*.json`, `*.pdf`, `src/resume_optimizer/output/`
- **No auto-send** — save locally for review, apply manually after approval
- **No SMTP** — no code sends email ever
- Prefer MCP tools over raw curl/API calls
- `.opencode/rules/*.md` (6 files) are auto-loaded every session
- Customization placeholders `[your-*]` in `.opencode/rules/*.md` — update before first use
- **Database tables**: `jobs` (9 pipeline states), `activities`, `runs`, `states`, `commands`, `profiles` (single-row), `tokens` (OAuth)