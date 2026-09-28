# SkillMap AI

SkillMap AI is an AI-powered career research assistant for current skills, career trends, salaries, industry demand, and job opportunities. Its React frontend connects to a FastAPI backend, which uses a LangChain agent with a Groq model and search tools.

## Features

- User registration and login with JWT authentication
- PostgreSQL persistence for users and conversation metadata
- Conversation list, history loading, continuation, and deletion
- Conversation-scoped short-term memory through the LangGraph PostgreSQL checkpointer
- Tavily research for current career and industry information
- JSearch job search through RapidAPI
- React chat interface with Markdown rendering
- Token and cost optimization through tool-use guidance, bounded search results, concise responses, token-usage measurement, and model comparison

**Long-term user memory is not implemented.** The `user_facts` database helper functions are not used for chat personalization.

## Architecture

```text
React frontend
     |
     | REST API (Bearer JWT for protected endpoints)
     v
   FastAPI
     |
     +--> JWT authentication ---------> PostgreSQL (users)
     |
     +--> Conversation API -----------> PostgreSQL (conversation metadata)
     |
     +--> Chat API
             |
             v
      LangChain create_agent()
        |       |       |       |
        v       v       v       v
      Groq   Tavily  JSearch  LangGraph
      model  Search  (RapidAPI) PostgreSQL
                              checkpointer
                                  |
                                  v
                         PostgreSQL thread
                         state and messages
```

The conversations table stores conversation metadata used to list and authorize a user's chats. The LangGraph checkpointer stores the agent state and messages for a conversation thread. Both use PostgreSQL; the API loads metadata through its database functions and reads conversation messages from the checkpointer.

## Technologies

### Backend

- Python 3.12+
- FastAPI
- Uvicorn
- LangChain `create_agent()`
- Pydantic request/response schemas
- `python-jose` for JWT
- `pwdlib` for password hashing

### AI and Search

- Groq chat model: `openai/gpt-oss-20b`
- LangGraph PostgreSQL checkpointer
- Tavily Search via `langchain-tavily`
- JSearch through RapidAPI

### Database

- PostgreSQL
- `psycopg` and `psycopg-pool`

### Frontend

- React and React DOM
- Vite
- Tailwind CSS
- React Router (`react-router-dom`)
- React Markdown (`react-markdown`) with GitHub Flavored Markdown (`remark-gfm`)
- Lucide icons (`lucide-react`)
- DM Sans bundled with `@fontsource/dm-sans`

## Prerequisites

- Python 3.12 or later
- `uv`
- Node.js and npm
- A locally running PostgreSQL server; Docker is not required
- Groq, Tavily, and RapidAPI credentials

The PostgreSQL database must be reachable through `DATABASE_URL`. The application requires its `users` and `conversations` tables to exist. Agent startup calls the LangGraph checkpointer setup for its checkpoint tables.

## Environment Variables

The backend reads these variables:

| Variable | Purpose |
| --- | --- |
| `GROQ_API_KEY` | Groq model credentials |
| `TAVILY_API_KEY` | Tavily search credentials |
| `RAPID_KEY` | JSearch RapidAPI credentials; this is the variable name used by the job-search code |
| `DATABASE_URL` | PostgreSQL connection string for application data and checkpointing |
| `SECRET_KEY` | Secret used to sign JWTs |

The root `.env.example` lists `GROQ_API_KEY`, `TAVILY_API_KEY`, and `RAPID_KEY`. Add `DATABASE_URL` and `SECRET_KEY` to the root `.env` as well; both are required by the backend. Keep all real credentials out of source control.

The frontend reads `VITE_API_BASE_URL` as its API base URL and defaults to `http://localhost:8000`. It also accepts `VITE_API_URL` as a compatibility fallback. The frontend example file, `frontend/.env.example`, sets `VITE_API_BASE_URL=http://localhost:8000`. Do not put backend credentials in frontend environment variables.

## Backend Setup

Create the root `.env` with the required backend environment variables, ensure PostgreSQL and the required application tables are available, then run these commands from the repository root:

```powershell
uv sync
uv run uvicorn main:app --reload
```

