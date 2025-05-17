import random
import asyncio
from typing import List, Dict
from datetime import datetime

class BlueTeamAgent:
    def __init__(self):
        self.defense_tools = {
            "ids": {
                "name": "Intrusion Detection System",
                "description": "Monitors network traffic for suspicious activity",
                "effectiveness": 0.75,
                "cooldown": 5  # Seconds before this tool can be used again
            },
            "firewall": {
                "name": "Adaptive Firewall",
                "description": "Updates firewall rules based on detected threats",
                "effectiveness": 0.85,
                "cooldown": 8
            },
            "patch_manager": {
                "name": "Vulnerability Patcher",
                "description": "Applies security patches to vulnerable systems",
                "effectiveness": 0.9,
                "cooldown": 15
            },
            "threat_analyzer": {
                "name": "Threat Analyzer",
                "description": "Analyzes system behavior for potential threats",
                "effectiveness": 0.7,
                "cooldown": 10
            },
            "system_hardening": {
                "name": "System Hardening",
                "description": "Strengthens system security configurations",
                "effectiveness": 0.8,
                "cooldown": 20
            },
            "honeypot": {
                "name": "Honeypot System",
                "description": "Deploys decoy systems to trap and analyze attacks",
                "effectiveness": 0.7,
                "cooldown": 25
            },
            "ai_threat_detection": {
                "name": "AI-based Threat Detection",
                "description": "Uses machine learning to identify novel attack patterns",
                "effectiveness": 0.85,
                "cooldown": 15
            },
            "network_segmentation": {
                "name": "Network Segmentation",
                "description": "Isolates critical systems and contains breaches",
                "effectiveness": 0.8,
                "cooldown": 30
            },
            "backup_recovery": {
                "name": "Backup and Recovery",
                "description": "Creates and manages system backups for quick recovery",
                "effectiveness": 0.95,
                "cooldown": 40
            },
            "zero_trust": {
                "name": "Zero Trust Framework",
                "description": "Implements strict access controls and verification",
                "effectiveness": 0.9,
                "cooldown": 35
            }
        }
        
        self.patched_vulnerabilities: List[Dict] = []
        self.active_defenses: Dict[str, bool] = {tool: True for tool in self.defense_tools}
        self.last_tool_use = {}  # Track when each tool was last used
        self.attack_patterns = {}  # Track observed attack patterns
        self.threat_level = "low"  # Current assessed threat level
        self.defense_history = []  # Track all defense attempts

    def update_defense_history(self, defense_data: Dict):
        """Update the history of defense actions"""
        self.defense_history.append(defense_data)
        print(f"Updated defense history. Total defenses: {len(self.defense_history)}")

    def _can_use_tool(self, tool_name: str) -> bool:
        """Check if a tool is off cooldown"""
        if tool_name not in self.last_tool_use:
            return True
        
        elapsed = (datetime.now() - self.last_tool_use[tool_name]).total_seconds()
        return elapsed >= self.defense_tools[tool_name]["cooldown"]

    def _update_tool_usage(self, tool_name: str):
        """Update the last use time for a tool"""
        self.last_tool_use[tool_name] = datetime.now()

    def _analyze_attack_pattern(self, attack_data: Dict):
        """Analyze and update observed attack patterns"""
        attack_type = attack_data["tool"]
        
        if attack_type not in self.attack_patterns:
            self.attack_patterns[attack_type] = {
                "attempts": 0,
                "successes": 0,
                "last_seen": None,
                "frequency": 0  # Attacks per minute
            }
        
        pattern = self.attack_patterns[attack_type]
        current_time = datetime.now()
        
        # Update pattern stats
        pattern["attempts"] += 1
        if attack_data.get("success", False):
            pattern["successes"] += 1
        
        # Update frequency
        if pattern["last_seen"]:
            time_diff = (current_time - pattern["last_seen"]).total_seconds()
            if time_diff > 0:
                pattern["frequency"] = 60 / time_diff  # Convert to attacks per minute
        
        pattern["last_seen"] = current_time
        
        # Update threat level based on attack patterns
        self._update_threat_level()

    def _update_threat_level(self):
        """Update the current threat level based on attack patterns"""
        total_attacks = sum(p["attempts"] for p in self.attack_patterns.values())
        total_successes = sum(p["successes"] for p in self.attack_patterns.values())
        max_frequency = max((p["frequency"] for p in self.attack_patterns.values()), default=0)
        
        if total_attacks == 0:
            self.threat_level = "low"
        elif total_successes > total_attacks * 0.5 or max_frequency > 10:
            self.threat_level = "critical"
        elif total_successes > total_attacks * 0.3 or max_frequency > 5:
            self.threat_level = "high"
        elif total_successes > total_attacks * 0.1 or max_frequency > 2:
            self.threat_level = "medium"
        else:
            self.threat_level = "low"

    def _get_best_defense_tool(self, attack_data: Dict) -> str:
        """Choose the most effective defense tool based on the attack and patterns"""
        attack_type = attack_data["tool"]
        available_tools = [
            tool for tool in self.defense_tools.keys()
            if self._can_use_tool(tool)
        ]
        
        if not available_tools:
            return random.choice(list(self.defense_tools.keys()))
        
        # Priority tools based on attack type
        priority_map = {
            "port_scan": ["firewall", "ids"],
            "brute_force": ["system_hardening", "firewall"],
            "exploit_cve": ["patch_manager", "system_hardening"],
            "sql_injection": ["ids", "system_hardening"],
            "malware_injection": ["threat_analyzer", "ids"]
        }
        
        # Try to use priority tools first
        if attack_type in priority_map:
            for tool in priority_map[attack_type]:
                if tool in available_tools:
                    return tool
        
        # If no priority tools available, weight by effectiveness
        weights = [
            self.defense_tools[tool]["effectiveness"]
            for tool in available_tools
        ]
        return random.choices(available_tools, weights=weights)[0]

    async def respond_to_attack(self, attack_data: Dict) -> Dict:
        """Generate a defense response to an attack"""
        # Analyze the attack pattern
        self._analyze_attack_pattern(attack_data)
        
        # Choose best defense tool
        defense_tool = self._get_best_defense_tool(attack_data)
        tool_info = self.defense_tools[defense_tool]
        
        # Update tool usage time
        self._update_tool_usage(defense_tool)
        
        # Adjust effectiveness based on threat level
        threat_multiplier = {
            "low": 1.0,
            "medium": 1.1,
            "high": 1.2,
            "critical": 1.3
        }[self.threat_level]
        
        adjusted_effectiveness = min(1.0, tool_info["effectiveness"] * threat_multiplier)
        
        # Simulate defense effectiveness
        success = random.random() < adjusted_effectiveness
        
        response = {
            "tool": defense_tool,
            "tool_name": tool_info["name"],
            "success": success,
            "timestamp": datetime.now().isoformat(),
            "threat_level": self.threat_level
        }
        
        if success and attack_data.get("vulnerability"):
            patch = {
                "id": f"patch_{len(self.patched_vulnerabilities) + 1}",
                "vulnerability_id": attack_data["vulnerability"]["id"],
                "type": defense_tool,
                "description": f"Vulnerability patched using {tool_info['name']}: {tool_info['description']}",
                "timestamp": datetime.now().isoformat()
            }
            self.patched_vulnerabilities.append(patch)
            response["patch"] = patch
            
        return response

    async def monitor_system(self) -> Dict:
        """Monitor the system for potential threats"""
        # Get available monitoring tools (excluding tools on cooldown)
        available_tools = [
            tool for tool in ["ids", "threat_analyzer"] 
            if self._can_use_tool(tool)
        ]
        
        if not available_tools:
            # Use a random monitoring tool if none are available (ignoring cooldown)
            monitor_tool = random.choice(["ids", "threat_analyzer"])
        else:
            # Choose a monitoring tool
            monitor_tool = random.choice(available_tools)
        
        # Update tool usage
        self._update_tool_usage(monitor_tool)
        
        tool_info = self.defense_tools[monitor_tool]
        
        # Metrics that affect threat assessment
        threat_indicators = {
            "suspicious_connections": random.randint(0, 10),
            "failed_login_attempts": random.randint(0, 5),
            "resource_usage_spikes": random.randint(0, 3),
            "file_system_changes": random.randint(0, 2),
            "unusual_process_activity": random.randint(0, 4)
        }
        
        # Calculate threat score
        threat_score = sum(threat_indicators.values())
        
        # Determine threat level
        if threat_score > 15:
            threat_level = "critical"
        elif threat_score > 10:
            threat_level = "high"
        elif threat_score > 5:
            threat_level = "medium"
        else:
            threat_level = "low"
        
        # Update the current threat level
        self.threat_level = max(self.threat_level, threat_level, key=lambda x: ["low", "medium", "high", "critical"].index(x))
        
        return {
            "tool": monitor_tool,
            "tool_name": tool_info["name"],
            "success": True,  # Monitoring is always "successful"
            "threat_level": self.threat_level,
            "timestamp": datetime.now().isoformat(),
            "indicators": threat_indicators
        }

    async def start_defense_cycle(self, callback):
        """Start continuous defense cycle"""
        while True:
            monitoring_data = await self.monitor_system()
            await callback(monitoring_data)
            
            # Adjust monitoring frequency based on threat level
            delay = {
                "low": 5,
                "medium": 3,
                "high": 2,
                "critical": 1
            }[self.threat_level]
            
            await asyncio.sleep(delay) 