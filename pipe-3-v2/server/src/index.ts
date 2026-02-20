/**
 * pipe-3-v2 server – Express bootstrap.
 */

import express from "express";
import cors from "cors";
import { config, validateConfig } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { inputsRouter } from "./routes/inputs.router";
import { runsRouter } from "./routes/runs.router";
import { subtasksRouter } from "./routes/subtasks.router";

validateConfig();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Routes
app.use("/api/inputs", inputsRouter);
app.use("/api/runs", runsRouter);
app.use("/api/runs/:runId/subtasks", subtasksRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "pipe-3-v2" });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`\n  pipe-3-v2 server running on http://localhost:${config.port}`);
  console.log(`  Output directory: ${config.outDir}\n`);
});
