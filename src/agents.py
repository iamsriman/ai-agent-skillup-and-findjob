import os

from dotenv import load_dotenv
from langchain.agents import create_agent
from langgraph.checkpoint.postgres import PostgresSaver
from psycopg_pool import ConnectionPool

if __package__:
    from .job_search_tool import search_jobs
    from .search_tools import skill_demand_tool
    from .model import model
else:
    from job_search_tool import search_jobs
    from search_tools import skill_demand_tool
    from model import model

load_dotenv()

system_prompts = """
You are SkillMap AI, a career research assistant.

You have access to these tools:
- skill_demand_tool: Search for current industry demand, salaries, career trends, and technology information.
- search_jobs: Search for current job listings.

TOOL USAGE:
- Do NOT use any tool for general knowledge questions that can be answered directly.
- Use skill_demand_tool when the user asks for CURRENT, 2026, latest, recent, market demand, salary, hiring trends, or career trends.
- Use search_jobs when the user asks to find, search, list, or show CURRENT job openings.
- When current information is requested, use the appropriate tool instead of relying on your internal knowledge.
- Never invent current job listings, salaries, statistics, or market information.

TIME:
- When current information is requested, prefer verified 2026 information.
- If 2026 information is unavailable, clearly state that it could not be verified.
- Do not present old information as current.

RESPONSE:
- Answer the user's exact question.
- Be concise and useful.
- Use simple formatting and short sections.
- For job searches, show at most 5 relevant jobs.
- Include company, role, location, and apply link when available.
- Do not provide unrelated information.
- Be concise and useful.
- For normal questions, keep the answer under 150 words.
- For job searches, show at most 5 jobs.
- For each job, include only:
  1. Job title
  2. Company
  3. Location
  4. Apply link
- Do not explain each job unless the user asks.
- Avoid repeating information.
"""
DATABASE_URL = os.environ["DATABASE_URL"]

# Create checkpointer tables once (they persist in Postgres).
# Safe to run on every startup in recent versions, wrapped for safety.
try:
    with PostgresSaver.from_conn_string(DATABASE_URL) as temp_saver:
        temp_saver.setup()
except Exception:
    pass  # tables already exist

pool = ConnectionPool(conninfo=DATABASE_URL, max_size=10, kwargs={"autocommit": True})
checkpointer = PostgresSaver(pool)

agent = create_agent(
    model=model,
    tools=[skill_demand_tool, search_jobs],
    system_prompt=system_prompts,
    checkpointer=checkpointer,
    debug=True,
)

if __name__ == "__main__":
    user_query = "can u tell me what u given list of job opending in that tell about that Initiative Sewa Foundation and what is the role"
    config = {"configurable": {"thread_id": "test-thread-1"}}
    response = agent.invoke(
        {"messages": [{"role": "user", "content": user_query}]}, config
    )
    print(response["messages"][-1].content)