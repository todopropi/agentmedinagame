import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { 
  loginWithGoogle, 
  loginWithEmailPassword, 
  registerWithEmailPassword, 
  loginAsGuest,
  getUnauthorizedDomainAlert,
  subscribeUnauthorizedDomainAlert,
  UnauthorizedDomainInfo
} from '../firebase';
import { syncSupabaseProfile } from '../../supabase';
import { OfficialEmblem } from './OfficialEmblem';
import { Shield, Sparkles, Mail, Lock, User, AlertCircle, ArrowRight, Copy, Check, Info } from 'lucide-react';

interface AuthModalProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unauthorizedInfo, setUnauthorizedInfo] = useState<UnauthorizedDomainInfo | null>(getUnauthorizedDomainAlert());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = subscribeUnauthorizedDomainAlert((info) => {
      setUnauthorizedInfo(info);
    });
    return unsub;
  }, []);

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const profile = await loginWithGoogle();
      const userId = profile.uid || (profile as any).id || '';
      await syncSupabaseProfile({
        uid: userId,
        username: profile.displayName || 'Aspirant',
        total_points: profile.xp ?? 0
      });
      onLoginSuccess(profile);
    } catch (err: any) {
      const msg = err?.message || 'Error en iniciar sessió amb Google.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAuth = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const profile = await loginAsGuest(displayName || 'Aspirant Medina');
      const userId = profile.uid || (profile as any).id || '';
      await syncSupabaseProfile({
        uid: userId,
        username: profile.displayName || displayName || 'Aspirant Medina',
        total_points: profile.xp ?? 0
      });
      onLoginSuccess(profile);
    } catch (err: any) {
      setErrorMsg('No s\'ha pogut iniciar la sessió en mode Aspirant.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Si us plau, omple el correu i la contrasenya.');
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      let profile: UserProfile;
      if (isRegisterMode) {
        if (!displayName) {
          setErrorMsg('Introdueix el teu nom o àlies policial.');
          setLoading(false);
          return;
        }
        profile = await registerWithEmailPassword(email, password, displayName);
      } else {
        profile = await loginWithEmailPassword(email, password);
      }
      const userId = profile.uid || (profile as any).id || '';
      await syncSupabaseProfile({
        uid: userId,
        username: profile.displayName || displayName || 'Aspirant',
        total_points: profile.xp ?? 0
      });
      onLoginSuccess(profile);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error en autenticar. Comprova les dades.');
    } finally {
      setLoading(false);
    }
  };

  const copyDomain = () => {
    const domain = unauthorizedInfo?.domain || window.location.hostname;
    navigator.clipboard.writeText(domain);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden max-h-[95vh] overflow-y-auto">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Emblema corporatiu oficial */}
        <div className="flex flex-col items-center text-center mb-5">
          <OfficialEmblem size={100} />
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-3">
            Agent Medina
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs">
            Plataforma de gamificació per a opositores a Mossos d'Esquadra i Policia Local
          </p>
        </div>

        {/* Informació de perfil obligatori */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 mb-5 text-xs text-slate-300 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200">Accés segur:</span> El teu progrés d'XP, mèrits acumulats, escut equipat i duels 1v1 es desen al teu perfil.
          </div>
        </div>

        {/* Unauthorized Domain Explanatory Helper if encountered */}
        {unauthorizedInfo && (
          <div className="mb-4 p-3.5 bg-amber-950/50 border border-amber-800/70 rounded-2xl text-xs text-amber-200/90 space-y-2">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">Domini en vista prèvia:</span> Aquest entorn ({unauthorizedInfo.domain}) requereix autorització a Firebase Console per a Google OAuth directe.
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-900/60">
              <span className="font-mono text-[11px] text-amber-300/80 truncate">{unauthorizedInfo.domain}</span>
              <button
                type="button"
                onClick={copyDomain}
                className="shrink-0 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-amber-500/30 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiat' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Hero Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-md shadow-slate-950/30 mb-2.5 disabled:opacity-60 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="text-sm font-extrabold">Entrar amb el compte de Google</span>
        </button>

        {/* Resilient Guest / Local Aspirant Login (Ensures immediate access on any domain) */}
        <button
          type="button"
          onClick={handleGuestAuth}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-slate-800/90 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700/80 font-bold rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 text-xs shadow-sm mb-4 cursor-pointer disabled:opacity-60"
        >
          <Shield className="w-4 h-4 text-amber-400" />
          <span>Accés Ràpid com a Aspirant (Mode Local / Preview)</span>
        </button>

        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] text-slate-500 font-medium uppercase tracking-wider">o amb correu</span>
          <div className="border-t border-slate-800 w-full" />
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nom o Àlies policial</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex: Mosso Medina"
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Correu electrònic</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="opositor@correu.cat"
                className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Contrasenya</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-60"
          >
            <span>{isRegisterMode ? 'Crear compte policial' : 'Iniciar sessió'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-slate-400">
          {isRegisterMode ? (
            <span>
              Ja tens un perfil?{' '}
              <button
                type="button"
                onClick={() => setIsRegisterMode(false)}
                className="text-amber-400 hover:underline font-bold"
              >
                Inicia sessió
              </button>
            </span>
          ) : (
            <span>
              Nou aspirant?{' '}
              <button
                type="button"
                onClick={() => setIsRegisterMode(true)}
                className="text-amber-400 hover:underline font-bold"
              >
                Crea el teu perfil
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
