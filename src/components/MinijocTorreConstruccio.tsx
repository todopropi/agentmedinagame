import React, { useState, useEffect, useRef } from 'react';
import { Question, QuestionAmbit } from '../types';
import { getQuestionsByAmbit } from '../data/questionsBank';
import { AudioEngine } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Building2, 
  Timer, 
  Sparkles, 
  AlertTriangle, 
  X, 
  ArrowRight, 
  RotateCcw,
  Zap,
  Activity,
  Flame,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trophy,
  BookOpen,
  ChevronRight,
  Info,
  Award
} from 'lucide-react';

interface MinijocTorreConstruccioProps {
  ambit: QuestionAmbit;
  onComplete: (advanceTiles: number, msg?: string) => void;
  onClose: () => void;
}

interface FailedQuestionRecord {
  question: Question;
  selectedOption: number | null;
  timeExpired: boolean;
}

type GamePhase = 'INTRO' | 'QUESTION' | 'FEEDBACK' | 'VICTORY' | 'GAME_OVER';

const MAX_FLOORS = 10;
const METERS_PER_FLOOR = 3.5;
const QUESTION_TIME_LIMIT = 15; // 15 segons per pregunta

// 10 Colorful Architectural Police Building Blocks
const TOWER_BLOCKS_METADATA = [
  {
    floor: 1,
    name: "Sòcol Tàctic Blindat",
    theme: "from-blue-900 via-slate-900 to-slate-950",
    border: "border-blue-500/70",
    accent: "bg-blue-500",
    text: "text-blue-300",
    tag: "Nivell 1 · Ciments"
  },
  {
    floor: 2,
    name: "Control d'Accés & Recepció",
    theme: "from-cyan-900 via-sky-950 to-slate-950",
    border: "border-cyan-500/70",
    accent: "bg-cyan-500",
    text: "text-cyan-300",
    tag: "Nivell 2"
  },
  {
    floor: 3,
    name: "Bigues d'Alta Resistència",
    theme: "from-amber-900 via-yellow-950 to-slate-950",
    border: "border-amber-500/70",
    accent: "bg-amber-500",
    text: "text-amber-300",
    tag: "Nivell 3"
  },
  {
    floor: 4,
    name: "Nucli de Telecomunicacions",
    theme: "from-purple-900 via-indigo-950 to-slate-950",
    border: "border-purple-500/70",
    accent: "bg-purple-500",
    text: "text-purple-300",
    tag: "Nivell 4"
  },
  {
    floor: 5,
    name: "Unitat d'Anàlisi d'Informació",
    theme: "from-emerald-900 via-teal-950 to-slate-950",
    border: "border-emerald-500/70",
    accent: "bg-emerald-500",
    text: "text-emerald-300",
    tag: "Nivell 5"
  },
  {
    floor: 6,
    name: "Sala de Crisi & Coordinació",
    theme: "from-rose-900 via-red-950 to-slate-950",
    border: "border-rose-500/70",
    accent: "bg-rose-500",
    text: "text-rose-300",
    tag: "Nivell 6"
  },
  {
    floor: 7,
    name: "Blindatge Antiterrorista Reforçat",
    theme: "from-slate-800 via-zinc-900 to-black",
    border: "border-zinc-400/70",
    accent: "bg-zinc-400",
    text: "text-zinc-200",
    tag: "Nivell 7"
  },
  {
    floor: 8,
    name: "Centre d'Operacions Especials",
    theme: "from-sky-700 via-blue-900 to-slate-950",
    border: "border-sky-400/80",
    accent: "bg-sky-400",
    text: "text-sky-300",
    tag: "Nivell 8"
  },
  {
    floor: 9,
    name: "Mirador de Vigilància 360°",
    theme: "from-amber-700 via-yellow-900 to-slate-950",
    border: "border-amber-400/80",
    accent: "bg-amber-400",
    text: "text-amber-200",
    tag: "Nivell 9"
  },
  {
    floor: 10,
    name: "Heliport de Comandament Suprem",
    theme: "from-amber-500 via-yellow-600 to-amber-700",
    border: "border-amber-300",
    accent: "bg-yellow-400",
    text: "text-slate-950 font-black",
    tag: "CIM SUPREM 👑"
  }
];

