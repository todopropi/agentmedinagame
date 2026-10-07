import React, { useState, useMemo } from 'react';
import { UserProfile, Question } from '../types';
import { 
  CAMI_AMBITS, 
  CAMI_TOPICS_LIST, 
  CamiTopicInfo, 
  calculateTopicMasteryWithDecay, 
  calculateGlobalSyllabusCoverage 
} from '../data/camiTopics';
import { QUESTIONS_BANK } from '../data/questionsBank';
import { CAMI_REAL_QUESTIONS } from '../data/camiRealQuestions';
import { AudioEngine } from '../utils/audio';
import { TacticalChestModal, TacticalReward } from './TacticalChestModal';
import confetti from 'canvas-confetti';
import { 
  Compass, 
  Award, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Zap, 
  ChevronRight, 
  Check, 
  X, 
  HelpCircle, 
  RefreshCw,
  Play,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Coins
} from 'lucide-react';

interface ModeCamiISPCProps {
  user: UserProfile;
  onUpdateUserStats: (
    xpGained: number, 
    meritsGained: number, 
    failedId?: string, 
    savedId?: string,
    answeredId?: string,
    isCorrect?: boolean
  ) => void;
  onUpdateTopicMastery: (topicId: string, mastery: number, correctAnswers: number, totalQuestions: number) => void;
  onOpenTacticalChest?: () => void;
}

