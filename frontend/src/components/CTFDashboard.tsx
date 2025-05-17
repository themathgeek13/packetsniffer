import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import Terminal from './Terminal';
import ScoreBoard from './ScoreBoard';
import { useTheme } from '../contexts/ThemeContext';
import './CTFDashboard.css';
import { useMcp } from '../hooks/useMcp';

interface CTFDashboardProps {
  onControlTeam: (team: 'red' | 'blue') => void;
}

interface Vulnerability {
  id: string;
  type: string;
  severity: string;
  description: string;
  timestamp: string;
  patched?: boolean;
}

interface Patch {
  id: string;
  vulnerability_id: string;
  type: string;
  description: string;
  timestamp: string;
}

interface SimulationEvent {
  type: 'attack_event' | 'defense_event' | 'monitoring_event';
  data: {
    tool: string;
    tool_name: string;
    success: boolean;
    threat_level?: string;
    vulnerability?: {
      id: string;
      type: string;
      severity: string;
      description: string;
    };
    patch?: {
      id: string;
      vulnerability_id: string;
      type: string;
      description: string;
    };
    indicators?: {
      suspicious_connections: number;
      failed_login_attempts: number;
      resource_usage_spikes: number;
      file_system_changes: number;
      unusual_process_activity: number;
    };
  };
  timestamp: string;
}

type TabType = 'terminals' | 'system';

interface Tool {
  name: string;
  description: string;
  type: 'attack' | 'defense';
  stats: {
    uses: number;
    success_rate: number;
  };
}

const redTeamTools: Tool[] = [
  {
    name: 'Port Scanner',
    description: 'Scan target system for open ports and potential vulnerabilities',
    type: 'attack',
    stats: { uses: 0, success_rate: 0 }
  },
  {
    name: 'CVE Exploiter',
    description: 'Attempt to exploit known vulnerabilities using CVE database',
    type: 'attack',
    stats: { uses: 0, success_rate: 0 }
  },
  {
    name: 'Brute Force',
    description: 'Attempt to crack service authentication through brute force',
    type: 'attack',
    stats: { uses: 0, success_rate: 0 }
  },
  {
    name: 'SQL Injection',
    description: 'Attempt to exploit SQL injection vulnerabilities',
    type: 'attack',
    stats: { uses: 0, success_rate: 0 }
  },
  {
    name: 'Social Engineering',
    description: 'Exploit human vulnerabilities through phishing and deception',
    type: 'attack',
    stats: { uses: 0, success_rate: 0 }
  },
  {
    name: 'DDoS Attack',
    description: 'Launch distributed denial of service attacks',
    type: 'attack',
    stats: { uses: 0, success_rate: 0 }
  },
  {
    name: 'Man in the Middle',
    description: 'Intercept and potentially alter network traffic',
    type: 'attack',
    stats: { uses: 0, success_rate: 0 }
  },
  {
    name: 'Zero Day Exploit',
    description: 'Attempt to exploit unknown vulnerabilities',
    type: 'attack',
    stats: { uses: 0, success_rate: 0 }
  }
];

const blueTeamTools: Tool[] = [
  {
    name: 'Vulnerability Patcher',
    description: 'Apply security patches to fix known vulnerabilities',
    type: 'defense',
    stats: { uses: 0, success_rate: 0 }
  },
  {
    name: 'Traffic Analyzer',
    description: 'Monitor and analyze network traffic for suspicious patterns',
    type: 'defense',
    stats: { uses: 0, success_rate: 0 }
  },
  {
    name: 'System Hardening',
    description: 'Apply system hardening measures to improve security',
    type: 'defense',
    stats: { uses: 0, success_rate: 0 }
  },
  {
    name: 'Honeypot System',
    description: 'Deploy decoy systems to trap and analyze attacks',
    type: 'defense',
    stats: { uses: 0, success_rate: 0 }
  },
  {
    name: 'AI Threat Detection',
    description: 'Use machine learning to identify novel attack patterns',
    type: 'defense',
    stats: { uses: 0, success_rate: 0 }
  },
  {
    name: 'Network Segmentation',
    description: 'Isolate critical systems and contain breaches',
    type: 'defense',
    stats: { uses: 0, success_rate: 0 }
  },
  {
    name: 'Backup Recovery',
    description: 'Create and manage system backups for quick recovery',
    type: 'defense',
    stats: { uses: 0, success_rate: 0 }
  },
  {
    name: 'Zero Trust Framework',
    description: 'Implement strict access controls and verification',
    type: 'defense',
    stats: { uses: 0, success_rate: 0 }
  }
];

const ToolIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'Port Scanner':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z" />
        </svg>
      );
    case 'CVE Exploiter':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
        </svg>
      );
    case 'Brute Force':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
        </svg>
      );
    case 'Vulnerability Patcher':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
        </svg>
      );
    case 'Traffic Analyzer':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
        </svg>
      );
    case 'System Hardening':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
        </svg>
      );
    default:
      return null;
  }
};

