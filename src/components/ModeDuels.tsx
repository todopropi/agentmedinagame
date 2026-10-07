import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserProfile, DuelGame, HeadToHeadRecord, FinishedDuelResult } from '../types';
import { 
  getDuelsList, 
  createDuelGame, 
  joinDuelGame, 
  saveDuelGameUpdate, 
  getHeadToHeadRecords,
  getStoredLeaderboard,
  getAllRegisteredUsers,
  createDirectChallengeGame,
  deleteLocalDuelGame
} from '../firebase';
import { 
  fetchProfilesForChallenges, 
  createMatchInSupabase, 
  updateMatchTurnInSupabase,
  fetchUserMatches,
  forfeitMatchInSupabase,
  syncSupabaseProfile,
  deleteMatchInSupabase,
  fetchFinishedMatchesHistory,
  supabase
} from '../../supabase';
import { calculateRank } from '../data/ranks';
import { EscutMossosStripes } from './EscutMossosStripes';
import { ShieldRenderer } from './ShieldRenderer';
import { SPECIALIZED_SHIELDS } from '../data/badges';
import { AudioEngine } from '../utils/audio';
import { ConceptReviewCard } from './ConceptReviewCard';
import { getDuelQuestion, DuelQuestionItem } from '../data/htmlQuestions';
import { triggerTurnPushNotification, triggerDefeatRevengeNotification } from '../utils/pushNotifications';
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
  ChevronDown,
  ChevronUp,
  X,
  Bot,
  Circle,
  Search,
  Flag,
  Trash2,
  RefreshCw,
  Calendar,
  Zap,
  AlertTriangle
} from 'lucide-react';

interface ModeDuelsProps {
  user: UserProfile;
  onUpdateUserStats: (
    xpGained: number, 
    meritsGained: number, 
    failedId?: string, 
    savedId?: string,
    answeredId?: string,
    isCorrect?: boolean
  ) => void;
  onSaveQuestionToggle: (questionId: string) => void;
  onUpdateWildcards?: (delta: number) => void;
  initialMatchId?: string | null;
  onClearInitialMatchId?: () => void;
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
  onSaveQuestionToggle,
  onUpdateWildcards,
  initialMatchId,
  onClearInitialMatchId
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
  const [inactivityVictoryAlert, setInactivityVictoryAlert] = useState<string | null>(null);

