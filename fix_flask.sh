#!/bin/bash

# Install uv if not present
pip install uv

# Install correct versions using uv
uv pip install werkzeug==2.0.0
uv pip install flask==2.0.1
uv pip install flask-cors 