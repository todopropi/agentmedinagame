import React, { useState, useEffect } from 'react';
import { UserProfile, SpecializedShield, StudyMaterial } from '../types';
import { getCustomShields, saveCustomShields, DEFAULT_SHIELDS_LIST } from '../data/badges';
import { 
  fetchSupabaseStoreCatalog, 
  subscribeToStoreCatalog, 
  uploadSupabaseImage, 
  deleteSupabaseStoreItem,
  fetchSupabaseStudyMaterials,
  syncSupabaseStudyMaterials,
  uploadSupabaseStudyDocument,
  getSignedStudyMaterialUrl,
  DEFAULT_STUDY_MATERIALS
} from '../../supabase';
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
  Crown,
  FileText,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Shield,
  Zap,
  BookOpen
} from 'lucide-react';

interface TiendaEscutsProps {
  user: UserProfile;
  onEquipShield: (shieldId: string) => void;
  onBuyShield: (shield: SpecializedShield) => void;
  onBuyWildcard?: () => void;
  onBuyStreakShield?: () => void;
  onBuyStudyMaterial?: (material: StudyMaterial) => void;
}

export const TiendaEscuts: React.FC<TiendaEscutsProps> = ({
  user,
  onEquipShield,
  onBuyShield,
  onBuyWildcard,
  onBuyStreakShield,
  onBuyStudyMaterial
}) => {
  const normEmail = user?.email?.toLowerCase().trim();
  const isAdmin = Boolean(user?.isAdmin || normEmail === 'opossscar@gmail.com');
  const isDocentOrAdmin = Boolean(
    isAdmin || 
    user?.role === 'question_editor' || 
    user?.role === 'admin' || 
    normEmail === 'opossscar@gmail.com'
  );

  // Pestanya principal de la Botiga: Escuts, Materials d'Estudi, Avantatges
  const [storeTab, setStoreTab] = useState<'escuts' | 'material' | 'avantatges'>('escuts');

  const [filterCategory, setFilterCategory] = useState<'tots' | 'campanya' | 'desbloquejats' | 'tedax'>('tots');
  const [shieldsList, setShieldsList] = useState<SpecializedShield[]>(() => getCustomShields());
  const [isSaving, setIsSaving] = useState(false);

  // Gestió de Material d'Estudi / Apunts
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>(() => DEFAULT_STUDY_MATERIALS);
  const [materialFilter, setMaterialFilter] = useState<string>('tots');
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null);
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);
  const [confirmDeleteMaterialId, setConfirmDeleteMaterialId] = useState<string | null>(null);
  const [confirmDeleteShieldId, setConfirmDeleteShieldId] = useState<string | null>(null);
  const [materialFormData, setMaterialFormData] = useState<Partial<StudyMaterial>>({
    titol: '',
    descripcio: '',
    format: 'pdf',
    ambit: 'Àmbit A',
    temaAssociat: '',
    preuMerits: 25,
    arxiuUrl: '',
    estat: 'actiu',
    tamanyText: ''
  });

  // Carregar materials d'estudi
  useEffect(() => {
    fetchSupabaseStudyMaterials().then(mats => {
      if (Array.isArray(mats) && mats.length > 0) {
        setStudyMaterials(mats);
      }
    }).catch(console.warn);
  }, []);

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
    try {
      const updatedList = shieldsList.filter(s => s.id !== shieldId);
      setShieldsList(updatedList);
      setConfirmDeleteShieldId(null);
      await saveCustomShields(updatedList);
      await deleteSupabaseStoreItem(shieldId);
      AudioEngine.playClick();
    } catch (err) {
      console.error('Error eliminant escut:', err);
    }
  };

  // Restore defaults
  const handleResetToDefaults = async () => {
    setShieldsList(DEFAULT_SHIELDS_LIST);
    await saveCustomShields(DEFAULT_SHIELDS_LIST);
    AudioEngine.playCorrect();
  };

  const [downloadingMatId, setDownloadingMatId] = useState<string | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  // Obre o descarrega el document utilitzant un enllaç signat temporal (2 minuts)
  const handleOpenPurchasedDocument = async (material: StudyMaterial) => {
    if (!material.arxiuUrl && !material.storagePath) {
      alert("Aquest document encara no té cap arxiu adjunt.");
      return;
    }

    setDownloadingMatId(material.id);
    try {
      const target = material.storagePath || material.arxiuUrl;
      const signedUrl = await getSignedStudyMaterialUrl(
        target,
        material.bucketName || 'study-materials',
        120
      );
      if (signedUrl) {
        window.open(signedUrl, '_blank', 'noopener,noreferrer');
      } else if (material.arxiuUrl) {
        window.open(material.arxiuUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.warn("Error generant enllaç temporal segur:", err);
      if (material.arxiuUrl) {
        window.open(material.arxiuUrl, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setDownloadingMatId(null);
    }
  };

  // Càrrega d'arxiu local (PDF/Word/PPT) a Supabase Storage protegit
  const handleDocumentFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 35 * 1024 * 1024) {
      alert("L'arxiu és massa gran. El límit recomanat és de 35MB.");
      return;
    }

    setIsUploadingDoc(true);
    setUploadFeedback("Pujant arxiu a Supabase Storage protegit...");
    try {
      const res = await uploadSupabaseStudyDocument(file, materialFormData.titol || file.name.split('.')[0]);
      if (res) {
        setMaterialFormData(prev => ({
          ...prev,
          titol: prev.titol || file.name.replace(/\.[^/.]+$/, ""),
          format: res.format,
          tamanyText: res.sizeText,
          storagePath: res.storagePath,
          fileName: res.fileName,
          bucketName: res.bucketName,
          arxiuUrl: res.publicUrl || res.storagePath
        }));
        setUploadFeedback(`Document "${file.name}" (${res.sizeText}) pujat amb èxit a Supabase!`);
        AudioEngine.playCorrect();
      } else {
        alert("No s'ha pogut completar la pujada a Supabase. Revisa la connexió.");
        setUploadFeedback(null);
      }
    } catch (err) {
      console.error("Error al carregar document:", err);
      alert("Error inesperat pujant el document a Supabase.");
      setUploadFeedback(null);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Gestió de compra de Material d'Estudi
  const handleBuyStudyMaterial = (material: StudyMaterial) => {
    if (material.estat === 'proximament') {
      alert("Aquest material està marcat com a 'Pròximament' per l'equip de docència. Estarà disponible aviat!");
      return;
    }

    const isAlreadyBought = Boolean(
      user.purchasedMaterialIds?.includes(material.id) ||
      user.unlockedMaterialIds?.includes(material.id) ||
      material.preuMerits === 0
    );

    if (isAlreadyBought) {
      handleOpenPurchasedDocument(material);
      return;
    }

    if (material.preuMerits > 0 && user.merits < material.preuMerits) {
      AudioEngine.playWrong();
      alert(`Et falten ${(material.preuMerits - user.merits).toLocaleString()} Mèrits per adquirir aquest document.`);
      return;
    }

    AudioEngine.playCorrect();
    if (onBuyStudyMaterial) {
      onBuyStudyMaterial(material);
    } else {
      user.merits = Math.max(0, user.merits - material.preuMerits);
      user.purchasedMaterialIds = [...(user.purchasedMaterialIds || []), material.id];
      user.unlockedMaterialIds = [...(user.unlockedMaterialIds || []), material.id];
    }

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 }
    });

    setTimeout(() => {
      handleOpenPurchasedDocument(material);
    }, 450);
  };

  // Compra d'Escut de Racha Diària
  const handleBuyStreakProtection = () => {
    const currentShields = user.streakShieldsCount || 0;
    if (currentShields >= 3) {
      alert("Ja tens el màxim de 3 Escuts de Racha acumulats a la teva fitxa policial!");
      return;
    }

    const price = 35;
    if (user.merits < price) {
      AudioEngine.playWrong();
      alert(`Et falten ${(price - user.merits).toLocaleString()} Mèrits per adquirir un Escut de Racha.`);
      return;
    }

    AudioEngine.playCorrect();
    if (onBuyStreakShield) {
      onBuyStreakShield();
    } else {
      user.merits = Math.max(0, user.merits - price);
      user.streakShieldsCount = currentShields + 1;
    }

    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.7 }
    });
  };

  // Salvar material d'estudi (Admin / Docència)
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialFormData.titol) {
      alert("Si us plau, indica el títol del document.");
      return;
    }

    setIsSavingMaterial(true);
    try {
      const updatedMaterial: StudyMaterial = {
        id: editingMaterial ? editingMaterial.id : `mat_${Date.now()}`,
        titol: materialFormData.titol || 'Nou Material',
        descripcio: materialFormData.descripcio || '',
        format: materialFormData.format || 'pdf',
        ambit: materialFormData.ambit || 'Àmbit A',
        temaAssociat: materialFormData.temaAssociat || '',
        preuMerits: Number(materialFormData.preuMerits) || 0,
        arxiuUrl: materialFormData.arxiuUrl || '',
        storagePath: materialFormData.storagePath || editingMaterial?.storagePath,
        fileName: materialFormData.fileName || editingMaterial?.fileName,
        bucketName: materialFormData.bucketName || editingMaterial?.bucketName || 'study-materials',
        estat: materialFormData.estat || 'actiu',
        tamanyText: materialFormData.tamanyText || 'Arxiu d’estudi',
        dataCreacio: editingMaterial?.dataCreacio || new Date().toISOString().split('T')[0],
        creadorEmail: user.email
      };

      let updatedList: StudyMaterial[];
      if (editingMaterial) {
        updatedList = studyMaterials.map(m => m.id === editingMaterial.id ? updatedMaterial : m);
      } else {
        updatedList = [updatedMaterial, ...studyMaterials];
      }

      setStudyMaterials(updatedList);
      await syncSupabaseStudyMaterials(updatedList);
      setIsMaterialModalOpen(false);
      setEditingMaterial(null);
      setUploadFeedback(null);
      AudioEngine.playCorrect();
    } catch (err) {
      console.error(err);
      alert("Error guardant material d'estudi.");
    } finally {
      setIsSavingMaterial(false);
    }
  };

  // Eliminar material d'estudi (Admin / Docència)
  const handleDeleteMaterial = async (materialId: string) => {
    try {
      const updatedList = studyMaterials.filter(m => m.id !== materialId);
      setStudyMaterials(updatedList);
      setConfirmDeleteMaterialId(null);
      await syncSupabaseStudyMaterials(updatedList);
      AudioEngine.playClick();
    } catch (err) {
      console.error("Error eliminant material:", err);
    }
  };

  const handleOpenCreateMaterialModal = () => {
    setEditingMaterial(null);
    setMaterialFormData({
      titol: '',
      descripcio: '',
      format: 'pdf',
      ambit: 'Àmbit A',
      temaAssociat: '',
      preuMerits: 25,
      arxiuUrl: '',
      storagePath: '',
      fileName: '',
      bucketName: 'study-materials',
      estat: 'actiu',
      tamanyText: ''
    });
    setUploadFeedback(null);
    setIsMaterialModalOpen(true);
  };

  const handleOpenEditMaterialModal = (mat: StudyMaterial) => {
    setEditingMaterial(mat);
    setMaterialFormData({
      titol: mat.titol,
      descripcio: mat.descripcio,
      format: mat.format,
      ambit: mat.ambit,
      temaAssociat: mat.temaAssociat || '',
      preuMerits: mat.preuMerits,
      arxiuUrl: mat.arxiuUrl,
      storagePath: mat.storagePath || '',
      fileName: mat.fileName || '',
      bucketName: mat.bucketName || 'study-materials',
      estat: mat.estat,
      tamanyText: mat.tamanyText || ''
    });
    setUploadFeedback(null);
    setIsMaterialModalOpen(true);
  };

  // Llista d'àmbits dinàmica (Opció B: només aquells que tenen com a mínim 1 document)
  const availableAmbitsWithCount = React.useMemo(() => {
    const ambitsOrder = ['Àmbit A', 'Àmbit B', 'Àmbit C', 'Àmbit D', 'Transversal', 'Tots'];
    const map = new Map<string, number>();

    studyMaterials.forEach(m => {
      if (!isDocentOrAdmin && m.estat === 'ocult') return;
      if (!m.ambit) return;
      const count = map.get(m.ambit) || 0;
      map.set(m.ambit, count + 1);
    });

    return Array.from(map.entries())
      .filter(([_, count]) => count > 0)
      .sort(([a], [b]) => {
        const idxA = ambitsOrder.indexOf(a);
        const idxB = ambitsOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      });
  }, [studyMaterials, isDocentOrAdmin]);

  const comingSoonCount = React.useMemo(() => {
    return studyMaterials.filter(m => (isDocentOrAdmin || m.estat !== 'ocult') && m.estat === 'proximament').length;
  }, [studyMaterials, isDocentOrAdmin]);

  const purchasedCount = React.useMemo(() => {
    return studyMaterials.filter(m => 
      (isDocentOrAdmin || m.estat !== 'ocult') && 
      (user.purchasedMaterialIds?.includes(m.id) || user.unlockedMaterialIds?.includes(m.id) || m.preuMerits === 0)
    ).length;
  }, [studyMaterials, user.purchasedMaterialIds, user.unlockedMaterialIds, isDocentOrAdmin]);

  // Filtrar materials segons permís i pestanya
  const visibleMaterials = studyMaterials.filter(m => {
    if (!isDocentOrAdmin && m.estat === 'ocult') return false;
    if (materialFilter === 'tots') return true;
    if (materialFilter === 'proximament') return m.estat === 'proximament';
    if (materialFilter === 'adquirit') return Boolean(user.purchasedMaterialIds?.includes(m.id) || user.unlockedMaterialIds?.includes(m.id) || m.preuMerits === 0);
    return m.ambit === materialFilter;
  });

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
                {isAdmin ? 'Botiga de Mèrits, Escuts i Material' : 'Botiga de Mèrits & Recursos d\'Estudi'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Canvia els teus Mèrits guanyats en el joc per desbloquejar els distintius oficials, dossiers i esquemes oficials d'estudi de Mossos d'Esquadra.
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

        {/* SUBPESTANYES PRINCIPALS DE LA BOTIGA */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-800 pb-3 overflow-x-auto pretty-scrollbar">
          <button
            type="button"
            onClick={() => {
              AudioEngine.playClick();
              setStoreTab('escuts');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              storeTab === 'escuts'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Escuts Policials ({shieldsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              AudioEngine.playClick();
              setStoreTab('material');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              storeTab === 'material'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Material d'Estudi & Apunts ({visibleMaterials.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              AudioEngine.playClick();
              setStoreTab('avantatges');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              storeTab === 'avantatges'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Comodins & Escuts de Racha</span>
          </button>
        </div>

        {/* Administrator Toolbar */}
        {isAdmin && storeTab === 'escuts' && (
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

        {/* Toolbar Admin / Docència per a Material d'Estudi */}
        {isDocentOrAdmin && storeTab === 'material' && (
          <div className="mt-5 p-3.5 bg-sky-500/10 border border-sky-500/30 rounded-2xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold">
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>Gestió de Material Docent (Rol: {user.role === 'question_editor' ? 'Docència' : 'Admin'})</span>
            </div>
            <button
              type="button"
              onClick={handleOpenCreateMaterialModal}
              className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-sky-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Pujar / Crear Nou Material</span>
            </button>
          </div>
        )}

        {/* PESTANYA 1: ESCUTS - Highlight Banner for Official TEDAX-NRBQ Patch */}
        {storeTab === 'escuts' && (() => {
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

        {/* Filter buttons per a escuts */}
        {storeTab === 'escuts' && (
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
        )}

        {/* Filter buttons dinàmics per a Material d'Estudi (Opció B: només surten si hi ha almenys 1 document) */}
        {storeTab === 'material' && (
          <div className="flex items-center gap-2 mt-5 flex-wrap">
            <button
              type="button"
              onClick={() => setMaterialFilter('tots')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                materialFilter === 'tots' 
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20' 
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              Tots ({studyMaterials.filter(m => isDocentOrAdmin || m.estat !== 'ocult').length})
            </button>

            {/* Botons d'Àmbit dinàmics: només apareixen si tenen com a mínim 1 document */}
            {availableAmbitsWithCount.map(([ambitName, count]) => (
              <button
                key={ambitName}
                type="button"
                onClick={() => setMaterialFilter(ambitName)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  materialFilter === ambitName 
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20' 
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span>{ambitName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  materialFilter === ambitName ? 'bg-slate-950 text-amber-400' : 'bg-slate-900 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            ))}

            {/* ⏳ Pròximament: només si en té com a mínim 1 */}
            {comingSoonCount > 0 && (
              <button
                type="button"
                onClick={() => setMaterialFilter('proximament')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  materialFilter === 'proximament' 
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20' 
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span>⏳ Pròximament</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  materialFilter === 'proximament' ? 'bg-slate-950 text-amber-400' : 'bg-slate-900 text-slate-400'
                }`}>
                  {comingSoonCount}
                </span>
              </button>
            )}

            {/* Adquirits / Descarregats */}
            {purchasedCount > 0 && (
              <button
                type="button"
                onClick={() => setMaterialFilter('adquirit')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  materialFilter === 'adquirit' 
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20' 
                    : 'bg-slate-800 text-emerald-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Adquirits ({purchasedCount})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* CONTINGUT SEGONS PESTANYA SELECCIONADA */}
      {storeTab === 'escuts' && (
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
                className={`bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between transition-all hover:scale-[1.02] shadow-lg ${
                  isEquipped
                    ? 'border-emerald-500/80 shadow-emerald-500/20 bg-slate-900/90'
                    : isUnlocked
                      ? 'border-amber-500/40 hover:border-amber-500'
                      : 'border-slate-800 opacity-90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {shield.unitat || 'Mossos'}
                    </span>
                    {isEquipped && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        Equipat
                      </span>
                    )}
                  </div>

                  <div className="flex justify-center my-4 py-2">
                    {shield.id === 'tedax' && !shield.customLogoUrl ? (
                      <TedaxBadge size={90} glow={isEquipped} />
                    ) : (
                      <ShieldRenderer
                        shieldId={shield.id}
                        shieldData={shield}
                        size={90}
                        glow={isEquipped}
                      />
                    )}
                  </div>

                  <h3 className="text-base font-black text-white text-center">
                    {shield.nom}
                  </h3>
                  <p className="text-xs text-slate-400 text-center mt-1 leading-snug line-clamp-2">
                    {shield.descripcio}
                  </p>
                </div>

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
                        Arriba a la <b>Casella 100</b> del Tauler per desbloquejar aquest escut d'or oficial!
                      </p>
                    </div>
                  ) : isCampaignReward ? (
                    <div className="w-full p-2.5 bg-red-950/40 border border-red-500/50 rounded-xl text-center space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-black text-red-300">
                        <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>BLOQUEJAT A LA BOTIGA</span>
                      </div>
                      <p className="text-[10px] text-red-200/90 leading-tight">
                        Arriba a la Casella 50 del Tauler de <b>{shield.ambitDesbloqueig}</b> per desbloquejar-lo.
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

                  {/* Botó edició admin */}
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
      )}

      {/* PESTANYA 2: MATERIAL D'ESTUDI / APUNTS */}
      {storeTab === 'material' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleMaterials.map((mat) => {
              const isPurchased = Boolean(
                user.purchasedMaterialIds?.includes(mat.id) || 
                user.unlockedMaterialIds?.includes(mat.id) || 
                mat.preuMerits === 0
              );
              const isComingSoon = mat.estat === 'proximament';
              const isHidden = mat.estat === 'ocult';

              const formatBadgeColor = 
                mat.format === 'pdf' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                mat.format === 'docx' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                mat.format === 'pptx' ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' :
                'bg-slate-700 text-slate-300 border-slate-600';

              return (
                <div
                  key={mat.id}
                  className={`bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between shadow-xl transition-all ${
                    isPurchased
                      ? 'border-emerald-500/40 bg-slate-900/90'
                      : isComingSoon
                        ? 'border-amber-500/30 opacity-90'
                        : 'border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${formatBadgeColor}`}>
                          {mat.format.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {mat.ambit}
                        </span>
                      </div>

                      {/* Status Badges */}
                      {isComingSoon ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          ⏳ Pròximament
                        </span>
                      ) : isHidden ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />
                          <span>Ocult</span>
                        </span>
                      ) : isPurchased ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          ✓ Desbloquejat
                        </span>
                      ) : (
                        <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          <span>{mat.preuMerits} Mèrits</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-white leading-snug">
                        {mat.titol}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                        {mat.descripcio}
                      </p>
                    </div>

                    {mat.tamanyText && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{mat.tamanyText}</span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="pt-4 mt-2 border-t border-slate-800 space-y-2">
                    {isPurchased ? (
                      <button
                        type="button"
                        onClick={() => handleOpenPurchasedDocument(mat)}
                        disabled={downloadingMatId === mat.id}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-75 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                      >
                        {downloadingMatId === mat.id ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Generant enllaç segur...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Descarregar / Obrir Document</span>
                          </>
                        )}
                      </button>
                    ) : isComingSoon ? (
                      <button
                        disabled
                        className="w-full py-2.5 px-4 bg-slate-800/80 text-amber-300/80 font-bold text-xs uppercase rounded-xl border border-amber-500/20 cursor-not-allowed text-center"
                      >
                        Pròximament Disponible
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleBuyStudyMaterial(mat)}
                        disabled={user.merits < mat.preuMerits || downloadingMatId === mat.id}
                        className={`w-full py-2.5 px-4 font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          user.merits >= mat.preuMerits
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/25'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        }`}
                      >
                        <Coins className="w-4 h-4" />
                        <span>Canviar per {mat.preuMerits} Mèrits</span>
                      </button>
                    )}

                    {/* Admin / Docència Controls */}
                    {isDocentOrAdmin && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditMaterialModal(mat)}
                          className="flex-1 py-1.5 text-[11px] font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        {confirmDeleteMaterialId === mat.id ? (
                          <div className="flex items-center gap-1 animate-fadeIn">
                            <button
                              type="button"
                              onClick={() => handleDeleteMaterial(mat.id)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] rounded-lg transition-colors cursor-pointer shadow-md flex items-center gap-1 animate-pulse"
                              title="Confirmar eliminació"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Eliminar?</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteMaterialId(null)}
                              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Cancel·lar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteMaterialId(mat.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar document del catàleg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PESTANYA 3: AVANTATGES & COMODINS (AMB ESCUT DE RACHA DIÀRIA) */}
      {storeTab === 'avantatges' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ITEM 1: ESCUT DE PROTECCIÓ DE RACHA */}
            <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl">
                    🛡️
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">A l'Inventari</span>
                    <div className="text-lg font-black text-amber-400">
                      {user.streakShieldsCount || 0} / 3 Escuts
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="text-lg font-black text-white">
                    Escut de Racha Diària
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Protegeix la teva racha si un dia no pots connectar-te o fer el repàs diari. Es consumirà automàticament per salvar el teu rècord sense reiniciar-lo!
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={handleBuyStreakProtection}
                  disabled={user.merits < 35 || (user.streakShieldsCount || 0) >= 3}
                  className={`w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    (user.streakShieldsCount || 0) >= 3
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : user.merits >= 35
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 shadow-lg shadow-amber-500/25'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  <span>
                    {(user.streakShieldsCount || 0) >= 3 
                      ? 'Límit Màxim Assolit (3)' 
                      : 'Comprar per 35 Mèrits'}
                  </span>
                </button>
              </div>
            </div>

            {/* ITEM 2: COMODÍ 50% TÀCTIC */}
            <div className="bg-slate-900 border border-sky-500/40 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-2xl">
                    ⚡
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">A l'Inventari</span>
                    <div className="text-lg font-black text-sky-400">
                      {user.wildcardsCount || 0} Comodins
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="text-lg font-black text-white">
                    Comodí 50% Tàctic
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Elimina automàticament 2 opcions errònies de qualsevol pregunta al Tauler de l'Oca o als Duels 1v1, facilitant encertar la resposta oficial.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <button
                  type="button"
                  onClick={onBuyWildcard}
                  disabled={user.merits < 10}
                  className={`w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    user.merits >= 10
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 text-white shadow-lg shadow-sky-500/25'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  <span>Comprar per 10 Mèrits</span>
                </button>
              </div>
            </div>
          </div>

          {/* GUIA D'ECONOMIA DE MÈRITS */}
          <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
            <div className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>Com guanyar més Mèrits ràpidament:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="text-slate-400 font-semibold">Missió Exprés Diària</div>
                <div className="text-amber-300 font-black mt-0.5">+50 Mèrits / dia</div>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="text-slate-400 font-semibold">Nivell Or a Camí ISPC</div>
                <div className="text-amber-300 font-black mt-0.5">Cofre de +50-75 Mèrits</div>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="text-slate-400 font-semibold">Duels 1v1 Policials</div>
                <div className="text-amber-300 font-black mt-0.5">+15 a +45 Mèrits</div>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="text-slate-400 font-semibold">Casella 50 de l'Oca</div>
                <div className="text-amber-300 font-black mt-0.5">+50 Mèrits + Escut</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADMIN/DOCÈNCIA PER GESTIONAR MATERIAL D'ESTUDI */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-sky-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-black text-white">
                  {editingMaterial ? 'Editar Material d’Estudi' : 'Pujar / Crear Nou Material'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMaterialModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Títol del Document</label>
                <input
                  type="text"
                  required
                  value={materialFormData.titol}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, titol: e.target.value })}
                  placeholder="Ex: Esquema Procediment Penal LECrim 2026"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Descripció</label>
                <textarea
                  rows={2}
                  value={materialFormData.descripcio}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, descripcio: e.target.value })}
                  placeholder="Contingut, punts clau i utilitat per a l'examen..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Format de l'arxiu</label>
                  <select
                    value={materialFormData.format}
                    onChange={(e) => setMaterialFormData({ ...materialFormData, format: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="pdf">PDF (.pdf)</option>
                    <option value="docx">Word (.docx)</option>
                    <option value="pptx">PowerPoint (.pptx)</option>
                    <option value="txt">Text (.txt)</option>
                    <option value="link">Enllaç extern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Àmbit Oficial</label>
                  <select
                    value={materialFormData.ambit}
                    onChange={(e) => setMaterialFormData({ ...materialFormData, ambit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Àmbit A">Àmbit A (Entorn)</option>
                    <option value="Àmbit B">Àmbit B (Institucional)</option>
                    <option value="Àmbit C">Àmbit C (Seguretat)</option>
                    <option value="Àmbit D">Àmbit D (Cultura/Actualitat)</option>
                    <option value="Tots">Transversal / Tots</option>
                    <option value="Psicotècnics">Psicotecnics</option>
                    <option value="Actualitat">Actualitat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Preu en Mèrits (0 = Gratuït)</label>
                  <input
                    type="number"
                    min="0"
                    value={materialFormData.preuMerits}
                    onChange={(e) => setMaterialFormData({ ...materialFormData, preuMerits: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Estat de Visibilitat (3 Estats)</label>
                  <select
                    value={materialFormData.estat}
                    onChange={(e) => setMaterialFormData({ ...materialFormData, estat: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value="actiu">🟢 Actiu (Canjeable per Mèrits)</option>
                    <option value="proximament">⏳ Pròximament (Visible, compra inactiva)</option>
                    <option value="ocult">👁️ Ocult (Només Admin / Docència)</option>
                  </select>
                </div>
              </div>

              {/* CÀRREGA DE DOCUMENT LOCAL A SUPABASE STORAGE PROTEGIT */}
              <div className="p-3.5 bg-slate-950/80 border border-sky-500/30 rounded-2xl space-y-2.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs">
                    <Upload className="w-4 h-4 text-sky-400" />
                    <span>Pujar Document Local (PDF, Word, PPT)</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>Protecció amb URL temporal (2 min)</span>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <label className={`px-4 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    isUploadingDoc 
                      ? 'bg-slate-800 border-slate-700 text-slate-400 cursor-wait'
                      : 'bg-sky-600 hover:bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-600/25'
                  }`}>
                    {isUploadingDoc ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Pujant a Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Tria arxiu del dispositiu</span>
                      </>
                    )}
                    <input
                      type="file"
                      disabled={isUploadingDoc}
                      accept=".pdf,.doc,.docx,.pptx,.ppt,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleDocumentFileUpload}
                      className="hidden"
                    />
                  </label>

                  {materialFormData.fileName && (
                    <div className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-[11px] text-slate-300">
                      <span className="truncate font-semibold text-white max-w-[180px] sm:max-w-[220px]" title={materialFormData.fileName}>
                        📄 {materialFormData.fileName}
                      </span>
                      <button
                        type="button"
                        onClick={() => setMaterialFormData(prev => ({ ...prev, fileName: '', storagePath: '', arxiuUrl: '' }))}
                        className="text-red-400 hover:text-red-300 ml-2 text-xs cursor-pointer"
                        title="Descartar fitxer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {uploadFeedback && (
                  <div className="text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 p-2 rounded-lg flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{uploadFeedback}</span>
                  </div>
                )}

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  🔒 L'arxiu es guarda al teu Storage de Supabase. Quan un alumne el compri amb mèrits, l'aplicació generarà un <b>enllaç segur amb caducitat d'un sol ús (2 minuts)</b>. Si comparteix l'enllaç per WhatsApp o xarxes, caducarà immediatament!
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  URL de descàrrega / visualització <span className="text-slate-500 font-normal">(o enllaç extern Drive/Web)</span>
                </label>
                <input
                  type="text"
                  value={materialFormData.arxiuUrl}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, arxiuUrl: e.target.value })}
                  placeholder="Omplert automàticament en pujar l'arxiu o enganxa una URL externa..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Detall de mida o pàgines</label>
                <input
                  type="text"
                  value={materialFormData.tamanyText}
                  onChange={(e) => setMaterialFormData({ ...materialFormData, tamanyText: e.target.value })}
                  placeholder="Ex: 2.8 MB (45 pàgines)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel·lar
                </button>
                <button
                  type="submit"
                  disabled={isSavingMaterial}
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl cursor-pointer shadow-md shadow-sky-500/20"
                >
                  {isSavingMaterial ? 'Desant...' : 'Guardar Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        

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
