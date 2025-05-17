import React from 'react';

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

interface BattleMapProps {
    vulnerabilities: Vulnerability[];
    patches: Patch[];
    activeDefenses: string[];
}

const BattleMap: React.FC<BattleMapProps> = ({
    vulnerabilities,
    patches,
    activeDefenses
}) => {
    // Group vulnerabilities by type to show what's being attacked
    const vulnerabilityTypes = vulnerabilities.reduce((acc, vuln) => {
        acc[vuln.type] = (acc[vuln.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Group patches by type to show what's being defended
    const patchTypes = patches.reduce((acc, patch) => {
        acc[patch.type] = (acc[patch.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Calculate which vulnerabilities are patched vs unpatched
    const patchedVulnerabilityIds = new Set(patches.map(patch => patch.vulnerability_id));
    const patchedCount = patchedVulnerabilityIds.size;
    const unpatchedCount = vulnerabilities.length - patchedCount;

    return (
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white mb-1">Battle Map</h2>
                <p className="text-gray-400 text-sm">Current state of attacks and defenses</p>
            </div>
            
            <div className="p-4">
                {/* System Diagram */}
                <div className="relative h-64 mb-6 bg-gray-900 rounded-lg overflow-hidden p-4">
                    {/* Central system */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-32 h-32 rounded-full bg-gray-800 border-4 border-gray-700 flex items-center justify-center relative overflow-hidden">
                            <div className="text-center">
                                <div className="text-gray-400 font-bold">TARGET</div>
                                <div className="text-xs text-gray-500">System</div>
                            </div>
                            
                            {/* Animated pulses for active attacks */}
                            {unpatchedCount > 0 && (
                                <div className="absolute inset-0 bg-red-500 bg-opacity-10 animate-ping"></div>
                            )}
                            
                            {/* Defense shield */}
                            {activeDefenses.length > 0 && (
                                <div className="absolute inset-0 border-4 border-blue-500 border-opacity-30 rounded-full"></div>
                            )}
                        </div>
                    </div>
                    
                    {/* Attack vectors - positioned around the system */}
                    {Object.entries(vulnerabilityTypes).map(([type, count], index) => {
                        const angle = (index * (360 / Object.keys(vulnerabilityTypes).length)) * (Math.PI / 180);
                        const x = 50 + 40 * Math.cos(angle);
                        const y = 50 + 40 * Math.sin(angle);
                        
                        return (
                            <div 
                                key={`attack-${type}`}
                                className="absolute flex items-center justify-center"
                                style={{ 
                                    left: `${x}%`, 
                                    top: `${y}%`, 
                                    transform: 'translate(-50%, -50%)' 
                                }}
                            >
                                <div className="w-16 h-16 bg-red-900 bg-opacity-30 rounded-lg flex flex-col items-center justify-center">
                                    <div className="w-3 h-3 bg-red-500 rounded-full mb-1 animate-pulse"></div>
                                    <span className="text-xs text-red-400 font-semibold">{type}</span>
                                    <span className="text-xs text-gray-400">{count}x</span>
                                </div>
                                <div 
                                    className="absolute bg-red-500 h-0.5 animate-pulse"
                                    style={{ 
                                        width: '50px',
                                        transformOrigin: 'left center',
                                        transform: `rotate(${(angle * (180 / Math.PI)) - 180}deg)` 
                                    }}
                                ></div>
                            </div>
                        )
                    })}
                    
                    {/* Defense systems - positioned around the system */}
                    {activeDefenses.map((defense, index) => {
                        const angle = (index * (360 / activeDefenses.length)) * (Math.PI / 180);
                        const x = 50 + 35 * Math.cos(angle);
                        const y = 50 + 35 * Math.sin(angle);
                        
                        return (
                            <div 
                                key={`defense-${defense}`}
                                className="absolute flex items-center justify-center"
                                style={{ 
                                    left: `${x}%`, 
                                    top: `${y}%`, 
                                    transform: 'translate(-50%, -50%)' 
                                }}
                            >
                                <div className="w-16 h-16 bg-blue-900 bg-opacity-30 rounded-lg flex flex-col items-center justify-center">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full mb-1"></div>
                                    <span className="text-xs text-blue-400 font-semibold">{defense}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Attack Stats */}
                    <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4">
                        <h3 className="text-red-400 text-sm font-semibold mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            ATTACK VECTORS
                        </h3>
                        <div className="space-y-2">
                            {Object.entries(vulnerabilityTypes).length > 0 ? (
                                Object.entries(vulnerabilityTypes).map(([type, count]) => (
                                    <div key={type} className="flex justify-between items-center">
                                        <span className="text-xs text-gray-300">{type}</span>
                                        <span className="text-xs font-semibold text-red-400">{count}x</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-gray-500 text-center py-2">No attacks detected yet</div>
                            )}
                        </div>
                    </div>
                    
                    {/* Defense Stats */}
                    <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4">
                        <h3 className="text-blue-400 text-sm font-semibold mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            DEFENSE SYSTEMS
                        </h3>
                        <div className="space-y-2">
                            {activeDefenses.length > 0 ? (
                                activeDefenses.map(defense => (
                                    <div key={defense} className="flex justify-between items-center">
                                        <span className="text-xs text-gray-300">{defense}</span>
                                        <span className="text-xs font-semibold text-blue-400 px-1.5 py-0.5 bg-blue-900 bg-opacity-30 rounded">Active</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-gray-500 text-center py-2">No defenses active</div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Security Status */}
                <div className="mt-4 bg-gray-900 bg-opacity-50 rounded-lg p-4">
                    <h3 className="text-gray-400 text-sm font-semibold mb-2">SYSTEM SECURITY STATUS</h3>
                    
                    <div className="flex items-center mb-2">
                        <div className="w-full bg-gray-700 rounded-full h-3">
                            <div 
                                className="bg-gradient-to-r from-red-500 to-blue-500 h-3 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, (patchedCount / Math.max(1, vulnerabilities.length)) * 100))}%` }}
                            ></div>
                        </div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-400">
                        <div>
                            <span className="text-red-400">{unpatchedCount}</span> Vulnerabilities
                        </div>
                        <div>
                            <span className="text-blue-400">{patchedCount}</span> Patched
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BattleMap; 