export type PoliceRankCategory = 
  | 'escala_basica' 
  | 'escala_intermedia' 
  | 'escala_executiva' 
  | 'escala_superior'
  | 'escala_institucional';

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
  role?: 'admin' | 'question_editor' | 'aspirant';
  subscriptionStatus?: 'trial' | 'active' | 'expired' | 'unlimited';
  subscriptionExpiresAt?: string | number | null;
  isUnlimited?: boolean;
  xp: number;
  merits: number;
  rank: PoliceRank;
  equippedShieldId: string;
  unlockedShieldIds: string[];
  failedQuestionIds: string[];
  savedQuestionIds: string[];
  answeredQuestionIds?: string[];
  correctQuestionIds?: string[];
  questionMistakesCount?: Record<string, number>;
  canViewStudyReport?: boolean;
  savedMnemonicIds?: string[];
  wildcardsCount?: number;
  createdAt?: number;
  lastLogin?: number;
  lastActiveDay?: string; // Formato YYYY-MM-DD per al control de racha i decaïment diari d'inactivitat (-20 XP/dia)
  readBroadcastIds?: string[]; // IDs de missatges de l'admin ja llegits
  isOnline?: boolean; // <-- AÑADIDO PARA TIEMPO REAL
  completedAmbits?: string[];
  boardProgress?: Record<string, number>;
  notificationPreferences?: NotificationPreferences;
  deviceToken?: string;
  deviceTokens?: string[];
  devicePlatform?: 'android' | 'web';
  lastTokenSync?: number;
}

export interface NotificationPreferences {
  enabled: boolean;
  duelTurns: boolean; // Quan és el teu torn en un duel
  duelDefeat: boolean; // Avís de derrota i motivació per a la revenja
  ocaOvertakeAmbitA: boolean; // Quan un/a company/a t'avança al Tauler Àmbit A
  ocaOvertakeAmbitB: boolean; // Quan un/a company/a t'avança al Tauler Àmbit B
  ocaOvertakeAmbitC: boolean; // Quan un/a company/a t'avança al Tauler Àmbit C
  ocaOvertakeAmbitD: boolean; // Quan un/a company/a t'avança al Tauler Àmbit D
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  duelTurns: true,
  duelDefeat: true,
  ocaOvertakeAmbitA: true,
  ocaOvertakeAmbitB: true,
  ocaOvertakeAmbitC: true,
  ocaOvertakeAmbitD: true,
};

export interface InAppNotification {
  id: string;
  type: 'turn_notification' | 'match_challenge' | 'defeat_revenge' | 'oca_overtake' | 'system';
  matchId?: string;
  ambitId?: string;
  fromUid: string;
  fromName: string;
  message: string;
  title?: string;
  read: boolean;
  timestamp: number;
}

export interface DeviceTokenRecord {
  token: string;
  userId: string;
  platform: 'android' | 'web';
  isCapacitorApp?: boolean;
  isPWA?: boolean;
  userAgent?: string;
  createdAt: number;
  lastActive: number;
}

export interface InvitationCode {
  id: string;
  code: string;
  duration_days: number;
  is_unlimited: boolean;
  is_used: boolean;
  used_by_user_id?: string | null;
  used_by_email?: string | null;
  used_by_username?: string | null;
  used_at?: string | null;
  batch_name?: string | null;
  created_at?: string;
}

export interface QuestionReport {
  id: string;
  question_id: string;
  question_text?: string;
  ambit?: string;
  reported_by_uid: string;
  reported_by_name: string;
  reported_by_email?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  admin_notes?: string;
  created_at?: string;
}

export interface RenewalRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  request_type: string;
  phone?: string;
  message?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  admin_notes?: string;
  created_at: string;
}

export interface AcademyContactInfo {
  id: string;
  whatsapp_number: string;
  telegram_handle: string;
  support_email: string;
  payment_instructions: string;
  updated_at?: string;
}

export interface FinishedDuelResult {
  id: string;
  player1Id: string;
  player1Name: string;
  player1Avatar?: string;
  player1ShieldId?: string;
  scoreP1: number;
  player2Id: string;
  player2Name: string;
  player2Avatar?: string;
  player2ShieldId?: string;
  scoreP2: number;
  winnerUid?: string;
  winnerName?: string;
  isDraw?: boolean;
  endedAt: string | number;
  timeAgoText: string;
}

export interface AppSectionConfig {
  campanya: string;
  duels: string;
  tienda: string;
  repas: string;
  ranking: string;
}

export interface OcaActiveQuestionState {
  question: Question;
  selectedIndex: number | null;
  isAnswered: boolean;
  ambit: QuestionAmbit;
  tileAtQuestion: number;
  disabledOptionIndices?: number[];
  timestamp: number;
}

export type QuestionAmbit = 'Àmbit A' | 'Àmbit B' | 'Àmbit C' | 'Actualitat' | 'ISPC' | string;

export type OcaTileRole = 'normal' | 'mosso' | 'control' | 'torre' | 'oficina' | 'circuit' | 'impugnacio';

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
  explanation?: string;
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
  imageUrl?: string;
  customLogoUrl?: string;
  hideBorder?: boolean;
  customLogoScale?: number;
  logoFit?: 'contain' | 'cover';
  logoShape?: 'square' | 'rounded' | 'circle';
  ambitDesbloqueig?: string;
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
  botDifficulty?: 'agent' | 'caporal' | 'sergent' | 'aspirant';
  botAccuracy?: number;
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