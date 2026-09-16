import React from 'react';
import { Bookmark, BookmarkCheck, CheckCircle2, Clock } from 'lucide-react';
import { ReviewConceptItem } from '../types';

interface ConceptReviewCardProps {
  titol: string;
  items: ReviewConceptItem[];
  reglaExamen: string;
  onSaveToggle?: () => void;
  isSaved?: boolean;
}

export const ConceptReviewCard: React.FC<ConceptReviewCardProps> = ({
  titol,
  items,
  reglaExamen,
  onSaveToggle,
  isSaved = false
}) => {
  // Map color schemes for items following screenshot aesthetic (clean pastel tints with dark text & crisp borders)
  const getColorClasses = (color: ReviewConceptItem['color']) => {
    switch (color) {
      case 'blue':
        return 'bg-sky-100/95 text-sky-950 border-sky-300';
      case 'red':
        return 'bg-rose-100/95 text-rose-950 border-rose-300';
      case 'green':
        return 'bg-emerald-100/95 text-emerald-950 border-emerald-300';
      case 'yellow':
        return 'bg-amber-100/95 text-amber-950 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-900 border-slate-300';
    }
  };

  return (
    <div className="w-full bg-white text-slate-900 rounded-3xl p-4 sm:p-6 shadow-2xl border border-sky-400/30 my-4 space-y-3.5">
      {/* Header: Clock icon + Concept Title */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-600 shrink-0" />
          <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
            {titol}
          </h4>
        </div>

        {/* Badge: Quadre per memoritzar */}
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold border border-sky-300/80">
            Quadre per memoritzar
          </span>
        </div>
      </div>

      {/* Pastel Concept Item Boxes */}
      <div className="space-y-2.5">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`p-3 sm:p-3.5 rounded-2xl border ${getColorClasses(item.color)} text-xs sm:text-sm leading-relaxed`}
          >
            <span className="font-extrabold block text-[13px] sm:text-sm mb-0.5">
              {item.concepte}
            </span>
            <span className="font-medium text-slate-800">
              {item.detall}
            </span>
          </div>
        ))}
      </div>

      {/* "Com recordar per a l'examen" Box */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/90 border-l-4 border-l-amber-500 border border-amber-200 text-xs sm:text-sm leading-relaxed text-slate-900">
        <div className="flex items-center gap-2 font-black text-slate-900 mb-1">
          <span className="text-base">🧠</span>
          <span>Com recordar per a l'examen:</span>
        </div>
        <p className="text-slate-800 font-medium pl-6">
          {reglaExamen}
        </p>
      </div>

      {/* Dotted separator & Guardar Pregunta Button */}
      <div className="pt-2 border-t border-dashed border-slate-300 flex items-center justify-start">
        {onSaveToggle && (
          <button
            type="button"
            onClick={onSaveToggle}
            className={`py-2 px-4 rounded-xl border font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 ${
              isSaved
                ? 'bg-amber-100 text-amber-900 border-amber-400'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-4 h-4 text-amber-600" />
                <span>⭐ Pregunta Guardada</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 text-slate-500" />
                <span>⭐ Guardar pregunta</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
