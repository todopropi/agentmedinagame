import React, { useState, useEffect } from 'react';
import { 
  CONFUSION_CONCEPTS, 
  MNEMONIC_CARDS, 
  ConfusionConcept, 
  MnemonicCard, 
  saveCustomConfusion, 
  deleteCustomConfusion, 
  saveCustomMnemonic, 
  deleteCustomMnemonic,
  subscribeToConcepts 
} from '../data/conceptsAndMistakes';
import { 
  Brain, 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Save, 
  X, 
  AlertTriangle,
  Lightbulb,
  BookOpen
} from 'lucide-react';

interface AdminConceptsTabProps {
  onNotification: (notif: { type: 'success' | 'error'; message: string }) => void;
}

export const AdminConceptsTab: React.FC<AdminConceptsTabProps> = ({ onNotification }) => {
  const [subType, setSubType] = useState<'confusions' | 'mnemonics'>('confusions');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Lists
  const [confusions, setConfusions] = useState<ConfusionConcept[]>([...CONFUSION_CONCEPTS]);
  const [mnemonics, setMnemonics] = useState<MnemonicCard[]>([...MNEMONIC_CARDS]);

  // Edit / Create states
  const [isEditingConfusion, setIsEditingConfusion] = useState(false);
  const [editingConfusionId, setEditingConfusionId] = useState<string | null>(null);
  const [confusionForm, setConfusionForm] = useState({
    titol: '',
    ambit: 'Àmbit B (Institucional - Guia Oficial 2026)',
    concepteANom: '',
    concepteACaract: '',
    concepteATrampa: '',
    concepteBNom: '',
    concepteBCaract: '',
    concepteBTrampa: '',
    reglaMnemotecnica: ''
  });

  const [isEditingMnemonic, setIsEditingMnemonic] = useState(false);
  const [editingMnemonicId, setEditingMnemonicId] = useState<string | null>(null);
  const [mnemonicForm, setMnemonicForm] = useState({
    titol: '',
    regla: '',
    detall: '',
    ambit: 'General'
  });

  useEffect(() => {
    const unsub = subscribeToConcepts(() => {
      setConfusions([...CONFUSION_CONCEPTS]);
      setMnemonics([...MNEMONIC_CARDS]);
    });
    return unsub;
  }, []);

  // Filtered
  const filteredConfusions = confusions.filter(c => 
    c.titol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.ambit.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.reglaMnemotecnica.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.concepteA.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.concepteB.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMnemonics = mnemonics.filter(m => 
    m.titol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.regla.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.detall.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers for Confusion
  const handleStartCreateConfusion = () => {
    setEditingConfusionId(null);
    setConfusionForm({
      titol: '',
      ambit: 'Àmbit B (Institucional - Guia Oficial 2026)',
      concepteANom: '',
      concepteACaract: '',
      concepteATrampa: '',
      concepteBNom: '',
      concepteBCaract: '',
      concepteBTrampa: '',
      reglaMnemotecnica: ''
    });
    setIsEditingConfusion(true);
  };

  const handleStartEditConfusion = (concept: ConfusionConcept) => {
    setEditingConfusionId(concept.id);
    setConfusionForm({
      titol: concept.titol,
      ambit: concept.ambit,
      concepteANom: concept.concepteA.nom,
      concepteACaract: concept.concepteA.caracteristiques.join('\n'),
      concepteATrampa: concept.concepteA.trampaExamen,
      concepteBNom: concept.concepteB.nom,
      concepteBCaract: concept.concepteB.caracteristiques.join('\n'),
      concepteBTrampa: concept.concepteB.trampaExamen,
      reglaMnemotecnica: concept.reglaMnemotecnica
    });
    setIsEditingConfusion(true);
  };

  const handleSaveConfusion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confusionForm.titol.trim() || !confusionForm.concepteANom.trim() || !confusionForm.concepteBNom.trim()) {
      onNotification({ type: 'error', message: 'Omple com a mínim el títol i els noms dels dos conceptes.' });
      return;
    }

    const newConcept: ConfusionConcept = {
      id: editingConfusionId || `conf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      titol: confusionForm.titol.trim(),
      ambit: confusionForm.ambit.trim() || 'Àmbit B (Institucional)',
      concepteA: {
        nom: confusionForm.concepteANom.trim(),
        caracteristiques: confusionForm.concepteACaract
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean),
        trampaExamen: confusionForm.concepteATrampa.trim()
      },
      concepteB: {
        nom: confusionForm.concepteBNom.trim(),
        caracteristiques: confusionForm.concepteBCaract
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean),
        trampaExamen: confusionForm.concepteBTrampa.trim()
      },
      reglaMnemotecnica: confusionForm.reglaMnemotecnica.trim()
    };

    try {
      await saveCustomConfusion(newConcept);
      setConfusions([...CONFUSION_CONCEPTS]);
      setIsEditingConfusion(false);
      setEditingConfusionId(null);
      onNotification({ 
        type: 'success', 
        message: editingConfusionId ? 'Concepte trampa actualitzat amb èxit!' : 'Nou concepte trampa creat amb èxit!' 
      });
    } catch (err: any) {
      onNotification({ type: 'error', message: 'Error en desar el concepte.' });
    }
  };

  const handleDeleteConfusion = async (id: string, titol: string) => {
    if (!window.confirm(`Segur que vols eliminar el concepte "${titol}"?`)) return;
    try {
      await deleteCustomConfusion(id);
      setConfusions([...CONFUSION_CONCEPTS]);
      onNotification({ type: 'success', message: 'Concepte eliminat amb èxit.' });
    } catch (err: any) {
      onNotification({ type: 'error', message: 'Error en eliminar el concepte.' });
    }
  };

  // Handlers for Mnemonic
  const handleStartCreateMnemonic = () => {
    setEditingMnemonicId(null);
    setMnemonicForm({
      titol: '',
      regla: '',
      detall: '',
      ambit: 'General'
    });
    setIsEditingMnemonic(true);
  };

  const handleStartEditMnemonic = (card: MnemonicCard) => {
    setEditingMnemonicId(card.id);
    setMnemonicForm({
      titol: card.titol,
      regla: card.regla,
      detall: card.detall,
      ambit: card.ambit || 'General'
    });
    setIsEditingMnemonic(true);
  };

  const handleSaveMnemonic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mnemonicForm.titol.trim() || !mnemonicForm.regla.trim() || !mnemonicForm.detall.trim()) {
      onNotification({ type: 'error', message: 'Omple el títol, la regla i el detall explicatiu.' });
      return;
    }

    const newMnemonic: MnemonicCard = {
      id: editingMnemonicId || `mnemo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      titol: mnemonicForm.titol.trim(),
      regla: mnemonicForm.regla.trim(),
      detall: mnemonicForm.detall.trim(),
      ambit: mnemonicForm.ambit.trim() || 'General'
    };

    try {
      await saveCustomMnemonic(newMnemonic);
      setMnemonics([...MNEMONIC_CARDS]);
      setIsEditingMnemonic(false);
      setEditingMnemonicId(null);
      onNotification({ 
        type: 'success', 
        message: editingMnemonicId ? 'Regla mnemotècnica actualitzada amb èxit!' : 'Nova regla mnemotècnica creada amb èxit!' 
      });
    } catch (err: any) {
      onNotification({ type: 'error', message: 'Error en desar la regla.' });
    }
  };

  const handleDeleteMnemonic = async (id: string, titol: string) => {
    if (!window.confirm(`Segur que vols eliminar la regla "${titol}"?`)) return;
    try {
      await deleteCustomMnemonic(id);
      setMnemonics([...MNEMONIC_CARDS]);
      onNotification({ type: 'success', message: 'Regla mnemotècnica eliminada amb èxit.' });
    } catch (err: any) {
      onNotification({ type: 'error', message: 'Error en eliminar la regla.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Subtabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setSubType('confusions'); setIsEditingConfusion(false); setIsEditingMnemonic(false); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              subType === 'confusions'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Conceptes Trampa ({confusions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setSubType('mnemonics'); setIsEditingConfusion(false); setIsEditingMnemonic(false); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              subType === 'mnemonics'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Regles Mnemotècniques ({mnemonics.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {subType === 'confusions' && !isEditingConfusion && (
            <button
              type="button"
              onClick={handleStartCreateConfusion}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer ml-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Nou Concepte Trampa</span>
            </button>
          )}

          {subType === 'mnemonics' && !isEditingMnemonic && (
            <button
              type="button"
              onClick={handleStartCreateMnemonic}
              className="px-3.5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer ml-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Regla Mnemotècnica</span>
            </button>
          )}
        </div>
      </div>

      {/* SEARCH BAR */}
      {!isEditingConfusion && !isEditingMnemonic && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={subType === 'confusions' ? "Cerca per títol, àmbit o paraules clau..." : "Cerca per títol, acrònim o detall..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      )}

      {/* VIEW 1: CONFUSIONS LIST */}
      {subType === 'confusions' && !isEditingConfusion && (
        <div className="space-y-4">
          {filteredConfusions.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              No s'han trobat conceptes trampa amb el filtre actual.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredConfusions.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-4 sm:p-5 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/60 text-purple-300 border border-purple-800/40">
                        {c.ambit}
                      </span>
                      <h4 className="text-sm font-black text-white mt-1.5 flex items-center gap-2">
                        {c.titol}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditConfusion(c)}
                        title="Modificar aquest concepte"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteConfusion(c.id, c.titol)}
                        title="Eliminar aquest concepte"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Comparisons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                      <div className="font-extrabold text-sky-400 flex items-center gap-1.5">
                        <span>A:</span>
                        <span>{c.concepteA.nom}</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                        {c.concepteA.caracteristiques.map((item, idx) => (
                          <li key={idx} className="leading-relaxed">{item}</li>
                        ))}
                      </ul>
                      {c.concepteA.trampaExamen && (
                        <div className="p-2 rounded bg-amber-950/40 border border-amber-800/40 text-amber-300 text-[10px] font-semibold mt-1">
                          ⚠️ <b>Trampa d'Examen:</b> {c.concepteA.trampaExamen}
                        </div>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                      <div className="font-extrabold text-amber-400 flex items-center gap-1.5">
                        <span>B:</span>
                        <span>{c.concepteB.nom}</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                        {c.concepteB.caracteristiques.map((item, idx) => (
                          <li key={idx} className="leading-relaxed">{item}</li>
                        ))}
                      </ul>
                      {c.concepteB.trampaExamen && (
                        <div className="p-2 rounded bg-amber-950/40 border border-amber-800/40 text-amber-300 text-[10px] font-semibold mt-1">
                          ⚠️ <b>Trampa d'Examen:</b> {c.concepteB.trampaExamen}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mnemonic Rule Banner */}
                  {c.reglaMnemotecnica && (
                    <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-purple-200 text-xs flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-purple-400 shrink-0" />
                      <span><b>Truc d'or:</b> {c.reglaMnemotecnica}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FORM: CREATE / EDIT CONFUSION */}
      {subType === 'confusions' && isEditingConfusion && (
        <form onSubmit={handleSaveConfusion} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>{editingConfusionId ? 'Modificar Concepte Trampa' : 'Crear Nou Concepte Trampa'}</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsEditingConfusion(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Títol del Concepte Trampa *</label>
              <input
                type="text"
                value={confusionForm.titol}
                onChange={e => setConfusionForm({ ...confusionForm, titol: e.target.value })}
                placeholder="Ex: Tribunal Constitucional vs. Tribunal de Comptes"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Àmbit Oficial *</label>
              <input
                type="text"
                value={confusionForm.ambit}
                onChange={e => setConfusionForm({ ...confusionForm, ambit: e.target.value })}
                placeholder="Ex: Àmbit B (Institucional - Guia Oficial 2026)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>
          </div>

          {/* Concepte A */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h5 className="text-xs font-black text-sky-400 uppercase">Concepte A</h5>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Nom del Concepte A *</label>
              <input
                type="text"
                value={confusionForm.concepteANom}
                onChange={e => setConfusionForm({ ...confusionForm, concepteANom: e.target.value })}
                placeholder="Ex: Tribunal Constitucional (Art. 159 CE)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Característiques Clau (1 per línia)</label>
              <textarea
                rows={3}
                value={confusionForm.concepteACaract}
                onChange={e => setConfusionForm({ ...confusionForm, concepteACaract: e.target.value })}
                placeholder="Intèrpret suprem de la Constitució.&#10;12 membres elegits per 9 anys.&#10;NO forma part del Poder Judicial."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Trampa d'Examen que sol posar el Tribunal</label>
              <input
                type="text"
                value={confusionForm.concepteATrampa}
                onChange={e => setConfusionForm({ ...confusionForm, concepteATrampa: e.target.value })}
                placeholder="El tribunal sovint pregunta si és un òrgan del Poder Judicial (NO ho és)."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Concepte B */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h5 className="text-xs font-black text-amber-400 uppercase">Concepte B</h5>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Nom del Concepte B *</label>
              <input
                type="text"
                value={confusionForm.concepteBNom}
                onChange={e => setConfusionForm({ ...confusionForm, concepteBNom: e.target.value })}
                placeholder="Ex: Tribunal de Comptes (Art. 136 CE)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Característiques Clau (1 per línia)</label>
              <textarea
                rows={3}
                value={confusionForm.concepteBCaract}
                onChange={e => setConfusionForm({ ...confusionForm, concepteBCaract: e.target.value })}
                placeholder="Suprem òrgan fiscalitzador dels comptes de l'Estat.&#10;Depèn directament de les Corts Generals.&#10;Jurisdicció comptable pròpia."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Trampa d'Examen que sol posar el Tribunal</label>
              <input
                type="text"
                value={confusionForm.concepteBTrampa}
                onChange={e => setConfusionForm({ ...confusionForm, concepteBTrampa: e.target.value })}
                placeholder="No confonguis jutjar delictes ordinaris amb jutjar la gestió econòmica comptable."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Regla Mnemotècnica / Truc d'Or *</label>
            <input
              type="text"
              value={confusionForm.reglaMnemotecnica}
              onChange={e => setConfusionForm({ ...confusionForm, reglaMnemotecnica: e.target.value })}
              placeholder="Ex: TC = Drets i Constitució (12 membres, 9 anys). T. Comptes = DÉU DEL DINER (Fiscalització)."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditingConfusion(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel·lar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Desar Concepte Trampa</span>
            </button>
          </div>
        </form>
      )}

      {/* VIEW 2: MNEMONICS LIST */}
      {subType === 'mnemonics' && !isEditingMnemonic && (
        <div className="space-y-4">
          {filteredMnemonics.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              No s'han trobat regles mnemotècniques amb el filtre actual.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMnemonics.map((m) => (
                <div
                  key={m.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-sm font-black text-white">
                        {m.titol}
                      </h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditMnemonic(m)}
                          title="Modificar aquesta regla"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMnemonic(m.id, m.titol)}
                          title="Eliminar aquesta regla"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-sky-950/50 border border-sky-800/40 text-sky-200 text-xs font-mono font-bold">
                      💡 {m.regla}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      {m.detall}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FORM: CREATE / EDIT MNEMONIC */}
      {subType === 'mnemonics' && isEditingMnemonic && (
        <form onSubmit={handleSaveMnemonic} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-sky-400" />
              <span>{editingMnemonicId ? 'Modificar Regla Mnemotècnica' : 'Crear Nova Regla Mnemotècnica'}</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsEditingMnemonic(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Títol de la Regla *</label>
            <input
              type="text"
              value={mnemonicForm.titol}
              onChange={e => setMnemonicForm({ ...mnemonicForm, titol: e.target.value })}
              placeholder="Ex: 🏛️ B-I-E-S: Les 4 Escales del Cos de Mossos d'Esquadra (Llei 10/1994)"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Regla Mnemotècnica / Paraula Clau / Acrònim *</label>
            <input
              type="text"
              value={mnemonicForm.regla}
              onChange={e => setMnemonicForm({ ...mnemonicForm, regla: e.target.value })}
              placeholder="Ex: Bàsica ➔ Intermèdia ➔ Executiva ➔ Superior"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Detall Explicatiu *</label>
            <textarea
              rows={4}
              value={mnemonicForm.detall}
              onChange={e => setMnemonicForm({ ...mnemonicForm, detall: e.target.value })}
              placeholder="Explicació oficial amb categories, referències d'articles i matisos per a l'examen oficial."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditingMnemonic(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel·lar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Desar Regla Mnemotècnica</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
