import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../../types';
import { 
  BenchPressIllustration, 
  TricepsPushupIllustration, 
  DipsIllustration,
  WarmupIllustration
} from './ExerciseIllustrations';
import { AudioEngine } from '../../utils/audio';
import { calculatePressBancaPoints } from '../../utils/physicalScoring';
import { 
  savePhysicalRecord, 
  getPhysicalRecords, 
  deletePhysicalRecord,
  savePracticeSession,
  getPracticeSessions,
  deletePracticeSession,
  fetchPhysicalDataFromCloud,
  PhysicalScoreRecord,
  PracticeSessionRecord,
  PracticeSetDetail
} from '../../utils/physicalStorage';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Check, 
  Clock, 
  Calendar, 
  Flame, 
  Award, 
  ChevronRight, 
  Plus, 
  Minus, 
  Trash2, 
  Dumbbell, 
  SkipForward, 
  Sparkles, 
  TrendingUp, 
  Volume2, 
  Info,
  CheckCircle2,
  Heart,
  Share2,
  Copy,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PressBancaViewProps {
  user: UserProfile;
  onRecordSaved?: () => void;
}

export interface PracticeExerciseItem {
  id: string;
  name: string;
  subtitle: string;
  series: number;
  repsTarget: string;
  restSeconds: number;
  instructions: string;
  illustration: React.ReactNode;
}

const DEFAULT_PRACTICE_EXERCISES: PracticeExerciseItem[] = [
  {
    id: 'pb_escalfament',
    name: 'Escalfament i mobilitat articular',
    subtitle: 'Mobilitat d\'espatlles + 1 sèrie d\'aproximació',
    series: 1,
    repsTarget: '15-20 reps suaus (barra buida)',
    restSeconds: 90, // 1 min i mig
    instructions: 'Mobilitat de maneguet dels rotadors, colzes i canells. Sèrie d\'aproximació amb la barra sola per preparar tendons i articulacions.',
    illustration: <WarmupIllustration className="w-16 h-16 sm:w-20 sm:h-20" />
  },
  {
    id: 'pb_barra',
    name: 'Press barra amb banca',
    subtitle: '3 sèries a 15-20 repeticions',
    series: 3,
    repsTarget: '15-20 repeticions',
    restSeconds: 180, // 3 minuts
    instructions: 'Cap i esquena recolzats, colzes a 45-70º, baixar fins a fregar el pit i pujar explosiu sense bloquejar violentament.',
    illustration: <BenchPressIllustration className="w-16 h-16 sm:w-20 sm:h-20" />
  },
  {
    id: 'flexions_triceps',
    name: 'Flexions de tríceps',
    subtitle: '3 sèries al fall',
    series: 3,
    repsTarget: 'Al fall (màximes)',
    restSeconds: 90, // 1 min i mig
    instructions: 'Mans estretes sota les espatlles o diamant, colzes completament enganxats als costats. Descansa més si ho necessites.',
    illustration: <TricepsPushupIllustration className="w-16 h-16 sm:w-20 sm:h-20" />
  },
  {
    id: 'fons_triceps_pit',
    name: 'Fons per a tríceps i pit inferior',
    subtitle: '3 sèries',
    series: 3,
    repsTarget: '10-15 repeticions o al fall',
    restSeconds: 105, // 1m 45s (minut i mig a 2 min)
    instructions: 'A paral·leles o banc estable. Lleugera inclinació del tors per involucrar el feix inferior del pectoral.',
    illustration: <DipsIllustration className="w-16 h-16 sm:w-20 sm:h-20" />
  }
];

