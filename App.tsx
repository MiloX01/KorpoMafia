import React, { useState, useEffect, useRef } from 'react';
import { Skull, Trophy, Briefcase, AlertTriangle, RefreshCw } from 'lucide-react';
import StatusBar from './components/StatusBar';
import WarRoom from './components/WarRoom';
import PersonalPanel from './components/PersonalPanel';
import Lobby from './components/Lobby';
import { GameState, Player, Task, Phase, ReviewPhase, InventoryItem, NightStep, Role, Winner } from './types';

// Firebase Imports
import { auth, db } from './firebase';
import { signInAnonymously } from "firebase/auth";
import { ref, set, update, onValue, get, remove } from "firebase/database";

// Card Pool Definition
const CARD_POOL: InventoryItem[] = [
  { id: 'pool-1', label: 'Premia Roczna', type: 'BONUS' },
  { id: 'pool-2', label: 'Audyt Finansowy', type: 'AUDIT' },
  { id: 'pool-3', label: 'L4 (Grypa)', type: 'L4' },
  { id: 'pool-4', label: 'Błąd w Excelu', type: 'ERROR' },
  { id: 'pool-5', label: 'NDA', type: 'NDA' },
];

const FULL_ROSTER_TEMPLATE: Player[] = [
  { id: '1', name: 'Anna', role: 'Audytor', sector: 'BOARD', isSelf: false, isHost: false, isSpeaking: false, isSilenced: false, isNdaActive: false, isEliminated: false, position: 'top-left' },
  { id: '2', name: 'Piotr', role: 'Haker', sector: 'IT', isSelf: false, isHost: false, isSpeaking: false, isSilenced: false, isNdaActive: false, isEliminated: false, position: 'top' },
  { id: '3', name: 'Zofia', role: 'Gosia (Księgowość)', sector: 'FINANCE', isSelf: false, isHost: false, isSpeaking: false, isSilenced: false, isNdaActive: false, isEliminated: false, position: 'top-right' },
  { id: '4', name: 'Tomasz', role: 'Headhunter', sector: 'HR', isSelf: false, isHost: false, isSpeaking: false, isSilenced: false, isNdaActive: false, isEliminated: false, position: 'left' },
  { id: '5', name: 'Kasia', role: 'Stażysta Zarządu', sector: 'BOARD', isSelf: false, isHost: false, isSpeaking: false, isSilenced: false, isNdaActive: false, isEliminated: false, position: 'right' },
  { id: '6', name: 'Robert', role: 'Specjalista BHP', sector: 'OPERATIONS', isSelf: false, isHost: false, isSpeaking: false, isSilenced: false, isNdaActive: false, isEliminated: false, position: 'bottom-left' },
  { id: '7', name: 'Marek', role: 'Dyrektor Operacyjny', sector: 'BOARD', isSelf: false, isHost: false, isSpeaking: true, isSilenced: false, isNdaActive: false, isEliminated: false, position: 'bottom-right' },
];

const INITIAL_GAME_STATE: GameState = {
  roomCode: null,
  projectProgress: 0,
  budget: 100,
  timeRemaining: 600, // 10:00 minutes
  topic: "Czy Tinder dla Gołębi potrzebuje funkcji 'Super-Gruchnięcia'?",
  phase: 'LOBBY',
  round: 1,
  winner: null,
  hasUsedOvertime: false,
};

const INITIAL_TASK: Task = {
  id: 'task-1',
  label: "'Poganiacz' - Przerwij dygresję.",
  completed: false
};

