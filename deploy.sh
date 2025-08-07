#!/bin/bash

# IoTFlow Deployment Script
# This script sets up and deploys the IoTFlow application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if ports are available
    if netstat -tuln | grep -q ":3000 "; then
        warning "Port 3000 is already in use. The frontend might not start properly."
    fi
    
    if netstat -tuln | grep -q ":3001 "; then
        warning "Port 3001 is already in use. The backend might not start properly."
    fi
    
    success "Prerequisites check completed"
}

# Setup environment
setup_environment() {
    log "Setting up environment..."
    
    # Create logs directories
    mkdir -p iotflow-backend/logs
    mkdir -p iotflow-frontend/logs
    
    # Create uploads directory
    mkdir -p iotflow-backend/uploads
    
    # Set permissions
    chmod 755 iotflow-backend/logs
    chmod 755 iotflow-backend/uploads
    
    success "Environment setup completed"
}

# Build and start services
deploy_services() {
    log "Building and starting IoTFlow services..."
    
    # Stop existing containers if any
    docker-compose down 2>/dev/null || true
    
    # Build and start services
    if docker compose version &> /dev/null; then
        docker compose build --no-cache
        docker compose up -d
    else
        docker-compose build --no-cache
        docker-compose up -d
    fi
    
    success "Services deployed successfully"
}

# Wait for services to be ready
wait_for_services() {
    log "Waiting for services to be ready..."
    
    # Wait for backend
    for i in {1..30}; do
        if curl -f http://localhost:3001/api/health &>/dev/null; then
            success "Backend is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            error "Backend failed to start within 60 seconds"
        fi
        sleep 2
    done
    
    # Wait for frontend
    for i in {1..30}; do
        if curl -f http://localhost:3000 &>/dev/null; then
            success "Frontend is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            error "Frontend failed to start within 60 seconds"
        fi
        sleep 2
    done
}

# Show deployment information
show_info() {
    echo
    echo "╔══════════════════════════════════════════════════════╗"
    echo "║                 🎉 DEPLOYMENT COMPLETE! 🎉          ║"
    echo "╠══════════════════════════════════════════════════════╣"
    echo "║                                                      ║"
    echo "║  IoTFlow Dashboard: http://localhost:3000            ║"
    echo "║  Backend API:       http://localhost:3001/api        ║"
    echo "║  WebSocket:         ws://localhost:3001/ws           ║"
    echo "║                                                      ║"
    echo "║  Default Login:                                      ║"
    echo "║  Username: admin                                     ║"
    echo "║  Password: admin123                                  ║"
    echo "║                                                      ║"
    echo "╠══════════════════════════════════════════════════════╣"
    echo "║  Useful Commands:                                    ║"
    echo "║  • View logs: docker-compose logs -f                ║"
    echo "║  • Stop:      docker-compose down                   ║"
    echo "║  • Restart:   docker-compose restart                ║"
    echo "║  • Status:    docker-compose ps                     ║"
    echo "╚══════════════════════════════════════════════════════╝"
    echo
}

# Main deployment process
main() {
    log "Starting IoTFlow deployment..."
    
    check_prerequisites
    setup_environment
    deploy_services
    wait_for_services
    show_info
    
    success "IoTFlow has been successfully deployed!"
}

# Handle script interruption
trap 'error "Deployment interrupted by user"' INT TERM

# Run main function
main "$@"
