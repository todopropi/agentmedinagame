import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, DuelGame, HeadToHeadRecord } from '../types';
import { 
  getDuelsList, 
  createDuelGame, 
  joinDuelGame, 
  saveDuelGameUpdate, 
  getHeadToHeadRecords,
  getStoredLeaderboard,
  getAllRegisteredUsers,
  createDirectChallengeGame
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

export type BotDifficulty = 'agent' | 'caporal' | 'sergent' | 'aspirant';

export interface BotProfileConfig {
  id: string;
  difficulty: BotDifficulty;
  name: string;
  role: string;
  avatar: string;
  shieldId: string;
  accuracy: number; // probability 0..1
  badge: string;
  color: string;
}

export const POLICE_BOTS: Record<BotDifficulty, BotProfileConfig> = {
  agent: {
    id: 'bot_agent_ia',
    difficulty: 'agent',
    name: 'Agent (IA)',
    role: 'Nivell Agent: 45% d\'encert. Falla amb freqüència, ideal per agafar ritme i sumar ratlles.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    shieldId: 'escut_basico',
    accuracy: 0.45, // 45% encert
    badge: '👮',
    color: 'border-slate-800 hover:border-amber-500/40 text-slate-200 bg-slate-900/60'
  },
  caporal: {
    id: 'bot_caporal_ia',
    difficulty: 'caporal',
    name: 'Caporal (IA)',
    role: 'Nivell Caporal: 68% d\'encert. Domina el temari clau i aprofita els teus errors.',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    shieldId: 'escut_brimo',
    accuracy: 0.68, // 68% encert
    badge: '🔽',
    color: 'border-slate-800 hover:border-amber-500/40 text-slate-200 bg-slate-900/60'
  },
  sergent: {
    id: 'bot_sergent_ia',
    difficulty: 'sergent',
    name: 'Sergent (IA)',
    role: 'Nivell Sergent: 85% d\'encert. Rigor absolut: molt poques errades per forçar el màxim nivell.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    shieldId: 'escut_gei',
    accuracy: 0.85, // 85% encert
    badge: '🎖️',
    color: 'border-slate-800 hover:border-amber-500/40 text-slate-200 bg-slate-900/60'
  },
  aspirant: {
    id: 'bot_agent_ia',
    difficulty: 'agent',
    name: 'Agent (IA)',
    role: 'Nivell Agent: 45% d\'encert.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    shieldId: 'escut_basico',
    accuracy: 0.45,
    badge: '👮',
    color: 'border-slate-800 hover:border-amber-500/40 text-slate-200 bg-slate-900/60'
  }
};

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
  const [showBotDifficultyModal, setShowBotDifficultyModal] = useState(false);
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
  const [disabledOptions, setDisabledOptions] = useState<string[]>([]);
  const [botActionNotification, setBotActionNotification] = useState<{
    text: string;
    type: 'stripe' | 'correct' | 'wrong';
  } | null>(null);

  useEffect(() => {
    loadDuelsData();
    const interval = setInterval(() => {
      loadDuelsData();
    }, 4000);
    return () => clearInterval(interval);
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
      // Recompensa per encert en duel: +20 XP, +2 Mèrits (combo +1 extra si ratxa >= 2)
      const meritsPerAnswer = myStreak >= 1 ? 3 : 2;
      onUpdateUserStats(20, meritsPerAnswer);

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
        // Bonificació victòria ponderada per dificultat (Agent 45%: +15, Caporal 68%: +25, Sergent 85%: +45)
        let victoryMerits = 30;
        let victoryXp = 250;
        if (isRivalBot) {
          if (currentBotProfile.difficulty === 'agent' || currentBotProfile.difficulty === 'aspirant') {
            victoryMerits = 15;
            victoryXp = 100;
          } else if (currentBotProfile.difficulty === 'caporal') {
            victoryMerits = 25;
            victoryXp = 200;
          } else if (currentBotProfile.difficulty === 'sergent') {
            victoryMerits = 45;
            victoryXp = 350;
          }
        }
        onUpdateUserStats(victoryXp, victoryMerits);
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

  // Start instant practice match against AI Bot with selected difficulty
  const handleStartBotPractice = async (difficulty: BotDifficulty = 'agent') => {
    AudioEngine.playClick();
    setShowBotDifficultyModal(false);
    setShowNewMatchModal(false);

    const bot = POLICE_BOTS[difficulty] || POLICE_BOTS.agent;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const gameId = 'duel_bot_' + Date.now() + '_' + code;

    const botGame: DuelGame = {
      id: gameId,
      hostPlayerUid: user.uid,
      hostPlayerName: user.displayName,
      hostPlayerAvatar: user.photoURL,
      hostPlayerShieldId: user.equippedShieldId,
      guestPlayerUid: bot.id,
      guestPlayerName: bot.name,
      guestPlayerAvatar: bot.avatar,
      guestPlayerShieldId: bot.shieldId,
      hostRedStripes: 0,
      guestRedStripes: 0,
      currentTurnUid: user.uid,
      status: 'active',
      consecutiveCorrect: { [user.uid]: 0, [bot.id]: 0 },
      lastUpdated: Date.now(),
      shareCode: code,
      botDifficulty: bot.difficulty,
      botAccuracy: bot.accuracy,
    };

    // Immediatament activar la partida perquè l'arena s'obri a l'instant
    setActiveGame(botGame);

    // Guardar a storage local i sincronitzar
    try {
      await saveDuelGameUpdate(botGame);
      await loadDuelsData();
    } catch (e) {
      console.warn('Bot game persistence warning:', e);
    }
  };

  // Direct challenge to any registered or online user
  const handleChallengeUser = async (targetUser: UserProfile) => {
    AudioEngine.playClick();
    setIsChallengingUser(targetUser.uid);
    try {
      const challengeGame = await createDirectChallengeGame(user, targetUser);
      setActiveGame(challengeGame);
      setShowNewMatchModal(false);
      await loadDuelsData();
    } catch (e) {
      console.warn('Error launching challenge:', e);
    } finally {
      setIsChallengingUser(null);
    }
  };

  // Trigger Bot IA Turn execution when rival is a bot and it's their turn
  const [isBotThinking, setIsBotThinking] = useState(false);
  const botTurnTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isRivalBot = Boolean(
    activeGame && (
      activeGame.currentTurnUid.startsWith('bot_') || 
      activeGame.guestPlayerUid?.startsWith('bot_') ||
      activeGame.hostPlayerUid.startsWith('bot_')
    )
  );

  // Determine which bot is playing to fetch its accurate accuracy
  const currentBotProfile = (() => {
    if (!activeGame) return POLICE_BOTS.agent;
    if (activeGame.botDifficulty && POLICE_BOTS[activeGame.botDifficulty]) {
      return POLICE_BOTS[activeGame.botDifficulty];
    }
    const botUid = activeGame.guestPlayerUid?.startsWith('bot_') 
      ? activeGame.guestPlayerUid 
      : activeGame.hostPlayerUid.startsWith('bot_') 
        ? activeGame.hostPlayerUid 
        : activeGame.currentTurnUid;
    
    if (botUid.includes('sergent')) return POLICE_BOTS.sergent;
    if (botUid.includes('caporal')) return POLICE_BOTS.caporal;
    return POLICE_BOTS.agent;
  })();

  const simulateBotTurn = () => {
    if (!activeGame || isBotThinking || activeGame.currentTurnUid === user.uid || activeGame.status !== 'active' || currentQuestion !== null) return;
    setIsBotThinking(true);
    AudioEngine.playWheelTick();

    if (botTurnTimeoutRef.current) {
      clearTimeout(botTurnTimeoutRef.current);
    }

    // Bot simulates turn completely locally without any external dependencies
    botTurnTimeoutRef.current = setTimeout(async () => {
      try {
        const isBotHost = activeGame.hostPlayerUid === activeGame.currentTurnUid;
        let botStripes = isBotHost ? activeGame.hostRedStripes : activeGame.guestRedStripes;
        let botStreak = (activeGame.consecutiveCorrect && activeGame.consecutiveCorrect[activeGame.currentTurnUid]) || 0;

        // Dynamic accuracy based on police difficulty level (Agent 45%, Caporal 68%, Sergent 85%)
        const accuracy = currentBotProfile.accuracy;
        const botAnswersCorrectly = Math.random() < accuracy;

        if (botAnswersCorrectly) {
          botStreak += 1;
          // Bot wins a stripe on 3 consecutive hits OR on a stripe challenge (50% chance per correct answer)
          const earnedStripe = botStreak >= 3 || Math.random() < 0.50;
          if (earnedStripe) {
            botStripes = Math.min(4, botStripes + 1);
            botStreak = 0;
            AudioEngine.playCorrect();
            setBotActionNotification({
              text: `👮 ${currentBotProfile.name} ha encertat la pregunta i ha guanyat +1 Ratlla a l'Escut! (${botStripes}/4)`,
              type: 'stripe'
            });
          } else {
            AudioEngine.playClick();
            setBotActionNotification({
              text: `👮 ${currentBotProfile.name} ha encertat la pregunta! (${botStreak}/3 encerts)`,
              type: 'correct'
            });
          }

          const isBotWinner = botStripes >= 4;
          if (isBotWinner) {
            AudioEngine.playCorrect();
            setBotActionNotification({
              text: `🏆 ${currentBotProfile.name} ha assolit les 4 Ratlles de l'Escut Oficial i ha guanyat el duel!`,
              type: 'stripe'
            });
          }

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
            // If bot completed its turn or won, give turn back to user if game active
            currentTurnUid: isBotWinner ? activeGame.currentTurnUid : user.uid,
            lastUpdated: Date.now()
          };

          await saveDuelGameUpdate(updatedGame);
          setActiveGame(updatedGame);
          await loadDuelsData();
        } else {
          // Bot fails answer -> turn immediately returns to user!
          AudioEngine.playWrong();
          setBotActionNotification({
            text: `❌ ${currentBotProfile.name} ha fallat la seva pregunta! El torn torna a ser teu.`,
            type: 'wrong'
          });

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
      } catch (err) {
        console.warn('Bot turn local fallback handled:', err);
      } finally {
        setIsBotThinking(false);
      }
    }, 1700);
  };

  useEffect(() => {
    return () => {
      if (botTurnTimeoutRef.current) {
        clearTimeout(botTurnTimeoutRef.current);
      }
    };
  }, []);

  // Check if bot should take turn (only when no question modal is covering the screen)
  useEffect(() => {
    if (activeGame && activeGame.status === 'active' && activeGame.currentTurnUid !== user.uid && currentQuestion === null) {
      if (activeGame.currentTurnUid.startsWith('bot_')) {
        simulateBotTurn();
      }
    }
  }, [activeGame?.currentTurnUid, activeGame?.id, currentQuestion]);

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
              onClick={() => {
                AudioEngine.playClick();
                setShowBotDifficultyModal(true);
              }}
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

          {/* Mode Rules Banner (Agent 45%, Caporal 68%, Sergent 85%) */}
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-black">⚙️ Regla de Mode:</span>
              {isRivalBot ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-black text-xs">
                    {currentBotProfile.badge} {currentBotProfile.name} • {(currentBotProfile.accuracy * 100).toFixed(0)}% d'encert
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    ({currentBotProfile.role})
                  </span>
                </div>
              ) : (
                <span className="text-sky-400 font-black text-xs">
                  ⚔️ Duel 1v1 en línia • 4 Ratlles per guanyar
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
              <span className="text-amber-400">Recompensa Victòria:</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-black">
                +{isRivalBot 
                  ? (currentBotProfile.difficulty === 'sergent' ? '45' : currentBotProfile.difficulty === 'caporal' ? '25' : '15') 
                  : '30'} Mèrits
              </span>
            </div>
          </div>

          {/* Bot Action Notification Banner */}
          {botActionNotification && (
            <div className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-bold animate-fadeIn shadow-lg ${
              botActionNotification.type === 'stripe'
                ? 'bg-amber-950/70 border-amber-500/50 text-amber-200'
                : botActionNotification.type === 'correct'
                ? 'bg-sky-950/70 border-sky-500/50 text-sky-200'
                : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <Bot className="w-5 h-5 shrink-0 text-amber-400" />
                <span>{botActionNotification.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setBotActionNotification(null)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 text-xs cursor-pointer shrink-0"
              >
                ✕ Tanca
              </button>
            </div>
          )}

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
                <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-sm shadow-inner">
                  VS
                </div>
                <div className="mt-2 text-[10px] font-extrabold tracking-wide">
                  {activeGame.status === 'finished' ? (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-amber-500/40">FINALITZAT</span>
                  ) : isMyTurn ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      ET TOCA JUGAR
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      ESPERANT QUE JUGUI EL TEU RIVAL
                    </span>
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

              {/* Powerups row (50:50) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUseFiftyFifty}
                  disabled={hasAnswered || disabledOptions.length > 0}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-400 font-black rounded-lg text-xs border border-slate-700 flex items-center gap-1 cursor-pointer min-h-[34px]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Comodí 50:50</span>
                </button>
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
                  <div className={`p-4 rounded-2xl border ${
                    isCorrectAnswer 
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}>
                    <div className="font-black text-sm flex items-center justify-between gap-2">
                      <span>{isCorrectAnswer ? '✅ Resposta Correcta! (+50 XP, +10 Mèrits)' : '❌ Resposta Incorrecta!'}</span>
                      <button
                        type="button"
                        onClick={() => onSaveQuestionToggle(currentQuestion.id)}
                        className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {user.savedQuestionIds?.includes(currentQuestion.id) ? '⭐ Guardada' : '☆ Guardar'}
                      </button>
                    </div>
                    <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 text-xs text-slate-300 leading-relaxed space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-sky-400 flex items-center gap-1.5">
                          <span>📖 Cita Literal Guia d'Estudi Mossos d'Esquadra 2026:</span>
                        </span>
                        {currentQuestion.guiaPagina && (
                          <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 font-mono text-[11px] font-extrabold border border-sky-800/80 shadow-sm">
                            {currentQuestion.guiaPagina}
                          </span>
                        )}
                      </div>
                      <p className="italic text-slate-200 pl-3 border-l-2 border-sky-500/60 leading-relaxed bg-slate-900/50 p-2.5 rounded-r-xl">
                        "{currentQuestion.textLiteral || currentQuestion.explanation}"
                      </p>
                    </div>
                  </div>

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
                <span>ET TOCA JUGAR ({myTurnGames.length})</span>
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
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Et toca jugar
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
              <span>ESPERANT QUE JUGUI EL TEU RIVAL ({rivalTurnGames.length})</span>
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
                        Esperant que jugui el teu rival
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RETAR OPOSITORS (ONLINE / REGISTRATS) */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                <span>RETAR OPOSITORS (EN LÍNIA I REGISTRATS)</span>
              </h3>
              
              <div className="flex items-center bg-slate-950 rounded-xl p-0.5 border border-slate-800 text-[11px] font-bold">
                <button
                  onClick={() => setUserFilterTab('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    userFilterTab === 'all' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tots els registrats ({registeredUsers.length})
                </button>
                <button
                  onClick={() => setUserFilterTab('online')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    userFilterTab === 'online' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Connectats en temps real ({registeredUsers.filter(u => u.isOnline).length})</span>
                </button>
              </div>
            </div>

            {registeredUsers.filter(u => userFilterTab === 'all' || u.isOnline).length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-xs">
                No hi ha cap altre opositor en línia ara mateix. Pots retar els usuaris registrats de forma asíncrona canviant a "Tots els registrats" o crear una sala amb codi!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {registeredUsers
                  .filter(u => userFilterTab === 'all' || u.isOnline)
                  .slice(0, 9)
                  .map((target) => (
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
            )}
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

            {/* Quick Action: Crear Sala */}
            <div className="pt-1">
              <button
                onClick={handleCreateNewGame}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black rounded-xl text-xs active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20"
              >
                <span>➕</span>
                <span>Crear Sala Oberta (amb Codi Compartit)</span>
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

      {/* MODAL: Tria la dificultat del Bot IA (Exacte com la imatge de l'usuari) */}
      {showBotDifficultyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b1120] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            {/* Header with Bot Icon, Title, and Close Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="text-amber-400 text-xl">
                  🤖
                </div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  Tria la dificultat del Bot IA
                </h3>
              </div>
              <button
                onClick={() => setShowBotDifficultyModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800/60 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explanatory text */}
            <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed">
              El bot funciona <strong className="text-white font-black">íntegrament dins del joc</strong>, sense connexions externes: la partida s'obre a l'instant i mai es queda carregant.
            </p>

            {/* Difficulty Cards */}
            <div className="space-y-3 pt-1">
              {/* 1. Agent */}
              <div
                onClick={() => {
                  setShowBotDifficultyModal(false);
                  handleStartBotPractice('agent');
                }}
                className="p-4 rounded-2xl bg-[#0e172a] hover:bg-[#131f38] border border-slate-850 hover:border-amber-500/40 cursor-pointer transition-all flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                    👮
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white">Agent</span>
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        45% encert
                      </span>
                      <span className="text-[10px] font-bold text-amber-300">
                        +15 Mèrits
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-snug">
                      Nivell Agent: 45% d'encert. Falla sovint: ideal per consolidar les primeres ratlles i agafar ritme.
                    </p>
                  </div>
                </div>

                <div className="text-amber-400 text-lg shrink-0 group-hover:translate-x-0.5 transition-transform">
                  ⚔️
                </div>
              </div>

              {/* 2. Caporal */}
              <div
                onClick={() => {
                  setShowBotDifficultyModal(false);
                  handleStartBotPractice('caporal');
                }}
                className="p-4 rounded-2xl bg-[#0e172a] hover:bg-[#131f38] border border-slate-850 hover:border-amber-500/40 cursor-pointer transition-all flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                    🔽
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white">Caporal</span>
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        68% encert
                      </span>
                      <span className="text-[10px] font-bold text-amber-300">
                        +25 Mèrits
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-snug">
                      Nivell Caporal: 68% d'encert. Domina el temari bàsic i aprofita els teus errors per avançar.
                    </p>
                  </div>
                </div>

                <div className="text-amber-400 text-lg shrink-0 group-hover:translate-x-0.5 transition-transform">
                  ⚔️
                </div>
              </div>

              {/* 3. Sergent */}
              <div
                onClick={() => {
                  setShowBotDifficultyModal(false);
                  handleStartBotPractice('sergent');
                }}
                className="p-4 rounded-2xl bg-[#0e172a] hover:bg-[#131f38] border border-slate-850 hover:border-amber-500/40 cursor-pointer transition-all flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                    🎖️
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white">Sergent</span>
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        85% encert
                      </span>
                      <span className="text-[10px] font-bold text-amber-300">
                        +45 Mèrits
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-snug">
                      Nivell Sergent: 85% d'encert. Molt poques errades: màxima precisió per aspirar al podi.
                    </p>
                  </div>
                </div>

                <div className="text-amber-400 text-lg shrink-0 group-hover:translate-x-0.5 transition-transform">
                  ⚔️
                </div>
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
