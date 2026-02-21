#!/bin/bash

echo "============================================"
echo "  Starting All Pipes (v2)"
echo "============================================"
echo ""
echo "Ports:"
echo "  Pipe-1: Server 3001, Client 5171"
echo "  Pipe-2: Server 3002, Client 5172"
echo "  Pipe-3: Server 3003, Client 5173"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Start pipe-1-v2 server
echo "Starting pipe-1-v2 server..."
(cd pipe-1-v2/server && npm run dev) &
P1_SERVER=$!

# Start pipe-2-v2 server
echo "Starting pipe-2-v2 server..."
(cd pipe-2-v2/server && npm run dev) &
P2_SERVER=$!

# Start pipe-3-v2 server
echo "Starting pipe-3-v2 server..."
(cd pipe-3-v2/server && npm run dev) &
P3_SERVER=$!

# Wait for servers to start
echo "Waiting for servers to start..."
sleep 3

# Start pipe-1-v2 client
echo "Starting pipe-1-v2 client..."
(cd pipe-1-v2/client && npm run dev) &
P1_CLIENT=$!

# Start pipe-2-v2 client
echo "Starting pipe-2-v2 client..."
(cd pipe-2-v2/client && npm run dev) &
P2_CLIENT=$!

# Start pipe-3-v2 client
echo "Starting pipe-3-v2 client..."
(cd pipe-3-v2/client && npm run dev) &
P3_CLIENT=$!

# Wait for clients to start
echo "Waiting for clients to start..."
sleep 5

# Open Chrome windows
echo "Opening Chrome windows..."
if command -v start &> /dev/null; then
  # Windows
  start chrome --new-window "http://localhost:5171"
  sleep 1
  start chrome --new-window "http://localhost:5172"
  sleep 1
  start chrome --new-window "http://localhost:5173"
elif command -v open &> /dev/null; then
  # macOS
  open -a "Google Chrome" "http://localhost:5171"
  open -a "Google Chrome" "http://localhost:5172"
  open -a "Google Chrome" "http://localhost:5173"
else
  # Linux or fallback
  xdg-open "http://localhost:5171" 2>/dev/null || echo "Open http://localhost:5171 in browser"
  xdg-open "http://localhost:5172" 2>/dev/null || echo "Open http://localhost:5172 in browser"
  xdg-open "http://localhost:5173" 2>/dev/null || echo "Open http://localhost:5173 in browser"
fi

echo ""
echo "============================================"
echo "  All pipes started!"
echo "============================================"
echo ""
echo "Press Ctrl+C to stop all processes"

# Wait for any process to exit
wait
