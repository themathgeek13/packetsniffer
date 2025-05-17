import datetime
import json
import os
import random
import subprocess
import sys
import time
from typing import Dict, List, Optional, Union

# Define the flags for each challenge
FLAGS = {
    'web-01': 'flag{sql_1nj3ct10n_m4st3r}',
    'web-02': 'flag{c00k13_m0nst3r_123}',
    'crypto-01': 'flag{r0t13_15_n0t_s3cur3}',
    'forensics-01': 'flag{h1dd3n_1n_pl41n_s1ght}',
    'binary-01': 'flag{buff3r_0v3rfl0w_ftw}'
}

# Store submitted flags and timestamps
submissions = {}

# Simulate vulnerable services responses
VULNERABLE_SERVICES = {
    # SQL Injection service
    ('10.0.0.5', 8080): {
        'curl': lambda params: (
            "<!DOCTYPE html>\n"
            "<html>\n"
            "<head><title>Login</title></head>\n"
            "<body>\n"
            "<h1>Login Page</h1>\n"
            "<form method='POST' action='/login.php'>\n"
            "  <input type='text' name='username' placeholder='Username'>\n"
            "  <input type='password' name='password' placeholder='Password'>\n"
            "  <button type='submit'>Login</button>\n"
            "</form>\n"
            "<!-- TODO: Fix SQL query: SELECT * FROM users WHERE username='$username' AND password='$password' -->\n"
            "</body>\n"
            "</html>"
        ),
        'sqlmap': lambda params: (
            "[*] starting sqlmap scan\n"
            "[*] testing for SQL injection vulnerabilities\n"
            "[+] GET parameter 'username' is vulnerable to SQL injection\n"
            "[*] retrieved: admin\n"
            "[*] retrieved: password_hash\n"
            "[*] retrieved: flag{sql_1nj3ct10n_m4st3r}\n"
            "[+] SQL injection vulnerability confirmed!"
        ),
        'default': lambda params: "Command not supported for this service."
    },
    
    # Cookie manipulation service
    ('10.0.0.5', 8081): {
        'curl': lambda params: (
            "<!DOCTYPE html>\n"
            "<html>\n"
            "<head><title>Admin Panel</title></head>\n"
            "<body>\n"
            "<h1>Access Denied</h1>\n"
            "<p>Only administrators can access this page.</p>\n"
            "<!-- Cookie: isAdmin=false; role=guest -->\n"
            "</body>\n"
            "</html>"
        ),
        'curl -H "Cookie: isAdmin=true; role=admin"': lambda params: (
            "<!DOCTYPE html>\n"
            "<html>\n"
            "<head><title>Admin Panel</title></head>\n"
            "<body>\n"
            "<h1>Admin Panel</h1>\n"
            "<p>Welcome, administrator!</p>\n"
            "<div>Secret flag: flag{c00k13_m0nst3r_123}</div>\n"
            "</body>\n"
            "</html>"
        ),
        'default': lambda params: "Command not supported for this service."
    },
    
    # Buffer overflow service
    ('10.0.0.7', 9999): {
        'nc': lambda params: (
            "Welcome to Vulnerable Service v1.0\n"
            "Enter your name: "
        ),
        'python -c \'print("A"*100)\'': lambda params: (
            "Welcome to Vulnerable Service v1.0\n"
            "Enter your name: " + ("A" * 100) + "\n"
            "Buffer overflow detected!\n"
            "Segmentation fault\n"
            "Core dumped\n"
            "DEBUG: flag{buff3r_0v3rfl0w_ftw}\n"
        ),
        'default': lambda params: "Command not supported for this service."
    },
    
    # Forensics file service
    ('10.0.0.6', None): {
        'find / -type f -name "*.txt" | xargs grep -l "flag"': lambda params: (
            "/var/log/system.log\n"
            "/home/user/Documents/secret_notes.txt\n"
            "/opt/backup/backup_2023.txt\n"
        ),
        'cat /home/user/Documents/secret_notes.txt': lambda params: (
            "My personal notes:\n"
            "1. Remember to change default passwords\n"
            "2. Backup the database weekly\n"
            "3. Hide the flag carefully: flag{h1dd3n_1n_pl41n_s1ght}\n"
            "4. Update firewall rules\n"
        ),
        'strings suspicious_file.jpg': lambda params: (
            "JFIF\n"
            "Exif\n"
            "Photoshop 3.0\n"
            "...\n"
            "flag{h1dd3n_1n_pl41n_s1ght}\n"
            "...\n"
            "IEND\n"
        ),
        'default': lambda params: "Command not supported for this service."
    }
}

