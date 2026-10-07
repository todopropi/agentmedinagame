import { CamiTopicInfo, TopicMasteryRecord, TopicAmbitCategory } from '../types';

export type { CamiTopicInfo, TopicMasteryRecord, TopicAmbitCategory };

export const CAMI_AMBITS: { id: TopicAmbitCategory; name: string; subtitle: string; icon: string; color: string; badgeColor: string }[] = [
  {
    id: 'Àmbit A',
    name: "Coneixements de l'Entorn",
    subtitle: 'Tema A.1 · Història de Catalunya (part I)',
    icon: '🏛️',
    color: 'from-amber-500/20 to-orange-600/20 border-amber-500/40 text-amber-400',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  },
  {
    id: 'Àmbit B',
    name: 'Institucional',
    subtitle: 'Tema B.1 · L’Estatut d’autonomia de Catalunya (EAC)',
    icon: '⚖️',
    color: 'from-blue-500/20 to-indigo-600/20 border-blue-500/40 text-blue-400',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
  },
  {
    id: 'Àmbit C',
    name: 'Seguretat Ciutadana i Ordre Públic',
    subtitle: 'Tema C.1 · Les competències de la Generalitat en matèria de seguretat',
    icon: '👮‍♂️',
    color: 'from-emerald-500/20 to-teal-600/20 border-emerald-500/40 text-emerald-400',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  },
  {
    id: 'Àmbit D',
    name: 'Actualitat i Cultura General',
    subtitle: 'Àmbit D (Únic) · Actualitat, societat i policia internacional',
    icon: '🌍',
    color: 'from-purple-500/20 to-pink-600/20 border-purple-500/40 text-purple-400',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  }
];

