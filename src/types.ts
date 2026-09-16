export type PoliceRankCategory = 
  | 'escala_basica' 
  | 'escala_intermedia' 
  | 'escala_executiva' 
  | 'escala_superior';

export interface PoliceRank {
  id: string;
  name: string;
  category: PoliceRankCategory;
  categoryName: string;
  minXp: number;
  badgeIcon: string;
  color: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isAdmin?: boolean;
  xp: number;
  merits: number;
  rank: PoliceRank;
  equippedShieldId: string;
  unlockedShieldIds: string[];
  failedQuestionIds: string[];
  savedQuestionIds: string[];
  savedMnemonicIds?: string[];
  createdAt?: number;
  lastLogin?: number;
  isOnline?: boolean;
}

export type QuestionAmbit = 'Àmbit A' | 'Àmbit B' | 'Àmbit C' | 'Actualitat' | 'ISPC' | string;

export interface ReviewConceptItem {
  concepte: string;
  detall: string;
  color: 'blue' | 'red' | 'green' | 'yellow';
}

export interface Question {
  id: string;
  ambit: QuestionAmbit;
  seccio: string;
  temaId?: string;
  pregunta: string;
  opcions: string[];
  resposta: number; // 0, 1, 2, 3
  explicacio: string;
  guiaPagina?: string;
  guiaTema?: string;
  clauTribunal?: string;
  quadreMemoritzar?: {
    titol: string;
    items: ReviewConceptItem[];
    reglaExamen: string;
  };
  confusionAlert?: {
    conceptA: string;
    conceptB: string;
    explanation: string;
  };
}

export interface SpecializedShield {
  id: string;
  nom: string;
  unitat: string;
  preuMerits: number;
  descripcio: string;
  escutTipus: 'tedax' | 'gei' | 'brimo' | 'arro' | 'transit' | 'canina' | 'subaquatica' | 'subsol' | 'medis_aeris' | 'cgic' | 'tedax_canina' | 'gu_bcn' | 'policia_local' | 'mediacio' | 'drons' | 'escortes' | 'ispc';
  colorPrincipal: string;
  colorSecundari: string;
}

export interface DuelGame {
  id: string;
  hostPlayerUid: string;
  hostPlayerName: string;
  hostPlayerAvatar?: string;
  hostPlayerShieldId: string;
  hostRedStripes: number; // 0 to 4
  guestPlayerUid?: string;
  guestPlayerName?: string;
  guestPlayerAvatar?: string;
  guestPlayerShieldId?: string;
  guestRedStripes: number; // 0 to 4
  currentTurnUid: string;
  status: 'waiting' | 'active' | 'finished';
  winnerUid?: string;
  consecutiveCorrect: { [uid: string]: number }; // 0 to 3
  lastUpdated: number;
  shareCode: string;
}

export interface HeadToHeadRecord {
  player1Uid: string;
  player1Name: string;
  player1Wins: number;
  player2Uid: string;
  player2Name: string;
  player2Wins: number;
  lastMatchTimestamp: number;
}

export interface CampanyaBoardState {
  currentTile: number; // 0 to 50
  ambit: QuestionAmbit;
  completed: boolean;
  historyMoves: number[];
}
