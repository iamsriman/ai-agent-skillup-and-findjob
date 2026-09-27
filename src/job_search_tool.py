import requests
from langchain.tools import tool
from dotenv import load_dotenv
import os
from pprint import pprint
load_dotenv()

@tool
def search_jobs(skill: str, location: str)-> list:
    """
    search for jobs based on a skill and loaction.
    """
    print("calling search jobs tools")
    print(f"searching for {skill} jobs in {location}")
    url = "https://jsearch.p.rapidapi.com/search-v2"

    querystring = {
        "query":f"{skill} jobs in {location}",
        "page":"1",
                "num_pages":"1",
                "country":"in",
                "employment_types": "FULLTIME",
                "job_requirements":"no_experience",
            }

    headers = {
        "x-rapidapi-key": os.getenv("RAPID_KEY"),
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
        "Content-Type": "application/json"
    }

    response = requests.get(url, headers=headers, params=querystring)
    data= response.json()
    jobs=data.get("data",{}).get("jobs",[])
    results=[]
    for job in jobs:
        results.append({
            "title": job.get("job_title", ""),
            "company": job.get("employer_name", ""),
            "location": job.get("job_city", ""),
            "apply_link": job.get("job_apply_link", ""),
        })

    return results

