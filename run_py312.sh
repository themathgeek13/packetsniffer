#!/bin/bash

# Get the absolute path of the project root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Activate the Python 3.12 environment
source py312/bin/activate

# Set the Gemini API key
export GEMINI_API_KEY="AIzaSyBcI7rJmcvZ2JFGvdwZGonXKUkxoGWz4ck"
echo "Using Gemini API key: $GEMINI_API_KEY"

# Start backend server
echo "Starting backend server..."
cd "$SCRIPT_DIR/backend" && GEMINI_API_KEY=$GEMINI_API_KEY python app.py &
BACKEND_PID=$!

# Start frontend server
echo "Starting frontend server..."
cd "$SCRIPT_DIR/frontend" && npm start &
FRONTEND_PID=$!

# Function to handle script exit
cleanup() {
  echo "Stopping servers..."
  kill $BACKEND_PID
  kill $FRONTEND_PID
  exit 0
}

# Register the cleanup function for when the script exits
trap cleanup SIGINT SIGTERM

echo "Servers are running! Open your browser to http://localhost:3000"
echo "Press Ctrl+C to stop both servers."

# Wait for user to press Ctrl+C
wait
