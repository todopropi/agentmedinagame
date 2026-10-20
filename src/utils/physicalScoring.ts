// Barem oficial de les proves físiques de la convocatòria del Cos de Mossos d'Esquadra
// Basat en la taula oficial de la Guia Oficial: PB (Press de Banca), CA (Circuït d'Agilitat), CL (Cursa Llançadora)
// CRITERI OFICIAL: S'assigna el graó assolit sense arrodoniment a l'alça (si no s'arriba a la marca del 7, es manté en 6, etc.)

export interface OfficialScoreRow {
  p: number; // Puntuació de 0 a 10
  caDisplay: string; // Circuït d'Agilitat segons
  caThreshold: number; // Temps màxim en segons per obtenir la puntuació
  pbDisplay: string; // Press de Banca repeticions en 45s
  pbThreshold: number; // Repeticions mínimes per obtenir la puntuació
  clDisplay: string; // Cursa Llançadora (Course Navette) període
  clThreshold: number; // Període mínim per obtenir la puntuació
}

export const OFFICIAL_PHYSICAL_TABLE: OfficialScoreRow[] = [
  { p: 0, caDisplay: '>21,5', caThreshold: 21.5, pbDisplay: '<24', pbThreshold: 24, clDisplay: '<6,5', clThreshold: 6.5 },
  { p: 1, caDisplay: '21,5', caThreshold: 21.5, pbDisplay: '24,0', pbThreshold: 24.0, clDisplay: '6,5', clThreshold: 6.5 },
  { p: 2, caDisplay: '20,4', caThreshold: 20.4, pbDisplay: '27,0', pbThreshold: 27.0, clDisplay: '7,5', clThreshold: 7.5 },
  { p: 3, caDisplay: '19,9', caThreshold: 19.9, pbDisplay: '28,0', pbThreshold: 28.0, clDisplay: '8,0', clThreshold: 8.0 },
  { p: 4, caDisplay: '19,4', caThreshold: 19.4, pbDisplay: '30,0', pbThreshold: 30.0, clDisplay: '8,5', clThreshold: 8.5 },
  { p: 5, caDisplay: '18,9', caThreshold: 18.9, pbDisplay: '31,0', pbThreshold: 31.0, clDisplay: '9,0', clThreshold: 9.0 },
  { p: 6, caDisplay: '18,4', caThreshold: 18.4, pbDisplay: '33,0', pbThreshold: 33.0, clDisplay: '9,5', clThreshold: 9.5 },
  { p: 7, caDisplay: '17,8', caThreshold: 17.8, pbDisplay: '34,0', pbThreshold: 34.0, clDisplay: '10,5', clThreshold: 10.5 },
  { p: 8, caDisplay: '17,3', caThreshold: 17.3, pbDisplay: '36,0', pbThreshold: 36.0, clDisplay: '11,0', clThreshold: 11.0 },
  { p: 9, caDisplay: '16,8', caThreshold: 16.8, pbDisplay: '39,0', pbThreshold: 39.0, clDisplay: '12,0', clThreshold: 12.0 },
  { p: 10, caDisplay: '<16,3', caThreshold: 16.3, pbDisplay: '>42', pbThreshold: 42.0, clDisplay: '12,5', clThreshold: 12.5 }
];

/**
 * Càlcul de punts per a Circuït d'Agilitat (CA en segons)
 * Menor temps = millor puntuació.
 * Criteri oficial: Arrodoniment cap avall. Si no s'arriba al llindar inferior, es rep la nota inferior.
 * Exemple: Si fas 18.0s, no arribes a 17.8s (que és un 7), per tant és un 6.
 */
export function calculateCircuitPoints(seconds: number): { points: number; tier: number } {
  if (isNaN(seconds) || seconds <= 0 || seconds > 21.5) {
    return { points: 0, tier: 0 };
  }

  if (seconds <= 16.3) {
    return { points: 10, tier: 10 };
  }

  // Graons oficials: cal assolir o baixar d'aquest temps per obtenir la puntuació
  const steps = [
    { p: 10, maxSec: 16.3 },
    { p: 9,  maxSec: 16.8 },
    { p: 8,  maxSec: 17.3 },
    { p: 7,  maxSec: 17.8 },
    { p: 6,  maxSec: 18.4 },
    { p: 5,  maxSec: 18.9 },
    { p: 4,  maxSec: 19.4 },
    { p: 3,  maxSec: 19.9 },
    { p: 2,  maxSec: 20.4 },
    { p: 1,  maxSec: 21.5 }
  ];

  for (const step of steps) {
    if (seconds <= step.maxSec) {
      return { points: step.p, tier: step.p };
    }
  }

  return { points: 0, tier: 0 };
}

