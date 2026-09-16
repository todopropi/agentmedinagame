import React, { useState, useEffect } from 'react';
import { UserProfile, QuestionAmbit, Question } from '../types';
import { getQuestionsByAmbit } from '../data/questionsBank';
import { QuestionCard } from './QuestionCard';
import { ShieldRenderer } from './ShieldRenderer';
import confetti from 'canvas-confetti';
import { 
  Dice5, 
  MapPin, 
  Sparkles, 
  Coins, 
  CheckCircle2, 
  RotateCcw, 
  Flag, 
  Zap, 
  Shield, 
  Trophy, 
  ArrowRight,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

interface ModeCampanyaProps {
  user: UserProfile;
  onUpdateUserStats: (xpGained: number, meritsGained: number, failedId?: string, savedId?: string) => void;
  onSaveQuestionToggle: (questionId: string) => void;
}

const TOTAL_TILES = 50;

// Casillas especiales de la Oca Policial
const MOSSO_OCA_TILES = [5, 9, 14, 18, 23, 27, 32, 36, 41, 45];
const CONTROL_POLICIAL_TILES = [12, 21, 31, 43];

interface BoardProgression {
  [ambit: string]: number; // tile index 0 to 50
}

export const ModeCampanya: React.FC<ModeCampanyaProps> = ({
  user,
  onUpdateUserStats,
  onSaveQuestionToggle
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

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [lastEventMsg, setLastEventMsg] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentTile = boardProgress[selectedAmbit] || 0;

  // Save progress locally
  useEffect(() => {
    try {
      localStorage.setItem(`agent_medina_board_${user.uid}`, JSON.stringify(boardProgress));
    } catch (e) {
      console.error(e);
    }
  }, [boardProgress, user.uid]);

  const ambitsList: { id: QuestionAmbit; label: string; desc: string; icon: string }[] = [
    { id: 'Àmbit A', label: 'Àmbit A (Entorn)', desc: 'Història, Sociolingüística, Geografia, Societat i TIC', icon: '🌍' },
    { id: 'Àmbit B', label: 'Àmbit B (Institucional)', desc: 'EAC, Parlament, CE, Drets Humans, Estat i UE', icon: '🏛️' },
    { id: 'Àmbit C', label: 'Àmbit C (Seguretat)', desc: 'Competències, Interior, Marc Legal LO 2/86 i Codi Ètica', icon: '👮' },
    { id: 'Actualitat', label: 'Actualitat & Cultura', desc: 'Pla Mossos 2030, noves uniformitats i acords de seguretat', icon: '📰' },
    { id: 'ISPC', label: 'Direcció ISPC (Global)', desc: 'Repte mestre amb preguntes de tots els àmbits integrats', icon: '🎓' },
  ];

  const handleStartQuestion = () => {
    const questions = getQuestionsByAmbit(selectedAmbit);
    if (questions.length === 0) return;
    const randomQ = questions[Math.floor(Math.random() * questions.length)];
    setCurrentQuestion(randomQ);
    setLastEventMsg(null);
  };

  const handleAnswerOutcome = (isCorrect: boolean) => {
    if (!currentQuestion) return;

    let newTile = currentTile;
    let eventText = '';

    if (isCorrect) {
      // Mecánica Oca: +1 casilla (+10 Mèrits, +20 XP)
      newTile = Math.min(TOTAL_TILES, currentTile + 1);
      let extraXp = 20;
      let extraMerits = 10;
      eventText = '✓ Resposta correcta! Avança +1 casella (+20 XP, +10 Mèrits).';

      // Comprovar si cau a casella "De Mosso a Mosso" (+3 caselles)
      if (MOSSO_OCA_TILES.includes(newTile)) {
        newTile = Math.min(TOTAL_TILES, newTile + 3);
        extraXp += 30;
        extraMerits += 15;
        eventText += ' 🚨 DE MOSSO A MOSSO! Salta +3 caselles i suma bonificació!';
      }

      onUpdateUserStats(extraXp, extraMerits);

      if (newTile >= TOTAL_TILES) {
        setIsCompleted(true);
        onUpdateUserStats(1000, 500); // Grand prize for completing board
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } else {
      // Mecánica Oca: -2 casillas
      newTile = Math.max(0, currentTile - 2);
      eventText = '✗ Resposta incorrecta. Retrocedeixes 2 caselles per repassar conceptes.';
      onUpdateUserStats(0, 0, currentQuestion.id);

      // Comprovar si cau a control policial (-1 casella addicional)
      if (CONTROL_POLICIAL_TILES.includes(newTile)) {
        newTile = Math.max(0, newTile - 1);
        eventText += ' 🛑 Control Policial: Aturada per verificació d\'identitat (-1 casella).';
      }
    }

    setBoardProgress(prev => ({
      ...prev,
      [selectedAmbit]: newTile
    }));

    setLastEventMsg(eventText);
  };

  const resetBoard = () => {
    if (confirm('Vols reiniciar aquest tauler des de la casella 0?')) {
      setBoardProgress(prev => ({
        ...prev,
        [selectedAmbit]: 0
      }));
      setIsCompleted(false);
      setLastEventMsg('Tauler reiniciat.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Board Ambit Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <span>🎲</span>
              <span>Tauler de l'Oca Policial (50 Caselles)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Supera les 50 caselles de cada àmbit: Resposta correcta = <b>+1 casella</b> (+10 Mèrits, +20 XP). Error = <b>-2 caselles</b>.
            </p>
          </div>

          <div className="flex items-center gap-2">
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
                  setCurrentQuestion(null);
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
                    progress >= TOTAL_TILES ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-amber-300'
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
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Tauler Actiu: <span className="text-amber-400 font-bold">{selectedAmbit}</span>
              </div>
              <div className="text-lg font-black text-white">
                Casella {currentTile} de {TOTAL_TILES}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentTile < TOTAL_TILES && !currentQuestion && (
              <button
                type="button"
                onClick={handleStartQuestion}
                className="py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 cursor-pointer"
              >
                <Dice5 className="w-5 h-5" />
                <span>Llançar Dau & Respondre Repte</span>
              </button>
            )}

            {currentTile >= TOTAL_TILES && (
              <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500 text-emerald-300 font-black text-xs rounded-xl flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                <span>TAULER COMPLETAT! (+1.000 XP)</span>
              </div>
            )}
          </div>
        </div>

        {lastEventMsg && (
          <div className="mb-6 p-3.5 bg-slate-800/90 border border-amber-500/40 rounded-xl text-xs sm:text-sm text-amber-200 flex items-center gap-2.5 animate-in fade-in">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{lastEventMsg}</span>
          </div>
        )}

        {/* Active Question Modal / Box */}
        {currentQuestion && (
          <div className="mb-8">
            <div className="text-xs font-black text-amber-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Pregunta de la Casella {currentTile}</span>
            </div>
            <QuestionCard
              question={currentQuestion}
              onAnswerSelected={handleAnswerOutcome}
              onSaveToggle={onSaveQuestionToggle}
              isSaved={user.savedQuestionIds?.includes(currentQuestion.id)}
              onNext={() => setCurrentQuestion(null)}
              nextButtonLabel="Avançar al tauler"
            />
          </div>
        )}

        {/* Visual 50-Tile Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-2.5 select-none">
          {Array.from({ length: TOTAL_TILES + 1 }).map((_, tileNum) => {
            const isStart = tileNum === 0;
            const isFinish = tileNum === TOTAL_TILES;
            const isPlayerHere = currentTile === tileNum;
            const isOca = MOSSO_OCA_TILES.includes(tileNum);
            const isControl = CONTROL_POLICIAL_TILES.includes(tileNum);

            let tileBg = "bg-slate-800/70 border-slate-700/70 text-slate-400";
            let labelBadge = null;

            if (isStart) {
              tileBg = "bg-sky-950/60 border-sky-600 text-sky-300 font-bold";
            } else if (isFinish) {
              tileBg = "bg-gradient-to-br from-amber-500 to-amber-600 border-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/30";
            } else if (isOca) {
              tileBg = "bg-amber-950/50 border-amber-500/70 text-amber-300 font-semibold";
              labelBadge = <span className="text-[9px] font-black text-amber-400 tracking-tighter">MOSSO +3</span>;
            } else if (isControl) {
              tileBg = "bg-red-950/50 border-red-500/70 text-red-300 font-semibold";
              labelBadge = <span className="text-[9px] font-black text-red-400 tracking-tighter">CONTROL</span>;
            }

            if (isPlayerHere) {
              tileBg = "bg-sky-600 border-white text-white font-black ring-4 ring-sky-400/50 shadow-xl scale-105 z-10";
            }

            return (
              <div
                key={tileNum}
                className={`relative aspect-square rounded-2xl border p-1.5 sm:p-2 flex flex-col justify-between items-center transition-all ${tileBg}`}
              >
                <div className="w-full flex justify-between items-center text-[10px] sm:text-xs">
                  <span className="font-mono font-bold opacity-80">{tileNum}</span>
                  {isFinish && <Flag className="w-3.5 h-3.5" />}
                  {isOca && !isPlayerHere && <span className="text-xs">🚨</span>}
                  {isControl && !isPlayerHere && <span className="text-xs">🛑</span>}
                </div>

                {isPlayerHere ? (
                  <div className="flex flex-col items-center justify-center animate-bounce">
                    <ShieldRenderer shieldId={user.equippedShieldId} size={28} />
                    <span className="text-[9px] font-black uppercase text-white tracking-widest mt-0.5">TU</span>
                  </div>
                ) : (
                  <div className="text-center">
                    {labelBadge}
                  </div>
                )}

                <div className="w-full text-right text-[8px] opacity-40 font-mono">
                  {tileNum === 0 ? 'SORTIDA' : tileNum === TOTAL_TILES ? 'APROVAT' : ''}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-center gap-4 sm:gap-8 flex-wrap text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/50 border border-amber-400" />
            <span><b>De Mosso a Mosso</b>: Salta +3 caselles</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-500/50 border border-red-400" />
            <span><b>Control Policial</b>: Retrocedeix -1 casella</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 border border-amber-300" />
            <span><b>Casella 50 Meta</b>: Bonificació d'oficial +500 Mèrits</span>
          </div>
        </div>
      </div>
    </div>
  );
};
