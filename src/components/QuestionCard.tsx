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
  onAnswerSelected: (isCorrect: boolean, selectedIndex?: number) => void;
  onSaveToggle?: (questionId: string) => void;
  onImpugnar?: (question: Question) => void;
  isSaved?: boolean;
  onNext?: () => void;
  nextButtonLabel?: string;
  onNextDirect?: () => void;
  nextDirectLabel?: string;
  onUseWildcard?: () => boolean | void;
  wildcardsCount?: number;
  userMerits?: number;
  initialSelectedIndex?: number | null;
  initialIsAnswered?: boolean;
  initialDisabledIndices?: number[];
  mistakeCount?: number;
}

export function checkIsCorrectAnswer(question: Question, selectedIndex: number | null | undefined): boolean {
  if (selectedIndex === null || selectedIndex === undefined || selectedIndex < 0) {
    return false;
  }

  // 1. Numeric match
  if (Number(selectedIndex) === Number(question.resposta)) {
    return true;
  }

  // 2. String equality
  if (String(selectedIndex).trim() === String(question.resposta).trim()) {
    return true;
  }

  // 3. Option letter match: 'A' -> 0, 'B' -> 1, 'C' -> 2, 'D' -> 3
  const letters = ['a', 'b', 'c', 'd'];
  const respostaStr = String(question.resposta ?? '').trim().toLowerCase();
  const letterIdx = letters.indexOf(respostaStr);
  if (letterIdx !== -1 && letterIdx === selectedIndex) {
    return true;
  }

  // 4. Option text match
  if (question.opcions && question.opcions[selectedIndex]) {
    const chosenText = String(question.opcions[selectedIndex]).trim().toLowerCase();
    const correctText = String(question.resposta).trim().toLowerCase();
    if (chosenText === correctText) {
      return true;
    }
  }

  return false;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onAnswerSelected,
  onSaveToggle,
  onImpugnar,
  isSaved = false,
  onNext,
  nextButtonLabel = 'Continuar',
  onNextDirect,
  nextDirectLabel = 'Següent Pregunta Directa ➔',
  onUseWildcard,
  wildcardsCount = 0,
  userMerits = 0,
  initialSelectedIndex = null,
  initialIsAnswered = false,
  initialDisabledIndices = [],
  mistakeCount = 0
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(initialSelectedIndex);
  const [isAnswered, setIsAnswered] = useState(initialIsAnswered);
  const [disabledIndices, setDisabledIndices] = useState<number[]>(initialDisabledIndices);

  const prevQuestionIdRef = React.useRef(question.id);

  // Barrejador aleatori d'opcions: garanteix que les respostes MAI segueixin el mateix ordre
  // i que la resposta correcta quedi distribuïda equitativament entre A, B, C i D
  const shuffledOptions = React.useMemo(() => {
    const rawList = question.opcions || [];
    const items = rawList.map((text, origIdx) => ({
      originalIndex: origIdx,
      text,
      isCorrect: checkIsCorrectAnswer(question, origIdx)
    }));

    // Algorisme Fisher-Yates per a una barreja aleatòria uniforme
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    return items;
  }, [question.id]);

  // Re-sync if question changes or if restored from parent
  React.useEffect(() => {
    if (prevQuestionIdRef.current !== question.id) {
      prevQuestionIdRef.current = question.id;
      setSelectedIndex(initialSelectedIndex ?? null);
      setIsAnswered(Boolean(initialIsAnswered));
      setDisabledIndices(initialDisabledIndices || []);
    } else {
      if (selectedIndex === null && initialSelectedIndex !== null && initialSelectedIndex !== undefined) {
        setSelectedIndex(initialSelectedIndex);
      }
      if (!isAnswered && initialIsAnswered) {
        setIsAnswered(true);
      }
      if (initialDisabledIndices && initialDisabledIndices.length > 0 && disabledIndices.length === 0) {
        setDisabledIndices(initialDisabledIndices);
      }
    }
  }, [question.id, initialSelectedIndex, initialIsAnswered, initialDisabledIndices]);

  const isOptionCorrect = (displayIdx: number) => {
    return Boolean(shuffledOptions[displayIdx]?.isCorrect);
  };

  const isUserChoiceCorrect = selectedIndex !== null && selectedIndex !== undefined && isOptionCorrect(selectedIndex);

  const handleUseWildcardInternal = () => {
    if (isAnswered || disabledIndices.length > 0) return;
    if (onUseWildcard) {
      const allowed = onUseWildcard();
      if (allowed === false) return;
    }
    // Descartar 2 opcions incorrectes de les que estan en pantalla
    const wrongDisplayIndices = shuffledOptions
      .map((opt, idx) => ({ idx, isCorrect: opt.isCorrect }))
      .filter(o => !o.isCorrect)
      .map(o => o.idx);
    const shuffledWrong = wrongDisplayIndices.sort(() => 0.5 - Math.random());
    setDisabledIndices(shuffledWrong.slice(0, 2));
  };

  const handleSelect = (displayIdx: number) => {
    if (isAnswered || disabledIndices.includes(displayIdx)) return;
    setSelectedIndex(displayIdx);
    setIsAnswered(true);
    const isCorrect = isOptionCorrect(displayIdx);
    onAnswerSelected(isCorrect, displayIdx);
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
          {mistakeCount > 0 && (
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Has fallat aquesta pregunta {mistakeCount} {mistakeCount === 1 ? 'vegada' : 'vegades'}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (onImpugnar) onImpugnar(question);
              else window.dispatchEvent(new CustomEvent('open_impugnar_modal', { detail: question }));
            }}
            title="Impugnar o notificar errada a l'equip docent"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/50 transition-all cursor-pointer flex items-center gap-1 text-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden sm:inline text-[11px] font-bold">Impugnar</span>
          </button>

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
      </div>

      {/* Comodí 50% button and question header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-xs font-semibold text-slate-400">
          Tria l'opció correcta:
        </div>

        {!isAnswered && (
          <button
            type="button"
            onClick={handleUseWildcardInternal}
            disabled={disabledIndices.length > 0}
            title="Descarta 2 respostes incorrectes (10 Mèrits o 1 Comodí)"
            className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Comodí 50%</span>
            {wildcardsCount > 0 ? (
              <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black">
                {wildcardsCount}
              </span>
            ) : (
              <span className="text-[10px] text-amber-400 font-mono font-bold">
                (10 mèrits)
              </span>
            )}
          </button>
        )}
      </div>

      {/* Question Text */}
      <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-6 leading-relaxed">
        {question.pregunta}
      </h3>

      {/* Options List */}
      <div className="space-y-3 mb-6">
        {shuffledOptions.map((opt, displayIdx) => {
          const isDisabledByWildcard = disabledIndices.includes(displayIdx);
          let btnStyle = "bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600";
          let icon = null;

          if (isDisabledByWildcard && !isAnswered) {
            btnStyle = "bg-slate-900/40 border-slate-800/40 text-slate-600 line-through opacity-35 cursor-not-allowed";
          } else if (isAnswered) {
            const isThisOptionCorrect = opt.isCorrect;
            const isThisOptionSelected = displayIdx === selectedIndex;
            if (isThisOptionCorrect) {
              btnStyle = "bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold";
              icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
            } else if (isThisOptionSelected) {
              btnStyle = "bg-red-950/60 border-red-500 text-red-200 font-semibold";
              icon = <XCircle className="w-5 h-5 text-red-400 shrink-0" />;
            } else {
              btnStyle = "bg-slate-900/50 border-slate-800/60 text-slate-500 opacity-60";
            }
          }

          return (
            <button
              key={`${question.id}_opt_${displayIdx}`}
              type="button"
              disabled={isAnswered || isDisabledByWildcard}
              onClick={() => handleSelect(displayIdx)}
              className={`w-full p-3.5 sm:p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${btnStyle} ${
                !isAnswered && !isDisabledByWildcard ? 'active:scale-[0.99]' : ''
              }`}
            >
              <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${
                isAnswered && opt.isCorrect
                  ? 'bg-emerald-500 text-slate-950'
                  : isAnswered && displayIdx === selectedIndex
                  ? 'bg-red-500 text-white'
                  : isDisabledByWildcard
                  ? 'bg-slate-800 text-slate-600'
                  : 'bg-slate-700/60 text-slate-300'
              }`}>
                {optionLetters[displayIdx]}
              </span>
              <span className="text-xs sm:text-sm flex-1 leading-snug">{opt.text}</span>
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
            isUserChoiceCorrect
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/40 border-red-500/50 text-red-200'
          }`}>
            {isUserChoiceCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-1.5">
              <div className="font-extrabold text-sm flex items-center justify-between gap-2 flex-wrap">
                <span>{isUserChoiceCorrect ? '✅ Resposta correcta!' : '❌ Resposta incorrecta'}</span>
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

          {/* Next Action Buttons: Direct Consecutive Question vs Board Overview */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-4">
            {onNextDirect && (
              <button
                type="button"
                onClick={onNextDirect}
                className="w-full flex-1 py-3 px-4 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-lg shadow-sky-500/25 cursor-pointer min-h-[44px]"
              >
                <span>{nextDirectLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {onNext && (
              <button
                type="button"
                onClick={onNext}
                className={`py-3 px-4 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer min-h-[44px] ${
                  onNextDirect
                    ? 'w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    : 'w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                }`}
              >
                <span>{nextButtonLabel}</span>
                {!onNextDirect && <ArrowRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
