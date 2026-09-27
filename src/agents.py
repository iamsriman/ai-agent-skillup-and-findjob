from langchain.agents import create_agent
from job_search_tool import search_jobs
from search_tools import skill_demand_tool
from model import model



system_prompts = """You are a Skill-to-Career Mapping assistant that helps students understand skill demand and find matching job opportunities.

You have access to these tools:
- skill_demand_tool: Search for industry demand, salary insights, and career trends
- search_jobs: Find actual job listings requiring specific skills

Help the student by researching the skill they ask about and finding relevant opportunities.

Present results in a clean, readable format with clear sections and proper spacing. Include all job details with apply links. Don't use markdown format."""
agent=create_agent(
    model=model,
    tools=[skill_demand_tool,search_jobs],
    system_prompt=system_prompts,
    debug=True
)  



user_query = "can u tell me what u given list of job opending in that tell about that Initiative Sewa Foundation and what is the role"

response = agent.invoke({
    "messages": [
        {
            "role": "user", 
            "content": user_query
        }]
})

print(response["messages"][-1].content)