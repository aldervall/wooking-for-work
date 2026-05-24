# Resume Operations Best Practices

## Core Principles

All resume operations MUST follow these guidelines when working with Reactive Resume. Configure your instance URL via `RXRESUME_API_BASE` in `.env`.

## API Authentication

- **API Base**: Value from `{env:RXRESUME_API_BASE}`
- **Auth Header**: `x-api-key` (value from `.env` as `RXRESUME_API_KEY`)
- **Credentials**: Never commit API keys; always source from `.env`

## API Endpoints

- **List resumes**: `GET /resumes`
- **Get resume by ID**: `GET /resumes/{id}` (plural, not singular!)
- **Create resume**: `POST /resumes`
- **Patch resume**: `PATCH /resumes/{id}` (for partial updates via JSON Patch)
- **Update resume**: `PUT /resumes/{id}` (for metadata: name, slug, tags, isPublic)
- **Delete resume**: `DELETE /resumes/{id}`

**Important**: The endpoint is `/resumes` (plural) for all operations, including single-resume operations.

## Creating Resumes

### Slug Generation (CRITICAL)
Always generate unique slugs to avoid `RESUME_SLUG_ALREADY_EXISTS` errors:

```bash
# Use timestamp-based slug for uniqueness
SLUG="na-svenska-bas-$(date +%s)"
# Or use name + date
SLUG="$(echo $NAME | tr '[:upper:]' '[:lower:]' | tr ' ' '-')-$(date +%Y%m%d)"
```

### Steps
1. List existing resumes: `GET /resumes` to check existing slugs
2. Generate unique slug (timestamp-based recommended)
3. Create resume: `POST /resumes` with `name`, `slug`, `isPublic: false`
4. Verify creation: `GET /resumes/{id}` to confirm (note: plural)

### Using Reactive Resume MCP (PREFERRED)
Use the `reactive_resume_create_resume` tool:
- Automatically handles slug generation
- Returns the new resume ID
- Simpler than manual curl commands

## Updating Resumes

### PATCH vs PUT

| Use Case | Method | MCP Tool |
|----------|--------|----------|
| Update single field (name, headline) | **PATCH** | `reactive_resume_patch_resume` |
| Add/remove experience item | **PATCH** | `reactive_resume_patch_resume` |
| Change template, colors, fonts | **PATCH** | `reactive_resume_patch_resume` |
| Update metadata (name, slug, tags, isPublic) | **PUT** | `reactive_resume_update_resume` |
| Replace entire resume data | **PUT** | Manual (not recommended) |

### PATCH API (JSON Patch RFC 6902)

Apply partial updates using JSON Patch operations:

```bash
# Note: endpoint is /resumes/{id} (plural)
curl -X PATCH "${RXRESUME_API_BASE}/resumes/{id}" \
  -H "x-api-key: $RXRESUME_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      { "op": "replace", "path": "/basics/name", "value": "Jane Doe" },
      { "op": "add", "path": "/sections/experience/items/-", "value": { ... } }
    ]
  }'
```

Common operations:
- `replace` - Update a field value
- `add` - Add item to array (use `-` to append)
- `remove` - Remove item by index
- `move` - Reorder items
- `test` - Verify value before operation (optimistic concurrency)

### Using Reactive Resume MCP (PREFERRED)
```
Use reactive_resume_patch_resume with operations array
Use reactive_resume_update_resume for metadata only
```

## Listing and Fetching Resumes

### List All Resumes
```bash
curl "${RXRESUME_API_BASE}/resumes" \
  -H "x-api-key: $RXRESUME_API_KEY"
```

MCP: `reactive_resume_list_resumes`

### Get Specific Resume
```bash
# Note: endpoint is /resumes/{id} (plural)
curl "${RXRESUME_API_BASE}/resumes/{id}" \
  -H "x-api-key: $RXRESUME_API_KEY"
```

MCP: `reactive_resume_get_resume`

## Error Handling

