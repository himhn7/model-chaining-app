# Architecture: AI Fan-Out / Fan-In Pipeline

## Objective

Given infrastructure requirements, produce cloud-specific plans in parallel and merge them into one final recommendation.

## Flow

1. Frontend sends `POST /pipeline/run` with user requirements.
2. Backend validates and normalizes input.
3. Backend fan-out stage (`Promise.all`):
   - Call xAI for AWS agent
   - Call xAI for GCP agent
   - Call xAI for Azure agent
4. Backend fan-in stage:
   - Send all 3 outputs to final recommendation agent (xAI)
5. Backend returns:
   - individual cloud results
   - final recommended provider
   - architecture summary
   - cost comparison table

## Sequence Diagram (Logical)

User Input
-> Backend Validation
-> [AWS Agent, GCP Agent, Azure Agent] in parallel
-> Final Recommendation Agent
-> Unified Response to Frontend

## Backend Components

- `src/routes/pipeline.js`: API route and request handling
- `src/utils/validation.js`: input validation/normalization
- `src/services/orchestrator.js`: fan-out/fan-in orchestration
- `src/services/grokClient.js`: xAI API client

## Frontend Components

- `src/App.jsx`: form, stage indicator, results display
- Stage UI states:
  - Validate Input
  - Fan-Out
  - Fan-In
  - Complete

## Failure Handling

- Validation errors return HTTP 400 with details.
- xAI failures return HTTP 500 with `Pipeline execution failed`.
- UI shows error panel and allows rerun/reset.
