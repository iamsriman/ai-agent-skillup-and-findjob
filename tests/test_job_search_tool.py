import unittest
from unittest.mock import Mock, patch

from src.job_search_tool import search_jobs


class JobSearchToolTests(unittest.TestCase):
    @patch("src.job_search_tool.requests.get")
    def test_empty_search_returns_nonempty_message_for_agent(self, get):
        response = Mock()
        response.json.return_value = {"data": {"jobs": []}}
        get.return_value = response

        result = search_jobs.invoke(
            {"skill": "Python", "location": "San Francisco, CA", "country": "us"}
        )

        self.assertIsInstance(result, str)
        self.assertIn("No job listings were found", result)
        self.assertIn("San Francisco, CA", result)
        self.assertTrue(result.strip())
        self.assertEqual(get.call_args.kwargs["params"]["country"], "us")

    @patch("src.job_search_tool.requests.get")
    def test_real_job_results_keep_the_existing_shape(self, get):
        response = Mock()
        response.json.return_value = {
            "data": {
                "jobs": [
                    {
                        "job_title": "Python Engineer",
                        "employer_name": "Example Employer",
                        "job_city": "San Francisco",
                        "job_apply_link": "https://example.com/apply",
                    }
                ]
            }
        }
        get.return_value = response

        result = search_jobs.invoke(
            {"skill": "Python", "location": "San Francisco, CA", "country": "us"}
        )

        self.assertEqual(
            result,
            [
                {
                    "title": "Python Engineer",
                    "company": "Example Employer",
                    "location": "San Francisco",
                    "apply_link": "https://example.com/apply",
                }
            ],
        )
        self.assertEqual(get.call_args.kwargs["params"]["country"], "us")

    @patch("src.job_search_tool.requests.get")
    def test_country_defaults_to_existing_india_behavior(self, get):
        response = Mock()
        response.json.return_value = {"data": {"jobs": []}}
        get.return_value = response

        search_jobs.invoke({"skill": "Python", "location": "Hyderabad"})

        self.assertEqual(get.call_args.kwargs["params"]["country"], "in")


if __name__ == "__main__":
    unittest.main()
