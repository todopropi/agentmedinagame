import { Question } from '../types';
import { QUESTIONS_BANK } from './questionsBank';

export interface DuelQuestionItem {
  id: string;
  topicIndex: number; // 0: A, 1: B, 2: C, 3: Actualitat, 4: ISPC, 5: Preguntes Reals
  categoryName: string;
  categoryIcon: string;
  question: string;
  options: { key: string; text: string; correct: boolean }[];
  explanation: string;
  hint: string;
  isRealExam?: boolean;
}

export const HTML_QUESTIONS_TOPICS: { [topicIndex: number]: DuelQuestionItem[] } = {
  // 0: Àmbit A · Coneixements de l'Entorn
  0: [
    {
      id: 'q_a_1',
      topicIndex: 0,
      categoryName: 'Àmbit A · Història de Catalunya',
      categoryIcon: '🏛️',
      question: "En quin any es va promulgar el Decret de Nova Planta per al Principat de Catalunya per part de Felip V?",
      options: [
        { key: "A", text: "1707", correct: false },
        { key: "B", text: "1714", correct: false },
        { key: "C", text: "1716", correct: true },
        { key: "D", text: "1719", correct: false }
      ],
      explanation: "El Decret de Nova Planta per a Catalunya va ser signat el 16 de gener de 1716, dissolent les institucions pròpies catalanes.",
      hint: "Recorda que no es va aplicar immediatament l'any de la caiguda de Barcelona, sinó un parell d'anys després per consolidar l'administració borbònica."
    },
    {
      id: 'q_a_2',
      topicIndex: 0,
      categoryName: 'Àmbit A · Història de Catalunya',
      categoryIcon: '🏛️',
      question: "Qui van ser els fundadors originals de les primeres meitats d'Esquadres de Paisans a principis del segle XVIII?",
      options: [
        { key: "A", text: "El Marquès de la Mina i Pere Anton Veciana.", correct: true },
        { key: "B", text: "Rafael Casanova i Josep Moragues.", correct: false },
        { key: "C", text: "Jaume I i Hug de Cervelló.", correct: false },
        { key: "D", text: "Francesc Macià i Lluís Companys.", correct: false }
      ],
      explanation: "Les Esquadres de Paisans van ser organitzades inicialment a Valls sota el comandament de Pere Anton Veciana i el Marquès de la Mina.",
      hint: "Pensa en l'origen comarcal a l'Alt Camp i la col·laboració entre l'autoritat militar borbònica i un batlle local compromès amb l'ordre rural."
    },
    {
      id: 'q_a_3',
      topicIndex: 0,
      categoryName: 'Àmbit A · Història de Catalunya',
      categoryIcon: '🏛️',
      question: "Quin fet històric va succeir l'11 de setembre de 1714 que commemora la Diada Nacional de Catalunya?",
      options: [
        { key: "A", text: "La signatura del Tractat d'Utrecht.", correct: false },
        { key: "B", text: "La caiguda de Barcelona després de 14 mesos de setge borbònic.", correct: true },
        { key: "C", text: "La proclamació de la República Catalana.", correct: false },
        { key: "D", text: "La creació de la Mancomunitat de Catalunya.", correct: false }
      ],
      explanation: "L'11 de setembre de 1714 Barcelona va capitular davant les tropes franco-castellanes del duc de Berwick després d'un heroic setge.",
      hint: "La commemoració prové d'una resistència heroica i capitulació decisiva al final de la Guerra de Successió."
    },
    {
      id: 'q_a_4',
      topicIndex: 0,
      categoryName: 'Àmbit A · Societat i Geografia',
      categoryIcon: '🌍',
      question: "Quin riu català té la conca hidrogràfica més extensa de les conques internes de Catalunya?",
      options: [
        { key: "A", text: "El Llobregat.", correct: false },
        { key: "B", text: "El Ter.", correct: true },
        { key: "C", text: "La Tordera.", correct: false },
        { key: "D", text: "El Segre.", correct: false }
      ],
      explanation: "Dins de les conques internes (que neixen i desemboquen a Catalunya), el riu Ter té la conca hidrogràfica més gran (uns 3.010 km²). El Segre pertany a la conca intercomunitària de l'Ebre.",
      hint: "Compte amb la trampa: distingeix entre conca de l'Ebre (intercomunitària) i conques internes catalanes que neixen al Pirineu oriental."
    }
  ],

  // 1: Àmbit B · Institucional i Marc Legal
  1: [
    {
      id: 'q_b_1',
      topicIndex: 1,
      categoryName: 'Àmbit B · Marc Constitucional i Estatutari',
      categoryIcon: '⚖️',
      question: "Segons l'article 57.1 de la Constitució Espanyola de 1978, quina és la jerarquia d'ordenació en la successió de la Corona?",
      options: [
        { key: "A", text: "Edat, línia, grau i sexe.", correct: false },
        { key: "B", text: "Línia, grau, sexe i persona de més edat.", correct: true },
        { key: "C", text: "Grau, línia, edat i sexe.", correct: false },
        { key: "D", text: "Sexe, línia, grau i edat.", correct: false }
      ],
      explanation: "L'article 57.1 de la Constitució estableix literalment l'ordre de successió: línia, grau, sexe i edat.",
      hint: "La norma constitucional prioritza sempre la proximitat de la branca descendent abans de valorar el grau de parentiu o criteris personals."
    },
    {
      id: 'q_b_2',
      topicIndex: 1,
      categoryName: 'Àmbit B · Marc Constitucional i Estatutari',
      categoryIcon: '⚖️',
      question: "Segons l'Estatut d'Autonomia de Catalunya de 2006, quina institució culmina l'organització judicial a Catalunya?",
      options: [
        { key: "A", text: "El Tribunal Constitucional.", correct: false },
        { key: "B", text: "El Tribunal Superior de Justícia de Catalunya (TSJC).", correct: true },
        { key: "C", text: "L'Audiència Provincial de Barcelona.", correct: false },
        { key: "D", text: "El Consell de la Justícia de Catalunya.", correct: false }
      ],
      explanation: "L'article 95 de l'Estatut d'Autonomia determina que el Tribunal Superior de Justícia de Catalunya és l'òrgan jurisdiccional en què culmina l'organització judicial a Catalunya.",
      hint: "Pensa en l'òrgan ordinari superior previst al poder judicial dins l'àmbit territorial de la comunitat autònoma."
    },
    {
      id: 'q_b_3',
      topicIndex: 1,
      categoryName: 'Àmbit B · Marc Constitucional i Estatutari',
      categoryIcon: '⚖️',
      question: "Quants diputats componen el Parlament de Catalunya segons la disposició transitòria segona de l'Estatut?",
      options: [
        { key: "A", text: "120 diputats.", correct: false },
        { key: "B", text: "135 diputats.", correct: true },
        { key: "C", text: "150 diputats.", correct: false },
        { key: "D", text: "350 diputats.", correct: false }
      ],
      explanation: "El Parlament de Catalunya està format per 135 diputats (85 per Barcelona, 18 per Tarragona, 17 per Girona i 15 per Lleida).",
      hint: "És una xifra impar compresa entre 100 i 150, assignada proporcionalment a les 4 circumscripcions electorals catalanes."
    },
    {
      id: 'q_b_4',
      topicIndex: 1,
      categoryName: 'Àmbit B · Drets Fonamentals',
      categoryIcon: '⚖️',
      question: "Quin article de la Constitució Espanyola garanteix el dret a la vida i a la integritat física i moral, abolint la pena de mort llevat del que disposin les lleis militars en temps de guerra?",
      options: [
        { key: "A", text: "Article 14.", correct: false },
        { key: "B", text: "Article 15.", correct: true },
        { key: "C", text: "Article 17.", correct: false },
        { key: "D", text: "Article 24.", correct: false }
      ],
      explanation: "L'article 15 CE encapçala la secció primera dels drets fonamentals reconeixent el dret a la vida.",
      hint: "És el primer precepte que obre formalment la Secció Primera dels Drets Fonamentals i de les Llibertats Públiques, just després del principi d'igualtat."
    }
  ],

  // 2: Àmbit C · Seguretat i Policia
  2: [
    {
      id: 'q_c_1',
      topicIndex: 2,
      categoryName: 'Àmbit C · Seguretat i Policia',
      categoryIcon: '👮',
      question: "Segons la Llei 10/1994, d'11 de juliol, de la Policia de la Generalitat - Mossos d'Esquadra, a quina escala pertany la categoria de Caporal?",
      options: [
        { key: "A", text: "A l'escala bàsica.", correct: true },
        { key: "B", text: "A l'escala de suport.", correct: false },
        { key: "C", text: "A l'escala intermèdia.", correct: false },
        { key: "D", text: "A l'escala executiva.", correct: false }
      ],
      explanation: "L'article 17 de la Llei 10/1994 estableix que l'escala bàsica comprèn les categories de mosso/a i de caporal/a.",
      hint: "Recorda l'agrupació dels dos primers esglaons operatius de primera línia i comandament immediat."
    },
    {
      id: 'q_c_2',
      topicIndex: 2,
      categoryName: 'Àmbit C · Seguretat i Policia',
      categoryIcon: '👮',
      question: "Quina comissaria general dels Mossos d'Esquadra té assumida la investigació dels delictes de corrupció i blanqueig de capitals segons l'estructura oficial?",
      options: [
        { key: "A", text: "La Comissaria General d'Investigació Criminal (CGIC).", correct: true },
        { key: "B", text: "La Comissaria General d'Informació (CGINF).", correct: false },
        { key: "C", text: "La Comissaria General de Recursos Operatius (CGRO).", correct: false },
        { key: "D", text: "La Comissaria Superior de Seguretat Ciutadana.", correct: false }
      ],
      explanation: "La CGIC té la competència específica sobre la delinqüència organitzada, econòmica, homicidis i blanqueig a través de la DIC.",
      hint: "Relaciona-ho amb la unitat especialitzada central en la persecució del crim complex i delictes patrimonials."
    },
    {
      id: 'q_c_3',
      topicIndex: 2,
      categoryName: 'Àmbit C · Seguretat i Policia',
      categoryIcon: '👮',
      question: "Segons la Llei Orgànica 2/1986, de forces i cossos de seguretat, quin principi bàsic d'actuació obliga a actuar amb absoluta neutralitat política i imparcialitat?",
      options: [
        { key: "A", text: "Adequació a l'ordenament jurídic.", correct: true },
        { key: "B", text: "Relacions amb la comunitat.", correct: false },
        { key: "C", text: "Tractament de detinguts.", correct: false },
        { key: "D", text: "Secret professional.", correct: false }
      ],
      explanation: "L'article 5.1 de la LO 2/1986 recull l'adequació a l'ordenament jurídic, incloent l'actuació amb neutralitat política i imparcialitat.",
      hint: "Correspon al primer bloc dogmàtic dels principis de l'article 5 de la Llei Orgànica 2/1986."
    },
    {
      id: 'q_c_4',
      topicIndex: 2,
      categoryName: 'Àmbit C · Seguretat i Policia',
      categoryIcon: '👮',
      question: "Segons l'article 72 de la Llei 10/1994, en quin termini prescriuen les faltes molt greus dels membres dels Mossos d'Esquadra?",
      options: [
        { key: "A", text: "Als 2 anys.", correct: false },
        { key: "B", text: "Als 3 anys.", correct: true },
        { key: "C", text: "Als 5 anys.", correct: false },
        { key: "D", text: "A l'any.", correct: false }
      ],
      explanation: "Les faltes molt greus prescriuen als 3 anys, les greus als 2 anys i les lleus al mes.",
      hint: "Recorda el nostre mnemotècnic de prescripció: 3 anys / 2 anys / 1 mes."
    },
    {
      id: 'q_c_5',
      topicIndex: 2,
      categoryName: 'Àmbit C · Seguretat i Policia',
      categoryIcon: '👮',
      question: "D'acord amb la LECrim, quin és el topall màxim general de durada de la detenció preventiva sense autorització judicial?",
      options: [
        { key: "A", text: "24 hores.", correct: false },
        { key: "B", text: "48 hores.", correct: false },
        { key: "C", text: "72 hores.", correct: true },
        { key: "D", text: "96 hores.", correct: false }
      ],
      explanation: "L'article 17.2 de la Constitució i la LECrim fixen que la detenció preventiva no durarà més del temps estrictament necessari, amb un màxim de 72 hores.",
      hint: "Topall ordinari constitucional i processal abans de passar a disposició del jutge."
    },
    {
      id: 'q_c_6',
      topicIndex: 2,
      categoryName: 'Àmbit C · Seguretat i Policia',
      categoryIcon: '👮',
      question: "Quin procediment judicial ràpid permet a una persona privada de llibertat sol·licitar que un jutge determini la legalitat de la seva detenció?",
      options: [
        { key: "A", text: "El recurs d'empara.", correct: false },
        { key: "B", text: "L'Habeas Corpus (LO 6/1984).", correct: true },
        { key: "C", text: "El judici ràpid per delictes lleus.", correct: false },
        { key: "D", text: "El sumari ordinari.", correct: false }
      ],
      explanation: "L'Habeas Corpus és el procediment constitucional que resol el Jutge d'Instrucció en un màxim de 24 hores.",
      hint: "Institució d'origen anglosaxó recollida a l'article 17.4 CE i desenvolupada per la LO 6/1984."
    }
  ],

  // 3: Actualitat i Cultura
  3: [
    {
      id: 'q_act_1',
      topicIndex: 3,
      categoryName: 'Actualitat & Cultura Policial',
      categoryIcon: '📰',
      question: "En quina data es va estrenar oficialment la nova uniformitat operativa dels Mossos d'Esquadra (camisa vermella fosca i pantaló blau marí)?",
      options: [
        { key: "A", text: "El 3 de febrer de 2023.", correct: true },
        { key: "B", text: "L'11 de setembre de 2021.", correct: false },
        { key: "C", text: "El 23 d'abril de 2022.", correct: false },
        { key: "D", text: "L'1 de gener de 2024.", correct: false }
      ],
      explanation: "El 3 de febrer de 2023 es va presentar i implantar el nou uniforme operatiu de seguretat ciutadana i trànsit dels Mossos d'Esquadra.",
      hint: "Va ocórrer a principis de l'any 2023 coincidint amb la celebració de la festivitat de les Esquadres."
    },
    {
      id: 'q_act_2',
      topicIndex: 3,
      categoryName: 'Actualitat & Cultura Policial',
      categoryIcon: '📰',
      question: "Quin municipi català acull el Complex Central Egara, seu de les comissaries generals dels Mossos d'Esquadra?",
      options: [
        { key: "A", text: "Terrassa.", correct: true },
        { key: "B", text: "Sabadell.", correct: false },
        { key: "C", text: "Mollet del Vallès.", correct: false },
        { key: "D", text: "Cerdanyola del Vallès.", correct: false }
      ],
      explanation: "El Complex Central Egara està situat al terme municipal de Terrassa (Vallès Occidental). Mollet acull l'ISPC.",
      hint: "Ciutat egarenca del Vallès Occidental, no confondre amb el municipi on hi ha l'Institut de Seguretat Pública."
    },
    {
      id: 'q_act_3',
      topicIndex: 3,
      categoryName: 'Actualitat & Cultura Policial',
      categoryIcon: '📰',
      question: "Quin sostre màxim de plantilla de Mossos d'Esquadra es va pactar a la Junta de Seguretat de Catalunya el novembre de 2021?",
      options: [
        { key: "A", text: "18.267 efectius.", correct: false },
        { key: "B", text: "22.006 efectius.", correct: true },
        { key: "C", text: "25.000 efectius.", correct: false },
        { key: "D", text: "15.000 efectius.", correct: false }
      ],
      explanation: "La Junta de Seguretat va acordar ampliar el sostre màxim d'agents de 18.267 a 22.006 efectius de cara a l'horitzó 2030.",
      hint: "L'ampliació superava per primera vegada la barrera dels 20.000 efectius policials per adaptar-se al creixement demogràfic."
    },
    {
      id: 'q_act_4',
      topicIndex: 3,
      categoryName: 'Actualitat & Cultura Policial',
      categoryIcon: '📰',
      question: "Quin element sanitari d'emergència ha de portar obligatòriament el vehicle policial dels Mossos que compta amb un dispositiu conductor d'energia (Tàser)?",
      options: [
        { key: "A", text: "Un desfibril·lador extern automàtic (DEA).", correct: true },
        { key: "B", text: "Una farmaciola d'oxigenoteràpia.", correct: false },
        { key: "C", text: "Un kit de sutura quirúrgica.", correct: false },
        { key: "D", text: "Un collarí cervical rígid.", correct: false }
      ],
      explanation: "La instrucció policial exigeix portar un DEA al vehicle i activar la càmera unipersonal abans o durant l'ús del DCE.",
      hint: "Dispositiu mèdic d'atenció cardíaca immediata davant una aturada."
    },
    {
      id: 'q_act_5',
      topicIndex: 3,
      categoryName: 'Actualitat & Cultura Policial',
      categoryIcon: '📰',
      question: "Quin dia institucional se celebra la festivitat del 'Dia de les Esquadres' en honor al cos de Mossos d'Esquadra?",
      options: [
        { key: "A", text: "21 d'abril.", correct: false },
        { key: "B", text: "22 d'abril.", correct: true },
        { key: "C", text: "23 d'abril.", correct: false },
        { key: "D", text: "11 de setembre.", correct: false }
      ],
      explanation: "El Decret 64/2005 fixa el 22 d'abril com a data oficial commemorativa de les Esquadres.",
      hint: "És la vigília de la diada de Sant Jordi."
    }
  ],

  // 4: ISPC Repte Global
  4: [
    {
      id: 'q_ispc_1',
      topicIndex: 4,
      categoryName: 'ISPC Repte Global',
      categoryIcon: '🎓',
      question: "Quin any es va aprovar la Llei de creació de l'Institut de Seguretat Pública de Catalunya (ISPC)?",
      options: [
        { key: "A", text: "1994 (Llei 10/1994).", correct: false },
        { key: "B", text: "2007 (Llei 10/2007).", correct: true },
        { key: "C", text: "1983 (Llei 19/1983).", correct: false },
        { key: "D", text: "2010 (Llei 1/2010).", correct: false }
      ],
      explanation: "L'ISPC va ser creat per la Llei 10/2007, de 30 de juliol, integrant l'antiga Escola de Policia de Catalunya i l'Escola de Bombers.",
      hint: "Pensa en la llei aprovada l'any següent a l'entrada en vigor de l'Estatut d'Autonomia de 2006."
    },
    {
      id: 'q_ispc_2',
      topicIndex: 4,
      categoryName: 'ISPC Repte Global',
      categoryIcon: '🎓',
      question: "Segons el Codi Ètic de la Policia de Catalunya, quin és l'objectiu principal de la deontologia professional policial?",
      options: [
        { key: "A", text: "Garantir l'obediència cega als comandaments.", correct: false },
        { key: "B", text: "Assegurar la protecció dels drets humans i la confiança ciutadana mitjançant una conducta exemplar.", correct: true },
        { key: "C", text: "Establir el règim disciplinari i les sancions internes.", correct: false },
        { key: "D", text: "Definir les retribucions i complements dels agents.", correct: false }
      ],
      explanation: "El Codi d'Ètica posa el focus en el respecte irrenunciable als drets fonamentals, la dignitat humana i la legitimitat social.",
      hint: "La deontologia policial moderna no és un reglament sancionador sinó una guia de valors basada en els tractats internacionals de drets humans."
    }
  ],

  // 5: PREGUNTES REALS D'EXAMEN OFICIAL MOSSOS D'ESQUADRA (Convocatòries Anteriors)
  5: [
    {
      id: 'real_exam_1',
      topicIndex: 5,
      categoryName: "Preguntes Reals d'Examen Oficial",
      categoryIcon: '📝',
      question: "En quines dues direccions va iniciar l'expansió de la corona catalanoaragonesa Jaume I el Conqueridor segons la Guia Oficial?",
      options: [
        { key: "A", text: "La Mediterrània i el sud peninsular.", correct: true },
        { key: "B", text: "La Mediterrània i l'oest peninsular.", correct: false },
        { key: "C", text: "El nord i el sud peninsular.", correct: false },
        { key: "D", text: "El sud peninsular i l'Occitània.", correct: false }
      ],
      explanation: "Examen oficial: Jaume I dirigí l'expansió cap a les Illes Balears (Mediterrània) i cap al Regne de València (sud peninsular).",
      hint: "Analitza la conquesta de les Illes Balears i la reconquesta cap a terres valencianes del monarca medieval.",
      isRealExam: true
    },
    {
      id: 'real_exam_2',
      topicIndex: 5,
      categoryName: "Preguntes Reals d'Examen Oficial",
      categoryIcon: '📝',
      question: "Quina és la durada màxima legal de la detenció preventiva sense autorització judicial segons l'article 17.2 de la Constitució?",
      options: [
        { key: "A", text: "24 hores improrrogables en qualsevol supòsit.", correct: false },
        { key: "B", text: "El temps estrictament necessari per a les esbrinacions, amb un màxim de 72 hores.", correct: true },
        { key: "C", text: "48 hores comunicades al Ministeri Fiscal.", correct: false },
        { key: "D", text: "7 dies si ho acorda el cap de la comissaria.", correct: false }
      ],
      explanation: "Examen oficial: L'article 17.2 CE estableix que no pot superar el temps estrictament necessari amb un topall màxim general de 72 hores.",
      hint: "El precepte constitucional estableix un doble criteri: un principi temporal finalista i un topall màxim d'hores previ al pas a disposició judicial.",
      isRealExam: true
    },
    {
      id: 'real_exam_3',
      topicIndex: 5,
      categoryName: "Preguntes Reals d'Examen Oficial",
      categoryIcon: '📝',
      question: "Segons l'article 550 del Codi Penal vigent, comet delicte d'atemptat qui agredeixi o s'oposi amb violència greu a:",
      options: [
        { key: "A", text: "L'autoritat, als seus agents o funcionaris públics en exercici de les seves funcions.", correct: true },
        { key: "B", text: "Únicament als membres de la carrera judicial o fiscal.", correct: false },
        { key: "C", text: "Només a comandaments superiors de l'escala executiva.", correct: false },
        { key: "D", text: "Exclusivament als agents que portin arma de foc reglamentària.", correct: false }
      ],
      explanation: "L'art. 550 CP protegeix penalment el principi d'autoritat i tots els seus agents en l'exercici legítim de les seves funcions.",
      hint: "La protecció penal de l'atemptat empara a tot el conjunt d'agents i servidors públics en servei, sense distingir cossos ni escales de rang.",
      isRealExam: true
    },
    {
      id: 'real_exam_4',
      topicIndex: 5,
      categoryName: "Preguntes Reals d'Examen Oficial",
      categoryIcon: '📝',
      question: "D'acord amb la Llei 16/1991, de les policies locals de Catalunya, quin és el comandament suprem del cos de la policia local?",
      options: [
        { key: "A", text: "L'alcalde o alcaldessa del municipi.", correct: true },
        { key: "B", text: "El cap del cos de la policia local.", correct: false },
        { key: "C", text: "El conseller o consellera d'Interior.", correct: false },
        { key: "D", text: "El plenari municipal per majoria absoluta.", correct: false }
      ],
      explanation: "L'article 27 de la Llei 16/1991 estipula que el comandament suprem de la policia local correspon a l'alcalde/essa.",
      hint: "Recorda la màxima autoritat política unipersonal de l'administració municipal.",
      isRealExam: true
    },
    {
      id: 'real_exam_5',
      topicIndex: 5,
      categoryName: "Preguntes Reals d'Examen Oficial",
      categoryIcon: '📝',
      question: "Quin decret va regular la creació del distintiu oficial de les quatre barres a la solapa del pit dels Mossos d'Esquadra?",
      options: [
        { key: "A", text: "Decret 184/1995, de regulació de l'uniforme i distintius del cos.", correct: true },
        { key: "B", text: "Decret 1/1980, de restauració de les institucions.", correct: false },
        { key: "C", text: "Decret 50/2021, del reglament d'armes.", correct: false },
        { key: "D", text: "Ordre INT/300/2018.", correct: false }
      ],
      explanation: "El Decret 184/1995 va establir el disseny i posició reglamentària de l'escut sobre el pit amb l'emblema de les quatre barres.",
      hint: "Es va aprovar a mitjan dècada dels 90, un any després de la promulgació de la Llei 10/1994 del cos.",
      isRealExam: true
    }
  ]
};

