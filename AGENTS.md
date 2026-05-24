# Wooking for Work — Job Hunting Automation

IT job hunting for **Swedish/European job market**.
Three pillars: **Reactive Resume** (CV JSON truth), **AFFiNE** (docs hub), **this repo** (MCP + CrewAI).

## Quick Reference

| Key | Value |
|-----|-------|
| Base resume ID for dup | `[your-base-resume-id]` (from `reactive_resume_list_resumes`) |
| AFFiNE workspace | `[your-workspace-id]` |
| AFFiNE parent IDs | Job Listings=`[your-jobs-folder-id]`, Applications=`[your-apps-folder-id]`, Correspondence=`[your-correspondence-folder-id]`, Evidence=`[your-evidence-folder-id]` |
| RxResume endpoint | `/api/openapi/resumes` (plural always) |
| RxResume auth | `x-api-key` from `{env:RXRESUME_API_KEY}` |

## Run CrewAI Optimizer

```bash
PYTHONPATH=src python3 -m resume_optimizer.main \
  --job-listing /tmp/resume-optimizer/job_listing.json \
  --job-enrichment /tmp/resume-optimizer/job_enrichment.json \
  --resume /tmp/resume-optimizer/resume.json \
  --company-name "Company AB"
```

Or: `uv run --directory src/resume_optimizer python -m resume_optimizer.main ...`

Requires Python 3.10–3.12, `OPENAI_API_KEY` from `.env`. Output in `src/resume_optimizer/output/`.
Needs 4 temp JSON files: job listing, enrichment, resume, company data (all gathered via MCPs first).

## LinkedIn MCP Quirk

Start via `scripts/linkedin-mcp.sh` (auto-starts Xvfb). One-time login:
`xvfb-run uvx linkedin-scraper-mcp@latest --login`
Session flow: `initialize` → extract `mcp-session-id` header → pass to requests → `close_session`.

## MCP Servers (all enabled in `opencode.json`)

| Server | Type | Tools |
|--------|------|-------|
| `arbetsformedlingen` | public API, no auth | `af_search_jobs`, `af_enrich_job_text` |
| `linkedin` | local via Xvfb browser | jobs, profiles, company, people search |
| `reactive-resume` | OAuth remote | list/dup/patch/export/resume |
| `affine` | local binary | docs, tags, databases |
| `context7` | remote | tech docs lookup |

## Agents (@name) — defined in `.opencode/agents/*.md`

`@job-scraper` — searches AF + LinkedIn, creates AFFiNE docs
`@resume-tailor` — duplicates base, patches, exports PDF, saves locally
`@affine-docs` — creates/manages AFFiNE docs with templates and tags
`@resume-optimizer` — multi-agent CrewAI pipeline, generates JSON Patch ops
`@research` — researches companies, tech stacks, hiring managers

## Rules auto-loaded every session

`.opencode/rules/*.md` is on `opencode.json` instruction list:
- `workflow-standards.md` — full application workflow, naming conventions, approval flow
- `resume-operations.md` — slug format, JSON Patch patterns, API error handling
- `job-listings-affine.md` — AFFiNE doc template, deadline tag calculation
- `activity-report.md` — monthly aktivitetsrapport spec (mandatory, end-of-month)
- `mcp-usage.md` — per-MCP search parameters and session management
- `coding-standards.md` — file conventions, git rules, no secrets in code

## Critical Constraints

- **Never auto-send** applications — save locally for review
- Never mix Swedish and English in the same resume
- Slugs must be unique — use `[company]-[role]-$(date +%s)`
- Prefer MCP tools over direct curl
- `.env` is gitignored; personal data in `resumes/tailored/` and `cover-letters/` — never commit
- **No CI, no tests, no lint config** in this repo
- **No SMTP/sendmail** — no code sends email
