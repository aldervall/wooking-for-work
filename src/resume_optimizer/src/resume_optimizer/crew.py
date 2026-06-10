import os

from crewai import Agent, Crew, Process, LLM, Task
from crewai.project import CrewBase, agent, crew, task

from .models import (
    JobRequirements,
    ResumeOptimization,
    CompanyResearch,
    ResumePatches,
)


@CrewBase
class ResumeOptimizerCrew:
    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    def _llm(self):
        return LLM(model=os.environ.get("OPENAI_MODEL", "gpt-4o"))

    @agent
    def job_analyzer(self) -> Agent:
        return Agent(
            config=self.agents_config["job_analyzer"],
            verbose=True,
            llm=self._llm(),
        )

    @agent
    def resume_analyzer(self) -> Agent:
        return Agent(
            config=self.agents_config["resume_analyzer"],
            verbose=True,
            llm=self._llm(),
        )

    @agent
    def company_researcher(self) -> Agent:
        return Agent(
            config=self.agents_config["company_researcher"],
            verbose=True,
            llm=self._llm(),
        )

    @agent
    def resume_writer(self) -> Agent:
        return Agent(
            config=self.agents_config["resume_writer"],
            verbose=True,
            llm=self._llm(),
        )

    @agent
    def report_generator(self) -> Agent:
        return Agent(
            config=self.agents_config["report_generator"],
            verbose=True,
            llm=self._llm(),
        )

    @task
    def analyze_job_task(self) -> Task:
        return Task(
            config=self.tasks_config["analyze_job_task"],
            output_file="output/job_analysis.json",
            output_pydantic=JobRequirements,
        )

    @task
    def optimize_resume_task(self) -> Task:
        return Task(
            config=self.tasks_config["optimize_resume_task"],
            output_file="output/resume_optimization.json",
            output_pydantic=ResumeOptimization,
        )

    @task
    def research_company_task(self) -> Task:
        return Task(
            config=self.tasks_config["research_company_task"],
            output_file="output/company_research.json",
            output_pydantic=CompanyResearch,
        )

    @task
    def generate_patches_task(self) -> Task:
        return Task(
            config=self.tasks_config["generate_patches_task"],
            output_file="output/patch_operations.json",
            output_pydantic=ResumePatches,
        )

    @task
    def generate_report_task(self) -> Task:
        return Task(
            config=self.tasks_config["generate_report_task"],
            output_file="output/final_report.md",
        )

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            verbose=True,
            process=Process.sequential,
        )
