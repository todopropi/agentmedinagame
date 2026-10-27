import { PLMunicipi, PLTema } from '../types/policiaLocal';

export const INITIAL_PL_MUNICIPIS: PLMunicipi[] = [
  {
    id: 'sant_esteve_sesrovires',
    slug: 'sant-esteve-sesrovires',
    name: 'Sant Esteve Sesrovires',
    emblem_url: '',
    banner_color: 'emerald',
    status: 'pending',
    notes: 'Convocatòria d’accés a la Policia Local de Sant Esteve Sesrovires. Annex I (Temari General) i Annex II (Temari Específic).',
    cultura_weight: 50,
    temari_weight: 50,
    order_index: 1
  },
  {
    id: 'el_vendrell',
    slug: 'el-vendrell',
    name: 'El Vendrell',
    emblem_url: '',
    banner_color: 'blue',
    status: 'pending',
    notes: 'Bases oficials de la Policia Local del Vendrell (Baix Penedès). 40 temes teòrics generals i locals.',
    cultura_weight: 50,
    temari_weight: 50,
    order_index: 2
  },
  {
    id: 'cubelles',
    slug: 'cubelles',
    name: 'Cubelles',
    emblem_url: '',
    banner_color: 'cyan',
    status: 'pending',
    notes: 'Bases del procés selectiu de la Policia Local de Cubelles (Garraf). 40 temes de temari oficial.',
    cultura_weight: 50,
    temari_weight: 50,
    order_index: 3
  }
];

export const INITIAL_PL_TEMES_COMUNS: PLTema[] = [
  {
    id: 'comu_tema_1',
    scope: 'comu',
    num: 1,
    code: 'Tema Comú 1',
    title: 'La Constitució espanyola de 1978: Principis generals, drets i deures fonamentals',
    description: 'Estructura i principis generals. Drets i llibertats fonamentals. Garanties i suspensió dels drets. El Tribunal Constitucional.'
  },
  {
    id: 'comu_tema_2',
    scope: 'comu',
    num: 2,
    code: 'Tema Comú 2',
    title: "L'Estatut d'Autonomia de Catalunya i l'Organització Territorial",
    description: 'Estructura i contingut. Drets i deures estatutaris. Institucions de la Generalitat (Parlament, President, Govern, Síndic). Competències de seguretat.'
  },
  {
    id: 'comu_tema_3',
    scope: 'comu',
    num: 3,
    code: 'Tema Comú 3',
    title: 'El Municipi i el Règim Local',
    description: "Organització, territori i població. El padró d'habitants. Òrgans de govern municipal: Alcalde, Ple, Junta de Govern Local i comissions."
  },
  {
    id: 'comu_tema_4',
    scope: 'comu',
    num: 4,
    code: 'Tema Comú 4',
    title: 'Procediment Administratiu Comú i Potestat Sancionadora (Llei 39/2015)',
    description: "L'acte administratiu: concepte, classes, validesa i eficàcia. Drets dels ciutadans. Terminis, notificacions i recursos administratius."
  },
  {
    id: 'comu_tema_5',
    scope: 'comu',
    num: 5,
    code: 'Tema Comú 5',
    title: 'Marc Legal de Seguretat i Forces i Cossos de Seguretat (LO 2/1986)',
    description: "Principis bàsics d'actuació. Cossos policials estatals, autonòmics i locals. Relacions i deure de cooperació mútua."
  },
  {
    id: 'comu_tema_6',
    scope: 'comu',
    num: 6,
    code: 'Tema Comú 6',
    title: 'La Llei 16/1991 de Policies Locals de Catalunya',
    description: 'Naturalesa i funcions. Escales i categories. Drets, deures i règim disciplinari (faltes lleus, greus i molt greus).'
  },
  {
    id: 'comu_tema_7',
    scope: 'comu',
    num: 7,
    code: 'Tema Comú 7',
    title: 'Llei 4/2003 d’ordenació del sistema de seguretat pública de Catalunya',
    description: 'Autoritats de seguretat. Coordinació policial i Junta Local de Seguretat. El sistema integral de seguretat català.'
  },
  {
    id: 'comu_tema_8',
    scope: 'comu',
    num: 8,
    code: 'Tema Comú 8',
    title: 'Protecció de la Seguretat Ciutadana (LO 4/2015)',
    description: "Identificació de persones, comprovacions i registres corporals o de vehicles. Règim d'infraccions i sancions."
  },
  {
    id: 'comu_tema_9',
    scope: 'comu',
    num: 9,
    code: 'Tema Comú 9',
    title: 'La Detenció Policial, Drets del Detingut i Habeas Corpus',
    description: 'Supòsits legals de detenció (art. 490 i 492 LECrim). Drets del detingut (art. 520 LECrim). Detenció de menors. Procediment d’Habeas Corpus.'
  },
  {
    id: 'comu_tema_10',
    scope: 'comu',
    num: 10,
    code: 'Tema Comú 10',
    title: 'Entrada i Registre en Domicili i Inviolabilitat',
    description: 'Requisits constitucionals. Consentiment, resolució judicial i delicte flagrant. Actuació policial d’urgència.'
  },
  {
    id: 'comu_tema_11',
    scope: 'comu',
    num: 11,
    code: 'Tema Comú 11',
    title: 'La Denúncia i l’Atestat Policial',
    description: 'Concepte i classes de denúncia. Dret i deure de denunciar. Estructura de l’atestat policial i valor processal.'
  },
  {
    id: 'comu_tema_12',
    scope: 'comu',
    num: 12,
    code: 'Tema Comú 12',
    title: 'Dret Penal: Concepte de delicte, formes i delictes freqüents',
    description: "Dol i imprudència. Autoria i complicitat. Delictes contra les persones, contra el patrimoni (furt, robatori) i delictes comesos per funcionaris públics."
  },
  {
    id: 'comu_tema_13',
    scope: 'comu',
    num: 13,
    code: 'Tema Comú 13',
    title: 'Trànsit, Circulació de Vehicles de Motor i Seguretat Viària',
    description: 'Llei de Seguretat Viària i Reglament General de Circulació. Normes de circulació, prioritats, senyalització i velocitats. Immobilització de vehicles.'
  },
  {
    id: 'comu_tema_14',
    scope: 'comu',
    num: 14,
    code: 'Tema Comú 14',
    title: 'Delictes contra la Seguretat Viària i Accidents de Trànsit',
    description: 'Conducció sota alcohol o drogues. Taxes d’alcoholèmia reglamentàries i penals. Conducció temerària i sense permís. Atestats d’accidents.'
  },
  {
    id: 'comu_tema_15',
    scope: 'comu',
    num: 15,
    code: 'Tema Comú 15',
    title: 'Violència de Gènere, Domèstica i Delictes d’Odi',
    description: 'Marc regulador (Llei 1/2004, Llei catalana 5/2008 i 17/2020). Protocols policials d’atenció a la víctima i valoració del risc (VioGén).'
  },
  {
    id: 'comu_tema_16',
    scope: 'comu',
    num: 16,
    code: 'Tema Comú 16',
    title: 'Ètica i Deontologia Policial',
    description: 'Codi d’ètica de la Policia de Catalunya (Acord GOV/25/2015). Carta dels Drets Fonamentals de la UE. Integritat, imparcialitat i ús legítim de la força.'
  }
];