  // Registered & Online Users Directory State
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userFilterTab, setUserFilterTab] = useState<'all' | 'fast' | 'online'>('all');
  const [isChallengingUser, setIsChallengingUser] = useState<string | null>(null);

  // Wheel View State
  const [spinning, setSpinning] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wheelContainerRef = useRef<HTMLDivElement | null>(null);
  const questionContainerRef = useRef<HTMLDivElement | null>(null);
  const activeArenaRef = useRef<HTMLDivElement | null>(null);

  // Question Arena State
  const [currentQuestion, setCurrentQuestion] = useState<DuelQuestionItem | null>(null);
  const [isStripeChallenge, setIsStripeChallenge] = useState(false);
  const [selectedOptionKey, setSelectedOptionKey] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const [disabledOptions, setDisabledOptions] = useState<string[]>([]);
  const [fcmPushAlert, setFcmPushAlert] = useState<string | null>(null);
  const [botActionNotification, setBotActionNotification] = useState<{
    text: string;
    type: 'stripe' | 'correct' | 'wrong';
  } | null>(null);

  // Auto-scroll suau cap a la targeta de pregunta en carregar-se
  useEffect(() => {
    if (currentQuestion && questionContainerRef.current) {
      setTimeout(() => {
        questionContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    }
  }, [currentQuestion?.id]);

  // Auto-scroll en entrar a un duel
  useEffect(() => {
    if (activeGame && activeArenaRef.current) {
      setTimeout(() => {
        activeArenaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }, [activeGame?.id]);

  // Auto-seleccionar partida inicial quan es passa des de la notificació gran de torn
  useEffect(() => {
    if (initialMatchId && gameList.length > 0) {
      const match = gameList.find(g => g.id === initialMatchId || g.shareCode.toUpperCase() === initialMatchId.toUpperCase());
      if (match) {
        setActiveGame(match);
        if (onClearInitialMatchId) onClearInitialMatchId();
      }
    }
  }, [initialMatchId, gameList, onClearInitialMatchId]);

  // Sub-pestanyes de duels: 'my_duels', 'h2h' (Cara a Cara) o 'history' (Resultats Individuals Supabase)
  const [activeDuelTab, setActiveDuelTab] = useState<'my_duels' | 'h2h' | 'history'>('my_duels');
  const [h2hFilter, setH2hFilter] = useState<'mine' | 'all'>('mine');
  const [h2hSearchTerm, setH2hSearchTerm] = useState('');
  const [expandedH2hPairKey, setExpandedH2hPairKey] = useState<string | null>(null);
  const [finishedHistory, setFinishedHistory] = useState<FinishedDuelResult[]>([]);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadHistoryData = async () => {
    setIsLoadingHistory(true);
    try {
      const hist = await fetchFinishedMatchesHistory(40);
      if (Array.isArray(hist)) {
        setFinishedHistory(hist);
      }
    } catch (e) {
      console.warn('Error carregant l\'historial de duels des de Supabase:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadDuelsData();
    const interval = setInterval(() => {
      loadDuelsData();
    }, 4000);
    return () => clearInterval(interval);
  }, [user.uid]);

  const loadDuelsData = async () => {
    const [list, h2h, users, supabaseProfiles, supabaseMatches, historyResults] = await Promise.all([
      getDuelsList(user.uid),
      getHeadToHeadRecords(user.uid),
      getAllRegisteredUsers(user.uid),
      fetchProfilesForChallenges(user.uid),
      fetchUserMatches(user.uid),
      fetchFinishedMatchesHistory(40)
    ]);
    setHeadToHead(h2h);
    if (Array.isArray(historyResults)) {
      setFinishedHistory(historyResults);
    }

    const userMap = new Map<string, UserProfile>();
    if (Array.isArray(users)) {
      for (const u of users) {
        if (!u || u.uid === user.uid) continue;
        userMap.set(u.uid, u);
      }
    }
    if (Array.isArray(supabaseProfiles)) {
      for (const sp of supabaseProfiles) {
        if (!sp || sp.id === user.uid) continue;
        const existing = userMap.get(sp.id);
        const resolvedName = 
          (sp.username && sp.username !== 'Aspirant' && sp.username !== 'Aspirant Medina' ? sp.username : null) ||
          (existing?.displayName && existing.displayName !== 'Aspirant' && existing.displayName !== 'Aspirant Medina' ? existing.displayName : null) ||
          sp.username || existing?.displayName || 'Aspirant';

        userMap.set(sp.id, {
          uid: sp.id,
          displayName: resolvedName,
          email: sp.email || existing?.email || '',
          xp: Math.max(sp.total_points || 0, existing?.xp || 0),
          merits: Math.max(Math.floor((sp.total_points || 0) / 10), existing?.merits || 0),
          rank: calculateRank(Math.max(sp.total_points || 0, existing?.xp || 0)),
          equippedShieldId: (sp.avatar_url && !sp.avatar_url.startsWith('http') && sp.avatar_url !== 'escut_basico' ? sp.avatar_url : (existing?.equippedShieldId || 'generic_pvc')),
          unlockedShieldIds: ['generic_pvc'],
          failedQuestionIds: [],
          savedQuestionIds: [],
          photoURL: sp.avatar_url || existing?.photoURL,
          lastLogin: existing?.lastLogin || (sp.updated_at ? new Date(sp.updated_at).getTime() : undefined),
          lastActive: existing?.lastActive || existing?.lastLogin || (sp.updated_at ? new Date(sp.updated_at).getTime() : undefined),
          isOnline: Boolean(existing?.isOnline && (Date.now() - (existing.lastActive || existing.lastLogin || 0) < 5 * 60 * 1000))
        });
      }
    }
    const now = Date.now();
    const activeUsersList = Array.from(userMap.values()).filter(u => {
      if (u.isAdmin || u.isUnlimited || u.subscriptionStatus === 'unlimited') return true;
      if (u.subscriptionStatus === 'expired') return false;
      if (u.subscriptionExpiresAt) {
        const exp = new Date(u.subscriptionExpiresAt).getTime();
        if (exp <= now) return false;
      }
      return true;
    });

    setRegisteredUsers(activeUsersList);

    // Merge games: local/Firebase + Supabase matches
    const gamesMap = new Map<string, DuelGame>();
    list.forEach(g => {
      // Filtrar partides fantasma de l'Oca o configuració guardades per error com a duels
      if (g && g.id && !g.id.startsWith('oca_progress_') && !g.id.startsWith('user_data_') && !g.id.startsWith('system_')) {
        gamesMap.set(g.id, g);
      }
    });

    if (Array.isArray(supabaseMatches) && supabaseMatches.length > 0) {
      console.log(`[ModeDuels] S'han obtingut ${supabaseMatches.length} partides des de Supabase:`, supabaseMatches);
      for (const m of supabaseMatches) {
        if (!m || !m.id) continue;
        const matchId = String(m.id);
        // Filtrar partides fantasma de Supabase
        if (matchId.startsWith('oca_progress_') || matchId.startsWith('user_data_') || matchId.startsWith('system_')) {
          continue;
        }
        if (m.player2_id && String(m.player2_id).startsWith('oca_')) {
          continue;
        }

        const hostProfile = userMap.get(m.player1_id);
        const guestProfile = userMap.get(m.player2_id);
        const hostName = hostProfile?.displayName || 
          (m.player1_id === user.uid ? (user.displayName || 'Aspirant') : (m.state?.hostPlayerName || 'Aspirant'));
        const guestName = guestProfile?.displayName || 
          (m.player2_id === user.uid ? (user.displayName || 'Aspirant') : (m.state?.guestPlayerName || 'Oponent'));

        const existing = gamesMap.get(matchId);
        if (existing) {
          existing.currentTurnUid = m.current_turn || existing.currentTurnUid;
          existing.status = m.status === 'finished' ? 'finished' : 'active';
          if (typeof m.score_p1 === 'number') existing.hostRedStripes = m.score_p1;
          if (typeof m.state?.score_p2 === 'number') existing.guestRedStripes = m.state.score_p2;
          if (m.updated_at) existing.lastUpdated = new Date(m.updated_at).getTime();
        } else {
          // Comprovar si ja tenim una partida en gamesMap amb aquests mateixos dos jugadors actius
          let duplicateMatchId: string | null = null;
          if (m.status !== 'finished') {
            for (const [existingId, g] of gamesMap.entries()) {
              const sameOpponents = 
                (g.hostPlayerUid === m.player1_id && g.guestPlayerUid === m.player2_id) ||
                (g.hostPlayerUid === m.player2_id && g.guestPlayerUid === m.player1_id);
              if (sameOpponents && g.status === 'active') {
                duplicateMatchId = existingId;
                break;
              }
            }
          }

          if (duplicateMatchId) {
            const existingG = gamesMap.get(duplicateMatchId)!;
            if (m.current_turn) existingG.currentTurnUid = m.current_turn;
            if (typeof m.score_p1 === 'number') existingG.hostRedStripes = Math.max(existingG.hostRedStripes, m.score_p1);
            if (typeof m.state?.score_p2 === 'number') existingG.guestRedStripes = Math.max(existingG.guestRedStripes, m.state.score_p2);
          } else {
            gamesMap.set(matchId, {
              id: matchId,
              hostPlayerUid: m.player1_id,
              hostPlayerName: hostName,
              hostPlayerAvatar: hostProfile?.photoURL,
              hostPlayerShieldId: m.state?.hostPlayerShieldId || 'escut_basico',
              hostRedStripes: typeof m.score_p1 === 'number' ? m.score_p1 : 0,
              guestPlayerUid: m.player2_id,
              guestPlayerName: guestName,
              guestPlayerAvatar: guestProfile?.photoURL,
              guestPlayerShieldId: m.state?.guestPlayerShieldId || 'escut_basico',
              guestRedStripes: typeof m.state?.score_p2 === 'number' ? m.state.score_p2 : 0,
              currentTurnUid: m.current_turn || m.player1_id,
              status: m.status === 'finished' ? 'finished' : 'active',
              consecutiveCorrect: m.state?.consecutiveCorrect || { [m.player1_id]: 0, [m.player2_id]: 0 },
              lastUpdated: m.updated_at ? new Date(m.updated_at).getTime() : Date.now(),
              shareCode: m.state?.shareCode || matchId.substring(0, 6).toUpperCase()
            });
          }
        }
      }
    }

    // Filtrar i netejar qualsevol duplicat actiu restant entre els mateixos opositors
    const activePairSeen = new Set<string>();
    const cleanedGames: DuelGame[] = [];
    const duplicatesToRemove: string[] = [];

    const sortedAll = Array.from(gamesMap.values()).sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
    for (const g of sortedAll) {
      if (g.status === 'active' && g.guestPlayerUid) {
        const pairKey = [g.hostPlayerUid, g.guestPlayerUid].sort().join('_vs_');
        if (activePairSeen.has(pairKey)) {
          duplicatesToRemove.push(g.id);
          continue;
        }
        activePairSeen.add(pairKey);
      }
      cleanedGames.push(g);
    }

    if (duplicatesToRemove.length > 0) {
      duplicatesToRemove.forEach(dupId => deleteLocalDuelGame(dupId, user.uid));
    }

    setGameList(cleanedGames);

    // Keep activeGame synchronized if its state changed in Supabase
    setActiveGame(prev => {
      if (!prev) return null;
      const live = gamesMap.get(prev.id);
      if (live && (
        live.currentTurnUid !== prev.currentTurnUid || 
        live.status !== prev.status || 
        live.hostRedStripes !== prev.hostRedStripes || 
        live.guestRedStripes !== prev.guestRedStripes
      )) {
        return {
          ...prev,
          currentTurnUid: live.currentTurnUid,
          status: live.status,
          hostRedStripes: live.hostRedStripes,
          guestRedStripes: live.guestRedStripes,
          lastUpdated: live.lastUpdated
        };
      }
      return prev;
    });
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
    if (activeGame && !currentQuestion) {
      const timer = setTimeout(() => {
        wheelContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [wheelAngle, activeGame?.id, currentQuestion]);

  // Handle spin wheel
  const handleSpinWheel = () => {
    if (spinning || !activeGame) return;
    AudioEngine.playClick();
    setSpinning(true);

    // Auto-centrar la ruleta a la pantalla del mòbil
    setTimeout(() => {
      wheelContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 40);

    const isHost = activeGame.hostPlayerUid === user.uid;
    const currentStreak = (activeGame.consecutiveCorrect && activeGame.consecutiveCorrect[user.uid]) || 0;

    // Pick target sector aleatòriament
    // Si la ratxa és >= 3, donem una probabilitat moderada (35%) de Desafiament Ratlla (sector 5) però mantenim varietat aleatòria
    let targetIndex = Math.floor(Math.random() * WHEEL_SECTORS.length);
    if (currentStreak >= 3) {
      if (Math.random() < 0.35) {
        targetIndex = 5; // DESAFIAMENT RATLLA (Preguntes Reals d'Examen)
      } else {
        // Selecció aleatòria entre els altres sectors per no ser sempre previsible
        const otherSectors = [0, 1, 2, 3, 4];
        targetIndex = otherSectors[Math.floor(Math.random() * otherSectors.length)];
      }
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
        const q = getDuelQuestion(topic, {
          answeredQuestionIds: user.answeredQuestionIds,
          failedQuestionIds: user.failedQuestionIds,
          questionMistakesCount: user.questionMistakesCount
        });
        
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
      onUpdateUserStats(20, meritsPerAnswer, undefined, undefined, currentQuestion.id, true);

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

      updateMatchTurnInSupabase({
        matchId: activeGame.id,
        currentTurn: activeGame.currentTurnUid,
        scoreP1: isHost ? myStripes : activeGame.hostRedStripes,
        state: {
          score_p2: !isHost ? myStripes : activeGame.guestRedStripes,
          consecutiveCorrect: activeGame.consecutiveCorrect,
          winnerUid: isWinner ? user.uid : undefined,
          winnerName: isWinner ? user.displayName : undefined,
          hostPlayerName: activeGame.hostPlayerName,
          guestPlayerName: activeGame.guestPlayerName,
          hostPlayerAvatar: activeGame.hostPlayerAvatar,
          guestPlayerAvatar: activeGame.guestPlayerAvatar
        },
        status: isWinner ? 'finished' : 'active'
      });

      if (isWinner) {
        const rivalUid = isHost ? (activeGame.guestPlayerUid || '') : activeGame.hostPlayerUid;
        if (rivalUid && !rivalUid.startsWith('bot_')) {
          triggerDefeatRevengeNotification({
            matchId: activeGame.id,
            senderUid: user.uid,
            senderName: user.displayName,
            targetUid: rivalUid
          }).catch(console.warn);
        }
      }
      await saveDuelGameUpdate(updatedGame);
      setActiveGame(updatedGame);
      await loadDuelsData();
    } else {
      AudioEngine.playWrong();
      onUpdateUserStats(0, 0, currentQuestion.id, undefined, currentQuestion.id, false);

      // Failed answer -> turn goes to rival!
      myStreak = 0;
      const rivalUid = isHost ? (activeGame.guestPlayerUid || 'bot_ai') : activeGame.hostPlayerUid;
      const targetRivalName = isHost ? (activeGame.guestPlayerName || 'Rival') : activeGame.hostPlayerName;

      // Disparador d'esdeveniment: ÚNICA notificació quan realment es passa el torn al rival
      if (rivalUid && !rivalUid.startsWith('bot_')) {
        triggerTurnPushNotification({
          matchId: activeGame.id,
          senderUid: user.uid,
          senderName: user.displayName,
          targetUid: rivalUid,
          customMessage: `És el teu torn a la partida amb ${user.displayName}!`
        }).then(() => {
          setFcmPushAlert(`📲 Hem avisat a ${targetRivalName} que és el seu torn!`);
          setTimeout(() => setFcmPushAlert(null), 3500);
        }).catch(console.warn);
      }

      const updatedGame: DuelGame = {
        ...activeGame,
        currentTurnUid: rivalUid,
        consecutiveCorrect: {
          ...activeGame.consecutiveCorrect,
          [user.uid]: 0
        },
        lastUpdated: Date.now()
      };

      updateMatchTurnInSupabase({
        matchId: activeGame.id,
        currentTurn: rivalUid,
        scoreP1: activeGame.hostRedStripes,
        state: {
          score_p2: activeGame.guestRedStripes,
          consecutiveCorrect: activeGame.consecutiveCorrect
        },
        status: 'active'
      });

      await saveDuelGameUpdate(updatedGame);
      setActiveGame(updatedGame);
      await loadDuelsData();
    }
  };

  // Powerup: Comodí 50% (Cost: 1 Comodí adquirit a la botiga o 10 Mèrits)
  const handleUseFiftyFifty = () => {
    if (hasAnswered || !currentQuestion || disabledOptions.length > 0) return;

    if ((user.wildcardsCount || 0) > 0) {
      if (onUpdateWildcards) onUpdateWildcards(-1);
    } else if (user.merits >= 10) {
      onUpdateUserStats(0, -10);
    } else {
      AudioEngine.playWrong();
      alert("Et calen 10 Mèrits o tenir un Comodí 50% adquirit a la botiga per utilitzar aquesta ajuda!");
      return;
    }

    AudioEngine.playClick();
    const wrongKeys = currentQuestion.options.filter(o => !o.correct).map(o => o.key);
    // Shuffle and pick 2 wrong keys
    const toDisable = wrongKeys.sort(() => 0.5 - Math.random()).slice(0, 2);
    setDisabledOptions(toDisable);
  };

  // Abandonar / Rendir-se en un duel actiu (Actualització immediata a Supabase)
  const handleSurrenderMatch = async () => {
    if (!activeGame) return;
    const confirmSurrender = window.confirm(
      "Segur que vols abandonar o rendir-te en aquest duel?\nLa partida es donarà per finalitzada immediatament i la victòria serà per al teu rival."
    );
    if (!confirmSurrender) return;

    AudioEngine.playWrong();
    const isHost = activeGame.hostPlayerUid === user.uid;
    const rivalUid = isHost ? (activeGame.guestPlayerUid || 'bot_ai') : activeGame.hostPlayerUid;

    const finishedGame: DuelGame = {
      ...activeGame,
      status: 'finished',
      winnerUid: rivalUid,
      lastUpdated: Date.now()
    };

    // Actualitzar Supabase de forma immediata
    await forfeitMatchInSupabase({
      matchId: activeGame.id,
      forfeitedByUserId: user.uid,
      rivalUserId: rivalUid,
      finalState: finishedGame
    });

    await saveDuelGameUpdate(finishedGame);
    setActiveGame(null);
    setCurrentQuestion(null);
    await loadDuelsData();
  };

  // Reclamar victòria per inactivitat del rival (+1 setmana sense respondre)
  const handleClaimInactivityVictory = async (e: React.MouseEvent | null, game: DuelGame) => {
    if (e) e.stopPropagation();
    const isHost = game.hostPlayerUid === user.uid;
    const rivalName = isHost ? (game.guestPlayerName || 'Aspirant Opositor') : game.hostPlayerName;

    AudioEngine.playVictory();
    confetti({
      particleCount: 160,
      spread: 100,
      origin: { y: 0.5 }
    });

    const finishedGame: DuelGame = {
      ...game,
      status: 'finished',
      winnerUid: user.uid,
      lastUpdated: Date.now()
    };

    // Premi per victòria completa
    onUpdateUserStats(250, 30);

    // Sincronitzar a Supabase
    await updateMatchTurnInSupabase({
      matchId: game.id,
      currentTurn: user.uid,
      scoreP1: isHost ? 4 : game.hostRedStripes,
      state: {
        score_p2: !isHost ? 4 : game.guestRedStripes,
        winnerUid: user.uid,
        winnerName: user.displayName,
        forfeitReason: 'timeout_7days',
        hostPlayerName: game.hostPlayerName,
        guestPlayerName: game.guestPlayerName,
        hostPlayerAvatar: game.hostPlayerAvatar,
        guestPlayerAvatar: game.guestPlayerAvatar,
        hostPlayerShieldId: game.hostPlayerShieldId,
        guestPlayerShieldId: game.guestPlayerShieldId,
        consecutiveCorrect: game.consecutiveCorrect,
        shareCode: game.shareCode
      }
    });

    await saveDuelGameUpdate(finishedGame);
    setInactivityVictoryAlert(`🏆 Felicitats! Has reclamat la victòria contra ${rivalName} per haver superat el límit d'1 setmana sense respondre (+250 XP, +30 Mèrits).`);
    setTimeout(() => setInactivityVictoryAlert(null), 8000);

    await loadDuelsData();
  };

  // Eliminar una partida de la llista (tant de Firebase/LocalStorage com de Supabase)
  const handleDeleteGame = async (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    const confirmDelete = window.confirm("Vols eliminar aquest duel de la teva llista?");
    if (!confirmDelete) return;

    AudioEngine.playClick();
    deleteLocalDuelGame(gameId, user.uid);
    await deleteMatchInSupabase(gameId);

    setGameList(prev => prev.filter(g => g.id !== gameId));
    if (activeGame?.id === gameId) {
      setActiveGame(null);
      setCurrentQuestion(null);
    }
    await loadDuelsData();
  };

  // Continue from question
  const handleContinueAfterQuestion = () => {
    AudioEngine.playClick();
    setCurrentQuestion(null);
    requestAnimationFrame(() => {
      drawWheelCanvas(wheelAngle);
    });

    // Auto-centrar la ruleta a la pantalla
    setTimeout(() => {
      wheelContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);

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

    // Guardar a storage local i sincronitzar utilitzant el mateix ID únic
    try {
      await saveDuelGameUpdate(botGame);
      try {
        await supabase.from('matches').upsert({
          id: botGame.id,
          player1_id: user.uid,
          player2_id: bot.id,
          current_turn: user.uid,
          status: 'active',
          score_p1: 0,
          state: {
            score_p2: 0,
            consecutiveCorrect: { [user.uid]: 0, [bot.id]: 0 },
            botDifficulty: bot.difficulty,
            botAccuracy: bot.accuracy,
            hostPlayerName: user.displayName,
            guestPlayerName: bot.name,
            shareCode: botGame.shareCode
          }
        });
      } catch (sbErr) {}
      await loadDuelsData();
    } catch (e) {
      console.warn('Bot game persistence warning:', e);
    }
  };

  // Direct challenge to any registered or online user (Creació d'UNA SOLA partida unificada)
  const handleChallengeUser = async (targetUser: UserProfile) => {
    AudioEngine.playClick();
    setIsChallengingUser(targetUser.uid);
    try {
      // 1. Crear la partida única de repte directe amb ID definitiu
      const challengeGame = await createDirectChallengeGame(user, targetUser);

      // 2. Sincronitzar amb Supabase utilitzant EXACTAMENT el mateix ID per evitar duplicats
      try {
        await supabase.from('matches').upsert({
          id: challengeGame.id,
          player1_id: user.uid,
          player2_id: targetUser.uid,
          current_turn: user.uid,
          status: 'active',
          score_p1: 0,
          state: {
            score_p2: 0,
            consecutiveCorrect: { [user.uid]: 0, [targetUser.uid]: 0 },
            hostPlayerName: user.displayName,
            guestPlayerName: targetUser.displayName,
            hostPlayerAvatar: user.photoURL,
            guestPlayerAvatar: targetUser.photoURL,
            hostPlayerShieldId: user.equippedShieldId,
            guestPlayerShieldId: targetUser.equippedShieldId,
            shareCode: challengeGame.shareCode
          }
        });
      } catch (sbErr) {
        console.warn('Supabase match sync notice:', sbErr);
      }

      setActiveGame(challengeGame);
      setShowNewMatchModal(false);
      await loadDuelsData();
      setFcmPushAlert(`⚔️ Partida creada amb ${targetUser.displayName}. És el teu torn de girar la ruleta!`);
      setTimeout(() => setFcmPushAlert(null), 3500);
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

          updateMatchTurnInSupabase({
            matchId: activeGame.id,
            currentTurn: isBotWinner ? activeGame.currentTurnUid : user.uid,
            scoreP1: isBotHost ? botStripes : activeGame.hostRedStripes,
            state: {
              score_p2: !isBotHost ? botStripes : activeGame.guestRedStripes,
              winnerUid: isBotWinner ? activeGame.currentTurnUid : undefined,
              winnerName: isBotWinner ? (isBotHost ? activeGame.hostPlayerName : activeGame.guestPlayerName) : undefined,
              hostPlayerName: activeGame.hostPlayerName,
              guestPlayerName: activeGame.guestPlayerName,
              hostPlayerAvatar: activeGame.hostPlayerAvatar,
              guestPlayerAvatar: activeGame.guestPlayerAvatar
            },
            status: isBotWinner ? 'finished' : 'active'
          });

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

          updateMatchTurnInSupabase({
            matchId: activeGame.id,
            currentTurn: user.uid,
            scoreP1: activeGame.hostRedStripes,
            status: 'active'
          });

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

  const filteredFinishedHistory = useMemo(() => {
    if (!historySearchTerm.trim()) return finishedHistory;
    const term = historySearchTerm.toLowerCase();
    return finishedHistory.filter(m =>
      (m.player1Name && m.player1Name.toLowerCase().includes(term)) ||
      (m.player2Name && m.player2Name.toLowerCase().includes(term)) ||
      (m.winnerName && m.winnerName.toLowerCase().includes(term))
    );
  }, [finishedHistory, historySearchTerm]);

  // Helper per analitzar el ritme de resposta i última activitat d'un oponent
  const getUserActivityData = (target: UserProfile) => {
    const lastLogin = target.lastActive || target.lastLogin;
    const now = Date.now();
    // Només es considera 'en línia' si té activitat confirmada fa menys de 5 minuts
    const isOnline = Boolean(target.isOnline) && Boolean(lastLogin && (now - lastLogin) < 5 * 60 * 1000);

    let speedRating: 'fast' | 'active' | 'slow' = 'active';
    let speedLabel = '⏱️ Actiu (<24h)';
    let speedBadgeClass = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    let activityText = 'Recentment actiu';

    if (isOnline) {
      speedRating = 'fast';
      speedLabel = '⚡ Molt Ràpid (<2h)';
      speedBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      activityText = '🟢 Actiu ara';
    } else if (lastLogin) {
      const diffMs = now - lastLogin;
      const diffHours = diffMs / (3600 * 1000);
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 2) {
        speedRating = 'fast';
        speedLabel = '⚡ Molt Ràpid (<2h)';
        speedBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
        activityText = 'Actiu fa uns minuts';
      } else if (diffHours < 12) {
        speedRating = 'fast';
        speedLabel = '⚡ Ràpid (avui)';
        speedBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
        activityText = `Actiu fa ${Math.floor(diffHours)}h`;
      } else if (diffHours < 24) {
        speedRating = 'active';
        speedLabel = '⏱️ Actiu (<24h)';
        speedBadgeClass = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
        activityText = `Actiu fa ${Math.floor(diffHours)}h`;
      } else if (diffDays <= 3) {
        speedRating = 'active';
        speedLabel = '⏱️ Actiu (2-3 dies)';
        speedBadgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
        activityText = `Actiu fa ${diffDays}d`;
      } else {
        speedRating = 'slow';
        speedLabel = '🐢 Pausat (>3 dies)';
        speedBadgeClass = 'bg-slate-900 text-slate-400 border-slate-850';
        activityText = `Inactiu fa ${diffDays} dies`;
      }
    } else {
      speedRating = 'active';
      speedLabel = '⏱️ Actiu (<24h)';
      speedBadgeClass = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      activityText = 'Actiu aquesta setmana';
    }

    return {
      isOnline,
      speedRating,
      speedLabel,
      speedBadgeClass,
      activityText
    };
  };

  // Opositors ordenats intel·ligentment per activitat i filtrats
  const sortedAndFilteredUsers = useMemo(() => {
    let list = registeredUsers.map(u => ({
      ...u,
      activity: getUserActivityData(u)
    }));

    // Prioritat d'ordenació: En línia 🟢 -> Molt Ràpids ⚡ -> Actius ⏱️ -> XP
    list.sort((a, b) => {
      if (a.activity.isOnline && !b.activity.isOnline) return -1;
      if (!a.activity.isOnline && b.activity.isOnline) return 1;

      const scoreWeight = { fast: 3, active: 2, slow: 1 };
      const weightA = scoreWeight[a.activity.speedRating] || 2;
      const weightB = scoreWeight[b.activity.speedRating] || 2;
      if (weightA !== weightB) return weightB - weightA;

      return (b.xp || 0) - (a.xp || 0);
    });

    if (userFilterTab === 'online') {
      list = list.filter(u => u.activity.isOnline);
    } else if (userFilterTab === 'fast') {
      list = list.filter(u => u.activity.speedRating === 'fast');
    }

    if (userSearchTerm.trim()) {
      const term = userSearchTerm.toLowerCase();
      list = list.filter(u => 
        u.displayName.toLowerCase().includes(term) || 
        u.rank.title.toLowerCase().includes(term)
      );
    }

    return list;
  }, [registeredUsers, userFilterTab, userSearchTerm]);

  // Helper per resoldre l'escut equipat oficial d'un aspirant o bot policial
  const resolvePlayerShield = (
    playerId: string,
    explicitShieldId?: string,
    avatarUrl?: string
  ): string => {
    // 1. Si és l'usuari actual connectat, el seu escut equipat té màxima prioritat
    if (playerId === user.uid && user.equippedShieldId) {
      return user.equippedShieldId;
    }
    // 2. Si hi ha un ID d'escut explícit vàlid
    if (explicitShieldId && explicitShieldId !== 'escut_basico' && explicitShieldId !== 'default') {
      const cleanId = explicitShieldId.replace(/^escut_/, '');
      const found = SPECIALIZED_SHIELDS.find(s => s.id === explicitShieldId || s.id === cleanId);
      if (found) return found.id;
      return explicitShieldId;
    }
    // 3. Si l'avatar emmagatzema l'ID de l'escut (no comença per http)
    if (avatarUrl && !avatarUrl.startsWith('http') && avatarUrl !== 'escut_basico') {
      const cleanId = avatarUrl.replace(/^escut_/, '');
      const found = SPECIALIZED_SHIELDS.find(s => s.id === avatarUrl || s.id === cleanId);
      if (found) return found.id;
      return avatarUrl;
    }
    // 4. Si el trobem a la llista d'usuaris registrats
    const regUser = registeredUsers.find(u => u.uid === playerId);
    if (regUser?.equippedShieldId && regUser.equippedShieldId !== 'escut_basico') {
      const cleanId = regUser.equippedShieldId.replace(/^escut_/, '');
      const found = SPECIALIZED_SHIELDS.find(s => s.id === regUser.equippedShieldId || s.id === cleanId);
      if (found) return found.id;
      return regUser.equippedShieldId;
    }
    // 5. Si és un Bot policial
    if (playerId?.startsWith('bot_')) {
      if (playerId.includes('sergent')) return 'gei';
      if (playerId.includes('caporal')) return 'brimo';
      return 'generic_pvc';
    }
    return user.equippedShieldId || 'generic_pvc';
  };

  // Formatació de data curta en català: "24 set. · 16:30h"
  const formatShortCatalanDate = (dateInput: string | number): string => {
    try {
      const d = typeof dateInput === 'number' ? new Date(dateInput) : new Date(dateInput);
      if (isNaN(d.getTime())) return 'Recent';
      const day = d.getDate().toString().padStart(2, '0');
      const months = ['gen', 'feb', 'març', 'abr', 'maig', 'juny', 'jul', 'ag', 'set', 'oct', 'nov', 'des'];
      const month = months[d.getMonth()];
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${day} ${month} · ${hours}:${minutes}h`;
    } catch {
      return 'Recent';
    }
  };

  // Formatació de data completa en català: "24 de setembre de 2026 a les 16:30h"
  const formatFullCatalanDate = (dateInput: string | number): string => {
    try {
      const d = typeof dateInput === 'number' ? new Date(dateInput) : new Date(dateInput);
      if (isNaN(d.getTime())) return 'Data recent';
      const day = d.getDate();
      const months = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${day} de ${month} de ${year} a les ${hours}:${minutes}h`;
    } catch {
      return 'Data recent';
    }
  };

  // Càlcul dinàmic i en temps real dels Marcadors Cara a Cara a partir de Supabase i H2H
  const h2hPairs = useMemo(() => {
    const map = new Map<string, {
      pairKey: string;
      p1Id: string;
      p1Name: string;
      p1ShieldId: string;
      p1Wins: number;
      p2Id: string;
      p2Name: string;
      p2ShieldId: string;
      p2Wins: number;
      draws: number;
      totalMatches: number;
      lastMatchEndedAt: number | string;
      lastMatchTimeAgo: string;
      lastMatchScoreP1: number;
      lastMatchScoreP2: number;
      lastWinnerUid?: string;
      lastWinnerName?: string;
      involvesCurrentUser: boolean;
      matches: Array<{
        id: string;
        endedAt: number | string;
        timeAgoText: string;
        p1Score: number;
        p2Score: number;
        isP1Winner: boolean;
        isP2Winner: boolean;
        isDraw: boolean;
        winnerName?: string;
      }>;
    }>();

    // 1. Processar totes les partides finalitzades de Supabase
    finishedHistory.forEach(match => {
      if (!match || !match.player1Id || !match.player2Id) return;

      const involvesMe = match.player1Id === user.uid || match.player2Id === user.uid;

      // Determinar ordre: si l'usuari actual participa, sempre apareix com a Jugador 1 (TU)
      let p1Id = match.player1Id;
      let p1Name = match.player1Name;
      let p1Avatar = match.player1Avatar;
      let p1Shield = match.player1ShieldId;
      let p2Id = match.player2Id;
      let p2Name = match.player2Name;
      let p2Avatar = match.player2Avatar;
      let p2Shield = match.player2ShieldId;
      let matchP1Score = match.scoreP1;
      let matchP2Score = match.scoreP2;

      if (involvesMe && match.player2Id === user.uid) {
        p1Id = match.player2Id;
        p1Name = match.player2Name;
        p1Avatar = match.player2Avatar;
        p1Shield = match.player2ShieldId;
        p2Id = match.player1Id;
        p2Name = match.player1Name;
        p2Avatar = match.player1Avatar;
        p2Shield = match.player1ShieldId;
        matchP1Score = match.scoreP2;
        matchP2Score = match.scoreP1;
      } else if (!involvesMe) {
        if (p1Id > p2Id) {
          p1Id = match.player2Id;
          p1Name = match.player2Name;
          p1Avatar = match.player2Avatar;
          p1Shield = match.player2ShieldId;
          p2Id = match.player1Id;
          p2Name = match.player1Name;
          p2Avatar = match.player1Avatar;
          p2Shield = match.player1ShieldId;
          matchP1Score = match.scoreP2;
          matchP2Score = match.scoreP1;
        }
      }

      const pairKey = [p1Id, p2Id].sort().join('_vs_');
      const isP1Winner = match.winnerUid === p1Id || (matchP1Score > matchP2Score && !match.winnerUid);
      const isP2Winner = match.winnerUid === p2Id || (matchP2Score > matchP1Score && !match.winnerUid);
      const isDraw = match.isDraw || (matchP1Score === matchP2Score && !match.winnerUid);

      const matchTimestamp = typeof match.endedAt === 'number' ? match.endedAt : new Date(match.endedAt || Date.now()).getTime();

      const matchItem = {
        id: String(match.id || match.gameId || `${pairKey}_${matchTimestamp}_${Math.random()}`),
        endedAt: match.endedAt,
        timeAgoText: match.timeAgoText || 'Recent',
        p1Score: matchP1Score,
        p2Score: matchP2Score,
        isP1Winner,
        isP2Winner,
        isDraw,
        winnerName: match.winnerName
      };

      const existing = map.get(pairKey);
      if (!existing) {
        map.set(pairKey, {
          pairKey,
          p1Id,
          p1Name,
          p1ShieldId: resolvePlayerShield(p1Id, p1Shield, p1Avatar),
          p1Wins: isP1Winner ? 1 : 0,
          p2Id,
          p2Name,
          p2ShieldId: resolvePlayerShield(p2Id, p2Shield, p2Avatar),
          p2Wins: isP2Winner ? 1 : 0,
          draws: isDraw ? 1 : 0,
          totalMatches: 1,
          lastMatchEndedAt: match.endedAt,
          lastMatchTimeAgo: match.timeAgoText,
          lastMatchScoreP1: matchP1Score,
          lastMatchScoreP2: matchP2Score,
          lastWinnerUid: match.winnerUid,
          lastWinnerName: match.winnerName,
          involvesCurrentUser: involvesMe,
          matches: [matchItem]
        });
      } else {
        existing.totalMatches += 1;
        existing.matches.push(matchItem);
        if (isP1Winner) existing.p1Wins += 1;
        else if (isP2Winner) existing.p2Wins += 1;
        else if (isDraw) existing.draws += 1;

        const existingTimestamp = typeof existing.lastMatchEndedAt === 'number' ? existing.lastMatchEndedAt : new Date(existing.lastMatchEndedAt || 0).getTime();
        if (matchTimestamp > existingTimestamp) {
          existing.lastMatchEndedAt = match.endedAt;
          existing.lastMatchTimeAgo = match.timeAgoText;
          existing.lastMatchScoreP1 = matchP1Score;
          existing.lastMatchScoreP2 = matchP2Score;
          existing.lastWinnerUid = match.winnerUid;
          existing.lastWinnerName = match.winnerName;
        }
      }
    });

    // 2. Integrar qualsevol registre local / Firebase que encara no s'hagi sincronitzat
    headToHead.forEach(h => {
      const pairKey = [h.player1Uid, h.player2Uid].sort().join('_vs_');
      if (!map.has(pairKey)) {
        const involvesMe = h.player1Uid === user.uid || h.player2Uid === user.uid;
        const p1IsUser = h.player1Uid === user.uid;
        map.set(pairKey, {
          pairKey,
          p1Id: p1IsUser ? h.player1Uid : h.player2Uid,
          p1Name: p1IsUser ? h.player1Name : h.player2Name,
          p1ShieldId: resolvePlayerShield(p1IsUser ? h.player1Uid : h.player2Uid),
          p1Wins: p1IsUser ? h.player1Wins : h.player2Wins,
          p2Id: p1IsUser ? h.player2Uid : h.player1Uid,
          p2Name: p1IsUser ? h.player2Name : h.player1Name,
          p2ShieldId: resolvePlayerShield(p1IsUser ? h.player2Uid : h.player1Uid),
          p2Wins: p1IsUser ? h.player2Wins : h.player1Wins,
          draws: 0,
          totalMatches: h.player1Wins + h.player2Wins,
          lastMatchEndedAt: h.lastMatchTimestamp,
          lastMatchTimeAgo: 'Recent',
          lastMatchScoreP1: 0,
          lastMatchScoreP2: 0,
          involvesCurrentUser: involvesMe,
          matches: []
        });
      }
    });

    const result = Array.from(map.values());
    result.forEach(pair => {
      pair.matches.sort((a, b) => {
        const tA = typeof a.endedAt === 'number' ? a.endedAt : new Date(a.endedAt || 0).getTime();
        const tB = typeof b.endedAt === 'number' ? b.endedAt : new Date(b.endedAt || 0).getTime();
        return tB - tA;
      });
    });

    return result.sort((a, b) => {
      if (a.involvesCurrentUser && !b.involvesCurrentUser) return -1;
      if (!a.involvesCurrentUser && b.involvesCurrentUser) return 1;
      const timeA = typeof a.lastMatchEndedAt === 'number' ? a.lastMatchEndedAt : new Date(a.lastMatchEndedAt || 0).getTime();
      const timeB = typeof b.lastMatchEndedAt === 'number' ? b.lastMatchEndedAt : new Date(b.lastMatchEndedAt || 0).getTime();
      return timeB - timeA;
    });
  }, [finishedHistory, headToHead, user.uid]);

  const filteredH2HPairs = useMemo(() => {
    let list = h2hPairs;
    if (h2hFilter === 'mine') {
      list = list.filter(p => p.involvesCurrentUser);
    }
    if (h2hSearchTerm.trim()) {
      const term = h2hSearchTerm.toLowerCase();
      list = list.filter(p => p.p1Name.toLowerCase().includes(term) || p.p2Name.toLowerCase().includes(term));
    }
    return list;
  }, [h2hPairs, h2hFilter, h2hSearchTerm]);

  // Llançar revenja ràpida des de la targeta Cara a Cara
  const handleRematchH2H = (targetUid: string, targetName: string) => {
    AudioEngine.playClick();
    if (targetUid.startsWith('bot_')) {
      if (targetUid.includes('sergent')) handleStartBotPractice('sergent');
      else if (targetUid.includes('caporal')) handleStartBotPractice('caporal');
      else handleStartBotPractice('agent');
      return;
    }
    const foundUser = registeredUsers.find(u => u.uid === targetUid);
    if (foundUser) {
      handleChallengeUser(foundUser);
    } else {
      handleChallengeUser({
        uid: targetUid,
        displayName: targetName,
        email: '',
        xp: 0,
        merits: 0,
        rank: calculateRank(0),
        equippedShieldId: 'generic_pvc',
        unlockedShieldIds: ['generic_pvc'],
        failedQuestionIds: [],
        savedQuestionIds: []
      });
    }
  };

  const isHost = activeGame?.hostPlayerUid === user.uid;
  const myStripes = activeGame ? (isHost ? activeGame.hostRedStripes : activeGame.guestRedStripes) : 0;
  const rivalStripes = activeGame ? (isHost ? activeGame.guestRedStripes : activeGame.hostRedStripes) : 0;
  const rivalName = activeGame ? (isHost ? (activeGame.guestPlayerName || 'Aspirant Opositor') : activeGame.hostPlayerName) : '';
  const myStreak = activeGame ? ((activeGame.consecutiveCorrect && activeGame.consecutiveCorrect[user.uid]) || 0) : 0;
  const isMyTurn = activeGame ? activeGame.currentTurnUid === user.uid : false;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
      {/* Banner de confirmació d'enviament de Push FCM */}
      {fcmPushAlert && (
        <div className="p-3 bg-gradient-to-r from-sky-950/90 to-blue-950/90 border border-sky-500/50 rounded-2xl text-xs sm:text-sm text-sky-200 font-bold flex items-center gap-2 shadow-lg shadow-sky-500/20 animate-fade-in">
          <span className="text-base">🚀</span>
          <span>{fcmPushAlert}</span>
        </div>
      )}

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

        {/* Sub-pestanyes de navegació: Els meus Duels vs Cara a Cara vs Historial de Duels */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => {
              AudioEngine.playClick();
              setActiveDuelTab('my_duels');
            }}
            className={`py-2 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeDuelTab === 'my_duels'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Els meus Duels ({myTurnGames.length + rivalTurnGames.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              AudioEngine.playClick();
              setActiveDuelTab('h2h');
              loadHistoryData();
            }}
            className={`py-2 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeDuelTab === 'h2h'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/25 font-black'
                : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span className="text-base">🤝</span>
            <span>Cara a Cara 1v1</span>
            {h2hPairs.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeDuelTab === 'h2h' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-amber-300'
              }`}>
                {h2hPairs.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              AudioEngine.playClick();
              setActiveDuelTab('history');
              loadHistoryData();
            }}
            className={`py-2 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeDuelTab === 'history'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-black'
                : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Últims Resultats</span>
            {finishedHistory.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeDuelTab === 'history' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-amber-300'
              }`}>
                {finishedHistory.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Active Match Arena / Wheel View */}
      {activeGame && (
        <div ref={activeArenaRef} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5">
          {/* Top Bar: Return to list & Share Code & Abandonar/Rendir-se */}
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
              {/* Botón Abandonar / Rendir-se con sync inmediata en Supabase */}
              <button
                onClick={handleSurrenderMatch}
                title="Rendir-te i donar la victòria al rival (actualitza Supabase a l'instant)"
                className="py-1.5 px-3 bg-red-950/60 hover:bg-red-900/80 text-red-300 hover:text-white border border-red-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
              >
                <Flag className="w-3.5 h-3.5 text-red-400" />
                <span>Abandonar / Rendir-se</span>
              </button>

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
            <div ref={questionContainerRef} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 animate-fadeIn">
              {/* Question Header */}
              <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-base">{currentQuestion.categoryIcon}</span>
                  <span className="text-xs font-black text-slate-200">{currentQuestion.categoryName}</span>
                  {(() => {
                    const failCount = user.questionMistakesCount?.[currentQuestion.id] || (user.failedQuestionIds?.includes(currentQuestion.id) ? 1 : 0);
                    if (failCount > 0) {
                      return (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black flex items-center gap-1 animate-pulse">
                          <span>⚠️ Has fallat aquesta pregunta {failCount} {failCount === 1 ? 'vegada' : 'vegades'}</span>
                        </span>
                      );
                    }
                    return null;
                  })()}
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

              {/* Powerups row (Comodí 50%) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUseFiftyFifty}
                  disabled={hasAnswered || disabledOptions.length > 0}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-400 font-black rounded-xl text-xs border border-amber-500/30 flex items-center gap-1.5 cursor-pointer min-h-[36px] shadow-sm transition-all"
                  title="Descarta 2 respostes incorrectes (1 Comodí o 10 Mèrits)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Comodí 50%</span>
                  {(user.wildcardsCount || 0) > 0 ? (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                      {user.wildcardsCount}
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400/90 font-mono font-bold">
                      (10 mèrits)
                    </span>
                  )}
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
          <div ref={wheelContainerRef} className={`flex flex-col items-center justify-center py-4 relative ${currentQuestion ? 'hidden' : 'flex'}`}>
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

      {/* 5. Matches Lists Dashboard (Els meus Duels) */}
      {!activeGame && activeDuelTab === 'my_duels' && (
        <div className="space-y-6">
          {/* Ticker del darrer duel oficial completat a Supabase */}
          {finishedHistory.length > 0 && (
            <div 
              onClick={() => {
                AudioEngine.playClick();
                setActiveDuelTab('history');
              }}
              className="p-3.5 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs cursor-pointer hover:border-amber-400/60 transition-all shadow-md group"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-amber-400 font-black text-sm shrink-0">🏆 ÚLTIM RESULTAT:</span>
                <div className="flex items-center gap-1.5 truncate">
                  <div className="shrink-0 scale-90">
                    <ShieldRenderer 
                      shieldId={resolvePlayerShield(finishedHistory[0].player1Id, finishedHistory[0].player1ShieldId, finishedHistory[0].player1Avatar)} 
                      size={22} 
                    />
                  </div>
                  <span className="font-extrabold text-white truncate">
                    {finishedHistory[0].player1Name}
                  </span>
                  <span className="text-amber-400 font-mono font-black shrink-0 px-1 py-0.2 rounded bg-slate-950 border border-slate-800">
                    {finishedHistory[0].scoreP1} - {finishedHistory[0].scoreP2}
                  </span>
                  <span className="font-extrabold text-white truncate">
                    {finishedHistory[0].player2Name}
                  </span>
                  <div className="shrink-0 scale-90">
                    <ShieldRenderer 
                      shieldId={resolvePlayerShield(finishedHistory[0].player2Id, finishedHistory[0].player2ShieldId, finishedHistory[0].player2Avatar)} 
                      size={22} 
                    />
                  </div>
                </div>
                <span className="text-slate-400 text-[11px] shrink-0">· {finishedHistory[0].timeAgoText}</span>
              </div>
              <span className="text-[11px] font-bold text-amber-400 group-hover:text-amber-300 flex items-center gap-1 shrink-0">
                Historial complet ➔
              </span>
            </div>
          )}

          {/* Alert de Victòria Reclamada per Inactivitat */}
          {inactivityVictoryAlert && (
            <div className="p-4 bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 border-2 border-amber-500/80 rounded-2xl text-xs sm:text-sm text-amber-200 font-bold flex items-center justify-between gap-3 shadow-xl animate-bounce-short">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
                <span>{inactivityVictoryAlert}</span>
              </div>
              <button 
                onClick={() => setInactivityVictoryAlert(null)}
                className="p-1 hover:bg-amber-500/20 rounded-lg text-amber-300 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Banner de Duels Guanyats per Inactivitat (+1 setmana) */}
          {rivalTurnGames.some(g => (Date.now() - (g.lastUpdated || Date.now())) >= (7 * 24 * 60 * 60 * 1000)) && (
            <div className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 border-2 border-amber-500/80 rounded-2xl flex items-center justify-between gap-3 shadow-xl shadow-amber-500/10 animate-bounce-short">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xl shrink-0 shadow-md">
                  🏆
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white">
                    ¡Tens duels guanyats per abandonament del rival!
                  </h4>
                  <p className="text-[11px] text-amber-200/90 mt-0.5">
                    El teu oponent ha superat el límit reglamentari d'1 setmana (168h) sense respondre. Reclama la teva victòria oficial (+250 XP i +30 Mèrits).
                  </p>
                </div>
              </div>
            </div>
          )}

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
                  const rivalUid = isHostP ? (game.guestPlayerUid || 'bot_ai') : game.hostPlayerUid;
                  const rivalUser = registeredUsers.find(u => u.uid === rivalUid);
                  const rivalActivity = rivalUser ? getUserActivityData(rivalUser) : null;

                  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
                  const turnStart = game.lastUpdated || Date.now();
                  const timeElapsed = Math.max(0, Date.now() - turnStart);
                  const timeLeft = Math.max(0, ONE_WEEK_MS - timeElapsed);
                  const totalHours = Math.floor(timeLeft / (3600 * 1000));
                  const days = Math.floor(timeLeft / (24 * 3600 * 1000));
                  const hours = Math.floor((timeLeft % (24 * 3600 * 1000)) / (3600 * 1000));
                  const isUrgent = days === 0;

                  return (
                    <div
                      key={game.id}
                      onClick={() => {
                        AudioEngine.playClick();
                        setActiveGame(game);
                      }}
                      className="p-3.5 bg-slate-900 hover:bg-slate-850 border border-emerald-500/40 hover:border-emerald-400 rounded-2xl cursor-pointer transition-all active:scale-[0.99] shadow-lg flex flex-col justify-between gap-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl shrink-0">
                            ⚔️
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-white truncate max-w-[120px]">{rName}</span>
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                                Et toca jugar
                              </span>
                              {rivalActivity && (
                                <span className={`text-[8px] font-black px-1.5 py-0.2 rounded border ${rivalActivity.speedBadgeClass}`}>
                                  {rivalActivity.speedLabel}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>🛡️ {myS}/4 vs {rivalS}/4</span>
                              <span className="font-mono text-[9px] text-slate-500">#{game.shareCode}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button 
                            onClick={(e) => handleDeleteGame(e, game.id)}
                            title="Eliminar aquest duel de la llista"
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center gap-1">
                            <span>GIRAR</span>
                            <span>➔</span>
                          </button>
                        </div>
                      </div>

                      {/* Compte enrere límit de torn (1 setmana) */}
                      <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-xl border ${
                        isUrgent 
                          ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse' 
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}>
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {isUrgent 
                            ? `🔥 URGENT: Contesta en menys de ${hours}h!` 
                            : `⏳ Contesta en menys de ${totalHours}h (${days}d ${hours}h) • Límit: 1 setmana`}
                        </span>
                      </div>
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
                  const rivalUid = isHostP ? (game.guestPlayerUid || 'bot_ai') : game.hostPlayerUid;
                  const rivalUser = registeredUsers.find(u => u.uid === rivalUid);
                  const rivalActivity = rivalUser ? getUserActivityData(rivalUser) : null;

                  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
                  const turnStart = game.lastUpdated || Date.now();
                  const timeElapsed = Math.max(0, Date.now() - turnStart);
                  const isExpired = timeElapsed >= ONE_WEEK_MS;
                  const timeLeft = Math.max(0, ONE_WEEK_MS - timeElapsed);
                  const totalHours = Math.floor(timeLeft / (3600 * 1000));
                  const days = Math.floor(timeLeft / (24 * 3600 * 1000));
                  const hours = Math.floor((timeLeft % (24 * 3600 * 1000)) / (3600 * 1000));

                  return (
                    <div
                      key={game.id}
                      onClick={() => {
                        AudioEngine.playClick();
                        setActiveGame(game);
                      }}
                      className={`p-3.5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between gap-2.5 shadow-md ${
                        isExpired
                          ? 'bg-amber-950/40 border-2 border-amber-500/80 shadow-amber-500/15'
                          : 'bg-slate-900/60 hover:bg-slate-900 border border-slate-800 opacity-90'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 ${
                            isExpired ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800'
                          }`}>
                            {isExpired ? '🏆' : '⏳'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-300 truncate max-w-[120px]">{rName}</span>
                              {rivalActivity && (
                                <span className={`text-[8px] font-black px-1.5 py-0.2 rounded border ${rivalActivity.speedBadgeClass}`}>
                                  {rivalActivity.speedLabel}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500">🛡️ {myS}/4 vs {rivalS}/4</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isExpired && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                              Esperant rival
                            </span>
                          )}
                          <button 
                            onClick={(e) => handleDeleteGame(e, game.id)}
                            title="Eliminar aquest duel de la llista"
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Notificació d'inactivitat: Reclamar Victòria o Temps Restant */}
                      {isExpired ? (
                        <div className="p-2.5 bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 border-2 border-amber-500/60 rounded-xl flex items-center justify-between gap-2 shadow-lg shadow-amber-500/10">
                          <div className="text-[11px] font-black text-amber-300 flex items-center gap-1.5">
                            <span className="text-base">🏆</span>
                            <div>
                              <div>+1 setmana sense contestar!</div>
                              <div className="text-[9px] text-amber-400/80 font-normal">Victòria automàtica per abandonament</div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleClaimInactivityVictory(e, game)}
                            className="py-1.5 px-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-[11px] rounded-xl shadow-md shadow-amber-500/25 active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <Trophy className="w-3.5 h-3.5 fill-slate-950" />
                            <span>Reclamar Victòria (+250 XP)</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>⏰ Contesta en menys de {totalHours}h ({days}d {hours}h) • Límit: 1 setmana</span>
                          </div>

                          {rivalUid && !rivalUid.startsWith('bot_') && (() => {
                            const tocStorageKey = `last_toc_${game.id}`;
                            const lastSentToc = Number(localStorage.getItem(tocStorageKey) || 0);
                            const cooldownMs = 5 * 60 * 1000;
                            const isCoolingDown = Date.now() - lastSentToc < cooldownMs;
                            const minutesLeft = Math.ceil((cooldownMs - (Date.now() - lastSentToc)) / 60000);

                            return (
                              <button
                                disabled={isCoolingDown}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (isCoolingDown) return;

                                  AudioEngine.playClick();
                                  localStorage.setItem(tocStorageKey, Date.now().toString());

                                  // Guardar estat de Toc a la partida (perquè salti en temps real a l'altre dispositiu)
                                  const updatedWithToc: DuelGame = {
                                    ...game,
                                    lastTocAt: Date.now(),
                                    lastTocFrom: user.displayName,
                                    lastTocUid: user.uid,
                                    lastUpdated: Date.now()
                                  };

                                  try {
                                    await saveDuelGameUpdate(updatedWithToc);
                                    try {
                                      await supabase.from('matches').update({
                                        current_turn: game.currentTurnUid,
                                        state: {
                                          lastTocAt: updatedWithToc.lastTocAt,
                                          lastTocFrom: updatedWithToc.lastTocFrom,
                                          lastTocUid: updatedWithToc.lastTocUid
                                        }
                                      }).eq('id', game.id);
                                    } catch (sbErr) {}
                                  } catch (err) {
                                    console.warn('Error saving toc to duel:', err);
                                  }

                                  // Emetre notificació push / SSE i alerta en pantalla
                                  triggerTurnPushNotification({
                                    matchId: game.id,
                                    senderUid: user.uid,
                                    senderName: user.displayName,
                                    targetUid: rivalUid,
                                    customMessage: `🚨 TOC D'ATENCIÓ DE ${user.displayName.toUpperCase()}! Et toca contestar al nostre duel ara mateix.`
                                  }).then(() => {
                                    setFcmPushAlert(`📲 Toc enviat a la pantalla de ${rName}!`);
                                    setTimeout(() => setFcmPushAlert(null), 4000);
                                  }).catch(console.warn);
                                }}
                                className={`text-[9px] font-black px-2 py-0.5 rounded border flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                                  isCoolingDown
                                    ? 'bg-slate-800 text-slate-400 border-slate-700 opacity-60 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-amber-500/20 to-red-500/20 hover:from-amber-500/30 hover:to-red-500/30 text-amber-300 border-amber-500/40 hover:border-amber-400 active:scale-95 shadow-sm'
                                }`}
                                title={isCoolingDown ? `Pots tornar a enviar un toc en ${minutesLeft} minuts` : "Enviar un toc d'atenció directe a la pantalla del teu oponent"}
                              >
                                <span className={isCoolingDown ? '' : 'animate-bounce'}>🔔</span>
                                <span>{isCoolingDown ? `Toc enviat (${minutesLeft}m)` : 'Enviar Toc'}</span>
                              </button>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RETAR OPOSITORS (TOTS ELS REGISTRATS) AMB VELOCITAT DE RESPOSTA */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-black text-white">
                  <span>RETAR OPOSITORS ({sortedAndFilteredUsers.length})</span>
                </h3>
              </div>
              
              {/* Cercador directe d'opositors */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="Cercar opositor per nom o rang..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Filtres de ritme de joc i activitat */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setUserFilterTab('all')}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                  userFilterTab === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Tots ({registeredUsers.length})
              </button>

              <button
                type="button"
                onClick={() => setUserFilterTab('fast')}
                className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                  userFilterTab === 'fast'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Més Ràpids (&lt;2h)</span>
              </button>

              <button
                type="button"
                onClick={() => setUserFilterTab('online')}
                className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                  userFilterTab === 'online'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>En Línia ({registeredUsers.filter(u => u.isOnline).length})</span>
              </button>
            </div>

            {sortedAndFilteredUsers.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-xs">
                No s'ha trobat cap opositor amb aquests criteris de cerca.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                {sortedAndFilteredUsers.map((target) => (
                  <div
                    key={target.uid}
                    className="p-3 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-between gap-2.5 transition-all shadow-md"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0 flex items-center justify-center">
                        <div className="p-0.5 rounded-xl bg-slate-800/90 border border-slate-700 shadow-sm flex items-center justify-center">
                          <ShieldRenderer 
                            shieldId={resolvePlayerShield(target.uid, target.equippedShieldId, target.photoURL)}
                            size={34}
                          />
                        </div>
                        <span 
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                            target.activity.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                          }`}
                          title={target.activity.isOnline ? 'En línia' : 'Desconnectat'}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-white truncate max-w-[120px]">{target.displayName}</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${target.activity.speedBadgeClass}`}>
                            {target.activity.speedLabel}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                          <span>{target.rank.badge} {target.rank.title}</span>
                          <span>•</span>
                          <span className="text-amber-400/90 font-mono font-bold">{target.xp} XP</span>
                        </div>
                        <div className="text-[9px] text-slate-500 truncate mt-0.5">
                          {target.activity.activityText}
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

      {/* 6. Marcadors Cara a Cara (Rivalitats 1v1 directes) */}
      {!activeGame && activeDuelTab === 'h2h' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Header & Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl">🤝</span>
                <h3 className="text-base font-black text-white">Marcadors Cara a Cara (1v1)</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black">
                  Rivalitats Directes
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Historial acumulat de victòries entre dos opositors, balanç de domini i data exacta del darrer duel.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Toggle Els meus vs Tots */}
              <div className="flex items-center bg-slate-950 rounded-xl p-0.5 border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setH2hFilter('mine')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    h2hFilter === 'mine' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Els meus ({h2hPairs.filter(p => p.involvesCurrentUser).length})
                </button>
                <button
                  type="button"
                  onClick={() => setH2hFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    h2hFilter === 'all' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tots els globals ({h2hPairs.length})
                </button>
              </div>

              <button
                type="button"
                onClick={loadHistoryData}
                disabled={isLoadingHistory}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                <span>Actualitzar</span>
              </button>
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={h2hSearchTerm}
              onChange={(e) => setH2hSearchTerm(e.target.value)}
              placeholder="Cerca per nom d'un opositor o rival..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            {h2hSearchTerm && (
              <button
                type="button"
                onClick={() => setH2hSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            )}
          </div>

          {/* Cara a Cara Cards List */}
          {isLoadingHistory && filteredH2HPairs.length === 0 ? (
            <div className="p-10 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
              <RotateCw className="w-6 h-6 animate-spin text-amber-400" />
              <span>Calculant els marcadors cara a cara...</span>
            </div>
          ) : filteredH2HPairs.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs space-y-2">
              <div className="text-2xl">🤝</div>
              <p className="font-bold text-white">No s'han trobat enfrontaments cara a cara</p>
              <p className="text-slate-500 max-w-sm mx-auto">
                {h2hSearchTerm 
                  ? "Cap opositor coincideix amb la cerca." 
                  : h2hFilter === 'mine' 
                    ? "Encara no has jugat cap duel finalitzat. Repta un altre opositor o juga contra un Bot per crear el teu primer marcador!"
                    : "Encara no hi ha partides finalitzades registrades a la comunitat."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredH2HPairs.map((pair) => {
                const isP1Leader = pair.p1Wins > pair.p2Wins;
                const isP2Leader = pair.p2Wins > pair.p1Wins;
                const isTied = pair.p1Wins === pair.p2Wins;
                const p1Percent = pair.totalMatches > 0 ? Math.round((pair.p1Wins / pair.totalMatches) * 100) : 50;
                const p2Percent = pair.totalMatches > 0 ? Math.round((pair.p2Wins / pair.totalMatches) * 100) : 50;

                const rivalIdToChallenge = pair.p1Id === user.uid ? pair.p2Id : (pair.p2Id === user.uid ? pair.p1Id : pair.p2Id);
                const rivalNameToChallenge = pair.p1Id === user.uid ? pair.p2Name : (pair.p2Id === user.uid ? pair.p1Name : pair.p2Name);
                const isExpanded = expandedH2hPairKey === pair.pairKey;

                return (
                  <div
                    key={pair.pairKey}
                    className={`bg-slate-900/90 border rounded-3xl p-4 sm:p-6 transition-all shadow-xl ${
                      pair.involvesCurrentUser
                        ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 ring-1 ring-amber-500/20'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Card Header: Rivalry summary & Exact Date of Last Match */}
                    <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-800/80 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-800 text-amber-300 border border-slate-700 flex items-center gap-1">
                          <Swords className="w-3 h-3 text-amber-400" />
                          <span>RIVALITAT 1v1</span>
                        </span>
                        
                        {isP1Leader && (
                          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            🏆 {pair.p1Name} lidera (+{pair.p1Wins - pair.p2Wins})
                          </span>
                        )}
                        {isP2Leader && (
                          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            🏆 {pair.p2Name} lidera (+{pair.p2Wins - pair.p1Wins})
                          </span>
                        )}
                        {isTied && (
                          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                            ⚖️ Empat absolut ({pair.p1Wins} - {pair.p2Wins})
                          </span>
                        )}
                      </div>

                      {/* EXACT DATE OF THE LAST MATCH */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800/80 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>Darrer match: {formatShortCatalanDate(pair.lastMatchEndedAt)}</span>
                        <span className="text-[10px] text-slate-500 font-normal">({pair.lastMatchTimeAgo})</span>
                      </div>
                    </div>

                    {/* Clash Arena Body */}
                    <div className="grid grid-cols-3 items-center py-4 px-1 gap-2">
                      {/* Player 1 Side */}
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-1.5 flex items-center justify-center">
                          <div className={`p-1.5 rounded-2xl transition-all ${
                            isP1Leader
                              ? 'ring-2 ring-amber-400/70 shadow-xl shadow-amber-500/25 bg-amber-950/25'
                              : 'bg-slate-800/50 border border-slate-800'
                          }`}>
                            <ShieldRenderer
                              shieldId={pair.p1ShieldId}
                              size={52}
                              glow={isP1Leader}
                            />
                          </div>
                          {isP1Leader && (
                            <span className="absolute -top-3 -right-1 text-base filter drop-shadow animate-bounce" title="Líder del Cara a Cara">
                              👑
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 max-w-[110px] sm:max-w-[150px] truncate">
                          <span className={`text-xs sm:text-sm font-black truncate ${isP1Leader ? 'text-amber-300' : 'text-white'}`}>
                            {pair.p1Name}
                          </span>
                          {pair.p1Id === user.uid && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                              TU
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-col items-center">
                          <span className={`text-sm sm:text-base font-mono font-black ${isP1Leader ? 'text-amber-400' : 'text-slate-300'}`}>
                            {pair.p1Wins} {pair.p1Wins === 1 ? 'Victòria' : 'Victòries'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {p1Percent}% d'èxit
                          </span>
                        </div>
                      </div>

                      {/* Center Clash Pillar */}
                      <div className="flex flex-col items-center justify-center text-center px-1">
                        <div className="flex items-center gap-2 sm:gap-3 bg-slate-950 px-4 sm:px-6 py-2.5 rounded-2xl border border-slate-800 shadow-inner">
                          <span className={`text-2xl sm:text-4xl font-black font-mono ${isP1Leader ? 'text-amber-400' : 'text-slate-300'}`}>
                            {pair.p1Wins}
                          </span>
                          <span className="text-xs font-black text-slate-600">VS</span>
                          <span className={`text-2xl sm:text-4xl font-black font-mono ${isP2Leader ? 'text-amber-400' : 'text-slate-300'}`}>
                            {pair.p2Wins}
                          </span>
                        </div>

                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-2">
                          {pair.totalMatches} {pair.totalMatches === 1 ? 'duel disputat' : 'duels disputats'}
                        </span>

                        {pair.lastWinnerName && (
                          <span className="text-[10px] font-bold text-amber-300/90 mt-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 truncate max-w-[130px] sm:max-w-[180px]">
                            Darrer: {pair.lastWinnerName} ({pair.lastMatchScoreP1}-{pair.lastMatchScoreP2})
                          </span>
                        )}
                      </div>

                      {/* Player 2 Side */}
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-1.5 flex items-center justify-center">
                          <div className={`p-1.5 rounded-2xl transition-all ${
                            isP2Leader
                              ? 'ring-2 ring-amber-400/70 shadow-xl shadow-amber-500/25 bg-amber-950/25'
                              : 'bg-slate-800/50 border border-slate-800'
                          }`}>
                            <ShieldRenderer
                              shieldId={pair.p2ShieldId}
                              size={52}
                              glow={isP2Leader}
                            />
                          </div>
                          {isP2Leader && (
                            <span className="absolute -top-3 -right-1 text-base filter drop-shadow animate-bounce" title="Líder del Cara a Cara">
                              👑
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 max-w-[110px] sm:max-w-[150px] truncate">
                          <span className={`text-xs sm:text-sm font-black truncate ${isP2Leader ? 'text-amber-300' : 'text-white'}`}>
                            {pair.p2Name}
                          </span>
                          {pair.p2Id === user.uid && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                              TU
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-col items-center">
                          <span className={`text-sm sm:text-base font-mono font-black ${isP2Leader ? 'text-amber-400' : 'text-slate-300'}`}>
                            {pair.p2Wins} {pair.p2Wins === 1 ? 'Victòria' : 'Victòries'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {p2Percent}% d'èxit
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar split */}
                    <div className="my-2 h-1.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all"
                        style={{ width: `${p1Percent}%` }}
                      />
                      <div 
                        className="bg-gradient-to-r from-sky-500 to-blue-600 h-full transition-all"
                        style={{ width: `${p2Percent}%` }}
                      />
                    </div>

                    {/* Card Footer: Detailed Date, Breakdown Toggle & Action */}
                    <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between gap-3 flex-wrap text-xs">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Darrer duel: <b className="text-white">{formatFullCatalanDate(pair.lastMatchEndedAt)}</b></span>
                        </div>

                        {pair.matches && pair.matches.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setExpandedH2hPairKey(isExpanded ? null : pair.pairKey)}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                              isExpanded
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                            }`}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                                <span>Plegar partides</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                                <span>Veure historial ({pair.matches.length})</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRematchH2H(rivalIdToChallenge, rivalNameToChallenge)}
                        className="py-1.5 px-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        <span>REVANTXA 1v1</span>
                      </button>
                    </div>

                    {/* Desglossament desplegable de totes les partides entre ells */}
                    {isExpanded && pair.matches && pair.matches.length > 0 && (
                      <div className="mt-3.5 pt-3.5 border-t border-slate-800/90 space-y-2 animate-fadeIn">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
                          <span className="flex items-center gap-1.5 text-amber-400">
                            <Trophy className="w-3.5 h-3.5" />
                            <span>Desglossament de duels entre {pair.p1Name} i {pair.p2Name}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal">Més recents primer</span>
                        </div>

                        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                          {pair.matches.map((m, mIdx) => (
                            <div
                              key={m.id || mIdx}
                              className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/80 hover:border-slate-700 text-xs transition-all"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0 w-6">
                                  #{pair.matches.length - mIdx}
                                </span>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-slate-200 font-semibold truncate">
                                    {formatFullCatalanDate(m.endedAt)}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {m.timeAgoText}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono font-black text-xs">
                                  <span className={m.isP1Winner ? 'text-amber-400 font-extrabold' : 'text-slate-400'}>
                                    {m.p1Score}
                                  </span>
                                  <span className="text-slate-600">-</span>
                                  <span className={m.isP2Winner ? 'text-amber-400 font-extrabold' : 'text-slate-400'}>
                                    {m.p2Score}
                                  </span>
                                </div>

                                {m.isDraw ? (
                                  <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/25 text-[10px] font-extrabold">
                                    Empat
                                  </span>
                                ) : m.isP1Winner ? (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-[10px] font-extrabold truncate max-w-[110px]">
                                    🏆 {pair.p1Name}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/25 text-[10px] font-extrabold truncate max-w-[110px]">
                                    🏆 {pair.p2Name}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 7. Historial de Resultats / Últims Duels a Supabase */}
      {!activeGame && activeDuelTab === 'history' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Header & Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
                <h3 className="text-base font-black text-white">Historial de Duels / Últims Resultats</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Consulta en temps real les partides finalitzades i registrades oficialment a la base de dades.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadHistoryData}
                disabled={isLoadingHistory}
                className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                <span>Actualitzar</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={historySearchTerm}
              onChange={(e) => setHistorySearchTerm(e.target.value)}
              placeholder="Cercar per nom d'opositor o aspirant (Ex: David, Joan, Opos Admin)..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Cards List */}
          {isLoadingHistory && finishedHistory.length === 0 ? (
            <div className="p-10 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
              <RotateCw className="w-6 h-6 animate-spin text-amber-400" />
              <span>Consultant l'historial de marcadors...</span>
            </div>
          ) : filteredFinishedHistory.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs space-y-2">
              <div className="text-2xl">🏆</div>
              <p className="font-bold text-white">No s'han trobat partides finalitzades</p>
              <p className="text-slate-500 max-w-sm mx-auto">
                {historySearchTerm ? "Cap resultat coincideix amb la cerca." : "Quan finalitzin els duels 1v1, es mostraran aquí automàticament en format (David 2 - 1 Joan) amb el seu temps transcorregut."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFinishedHistory.map((match) => {
                const isP1User = match.player1Id === user.uid;
                const isP2User = match.player2Id === user.uid;
                const userInMatch = isP1User || isP2User;
                const isP1Winner = match.winnerUid === match.player1Id || (match.scoreP1 > match.scoreP2 && !match.winnerUid);
                const isP2Winner = match.winnerUid === match.player2Id || (match.scoreP2 > match.scoreP1 && !match.winnerUid);

                const p1ShieldId = resolvePlayerShield(match.player1Id, match.player1ShieldId, match.player1Avatar);
                const p2ShieldId = resolvePlayerShield(match.player2Id, match.player2ShieldId, match.player2Avatar);

                return (
                  <div
                    key={match.id}
                    className={`bg-slate-900/90 border rounded-2xl p-4 sm:p-5 transition-all shadow-lg ${
                      userInMatch ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/15 via-slate-900 to-slate-900' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Header: Result Title & Time (ex: David 2 - 1 Joan · Finalitzat fa 10 min) */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🏆</span>
                        <span className="text-xs sm:text-sm font-black text-white">
                          {match.player1Name} <span className="text-amber-400 font-mono font-bold">{match.scoreP1}</span> - <span className="text-amber-400 font-mono font-bold">{match.scoreP2}</span> {match.player2Name}
                        </span>
                        {match.winnerName && (
                          <span className="hidden sm:inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Guanyador: {match.winnerName}
                          </span>
                        )}
                        {match.isDraw && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            Taules / Empat
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-amber-400/80" />
                        <span className="text-slate-300 font-bold">{formatShortCatalanDate(match.endedAt)}</span>
                        <span>· {match.timeAgoText}</span>
                      </div>
                    </div>

                    {/* Middle Scoreboard */}
                    <div className="grid grid-cols-3 items-center py-4 px-1 gap-2">
                      {/* Player 1 */}
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-1 flex items-center justify-center">
                          <div className={`p-1 rounded-2xl transition-all ${
                            isP1Winner 
                              ? 'ring-2 ring-amber-400/60 shadow-lg shadow-amber-500/25 bg-amber-950/20' 
                              : 'bg-slate-800/40 border border-slate-800'
                          }`}>
                            <ShieldRenderer
                              shieldId={p1ShieldId}
                              size={46}
                              glow={isP1Winner}
                            />
                          </div>
                          {isP1Winner && (
                            <span className="absolute -top-2.5 -right-1 text-sm filter drop-shadow animate-bounce" title="Guanyador">
                              👑
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 max-w-[100px] sm:max-w-[140px] truncate">
                          <span className={`text-xs font-black truncate ${isP1Winner ? 'text-amber-300' : 'text-white'}`}>
                            {match.player1Name}
                          </span>
                          {isP1User && (
                            <span className="text-[9px] font-black px-1 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                              TU
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {match.scoreP1}/4 Ratlles
                        </span>
                      </div>

                      {/* Center Score */}
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-2 sm:gap-3 bg-slate-950 px-3.5 sm:px-5 py-2 rounded-2xl border border-slate-800 shadow-inner">
                          <span className={`text-2xl sm:text-3xl font-black font-mono ${isP1Winner ? 'text-amber-400' : 'text-slate-300'}`}>
                            {match.scoreP1}
                          </span>
                          <span className="text-xs font-black text-slate-600">VS</span>
                          <span className={`text-2xl sm:text-3xl font-black font-mono ${isP2Winner ? 'text-amber-400' : 'text-slate-300'}`}>
                            {match.scoreP2}
                          </span>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 mt-1.5">
                          {match.isDraw ? 'Taules' : 'Finalitzat'}
                        </span>
                      </div>

                      {/* Player 2 */}
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-1 flex items-center justify-center">
                          <div className={`p-1 rounded-2xl transition-all ${
                            isP2Winner 
                              ? 'ring-2 ring-amber-400/60 shadow-lg shadow-amber-500/25 bg-amber-950/20' 
                              : 'bg-slate-800/40 border border-slate-800'
                          }`}>
                            <ShieldRenderer
                              shieldId={p2ShieldId}
                              size={46}
                              glow={isP2Winner}
                            />
                          </div>
                          {isP2Winner && (
                            <span className="absolute -top-2.5 -right-1 text-sm filter drop-shadow animate-bounce" title="Guanyador">
                              👑
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 max-w-[100px] sm:max-w-[140px] truncate">
                          <span className={`text-xs font-black truncate ${isP2Winner ? 'text-amber-300' : 'text-white'}`}>
                            {match.player2Name}
                          </span>
                          {isP2User && (
                            <span className="text-[9px] font-black px-1 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                              TU
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {match.scoreP2}/4 Ratlles
                        </span>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Partida 1v1 oficial registrada</span>
                      <span className="font-mono">ID: {match.id.substring(0, 8)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                  <span>Opositors Registrats ({registeredUsers.length})</span>
                </span>
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

              {/* List of registered users */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[240px]">
                {sortedAndFilteredUsers.map(target => (
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
                            target.activity.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                          }`}
                          title={target.activity.isOnline ? 'En línia' : 'Desconnectat'}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white truncate max-w-[120px]">{target.displayName}</span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${target.activity.speedBadgeClass}`}>
                            {target.activity.speedLabel}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {target.rank.badge} {target.rank.title} • <span className="text-amber-400 font-bold">{target.xp} XP</span>
                        </div>
                        <div className="text-[9px] text-slate-500 truncate">
                          {target.activity.activityText}
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
