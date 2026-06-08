# Wooking for Work — Job Hunting Automation

Swedish/European IT job hunting with Reactive Resume, AFFiNE, and MCP automation.

## Architecture

- **Backend**: Express 5 + ESM (`"type": "module"`), Node >= 22, port 3002
- **Database**: SQLite (`data/wooking.db`) with auto-init schema
- **Frontend**: Dual setup - legacy SPA (`public/`) + modern Vite+React (`frontend/`)
- **Agent Runtime**: MCP servers + OpenCode orchestration

---

## Critical Commands & Setup

### Development
- **`npm run dev`** = Backend with watch mode (`node --watch src/server.js`)
- **`npm run dev:full`** = Backend + Vite frontend concurrently (ports 3002 + 5173)
- **`npm run frontend:build`** = Build Vite frontend to `frontend/dist/`
- **`npm run db:reset`** = Reset database (deletes all data)

### Docker Deployment
- **Image**: `node:22-alpine` with better-sqlite3 build deps
- **Network**: `host` mode (required for MCP servers)
- **Volume**: `./data:/app/data` (persistent database)
- **Health check**: `wget -q --spider http://localhost:3002/health`

---

## MCP Authentication & Quirks

### LinkedIn MCP (Critical)
- **Requires Xvfb**: Use `scripts/linkedin-mcp.sh` wrapper - handles display management
- **Session flow**: Initialize → extract `mcp-session-id` header → reuse → close
- **One-time setup**: `xvfb-run uvx linkedin-scraper-mcp@latest --login`

### Reactive Resume MCP
- **OAuth flow**: First use opens browser for login to your RxResume instance
- **API endpoint**: `https://resume.aldervall.se/mcp` ( configured in opencode.json)
- **CRITICAL**: Always fetch NEW resume ID after duplicate - never save base data

### AFFiNE MCP
- **Currently disabled**: Set `AFFINE_BASE_URL`, `AFFINE_API_TOKEN`, `AFFINE_MCP_AUTH_MODE` in `.env` to enable
- **Workspace ID**: `ef4c1ba3-f9e4-44ae-a0a7-c71bb7828b30` (configured)

---

## Authentication

### Overview
All API routes (except `/health`) require session-based authentication. Sessions use `express-session` with `connect-sqlite3` store backed by SQLite. The session cookie `connect.sid` is httpOnly, `sameSite: 'lax'`, with a 7-day rolling expiry.

### Auth Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account (email, password, name) |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Destroy session |
| GET | `/api/auth/me` | Get current user info |

### Register
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"your-password","name":"Your Name"}' \
  -c /tmp/cookies.txt
```

### Login
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"your-password"}' \
  -c /tmp/cookies.txt
```

### Session Cookie
- **Name**: `connect.sid`
- **Flags**: httpOnly, `sameSite: 'lax'`
- **Expiry**: 7 days (rolling)
- **Store**: SQLite via `connect-sqlite3`

### Auth Middleware
- **`requireAuth`** — Returns 401 if no valid session. Applied to all `/api/*` routes.
- **`optionalUser`** — Sets `req.currentUser` if session exists, otherwise continues silently.

### Data Scoping
All resources are scoped to `user_id`:
- `jobs`, `activities`, `runs` — job pipeline data
- `profiles` — user profile (single row per user)
- `tokens` — OAuth tokens
- `user_credentials` — encrypted credentials

### Credential Encryption
Credentials stored in `user_credentials` are encrypted with **AES-256-GCM** using the `CREDENTIAL_ENCRYPTION_KEY` from `.env`.

### Environment Variables
```
SESSION_SECRET=<random-string>
CREDENTIAL_ENCRYPTION_KEY=<32-byte-hex-key>
```
See `.env.example` for defaults.

### Integration Test
```bash
bash scripts/test-auth-flow.sh
```
Runs 29 tests covering register, login, logout, session expiry, scoped data access, and credential encryption.

---

## Python Environment (CrewAI)

### Required Setup
- **uv** package manager mandatory (`uv run` commands)
- **Python 3.10-3.12** with `src` layout
- **Run from repo root**: `PYTHONPATH=src uv run --directory src/resume_optimizer python -m resume_optimizer.main`

