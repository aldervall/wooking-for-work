# Workflow Standards for Job Hunting

## Core Principle: Three-Pillar Architecture

All job hunting activities MUST follow this standardized structure:

### 1. Reactive Resume = FINAL CV Repository
- **Public resumes (isPublic: true)** = "Ready to send" (approved by you)
- **Private resumes (isPublic: false)** = Work in progress
- **Local backup** = `resumes/tailored/[company]-[role]-[date].json`

### 2. AFFiNE = Communication & Documentation Hub
- **Job Listings** = Current, verified jobs only (remove expired)
- **Applications** = Full records with links to Reactive Resume + all correspondence
- **Correspondence** = Day-to-day emails (Unionen A-Kassa = PRIORITY)
- **Resume Examples** = Links to Reactive Resume (don't duplicate content)
- **Evidence** = Archived jobs outside commuting distance

### 3. This Project = Automation & MCP Workflow
- **Scripts** = Continuous job scraping + resume sync
- **MCPs** = Arbetsförmedlingen, Context7, Reactive Resume, AFFiNE
- **Standards** = Naming conventions + approval workflow

---

## Naming Conventions (MANDATORY)

### Files (Local Project)
| Type | Format | Example |
|------|--------|---------|
| Tailored Resume | `resumes/tailored/[company]-[role]-[YYYY-MM-DD].json` | `trafikverket-systemtekniker-citrix-2026-05-04.json` |
| Cover Letter | `cover-letters/[company]-[role].md` | `trafikverket-systemtekniker-citrix-2026-05-04.md` |
| Job Listing (JSON) | `job-listings/jobs-YYYY-MM-DD.json` | `job-listings/jobs-2026-05-04.json` |
| Job Listing (MD) | `job-listings/jobs-YYYY-MM-DD.md` | `job-listings/jobs-2026-05-04.md` |

### AFFiNE Documents
| Type | Format | Example |
|------|--------|---------|
| Job Listing | `[Company] - [Role]` | `Trafikverket - Systemtekniker Citrix` |
| Application | `[Company] - [Role]` (under Applications) | `Trafikverket - Systemtekniker Citrix` |
| Correspondence | `[Company/Organization]` (under Correspondence) | `Unionen (A-Kassa)` |

### Reactive Resume
| Type | Format | Example |
|------|--------|---------|
| Slug (public CV) | `na-[lang]-cv` | `na-svenska-cv` |
| Slug (tailored CV) | `[company]-[role]-[timestamp]` | `trafikverket-systemtekniker-1715000000` |
| Slug (personligt brev) | `pb-[company]-[role]-[timestamp]` | `pb-trafikverket-systemtekniker-1715000000` |
| Resume name (CV) | `[Company] - [Role] - [Date]` | `Trafikverket - Systemtekniker Citrix - 2026-05-04` |
| Resume name (personligt brev) | `[Company] - [Role] - Personligt Brev` | `Trafikverket - Systemtekniker Citrix - Personligt Brev` |

---

## Approval Workflow (CRITICAL)

### CV: From Draft to Public
```
1. Duplicate base resume → `reactive_resume_duplicate_resume`
   ↓
2. Tailor content → `reactive_resume_patch_resume`
   ↓
3. Set slug → `reactive_resume_update_resume` → slug: `[company]-[role]-$(date +%s)`
   ↓
4. Export PDF → `reactive_resume_export_resume_pdf`
   ↓
5. Fetch actual data → `reactive_resume_get_resume` then save to `resumes/tailored/[company]-[role]-[date].json`
   ↓
6. You review local file in `resumes/tailored/`
   ↓
7. IF APPROVED: `reactive_resume_update_resume` → set `isPublic: true`
   ↓
8. Resume now appears in AFFiNE "Resume Examples" (auto-sync)
```

### Personligt Brev (Cover Letter): From Draft to Public
```
1. Duplicate base resume → `reactive_resume_duplicate_resume`
   Name: "[Company] - [Role] - Personligt Brev"
   ↓
2. Patch content → `reactive_resume_patch_resume`
   - Set headline to "[Role] — Personligt Brev"
   - Replace summary with HTML cover letter (title: "Personligt Brev")
   - Clear all sections (experience, education, skills) to empty arrays
   - Keep only profiles (LinkedIn)
   ↓
3. Set layout → Patch metadata.layout: single page, only summary in main
   ↓
4. Set slug → `reactive_resume_update_resume` → slug: `pb-[company]-[role]-$(date +%s)`
   ↓
5. Export PDF → `reactive_resume_export_resume_pdf`
   ↓
6. Fetch actual data → `reactive_resume_get_resume` then save to `cover-letters/[company]-[role]-[date].json`
   ↓
7. Create markdown → `cover-letters/[company]-[role]-[date].md` with link to `https://[your-rxresume-instance]/resume/[slug]`
   ↓
8. You review in `cover-letters/` + `resumes/tailored/`
   ↓
9. IF APPROVED: `reactive_resume_update_resume` → set `isPublic: true`
```

**NEVER auto-send applications** - always wait for manual approval from you.

---

## MCP Usage Standards

### Every 48 Hours (Automated via Cron)
1. **Search jobs** → `arbetsformedlingen_af_search_jobs`
    - Parameters: municipality: "[your-primary-city]" (also "[your-secondary-city]", "[your-tertiary-city]"), remote: true, radius: [your-radius-km]km
    - Keywords: ["IT", "systemtekniker", "IT-stöd", "IT-projektledare"]
2. **Save results** → `job-listings/jobs-YYYY-MM-DD.json`
3. **Generate markdown** → `job-listings/jobs-YYYY-MM-DD.md`
4. **Create AFFiNE docs** → Auto-create under "Job Listings" (if new)

### For Each High-Match Job
1. **Enrich job text** → `arbetsformedlingen_af_enrich_job_text`
2. **Learn tech keywords** → `context7_resolve-library-id` + `context7_query-docs`
3. **Duplicate resume** → `reactive_resume_duplicate_resume`
4. **Tailor resume** → `reactive_resume_patch_resume`
   - Update summary with job-specific text
   - Add job keywords to skills section
   - Reorder experience by relevance
5. **Fetch actual data + save locally** → `reactive_resume_get_resume` then save to `resumes/tailored/`
6. **Create cover letter as RxResume** → Duplicate base → patch summary (HTML) → clear sections → set layout → set `pb-` slug → export PDF → fetch actual data → save to `cover-letters/` → create markdown with link to your RxResume instance
7. **Create AFFiNE Application** → Link to RxResume CV ID + RxResume cover letter ID + status

---

## Correspondence Rules (PRIORITY)

### Unionen (A-Kassa) = HIGHEST PRIORITY
- **Quick response needed** - answer within deadline
- **Templates available** in AFFiNE "Unionen (A-Kassa)" document
- **Log all incoming/outgoing** in AFFiNE "Correspondence > Unionen"
- **Use standardized templates** for activity reports and confirmations

### Monthly Activity Report (Aktivitetsrapport)
- **Mandatory**: Submit every calendar month (by last day) to Arbetsförmedlingen via Unionen A-Kassa
- **Fields required**: Yrkesroll, Arbetsgivare, Omfattning, Plats, Annons?, Datum sökt
- **Template**: `cover-letters/mall-aktivitetsrapport.md`
- **Evidence**: Use `job-evidence-*.md` for jobs >60km from Sala
- **Logging**: Save copy in AFFiNE "Correspondence > Unionen (A-Kassa)" after sending
- **Full spec**: See `.opencode/rules/activity-report.md` for detailed workflow

### Day-to-Day Employer Emails
- **Interview invites** → Log in AFFiNE "Correspondence > Övrig korrespondens"
- **Rejections** → Log and update Application status
- **Follow-ups** → Use templates in AFFiNE

### Status Tracking (MANDATORY)
Every Application in AFFiNE MUST have:
- [x] Applied (date)
- [ ] Waiting for response
- [ ] Interview booked
- [ ] Offer received
- [ ] Rejection received

Update status in real-time as responses come in.

---

## Job Listings Standards

### Only Include Jobs That:
1. **Location**: [your-city] ±[your-radius]km (e.g. nearby cities within your search area)
2. **Remote**: Within Sweden (or EU if really good match)
3. **Roles**: IT, DevSecOps, Systemtekniker, IT-Support, Project Lead
4. **Status**: Currently active (not expired)

### Verify Before Adding to AFFiNE:
1. Use `arbetsformedlingen_af_get_job` to fetch full details
2. Check application deadline - if passed, move to "Evidence"
3. Search company on LinkedIn for culture/values (if LinkedIn MCP available)
4. Use `arbetsformedlingen_af_enrich_job_text` to verify job matches your profile

### Remove Expired Jobs:
- **Check deadlines** every 48h when scraping
- **Move to Evidence** (AFFiNE) if used for Arbetsförmedlingen report
- **Delete** if completely irrelevant

---

## Resume Sync (Standardized)

### Script: `scripts/sync-resumes-to-affine.sh`
1. List all public resumes via Reactive Resume API → `reactive_resume_list_resumes`
2. Filter for `isPublic: true`
3. Create/update AFFiNE "Resume Examples" documents
4. Link to `https://[your-rxresume-instance]/resume/[slug]`
5. Run every time a resume is approved (or weekly)

### Local Backup:
- Always save tailored resumes to `resumes/tailored/`
- Format: `[company]-[role]-[YYYY-MM-DD].json`
- Never commit API keys (.env is in .gitignore)

---

## Security & Compliance

### NEVER Commit:
- `.env` file (contains API keys)
- `resumes/tailored/*.json` (may contain personal data)
- Any file with `RXRESUME_API_KEY` or `AFFINE_ACCESS_TOKEN`

### Always:
- Source API keys from `.env`
- Use `reactive_resume_*` tools (not raw curl) when possible
- Validate resume JSON against schema: `https://rxresu.me/schema.json`
- Get your approval before setting `isPublic: true`

---

## Error Handling

### Reactive Resume Errors:
| Error | Solution |
|-------|----------|
| `RESUME_SLUG_ALREADY_EXISTS` | Use timestamp-based slug: `trafikverket-citrix-$(date +%s)` |
| `INVALID_PATCH_OPERATIONS` | Check JSON Patch path syntax against schema |
| `UNAUTHORIZED` | Verify `RXRESUME_API_KEY` in `.env` |
| `RESUME_LOCKED` | Unlock first: `reactive_resume_unlock_resume` |

### AFFiNE Errors:
| Error | Solution |
|-------|----------|
| Duplicate docs in tree view | Display issue - actual structure is correct (verify via `affine_get_doc`) |
| Document not found | Check `workspaceId` and `docId` are correct |
| Move failed | Ensure `fromParentDocId` is specified correctly |

---

## Summary Checklist for New Job Application

- [ ] 1. Job found via `arbetsformedlingen_af_search_jobs`
- [ ] 2. Job verified via `arbetsformedlingen_af_get_job` (deadline OK?)
- [ ] 3. Skills extracted via `arbetsformedlingen_af_enrich_job_text`
- [ ] 4. Resume duplicated via `reactive_resume_duplicate_resume`
- [ ] 5. Resume tailored via `reactive_resume_patch_resume`
- [ ] 6. PDF exported via `reactive_resume_export_resume_pdf`
- [ ] 7. Saved locally to `resumes/tailored/` (fetch actual data from server first!)
- [ ] 8. Cover letter created as RxResume: duplicate → patch → set layout → set slug `pb-*`
- [ ] 9. Cover letter PDF exported via `reactive_resume_export_resume_pdf`
- [ ] 10. Cover letter saved locally to `cover-letters/` (fetch actual data from server first!)
- [ ] 11. Cover letter markdown with link to your RxResume instance
- [ ] 12. AFFiNE Application document created (under "Applications")
- [ ] 13. You review local files in `resumes/tailored/` + `cover-letters/`
- [ ] 14. IF APPROVED: Set `isPublic: true` on CV RxResume
- [ ] 15. IF APPROVED: Set `isPublic: true` on Personligt Brev RxResume
- [ ] 16. Application sent (NEVER auto-send!)
- [ ] 17. Status updated in AFFiNE Application document
- [ ] 18. Correspondence logged in AFFiNE "Correspondence"

---

**This document is auto-loaded via `.opencode/rules/*.md` - always follow these standards!**