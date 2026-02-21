#!/usr/bin/env bash
# deploy/build.sh — Build all three pipes for production.
# Run from the repo root: bash deploy/build.sh
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo ""
echo "==> Installing gateway dependencies"
cd "$ROOT/deploy/gateway" && npm install

echo ""
echo "==> Compiling pipe-1 CLI (required by pipe-1-v2 server)"
cd "$ROOT/pipe-1"
npm install
npm run build

echo ""
echo "==> Building pipe-1-v2 client (base=/pipe1/)"
cd "$ROOT/pipe-1-v2/client"
npm install
VITE_BASE_PATH=/pipe1/ npm run build

echo ""
echo "==> Building pipe-1-v2 server"
cd "$ROOT/pipe-1-v2/server"
npm install
npm run build

echo ""
echo "==> Building pipe-2-v2 client (base=/pipe2/)"
cd "$ROOT/pipe-2-v2/client"
npm install
VITE_BASE_PATH=/pipe2/ npm run build

echo ""
echo "==> Building pipe-2-v2 server"
cd "$ROOT/pipe-2-v2/server"
npm install
npm run build

echo ""
echo "==> Building pipe-3-v2 client (base=/pipe3/)"
cd "$ROOT/pipe-3-v2/client"
npm install
VITE_BASE_PATH=/pipe3/ npm run build

echo ""
echo "==> Building pipe-3-v2 server"
cd "$ROOT/pipe-3-v2/server"
npm install
npm run build

echo ""
echo "  All builds complete."
