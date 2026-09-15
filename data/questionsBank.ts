import { Question, QuestionAmbit } from '../types';

export const QUESTIONS_BANK: Question[] = [
  // --- ÀMBIT A: CONEIXEMENTS DE L'ENTORN ---
  {
    id: 'MOSSOS_A1_001',
    ambit: 'Àmbit A',
    seccio: 'Història de Catalunya (part I)',
    temaId: 'A1',
    pregunta: "Com va definir l'historiador Vicens Vives el territori de Catalunya pel que fa al seu passat remot?",
    opcions: [
      "Com a 'refugi' i 'porta'",
      "Com a 'redós' i 'passadís'",
      "Com a 'encreuament' i 'frontera'",
      "Com a 'pas' i 'baluard'"
    ],
    resposta: 1,
    explicacio: "L’historiador Vicens Vives va definir Catalunya com a “redós” (on es configuraran cultures pròpies) i “passadís” (per on circularan tota mena de pobles vinguts de fora).",
    guiaPagina: 'Pàg. 12',
    guiaTema: 'Tema A.1',
    clauTribunal: "Els conceptes exactes són 'redós' (on cristal·litzen cultures) i 'passadís' (d'intercanvi). Paraula trampa freqüent: refugi o cruïlla."
  },
  {
    id: 'MOSSOS_A1_002',
    ambit: 'Àmbit A',
    seccio: 'Història de Catalunya (part I)',
    temaId: 'A1',
    pregunta: "Segons la Guia d'estudi oficial, quina és la resta humana més antiga trobada al territori català i al seu entorn immediat?",
    opcions: [
      "La mandíbula de Banyoles",
      "L'home de Talteüll",
      "Les restes del jaciment d'Empúries",
      "L'home de Neanderthal de Sitges"
    ],
    resposta: 1,
    explicacio: "La resta humana més antiga és l’home de Talteüll, al Rosselló, de fa uns 450.000 anys.",
    guiaPagina: 'Pàg. 12',
    guiaTema: 'Tema A.1',
    clauTribunal: "No confondre: Talteüll té 450.000 anys (la més antiga). La mandíbula de Banyoles té uns 70.000 anys."
  },
  {
    id: 'REAL_EXAM_2021_Q1',
    ambit: 'Àmbit A',
    seccio: 'Història de Catalunya (part I)',
    temaId: 'A1',
    pregunta: "En quines dues direccions va iniciar l'expansió de la corona catalanoaragonesa Jaume I el Conqueridor?",
    opcions: [
      "La Mediterrània i el sud peninsular.",
      "La Mediterrània i l'oest peninsular.",
      "El nord i el sud peninsular.",
      "El sud peninsular i l'Occitània."
    ],
    resposta: 0,
    explicacio: "Jaume I inicià l’expansió de la corona catalanoaragonesa en dues direccions: la Mediterrània (Mallorca, Menorca, Eivissa) i el sud peninsular (València).",
    guiaPagina: 'Pàg. 14',
    guiaTema: 'Tema A.1',
    clauTribunal: "Pregunta oficial d'examen 2021. Direccions exactes: Mediterrània (marítima) i sud peninsular (València fins Alacant/Múrcia)."
  },
  {
    id: 'REAL_EXAM_2022_Q1',
    ambit: 'Àmbit A',
    seccio: 'Història de Catalunya (part I)',
    temaId: 'A1',
    pregunta: "Fins a on es van expandir les fronteres de la Catalunya Nova al segle XII?",
    opcions: [
      "Tortosa, Jaca i Solsona.",
      "Balaguer, Tortosa i Fraga.",
      "Solsona, Fraga i Lleida.",
      "Tortosa, Lleida i Fraga."
    ],
    resposta: 3,
    explicacio: "L'expansió porta les fronteres de Catalunya fins a Tortosa el 1148 i a Lleida i Fraga el 1149.",
    guiaPagina: 'Pàg. 14',
    guiaTema: 'Tema A.1',
    clauTribunal: "Pregunta oficial d'examen 2022. La tríada clau de la Catalunya Nova és Tortosa (1148), Lleida i Fraga (1149)."
  },
  {
    id: 'REAL_EXAM_2025_Q25_GENOVA',
    ambit: 'Àmbit A',
    seccio: 'Història de Catalunya (part I)',
    temaId: 'A1',
    pregunta: "Segons la Guia d'estudi, mitjançant la signatura de quin pacte Catalunya va donar suport a l'arxiduc Carles durant la Guerra de Successió?",
    opcions: [
      "Pacte de París.",
      "Pacte de Florència.",
      "Pacte de Sardenya.",
      "Pacte de Gènova."
    ],
    resposta: 3,
    explicacio: "El 20 de juny de 1705 Catalunya va signar amb Anglaterra el Pacte de Gènova, donant suport a l’arxiduc Carles a canvi d'ajut militar i respecte a les constitucions catalanes.",
    guiaPagina: 'Pàg. 17',
    guiaTema: 'Tema A.1',
    clauTribunal: "Pregunta oficial d'examen 2025. Data i ciutat: 20 de juny de 1705, Pacte de GÈNOVA amb Anglaterra."
  },
  {
    id: 'MOSSOS_A2_005',
    ambit: 'Àmbit A',
    seccio: 'Història de Catalunya (part II)',
    temaId: 'A2',
    pregunta: "Quin any es va fundar la fàbrica Bonaplata a Barcelona, sent la primera accionada per vapor a Espanya?",
    opcions: [
      "1812",
      "1833",
      "1848",
      "1868"
    ],
    resposta: 1,
    explicacio: "El 1833 es fundà a Barcelona la fàbrica Bonaplata, la primera accionada per vapor a Catalunya i Espanya (posteriorment incendiada pel moviment ludista).",
    guiaPagina: 'Pàg. 22',
    guiaTema: 'Tema A.2',
    clauTribunal: "1833 és un any doblement clau: Fàbrica Bonaplata (inici industrial) i poema 'La Pàtria' d'Aribau (inici de la Renaixença)."
  },
  {
    id: 'REAL_EXAM_2022_Q5',
    ambit: 'Àmbit A',
    seccio: 'Història de Catalunya (part II)',
    temaId: 'A2',
    pregunta: "Quin factor va ser el desencadenant de la Setmana Tràgica el juliol de 1909?",
    opcions: [
      "La crida de reservistes per anar a lluitar a Cuba.",
      "L'assalt a la redacció de la Veu de Catalunya per part d'un grup de militars.",
      "Les diferències entre la Lliga i Solidaritat Catalana.",
      "La crida de reservistes per anar a lluitar al Marroc contra les cabiles rifenyes."
    ],
    resposta: 3,
    explicacio: "La Setmana Tràgica (juliol de 1909) fou una revolta popular provocada per la mobilització de reservistes (la majoria de classe obrera que no podia pagar la redempció) cap a la Guerra del Marroc.",
    guiaPagina: 'Pàg. 24',
    guiaTema: 'Tema A.2',
    clauTribunal: "Pregunta oficial d'examen 2022. Destinació: Marroc (cabiles rifenyes), NO Cuba (Cuba fou el 1898)."
  },
  {
    id: 'MOSSOS_A3_007',
    ambit: 'Àmbit A',
    seccio: 'Història de la policia a Catalunya',
    temaId: 'A3',
    pregunta: "Quin any fou nomenat Pere Anton Veciana i Rabasa comandant en cap de les Esquadres de Catalunya?",
    opcions: [
      "1719",
      "1721",
      "1723",
      "1736"
    ],
    resposta: 2,
    explicacio: "L’any 1723 es van remodelar i ampliar les esquadres i Pere Anton Veciana i Rabasa en fou nomenat el comandant en cap. Les esquadres havien nascut el 1719 i s'havien mantingut a Valls el 1721.",
    guiaPagina: 'Pàg. 34',
    guiaTema: 'Tema A.3',
    clauTribunal: "Dates clau de Veciana: 1719 (primeres esquadres de paisans), 1721 (reorganització a Valls), 1723 (comandant en cap únic)."
  },
  {
    id: 'REAL_EXAM_2022_Q19_DESPLEGAMENT',
    ambit: 'Àmbit A',
    seccio: 'Història de la policia a Catalunya',
    temaId: 'A3',
    pregunta: "El procés de desplegament territorial dels Mossos d’Esquadra es va culminar l’any 2008 amb l’arribada del cos a la:",
    opcions: [
      "Regió Policial Pirineu Occidental i la Regió Policial Ponent.",
      "Regió Policial Terres de l’Ebre i la Regió Policial Ponent.",
      "Regió Policial Camp de Tarragona i la Regió Policial Pirineu Occidental.",
      "Regió Policial Camp de Tarragona i la Regió Policial Terres de l’Ebre."
    ],
    resposta: 3,
    explicacio: "El novembre de 2008 va significar la culminació del desplegament territorial començat a Osona el 1994, amb l'arribada a les Terres de l'Ebre i al Camp de Tarragona.",
    guiaPagina: 'Pàg. 37',
    guiaTema: 'Tema A.3',
    clauTribunal: "Pregunta oficial d'examen 2022. Desplegament: inici a Osona (novembre 1994), final a Terres de l'Ebre i Camp de Tarragona (novembre 2008)."
  },
  {
    id: 'REAL_EXAM_2021_Q28_A7_SEG',
    ambit: 'Àmbit A',
    seccio: 'Les tecnologies de la informació en el segle XXI',
    temaId: 'A7',
    pregunta: "A diferència de la seguretat de la informació, la seguretat informàtica:",
    opcions: [
      "S'associa a aspectes tècnics i operacionals de la seguretat.",
      "Es basa en els aspectes estratègics que tenen a veure amb la seguretat d'una manera més generalitzada.",
      "S'associa a la gestió de riscos, amenaces, anàlisi de diversos escenaris i de bones pràctiques dins l'organització.",
      "Té l'objectiu d'assegurar la confidencialitat, integritat i disponibilitat en l'ús de la informació."
    ],
    "resposta": 0,
    explicacio: "La seguretat informàtica s'associa estrictament als aspectes tècnics i operacionals (antivirus, tallafocs), mentre que la seguretat de la informació és estratègica i corporativa (gestió de riscos, CID).",
    guiaPagina: 'Pàg. 88',
    guiaTema: 'Tema A.7',
    clauTribunal: "Pregunta oficial d'examen 2021. Paraules clau: Seguretat Informàtica = 'tècnics i operacionals'. Seguretat de la informació = 'estratègics i governança'."
  },
  {
    id: 'REAL_EXAM_2023_Q22_A7_SIGNATURA',
    ambit: 'Àmbit A',
    seccio: 'Les tecnologies de la informació en el segle XXI',
    temaId: 'A7',
    pregunta: "La signatura electrònica permet que un emissor pugui enviar missatges a un receptor complint les tres propietats següents:",
    opcions: [
      "Austeritat, interès i no reemborsament.",
      "Emmagatzemable, intel·ligibilitat i no repetició.",
      "Autenticitat, integritat i no repudi.",
      "Automatització, interacció i no retorn."
    ],
    resposta: 2,
    explicacio: "Les tres propietats jurídiques i tècniques fonamentals de la signatura electrònica són: Autenticitat (identitat de l'emissor), Integritat (el document no s'ha alterat) i No repudi (l'emissor no pot negar l'enviament).",
    guiaPagina: 'Pàg. 89',
    guiaTema: 'Tema A.7',
    clauTribunal: "Pregunta oficial d'examen 2023. Memoritza la tríada: Autenticitat, Integritat i No repudi!"
  },

  // --- ÀMBIT B: ÀMBIT INSTITUCIONAL ---
  {
    id: 'REAL_EXAM_2025_Q10_B1_TRANSIT',
    ambit: 'Àmbit B',
    seccio: 'L’Estatut d’autonomia de Catalunya (EAC)',
    temaId: 'B1',
    pregunta: "Segons l'Estatut d'autonomia de Catalunya (article 164.1), quina d'aquestes és una competència PRÒPIA de la Generalitat?",
    opcions: [
      "La creació de l’examen per obtenir el carnet de conduir.",
      "El control i la vigilància del trànsit.",
      "La matriculació de vehicles.",
      "L’expedició de llicències de circulació."
    ],
    resposta: 1,
    explicacio: "L'article 164.1 de l'EAC estableix que el control i vigilància del trànsit és competència PRÒPIA de la Generalitat (Servei Català de Trànsit), no pas delegada. Les matèries d'exàmens, permisos i matriculació continuen sent de la DGT estatal.",
    guiaPagina: 'Pàg. 104 i 181',
    guiaTema: 'Tema B.1 i C.1',
    clauTribunal: "Pregunta oficial d'examen 2025. Trampa habitual: la matriculació i els exàmens de carnet NO són de la Generalitat, només la vigilància i regulació del trànsit!"
  },
  {
    id: 'MOSSOS_B1_022_JUNTA_SEG',
    ambit: 'Àmbit B',
    seccio: 'L’Estatut d’autonomia de Catalunya (EAC)',
    temaId: 'B1',
    pregunta: "Quina persona presideix la Junta de Seguretat de Catalunya i quina és la seva composició?",
    opcions: [
      "El Ministre de l'Interior, amb 10 membres estatals i 5 catalans.",
      "El Director General de la Policia, amb composició rotatòria.",
      "El president o presidenta de la Generalitat, amb composició paritària (5/5).",
      "El President del Tribunal Superior de Justícia, amb 8 magistrats."
    ],
    resposta: 2,
    explicacio: "La Junta de Seguretat de Catalunya és un òrgan paritari format per 5 representants de l'Estat i 5 de la Generalitat, i és presidida pel/per la president/a de la Generalitat.",
    guiaPagina: 'Pàg. 105 i 208',
    guiaTema: 'Tema B.1 i C.3',
    clauTribunal: "Presidida SEMPRE pel President de la Generalitat (no pel Ministre de l'Interior ni pel Conseller) i paritària 5 i 5."
  },
  {
    id: 'REAL_EXAM_2022_Q6_PRESIDENT',
    ambit: 'Àmbit B',
    seccio: 'Les institucions polítiques de Catalunya',
    temaId: 'B2',
    pregunta: "El/la president/a de la Generalitat ha de ser elegit/da pel Parlament de Catalunya entre els seus membres per majoria:",
    opcions: [
      "Simple en primera votació o per majoria absoluta al cap de 72 hores.",
      "Absoluta en primera votació o per majoria simple al cap de 48 hores.",
      "Simple en primera votació o per majoria absoluta al cap de 48 hores.",
      "Absoluta en primera votació o per majoria simple al cap de 72 hores."
    ],
    resposta: 1,
    explicacio: "L'elecció exigeix majoria absoluta en primera votació (la meitat més un dels 135 diputats, és a dir 68). Si no s'assoleix, se sotmet a una segona votació 48 hores després, on n'hi ha prou amb majoria simple (més vots a favor que en contra).",
    guiaPagina: 'Pàg. 112',
    guiaTema: 'Tema B.2',
    clauTribunal: "Pregunta repetida en múltiples convocatòries (2022, 2025). Trampa freqüent: posar 72 hores en comptes de 48 hores!"
  },
  {
    id: 'REAL_EXAM_2021_Q5_PRERROGATIVES',
    ambit: 'Àmbit B',
    seccio: 'Les institucions polítiques de Catalunya',
    temaId: 'B2',
    pregunta: "De quines tres prerrogatives gaudeixen els/les diputats/des del Parlament de Catalunya?",
    opcions: [
      "Inamovibilitat, immunitat i inviolabilitat.",
      "Fur, inviolabilitat i inamovibilitat.",
      "Fur, imparcialitat i inamovibilitat.",
      "Immunitat, fur i inviolabilitat."
    ],
    resposta: 3,
    explicacio: "Els parlamentaris gaudeixen de: Inviolabilitat (per les opinions i vots expressats en exercici del càrrec), Immunitat (només detenció per delicte flagrant) i Fur especial (TSJC a Catalunya i Tribunal Suprem fora). L'inamovibilitat i imparcialitat són de jutges!",
    guiaPagina: 'Pàg. 109',
    guiaTema: 'Tema B.2',
    clauTribunal: "Pregunta oficial d'examen 2021. Alerta amb la paraula 'inamovibilitat': aquesta és pròpia de la carrera judicial, MAI dels parlamentaris."
  },
  {
    id: 'MOSSOS_B3_022_DECRET_LLEI',
    ambit: 'Àmbit B',
    seccio: 'L’ordenament jurídic de l’Estat',
    temaId: 'B3',
    pregunta: "Quin és el termini de vigència provisional d'un Decret llei abans de ser sotmès a convalidació pel Congrés dels Diputats?",
    opcions: [
      "15 dies naturals.",
      "30 dies següents a la promulgació.",
      "60 dies hàbils.",
      "Un any de caràcter prorrogable."
    ],
    resposta: 1,
    explicacio: "El decret llei (article 86 CE) té una vigència provisional limitada a 30 dies a partir de la seva promulgació, període en què el Congrés l'ha de convalidar o derogar.",
    guiaPagina: 'Pàg. 124',
    guiaTema: 'Tema B.3',
    clauTribunal: "Termini clau: 30 dies. Convalidat pel Congrés dels Diputats (el Senat no intervé en la convalidació de decrets llei)."
  },
  {
    id: 'REAL_EXAM_2024_Q9_HABEAS_CORPUS',
    ambit: 'Àmbit B',
    seccio: 'Els drets humans i els drets constitucionals',
    temaId: 'B4',
    pregunta: "Quina es considera una de les garanties del dret a la llibertat davant una detenció il·legal?",
    opcions: [
      "La designació dels terminis de la detenció, que no pot durar més que el temps necessari i, com a màxim 24 hores.",
      "La designació dels drets de la persona detinguda, tot obligant-la a declarar i amb dret a l’assistència lletrada.",
      "El procediment d’habeas corpus que és un procediment que permet posar immediatament a disposició judicial qualsevol persona detinguda il·legalment.",
      "La designació de les causes de privació de llibertat, que no han d’estar previstes en un reial decret."
    ],
    resposta: 2,
    explicacio: "L'habeas corpus (article 17.4 CE i LO 6/1984) permet posar immediatament a disposició judicial qualsevol persona que es consideri detinguda il·legalment per resoldre la seva situació en un màxim de 24 hores.",
    guiaPagina: 'Pàg. 133',
    guiaTema: 'Tema B.4',
    clauTribunal: "Pregunta oficial d'examen 2024. El detingut MAI té l'obligació de declarar (té dret a guardar silenci i no declarar contra si mateix)."
  },
  {
    id: 'REAL_EXAM_2023_Q23_ESTATUT_JUTGES',
    ambit: 'Àmbit B',
    seccio: 'Els òrgans jurisdiccionals',
    temaId: 'B6',
    pregunta: "Per quins dels principis següents, entre d’altres, es regeix l’estatut dels jutges i magistrats segons la Constitució i la LOPJ?",
    opcions: [
      "Inamovibilitat i imparcialitat.",
      "Dependència i mobilitat.",
      "Dependència i inamovibilitat.",
      "Incompatibilitat i mobilitat."
    ],
    resposta: 0,
    explicacio: "L'estatut constitucional de jutges i magistrats (article 117 CE) es basa en: independència, inamovibilitat, imparcialitat, incompatibilitat i responsabilitat.",
    guiaPagina: 'Pàg. 151',
    guiaTema: 'Tema B.6',
    clauTribunal: "Pregunta oficial repetida a 2023, 2024 i 2025. Els jutges són INDEPENDENTS i INAMOVIBLES; la dependència és del Ministeri Fiscal!"
  },
  {
    id: 'REAL_EXAM_2024_Q26_FEDERAL',
    ambit: 'Àmbit B',
    seccio: 'L’organització territorial de l’Estat',
    temaId: 'B7',
    pregunta: "Quin tipus d'estat es caracteritza per tenir una pluralitat de centres de poder, una diversitat de normes i orientacions polítiques i una descentralització o distribució territorial de la capacitat de decisió?",
    opcions: [
      "Unitari.",
      "Federal.",
      "Liberal.",
      "Social."
    ],
    resposta: 1,
    explicacio: "L'Estat federal (ex: EUA, Alemanya, Suïssa, Brasil) es caracteritza per la pluralitat de centres de poder sobirans federats i divisió vertical de poders.",
    guiaPagina: 'Pàg. 160',
    guiaTema: 'Tema B.7',
    clauTribunal: "Pregunta literal repetida als exàmens de 2024 i 2025. Definició clau: Federal = pluralitat de centres de poder i divisió vertical."
  },
  {
    id: 'REAL_EXAM_2025_Q9_DRET_COMUNITARI',
    ambit: 'Àmbit B',
    seccio: 'La Unió Europea',
    temaId: 'B8',
    pregunta: "Segons la Guia d'estudi, per quins tres principis es regeixen les relacions entre el dret comunitari de la UE i el dret dels estats membres?",
    opcions: [
      "L'autonomia constitucional, l'efecte directe i la primacia.",
      "L'autonomia constitucional, l'efecte directe i el respecte mutu.",
      "L'autonomia institucional, l'efecte directe i la primacia.",
      "L'autonomia institucional, l'efecte indirecte i la primacia."
    ],
    resposta: 2,
    explicacio: "Els tres principis rectors consagrats pel TJUE són: Autonomia institucional (cada estat aplica el dret comunitari segons la seva organització), Efecte directe (invocabilitat directa) i Primacia (prevalença sobre la norma interna).",
    guiaPagina: 'Pàg. 173',
    guiaTema: 'Tema B.8',
    clauTribunal: "Pregunta oficial d'examen 2025. Ull amb el parany: és autonomia INSTITUCIONAL (no constitucional) i efecte DIRECTE (no indirecte)."
  },

  // --- ÀMBIT C: ÀMBIT DE SEGURETAT I POLICIA ---
  {
    id: 'REAL_EXAM_2024_Q14_PBA',
    ambit: 'Àmbit C',
    seccio: 'El marc legal de la seguretat',
    temaId: 'C4',
    pregunta: "Quins són els sis eixos fonamentals que articulen els principis bàsics d’actuació dels membres de les forces i cossos de seguretat (article 5 de la LO 2/1986)?",
    opcions: [
      "La protecció de les persones i béns, la responsabilitat, el manteniment de l’ordre públic, les tasques executives, el suport tècnic i la confiança professional.",
      "La dedicació professional, la vigilància i protecció de persones, el manteniment de l’ordre públic, l’auxili en accidents i la protecció dels professionals.",
      "L’auxili en accidents, el tractament de detinguts, la confiança professional, el suport tècnic i operatiu i la protecció d’autoritats locals.",
      "L’adequació a l’ordenament jurídic, les relacions amb la comunitat, el tractament de detinguts, la dedicació professional, el secret professional i la responsabilitat."
    ],
    resposta: 3,
    explicacio: "L'article 5 de la LO 2/1986 estableix el codi deontològic bàsic en 6 eixos: 1) Adequació a l'ordenament jurídic, 2) Relacions amb la comunitat (congruència, oportunitat, proporcionalitat), 3) Tractament de detinguts, 4) Dedicació professional, 5) Secret professional i 6) Responsabilitat.",
    guiaPagina: 'Pàg. 226 i 235',
    guiaTema: 'Tema C.4',
    clauTribunal: "Pregunta reiterada als models de 2024 i 2025. Els 6 eixos de l'Art. 5 són un pilar que cau a totes les oposicions!"
  },
  {
    id: 'REAL_EXAM_2023_Q17_ESCALA_SERGENT',
    ambit: 'Àmbit C',
    seccio: 'El marc legal de la seguretat',
    temaId: 'C4',
    pregunta: "Segons la Llei 10/1994, d’11 de juliol, de la Policia de la Generalitat - Mossos d’Esquadra, a quina escala pertany la categoria de sergent/a?",
    opcions: [
      "Escala Superior.",
      "Escala Executiva.",
      "Escala Bàsica.",
      "Escala Intermèdia."
    ],
    resposta: 3,
    explicacio: "Segons l'article 19 de la Llei 10/1994, l'Escala Intermèdia comprèn les categories de sergent/a i de sotsinspector/a. L'Escala Bàsica comprèn mosso/a i caporal/a.",
    guiaPagina: 'Pàg. 231',
    guiaTema: 'Tema C.4',
    clauTribunal: "Recorda el nostre mnemotècnic B-I-E-S: El Sergent és Escala Intermèdia! Mai bàsica."
  },
  {
    id: 'REAL_EXAM_2022_Q30_ESCALA_INTERMEDIA_FUNCIO',
    ambit: 'Àmbit C',
    seccio: 'El marc legal de la seguretat',
    temaId: 'C4',
    pregunta: "Segons l’estructura jeràrquica de la Policia de la Generalitat - Mossos d’Esquadra, a quina escala li correspon el comandament operatiu i la supervisió de les tasques executives d’unitats, grups i subgrups policials?",
    opcions: [
      "Superior.",
      "Intermèdia.",
      "Executiva.",
      "Bàsica."
    ],
    resposta: 1,
    explicacio: "L'Escala Intermèdia (sergent i sotsinspector) té encomanat el comandament operatiu i la supervisió de tasques executives a les unitats, grups i subgrups policials.",
    guiaPagina: 'Pàg. 231',
    guiaTema: 'Tema C.4',
    clauTribunal: "Distribució de comandament: Escala Superior = direcció estratègica / superior. Escala Executiva (Inspector) = gestió d'àrees i unitats. Escala Intermèdia = comandament operatiu i supervisió."
  },
  {
    id: 'REAL_EXAM_2025_Q4_CODI_ETICA',
    ambit: 'Àmbit C',
    seccio: 'El Codi deontològic policial',
    temaId: 'C5',
    pregunta: "Segons les 'Idees força' de la Guia d'estudi, quina de les següents és una característica del Codi d'ètica de la Policia de Catalunya (Acord GOV/25/2015)?",
    opcions: [
      "No preveu la necessitat de ser modificat per adaptar-se als canvis que comporta l'evolució de la societat.",
      "Reglamenta pràctiques policials concretes.",
      "No entra a reglamentar pràctiques policials concretes, sinó que és una eina pedagògica i inspiradora.",
      "L'agent mai ha de prendre decisions sense consultar al comandament."
    ],
    resposta: 2,
    explicacio: "El Codi d'ètica de la Policia de Catalunya NO és un reglament sancionador ni entra a reglamentar pràctiques policials concretes, sinó que és una eina pedagògica i inspiradora que fixa els mínims ètics comuns.",
    guiaPagina: 'Pàg. 240 i 241',
    guiaTema: 'Tema C.5',
    clauTribunal: "Pregunta literal de 2025 (models 1 i 2). Paraules clau: 'No reglamenta pràctiques concretes', és 'pedagògica i inspiradora'."
  },
  {
    id: 'REAL_EXAM_2025_Q18_CODI_EUROPEU',
    ambit: 'Àmbit C',
    seccio: 'El Codi deontològic policial',
    temaId: 'C5',
    pregunta: "Segons les 'Idees força' de la Guia d'estudi, en què es basa el Codi europeu d'ètica de la policia (Recomanació REC(2001)10 del Consell d'Europa)?",
    opcions: [
      "En el principi de la protecció de l’Estat de dret com a base de qualsevol democràcia veritable.",
      "En el benefici econòmic dels estats membres.",
      "En la uniformitat total de tots els cossos policials del món.",
      "En l'abolició de l'ús de la força policial."
    ],
    resposta: 0,
    explicacio: "El Codi europeu d’ètica de la policia es basa en el principi fonamental de la protecció de l’Estat de dret com a base de qualsevol societat democràtica veritable.",
    guiaPagina: 'Pàg. 239 i 241',
    guiaTema: 'Tema C.5',
    clauTribunal: "Aprovat pel Comitè de Ministres del Consell d'Europa el 19 de setembre de 2001 i incorporat als Mossos per la Resolució INT/1828/2004."
  },

  // --- ACTUALITAT I CULTURA POLICIAL ---
  {
    id: 'ACTUALITAT_001_SOSTRE_MOSSOS',
    ambit: 'Actualitat',
    seccio: 'Actualitat Policial i Acords de Seguretat',
    pregunta: "Quin és el sostre màxim d'efectius del Cos de Mossos d'Esquadra acordat a la Junta de Seguretat de Catalunya el 5 de novembre de 2021?",
    opcions: [
      "18.250 efectius",
      "22.006 efectius",
      "25.000 efectius",
      "20.500 efectius"
    ],
    resposta: 1,
    explicacio: "A la reunió de la Junta de Seguretat de Catalunya celebrada el 5 de novembre de 2021 es va acordar ampliar el sostre màxim de la plantilla dels Mossos d'Esquadra fins a 22.006 efectius (anteriorment fixat en 18.267 efectius el 2006).",
    guiaPagina: 'Pàg. 193',
    guiaTema: 'Pla Mossos 2030',
    clauTribunal: "Xifra exacta: 22.006 efectius policials pel Pla Mossos 2030."
  },
  {
    id: 'ACTUALITAT_002_NOVA_UNIFORMITAT',
    ambit: 'Actualitat',
    seccio: 'Actualitat i Imatge Corporativa PG-ME',
    pregunta: "En quina data històrica i a quina hora es va estrenar oficialment la nova uniformitat operativa dels Mossos d'Esquadra de seguretat ciutadana?",
    opcions: [
      "1 de gener de 2023 a les 06:00 h",
      "3 de febrer de 2023 a les 14:00 h",
      "22 d'abril de 2023 a les 12:00 h",
      "11 de setembre de 2022 a les 08:00 h"
    ],
    resposta: 1,
    explicacio: "El divendres 3 de febrer de 2023, exactament a les 14:00 h coincidint amb el canvi de torn, els agents de seguretat ciutadana i ordre públic van estrenar la nova uniformitat operativa (camisa blava fosca amb serigrafia reflectant 'POLICIA' i pantalons tècnics).",
    guiaPagina: 'Pàg. 193',
    guiaTema: 'Tema C.2',
    clauTribunal: "Data exacta: 3 de febrer de 2023 a les 14:00 h."
  },
  {
    id: 'ACTUALITAT_003_DIA_ESQUADRES',
    ambit: 'Actualitat',
    seccio: 'Cultura i Tradició Policial',
    pregunta: "Quin dia se celebra anualment el 'Dia de les Esquadres', data institucional dels Mossos d'Esquadra?",
    opcions: [
      "21 d'abril",
      "22 d'abril",
      "23 d'abril (Sant Jordi)",
      "24 de desembre"
    ],
    resposta: 1,
    explicacio: "El Decret 64/2005 va fixar oficialment el 22 d'abril com a 'Dia de les Esquadres' en commemoració de la creació històrica de les primeres esquadres.",
    guiaPagina: 'Pàg. 38 i 188',
    guiaTema: 'Tema A.3 i C.2',
    clauTribunal: "No confondre amb Sant Jordi (23 d'abril) ni amb la creació de les esquadres de paisans (21 d'abril de 1719). El Dia de les Esquadres és el 22 D'ABRIL."
  },

  // --- DIRECCIÓ ISPC (MIX INTEGRAL) ---
  {
    id: 'ISPC_001_CREACIO',
    ambit: 'ISPC',
    seccio: 'Institut de Seguretat Pública de Catalunya',
    pregunta: "Mitjançant quina llei es va crear l'Institut de Seguretat Pública de Catalunya (ISPC) amb seu a Mollet del Vallès?",
    opcions: [
      "Llei 19/1983",
      "Llei 10/1994",
      "Llei 10/2007, de 30 de juliol",
      "Llei 12/2023"
    ],
    resposta: 2,
    explicacio: "L'ISPC fou creat per la Llei 10/2007, de 30 de juliol, integrant l'antiga Escola de Policia de Catalunya (inaugurada el 1985) i l'Escola de Bombers i Protecció Civil.",
    guiaPagina: 'Pàg. 197',
    guiaTema: 'Tema C.2',
    clauTribunal: "Llei de creació de l'ISPC: Llei 10/2007, de 30 de juliol. Seu: Mollet del Vallès."
  },
  {
    id: 'ISPC_002_SISTEMES_QUALITAT',
    ambit: 'ISPC',
    seccio: 'Qualitat Policial i Drets',
    pregunta: "Quines dues aplicacions corporatives formen part del Sistema de Gestió de la Qualitat (SGQ) policial dels Mossos d'Esquadra?",
    opcions: [
      "SITRAN i BDSN.",
      "SISD (Sistema d'Imputació i Seguiment de Detencions) i SIAV (Sistema Integral d'Atenció a les Víctimes).",
      "SIRENE i CSIS.",
      "SIAV i EUROJUST."
    ],
    resposta: 1,
    explicacio: "El SGQ audita dos processos neuràlgics: el procés de custòdia de detinguts amb el SISD i el procés d'atenció a víctimes vulnerables i de violència masclista amb el SIAV.",
    guiaPagina: 'Pàg. 196',
    guiaTema: 'Tema C.2',
    clauTribunal: "SISD = Detencions. SIAV = Víctimes. Tots dos sotmesos a certificació ISO de qualitat."
  }
];

