#!/bin/bash

echo "Setting up a fresh Python 3.12 virtual environment..."

# Get the absolute path of the project root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Remove old environment if it exists
if [ -d "venv312" ]; then
  echo "Removing existing Python 3.12 environment..."
  rm -rf venv312
fi

# Create new Python 3.12 virtual environment
echo "Creating new Python 3.12 virtual environment..."
python3.12 -m venv venv312

# Activate the new environment
source venv312/bin/activate

# Verify Python version
echo "Using Python version:"
python --version

# Install uv if not already installed
if ! command -v uv &> /dev/null; then
  echo "Installing uv package installer..."
  pip install uv
fi

# Install dependencies with precise versions to avoid compatibility issues
echo "Installing Flask with compatible dependencies..."
uv pip install werkzeug==2.0.0
uv pip install flask==2.0.1
uv pip install flask_cors==3.0.10
uv pip install jinja2==3.0.3
uv pip install itsdangerous==2.0.1
uv pip install markupsafe==2.0.1

echo "Installing Gemini AI and other dependencies..."
uv pip install google-genai
uv pip install aiohttp==3.8.5
uv pip install fastapi==0.104.1
uv pip install uvicorn==0.24.0
uv pip install websockets==12.0
uv pip install python-socketio==5.10.0
uv pip install pydantic==2.5.2
uv pip install asyncio==3.4.3
uv pip install python-jose==3.3.0
uv pip install colorama==0.4.6

echo "Virtual environment setup complete!"
echo "To activate this environment, run:"
echo "source venv312/bin/activate"

# Create a run script for this specific environment
cat > run_py312.sh << 'EOF'
#!/bin/bash

# Get the absolute path of the project root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Activate the Python 3.12 environment
source venv312/bin/activate

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
EOF

chmod +x run_py312.sh

echo "Created run_py312.sh script to run the application with this environment."
echo "Run it with: ./run_py312.sh" 