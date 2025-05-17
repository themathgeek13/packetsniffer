import React, { useEffect, useRef, useState } from 'react';
import './SimpleTerminal.css';

interface SimpleTerminalProps {
    onCommand: (command: string) => void;
    output: string[];
}

const SimpleTerminal: React.FC<SimpleTerminalProps> = ({ onCommand, output }) => {
    const [inputValue, setInputValue] = useState<string>('');
    const terminalOutputRef = useRef<HTMLDivElement>(null);
    
    // Auto-scroll to bottom when output changes
    useEffect(() => {
        if (terminalOutputRef.current) {
            terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight;
        }
    }, [output]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onCommand(inputValue);
            setInputValue('');
        }
    };
    
    const formatOutput = (line: string) => {
        // Parse and format terminal output with colors
        if (line.includes('🔴 Red Team')) {
            return <div className="terminal-line red-team">{line}</div>;
        } else if (line.includes('🔵 Blue Team')) {
            return <div className="terminal-line blue-team">{line}</div>;
        } else if (line.includes('🔍 System')) {
            return <div className="terminal-line system">{line}</div>;
        } else if (line.startsWith('$')) {
            return <div className="terminal-line command">{line}</div>;
        } else {
            return <div className="terminal-line">{line}</div>;
        }
    };
    
    return (
        <div className="simple-terminal">
            <div className="terminal-header">
                <div className="terminal-button terminal-close"></div>
                <div className="terminal-button terminal-minimize"></div>
                <div className="terminal-button terminal-maximize"></div>
                <div className="terminal-title">$ CTF Terminal</div>
            </div>
            
            <div className="terminal-body">
                <div className="terminal-output" ref={terminalOutputRef}>
                    {output.map((line, index) => (
                        <React.Fragment key={index}>
                            {formatOutput(line)}
                        </React.Fragment>
                    ))}
                </div>
                
                <form className="terminal-input-container" onSubmit={handleSubmit}>
                    <span className="prompt">$</span>
                    <input
                        type="text"
                        className="terminal-input"
                        value={inputValue}
                        onChange={handleInputChange}
                        autoFocus
                        spellCheck="false"
                        autoComplete="off"
                    />
                </form>
            </div>
        </div>
    );
};

export default SimpleTerminal; 