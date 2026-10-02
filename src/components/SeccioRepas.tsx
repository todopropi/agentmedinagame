import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UserProfile, Question } from '../types';
import { QUESTIONS_BANK } from '../data/questionsBank';
import { CONFUSION_CONCEPTS, MNEMONIC_CARDS, subscribeToConcepts } from '../data/conceptsAndMistakes';
import { QuestionCard } from './QuestionCard';
import { 
  BookOpen, 
  AlertTriangle, 
  Sparkles, 
  RotateCcw, 
  BookmarkCheck, 
  CheckCircle2, 
  Check, 
  Brain, 
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Star,
  Play,
  Layers,
  ArrowRight,
  Award,
  RefreshCw,
  X
} from 'lucide-react';

interface SeccioRepasProps {
  user: UserProfile;
  onRemoveFailedQuestion: (questionId: string) => void;
  onToggleSaveQuestion: (questionId: string) => void;
  onToggleSaveMnemonic?: (ruleId: string) => void;
  onUpdateStats: (
    xpGained: number, 
    meritsGained: number, 
    failedId?: string, 
    savedId?: string,
    answeredId?: string,
    isCorrect?: boolean
  ) => void;
}

export const SeccioRepas: React.FC<SeccioRepasProps> = ({
  user,
  onRemoveFailedQuestion,
  onToggleSaveQuestion,
  onToggleSaveMnemonic,
  onUpdateStats
}) => {
  const [subTab, setSubTab] = useState<'fallades' | 'guardades' | 'regles_guardades' | 'confusions' | 'mnemo'>('fallades');
  const [activePracticeQuestion, setActivePracticeQuestion] = useState<Question | null>(null);
  const [expandedConfusionId, setExpandedConfusionId] = useState<string | null>(CONFUSION_CONCEPTS[0]?.id || null);
  const tabsRef = React.useRef<HTMLDivElement>(null);
  const [, setConceptsTick] = useState(0);

  useEffect(() => {
    const unsub = subscribeToConcepts(() => {
      setConceptsTick(t => t + 1);
    });
    return unsub;
  }, []);

  const scrollTabs = (offset: number) => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Get failed and saved questions
  const failedQuestions = QUESTIONS_BANK.filter(q => user.failedQuestionIds?.includes(q.id));
  const savedQuestions = QUESTIONS_BANK.filter(q => user.savedQuestionIds?.includes(q.id));

  // Saved rules & traps (mnemonics & confusion concepts)
  const savedMnemonicIds = user.savedMnemonicIds || [];
  const savedMnemonics = MNEMONIC_CARDS.filter(m => savedMnemonicIds.includes(m.id));
  const savedConfusions = CONFUSION_CONCEPTS.filter(c => savedMnemonicIds.includes(c.id));
  const totalSavedRules = savedMnemonics.length + savedConfusions.length;

  // Mode Test d'Errors
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testAmbit, setTestAmbit] = useState<string>('tots');
  const [testMode, setTestMode] = useState<'superacio' | 'repas'>('superacio');
  const [testQuestionsList, setTestQuestionsList] = useState<Question[]>([]);
  const [testCurrentIndex, setTestCurrentIndex] = useState(0);
  const [testScore, setTestScore] = useState<{ correct: number; wrong: number; removedCount: number }>({ correct: 0, wrong: 0, removedCount: 0 });
  const [isTestFinished, setIsTestFinished] = useState(false);

  const availableAmbitsForFailed = ['tots', 'Àmbit A', 'Àmbit B', 'Àmbit C', 'Actualitat'];

  const getAmbitFailedCount = (amb: string) => {
    if (amb === 'tots') return failedQuestions.length;
    return failedQuestions.filter(q => q.ambit === amb).length;
  };

  const handleStartErrorTest = () => {
    let pool = failedQuestions;
    if (testAmbit !== 'tots') {
      pool = pool.filter(q => q.ambit === testAmbit);
    }
    if (pool.length === 0) return;
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    setTestQuestionsList(shuffled);
    setTestCurrentIndex(0);
    setTestScore({ correct: 0, wrong: 0, removedCount: 0 });
    setIsTestFinished(false);
    setIsTestRunning(true);
    setActivePracticeQuestion(null);
  };

  const handleTestAnswerSelected = (isCorrect: boolean) => {
    const q = testQuestionsList[testCurrentIndex];
    if (!q) return;

    if (isCorrect) {
      if (testMode === 'superacio') {
        onRemoveFailedQuestion(q.id);
        setTestScore(prev => ({ ...prev, correct: prev.correct + 1, removedCount: prev.removedCount + 1 }));
      } else {
        setTestScore(prev => ({ ...prev, correct: prev.correct + 1 }));
      }
      onUpdateStats(15, 10, undefined, undefined, q.id, true);
    } else {
      setTestScore(prev => ({ ...prev, wrong: prev.wrong + 1 }));
      onUpdateStats(0, 0, q.id, undefined, q.id, false);
    }
  };

  const handleTestNextQuestion = () => {
    if (testCurrentIndex < testQuestionsList.length - 1) {
      setTestCurrentIndex(prev => prev + 1);
    } else {
      setIsTestFinished(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  };

  const handleExitTest = () => {
    setIsTestRunning(false);
    setIsTestFinished(false);
    setTestQuestionsList([]);
  };

  const handlePracticeOutcome = (isCorrect: boolean) => {
    if (!activePracticeQuestion) return;
    if (isCorrect) {
      onRemoveFailedQuestion(activePracticeQuestion.id);
      onUpdateStats(15, 10, undefined, undefined, activePracticeQuestion.id, true);
    } else {
      onUpdateStats(0, 0, activePracticeQuestion.id, undefined, activePracticeQuestion.id, false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
                <Brain className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Centre de Repàs, Errors & Mnemotècniques
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Reforça els punts febles de la Guia Oficial 2026, repassa les preguntes que hagis fallat i aprèn a esquivar les preguntes trampa que sol posar el Tribunal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 bg-red-950/40 border border-red-500/40 rounded-xl text-xs font-bold text-red-300">
              {failedQuestions.length} Errors pendents
            </div>
            <div className="px-3.5 py-2 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300">
              {savedQuestions.length} Guardades
            </div>
            <div className="px-3.5 py-2 bg-sky-950/40 border border-sky-500/40 rounded-xl text-xs font-bold text-sky-300">
              {totalSavedRules} Regles/Trampes
            </div>
          </div>
        </div>

        {/* Sub Navigation with responsive arrows and sleek scrollbar */}
        <div className="relative mt-6 pt-2 border-t border-slate-800 flex items-center">
          <button
            type="button"
            onClick={() => scrollTabs(-220)}
            title="Desplaçar a l'esquerra"
            className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white shrink-0 mr-1.5 cursor-pointer transition-colors border border-slate-700/50 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={tabsRef}
            onWheel={(e) => {
              if (e.deltaY !== 0 && tabsRef.current) {
                tabsRef.current.scrollLeft += e.deltaY;
              }
            }}
            className="flex items-center gap-2 overflow-x-auto pretty-scrollbar py-1 scroll-smooth w-full select-none"
          >
            <button
              onClick={() => { setSubTab('fallades'); setActivePracticeQuestion(null); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                subTab === 'fallades'
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Repàs d'Errors ({failedQuestions.length})</span>
            </button>

            <button
              onClick={() => { setSubTab('guardades'); setActivePracticeQuestion(null); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                subTab === 'guardades'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>Preguntes Guardades ({savedQuestions.length})</span>
            </button>

            <button
              onClick={() => { setSubTab('regles_guardades'); setActivePracticeQuestion(null); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                subTab === 'regles_guardades'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Regles i Trampes Guardades ({totalSavedRules})</span>
            </button>

            <button
              onClick={() => { setSubTab('confusions'); setActivePracticeQuestion(null); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                subTab === 'confusions'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Conceptes Trampa / Anti-Confusió</span>
            </button>

            <button
              onClick={() => { setSubTab('mnemo'); setActivePracticeQuestion(null); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                subTab === 'mnemo'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Regles Mnemotècniques Clau</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => scrollTabs(220)}
            title="Desplaçar a la dreta"
            className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white shrink-0 ml-1.5 cursor-pointer transition-colors border border-slate-700/50 shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Practice Question View */}
      {activePracticeQuestion && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl">
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4" />
              <span>Practicant Pregunta de Repàs</span>
            </span>
            <button
              onClick={() => setActivePracticeQuestion(null)}
              className="text-xs text-slate-400 hover:text-white font-bold cursor-pointer"
            >
              ✕ Tancar pràctica
            </button>
          </div>

          <QuestionCard
            question={activePracticeQuestion}
            onAnswerSelected={handlePracticeOutcome}
            onSaveToggle={onToggleSaveQuestion}
            isSaved={user.savedQuestionIds?.includes(activePracticeQuestion.id)}
            onNext={() => setActivePracticeQuestion(null)}
            nextButtonLabel="Finalitzar revisió"
            mistakeCount={user.questionMistakesCount?.[activePracticeQuestion.id] || (user.failedQuestionIds?.includes(activePracticeQuestion.id) ? 1 : 0)}
          />
        </div>
      )}

      {/* TAB 1: Failed Questions Tracker */}
      {subTab === 'fallades' && !activePracticeQuestion && (
        <div className="space-y-6">
          {/* Active Error Test Runner */}
          {isTestRunning ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
              {!isTestFinished ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-950/80 text-red-300 border border-red-800/40">
                          🎯 Test d'Errors: {testAmbit === 'tots' ? 'Tots els àmbits' : testAmbit}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          testMode === 'superacio' 
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40' 
                            : 'bg-sky-950/80 text-sky-300 border border-sky-800/40'
                        }`}>
                          {testMode === 'superacio' ? '🗑️ Superació (s\'esborra en encertar)' : '🔁 Només repàs (no s\'esborra)'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-mono">
                        Pregunta {testCurrentIndex + 1} de {testQuestionsList.length} · Encerts: <b className="text-emerald-400">{testScore.correct}</b> · Errors: <b className="text-red-400">{testScore.wrong}</b>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleExitTest}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      ✕ Abandonar test
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-300"
                      style={{ width: `${Math.round(((testCurrentIndex + 1) / testQuestionsList.length) * 100)}%` }}
                    />
                  </div>

                  {testQuestionsList[testCurrentIndex] && (
                    <QuestionCard
                      key={`test_q_${testQuestionsList[testCurrentIndex].id}_${testCurrentIndex}`}
                      question={testQuestionsList[testCurrentIndex]}
                      onAnswerSelected={handleTestAnswerSelected}
                      onSaveToggle={onToggleSaveQuestion}
                      isSaved={user.savedQuestionIds?.includes(testQuestionsList[testCurrentIndex].id)}
                      onNext={handleTestNextQuestion}
                      nextButtonLabel={testCurrentIndex < testQuestionsList.length - 1 ? 'Següent Pregunta ➔' : 'Finalitzar i Veure Resultats ➔'}
                      mistakeCount={user.questionMistakesCount?.[testQuestionsList[testCurrentIndex].id] || 1}
                    />
                  )}
                </>
              ) : (
                /* Test Finished Screen */
                <div className="py-8 px-4 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto text-2xl font-black">
                    🏆
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Test d'Errors Completat!</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      Has respost totes les preguntes d'aquesta sessió de repàs d'errors.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total</div>
                      <div className="text-lg font-black text-white mt-0.5">{testQuestionsList.length}</div>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Encerts</div>
                      <div className="text-lg font-black text-emerald-400 mt-0.5">{testScore.correct}</div>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl col-span-2 sm:col-span-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Errors</div>
                      <div className="text-lg font-black text-red-400 mt-0.5">{testScore.wrong}</div>
                    </div>
                  </div>

                  {testMode === 'superacio' && testScore.removedCount > 0 && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl max-w-md mx-auto text-xs text-emerald-300 font-bold">
                      ✓ Has netejat {testScore.removedCount} {testScore.removedCount === 1 ? 'pregunta' : 'preguntes'} del teu sac d'errors pendents!
                    </div>
                  )}

                  {testMode === 'repas' && (
                    <div className="p-3 bg-sky-950/40 border border-sky-500/40 rounded-2xl max-w-md mx-auto text-xs text-sky-300">
                      ℹ️ Mode només repàs: Cap pregunta ha estat eliminada de la llista per permetre't continuar entrenant-les.
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleStartErrorTest}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Repetir aquest test</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExitTest}
                      className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-extrabold rounded-xl shadow-lg cursor-pointer transition-all"
                    >
                      Tornar a la llista d'errors
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Test Configuration & Launcher Card */
            failedQuestions.length > 0 && (
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/30 border border-red-900/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                      <Play className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        Simulacre Personalitzat d'Errors
                      </h3>
                      <p className="text-xs text-slate-400">
                        Posa't a prova només amb les preguntes fallades: tria àmbit i mode d'eliminació.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartErrorTest}
                    disabled={getAmbitFailedCount(testAmbit) === 0}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 cursor-pointer transition-all active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Començar Test ({getAmbitFailedCount(testAmbit)} preguntes)</span>
                  </button>
                </div>

                {/* Filters & Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
                  {/* Selector d'Àmbit */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-red-400" />
                      <span>Filtrar per Àmbit:</span>
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {availableAmbitsForFailed.map((amb) => {
                        const count = getAmbitFailedCount(amb);
                        const isSelected = testAmbit === amb;
                        return (
                          <button
                            key={amb}
                            type="button"
                            onClick={() => setTestAmbit(amb)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                                : 'bg-slate-800/90 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                            }`}
                          >
                            <span>{amb === 'tots' ? 'Tots els àmbits' : amb}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                              isSelected ? 'bg-red-800 text-white' : 'bg-slate-900 text-slate-400'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selector de Mode (2 opcions) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Mode d'esborrat en encertar:</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTestMode('superacio')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          testMode === 'superacio'
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-500/10'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-850'
                        }`}
                      >
                        <div className="font-extrabold text-xs flex items-center gap-1.5 text-white">
                          <span>🗑️ Si contestes bé s'esborra</span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1">
                          Es treu de la llista d'errors en encertar.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTestMode('repas')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          testMode === 'repas'
                            ? 'bg-sky-950/60 border-sky-500 text-sky-200 shadow-md shadow-sky-500/10'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-850'
                        }`}
                      >
                        <div className="font-extrabold text-xs flex items-center gap-1.5 text-white">
                          <span>🔁 Només repàs (no s'esborra)</span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1">
                          Es manté a la llista d'errors per seguir practicant.
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Llista de preguntes individuals */}
          {!isTestRunning && (
            <>
              <div className="flex items-center justify-between pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Totes les preguntes fallades ({failedQuestions.length})
                </h4>
              </div>

              {failedQuestions.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 animate-bounce" />
                  <h3 className="text-lg font-black text-white">Excel·lent! No tens cap error pendent de repassar</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    Totes les preguntes que fallis al Tauler de l'Oca o als Duels 1v1 s'afegiran automàticament aquí perquè puguis reforçar el temari fins a dominar-les.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {failedQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="bg-slate-900 border border-red-900/40 hover:border-red-600/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                          <span className="font-extrabold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/40">
                            {q.ambit}
                          </span>
                          {q.guiaPagina && (
                            <span className="text-amber-400/90 font-mono text-[11px]">
                              {q.guiaPagina}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white mb-2 line-clamp-3">
                          {q.pregunta}
                        </h4>
                        <p className="text-xs text-slate-400 bg-slate-800/50 p-2.5 rounded-xl border border-slate-800 italic line-clamp-2">
                          💡 {q.explicacio}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setActivePracticeQuestion(q)}
                          className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl text-center cursor-pointer transition-colors"
                        >
                          Repassar ara
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveFailedQuestion(q.id)}
                          title="Marcar com a apresa i eliminar de fallades"
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 rounded-xl transition-colors cursor-pointer border border-slate-700"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 2: Bookmarked Questions */}
      {subTab === 'guardades' && !activePracticeQuestion && (
        <div className="space-y-4">
          {savedQuestions.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
              <BookmarkCheck className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h3 className="text-lg font-black text-white">No tens preguntes guardades a favorits</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Fes clic a la icona de marcapàgines en qualsevol pregunta per guardar-la i repassar-la amb tranquil·litat abans de l'examen.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedQuestions.map((q) => (
                <div
                  key={q.id}
                  className="bg-slate-900 border border-amber-900/40 hover:border-amber-600/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                      <span className="font-extrabold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                        {q.ambit} ({q.seccio})
                      </span>
                      {q.guiaPagina && (
                        <span className="text-sky-400 font-mono text-[11px]">
                          {q.guiaPagina}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white mb-2 line-clamp-3">
                      {q.pregunta}
                    </h4>
                    <p className="text-xs text-slate-300 bg-slate-800/50 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
                      💡 {q.explicacio}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActivePracticeQuestion(q)}
                      className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl text-center cursor-pointer transition-colors"
                    >
                      Practicar pregunta
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleSaveQuestion(q.id)}
                      title="Treure de guardades"
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 rounded-xl transition-colors cursor-pointer border border-slate-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2.5: Saved Rules & Traps (Regles i Trampes Guardades) */}
      {subTab === 'regles_guardades' && (
        <div className="space-y-6">
          {totalSavedRules === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
              <Star className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h3 className="text-lg font-black text-white">No tens regles o conceptes trampa guardats a favorits</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Prem el botó de l'estrella ⭐ a la secció de <b>Conceptes Trampa</b> o <b>Regles Mnemotècniques</b> per guardar les fitxes clau que vulguis repassar abans del dia de l'examen oficial.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Saved Mnemonic Cards */}
              {savedMnemonics.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-sky-400 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    <span>Regles Mnemotècniques Preferides ({savedMnemonics.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedMnemonics.map((card) => (
                      <div
                        key={card.id}
                        className="bg-slate-900 border border-sky-500/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="text-sm font-black text-white">{card.titol}</h4>
                            {onToggleSaveMnemonic && (
                              <button
                                onClick={() => onToggleSaveMnemonic(card.id)}
                                title="Treure de favorits"
                                className="text-amber-400 hover:text-red-400 p-1 rounded hover:bg-slate-800 cursor-pointer"
                              >
                                <Star className="w-4 h-4 fill-amber-400" />
                              </button>
                            )}
                          </div>
                          <div className="px-3 py-2 bg-sky-950/50 border border-sky-500/30 rounded-xl text-xs font-extrabold text-sky-300 mb-3">
                            {card.regla}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {card.detall}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-sky-400 font-mono">
                          ★ Fitxa guardada a la teva memòria
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Saved Confusion Concepts */}
              {savedConfusions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-purple-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Conceptes Trampa / Anti-Confusió Preferits ({savedConfusions.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {savedConfusions.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-900 border border-purple-500/40 rounded-2xl p-5 shadow-lg space-y-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-xs">⚡</span>
                            <h4 className="text-sm font-extrabold text-white">{item.titol}</h4>
                            <span className="text-[11px] text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">{item.ambit}</span>
                          </div>
                          {onToggleSaveMnemonic && (
                            <button
                              onClick={() => onToggleSaveMnemonic(item.id)}
                              title="Treure de favorits"
                              className="text-amber-400 hover:text-red-400 p-1 rounded hover:bg-slate-800 cursor-pointer"
                            >
                              <Star className="w-4 h-4 fill-amber-400" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5">
                            <h5 className="text-xs font-black text-sky-400 mb-1.5">{item.concepteA.nom}</h5>
                            <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4 mb-2">
                              {item.concepteA.caracteristiques.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                            <div className="p-2 bg-sky-950/60 border border-sky-800 rounded-lg text-[11px] text-sky-200">
                              <b>⚠️ Parany:</b> {item.concepteA.trampaExamen}
                            </div>
                          </div>

                          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5">
                            <h5 className="text-xs font-black text-amber-400 mb-1.5">{item.concepteB.nom}</h5>
                            <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4 mb-2">
                              {item.concepteB.caracteristiques.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                            <div className="p-2 bg-amber-950/60 border border-amber-800 rounded-lg text-[11px] text-amber-200">
                              <b>⚠️ Parany:</b> {item.concepteB.trampaExamen}
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-gradient-to-r from-purple-950/50 to-indigo-950/50 border border-purple-500/40 rounded-xl text-xs text-purple-200 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                          <span><b>Regla 1 segon:</b> {item.reglaMnemotecnica}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Anti-Confusion Concepts (Tribunal Traps) */}
      {subTab === 'confusions' && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-950/40 border border-purple-800/40 rounded-2xl text-xs text-purple-200">
            <b>💡 Taula d'Atenció al Detall:</b> Aquí trobes les distincions conceptuals exactes on més aspirants fallen a les proves oficials dels Mossos d'Esquadra i Policia Local. Fes clic a l'estrella ⭐ per guardar la fitxa a favorits.
          </div>

          <div className="space-y-3">
            {CONFUSION_CONCEPTS.map((item) => {
              const isExpanded = expandedConfusionId === item.id;
              const isSaved = savedMnemonicIds.includes(item.id);

              return (
                <div 
                  key={item.id}
                  className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all ${
                    isSaved ? 'border-amber-500/40' : 'border-slate-800'
                  }`}
                >
                  <div className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors">
                    <button
                      type="button"
                      onClick={() => setExpandedConfusionId(isExpanded ? null : item.id)}
                      className="flex-1 flex items-center gap-3 cursor-pointer text-left"
                    >
                      <span className="p-2 bg-purple-500/20 text-purple-400 rounded-xl text-sm font-bold">
                        ⚡
                      </span>
                      <div>
                        <h4 className="text-sm sm:text-base font-extrabold text-white">
                          {item.titol}
                        </h4>
                        <span className="text-xs text-slate-400 font-medium">
                          {item.ambit}
                        </span>
                      </div>
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {onToggleSaveMnemonic && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSaveMnemonic(item.id);
                          }}
                          title={isSaved ? 'Treure de favorits' : 'Guardar a favorits'}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          <Star className={`w-4 h-4 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setExpandedConfusionId(isExpanded ? null : item.id)}
                        className="p-1 text-slate-400 cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900/60 space-y-4 animate-in fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Concepte A */}
                        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
                          <h5 className="text-sm font-black text-sky-400 mb-2 pb-2 border-b border-slate-700">
                            {item.concepteA.nom}
                          </h5>
                          <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 mb-3">
                            {item.concepteA.caracteristiques.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                          <div className="p-2.5 bg-sky-950/60 border border-sky-800 rounded-xl text-[11px] text-sky-200">
                            <b>⚠️ Parany d'Examen:</b> {item.concepteA.trampaExamen}
                          </div>
                        </div>

                        {/* Concepte B */}
                        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
                          <h5 className="text-sm font-black text-amber-400 mb-2 pb-2 border-b border-slate-700">
                            {item.concepteB.nom}
                          </h5>
                          <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 mb-3">
                            {item.concepteB.caracteristiques.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                          <div className="p-2.5 bg-amber-950/60 border border-amber-800 rounded-xl text-[11px] text-amber-200">
                            <b>⚠️ Parany d'Examen:</b> {item.concepteB.trampaExamen}
                          </div>
                        </div>
                      </div>

                      {/* Regla Mnemotècnica */}
                      <div className="p-3.5 bg-gradient-to-r from-purple-950/50 to-indigo-950/50 border border-purple-500/40 rounded-xl text-xs text-purple-200 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-white">Com recordar-ho en 1 segon: </span>
                          <span>{item.reglaMnemotecnica}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Mnemonic Cards */}
      {subTab === 'mnemo' && (
        <div className="space-y-4">
          <div className="p-4 bg-sky-950/40 border border-sky-800/40 rounded-2xl text-xs text-sky-200">
            <b>🧠 Fitxes Mnemotècniques Oficials:</b> Fórmules i regles ràpides per fixar dades numèriques, terminis i estructures orgàniques clau de la Guia d'Estudi 2026. Prem l'estrella ⭐ per desar-les a la teva col·lecció.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MNEMONIC_CARDS.map((card, idx) => {
              const isSaved = savedMnemonicIds.includes(card.id);
              return (
                <div
                  key={card.id || idx}
                  className={`bg-slate-900 border rounded-2xl p-5 shadow-lg transition-all flex flex-col justify-between ${
                    isSaved ? 'border-amber-500/60 shadow-amber-500/10' : 'border-slate-800 hover:border-sky-500/50'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-black text-white">
                        {card.titol}
                      </h4>
                      {onToggleSaveMnemonic && (
                        <button
                          type="button"
                          onClick={() => onToggleSaveMnemonic(card.id)}
                          title={isSaved ? 'Treure de favorits' : 'Guardar a favorits'}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          <Star className={`w-4 h-4 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      )}
                    </div>
                    <div className="px-3 py-2 bg-sky-950/40 border border-sky-500/30 rounded-xl text-xs font-extrabold text-sky-300 mb-3">
                      {card.regla}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {card.detall}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono flex items-center justify-between">
                    <span>Regla Mnemotècnica #{idx + 1}</span>
                    {isSaved && <span className="text-amber-400 font-bold">★ Guardada</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
