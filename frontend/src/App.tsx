import React, { useEffect, useState } from 'react';
import { ThemeContext, ThemeType } from './contexts/ThemeContext';
import CTFDashboard from './components/CTFDashboard';
import './App.css';

const App: React.FC = () => {
    const [theme, setTheme] = useState<ThemeType>('dark');
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');

    // Initialize theme from localStorage if available
    useEffect(() => {
        const savedTheme = localStorage.getItem('ctf-theme') as ThemeType;
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, []);

    // Update body class and localStorage when theme changes
    useEffect(() => {
        document.body.className = `theme-${theme}`;
        localStorage.setItem('ctf-theme', theme);
    }, [theme]);

    // Toggle theme function
    const toggleTheme = () => {
        setTheme((prevTheme: ThemeType) => prevTheme === 'dark' ? 'light' : 'dark');
    };

    // Handle team control
    const handleControlTeam = (team: 'red' | 'blue') => {
        console.log(`${team} team control toggled`);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <div className={`app theme-${theme}`}>
                <header className="app-header">
                    <div className="header-content">
                        <div className="logo">
                            <span className="logo-icon">🕵️</span>
                            <h1>P@ck3tSn1ff3r</h1>
                            <div className={`connection-status ${connectionStatus}`}>
                                <span className="status-dot"></span>
                                <span className="status-text">{connectionStatus}</span>
                            </div>
                        </div>
                        <button onClick={toggleTheme} className="theme-toggle">
                            {theme === 'dark' ? '🌞' : '🌙'}
                        </button>
                    </div>
                </header>

                <main className="app-main">
                    <CTFDashboard onControlTeam={handleControlTeam} />
                </main>
            </div>
        </ThemeContext.Provider>
    );
};

export default App;
