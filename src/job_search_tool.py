import requests
from langchain.tools import tool
from dotenv import load_dotenv
import os
load_dotenv()

@tool
def search_jobs(skill: str, location: str, country: str = "in") -> list[dict[str, str]] | str:
    """
    Search for jobs based on a skill and location.
    Use the two-letter country code for the location (for example, "us" for
    the United States or "in" for India). Defaults to India.
    """
    print("calling search jobs tools")
    print(f"searching for {skill} jobs in {location}")
    url = "https://jsearch.p.rapidapi.com/search-v2"

    querystring = {
        "query":f"{skill} jobs in {location}",
        "page":"1",
        "num_pages":"1",
        "country": country.strip().lower(),
        "employment_types": "FULLTIME",
        "job_requirements":"no_experience",
    }

    headers = {
        "x-rapidapi-key": os.getenv("RAPID_KEY"),
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
        "Content-Type": "application/json"
    }

    response = requests.get(url, headers=headers, params=querystring, timeout=(5, 25))
    response.raise_for_status()
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

    if not results:
        return (
            f"No job listings were found for {skill} in {location}. "
            "Try a nearby location or broaden your search."
        )
    return results
