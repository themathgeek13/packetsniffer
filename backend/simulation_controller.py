import asyncio
from typing import Callable, Dict, List
from agents.red_team import RedTeamAgent
from agents.blue_team import BlueTeamAgent
from datetime import datetime
import random
from api.gemini_service import GeminiAgent, call_gemini_api
import json

class SimulationController:
    def __init__(self, broadcast_callback: Callable):
        print("Initializing SimulationController")
        self.red_team = RedTeamAgent()
        self.blue_team = BlueTeamAgent()
        self.broadcast = broadcast_callback
        self.is_running = False
        self.attack_queue = asyncio.Queue()
        self.defense_queue = asyncio.Queue()
        self.last_red_action = None
        self.last_blue_action = None
        self.red_cooldown = 5  # seconds between red team actions
        self.blue_cooldown = 3  # seconds between blue team actions
        self.tasks = []
        
        # Initialize Gemini Agents
        self.red_gemini = GeminiAgent(team="red")
        self.blue_gemini = GeminiAgent(team="blue")
        
        # Attack and defense history for Gemini analysis
        self.attack_history: List[Dict] = []
        self.defense_history: List[Dict] = []
        self.last_gemini_analysis = None

    async def handle_attack(self, attack_data: Dict):
        """Process attack and trigger blue team response"""
        print(f"Handling attack: {attack_data}")
        # Update red team history
        self.red_team.update_attack_history(attack_data)
        
        # Add to history for Gemini analysis
        self.attack_history.append(attack_data)
        
        # Broadcast attack event
        await self.broadcast({
            "type": "attack_event",
            "data": attack_data,
            "timestamp": datetime.now().isoformat()
        })

        # Queue attack for blue team response if successful
        if attack_data.get("success"):
            await self.attack_queue.put(attack_data)
        
        # Periodically get Gemini analysis
        if len(self.attack_history) % 3 == 0:
            await self.get_gemini_analysis("red")

    async def handle_defense(self, defense_data: Dict):
        """Process defense response"""
        print(f"Handling defense: {defense_data}")
        # Update blue team history
        self.blue_team.update_defense_history(defense_data)
        
        # Add to history for Gemini analysis
        self.defense_history.append(defense_data)
        
        # Broadcast defense event
        await self.broadcast({
            "type": "defense_event",
            "data": defense_data,
            "timestamp": datetime.now().isoformat()
        })
        
        # Periodically get Gemini analysis
        if len(self.defense_history) % 3 == 0:
            await self.get_gemini_analysis("blue")

    async def get_gemini_analysis(self, team: str):
        """Get strategic analysis from Gemini based on team history"""
        try:
            history = self.attack_history if team == "red" else self.defense_history
            
            if not history or len(history) < 3:
                return  # Not enough history for analysis
                
            # Last 5 events or all if less than 5
            recent_history = history[-5:]
            
            # Generate success rates
            tools_used = {}
            for event in history:
                tool = event.get("tool", "unknown")
                if tool not in tools_used:
                    tools_used[tool] = {"attempts": 0, "successes": 0}
                
                tools_used[tool]["attempts"] += 1
                if event.get("success", False):
                    tools_used[tool]["successes"] += 1
            
            # Calculate success rates
            success_rates = {}
            for tool, stats in tools_used.items():
                if stats["attempts"] > 0:
                    success_rates[tool] = stats["successes"] / stats["attempts"]
            
            # Prepare prompt for Gemini
            prompt = f"""
            You are an AI cybersecurity expert advising the {team} team in a Capture The Flag competition.
            
            Recent {team} team actions:
            {json.dumps(recent_history, indent=2)}
            
            Success rates by tool:
            {json.dumps(success_rates, indent=2)}
            
            Based on this history, provide a strategic analysis and recommendation for the next action.
            Your response should be concise (2-3 sentences), actionable, and specific to the {team} team.
            {"Focus on which attack vectors to prioritize and why." if team == "red" else "Focus on which defenses to prioritize and why."}
            """
            
            # Call Gemini API
            analysis_result = call_gemini_api(prompt)
            analysis_text = analysis_result['candidates'][0]['content']['parts'][0]['text']
            
            # Store and broadcast the analysis
            self.last_gemini_analysis = {
                "team": team,
                "timestamp": datetime.now().isoformat(),
                "analysis": analysis_text
            }
            
            print(f"Generated Gemini analysis: {analysis_text}")
            
            # Broadcast analysis to clients
            await self.broadcast({
                "type": "gemini_analysis",
                "data": self.last_gemini_analysis,
                "timestamp": datetime.now().isoformat()
            })
            
            # Update the agent context
            if team == "red":
                self.red_gemini.update_context(f"Analysis: {analysis_text}")
            else:
                self.blue_gemini.update_context(f"Analysis: {analysis_text}")
                
        except Exception as e:
            print(f"Error getting Gemini analysis: {str(e)}")

    async def process_defense_queue(self):
        """Process queued attacks and generate defense responses"""
        print("Starting defense queue processor")
        while self.is_running:
            try:
                # Wait for attack to respond to
                attack_data = await self.attack_queue.get()
                print(f"Processing attack in defense queue: {attack_data}")
                
                # Generate defense response
                defense_response = await self.blue_team.respond_to_attack(attack_data)
                await self.handle_defense(defense_response)
                
                # Mark task as done
                self.attack_queue.task_done()
            except asyncio.CancelledError:
                print("Defense queue processor cancelled")
                break
            except Exception as e:
                print(f"Error processing defense queue: {str(e)}")
                await asyncio.sleep(1)
        print("Defense queue processor stopped")

    async def handle_monitoring(self, monitoring_data: Dict):
        """Process and broadcast monitoring data"""
        print(f"Handling monitoring: {monitoring_data}")
        await self.broadcast({
            "type": "monitoring_event",
            "data": monitoring_data,
            "timestamp": datetime.now().isoformat()
        })

    async def continuous_red_team_actions(self):
        """Continuously generate and process red team actions"""
        print("Starting red team action cycle")
        while self.is_running:
            try:
                # Get Gemini recommendation if available
                system_state = {
                    "team_score": len([a for a in self.attack_history if a.get("success", False)]) * 10,
                    "opponent_score": len([d for d in self.defense_history if d.get("success", False)]) * 10,
                    "recent_attacks": self.attack_history[-3:] if self.attack_history else [],
                    "success_rates": self._calculate_success_rates("red")
                }
                
                # Use Gemini to influence attack strategy if we have enough history
                if len(self.attack_history) >= 3:
                    try:
                        gemini_action = await self.red_gemini.get_next_action(system_state)
                        
                        # Use Gemini suggestion to influence attack tool selection
                        if "exploit" in gemini_action.get("command", ""):
                            print(f"Using Gemini-influenced attack strategy: {gemini_action['explanation']}")
                            # This would normally influence the attack parameters
                            pass
                    except Exception as e:
                        print(f"Error with Gemini recommendation: {str(e)}")
                        
                # Generate and process attack
                print("Executing red team attack")
                attack_result = await self.red_team.execute_attack()
                await self.handle_attack(attack_result)
                self.last_red_action = datetime.now()
                
                # Dynamic delay based on success
                if attack_result.get("success", False):
                    delay = max(2, self.red_cooldown - 2)  # Faster on success
                else:
                    delay = min(8, self.red_cooldown + 2)  # Slower on failure
                
                print(f"Red team sleeping for {delay} seconds")
                await asyncio.sleep(delay)
            except asyncio.CancelledError:
                print("Red team action cycle cancelled")
                break
            except Exception as e:
                print(f"Error in red team action cycle: {str(e)}")
                await asyncio.sleep(1)
        print("Red team action cycle stopped")

    async def continuous_blue_team_actions(self):
        """Continuously generate and process blue team monitoring"""
        print("Starting blue team monitoring cycle")
        while self.is_running:
            try:
                # Get Gemini recommendation if available
                system_state = {
                    "team_score": len([d for d in self.defense_history if d.get("success", False)]) * 10,
                    "opponent_score": len([a for a in self.attack_history if a.get("success", False)]) * 10,
                    "recent_defenses": self.defense_history[-3:] if self.defense_history else [],
                    "success_rates": self._calculate_success_rates("blue")
                }
                
                # Use Gemini to influence defense strategy if we have enough history
                if len(self.defense_history) >= 3:
                    try:
                        gemini_action = await self.blue_gemini.get_next_action(system_state)
                        
                        # Use Gemini suggestion to influence defense priorities
                        if "patch" in gemini_action.get("command", ""):
                            print(f"Using Gemini-influenced defense strategy: {gemini_action['explanation']}")
                            # This would normally influence the defense parameters
                            pass
                    except Exception as e:
                        print(f"Error with Gemini recommendation: {str(e)}")
                
                # Generate and process monitoring
                print("Executing blue team monitoring")
                monitoring_data = await self.blue_team.monitor_system()
                await self.handle_monitoring(monitoring_data)
                self.last_blue_action = datetime.now()
                
                # Dynamic delay based on threat level
                delay = {
                    "low": self.blue_cooldown + 2,
                    "medium": self.blue_cooldown,
                    "high": max(1, self.blue_cooldown - 1),
                    "critical": max(0.5, self.blue_cooldown - 2)
                }.get(monitoring_data.get("threat_level", "low"), self.blue_cooldown)
                
                print(f"Blue team sleeping for {delay} seconds")
                await asyncio.sleep(delay)
            except asyncio.CancelledError:
                print("Blue team monitoring cycle cancelled")
                break
            except Exception as e:
                print(f"Error in blue team monitoring cycle: {str(e)}")
                await asyncio.sleep(1)
        print("Blue team monitoring cycle stopped")
    
    def _calculate_success_rates(self, team: str) -> Dict:
        """Calculate success rates for tools used by the specified team"""
        history = self.attack_history if team == "red" else self.defense_history
        tools_used = {}
        
        for event in history:
            tool = event.get("tool", "unknown")
            if tool not in tools_used:
                tools_used[tool] = {"attempts": 0, "successes": 0}
            
            tools_used[tool]["attempts"] += 1
            if event.get("success", False):
                tools_used[tool]["successes"] += 1
        
        # Calculate success rates
        success_rates = {}
        for tool, stats in tools_used.items():
            if stats["attempts"] > 0:
                success_rates[tool] = {
                    "rate": stats["successes"] / stats["attempts"],
                    "attempts": stats["attempts"],
                    "successes": stats["successes"]
                }
        
        return success_rates

    async def start_simulation(self):
        """Start the red team vs blue team simulation"""
        print("Starting simulation in controller")
        self.is_running = True
        
        # Start continuous action cycles
        self.tasks = []
        self.tasks.append(asyncio.create_task(self.continuous_red_team_actions()))
        self.tasks.append(asyncio.create_task(self.continuous_blue_team_actions()))
        self.tasks.append(asyncio.create_task(self.process_defense_queue()))
        
        print(f"Created {len(self.tasks)} simulation tasks")
        
        # Generate an immediate event to test if events are working
        test_event = {
            "type": "monitoring_event",
            "data": {
                "tool_name": "Test Monitor",
                "success": True,
                "threat_level": "low"
            },
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast(test_event)

    async def stop_simulation(self):
        """Stop the simulation"""
        print("Stopping simulation in controller")
        self.is_running = False
        
        # Cancel all tasks
        for task in self.tasks:
            task.cancel()
            
        # Wait for tasks to complete
        if self.tasks:
            await asyncio.gather(*self.tasks, return_exceptions=True)
            
        print("All simulation tasks cancelled") 