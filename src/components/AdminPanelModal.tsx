import React, { useState, useEffect, useRef } from 'react';
import { Question, QuestionReport, RenewalRequest, AcademyContactInfo } from '../types';
import { 
  QUESTIONS_BANK, 
  getAllInitialQuestions, 
  saveCustomQuestion, 
  deleteCustomQuestion 
} from '../data/questionsBank';
import { 
  fetchNavigationTexts, 
  updateNavigationTexts,
  fetchAllProfiles,
  updateUserRole,
  updateUserStudyReportAccess,
  updateUserSubscription,
  fetchInvitationCodes,
  generateInvitationCodes,
  fetchQuestionReports,
  updateQuestionReportStatus,
  fetchRenewalRequests,
  updateRenewalRequestStatus,
  fetchAcademyContactInfo,
  updateAcademyContactInfo,
  uploadAllQuestionsToSupabase,
  fetchSupabaseQuestionIds,
  saveSingleQuestionToSupabase,
  deleteQuestionsBulkFromSupabase,
  updateQuestionsAmbitBulkFromSupabase,
  DEFAULT_ACADEMY_CONTACT,
  sendAdminBroadcastMessage,
  fetchActiveBroadcastMessage,
  clearAdminBroadcastMessage,
  AdminBroadcastMessage
} from '../../supabase';
import { AdminConceptsTab } from './AdminConceptsTab';
import { 
  ShieldCheck, 
  Brain,
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Upload, 
  Download, 
  X, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Compass,
  RefreshCw,
  Users,
  Key,
  AlertTriangle,
  CreditCard,
  CheckSquare,
  Square,
  Copy,
  ExternalLink,
  Crown,
  UserCheck,
  Clock,
  Calendar,
  CalendarRange,
  Sparkles,
  Layers,
  Send,
  MessageCircle,
  Mail,
  Database,
  Phone,
  BarChart2,
  Eye,
  Award,
  Check,
  Megaphone,
  Bell
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
  currentUserRole?: 'admin' | 'question_editor' | 'aspirant';
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  currentUserRole = 'admin'
}) => {
  const isQuestionEditorOnly = currentUserRole === 'question_editor';

  // Subpestanyes
  const [activeTab, setActiveTab] = useState<'preguntes' | 'conceptes' | 'usuaris' | 'codis' | 'renovacions' | 'impugnacions' | 'contacte' | 'comunicats' | 'navigation'>('preguntes');
  const [questionSubTab, setQuestionSubTab] = useState<'llista' | 'crear' | 'importar'>('llista');

  // Filtres de preguntes
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedAmbitFilter, setSelectedAmbitFilter] = useState<string>('tots');
  const [cloudSyncFilter, setCloudSyncFilter] = useState<'all' | 'synced' | 'pending'>('all');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Estat de preguntes ja sincronitzades a Supabase
  const [supabaseQuestionIds, setSupabaseQuestionIds] = useState<Set<string>>(new Set());
  const [loadingSupabaseIds, setLoadingSupabaseIds] = useState(false);
  const [uploadingSingleId, setUploadingSingleId] = useState<string | null>(null);

  // Bulk actions states
  const [bulkAmbitTarget, setBulkAmbitTarget] = useState('Àmbit A');
  const [uploadingAll, setUploadingAll] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);

  // Form states per crear/editar pregunta
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
  const [importAmbitDefault, setImportAmbitDefault] = useState('Actualitat');
  const [filterOnlyActualitat, setFilterOnlyActualitat] = useState(true);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Gestió d'Usuaris
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [togglingStudyUserId, setTogglingStudyUserId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserForReport, setSelectedUserForReport] = useState<any | null>(null);

  // Codis d'invitació
  const [codesList, setCodesList] = useState<any[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [codeFilter, setCodeFilter] = useState<'all' | 'available' | 'used'>('all');
  const [genDuration, setGenDuration] = useState<number>(7);
  const [genIsUnlimited, setGenIsUnlimited] = useState<boolean>(false);
  const [genCount, setGenCount] = useState<number>(5);
  const [genBatchName, setGenBatchName] = useState<string>('');
  const [generatingCodes, setGeneratingCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Sol·licituds de Renovació
  const [renewalsList, setRenewalsList] = useState<RenewalRequest[]>([]);
  const [loadingRenewals, setLoadingRenewals] = useState(false);
  const [renewalFilter, setRenewalFilter] = useState<'all' | 'pending' | 'resolved'>('pending');
  const [renewalSearch, setRenewalSearch] = useState('');
  const [renewalDaysMap, setRenewalDaysMap] = useState<Record<string, number>>({});

  // Impugnacions
  const [reportsList, setReportsList] = useState<QuestionReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'resolved'>('pending');

  // Contacte acadèmia
  const [contactInfo, setContactInfo] = useState<AcademyContactInfo>(DEFAULT_ACADEMY_CONTACT);
  const [savingContact, setSavingContact] = useState(false);

  // Textos navegació
  const [navTexts, setNavTexts] = useState({
    campanya: '🎲 Oca 50',
    duels: '🎡 Duels 1v1',
    tienda: '🛍️ Tenda Mèrits',
    repas: '📚 Repàs',
    ranking: '🏆 Rànquing'
  });
  const [loadingNav, setLoadingNav] = useState(false);
  const [savingNav, setSavingNav] = useState(false);

  // Comunicats i Missatges Globals a Tots els Usuaris
  const [activeBroadcast, setActiveBroadcast] = useState<AdminBroadcastMessage | null>(null);
  const [broadcastTitle, setBroadcastTitle] = useState('📢 Gran Actualització: 78 Noves Preguntes, Neteja de Duplicades i Millores');
  const [broadcastMessage, setBroadcastMessage] = useState(
`Benvolguts/des aspirants,

Us informem de les millores i novetats incorporades a la plataforma per a la vostra preparació cap al Cos de Mossos d'Esquadra:

🔹 78 Noves Preguntes d'Actualitat: Volem donar un agraïment molt especial a la companya Júlia Álvarez per la seva gran aportació desinteressada de 78 preguntes clau d'Actualitat, revisades i integrades al banc oficial.

🔹 Depuració i Neteja de Preguntes Repetides: Hem realitzat un procés exhaustiu de filtratge i deduplicació per assegurar que no apareguin preguntes redundants o duplicades en els vostres tests, simulacres i duels, maximitzant l'eficiència del vostre estudi.

🔹 Celebració d'Ascens Policial i Recompenses: Quan assoleixis un nou rang, desbloquejaràs una nova targeta d'ascens amb bonificacions (+50 Mèrits i +1 Comodí).

🔹 Avisos de Posició al Rànquing: Ara rebràs una notificació en directe cada vegada que superis un company a l'Escala d'Aspirants.

🔹 Compromís Diari: Recordeu mantenir la constància diària per evitar el decaïment de -20 XP per inactivitat.

Molts ànims i a seguir sumant mèrits!`
  );
  const [broadcastPriority, setBroadcastPriority] = useState<'normal' | 'urgent' | 'important'>('important');
  const [broadcastScheduleEnabled, setBroadcastScheduleEnabled] = useState(false);
  const [broadcastScheduledStart, setBroadcastScheduledStart] = useState('');
  const [broadcastExpireEnabled, setBroadcastExpireEnabled] = useState(false);
  const [broadcastExpiresAt, setBroadcastExpiresAt] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [clearingBroadcast, setClearingBroadcast] = useState(false);

  // Notificacions generals
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadSupabaseQuestionIds = async () => {
    try {
      setLoadingSupabaseIds(true);
      const ids = await fetchSupabaseQuestionIds();
      setSupabaseQuestionIds(new Set(ids));
    } catch (e) {
      console.warn('Error loading supabase question IDs:', e);
    } finally {
      setLoadingSupabaseIds(false);
    }
  };

  const loadRenewals = async () => {
    try {
      setLoadingRenewals(true);
      const list = await fetchRenewalRequests();
      setRenewalsList(list);
    } catch (e) {
      console.warn('Error loading renewals:', e);
    } finally {
      setLoadingRenewals(false);
    }
  };

  // Carregar dades inicials segons pestanya
  useEffect(() => {
    if (!isOpen) return;

    // Sempre refresquem sol·licituds pendents al obrir el panell
    if (!isQuestionEditorOnly) {
      loadRenewals();
    }

    if (activeTab === 'preguntes') {
      loadSupabaseQuestionIds();
    } else if (activeTab === 'usuaris' && !isQuestionEditorOnly) {
      loadUsers();
    } else if (activeTab === 'codis' && !isQuestionEditorOnly) {
      loadCodes();
    } else if (activeTab === 'renovacions' && !isQuestionEditorOnly) {
      loadRenewals();
    } else if (activeTab === 'impugnacions' && !isQuestionEditorOnly) {
      loadReports();
    } else if (activeTab === 'contacte' && !isQuestionEditorOnly) {
      fetchAcademyContactInfo().then(info => {
        if (info) setContactInfo(info);
      }).catch(console.warn);
    } else if (activeTab === 'comunicats' && !isQuestionEditorOnly) {
      fetchActiveBroadcastMessage().then(b => {
        setActiveBroadcast(b);
      }).catch(console.warn);
    } else if (activeTab === 'navigation' && !isQuestionEditorOnly) {
      setLoadingNav(true);
      fetchNavigationTexts().then(texts => {
        if (texts) setNavTexts(prev => ({ ...prev, ...texts }));
      }).catch(console.warn).finally(() => setLoadingNav(false));
    }
  }, [isOpen, activeTab, isQuestionEditorOnly]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetchAllProfiles();
      let storedPermissions: Record<string, boolean> = {};
      try {
        storedPermissions = JSON.parse(localStorage.getItem('agent_medina_study_report_permissions') || '{}');
      } catch {}

      const merged = (res || []).map(u => ({
        ...u,
        can_view_study_report: typeof storedPermissions[u.id] === 'boolean' 
          ? storedPermissions[u.id] 
          : Boolean(u.can_view_study_report)
      }));

      setUsersList(merged);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadCodes = async () => {
    try {
      setLoadingCodes(true);
      const res = await fetchInvitationCodes();
      setCodesList(res);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingCodes(false);
    }
  };

  const loadReports = async () => {
    try {
      setLoadingReports(true);
      const res = await fetchQuestionReports();
      setReportsList(res);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingReports(false);
    }
  };

  if (!isOpen) return null;

  // Filtrar preguntes per text, àmbit i estat de sincronització amb Supabase
  const filteredQuestions = QUESTIONS_BANK.filter(q => {
    const matchesSearch = 
      q.pregunta.toLowerCase().includes(searchFilter.toLowerCase()) ||
      q.seccio.toLowerCase().includes(searchFilter.toLowerCase()) ||
      q.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (q.explicacio && q.explicacio.toLowerCase().includes(searchFilter.toLowerCase()));
    const matchesAmbit = selectedAmbitFilter === 'tots' || q.ambit === selectedAmbitFilter;
    const isSynced = supabaseQuestionIds.has(q.id);
    const matchesSync = 
      cloudSyncFilter === 'all' || 
      (cloudSyncFilter === 'synced' && isSynced) || 
      (cloudSyncFilter === 'pending' && !isSynced);

    return matchesSearch && matchesAmbit && matchesSync;
  });

  // Toggle selecció de preguntes
  const handleToggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    if (selectedQuestionIds.size === filteredQuestions.length && filteredQuestions.length > 0) {
      setSelectedQuestionIds(new Set());
    } else {
      setSelectedQuestionIds(new Set(filteredQuestions.map(q => q.id)));
    }
  };

  // Acció massiva: Canviar àmbit
  const handleBulkChangeAmbit = async () => {
    if (selectedQuestionIds.size === 0) return;
    const ids = Array.from(selectedQuestionIds) as string[];
    try {
      await updateQuestionsAmbitBulkFromSupabase(ids, bulkAmbitTarget);
      // Actualitzar en memòria
      ids.forEach(id => {
        const q = QUESTIONS_BANK.find(x => x.id === id);
        if (q) q.ambit = bulkAmbitTarget;
      });
      setNotification({ type: 'success', message: `S'ha actualitzat l'àmbit de ${ids.length} preguntes a "${bulkAmbitTarget}".` });
      setSelectedQuestionIds(new Set());
    } catch (e: any) {
      setNotification({ type: 'error', message: 'Error en actualitzar àmbit de les preguntes.' });
    }
  };

  // Acció massiva: Eliminar
  const handleBulkDelete = async () => {
    if (selectedQuestionIds.size === 0) return;
    const ids = Array.from(selectedQuestionIds) as string[];
    try {
      await deleteQuestionsBulkFromSupabase(ids);
      ids.forEach(id => {
        const idx = QUESTIONS_BANK.findIndex(x => x.id === id);
        if (idx >= 0) QUESTIONS_BANK.splice(idx, 1);
      });
      setNotification({ type: 'success', message: `S'han eliminat ${ids.length} preguntes amb èxit.` });
      setSelectedQuestionIds(new Set());
      await loadSupabaseQuestionIds();
    } catch (e: any) {
      setNotification({ type: 'error', message: 'Error en eliminar les preguntes seleccionades.' });
    }
  };

  // Sincronització de preguntes a Supabase (totes o només pendents)
  const handleUploadAllQuestions = async (onlyPending = false) => {
    const targetQuestions = onlyPending 
      ? QUESTIONS_BANK.filter(q => !supabaseQuestionIds.has(q.id))
      : getAllInitialQuestions();

    if (targetQuestions.length === 0) {
      setNotification({ type: 'success', message: 'Totes les preguntes del banc ja estan a Supabase!' });
      return;
    }

    try {
      setUploadingAll(true);
      setUploadProgress({ done: 0, total: targetQuestions.length });

      const res = await uploadAllQuestionsToSupabase(targetQuestions, (done, total) => {
        setUploadProgress({ done, total });
      });

      if (res.success) {
        await loadSupabaseQuestionIds();
        setNotification({ 
          type: 'success', 
          message: `🎉 S'han sincronitzat i protegit correctament ${res.uploadedCount} preguntes a Supabase!` 
        });
      } else {
        setNotification({ type: 'error', message: 'Error en pujar: ' + (res.error || 'comprova la connexió a Supabase') });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Error en pujar preguntes a Supabase.' });
    } finally {
      setUploadingAll(false);
      setUploadProgress(null);
    }
  };

  // Pujar només les preguntes seleccionades amb checkbox
  const handleUploadSelectedQuestions = async () => {
    if (selectedQuestionIds.size === 0) return;
    const selected = QUESTIONS_BANK.filter(q => selectedQuestionIds.has(q.id));

    try {
      setUploadingAll(true);
      setUploadProgress({ done: 0, total: selected.length });

      const res = await uploadAllQuestionsToSupabase(selected, (done, total) => {
        setUploadProgress({ done, total });
      });

      if (res.success) {
        await loadSupabaseQuestionIds();
        setNotification({ 
          type: 'success', 
          message: `🎉 S'han pujat ${res.uploadedCount} preguntes seleccionades a Supabase!` 
        });
        setSelectedQuestionIds(new Set());
      } else {
        setNotification({ type: 'error', message: 'Error en pujar: ' + res.error });
      }
    } catch (e: any) {
      setNotification({ type: 'error', message: e?.message || 'Error en pujar seleccionades.' });
    } finally {
      setUploadingAll(false);
      setUploadProgress(null);
    }
  };

  // Pujar una única pregunta individualment
  const handleUploadSingleQuestion = async (q: Question) => {
    try {
      setUploadingSingleId(q.id);
      const ok = await saveSingleQuestionToSupabase(q);
      if (ok) {
        setSupabaseQuestionIds(prev => new Set([...prev, q.id]));
        setNotification({ type: 'success', message: `Pregunta ${q.id} pujada a Supabase amb èxit!` });
      } else {
        setNotification({ type: 'error', message: `No s'ha pogut pujar la pregunta ${q.id}.` });
      }
    } catch (e: any) {
      setNotification({ type: 'error', message: e?.message || 'Error en pujar.' });
    } finally {
      setUploadingSingleId(null);
    }
  };

  // Crear / Editar pregunta
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
    setQuestionSubTab('crear');
    setActiveTab('preguntes');
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
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

    try {
      await saveCustomQuestion(questionToSave);
      setNotification({ 
        type: 'success', 
        message: editingQuestion ? 'Pregunta actualitzada amb èxit!' : 'Nova pregunta creada amb èxit!' 
      });
      setEditingQuestion(null);
      setFormData({
        ambit: 'Àmbit A',
        seccio: 'General',
        pregunta: '',
        opcions: ['', '', '', ''],
        resposta: 0,
        explicacio: '',
        guiaPagina: '',
        guiaTema: '',
        clauTribunal: ''
      });
      setQuestionSubTab('llista');
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Error en desar la pregunta.' });
    }
  };

  // Carregar fitxer JSON des del dispositiu
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      setNotification({ type: 'error', message: 'Si us plau, selecciona un fitxer amb format .json' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        const count = arr.length;
        
        if (filterOnlyActualitat) {
          const filtered = arr.filter(item => {
            const ambitStr = String(item.ambit || '').trim().toLowerCase();
            const seccioStr = String(item.seccio || '').trim().toLowerCase();
            const guiaTemaStr = String(item.guiaTema || '').trim().toLowerCase();
            return (
              ambitStr === 'actualitat' ||
              ambitStr.includes('actualitat') ||
              seccioStr.includes('actualitat') ||
              guiaTemaStr.includes('actualitat')
            );
          });
          const newText = JSON.stringify(filtered, null, 2);
          setImportJsonText(newText);
          setUploadedFileName(`${file.name} (${filtered.length} d'Actualitat de ${count} totals)`);
          setNotification({ 
            type: 'success', 
            message: `Fitxer carregat i filtrat! S'han conservat ${filtered.length} preguntes d'Actualitat (${count - filtered.length} eliminades).` 
          });
        } else {
          setImportJsonText(text);
          setUploadedFileName(`${file.name} (${count} preguntes detectades)`);
          setNotification({ type: 'success', message: `Fitxer "${file.name}" carregat! S'han detectat ${count} preguntes.` });
        }
      } catch (err: any) {
        setNotification({ type: 'error', message: 'El fitxer seleccionat no conté un JSON vàlid: ' + err.message });
      }
    };
    reader.onerror = () => {
      setNotification({ type: 'error', message: 'Error en llegir el fitxer.' });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Funció específica: Eliminar totes les preguntes del JSON excepte Actualitat
  const handlePurgeNonActualitat = () => {
    if (!importJsonText.trim()) {
      setNotification({ type: 'error', message: 'Primer carrega o enganxa el contingut JSON.' });
      return;
    }
    try {
      const parsed = JSON.parse(importJsonText);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const initialCount = arr.length;
      const filtered = arr.filter(item => {
        const ambitStr = String(item.ambit || '').trim().toLowerCase();
        const seccioStr = String(item.seccio || '').trim().toLowerCase();
        const guiaTemaStr = String(item.guiaTema || '').trim().toLowerCase();
        return (
          ambitStr === 'actualitat' ||
          ambitStr.includes('actualitat') ||
          seccioStr.includes('actualitat') ||
          guiaTemaStr.includes('actualitat')
        );
      });

      const eliminated = initialCount - filtered.length;
      setImportJsonText(JSON.stringify(filtered, null, 2));
      setUploadedFileName(prev => prev ? `${prev} -> Filtrades: ${filtered.length} només Actualitat` : `JSON filtrat (${filtered.length} preguntes d'Actualitat)`);
      setNotification({
        type: 'success',
        message: `Fet! S'han eliminat ${eliminated} preguntes. Ara el JSON conté únicament ${filtered.length} preguntes d'Actualitat.`
      });
    } catch (e: any) {
      setNotification({ type: 'error', message: 'Format JSON invàlid: ' + e.message });
    }
  };

  // Importar JSON
  const handleImportJson = async () => {
    try {
      const parsed = JSON.parse(importJsonText);
      let arr: any[] = Array.isArray(parsed) ? parsed : [parsed];
      if (arr.length === 0) {
        setNotification({ type: 'error', message: 'El JSON està buit.' });
        return;
      }

      if (filterOnlyActualitat) {
        arr = arr.filter(item => {
          const ambitStr = String(item.ambit || '').trim().toLowerCase();
          const seccioStr = String(item.seccio || '').trim().toLowerCase();
          const guiaTemaStr = String(item.guiaTema || '').trim().toLowerCase();
          return (
            ambitStr === 'actualitat' ||
            ambitStr.includes('actualitat') ||
            seccioStr.includes('actualitat') ||
            guiaTemaStr.includes('actualitat')
          );
        });
        if (arr.length === 0) {
          setNotification({ type: 'error', message: 'Cap pregunta del JSON pertany a "Actualitat".' });
          return;
        }
      }

      const formatted: Question[] = arr.map((item, idx) => ({
        id: item.id || `custom_import_${Date.now()}_${idx}`,
        ambit: item.ambit || importAmbitDefault,
        seccio: item.seccio || 'Actualitat',
        pregunta: item.pregunta,
        opcions: Array.isArray(item.opcions) ? item.opcions : [],
        resposta: typeof item.resposta === 'number' ? item.resposta : 0,
        explicacio: item.explicacio || item.explanation || 'Explicació oficial.',
        guiaPagina: item.guiaPagina,
        guiaTema: item.guiaTema,
        clauTribunal: item.clauTribunal
      }));

      for (const q of formatted) {
        await saveCustomQuestion(q);
      }

      setNotification({ type: 'success', message: `S'han importat ${formatted.length} preguntes d'Actualitat correctament!` });
      setImportJsonText('');
      setUploadedFileName(null);
      setQuestionSubTab('llista');
    } catch (e: any) {
      setNotification({ type: 'error', message: 'Format JSON invàlid: ' + e.message });
    }
  };

  // Gestió d'Usuaris: Modificar rol
  const handleRoleChange = async (userId: string, newRole: 'admin' | 'question_editor' | 'aspirant') => {
    try {
      const ok = await updateUserRole(userId, newRole);
      if (ok) {
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        setNotification({ type: 'success', message: `Rol canviat a "${newRole}".` });
      }
    } catch (e: any) {
      setNotification({ type: 'error', message: 'Error en canviar el rol.' });
    }
  };

  // Gestió d'Usuaris: Toggle accés a l'Informe de Cobertura per a l'alumne
  const handleStudyReportToggle = async (userId: string, currentAllowed: boolean) => {
    try {
      setTogglingStudyUserId(userId);
      const newAllowed = !currentAllowed;

      // Optimistic update a la interfície
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, can_view_study_report: newAllowed } : u));

      // Guardar a localStorage localment per si la connexió al servidor triga o refresca
      try {
        const storedPermissions = JSON.parse(localStorage.getItem('agent_medina_study_report_permissions') || '{}');
        storedPermissions[userId] = newAllowed;
        localStorage.setItem('agent_medina_study_report_permissions', JSON.stringify(storedPermissions));
      } catch {}

      const ok = await updateUserStudyReportAccess(userId, newAllowed);
      if (ok) {
        setNotification({
          type: 'success',
          message: newAllowed
            ? "✅ Accés concedit! L'aspirant ja té visible l'informe des del seu perfil (botó blau)."
            : "🔒 Accés revocat. L'aspirant ja no veurà l'informe de cobertura."
        });
      } else {
        setNotification({ type: 'error', message: "No s'ha pogut desar el canvi a la base de dades." });
      }
    } catch (e: any) {
      setNotification({ type: 'error', message: "Error en canviar l'accés a l'informe." });
    } finally {
      setTogglingStudyUserId(null);
    }
  };

  // Descàrrega de Backup complet en JSON
  const handleExportBackupJSON = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(QUESTIONS_BANK, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `agent_medina_backup_preguntes_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setNotification({ type: 'success', message: `S'ha descarregat el backup de ${QUESTIONS_BANK.length} preguntes correctament.` });
    } catch (e: any) {
      setNotification({ type: 'error', message: 'Error en generar el backup: ' + e.message });
    }
  };

  // Exportació d'usuaris a CSV
  const handleExportUsersCSV = () => {
    try {
      if (usersList.length === 0) {
        setNotification({ type: 'error', message: 'No hi ha usuaris per exportar.' });
        return;
      }
      const headers = ['ID', 'Nom', 'Email', 'Rol', 'Punts XP', 'Merits', 'Preguntes Fetes', 'Cobertura %', 'Subscripcio', 'Expira'];
      const rows = usersList.map(u => {
        const answered = (u.answered_questions || []).length;
        const total = QUESTIONS_BANK.length;
        const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
        return [
          `"${u.id}"`,
          `"${u.username || 'Aspirant'}"`,
          `"${u.email || ''}"`,
          `"${u.role || 'aspirant'}"`,
          u.total_points ?? 0,
          u.merits ?? 0,
          answered,
          `${pct}%`,
          `"${u.subscription_status || 'trial'}"`,
          `"${u.subscription_expires_at ? new Date(u.subscription_expires_at).toLocaleDateString('ca-ES') : (u.is_unlimited ? 'Ilimitat' : '-')}"`
        ].join(',');
      });

      const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent([headers.join(','), ...rows].join('\n'));
      const link = document.createElement('a');
      link.setAttribute('href', csvContent);
      link.setAttribute('download', `opositors_agent_medina_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setNotification({ type: 'success', message: `Exportats ${usersList.length} usuaris a fitxer CSV.` });
    } catch (e: any) {
      setNotification({ type: 'error', message: "Error en exportar l'arxiu CSV: " + e.message });
    }
  };

  // Gestió d'Usuaris: Modificar subscripció
  const handleSubscriptionExtend = async (userId: string, durationDays: number, isUnlimited = false) => {
    try {
      const ok = await updateUserSubscription({
        userId,
        subscriptionStatus: isUnlimited ? 'unlimited' : 'active',
        durationDays,
        isUnlimited
      });
      if (ok) {
        loadUsers();
        setNotification({ 
          type: 'success', 
          message: isUnlimited ? 'Accés Ilimitat concedit a l\'usuari.' : `S'han sumat ${durationDays} dies a l'usuari.` 
        });
      }
    } catch (e) {
      setNotification({ type: 'error', message: 'Error en actualitzar subscripció.' });
    }
  };

  const handleSubscriptionExpire = async (userId: string) => {
    if (!window.confirm('Vols desactivar/caducar immediatament l\'accés d\'aquest usuari?')) return;
    try {
      const ok = await updateUserSubscription({
        userId,
        subscriptionStatus: 'expired'
      });
      if (ok) {
        loadUsers();
        setNotification({ type: 'success', message: 'Subscripció caducada manualment.' });
      }
    } catch (e) {
      setNotification({ type: 'error', message: 'Error en desactivar subscripció.' });
    }
  };

  // Generació de codis d'invitació
  const handleGenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGeneratingCodes(true);
      const res = await generateInvitationCodes({
        durationDays: genDuration,
        isUnlimited: genIsUnlimited,
        count: genCount,
        batchName: genBatchName.trim() || undefined
      });

      if (res.success) {
        setNotification({ type: 'success', message: `S'han generat ${res.codes.length} codis nous amb èxit!` });
        loadCodes();
        setGenBatchName('');
      } else {
        setNotification({ type: 'error', message: 'Error: ' + res.error });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Error en generar codis.' });
    } finally {
      setGeneratingCodes(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Resoldre / Descartar impugnació
  const handleReportAction = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      const ok = await updateQuestionReportStatus(reportId, status);
      if (ok) {
        setReportsList(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
        setNotification({ type: 'success', message: `Impugnació marcada com a "${status}".` });
      }
    } catch (e) {
      setNotification({ type: 'error', message: 'Error en actualitzar la impugnació.' });
    }
  };

  // Gestió de Sol·licituds de Renovació
  const handleRenewalAction = async (
    requestId: string,
    status: 'resolved' | 'dismissed' | 'pending',
    sourceTable?: 'subscription_requests' | 'question_reports'
  ) => {
    try {
      const ok = await updateRenewalRequestStatus(requestId, status, undefined, sourceTable);
      if (ok) {
        setRenewalsList(prev => prev.map(r => r.id === requestId ? { ...r, status } : r));
        setNotification({ 
          type: 'success', 
          message: status === 'resolved' ? 'Sol·licitud de renovació resolta.' : 'Sol·licitud descartada.' 
        });
      } else {
        setNotification({ type: 'error', message: 'Error en actualitzar l\'estat de la sol·licitud.' });
      }
    } catch (e) {
      setNotification({ type: 'error', message: 'Error inesperat en actualitzar la sol·licitud.' });
    }
  };

  // Activació directa de subscripció a l'usuari des de la sol·licitud
  const handleDirectRenewFromRequest = async (req: RenewalRequest, durationDays: number) => {
    try {
      const ok = await updateUserSubscription({
        userId: req.user_id,
        subscriptionStatus: 'active',
        durationDays,
        isUnlimited: false
      });

      if (ok) {
        await updateRenewalRequestStatus(
          req.id, 
          'resolved', 
          `Renovat directament ${durationDays} dies per admin`, 
          (req as any).source_table
        );
        loadRenewals();
        loadUsers();
        setNotification({
          type: 'success',
          message: `🎉 Subscripció de ${req.user_name} renovada per ${durationDays} dies amb èxit!`
        });
      } else {
        setNotification({ type: 'error', message: 'Error en actualitzar la subscripció de l\'opositor.' });
      }
    } catch (e) {
      setNotification({ type: 'error', message: 'Error en activar subscripció.' });
    }
  };

  // Desar dades de contacte
  const handleSaveContactInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingContact(true);
      const ok = await updateAcademyContactInfo(contactInfo);
      if (ok) {
        setNotification({ type: 'success', message: 'Dades de contacte de l\'acadèmia desades a Supabase!' });
      } else {
        setNotification({ type: 'error', message: 'Error en desar dades de contacte.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Error en desar contacte.' });
    } finally {
      setSavingContact(false);
    }
  };

  // Desar textos de navegació
  const handleSaveNavigationTexts = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingNav(true);
      const ok = await updateNavigationTexts(navTexts);
      if (ok) {
        setNotification({ type: 'success', message: 'Textos de navegació desats a Supabase!' });
        window.dispatchEvent(new CustomEvent('navigation_texts_updated', { detail: navTexts }));
      } else {
        setNotification({ type: 'error', message: 'No s\'han pogut actualitzar els textos.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Error en desar.' });
    } finally {
      setSavingNav(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        {/* Capçalera Principal */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-100">
                  {isQuestionEditorOnly ? 'Gestió Docent de Preguntes' : 'Panell de Gestió Administrativa'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {currentUserRole.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Agent Medina • Administració oficial: {currentUserEmail}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificacions Banner */}
        {notification && (
          <div className={`mx-6 mt-4 p-3 rounded-xl flex items-center justify-between gap-2 text-xs border ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="p-1 hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Barra de Pestanyes Principals */}
        <div className="flex items-center gap-1.5 px-3 sm:px-6 pt-3 border-b border-slate-800 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth whitespace-nowrap">
          <button
            onClick={() => setActiveTab('preguntes')}
            className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'preguntes'
                ? 'border-amber-500 text-amber-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Banc de Preguntes ({QUESTIONS_BANK.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('conceptes')}
            className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'conceptes'
                ? 'border-purple-500 text-purple-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-4 h-4 shrink-0 text-purple-400" />
            <span>Conceptes & Mnemotècniques</span>
          </button>

          {!isQuestionEditorOnly && (
            <>
              <button
                onClick={() => setActiveTab('usuaris')}
                className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'usuaris'
                    ? 'border-amber-500 text-amber-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Usuaris i Subscripcions</span>
              </button>

              <button
                onClick={() => setActiveTab('codis')}
                className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'codis'
                    ? 'border-amber-500 text-amber-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Key className="w-4 h-4 shrink-0" />
                <span>Codis d'Invitació</span>
              </button>

              <button
                onClick={() => setActiveTab('renovacions')}
                className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'renovacions'
                    ? 'border-amber-500 text-amber-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Sol·licituds Renovació</span>
                {renewalsList.filter(r => r.status === 'pending').length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 animate-pulse">
                    {renewalsList.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('impugnacions')}
                className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'impugnacions'
                    ? 'border-amber-500 text-amber-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Impugnacions</span>
              </button>

              <button
                onClick={() => setActiveTab('contacte')}
                className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'contacte'
                    ? 'border-amber-500 text-amber-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Dades de Contacte</span>
              </button>

              <button
                onClick={() => setActiveTab('comunicats')}
                className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'comunicats'
                    ? 'border-amber-500 text-amber-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Megaphone className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Comunicats Globals</span>
                {activeBroadcast && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('navigation')}
                className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'navigation'
                    ? 'border-amber-500 text-amber-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-4 h-4 shrink-0" />
                <span>Noms de Pestanyes</span>
              </button>
            </>
          )}
        </div>

        {/* Contingut del Panell */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ========================================================================= */}
          {/* PESTANYA 1: PREGUNTES (Amb accions massives i pujada automàtica a Supabase) */}
          {/* ========================================================================= */}
          {activeTab === 'preguntes' && (
            <div className="space-y-5">
              {/* Barra superior de preguntes */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setQuestionSubTab('llista')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      questionSubTab === 'llista' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Llistat ({QUESTIONS_BANK.length})
                  </button>
                  <button
                    onClick={() => {
                      setEditingQuestion(null);
                      setQuestionSubTab('crear');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      questionSubTab === 'crear' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nova Pregunta</span>
                  </button>
                  <button
                    onClick={() => setQuestionSubTab('importar')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      questionSubTab === 'importar' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importar JSON</span>
                  </button>

                  {/* Botó Backup Complet JSON */}
                  <button
                    type="button"
                    onClick={handleExportBackupJSON}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-700 hover:bg-slate-800 text-sky-400 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                    title="Descarregar una còpia de seguretat de totes les preguntes a un fitxer .json"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Backup JSON</span>
                  </button>
                </div>

                {/* ESTATS I BOTONS DE PUJADA A SUPABASE */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Badge d'estat de sincronització */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {supabaseQuestionIds.size} a Supabase
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-amber-400 font-bold">
                      {Math.max(0, QUESTIONS_BANK.length - supabaseQuestionIds.size)} pendents
                    </span>
                    <button
                      onClick={loadSupabaseQuestionIds}
                      disabled={loadingSupabaseIds}
                      title="Refrescar comprovació de preguntes a Supabase"
                      className="ml-1 p-0.5 text-slate-400 hover:text-white"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingSupabaseIds ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {/* Botó Pujar Només les Pendents (si n'hi ha) */}
                  {QUESTIONS_BANK.length - supabaseQuestionIds.size > 0 && (
                    <button
                      onClick={() => handleUploadAllQuestions(true)}
                      disabled={uploadingAll}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md disabled:opacity-50 transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-950" />
                      <span>Pujar {Math.max(0, QUESTIONS_BANK.length - supabaseQuestionIds.size)} pendents</span>
                    </button>
                  )}

                  {/* Botó Pujar Tot el Banc */}
                  <button
                    onClick={() => handleUploadAllQuestions(false)}
                    disabled={uploadingAll}
                    className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    {uploadingAll ? (
                      <span>Pujant ({uploadProgress?.done} / {uploadProgress?.total})...</span>
                    ) : (
                      <span>🚀 Pujar Tot ({QUESTIONS_BANK.length})</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Progress bar si s'estan pujant */}
              {uploadingAll && uploadProgress && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-amber-300">
                    <span>Sincronitzant preguntes amb la taula 'questions' de Supabase...</span>
                    <span>{Math.round((uploadProgress.done / uploadProgress.total) * 100)}% ({uploadProgress.done}/{uploadProgress.total})</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full transition-all duration-300"
                      style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {questionSubTab === 'llista' && (
                <div className="space-y-4">
                  {/* Banner informatiu de la ubicació de les preguntes a Supabase */}
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                      <Database className="w-4 h-4" />
                    </div>
                    <div className="text-slate-300 leading-relaxed">
                      <span className="font-bold text-white">On es guarden les preguntes?</span> Es desen a la taula <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono text-[11px]">questions</code> de Supabase.
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Tots els camps estan estructurats: <code className="text-slate-300">id, ambit, seccio, pregunta, opcions (JSONB), resposta (índex), explicacio, guia_pagina, guia_tema, clau_tribunal</code>.
                      </div>
                    </div>
                  </div>

                  {/* Pestanyes ràpides d'estat de Supabase */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setCloudSyncFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        cloudSyncFilter === 'all'
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Totes ({QUESTIONS_BANK.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCloudSyncFilter('synced')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        cloudSyncFilter === 'synced'
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-900 text-emerald-400 hover:bg-slate-800 border border-emerald-500/30'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>A Supabase ({supabaseQuestionIds.size})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCloudSyncFilter('pending')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        cloudSyncFilter === 'pending'
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                          : 'bg-slate-900 text-amber-400 hover:bg-slate-800 border border-amber-500/30'
                      }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Pendents de pujar ({Math.max(0, QUESTIONS_BANK.length - supabaseQuestionIds.size)})</span>
                    </button>
                  </div>

                  {/* Filtres de cerca, àmbit i estat a Supabase */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative sm:col-span-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Cercar per text, secció o ID..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <select
                      value={selectedAmbitFilter}
                      onChange={(e) => setSelectedAmbitFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="tots">Tots els Àmbits</option>
                      <option value="Àmbit A">Àmbit A (Coneixements de l'entorn)</option>
                      <option value="Àmbit B">Àmbit B (Institucional)</option>
                      <option value="Àmbit C">Àmbit C (Seguretat i Policia)</option>
                      <option value="Actualitat">Actualitat</option>
                      <option value="ISPC">ISPC</option>
                    </select>

                    {/* FILTRE PER ESTAT DE PUJADA A SUPABASE */}
                    <select
                      value={cloudSyncFilter}
                      onChange={(e) => setCloudSyncFilter(e.target.value as any)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="all">Totes les preguntes ({QUESTIONS_BANK.length})</option>
                      <option value="synced">🟢 A Supabase ({supabaseQuestionIds.size})</option>
                      <option value="pending">⚪ Pendents de pujar ({Math.max(0, QUESTIONS_BANK.length - supabaseQuestionIds.size)})</option>
                    </select>
                  </div>

                  {/* BARRA D'ACCIONS MASSIVES */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSelectAllVisible}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 font-medium transition-colors cursor-pointer"
                      >
                        {selectedQuestionIds.size === filteredQuestions.length && filteredQuestions.length > 0 ? (
                          <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>Seleccionar visibles ({filteredQuestions.length})</span>
                      </button>

                      {selectedQuestionIds.size > 0 && (
                        <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 font-bold">
                          {selectedQuestionIds.size} seleccionades
                        </span>
                      )}
                    </div>

                    {selectedQuestionIds.size > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Pujar seleccionades a Supabase */}
                        <button
                          onClick={handleUploadSelectedQuestions}
                          disabled={uploadingAll}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 font-bold transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Pujar ({selectedQuestionIds.size}) a Supabase</span>
                        </button>

                        {/* Canviar àmbit de cop */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Àmbit:</span>
                          <select
                            value={bulkAmbitTarget}
                            onChange={(e) => setBulkAmbitTarget(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                          >
                            <option value="Àmbit A">Àmbit A</option>
                            <option value="Àmbit B">Àmbit B</option>
                            <option value="Àmbit C">Àmbit C</option>
                            <option value="Actualitat">Actualitat</option>
                            <option value="ISPC">ISPC</option>
                          </select>
                          <button
                            onClick={handleBulkChangeAmbit}
                            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                          >
                            Reassignar
                          </button>
                        </div>

                        {/* Eliminar massiu */}
                        <button
                          onClick={handleBulkDelete}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 font-bold transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Llista de preguntes */}
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pretty-scrollbar pr-1">
                    {filteredQuestions.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 text-xs">
                        No s'ha trobat cap pregunta amb aquests filtres.
                      </div>
                    ) : (
                      filteredQuestions.map((q) => {
                        const isSelected = selectedQuestionIds.has(q.id);
                        const isSynced = supabaseQuestionIds.has(q.id);

                        return (
                          <div
                            key={q.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isSelected 
                                ? 'bg-amber-500/10 border-amber-500/40' 
                                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => handleToggleSelectQuestion(q.id)}
                                className="mt-0.5 text-slate-400 hover:text-amber-400 transition-colors"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-amber-400" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-amber-400">
                                    {q.ambit}
                                  </span>

                                  {/* BADGE DE SINCRONITZACIÓ AMB SUPABASE */}
                                  {isSynced ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                      <span>A Supabase</span>
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3 text-amber-400" />
                                      <span>Pendent de pujar</span>
                                    </span>
                                  )}

                                  {q.seccio && (
                                    <span className="text-[11px] text-slate-400 font-medium truncate">
                                      {q.seccio}
                                    </span>
                                  )}
                                  <span className="font-mono text-[10px] text-slate-500 ml-auto">
                                    {q.id}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                                  {q.pregunta}
                                </p>
                                <div className="mt-2 text-[11px] text-emerald-400 font-medium">
                                  Correcta: {q.opcions[q.resposta] || 'N/A'}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {/* Botó per pujar aquesta pregunta a Supabase si no hi és */}
                                {!isSynced && (
                                  <button
                                    onClick={() => handleUploadSingleQuestion(q)}
                                    disabled={uploadingSingleId === q.id}
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors cursor-pointer"
                                    title="Pujar aquesta pregunta a Supabase"
                                  >
                                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                                    <span>{uploadingSingleId === q.id ? 'Pujant...' : 'Pujar'}</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => handleStartEdit(q)}
                                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={async () => {
                                    await deleteCustomQuestion(q.id);
                                    setNotification({ type: 'success', message: 'Pregunta eliminada.' });
                                    await loadSupabaseQuestionIds();
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Crear / Editar formulari */}
              {questionSubTab === 'crear' && (
                <form onSubmit={handleSaveQuestion} className="space-y-4 max-w-3xl bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h4 className="text-sm font-bold text-amber-400">
                      {editingQuestion ? `Editar Pregunta (${editingQuestion.id})` : 'Crear Nova Pregunta'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setQuestionSubTab('llista')}
                      className="text-xs text-slate-400 hover:text-slate-200"
                    >
                      Tornar al llistat
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Àmbit</label>
                      <select
                        value={formData.ambit}
                        onChange={(e) => setFormData({ ...formData, ambit: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                      >
                        <option value="Àmbit A">Àmbit A (Coneixements de l'entorn)</option>
                        <option value="Àmbit B">Àmbit B (Institucional)</option>
                        <option value="Àmbit C">Àmbit C (Seguretat i Policia)</option>
                        <option value="Actualitat">Actualitat</option>
                        <option value="ISPC">ISPC</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Secció / Tema</label>
                      <input
                        type="text"
                        value={formData.seccio}
                        onChange={(e) => setFormData({ ...formData, seccio: e.target.value })}
                        placeholder="Ex: Història de Catalunya (part I)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Text de la Pregunta</label>
                    <textarea
                      rows={3}
                      value={formData.pregunta}
                      onChange={(e) => setFormData({ ...formData, pregunta: e.target.value })}
                      placeholder="Escriu l'enunciat de la pregunta..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 resize-none"
                    />
                  </div>

                  {/* 4 Opcions */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300">
                      Opcions de resposta (marca la correcta amb el botó circular)
                    </label>
                    {[0, 1, 2, 3].map((idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, resposta: idx })}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors shrink-0 ${
                            formData.resposta === idx 
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black' 
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </button>
                        <input
                          type="text"
                          value={formData.opcions?.[idx] || ''}
                          onChange={(e) => {
                            const newOps = [...(formData.opcions || ['', '', '', ''])];
                            newOps[idx] = e.target.value;
                            setFormData({ ...formData, opcions: newOps });
                          }}
                          placeholder={`Opció ${String.fromCharCode(65 + idx)}...`}
                          className={`flex-1 bg-slate-900 border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none ${
                            formData.resposta === idx ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-slate-700'
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Explicació Oficial</label>
                    <textarea
                      rows={2}
                      value={formData.explicacio}
                      onChange={(e) => setFormData({ ...formData, explicacio: e.target.value })}
                      placeholder="Justificació segons la Guia d'Estudi oficial 2026..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setQuestionSubTab('llista')}
                      className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    >
                      Cancel·lar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-lg shadow-amber-500/20"
                    >
                      {editingQuestion ? 'Actualitzar Pregunta' : 'Desar Nova Pregunta'}
                    </button>
                  </div>
                </form>
              )}

              {/* Importar JSON */}
              {questionSubTab === 'importar' && (
                <div className="space-y-4 max-w-3xl bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-amber-400">Importació Massiva en Format JSON</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Pots adjuntar directament un fitxer .json o enganxar el text a sota per importar-les de cop.
                      </p>
                    </div>
                    <button
                      onClick={() => setQuestionSubTab('llista')}
                      className="text-xs text-slate-400 hover:text-slate-200"
                    >
                      Tornar
                    </button>
                  </div>

                  {/* Botó per adjuntar fitxer JSON */}
                  <div className="p-4 bg-slate-900 border border-dashed border-amber-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">
                          Carregar fitxer JSON des del dispositiu
                        </p>
                        <div className="text-[11px] text-slate-400">
                          {uploadedFileName ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {uploadedFileName}
                            </span>
                          ) : (
                            'Selecciona un arxiu .json per carregar les preguntes automàticament'
                          )}
                        </div>
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 transition-all"
                    >
                      <Upload className="w-4 h-4 text-slate-950" />
                      <span>{uploadedFileName ? 'Canviar fitxer JSON' : 'Adjuntar fitxer .JSON'}</span>
                    </button>
                  </div>

                  {/* Filtre específic: Només Actualitat */}
                  <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-200">
                      <input
                        type="checkbox"
                        checked={filterOnlyActualitat}
                        onChange={(e) => setFilterOnlyActualitat(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-900 border-slate-700"
                      />
                      <span>Filtrar automàticament: eliminar totes excepte <b>Àmbit Actualitat</b></span>
                    </label>

                    <button
                      type="button"
                      onClick={handlePurgeNonActualitat}
                      disabled={!importJsonText.trim()}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purgar JSON: Deixar NOMÉS Actualitat</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Àmbit per defecte (si l'objecte JSON no en té):
                    </label>
                    <select
                      value={importAmbitDefault}
                      onChange={(e) => setImportAmbitDefault(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                    >
                      <option value="Actualitat">Actualitat</option>
                      <option value="Àmbit A">Àmbit A</option>
                      <option value="Àmbit B">Àmbit B</option>
                      <option value="Àmbit C">Àmbit C</option>
                      <option value="ISPC">ISPC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Contingut JSON</label>
                    <textarea
                      rows={8}
                      value={importJsonText}
                      onChange={(e) => setImportJsonText(e.target.value)}
                      placeholder='[{"pregunta": "...", "opcions": ["A", "B", "C", "D"], "resposta": 0, "explicacio": "..."}]'
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleImportJson}
                      disabled={!importJsonText.trim()}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition-all"
                    >
                      Importar Preguntes
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTANYA: CONCEPTES TRAMPA I REGLES MNEMOTÈCNIQUES */}
          {/* ========================================================================= */}
          {activeTab === 'conceptes' && (
            <AdminConceptsTab onNotification={setNotification} />
          )}

          {/* ========================================================================= */}
          {/* PESTANYA 2: USUARIS I SUBSCRIPCIONS */}
          {/* ========================================================================= */}
          {activeTab === 'usuaris' && !isQuestionEditorOnly && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                <div>
                  <h4 className="text-sm font-black text-slate-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    Opositors Registrats ({usersList.length})
                  </h4>
                  <p className="text-xs text-slate-400">
                    Controla qui té subscripció activa, caducada o accés de prova cortesia (48h).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportUsersCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-bold text-sky-400 cursor-pointer transition-all shadow-sm"
                    title="Exportar llistat d'usuaris a fitxer Excel / CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar CSV</span>
                  </button>
                  <button
                    onClick={loadUsers}
                    disabled={loadingUsers}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                    <span>Actualitzar</span>
                  </button>
                </div>
              </div>

              {/* Modal / Diàleg Radiografia de Cobertura de Temari */}
              {selectedUserForReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
                  <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col space-y-4">
                    {/* Capçalera */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                          <BarChart2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-white flex items-center gap-2">
                            Radiografia de Temari: {selectedUserForReport.username || 'Aspirant'}
                          </h3>
                          <p className="text-xs text-slate-400">{selectedUserForReport.email || 'Sense correu'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedUserForReport(null)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Cos de l'informe */}
                    <div className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
                      {/* Resum General */}
                      {(() => {
                        const totalBank = QUESTIONS_BANK.length;
                        // Qualsevol pregunta fallada o encertada és per definició contestada
                        const answeredList = [
                          ...(selectedUserForReport.answered_questions || []),
                          ...(selectedUserForReport.answeredQuestionIds || []),
                          ...(selectedUserForReport.correct_questions || []),
                          ...(selectedUserForReport.failed_questions || [])
                        ];
                        const answeredIds = new Set(answeredList);
                        const correctIds = new Set(selectedUserForReport.correct_questions || selectedUserForReport.correctQuestionIds || []);
                        const failedIds = new Set(selectedUserForReport.failed_questions || selectedUserForReport.failedQuestionIds || []);
                        
                        const answeredCount = answeredIds.size;
                        const neverSeenCount = Math.max(0, totalBank - answeredCount);
                        const coveragePct = totalBank > 0 ? Math.round((answeredCount / totalBank) * 100) : 0;
                        const correctPct = answeredCount > 0 ? Math.round((correctIds.size / answeredCount) * 100) : 0;

                        // Desglossament per àmbits principals
                        const ambits = ['Àmbit A', 'Àmbit B', 'Àmbit C', 'Actualitat'];
                        const ambitStats = ambits.map(amb => {
                          const bankInAmbit = QUESTIONS_BANK.filter(q => q.ambit === amb);
                          const totalInAmbit = bankInAmbit.length;
                          const answeredInAmbit = bankInAmbit.filter(q => answeredIds.has(q.id)).length;
                          const correctInAmbit = bankInAmbit.filter(q => correctIds.has(q.id)).length;
                          const pendingInAmbit = Math.max(0, totalInAmbit - answeredInAmbit);
                          const pct = totalInAmbit > 0 ? Math.round((answeredInAmbit / totalInAmbit) * 100) : 0;
                          const successPct = answeredInAmbit > 0 ? Math.round((correctInAmbit / answeredInAmbit) * 100) : 0;
                          return {
                            amb,
                            total: totalInAmbit,
                            answered: answeredInAmbit,
                            pending: pendingInAmbit,
                            pct,
                            successPct
                          };
                        });

                        return (
                          <div className="space-y-4">
                            {/* Targetes de KPIs Principals */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Cobertura Global</div>
                                <div className="text-xl font-black text-sky-400 mt-1">{coveragePct}%</div>
                                <div className="text-[10px] text-slate-500">{answeredCount} de {totalBank}</div>
                              </div>
                              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Verges (Sense tocar)</div>
                                <div className="text-xl font-black text-rose-400 mt-1">{neverSeenCount}</div>
                                <div className="text-[10px] text-slate-500">preguntes pendents</div>
                              </div>
                              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Encerts (% Efectivitat)</div>
                                <div className="text-xl font-black text-emerald-400 mt-1">{correctPct}%</div>
                                <div className="text-[10px] text-slate-500">{correctIds.size} encertades</div>
                              </div>
                              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Al Sac de Fallades</div>
                                <div className="text-xl font-black text-amber-400 mt-1">{failedIds.size}</div>
                                <div className="text-[10px] text-slate-500">per repassar</div>
                              </div>
                            </div>

                            {/* Barra de Progrés General */}
                            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-1.5">
                              <div className="flex justify-between font-bold text-slate-300">
                                <span>Progrés total del Banc de Preguntes:</span>
                                <span className="text-sky-400">{answeredCount} / {totalBank} ({coveragePct}%)</span>
                              </div>
                              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-sky-500 via-emerald-500 to-amber-400 rounded-full transition-all duration-500"
                                  style={{ width: `${coveragePct}%` }}
                                />
                              </div>
                            </div>

                            {/* Desglossament per Àmbits Oficials */}
                            <div className="space-y-2.5">
                              <h5 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                                <Compass className="w-4 h-4 text-amber-400" />
                                <span>Estat per Àmbit Oficial de la Convocatòria</span>
                              </h5>

                              <div className="space-y-2">
                                {ambitStats.map(stat => (
                                  <div key={stat.amb} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
                                    <div className="flex items-center justify-between font-bold">
                                      <span className="text-slate-100">{stat.amb}</span>
                                      <div className="flex items-center gap-3 text-[11px]">
                                        <span className="text-emerald-400">{stat.answered} contestades</span>
                                        <span className="text-rose-400 font-bold">{stat.pending} verges</span>
                                        <span className="text-sky-300 font-black">{stat.pct}%</span>
                                      </div>
                                    </div>
                                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-sky-500 rounded-full transition-all"
                                        style={{ width: `${stat.pct}%` }}
                                      />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                      <span>Total al banc: {stat.total} preguntes</span>
                                      <span>Efectivitat d'encert: {stat.successPct}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Estat del permís per l'alumne */}
                            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                              <div>
                                <span className="font-bold text-slate-200 block">Visibilitat per a l'alumne:</span>
                                <span className="text-slate-400 text-[11px]">
                                  {selectedUserForReport.can_view_study_report
                                    ? "L'alumne pot accedir a aquesta informació des del seu menú de perfil."
                                    : "Privat: L'alumne no té permís per veure aquest informe (només visible per l'admin)."}
                                </span>
                              </div>
                              <button
                                onClick={() => handleStudyReportToggle(selectedUserForReport.id, Boolean(selectedUserForReport.can_view_study_report))}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs border cursor-pointer transition-all ${
                                  selectedUserForReport.can_view_study_report
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                }`}
                              >
                                {selectedUserForReport.can_view_study_report ? 'Revocar Permís' : "Habilitar a l'Alumne"}
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Peu del modal */}
                    <div className="flex justify-end pt-3 border-t border-slate-800">
                      <button
                        onClick={() => setSelectedUserForReport(null)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Tancar Radiografia
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Cercar opositor per correu o nom..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Llista d'usuaris */}
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pretty-scrollbar pr-1">
                {usersList
                  .filter(u => 
                    (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                    (u.username || '').toLowerCase().includes(userSearch.toLowerCase())
                  )
                  .map((u) => {
                    const isUnlimited = Boolean(u.is_unlimited || u.subscription_status === 'unlimited');
                    let statusLabel = 'Inactiu';
                    let statusColor = 'bg-slate-800 text-slate-400';

                    if (isUnlimited) {
                      statusLabel = 'IL·LIMITAT';
                      statusColor = 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
                    } else if (u.subscription_expires_at) {
                      const exp = new Date(u.subscription_expires_at).getTime();
                      const diff = exp - Date.now();
                      if (diff <= 0) {
                        statusLabel = 'Usuari/a Caducat/da';
                        statusColor = 'bg-red-500/20 text-red-300 border border-red-500/40 font-black';
                      } else {
                        const days = Math.floor(diff / (24 * 3600 * 1000));
                        const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
                        statusLabel = days > 0 ? `${days}d ${hours}h` : `${hours}h restants`;
                        statusColor = u.subscription_status === 'trial'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
                      }
                    }

                    const isExpiredUser = statusLabel === 'Usuari/a Caducat/da';

                    return (
                      <div
                        key={u.id}
                        className={`p-3.5 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all ${
                          isExpiredUser 
                            ? 'bg-red-950/20 border-red-900/40' 
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-100">{u.username || 'Aspirant'}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${statusColor}`}>
                              {statusLabel}
                            </span>
                            {isExpiredUser && (
                              <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                🔒 Punts i progrés congelats (ocult a retar opositors)
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
                              Rol: {u.role || 'aspirant'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{u.email || 'Sense correu'}</p>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                            <span>Punts: {u.total_points ?? 0}</span>
                            <span>Mèrits: {u.merits ?? 0}</span>
                            {u.subscription_expires_at && (
                              <span>Expiració: {new Date(u.subscription_expires_at).toLocaleDateString('ca-ES')}</span>
                            )}
                            {/* Mètrica ràpida de preguntes contestades */}
                            {(() => {
                              const answeredList = [
                                ...(u.answered_questions || []),
                                ...(u.answeredQuestionIds || []),
                                ...(u.correct_questions || []),
                                ...(u.failed_questions || [])
                              ];
                              const answeredCount = new Set(answeredList).size;
                              const pct = QUESTIONS_BANK.length > 0 ? Math.round((answeredCount / QUESTIONS_BANK.length) * 100) : 0;
                              return (
                                <span className="text-sky-400 font-bold bg-sky-950/40 px-2 py-0.5 rounded border border-sky-800/40">
                                  {answeredCount} / {QUESTIONS_BANK.length} preguntes ({pct}%)
                                </span>
                              );
                            })()}
                            {u.can_view_study_report && (
                              <span className="text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Informe alumne actiu
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botons d'acció per usuari */}
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          {/* Botó Veure Informe de Cobertura (Detallat per Àmbits) */}
                          <button
                            onClick={() => setSelectedUserForReport(u)}
                            className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1 shadow cursor-pointer transition-all active:scale-95"
                            title="Veure radiografia i percentatges de temari d'aquest alumne"
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
                            <span>Radiografia</span>
                          </button>

                          {/* Toggle donar accés a l'alumne */}
                          <button
                            type="button"
                            disabled={togglingStudyUserId === u.id}
                            onClick={() => handleStudyReportToggle(u.id, Boolean(u.can_view_study_report))}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50 ${
                              u.can_view_study_report
                                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/35 shadow-sm shadow-emerald-500/10'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                            }`}
                            title={u.can_view_study_report ? "L'alumne té accés activat. Fes clic per revocar-li." : "Fes clic per activar l'accés a l'informe per a aquest alumne."}
                          >
                            <Eye className={`w-3.5 h-3.5 ${togglingStudyUserId === u.id ? 'animate-spin' : ''}`} />
                            <span>
                              {togglingStudyUserId === u.id 
                                ? 'Guardant...' 
                                : u.can_view_study_report ? 'Accés Alumne: SÍ' : 'Accés Alumne: NO'}
                            </span>
                          </button>
                          {/* Modificar temps */}
                          <button
                            onClick={() => handleSubscriptionExtend(u.id, 7)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                            title="Afegir 1 setmana"
                          >
                            +7d
                          </button>
                          <button
                            onClick={() => handleSubscriptionExtend(u.id, 14)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                            title="Afegir 2 setmanes"
                          >
                            +14d
                          </button>
                          <button
                            onClick={() => handleSubscriptionExtend(u.id, 30)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                            title="Afegir 1 mes"
                          >
                            +30d
                          </button>
                          <button
                            onClick={() => handleSubscriptionExtend(u.id, 0, true)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold"
                            title="Accés Ilimitat"
                          >
                            Ilimitat
                          </button>
                          <button
                            onClick={() => handleSubscriptionExpire(u.id)}
                            className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold"
                            title="Caducar accés"
                          >
                            Caducar
                          </button>

                          {/* Selector de Rol */}
                          <select
                            value={u.role || 'aspirant'}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                          >
                            <option value="aspirant">Aspirant</option>
                            <option value="question_editor">Gestor Preguntes</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTANYA 3: CODIS D'INVITACIÓ / ACCÉS */}
          {/* ========================================================================= */}
          {activeTab === 'codis' && !isQuestionEditorOnly && (
            <div className="space-y-6">
              {/* Formulari per generar codis */}
              <form onSubmit={handleGenerateCodes} className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Key className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-slate-100">Generador de Codis d'Invitació</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Duració</label>
                    <select
                      value={genIsUnlimited ? 'unlimited' : String(genDuration)}
                      onChange={(e) => {
                        if (e.target.value === 'unlimited') {
                          setGenIsUnlimited(true);
                        } else {
                          setGenIsUnlimited(false);
                          setGenDuration(Number(e.target.value));
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                    >
                      <option value="7">7 dies (1 setmana)</option>
                      <option value="14">14 dies (2 setmanes)</option>
                      <option value="30">30 dies (1 mes)</option>
                      <option value="90">90 dies (3 mesos)</option>
                      <option value="365">1 any</option>
                      <option value="unlimited">Ilimitat (VIP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Quantitat de codis</label>
                    <select
                      value={genCount}
                      onChange={(e) => setGenCount(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                    >
                      <option value={1}>1 codi</option>
                      <option value={2}>2 codis</option>
                      <option value={5}>5 codis</option>
                      <option value={10}>10 codis</option>
                      <option value={20}>20 codis</option>
                      <option value={50}>50 codis</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Etiqueta del lot / Campanya (opcional)
                    </label>
                    <input
                      type="text"
                      value={genBatchName}
                      onChange={(e) => setGenBatchName(e.target.value)}
                      placeholder="Ex: Alumnes Febrer 2026, Promo Instagram..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={generatingCodes}
                    className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    {generatingCodes ? 'Generant...' : `Generar ${genCount} Codis`}
                  </button>
                </div>
              </form>

              {/* Llista de codis generats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCodeFilter('all')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                        codeFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Tots ({codesList.length})
                    </button>
                    <button
                      onClick={() => setCodeFilter('available')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                        codeFilter === 'available' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Disponibles ({codesList.filter(c => !c.is_used).length})
                    </button>
                    <button
                      onClick={() => setCodeFilter('used')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                        codeFilter === 'used' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Canjeats ({codesList.filter(c => c.is_used).length})
                    </button>
                  </div>
                  <button
                    onClick={loadCodes}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300"
                    title="Actualitzar llista"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingCodes ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pretty-scrollbar pr-1">
                  {codesList
                    .filter(c => {
                      if (codeFilter === 'available') return !c.is_used;
                      if (codeFilter === 'used') return c.is_used;
                      return true;
                    })
                    .map((c) => (
                      <div
                        key={c.id}
                        className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg select-all">
                            {c.code}
                          </span>
                          <span className="text-slate-400">
                            {c.is_unlimited ? 'IL·LIMITAT' : `${c.duration_days} dies`}
                          </span>
                          {c.batch_name && (
                            <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                              {c.batch_name}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {c.is_used ? (
                            <div className="text-right">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                                Canjeat per: {c.used_by_username || c.used_by_email || 'Usuari'}
                              </span>
                              {c.used_at && (
                                <p className="text-[10px] text-slate-500">
                                  {new Date(c.used_at).toLocaleDateString('ca-ES')}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Disponible
                            </span>
                          )}

                          <button
                            onClick={() => handleCopyCode(c.code)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Copiar codi"
                          >
                            {copiedCode === c.code ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTANYA: SOL·LICITUDS DE RENOVACIÓ I ACCÉS */}
          {/* ========================================================================= */}
          {activeTab === 'renovacions' && !isQuestionEditorOnly && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                <div>
                  <h4 className="text-sm font-black text-slate-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Sol·licituds de Renovació i Accés ({renewalsList.length})
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Missatges, justificants de pagament i peticions de renovació enviades pels oponents.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={renewalFilter}
                    onChange={(e) => setRenewalFilter(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="pending">
                      Només Pendents ({renewalsList.filter(r => r.status === 'pending').length})
                    </option>
                    <option value="resolved">
                      Resoltes ({renewalsList.filter(r => r.status === 'resolved').length})
                    </option>
                    <option value="all">
                      Totes ({renewalsList.length})
                    </option>
                  </select>
                  <button
                    onClick={loadRenewals}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors cursor-pointer"
                    title="Actualitzar llista"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingRenewals ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Cercador ràpid de sol·licituds */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={renewalSearch}
                  onChange={(e) => setRenewalSearch(e.target.value)}
                  placeholder="Cerca per nom d'aspirant, correu o telèfon..."
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Llista de sol·licituds */}
              <div className="space-y-3 max-h-[520px] overflow-y-auto pretty-scrollbar pr-1">
                {renewalsList
                  .filter(r => renewalFilter === 'all' || r.status === renewalFilter)
                  .filter(r => {
                    if (!renewalSearch.trim()) return true;
                    const q = renewalSearch.toLowerCase();
                    return (
                      (r.user_name || '').toLowerCase().includes(q) ||
                      (r.user_email || '').toLowerCase().includes(q) ||
                      (r.phone || '').toLowerCase().includes(q) ||
                      (r.message || '').toLowerCase().includes(q)
                    );
                  })
                  .map((req) => {
                    const cleanPhone = (req.phone || '').replace(/[^0-9]/g, '');
                    const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${req.user_name}, et responem de l'acadèmia Agent Medina sobre la teva sol·licitud: "${req.request_type}".`)}` : null;

                    return (
                      <div
                        key={req.id}
                        className={`p-4 bg-slate-950/70 border rounded-2xl space-y-3 transition-colors ${
                          req.status === 'pending'
                            ? 'border-amber-500/30 shadow-lg shadow-amber-500/5'
                            : 'border-slate-800 opacity-80'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-black text-slate-100 text-sm">
                                {req.user_name || 'Aspirant'}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">
                                ({req.user_email})
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                req.status === 'resolved'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : req.status === 'dismissed'
                                    ? 'bg-slate-800 text-slate-400 border border-slate-700'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {req.status === 'resolved' ? 'RESOLTA' : req.status === 'dismissed' ? 'DESCARTADA' : 'PENDENT'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
                              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300 font-bold">
                                {req.request_type}
                              </span>
                              {req.created_at && (
                                <span className="text-[11px] text-slate-500">
                                  {new Date(req.created_at).toLocaleDateString('ca-ES', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Botons d'acció per l'Admin */}
                          {(() => {
                            const initialDays = (() => {
                              const t = (req.request_type || '').toLowerCase();
                              if (t.includes('3 mes') || t.includes('90')) return 90;
                              if (t.includes('6 mes') || t.includes('180')) return 180;
                              if (t.includes('vip') || t.includes('il·limitat')) return 365;
                              if (t.includes('15')) return 15;
                              if (t.includes('7')) return 7;
                              return 30;
                            })();
                            const chosenDays = renewalDaysMap[req.id] ?? initialDays;

                            return (
                              <div className="flex flex-wrap items-center gap-2 shrink-0">
                                {/* Opció per renovar els dies que vulguis (input lliure + botons ràpids) */}
                                <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900/90 border border-amber-500/30 rounded-xl">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase pl-0.5">
                                      Dies:
                                    </span>
                                    <input
                                      type="number"
                                      min="1"
                                      max="999"
                                      value={chosenDays}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setRenewalDaysMap(prev => ({
                                          ...prev,
                                          [req.id]: isNaN(val) ? 1 : Math.max(1, val)
                                        }));
                                      }}
                                      className="w-12 bg-slate-950 border border-slate-700 rounded-lg px-1 py-1 text-xs text-amber-300 font-mono font-black text-center focus:outline-none focus:border-amber-500"
                                      title="Escriu el número de dies a renovar"
                                    />
                                  </div>

                                  {/* Xips de dies ràpids per a mòbil */}
                                  <div className="flex items-center gap-0.5">
                                    {[7, 15, 30, 60, 90, 180].map((d) => (
                                      <button
                                        key={d}
                                        type="button"
                                        onClick={() => setRenewalDaysMap(prev => ({ ...prev, [req.id]: d }))}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                          chosenDays === d
                                            ? 'bg-amber-500 text-slate-950 font-black'
                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                                        }`}
                                      >
                                        {d}d
                                      </button>
                                    ))}
                                  </div>

                                  {/* Botó directe d'activació */}
                                  <button
                                    onClick={() => handleDirectRenewFromRequest(req, chosenDays)}
                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-amber-500/20 shrink-0 ml-auto"
                                    title={`Activa ${chosenDays} dies d'accés a aquest usuari i resol la sol·licitud`}
                                  >
                                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                    <span>⚡ Renovar {chosenDays} dies</span>
                                  </button>
                                </div>

                                {/* Estat Resoldre / Descartar */}
                                {req.status === 'pending' ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleRenewalAction(req.id, 'resolved', (req as any).source_table)}
                                      className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                                    >
                                      Resoldre
                                    </button>
                                    <button
                                      onClick={() => handleRenewalAction(req.id, 'dismissed', (req as any).source_table)}
                                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded-xl text-xs cursor-pointer transition-colors"
                                    >
                                      Descartar
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleRenewalAction(req.id, 'pending', (req as any).source_table)}
                                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded-xl text-xs cursor-pointer"
                                  >
                                    Reobrir
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Telèfon i missatge de l'aspirant */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                          {req.phone && (
                            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-mono text-slate-200">{req.phone}</span>
                              </div>
                              {waLink && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                            </div>
                          )}

                          <div className={`p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between ${
                            req.phone ? 'sm:col-span-2' : 'sm:col-span-3'
                          }`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="text-slate-300 truncate">{req.user_email}</span>
                            </div>
                            <a
                              href={`mailto:${req.user_email}?subject=Sol%C2%B7licitud%20Renovaci%C3%B3%20Agent%20Medina`}
                              className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 shrink-0 ml-2"
                            >
                              <Send className="w-3 h-3" />
                              <span>Escriure Mail</span>
                            </a>
                          </div>
                        </div>

                        {/* Text del missatge o justificant */}
                        {req.message && (
                          <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 text-xs">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                              Missatge de l'opositor:
                            </span>
                            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                              {req.message}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                {renewalsList.filter(r => renewalFilter === 'all' || r.status === renewalFilter).length === 0 && (
                  <div className="text-center py-12 px-4 bg-slate-950/40 border border-slate-800 rounded-2xl">
                    <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-60" />
                    <p className="text-sm font-bold text-slate-300">Cap sol·licitud trobada</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Quan un aspirant demani una renovació o enviï un missatge des del modal "Estat de la Subscripció", apareixerà directament en aquesta secció.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTANYA 4: IMPUGNACIONS DE PREGUNTES */}
          {/* ========================================================================= */}
          {activeTab === 'impugnacions' && !isQuestionEditorOnly && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                <div>
                  <h4 className="text-sm font-black text-slate-100 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Impugnacions i Notificacions d'Errada ({reportsList.length})
                  </h4>
                  <p className="text-xs text-slate-400">
                    Revisa les consultes i possibles errades notificades pels oponents.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={reportFilter}
                    onChange={(e) => setReportFilter(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300"
                  >
                    <option value="pending">Només Pendents</option>
                    <option value="resolved">Resoltes</option>
                    <option value="all">Totes</option>
                  </select>
                  <button
                    onClick={loadReports}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingReports ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pretty-scrollbar pr-1">
                {reportsList
                  .filter(r => reportFilter === 'all' || r.status === reportFilter)
                  .map((rep) => {
                    const matchedQ = QUESTIONS_BANK.find(q => q.id === rep.question_id);
                    return (
                      <div
                        key={rep.id}
                        className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3 text-xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-400">{rep.ambit || 'Àmbit'}</span>
                              <span className="font-mono text-[10px] text-slate-500">ID: {rep.question_id}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rep.status === 'resolved' 
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {rep.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-slate-400 text-[11px] mt-0.5">
                              Reportat per: <strong className="text-slate-200">{rep.reported_by_name}</strong> ({rep.reported_by_email || 'Sense correu'})
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {matchedQ && (
                              <button
                                onClick={() => handleStartEdit(matchedQ)}
                                className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-bold"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Editar Pregunta</span>
                              </button>
                            )}
                            {rep.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleReportAction(rep.id, 'resolved')}
                                  className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold"
                                >
                                  Resoldre
                                </button>
                                <button
                                  onClick={() => handleReportAction(rep.id, 'dismissed')}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded-lg"
                                >
                                  Descartar
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Pregunta text */}
                        <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-slate-300">
                          "{rep.question_text || matchedQ?.pregunta || 'Sense text'}"
                        </div>

                        {/* Detalls de la impugnació */}
                        <div className="p-2.5 bg-amber-500/5 rounded-xl border border-amber-500/20">
                          <p className="font-bold text-amber-400 mb-0.5">Motiu: {rep.reason}</p>
                          {rep.details && (
                            <p className="text-slate-300 text-xs leading-relaxed">{rep.details}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTANYA 5: CONTACTE I PAGAMENTS DE L'ACADÈMIA */}
          {/* ========================================================================= */}
          {activeTab === 'contacte' && !isQuestionEditorOnly && (
            <form onSubmit={handleSaveContactInfo} className="space-y-4 max-w-2xl bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
              <div className="pb-3 border-b border-slate-800">
                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Dades de Contacte i Renovació per als Alumnes
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Aquestes dades apareixeran al modal de l'alumne quan la seva subscripció estigui a punt de caducar o caducada.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Número de WhatsApp d'Atenció (amb prefix internacional):
                </label>
                <input
                  type="text"
                  value={contactInfo.whatsapp_number}
                  onChange={(e) => setContactInfo({ ...contactInfo, whatsapp_number: e.target.value })}
                  placeholder="Ex: +34 600 000 000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                  Usuari o Canal de Telegram:
                </label>
                <input
                  type="text"
                  value={contactInfo.telegram_handle}
                  onChange={(e) => setContactInfo({ ...contactInfo, telegram_handle: e.target.value })}
                  placeholder="Ex: @AcademiaMedina"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Correu Electrònic de Suport:
                </label>
                <input
                  type="email"
                  value={contactInfo.support_email}
                  onChange={(e) => setContactInfo({ ...contactInfo, support_email: e.target.value })}
                  placeholder="Ex: opossscar@gmail.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Instruccions de Pagament / Renovació (Bizum, Transferència, etc.):
                </label>
                <textarea
                  rows={3}
                  value={contactInfo.payment_instructions}
                  onChange={(e) => setContactInfo({ ...contactInfo, payment_instructions: e.target.value })}
                  placeholder="Ex: Fes un Bizum al 600 00 00 00 indicant el teu correu com a concepte i t'enviarem el teu codi d'accés..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingContact}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
                >
                  <Save className="w-4 h-4" />
                  {savingContact ? 'Desant...' : 'Desar Dades de Contacte'}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* PESTANYA 6: NAVEGACIÓ (Texts dinàmics barra superior) */}
          {/* ========================================================================= */}
          {activeTab === 'navigation' && !isQuestionEditorOnly && (
            <form onSubmit={handleSaveNavigationTexts} className="space-y-4 max-w-2xl bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                    <Compass className="w-4 h-4" />
                    Edició de Textos de la Barra Superior
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modifica els títols de cada pestanya. Es sincronitzen en temps real a Supabase.
                  </p>
                </div>
                {loadingNav && (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">🎲 Pestanya 1 — Oca / Campanya:</label>
                  <input
                    type="text"
                    value={navTexts.campanya}
                    onChange={(e) => setNavTexts({ ...navTexts, campanya: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">🎡 Pestanya 2 — Duels 1v1:</label>
                  <input
                    type="text"
                    value={navTexts.duels}
                    onChange={(e) => setNavTexts({ ...navTexts, duels: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">🛍️ Pestanya 3 — Tenda de Mèrits:</label>
                  <input
                    type="text"
                    value={navTexts.tienda}
                    onChange={(e) => setNavTexts({ ...navTexts, tienda: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">📚 Pestanya 4 — Repàs d'Errors:</label>
                  <input
                    type="text"
                    value={navTexts.repas}
                    onChange={(e) => setNavTexts({ ...navTexts, repas: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">🏆 Pestanya 5 — Rànquing:</label>
                  <input
                    type="text"
                    value={navTexts.ranking}
                    onChange={(e) => setNavTexts({ ...navTexts, ranking: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingNav}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
                >
                  <Save className="w-4 h-4" />
                  {savingNav ? 'Desant...' : 'Desar Textos a Supabase'}
                </button>
              </div>
            </form>
          )}

          {/* =========================================================================
              PESTANYA: COMUNICATS I MISSATGES GLOBALS (Al mig de la pantalla a tots)
             ========================================================================= */}
          {activeTab === 'comunicats' && !isQuestionEditorOnly && (
            <div className="p-4 sm:p-6 space-y-6">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-amber-400" />
                    <span>Comunicat Global a Pantalla Completa</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    Aquest missatge apareixerà al centre de la pantalla a <strong className="text-amber-300">tots els opositores connectats</strong> en temps real.
                    El missatge romandrà visible bloquejant la pantalla fins que facin clic explícitament al botó de <strong className="text-emerald-400">"He llegit el comunicat"</strong>.
                  </p>
                </div>
                {activeBroadcast && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black shrink-0 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    COMUNICAT ACTIU
                  </span>
                )}
              </div>

              {/* Estat del comunicat actual si n'hi ha un d'actiu */}
              {activeBroadcast && (
                <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5" />
                      Comunicat visible als opositores
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Publicat: {new Date(activeBroadcast.createdAt).toLocaleString('ca-ES')}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                    <h5 className="font-black text-slate-100 text-sm">{activeBroadcast.title}</h5>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{activeBroadcast.message}</p>
                    <div className="flex flex-wrap gap-3 text-[10px] text-slate-400 mt-2 font-mono border-t border-slate-800/60 pt-2">
                      <span>Emès per: <strong className="text-slate-200">{activeBroadcast.authorName || 'Direcció Pedagògica'}</strong></span>
                      <span>Prioritat: <strong className="text-slate-200">{activeBroadcast.priority || 'important'}</strong></span>
                      {activeBroadcast.scheduledStart && (
                        <span className="text-sky-400 font-semibold">
                          📅 Inici: {new Date(activeBroadcast.scheduledStart).toLocaleString('ca-ES')}
                        </span>
                      )}
                      {activeBroadcast.expiresAt && (
                        <span className="text-rose-400 font-semibold">
                          ⏳ Caduca: {new Date(activeBroadcast.expiresAt).toLocaleString('ca-ES')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={async () => {
                        setClearingBroadcast(true);
                        try {
                          const ok = await clearAdminBroadcastMessage();
                          if (ok) {
                            setActiveBroadcast(null);
                            setNotification({ type: 'success', message: '✅ Comunicat global retirat amb èxit! Ja no apareixerà a cap aspirant.' });
                          } else {
                            setNotification({ type: 'error', message: 'No s\'ha pogut retirar el comunicat. Torna-ho a provar.' });
                          }
                        } catch (err: any) {
                          setNotification({ type: 'error', message: 'Error en retirar el comunicat: ' + (err?.message || err) });
                        } finally {
                          setClearingBroadcast(false);
                        }
                      }}
                      disabled={clearingBroadcast}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                      <span>{clearingBroadcast ? 'Retirant comunicat...' : 'Retirar Comunicat Actiu'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Formulari per emetre un nou comunicat */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!broadcastMessage.trim()) {
                    setNotification({ type: 'error', message: 'Escriu el text del missatge abans d\'enviar.' });
                    return;
                  }
                  setSendingBroadcast(true);
                  const scheduledIso = broadcastScheduleEnabled && broadcastScheduledStart
                    ? new Date(broadcastScheduledStart).toISOString()
                    : null;
                  const expiresIso = broadcastExpireEnabled && broadcastExpiresAt
                    ? new Date(broadcastExpiresAt).toISOString()
                    : null;

                  const ok = await sendAdminBroadcastMessage({
                    title: broadcastTitle,
                    message: broadcastMessage,
                    priority: broadcastPriority,
                    authorName: 'Equip Docent Agent Medina',
                    scheduledStart: scheduledIso,
                    expiresAt: expiresIso
                  });
                  setSendingBroadcast(false);
                  if (ok) {
                    const noticeText = scheduledIso 
                      ? `🗓️ Comunicat programat per al ${new Date(scheduledIso).toLocaleString('ca-ES')}!`
                      : '🚀 Comunicat enviat a tots els opositores! Els apareixerà al mig de la pantalla.';
                    setNotification({ type: 'success', message: noticeText });
                    const updated = await fetchActiveBroadcastMessage();
                    setActiveBroadcast(updated);
                  } else {
                    setNotification({ type: 'error', message: 'Error en enviar el comunicat global.' });
                  }
                }}
                className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-4"
              >
                <h5 className="font-bold text-slate-200 text-xs flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-400" />
                  <span>Emetre Nou Comunicat Global a Tots els Usuaris</span>
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">Títol del Comunicat:</label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="Ex: 📢 Actualització Important del Temari 2026"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Nivell d'Urgència:</label>
                    <select
                      value={broadcastPriority}
                      onChange={(e: any) => setBroadcastPriority(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold cursor-pointer"
                    >
                      <option value="important">⚠️ Important (Color daurat)</option>
                      <option value="urgent">🚨 Urgent (Color vermell intens)</option>
                      <option value="normal">ℹ️ Informatiu (Color blau marí)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Missatge / Cos del Comunicat (Text complet que llegirà l'aspirant):
                  </label>
                  <textarea
                    rows={6}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Escriu aquí el comunicat oficial..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-normal leading-relaxed resize-y focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                {/* Secció de Programació Horària i Caducitat */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
                  {/* Programació hora inici */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                      <input
                        type="checkbox"
                        checked={broadcastScheduleEnabled}
                        onChange={(e) => setBroadcastScheduleEnabled(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0"
                      />
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      <span>Programar inici a una data i hora concreta:</span>
                    </label>
                    {broadcastScheduleEnabled ? (
                      <input
                        type="datetime-local"
                        value={broadcastScheduledStart}
                        onChange={(e) => setBroadcastScheduledStart(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                        required={broadcastScheduleEnabled}
                      />
                    ) : (
                      <p className="text-[11px] text-slate-500 pl-6">
                        Visible immediatament al prémer el botó.
                      </p>
                    )}
                  </div>

                  {/* Caducitat automàtica en x temps */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                      <input
                        type="checkbox"
                        checked={broadcastExpireEnabled}
                        onChange={(e) => setBroadcastExpireEnabled(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0"
                      />
                      <Clock className="w-3.5 h-3.5 text-rose-400" />
                      <span>Finalitzar / Caducar automàticament en una data:</span>
                    </label>
                    {broadcastExpireEnabled ? (
                      <input
                        type="datetime-local"
                        value={broadcastExpiresAt}
                        onChange={(e) => setBroadcastExpiresAt(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                        required={broadcastExpireEnabled}
                      />
                    ) : (
                      <p className="text-[11px] text-slate-500 pl-6">
                        Indefinit fins que el retiris manualment o l'alumne el marqui com a llegit.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                  <span className="text-[11px] text-slate-400">
                    💡 Un cop un aspirant premi <strong>"He llegit el comunicat"</strong>, no li tornarà a sortir mai més.
                  </span>
                  <button
                    type="submit"
                    disabled={sendingBroadcast}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{sendingBroadcast ? 'Enviant a tots...' : 'Llançar Comunicat a Tots'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