### Common Commands
```bash
# Run CrewAI optimizer
PYTHONPATH=src uv run --directory src/resume_optimizer python -m resume_optimizer.main \
  --job-listing /tmp/job_listing.json \
  --job-enrichment /tmp/job_enrichment.json \
  --resume /tmp/resume.json \
  --company-name "Company AB"
```

---

## Frontend Architecture

### Dual Frontend Setup
- **Legacy**: `public/` with runtime Babel (served directly by Express)
- **Modern**: `frontend/` with Vite + React (port 5173, proxies to backend)
- **Shared components**: `frontend/src/shared/` - works in both environments via bridge

### Key Files
- **Vite config**: `frontend/vite.config.js` - proxies `/api/*` to backend
- **Shared bridge**: `public/js/shared-components-bridge.js` - enables legacy frontend to use modern components
- **No CI/tests/lint** by design

---

## Job Application Pipeline

### Resume Operations (CRITICAL)
1. **Always call `reactive_resume_get_resume` on NEW ID after duplicate** - saving base data breaks links
2. **NEVER auto-send** - save locally for review, set `isPublic: true` only after approval
3. **Slugs must be unique**: CV=`[company]-[role]-$(date +%s)`, PB=`pb-[company]-[role]-$(date +%s)`
4. **Never mix Swedish and English** in same resume

### Cover Letter (Personligt Brev)
- Create as separate RxResume document with `pb-` slug prefix
- Clear all sections except profiles, set single-page layout
- Export PDF and save locally before approval

---

## Database & Storage

### SQLite Schema
- **Auto-initializes** on startup (`src/database/db.js`)
- **WAL mode** enabled for better concurrency
- **Tables**: `jobs`, `activities`, `runs`, `states`, `commands`, `profiles`, `tokens`

### File Storage
- **NEVER commit**: `.env`, `resumes/tailored/*.json`, `cover-letters/*.json`, `*.pdf`
- **Gitignore**: Personal data directories excluded by design
- **Backups**: Local copies in `resumes/tailored/` and `cover-letters/`

---

## Error Handling

### Reactive Resume
- `RESUME_SLUG_ALREADY_EXISTS` → Use timestamp-based slug
- `INVALID_PATCH_OPERATIONS` → Check JSON Patch syntax against schema
- `RESUME_LOCKED` → Unlock first

### LinkedIn
- Session management → Use `scripts/linkedin-mcp.sh` wrapper
- Display issues → Xvfb handles automatically

### Frontend
- Dual frontend compatibility → Shared components bridge handles differences

---

## Step 1: Scrape — Find Jobs

**Arbetsförmedlingen MCP** (public API, no auth):
- `arbetsformedlingen_af_search_jobs` — 3 location searches (primary/secondary/tertiary city + region), `remote: true`, `radius: [your-radius-km]`
- Keywords: `["IT", "DevSecOps", "systemtekniker", "IT-stöd", "IT-projektledare"]`
- Save results to `job-listings/[source]-YYYY-MM-DD.json`

**LinkedIn MCP** (Xvfb browser, auth via `LINKEDIN_EMAIL`/`LINKEDIN_PASSWORD` in `.env`):
- **CRITICAL**: Use `scripts/linkedin-mcp.sh` wrapper script - handles Xvfb display management
- Session management: Initialize via POST `/mcp`, extract `mcp-session-id` header, pass in subsequent calls
- Tools: `search_jobs`, `get_job_details`, `get_company_profile`, `search_people`, `get_person_profile`
- Close session with `close_session` when done
- **LinkedIn has TWO auth paths**: (1) Xvfb browser MCP for scraping (works with .env credentials); (2) OAuth API for profile import (returns 400 if `LINKEDIN_CLIENT_ID` not in `.env`)

**Context7 MCP** (no auth — `context7_resolve-library-id` + `context7_query-docs`):
- Use for unfamiliar technologies in job postings to extract keywords for resume tailoring

