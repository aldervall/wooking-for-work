# MCP Server Rules for Job Hunting

## Enabled MCPs
All MCP servers are disabled by default. Enable them in `opencode.json` by setting `"enabled": true` for the relevant server.

### 1. Arbetsförmedlingen MCP (Swedish Job Market)
- **No API key required** (uses public JobTech APIs)
- **Default search parameters** (pre-configured for your needs):
   - `municipality`: "[your-primary-city]" (also run for "[your-secondary-city]" and "[your-tertiary-city]")
   - `region`: "[your-primary-region]", "[your-secondary-region]"
   - `remote`: true
   - `radius`: [your-radius-km]km
  - `keywords`: ["IT", "DevSecOps", "systemtekniker", "IT-stöd", "IT-projektledare"]
- **Key tools to use**:
  - `af_search_jobs`: Find new listings matching your criteria
  - `af_enrich_job_text`: Extract required skills from job ads to tailor resumes
  - `af_occupation_to_educations`: Match your background to job requirements

### 2. LinkedIn MCP
- **Requires LinkedIn login credentials** (stored in `.env` as `LINKEDIN_EMAIL`, `LINKEDIN_PASSWORD`)
- **Requires xvfb** for headless browser mode
- **Initial login** (one-time): `xvfb-run uvx linkedin-scraper-mcp@latest --login`
- Profile saved to `~/.linkedin-mcp/profile/` — subsequent runs reuse this
- **Key tools**:
  - `search_jobs`: Find LinkedIn job postings (supplement to Arbetsförmedlingen)
  - `get_job_details`: Full job description with requirements
  - `get_company_profile`: Research company culture and employees
  - `search_people`: Find hiring managers at target companies
  - `get_person_profile`: Full profile with experience, education, skills
  - `close_session`: Clean up browser session when done
- **Session management**: Initialize with `initialize` method, extract `Mcp-Session-Id` from response headers, pass in subsequent requests

### 3. Context7 MCP
- No setup required
- Use to fetch latest documentation for technologies mentioned in job postings (e.g., "Kubernetes", "Terraform") to add relevant keywords to resumes

## Workflow with MCPs
1. Enable `arbetsformedlingen` MCP
2. Run `af_search_jobs` with default parameters every 48 hours
3. For each high-match job:
   - Use `af_enrich_job_text` to extract required skills
   - Use Context7 to fetch docs for unfamiliar tech
   - Generate tailored resume/cover letter
4. Use LinkedIn MCP for supplementary job search + company/people research
5. Disable MCPs when not in use to save resources
