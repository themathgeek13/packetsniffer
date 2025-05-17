#!/bin/bash

# Remove existing venv if it exists
rm -rf venv

# Create new venv
python -m venv venv

# Activate venv
source venv/bin/activate

# Install uv
pip install uv

# Install dependencies with specific versions
uv pip install werkzeug==2.0.0
uv pip install flask==2.0.1
uv pip install flask-cors

echo "Virtual environment setup complete. Run 'source venv/bin/activate' to activate it." 