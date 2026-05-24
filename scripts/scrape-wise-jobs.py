#!/usr/bin/env python3
"""
Simplified Wise.se IT job scraper - extracts from listing page only
"""
import json
import re
from datetime import date
from urllib.request import Request, urlopen
from urllib.error import URLError

def fetch_page(url: str) -> str:
    """Fetch page content"""
    headers = {'User-Agent': 'Mozilla/5.0 (compatible; JobScraper/1.0)'}
    try:
        req = Request(url, headers=headers)
        with urlopen(req, timeout=15) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return ""

def scrape_wise_jobs() -> dict:
    """Scrape job listings from Wise.se IT jobs page"""
    base_url = "https://www.wise.se/specialistomraden/it/lediga-jobb/"
    print("Fetching Wise.se IT jobs...")
    
    html = fetch_page(base_url)
    if not html:
        return {"source": "wise", "total": 0, "jobs": [], "timestamp": date.today().isoformat()}
    
    jobs = []
    
    # Find all job links with pattern /jobb/slug-id/
    job_pattern = r'href="(https://www\.wise\.se/jobb/[^"]+/)"'
    matches = re.findall(job_pattern, html)
    
    # Get unique URLs
    seen = set()
    for url in matches:
        if url not in seen:
            seen.add(url)
            
            # Extract job title from URL slug
            slug = url.split('/')[-2]
            title = slug.replace('-', ' ').title()
            
            # Try to extract job ID
            id_match = re.search(r'-(\d+)/?$', url)
            job_id = id_match.group(1) if id_match else "unknown"
            
            # Determine location from URL or default
            location = "Stockholm"  # Most Wise jobs are in Stockholm
            if 'goteborg' in url or 'göteborg' in url:
                location = "Göteborg"
            elif 'malmo' in url or 'malmö' in url:
                location = "Malmö"
            elif 'vastaras' in url or 'västerås' in url:
                location = "Västerås"
            
            jobs.append({
                "id": job_id,
                "title": title,
                "url": url,
                "location": location,
                "source": "wise",
                "remote": False
            })
    
    print(f"Found {len(jobs)} jobs from Wise.se")
    for job in jobs[:5]:
        print(f"  - {job['title']} ({job['location']})")
    
    return {
        "source": "wise",
        "total": len(jobs),
        "jobs": jobs,
        "timestamp": date.today().isoformat()
    }

def main():
    result = scrape_wise_jobs()
    
    output_dir = "job-listings"
    timestamp = date.today().isoformat()
    output_file = f"{output_dir}/wise-jobs-{timestamp}.json"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"\nOutput: {output_file}")
    return output_file

if __name__ == "__main__":
    main()
