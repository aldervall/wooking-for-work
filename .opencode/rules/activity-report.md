# Monthly Activity Report (Aktivitetsrapport) — Arbetsförmedlingen

## Overview

Every month you MUST submit an activity report to Arbetsförmedlingen via Unionen A-Kassa.
This report lists all job applications/seraches made during the month with specific details
required by AF.

## Report Frequency

- **Submit**: Every calendar month (by the last day of the month)
- **Track**: Maintain a running report document in AFFiNE "Correspondence > Unionen (A-Kassa)"
- **Reminder**: Set a recurring monthly reminder

## Required Fields Per Job

Each job entry in the report MUST include these exact fields:

| # | Field (Swedish) | Field (English) | Values / Format |
|---|-----------------|-----------------|-----------------|
| 1 | **Yrkesroll** | Occupation/Role | Free text, e.g. "Systemtekniker", "IT-Projektledare" |
| 2 | **Arbetsgivaren** | Employer | Company name |
| 3 | **Omfattning** | Extent | `Heltid` / `Deltid` / `Timmar vid behov` |
| 4 | **Var finns jobbet?** | Location | `Sverige` / `Obestämd Ort` / `Utomlands` |
| 5 | **Svarade du på en annons?** | Answered an ad? | `Ja` / `Nej` |
| 6 | **Vilket datum sökte du jobbet?** | Date applied | `mm/dd/yyyy` |

## Source Data

All data should be pulled from:

1. **AFFiNE Job Listings** — Every active job in "Job Listings" folder
2. **AFFiNE Applications** — Every application under "Applications" folder
3. **Job evidence logs** — `job-evidence-YYYY-MM-DD.md` for jobs outside commuting distance

## Reporting Workflow

### Step 1: Collect Data (End of Month)

1. List all jobs from `affine_list_docs_by_tag` with relevant tags
2. For each job, extract:
   - Company name → **Arbetsgivaren**
   - Role title → **Yrkesroll**
   - Employment type from job description → **Omfattning**
   - Location from job description → **Var finns jobbet?**
   - Application date → **Vilket datum sökte du jobbet?**
   - Was it from an ad? → **Svarade du på en annons?** (Ja = AF/LinkedIn ad, Nej = eget initiativ)

### Step 2: Format Report

Use the template at `cover-letters/mall-aktivitetsrapport.md`.

Include the report text directly in the email to Unionen A-Kassa.

### Step 3: Attach Evidence (if needed)

If any jobs are **outside commuting distance (>[your-radius]km from [your-city])**:
- Include detailed evidence in the report
- Use `job-evidence-YYYY-MM-DD.md` format from existing examples
- Attach screenshots of job ads showing location

### Step 4: Log in AFFiNE

After sending:
1. Create a copy of the report in AFFiNE under "Correspondence > Unionen (A-Kassa)"
2. Add tag "Skickad aktivitetsrapport [månad]"
3. Log the date sent

## Template Format

The report uses a simple table format per job:

```
## [Nr]. [Yrkesroll] – [Arbetsgivare]

| Fält | Värde |
|------|-------|
| **Yrkesroll** | [role] |
| **Arbetsgivare** | [company] |
| **Omfattning** | [Heltid/Deltid/Timmar vid behov] |
| **Var finns jobbet?** | [Sverige/Obestämd Ort/Utomlands] |
| **Svarade du på en annons?** | [Ja/Nej] |
| **Datum sökt** | [mm/dd/yyyy] |
```

## Tag System in AFFiNE

| Tag | Meaning |
|-----|---------|
| `Aktivitetsrapport [YYYY-MM]` | Report for a specific month |
| `Skickad aktivitetsrapport` | Report has been submitted |
| `Behöver underlag` | Missing evidence for a job entry |

## Naming Conventions

| File | Format | Example |
|------|--------|---------|
| Evidence log | `job-evidence-YYYY-MM-DD.md` | `job-evidence-2026-05-06.md` |
| Email draft | `cover-letters/svar-unionen-aktivitetsrapport-YYYY-MM-DD.md` | `svar-unionen-aktivitetsrapport-2026-05-11.md` |

## Error Handling

| Problem | Solution |
|---------|----------|
| Missing application date | Check AFFiNE Application doc or email history |
| Unknown employer name | Use `af_get_job` to fetch original listing |
| Job outside commuting distance | Create `job-evidence-*.md` with distance proof |
| Unsure about location | Default to `Obestämd Ort` if unclear |

---

**This document is auto-loaded via `.opencode/rules/*.md` — always follow these standards!**
