import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, ZoomIn, ZoomOut, ThumbsUp, ThumbsDown, ShieldAlert, Activity, CheckCircle, XCircle, FileText, Banknote, Bug, Scroll, RefreshCcw, Timer, Gavel, Skull, Eye, EyeOff, Search, Fingerprint, Users, Lock, Target, ShieldCheck, Clock, TrendingUp, Slash } from 'lucide-react';
import { Player, Phase, ReviewPhase, InventoryItem, NightStep } from '../types';
import PlayerAvatar from './PlayerAvatar';

interface WarRoomProps {
  players: Player[];
  topic: string;
  phase: Phase;
  userRole: string;
  reviewPhase: ReviewPhase;
  reviewIndex: number;
  reviewResult: 'APPROVED' | 'REJECTED' | null;
  currentReward: InventoryItem | null;
  discussionTime: number;
  nightStep: NightStep;
  mafiaVotes: Record<string, number>;
  round: number;
  overtimeTimer: number;
  overtimeVotes: Record<string, 'YES' | 'NO'>;
  overtimeResult: 'SUCCESS' | 'FAILURE' | null;
  currentVotes: Record<string, any>; // Add this prop
  onVote: (vote: 'YES' | 'NO') => void;
  onFinishDiscussion: () => void;
  onEliminatePlayer: (playerId: string) => void;
  onNightAction: (targetId: string) => void;
  onCloseSummary: () => void;
  onOvertimeVote: (vote: 'YES' | 'NO') => void;
}

