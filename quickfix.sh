#!/bin/bash

echo "QuickFix: Fixing both Flask and Gemini API issues..."

# Get the absolute path of the project root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Activate the existing venv or create it if it doesn't exist
if [ -d "ctf" ]; then
  source ctf/bin/activate
else
  python -m venv ctf
  source ctf/bin/activate
fi

echo "Removing problematic packages..."
pip uninstall -y flask werkzeug flask-cors jinja2 markupsafe itsdangerous google-generativeai aiohttp

echo "Installing Flask with compatible dependencies..."
pip install werkzeug==2.0.0
pip install flask==2.0.1
pip install flask_cors==3.0.10
pip install jinja2==3.0.3
pip install itsdangerous==2.0.1
pip install markupsafe==2.0.1

echo "Installing the correct Google AI library..."
pip install -q -U google-genai
pip install aiohttp==3.8.5

# Set the Gemini API key
export GEMINI_API_KEY="AIzaSyBcI7rJmcvZ2JFGvdwZGonXKUkxoGWz4ck"
echo "Using Gemini API key: $GEMINI_API_KEY"

echo "Starting backend server..."
cd "$SCRIPT_DIR/backend" && GEMINI_API_KEY=$GEMINI_API_KEY python app.py &
BACKEND_PID=$!

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