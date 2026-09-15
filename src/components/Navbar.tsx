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
  VolumeX,
  Users,
  Radio
} from 'lucide-react';
import { STORE_UNITS_LIST } from '../data/badges';

export type ActiveTab = 'campanya' | 'duels' | 'tienda' | 'repas' | 'ranking';

interface NavbarProps {
  user: UserProfile;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLogout: () => void;
  pendingDuelCount?: number;
  onOpenActiveUsers?: () => void;
  activeUsersCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  activeTab, 
  onTabChange, 
  onLogout,
  pendingDuelCount = 0,
  onOpenActiveUsers,
  activeUsersCount = 3
}) => {
  const [isRanksOpen, setIsRanksOpen] = useState(false);
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
        {/* Top Bar: Brand, Stats, Online & Profile */}
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-2 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Official Emblem and App Title */}
          <div 
            onClick={() => {
              AudioEngine.playClick();
              onTabChange('campanya');
            }}
            className="flex items-center gap-1.5 sm:gap-3 cursor-pointer group select-none shrink-0"
          >
            <OfficialEmblem size={38} glow={false} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-lg font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
                  AGENT MEDINA
                </span>
                <span className="text-[8px] sm:text-[9px] font-extrabold px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-widest hidden xs:inline-block">
                  CME
                </span>
              </div>
              <div className="text-[9px] sm:text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <span className="hidden sm:inline">Escut:</span>
                <span className="font-semibold text-sky-400 truncate max-w-[85px] sm:max-w-none">
                  {equippedShield.name}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Scale & Rank, Merits, Active Users, Audio & Avatar */}
          <div className="flex items-center gap-1 sm:gap-2.5">
            {/* Active Users / Online Indicator Button */}
            <button
              type="button"
              onClick={() => {
                AudioEngine.playClick();
                onOpenActiveUsers?.();
              }}
              title="Veure opositors actius en línia i cercar companys per correu o nom"
              className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:py-1.5 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-xl cursor-pointer text-emerald-300 transition-all text-xs font-black shadow-sm group"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="hidden xs:inline">{activeUsersCount} Actius</span>
              <Users className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            </button>

            {/* Police Rank & Scale Button */}
            <button 
              type="button"
              onClick={() => {
                AudioEngine.playClick();
                setIsRanksOpen(true);
              }}
              title="Escala i rang policial - Fes clic per veure tots els rangs"
              className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 bg-slate-900 border border-slate-700/80 rounded-xl cursor-pointer hover:border-amber-500/50 hover:bg-slate-800 transition-all text-left"
            >
              <span className="text-base leading-none">{user.rank.badgeIcon || '👮‍♂️'}</span>
              <div className="hidden md:block">
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
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-amber-950/40 border border-amber-500/40 rounded-xl cursor-pointer hover:bg-amber-900/40 transition-all"
            >
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-black text-amber-300">
                {user.merits.toLocaleString()}
              </span>
            </div>

            {/* XP & Rank Bar (Desktop) */}
            <div 
              onClick={() => {
                AudioEngine.playClick();
                setIsRanksOpen(true);
              }}
              className="hidden lg:flex flex-col items-end min-w-[120px] cursor-pointer hover:opacity-90"
            >
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold">
                <Sparkles className="w-3 h-3 text-sky-400" />
                <span>{user.xp.toLocaleString()} XP</span>
                {nextRank && (
                  <span className="text-[10px] text-slate-500 font-normal">
                    ({xpNeeded})
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

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={handleToggleAudio}
              title={isMuted ? 'Activar so' : 'Silenciar so'}
              className="p-1.5 sm:p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />}
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
              <ShieldRenderer shieldId={user.equippedShieldId} size={32} glow={true} />
            </div>

            {/* User Avatar & Logout */}
            <div className="flex items-center gap-1 pl-1 sm:pl-2 border-l border-slate-800">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName} 
                  className="w-7 h-7 rounded-full border border-slate-700 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  AudioEngine.playClick();
                  onLogout();
                }}
                title="Tancar sessió"
                className="p-1 sm:p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Tabs Bar (Visible on sm+ screens, completely eliminated on mobile to prevent white scrollbars) */}
        <nav className="hidden sm:block border-t border-slate-800/80 bg-slate-900/80 no-scrollbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => {
                AudioEngine.playClick();
                onTabChange('campanya');
              }}
              className={`flex items-center gap-2 py-2.5 px-4 border-b-2 font-black text-xs sm:text-sm tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
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
              className={`flex items-center gap-2 py-2.5 px-4 border-b-2 font-black text-xs sm:text-sm tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
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
              className={`flex items-center gap-2 py-2.5 px-4 border-b-2 font-black text-xs sm:text-sm tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
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
              className={`flex items-center gap-2 py-2.5 px-4 border-b-2 font-black text-xs sm:text-sm tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
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
              className={`flex items-center gap-2 py-2.5 px-4 border-b-2 font-black text-xs sm:text-sm tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
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

      {/* Mobile Fixed Bottom Navigation Bar (Thumb-accessible, ergonomic, zero white scrollbars) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 shadow-2xl px-1.5 py-1 flex items-center justify-around select-none">
        <button
          onClick={() => {
            AudioEngine.playClick();
            onTabChange('campanya');
          }}
          className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer min-h-[48px] ${
            activeTab === 'campanya'
              ? 'text-amber-400 font-black bg-amber-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Dice5 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Oca 50</span>
        </button>

        <button
          onClick={() => {
            AudioEngine.playClick();
            onTabChange('duels');
          }}
          className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer relative min-h-[48px] ${
            activeTab === 'duels'
              ? 'text-sky-400 font-black bg-sky-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Swords className="w-5 h-5 mb-0.5" />
            {pendingDuelCount > 0 && (
              <span className="absolute -top-1 -right-2 text-[9px] font-black px-1 rounded-full bg-sky-500 text-slate-950 animate-pulse">
                {pendingDuelCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Duels 1v1</span>
        </button>

        <button
          onClick={() => {
            AudioEngine.playClick();
            onTabChange('tienda');
          }}
          className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer min-h-[48px] ${
            activeTab === 'tienda'
              ? 'text-yellow-400 font-black bg-yellow-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Tenda</span>
        </button>

        <button
          onClick={() => {
            AudioEngine.playClick();
            onTabChange('repas');
          }}
          className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer relative min-h-[48px] ${
            activeTab === 'repas'
              ? 'text-emerald-400 font-black bg-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <BookOpen className="w-5 h-5 mb-0.5" />
            {user.failedQuestionIds?.length > 0 && (
              <span className="absolute -top-1 -right-2 text-[9px] font-black px-1 rounded-full bg-red-500 text-white">
                {user.failedQuestionIds.length}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Repàs</span>
        </button>

        <button
          onClick={() => {
            AudioEngine.playClick();
            onTabChange('ranking');
          }}
          className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer min-h-[48px] ${
            activeTab === 'ranking'
              ? 'text-purple-400 font-black bg-purple-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Rànquing</span>
        </button>
      </nav>

      {/* Official Police Ranks Modal */}
      <RanksModal 
        isOpen={isRanksOpen}
        onClose={() => setIsRanksOpen(false)}
        currentXp={user.xp}
      />
    </>
  );
};

