import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { 
  PLMunicipi, 
  PLTema, 
  PLPregunta, 
  PLUserProgressionRecord, 
  PLExamScore 
} from '../../types/policiaLocal';
import { 
  fetchPLMunicipis, 
  fetchPLTemes, 
  fetchAllPLPreguntes, 
  fetchPLUserProgress, 
  fetchPLExamScores,
  getGlobalAnsweredQuestionIds 
} from '../../services/policiaLocalService';
import { PLTopicQuizModal } from './PLTopicQuizModal';
import { PLSimulacreModal } from './PLSimulacreModal';
import { PLExamScoreModal } from './PLExamScoreModal';
import { PLAdminModal } from './PLAdminModal';
import { AudioEngine } from '../../utils/audio';
import { 
  Building2, 
  BookOpen, 
  Globe2, 
  Timer, 
  Award, 
  ArrowLeft, 
  ShieldCheck, 
  Settings, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  Play, 
  BarChart3,
  Flame,
  Plus
} from 'lucide-react';

interface ModePoliciaLocalProps {
  user: UserProfile;
  onBackToHub: () => void;
}

type PLSubTab = 'municipis' | 'comu' | 'cultura' | 'simulacres' | 'notes';

export const ModePoliciaLocal: React.FC<ModePoliciaLocalProps> = ({
  user,
  onBackToHub
}) => {
  const [activeTab, setActiveTab] = useState<PLSubTab>('municipis');
  const [municipis, setMunicipis] = useState<PLMunicipi[]>([]);
  const [temes, setTemes] = useState<PLTema[]>([]);
  const [allQuestions, setAllQuestions] = useState<PLPregunta[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, PLUserProgressionRecord>>({});
  const [examScores, setExamScores] = useState<Record<string, PLExamScore>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [activeQuizTopic, setActiveQuizTopic] = useState<{ topic: PLTema; municipi?: PLMunicipi | null } | null>(null);
  const [showSimulacreModal, setShowSimulacreModal] = useState<PLMunicipi | null | 'general'>(null);
  const [scoreModalMunicipi, setScoreModalMunicipi] = useState<PLMunicipi | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [expandedMunicipiId, setExpandedMunicipiId] = useState<string | null>('sant_esteve_sesrovires');

  const isAdmin = Boolean(
    user.role === 'admin' || 
    (user.email && user.email.toLowerCase().trim() === 'opossscar@gmail.com')
  );

  // Carregar totes les dades
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [mList, tList, qList, pMap, sMap] = await Promise.all([
        fetchPLMunicipis(),
        fetchPLTemes(),
        fetchAllPLPreguntes(),
        fetchPLUserProgress(user.uid),
        fetchPLExamScores(user.uid)
      ]);

      setMunicipis(mList);
      setTemes(tList);
      setAllQuestions(qList);
      setUserProgress(pMap);
      setExamScores(sMap);
    } catch (e) {
      console.warn('Error loading PL data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user.uid]);

  // Càlcul de dies restants fins a l'examen
  const getDaysUntilExam = (examDateStr?: string | null) => {
    if (!examDateStr) return null;
    const examDate = new Date(examDateStr);
    const now = new Date();
    // Resetejar hores per comparar dies naturals
    examDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = examDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Càlcul del progrés d'un municipi (incloent preguntes resoltes a qualsevol tema)
  const getMunicipiProgress = (municipiId: string) => {
    const municipiTopics = temes.filter(t => t.municipi_id === municipiId);
    if (!municipiTopics.length) return { percent: 0, totalQuestions: 0, answeredQuestions: 0 };

    const globalAnswered = getGlobalAnsweredQuestionIds();
    const topicIds = new Set(municipiTopics.map(t => t.id));
    const mQuestions = allQuestions.filter(q => topicIds.has(q.tema_id) || q.municipi_id === municipiId);
    
    if (!mQuestions.length) return { percent: 0, totalQuestions: 0, answeredQuestions: 0 };

    const answeredCount = mQuestions.filter(q => globalAnswered.has(q.id)).length;
    const percent = Math.round((answeredCount / mQuestions.length) * 100);

    return {
      percent,
      totalQuestions: mQuestions.length,
      answeredQuestions: answeredCount
    };
  };

  // Retorna el nivell segons el progrés
  const getProgressLevelTitle = (percent: number) => {
    if (percent >= 100) return '🏆 Nivell Mestre Policial (100%)';
    if (percent >= 75) return '⭐ Nivell Avançat';
    if (percent >= 50) return '🔷 Nivell Intermedi';
    if (percent >= 25) return '🔰 Nivell Iniciat';
    return '🌱 Nivell Aspirant';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-slate-950 pb-12">
      
      {/* ========================================================= */}
      {/* 1. HEADER AMB IDENTITAT POLICIA LOCAL DE CATALUNYA */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-sky-500/20 shadow-lg">
        {/* Línia decorativa de quadres damero blau/blanc de policia local */}
        <div className="h-1.5 w-full bg-[repeating-linear-gradient(45deg,#0284c7_0,#0284c7_12px,#ffffff_12px,#ffffff_24px,#0369a1_24px,#0369a1_36px)]" />

        <div className="max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToHub}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Hub</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 border border-sky-400/40 text-slate-950 flex items-center justify-center font-black shadow-md shadow-sky-500/20">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-base font-black tracking-tight text-white leading-none">
                    POLICIA LOCAL
                  </h1>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 uppercase">
                    CATALUNYA
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block font-medium mt-0.5">
                  Temari Comú, Cultura General i Bases Municipals
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowAdminModal(true)}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Panell Admin</span>
              </button>
            )}

            <div className="hidden xs:flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300">
              <span className="text-sky-400 font-bold">{allQuestions.length}</span>
              <span className="text-[10px] text-slate-500">preguntes</span>
            </div>
          </div>
        </div>

        {/* BARRA DE SUB-PESTANYES */}
        <div className="max-w-6xl w-full mx-auto px-3.5 sm:px-6 flex gap-1 sm:gap-2 overflow-x-auto no-scrollbar pt-1 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('municipis')}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'municipis'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Municipis Actius ({municipis.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comu')}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'comu'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Temari Comú</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cultura')}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'cultura'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Cultura General</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulacres')}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'simulacres'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Simulacre Oficial</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Notes d'Examen ({Object.keys(examScores).length})</span>
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. CONTINGUT PRINCIPAL DE LA PESTANYA SELECCIONADA */}
      {/* ========================================================= */}
      <main className="max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-6 space-y-6">

        {/* ------------------------------------------------------- */}
        {/* TAB 1: MUNICIPIS ACTIUS */}
        {/* ------------------------------------------------------- */}
        {activeTab === 'municipis' && (
          <div className="space-y-6">
            
            {/* Banner Introductori */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-950 border border-sky-500/30 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block">
                  CONVOCATÒRIES LOCALS CATALUNYA
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Oposicions Policia Local per Municipis
                </h2>
                <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                  Accedeix al temari específic de cada ajuntament. Les preguntes compartides amb el temari comú comptabilitzen automàticament a tots els municipis on estiguin presents.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSimulacreModal('general')}
                  className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Timer className="w-4 h-4" />
                  <span>Simulacre Ràpid</span>
                </button>
              </div>
            </div>

            {/* Llistat de Municipis */}
            <div className="space-y-4">
              {municipis.map(m => {
                const { percent, totalQuestions, answeredQuestions } = getMunicipiProgress(m.id);
                const mTopics = temes.filter(t => t.municipi_id === m.id);
                const isExpanded = expandedMunicipiId === m.id;
                const daysLeft = getDaysUntilExam(m.exam_date);
                const userScore = examScores[m.id];

                return (
                  <div
                    key={m.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 rounded-3xl overflow-hidden transition-all shadow-md"
                  >
                    {/* CAPÇALERA DE LA TARGETA DEL MUNICIPI */}
                    <div className="p-5 sm:p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                            <Building2 className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg sm:text-xl font-black text-white">
                                {m.name}
                              </h3>
                              
                              {/* BADGE D'ESTAT DE LA CONVOCATÒRIA */}
                              {m.status === 'pending' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  🟡 Pendent de convocatòria
                                </span>
                              )}
                              {m.status === 'open_registration' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  🟢 Convocatòria oberta {m.registration_deadline && `· Tanca el ${new Date(m.registration_deadline).toLocaleDateString()}`}
                                </span>
                              )}
                              {m.status === 'closed_registration' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/15 text-orange-300 border border-orange-500/30">
                                  🟠 Inscripcions tancades {m.registration_closed_at && `el ${new Date(m.registration_closed_at).toLocaleDateString()}`} · Pendent data examen
                                </span>
                              )}
                              {m.status === 'exam_scheduled' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1 font-mono">
                                  <span>🔵 Data d'examen: {m.exam_date && new Date(m.exam_date).toLocaleDateString()}</span>
                                  {daysLeft !== null && daysLeft >= 0 && (
                                    <span className="text-amber-400 font-bold">({daysLeft} dies restants)</span>
                                  )}
                                </span>
                              )}
                              {m.status === 'finished' && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                                  🏁 Examen finalitzat
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                              {m.notes || `Bases del procés selectiu de la Policia Local de ${m.name}.`}
                            </p>
                          </div>
                        </div>

                        {/* ACCIONS DE MUNICIPI */}
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          {userScore ? (
                            <button
                              type="button"
                              onClick={() => setScoreModalMunicipi(m)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border flex items-center gap-1.5 cursor-pointer ${
                                userScore.is_passed
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              }`}
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>Nota: {userScore.total_score.toFixed(2)} ({userScore.is_passed ? 'APTE' : 'NO APTE'})</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setScoreModalMunicipi(m)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Award className="w-3.5 h-3.5 text-amber-400" />
                              <span>Posar Nota Examen</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setShowSimulacreModal(m)}
                            className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Timer className="w-3.5 h-3.5" />
                            <span>Simulacre</span>
                          </button>
                        </div>
                      </div>

                      {/* BARRA DE PROGRÉS I NIVELL */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-300 text-[11px]">
                            {getProgressLevelTitle(percent)}
                          </span>
                          <span className="font-mono text-slate-400 text-[11px]">
                            {answeredQuestions} de {totalQuestions} preguntes resoltes ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* BOTÓ DESPLEGAR TEMARI */}
                      <button
                        type="button"
                        onClick={() => setExpandedMunicipiId(isExpanded ? null : m.id)}
                        className="w-full py-2 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center justify-between px-4 transition-all cursor-pointer"
                      >
                        <span>Veure els {mTopics.length} temes oficials de {m.name}</span>
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* LLISTA DE TEMES DESPLEGADA */}
                    {isExpanded && (
                      <div className="px-5 pb-6 pt-2 border-t border-slate-800 bg-slate-950/40 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          <span>Temari Oficial</span>
                          <span>Estat del Tema</span>
                        </div>

                        {mTopics.map(t => {
                          const topicQuestions = allQuestions.filter(q => q.tema_id === t.id);
                          const hasQuestions = topicQuestions.length > 0;
                          const globalAnswered = getGlobalAnsweredQuestionIds();
                          const answeredInTopic = topicQuestions.filter(q => globalAnswered.has(q.id)).length;

                          return (
                            <div
                              key={t.id}
                              className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                            >
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-black text-sky-400">{t.code}</span>
                                  {t.annex && (
                                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-amber-300 font-medium">
                                      {t.annex}
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-xs sm:text-sm font-semibold text-slate-200 leading-snug">
                                  {t.title}
                                </h4>
                                {t.description && (
                                  <p className="text-[11px] text-slate-400 line-clamp-1">{t.description}</p>
                                )}
                              </div>

                              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                {hasQuestions ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                                      {answeredInTopic}/{topicQuestions.length} resoltes
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setActiveQuizTopic({ topic: t, municipi: m })}
                                      className="px-3.5 py-1.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <Play className="w-3 h-3 fill-current" />
                                      <span>Practicar</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-bold">
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      <span>Pendent d'afegir preguntes</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setActiveQuizTopic({ topic: t, municipi: m })}
                                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                                    >
                                      Obrir
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------- */}
        {/* TAB 2: TEMARI COMÚ */}
        {/* ------------------------------------------------------- */}
        {activeTab === 'comu' && (
          <div className="space-y-5">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900 border border-sky-500/30 rounded-3xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block">
                TRONC COMÚ POLICIAL
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Temari Comú de Policia Local de Catalunya
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                Matèries transversals compartides per totes les policies locals (Constitució Espanyola, Estatut d'Autonomia, Llei 16/1991 de Policies Locals, Llei 4/2003 de Seguretat Pública, Trànsit i Codi Penal). Les preguntes resoltes aquí comptabilitzen automàticament a qualsevol municipi.
              </p>
            </div>

            <div className="space-y-3">
              {temes.filter(t => t.scope === 'comu').map(t => {
                const topicQuestions = allQuestions.filter(q => q.tema_id === t.id);
                const hasQuestions = topicQuestions.length > 0;
                const globalAnswered = getGlobalAnsweredQuestionIds();
                const answeredInTopic = topicQuestions.filter(q => globalAnswered.has(q.id)).length;

                return (
                  <div
                    key={t.id}
                    className="p-4 bg-slate-900 border border-slate-800 hover:border-sky-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <span className="font-mono text-xs font-black text-sky-400">{t.code}</span>
                      <h4 className="text-sm font-bold text-white">{t.title}</h4>
                      {t.description && (
                        <p className="text-xs text-slate-400">{t.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {hasQuestions ? (
                        <>
                          <span className="text-xs font-mono text-emerald-400 font-bold">
                            {answeredInTopic}/{topicQuestions.length} resoltes
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveQuizTopic({ topic: t })}
                            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Practicar</span>
                          </button>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Pendent d'afegir preguntes</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------- */}
        {/* TAB 3: CULTURA GENERAL */}
        {/* ------------------------------------------------------- */}
        {activeTab === 'cultura' && (
          <div className="space-y-5">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 rounded-3xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block">
                EXAMEN INDEPENDENT DE CULTURA
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Cultura General i Actualitat
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                Subsecció específica per preparar la primera prova de l'oposició: Història, geografia, institucions catalanes i europees, patrimoni cultural i actualitat 2025-2026.
              </p>
            </div>

            <div className="space-y-3">
              {temes.filter(t => t.scope === 'cultura_general').map(t => {
                const topicQuestions = allQuestions.filter(q => q.tema_id === t.id);
                const hasQuestions = topicQuestions.length > 0;
                const globalAnswered = getGlobalAnsweredQuestionIds();
                const answeredInTopic = topicQuestions.filter(q => globalAnswered.has(q.id)).length;

                return (
                  <div
                    key={t.id}
                    className="p-4 bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <span className="font-mono text-xs font-black text-purple-400">{t.code}</span>
                      <h4 className="text-sm font-bold text-white">{t.title}</h4>
                      {t.description && (
                        <p className="text-xs text-slate-400">{t.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {hasQuestions ? (
                        <>
                          <span className="text-xs font-mono text-emerald-400 font-bold">
                            {answeredInTopic}/{topicQuestions.length} resoltes
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveQuizTopic({ topic: t })}
                            className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Practicar</span>
                          </button>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Pendent d'afegir preguntes</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------- */}
        {/* TAB 4: SIMULACRES D'EXAMEN */}
        {/* ------------------------------------------------------- */}
        {activeTab === 'simulacres' && (
          <div className="space-y-6">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                SIMULACRE REAL D'OPOSICIÓ
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Simulacres Oficials amb Barem de Descompte
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                Posa a prova la teva capacitat d'examen sota pressió: 40 o 50 preguntes barrejades amb penalització de -0,25 punts per errada i cronòmetre oficial en compte enrere.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TARGETA SIMULACRE GENERAL */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                    <Timer className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-white">Simulacre General Policia Local</h3>
                  <p className="text-xs text-slate-400">
                    Preguntes aleatòries barrejades de tot el banc (Temari Comú, Cultura General i Temaris municipals).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSimulacreModal('general')}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Iniciar Simulacre General</span>
                </button>
              </div>

              {/* SIMULACRES PER MUNICIPI */}
              {municipis.map(m => (
                <div key={m.id} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black text-white">Simulacre {m.name}</h3>
                    <p className="text-xs text-slate-400">
                      Barem específic per a les bases de {m.name} amb la ponderació {m.cultura_weight ?? 50}% Cultura / {m.temari_weight ?? 50}% Temari.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSimulacreModal(m)}
                    className="w-full py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Iniciar Simulacre {m.name}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------- */}
        {/* TAB 5: LES MEVES NOTES D'EXAMEN */}
        {/* ------------------------------------------------------- */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                EXPEDIENT OFICIAL D'OPOSITOR
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Notes Oficials de les Convocatòries
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                Registra i consulta les teves notes reals de cadascuna de les convocatòries oficials a les quals t'has presentat (Cultura General de 0 a 10 i Temari de 0 a 10). Mínim 5,00 = APTE.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {municipis.map(m => {
                const score = examScores[m.id];
                const cWeight = m.cultura_weight ?? 50;
                const tWeight = m.temari_weight ?? 50;

                return (
                  <div
                    key={m.id}
                    className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white uppercase">{m.name}</span>
                        {score ? (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            score.is_passed 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}>
                            {score.is_passed ? 'APTE' : 'NO APTE'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] text-slate-400 bg-slate-800">
                            Sense nota
                          </span>
                        )}
                      </div>

                      {score ? (
                        <div className="space-y-2 p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Cultura ({cWeight}%):</span>
                            <span className="font-mono font-bold text-white">{score.cultura_score.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Temari ({tWeight}%):</span>
                            <span className="font-mono font-bold text-white">{score.temari_score.toFixed(2)}</span>
                          </div>
                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-200">Nota Final Ponderada:</span>
                            <span className="font-mono font-black text-base text-sky-400">{score.total_score.toFixed(2)} / 10</span>
                          </div>
                          {score.notes && (
                            <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-900">
                              "{score.notes}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-950/60 border border-slate-800/60 rounded-2xl text-center text-xs text-slate-500">
                          Encara no has introduït les teves notes d'aquesta convocatòria.
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setScoreModalMunicipi(m)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>{score ? 'Modificar Nota' : 'Afegir Nota'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* 3. MODALS DINÀMICS */}
      {/* ========================================================= */}

      {/* MODAL DE QUIZ DE TEMA */}
      {activeQuizTopic && (
        <PLTopicQuizModal
          topic={activeQuizTopic.topic}
          municipi={activeQuizTopic.municipi}
          questions={allQuestions.filter(q => q.tema_id === activeQuizTopic.topic.id)}
          user={user}
          onClose={() => setActiveQuizTopic(null)}
          onQuestionAnswered={() => {
            // Actualitzar càlculs
            fetchPLUserProgress(user.uid).then(setUserProgress);
          }}
        />
      )}

      {/* MODAL DE SIMULACRE */}
      {showSimulacreModal && (
        <PLSimulacreModal
          municipi={showSimulacreModal === 'general' ? null : showSimulacreModal}
          allQuestions={
            showSimulacreModal === 'general'
              ? allQuestions
              : allQuestions.filter(q => 
                  q.municipi_id === showSimulacreModal.id || 
                  temes.find(t => t.id === q.tema_id && (t.municipi_id === showSimulacreModal.id || t.scope === 'comu' || t.scope === 'cultura_general'))
                )
          }
          user={user}
          onClose={() => setShowSimulacreModal(null)}
        />
      )}

      {/* MODAL DE NOTA D'EXAMEN */}
      {scoreModalMunicipi && (
        <PLExamScoreModal
          municipi={scoreModalMunicipi}
          user={user}
          existingScore={examScores[scoreModalMunicipi.id]}
          onClose={() => setScoreModalMunicipi(null)}
          onSaved={saved => {
            setExamScores(prev => ({ ...prev, [saved.municipi_id]: saved }));
          }}
        />
      )}

      {/* MODAL D'ADMINISTRACIÓ */}
      {showAdminModal && (
        <PLAdminModal
          municipis={municipis}
          temes={temes}
          questions={allQuestions}
          onClose={() => setShowAdminModal(false)}
          onRefreshData={loadAllData}
        />
      )}
    </div>
  );
};
