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
  },
  { 
    id: 'escut_llegenda_ambit_a', 
    name: 'Escut d\'Or Llegendari - Seguretat Ciutadana (C100)', 
    price: 999, 
    iconName: 'Crown', 
    desc: 'Corona d\'or i insígnia d\'honor atorgada en conquerir la Casella 100 de l\'Àmbit A (Seguretat Ciutadana).', 
    gradient: 'from-amber-400 via-yellow-500 to-amber-700',
    unit: 'Llegenda Àmbit A - Mossos d\'Esquadra'
  },
  { 
    id: 'escut_llegenda_ambit_b', 
    name: 'Escut d\'Or Llegendari - Investigació Criminal (C100)', 
    price: 999, 
    iconName: 'Crown', 
    desc: 'Corona d\'or i insígnia d\'honor atorgada en conquerir la Casella 100 de l\'Àmbit B (Investigació Criminal).', 
    gradient: 'from-amber-400 via-yellow-500 to-amber-700',
    unit: 'Llegenda Àmbit B - Mossos d\'Esquadra'
  },
  { 
    id: 'escut_llegenda_ambit_c', 
    name: 'Escut d\'Or Llegendari - Recursos Operatius (C100)', 
    price: 999, 
    iconName: 'Crown', 
    desc: 'Corona d\'or i insígnia d\'honor atorgada en conquerir la Casella 100 de l\'Àmbit C (Ordre Públic i Suport Operatiu).', 
    gradient: 'from-amber-400 via-yellow-500 to-amber-700',
    unit: 'Llegenda Àmbit C - Mossos d\'Esquadra'
  },
  { 
    id: 'escut_llegenda_actualitat', 
    name: 'Escut d\'Or Llegendari - Trànsit & Actualitat (C100)', 
    price: 999, 
    iconName: 'Crown', 
    desc: 'Corona d\'or i insígnia d\'honor atorgada en conquerir la Casella 100 del Tauler d\'Actualitat i Trànsit.', 
    gradient: 'from-amber-400 via-yellow-500 to-amber-700',
    unit: 'Llegenda Actualitat - Mossos d\'Esquadra'
  },
  { 
    id: 'escut_llegenda_ispc', 
    name: 'Escut d\'Or Llegendari - ISPC Intervenció (C100)', 
    price: 999, 
    iconName: 'Crown', 
    desc: 'Corona d\'or i insígnia d\'honor atorgada en conquerir la Casella 100 de l\'ISPC i Operacions Especials.', 
    gradient: 'from-amber-400 via-yellow-500 to-amber-700',
    unit: 'Llegenda ISPC - Mossos d\'Esquadra'
  },
  { 
    id: 'escut_llegenda', 
    name: 'Escut d\'Or Llegendari Global (Casella 100)', 
    price: 999, 
    iconName: 'Crown', 
    desc: 'Insígnia d\'or i llorer reservada exclusivament per a qui conquereix la Casella 100 del Tauler de l\'Oca Policial (Nivell Llegendari).', 
    gradient: 'from-amber-400 via-yellow-500 to-amber-700',
    unit: 'Nivell Llegendari - Cos de Mossos d\'Esquadra'
  }
];

export const DEFAULT_CAMPAIGN_AMBIT_MAP: Record<string, string> = {
  usc: 'Àmbit A',
  dic: 'Àmbit B',
  arro: 'Àmbit C',
  transit: 'Actualitat',
  gei: 'ISPC',
  escut_llegenda_ambit_a: 'Casella 100 (Àmbit A)',
  escut_llegenda_ambit_b: 'Casella 100 (Àmbit B)',
  escut_llegenda_ambit_c: 'Casella 100 (Àmbit C)',
  escut_llegenda_actualitat: 'Casella 100 (Actualitat)',
  escut_llegenda_ispc: 'Casella 100 (ISPC)',
  escut_llegenda: 'Casella 100'
};

export const DEFAULT_SHIELDS_LIST: SpecializedShield[] = STORE_UNITS_LIST.map(u => ({
  id: u.id,
  nom: u.name,
  unitat: u.unit,
  preuMerits: u.price,
  descripcio: u.desc,
  escutTipus: u.id as any,
  colorPrincipal: u.gradient.split(' ')[0].replace('from-', ''),
  colorSecundari: '#eab308',
  ambitDesbloqueig: DEFAULT_CAMPAIGN_AMBIT_MAP[u.id] || undefined
}));

import { fetchSupabaseStoreCatalog, syncSupabaseStoreCatalog } from '../../supabase';

const CUSTOM_SHIELDS_STORAGE_KEY = 'agent_medina_botiga_escuts_v1';

/**
 * Neteja immediata de cadenes Base64 pesades que hagin quedat atrapades al localStorage
 * per alliberar la quota d'emmagatzematge i evitar QuotaExceededError.
 */
export function cleanupBloatedStorage() {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(CUSTOM_SHIELDS_STORAGE_KEY);
    if (raw && (raw.length > 50000 || raw.includes('data:image'))) {
      localStorage.removeItem(CUSTOM_SHIELDS_STORAGE_KEY);
    }
  } catch {
    try {
      localStorage.removeItem(CUSTOM_SHIELDS_STORAGE_KEY);
    } catch {}
  }
}

if (typeof window !== 'undefined') {
  cleanupBloatedStorage();
}

/**
 * Converteix un catàleg d'escuts en una versió ultralleugera sense imatges pesades en Base64
 * per a la memòria cau local, garantint que mai sobrepassi la quota del navegador.
 */