def submit_flag(challenge_id, flag):
    """Handle flag submission for CTF challenges."""
    if challenge_id not in FLAGS:
        return {
            "success": False,
            "message": "Invalid challenge ID"
        }
    
    correct_flag = FLAGS[challenge_id]
    timestamp = datetime.datetime.now().isoformat()
    
    # Record the submission
    if challenge_id not in submissions:
        submissions[challenge_id] = []
    
    submissions[challenge_id].append({
        "flag": flag,
        "correct": flag == correct_flag,
        "timestamp": timestamp
    })
    
    if flag == correct_flag:
        return {
            "success": True,
            "message": f"Correct flag for challenge {challenge_id}!"
        }
    else:
        return {
            "success": False,
            "message": "Incorrect flag. Try again!"
        }

def handle_command(command, target=None, port=None):
    """Simulate command execution against vulnerable targets."""
    # Extract target and port from command if provided in format [TARGET=10.0.0.5:8080]
    if command.startswith('[TARGET=') and ']' in command:
        target_info, command = command.split(']', 1)
        target_info = target_info[8:] # Remove [TARGET=
        if ':' in target_info:
            target, port = target_info.split(':')
            port = int(port)
        else:
            target = target_info
            port = None
        command = command.strip()
    
    # Find matching service
    service_key = (target, port)
    
    if service_key in VULNERABLE_SERVICES:
        service = VULNERABLE_SERVICES[service_key]
        # Try exact command match first
        if command in service:
            return service[command](command)
        # Check for command prefixes
        for cmd in service:
            if cmd != 'default' and command.startswith(cmd):
                return service[cmd](command)
        # Default handler
        if 'default' in service:
            return service['default'](command)
    
    # Generic system command simulation
    if command.startswith('ping'):
        return simulate_ping(command)
    elif command.startswith('nmap'):
        return simulate_nmap(command)
    elif command.startswith('echo'):
        return command[5:] if len(command) > 5 else ""
    elif command.startswith('ls'):
        return simulate_ls()
    elif command.startswith('cat'):
        return f"cat: {command[4:].strip()}: No such file or directory"
    elif command == 'help' or command == 'man':
        return "Available commands: ping, nmap, echo, ls, cat, curl, sqlmap, nc, python, find, strings"
    
    # Generic response
    return f"Command executed: {command}"

def simulate_ping(command):
    """Simulate ping command."""
    parts = command.split()
    if len(parts) < 2:
        return "Usage: ping [options] <destination>"
    
    target = parts[-1]
    if target.startswith('10.0.0'):
        return (
            f"PING {target} 56(84) bytes of data.\n"
            "64 bytes icmp_seq=1 ttl=64 time=0.050 ms\n"
            "64 bytes icmp_seq=2 ttl=64 time=0.045 ms\n"
            "64 bytes icmp_seq=3 ttl=64 time=0.046 ms\n"
            f"--- {target} ping statistics ---\n"
            "3 packets transmitted, 3 received, 0% packet loss, time 2035ms\n"
            "rtt min/avg/max/mdev = 0.045/0.047/0.050/0.002 ms"
        )
    else:
        return f"ping: {target}: Name or service not known"