export const CAMI_TOPICS_LIST: CamiTopicInfo[] = [
  // --- TEMA A.1: HISTÒRIA DE CATALUNYA (PART I) ---
  {
    id: 'tema_a1',
    ambit: 'Àmbit A',
    ambitName: "Coneixements de l'Entorn",
    code: 'Tema A.1',
    title: 'Història de Catalunya (part I)',
    subtitle: "Dels orígens de l'antiguitat fins a les transformacions del segle XVIII",
    description: "Temari oficial complet: 1. L’antiguitat a Catalunya · 2. La Catalunya romana · 3. El naixement de Catalunya · 4. La Catalunya feudal (s. xi-xii) · 5. L’expansió catalanoaragonesa (s. xiii-xiv) · 6. La crisi de la baixa edat mitjana (s. xiv i xv) · 7. Catalunya en la monarquia hispànica i la Guerra dels Segadors (s. xvi-xvii) · 8. La Guerra de Successió i l’Onze de Setembre · 9. Les transformacions del segle xviii.",
    icon: '🏛️',
    recommendedQuestions: 5,
    subtopics: [
      { id: 'a1_1', num: '1', title: "L’antiguitat a Catalunya", description: "Pobles ibers (ilergets, laietans, indigets), jaciments i colònies gregues d'Empúries i Rhode." },
      { id: 'a1_2', num: '2', title: "La Catalunya romana", description: "Desembarcament dels Escipions (218 aC), Tàrraco com a capital, Barcino i la Via Augusta." },
      { id: 'a1_3', num: '3', title: "El naixement de Catalunya", description: "Marca Hispànica carolíngia, Guifré el Pelós i independència de facto amb Borrell II (988)." },
      { id: 'a1_4', num: '4', title: "La Catalunya feudal (s. xi-xii)", description: "Pau i Treva de Déu de l'Abat Oliba (Toluges, 1027), juraments feudals i Usatges de Barcelona." },
      { id: 'a1_5', num: '5', title: "L’expansió catalanoaragonesa (s. xiii-xiv)", description: "Unió dinàstica de 1137, conquesta de Mallorca i València per Jaume I i Consolat de Mar." },
      { id: 'a1_6', num: '6', title: "La crisi de la baixa edat mitjana (s. xiv i xv)", description: "Pesta Negra de 1348, Compromís de Casp (1412), guerra civil i revolta dels remences." },
      { id: 'a1_7', num: '7', title: "Catalunya en la monarquia hispànica i la Guerra dels Segadors (s. xvi-xvii)", description: "Unió d'Armes d'Olivares, Corpus de Sang (7 de juny de 1640) i Tractat dels Pirineus (1659)." },
      { id: 'a1_8', num: '8', title: "La Guerra de Successió i l’Onze de Setembre", description: "Pacte de Gènova (1705), Tractat d'Utrecht, setge de Barcelona i capitulació l'11 de setembre de 1714." },
      { id: 'a1_9', num: '9', title: "Les transformacions del segle xviii", description: "Decret de Nova Planta (1716), Cadastre, naixement de les Esquadres de Paisans a Valls (1719) i creixement econòmic." }
    ]
  },

  // --- TEMA B.1: L’ESTATUT D’AUTONOMIA DE CATALUNYA (EAC) ---
  {
    id: 'tema_b1',
    ambit: 'Àmbit B',
    ambitName: 'Institucional',
    code: 'Tema B.1',
    title: 'L’Estatut d’autonomia de Catalunya (EAC)',
    subtitle: "Norma institucional bàsica, drets estatutaris i competències",
    description: "Temari oficial complet: 1. Antecedents històrics i naturalesa jurídica (1.1 Antecedents històrics, 1.2 Naturalesa jurídica) · 2. Contingut i estructura (2.1 Contingut, 2.2 Estructura) · 3. Els drets, els deures i els principis rectors · 4. Les competències de la Generalitat de Catalunya (4.1 Tipologia, 4.2 Principis i criteris, 4.3 Les matèries de les competències) · 5. La competència en matèria de seguretat pública establerta a l’Estatut d’autonomia de Catalunya.",
    icon: '⚖️',
    recommendedQuestions: 5,
    subtopics: [
      { id: 'b1_1_1', num: '1.1', title: "Antecedents històrics", description: "Estatut de Sau de 1979, redacció a Miravet/Sau, reforma estatutària de 2006 i referèndum." },
      { id: 'b1_1_2', num: '1.2', title: "Naturalesa jurídica", description: "Art. 147 CE i Art. 1 EAC: norma institucional bàsica de Catalunya i integració al bloc constitucional." },
      { id: 'b1_2_1', num: '2.1', title: "Contingut", description: "Identitat nacional, drets històrics, institucions d'autogovern i organització territorial." },
      { id: 'b1_2_2', num: '2.2', title: "Estructura", description: "Preàmbul, Títol preliminar i 7 títols (arts. 1 al 223), disposicions addicionals, transitòries i finals." },
      { id: 'b1_3', num: '3', title: "Els drets, els deures i els principis rectors", description: "Drets civils, polítics i lingüístics (arts. 15-38), deures ciutadans i principis rectors (arts. 39-54)." },
      { id: 'b1_4_1', num: '4.1', title: "Tipologia de les competències", description: "Competències exclusives (art. 110), compartides (art. 111) i executives (art. 112)." },
      { id: 'b1_4_2', num: '4.2', title: "Principis i criteris", description: "Principis d'eficàcia, subsidiarietat, coordinació, col·laboració i abast territorial." },
      { id: 'b1_4_3', num: '4.3', title: "Les matèries de les competències", description: "Desplegament al Títol IV de l'EAC (arts. 116-173): cultura, educació, sanitat, territori i seguretat." },
      { id: 'b1_5', num: '5', title: "La competència en matèria de seguretat pública a l’EAC", description: "Art. 164 de l'EAC: Policia integral a tot Catalunya, comandament suprem, policies locals i Junta de Seguretat." }
    ]
  },

  // --- TEMA C.1: LES COMPETÈNCIES DE LA GENERALITAT EN MATÈRIA DE SEGURETAT ---
  {
    id: 'tema_c1',
    ambit: 'Àmbit C',
    ambitName: 'Seguretat Ciutadana i Ordre Públic',
    code: 'Tema C.1',
    title: 'Les competències de la Generalitat en matèria de seguretat',
    subtitle: "Emergències, joc, seguretat privada, ordre públic i trànsit",
    description: "Temari oficial complet: 1. Definició de competència · 2. La competència en matèria de seguretat (2.1 Emergència i protecció civil, 2.2 Joc i espectacles, 2.3 Seguretat privada, 2.4 Seguretat pública, 2.5 Matèria de trànsit, circulació de vehicles i seguretat viària).",
    icon: '👮‍♂️',
    recommendedQuestions: 5,
    subtopics: [
      { id: 'c1_1', num: '1', title: "Definició de competència", description: "Concepte jurídic, titularitat, potestats reglamentàries, executives i principis d'indisponibilitat." },
      { id: 'c1_2_1', num: '2.1', title: "Les competències en matèria d’emergència i protecció civil", description: "Plans especials (INUNCAT, INFOCAT), CECAT, Llei 4/1997 i gestió d'emergències (112)." },
      { id: 'c1_2_2', num: '2.2', title: "Les competències en matèria de joc i espectacles", description: "Llei 11/2009, inspecció d'establiments, aforaments i Unitat de Joc i Espectacles de Mossos." },
      { id: 'c1_2_3', num: '2.3', title: "Les competències en matèria de seguretat privada", description: "Art. 163 EAC, Llei 5/2014, autorització i inspecció d'empreses amb seu a Catalunya i Pla Redum." },
      { id: 'c1_2_4', num: '2.4', title: "Les competències en matèria de seguretat pública", description: "Llei 4/2003 del sistema de seguretat pública, coordinació de policies locals, prevenció i ordre públic." },
      { id: 'c1_2_5', num: '2.5', title: "Matèria de trànsit, circulació de vehicles i seguretat viària", description: "RD 158/1997 de traspàs de trànsit, Servei Català de Trànsit (SCT) i Divisió de Trànsit de la PG-ME." }
    ]
  },

  // --- ÀMBIT D: UN ÚNIC ---
  {
    id: 'tema_d1',
    ambit: 'Àmbit D',
    ambitName: 'Actualitat i Cultura General',
    code: 'Àmbit D',
    title: 'Actualitat i Cultura General (Tema Únic)',
    subtitle: "Actualitat política, social, entorn policial, Catalunya i internacional",
    description: "Bloc integral oficial d'Actualitat i Coneixements Generals: Notícies recents, context contemporani, cultura i institucions catalanes, policia internacional (Europol, Interpol, SIRENE, Schengen) i organització policial.",
    icon: '🌍',
    recommendedQuestions: 5,
    subtopics: [
      { id: 'd_unic', num: 'Únic', title: "Àmbit D (Tema Únic) · Actualitat i Cultura General", description: "Esdeveniments contemporanis, cultura, institucions de Catalunya, cooperació policial internacional (Europol, Interpol, SIS II, Prüm) i policia de Catalunya." }
    ]
  }
];