const App: React.FC = () => {
  // Navigation State
  const [view, setView] = useState<'LANDING' | 'LOBBY' | 'GAME'>('LANDING');

  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [task, setTask] = useState<Task>(INITIAL_TASK);
  const [role, setRole] = useState<string>("Stażysta");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  
  // Auth State
  const [userUid, setUserUid] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  // Auto-Join State
  const [initialRoomCode, setInitialRoomCode] = useState<string | null>(null);

  // Review & Voting State
  const [reviewPhase, setReviewPhase] = useState<ReviewPhase>('IDLE');
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewResult, setReviewResult] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [currentReward, setCurrentReward] = useState<InventoryItem | null>(null);
  const [discussionTime, setDiscussionTime] = useState(180);
  
  // Voting
  const [currentVotes, setCurrentVotes] = useState<Record<string, string>>({});

  // Night State
  const [nightStep, setNightStep] = useState<NightStep>('IDLE');
  const [mafiaVotes, setMafiaVotes] = useState<Record<string, number>>({});

  // Overtime State
  const [overtimeTimer, setOvertimeTimer] = useState(0);
  const [overtimeVotes, setOvertimeVotes] = useState<Record<string, 'YES' | 'NO'>>({});
  const [overtimeResult, setOvertimeResult] = useState<'SUCCESS' | 'FAILURE' | null>(null);

  // Bot Logic Refs to prevent double firing
  const botsTriggeredRef = useRef<string | null>(null);

  // --- AUTHENTICATION & INITIALIZATION ---
  useEffect(() => {
    // 1. Check URL HASH for room code immediately
    // This uses client-side #room=CODE to avoid server 404s
    try {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#room=')) {
            const code = hash.split('=')[1];
            if (code) {
                console.log("Room code detected from hash:", code);
                setInitialRoomCode(code);
            }
        }
    } catch (e) {
        console.error("URL Parsing failed:", e);
    }

    // 2. Authenticate
    authenticate();

    // 3. Monitor Firebase Connection
    const connectedRef = ref(db, ".info/connected");
    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        console.log("Firebase Connection: OK");
      } else {
        console.log("Firebase Connection: Disconnected");
      }
    });

    return () => unsubscribe();
  }, []);

  const authenticate = () => {
    setIsAuthenticating(true);
    setAuthError(null);
    signInAnonymously(auth)
      .then((result) => {
        setUserUid(result.user.uid);
        setAuthError(null);
      })
      .catch((error) => {
        console.error("Auth Error:", error);
        let msg = error.message;
        if (error.code === 'auth/configuration-not-found') {
             msg = "Konfiguracja Auth nie znaleziona.";
        }
        setAuthError(msg);
      })
      .finally(() => {
        setIsAuthenticating(false);
      });
  };

  const handleRetryAuth = () => {
      authenticate();
  };

  // --- LOBBY LOGIC & SYNC ---
  
  useEffect(() => {
    if (gameState.roomCode && userUid) {
        subscribeToRoom(gameState.roomCode);
    }
  }, [gameState.roomCode, userUid]);

  const subscribeToRoom = (code: string) => {
    const roomRef = ref(db, `rooms/${code}`);
    
    // Listen for changes in the Room
    const unsubscribe = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Update Game State
            if (data.gameState) {
                setGameState(prev => ({
                    ...prev,
                    ...data.gameState,
                    roomCode: code
                }));

                // Auto-switch view based on phase
                if (data.gameState.phase !== 'LOBBY' && view !== 'GAME') {
                    setView('GAME');
                } else if (data.gameState.phase === 'LOBBY' && view !== 'LOBBY') {
                    setView('LOBBY');
                }
            }

            // Sync Players
            if (data.players) {
                const playersArray: Player[] = Object.entries(data.players).map(([key, p]: [string, any]) => ({
                    ...p,
                    id: key,
                    isSelf: key === userUid
                }));
                setPlayers(playersArray);

                const myself = playersArray.find(p => p.id === userUid);
                if (myself) {
                    setIsHost(myself.isHost);
                    setRole(myself.role);
                }
            }

            // Sync Votes
            if (data.votes) {
                setCurrentVotes(data.votes);
            } else {
                setCurrentVotes({});
            }
        }
    }, (error) => {
        console.error("Database error:", error);
    });

    return unsubscribe;
  };

  // --- ROOM MANAGEMENT HANDLERS ---
  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 6; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  };

  const handleCreateRoom = async (playerName: string) => {
    if (!userUid) return;
    try {
        const code = generateRoomCode();
        const newPlayer: Player = {
          id: userUid,
          name: playerName,
          role: 'Stażysta Zarządu',
          sector: 'BOARD',
          status: 'READY',
          isSelf: true,
          isHost: true,
          isSpeaking: false,
          isSilenced: false,
          isNdaActive: false,
          isEliminated: false,
          position: 'bottom'
        };

        const updates: any = {};
        updates[`rooms/${code}/gameState`] = { ...INITIAL_GAME_STATE, roomCode: code };
        updates[`rooms/${code}/players/${userUid}`] = newPlayer;

        await update(ref(db), updates);
        setGameState(prev => ({ ...prev, roomCode: code }));
        setView('LOBBY');
    } catch (e) {
        console.error("Error creating room:", e);
    }
  };

  const handleJoinRoom = async (playerName: string, code: string) => {
    if (!userUid) return;
    try {
        const roomRef = ref(db, `rooms/${code}`);
        const snapshot = await get(roomRef);

        if (snapshot.exists()) {
            const newPlayer: Player = {
                id: userUid,
                name: playerName,
                role: 'Stażysta Zarządu',
                sector: 'BOARD',
                status: 'READY',
                isSelf: true,
                isHost: false,
                isSpeaking: false,
                isSilenced: false,
                isNdaActive: false,
                isEliminated: false,
                position: 'bottom'
            };

            await set(ref(db, `rooms/${code}/players/${userUid}`), newPlayer);
            setGameState(prev => ({ ...prev, roomCode: code }));
            setView('LOBBY');
        } else {
            alert("Pokój nie istnieje!");
        }
    } catch (e) {
        console.error("Error joining room:", e);
    }
  };

  const handleSimulateFullLobby = async () => {
    if (!gameState.roomCode) return;
    const botCount = 8 - players.length;
    if (botCount <= 0) return;

    const updates: any = {};
    for (let i = 0; i < botCount; i++) {
        const botId = `bot-${Date.now()}-${i}`;
        const botName = FULL_ROSTER_TEMPLATE[i % FULL_ROSTER_TEMPLATE.length].name;
        
        const botPlayer: Player = {
            id: botId,
            name: `${botName} (Bot)`,
            role: 'Stażysta Zarządu',
            sector: 'BOARD',
            status: 'READY',
            isSelf: false,
            isHost: false,
            isSpeaking: false,
            isSilenced: false,
            isNdaActive: false,
            isEliminated: false,
            position: 'top'
        };
        updates[`rooms/${gameState.roomCode}/players/${botId}`] = botPlayer;
    }
    await update(ref(db), updates);
  };

  const handleStartGame = async () => {
    if (!isHost || !gameState.roomCode || players.length !== 8) return;

    const roleBag: Role[] = [
        'Haker', 'Specjalista BHP',
        'Audytor', 'Gosia (Księgowość)', 'Dyrektor Operacyjny', 
        'Stażysta Zarządu', 'Stażysta Zarządu', 'Stażysta Zarządu'
    ];

    const shuffledRoles = roleBag.sort(() => Math.random() - 0.5);
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const positions: Player['position'][] = ['bottom', 'bottom-left', 'left', 'top-left', 'top', 'top-right', 'right', 'bottom-right'];

    const updates: any = {};
    shuffledPlayers.forEach((p, index) => {
        const assignedRole = shuffledRoles[index];
        const assignedPosition = positions[index];
        
        updates[`rooms/${gameState.roomCode}/players/${p.id}/role`] = assignedRole;
        updates[`rooms/${gameState.roomCode}/players/${p.id}/position`] = assignedPosition;
        
        let sector: any = 'BOARD';
        if (assignedRole === 'Haker') sector = 'IT';
        if (assignedRole === 'Gosia (Księgowość)') sector = 'FINANCE';
        if (assignedRole === 'Headhunter') sector = 'HR';
        if (assignedRole === 'Specjalista BHP') sector = 'OPERATIONS';
        
        updates[`rooms/${gameState.roomCode}/players/${p.id}/sector`] = sector;
    });

    updates[`rooms/${gameState.roomCode}/gameState/phase`] = 'DAY';
    updates[`rooms/${gameState.roomCode}/gameState/projectProgress`] = 0;
    updates[`rooms/${gameState.roomCode}/gameState/budget`] = 100;
    updates[`rooms/${gameState.roomCode}/gameState/timeRemaining`] = 600;
    updates[`rooms/${gameState.roomCode}/gameState/round`] = 1;
    updates[`rooms/${gameState.roomCode}/gameState/winner`] = null;
    updates[`rooms/${gameState.roomCode}/gameState/hasUsedOvertime`] = false;
    
    await update(ref(db), updates);
    setView('GAME');
  };

  // --- BOT VOTING SIMULATION ---
  useEffect(() => {
      // Logic runs only if I am Host
      if (!isHost || !gameState.roomCode) return;

      // Unique key for current voting session to prevent double triggering
      const triggerKey = `${gameState.round}-${reviewPhase}-${reviewIndex}`;

      // Check if we are in a voting phase
      const isVotingPhase = reviewPhase === 'VOTING' || reviewPhase === 'ELIMINATION';
      
      if (isVotingPhase && botsTriggeredRef.current !== triggerKey) {
          botsTriggeredRef.current = triggerKey;
          simulateBotVotes();
      }
  }, [reviewPhase, isHost, gameState.round, reviewIndex]);

  const simulateBotVotes = async () => {
      if (!gameState.roomCode) return;

      const activeBots = players.filter(p => !p.isSelf && !p.isEliminated);
      
      activeBots.forEach((bot) => {
          // 1. Random delay: 1.5s to 4.0s
          const delay = Math.floor(Math.random() * 2500) + 1500;

          setTimeout(async () => {
             // Re-check if phase is still valid inside timeout
             if (reviewPhase !== 'VOTING' && reviewPhase !== 'ELIMINATION') return;

             let voteValue = '';

             if (reviewPhase === 'VOTING') {
                 // Task Vote: 70% YES, 30% NO
                 voteValue = Math.random() < 0.7 ? 'YES' : 'NO';
             } else {
                 // Expulsion Vote (ELIMINATION)
                 const targets = players.filter(p => !p.isEliminated && p.id !== bot.id);
                 const randomTarget = targets[Math.floor(Math.random() * targets.length)];
                 voteValue = randomTarget ? randomTarget.id : '';
             }

             if (voteValue) {
                 await update(ref(db, `rooms/${gameState.roomCode}/votes/${bot.id}`), {
                     val: voteValue
                 });
             }
          }, delay);
      });
  };

  // --- AUTO RESOLVE VOTES ---
  useEffect(() => {
      if (!isHost || !gameState.roomCode) return;

      const activePlayers = players.filter(p => !p.isEliminated);
      const activeVoteCount = Object.keys(currentVotes).length;

      // Only proceed if everyone has voted and we are in a voting phase
      if (activeVoteCount >= activePlayers.length && activePlayers.length > 0) {
          if (reviewPhase === 'VOTING') {
              resolveTaskVotes();
          } else if (reviewPhase === 'ELIMINATION') {
              resolveEliminationVotes();
          }
      }
  }, [currentVotes, players, reviewPhase, isHost]);

  const resolveTaskVotes = async () => {
      if (!gameState.roomCode) return;

      const yesVotes = Object.values(currentVotes).filter((v: any) => v.val === 'YES').length;
      const noVotes = Object.values(currentVotes).filter((v: any) => v.val === 'NO').length;
      
      const passed = yesVotes > noVotes;
      const result = passed ? 'APPROVED' : 'REJECTED';

      setReviewPhase('PROCESSING');
      setReviewResult(result);
      
      // Clear votes in DB
      await remove(ref(db, `rooms/${gameState.roomCode}/votes`));

      setTimeout(async () => {
        setReviewPhase('RESULT');

        if (result === 'APPROVED') {
            const progressGain = Math.floor(Math.random() * (7 - 3 + 1) + 3);
            const directorAlive = players.some(p => p.role === 'Dyrektor Operacyjny' && !p.isEliminated);
            const totalGain = directorAlive ? progressGain + 2 : progressGain;

            await update(ref(db, `rooms/${gameState.roomCode}/gameState`), {
                projectProgress: Math.min(100, gameState.projectProgress + totalGain)
            });
        }

        setTimeout(async () => {
             if (result === 'APPROVED') {
                 // Reward Logic
                 const reward = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
                 const newItem = { ...reward, id: `inv-${Date.now()}` };
                 setCurrentReward(newItem);
                 setReviewPhase('REWARD');
                 
                 // If the reviewed player is ME, add to inventory
                 if (players[reviewIndex].isSelf) {
                     setInventory(prev => [...prev, newItem]);
                 }
                 setTimeout(nextPlayerOrElimination, 3500); 
             } else {
                 nextPlayerOrElimination();
             }
        }, 1500);

      }, 1000);
  };

  const resolveEliminationVotes = async () => {
      if (!gameState.roomCode) return;

      // Count votes for each target
      const voteCounts: Record<string, number> = {};
      Object.values(currentVotes).forEach((v: any) => {
          const targetId = v.val;
          voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
      });

      // Find player with max votes
      let maxVotes = 0;
      let targetPlayerId = '';
      
      Object.entries(voteCounts).forEach(([pid, count]) => {
          if (count > maxVotes) {
              maxVotes = count;
              targetPlayerId = pid;
          }
      });

      setReviewPhase('PROCESSING');
      // Clear votes
      await remove(ref(db, `rooms/${gameState.roomCode}/votes`));

      setTimeout(async () => {
           // Eliminate Locally and Remote
           const updates: any = {};
           updates[`rooms/${gameState.roomCode}/players/${targetPlayerId}/isEliminated`] = true;
           
           // Calculate Penalties
           let budgetPenalty = 10;
           let progressPenalty = 0;
           
           const target = players.find(p => p.id === targetPlayerId);
           const activeP = players.filter(p => !p.isEliminated && p.id !== targetPlayerId);
           
           if (activeP.some(p => p.role === 'Gosia (Księgowość)')) budgetPenalty = 5;
           
           if (target && ['Audytor', 'Gosia (Księgowość)', 'Dyrektor Operacyjny', 'Stażysta Zarządu'].includes(target.role)) {
                if (activeP.some(p => p.role === 'Specjalista BHP')) progressPenalty = 5;
           }

           updates[`rooms/${gameState.roomCode}/gameState/budget`] = Math.max(0, gameState.budget - budgetPenalty);
           updates[`rooms/${gameState.roomCode}/gameState/projectProgress`] = Math.max(0, gameState.projectProgress - progressPenalty);
           updates[`rooms/${gameState.roomCode}/gameState/phase`] = 'NIGHT';

           await update(ref(db), updates);

           setReviewPhase('IDLE');
           setNightStep('IDLE');
      }, 2000);
  };

  const nextPlayerOrElimination = () => {
    let nextIndex = reviewIndex + 1;
    while (nextIndex < players.length && players[nextIndex].isEliminated) {
        nextIndex++;
    }

    if (nextIndex < players.length) {
        setReviewIndex(nextIndex);
        setReviewPhase('DISCUSSION');
        setDiscussionTime(180);
        setReviewResult(null);
        setCurrentReward(null);
    } else {
        setReviewPhase('ELIMINATION');
    }
  };


  // --- USER ACTIONS ---
  const handleToggleTask = () => {
    setTask(prev => ({ ...prev, completed: !prev.completed }));
  };

  const handleStartReview = () => {
    setGameState(prev => ({ ...prev, phase: 'REVIEW' }));
    setReviewPhase('DISCUSSION');
    setDiscussionTime(180);
    setReviewIndex(0);
    setReviewResult(null);
    setCurrentReward(null);
  };

  const handleFinishDiscussion = () => {
      setReviewPhase('VOTING');
  };

  const handleVote = async (userVote: 'YES' | 'NO') => {
    if (!gameState.roomCode || !userUid) return;
    await update(ref(db, `rooms/${gameState.roomCode}/votes/${userUid}`), {
        val: userVote
    });
  };

  const handleEliminationVote = async (targetPlayerId: string) => {
    if (!gameState.roomCode || !userUid) return;
    await update(ref(db, `rooms/${gameState.roomCode}/votes/${userUid}`), {
        val: targetPlayerId
    });
  };

  // --- GAME LOOP & TIMERS ---
  useEffect(() => {
    if (gameState.winner) return;
    if (gameState.phase === 'LOBBY') return;
    if (gameState.projectProgress >= 100) setGameState(prev => ({ ...prev, winner: 'BOARD' }));
    else if (gameState.budget <= 0) setGameState(prev => ({ ...prev, winner: 'COMPETITION' }));
  }, [gameState.projectProgress, gameState.budget, gameState.winner]);

  useEffect(() => {
    if (gameState.winner) return;
    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.phase === 'DAY' && prev.timeRemaining <= 0) return prev;
        if ((prev.phase === 'DAY' || prev.phase === 'NIGHT' || prev.phase === 'REVIEW') && prev.timeRemaining > 0) {
            return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState.winner]);

  useEffect(() => {
      if (gameState.phase === 'DAY' && gameState.timeRemaining === 0) {
          if (!gameState.hasUsedOvertime) {
              setGameState(prev => ({ ...prev, phase: 'OVERTIME_VOTE' }));
              setOvertimeTimer(15);
              setOvertimeVotes({});
          } else {
              handleStartReview();
          }
      }
  }, [gameState.phase, gameState.timeRemaining]);

  useEffect(() => {
    let timer: number;
    if (reviewPhase === 'DISCUSSION') {
        timer = window.setInterval(() => {
            setDiscussionTime(prev => {
                if (prev <= 0) {
                    handleFinishDiscussion();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
    return () => clearInterval(timer);
  }, [reviewPhase]);

  // Night Logic Steps
  useEffect(() => {
      if (gameState.phase === 'NIGHT') {
          const activePlayers = players.filter(p => !p.isEliminated);
          let timeout: number;
          const proceed = (nextStep: NightStep, delay: number) => {
              timeout = window.setTimeout(() => setNightStep(nextStep), delay);
          };
          if (nightStep === 'IDLE') proceed('AUDITOR', 2000);
          else if (nightStep === 'AUDITOR') {
             const auditor = activePlayers.find(p => p.role === 'Audytor');
             if (!auditor) proceed('GOSIA', 2000);
          } else if (nightStep === 'GOSIA') {
             const gosia = activePlayers.find(p => p.role === 'Gosia (Księgowość)');
             if (!gosia) proceed('DIRECTOR', 2000);
          } else if (nightStep === 'DIRECTOR') {
             const ops = activePlayers.find(p => p.role === 'Dyrektor Operacyjny');
             if (!ops) proceed('MAFIA', 2000);
          }
          return () => clearTimeout(timeout);
      }
  }, [gameState.phase, nightStep, players]);

  // OTHER HANDLERS
  const handleNightAction = (targetId: string) => {
      if (nightStep === 'MAFIA') {
          setMafiaVotes(prev => {
              const newVotes = { ...prev, [targetId]: (prev[targetId] || 0) + 1 };
              const mafiaMembers = players.filter(p => !p.isEliminated && ['Haker', 'Specjalista BHP', 'Headhunter', 'Kret'].includes(p.role));
              if (newVotes[targetId] > mafiaMembers.length / 2) {
                   setTimeout(() => {
                       setPlayers(current => current.map(p => p.id === targetId ? {...p, isEliminated: true} : p));
                       setNightStep('RESULTS');
                       setTimeout(() => {
                           setReviewPhase('SUMMARY');
                           setGameState(g => ({...g, phase: 'REVIEW', round: g.round + 1, hasUsedOvertime: false})); 
                       }, 2000);
                   }, 1500);
              }
              return newVotes;
          });
      } else {
          if (nightStep === 'AUDITOR') setNightStep('GOSIA');
          else if (nightStep === 'GOSIA') setNightStep('DIRECTOR');
          else if (nightStep === 'DIRECTOR') setNightStep('MAFIA');
      }
  };

  const handleCloseSummary = () => {
    setGameState(prev => ({ ...prev, phase: 'DAY', timeRemaining: 600 }));
    setReviewPhase('IDLE');
    setMafiaVotes({});
  };

  const handleTogglePhase = () => {
      const nextPhase = gameState.phase === 'DAY' ? 'NIGHT' : 'DAY';
      setGameState(p => ({...p, phase: nextPhase}));
      if (nextPhase === 'NIGHT') setNightStep('IDLE');
  };
  
  const handleOvertimeVote = (vote: 'YES' | 'NO') => { /* Stub for now */ };

  // --- RENDER ---
  if (authError || isAuthenticating) {
      return (
          <div className="flex flex-col items-center justify-center h-[100dvh] w-full bg-slate-50 text-slate-800 p-6 text-center font-sans">
              <div className="bg-white p-8 rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full animate-in zoom-in duration-300">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-blue-100`}>
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h1 className="text-xl font-black uppercase tracking-widest text-slate-800 mb-2">
                      {isAuthenticating ? 'Łączenie z serwerem...' : 'Błąd Połączenia'}
                  </h1>
                  {!isAuthenticating && (
                    <>
                      <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4">Weryfikacja Tożsamości Nieudana</p>
                      <div className="bg-slate-100 p-3 rounded border border-slate-200 mb-4 overflow-hidden">
                          <p className="font-mono text-[10px] text-slate-600 break-words">{authError}</p>
                      </div>
                      <button onClick={handleRetryAuth} className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg uppercase text-xs tracking-widest hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                        <RefreshCw size={14} /> Spróbuj Ponownie
                      </button>
                    </>
                  )}
              </div>
          </div>
      );
  }

  if (view === 'LANDING' || view === 'LOBBY') {
    return <Lobby 
        roomCode={gameState.roomCode}
        players={players}
        isHost={isHost}
        initialRoomCode={initialRoomCode}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onStartGame={handleStartGame}
        onSimulateFullLobby={handleSimulateFullLobby}
      />;
  }

  const selfPlayer = players.find(p => p.isSelf);
  if (selfPlayer?.isEliminated) return <div className="bg-black text-red-500 h-screen flex items-center justify-center font-black text-4xl">ZWOLNIONY</div>;

  if (gameState.winner) return <div className="bg-blue-600 text-white h-screen flex items-center justify-center font-black text-4xl">{gameState.winner === 'BOARD' ? "ZWYCIĘSTWO" : "PORAŻKA"}</div>;

  return (
    <div className={`flex flex-col h-[100dvh] w-full max-w-md mx-auto relative shadow-2xl overflow-hidden font-sans transition-colors duration-500 ${gameState.phase === 'NIGHT' ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <StatusBar 
        gameState={gameState} 
        onStartReview={handleStartReview}
        onTogglePhase={handleTogglePhase}
      />
      <WarRoom 
        players={players} 
        topic={gameState.topic} 
        phase={gameState.phase}
        userRole={role}
        reviewPhase={reviewPhase}
        reviewIndex={reviewIndex}
        reviewResult={reviewResult}
        currentReward={currentReward}
        discussionTime={discussionTime}
        nightStep={nightStep}
        mafiaVotes={mafiaVotes}
        round={gameState.round}
        overtimeTimer={overtimeTimer}
        overtimeVotes={overtimeVotes}
        overtimeResult={overtimeResult}
        currentVotes={currentVotes} 
        onVote={handleVote}
        onFinishDiscussion={handleFinishDiscussion}
        onEliminatePlayer={handleEliminationVote}
        onNightAction={handleNightAction}
        onCloseSummary={handleCloseSummary}
        onOvertimeVote={handleOvertimeVote}
      />
      <PersonalPanel 
        role={role}
        task={task}
        phase={gameState.phase}
        inventory={inventory}
        onToggleTask={handleToggleTask}
      />
    </div>
  );
};

export default App;