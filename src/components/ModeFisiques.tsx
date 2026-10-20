import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { PressBancaView } from './fisiques/PressBancaView';
import { CircuitAgilitatView } from './fisiques/CircuitAgilitatView';
import { CursaLlancadoraView } from './fisiques/CursaLlancadoraView';
import { EstadistiquesFisiquesView } from './fisiques/EstadistiquesFisiquesView';
import { getBestScores, fetchPhysicalDataFromCloud } from '../utils/physicalStorage';
import { evaluateGlobalFitness } from '../utils/physicalScoring';
import { ShieldRenderer } from './ShieldRenderer';
import { OfficialEmblem } from './OfficialEmblem';
import { 
  Dumbbell, 
  Zap, 
  Activity, 
  BarChart2, 
  ArrowLeft, 
  Award, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface ModeFisiquesProps {
  user: UserProfile;
  onSwitchToEstudi: () => void;
}

export type FisiquesTab = 'press_banca' | 'circuit' | 'cursa_llancadora' | 'estadistiques';

export const ModeFisiques: React.FC<ModeFisiquesProps> = ({ user, onSwitchToEstudi }) => {
  const [activeTab, setActiveTab] = useState<FisiquesTab>(() => {
    try {
      const activeWorkout = localStorage.getItem('agent_medina_active_pb_workout');
      if (activeWorkout) return 'press_banca';
      const saved = localStorage.getItem('agent_medina_fisiques_tab') as FisiquesTab;
      if (saved && ['press_banca', 'circuit', 'cursa_llancadora', 'estadistiques'].includes(saved)) {
        return saved;
      }
    } catch (e) {}
    return 'press_banca';
  });

  useEffect(() => {
    try {
      localStorage.setItem('agent_medina_fisiques_tab', activeTab);
    } catch (e) {}
  }, [activeTab]);

  useEffect(() => {
    const handleSaveTab = () => {
      try {
        localStorage.setItem('agent_medina_fisiques_tab', activeTab);
      } catch (e) {}
    };

    window.addEventListener('pagehide', handleSaveTab);
    window.addEventListener('beforeunload', handleSaveTab);
    document.addEventListener('visibilitychange', handleSaveTab);

    return () => {
      window.removeEventListener('pagehide', handleSaveTab);
      window.removeEventListener('beforeunload', handleSaveTab);
      document.removeEventListener('visibilitychange', handleSaveTab);
    };
  }, [activeTab]);

  const [bestScores, setBestScores] = useState(getBestScores(user.uid || user.email, user.email));

  const refreshBestScores = () => {
    setBestScores(getBestScores(user.uid || user.email, user.email));
  };

  useEffect(() => {
    refreshBestScores();
    fetchPhysicalDataFromCloud(user.uid, user.email).then(() => {
      refreshBestScores();
    }).catch(console.warn);
  }, [user.email, user.uid]);

  const globalEval = evaluateGlobalFitness(
    bestScores.pb ? bestScores.pb.points : 0,
    bestScores.ca ? bestScores.ca.points : 0,
    bestScores.cl ? bestScores.cl.points : 0
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* HEADER AMB NAVEGACIÓ I COMMUTADOR DE MODE */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="relative">
            <OfficialEmblem size={34} glow={false} />
            <div className="absolute -bottom-1 -right-1 p-1 bg-amber-500 rounded-full text-slate-950">
              <Dumbbell className="w-3 h-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Mode Físiques CME 2026
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                PROVES OFICIALS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Press de Banca • Circuït d'Agilitat • Cursa Llançadora
            </p>
          </div>
        </div>

        {/* Botó destacat per canviar a Mode Estudi */}
        <button
          type="button"
          onClick={onSwitchToEstudi}
          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs rounded-2xl shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer border border-sky-400/30 shrink-0"
        >
          <BookOpen className="w-4 h-4" />
          <span>Canviar a Mode Estudi</span>
        </button>
      </div>

      {/* RESUM DE MARQUES ACTUALS I QUALIFICACIÓ GLOBAL */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Press de Banca */}
        <div 
          onClick={() => setActiveTab('press_banca')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'press_banca' 
              ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10' 
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
            Press Banca (PB)
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-black font-mono text-white">
              {bestScores.pb ? `${bestScores.pb.rawScore} reps` : 'Sense marca'}
            </span>
            {bestScores.pb && (
              <span className="text-xs font-bold text-amber-400">
                ({bestScores.pb.points.toFixed(1)}p)
              </span>
            )}
          </div>
        </div>

        {/* Circuït d'Agilitat */}
        <div 
          onClick={() => setActiveTab('circuit')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'circuit' 
              ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10' 
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Circuït (CA)
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-black font-mono text-white">
              {bestScores.ca ? `${bestScores.ca.rawScore}s` : 'Sense marca'}
            </span>
            {bestScores.ca && (
              <span className="text-xs font-bold text-amber-400">
                ({bestScores.ca.points.toFixed(1)}p)
              </span>
            )}
          </div>
        </div>

        {/* Cursa Llançadora */}
        <div 
          onClick={() => setActiveTab('cursa_llancadora')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'cursa_llancadora' 
              ? 'bg-sky-500/10 border-sky-500/50 shadow-md shadow-sky-500/10' 
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            Navette (CL)
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-black font-mono text-white">
              {bestScores.cl ? `Palier ${bestScores.cl.rawScore}` : 'Sense marca'}
            </span>
            {bestScores.cl && (
              <span className="text-xs font-bold text-sky-400">
                ({bestScores.cl.points.toFixed(1)}p)
              </span>
            )}
          </div>
        </div>

        {/* Estat Global / Mitjana */}
        <div 
          onClick={() => setActiveTab('estadistiques')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'estadistiques' 
              ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10' 
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            Mitjana Global
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-lg font-black font-mono text-white">
              {bestScores.pb && bestScores.ca && bestScores.cl ? `${globalEval.averageScore.toFixed(2)}` : 'Incomplet'}
            </span>
            {bestScores.pb && bestScores.ca && bestScores.cl && (
              <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                globalEval.isPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {globalEval.isPassed ? 'Apte' : 'No apte'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* PESTANYES PRINCIPALS DE PROVES I BAREMS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('press_banca')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'press_banca'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>Press Banca</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('circuit')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'circuit'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Circuït</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cursa_llancadora')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'cursa_llancadora'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Cursa Llançadora</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('estadistiques')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'estadistiques'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Estadístiques & Barems</span>
        </button>
      </div>

      {/* CONTINGUT DE LA PESTANYA SELECCIONADA */}
      <div className="pt-2">
        {activeTab === 'press_banca' && (
          <PressBancaView user={user} onRecordSaved={refreshBestScores} />
        )}

        {activeTab === 'circuit' && (
          <CircuitAgilitatView user={user} onRecordSaved={refreshBestScores} />
        )}

        {activeTab === 'cursa_llancadora' && (
          <CursaLlancadoraView user={user} onRecordSaved={refreshBestScores} />
        )}

        {activeTab === 'estadistiques' && (
          <EstadistiquesFisiquesView user={user} />
        )}
      </div>
    </div>
  );
};
