# AI Multi-Cloud Infrastructure Planner (Fan-Out / Fan-In)

Proof-of-concept full-stack app that fans out infrastructure planning to 3 AI cloud agents (AWS, GCP, Azure) and then fans in to a final recommendation agent.

## Tech Stack

- Frontend: React (Hooks), JavaScript, Axios, Vite
- Backend: Node.js, Express, Axios
- AI Provider: xAI Grok API (`/chat/completions`)

## Project Structure

- `backend/` Express API, orchestration, tests
- `frontend/` React UI
- `scripts/` local setup/run helpers
- `ARCHITECTURE.md` fan-out/fan-in flow

## Setup

1. Copy env templates:
   - `backend/.env.example` -> `backend/.env`
   - `frontend/.env.example` -> `frontend/.env` (optional)
2. Set `XAI_API_KEY` in `backend/.env`
3. Install dependencies:

```powershell
./scripts/setup.ps1
```

## Run Locally

Option A (single command):

```powershell
./scripts/run_all.ps1
```

Option B (two terminals):

Terminal 1 (backend):

```powershell
./scripts/run_backend.ps1
```

Terminal 2 (frontend):

```powershell
./scripts/run_frontend.ps1
```

Then open `http://localhost:5173`.

## Backend API

### `POST /pipeline/run`

Request body:

```json
{
  "region": "us-east-1",
  "compute": { "cpu": 4, "ramGb": 16 },
  "storage": { "type": "ssd", "sizeGb": 200 },
  "databaseType": "postgresql",
  "trafficLevel": "medium"
}
```

Response includes:
- normalized input
- cloud plans from AWS/GCP/Azure (fan-out)
- final recommendation with cost table (fan-in)
- stage metadata

## Tests

Run backend tests:

```powershell
./scripts/test_backend.ps1
```

Tests cover:
- API validation behavior
- merged pipeline response contract
- fan-out parallel execution using `Promise.all`

## Notes

- This is a POC with AI-estimated costs, not billing-grade pricing.
- If Grok output is malformed JSON, the backend returns a pipeline failure error.