export const INITIAL_PL_TEMES_CULTURA: PLTema[] = [
  {
    id: 'cultura_tema_1',
    scope: 'cultura_general',
    num: 1,
    code: 'Cultura 1',
    title: 'Història de Catalunya: De l’antiguitat a l’edat contemporània',
    description: 'Pobles ibers i romans, formació de Catalunya, segles d’or, 1714, Revolució Industrial i recuperació democràtica.'
  },
  {
    id: 'cultura_tema_2',
    scope: 'cultura_general',
    num: 2,
    code: 'Cultura 2',
    title: 'Geografia física, comarques i demografia de Catalunya',
    description: 'Relleu, conques hidrogràfiques, principals eixos viaris, mapa comarcal i distribució de la població.'
  },
  {
    id: 'cultura_tema_3',
    scope: 'cultura_general',
    num: 3,
    code: 'Cultura 3',
    title: 'Institucions catalanes, europees i internacionals',
    description: 'Òrgans de la Generalitat, institucions de la Unió Europea (Parlament, Comissió, Consell) i Nacions Unides.'
  },
  {
    id: 'cultura_tema_4',
    scope: 'cultura_general',
    num: 4,
    code: 'Cultura 4',
    title: 'Cultura, patrimoni, art i tradicions de Catalunya',
    description: 'Modernisme, festes tradicionals, patrimoni de la humanitat de la UNESCO i escriptors/artistes catalans.'
  },
  {
    id: 'cultura_tema_5',
    scope: 'cultura_general',
    num: 5,
    code: 'Cultura 5',
    title: 'Actualitat política, econòmica, tecnològica i social 2025-2026',
    description: 'Fets destacats recents, canvis legislatius, esdeveniments mundials i notícies de l’àmbit de la seguretat.'
  }
];

