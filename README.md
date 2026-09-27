# SkillMap AI

SkillMap AI is a career research assistant that connects a student's skills with current industry insights and real job opportunities. Ask about skill demand, salary trends, career paths, or job listings.

## Architecture

```text
React + Vite + Tailwind CSS
            |
            | POST /api/chat
            v
       FastAPI API
            |
            v
 Existing LangChain create_agent()
       /              \
 Tavily search     JSearch via RapidAPI
 (skill insights)   (real job listings)
```

The browser only talks to the FastAPI backend. Groq, Tavily, and RapidAPI credentials remain in the backend `.env` file. The API invokes the existing singleton agent; it does not reimplement agent or tool logic. Chat history is kept in frontend memory for the current page session and is not persisted or sent as conversation history.

## Technologies

- Python 3.12+
- FastAPI and Uvicorn
- LangChain `create_agent()` with Groq (`openai/gpt-oss-120b`)
- LangChain Tavily search
- RapidAPI JSearch
- React, Vite, and Tailwind CSS

## Backend setup

From the repository root:

1. Copy `.env.example` to `.env` if `.env` does not already exist.
2. Fill in the backend credentials:

   ```dotenv
   GROQ_API_KEY=your_groq_api_key
   TAVILY_API_KEY=your_tavily_api_key
   RAPID_KEY=your_rapidapi_key
   ```

   `RAPID_KEY` is the variable name already used by the existing JSearch tool. Keep the real `.env` file private; it is git-ignored.
3. Install/synchronize Python dependencies:

   ```bash
   uv sync
   ```
4. Start the API:

   ```bash
   uv run uvicorn main:app --reload
   ```

The API is available at `http://localhost:8000`. The LangChain agent is created once when the backend loads. Importing it does not run the old sample query.

## Frontend setup

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local Vite URL shown in the terminal (normally `http://localhost:5173`). To configure another backend URL, copy `frontend/.env.example` to `frontend/.env.local` and set `VITE_API_URL`. This variable must contain only the backend URL, never model or tool credentials.

## API

### `GET /api/health`

Returns:

```json
{"status":"ok"}
```

### `POST /api/chat`

Request:

```json
{
  "message": "What is the demand for Python and what jobs can I apply for?"
}
```

Response:

```json
{
  "response": "The final response from the SkillMap AI agent.",
  "success": true
}
```

Example using curl:

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"What is the demand for FastAPI?\"}"
```

Blank messages are rejected with HTTP 422. Agent/tool failures return a generic HTTP error message; details are logged only by the backend. Long-running requests time out with HTTP 504.

## Example questions

- What is the demand for Python?
- Find GenAI jobs for freshers
- What skills are required for AI Engineer jobs?
- What is the salary trend for FastAPI?
- Find Python jobs in Hyderabad