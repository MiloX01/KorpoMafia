export type Phase = 'LOBBY' | 'DAY' | 'NIGHT' | 'REVIEW' | 'OVERTIME_VOTE' | 'OVERTIME_OUTCOME';
export type ReviewPhase = 'IDLE' | 'DISCUSSION' | 'VOTING' | 'PROCESSING' | 'RESULT' | 'REWARD' | 'ELIMINATION' | 'SUMMARY';
export type NightStep = 'IDLE' | 'AUDITOR' | 'GOSIA' | 'DIRECTOR' | 'MAFIA' | 'RESULTS';

export type Role = 
  | 'Dyrektor Operacyjny' 
  | 'Audytor' 
  | 'Gosia (Księgowość)' 
  | 'Stażysta Zarządu' 
  | 'Haker' 
  | 'Specjalista BHP' 
  | 'Headhunter' 
  | 'Kret';

export type Winner = 'BOARD' | 'COMPETITION' | null;

export interface Player {
  id: string;
  name: string;
  role: Role;
  sector: 'IT' | 'HR' | 'FINANCE' | 'OPERATIONS' | 'BOARD';
  status?: 'READY' | 'WAITING'; // Added status field
  isSelf: boolean;
  isHost: boolean;
  isSpeaking: boolean;
  isSilenced: boolean;
  isNdaActive: boolean;
  isEliminated?: boolean;
  position: 'bottom' | 'bottom-left' | 'left' | 'top-left' | 'top' | 'top-right' | 'right' | 'bottom-right';
}

export interface GameState {
  roomCode: string | null;
  projectProgress: number;
  budget: number;
  timeRemaining: number; // in seconds
  topic: string;
  phase: Phase;
  round: number;
  winner: Winner;
  hasUsedOvertime: boolean;
}

export interface Task {
  id: string;
  label: string;
  completed: boolean;
}

export interface InventoryItem {
  id: string;
  label: string;
  type: 'L4' | 'NDA' | 'AUDIT' | 'BONUS' | 'ERROR';
}