export const INITIAL_PL_TEMES_SANTESTEVE: PLTema[] = [
  // ANNEX I: Temari general (1 al 21)
  {
    id: 'se_tema_1',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex I: Temari general',
    num: 1,
    code: 'Tema 1',
    title: 'La Constitució espanyola de 1978; principis generals i drets fonamentals dels espanyols.'
  },
  {
    id: 'se_tema_2',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex I: Temari general',
    num: 2,
    code: 'Tema 2',
    title: "Les comunitats autònomes. L'Estatut d'Autonomia de Catalunya. Òrgans legislatius, executius i judicials de la Generalitat de Catalunya."
  },
  {
    id: 'se_tema_3',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex I: Temari general',
    num: 3,
    code: 'Tema 3',
    title: 'El municipi: organització, territori i població. Competències municipals.'
  },
  {
    id: 'se_tema_4',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex I: Temari general',
    num: 4,
    code: 'Tema 4',
    title: "Els òrgans de govern municipals: l'alcalde, el ple de l'ajuntament i la Junta de govern. Les comissions informatives. Altres òrgans municipals."
  },
  {
    id: 'se_tema_5',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex I: Temari general',
    num: 5,
    code: 'Tema 5',
    title: "Llei 39/2015, d’1 d’octubre, del procediment administratiu comú de les administracions públiques. L'acte administratiu: concepte i classes."
  },
  {
    id: 'se_tema_6',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex I: Temari general',
    num: 6,
    code: 'Tema 6',
    title: 'El personal al servei de les corporacions locals; Drets i deures. Règim disciplinari.'
  },
  {
    id: 'se_tema_7',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex I: Temari general',
    num: 7,
    code: 'Tema 7',
    title: "L'administrat: drets i deures. Col·laboració i participació dels ciutadans en les funcions administratives."
  },
  {
    id: 'se_tema_8',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex I: Temari general',
    num: 8,
    code: 'Tema 8',
    title: "El marc legal de la seguretat a l'Estat: Forces i cossos de seguretat."
  },
  {
    id: 'se_tema_9',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex I: Temari general',
    num: 9,
    code: 'Tema 9',
    title: 'La policia de Catalunya: Competències de la Generalitat en matèria de seguretat ciutadana.'
  },
  {
    id: 'se_tema_10',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex I: Temari general',
    num: 10,
    code: 'Tema 10',
    title: 'Les policies locals a Catalunya: concepte i funcions. Dependències orgàniques i funcionals. Llei 16/1991, de 10 de juliol, de les policies locals i el seu desplegament reglamentari. Drets i deures. Règim disciplinari.'
  },
  {
    id: 'se_tema_11',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex I: Temari general',
    num: 11,
    code: 'Tema 11',
    title: 'Codi deontològic policial.'
  },
  {
    id: 'se_tema_12',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex I: Temari general',
    num: 12,
    code: 'Tema 12',
    title: 'La coordinació entre cossos policials que actuen a Catalunya.'
  },
  {
    id: 'se_tema_13',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex I: Temari general',
    num: 13,
    code: 'Tema 13',
    title: 'La policia administrativa, la policia local com a policia judicial i la policia assistencial.'
  },
  {
    id: 'se_tema_14',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex I: Temari general',
    num: 14,
    code: 'Tema 14',
    title: 'La funció policial en matèria de seguretat ciutadana, seguretat viària i trànsit.'
  },
  {
    id: 'se_tema_15',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex I: Temari general',
    num: 15,
    code: 'Tema 15',
    title: 'Les ordenances municipals. Tipus i àmbit competencial de la policia local.'
  },
  {
    id: 'se_tema_16',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex I: Temari general',
    num: 16,
    code: 'Tema 16',
    title: "La protecció de dades de caràcter personal: règim jurídic i els seus àmbits subjectiu, objectiu i formal d'aplicació."
  },
  {
    id: 'se_tema_17',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex I: Temari general',
    num: 17,
    code: 'Tema 17',
    title: 'Vies de protecció de la privadesa: principis, exigències, drets dels afectats i règim sancionador.'
  },
  {
    id: 'se_tema_18',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex I: Temari general',
    num: 18,
    code: 'Tema 18',
    title: "Llei 17/2015, 21 de juliol, d'igualtat efectiva entre dones i homes. Llei orgànica 3/2007, de 22 de març, per a la igualtat efectiva entre dones i homes."
  },
  {
    id: 'se_tema_19',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex I: Temari general',
    num: 19,
    code: 'Tema 19',
    title: "Llei 19/2020, del 30 de desembre, d'igualtat de tracte i no-discriminació."
  },
  {
    id: 'se_tema_20',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex I: Temari general',
    num: 20,
    code: 'Tema 20',
    title: "Acord GOV/25/2015, de 24 de febrer, pel qual s'aprova el Codi d'ètica de la Policia de Catalunya. La Carta dels drets fonamentals de la Unió Europea, Estrasburg 12 de desembre de 2007."
  },
  {
    id: 'se_tema_21',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex I: Temari general',
    num: 21,
    code: 'Tema 21',
    title: "Llei Orgànica 10/1995, de 23 de novembre, del Codi Penal. Llibre II. Títol VIII Delictes contra la llibertat i indemnitat sexuals. Títol XXI Capítol V Delictes comesos pels funcionaris públics contra les garanties constitucionals. La violència de Gènere i els delictes d'odi a l'ordenament jurídic."
  },

  // ANNEX II: Temari específic (22 al 40)
  {
    id: 'se_tema_22',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex II: Temari específic',
    num: 22,
    code: 'Tema 22',
    title: "Normes de circulació: la Llei de Seguretat Vial, Reglament general de circulació i d'altres normes d'aplicació."
  },
  {
    id: 'se_tema_23',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex II: Temari específic',
    num: 23,
    code: 'Tema 23',
    title: "Accidents de circulació: actuacions en matèria de d'accidents. Diligències."
  },
  {
    id: 'se_tema_24',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex II: Temari específic',
    num: 24,
    code: 'Tema 24',
    title: 'La protecció civil: autoritats competents. Actuacions en matèria de protecció civil.'
  },
  {
    id: 'se_tema_25',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex II: Temari específic',
    num: 25,
    code: 'Tema 25',
    title: "Coneixements generals del municipi: introducció històrica. Nuclis rurals. Nuclis urbans. Característiques socials i culturals, Característiques i situació de les urbanitzacions. Serveis. Comunicacions. Monuments. Edificis i zones d'interès."
  },
  {
    id: 'se_tema_26',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex II: Temari específic',
    num: 26,
    code: 'Tema 26',
    title: 'La denúncia: Conceptes i classes. El dret i el deure de denunciar. Efectes de la denúncia.'
  },
  {
    id: 'se_tema_27',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex II: Temari específic',
    num: 27,
    code: 'Tema 27',
    title: 'L’atestat policial: Estructura. Valor dels atestats policials.'
  },
  {
    id: 'se_tema_28',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex II: Temari específic',
    num: 28,
    code: 'Tema 28',
    title: 'La detenció. Concepte. Supòsits legals en què és procedent la detenció. Els drets del detingut. La detenció de menors.'
  },
  {
    id: 'se_tema_29',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex II: Temari específic',
    num: 29,
    code: 'Tema 29',
    title: 'Delictes en què poden incórrer els policies en l’exercici del seu càrrec.'
  },
  {
    id: 'se_tema_30',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex II: Temari específic',
    num: 30,
    code: 'Tema 30',
    title: 'Control de drogues i estupefaents: Regulació i actuacions policials.'
  },
  {
    id: 'se_tema_31',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex II: Temari específic',
    num: 31,
    code: 'Tema 31',
    title: 'Espectacles públics i activitats recreatives: Competències, regulació i règim sancionador.'
  },
  {
    id: 'se_tema_32',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex II: Temari específic',
    num: 32,
    code: 'Tema 32',
    title: 'Paper de la policia local en la protecció civil. Els plans d’emergència.'
  },
  {
    id: 'se_tema_33',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex II: Temari específic',
    num: 33,
    code: 'Tema 33',
    title: 'Violència de gènere. Regulació i protocols d’actuació.'
  },
  {
    id: 'se_tema_34',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex II: Temari específic',
    num: 34,
    code: 'Tema 34',
    title: 'Legislació de menors.'
  },
  {
    id: 'se_tema_35',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex II: Temari específic',
    num: 35,
    code: 'Tema 35',
    title: 'Estrangeria: Drets i llibertats dels estrangers, situacions d’irregularitat, actuacions policials.'
  },
  {
    id: 'se_tema_36',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex II: Temari específic',
    num: 36,
    code: 'Tema 36',
    title: 'L’entrada i registre: Requisits, formalitats i supòsits excepcional.'
  },
  {
    id: 'se_tema_37',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex II: Temari específic',
    num: 37,
    code: 'Tema 37',
    title: 'Policia administrativa: Principals infraccions a les ordenances municipals, estructura de les denúncies i règim sancionador.'
  },
  {
    id: 'se_tema_38',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex II: Temari específic',
    num: 38,
    code: 'Tema 38',
    title: 'Els delictes comesos en l’àmbit familiar.'
  },
  {
    id: 'se_tema_39',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex II: Temari específic',
    num: 39,
    code: 'Tema 39',
    title: 'La protecció del medi ambient. El delicte ecològic.'
  },
  {
    id: 'se_tema_40',
    municipi_id: 'sant_esteve_sesrovires',
    scope: 'municipi',
    annex: 'Annex II: Temari específic',
    num: 40,
    code: 'Tema 40',
    title: 'Policia assistencial: Objectius bàsics de la funció de la policia assistencial, tècniques i àmbits d’actuació. Policia comunitària: Concepte, funcions i organització.'
  }
];

