import React, { useState, useEffect } from 'react';
import { PLTema, PLPregunta, PLMunicipi } from '../../types/policiaLocal';
import { UserProfile } from '../../types';
import { 
  recordPLUserAnswer, 
  getGlobalAnsweredQuestionIds,
  saveGlobalAnsweredQuestionId 
} from '../../services/policiaLocalService';
import { AudioEngine } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  RotateCcw,
  AlertCircle
} from 'lucide-react';

interface PLTopicQuizModalProps {
  topic: PLTema;
  municipi?: PLMunicipi | null;
  questions: PLPregunta[];
  user: UserProfile;
  onClose: () => void;
  onQuestionAnswered?: (qId: string, isCorrect: boolean) => void;
}

export const PLTopicQuizModal: React.FC<PLTopicQuizModalProps> = ({
  topic,
  municipi,
  questions,
  user,
  onClose,
  onQuestionAnswered
}) => {
  const [activeQueue, setActiveQueue] = useState<PLPregunta[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [scoreCount, setScoreCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Inicialitzar cua de preguntes amb regla de NO REPETIR fins a acabar-les totes
  useEffect(() => {
    if (!questions || questions.length === 0) return;

    const globalAnswered = getGlobalAnsweredQuestionIds();
    
    // 1. Separar preguntes pendents de les ja resoltes
    const pendingQuestions = questions.filter(q => !globalAnswered.has(q.id));
    const alreadyAnswered = questions.filter(q => globalAnswered.has(q.id));

    // Si queden pendents, prioritzem les pendents; si ja s'han fet totes, barregem totes de nou
    const queueToShuffle = pendingQuestions.length > 0 ? pendingQuestions : alreadyAnswered;
    
    // Barallar preguntes
    const shuffled = [...queueToShuffle].sort(() => Math.random() - 0.5);
    setActiveQueue(shuffled);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsFinished(false);
  }, [questions]);

  const currentQ = activeQueue[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    AudioEngine.playClick();
  };

  const handleVerify = async () => {
    if (selectedOption === null || !currentQ || isAnswered) return;

    const correct = selectedOption === currentQ.correct_answer;
    setIsAnswered(true);
    setIsCorrect(correct);
    setCompletedCount(prev => prev + 1);

    if (correct) {
      setScoreCount(prev => prev + 1);
      AudioEngine.playSuccess();
      try {
        confetti({
          particleCount: 25,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#0284c7', '#38bdf8', '#fbbf24']
        });
      } catch {}
    } else {
      AudioEngine.playError();
    }

    // Guardar a Supabase i memòria cau local (comptarà globalment per a tots els temes)
    try {
      await recordPLUserAnswer(
        user.uid,
        currentQ.id,
        topic.id,
        municipi ? municipi.id : null,
        correct
      );
    } catch (e) {
      console.warn('Error saving answer:', e);
    }

    if (onQuestionAnswered) {
      onQuestionAnswered(currentQ.id, correct);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < activeQueue.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      AudioEngine.playFanfare();
    }
  };

  const handleRestart = () => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setActiveQueue(shuffled);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsFinished(false);
    setCompletedCount(0);
    setScoreCount(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-sky-500/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        
        {/* HEADER DEL QUIZ */}
        <div className="px-5 py-4 bg-gradient-to-r from-sky-950/80 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {municipi ? municipi.name : (topic.scope === 'comu' ? 'Temari Comú' : 'Cultura General')}
                </span>
                <span className="text-[11px] font-mono text-slate-400">{topic.code}</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1 mt-0.5">
                {topic.title}
              </h3>
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

        {/* CONTINGUT: SENSE PREGUNTES DISPONIBLES */}
        {questions.length === 0 ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Pendent d'afegir preguntes</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                Aquest tema encara no té preguntes incorporades al banc. L'administrador pot afegir-ne des del panell d'administració o mitjançant importació massiva JSON.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Tancar finestra
            </button>
          </div>
        ) : isFinished ? (
          /* RESULTAT FINAL DEL QUIZ */
          <div className="p-6 sm:p-8 text-center space-y-5">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-sky-500/20 to-amber-500/20 border border-sky-400/40 text-sky-400 flex items-center justify-center shadow-lg">
              <Sparkles className="w-10 h-10 text-amber-400 animate-pulse" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-400 block">
                Sessió Completada
              </span>
              <h3 className="text-2xl font-black text-white mt-1">
                Excel·lent entrenament!
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Has respost totes les preguntes d'aquesta ronda per al tema: <strong className="text-slate-200">{topic.code}</strong>.
              </p>
            </div>

            {/* MARCADOR */}
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
              <div className="p-3.5 bg-slate-950/80 border border-emerald-500/30 rounded-2xl">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Encerts</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{scoreCount}</span>
              </div>
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Fet</span>
                <span className="text-2xl font-black text-white font-mono">{completedCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRestart}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Tornar a entrenar</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
              >
                Finalitzar
              </button>
            </div>
          </div>
        ) : (
          /* PREGUNTA ACTIVA */
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
            {/* BARRA DE PROGRÉS */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1.5 text-sky-400 font-bold">
                <span>Pregunta</span>
                <span className="text-white text-sm">{currentIndex + 1}</span>
                <span>/</span>
                <span>{activeQueue.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">{scoreCount} correctes</span>
              </div>
            </div>

            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-sky-500 to-amber-500 h-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / activeQueue.length) * 100}%` }}
              />
            </div>

            {/* ENUNCIAT DE LA PREGUNTA */}
            <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
              <p className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed">
                {currentQ.question}
              </p>
            </div>

            {/* OPCIONS DE RESPOSTA */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrectAnswer = isAnswered && idx === currentQ.correct_answer;
                const isWrongSelection = isAnswered && isSelected && !isCorrect;

                let btnStyles = 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700';
                
                if (isSelected && !isAnswered) {
                  btnStyles = 'bg-sky-500/20 border-sky-400 text-white shadow-md shadow-sky-500/10';
                } else if (isCorrectAnswer) {
                  btnStyles = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-medium';
                } else if (isWrongSelection) {
                  btnStyles = 'bg-rose-500/20 border-rose-500 text-rose-200 font-medium';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswered}
                    className={`w-full p-3 sm:p-3.5 rounded-2xl border text-left text-xs sm:text-sm flex items-start gap-3 transition-all cursor-pointer ${btnStyles}`}
                  >
                    <span className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected && !isAnswered 
                        ? 'bg-sky-500 text-slate-950' 
                        : isCorrectAnswer 
                          ? 'bg-emerald-500 text-slate-950' 
                          : isWrongSelection 
                            ? 'bg-rose-500 text-white' 
                            : 'bg-slate-800 text-slate-400'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 leading-snug">{opt}</span>
                    {isCorrectAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                    {isWrongSelection && <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>

            {/* EXPLICACIÓ DIDÀCTICA */}
            {isAnswered && (
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed animate-in fade-in slide-in-from-bottom-2 ${
                isCorrect 
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200' 
                  : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Molt bé! Resposta correcta</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Resposta incorrecta</span>
                    </>
                  )}
                </div>
                {currentQ.explanation ? (
                  <p className="text-slate-300 mt-1 pl-6">{currentQ.explanation}</p>
                ) : (
                  <p className="text-slate-400 mt-1 pl-6 italic">Aquesta pregunta s'ha registrat al teu progrés.</p>
                )}
              </div>
            )}

            {/* BOTÓ DE VALIDAR / SEGÜENT */}
            <div className="pt-2 flex justify-end">
              {!isAnswered ? (
                <button
                  type="button"
                  disabled={selectedOption === null}
                  onClick={handleVerify}
                  className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                    selectedOption !== null 
                      ? 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 shadow-md shadow-sky-500/20' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>Validar Resposta</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{currentIndex + 1 < activeQueue.length ? 'Següent Pregunta' : 'Veure Resultats'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
