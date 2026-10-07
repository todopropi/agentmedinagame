import React, { useState } from 'react';
import { AudioEngine } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Package, Sparkles, Coins, Zap, Shield, Check, X } from 'lucide-react';

export interface TacticalReward {
  type: 'merits' | 'wildcard' | 'streak_shield';
  title: string;
  amount: number;
  icon: string;
  description: string;
}

interface TacticalChestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaim: (reward: TacticalReward) => void;
  sourceText?: string;
}

export const TacticalChestModal: React.FC<TacticalChestModalProps> = ({
  isOpen,
  onClose,
  onClaim,
  sourceText = "Enhorabona per la teva fita tàctica a l'oposició!"
}) => {
  const [isOpened, setIsOpened] = useState(false);
  const [reward, setReward] = useState<TacticalReward | null>(null);

  if (!isOpen) return null;

  const handleOpenChest = () => {
    if (isOpened) return;
    AudioEngine.playChestOpen();

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Possibles recompenses aleatòries
    const possibleRewards: TacticalReward[] = [
      {
        type: 'merits',
        title: '+50 MÈRITS POLICIALS',
        amount: 50,
        icon: '🪙',
        description: 'Mèrits addicionals per desbloquejar escuts i material a la Botiga!'
      },
      {
        type: 'merits',
        title: '+75 MÈRITS EXTRAORDINARIS',
        amount: 75,
        icon: '💰',
        description: 'Bonificació d’honor de la prefectura de policia.'
      },
      {
        type: 'wildcard',
        title: '+1 COMODÍ 50% TÀCTIC',
        amount: 1,
        icon: '⚡',
        description: 'Descarta automàticament dues respostes incorrectes al Tauler o als Duels!'
      },
      {
        type: 'streak_shield',
        title: '+1 ESCUT DE RACHA DIÀRIA',
        amount: 1,
        icon: '🛡️',
        description: 'Protegeix la teva racha si un dia no pots estudiar!'
      }
    ];

    const selected = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
    setReward(selected);
    setIsOpened(true);
  };

  const handleClaim = () => {
    if (reward) {
      AudioEngine.playCorrect();
      onClaim(reward);
    }
    setIsOpened(false);
    setReward(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-amber-500/20 overflow-hidden">
        {/* Glow de fons */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={() => {
            if (isOpened && reward) {
              handleClaim();
            } else {
              onClose();
            }
          }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!isOpened ? (
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>Subministrament Tàctic Policial</span>
            </div>

            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                COFRE DE RECOMPENSA
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                {sourceText}
              </p>
            </div>

            {/* Caixa interactiva */}
            <div 
              onClick={handleOpenChest}
              className="group cursor-pointer py-4 flex flex-col items-center justify-center transition-transform hover:scale-105 active:scale-95"
            >
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500 to-amber-700 p-1 shadow-xl shadow-amber-600/30">
                <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center border-2 border-amber-400/80 group-hover:border-amber-300 transition-colors">
                  <Package className="w-16 h-16 text-amber-400 group-hover:scale-110 transition-transform duration-300 animate-pulse" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-lg animate-bounce">
                  ✨
                </div>
              </div>
              <span className="mt-4 text-xs font-bold text-amber-300 group-hover:text-amber-200 uppercase tracking-widest flex items-center gap-1.5">
                <span>TOCA PER OBRIR EL COFRE</span>
              </span>
            </div>

            <button
              onClick={handleOpenChest}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-95"
            >
              DESBLOQUEJAR RECOMPENSA
            </button>
          </div>
        ) : (
          <div className="space-y-5 animate-scaleUp">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Check className="w-3.5 h-3.5" />
              <span>Recompensa Desbloquejada!</span>
            </div>

            <div className="py-2">
              <div className="text-5xl sm:text-6xl mb-3 animate-bounce">
                {reward?.icon}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight">
                {reward?.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xs mx-auto">
                {reward?.description}
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-slate-400">
              S'ha afegit automàticament a la teva fitxa de l'oposició!
            </div>

            <button
              onClick={handleClaim}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-95"
            >
              RECLAMAR I CONTINUAR
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
