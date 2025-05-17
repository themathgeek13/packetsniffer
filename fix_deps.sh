#!/bin/bash

echo "Fixing dependencies in existing virtual environment..."

# Get the absolute path of the project root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Activate the existing venv
source ctf/bin/activate

echo "Checking if uv is installed..."
if ! command -v uv &> /dev/null; then
    echo "uv not found, installing..."
    pip install uv
fi

echo "Deactivating and reactivating venv to ensure clean environment..."
deactivate
source ctf/bin/activate

echo "Completely removing problematic packages..."
pip uninstall -y flask werkzeug flask-cors jinja2 markupsafe itsdangerous google-generativeai google-genai aiohttp

echo "Installing exact compatible versions of all dependencies..."
pip install werkzeug==2.0.0
pip install flask==2.0.1
pip install flask_cors==3.0.10
pip install jinja2==3.0.3
pip install itsdangerous==2.0.1
pip install markupsafe==2.0.1

echo "Installing Google Generative AI library..."
pip install -q -U google-genai
pip install aiohttp==3.8.5
pip install asyncio==3.4.3

echo "Verifying installations..."
python -c "import flask; print(f'Flask version: {flask.__version__}')"
python -c "import werkzeug; print(f'Werkzeug version: {werkzeug.__version__}')"
python -c "import genai; print('Google Generative AI library installed successfully')"

echo "Dependencies fixed!"
echo "Now you can run the app with:"
echo "./run.sh" 