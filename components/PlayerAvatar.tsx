import React from 'react';
import { Mic, Lock, User, Check } from 'lucide-react';
import { Player } from '../types';

interface PlayerAvatarProps {
  player: Player;
  hasVoted?: boolean;
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ player, hasVoted }) => {
  // Styles based on state
  const isSpeakingClass = player.isSpeaking ? 'ring-4 ring-corp-blue ring-offset-2' : 'ring-1 ring-slate-300';
  const isSelfClass = player.isSelf ? 'shadow-glow-gold border-amber-400 border-2' : 'border-white border-2';
  
  return (
    <div className={`flex flex-col items-center relative transition-all duration-300 ${player.isSelf ? 'scale-110 z-10' : 'scale-100'}`}>
      
      {/* Speaking Indicator Pulse (Background) */}
      {player.isSpeaking && (
        <span className="absolute inline-flex h-full w-full rounded-full bg-corp-blue opacity-20 animate-ping"></span>
      )}

      {/* Avatar Circle */}
      <div className={`relative w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden transition-all ${isSpeakingClass} ${isSelfClass} bg-white shadow-lg`}>
        {/* Placeholder Avatar Image based on name hash/random or just initials */}
        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-300 flex items-center justify-center text-slate-400">
           <User size={32} />
        </div>
        
        {/* NDA Lock Overlay */}
        {player.isNdaActive && (
          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center backdrop-blur-[2px] z-20 animate-in fade-in duration-300">
            <Lock className="text-emergency-red drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]" size={28} />
          </div>
        )}
      </div>

      {/* Voted Indicator (New) */}
      {hasVoted && (
          <div className="absolute -top-1 -right-1 z-30 bg-green-500 text-white rounded-full p-1 border-2 border-white shadow-sm animate-in zoom-in duration-200">
              <Check size={12} strokeWidth={4} />
          </div>
      )}

      {/* Name Label */}
      <div className="mt-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded text-[10px] font-bold text-slate-700 uppercase tracking-tight shadow-sm whitespace-nowrap z-20 flex items-center gap-1">
        {player.name}
        {player.isSpeaking && !player.isSilenced && (
            <Mic size={10} className="text-corp-blue animate-pulse" />
        )}
      </div>
    </div>
  );
};

export default PlayerAvatar;