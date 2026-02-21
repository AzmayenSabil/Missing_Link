/**
 * Gateway — routes incoming traffic to the correct pipe sub-server.
 *
 * /pipe1/* → localhost:3001 (Project DNA Engine)
 * /pipe2/* → localhost:3002 (PRD / Impact Analysis)
 * /pipe3/* → localhost:3003 (Implementation Plan)
 */

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 8080;

// ── Sub-server targets ──────────────────────────────────────────────────────
const PIPE1_URL = "http://localhost:3001";
const PIPE2_URL = "http://localhost:3002";
const PIPE3_URL = "http://localhost:3003";

// Helper: create a proxy that strips the path prefix before forwarding
function pipeProxy(target, prefix) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { [`^${prefix}`]: "" },
    on: {
      error: (err, _req, res) => {
        console.error(`[gateway] Proxy error for ${prefix}:`, err.message);
        if (!res.headersSent) {
          res.status(502).json({ error: "Upstream service unavailable" });
        }
      },
    },
  });
}

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/pipe1", pipeProxy(PIPE1_URL, "/pipe1"));
app.use("/pipe2", pipeProxy(PIPE2_URL, "/pipe2"));
app.use("/pipe3", pipeProxy(PIPE3_URL, "/pipe3"));

// ── Landing page ─────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  const host = `${_req.protocol}://${_req.get("host")}`;
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Pipeline</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { max-width: 600px; width: 100%; padding: 2rem; }
    h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; color: #f8fafc; }
    p { color: #94a3b8; margin-bottom: 2rem; }
    .cards { display: flex; flex-direction: column; gap: 1rem; }
    a.card { display: block; padding: 1.25rem 1.5rem; background: #1e293b; border: 1px solid #334155; border-radius: 0.75rem; text-decoration: none; color: inherit; transition: border-color 0.15s, background 0.15s; }
    a.card:hover { border-color: #6366f1; background: #1e2a45; }
    .card-title { font-size: 1rem; font-weight: 600; color: #f1f5f9; margin-bottom: 0.25rem; }
    .card-desc { font-size: 0.875rem; color: #94a3b8; }
    .badge { display: inline-block; font-size: 0.7rem; font-weight: 600; padding: 0.1rem 0.5rem; border-radius: 9999px; margin-right: 0.5rem; }
    .b1 { background: #312e81; color: #a5b4fc; }
    .b2 { background: #1e3a5f; color: #7dd3fc; }
    .b3 { background: #14532d; color: #86efac; }
  </style>
</head>
<body>
  <div class="container">
    <h1>AI-Driven Pipeline</h1>
    <p>Select a pipeline stage to open:</p>
    <div class="cards">
      <a class="card" href="${host}/pipe1/">
        <div class="card-title"><span class="badge b1">Pipe 1</span>Project DNA Engine</div>
        <div class="card-desc">Analyse a codebase and extract architecture, stack, and API contracts.</div>
      </a>
      <a class="card" href="${host}/pipe2/">
        <div class="card-title"><span class="badge b2">Pipe 2</span>PRD & Impact Analysis</div>
        <div class="card-desc">Describe a feature request and get a clarified impact analysis.</div>
      </a>
      <a class="card" href="${host}/pipe3/">
        <div class="card-title"><span class="badge b3">Pipe 3</span>Implementation Plan</div>
        <div class="card-desc">Generate a detailed, subtask-level implementation plan.</div>
      </a>
    </div>
  </div>
</body>
</html>`);
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  Gateway running on http://0.0.0.0:${PORT}`);
  console.log(`  /pipe1 → ${PIPE1_URL}`);
  console.log(`  /pipe2 → ${PIPE2_URL}`);
  console.log(`  /pipe3 → ${PIPE3_URL}\n`);
});
