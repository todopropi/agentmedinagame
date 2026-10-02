import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Question, QuestionAmbit } from '../types';
import { getQuestionsByAmbit } from '../data/questionsBank';
import { AudioEngine } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Heart, 
  Sparkles, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Lock,
  Unlock,
  Zap,
  ArrowRight,
  RotateCcw,
  Target,
  Flame,
  Award
} from 'lucide-react';

interface MinijocOficinaProps {
  ambit: QuestionAmbit;
  onComplete: (jumpTiles: number, msg?: string) => void;
  onClose: () => void;
}

// 5 Vibrant, official themed tokens for the Match-3 police desk
export interface OfficeToken {
  id: string;
  name: string;
  badge: string;
  bgGlow: string;
  borderGlow: string;
  colorName: string;
}

const TOKENS: OfficeToken[] = [
  { id: 'expedient', name: 'Expedients', badge: '📁', bgGlow: 'bg-amber-500/20 text-amber-300', borderGlow: 'border-amber-400', colorName: 'Daurat' },
  { id: 'escut', name: 'Escuts Mossos', badge: '🛡️', bgGlow: 'bg-sky-500/20 text-sky-300', borderGlow: 'border-sky-400', colorName: 'Blau' },
  { id: 'grillons', name: 'Grillons Seguretat', badge: '⛓️', bgGlow: 'bg-slate-400/20 text-slate-200', borderGlow: 'border-slate-300', colorName: 'Plata' },
  { id: 'sirena', name: 'Sirenes Urgència', badge: '🚨', bgGlow: 'bg-rose-500/20 text-rose-300', borderGlow: 'border-rose-400', colorName: 'Vermell' },
  { id: 'emissora', name: 'Emissores Ràdio', badge: '📻', bgGlow: 'bg-emerald-500/20 text-emerald-300', borderGlow: 'border-emerald-400', colorName: 'Verd' },
];

const GRID_SIZE = 6;
const DESTROY_GOAL_PER_TOPIC = 3; // Cal trencar mínim 3 logos vinculats al tema per desbloquejar la pregunta

interface TopicChallenge {
  topicIndex: number;
  code: string; // e.g. "A.1", "B.3", "C.5"
  title: string;
  question: Question;
  associatedTokenIdx: number; // Token vinculat a aquest tema
  destroyedCount: number; // Quants se n'han trencat
  isUnlocked: boolean; // true si destroyedCount >= DESTROY_GOAL_PER_TOPIC
  isCompleted: boolean;
  isFailed: boolean;
}

// Temari oficial exacte per a cada àmbit
interface OfficialTopicDef {
  code: string;
  topicIndex: number;
  title: string;
  shortTitle: string;
  questionMatcher: (q: Question) => boolean;
}

