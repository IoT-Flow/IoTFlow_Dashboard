#!/bin/bash

# Stop development servers

if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    echo "Stopping backend server (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null || true
    rm .backend.pid
fi

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    echo "Stopping frontend server (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null || true
    rm .frontend.pid
fi

# Kill any remaining node processes on the ports
pkill -f "node.*3001" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true

echo "Development servers stopped."
