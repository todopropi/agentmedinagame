import React, { useState, useEffect } from 'react';
import { PLMunicipi, PLExamScore } from '../../types/policiaLocal';
import { UserProfile } from '../../types';
import { savePLExamScore } from '../../services/policiaLocalService';
import { AudioEngine } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { 
  X, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Save, 
  Calendar, 
  FileText, 
  Scale, 
  Sparkles 
} from 'lucide-react';

interface PLExamScoreModalProps {
  municipi: PLMunicipi;
  user: UserProfile;
  existingScore?: PLExamScore | null;
  onClose: () => void;
  onSaved: (savedScore: PLExamScore) => void;
}

export const PLExamScoreModal: React.FC<PLExamScoreModalProps> = ({
  municipi,
  user,
  existingScore,
  onClose,
  onSaved
}) => {
  const [culturaScore, setCulturaScore] = useState<string>(
    existingScore ? existingScore.cultura_score.toString() : ''
  );
  const [temariScore, setTemariScore] = useState<string>(
    existingScore ? existingScore.temari_score.toString() : ''
  );
  const [notes, setNotes] = useState<string>(existingScore?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const cWeight = municipi.cultura_weight ?? 50;
  const tWeight = municipi.temari_weight ?? 50;

  // Càlcul automàtic de la nota final ponderada
  const numCultura = parseFloat(culturaScore);
  const numTemari = parseFloat(temariScore);

  const hasValidScores = !isNaN(numCultura) && !isNaN(numTemari) && 
    numCultura >= 0 && numCultura <= 10 && numTemari >= 0 && numTemari <= 10;

  const calculatedTotal = hasValidScores
    ? Number(((numCultura * (cWeight / 100)) + (numTemari * (tWeight / 100))).toFixed(2))
    : null;

  const isPassed = calculatedTotal !== null ? calculatedTotal >= 5.0 : false;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasValidScores || calculatedTotal === null) return;

    setIsSaving(true);
    const payload: PLExamScore = {
      id: existingScore?.id || `${user.uid}_${municipi.id}`,
      user_id: user.uid,
      municipi_id: municipi.id,
      cultura_score: numCultura,
      temari_score: numTemari,
      total_score: calculatedTotal,
      is_passed: isPassed,
      exam_date: municipi.exam_date || new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined,
      created_at: existingScore?.created_at || new Date().toISOString()
    };

    const saved = await savePLExamScore(payload);
    setIsSaving(false);

    if (saved) {
      if (isPassed) {
        AudioEngine.playFanfare();
        try {
          confetti({
            particleCount: 50,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch {}
      } else {
        AudioEngine.playClick();
      }
      onSaved(saved);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-sky-500/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto">
        
        {/* HEADER */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block">
                EXPEDIENT I NOTA D'EXAMEN
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {municipi.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* FORMULARI */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5">
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Ponderació Oficial:</span>
            </div>
            <div className="font-mono font-bold text-slate-200">
              Cultura <span className="text-amber-400">{cWeight}%</span> · Temari <span className="text-sky-400">{tWeight}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* NOTA CULTURA GENERAL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                1. Nota Cultura General (0 a 10)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                required
                value={culturaScore}
                onChange={e => setCulturaScore(e.target.value)}
                placeholder="Ex: 6.75"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-base focus:border-sky-500 focus:outline-none transition-all"
              />
              <span className="text-[10px] text-slate-500">Puntuació obtinguda al test de cultura</span>
            </div>

            {/* NOTA TEMARI ESPECÍFIC */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                2. Nota Temari (0 a 10)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                required
                value={temariScore}
                onChange={e => setTemariScore(e.target.value)}
                placeholder="Ex: 7.20"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-base focus:border-sky-500 focus:outline-none transition-all"
              />
              <span className="text-[10px] text-slate-500">Puntuació obtinguda al test del temari</span>
            </div>
          </div>

          {/* OBSERVACIONS / NOTES OPCIONALS */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Observacions o detalls de la convocatòria (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Convocatòria 4 places, tribunal 1, oposició lliure..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-sky-500 focus:outline-none transition-all"
            />
          </div>

          {/* RESUM DE QUALIFICACIÓ I APTE / NO APTE */}
          {hasValidScores && calculatedTotal !== null && (
            <div className={`p-4 rounded-2xl border text-center space-y-1.5 transition-all ${
              isPassed 
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
            }`}>
              <span className="text-[10px] font-black uppercase tracking-wider block">
                SUMATORI I NOTA FINAL PONDERADA
              </span>
              <div className="text-3xl font-black font-mono">
                {calculatedTotal.toFixed(2)} <span className="text-xs font-normal opacity-80">/ 10</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-950/60 border border-current">
                {isPassed ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>QUALIFICACIÓ: APTE (Mínim 5,00)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>QUALIFICACIÓ: NO APTE (Menys de 5,00)</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* BOTONS D'ACCIÓ */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel·lar
            </button>
            <button
              type="submit"
              disabled={!hasValidScores || isSaving}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                hasValidScores && !isSaving
                  ? 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardant...' : 'Desar Nota'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
