import { useState, useEffect } from 'react';

interface McpClient {
  getResource: (name: string) => Promise<any>;
  callTool: (name: string, args: any) => Promise<any>;
}

export function useMcp(serverName: string) {
  const [mcpClient, setMcpClient] = useState<McpClient | null>(null);

  useEffect(() => {
    // Initialize MCP client
    const client: McpClient = {
      getResource: async (name: string) => {
        try {
          const response = await fetch(`http://localhost:5000/mcp/${serverName}/resources/${name}`);
          if (!response.ok) throw new Error('Failed to fetch resource');
          return await response.json();
        } catch (error) {
          console.error('MCP resource error:', error);
          throw error;
        }
      },
      
      callTool: async (name: string, args: any) => {
        try {
          const response = await fetch(`http://localhost:5000/mcp/${serverName}/tools/${name}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(args),
          });
          if (!response.ok) throw new Error('Failed to call tool');
          return await response.json();
        } catch (error) {
          console.error('MCP tool error:', error);
          throw error;
        }
      }
    };
    
    setMcpClient(client);
  }, [serverName]);

  return { mcpClient };
} 