const WarRoom: React.FC<WarRoomProps> = ({ 
    players, topic, phase, userRole, 
    reviewPhase, reviewIndex, reviewResult, currentReward, discussionTime,
    nightStep, mafiaVotes, round,
    overtimeTimer, overtimeVotes, overtimeResult,
    currentVotes,
    onVote, onFinishDiscussion, onEliminatePlayer, onNightAction, onCloseSummary, onOvertimeVote
}) => {
  const [isTopicCollapsed, setIsTopicCollapsed] = useState(false);
  const [isRewardRevealed, setIsRewardRevealed] = useState(false);
  
  // Zoom & Pan State
  // Default scale adjusted to 0.65 to ensure "Fit to Screen" visibility of all players
  const [scale, setScale] = useState(0.65);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Interaction State
  const isDragging = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);

  // Auto-center logic
  useEffect(() => {
    if (phase === 'REVIEW') {
      if (reviewPhase === 'ELIMINATION') {
         setPosition({x: 0, y: 0});
         setScale(0.7);
      } else if (reviewPhase !== 'SUMMARY') {
        setPosition({x: 0, y: 0});
        setScale(1);
      }
    } else if (phase === 'NIGHT') {
        setPosition({x: 0, y: 0});
        setScale(0.85);
    }
  }, [phase, reviewIndex, reviewPhase, nightStep]);

  // Reset reward reveal on new reward
  useEffect(() => {
    if (reviewPhase === 'REWARD') {
        setIsRewardRevealed(false);
    }
  }, [reviewPhase, currentReward]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {}
    const scaleAdjustment = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.4, scale + scaleAdjustment), 3);
    setScale(newScale);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastPosition.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - lastPosition.current.x;
    const deltaY = e.clientY - lastPosition.current.y;
    setPosition(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      if (lastPinchDist.current !== null) {
        const delta = dist - lastPinchDist.current;
        setScale(s => Math.min(Math.max(0.4, s + delta * 0.005), 3));
      }
      lastPinchDist.current = dist;
    }
  };
  
  const handleTouchEnd = () => {
    lastPinchDist.current = null;
  };

  const getPositionStyles = (position: Player['position']) => {
    switch (position) {
      case 'top': return 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2';
      case 'top-right': return 'top-[8%] right-0 translate-x-1/2';
      case 'right': return 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2';
      case 'bottom-right': return 'bottom-[8%] right-0 translate-x-1/2';
      case 'bottom': return 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2';
      case 'bottom-left': return 'bottom-[8%] left-0 -translate-x-1/2';
      case 'left': return 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2';
      case 'top-left': return 'top-[8%] left-0 -translate-x-1/2';
      default: return '';
    }
  };

  // Theme Handling
  const isNight = phase === 'NIGHT';
  const bgClass = isNight ? 'bg-slate-900' : 'bg-slate-100';
  const gridColor = isNight ? 'linear-gradient(#4c1d95 1px, transparent 1px), linear-gradient(90deg, #4c1d95 1px, transparent 1px)' : 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)';

  // Logic to determine if current Night Step matches User Role
  let isMyTurn = false;
  if (nightStep === 'AUDITOR' && userRole === 'Audytor') isMyTurn = true;
  if (nightStep === 'GOSIA' && userRole === 'Gosia (Księgowość)') isMyTurn = true;
  if (nightStep === 'DIRECTOR' && userRole === 'Dyrektor Operacyjny') isMyTurn = true;
  
  // Mafia Logic: All competition wake up. Kret only if round >= 3.
  if (nightStep === 'MAFIA') {
      const isCompetition = ['Haker', 'Specjalista BHP', 'Headhunter', 'Kret'].includes(userRole);
      if (isCompetition) {
          if (userRole === 'Kret' && round < 3) isMyTurn = false;
          else isMyTurn = true;
      }
  }

  // Is current user voted in Overtime?
  const currentUser = players.find(p => p.isSelf);
  const hasVotedOvertime = currentUser && overtimeVotes[currentUser.id];
  const hasVotedCurrent = currentUser && currentVotes[currentUser.id];

  return (
    <main className={`flex-1 relative flex flex-col items-center justify-center ${bgClass} overflow-hidden w-full h-full transition-colors duration-500`}>
      
      {/* Background Grid - Reduced Opacity */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: gridColor, backgroundSize: '50px 50px' }}>
      </div>

      {/* Review Progress Header */}
      {phase === 'REVIEW' && reviewPhase !== 'SUMMARY' && reviewPhase !== 'ELIMINATION' && (
        <div className="absolute top-4 w-full max-w-md px-4 text-center z-40 flex flex-col items-center">
             <div className="bg-slate-900/90 text-white backdrop-blur-md border-l-4 border-yellow-400 shadow-xl rounded-r-md px-4 py-3 flex items-center justify-between gap-4 w-full animate-in slide-in-from-top-4">
                <div>
                    <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Ocena Pracownika</h2>
                    <p className="text-sm font-bold leading-tight text-left">
                        {players[reviewIndex]?.name}
                    </p>
                </div>
                <div className="text-xl font-black text-yellow-400 font-mono">
                    {reviewIndex + 1}<span className="text-xs text-slate-500 align-top">/{players.length}</span>
                </div>
             </div>
        </div>
      )}

      {/* Night Header */}
      {phase === 'NIGHT' && (
          <div className="absolute top-4 w-full max-w-md px-4 text-center z-40 flex flex-col items-center">
               <div className="bg-slate-900/90 text-white backdrop-blur-md border-b border-purple-500 shadow-glow-purple rounded-b-lg px-4 py-2 w-full">
                   <div className="flex items-center justify-center gap-2">
                       <Fingerprint size={16} className="text-purple-400" />
                       <span className="text-xs font-bold uppercase tracking-widest text-purple-200">
                           {isMyTurn ? "Twoja Tura" : "System Przetwarza..."}
                       </span>
                   </div>
               </div>
          </div>
      )}

      {/* Standard Topic Header */}
      {!isNight && phase !== 'REVIEW' && phase !== 'OVERTIME_VOTE' && phase !== 'OVERTIME_OUTCOME' && (
        <div className="absolute top-4 w-full max-w-md px-4 text-center z-40 pointer-events-none flex flex-col items-center">
            <div className={`pointer-events-auto bg-white border-l-4 border-corp-blue shadow-lg rounded-r-md transition-all duration-300 ease-in-out overflow-hidden relative group w-full ${isTopicCollapsed ? 'max-w-[200px]' : ''}`}>
                <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50"
                    onClick={() => setIsTopicCollapsed(!isTopicCollapsed)}
                >
                    <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Obecny Temat</h2>
                    <div className="text-slate-400">
                        {isTopicCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </div>
                </div>
                
                <div className={`px-3 pb-3 transition-all duration-300 ${isTopicCollapsed ? 'max-h-0 opacity-0 pb-0' : 'max-h-24 opacity-100'}`}>
                    <p className="text-sm font-semibold text-slate-800 leading-tight border-t border-slate-100 pt-2">
                        "{topic}"
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* Overtime Vote Overlay */}
      {phase === 'OVERTIME_VOTE' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-500 p-6">
              <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-corp-blue transform scale-100 transition-transform">
                  <div className="bg-corp-blue p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-white mb-1">
                          <Clock className="animate-pulse" />
                          <h2 className="text-xl font-black uppercase tracking-widest">Głosowanie</h2>
                      </div>
                      <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Zagłosuj na Nadgodziny</p>
                  </div>
                  
                  <div className="p-6 flex flex-col items-center">
                      <p className="text-slate-600 text-center font-bold mb-6 text-sm">
                          Czy doliczyć dodatkowy czas (3 minuty) kosztem <span className="text-red-500">-5% Budżetu</span>?
                      </p>
                      
                      <div className="flex gap-4 w-full mb-6">
                          <button 
                             onClick={() => onOvertimeVote('YES')}
                             disabled={!!hasVotedOvertime}
                             className={`flex-1 py-4 rounded-lg font-black uppercase text-sm border-2 transition-all active:scale-95 ${hasVotedOvertime && overtimeVotes[currentUser!.id] === 'YES' ? 'bg-green-500 text-white border-green-600 shadow-inner' : hasVotedOvertime ? 'bg-slate-100 text-slate-300 border-slate-200' : 'bg-white text-green-600 border-green-500 hover:bg-green-50'}`}
                          >
                              Tak
                              <span className="block text-[10px] font-normal opacity-80">(Dolicz)</span>
                          </button>
                          
                          <button 
                             onClick={() => onOvertimeVote('NO')}
                             disabled={!!hasVotedOvertime}
                             className={`flex-1 py-4 rounded-lg font-black uppercase text-sm border-2 transition-all active:scale-95 ${hasVotedOvertime && overtimeVotes[currentUser!.id] === 'NO' ? 'bg-red-500 text-white border-red-600 shadow-inner' : hasVotedOvertime ? 'bg-slate-100 text-slate-300 border-slate-200' : 'bg-white text-red-600 border-red-500 hover:bg-red-50'}`}
                          >
                              Nie
                              <span className="block text-[10px] font-normal opacity-80">(Review)</span>
                          </button>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                          <div className="bg-corp-blue h-full transition-all duration-1000 ease-linear" style={{ width: `${(overtimeTimer / 15) * 100}%` }}></div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">Pozostało: {overtimeTimer}s</span>
                  </div>
              </div>
          </div>
      )}

      {/* Outcome Overlay (Success/Failure) */}
      {phase === 'OVERTIME_OUTCOME' && overtimeResult && (
          <div className={`absolute inset-0 z-[55] flex flex-col items-center justify-center p-8 animate-in zoom-in duration-500 ${overtimeResult === 'SUCCESS' ? 'bg-corp-blue' : 'bg-slate-200'}`}>
              <div className="max-w-md w-full flex flex-col items-center text-center space-y-6">
                  {/* Icon */}
                  <div className={`p-6 rounded-full shadow-2xl ${overtimeResult === 'SUCCESS' ? 'bg-white/20' : 'bg-white'}`}>
                      {overtimeResult === 'SUCCESS' ? (
                          <TrendingUp size={64} className="text-white drop-shadow-md" />
                      ) : (
                          <Slash size={64} className="text-slate-400" />
                      )}
                  </div>

                  {/* Header */}
                  <h1 className={`text-4xl font-black uppercase tracking-tighter leading-none ${overtimeResult === 'SUCCESS' ? 'text-white' : 'text-slate-800'}`}>
                      {overtimeResult === 'SUCCESS' ? 'ZATWIERDZONO' : 'ODMOWA'}
                  </h1>

                  {/* Main Message */}
                  <div className={`border-l-4 pl-4 text-left ${overtimeResult === 'SUCCESS' ? 'border-white/50 text-blue-100' : 'border-slate-400 text-slate-600'}`}>
                      <h3 className={`text-sm font-bold uppercase tracking-widest mb-1 ${overtimeResult === 'SUCCESS' ? 'text-white' : 'text-slate-900'}`}>
                          {overtimeResult === 'SUCCESS' ? 'Inwestycja w Komunikację' : 'Optymalizacja Kosztów'}
                      </h3>
                      <p className="text-sm leading-relaxed font-medium">
                          {overtimeResult === 'SUCCESS' 
                              ? "Zarząd zatwierdził dodatkowe 3 minuty debaty." 
                              : "Brak zgody na nadgodziny. Przechodzimy do Weekly Review."}
                      </p>
                  </div>

                  {/* Impact Tag */}
                  {overtimeResult === 'SUCCESS' && (
                      <div className="bg-white/10 px-4 py-2 rounded text-white font-mono text-xs font-bold flex items-center gap-2">
                          <span className="text-red-300">Koszt: -5% Budżetu</span>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Main Content Area */}
      {reviewPhase === 'SUMMARY' ? (
        // REVIEW SUMMARY UI
        <div className="w-full h-full flex items-center justify-center p-6 z-50 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
             <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden">
                <div className="bg-corp-blue p-6 text-center text-white">
                    <h2 className="text-xl font-bold uppercase tracking-widest">Tydzień {round} Zakończony</h2>
                    <p className="opacity-80 text-sm mt-1">Podsumowanie</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="text-slate-500 font-medium text-sm">Pracownicy</span>
                        <span className="text-slate-800 font-bold">{players.length - (players.filter(p => p.isEliminated).length || 0)}</span>
                    </div>
                    <div className="pt-4">
                        <button 
                            onClick={onCloseSummary}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                        >
                            <RefreshCcw size={18} />
                            Rozpocznij Tydzień {round + 1}
                        </button>
                    </div>
                </div>
             </div>
        </div>
      ) : (
        // TABLE VIEW (Day/Night/Voting)
        <div 
            className="w-full h-full cursor-grab active:cursor-grabbing touch-none flex items-center justify-center overflow-hidden"
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div 
                style={{ 
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transition: isDragging.current ? 'none' : 'transform 0.2s cubic-bezier(0.1, 0.7, 1.0, 0.1)',
                    filter: (phase === 'OVERTIME_VOTE' || phase === 'OVERTIME_OUTCOME') ? 'blur(8px)' : 'none'
                }}
                className="relative flex items-center justify-center" 
            >
                {/* The Table "World" Container */}
                <div className="relative w-[360px] h-[560px] bg-transparent flex items-center justify-center">
                    
                    {/* Conference Table Graphic */}
                    <div className={`absolute inset-6 bg-[#E5D3B3] shadow-[0_10px_30px_rgba(0,0,0,0.15),inset_0_0_40px_rgba(0,0,0,0.05)] border-8 border-[#D4C3A3] rounded-[3rem] overflow-hidden transition-colors duration-1000 ${reviewPhase === 'ELIMINATION' ? 'shadow-[0_0_50px_rgba(255,0,0,0.3)] border-red-900/30' : ''} ${phase === 'NIGHT' ? 'bg-slate-800 border-slate-700' : ''}`}>
                        
                        {/* Wood grain effect (subtle noise) */}
                        {phase !== 'NIGHT' && (
                             <div className="absolute inset-0 opacity-10"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
                                    mixBlendMode: 'multiply'
                                }}
                             ></div>
                        )}
                        
                        {/* Table Surface details / Gloss */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/5 transition-colors duration-1000 ${reviewPhase === 'ELIMINATION' ? 'bg-red-500/10' : ''} ${phase === 'NIGHT' ? 'opacity-10' : ''}`}></div>
                        
                        {/* Night Mode Table Decor */}
                        {phase === 'NIGHT' && (
                             <div className="absolute inset-0 flex items-center justify-center">
                                 {isMyTurn ? (
                                     <div className="w-48 h-48 rounded-full border border-purple-500/30 animate-pulse bg-purple-900/10 flex items-center justify-center">
                                        {/* Role Specific Icons in Center */}
                                        {nightStep === 'MAFIA' && <Skull size={48} className="text-red-500 opacity-50" />}
                                        {nightStep === 'AUDITOR' && <Search size={48} className="text-blue-500 opacity-50" />}
                                        {nightStep === 'GOSIA' && <ShieldCheck size={48} className="text-green-500 opacity-50" />}
                                        {nightStep === 'DIRECTOR' && <Eye size={48} className="text-amber-500 opacity-50" />}
                                     </div>
                                 ) : (
                                     <div className="text-slate-600 font-mono text-[10px] uppercase tracking-widest animate-pulse">System Standby</div>
                                 )}
                             </div>
                        )}

                        {/* Corp Logo */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border border-dashed border-[#B09A75]/50 rounded-[2rem] flex items-center justify-center pointer-events-none">
                            <div className="w-16 h-16 rounded-full bg-[#D4C3A3]/30 flex items-center justify-center">
                                <span className="text-[#8A7555] text-xs font-bold tracking-widest opacity-50">CORP</span>
                            </div>
                        </div>
                    </div>

                    {/* Players */}
                    {players.filter(p => !p.isEliminated).map((player, index) => {
                        // Logic for Highlight/Interaction
                        const isReviewTarget = (phase === 'REVIEW' && reviewPhase !== 'ELIMINATION') && index === reviewIndex;
                        const isDimmed = (phase === 'REVIEW' && reviewPhase !== 'ELIMINATION') && !isReviewTarget;
                        const isEliminationMode = reviewPhase === 'ELIMINATION';
                        const hasVoted = !!currentVotes[player.id];
                        
                        // Night Mode Interaction Logic
                        let isNightTarget = false;
                        
                        if (phase === 'NIGHT' && isMyTurn) {
                            if (nightStep === 'MAFIA') {
                                // Competition targets non-competition
                                const isTargetMafia = ['Haker', 'Specjalista BHP', 'Headhunter', 'Kret'].includes(player.role);
                                isNightTarget = !player.isSelf && !isTargetMafia;
                            } else if (nightStep === 'AUDITOR' || nightStep === 'GOSIA' || nightStep === 'DIRECTOR') {
                                isNightTarget = !player.isSelf;
                            }
                        }

                        // Determine Voting Count for Mafia
                        const voteCount = (nightStep === 'MAFIA' && mafiaVotes[player.id]) ? mafiaVotes[player.id] : 0;

                        return (
                            <div 
                                key={player.id} 
                                className={`absolute z-10 ${getPositionStyles(player.position)} transition-all duration-500 
                                    ${isDimmed ? 'opacity-30 blur-sm grayscale' : 'opacity-100'} 
                                    ${isReviewTarget ? 'scale-125 z-50' : ''}
                                    ${(isEliminationMode || isNightTarget) ? 'hover:scale-110 cursor-pointer' : ''}
                                `}
                                onClick={() => {
                                    if (isEliminationMode && !player.isSelf) onEliminatePlayer(player.id);
                                    if (isNightTarget) onNightAction(player.id);
                                }}
                            >
                                <PlayerAvatar player={player} hasVoted={hasVoted} />
                                
                                {isReviewTarget && (
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap animate-bounce">
                                        DO OCENY
                                    </div>
                                )}
                                
                                {isEliminationMode && !player.isSelf && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                                        <Gavel className="text-red-500" size={24} />
                                    </div>
                                )}

                                {/* Night Action Icons */}
                                {isNightTarget && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-purple-900/40 rounded-full opacity-0 hover:opacity-100 transition-opacity border-2 border-purple-400">
                                        {nightStep === 'AUDITOR' && <Search className="text-blue-200" size={24} />}
                                        {nightStep === 'MAFIA' && <Target className="text-red-500" size={24} />}
                                        {nightStep === 'GOSIA' && <ShieldCheck className="text-green-400" size={24} />}
                                        {nightStep === 'DIRECTOR' && <Eye className="text-amber-400" size={24} />}
                                    </div>
                                )}

                                {/* Mafia Voting Pills */}
                                {voteCount > 0 && nightStep === 'MAFIA' && (
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-2 rounded-full shadow border border-white flex items-center gap-1 animate-in zoom-in">
                                        <Users size={8} /> {voteCount}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Overlays */}
                    <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                        
                        {/* Night Standby Screen */}
                        {phase === 'NIGHT' && !isMyTurn && (
                            <div className="bg-slate-900/90 border border-slate-700 p-6 rounded-lg shadow-2xl flex flex-col items-center animate-pulse pointer-events-auto">
                                <Lock className="text-slate-500 mb-2" size={32} />
                                <h3 className="text-slate-300 font-mono font-bold uppercase tracking-widest text-sm">Przetwarzanie Tury</h3>
                                <p className="text-slate-500 text-[10px] mt-1">Oczekiwanie na inne działy...</p>
                            </div>
                        )}

                        {/* Night Active Role Hints */}
                        {phase === 'NIGHT' && isMyTurn && (
                             <div className="absolute bottom-12 bg-purple-900/80 backdrop-blur px-4 py-2 rounded-full border border-purple-500 text-purple-100 text-xs font-bold pointer-events-auto shadow-glow-purple animate-in slide-in-from-bottom-4">
                                 {nightStep === 'AUDITOR' && "Audyt: Wybierz pracownika, aby sprawdzić sektor."}
                                 {nightStep === 'MAFIA' && "Cicha Zgoda: Głosujcie wspólnie nad eliminacją."}
                                 {nightStep === 'DIRECTOR' && "Dyrektor: Sprawdź użycie kart przez pracownika."}
                                 {nightStep === 'GOSIA' && "Księgowość: Wybierz pracownika do ochrony budżetu."}
                             </div>
                        )}

                        {/* Discussion Timer */}
                        {reviewPhase === 'DISCUSSION' && (
                            <div className="pointer-events-auto flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                                <div className="w-32 h-32 rounded-full border-4 border-slate-200 bg-white flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
                                    <div className="absolute bottom-0 left-0 right-0 bg-slate-100 h-full transition-all duration-1000 ease-linear origin-bottom"
                                            style={{ height: `${(discussionTime / 180) * 100}%` }}></div>
                                    <span className="relative z-10 text-3xl font-black text-slate-800 font-mono">
                                        {Math.floor(discussionTime / 60)}:{(discussionTime % 60).toString().padStart(2, '0')}
                                    </span>
                                    <span className="relative z-10 text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Czas Wypowiedzi</span>
                                </div>
                                <button 
                                    onClick={onFinishDiscussion}
                                    className="bg-corp-blue hover:bg-corp-blue-dark text-white text-xs font-bold py-2 px-6 rounded-full shadow-lg transition-transform active:scale-95"
                                >
                                    Zakończ Wypowiedź
                                </button>
                            </div>
                        )}

                        {/* Voting Controls */}
                        {reviewPhase === 'VOTING' && (
                            <div className="flex gap-16 pointer-events-auto animate-in zoom-in fade-in duration-300">
                                <button onClick={() => !hasVotedCurrent && onVote('YES')} className={`w-20 h-20 rounded-full bg-green-500/90 backdrop-blur-sm shadow-glow-gold flex items-center justify-center text-white border-4 border-white hover:scale-110 active:scale-95 transition-all group ${hasVotedCurrent ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <ThumbsUp size={32} className="group-hover:-rotate-12 transition-transform" />
                                </button>
                                <button onClick={() => !hasVotedCurrent && onVote('NO')} className={`w-20 h-20 rounded-full bg-red-500/90 backdrop-blur-sm shadow-glow-gold flex items-center justify-center text-white border-4 border-white hover:scale-110 active:scale-95 transition-all group ${hasVotedCurrent ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <ThumbsDown size={32} className="group-hover:rotate-12 transition-transform" />
                                </button>
                            </div>
                        )}

                        {/* Results */}
                        {reviewPhase === 'RESULT' && reviewResult && (
                            <div className={`px-6 py-4 rounded-xl shadow-2xl border-4 border-white transform scale-110 animate-in zoom-in duration-300 flex flex-col items-center gap-2 ${reviewResult === 'APPROVED' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                {reviewResult === 'APPROVED' ? <CheckCircle size={48} /> : <XCircle size={48} />}
                                <span className="font-black text-xl uppercase tracking-widest">
                                    {reviewResult === 'APPROVED' ? 'ZATWIERDZONO' : 'ODRZUCONO'}
                                </span>
                            </div>
                        )}

                        {/* Privacy Reward Overlay */}
                        {reviewPhase === 'REWARD' && (
                            <div className="relative pointer-events-auto animate-in slide-in-from-bottom-10 fade-in duration-500">
                                <div className="w-56 h-72 bg-white rounded-lg shadow-2xl border-4 border-yellow-400 flex flex-col items-center justify-center relative overflow-hidden">
                                    
                                    {/* Privacy Layer - Only remove if it belongs to player and they click it */}
                                    {(!isRewardRevealed && players[reviewIndex]?.isSelf) ? (
                                        <div 
                                            onClick={() => setIsRewardRevealed(true)}
                                            className="absolute inset-0 bg-slate-800 z-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors"
                                        >
                                            <div className="border-2 border-white/20 p-4 rounded-lg mb-2">
                                                <EyeOff className="text-white opacity-50" size={32} />
                                            </div>
                                            <span className="text-white font-black uppercase tracking-widest text-lg animate-pulse">Poufne</span>
                                            <span className="text-slate-400 text-[10px] mt-1">Dotknij aby odsłonić</span>
                                        </div>
                                    ) : (!players[reviewIndex]?.isSelf) && (
                                         <div className="absolute inset-0 bg-slate-100 z-50 flex flex-col items-center justify-center pattern-grid-lg text-slate-300">
                                            <Lock size={40} className="mb-2 opacity-20" />
                                            <span className="text-slate-400 font-bold uppercase text-xs text-center px-4">
                                                {players[reviewIndex]?.name} otrzymał kartę
                                            </span>
                                         </div>
                                    )}

                                    {/* Actual Reward Content (Underneath) */}
                                    <div className="flex flex-col items-center justify-center h-full w-full p-4">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Przyznano Nagrodę</div>
                                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                            {currentReward?.type === 'L4' && <Scroll size={40} className="text-emerald-500" />}
                                            {currentReward?.type === 'NDA' && <FileText size={40} className="text-blue-500" />}
                                            {currentReward?.type === 'AUDIT' && <ShieldAlert size={40} className="text-red-500" />}
                                            {currentReward?.type === 'BONUS' && <Banknote size={40} className="text-amber-500" />}
                                            {currentReward?.type === 'ERROR' && <Bug size={40} className="text-rose-500" />}
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800 uppercase text-center leading-tight">
                                            {currentReward?.label}
                                        </h3>
                                        <span className="text-[10px] text-slate-500 mt-2">Dodano do ekwipunku</span>
                                    </div>
                                </div>
                                
                                {/* Confetti-like decor */}
                                <div className="absolute top-0 left-0 -mt-10 -ml-10 text-yellow-400 animate-spin-slow"><Activity size={30} /></div>
                                <div className="absolute bottom-0 right-0 -mb-10 -mr-10 text-blue-400 animate-pulse"><Activity size={30} /></div>
                            </div>
                        )}

                    </div>

                </div>
            </div>
        </div>
      )}

    </main>
  );
};

export default WarRoom;