import argparse
import json
import sys
from pathlib import Path

from .crew import ResumeOptimizerCrew


def load_json(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def run():
    parser = argparse.ArgumentParser(
        description="Resume Optimizer Crew — analyse job ads and generate resume patches"
    )
    parser.add_argument(
        "--job-listing",
        required=True,
        help="Path to JSON file with full job listing data from af_get_job",
    )
    parser.add_argument(
        "--job-enrichment",
        required=True,
        help="Path to JSON file with skill enrichment from af_enrich_job_text",
    )
    parser.add_argument(
        "--resume",
        required=True,
        help="Path to JSON file with resume data from reactive_resume_get_resume",
    )
    parser.add_argument(
        "--company-name",
        required=True,
        help="Company name for research",
    )
    parser.add_argument(
        "--company-data",
        default=None,
        help="Optional path to JSON file with LinkedIn company data",
    )
    parser.add_argument(
        "--output-dir",
        default="output",
        help="Directory for output files (default: output/)",
    )

    args = parser.parse_args()

    job_listing = load_json(args.job_listing)
    job_enrichment = load_json(args.job_enrichment)
    resume = load_json(args.resume)
    company_data = load_json(args.company_data) if args.company_data else {}

    inputs = {
        "job_listing": json.dumps(job_listing, indent=2, ensure_ascii=False),
        "job_enrichment": json.dumps(job_enrichment, indent=2, ensure_ascii=False),
        "resume": json.dumps(resume, indent=2, ensure_ascii=False),
        "company_name": args.company_name,
        "company_data": json.dumps(company_data, indent=2, ensure_ascii=False),
    }

    crew_instance = ResumeOptimizerCrew()
    result = crew_instance.crew().kickoff(inputs=inputs)

    print("\n=== Crew execution complete ===")
    print(f"Output files written to: {Path(args.output_dir).resolve()}")

    return result


if __name__ == "__main__":
    run()
