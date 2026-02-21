/**
 * start.js — Production launcher.
 * Spawns the three pipe servers and the gateway in one process group.
 * Railway (and any Linux host) runs: node deploy/start.js
 */

const { spawn } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");

// Each pipe service gets its own fixed internal port so Railway's public
// PORT variable (used by the gateway) never bleeds into a pipe server.
const services = [
  {
    name: "pipe-1",
    cwd: path.join(root, "pipe-1-v2/server"),
    cmd: "node",
    args: ["dist/index.js"],
    color: "\x1b[35m", // magenta
    extraEnv: { PORT_PIPE1: "3001" },
  },
  {
    name: "pipe-2",
    cwd: path.join(root, "pipe-2-v2/server"),
    cmd: "node",
    args: ["dist/index.js"],
    color: "\x1b[36m", // cyan
    extraEnv: { PORT_PIPE2: "3002" },
  },
  {
    name: "pipe-3",
    cwd: path.join(root, "pipe-3-v2/server"),
    cmd: "node",
    args: ["dist/index.js"],
    color: "\x1b[32m", // green
    extraEnv: { PORT_PIPE3: "3003" },
  },
  {
    name: "gateway",
    cwd: path.join(root, "deploy/gateway"),
    cmd: "node",
    args: ["index.js"],
    color: "\x1b[33m", // yellow
    extraEnv: {}, // gateway uses Railway's PORT as-is
  },
];

const reset = "\x1b[0m";

function prefix(service) {
  return `${service.color}[${service.name}]${reset} `;
}

function startService(service) {
  const proc = spawn(service.cmd, service.args, {
    cwd: service.cwd,
    stdio: ["ignore", "pipe", "pipe"],
    // extraEnv overrides come last so pipe-specific PORT_PIPEn values
    // always win over Railway's public PORT variable.
    env: { ...process.env, ...service.extraEnv },
  });

  proc.stdout.on("data", (data) => {
    data
      .toString()
      .split("\n")
      .filter(Boolean)
      .forEach((line) => console.log(prefix(service) + line));
  });

  proc.stderr.on("data", (data) => {
    data
      .toString()
      .split("\n")
      .filter(Boolean)
      .forEach((line) => console.error(prefix(service) + line));
  });

  proc.on("exit", (code) => {
    console.error(
      `${prefix(service)}process exited with code ${code}. Restarting in 3s…`,
    );
    setTimeout(() => startService(service), 3000);
  });

  return proc;
}

console.log("\n  Starting all pipeline services…\n");
services.forEach(startService);

// Graceful shutdown
process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
