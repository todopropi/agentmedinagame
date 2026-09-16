import React, { useState } from 'react';
import { Question, ReviewConceptItem } from '../types';
import { ConceptReviewCard } from './ConceptReviewCard';
import { 
  CheckCircle2, 
  XCircle, 
  Bookmark, 
  BookmarkCheck, 
  AlertTriangle, 
  BookOpen, 
  Sparkles, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  onAnswerSelected: (isCorrect: boolean) => void;
  onSaveToggle?: (questionId: string) => void;
  isSaved?: boolean;
  onNext?: () => void;
  nextButtonLabel?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onAnswerSelected,
  onSaveToggle,
  isSaved = false,
  onNext,
  nextButtonLabel = 'Continuar'
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedIndex(index);
    setIsAnswered(true);
    const isCorrect = index === question.resposta;
    onAnswerSelected(isCorrect);
  };

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
      {/* Top Header: Ambit Badge, Guia Page & Bookmark */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black uppercase px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            {question.ambit}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {question.seccio}
          </span>
          {question.guiaPagina && (
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>{question.guiaPagina}</span>
            </span>
          )}
        </div>

        {onSaveToggle && (
          <button
            type="button"
            onClick={() => onSaveToggle(question.id)}
            title={isSaved ? "Treure de preguntes guardades" : "Guardar pregunta per repassar"}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isSaved 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Question Text */}
      <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-6 leading-relaxed">
        {question.pregunta}
      </h3>

      {/* Options List */}
      <div className="space-y-3 mb-6">
        {question.opcions.map((opcio, idx) => {
          let btnStyle = "bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600";
          let icon = null;

          if (isAnswered) {
            if (idx === question.resposta) {
              btnStyle = "bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold";
              icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
            } else if (idx === selectedIndex) {
              btnStyle = "bg-red-950/60 border-red-500 text-red-200 font-semibold";
              icon = <XCircle className="w-5 h-5 text-red-400 shrink-0" />;
            } else {
              btnStyle = "bg-slate-900/50 border-slate-800/60 text-slate-500 opacity-60";
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isAnswered}
              onClick={() => handleSelect(idx)}
              className={`w-full p-3.5 sm:p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${btnStyle} ${
                !isAnswered ? 'active:scale-[0.99]' : ''
              }`}
            >
              <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${
                isAnswered && idx === question.resposta
                  ? 'bg-emerald-500 text-slate-950'
                  : isAnswered && idx === selectedIndex
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-700/60 text-slate-300'
              }`}>
                {optionLetters[idx]}
              </span>
              <span className="text-xs sm:text-sm flex-1 leading-snug">{opcio}</span>
              {icon}
            </button>
          );
        })}
      </div>

      {/* Educational Feedback after Answering */}
      {isAnswered && (
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-4">
          {/* Result & Official Explanation Banner */}
          <div className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 ${
            selectedIndex === question.resposta
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/40 border-red-500/50 text-red-200'
          }`}>
            {selectedIndex === question.resposta ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-1.5">
              <div className="font-extrabold text-sm flex items-center justify-between gap-2 flex-wrap">
                <span>{selectedIndex === question.resposta ? '✅ Resposta correcta!' : '❌ Resposta incorrecta'}</span>
                {(question.guiaPagina || question.guiaTema) && (
                  <span className="text-[11px] font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-lg border border-sky-800/60">
                    {question.guiaTema || question.seccio} {question.guiaPagina ? `• ${question.guiaPagina}` : ''}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-200 opacity-95 leading-relaxed pt-0.5">
                {question.explicacio}
              </p>
            </div>
          </div>

          {/* Quadre de Síntesi / Clau de Tribunal (Only when custom data or tribunal rule exists, with no repetition) */}
          {(question.quadreMemoritzar || question.clauTribunal) && (
            <ConceptReviewCard
              titol={question.quadreMemoritzar?.titol || question.seccio || 'Clau d\'Examen'}
              items={question.quadreMemoritzar?.items}
              reglaExamen={question.quadreMemoritzar?.reglaExamen || question.clauTribunal}
              isSaved={isSaved}
              onSaveToggle={onSaveToggle ? () => onSaveToggle(question.id) : undefined}
            />
          )}

          {/* Anti-Confusion Flashcard if applicable */}
          {question.confusionAlert && (
            <div className="p-3.5 sm:p-4 bg-purple-950/30 border border-purple-600/40 rounded-2xl text-xs text-purple-200 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-purple-300">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Recorda la diferència clau (Anti-Confusió):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-purple-900/50">
                  <b className="text-purple-300 block mb-0.5">{question.confusionAlert.conceptA}</b>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-purple-900/50">
                  <b className="text-purple-300 block mb-0.5">{question.confusionAlert.conceptB}</b>
                </div>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                {question.confusionAlert.explanation}
              </p>
            </div>
          )}

          {/* Next Button */}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-lg shadow-amber-500/25 cursor-pointer mt-4"
            >
              <span>{nextButtonLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
