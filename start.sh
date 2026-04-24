#!/bin/bash

# ==========================================
# 5G Network-as-Code Platform - Start Script
# ==========================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Load env variables
if [ -f "$PROJECT_DIR/.env" ]; then
  export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

BACKEND_PORT="${BACKEND_PORT:-4000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║    5G Network-as-Code Platform               ║"
echo "  ║    Enterprise Network Management             ║"
echo "  ╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# ---- Step 1: Clean up used ports ----
echo -e "${YELLOW}[1/6] Cleaning up ports $BACKEND_PORT and $FRONTEND_PORT...${NC}"

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "  Killing processes on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  else
    echo -e "  Port $port is free."
  fi
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT

# ---- Step 2: Check PostgreSQL ----
echo -e "\n${YELLOW}[2/6] Checking PostgreSQL connection...${NC}"
if command -v psql &> /dev/null; then
  if psql "$DATABASE_URL" -c "SELECT 1" &>/dev/null; then
    echo -e "  ${GREEN}PostgreSQL is running and accessible.${NC}"
  else
    echo -e "  ${RED}Cannot connect to PostgreSQL. Please ensure it's running.${NC}"
    echo -e "  DATABASE_URL: $DATABASE_URL"
    echo -e "  Try: brew services start postgresql"
    exit 1
  fi
else
  echo -e "  ${YELLOW}psql not found - assuming PostgreSQL is running.${NC}"
fi

# ---- Step 3: Install dependencies ----
echo -e "\n${YELLOW}[3/6] Installing dependencies...${NC}"

cd "$BACKEND_DIR"
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  echo -e "  Installing backend dependencies..."
  npm install --silent
else
  echo -e "  Backend dependencies up to date."
fi

cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  echo -e "  Installing frontend dependencies..."
  npm install --silent
else
  echo -e "  Frontend dependencies up to date."
fi

# ---- Step 4: Create database if needed ----
echo -e "\n${YELLOW}[4/6] Setting up database...${NC}"
DB_NAME=$(echo "$DATABASE_URL" | sed 's/.*\///')
if command -v createdb &> /dev/null; then
  createdb "$DB_NAME" 2>/dev/null && echo -e "  Created database '$DB_NAME'." || echo -e "  Database '$DB_NAME' already exists."
fi

# ---- Step 5: Seed database ----
echo -e "\n${YELLOW}[5/6] Seeding database with sample data...${NC}"
cd "$BACKEND_DIR"
node seed.js
echo -e "  ${GREEN}Database seeded successfully.${NC}"

# ---- Step 6: Start servers with hot-reload ----
echo -e "\n${YELLOW}[6/6] Starting servers with hot-reload...${NC}"

# Function to cleanup on exit
cleanup() {
  echo -e "\n${YELLOW}Shutting down servers...${NC}"
  cleanup_port $BACKEND_PORT
  cleanup_port $FRONTEND_PORT
  wait 2>/dev/null
  echo -e "${GREEN}Servers stopped.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend with nodemon (hot-reload)
cd "$BACKEND_DIR"
npx nodemon server.js &
BACKEND_PID=$!

# Start frontend with Vite (hot-reload built-in)
cd "$FRONTEND_DIR"
npx vite --port $FRONTEND_PORT &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}  ╔══════════════════════════════════════════════╗"
echo -e "  ║  Platform is running!                        ║"
echo -e "  ║                                              ║"
echo -e "  ║  Frontend:  http://localhost:$FRONTEND_PORT            ║"
echo -e "  ║  Backend:   http://localhost:$BACKEND_PORT            ║"
echo -e "  ║                                              ║"
echo -e "  ║  Login:     admin@5gnetwork.com / admin123   ║"
echo -e "  ║                                              ║"
echo -e "  ║  Hot-reload enabled - edit and save files!   ║"
echo -e "  ║  Press Ctrl+C to stop all servers            ║"
echo -e "  ╚══════════════════════════════════════════════╝${NC}"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