/**
 * SISTEMA DE DEGRADACIÓ DE DOMINI PER PAS DEL TEMPS (CURVA DE L'OBLIT D'EBBINGHAUS)
 * Si l'opositor fa dies que no repassa un tema, el domini baixa gradualment.
 */
export function calculateTopicMasteryWithDecay(record?: TopicMasteryRecord): {
  currentMastery: number;
  originalMastery: number;
  isDegraded: boolean;
  daysInactive: number;
  decayAmount: number;
  isCriticalAlert: boolean;
  tier: 'none' | 'bronze' | 'silver' | 'gold';
  statusText: string;
} {
  if (!record || typeof record.mastery !== 'number' || record.mastery <= 0) {
    return {
      currentMastery: 0,
      originalMastery: 0,
      isDegraded: false,
      daysInactive: 999,
      decayAmount: 0,
      isCriticalAlert: false,
      tier: 'none',
      statusText: 'Sense iniciar'
    };
  }

  const originalMastery = Math.min(100, Math.max(0, record.mastery));
  const lastTime = record.lastPlayedAt || Date.now();
  const elapsedMs = Math.max(0, Date.now() - lastTime);
  const daysInactive = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));

  let decayAmount = 0;
  if (daysInactive >= 10) {
    decayAmount = 30; // Més de 10 dies: caiguda notable (-30%)
  } else if (daysInactive >= 6) {
    decayAmount = 18; // De 6 a 9 dies: -18%
  } else if (daysInactive >= 3) {
    decayAmount = 8; // De 3 a 5 dies: -8%
  }

  const currentMastery = Math.max(0, originalMastery - decayAmount);
  const isDegraded = decayAmount > 0;
  // Alerta crítica si porta 5 o més dies o el domini ha caigut en zona de risc
  const isCriticalAlert = (daysInactive >= 5 && originalMastery > 0) || (isDegraded && currentMastery < 60);

  let tier: 'none' | 'bronze' | 'silver' | 'gold' = 'none';
  if (currentMastery >= 80) tier = 'gold';
  else if (currentMastery >= 50) tier = 'silver';
  else if (currentMastery > 0) tier = 'bronze';

  let statusText = 'Normal';
  if (isCriticalAlert) {
    statusText = '⚠️ Alerta de Repàs Urgent';
  } else if (isDegraded) {
    statusText = `Degradat per inactivitat (-${decayAmount}%)`;
  } else if (tier === 'gold') {
    statusText = '🥇 Maestria Or (Consolidat)';
  } else if (tier === 'silver') {
    statusText = '🥈 Nivell Plata (Avançat)';
  } else if (tier === 'bronze') {
    statusText = '🥉 Nivell Bronze (Iniciat)';
  }

  return {
    currentMastery,
    originalMastery,
    isDegraded,
    daysInactive,
    decayAmount,
    isCriticalAlert,
    tier,
    statusText
  };
}

