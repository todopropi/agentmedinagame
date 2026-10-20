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
  Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CursaLlancadoraViewProps {
  user: UserProfile;
  onRecordSaved?: () => void;
}

// Taula oficial de velocitat i durada per palier a Course Navette (20m)
const PALIER_DATA: { palier: number; speedKmH: number; timeSeconds: number }[] = [
  { palier: 1, speedKmH: 8.5, timeSeconds: 60 },
  { palier: 2, speedKmH: 9.0, timeSeconds: 120 },
  { palier: 3, speedKmH: 9.5, timeSeconds: 180 },
  { palier: 4, speedKmH: 10.0, timeSeconds: 240 },
  { palier: 5, speedKmH: 10.5, timeSeconds: 300 },
  { palier: 6, speedKmH: 11.0, timeSeconds: 360 },
  { palier: 7, speedKmH: 11.5, timeSeconds: 420 },
  { palier: 8, speedKmH: 12.0, timeSeconds: 480 },
  { palier: 9, speedKmH: 12.5, timeSeconds: 540 },
  { palier: 10, speedKmH: 13.0, timeSeconds: 600 },
  { palier: 11, speedKmH: 13.5, timeSeconds: 660 },
  { palier: 12, speedKmH: 14.0, timeSeconds: 720 },
  { palier: 13, speedKmH: 14.5, timeSeconds: 780 },
  { palier: 14, speedKmH: 15.0, timeSeconds: 840 },
  { palier: 15, speedKmH: 15.5, timeSeconds: 900 }
];

