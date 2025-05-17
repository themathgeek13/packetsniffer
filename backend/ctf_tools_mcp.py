from modelcontextprotocol.sdk import McpServer, StdioServerTransport
from zod_types import z
import asyncio
import json
import os

class CTFToolsServer:
    def __init__(self):
        self.server = McpServer(name="ctf_tools", version="1.0.0")
        self.register_tools()
        self.register_resources()
        self.register_prompts()

    def register_tools(self):
        # Red Team Tools
        @self.server.tool()
        async def port_scan(target: str) -> dict:
            """Scan target system for open ports and vulnerabilities"""
            return {
                "tool": "port_scan",
                "success": True,
                "findings": ["Port 22: SSH", "Port 80: HTTP", "Port 443: HTTPS"],
                "vulnerabilities": ["CVE-2023-1234: OpenSSH < 8.9"]
            }

        @self.server.tool()
        async def exploit_cve(cve_id: str, target: str) -> dict:
            """Attempt to exploit a known CVE on the target system"""
            return {
                "tool": "exploit_cve",
                "success": True,
                "exploit_details": f"Successfully exploited {cve_id}",
                "access_gained": "user"
            }

        @self.server.tool()
        async def brute_force(service: str, target: str) -> dict:
            """Attempt to brute force authentication on a service"""
            return {
                "tool": "brute_force",
                "success": True,
                "credentials_found": {"username": "admin", "password": "******"}
            }

        # Blue Team Tools
        @self.server.tool()
        async def patch_vulnerability(vuln_id: str) -> dict:
            """Apply security patch for a specific vulnerability"""
            return {
                "tool": "patch_vulnerability",
                "success": True,
                "patch_details": f"Successfully patched {vuln_id}",
                "system_status": "secured"
            }

        @self.server.tool()
        async def analyze_traffic(timeframe: int) -> dict:
            """Analyze network traffic for suspicious patterns"""
            return {
                "tool": "analyze_traffic",
                "findings": ["Suspicious outbound connections", "Port scan detected"],
                "threat_level": "medium"
            }

        @self.server.tool()
        async def harden_system(target: str) -> dict:
            """Apply system hardening measures"""
            return {
                "tool": "harden_system",
                "measures_applied": ["Firewall rules updated", "Services restricted"],
                "security_score": 85
            }

    def register_resources(self):
        @self.server.resource()
        async def tool_stats():
            """Get statistics for all tools"""
            return {
                "red_team": {
                    "port_scan": {"uses": 15, "success_rate": 0.8},
                    "exploit_cve": {"uses": 10, "success_rate": 0.6},
                    "brute_force": {"uses": 8, "success_rate": 0.4}
                },
                "blue_team": {
                    "patch_vulnerability": {"uses": 12, "success_rate": 0.9},
                    "analyze_traffic": {"uses": 20, "success_rate": 0.95},
                    "harden_system": {"uses": 5, "success_rate": 0.85}
                }
            }

    def register_prompts(self):
        @self.server.prompt()
        async def red_team_guidance():
            return """You are a Red Team operator. Your goal is to find and exploit vulnerabilities in the target system.
            Available tools:
            - port_scan: Scan for open ports and vulnerabilities
            - exploit_cve: Exploit known CVEs
            - brute_force: Attempt to crack service authentication
            
            Use the tools strategically and maintain stealth when possible."""

        @self.server.prompt()
        async def blue_team_guidance():
            return """You are a Blue Team defender. Your goal is to protect the system from attacks and improve security.
            Available tools:
            - patch_vulnerability: Apply security patches
            - analyze_traffic: Monitor for suspicious activity
            - harden_system: Improve system security
            
            Focus on proactive defense and quick response to threats."""

    async def start(self):
        transport = StdioServerTransport()
        await self.server.serve(transport)

if __name__ == "__main__":
    server = CTFToolsServer()
    asyncio.run(server.start()) 