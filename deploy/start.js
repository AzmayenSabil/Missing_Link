/**
 * start.js — Production launcher.
 * Spawns the three pipe servers and the gateway in one process group.
 * Railway (and any Linux host) runs: node deploy/start.js
 */

const { spawn } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");

const services = [
  {
    name: "pipe-1",
    cwd: path.join(root, "pipe-1-v2/server"),
    cmd: "node",
    args: ["dist/index.js"],
    color: "\x1b[35m", // magenta
  },
  {
    name: "pipe-2",
    cwd: path.join(root, "pipe-2-v2/server"),
    cmd: "node",
    args: ["dist/index.js"],
    color: "\x1b[36m", // cyan
  },
  {
    name: "pipe-3",
    cwd: path.join(root, "pipe-3-v2/server"),
    cmd: "node",
    args: ["dist/index.js"],
    color: "\x1b[32m", // green
  },
  {
    name: "gateway",
    cwd: path.join(root, "deploy/gateway"),
    cmd: "node",
    args: ["index.js"],
    color: "\x1b[33m", // yellow
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
    env: { ...process.env },
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
      `${prefix(service)}process exited with code ${code}. Restarting in 3s…`
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
