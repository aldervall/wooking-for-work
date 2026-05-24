# How to Use Wooking for Work

## Setup (one-time)

```bash
cp .env.example .env          # fill in your keys
uv sync --directory src/resume_optimizer   # CrewAI deps
npx playwright install chromium            # LinkedIn browser
xvfb-run uvx linkedin-scraper-mcp@latest --login   # LinkedIn auth (once)
```

Then `opencode` to launch. All MCPs auto-connect from `.env`.

---

## Daily Workflow

### 1. Find jobs

```bash
@job-scraper
```

Searches Arbetsförmedlingen + LinkedIn for IT jobs in your area.
Results land in `job-listings/` and AFFiNE (as docs).

### 2. Tailor a resume

```bash
@resume-tailor
```

Give it a job ID or URL. It will:
- Duplicate your base CV in Reactive Resume
- Rewrite summary + reorder skills for the role
- Export PDF and save to `resumes/tailored/`
- Create a Personligt Brev cover letter in RxResume

### 3. Review & approve

Check files in `resumes/tailored/` + `cover-letters/`.
When ready:

```bash
@resume-tailor   # tell it to set isPublic: true on both
```

### 4. Run optimizer (for deep analysis)

```bash
@resume-optimizer
```

Runs 5 CrewAI agents: job analysis → resume scoring → company research → JSON Patch generation → final report. Output in `src/resume_optimizer/output/`.

---

## Monthly

### Activity report (Aktivitetsrapport)

```bash
@affine-docs     # ask it to generate activity report
```

Collects all jobs from AFFiNE, formats the report per AF requirements, saves to `cover-letters/`. You send it to Unionen A-Kassa.

---

## Pro Tips

| Want to… | Do this |
|----------|---------|
| Research a company | `@research` + company name |
| Look up tech docs | Context7 is built-in — just ask |
| Scrape a specific job board | `scripts/scrape-wise-jobs.py` |
| Customize search area | Edit `[your-city]` in `.opencode/rules/mcp-usage.md` |
| Change AI model | Set `OPENAI_MODEL` in `.env` |

## What NOT to do

- ❌ Never `git add .env` or `git add resumes/`
- ❌ Never auto-send applications — manual review only
- ❌ Never mix Swedish and English in the same resume
