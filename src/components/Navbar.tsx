import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { getNextRank } from '../data/ranks';
import { ShieldRenderer } from './ShieldRenderer';
import { OfficialEmblem } from './OfficialEmblem';
import { RanksModal } from './RanksModal';
import { AudioEngine } from '../utils/audio';
import { fetchNavigationTexts, subscribeToNavigationTexts, fetchSupabaseUserProgression } from '../../supabase';
import { 
  Dice5, 
  Swords, 
  ShieldAlert, 
  BookOpen, 
  Trophy, 
  Coins, 
  Sparkles, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Volume2,
  VolumeX,
  Clock,
  Key,
  Smartphone,
  Bell,
  BarChart2,
  Compass,
  Flame,
  X
} from 'lucide-react';
import { STORE_UNITS_LIST } from '../data/badges';
import { QUESTIONS_BANK } from '../data/questionsBank';

export type ActiveTab = 'campanya' | 'cami_ispc' | 'duels' | 'tienda' | 'repas' | 'ranking';

interface NavbarProps {
  user: UserProfile;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLogout: () => void;
  pendingDuelCount?: number;
  unreadNotificationsCount?: number;
  onOpenAdminPanel?: () => void;
  onOpenSubscriptionModal?: () => void;
  onOpenNotificationsModal?: () => void;
  onOpenLegalModal?: () => void;
  sectionLabels?: Record<string, string>;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  activeTab, 
  onTabChange, 
  onLogout,
  pendingDuelCount = 0,
  unreadNotificationsCount = 0,
  onOpenAdminPanel,
  onOpenSubscriptionModal,
  onOpenNotificationsModal,
  onOpenLegalModal,
  sectionLabels
}) => {
  const [isRanksOpen, setIsRanksOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isStudyReportOpen, setIsStudyReportOpen] = useState(false);
  const [freshUserProgression, setFreshUserProgression] = useState<any | null>(null);
  const [isMuted, setIsMuted] = useState(AudioEngine.muted);

  useEffect(() => {
    if (isStudyReportOpen && user?.uid) {
      fetchSupabaseUserProgression(user.uid).then(prog => {
        if (prog) setFreshUserProgression(prog);
      }).catch(console.warn);
    }
  }, [isStudyReportOpen, user?.uid]);
  const [dbNavTexts, setDbNavTexts] = useState<Record<string, string> | null>(null);
  const { nextRank, xpNeeded, progressPercent } = getNextRank(user.xp);

  // Gestió de scroll horitzontal fluid amb fletxes i roda del ratolí
  const navRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkNavScroll = () => {
    if (!navRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  };

  useEffect(() => {
    checkNavScroll();
    window.addEventListener('resize', checkNavScroll);
    return () => window.removeEventListener('resize', checkNavScroll);
  }, [dbNavTexts, sectionLabels]);

  const handleNavScroll = (direction: 'left' | 'right') => {
    if (!navRef.current) return;
    const delta = direction === 'left' ? -220 : 220;
    navRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(checkNavScroll, 300);
  };

  const handleNavWheel = (e: React.WheelEvent<HTMLElement>) => {
    if (!navRef.current) return;
    if (e.deltaY !== 0) {
      navRef.current.scrollLeft += e.deltaY;
      checkNavScroll();
    }
  };

  // Càlcul de dies/estat de subscripció
  const isUnlimited = Boolean(user.isUnlimited || user.subscriptionStatus === 'unlimited');
  let subBadgeText = 'Actiu';
  let isExpired = false;
  let isTrial = user.subscriptionStatus === 'trial';

  if (isUnlimited) {
    subBadgeText = 'IL·LIMITAT';
  } else if (user.subscriptionExpiresAt) {
    const expTime = new Date(user.subscriptionExpiresAt).getTime();
    const diff = expTime - Date.now();
    if (diff <= 0) {
      isExpired = true;
      subBadgeText = 'Caducat';
    } else {
      const days = Math.floor(diff / (24 * 3600 * 1000));
      const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
      if (days > 0) {
        subBadgeText = `${days}d restants`;
      } else {
        subBadgeText = `${hours}h restants`;
      }
    }
  } else {
    isExpired = true;
    subBadgeText = 'Sense accés';
  }

  // Carregar els textos dinàmics des de la taula navigation_texts de Supabase (amb subscripció Realtime)
  useEffect(() => {
    fetchNavigationTexts().then((texts) => {
      if (texts) {
        setDbNavTexts(texts);
      }
    }).catch(console.warn);

    const unsubscribeRealtime = subscribeToNavigationTexts((newTexts) => {
      setDbNavTexts(newTexts);
    });

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setDbNavTexts(e.detail);
      }
    };
    window.addEventListener('navigation_texts_updated', handleUpdate);
    return () => {
      window.removeEventListener('navigation_texts_updated', handleUpdate);
      unsubscribeRealtime();
    };
  }, []);

  const equippedShield = STORE_UNITS_LIST.find(u => u.id === user.equippedShieldId) || STORE_UNITS_LIST[1]; // default Seguretat Ciutadana

  const handleToggleAudio = () => {
    const muted = AudioEngine.toggleMute();
    setIsMuted(muted);
  };

  return (
    <>
      <header 
        className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90 shadow-xl ios-safe-top"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0.35rem)' }}
      >
        {/* Top Bar: Brand, Stats & Profile */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-2 sm:gap-4">
          {/* MOBILE VIEW: Ultra-clean, modern and un-crowded top bar */}
          <div className="flex sm:hidden items-center justify-between w-full py-1">
            {/* Left: Official Emblem + App Title */}
            <div 
              onClick={() => {
                AudioEngine.playClick();
                onTabChange('campanya');
              }}
              title="MEED - Cos d'Opositors CME"
              className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform touch-manipulation"
            >
              <OfficialEmblem size={34} glow={false} />
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-black tracking-tight text-white">
                  AGENT MEDINA
                </span>
                <span className="text-[8px] font-extrabold text-amber-400 tracking-wider uppercase">
                  OPOSICIÓ CME
                </span>
              </div>
            </div>

            {/* Right: Racha + Mèrits Chip + Notificacions + User Avatar */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Racha Flama Diària */}
              <div 
                title={`Racha diària: ${user.streakCount || 0} dies consecutius (Mínim 5 preguntes/dia)`}
                className="flex items-center gap-1 px-2 py-1 bg-amber-950/30 border border-amber-500/30 rounded-full text-amber-400 text-xs font-black shadow-sm"
              >
                <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>{user.streakCount || 0}</span>
              </div>

              {/* Mèrits Pill */}
              <button 
                type="button"
                onClick={() => {
                  AudioEngine.playClick();
                  onTabChange('tienda');
                }}
                title="Mèrits acumulats - Fes clic per anar a la botiga"
                className="flex items-center gap-1 px-2 py-1 bg-amber-950/40 border border-amber-500/40 rounded-full cursor-pointer hover:bg-amber-900/40 transition-all active:scale-95 shadow-sm touch-manipulation"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-black text-amber-300">
                  {user.merits.toLocaleString()}
                </span>
              </button>

              {/* Centre de Notificacions (Mobile) */}
              {onOpenNotificationsModal && (
                <button
                  type="button"
                  onClick={() => {
                    AudioEngine.playClick();
                    onOpenNotificationsModal();
                  }}
                  title="Centre de Notificacions"
                  className="relative p-2 rounded-full bg-slate-900 border border-slate-700/80 text-amber-400 hover:text-white flex items-center justify-center shrink-0 active:scale-95 touch-manipulation cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white font-black text-[9px] flex items-center justify-center shadow-sm animate-pulse border border-slate-900">
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </span>
                  )}
                </button>
              )}

              {/* Imatge de perfil + Rang Badge (Fes clic per veure perfil complet, escut i ajustos) */}
              <button
                type="button"
                onClick={() => {
                  AudioEngine.playClick();
                  setIsProfileModalOpen(true);
                }}
                title="El meu Perfil - Rang, Escut, Subscripció i Ajustos"
                className="relative p-0.5 rounded-full border-2 border-amber-500 hover:border-amber-400 transition-all shrink-0 cursor-pointer active:scale-95 focus:outline-none shadow-md shadow-amber-500/20 touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
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
                <span className="absolute -bottom-1 -right-1 text-[11px] bg-slate-900 rounded-full p-0.5 border border-slate-700 leading-none shadow">
                  {user.rank.badgeIcon || '👮‍♂️'}
                </span>
              </button>
            </div>
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
              <OfficialEmblem size={50} glow={true} />
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

              {/* Subscription Status Button */}
              {onOpenSubscriptionModal && (
                <button
                  type="button"
                  onClick={() => {
                    AudioEngine.playClick();
                    onOpenSubscriptionModal();
                  }}
                  title="Estat de la subscripció - Clic per introduir codi o renovar"
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                    isUnlimited
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                      : isExpired
                        ? 'bg-red-500/15 border-red-500/40 text-red-300 hover:bg-red-500/25 animate-pulse'
                        : isTrial
                          ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 hover:bg-purple-500/25'
                          : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{subBadgeText}</span>
                </button>
              )}

              {/* Botó Centre de Notificacions */}
              {onOpenNotificationsModal && (
                <button
                  type="button"
                  onClick={() => {
                    AudioEngine.playClick();
                    onOpenNotificationsModal();
                  }}
                  title="Configurar Notificacions (Duels i Avançaments a l'Oca)"
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-amber-300 border border-amber-500/30 hover:border-amber-500/50 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-amber-500/10 active:scale-95 relative"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xl:inline">NOTIFICACIONS</span>
                  {unreadNotificationsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white font-black text-[10px] animate-pulse">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>
              )}

              {/* Admin Panel Button if admin */}
              {(user.isAdmin || user.role === 'admin' || user.role === 'question_editor' || user.email?.toLowerCase().trim() === 'opossscar@gmail.com') && onOpenAdminPanel && (
                <button
                  type="button"
                  onClick={() => {
                    AudioEngine.playClick();
                    onOpenAdminPanel();
                  }}
                  title="Panell d'Administrador"
                  className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer shadow-sm shadow-rose-500/20"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>{user.role === 'question_editor' ? 'DOCÈNCIA' : 'ADMIN'}</span>
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
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName} 
                      className="w-8 h-8 rounded-full border border-slate-700 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs shrink-0">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-200 max-w-[110px] truncate hidden md:inline-block">
                    {user.displayName}
                  </span>
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

        {/* Navigation Tabs Bar amb fletxes i suport de ratolí/touch */}
        <div className="relative border-t border-slate-800/80 bg-slate-900/90 flex items-center group/nav">
          {/* Fletxa esquerra */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleNavScroll('left')}
              className="absolute left-0 z-20 h-full px-2 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent text-amber-400 hover:text-amber-300 flex items-center justify-center transition-colors cursor-pointer"
              title="Moure a l'esquerra"
            >
              <ChevronLeft className="w-5 h-5 drop-shadow-md" />
            </button>
          )}

          <nav
            ref={navRef}
            onScroll={checkNavScroll}
            onWheel={handleNavWheel}
            className="w-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto pretty-scrollbar scroll-smooth"
          >
            <button
              onClick={() => {
                AudioEngine.playClick();
                onTabChange('campanya');
              }}
              className={`shrink-0 flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 font-black text-xs sm:text-sm tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'campanya'
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Dice5 className="w-4 h-4 shrink-0" />
              <span>{dbNavTexts?.campanya || sectionLabels?.campanya || '🎲 Oca 50'}</span>
            </button>

            <button
              onClick={() => {
                AudioEngine.playClick();
                onTabChange('cami_ispc');
              }}
              className={`shrink-0 flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 font-black text-xs sm:text-sm tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'cami_ispc'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span>{dbNavTexts?.cami_ispc || sectionLabels?.cami_ispc || "🏔️ Camí a l'ISPC"}</span>
            </button>

            <button
              onClick={() => {
                AudioEngine.playClick();
                onTabChange('duels');
              }}
              className={`shrink-0 flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 font-black text-xs sm:text-sm tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'duels'
                  ? 'border-sky-500 text-sky-400 bg-sky-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Swords className="w-4 h-4 shrink-0" />
              <span>{dbNavTexts?.duels || sectionLabels?.duels || '🎡 Duels 1v1'}</span>
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
              className={`shrink-0 flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 font-black text-xs sm:text-sm tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'tienda'
                  ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{dbNavTexts?.tienda || sectionLabels?.tienda || (user?.email?.toLowerCase().trim() === 'opossscar@gmail.com' ? '🛍️ Botiga' : '🛍️ Tenda Mèrits')}</span>
            </button>

            <button
              onClick={() => {
                AudioEngine.playClick();
                onTabChange('repas');
              }}
              className={`shrink-0 flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 font-black text-xs sm:text-sm tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'repas'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>{dbNavTexts?.repas || sectionLabels?.repas || '📚 Repàs'}</span>
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
              className={`shrink-0 flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 font-black text-xs sm:text-sm tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'ranking'
                  ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Trophy className="w-4 h-4 shrink-0" />
              <span>{dbNavTexts?.ranking || sectionLabels?.ranking || '🏆 Rànquing'}</span>
            </button>
          </nav>

          {/* Fletxa dreta */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleNavScroll('right')}
              className="absolute right-0 z-20 h-full px-2 bg-gradient-to-l from-slate-950 via-slate-900/90 to-transparent text-amber-400 hover:text-amber-300 flex items-center justify-center transition-colors cursor-pointer"
              title="Moure a la dreta"
            >
              <ChevronRight className="w-5 h-5 drop-shadow-md" />
            </button>
          )}
        </div>
      </header>

      {/* Official Police Ranks Modal */}
      <RanksModal 
        isOpen={isRanksOpen}
        onClose={() => setIsRanksOpen(false)}
        currentXp={user.xp}
      />

      {/* Profile & Settings Modal (Mobile & Desktop Hub) */}
      {isProfileModalOpen && (
        <div 
          onClick={() => setIsProfileModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 text-center"
          >
            {/* User Header */}
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName} 
                    className="w-18 h-18 rounded-full border-2 border-amber-500/80 object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-18 h-18 rounded-full bg-slate-800 border-2 border-amber-500/80 flex items-center justify-center text-slate-300 text-2xl">
                    <UserIcon className="w-7 h-7" />
                  </div>
                )}
                <span className="absolute bottom-0 right-0 text-lg bg-slate-950 p-1 rounded-full border border-slate-800 shadow">
                  {user.rank.badgeIcon || '👮‍♂️'}
                </span>
              </div>
              <h3 className="text-base font-black text-white">
                {user.displayName}
              </h3>
              {user.email && (
                <p className="text-[11px] text-slate-400 font-medium">
                  {user.email}
                </p>
              )}
            </div>

            {/* Card 1: Escut Policial Equipat */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1 rounded-xl bg-slate-900 border border-amber-500/30 shrink-0">
                  <ShieldRenderer shieldId={user.equippedShieldId} size={42} glow={false} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                    Escut Equipat
                  </div>
                  <div className="text-xs font-black text-white truncate">
                    {equippedShield.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {equippedShield.unit || 'CME Mossos d\'Esquadra'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  AudioEngine.playClick();
                  setIsProfileModalOpen(false);
                  onTabChange('tienda');
                }}
                className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-[11px] font-black shrink-0 cursor-pointer transition-colors active:scale-95"
              >
                Canviar
              </button>
            </div>

            {/* Card 2: Escala i Rang Policial */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-left space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    {user.rank.categoryName}
                  </div>
                  <div className="text-xs font-black text-amber-300 flex items-center gap-1">
                    <span>{user.rank.badgeIcon || '👮‍♂️'}</span>
                    <span>{user.rank.name}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    AudioEngine.playClick();
                    setIsProfileModalOpen(false);
                    setIsRanksOpen(true);
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  Veure Rangs
                </button>
              </div>

              {/* Barra de Progrés XP */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Progrés d'experiència</span>
                  <span className="font-bold text-amber-400">{user.xp.toLocaleString()} XP</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-yellow-400 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
                  />
                </div>
                {nextRank && (
                  <div className="text-[9px] text-slate-500 text-right">
                    Falten {xpNeeded.toLocaleString()} XP per a {nextRank.name}
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: Balanç de Recursos */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div 
                onClick={() => {
                  AudioEngine.playClick();
                  setIsProfileModalOpen(false);
                  onTabChange('tienda');
                }}
                className="p-2.5 bg-amber-950/20 border border-amber-500/30 rounded-xl cursor-pointer hover:bg-amber-950/30 transition-colors"
              >
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Coins className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase">Mèrits</span>
                </div>
                <div className="text-sm font-black text-amber-300 mt-0.5">
                  {user.merits.toLocaleString()}
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-1.5 text-sky-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase">Comodins 50%</span>
                </div>
                <div className="text-sm font-black text-white mt-0.5">
                  {user.wildcardsCount || 0} disponibles
                </div>
              </div>
            </div>

            {/* Card 4: Racha Diària & Escuts de Racha */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="p-2.5 bg-amber-950/25 border border-amber-500/30 rounded-xl">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase">Racha d'Estudi</span>
                </div>
                <div className="text-sm font-black text-amber-300 mt-0.5 flex items-center gap-1">
                  <span>{user.streakCount || 0}</span>
                  <span className="text-[11px] font-bold text-slate-400">dies</span>
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  Mín. 5 preguntes/dia
                </div>
              </div>

              <div 
                onClick={() => {
                  AudioEngine.playClick();
                  setIsProfileModalOpen(false);
                  onTabChange('tienda');
                }}
                className="p-2.5 bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 rounded-xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5 text-sky-400">
                  <span className="text-xs">🛡️</span>
                  <span className="text-[10px] font-bold uppercase">Escuts Racha</span>
                </div>
                <div className="text-sm font-black text-white mt-0.5">
                  {user.streakShieldsCount || 0} / 3
                </div>
                <div className="text-[9px] text-amber-400 hover:underline mt-0.5">
                  Comprar a la botiga
                </div>
              </div>
            </div>

            {/* Subscription Button in Modal */}
            {onOpenSubscriptionModal && (
              <button
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  onOpenSubscriptionModal();
                }}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isUnlimited
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : isExpired
                      ? 'bg-red-500/15 border-red-500/40 text-red-300'
                      : 'bg-slate-800/90 border-slate-700 text-slate-200 hover:border-amber-500/50'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Subscripció: <strong>{subBadgeText}</strong> (Codi / Renovar)</span>
              </button>
            )}

            {/* Botó Radiografia d'Estudi (Exclusiu si l'administrador li ha concedit accés) */}
            {user.canViewStudyReport && (
              <button
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setIsStudyReportOpen(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 cursor-pointer transition-all active:scale-95"
              >
                <BarChart2 className="w-4 h-4 text-sky-200" />
                <span>La meva Radiografia de Temari (Exclusiu)</span>
              </button>
            )}

            {/* Quick Actions (Audio / Notificacions / Admin) */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
              <button
                type="button"
                onClick={handleToggleAudio}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                <span>{isMuted ? 'Activar So' : 'Silenciar'}</span>
              </button>

              {onOpenNotificationsModal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    onOpenNotificationsModal();
                  }}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span>Notificacions</span>
                </button>
              )}

              {(user.isAdmin || user.role === 'admin' || user.role === 'question_editor' || user.email?.toLowerCase().trim() === 'opossscar@gmail.com') && onOpenAdminPanel && (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    onOpenAdminPanel();
                  }}
                  className="col-span-2 py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-rose-500/40"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>{user.role === 'question_editor' ? 'Docència' : 'Admin Panel'}</span>
                </button>
              )}

              {onOpenLegalModal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    onOpenLegalModal();
                  }}
                  className="col-span-2 py-2 px-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-amber-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-800"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Avís Legal i Propietat Intel·lectual</span>
                </button>
              )}
            </div>

            {/* Logout button */}
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  AudioEngine.playClick();
                  setIsProfileModalOpen(false);
                  onLogout();
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 active:scale-98 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-600/30 text-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>Sortir de l'App / Tancar Sessió</span>
              </button>

              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="w-full py-1.5 text-slate-400 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Tornar a l'App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Radiografia de Temari (Per a l'Alumne) */}
      {isStudyReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    La meva Radiografia de Temari
                  </h3>
                  <p className="text-xs text-slate-400">Seguiment personalitzat de cobertura i preguntes per tocar</p>
                </div>
              </div>
              <button
                onClick={() => setIsStudyReportOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
              {(() => {
                const totalBank = QUESTIONS_BANK.length;
                const answeredList = [
                  ...(user.answeredQuestionIds || []),
                  ...((user as any).answered_questions || []),
                  ...(user.correctQuestionIds || []),
                  ...((user as any).correct_questions || []),
                  ...(user.failedQuestionIds || []),
                  ...((user as any).failed_questions || []),
                  ...(freshUserProgression?.answeredQuestionIds || []),
                  ...(freshUserProgression?.answered_questions || []),
                  ...(freshUserProgression?.correctQuestionIds || []),
                  ...(freshUserProgression?.correct_questions || []),
                  ...(freshUserProgression?.failedQuestionIds || []),
                  ...(freshUserProgression?.failed_questions || [])
                ];
                const answeredIds = new Set(answeredList);

                const correctList = [
                  ...(user.correctQuestionIds || []),
                  ...((user as any).correct_questions || []),
                  ...(freshUserProgression?.correctQuestionIds || []),
                  ...(freshUserProgression?.correct_questions || [])
                ];
                const correctIds = new Set(correctList);

                const failedList = [
                  ...(user.failedQuestionIds || []),
                  ...((user as any).failed_questions || []),
                  ...(freshUserProgression?.failedQuestionIds || []),
                  ...(freshUserProgression?.failed_questions || [])
                ];
                const failedIds = new Set(failedList);
                
                const answeredCount = answeredIds.size;
                const neverSeenCount = Math.max(0, totalBank - answeredCount);
                const coveragePct = totalBank > 0 ? Math.round((answeredCount / totalBank) * 100) : 0;
                const correctPct = answeredCount > 0 ? Math.round((correctIds.size / answeredCount) * 100) : 0;

                const ambits = ['Àmbit A', 'Àmbit B', 'Àmbit C', 'Actualitat'];
                const ambitStats = ambits.map(amb => {
                  const bankInAmbit = QUESTIONS_BANK.filter(q => q.ambit === amb);
                  const totalInAmbit = bankInAmbit.length;
                  const answeredInAmbit = bankInAmbit.filter(q => answeredIds.has(q.id)).length;
                  const correctInAmbit = bankInAmbit.filter(q => correctIds.has(q.id)).length;
                  const pendingInAmbit = Math.max(0, totalInAmbit - answeredInAmbit);
                  const pct = totalInAmbit > 0 ? Math.round((answeredInAmbit / totalInAmbit) * 100) : 0;
                  const successPct = answeredInAmbit > 0 ? Math.round((correctInAmbit / answeredInAmbit) * 100) : 0;
                  return {
                    amb,
                    total: totalInAmbit,
                    answered: answeredInAmbit,
                    pending: pendingInAmbit,
                    pct,
                    successPct
                  };
                });

                return (
                  <div className="space-y-4">
                    {/* Targetes Resum */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Cobertura Global</div>
                        <div className="text-xl font-black text-sky-400 mt-1">{coveragePct}%</div>
                        <div className="text-[10px] text-slate-500">{answeredCount} de {totalBank}</div>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Verges (Per descobrir)</div>
                        <div className="text-xl font-black text-rose-400 mt-1">{neverSeenCount}</div>
                        <div className="text-[10px] text-slate-500">preguntes pendents</div>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Encerts (% Èxit)</div>
                        <div className="text-xl font-black text-emerald-400 mt-1">{correctPct}%</div>
                        <div className="text-[10px] text-slate-500">{correctIds.size} encertades</div>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">A Repassar</div>
                        <div className="text-xl font-black text-amber-400 mt-1">{failedIds.size}</div>
                        <div className="text-[10px] text-slate-500">preguntes fallades</div>
                      </div>
                    </div>

                    {/* Barra de Progrés Global */}
                    <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1.5">
                      <div className="flex justify-between font-bold text-slate-300">
                        <span>Progrés complet del temari oficial:</span>
                        <span className="text-sky-400">{answeredCount} / {totalBank} ({coveragePct}%)</span>
                      </div>
                      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 via-emerald-500 to-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${coveragePct}%` }}
                        />
                      </div>
                    </div>

                    {/* Desglossament per Àmbits */}
                    <div className="space-y-2.5">
                      <h5 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-amber-400" />
                        <span>Detall per Àmbit de la Guia 2026</span>
                      </h5>

                      <div className="space-y-2">
                        {ambitStats.map(stat => (
                          <div key={stat.amb} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-slate-100">{stat.amb}</span>
                              <div className="flex items-center gap-3 text-[11px]">
                                <span className="text-emerald-400">{stat.answered} tocades</span>
                                <span className="text-rose-400 font-bold">{stat.pending} verges</span>
                                <span className="text-sky-300 font-black">{stat.pct}%</span>
                              </div>
                            </div>
                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-sky-500 rounded-full transition-all"
                                style={{ width: `${stat.pct}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Total al banc: {stat.total} preguntes</span>
                              <span>Taxa d'encert: {stat.successPct}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsStudyReportOpen(false)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow"
              >
                Entès, continuar estudiant
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
