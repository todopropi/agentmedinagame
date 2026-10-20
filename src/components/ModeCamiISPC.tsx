import React, { useState, useMemo } from 'react';
import { UserProfile, Question } from '../types';
import { 
  CAMI_AMBITS, 
  CAMI_TOPICS_LIST, 
  CamiTopicInfo, 
  calculateTopicMasteryWithDecay, 
  calculateGlobalSyllabusCoverage 
} from '../data/camiTopics';
import { 
  QUESTIONS_BANK, 
  getQuestionsForTopicOrSubtopic, 
  getQuestionCountForTopicOrSubtopic,
  shuffleQuestionOptions
} from '../data/questionsBank';
import { AudioEngine } from '../utils/audio';
import { TacticalChestModal, TacticalReward } from './TacticalChestModal';
import confetti from 'canvas-confetti';
import { 
  Compass, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  X, 
  Play, 
  BookOpen, 
  ArrowRight, 
  ShieldAlert, 
  Coins,
  Eye,
  EyeOff,
  Check,
  Target,
  Sparkles,
  Filter,
  Layers,
  Flame
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
  const [touchedFilter, setTouchedFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [activeMissionTopic, setActiveMissionTopic] = useState<CamiTopicInfo | null>(null);
  const [isDailyExpressActive, setIsDailyExpressActive] = useState<boolean>(false);
  const [sessionAnsweredIds, setSessionAnsweredIds] = useState<Set<string>>(new Set());

  // Autorització d'administrador per visualitzar el recompte de preguntes
  const isAdmin = Boolean(
    user.role === 'admin' || 
    user.email?.toLowerCase().trim() === 'opossscar@gmail.com' || 
    (user as any).isAdmin
  );

  const [adminAuthShowQuestionsCount, setAdminAuthShowQuestionsCount] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('agent_medina_admin_show_q_count');
      if (stored !== null) return stored === 'true';
      return false;
    } catch {
      return false;
    }
  });

  const toggleAdminQuestionCountAuth = () => {
    setAdminAuthShowQuestionsCount(prev => {
      const next = !prev;
      try {
        localStorage.setItem('agent_medina_admin_show_q_count', String(next));
      } catch {}
      return next;
    });
  };

  // Recompte de preguntes visible si l'usuari és admin o si l'admin ho ha autoritzat
  const canShowQuestionCounts = isAdmin || adminAuthShowQuestionsCount;
  
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

  // Conjunt reactiu de totes les preguntes tocades (usuari + sessió viva)
  const answeredSet = useMemo(() => {
    const set = new Set(user.answeredQuestionIds || []);
    sessionAnsweredIds.forEach(id => set.add(id));
    return set;
  }, [user.answeredQuestionIds, sessionAnsweredIds]);

  // Càlcul exhaustiu tema per tema de Preguntes Tocades vs Sense Tocar
  const topicStatsMap = useMemo(() => {
    const map: Record<string, {
      total: number;
      touched: number;
      untouched: number;
      touchedPct: number;
      questions: Question[];
    }> = {};

    CAMI_TOPICS_LIST.forEach(topic => {
      let questions = getQuestionsForTopicOrSubtopic(topic.id);
      if (questions.length === 0) {
        questions = QUESTIONS_BANK.filter(q => q.ambit === topic.ambit);
      }
      const total = questions.length;
      const touched = questions.filter(q => answeredSet.has(q.id)).length;
      const untouched = Math.max(0, total - touched);
      const touchedPct = total > 0 ? Math.round((touched / total) * 100) : 0;

      map[topic.id] = {
        total,
        touched,
        untouched,
        touchedPct,
        questions
      };
    });

    return map;
  }, [answeredSet]);

  // Càlcul Global de Preguntes Tocades a tot el Temari Oficial
  const globalQuestionStats = useMemo(() => {
    const allUnique = new Map<string, Question>();
    CAMI_TOPICS_LIST.forEach(topic => {
      const stat = topicStatsMap[topic.id];
      if (stat) {
        stat.questions.forEach(q => allUnique.set(q.id, q));
      }
    });

    if (allUnique.size === 0) {
      QUESTIONS_BANK.forEach(q => allUnique.set(q.id, q));
    }

    const allQuestions = Array.from(allUnique.values());
    const total = allQuestions.length;
    const touched = allQuestions.filter(q => answeredSet.has(q.id)).length;
    const untouched = Math.max(0, total - touched);
    const touchedPct = total > 0 ? Math.round((touched / total) * 100) : 0;

    let pendingTopicsCount = 0;
    let fullyTouchedTopicsCount = 0;

    CAMI_TOPICS_LIST.forEach(t => {
      const s = topicStatsMap[t.id];
      if (s) {
        if (s.untouched > 0) pendingTopicsCount++;
        else if (s.total > 0 && s.untouched === 0) fullyTouchedTopicsCount++;
      }
    });

    return {
      total,
      touched,
      untouched,
      touchedPct,
      pendingTopicsCount,
      fullyTouchedTopicsCount
    };
  }, [topicStatsMap, answeredSet]);

  // Càlcul de Cobertura Global i KPIs
  const { overallPercentage, ambitStats, totalGoldCount, totalAlertCount } = useMemo(() => {
    return calculateGlobalSyllabusCoverage(topicMasteryMap);
  }, [topicMasteryMap]);

  // Comprovació de la Missió Exprés Diària
  const todayStr = new Date().toISOString().split('T')[0];
  const isDailyMissionCompletedToday = user.lastDailyMissionDate === todayStr;

  // Llista filtrada de temes per Àmbit oficial i estat de preguntes tocades
  const filteredTopics = useMemo(() => {
    let list = CAMI_TOPICS_LIST;
    if (selectedAmbitFilter !== 'all') {
      list = list.filter(t => t.ambit === selectedAmbitFilter);
    }
    if (touchedFilter === 'pending') {
      list = list.filter(t => (topicStatsMap[t.id]?.untouched || 0) > 0);
    } else if (touchedFilter === 'completed') {
      list = list.filter(t => (topicStatsMap[t.id]?.untouched || 0) === 0 && (topicStatsMap[t.id]?.total || 0) > 0);
    }
    return list;
  }, [selectedAmbitFilter, touchedFilter, topicStatsMap]);

  // Iniciar Misió d'un Tema Oficial prioritzant preguntes SENSE TOCAR
  const handleStartTopicMission = (topic: CamiTopicInfo) => {
    AudioEngine.playClick();
    setActiveMissionTopic(topic);
    setIsDailyExpressActive(false);

    let candidates = getQuestionsForTopicOrSubtopic(topic.id);
    if (candidates.length === 0) {
      candidates = QUESTIONS_BANK.filter(q => q.ambit === topic.ambit);
    }
    if (candidates.length === 0) {
      candidates = QUESTIONS_BANK;
    }

    // Separar estrictament preguntes pendents sense tocar de les ja practicades
    const untouched = candidates.filter(q => !answeredSet.has(q.id));
    const touched = candidates.filter(q => answeredSet.has(q.id));

    let selectedList: Question[] = [];
    // Prioritzar PREGUNTES SENSE TOCAR perquè l'opositor sempre avanci el seu progrés
    if (untouched.length > 0) {
      const shuffledUntouched = [...untouched].sort(() => 0.5 - Math.random());
      selectedList.push(...shuffledUntouched.slice(0, 5));
    }

    // Si queden places per completar el bloc de 5 preguntes, omplir amb preguntes ja tocades (repàs)
    if (selectedList.length < 5 && touched.length > 0) {
      const needed = 5 - selectedList.length;
      const shuffledTouched = [...touched].sort(() => 0.5 - Math.random());
      selectedList.push(...shuffledTouched.slice(0, needed));
    }

    if (selectedList.length === 0) {
      selectedList = [...candidates].sort(() => 0.5 - Math.random()).slice(0, 5);
    }

    // Barrejador uniforme Fisher-Yates per a cada pregunta:
    // Garanteix que la resposta correcta tingui un 25% exacte a cada lletra (A, B, C, D)
    // eliminant qualsevol biaix posicional o visual de la lletra B
    const randomizedTopicQuestions = selectedList.map(q => shuffleQuestionOptions(q));

    setMissionQuestions(randomizedTopicQuestions);
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

    let candidates = getQuestionsForTopicOrSubtopic('tema_d1');
    if (candidates.length === 0) {
      candidates = QUESTIONS_BANK.filter(q => q.ambit === 'Àmbit D' || q.ambit === 'Actualitat');
    }

    const untouched = candidates.filter(q => !answeredSet.has(q.id));
    const touched = candidates.filter(q => answeredSet.has(q.id));

    let selectedList: Question[] = [];
    if (untouched.length > 0) {
      selectedList.push(...[...untouched].sort(() => 0.5 - Math.random()).slice(0, 5));
    }
    if (selectedList.length < 5 && touched.length > 0) {
      const needed = 5 - selectedList.length;
      selectedList.push(...[...touched].sort(() => 0.5 - Math.random()).slice(0, needed));
    }
    if (selectedList.length === 0) {
      selectedList = [...candidates].sort(() => 0.5 - Math.random()).slice(0, 5);
    }

    // Barrejador uniforme Fisher-Yates per a cada pregunta de la missió exprés
    const randomizedExpressQuestions = selectedList.map(q => shuffleQuestionOptions(q));

    setMissionQuestions(randomizedExpressQuestions);
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
    // Registrar immediatament la pregunta com a tocada a la sessió viva
    setSessionAnsweredIds(prev => new Set(prev).add(currentQ.id));

    if (isCorrect) {
      AudioEngine.playCorrect();
      setMissionCorrectCount(prev => prev + 1);
      onUpdateUserStats(20, 5, undefined, undefined, currentQ.id, true);
    } else {
      AudioEngine.playWrong();
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
      handleCompleteMission();
    }
  };

  // Finalitzar Missió i Calcular Nou Domini del Tema
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
      user.lastDailyMissionDate = todayStr;

      const dStat = topicStatsMap['tema_d1'];
      const coveragePct = dStat ? dStat.touchedPct : 50;
      const combinedMastery = Math.min(100, Math.round((coveragePct * 0.4) + (scorePct * 0.6)));
      const prevD = topicMasteryMap['tema_d1']?.mastery || 0;
      const finalDMastery = Math.min(100, Math.max(prevD, combinedMastery, scorePct));

      onUpdateTopicMastery('tema_d1', finalDMastery, finalScore, totalQ);
    } else if (activeMissionTopic) {
      const topic = activeMissionTopic;
      const topicId = topic.id;
      const prevRecord = topicMasteryMap[topicId];
      const prevMastery = prevRecord ? prevRecord.mastery : 0;

      const tStat = topicStatsMap[topicId];
      // Formula de mestratge que combina encerts i cobertura de preguntes tocades
      const coveragePct = tStat ? tStat.touchedPct : 0;
      const combinedMastery = Math.min(100, Math.round((coveragePct * 0.4) + (scorePct * 0.6)));
      const newMastery = Math.min(100, Math.max(prevMastery, combinedMastery, scorePct));

      onUpdateTopicMastery(topicId, newMastery, finalScore, totalQ);

      if (scorePct >= 80 || newMastery >= 80) {
        AudioEngine.playGoldRank();
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
        if (newMastery >= 80 && prevMastery < 80) {
          setTimeout(() => {
            setChestSource(`Tema ${topic.code} ascendit al Nivell Or!`);
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
    const activeTopicStat = activeMissionTopic ? topicStatsMap[activeMissionTopic.id] : topicStatsMap['tema_d1'];
    const isQuestionUntouched = Boolean(currentQ && !answeredSet.has(currentQ.id));

    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-4">
        {/* Capçalera de Missió */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
              {isDailyExpressActive ? '⚡' : activeMissionTopic?.icon || '🎯'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {isDailyExpressActive ? 'Missió Exprés Diària' : activeMissionTopic?.code}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  Pregunta {currentQuestionIndex + 1} de {totalQ}
                </span>
                {isQuestionUntouched ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Nova · Sense tocar</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Ja tocada · Repàs</span>
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight mt-1">
                {isDailyExpressActive 
                  ? 'Àmbit D · Desafiament d’Actualitat & Cultura' 
                  : activeMissionTopic?.title}
              </h2>
              {activeTopicStat && (
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                  <Target className="w-3.5 h-3.5 text-sky-400" />
                  <span>Progrés del tema: <strong className="text-sky-300">{activeTopicStat.touched} de {activeTopicStat.total} preguntes tocades</strong> ({activeTopicStat.touchedPct}%)</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setActiveMissionTopic(null);
              setIsDailyExpressActive(false);
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
            {/* Pregunta Oficial del Banc */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="text-sky-400 font-bold flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{currentQ.seccio || activeMissionTopic?.title || 'Oficial CME'}</span>
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
                    className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all text-xs sm:text-sm flex items-center gap-3.5 cursor-pointer min-h-[56px] sm:min-h-[62px] active:scale-[0.99] ${btnStyle}`}
                  >
                    <span className="w-7 h-7 rounded-xl bg-slate-800 text-slate-300 text-xs font-black flex items-center justify-center shrink-0 border border-slate-700/80 shadow-inner">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 leading-snug font-medium">{opt}</span>
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

            {/* Explicació DIRECTA de la base de dades (sense invencions) */}
            {isAnswerSubmitted && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-bold text-amber-400">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>Justificació Oficial del Banc de Dades:</span>
                  </div>
                  {currentQ.guiaPagina && (
                    <span className="text-[10px] text-sky-300 bg-sky-950/70 border border-sky-800/80 px-2 py-0.5 rounded-full font-medium">
                      {currentQ.guiaPagina}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium whitespace-pre-line">
                  {currentQ.explicacio || currentQ.explanation || "D'acord amb la Guia d'Estudi oficial del Cos de Mossos d'Esquadra."}
                </p>

                {currentQ.clauTribunal && (
                  <div className="pt-1.5 border-t border-slate-800/80 text-[11px] text-emerald-300 flex items-center gap-1.5">
                    <span className="font-bold">🔑 Criteri Tribunal:</span>
                    <span>{currentQ.clauTribunal}</span>
                  </div>
                )}

                {isQuestionUntouched && (
                  <div className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>🎯 +1 Pregunta registrada com a tocada! El teu progrés a Camí a l'ISPC ha avançat.</span>
                  </div>
                )}

                {selectedOption !== currentQ.resposta && (
                  <div className="text-[11px] text-rose-400 font-semibold flex items-center gap-1 pt-1 border-t border-slate-800/80">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>Pregunta registrada al teu Sac de Fallades per a repàs de reforç.</span>
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
                  <span>{currentQuestionIndex + 1 < totalQ ? 'Següent Pregunta' : 'Veure Resultats del Tema'}</span>
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Encerts</div>
                <div className="text-xl font-black text-emerald-400 mt-0.5">{missionCorrectCount}/{totalQ}</div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Efectivitat</div>
                <div className="text-xl font-black text-sky-400 mt-0.5">
                  {totalQ > 0 ? Math.round((missionCorrectCount / totalQ) * 100) : 0}%
                </div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <div className="text-[10px] font-bold text-sky-400 uppercase flex items-center gap-1 justify-center">
                  <Target className="w-3 h-3" />
                  <span>Tocades</span>
                </div>
                <div className="text-xl font-black text-sky-300 mt-0.5">
                  {activeTopicStat?.touched || 0}/{activeTopicStat?.total || 0}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">({activeTopicStat?.touchedPct || 0}%)</div>
              </div>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <div className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1 justify-center">
                  <Clock className="w-3 h-3" />
                  <span>Sense tocar</span>
                </div>
                <div className="text-xl font-black text-amber-300 mt-0.5">
                  {activeTopicStat?.untouched || 0}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">pendents</div>
              </div>
            </div>

            {/* Barra de progrés de preguntes tocades del tema */}
            {activeTopicStat && (
              <div className="max-w-xl mx-auto p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-sky-400" />
                    <span>Progrés de preguntes tocades d'aquest tema:</span>
                  </span>
                  <span className="font-black text-sky-400">{activeTopicStat.touchedPct}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-700"
                    style={{ width: `${activeTopicStat.touchedPct}%` }}
                  />
                </div>
                <div className="text-left text-[11px] text-slate-400 pt-1">
                  {activeTopicStat.untouched > 0 
                    ? `Te'n queden ${activeTopicStat.untouched} sense tocar per completar el 100% del banc d'aquest tema.`
                    : '🎉 Enhorabona! Has tocat totes les preguntes disponibles d\'aquest tema oficial.'}
                </div>
              </div>
            )}

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
                Continuar Practicant
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

  // PANTALLA PRINCIPAL: MAPA DIRECTE DE TEMES OFICIALS
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* HEADER AMB PROGRÉS DE COBERTURA DEL TEMARI */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>Missions de Temari Oficial 2026</span>
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                {CAMI_TOPICS_LIST.length} Temes Oficials
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={toggleAdminQuestionCountAuth}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    adminAuthShowQuestionsCount
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                  title="Configuració Admin: Controla si els opositors poden visualitzar el recompte de preguntes"
                >
                  {adminAuthShowQuestionsCount ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{adminAuthShowQuestionsCount ? 'Recompte Preguntes: Autoritzat' : 'Recompte Preguntes: Només Admin'}</span>
                </button>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              CAMÍ A L'ISPC · MAPA DE TEMARI OFICIAL
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Tots els 21 temes oficials de la convocatòria connectats directament amb el teu banc de preguntes oficial. Consulta les <strong className="text-sky-400">preguntes tocades vs sense tocar</strong>, mantén el teu domini en <strong className="text-amber-400">Nivell Or</strong> i supera la corba d'oblit.
            </p>
          </div>

          {/* KPI DASHBOARD: PREGUNTES TOCADES & MESTRATGE */}
          <div className="w-full lg:w-96 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3.5 shrink-0 shadow-xl">
            {/* 1. Progrés Principal: Preguntes Tocades vs Sense Tocar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-sky-400" />
                  <span>Preguntes Tocades</span>
                </span>
                <span className="text-base font-black text-sky-400">
                  {globalQuestionStats.touched} / {globalQuestionStats.total} <span className="text-xs text-slate-400 font-bold">({globalQuestionStats.touchedPct}%)</span>
                </span>
              </div>

              {/* Barra de progrés de preguntes tocades */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${globalQuestionStats.touchedPct}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="p-1.5 bg-slate-900/80 border border-slate-800/60 rounded-xl">
                  <div className="text-[10px] text-sky-400 font-bold uppercase flex items-center gap-1 justify-center">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Tocades</span>
                  </div>
                  <div className="text-sm font-black text-sky-300 mt-0.5">{globalQuestionStats.touched}</div>
                </div>
                <div className="p-1.5 bg-slate-900/80 border border-slate-800/60 rounded-xl">
                  <div className="text-[10px] text-amber-400 font-bold uppercase flex items-center gap-1 justify-center">
                    <Clock className="w-3 h-3" />
                    <span>Sense tocar</span>
                  </div>
                  <div className="text-sm font-black text-amber-300 mt-0.5">{globalQuestionStats.untouched}</div>
                </div>
              </div>
            </div>

            {/* 2. Cobertura de Mestratge Oficial & Alertes */}
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-bold flex items-center gap-1.5 uppercase">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mestratge Oficial:</span>
                </span>
                <span className="text-xs font-black text-amber-400">{overallPercentage}%</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-1 bg-slate-900/60 rounded-lg">
                  <span className="text-[10px] text-slate-400">Temes en Or: </span>
                  <span className="text-xs font-black text-amber-400">{totalGoldCount}/21</span>
                </div>
                <div className="p-1 bg-slate-900/60 rounded-lg">
                  <span className="text-[10px] text-slate-400">En Risc: </span>
                  <span className={`text-xs font-black ${totalAlertCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                    {totalAlertCount}
                  </span>
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

      {/* BARRA DE FILTRES I ESTAT DE PREGUNTES TOCADES */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Filtres per Àmbits Oficials */}
          <div className="flex items-center gap-2 overflow-x-auto pretty-scrollbar pb-1 flex-1">
            <button
              type="button"
              onClick={() => setSelectedAmbitFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedAmbitFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Tots els Àmbits ({CAMI_TOPICS_LIST.length})
            </button>

            {CAMI_AMBITS.map(amb => {
              const isSelected = selectedAmbitFilter === amb.id;
              const topicsInAmbit = CAMI_TOPICS_LIST.filter(t => t.ambit === amb.id);
              const touchedInAmbit = topicsInAmbit.reduce((acc, t) => acc + (topicStatsMap[t.id]?.touched || 0), 0);
              const totalInAmbit = topicsInAmbit.reduce((acc, t) => acc + (topicStatsMap[t.id]?.total || 0), 0);

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
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950 text-sky-400 font-bold border border-slate-800">
                    {touchedInAmbit}/{totalInAmbit}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* TARGETES NETES I DIRECTES DELS 21 TEMES OFICIALS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTopics.map(topic => {
          const topicRecord = topicMasteryMap[topic.id];
          const { 
            currentMastery, 
            originalMastery, 
            isDegraded, 
            decayAmount, 
            isCriticalAlert, 
            tier, 
            statusText,
            daysInactive 
          } = calculateTopicMasteryWithDecay(topicRecord);

          const stat = topicStatsMap[topic.id] || { total: 0, touched: 0, untouched: 0, touchedPct: 0 };

          // Estils de card segons el rang
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
              <div className="space-y-3.5">
                {/* Capçalera del tema */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {topic.code}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {topic.ambit}
                    </span>
                  </div>

                  <div className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${badgeBg}`}>
                    {isCriticalAlert && <AlertTriangle className="w-3 h-3 text-red-400" />}
                    <span>{statusText}</span>
                  </div>
                </div>

                {/* Títol i descripció del tema */}
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

                {/* BLOC PRINCIPAL: PREGUNTES TOCADES VS SENSE TOCAR */}
                <div className="p-3 bg-slate-950/80 border border-slate-800/90 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <Target className="w-3.5 h-3.5 text-sky-400" />
                      <span>Preguntes Tocades:</span>
                    </div>
                    <div className="flex items-center gap-1 font-black text-sky-400">
                      <span>{stat.touched} / {stat.total}</span>
                      <span className="text-[11px] text-slate-400">({stat.touchedPct}%)</span>
                    </div>
                  </div>

                  {/* Barra de progrés de preguntes tocades */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${stat.touchedPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    {stat.untouched === 0 ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>100% Tocades</span>
                      </span>
                    ) : (
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{stat.untouched} sense tocar</span>
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium">
                      {stat.touched} practicades
                    </span>
                  </div>
                </div>

                {/* BARRA DE DOMINI I REFORÇ DEL TEMA */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-300">
                      <span>Domini Oficial:</span>
                    </div>

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

                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
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

                  {isDegraded && (
                    <div className="text-[10px] text-red-400/90 font-medium flex items-center gap-1 pt-0.5">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{daysInactive} dies sense repassar (-{decayAmount}% pèrdua)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botó per entrenar el tema oficial prioritzant preguntes sense tocar */}
              <div className="pt-4 mt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handleStartTopicMission(topic)}
                  className={`w-full py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                    isCriticalAlert
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                      : stat.untouched > 0
                        ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md shadow-sky-500/20'
                        : tier === 'gold'
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {stat.untouched > 0
                      ? `Practicar Sense Tocar (${stat.untouched} pendents)`
                      : isCriticalAlert
                        ? 'Recuperar Domini Urgent'
                        : 'Repassar Tema'}
                  </span>
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