// Returns question for topicIndex (0 to 5)
export function getDuelQuestion(topicIndex: number): DuelQuestionItem {
  // If topicIndex === -1 or 5 -> real exam question
  const actualIndex = topicIndex === -1 ? 5 : topicIndex;
  const localList = HTML_QUESTIONS_TOPICS[actualIndex] || HTML_QUESTIONS_TOPICS[0];

  // If topic is 5 (Preguntes Reals), also mix in questionsBank items tagged with REAL_EXAM_
  if (actualIndex === 5) {
    const realBankQuestions = QUESTIONS_BANK.filter(q => q.id.startsWith('REAL_EXAM_') || q.id.includes('OFICIAL'));
    if (realBankQuestions.length > 0 && Math.random() < 0.4) {
      const raw = realBankQuestions[Math.floor(Math.random() * realBankQuestions.length)];
      const keys = ['A', 'B', 'C', 'D'];
      return {
        id: raw.id,
        topicIndex: 5,
        categoryName: "Preguntes Reals d'Examen Oficial",
        categoryIcon: '📝',
        question: raw.pregunta,
        options: raw.opcions.map((optText, idx) => ({
          key: keys[idx] || String(idx),
          text: optText,
          correct: idx === raw.resposta
        })),
        explanation: `${raw.explicacio} ${raw.guiaPagina ? `(${raw.guiaPagina})` : ''}`,
        hint: "Analitza detingudament els requisits legals i descarta les alternatives que inclouen terminis o competències incongruents.",
        isRealExam: true
      };
    }
    const q = localList[Math.floor(Math.random() * localList.length)];
    return q;
  }

  // Pick random question from list
  const q = localList[Math.floor(Math.random() * localList.length)];
  return q;
}