def simulate_nmap(command):
    """Simulate nmap command."""
    parts = command.split()
    target = parts[-1]
    port = None
    
    for i, part in enumerate(parts):
        if part == '-p' and i+1 < len(parts):
            port = parts[i+1]
    
    if target.startswith('10.0.0'):
        result = (
            f"Starting Nmap scan for {target}\n"
            "Scanning 1 host...\n"
        )
        
        if port:
            result += (
                f"PORT      STATE    SERVICE\n"
                f"{port}/tcp  open     "
            )
            if port == '8080':
                result += "http-proxy\n"
            elif port == '8081':
                result += "http\n"
            elif port == '9999':
                result += "unknown\n"
            else:
                result += "filtered\n"
        else:
            result += (
                "PORT      STATE    SERVICE\n"
                "22/tcp    filtered ssh\n"
                "80/tcp    open     http\n"
                "443/tcp   closed   https\n"
            )
            
            if target == '10.0.0.5':
                result += (
                    "8080/tcp  open     http-proxy\n"
                    "8081/tcp  open     http\n"
                )
            elif target == '10.0.0.7':
                result += "9999/tcp  open     unknown\n"
        
        result += f"Nmap scan completed for {target}\n"
        return result
    else:
        return f"Failed to resolve '{target}'. No such host known."

def simulate_ls():
    """Simulate ls command."""
    files = [
        "Documents",
        "Downloads",
        "Pictures",
        "scripts",
        "tools",
        "data.txt",
        "README.md"
    ]
    return "  ".join(files)

# Add a function to handle agent control
def handle_agent_control(data):
    """
    Handle requests to control (play/pause) red or blue team agents
    
    Args:
        data (dict): Control data containing team and action
        
    Returns:
        dict: Response indicating success or failure
    """
    try:
        team = data.get('team')
        action = data.get('action')
        
        if not team or not action:
            return {
                "success": False,
                "message": "Missing required parameters: team and action"
            }
            
        if team not in ['red', 'blue']:
            return {
                "success": False,
                "message": f"Invalid team: {team}. Must be 'red' or 'blue'."
            }
            
        if action not in ['play', 'pause']:
            return {
                "success": False,
                "message": f"Invalid action: {action}. Must be 'play' or 'pause'."
            }
        
        # Logic to actually control the agents would go here
        # For now, we'll just return success
        
        return {
            "success": True,
            "message": f"{action.capitalize()}ed {team} team successfully",
            "data": {
                "team": team,
                "action": action,
                "timestamp": datetime.datetime.now().isoformat()
            }
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error controlling agent: {str(e)}"
        }

# Update the main request handler to support the new function
def handle_ctf_request(request_data):
    """
    Handle CTF-related API requests
    
    Args:
        request_data (dict): The request data
        
    Returns:
        dict: The response data
    """
    request_type = request_data.get('type')
    
    if not request_type:
        return {
            "success": False,
            "message": "Missing request type"
        }
    
    if request_type == 'submit_flag':
        return handle_flag_submission(request_data.get('data', {}))
    elif request_type == 'control_agent':
        return handle_agent_control(request_data.get('data', {}))
    else:
        return {
            "success": False,
            "message": f"Unknown request type: {request_type}"
        }

# Add a function to handle flag submissions
def handle_flag_submission(data):
    """
    Handle CTF flag submission
    
    Args:
        data (dict): The flag submission data
        
    Returns:
        dict: Response indicating success or failure
    """
    challenge_id = data.get('challenge_id')
    flag = data.get('flag')
    
    if not challenge_id or not flag:
        return {
            "success": False,
            "message": "Missing required parameters: challenge_id and flag"
        }
    
    # Sample flags for demonstration
    valid_flags = {
        "challenge1": "CTF{web_vuln_flag}",
        "challenge2": "CTF{network_flag}",
        "challenge3": "CTF{crypto_flag}",
    }
    
    # Check if the flag is correct
    if challenge_id in valid_flags and flag == valid_flags[challenge_id]:
        return {
            "success": True,
            "message": "Flag is correct!",
            "points": 100,
            "data": {
                "challenge_id": challenge_id,
                "timestamp": datetime.datetime.now().isoformat()
            }
        }
    else:
        return {
            "success": False,
            "message": "Incorrect flag. Try again."
        } 