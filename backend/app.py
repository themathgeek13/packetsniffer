from flask import Flask, jsonify, request
from flask_cors import CORS
from api.routes import api_bp
from dotenv import load_dotenv
import os
import asyncio
from flask_socketio import SocketIO
from simulation_controller import SimulationController
import threading
import json
from ctf_tools_mcp import CTFToolsServer

# Load environment variables from .env file
load_dotenv()

# Debug print to check if environment variable is loaded
print("GEMINI_API_KEY present:", bool(os.getenv("GEMINI_API_KEY")))

# Create a global event loop for background tasks
background_loop = None
def run_background_loop():
    global background_loop
    background_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(background_loop)
    background_loop.run_forever()

# Start the background loop in a separate thread
threading.Thread(target=run_background_loop, daemon=True).start()

def create_app():
    app = Flask(__name__)
    CORS(app)
    socketio = SocketIO(app, cors_allowed_origins="*", async_mode='gevent', logger=True, engineio_logger=True)
    
    # Initialize MCP server
    mcp_server = CTFToolsServer()
    
    # Create simulation controller with broadcast callback
    async def broadcast_event(event_data):
        print(f"Broadcasting event: {event_data}")
        socketio.emit('simulation_event', event_data)
    
    simulation_controller = SimulationController(broadcast_event)
    
    # MCP endpoints
    @app.route('/mcp/<server_name>/resources/<resource_name>', methods=['GET'])
    def get_mcp_resource(server_name, resource_name):
        if server_name != 'ctf_tools':
            return jsonify({'error': 'Invalid server name'}), 404
            
        try:
            result = asyncio.run_coroutine_threadsafe(
                mcp_server.server.get_resource(resource_name),
                background_loop
            ).result()
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/mcp/<server_name>/tools/<tool_name>', methods=['POST'])
    def call_mcp_tool(server_name, tool_name):
        if server_name != 'ctf_tools':
            return jsonify({'error': 'Invalid server name'}), 404
            
        try:
            args = request.json
            result = asyncio.run_coroutine_threadsafe(
                mcp_server.server.call_tool(tool_name, args),
                background_loop
            ).result()
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/mcp/<server_name>/prompts/<prompt_name>', methods=['GET'])
    def get_mcp_prompt(server_name, prompt_name):
        if server_name != 'ctf_tools':
            return jsonify({'error': 'Invalid server name'}), 404
            
        try:
            result = asyncio.run_coroutine_threadsafe(
                mcp_server.server.get_prompt(prompt_name),
                background_loop
            ).result()
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @socketio.on('connect')
    def handle_connect():
        print("Client connected", request.sid if 'request' in globals() else 'unknown')
        
    @socketio.on('disconnect')
    def handle_disconnect():
        print("Client disconnected")
    
    @socketio.on('start_simulation')
    def handle_start_simulation():
        print("Starting simulation - received request from client")
        
        def start_background_simulation():
            print("Running simulation in background thread")
            global background_loop
            if background_loop:
                print("Using existing background loop")
                asyncio.run_coroutine_threadsafe(simulation_controller.start_simulation(), background_loop)
                print("Started simulation coroutine")
            else:
                print("ERROR: No background loop available")
                
        # Create background task for simulation
        socketio.start_background_task(start_background_simulation)
        # Send confirmation back to client
        socketio.emit('simulation_started', {'status': 'running'})
        print("Sent simulation_started event")
        
    @socketio.on('stop_simulation')
    def handle_stop_simulation():
        print("Stopping simulation")
        
        def stop_background_simulation():
            print("Stopping simulation in background thread")
            global background_loop
            if background_loop:
                asyncio.run_coroutine_threadsafe(simulation_controller.stop_simulation(), background_loop)
            else:
                print("ERROR: No background loop available")
                
        # Stop simulation in background
        socketio.start_background_task(stop_background_simulation)
        # Send confirmation back to client
        socketio.emit('simulation_stopped', {'status': 'stopped'})
    
    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    
    @app.route('/')
    def root():
        return jsonify({
            "status": "ok",
            "message": "CTF Backend API is running",
            "endpoints": [
                "/api/ctf",
                "/api/health",
                "/socket.io",  # WebSocket endpoint
                "/mcp/ctf_tools/resources/<name>",  # MCP endpoints
                "/mcp/ctf_tools/tools/<name>",
                "/mcp/ctf_tools/prompts/<name>"
            ]
        })
    
    return app, socketio

if __name__ == '__main__':
    app, socketio = create_app()
    socketio.run(app, debug=True, port=5000, allow_unsafe_werkzeug=True) 