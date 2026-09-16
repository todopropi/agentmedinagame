import React, { useState } from 'react';
import { UserProfile } from '../types';
import { getNextRank } from '../data/ranks';
import { ShieldRenderer } from './ShieldRenderer';
import { OfficialEmblem } from './OfficialEmblem';
import { RanksModal } from './RanksModal';
import { AudioEngine } from '../utils/audio';
import { 
  Dice5, 
  Swords, 
  ShieldAlert, 
  BookOpen, 
  Trophy, 
  Coins, 
  Sparkles, 
  LogOut,
  ChevronRight,
  User as UserIcon,
  Volume2,
  VolumeX
} from 'lucide-react';
import { STORE_UNITS_LIST } from '../data/badges';

export type ActiveTab = 'campanya' | 'duels' | 'tienda' | 'repas' | 'ranking';

interface NavbarProps {
  user: UserProfile;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLogout: () => void;
  pendingDuelCount?: number;
  onOpenAdminPanel?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  activeTab, 
  onTabChange, 
  onLogout,
  pendingDuelCount = 0,
  onOpenAdminPanel
}) => {
  const [isRanksOpen, setIsRanksOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(AudioEngine.muted);
  const { nextRank, xpNeeded, progressPercent } = getNextRank(user.xp);

  const equippedShield = STORE_UNITS_LIST.find(u => u.id === user.equippedShieldId) || STORE_UNITS_LIST[1]; // default Seguretat Ciutadana

  const handleToggleAudio = () => {
    const muted = AudioEngine.toggleMute();
    setIsMuted(muted);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90 shadow-xl">
        {/* Top Bar: Brand, Stats & Profile */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-2 sm:gap-4">
          {/* MOBILE VIEW: Directly Mosso / Escala, Mèrits, Escut seleccionat, Imatge de perfil (per sortir) */}
          <div className="flex sm:hidden items-center justify-between w-full gap-2 py-0.5">
            {/* 1. Mosso Escala x */}
            <button 
              type="button"
              onClick={() => {
                AudioEngine.playClick();
                setIsRanksOpen(true);
              }}
              title="Escala i rang policial - Fes clic per veure la progressió"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl cursor-pointer hover:border-amber-500/50 hover:bg-slate-800 transition-all text-left shrink-0 active:scale-95"
            >
              <span className="text-xl leading-none">{user.rank.badgeIcon || '👮‍♂️'}</span>
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-black text-amber-300 truncate max-w-[85px]">
                  {user.rank.name.split('/')[0]}
                </span>
                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider truncate max-w-[85px]">
                  {user.rank.categoryName.replace('ESCALA ', 'Esc. ')}
                </span>
              </div>
            </button>

            {/* 2. Mèrits */}
            <button 
              type="button"
              onClick={() => {
                AudioEngine.playClick();
                onTabChange('tienda');
              }}
              title="Mèrits acumulats - Fes clic per anar a la botiga"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-950/40 border border-amber-500/40 rounded-xl cursor-pointer hover:bg-amber-900/40 transition-all shrink-0 active:scale-95"
            >
              <Coins className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
              <div className="flex flex-col leading-tight text-left">
                <span className="text-xs font-black text-amber-300">
                  {user.merits.toLocaleString()}
                </span>
                <span className="text-[8px] text-amber-400/80 font-extrabold uppercase">
                  Mèrits
                </span>
              </div>
            </button>

            {/* 3. Escut seleccionat */}
            <button
              type="button"
              onClick={() => {
                AudioEngine.playClick();
                onTabChange('tienda');
              }}
              title={`Escut equipat: ${equippedShield.name} - Clic per canviar d'escut`}
              className="cursor-pointer transition-transform active:scale-90 shrink-0 p-1 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex items-center justify-center"
            >
              <ShieldRenderer shieldId={user.equippedShieldId} size={32} glow={true} />
            </button>

            {/* 4. Imatge de perfil (Clic per sortir de l'app) */}
            <button
              type="button"
              onClick={() => {
                AudioEngine.playClick();
                setIsProfileModalOpen(true);
              }}
              title="Perfil de l'Agent - Fes clic per tancar sessió o gestionar perfil"
              className="relative p-0.5 rounded-full border-2 border-amber-500/80 hover:border-amber-400 transition-all shrink-0 cursor-pointer active:scale-95 focus:outline-none"
            >
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName} 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 text-xs">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
            </button>
          </div>

          {/* DESKTOP VIEW: Brand, Emblem, Full Stats, Admin & Avatar */}
          <div className="hidden sm:flex items-center justify-between w-full gap-4">
            {/* Left: Official Emblem and App Title */}
            <div 
              onClick={() => {
                AudioEngine.playClick();
                onTabChange('campanya');
              }}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0"
            >
              <OfficialEmblem size={42} glow={false} />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
                    AGENT MEDINA
                  </span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-widest hidden xs:inline-block">
                    OPOSICIÓ CME
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <span>Escut:</span>
                  <span className="font-semibold text-sky-400 truncate max-w-[140px] lg:max-w-none">
                    {equippedShield.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Scale & Rank, Merits, XP Bar, Audio & Avatar */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Police Rank & Scale Button */}
              <button 
                type="button"
                onClick={() => {
                  AudioEngine.playClick();
                  setIsRanksOpen(true);
                }}
                title="Escala i rang policial - Fes clic per veure tots els rangs"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl cursor-pointer hover:border-amber-500/50 hover:bg-slate-800 transition-all text-left"
              >
                <span className="text-lg leading-none">{user.rank.badgeIcon || '👮‍♂️'}</span>
                <div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                    {user.rank.categoryName}
                  </div>
                  <div className="text-xs font-black text-amber-300 leading-tight">
                    {user.rank.name}
                  </div>
                </div>
              </button>

              {/* Mèrits (Currency) */}
              <div 
                onClick={() => {
                  AudioEngine.playClick();
                  onTabChange('tienda');
                }}
                title="Mèrits acumulats - Fes clic per anar a la botiga d'escuts"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/40 border border-amber-500/40 rounded-xl cursor-pointer hover:bg-amber-900/40 transition-all"
              >
                <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-xs sm:text-sm font-black text-amber-300">
                  {user.merits.toLocaleString()}
                </span>
                <span className="text-[9px] text-amber-400 font-bold uppercase hidden md:inline">
                  Mèrits
                </span>
              </div>

              {/* XP & Rank Bar (Desktop) */}
              <div 
                onClick={() => {
                  AudioEngine.playClick();
                  setIsRanksOpen(true);
                }}
                className="hidden lg:flex flex-col items-end min-w-[130px] cursor-pointer hover:opacity-90"
              >
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold">
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  <span>{user.xp.toLocaleString()} XP</span>
                  {nextRank && (
                    <span className="text-[10px] text-slate-500 font-normal">
                      ({xpNeeded} per {nextRank.name.split('/')[0]})
                    </span>
                  )}
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden border border-slate-700/50">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-sky-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Admin Panel Button if admin */}
              {(user.isAdmin || user.email?.toLowerCase().trim() === 'opossscar@gmail.com') && onOpenAdminPanel && (
                <button
                  type="button"
                  onClick={() => {
                    AudioEngine.playClick();
                    onOpenAdminPanel();
                  }}
                  title="Panell d'Administrador - Gestió de preguntes"
                  className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer shadow-sm shadow-rose-500/20"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>ADMIN</span>
                </button>
              )}

              {/* Audio Toggle */}
              <button
                type="button"
                onClick={handleToggleAudio}
                title={isMuted ? 'Activar so' : 'Silenciar so'}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>

              {/* Equipped Shield Avatar */}
              <div 
                onClick={() => {
                  AudioEngine.playClick();
                  onTabChange('tienda');
                }}
                title={`Escut equipat: ${equippedShield.name} - Clic per anar a la tenda`}
                className="cursor-pointer transition-transform hover:scale-110 shrink-0"
              >
                <ShieldRenderer shieldId={user.equippedShieldId} size={36} glow={true} />
              </div>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    AudioEngine.playClick();
                    setIsProfileModalOpen(true);
                  }}
                  title="Perfil d'usuari"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName} 
                      className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    AudioEngine.playClick();
                    onLogout();
                  }}
                  title="Tancar sessió"
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav
          className="border-t border-slate-800/80 bg-slate-900/80 overflow-x-auto pretty-scrollbar scroll-smooth"
        >
          <div className="max-w-7xl mx-auto px-2 sm:px-6 flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => {
                AudioEngine.playClick();
                onTabChange('campanya');
              }}
              className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 font-black text-xs sm:text-sm tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'campanya'
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Dice5 className="w-4 h-4" />
              <span>🎲 Oca 50</span>
            </button>

            <button
              onClick={() => {
                AudioEngine.playClick();
                onTabChange('duels');
              }}
              className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 font-black text-xs sm:text-sm tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'duels'
                  ? 'border-sky-500 text-sky-400 bg-sky-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Swords className="w-4 h-4" />
              <span>🎡 Duels 1v1</span>
              {pendingDuelCount > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-sky-500 text-slate-950 animate-pulse">
                  {pendingDuelCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                AudioEngine.playClick();
                onTabChange('tienda');
              }}
              className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 font-black text-xs sm:text-sm tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'tienda'
                  ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>🛍️ Tenda Mèrits</span>
            </button>

            <button
              onClick={() => {
                AudioEngine.playClick();
                onTabChange('repas');
              }}
              className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 font-black text-xs sm:text-sm tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'repas'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>📚 Repàs</span>
              {user.failedQuestionIds?.length > 0 && (
                <span className="ml-0.5 text-[10px] bg-red-500 text-white font-black px-1.5 py-0.2 rounded-full">
                  {user.failedQuestionIds.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                AudioEngine.playClick();
                onTabChange('ranking');
              }}
              className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 font-black text-xs sm:text-sm tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'ranking'
                  ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>🏆 Rànquing</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Official Police Ranks Modal */}
      <RanksModal 
        isOpen={isRanksOpen}
        onClose={() => setIsRanksOpen(false)}
        currentXp={user.xp}
      />

      {/* Profile & Logout Modal (Special for Mobile & Quick Access) */}
      {isProfileModalOpen && (
        <div 
          onClick={() => setIsProfileModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-center"
          >
            <div className="flex flex-col items-center">
              <div className="relative mb-3">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName} 
                    className="w-20 h-20 rounded-full border-2 border-amber-500/80 object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-amber-500/80 flex items-center justify-center text-slate-300 text-2xl">
                    <UserIcon className="w-8 h-8" />
                  </div>
                )}
                <span className="absolute bottom-0 right-0 text-xl bg-slate-950 p-1 rounded-full border border-slate-800 shadow">
                  {user.rank.badgeIcon || '👮‍♂️'}
                </span>
              </div>
              <h3 className="text-lg font-black text-white">
                {user.displayName}
              </h3>
              {user.email && (
                <p className="text-xs text-slate-400 font-medium">
                  {user.email}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                  {user.rank.name}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  {user.merits} mèrits
                </span>
              </div>
            </div>

            {/* Quick Actions (Audio / Admin) */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleToggleAudio}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                <span>{isMuted ? 'Activar So' : 'Silenciar'}</span>
              </button>

              {(user.isAdmin || user.email?.toLowerCase().trim() === 'opossscar@gmail.com') && onOpenAdminPanel ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    onOpenAdminPanel();
                  }}
                  className="py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-rose-500/40"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Admin Panel</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    setIsRanksOpen(true);
                  }}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Veure Rangs</span>
                </button>
              )}
            </div>

            {/* Logout button */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  AudioEngine.playClick();
                  setIsProfileModalOpen(false);
                  onLogout();
                }}
                className="w-full py-3 bg-red-600 hover:bg-red-700 active:scale-98 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-600/30"
              >
                <LogOut className="w-4 h-4" />
                <span>Sortir de l'App / Tancar Sessió</span>
              </button>

              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="w-full py-2 text-slate-400 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Tornar a l'App
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