| Status | Error Code | Action |
|--------|------------|--------|
| 400 | `RESUME_SLUG_ALREADY_EXISTS` | Generate new unique slug and retry |
| 400 | `INVALID_PATCH_OPERATIONS` | Check path syntax and validate against schema |
| 401 | `UNAUTHORIZED` | Check API key in `.env` |
| 403 | `RESUME_LOCKED` | Unlock resume first or skip |
| 404 | `NOT_FOUND` | Verify resume ID is correct |

## Validation

Before uploading, validate resume JSON against the schema:
- Schema URL: `https://rxresu.me/schema.json`
- Use `jq` or online validator
- Ensure all required fields are present

## Resume Structure Reference

Top-level sections (from schema):
- `basics` - name, headline, email, phone, location
- `summary` - professional summary (HTML)
- `sections` - experience, education, skills, languages, etc.
- `customSections` - user-defined sections
- `metadata` - template, layout, design, typography

## Workflow for Tailored Resumes

1. **Scrape job**: Use Arbetsförmedlingen MCP or scraping script
2. **Duplicate base resume**: `reactive_resume_duplicate_resume`
3. **Tailor content**: Use `reactive_resume_patch_resume` to:
   - Update summary with job-specific text
   - Reorder/relevance-sort experience items
   - Add job keywords to skills section
4. **Save locally**: Write to `/resumes/tailored/[company]-[role]-[date].json`
5. **Wait for approval**: Never auto-send; let the user review first

## Cover Letter (Personligt Brev) as Reactive Resume

Every cover letter MUST also be published as a separate Reactive Resume document, in the same format as the CV.

### Structure
| Field | Value |
|-------|-------|
| **Slug prefix** | `pb-[company]-[role]-$(date +%s)` (pb = personligt brev) |
| **Name** | `[Company] - [Role] - Personligt Brev` |
| **Template** | Same as CV (bronzor) |
| **Headline** | `[Role] — Personligt Brev` |
| **Sections** | All hidden/empty except profiles (LinkedIn) |
| **Layout** | Single page, only `summary` in main, empty sidebar |

### Content
- `summary.title`: `"Personligt Brev"`
- `summary.content`: Full cover letter as HTML (`<p>` tags for paragraphs, `<strong>` for emphasis)

### Steps
1. **Duplicate base resume** via `reactive_resume_duplicate_resume`:
   - Name: `"[Company] - [Role] - Personligt Brev"`
2. **Patch content** via `reactive_resume_patch_resume`:
   - Set `basics.headline` to `"[Role] — Personligt Brev"`
   - Replace `summary` with HTML cover letter (`title: "Personligt Brev"`)
   - Clear all sections: set `sections.experience.items`, `sections.education.items`, `sections.skills.items`, etc. to `[]`
   - Keep only `sections.profiles` with LinkedIn link
3. **Set layout** — Patch `metadata.layout` to single page with only summary in main
4. **Set slug** — Use `reactive_resume_update_resume` to set slug: `pb-[company]-[role]-$(date +%s)`
5. **Export PDF** via `reactive_resume_export_resume_pdf`
6. **Save locally** to `cover-letters/[company]-[role]-YYYY-MM-DD.json`
7. **Create markdown** with link to `https://[your-rxresume-instance]/resume/[slug]`

### Local Save (CRITICAL)
Always fetch the actual resume data from the server after duplicate — do NOT save the base resume data.
Use `reactive_resume_get_resume` with the new resume ID to get the correct slug and ID before saving locally.

## Available MCP Tools (Reactive Resume)

- `reactive_resume_list_resumes` - List all resumes
- `reactive_resume_get_resume` - Get full resume data
- `reactive_resume_create_resume` - Create empty resume
- `reactive_resume_duplicate_resume` - Copy existing resume
- `reactive_resume_patch_resume` - Partial update (JSON Patch)
- `reactive_resume_update_resume` - Update metadata only
- `reactive_resume_delete_resume` - Delete resume
- `reactive_resume_lock_resume` / `unlock_resume` - Lock management
- `reactive_resume_export_resume_pdf` - Generate PDF
- `reactive_resume_get_resume_screenshot` - Preview image

## Available MCP Prompts

- `build_resume` - Step-by-step resume builder
- `improve_resume` - Suggest improvements
- `tailor_resume` - Adapt for specific job description
- `review_resume` - Structured critique with scoring
