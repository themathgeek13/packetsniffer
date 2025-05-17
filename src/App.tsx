import React, { useEffect, useState } from 'react';
import Terminal from './components/Terminal';
import VulnerabilityDashboard from './components/VulnerabilityDashboard';
import { websocketService } from './services/websocket';
import './App.css';

interface Vulnerability {
    id: string;
    type: string;
    severity: string;
    description: string;
    timestamp: string;
}

interface Patch {
    id: string;
    vulnerability_id: string;
    type: string;
    description: string;
    timestamp: string;
}

function App() {
    const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
    const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
    const [patches, setPatches] = useState<Patch[]>([]);
    const [lastEvent, setLastEvent] = useState<string>('');

    useEffect(() => {
        // Connect to WebSocket when component mounts
        websocketService.connect();

        // Handle incoming messages
        const unsubscribe = websocketService.onMessage((message) => {
            const timestamp = new Date().toLocaleTimeString();
            
            switch (message.type) {
                case 'attack_event':
                    const attackMsg = `[${timestamp}] 🔴 Red Team: ${message.data.tool_name} - ${message.data.success ? '✓ Success' : '✗ Failed'}`;
                    setTerminalOutput(prev => [...prev, attackMsg]);
                    setLastEvent('attack');
                    if (message.data.vulnerability) {
                        setVulnerabilities(prev => [...prev, message.data.vulnerability]);
                    }
                    break;
                case 'defense_event':
                    const defenseMsg = `[${timestamp}] 🔵 Blue Team: ${message.data.tool_name} - ${message.data.success ? '✓ Patched' : '✗ Failed'}`;
                    setTerminalOutput(prev => [...prev, defenseMsg]);
                    setLastEvent('defense');
                    if (message.data.patch) {
                        setPatches(prev => [...prev, message.data.patch]);
                    }
                    break;
                case 'monitoring_event':
                    const monitorMsg = `[${timestamp}] 🔍 System: Monitoring active - ${Object.entries(message.data.active_defenses)
                        .filter(([_, active]) => active)
                        .map(([tool]) => tool)
                        .join(', ')}`;
                    setTerminalOutput(prev => [...prev, monitorMsg]);
                    setLastEvent('monitoring');
                    break;
                case 'command_response':
                    setTerminalOutput(prev => [...prev, `$ ${message.data}`]);
                    break;
            }
        });

        // Cleanup on unmount
        return () => {
            unsubscribe();
            websocketService.disconnect();
        };
    }, []);

    const handleCommand = (command: string) => {
        websocketService.sendMessage({
            type: 'command',
            data: command
        });
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto py-6 px-4">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Capture The Flag Simulator
                    </h1>
                    <div className="flex items-center space-x-4">
                        <div className={`h-3 w-3 rounded-full ${lastEvent === 'attack' ? 'bg-red-500 animate-pulse' : 'bg-red-200'}`} />
                        <div className={`h-3 w-3 rounded-full ${lastEvent === 'defense' ? 'bg-blue-500 animate-pulse' : 'bg-blue-200'}`} />
                        <div className={`h-3 w-3 rounded-full ${lastEvent === 'monitoring' ? 'bg-green-500 animate-pulse' : 'bg-green-200'}`} />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Terminal Section */}
                    <div className="bg-white rounded-lg shadow-lg p-4">
                        <h2 className="text-xl font-semibold mb-4">Terminal</h2>
                        <div className="h-96 bg-gray-900 rounded-lg overflow-hidden">
                            <Terminal
                                onCommand={handleCommand}
                                output={terminalOutput}
                            />
                        </div>
                    </div>

                    {/* Dashboard Section */}
                    <div className="bg-white rounded-lg shadow-lg">
                        <VulnerabilityDashboard
                            vulnerabilities={vulnerabilities}
                            patches={patches}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App; 