export const MinijocTorreConstruccio: React.FC<MinijocTorreConstruccioProps> = ({
  ambit,
  onComplete,
  onClose
}) => {
  // Pool de preguntes de l'àmbit
  const [questionPool, setQuestionPool] = useState<Question[]>(() => {
    const list = getQuestionsByAmbit(ambit);
    return [...list].sort(() => 0.5 - Math.random());
  });

  // Fases del joc: INTRO -> QUESTION -> FEEDBACK (Torre + Explicació) -> Següent...
  const [phase, setPhase] = useState<GamePhase>('INTRO');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [floorsCount, setFloorsCount] = useState(0);
  const [stability, setStability] = useState(100);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [lastOutcome, setLastOutcome] = useState<{ isCorrect: boolean; text: string; timeExpired: boolean } | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [failedQuestions, setFailedQuestions] = useState<FailedQuestionRecord[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const towerScrollRef = useRef<HTMLDivElement | null>(null);
  const topContainerRef = useRef<HTMLDivElement | null>(null);

  const currentQuestion = questionPool[currentQIndex % questionPool.length];

  // Auto-scroll suau en canviar de fase
  useEffect(() => {
    if (topContainerRef.current) {
      topContainerRef.current.scrollTop = 0;
    }
  }, [phase, currentQIndex]);

  // Gestió del temporitzador de 15 segons NOMÉS durant la fase 'QUESTION'
  useEffect(() => {
    if (phase !== 'QUESTION') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        if (prev === 4) {
          AudioEngine.playWarningAlarm();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, currentQIndex]);

  // Gestió quan s'esgota el temps
  const handleTimeout = () => {
    if (phase !== 'QUESTION') return;
    processAnswerOutcome(false, null, true);
  };

  // L'usuari tria una opció
  const handleSelectOption = (idx: number) => {
    if (phase !== 'QUESTION') return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(idx);
    const isCorrect = idx === currentQuestion.resposta;
    processAnswerOutcome(isCorrect, idx, false);
  };

  // Processar el resultat i saltar immediatament a la visualització de la torre + explicació
  const processAnswerOutcome = (isCorrect: boolean, chosenIdx: number | null, timeExpired: boolean) => {
    if (isCorrect) {
      AudioEngine.playBlockDrop();
      setIsDropping(true);
      setTimeout(() => setIsDropping(false), 600);

      const newFloors = floorsCount + 1;
      setFloorsCount(newFloors);

      // Punts: 150 base + bonus pel temps restant
      const bonus = Math.round(timeLeft * 10);
      const addedScore = 150 + bonus;
      setScore(prev => prev + addedScore);

      // Estabilitat recupera lleugerament (+5%)
      setStability(prev => Math.min(100, prev + 5));

      setLastOutcome({
        isCorrect: true,
        text: `✓ Bloc col·locat correctament! Pis ${newFloors}/10 construït (+${addedScore} punts, +${METERS_PER_FLOOR}m).`,
        timeExpired: false
      });
    } else {
      AudioEngine.playCrashShake();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 700);

      // Registra la pregunta fallada
      setFailedQuestions(prev => [
        ...prev,
        {
          question: currentQuestion,
          selectedOption: chosenIdx,
          timeExpired
        }
      ]);

      // Baixa estabilitat (-25%)
      const newStability = Math.max(0, stability - 25);
      setStability(newStability);

      // Perd un pis si ja en tenia
      const newFloors = Math.max(0, floorsCount - 1);
      setFloorsCount(newFloors);

      const penaltyMsg = timeExpired
        ? `⏰ S'ha esgotat el temps de resposta! La torre trontolla i perd un pis.`
        : `❌ Resposta incorrecta! La torre s'esquerda i perd un pis.`;

      setLastOutcome({
        isCorrect: false,
        text: `${penaltyMsg} Estabilitat restant: ${newStability}%.`,
        timeExpired
      });
    }

    // Canvia a la fase FEEDBACK per mostrar la Torre gran i l'Explicació detallada
    setPhase('FEEDBACK');
  };

  // Continuar des de la pantalla de FEEDBACK cap a la següent pregunta, victòria o derrota
  const handleProceedFromFeedback = () => {
    // Si hem assolit 10 pisos -> Victòria!
    if (floorsCount >= MAX_FLOORS) {
      AudioEngine.playTowerVictory();
      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.6 }
      });
      setPhase('VICTORY');
      return;
    }

    // Si l'estabilitat ha arribat a 0 -> Derrota!
    if (stability <= 0) {
      setPhase('GAME_OVER');
      return;
    }

    // Si la partida continua: següent pregunta
    setSelectedOption(null);
    setLastOutcome(null);
    setTimeLeft(QUESTION_TIME_LIMIT);
    setCurrentQIndex(prev => prev + 1);
    setPhase('QUESTION');
  };

  // Finalització amb victòria: Avança 3 caselles al tauler
  const handleClaimVictory = () => {
    onComplete(3, `🏗️ Torre de Construcció completada (10 pisos / 35,0m)! Has superat el repte i saltes +3 caselles!`);
  };

  // Finalització amb derrota: Penalització de 1 casella
  const handleAcknowledgeDefeat = () => {
    onComplete(-1, `💥 La torre ha col·lapsat per manca d'estabilitat (${floorsCount} pisos assolits). Penalització: Retrocedeixes 1 casella.`);
  };

  // Reiniciar el repte complet
  const handleRestart = () => {
    setQuestionPool(prev => [...prev].sort(() => 0.5 - Math.random()));
    setCurrentQIndex(0);
    setFloorsCount(0);
    setStability(100);
    setScore(0);
    setTimeLeft(QUESTION_TIME_LIMIT);
    setSelectedOption(null);
    setLastOutcome(null);
    setFailedQuestions([]);
    setShowReviewModal(false);
    setPhase('INTRO');
  };

  const heightInMeters = (floorsCount * METERS_PER_FLOOR).toFixed(1);

  // Renderitzador visual de la Torre (utilitzat en la fase FEEDBACK i opcionalment a INTRO/VICTORY)
  const renderTowerVisual = (heightClass = "min-h-[280px] max-h-[380px]") => {
    return (
      <div 
        ref={towerScrollRef}
        className={`w-full ${heightClass} bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col-reverse items-center justify-start overflow-y-auto relative shadow-inner ${
          isShaking ? 'animate-tower-shake' : stability <= 25 ? 'animate-tower-critical' : ''
        }`}
      >
        {/* Ciments / Foundation al peu de la torre */}
        <div className="w-full max-w-[280px] bg-gradient-to-r from-slate-900 via-zinc-800 to-slate-900 border-2 border-slate-700 rounded-xl p-2.5 shadow-2xl relative shrink-0 z-0">
          <div className="h-2 w-full rounded bg-[repeating-linear-gradient(45deg,#eab308,#eab308_10px,#020617_10px,#020617_20px)] mb-1 opacity-90 shadow-sm" />
          <div className="flex items-center justify-between text-[10px] font-black text-slate-300">
            <span className="flex items-center gap-1">
              <span>🚧</span>
              <span>CIMENTS BLINDATS</span>
            </span>
            <span className="font-mono text-amber-400">0.0 m</span>
          </div>
        </div>

        {/* Pisos construïts (1 a floorsCount) apilats cap amunt */}
        {Array.from({ length: floorsCount }).map((_, idx) => {
          const floorNum = idx + 1;
          const metadata = TOWER_BLOCKS_METADATA[idx] || TOWER_BLOCKS_METADATA[0];
          const isTopBlock = floorNum === floorsCount;

          return (
            <div
              key={floorNum}
              className={`w-full max-w-[270px] my-0.5 rounded-xl border p-2.5 shadow-lg bg-gradient-to-r ${metadata.theme} ${metadata.border} relative transition-all ${
                isTopBlock && isDropping ? 'animate-block-drop' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-black/50 text-amber-300 font-mono border border-white/10">
                    PIS {floorNum}
                  </span>
                  <span className={`text-[10px] font-extrabold truncate max-w-[140px] ${metadata.text}`}>
                    {metadata.name}
                  </span>
                </div>
                <span className="text-[9px] font-mono font-bold text-slate-300 tabular-nums">
                  {(floorNum * METERS_PER_FLOOR).toFixed(1)}m
                </span>
              </div>

              {/* Finestres arquitectòniques amb llum policial */}
              <div className="grid grid-cols-6 gap-1 mt-1 opacity-80">
                {Array.from({ length: 6 }).map((_, wIdx) => (
                  <div 
                    key={wIdx} 
                    className="h-2 rounded bg-sky-400/30 border border-sky-400/40 shadow-[0_0_4px_rgba(56,189,248,0.3)]"
                  />
                ))}
              </div>

              {/* Corona d'Heliport per al pis 10 */}
              {floorNum === 10 && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full shadow-md border border-white/60 flex items-center gap-1">
                  <span>👑</span>
                  <span>HELIPORT ASSOLIT</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Grua activa per al següent bloc */}
        {floorsCount < MAX_FLOORS && (
          <div className="my-1.5 text-center flex flex-col items-center animate-pulse shrink-0">
            <div className="w-1 h-3.5 bg-amber-400/80" />
            <div className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[9px] font-black text-amber-300 flex items-center gap-1 shadow-sm">
              <span>🏗️</span>
              <span>GRUA ACTIVA · PIS {floorsCount + 1}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        ref={topContainerRef}
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] relative"
        id="minijoc-torre-construccio"
      >
        {/* Glow ambient de fons */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Top Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                  <span>Torre de Construcció</span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Minijoc
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {ambit} · Alça 10 pisos ({MAX_FLOORS * METERS_PER_FLOOR}m)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {failedQuestions.length > 0 && (
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Veure les explicacions de les preguntes fallades"
              >
                <BookOpen className="w-3.5 h-3.5 text-rose-400" />
                <span>Errors ({failedQuestions.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Tancar minijoc"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Compact HUD (Pisos, Alçada, Estabilitat, Punts) present en QUESTION i FEEDBACK */}
        {(phase === 'QUESTION' || phase === 'FEEDBACK') && (
          <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 grid grid-cols-4 gap-2 text-center text-xs shrink-0 z-10">
            {/* Pisos */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 shadow-sm">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Pisos</span>
              <span className="text-sm font-black text-sky-400 tabular-nums">
                {floorsCount}/{MAX_FLOORS}
              </span>
            </div>

            {/* Alçada */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 shadow-sm">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Alçada</span>
              <span className="text-sm font-black text-amber-400 tabular-nums">
                {heightInMeters}m
              </span>
            </div>

            {/* Estabilitat */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 shadow-sm">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Estabilitat</span>
              <span className={`text-sm font-black tabular-nums ${
                stability <= 25 ? 'text-rose-400 animate-pulse' : stability <= 50 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {stability}%
              </span>
            </div>

            {/* Punts */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 shadow-sm">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Punts</span>
              <span className="text-sm font-black text-emerald-400 tabular-nums">
                {score}
              </span>
            </div>
          </div>
        )}

        {/* BODY CONTENT BY GAME PHASE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col justify-between">

          {/* ========================================================= */}
          {/* PANTALLA 1: EXPLICACIÓ INICIAL (INTRO / BRIEFING)         */}
          {/* ========================================================= */}
          {phase === 'INTRO' && (
            <div className="my-auto flex flex-col items-center text-center animate-in fade-in duration-300 max-w-lg mx-auto py-2">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-400/80 flex items-center justify-center text-3xl shadow-lg mb-4">
                🏗️
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white mb-1.5">
                Alça la Torre Policial!
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mb-5">
                Has d'alçar <b>10 pisos d'estructures</b> ({MAX_FLOORS * METERS_PER_FLOOR} metres) encertant preguntes d'oposició de <b>{ambit}</b>.
              </p>

              {/* Targeta d'Instruccions clares */}
              <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left space-y-3 mb-6 shadow-inner text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0">⏱️</span>
                  <div>
                    <b className="text-slate-100">15 segons per pregunta:</b> Respon abans que s'esgoti el compte enrere.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0">🧱</span>
                  <div>
                    <b className="text-emerald-400">Si encertes:</b> Cau un nou pis acoblat a l'estructura, puges alçada i sumes punts.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0">⚠️</span>
                  <div>
                    <b className="text-rose-400">Si falles o s'esgota el temps:</b> La torre tremola, perd 1 pis i la seva estabilitat baixa un -25%.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0">📖</span>
                  <div>
                    <b className="text-amber-400">Seguiment torn a torn:</b> A cada pas veuràs com creix la torre juntament amb la <b>justificació oficial del temari</b>.
                  </div>
                </div>
              </div>

              {/* Botó destacat per començar */}
              <button
                type="button"
                onClick={() => {
                  setTimeLeft(QUESTION_TIME_LIMIT);
                  setPhase('QUESTION');
                }}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-base shadow-xl shadow-amber-500/25 transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🏗️ Començar a Alçar la Torre</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* PANTALLA 2: FASE DE PREGUNTA (QUESTION)                   */}
          {/* ========================================================= */}
          {phase === 'QUESTION' && (
            <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-200">
              <div>
                {/* Header de la pregunta i Temporitzador gran */}
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Pregunta #{currentQIndex + 1}
                    </span>
                    <span className="text-xs text-slate-400 font-medium truncate max-w-[170px] sm:max-w-xs">
                      {currentQuestion?.seccio || ambit}
                    </span>
                  </div>

                  {/* Rellotge amb compte enrere */}
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl shadow-sm">
                    <Timer className={`w-4 h-4 ${
                      timeLeft <= 4 ? 'text-rose-400 animate-spin' : timeLeft <= 7 ? 'text-amber-400' : 'text-sky-400'
                    }`} />
                    <span className={`text-sm font-black font-mono tabular-nums ${
                      timeLeft <= 4 ? 'text-rose-400 animate-pulse' : timeLeft <= 7 ? 'text-amber-400' : 'text-slate-100'
                    }`}>
                      {timeLeft}s
                    </span>
                  </div>
                </div>

                {/* Barra de temps visual */}
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mb-4 border border-slate-800">
                  <div 
                    className={`h-full transition-all duration-1000 ease-linear ${
                      timeLeft <= 4 
                        ? 'bg-rose-500' 
                        : timeLeft <= 7 
                        ? 'bg-amber-400' 
                        : 'bg-sky-400'
                    }`}
                    style={{ width: `${(timeLeft / QUESTION_TIME_LIMIT) * 100}%` }}
                  />
                </div>

                {/* Targeta amb l'enunciat */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-4 shadow-sm">
                  <h4 className="text-sm sm:text-base font-bold text-slate-100 leading-relaxed">
                    {currentQuestion?.pregunta}
                  </h4>
                </div>

                {/* 4 Opcions A, B, C, D */}
                <div className="space-y-2.5">
                  {currentQuestion?.opcions.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx); // A, B, C, D
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectOption(idx)}
                        className="w-full text-left p-3.5 sm:p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:bg-slate-800/80 hover:border-slate-700 text-slate-200 transition-all flex items-start gap-3 cursor-pointer active:scale-[0.99] shadow-sm"
                      >
                        <span className="w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 border border-slate-700 bg-slate-800 text-amber-400 mt-0.5">
                          {letter}
                        </span>
                        <span className="text-xs sm:text-sm font-medium leading-snug flex-1">
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Indicador inferior per al següent pis */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Objectiu: Pis {floorsCount + 1} de {MAX_FLOORS}</span>
                <span className="text-amber-400 font-bold">Col·loca el bloc encertant!</span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PANTALLA 3: FEEDBACK (TORRE VISUAL + EXPLICACIÓ OFICIAL)  */}
          {/* ========================================================= */}
          {phase === 'FEEDBACK' && (
            <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-200 space-y-4">
              <div>
                {/* Banner de Resultat */}
                {lastOutcome && (
                  <div className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2.5 mb-3.5 shadow-md ${
                    lastOutcome.isCorrect
                      ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                      : 'bg-rose-950/70 border-rose-500/60 text-rose-200'
                  }`}>
                    {lastOutcome.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                    <span className="flex-1">{lastOutcome.text}</span>
                  </div>
                )}

                {/* LA TORRE VISUAL EN ACCIÓ (Ben visible i destacada) */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5 px-1">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-amber-400" />
                      <span>Estat de la Torre ({heightInMeters} m)</span>
                    </span>
                    <span className="font-mono text-sky-400">
                      {floorsCount}/{MAX_FLOORS} Pisos construïts
                    </span>
                  </div>

                  {renderTowerVisual("min-h-[220px] max-h-[280px]")}
                </div>

                {/* TARGETA D'EXPLICACIÓ OFICIAL */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-lg text-xs space-y-2.5">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>Justificació Oficial del Temari:</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Resposta correcta: <b className="text-emerald-400 font-bold">{String.fromCharCode(65 + currentQuestion.resposta)}</b>
                    </span>
                  </div>

                  {/* Text de la pregunta breu */}
                  <p className="text-slate-200 font-medium leading-relaxed italic opacity-90">
                    "{currentQuestion.pregunta}"
                  </p>

                  {/* Resposta correcta destacada */}
                  <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 flex items-start gap-2">
                    <span className="w-5 h-5 rounded bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {String.fromCharCode(65 + currentQuestion.resposta)}
                    </span>
                    <span className="font-semibold leading-snug">
                      {currentQuestion.opcions[currentQuestion.resposta]}
                    </span>
                  </div>

                  {/* Justificació oficial completa */}
                  <p className="text-slate-300 leading-relaxed pt-1">
                    {currentQuestion.explicacio || currentQuestion.explanation || "Segons el temari oficial vigent per a l'accés al cos de Mossos d'Esquadra."}
                  </p>

                  {currentQuestion.clauTribunal && (
                    <div className="p-2 rounded-lg bg-sky-950/40 border border-sky-500/30 text-sky-300 text-[11px] font-semibold">
                      ⚖️ Clau del Tribunal: {currentQuestion.clauTribunal}
                    </div>
                  )}
                </div>
              </div>

              {/* BOTÓ GRAN DE CONTINUAR AL SEGÜENT PIS (A la zona del polze) */}
              <div className="pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleProceedFromFeedback}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-sm sm:text-base shadow-xl shadow-amber-500/25 transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  {floorsCount >= MAX_FLOORS ? (
                    <>
                      <span>🏆 Veure Victòria (10 Pisos Assolits!)</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  ) : stability <= 0 ? (
                    <>
                      <span>💥 Veure Resultat (Col·laps d'Estabilitat)</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      <span>Següent Pregunta (Pis {floorsCount + 1}/{MAX_FLOORS})</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PANTALLA 4: VICTÒRIA (10 PISOS ALÇATS AMB ÈXIT)          */}
          {/* ========================================================= */}
          {phase === 'VICTORY' && (
            <div className="my-auto flex flex-col items-center text-center animate-in fade-in duration-300 max-w-md mx-auto py-2">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-lg mb-3">
                👑
              </div>

              <h4 className="text-xl sm:text-2xl font-black text-amber-300 mb-1">
                TORRE COMPLETADA!
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mb-4">
                Has alçat els 10 pisos oficials ({MAX_FLOORS * METERS_PER_FLOOR} metres) amb èxit absolut!
              </p>

              {/* Vista final de la torre completada */}
              <div className="w-full mb-4">
                {renderTowerVisual("min-h-[180px] max-h-[220px]")}
              </div>

              {/* Stats box */}
              <div className="w-full grid grid-cols-2 gap-2 mb-4">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Puntuació Total</span>
                  <span className="text-lg font-black text-amber-400 tabular-nums">{score}</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Recompensa</span>
                  <span className="text-lg font-black text-emerald-400">+3 Caselles</span>
                </div>
              </div>

              {failedQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="w-full mb-3 py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-rose-400" />
                  <span>Repassar els {failedQuestions.length} errors comesos</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleClaimVictory}
                className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-sm sm:text-base shadow-xl shadow-amber-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Avançar al Tauler (+3 Caselles) ➔</span>
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* PANTALLA 5: DERROTA (ESTABILITAT 0% O COL·LAPS)          */}
          {/* ========================================================= */}
          {phase === 'GAME_OVER' && (
            <div className="my-auto flex flex-col items-center text-center animate-in fade-in duration-300 max-w-md mx-auto py-2">
              <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-3xl shadow-lg mb-3">
                💥
              </div>

              <h4 className="text-xl sm:text-2xl font-black text-rose-400 mb-1">
                COL·LAPS D'ESTABILITAT!
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mb-4">
                La torre no ha suportat els errors i s'ha ensorrat. Vas assolir {floorsCount} pisos ({heightInMeters}m).
              </p>

              {/* Botó de veure explicacions de preguntes fallades */}
              {failedQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="w-full mb-4 py-2.5 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                >
                  <BookOpen className="w-4 h-4 text-rose-400" />
                  <span>Veure explicació de les preguntes fallades ({failedQuestions.length})</span>
                </button>
              )}

              <div className="w-full flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Tornar a Intentar</span>
                </button>

                <button
                  type="button"
                  onClick={handleAcknowledgeDefeat}
                  className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                >
                  Sortir al Tauler (-1)
                </button>
              </div>
            </div>
          )}

        </div>

        {/* MODAL INDEPENDENT: REPASSAR EXPLICACIÓ DE PREGUNTES FALLADES */}
        {showReviewModal && (
          <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">
                    Radiografia d'Errors de la Torre
                  </h4>
                  <p className="text-xs text-slate-400">
                    Explicació de les preguntes que han debilitat l'estructura
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tancar ✕
              </button>
            </div>

            {/* Llista de preguntes fallades amb explicacions oficials */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {failedQuestions.map((record, index) => {
                const q = record.question;
                const correctAnswerLetter = String.fromCharCode(65 + q.resposta);
                const selectedLetter = record.selectedOption !== null 
                  ? String.fromCharCode(65 + record.selectedOption) 
                  : 'Cap (Temps esgotat)';

                return (
                  <div 
                    key={`${q.id}_${index}`}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                        Error #{index + 1} {record.timeExpired && '· Temps Esgotat ⏰'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {q.seccio || ambit}
                      </span>
                    </div>

                    <h5 className="text-sm font-bold text-slate-100 mb-3">
                      {q.pregunta}
                    </h5>

                    {/* Resposta seleccionada vs Correcta */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200">
                        <span className="font-bold block text-rose-400">La teva resposta:</span>
                        <span>{selectedLetter}: {record.selectedOption !== null ? q.opcions[record.selectedOption] : 'No resposta'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200">
                        <span className="font-bold block text-emerald-400">Resposta oficial correcta:</span>
                        <span>{correctAnswerLetter}: {q.opcions[q.resposta]}</span>
                      </div>
                    </div>

                    {/* Explicació oficial */}
                    <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300">
                      <span className="font-bold text-amber-400 block mb-1">
                        📖 Justificació Oficial:
                      </span>
                      <p className="leading-relaxed">
                        {q.explicacio || q.explanation || "Segons el temari oficial vigent per a l'accés al cos de Mossos d'Esquadra."}
                      </p>

                      {q.clauTribunal && (
                        <div className="mt-2 pt-2 border-t border-slate-800 text-sky-300 font-semibold">
                          ⚖️ Clau del Tribunal: {q.clauTribunal}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 shrink-0 text-center">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="py-2.5 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Entès, tornar a la partida
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
