/**
 * index.ts – Express server bootstrap for pipe-2-v2.
 */

import express from "express";
import cors from "cors";
import { config, validateConfig } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { phase1Router } from "./routes/phase1.router";
import { runsRouter } from "./routes/runs.router";
import { questionsRouter } from "./routes/questions.router";
import { impactRouter } from "./routes/impact.router";

validateConfig();

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use("/api/phase1", phase1Router);
app.use("/api/runs", runsRouter);
app.use("/api/runs/:runId/questions", questionsRouter);
app.use("/api/runs/:runId/impact", impactRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Error handler (must be last)
// ---------------------------------------------------------------------------

app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(config.port, () => {
  console.log(`\n  pipe-2-v2 server running on http://localhost:${config.port}`);
  console.log(`  Output directory: ${config.outDir}`);
  console.log(`  OpenAI API key: ${config.openaiApiKey ? "configured" : "NOT SET"}\n`);
});
