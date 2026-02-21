# Pipe-1-v2 — Project DNA Engine

Full-stack independent service that maintains an always-up-to-date "Project DNA" for any GitHub repository — and lets you query it in plain language.

## Features

- **GitHub Onboarding** — Paste any public GitHub URL; the engine clones the repo and uses GPT-4o to extract structured DNA.
- **DNA Sections** — Overview, Tech Stack, Architecture, Modules, APIs, Data Models, Conventions, Constraints.
- **Natural-Language Q&A** — Ask anything about a project in plain English. Answers are grounded strictly in the DNA.
- **DNA Evolution** — Notify the engine when a PR is merged. It analyzes the impact and updates the relevant DNA sections with a changelog.
- **Per-Project Storage** — DNA and Q&A history are persisted to disk under `data/projects/<id>/`.

## Quick Start

### Server

```bash
cd pipe-1-v2/server
npm install
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
npm run dev
```

Server runs at **http://localhost:3001**

### Client

```bash
cd pipe-1-v2/client
npm install
npm run dev
```

UI runs at **http://localhost:5173**

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/projects` | Onboard a new project (`{ repoUrl, name? }`) |
| `GET` | `/api/projects/:id` | Get project with DNA |
| `GET` | `/api/projects/:id/status` | Poll ingestion status |
| `GET` | `/api/projects/:id/dna` | Get full DNA |
| `GET` | `/api/projects/:id/dna/:section` | Get a specific DNA section |
| `POST` | `/api/projects/:id/refresh` | Re-ingest the project |
| `DELETE` | `/api/projects/:id` | Delete a project |
| `POST` | `/api/projects/:id/query` | NL Q&A (`{ question }`) |
| `GET` | `/api/projects/:id/queries` | Q&A history |
| `POST` | `/api/projects/:id/evolve` | Evolve DNA after PR (`{ prSummary, changedFiles? }`) |

## Environment Variables

```
PORT=3001
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
DATA_DIR=./data   # optional — defaults to server/data/
```

## Data Layout

```
data/
├── registry.json              # [{id, name, repoUrl, status, ...}]
└── projects/<id>/
    ├── metadata.json          # (embedded in registry, future use)
    ├── repo/                  # Cloned repository (--depth=1)
    ├── dna.json               # Full structured DNA
    └── queries.json           # Q&A history
```
