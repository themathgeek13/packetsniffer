import React, { useRef, useEffect } from 'react';
import './Terminal.css';

export interface TerminalProps {
    title: string;
    output: string[];
    team: 'red' | 'blue';
    onControlTeam: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ title, output, team, onControlTeam }) => {
    const terminalRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when output changes
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [output]);

    // Add team-specific icons
    const getTeamIcon = () => {
        if (team === 'red') {
            return (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#f85149">
                    <path d="M12 1.25a.75.75 0 0 1 .673.418l3.058 6.197 6.839.994a.75.75 0 0 1 .415 1.279l-4.948 4.823 1.168 6.811a.75.75 0 0 1-1.088.791L12 18.347l-6.117 3.216a.75.75 0 0 1-1.088-.79l1.168-6.812-4.948-4.823a.75.75 0 0 1 .416-1.28l6.838-.993L11.327 1.67A.75.75 0 0 1 12 1.25Z" />
                </svg>
            );
        } else {
            return (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="#7ee787">
                    <path d="M15.5 9.75a.75.75 0 0 0 0-1.5H12a.75.75 0 0 0 0 1.5h3.5Z" />
                    <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2Zm0 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z" />
                    <path d="M10.75 16.5a.75.75 0 0 1-.75-.75v-6a.75.75 0 0 1 1.5 0v6a.75.75 0 0 1-.75.75Z" />
                    <path d="M14.25 16.5a.75.75 0 0 1-.75-.75v-6a.75.75 0 0 1 1.5 0v6a.75.75 0 0 1-.75.75Z" />
                </svg>
            );
        }
    };

    // Format terminal lines with multi-line support and proper styling
    const renderTerminalLine = (line: string, index: number) => {
        if (line.includes('\n')) {
            const lines = line.split('\n');
            const firstLine = lines[0];
            const restLines = lines.slice(1);
            
            return (
                <div key={index} className="terminal-line">
                    <div className="main-line">{firstLine}</div>
                    {restLines.map((subline, subIndex) => (
                        <div key={`${index}-${subIndex}`} className="sub-line">
                            {subline}
                        </div>
                    ))}
                </div>
            );
        }
        
        return (
            <div key={index} className="terminal-line">
                {line}
            </div>
        );
    };

    return (
        <div className={`terminal ${team}`}>
            <div className="terminal-header">
                <span className="terminal-icon">{getTeamIcon()}</span>
                <h2>{title}</h2>
                <div className="terminal-controls">
                    <span className="terminal-dot"></span>
                    <span className="terminal-dot"></span>
                    <span className="terminal-dot"></span>
                </div>
            </div>
            <div className="terminal-output" ref={terminalRef}>
                {output.length === 0 ? (
                    <div className="terminal-empty">
                        P@ck3tSn1ff3r terminal ready. Waiting for {team === 'red' ? 'attack' : 'defense'} operations...
                    </div>
                ) : (
                    output.map(renderTerminalLine)
                )}
            </div>
        </div>
    );
};

export default Terminal; 