export const PressBancaView: React.FC<PressBancaViewProps> = ({ user, onRecordSaved }) => {
  const [activeSubTab, setActiveSubTab] = useState<'simulacre' | 'practica'>(() => {
    try {
      const activeWorkout = localStorage.getItem('agent_medina_active_pb_workout');
      if (activeWorkout) {
        const parsed = JSON.parse(activeWorkout);
        if (parsed?.isWorkoutActive && Date.now() - (parsed.lastUpdated || 0) < 24 * 3600 * 1000) {
          return 'practica';
        }
      }
      const saved = localStorage.getItem('agent_medina_pb_subtab');
      if (saved === 'simulacre' || saved === 'practica') return saved;
    } catch (e) {}
    return 'simulacre';
  });

  useEffect(() => {
    try {
      localStorage.setItem('agent_medina_pb_subtab', activeSubTab);
    } catch (e) {}
  }, [activeSubTab]);
  
  // ==========================================
  // ESTAT SIMULACRE OFICIAL (10s Prep + 45s a 1.02s)
  // ==========================================
  const [simState, setSimState] = useState<'idle' | 'preparing' | 'running' | 'finished'>('idle');
  const [prepSecondsLeft, setPrepSecondsLeft] = useState(10);
  const [testTimeLeft, setTestTimeLeft] = useState(45.0);
  const [cadenceBeatsCount, setCadenceBeatsCount] = useState(0);
  const [isCadenceFlash, setIsCadenceFlash] = useState(false);

  // Resultats i formulari de registre
  const [repsDone, setRepsDone] = useState<number>(28);
  const [recordDate, setRecordDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recordTime, setRecordTime] = useState<string>(
    new Date().toTimeString().slice(0, 5)
  );
  const [recordNotes, setRecordNotes] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Historial local
  const [recordsList, setRecordsList] = useState<PhysicalScoreRecord[]>([]);

  const loadHistory = () => {
    const list = getPhysicalRecords(user.uid || user.email, user.email).filter(r => r.testType === 'PB');
    setRecordsList(list);

    // Sincronització en segon pla des del servidor / Supabase / Firebase
    fetchPhysicalDataFromCloud(user.uid, user.email).then(data => {
      if (data && Array.isArray(data.records)) {
        const cloudList = data.records.filter(r => r.testType === 'PB');
        setRecordsList(cloudList);
      }
    }).catch(console.warn);
  };

  useEffect(() => {
    loadHistory();
  }, [user.email, user.uid]);

  // Timers Refs
  const prepTimerRef = useRef<any>(null);
  const testIntervalRef = useRef<any>(null);
  const cadenceIntervalRef = useRef<any>(null);
  const isSimActiveRef = useRef<boolean>(false);

  // Neteja absoluta de tots els timers
  const clearAllSimTimers = () => {
    isSimActiveRef.current = false;
    if (prepTimerRef.current) {
      clearInterval(prepTimerRef.current);
      prepTimerRef.current = null;
    }
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = null;
    }
    if (cadenceIntervalRef.current) {
      clearInterval(cadenceIntervalRef.current);
      cadenceIntervalRef.current = null;
    }
  };

  // Neteja de timers al desmuntar
  useEffect(() => {
    return () => {
      clearAllSimTimers();
      AudioEngine.stopAllSounds();
    };
  }, []);

  // Inici de la fase de Preparació (10 segons)
  const startPreparation = () => {
    clearAllSimTimers();
    AudioEngine.stopAllSounds();
    isSimActiveRef.current = true;
    setSimState('preparing');
    setPrepSecondsLeft(10);
    setTestTimeLeft(45.0);
    setCadenceBeatsCount(0);
    setSaveSuccess(false);

    // Primer bip de preparació
    AudioEngine.playPrepBeep(false);

    let currentPrep = 10;
    prepTimerRef.current = setInterval(() => {
      currentPrep -= 1;
      setPrepSecondsLeft(currentPrep);

      if (currentPrep <= 3 && currentPrep > 0) {
        AudioEngine.playPrepBeep(false);
      } else if (currentPrep <= 0) {
        if (prepTimerRef.current) {
          clearInterval(prepTimerRef.current);
          prepTimerRef.current = null;
        }
        AudioEngine.playPrepBeep(true);
        startOfficialTest();
      }
    }, 1000);
  };

  // Inici del test oficial de 45 segons amb metrònom a 1.02 segons
  const startOfficialTest = () => {
    clearAllSimTimers();
    isSimActiveRef.current = true;
    setSimState('running');
    setTestTimeLeft(45.0);
    setCadenceBeatsCount(1);
    
    // Primer so de cadència a 1.02s
    AudioEngine.playCadenceSignal();
    setIsCadenceFlash(true);
    setTimeout(() => setIsCadenceFlash(false), 200);

    const startTime = Date.now();
    const durationMs = 45000;
    const cadenceIntervalMs = 1020; // 1,02 segons exactes

    // Metrònom cada 1.02 segons
    let beats = 1;
    cadenceIntervalRef.current = setInterval(() => {
      if (!isSimActiveRef.current) {
        if (cadenceIntervalRef.current) clearInterval(cadenceIntervalRef.current);
        return;
      }
      beats += 1;
      setCadenceBeatsCount(beats);
      AudioEngine.playCadenceSignal();
      setIsCadenceFlash(true);
      setTimeout(() => setIsCadenceFlash(false), 180);
    }, cadenceIntervalMs);

    // Comptador de temps suau cada 100ms
    testIntervalRef.current = setInterval(() => {
      if (!isSimActiveRef.current) {
        if (testIntervalRef.current) clearInterval(testIntervalRef.current);
        return;
      }

      const elapsed = Date.now() - startTime;
      const remainingMs = Math.max(0, durationMs - elapsed);
      const remainingSec = Math.round(remainingMs / 100) / 10;
      setTestTimeLeft(remainingSec);

      if (remainingMs <= 0) {
        clearAllSimTimers();
        finishOfficialTest();
      }
    }, 100);
  };

  const finishOfficialTest = () => {
    clearAllSimTimers();
    AudioEngine.stopAllSounds();
    
    setSimState('finished');
    setTestTimeLeft(0);

    // So ràpid i net de finalització (0.6s)
    AudioEngine.playPoliceSiren();
    
    // Confeti disparat exactament UNA vegada
    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}
  };

  const resetSimulacre = () => {
    clearAllSimTimers();
    AudioEngine.stopAllSounds();
    setSimState('idle');
    setPrepSecondsLeft(10);
    setTestTimeLeft(45.0);
    setCadenceBeatsCount(0);
  };

  const handleSaveRecord = () => {
    const scoreData = calculatePressBancaPoints(repsDone);
    savePhysicalRecord(user.uid || user.email, {
      userId: user.uid,
      userEmail: user.email || 'aspirant@agentmedina.cat',
      testType: 'PB',
      rawScore: repsDone,
      points: scoreData.points,
      tier: scoreData.tier,
      date: recordDate,
      time: recordTime,
      notes: recordNotes
    }, user.email);

    setSaveSuccess(true);
    loadHistory();
    if (onRecordSaved) onRecordSaved();
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // ==========================================
  // ESTAT DEL MODAL DE SEGURETAT PER ELIMINAR O DESCARTAR
  // ==========================================
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'record' | 'session' | 'active_workout';
    id?: string;
    title: string;
    details: string;
  } | null>(null);

  const requestDeleteRecord = (rec: PhysicalScoreRecord) => {
    AudioEngine.playClick();
    setDeleteConfirmation({
      type: 'record',
      id: rec.id,
      title: 'Eliminar registre de simulacre',
      details: `Marca oficial de ${rec.rawScore} repeticions (${rec.points.toFixed(1)} punts) del dia ${rec.date} a les ${rec.time}.`
    });
  };

  const requestDeleteSession = (session: PracticeSessionRecord) => {
    AudioEngine.playClick();
    setDeleteConfirmation({
      type: 'session',
      id: session.id,
      title: "Eliminar sessió d'entrenament",
      details: `Entrenament de ${session.durationMinutes} min (${session.totalSets} sèries) del dia ${session.date} a les ${session.time}.`
    });
  };

  const requestCancelActiveWorkout = () => {
    AudioEngine.playClick();
    setDeleteConfirmation({
      type: 'active_workout',
      title: 'Aturar entrenament en curs',
      details: `Tens un entrenament actiu amb ${completedSets.length} sèries completades. Vols desar el que portes o descartar la sessió?`
    });
  };

  const handleConfirmDeleteAction = () => {
    if (!deleteConfirmation) return;
    AudioEngine.playClick();

    if (deleteConfirmation.type === 'record' && deleteConfirmation.id) {
      deletePhysicalRecord(user.uid || user.email, deleteConfirmation.id, user.email);
      setRecordsList(prev => prev.filter(r => r.id !== deleteConfirmation.id));
      if (onRecordSaved) onRecordSaved();
    } else if (deleteConfirmation.type === 'session' && deleteConfirmation.id) {
      deletePracticeSession(user.email || user.uid, deleteConfirmation.id, user.email);
      setPracticeHistory(prev => prev.filter(s => s.id !== deleteConfirmation.id));
    } else if (deleteConfirmation.type === 'active_workout') {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
        restTimerRef.current = null;
      }
      setIsResting(false);
      setIsWorkoutActive(false);
      setRestEndTime(null);
      restEndTimeRef.current = null;
      setShowSetInputModal(false);
      setCompletedSets([]);
      try {
        localStorage.removeItem('agent_medina_active_pb_workout');
      } catch (e) {}
      AudioEngine.stopAllSounds();
    }

    setDeleteConfirmation(null);
  };

  // ==========================================
  // ESTAT PRÀCTICA / RUTINA PERSISTENT
  // ==========================================
  // Recuperar qualsevol entrenament en curs en cas de recarregar o canviar a WhatsApp
  // ==========================================
  // ESTAT PRÀCTICA / RUTINA PERSISTENT (100% Blindat davant WhatsApp / Recàrrega)
  // ==========================================
  // Recuperar qualsevol entrenament en curs en cas de recarregar o canviar a WhatsApp
  const initialWorkout = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('agent_medina_active_pb_workout');
      if (raw) {
        const parsed = JSON.parse(raw);
        // Vàlid si es va actualitzar en les últimes 24 hores
        if (parsed?.isWorkoutActive && Date.now() - (parsed.lastUpdated || 0) < 24 * 3600 * 1000) {
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  }, []);

  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>(() => {
    if (initialWorkout?.selectedExerciseIds && initialWorkout.selectedExerciseIds.length > 0) {
      return initialWorkout.selectedExerciseIds;
    }
    try {
      const savedEx = localStorage.getItem('agent_medina_pb_selected_exercises');
      if (savedEx) {
        const parsed = JSON.parse(savedEx);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return ['pb_barra', 'flexions_triceps', 'fons_triceps_pit'];
  });

  useEffect(() => {
    try {
      localStorage.setItem('agent_medina_pb_selected_exercises', JSON.stringify(selectedExerciseIds));
    } catch {}
  }, [selectedExerciseIds]);
  const [isWorkoutActive, setIsWorkoutActive] = useState<boolean>(
    Boolean(initialWorkout?.isWorkoutActive)
  );
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(
    initialWorkout?.currentExerciseIndex ?? 0
  );
  const [currentSetIndex, setCurrentSetIndex] = useState<number>(
    initialWorkout?.currentSetIndex ?? 1
  );
  const [workoutStartTime, setWorkoutStartTime] = useState<number>(
    initialWorkout?.workoutStartTime || Date.now()
  );
  const [completedSets, setCompletedSets] = useState<PracticeSetDetail[]>(
    initialWorkout?.completedSets || []
  );

  // Calculem descans real basat en timestamp de rellotge (no depèn de si el mòbil s'apaga o vas a WhatsApp)
  const initialRest = React.useMemo(() => {
    if (initialWorkout?.isResting && initialWorkout.restEndTime) {
      const remaining = Math.max(0, Math.round((initialWorkout.restEndTime - Date.now()) / 1000));
      if (remaining > 0) {
        return { isResting: true, secondsLeft: remaining, endTime: initialWorkout.restEndTime, wasRestFinishedWhileAway: false };
      } else {
        return { isResting: false, secondsLeft: 0, endTime: null, wasRestFinishedWhileAway: true };
      }
    }
    return { isResting: false, secondsLeft: 0, endTime: null, wasRestFinishedWhileAway: false };
  }, [initialWorkout]);

  const [isResting, setIsResting] = useState<boolean>(initialRest.isResting);
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(initialRest.secondsLeft);
  const [restEndTime, setRestEndTime] = useState<number | null>(initialRest.endTime);
  const restEndTimeRef = useRef<number | null>(initialRest.endTime);
  restEndTimeRef.current = restEndTime;

  // Notificació visual si el descans s'ha completat en tornar de WhatsApp
  const [restFinishedWhileAwayNotice, setRestFinishedWhileAwayNotice] = useState<string | null>(() => {
    if (initialRest.wasRestFinishedWhileAway) {
      return "🎉 El temps de descans ha finalitzat mentre eres a WhatsApp! Estàs a punt per continuar la teva sessió.";
    }
    return null;
  });

  // Refs per al salvat ràpid en segon pla (pagehide / freeze / visibilitychange)
  const isWorkoutActiveRef = useRef(isWorkoutActive);
  isWorkoutActiveRef.current = isWorkoutActive;
  const selectedExerciseIdsRef = useRef(selectedExerciseIds);
  selectedExerciseIdsRef.current = selectedExerciseIds;
  const currentExerciseIndexRef = useRef(currentExerciseIndex);
  currentExerciseIndexRef.current = currentExerciseIndex;
  const currentSetIndexRef = useRef(currentSetIndex);
  currentSetIndexRef.current = currentSetIndex;
  const isRestingRef = useRef(isResting);
  isRestingRef.current = isResting;
  const restSecondsLeftRef = useRef(restSecondsLeft);
  restSecondsLeftRef.current = restSecondsLeft;
  const workoutStartTimeRef = useRef(workoutStartTime);
  workoutStartTimeRef.current = workoutStartTime;
  const completedSetsRef = useRef(completedSets);
  completedSetsRef.current = completedSets;

  const [showWorkoutFeelingsModal, setShowWorkoutFeelingsModal] = useState<boolean>(false);
  const [feelingsRating, setFeelingsRating] = useState<number>(3); // 1 to 5
  const [feelingsNotes, setFeelingsNotes] = useState<string>('');
  const [practiceHistory, setPracticeHistory] = useState<PracticeSessionRecord[]>([]);

  // Registre detallat de sèries, repeticions i pesos de la sessió
  const [showSetInputModal, setShowSetInputModal] = useState<boolean>(false);
  const [currentSetReps, setCurrentSetReps] = useState<number>(18);
  const [currentSetWeight, setCurrentSetWeight] = useState<number>(40);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const loadPracticeHistory = () => {
    const list = getPracticeSessions(user.email || user.uid);
    setPracticeHistory(list);
  };

  useEffect(() => {
    loadPracticeHistory();
  }, [user.email, user.uid]);

  // Funció auxiliar per desar immediatament l'estat en localStorage
  const saveWorkoutSnapshot = (overrides?: Partial<any>) => {
    try {
      const active = overrides?.isWorkoutActive !== undefined ? overrides.isWorkoutActive : isWorkoutActiveRef.current;
      if (!active) {
        localStorage.removeItem('agent_medina_active_pb_workout');
        return;
      }
      const payload = {
        isWorkoutActive: true,
        selectedExerciseIds: overrides?.selectedExerciseIds ?? selectedExerciseIdsRef.current,
        currentExerciseIndex: overrides?.currentExerciseIndex ?? currentExerciseIndexRef.current,
        currentSetIndex: overrides?.currentSetIndex ?? currentSetIndexRef.current,
        isResting: overrides?.isResting !== undefined ? overrides.isResting : isRestingRef.current,
        restEndTime: overrides?.restEndTime !== undefined ? overrides.restEndTime : restEndTimeRef.current,
        restTotalSeconds: overrides?.restTotalSeconds !== undefined ? overrides.restTotalSeconds : restSecondsLeftRef.current,
        workoutStartTime: overrides?.workoutStartTime ?? workoutStartTimeRef.current,
        completedSets: overrides?.completedSets ?? completedSetsRef.current,
        lastUpdated: Date.now()
      };
      localStorage.setItem('agent_medina_active_pb_workout', JSON.stringify(payload));
      localStorage.setItem('agent_medina_pb_subtab', 'practica');
      localStorage.setItem('agent_medina_fisiques_tab', 'press_banca');
      localStorage.setItem('agent_medina_main_mode', 'fisiques');
    } catch (e) {
      console.warn('Error saving workout snapshot:', e);
    }
  };

  // Desar l'estat de l'entrenament en temps real a localStorage
  useEffect(() => {
    saveWorkoutSnapshot();
  }, [isWorkoutActive, selectedExerciseIds, currentExerciseIndex, currentSetIndex, isResting, restEndTime, completedSets, workoutStartTime, restSecondsLeft]);

  // Listener d'emergència en canvi d'app o navegació a WhatsApp
  useEffect(() => {
    const handleVisibilitySync = () => {
      if (document.visibilityState === 'visible') {
        // En tornar de WhatsApp o una altra app, recalcularem el descans en mil·lisegons exactes
        if (isRestingRef.current && restEndTimeRef.current) {
          const remaining = Math.max(0, Math.round((restEndTimeRef.current - Date.now()) / 1000));
          setRestSecondsLeft(remaining);
          restSecondsLeftRef.current = remaining;
          if (remaining <= 0) {
            if (restTimerRef.current) {
              clearInterval(restTimerRef.current);
              restTimerRef.current = null;
            }
            setIsResting(false);
            isRestingRef.current = false;
            setRestEndTime(null);
            restEndTimeRef.current = null;
            setRestFinishedWhileAwayNotice("🎉 El temps de descans ha finalitzat mentre eres a WhatsApp! Estàs a punt per continuar la teva sessió.");
            AudioEngine.playRestFinishedChime();
            saveWorkoutSnapshot({ isResting: false, restEndTime: null, restTotalSeconds: 0 });
          }
        }
      } else {
        // En marxar a WhatsApp, desar immediatament l'estat actual
        if (isWorkoutActiveRef.current) {
          saveWorkoutSnapshot();
        }
      }
    };

    const handleBeforeUnload = () => {
      if (isWorkoutActiveRef.current) {
        saveWorkoutSnapshot();
      }
    };

    window.addEventListener('pagehide', handleBeforeUnload);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('freeze', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilitySync);
    window.addEventListener('focus', handleVisibilitySync);

    return () => {
      window.removeEventListener('pagehide', handleBeforeUnload);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('freeze', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilitySync);
      window.removeEventListener('focus', handleVisibilitySync);
    };
  }, []);

  // Càlcul del temps estimat total
  const estimatedWorkoutMinutes = React.useMemo(() => {
    let totalSec = 0;
    selectedExerciseIds.forEach(id => {
      const ex = DEFAULT_PRACTICE_EXERCISES.find(e => e.id === id);
      if (ex) {
        totalSec += ex.series * 45 + (ex.series - 1) * ex.restSeconds;
      }
    });
    return Math.max(1, Math.round(totalSec / 60));
  }, [selectedExerciseIds]);

  const toggleSelectExercise = (id: string) => {
    setSelectedExerciseIds(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Mantenir com a mínim 1
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Gestió del temporitzador de descans basat en rellotge real
  const restTimerRef = useRef<any>(null);

  useEffect(() => {
    if (isResting && restEndTime) {
      if (restTimerRef.current) clearInterval(restTimerRef.current);

      const checkRestTick = () => {
        if (!restEndTimeRef.current) return;
        const now = Date.now();
        const remaining = Math.max(0, Math.round((restEndTimeRef.current - now) / 1000));
        setRestSecondsLeft(remaining);

        if (remaining <= 3 && remaining > 0) {
          AudioEngine.playRestWarningBeep(remaining);
        } else if (remaining === 10) {
          AudioEngine.playRestWarningBeep(10);
        } else if (remaining <= 0) {
          if (restTimerRef.current) {
            clearInterval(restTimerRef.current);
            restTimerRef.current = null;
          }
          setIsResting(false);
          setRestEndTime(null);
          restEndTimeRef.current = null;
          saveWorkoutSnapshot({ isResting: false, restEndTime: null, restTotalSeconds: 0 });
          AudioEngine.playRestFinishedChime();
        }
      };

      checkRestTick();
      restTimerRef.current = setInterval(checkRestTick, 1000);
    } else {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
        restTimerRef.current = null;
      }
    }
    return () => {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
        restTimerRef.current = null;
      }
    };
  }, [isResting, restEndTime]);

  // Listener per sincronitzar immediatament en tornar de WhatsApp o pantalla apagada
  useEffect(() => {
    const handleAppResume = () => {
      if (document.visibilityState === 'visible') {
        if (restEndTimeRef.current && isRestingRef.current) {
          const remaining = Math.round((restEndTimeRef.current - Date.now()) / 1000);
          if (remaining > 0) {
            setRestSecondsLeft(remaining);
            restSecondsLeftRef.current = remaining;
          } else {
            // El descans ha acabat mentre l'usuari era a WhatsApp o fora
            if (restTimerRef.current) {
              clearInterval(restTimerRef.current);
              restTimerRef.current = null;
            }
            setIsResting(false);
            isRestingRef.current = false;
            setRestSecondsLeft(0);
            restSecondsLeftRef.current = 0;
            setRestEndTime(null);
            restEndTimeRef.current = null;
            saveWorkoutSnapshot({ isResting: false, restEndTime: null, restTotalSeconds: 0 });
            setRestFinishedWhileAwayNotice("🎉 El temps de descans de 2 minuts ha finalitzat mentre eres a WhatsApp! Ja estàs a punt per a la següent sèrie.");
            AudioEngine.playRestFinishedChime();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleAppResume);
    window.addEventListener('focus', handleAppResume);
    return () => {
      document.removeEventListener('visibilitychange', handleAppResume);
      window.removeEventListener('focus', handleAppResume);
    };
  }, []);

  const startWorkoutSession = () => {
    if (selectedExerciseIds.length === 0) return;
    const now = Date.now();
    setIsWorkoutActive(true);
    isWorkoutActiveRef.current = true;
    setCurrentExerciseIndex(0);
    currentExerciseIndexRef.current = 0;
    setCurrentSetIndex(1);
    currentSetIndexRef.current = 1;
    setIsResting(false);
    isRestingRef.current = false;
    setRestEndTime(null);
    restEndTimeRef.current = null;
    setCompletedSets([]);
    completedSetsRef.current = [];
    setWorkoutStartTime(now);
    workoutStartTimeRef.current = now;
    setRestFinishedWhileAwayNotice(null);

    saveWorkoutSnapshot({
      isWorkoutActive: true,
      currentExerciseIndex: 0,
      currentSetIndex: 1,
      isResting: false,
      restEndTime: null,
      restTotalSeconds: 0,
      completedSets: [],
      workoutStartTime: now
    });

    // Inicialitzar valors per defecte segons primer exercici
    const firstExId = selectedExerciseIds[0];
    if (firstExId === 'pb_barra') {
      setCurrentSetReps(18);
      setCurrentSetWeight(user.gender === 'dona' ? 25 : 40);
    } else if (firstExId === 'pb_escalfament') {
      setCurrentSetReps(15);
      setCurrentSetWeight(20);
    } else if (firstExId === 'flexions_triceps') {
      setCurrentSetReps(20);
      setCurrentSetWeight(0);
    } else {
      setCurrentSetReps(12);
      setCurrentSetWeight(0);
    }
  };

  // Obre el modal per registrar les repeticions i pes aconseguit a la sèrie
  const handleCompleteSet = () => {
    const activeExercises = DEFAULT_PRACTICE_EXERCISES.filter(e => selectedExerciseIds.includes(e.id));
    const safeExercises = activeExercises.length > 0 ? activeExercises : DEFAULT_PRACTICE_EXERCISES;
    const currentEx = safeExercises[currentExerciseIndex] || safeExercises[0];
    if (!currentEx) return;

    AudioEngine.playClick();

    // Consultar última sèrie d'aquest exercici per mantenir la continuïtat
    const prevSetsThisEx = completedSets.filter(s => s.exerciseId === currentEx.id);
    const lastSet = prevSetsThisEx[prevSetsThisEx.length - 1];

    if (lastSet) {
      setCurrentSetReps(lastSet.reps);
      if (lastSet.weightKg !== undefined) {
        setCurrentSetWeight(lastSet.weightKg);
      }
    } else {
      if (currentEx.id === 'pb_barra') {
        setCurrentSetReps(18);
        setCurrentSetWeight(user.gender === 'dona' ? 25 : 40);
      } else if (currentEx.id === 'pb_escalfament') {
        setCurrentSetReps(15);
        setCurrentSetWeight(20);
      } else if (currentEx.id === 'flexions_triceps') {
        setCurrentSetReps(20);
        setCurrentSetWeight(0);
      } else {
        setCurrentSetReps(12);
        setCurrentSetWeight(0);
      }
    }

    setShowSetInputModal(true);
  };

  // Confirmar les dades de la sèrie i activar el compte enrere de descans
  const handleConfirmSetLog = () => {
    const activeExercises = DEFAULT_PRACTICE_EXERCISES.filter(e => selectedExerciseIds.includes(e.id));
    const safeExercises = activeExercises.length > 0 ? activeExercises : DEFAULT_PRACTICE_EXERCISES;
    const currentEx = safeExercises[currentExerciseIndex] || safeExercises[0];
    if (!currentEx) return;

    AudioEngine.playClick();
    setRestFinishedWhileAwayNotice(null);

    const isPb = currentEx.id === 'pb_barra' || currentEx.id === 'pb_escalfament';
    const newSetDetail: PracticeSetDetail = {
      exerciseId: currentEx.id,
      exerciseName: currentEx.name,
      setNumber: currentSetIndex,
      reps: Math.max(0, Number(currentSetReps) || 0),
      weightKg: isPb ? Math.max(0, Number(currentSetWeight) || 0) : (currentSetWeight > 0 ? Number(currentSetWeight) : undefined)
    };

    const nextSets = [...completedSets, newSetDetail];
    setCompletedSets(nextSets);
    completedSetsRef.current = nextSets;
    setShowSetInputModal(false);

    const isLastSetOfEx = currentSetIndex >= currentEx.series;
    const isLastEx = currentExerciseIndex >= safeExercises.length - 1;

    if (isLastSetOfEx && isLastEx) {
      // Tot el bloc finalitzat!
      finishWorkout(nextSets);
    } else if (isLastSetOfEx) {
      // Passar al següent exercici i obrir compte enrere de descans (2 minuts)
      const restSec = 120;
      const targetEnd = Date.now() + restSec * 1000;
      const nextExIdx = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextExIdx);
      currentExerciseIndexRef.current = nextExIdx;
      setCurrentSetIndex(1);
      currentSetIndexRef.current = 1;
      setIsResting(true);
      isRestingRef.current = true;
      setRestSecondsLeft(restSec);
      restSecondsLeftRef.current = restSec;
      setRestEndTime(targetEnd);
      restEndTimeRef.current = targetEnd;

      saveWorkoutSnapshot({
        completedSets: nextSets,
        currentExerciseIndex: nextExIdx,
        currentSetIndex: 1,
        isResting: true,
        restEndTime: targetEnd,
        restTotalSeconds: restSec
      });
    } else {
      // Següent sèrie del mateix exercici
      const restSec = currentEx.restSeconds;
      const targetEnd = Date.now() + restSec * 1000;
      const nextSetIdx = currentSetIndex + 1;
      setCurrentSetIndex(nextSetIdx);
      currentSetIndexRef.current = nextSetIdx;
      setIsResting(true);
      isRestingRef.current = true;
      setRestSecondsLeft(restSec);
      restSecondsLeftRef.current = restSec;
      setRestEndTime(targetEnd);
      restEndTimeRef.current = targetEnd;

      saveWorkoutSnapshot({
        completedSets: nextSets,
        currentSetIndex: nextSetIdx,
        isResting: true,
        restEndTime: targetEnd,
        restTotalSeconds: restSec
      });
    }
  };

  const handleSkipRest = () => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
    setIsResting(false);
    isRestingRef.current = false;
    setRestSecondsLeft(0);
    restSecondsLeftRef.current = 0;
    setRestEndTime(null);
    restEndTimeRef.current = null;
    setRestFinishedWhileAwayNotice(null);
    saveWorkoutSnapshot({ isResting: false, restEndTime: null, restTotalSeconds: 0 });
    AudioEngine.playClick();
  };

  const adjustRestTime = (seconds: number) => {
    const nextSec = Math.max(5, restSecondsLeft + seconds);
    const newEnd = Date.now() + nextSec * 1000;
    setRestSecondsLeft(nextSec);
    setRestEndTime(newEnd);
    restEndTimeRef.current = newEnd;
    saveWorkoutSnapshot({ restEndTime: newEnd, restTotalSeconds: nextSec });
  };

  const handleSkipExercise = () => {
    const activeExercises = DEFAULT_PRACTICE_EXERCISES.filter(e => selectedExerciseIds.includes(e.id));
    const safeExercises = activeExercises.length > 0 ? activeExercises : DEFAULT_PRACTICE_EXERCISES;
    if (currentExerciseIndex < safeExercises.length - 1) {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
        restTimerRef.current = null;
      }
      const nextExIdx = currentExerciseIndex + 1;
      setIsResting(false);
      setRestEndTime(null);
      restEndTimeRef.current = null;
      setCurrentExerciseIndex(nextExIdx);
      setCurrentSetIndex(1);
      saveWorkoutSnapshot({
        currentExerciseIndex: nextExIdx,
        currentSetIndex: 1,
        isResting: false,
        restEndTime: null,
        restTotalSeconds: 0
      });
    } else {
      finishWorkout();
    }
  };

  const finishWorkout = (finalSets?: PracticeSetDetail[]) => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
    setIsResting(false);
    isRestingRef.current = false;
    setIsWorkoutActive(false);
    isWorkoutActiveRef.current = false;
    setRestEndTime(null);
    restEndTimeRef.current = null;
    setShowSetInputModal(false);
    setRestFinishedWhileAwayNotice(null);
    try {
      localStorage.removeItem('agent_medina_active_pb_workout');
    } catch (e) {}
    if (finalSets) {
      setCompletedSets(finalSets);
      completedSetsRef.current = finalSets;
    }
    setShowWorkoutFeelingsModal(true);
    AudioEngine.stopAllSounds();
    AudioEngine.playWhistle();
    try {
      confetti({ particleCount: 60, spread: 70 });
    } catch (e) {}
  };

  // Generador de text per compartir a WhatsApp
  const generateWorkoutWhatsAppMessage = (
    date: string,
    time: string,
    durationMinutes: number,
    sets: PracticeSetDetail[],
    rating?: number,
    notes?: string
  ): string => {
    const dateFormatted = date.includes('-') ? date.split('-').reverse().join('/') : date;
    let text = `🏋️‍♂️ *Entrenament Completat a l'Acadèmia MEED*\n`;
    text += `📅 *Dia de l'entrenament:* ${dateFormatted} a les ${time}\n`;
    text += `⏱️ *Durada:* ~${durationMinutes} minuts\n`;
    text += `🎯 *Total de sèries:* ${sets.length} sèries realitzades\n\n`;

    text += `💪 *RESUM DE L'ENTRENAMENT REALITZAT:*\n`;

    // Agrupar sèries per exercici
    const exerciseMap = new Map<string, PracticeSetDetail[]>();
    sets.forEach(s => {
      const list = exerciseMap.get(s.exerciseName) || [];
      list.push(s);
      exerciseMap.set(s.exerciseName, list);
    });

    exerciseMap.forEach((sList, exName) => {
      const icon = exName.toLowerCase().includes('banca') 
        ? '🏋️' 
        : exName.toLowerCase().includes('flexi') 
          ? '🤸' 
          : '⚡';
      text += `\n${icon} *${exName}* (${sList.length} sèries):\n`;
      sList.forEach(s => {
        const weightInfo = s.weightKg !== undefined && s.weightKg > 0 ? ` amb *${s.weightKg} kg*` : '';
        text += `  • Sèrie ${s.setNumber}: *${s.reps} reps*${weightInfo}\n`;
      });
    });

    if (rating) {
      const ratingLabels: Record<number, string> = {
        1: 'Molt fluix 😴',
        2: 'Còmode 😊',
        3: 'Òptim 💪',
        4: 'Exigent 🔥',
        5: 'Al límit 🥵'
      };
      text += `\n📈 *Sensacions:* ${'⭐'.repeat(rating)} (${ratingLabels[rating] || ''})\n`;
    }

    if (notes && notes.trim()) {
      text += `💬 *Comentaris:* "${notes.trim()}"\n`;
    }

    return text;
  };

  const handleShareWhatsApp = (customText?: string) => {
    const duration = Math.max(1, Math.round((Date.now() - workoutStartTime) / 60000));
    const textToShare = customText || generateWorkoutWhatsAppMessage(
      new Date().toISOString().split('T')[0],
      new Date().toTimeString().slice(0, 5),
      duration,
      completedSets,
      feelingsRating,
      feelingsNotes
    );
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`;
    window.open(url, '_blank');
  };

  const handleCopySummary = async (customText?: string) => {
    const duration = Math.max(1, Math.round((Date.now() - workoutStartTime) / 60000));
    const textToCopy = customText || generateWorkoutWhatsAppMessage(
      new Date().toISOString().split('T')[0],
      new Date().toTimeString().slice(0, 5),
      duration,
      completedSets,
      feelingsRating,
      feelingsNotes
    );
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    } catch (e) {
      console.warn('Error copiant al porta-retalls', e);
    }
  };

  const saveWorkoutFeelings = () => {
    const durationMinutes = Math.max(1, Math.round((Date.now() - workoutStartTime) / 60000));
    savePracticeSession(user.uid || user.email, {
      userId: user.uid,
      userEmail: user.email || 'aspirant@agentmedina.cat',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      exercisesCompleted: selectedExerciseIds,
      totalSets: completedSets.length > 0 ? completedSets.length : selectedExerciseIds.length * 3,
      feelingsRating,
      feelingsText: feelingsNotes,
      durationMinutes,
      setsDetail: completedSets
    }, user.email);

    loadPracticeHistory();
    setShowWorkoutFeelingsModal(false);
    setFeelingsNotes('');
  };

  const activeExercises = DEFAULT_PRACTICE_EXERCISES.filter(e => selectedExerciseIds.includes(e.id));
  const safeExercises = activeExercises.length > 0 ? activeExercises : DEFAULT_PRACTICE_EXERCISES;
  const currentRunningExercise = safeExercises[currentExerciseIndex] || safeExercises[0];

  return (
    <div className="space-y-6">
      {/* Selector de subpestanyes: Simulacre Oficial vs Pràctica */}
      <div className="flex items-center justify-center p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 max-w-md mx-auto shadow-inner">
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('simulacre');
            AudioEngine.playClick();
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'simulacre'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Simulacre Oficial (45s)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('practica');
            AudioEngine.playClick();
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'practica'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>Pràctica i Rutina</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* CONTINGUT SUBPESTANYA 1: SIMULACRE OFICIAL               */}
      {/* ========================================================= */}
      {activeSubTab === 'simulacre' && (
        <div className="space-y-6">
          {/* Caixa Principal del Simulacre */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center relative overflow-hidden">
            {/* Fons decoratiu de cadència */}
            {isCadenceFlash && (
              <div className="absolute inset-0 bg-amber-500/10 pointer-events-none transition-opacity duration-150" />
            )}

            <div className="max-w-xl mx-auto space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Cadència Oficial: 1,02 segons</span>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Pes barra: 40 kg (Homes) / 25 kg (Dones)
                </div>
              </div>

              {/* Estat Idle: Instruccions i botó de Preparació */}
              {simState === 'idle' && (
                <div className="py-6 space-y-6">
                  <div className="w-28 h-28 mx-auto bg-slate-800/80 rounded-3xl p-3 border border-slate-700/60 shadow-lg flex items-center justify-center">
                    <BenchPressIllustration className="w-24 h-24" isAnimated={false} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">
                      Simulacre Press de Banca (45s)
                    </h3>
                    <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
                      Disposaràs de <strong>10 segons de preparació</strong> amb senyals sonors. Després, començarà el compte enrere de 45s amb un <strong>bip rítmic cada 1,02 segons</strong> per marcar la cadència de repetició.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={startPreparation}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-amber-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer mx-auto"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>INICIAR PREPARACIÓ (10s)</span>
                  </button>
                </div>
              )}

              {/* Estat Preparació: 10 segons */}
              {simState === 'preparing' && (
                <div className="py-8 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <span className="text-xs font-black uppercase tracking-widest text-amber-400 animate-pulse">
                    Situa't a la banca i agafa la barra
                  </span>
                  <div className="text-7xl sm:text-8xl font-black font-mono text-amber-400 drop-shadow-md">
                    {prepSecondsLeft}
                  </div>
                  <p className="text-sm text-slate-300">
                    Començant el test en sentir el senyal final...
                  </p>
                  <button
                    type="button"
                    onClick={resetSimulacre}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel·lar
                  </button>
                </div>
              )}

              {/* Estat Test Oficial en Marxa: 45s */}
              {simState === 'running' && (
                <div className="py-6 space-y-5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded-full text-xs font-black uppercase animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      TEST EN CURS
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      Repeticions de ritme: <strong className="text-amber-400">{cadenceBeatsCount}</strong>
                    </span>
                  </div>

                  {/* Rellotge Gran de 45.0s */}
                  <div className="relative inline-flex items-center justify-center">
                    <div className="text-7xl sm:text-8xl font-black font-mono tracking-tight text-white drop-shadow-lg">
                      {testTimeLeft.toFixed(1)}<span className="text-2xl text-slate-500">s</span>
                    </div>
                  </div>

                  {/* Barra de Progrés */}
                  <div className="w-full bg-slate-800/80 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full transition-all duration-100 ease-linear"
                      style={{ width: `${((45 - testTimeLeft) / 45) * 100}%` }}
                    />
                  </div>

                  {/* Indicador de Cadència Pujar / Baixar */}
                  <div className={`p-3 rounded-2xl border text-sm font-bold transition-all ${
                    isCadenceFlash 
                      ? 'bg-amber-500 text-slate-950 border-amber-300 scale-105 shadow-lg shadow-amber-500/30' 
                      : 'bg-slate-800/60 text-slate-300 border-slate-700'
                  }`}>
                    {isCadenceFlash ? '⬆️ PUJAR BARRA (BIP!)' : '⬇️ BAIXAR AMB CONTROL'}
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={finishOfficialTest}
                      className="px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Acabar abans de temps
                    </button>
                    <button
                      type="button"
                      onClick={resetSimulacre}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Reiniciar
                    </button>
                  </div>
                </div>
              )}

              {/* Estat Finalitzat: Formulari de Registre */}
              {simState === 'finished' && (
                <div className="py-4 space-y-6 animate-in zoom-in-95 duration-200">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-black">
                    <CheckCircle2 className="w-4 h-4" />
                    SIMULACRE COMPLETAT!
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Quantes repeticions vàlides has fet?
                  </h3>

                  {/* Selector Gran de Repeticions */}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => setRepsDone(prev => Math.max(0, prev - 1))}
                      className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xl font-black border border-slate-700 cursor-pointer"
                    >
                      <Minus className="w-6 h-6" />
                    </button>

                    <div className="w-32 py-3 bg-slate-950 border-2 border-amber-500/50 rounded-2xl text-center">
                      <span className="text-4xl sm:text-5xl font-black font-mono text-amber-400">
                        {repsDone}
                      </span>
                      <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        repeticions
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRepsDone(prev => prev + 1)}
                      className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xl font-black border border-slate-700 cursor-pointer"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Puntuació Calculada en temps real */}
                  <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 max-w-sm mx-auto flex items-center justify-between">
                    <div className="text-left">
                      <span className="text-xs text-slate-400 block font-semibold">Puntuació Oficial (PB)</span>
                      <span className="text-2xl font-black text-white">
                        {calculatePressBancaPoints(repsDone).points.toFixed(1)}{' '}
                        <span className="text-sm font-semibold text-slate-400">/ 10 punts</span>
                      </span>
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase ${
                      calculatePressBancaPoints(repsDone).points >= 5 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {calculatePressBancaPoints(repsDone).points >= 5 ? 'Aprovat' : 'Suspès'}
                    </div>
                  </div>

                  {/* Configuració de Data i Hora del Registre */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-sm mx-auto text-left">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                        <Calendar className="w-3.5 h-3.5" /> Dia del simulacre
                      </label>
                      <input
                        type="date"
                        value={recordDate}
                        onChange={(e) => setRecordDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                        <Clock className="w-3.5 h-3.5" /> Hora
                      </label>
                      <input
                        type="time"
                        value={recordTime}
                        onChange={(e) => setRecordTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Notes opcionals */}
                  <div className="max-w-sm mx-auto text-left">
                    <input
                      type="text"
                      placeholder="Sensacions, pes utilitzat, observacions..."
                      value={recordNotes}
                      onChange={(e) => setRecordNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-sm mx-auto">
                    <button
                      type="button"
                      onClick={handleSaveRecord}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{saveSuccess ? 'DESAT AMB ÈXIT!' : 'DESAR AL MEU HISTORIAL'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={resetSimulacre}
                      className="w-full sm:w-auto py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Nou simulacre
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Historial d'Evolució de Press de Banca */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <h4 className="font-black text-white text-base">
                  Evolució i Marques Anteriors (Press Banca)
                </h4>
              </div>
              <span className="text-xs text-slate-400 font-semibold">
                {recordsList.length} {recordsList.length === 1 ? 'registre' : 'registres'}
              </span>
            </div>

            {recordsList.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                Encara no has desat cap simulacre de Press de Banca. Fes el teu primer test oficial de 45s a dalt!
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {recordsList.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-3.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800/80 rounded-2xl text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center">
                        <span className="text-xs font-black text-amber-400 font-mono">{rec.rawScore}</span>
                        <span className="text-[9px] text-slate-400 uppercase font-bold">reps</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {rec.points.toFixed(1)} <span className="text-xs text-slate-400 font-normal">punts</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            rec.points >= 5 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {rec.points >= 5 ? 'Apte' : 'No apte'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>📅 {rec.date}</span>
                          <span>🕒 {rec.time}</span>
                          {rec.notes && <span className="italic text-slate-500">“{rec.notes}”</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => requestDeleteRecord(rec)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar registre de simulacre"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONTINGUT SUBPESTANYA 2: PRÀCTICA I RUTINA (ESTIL IMATGE) */}
      {/* ========================================================= */}
      {activeSubTab === 'practica' && (
        <div className="space-y-6">
          {!isWorkoutActive ? (
            /* Vista de selecció i llista d'activitats com la imatge de referència */
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    Activitats i Pràctica
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Selecciona els exercicis que vols realitzar en la teva sessió d'avui.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-amber-400 rounded-full text-xs font-bold border border-slate-700">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Temps estimat: ~{estimatedWorkoutMinutes} min</span>
                </div>
              </div>

              {/* Llista d'exercicis amb targetes netes com a la imatge */}
              <div className="space-y-3">
                {DEFAULT_PRACTICE_EXERCISES.map((exercise) => {
                  const isSelected = selectedExerciseIds.includes(exercise.id);
                  return (
                    <div
                      key={exercise.id}
                      onClick={() => toggleSelectExercise(exercise.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-white text-slate-900 border-white shadow-lg shadow-black/10' 
                          : 'bg-slate-950/70 text-slate-300 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Personatge / Il·lustració mostrant com es fa l'exercici */}
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-slate-100' : 'bg-slate-900'
                        }`}>
                          {exercise.illustration}
                        </div>

                        <div>
                          <h4 className={`text-base font-black leading-tight ${isSelected ? 'text-slate-900' : 'text-white'}`}>
                            {exercise.name}
                          </h4>
                          <span className={`text-xs block mt-0.5 font-semibold ${isSelected ? 'text-slate-600' : 'text-slate-400'}`}>
                            {exercise.subtitle}
                          </span>
                          <span className={`text-[11px] block mt-1 font-medium line-clamp-1 ${isSelected ? 'text-slate-500' : 'text-slate-500'}`}>
                            {exercise.instructions}
                          </span>
                        </div>
                      </div>

                      {/* Checkbox elegant estil imatge */}
                      <div className="pl-3">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-sky-500 text-white shadow-sm' 
                            : 'border-2 border-slate-700 bg-transparent'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botó d'inici de sessió */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-400">
                  {selectedExerciseIds.length} {selectedExerciseIds.length === 1 ? 'exercici seleccionat' : 'exercicis seleccionats'} • {selectedExerciseIds.length * 3} sèries en total
                </div>

                <button
                  type="button"
                  onClick={startWorkoutSession}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>INICIAR SESSIÓ DE PRÀCTICA</span>
                </button>
              </div>
            </div>
          ) : (
            /* Flux de la sessió interactiva d'entrenament activa */
            <div className="space-y-4">
              <div className="flex items-center justify-between px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 rounded-2xl text-[11px] font-semibold shadow-sm">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sessió protegida • Si canvies d'aplicació o vas a WhatsApp, el teu progrés no es perd</span>
                </span>
                <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider hidden sm:inline">
                  Rellotge Real ✓
                </span>
              </div>
              {/* Banner de descans finalitzat en tornar de WhatsApp */}
              {restFinishedWhileAwayNotice && (
                <div className="p-4 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-500/50 rounded-2xl flex items-center justify-between gap-3 text-emerald-200 text-xs font-bold shadow-lg animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{restFinishedWhileAwayNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRestFinishedWhileAwayNotice(null)}
                    className="p-1 hover:bg-emerald-500/20 rounded-lg text-emerald-300 hover:text-white cursor-pointer"
                    title="Descartar avís"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-center">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>
                    Exercici {currentExerciseIndex + 1} de {safeExercises.length}
                  </span>
                  <span className="text-amber-400 font-extrabold">
                    {currentRunningExercise.name}
                  </span>
                </div>

              {/* Dibuix de la postura */}
              <div className="w-28 h-28 mx-auto bg-slate-800/80 rounded-3xl p-3 border border-slate-700 flex items-center justify-center shadow-inner">
                {currentRunningExercise.illustration}
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {currentRunningExercise.name}
                </h3>
                <div className="inline-block mt-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-black">
                  SÈRIE {currentSetIndex} DE {currentRunningExercise.series} • Objectiu: {currentRunningExercise.repsTarget}
                </div>
              </div>

              {/* Si està en mode descans */}
              {isResting ? (
                <div className="p-6 bg-slate-950 border-2 border-amber-500/40 rounded-3xl space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-400" />
                      TEMPS DE DESCANS ACTIU
                    </span>
                    <span className="text-xs text-slate-400">
                      Següent: Sèrie {currentSetIndex} de {currentRunningExercise.name}
                    </span>
                  </div>

                  <div className="text-6xl sm:text-7xl font-black font-mono text-white">
                    {Math.floor(restSecondsLeft / 60)}:{(restSecondsLeft % 60).toString().padStart(2, '0')}
                  </div>

                  {/* Resum de l'última sèrie enregistrada */}
                  {completedSets.length > 0 && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs flex items-center justify-between max-w-md mx-auto">
                      <div className="flex items-center gap-2 text-left">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-black text-emerald-300 block">
                            Sèrie {completedSets[completedSets.length - 1].setNumber} enregistrada:
                          </span>
                          <span className="text-slate-300 text-[11px]">
                            {completedSets[completedSets.length - 1].reps} repeticions
                            {completedSets[completedSets.length - 1].weightKg !== undefined && ` • ${completedSets[completedSets.length - 1].weightKg} kg de pes`}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md font-bold text-[10px]">
                        Desat ✓
                      </span>
                    </div>
                  )}

                  {/* Progrés de sèries d'aquest exercici */}
                  <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto pt-1">
                    {completedSets
                      .filter(s => s.exerciseId === currentRunningExercise.id)
                      .map((s, idx) => (
                        <div key={idx} className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-1.5 shadow-sm">
                          <span className="text-amber-400 font-bold">S{s.setNumber}:</span>
                          <span>{s.reps} reps</span>
                          {s.weightKg !== undefined && <span className="text-sky-400 font-semibold">({s.weightKg}kg)</span>}
                        </div>
                      ))}
                  </div>

                  <div className="flex items-center justify-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-full text-[11px] font-medium max-w-sm mx-auto">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Pots contestar a WhatsApp; el descans continua actiu</span>
                  </div>

                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Respira profundament i hidrata't. Sona un senyal acústic abans de començar la següent sèrie.
                  </p>

                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => adjustRestTime(-15)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      -15s
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustRestTime(30)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      +30s descans
                    </button>
                    <button
                      type="button"
                      onClick={handleSkipRest}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black cursor-pointer shadow transition-all active:scale-95"
                    >
                      Saltar descans ⏭️
                    </button>
                  </div>
                </div>
              ) : (
                /* Estat fent la sèrie */
                <div className="space-y-4 pt-2">
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {currentRunningExercise.instructions}
                  </p>

                  <button
                    type="button"
                    onClick={handleCompleteSet}
                    className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-emerald-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mx-auto"
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>COMPLETAR I REGISTRAR SÈRIE {currentSetIndex}</span>
                  </button>
                </div>
              )}

              {/* Botons de navegació entre exercicis */}
              <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleSkipExercise}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Saltar exercici</span>
                </button>

                <button
                  type="button"
                  onClick={requestCancelActiveWorkout}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Finalitzar sessió
                </button>
              </div>
            </div>
            </div>
          )}

          {/* Historial de sessions de pràctica */}
          {practiceHistory.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  Sessions d'Entrenament Completades ({practiceHistory.length})
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">
                  Toca per veure el desglossament de cada sèrie
                </span>
              </div>

              <div className="space-y-3">
                {practiceHistory.slice(0, 8).map(session => {
                  const isExpanded = expandedSessionId === session.id;
                  return (
                    <div 
                      key={session.id} 
                      className="p-3.5 bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl text-xs transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">
                              Entrenament de {session.durationMinutes} min
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[10px]">
                              {session.totalSets} sèries
                            </span>
                            <span className="text-amber-400 font-bold">
                              {'⭐'.repeat(session.feelingsRating || 3)}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                            <span>📅 {session.date} • 🕒 {session.time}</span>
                            {session.feelingsText && (
                              <span className="italic text-slate-400">“{session.feelingsText}”</span>
                            )}
                          </div>
                        </div>

                        {/* Botons d'acció de la sessió de l'historial */}
                        <div className="flex items-center gap-2 shrink-0">
                          {session.setsDetail && session.setsDetail.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span>{isExpanded ? 'Ocultar' : 'Detall'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const shareText = generateWorkoutWhatsAppMessage(
                                session.date,
                                session.time,
                                session.durationMinutes,
                                session.setsDetail || [],
                                session.feelingsRating,
                                session.feelingsText
                              );
                              handleShareWhatsApp(shareText);
                            }}
                            className="px-3 py-1.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 rounded-xl text-[11px] font-black flex items-center gap-1.5 cursor-pointer transition-colors"
                            title="Compartir per WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => requestDeleteSession(session)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                            title="Eliminar sessió d'entrenament"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Desglossament detallat de sèries quan s'expandeix */}
                      {isExpanded && session.setsDetail && session.setsDetail.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 animate-in fade-in duration-150">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                            Detall de cada sèrie realitzada:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {session.setsDetail.map((s, idx) => (
                              <div key={idx} className="p-2 bg-slate-900 rounded-xl border border-slate-800/80 flex items-center justify-between">
                                <div className="text-left">
                                  <span className="text-[11px] font-bold text-slate-300 block truncate max-w-[150px]">
                                    {s.exerciseName}
                                  </span>
                                  <span className="text-[10px] text-amber-400 font-semibold">
                                    Sèrie {s.setNumber}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-black text-white font-mono block">
                                    {s.reps} reps
                                  </span>
                                  {s.weightKg !== undefined && s.weightKg > 0 && (
                                    <span className="text-[10px] text-sky-400 font-bold block">
                                      {s.weightKg} kg
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
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL PER REGISTRAR REPETICIONS I PES DE LA SÈRIE        */}
      {/* ========================================================= */}
      {showSetInputModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-center">
            {/* Header del modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3 text-left">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block">
                    Sèrie {currentSetIndex} de {currentRunningExercise.series}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    {currentRunningExercise.name}
                  </h3>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block">Descans següent:</span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {Math.floor(currentRunningExercise.restSeconds / 60)}:{(currentRunningExercise.restSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* SECCIÓ 1: REPETICIONS TOTALS */}
            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Repeticions totals de la sèrie:</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Objectiu: <strong className="text-slate-200">{currentRunningExercise.repsTarget}</strong>
                </span>
              </div>

              {/* Selector de repeticions gran */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentSetReps(prev => Math.max(0, prev - 1))}
                  className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xl font-black border border-slate-700 cursor-pointer transition-colors active:scale-95"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="w-28 py-2.5 bg-slate-900 border-2 border-amber-500/60 rounded-2xl text-center">
                  <input
                    type="number"
                    min="0"
                    max="150"
                    value={currentSetReps}
                    onChange={(e) => setCurrentSetReps(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-center text-3xl font-black font-mono text-amber-400 bg-transparent focus:outline-none"
                  />
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    repeticions
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentSetReps(prev => prev + 1)}
                  className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xl font-black border border-slate-700 cursor-pointer transition-colors active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Botons ràpids de repeticions segons exercici */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                {(currentRunningExercise.id === 'pb_barra' 
                  ? [10, 12, 15, 18, 20, 25] 
                  : currentRunningExercise.id === 'flexions_triceps'
                    ? [10, 15, 20, 25, 30, 35]
                    : [8, 10, 12, 15, 18, 20]
                ).map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCurrentSetReps(val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentSetReps === val
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {val} reps
                  </button>
                ))}
              </div>
            </div>

            {/* SECCIÓ 2: PES TOTAL (Només en Press de Banca) */}
            {currentRunningExercise.id === 'pb_barra' && (
              <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Dumbbell className="w-4 h-4 text-sky-400" />
                    <span>Pes total de la sèrie (amb barra inclosa):</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Oficial: <strong className="text-slate-200">40 kg H / 25 kg D</strong>
                  </span>
                </div>

                {/* Selector de Pes gran */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentSetWeight(prev => Math.max(0, +(prev - 2.5).toFixed(1)))}
                    className="px-3 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs font-bold border border-slate-700 cursor-pointer transition-colors active:scale-95"
                  >
                    -2.5kg
                  </button>

                  <div className="w-36 py-2.5 bg-slate-900 border-2 border-sky-500/60 rounded-2xl text-center">
                    <div className="flex items-center justify-center">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="250"
                        value={currentSetWeight}
                        onChange={(e) => setCurrentSetWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-24 text-center text-3xl font-black font-mono text-sky-400 bg-transparent focus:outline-none"
                      />
                      <span className="text-lg font-bold text-slate-400 mr-2">kg</span>
                    </div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      pes total barra
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentSetWeight(prev => +(prev + 2.5).toFixed(1))}
                    className="px-3 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs font-bold border border-slate-700 cursor-pointer transition-colors active:scale-95"
                  >
                    +2.5kg
                  </button>
                </div>

                {/* Botons ràpids de pes de barra */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  {[
                    { val: 25, label: '25 kg (Dones)' },
                    { val: 35, label: '35 kg' },
                    { val: 40, label: '40 kg (Homes)' },
                    { val: 45, label: '45 kg' },
                    { val: 50, label: '50 kg' },
                    { val: 60, label: '60 kg' }
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setCurrentSetWeight(item.val)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentSetWeight === item.val
                          ? 'bg-sky-500 text-slate-950 font-black shadow-sm'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Camp opcional de llast/pes addicional per a flexions o fons */}
            {(currentRunningExercise.id === 'fons_triceps_pit' || currentRunningExercise.id === 'flexions_triceps') && (
              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-left">
                <span className="text-slate-400">Llast o pes extra addicional (opcional):</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    placeholder="0"
                    value={currentSetWeight === 0 ? '' : currentSetWeight}
                    onChange={(e) => setCurrentSetWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-slate-400 font-semibold">kg</span>
                </div>
              </div>
            )}

            {/* Botons d'acció del modal */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmSetLog}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-amber-500/25 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>
                  {currentSetIndex >= currentRunningExercise.series && currentExerciseIndex >= activeExercises.length - 1
                    ? 'GUARDAR I FINALITZAR ENTRENAMENT 🏆'
                    : `GUARDAR I INICIAR DESCANS (⏱️ ${Math.floor(currentRunningExercise.restSeconds / 60)}:${(currentRunningExercise.restSeconds % 60).toString().padStart(2, '0')})`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowSetInputModal(false)}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Cancel·lar i tornar a l'exercici
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DE FINALITZACIÓ, SENSACIONS I COMPARTIR WHATSAPP   */}
      {/* ========================================================= */}
      {showWorkoutFeelingsModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-center my-6">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 text-amber-400 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/30 shadow-inner">
              <Award className="w-8 h-8 text-amber-400" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 block mb-1">
                ACADÈMIA MEED • MOSSOS D'ESQUADRA
              </span>
              <h3 className="text-2xl font-black text-white tracking-tight">
                Entrenament Completat!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                📅 {new Date().toLocaleDateString('ca-ES')} • ⏱️ {Math.max(1, Math.round((Date.now() - workoutStartTime) / 60000))} minuts • {completedSets.length} sèries totals
              </p>
            </div>

            {/* DETALL DE L'ENTRENAMENT REALITZAT (PESOS I REPETICIONS) */}
            {completedSets.length > 0 && (
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                    Resum de Sèries i Pesos
                  </span>
                  <span className="text-[11px] text-emerald-400 font-bold">
                    {completedSets.length} sèries realitzades
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {/* Agrupar per exercici */}
                  {Array.from(new Set(completedSets.map(s => s.exerciseName))).map((exName) => {
                    const exSets = completedSets.filter(s => s.exerciseName === exName);
                    return (
                      <div key={exName} className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                        <span className="text-xs font-bold text-white block mb-1">
                          {exName}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {exSets.map(s => (
                            <span 
                              key={s.setNumber}
                              className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-300 font-medium"
                            >
                              S{s.setNumber}: <strong className="text-amber-400 font-mono">{s.reps} reps</strong>
                              {s.weightKg !== undefined && s.weightKg > 0 && (
                                <span className="text-sky-400 ml-1">({s.weightKg}kg)</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Escala de sensacions 1 a 5 */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block text-left">
                Com han estat les teves sensacions d'avui?
              </span>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { rating: 1, label: 'Molt fluix', icon: '😴' },
                  { rating: 2, label: 'Còmode', icon: '😊' },
                  { rating: 3, label: 'Òptim', icon: '💪' },
                  { rating: 4, label: 'Exigent', icon: '🔥' },
                  { rating: 5, label: 'Al límit', icon: '🥵' }
                ].map(item => (
                  <button
                    key={item.rating}
                    type="button"
                    onClick={() => setFeelingsRating(item.rating)}
                    className={`p-2 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      feelingsRating === item.rating
                        ? 'bg-amber-500 text-slate-950 border-amber-400 scale-105 font-black shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-[10px] mt-1 font-bold leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Camp de text lliure */}
            <div className="text-left">
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Notes o comentaris de la sessió (opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: 18 reps a la 1a sèrie amb 40kg, molt bona congestió al pit..."
                value={feelingsNotes}
                onChange={(e) => setFeelingsNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* BOTÓ DESTACAT PER COMPARTIR A WHATSAPP */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleShareWhatsApp()}
                className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-[#25D366]/25 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>COMPARTIR ENTRENAMENT PER WHATSAPP</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopySummary()}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                >
                  {copiedToast ? (
                    <>
                      <CheckCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copiat al porta-retalls!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar text resum</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={saveWorkoutFeelings}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>DESAR I FINALITZAR</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DE SEGURETAT PER CONFIRMAR ELIMINACIÓ               */}
      {/* ========================================================= */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-center my-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border ${
              deleteConfirmation.type === 'active_workout'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}>
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">
                {deleteConfirmation.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {deleteConfirmation.type === 'active_workout'
                  ? "Estàs a punt d'aturar la sessió activa d'entrenament."
                  : 'Missatge de seguretat: Aquesta acció és irreversible i no es podrà recuperar.'}
              </p>
            </div>

            {/* Targeta amb el detall del registre o sessió */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-left text-xs text-slate-300">
              <span className="font-bold text-white block mb-0.5">Element seleccionat:</span>
              <p className="text-slate-400">{deleteConfirmation.details}</p>
            </div>

            {deleteConfirmation.type === 'active_workout' ? (
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmation(null);
                    finishWorkout();
                  }}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Desar el que porto i finalitzar</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDeleteAction}
                  className="w-full py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Descartar entrenament sense desar
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteConfirmation(null)}
                  className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Continuar entrenant
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel·lar
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDeleteAction}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs transition-all shadow-lg shadow-red-600/30 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Sí, eliminar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
