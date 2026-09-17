import React, { useState, useEffect, useRef } from 'react';
import { SpecializedShield } from '../types';
import { X, Upload, Link, Image as ImageIcon, Sparkles, Check, AlertCircle } from 'lucide-react';

interface ShopItemAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit: SpecializedShield | null;
  onSave: (item: SpecializedShield) => void;
}

export const ShopItemAdminModal: React.FC<ShopItemAdminModalProps> = ({
  isOpen,
  onClose,
  itemToEdit,
  onSave
}) => {
  const [nom, setNom] = useState('');
  const [unitat, setUnitat] = useState('');
  const [preuMerits, setPreuMerits] = useState(50);
  const [descripcio, setDescripcio] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageInputMode, setImageInputMode] = useState<'url' | 'file'>('url');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (itemToEdit) {
      setNom(itemToEdit.nom || '');
      setUnitat(itemToEdit.unitat || '');
      setPreuMerits(itemToEdit.preuMerits ?? 50);
      setDescripcio(itemToEdit.descripcio || '');
      setImageUrl(itemToEdit.imageUrl || '');
    } else {
      setNom('');
      setUnitat('');
      setPreuMerits(50);
      setDescripcio('');
      setImageUrl('');
    }
    setErrorMsg(null);
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Si us plau, selecciona un arxiu d\'imatge vàlid (.png, .jpg, .svg, .webp).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('La imatge no ha de superar els 2MB.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      setErrorMsg('El nom de l\'article és obligatori.');
      return;
    }
    if (!unitat.trim()) {
      setErrorMsg('El subtítol (unitat o descripció breu) és obligatori.');
      return;
    }
    if (preuMerits < 0) {
      setErrorMsg('El preu en Mèrits ha de ser igual o superior a 0.');
      return;
    }

    const newItem: SpecializedShield = {
      id: itemToEdit?.id || `shield_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      nom: nom.trim(),
      unitat: unitat.trim(),
      preuMerits: Number(preuMerits),
      descripcio: descripcio.trim() || nom.trim(),
      imageUrl: imageUrl.trim() || undefined,
      escutTipus: itemToEdit?.escutTipus || 'generic_pvc',
      colorPrincipal: itemToEdit?.colorPrincipal || 'blue-600',
      colorSecundari: itemToEdit?.colorSecundari || '#eab308'
    };

    onSave(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        id="shop-item-admin-modal"
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Glow Header */}
        <div className="absolute top-0 right-0 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-black text-white">
                {itemToEdit ? "Modificar Article de la Botiga" : "Afegir Nou Article a la Botiga"}
              </h3>
              <p className="text-xs text-slate-400">
                Rol Administrador (opossscar@gmail.com)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 relative z-10">
          {/* Nom */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Nom de l'article *
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Escut Dron Mossos d'Esquadra"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>

          {/* Subtítol (lo de abajo del nombre) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Subtítol (sota el nom / Unitat) *
            </label>
            <input
              type="text"
              value={unitat}
              onChange={(e) => setUnitat(e.target.value)}
              placeholder="Ex: Unitat Central de Drons (UCD)"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>

          {/* Preu en mèrits */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Preu en Mèrits (guanyats jugant) *
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={preuMerits}
              onChange={(e) => setPreuMerits(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="Ex: 85"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>

          {/* Foto del logo (URL o archivo) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-300">
                Foto del logo (URL o arxiu)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setImageInputMode('url')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                    imageInputMode === 'url' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Link className="w-3 h-3 inline mr-1" />
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode('file')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                    imageInputMode === 'file' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Upload className="w-3 h-3 inline mr-1" />
                  Pujar Arxiu
                </button>
              </div>
            </div>

            {imageInputMode === 'url' ? (
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemple.com/escut-logo.png"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            ) : (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-800/80 border border-dashed border-slate-700 hover:border-amber-500/70 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Seleccionar arxiu d'imatge des del teu dispositiu</span>
                </button>
              </div>
            )}

            {/* Preview of the logo image */}
            {imageUrl && (
              <div className="mt-2.5 p-2 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src={imageUrl}
                      alt="Vista prèvia"
                      className="w-full h-full object-contain"
                      onError={() => setErrorMsg('No s\'ha pogut carregar la imatge des de la URL indicada.')}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Vista prèvia del logo
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="px-2 py-1 text-[10px] text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                >
                  Eliminar foto
                </button>
              </div>
            )}
          </div>

          {/* Descripció */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Descripció
            </label>
            <textarea
              rows={2}
              value={descripcio}
              onChange={(e) => setDescripcio(e.target.value)}
              placeholder="Descripció de la insígnia, funcions de la unitat o història..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel·lar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{itemToEdit ? 'Guardar Canvis' : 'Crear Article'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
