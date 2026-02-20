# pipe-3-v2 — AI-Powered Implementation Planner

Phase 3 of the Missing Link pipeline. Takes pipe-1 codebase analysis + pipe-2 impact analysis and produces:
1. Implementation subtasks with duration estimates (via OpenAI gpt-4o)
2. Code generation prompts per subtask (copy-pasteable agent prompts)
3. Interactive UI to browse impact, subtasks, and prompts

## Quick Start

### 1. Set up environment

```bash
cp .env.example .env
# Edit .env and add your OpenAI API key:
# OPENAI_API_KEY=sk-...
```

### 2. Install & build

```bash
# Server
cd server && npm install && npm run build

# Client
cd ../client && npm install
```

### 3. Run

```bash
# Terminal 1: Start server (port 3002)
cd server && npm start

# Terminal 2: Start client dev server (port 5174)
cd client && npm run dev
```

Open http://localhost:5174 in your browser.

## Prerequisites

Run pipe-1 and pipe-2-v2 first. Their outputs must exist in:
- `out/pipe-1/<runId>/` (project DNA + indexes)
- `out/pipe-2/<runId>/` (impact analysis + Q&A)

## Architecture

```
pipe-3-v2/
├── server/          Express.js + TypeScript backend
│   ├── src/
│   │   ├── ai/          OpenAI engine + prompt templates
│   │   ├── routes/      REST API endpoints
│   │   ├── services/    Input loading, session management
│   │   ├── contracts/   TypeScript interfaces
│   │   └── utils/       Shared utilities
│   └── dist/            Compiled output
│
├── client/          Vite + React + TailwindCSS frontend
│   ├── src/
│   │   ├── pages/       HomePage, RunPage
│   │   ├── components/  Impact, Subtask, Prompt components
│   │   ├── store/       Zustand state management
│   │   └── api/         Axios API layer
│   └── dist/            Production build
│
└── .env             OPENAI_API_KEY (not committed)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inputs/runs` | List available pipe-1 + pipe-2 run pairs |
| POST | `/api/runs` | Create planning session |
| GET | `/api/runs/:id/status` | Poll session status |
| GET | `/api/runs/:id/impact` | Get loaded impact analysis |
| GET | `/api/runs/:id/subtasks` | Get generated subtasks |
| GET | `/api/runs/:id/subtasks/prompts` | Get all agent prompts |
| GET | `/api/runs/:id/subtasks/prompts/:stepId` | Get single prompt |

## Pipeline Flow

```
User opens UI → Selects pipe-1 + pipe-2 run pair
    ↓
Server loads pipe-1 data + pipe-2 impact analysis
    ↓
Impact Analysis dashboard displayed (tab 1)
    ↓
OpenAI generates implementation subtasks with durations
    ↓
Subtask timeline displayed (tab 2)
    ↓
OpenAI generates code prompts per subtask
    ↓
Prompt viewer with copy buttons (tab 3)
    ↓
Output files written to out/pipe-3/<runId>/
```

## Output Files

Written to `out/pipe-3/<runId>/`:

- `roadmap.json` — Implementation plan with subtasks, risks, verification
- `agent_prompt_pack.json` — One detailed prompt per subtask
- `phase3_run.json` — Run metadata

## Tech Stack

- **Server**: Express.js, TypeScript, OpenAI SDK
- **Client**: React 19, Vite, TailwindCSS, Zustand, React Router
- **AI**: OpenAI gpt-4o (2 calls: subtask generation + prompt generation)
