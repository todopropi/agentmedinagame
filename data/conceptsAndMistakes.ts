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
    ambit: 'Àmbit B (Institucional)',
    concepteA: {
      nom: 'Tribunal Constitucional (Art. 159 CE)',
      caracteristiques: [
        'Intèrpret suprem de la Constitució.',
        'Independent de tots els poders de l\'Estat (NO forma part del Poder Judicial).',
        '12 magistrats nomenats pel Rei per 9 anys (es renoven per terços cada 3 anys).',
        'Resol Recursos i Qüestions d\'Inconstitucionalitat, i Recurs d\'Empara (arts. 14 a 29 i 30.2).'
      ],
      trampaExamen: 'El tribunal sol preguntar si pertany al Poder Judicial. Alerta: NO està integrat en el Poder Judicial!'
    },
    concepteB: {
      nom: 'Tribunal de Comptes (Art. 136 CE)',
      caracteristiques: [
        'Suprem òrgan fiscalitzador dels comptes i gestió econòmica de l\'Estat i sector públic.',
        'Depèn directament de les Corts Generals.',
        'Exerceix jurisdicció pròpia sobre responsabilitat comptable de qui gestiona fons públics.',
        'A Catalunya, l\'òrgan equivalent és la Sindicatura de Comptes (7 síndics elegits per 3/5 del Parlament).'
      ],
      trampaExamen: 'No confonguis jutjar delictes generals amb exigir responsabilitat exclusivament comptable/financera.'
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
        'Enfocament tàctic d\'infraestructura.'
      ],
      trampaExamen: 'Pregunta d\'examen literal (2021): "A diferència de la seguretat de la informació, la seguretat informàtica s\'associa a aspectes tècnics i operacionals".'
    },
    concepteB: {
      nom: 'Seguretat de la Informació (Estratègica / Governança)',
      caracteristiques: [
        'Es basa en aspectes estratègics i corporatius d\'alt nivell.',
        'Gestió integral de riscos, anàlisi d\'amenaces, plans de continuïtat de negoci i bones pràctiques.',
        'Garanteix la tríada CID: Confidencialitat, Integritat i Disponibilitat.'
      ],
      trampaExamen: 'No és un programari; és la política i estratègia corporativa de gestió de les dades.'
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
    "id": 'conf_decret_llei_vs_legislatiu',
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
        'Sempre és delicte més greu, independentment del valor dels béns sostrets.'
      ],
      trampaExamen: 'Força NO és empènyer la víctima (això és violència física i seria robatori amb violència Art. 242).'
    },
    reglaMnemotecnica: 'Furt = SENSE trencar res (400€ límit lleu). Robatori amb força = ESCALAR, FRACTURAR o CLAU FALSA (sempre és robatori).'
  }
];

export const MNEMONIC_CARDS = [
  {
    titol: '🏛️ B-I-E-S: Escales Policials dels Mossos',
    regla: 'Bàsica ➔ Intermèdia ➔ Executiva ➔ Superior',
    detall: 'Mosso & Caporal (Bàsica) | Sergent & Sotsinspector (Intermèdia) | Inspector (Executiva) | Intendent, Comissari & Major (Superior).'
  },
  {
    titol: '⏱️ 72h - 24h - 48h: Terminis de Detenció i Garanties',
    regla: '72h (Ordinari) · 24h (Menors i Habeas Corpus) · +48h (Pròrroga Terrorisme)',
    detall: 'Detenció ordinària màx. 72h (Art. 17.2 CE). Menors màx. 24h a Fiscalia. Habeas corpus resolt en 24h. Terrorisme fins a 5 dies (72h + 48h judicial).'
  },
  {
    titol: '🏢 D-À-U-G: Nivells Organitzatius dels Mossos',
    regla: 'Divisió > Àrea > Unitat > Grup',
    detall: 'El Grup sempre s\'adscriu a una Unitat. L\'Àrea agrupa diverses Unitats. La Divisió coordina diverses Àrees centrals.'
  },
  {
    titol: '🗳️ 135 - 350 - 705: Diputats per Cambra',
    regla: '135 (Parlament de Catalunya) · 350 (Congrés dels Diputats) · 705 (Parlament Europeu)',
    detall: 'Barcelona (85), Tarragona (18), Girona (17), Lleida (15) = 135 al Parlament de Catalunya.'
  },
  {
    titol: '📜 C-I-D: La Tríada de Seguretat de la Informació',
    regla: 'Confidencialitat · Integritat · Disponibilitat',
    detall: 'Confidencialitat: només autoritzats. Integritat: informació exacta sense alteració. Disponibilitat: accessible quan cal.'
  },
  {
    titol: '🍺 Factor x2: Taxes d\'Alcoholèmia',
    regla: 'Aire espirat x 2 = Sang',
    detall: 'General: 0,25 mg/l aire = 0,50 g/l sang. Novell/Professional: 0,15 mg/l aire = 0,30 g/l sang. Penal: >0,60 mg/l aire = >1,20 g/l sang.'
  }
];
