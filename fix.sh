#!/bin/bash

echo "Emergency dependency fix script"

# Get the absolute path of the project root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo "Removing existing virtual environment..."
rm -rf ctf/

echo "Creating new virtual environment..."
python3 -m venv ctf
source ctf/bin/activate

echo "Installing specific versions of critical dependencies..."
pip install werkzeug==2.0.0
pip install flask==2.0.1
pip install flask_cors==3.0.10
pip install jinja2==3.0.3
pip install itsdangerous==2.0.1
pip install markupsafe==2.0.1

echo "Installing the rest of the dependencies..."
pip install -r requirements.txt

echo "Dependencies fixed!"
echo "Now you can run ./update.sh to start the application" 