import React, { useState } from 'react';
import { 
  PLMunicipi, 
  PLTema, 
  PLPregunta, 
  PLConvocatoriaStatus 
} from '../../types/policiaLocal';
import { 
  savePLMunicipi, 
  deletePLMunicipi, 
  savePLTema, 
  deletePLTema, 
  savePLPregunta, 
  importMassivePLPreguntes 
} from '../../services/policiaLocalService';
import { AudioEngine } from '../../utils/audio';
import { 
  X, 
  Building2, 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Upload, 
  Save, 
  Settings, 
  Scale, 
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface PLAdminModalProps {
  municipis: PLMunicipi[];
  temes: PLTema[];
  questions: PLPregunta[];
  onClose: () => void;
  onRefreshData: () => Promise<void>;
}

type AdminTab = 'municipis' | 'temes' | 'nova_pregunta' | 'import_massiu';

export const PLAdminModal: React.FC<PLAdminModalProps> = ({
  municipis,
  temes,
  questions,
  onClose,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('municipis');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'topic' | 'municipi';
    id: string;
    name: string;
  } | null>(null);

  // --- ESTAT: GESTIÓ DE MUNICIPIS ---
  const [editingMunicipi, setEditingMunicipi] = useState<PLMunicipi | null>(null);
  const [isCreatingMunicipi, setIsCreatingMunicipi] = useState(false);
  const [mName, setMName] = useState('');
  const [mSlug, setMSlug] = useState('');
  const [mBannerColor, setMBannerColor] = useState('blue');
  const [mStatus, setMStatus] = useState<PLConvocatoriaStatus>('pending');
  const [mRegDeadline, setMRegDeadline] = useState('');
  const [mRegClosedAt, setMRegClosedAt] = useState('');
  const [mExamDate, setMExamDate] = useState('');
  const [mCulturaWeight, setMCulturaWeight] = useState(50);
  const [mTemariWeight, setMTemariWeight] = useState(50);
  const [mNotes, setMNotes] = useState('');

  // --- ESTAT: GESTIÓ DE TEMES ---
  const [selectedTopicScope, setSelectedTopicScope] = useState<string>('comu'); // 'comu', 'cultura_general', or municipiId
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [editingTopic, setEditingTopic] = useState<PLTema | null>(null);
  const [tNum, setTNum] = useState<number>(1);
  const [tCode, setTCode] = useState('Tema 1');
  const [tTitle, setTTitle] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tAnnex, setTAnnex] = useState('');

  // --- ESTAT: NOVA PREGUNTA INDIVIDUAL ---
  const [newQScope, setNewQScope] = useState<string>('comu');
  const [newQTemaId, setNewQTemaId] = useState<string>('');
  const [newQText, setNewQText] = useState('');
  const [newQOptions, setNewQOptions] = useState<string[]>(['', '', '', '']);
  const [newQCorrect, setNewQCorrect] = useState<number>(0);
  const [newQExplanation, setNewQExplanation] = useState('');

  // --- ESTAT: IMPORTACIÓ MASIVA JSON ---
  const [jsonInput, setJsonInput] = useState('');
  const [importTargetScope, setImportTargetScope] = useState<string>('auto'); // 'auto', 'comu', 'cultura_general' or municipiId
  const [importTargetTemaId, setImportTargetTemaId] = useState<string>('');
  const [jsonPreviewCount, setJsonPreviewCount] = useState<number | null>(null);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  // -------------------------------------------------------------
  // ACCIONS: MUNICIPIS
  // -------------------------------------------------------------
  const handleOpenEditMunicipi = (m: PLMunicipi) => {
    setEditingMunicipi(m);
    setIsCreatingMunicipi(false);
    setMName(m.name);
    setMSlug(m.slug);
    setMBannerColor(m.banner_color || 'blue');
    setMStatus(m.status);
    setMRegDeadline(m.registration_deadline ? m.registration_deadline.split('T')[0] : '');
    setMRegClosedAt(m.registration_closed_at ? m.registration_closed_at.split('T')[0] : '');
    setMExamDate(m.exam_date ? m.exam_date.split('T')[0] : '');
    setMCulturaWeight(m.cultura_weight ?? 50);
    setMTemariWeight(m.temari_weight ?? 50);
    setMNotes(m.notes || '');
  };

  const handleOpenCreateMunicipi = () => {
    setEditingMunicipi(null);
    setIsCreatingMunicipi(true);
    setMName('');
    setMSlug('');
    setMBannerColor('blue');
    setMStatus('pending');
    setMRegDeadline('');
    setMRegClosedAt('');
    setMExamDate('');
    setMCulturaWeight(50);
    setMTemariWeight(50);
    setMNotes('');
  };

  const handleSaveMunicipi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName.trim()) return;

    setIsProcessing(true);
    const mId = editingMunicipi 
      ? editingMunicipi.id 
      : mSlug.trim() || mName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    const parseSafeDate = (dStr: string) => {
      if (!dStr.trim()) return null;
      try {
        const d = new Date(dStr.includes('T') ? dStr : `${dStr}T00:00:00.000Z`);
        return isNaN(d.getTime()) ? null : d.toISOString();
      } catch {
        return null;
      }
    };

    const payload: PLMunicipi = {
      id: mId,
      name: mName.trim(),
      slug: mSlug.trim() || mId.replace(/_/g, '-'),
      banner_color: mBannerColor,
      status: mStatus,
      registration_deadline: parseSafeDate(mRegDeadline),
      registration_closed_at: parseSafeDate(mRegClosedAt),
      exam_date: parseSafeDate(mExamDate),
      cultura_weight: Number(mCulturaWeight) || 50,
      temari_weight: Number(mTemariWeight) || 50,
      notes: mNotes.trim() || null,
      order_index: editingMunicipi?.order_index ?? (municipis.length + 1)
    };

    const saved = await savePLMunicipi(payload);
    setIsProcessing(false);

    if (saved) {
      showStatus('success', `Municipi "${saved.name}" actualitzat correctament al servidor!`);
      setEditingMunicipi(null);
      setIsCreatingMunicipi(false);
      await onRefreshData();
      AudioEngine.playSuccess();
    } else {
      showStatus('error', 'No s’ha pogut desar el municipi al servidor.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setIsProcessing(true);
    if (confirmDelete.type === 'topic') {
      const ok = await deletePLTema(confirmDelete.id);
      setIsProcessing(false);
      if (ok) {
        showStatus('success', `Tema "${confirmDelete.name}" eliminat correctament del servidor.`);
        await onRefreshData();
        AudioEngine.playClick();
      } else {
        showStatus('error', 'No s’ha pogut eliminar el tema.');
      }
    } else {
      const ok = await deletePLMunicipi(confirmDelete.id);
      setIsProcessing(false);
      if (ok) {
        showStatus('success', `Municipi "${confirmDelete.name}" eliminat del servidor.`);
        await onRefreshData();
        AudioEngine.playClick();
      } else {
        showStatus('error', 'No s’ha pogut eliminar el municipi.');
      }
    }
    setConfirmDelete(null);
  };

  // -------------------------------------------------------------
  // ACCIONS: TEMES
  // -------------------------------------------------------------
  const filteredTemes = temes.filter(t => {
    if (selectedTopicScope === 'comu') return t.scope === 'comu';
    if (selectedTopicScope === 'cultura_general') return t.scope === 'cultura_general';
    return t.municipi_id === selectedTopicScope;
  });

  const handleOpenCreateTopic = () => {
    setIsCreatingTopic(true);
    setEditingTopic(null);
    const nextNum = filteredTemes.length + 1;
    setTNum(nextNum);
    setTCode(`Tema ${nextNum}`);
    setTTitle('');
    setTDesc('');
    setTAnnex('');
  };

  const handleOpenEditTopic = (topic: PLTema) => {
    setEditingTopic(topic);
    setIsCreatingTopic(false);
    setTNum(topic.num);
    setTCode(topic.code);
    setTTitle(topic.title);
    setTDesc(topic.description || '');
    setTAnnex(topic.annex || '');
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTitle.trim()) return;

    setIsProcessing(true);
    const isComu = selectedTopicScope === 'comu';
    const isCultura = selectedTopicScope === 'cultura_general';

    const topicId = editingTopic 
      ? editingTopic.id 
      : `${selectedTopicScope}_tema_${tNum}_${Date.now()}`;

    const payload: PLTema = {
      id: topicId,
      municipi_id: (!isComu && !isCultura) ? selectedTopicScope : null,
      scope: isComu ? 'comu' : (isCultura ? 'cultura_general' : 'municipi'),
      annex: tAnnex.trim() || null,
      num: Number(tNum),
      code: tCode.trim(),
      title: tTitle.trim(),
      description: tDesc.trim() || null
    };

    const saved = await savePLTema(payload);
    setIsProcessing(false);

    if (saved) {
      showStatus('success', `Tema "${saved.code}" desat correctament al servidor!`);
      setIsCreatingTopic(false);
      setEditingTopic(null);
      await onRefreshData();
      AudioEngine.playSuccess();
    } else {
      showStatus('error', 'Error desant el tema.');
    }
  };

  // -------------------------------------------------------------
  // ACCIONS: PREGUNTA INDIVIDUAL
  // -------------------------------------------------------------
  const topicsForNewQuestion = temes.filter(t => {
    if (newQScope === 'comu') return t.scope === 'comu';
    if (newQScope === 'cultura_general') return t.scope === 'cultura_general';
    return t.municipi_id === newQScope;
  });

  const handleSaveSingleQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim() || !newQTemaId) {
      showStatus('error', 'Has d’indicar el tema i l’enunciat de la pregunta.');
      return;
    }

    const filledOptions = newQOptions.map(o => o.trim()).filter(Boolean);
    if (filledOptions.length < 2) {
      showStatus('error', 'Has d’omplir almenys 2 opcions de resposta.');
      return;
    }

    setIsProcessing(true);
    const isComu = newQScope === 'comu';
    const isCultura = newQScope === 'cultura_general';

    const questionPayload: PLPregunta = {
      id: `pl_q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tema_id: newQTemaId,
      municipi_id: (!isComu && !isCultura) ? newQScope : null,
      question: newQText.trim(),
      options: filledOptions,
      correct_answer: newQCorrect,
      explanation: newQExplanation.trim() || null
    };

    const saved = await savePLPregunta(questionPayload);
    setIsProcessing(false);

    if (saved) {
      showStatus('success', 'Pregunta afegida correctament al servidor!');
      setNewQText('');
      setNewQOptions(['', '', '', '']);
      setNewQCorrect(0);
      setNewQExplanation('');
      await onRefreshData();
      AudioEngine.playSuccess();
    } else {
      showStatus('error', 'No s’ha pogut afegir la pregunta.');
    }
  };

  // -------------------------------------------------------------
  // ACCIONS: IMPORTACIÓ MASSIVA JSON
  // -------------------------------------------------------------
  const handleAnalyzeJson = () => {
    try {
      if (!jsonInput.trim()) {
        setJsonPreviewCount(null);
        return;
      }
      const parsed = JSON.parse(jsonInput);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      setJsonPreviewCount(items.length);
      showStatus('success', `JSON vàlid: ${items.length} preguntes detectades.`);
    } catch (e: any) {
      setJsonPreviewCount(null);
      showStatus('error', `Error de sintaxi JSON: ${e.message}`);
    }
  };

  const handleExecuteImport = async () => {
    if (!jsonInput.trim()) return;
    setIsProcessing(true);

    const isComu = importTargetScope === 'comu';
    const isCultura = importTargetScope === 'cultura_general';
    const isAuto = importTargetScope === 'auto';

    const targetMunId = (!isComu && !isCultura && !isAuto) ? importTargetScope : undefined;
    const targetTema = importTargetTemaId || undefined;

    const result = await importMassivePLPreguntes(
      jsonInput,
      targetTema,
      targetMunId,
      temes
    );

    setIsProcessing(false);

    if (result.success) {
      showStatus('success', `S'han importat ${result.count} preguntes al servidor amb èxit!`);
      setJsonInput('');
      setJsonPreviewCount(null);
      await onRefreshData();
      AudioEngine.playFanfare();
    } else {
      showStatus('error', result.error || 'Error en la importació.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-sky-500/30 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[94vh]">
        
        {/* HEADER */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ADMINISTRACIÓ
                </span>
                <span className="text-xs font-bold text-white">Panell Policia Local</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Gestiona municipis, temes, convocatòries i banc de preguntes en temps real
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BARRA DE PESTANYES */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 overflow-x-auto px-4 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('municipis')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'municipis'
                ? 'bg-slate-900 border-sky-500/40 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Municipis ({municipis.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('temes')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'temes'
                ? 'bg-slate-900 border-sky-500/40 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Temes ({temes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('nova_pregunta')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'nova_pregunta'
                ? 'bg-slate-900 border-sky-500/40 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Afegir Pregunta</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import_massiu')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'import_massiu'
                ? 'bg-slate-900 border-sky-500/40 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Importació Massiva JSON</span>
          </button>
        </div>

        {/* NOTIFICACIÓ D'ESTAT */}
        {statusMsg && (
          <div className={`mx-5 mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* CONTINGUT DE LA PESTANYA */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* ========================================================= */}
          {/* 1. PESTANYA MUNICIPIS */}
          {/* ========================================================= */}
          {activeTab === 'municipis' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Llistat de Municipis i Convocatòries</h4>
                  <p className="text-xs text-slate-400">Configura dates d'examen, estats d'inscripció i ponderacions.</p>
                </div>
                {!isCreatingMunicipi && !editingMunicipi && (
                  <button
                    type="button"
                    onClick={handleOpenCreateMunicipi}
                    className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nou Municipi</span>
                  </button>
                )}
              </div>

              {/* FORMULARI CREAR / EDITAR MUNICIPI */}
              {(isCreatingMunicipi || editingMunicipi) && (
                <form onSubmit={handleSaveMunicipi} className="p-5 bg-slate-950 border border-sky-500/30 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-sky-400">
                      {editingMunicipi ? `Editar Municipi: ${editingMunicipi.name}` : 'Crear Nou Municipi'}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setIsCreatingMunicipi(false); setEditingMunicipi(null); }}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel·lar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Nom del Municipi *</label>
                      <input
                        type="text"
                        required
                        value={mName}
                        onChange={e => setMName(e.target.value)}
                        placeholder="Ex: Sant Esteve Sesrovires"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Slug identificador *</label>
                      <input
                        type="text"
                        value={mSlug}
                        onChange={e => setMSlug(e.target.value)}
                        placeholder="Ex: sant-esteve-sesrovires"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* ESTAT DE LA CONVOCATÒRIA */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Estat de la Convocatòria</label>
                    <select
                      value={mStatus}
                      onChange={e => setMStatus(e.target.value as PLConvocatoriaStatus)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    >
                      <option value="pending">🟡 Pendent de convocatòria</option>
                      <option value="open_registration">🟢 Convocatòria oberta (inscripcions en curs)</option>
                      <option value="closed_registration">🟠 Inscripcions tancades (pendent data examen)</option>
                      <option value="exam_scheduled">🔵 Data d'examen fixada (compte enrere actiu)</option>
                      <option value="finished">🏁 Examen finalitzat</option>
                    </select>
                  </div>

                  {/* DATES */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Tancament Inscripció</label>
                      <input
                        type="date"
                        value={mRegDeadline}
                        onChange={e => setMRegDeadline(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Data Tancada (si tancada)</label>
                      <input
                        type="date"
                        value={mRegClosedAt}
                        onChange={e => setMRegClosedAt(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Data Oficial Examen</label>
                      <input
                        type="date"
                        value={mExamDate}
                        onChange={e => setMExamDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* PONDERACIÓ DE NOTES */}
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                      <Scale className="w-4 h-4" />
                      <span>Ponderació Examen Oficial (per defecte 50% / 50%)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">% Pes Cultura General</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={mCulturaWeight}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setMCulturaWeight(val);
                            setMTemariWeight(100 - val);
                          }}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">% Pes Temari</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={mTemariWeight}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setMTemariWeight(val);
                            setMCulturaWeight(100 - val);
                          }}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Notes o bases de la convocatòria</label>
                    <textarea
                      rows={2}
                      value={mNotes}
                      onChange={e => setMNotes(e.target.value)}
                      placeholder="Ex: 5 places lliures, DOGC núm..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isProcessing ? 'Guardant...' : 'Desar al Servidor'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* LLISTA DE MUNICIPIS */}
              <div className="space-y-3">
                {municipis.map(m => {
                  const mTopics = temes.filter(t => t.municipi_id === m.id);
                  const mQuestions = questions.filter(q => q.municipi_id === m.id);

                  return (
                    <div
                      key={m.id}
                      className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{m.name}</span>
                          <span className="text-[10px] font-mono text-slate-500">({m.slug})</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                            {m.status === 'pending' && '🟡 Pendent de convocatòria'}
                            {m.status === 'open_registration' && '🟢 Convocatòria oberta'}
                            {m.status === 'closed_registration' && '🟠 Inscripcions tancades'}
                            {m.status === 'exam_scheduled' && '🔵 Data d\'examen fixada'}
                            {m.status === 'finished' && '🏁 Examen finalitzat'}
                          </span>
                          <span>• {mTopics.length} temes</span>
                          <span>• {mQuestions.length} preguntes</span>
                          <span>• Pes: {m.cultura_weight ?? 50}% Cultura / {m.temari_weight ?? 50}% Temari</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEditMunicipi(m)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete({ type: 'municipi', id: m.id, name: m.name })}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all cursor-pointer"
                          title="Eliminar municipi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. PESTANYA TEMES */}
          {/* ========================================================= */}
          {activeTab === 'temes' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white">Gestió de Temes</h4>
                  <p className="text-xs text-slate-400">Selecciona l'àmbit per afegir, modificar o eliminar temes.</p>
                </div>
                {!isCreatingTopic && !editingTopic && (
                  <button
                    type="button"
                    onClick={handleOpenCreateTopic}
                    className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nou Tema</span>
                  </button>
                )}
              </div>

              {/* SELECTOR D'ÀMBIT */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedTopicScope('comu')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedTopicScope === 'comu'
                      ? 'bg-sky-500 text-slate-950 shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  📜 Temari Comú
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTopicScope('cultura_general')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedTopicScope === 'cultura_general'
                      ? 'bg-sky-500 text-slate-950 shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  🌍 Cultura General
                </button>
                {municipis.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedTopicScope(m.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedTopicScope === m.id
                        ? 'bg-sky-500 text-slate-950 shadow-md'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    🏛️ {m.name}
                  </button>
                ))}
              </div>

              {/* FORMULARI CREAR / EDITAR TEMA */}
              {(isCreatingTopic || editingTopic) && (
                <form onSubmit={handleSaveTopic} className="p-4 bg-slate-950 border border-sky-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-black uppercase text-sky-400">
                      {editingTopic ? `Editar Tema: ${editingTopic.code}` : 'Nou Tema'}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setIsCreatingTopic(false); setEditingTopic(null); }}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel·lar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Número *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={tNum}
                        onChange={e => {
                          const n = Number(e.target.value);
                          setTNum(n);
                          if (!editingTopic) setTCode(`Tema ${n}`);
                        }}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Codi *</label>
                      <input
                        type="text"
                        required
                        value={tCode}
                        onChange={e => setTCode(e.target.value)}
                        placeholder="Ex: Tema 1"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Annex (opcional)</label>
                      <input
                        type="text"
                        value={tAnnex}
                        onChange={e => setTAnnex(e.target.value)}
                        placeholder="Ex: Annex I: Temari general"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Títol del Tema *</label>
                    <input
                      type="text"
                      required
                      value={tTitle}
                      onChange={e => setTTitle(e.target.value)}
                      placeholder="Ex: La Constitució espanyola de 1978..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Descripció o contingut (opcional)</label>
                    <textarea
                      rows={2}
                      value={tDesc}
                      onChange={e => setTDesc(e.target.value)}
                      placeholder="Resum dels epígrafs del tema..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isProcessing ? 'Guardant...' : 'Desar Tema'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* LLISTA DE TEMES FILTRATS */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {filteredTemes.map(t => {
                  const topicQuestions = questions.filter(q => q.tema_id === t.id);
                  const hasQuestions = topicQuestions.length > 0;

                  return (
                    <div
                      key={t.id}
                      className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-all text-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="font-mono font-bold text-sky-400 shrink-0 mt-0.5">{t.code}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-200 truncate">{t.title}</p>
                          {t.annex && <span className="text-[10px] text-amber-400/90 block">{t.annex}</span>}
                          <div className="mt-1">
                            {hasQuestions ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{topicQuestions.length} preguntes disponibles</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                                <AlertCircle className="w-3 h-3" />
                                <span>Pendent d'afegir preguntes</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditTopic(t)}
                          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Editar tema"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete({ type: 'topic', id: t.id, name: `${t.code}: ${t.title}` })}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar tema"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. PESTANYA NOVA PREGUNTA INDIVIDUAL */}
          {/* ========================================================= */}
          {activeTab === 'nova_pregunta' && (
            <form onSubmit={handleSaveSingleQuestion} className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">Afegir Pregunta al Servidor</h4>
                <p className="text-xs text-slate-400">Selecciona primer el tema i indica l'enunciat, les 4 opcions i la resposta correcta.</p>
              </div>

              {/* PAS 1: SELECCIÓ D'ÀMBIT I TEMA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">1. Àmbit / Municipi *</label>
                  <select
                    value={newQScope}
                    onChange={e => {
                      setNewQScope(e.target.value);
                      setNewQTemaId('');
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="comu">📜 Temari Comú</option>
                    <option value="cultura_general">🌍 Cultura General</option>
                    {municipis.map(m => (
                      <option key={m.id} value={m.id}>🏛️ {m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">2. Tema Concret *</label>
                  <select
                    required
                    value={newQTemaId}
                    onChange={e => setNewQTemaId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="">-- Selecciona el Tema --</option>
                    {topicsForNewQuestion.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.code}: {t.title.substring(0, 50)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PAS 2: ENUNCIAT */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Enunciat de la Pregunta *</label>
                <textarea
                  required
                  rows={3}
                  value={newQText}
                  onChange={e => setNewQText(e.target.value)}
                  placeholder="Ex: Segons la Constitució espanyola de 1978, quin és el valor superior de l'ordenament jurídic?"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              {/* PAS 3: 4 OPCIONS I SELECCIÓ DE LA CORRECTA */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 block">
                  Opcions de Resposta (Marca el selector de l'opció correcta) *
                </label>
                {newQOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct_option"
                      checked={newQCorrect === idx}
                      onChange={() => setNewQCorrect(idx)}
                      className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-mono text-xs text-slate-400 font-bold w-4">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={e => {
                        const copy = [...newQOptions];
                        copy[idx] = e.target.value;
                        setNewQOptions(copy);
                      }}
                      placeholder={`Opció ${String.fromCharCode(65 + idx)}`}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs text-white border transition-all ${
                        newQCorrect === idx
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* PAS 4: EXPLICACIÓ */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Explicació o fonament jurídic (opcional)</label>
                <textarea
                  rows={2}
                  value={newQExplanation}
                  onChange={e => setNewQExplanation(e.target.value)}
                  placeholder="Ex: Art. 1.1 de la CE: la llibertat, la justícia, la igualtat i el pluralisme polític."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isProcessing ? 'Guardant...' : 'Afegir al Servidor'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* 4. PESTANYA IMPORTACIÓ MASSIVA JSON */}
          {/* ========================================================= */}
          {activeTab === 'import_massiu' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">Importació Massiva en Format JSON</h4>
                <p className="text-xs text-slate-400">
                  Enganxa un array de preguntes en el format estàndard que utilitzes. Pots assignar-les a un tema o deixar que s'auto-detectin.
                </p>
              </div>

              {/* CONFIGURACIÓ DE DESTÍ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Destí de les preguntes</label>
                  <select
                    value={importTargetScope}
                    onChange={e => {
                      setImportTargetScope(e.target.value);
                      setImportTargetTemaId('');
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="auto">✨ Auto-detectar pel camp "tema" al JSON</option>
                    <option value="comu">📜 Forçar a Temari Comú</option>
                    <option value="cultura_general">🌍 Forçar a Cultura General</option>
                    {municipis.map(m => (
                      <option key={m.id} value={m.id}>🏛️ Forçar a {m.name}</option>
                    ))}
                  </select>
                </div>

                {importTargetScope !== 'auto' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Tema Concret (opcional)</label>
                    <select
                      value={importTargetTemaId}
                      onChange={e => setImportTargetTemaId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    >
                      <option value="">-- Deixar que el JSON indiqui el tema --</option>
                      {temes
                        .filter(t => {
                          if (importTargetScope === 'comu') return t.scope === 'comu';
                          if (importTargetScope === 'cultura_general') return t.scope === 'cultura_general';
                          return t.municipi_id === importTargetScope;
                        })
                        .map(t => (
                          <option key={t.id} value={t.id}>
                            {t.code}: {t.title.substring(0, 40)}...
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* FORMAT DE MOSTRA */}
              <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-[11px] space-y-1 font-mono text-slate-400">
                <span className="text-amber-400 font-bold block">Format suportat (array d'objectes o un sol objecte):</span>
                <pre className="overflow-x-auto text-[10px] text-slate-300">
{`[
  {
    "id": "uuid-opcional",
    "pregunta": "On té instal·lats els seus centres operatius...?",
    "opcions": ["A Barcelona i Reus.", "A Girona.", "A Lleida.", "A Sabadell."],
    "resposta": 0,
    "explicacio": "El servei disposa de dos centres físics...",
    "tema": "Tema 1"
  }
]`}
                </pre>
              </div>

              {/* TEXTAREA JSON */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Enganxa el teu JSON aquí:</label>
                <textarea
                  rows={8}
                  value={jsonInput}
                  onChange={e => {
                    setJsonInput(e.target.value);
                    setJsonPreviewCount(null);
                  }}
                  placeholder="[ { &quot;pregunta&quot;: &quot;...&quot;, &quot;opcions&quot;: [...], &quot;resposta&quot;: 0 } ]"
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleAnalyzeJson}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Comprovar sintaxi JSON
                </button>

                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isProcessing || !jsonInput.trim()}
                  className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                    !isProcessing && jsonInput.trim()
                      ? 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{isProcessing ? 'Important al Servidor...' : 'Pujar al Servidor (Supabase)'}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* DIÀLEG DE CONFIRMACIÓ D'ELIMINACIÓ IN-APP (sense window.confirm) */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-5 max-w-md w-full shadow-2xl shadow-rose-950/50 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {confirmDelete.type === 'topic' ? 'Eliminar Tema' : 'Eliminar Municipi'}
                </h3>
                <p className="text-xs text-slate-400">Acció irreversible al servidor</p>
              </div>
            </div>

            <p className="text-sm text-slate-300">
              {confirmDelete.type === 'topic' ? (
                <>
                  Segur que vols eliminar definitivament el tema <span className="font-bold text-white">"{confirmDelete.name}"</span> del servidor?
                </>
              ) : (
                <>
                  Segur que vols eliminar definitivament el municipi <span className="font-bold text-white">"{confirmDelete.name}"</span> i tots els seus temes associats del servidor?
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={isProcessing}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel·lar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isProcessing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-rose-900/30 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'Eliminant...' : 'Sí, eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
