import os
import json
import subprocess
from typing import Dict, Any
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

# Initialize Gemini with the API key
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set")

def call_gemini_api(prompt: str) -> Dict[str, Any]:
    """Call Gemini API using curl command."""
    curl_command = [
        'curl',
        f'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={API_KEY}',
        '-H', 'Content-Type: application/json',
        '-X', 'POST',
        '-d', json.dumps({
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        })
    ]

    try:
        result = subprocess.run(curl_command, capture_output=True, text=True, check=True)
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as e:
        raise Exception(f"Gemini API call failed: {e.stderr}")
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse Gemini API response: {e}")

class GeminiAgent:
    """
    Gemini AI agent for CTF automation
    """
    def __init__(self, team="red"):
        self.team = team
        self.model = "gemini-2.0-flash"
        self.context = []
        self.attack_history = []
        self.defense_history = []
        self.success_rate = {}
        self.update_context(f"You are a {team} team agent in a Capture The Flag (CTF) competition.")
        
        # Add initial strategy based on team
        if team == "red":
            self.update_context(
                "As a red team agent, your goal is to find and exploit vulnerabilities. "
                "You should think strategically about which targets to scan and exploit. "
                "Learn from past attempts and adapt your strategy."
            )
        else:
            self.update_context(
                "As a blue team agent, your goal is to defend against attacks and patch vulnerabilities. "
                "You should monitor for intrusions and quickly apply patches. "
                "Learn from attack patterns and proactively strengthen defenses."
            )
    
    def update_context(self, message):
        """Add a message to the context"""
        self.context.append({
            "message": message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Keep context at a reasonable size but maintain important history
        if len(self.context) > 20:
            # Keep first 5 (initial context) and last 15 (recent events)
            self.context = self.context[:5] + self.context[-15:]

    def update_attack_history(self, attack_data):
        """Track attack attempts and success rates"""
        self.attack_history.append(attack_data)
        
        # Update success rate for this attack type
        attack_type = attack_data.get("tool", "unknown")
        if attack_type not in self.success_rate:
            self.success_rate[attack_type] = {"attempts": 0, "successes": 0}
        
        self.success_rate[attack_type]["attempts"] += 1
        if attack_data.get("success", False):
            self.success_rate[attack_type]["successes"] += 1

    def update_defense_history(self, defense_data):
        """Track defense attempts and effectiveness"""
        self.defense_history.append(defense_data)
        
        # Update success rate for this defense type
        defense_type = defense_data.get("tool", "unknown")
        if defense_type not in self.success_rate:
            self.success_rate[defense_type] = {"attempts": 0, "successes": 0}
        
        self.success_rate[defense_type]["attempts"] += 1
        if defense_data.get("success", False):
            self.success_rate[defense_type]["successes"] += 1

    async def get_next_action(self, system_state):
        """
        Get the next recommended action from Gemini
        
        Args:
            system_state (dict): Current state of the system
            
        Returns:
            dict: Recommended action with command and explanation
        """
        # Prepare the prompt with context and system state
        history_summary = self._get_history_summary()
        success_rates = self._get_success_rates()
        
        prompt = f"""
You are playing as the {self.team} team in a CTF competition.

Recent History:
{history_summary}

Success Rates:
{success_rates}

Current System State:
{json.dumps(system_state, indent=2)}

Your available commands are:
"""
        
        # Add available commands based on team
        if self.team == "red":
            prompt += """
- scan: Scan for vulnerabilities
- exploit <target>: Attempt to exploit a target
- status: Check team status
- clear: Clear terminal

Based on the history and success rates, what is your next strategic move?
Consider:
1. Which attack vectors have been most successful
2. What vulnerabilities haven't been tried yet
3. When to switch between scanning and exploitation
"""
        else:
            prompt += """
- monitor: Monitor for intrusions
- patch <vulnerability>: Apply a patch
- status: Check team status
- clear: Clear terminal

Based on the history and success rates, what is your next strategic move?
Consider:
1. Which defense measures have been most effective
2. What vulnerabilities need immediate attention
3. When to focus on monitoring vs. patching
"""
        
        prompt += """
Respond with a JSON object containing:
{
  "command": "the command to execute", 
  "explanation": "brief explanation of your strategy"
}
"""
        
        try:
            # Get response from Gemini
            response = call_gemini_api(prompt)
            
            # Extract the JSON response
            text = response['candidates'][0]['content']['parts'][0]['text']
            
            # Sometimes the model returns markdown code blocks, so handle that
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            result = json.loads(text)
            
            # Update context with the decision
            self.update_context(f"Decision: {result['command']} because {result['explanation']}")
            
            return result
        except Exception as e:
            print(f"Error getting Gemini response: {str(e)}")
            return self._get_fallback_action(system_state)

    def _get_history_summary(self):
        """Generate a summary of recent actions and their outcomes"""
        if self.team == "red":
            history = self.attack_history[-5:] if self.attack_history else []
            summary = "Recent attacks:\n"
            for attack in history:
                summary += f"- {attack['tool']}: {'✓' if attack.get('success') else '✗'}\n"
        else:
            history = self.defense_history[-5:] if self.defense_history else []
            summary = "Recent defenses:\n"
            for defense in history:
                summary += f"- {defense['tool']}: {'✓' if defense.get('success') else '✗'}\n"
        return summary

    def _get_success_rates(self):
        """Generate a summary of success rates for different tools"""
        summary = "Tool effectiveness:\n"
        for tool, stats in self.success_rate.items():
            if stats["attempts"] > 0:
                rate = (stats["successes"] / stats["attempts"]) * 100
                summary += f"- {tool}: {rate:.1f}% ({stats['successes']}/{stats['attempts']})\n"
        return summary

    def _get_fallback_action(self, system_state):
        """Get a fallback action based on history and state"""
        if self.team == "red":
            # Check if we've had any successful scans
            successful_scans = any(
                attack["tool"] == "scan" and attack.get("success", False)
                for attack in self.attack_history
            )
            
            if not successful_scans:
                return {"command": "scan", "explanation": "No successful scans yet, trying again"}
            
            # If we have vulnerabilities, try to exploit the least attempted one
            vulnerabilities = system_state.get('vulnerabilities', [])
            if vulnerabilities:
                # Count attempts for each vulnerability
                vuln_attempts = {}
                for attack in self.attack_history:
                    if attack["tool"].startswith("exploit"):
                        target = attack["tool"].split(" ")[1]
                        vuln_attempts[target] = vuln_attempts.get(target, 0) + 1
                
                # Find least attempted vulnerability
                least_attempted = min(
                    vulnerabilities,
                    key=lambda v: vuln_attempts.get(v, 0)
                )
                return {
                    "command": f"exploit {least_attempted}",
                    "explanation": f"Trying least attempted vulnerability"
                }
            
            return {"command": "scan", "explanation": "Scanning for new vulnerabilities"}
        else:
            # For blue team, prioritize patching if vulnerabilities exist
            vulnerabilities = system_state.get('vulnerabilities', [])
            if vulnerabilities:
                # Find the vulnerability we've failed to patch the most
                patch_attempts = {}
                for defense in self.defense_history:
                    if defense["tool"].startswith("patch"):
                        target = defense["tool"].split(" ")[1]
                        if not defense.get("success", False):
                            patch_attempts[target] = patch_attempts.get(target, 0) + 1
                
                if patch_attempts:
                    most_failed = max(
                        patch_attempts.items(),
                        key=lambda x: x[1]
                    )[0]
                    return {
                        "command": f"patch {most_failed}",
                        "explanation": f"Attempting to patch frequently failed vulnerability"
                    }
                
                return {
                    "command": f"patch {vulnerabilities[0]}",
                    "explanation": "Patching first available vulnerability"
                }
            
            return {"command": "monitor", "explanation": "Monitoring for new threats"}

    async def analyze_result(self, command, result):
        """
        Analyze the result of a command and update strategy
        
        Args:
            command (str): Command that was executed
            result (str): Result of the command
            
        Returns:
            str: Analysis of the result
        """
        prompt = f"""
You are a {self.team} team agent analyzing the result of a command.

Command executed: {command}
Result: {result}

Provide a brief analysis of this result and what it means for your strategy.
Keep your response focused and actionable. Maximum 2-3 sentences.
"""
        
        try:
            # Get response from Gemini using curl
            response = call_gemini_api(prompt)
            analysis = response['candidates'][0]['content']['parts'][0]['text'].strip()
            
            # Update context with the analysis
            self.update_context(f"Analysis: {analysis}")
            
            return analysis
        except Exception as e:
            print(f"Error getting Gemini analysis: {str(e)}")
            
            # Provide predefined fallback analyses based on command result patterns
            if "success" in result.lower() or "complete" in result.lower():
                if self.team == "red":
                    return "The operation was successful. I should continue with this approach and exploit any vulnerabilities found."
                else:
                    return "Defense measures were successful. I should continue monitoring and patching vulnerabilities as they appear."
            elif "fail" in result.lower() or "error" in result.lower():
                if self.team == "red":
                    return "The attack failed. I should try scanning again or attempt a different exploit method."
                else:
                    return "Defense attempt failed. I should continue monitoring and try a different patching approach."
            else:
                if self.team == "red":
                    return "Results require further analysis. I'll continue scanning and look for exploitation opportunities."
                else:
                    return "I'll continue monitoring the system and be ready to apply patches when vulnerabilities are detected."


# Create instances for red and blue teams
red_agent = GeminiAgent(team="red")
blue_agent = GeminiAgent(team="blue")

# Example async function to get agent actions
async def get_agent_action(team: str, system_state: Dict[str, Any]) -> Dict[str, Any]:
    """Get next action from Gemini agent."""
    # For status commands, return immediately
    if system_state.get('auto_command') == 'status':
        return {
            "command": "status",
            "explanation": "Checking current team status and metrics"
        }

    prompt = f"""As a {team} team agent in a CTF environment, given the following system state:
{json.dumps(system_state, indent=2)}
What should be my next action? Provide a specific command or action to take.
Respond with a JSON object containing:
{{
  "command": "the command to execute",
  "explanation": "brief explanation of your strategy"
}}"""

    try:
        response = call_gemini_api(prompt)
        text = response['candidates'][0]['content']['parts'][0]['text']
        
        # Sometimes the model returns markdown code blocks, so handle that
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        return json.loads(text)
    except Exception as e:
        print(f"Error getting Gemini response: {str(e)}")
        # Fallback responses based on team
        if team == "red":
            return {
                "command": "scan",
                "explanation": "Scanning for initial vulnerabilities"
            }
        else:
            return {
                "command": "monitor",
                "explanation": "Monitoring for potential threats"
            }

# Example async function to analyze results
async def analyze_command_result(team: str, command: str, result: str) -> str:
    """Analyze command result with Gemini agent."""
    # For status commands, provide immediate analysis
    if command == 'status':
        return "Status check complete. Reviewing current metrics to inform next actions."

    prompt = f"""As a {team} team agent in a CTF environment, analyze this command and its result:
Command: {command}
Result: {result}

What insights can you provide about this result? What should I do next? Keep your response focused and actionable. Maximum 2-3 sentences."""

    try:
        response = call_gemini_api(prompt)
        return response['candidates'][0]['content']['parts'][0]['text'].strip()
    except Exception as e:
        print(f"Error getting Gemini analysis: {str(e)}")
        # Fallback analysis based on team and result
        if team == "blue":
            if "success" in result.lower():
                return "Defense measures were successful. Continue monitoring and be ready to respond to new threats."
            else:
                return "Defense attempt requires adjustment. Consider strengthening monitoring and patch application strategy."
        else:
            if "success" in result.lower():
                return "Attack successful. Look for additional vulnerabilities to exploit."
            else:
                return "Attack unsuccessful. Consider trying different attack vectors." 