export function getQuestionsByAmbit(ambit: QuestionAmbit): Question[] {
  if (ambit === 'ISPC') {
    // ISPC is the master direction board: returns questions from all ambits mixed
    return [...QUESTIONS_BANK].sort(() => 0.5 - Math.random());
  }
  return QUESTIONS_BANK.filter(q => q.ambit === ambit);
}

// Load any previously imported custom questions from localStorage
try {
  const saved = localStorage.getItem('agent_medina_custom_questions');
  if (saved) {
    const list = JSON.parse(saved);
    if (Array.isArray(list)) {
      list.forEach((q: Question) => {
        if (!QUESTIONS_BANK.some(existing => existing.id === q.id)) {
          QUESTIONS_BANK.push(q);
        }
      });
    }
  }
} catch (e) {
  console.error('Error loading custom questions from storage', e);
}

export function addCustomQuestions(newQuestions: Question[]): void {
  newQuestions.forEach((q) => {
    if (!QUESTIONS_BANK.some(existing => existing.id === q.id)) {
      QUESTIONS_BANK.push(q);
    }
  });
  try {
    const customOnly = QUESTIONS_BANK.filter(q => q.id.startsWith('custom_'));
    localStorage.setItem('agent_medina_custom_questions', JSON.stringify(customOnly));
  } catch (e) {
    console.error('Error saving custom questions', e);
  }
}
