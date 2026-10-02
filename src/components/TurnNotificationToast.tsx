import React from 'react';
import { InAppNotification } from '../types';
import { Swords, X, Play, Bell } from 'lucide-react';
import { AudioEngine } from '../utils/audio';

interface TurnNotificationToastProps {
  notification: InAppNotification | null;
  onOpenMatch: (matchId?: string) => void;
  onDismiss: () => void;
}

export const TurnNotificationToast: React.FC<TurnNotificationToastProps> = ({
  notification,
  onOpenMatch,
  onDismiss
}) => {
  if (!notification) return null;

  const isOca = notification.type === 'oca_overtake';
  const badgeLabel = notification.type === 'turn_notification'
    ? 'TORN DE DUEL'
    : notification.type === 'defeat_revenge'
      ? 'REVENJA DISPONIBLE'
      : notification.type === 'oca_overtake'
        ? "CURSA DE L'OCA"
        : 'NOTIFICACIÓ';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md animate-bounce-short shadow-2xl">
      <div className="bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl p-3.5 sm:p-4 backdrop-blur-xl shadow-amber-500/20 text-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
            {isOca ? (
              <Bell className="w-5 h-5 text-slate-950" />
            ) : (
              <Swords className="w-5 h-5 text-slate-950" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
                {badgeLabel}
              </span>
              <span className="text-[10px] text-slate-400">Ara mateix</span>
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-white truncate mt-0.5">
              {notification.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              AudioEngine.playClick();
              onOpenMatch(notification.matchId);
            }}
            className="py-1.5 px-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            <Play className="w-3 h-3 fill-slate-950" />
            <span>{isOca ? 'Veure' : 'Jugar'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              AudioEngine.playClick();
              onDismiss();
            }}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
