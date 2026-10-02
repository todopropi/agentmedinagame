import React, { useState, useEffect } from 'react';
import { UserProfile, SpecializedShield } from '../types';
import { getCustomShields, saveCustomShields, DEFAULT_SHIELDS_LIST } from '../data/badges';
import { fetchSupabaseStoreCatalog, subscribeToStoreCatalog, uploadSupabaseImage, deleteSupabaseStoreItem } from '../../supabase';
import { ShieldRenderer } from './ShieldRenderer';
import { TedaxBadge } from './TedaxBadge';
import { AudioEngine } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Coins, 
  Check, 
  ShoppingBag, 
  Sparkles, 
  ShieldCheck, 
  Award,
  Edit3,
  Plus,
  Trash2,
  Image as ImageIcon,
  Upload,
  X,
  RotateCcw,
  ShieldAlert,
  Lock,
  Trophy,
  Crown
} from 'lucide-react';

interface TiendaEscutsProps {
  user: UserProfile;
  onEquipShield: (shieldId: string) => void;
  onBuyShield: (shield: SpecializedShield) => void;
  onBuyWildcard?: () => void;
}

export const TiendaEscuts: React.FC<TiendaEscutsProps> = ({
  user,
  onEquipShield,
  onBuyShield,
  onBuyWildcard
}) => {
  const normEmail = user?.email?.toLowerCase().trim();
  const isAdmin = Boolean(user?.isAdmin || normEmail === 'opossscar@gmail.com');
  const [filterCategory, setFilterCategory] = useState<'tots' | 'campanya' | 'desbloquejats' | 'tedax'>('tots');
  const [shieldsList, setShieldsList] = useState<SpecializedShield[]>(() => getCustomShields());
  const [isSaving, setIsSaving] = useState(false);

  // Sincronització en directe del catàleg de la botiga des de Supabase
  useEffect(() => {
    let isMounted = true;
    fetchSupabaseStoreCatalog().then(cloudShields => {
      if (isMounted && Array.isArray(cloudShields) && cloudShields.length > 0) {
        setShieldsList(cloudShields);
      }
    }).catch(console.warn);

    const handleUpdate = (e: any) => {
      if (isMounted && e.detail && Array.isArray(e.detail)) {
        setShieldsList(e.detail);
      }
    };
    window.addEventListener('store_catalog_updated', handleUpdate);

    const unsubscribeRealtime = subscribeToStoreCatalog((newShields) => {
      if (isMounted && Array.isArray(newShields) && newShields.length > 0) {
        setShieldsList(newShields);
      }
    });

    return () => {
      isMounted = false;
      window.removeEventListener('store_catalog_updated', handleUpdate);
      unsubscribeRealtime();
    };
  }, []);

  // Admin edit / create modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShield, setEditingShield] = useState<SpecializedShield | null>(null);
  const [formData, setFormData] = useState<Partial<SpecializedShield>>({
    id: '',
    nom: '',
    unitat: '',
    descripcio: '',
    preuMerits: 50,
    escutTipus: 'generic_pvc',
    customLogoUrl: '',
    hideBorder: false,
    customLogoScale: 1.25,
    logoFit: 'contain',
    logoShape: 'rounded',
    colorPrincipal: 'blue-600',
    colorSecundari: '#eab308',
    ambitDesbloqueig: ''
  });

  const handleBuy = (shield: SpecializedShield) => {
    if (shield.ambitDesbloqueig) {
      if (shield.ambitDesbloqueig.startsWith('Casella 100')) {
        alert(`Aquest escut és una recompensa llegendària exclusiva (${shield.ambitDesbloqueig}). S'ha d'aconseguir completant la Casella 100 del Tauler de l'Oca!`);
      } else {
        alert(`Aquest escut és una recompensa exclusiva del ${shield.ambitDesbloqueig}. S'ha d'aconseguir completant la Casella 50 del Tauler de Campanya!`);
      }
      return;
    }
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

  const filteredShields = shieldsList.filter(s => {
    if (filterCategory === 'campanya') {
      return Boolean(s.ambitDesbloqueig) || s.id === 'escut_llegenda' || s.id.startsWith('escut_llegenda_');
    }
    if (filterCategory === 'desbloquejats') {
      const isMidpoint = s.ambitDesbloqueig && user.boardProgress && Number(user.boardProgress[s.ambitDesbloqueig]) >= 50;
      const isAmbitDone = s.ambitDesbloqueig && user.completedAmbits?.includes(s.ambitDesbloqueig);
      return Boolean(user.unlockedShieldIds?.includes(s.id) || isMidpoint || isAmbitDone);
    }
    if (filterCategory === 'tedax') {
      return s.escutTipus === 'tedax' || s.escutTipus === 'tedax_canina';
    }
    return true;
  });

  // Open modal to create a new shield
  const handleOpenCreateModal = () => {
    const newId = `escut_${Date.now()}`;
    setEditingShield(null);
    setFormData({
      id: newId,
      nom: '',
      unitat: 'Policia de la Generalitat - Mossos d’Esquadra',
      descripcio: '',
      preuMerits: 50,
      escutTipus: 'generic_pvc',
      customLogoUrl: '',
      hideBorder: false,
      customLogoScale: 1.25,
      logoFit: 'contain',
      logoShape: 'rounded',
      colorPrincipal: 'blue-600',
      colorSecundari: '#eab308',
      ambitDesbloqueig: ''
    });
    setIsModalOpen(true);
  };

  // Open modal to edit existing shield
  const handleOpenEditModal = (shield: SpecializedShield) => {
    setEditingShield(shield);
    setFormData({
      id: shield.id,
      nom: shield.nom,
      unitat: shield.unitat,
      descripcio: shield.descripcio,
      preuMerits: shield.preuMerits,
      escutTipus: shield.escutTipus,
      customLogoUrl: shield.customLogoUrl || '',
      hideBorder: shield.hideBorder || false,
      customLogoScale: shield.customLogoScale ?? 1.25,
      logoFit: shield.logoFit || 'contain',
      logoShape: shield.logoShape || 'rounded',
      colorPrincipal: shield.colorPrincipal || 'blue-600',
      colorSecundari: shield.colorSecundari || '#eab308',
      ambitDesbloqueig: shield.ambitDesbloqueig || ''
    });
    setIsModalOpen(true);
  };

  // Funció per comprimir imatges locals a format lleuger (màx 320px) per evitar Base64 gegants
  const compressImageForBadge = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (!src) return resolve('');
        const img = new Image();
        img.onload = () => {
          try {
            const maxDim = 320;
            let w = img.width;
            let h = img.height;
            if (w > h) {
              if (w > maxDim) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              }
            } else {
              if (h > maxDim) {
                w = Math.round((width => (width * maxDim) / img.height)(w));
                h = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(src);
            ctx.drawImage(img, 0, 0, w, h);
            const isTransparent = file.type.includes('png') || file.type.includes('svg');
            const format = isTransparent ? 'image/png' : 'image/jpeg';
            const compressed = canvas.toDataURL(format, 0.82);
            resolve(compressed.length < src.length ? compressed : src);
          } catch {
            resolve(src);
          }
        };
        img.onerror = () => resolve(src);
        img.src = src;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Handle image upload from computer (uploads directly to Supabase Storage or compresses as lightweight fallback)
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('La imatge és massa gran. El límit màxim és de 8MB.');
      return;
    }

    try {
      // 1. Intentar pujar directament al Bucket 'app-media' de Supabase Storage
      const cloudUrl = await uploadSupabaseImage(file, formData.nom || formData.id || 'escut');
      if (cloudUrl) {
        setFormData(prev => ({ ...prev, customLogoUrl: cloudUrl }));
        return;
      }

      // 2. Fallback: compressió ultralleugera (màx 200px) per evitar Statement Timeout (500)
      const compressed = await compressImageForBadge(file);
      if (compressed) {
        setFormData(prev => ({ ...prev, customLogoUrl: compressed }));
      }
    } catch (err) {
      console.warn('Error pujant o comprimint imatge:', err);
    }
  };

  // Save changes directly to Supabase matches table
  const handleSaveShieldForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom?.trim()) {
      alert('Si us plau, introdueix un nom per al distintiu.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedShield: SpecializedShield = {
        id: formData.id || `escut_${Date.now()}`,
        nom: formData.nom.trim(),
        unitat: formData.unitat?.trim() || 'Cos Policial',
        descripcio: formData.descripcio?.trim() || '',
        preuMerits: Math.max(0, Number(formData.preuMerits) || 0),
        escutTipus: (formData.escutTipus as any) || 'generic_pvc',
        colorPrincipal: formData.colorPrincipal || 'blue-600',
        colorSecundari: formData.colorSecundari || '#eab308',
        customLogoUrl: formData.customLogoUrl?.trim() || undefined,
        hideBorder: !!formData.hideBorder,
        customLogoScale: Number(formData.customLogoScale) || 1.25,
        logoFit: formData.logoFit || 'contain',
        logoShape: formData.logoShape || 'rounded',
        ambitDesbloqueig: formData.ambitDesbloqueig?.trim() || undefined
      };

      let updatedList: SpecializedShield[];
      if (editingShield) {
        updatedList = shieldsList.map(s => s.id === editingShield.id ? updatedShield : s);
      } else {
        updatedList = [...shieldsList, updatedShield];
      }

      setShieldsList(updatedList);
      await saveCustomShields(updatedList);
      setIsModalOpen(false);
      AudioEngine.playCorrect();
    } catch (err: any) {
      console.error('Error desant escut:', err);
      alert('Error desant a la base de dades: ' + (err?.message || 'Error desconegut'));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete a shield
  const handleDeleteShield = async (shieldId: string) => {
    if (window.confirm('Vols eliminar aquest escut de la botiga?')) {
      const updatedList = shieldsList.filter(s => s.id !== shieldId);
      setShieldsList(updatedList);
      await saveCustomShields(updatedList);
      await deleteSupabaseStoreItem(shieldId);
    }
  };

  // Restore defaults
  const handleResetToDefaults = async () => {
    if (window.confirm('Vols restaurar el catàleg oficial d\'escuts per defecte a Supabase?')) {
      setShieldsList(DEFAULT_SHIELDS_LIST);
      await saveCustomShields(DEFAULT_SHIELDS_LIST);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
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
                {isAdmin ? 'Botiga de Mèrits i Distintius Policials' : 'Galeria & Botiga d\'Escuts Policials'} ({shieldsList.length} Unitats)
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

        {/* Administrator Toolbar */}
        {isAdmin && (
          <div className="mt-5 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Panell d'Edició de la Botiga (Administrador: {user.email})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Afegir Nou Escut</span>
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
                title="Restaurar catàleg oficial original"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar</span>
              </button>
            </div>
          </div>
        )}

        {/* Highlight Banner for Official TEDAX-NRBQ Patch */}
        {(() => {
          const tedaxShield = shieldsList.find(s => s.id === 'tedax') || shieldsList[0];
          if (!tedaxShield) return null;
          const isTedaxUnlocked = user.unlockedShieldIds?.includes(tedaxShield.id);
          const isTedaxEquipped = user.equippedShieldId === tedaxShield.id;

          return (
            <div className="mt-6 p-4 sm:p-5 bg-gradient-to-r from-slate-950 to-slate-900 border border-amber-500/50 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="shrink-0 p-1">
                  {tedaxShield.customLogoUrl ? (
                    <ShieldRenderer shieldId={tedaxShield.id} shieldData={tedaxShield} size={110} glow={true} />
                  ) : (
                    <TedaxBadge size={140} glow={true} />
                  )}
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase mb-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{tedaxShield.unitat || "Insígnia d'Elit de Desactivació"}</span>
                  </div>
                  <h3 className="text-base font-black text-white">
                    {tedaxShield.nom}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md mt-0.5">
                    {tedaxShield.descripcio}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(tedaxShield)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                )}

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

        {/* Guia d'Economia de Mèrits i Comodí 50% */}
        <div className="mt-5 p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-black text-amber-400">
              <Award className="w-4 h-4" />
              <span>COM ACONSEGUIR MÈRITS PER DESBLOQUEJAR ESCUTS:</span>
            </div>

            {/* Comodí 50% Item Quick Buy */}
            <div className="flex items-center gap-3 bg-slate-900 border border-amber-500/40 px-3.5 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <div className="text-xs">
                  <span className="font-extrabold text-white">Comodí 50%</span>
                  <span className="text-slate-400 text-[10px] block">Descarta 2 opcions errònies</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-300">
                  {user.wildcardsCount || 0} actius
                </span>
                {onBuyWildcard && (
                  <button
                    onClick={onBuyWildcard}
                    disabled={user.merits < 10}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black rounded-lg text-xs transition-all cursor-pointer shadow-sm"
                    title="Compra 1 Comodí 50% per 10 Mèrits"
                  >
                    Comprar per 10 Mèrits
                  </button>
                )}
              </div>
            </div>
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
              <span className="text-slate-400 block font-semibold">🎯 Tauler Oca (Casella 50)</span>
              <span className="text-amber-300 font-mono font-black">+50 Mèrits + Escut Oficial</span>
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
            Tots els escuts ({shieldsList.length})
          </button>
          <button
            onClick={() => setFilterCategory('campanya')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterCategory === 'campanya'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-amber-300 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Trofeus de Campanya ({shieldsList.filter(s => Boolean(s.ambitDesbloqueig) || s.id === 'escut_llegenda').length})</span>
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

      {/* Grid of all shields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredShields.map((shield) => {
          const isMidpointReached = Boolean(shield.ambitDesbloqueig && user.boardProgress && Number(user.boardProgress[shield.ambitDesbloqueig]) >= 50);
          const isAmbitDone = Boolean(shield.ambitDesbloqueig && user.completedAmbits?.includes(shield.ambitDesbloqueig));
          const isC100Reached = Boolean(
            (shield.id === 'escut_llegenda' || shield.ambitDesbloqueig?.startsWith('Casella 100')) &&
            ((user.boardProgress && Object.values(user.boardProgress).some(v => Number(v) >= 100)) || (user.completedAmbits && user.completedAmbits.length > 0))
          );

          const isUnlocked = Boolean(
            user.unlockedShieldIds?.includes(shield.id) ||
            isMidpointReached ||
            isAmbitDone ||
            isC100Reached
          );
          const isEquipped = user.equippedShieldId === shield.id;
          const canAfford = user.merits >= shield.preuMerits;
          const isCampaignReward = Boolean(shield.ambitDesbloqueig);

          return (
            <div
              key={shield.id}
              className={`bg-slate-900 border rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all relative ${
                isEquipped
                  ? 'border-amber-500 ring-2 ring-amber-500/40 shadow-xl shadow-amber-500/10'
                  : isUnlocked
                  ? 'border-slate-700/80 hover:border-slate-600'
                  : isCampaignReward
                  ? 'border-amber-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/20'
                  : 'border-slate-800/80 opacity-90'
              }`}
            >
              {/* Badge visual & top status */}
              <div className="flex flex-col items-center text-center mb-3">
                {/* Admin Quick Action Button */}
                {isAdmin && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(shield)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 rounded-lg text-xs transition-colors cursor-pointer shadow"
                      title="Editar nom, logo, descripció o àmbit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteShield(shield.id)}
                      className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-slate-700 rounded-lg text-xs transition-colors cursor-pointer"
                      title="Eliminar escut"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Campaign Reward Tag */}
                {isCampaignReward ? (
                  <div className="mb-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 border border-amber-400/50 text-amber-300 flex items-center gap-1.5 shadow-sm">
                    {shield.ambitDesbloqueig?.startsWith('Casella 100') ? (
                      <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                    ) : (
                      <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                    )}
                    <span>{shield.ambitDesbloqueig?.startsWith('Casella 100') ? shield.ambitDesbloqueig : `Recompensa ${shield.ambitDesbloqueig}`}</span>
                  </div>
                ) : shield.id === 'escut_llegenda' ? (
                  <div className="mb-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/30 to-yellow-500/30 border border-amber-400 text-amber-300 flex items-center gap-1.5 shadow-sm">
                    <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Tauler Oca 100 - Nivell Llegendari</span>
                  </div>
                ) : null}

                <div className="relative mb-2">
                  {shield.escutTipus === 'tedax' && !shield.customLogoUrl ? (
                    <TedaxBadge size={110} glow={isEquipped} />
                  ) : (
                    <ShieldRenderer shieldId={shield.id} shieldData={shield} size={70} glow={isEquipped} />
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

              {/* Action Buttons: Equip or Buy or Locked */}
              <div className="pt-3 border-t border-slate-800 mt-2 space-y-2">
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
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl border border-slate-600 transition-colors cursor-pointer shadow"
                    >
                      Equipar Escut
                    </button>
                  )
                ) : (shield.id === 'escut_llegenda' || shield.ambitDesbloqueig?.startsWith('Casella 100')) ? (
                  <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/60 rounded-xl text-center space-y-1.5">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-300">
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>BLOQUEJAT A LA BOTIGA</span>
                    </div>
                    <p className="text-[10px] text-amber-200/90 leading-tight">
                      Arriba a la <b>Casella 100</b> {shield.ambitDesbloqueig ? `de ${shield.ambitDesbloqueig}` : "del Tauler de l'Oca"} per desbloquejar automàticament aquest escut d'or oficial!
                    </p>
                  </div>
                ) : isCampaignReward ? (
                  <div className="w-full p-2.5 bg-red-950/40 border border-red-500/50 rounded-xl text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-black text-red-300">
                      <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>BLOQUEJAT A LA BOTIGA</span>
                    </div>
                    <p className="text-[10px] text-red-200/90 leading-tight">
                      Arriba a la Casella 50 del Tauler de <b>{shield.ambitDesbloqueig}</b> per desbloquejar aquest escut oficial
                    </p>
                  </div>
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

                {/* Extra Edit button for Admin inside card */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(shield)}
                    className="w-full py-1.5 text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/30"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Escut (Admin)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Modal for Creating or Editing a Shield */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black text-white">
                  {editingShield ? 'Editar Escut de la Botiga' : 'Afegir Nou Escut a la Botiga'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Preview */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-center gap-4">
              <div className="shrink-0">
                <ShieldRenderer 
                  shieldId={formData.id || 'preview'} 
                  shieldData={formData} 
                  size={80} 
                  glow={true} 
                />
              </div>
              <div className="text-left">
                <div className="text-xs font-black text-white">
                  {formData.nom || 'Nom de l\'escut'}
                </div>
                <div className="text-[11px] text-amber-400 font-semibold">
                  {formData.unitat || 'Unitat'}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-2 max-w-xs mt-0.5">
                  {formData.descripcio || 'Descripció del distintiu...'}
                </div>
                {formData.ambitDesbloqueig && (
                  <div className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1">
                    <Trophy className="w-3 h-3 text-amber-400" />
                    <span>Bloquejat a la botiga • Recompensa {formData.ambitDesbloqueig}</span>
                  </div>
                )}
                <div className="text-xs font-bold text-amber-300 mt-1 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{formData.ambitDesbloqueig ? 'Exclusiu Campanya (0 Mèrits)' : `${formData.preuMerits || 0} Mèrits`}</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveShieldForm} className="space-y-4 text-xs">
              {/* Desbloqueig de Campanya (Casella 50) */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1.5">
                <label className="block text-amber-300 font-bold flex items-center gap-1.5 text-xs">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Vincular a Recompensa de Campanya (Tauler Oca)</span>
                </label>
                <select
                  value={formData.ambitDesbloqueig || ''}
                  onChange={(e) => setFormData({ ...formData, ambitDesbloqueig: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-amber-500/50 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 font-semibold"
                >
                  <option value="">Cap (Escut lliure: es compra amb Mèrits a la botiga)</option>
                  <option value="Àmbit A">Àmbit A (Desbloqueig automàtic a la Casella 50 de l'Àmbit A)</option>
                  <option value="Àmbit B">Àmbit B (Desbloqueig automàtic a la Casella 50 de l'Àmbit B)</option>
                  <option value="Àmbit C">Àmbit C (Desbloqueig automàtic a la Casella 50 de l'Àmbit C)</option>
                  <option value="Actualitat">Actualitat (Desbloqueig automàtic a la Casella 50 d'Actualitat)</option>
                  <option value="ISPC">ISPC (Desbloqueig automàtic a la Casella 50 d'ISPC)</option>
                </select>
                <p className="text-[10px] text-amber-200/80 leading-relaxed">
                  🔒 Si assignes un àmbit, l'escut apareixerà com a <b>BLOQUEJAT A LA BOTIGA</b> per als usuaris indicant exactament quin escut és i que cal assolir la Casella 50 d'aquell àmbit per guanyar-lo.
                </p>
              </div>

              {/* Nom */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Nom de l'Escut / Distintiu *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom || ''}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Ex: USC - Seguretat Ciutadana"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Unitat */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Unitat / Cos Policial
                </label>
                <input
                  type="text"
                  value={formData.unitat || ''}
                  onChange={(e) => setFormData({ ...formData, unitat: e.target.value })}
                  placeholder="Ex: Unitat de Seguretat Ciutadana"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Preu en Mèrits */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Preu en Mèrits *
                </label>
                <div className="relative">
                  <Coins className="w-4 h-4 text-amber-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.preuMerits ?? 50}
                    onChange={(e) => setFormData({ ...formData, preuMerits: parseInt(e.target.value) || 0 })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Descripció */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Descripció
                </label>
                <textarea
                  rows={2}
                  value={formData.descripcio || ''}
                  onChange={(e) => setFormData({ ...formData, descripcio: e.target.value })}
                  placeholder="Descripció breu dels detalls de l'emblema o motiu..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Vinculació a Campanya / Recompensa (Opcional) */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5">
                <label className="block text-amber-400 font-bold text-xs flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Desbloqueig de Campanya (Trofeu Oficial)</span>
                </label>
                <select
                  value={formData.ambitDesbloqueig || (formData.id === 'escut_llegenda' ? 'Casella 100' : '')}
                  onChange={(e) => setFormData({ ...formData, ambitDesbloqueig: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="">Cap (Compra estàndard amb Mèrits)</option>
                  <optgroup label="Casella 50 - Fita d'Àmbit Oficial">
                    <option value="Àmbit A">Àmbit A (Casella 50 - Seguretat Ciutadana)</option>
                    <option value="Àmbit B">Àmbit B (Casella 50 - Investigació Criminal)</option>
                    <option value="Àmbit C">Àmbit C (Casella 50 - Ordre Públic ARRO)</option>
                    <option value="Actualitat">Actualitat (Casella 50 - Trànsit)</option>
                    <option value="ISPC">ISPC (Casella 50 - GEI Intervenció)</option>
                  </optgroup>
                  <optgroup label="Casella 100 - Nivell Llegendari per Àmbit">
                    <option value="Casella 100 (Àmbit A)">Casella 100 - Àmbit A (Seguretat Ciutadana Llegendari)</option>
                    <option value="Casella 100 (Àmbit B)">Casella 100 - Àmbit B (Investigació Criminal Llegendari)</option>
                    <option value="Casella 100 (Àmbit C)">Casella 100 - Àmbit C (Recursos Operatius Llegendari)</option>
                    <option value="Casella 100 (Actualitat)">Casella 100 - Actualitat (Trànsit & Actualitat Llegendari)</option>
                    <option value="Casella 100 (ISPC)">Casella 100 - ISPC (Operacions Especials Llegendari)</option>
                    <option value="Casella 100">Casella 100 (Final Nivell Llegendari Global)</option>
                  </optgroup>
                </select>
                <p className="text-[10.5px] text-slate-400">
                  Si està vinculat a un àmbit o a la Casella 100, només es desbloqueja completant el repte al tauler!
                </p>
              </div>

              {/* Logo / Imatge */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Personalització del Logotip / Emblema</span>
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">
                    URL d'imatge / logo (PNG transparent o SVG recomanat)
                  </label>
                  <input
                    type="url"
                    value={formData.customLogoUrl || ''}
                    onChange={(e) => setFormData({ ...formData, customLogoUrl: e.target.value })}
                    placeholder="https://exemple.cat/logo-escut.png"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-600 flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Carregar Imatge Local</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>
                  {formData.customLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, customLogoUrl: '' })}
                      className="text-red-400 hover:text-red-300 text-[11px] underline"
                    >
                      Treure logo personalitzat
                    </button>
                  )}
                </div>

                {/* Personalització visual de la imatge carregada (Mida, marcs, etc.) */}
                {formData.customLogoUrl && (
                  <div className="mt-3 p-3 bg-slate-900/90 border border-amber-500/40 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Ajustar com es veu la imatge</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Previsualització a dalt
                      </span>
                    </div>

                    {/* Opció: Sense marcs d'escut */}
                    <div className="flex items-center justify-between p-2 bg-slate-950/80 border border-slate-800 rounded-lg">
                      <div className="pr-2">
                        <span className="text-white font-bold block text-[11px]">
                          {formData.hideBorder ? '✨ Imatge neta (Sense marcs)' : '🛡️ Amb marc d\'escut policial'}
                        </span>
                        <span className="text-slate-400 text-[10px] block">
                          {formData.hideBorder 
                            ? 'Sense vora de PVC ni daus vermells, només la imatge directa' 
                            : 'Mostra la imatge integrada dins de l\'escut oficial'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, hideBorder: !prev.hideBorder }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          formData.hideBorder
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {formData.hideBorder ? 'Sense marc ✓' : 'Treure marc'}
                      </button>
                    </div>

                    {/* Mida / Escala (Més gran) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-300 font-semibold text-[11px]">
                          Mida de la imatge: <span className="text-amber-400 font-mono font-bold">{Math.round((formData.customLogoScale || 1.25) * 100)}%</span>
                        </label>
                        <span className="text-[10px] text-slate-400">Arrossega per fer-la més gran</span>
                      </div>
                      <input
                        type="range"
                        min="0.8"
                        max="2.0"
                        step="0.05"
                        value={formData.customLogoScale || 1.25}
                        onChange={(e) => setFormData(prev => ({ ...prev, customLogoScale: parseFloat(e.target.value) }))}
                        className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <div className="flex items-center gap-1.5 pt-1">
                        {[
                          { label: 'Normal', val: 1.0 },
                          { label: 'Gran', val: 1.3 },
                          { label: 'Molt Gran', val: 1.6 },
                          { label: 'Màxim', val: 1.9 }
                        ].map(preset => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, customLogoScale: preset.val }))}
                            className={`px-2 py-1 text-[10px] rounded-md font-semibold transition-all cursor-pointer ${
                              Math.abs((formData.customLogoScale || 1.25) - preset.val) < 0.08
                                ? 'bg-amber-500 text-slate-950 shadow'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                            }`}
                          >
                            {preset.label} ({Math.round(preset.val * 100)}%)
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Ajust d'imatge i forma */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-slate-400 text-[10px] block mb-1 font-semibold">
                          Ajust d'imatge
                        </label>
                        <select
                          value={formData.logoFit || 'contain'}
                          onChange={(e) => setFormData(prev => ({ ...prev, logoFit: e.target.value as any }))}
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                        >
                          <option value="contain">Ajustar (proporció sencera)</option>
                          <option value="cover">Cobrir (omplir tot)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-400 text-[10px] block mb-1 font-semibold">
                          Forma de cantonades
                        </label>
                        <select
                          value={formData.logoShape || 'rounded'}
                          onChange={(e) => setFormData(prev => ({ ...prev, logoShape: e.target.value as any }))}
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500"
                        >
                          <option value="square">Original / Silueta neta</option>
                          <option value="rounded">Arrodonida suau</option>
                          <option value="circle">Circular / Rodó</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Base Badge Style Selector */}
                <div className="pt-2">
                  <label className="block text-slate-400 text-[11px] mb-1">
                    Estil base de patch policial
                  </label>
                  <select
                    value={formData.escutTipus || 'generic_pvc'}
                    onChange={(e) => setFormData({ ...formData, escutTipus: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="generic_pvc">Mossos d'Esquadra Genèric (Color)</option>
                    <option value="generic_bw">Mossos d'Esquadra Genèric (B&W Tàctic)</option>
                    <option value="usc">USC Seguretat Ciutadana</option>
                    <option value="usc_blueline">USC Blue Line</option>
                    <option value="transit">Trànsit</option>
                    <option value="canina">Unitat Canina K-9</option>
                    <option value="usaq">USAQ Subaquàtica</option>
                    <option value="subsol">Subsòl</option>
                    <option value="muntanya">UIM Muntanya</option>
                    <option value="maritima">Policia Marítima</option>
                    <option value="dic">DIC Investigació Criminal</option>
                    <option value="informacio">Informació (CGInf)</option>
                    <option value="arro">ARRO</option>
                    <option value="brimo">BRIMO</option>
                    <option value="brimo_fluo">BRIMO Alta Visibilitat</option>
                    <option value="tedax">TEDAX - NRBQ</option>
                    <option value="gei">GEI</option>
                    <option value="gei_stealth">GEI Stealth</option>
                  </select>
                </div>
              </div>

              {/* Submit / Cancel buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel·lar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition-colors cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Desant a Supabase...</span>
                    </>
                  ) : (
                    editingShield ? 'Desar Canvis a Supabase' : 'Afegir a la Botiga'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
