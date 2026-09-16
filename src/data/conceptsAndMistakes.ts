export interface ConfusionConcept {
  id: string;
  titol: string;
  ambit: string;
  concepteA: {
    nom: string;
    caracteristiques: string[];
    trampaExamen: string;
  };
  concepteB: {
    nom: string;
    caracteristiques: string[];
    trampaExamen: string;
  };
  reglaMnemotecnica: string;
}

export const CONFUSION_CONCEPTS: ConfusionConcept[] = [
  {
    id: 'conf_tc_vs_tcomptes',
    titol: 'Tribunal Constitucional vs. Tribunal de Comptes',
    ambit: 'Àmbit B (Institucional - Guia Oficial 2026)',
    concepteA: {
      nom: 'Tribunal Constitucional (Art. 159 CE)',
      caracteristiques: [
        'Intèrpret suprem de la Constitució (jurisdicció a tot el territori nacional).',
        'Independent de tots els poders de l\'Estat (NO forma part del Poder Judicial).',
        '12 membres anomenats pel Rei a proposta de: 4 Congrés (3/5), 4 Senat (3/5), 2 Govern, 2 CGPJ.',
        'Mandat de 9 anys, es renoven per terços cada 3 anys.',
        'Competències: Recursos i Qüestions d\'inconstitucionalitat, recurs d\'empara (arts. 14 a 29 i 30.2 CE).'
      ],
      trampaExamen: 'El tribunal sovint pregunta si és un òrgan del Poder Judicial. Alerta: El TC NO forma part del Poder Judicial!'
    },
    concepteB: {
      nom: 'Tribunal de Comptes (Art. 136 CE)',
      caracteristiques: [
        'Suprem òrgan fiscalitzador dels comptes i gestió econòmica de l\'Estat i sector públic.',
        'Depèn directament de les Corts Generals i exerceix les seves funcions per delegació d\'aquestes.',
        'Exerceix jurisdicció pròpia sobre responsabilitat comptable de qui gestiona fons públics.',
        'A Catalunya, l\'òrgan equivalent és la Sindicatura de Comptes (7 síndics elegits per 3/5 del Parlament per 6 anys).'
      ],
      trampaExamen: 'No confonguis jutjar delictes ordinaris amb jutjar la gestió econòmica i responsabilitat comptable.'
    },
    reglaMnemotecnica: 'TC = Drets, Lleis i Constitució (12 membres, 9 anys). T. Comptes = DÉU DEL DINER (Fiscalització i pressupostos).'
  },
  {
    id: 'conf_seg_info_vs_seg_inf',
    titol: 'Seguretat Informàtica vs. Seguretat de la Informació',
    ambit: 'Àmbit A (TIC - Tema A.7)',
    concepteA: {
      nom: 'Seguretat Informàtica (Tècnica / Operativa)',
      caracteristiques: [
        'S\'associa estrictament als aspectes tècnics i operacionals.',
        'Eines: tallafocs (firewalls), antivirus, pegats de seguretat, sistemes operatius, xarxes.',
        'Enfocament tàctic d\'infraestructura i sistemes de computació.'
      ],
      trampaExamen: 'Pregunta d\'examen literal: "A diferència de la seguretat de la informació, la seguretat informàtica s\'associa a aspectes tècnics i operacionals".'
    },
    concepteB: {
      nom: 'Seguretat de la Informació (Estratègica / Governança)',
      caracteristiques: [
        'Es basa en aspectes estratègics i corporatius d\'alt nivell.',
        'Gestió integral de riscos, anàlisi d\'amenaces, plans de continuïtat de negoci i bones pràctiques.',
        'Garanteix tres pilars: Confidencialitat, Integritat i Disponibilitat (CID).',
        'Inclou formació de personal, processos físics en paper, compliment normatiu (RGPD/LOPD).'
      ],
      trampaExamen: 'La seguretat de la informació engloba també suports no digitals (arxius en paper, control d\'accés físic).'
    },
    reglaMnemotecnica: 'Informàtica = CABLE, TÈCNIC I ANTIVIRUS. De la Informació = ESTRATÈGIA, RISCOS I TRÍADA CID.'
  },
  {
    id: 'conf_escales_pgme',
    titol: 'Escala Bàsica vs. Intermèdia vs. Executiva vs. Superior (PG-ME)',
    ambit: 'Àmbit C (Marc Legal - Llei 10/1994)',
    concepteA: {
      nom: 'Escala Bàsica i Intermèdia',
      caracteristiques: [
        'Bàsica: Mosso/a i Caporal/a (patrullatge, servei operatiu ordinari).',
        'Intermèdia: Sergent/a i Sotsinspector/a (comandament operatiu d\'unitats, grups i subgrups).'
      ],
      trampaExamen: 'Recorda que el Sergent NO és escala bàsica! Molts opositors cauen creient que el sergent és bàsica.'
    },
    concepteB: {
      nom: 'Escala Executiva i Superior',
      caracteristiques: [
        'Executiva: Inspector/a (gestió operativa d\'àrees i unitats). Només té una única categoria!',
        'Superior: Intendent/a, Comissari/ària i Major (direcció superior i comandament estratègic).'
      ],
      trampaExamen: 'A la Policia Local, l\'Inspector és escala executiva igual que a Mossos, però la Local té Superintendent i Intendent Major.'
    },
    reglaMnemotecnica: 'Regla B-I-E-S: Bàsica (Mosso, Caporal) ➔ Intermèdia (Sergent, Sotsinspector) ➔ Executiva (Inspector) ➔ Superior (Intendent, Comissari, Major).'
  },
  {
    id: 'conf_decret_llei_vs_legislatiu',
    titol: 'Decret Llei (Art. 86 CE) vs. Decret Legislatiu (Art. 82 CE)',
    ambit: 'Àmbit B (Ordenament Jurídic)',
    concepteA: {
      nom: 'Decret Llei (Govern d\'urgència)',
      caracteristiques: [
        'Dictat directament pel Govern en casos de necessitat extraordinària i urgent.',
        'Disposició provisional de 30 dies abans de la seva convalidació o derogació pel Congrés.',
        'Matèries vetades: institucions bàsiques de l\'Estat, drets del Títol I, règim CCAA i dret electoral.'
      ],
      trampaExamen: 'Termini sempre és 30 DIES (ni 15, ni 60) i es convalida al CONGRÉS (no al Senat).'
    },
    concepteB: {
      nom: 'Decret Legislatiu (Delegació de les Corts)',
      caracteristiques: [
        'Requereix delegació expressa i prèvia de les Corts Generals.',
        'Llei de bases ➔ Per formular un text articulat (prohibit modificar la mateixa base).',
        'Llei ordinària ➔ Per formular un text refós (harmonitzar i unificar normes vigents).'
      ],
      trampaExamen: 'Bases = Articulat. Ordinària = Refós. Mai es pot fer per Decret Legislatiu una matèria de Llei Orgànica!'
    },
    reglaMnemotecnica: 'Decret LLEI = LLAMP (Urgència, 30 dies). Decret LEGISLATIU = ENCARREC (Corts deleguen: Bases->Articulat, Ordinària->Refós).'
  },
  {
    id: 'conf_safety_vs_security',
    titol: 'Safety vs. Security (Àmbit Tecnològic i Policial)',
    ambit: 'Àmbit A (Tema A.7)',
    concepteA: {
      nom: 'Safety (Seguretat Ambiental / Protecció d\'Incidents)',
      caracteristiques: [
        'Protecció enfront accidents, riscos laborals, seguretat d\'instal·lacions (ascensors, incendis).',
        'Absència de risc involuntari o fortuït derivat del medi ambient o fallada tècnica.'
      ],
      trampaExamen: 'No es refereix a lladres ni ciberdelinqüents, sinó a prevenció de danys involuntaris.'
    },
    concepteB: {
      nom: 'Security (Seguretat Física / Lògica contra Intrusions)',
      caracteristiques: [
        'Prevenció contra atacs intencionats, intrusions humanes, sabotatge o ciberatacs.',
        'Control d\'accessos, càmeres, vigilància i seguretat ciutadana.'
      ],
      trampaExamen: 'La seguretat policial i ciberseguretat és sempre "Security".'
    },
    reglaMnemotecnica: 'Safety = SALUT I ACCIDENTS (foc, risc laboral). Security = SEGURETAT CONTRA DOL/ATACS (intrusió, robatori).'
  },
  {
    id: 'conf_furt_vs_robatori',
    titol: 'Furt (Art. 234 CP) vs. Robatori amb Força (Art. 238 CP)',
    ambit: 'Àmbit C (Codi Penal / Seguretat)',
    concepteA: {
      nom: 'Furt (Art. 234 Codi Penal)',
      caracteristiques: [
        'Apropriació de béns mobles aliens amb ànim de lucre SENSE força en les coses ni violència/intimidació.',
        'Furt lleu: valor ≤ 400 euros.',
        'Furt bàsic/greu: valor > 400 euros.'
      ],
      trampaExamen: 'El límit de 400 € només distingeix el furt lleu del menys greu. No existeix robatori lleu per sota de 400 € si hi ha força!'
    },
    concepteB: {
      nom: 'Robatori amb Força en les Coses (Art. 238 CP)',
      caracteristiques: [
        'Empra algun dels mitjans taxats: escalament, trencament de paret o sostre, fractura de portes/finestres, claus falses o desactivació d\'alarmes.',
        'Sempre és delicte més greu, independentment del valor dels béns sostrets (fins i tot per sota de 400 €).'
      ],
      trampaExamen: 'Força NO és empènyer la víctima (això és violència física i seria robatori amb violència Art. 242).'
    },
    reglaMnemotecnica: 'Furt = SENSE trencar res (400€ límit lleu). Robatori amb força = ESCALAR, FRACTURAR o CLAU FALSA (sempre és robatori).'
  },
  {
    id: 'conf_llei_organica_vs_ordinaria',
    titol: 'Llei Orgànica (Art. 81 CE) vs. Llei Ordinària',
    ambit: 'Àmbit B (Dret Constitucional - Tema B.1)',
    concepteA: {
      nom: 'Llei Orgànica (Art. 81 CE)',
      caracteristiques: [
        'Matèries reservades: desenvolupament dels drets fonamentals i llibertats públiques (Secció 1a, Cap. 2n, Títol I), aprovació dels Estatuts d\'Autonomia, règim electoral general i les altres previstes a la CE.',
        'Aprovació, modificació o derogació: Majoria Absoluta del Congrés en una votació final sobre el conjunt del projecte.'
      ],
      trampaExamen: 'Pregunta trampa: S\'exigeix majoria absoluta del Congrés i del Senat? Fals! Només del Congrés dels Diputats!'
    },
    concepteB: {
      nom: 'Llei Ordinària',
      caracteristiques: [
        'Regula qualsevol matèria no reservada expressament a Llei Orgànica.',
        'S\'aprova per Majoria Simple dels membres presents a cadascuna de les cambres (Congrés i Senat).'
      ],
      trampaExamen: 'Principi de relació: La LO i la ordinària tenen el mateix rang jeràrquic. Es regeixen pel principi de competència material, no pas jerarquia.'
    },
    reglaMnemotecnica: 'LO = Drets Fonamentals + Estatuts + Règim Electoral (Majoria Absoluta del Congrés). Ordinària = La resta (Majoria Simple).'
  },
  {
    id: 'conf_habeas_corpus_terminis',
    titol: 'Habeas Corpus (LO 6/1984) vs. Detenció Preventiva Ordinària (Art. 17 CE)',
    ambit: 'Àmbit B / C (Garanties de la Detenció)',
    concepteA: {
      nom: 'Detenció Preventiva Ordinària (Art. 17.2 CE)',
      caracteristiques: [
        'Termini màxim estricte de 72 hores abans de passar a disposició judicial o ser posat en llibertat.',
        'Regla d\'or constitucional: la detenció no podrà durar més del temps estrictament necessari per a la realització de les esbrinacions.',
        'Detenció de menors (LO 5/2000): màxim de 24 hores abans de posar a disposició de la Fiscalia de Menors.'
      ],
      trampaExamen: 'No cal esperar 72 hores si les diligències policials ja han finalitzat abans. El límit és el temps estrictament necessari.'
    },
    concepteB: {
      nom: 'Procediment d\'Habeas Corpus (LO 6/1984)',
      caracteristiques: [
        'Finalitat: posada a disposició judicial immediata de qui es considera il·legalment detingut.',
        'Jutge competent: Jutge d\'Instrucció del lloc on es trobi la persona detinguda.',
        'Termini màxim de resolució del jutge: 24 hores des que es dicta la interlocutòria d\'incoació.',
        'Legitimats per sol·licitar-lo: el detingut, cònjuge/parella, descendents, ascendents, germans, Defensor del Poble, Ministeri Fiscal i el propi Jutge d\'ofici.'
      ],
      trampaExamen: 'Un advocat defensor NO pot sol·licitar Habeas Corpus per si mateix llevat que ho demani en nom del detingut com a representant legítim.'
    },
    reglaMnemotecnica: 'Detenció = màx. 72h (adults) / 24h (menors a Fiscalia). Habeas Corpus = Jutge d\'Instrucció resol en 24h.'
  },
  {
    id: 'conf_inviolabilitat_immunitat',
    titol: 'Inviolabilitat vs. Immunitat dels Parlamentaris (Art. 71 CE / Art. 57 EAC)',
    ambit: 'Àmbit B (Organització Institucional)',
    concepteA: {
      nom: 'Inviolabilitat Parlamentària',
      caracteristiques: [
        'Protegeix les opinions manifestades i els vots emesos en l\'exercici de les seves funcions parlamentàries.',
        'És perpètua: continua tenint efecte fins i tot després d\'haver finalitzat el mandat com a diputat.'
      ],
      trampaExamen: 'No protegeix d\'actes o opinions expressades fora de l\'exercici parlamentari (ex: un tuit personal injuriós o una baralla al carrer).'
    },
    concepteB: {
      nom: 'Immunitat Parlamentària',
      caracteristiques: [
        'Protecció processal: durant el període del seu mandat, només podran ser detinguts en cas de flagrant delicte.',
        'No podran ser inculpats ni processats sense la prèvia autorització de la cambra respectiva (suplicatori a les Corts).',
        'És temporal: només dura mentre estigui en vigor el mandat representatiu.'
      ],
      trampaExamen: 'Si hi ha flagrant delicte (comès a la vista dels agents de policia), SÍ que poden ser detinguts immediatament!'
    },
    reglaMnemotecnica: 'Inviolabilitat = Opinions i vots (perpètua). Immunitat = Detenció i judici (temporal, excepte flagrant delicte).'
  },
  {
    id: 'conf_alcohol_via_penal_adm',
    titol: 'Taxes d\'Alcoholèmia: Infracció Administrativa vs. Delicte Penal (Art. 379 CP)',
    ambit: 'Àmbit C (Seguretat Viària - Guia 2026)',
    concepteA: {
      nom: 'Límit Administratiu (RGCir / Llei de Trànsit)',
      caracteristiques: [
        'General: > 0,25 mg/l en aire espirat (o > 0,50 g/l en sang).',
        'Novells (primer any de permís) i Professionals: > 0,15 mg/l aire espirat (o > 0,30 g/l sang).',
        'Menors d\'edat que condueixen vehicles (patinets elèctrics, ciclomotors): taxa ZERO (0,0 mg/l i 0,0 g/l).'
      ],
      trampaExamen: 'Els menors d\'edat tenen taxa 0,0! No s\'aplica la taxa novell de 0,15 als menors.'
    },
    concepteB: {
      nom: 'Delicte Penal contra la Seguretat Viària (Art. 379.2 CP)',
      caracteristiques: [
        'Taxa taxada objectiva penal: superar 0,60 mg/l en aire espirat (o 1,20 g/l en sang).',
        'Sempre és delicte si se supera aquesta taxa, sense necessitat de demostrar que la conducció estava alterada o en ziga-zaga.',
        'També és delicte amb taxes inferiors si s\'acredita la influència de l\'alcohol en la conducció.'
      ],
      trampaExamen: 'Recorda la negativa a sotmetre\'s a les proves (Art. 383 CP): pena de presó de 6 mesos a 1 any i privació de conduir d\'1 a 4 anys.'
    },
    reglaMnemotecnica: '0,25 general | 0,15 novell/pro | 0,0 menors. Si passa de 0,60 mg/l = FISCALIA I PENAL DIRECTE!'
  },
  {
    id: 'conf_armes_categoria_1_2',
    titol: 'Reglament d\'Armes (RD 137/1993): 1a Categoria vs. 2a Categoria',
    ambit: 'Àmbit C (Armes i Seguretat Ciutadana)',
    concepteA: {
      nom: '1a Categoria (Armes de Foc Curtes)',
      caracteristiques: [
        'Pistoles i revòlvers.',
        'Armes curtes de foc concebudes per ser empunyades amb una sola mà.',
        'Llicència necessària per a particulars: Llicència B (estrictament justificada per motius de defensa personal).'
      ],
      trampaExamen: 'L\'arma reglamentària del cos de Mossos d\'Esquadra és arma curta de 1a categoria (guia de pertinença A).'
    },
    concepteB: {
      nom: '2a Categoria (Armes de Foc Llargues)',
      caracteristiques: [
        '2a.1: Armes de foc llargues per a vigilància i guarderia (escopetes de canons de 60 cm o més, pistoles de senyals). Llicència C.',
        '2a.2: Armes de foc llargues ratllades per a caça major (rifles, carrabines de canó estriat). Llicència D.'
      ],
      trampaExamen: 'Les escopetes de caça menor són de 3a categoria (Llicència E), no pas de 2a categoria!'
    },
    reglaMnemotecnica: '1a Cat = Curtes (Pistola/Revòlver). 2a Cat = Llargues ratllades (Rifle) / vigilància. 3a Cat = Escopetes lises de caça.'
  }
];

