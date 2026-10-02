import React, { useState, useEffect } from 'react';
import { UserProfile, NotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES } from '../types';
import { 
  requestPushPermissionAndToken, 
  sendTestNotificationToSelf 
} from '../utils/pushNotifications';
import { AudioEngine } from '../utils/audio';
import { 
  Bell, 
  X, 
  Check, 
  Swords, 
  Dice5, 
  Sparkles, 
  Volume2, 
  ShieldCheck, 
  Smartphone,
  ChevronRight
} from 'lucide-react';

interface NotificationsCenterModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePreferences: (preferences: NotificationPreferences) => void;
  deferredPrompt?: any;
}

export const NotificationsCenterModal: React.FC<NotificationsCenterModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdatePreferences,
  deferredPrompt
}) => {
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

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && 'Notification' in window) {
      setDevicePermission(Notification.permission);
    }
    if (user.notificationPreferences) {
      setPreferences(prev => ({
        ...prev,
        ...user.notificationPreferences
      }));
    }
  }, [isOpen, user.notificationPreferences]);

  if (!isOpen) return null;

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
      setTimeout(() => setTestSent(false), 4000);
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

  const isGranted = devicePermission === 'granted';
  const isDenied = devicePermission === 'denied';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Capçalera neta */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                Configuració de Notificacions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Personalitza com i quan vols rebre els avisos
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              AudioEngine.playClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contingut Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
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
                        ? 'El teu navegador té bloquejat el permís. Toca la icona del cadenat 🔒 al costat de la URL i activa "Notificacions".'
                        : 'Activa els permisos al teu dispositiu per rebre alertes de torns.'}
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
                    Avisa'm quan el/la meu/va rival respongui i torni a ser el meu torn.
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
                    Avisa'm si perdo una partida per motivar-me i poder demanar la revenja immediata.
                  </p>
                </div>
                <ToggleSwitch 
                  checked={preferences.duelDefeat} 
                  onChange={() => handleToggle('duelDefeat')} 
                />
              </div>
            </div>
          </div>

          {/* Secció 2: Taulers de l'Oca (Avançaments de companys/es) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-300 uppercase tracking-wider">
              <Dice5 className="w-4 h-4 text-amber-400" />
              <span>Taulers de l'Oca • Avisos d'Avançament</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Rep un avís immediat si un/a company/a et supera en caselles a la ruta d'oposició:
            </p>

            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
              {/* Àmbit A */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white">
                    Àmbit A • Institucional i Polític
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Avisa'm quan un/a company/a m'avança de casella al Tauler A.
                  </p>
                </div>
                <ToggleSwitch 
                  checked={preferences.ocaOvertakeAmbitA} 
                  onChange={() => handleToggle('ocaOvertakeAmbitA')} 
                />
              </div>

              <div className="border-t border-slate-800/80" />

              {/* Àmbit B */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white">
                    Àmbit B • Seguretat Pública i Policial
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Avisa'm quan un/a company/a m'avança de casella al Tauler B.
                  </p>
                </div>
                <ToggleSwitch 
                  checked={preferences.ocaOvertakeAmbitB} 
                  onChange={() => handleToggle('ocaOvertakeAmbitB')} 
                />
              </div>

              <div className="border-t border-slate-800/80" />

              {/* Àmbit C */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white">
                    Àmbit C • Actualitat i Coneixements
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Avisa'm quan un/a company/a m'avança de casella al Tauler C.
                  </p>
                </div>
                <ToggleSwitch 
                  checked={preferences.ocaOvertakeAmbitC} 
                  onChange={() => handleToggle('ocaOvertakeAmbitC')} 
                />
              </div>

              <div className="border-t border-slate-800/80" />

              {/* Àmbit D */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white">
                    Àmbit D • Coneixement del Territori
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Avisa'm quan un/a company/a m'avança de casella al Tauler D.
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

        {/* Peu de la finestra */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={() => {
              AudioEngine.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-750 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
          >
            Fet
          </button>
        </div>
      </div>
    </div>
  );
};

// Component Interruptor net tipus iOS / Android
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