The backend is available at `http://localhost:8000`.

Health check:

```text
GET http://localhost:8000/api/health
```

It returns `{"status":"ok"}`.

## Frontend Setup

In a separate terminal, run:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal, normally `http://localhost:5173`. To use a different backend address, set `VITE_API_BASE_URL` in `frontend/.env.local`.

The backend CORS configuration allows `http://localhost:5173` and `http://127.0.0.1:5173`.

## Authentication

- `POST /api/register` creates a user and returns a JWT access token and user data.
- `POST /api/login` verifies the email and password and returns the same response shape.
- The backend hashes passwords using `pwdlib`; it does not store the submitted password as plaintext.
- JWTs are signed using `SECRET_KEY` and expire after seven days.
- Protected routes require the `Authorization` header with the Bearer scheme.
- Conversation endpoints verify that the requested conversation belongs to the authenticated user.
- In the frontend, unauthenticated visitors are redirected to login, and the token is attached by the shared API client.

## Conversation and Memory

### Short-term memory

The LangGraph PostgreSQL checkpointer stores agent state for a conversation thread. When the frontend sends a later message with the same `conversation_id`, the agent continues that thread. This memory is scoped to that conversation.

### Conversation history

The application stores user and conversation metadata in PostgreSQL. A conversation is created when the first chat request is sent; the backend returns its `conversation_id`. The frontend retains the active ID for subsequent requests. Users can list conversations, load message history, continue a conversation, and delete it.

Conversation messages are read from the LangGraph checkpointer; conversation metadata is read from the application database functions. These are separate storage paths, although both use PostgreSQL.

### Long-term memory

Long-term user memory is not implemented. The `user_facts` helpers in the database module are not called by the API's chat flow and are not used for personalization. There is no cross-conversation memory.

## API

All API paths use the `/api` prefix. Health, registration, and login do not require authentication. Conversation and chat endpoints require a Bearer JWT.

### `GET /api/health`

**Authentication:** Not required

**Request body:** None
**Response:**

```json
{
  "status": "ok"
}
```

### `POST /api/register`

**Authentication:** Not required

**Request body:** `email` and `password` are required; `name` is optional. The password must be at least 8 characters.

```json
{
  "email": "person@example.com",
  "password": "example-password",
  "name": "Example User"
}
```

**Response:** `TokenResponse`

```json
{
  "access_token": "<access-token>",
  "token_type": "bearer",
  "user": {
    "id": "<user-id>",
    "email": "person@example.com",
    "name": "Example User"
  }
}
```

### `POST /api/login`

**Authentication:** Not required

**Request body:**

```json
{
  "email": "person@example.com",
  "password": "example-password"
}
```

**Response:** `TokenResponse`, with the same fields as the registration response.

### `GET /api/conversations`

**Authentication:** Required

**Request body:** None
**Response:** An array of the authenticated user's conversations, ordered by most recently updated. Each item contains `id`, `title`, and ISO-formatted `updated_at`.

```json
[
  {
    "id": "<conversation-id>",
    "title": "What skills should I learn?",
    "updated_at": "2026-09-28T18:30:00+00:00"
  }
]
```

### `GET /api/conversations/{conversation_id}/messages`

**Authentication:** Required; the conversation must belong to the authenticated user

**Request body:** None
**Response:** Message entries have `role` (`human` or `ai`) and `content`. No timestamps are returned.

```json
{
  "conversation_id": "<conversation-id>",
  "messages": [
    {
      "role": "human",
      "content": "What skills are in demand?"
    },
    {
      "role": "ai",
      "content": "Here are some skills..."
    }
  ]
}
```

### `DELETE /api/conversations/{conversation_id}`

**Authentication:** Required; the conversation must belong to the authenticated user

**Request body:** None

**Behavior:** The API deletes the conversation metadata and attempts to delete the associated checkpointer thread.
**Response:**

```json
{
  "success": true
}
```

### `POST /api/chat`

**Authentication:** Required

**Request body:** `message` is required and cannot be blank. `conversation_id` is optional; omit it to start a conversation.

```json
{
  "message": "What skills are in demand for data engineering?"
}
```

