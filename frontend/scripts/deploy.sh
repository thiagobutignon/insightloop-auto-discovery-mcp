#!/bin/bash

# InsightLoop Frontend Deployment Script
# This script automates the deployment process for the frontend application

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENV_FILE=".env.local"
BUILD_DIR=".next"
PORT=${PORT:-3000}

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check Node version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version must be 18 or higher"
        exit 1
    fi
    
    log_info "Requirements check passed"
}

setup_environment() {
    log_info "Setting up environment..."
    
    # Check if .env.local exists
    if [ ! -f "$ENV_FILE" ]; then
        log_warn ".env.local not found, copying from .env.example"
        if [ -f ".env.example" ]; then
            cp .env.example "$ENV_FILE"
            log_info "Created .env.local from .env.example"
            log_warn "Please update .env.local with your configuration"
        else
            log_error ".env.example not found"
            exit 1
        fi
    fi
}

install_dependencies() {
    log_info "Installing dependencies..."
    npm ci --prefer-offline --no-audit
    log_info "Dependencies installed"
}

run_type_check() {
    log_info "Running TypeScript type check..."
    npm run type-check
    log_info "Type check passed"
}

run_linter() {
    log_info "Running linter..."
    npm run lint
    log_info "Linting passed"
}

build_application() {
    log_info "Building application..."
    npm run build
    log_info "Build completed successfully"
}

# Deployment functions
deploy_local() {
    log_info "Deploying locally..."
    npm start &
    log_info "Application running on http://localhost:$PORT"
}

deploy_docker() {
    log_info "Building Docker image..."
    
    # Check if Dockerfile exists
    if [ ! -f "Dockerfile" ]; then
        log_error "Dockerfile not found"
        exit 1
    fi
    
    docker build -t insightloop-frontend:latest .
    log_info "Docker image built"
    
    log_info "Running Docker container..."
    docker run -d \
        --name insightloop-frontend \
        -p "$PORT:3000" \
        --env-file "$ENV_FILE" \
        insightloop-frontend:latest
    
    log_info "Docker container running on http://localhost:$PORT"
}

deploy_pm2() {
    log_info "Deploying with PM2..."
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        log_warn "PM2 not found, installing..."
        npm install -g pm2
    fi
    
    # Stop existing process if running
    pm2 stop insightloop-frontend 2>/dev/null || true
    pm2 delete insightloop-frontend 2>/dev/null || true
    
    # Start application with PM2
    pm2 start npm --name "insightloop-frontend" -- start
    pm2 save
    
    log_info "Application deployed with PM2"
}

# Main execution
main() {
    log_info "Starting InsightLoop Frontend deployment..."
    
    # Parse arguments
    DEPLOY_TYPE=${1:-local}
    
    # Run checks
    check_requirements
    setup_environment
    
    # Build process
    install_dependencies
    run_type_check
    run_linter
    build_application
    
    # Deploy based on type
    case $DEPLOY_TYPE in
        local)
            deploy_local
            ;;
        docker)
            deploy_docker
            ;;
        pm2)
            deploy_pm2
            ;;
        *)
            log_error "Unknown deployment type: $DEPLOY_TYPE"
            log_info "Usage: ./deploy.sh [local|docker|pm2]"
            exit 1
            ;;
    esac
    
    log_info "Deployment completed successfully!"
}

# Run main function
main "$@"