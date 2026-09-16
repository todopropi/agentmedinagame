import React from 'react';
import { Bookmark, BookmarkCheck, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';
import { ReviewConceptItem } from '../types';

interface ConceptReviewCardProps {
  titol: string;
  items?: ReviewConceptItem[];
  reglaExamen?: string;
  onSaveToggle?: () => void;
  isSaved?: boolean;
}

export const ConceptReviewCard: React.FC<ConceptReviewCardProps> = ({
  titol,
  items = [],
  reglaExamen,
  onSaveToggle,
  isSaved = false
}) => {
  // Map color schemes for dark police tactical design
  const getItemClasses = (color: ReviewConceptItem['color']) => {
    switch (color) {
      case 'blue':
        return 'border-l-sky-500 bg-sky-950/30 text-sky-200 border-slate-800';
      case 'red':
        return 'border-l-rose-500 bg-rose-950/30 text-rose-200 border-slate-800';
      case 'green':
        return 'border-l-emerald-500 bg-emerald-950/30 text-emerald-200 border-slate-800';
      case 'yellow':
        return 'border-l-amber-500 bg-amber-950/30 text-amber-200 border-slate-800';
      default:
        return 'border-l-slate-500 bg-slate-900/60 text-slate-300 border-slate-800';
    }
  };

  return (
    <div className="w-full bg-[#0b1220] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5 my-3">
      {/* Header: Topic Title & Badge */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/25 shrink-0">
            <BookOpen className="w-4 h-4" />
          </span>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block">
              Guia d'Estudi • Síntesi de Repàs
            </span>
            <h4 className="text-sm sm:text-base font-black text-white truncate max-w-sm sm:max-w-md">
              {titol}
            </h4>
          </div>
        </div>

        {onSaveToggle && (
          <button
            type="button"
            onClick={onSaveToggle}
            className={`py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isSaved
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Guardada</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                <span>Guardar</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Concept Item Boxes */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border-l-4 border text-xs sm:text-sm leading-relaxed ${getItemClasses(item.color)}`}
            >
              <div className="font-black text-white text-xs mb-0.5 flex items-center gap-1.5">
                <span>{item.concepte}</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed font-medium">
                {item.detall}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Regla d'Examen Box */}
      {reglaExamen && (
        <div className="p-3 sm:p-3.5 rounded-xl bg-amber-950/25 border border-amber-500/30 text-xs leading-relaxed">
          <div className="flex items-center gap-1.5 font-black text-amber-300 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Clau pel Tribunal d'Oposicions:</span>
          </div>
          <p className="text-slate-300 text-xs pl-5 border-l-2 border-amber-500/50 font-medium">
            {reglaExamen}
          </p>
        </div>
      )}
    </div>
  );
};