export const INITIAL_PL_TEMES_VENDRELL: PLTema[] = [
  {
    id: 'vd_tema_1',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 1,
    code: 'Tema 1',
    title: 'La Constitució espanyola de 1978.',
    description: 'Estructura i principis generals. Els drets i les llibertats fonamentals. Els drets i deures dels ciutadans. Garanties dels drets i llibertats. El Tribunal Constitucional. La reforma constitucional.'
  },
  {
    id: 'vd_tema_2',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 2,
    code: 'Tema 2',
    title: 'L’organització territorial de l’Estat.',
    description: 'Principis constitucionals. Les comunitats autònomes. Les províncies i els municipis. L’autonomia local. El principi de coordinació i cooperació entre les administracions públiques.'
  },
  {
    id: 'vd_tema_3',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 3,
    code: 'Tema 3',
    title: 'L’Estatut d’autonomia de Catalunya.',
    description: 'Estructura i contingut. Els drets i deures estatutaris. Les institucions de la Generalitat. El municipi i l’autonomia local. Les competències de la Generalitat en matèria de seguretat pública i ordenació de les policies locals.'
  },
  {
    id: 'vd_tema_4',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 4,
    code: 'Tema 4',
    title: 'L\'Organització Municipal i el Municipi.',
    description: "El municipi: concepte, naturalesa jurídica i elements constitutius (població, territori i organització). El terme municipal i el padró municipal d'habitants. Òrgans de govern municipal: l'Alcalde, el Ple municipal, la Junta de Govern Local, els tinents d'alcalde i les comissions informatives."
  },
  {
    id: 'vd_tema_5',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 5,
    code: 'Tema 5',
    title: 'L’alcalde o alcaldessa i la seguretat pública municipal.',
    description: 'Competències en matèria de seguretat i policia local. La direcció superior de la Policia Local. Relacions entre l’alcaldia, la regidoria responsable de seguretat i la prefectura del cos.'
  },
  {
    id: 'vd_tema_6',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 6,
    code: 'Tema 6',
    title: 'El règim de funcionament de les entitats locals.',
    description: 'Convocatòries i sessions dels òrgans col·legiats. Adopció d’acords. Actes. Majories. Publicitat i executivitat dels acords.'
  },
  {
    id: 'vd_tema_7',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 7,
    code: 'Tema 7',
    title: 'Les ordenances i els reglaments municipals.',
    description: 'Concepte i naturalesa. Procediment d’elaboració i aprovació. Publicació i entrada en vigor. Aplicació de les ordenances municipals. Incompliment i règim sancionador.'
  },
  {
    id: 'vd_tema_8',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 8,
    code: 'Tema 8',
    title: 'La potestat sancionadora de les administracions públiques.',
    description: 'Principis de la potestat sancionadora. Infraccions i sancions. Responsabilitat. Prescripció. Procediment sancionador. Competències municipals en matèria sancionadora.'
  },
  {
    id: 'vd_tema_9',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 9,
    code: 'Tema 9',
    title: 'El procediment administratiu comú.',
    description: 'L’acte administratiu. Els interessats. Drets de les persones en les seves relacions amb l’Administració. Terminis. Notificacions. Validesa i eficàcia dels actes administratius. Recursos administratius.'
  },
  {
    id: 'vd_tema_10',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 10,
    code: 'Tema 10',
    title: 'La responsabilitat patrimonial de les administracions públiques.',
    description: 'Principis generals. Requisits. Danys indemnitzables. Responsabilitat derivada del funcionament dels serveis públics.'
  },
  {
    id: 'vd_tema_11',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 11,
    code: 'Tema 11',
    title: 'El personal al servei de les administracions públiques.',
    description: 'Classes d’empleats públics. Drets i deures. Codi de conducta. Règim d’incompatibilitats. Responsabilitat i règim disciplinari.'
  },
  {
    id: 'vd_tema_12',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 12,
    code: 'Tema 12',
    title: 'La Policia Local de Catalunya.',
    description: 'Naturalesa i funcions. Àmbit d’actuació. Organització general dels cossos de policia local. Principis bàsics d’actuació. Relacions amb altres cossos policials.'
  },
  {
    id: 'vd_tema_13',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 13,
    code: 'Tema 13',
    title: 'La Llei 16/1991, de 10 de juliol, de les policies locals.',
    description: 'Objecte i àmbit d’aplicació. Funcions de les policies locals. Organització. Escales i categories. La prefectura del cos. Drets i deures dels membres de les policies locals.'
  },
  {
    id: 'vd_tema_14',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 14,
    code: 'Tema 14',
    title: 'Organització i estructura d’un cos de Policia Local.',
    description: 'Plantilla. Relació de llocs de treball. Escales, categories i comandaments. Unitats i serveis policials. Principis de jerarquia, subordinació i coordinació.'
  },
  {
    id: 'vd_tema_15',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 15,
    code: 'Tema 15',
    title: 'Accés, promoció i mobilitat de les policies locals.',
    description: 'Principis generals dels processos selectius. Accés a la categoria d’agent. Requisits. Fases del procés selectiu. Curs de formació i període de pràctiques.'
  },
  {
    id: 'vd_tema_16',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 16,
    code: 'Tema 16',
    title: 'Règim disciplinari de les policies locals de Catalunya.',
    description: 'Principis generals. Faltes lleus, greus i molt greus. Sancions. Responsabilitat disciplinària. Procediment disciplinari. Prescripció de les infraccions i sancions.'
  },
  {
    id: 'vd_tema_17',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 17,
    code: 'Tema 17',
    title: 'Principis ètics i deontològics de l’actuació policial.',
    description: 'Integritat professional. Imparcialitat. Neutralitat. Respecte als drets humans. Tracte a la ciutadania. Ús legítim de l’autoritat. Deure de reserva.'
  },
  {
    id: 'vd_tema_18',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 18,
    code: 'Tema 18',
    title: 'El sistema de seguretat pública de Catalunya.',
    description: 'Organització i principis generals. Autoritats de seguretat. Cossos policials. Coordinació i col·laboració policial. El sistema integral de seguretat pública.'
  },
  {
    id: 'vd_tema_19',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 19,
    code: 'Tema 19',
    title: 'Coordinació entre les policies locals i el Cos de Mossos d’Esquadra.',
    description: 'Principis de coordinació, cooperació i col·laboració. Relacions operatives entre els cossos policials. Actuacions conjuntes. La Junta Local de Seguretat.'
  },
  {
    id: 'vd_tema_20',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 20,
    code: 'Tema 20',
    title: 'La Junta Local de Seguretat.',
    description: 'Composició. Funcions. Competències. Coordinació de les polítiques de seguretat en l’àmbit municipal. Instruments de planificació i coordinació.'
  },
  {
    id: 'vd_tema_21',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 21,
    code: 'Tema 21',
    title: 'La Policia Local com a policia administrativa.',
    description: 'Vigilància i compliment de les ordenances i reglaments municipals. Inspecció. Denúncia d’infraccions. Mesures cautelars i actuacions administratives.'
  },
  {
    id: 'vd_tema_22',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 22,
    code: 'Tema 22',
    title: 'La Llei orgànica 2/1986, de 13 de març, de forces i cossos de seguretat.',
    description: 'Principis bàsics d’actuació. Funcions de les forces i cossos de seguretat. Competències de les policies locals. Relacions entre els diferents cossos policials.'
  },
  {
    id: 'vd_tema_23',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 23,
    code: 'Tema 23',
    title: 'La Llei 4/2003, de 7 d’abril, d’ordenació del sistema de seguretat pública de Catalunya.',
    description: 'Principis generals. Autoritats de seguretat. Sistema policial de Catalunya. Coordinació de les policies locals. Participació dels municipis en el sistema de seguretat.'
  },
  {
    id: 'vd_tema_24',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 24,
    code: 'Tema 24',
    title: 'La Llei orgànica 4/2015, de 30 de març, de protecció de la seguretat ciutadana.',
    description: 'Finalitat i principis d’actuació. Identificació de persones. Comprovacions i registres. Actuacions policials. Infraccions i sancions.'
  },
  {
    id: 'vd_tema_25',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 25,
    code: 'Tema 25',
    title: 'La detenció policial.',
    description: 'Concepte i requisits. Supòsits de detenció. Drets de la persona detinguda. Durada de la detenció. Comunicació de la detenció. Habeas corpus. Particularitats de la detenció de menors.'
  },
  {
    id: 'vd_tema_26',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 26,
    code: 'Tema 26',
    title: 'L’entrada i registre en domicili.',
    description: 'Inviolabilitat del domicili. Consentiment del titular. Autorització judicial. Delicte flagrant. Actuació policial i garanties constitucionals.'
  },
  {
    id: 'vd_tema_27',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 27,
    code: 'Tema 27',
    title: 'Violència de gènere i violència domèstica.',
    description: 'Marc jurídic. Concepte i àmbit d’aplicació. Actuació policial. Valoració del risc. Protecció de les víctimes. Mesures de protecció i coordinació amb altres serveis públics.'
  },
  {
    id: 'vd_tema_28',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 28,
    code: 'Tema 28',
    title: 'Menors i actuació policial.',
    description: 'Protecció jurídica dels menors. Responsabilitat penal dels menors. Actuacions policials amb menors. Menors en situació de risc o desemparament. Coordinació amb els serveis de protecció.'
  },
  {
    id: 'vd_tema_29',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 29,
    code: 'Tema 29',
    title: 'Actuació policial davant persones i col·lectius vulnerables.',
    description: 'Persones grans, persones amb discapacitat, víctimes de delictes i altres situacions de vulnerabilitat. Principis d’actuació i atenció policial.'
  },
  {
    id: 'vd_tema_30',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 30,
    code: 'Tema 30',
    title: 'El dret penal i el delicte.',
    description: 'Concepte de delicte. Acció i omissió. Dol i imprudència. Autoria i participació. Graus d’execució. Circumstàncies modificatives de la responsabilitat criminal.'
  },
  {
    id: 'vd_tema_31',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 31,
    code: 'Tema 31',
    title: 'Delictes contra les persones.',
    description: 'Homicidi i les seves formes. Lesions. Amenaces. Coaccions. Detenció il·legal i segrest. Actuació policial davant els delictes contra les persones.'
  },
  {
    id: 'vd_tema_32',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 32,
    code: 'Tema 32',
    title: 'Delictes contra el patrimoni i l’ordre socioeconòmic.',
    description: 'Furt. Robatori. Robatori i furt d’ús de vehicles. Danys. Estafa. Apropiació indeguda. Actuació policial.'
  },
  {
    id: 'vd_tema_33',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 33,
    code: 'Tema 33',
    title: 'Delictes contra la llibertat i la indemnitat sexual.',
    description: 'Principals figures delictives. Protecció de les víctimes. Actuació policial. Primeres diligències. Preservació d’indicis i proves.'
  },
  {
    id: 'vd_tema_34',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 34,
    code: 'Tema 34',
    title: 'Trànsit i seguretat viària.',
    description: 'Competències municipals. Normes generals de circulació. Senyalització. Prioritats. Velocitat. Conductors i usuaris de la via. Documentació dels vehicles i conductors.'
  },
  {
    id: 'vd_tema_35',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 35,
    code: 'Tema 35',
    title: 'El procediment sancionador en matèria de trànsit.',
    description: 'Infraccions i sancions. Denúncies. Responsabilitat. Mesures provisionals. Immobilització i retirada de vehicles. Competències municipals.'
  },
  {
    id: 'vd_tema_36',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 36,
    code: 'Tema 36',
    title: 'Delictes contra la seguretat viària.',
    description: 'Conducció sota la influència de begudes alcohòliques o drogues. Taxes d’alcoholèmia. Conducció temerària. Conducció sense permís. Negativa a sotmetre’s a les proves. Actuació policial.'
  },
  {
    id: 'vd_tema_37',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 37,
    code: 'Tema 37',
    title: 'Els accidents de circulació i l’atestat policial.',
    description: 'Actuació inicial. Protecció i senyalització del lloc de l’accident. Auxili a les víctimes. Identificació dels implicats i testimonis. Recollida d’indicis. Proves d’alcohol i drogues. Investigació de l’accident. Elaboració de l’atestat policial.'
  },
  {
    id: 'vd_tema_38',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 38,
    code: 'Tema 38',
    title: 'L’organització pròpia de l’ajuntament del Vendrell.',
    description: 'Ordenances, reglaments i Bans del Vendrell. El Reglament Orgànic Municipal.'
  },
  {
    id: 'vd_tema_39',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 39,
    code: 'Tema 39',
    title: 'Coneixements generals del municipi del Vendrell.',
    description: 'Característiques físiques i demogràfiques. Nuclis rurals. Nuclis urbans. Característiques i situació de les urbanitzacions. Principals aspectes urbanístics: carrers, places, monuments, xarxa viària, mitjans de comunicació, ubicació dels equipaments municipals i supramunicipals. Serveis i comunicacions.'
  },
  {
    id: 'vd_tema_40',
    municipi_id: 'el_vendrell',
    scope: 'municipi',
    num: 40,
    code: 'Tema 40',
    title: 'Coneixements generals del municipi del Vendrell (II).',
    description: 'Principals aspectes de la seva història, patrimoni, cultura i festivitats. Característiques socials i culturals. Territori i festes de barri. El seu calendari festiu.'
  }
];

