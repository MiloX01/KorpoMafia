import React, { useState } from 'react';
import { Briefcase, CheckSquare, Square, ChevronUp, ChevronDown, FileText, ShieldAlert, Scroll, Banknote, Bug, Clock } from 'lucide-react';
import { Task, Phase, InventoryItem } from '../types';

interface PersonalPanelProps {
  role: string;
  task: Task;
  phase: Phase;
  inventory: InventoryItem[];
  onToggleTask: () => void;
}

const PersonalPanel: React.FC<PersonalPanelProps> = ({ role, task, phase, inventory, onToggleTask }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  const isNight = phase === 'NIGHT';
  const theme = isNight ? {
    bg: 'bg-slate-800',
    darkBg: 'bg-slate-900',
    accent: 'text-purple-400',
    border: 'border-slate-700',
    text: 'text-slate-300'
  } : {
    bg: 'bg-corp-blue',
    darkBg: 'bg-corp-blue-dark',
    accent: 'text-blue-200',
    border: 'border-white/10',
    text: 'text-white'
  };

  return (
    <footer 
        className={`${theme.bg} ${theme.text} shadow-[0_-4px_20px_rgba(0,0,0,0.2)] z-50 shrink-0 relative transition-all duration-500 ease-in-out ${isCollapsed ? 'pb-0' : 'pb-4'}`}
    >
      
      {/* Inventory Button & Drawer */}
      <div className="absolute bottom-full left-0 right-0 flex justify-end px-4 pb-4 pointer-events-none">
          <div className="relative pointer-events-auto">
            {/* Drawer */}
            <div className={`absolute bottom-full right-0 mb-2 transition-all duration-300 origin-bottom-right ${isInventoryOpen ? 'scale-100 opacity-100' : 'scale-75 opacity-0 pointer-events-none'}`}>
                 <div className={`bg-white dark:bg-slate-800 p-2 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 flex gap-2 w-max max-w-[80vw] overflow-x-auto`}>
                    {inventory.length === 0 ? (
                        <div className="p-2 text-xs text-slate-400 italic">Brak kart (Pustka)</div>
                    ) : (
                        inventory.map(item => (
                            <div key={item.id} className="w-16 h-20 bg-slate-100 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center gap-1 hover:-translate-y-1 transition-transform cursor-pointer shadow-sm shrink-0">
                                {item.type === 'L4' && <Scroll size={20} className="text-emerald-500" />}
                                {item.type === 'NDA' && <FileText size={20} className="text-blue-500" />}
                                {item.type === 'AUDIT' && <ShieldAlert size={20} className="text-red-500" />}
                                {item.type === 'BONUS' && <Banknote size={20} className="text-amber-500" />}
                                {item.type === 'ERROR' && <Bug size={20} className="text-rose-500" />}
                                <span className="text-[9px] font-bold uppercase text-slate-600 dark:text-slate-300 text-center leading-none px-1">{item.label}</span>
                            </div>
                        ))
                    )}
                 </div>
            </div>

            {/* Toggle Button */}
            <button 
                onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                className={`w-12 h-12 rounded-full ${isNight ? 'bg-purple-600 hover:bg-purple-500' : 'bg-slate-800 hover:bg-slate-700'} text-white shadow-lg border-2 border-white/20 flex items-center justify-center transition-all active:scale-95`}
            >
                <Briefcase size={20} />
                {inventory.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-slate-900">
                        {inventory.length}
                    </span>
                )}
            </button>
          </div>
      </div>

      {/* Collapse Handle */}
      <div className="absolute -top-5 left-0 right-0 h-5 flex justify-center z-10 pointer-events-none">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`pointer-events-auto h-5 w-16 ${theme.bg} rounded-t-lg flex items-center justify-center border-t border-x border-white/20 shadow-sm hover:brightness-110 active:brightness-90 transition-all`}
            aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
          >
            {isCollapsed ? <ChevronUp size={14} className="text-white/80" /> : <ChevronDown size={14} className="text-white/80" />}
          </button>
      </div>

      <div className={`flex items-stretch overflow-hidden transition-all duration-300 ${isCollapsed ? 'h-14' : 'h-24'}`}>
        
        {/* Role Section */}
        <button 
            onClick={() => isCollapsed && setIsCollapsed(false)}
            className={`${isCollapsed ? 'w-full flex-row gap-4 border-r-0 hover:brightness-110' : `w-1/4 flex-col border-r ${theme.border}`} ${theme.darkBg} flex items-center justify-center p-2 transition-all relative group text-left`}
        >
          <div className={`bg-white/10 p-2 rounded-full transition-all ${isCollapsed ? 'scale-90 mb-0' : 'mb-1'}`}>
            <Briefcase size={20} className="text-white" />
          </div>
          <div className={`flex flex-col ${isCollapsed ? 'items-start' : 'items-center'}`}>
              <span className={`font-bold leading-tight uppercase transition-all ${isCollapsed ? 'text-xs' : 'text-[9px] text-center opacity-80'}`}>
                {role}
              </span>
              <span className={`transition-all font-normal ${isCollapsed ? 'text-[9px]' : 'text-[8px] opacity-60'}`}>
                (Twoja Rola)
              </span>
          </div>
        </button>

        {/* Task Section */}
        <div className={`flex-1 flex flex-col justify-center p-3 ${theme.bg} relative overflow-hidden transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 p-0 flex-none' : 'opacity-100'}`}>
             <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #fff 10px, #fff 12px)'}}></div>
             
             <div className="relative z-10 min-w-[150px]">
                <span className={`text-[10px] font-bold ${theme.accent} tracking-widest uppercase mb-1 block`}>Zadanie Na Dziś</span>
                <button 
                    onClick={onToggleTask}
                    className="flex items-start gap-2 text-left w-full group active:scale-[0.99] transition-transform"
                >
                    {task.completed ? (
                        <CheckSquare className="shrink-0 text-emerald-300 mt-0.5" size={20} />
                    ) : (
                        <Square className="shrink-0 text-white/50 group-hover:text-white mt-0.5" size={20} />
                    )}
                    <span className={`text-xs font-medium leading-tight ${task.completed ? `line-through ${theme.accent}` : 'text-white'}`}>
                        {task.label}
                    </span>
                </button>
             </div>
        </div>

        {/* Status Area (Previously Button) */}
        <div className={`w-1/3 p-2 ${theme.darkBg} flex items-center justify-center transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 p-0 flex-none' : 'opacity-100'}`}>
            <div className="flex flex-col items-center justify-center opacity-50">
                <Clock size={16} className="text-white mb-1" />
                <span className="text-[10px] font-bold uppercase text-white tracking-wider">W Toku</span>
            </div>
        </div>

      </div>
      
      <div className={`bg-slate-900 w-full transition-all duration-300 ${isCollapsed ? 'h-0' : 'h-4'}`}></div>
    </footer>
  );
};

export default PersonalPanel;