export const CursaLlancadoraView: React.FC<CursaLlancadoraViewProps> = ({ user, onRecordSaved }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [currentPalierDisplay, setCurrentPalierDisplay] = useState<number>(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(8.5);
  const [isFinishingModalOpen, setIsFinishingModalOpen] = useState<boolean>(false);

  // Dades de finalització
  const [selectedPalier, setSelectedPalier] = useState<number>(8.5);
  const [recordDate, setRecordDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recordTime, setRecordTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [recordNotes, setRecordNotes] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Gestió d'àudio personalitzat o per defecte
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioFileName, setCustomAudioFileName] = useState<string | null>(null);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);

  // Historial de simulacres de CL
  const [recordsList, setRecordsList] = useState<PhysicalScoreRecord[]>([]);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const wakeLockRef = useRef<any>(null);

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
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Cursa Llançadora (Course Navette) - Guia Oficial',
        artist: 'Agent Medina • CME',
        album: 'Proves Físiques Oficials Mossos d\'Esquadra'
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

  // Control del temps i càlcul del palier en marxa
  useEffect(() => {
    if (isPlaying) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => {
          const next = prev + 1;
          
          // Càlcul del palier aproximat segons el temps
          // 0-30s: Introducció i preparació
          // 30s-105s: Palier 1
          // etc.
          let palier = 0;
          let speed = 8.5;
          if (next >= 30) {
            const runSeconds = next - 30;
            // Cada període dura aproximadament 60s
            const rawPeriod = 1 + (runSeconds / 60);
            palier = Math.floor(rawPeriod * 2) / 2; // arrodonit a mig palier (ex: 1, 1.5, 2...)
            speed = Math.min(18.0, 8.5 + Math.floor(rawPeriod - 1) * 0.5);
          }
          setCurrentPalierDisplay(Math.max(0, palier));
          setCurrentSpeed(speed);

          return next;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isPlaying]);

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

  const startTest = async () => {
    setIsPlaying(true);
    await requestWakeLock();
    setupMediaSession();

    if (audioElementRef.current) {
      try {
        await audioElementRef.current.play();
      } catch (err) {
        console.warn('Audio play error, using WebAudio fallback:', err);
      }
    }
    AudioEngine.playPrepBeep(true);
  };

  const pauseTest = () => {
    setIsPlaying(false);
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
  };

  const handleOpenFinishModal = () => {
    pauseTest();
    releaseWakeLock();
    setSelectedPalier(currentPalierDisplay > 0 ? currentPalierDisplay : 8.5);
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
      notes: recordNotes
    }, user.email);

    setSaveSuccess(true);
    loadHistory();
    if (onRecordSaved) onRecordSaved();
    confetti({ particleCount: 60, spread: 60 });
    setTimeout(() => {
      setSaveSuccess(false);
      setIsFinishingModalOpen(false);
      setElapsedSeconds(0);
      setCurrentPalierDisplay(0);
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

  return (
    <div className="space-y-6">
      {/* Targeta Principal de la Cursa Llançadora */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center relative overflow-hidden">
        {/* Àudio Tag invisible connectat per MediaSession i Background */}
        <audio
          ref={audioElementRef}
          src={customAudioUrl || '/audio/beep.mp3'}
          playsInline
          loop={!customAudioUrl}
          preload="auto"
        />

        <div className="max-w-xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-full border border-sky-500/20">
              <Activity className="w-3.5 h-3.5" />
              <span>Cursa de 20 metres d'anada i tornada</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
              <Smartphone className={`w-3.5 h-3.5 ${wakeLockActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{wakeLockActive ? 'Pantalla activa' : 'Mode mòbil preparat'}</span>
            </div>
          </div>

          <div className="w-24 h-24 mx-auto bg-slate-800/80 rounded-3xl p-3 border border-slate-700/60 shadow-lg flex items-center justify-center">
            <CourseNavetteIllustration className="w-20 h-20" />
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Cursa Llançadora (Course Navette)
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
              Simulacre oficial amb àudio. Si es bloqueja la pantalla o surts de l'app, <strong>l'àudio continuarà sonant</strong> sense interrupció.
            </p>
          </div>

          {/* Selector d'àudio (Per defecte o personalitzat) */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <FileAudio className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">
                  {customAudioFileName ? customAudioFileName : 'Àudio Oficial en Català (Integrat)'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {customAudioFileName ? 'Arxiu d\'àudio seleccionat' : 'Veu en català i xiulets oficials de sortida i períodes'}
                </span>
              </div>
            </div>

            <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{customAudioFileName ? 'Canviar MP3' : 'Carregar el meu MP3'}</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Marcador Principal de Palier i Velocitat */}
          <div className="p-6 bg-slate-950 border border-slate-800/90 rounded-3xl space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-left">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Temps Transcorregut
                </span>
                <span className="text-4xl sm:text-5xl font-black font-mono text-white">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Velocitat Actual
                </span>
                <span className="text-4xl sm:text-5xl font-black font-mono text-amber-400">
                  {currentSpeed.toFixed(1)} <span className="text-base text-slate-500 font-normal">km/h</span>
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-semibold">Període / Palier en marxa</span>
                <span className="text-3xl sm:text-4xl font-black text-sky-400 font-mono">
                  {currentPalierDisplay > 0 ? `Palier ${currentPalierDisplay}` : 'Sortida (30s)'}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block font-semibold">Nota actual estimada</span>
                <span className="text-2xl font-black text-white">
                  {calculateCourseNavettePoints(currentPalierDisplay).points.toFixed(1)}{' '}
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
                onClick={startTest}
                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-sky-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{elapsedSeconds > 0 ? 'REPRENDRE SIMULACRE' : 'INICIAR CURSA LLANÇADORA'}</span>
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
          </div>
        </div>
      </div>

      {/* Historial de Cursa Llançadora */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-400" />
            <h4 className="font-black text-white text-base">
              Historial de Simulacres (Cursa Llançadora)
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
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {recordsList.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800/80 rounded-2xl text-xs transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex flex-col items-center justify-center">
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
                      <span>🕒 {rec.time}</span>
                      {rec.notes && <span className="italic text-slate-500">“{rec.notes}”</span>}
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
