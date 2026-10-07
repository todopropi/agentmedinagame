import { Question } from '../types';

/**
 * BANC DE PREGUNTES OFICIALS I REALS PER AL MODE "CAMÍ A L'ISPC"
 * Organitzat estrictament en els temes i apartats oficials de la convocatòria CME:
 * - Tema A.1: Història de Catalunya (part I) [Apartats 1 a 9]
 * - Tema B.1: L’Estatut d’autonomia de Catalunya (EAC) [Apartats 1 a 5]
 * - Tema C.1: Les competències de la Generalitat en matèria de seguretat [Apartats 1, 2.1 a 2.5]
 * - Àmbit D (Únic): Actualitat, Cultura General i Policia Internacional
 */
export const CAMI_REAL_QUESTIONS: Question[] = [
  // =========================================================================
  // TEMA A.1: HISTÒRIA DE CATALUNYA (PART I)
  // =========================================================================

  // --- Apartat 1: L'antiguitat a Catalunya ---
  {
    id: 'cami_a1_1_01',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_1',
    apartat: '1. L’antiguitat a Catalunya',
    pregunta: "Quina tribu ibèrica habitava la plana del Segre i les terres de Ponent abans de la romanització, encapçalada pels cabdills Indíbil i Mandoni?",
    opcions: [
      "Els laietans.",
      "Els ilergets.",
      "Els indigets.",
      "Els cossetans."
    ],
    resposta: 1,
    explicacio: "Els ilergets poblaven la plana del Segre (Ilerda) i van resistir tant cartaginesos com romans sota el lideratge dels cabdills Indíbil i Mandoni al segle III aC.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 1)'
  },
  {
    id: 'cami_a1_1_02',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_1',
    apartat: '1. L’antiguitat a Catalunya',
    pregunta: "Quina colònia grega va ser fundada cap a l'any 575 aC per foceus procedents de Massàlia al golf de Roses, constituint la porta d'entrada del comerç grec a Catalunya?",
    opcions: [
      "Rhode (Roses).",
      "Emporion (Empúries).",
      "Iluro (Mataró).",
      "Baetulo (Badalona)."
    ],
    resposta: 1,
    explicacio: "Emporion ('mercat' en grec) va ser fundada cap al 575 aC pels foceus i es va convertir en el principal enclavament comercial grec a la costa catalana.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 1)'
  },
  {
    id: 'cami_a1_1_03',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_1',
    apartat: '1. L’antiguitat a Catalunya',
    pregunta: "En quin període de la prehistòria se situen les primeres pintures rupestres de l'art llevantí declarades Patrimoni de la Humanitat que trobem a Catalunya (com les de Cogul o Ulldecona)?",
    opcions: [
      "Al Paleolític inferior.",
      "A l'Epipaleolític i Neolític.",
      "A l'Edat del Ferro tardana.",
      "Al període visigòtic."
    ],
    resposta: 1,
    explicacio: "L'art rupestre de l'arc llevantí de la península Ibèrica es va desenvolupar entre l'Epipaleolític i el Neolític (aproximadament del 8.000 al 3.500 aC), destacant la Cova dels Moros de Cogul.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 1)'
  },

  // --- Apartat 2: La Catalunya romana ---
  {
    id: 'cami_a1_2_01',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_2',
    apartat: '2. La Catalunya romana',
    pregunta: "En quin any es va produir el desembarcament dels germans Escipió a Empúries en el context de la Segona Guerra Púnica, marcant l'inici de la presència romana a Catalunya?",
    opcions: [
      "L'any 218 aC.",
      "L'any 197 aC.",
      "L'any 44 aC.",
      "L'any 27 dC."
    ],
    resposta: 0,
    explicacio: "L'any 218 aC Gneu Corneli Escipió va desembarcar a Empúries per tallar els subministraments a l'exèrcit cartaginès d'Anníbal, iniciant la conquesta romana d'Hispània.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 2)'
  },
  {
    id: 'cami_a1_2_02',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_2',
    apartat: '2. La Catalunya romana',
    pregunta: "Quina ciutat romana va esdevenir la capital de la província Hispània Citerior (i posteriorment Tarraconense) i residència de l'emperador August durant les guerres càntabres?",
    opcions: [
      "Barcino.",
      "Tàrraco.",
      "Ilerda.",
      "Gerunda."
    ],
    resposta: 1,
    explicacio: "Tàrraco (actual Tarragona) va ser la principal base militar i capital administrativa de la Hispània Tarraconense, i l'emperador August hi va residir entre el 26 i el 25 aC.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 2)'
  },
  {
    id: 'cami_a1_2_03',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_2',
    apartat: '2. La Catalunya romana',
    pregunta: "Quin gran eix viari romà creuava Catalunya des dels Pirineus (Coll de Panissars) seguint la costa fins a Tàrraco i en direcció al sud cap a Gades (Cadis)?",
    opcions: [
      "La Via de la Plata.",
      "La Via Augusta.",
      "La Via Annia.",
      "La Via Trajana."
    ],
    resposta: 1,
    explicacio: "La Via Augusta era la calçada romana més llarga d'Hispània (uns 1.500 km) que articulava les principals ciutats de la costa catalana amb Roma i el sud peninsular.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 2)'
  },

  // --- Apartat 3: El naixement de Catalunya ---
  {
    id: 'cami_a1_3_01',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_3',
    apartat: '3. El naixement de Catalunya',
    pregunta: "Com s'anomena la franja defensiva de territori organitzada per l'Imperi carolingi al sud dels Pirineus a finals del segle VIII per aturar l'avanç musulmà?",
    opcions: [
      "El Ducat de Septimània.",
      "La Marca Hispànica.",
      "El Regne de Pamplona.",
      "La Frontera Superior d'Al-Àndalus."
    ],
    resposta: 1,
    explicacio: "Carlemany va establir la Marca Hispànica subdividida en diversos comtats (Rosselló, Empúries, Girona, Barcelona, Osona, Urgell, Cerdanya, Pallars) sota sobirania franca.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 3)'
  },
  {
    id: 'cami_a1_3_02',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_3',
    apartat: '3. El naixement de Catalunya',
    pregunta: "Quin comte català va aconseguir unificar els comtats de Barcelona, Girona, Osona i Besalú cap al 878 i va transmetre per primer cop els títols comtals de forma hereditària?",
    opcions: [
      "Bera.",
      "Guifré el Pelós.",
      "Borrell II.",
      "Ramon Berenguer I."
    ],
    resposta: 1,
    explicacio: "Guifré el Pelós (mort el 897) és considerat figura fundacional en transmetre el patrimoni comtal als seus fills sense la designació prèvia del monarca franc, iniciant la dinastia comtal catalana.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 3)'
  },
  {
    id: 'cami_a1_3_03',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_3',
    apartat: '3. El naixement de Catalunya',
    pregunta: "Quin fet decisiu va ocórrer l'any 988 sota el govern del comte Borrell II que simbolitza la independència de facto dels comtats catalans respecte a la corona franca?",
    opcions: [
      "La derrota musulmana a la batalla de Poitiers.",
      "La negativa a renovar el jurament de vassallatge a Hug Capet després de la ràtzia d'Almansor a Barcelona (985).",
      "La signatura del Tractat de Corbeil.",
      "La coronació de Jaume I."
    ],
    resposta: 1,
    explicacio: "Després que el rei franc no enviés auxili davant el saqueig de Barcelona per Almansor l'any 985, el comte Borrell II no va renovar el vassallatge al nou rei francès Hug Capet el 988.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 3)'
  },

  // --- Apartat 4: La Catalunya feudal (s. xi-xii) ---
  {
    id: 'cami_a1_4_01',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_4',
    apartat: '4. La Catalunya feudal (s. xi-xii)',
    pregunta: "Quina institució de pau social va impulsar l'Abat Oliba a l'assemblea de Toluges (Rosselló) l'any 1027 per limitar la violència feudal sobre els pagesos i els béns eclesiàstics?",
    opcions: [
      "Els Usatges de Barcelona.",
      "La Pau i Treva de Déu.",
      "La Cort Reial.",
      "El Consell de Cent."
    ],
    resposta: 1,
    explicacio: "L'Abat Oliba (bisbe de Vic i abat de Ripoll i Cuixà) va crear la Pau i Treva de Déu, establint espais sagrats (sagres) i períodes de suspensió d'accions bèl·liques sota pena d'excomunió.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 4)'
  },
  {
    id: 'cami_a1_4_02',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_4',
    apartat: '4. La Catalunya feudal (s. xi-xii)',
    pregunta: "Quin va ser el primer codi jurídic d'arrel feudal de Catalunya, impulsat inicialment pel comte Ramon Berenguer I i Almodis de la Marca al segle XI per regular la noblesa i l'autoritat comtal?",
    opcions: [
      "El Liber Iudiciorum.",
      "Els Usatges de Barcelona.",
      "Les Constitucions de pau.",
      "El Llibre del Consolat de Mar."
    ],
    resposta: 1,
    explicacio: "Els Usatges de Barcelona (Usatici Barchinonae) van substituir progressivament l'antiga llei visigòtica per codificar les relacions feudo-vassallàtiques i l'hegemonia del comte de Barcelona.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 4)'
  },
  {
    id: 'cami_a1_4_03',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_4',
    apartat: '4. La Catalunya feudal (s. xi-xii)',
    pregunta: "Com s'anomenava el radi territorial de 30 passes al voltant d'una església consagrada que la Pau i Treva de Déu delimitava com a espai sagrat inviolable on els pagesos podien refugiar-se i protegir el gra?",
    opcions: [
      "Les sagreres (o sagres).",
      "Els feus comtals.",
      "Els masos rònecs.",
      "Els burgs fortificats."
    ],
    resposta: 0,
    explicacio: "Les sagreres eren zones sagrades d'immunitat de 30 passes al voltant dels temples parroquials establertes per l'Abat Oliba on la noblesa tenia prohibit exercir la violència o requisar collites.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 4)'
  },

  // --- Apartat 5: L’expansió catalanoaragonesa (s. xiii-xiv) ---
  {
    id: 'cami_a1_5_01',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_5',
    apartat: '5. L’expansió catalanoaragonesa (s. xiii-xiv)',
    pregunta: "Quin acord de matrimoni va donar lloc al naixement de la Corona d'Aragó l'any 1137, unint el Comtat de Barcelona amb el Regne d'Aragó mantenint cadascú les seves lleis i institucions?",
    opcions: [
      "El casament de Jaume I amb Violant d'Hongria.",
      "Els capítols matrimonials entre el comte Ramon Berenguer IV i la princesa Peronella d'Aragó.",
      "El Compromís de Casp entre Ferran d'Antequera i Elionor.",
      "El casament dels Reis Catòlics (Ferran i Isabel)."
    ],
    resposta: 1,
    explicacio: "El rei Ramir II d'Aragó i el comte Ramon Berenguer IV van pactar els capítols matrimonials el 1137 amb Peronella, creant una confederació dinàstica que respectava la sobirania i furs de cada territori.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 5)'
  },
  {
    id: 'cami_a1_5_02',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_5',
    apartat: '5. L’expansió catalanoaragonesa (s. xiii-xiv)',
    pregunta: "Quins dos territoris clau va conquerir el rei Jaume I el Conqueridor consolidant l'hegemonia de la Corona d'Aragó a la península i a la Mediterrània?",
    opcions: [
      "Mallorca (1229) i València (1238).",
      "Sardenya (1323) i Nàpols (1442).",
      "Sicília (1282) i Atenes (1311).",
      "Múrcia (1266) i Algesires (1344)."
    ],
    resposta: 0,
    explicacio: "Jaume I va conquerir Mallorca (1229) iniciant l'expansió marítima, i el Regne de València (1238), creant nous regnes integrats a la Corona d'Aragó amb furs propis.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 5)'
  },
  {
    id: 'cami_a1_5_03',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_5',
    apartat: '5. L’expansió catalanoaragonesa (s. xiii-xiv)',
    pregunta: "Quin cèlebre cos d'ordenances marítimes i mercantils catalanes, redactat a Barcelona al segle XIII-XIV, va ser adoptat com a dret marítim internacional arreu de la Mediterrània?",
    opcions: [
      "Els Capítols d'Atenes.",
      "El Llibre del Consolat de Mar.",
      "La Taula de Canvi.",
      "Els Usatges de la Mar."
    ],
    resposta: 1,
    explicacio: "El Llibre del Consolat de Mar va ser una compilació pionera de dret mercantil i de navegació que regulava el comerç exterior i els tribunals mercantils a la Mediterrània.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 5)'
  },

  // --- Apartat 6: La crisi de la baixa edat mitjana (s. xiv i xv) ---
  {
    id: 'cami_a1_6_01',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_6',
    apartat: '6. La crisi de la baixa edat mitjana (s. xiv i xv)',
    pregunta: "Quina epidèmia devastadora va arribar a Catalunya l'any 1348 causant la mort d'entre un terç i la meitat de la població i desencadenant una profunda crisi econòmica i agrària?",
    opcions: [
      "El còlera morbo.",
      "La pesta negra o bubònica.",
      "La febre groga.",
      "La tuberculosi pulmonar."
    ],
    resposta: 1,
    explicacio: "La Pesta Negra de 1348 va provocar una catàstrofe demogràfica a Catalunya, agreujant l'abandonament dels masos rònecs i les tensions entre senyors feudals i pagesos de remença.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 6)'
  },
  {
    id: 'cami_a1_6_02',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_6',
    apartat: '6. La crisi de la baixa edat mitjana (s. xiv i xv)',
    pregunta: "Quin acord de successió dinàstica es va signar l'any 1412, després de la mort sense descendència legítima del rei Martí l'Humà (1410), entronitzant la dinastia Trastàmara a la Corona d'Aragó?",
    opcions: [
      "La Sentència Arbitral de Guadalupe.",
      "El Compromís de Casp.",
      "La Concòrdia de Pedralbes.",
      "El Tractat de Baiona."
    ],
    resposta: 1,
    explicacio: "Al Compromís de Casp (1412), nou compromissaris de Catalunya, Aragó i València van elegir Ferran d'Antequera (Ferran I), introduint la dinastia castellana dels Trastàmara.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 6)'
  },
  {
    id: 'cami_a1_6_03',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_6',
    apartat: '6. La crisi de la baixa edat mitjana (s. xiv i xv)',
    pregunta: "Com es coneixia el col·lectiu de pagesos sotmesos a la servitud de la terra i als 'mals usos' senyorials que es van revoltar durant la Guerra Civil Catalana (1462-1472)?",
    opcions: [
      "Els ciutadans honrats.",
      "Els pagesos de remença.",
      "La Biga.",
      "La Busca."
    ],
    resposta: 1,
    explicacio: "Els remences eren pagesos adscrits a la gleva obligats a pagar redempció per marxar del mas. La seva revolta va culminar el 1486 amb la Sentència Arbitral de Guadalupe que abolia els mals usos.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 6)'
  },

  // --- Apartat 7: Catalunya en la monarquia hispànica i la Guerra dels Segadors (s. xvi-xvii) ---
  {
    id: 'cami_a1_7_01',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_7',
    apartat: '7. Catalunya en la monarquia hispànica i la Guerra dels Segadors (s. xvi-xvii)',
    pregunta: "Quin projecte polític del Comte-Duc d'Olivares (1626) pretenia obligar tots els regnes de la monarquia dels Àustries a aportar tropes i diners per mantenir les guerres imperials, xocant frontalment amb les Constitucions de Catalunya?",
    opcions: [
      "El Decret de Nova Planta.",
      "La Unió d'Armes.",
      "L'Impost del Cadastre.",
      "El Gran Memorial de Castella."
    ],
    resposta: 1,
    explicacio: "La Unió d'Armes d'Olivares exigia a Catalunya 16.000 homes pagats per lluitar fora del territori, contravenint el dret constitucional català que impedia mobilitzar lleves fora del Principat.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 7)'
  },
  {
    id: 'cami_a1_7_02',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_7',
    apartat: '7. Catalunya en la monarquia hispànica i la Guerra dels Segadors (s. xvi-xvii)',
    pregunta: "Quin incident sagnant succeït a Barcelona el 7 de juny de 1640 entre segadors amotinats i autoritats reials va desencadenar la Guerra dels Segadors?",
    opcions: [
      "El Corpus de Sang.",
      "La Diada de Sant Jordi.",
      "El Setge de Girona.",
      "L'Onze de Setembre."
    ],
    resposta: 0,
    explicacio: "El Corpus de Sang (7 de juny de 1640) va començar amb un motí de segadors i va culminar amb la mort del virrei Dalmau de Queralt, comte de Santa Coloma, iniciant la Guerra dels Segadors (1640-1652).",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 7)'
  },
  {
    id: 'cami_a1_7_03',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_7',
    apartat: '7. Catalunya en la monarquia hispànica i la Guerra dels Segadors (s. xvi-xvii)',
    pregunta: "Quin tractat de pau internacional van signar les corones d'Espanya i França l'any 1659, pel qual es va cedir a França el Rosselló, el Conflent, el Vallespir i mitja Cerdanya sense consultar les Corts Catalanes?",
    opcions: [
      "El Tractat de Westfàlia.",
      "El Tractat dels Pirineus.",
      "El Tractat d'Utrecht.",
      "El Pacte de Gènova."
    ],
    resposta: 1,
    explicacio: "El Tractat dels Pirineus (1659) va fixar la frontera a la serralada pirinenca i va mutilar el territori català amb la pèrdua dels comtats septentrionals de la Catalunya Nord a favor de Lluís XIV de França.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 7)'
  },

  // --- Apartat 8: La Guerra de Successió i l’Onze de Setembre ---
  {
    id: 'cami_a1_8_01',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_8',
    apartat: '8. La Guerra de Successió i l’Onze de Setembre',
    pregunta: "Quin pacte secret va signar una delegació catalana el 1705 amb el Regne d'Anglaterra garantint el suport militar a canvi del compromís anglès de defensar les Constitucions de Catalunya?",
    opcions: [
      "El Pacte de Madrid.",
      "El Pacte de Gènova.",
      "El Tractat d'Aquisgrà.",
      "La Pau de Rastatt."
    ],
    resposta: 1,
    explicacio: "El Pacte de Gènova (20 de juny de 1705) va aliar formalment Catalunya amb Anglaterra i la Gran Aliança de La Haia a favor de l'Arxiduc Carles d'Àustria com a Carles III.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 8)'
  },
  {
    id: 'cami_a1_8_02',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_8',
    apartat: '8. La Guerra de Successió i l’Onze de Setembre',
    pregunta: "Quina data històrica commemora la capitulació de Barcelona després de 14 mesos de setge davant les tropes borbòniques del duc de Berwick, esdevenint la Diada Nacional de Catalunya?",
    opcions: [
      "L'11 de setembre de 1714.",
      "El 23 d'abril de 1716.",
      "El 16 de gener de 1715.",
      "El 6 d'octubre de 1714."
    ],
    resposta: 0,
    explicacio: "L'11 de setembre de 1714 les tropes de Felip V van prendre Barcelona a l'assalt final, culminant la resistència heroica dirigida pel conseller en cap Rafael Casanova i el general Antoni de Villarroel.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 8)'
  },
  {
    id: 'cami_a1_8_03',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_8',
    apartat: '8. La Guerra de Successió i l’Onze de Setembre',
    pregunta: "Quin acord diplomàtic internacional de 1713 va acordar la retirada de les tropes aliades angleses i austríaques deixant Catalunya sola davant l'exèrcit de Felip V?",
    opcions: [
      "El Tractat de Versalles.",
      "El Tractat d'Utrecht.",
      "El Tractat de Fontainebleau.",
      "La Pau de Nimega."
    ],
    resposta: 1,
    explicacio: "Pel Tractat d'Utrecht (1713) les potències europees van reconèixer Felip V com a rei d'Espanya i van retirar el suport a Catalunya, que va decidir resistir en solitari en defensa de les seves llibertats.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 8)'
  },

  // --- Apartat 9: Les transformacions del segle xviii ---
  {
    id: 'cami_a1_9_01',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_9',
    apartat: '9. Les transformacions del segle xviii',
    pregunta: "Quin decret reial promulgat el 16 de gener de 1716 per Felip V va abolir les institucions d'autogovern catalanes (Generalitat, Corts i Consell de Cent) i va imposar les lleis castellanes?",
    opcions: [
      "El Decret d'Unificació.",
      "El Decret de Nova Planta.",
      "La Pragmàtica Sanció.",
      "El Reial Decret d'Alcaldies."
    ],
    resposta: 1,
    explicacio: "El Decret de Nova Planta de la Real Audiencia del Principado de Cataluña (1716) va liquidar l'ordenament constitucional català, substituint els consells per corregiments i instaurant l'absolutisme borbònic.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 9)'
  },
  {
    id: 'cami_a1_9_02',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_9',
    apartat: '9. Les transformacions del segle xviii',
    pregunta: "Quin cos armat de seguretat rural va néixer a principis del segle XVIII a Valls (1719-1721) sota el comandament de Pere Anton Veciana per perseguir miquelets i bandolers, precedent directe dels Mossos d'Esquadra?",
    opcions: [
      "La Milícia Nacional.",
      "Les Esquadres de Paisans (Mossos d'Esquadra).",
      "La Santa Germandat.",
      "Els Carrabiners de Costes."
    ],
    resposta: 1,
    explicacio: "Les Esquadres de Paisans van ser fundades per Pere Anton Veciana a Valls amb l'autorització del capità general marquès de Castel-Rodrigo, convertint-se en el cos de policia més antic d'Europa en actiu.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 9)'
  },
  {
    id: 'cami_a1_9_03',
    ambit: 'Àmbit A',
    temaId: 'tema_a1',
    guiaTema: 'Tema A.1',
    seccio: 'Història de Catalunya (part I)',
    apartatId: 'a1_9',
    apartat: '9. Les transformacions del segle xviii',
    pregunta: "Quin impost directe i unificat va introduir l'administració borbònica a Catalunya a través de José Patiño el 1716 sobre el patrimoni, el treball i els béns immobles?",
    opcions: [
      "L'alcabala.",
      "El cadastre.",
      "El dret d'entrades.",
      "El quint reial."
    ],
    resposta: 1,
    explicacio: "El Cadastre va ser el tribut borbònic exclusiu a Catalunya (Cadastre reial i personal) creat per recaptar l'equivalent a les rendes fiscals de Castella de manera centralitzada.",
    guiaPagina: 'Guia Oficial CME - Tema A.1 (Apartat 9)'
  },

  // =========================================================================
  // TEMA B.1: L’ESTATUT D’AUTONOMIA DE CATALUNYA (EAC)
  // =========================================================================

  // --- Apartat 1.1: Antecedents històrics ---
  {
    id: 'cami_b1_1_1_01',
    ambit: 'Àmbit B',
    temaId: 'tema_b1',
    guiaTema: 'Tema B.1',
    seccio: 'L’Estatut d’autonomia de Catalunya (EAC)',
    apartatId: 'b1_1_1',
    apartat: '1.1. Antecedents històrics',
    pregunta: "Quina llei orgànica estatal va aprovar l'Estatut d'autonomia de Catalunya de 1979 (Estatut de Sau), primer estatut democràtic després de la dictadura franquista?",
    opcions: [
      "Llei orgànica 4/1979, de 18 de desembre.",
      "Llei orgànica 6/2006, de 19 de juliol.",
      "Llei 10/1994, d'11 de juliol.",
      "Llei orgànica 2/1986, de 13 de març."
    ],
    resposta: 0,
    explicacio: "L'Estatut de Sau va ser aprovat per la Llei Orgànica 4/1979, de 18 de desembre, redactat pel 'parlament de Sau' (la Comissió dels Vint) a Miravet i Sau abans de ser referendat el 25 d'octubre de 1979.",
    guiaPagina: 'Guia Oficial CME - Tema B.1 (Apartat 1.1)'
  },
  {
    id: 'cami_b1_1_1_02',
    ambit: 'Àmbit B',
    temaId: 'tema_b1',
    guiaTema: 'Tema B.1',
    seccio: 'L’Estatut d’autonomia de Catalunya (EAC)',
    apartatId: 'b1_1_1',
    apartat: '1.1. Antecedents històrics',
    pregunta: "En quina data va ser sotmesa a referèndum ciutadà a Catalunya la proposta de reforma estatutària que va culminar amb la Llei orgànica 6/2006?",
    opcions: [
      "El 30 de setembre de 2005.",
      "El 18 de juny de 2006.",
      "El 19 de juliol de 2006.",
      "El 28 de juny de 2010."
    ],
    resposta: 1,
    explicacio: "El text de l'Estatut va ser aprovat pel Parlament el 30 de setembre de 2005, dictaminat a les Corts Generals i aprovat per la ciutadania catalana en referèndum el 18 de juny de 2006.",
    guiaPagina: 'Guia Oficial CME - Tema B.1 (Apartat 1.1)'
  },

  // --- Apartat 1.2: Naturalesa jurídica ---
  {
    id: 'cami_b1_1_2_01',
    ambit: 'Àmbit B',
    temaId: 'tema_b1',
    guiaTema: 'Tema B.1',
    seccio: 'L’Estatut d’autonomia de Catalunya (EAC)',
    apartatId: 'b1_1_2',
    apartat: '1.2. Naturalesa jurídica',
    pregunta: "D'acord amb l'article 147 de la Constitució Espanyola i l'article 1 de l'EAC, quina és la naturalesa jurídica de l'Estatut d'autonomia de Catalunya?",
    opcions: [
      "És un reglament intern del Parlament de Catalunya.",
      "És la norma institucional bàsica de Catalunya i forma part de l'ordenament jurídic de l'Estat.",
      "És un tractat internacional de dret comparat.",
      "És un decret legislatiu delegat del Govern espanyol."
    ],
    resposta: 1,
    explicacio: "L'art. 1 de l'EAC defineix que l'Estatut és la norma institucional bàsica de Catalunya. Com a llei orgànica reforçada, s'integra al bloc de la constitucionalitat estatal subordinat exclusivament a la Constitució.",
    guiaPagina: 'Guia Oficial CME - Tema B.1 (Apartat 1.2)'
  },
  {
    id: 'cami_b1_1_2_02',
    ambit: 'Àmbit B',
    temaId: 'tema_b1',
    guiaTema: 'Tema B.1',
    seccio: 'L’Estatut d’autonomia de Catalunya (EAC)',
    apartatId: 'b1_1_2',
    apartat: '1.2. Naturalesa jurídica',
    pregunta: "Quin rang normatiu té l'Estatut d'autonomia dins l'ordenament jurídic de la Comunitat Autònoma de Catalunya?",
    opcions: [
      "Rang reglamentari idèntic als decrets del Govern.",
      "És la norma suprema de l'ordenament jurídic català després de la Constitució.",
      "Rang de llei ordinària sense procediment especial de reforma.",
      "No té força de llei sinó caràcter orientador."
    ],
    resposta: 1,
    explicacio: "L'EAC és la norma institucional cúspide del dret autonòmic català. Totes les lleis i normes dictades per les institucions de la Generalitat han d'ajustar-se preceptivament a l'Estatut.",
    guiaPagina: 'Guia Oficial CME - Tema B.1 (Apartat 1.2)'
  },

  // --- Apartat 2.1: Contingut ---
  {
    id: 'cami_b1_2_1_01',
    ambit: 'Àmbit B',
    temaId: 'tema_b1',
    guiaTema: 'Tema B.1',
    seccio: 'L’Estatut d’autonomia de Catalunya (EAC)',
    apartatId: 'b1_2_1',
    apartat: '2.1. Contingut',
    pregunta: "Quin contingut mínim obligatori ha de tenir tot estatut d'autonomia segons l'article 147.2 de la Constitució Espanyola?",
    opcions: [
      "La denominació de la Comunitat, la delimitació territorial, les institucions autonòmiques pròpies i les competències assumides.",
      "Només la relació de diputats i el pressupost ordinari anual.",
      "Exclusivament el codi penal i civil d'aplicació.",
      "La política monetària i de defensa nacional."
    ],
    resposta: 0,
    explicacio: "L'article 147.2 CE fixa el contingut preceptiu: denominació de la Comunitat que millor correspongui a la seva identitat històrica, delimitació territorial, denominació i seu de les institucions pròpies, i competències assumides.",
    guiaPagina: 'Guia Oficial CME - Tema B.1 (Apartat 2.1)'
  },
  {
    id: 'cami_b1_2_1_02',
    ambit: 'Àmbit B',
    temaId: 'tema_b1',
    guiaTema: 'Tema B.1',
    seccio: 'L’Estatut d’autonomia de Catalunya (EAC)',
    apartatId: 'b1_2_1',
    apartat: '2.1. Contingut',
    pregunta: "Segons l'article 8 de l'Estatut d'autonomia de Catalunya, quins són els símbols nacionals de Catalunya?",
    opcions: [
      "La senyera quadribarrada, la festa nacional de l'Onze de Setembre i l'himne d'Els Segadors.",
      "L'escut heràldic de Carlemany i la sardana.",
      "La Creu de Sant Jordi i el drac de Gaudí.",
      "Només la bandera oficial de la Generalitat."
    ],
    resposta: 0,
    explicacio: "L'art. 8 EAC consagra com a símbols nacionals: la bandera tradicional de quatre barres vermelles en fons groc, la festa nacional de l'Onze de Setembre i l'himne d'Els Segadors.",
    guiaPagina: 'Guia Oficial CME - Tema B.1 (Apartat 2.1)'
  },

  // --- Apartat 2.2: Estructura ---
  {
    id: 'cami_b1_2_2_01',
    ambit: 'Àmbit B',
    temaId: 'tema_b1',
    guiaTema: 'Tema B.1',
    seccio: 'L’Estatut d’autonomia de Catalunya (EAC)',
    apartatId: 'b1_2_2',
    apartat: '2.2. Estructura',
    pregunta: "Quina és l'estructura formal de l'Estatut d'autonomia de Catalunya de 2006 quant a articles i títols?",
    opcions: [
      "Preàmbul, Títol preliminar i 5 títols numerats (total 150 articles).",
      "Preàmbul, Títol preliminar i 7 títols numerats (total 223 articles).",
      "Un Títol únic amb 200 articles.",
      "Preàmbul i 10 títols coincidents amb la Constitució."
    ],
    resposta: 1,
    explicacio: "L'EAC consta d'un Preàmbul, un Títol preliminar i 7 títols (arts. 1 al 223), més 15 disposicions addicionals, 2 transitòries, 1 derogatòria i 4 finals.",
    guiaPagina: 'Guia Oficial CME - Tema B.1 (Apartat 2.2)'
  },
  {
    id: 'cami_b1_2_2_02',
    ambit: 'Àmbit B',
    temaId: 'tema_b1',
    guiaTema: 'Tema B.1',
    seccio: 'L’Estatut d’autonomia de Catalunya (EAC)',
    apartatId: 'b1_2_2',
    apartat: '2.2. Estructura',
    pregunta: "Quin títol de l'EAC regula el règim de les competències de la Generalitat i el llistat complet de matèries competencials?",
    opcions: [
      "El Títol I.",
      "El Títol II.",
      "El Títol IV.",
      "El Títol VI."
    ],
    resposta: 2,
    explicacio: "El Títol IV de l'EAC (arts. 110 a 173) s'intitula 'De les competències' i conté la tipologia (Capítol I) i les matèries competencials detallades (Capítol II).",
    guiaPagina: 'Guia Oficial CME - Tema B.1 (Apartat 2.2)'
  },

  // --- Apartat 3: Els drets, els deures i els principis rectors ---
  {
    id: 'cami_b1_3_01',
    ambit: 'Àmbit B',
    temaId: 'tema_b1',
    guiaTema: 'Tema B.1',
    seccio: 'L’Estatut d’autonomia de Catalunya (EAC)',
    apartatId: 'b1_3',
    apartat: '3. Els drets, els deures i els principis rectors',
    pregunta: "Segons l'article 32 de l'EAC sobre drets lingüístics, quin dret i deure tenen reconegut totes les persones a Catalunya respecte a la llengua catalana?",
    opcions: [
      "El deure d'usar exclusivament el català a tots els àmbits privats.",
      "El dret a utilitzar les dues llengües oficials i el dret i el deure de conèixer-les.",
      "Només tenen l'obligació de conèixer el castellà.",
      "No existeix cap dret reconegut a ser atès en català a la justícia."
    ],
    resposta: 1,
    explicacio: "L'art. 32 EAC estableix el dret a utilitzar les dues llengües oficials i a no ser discriminat per raons lingüístiques. L'art. 6 consagra el deure de conèixer-les en l'àmbit institucional.",
    guiaPagina: 'Guia Oficial CME - Tema B.1 (Apartat 3)'
  },
  {
    id: 'cami_b1_3_02',
    ambit: 'Àmbit B',
    temaId: 'tema_b1',
    guiaTema: 'Tema B.1',
    seccio: 'L’Estatut d’autonomia de Catalunya (EAC)',
    apartatId: 'b1_3',
    apartat: '3. Els drets, els deures i els principis rectors',
    pregunta: "Quina funció jurídica tenen els 'Principis rectors' establerts al Capítol V del Títol I de l'Estatut d'autonomia (arts. 39 a 54)?",
    opcions: [
      "Són drets subjectius directament exigibles davant els tribunals ordinaris sense necessitat de llei.",
      "Orienten les polítiques públiques dels poders de la Generalitat i informen la legislació i la pràctica judicial.",
      "Són preceptes penals sancionadors per a la ciutadania.",
      "Són normes no vinculants amb caràcter merament decoratiu."
    ],
    resposta: 1,
    explicacio: "Els principis rectors (art. 39 a 54 EAC) orienten l'actuació dels poders públics en àmbits com la protecció social, cohesió territorial, seguretat, igualtat de gènere i medi ambient.",
    guiaPagina: 'Guia Oficial CME - Tema B.1 (Apartat 3)'
  },

  // --- Apartat 4.1: Tipologia de les competències ---
  {
    id: 'cami_b1_4_1_01',
    ambit: 'Àmbit B',
    temaId: 'tema_b1',
    guiaTema: 'Tema B.1',
    seccio: 'L’Estatut d’autonomia de Catalunya (EAC)',
    apartatId: 'b1_4_1',
    apartat: '4.1. Tipologia',
    pregunta: "Segons l'article 110 de l'EAC, què comprèn una 'competència exclusiva' de la Generalitat de Catalunya?",
    opcions: [
      "Només la potestat executiva de les lleis de l'Estat.",
      "La potestat legislativa, la potestat reglamentària i la funció executiva de manera íntegra.",
      "La potestat de dictar reglaments sense capacitat de legislar.",
      "Cap facultat normativa, únicament la gestió de fons comunitaris."
    ],
    resposta: 1,
    explicacio: "L'art. 110 EAC defineix les competències exclusives: corresponen de manera íntegra a la Generalitat la potestat legislativa, la reglamentària i la funció executiva.",
    guiaPagina: 'Guia Oficial CME - Tema B.1 (Apartat 4.1)'
  },
  {
    id: 'cami_b1_4_1_02',
    ambit: 'Àmbit B',
    temaId: 'tema_b1',
    guiaTema: 'Tema B.1',
    seccio: 'L’Estatut d’autonomia de Catalunya (EAC)',
    apartatId: 'b1_4_1',
    apartat: '4.1. Tipologia',
    pregunta: "Quina és la definició de 'competències compartides' segons l'article 111 de l'EAC?",
    opcions: [
      "La Generalitat té la potestat legislativa i l'Estat la funció executiva.",
      "L'Estat fixa les bases mitjançant llei i la Generalitat té la potestat legislativa de desenvolupament, la potestat reglamentària i la funció executiva.",
      "Totes les funcions s'exerceixen conjuntament a la mateixa taula ministerial.",
      "La Generalitat no pot dictar cap norma sobre la matèria."
    ],
    resposta: 1,
    explicacio: "En les competències compartides (art. 111 EAC), l'Estat estableix la legislació bàsica i la Generalitat desplega la llei, el reglament i l'execució completa.",
    guiaPagina: 'Guia Oficial CME - Tema B.1 (Apartat 4.1)'
  },
  {
    id: 'cami_b1_4_1_03',
    ambit: 'Àmbit B',
    temaId: 'tema_b1',
    guiaTema: 'Tema B.1',
    seccio: 'L’Estatut d’autonomia de Catalunya (EAC)',
    apartatId: 'b1_4_1',
    apartat: '4.1. Tipologia',
    pregunta: "Què correspon a la Generalitat en l'exercici de les 'competències executives' d'acord amb l'article 112 de l'EAC?",
    opcions: [
      "La potestat legislativa exclusiva.",
      "La funció executiva, inclosa la potestat reglamentària pròpia organitzativa i de gestió interna, d'acord amb la legislació estatal.",
      "Cap facultat executiva ni sancionadora.",
      "La modificació de les lleis de bases estatals."
    ],
    resposta: 1,
    explicacio: "En les competències executives (art. 112 EAC), la legislació correspon exclusivament a l'Estat, mentre que la Generalitat exerceix la gestió executiva, inspecció i potestat reglamentària d'organització dels seus serveis.",
    guiaPagina: 'Guia Oficial CME - Tema B.1 (Apartat 4.1)'
  },

  // --- Apartat 4.2: Principis i criteris ---
  {
    id: 'cami_b1_4_2_01',
    ambit: 'Àmbit B',
    temaId: 'tema_b1',
    guiaTema: 'Tema B.1',
    seccio: 'L’Estatut d’autonomia de Catalunya (EAC)',
    apartatId: 'b1_4_2',
    apartat: '4.2. Principis i criteris',
    pregunta: "Quin principi rector estableix l'article 115 de l'EAC per al desplegament i exercici de les competències de la Generalitat?",
    opcions: [
      "Principi de centralització obligatòria de tots els tràmits a Madrid.",
      "Principis de subsidiarietat, proximitat a la ciutadania, eficàcia i sostenibilitat.",
      "Principi de prevalença incondicional del dret estatal en qualsevol cas.",
      "Principi de submissió de la policia als tribunals de comptes."
    ],
    resposta: 1,
    explicacio: "L'art. 115 EAC consagra que l'exercici de les competències s'ha de guiar pels principis d'eficàcia, proximitat, subsidiarietat, coordinació i cooperació entre administracions.",
    guiaPagina: 'Guia Oficial CME - Tema B.1 (Apartat 4.2)'
  },

  // --- Apartat 4.3: Les matèries de les competències ---
  {
    id: 'cami_b1_4_3_01',
    ambit: 'Àmbit B',
    temaId: 'tema_b1',
    guiaTema: 'Tema B.1',
    seccio: 'L’Estatut d’autonomia de Catalunya (EAC)',
    apartatId: 'b1_4_3',
    apartat: '4.3. Les matèries de les competències',
    pregunta: "Quin àmbit material regulat al Capítol II del Títol IV de l'EAC té assignat un paper estratègic en la convivència i pau ciutadana?",
    opcions: [
      "Les matèries de seguretat pública (art. 164), protecció civil (art. 132) i joc i espectacles (art. 141).",
      "Exclusivament la gestió de correus i telègrafs.",
      "La fabricació d'armes de guerra i explosius militars.",
      "El servei militar obligatori."
    ],
    resposta: 0,
    explicacio: "El Títol IV atribueix a la Generalitat competències fonamentals en matèria de seguretat ciutadana (art. 164), protecció civil d'emergències (art. 132), joc i espectacles (art. 141) i seguretat privada (art. 163).",
    guiaPagina: 'Guia Oficial CME - Tema B.1 (Apartat 4.3)'
  },

  // --- Apartat 5: La competència en matèria de seguretat pública a l'EAC ---
  {
    id: 'cami_b1_5_01',
    ambit: 'Àmbit B',
    temaId: 'tema_b1',
    guiaTema: 'Tema B.1',
    seccio: 'L’Estatut d’autonomia de Catalunya (EAC)',
    apartatId: 'b1_5',
    apartat: '5. La competència en matèria de seguretat pública establerta a l’EAC',
    pregunta: "Quin article de l'Estatut d'autonomia de Catalunya de 2006 recull i desplega monogràficament la competència en matèria de 'Seguretat pública'?",
    opcions: [
      "L'article 147.",
      "L'article 164.",
      "L'article 55.",
      "L'article 206."
    ],
    resposta: 1,
    explicacio: "L'article 164 de l'EAC estableix la competència de la Generalitat en planificació, ordenació de policies locals i creació del cos de la Policia de la Generalitat - Mossos d'Esquadra.",
    guiaPagina: 'Guia Oficial CME - Tema B.1 (Apartat 5)'
  },
  {
    id: 'cami_b1_5_02',
    ambit: 'Àmbit B',
    temaId: 'tema_b1',
    guiaTema: 'Tema B.1',
    seccio: 'L’Estatut d’autonomia de Catalunya (EAC)',
    apartatId: 'b1_5',
    apartat: '5. La competència en matèria de seguretat pública establerta a l’EAC',
    pregunta: "Segons l'article 164.2 de l'EAC, quin caràcter té la Policia de la Generalitat - Mossos d'Esquadra a tot el territori de Catalunya?",
    opcions: [
      "Cos de policia de suport exclusivament per a zones rurals.",
      "Policia integral en el territori de Catalunya, exercint totes les funcions pròpies d'un cos policial.",
      "Cos auxiliar sotmès a la Guàrdia Civil en matèria d'investigació penal.",
      "Policia administrativa sense competències en ordre públic."
    ],
    resposta: 1,
    explicacio: "L'art. 164.2 EAC consagra que la Policia de la Generalitat - Mossos d'Esquadra té la consideració de policia integral ordinària a tot Catalunya en matèria de seguretat ciutadana, investigació i ordre públic.",
    guiaPagina: 'Guia Oficial CME - Tema B.1 (Apartat 5)'
  },
  {
    id: 'cami_b1_5_03',
    ambit: 'Àmbit B',
    temaId: 'tema_b1',
    guiaTema: 'Tema B.1',
    seccio: 'L’Estatut d’autonomia de Catalunya (EAC)',
    apartatId: 'b1_5',
    apartat: '5. La competència en matèria de seguretat pública establerta a l’EAC',
    pregunta: "Quin òrgan paritari Estat-Generalitat és el responsable de coordinar les polítiques de seguretat, les plantilles policials i l'intercanvi d'informació segons l'article 164.4 de l'EAC?",
    opcions: [
      "El Consell de Seguretat Nacional.",
      "La Junta de Seguretat de Catalunya.",
      "El Centre Nacional d'Intel·ligència.",
      "La Comissió Bilateral Generalitat-Estat."
    ],
    resposta: 1,
    explicacio: "La Junta de Seguretat de Catalunya (art. 164.4 EAC) és l'òrgan paritari presidit pel President de la Generalitat per coordinar les actuacions entre la Policia de la Generalitat i les Forces i Cossos de Seguretat de l'Estat.",
    guiaPagina: 'Guia Oficial CME - Tema B.1 (Apartat 5)'
  },

  // =========================================================================
  // TEMA C.1: LES COMPETÈNCIES DE LA GENERALITAT EN MATÈRIA DE SEGURETAT
  // =========================================================================

  // --- Apartat 1: Definició de competència ---
  {
    id: 'cami_c1_1_01',
    ambit: 'Àmbit C',
    temaId: 'tema_c1',
    guiaTema: 'Tema C.1',
    seccio: 'Les competències de la Generalitat en matèria de seguretat',
    apartatId: 'c1_1',
    apartat: '1. Definició de competència',
    pregunta: "Com es defineix jurídicament el concepte de 'competència' en l'àmbit del dret administratiu i constitucional?",
    opcions: [
      "El deure del ciutadà d'obeir una instrucció policial.",
      "El conjunt de facultats, potestats i atribucions que l'ordenament jurídic atorga a un òrgan o administració sobre una matèria concreta.",
      "La rivalitat comercial entre empreses prestadores de serveis de vigilància.",
      "El rang salarial assignat a un funcionari públic."
    ],
    resposta: 1,
    explicacio: "La competència és la mesura de la potestat atribuïda per la norma a una entitat o òrgan públic per actuar legítimament sobre un camp material determinat.",
    guiaPagina: 'Guia Oficial CME - Tema C.1 (Apartat 1)'
  },
  {
    id: 'cami_c1_1_02',
    ambit: 'Àmbit C',
    temaId: 'tema_c1',
    guiaTema: 'Tema C.1',
    seccio: 'Les competències de la Generalitat en matèria de seguretat',
    apartatId: 'c1_1',
    apartat: '1. Definició de competència',
    pregunta: "Quin principi regeix la titularitat de les competències administratives segons la legislació de règim jurídic del sector públic?",
    opcions: [
      "Són renunciables en qualsevol moment pel titular de l'òrgan.",
      "Són irrenunciables i s'han d'exercir pels òrgans que les tinguin atribuïdes, llevat dels supòsits de delegació o desconcentració.",
      "Poden ser venudes a corporacions de dret privat.",
      "Prescriuen si no s'utilitzen durant sis mesos."
    ],
    resposta: 1,
    explicacio: "La competència administrativa és irrenunciable i d'ordre públic. Només es pot alterar el seu exercici mitjançant figures legalment previstes com la delegació, l'avocació o l'encomana de gestió.",
    guiaPagina: 'Guia Oficial CME - Tema C.1 (Apartat 1)'
  },

  // --- Apartat 2.1: Emergència i protecció civil ---
  {
    id: 'cami_c1_2_1_01',
    ambit: 'Àmbit C',
    temaId: 'tema_c1',
    guiaTema: 'Tema C.1',
    seccio: 'Les competències de la Generalitat en matèria de seguretat',
    apartatId: 'c1_2_1',
    apartat: '2.1. Les competències en matèria d’emergència i protecció civil',
    pregunta: "Segons l'article 132 de l'EAC i la Llei 4/1997, quina competència té la Generalitat de Catalunya en matèria de protecció civil?",
    opcions: [
      "Competència exclusiva, que inclou la regulació, la planificació i la gestió d'emergències a Catalunya.",
      "Només competència consultiva supeditada a l'Exèrcit de Terra.",
      "Competència compartida sense capacitat de coordinar bombers ni policia.",
      "Cap competència, correspon exclusivament a l'Estat central."
    ],
    resposta: 0,
    explicacio: "L'art. 132 de l'EAC atorga a la Generalitat la competència exclusiva en matèria de protecció civil, incloent l'elaboració dels plans especials (INUNCAT, INFOCAT, etc.) i la gestió integral.",
    guiaPagina: 'Guia Oficial CME - Tema C.1 (Apartat 2.1)'
  },
  {
    id: 'cami_c1_2_1_02',
    ambit: 'Àmbit C',
    temaId: 'tema_c1',
    guiaTema: 'Tema C.1',
    seccio: 'Les competències de la Generalitat en matèria de seguretat',
    apartatId: 'c1_2_1',
    apartat: '2.1. Les competències en matèria d’emergència i protecció civil',
    pregunta: "Quin és l'òrgan operatiu permanent de la Generalitat de Catalunya encarregat de coordinar en temps real les grans emergències i incidents de protecció civil?",
    opcions: [
      "El CECAT (Centre de Coordinació Operativa de Catalunya).",
      "La Junta de Jutges.",
      "La Delegació del Govern espanyol.",
      "La Guàrdia Urbana de Barcelona."
    ],
    resposta: 0,
    explicacio: "El CECAT és el centre neuràlgic de la Direcció General de Protecció Civil de la Generalitat que canalitza les alertes i activa els plans d'emergència en coordinació amb el 112.",
    guiaPagina: 'Guia Oficial CME - Tema C.1 (Apartat 2.1)'
  },

  // --- Apartat 2.2: Joc i espectacles ---
  {
    id: 'cami_c1_2_2_01',
    ambit: 'Àmbit C',
    temaId: 'tema_c1',
    guiaTema: 'Tema C.1',
    seccio: 'Les competències de la Generalitat en matèria de seguretat',
    apartatId: 'c1_2_2',
    apartat: '2.2. Les competències en matèria de joc i espectacles',
    pregunta: "Quina llei catalana regula les condicions administratives, autoritzacions i règim d'inspecció dels espectacles públics i les activitats recreatives a Catalunya?",
    opcions: [
      "La Llei 11/2009, de 6 de juliol.",
      "La Llei 10/1994, d'11 de juliol.",
      "La Llei Orgànica 4/2015.",
      "El Codi Civil de Catalunya."
    ],
    resposta: 0,
    explicacio: "La Llei 11/2009 regula els espectacles públics i activitats recreatives a Catalunya, garantint la seguretat, convivència, control d'aforaments i règim sancionador.",
    guiaPagina: 'Guia Oficial CME - Tema C.1 (Apartat 2.2)'
  },
  {
    id: 'cami_c1_2_2_02',
    ambit: 'Àmbit C',
    temaId: 'tema_c1',
    guiaTema: 'Tema C.1',
    seccio: 'Les competències de la Generalitat en matèria de seguretat',
    apartatId: 'c1_2_2',
    apartat: '2.2. Les competències en matèria de joc i espectacles',
    pregunta: "Quina unitat especialitzada del cos de Mossos d'Esquadra té encomanada la vigilància i inspecció de bingos, casinos, màquines escurabutxaques i establiments d'apostes?",
    opcions: [
      "La Unitat Central de Joc i Espectacles (UCJE).",
      "L'Àrea de Desactivació d'Explosius (TEDAX).",
      "La Divisió de Trànsit.",
      "L'Àrea de Brigada Mòbil (BRIMO)."
    ],
    resposta: 0,
    explicacio: "La Unitat de Joc i Espectacles vetlla pel compliment de la normativa administrativa catalana sobre salons de joc, apostes, protecció de menors i persones autoprohibides.",
    guiaPagina: 'Guia Oficial CME - Tema C.1 (Apartat 2.2)'
  },

  // --- Apartat 2.3: Seguretat privada ---
  {
    id: 'cami_c1_2_3_01',
    ambit: 'Àmbit C',
    temaId: 'tema_c1',
    guiaTema: 'Tema C.1',
    seccio: 'Les competències de la Generalitat en matèria de seguretat',
    apartatId: 'c1_2_3',
    apartat: '2.3. Les competències en matèria de seguretat privada',
    pregunta: "Segons l'article 163 de l'EAC i la Llei 5/2014, de seguretat privada, quin tipus de competència té la Generalitat de Catalunya sobre empreses de seguretat privada amb seu exclusivament a Catalunya?",
    opcions: [
      "Cap competència, la seguretat privada és 100% estatal.",
      "Competència executiva d'autorització, inspecció i sanció de les empreses i despatxos amb domicili a Catalunya i l'àmbit d'actuació de les quals no superi el territori català.",
      "Competència legislativa per crear un cos de vigilants militars.",
      "Només la contractació de vigilants per a edificis judicials."
    ],
    resposta: 1,
    explicacio: "La Generalitat té la competència executiva per autoritzar, inspeccionar i sancionar empreses de seguretat privada, despatxos de detectius i centres de formació el domicili dels quals i àmbit d'actuació se circumscrigui a Catalunya.",
    guiaPagina: 'Guia Oficial CME - Tema C.1 (Apartat 2.3)'
  },
  {
    id: 'cami_c1_2_3_02',
    ambit: 'Àmbit C',
    temaId: 'tema_c1',
    guiaTema: 'Tema C.1',
    seccio: 'Les competències de la Generalitat en matèria de seguretat',
    apartatId: 'c1_2_3',
    apartat: '2.3. Les competències en matèria de seguretat privada',
    pregunta: "Quin pla oficial de cooperació i comunicació bidireccional lidera el cos de Mossos d'Esquadra amb el sector de la seguretat privada a Catalunya?",
    opcions: [
      "El Pla Red Azul.",
      "El Pla Redum.",
      "El Pla Olimpo.",
      "El Pla Activa Seguretat."
    ],
    resposta: 1,
    explicacio: "El Pla Redum (Xarxa de Cooperació amb la Seguretat Privada) és el model propi de coordinació i transferència d'informació de Mossos d'Esquadra amb els directors i caps de seguretat privada a Catalunya.",
    guiaPagina: 'Guia Oficial CME - Tema C.1 (Apartat 2.3)'
  },

  // --- Apartat 2.4: Seguretat pública ---
  {
    id: 'cami_c1_2_4_01',
    ambit: 'Àmbit C',
    temaId: 'tema_c1',
    guiaTema: 'Tema C.1',
    seccio: 'Les competències de la Generalitat en matèria de seguretat',
    apartatId: 'c1_2_4',
    apartat: '2.4. Les competències en matèria de seguretat pública',
    pregunta: "Quina llei catalana d'ordenació del sistema de seguretat pública articula la coordinació entre la Policia de la Generalitat i les policies locals de Catalunya?",
    opcions: [
      "La Llei 4/2003, de 7 d'abril.",
      "La Llei 16/1991, de 10 de juliol.",
      "La Llei 10/1994, d'11 de juliol.",
      "La Llei 5/2014, de 4 d'abril."
    ],
    resposta: 0,
    explicacio: "La Llei 4/2003, de 7 d'abril, d'ordenació del sistema de seguretat pública de Catalunya, defineix el sistema integral de seguretat, el Consell de Seguretat de Catalunya i la coordinació policial.",
    guiaPagina: 'Guia Oficial CME - Tema C.1 (Apartat 2.4)'
  },
  {
    id: 'cami_c1_2_4_02',
    ambit: 'Àmbit C',
    temaId: 'tema_c1',
    guiaTema: 'Tema C.1',
    seccio: 'Les competències de la Generalitat en matèria de seguretat',
    apartatId: 'c1_2_4',
    apartat: '2.4. Les competències en matèria de seguretat pública',
    pregunta: "Segons l'article 12 de la Llei 10/1994 de la PG-ME, quin és el comandament suprem del cos dels Mossos d'Esquadra?",
    opcions: [
      "El conseller o consellera d'Interior.",
      "El president o presidenta de la Generalitat de Catalunya.",
      "El major del cos.",
      "El director general de la Policia."
    ],
    resposta: 1,
    explicacio: "El comandament suprem del cos de Mossos d'Esquadra correspon al President de la Generalitat, el qual pot delegar l'exercici ordinari en el conseller competent en matèria de seguretat pública.",
    guiaPagina: 'Guia Oficial CME - Tema C.1 (Apartat 2.4)'
  },

  // --- Apartat 2.5: Trànsit, circulació de vehicles i seguretat viària ---
  {
    id: 'cami_c1_2_5_01',
    ambit: 'Àmbit C',
    temaId: 'tema_c1',
    guiaTema: 'Tema C.1',
    seccio: 'Les competències de la Generalitat en matèria de seguretat',
    apartatId: 'c1_2_5',
    apartat: '2.5. Matèria de trànsit, circulació de vehicles i seguretat viària',
    pregunta: "Mitjançant quin Reial Decret es va traspassar a la Generalitat de Catalunya les funcions i serveis de l'Estat en matèria de vigilància, disciplina i gestió del trànsit interurbà l'any 1997?",
    opcions: [
      "Reial decret 158/1997, de 7 de febrer.",
      "Reial decret 339/1990.",
      "Decret 184/1995.",
      "Ordre PRE/200/2004."
    ],
    resposta: 0,
    explicacio: "El Reial decret 158/1997 va fer efectiu el traspàs històric de competències de trànsit a la Generalitat, substituïnt la Guàrdia Civil de Trànsit pels Mossos d'Esquadra.",
    guiaPagina: 'Guia Oficial CME - Tema C.1 (Apartat 2.5)'
  },
  {
    id: 'cami_c1_2_5_02',
    ambit: 'Àmbit C',
    temaId: 'tema_c1',
    guiaTema: 'Tema C.1',
    seccio: 'Les competències de la Generalitat en matèria de seguretat',
    apartatId: 'c1_2_5',
    apartat: '2.5. Matèria de trànsit, circulació de vehicles i seguretat viària',
    pregunta: "Quin organisme autònom administratiu creat per la Llei 14/1997 té encomanada la gestió del trànsit a la xarxa viària interurbana de Catalunya i la tramitació dels expedients sancionadors?",
    opcions: [
      "La Direcció General de Trànsit (DGT).",
      "El Servei Català de Trànsit (SCT).",
      "L'Institut Català de Seguretat Viària.",
      "Ferrocarrils de la Generalitat."
    ],
    resposta: 1,
    explicacio: "El Servei Català de Trànsit (SCT), adscrit al Departament d'Interior, és l'organisme responsable de la regulació viària, radares, autoritzacions i sancions de trànsit a les carreteres catalanes.",
    guiaPagina: 'Guia Oficial CME - Tema C.1 (Apartat 2.5)'
  },
  {
    id: 'cami_c1_2_5_03',
    ambit: 'Àmbit C',
    temaId: 'tema_c1',
    guiaTema: 'Tema C.1',
    seccio: 'Les competències de la Generalitat en matèria de seguretat',
    apartatId: 'c1_2_5',
    apartat: '2.5. Matèria de trànsit, circulació de vehicles i seguretat viària',
    pregunta: "Quina divisió operativa del cos de Mossos d'Esquadra executa a la pràctica la vigilància del trànsit, els controls d'alcoholèmia i drogues, i la investigació d'accidents a vies interurbanes?",
    opcions: [
      "La Divisió de Trànsit (a través dels sectors i sectors regionals).",
      "La Divisió de Transport.",
      "L'Àrea Penitenciària.",
      "La Comissaria General d'Informació."
    ],
    resposta: 0,
    explicacio: "La Divisió de Trànsit dels Mossos d'Esquadra desplega els sectors de trànsit comarcals per a la vigilància, atenció a accidents i seguretat a la xarxa viària de Catalunya.",
    guiaPagina: 'Guia Oficial CME - Tema C.1 (Apartat 2.5)'
  },

  // =========================================================================
  // ÀMBIT D (ÚNIC): ACTUALITAT I CULTURA GENERAL
  // =========================================================================
  {
    id: 'cami_d_unic_01',
    ambit: 'Àmbit D',
    temaId: 'tema_d1',
    guiaTema: 'Àmbit D',
    seccio: 'Actualitat i Cultura General (Tema Únic)',
    apartatId: 'd_unic',
    apartat: 'Àmbit D · Actualitat i Cultura General',
    pregunta: "On està ubicada la seu central de l'Agència de la Unió Europea per a la Cooperació Policial (Europol), organisme clau d'intel·ligència criminal al qual els Mossos tenen accés?",
    opcions: [
      "A Lió (França).",
      "A La Haia (Països Baixos).",
      "A Brussel·les (Bèlgica).",
      "A Estrasburg (França)."
    ],
    resposta: 1,
    explicacio: "Europol té la seu a La Haia (Països Baixos). A Lió es troba la Secretaria General d'Interpol (Organització Internacional de Policia Criminal).",
    guiaPagina: 'Guia Oficial CME - Àmbit D (Actualitat)'
  },
  {
    id: 'cami_d_unic_02',
    ambit: 'Àmbit D',
    temaId: 'tema_d1',
    guiaTema: 'Àmbit D',
    seccio: 'Actualitat i Cultura General (Tema Únic)',
    apartatId: 'd_unic',
    apartat: 'Àmbit D · Actualitat i Cultura General',
    pregunta: "Com s'anomena la base de dades i sistema d'informació compartida de seguretat dels països de l'Espai Schengen al qual estan integrats els Mossos d'Esquadra per a controls i recerques de persones i vehicles?",
    opcions: [
      "Eurodac.",
      "SIS II (Sistema d'Informació de Schengen).",
      "Prüm System.",
      "Ecolcat."
    ],
    resposta: 1,
    explicacio: "El SIS II (Schengen Information System) permet consultar en temps real requisitòries europees, persones desaparegudes, ordres europees de detenció i armes o vehicles robats.",
    guiaPagina: 'Guia Oficial CME - Àmbit D (Actualitat)'
  },
  {
    id: 'cami_d_unic_03',
    ambit: 'Àmbit D',
    temaId: 'tema_d1',
    guiaTema: 'Àmbit D',
    seccio: 'Actualitat i Cultura General (Tema Únic)',
    apartatId: 'd_unic',
    apartat: 'Àmbit D · Actualitat i Cultura General',
    pregunta: "Quin municipi vallesà acull el Complex Central Egara, cor estratègic i seu central operativa dels Mossos d'Esquadra des de l'any 2009?",
    opcions: [
      "Sabadell.",
      "Terrassa.",
      "Mollet del Vallès.",
      "Granollers."
    ],
    resposta: 1,
    explicacio: "El Complex Central Egara es troba a Terrassa. A Mollet del Vallès hi ha l'Institut de Seguretat Pública de Catalunya (ISPC).",
    guiaPagina: 'Guia Oficial CME - Àmbit D (Actualitat)'
  },
  {
    id: 'cami_d_unic_04',
    ambit: 'Àmbit D',
    temaId: 'tema_d1',
    guiaTema: 'Àmbit D',
    seccio: 'Actualitat i Cultura General (Tema Únic)',
    apartatId: 'd_unic',
    apartat: 'Àmbit D · Actualitat i Cultura General',
    pregunta: "En quin any es va celebrar el primer referèndum d'aprovació del primer Estatut d'autonomia contemporani de Catalunya (l'Estatut de Núria) durant la Segona República?",
    opcions: [
      "1914.",
      "1931 (aprovat per les Corts republicanes el 1932).",
      "1939.",
      "1978."
    ],
    resposta: 1,
    explicacio: "L'Estatut de Núria es va redactar el 1931, es va sotmetre a plebiscit ciutadà l'agost de 1931 amb aclaparador vot a favor i va ser aprovat per les Corts Generals espanyoles el setembre de 1932.",
    guiaPagina: 'Guia Oficial CME - Àmbit D (Cultura)'
  },
  {
    id: 'cami_d_unic_05',
    ambit: 'Àmbit D',
    temaId: 'tema_d1',
    guiaTema: 'Àmbit D',
    seccio: 'Actualitat i Cultura General (Tema Únic)',
    apartatId: 'd_unic',
    apartat: 'Àmbit D · Actualitat i Cultura General',
    pregunta: "Quin acord de cooperació internacional de la Unió Europea, conegut com a 'Tractat de Prüm', permet a les policies dels estats membres l'intercanvi automatitzat d'ADN, empremtes dactilars i matrícules?",
    opcions: [
      "Tractat de Maastricht.",
      "Tractat de Prüm (2005).",
      "Acords de Schengen de 1985.",
      "Conveni d'Oviedo."
    ],
    resposta: 1,
    explicacio: "El Tractat de Prüm de 2005 (incorporat al marc de la UE per les decisions 2008/615/JAI) estableix la cooperació policial transfronterera automatitzada en perfils d'ADN i empremtes.",
    guiaPagina: 'Guia Oficial CME - Àmbit D (Actualitat)'
  },
  {
    id: 'cami_d_unic_06',
    ambit: 'Àmbit D',
    temaId: 'tema_d1',
    guiaTema: 'Àmbit D',
    seccio: 'Actualitat i Cultura General (Tema Únic)',
    apartatId: 'd_unic',
    apartat: 'Àmbit D · Actualitat i Cultura General',
    pregunta: "Quina festivitat oficial és celebrada institucionalment pel cos de Mossos d'Esquadra com a 'Dia de les Esquadres' en honor a la patrona del cos, la Verge de Montserrat?",
    opcions: [
      "El 22 d'abril.",
      "L'11 de setembre.",
      "El 12 d'octubre.",
      "El 23 de juny."
    ],
    resposta: 0,
    explicacio: "El Decret 64/2005 fixa oficialment el 22 d'abril com el Dia de les Esquadres, jornada de lliurament de condecoracions i medalles de reconeixement policial.",
    guiaPagina: 'Guia Oficial CME - Àmbit D (Cultura Policial)'
  },
  {
    id: 'cami_d_unic_07',
    ambit: 'Àmbit D',
    temaId: 'tema_d1',
    guiaTema: 'Àmbit D',
    seccio: 'Actualitat i Cultura General (Tema Únic)',
    apartatId: 'd_unic',
    apartat: 'Àmbit D · Actualitat i Cultura General',
    pregunta: "Quin document deontològic aprovat pel Govern de la Generalitat el 2013 estableix els valors ètics, de respecte als Drets Humans i de neutralitat política que han de regir l'actuació de la Policia de la Generalitat - Mossos d'Esquadra?",
    opcions: [
      "El Codi d'Ètica de la Policia de Catalunya.",
      "El Reglament Militar d'Acció Civil.",
      "El Manual Tàctic d'Intervenció Ràpida.",
      "La Carta Magna Europea."
    ],
    resposta: 0,
    explicacio: "El Codi d'Ètica de la Policia de Catalunya consagra els principis de proximitat, proporcionalitat, no discriminació, integritat i respecte escrupolós als drets i llibertats constitucionals.",
    guiaPagina: 'Guia Oficial CME - Àmbit D (Deontologia Policial)'
  },
  {
    id: 'cami_d_unic_08',
    ambit: 'Àmbit D',
    temaId: 'tema_d1',
    guiaTema: 'Àmbit D',
    seccio: 'Actualitat i Cultura General (Tema Únic)',
    apartatId: 'd_unic',
    apartat: 'Àmbit D · Actualitat i Cultura General',
    pregunta: "Quin històric president de la Generalitat a l'exili va retornar a Catalunya el 23 d'octubre de 1977 pronunciant la cèlebre frase 'Ciutadans de Catalunya, ja sóc aquí!', restaurant provisionalment la institució?",
    opcions: [
      "Lluís Companys.",
      "Josep Tarradellas.",
      "Francesc Macià.",
      "Jordi Pujol."
    ],
    resposta: 1,
    explicacio: "Josep Tarradellas va encapçalar el restabliment provisional de la Generalitat de Catalunya després del decret de setembre de 1977 i el seu retorn aclamat a la plaça Sant Jaume el 23 d'octubre de 1977.",
    guiaPagina: 'Guia Oficial CME - Àmbit D (Història Contemporània)'
  }
];
