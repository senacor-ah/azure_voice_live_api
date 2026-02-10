#!/bin/bash

# ============================================================================
# Azure Voice Live - Development Startup Script
# ============================================================================
# Startet Frontend und Backend mit automatischer Port-Bereinigung
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
FRONTEND_PORT=3000
BACKEND_PORT=5001
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Azure Voice Live - Development Server Startup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ============================================================================
# Funktion: Port-Check und Prozess-Beendigung
# ============================================================================
kill_port_process() {
    local port=$1
    local service_name=$2
    
    echo -e "${YELLOW}🔍 Checking port ${port} (${service_name})...${NC}"
    
    # Finde Prozess auf dem Port (macOS/Linux kompatibel)
    local pid=$(lsof -ti tcp:${port} 2>/dev/null || true)
    
    if [ -z "$pid" ]; then
        echo -e "${GREEN}   ✓ Port ${port} ist frei${NC}"
        return 0
    fi
    
    echo -e "${RED}   ⚠ Port ${port} wird bereits verwendet (PID: ${pid})${NC}"
    
    # Prozess-Info anzeigen
    local process_info=$(ps -p ${pid} -o comm= 2>/dev/null || echo "unknown")
    echo -e "${RED}      Prozess: ${process_info}${NC}"
    
    # Prozess beenden
    echo -e "${YELLOW}   → Beende Prozess...${NC}"
    kill -9 ${pid} 2>/dev/null || true
    
    # Warte kurz
    sleep 1
    
    # Verify
    local check_pid=$(lsof -ti tcp:${port} 2>/dev/null || true)
    if [ -z "$check_pid" ]; then
        echo -e "${GREEN}   ✓ Port ${port} erfolgreich freigegeben${NC}"
    else
        echo -e "${RED}   ✗ Fehler: Port ${port} konnte nicht freigegeben werden${NC}"
        return 1
    fi
}

# ============================================================================
# Funktion: Virtual Environment Check (Python)
# ============================================================================
check_python_venv() {
    echo -e "${YELLOW}🐍 Checking Python environment...${NC}"
    
    cd "${PROJECT_ROOT}/backend"
    
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}   → Virtual environment nicht gefunden, erstelle...${NC}"
        python3 -m venv venv
        source venv/bin/activate
        pip install --upgrade pip
        pip install -r requirements.txt
        echo -e "${GREEN}   ✓ Virtual environment erstellt${NC}"
    else
        echo -e "${GREEN}   ✓ Virtual environment gefunden${NC}"
    fi
    
    cd "${PROJECT_ROOT}"
}

# ============================================================================
# Funktion: Node Modules Check
# ============================================================================
check_node_modules() {
    echo -e "${YELLOW}📦 Checking Node modules...${NC}"
    
    cd "${PROJECT_ROOT}/frontend_new"
    
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
# Funktion: .env Check
# ============================================================================
check_env_file() {
    echo -e "${YELLOW}⚙️  Checking environment configuration...${NC}"
    
    if [ ! -f "${PROJECT_ROOT}/backend/.env" ]; then
        echo -e "${RED}   ⚠ Backend .env Datei nicht gefunden!${NC}"
        echo -e "${YELLOW}   → Siehe backend/ENV_CONFIGURATION.md für Setup-Anleitung${NC}"
        echo ""
        read -p "   Trotzdem fortfahren? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${RED}Abgebrochen.${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}   ✓ Backend .env gefunden${NC}"
    fi
}

# ============================================================================
# Cleanup-Handler für sauberes Beenden
# ============================================================================
cleanup() {
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Shutting down servers...${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Kill Backend
    if [ ! -z "$BACKEND_PID" ]; then
        echo -e "${YELLOW}Stopping Backend (PID: ${BACKEND_PID})...${NC}"
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    # Kill Frontend
    if [ ! -z "$FRONTEND_PID" ]; then
        echo -e "${YELLOW}Stopping Frontend (PID: ${FRONTEND_PID})...${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    # Ensure ports are freed
    kill_port_process $BACKEND_PORT "Backend" >/dev/null 2>&1 || true
    kill_port_process $FRONTEND_PORT "Frontend" >/dev/null 2>&1 || true
    
    echo -e "${GREEN}✓ Servers stopped${NC}"
    exit 0
}

# Register cleanup handler
trap cleanup SIGINT SIGTERM

# ============================================================================
# MAIN SCRIPT
# ============================================================================

echo -e "${BLUE}Step 1: Port Cleanup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
kill_port_process $BACKEND_PORT "Backend"
kill_port_process $FRONTEND_PORT "Frontend"
echo ""

echo -e "${BLUE}Step 2: Dependency Check${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_python_venv
check_node_modules
check_env_file
echo ""

echo -e "${BLUE}Step 3: Setup Directories${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}📁 Creating logs directory...${NC}"
mkdir -p "${PROJECT_ROOT}/logs"
echo -e "${GREEN}   ✓ Logs directory ready${NC}"
echo ""

echo -e "${BLUE}Step 4: Starting Servers${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start Backend
echo -e "${GREEN}🚀 Starting Backend on port ${BACKEND_PORT}...${NC}"
cd "${PROJECT_ROOT}/backend"
source venv/bin/activate

# Export SSL certificate path from certifi
export SSL_CERT_FILE=$(python -m certifi)
export REQUESTS_CA_BUNDLE=$(python -m certifi)
echo -e "${BLUE}   → SSL Certificates: ${SSL_CERT_FILE}${NC}"

export FLASK_ENV=development
python src/app.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}   → Backend PID: ${BACKEND_PID}${NC}"
cd "${PROJECT_ROOT}"

# Warte kurz damit Backend hochfährt
sleep 2

# Start Frontend
echo -e "${GREEN}🚀 Starting Frontend on port ${FRONTEND_PORT}...${NC}"
cd "${PROJECT_ROOT}/frontend_new"
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}   → Frontend PID: ${FRONTEND_PID}${NC}"
cd "${PROJECT_ROOT}"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Servers started successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📍 URLs:${NC}"
echo -e "   Frontend:  ${GREEN}http://localhost:${FRONTEND_PORT}${NC}"
echo -e "   Backend:   ${GREEN}http://localhost:${BACKEND_PORT}${NC}"
echo ""
echo -e "${BLUE}📋 Logs:${NC}"
echo -e "   Backend:  tail -f logs/backend.log"
echo -e "   Frontend: tail -f logs/frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Keep script running and monitor processes
while true; do
    # Check if processes are still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}⚠ Backend crashed! Check logs/backend.log${NC}"
        cleanup
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}⚠ Frontend crashed! Check logs/frontend.log${NC}"
        cleanup
    fi
    
    sleep 2
done

