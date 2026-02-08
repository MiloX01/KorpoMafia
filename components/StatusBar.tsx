import React from 'react';
import { Rocket, Vault, AlertTriangle, Moon, Sun, PlayCircle } from 'lucide-react';
import { GameState, Phase } from '../types';

interface StatusBarProps {
  gameState: GameState;
  onStartReview: () => void;
  onTogglePhase: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ gameState, onStartReview, onTogglePhase }) => {
  const isNight = gameState.phase === 'NIGHT';
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getThemeColors = () => {
    if (isNight) {
      return {
        bg: 'bg-slate-900',
        border: 'border-slate-800',
        text: 'text-slate-100',
        accent: 'text-purple-500',
        progressBg: 'bg-purple-900',
        progressFill: 'bg-purple-500',
        shadow: 'shadow-glow-purple', // Custom class needed or simulated
      };
    }
    return {
      bg: 'bg-white',
      border: 'border-slate-200',
      text: 'text-slate-800',
      accent: 'text-corp-blue',
      progressBg: 'bg-slate-100',
      progressFill: 'bg-corp-blue',
      shadow: 'shadow-glow-blue',
    };
  };

  const theme = getThemeColors();

  return (
    <header className={`sticky top-0 z-50 ${theme.bg} ${theme.border} border-b-4 shadow-sm p-3 flex items-center justify-between gap-2 shrink-0 transition-colors duration-500`}>
      
      {/* Project Progress - Left */}
      <div className="flex flex-col w-1/3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Projekt</span>
          <span className={`text-xs font-black ${theme.accent}`}>{gameState.projectProgress}%</span>
        </div>
        <div className={`relative h-6 ${theme.progressBg} rounded-sm overflow-hidden border border-slate-500/20 shadow-inner-sharp group`}>
          <div 
            className={`absolute top-0 left-0 h-full ${theme.progressFill} transition-all duration-500 ease-out`}
            style={{ width: `${gameState.projectProgress}%`, boxShadow: isNight ? '0 0 10px #a855f7' : '' }}
          />
          {/* Gauge markers */}
          <div className="absolute inset-0 flex justify-between px-1">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="w-[1px] h-full bg-white/20"></div>
            ))}
          </div>
          <div className="absolute right-1 top-1/2 -translate-y-1/2 text-white/50">
             <Rocket size={14} className="text-white drop-shadow-md" />
          </div>
        </div>
      </div>

      {/* Timer / Review Control - Center */}
      <div className="flex flex-col items-center justify-center w-1/4 relative group">
        {gameState.phase === 'DAY' ? (
           <>
            <div className={`text-3xl font-black tabular-nums tracking-tighter ${theme.text} leading-none`}>
              {formatTime(gameState.timeRemaining)}
            </div>
            <button 
              onClick={onStartReview}
              className="mt-1 bg-slate-800 hover:bg-slate-700 text-white text-[9px] font-bold py-0.5 px-2 rounded-full uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95"
            >
              Start Review
            </button>
           </>
        ) : gameState.phase === 'REVIEW' ? (
           <div className="bg-emergency-red text-white px-2 py-1 rounded animate-pulse text-xs font-black uppercase tracking-widest text-center">
             GŁOSOWANIE
           </div>
        ) : (
           // Night Mode Display
           <div className="flex flex-col items-center">
             <Moon className="text-purple-400 mb-1" size={20} />
             <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">NOC</span>
           </div>
        )}
        
        {/* Hidden Phase Toggle for Dev/User testing */}
        <button 
            onClick={onTogglePhase} 
            className="absolute -top-2 -right-12 opacity-50 hover:opacity-100 p-1 bg-slate-200 dark:bg-slate-700 rounded-full"
            title="Toggle Day/Night"
        >
            {isNight ? <Sun size={12} /> : <Moon size={12} />}
        </button>
      </div>

      {/* Budget - Right */}
      <div className="flex flex-col w-1/3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Budżet</span>
          <span className="text-xs font-black text-emergency-red">{gameState.budget}%</span>
        </div>
        <div className={`relative h-6 ${theme.progressBg} rounded-sm overflow-hidden border border-slate-500/20 shadow-inner-sharp`}>
          <div 
            className="absolute top-0 left-0 h-full bg-emergency-red transition-all duration-500 ease-out"
            style={{ width: `${gameState.budget}%` }}
          />
           {/* "Melting" visual effect overlay */}
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-30 mix-blend-overlay"></div>
          
          <div className="absolute right-1 top-1/2 -translate-y-1/2">
            {gameState.budget < 30 ? (
                <AlertTriangle size={14} className="text-white animate-bounce" />
            ) : (
                <Vault size={14} className="text-white drop-shadow-md" />
            )}
          </div>
        </div>
      </div>

    </header>
  );
};

export default StatusBar;