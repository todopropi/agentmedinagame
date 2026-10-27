import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../../types';
import { CourseNavetteIllustration } from './ExerciseIllustrations';
import { AudioEngine } from '../../utils/audio';
import { calculateCourseNavettePoints } from '../../utils/physicalScoring';
import { 
  savePhysicalRecord, 
  getPhysicalRecords, 
  deletePhysicalRecord, 
  fetchPhysicalDataFromCloud,
  PhysicalScoreRecord 
} from '../../utils/physicalStorage';
import { 
  Play, 
  Square, 
  Check, 
  Clock, 
  Calendar, 
  Award, 
  Volume2, 
  Upload, 
  Trash2, 
  Sparkles, 
  FileAudio, 
  TrendingUp,
  AlertCircle,
  Smartphone,
  Gauge,
  Activity,
  FastForward,
  RotateCcw,
  CheckCircle2,
  MessageCircle,
  Dumbbell,
  Server,
  Loader2,
  HardDrive
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CursaLlancadoraViewProps {
  user: UserProfile;
  onRecordSaved?: () => void;
}

export interface NavetteStage {
  stageId: string;
  name: string;
  palier: number;
  periodNum: number;
  isHalf: boolean;
  startSec: number;
  endSec: number;
  speedKmH: number;
  description: string;
}

// Taula Oficial de Períodes i Trams exactes Course Navette segons l'àudio oficial de la convocatòria
export const NAVETTE_OFFICIAL_STAGES: NavetteStage[] = [
  { stageId: 'intro', name: 'Explicació Oficial', palier: 0, periodNum: 0, isHalf: false, startSec: 0, endSec: 37, speedKmH: 0, description: 'Instruccions oficials i preparació' },
  { stageId: 'countdown', name: 'Compte Enrere (5s)', palier: 0, periodNum: 0, isHalf: false, startSec: 37, endSec: 44, speedKmH: 0, description: 'Atents a la línia de sortida (compte enrere)' },
  { stageId: 'p1_half', name: 'Inici 1r Període (0.5)', palier: 0.5, periodNum: 1, isHalf: true, startSec: 44, endSec: 70, speedKmH: 8.5, description: 'Inici de cursa a 8,5 km/h (1a meitat)' },
  { stageId: 'p1_full', name: 'Fi Període 1 (Palier 1.0)', palier: 1.0, periodNum: 1, isHalf: false, startSec: 70, endSec: 104, speedKmH: 8.5, description: '1r període completat (Palier 1 assolit)' },
  { stageId: 'p2_half', name: 'Inici 2n Període (1.5)', palier: 1.5, periodNum: 2, isHalf: true, startSec: 104, endSec: 136, speedKmH: 9.0, description: 'Acceleració a 9,0 km/h (Període 1 i mig)' },
  { stageId: 'p2_full', name: 'Fi Període 2 (Palier 2.0)', palier: 2.0, periodNum: 2, isHalf: false, startSec: 136, endSec: 168, speedKmH: 9.0, description: '2n període completat (Palier 2 assolit)' },
  { stageId: 'p3_half', name: 'Inici 3r Període (2.5)', palier: 2.5, periodNum: 3, isHalf: true, startSec: 168, endSec: 198, speedKmH: 9.5, description: 'Acceleració a 9,5 km/h (Període 2 i mig)' },
  { stageId: 'p3_full', name: 'Fi Període 3 (Palier 3.0)', palier: 3.0, periodNum: 3, isHalf: false, startSec: 198, endSec: 229, speedKmH: 9.5, description: '3r període completat (Palier 3 assolit)' },
  { stageId: 'p4_half', name: 'Inici 4t Període (3.5)', palier: 3.5, periodNum: 4, isHalf: true, startSec: 229, endSec: 264, speedKmH: 10.0, description: 'Acceleració a 10,0 km/h (Període 3 i mig)' },
  { stageId: 'p4_full', name: 'Fi Període 4 (Palier 4.0)', palier: 4.0, periodNum: 4, isHalf: false, startSec: 264, endSec: 286, speedKmH: 10.0, description: '4t període completat (Palier 4 assolit)' },
  { stageId: 'p5_half', name: 'Inici 5è Període (4.5)', palier: 4.5, periodNum: 5, isHalf: true, startSec: 286, endSec: 320, speedKmH: 10.5, description: 'Acceleració a 10,5 km/h (Període 4 i mig)' },
  { stageId: 'p5_full', name: 'Fi Període 5 (Palier 5.0)', palier: 5.0, periodNum: 5, isHalf: false, startSec: 320, endSec: 347, speedKmH: 10.5, description: '5è període completat (Palier 5 assolit)' },
  { stageId: 'p6_half', name: 'Inici 6è Període (5.5)', palier: 5.5, periodNum: 6, isHalf: true, startSec: 347, endSec: 386, speedKmH: 11.0, description: 'Acceleració a 11,0 km/h (Període 5 i mig)' },
  { stageId: 'p6_full', name: 'Fi Període 6 (Palier 6.0)', palier: 6.0, periodNum: 6, isHalf: false, startSec: 386, endSec: 406, speedKmH: 11.0, description: '6è període completat (Palier 6 assolit)' },
  { stageId: 'p7_half', name: 'Inici 7è Període (6.5)', palier: 6.5, periodNum: 7, isHalf: true, startSec: 406, endSec: 437, speedKmH: 11.5, description: 'Acceleració a 11,5 km/h (Període 6 i mig)' },
  { stageId: 'p7_full', name: 'Fi Període 7 (Palier 7.0)', palier: 7.0, periodNum: 7, isHalf: false, startSec: 437, endSec: 468, speedKmH: 11.5, description: '7è període completat (Palier 7 assolit)' },
  { stageId: 'p8_half', name: 'Inici 8è Període (7.5)', palier: 7.5, periodNum: 8, isHalf: true, startSec: 468, endSec: 498, speedKmH: 12.0, description: 'Acceleració a 12,0 km/h (Període 7 i mig)' },
  { stageId: 'p8_full', name: 'Fi Període 8 (Palier 8.0)', palier: 8.0, periodNum: 8, isHalf: false, startSec: 498, endSec: 528, speedKmH: 12.0, description: '8è període completat (Palier 8 assolit)' },
  { stageId: 'p9_half', name: 'Inici 9è Període (8.5)', palier: 8.5, periodNum: 9, isHalf: true, startSec: 528, endSec: 557, speedKmH: 12.5, description: 'Acceleració a 12,5 km/h (Període 8 i mig)' },
  { stageId: 'p9_full', name: 'Fi Període 9 (Palier 9.0)', palier: 9.0, periodNum: 9, isHalf: false, startSec: 557, endSec: 586, speedKmH: 12.5, description: '9è període completat (Palier 9 assolit)' },
  { stageId: 'p10_half', name: 'Inici 10è Període (9.5)', palier: 9.5, periodNum: 10, isHalf: true, startSec: 586, endSec: 613, speedKmH: 13.0, description: 'Acceleració a 13,0 km/h (Període 9 i mig)' },
  { stageId: 'p10_full', name: 'Fi Període 10 (Palier 10.0)', palier: 10.0, periodNum: 10, isHalf: false, startSec: 613, endSec: 647, speedKmH: 13.0, description: '10è període completat (Palier 10 assolit)' },
  { stageId: 'p11_half', name: 'Inici 11è Període (10.5)', palier: 10.5, periodNum: 11, isHalf: true, startSec: 647, endSec: 679, speedKmH: 13.5, description: 'Acceleració a 13,5 km/h (Període 10 i mig)' },
  { stageId: 'p11_full', name: 'Fi Període 11 (Palier 11.0)', palier: 11.0, periodNum: 11, isHalf: false, startSec: 679, endSec: 707, speedKmH: 13.5, description: '11è període completat (Palier 11 assolit)' },
  { stageId: 'p12_half', name: 'Inici 12è Període (11.5)', palier: 11.5, periodNum: 12, isHalf: true, startSec: 707, endSec: 736, speedKmH: 14.0, description: 'Acceleració a 14,0 km/h (Període 11 i mig)' },
  { stageId: 'p12_full', name: 'Fi Període 12 (Palier 12.0)', palier: 12.0, periodNum: 12, isHalf: false, startSec: 736, endSec: 767, speedKmH: 14.0, description: '12è període completat (Palier 12 assolit)' },
  { stageId: 'p13_half', name: 'Inici 13è Període (12.5)', palier: 12.5, periodNum: 13, isHalf: true, startSec: 767, endSec: 797, speedKmH: 14.5, description: 'Acceleració a 14,5 km/h (Període 12 i mig)' },
  { stageId: 'p13_full', name: 'Fi Període 13 (Palier 13.0)', palier: 13.0, periodNum: 13, isHalf: false, startSec: 797, endSec: 826, speedKmH: 14.5, description: '13è període completat (Palier 13 assolit - Màxim)' }
];

export function getNavetteStageAtSecond(seconds: number): NavetteStage {
  for (let i = NAVETTE_OFFICIAL_STAGES.length - 1; i >= 0; i--) {
    if (seconds >= NAVETTE_OFFICIAL_STAGES[i].startSec) {
      return NAVETTE_OFFICIAL_STAGES[i];
    }
  }
  return NAVETTE_OFFICIAL_STAGES[0];
}

export const CursaLlancadoraView: React.FC<CursaLlancadoraViewProps> = ({ user, onRecordSaved }) => {
  // Subpestanyes: Simulacre Oficial vs Pràctica per Períodes
  const [activeSubTab, setActiveSubTab] = useState<'simulacre' | 'practica'>(() => {
    try {
      const saved = localStorage.getItem('agent_medina_cl_subtab');
      if (saved === 'simulacre' || saved === 'practica') return saved;
    } catch (e) {}
    return 'simulacre';
  });

  useEffect(() => {
    try {
      localStorage.setItem('agent_medina_cl_subtab', activeSubTab);
    } catch (e) {}
  }, [activeSubTab]);

  const initialNavetteWorkout = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('agent_medina_active_cl_workout');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Date.now() - (parsed.lastUpdated || 0) < 30 * 60 * 1000) {
          return parsed;
        }
      }
    } catch {}
    return null;
  }, []);

  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    return Boolean(initialNavetteWorkout?.isPlaying);
  });
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    if (initialNavetteWorkout) {
      if (initialNavetteWorkout.isPlaying && initialNavetteWorkout.startWallTime) {
        const wall = Math.floor((Date.now() - initialNavetteWorkout.startWallTime) / 1000);
        return Math.min(826, Math.max(0, wall));
      }
      return initialNavetteWorkout.elapsedSeconds || 0;
    }
    return 0;
  });
  const [isFinishingModalOpen, setIsFinishingModalOpen] = useState<boolean>(false);

  // Configuració de Mode Pràctica (entrenar períodes específics o d'un a un altre)
  const [practiceStartPeriod, setPracticeStartPeriod] = useState<number>(() => {
    return initialNavetteWorkout?.practiceStartPeriod ?? 1;
  });
  const [practiceEndPeriod, setPracticeEndPeriod] = useState<number | 'unlimited'>(() => {
    return initialNavetteWorkout?.practiceEndPeriod ?? 'unlimited';
  });

  // Dades de finalització i registre
  const [selectedPalier, setSelectedPalier] = useState<number>(8.5);
  const [recordDate, setRecordDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recordTime, setRecordTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [recordNotes, setRecordNotes] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Gestió d'àudio personalitzat o per defecte
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioFileName, setCustomAudioFileName] = useState<string | null>(null);
  const [serverAudioAvailable, setServerAudioAvailable] = useState<boolean>(false);
  const [serverAudioSize, setServerAudioSize] = useState<number>(0);
  const [isUploadingServerAudio, setIsUploadingServerAudio] = useState<boolean>(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);

  // Comprovar si l'àudio oficial està disponible al servidor Express per a tothom
  useEffect(() => {
    fetch('/api/navette-audio-status')
      .then(res => res.json())
      .then(data => {
        if (data && data.exists) {
          setServerAudioAvailable(true);
          if (data.fileSize) setServerAudioSize(data.fileSize);
        }
      })
      .catch(console.warn);
  }, []);

  // Historial de simulacres de CL
  const [recordsList, setRecordsList] = useState<PhysicalScoreRecord[]>([]);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const wakeLockRef = useRef<any>(null);
  const startWallTimeRef = useRef<number>(initialNavetteWorkout?.startWallTime || 0);
  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;
  const elapsedSecondsRef = useRef<number>(elapsedSeconds);
  elapsedSecondsRef.current = elapsedSeconds;

  const saveNavetteSnapshot = (overrides?: Partial<any>) => {
    try {
      const playing = overrides?.isPlaying !== undefined ? overrides.isPlaying : isPlayingRef.current;
      const elapsed = overrides?.elapsedSeconds !== undefined ? overrides.elapsedSeconds : elapsedSecondsRef.current;
      if (!playing && elapsed === 0) {
        localStorage.removeItem('agent_medina_active_cl_workout');
        return;
      }
      const payload = {
        isPlaying: playing,
        elapsedSeconds: elapsed,
        startWallTime: overrides?.startWallTime ?? startWallTimeRef.current,
        activeSubTab: overrides?.activeSubTab ?? activeSubTab,
        practiceStartPeriod,
        practiceEndPeriod,
        lastUpdated: Date.now()
      };
      localStorage.setItem('agent_medina_active_cl_workout', JSON.stringify(payload));
      localStorage.setItem('agent_medina_fisiques_tab', 'cursa_llancadora');
      localStorage.setItem('agent_medina_main_mode', 'fisiques');
    } catch (e) {}
  };

  const loadHistory = () => {
    const list = getPhysicalRecords(user.uid || user.email, user.email).filter(r => r.testType === 'CL');
    setRecordsList(list);

    fetchPhysicalDataFromCloud(user.uid, user.email).then(data => {
      if (data && Array.isArray(data.records)) {
        const cloudList = data.records.filter(r => r.testType === 'CL');
        setRecordsList(cloudList);
      }
    }).catch(console.warn);
  };

  useEffect(() => {
    loadHistory();
    const handleSyncEvent = () => loadHistory();
    window.addEventListener('physical_records_updated', handleSyncEvent);
    return () => window.removeEventListener('physical_records_updated', handleSyncEvent);
  }, [user.email, user.uid]);

  // Configuració de WakeLock per mantenir la pantalla encesa
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        setWakeLockActive(true);
      }
    } catch (err) {
      console.warn('WakeLock no disponible o bloquejat', err);
    }
  };

  const releaseWakeLock = () => {
    try {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
        setWakeLockActive(false);
      }
    } catch (e) {}
  };

  // Configuració de MediaSession perquè no s'aturi en bloquejar la pantalla
  const setupMediaSession = () => {
    if ('mediaSession' in navigator) {
      const currentStage = getNavetteStageAtSecond(elapsedSecondsRef.current);
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `Cursa Llançadora - ${currentStage.name}`,
        artist: 'Agent Medina • Mossos d\'Esquadra 2026',
        album: `Velocitat: ${currentStage.speedKmH} km/h • Palier: ${currentStage.palier}`
      });

      navigator.mediaSession.setActionHandler('play', () => startTest());
      navigator.mediaSession.setActionHandler('pause', () => pauseTest());
      navigator.mediaSession.setActionHandler('stop', () => handleOpenFinishModal());
    }
  };

  // Carregar àudio desat a localStorage si n'hi ha
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('agent_medina_custom_navette_name');
      if (savedName) setCustomAudioFileName(savedName);
    } catch (e) {}
  }, []);

  // Protecció contra WhatsApp / Bloqueig de pantalla / Recàrrega
  useEffect(() => {
    const handleVisibilitySync = () => {
      if (document.visibilityState === 'visible' && isPlayingRef.current) {
        if (audioElementRef.current && !audioElementRef.current.paused) {
          const currentAudioSec = Math.floor(audioElementRef.current.currentTime);
          setElapsedSeconds(currentAudioSec);
        } else if (startWallTimeRef.current > 0) {
          const now = Date.now();
          const wallElapsed = Math.floor((now - startWallTimeRef.current) / 1000);
          setElapsedSeconds(wallElapsed);
          if (audioElementRef.current) {
            audioElementRef.current.currentTime = wallElapsed;
          }
        }
      }
      saveNavetteSnapshot();
    };

    const handleSaveSnapshot = () => {
      saveNavetteSnapshot();
    };

    document.addEventListener('visibilitychange', handleVisibilitySync);
    window.addEventListener('focus', handleVisibilitySync);
    window.addEventListener('pagehide', handleSaveSnapshot);
    window.addEventListener('beforeunload', handleSaveSnapshot);
    window.addEventListener('freeze', handleSaveSnapshot);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilitySync);
      window.removeEventListener('focus', handleVisibilitySync);
      window.removeEventListener('pagehide', handleSaveSnapshot);
      window.removeEventListener('beforeunload', handleSaveSnapshot);
      window.removeEventListener('freeze', handleSaveSnapshot);
    };
  }, [activeSubTab, practiceStartPeriod, practiceEndPeriod]);

  // Control del temps precís, efectes sonors i parada automàtica si s'ha configurat fi de període a Pràctica
  useEffect(() => {
    if (isPlaying) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => {
          let next = prev + 1;
          if (audioElementRef.current && !audioElementRef.current.paused) {
            const audioSec = Math.floor(audioElementRef.current.currentTime);
            if (Math.abs(audioSec - next) > 1) {
              next = audioSec;
            }
          }

          // Senyals sonors oficials de la Course Navette
          if (next >= 37 && next <= 43) {
            AudioEngine.playNavetteCountdownBeep(44 - next);
          } else if (next === 44) {
            AudioEngine.playNavetteCountdownBeep(0);
          } else if (next > 44) {
            const curStage = getNavetteStageAtSecond(next);
            if (next === curStage.startSec) {
              AudioEngine.playPalierChange();
            } else if (curStage.speedKmH > 0) {
              const shuttleInterval = Math.max(4, Math.round(20 / (curStage.speedKmH / 3.6)));
              const offsetInStage = next - curStage.startSec;
              if (offsetInStage > 0 && offsetInStage % shuttleInterval === 0) {
                AudioEngine.playNavetteShuttleBeep();
              }
            }
          }

          // Si estem en Mode Pràctica i s'ha configurat un període de fi
          if (activeSubTab === 'practica' && typeof practiceEndPeriod === 'number') {
            const endStage = NAVETTE_OFFICIAL_STAGES.find(s => s.periodNum === practiceEndPeriod && !s.isHalf);
            if (endStage && next >= endStage.endSec) {
              pauseTest();
              AudioEngine.playWhistle();
              AudioEngine.playRestFinishedChime();
              return endStage.endSec;
            }
          }

          return next;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isPlaying, activeSubTab, practiceEndPeriod]);

  // Gestionar pujada d'arxiu MP3 personalitzat
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomAudioUrl(url);
      setCustomAudioFileName(file.name);
      try {
        localStorage.setItem('agent_medina_custom_navette_name', file.name);
      } catch (err) {}
      AudioEngine.playClick();
    }
  };

  const startTest = async (startAtSec?: number) => {
    const targetSec = startAtSec !== undefined ? startAtSec : elapsedSecondsRef.current;
    setElapsedSeconds(targetSec);
    const wallStart = Date.now() - targetSec * 1000;
    startWallTimeRef.current = wallStart;
    setIsPlaying(true);
    isPlayingRef.current = true;
    saveNavetteSnapshot({ isPlaying: true, elapsedSeconds: targetSec, startWallTime: wallStart });
    await requestWakeLock();
    setupMediaSession();

    if (audioElementRef.current) {
      try {
        audioElementRef.current.currentTime = targetSec;
        await audioElementRef.current.play();
      } catch (err) {
        console.warn('Audio play error, using WebAudio fallback:', err);
      }
    }
    AudioEngine.playPrepBeep(true);
  };

  const pauseTest = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    saveNavetteSnapshot({ isPlaying: false, elapsedSeconds: elapsedSecondsRef.current });
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
  };

  // Salt directe a la compte enrere de 5 segons (00:37) demanat per l'usuari
  const skipExplanationToCountdown = () => {
    AudioEngine.playClick();
    const countdownSec = 37;
    setElapsedSeconds(countdownSec);
    startWallTimeRef.current = Date.now() - countdownSec * 1000;
    saveNavetteSnapshot({ elapsedSeconds: countdownSec, startWallTime: startWallTimeRef.current });
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = countdownSec;
      if (isPlaying) {
        audioElementRef.current.play().catch(console.warn);
      }
    }
    AudioEngine.playNavetteCountdownBeep(5);
  };

  // Salt directe a l'inici de la cursa (00:44)
  const skipToRaceStart = () => {
    AudioEngine.playClick();
    const raceStartSec = 44;
    setElapsedSeconds(raceStartSec);
    startWallTimeRef.current = Date.now() - raceStartSec * 1000;
    saveNavetteSnapshot({ elapsedSeconds: raceStartSec, startWallTime: startWallTimeRef.current });
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = raceStartSec;
      if (isPlaying) {
        audioElementRef.current.play().catch(console.warn);
      }
    }
    AudioEngine.playNavetteCountdownBeep(0);
  };

  // Salt directe a qualsevol segon / període
  const seekToSecond = (sec: number) => {
    AudioEngine.playClick();
    setElapsedSeconds(sec);
    startWallTimeRef.current = Date.now() - sec * 1000;
    saveNavetteSnapshot({ elapsedSeconds: sec, startWallTime: startWallTimeRef.current });
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = sec;
      if (isPlaying) {
        audioElementRef.current.play().catch(console.warn);
      }
    }
  };

  // Iniciar pràctica de període seleccionat
  const startPeriodPractice = (periodNum: number) => {
    AudioEngine.playClick();
    let stage = NAVETTE_OFFICIAL_STAGES.find(s => s.periodNum === periodNum && s.isHalf);
    if (!stage) {
      stage = NAVETTE_OFFICIAL_STAGES.find(s => s.periodNum === periodNum);
    }
    const sec = stage ? stage.startSec : 44;
    startTest(sec);
  };

  const currentStage = getNavetteStageAtSecond(elapsedSeconds);
  const currentSpeed = currentStage.speedKmH > 0 ? currentStage.speedKmH : 8.5;
  const currentPalier = currentStage.palier;

  const handleOpenFinishModal = () => {
    pauseTest();
    releaseWakeLock();
    setSelectedPalier(currentPalier > 0 ? currentPalier : 8.5);
    setIsFinishingModalOpen(true);
    AudioEngine.playWhistle();
  };

  const handleSaveRecord = () => {
    const scoreData = calculateCourseNavettePoints(selectedPalier);
    savePhysicalRecord(user.uid || user.email, {
      userId: user.uid,
      userEmail: user.email || 'aspirant@agentmedina.cat',
      testType: 'CL',
      rawScore: selectedPalier,
      points: scoreData.points,
      tier: scoreData.tier,
      date: recordDate,
      time: recordTime,
      notes: recordNotes || (activeSubTab === 'practica' ? `Pràctica Període ${practiceStartPeriod}` : undefined)
    }, user.email);

    setSaveSuccess(true);
    loadHistory();
    if (onRecordSaved) onRecordSaved();
    confetti({ particleCount: 60, spread: 60 });
    setTimeout(() => {
      setSaveSuccess(false);
      setIsFinishingModalOpen(false);
    }, 1200);
  };

  const handleDeleteRecord = (id: string) => {
    AudioEngine.playClick();
    deletePhysicalRecord(user.uid || user.email, id, user.email);
    setRecordsList(prev => prev.filter(r => r.id !== id));
    if (onRecordSaved) onRecordSaved();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Llista de períodes oficials per a la selecció de pràctica (1 al 13)
  const uniquePeriods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

  return (
    <div className="space-y-6">
      {/* Selector de subpestanyes: Simulacre Oficial vs Pràctica per Períodes */}
      <div className="flex items-center justify-center p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 max-w-md mx-auto shadow-inner">
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('simulacre');
            AudioEngine.playClick();
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'simulacre'
              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Simulacre Oficial</span>
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
          <span>Pràctica per Períodes</span>
        </button>
      </div>

      {/* Targeta Principal de la Cursa Llançadora */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xl text-center relative overflow-hidden">
        {/* Àudio Tag connectat */}
        <audio
          ref={audioElementRef}
          src={customAudioUrl || '/audio/beep.mp3'}
          playsInline
          loop={!customAudioUrl}
          preload="auto"
          onTimeUpdate={() => {
            if (audioElementRef.current && isPlaying) {
              setElapsedSeconds(Math.floor(audioElementRef.current.currentTime));
            }
          }}
        />

        <div className="max-w-xl mx-auto space-y-5">
          {/* Indicadors de capçalera */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-full border border-sky-500/20">
              <Activity className="w-3.5 h-3.5" />
              <span>Cursa de 20 metres (Anada i Tornada)</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
              <Smartphone className={`w-3.5 h-3.5 ${wakeLockActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{wakeLockActive ? 'Pantalla activa' : 'Mode segon pla actiu'}</span>
            </div>
          </div>

          {/* Banner de protecció WhatsApp */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 rounded-2xl text-[11px] font-semibold shadow-sm">
            <span className="flex items-center gap-2 text-left">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sessió protegida • Pots contestar a WhatsApp; l'àudio i el cronòmetre continuen</span>
            </span>
            <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider hidden sm:inline">
              Rellotge Real ✓
            </span>
          </div>

          <div className="w-24 h-24 mx-auto bg-slate-800/80 rounded-3xl p-3 border border-slate-700/60 shadow-lg flex items-center justify-center">
            <CourseNavetteIllustration className="w-20 h-20" />
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {activeSubTab === 'simulacre' ? 'Simulacre Oficial Course Navette' : 'Entrenament i Pràctica per Períodes'}
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
              {activeSubTab === 'simulacre' 
                ? 'Cronometratge oficial amb pista sonora de Mossos d\'Esquadra (00:00 a 13:46).' 
                : 'Entrena trams concrets per habituar-te a la velocitat de cada palier.'}
            </p>
          </div>

          {/* ============================================================== */}
          {/* BOTONS RECLAMATS: SALTAR EXPLICACIÓ (00:37) I INICI CURSA (00:44) */}
          {/* ============================================================== */}
          {elapsedSeconds < 44 && (
            <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-amber-500/15 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-300">
              <div className="text-left">
                <span className="text-xs font-black text-amber-300 block">
                  Vols estalviar-te els 37s d'explicació inicial?
                </span>
                <span className="text-[11px] text-slate-300">
                  Tria si vols començar al compte enrere o directament al Període 1:
                </span>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={skipExplanationToCountdown}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <FastForward className="w-4 h-4 fill-current" />
                  <span>Compte Enrere (0:37)</span>
                </button>
                <button
                  type="button"
                  onClick={skipToRaceStart}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Inici Període 1 (0:44)</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* PANELL ESPECÍFIC DEL MODE PRÀCTICA                            */}
          {/* ============================================================== */}
          {activeSubTab === 'practica' && (
            <div className="p-4 bg-slate-950/80 border border-amber-500/30 rounded-2xl space-y-4 text-left">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5" />
                  Configuració del Tram a Entrenar (Inici i Fi)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Course Navette 20m
                </span>
              </div>

              {/* Botons ràpids per Trams Clau de la prova */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-300 block">
                  Trams d'objectiu ràpids:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPracticeStartPeriod(1);
                      setPracticeEndPeriod(4);
                      const st = NAVETTE_OFFICIAL_STAGES.find(s => s.periodNum === 1 && s.isHalf);
                      if (st) seekToSecond(st.startSec);
                    }}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <span className="text-[11px] font-black text-sky-400 block group-hover:text-amber-400">P1 → P4 (Inici)</span>
                    <span className="text-[10px] text-slate-400">8,5 a 10,0 km/h</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPracticeStartPeriod(5);
                      setPracticeEndPeriod(8);
                      const st = NAVETTE_OFFICIAL_STAGES.find(s => s.periodNum === 5 && s.isHalf);
                      if (st) seekToSecond(st.startSec);
                    }}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <span className="text-[11px] font-black text-amber-400 block group-hover:text-amber-300">P5 → P8 (Aprovat)</span>
                    <span className="text-[10px] text-slate-400">10,5 a 12,0 km/h</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPracticeStartPeriod(8);
                      setPracticeEndPeriod(10);
                      const st = NAVETTE_OFFICIAL_STAGES.find(s => s.periodNum === 8 && s.isHalf);
                      if (st) seekToSecond(st.startSec);
                    }}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <span className="text-[11px] font-black text-emerald-400 block group-hover:text-emerald-300">P8 → P10 (Notable)</span>
                    <span className="text-[10px] text-slate-400">12,0 a 13,0 km/h</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPracticeStartPeriod(10);
                      setPracticeEndPeriod(13);
                      const st = NAVETTE_OFFICIAL_STAGES.find(s => s.periodNum === 10 && s.isHalf);
                      if (st) seekToSecond(st.startSec);
                    }}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <span className="text-[11px] font-black text-purple-400 block group-hover:text-purple-300">P10 → P13 (Sprint)</span>
                    <span className="text-[10px] text-slate-400">13,0 a 14,5 km/h</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                {/* Període d'inici */}
                <div>
                  <label className="text-slate-400 font-bold block mb-1">
                    Començar des del període:
                  </label>
                  <select
                    value={practiceStartPeriod}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      setPracticeStartPeriod(p);
                      const st = NAVETTE_OFFICIAL_STAGES.find(s => s.periodNum === p && s.isHalf);
                      if (st) seekToSecond(st.startSec);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500"
                  >
                    {uniquePeriods.map(p => {
                      const st = NAVETTE_OFFICIAL_STAGES.find(s => s.periodNum === p && s.isHalf);
                      return (
                        <option key={p} value={p}>
                          Període {p} ({st ? formatTime(st.startSec) : ''} • {st?.speedKmH || ''} km/h)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Període de finalització */}
                <div>
                  <label className="text-slate-400 font-bold block mb-1">
                    Aturar automàticament a:
                  </label>
                  <select
                    value={practiceEndPeriod}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPracticeEndPeriod(val === 'unlimited' ? 'unlimited' : Number(val));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="unlimited">Sense límit (continuar fins que m'aturi)</option>
                    {uniquePeriods
                      .filter(p => p >= practiceStartPeriod)
                      .map(p => (
                        <option key={p} value={p}>
                          En acabar el Període {p} (Palier {p}.0)
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Botons ràpids per saltar de període a període */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                  Salts ràpids a períodes oficials:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {uniquePeriods.map(p => {
                    const st = NAVETTE_OFFICIAL_STAGES.find(s => s.periodNum === p && s.isHalf);
                    const isCurrent = currentStage.periodNum === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setPracticeStartPeriod(p);
                          if (st) seekToSecond(st.startSec);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isCurrent 
                            ? 'bg-amber-500 text-slate-950 font-black shadow-sm' 
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        P{p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Marcador Principal de Palier i Velocitat */}
          <div className="p-6 bg-slate-950 border border-slate-800/90 rounded-3xl space-y-4 shadow-inner">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-left">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Temps Transcorregut
                </span>
                <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
                  {formatTime(elapsedSeconds)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {elapsedSeconds < 37 ? 'Fase d\'explicació' : elapsedSeconds < 44 ? 'Compte enrere 5s' : 'Cursa en marxa'}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Velocitat de Ritme
                </span>
                <span className="text-4xl sm:text-5xl font-black font-mono text-amber-400 tracking-tight">
                  {currentSpeed.toFixed(1)} <span className="text-base text-slate-500 font-normal">km/h</span>
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {currentSpeed > 0 ? `${(20 / (currentSpeed / 3.6)).toFixed(1)}s per recta (20m)` : '0 km/h'}
                </span>
              </div>
            </div>

            {/* Barra de Progrés del Període Actual */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-sky-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                  {currentStage.name}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {formatTime(currentStage.startSec)} → {formatTime(currentStage.endSec)}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                {(() => {
                  const stageSpan = Math.max(1, currentStage.endSec - currentStage.startSec);
                  const stageProgress = Math.min(100, Math.max(0, ((elapsedSeconds - currentStage.startSec) / stageSpan) * 100));
                  return (
                    <div 
                      className="h-full bg-gradient-to-r from-sky-500 to-amber-400 rounded-full transition-all duration-300"
                      style={{ width: `${stageProgress}%` }}
                    />
                  );
                })()}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="text-left">
                <span className="text-xs text-slate-400 block font-semibold">Palier oficial assolit</span>
                <span className="text-3xl sm:text-4xl font-black text-sky-400 font-mono">
                  {currentPalier > 0 ? `Palier ${currentPalier.toFixed(1)}` : 'Sortida'}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block font-semibold">Nota actual estimada</span>
                <span className="text-2xl font-black text-white">
                  {calculateCourseNavettePoints(currentPalier).points.toFixed(1)}{' '}
                  <span className="text-xs text-slate-500">/ 10</span>
                </span>
              </div>
            </div>
          </div>

          {/* Botons de Control Principal */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {!isPlaying ? (
              <button
                type="button"
                onClick={() => {
                  if (activeSubTab === 'practica' && elapsedSeconds === 0) {
                    startPeriodPractice(practiceStartPeriod);
                  } else {
                    startTest();
                  }
                }}
                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-sky-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>
                  {elapsedSeconds > 0 
                    ? 'REPRENDRE' 
                    : activeSubTab === 'practica' 
                      ? `INICIAR PRÀCTICA (PERÍODE ${practiceStartPeriod})` 
                      : 'INICIAR CURSA LLANÇADORA'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={pauseTest}
                className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-sm rounded-xl transition-colors cursor-pointer"
              >
                Pausar àudio
              </button>
            )}

            {elapsedSeconds > 0 && (
              <button
                type="button"
                onClick={handleOpenFinishModal}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-black text-sm rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>FINALITZAR SIMULACRE</span>
              </button>
            )}

            {elapsedSeconds > 0 && !isPlaying && (
              <button
                type="button"
                onClick={() => {
                  AudioEngine.playClick();
                  seekToSecond(0);
                }}
                className="w-full sm:w-auto px-4 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer border border-slate-800"
                title="Reiniciar des del principi"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar</span>
              </button>
            )}
          </div>

          {/* Selector d'àudio personalitzat o de suport */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <FileAudio className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">
                  {customAudioFileName ? customAudioFileName : 'Pista Oficial Course Navette en Català (Integrada)'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {customAudioFileName ? 'Pista d\'àudio carregada pel dispositiu' : 'Sincronitzada de 00:00:00 a 00:13:46 amb xiulets i ordres de període'}
                </span>
              </div>
            </div>

            <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{customAudioFileName ? 'Canviar pista MP3' : 'Carregar la meva pista MP3'}</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Historial de Cursa Llançadora */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-400" />
            <h4 className="font-black text-white text-base">
              Historial de Simulacres i Pràctiques (CL)
            </h4>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            {recordsList.length} {recordsList.length === 1 ? 'registre' : 'registres'}
          </span>
        </div>

        {recordsList.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
            Encara no has desat cap simulacre de Course Navette. Fes la teva primera prova a dalt!
          </div>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 pretty-scrollbar">
            {recordsList.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800/80 rounded-2xl text-xs transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-black text-sky-400 font-mono">{rec.rawScore}</span>
                    <span className="text-[9px] text-slate-400 uppercase font-bold">palier</span>
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
                      <span>������ {rec.time}</span>
                      {rec.notes && <span className="italic text-slate-500 truncate max-w-[150px] sm:max-w-xs">“{rec.notes}”</span>}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteRecord(rec.id)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar registre"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Finalització i Registre de Palier */}
      {isFinishingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-center">
            <div className="w-16 h-16 bg-sky-500/10 text-sky-400 rounded-2xl flex items-center justify-center mx-auto border border-sky-500/20">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">
                Quin palier has assolit?
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Indica el darrer període completat o mig període abans d'aturar-te.
              </p>
            </div>

            {/* Selector de Palier */}
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setSelectedPalier(prev => Math.max(1, Math.round((prev - 0.5) * 10) / 10))}
                className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xl font-black border border-slate-700 cursor-pointer"
              >
                -0.5
              </button>

              <div className="w-36 py-3 bg-slate-950 border-2 border-sky-500/50 rounded-2xl text-center">
                <span className="text-4xl font-black font-mono text-sky-400">
                  {selectedPalier.toFixed(1)}
                </span>
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  període / palier
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPalier(prev => Math.min(20, Math.round((prev + 0.5) * 10) / 10))}
                className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xl font-black border border-slate-700 cursor-pointer"
              >
                +0.5
              </button>
            </div>

            {/* Relació de Nota Oficial (CL) */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="text-left">
                <span className="text-xs text-slate-400 block font-semibold">Puntuació Oficial (CL)</span>
                <span className="text-2xl font-black text-white">
                  {calculateCourseNavettePoints(selectedPalier).points.toFixed(1)}{' '}
                  <span className="text-xs text-slate-400 font-normal">/ 10 punts</span>
                </span>
              </div>
              <div className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase ${
                calculateCourseNavettePoints(selectedPalier).points >= 5 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {calculateCourseNavettePoints(selectedPalier).points >= 5 ? 'Apte' : 'No apte'}
              </div>
            </div>

            {/* Data i Hora */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div>
                <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Data
                </label>
                <input
                  type="date"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-sky-500"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="text-left">
              <input
                type="text"
                placeholder="Observacions, tipus de calçat, pista..."
                value={recordNotes}
                onChange={(e) => setRecordNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFinishingModalOpen(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tornar a la prova
              </button>

              <button
                type="button"
                onClick={handleSaveRecord}
                className="flex-2 py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{saveSuccess ? 'DESAT!' : 'DESAR AL MEU HISTORIAL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
