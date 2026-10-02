import React, { useState, useEffect } from 'react';
import { UserProfile, AcademyContactInfo } from '../types';
import { redeemInvitationCode, fetchAcademyContactInfo, DEFAULT_ACADEMY_CONTACT, submitRenewalRequest } from '../../supabase';
import { 
  Key, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  MessageCircle, 
  Mail, 
  Send, 
  X, 
  ShieldCheck, 
  Sparkles, 
  CreditCard,
  Crown,
  Phone,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  currentUser: UserProfile | null;
  isLockedMode?: boolean;
  onSubscriptionUpdated: (newExpiresAt: string | null, isUnlimited: boolean) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isLockedMode = false,
  onSubscriptionUpdated
}) => {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState<AcademyContactInfo>(DEFAULT_ACADEMY_CONTACT);

  // Formulari de sol·licitud de renovació a l'Administrador
  const [showRenewalForm, setShowRenewalForm] = useState(false);
  const [requestType, setRequestType] = useState('Renovació d\'accés (1 mes - 30 dies)');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAcademyContactInfo().then(info => {
        if (info) setContactInfo(info);
      }).catch(console.warn);
    }
  }, [isOpen]);

  const handleSendRenewalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setSendingRequest(true);
      setRequestFeedback(null);

      const res = await submitRenewalRequest({
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Aspirant',
        userEmail: currentUser.email || '',
        requestType,
        phone: phone.trim(),
        message: message.trim()
      });

      if (res.success) {
        setRequestFeedback({
          type: 'success',
          message: 'Sol·licitud enviada a l\'administrador! Rebràs confirmació o activació aviat.'
        });
        try {
          confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        } catch {}
        setMessage('');
        setPhone('');
        setTimeout(() => {
          setShowRenewalForm(false);
          setRequestFeedback(null);
        }, 3500);
      } else {
        setRequestFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setRequestFeedback({ type: 'error', message: err?.message || 'Error en enviar la sol·licitud.' });
    } finally {
      setSendingRequest(false);
    }
  };

  if (!isOpen) return null;

  // Càlcul de dies/hores restants
  const isUnlimited = Boolean(currentUser?.isUnlimited || currentUser?.subscriptionStatus === 'unlimited');
  let remainingText = '';
  let isExpired = false;
  let isTrial = currentUser?.subscriptionStatus === 'trial';

  if (isUnlimited) {
    remainingText = 'Accés Ilimitat (VIP)';
  } else if (currentUser?.subscriptionExpiresAt) {
    const expTime = new Date(currentUser.subscriptionExpiresAt).getTime();
    const diff = expTime - Date.now();
    if (diff <= 0) {
      isExpired = true;
      remainingText = 'Subscripció Caducada';
    } else {
      const days = Math.floor(diff / (24 * 3600 * 1000));
      const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
      if (days > 0) {
        remainingText = `${days} dies i ${hours}h restants`;
      } else {
        remainingText = `${hours} hores restants`;
      }
    }
  } else {
    isExpired = true;
    remainingText = 'Sense subscripció activa';
  }

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!code.trim()) {
      setErrorMsg('Si us plau, escriu el teu codi d\'invitació.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await redeemInvitationCode(code, {
        uid: currentUser.uid,
        email: currentUser.email || '',
        username: currentUser.displayName || 'Aspirant'
      });

      if (res.success) {
        setSuccessMsg(res.message);
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch {}
        onSubscriptionUpdated(res.newExpiresAt || null, Boolean(res.isUnlimited));
        setCode('');
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error en activar el codi.');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappClean = (contactInfo.whatsapp_number || '').replace(/[^0-9]/g, '');
  const whatsappUrl = whatsappClean 
    ? `https://wa.me/${whatsappClean}?text=${encodeURIComponent('Hola, vull renovar/obtenir un codi d\'accés per a Agent Medina per al meu compte: ' + (currentUser?.email || ''))}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto pretty-scrollbar">
        {/* Tancar si no és mode bloquejat */}
        {!isLockedMode && onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Capçalera */}
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-3.5 rounded-2xl border ${
            isUnlimited 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
              : isExpired 
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}>
            {isUnlimited ? <Crown className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-100">
              {isLockedMode ? 'Accés Requereix Subscripció' : 'Estat de la teva Subscripció'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestiona el teu període d'accés a tot el temari i simulacions
            </p>
          </div>
        </div>

        {/* Caixa d'estat actual */}
        <div className={`p-4 rounded-2xl border mb-6 ${
          isUnlimited
            ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
            : isExpired
              ? 'bg-red-950/30 border-red-500/30 text-red-200'
              : 'bg-slate-950/60 border-slate-800 text-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
              Estat de l'accés
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
              isUnlimited
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : isExpired
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : isTrial
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {isUnlimited ? 'IL·LIMITAT' : isExpired ? 'CADUCAT' : isTrial ? 'CORTESIA 48H' : 'ACTIU'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-100">{remainingText}</span>
          </div>
          {currentUser?.subscriptionExpiresAt && !isUnlimited && (
            <p className="text-[11px] text-slate-400 mt-1">
              Data de finalització: {new Date(currentUser.subscriptionExpiresAt).toLocaleDateString('ca-ES', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>

        {/* Missatges de feedback */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Formulari per introduir codi */}
        <form onSubmit={handleRedeem} className="space-y-3 mb-6">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Tens un Codi d'Invitació o Renovació?
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ex: MEDINA-7D-8K2A"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-100 font-mono tracking-wider focus:outline-none focus:border-amber-500 uppercase placeholder:normal-case placeholder:font-sans"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !code.trim()}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all disabled:opacity-40 shadow-lg shadow-amber-500/20 shrink-0"
            >
              {submitting ? 'Validant...' : 'Activar'}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Els codis són d'un sol ús i sumen automàticament els dies a la teva subscripció.
          </p>
        </form>

        {/* Contacte amb l'Administrador / Comprar llicència */}
        <div className="pt-4 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            Com obtenir o renovar el teu accés:
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            {contactInfo.payment_instructions || 'Pots enviar una sol·licitud directa a l\'administrador des d\'aquí o contactar per missatgeria.'}
          </p>

          {/* Botó directe per obrir formulari a l'Admin (estil Impugnar) */}
          <button
            type="button"
            onClick={() => setShowRenewalForm(!showRenewalForm)}
            className="w-full mb-3 flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 transition-all shadow-md group cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <div className="text-slate-100 font-black text-xs sm:text-sm flex items-center gap-1.5">
                  <span>📩 Sol·licitar Renovació a l'Administrador</span>
                </div>
                <div className="text-[11px] text-slate-400 font-normal">
                  Comunica el pagament (Bizum/Transferència) o demana ampliació
                </div>
              </div>
            </div>
            <span className="text-[11px] px-2.5 py-1 bg-amber-500 text-slate-950 font-black rounded-lg shrink-0">
              {showRenewalForm ? 'Tancar' : 'Sol·licitar'}
            </span>
          </button>

          {/* Formulari d'enviament de sol·licitud a l'Administrador */}
          {showRenewalForm && (
            <form onSubmit={handleSendRenewalRequest} className="mb-4 p-4 rounded-2xl bg-slate-950/80 border border-amber-500/40 space-y-3 shadow-inner">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">Missatge per a l'Administrador</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {currentUser?.email}
                </span>
              </div>

              {requestFeedback && (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-xs border ${
                  requestFeedback.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}>
                  {requestFeedback.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{requestFeedback.message}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tipus de Sol·licitud
                </label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Renovació d'accés (1 mes - 30 dies)">🔄 Renovació d'accés (1 mes - 30 dies)</option>
                  <option value="Renovació d'accés (3 mesos - 90 dies)">🚀 Renovació d'accés (3 mesos - 90 dies)</option>
                  <option value="Renovació d'accés (6 mesos - 180 dies)">👑 Renovació d'accés (6 mesos - 180 dies)</option>
                  <option value="Accés Il·limitat Convocatòria (VIP)">🏆 Accés Il·limitat Convocatòria (VIP)</option>
                  <option value="Pagament realitzat per Bizum / Transferència">💶 Pagament realitzat per Bizum / Transferència</option>
                  <option value="Sol·licitud de nou codi d'accés">🔑 Sol·licitud de nou codi d'accés</option>
                  <option value="Altre dubte o consulta de llicència">❓ Altre dubte o consulta de llicència</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Telèfon / WhatsApp de contacte</span>
                  <span className="text-[10px] text-slate-500 font-normal">Opcional (per rebre resposta ràpida)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: 612 34 56 78"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 placeholder:text-slate-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Detalls o missatge per a l'administrador</span>
                  <span className="text-[10px] text-slate-500 font-normal">Opcional</span>
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex: He enviat el pagament per Bizum amb el meu nom, m'agradaria activar 3 mesos..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 placeholder:text-slate-600 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={sendingRequest}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingRequest ? 'Enviant sol·licitud...' : 'Enviar Missatge a l\'Administrador'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRenewalForm(false)}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold cursor-pointer"
                >
                  Tancar
                </button>
              </div>
            </form>
          )}

          <div className="flex flex-wrap gap-2">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 text-xs font-bold transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                Contactar per WhatsApp
              </a>
            )}

            {contactInfo.telegram_handle && (
              <a
                href={`https://t.me/${contactInfo.telegram_handle.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-600/20 border border-sky-500/40 text-sky-300 hover:bg-sky-600/30 text-xs font-bold transition-colors"
              >
                <Send className="w-4 h-4 text-sky-400" />
                Telegram: {contactInfo.telegram_handle}
              </a>
            )}

            {contactInfo.support_email && (
              <a
                href={`mailto:${contactInfo.support_email}?subject=Sol%C2%B7licitud%20Codi%20Agent%20Medina&body=Hola%2C%20vull%20obtenir%20un%20codi%20d'acc%C3%A8s%20per%20a%20${encodeURIComponent(currentUser?.email || '')}`}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-750 text-xs font-medium transition-colors"
              >
                <Mail className="w-4 h-4 text-slate-400" />
                {contactInfo.support_email}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
