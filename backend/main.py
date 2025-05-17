from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import json
import asyncio
from typing import List, Dict
from datetime import datetime
from simulation_controller import SimulationController

app = FastAPI()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.simulation_controller = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        # Create simulation controller if this is the first connection
        if not self.simulation_controller:
            self.simulation_controller = SimulationController(self.broadcast)
            await self.simulation_controller.start_simulation()

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        
        # Stop simulation if no connections remain
        if not self.active_connections and self.simulation_controller:
            asyncio.create_task(self.simulation_controller.stop_simulation())
            self.simulation_controller = None

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                # Handle disconnected clients
                await self.disconnect(connection)

manager = ConnectionManager()

# Simulated vulnerability database
vulnerabilities: Dict[str, dict] = {}

@app.get("/")
async def root():
    return {"message": "CTF Simulator API"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            event = json.loads(data)
            
            # Handle client commands
            if event["type"] == "command":
                await manager.broadcast({
                    "type": "command_response",
                    "timestamp": datetime.now().isoformat(),
                    "data": event["data"]
                })
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# For development, we'll serve the API only and let React dev server handle the frontend
# Remove the static files mounting since we're using separate servers for development
# app.mount("/", StaticFiles(directory="../frontend/build", html=True), name="static") 