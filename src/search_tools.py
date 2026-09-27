from dotenv import load_dotenv
from langchain_tavily import TavilySearch
import os
from pprint import pprint
load_dotenv()
skill_demand_tool=TavilySearch(
    max_results=5,
    topic="general",
    search_depth="advanced",
    Tavily_api_key=os.getenv("TAVILY_API_KEY"),
)