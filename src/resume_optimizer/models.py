from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, confloat


class PatchOperation(BaseModel):
    op: str = Field(description="JSON Patch operation: add, remove, replace, move, copy, test")
    path: str = Field(description="JSON pointer path in Reactive Resume schema, e.g. /basics/headline")
    value: Optional[Any] = Field(description="Value for add, replace, test operations", default=None)
    from_path: Optional[str] = Field(description="Source path for move, copy operations", default=None)


class ResumePatches(BaseModel):
    operations: List[PatchOperation] = Field(
        description="List of JSON Patch RFC 6902 operations to apply to the resume"
    )
    summary: str = Field(description="Summary of what changes are being made and why")
    target_resume_name: str = Field(
        description="Suggested name for the duplicated resume, e.g. Company - Role - 2026-05-11"
    )


class SkillScore(BaseModel):
    skill_name: str = Field(description="Name of the skill being scored")
    required: bool = Field(description="Whether this skill is required or nice-to-have")
    match_level: confloat(ge=0, le=1) = Field(
        description="How well the candidate's experience matches (0-1)"
    )
    years_experience: Optional[float] = Field(
        description="Years of experience with this skill", default=None
    )
    context_score: confloat(ge=0, le=1) = Field(
        description="How relevant the skill usage context is to the job requirements",
        default=0.5,
    )


class JobMatchScore(BaseModel):
    overall_match: confloat(ge=0, le=100) = Field(
        description="Overall match percentage (0-100)"
    )
    technical_skills_match: confloat(ge=0, le=100) = Field(
        description="Technical skills match percentage"
    )
    soft_skills_match: confloat(ge=0, le=100) = Field(
        description="Soft skills match percentage"
    )
    experience_match: confloat(ge=0, le=100) = Field(
        description="Experience level match percentage"
    )
    education_match: confloat(ge=0, le=100) = Field(
        description="Education requirements match percentage"
    )
    industry_match: confloat(ge=0, le=100) = Field(
        description="Industry experience match percentage"
    )
    skill_details: List[SkillScore] = Field(
        description="Detailed scoring for each skill", default_factory=list
    )
    strengths: List[str] = Field(
        description="Areas where candidate exceeds requirements", default_factory=list
    )
    gaps: List[str] = Field(
        description="Areas needing improvement", default_factory=list
    )


class JobRequirements(BaseModel):
    job_title: str = Field(description="Official job title", default="")
    company_name: str = Field(description="Employer company name", default="")
    municipality: Optional[str] = Field(
        description="Swedish municipality where the job is located", default=None
    )
    region: Optional[str] = Field(
        description="Swedish region/county", default=None
    )
    remote_possible: bool = Field(
        description="Whether remote work is possible", default=False
    )
    application_deadline: Optional[str] = Field(
        description="Sista ansökningsdag", default=None
    )
    technical_skills: List[str] = Field(
        description="Required technical skills from the ad", default_factory=list
    )
    soft_skills: List[str] = Field(
        description="Required soft skills/personal traits", default_factory=list
    )
    experience_requirements: List[str] = Field(
        description="Experience requirements (years, domains)", default_factory=list
    )
    key_responsibilities: List[str] = Field(
        description="Key job responsibilities", default_factory=list
    )
    education_requirements: List[str] = Field(
        description="Education/certification requirements", default_factory=list
    )
    nice_to_have: List[str] = Field(
        description="Preferred but not required qualifications", default_factory=list
    )
    employment_type: Optional[str] = Field(
        description="Employment type: Heltid, Deltid, Timmar vid behov", default=None
    )
    tools_and_technologies: List[str] = Field(
        description="Specific tools, software, or technologies", default_factory=list
    )
    industry_knowledge: List[str] = Field(
        description="Required industry-specific knowledge", default_factory=list
    )
    certifications_required: List[str] = Field(
        description="Required certifications", default_factory=list
    )
    language_requirements: List[str] = Field(
        description="Language requirements (Swedish, English, etc.)",
        default_factory=list,
    )
    match_score: JobMatchScore = Field(
        description="Detailed scoring of candidate fit for this role",
        default_factory=JobMatchScore,
    )
    score_explanation: List[str] = Field(
        description="Explanation of how scores were calculated",
        default_factory=list,
    )


class ContentSuggestion(BaseModel):
    section: str = Field(description="Which resume section this applies to")
    before: str = Field(description="Current content")
    after: str = Field(description="Suggested replacement content")
    reason: str = Field(description="Why this change improves the resume")


class ResumeOptimization(BaseModel):
    content_suggestions: List[ContentSuggestion] = Field(
        description="Content optimization suggestions with before/after examples"
    )
    skills_to_highlight: List[str] = Field(
        description="Skills that should be emphasized based on job requirements"
    )
    skills_to_add: List[str] = Field(
        description="New skills/competencies to incorporate"
    )
    achievements_to_add: List[str] = Field(
        description="Achievements that should be added or modified"
    )
    keywords_for_ats: List[str] = Field(
        description="Important keywords for ATS optimization (both Swedish and English)"
    )
    formatting_suggestions: List[str] = Field(
        description="Formatting or structural improvements"
    )
    experience_reorder: List[str] = Field(
        description="Suggested order for experience items (most relevant first)",
        default_factory=list,
    )


class CompanyResearch(BaseModel):
    company_name: str = Field(description="Company name")
    industry: Optional[str] = Field(description="Industry sector", default=None)
    recent_developments: List[str] = Field(
        description="Recent company news and developments"
    )
    culture_and_values: List[str] = Field(
        description="Company culture and values"
    )
    market_position: Dict[str, List[str]] = Field(
        description="Market position including competitors and standing"
    )
    growth_trajectory: List[str] = Field(
        description="Growth and future plans"
    )
    interview_questions: List[str] = Field(
        description="Strategic questions to ask during interview"
    )
    key_talking_points: List[str] = Field(
        description="Talking points to highlight during interview"
    )