const OFFICIAL_SYLLABUS: Record<QuestionAmbit, OfficialTopicDef[]> = {
  'Àmbit A': [
    {
      code: 'A.1',
      topicIndex: 1,
      title: 'Tema A.1. Història de Catalunya (Part I)',
      shortTitle: 'Història Cat (I)',
      questionMatcher: (q: Question) => q.id.includes('_A1_') || q.seccio.includes('(part I)') || q.seccio.includes('Reals A1')
    },
    {
      code: 'A.2',
      topicIndex: 2,
      title: 'Tema A.2. Història de Catalunya (Part II)',
      shortTitle: 'Història Cat (II)',
      questionMatcher: (q: Question) => q.id.includes('_A2_') || q.seccio.includes('(part II)') || q.seccio.includes('Reals A2')
    },
    {
      code: 'A.3',
      topicIndex: 3,
      title: 'Tema A.3. Història de la policia a Catalunya',
      shortTitle: 'Història Policia',
      questionMatcher: (q: Question) => q.id.includes('_A3_') || q.seccio.includes('policia a Catalunya') || q.seccio.includes('Reals A3')
    },
    {
      code: 'A.4',
      topicIndex: 4,
      title: 'Tema A.4. Àmbit sociolingüístic',
      shortTitle: 'Sociolingüístic',
      questionMatcher: (q: Question) => q.id.includes('_A4_') || q.seccio.includes('sociolingüístic') || q.seccio.includes('Reals A4')
    },
    {
      code: 'A.5',
      topicIndex: 5,
      title: 'Tema A.5. Marc geogràfic de Catalunya',
      shortTitle: 'Marc Geogràfic',
      questionMatcher: (q: Question) => q.id.includes('_A5_') || q.seccio.includes('geogràfic') || q.seccio.includes('Reals A5')
    },
    {
      code: 'A.6',
      topicIndex: 6,
      title: 'Tema A.6. Entorn social a Catalunya',
      shortTitle: 'Entorn Social',
      questionMatcher: (q: Question) => q.id.includes('_A6_') || q.seccio.includes('Entorn social') || q.seccio.includes('Reals A6')
    },
    {
      code: 'A.7',
      topicIndex: 7,
      title: 'Tema A.7. Tecnologies de la informació i comunicació',
      shortTitle: 'Tecnologies (TIC)',
      questionMatcher: (q: Question) => q.id.includes('_A7_') || q.seccio.includes('tecnologies') || q.seccio.includes('Reals A7')
    }
  ],
  'Àmbit B': [
    {
      code: 'B.1',
      topicIndex: 1,
      title: 'Tema B.1. La Constitució Espanyola de 1978',
      shortTitle: 'Constitució 1978',
      questionMatcher: (q: Question) => q.id.includes('_B4_') || q.seccio.includes('constitucionals') || q.seccio.includes('Reals B4')
    },
    {
      code: 'B.2',
      topicIndex: 2,
      title: 'Tema B.2. L’Estatut d’Autonomia de Catalunya',
      shortTitle: 'Estatut Autonomia',
      questionMatcher: (q: Question) => q.id.includes('_B1_') || q.seccio.includes('Estatut') || q.seccio.includes('Reals B1')
    },
    {
      code: 'B.3',
      topicIndex: 3,
      title: 'Tema B.3. Les institucions polítiques de la Generalitat',
      shortTitle: 'Inst. Generalitat',
      questionMatcher: (q: Question) => q.id.includes('_B2_') || q.seccio.includes('institucions polítiques de Catalunya') || q.seccio.includes('Reals B2')
    },
    {
      code: 'B.4',
      topicIndex: 4,
      title: 'Tema B.4. L’organització administrativa de la Generalitat',
      shortTitle: 'Org. Administrativa',
      questionMatcher: (q: Question) => q.id.includes('_B3_') || q.seccio.includes('ordenament jurídic') || q.seccio.includes('Reals B3')
    },
    {
      code: 'B.5',
      topicIndex: 5,
      title: 'Tema B.5. L’ordenament jurídic de l’Estat',
      shortTitle: 'Ord. Jurídic Estat',
      questionMatcher: (q: Question) => q.id.includes('_B5_') || q.seccio.includes('institucions polítiques de l’Estat') || q.seccio.includes('Reals B5')
    },
    {
      code: 'B.6',
      topicIndex: 6,
      title: 'Tema B.6. El poder judicial',
      shortTitle: 'Poder Judicial',
      questionMatcher: (q: Question) => q.id.includes('_B6_') || q.seccio.includes('òrgans jurisdiccionals') || q.seccio.includes('Reals B6')
    },
    {
      code: 'B.7',
      topicIndex: 7,
      title: 'Tema B.7. La Unió Europea',
      shortTitle: 'Unió Europea',
      questionMatcher: (q: Question) => q.id.includes('_B8_') || q.seccio.includes('Unió Europea') || q.seccio.includes('Reals B8')
    },
    {
      code: 'B.8',
      topicIndex: 8,
      title: 'Tema B.8. Les institucions administratives locals de Catalunya',
      shortTitle: 'Inst. Locals Cat',
      questionMatcher: (q: Question) => q.id.includes('_B7_') || q.seccio.includes('organització territorial') || q.seccio.includes('Reals B7')
    }
  ],
  'Àmbit C': [
    {
      code: 'C.1',
      topicIndex: 1,
      title: 'Tema C.1. Les competències de la Generalitat en matèria de seguretat',
      shortTitle: 'Competències Seg.',
      questionMatcher: (q: Question) => q.id.includes('_C1_') || q.seccio.includes('competències de la Generalitat en matèria de seguretat') || q.seccio.includes('Reals C1')
    },
    {
      code: 'C.2',
      topicIndex: 2,
      title: 'Tema C.2. El Departament d’Interior de la Generalitat',
      shortTitle: 'Dept. Interior',
      questionMatcher: (q: Question) => q.id.includes('_C2_') || q.seccio.includes('Departament d’Interior') || q.seccio.includes('Reals C2')
    },
    {
      code: 'C.3',
      topicIndex: 3,
      title: 'Tema C.3. La Llei de Policia de la Generalitat (Llei 10/1994)',
      shortTitle: 'Llei 10/1994 Policia',
      questionMatcher: (q: Question) => q.id.includes('_C4_') || q.seccio.includes('marc legal de la seguretat') || q.seccio.includes('Reals C4')
    },
    {
      code: 'C.4',
      topicIndex: 4,
      title: 'Tema C.4. El model policial de Catalunya i la coordinació',
      shortTitle: 'Model i Coordinació',
      questionMatcher: (q: Question) => q.id.includes('_C3_') || q.seccio.includes('coordinació policial') || q.seccio.includes('Reals C3')
    },
    {
      code: 'C.5',
      topicIndex: 5,
      title: 'Tema C.5. Drets humans i codi ètic policial',
      shortTitle: 'Codi Ètic i DDHH',
      questionMatcher: (q: Question) => q.id.includes('_C5_') || q.seccio.includes('Codi deontològic policial') || q.seccio.includes('Reals C5')
    }
  ]
};

interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  text: string;
}

export const MinijocOficina: React.FC<MinijocOficinaProps> = ({
  ambit,
  onComplete,
  onClose
}) => {
  const [lives, setLives] = useState(3);
  const [board, setBoard] = useState<number[][]>(() => createInitialBoard());
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [matchedCells, setMatchedCells] = useState<Set<string>>(new Set());
  const [comboCount, setComboCount] = useState(0);
  const [score, setScore] = useState(0);
  const [activeTopicIndex, setActiveTopicIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answeredQuestion, setAnsweredQuestion] = useState<boolean>(false);
  const [isLastAnswerCorrect, setIsLastAnswerCorrect] = useState<boolean | null>(null);
  const [gameOver, setGameOver] = useState<'win' | 'lose' | null>(null);
  const [shake, setShake] = useState(false);
  const [floatingParticles, setFloatingParticles] = useState<FloatingParticle[]>([]);

  // Carreguem els temes oficials de l'àmbit i en seleccionem preguntes estrictament pertinents
  const topicChallenges = useMemo<TopicChallenge[]>(() => {
    const allAmbitQuestions = getQuestionsByAmbit(ambit);
    const officialDefs = OFFICIAL_SYLLABUS[ambit] || OFFICIAL_SYLLABUS['Àmbit A'];

    return officialDefs.map((def, idx) => {
      // Filtrar preguntes que corresponen exactament a aquest tema
      const matchingQuestions = allAmbitQuestions.filter(def.questionMatcher);
      
      // Si per algun motiu no trobés preguntes (que n'hi ha desenes per a cadascun), agafa de l'àmbit
      const pool = matchingQuestions.length > 0 ? matchingQuestions : allAmbitQuestions;
      const selectedQ = pool[Math.floor(Math.random() * pool.length)];

      return {
        topicIndex: def.topicIndex,
        code: def.code,
        title: def.title,
        question: selectedQ,
        associatedTokenIdx: idx % TOKENS.length,
        destroyedCount: 0,
        isUnlocked: false,
        isCompleted: false,
        isFailed: false
      };
    });
  }, [ambit]);

  const [challengesState, setChallengesState] = useState<TopicChallenge[]>(topicChallenges);

  // Inicialitzar tauler sense combinacions preexistents de 3
  function createInitialBoard(): number[][] {
    const newBoard: number[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: number[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        let type: number;
        do {
          type = Math.floor(Math.random() * TOKENS.length);
        } while (
          (c >= 2 && row[c - 1] === type && row[c - 2] === type) ||
          (r >= 2 && newBoard[r - 1][c] === type && newBoard[r - 2][c] === type)
        );
        row.push(type);
      }
      newBoard.push(row);
    }
    return newBoard;
  }

  // Detectar 3 o més en línia
  const checkMatches = (currentBoard: number[][]): { r: number; c: number; type: number }[] => {
    const matched = new Map<string, { r: number; c: number; type: number }>();

    // Horitzontal
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        const type = currentBoard[r][c];
        if (type !== -1 && type === currentBoard[r][c + 1] && type === currentBoard[r][c + 2]) {
          matched.set(`${r},${c}`, { r, c, type });
          matched.set(`${r},${c + 1}`, { r, c: c + 1, type });
          matched.set(`${r},${c + 2}`, { r, c: c + 2, type });
        }
      }
    }

    // Vertical
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let r = 0; r < GRID_SIZE - 2; r++) {
        const type = currentBoard[r][c];
        if (type !== -1 && type === currentBoard[r + 1][c] && type === currentBoard[r + 2][c]) {
          matched.set(`${r},${c}`, { r, c, type });
          matched.set(`${r + 1},${c}`, { r: r + 1, c, type });
          matched.set(`${r + 2},${c}`, { r: r + 2, c, type });
        }
      }
    }

    return Array.from(matched.values());
  };

  // Processar destrucció de peces i augmentar els comptadors dels temes vinculats
  const triggerMatchesExplosion = (
    matches: { r: number; c: number; type: number }[],
    newBoard: number[][],
    isPlayerMove: boolean = false
  ) => {
    const matchKeys = new Set(matches.map(m => `${m.r},${m.c}`));
    setMatchedCells(matchKeys);

    // Comptabilitzar quins tokens s'han trencat
    const brokenTokenCounts: Record<number, number> = {};
    matches.forEach(m => {
      brokenTokenCounts[m.type] = (brokenTokenCounts[m.type] || 0) + 1;
    });

    // Crear efectes visuals de partícules
    matches.forEach((m, idx) => {
      if (idx < 4) {
        const id = Date.now() + Math.random();
        setFloatingParticles(prev => [
          ...prev, 
          { id, x: m.c * 50, y: m.r * 50, text: `💥 +1 ${TOKENS[m.type].badge}` }
        ]);
        setTimeout(() => {
          setFloatingParticles(prev => prev.filter(p => p.id !== id));
        }, 800);
      }
    });

    AudioEngine.playCorrect();

    // Només comptabilitzem el progrés per desbloquejar temes si ha estat un moviment intencionat del jugador
    // (Això evita que cascades automàtiques o combinacions fortuïtes facin la feina soles)
    if (isPlayerMove) {
      setChallengesState(prevChallenges => {
        return prevChallenges.map(challenge => {
          const tokenIdx = challenge.associatedTokenIdx;
          const addCount = brokenTokenCounts[tokenIdx] || 0;
          if (addCount > 0) {
            const newDestroyed = challenge.destroyedCount + addCount;
            const nowUnlocked = newDestroyed >= DESTROY_GOAL_PER_TOPIC;
            return {
              ...challenge,
              destroyedCount: newDestroyed,
              isUnlocked: challenge.isUnlocked || nowUnlocked
            };
          }
          return challenge;
        });
      });
    }

    // Punts de combo
    setScore(s => s + matches.length * 25);
    setComboCount(c => c + 1);

    // Eliminar peces i fer caure les de dalt
    setTimeout(() => {
      matches.forEach(m => {
        newBoard[m.r][m.c] = -1;
      });

      // Gravetat amb ompliment intel·ligent per minimitzar noves cascades fortuïtes
      for (let col = 0; col < GRID_SIZE; col++) {
        let emptySpot = GRID_SIZE - 1;
        for (let row = GRID_SIZE - 1; row >= 0; row--) {
          if (newBoard[row][col] !== -1) {
            newBoard[emptySpot][col] = newBoard[row][col];
            if (emptySpot !== row) {
              newBoard[row][col] = -1;
            }
            emptySpot--;
          }
        }
        for (let row = emptySpot; row >= 0; row--) {
          // Evitem generar 3 seguits verticalment al caure
          let tokenType: number;
          let attempts = 0;
          do {
            tokenType = Math.floor(Math.random() * TOKENS.length);
            attempts++;
          } while (
            attempts < 10 &&
            row + 2 < GRID_SIZE &&
            newBoard[row + 1][col] === tokenType &&
            newBoard[row + 2][col] === tokenType
          );
          newBoard[row][col] = tokenType;
        }
      }

      setBoard([...newBoard.map(row => [...row])]);
      setMatchedCells(new Set());

      // Comprovar cascades consecutives (isPlayerMove = false)
      const cascadeMatches = checkMatches(newBoard);
      if (cascadeMatches.length > 0) {
        setTimeout(() => triggerMatchesExplosion(cascadeMatches, newBoard, false), 250);
      }
    }, 280);
  };

  // Clic a una cel·la
  const handleCellClick = (r: number, c: number) => {
    if (gameOver) return;

    if (!selectedCell) {
      setSelectedCell({ r, c });
      AudioEngine.playClick();
      return;
    }

    const { r: prevR, c: prevC } = selectedCell;
    const isAdjacent = Math.abs(prevR - r) + Math.abs(prevC - c) === 1;

    if (!isAdjacent) {
      setSelectedCell({ r, c });
      AudioEngine.playClick();
      return;
    }

    // Intercanviar peces
    const newBoard = board.map(row => [...row]);
    const temp = newBoard[prevR][prevC];
    newBoard[prevR][prevC] = newBoard[r][c];
    newBoard[r][c] = temp;

    const matches = checkMatches(newBoard);

    if (matches.length > 0) {
      // Moviment vàlid del jugador
      setSelectedCell(null);
      triggerMatchesExplosion(matches, newBoard, true);
    } else {
      // Moviment invàlid: Penalització de vida!
      AudioEngine.playWrong();
      setShake(true);
      setTimeout(() => setShake(false), 350);
      setSelectedCell(null);

      // Descomptem 1 vida per moviment invàlid/fallit al tauler
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setGameOver('lose');
      }
    }
  };

  // Respondre la pregunta (només si el tema està desbloquejat!)
  const handleSelectOption = (index: number) => {
    const currChallenge = challengesState[activeTopicIndex];
    if (answeredQuestion || !currChallenge || !currChallenge.isUnlocked || gameOver) return;

    setSelectedOption(index);
    setAnsweredQuestion(true);
    const isCorrect = index === currChallenge.question.resposta;
    setIsLastAnswerCorrect(isCorrect);

    if (isCorrect) {
      AudioEngine.playCorrect();
      setChallengesState(prev => {
        const next = [...prev];
        next[activeTopicIndex] = { ...currChallenge, isCompleted: true, isFailed: false };
        const allCompleted = next.every(ch => ch.isCompleted);
        if (allCompleted) {
          setGameOver('win');
          confetti({
            particleCount: 160,
            spread: 90,
            origin: { y: 0.6 }
          });
        }
        return next;
      });
    } else {
      AudioEngine.playWrong();
      const newLives = lives - 1;
      setLives(newLives);

      // No rebloquegem immediatament per permetre que l'aspirant llegeixi la resposta correcta i l'explicació!
      setChallengesState(prev => {
        const next = [...prev];
        next[activeTopicIndex] = {
          ...currChallenge,
          isCompleted: false,
          isFailed: true
        };
        return next;
      });
    }
  };

  // Següent tema
  const handleNextChallenge = () => {
    // Si la resposta anterior era incorrecta, ara sí rebloquegem el tema i preparem la nova pregunta
    if (isLastAnswerCorrect === false) {
      const currChallenge = challengesState[activeTopicIndex];
      const allAmbitQuestions = getQuestionsByAmbit(ambit);
      const def = OFFICIAL_SYLLABUS[ambit]?.find(d => d.code === currChallenge.code);
      let newQuestion = currChallenge.question;
      if (def) {
        const pool = allAmbitQuestions.filter(def.questionMatcher);
        if (pool.length > 1) {
          const alternateQuestions = pool.filter(q => q.id !== currChallenge.question.id);
          const candidatePool = alternateQuestions.length > 0 ? alternateQuestions : pool;
          newQuestion = candidatePool[Math.floor(Math.random() * candidatePool.length)];
        }
      }

      setChallengesState(prev => {
        const next = [...prev];
        next[activeTopicIndex] = {
          ...currChallenge,
          question: newQuestion,
          destroyedCount: 0,
          isUnlocked: false, // Rebloquejat després de llegir la solució
          isCompleted: false,
          isFailed: true
        };
        return next;
      });

      // Si ha esgotat totes les vides, passar a derrota
      if (lives <= 0) {
        setGameOver('lose');
        return;
      }
    }

    setSelectedOption(null);
    setAnsweredQuestion(false);
    setIsLastAnswerCorrect(null);

    // Buscar el següent tema desbloquejat que no estigui completat
    const nextUnlockedIdx = challengesState.findIndex(
      (ch, idx) => idx > activeTopicIndex && ch.isUnlocked && !ch.isCompleted
    );

    if (nextUnlockedIdx !== -1) {
      setActiveTopicIndex(nextUnlockedIdx);
    } else {
      // Sinó buscar qualsevol pendent
      const anyUnlocked = challengesState.findIndex(ch => ch.isUnlocked && !ch.isCompleted);
      if (anyUnlocked !== -1) {
        setActiveTopicIndex(anyUnlocked);
      } else {
        const anyPending = challengesState.findIndex(ch => !ch.isCompleted);
        if (anyPending !== -1) setActiveTopicIndex(anyPending);
      }
    }
  };

  // Recompensa final de l'Oficina (+3 en encertar, -3 en perdre totes les vides)
  const handleClaimReward = () => {
    const correctCount = challengesState.filter(c => c.isCompleted).length;
    if (gameOver === 'lose') {
      onComplete(-3, '❌ Has esgotat totes les vides a l\'oficina! Penalització estricta: Retrocedeixes 3 caselles (-3).');
    } else if (gameOver === 'win' || correctCount === challengesState.length) {
      onComplete(5, '🏆 Has endreçat l\'oficina al 100%! Has desbloquejat el PONT POLICIAL (+5 Caselles de salt)!');
    } else if (correctCount >= 1) {
      onComplete(3, `📁 Has resolt i encertat a l'oficina! Recompensa oficial: Avances +3 caselles.`);
    } else {
      onComplete(0, "No has completat cap repte a l'oficina. Et mantens a la casella actual.");
    }
  };

  const currentChallenge = challengesState[activeTopicIndex] || challengesState[0];
  const activeToken = currentChallenge ? TOKENS[currentChallenge.associatedTokenIdx] : TOKENS[0];
  const correctCount = challengesState.filter(c => c.isCompleted).length;
  const remainingTokensToUnlock = Math.max(0, DESTROY_GOAL_PER_TOPIC - (currentChallenge?.destroyedCount || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-amber-500/70 rounded-3xl p-3 sm:p-6 shadow-2xl overflow-hidden my-auto text-slate-100">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                  <span>📁</span>
                  <span>Ordena l'Oficina: Destrueix i Respon</span>
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {ambit}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Alinea 3 logos del tema per desbloquejar la pregunta oficial. <b>Encertar = +3 caselles!</b> Perdre les 3 vides (fallades o moviments invàlids) = <b>-3 caselles!</b>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Vides (3 vides) */}
            <div className="flex items-center gap-1 bg-rose-950/50 border border-rose-500/40 px-2.5 py-1.5 rounded-xl">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-3.5 h-3.5 transition-all ${
                    i < lives ? 'text-rose-500 fill-rose-500 scale-100' : 'text-slate-700 scale-75'
                  }`}
                />
              ))}
            </div>

            {/* Score */}
            <div className="bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 rounded-xl text-amber-300 font-mono font-black text-xs flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>{score} pts</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Tancar minijoc"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TEMES BAR WITH REAL-TIME UNLOCK PROGRESS */}
        <div className="my-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-slate-300 flex items-center gap-1">
              <span>🎯 Objectius Temàtics ({correctCount}/{challengesState.length} Temes Aprovats):</span>
            </span>
            <span className="text-amber-400 font-extrabold text-[11px]">
              {correctCount === challengesState.length 
                ? '✨ PONT DE +5 CASELLAS DESBLOQUEJAT!' 
                : 'Trenca 3 logos del tema per respondre'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 xl:grid-cols-8 gap-2">
            {challengesState.map((ch, idx) => {
              const token = TOKENS[ch.associatedTokenIdx];
              const isSelected = activeTopicIndex === idx;
              const isLocked = !ch.isUnlocked && !ch.isCompleted;

              return (
                <button
                  key={ch.code || ch.topicIndex}
                  type="button"
                  onClick={() => {
                    setActiveTopicIndex(idx);
                    setSelectedOption(null);
                    setAnsweredQuestion(false);
                    setIsLastAnswerCorrect(null);
                  }}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    ch.isCompleted
                      ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm'
                      : ch.isFailed
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                      : isSelected
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200 ring-2 ring-amber-400/60 shadow-lg'
                      : ch.isUnlocked
                      ? 'bg-sky-950/40 border-sky-500/40 text-sky-200 hover:bg-sky-900/40'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full mb-1">
                    <span className="font-mono text-[10px] font-black flex items-center gap-1">
                      <span>{ch.code}</span>
                      <span className="text-xs">{token.badge}</span>
                    </span>

                    {ch.isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : isLocked ? (
                      <div className="flex items-center gap-0.5 bg-black/50 px-1 py-0.5 rounded text-[9px] font-mono text-amber-400 font-bold">
                        <Lock className="w-2.5 h-2.5" />
                        <span>{ch.destroyedCount}/3</span>
                      </div>
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-bounce" />
                    )}
                  </div>

                  <div className="text-[10px] font-bold truncate leading-tight w-full" title={ch.title}>
                    {ch.title.replace(/^Tema\s+[A-C]\.\d+\.\s*/i, '')}
                  </div>

                  {/* Progress bar inside button */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        ch.isCompleted ? 'bg-emerald-400' : ch.isUnlocked ? 'bg-sky-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${Math.min(100, (ch.destroyedCount / DESTROY_GOAL_PER_TOPIC) * 100)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN GAMEPLAY: BOARD (LEFT) + QUESTION/UNLOCK STATUS (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-3">
          
          {/* Match-3 Board */}
          <div className="lg:col-span-5 bg-slate-950/70 p-3 sm:p-4 rounded-2xl border border-slate-800 flex flex-col items-center relative">
            <div className="flex items-center justify-between w-full mb-2 px-1">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>🧩 Despatx de l'Oficina</span>
              </span>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
                <span>{currentChallenge.code}: Trenca</span>
                <span className="text-base">{activeToken.badge}</span>
              </div>
            </div>

            {/* Grid */}
            <div className={`grid grid-cols-6 gap-1.5 p-2 bg-slate-900/90 rounded-2xl border-2 border-slate-800 shadow-2xl relative select-none ${shake ? 'animate-shake' : ''}`}>
              {board.map((row, r) =>
                row.map((itemIdx, c) => {
                  const token = TOKENS[itemIdx] || TOKENS[0];
                  const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                  const isExploding = matchedCells.has(`${r},${c}`);

                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      onClick={() => handleCellClick(r, c)}
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xl transition-all cursor-pointer transform active:scale-90 relative ${
                        isExploding
                          ? 'scale-125 bg-amber-400 rotate-12 shadow-lg shadow-amber-500/50 z-20'
                          : isSelected
                          ? 'ring-4 ring-amber-400 scale-110 z-10 shadow-lg bg-amber-500/40'
                          : 'bg-slate-800/80 hover:bg-slate-750 hover:scale-105'
                      }`}
                      title={token.name}
                    >
                      <span className="filter drop-shadow select-none">{token.badge}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Instruction Footer */}
            <div className="w-full mt-3 flex justify-between items-center text-[11px] text-slate-400 px-1">
              <span className="flex items-center gap-1">
                <span>💡 Alinea 3</span>
                <span className="text-amber-400 font-bold">{activeToken.badge} {activeToken.name}</span>
                <span>per desbloquejar {currentChallenge.code}.</span>
              </span>
              <button
                type="button"
                onClick={() => setBoard(createInitialBoard())}
                className="text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer font-bold shrink-0 ml-2"
                title="Barrejar tauler de peces"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Barrejar</span>
              </button>
            </div>
          </div>

          {/* Right Panel: Locked Gate OR Unlocked Question Card */}
          <div className="lg:col-span-7 bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
            {currentChallenge ? (
              <div>
                {/* Header of Active Challenge */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono text-xs font-black border border-amber-500/30 flex items-center gap-1">
                      <span>{currentChallenge.code}</span>
                      <span>{activeToken.badge}</span>
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[260px]">
                      {currentChallenge.title}
                    </span>
                  </div>

                  {currentChallenge.isCompleted ? (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Tema Aprovat
                    </span>
                  ) : currentChallenge.isFailed ? (
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1 bg-rose-500/20 px-2 py-0.5 rounded-lg border border-rose-500/30">
                      <AlertCircle className="w-3.5 h-3.5" /> Fallat (-1 vida)
                    </span>
                  ) : currentChallenge.isUnlocked ? (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30 animate-pulse">
                      <Unlock className="w-3.5 h-3.5" /> PREGUNTA DESBLOQUEJADA!
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30">
                      <Lock className="w-3.5 h-3.5" /> BLOQUEJAT (Falten {remainingTokensToUnlock} {activeToken.badge})
                    </span>
                  )}
                </div>

                {/* LOCKED STATE: Prompt to destroy 3 matching tokens */}
                {!currentChallenge.isUnlocked && !currentChallenge.isCompleted ? (
                  <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
                    <div className="relative mb-4">
                      <div className="w-20 h-20 rounded-3xl bg-slate-900 border-2 border-dashed border-amber-500/40 flex items-center justify-center text-4xl shadow-inner">
                        <span>{activeToken.badge}</span>
                      </div>
                      <div className="absolute -bottom-2 -right-2 p-2 bg-amber-500 text-slate-950 rounded-xl font-black text-xs shadow-lg flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>{currentChallenge.destroyedCount}/3</span>
                      </div>
                    </div>

                    <h4 className="text-base font-black text-white mb-1.5 flex items-center gap-1.5">
                      <span>Trenca 3 {activeToken.badge} {activeToken.name}</span>
                    </h4>
                    
                    <p className="text-xs text-slate-300 max-w-sm mb-4 leading-relaxed">
                      La pregunta oficial del <b>{currentChallenge.title}</b> està protegida. 
                      Fes combinacions de 3 al tauler de l'esquerra per destruir {activeToken.name} i desbloquejar-la!
                    </p>

                    {/* Visual Progress Bar */}
                    <div className="w-full max-w-xs bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span className="text-slate-400">Logos destruïts:</span>
                        <span className="text-amber-400 font-mono">{currentChallenge.destroyedCount} de {DESTROY_GOAL_PER_TOPIC}</span>
                      </div>
                      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                          style={{ width: `${Math.min(100, (currentChallenge.destroyedCount / DESTROY_GOAL_PER_TOPIC) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* UNLOCKED STATE: Show real Question & Answer buttons */
                  <div className="mt-3">
                    <div className="mb-3">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-100 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        {currentChallenge.question.pregunta}
                      </h4>
                    </div>

                    {/* Question Options */}
                    <div className="space-y-2 mb-3">
                      {currentChallenge.question.opcions.map((opt, idx) => {
                        const isSelected = selectedOption === idx;
                        const isCorrect = idx === currentChallenge.question.resposta;

                        let btnClass = "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200";

                        if (answeredQuestion) {
                          if (isCorrect) {
                            btnClass = "bg-emerald-500/25 border-emerald-500 text-emerald-200 font-bold";
                          } else if (isSelected && !isCorrect) {
                            btnClass = "bg-rose-500/25 border-rose-500 text-rose-200 line-through font-bold";
                          } else {
                            btnClass = "opacity-40 bg-slate-900 border-slate-800";
                          }
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectOption(idx)}
                            disabled={answeredQuestion || gameOver !== null}
                            className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-start gap-2.5 ${btnClass}`}
                          >
                            <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="flex-1">{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation on answer */}
                    {answeredQuestion && (
                      <div className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                        isLastAnswerCorrect ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/60 border-rose-500/60 text-rose-200'
                      }`}>
                        <p className="font-extrabold text-xs flex items-center gap-1.5">
                          {isLastAnswerCorrect ? '✓ Resposta Correcta!' : '✗ Resposta Incorrecta! (-1 vida)'}
                        </p>
                        {!isLastAnswerCorrect && (
                          <div className="p-2 bg-slate-900/90 border border-emerald-500/50 rounded-lg text-emerald-300 font-bold flex items-start gap-1.5">
                            <span className="shrink-0 text-emerald-400">✓ Resposta correcta:</span>
                            <span className="text-white">
                              {String.fromCharCode(65 + currentChallenge.question.resposta)}) {currentChallenge.question.opcions[currentChallenge.question.resposta]}
                            </span>
                          </div>
                        )}
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          <span className="font-semibold text-slate-200">Explicació: </span>
                          {currentChallenge.question.explicacio}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {/* Bottom Question Controls */}
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
              {answeredQuestion && !gameOver ? (
                <button
                  type="button"
                  onClick={handleNextChallenge}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer ml-auto"
                >
                  <span>
                    {isLastAnswerCorrect 
                      ? 'Següent Tema ➔' 
                      : lives <= 0 
                        ? 'Veure Resultat de la Partida ➔' 
                        : 'Tornar al Tauler per Desbloquejar ➔'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono">
                  {currentChallenge?.isUnlocked ? '✓ Tema desbloquejat' : '🔒 Trenca 3 peces per desbloquejar'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Win / Complete Banner */}
        {gameOver && (
          <div className="mt-4 p-4 bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-emerald-500/25 border-2 border-amber-500 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/30 rounded-2xl border border-amber-400 shrink-0">
                {gameOver === 'win' ? (
                  <Sparkles className="w-7 h-7 text-amber-400 animate-spin" />
                ) : (
                  <AlertCircle className="w-7 h-7 text-rose-400" />
                )}
              </div>
              <div>
                <h4 className="text-base font-black text-amber-300">
                  {gameOver === 'win'
                    ? '🎉 PONT POLICIAL DESBLOQUEJAT! (+5 Caselles)!'
                    : gameOver === 'lose'
                    ? '❌ HAS PERDUT TOTES LES VIDES (-3 CASELLAS)'
                    : correctCount >= 1
                    ? `📁 OFICINA ENDREÇADA AMB ENCERT (+3 Caselles)!`
                    : '📁 RECEPTOR TANCAT'}
                </h4>
                <p className="text-xs text-slate-300">
                  {gameOver === 'win'
                    ? 'Has completat correctament tots els temes de l\'àmbit! El pont et fa saltar 5 caselles directes al tauler!'
                    : gameOver === 'lose'
                    ? 'Has esgotat les 3 vides (per moviments invàlids o fallades de preguntes). Penalització: retrocedeixes 3 caselles (-3) al tauler!'
                    : correctCount >= 1
                    ? `Has encertat el repte oficial de l'oficina! Recompensa guanyada: avances +3 caselles al tauler!`
                    : 'Et mantens a la casella actual.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClaimReward}
              className={`py-2.5 px-5 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-all transform active:scale-95 cursor-pointer shrink-0 ${
                gameOver === 'lose'
                  ? 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-rose-900/30'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/25'
              }`}
            >
              <span>
                {gameOver === 'win'
                  ? 'SALTAR +5 CASELLAS ➔'
                  : gameOver === 'lose'
                  ? 'RETROCEDIR -3 CASELLAS ➔'
                  : correctCount >= 1
                  ? 'AVANÇAR +3 CASELLAS ➔'
                  : 'TORNAR AL TAULER'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
