import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { 
  OFFICIAL_PHYSICAL_TABLE, 
  calculatePressBancaPoints, 
  calculateCircuitPoints, 
  calculateCourseNavettePoints,
  evaluateGlobalFitness
} from '../../utils/physicalScoring';
import { 
  getPhysicalRecords, 
  getBestScores, 
  deletePhysicalRecord, 
  fetchPhysicalDataFromCloud,
  PhysicalScoreRecord 
} from '../../utils/physicalStorage';
import { 
  Award, 
  BarChart2, 
  TrendingUp, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Filter, 
  Dumbbell, 
  Zap, 
  Activity, 
  Sparkles,
  Info
} from 'lucide-react';

interface EstadistiquesFisiquesViewProps {
  user: UserProfile;
}

export const EstadistiquesFisiquesView: React.FC<EstadistiquesFisiquesViewProps> = ({ user }) => {
  const [records, setRecords] = useState<PhysicalScoreRecord[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'PB' | 'CA' | 'CL'>('ALL');
  
  // Valors per al simulador interactiu de nota
  const [simPB, setSimPB] = useState<number>(31);
  const [simCA, setSimCA] = useState<number>(18.4);
  const [simCL, setSimCL] = useState<number>(9.5);

  const loadData = () => {
    const list = getPhysicalRecords(user.uid || user.email, user.email);
    setRecords(list);

    const currentBests = getBestScores(user.uid || user.email, user.email);
    if (currentBests.pb) setSimPB(currentBests.pb.rawScore);
    if (currentBests.ca) setSimCA(currentBests.ca.rawScore);
    if (currentBests.cl) setSimCL(currentBests.cl.rawScore);

    // Descarregar del servidor per garantir que si l'usuari és al mòbil té totes les dades
    fetchPhysicalDataFromCloud(user.uid, user.email).then(data => {
      if (data && Array.isArray(data.records)) {
        setRecords(data.records);
        const updatedBests = getBestScores(user.uid || user.email, user.email);
        if (updatedBests.pb) setSimPB(updatedBests.pb.rawScore);
        if (updatedBests.ca) setSimCA(updatedBests.ca.rawScore);
        if (updatedBests.cl) setSimCL(updatedBests.cl.rawScore);
      }
    }).catch(console.warn);
  };

  useEffect(() => {
    loadData();
  }, [user.email, user.uid]);

  const bests = getBestScores(user.uid || user.email, user.email);

  // Càlcul de la nota simulada
  const pbEval = calculatePressBancaPoints(simPB);
  const caEval = calculateCircuitPoints(simCA);
  const clEval = calculateCourseNavettePoints(simCL);
  const globalEval = evaluateGlobalFitness(pbEval.points, caEval.points, clEval.points);

  const handleDeleteRecord = (id: string) => {
    deletePhysicalRecord(user.uid || user.email, id, user.email);
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const filteredRecords = records.filter(r => {
    if (filterType === 'ALL') return true;
    return r.testType === filterType;
  });

  return (
    <div className="space-y-8">
      {/* ========================================================= */}
      {/* 1. CALCULADORA I SIMULADOR DE NOTA GLOBAL CME            */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Simulador de Nota Global (Mossos d'Esquadra)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Puntuació ponderada segons els criteris oficials: Cal mínim 1 punt a cada prova i mínim 5,0 de mitjana.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (bests.pb) setSimPB(bests.pb.rawScore);
                if (bests.ca) setSimCA(bests.ca.rawScore);
                if (bests.cl) setSimCL(bests.cl.rawScore);
              }}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Carregar les Meves Millors Marques
            </button>
          </div>
        </div>

        {/* Controls de les 3 proves */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Press Banca */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                Press de Banca (PB)
              </span>
              <span className="text-xs font-black text-amber-400">
                {pbEval.points.toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">pts</span>
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Repeticions en 45s</span>
                <span className="font-mono font-bold text-white">{simPB} reps</span>
              </div>
              <input
                type="range"
                min="18"
                max="45"
                value={simPB}
                onChange={(e) => setSimPB(parseInt(e.target.value) || 0)}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>18</span>
                <span>30 (4p)</span>
                <span>42+ (10p)</span>
              </div>
            </div>
          </div>

          {/* Circuït d'Agilitat */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Circuït d'Agilitat (CA)
              </span>
              <span className="text-xs font-black text-amber-400">
                {caEval.points.toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">pts</span>
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Temps en segons</span>
                <span className="font-mono font-bold text-white">{simCA.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="15.5"
                max="23.0"
                step="0.1"
                value={simCA}
                onChange={(e) => setSimCA(parseFloat(e.target.value) || 18.0)}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>15.5s (10p)</span>
                <span>18.9s (5p)</span>
                <span>22.0s (0p)</span>
              </div>
            </div>
          </div>

          {/* Cursa Llançadora */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                Cursa Llançadora (CL)
              </span>
              <span className="text-xs font-black text-sky-400">
                {clEval.points.toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">pts</span>
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Palier / Període</span>
                <span className="font-mono font-bold text-white">{simCL.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="5.0"
                max="14.0"
                step="0.5"
                value={simCL}
                onChange={(e) => setSimCL(parseFloat(e.target.value) || 8.0)}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>5.0</span>
                <span>9.0 (5p)</span>
                <span>12.5+ (10p)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resultat Global */}
        <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
          globalEval.isPassed 
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
            : 'bg-red-950/30 border-red-500/40 text-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {globalEval.isPassed ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-8 h-8 text-red-400 shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-base font-black uppercase tracking-wider ${
                  globalEval.isPassed ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {globalEval.isPassed ? 'QUALIFICACIÓ: APTE' : 'QUALIFICACIÓ: NO APTE'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 font-mono font-bold text-white">
                  Mitjana: {globalEval.averageScore.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {globalEval.statusMessage}
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right shrink-0">
            <span className="text-3xl font-black font-mono text-white">
              {globalEval.averageScore.toFixed(2)}{' '}
              <span className="text-sm text-slate-400 font-normal">/ 10</span>
            </span>
            <span className="block text-[11px] text-slate-400 font-semibold">
              PB: {pbEval.points.toFixed(1)} • CA: {caEval.points.toFixed(1)} • CL: {clEval.points.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. TAULA OFICIAL DE PUNTUACIONS (Exacta a image.png)      */}
      {/* ========================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Taula Oficial de Puntuacions (Barem CME)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              P (Puntuació de 0 a 10), CA (Circuït d'Agilitat en segons), PB (Press de Banca en repeticions), CL (Cursa Llançadora en palier).
            </p>
          </div>

          <div className="text-xs text-slate-400 font-semibold flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span>Ressaltat segons les teves millors marques</span>
          </div>
        </div>

        {/* Taula estil imatge de referència */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-black text-slate-300 bg-slate-900/80 uppercase tracking-wider">
                <th className="py-3 px-4 border-r border-slate-800 text-amber-400 font-black">P</th>
                <th className="py-3 px-4 border-r border-slate-800">CA (Circuït)</th>
                <th className="py-3 px-4 border-r border-slate-800">PB (Press Banca)</th>
                <th className="py-3 px-4">CL (Cursa Llançadora)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs font-mono">
              {OFFICIAL_PHYSICAL_TABLE.map((row) => {
                const isPBHighlight = bests.pb && bests.pb.tier === row.p;
                const isCAHighlight = bests.ca && bests.ca.tier === row.p;
                const isCLHighlight = bests.cl && bests.cl.tier === row.p;

                return (
                  <tr key={row.p} className="hover:bg-slate-900/50 transition-colors">
                    {/* Columna P */}
                    <td className="py-2.5 px-4 font-black border-r border-slate-800 text-amber-400 font-sans">
                      {row.p}
                    </td>

                    {/* Columna CA */}
                    <td className={`py-2.5 px-4 border-r border-slate-800 transition-colors ${
                      isCAHighlight 
                        ? 'bg-amber-500/20 text-amber-300 font-bold' 
                        : 'text-slate-300'
                    }`}>
                      {row.caDisplay}
                      {isCAHighlight && <span className="ml-1 text-[10px] text-amber-400 font-sans">⭐ Marca ({bests.ca?.rawScore}s)</span>}
                    </td>

                    {/* Columna PB */}
                    <td className={`py-2.5 px-4 border-r border-slate-800 transition-colors ${
                      isPBHighlight 
                        ? 'bg-amber-500/20 text-amber-300 font-bold' 
                        : 'text-slate-300'
                    }`}>
                      {row.pbDisplay}
                      {isPBHighlight && <span className="ml-1 text-[10px] text-amber-400 font-sans">⭐ Marca ({bests.pb?.rawScore} reps)</span>}
                    </td>

                    {/* Columna CL */}
                    <td className={`py-2.5 px-4 transition-colors ${
                      isCLHighlight 
                        ? 'bg-sky-500/20 text-sky-300 font-bold' 
                        : 'text-slate-300'
                    }`}>
                      {row.clDisplay}
                      {isCLHighlight && <span className="ml-1 text-[10px] text-sky-400 font-sans">⭐ Marca (Palier {bests.cl?.rawScore})</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. HISTORIAL COMPLET DE SIMULACRES DESATS                 */}
      {/* ========================================================= */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              Historial de Simulacres Desats
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tots els teus resultats registrats associats al teu correu <strong>{user.email || 'Aspirant'}</strong>.
            </p>
          </div>

          {/* Filtres per prova */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
            {(['ALL', 'PB', 'CA', 'CL'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterType(tab)}
                className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                  filterType === tab
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'ALL' && 'Totes'}
                {tab === 'PB' && 'Press Banca'}
                {tab === 'CA' && 'Circuït'}
                {tab === 'CL' && 'Course Navette'}
              </button>
            ))}
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
            No hi ha registres guardats per al filtre seleccionat.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredRecords.map(rec => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-4 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 rounded-2xl transition-colors text-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold font-mono border ${
                    rec.testType === 'PB' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    rec.testType === 'CA' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    'bg-sky-500/10 text-sky-400 border-sky-500/20'
                  }`}>
                    <span className="text-xs font-black">{rec.testType}</span>
                    <span className="text-[9px] text-slate-400 uppercase">
                      {rec.testType === 'PB' ? 'Reps' : rec.testType === 'CA' ? 'Temps' : 'Palier'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">
                        {rec.testType === 'PB' && `${rec.rawScore} repeticions`}
                        {rec.testType === 'CA' && `${rec.rawScore} segons`}
                        {rec.testType === 'CL' && `Palier ${rec.rawScore}`}
                      </span>

                      <span className="font-bold text-amber-400">
                        • {rec.points.toFixed(1)} punts
                      </span>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        rec.points >= 5 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {rec.points >= 5 ? 'Apte' : 'No apte'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-1">
                      <span>📅 {rec.date}</span>
                      <span>🕒 {rec.time}</span>
                      {rec.notes && <span className="italic text-slate-500">“{rec.notes}”</span>}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteRecord(rec.id)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar registre"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