/**
 * Càlcul de punts per a Press de Banca (PB en repeticions a 45 segons)
 * Més repeticions = millor puntuació.
 * Criteri oficial: Arrodoniment cap avall. Si fas 33 reps no arribes a 34 (que és el 7), per tant és un 6.
 */
export function calculatePressBancaPoints(reps: number): { points: number; tier: number } {
  if (isNaN(reps) || reps < 24) {
    return { points: 0, tier: 0 };
  }

  // > 42 o >= 42 reps
  if (reps >= 42) {
    return { points: 10, tier: 10 };
  }

  const steps = [
    { p: 9, minReps: 39.0 },
    { p: 8, minReps: 36.0 },
    { p: 7, minReps: 34.0 },
    { p: 6, minReps: 33.0 },
    { p: 5, minReps: 31.0 },
    { p: 4, minReps: 30.0 },
    { p: 3, minReps: 28.0 },
    { p: 2, minReps: 27.0 },
    { p: 1, minReps: 24.0 }
  ];

  for (const step of steps) {
    if (reps >= step.minReps) {
      return { points: step.p, tier: step.p };
    }
  }

  return { points: 0, tier: 0 };
}

/**
 * Càlcul de punts per a Cursa Llançadora / Course Navette (CL en palier / període)
 * Més període = millor puntuació.
 * Criteri oficial: Arrodoniment cap avall. Si fas 10.0 no arribes a 10.5 (que és el 7), per tant és un 6.
 */
export function calculateCourseNavettePoints(palier: number): { points: number; tier: number } {
  if (isNaN(palier) || palier < 6.5) {
    return { points: 0, tier: 0 };
  }

  if (palier >= 12.5) {
    return { points: 10, tier: 10 };
  }

  const steps = [
    { p: 9, minPal: 12.0 },
    { p: 8, minPal: 11.0 },
    { p: 7, minPal: 10.5 },
    { p: 6, minPal: 9.5 },
    { p: 5, minPal: 9.0 },
    { p: 4, minPal: 8.5 },
    { p: 3, minPal: 8.0 },
    { p: 2, minPal: 7.5 },
    { p: 1, minPal: 6.5 }
  ];

  for (const step of steps) {
    if (palier >= step.minPal) {
      return { points: step.p, tier: step.p };
    }
  }

  return { points: 0, tier: 0 };
}

export interface GlobalFitnessEvaluation {
  pbPoints: number;
  caPoints: number;
  clPoints: number;
  averageScore: number;
  isEligible: boolean; // Si compleix el requisit de tenir >= 1 punt a cada prova
  isPassed: boolean; // Si la mitjana és >= 5.0 i isEligible és true
  statusMessage: string;
}

export function evaluateGlobalFitness(pbPoints: number, caPoints: number, clPoints: number): GlobalFitnessEvaluation {
  const isEligible = pbPoints >= 1 && caPoints >= 1 && clPoints >= 1;
  const averageScore = Math.round(((pbPoints + caPoints + clPoints) / 3) * 100) / 100;
  const isPassed = isEligible && averageScore >= 5.0;

  let statusMessage = 'APTE - Puntuació vàlida per a la convocatòria CME';
  if (!isEligible) {
    statusMessage = 'NO APTE - Cal assolir com a mínim 1 punt a cadascuna de les 3 proves per no quedar eliminat/da.';
  } else if (averageScore < 5.0) {
    statusMessage = 'NO APTE - La mitjana de les 3 proves és inferior a 5,0 punts.';
  }

  return {
    pbPoints,
    caPoints,
    clPoints,
    averageScore,
    isEligible,
    isPassed,
    statusMessage
  };
}
