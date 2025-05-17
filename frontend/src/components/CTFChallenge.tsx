import React, { useState } from 'react';

interface Challenge {
    id: string;
    title: string;
    category: 'web' | 'crypto' | 'forensics' | 'binary' | 'misc';
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
    description: string;
    hint?: string;
    solved: boolean;
    target?: string; // IP or hostname of the target
    port?: number;   // Port of the service
}

interface CTFChallengeProps {
    onRunCommand: (command: string) => void;
    onSubmitFlag: (challengeId: string, flag: string) => Promise<boolean>;
}

const CTFChallenge: React.FC<CTFChallengeProps> = ({ onRunCommand, onSubmitFlag }) => {
    // Sample challenges - in a real app these would come from an API
    const [challenges, setChallenges] = useState<Challenge[]>([
        {
            id: 'web-01',
            title: 'SQL Injection 101',
            category: 'web',
            difficulty: 'easy',
            points: 100,
            description: 'A vulnerable login page is running on the target. Find a way to bypass authentication using SQL injection.',
            hint: 'Have you tried using a single quote in the username field?',
            target: '10.0.0.5',
            port: 8080,
            solved: false
        },
        {
            id: 'web-02',
            title: 'Cookie Monster',
            category: 'web',
            difficulty: 'medium',
            points: 200,
            description: 'The target website uses cookies to store sensitive information. Manipulate them to gain admin access.',
            target: '10.0.0.5',
            port: 8081,
            solved: false
        },
        {
            id: 'crypto-01',
            title: 'Basic Encryption',
            category: 'crypto',
            difficulty: 'easy',
            points: 100,
            description: 'We intercepted an encrypted message. Decrypt it to find the flag.',
            hint: 'The encryption might be simpler than you think. Try common ciphers.',
            solved: false
        },
        {
            id: 'forensics-01',
            title: 'Hidden Secrets',
            category: 'forensics',
            difficulty: 'medium',
            points: 150,
            description: 'A file on the target system contains hidden information. Find it and extract the flag.',
            target: '10.0.0.6',
            solved: false
        },
        {
            id: 'binary-01',
            title: 'Buffer Overflow',
            category: 'binary',
            difficulty: 'hard',
            points: 300,
            description: 'A vulnerable service is running on the target. Exploit a buffer overflow to get a shell.',
            target: '10.0.0.7',
            port: 9999,
            solved: false
        }
    ]);

    const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
    const [flagInput, setFlagInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState<{success: boolean, message: string} | null>(null);
    const [showHint, setShowHint] = useState(false);

    const handleChallengeSelect = (challenge: Challenge) => {
        setActiveChallenge(challenge);
        setFlagInput('');
        setSubmissionResult(null);
        setShowHint(false);
    };

    const handleRunCommand = (command: string) => {
        if (activeChallenge?.target) {
            // Prefix the command with the target info to simulate targeting
            onRunCommand(`[TARGET=${activeChallenge.target}${activeChallenge.port ? `:${activeChallenge.port}` : ''}] ${command}`);
        } else {
            onRunCommand(command);
        }
    };

    const handleFlagSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeChallenge || !flagInput.trim()) return;

        setIsSubmitting(true);
        setSubmissionResult(null);

        try {
            const success = await onSubmitFlag(activeChallenge.id, flagInput);
            
            if (success) {
                setChallenges(challenges.map(c => 
                    c.id === activeChallenge.id ? {...c, solved: true} : c
                ));
                setSubmissionResult({
                    success: true,
                    message: `Congratulations! Correct flag for "${activeChallenge.title}". You earned ${activeChallenge.points} points!`
                });
            } else {
                setSubmissionResult({
                    success: false,
                    message: 'Incorrect flag. Try again!'
                });
            }
        } catch (error) {
            setSubmissionResult({
                success: false,
                message: 'Error submitting flag. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Group challenges by category
    const categories = challenges.reduce((acc, challenge) => {
        if (!acc[challenge.category]) {
            acc[challenge.category] = [];
        }
        acc[challenge.category].push(challenge);
        return acc;
    }, {} as Record<string, Challenge[]>);

    // Calculate total points and solved challenges
    const totalPoints = challenges.reduce((sum, c) => sum + (c.solved ? c.points : 0), 0);
    const solvedCount = challenges.filter(c => c.solved).length;

    return (
        <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">Capture The Flag Challenges</h2>
                <div className="flex items-center justify-between mt-2">
                    <p className="text-gray-400 text-sm">Complete challenges to earn points and capture flags</p>
                    <div className="flex items-center bg-gray-900 rounded-full px-3 py-1">
                        <span className="text-yellow-400 font-medium mr-2">{totalPoints} pts</span>
                        <span className="text-gray-400 text-sm">{solvedCount}/{challenges.length} solved</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Challenge List Sidebar */}
                <div className="w-1/3 bg-gray-900 overflow-y-auto p-2">
                    {Object.entries(categories).map(([category, categoryChalls]) => (
                        <div key={category} className="mb-4">
                            <h3 className="text-gray-400 uppercase text-xs font-semibold tracking-wider mb-2 px-2">{category}</h3>
                            <div className="space-y-1">
                                {categoryChalls.map(challenge => (
                                    <button
                                        key={challenge.id}
                                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                                            challenge.solved 
                                                ? 'bg-green-900 bg-opacity-20 text-green-400' 
                                                : activeChallenge?.id === challenge.id
                                                    ? 'bg-blue-900 bg-opacity-20 text-blue-400'
                                                    : 'text-gray-300 hover:bg-gray-800'
                                        }`}
                                        onClick={() => handleChallengeSelect(challenge)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium truncate">{challenge.title}</span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                challenge.difficulty === 'easy' ? 'bg-green-900 bg-opacity-30 text-green-400' :
                                                challenge.difficulty === 'medium' ? 'bg-yellow-900 bg-opacity-30 text-yellow-400' :
                                                'bg-red-900 bg-opacity-30 text-red-400'
                                            }`}>
                                                {challenge.points}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Challenge Details */}
                <div className="w-2/3 p-4 overflow-y-auto">
                    {activeChallenge ? (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-white">{activeChallenge.title}</h2>
                                <div className={`px-2 py-1 rounded text-xs font-bold ${
                                    activeChallenge.difficulty === 'easy' ? 'bg-green-900 bg-opacity-30 text-green-400' :
                                    activeChallenge.difficulty === 'medium' ? 'bg-yellow-900 bg-opacity-30 text-yellow-400' :
                                    'bg-red-900 bg-opacity-30 text-red-400'
                                }`}>
                                    {activeChallenge.difficulty.toUpperCase()} • {activeChallenge.points} PTS
                                </div>
                            </div>

                            {/* Target Information */}
                            {(activeChallenge.target || activeChallenge.port) && (
                                <div className="bg-gray-900 rounded-lg p-3 mb-4 text-sm">
                                    <h3 className="text-gray-400 font-semibold mb-1">Target Information</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {activeChallenge.target && (
                                            <div>
                                                <span className="text-gray-500">Host: </span>
                                                <span className="text-blue-400 font-mono">{activeChallenge.target}</span>
                                            </div>
                                        )}
                                        {activeChallenge.port && (
                                            <div>
                                                <span className="text-gray-500">Port: </span>
                                                <span className="text-blue-400 font-mono">{activeChallenge.port}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Challenge Description */}
                            <div className="bg-gray-900 rounded-lg p-4 mb-4">
                                <p className="text-gray-300 mb-4">{activeChallenge.description}</p>
                                
                                {activeChallenge.hint && (
                                    <div className="mt-4">
                                        {showHint ? (
                                            <div className="bg-yellow-900 bg-opacity-20 border border-yellow-800 rounded-lg p-3">
                                                <h4 className="text-yellow-500 text-sm font-semibold mb-1">Hint</h4>
                                                <p className="text-gray-300 text-sm">{activeChallenge.hint}</p>
                                            </div>
                                        ) : (
                                            <button 
                                                className="text-yellow-500 text-sm hover:text-yellow-400"
                                                onClick={() => setShowHint(true)}
                                            >
                                                Need a hint?
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Command Suggestions */}
                            <div className="mb-4">
                                <h3 className="text-gray-400 text-sm font-semibold mb-2">Suggested Commands</h3>
                                <div className="flex flex-wrap gap-2">
                                    {activeChallenge.category === 'web' && (
                                        <>
                                            <button 
                                                className="bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded"
                                                onClick={() => handleRunCommand(`curl http://${activeChallenge.target}:${activeChallenge.port}`)}
                                            >
                                                curl
                                            </button>
                                            <button 
                                                className="bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded"
                                                onClick={() => handleRunCommand(`nmap -p ${activeChallenge.port} ${activeChallenge.target}`)}
                                            >
                                                nmap
                                            </button>
                                            <button 
                                                className="bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded"
                                                onClick={() => handleRunCommand(`sqlmap -u http://${activeChallenge.target}:${activeChallenge.port}/login.php`)}
                                            >
                                                sqlmap
                                            </button>
                                        </>
                                    )}
                                    {activeChallenge.category === 'binary' && (
                                        <>
                                            <button 
                                                className="bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded"
                                                onClick={() => handleRunCommand(`nc ${activeChallenge.target} ${activeChallenge.port}`)}
                                            >
                                                netcat
                                            </button>
                                            <button 
                                                className="bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded"
                                                onClick={() => handleRunCommand(`python -c 'print("A"*100)'`)}
                                            >
                                                buffer overflow
                                            </button>
                                        </>
                                    )}
                                    {activeChallenge.category === 'forensics' && (
                                        <>
                                            <button 
                                                className="bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded"
                                                onClick={() => handleRunCommand(`find / -type f -name "*.txt" | xargs grep -l "flag"`)}
                                            >
                                                find files
                                            </button>
                                            <button 
                                                className="bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded"
                                                onClick={() => handleRunCommand(`strings suspicious_file.jpg`)}
                                            >
                                                strings
                                            </button>
                                        </>
                                    )}
                                    {activeChallenge.category === 'crypto' && (
                                        <>
                                            <button 
                                                className="bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded"
                                                onClick={() => handleRunCommand(`echo "encrypted_text" | base64 -d`)}
                                            >
                                                base64 decode
                                            </button>
                                            <button 
                                                className="bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded"
                                                onClick={() => handleRunCommand(`openssl enc -d -aes-256-cbc -in encrypted.bin -out decrypted.txt`)}
                                            >
                                                openssl decrypt
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Flag Submission */}
                            <div className="bg-gray-900 rounded-lg p-4">
                                <h3 className="text-gray-400 text-sm font-semibold mb-2">
                                    {activeChallenge.solved ? 'Challenge Solved!' : 'Submit Flag'}
                                </h3>
                                
                                {activeChallenge.solved ? (
                                    <div className="bg-green-900 bg-opacity-20 border border-green-800 rounded-lg p-3">
                                        <p className="text-green-400 text-sm">
                                            You've successfully captured this flag! +{activeChallenge.points} points
                                        </p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleFlagSubmit} className="space-y-3">
                                        <div className="flex">
                                            <input
                                                type="text"
                                                placeholder="Enter flag (e.g., flag{s0m3_fl4g_h3r3})"
                                                value={flagInput}
                                                onChange={e => setFlagInput(e.target.value)}
                                                className="flex-1 bg-gray-800 border border-gray-700 text-gray-300 px-3 py-2 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                disabled={isSubmitting || !flagInput.trim()}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSubmitting ? 'Submitting...' : 'Submit'}
                                            </button>
                                        </div>
                                        
                                        {submissionResult && (
                                            <div className={`p-3 rounded-lg ${
                                                submissionResult.success 
                                                    ? 'bg-green-900 bg-opacity-20 border border-green-800 text-green-400' 
                                                    : 'bg-red-900 bg-opacity-20 border border-red-800 text-red-400'
                                            }`}>
                                                {submissionResult.message}
                                            </div>
                                        )}
                                    </form>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <h3 className="text-xl font-medium mb-2">No challenge selected</h3>
                            <p className="max-w-md">Select a challenge from the sidebar to view details and start hacking!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CTFChallenge; 