export const INITIAL_PL_TEMES_CUBELLES: PLTema[] = [
  {
    id: 'cb_tema_1',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 1,
    code: 'Tema 1',
    title: 'Constitució Espanyola de 1978: Estructura.'
  },
  {
    id: 'cb_tema_2',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 2,
    code: 'Tema 2',
    title: 'Principis generals de la Constitució Espanyola de 1978.'
  },
  {
    id: 'cb_tema_3',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 3,
    code: 'Tema 3',
    title: 'Els drets humans i els drets constitucionals: les garanties dels drets.'
  },
  {
    id: 'cb_tema_4',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 4,
    code: 'Tema 4',
    title: 'L’ordenament jurídic de l’Estat. Tipologia normativa.'
  },
  {
    id: 'cb_tema_5',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 5,
    code: 'Tema 5',
    title: 'L’organització territorial de l’Estat.'
  },
  {
    id: 'cb_tema_6',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 6,
    code: 'Tema 6',
    title: 'Les institucions polítiques de l’Estat.'
  },
  {
    id: 'cb_tema_7',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 7,
    code: 'Tema 7',
    title: "L'Estatut d'autonomia de Catalunya; estructura, contingut essencial i principis fonamentals. Els procediments de reforma."
  },
  {
    id: 'cb_tema_8',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 8,
    code: 'Tema 8',
    title: 'Les institucions polítiques de Catalunya.'
  },
  {
    id: 'cb_tema_9',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 9,
    code: 'Tema 9',
    title: 'L’organització territorial de Catalunya.'
  },
  {
    id: 'cb_tema_10',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 10,
    code: 'Tema 10',
    title: 'El Municipi: Organització, territori, i població.'
  },
  {
    id: 'cb_tema_11',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 11,
    code: 'Tema 11',
    title: 'La Unió Europea: Principals institucions.'
  },
  {
    id: 'cb_tema_12',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 12,
    code: 'Tema 12',
    title: 'Òrgans jurisdiccionals de la Unió Europea i tipus de normes.'
  },
  {
    id: 'cb_tema_13',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 13,
    code: 'Tema 13',
    title: "Llei 4/2003, d'ordenació del sistema de seguretat pública de Catalunya."
  },
  {
    id: 'cb_tema_14',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 14,
    code: 'Tema 14',
    title: 'Codi deontològic policial.'
  },
  {
    id: 'cb_tema_15',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 15,
    code: 'Tema 15',
    title: 'Coordinació i col·laboració entre cossos policials: Normes bàsiques de coordinació i col·laboració.'
  },
  {
    id: 'cb_tema_16',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 16,
    code: 'Tema 16',
    title: 'Competències específiques i competències compartides dels diferents Cossos policials.'
  },
  {
    id: 'cb_tema_17',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 17,
    code: 'Tema 17',
    title: 'Les juntes locals de seguretat. Els convenis de col·laboració.'
  },
  {
    id: 'cb_tema_18',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 18,
    code: 'Tema 18',
    title: 'La llei orgànica de forces i cossos de seguretat de l’Estat. Principis bàsics d’actuació.'
  },
  {
    id: 'cb_tema_19',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 19,
    code: 'Tema 19',
    title: 'Els diferents cossos policials a l’Estat espanyol.'
  },
  {
    id: 'cb_tema_20',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 20,
    code: 'Tema 20',
    title: 'Estructura, organització i funcions de les policies locals: Llei 16/1991, de 10 de juliol, de les policies locals.'
  },
  {
    id: 'cb_tema_21',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 21,
    code: 'Tema 21',
    title: 'Drets i deures dels membres de les policies locals.'
  },
  {
    id: 'cb_tema_22',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 22,
    code: 'Tema 22',
    title: 'El règim disciplinari aplicable als policies locals.'
  },
  {
    id: 'cb_tema_23',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 23,
    code: 'Tema 23',
    title: 'El poder judicial: òrgans jurisdiccionals de l’Estat i el Tribunal Constitucional.'
  },
  {
    id: 'cb_tema_24',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 24,
    code: 'Tema 24',
    title: 'El Codi penal: els delictes lleus i les penes. Persones responsables.'
  },
  {
    id: 'cb_tema_25',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 25,
    code: 'Tema 25',
    title: 'La denúncia: concepte i classes. El dret i el deure de denunciar. Efectes de la denúncia.'
  },
  {
    id: 'cb_tema_26',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 26,
    code: 'Tema 26',
    title: "L'atestat policial: estructura bàsica. Valor dels atestats policials."
  },
  {
    id: 'cb_tema_27',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 27,
    code: 'Tema 27',
    title: 'La detenció: concepte. Supòsits legals en què és procedent la detenció.'
  },
  {
    id: 'cb_tema_28',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 28,
    code: 'Tema 28',
    title: 'Els drets del detingut. La detenció de menors.'
  },
  {
    id: 'cb_tema_29',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 29,
    code: 'Tema 29',
    title: 'La entrada i registre de domicili.'
  },
  {
    id: 'cb_tema_30',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 30,
    code: 'Tema 30',
    title: 'La protecció del medi ambient. El delicte ecològic.'
  },
  {
    id: 'cb_tema_31',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 31,
    code: 'Tema 31',
    title: 'Llei de Protecció de la seguretat ciutadana. Llei orgànica 4/2015, de 30 de març.'
  },
  {
    id: 'cb_tema_32',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 32,
    code: 'Tema 32',
    title: 'Procediment sancionador en matèria de trànsit: normativa aplicable, autoritats competents en matèria de trànsit, incoació del procediment sancionador.'
  },
  {
    id: 'cb_tema_33',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 33,
    code: 'Tema 33',
    title: 'Procediment sancionador en matèria de trànsit: tipus de procediment sancionador, tipus de sancions, notificacions.'
  },
  {
    id: 'cb_tema_34',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 34,
    code: 'Tema 34',
    title: 'Seguretat viària: normativa sobre trànsit, circulació de vehicles de motor i seguretat viària.'
  },
  {
    id: 'cb_tema_35',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 35,
    code: 'Tema 35',
    title: 'Accidents de trànsit. Definició. Competències de la Policia Local. Tipus d’accident.'
  },
  {
    id: 'cb_tema_36',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 36,
    code: 'Tema 36',
    title: 'La Conducció sota els efectes de begudes alcohòliques o estupefaents. Regulació i control. Els delictes contra la seguretat vial.'
  },
  {
    id: 'cb_tema_37',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 37,
    code: 'Tema 37',
    title: 'Policia administrativa: Principals infraccions a les ordenances municipals, estructura de les denúncies i règim sancionador.'
  },
  {
    id: 'cb_tema_38',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 38,
    code: 'Tema 38',
    title: 'Reglaments i Ordenances municipals de l\'Ajuntament de Cubelles: organització municipal i funcionament.'
  },
  {
    id: 'cb_tema_39',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 39,
    code: 'Tema 39',
    title: 'Història, geografia, societat i cultura del municipi de Cubelles.'
  },
  {
    id: 'cb_tema_40',
    municipi_id: 'cubelles',
    scope: 'municipi',
    num: 40,
    code: 'Tema 40',
    title: 'Principals festes i rutes turístiques, principals institucions municipals i edificis emblemàtics.'
  }
];

export const ALL_SEED_PL_TEMES: PLTema[] = [
  ...INITIAL_PL_TEMES_COMUNS,
  ...INITIAL_PL_TEMES_CULTURA,
  ...INITIAL_PL_TEMES_SANTESTEVE,
  ...INITIAL_PL_TEMES_VENDRELL,
  ...INITIAL_PL_TEMES_CUBELLES
];
