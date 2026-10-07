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
  // =========================================================================
  // ÀMBIT A: CONEIXEMENTS DE L'ENTORN (7 TEMES)
  // =========================================================================
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
  {
    id: 'tema_a2',
    ambit: 'Àmbit A',
    ambitName: "Coneixements de l'Entorn",
    code: 'Tema A.2',
    title: 'Història de Catalunya (part II)',
    subtitle: "Del segle XIX i la Revolució Industrial fins a la recuperació democràtica",
    description: "La Guerra del Francès, les guerres carlines, la industrialització catalana, la Renaixença, el catalanisme polític, la Mancomunitat, la República, la Guerra Civil, el franquisme i la Transició.",
    icon: '🏭',
    recommendedQuestions: 5,
    subtopics: [
      { id: 'a2_1', num: '1', title: "Revolució industrial i conflictes del s. XIX", description: "Guerra del Francès, carlisme, vapor, fàbriques tèxtils i moviment obrer." },
      { id: 'a2_2', num: '2', title: "La Renaixença i el catalanisme polític", description: "Bases de Manresa (1892), Solidaritat Catalana i creació de la Mancomunitat de Catalunya (1914)." },
      { id: 'a2_3', num: '3', title: "República, Guerra Civil i franquisme", description: "Estatut de Núria de 1932, Generalitat republicana, dictadura franquista i resistència clandestina." },
      { id: 'a2_4', num: '4', title: "La Transició i recuperació de l'autogovern", description: "Retorn del president Tarradellas (1977), Constitució de 1978 i restabliment estatutari." }
    ]
  },
  {
    id: 'tema_a3',
    ambit: 'Àmbit A',
    ambitName: "Coneixements de l'Entorn",
    code: 'Tema A.3',
    title: 'Història de la policia a Catalunya',
    subtitle: "Dels batlles i sometents a les Esquadres de Paisans i la policia autonòmica",
    description: "Orígens medievals, sometent, Pere Anton Veciana a Valls (1719), dissolució i restabliment del Cos de Mossos d'Esquadra fins al traspàs integral de competències.",
    icon: '🛡️',
    recommendedQuestions: 5,
    subtopics: [
      { id: 'a3_1', num: '1', title: "Orígens i Esquadres de Paisans (1719)", description: "Creació per Pere Anton Veciana a Valls contra els miquelets carrasquets." },
      { id: 'a3_2', num: '2', title: "Evolució durant els segles XIX i XX", description: "Militarització, dissolució republicana, secció d'honor del franquisme i refundació democràtica." },
      { id: 'a3_3', num: '3', title: "Desplegament com a policia integral", description: "Llei 10/1994, desplegament territorial per comarques i substitució de les forces estatals." }
    ]
  },
  {
    id: 'tema_a4',
    ambit: 'Àmbit A',
    ambitName: "Coneixements de l'Entorn",
    code: 'Tema A.4',
    title: 'Àmbit sociolingüístic',
    subtitle: "Llengua pròpia, règim d'oficialitat, sociolingüística i aranès",
    description: "El català com a llengua pròpia i oficial de Catalunya, el castellà com a llengua oficial, l'aranès a l'Aran, drets lingüístics i Llei de política lingüística.",
    icon: '🗣️',
    recommendedQuestions: 5,
    subtopics: [
      { id: 'a4_1', num: '1', title: "Règim jurídic de les llengües a Catalunya", description: "Article 6 de l'EAC, cooficialitat, drets lingüístics i deure de coneixement." },
      { id: 'a4_2', num: '2', title: "Ús social, normalització i l'occità aranès", description: "Estatut de l'aranès a l'Aran (Llei 35/2010), polítiques de foment i realitat sociolingüística." }
    ]
  },
  {
    id: 'tema_a5',
    ambit: 'Àmbit A',
    ambitName: "Coneixements de l'Entorn",
    code: 'Tema A.5',
    title: 'Marc geogràfic de Catalunya',
    subtitle: "Relleu, hidrografia, clima, comarques, vegueries i eixos de comunicació",
    description: "Unitats de relleu (Pirineus, Serralades Costaneres, Depressió Central), conques hidrogràfiques internes i de l'Ebre, dominis climàtics, capitals de comarca i organització en vegueries.",
    icon: '🗺️',
    recommendedQuestions: 5,
    subtopics: [
      { id: 'a5_1', num: '1', title: "Relleu, hidrografia i clima", description: "Sistemes muntanyosos, rius principals (Ter, Llobregat, Segre, Ebre) i regions climàtiques." },
      { id: 'a5_2', num: '2', title: "Comarques, vegueries i xarxa viària", description: "Les 42 comarques i capitals, 8 vegueries oficials i principals autopistes i autovies." }
    ]
  },
  {
    id: 'tema_a6',
    ambit: 'Àmbit A',
    ambitName: "Coneixements de l'Entorn",
    code: 'Tema A.6',
    title: 'Entorn social a Catalunya',
    subtitle: "Estructura demogràfica, immigració, serveis socials, educació i salut",
    description: "Població, envelliment, moviments migratoris, cohesió social, mercat de treball i estructura econòmica de Catalunya.",
    icon: '👥',
    recommendedQuestions: 5,
    subtopics: [
      { id: 'a6_1', num: '1', title: "Demografia i fluxos migratoris", description: "Població de Catalunya, piràmides d'edat, natalitat, mortalitat i integració migratòria." },
      { id: 'a6_2', num: '2', title: "Economia, ocupació i estat del benestar", description: "Sectors econòmics (serveis, indústria, primari), mercat laboral i serveis públics." }
    ]
  },
  {
    id: 'tema_a7',
    ambit: 'Àmbit A',
    ambitName: "Coneixements de l'Entorn",
    code: 'Tema A.7',
    title: 'Les tecnologies de la informació en el segle XXI',
    subtitle: "Societat del coneixement, seguretat de la informació i ciberdelinqüència",
    description: "Administració digital, signatura electrònica, xarxes socials, delictes informàtics, protecció de dades (RGPD) i ciberseguretat policial.",
    icon: '💻',
    recommendedQuestions: 5,
    subtopics: [
      { id: 'a7_1', num: '1', title: "Administració electrònica i identitat digital", description: "Llei 39/2015, certificat digital, seu electrònica i drets digitals de la ciutadania." },
      { id: 'a7_2', num: '2', title: "Ciberseguretat, RGPD i cibercrim", description: "Protecció de dades (LO 3/2018), tipus de ciberatacs i unitats especialitzades de mossos." }
    ]
  },

  // =========================================================================
  // ÀMBIT B: INSTITUCIONAL (8 TEMES)
  // =========================================================================
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
  {
    id: 'tema_b2',
    ambit: 'Àmbit B',
    ambitName: 'Institucional',
    code: 'Tema B.2',
    title: 'Les institucions polítiques de Catalunya',
    subtitle: "Parlament, Presidència de la Generalitat, Govern i òrgans de control",
    description: "Composició i funcions del Parlament de Catalunya, elecció i atribucions del President, el Consell Executiu, el Síndic de Greuges, la Sindicatura de Comptes i el Consell de Garanties Estatutàries.",
    icon: '🏛️',
    recommendedQuestions: 5,
    subtopics: [
      { id: 'b2_1', num: '1', title: "El Parlament de Catalunya", description: "Estatut dels diputats, funcions legislatives, pressupostàries i de control al Govern." },
      { id: 'b2_2', num: '2', title: "El President i el Govern de la Generalitat", description: "Investidura, nomenament de consellers, potestat reglamentària i responsabilitat política." },
      { id: 'b2_3', num: '3', title: "Òrgans estatutaris de garantia i control", description: "Síndic de Greuges, Sindicatura de Comptes i Consell de Garanties Estatutàries." }
    ]
  },
  {
    id: 'tema_b3',
    ambit: 'Àmbit B',
    ambitName: 'Institucional',
    code: 'Tema B.3',
    title: 'L’ordenament jurídic de l’Estat',
    subtitle: "Constitució espanyola de 1978, jerarquia normativa i fonts del Dret",
    description: "Principis constitucionals, procediments de reforma constitucional, lleis orgàniques, lleis ordinàries, decrets llei, decrets legislatius, reglaments i el principi de legalitat.",
    icon: '📜',
    recommendedQuestions: 5,
    subtopics: [
      { id: 'b3_1', num: '1', title: "La Constitució de 1978 i principis estructurals", description: "Estat social i democràtic de Dret, sobirania nacional i monarquia parlamentària." },
      { id: 'b3_2', num: '2', title: "Les fonts del Dret i jerarquia normativa", description: "Llei orgànica, ordinària, decret llei, decret legislatiu i reglaments administratius." }
    ]
  },
  {
    id: 'tema_b4',
    ambit: 'Àmbit B',
    ambitName: 'Institucional',
    code: 'Tema B.4',
    title: 'Els drets humans i els drets constitucionals',
    subtitle: "Declaració Universal, Títol I de la CE, garanties i suspensió de drets",
    description: "Drets fonamentals i llibertats públiques (arts. 14 a 29 CE), procediment preferent i sumari, recurs d'empara davant el TC, Defensor del Poble i estats d'alarma, excepció i setge.",
    icon: '🕊️',
    recommendedQuestions: 5,
    subtopics: [
      { id: 'b4_1', num: '1', title: "Drets fonamentals i llibertats públiques", description: "Arts. 14 a 29 CE: dret a la vida, llibertat personal, intimitat, expressió i reunió." },
      { id: 'b4_2', num: '2', title: "Garanties i suspensió de drets", description: "Recurs d'empara, Habeas Corpus, tutela judicial efectiva i estats excepcionals (art. 55 CE)." }
    ]
  },
  {
    id: 'tema_b5',
    ambit: 'Àmbit B',
    ambitName: 'Institucional',
    code: 'Tema B.5',
    title: 'Les institucions polítiques de l’Estat',
    subtitle: "Corona, Corts Generals, Govern de l'Estat i relacions entre poders",
    description: "La Corona com a cap d'Estat, Congrés dels Diputats i Senat, composició i funcions del Govern central, moció de censura i qüestió de confiança.",
    icon: '👑',
    recommendedQuestions: 5,
    subtopics: [
      { id: 'b5_1', num: '1', title: "La Corona i les Corts Generals", description: "Funcions del Rei, bicameralisme, elaboració de lleis i control al Govern." },
      { id: 'b5_2', num: '2', title: "El Govern de l'Estat i l'Administració central", description: "Presidència del Govern, Consell de Ministres i responsabilitat política." }
    ]
  },
  {
    id: 'tema_b6',
    ambit: 'Àmbit B',
    ambitName: 'Institucional',
    code: 'Tema B.6',
    title: 'Els òrgans jurisdiccionals',
    subtitle: "Poder judicial, Tribunal Constitucional, CGPJ i Ministeri Fiscal",
    description: "Independència judicial, Consell General del Poder Judicial, Tribunal Suprem, Tribunal Constitucional, Tribunal Superior de Justícia de Catalunya (TSJC) i Ministeri Fiscal.",
    icon: '⚖️',
    recommendedQuestions: 5,
    subtopics: [
      { id: 'b6_1', num: '1', title: "El Poder Judicial i el CGPJ", description: "Jutjats i tribunals, unitat jurisdiccional, independència i estatut dels jutges." },
      { id: 'b6_2', num: '2', title: "Tribunal Constitucional, TSJC i Ministeri Fiscal", description: "Control de constitucionalitat, TSJC a Catalunya i principis del Ministeri Fiscal." }
    ]
  },
  {
    id: 'tema_b7',
    ambit: 'Àmbit B',
    ambitName: 'Institucional',
    code: 'Tema B.7',
    title: 'L’organització territorial de l’Estat',
    subtitle: "Principi d'autonomia, comunitats autònomes, províncies i municipis",
    description: "L'Estat de les autonomies (art. 2 i Títol VIII CE), distribució de competències entre Estat i CCAA, províncies, diputacions i règim municipal (Llei 7/1985).",
    icon: '🏙️',
    recommendedQuestions: 5,
    subtopics: [
      { id: 'b7_1', num: '1', title: "L'Estat autonòmic i competències", description: "Principis de solidaritat, igualtat territorial i vies d'accés a l'autonomia (arts. 143 i 151 CE)." },
      { id: 'b7_2', num: '2', title: "Administració local i règim municipal", description: "Municipi, ajuntament, alcalde, ple municipal i competències locals de seguretat." }
    ]
  },
  {
    id: 'tema_b8',
    ambit: 'Àmbit B',
    ambitName: 'Institucional',
    code: 'Tema B.8',
    title: 'La Unió Europea',
    subtitle: "Institucions comunitàries, Dret europeu, tractats i cooperació policial",
    description: "Parlament Europeu, Consell Europeu, Consell de la UE, Comissió Europea, TJUE, tractats de Roma a Lisboa, directives i reglaments, i l'Espai Schengen.",
    icon: '🇪🇺',
    recommendedQuestions: 5,
    subtopics: [
      { id: 'b8_1', num: '1', title: "Institucions de la Unió Europea", description: "Comissió, Parlament Europeu, Consell i Tribunal de Justícia de la UE." },
      { id: 'b8_2', num: '2', title: "Fonts del Dret de la UE i Espai Schengen", description: "Reglaments, directives, decisions, efecte directe, primacia i tractat de Schengen." }
    ]
  },

  // =========================================================================
  // ÀMBIT C: SEGURETAT CIUTADANA I ORDRE PÚBLIC (5 TEMES)
  // =========================================================================
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
  {
    id: 'tema_c2',
    ambit: 'Àmbit C',
    ambitName: 'Seguretat Ciutadana i Ordre Públic',
    code: 'Tema C.2',
    title: 'El Departament d’Interior i Seguretat Pública',
    subtitle: "Estructura orgànica, Direcció General de la Policia i òrgans centrals",
    description: "Estructura del Departament, conseller/a, secretari/ària general, DGP, ISPC, SCT, CECAT, Direcció General de Protecció Civil i Direcció General d'Extinció d'Incendis.",
    icon: '🏢',
    recommendedQuestions: 5,
    subtopics: [
      { id: 'c2_1', num: '1', title: "Estructura orgànica del Departament", description: "Competències del titular del Departament, Secretaria General i direccions generals." },
      { id: 'c2_2', num: '2', title: "La Direcció General de la Policia (DGP)", description: "Estructura de la DGP, prefectura policial, comissaries superiors i serveis de suport." }
    ]
  },
  {
    id: 'tema_c3',
    ambit: 'Àmbit C',
    ambitName: 'Seguretat Ciutadana i Ordre Públic',
    code: 'Tema C.3',
    title: 'La coordinació policial',
    subtitle: "Llei 4/2003, Comissió de Policia de Catalunya i cooperació institucional",
    description: "Sistema de seguretat pública de Catalunya, coordinació entre Mossos d'Esquadra i Policies Locals, juntes locals de seguretat, convenis de col·laboració i cooperació amb FCSE.",
    icon: '🤝',
    recommendedQuestions: 5,
    subtopics: [
      { id: 'c3_1', num: '1', title: "La Llei 4/2003 i el sistema de seguretat pública", description: "Principis de complementarietat, informació mútua i canals de coordinació policial." },
      { id: 'c3_2', num: '2', title: "Juntes Locals de Seguretat i Comissió de Policia", description: "Composició de les juntes locals, coordinació operativa i plans locals de seguretat." }
    ]
  },
  {
    id: 'tema_c4',
    ambit: 'Àmbit C',
    ambitName: 'Seguretat Ciutadana i Ordre Públic',
    code: 'Tema C.4',
    title: 'El marc legal de la seguretat',
    subtitle: "Llei orgànica 2/1986 de FCS i Llei 10/1994 de la Policia de la Generalitat",
    description: "Principis bàsics d'actuació policial (art. 5 LOFCS), naturalesa i funcions del cos de Mossos d'Esquadra, jerarquia, deure d'intervenció permanent i règim estatutari.",
    icon: '📕',
    recommendedQuestions: 5,
    subtopics: [
      { id: 'c4_1', num: '1', title: "La Llei orgànica 2/1986 de forces i cossos de seguretat", description: "Principis bàsics d'actuació, adequació, proporcionalitat i relacions amb la ciutadania." },
      { id: 'c4_2', num: '2', title: "La Llei 10/1994 de la Policia de la Generalitat", description: "Estatut del personal, escales i categories, drets, deures i potestats dels membres de la PG-ME." }
    ]
  },
  {
    id: 'tema_c5',
    ambit: 'Àmbit C',
    ambitName: 'Seguretat Ciutadana i Ordre Públic',
    code: 'Tema C.5',
    title: 'El Codi deontològic policial',
    subtitle: "Ètica policial, Declaració del Consell d'Europa i règim disciplinari",
    description: "Declaració sobre la Policia (Resolució 690 del Consell d'Europa), Codi Europeu d'Ètica Policial, ús de la força i armes de foc, secret professional i règim disciplinari (faltes i sancions).",
    icon: '🎖️',
    recommendedQuestions: 5,
    subtopics: [
      { id: 'c5_1', num: '1', title: "Ètica policial i tractament de ciutadans i detinguts", description: "Resolució 690 del Consell d'Europa, respecte a la dignitat humana i prevenció de maltractaments." },
      { id: 'c5_2', num: '2', title: "Règim disciplinari dels Mossos d'Esquadra", description: "Faltes molt greus, greus i lleus segons la Llei 10/1994, prescripcions i procediment sancionador." }
    ]
  },

  // =========================================================================
  // ÀMBIT D: ACTUALITAT I CULTURA GENERAL (TEMA ÚNIC)
  // =========================================================================
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
 * Si l'opositor fa dies que no repassa un tema o subtema, el domini baixa gradualment.
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
  const lastTime = record.lastPlayedAt || (record as any).lastActivityTimestamp || Date.now();
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
 * Càlcul del Progrés de Cobertura Global del Temari (%) tenint en compte temes i subnodes
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
    const directRecord = topicMasteryMap[topic.id];
    const { currentMastery, tier, isCriticalAlert } = calculateTopicMasteryWithDecay(directRecord);
    
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
