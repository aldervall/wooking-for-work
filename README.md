# Wooking for Work
![Project Screenshot](wookingforwork.png)

**AI-assisted job hunting automation for the Swedish/European IT job market.**

A modular framework built on [opencode](https://opencode.ai) that connects Reactive Resume (CV management), AFFiNE (document hub), and MCP servers (Arbetsförmedlingen, LinkedIn, Context7) into a streamlined job application pipeline.

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/aldervall/wooking-for-work.git
cd wooking-for-work

# 2. Configure environment
cp .env.example .env
# Then edit .env with your own API keys and secrets
# (see "Detailed Setup → Enviroment variables" below)

# 3. Install all dependencies
npm install

# 4. Start the backend (with auto-reload)
npm run dev

# Or start both backend + frontend:
# npm run dev:full
```

The backend starts at `http://localhost:3002`. Open it in your browser to see the job tracker UI. See [Usage](#usage-job-hunting-pipeline) for the full workflow.

---

## Prerequisites

| Tool | Version | Required For |
|------|---------|-------------|
| [opencode](https://opencode.ai) | ≥ 0.x | AI agent runtime and MCP orchestration |
| [Node.js](https://nodejs.org) | ≥ 22 | Backend server, npm dependencies |
| [Python](https://python.org) | 3.10–3.12 | CrewAI resume optimizer |
| [uv](https://docs.astral.sh/uv) | ≥ 0.4 | Python package manager for CrewAI |
| [Xvfb](https://www.x.org/releases/X11R7.6/doc/man/man1/Xvfb.1.xhtml) | any | LinkedIn headless browser (Linux only) |

---

## Detailed Setup

### Clone & Configure

```bash
git clone https://github.com/aldervall/wooking-for-work.git
cd wooking-for-work
```

### Environment Variables

Copy the template and open it in your editor:

```bash
cp .env.example .env
```

The `.env` file requires these variables:

| Variable | Required For | How to Get It |
|----------|-------------|--------------|
| `OPENAI_API_KEY` | CrewAI resume optimizer | [OpenAI API keys](https://platform.openai.com/api-keys) |
| `OPENAI_MODEL` | CrewAI agent model | Default: `gpt-4o` (optional override) |
| `RXRESUME_API_KEY` | Reactive Resume API calls | Your RxResume instance → Settings → API Key |
| `RXRESUME_API_BASE` | RxResume API endpoint | Self-hosted or `https://rxresu.me/api/openapi` |
| `RXRESUME_MCP_URL` | RxResume MCP OAuth | Same base as above, with `/mcp` path |
| `AFFINE_BASE_URL` | AFFiNE document management | Self-hosted (`http://localhost:3010`) or `https://app.affine.pro` |
| `AFFINE_API_TOKEN` | AFFiNE authentication | AFFiNE → Settings → Workspace → API Tokens |
| `AFFINE_MCP_AUTH_MODE` | AFFiNE auth mode | `bearer` |
| `LINKEDIN_EMAIL` | LinkedIn job scraping | Your LinkedIn login email |
| `LINKEDIN_PASSWORD` | LinkedIn job scraping | Your LinkedIn login password |
| `SESSION_SECRET` | Backend session cookies | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `CREDENTIAL_ENCRYPTION_KEY` | User credential encryption | 64 hex chars: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

### Install Dependencies

```bash
npm install
```

This installs both backend dependencies (Express, SQLite, Playwright) and frontend dependencies (Vite, React) via the workspace setup in `frontend/package.json`.

### Initialize the Database

The SQLite database at `data/wooking.db` auto-initializes with the schema on first server start. You can also seed it manually:

```bash
npm run seed         # Seed with initial data
npm run db:reset     # Delete and re-seed from scratch
```

### Start opencode

From the repo root:

```bash
opencode
```

This starts the AI agent runtime with all MCP servers configured in `opencode.json`. Secrets are read from your `.env` file — no hardcoded credentials.

---

## Usage: Job Hunting Pipeline

The job hunting workflow has six stages, driven by opencode agents and MCP tools.

### 1. Search for Jobs

Use the `@job-scraper` agent to scan Arbetsförmedlingen and LinkedIn:

```
@job-scraper
```

The agent searches with your configured location and keywords, saves results to `job-listings/`, and creates AFFiNE documents for each matching role. Jobs are tagged by urgency (Brådskande < 7d, Nära deadline 8–21d, Gott om tid > 21d).

### 2. Evaluate Matches

For each high-match job, the pipeline enriches the listing:

```bash
# Via Arbetsförmedlingen MCP — extracts skills with probability scores
af_enrich_job_text

# Via LinkedIn MCP — company and people research
linkedin_get_company_profile
linkedin_search_people

# Via Context7 — documentation lookup for unfamiliar tech
context7_query-docs
```

### 3. Tailor a Resume

Use the `@resume-tailor` agent to create a job-specific resume:

```
@resume-tailor
```

This duplicates your base Reactive Resume, applies JSON Patch operations to tailor the content, exports a PDF, and saves everything locally for your review.

### 4. Run the CrewAI Optimizer

For advanced optimization, the CrewAI pipeline runs 5 agents (job analysis → resume scoring → company research → patch generation → report):

```bash
PYTHONPATH=src uv run --directory src/resume_optimizer python -m resume_optimizer.main \
  --job-listing /tmp/job_listing.json \
  --job-enrichment /tmp/job_enrichment.json \
  --resume /tmp/resume.json \
  --company-name "Company AB" \
  --company-data /tmp/company_data.json \
  --output-dir output
```

**Data gathering** (run before the above command):
1. `af_get_job` → save to `/tmp/job_listing.json`
2. `af_enrich_job_text` → save to `/tmp/job_enrichment.json`
3. `reactive_resume_get_resume` → save to `/tmp/resume.json`
4. (Optional) `get_company_profile` → save to `/tmp/company_data.json`

**Requirements**: `OPENAI_API_KEY` in `.env` (CrewAI uses GPT-4o by default).

### 5. Upload to Reactive Resume

All tailored resumes and cover letters are saved locally for **your review**. Never auto-send.

- Tailored resumes: `resumes/tailored/[company]-[role]-[date].json`
- Cover letters: `cover-letters/[company]-[role]-[date].json`

After review, set `isPublic: true` via `reactive_resume_update_resume` to publish.

### 6. Monthly Activity Report

Swedish job seekers must submit an activity report (aktivitetsrapport) to Arbetsförmedlingen each month:

```
@affine-docs
# Then follow the workflow in .opencode/rules/activity-report.md
```

---

## Full Stack Development

The project has two frontend modes:

- **Legacy SPA** (`public/`) — Runtime-Babel-transpiled React, served directly by Express
- **Modern Vite+React** (`frontend/`) — HMR dev server with build pipeline

### Running Both (Recommended)

```bash
npm run dev:full
```

Starts the backend (`:3002`) and Vite frontend (`:5173`) concurrently with hot module replacement.

### Running Individually

```bash
npm run dev                # Backend only — serves legacy SPA from public/
npm run frontend:dev       # Vite frontend only (needs backend running separately)
```

### Building for Production

```bash
npm run frontend:build     # Outputs to frontend/dist/
```

Then copy `frontend/dist/` into `public/` to replace the legacy SPA, or serve `frontend/dist/` via a separate web server.

### Command Reference

| Command | What It Does |
|---------|-------------|
| `npm start` | Run backend in production mode |
| `npm run dev` | Run backend with watch mode (Node `--watch`) |
| `npm run frontend:dev` | Vite dev server (port 5173) |
| `npm run frontend:build` | Build Vite frontend to `frontend/dist/` |
| `npm run dev:full` | Backend + frontend concurrently |
| `npm run seed` | Seed the database with initial data |
| `npm run db:reset` | Reset database (deletes all data) |

---

## Authentication

All API routes (except `/health`) require a valid session. Sessions use `express-session` with a SQLite-backed store.

### Auth Routes

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/auth/register` | Create account (email, password, name) |
| `POST` | `/api/auth/login` | Login with email/password |
| `POST` | `/api/auth/logout` | Destroy session |
| `GET` | `/api/auth/me` | Get current user info |

### Session Cookie

- **Name**: `connect.sid`
- **Flags**: httpOnly, `sameSite: 'lax'`
- **Expiry**: 7 days (rolling)
- **Store**: SQLite via `connect-sqlite3`

### Data Scoping

All data is scoped to `user_id`:
- Jobs, activities, runs — pipeline data
- Profiles — single row per user
- Tokens — OAuth tokens
- User credentials — encrypted with **AES-256-GCM**

### Quick Test

```bash
bash scripts/test-auth-flow.sh
```

Runs 29 tests covering register, login, logout, session expiry, scoped data access, and credential encryption.

---

## Configuration & Customization

1. **Search locations** — Replace `[your-city]`, `[your-radius]` placeholders in `.opencode/rules/*.md`
2. **AFFiNE folder structure** — Create your workspace hierarchy, update parent IDs in `AGENTS.md` and `.opencode/agents/affine-docs.md`
3. **Job roles/keywords** — Update keyword lists in `.opencode/agents/job-scraper.md` and `.opencode/rules/mcp-usage.md`
4. **Resume templates** — Fetch your base resume via `reactive_resume_get_resume`, save to `resumes/templates/`
5. **LLM model** — Set `OPENAI_MODEL` in `.env` (default: `gpt-4o`)
6. **Backend port** — Set `PORT` in `.env` (default: `3002`)
7. **MCP toggles** — Enable/disable MCP servers in `opencode.json` (AFFiNE MCP is disabled by default)

### MCP Authentication

| MCP | Auth Method | First-time Setup |
|-----|-------------|-----------------|
| **Arbetsförmedlingen** | None (public API) | Nothing — works out of the box |
| **Context7** | None (public API) | Nothing — works out of the box |
| **Reactive Resume** | OAuth | Set `RXRESUME_MCP_URL` in `.env`. On first MCP call, opencode opens a browser for OAuth login to your RxResume instance |
| **AFFiNE** | Bearer token | Set `AFFINE_BASE_URL` + `AFFINE_API_TOKEN` in `.env`. Generate token from AFFiNE Settings → Workspace → API Tokens |
| **LinkedIn** | Password + browser session | Set `LINKEDIN_EMAIL` + `LINKEDIN_PASSWORD` in `.env`. Run one-time login: `xvfb-run uvx linkedin-scraper-mcp@latest --login` (saves session to `~/.linkedin-mcp/profile/`) |

---

## Project Structure

```
├── .env.example                # Template for environment variables
├── opencode.json               # MCP and agent orchestration config
├── AGENTS.md                   # Agent overview and quick reference
│
├── src/                        # Backend (Express 5 + ESM)
│   ├── server.js               # Entry point (port 3002)
│   ├── api/                    # API endpoints (auth, jobs, activities, runs, profile)
│   ├── database/               # SQLite setup + auto-init schema
│   ├── models/                 # Data models
│   └── services/               # Business logic (auth, encryption, LinkedIn OAuth)
│
├── public/                     # Legacy SPA (runtime Babel + React)
│   ├── index.html              # App shell
│   ├── css/styles.css          # Stylesheet
│   └── js/*.jsx                # Babel-transpiled components
│
├── frontend/                   # Modern Vite+React SPA
│   ├── src/                    # Components, API client, hooks
│   ├── index.html              # Vite entry point
│   ├── vite.config.js          # HMR + proxy to backend
│   └── package.json            # Vite + React dependencies
│
├── data/                       # SQLite database files (gitignored)
│
├── .opencode/
│   ├── agents/                 # Agent definitions (@job-scraper, @resume-tailor, etc.)
│   └── rules/                  # Workflow rules (auto-loaded by opencode)
│       ├── workflow-standards.md
│       ├── resume-operations.md
│       ├── job-listings-affine.md
│       ├── activity-report.md
│       ├── mcp-usage.md
│       └── coding-standards.md
│
├── src/resume_optimizer/       # CrewAI multi-agent pipeline
│   └── src/resume_optimizer/
│       ├── main.py             # CLI entry point (6 flags)
│       ├── crew.py             # Agent/task definitions
│       ├── models.py           # Pydantic data models
│       └── config/             # Agent & task YAML configs (Swedish prompts)
│
├── scripts/
│   ├── linkedin-mcp.sh         # Xvfb wrapper for LinkedIn browser
│   └── scrape-wise-jobs.py     # Supplementary job scraper
│
├── resumes/
│   ├── templates/              # Anonymized resume structure examples
│   └── tailored/               # Tailored resumes (gitignored — personal data)
│
├── cover-letters/              # Cover letters (gitignored — personal data)
└── job-listings/               # Scraped job listing exports
```

---

## Security

- **Never commit** `.env`, `resumes/**/*.json`, `cover-letters/*.json`, or `*.pdf`
- All secrets are sourced from `{env:VAR}` in `opencode.json` — zero hardcoded credentials in committed code
- `.gitignore` is pre-configured to protect personal data
- User credentials are encrypted with AES-256-GCM at rest
- The framework **never auto-sends** applications — everything is saved locally for your review

---

## License

MIT — see [LICENSE](./LICENSE).