/**
 * Conserva els logotips personalitzats (URLs de Supabase Storage o enllaços web)
 * i només retalla cadenes Base64 monstruoses que superin la quota de localStorage,
 * garantint que mai es perdin els noms, descripcions ni logos al núvol.
 */
function toLightweightShields(shields: SpecializedShield[]): SpecializedShield[] {
  return shields.map(s => {
    // Si és una URL pública (http/https/supabase), la conservem SEMPRE
    if (s.customLogoUrl && (s.customLogoUrl.startsWith('http://') || s.customLogoUrl.startsWith('https://') || s.customLogoUrl.startsWith('/'))) {
      return s;
    }
    // Si és un Base64 excessivament llarg per al localStorage, només s'omet a la memòria cau local temporal
    if (s.customLogoUrl && s.customLogoUrl.length > 50000) {
      const { customLogoUrl, ...rest } = s;
      return rest as SpecializedShield;
    }
    return s;
  });
}

export function getCustomShields(): SpecializedShield[] {
  if (Array.isArray(SPECIALIZED_SHIELDS) && SPECIALIZED_SHIELDS.length > 0) {
    return SPECIALIZED_SHIELDS.map((shield: SpecializedShield) => {
      if (!shield.ambitDesbloqueig && DEFAULT_CAMPAIGN_AMBIT_MAP[shield.id]) {
        return { ...shield, ambitDesbloqueig: DEFAULT_CAMPAIGN_AMBIT_MAP[shield.id] };
      }
      return shield;
    });
  }
  try {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(CUSTOM_SHIELDS_STORAGE_KEY) : null;
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((shield: SpecializedShield) => {
          if (!shield.ambitDesbloqueig && DEFAULT_CAMPAIGN_AMBIT_MAP[shield.id]) {
            return { ...shield, ambitDesbloqueig: DEFAULT_CAMPAIGN_AMBIT_MAP[shield.id] };
          }
          return shield;
        });
      }
    }
  } catch (e) {
    console.warn('Error llegint escuts de la botiga des de memòria cau local:', e);
  }
  return DEFAULT_SHIELDS_LIST;
}

// Declarat i exportat a dalt de tot com a 'var' perquè estigui immediatament disponible
// abans de qualsevol execució de funció, sincronització cloud o subscripció.
export var SPECIALIZED_SHIELDS: SpecializedShield[] = getCustomShields();

export const DEFAULT_SHIELD_ID = 'generic_pvc';

/**
 * Desa el catàleg d'escuts directament a la taula de Supabase (system_store_catalog / matches)
 * sense bloquejar-se ni dependre del localStorage.
 */
export async function saveCustomShields(shields: SpecializedShield[]): Promise<boolean> {
  // 1. Sincronitzar la memòria viva de l'aplicació
  SPECIALIZED_SHIELDS.length = 0;
  SPECIALIZED_SHIELDS.push(...shields);

  // 2. Notificar immediatament la interfície d'usuari
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('store_catalog_updated', { detail: shields }));
    } catch {}
  }

  // 3. Upsert directament a la taula de Supabase
  let cloudSuccess = false;
  try {
    const result = await syncSupabaseStoreCatalog(shields);
    cloudSuccess = Boolean(result);
  } catch (err) {
    console.warn('Error desant catàleg a Supabase:', err);
  }

  // 4. Desar còpia lleugera al localStorage si és possible
  try {
    if (typeof localStorage !== 'undefined') {
      const lightweight = toLightweightShields(shields);
      localStorage.setItem(CUSTOM_SHIELDS_STORAGE_KEY, JSON.stringify(lightweight));
    }
  } catch (e) {
    console.warn('localStorage ple o no disponible, catàleg guardat de forma segura a Supabase');
  }

  return cloudSuccess;
}

export async function initCloudStoreCatalog(): Promise<SpecializedShield[]> {
  try {
    const cloudShields = await fetchSupabaseStoreCatalog();
    
    // REGLA D'OR DE SEGURETAT: Si el núvol té dades, LES RESPECTEM SEMPRE.
    // MAI sobreescriure el núvol amb DEFAULT_SHIELDS_LIST si hi ha cap error o dades prèvies.
    if (Array.isArray(cloudShields) && cloudShields.length > 0) {
      // Garantir que l'escut de Nivell Llegendari sempre estigui present
      const legendaryDefault = DEFAULT_SHIELDS_LIST.find(s => s.id === 'escut_llegenda');
      const hasLegendary = cloudShields.some(s => s.id === 'escut_llegenda');
      const mergedShields = hasLegendary || !legendaryDefault ? cloudShields : [...cloudShields, legendaryDefault];

      SPECIALIZED_SHIELDS.length = 0;
      SPECIALIZED_SHIELDS.push(...mergedShields);

      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('store_catalog_updated', { detail: mergedShields }));
        } catch {}
      }

      try {
        if (typeof localStorage !== 'undefined') {
          const lightweight = toLightweightShields(mergedShields);
          localStorage.setItem(CUSTOM_SHIELDS_STORAGE_KEY, JSON.stringify(lightweight));
        }
      } catch {}

      return mergedShields;
    }
    // Si cloudShields és null (error de xarxa o taula buida no confirmada),
    // NO pugem res per defecte per evitar esborrar dades de l'administrador!
  } catch (e) {
    console.warn('Error llegint el catàleg cloud:', e);
  }
  return SPECIALIZED_SHIELDS;
}

// Iniciar càrrega cloud
if (typeof window !== 'undefined') {
  initCloudStoreCatalog();
}
