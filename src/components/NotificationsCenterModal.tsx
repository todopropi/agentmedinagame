import React, { useState, useEffect } from 'react';
import { UserProfile, NotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES, InAppNotification } from '../types';
import { 
  requestPushPermissionAndToken, 
  sendTestNotificationToSelf,
  fetchUserNotificationsList,
  deleteUserNotification,
  clearAllUserNotifications,
  markAllUserNotificationsAsRead
} from '../utils/pushNotifications';
import { AudioEngine } from '../utils/audio';
import { 
  Bell, 
  X, 
  Swords, 
  Dice5, 
  Sparkles, 
  Smartphone,
  Trash2,
  Inbox,
  Settings,
  Clock,
  Play,
  ArrowRight,
  Zap,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface NotificationsCenterModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePreferences: (preferences: NotificationPreferences) => void;
  deferredPrompt?: any;
  onOpenDuelMatch?: (matchId: string) => void;
  onNavigateToCampanya?: () => void;
  onNotificationsCountChange?: (count: number) => void;
}

export const NotificationsCenterModal: React.FC<NotificationsCenterModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdatePreferences,
  deferredPrompt,
  onOpenDuelMatch,
  onNavigateToCampanya,
  onNotificationsCountChange
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'settings'>('list');
  const [notificationsList, setNotificationsList] = useState<InAppNotification[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);

  const [preferences, setPreferences] = useState<NotificationPreferences>(() => ({
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...(user.notificationPreferences || {})
  }));

  const [devicePermission, setDevicePermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // Carregar notificacions
  const loadNotifications = async () => {
    if (!user?.uid) return;
    setIsLoadingList(true);
    try {
      const list = await fetchUserNotificationsList(user.uid);
      setNotificationsList(list);
    } catch (e) {
      console.warn('Error loading notifications:', e);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      // Marcar com a llegides en obrir el centre de notificacions perquè desaparegui el badge numèric
      markAllUserNotificationsAsRead(user.uid).then(() => {
        onNotificationsCountChange?.(0);
      }).catch(() => {});

      if (typeof window !== 'undefined' && 'Notification' in window) {
        setDevicePermission(Notification.permission);
      }
      if (user.notificationPreferences) {
        setPreferences(prev => ({
          ...prev,
          ...user.notificationPreferences
        }));
      }
    }
  }, [isOpen, user.uid, user.notificationPreferences]);

  if (!isOpen) return null;

  const handleDeleteItem = async (notifId: string) => {
    AudioEngine.playClick();
    const updated = notificationsList.filter(n => n.id !== notifId);
    setNotificationsList(updated);
    onNotificationsCountChange?.(updated.filter(n => !n.read).length);
    await deleteUserNotification(user.uid, notifId);
  };

  const handleClearAllItems = async () => {
    AudioEngine.playClick();
    setNotificationsList([]);
    onNotificationsCountChange?.(0);
    await clearAllUserNotifications(user.uid);
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    AudioEngine.playClick();
    const updated = {
      ...preferences,
      [key]: !preferences[key]
    };
    setPreferences(updated);
    onUpdatePreferences(updated);
  };

  const handleRequestPermission = async () => {
    AudioEngine.playClick();
    setIsRequestingPermission(true);
    try {
      const res = await requestPushPermissionAndToken(user.uid);
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setDevicePermission(Notification.permission);
      }
      if (res && res.token) {
        const updated = { ...preferences, enabled: true };
        setPreferences(updated);
        onUpdatePreferences(updated);
      }
    } catch (e) {
      console.warn('Permission request error:', e);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleSendTest = async () => {
    AudioEngine.playClick();
    setTestSent(true);
    try {
      await sendTestNotificationToSelf({
        uid: user.uid,
        displayName: user.displayName
      });
      setTimeout(() => {
        setTestSent(false);
        loadNotifications();
      }, 2500);
    } catch (e) {
      setTestSent(false);
    }
  };

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    AudioEngine.playClick();
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setInstallSuccess(true);
    }
  };

  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return 'Recent';
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Ara mateix';
    if (diffMins < 60) return `Fa ${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Fa ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Fa ${diffDays}d`;
  };

  const isGranted = devicePermission === 'granted';
  const isDenied = devicePermission === 'denied';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Capçalera neta */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                Centre de Notificacions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeTab === 'list' ? 'Historial i avisos rebuts' : 'Preferències del dispositiu'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              AudioEngine.playClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Tancar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PESTANYES MÒBIL / ESCRIPTORI */}
        <div className="flex border-b border-slate-800 bg-slate-950/70 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              AudioEngine.playClick();
              setActiveTab('list');
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Rebudes</span>
            {notificationsList.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'list' ? 'bg-slate-950 text-amber-300' : 'bg-red-500 text-white'
              }`}>
                {notificationsList.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              AudioEngine.playClick();
              setActiveTab('settings');
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Ajustos i Sons</span>
          </button>
        </div>

        {/* CONTINGUT DE LA PESTANYA 1: LLISTAT DE NOTIFICACIONS */}
        {activeTab === 'list' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3">
            {/* Barra d'accions ràpides */}
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800/60">
              <span className="font-bold text-slate-400">
                {notificationsList.length === 0
                  ? 'Sense notificacions pendents'
                  : `${notificationsList.length} ${notificationsList.length === 1 ? 'notificació rebuda' : 'notificacions rebudes'}`}
              </span>

              {notificationsList.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllItems}
                  className="px-2.5 py-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-500/30 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                  title="Esborrar totes les notificacions"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Esborrar tot</span>
                </button>
              )}
            </div>

            {/* Llistat buit */}
            {notificationsList.length === 0 && !isLoadingList && (
              <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500 mb-3">
                  <Inbox className="w-8 h-8 opacity-60" />
                </div>
                <h4 className="text-sm font-black text-white">
                  Bústia de notificacions buida
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                  Quan un rival t'enviï un <strong>Toc de duel</strong>, respongui al seu torn o t'avanci al tauler de l'Oca, apareixerà aquí perquè puguis gestionar-ho còmodament des del mòbil.
                </p>
                <button
                  type="button"
                  onClick={loadNotifications}
                  className="mt-4 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Actualitzar</span>
                </button>
              </div>
            )}

            {/* Targetes de notificació (Disseny mòbil tàctil) */}
            {notificationsList.map((notif) => {
              const isDuel = Boolean(notif.matchId || notif.type === 'turn_notification' || notif.type === 'toc_alert' || notif.type === 'match_challenge');
              const isOvertake = notif.type === 'oca_overtake';
              const isToc = notif.type === 'toc_alert' || notif.message?.includes('TOC') || notif.title?.includes('Toc');

              return (
                <div 
                  key={notif.id}
                  className={`p-3.5 rounded-2xl border transition-all relative overflow-hidden flex flex-col gap-2 shadow-sm ${
                    isToc
                      ? 'bg-rose-950/25 border-rose-500/50 hover:border-rose-400'
                      : isDuel
                        ? 'bg-slate-950/70 border-amber-500/40 hover:border-amber-400/80'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Capçalera de la targeta */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                        isToc 
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
                          : isDuel 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                            : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                      }`}>
                        {isToc ? <Zap className="w-3.5 h-3.5" /> : isDuel ? <Swords className="w-3.5 h-3.5" /> : <Dice5 className="w-3.5 h-3.5" />}
                      </div>

                      <div className="min-w-0">
                        <span className="text-[11px] font-black text-amber-300 truncate block">
                          {notif.fromName || 'Agent Medina'}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          <span>{formatTimeAgo(notif.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Botó eliminar aquesta notificació */}
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(notif.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Eliminar notificació"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Cos del missatge */}
                  <p className="text-xs text-slate-200 leading-snug font-medium pr-1">
                    {notif.message}
                  </p>

                  {/* Botons d'acció directes */}
                  {isDuel && notif.matchId && onOpenDuelMatch && (
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          AudioEngine.playClick();
                          onClose();
                          onOpenDuelMatch(notif.matchId!);
                        }}
                        className="w-full py-2 px-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-slate-950" />
                        <span>⚔️ JUGAR EL DUEL ARA</span>
                      </button>
                    </div>
                  )}

                  {isOvertake && onNavigateToCampanya && (
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          AudioEngine.playClick();
                          onClose();
                          onNavigateToCampanya();
                        }}
                        className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                      >
                        <ArrowRight className="w-3 h-3" />
                        <span>🎲 ANAR AL TAULER DE L'OCA</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* CONTINGUT DE LA PESTANYA 2: AJUSTOS I CONFIGURACIÓ */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Estat General del Dispositiu */}
            <div className={`p-4 rounded-2xl border transition-all ${
              isGranted && preferences.enabled
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                : isDenied
                  ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                  : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={`w-3 h-3 rounded-full ${
                    isGranted && preferences.enabled 
                      ? 'bg-emerald-400 animate-pulse' 
                      : isDenied 
                        ? 'bg-rose-400' 
                        : 'bg-amber-400'
                  }`} />
                  <div>
                    <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                      <span>
                        {isGranted && preferences.enabled 
                          ? 'Notificacions Actives' 
                          : isDenied 
                            ? 'Notificacions Bloquejades al Navegador' 
                            : 'Notificacions Inactives'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isGranted && preferences.enabled 
                        ? 'El teu dispositiu rep avisos automàtics quan et toca jugar o t\'avancen.' 
                        : isDenied
                          ? 'El navegador té bloquejat el permís. Toca la icona 🔒 al costat de la URL i activa "Notificacions".'
                          : 'Activa els permisos al dispositiu per rebre alertes de torns.'}
                    </p>
                  </div>
                </div>

                {!isGranted ? (
                  <button
                    onClick={handleRequestPermission}
                    disabled={isRequestingPermission}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer shrink-0"
                  >
                    {isRequestingPermission ? 'Sol·licitant...' : 'Activar Notificacions'}
                  </button>
                ) : (
                  <button
                    onClick={handleSendTest}
                    disabled={testSent}
                    className="w-full sm:w-auto px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{testSent ? 'Enviada!' : 'Provar avís'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Opció d'instal·lació com a aplicació si està disponible */}
            {deferredPrompt && !installSuccess && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/40 to-blue-950/40 border border-sky-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">Instal·lar aplicació al telèfon</h4>
                    <p className="text-[11px] text-slate-400">Icona a la pantalla d'inici i pantalla completa.</p>
                  </div>
                </div>
                <button
                  onClick={handleInstallApp}
                  className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-sky-500/20 active:scale-95 cursor-pointer shrink-0"
                >
                  Instal·lar
                </button>
              </div>
            )}

            {/* Secció 1: Duels 1v1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                <Swords className="w-4 h-4 text-sky-400" />
                <span>Duels 1v1</span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
                {/* Torn pendent */}
                <div className="flex items-center justify-between gap-3">
                  <div className="pr-2">
                    <div className="text-xs sm:text-sm font-bold text-white">
                      Torns de partida
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      Avisa'm quan el/la rival respongui i torni a ser el meu torn.
                    </p>
                  </div>
                  <ToggleSwitch 
                    checked={preferences.duelTurns} 
                    onChange={() => handleToggle('duelTurns')} 
                  />
                </div>

                <div className="border-t border-slate-800/80" />

                {/* Avís de derrota i revenja */}
                <div className="flex items-center justify-between gap-3">
                  <div className="pr-2">
                    <div className="text-xs sm:text-sm font-bold text-white">
                      Avisos de derrota i revenja
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                      Avisa'm si perdo una partida per motivar-me i poder demanar revenja.
                    </p>
                  </div>
                  <ToggleSwitch 
                    checked={preferences.duelDefeat} 
                    onChange={() => handleToggle('duelDefeat')} 
                  />
                </div>
              </div>
            </div>

            {/* Secció 2: Taulers de l'Oca */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                <Dice5 className="w-4 h-4 text-amber-400" />
                <span>Taulers de l'Oca • Avançaments</span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white">
                      Àmbit A • Institucional i Polític
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Avisa'm quan un/a company/a m'avança al Tauler A.
                    </p>
                  </div>
                  <ToggleSwitch 
                    checked={preferences.ocaOvertakeAmbitA} 
                    onChange={() => handleToggle('ocaOvertakeAmbitA')} 
                  />
                </div>

                <div className="border-t border-slate-800/80" />

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white">
                      Àmbit B • Seguretat Pública i Policial
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Avisa'm quan un/a company/a m'avança al Tauler B.
                    </p>
                  </div>
                  <ToggleSwitch 
                    checked={preferences.ocaOvertakeAmbitB} 
                    onChange={() => handleToggle('ocaOvertakeAmbitB')} 
                  />
                </div>

                <div className="border-t border-slate-800/80" />

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white">
                      Àmbit C • Actualitat i Coneixements
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Avisa'm quan un/a company/a m'avança al Tauler C.
                    </p>
                  </div>
                  <ToggleSwitch 
                    checked={preferences.ocaOvertakeAmbitC} 
                    onChange={() => handleToggle('ocaOvertakeAmbitC')} 
                  />
                </div>

                <div className="border-t border-slate-800/80" />

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white">
                      Àmbit D • Coneixement del Territori
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Avisa'm quan un/a company/a m'avança al Tauler D.
                    </p>
                  </div>
                  <ToggleSwitch 
                    checked={preferences.ocaOvertakeAmbitD} 
                    onChange={() => handleToggle('ocaOvertakeAmbitD')} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Peu de la finestra */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={() => {
              AudioEngine.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-750 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
          >
            Tancar
          </button>
        </div>
      </div>
    </div>
  );
};

// Component Interruptor net
interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-amber-500' : 'bg-slate-800'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
};
