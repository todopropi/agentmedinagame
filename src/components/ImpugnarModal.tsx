import React, { useState } from 'react';
import { Question, UserProfile } from '../types';
import { submitQuestionReport } from '../../supabase';
import { AlertTriangle, Send, X, CheckCircle, ShieldAlert } from 'lucide-react';

interface ImpugnarModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
  currentUser: UserProfile | null;
}

export const ImpugnarModal: React.FC<ImpugnarModalProps> = ({
  isOpen,
  onClose,
  question,
  currentUser
}) => {
  const [reason, setReason] = useState<string>('Redactat ambigu o errada al text');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen || !question) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setSubmitting(true);
      setFeedback(null);

      const res = await submitQuestionReport({
        questionId: question.id,
        questionText: question.pregunta,
        ambit: question.ambit,
        reportedByUid: currentUser.uid,
        reportedByName: currentUser.displayName || 'Aspirant',
        reportedByEmail: currentUser.email || '',
        reason,
        details: details.trim()
      });

      if (res.success) {
        setFeedback({ type: 'success', message: 'Impugnació registrada correctament! L\'equip docent la revisarà.' });
        setTimeout(() => {
          onClose();
          setFeedback(null);
          setDetails('');
        }, 1800);
      } else {
        setFeedback({ type: 'error', message: res.message || 'Error en enviar la impugnació.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Error en registrar la impugnació.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Capçalera */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Impugnar Pregunta
              </h3>
              <p className="text-xs text-slate-400">
                Notifica una possible errada o canvi segons la Guia Oficial 2026
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedback && (
          <div className={`mt-4 p-3.5 rounded-xl flex items-center gap-2 text-sm border ${
            feedback.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Caixa de resum de la pregunta */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
              <span>{question.ambit}</span>
              {question.seccio && <span>• {question.seccio}</span>}
              <span className="text-slate-500 ml-auto font-mono text-[10px]">{question.id}</span>
            </div>
            <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
              "{question.pregunta}"
            </p>
          </div>

          {/* Motiu de la impugnació */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Motiu principal
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="Redactat ambigu o errada al text">Redactat ambigu o errada al text</option>
              <option value="La resposta marcada com a correcta és errònia">La resposta marcada com a correcta és errònia</option>
              <option value="Canvi normatiu o guia oficial 2026">Canvi normatiu o guia oficial 2026</option>
              <option value="Hi ha més d'una resposta correcta">Hi ha més d'una resposta correcta</option>
              <option value="Cap de les respostes és correcta">Cap de les respostes és correcta</option>
              <option value="Altres motius">Altres motius</option>
            </select>
          </div>

          {/* Detall opcional */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Explicació o referència (article / pàgina de la guia)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Ex: Segons la pàgina 45 del tema 3 de la Guia 2026, el termini és de 48h i no de 24h..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Botons d'acció */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel·lar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Enviant...' : 'Enviar Impugnació'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
