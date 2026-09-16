import React, { useState } from 'react';
import { Question } from '../types';
import { QUESTIONS_BANK, addCustomQuestions } from '../data/questionsBank';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Upload, 
  Download, 
  X, 
  Save, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'llista' | 'crear' | 'importar'>('llista');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedAmbitFilter, setSelectedAmbitFilter] = useState<string>('tots');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form states for creating/editing
  const [formData, setFormData] = useState<Partial<Question>>({
    ambit: 'Àmbit A',
    seccio: 'Història de Catalunya (part I)',
    pregunta: '',
    opcions: ['', '', '', ''],
    resposta: 0,
    explicacio: '',
    guiaPagina: '',
    guiaTema: '',
    clauTribunal: ''
  });

  const [importJsonText, setImportJsonText] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const filteredQuestions = QUESTIONS_BANK.filter(q => {
    const matchesSearch = 
      q.pregunta.toLowerCase().includes(searchFilter.toLowerCase()) ||
      q.seccio.toLowerCase().includes(searchFilter.toLowerCase()) ||
      q.explicacio.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesAmbit = selectedAmbitFilter === 'tots' || q.ambit === selectedAmbitFilter;
    return matchesSearch && matchesAmbit;
  });

  const handleStartEdit = (q: Question) => {
    setEditingQuestion(q);
    setFormData({
      id: q.id,
      ambit: q.ambit,
      seccio: q.seccio,
      pregunta: q.pregunta,
      opcions: [...q.opcions],
      resposta: q.resposta,
      explicacio: q.explicacio,
      guiaPagina: q.guiaPagina || '',
      guiaTema: q.guiaTema || '',
      clauTribunal: q.clauTribunal || '',
      quadreMemoritzar: q.quadreMemoritzar
    });
    setActiveSubTab('crear');
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pregunta || !formData.opcions || formData.opcions.some(o => !o.trim())) {
      setNotification({ type: 'error', message: 'Omple la pregunta i totes 4 opcions de resposta.' });
      return;
    }

    const questionToSave: Question = {
      id: editingQuestion ? editingQuestion.id : `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ambit: (formData.ambit as any) || 'Àmbit A',
      seccio: formData.seccio || 'General',
      pregunta: formData.pregunta,
      opcions: formData.opcions,
      resposta: Number(formData.resposta) || 0,
      explicacio: formData.explicacio || 'Explicació del temari de Mossos.',
      guiaPagina: formData.guiaPagina || undefined,
      guiaTema: formData.guiaTema || undefined,
      clauTribunal: formData.clauTribunal || undefined,
      quadreMemoritzar: formData.quadreMemoritzar
    };

    if (editingQuestion) {
      const idx = QUESTIONS_BANK.findIndex(q => q.id === editingQuestion.id);
      if (idx >= 0) {
        QUESTIONS_BANK[idx] = questionToSave;
      }
      setNotification({ type: 'success', message: 'Pregunta actualitzada correctament!' });
    } else {
      addCustomQuestions([questionToSave]);
      setNotification({ type: 'success', message: 'Nova pregunta afegida al banc del joc!' });
    }

    // Reset form
    setEditingQuestion(null);
    setFormData({
      ambit: 'Àmbit A',
      seccio: 'Història de Catalunya (part I)',
      pregunta: '',
      opcions: ['', '', '', ''],
      resposta: 0,
      explicacio: '',
      guiaPagina: '',
      guiaTema: '',
      clauTribunal: ''
    });
    setActiveSubTab('llista');
  };

  const handleDeleteQuestion = (id: string) => {
    if (!window.confirm('Estàs segur que vols eliminar aquesta pregunta?')) return;
    const idx = QUESTIONS_BANK.findIndex(q => q.id === id);
    if (idx >= 0) {
      QUESTIONS_BANK.splice(idx, 1);
      try {
        const customOnly = QUESTIONS_BANK.filter(q => q.id.startsWith('custom_'));
        localStorage.setItem('agent_medina_custom_questions', JSON.stringify(customOnly));
      } catch (e) {
        console.error(e);
      }
      setNotification({ type: 'success', message: 'Pregunta eliminada.' });
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(QUESTIONS_BANK, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `banc_preguntes_mossos_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleProcessImport = () => {
    try {
      if (!importJsonText.trim()) {
        setNotification({ type: 'error', message: 'Enganxa o puja un fitxer JSON vàlid.' });
        return;
      }
      const parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) {
        setNotification({ type: 'error', message: 'El contingut ha de ser un array de preguntes.' });
        return;
      }
      const valids: Question[] = parsed.filter(item => item.pregunta && Array.isArray(item.opcions) && item.opcions.length >= 2);
      if (valids.length === 0) {
        setNotification({ type: 'error', message: 'No s\'han trobat preguntes vàlides.' });
        return;
      }
      addCustomQuestions(valids);
      setNotification({ type: 'success', message: `S'han importat ${valids.length} preguntes correctament!` });
      setImportJsonText('');
      setActiveSubTab('llista');
    } catch (e: any) {
      setNotification({ type: 'error', message: 'Error de sintaxi JSON: ' + e.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Panell d'Administrador
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                  Accés Exclusiu
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Autoritzat per a: <span className="text-amber-300 font-mono">{currentUserEmail}</span> (Banc total: {QUESTIONS_BANK.length} preguntes)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {notification && (
          <div className={`p-3 text-xs font-bold flex items-center justify-between ${
            notification.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-800' : 'bg-rose-950/80 text-rose-300 border-b border-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="underline text-[11px] cursor-pointer">
              Tancar
            </button>
          </div>
        )}

        {/* Sub-tabs bar */}
        <div className="flex items-center gap-2 px-4 pt-3 border-b border-slate-800 bg-slate-900/50">
          <button
            type="button"
            onClick={() => setActiveSubTab('llista')}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'llista' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Gestió de Preguntes ({filteredQuestions.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingQuestion(null);
              setActiveSubTab('crear');
            }}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1 ${
              activeSubTab === 'crear' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{editingQuestion ? 'Editar Pregunta' : 'Afegir Nova Pregunta'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('importar')}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1 ${
              activeSubTab === 'importar' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar / Exportar JSON</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeSubTab === 'llista' && (
            <div className="space-y-4">
              {/* Search and Ambit Filter */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Cercar per text de pregunta o concepte..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <select
                  value={selectedAmbitFilter}
                  onChange={(e) => setSelectedAmbitFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="tots">Tots els àmbits</option>
                  <option value="Àmbit A">Àmbit A (Entorn)</option>
                  <option value="Àmbit B">Àmbit B (Institucional)</option>
                  <option value="Àmbit C">Àmbit C (Seguretat i Policia)</option>
                  <option value="Actualitat">Actualitat</option>
                  <option value="ISPC">ISPC Repte</option>
                </select>

                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                  title="Descarregar tot el banc a JSON"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar</span>
                </button>
              </div>

              {/* Questions List Table / Cards */}
              <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
                {filteredQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-3.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                          {q.ambit}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{q.seccio}</span>
                        {q.guiaPagina && (
                          <span className="text-[11px] text-amber-300 font-mono">[{q.guiaPagina}]</span>
                        )}
                        {q.id.startsWith('custom_') && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">Personalitzada</span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-white line-clamp-2">
                        {q.pregunta}
                      </p>
                      <p className="text-[11px] text-emerald-400 font-medium truncate max-w-xl">
                        ✓ Correcta: {q.opcions[q.resposta]}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(q)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="Modificar pregunta"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 rounded-lg text-xs font-bold flex items-center gap-1 border border-rose-800/40 cursor-pointer"
                        title="Eliminar pregunta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'crear' && (
            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Àmbit Oficial</label>
                  <select
                    value={formData.ambit}
                    onChange={(e) => setFormData({ ...formData, ambit: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:border-amber-500"
                  >
                    <option value="Àmbit A">Àmbit A (Coneixements de l'entorn)</option>
                    <option value="Àmbit B">Àmbit B (Àmbit institucional)</option>
                    <option value="Àmbit C">Àmbit C (Seguretat i policia)</option>
                    <option value="Actualitat">Actualitat</option>
                    <option value="ISPC">ISPC Repte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tema / Secció</label>
                  <input
                    type="text"
                    value={formData.seccio || ''}
                    onChange={(e) => setFormData({ ...formData, seccio: e.target.value })}
                    placeholder="Ex: Tema C.4 · Marc Legal (LO 2/1986)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Enunciat de la Pregunta</label>
                <textarea
                  rows={2}
                  value={formData.pregunta || ''}
                  onChange={(e) => setFormData({ ...formData, pregunta: e.target.value })}
                  placeholder="Escriu la pregunta literal oficial..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:border-amber-500"
                />
              </div>

              {/* 4 Options */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">Opcions de resposta (Marca quina és la correcta)</label>
                {['A', 'B', 'C', 'D'].map((letter, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={formData.resposta === idx}
                      onChange={() => setFormData({ ...formData, resposta: idx })}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer"
                    />
                    <span className="w-5 text-xs font-bold text-amber-400">{letter})</span>
                    <input
                      type="text"
                      value={formData.opcions?.[idx] || ''}
                      onChange={(e) => {
                        const newOpts = [...(formData.opcions || ['', '', '', ''])];
                        newOpts[idx] = e.target.value;
                        setFormData({ ...formData, opcions: newOpts });
                      }}
                      placeholder={`Opció ${letter}`}
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:border-amber-500"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Pàgina Guia Oficial</label>
                  <input
                    type="text"
                    value={formData.guiaPagina || ''}
                    onChange={(e) => setFormData({ ...formData, guiaPagina: e.target.value })}
                    placeholder="Ex: Pàg. 133"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Clau de Test pel Tribunal</label>
                  <input
                    type="text"
                    value={formData.clauTribunal || ''}
                    onChange={(e) => setFormData({ ...formData, clauTribunal: e.target.value })}
                    placeholder="Ex: Atenció a la trampa de terminis màxims..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Explicació Pedagògica</label>
                <textarea
                  rows={2}
                  value={formData.explicacio || ''}
                  onChange={(e) => setFormData({ ...formData, explicacio: e.target.value })}
                  placeholder="Justificació de la resposta correcta extreta de la Guia..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingQuestion(null);
                    setActiveSubTab('llista');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel·lar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingQuestion ? 'Guardar Canvis' : 'Crear Pregunta'}</span>
                </button>
              </div>
            </form>
          )}

          {activeSubTab === 'importar' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-2">
                <p className="font-bold text-white">Format d'importació per lots:</p>
                <p>
                  Pots enganxar un fitxer JSON amb una llista de preguntes. Cada pregunta ha d'incloure: <code className="text-amber-300 font-mono">pregunta</code>, <code className="text-amber-300 font-mono">opcions</code> (array de 4 textos) i <code className="text-amber-300 font-mono">resposta</code> (0 a 3).
                </p>
              </div>

              <textarea
                rows={8}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='[
  {
    "ambit": "Àmbit B",
    "seccio": "Drets Humans",
    "pregunta": "Termini màxim de detenció...",
    "opcions": ["24h", "48h", "72h", "5 dies"],
    "resposta": 2,
    "explicacio": "Article 17.2 CE..."
  }
]'
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:border-amber-500 focus:outline-none"
              />

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descarregar Còpia de Seguretat (.json)</span>
                </button>

                <button
                  type="button"
                  onClick={handleProcessImport}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Upload className="w-4 h-4" />
                  <span>Importar al Banc Oficial</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