export const MNEMONIC_CARDS = [
  {
    id: 'mnemo_1',
    titol: '🏛️ B-I-E-S: Les 4 Escales del Cos de Mossos d\'Esquadra (Llei 10/1994)',
    regla: 'Bàsica ➔ Intermèdia ➔ Executiva ➔ Superior',
    detall: '1. Bàsica: Mosso/a i Caporal/a. | 2. Intermèdia: Sergent/a i Sotsinspector/a. | 3. Executiva: Inspector/a. | 4. Superior: Intendent/a, Comissari/a i Major.'
  },
  {
    id: 'mnemo_2',
    titol: '⏱️ 72h - 24h - 48h: La Trilogia de Terminis de Detenció (CE i LECrim)',
    regla: '72h (Ordinari) · 24h (Menors i Habeas Corpus) · +48h (Pròrroga Terrorisme)',
    detall: 'Detenció ordinària màx. 72h (Art. 17.2 CE). Menors màx. 24h a Fiscalia de Menors (LO 5/2000). El Jutge resol l\'Habeas Corpus en 24h. Terrorisme fins a 5 dies totals (72h + 48h pròrroga judicial).'
  },
  {
    id: 'mnemo_3',
    titol: '🏢 D-À-U-G: Organització Estructural dels Mossos d\'Esquadra',
    regla: 'Divisió > Àrea > Unitat > Grup',
    detall: 'Estructura descendent oficial: Divisió (comandada per Comissari/Intendent) ➔ Àrea (Intendent/Inspector) ➔ Unitat (Sotsinspector/Sergent) ➔ Grup (Caporal/Mosso). L\'Escamot/Patrulla s\'integra dins el Grup.'
  },
  {
    id: 'mnemo_4',
    titol: '🗳️ 135 - 350 - 705: Escapulari de Diputats i Cambres Oficials',
    regla: '135 (Parlament de Catalunya) · 350 (Congrés dels Diputats) · 705 (Parlament Europeu)',
    detall: 'Parlament de Catalunya: Barcelona 85, Tarragona 18, Girona 17, Lleida 15 (Total 135). Congrés dels Diputats: mínim 300 màxim 400 (fixat en 350 per la LOREG).'
  },
  {
    id: 'mnemo_5',
    titol: '📜 C-I-D: Els 3 Pilars de la Seguretat de la Informació (Guia Tema A.7)',
    regla: 'Confidencialitat · Integritat · Disponibilitat',
    detall: 'Confidencialitat: accés exclusiu a persones autoritzades. Integritat: la informació roman fidel, exacta i sense alteracions fraudulentes. Disponibilitat: accessible quan es requereix pels usuaris autoritzats.'
  },
  {
    id: 'mnemo_6',
    titol: '🍺 Factor x2: Conversió de Taxes d\'Alcoholèmia (RGCir / CP)',
    regla: 'Aire espirat (mg/l) x 2 = Sang (g/l)',
    detall: 'General: 0,25 mg/l aire = 0,50 g/l sang. Novell/Professional: 0,15 mg/l aire = 0,30 g/l sang. Taxa zero (0,0) per a menors. Penal objectiu: >0,60 mg/l aire = >1,20 g/l sang.'
  },
  {
    id: 'mnemo_7',
    titol: '⚖️ 3/5 - 2/3: Majories Qualificades del Parlament de Catalunya',
    regla: '3/5: Síndic de Greuges, Sindicatura de Comptes, CAC | 2/3: Reforma de l\'Estatut (EAC)',
    detall: 'Per elegir el Síndic de Greuges i els 7 membres de la Sindicatura de Comptes calen 3/5 dels diputats (81 diputats). Per aprovar la proposta de reforma de l\'Estatut calen 2/3 (90 diputats).'
  },
  {
    id: 'mnemo_8',
    titol: '🇪🇺 27 - 1957 - 1986: Dates Clau de la Unió Europea',
    regla: '27 Estats membres · 1957 (Tractat de Roma) · 1986 (Adhesió d\'Espanya)',
    detall: 'El Tractat de Roma (1957) va crear la CEE i l\'EURATOM. Espanya i Portugal van ingressar l\'1 de gener de 1986. El Tractat de Maastricht (1992) va crear oficialment la Unió Europea.'
  },
  {
    id: 'mnemo_9',
    titol: '🛡️ 3 Pilars de Policia Judicial (Art. 126 CE / LO 2/1986)',
    regla: 'Dependència Orgànica (Departament d\'Interior) vs. Funcional (Jutges i Fiscals)',
    detall: 'Orgànicament la Policia Judicial depèn de la Generalitat / Ministeri. Funcionalment depèn exclusivament dels Jutges, Tribunals i Ministeri Fiscal quan investiga delictes, sense que ningú pugui interferir.'
  }
];
