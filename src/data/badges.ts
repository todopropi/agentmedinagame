import { SpecializedShield } from '../types';

export interface StoreUnitBadge {
  id: string;
  name: string;
  price: number;
  iconName: string;
  desc: string;
  gradient: string;
  unit: string;
}

/**
 * Catàleg d'Escuts Oficials de Mossos d'Esquadra i Policia Local
 * Extret directament de les insígnies oficials de TiendaMossos.com (Captures d'usuari)
 */
export const STORE_UNITS_LIST: StoreUnitBadge[] = [
  { 
    id: 'usc', 
    name: 'USC - Seguretat Ciutadana (2025)', 
    price: 40, 
    iconName: 'Shield', 
    desc: 'Casc de centurió romà amb plomall vermell i els quatre daus.', 
    gradient: 'from-blue-600 via-blue-800 to-slate-900',
    unit: 'Unitat de Seguretat Ciutadana'
  },
  { 
    id: 'generic_pvc', 
    name: 'Escut Genèric PVC (Color)', 
    price: 50, 
    iconName: 'Shield', 
    desc: 'Escut oficial de pit dels Mossos d’Esquadra amb les 4 barres de la Senyera.', 
    gradient: 'from-amber-600 via-yellow-800 to-slate-950',
    unit: 'Policia de la Generalitat - Mossos d’Esquadra'
  },
  { 
    id: 'generic_bw', 
    name: 'Escut Genèric Blanc i Negre (Tàctic)', 
    price: 65, 
    iconName: 'ShieldCheck', 
    desc: 'Versió de baixa visibilitat tàctica per a operacions especials.', 
    gradient: 'from-slate-600 via-zinc-800 to-black',
    unit: 'Edició Baixa Visibilitat'
  },
  { 
    id: 'usc_blueline', 
    name: 'USC Blue Line (Edició Especial)', 
    price: 75, 
    iconName: 'Shield', 
    desc: 'Escut USC amb la cinta d’honor de la Thin Blue Line.', 
    gradient: 'from-sky-700 via-blue-950 to-black',
    unit: 'Seguretat Ciutadana Honor'
  },
  { 
    id: 'transit', 
    name: 'Trànsit - Divisió de Trànsit', 
    price: 90, 
    iconName: 'Car', 
    desc: 'Silueta dinàmica de motocicleta policial tombant en revolt.', 
    gradient: 'from-yellow-500 via-amber-800 to-slate-900',
    unit: 'Divisió de Trànsit'
  },
  { 
    id: 'canina', 
    name: 'Unitat Canina K-9', 
    price: 110, 
    iconName: 'Dog', 
    desc: 'Cap de pastor alemany policia en daurat sobre fons oval negre.', 
    gradient: 'from-amber-700 via-yellow-900 to-slate-950',
    unit: 'Unitat Canina K-9'
  },
  { 
    id: 'usaq', 
    name: 'USAQ - Unitat Subaquàtica', 
    price: 130, 
    iconName: 'Waves', 
    desc: 'Màscara d’immersió i regulador de busseig amb els quatre daus vermells.', 
    gradient: 'from-cyan-700 via-blue-900 to-black',
    unit: 'Unitat Subaquàtica'
  },
  { 
    id: 'subsol', 
    name: 'Subsòl - Unitat de Subsòl', 
    price: 150, 
    iconName: 'Maximize', 
    desc: 'Màscara antigàs de dos filtres amb silueta de ratpenat.', 
    gradient: 'from-stone-700 via-neutral-900 to-black',
    unit: 'Unitat de Subsòl'
  },
  { 
    id: 'muntanya', 
    name: 'UIM - Unitat de Muntanya', 
    price: 170, 
    iconName: 'Mountain', 
    desc: 'Silueta d’isard pirinenc, piolets creuats i flor d’Edelweiss.', 
    gradient: 'from-blue-700 via-slate-800 to-slate-950',
    unit: 'Unitat d’Intervenció en Muntanya'
  },
  { 
    id: 'maritima', 
    name: 'Policia Marítima', 
    price: 190, 
    iconName: 'Anchor', 
    desc: 'Àncora naval daurada amb cordam mariner sobre fons ovalat.', 
    gradient: 'from-blue-800 via-sky-950 to-black',
    unit: 'Policia Marítima de la Generalitat'
  },
  { 
    id: 'dic', 
    name: 'DIC - Investigació Criminal', 
    price: 220, 
    iconName: 'Search', 
    desc: 'Rosa dels vents argentada envoltada per garlandes de llorer.', 
    gradient: 'from-slate-700 via-blue-950 to-black',
    unit: 'Divisió d’Investigació Criminal'
  },
  { 
    id: 'informacio', 
    name: 'Informació - CGInf (ASTOR)', 
    price: 250, 
    iconName: 'Feather', 
    desc: 'Tres urpades vermelles i falcó blanc volant sobre fons negre.', 
    gradient: 'from-red-800 via-slate-900 to-black',
    unit: 'Comissaria General d’Informació'
  },
  { 
    id: 'arro', 
    name: 'ARRO - Recursos Operatius', 
    price: 290, 
    iconName: 'ShieldAlert', 
    desc: 'Cap de lleó rugint en or amb les quatre urpades vermelles.', 
    gradient: 'from-amber-600 via-yellow-900 to-black',
    unit: 'Àrea Regional de Recursos Operatius'
  },
  { 
    id: 'brimo', 
    name: 'BRIMO - Brigada Mòbil', 
    price: 340, 
    iconName: 'HardHat', 
    desc: 'Elm medieval de cavaller amb cresta de drac i fons negre daurat.', 
    gradient: 'from-red-600 via-red-900 to-slate-950',
    unit: 'Brigada Mòbil (Ordre Públic)'
  },
  { 
    id: 'brimo_fluo', 
    name: 'BRIMO Fluorescent (Alta Visibilitat)', 
    price: 370, 
    iconName: 'Zap', 
    desc: 'Versió reflectant groga fluorescent per a intervencions nocturnes.', 
    gradient: 'from-yellow-400 via-lime-600 to-slate-900',
    unit: 'Brigada Mòbil Especial'
  },
  { 
    id: 'tedax', 
    name: 'TEDAX - NRBQ', 
    price: 450, 
    iconName: 'Bomb', 
    desc: 'Llamp daurat creuant una bomba amb metxa encesa i símbols NRBQ.', 
    gradient: 'from-orange-600 via-red-950 to-black',
    unit: 'Desactivació d’Artefactes Explosius i NRBQ'
  },
  { 
    id: 'gei', 
    name: 'GEI - Grup Especial d’Intervenció', 
    price: 550, 
    iconName: 'Crosshair', 
    desc: 'Cap de falcó daurat amb mira telescòpica a la lletra E.', 
    gradient: 'from-red-700 via-zinc-900 to-black',
    unit: 'Grup Especial d’Intervenció'
  },
  { 
    id: 'gei_stealth', 
    name: 'GEI Baixa Visibilitat (Camuflatge)', 
    price: 600, 
    iconName: 'EyeOff', 
    desc: 'Patch tàctic en negre mat per a operacions d’assalt en foscor.', 
    gradient: 'from-zinc-800 via-neutral-900 to-black',
    unit: 'GEI Operacions Especials'
  }
];

export const SPECIALIZED_SHIELDS: SpecializedShield[] = STORE_UNITS_LIST.map(u => ({
  id: u.id,
  nom: u.name,
  unitat: u.unit,
  preuMerits: u.price,
  descripcio: u.desc,
  escutTipus: u.id as any,
  colorPrincipal: u.gradient.split(' ')[0].replace('from-', ''),
  colorSecundari: '#eab308'
}));

export const DEFAULT_SHIELD_ID = 'generic_pvc';
