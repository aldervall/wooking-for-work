# Job Listings in AFFiNE - Standards

## Tag System (Urgency Priority)

Tags determine visual color coding in AFFiNE. Always set tags based on days remaining:

| Tag | Meaning | Days Until Deadline |
|-----|---------|---------------------|
| **Brådskande** | Must respond ASAP | < 7 days |
| **Nära deadline** | Respond soon | 8-21 days |
| **Gott om tid** | Plenty of time | > 21 days |

### Color Assignment in AFFiNE (User Configurable)
- **Gott om tid** → Green (most time)
- **Nära deadline** → Blue (default, neutral)
- **Brådskande** → Yellow/Gold (urgent/warning)

## Document Template

Every job listing in AFFiNE MUST follow this structure:

```markdown
# [Company] - [Role]

Tjänst: [Full job title]
Företag: [Company name]
Plats: [Location with distance from your city]
Publicerad: [YYYY-MM-DD]
Sista ansökningsdag: [YYYY-MM-DD]
Annons: [URL to job ad]

**Beskrivning:**
[Brief description of role - max 3 sentences]

---

## Status
- [x] Hittad via Arbetsförmedlingen (YYYY-MM-DD)
- [ ] Ansökan skickad
- [ ] Väntar svar
- [ ] Intervju bokad
- [ ] Erbjudande mottaget
- [ ] Avslag mottaget

---

## Korrespondens
Logga e-postmeddelanden och svar här
```

## Workflow for Adding Jobs to AFFiNE

### Step 1: Verify Job is Valid
- Location: [your-city] ±[your-radius]km (list your nearby cities here)
- Remote: Within Sweden or EU
- Roles: IT, DevSecOps, Systemtekniker, IT-Support, Project Lead
- Status: Currently active (not expired)

### Step 2: Calculate Deadline Tag
```
daysRemaining = deadlineDate - today
if daysRemaining < 7:       tag = "Brådskande"
elif daysRemaining <= 21:    tag = "Nära deadline"
else:                        tag = "Gott om tid"
```

### Step 3: Create Document
Use `affine_create_doc_from_markdown` with:
- `parentDocId`: "[your-job-listings-folder-id]" (Job Listings folder)
- `title`: "[Company] - [Role]"
- `markdown`: Template above

### Step 4: Add Tag
Use `affine_add_tag_to_doc` with calculated urgency tag.

## Cleanup Rules

### Remove Expired Jobs When:
1. Deadline has passed by > 7 days
2. Job is no longer relevant to profile
3. Application was rejected (move to Evidence instead)

### Move to Evidence (Don't Delete) When:
1. Used for Arbetsförmedlingen report
2. Company was interesting but role didn't fit
3. Important for future reference

### Keep Active Jobs When:
1. Deadline hasn't passed
2. Haven't received response yet
3. Still considering applying

## Batch Operations

When scanning for new jobs:
1. Delete all expired/irrelevant jobs first
2. Create all new job documents in parallel
3. Add tags to all new jobs in parallel
4. Report summary to user with priority order

## Example Tag Assignment

| Job | Deadline | Days Left | Tag |
|-----|----------|-----------|-----|
| SAAB Plattformsproduktledare | 2026-05-18 | 7 | Brådskande |
| ABB HPC Admin | 2026-05-23 | 12 | Nära deadline |
| Knightec DevOps | 2026-09-18 | 130 | Gott om tid |