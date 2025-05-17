#!/bin/bash

# Kill any existing processes on ports 5002, 3000, and 5000 (MCP server)
echo "Cleaning up existing processes..."
lsof -ti:5002 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5000 | xargs kill -9 2>/dev/null

# Start the backend server
echo "Starting backend server..."
cd backend
python app.py &

# Start the MCP server
echo "Starting MCP server..."
python ctf_tools_mcp.py &

# Wait for servers to start
sleep 2

# Start the frontend
echo "Starting frontend..."
cd ../frontend
npm start 