import time
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient

from main import app
from src.api.routes import extract_assistant_text


class AgentResponseExtractionTests(unittest.TestCase):
    def test_extracts_string_content_from_final_ai_message(self):
        result = {
            "messages": [
                SimpleNamespace(type="human", content="Question"),
                SimpleNamespace(type="ai", content="Answer"),
            ]
        }
        self.assertEqual(extract_assistant_text(result), "Answer")

    def test_extracts_text_blocks_and_skips_non_text_blocks(self):
        result = {
            "messages": [
                {
                    "type": "ai",
                    "content": [
                        {"type": "text", "text": "First part"},
                        {"type": "image", "image": "not text"},
                        {"type": "text", "text": "Second part"},
                    ],
                }
            ]
        }
        self.assertEqual(
            extract_assistant_text(result),
            "First part\nSecond part",
        )

    def test_rejects_unexpected_agent_response(self):
        with self.assertRaises(ValueError):
            extract_assistant_text({"messages": [{"type": "tool", "content": "result"}]})


class ChatApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_endpoint(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_chat_endpoint_invokes_existing_agent_and_returns_text(self):
        agent_result = {
            "messages": [
                SimpleNamespace(type="ai", content="Live research response")
            ]
        }
        with patch("src.api.routes.agent.invoke", return_value=agent_result) as invoke:
            response = self.client.post(
                "/api/chat",
                json={"message": "What is the demand for Python?"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"response": "Live research response", "success": True},
        )
        invoke.assert_called_once_with(
            {
                "messages": [
                    {"role": "user", "content": "What is the demand for Python?"}
                ]
            }
        )

    def test_blank_message_is_rejected(self):
        with patch("src.api.routes.agent.invoke") as invoke:
            response = self.client.post("/api/chat", json={"message": "  "})

        self.assertEqual(response.status_code, 422)
        invoke.assert_not_called()

    def test_agent_error_does_not_reach_client(self):
        with patch(
            "src.api.routes.agent.invoke",
            side_effect=RuntimeError("private provider detail"),
        ):
            response = self.client.post("/api/chat", json={"message": "Find jobs"})

        self.assertEqual(response.status_code, 502)
        self.assertNotIn("private provider detail", response.text)

    def test_agent_timeout_returns_gateway_timeout(self):
        with (
            patch("src.api.routes.AGENT_TIMEOUT_SECONDS", 0.01),
            patch("src.api.routes.agent.invoke", side_effect=lambda *_: time.sleep(0.05)),
        ):
            response = self.client.post("/api/chat", json={"message": "Find jobs"})

        self.assertEqual(response.status_code, 504)
        self.assertNotIn("private", response.text)

    def test_frontend_origin_is_allowed_by_cors(self):
        response = self.client.options(
            "/api/chat",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["access-control-allow-origin"],
            "http://localhost:5173",
        )


if __name__ == "__main__":
    unittest.main()
