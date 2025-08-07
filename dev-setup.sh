#!/bin/bash

# IoTFlow Development Setup Script
# Sets up the development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check Node.js and npm
check_node() {
    log "Checking Node.js and npm..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 16+ first."
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install npm first."
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        error "Node.js version 16 or higher is required. Current version: $(node -v)"
    fi
    
    success "Node.js $(node -v) and npm $(npm -v) are ready"
}

# Setup backend
setup_backend() {
    log "Setting up backend..."
    
    cd iotflow-backend
    
    # Copy development environment
    if [ ! -f .env ]; then
        cp .env.development .env
        log "Copied .env.development to .env"
    fi
    
    # Install dependencies
    npm install
    
    # Create necessary directories
    mkdir -p logs uploads src
    
    # Initialize database if it doesn't exist
    if [ ! -f src/database.sqlite ]; then
        log "Initializing database..."
        npm run init-db 2>/dev/null || true
    fi
    
    cd ..
    success "Backend setup completed"
}

# Setup frontend
setup_frontend() {
    log "Setting up frontend..."
    
    cd iotflow-frontend
    
    # Copy development environment
    if [ ! -f .env ]; then
        cp .env.development .env
        log "Copied .env.development to .env"
    fi
    
    # Install dependencies
    npm install
    
    cd ..
    success "Frontend setup completed"
}

# Start development servers
start_dev_servers() {
    log "Starting development servers..."
    
    # Start backend in background
    cd iotflow-backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait a moment for backend to start
    sleep 3
    
    # Start frontend
    cd iotflow-frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
    
    # Save PIDs for cleanup
    echo $BACKEND_PID > .backend.pid
    echo $FRONTEND_PID > .frontend.pid
    
    log "Development servers starting..."
    log "Backend PID: $BACKEND_PID"
    log "Frontend PID: $FRONTEND_PID"
    
    # Wait for services
    sleep 10
    
    echo
    echo "╔══════════════════════════════════════════════════════╗"
    echo "║            🚀 DEVELOPMENT ENVIRONMENT READY! 🚀     ║"
    echo "╠══════════════════════════════════════════════════════╣"
    echo "║                                                      ║"
    echo "║  Frontend:    http://localhost:3000                  ║"
    echo "║  Backend API: http://localhost:3001/api              ║"
    echo "║  WebSocket:   ws://localhost:3001/ws                 ║"
    echo "║                                                      ║"
    echo "║  To stop servers:                                    ║"
    echo "║  ./dev-stop.sh                                       ║"
    echo "║                                                      ║"
    echo "╚══════════════════════════════════════════════════════╝"
    echo
}

# Main function
main() {
    log "Setting up IoTFlow development environment..."
    
    check_node
    setup_backend
    setup_frontend
    
    read -p "Start development servers now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_dev_servers
    else
        echo "Setup completed. Run './dev-start.sh' to start servers later."
    fi
    
    success "Development environment setup completed!"
}

# Handle interruption
trap 'error "Setup interrupted by user"' INT TERM

main "$@"
