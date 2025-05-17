from flask import Blueprint, request, jsonify
from .ctf_service import handle_ctf_request
import asyncio
from .gemini_service import get_agent_action, analyze_command_result

api_bp = Blueprint('api', __name__)

@api_bp.route('/ctf', methods=['POST'])
def ctf_endpoint():
    """Handle CTF-related API requests."""
    try:
        request_data = request.get_json()
        response = handle_ctf_request(request_data)
        return jsonify(response)
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error processing request: {str(e)}"
        }), 500

@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "ok"})

@api_bp.route('/agent/action', methods=['POST'])
def agent_action():
    """Get next action from Gemini agent."""
    try:
        request_data = request.get_json()
        team = request_data.get('team', 'red')
        system_state = request_data.get('system_state', {})
        
        # Use asyncio to run the async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(get_agent_action(team, system_state))
        loop.close()
        
        return jsonify({
            "success": True,
            "action": result
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error getting agent action: {str(e)}"
        }), 500

@api_bp.route('/agent/analyze', methods=['POST'])
def agent_analyze():
    """Analyze command result with Gemini agent."""
    try:
        request_data = request.get_json()
        team = request_data.get('team', 'red')
        command = request_data.get('command', '')
        result = request_data.get('result', '')
        
        # Use asyncio to run the async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        analysis = loop.run_until_complete(analyze_command_result(team, command, result))
        loop.close()
        
        return jsonify({
            "success": True,
            "analysis": analysis
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error analyzing result: {str(e)}"
        }), 500 