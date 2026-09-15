import React, { useState } from 'react';
import { UserProfile, Question } from '../types';
import { QUESTIONS_BANK } from '../data/questionsBank';
import { CONFUSION_CONCEPTS, MNEMONIC_CARDS } from '../data/conceptsAndMistakes';
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
  ChevronUp
} from 'lucide-react';

interface SeccioRepasProps {
  user: UserProfile;
  onRemoveFailedQuestion: (questionId: string) => void;
  onToggleSaveQuestion: (questionId: string) => void;
  onUpdateStats: (xpGained: number, meritsGained: number) => void;
}

export const SeccioRepas: React.FC<SeccioRepasProps> = ({
  user,
  onRemoveFailedQuestion,
  onToggleSaveQuestion,
  onUpdateStats
}) => {
  const [subTab, setSubTab] = useState<'fallades' | 'guardades' | 'confusions' | 'mnemo'>('fallades');
  const [activePracticeQuestion, setActivePracticeQuestion] = useState<Question | null>(null);
  const [expandedConfusionId, setExpandedConfusionId] = useState<string | null>(CONFUSION_CONCEPTS[0].id);

  // Get failed and saved questions
  const failedQuestions = QUESTIONS_BANK.filter(q => user.failedQuestionIds?.includes(q.id));
  const savedQuestions = QUESTIONS_BANK.filter(q => user.savedQuestionIds?.includes(q.id));

  const handlePracticeOutcome = (isCorrect: boolean) => {
    if (!activePracticeQuestion) return;
    if (isCorrect) {
      onRemoveFailedQuestion(activePracticeQuestion.id);
      onUpdateStats(15, 10);
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
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto no-scrollbar pt-2 border-t border-slate-800">
          <button
            onClick={() => { setSubTab('fallades'); setActivePracticeQuestion(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
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
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'guardades'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Preguntes Guardades ({savedQuestions.length})</span>
          </button>

          <button
            onClick={() => { setSubTab('confusions'); setActivePracticeQuestion(null); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
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
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'mnemo'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Regles Mnemotècniques Clau</span>
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
          />
        </div>
      )}

      {/* TAB 1: Failed Questions Tracker */}
      {subTab === 'fallades' && !activePracticeQuestion && (
        <div className="space-y-4">
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

      {/* TAB 3: Anti-Confusion Concepts (Tribunal Traps) */}
      {subTab === 'confusions' && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-950/40 border border-purple-800/40 rounded-2xl text-xs text-purple-200">
            <b>💡 Taula d'Atenció al Detall:</b> Aquí trobes les distincions conceptuals exactes on més aspirants fallen a les proves oficials dels Mossos d'Esquadra i Policia Local.
          </div>

          <div className="space-y-3">
            {CONFUSION_CONCEPTS.map((item) => {
              const isExpanded = expandedConfusionId === item.id;

              return (
                <div 
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedConfusionId(isExpanded ? null : item.id)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
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
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MNEMONIC_CARDS.map((card, idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-5 shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <h4 className="text-sm font-black text-white mb-2">
                  {card.titol}
                </h4>
                <div className="px-3 py-2 bg-sky-950/40 border border-sky-500/30 rounded-xl text-xs font-extrabold text-sky-300 mb-3">
                  {card.regla}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {card.detall}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
                Regla Mnemotècnica #{idx + 1} per opositors
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
