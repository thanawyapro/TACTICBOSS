import { GameItem } from './gameData';

export type OfficialGameFamily =
  | 'EA_FC_IQ'
  | 'EA_FC_PLAYSTYLES'
  | 'FIFA_HYPERMOTION'
  | 'FIFA_LEGACY_TACTICS'
  | 'EFOOTBALL_MODERN'
  | 'PES_ADVANCED_INSTRUCTIONS';

export interface OfficialGameDNA {
  family: OfficialGameFamily;
  confidence: 'Official-aligned' | 'Official + inferred meta' | 'Estimated legacy';
  score: number;
  officialBasis: string[];
  appMustPrioritize: string[];
  avoid: string[];
}

export const OFFICIAL_GAME_DNA: Record<string, OfficialGameDNA> = {
  'ea-fc-26': {
    family: 'EA_FC_IQ',
    confidence: 'Official-aligned',
    score: 92,
    officialBasis: ['FC IQ iteration', 'Player Roles / Role coverage gaps', 'Competitive vs Authentic gameplay split'],
    appMustPrioritize: ['Player Roles and Focus compatibility', 'Smart Tactics by match state', 'Competitive responsiveness for online play'],
    avoid: ['Treating it like pre-FC IQ FIFA', 'Using one static depth for all modes', 'Recommending roles without checking balance']
  },
  'ea-fc-25': {
    family: 'EA_FC_IQ',
    confidence: 'Official-aligned',
    score: 95,
    officialBasis: ['FC IQ core tactical system', 'Player Roles', 'Team Tactics', 'Smart Tactics'],
    appMustPrioritize: ['Role Familiarity', 'Role Focus', 'Team Tactics synergy', 'Smart Tactics timing'],
    avoid: ['Old custom-tactics-only logic', 'Overloading every player with attacking focus', 'Ignoring off-ball Role behaviour']
  },
  'ea-fc-24': {
    family: 'EA_FC_PLAYSTYLES',
    confidence: 'Official-aligned',
    score: 93,
    officialBasis: ['HyperMotionV', 'PlayStyles optimized by Opta', 'Precision Pass', 'Effort Dribble', 'Controlled Sprint'],
    appMustPrioritize: ['PlayStyle-driven role selection', 'Controlled Sprint outlets', 'Precision passing lanes'],
    avoid: ['Assuming FC IQ roles exist', 'Ignoring PlayStyle strengths', 'Building a tactic without ball-carrier support']
  },
  'fifa-23': {
    family: 'FIFA_HYPERMOTION',
    confidence: 'Official-aligned',
    score: 91,
    officialBasis: ['HyperMotion2', 'Power Shots', 'new acceleration mechanics / AcceleRATE', 'enhanced player awareness'],
    appMustPrioritize: ['AcceleRATE matchups', 'Power Shot space creation', 'set-piece and transition protection'],
    avoid: ['Using slow recovery defenders in high depth', 'Power Shots without space/time', 'Leaving fullbacks high together']
  },
  'fifa-22': {
    family: 'FIFA_HYPERMOTION',
    confidence: 'Official + inferred meta',
    score: 86,
    officialBasis: ['HyperMotion on next-gen', '11v11 match capture', 'machine-learning animation flow'],
    appMustPrioritize: ['Structured build-up', 'balanced depth', 'safe second-man press usage'],
    avoid: ['Overpressing', 'isolated central buildup', 'forcing old FIFA 21 creative-run logic']
  },
  'fifa-21': {
    family: 'FIFA_LEGACY_TACTICS',
    confidence: 'Official-aligned',
    score: 88,
    officialBasis: ['Agile Dribbling', 'Positioning Personality', 'Creative Runs'],
    appMustPrioritize: ['1v1 dribbling support', 'manual creative runs', 'wide/half-space protection'],
    avoid: ['Static runs', 'leaving fullbacks unsupported', 'defending 1v1 without cover']
  },
  'fifa-20': {
    family: 'FIFA_LEGACY_TACTICS',
    confidence: 'Official-aligned',
    score: 87,
    officialBasis: ['Football Intelligence', 'Strafe Dribbling', 'Dynamic 1v1s', 'Composed Finishing'],
    appMustPrioritize: ['Manual defending discipline', 'jockey-first defending', 'safe controlled dribbling zones'],
    avoid: ['CB dragging', 'constant sprint defending', 'dribbling near own box']
  },
  'fifa-19': {
    family: 'FIFA_LEGACY_TACTICS',
    confidence: 'Official-aligned',
    score: 89,
    officialBasis: ['Timed Finishing', 'Dynamic Tactics', 'Active Touch System'],
    appMustPrioritize: ['Multiple Dynamic Tactics presets', 'shot-timing discipline', 'central screening'],
    avoid: ['Relying on one preset', 'timed shots from bad angles', 'leaving CDM lane empty']
  },
  'efootball-modern': {
    family: 'EFOOTBALL_MODERN',
    confidence: 'Official-aligned',
    score: 94,
    officialBasis: ['eFootball live-service model after PES transition', 'Team Playstyles: Possession Game / Quick Counter / Long Ball Counter / Out Wide / Long Ball', 'manager Team Playstyle fit', 'Individual Instructions with limited attack/defence slots'],
    appMustPrioritize: ['Team Playstyle and manager fit before formation', 'Mobile vs Console/PC feel as a context, not a separate yearly game', 'Individual Instructions: Anchoring / Counter Target / Deep Line / Defensive without conflicts', 'rest-defence with 2 CB + DMF or protected fullback'],
    avoid: ['Listing eFootball 2022-2026 as separate user-facing games', 'using PES numeric sliders for modern eFootball', 'overclaiming live manager-card values without a verified dataset']
  },
  'efootball-2026': {
    family: 'EFOOTBALL_MODERN',
    confidence: 'Official + inferred meta',
    score: 88,
    officialBasis: ['Current eFootball v5 direction', 'Team Playstyles', 'manager proficiency', 'Link-up Play for selected managers'],
    appMustPrioritize: ['Manager Playstyle fit', 'Individual Instructions', 'Position Proficiency and Edit Position', 'Link-up conditions when known'],
    avoid: ['Claiming live manager-card values without a dataset', 'Treating it like PES Team Spirit', 'Ignoring player Playing Styles']
  },
  'efootball-2025': {
    family: 'EFOOTBALL_MODERN',
    confidence: 'Official-aligned',
    score: 91,
    officialBasis: ['Team Playstyles', 'manager Team Playstyle Proficiency', 'In-Match Roles aptness logic', 'Individual Instructions'],
    appMustPrioritize: ['Team Playstyle / manager fit', 'role aptness', 'two attack + two defence instructions', 'stable rest defence'],
    avoid: ['Old player Team Playstyle Proficiency logic', 'overclaiming stat boosts', 'using both fullbacks high without cover']
  },
  'efootball-2024': {
    family: 'EFOOTBALL_MODERN',
    confidence: 'Official-aligned',
    score: 93,
    officialBasis: ['Position Training', 'Edit Position', 'Individual Instructions', 'Team Playstyle behavior changes'],
    appMustPrioritize: ['Position Proficiency', 'fine-tuned player placement', 'style-specific movement', 'limited clear instructions'],
    avoid: ['Formation-only recommendations', 'wrong position proficiency', 'conflicting player movement instructions']
  },
  'efootball-2023': {
    family: 'EFOOTBALL_MODERN',
    confidence: 'Official-aligned',
    score: 87,
    officialBasis: ['Team Playstyle system before v3.0 carryover changes', 'long ball / out wide / possession adjustments across patches'],
    appMustPrioritize: ['Manual passing timing', 'central cover', 'style-specific support movement'],
    avoid: ['Applying post-v3.0 no-player-proficiency logic backwards without warning', 'wide pressure without weak-side cover']
  },
  'efootball-2022': {
    family: 'EFOOTBALL_MODERN',
    confidence: 'Estimated legacy',
    score: 81,
    officialBasis: ['New eFootball transition era', 'Game Plan features including change formation and individual instructions'],
    appMustPrioritize: ['Low-risk shape', 'simple defensive cover', 'limited aggressive automation'],
    avoid: ['Complex automated patterns', 'high-risk buildup', 'assuming later eFootball v4/v5 mechanics']
  },
  'pes-2021': {
    family: 'PES_ADVANCED_INSTRUCTIONS',
    confidence: 'Official + inferred meta',
    score: 90,
    officialBasis: ['PES 2021 Season Update', 'Master League managers', 'myClub manager/team spirit ecosystem', 'Advanced Instructions inherited from PES Game Plan'],
    appMustPrioritize: ['Team Spirit / manager suitability', 'Advanced Instructions', 'compactness', 'support range'],
    avoid: ['Ignoring Team Spirit', 'too many conflicting Advanced Instructions', 'high defensive line without pace']
  },
  'pes-2020': {
    family: 'PES_ADVANCED_INSTRUCTIONS',
    confidence: 'Official-aligned',
    score: 88,
    officialBasis: ['Finesse Dribble', 'improved trapping mechanics', 'player personality and match situation ball control'],
    appMustPrioritize: ['safe Finesse Dribble zones', 'controlled build-up', 'Advanced Instructions balance'],
    avoid: ['dribbling in defensive third', 'fullback overcommitment', 'late defender switching']
  },
  'pes-2019': {
    family: 'PES_ADVANCED_INSTRUCTIONS',
    confidence: 'Official-aligned',
    score: 86,
    officialBasis: ['Magic Moments skill traits', 'Visible Fatigue', 'Advanced Instructions', 'improved shooting/ball physics'],
    appMustPrioritize: ['stamina-aware pressing', 'Advanced Instructions presets', 'compact passing angles'],
    avoid: ['pressing constantly despite fatigue', 'ignoring player individuality', 'random one-touch passing']
  }
};

export function officialDnaForGame(game: Pick<GameItem, 'id'> | string): OfficialGameDNA {
  const id = typeof game === 'string' ? game : game.id;
  return OFFICIAL_GAME_DNA[id] || OFFICIAL_GAME_DNA['ea-fc-25'];
}

export function officialDnaSummary(game: Pick<GameItem, 'id'> | string, lang: string): Record<string, string> {
  const dna = officialDnaForGame(game);
  const ar = lang === 'ar';
  return {
    [ar ? 'DNA رسمي' : 'Official DNA']: dna.family.replace(/_/g, ' '),
    [ar ? 'درجة التوافق' : 'Verification Score']: `${dna.score}/100`,
    [ar ? 'مستوى الثقة' : 'Confidence Level']: dna.confidence,
    [ar ? 'أساس التحقق' : 'Verified Basis']: dna.officialBasis.join(' • '),
    [ar ? 'أولوية اللعبة' : 'Game Priority']: dna.appMustPrioritize.join(' • ')
  };
}
