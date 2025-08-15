#!/bin/bash

echo "MCP Orchestrator API Launcher"
echo "=============================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please edit .env file with your API keys before running."
    exit 1
fi

# Source environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check for required environment variables
if [ -z "$GEMINI_API_KEY" ]; then
    echo "Warning: GEMINI_API_KEY not set. Orchestration features will be limited."
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo "Warning: GITHUB_TOKEN not set. GitHub API rate limits will apply."
fi

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing/updating dependencies..."
pip install -q -r requirements.txt

# Run the application
echo "Starting FastAPI application..."
echo "Access the API at: http://localhost:8000"
echo "API Documentation: http://localhost:8000/docs"
echo "Press Ctrl+C to stop"

uvicorn main:app --host 0.0.0.0 --port 8000 --reload