const CTFDashboard: React.FC<CTFDashboardProps> = ({ onControlTeam }) => {
  const { theme } = useTheme();
  // Add constant for max terminal lines
  const MAX_TERMINAL_LINES = 100;
  const [redTerminalOutput, setRedTerminalOutput] = useState<string[]>([]);
  const [blueTerminalOutput, setBlueTerminalOutput] = useState<string[]>([]);
  const [redScore, setRedScore] = useState(0);
  const [blueScore, setBlueScore] = useState(0);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [useLocalSimulation, setUseLocalSimulation] = useState(false);
  const [redAttackHistory, setRedAttackHistory] = useState<any[]>([]);
  const [blueDefenseHistory, setBlueDefenseHistory] = useState<any[]>([]);
  const [geminiAnalysis, setGeminiAnalysis] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('terminals');
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [patches, setPatches] = useState<Patch[]>([]);
  const [lastAttack, setLastAttack] = useState<string | null>(null);
  const [lastDefense, setLastDefense] = useState<string | null>(null);
  
  // Add refs for scrolling
  const vulnListRef = useRef<HTMLDivElement>(null);
  const patchListRef = useRef<HTMLDivElement>(null);
  
  // Update attack stats interface
  const [attackStats, setAttackStats] = useState({
    totalAttempts: 0,
    successfulAttempts: 0,
    successRate: 0,
    avgSeverity: 'low',
    lastAttackTime: 0
  });
  
  // Update defense stats interface
  const [defenseStats, setDefenseStats] = useState({
    totalPatches: 0,
    successfulPatches: 0,
    responseTime: 0,
    preventionRate: 0,
    lastDefenseTime: 0
  });
  
  // Add new state for enhanced analysis
  const [analysisMetrics, setAnalysisMetrics] = useState({
    attackPattern: '',
    defensePattern: '',
    redTeamRecommendation: '',
    blueTeamRecommendation: '',
    confidence: 0
  });
  
  // Add state for sidebar collapse
  const [isGeminiCollapsed, setIsGeminiCollapsed] = useState(false);
  
  // Add new state for network visualization
  const [selectedEntity, setSelectedEntity] = useState<'attacker' | 'target' | null>(null);
  const [showAttackDetails, setShowAttackDetails] = useState(false);
  
  const { mcpClient } = useMcp('ctf_tools');
  
  // Update tool stats from MCP server
  useEffect(() => {
    const updateToolStats = async () => {
      if (!mcpClient) return;
      
      try {
        const stats = await mcpClient.getResource('tool_stats');
        
        // Update red team tool stats
        redTeamTools.forEach(tool => {
          const mcpStats = stats.red_team[tool.name.toLowerCase().replace(' ', '_')];
          if (mcpStats) {
            tool.stats = mcpStats;
          }
        });
        
        // Update blue team tool stats
        blueTeamTools.forEach(tool => {
          const mcpStats = stats.blue_team[tool.name.toLowerCase().replace(' ', '_')];
          if (mcpStats) {
            tool.stats = mcpStats;
          }
        });
      } catch (error) {
        console.error('Failed to fetch tool stats:', error);
      }
    };
    
    updateToolStats();
  }, [mcpClient]);
  
  // Handle tool selection
  const handleToolSelect = async (tool: Tool) => {
    if (!mcpClient) return;
    
    try {
      let result;
      switch (tool.name) {
        case 'Port Scanner':
          result = await mcpClient.callTool('port_scan', { target: 'system' });
          break;
        case 'CVE Exploiter':
          result = await mcpClient.callTool('exploit_cve', { 
            cve_id: 'CVE-2023-1234',
            target: 'system'
          });
          break;
        case 'Brute Force':
          result = await mcpClient.callTool('brute_force', {
            service: 'ssh',
            target: 'system'
          });
          break;
        case 'Vulnerability Patcher':
          result = await mcpClient.callTool('patch_vulnerability', {
            vuln_id: 'CVE-2023-1234'
          });
          break;
        case 'Traffic Analyzer':
          result = await mcpClient.callTool('analyze_traffic', {
            timeframe: 300
          });
          break;
        case 'System Hardening':
          result = await mcpClient.callTool('harden_system', {
            target: 'system'
          });
          break;
      }
      
      // Process tool result and update simulation state
      if (result) {
        handleSimulationEvent({
          type: tool.type === 'attack' ? 'attack_event' : 'defense_event',
          data: result,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to execute tool:', error);
    }
  };

  // Update attack stats interface
  useEffect(() => {
    const updateAttackStats = () => {
      const totalAttempts = redAttackHistory.length;
      const successfulAttempts = redAttackHistory.filter(e => e.success).length;
      const successRate = totalAttempts > 0 ? Math.round((successfulAttempts / totalAttempts) * 100) : 0;
      
      setAttackStats(prev => ({
        ...prev,
        totalAttempts,
        successfulAttempts,
        successRate,
        avgSeverity: redAttackHistory.length > 0 ? redAttackHistory[redAttackHistory.length - 1].threat_level || 'low' : 'low',
        lastAttackTime: Date.now()
      }));
    };
    
    updateAttackStats();
  }, [redAttackHistory]);

  // Update defense stats interface
  useEffect(() => {
    const updateDefenseStats = () => {
      const totalPatches = blueDefenseHistory.length;
      const successfulPatches = blueDefenseHistory.filter(e => e.success).length;
      const preventionRate = totalPatches > 0 ? Math.round((successfulPatches / totalPatches) * 100) : 0;
      
      setDefenseStats(prev => ({
        ...prev,
        totalPatches,
        successfulPatches,
        responseTime: blueDefenseHistory.length > 0 ? blueDefenseHistory[blueDefenseHistory.length - 1].responseTime || 0 : 0,
        preventionRate,
        lastDefenseTime: Date.now()
      }));
    };
    
    updateDefenseStats();
  }, [blueDefenseHistory]);

  // Update handleSimulationEvent with proper rate calculations
  const handleSimulationEvent = useCallback((event: SimulationEvent) => {
    console.log('Received simulation event:', event);
    const timestamp = new Date(event.timestamp).toLocaleTimeString();
    
    switch (event.type) {
      case 'attack_event':
        console.log('Processing attack event');
        const attackResult = event.data;
        const currentTime = Date.now();
        
        // Update attack statistics with proper success rate calculation
        setAttackStats(prev => {
          const newSuccessfulAttempts = attackResult.success ? prev.successfulAttempts + 1 : prev.successfulAttempts;
          const newTotalAttempts = prev.totalAttempts + 1;
          const newSuccessRate = newTotalAttempts > 0 ? Math.round((newSuccessfulAttempts / newTotalAttempts) * 100) : 0;
          
          return {
            totalAttempts: newTotalAttempts,
            successfulAttempts: newSuccessfulAttempts,
            successRate: newSuccessRate,
            avgSeverity: attackResult.threat_level || prev.avgSeverity,
            lastAttackTime: currentTime
          };
        });
        
        // Create detailed attack message
        let attackMessage = `[${timestamp}] ${attackResult.tool_name}: ${attackResult.success ? '✓' : '✗'}`;
        
        if (attackResult.vulnerability) {
          attackMessage += `\n    → Found ${attackResult.vulnerability.severity.toUpperCase()} severity vulnerability`;
          attackMessage += `\n    → ${attackResult.vulnerability.description}`;
          
          // Add vulnerability to system state
          const newVulnerability: Vulnerability = {
            ...attackResult.vulnerability,
            timestamp: event.timestamp,
            patched: false
          };
          setVulnerabilities(prev => [...prev, newVulnerability]);
          
          // Set last attack details for visualization
          setLastAttack(attackResult.tool_name);
          
          // Add attack to history for Gemini analysis
          const newAttack = {
            ...attackResult,
            timestamp
          };
          setRedAttackHistory(prev => [...prev, newAttack]);
          
          // Enhanced Gemini analysis using both attack and defense history
          if (redAttackHistory.length > 3) {
            const attackPatterns = redAttackHistory.slice(-4).map(a => a.tool_name);
            const defensePatterns = blueDefenseHistory.slice(-4).map(d => d.tool_name);
            
            // Calculate attack success rate for recent attacks
            const recentAttacks = redAttackHistory.slice(-4);
            const successRate = (recentAttacks.filter(a => a.success).length / recentAttacks.length) * 100;
            
            // Analyze patterns
            const repeatedAttacks = attackPatterns.filter((item, index) => attackPatterns.indexOf(item) !== index);
            const repeatedDefenses = defensePatterns.filter((item, index) => defensePatterns.indexOf(item) !== index);
            
            let recommendation = '';
            let confidence = 0;
            
            if (repeatedDefenses.length > 0) {
              recommendation = `Defense is focusing on ${repeatedDefenses.join(", ")}. Consider exploring alternative attack vectors.`;
              confidence = 85;
            } else if (successRate > 75) {
              recommendation = `Current attack pattern is highly effective (${Math.round(successRate)}% success rate). Maintain pressure with ${attackPatterns[3]}.`;
              confidence = 90;
            } else if (repeatedAttacks.length > 0) {
              recommendation = `Attack pattern becoming predictable. Diversify approach and target system's ${defensePatterns[0]} weakness.`;
              confidence = 75;
            } else {
              recommendation = `System appears vulnerable to ${attackPatterns[2]} and ${attackPatterns[3]} combinations.`;
              confidence = 65;
            }
            
            setAnalysisMetrics({
              attackPattern: attackPatterns.join(" → "),
              defensePattern: defensePatterns.join(" → "),
              redTeamRecommendation: `Current attack pattern is highly effective (${Math.round(successRate)}% success rate). Maintain pressure with ${attackPatterns[3]}.`,
              blueTeamRecommendation: `Defense needs strengthening against ${attackPatterns[2]} and ${attackPatterns[3]}. Consider deploying ${defensePatterns[0]} proactively.`,
              confidence
            });
            
            setGeminiAnalysis(recommendation);
          }
        }
        
        // Update terminal output with max length limit
        setRedTerminalOutput(prev => [
          ...prev.slice(-MAX_TERMINAL_LINES + 1),
          attackMessage
        ]);
        
        if (attackResult.success) {
          setRedScore(prev => prev + 10);
        }
        break;
        
      case 'defense_event':
        console.log('Processing defense event');
        const defenseResult = event.data;
        const defenseTime = Date.now();
        
        // Update defense statistics with proper calculations
        setDefenseStats(prev => {
          const newSuccessfulPatches = defenseResult.success ? prev.successfulPatches + 1 : prev.successfulPatches;
          const newTotalPatches = prev.totalPatches + 1;
          const timeSinceLastAttack = attackStats.lastAttackTime ? defenseTime - attackStats.lastAttackTime : 0;
          const newPreventionRate = newTotalPatches > 0 ? Math.round((newSuccessfulPatches / newTotalPatches) * 100) : 0;
          
          return {
            totalPatches: newTotalPatches,
            successfulPatches: newSuccessfulPatches,
            responseTime: timeSinceLastAttack ? Math.round((prev.responseTime + timeSinceLastAttack) / 2) : prev.responseTime,
            preventionRate: newPreventionRate,
            lastDefenseTime: defenseTime
          };
        });
        
        // Create detailed defense message
        let defenseMessage = `[${timestamp}] ${defenseResult.tool_name}: ${defenseResult.success ? '✓' : '✗'}`;
        
        if (defenseResult.patch) {
          defenseMessage += `\n    → Patched vulnerability ID: ${defenseResult.patch.vulnerability_id}`;
          defenseMessage += `\n    → ${defenseResult.patch.description}`;
          
          // Add patch to system state
          const newPatch: Patch = {
            ...defenseResult.patch,
            timestamp: event.timestamp
          };
          setPatches(prev => [...prev, newPatch]);
          
          // Mark vulnerability as patched
          setVulnerabilities(prev => 
            prev.map(v => 
              v.id === defenseResult.patch?.vulnerability_id 
                ? { ...v, patched: true } 
                : v
            )
          );
          
          // Set last defense details for visualization
          setLastDefense(defenseResult.tool_name);
          
          // Add defense to history for Gemini analysis
          const newDefense = {
            ...defenseResult,
            timestamp
          };
          setBlueDefenseHistory(prev => [...prev, newDefense]);
        }
        
        // Update terminal output with max length limit
        setBlueTerminalOutput(prev => [
          ...prev.slice(-MAX_TERMINAL_LINES + 1),
          defenseMessage
        ]);
        
        if (defenseResult.success) {
          setBlueScore(prev => prev + 10);
        }
        break;
        
      case 'monitoring_event':
        console.log('Processing monitoring event');
        const monitoringData = event.data;
        
        // Create detailed monitoring message
        let monitoringMessage = `[${timestamp}] Threat Level: ${monitoringData.threat_level?.toUpperCase()}`;
        
        if (monitoringData.indicators) {
          monitoringMessage += `\n    → Suspicious connections: ${monitoringData.indicators.suspicious_connections}`;
          monitoringMessage += `\n    → Failed login attempts: ${monitoringData.indicators.failed_login_attempts}`;
          monitoringMessage += `\n    → Unusual process activity: ${monitoringData.indicators.unusual_process_activity}`;
        }
        
        // Update terminal output with max length limit
        setBlueTerminalOutput(prev => [
          ...prev.slice(-MAX_TERMINAL_LINES + 1),
          monitoringMessage
        ]);
        break;
    }
  }, [redAttackHistory, blueDefenseHistory, attackStats.lastAttackTime]);

  // Socket connection setup with handleSimulationEvent in dependencies
  useEffect(() => {
    console.log('Connecting to WebSocket...');
    
    try {
      const newSocket = io('http://localhost:5000', { 
        transports: ['polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        timeout: 3000
      });
      
      newSocket.on('connect', () => {
        console.log('WebSocket connected!', newSocket.id);
        setConnectionStatus('connected');
        setUseLocalSimulation(false);
      });
      
      newSocket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
      });
      
      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setConnectionStatus('error: websocket error');
        setUseLocalSimulation(true);
      });
      
      setSocket(newSocket);

      // Listen for simulation events
      newSocket.on('simulation_event', handleSimulationEvent);

      // Listen for simulation started confirmation
      newSocket.on('simulation_started', (data) => {
        console.log('Simulation started confirmation received:', data);
        setRedTerminalOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] Simulation started`]);
        setBlueTerminalOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] Simulation started`]);
      });

      // Listen for simulation stopped confirmation
      newSocket.on('simulation_stopped', (data) => {
        console.log('Simulation stopped confirmation received:', data);
        setRedTerminalOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] Simulation stopped`]);
        setBlueTerminalOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] Simulation stopped`]);
      });

      // Listen for Gemini analysis
      newSocket.on('gemini_analysis', (data) => {
        console.log('Gemini analysis received:', data);
        setGeminiAnalysis(data.analysis);
      });

      return () => {
        console.log('Disconnecting WebSocket');
        newSocket.close();
      };
    } catch (error) {
      console.error('Error setting up socket connection:', error);
      setConnectionStatus('error: setup failed');
      setUseLocalSimulation(true);
      return () => {};
    }
  }, [handleSimulationEvent]);

  // Local event simulation with handleSimulationEvent in dependencies
  useEffect(() => {
    if (!isSimulationRunning || !useLocalSimulation) return;

    console.log('Starting local event simulation');
    setConnectionStatus('connected (local)');
    
    const generateMockEvents = () => {
      console.log('Generating mock event, simulation running:', isSimulationRunning);
      
      // Select a random event type
      const eventTypes = ['attack_event', 'defense_event', 'monitoring_event'];
      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)] as 'attack_event' | 'defense_event' | 'monitoring_event';
      
      // Select appropriate tool name based on event type
      let toolNames: string[];
      let toolTypes: string[];
      
      if (randomType === 'attack_event') {
        toolTypes = ['port_scan', 'brute_force', 'exploit_cve', 'malware_injection', 'sql_injection'];
        toolNames = ['Port Scanner', 'Brute Force Attack', 'CVE Exploiter', 'Malware Injection', 'SQL Injection'];
      } else if (randomType === 'defense_event') {
        toolTypes = ['ids', 'firewall', 'patch_manager', 'threat_analyzer', 'system_hardening'];
        toolNames = ['Intrusion Detection System', 'Adaptive Firewall', 'Vulnerability Patcher', 'Threat Analyzer', 'System Hardening'];
      } else {
        toolTypes = ['security_monitor', 'network_monitor', 'system_audit', 'traffic_analyzer', 'log_monitor'];
        toolNames = ['Security Monitor', 'Network Monitor', 'System Audit', 'Traffic Analyzer', 'Log Monitor'];
      }
      
      const toolIndex = Math.floor(Math.random() * toolNames.length);
      const isSuccess = Math.random() > 0.4; // 60% success rate
      const threatLevels = ['low', 'medium', 'high', 'critical'];
      const threatLevel = threatLevels[Math.floor(Math.random() * threatLevels.length)];
      
      let mockEvent: SimulationEvent = {
        type: randomType,
        data: {
          tool: toolTypes[toolIndex],
          tool_name: toolNames[toolIndex],
          success: isSuccess,
          threat_level: threatLevel
        },
        timestamp: new Date().toISOString()
      };
      
      // Add more specific details based on event type
      if (randomType === 'attack_event' && isSuccess) {
        const vulnerabilityTypes = ['Remote Code Execution', 'SQL Injection', 'Cross-Site Scripting', 'Authentication Bypass', 'Privilege Escalation'];
        const vulnType = vulnerabilityTypes[Math.floor(Math.random() * vulnerabilityTypes.length)];
        
        mockEvent.data.vulnerability = {
          id: `vuln-${Date.now().toString(36)}`,
          type: toolTypes[toolIndex],
          severity: threatLevel,
          description: `Discovered ${vulnType} vulnerability in target system`
        };
      } else if (randomType === 'defense_event' && isSuccess) {
        // Find a vulnerability to patch if any exist
        if (vulnerabilities.length > 0) {
          const vulnToPatch = vulnerabilities.find(v => !v.patched);
          if (vulnToPatch) {
            mockEvent.data.patch = {
              id: `patch-${Date.now().toString(36)}`,
              vulnerability_id: vulnToPatch.id,
              type: toolTypes[toolIndex],
              description: `Successfully patched vulnerability using ${toolNames[toolIndex]}`
            };
          } else {
            mockEvent.data.patch = {
              id: `patch-${Date.now().toString(36)}`,
              vulnerability_id: `vuln-${Math.floor(Math.random() * 1000)}`,
              type: toolTypes[toolIndex],
              description: `Successfully patched vulnerability using ${toolNames[toolIndex]}`
            };
          }
        } else {
          mockEvent.data.patch = {
            id: `patch-${Date.now().toString(36)}`,
            vulnerability_id: `vuln-${Math.floor(Math.random() * 1000)}`,
            type: toolTypes[toolIndex],
            description: `Successfully patched vulnerability using ${toolNames[toolIndex]}`
          };
        }
      } else if (randomType === 'monitoring_event') {
        mockEvent.data.indicators = {
          suspicious_connections: Math.floor(Math.random() * 10),
          failed_login_attempts: Math.floor(Math.random() * 5),
          resource_usage_spikes: Math.floor(Math.random() * 3),
          file_system_changes: Math.floor(Math.random() * 2),
          unusual_process_activity: Math.floor(Math.random() * 4)
        };
      }
      
      handleSimulationEvent(mockEvent);
    };
    
    const intervalId = setInterval(generateMockEvents, 2000);
    generateMockEvents();
    
    return () => {
      console.log('Stopping local event simulation');
      clearInterval(intervalId);
    };
  }, [isSimulationRunning, useLocalSimulation, vulnerabilities, handleSimulationEvent]);

  const toggleSimulation = () => {
    if (socket && socket.connected) {
      if (isSimulationRunning) {
        console.log('Sending stop_simulation event');
        socket.emit('stop_simulation');
      } else {
        console.log('Sending start_simulation event');
        socket.emit('start_simulation');
      }
    }
    
    // Toggle simulation state regardless of socket connection (for demo)
    setIsSimulationRunning(!isSimulationRunning);
    
    // Add immediate feedback
    const message = !isSimulationRunning 
      ? `[${new Date().toLocaleTimeString()}] Simulation started` 
      : `[${new Date().toLocaleTimeString()}] Simulation stopped`;
      
    // Update terminal output with max length limit
    setRedTerminalOutput(prev => [
      ...prev.slice(-MAX_TERMINAL_LINES + 1),
      message
    ]);
    setBlueTerminalOutput(prev => [
      ...prev.slice(-MAX_TERMINAL_LINES + 1),
      message
    ]);
  };

  const clearTerminals = () => {
    setRedTerminalOutput([]);
    setBlueTerminalOutput([]);
  };

  const connectionLabel = useLocalSimulation 
    ? 'connected (local)' 
    : connectionStatus;

  // Auto-scroll vulnerability list when new entries are added
  useEffect(() => {
    if (vulnListRef.current) {
      vulnListRef.current.scrollTop = vulnListRef.current.scrollHeight;
    }
  }, [vulnerabilities]);
  
  // Auto-scroll patch list when new entries are added
  useEffect(() => {
    if (patchListRef.current) {
      patchListRef.current.scrollTop = patchListRef.current.scrollHeight;
    }
  }, [patches]);

  // Add handler for entity selection
  const handleEntitySelect = (entity: 'attacker' | 'target') => {
    setSelectedEntity(entity === selectedEntity ? null : entity);
  };

  // Add handler for attack details
  const toggleAttackDetails = () => {
    setShowAttackDetails(!showAttackDetails);
  };

  return (
    <div className={`ctf-dashboard theme-${theme}`} role="main" aria-label="CTF Dashboard">
      <div className="dashboard-main">
        <div className="control-panel" role="toolbar" aria-label="Simulation Controls">
          <div className="status-indicator" role="status">
            <span className="sr-only">Socket connection status:</span>
            Socket: <span className={`status ${connectionLabel.includes('connected') ? 'connected' : 'disconnected'}`}>
              {connectionLabel}
            </span>
          </div>
          <button 
            onClick={toggleSimulation}
            className={isSimulationRunning ? 'stop' : 'start'}
            aria-label={isSimulationRunning ? 'Stop Simulation' : 'Start Simulation'}
          >
            {isSimulationRunning ? 'Stop Simulation' : 'Start Simulation'}
          </button>
          <button 
            onClick={clearTerminals} 
            className="clear"
            aria-label="Clear Terminal Output"
          >
            Clear Terminals
          </button>
        </div>
        
        <div className="tab-navigation" role="tablist">
          <button 
            className={`tab-button ${activeTab === 'terminals' ? 'active' : ''}`}
            onClick={() => setActiveTab('terminals')}
            role="tab"
            aria-selected={activeTab === 'terminals'}
            aria-controls="terminals-panel"
          >
            Terminals
          </button>
          <button 
            className={`tab-button ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
            role="tab"
            aria-selected={activeTab === 'system'}
            aria-controls="system-panel"
          >
            System Visualization
          </button>
        </div>
        
        <div 
          className={`tab-content ${activeTab === 'terminals' ? 'active' : ''}`}
          id="terminals-panel"
          role="tabpanel"
          aria-labelledby="terminals-tab"
        >
          <div className="terminals">
            <Terminal
              title="Red Team Terminal"
              output={redTerminalOutput}
              team="red"
              onControlTeam={() => onControlTeam('red')}
            />
            <div className="score-section">
              <div className="score-box red-team">
                <span className="score-label">Red Team</span>
                <span className="score-value">{redScore}</span>
                <span className="score-subtitle">Attackers</span>
              </div>
              <span className="vs-label">VS</span>
              <div className="score-box blue-team">
                <span className="score-label">Blue Team</span>
                <span className="score-value">{blueScore}</span>
                <span className="score-subtitle">Defenders</span>
              </div>
            </div>
            <Terminal
              title="Blue Team Terminal"
              output={blueTerminalOutput}
              team="blue"
              onControlTeam={() => onControlTeam('blue')}
            />
          </div>
        </div>
        
        <div 
          className={`tab-content ${activeTab === 'system' ? 'active' : ''}`}
          id="system-panel"
          role="tabpanel"
          aria-labelledby="system-tab"
        >
          <div className="system-visualization">
            <div className="system-state">
              <div className="state-panel">
                <h3>System Statistics</h3>
                <div className="stats-grid">
                  <div className="stat-box attack-stats" data-tooltip="Attack performance metrics">
                    <h4>Attack Metrics</h4>
                    <div className="stat-item" data-tooltip="Total number of attack attempts">
                      <span>Total Attempts:</span>
                      <span>{attackStats.totalAttempts}</span>
                    </div>
                    <div className="stat-item" data-tooltip="Number of successful attacks">
                      <span>Successful:</span>
                      <span>{attackStats.successfulAttempts}</span>
                    </div>
                    <div className="stat-item" data-tooltip="Percentage of successful attacks">
                      <span>Success Rate:</span>
                      <span>{attackStats.successRate}%</span>
                    </div>
                    <div className="stat-item" data-tooltip="Average severity level of attacks">
                      <span>Avg Severity:</span>
                      <span className={`severity-${attackStats.avgSeverity}`}>
                        {attackStats.avgSeverity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="stat-box defense-stats" data-tooltip="Defense performance metrics">
                    <h4>Defense Metrics</h4>
                    <div className="stat-item" data-tooltip="Total number of patches applied">
                      <span>Total Patches:</span>
                      <span>{defenseStats.totalPatches}</span>
                    </div>
                    <div className="stat-item" data-tooltip="Number of successful patches">
                      <span>Successful:</span>
                      <span>{defenseStats.successfulPatches}</span>
                    </div>
                    <div className="stat-item" data-tooltip="Average time to respond to attacks">
                      <span>Avg Response:</span>
                      <span>{(defenseStats.responseTime / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="stat-item" data-tooltip="Percentage of attacks prevented">
                      <span>Prevention Rate:</span>
                      <span>{defenseStats.preventionRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="state-panel">
                <h3>Active Vulnerabilities</h3>
                <div 
                  className="vulnerability-list" 
                  ref={vulnListRef}
                  role="log"
                  aria-label="Active vulnerabilities list"
                >
                  {vulnerabilities.length === 0 ? (
                    <div className="empty-state">No vulnerabilities detected</div>
                  ) : (
                    vulnerabilities.map((vuln) => (
                      <div 
                        key={vuln.id} 
                        className={`vulnerability-item ${vuln.patched ? 'patched' : 'active'}`}
                        role="article"
                        aria-label={`${vuln.severity} severity ${vuln.type} vulnerability`}
                      >
                        <span className={`vuln-severity ${vuln.severity}`}>{vuln.severity}</span>
                        <strong>{vuln.type}</strong>
                        <div>{vuln.description}</div>
                        {vuln.patched && (
                          <span className="patch-status" role="status">
                            <span className="sr-only">Vulnerability status:</span>
                            ✓ Patched
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="state-panel">
                <h3>Applied Patches</h3>
                <div className="patch-list" ref={patchListRef}>
                  {patches.length === 0 ? (
                    <div className="empty-state">No patches applied</div>
                  ) : (
                    patches.map((patch) => (
                      <div key={patch.id} className="patch-item">
                        <span className="patch-badge">Patch</span>
                        <strong>{patch.type}</strong>
                        <div>Vulnerability: {patch.vulnerability_id}</div>
                        <div>{patch.description}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            <div className="system-diagram">
              <h3>Network Visualization</h3>
              <div className="attack-flow">
                <div 
                  className={`network-entity entity-hacker ${selectedEntity === 'attacker' ? 'selected' : ''}`}
                  onClick={() => handleEntitySelect('attacker')}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedEntity === 'attacker'}
                  onKeyPress={(e) => e.key === 'Enter' && handleEntitySelect('attacker')}
                  data-tooltip="Click for attacker details"
                >
                  <svg viewBox="0 0 24 24" width="40" height="40" fill="white">
                    <path d="M12 1.25a.75.75 0 0 1 .673.418l3.058 6.197 6.839.994a.75.75 0 0 1 .415 1.279l-4.948 4.823 1.168 6.811a.75.75 0 0 1-1.088.791L12 18.347l-6.117 3.216a.75.75 0 0 1-1.088-.79l1.168-6.812-4.948-4.823a.75.75 0 0 1 .416-1.28l6.838-.993L11.327 1.67A.75.75 0 0 1 12 1.25Z" />
                  </svg>
                  <div className="entity-name">Red Team Attacker</div>
                  <div className="entity-stats">
                    <div className="entity-stat">
                      <span>Success: </span>
                      <span>{attackStats.successRate}%</span>
                    </div>
                    <div className="entity-stat">
                      <span>Severity: </span>
                      <span className={`severity-${attackStats.avgSeverity}`}>
                        {attackStats.avgSeverity}
                      </span>
                    </div>
                  </div>
                  {selectedEntity === 'attacker' && (
                    <div className="entity-details" role="region" aria-label="Attacker details">
                      <h4>Attack History</h4>
                      <div className="history-list">
                        {redAttackHistory.slice(-5).map((attack, index) => (
                          <div key={index} className="history-item">
                            <span className={`status-dot ${attack.success ? 'success' : 'failure'}`} />
                            <span>{attack.tool}</span>
                            <span className={`severity-${attack.threat_level}`}>
                              {attack.threat_level}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div 
                  className="network-connection"
                  onClick={toggleAttackDetails}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && toggleAttackDetails()}
                  data-tooltip="Click to view attack details"
                >
                  <div className="connection-line">
                    <div className="attack-packet"></div>
                    <div className="defense-packet"></div>
                  </div>
                  {showAttackDetails && (
                    <div className="attack-details" role="region" aria-label="Current attack details">
                      {lastAttack && (
                        <div className="attack-label">
                          {lastAttack}
                        </div>
                      )}
                      {lastDefense && (
                        <div className="defense-label">
                          {lastDefense}
                        </div>
                      )}
                      <div className="connection-stats">
                        <div className="stat-badge attack">
                          {attackStats.totalAttempts} attacks
                        </div>
                        <div className="stat-badge defense">
                          {defenseStats.totalPatches} defenses
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div 
                  className={`network-entity entity-target ${selectedEntity === 'target' ? 'selected' : ''}`}
                  onClick={() => handleEntitySelect('target')}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedEntity === 'target'}
                  onKeyPress={(e) => e.key === 'Enter' && handleEntitySelect('target')}
                  data-tooltip="Click for target system details"
                >
                  <svg viewBox="0 0 24 24" width="40" height="40" fill="white">
                    <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2Zm0 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm-4.5 8a1.5 1.5 0 0 1 1.5-1.5h6a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5v-4Zm1.5 0v4h6v-4h-6Z" />
                  </svg>
                  <div className="entity-name">Target System</div>
                  <div className="entity-stats">
                    <div className="entity-stat">
                      <span>Prevention: </span>
                      <span>{defenseStats.preventionRate}%</span>
                    </div>
                    <div className="entity-stat">
                      <span>Response: </span>
                      <span>{(defenseStats.responseTime / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                  {selectedEntity === 'target' && (
                    <div className="entity-details" role="region" aria-label="Target system details">
                      <h4>System Status</h4>
                      <div className="status-list">
                        <div className="status-item">
                          <span>Active Vulnerabilities:</span>
                          <span>{vulnerabilities.filter(v => !v.patched).length}</span>
                        </div>
                        <div className="status-item">
                          <span>Applied Patches:</span>
                          <span>{patches.length}</span>
                        </div>
                        <div className="status-item">
                          <span>Current Threat Level:</span>
                          <span className={`severity-${attackStats.avgSeverity}`}>
                            {attackStats.avgSeverity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {geminiAnalysis && (
        <div className={`gemini-analysis ${isGeminiCollapsed ? 'collapsed' : ''}`}>
          <button 
            className="gemini-toggle"
            onClick={() => setIsGeminiCollapsed(!isGeminiCollapsed)}
            title={isGeminiCollapsed ? "Show Analysis" : "Hide Analysis"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={isGeminiCollapsed 
                ? "M9 5l7 7-7 7" 
                : "M15 19l-7-7 7-7"}
              />
            </svg>
          </button>
          <div className="gemini-content">
            <h3>Gemini AI Strategic Analysis</h3>
            <div className="analysis-content">
              <div className="analysis-metrics">
                <div className="metric">
                  <span>Attack Pattern:</span>
                  <span>{analysisMetrics.attackPattern}</span>
                </div>
                <div className="metric">
                  <span>Defense Pattern:</span>
                  <span>{analysisMetrics.defensePattern}</span>
                </div>
                <div className="metric">
                  <span>AI Confidence:</span>
                  <div className="confidence-bar">
                    <div 
                      className="confidence-level" 
                      style={{ width: `${analysisMetrics.confidence}%` }}
                    />
                    <span>{analysisMetrics.confidence}%</span>
                  </div>
                </div>
              </div>
              <div className="analysis-recommendations">
                <div className="recommendation red-team">
                  <h4>Red Team Strategy</h4>
                  <p>{analysisMetrics.redTeamRecommendation}</p>
                </div>
                <div className="recommendation blue-team">
                  <h4>Blue Team Strategy</h4>
                  <p>{analysisMetrics.blueTeamRecommendation}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CTFDashboard; 