For an existing conversation:

```json
{
  "message": "Which should I learn first?",
  "conversation_id": "<conversation-id>"
}
```

**Response:** `ChatResponse`

```json
{
  "response": "The assistant's response.",
  "success": true,
  "conversation_id": "<conversation-id>"
}
```

Invalid request bodies or blank messages can return HTTP 422. Unknown or inaccessible conversations return HTTP 404. Agent failures return HTTP 502; a request exceeding the 90-second agent timeout returns HTTP 504.

## Search Behavior

- Tavily is intended for requests about current/latest industry demand, salaries, hiring, career trends, or technology information. General knowledge questions should not trigger a search tool.
- Tavily is configured with `max_results=3`.
- JSearch is used for requests to find or list current job openings. It requests one page and returns at most five results.
- Returned JSearch fields are `title`, `company`, `location`, and `apply_link`.
- The agent is instructed to prefer verified 2026 information when current information is requested, and to say when 2026 information cannot be verified.
- The agent is instructed not to invent current job listings, salaries, statistics, or market information.

## Token and Cost Optimization

The current implementation includes the following measures:

- The agent is instructed to avoid tool calls for general questions that can be answered directly.
- Tavily results are capped at three; the search configuration reflects the reduction from five results.
- JSearch is limited to one page and at most five returned jobs.
- Job responses are instructed to stay concise and include only the available role, company, location, and application link fields.
- The chat route reads and prints message `usage_metadata` when available so token usage can be measured.
- Model comparison was performed during development. The model currently configured in `src/model.py` is `groq:openai/gpt-oss-20b`.

No specific percentage reduction is claimed here.

## Project Structure

```text
.
├── .env.example
├── .gitignore
├── .python-version
├── main.py
├── package.json
├── package-lock.json
├── pyproject.toml
├── uv.lock
├── README.md
├── src/
│   ├── agents.py
│   ├── job_search_tool.py
│   ├── model.py
│   ├── search_tools.py
│   └── api/
│       ├── __init__.py
│       ├── auth.py
│       ├── db.py
│       ├── routes.py
│       └── schemas.py
├── tests/
│   ├── test_api.py
│   └── test_job_search_tool.py
└── frontend/
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── Login.jsx
        ├── Register.jsx
        ├── api/
        │   ├── auth.js
        │   ├── chat.js
        │   ├── client.js
        │   └── conversations.js
        ├── components/
        │   ├── ChatInput.jsx
        │   ├── ChatMessage.jsx
        │   ├── ChatWindow.jsx
        │   ├── Header.jsx
        │   ├── JobCard.jsx
        │   ├── LoadingIndicator.jsx
        │   ├── MessageBubble.jsx
        │   ├── MessageList.jsx
        │   ├── ProtectedRoute.jsx
        │   └── Sidebar.jsx
        ├── context/
        │   └── AuthContext.jsx
        ├── pages/
        │   ├── AuthForm.jsx
        │   ├── Dashboard.jsx
        │   ├── Login.jsx
        │   └── Register.jsx
        ├── index.css
        └── main.jsx
```

## Security

- Backend passwords are hashed with `pwdlib`.
- JWTs protect conversation and chat endpoints.
- Conversation ownership is checked before history is returned, a conversation is continued, or it is deleted.
- Groq, Tavily, and RapidAPI credentials are used only by the backend.
- Keep `.env` private and never add backend credentials to frontend code or frontend environment files.

## Manual Testing Checklist

1. Register a new account and confirm the frontend opens the dashboard.
2. Log out, then log in with that account.
3. Start a new chat and send a message; confirm the conversation appears in the list after the first chat request.
4. Send a general-knowledge question.
5. Ask a current/2026 career or industry question and check the answer for current research.
6. Ask for current job listings and check any returned job fields.
7. Send a follow-up in the same conversation and confirm the conversation continues.
8. Open an older conversation and confirm its messages load.
9. Delete a conversation and confirm it disappears; if it was active, confirm the view resets to a new chat.
10. Log out and confirm the app returns to the login page.
11. Log in again and confirm the saved conversation list remains available.