export const ModeCamiISPC: React.FC<ModeCamiISPCProps> = ({
  user,
  onUpdateUserStats,
  onUpdateTopicMastery,
  onOpenTacticalChest
}) => {
  const [selectedAmbitFilter, setSelectedAmbitFilter] = useState<'all' | 'Àmbit A' | 'Àmbit B' | 'Àmbit C' | 'Àmbit D'>('all');
  const [activeMissionTopic, setActiveMissionTopic] = useState<CamiTopicInfo | null>(null);
  const [activeSubtopicId, setActiveSubtopicId] = useState<string | null>(null);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [isDailyExpressActive, setIsDailyExpressActive] = useState<boolean>(false);
  
  // Mission Runner States
  const [missionQuestions, setMissionQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [missionCorrectCount, setMissionCorrectCount] = useState(0);
  const [missionFinished, setMissionFinished] = useState(false);

  // Chest Modal State
  const [showChestModal, setShowChestModal] = useState(false);
  const [chestSource, setChestSource] = useState("Maestria Or aconseguida!");

  const topicMasteryMap = user.topicMastery || {};

  // Càlcul de Cobertura Global i KPIs
  const { overallPercentage, ambitStats, totalGoldCount, totalAlertCount } = useMemo(() => {
    return calculateGlobalSyllabusCoverage(topicMasteryMap);
  }, [topicMasteryMap]);

  // Comprovació de la Missió Exprés Diària
  const todayStr = new Date().toISOString().split('T')[0];
  const isDailyMissionCompletedToday = user.lastDailyMissionDate === todayStr;

  // Llista filtrada de temes
  const filteredTopics = useMemo(() => {
    if (selectedAmbitFilter === 'all') return CAMI_TOPICS_LIST;
    return CAMI_TOPICS_LIST.filter(t => t.ambit === selectedAmbitFilter);
  }, [selectedAmbitFilter]);

  // Iniciar Misió d'un Tema o Apartat
  const handleStartTopicMission = (topic: CamiTopicInfo, subtopicId?: string) => {
    AudioEngine.playClick();
    setActiveMissionTopic(topic);
    setActiveSubtopicId(subtopicId || null);
    setIsDailyExpressActive(false);

    // Filtrar estrictament del temari oficial real
    let candidates = CAMI_REAL_QUESTIONS.filter(q => {
      if (subtopicId) {
        return q.apartatId === subtopicId;
      }
      return q.temaId === topic.id;
    });

    if (candidates.length === 0) {
      candidates = CAMI_REAL_QUESTIONS.filter(q => q.temaId === topic.id);
    }

    const count = Math.min(candidates.length, 5);
    const shuffled = [...candidates].sort(() => 0.5 - Math.random()).slice(0, count);

    setMissionQuestions(shuffled);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setMissionCorrectCount(0);
    setMissionFinished(false);
  };

  // Iniciar Misió Exprés Diària (Àmbit D - Cultura i Actualitat)
  const handleStartDailyExpressMission = () => {
    AudioEngine.playClick();
    setIsDailyExpressActive(true);
    setActiveMissionTopic(null);
    setActiveSubtopicId(null);

    // Filtrar estrictament d'Àmbit D (Tema Únic)
    let candidates = CAMI_REAL_QUESTIONS.filter(q => q.temaId === 'tema_d1' || q.ambit === 'Àmbit D');
    if (candidates.length === 0) {
      candidates = CAMI_REAL_QUESTIONS;
    }

    const shuffled = [...candidates].sort(() => 0.5 - Math.random()).slice(0, 5);
    setMissionQuestions(shuffled);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setMissionCorrectCount(0);
    setMissionFinished(false);
  };

  // Enviar Resposta a la Pregunta de la Missió
  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted) return;

    const currentQ = missionQuestions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQ.resposta;

    setIsAnswerSubmitted(true);

    if (isCorrect) {
      AudioEngine.playCorrect();
      setMissionCorrectCount(prev => prev + 1);
      // Atorgar XP i Mèrits
      onUpdateUserStats(20, 5, undefined, undefined, currentQ.id, true);
    } else {
      AudioEngine.playWrong();
      // Guardar automàticament a preguntes fallades
      onUpdateUserStats(0, 0, currentQ.id, undefined, currentQ.id, false);
    }
  };

  // Avançar a la següent pregunta
  const handleNextQuestion = () => {
    AudioEngine.playClick();
    if (currentQuestionIndex + 1 < missionQuestions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      // Final de la Missió!
      handleCompleteMission();
    }
  };

  // Finalitzar Missió i Calcular Nou Domini
  const handleCompleteMission = () => {
    const totalQ = missionQuestions.length;
    const finalScore = missionCorrectCount;
    const scorePct = Math.round((finalScore / totalQ) * 100);

    setMissionFinished(true);

    if (isDailyExpressActive) {
      // Bonificació especial Missió Exprés (+50 Mèrits, +100 XP)
      AudioEngine.playStreakBonus();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
      onUpdateUserStats(100, 50);
      // Guardar data de missió completada
      user.lastDailyMissionDate = todayStr;
    } else if (activeMissionTopic) {
      const topicId = activeMissionTopic.id;
      const prevRecord = topicMasteryMap[topicId];
      const prevMastery = prevRecord ? prevRecord.mastery : 0;

      // Càlcul de nou mestratge ponderat
      const newMastery = Math.min(100, Math.max(prevMastery, scorePct));

      onUpdateTopicMastery(topicId, newMastery, finalScore, totalQ);

      // Si ha assolit Or (>= 80%) i abans no el tenia, o ha fet 100% de la missió
      if (scorePct >= 80) {
        AudioEngine.playGoldRank();
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });

        if (newMastery >= 80 && prevMastery < 80) {
          setTimeout(() => {
            setChestSource(`Tema ${activeMissionTopic.code} ascendit al Nivell Or!`);
            setShowChestModal(true);
          }, 800);
        }
      } else {
        AudioEngine.playVictory();
      }
    }
  };

  const handleClaimChestReward = (reward: TacticalReward) => {
    if (reward.type === 'merits') {
      onUpdateUserStats(0, reward.amount);
    } else if (reward.type === 'wildcard') {
      user.wildcardsCount = (user.wildcardsCount || 0) + reward.amount;
    } else if (reward.type === 'streak_shield') {
      user.streakShieldsCount = (user.streakShieldsCount || 0) + reward.amount;
    }
  };

  // RENDERING DEL MODAL DE MISSIÓ ACTIVA
  if (activeMissionTopic || isDailyExpressActive) {
    const currentQ = missionQuestions[currentQuestionIndex];
    const totalQ = missionQuestions.length;

    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-4">
        {/* Capçalera de Missió */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
              {isDailyExpressActive ? '⚡' : activeMissionTopic?.icon || '🎯'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {isDailyExpressActive ? 'Missió Exprés Diària' : activeMissionTopic?.code}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  Pregunta {currentQuestionIndex + 1} de {totalQ}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
                {isDailyExpressActive 
                  ? 'Àmbit D · Desafiament d’Actualitat & Cultura' 
                  : currentQ.apartat 
                    ? `${activeMissionTopic?.code} · ${currentQ.apartat}` 
                    : activeMissionTopic?.title}
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveMissionTopic(null);
              setIsDailyExpressActive(false);
              setActiveSubtopicId(null);
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 transition-colors cursor-pointer shrink-0"
            title="Sortir de la missió"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cos de la pregunta o Pantalla de Resultats */}
        {!missionFinished && currentQ ? (
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
            {/* Pregunta */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="text-sky-400 font-bold flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{currentQ.apartat || currentQ.seccio || 'Oficial CME'}</span>
                </span>
                <span className="text-amber-400 font-bold">Encerts: {missionCorrectCount}/{currentQuestionIndex}</span>
              </div>
              <p className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed">
                {currentQ.pregunta}
              </p>
            </div>

            {/* Opcions de resposta */}
            <div className="space-y-2.5">
              {currentQ.opcions.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.resposta;

                let btnStyle = "bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-200";

                if (isAnswerSubmitted) {
                  if (isCorrect) {
                    btnStyle = "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold";
                  } else if (isSelected && !isCorrect) {
                    btnStyle = "bg-red-500/20 border-red-500/60 text-red-300 font-bold";
                  } else {
                    btnStyle = "bg-slate-950/40 border-slate-800/40 text-slate-500";
                  }
                } else if (isSelected) {
                  btnStyle = "bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold";
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswerSubmitted}
                    onClick={() => setSelectedOption(idx)}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all text-xs sm:text-sm flex items-start gap-3 cursor-pointer ${btnStyle}`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-black flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 leading-snug">{opt}</span>
                    {isAnswerSubmitted && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    {isAnswerSubmitted && isSelected && !isCorrect && (
                      <X className="w-5 h-5 text-red-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explicació si ja s'ha contestat */}
            {isAnswerSubmitted && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <BookOpen className="w-4 h-4" />
                  <span>Raonament Jurídic / Oficial:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentQ.explicacio || currentQ.explanation || "D'acord amb la Guia d'Estudi oficial del Cos de Mossos d'Esquadra."}
                </p>
                {selectedOption !== currentQ.resposta && (
                  <div className="text-[11px] text-rose-400 font-semibold flex items-center gap-1 pt-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Pregunta afegida automàticament al teu Sac de Fallades & Errors Pendents!</span>
                  </div>
                )}
              </div>
            )}

            {/* Botó d'acció */}
            <div className="pt-2">
              {!isAnswerSubmitted ? (
                <button
                  type="button"
                  disabled={selectedOption === null}
                  onClick={handleSubmitAnswer}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  Confirmar Resposta
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-sky-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{currentQuestionIndex + 1 < totalQ ? 'Següent Pregunta' : 'Veure Resultats de la Missió'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* RESULTATS DE LA MISSIÓ */
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-scaleUp">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/10">
              {missionCorrectCount >= 4 ? '🥇' : missionCorrectCount >= 3 ? '🥈' : '🥉'}
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Missió Completada!
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {isDailyExpressActive 
                  ? 'Has superat el desafiament d’Actualitat diari amb bonificació!' 
                  : `Rendiment registrat per al ${activeMissionTopic?.code} - ${activeMissionTopic?.title}`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Encerts</div>
                <div className="text-xl font-black text-emerald-400 mt-0.5">{missionCorrectCount}/{totalQ}</div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Efectivitat</div>
                <div className="text-xl font-black text-sky-400 mt-0.5">
                  {Math.round((missionCorrectCount / totalQ) * 100)}%
                </div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Estat</div>
                <div className="text-xs font-black text-amber-300 mt-1.5 uppercase">
                  {missionCorrectCount >= 4 ? 'Or 🥇' : missionCorrectCount >= 3 ? 'Plata 🥈' : 'Bronze 🥉'}
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl max-w-md mx-auto text-xs text-emerald-300 font-medium">
              ✨ La corba de degradació s'ha restaurat al 100% per a aquest tema!
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <button
                type="button"
                onClick={() => {
                  if (activeMissionTopic) {
                    handleStartTopicMission(activeMissionTopic);
                  } else {
                    handleStartDailyExpressMission();
                  }
                }}
                className="py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase cursor-pointer transition-colors"
              >
                Repetir Missió
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMissionTopic(null);
                  setIsDailyExpressActive(false);
                }}
                className="py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs uppercase cursor-pointer shadow-lg shadow-amber-500/20 transition-all"
              >
                Tornar al Mapa de Temes
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // PANTALLA PRINCIPAL: MAPA DE TEMAS "CAMÍ A L'ISPC"
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* HEADER AMB PROGRÉS DE COBERTURA DEL TEMARI */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>Missions de Temari Oficial 2026</span>
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                4 Temes Oficials · 21 Apartats
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              CAMÍ A L'ISPC · MAPA DE TEMARI
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Domina tots els temes dels 4 Àmbits oficials per a l'accés a l'Escala Bàsica dels Mossos d'Esquadra. El teu domini es degrada amb el temps si no repasses: mantén els teus temes al <strong className="text-amber-400">Nivell Or</strong>!
            </p>
          </div>

          {/* KPI Widget: Progrés Global de Cobertura */}
          <div className="w-full lg:w-80 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Cobertura Temari</span>
              </span>
              <span className="text-lg font-black text-amber-400">{overallPercentage}%</span>
            </div>

            {/* Barra de progrés */}
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${overallPercentage}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-center pt-1 border-t border-slate-800/80">
              <div className="p-1.5 bg-slate-900/60 rounded-xl">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Temes en Or</div>
                <div className="text-sm font-black text-amber-400 mt-0.5">{totalGoldCount} / {CAMI_TOPICS_LIST.length}</div>
              </div>
              <div className="p-1.5 bg-slate-900/60 rounded-xl">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Alertes Degradació</div>
                <div className={`text-sm font-black mt-0.5 ${totalAlertCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                  {totalAlertCount} temes
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MISSIÓ EXPRÉS DIÀRIA BANNER (GAMIFICACIÓ RETENCIÓ) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-950/50 via-slate-900 to-slate-950 border border-purple-500/40 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-2xl shrink-0">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Repte Diari de Retenció
              </span>
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                <span>+50 Mèrits Bonificació</span>
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white mt-0.5">
              Missió Exprés d'Actualitat & Cultura (Àmbit D)
            </h3>
            <p className="text-xs text-slate-400">
              {isDailyMissionCompletedToday 
                ? "Ja has completat el repte d'avui! Torna demà per mantenir el teu hàbit." 
                : "Resol 5 preguntes ràpides d'actualitat per protegir el teu temari i sumar mèrits."}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isDailyMissionCompletedToday}
          onClick={handleStartDailyExpressMission}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
            isDailyMissionCompletedToday
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 active:scale-95'
          }`}
        >
          {isDailyMissionCompletedToday ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Completat Avui</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Jugar Missió Exprés</span>
            </>
          )}
        </button>
      </div>

      {/* FILTRES PER ÀMBITS OFICIALS */}
      <div className="flex items-center gap-2 overflow-x-auto pretty-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setSelectedAmbitFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
            selectedAmbitFilter === 'all'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Tots els Temes ({CAMI_TOPICS_LIST.length})
        </button>

        {CAMI_AMBITS.map(amb => {
          const isSelected = selectedAmbitFilter === amb.id;
          const stat = ambitStats[amb.id];
          return (
            <button
              key={amb.id}
              type="button"
              onClick={() => setSelectedAmbitFilter(amb.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 text-white border-2 border-amber-500 shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{amb.icon}</span>
              <span>{amb.id}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-400 font-black">
                {stat.averageMastery}%
              </span>
            </button>
          );
        })}
      </div>

      {/* GRAELLA DE TEMES AMB DEGRADACIÓ TEMPORAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTopics.map(topic => {
          const record = topicMasteryMap[topic.id];
          const { 
            currentMastery, 
            originalMastery, 
            isDegraded, 
            decayAmount, 
            isCriticalAlert, 
            tier, 
            statusText,
            daysInactive 
          } = calculateTopicMasteryWithDecay(record);

          // Format de card segons el nivell i estat
          let cardBorder = "border-slate-800/80 hover:border-slate-700";
          let badgeBg = "bg-slate-800 text-slate-400";

          if (isCriticalAlert) {
            cardBorder = "border-red-500/60 bg-red-950/10 shadow-lg shadow-red-500/10";
            badgeBg = "bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse";
          } else if (tier === 'gold') {
            cardBorder = "border-amber-500/50 bg-amber-950/10 shadow-lg shadow-amber-500/10";
            badgeBg = "bg-amber-500/20 text-amber-300 border border-amber-500/40";
          } else if (tier === 'silver') {
            cardBorder = "border-sky-500/40 bg-sky-950/10";
            badgeBg = "bg-sky-500/20 text-sky-300 border border-sky-500/30";
          } else if (tier === 'bronze') {
            cardBorder = "border-emerald-500/30 bg-emerald-950/10";
            badgeBg = "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
          }

          return (
            <div
              key={topic.id}
              className={`relative bg-slate-900/90 border rounded-3xl p-5 flex flex-col justify-between transition-all hover:scale-[1.01] ${cardBorder}`}
            >
              {/* Badge d'Àmbit & Estat de Risc */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {topic.code}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {topic.ambit}
                    </span>
                  </div>

                  {/* Nivell o Alerta */}
                  <div className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${badgeBg}`}>
                    {isCriticalAlert && <AlertTriangle className="w-3 h-3 text-red-400" />}
                    <span>{statusText}</span>
                  </div>
                </div>

                {/* Títol del Tema */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{topic.icon}</span>
                    <h3 className="text-sm font-black text-white leading-snug">
                      {topic.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {topic.subtitle}
                  </p>
                </div>

                {/* BARRA DE DOMINI I AVÍS DE DEGRADACIÓ */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300">Domini del Tema:</span>
                    <div className="flex items-center gap-1 font-black">
                      <span className={isCriticalAlert ? 'text-red-400' : 'text-amber-400'}>
                        {currentMastery}%
                      </span>
                      {isDegraded && (
                        <span className="text-[10px] text-red-400 line-through">
                          ({originalMastery}%)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCriticalAlert
                          ? 'bg-red-500'
                          : tier === 'gold'
                            ? 'bg-amber-400'
                            : tier === 'silver'
                              ? 'bg-sky-400'
                              : currentMastery > 0
                                ? 'bg-emerald-400'
                                : 'bg-slate-700'
                      }`}
                      style={{ width: `${currentMastery}%` }}
                    />
                  </div>

                  {/* Notificació de la Curva de l'Oblit */}
                  {isDegraded && (
                    <div className="text-[10px] text-red-400/90 font-medium flex items-center gap-1 pt-0.5">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{daysInactive} dies sense repàs (-{decayAmount}% pèrdua)</span>
                    </div>
                  )}
                </div>

                {/* Acordió d'Apartats Oficials */}
                {topic.subtopics && topic.subtopics.length > 0 && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setExpandedTopicId(expandedTopicId === topic.id ? null : topic.id)}
                      className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white py-1.5 px-3 rounded-xl bg-slate-950/70 border border-slate-800/80 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span>{topic.subtopics.length} Apartats Oficials</span>
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedTopicId === topic.id ? 'rotate-90 text-amber-400' : ''}`} />
                    </button>

                    {expandedTopicId === topic.id && (
                      <div className="mt-2 space-y-1.5 max-h-52 overflow-y-auto pretty-scrollbar pr-1 animate-fadeIn">
                        {topic.subtopics.map(sub => (
                          <div 
                            key={sub.id}
                            className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2 hover:border-amber-500/40 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-bold text-slate-200 truncate">
                                {sub.num}. {sub.title}
                              </div>
                              {sub.description && (
                                <div className="text-[10px] text-slate-400 line-clamp-1">
                                  {sub.description}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStartTopicMission(topic, sub.id)}
                              className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-black shrink-0 flex items-center gap-1 border border-amber-500/30 cursor-pointer active:scale-95 transition-all"
                              title={`Entrenar l'apartat ${sub.num}`}
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>Entrenar</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botó de jugar Missió per a aquest tema */}
              <div className="pt-4 mt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handleStartTopicMission(topic)}
                  className={`w-full py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                    isCriticalAlert
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                      : tier === 'gold'
                        ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{currentMastery === 0 ? 'Iniciar Missió' : isCriticalAlert ? 'Recuperar Domini Urgent' : 'Repassar Tema'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* COFRE TÀCTIC MODAL QUAN ES DESBLOQUEJA OR */}
      <TacticalChestModal
        isOpen={showChestModal}
        onClose={() => setShowChestModal(false)}
        onClaim={handleClaimChestReward}
        sourceText={chestSource}
      />
    </div>
  );
};
