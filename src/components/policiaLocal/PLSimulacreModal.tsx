import React, { useState, useEffect } from 'react';
import { PLMunicipi, PLPregunta } from '../../types/policiaLocal';
import { UserProfile } from '../../types';
import { recordPLUserAnswer } from '../../services/policiaLocalService';
import { AudioEngine } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { 
  X, 
  Timer, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Award, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface PLSimulacreModalProps {
  municipi?: PLMunicipi | null;
  allQuestions: PLPregunta[];
  user: UserProfile;
  onClose: () => void;
}

export const PLSimulacreModal: React.FC<PLSimulacreModalProps> = ({
  municipi,
  allQuestions,
  user,
  onClose
}) => {
  const [examStarted, setExamStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState<number>(40);
  const [selectedQuestions, setSelectedQuestions] = useState<PLPregunta[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(45 * 60); // 45 minuts per defecte
  const [isFinished, setIsFinished] = useState(false);

  // Iniciar simulacre
  const handleStartExam = (count: number) => {
    if (!allQuestions || allQuestions.length === 0) return;

    // Barallar totes les preguntes disponibles
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, Math.min(count, shuffled.length));
    
    setSelectedQuestions(chosen);
    setAnswers({});
    setCurrentIdx(0);
    // 1 minut per pregunta aproximadament
    setTimeLeft(Math.max(15, chosen.length) * 60);
    setExamStarted(true);
    setIsFinished(false);
    AudioEngine.playClick();
  };

  // Temporitzador
  useEffect(() => {
    if (!examStarted || isFinished || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, isFinished, timeLeft]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optIdx: number) => {
    if (isFinished) return;
    setAnswers(prev => {
      // Si torna a fer clic sobre la mateixa, la deselecciona (deixar en blanc)
      if (prev[currentIdx] === optIdx) {
        const copy = { ...prev };
        delete copy[currentIdx];
        return copy;
      }
      return { ...prev, [currentIdx]: optIdx };
    });
    AudioEngine.playClick();
  };

  const finishExam = async () => {
    setIsFinished(true);
    AudioEngine.playFanfare();

    // Guardar preguntes al progrés de l'usuari
    for (let i = 0; i < selectedQuestions.length; i++) {
      const q = selectedQuestions[i];
      const ans = answers[i];
      if (ans !== undefined) {
        const isCorrect = ans === q.correct_answer;
        try {
          await recordPLUserAnswer(user.uid, q.id, q.tema_id, municipi ? municipi.id : null, isCorrect);
        } catch {}
      }
    }

    const { finalScore } = calculateResults();
    if (finalScore >= 5.0) {
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.7 }
        });
      } catch {}
    }
  };

  const calculateResults = () => {
    let correct = 0;
    let incorrect = 0;
    let blank = 0;

    selectedQuestions.forEach((q, idx) => {
      const ans = answers[idx];
      if (ans === undefined) {
        blank++;
      } else if (ans === q.correct_answer) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const totalQ = selectedQuestions.length || 1;
    // Barem Oficial Oposicions Catalunya:
    // +1 correcte, -0.25 error, 0 en blanc.
    // Escala sobre 10 punts:
    const rawScore = correct - (incorrect * 0.25);
    const scaledScore = Math.max(0, (rawScore / totalQ) * 10);
    const finalScore = Number(scaledScore.toFixed(2));
    const isPassed = finalScore >= 5.0;

    return { correct, incorrect, blank, rawScore, finalScore, isPassed, totalQ };
  };

  const results = isFinished ? calculateResults() : null;
  const currentQ = selectedQuestions[currentIdx];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[94vh]">
        
        {/* HEADER */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                SIMULACRE D'EXAMEN OFICIAL
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {municipi ? `Policia Local de ${municipi.name}` : 'Convocatòries Policia Local de Catalunya'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {examStarted && !isFinished && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono text-xs font-bold shadow-inner">
                <Timer className="w-4 h-4 animate-pulse" />
                <span>{formatTimer(timeLeft)}</span>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PANTALLA 1: CONFIGURACIÓ INICIAL */}
        {!examStarted ? (
          <div className="p-6 sm:p-8 space-y-6 text-center max-w-lg mx-auto">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-10 h-10" />
            </div>

            <div>
              <h4 className="text-xl font-black text-white">Configura el teu Simulacre</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Posa a prova els teus coneixements amb les mateixes condicions de la prova teòrica oficial.
              </p>
            </div>

            {/* BAREMS OFICIALS */}
            <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl text-left space-y-2 text-xs">
              <div className="font-bold text-slate-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Condicions i Barem Oficial:</span>
              </div>
              <ul className="text-slate-400 space-y-1 pl-6 list-disc text-[11px]">
                <li>Encert: <strong>+1,00 punt</strong></li>
                <li>Errada: <strong>-0,25 punts</strong> (penalització de test)</li>
                <li>En blanc: <strong>0 punts</strong> (no resta)</li>
                <li>Nota mínima per ser <strong>APTE</strong>: <strong>5,00 sobre 10</strong></li>
              </ul>
            </div>

            {allQuestions.length === 0 ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300 text-xs">
                No hi ha preguntes disponibles actualment per iniciar un simulacre. L'admin pot incorporar-ne via importació massiva.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">Número de preguntes del simulacre:</span>
                  <div className="flex justify-center gap-2">
                    {[20, 30, 40, 50].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setQuestionCount(cnt)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          questionCount === cnt 
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md' 
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {cnt} preguntes
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Banc total disponible: {allQuestions.length} preguntes
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartExam(questionCount)}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Començar Simulacre Ara</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : isFinished && results ? (
          /* PANTALLA 2: RESULTATS FINALS */
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            <div className="text-center space-y-2">
              <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-xl border ${
                results.isPassed 
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' 
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
              }`}>
                {results.isPassed ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
              </div>

              <div className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mt-2 border ${
                results.isPassed ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }">
                {results.isPassed ? 'QUALIFICACIÓ: APTE' : 'QUALIFICACIÓ: NO APTE'}
              </div>

              <h4 className="text-3xl font-black text-white font-mono mt-1">
                {results.finalScore.toFixed(2)} <span className="text-sm font-sans text-slate-400 font-normal">/ 10</span>
              </h4>
            </div>

            {/* GRAELLA DE DADES */}
            <div className="grid grid-cols-3 gap-2.5 max-w-md mx-auto text-center">
              <div className="p-3 bg-slate-950/80 border border-emerald-500/30 rounded-2xl">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Encerts (+1)</span>
                <span className="text-xl font-black text-emerald-400 font-mono">{results.correct}</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-rose-500/30 rounded-2xl">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Errades (-0.25)</span>
                <span className="text-xl font-black text-rose-400 font-mono">{results.incorrect}</span>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Blanques (0)</span>
                <span className="text-xl font-black text-slate-400 font-mono">{results.blank}</span>
              </div>
            </div>

            {/* REVISIÓ RÀPIDA DE PREGUNTES */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Revisió detallada de preguntes ({selectedQuestions.length}):
              </h5>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {selectedQuestions.map((q, idx) => {
                  const ans = answers[idx];
                  const isCorrect = ans === q.correct_answer;
                  const isBlank = ans === undefined;

                  return (
                    <div 
                      key={idx}
                      className={`p-3 rounded-xl border text-xs ${
                        isBlank 
                          ? 'bg-slate-950/40 border-slate-800 text-slate-400' 
                          : isCorrect 
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' 
                            : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-mono font-bold shrink-0">{idx + 1}.</span>
                        <div className="flex-1 space-y-1">
                          <p className="font-medium text-slate-200">{q.question}</p>
                          <div className="text-[11px] space-y-0.5">
                            {isBlank ? (
                              <span className="text-amber-400 font-semibold block">Deixada en blanc</span>
                            ) : (
                              <span className={isCorrect ? 'text-emerald-400' : 'text-rose-400'}>
                                La teva resposta: {q.options[ans]}
                              </span>
                            )}
                            {!isCorrect && (
                              <span className="text-slate-400 block">
                                Correcta: <strong className="text-emerald-400">{q.options[q.correct_answer]}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleStartExam(selectedQuestions.length)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Repetir Simulacre</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl shadow-md cursor-pointer"
              >
                Tancar
              </button>
            </div>
          </div>
        ) : (
          /* PANTALLA 3: EXAMEN EN CURS */
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
            {/* INDICADOR DE NÚMERO DE PREGUNTA I GRAELLA RÀPIDA */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-amber-400">Pregunta {currentIdx + 1} de {selectedQuestions.length}</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  ({Object.keys(answers).length} respostes / {selectedQuestions.length - Object.keys(answers).length} blanques)
                </span>
              </div>
              <button
                type="button"
                onClick={finishExam}
                className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
              >
                Entregar Examen
              </button>
            </div>

            {/* NAVEGADOR DE BOTONS NUMÈRICS */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
              {selectedQuestions.map((_, i) => {
                const isCurrent = i === currentIdx;
                const isAnswered = answers[i] !== undefined;

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentIdx(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-bold shrink-0 transition-all cursor-pointer ${
                      isCurrent 
                        ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400' 
                        : isAnswered 
                          ? 'bg-sky-500/30 text-sky-300 border border-sky-500/40' 
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {/* PREGUNTA ACTUAL */}
            {currentQ && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
                  <p className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed">
                    {currentQ.question}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = answers[currentIdx] === idx;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectOption(idx)}
                        className={`w-full p-3 sm:p-3.5 rounded-2xl border text-left text-xs sm:text-sm flex items-start gap-3 transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/10' 
                            : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1 leading-snug">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-500 italic">
                  * Fes clic a l'opció seleccionada si vols desmarcar-la i deixar la pregunta en blanc (0 punts).
                </div>

                {/* BOTONS ANTERIOR / SEGÜENT */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      currentIdx > 0 ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'opacity-40 cursor-not-allowed text-slate-500'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Anterior</span>
                  </button>

                  {currentIdx + 1 < selectedQuestions.length ? (
                    <button
                      type="button"
                      onClick={() => setCurrentIdx(prev => prev + 1)}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <span>Següent</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={finishExam}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Finalitzar i Entregar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
