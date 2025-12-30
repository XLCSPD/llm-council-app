#!/bin/bash

# LLM Council Development Startup Script

echo "Starting LLM Council..."

# Start backend
echo "Starting backend server..."
cd backend
uv run uvicorn app.main:app --reload --port 8001 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Start frontend
echo "Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "LLM Council is running!"
echo "  Backend:  http://localhost:8001"
echo "  Frontend: http://localhost:5173"
echo "  API Docs: http://localhost:8001/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Handle shutdown
trap "echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Wait for processes
wait
