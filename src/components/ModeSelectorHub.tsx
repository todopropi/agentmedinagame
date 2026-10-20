import React from 'react';
import { UserProfile } from '../types';
import { OfficialEmblem } from './OfficialEmblem';
import { ShieldRenderer } from './ShieldRenderer';
import { 
  BookOpen, 
  Dumbbell, 
  Swords, 
  Dice5, 
  Award, 
  Zap, 
  Activity, 
  ArrowRight, 
  LogOut, 
  Sparkles,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

interface ModeSelectorHubProps {
  user: UserProfile;
  onSelectMode: (mode: 'estudi' | 'fisiques') => void;
  onLogout: () => void;
}

export const ModeSelectorHub: React.FC<ModeSelectorHubProps> = ({
  user,
  onSelectMode,
  onLogout
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-6 selection:bg-amber-500 selection:text-slate-950">
      {/* BARRA SUPERIOR COMPACTA I OPTIMITZADA */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 px-3.5 bg-slate-900/80 backdrop-blur border border-slate-800/80 rounded-2xl shadow-md">
        <div className="flex items-center gap-2.5">
          <OfficialEmblem size={34} glow={false} />
          <div>
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="text-sm font-black tracking-tight text-white">
                AGENT MEDINA
              </span>
              <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                ACADEMY
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block font-medium leading-none mt-0.5">
              Oposicions Cos de Mossos d'Esquadra 2026
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
            <div className="w-5 h-5 flex items-center justify-center">
              <ShieldRenderer shieldId={user.equippedShieldId || 'generic_pvc'} size={20} />
            </div>
            <div className="text-left hidden xs:block">
              <span className="font-bold text-white text-[11px] block leading-tight truncate max-w-[120px]">{user.displayName || 'Aspirant'}</span>
              <span className="text-[9px] text-amber-400 font-semibold">{user.rank?.name || 'Aspirant'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Tancar sessió"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ZONA CENTRAL: BENVINGUDA I TARGETES DE SELECCIÓ */}
      <main className="max-w-4xl w-full mx-auto py-6 sm:py-8 space-y-6">
        <div className="text-center space-y-1.5 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[11px] font-black uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>SELECCIÓ DE MODALITAT</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">{user.displayName || 'Aspirant'}</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Quina àrea de la teva preparació vols entrenar avui?
          </p>
        </div>

        {/* DUES TARGETES PRINCIPALS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
          {/* 1. TARGETA MODE ESTUDI */}
          <div 
            onClick={() => onSelectMode('estudi')}
            className="group relative bg-gradient-to-b from-slate-900/90 to-slate-950 border-2 border-slate-800 hover:border-sky-500/60 rounded-3xl p-5 sm:p-7 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/10 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-colors" />

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest block">
                  TEÒRICA I TEMARI
                </span>
                <h3 className="text-xl font-black text-white group-hover:text-sky-300 transition-colors mt-0.5">
                  Mode Estudi
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Gamificació del temari complet amb el Tauler de l'Oca de 150 caselles, duels 1v1 contra altres aspirants, Camí a l'ISPC i banc de preguntes.
                </p>
              </div>

              {/* Llista de característiques clau */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Dice5 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Tauler de l'Oca de 150 caselles (Nivells Llegendari i Suprem)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Duels 1v1 en directe amb alertes de torn i Tocs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Camí a l'ISPC, repàs intel·ligent i botiga d'escuts</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                <span>Accedir a Mode Estudi</span>
                <ArrowRight className="w-4 h-4" />
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {user.xp} XP acumulats
              </span>
            </div>
          </div>

          {/* 2. TARGETA MODE FÍSIQUES */}
          <div 
            onClick={() => onSelectMode('fisiques')}
            className="group relative bg-gradient-to-b from-slate-900/90 to-slate-950 border-2 border-slate-800 hover:border-amber-500/60 rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/10 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />

            <div className="space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Dumbbell className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-black text-amber-400 uppercase tracking-widest block">
                  PREPARACIÓ FÍSICA CME
                </span>
                <h3 className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors mt-0.5">
                  Mode Físiques
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                  Simulacres i entrenament oficial de les 3 proves de la convocatòria: Press de Banca a cadència de 1,02s, Circuït d'Agilitat i Cursa Llançadora amb àudio continu.
                </p>
              </div>

              {/* Llista de característiques clau */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Press de Banca: 10s prep, metrònom de 1,02s, sirena i pràctica</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Cursa Llançadora (Course Navette) amb àudio continu català</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Circuït d'Agilitat reglamentari amb cronòmetre i barems</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                <span>Accedir a Mode Físiques</span>
                <ArrowRight className="w-4 h-4" />
              </span>
              <span className="text-[11px] text-amber-500/80 font-bold uppercase tracking-wider">
                NOU MÒDUL 2026
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* PEU DE PÀGINA */}
      <footer className="max-w-5xl w-full mx-auto text-center text-xs text-slate-500 pt-6 border-t border-slate-900">
        Agent Medina • Convocatòria Cos de Mossos d'Esquadra • Taules i barems segons la Guia Oficial
      </footer>
    </div>
  );
};
