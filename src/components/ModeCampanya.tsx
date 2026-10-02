import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserProfile, QuestionAmbit, Question } from '../types';
import { getQuestionsByAmbit, selectSmartQuestion } from '../data/questionsBank';
import { getCustomShields } from '../data/badges';
import { QuestionCard } from './QuestionCard';
import { ShieldRenderer } from './ShieldRenderer';
import { MinijocOficina } from './MinijocOficina';
import { MinijocCircuitAgilitat } from './MinijocCircuitAgilitat';
import { 
  syncSupabaseOcaProgress, 
  fetchSupabaseOcaProgress, 
  fetchOcaActivePlayers,
  syncSupabaseUserGameData
} from '../../supabase';
import { triggerOcaOvertakeNotification } from '../utils/pushNotifications';
import confetti from 'canvas-confetti';
import { 
  Car, 
  MapPin, 
  Sparkles, 
  RotateCcw, 
  Flag, 
  Trophy, 
  ArrowRight,
  Shield,
  Zap,
  Users,
  CheckCircle2,
  Lock,
  Unlock,
  Crown,
  Scale,
  Activity,
  FolderCheck,
  ShieldAlert,
  Flame,
  ChevronRight
} from 'lucide-react';

interface ModeCampanyaProps {
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
  onUnlockShield?: (shieldId: string) => void;
  onUpdateWildcards?: (delta: number) => void;
}

export const TOTAL_TILES = 100;
export const MIDPOINT_TILES = 50;

// Caselles especials de l'Oca Policial (1 a 100)
// Reduïm els +3 a la segona meitat (51 a 100)
export const MOSSO_OCA_TILES = [5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 55, 68, 88];
// 1 control a la primera meitat (34) i 1 control a la segona meitat (84)
export const CONTROL_POLICIAL_TILES = [34, 84];
// Minijoc "Ordena l'oficina" (Candy Crash policial)
export const OFICINA_TILES = [62, 77, 95];
// Minijoc "Circuit d'agilitat" (cursa d'agilitat i velocitat)
export const CIRCUIT_AGILITAT_TILES = [65, 82];
// Caselles d'Impugnació (penalització de -3 si falles)
export const IMPUGNACIO_TILES = [59, 74, 92];

// Recompenses d'escut de mèrit oficial en superar la casella 50 de cada àmbit
const AMBIT_SHIELD_REWARDS: Record<QuestionAmbit, { id: string; name: string; unit: string }> = {
  'Àmbit A': { id: 'usc', name: 'USC - Seguretat Ciutadana', unit: 'Unitat de Seguretat Ciutadana' },
  'Àmbit B': { id: 'dic', name: 'DIC - Investigació Criminal', unit: 'Divisió d’Investigació Criminal' },
  'Àmbit C': { id: 'arro', name: 'ARRO - Recursos Operatius', unit: 'Àrea Regional de Recursos Operatius' },
  'Actualitat': { id: 'transit', name: 'Trànsit - Divisió de Trànsit', unit: 'Divisió de Trànsit' },
  'ISPC': { id: 'gei', name: 'GEI - Grup Especial d’Intervenció', unit: 'Grup Especial d’Intervenció' }
};

// Recompenses d'escut d'or llegendari en superar la casella 100 per cada àmbit
export const AMBIT_LEGENDARY_SHIELD_REWARDS: Record<QuestionAmbit, { id: string; name: string; unit: string }> = {
  'Àmbit A': { id: 'escut_llegenda_ambit_a', name: 'Escut d\'Or Llegendari - Seguretat Ciutadana', unit: 'Llegenda Àmbit A - Mossos d\'Esquadra' },
  'Àmbit B': { id: 'escut_llegenda_ambit_b', name: 'Escut d\'Or Llegendari - Investigació Criminal', unit: 'Llegenda Àmbit B - Mossos d\'Esquadra' },
  'Àmbit C': { id: 'escut_llegenda_ambit_c', name: 'Escut d\'Or Llegendari - Recursos Operatius', unit: 'Llegenda Àmbit C - Mossos d\'Esquadra' },
  'Actualitat': { id: 'escut_llegenda_actualitat', name: 'Escut d\'Or Llegendari - Trànsit & Actualitat', unit: 'Llegenda Actualitat - Mossos d\'Esquadra' },
  'ISPC': { id: 'escut_llegenda_ispc', name: 'Escut d\'Or Llegendari - ISPC Intervenció', unit: 'Llegenda ISPC - Mossos d\'Esquadra' }
};

export const LEGENDARY_SHIELD_ID = 'escut_llegenda';

interface BoardProgression {
  [ambit: string]: number; // tile index 0 to 100
}

interface ActiveQuestionSession {
  question: Question;
  selectedIndex: number | null;
  isAnswered: boolean;
  ambit: QuestionAmbit;
  tileAtQuestion: number;
  lastEventMsg?: string | null;
  disabledIndices?: number[];
  timestamp: number;
  isImpugnacio?: boolean;
}

