import React, { useState, useEffect } from 'react';
import { UserProfile, SpecializedShield } from '../types';
import { SPECIALIZED_SHIELDS } from '../data/badges';
import { ShieldRenderer } from './ShieldRenderer';
import { TedaxBadge } from './TedaxBadge';
import { ShopItemAdminModal } from './ShopItemAdminModal';
import { AudioEngine } from '../utils/audio';
import { 
  subscribeToShopCatalog, 
  saveShopItemRemote, 
  deleteShopItemRemote, 
  getLocalShopItems 
} from '../firebase';
import confetti from 'canvas-confetti';
import { 
  Coins, 
  Check, 
  ShoppingBag, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Info,
  Award,
  Edit2,
  Trash2,
  PlusCircle,
  ShieldAlert
} from 'lucide-react';

interface TiendaEscutsProps {
  user: UserProfile;
  onEquipShield: (shieldId: string) => void;
  onBuyShield: (shield: SpecializedShield) => void;
}

export const TiendaEscuts: React.FC<TiendaEscutsProps> = ({
  user,
  onEquipShield,
  onBuyShield
}) => {
  const [filterCategory, setFilterCategory] = useState<'tots' | 'desbloquejats' | 'tedax'>('tots');
  const [shields, setShields] = useState<SpecializedShield[]>(getLocalShopItems());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SpecializedShield | null>(null);

  // Rol d'administrador exclusiu per a opossscar@gmail.com
  const isAdmin = Boolean(
    (user.email && user.email.toLowerCase().trim() === 'opossscar@gmail.com') ||
    user.isAdmin
  );

  // Sincronització en temps real del catàleg de la botiga
  useEffect(() => {
    const unsub = subscribeToShopCatalog((items) => {
      if (items && items.length > 0) {
        setShields(items);
      }
    });
    return () => unsub();
  }, []);

  const handleBuy = (shield: SpecializedShield) => {
    if (user.merits < shield.preuMerits) {
      AudioEngine.playWrong();
      alert(`Et falten ${(shield.preuMerits - user.merits).toLocaleString()} Mèrits per adquirir aquest escut.`);
      return;
    }
    AudioEngine.playCorrect();
    onBuyShield(shield);
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const filteredShields = shields.filter(s => {
    if (filterCategory === 'desbloquejats') {
      return user.unlockedShieldIds?.includes(s.id);
    }
    if (filterCategory === 'tedax') {
      return s.escutTipus === 'tedax' || s.escutTipus === 'tedax_canina';
    }
    return true;
  });

  const handleSaveItem = async (item: SpecializedShield) => {
    AudioEngine.playCorrect();
    await saveShopItemRemote(item);
  };

  const handleDeleteItem = async (shield: SpecializedShield) => {
    if (!window.confirm(`Segur que vols eliminar l'article "${shield.nom}" de la botiga?`)) {
      return;
    }
    AudioEngine.playClick();
    await deleteShopItemRemote(shield.id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Panell d'Administració Exclusiu per opossscar@gmail.com */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                  Panell Administrador Actiu
                </span>
                <span className="text-xs text-amber-300 font-mono font-bold">
                  {user.email || 'opossscar@gmail.com'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Com a administrador pots modificar preus, noms, subtítols o descripcions, crear nous articles i eliminar-los. Els canvis es sincronitzen en temps real per a tots els usuaris de l'aplicació.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="shrink-0 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer hover:scale-105"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Afegir Nou Article</span>
          </button>
        </div>
      )}

      {/* Top Banner & Wallet */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-4 flex-wrap relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Galeria & Botiga d'Escuts Policials ({shields.length} Unitats Oficials)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Canvia els teus Mèrits guanyats en el joc per desbloquejar els distintius oficials de les unitats especialitzades de Mossos d'Esquadra i Policia Local.
            </p>
          </div>

          {/* User Merits Wallet */}
          <div className="px-5 py-3 bg-amber-950/50 border border-amber-500/50 rounded-2xl flex items-center gap-3 shadow-lg shadow-amber-500/10">
            <Coins className="w-6 h-6 text-amber-400 animate-bounce" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                La teva Cartera
              </div>
              <div className="text-lg sm:text-xl font-black text-amber-300">
                {user.merits.toLocaleString()} Mèrits
              </div>
            </div>
          </div>
        </div>

        {/* Highlight Banner for Official TEDAX-NRBQ Patch */}
        {(() => {
          const tedaxShield = shields.find(s => s.id === 'tedax') || shields[0];
          if (!tedaxShield) return null;
          const isTedaxUnlocked = user.unlockedShieldIds?.includes(tedaxShield.id);
          const isTedaxEquipped = user.equippedShieldId === tedaxShield.id;

          return (
            <div className="mt-6 p-4 sm:p-5 bg-gradient-to-r from-slate-950 to-slate-900 border border-amber-500/50 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="shrink-0 p-1">
                  {tedaxShield.imageUrl ? (
                    <div className="w-28 h-28 flex items-center justify-center p-2 rounded-2xl bg-slate-950 border border-slate-800">
                      <img src={tedaxShield.imageUrl} alt={tedaxShield.nom} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <TedaxBadge size={140} glow={true} />
                  )}
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase mb-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Distintiu Destacat d'Alta Distinció</span>
                  </div>
                  <h3 className="text-base font-black text-white">
                    {tedaxShield.nom}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md mt-0.5">
                    {tedaxShield.descripcio}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                {isTedaxUnlocked ? (
                  isTedaxEquipped ? (
                    <div className="px-5 py-2.5 bg-emerald-500/20 border border-emerald-500 text-emerald-300 font-black text-xs rounded-xl flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>EQUIPAT COM A AVATAR</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onEquipShield(tedaxShield.id)}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/20"
                    >
                      Equipar aquest parche
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => handleBuy(tedaxShield)}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-amber-500/25"
                  >
                    <Coins className="w-4 h-4" />
                    <span>Desbloquejar per {tedaxShield.preuMerits.toLocaleString()} Mèrits</span>
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Guia d'Economia de Mèrits */}
        <div className="mt-5 p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-black text-amber-400 mb-2">
            <Award className="w-4 h-4" />
            <span>COM ACONSEGUIR MÈRITS PER DESBLOQUEJAR ESCUTS:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block font-semibold">⚔️ Victòria vs Agent (45%)</span>
              <span className="text-amber-300 font-mono font-black">+15 Mèrits</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block font-semibold">⚔️ Victòria vs Caporal (68%)</span>
              <span className="text-amber-300 font-mono font-black">+25 Mèrits</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block font-semibold">⚔️ Victòria vs Sergent (85%)</span>
              <span className="text-amber-300 font-mono font-black">+45 Mèrits</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block font-semibold">🎯 Tauler Oca / Ratxes</span>
              <span className="text-amber-300 font-mono font-black">+2 a +50 Mèrits</span>
            </div>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 mt-5 flex-wrap">
          <button
            onClick={() => setFilterCategory('tots')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterCategory === 'tots'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Tots els escuts ({shields.length})
          </button>
          <button
            onClick={() => setFilterCategory('desbloquejats')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterCategory === 'desbloquejats'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Al meu armari ({user.unlockedShieldIds?.length || 0})
          </button>
          <button
            onClick={() => setFilterCategory('tedax')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterCategory === 'tedax'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            TEDAX & NRBQ
          </button>
        </div>
      </div>

      {/* Grid of shields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredShields.map((shield) => {
          const isUnlocked = user.unlockedShieldIds?.includes(shield.id);
          const isEquipped = user.equippedShieldId === shield.id;
          const canAfford = user.merits >= shield.preuMerits;

          return (
            <div
              key={shield.id}
              className={`bg-slate-900 border rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all relative group ${
                isEquipped
                  ? 'border-amber-500 ring-2 ring-amber-500/40 shadow-xl shadow-amber-500/10'
                  : isUnlocked
                  ? 'border-slate-700/80 hover:border-slate-600'
                  : 'border-slate-800/80 opacity-90'
              }`}
            >
              {/* Botons d'Edició i Eliminació per a Administrador (opossscar@gmail.com) */}
              {isAdmin && (
                <div className="flex items-center justify-end gap-1.5 mb-2 -mt-1 -mr-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingItem(shield);
                      setIsModalOpen(true);
                    }}
                    title="Modificar preu, nom, subtítol, descripció o logo"
                    className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 border border-slate-700/60 hover:border-amber-500/50 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(shield);
                    }}
                    title="Eliminar aquest article de la botiga"
                    className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Badge visual & top status */}
              <div className="flex flex-col items-center text-center mb-3">
                <div className="relative mb-2">
                  {shield.imageUrl ? (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto flex items-center justify-center p-2 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner overflow-hidden">
                      <img
                        src={shield.imageUrl}
                        alt={shield.nom}
                        className="w-full h-full object-contain filter drop-shadow-md"
                      />
                    </div>
                  ) : shield.escutTipus === 'tedax' ? (
                    <TedaxBadge size={110} glow={isEquipped} />
                  ) : (
                    <ShieldRenderer shieldId={shield.id} size={70} glow={isEquipped} />
                  )}

                  {isEquipped && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 tracking-wider shadow">
                      EQUIPAT
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-extrabold text-white mt-1">{shield.nom}</h4>
                <span className="text-[11px] font-semibold text-amber-400/90">{shield.unitat}</span>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {shield.descripcio}
                </p>
              </div>

              {/* Action Buttons: Equip or Buy */}
              <div className="pt-3 border-t border-slate-800 mt-2">
                {isUnlocked ? (
                  isEquipped ? (
                    <button
                      disabled
                      className="w-full py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Actiu a l'Avatar</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onEquipShield(shield.id)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl border border-slate-600 transition-colors cursor-pointer"
                    >
                      Equipar Escut
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => handleBuy(shield)}
                    disabled={!canAfford}
                    className={`w-full py-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      canAfford
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>{shield.preuMerits.toLocaleString()} Mèrits</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal d'Administració d'Articles */}
      <ShopItemAdminModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        itemToEdit={editingItem}
        onSave={handleSaveItem}
      />
    </div>
  );
};
