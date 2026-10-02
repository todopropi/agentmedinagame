import React, { useState, useEffect, useRef } from 'react';
import { Question, QuestionAmbit } from '../types';
import { getQuestionsByAmbit } from '../data/questionsBank';
import { AudioEngine } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Timer, 
  Sparkles, 
  AlertTriangle, 
  X, 
  ArrowRight, 
  RotateCcw,
  Zap,
  Activity,
  Flame
} from 'lucide-react';

interface MinijocCircuitAgilitatProps {
  ambit: QuestionAmbit;
  onComplete: (advanceTiles: number, msg?: string) => void;
  onClose: () => void;
}

interface Runner {
  id: string;
  name: string;
  avatar: string; // emoji or visual character
  lane: number; // 1, 2, 3, 4
  positionPercent: number; // 0 to 100% on the track
  isPlayer: boolean;
}

const TOTAL_QUESTIONS = 6;
const QUESTION_TIME_LIMIT = 10; // 10 segons per esprint
const START_POS = 0; // Posició inicial: just a sobre de la casella del número (0% des de la dreta)

export const MinijocCircuitAgilitat: React.FC<MinijocCircuitAgilitatProps> = ({
  ambit,
  onComplete,
  onClose
}) => {
  // Select 6 random questions from the ambit
  const [questions] = useState<Question[]>(() => {
    const pool = getQuestionsByAmbit(ambit);
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, TOTAL_QUESTIONS);
  });

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [lastOutcome, setLastOutcome] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [playerJumping, setPlayerJumping] = useState(false);
  const [playerStumbling, setPlayerStumbling] = useState(false);

  // 4 Runners on track - All start properly lined up at the SORTIDA line (START_POS)
  const [runners, setRunners] = useState<Runner[]>([
    { id: 'capibara', name: 'Capibara Velor', avatar: '🦫', lane: 1, positionPercent: START_POS, isPlayer: false },
    { id: 'goril·la', name: 'Goril·la Policial', avatar: '🦍', lane: 2, positionPercent: START_POS, isPlayer: false },
    { id: 'tu', name: 'Tu (Agent Medina)', avatar: '👮‍♂️', lane: 3, positionPercent: START_POS, isPlayer: true },
    { id: 'trex', name: 'T-Rex Àgil', avatar: '🦖', lane: 4, positionPercent: START_POS, isPlayer: false },
  ]);

  // Player rank is derived dynamically and accurately from real positions on the track
  const [playerRank, setPlayerRank] = useState<number>(3);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate actual rank from current track positions (1 = furthest right / closest to META)
  const getRankFromRunners = (runnerList: Runner[]): number => {
    const sorted = [...runnerList].sort((a, b) => b.positionPercent - a.positionPercent);
    const idx = sorted.findIndex(r => r.isPlayer);
    return idx >= 0 ? idx + 1 : 4;
  };

  // 10s Timer effect for each question
  useEffect(() => {
    if (isAnswered || isFinished) return;

    setTimeLeft(QUESTION_TIME_LIMIT);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQIndex, isAnswered, isFinished]);

  // Handle timeout (exceeded 10 seconds)
  const handleTimeOut = () => {
    if (isAnswered || isFinished) return;
    setIsAnswered(true);
    setSelectedOption(null);
    AudioEngine.playWrong();
    setPlayerStumbling(true);
    setTimeout(() => setPlayerStumbling(false), 800);

    setLastOutcome({
      isCorrect: false,
      text: "⏱️ TEMPS ESGOTAT (>10s)! Has frenat i els rivals t'han superat!"
    });

    updateRunnerPositions(false, 0);
  };

  // Handle option selection
  const handleSelectOption = (index: number) => {
    if (isAnswered || isFinished) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setIsAnswered(true);
    setSelectedOption(index);

    const currQ = questions[currentQIndex];
    const isCorrect = index === currQ.resposta;
    const timeUsed = QUESTION_TIME_LIMIT - timeLeft;

    if (isCorrect) {
      AudioEngine.playCorrect();
      setPlayerJumping(true);
      setTimeout(() => setPlayerJumping(false), 800);

      setLastOutcome({
        isCorrect: true,
        text: `⚡ ESPRINT PERFECTE EN ${timeUsed}s! Gran accelerada cap a la meta!`
      });
      updateRunnerPositions(true, timeUsed);
    } else {
      AudioEngine.playWrong();
      setPlayerStumbling(true);
      setTimeout(() => setPlayerStumbling(false), 800);

      setLastOutcome({
        isCorrect: false,
        text: "💥 RESPOSTA INCORRECTA! Has perdut velocitat i els rivals han guanyat terreny!"
      });
      updateRunnerPositions(false, timeUsed);
    }
  };

  // Update positions realistically based on real performance
  const updateRunnerPositions = (playerSucceeded: boolean, timeUsed: number) => {
    setRunners(prev => {
      const updated = prev.map(r => {
        if (r.isPlayer) {
          // Si encerta ràpid (<5s): +16% d'avanç; si encerta (<10s): +14%
          // Si falla o s'esgota el temps: només +1% (ensopega)
          let advance = 1.0;
          if (playerSucceeded) {
            advance = timeUsed <= 4 ? 16.0 : 13.8;
          }
          return {
            ...r,
            positionPercent: Math.min(84, r.positionPercent + advance)
          };
        } else {
          // Rivals avanç de ritme regular (8.5% - 10.5% per esprint)
          // Si el jugador encerta les seves preguntes, els supera clarament
          let baseSpeed = 9.0;
          if (r.id === 'capibara') baseSpeed = 8.2 + Math.random() * 1.5;
          if (r.id === 'goril·la') baseSpeed = 9.0 + Math.random() * 1.5;
          if (r.id === 'trex') baseSpeed = 9.8 + Math.random() * 1.5;

          return {
            ...r,
            positionPercent: Math.min(74, r.positionPercent + baseSpeed)
          };
        }
      });

      // Synchronize player rank strictly with actual positions on the track
      const newRank = getRankFromRunners(updated);
      setPlayerRank(newRank);

      return updated;
    });
  };

  // Next sprint question
  const handleNextQuestion = () => {
    if (currentQIndex + 1 < TOTAL_QUESTIONS) {
      setCurrentQIndex(prev => prev + 1);
      setIsAnswered(false);
      setSelectedOption(null);
      setLastOutcome(null);
    } else {
      // Reached the finish line! Calculate final rank from real runner positions
      setRunners(currentRunners => {
        const finalRank = getRankFromRunners(currentRunners);
        setPlayerRank(finalRank);
        if (finalRank === 1) {
          confetti({
            particleCount: 160,
            spread: 90,
            origin: { y: 0.6 }
          });
        }
        return currentRunners;
      });
      setIsFinished(true);
    }
  };

  // Complete game and apply reward
  const handleFinishCourse = () => {
    if (playerRank === 1) {
      onComplete(3, "🥇 1r LLOC AL CIRCUIT D'AGILITAT! Has estat el més ràpid arribant a la meta (+3 Caselles de salt)!");
    } else if (playerRank === 2) {
      onComplete(2, "🥈 2n LLOC AL CIRCUIT D'AGILITAT! Gran rendiment físic (+2 Caselles)!");
    } else if (playerRank === 3) {
      onComplete(1, "🥉 3r LLOC AL CIRCUIT D'AGILITAT! Has creuat la meta en zona de mèrit (+1 Casella)!");
    } else {
      // 4th place: repeat
      onComplete(0, "Has arribat l'últim (4t lloc). Has de repetir el circuit per classificar-te!");
    }
  };

  const currQ = questions[currentQIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden my-auto text-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-2xl">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-1.5">
                  <span>🏃‍♂️</span>
                  <span>Circuit d'Agilitat Policial</span>
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Esprint {currentQIndex + 1} de {TOTAL_QUESTIONS}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Respon abans de 10 segons per esprintar i avançar als rivals cap a la meta. <b>1r = +3 caselles, 2n = +2, 3r = +1, 4t = Repeteix</b>!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live Position Badge directly mirroring track */}
            <div className={`px-3 py-1.5 rounded-xl border font-black text-xs flex items-center gap-1.5 shadow-md ${
              playerRank === 1 ? 'bg-amber-500/25 border-amber-400 text-amber-300' :
              playerRank === 2 ? 'bg-slate-300/20 border-slate-300 text-slate-200' :
              playerRank === 3 ? 'bg-amber-700/20 border-amber-600 text-amber-400' :
              'bg-rose-500/20 border-rose-500/40 text-rose-300'
            }`}>
              <Trophy className="w-3.5 h-3.5" />
              <span>Posició en Cursa: {playerRank}º</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Sortir del circuit"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* VISUAL TRACK & FIELD ARENA */}
        <div className="my-4 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl relative select-none">
          {/* Upper Grandstand with Cheering Spectators */}
          <div className="h-14 sm:h-16 bg-gradient-to-b from-sky-950 via-slate-800 to-slate-900 flex flex-col justify-end px-3 pb-1 border-b border-slate-700 relative overflow-hidden">
            <div className="flex items-end justify-around opacity-90 text-sm sm:text-base tracking-tighter">
              <span>👥</span><span>🙋‍♂️</span><span>👏</span><span>🎉</span><span>🙋‍♀️</span><span>🙌</span><span>👥</span><span>👏</span><span>🎉</span><span>🙋‍♂️</span><span>🙌</span><span>👥</span>
            </div>
            <div className="w-full h-1 bg-slate-600 rounded-full mt-1 border-b border-slate-900" />
          </div>

          {/* Running Track with 4 Lanes */}
          <div className="relative bg-[#a1553c] p-2 sm:p-3 space-y-2 border-b-4 border-[#7a3b27]">
            {/* LÍNIA DE META CLARA AMB BANDERES I QUADRES (LEFT) */}
            <div className="absolute left-2 sm:left-6 top-0 bottom-0 z-10 pointer-events-none flex flex-col items-center">
              <div className="bg-amber-400 text-slate-950 font-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded shadow whitespace-nowrap mb-0.5">
                🏁 META
              </div>
              <div className="flex-1 w-3.5 sm:w-5 flex flex-col justify-between items-center opacity-95">
                {Array.from({ length: 14 }).map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-full h-2.5 ${idx % 2 === 0 ? 'bg-black' : 'bg-white'} border-x border-black/40`} 
                  />
                ))}
              </div>
            </div>

            {/* 4 Lanes - NO HURDLES / SENSE TANCAS */}
            {runners.map((runner) => {
              const isTu = runner.isPlayer;

              return (
                <div
                  key={runner.id}
                  className={`relative h-11 sm:h-13 rounded-xl border border-dashed border-white/30 flex items-center transition-all overflow-hidden ${
                    isTu ? 'bg-amber-950/30 ring-2 ring-amber-400/50' : 'bg-black/15'
                  }`}
                >
                  {/* Starting Block Number Box (Right) - Calix de sortida amb el número */}
                  <div className="w-12 sm:w-16 h-full flex items-center justify-center bg-black/60 border-l-2 border-white/40 text-white/40 font-mono font-black text-sm sm:text-base shrink-0 z-0 ml-auto select-none">
                    {runner.lane}
                  </div>

                  {/* Runner Sprite moving forward towards META (Starts directly inside/over their lane number box) */}
                  <div
                    className={`absolute flex items-center gap-1 transition-all duration-700 ease-out z-20 ${
                      isTu && playerJumping ? '-translate-y-2 scale-110' : isTu && playerStumbling ? 'rotate-6 translate-y-1 opacity-70' : ''
                    }`}
                    style={{ 
                      right: runner.positionPercent === 0 
                        ? '0.35rem' 
                        : `min(calc(100% - 4.5rem), calc(${runner.positionPercent}% + 0.35rem))` 
                    }}
                  >
                    {/* Natural emoji orientation faces left towards META */}
                    <span className="inline-block text-xl sm:text-3xl filter drop-shadow select-none shrink-0">
                      {runner.avatar}
                    </span>
                    <span className={`text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow whitespace-nowrap ${
                      isTu ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-900/80 text-white'
                    }`}>
                      {runner.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 10-Second Countdown Timer Bar */}
        {!isFinished && (
          <div className="mb-4 bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className={`p-2 rounded-xl border flex items-center gap-1 font-mono font-black text-xs ${
              timeLeft <= 3 ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-bounce' : 'bg-amber-500/20 border-amber-500 text-amber-300'
            }`}>
              <Timer className="w-4 h-4" />
              <span>{timeLeft}s</span>
            </div>

            <div className="flex-1 bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  timeLeft <= 3 ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-amber-500'
                }`}
                style={{ width: `${(timeLeft / QUESTION_TIME_LIMIT) * 100}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              {timeLeft <= 3 ? '⚡ Ràpid!' : 'Respon abans que s\'esgoti!'}
            </span>
          </div>
        )}

        {/* Sprint Question Card */}
        {!isFinished && currQ && (
          <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-xs">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Esprint #{currentQIndex + 1}: {currQ.seccio || currQ.ambit}</span>
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                {QUESTION_TIME_LIMIT - timeLeft}s utilitzats
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-bold text-white mb-4 leading-relaxed">
              {currQ.pregunta}
            </h4>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
              {currQ.opcions.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currQ.resposta;

                let btnStyle = "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200";

                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = "bg-emerald-500/25 border-emerald-500 text-emerald-200 font-bold";
                  } else if (isSelected && !isCorrect) {
                    btnStyle = "bg-rose-500/25 border-rose-500 text-rose-200 line-through font-bold";
                  } else {
                    btnStyle = "opacity-40 bg-slate-900 border-slate-800";
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswered}
                    className={`p-3 rounded-xl border text-left text-xs sm:text-sm transition-all cursor-pointer flex items-start gap-2.5 ${btnStyle}`}
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Outcome notification */}
            {lastOutcome && (
              <div className={`p-3 rounded-xl border text-xs font-bold mb-3 animate-in fade-in flex items-center justify-between gap-2 ${
                lastOutcome.isCorrect ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
              }`}>
                <span>{lastOutcome.text}</span>
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
                >
                  <span>Següent Esprint</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Podium Finish Banner - Completely Authentic & Real Result */}
        {isFinished && (
          <div className="mt-4 p-5 bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-emerald-500/20 border-2 border-amber-500 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/30 rounded-2xl border border-amber-400 shrink-0">
                <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
              </div>
              <div>
                <h4 className="text-lg font-black text-amber-300">
                  {playerRank === 1 ? '🥇 1r LLOC! CAMPIÓ DEL CIRCUIT!' :
                   playerRank === 2 ? '🥈 2n LLOC! SUBCAMPIÓ D\'AGILITAT!' :
                   playerRank === 3 ? '🥉 3r LLOC! CLASSIFICACIÓ APROVADA!' :
                   '❌ 4t LLOC (ÚLTIM): NO CLASSIFICAT'}
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  {playerRank === 1 ? 'Has estat el més veloç de tots els corredors! Recompensa: +3 CASELLAS al Tauler de l\'Oca!' :
                   playerRank === 2 ? 'Molt bon ritme i reflexos! Has arribat en segona posició (+2 CASELLAS al Tauler de l\'Oca)!' :
                   playerRank === 3 ? 'Has aconseguit creuar la meta en 3a posició (+1 CASELLA al Tauler de l\'Oca)!' :
                   'Has arribat en última posició (4t lloc). Has de repetir el circuit sense avançar caselles.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinishCourse}
              className="py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 cursor-pointer shrink-0"
            >
              <span>{playerRank === 4 ? 'TORNAR AL TAULER (SENSE SALT)' : `APLICAR +${4 - playerRank} CASELLAS ➔`}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
