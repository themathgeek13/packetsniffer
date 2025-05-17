import random
import asyncio
from typing import List, Dict
from datetime import datetime

class RedTeamAgent:
    def __init__(self):
        self.attack_tools = {
            "port_scan": {
                "name": "Port Scanner",
                "description": "Scans for open ports on the target system",
                "success_rate": 0.8,
                "cooldown": 10  # Seconds before this tool can be used again
            },
            "brute_force": {
                "name": "Brute Force Attack",
                "description": "Attempts to crack passwords through exhaustive search",
                "success_rate": 0.4,
                "cooldown": 15
            },
            "exploit_cve": {
                "name": "CVE Exploiter",
                "description": "Attempts to exploit known vulnerabilities",
                "success_rate": 0.6,
                "cooldown": 20
            },
            "malware_injection": {
                "name": "Malware Injection",
                "description": "Attempts to inject malicious code",
                "success_rate": 0.3,
                "cooldown": 30
            },
            "sql_injection": {
                "name": "SQL Injection",
                "description": "Attempts to exploit SQL injection vulnerabilities",
                "success_rate": 0.5,
                "cooldown": 25
            },
            "social_engineering": {
                "name": "Social Engineering",
                "description": "Attempts to exploit human vulnerabilities through phishing and deception",
                "success_rate": 0.7,
                "cooldown": 35
            },
            "ddos_attack": {
                "name": "DDoS Attack",
                "description": "Launches distributed denial of service attacks",
                "success_rate": 0.65,
                "cooldown": 40
            },
            "man_in_middle": {
                "name": "Man in the Middle",
                "description": "Intercepts and potentially alters network traffic",
                "success_rate": 0.45,
                "cooldown": 30
            },
            "zero_day_exploit": {
                "name": "Zero Day Exploit",
                "description": "Attempts to exploit unknown vulnerabilities",
                "success_rate": 0.25,
                "cooldown": 45
            },
            "ransomware_deployment": {
                "name": "Ransomware Deployment",
                "description": "Attempts to deploy ransomware on target systems",
                "success_rate": 0.35,
                "cooldown": 50
            }
        }
        
        self.discovered_vulnerabilities: List[Dict] = []
        self.last_tool_use = {}  # Track when each tool was last used
        self.successful_patterns = []  # Track successful attack patterns
        self.attack_history = []  # Track all attack attempts

    def update_attack_history(self, attack_data: Dict):
        """Update the history of attacks"""
        self.attack_history.append(attack_data)
        print(f"Updated attack history. Total attacks: {len(self.attack_history)}")

    def _can_use_tool(self, tool_name: str) -> bool:
        """Check if a tool is off cooldown"""
        if tool_name not in self.last_tool_use:
            return True
        
        elapsed = (datetime.now() - self.last_tool_use[tool_name]).total_seconds()
        return elapsed >= self.attack_tools[tool_name]["cooldown"]

    def _update_tool_usage(self, tool_name: str):
        """Update the last use time for a tool"""
        self.last_tool_use[tool_name] = datetime.now()

    def _analyze_success_patterns(self):
        """Analyze which attack patterns have been successful"""
        if len(self.discovered_vulnerabilities) < 2:
            return
        
        # Look at the last two successful attacks
        recent_successes = self.discovered_vulnerabilities[-2:]
        pattern = (recent_successes[0]["type"], recent_successes[1]["type"])
        self.successful_patterns.append(pattern)

    def _get_next_strategic_tool(self) -> str:
        """Choose the next tool based on patterns and cooldowns"""
        available_tools = [
            tool for tool in self.attack_tools.keys()
            if self._can_use_tool(tool)
        ]
        
        if not available_tools:
            return random.choice(list(self.attack_tools.keys()))
        
        # If we have successful patterns, try to follow them
        if self.successful_patterns and len(self.discovered_vulnerabilities) > 0:
            last_attack = self.discovered_vulnerabilities[-1]["type"]
            for pattern in reversed(self.successful_patterns):
                if pattern[0] == last_attack and pattern[1] in available_tools:
                    return pattern[1]
        
        # Otherwise, weight the choice based on success rate
        weights = [
            self.attack_tools[tool]["success_rate"]
            for tool in available_tools
        ]
        return random.choices(available_tools, weights=weights)[0]

    async def execute_attack(self) -> Dict:
        """Simulate an attack attempt"""
        attack_tool = self._get_next_strategic_tool()
        tool_info = self.attack_tools[attack_tool]
        
        # Update tool usage time
        self._update_tool_usage(attack_tool)
        
        # Simulate attack success/failure
        success = random.random() < tool_info["success_rate"]
        
        if success:
            vulnerability = {
                "id": f"vuln_{len(self.discovered_vulnerabilities) + 1}",
                "type": attack_tool,
                "severity": random.choice(["low", "medium", "high", "critical"]),
                "description": f"Vulnerability discovered using {tool_info['name']}: {tool_info['description']}",
                "timestamp": datetime.now().isoformat()
            }
            self.discovered_vulnerabilities.append(vulnerability)
            self._analyze_success_patterns()
        else:
            vulnerability = None
        
        return {
            "tool": attack_tool,
            "tool_name": tool_info["name"],
            "success": success,
            "timestamp": datetime.now().isoformat(),
            "vulnerability": vulnerability
        }

    async def start_attack_cycle(self, callback):
        """Start continuous attack cycle"""
        while True:
            attack_result = await self.execute_attack()
            await callback(attack_result)
            
            # Dynamic delay based on success and tool cooldown
            if attack_result["success"]:
                # Shorter delay after successful attacks
                delay = random.uniform(3, 8)
            else:
                # Longer delay after failed attacks
                delay = random.uniform(8, 15)
            
            await asyncio.sleep(delay) 