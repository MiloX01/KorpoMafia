import React, { useState, useEffect } from 'react';
import { Briefcase, Users, Copy, Play, ArrowRight, Building2, UserPlus, Fingerprint, Check } from 'lucide-react';
import { Player } from '../types';

interface LobbyProps {
  roomCode: string | null;
  players: Player[];
  isHost: boolean;
  initialRoomCode: string | null;
  onCreateRoom: (name: string) => void;
  onJoinRoom: (name: string, code: string) => void;
  onStartGame: () => void;
  onSimulateFullLobby: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ 
  roomCode, 
  players, 
  isHost, 
  initialRoomCode,
  onCreateRoom, 
  onJoinRoom, 
  onStartGame,
  onSimulateFullLobby
}) => {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isJoinMode, setIsJoinMode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize from props
  useEffect(() => {
    if (initialRoomCode && !roomCode) {
      setJoinCode(initialRoomCode);
      setIsJoinMode(true);
    }
  }, [initialRoomCode, roomCode]);

  // RADICAL FIX: Generate invitation URL using ONLY origin and hash.
  // This explicitly excludes 'pathname' and 'href' to prevent UUID/Blob path issues and doubling.
  const getInviteUrl = () => {
      const cleanOrigin = window.location.origin;
      // Remove trailing slash from origin if present to ensure clean format
      const origin = cleanOrigin.endsWith('/') ? cleanOrigin.slice(0, -1) : cleanOrigin;
      return `${origin}/#room=${roomCode}`;
  };

  const handleCopyLink = () => {
    const url = getInviteUrl();
    navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
        console.error("Clipboard write failed", err);
    });
  };

  if (roomCode) {
    // WAITING ROOM VIEW
    const inviteUrl = getInviteUrl();

    return (
      <div className="flex flex-col h-full w-full bg-slate-50 items-center justify-center p-6 animate-in fade-in duration-500 relative">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[80dvh]">
          
          {/* Header */}
          <div className="bg-corp-blue p-6 text-center relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            <h1 className="text-white font-black uppercase tracking-widest text-lg relative z-10">Pokój Konferencyjny</h1>
            <div className="mt-2 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg border border-white/20">
              <span className="text-blue-100 text-xs font-bold uppercase">Kod:</span>
              <span className="text-white font-mono text-5xl font-black tracking-wider">{roomCode}</span>
            </div>
          </div>

          {/* Connected Players */}
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Users size={14} />
                Pracownicy ({players.length}/8)
              </h2>
              {/* Debug Button in Lobby */}
              <button 
                onClick={onSimulateFullLobby}
                className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-500 px-2 py-1 rounded border border-slate-300 transition-colors"
                title="Debug: Fill lobby with bots"
              >
                + SYMULUJ PEŁNY POKÓJ
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {players.map((p) => (
                <div key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border ${p.isSelf ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${p.isSelf ? 'bg-corp-blue text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">{p.name}</span>
                    <span className={`text-[9px] font-bold uppercase ${p.isSelf ? 'text-slate-400' : 'text-emerald-500'}`}>
                        {p.isSelf ? '(Ty)' : 'GOTOWY'}
                    </span>
                  </div>
                </div>
              ))}
              {[...Array(Math.max(0, 8 - players.length))].map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-slate-200 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200"></div>
                  <div className="h-2 w-16 bg-slate-100 rounded"></div>
                </div>
              ))}
            </div>

            {/* Invite Button & Manual Link */}
            <div className="space-y-3">
              <button 
                onClick={handleCopyLink}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {copied ? <CheckIcon /> : <Copy size={16} />}
                {copied ? 'Skopiowano Link!' : 'Skopiuj Link Zaproszenia'}
              </button>
              
              {/* VISUAL DEBUG FOR LINK */}
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-center">
                  <p className="text-[9px] font-bold text-red-500 uppercase">DEBUG LINK:</p>
                  <p className="text-[10px] font-mono text-red-700 break-all leading-tight select-all">
                      {inviteUrl}
                  </p>
              </div>
            </div>
            
            {/* Disclaimer for missing players */}
            {isHost && players.length < 8 && (
                <p className="text-center text-[10px] text-red-400 mt-4 opacity-70">
                    * Oczekiwanie na pełny skład (8/8)
                </p>
            )}

          </div>

          {/* Persistent Bottom Action Bar */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
             {isHost ? (
                <button 
                  onClick={onStartGame}
                  disabled={players.length < 8}
                  className={`w-full py-5 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all shadow-lg 
                    ${players.length < 8 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                        : 'bg-corp-blue hover:bg-corp-blue-dark text-white active:scale-95 shadow-glow-blue animate-pulse-slow'}`}
                >
                  <Play size={20} fill="currentColor" />
                  Rozpocznij Konferencję
                </button>
              ) : (
                <div className="text-center py-4 text-slate-400 text-xs font-medium animate-pulse bg-slate-100 rounded-xl">
                  Oczekiwanie na organizatora...
                </div>
              )}
          </div>
        </div>
      </div>
    );
  }

  // LANDING PAGE VIEW
  return (
    <div className="flex flex-col h-full w-full bg-slate-50 items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 relative z-10 border border-slate-100">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-corp-blue rounded-xl flex items-center justify-center shadow-glow-blue mb-4">
                <Briefcase className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Korpo<span className="text-corp-blue">Drama</span></h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">System Zarządzania Kryzysem</p>
        </div>

        {/* Name Input */}
        <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Identyfikator Pracownika (Twoje Imię)</label>
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Fingerprint size={18} /></div>
                <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Wpisz Imię..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-corp-blue focus:bg-white transition-all"
                    maxLength={12}
                />
            </div>
        </div>

        {/* Actions */}
        {!isJoinMode ? (
            <div className="space-y-3">
                <button 
                    onClick={() => name && onCreateRoom(name)}
                    disabled={!name}
                    className="w-full py-4 bg-corp-blue hover:bg-corp-blue-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:shadow-glow-blue transition-all active:scale-95"
                >
                    <Building2 size={18} />
                    Załóż Pokój
                </button>
                
                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                    <div className="relative flex justify-center"><span className="bg-white px-2 text-xs text-slate-400 font-medium">LUB</span></div>
                </div>

                <button 
                    onClick={() => setIsJoinMode(true)}
                    className="w-full py-3 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600 rounded-lg font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    Dołącz do Istniejącego
                    <ArrowRight size={16} />
                </button>
            </div>
        ) : (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kod Pokoju</label>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Users size={18} /></div>
                        <input 
                            type="text" 
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="NP. KOD123"
                            maxLength={6}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-corp-blue focus:bg-white transition-all uppercase"
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsJoinMode(false)}
                        className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold text-xs uppercase transition-colors"
                    >
                        Wróć
                    </button>
                    <button 
                        onClick={() => name && joinCode && onJoinRoom(name, joinCode)}
                        disabled={!name || !joinCode}
                        className="w-2/3 py-3 bg-corp-blue hover:bg-corp-blue-dark disabled:opacity-50 text-white rounded-lg font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <UserPlus size={18} />
                        Dołącz
                    </button>
                </div>
            </div>
        )}

      </div>
      
      <div className="mt-8 text-center text-slate-400 text-[10px] font-medium uppercase tracking-widest opacity-60">
        Secure Corporate Connection v2.4.1
      </div>
    </div>
  );
};

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
);

export default Lobby;