> **AFFiNE MCP is `"enabled": false`** in `opencode.json` — set `AFFINE_BASE_URL`, `AFFINE_API_TOKEN`, `AFFINE_MCP_AUTH_MODE` in `.env` and re-enable to use.

## Step 2: Evaluate — Match Job vs Profile

For each high-match job:
1. `arbetsformedlingen_af_get_job` — full listing with description
2. `arbetsformedlingen_af_enrich_job_text` — extract skills with probability scores
3. `context7_query-docs` — research unfamiliar technologies
4. Filter: within [your-city] ±[your-radius]km, active deadline, IT roles
5. Add to AFFiNE (if enabled) with template from `.opencode/rules/job-listings-affine.md`
6. Tag by urgency: `Gott om tid` (>21d green) / `Nära deadline` (8-21d blue) / `Brådskande` (<7d yellow)

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
- Agents/tasks defined in YAML (`src/resume_optimizer/src/resume_optimizer/config/agents.yaml`, `src/resume_optimizer/src/resume_optimizer/config/tasks.yaml`) — Swedish language
- Models: Pydantic (`src/resume_optimizer/src/resume_optimizer/models.py`)

### Python Environment
- **uv** package manager required (`uv run` commands)
- Python 3.10-3.12 required (specified in `pyproject.toml`)
- **CrewAI 0.95.0+** dependency with tools extension
- **CRITICAL**: Run from repo root, not from within `src/resume_optimizer/`

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
- Never mix Swedish and English in same resume
- Validate operations against [RxResume JSON schema](https://rxresu.me/schema.json)
- RxResume MCP tools: `list_resumes`, `get_resume`, `duplicate_resume`, `patch_resume`, `update_resume`, `export_resume_pdf`, `delete_resume`, `lock_resume`, `unlock_resume`

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

## Monthly Activity Report (Aktivitetsrapport)

Mandatory submission every calendar month (by last day) to Arbetsförmedlingen via Unionen A-Kassa. See `.opencode/rules/activity-report.md`. Fields: Yrkesroll, Arbetsgivare, Omfattning, Plats, Annons?, Datum sökt. Template at `cover-letters/mall-aktivitetsrapport.md`.

## Critical Constraints

- **Never commit**: `.env`, `resumes/tailored/*`, `cover-letters/*.json`, `*.pdf`, `src/resume_optimizer/output/`
- **No auto-send** — save locally for review, apply manually after approval
- **No SMTP** — no code sends email ever
- Prefer MCP tools over raw curl/API calls
- `.opencode/rules/*.md` (6 files) are auto-loaded every session
- Customization placeholders `[your-*]` in `.opencode/rules/*.md` — update before first use
- **Database tables**: `jobs` (9 pipeline states), `activities`, `runs`, `states`, `commands`, `profiles` (single-row), `tokens` (OAuth)

## Development Quirks & Setup

### Frontend Development
- **Dual Frontend**: Legacy SPA in `public/` (runtime Babel) + modern Vite+React in `frontend/`
- **Shared Components**: `frontend/src/shared/` provides components for both frontends
- **Build Command**: `npm run frontend:build` outputs to `frontend/dist/`
- **Proxy**: Vite proxies `/api/*` to backend at `localhost:3002`

### LinkedIn MCP Setup
- **Xvfb Management**: Use `scripts/linkedin-mcp.sh` wrapper - handles display management automatically
- **Session Handling**: Initialize session, extract `mcp-session-id` header, reuse in subsequent calls
- **One-time Login**: Run `xvfb-run uvx linkedin-scraper-mcp@latest --login` to save session to `~/.linkedin-mcp/profile/`

### Python Environment
- **uv Required**: Must use `uv run` for CrewAI dependencies
- **Src Layout**: `PYTHONPATH=src` required when running CrewAI from repo root
- **No Python Tests**: No pytest, unittest, or CI for Python code by design

### File Conventions
- **ES Modules**: Backend uses `"type": "module"` - no `.js` extensions on imports
- **UUID Generation**: Prefer `crypto.randomUUID()` over `uuid` npm package
- **Gitignore**: Personal data (resumes, cover letters) and output directories are excluded