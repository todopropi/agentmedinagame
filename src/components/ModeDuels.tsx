import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, DuelGame, HeadToHeadRecord } from '../types';
import { 
  getDuelsList, 
  createDuelGame, 
  joinDuelGame, 
  saveDuelGameUpdate, 
  getHeadToHeadRecords,
  getStoredLeaderboard,
  getAllRegisteredUsers 
} from '../firebase';
import { EscutMossosStripes } from './EscutMossosStripes';
import { ShieldRenderer } from './ShieldRenderer';
import { AudioEngine } from '../utils/audio';
import { ConceptReviewCard } from './ConceptReviewCard';
import { getDuelQuestion, DuelQuestionItem } from '../data/htmlQuestions';
import confetti from 'canvas-confetti';
import { 
  Swords, 
  Copy, 
  Check, 
  Flame, 
  Trophy, 
  RotateCw, 
  Users, 
  Plus, 
  Sparkles, 
  Shield, 
  Clock, 
  Send,
  HelpCircle,
  Eye,
  ChevronLeft,
  X,
  Bot,
  Circle,
  Search
} from 'lucide-react';

interface ModeDuelsProps {
  user: UserProfile;
  onUpdateUserStats: (xpGained: number, meritsGained: number, failedId?: string) => void;
  onSaveQuestionToggle: (questionId: string) => void;
}

interface WheelSector {
  label: string;
  topicIndex: number; // -1 for Ratlla
  color: string;
  icon: string;
  isRatlla?: boolean;
}

const WHEEL_SECTORS: WheelSector[] = [
  { label: 'Àmbit A (Història)', topicIndex: 0, color: '#F59E0B', icon: '🏛️' },
  { label: 'Àmbit B (Const.)', topicIndex: 1, color: '#06B6D4', icon: '⚖️' },
  { label: 'Àmbit C (Policia)', topicIndex: 2, color: '#2563EB', icon: '👮' },
  { label: 'Actualitat', topicIndex: 3, color: '#10B981', icon: '📰' },
  { label: 'ISPC Repte 🏆', topicIndex: 4, color: '#A855F7', icon: '🎓' },
  { label: 'Preguntes Reals', topicIndex: 5, color: '#DA291C', icon: '📝', isRatlla: true },
];

