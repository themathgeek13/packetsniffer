import React from 'react';
import './ScoreBoard.css';

export interface ScoreBoardProps {
  redScore: number;
  blueScore: number;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ redScore, blueScore }) => {
  return (
    <div className="scoreboard">
      <h2 className="scoreboard-title">Score</h2>
      
      <div className="versus-container">
        <div className="score red">
          <div className="team-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#ff6b6b">
              <path d="M12 1.25a.75.75 0 0 1 .673.418l3.058 6.197 6.839.994a.75.75 0 0 1 .415 1.279l-4.948 4.823 1.168 6.811a.75.75 0 0 1-1.088.791L12 18.347l-6.117 3.216a.75.75 0 0 1-1.088-.79l1.168-6.812-4.948-4.823a.75.75 0 0 1 .416-1.28l6.838-.993L11.327 1.67A.75.75 0 0 1 12 1.25Z" />
            </svg>
          </div>
          <h3>Red Team</h3>
          <div className="points">{redScore}</div>
          <div className="team-label">Attackers</div>
        </div>
        
        <div className="versus">VS</div>
        
        <div className="score blue">
          <div className="team-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#58a6ff">
              <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2Zm0 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm-4.5 8a1.5 1.5 0 0 1 1.5-1.5h6a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5v-4Zm1.5 0v4h6v-4h-6Z" />
            </svg>
          </div>
          <h3>Blue Team</h3>
          <div className="points">{blueScore}</div>
          <div className="team-label">Defenders</div>
        </div>
      </div>
      
      <div className="score-meter">
        <div 
          className="score-indicator" 
          style={{ 
            left: `${Math.min(Math.max((redScore / (redScore + blueScore)) * 100, 5), 95)}%` 
          }}
        />
      </div>
    </div>
  );
};

export default ScoreBoard; 