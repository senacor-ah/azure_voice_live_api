#!/bin/bash

# ============================================================================
# Senacor VoiceLive - Development Startup Script
# ============================================================================
# Startet den kombinierten Next.js + WebSocket Server (senacor-voicelive)
#
# Usage: ./start.sh
# ============================================================================

set -e  # Exit on error

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Konfiguration
SERVER_PORT=3000
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NEXTJS_DIR="${PROJECT_ROOT}/senacor-voicelive"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Senacor VoiceLive - Development Server Startup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ============================================================================
# Funktion: Port-Check und Prozess-Beendigung
# ============================================================================
kill_port_process() {
    local port=$1
    local service_name=$2

    echo -e "${YELLOW}🔍 Checking port ${port} (${service_name})...${NC}"

    local pid=$(lsof -ti tcp:${port} 2>/dev/null || true)

    if [ -z "$pid" ]; then
        echo -e "${GREEN}   ✓ Port ${port} ist frei${NC}"
        return 0
    fi

    echo -e "${RED}   ⚠ Port ${port} wird bereits verwendet (PID: ${pid})${NC}"
    local process_info=$(ps -p ${pid} -o comm= 2>/dev/null || echo "unknown")
    echo -e "${RED}      Prozess: ${process_info}${NC}"

    echo -e "${YELLOW}   → Beende Prozess...${NC}"
    kill -9 ${pid} 2>/dev/null || true
    sleep 1

    local check_pid=$(lsof -ti tcp:${port} 2>/dev/null || true)
    if [ -z "$check_pid" ]; then
        echo -e "${GREEN}   ✓ Port ${port} erfolgreich freigegeben${NC}"
    else
        echo -e "${RED}   ✗ Fehler: Port ${port} konnte nicht freigegeben werden${NC}"
        return 1
    fi
}

# ============================================================================
# Funktion: Node Modules Check
# ============================================================================
check_node_modules() {
    echo -e "${YELLOW}📦 Checking Node modules...${NC}"

    cd "${NEXTJS_DIR}"

    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}   → node_modules nicht gefunden, installiere...${NC}"
        npm install
        echo -e "${GREEN}   ✓ Dependencies installiert${NC}"
    else
        echo -e "${GREEN}   ✓ node_modules gefunden${NC}"
    fi

    cd "${PROJECT_ROOT}"
}

# ============================================================================
# Funktion: .env.local Check
# ============================================================================
check_env_file() {
    echo -e "${YELLOW}⚙️  Checking environment configuration...${NC}"

    if [ ! -f "${NEXTJS_DIR}/.env.local" ]; then
        echo -e "${RED}   ⚠ senacor-voicelive/.env.local nicht gefunden!${NC}"
        echo -e "${YELLOW}   → Kopiere .env.example und trage deine Werte ein:${NC}"
        echo -e "${YELLOW}      cp senacor-voicelive/.env.example senacor-voicelive/.env.local${NC}"
        echo ""
        read -p "   Trotzdem fortfahren? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${RED}Abgebrochen.${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}   ✓ .env.local gefunden${NC}"
    fi
}

# ============================================================================
# Cleanup-Handler für sauberes Beenden
# ============================================================================
cleanup() {
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Shutting down server...${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    if [ ! -z "$SERVER_PID" ]; then
        echo -e "${YELLOW}Stopping server (PID: ${SERVER_PID})...${NC}"
        kill $SERVER_PID 2>/dev/null || true
    fi

    kill_port_process $SERVER_PORT "Server" >/dev/null 2>&1 || true

    echo -e "${GREEN}✓ Server stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# ============================================================================
# MAIN SCRIPT
# ============================================================================

echo -e "${BLUE}Step 1: Port Cleanup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
kill_port_process $SERVER_PORT "Next.js + WebSocket"
# Remove stale Next.js dev lock if present
rm -f "${NEXTJS_DIR}/.next/dev/lock"
echo ""

echo -e "${BLUE}Step 2: Dependency Check${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_node_modules
check_env_file
echo ""

echo -e "${BLUE}Step 3: Setup Directories${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
mkdir -p "${PROJECT_ROOT}/logs"
mkdir -p "${NEXTJS_DIR}/recordings"
echo -e "${GREEN}   ✓ logs/ and recordings/ directories ready${NC}"
echo ""

echo -e "${BLUE}Step 4: Starting Server${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${GREEN}🚀 Starting Senacor VoiceLive on port ${SERVER_PORT}...${NC}"
cd "${NEXTJS_DIR}"
npx tsx --tsconfig tsconfig.json server.ts > "${PROJECT_ROOT}/logs/server.log" 2>&1 &
SERVER_PID=$!
echo -e "${GREEN}   → Server PID: ${SERVER_PID}${NC}"
cd "${PROJECT_ROOT}"

# Warte bis der Server hochgefahren ist
echo -e "${YELLOW}   → Waiting for server to start...${NC}"
for i in {1..15}; do
    sleep 1
    if curl -s http://localhost:${SERVER_PORT}/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}   ✓ Server is up!${NC}"
        break
    fi
    if [ $i -eq 15 ]; then
        echo -e "${RED}   ✗ Server did not start in time. Check logs/server.log${NC}"
    fi
done

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Server started successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📍 URLs:${NC}"
echo -e "   App:       ${GREEN}http://localhost:${SERVER_PORT}${NC}"
echo -e "   Health:    ${GREEN}http://localhost:${SERVER_PORT}/api/health${NC}"
echo -e "   WebSocket: ${GREEN}ws://localhost:${SERVER_PORT}/ws/voice${NC}"
echo ""
echo -e "${BLUE}📋 Logs:${NC}"
echo -e "   Server:  tail -f logs/server.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Keep script running and monitor process
while true; do
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo -e "${RED}⚠ Server crashed! Check logs/server.log${NC}"
        tail -20 "${PROJECT_ROOT}/logs/server.log"
        cleanup
    fi
    sleep 2
done

