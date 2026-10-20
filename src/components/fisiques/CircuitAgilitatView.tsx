import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../../types';
import { CircuitIllustration } from './ExerciseIllustrations';
import { AudioEngine } from '../../utils/audio';
import { calculateCircuitPoints } from '../../utils/physicalScoring';
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
  RotateCcw, 
  Check, 
  Clock, 
  Calendar, 
  Award, 
  Trash2, 
  TrendingUp,
  Zap,
  Info,
  Edit3
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CircuitAgilitatViewProps {
  user: UserProfile;
  onRecordSaved?: () => void;
}

export const CircuitAgilitatView: React.FC<CircuitAgilitatViewProps> = ({ user, onRecordSaved }) => {
  const [stopwatchState, setStopwatchState] = useState<'idle' | 'countdown' | 'running' | 'stopped'>('idle');
  const [countdownValue, setCountdownValue] = useState<number>(3);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  
  // Dades manuals o editables
  const [manualSeconds, setManualSeconds] = useState<string>('18.4');
  const [recordDate, setRecordDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recordTime, setRecordTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [recordNotes, setRecordNotes] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Historial de simulacres de CA
  const [recordsList, setRecordsList] = useState<PhysicalScoreRecord[]>([]);

  const stopwatchIntervalRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  const loadHistory = () => {
    const list = getPhysicalRecords(user.uid || user.email, user.email).filter(r => r.testType === 'CA');
    setRecordsList(list);

    fetchPhysicalDataFromCloud(user.uid, user.email).then(data => {
      if (data && Array.isArray(data.records)) {
        const cloudList = data.records.filter(r => r.testType === 'CA');
        setRecordsList(cloudList);
      }
    }).catch(console.warn);
  };

  useEffect(() => {
    loadHistory();
  }, [user.email, user.uid]);

  useEffect(() => {
    return () => {
      clearInterval(stopwatchIntervalRef.current);
      clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const startCountdown = () => {
    setStopwatchState('countdown');
    setCountdownValue(3);
    setElapsedMs(0);
    setSaveSuccess(false);

    AudioEngine.playPrepBeep(false);

    countdownIntervalRef.current = setInterval(() => {
      setCountdownValue(prev => {
        const next = prev - 1;
        if (next > 0) {
          AudioEngine.playPrepBeep(false);
        } else if (next === 0) {
          clearInterval(countdownIntervalRef.current);
          AudioEngine.playWhistle();
          startStopwatch();
          return 0;
        }
        return next;
      });
    }, 1000);
  };

  const startStopwatch = () => {
    setStopwatchState('running');
    startTimeRef.current = Date.now();

    stopwatchIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const diff = now - startTimeRef.current;
      setElapsedMs(diff);
    }, 10);
  };

  const stopStopwatch = () => {
    clearInterval(stopwatchIntervalRef.current);
    setStopwatchState('stopped');
    const finalSec = (elapsedMs / 1000).toFixed(2);
    setManualSeconds(finalSec);
    AudioEngine.playWhistle();
  };

  const resetStopwatch = () => {
    clearInterval(stopwatchIntervalRef.current);
    clearInterval(countdownIntervalRef.current);
    setStopwatchState('idle');
    setElapsedMs(0);
    setCountdownValue(3);
  };

  const handleSaveRecord = () => {
    const parsedSec = parseFloat(manualSeconds);
    if (isNaN(parsedSec) || parsedSec <= 0) {
      alert('Introdueix un temps vàlid en segons.');
      return;
    }

    const scoreData = calculateCircuitPoints(parsedSec);
    savePhysicalRecord(user.uid || user.email, {
      userId: user.uid,
      userEmail: user.email || 'aspirant@agentmedina.cat',
      testType: 'CA',
      rawScore: parsedSec,
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
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleDeleteRecord = (id: string) => {
    AudioEngine.playClick();
    deletePhysicalRecord(user.uid || user.email, id, user.email);
    setRecordsList(prev => prev.filter(r => r.id !== id));
    if (onRecordSaved) onRecordSaved();
  };

  const currentSeconds = stopwatchState === 'stopped' || stopwatchState === 'idle'
    ? (parseFloat(manualSeconds) || 18.4)
    : Math.round((elapsedMs / 1000) * 10) / 10;

  const currentCalculated = calculateCircuitPoints(currentSeconds);

  return (
    <div className="space-y-6">
      {/* Targeta Principal del Circuït d'Agilitat */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center relative overflow-hidden">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
              <Zap className="w-3.5 h-3.5" />
              <span>Circuït Reglamentari CME</span>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Alçada tanques: 0,70m
            </div>
          </div>

          <div className="w-24 h-24 mx-auto bg-slate-800/80 rounded-3xl p-3 border border-slate-700/60 shadow-lg flex items-center justify-center">
            <CircuitIllustration className="w-20 h-20" />
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Circuït d'Agilitat
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
              Simulacre oficial amb cronòmetre integrat o registre manual del temps realitzat.
            </p>
          </div>

          {/* Secció Cronòmetre */}
          <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-4">
            {stopwatchState === 'countdown' ? (
              <div className="py-6 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 animate-pulse">
                  PREPARATS...
                </span>
                <div className="text-7xl font-black font-mono text-amber-400">
                  {countdownValue}
                </div>
              </div>
            ) : (
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Temps del Circuït
                </span>
                <div className="text-6xl sm:text-7xl font-black font-mono text-white tracking-tight my-2">
                  {(elapsedMs / 1000).toFixed(2)}<span className="text-2xl text-slate-500 font-normal">s</span>
                </div>
              </div>
            )}

            {/* Controls del cronòmetre */}
            <div className="flex items-center justify-center gap-3 pt-2">
              {stopwatchState === 'idle' && (
                <button
                  type="button"
                  onClick={startCountdown}
                  className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>INICIAR CRONÒMETRE</span>
                </button>
              )}

              {stopwatchState === 'running' && (
                <button
                  type="button"
                  onClick={stopStopwatch}
                  className="px-8 py-3.5 bg-red-500 hover:bg-red-400 text-white font-black text-sm rounded-xl shadow-lg shadow-red-500/25 transition-all flex items-center gap-2 cursor-pointer animate-pulse"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>ATURAR (STOP)</span>
                </button>
              )}

              {(stopwatchState === 'stopped' || elapsedMs > 0) && (
                <button
                  type="button"
                  onClick={resetStopwatch}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar</span>
                </button>
              )}
            </div>
          </div>

          {/* Registre i Ajust Manual del Temps */}
          <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Temps manual o ajust de cronòmetre</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Pots escriure el temps directament
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Temps realitzat (segons)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="35"
                    value={manualSeconds}
                    onChange={(e) => setManualSeconds(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                    placeholder="Ex: 18.4"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">segons</span>
                </div>
              </div>

              {/* Puntuació Calculada */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">Puntuació (CA)</span>
                  <span className="text-xl font-black text-amber-400">
                    {currentCalculated.points.toFixed(1)} <span className="text-xs text-slate-400">/ 10</span>
                  </span>
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                  currentCalculated.points >= 5 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {currentCalculated.points >= 5 ? 'Apte' : 'No apte'}
                </div>
              </div>
            </div>

            {/* Data i Hora */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Data
                </label>
                <input
                  type="date"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-amber-500"
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
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Notes opcionals */}
            <div>
              <input
                type="text"
                placeholder="Observacions, terreny, adherència de sabatilles..."
                value={recordNotes}
                onChange={(e) => setRecordNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveRecord}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{saveSuccess ? 'DESAT AMB ÈXIT!' : 'DESAR AL MEU HISTORIAL'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Historial de Circuït d'Agilitat */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h4 className="font-black text-white text-base">
              Historial de Simulacres (Circuït d'Agilitat)
            </h4>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            {recordsList.length} {recordsList.length === 1 ? 'registre' : 'registres'}
          </span>
        </div>

        {recordsList.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
            Encara no has desat cap simulacre de Circuït d'Agilitat. Cronometra el teu primer intent a dalt!
          </div>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {recordsList.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800/80 rounded-2xl text-xs transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center">
                    <span className="text-xs font-black text-amber-400 font-mono">{rec.rawScore}s</span>
                    <span className="text-[9px] text-slate-400 uppercase font-bold">temps</span>
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
    </div>
  );
};