export const ModeDuels: React.FC<ModeDuelsProps> = ({
  user,
  onUpdateUserStats,
  onSaveQuestionToggle
}) => {
  const [activeGame, setActiveGame] = useState<DuelGame | null>(null);
  const [gameList, setGameList] = useState<DuelGame[]>([]);
  const [headToHead, setHeadToHead] = useState<HeadToHeadRecord[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Modals
  const [showNewMatchModal, setShowNewMatchModal] = useState(false);
  const [newRivalAlias, setNewRivalAlias] = useState('');
  const [showTurnPassedModal, setShowTurnPassedModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  // Registered & Online Users Directory State
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userFilterTab, setUserFilterTab] = useState<'all' | 'online'>('all');
  const [isChallengingUser, setIsChallengingUser] = useState<string | null>(null);

  // Wheel View State
  const [spinning, setSpinning] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Question Arena State
  const [currentQuestion, setCurrentQuestion] = useState<DuelQuestionItem | null>(null);
  const [isStripeChallenge, setIsStripeChallenge] = useState(false);
  const [selectedOptionKey, setSelectedOptionKey] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [disabledOptions, setDisabledOptions] = useState<string[]>([]);

  useEffect(() => {
    loadDuelsData();
  }, [user.uid]);

  const loadDuelsData = async () => {
    const list = await getDuelsList(user.uid);
    setGameList(list);
    const h2h = await getHeadToHeadRecords(user.uid);
    setHeadToHead(h2h);
    const users = await getAllRegisteredUsers(user.uid);
    setRegisteredUsers(users);
  };

  // Reusable Wheel Canvas Draw Routine
  const drawWheelCanvas = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 8;
    const totalSectors = WHEEL_SECTORS.length;
    const arc = (2 * Math.PI) / totalSectors;

    ctx.clearRect(0, 0, size, size);

    // Outer ring shadow/metallic border
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius + 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#eab308';
    ctx.stroke();
    ctx.restore();

    // Draw Sectors rotated by angle
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(angle);

    for (let i = 0; i < totalSectors; i++) {
      const sector = WHEEL_SECTORS[i];
      const startAngle = i * arc;
      const endAngle = startAngle + arc;

      // Slice
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.fillStyle = sector.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      // Text & Icon in Slice
      ctx.save();
      const midAngle = startAngle + arc / 2;
      ctx.rotate(midAngle);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;

      // Icon & Label text
      const displayText = `${sector.icon} ${sector.label.split(' ')[0]}`;
      ctx.fillText(displayText, radius - 18, 4);
      ctx.restore();
    }

    ctx.restore();

    // Center Hub
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#090d16';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#facc15';
    ctx.stroke();

    // Center Mini Star/Shield
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👮', center, center);
    ctx.restore();
  };

  // Redraw Wheel Canvas whenever angle, activeGame or question view changes
  useEffect(() => {
    drawWheelCanvas(wheelAngle);
  }, [wheelAngle, activeGame, currentQuestion]);

  // Handle spin wheel
  const handleSpinWheel = () => {
    if (spinning || !activeGame) return;
    AudioEngine.playClick();
    setSpinning(true);

    const isHost = activeGame.hostPlayerUid === user.uid;
    const currentStreak = (activeGame.consecutiveCorrect && activeGame.consecutiveCorrect[user.uid]) || 0;

    // Pick target sector
    // If current streak is 3 -> automatic stripe challenge!
    let targetIndex = Math.floor(Math.random() * WHEEL_SECTORS.length);
    if (currentStreak >= 3) {
      targetIndex = 5; // DESAFIAMENT RATLLA
    }

    const totalSectors = WHEEL_SECTORS.length;
    const arc = (2 * Math.PI) / totalSectors;
    const targetSectorCenter = targetIndex * arc + arc / 2;

    // Pointer is at TOP (angle -PI/2)
    // Formula: (targetSectorCenter + finalWheelAngle) mod 2PI === -PI/2 mod 2PI
    const pointerAngle = -Math.PI / 2;
    const desiredNormalizedAngle = (pointerAngle - targetSectorCenter) % (2 * Math.PI);
    const normalizedDesired = desiredNormalizedAngle < 0 ? desiredNormalizedAngle + 2 * Math.PI : desiredNormalizedAngle;

    const currentNormalized = wheelAngle % (2 * Math.PI);
    const normalizedCurrent = currentNormalized < 0 ? currentNormalized + 2 * Math.PI : currentNormalized;

    let delta = normalizedDesired - normalizedCurrent;
    if (delta < 0) delta += 2 * Math.PI;

    // Add 4-6 full spins
    const extraSpins = (4 + Math.floor(Math.random() * 2)) * 2 * Math.PI;
    const finalAngle = wheelAngle + extraSpins + delta;

    const startTime = performance.now();
    const duration = 3200; // ms
    const initialAngle = wheelAngle;
    let lastSectorTick = -1;

    const animateWheel = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentWheelAngle = initialAngle + (finalAngle - initialAngle) * ease;
      setWheelAngle(currentWheelAngle);

      // Sound ticks when passing sector boundary
      const currentSector = Math.floor((currentWheelAngle * totalSectors) / (2 * Math.PI));
      if (currentSector !== lastSectorTick) {
        lastSectorTick = currentSector;
        AudioEngine.playWheelTick();
      }

      if (progress < 1) {
        requestAnimationFrame(animateWheel);
      } else {
        setSpinning(false);
        const sector = WHEEL_SECTORS[targetIndex];
        const isStripe = sector.isRatlla || currentStreak >= 3;
        
        // Load question for target sector
        const topic = sector.topicIndex === -1 ? Math.floor(Math.random() * 5) : sector.topicIndex;
        const q = getDuelQuestion(topic);
        
        setIsStripeChallenge(isStripe);
        setCurrentQuestion(q);
        setSelectedOptionKey(null);
        setHasAnswered(false);
        setIsCorrectAnswer(false);
        setShowHint(false);
        setDisabledOptions([]);
      }
    };

    requestAnimationFrame(animateWheel);
  };

  // Answer option selection in Arena
  const handleSelectOption = async (optionKey: string) => {
    if (hasAnswered || !currentQuestion || !activeGame) return;

    const selectedOpt = currentQuestion.options.find(o => o.key === optionKey);
    const correct = Boolean(selectedOpt?.correct);

    setSelectedOptionKey(optionKey);
    setHasAnswered(true);
    setIsCorrectAnswer(correct);

    const isHost = activeGame.hostPlayerUid === user.uid;
    let myStripes = isHost ? activeGame.hostRedStripes : activeGame.guestRedStripes;
    const rivalStripes = isHost ? activeGame.guestRedStripes : activeGame.hostRedStripes;
    let myStreak = (activeGame.consecutiveCorrect && activeGame.consecutiveCorrect[user.uid]) || 0;

    if (correct) {
      AudioEngine.playCorrect();
      confetti({
        particleCount: isStripeChallenge ? 60 : 30,
        spread: 60,
        origin: { y: 0.7 }
      });
      onUpdateUserStats(50, 10);

      // If stripe challenge -> paint +1 stripe!
      if (isStripeChallenge) {
        myStripes = Math.min(4, myStripes + 1);
        myStreak = 0; // reset streak after winning stripe
      } else {
        myStreak = Math.min(3, myStreak + 1);
      }

      // Check victory condition (4 stripes)
      const isWinner = myStripes >= 4;
      const updatedGame: DuelGame = {
        ...activeGame,
        hostRedStripes: isHost ? myStripes : activeGame.hostRedStripes,
        guestRedStripes: !isHost ? myStripes : activeGame.guestRedStripes,
        consecutiveCorrect: {
          ...activeGame.consecutiveCorrect,
          [user.uid]: myStreak
        },
        status: isWinner ? 'finished' : 'active',
        winnerUid: isWinner ? user.uid : undefined,
        lastUpdated: Date.now()
      };

      if (isWinner) {
        onUpdateUserStats(300, 150);
      }

      await saveDuelGameUpdate(updatedGame);
      setActiveGame(updatedGame);
      await loadDuelsData();
    } else {
      AudioEngine.playWrong();
      onUpdateUserStats(0, 0, currentQuestion.id);

      // Failed answer -> turn goes to rival!
      myStreak = 0;
      const rivalUid = isHost ? (activeGame.guestPlayerUid || 'bot_ai') : activeGame.hostPlayerUid;

      const updatedGame: DuelGame = {
        ...activeGame,
        currentTurnUid: rivalUid,
        consecutiveCorrect: {
          ...activeGame.consecutiveCorrect,
          [user.uid]: 0
        },
        lastUpdated: Date.now()
      };

      await saveDuelGameUpdate(updatedGame);
      setActiveGame(updatedGame);
      await loadDuelsData();
    }
  };

  // Powerup: 50:50
  const handleUseFiftyFifty = () => {
    if (hasAnswered || !currentQuestion || disabledOptions.length > 0) return;
    AudioEngine.playClick();
    const wrongKeys = currentQuestion.options.filter(o => !o.correct).map(o => o.key);
    // Shuffle and pick 2 wrong keys
    const toDisable = wrongKeys.sort(() => 0.5 - Math.random()).slice(0, 2);
    setDisabledOptions(toDisable);
  };

  // Powerup: Pista IA
  const handleUseHint = () => {
    AudioEngine.playClick();
    setShowHint(true);
  };

  // Continue from question
  const handleContinueAfterQuestion = () => {
    AudioEngine.playClick();
    setCurrentQuestion(null);
    requestAnimationFrame(() => {
      drawWheelCanvas(wheelAngle);
    });

    if (!isCorrectAnswer) {
      // Failed answer -> exit arena and show turn passed modal
      setShowTurnPassedModal(true);
    }
  };

  // Start instant practice match against AI Bot
  const handleStartBotPractice = async () => {
    AudioEngine.playClick();
    const newGame = await createDuelGame(user);
    const botOpponent = {
      uid: 'bot_caporal_ia',
      displayName: 'Caporal_IA (Bot Formador)',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      equippedShieldId: 'escut_brimo'
    };
    const joined = await joinDuelGame(newGame.shareCode, {
      ...user,
      uid: botOpponent.uid,
      displayName: botOpponent.displayName,
      photoURL: botOpponent.photoURL,
      equippedShieldId: botOpponent.equippedShieldId
    } as any);

    if (joined) {
      setActiveGame(joined);
      await loadDuelsData();
    }
  };

  // Direct challenge to any registered or online user
  const handleChallengeUser = async (targetUser: UserProfile) => {
    AudioEngine.playClick();
    setIsChallengingUser(targetUser.uid);
    try {
      const newGame = await createDuelGame(user);
      const joined = await joinDuelGame(newGame.shareCode, targetUser);
      if (joined) {
        setActiveGame(joined);
        setShowNewMatchModal(false);
        await loadDuelsData();
      }
    } catch (e) {
      console.warn('Error launching challenge:', e);
    } finally {
      setIsChallengingUser(null);
    }
  };

  // Trigger Bot IA Turn execution when rival is a bot and it's their turn
  const [isBotThinking, setIsBotThinking] = useState(false);
  const isRivalBot = activeGame && (
    activeGame.currentTurnUid.startsWith('bot_') || 
    activeGame.guestPlayerUid?.startsWith('bot_') ||
    activeGame.hostPlayerUid.startsWith('bot_')
  );

  const simulateBotTurn = async () => {
    if (!activeGame || isBotThinking || activeGame.currentTurnUid === user.uid || activeGame.status !== 'active') return;
    setIsBotThinking(true);
    AudioEngine.playWheelTick();

    // Bot simulates turn with a realistic delay
    setTimeout(async () => {
      const isBotHost = activeGame.hostPlayerUid === activeGame.currentTurnUid;
      let botStripes = isBotHost ? activeGame.hostRedStripes : activeGame.guestRedStripes;
      let botStreak = (activeGame.consecutiveCorrect && activeGame.consecutiveCorrect[activeGame.currentTurnUid]) || 0;

      // Realistic bot accuracy: ~70% correct
      const botAnswersCorrectly = Math.random() < 0.70;

      if (botAnswersCorrectly) {
        botStreak += 1;
        // If streak reached 3 or lucky ratlla -> bot gets a red stripe!
        if (botStreak >= 3 || Math.random() < 0.35) {
          botStripes = Math.min(4, botStripes + 1);
          botStreak = 0;
        }

        const isBotWinner = botStripes >= 4;
        const updatedGame: DuelGame = {
          ...activeGame,
          hostRedStripes: isBotHost ? botStripes : activeGame.hostRedStripes,
          guestRedStripes: !isBotHost ? botStripes : activeGame.guestRedStripes,
          consecutiveCorrect: {
            ...activeGame.consecutiveCorrect,
            [activeGame.currentTurnUid]: botStreak
          },
          status: isBotWinner ? 'finished' : 'active',
          winnerUid: isBotWinner ? activeGame.currentTurnUid : undefined,
          // If bot missed streak, it passes turn back to player
          currentTurnUid: isBotWinner ? activeGame.currentTurnUid : user.uid,
          lastUpdated: Date.now()
        };

        await saveDuelGameUpdate(updatedGame);
        setActiveGame(updatedGame);
        await loadDuelsData();
      } else {
        // Bot fails answer -> turn immediately returns to user!
        const updatedGame: DuelGame = {
          ...activeGame,
          currentTurnUid: user.uid,
          consecutiveCorrect: {
            ...activeGame.consecutiveCorrect,
            [activeGame.currentTurnUid]: 0
          },
          lastUpdated: Date.now()
        };

        await saveDuelGameUpdate(updatedGame);
        setActiveGame(updatedGame);
        await loadDuelsData();
      }
      setIsBotThinking(false);
    }, 2400);
  };

  // Check if bot should take turn
  useEffect(() => {
    if (activeGame && activeGame.status === 'active' && activeGame.currentTurnUid !== user.uid) {
      if (activeGame.currentTurnUid.startsWith('bot_')) {
        simulateBotTurn();
      }
    }
  }, [activeGame?.currentTurnUid, activeGame?.id]);

  // Create duel with alias
  const handleCreateNewGame = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    AudioEngine.playClick();
    const newGame = await createDuelGame(user);
    setActiveGame(newGame);
    setShowNewMatchModal(false);
    setNewRivalAlias('');
    await loadDuelsData();
  };

  // Join by code
  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    AudioEngine.playClick();
    const joined = await joinDuelGame(joinCodeInput.trim(), user);
    if (joined) {
      setActiveGame(joined);
      setJoinCodeInput('');
      await loadDuelsData();
    } else {
      alert("No s'ha trobat cap partida de duel amb aquest codi.");
    }
  };

  const copyShareLink = () => {
    if (!activeGame) return;
    AudioEngine.playClick();
    navigator.clipboard.writeText(activeGame.shareCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Partition matches
  const myTurnGames = gameList.filter(g => g.status === 'active' && g.currentTurnUid === user.uid);
  const rivalTurnGames = gameList.filter(g => g.status === 'active' && g.currentTurnUid !== user.uid);
  const finishedGames = gameList.filter(g => g.status === 'finished');

  const isHost = activeGame?.hostPlayerUid === user.uid;
  const myStripes = activeGame ? (isHost ? activeGame.hostRedStripes : activeGame.guestRedStripes) : 0;
  const rivalStripes = activeGame ? (isHost ? activeGame.guestRedStripes : activeGame.hostRedStripes) : 0;
  const rivalName = activeGame ? (isHost ? (activeGame.guestPlayerName || 'Aspirant Opositor') : activeGame.hostPlayerName) : '';
  const myStreak = activeGame ? ((activeGame.consecutiveCorrect && activeGame.consecutiveCorrect[user.uid]) || 0) : 0;
  const isMyTurn = activeGame ? activeGame.currentTurnUid === user.uid : false;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
      {/* 1. Main Banner & Quick Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl">🎡</span>
              <h2 className="text-lg sm:text-2xl font-black text-white">Mode Duels 1v1 Asíncrons</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Guanya el duel completant les <b>4 Ratlles de l'Escut</b> primer! Cada encert et dóna <b>+10 Mèrits 🏅</b> per a la tenda.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                AudioEngine.playClick();
                setShowNewMatchModal(true);
              }}
              className="flex-1 sm:flex-initial py-2.5 px-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-95 transition-transform cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>NOU DUEL 1v1</span>
            </button>

            <button
              onClick={handleStartBotPractice}
              className="flex-1 sm:flex-initial py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-extrabold rounded-xl text-xs sm:text-sm border border-amber-500/30 flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer min-h-[44px]"
            >
              <Bot className="w-4 h-4 text-amber-400" />
              <span>Pràctica Bot IA</span>
            </button>
          </div>
        </div>

        {/* Join Code Quick Input */}
        <form onSubmit={handleJoinByCode} className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 max-w-md">
          <input
            type="text"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value)}
            placeholder="CODI DE SALA (Ex: 7X8K9L)"
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 uppercase font-mono"
          />
          <button
            type="submit"
            className="py-2 px-3.5 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl text-xs sm:text-sm active:scale-95 cursor-pointer min-h-[40px]"
          >
            Unir-me
          </button>
        </form>
      </div>

      {/* 2. Active Match Arena / Wheel View */}
      {activeGame && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5">
          {/* Top Bar: Return to list & Share Code */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800 flex-wrap">
            <button
              onClick={() => {
                AudioEngine.playClick();
                setActiveGame(null);
                setCurrentQuestion(null);
              }}
              className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white py-1.5 px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 cursor-pointer min-h-[36px]"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Llista de Duels</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 uppercase font-mono">
                #{activeGame.shareCode}
              </span>
              <button
                onClick={copyShareLink}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 cursor-pointer min-h-[36px]"
                title="Copiar codi de sala"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copiedCode ? 'Copiat!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Dueling Shields Comparison (EL TEU ESCUT vs RIVAL ESCUT) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 sm:p-5">
            <div className="grid grid-cols-3 items-center justify-items-center gap-2">
              {/* My Shield */}
              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 mb-2">
                  TU (EL TEU ESCUT)
                </span>
                <EscutMossosStripes 
                  stripesCount={myStripes} 
                  size={90} 
                  label={`${myStripes}/4`} 
                />
                <span className="text-xs font-black text-white mt-1.5 truncate max-w-[90px] sm:max-w-[130px]">
                  {user.displayName}
                </span>
                <span className="text-[11px] font-extrabold text-red-400">
                  {myStripes} / 4 Ratlles
                </span>
              </div>

              {/* VS Center Pillar */}
              <div className="flex flex-col items-center text-center">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-sm">
                  VS
                </div>
                <div className="mt-2 text-[10px] font-bold text-slate-400">
                  {activeGame.status === 'finished' ? (
                    <span className="text-amber-400 font-black">FINALITZAT</span>
                  ) : isMyTurn ? (
                    <span className="text-emerald-400 font-black">EL TEU TORN!</span>
                  ) : (
                    <span className="text-amber-400 font-black">TORN DEL RIVAL</span>
                  )}
                </div>
              </div>

              {/* Rival Shield */}
              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 mb-2">
                  RIVAL
                </span>
                <EscutMossosStripes 
                  stripesCount={rivalStripes} 
                  size={90} 
                  label={`${rivalStripes}/4`} 
                />
                <span className="text-xs font-black text-slate-300 mt-1.5 truncate max-w-[90px] sm:max-w-[130px]">
                  {rivalName}
                </span>
                <span className="text-[11px] font-extrabold text-red-400">
                  {rivalStripes} / 4 Ratlles
                </span>
              </div>
            </div>

            {/* Streak Dots HUD */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col items-center text-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-300">Encerts en aquest torn:</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4].map((dot) => (
                    <div 
                      key={dot}
                      className={`w-3.5 h-3.5 rounded-full border transition-all ${
                        myStreak >= dot
                          ? 'bg-amber-400 border-amber-300 shadow-md shadow-amber-500/40 scale-110'
                          : 'bg-slate-800 border-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-black text-amber-400">({myStreak}/4)</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Al 3r encert consecutiu o caient a la casella vermella de <b>Preguntes Reals</b> s'activa el repte per guanyar 1 Ratlla a l'Escut Oficial!
              </p>
            </div>
          </div>

          {/* 3. Question Arena View (Rendered when question active) */}
          {currentQuestion && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 animate-fadeIn">
              {/* Question Header */}
              <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-base">{currentQuestion.categoryIcon}</span>
                  <span className="text-xs font-black text-slate-200">{currentQuestion.categoryName}</span>
                </div>
                {isStripeChallenge && (
                  <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    PREGUNTA REAL D'EXAMEN OFICIAL (+1 RATLLA)
                  </span>
                )}
              </div>

              {/* Stripe Challenge Banner */}
              {isStripeChallenge && (
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-red-950/60 via-amber-950/40 to-red-950/60 border border-red-500/40 text-center">
                  <p className="text-xs font-black text-red-300">
                    🛡️ Pregunta Real de Convocatòria Oficial Mossos d'Esquadra! Si encertes, encendràs 1 Ratlla Vermella de l'Escut Oficial!
                  </p>
                </div>
              )}

              {/* Powerups row */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUseFiftyFifty}
                  disabled={hasAnswered || disabledOptions.length > 0}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-400 font-black rounded-lg text-xs border border-slate-700 flex items-center gap-1 cursor-pointer min-h-[34px]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>50:50</span>
                </button>

                <button
                  onClick={handleUseHint}
                  disabled={hasAnswered || showHint}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-sky-400 font-black rounded-lg text-xs border border-slate-700 flex items-center gap-1 cursor-pointer min-h-[34px]"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Pista IA</span>
                </button>

                {showHint && (
                  <div className="flex-1 p-2 rounded-lg bg-sky-950/50 border border-sky-500/30 text-[11px] text-sky-200">
                    💡 <b>Pista Medina:</b> {currentQuestion.hint}
                  </div>
                )}
              </div>

              {/* Question Text */}
              <div className="text-sm sm:text-base font-black text-white leading-relaxed">
                {currentQuestion.question}
              </div>

              {/* 4 Options */}
              <div className="space-y-2 pt-1">
                {currentQuestion.options.map((opt) => {
                  const isSelected = selectedOptionKey === opt.key;
                  const isDisabled = disabledOptions.includes(opt.key);
                  const showCorrect = hasAnswered && opt.correct;
                  const showWrong = hasAnswered && isSelected && !opt.correct;

                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectOption(opt.key)}
                      disabled={hasAnswered || isDisabled}
                      className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-3 transition-all min-h-[48px] cursor-pointer ${
                        isDisabled 
                          ? 'opacity-25 bg-slate-900 border-slate-800 cursor-not-allowed'
                          : showCorrect
                            ? 'bg-emerald-950/60 border-emerald-500 text-white ring-2 ring-emerald-500/30'
                            : showWrong
                              ? 'bg-rose-950/60 border-rose-500 text-white'
                              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200 active:scale-[0.99]'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                        showCorrect
                          ? 'bg-emerald-500 text-slate-950'
                          : showWrong
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-800 text-slate-300'
                      }`}>
                        {opt.key}
                      </span>
                      <span className="flex-1 leading-snug">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Feedback & Continue */}
              {hasAnswered && (
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className={`p-3 rounded-xl border ${
                    isCorrectAnswer 
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}>
                    <div className="font-black text-sm flex items-center gap-2">
                      <span>{isCorrectAnswer ? '✅ Resposta Correcta! (+50 XP, +10 Mèrits)' : '❌ Resposta Incorrecta!'}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>

                  {/* Quadre per memoritzar (Concept Review Card) */}
                  <ConceptReviewCard
                    titol={currentQuestion.categoryName}
                    items={[
                      {
                        concepte: `Resposta Correcta: ${currentQuestion.options.find(o => o.correct)?.text || ''}`,
                        detall: currentQuestion.explanation,
                        color: 'blue'
                      },
                      {
                        concepte: 'Pista Clau d\'Examen',
                        detall: currentQuestion.hint,
                        color: 'red'
                      },
                      {
                        concepte: 'Referència Oficial',
                        detall: 'Contingut literal de la Guia d\'estudi de les oposicions de Mossos d\'Esquadra 2026.',
                        color: 'green'
                      }
                    ]}
                    reglaExamen={currentQuestion.hint}
                    isSaved={Boolean(user.savedQuestionIds?.includes(currentQuestion.id))}
                    onSaveToggle={() => onSaveQuestionToggle(currentQuestion.id)}
                  />

                  <button
                    onClick={handleContinueAfterQuestion}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-98 cursor-pointer min-h-[48px]"
                  >
                    {isCorrectAnswer ? 'CONTINUAR JUGANT (GIRAR DE NOU) ➔' : 'ENVIAR TORN AL RIVAL 📲'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4. Roulette Wheel Arena (Keep in DOM so canvas NEVER unmounts or disappears) */}
          <div className={`flex flex-col items-center justify-center py-4 relative ${currentQuestion ? 'hidden' : 'flex'}`}>
            {/* Top Red Pointer (12 o'clock) */}
            <div className="relative z-20 -mb-3 flex flex-col items-center">
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-red-600 drop-shadow-md animate-pulse" />
            </div>

            {/* Canvas Wheel */}
            <div className="relative">
              <canvas 
                ref={canvasRef} 
                width={280} 
                height={280} 
                className="w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] select-none"
              />

              {/* Center Spin Button */}
              <button
                onClick={handleSpinWheel}
                disabled={spinning || !isMyTurn || activeGame.status === 'finished'}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-xl border-2 border-slate-950 flex flex-col items-center justify-center cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110"
              >
                <RotateCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
                <span className="text-[10px] tracking-wider mt-0.5">GIRAR</span>
              </button>
            </div>

            {/* Turn instructions */}
            <div className="mt-4 text-center">
              {!isMyTurn ? (
                <div className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center justify-center gap-2">
                  {isBotThinking ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>{rivalName} està fent girar la ruleta i pensant la resposta...</span>
                    </>
                  ) : (
                    <>
                      <span>⏳ És el torn del teu rival ({rivalName}). Rebràs el torn quan falli una resposta.</span>
                      {isRivalBot && (
                        <button
                          onClick={simulateBotTurn}
                          className="ml-2 px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded border border-amber-500/40 text-[10px] cursor-pointer"
                        >
                          Executar Torn Bot
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : activeGame.status === 'finished' ? (
                <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                  🏁 Duel completat! Enhorabona a l'opositor guanyador.
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Prem <b>GIRAR</b> per fer rodar la ruleta i respondre la pregunta de la categoria indicada!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Matches Lists Dashboard */}
      {!activeGame && (
        <div className="space-y-6">
          {/* EL TEU TORN EN EL DUEL */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>EL TEU TORN EN EL DUEL ({myTurnGames.length})</span>
              </h3>
            </div>

            {myTurnGames.length === 0 ? (
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-500 text-xs">
                No tens cap duel pendent de respondre en aquest moment. Fes clic a <b>NOU DUEL 1v1</b> o a <b>Pràctica Bot IA</b> per començar a jugar!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {myTurnGames.map((game) => {
                  const isHostP = game.hostPlayerUid === user.uid;
                  const myS = isHostP ? game.hostRedStripes : game.guestRedStripes;
                  const rivalS = isHostP ? game.guestRedStripes : game.hostRedStripes;
                  const rName = isHostP ? (game.guestPlayerName || 'Convidat') : game.hostPlayerName;

                  return (
                    <div
                      key={game.id}
                      onClick={() => {
                        AudioEngine.playClick();
                        setActiveGame(game);
                      }}
                      className="p-3.5 bg-slate-900 hover:bg-slate-850 border border-emerald-500/40 hover:border-emerald-400 rounded-2xl cursor-pointer transition-all active:scale-[0.99] shadow-lg flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl shrink-0">
                          ⚔️
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white truncate max-w-[130px]">{rName}</span>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                              EL TEU TORN
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>🛡️ {myS}/4 vs {rivalS}/4</span>
                            <span className="font-mono text-[9px] text-slate-500">#{game.shareCode}</span>
                          </div>
                        </div>
                      </div>

                      <button className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center gap-1 shrink-0">
                        <span>GIRAR</span>
                        <span>➔</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* TORN DEL RIVAL */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>TORN DEL RIVAL ({rivalTurnGames.length})</span>
            </h3>

            {rivalTurnGames.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-850 text-center text-slate-500 text-xs">
                Cap duel a l'espera del rival.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rivalTurnGames.map((game) => {
                  const isHostP = game.hostPlayerUid === user.uid;
                  const myS = isHostP ? game.hostRedStripes : game.guestRedStripes;
                  const rivalS = isHostP ? game.guestRedStripes : game.hostRedStripes;
                  const rName = isHostP ? (game.guestPlayerName || 'Convidat') : game.hostPlayerName;

                  return (
                    <div
                      key={game.id}
                      onClick={() => {
                        AudioEngine.playClick();
                        setActiveGame(game);
                      }}
                      className="p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 opacity-80"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-base">
                          ⏳
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-300 truncate max-w-[140px]">{rName}</div>
                          <div className="text-[10px] text-slate-500">🛡️ {myS}/4 vs {rivalS}/4</div>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                        Pendent Rival
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RETAR OPOSITORS (ONLINE / REGISTRATS) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                <span>RETAR OPOSITORS REGISTRATS I EN LÍNIA</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                {registeredUsers.filter(u => u.isOnline).length} en línia
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {registeredUsers.slice(0, 6).map((target) => (
                <div
                  key={target.uid}
                  className="p-3 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-between gap-2.5 transition-all shadow-md"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <img 
                        src={target.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${target.uid}`} 
                        alt={target.displayName}
                        className="w-9 h-9 rounded-full border border-slate-700 object-cover bg-slate-800"
                        referrerPolicy="no-referrer"
                      />
                      <span 
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                          target.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                        }`}
                        title={target.isOnline ? 'En línia' : 'Desconnectat'}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white truncate max-w-[110px]">{target.displayName}</span>
                        {target.isOnline && (
                          <span className="text-[8px] font-black px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                            ONLINE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {target.rank.badge} {target.rank.title}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleChallengeUser(target)}
                    disabled={isChallengingUser === target.uid}
                    className="py-1.5 px-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black rounded-xl text-xs shrink-0 active:scale-95 transition-transform flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>{isChallengingUser === target.uid ? '...' : 'Retar'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Crear Nou Duel & Direct Challenge */}
      {showNewMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>⚔️</span>
                <span>Crear Sala o Retar Opositor</span>
              </h3>
              <button 
                onClick={() => setShowNewMatchModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Pots crear una sala pública per compartir el codi, jugar contra el <b>Bot IA</b>, o retar directament qualsevol opositor registrat o en línia!
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleCreateNewGame}
                className="py-2.5 px-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black rounded-xl text-xs active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20"
              >
                <span>➕</span>
                <span>Crear Sala Oberta</span>
              </button>

              <button
                onClick={() => {
                  setShowNewMatchModal(false);
                  handleStartBotPractice();
                }}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-black rounded-xl text-xs border border-amber-500/30 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🤖</span>
                <span>Retar Bot IA</span>
              </button>
            </div>

            {/* Direct Challenge Directory */}
            <div className="border-t border-slate-800 pt-3 flex-1 overflow-hidden flex flex-col space-y-2.5 min-h-[220px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  <span>Opositors Registrats i En Línia</span>
                </span>
                
                <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[10px] font-bold">
                  <button
                    onClick={() => setUserFilterTab('all')}
                    className={`px-2 py-0.5 rounded ${userFilterTab === 'all' ? 'bg-sky-500 text-white' : 'text-slate-400'}`}
                  >
                    Tots ({registeredUsers.length})
                  </button>
                  <button
                    onClick={() => setUserFilterTab('online')}
                    className={`px-2 py-0.5 rounded flex items-center gap-1 ${userFilterTab === 'online' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>En línia ({registeredUsers.filter(u => u.isOnline).length})</span>
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="Cerca per àlies, nom o rang..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* List of registered / online users */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[240px]">
                {registeredUsers
                  .filter(u => userFilterTab === 'all' || u.isOnline)
                  .filter(u => !userSearchTerm.trim() || u.displayName.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.rank.title.toLowerCase().includes(userSearchTerm.toLowerCase()))
                  .map(target => (
                    <div 
                      key={target.uid}
                      className="p-2.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <img 
                            src={target.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${target.uid}`} 
                            alt={target.displayName}
                            className="w-8 h-8 rounded-full border border-slate-700 object-cover bg-slate-800"
                            referrerPolicy="no-referrer"
                          />
                          <span 
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                              target.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                            }`}
                            title={target.isOnline ? 'En línia' : 'Desconnectat'}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate max-w-[130px]">{target.displayName}</span>
                            {target.isOnline && (
                              <span className="text-[9px] font-black px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                                ONLINE
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {target.rank.badge} {target.rank.title} • <span className="text-amber-400 font-bold">{target.xp} XP</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleChallengeUser(target)}
                        disabled={isChallengingUser === target.uid}
                        className="py-1 px-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black rounded-lg text-[11px] shrink-0 active:scale-95 transition-transform flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Swords className="w-3 h-3" />
                        <span>{isChallengingUser === target.uid ? 'Enviant...' : 'Retar'}</span>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Torn Passat al Rival */}
      {showTurnPassedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-5 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-2xl mx-auto">
              📲
            </div>

            <div>
              <h3 className="text-base font-black text-white">Torn Finalitzat</h3>
              <p className="text-xs text-slate-400 mt-1">
                Com que has fallat la resposta, s'ha enviat el torn al teu rival! Rebràs el torn de nou quan el rival falli la seva tirada.
              </p>
            </div>

            <button
              onClick={() => {
                AudioEngine.playClick();
                setShowTurnPassedModal(false);
                setActiveGame(null);
              }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer min-h-[40px]"
            >
              Tornar a la Llista de Duels
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
