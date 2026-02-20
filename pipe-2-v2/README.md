# pipe-2-v2 — AI-Powered PRD Validation & Impact Analysis

Phase 2 of the Missing Link pipeline. Takes a PRD + pipe-1 codebase analysis and produces:
1. AI-generated clarifying questions (via OpenAI gpt-4o)
2. PM interaction portal (chat-style Q&A)
3. Comprehensive impact analysis after clarification

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
# Terminal 1: Start server (port 3001)
cd server && npm start

# Terminal 2: Start client dev server (port 5173)
cd client && npm run dev
```

Open http://localhost:5173 in your browser.

## Architecture

```
pipe-2-v2/
├── server/          Express.js + TypeScript backend
│   ├── src/
│   │   ├── ai/          OpenAI engine + prompt templates
│   │   ├── routes/      REST API endpoints
│   │   ├── services/    Core business logic
│   │   ├── contracts/   TypeScript interfaces (pipe-3 compatible)
│   │   └── utils/       Shared utilities
│   └── dist/            Compiled output
│
├── client/          Vite + React + TailwindCSS frontend
│   ├── src/
│   │   ├── pages/       HomePage, ChatPage
│   │   ├── components/  Chat, Impact, PRD, Phase1 components
│   │   ├── store/       Zustand state management
│   │   └── api/         Axios API layer
│   └── dist/            Production build
│
└── .env             OPENAI_API_KEY (not committed)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/phase1/runs` | List available pipe-1 runs |
| GET | `/api/phase1/runs/:id/summary` | Pipe-1 run summary |
| POST | `/api/runs` | Create analysis session |
| GET | `/api/runs/:id/status` | Poll session status |
| GET | `/api/runs/:id/questions` | Get all questions |
| GET | `/api/runs/:id/questions/current` | Get current question |
| POST | `/api/runs/:id/questions/:qid/answer` | Submit answer |
| GET | `/api/runs/:id/impact` | Get impact analysis |

## Pipeline Flow

```
PM opens UI → Selects codebase → Uploads PRD
    ↓
Server loads pipe-1 data + sends PRD to OpenAI
    ↓
OpenAI generates clarifying questions (3-10)
    ↓
PM answers questions one-by-one in chat UI
    ↓
Server sends PRD + answers to OpenAI for impact analysis
    ↓
Impact analysis displayed in UI + written to out/pipe-2/<runId>/
```

## Output Files (pipe-3 compatible)

Written to `out/pipe-2/<runId>/`:

- `impact_analysis.json` — File-level impact with scores, roles, areas
- `clarifying_questions.json` — Generated questions
- `clarifying_answers.json` — PM's answers
- `phase2_run.json` — Run metadata

## Tech Stack

- **Server**: Express.js, TypeScript, OpenAI SDK
- **Client**: React 19, Vite, TailwindCSS, Zustand, React Router
- **AI**: OpenAI gpt-4o