export const ModeCampanya: React.FC<ModeCampanyaProps> = ({
  user,
  onUpdateUserStats,
  onSaveQuestionToggle,
  onUnlockShield,
  onUpdateWildcards
}) => {
  const [selectedAmbit, setSelectedAmbit] = useState<QuestionAmbit>('Àmbit A');
  const [boardProgress, setBoardProgress] = useState<BoardProgression>(() => {
    try {
      const saved = localStorage.getItem(`agent_medina_board_${user.uid}`);
      return saved ? JSON.parse(saved) : { 'Àmbit A': 0, 'Àmbit B': 0, 'Àmbit C': 0, 'Actualitat': 0, 'ISPC': 0 };
    } catch (e) {
      return { 'Àmbit A': 0, 'Àmbit B': 0, 'Àmbit C': 0, 'Actualitat': 0, 'ISPC': 0 };
    }
  });

  const [activeSession, setActiveSession] = useState<ActiveQuestionSession | null>(null);
  const [lastEventMsg, setLastEventMsg] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [earnedAmbitShield, setEarnedAmbitShield] = useState<{ id: string; name: string; unit: string } | null>(null);
  const [earnedLegendaryShield, setEarnedLegendaryShield] = useState(false);
  const [activePlayers, setActivePlayers] = useState<any[]>([]);
  const [isConsecutiveMode, setIsConsecutiveMode] = useState<boolean>(true);
  const [isCloudLoaded, setIsCloudLoaded] = useState<boolean>(false);

  // Minigame modal states
  const [showOficinaModal, setShowOficinaModal] = useState<boolean>(false);
  const [showCircuitModal, setShowCircuitModal] = useState<boolean>(false);
  const questionContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll suau cap a l'inici de la targeta de pregunta cada cop que es canvia de pregunta
  useEffect(() => {
    if (activeSession && questionContainerRef.current) {
      questionContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeSession?.question?.id]);

  const currentTile = boardProgress[selectedAmbit] || 0;
  const isSecondHalfUnlocked = currentTile >= MIDPOINT_TILES;

  // Check if current user is admin (full access to test any tile!)
  const isAdmin = Boolean(
    user.isAdmin || 
    (user.email && user.email.toLowerCase().trim() === 'opossscar@gmail.com')
  );

  const activeCustomShield = useMemo(() => {
    const list = getCustomShields();
    return list.find(s => s.ambitDesbloqueig === selectedAmbit) || list.find(s => s.id === AMBIT_SHIELD_REWARDS[selectedAmbit]?.id);
  }, [selectedAmbit]);

  // Escut Llegendari (Casella 100) específic de l'àmbit actual, configurable per l'admin a la botiga
  const activeCustomLegendaryShield = useMemo(() => {
    const list = getCustomShields();
    const ambitC100Tag = `Casella 100 (${selectedAmbit})`;
    return (
      list.find(s => s.ambitDesbloqueig === ambitC100Tag) ||
      list.find(s => s.id === AMBIT_LEGENDARY_SHIELD_REWARDS[selectedAmbit]?.id) ||
      list.find(s => s.ambitDesbloqueig === 'Casella 100') ||
      list.find(s => s.id === LEGENDARY_SHIELD_ID)
    );
  }, [selectedAmbit]);

  // 1. CARREGA INICIAL I SINCRO CLOUD SUPABASE
  useEffect(() => {
    let isMounted = true;

    async function loadCloudOcaState() {
      try {
        const cloudData = await fetchSupabaseOcaProgress(user.uid);
        if (cloudData && isMounted) {
          if (cloudData.boardProgress) {
            setBoardProgress(prev => ({
              ...prev,
              ...cloudData.boardProgress
            }));
            localStorage.setItem(`agent_medina_board_${user.uid}`, JSON.stringify({
              ...boardProgress,
              ...cloudData.boardProgress
            }));
          }

          if (cloudData.selectedAmbit) {
            setSelectedAmbit(cloudData.selectedAmbit);
          }

          // Anti-trampes: Restaurar la pregunta activa si existia
          if (cloudData.activeQuestionState && cloudData.activeQuestionState.question) {
            setActiveSession(cloudData.activeQuestionState);
            if (cloudData.activeQuestionState.lastEventMsg) {
              setLastEventMsg(cloudData.activeQuestionState.lastEventMsg);
            }
          }
        }
      } catch (err) {
        console.warn('Error loading Supabase Oca state:', err);
      } finally {
        if (isMounted) setIsCloudLoaded(true);
      }
    }

    loadCloudOcaState();

    return () => {
      isMounted = false;
    };
  }, [user.uid]);

  // 2. SINCRONITZACIÓ DE JUGADORS EN TEMPS REAL
  useEffect(() => {
    let isMounted = true;
    async function loadActivePlayers() {
      const players = await fetchOcaActivePlayers(selectedAmbit);
      if (isMounted) {
        setActivePlayers(players.filter(p => p.userId !== user.uid));
      }
    }

    loadActivePlayers();
    const interval = setInterval(loadActivePlayers, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedAmbit, user.uid]);

  // 3. VALIDACIÓ DE LA CASELLA 50 (Escut d'Àmbit) I CASELLA 100 (Escut Llegendari)
  useEffect(() => {
    const customList = getCustomShields();
    Object.entries(boardProgress).forEach(([ambit, tile]) => {
      const tileNum = Number(tile);
      
      // Casella 50 assolida
      if (tileNum >= MIDPOINT_TILES) {
        const customForAmbit = customList.filter(s => s.ambitDesbloqueig === ambit);
        const defaultReward = AMBIT_SHIELD_REWARDS[ambit as QuestionAmbit];
        const allRewardsToUnlock: string[] = [];

        if (defaultReward?.id) allRewardsToUnlock.push(defaultReward.id);
        customForAmbit.forEach(s => {
          if (s.id && !allRewardsToUnlock.includes(s.id)) {
            allRewardsToUnlock.push(s.id);
          }
        });

        let updatedUnlockedList = [...(user.unlockedShieldIds || [])];
        let hasNew = false;

        allRewardsToUnlock.forEach(rewardId => {
          if (!updatedUnlockedList.includes(rewardId)) {
            if (onUnlockShield) onUnlockShield(rewardId);
            updatedUnlockedList.push(rewardId);
            hasNew = true;
          }
        });

        if (hasNew) {
          syncSupabaseUserGameData(user.uid, {
            unlockedShieldIds: Array.from(new Set(updatedUnlockedList)),
            boardProgress
          });
        }
      }

      // Casella 100 assolida: NIVELL LLEGENDARI!
      if (tileNum >= TOTAL_TILES) {
        setEarnedLegendaryShield(true);
        const ambitC100Tag = `Casella 100 (${ambit})`;
        const customLeg = customList.find(s => s.ambitDesbloqueig === ambitC100Tag) ||
                          customList.find(s => s.id === AMBIT_LEGENDARY_SHIELD_REWARDS[ambit as QuestionAmbit]?.id) ||
                          customList.find(s => s.id === LEGENDARY_SHIELD_ID);
        const legShieldId = customLeg?.id || AMBIT_LEGENDARY_SHIELD_REWARDS[ambit as QuestionAmbit]?.id || LEGENDARY_SHIELD_ID;

        if (onUnlockShield && !user.unlockedShieldIds?.includes(legShieldId)) {
          onUnlockShield(legShieldId);
          const updatedUnlocked = Array.from(new Set([...(user.unlockedShieldIds || []), legShieldId]));
          syncSupabaseUserGameData(user.uid, {
            unlockedShieldIds: updatedUnlocked,
            boardProgress
          });
        }
      }
    });
  }, [boardProgress, user.uid, user.unlockedShieldIds, onUnlockShield]);

  // Guardar progrés a Supabase
  const saveCloudOca = async (newBoard: BoardProgression, currentActiveSession?: ActiveQuestionSession | null) => {
    setBoardProgress(newBoard);
    try {
      localStorage.setItem(`agent_medina_board_${user.uid}`, JSON.stringify(newBoard));
    } catch (e) {}

    await syncSupabaseOcaProgress({
      userId: user.uid,
      userName: user.displayName,
      avatarShield: user.equippedShieldId,
      selectedAmbit,
      currentTile: newBoard[selectedAmbit] || 0,
      boardProgress: newBoard,
      activeQuestionState: currentActiveSession ?? activeSession
    });
  };

  const ambitsList: { id: QuestionAmbit; label: string; desc: string; icon: string }[] = [
    { id: 'Àmbit A', label: 'Àmbit A (Entorn)', desc: 'Història, Sociolingüística, Geografia, Societat i TIC', icon: '🌍' },
    { id: 'Àmbit B', label: 'Àmbit B (Institucional)', desc: 'EAC, Parlament, CE, Drets Humans, Estat i UE', icon: '🏛️' },
    { id: 'Àmbit C', label: 'Àmbit C (Seguretat)', desc: 'Competències, Interior, Marc Legal LO 2/86 i Codi Ètica', icon: '👮' },
    { id: 'Actualitat', label: 'Actualitat & Cultura', desc: 'Pla Mossos 2030, noves uniformitats i acords de seguretat', icon: '📰' },
    { id: 'ISPC', label: 'Direcció ISPC (Global)', desc: 'Repte mestre amb preguntes de tots els àmbits integrats', icon: '🎓' },
  ];

  // Iniciar una pregunta o disparar minijoc segons la casella
  const handleStartQuestion = (tileForQuestion = currentTile) => {
    // Si la casella és "Ordena l'oficina", obrim el minijoc Match-3
    if (OFICINA_TILES.includes(tileForQuestion)) {
      setShowOficinaModal(true);
      return;
    }

    // Si la casella és "Circuit d'agilitat", obrim el minijoc de curses
    if (CIRCUIT_AGILITAT_TILES.includes(tileForQuestion)) {
      setShowCircuitModal(true);
      return;
    }

    const questions = getQuestionsByAmbit(selectedAmbit);
    if (questions.length === 0) return;
    
    // Selecció intel·ligent: 80% vírgens noves, 20% repàs d'errors / consolidació
    const chosenQ = selectSmartQuestion(questions, {
      answeredQuestionIds: user.answeredQuestionIds,
      failedQuestionIds: user.failedQuestionIds,
      questionMistakesCount: user.questionMistakesCount
    }) || questions[Math.floor(Math.random() * questions.length)];
    
    const isImpugnacio = IMPUGNACIO_TILES.includes(tileForQuestion);

    const newSession: ActiveQuestionSession = {
      question: chosenQ,
      selectedIndex: null,
      isAnswered: false,
      ambit: selectedAmbit,
      tileAtQuestion: tileForQuestion,
      lastEventMsg: null,
      disabledIndices: [],
      timestamp: Date.now(),
      isImpugnacio
    };

    setActiveSession(newSession);
    setLastEventMsg(null);

    syncSupabaseOcaProgress({
      userId: user.uid,
      userName: user.displayName,
      avatarShield: user.equippedShieldId,
      selectedAmbit,
      currentTile: tileForQuestion,
      boardProgress,
      activeQuestionState: newSession
    });
  };

  // Comodí 50%
  const handleUseWildcard = () => {
    if ((user.wildcardsCount || 0) > 0) {
      if (onUpdateWildcards) {
        onUpdateWildcards(-1);
      } else {
        onUpdateUserStats(0, 0);
      }
      return true;
    } else if (user.merits >= 10) {
      onUpdateUserStats(0, -10);
      return true;
    } else {
      alert("Et calen 10 Mèrits o 1 Comodí 50% a la botiga per utilitzar aquesta ajuda.");
      return false;
    }
  };

  // Resposta a la pregunta normal o casella especial
  const handleAnswerOutcome = (isCorrect: boolean, selectedIdx?: number) => {
    if (!activeSession) return;

    const tileAtQ = activeSession.tileAtQuestion;
    const wasOnMosso = MOSSO_OCA_TILES.includes(tileAtQ);
    const wasOnControl = CONTROL_POLICIAL_TILES.includes(tileAtQ); // Casella 34 o 84
    const wasOnImpugnacio = IMPUGNACIO_TILES.includes(tileAtQ); // Casella d'impugnació

    let newTile = tileAtQ;
    let eventText = '';

    if (isCorrect) {
      let extraXp = 25;
      let extraMerits = 3;

      if (wasOnMosso) {
        newTile = Math.min(TOTAL_TILES, tileAtQ + 3);
        extraXp += 35;
        extraMerits += 5;
        eventText = '✓ Resposta correcta a la casella Mosso! 🚨 DE MOSSO A MOSSO: saltes +3 caselles (+60 XP, +5 Mèrits)!';
      } else if (wasOnControl) {
        newTile = Math.min(TOTAL_TILES, tileAtQ + 1);
        extraXp += 40;
        extraMerits += 6;
        eventText = `✓ Has superat el Control Policial de la casella ${tileAtQ}! Avança amb èxit (+65 XP, +6 Mèrits).`;
      } else if (wasOnImpugnacio) {
        newTile = Math.min(TOTAL_TILES, tileAtQ + 1);
        extraXp += 35;
        extraMerits += 4;
        eventText = '✓ Has superat la Casella d\'Impugnació sense fallar! Avança +1 casella.';
      } else {
        newTile = Math.min(TOTAL_TILES, tileAtQ + 1);
        eventText = '✓ Resposta correcta! Avança +1 casella (+25 XP, +3 Mèrits).';
        if (MOSSO_OCA_TILES.includes(newTile)) {
          eventText += ' 🚨 Has arribat a una casella Mosso +3!';
        } else if (CONTROL_POLICIAL_TILES.includes(newTile)) {
          eventText += ` 🛑 Has arribat al Control Policial (Casella ${newTile})!`;
        } else if (OFICINA_TILES.includes(newTile)) {
          eventText += ' 📁 Has arribat a "Ordena l\'Oficina" (Candy Crash Policial)!';
        } else if (CIRCUIT_AGILITAT_TILES.includes(newTile)) {
          eventText += ' 🏃‍♂️ Has arribat al Circuit d\'Agilitat!';
        } else if (IMPUGNACIO_TILES.includes(newTile)) {
          eventText += ' ⚖️ Compte! Has entrat a una Casella d\'Impugnació!';
        }
      }

      onUpdateUserStats(extraXp, extraMerits, undefined, undefined, activeSession.question.id, true);

      // Fita 1: Assolir casella 50
      if (newTile >= MIDPOINT_TILES && tileAtQ < MIDPOINT_TILES) {
        const rewardId = activeCustomShield?.id || AMBIT_SHIELD_REWARDS[selectedAmbit]?.id;
        const rewardName = activeCustomShield?.nom || AMBIT_SHIELD_REWARDS[selectedAmbit]?.name;
        const rewardUnit = activeCustomShield?.unitat || AMBIT_SHIELD_REWARDS[selectedAmbit]?.unit;

        const idsToUnlock = [rewardId];
        if (AMBIT_SHIELD_REWARDS[selectedAmbit]?.id && !idsToUnlock.includes(AMBIT_SHIELD_REWARDS[selectedAmbit].id)) {
          idsToUnlock.push(AMBIT_SHIELD_REWARDS[selectedAmbit].id);
        }

        idsToUnlock.forEach(id => {
          if (id && onUnlockShield) {
            onUnlockShield(id);
          }
        });

        if (rewardId) {
          setEarnedAmbitShield({ id: rewardId, name: rewardName, unit: rewardUnit });
        }
        onUpdateUserStats(300, 30);
        eventText = `🎖️ ENHORABONA! Has assolit la Casella 50 de ${selectedAmbit}! Escut d'Unitat "${rewardName}" desbloquejat (+30 Mèrits, +300 XP)! Desbloquejat el camí Llegendari (51-100)!`;
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }

      // Fita 2: Assolir casella 100 (NIVELL LLEGENDARI)
      if (newTile >= TOTAL_TILES) {
        newTile = TOTAL_TILES;
        setIsCompleted(true);
        setEarnedLegendaryShield(true);
        const legShieldId = activeCustomLegendaryShield?.id || AMBIT_LEGENDARY_SHIELD_REWARDS[selectedAmbit]?.id || LEGENDARY_SHIELD_ID;
        const legShieldName = activeCustomLegendaryShield?.nom || AMBIT_LEGENDARY_SHIELD_REWARDS[selectedAmbit]?.name || "Escut d'Or Llegendari";
        if (onUnlockShield) {
          onUnlockShield(legShieldId);
        }
        onUpdateUserStats(1000, 100);
        eventText = `👑 NIVELL LLEGENDARI ASSOLIT! Has conquerit la CASELLA 100 de ${selectedAmbit}! Has desbloquejat l'escut oficial "${legShieldName}" a la botiga i a la teva col·lecció (+100 Mèrits, +1000 XP)!`;
        confetti({ particleCount: 220, spread: 100, origin: { y: 0.5 } });
      }
    } else {
      // Resposta incorrecta
      onUpdateUserStats(0, 0, activeSession.question.id, undefined, activeSession.question.id, false);

      if (wasOnControl) {
        // En fallar al control: si és 34 torna a 0, si és 84 torna a 50
        newTile = tileAtQ === 84 ? MIDPOINT_TILES : 0;
        eventText = `🛑 CONTROL POLICIAL (Casella ${tileAtQ}): Resposta incorrecta! Tornes a començar des de la casella ${newTile}.`;
      } else if (wasOnImpugnacio) {
        // En casella d'impugnació, si falles retrocedeixes 3 caselles!
        newTile = Math.max(0, tileAtQ - 3);
        eventText = '⚖️ CASELLA D\'IMPUGNACIÓ: Error al dictamen oficial! Penalització estricta: Retrocedeixes 3 caselles (-3).';
      } else {
        const potentialTile = Math.max(0, tileAtQ - 2);
        if (CONTROL_POLICIAL_TILES.includes(potentialTile)) {
          newTile = potentialTile === 84 ? MIDPOINT_TILES : 0;
          eventText = `🛑 CONTROL POLICIAL: En fallar has caigut al Control ${potentialTile}! Tornes a la casella ${newTile}.`;
        } else {
          newTile = potentialTile;
          eventText = wasOnMosso
            ? '✗ Resposta incorrecta a la casella Mosso. Retrocedeixes 2 caselles.'
            : '✗ Resposta incorrecta. Retrocedeixes 2 caselles per repassar conceptes.';
        }
      }
    }

    const updatedBoard = {
      ...boardProgress,
      [selectedAmbit]: newTile
    };

    const chosenIndex = selectedIdx !== undefined ? selectedIdx : activeSession.selectedIndex;
    const updatedSession: ActiveQuestionSession = {
      ...activeSession,
      selectedIndex: chosenIndex,
      isAnswered: true,
      lastEventMsg: eventText,
      timestamp: Date.now()
    };

    setActiveSession(updatedSession);
    setLastEventMsg(eventText);
    saveCloudOca(updatedBoard, updatedSession);
  };

  // Recompensa de "Ordena l'oficina"
  const handleOficinaComplete = (jumpTiles: number, msg?: string) => {
    setShowOficinaModal(false);
    if (jumpTiles > 0) {
      const newTile = Math.min(TOTAL_TILES, currentTile + jumpTiles);
      const updatedBoard = { ...boardProgress, [selectedAmbit]: newTile };
      setLastEventMsg(msg || `📁 Minijoc superat: Has saltat +${jumpTiles} caselles!`);
      saveCloudOca(updatedBoard, null);

      if (newTile >= TOTAL_TILES) {
        setIsCompleted(true);
        setEarnedLegendaryShield(true);
        const legShieldId = activeCustomLegendaryShield?.id || AMBIT_LEGENDARY_SHIELD_REWARDS[selectedAmbit]?.id || LEGENDARY_SHIELD_ID;
        if (onUnlockShield) onUnlockShield(legShieldId);
        onUpdateUserStats(1000, 100);
      }
    } else if (jumpTiles < 0) {
      // Penalització per perdre totes les vides: retrocedeix 3 caselles (-3)
      let newTile = Math.max(0, currentTile + jumpTiles);
      // Comprovar si cau en un control policial
      if (CONTROL_POLICIAL_TILES.includes(newTile)) {
        newTile = newTile === 84 ? MIDPOINT_TILES : 0;
      }
      const updatedBoard = { ...boardProgress, [selectedAmbit]: newTile };
      setLastEventMsg(msg || `📁 Derrota a l'oficina: Has perdut totes les vides! Retrocedeixes 3 caselles (${jumpTiles}).`);
      saveCloudOca(updatedBoard, null);
    } else {
      setLastEventMsg(msg || "No has avançat caselles a l'oficina.");
    }
  };

  // Recompensa de "Circuit d'agilitat"
  const handleCircuitComplete = (advanceTiles: number, msg?: string) => {
    setShowCircuitModal(false);
    if (advanceTiles > 0) {
      const newTile = Math.min(TOTAL_TILES, currentTile + advanceTiles);
      const updatedBoard = { ...boardProgress, [selectedAmbit]: newTile };
      setLastEventMsg(msg || `🏃‍♂️ Circuit d'agilitat completat: Avances +${advanceTiles} caselles!`);
      saveCloudOca(updatedBoard, null);

      if (newTile >= TOTAL_TILES) {
        setIsCompleted(true);
        setEarnedLegendaryShield(true);
        const legShieldId = activeCustomLegendaryShield?.id || AMBIT_LEGENDARY_SHIELD_REWARDS[selectedAmbit]?.id || LEGENDARY_SHIELD_ID;
        if (onUnlockShield) onUnlockShield(legShieldId);
        onUpdateUserStats(1000, 100);
      }
    } else {
      setLastEventMsg(msg || "Has arribat en darrera posició. Repeteixes circuit sense avançar.");
    }
  };

  // ADMIN OVERRIDE: L'administrador pot clicar qualsevol casella per provar-la
  const handleAdminJumpToTile = async (targetTile: number) => {
    if (!isAdmin) return;
    const clamped = Math.max(0, Math.min(TOTAL_TILES, targetTile));
    const updatedBoard = {
      ...boardProgress,
      [selectedAmbit]: clamped
    };
    setActiveSession(null);
    setLastEventMsg(`⚡ [MODE ADMIN]: Has saltat directament a la Casella ${clamped} (${selectedAmbit}) per a proves.`);
    await saveCloudOca(updatedBoard, null);

    if (clamped >= TOTAL_TILES) {
      setIsCompleted(true);
      setEarnedLegendaryShield(true);
      const legShieldId = activeCustomLegendaryShield?.id || AMBIT_LEGENDARY_SHIELD_REWARDS[selectedAmbit]?.id || LEGENDARY_SHIELD_ID;
      if (onUnlockShield) onUnlockShield(legShieldId);
    }
  };

  // Mode Consecutiu
  const handleNextConsecutiveQuestion = () => {
    const updatedTile = boardProgress[selectedAmbit] || 0;
    if (updatedTile >= TOTAL_TILES) {
      setActiveSession(null);
      return;
    }
    handleStartQuestion(updatedTile);
    setTimeout(() => {
      questionContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  const handleCloseToBoard = () => {
    setActiveSession(null);
    syncSupabaseOcaProgress({
      userId: user.uid,
      userName: user.displayName,
      avatarShield: user.equippedShieldId,
      selectedAmbit,
      currentTile,
      boardProgress,
      activeQuestionState: null
    });
  };

  const resetBoard = async () => {
    if (confirm('Vols reiniciar aquest tauler des de la casella 0?')) {
      const reset = {
        ...boardProgress,
        [selectedAmbit]: 0
      };
      setActiveSession(null);
      setIsCompleted(false);
      setLastEventMsg('Tauler reiniciat.');
      await saveCloudOca(reset, null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Board Ambit Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                <span>🎲</span>
                <span>Tauler de l'Oca Policial (100 Caselles)</span>
              </h2>
              {isAdmin && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 shadow-sm">
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  <span>ADMIN: Totes les caselles desbloquejades</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Etapa 1 (1-50): <b>Escut d'Àmbit</b>. Etapa 2 (51-100): <b>Nivell Llegendari</b> amb minijocs "Circuit d'Agilitat" i "Ordena l'Oficina", Controls i Impugnacions!
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Mode Consecutiu */}
            <button
              onClick={() => setIsConsecutiveMode(!isConsecutiveMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isConsecutiveMode
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Permet respondre preguntes una rere l'altra directament"
            >
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span>Mode Consecutiu: {isConsecutiveMode ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={resetBoard}
              title="Reiniciar aquest tauler"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
          </div>
        </div>

        {/* 5 Tableros Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {ambitsList.map((item) => {
            const isSelected = selectedAmbit === item.id;
            const progress = boardProgress[item.id] || 0;
            const percent = Math.round((progress / TOTAL_TILES) * 100);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedAmbit(item.id);
                  setActiveSession(null);
                  setIsCompleted(progress >= TOTAL_TILES);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-slate-800/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-lg">{item.icon}</span>
                  <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${
                    progress >= TOTAL_TILES 
                      ? 'bg-amber-400 text-slate-950 font-black' 
                      : progress >= MIDPOINT_TILES 
                      ? 'bg-emerald-500 text-slate-950' 
                      : 'bg-slate-700 text-amber-300'
                  }`}>
                    {progress}/{TOTAL_TILES}
                  </span>
                </div>
                <div className="text-xs font-extrabold truncate">{item.label}</div>
                <div className="w-full bg-slate-700/50 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Board Display */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
        {/* Status Bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <span>Tauler Actiu:</span>
                <span className="text-amber-400 font-bold">{selectedAmbit}</span>
                {currentTile >= MIDPOINT_TILES ? (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-black flex items-center gap-1 border border-amber-500/30">
                    <Crown className="w-3 h-3 text-amber-400" /> Nivell Llegendari
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                    Fase de Promoció (Fins a la casella 50)
                  </span>
                )}
              </div>
              <div className="text-lg font-black text-white flex items-center gap-2">
                <span>Casella {currentTile} de {TOTAL_TILES}</span>
                {OFICINA_TILES.includes(currentTile) && (
                  <span className="text-xs font-extrabold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30">
                    📁 Ordena l'Oficina
                  </span>
                )}
                {CIRCUIT_AGILITAT_TILES.includes(currentTile) && (
                  <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                    🏃‍♂️ Circuit d'Agilitat
                  </span>
                )}
                {IMPUGNACIO_TILES.includes(currentTile) && (
                  <span className="text-xs font-extrabold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-lg border border-rose-500/30">
                    ⚖️ Casella d'Impugnació
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentTile < TOTAL_TILES && !activeSession && (
              <button
                type="button"
                onClick={() => handleStartQuestion(currentTile)}
                className="py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 cursor-pointer"
              >
                {OFICINA_TILES.includes(currentTile) ? (
                  <>
                    <FolderCheck className="w-5 h-5" />
                    <span>Jugar Ordena l'Oficina 📁</span>
                  </>
                ) : CIRCUIT_AGILITAT_TILES.includes(currentTile) ? (
                  <>
                    <Activity className="w-5 h-5" />
                    <span>Córrer Circuit d'Agilitat 🏃‍♂️</span>
                  </>
                ) : (
                  <>
                    <Car className="w-5 h-5" />
                    <span>Respondre Repte</span>
                  </>
                )}
              </button>
            )}

            {currentTile >= TOTAL_TILES && (
              <div className="px-4 py-2 bg-gradient-to-r from-amber-500/30 to-yellow-500/30 border border-amber-400 text-amber-300 font-black text-xs rounded-xl flex items-center gap-2 shadow-lg">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>NIVELL LLEGENDARI ASSOLIT! (Casella 100)</span>
              </div>
            )}
          </div>
        </div>

        {/* Admin Quick Jump Toolbar */}
        {isAdmin && (
          <div className="mb-6 p-3 bg-rose-950/30 border border-rose-500/40 rounded-2xl flex items-center justify-between gap-2 flex-wrap text-xs text-rose-200">
            <div className="flex items-center gap-2 font-bold">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Panell de Proves Admin: Clica QUALSEVOL casella al tauler o fes un salt ràpid:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: 'C0', tile: 0 },
                { label: 'C34 (Control 1)', tile: 34 },
                { label: 'C50 (Meta Àmbit)', tile: 50 },
                { label: 'C59 (Impugnació)', tile: 59 },
                { label: 'C62 (Oficina)', tile: 62 },
                { label: 'C65 (Circuit)', tile: 65 },
                { label: 'C74 (Impugnació)', tile: 74 },
                { label: 'C77 (Oficina)', tile: 77 },
                { label: 'C82 (Circuit)', tile: 82 },
                { label: 'C84 (Control 2)', tile: 84 },
                { label: 'C92 (Impugnació)', tile: 92 },
                { label: 'C95 (Oficina)', tile: 95 },
                { label: 'C99', tile: 99 },
                { label: 'C100 (Llegendari 👑)', tile: 100 },
              ].map(jump => (
                <button
                  key={jump.tile}
                  type="button"
                  onClick={() => handleAdminJumpToTile(jump.tile)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-rose-600 hover:text-white text-rose-300 border border-rose-500/40 rounded-lg text-[11px] font-black transition-colors cursor-pointer"
                >
                  {jump.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Legendary Shield Unlocked Banner (Casella 100) */}
        {currentTile >= TOTAL_TILES && (
          <div className="mb-6 p-5 bg-gradient-to-r from-amber-500/30 via-yellow-500/25 to-amber-600/30 border-2 border-amber-400 rounded-3xl flex flex-col sm:flex-row items-center gap-4 justify-between shadow-2xl animate-in fade-in">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-400/20 rounded-2xl border border-amber-300 shrink-0">
                <Crown className="w-10 h-10 text-amber-300 animate-bounce" />
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-amber-200 flex items-center gap-2">
                  <span>👑</span>
                  <span>CONQUERIDOR DE LA CASELLA 100: NIVELL LLEGENDARI ({selectedAmbit})!</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-200 mt-1">
                  Has completat íntegrament el Tauler de 100 caselles de {selectedAmbit}! Desbloquejat a la botiga i equipat l'<b>{activeCustomLegendaryShield?.nom || "Escut d'Or Llegendari"}</b> (+1000 XP, +100 Mèrits)!
                </div>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-center">
              <ShieldRenderer shieldId={activeCustomLegendaryShield?.id || LEGENDARY_SHIELD_ID} shieldData={activeCustomLegendaryShield} size={64} glow={true} />
              <span className="text-[10px] font-black text-amber-300 mt-1 uppercase tracking-wider">Llegendari</span>
            </div>
          </div>
        )}

        {/* Event / Outcome notification */}
        {lastEventMsg && (
          <div className="mb-6 p-4 bg-slate-950 border border-amber-500/40 rounded-2xl text-xs sm:text-sm font-bold text-amber-300 shadow-md animate-in fade-in">
            {lastEventMsg}
          </div>
        )}

        {/* Active Question Modal / Consecutive Flow */}
        {activeSession && (
          <div ref={questionContainerRef} className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300 border border-sky-500/40 rounded-2xl p-1 bg-gradient-to-b from-sky-950/20 to-slate-900 shadow-2xl scroll-mt-20">
            <div className="flex items-center justify-between px-4 py-2 bg-sky-950/40 border-b border-sky-500/30 rounded-t-xl text-xs">
              <div className="flex items-center gap-2 text-sky-300 font-bold">
                <Car className="w-4 h-4 text-sky-400" />
                <span>Casella {activeSession.tileAtQuestion} - {selectedAmbit}</span>
                {activeSession.isImpugnacio && (
                  <span className="text-[10px] bg-rose-500/30 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/50 font-black">
                    ⚖️ IMPUGNACIÓ (-3 si falles)
                  </span>
                )}
                <span className="text-[10px] text-sky-400/70 font-mono">(Anti-trampa núvol actiu)</span>
              </div>
              <button
                onClick={handleCloseToBoard}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg cursor-pointer"
              >
                Veure Tauler ♟️
              </button>
            </div>

            <QuestionCard
              question={activeSession.question}
              onAnswerSelected={handleAnswerOutcome}
              onSaveToggle={onSaveQuestionToggle}
              isSaved={user.savedQuestionIds?.includes(activeSession.question.id)}
              onNext={handleCloseToBoard}
              nextButtonLabel="Veure Tauler de 100 Caselles ♟️"
              onNextDirect={currentTile < TOTAL_TILES ? handleNextConsecutiveQuestion : undefined}
              nextDirectLabel="Següent Pregunta Directa ➔"
              onUseWildcard={handleUseWildcard}
              wildcardsCount={user.wildcardsCount || 0}
              userMerits={user.merits || 0}
              initialIsAnswered={activeSession.isAnswered}
              initialSelectedIndex={activeSession.selectedIndex}
              initialDisabledIndices={activeSession.disabledIndices}
              mistakeCount={user.questionMistakesCount?.[activeSession.question.id] || (user.failedQuestionIds?.includes(activeSession.question.id) ? 1 : 0)}
            />
          </div>
        )}

        {/* SECTION 1: CASELLAS 0 A 50 (ETAPA DE PROMOCIÓ) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <h3 className="text-sm font-black text-slate-200 flex items-center gap-2">
              <span className="p-1 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">1-50</span>
              <span>Etapa de Promoció (Escut d'Unitat)</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Caselles 0 a 50
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-2.5 select-none">
            {Array.from({ length: 51 }).map((_, tileNum) => {
              return renderTileCell(tileNum);
            })}
          </div>
        </div>

        {/* SECTION 2: CASELLAS 51 A 100 (ETAPA LLEGENDÀRIA) */}
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black text-xs">51-100</span>
              <h3 className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Etapa Llegendària (Caselles 51 a 100)</span>
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {!isSecondHalfUnlocked && !isAdmin ? (
                <span className="text-xs text-slate-500 flex items-center gap-1 font-bold">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Desbloqueig en assolir la Casella 50</span>
                </span>
              ) : (
                <span className="text-xs text-amber-400 flex items-center gap-1 font-bold">
                  <Unlock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Camí Llegendari Actiu</span>
                </span>
              )}
            </div>
          </div>

          {/* Locked Overlay for regular players if < 50 */}
          {!isSecondHalfUnlocked && !isAdmin && (
            <div className="absolute inset-x-0 bottom-0 top-10 z-20 flex flex-col items-center justify-center p-6 bg-slate-950/75 backdrop-blur-[2px] rounded-3xl border border-dashed border-slate-800 text-center">
              <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-700 shadow-xl mb-3">
                <Lock className="w-8 h-8 text-amber-500/80 animate-pulse" />
              </div>
              <h4 className="text-base font-black text-slate-200 mb-1">
                Etapa Llegendària Bloquejada (Caselles 51 a 100)
              </h4>
              <p className="text-xs text-slate-400 max-w-md mb-3">
                Arriba primer a la <b>Casella 50</b> d'aquest àmbit per desbloquejar aquesta secció d'alta dificultat, els minijocs policials i conquerir el Nivell Llegendari.
              </p>
            </div>
          )}

          {/* Grid 51 to 100 */}
          <div className={`grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-2.5 select-none transition-all ${
            !isSecondHalfUnlocked && !isAdmin ? 'opacity-30 grayscale filter' : ''
          }`}>
            {Array.from({ length: 50 }).map((_, idx) => {
              const tileNum = 51 + idx;
              return renderTileCell(tileNum);
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 pt-5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2 p-2 bg-slate-950/50 rounded-xl border border-slate-800">
            <span className="w-5 h-5 rounded bg-amber-500/30 border border-amber-400 flex items-center justify-center text-xs shrink-0">🚨</span>
            <span><b>De Mosso a Mosso (+3)</b>: Encertant saltes +3 caselles.</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-950/50 rounded-xl border border-slate-800">
            <span className="w-5 h-5 rounded bg-red-500/30 border border-red-400 flex items-center justify-center text-xs shrink-0">🛑</span>
            <span><b>Controls Policials (34 i 84)</b>: Si falles, retornes a la casella de sortida de l'etapa!</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-950/50 rounded-xl border border-slate-800">
            <span className="w-5 h-5 rounded bg-amber-500/20 border border-amber-500 flex items-center justify-center text-xs shrink-0">📁</span>
            <span><b>Ordena l'Oficina (62, 77, 95)</b>: Match-3 policial. Si encertes avances +3! Si perds totes les vides retrocedeixes -3!</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-950/50 rounded-xl border border-slate-800">
            <span className="w-5 h-5 rounded bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-xs shrink-0">🏃‍♂️</span>
            <span><b>Circuit d'Agilitat (65, 82)</b>: Cursa de velocitat de 4 corredors (&lt;10s)!</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-950/50 rounded-xl border border-slate-800">
            <span className="w-5 h-5 rounded bg-rose-500/20 border border-rose-500 flex items-center justify-center text-xs shrink-0">⚖️</span>
            <span><b>Casella d'Impugnació (59, 74, 92)</b>: Si falles la pregunta, penalització de -3 caselles!</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-950/50 rounded-xl border border-slate-800">
            <span className="w-5 h-5 rounded bg-amber-400 border border-amber-300 flex items-center justify-center text-xs text-slate-950 font-black shrink-0">👑</span>
            <span><b>Casella 100</b>: Escut d'Or Llegendari i Nivell Llegendari absolut!</span>
          </div>
        </div>
      </div>

      {/* MINIJOC 1: ORDENA L'OFICINA MODAL */}
      {showOficinaModal && (
        <MinijocOficina
          ambit={selectedAmbit}
          onComplete={handleOficinaComplete}
          onClose={() => setShowOficinaModal(false)}
        />
      )}

      {/* MINIJOC 2: CIRCUIT D'AGILITAT MODAL */}
      {showCircuitModal && (
        <MinijocCircuitAgilitat
          ambit={selectedAmbit}
          onComplete={handleCircuitComplete}
          onClose={() => setShowCircuitModal(false)}
        />
      )}
    </div>
  );

  // Helper per pintar cadascuna de les 100 caselles
  function renderTileCell(tileNum: number) {
    const isStart = tileNum === 0;
    const isMidpoint = tileNum === MIDPOINT_TILES;
    const isFinish = tileNum === TOTAL_TILES;
    const isPlayerHere = currentTile === tileNum;
    const isOca = MOSSO_OCA_TILES.includes(tileNum);
    const isControl = CONTROL_POLICIAL_TILES.includes(tileNum);
    const isOficina = OFICINA_TILES.includes(tileNum);
    const isCircuit = CIRCUIT_AGILITAT_TILES.includes(tileNum);
    const isImpugnacio = IMPUGNACIO_TILES.includes(tileNum);

    const otherPlayersHere = activePlayers.filter(p => p.currentTile === tileNum);

    let tileBg = "bg-slate-800/70 border-slate-700/70 text-slate-400";
    let labelBadge = null;

    if (isStart) {
      tileBg = "bg-sky-950/60 border-sky-600 text-sky-300 font-bold";
    } else if (isMidpoint) {
      tileBg = "bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold shadow-md";
      labelBadge = <span className="text-[8px] font-black text-emerald-400 tracking-tighter">META 50</span>;
    } else if (isFinish) {
      tileBg = "bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 border-amber-200 text-slate-950 font-black shadow-xl shadow-amber-500/40";
      labelBadge = <span className="text-[8px] font-black text-slate-950 tracking-tighter">👑 100</span>;
    } else if (isOca) {
      tileBg = "bg-amber-950/50 border-amber-500/70 text-amber-300 font-semibold";
      labelBadge = <span className="text-[8px] font-black text-amber-400 tracking-tighter">MOSSO +3</span>;
    } else if (isControl) {
      tileBg = "bg-red-950/60 border-red-500 text-red-300 font-semibold ring-1 ring-red-500/50";
      labelBadge = <span className="text-[8px] font-black text-red-400 tracking-tighter">CONTROL {tileNum}</span>;
    } else if (isOficina) {
      tileBg = "bg-amber-950/70 border-amber-400 text-amber-300 font-semibold";
      labelBadge = <span className="text-[8px] font-black text-amber-300 tracking-tighter">OFICINA</span>;
    } else if (isCircuit) {
      tileBg = "bg-emerald-950/70 border-emerald-400 text-emerald-300 font-semibold";
      labelBadge = <span className="text-[8px] font-black text-emerald-300 tracking-tighter">CIRCUIT</span>;
    } else if (isImpugnacio) {
      tileBg = "bg-rose-950/60 border-rose-500 text-rose-300 font-semibold";
      labelBadge = <span className="text-[8px] font-black text-rose-400 tracking-tighter">IMPUGNACIÓ</span>;
    }

    const canPlayFromTile = isPlayerHere && currentTile < TOTAL_TILES && !activeSession;

    if (isPlayerHere) {
      tileBg = "bg-sky-600 border-white text-white font-black ring-4 ring-amber-400/80 shadow-2xl scale-105 z-10 cursor-pointer animate-pulse";
    }

    return (
      <div
        key={tileNum}
        onClick={() => {
          if (canPlayFromTile) {
            handleStartQuestion(currentTile);
          } else if (isAdmin) {
            handleAdminJumpToTile(tileNum);
          }
        }}
        title={
          canPlayFromTile
            ? `Clica per respondre la pregunta de la casella ${tileNum}!`
            : isAdmin
            ? `[ADMIN] Clica per saltar directament a la casella ${tileNum}`
            : undefined
        }
        className={`relative aspect-square rounded-2xl border p-1 sm:p-1.5 flex flex-col justify-between items-center transition-all ${tileBg} ${
          canPlayFromTile
            ? 'cursor-pointer hover:ring-4 hover:ring-amber-300 hover:scale-110 active:scale-95 shadow-lg'
            : isAdmin
            ? 'cursor-pointer hover:ring-2 hover:ring-rose-400 hover:scale-105'
            : ''
        }`}
      >
        <div className="w-full flex justify-between items-center text-[10px]">
          <span className="font-mono font-bold opacity-80">{tileNum}</span>
          {isFinish ? (
            <Crown className="w-3.5 h-3.5 text-slate-950" />
          ) : isMidpoint ? (
            <Flag className="w-3 h-3 text-emerald-400" />
          ) : isOca && !isPlayerHere ? (
            <span className="text-[10px]">🚨</span>
          ) : isControl && !isPlayerHere ? (
            <span className="text-[10px]">🛑</span>
          ) : isOficina && !isPlayerHere ? (
            <span className="text-[10px]">📁</span>
          ) : isCircuit && !isPlayerHere ? (
            <span className="text-[10px]">🏃‍♂️</span>
          ) : isImpugnacio && !isPlayerHere ? (
            <span className="text-[10px]">⚖️</span>
          ) : null}
        </div>

        {isPlayerHere ? (
          <div className="flex flex-col items-center justify-center my-auto w-full z-10">
            {/* Nom de l'usuari */}
            <span className="text-[8px] sm:text-[9px] font-black text-amber-200 bg-slate-950/90 px-1.5 py-0.5 rounded-md border border-amber-400/50 max-w-[62px] sm:max-w-[75px] truncate leading-none shadow-sm mb-1 text-center">
              {user.displayName?.split(' ')[0] || 'Tu'}
            </span>
            {/* Escut equipat en gran */}
            <div className="animate-bounce drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
              <ShieldRenderer shieldId={user.equippedShieldId} size={36} glow={true} />
            </div>
            {/* Botó d'acció */}
            <span className="text-[7.5px] sm:text-[8.5px] font-black uppercase text-amber-300 tracking-wider bg-slate-950/95 px-1.5 py-0.5 rounded-full border border-amber-400/90 mt-1 shadow-md whitespace-nowrap leading-none">
              {OFICINA_TILES.includes(currentTile) ? '📁 JUGAR' : CIRCUIT_AGILITAT_TILES.includes(currentTile) ? '🏃‍♂️ CÓRRER' : '▶ JUGAR'}
            </span>
          </div>
        ) : otherPlayersHere.length > 0 ? (
          <div className="flex flex-col items-center justify-center my-auto w-full">
            <div className="flex -space-x-1.5 overflow-hidden drop-shadow-md">
              {otherPlayersHere.slice(0, 2).map((op, idx) => (
                <div key={idx} title={`Aspirant: ${op.userName}`}>
                  <ShieldRenderer shieldId={op.avatarShield || 'generic_pvc'} size={28} />
                </div>
              ))}
            </div>
            <span className="text-[7.5px] sm:text-[8px] font-bold text-amber-300 bg-slate-950/80 px-1 py-0.2 rounded border border-amber-500/30 truncate max-w-[55px] mt-0.5">
              {otherPlayersHere.length === 1 ? otherPlayersHere[0].userName?.split(' ')[0] : `+${otherPlayersHere.length}`}
            </span>
          </div>
        ) : (
          <div className="text-center">
            {labelBadge}
          </div>
        )}

        <div className="w-full text-right text-[7px] opacity-40 font-mono">
          {tileNum === 0 ? 'INICI' : tileNum === MIDPOINT_TILES ? 'MÈRIT' : tileNum === TOTAL_TILES ? 'LLEGENDA' : ''}
        </div>
      </div>
    );
  }
};