/**
 * Càlcul del Progrés de Cobertura Global del Temari (%)
 */
export function calculateGlobalSyllabusCoverage(topicMasteryMap: Record<string, TopicMasteryRecord> = {}): {
  overallPercentage: number;
  ambitStats: Record<TopicAmbitCategory, { averageMastery: number; totalTopics: number; goldCount: number; alertCount: number }>;
  totalGoldCount: number;
  totalAlertCount: number;
} {
  const ambitStats: Record<TopicAmbitCategory, { averageMastery: number; totalTopics: number; goldCount: number; alertCount: number }> = {
    'Àmbit A': { averageMastery: 0, totalTopics: 0, goldCount: 0, alertCount: 0 },
    'Àmbit B': { averageMastery: 0, totalTopics: 0, goldCount: 0, alertCount: 0 },
    'Àmbit C': { averageMastery: 0, totalTopics: 0, goldCount: 0, alertCount: 0 },
    'Àmbit D': { averageMastery: 0, totalTopics: 0, goldCount: 0, alertCount: 0 }
  };

  let totalSum = 0;
  let totalGoldCount = 0;
  let totalAlertCount = 0;

  CAMI_TOPICS_LIST.forEach(topic => {
    const record = topicMasteryMap[topic.id];
    const { currentMastery, tier, isCriticalAlert } = calculateTopicMasteryWithDecay(record);
    
    totalSum += currentMastery;
    ambitStats[topic.ambit].totalTopics += 1;
    ambitStats[topic.ambit].averageMastery += currentMastery;

    if (tier === 'gold') {
      totalGoldCount += 1;
      ambitStats[topic.ambit].goldCount += 1;
    }
    if (isCriticalAlert) {
      totalAlertCount += 1;
      ambitStats[topic.ambit].alertCount += 1;
    }
  });

  Object.keys(ambitStats).forEach(amb => {
    const key = amb as TopicAmbitCategory;
    if (ambitStats[key].totalTopics > 0) {
      ambitStats[key].averageMastery = Math.round(ambitStats[key].averageMastery / ambitStats[key].totalTopics);
    }
  });

  const overallPercentage = CAMI_TOPICS_LIST.length > 0 
    ? Math.round(totalSum / CAMI_TOPICS_LIST.length) 
    : 0;

  return {
    overallPercentage,
    ambitStats,
    totalGoldCount,
    totalAlertCount
  };
}
