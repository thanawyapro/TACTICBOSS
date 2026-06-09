export interface TacticResult {
  formation: string;
  reason: string;
  defensiveStyle: string;
  defensiveDetails: Record<string, string>;
  attackingStyle: string;
  attackingDetails: Record<string, string>;
  playerInstructions: string[];
  inGameStrategy: string;
  emergencyPlan: string;
  protectLeadPlan: string;
  mistakesToAvoid: string[];
  difficulty: string;
  confidence: string;
  boardAnalysis?: string[];
}

export interface TacticalPlayer {
  id: string;
  role: string;
  name?: string;
  x: number;
  y: number;
  isOpponent: boolean;
}

export interface TacticalBoardState {
  players: TacticalPlayer[];
  teamColor: string;
  opponentColor: string;
  drawingDataUrl?: string;
}

export interface SavedTactic {
  id: string;
  title: string;
  game: string;
  myFormation: string;
  oppFormation: string;
  opponentStyle: string;
  myStyle: string;
  matchState: string;
  myTeam: string;
  oppTeam: string;
  notes: string;
  result: TacticResult;
  board?: TacticalBoardState | null;
  createdAt: string;
}

export interface Rival {
  id: string;
  name: string;
  favoriteGame: string;
  favoriteFormation: string;
  playstyle: string;
  strengths: string;
  weaknesses: string;
  notes: string;
  favoriteTeam?: string;
  board?: TacticalBoardState | null;
  createdAt: string;
}

export interface UserSubscription {
  plan: 'free' | 'pro' | 'elite';
  status: 'active' | 'expired' | 'canceled' | 'trialing';
  startedAt: string;
  expiresAt: string;
  aiMonthlyLimit: number;
  savedTacticsLimit: number;
  rivalsLimit: number;
}

export interface AppSettings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConnected: boolean;
}
