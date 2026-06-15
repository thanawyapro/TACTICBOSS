import { TacticalBoardState, TacticalPlayer } from '../types';
import { GeneratorInput } from './tacticalEngine';

export type EfootballPlaystyle = 'Possession Game' | 'Quick Counter' | 'Long Ball Counter' | 'Out Wide' | 'Long Ball';

export interface EfootballManagerPreset {
  id: string;
  name: string;
  alias?: string;
  primaryPlaystyle: EfootballPlaystyle;
  secondaryPlaystyles: EfootballPlaystyle[];
  proficiency: number;
  bestFormations: string[];
  tacticalDNA: string;
  buildUpPattern: string;
  chanceCreation: string;
  defensivePattern: string;
  bestAgainst: string[];
  weakAgainst: string[];
  roleFits: string[];
  individualInstructions: string[];
  advancedAdjustments: string[];
  linkUpNote?: string;
  confidence: 'High' | 'Medium' | 'Estimated';
}

export const EFOOTBALL_PLAYSTYLES: EfootballPlaystyle[] = [
  'Possession Game',
  'Quick Counter',
  'Long Ball Counter',
  'Out Wide',
  'Long Ball'
];

export const EFOOTBALL_DEFAULT_MANAGERS: EfootballManagerPreset[] = [
  {
    id: 'guardiola-possession',
    name: 'Pep Guardiola / Luis A. Roman',
    alias: 'Guardiola',
    primaryPlaystyle: 'Possession Game',
    secondaryPlaystyles: ['Out Wide'],
    proficiency: 88,
    bestFormations: ['4-2-3-1', '4-3-3', '3-2-4-1'],
    tacticalDNA: 'Short circulation, positional overloads, high fullback/half-space support and patient final-third occupation.',
    buildUpPattern: 'GK + Build Up CB + DMF triangle; fullbacks can push higher unless you need one Defensive Full-back.',
    chanceCreation: 'Create overloads around AMF/CMF, then release LWF/RWF or cut back to CF.',
    defensivePattern: 'Counter-press first pass, then recover into a compact 4-1-4-1/4-2-3-1 block.',
    bestAgainst: ['Low block', 'narrow 4-3-1-2', 'teams that overcommit to central pressure'],
    weakAgainst: ['Long Ball Counter behind fullbacks', 'fast CF + direct through balls'],
    roleFits: ['Build Up CB', 'Orchestrator CMF/DMF', 'Creative Playmaker AMF', 'Prolific Winger', 'Goal Poacher CF'],
    individualInstructions: ['Defensive on one fullback when protecting lead', 'Anchoring on DMF if both fullbacks are high', 'Counter Target on CF only when stamina drops'],
    advancedAdjustments: ['Keep CMF/DMF slightly higher in build-up', 'Move AMF between lines', 'Do not isolate CF; keep one AMF close'],
    linkUpNote: 'Some Guardiola-style Link-up versions can require specific winger/fullback or creator/runner pairings; verify the exact card in-game.',
    confidence: 'High'
  },
  {
    id: 'xabi-alonso-quick-counter',
    name: 'Xabi Alonso',
    primaryPlaystyle: 'Quick Counter',
    secondaryPlaystyles: ['Possession Game', 'Long Ball Counter'],
    proficiency: 88,
    bestFormations: ['4-2-1-3', '3-4-2-1', '4-3-2-1'],
    tacticalDNA: 'Vertical transitions with structured midfield rest defence and fast half-space attacks.',
    buildUpPattern: 'Use a double pivot or DMF + CMF platform, then progress early into AMF/SS zones.',
    chanceCreation: 'Fast through passes into CF/LWF/RWF after regaining possession.',
    defensivePattern: 'Aggressive first press, medium-high line, protect the central lane with DMF.',
    bestAgainst: ['Possession teams', 'slow build-up', 'wide teams with advanced fullbacks'],
    weakAgainst: ['Deep compact LBC', 'overloaded central blocks'],
    roleFits: ['Anchor Man DMF', 'Box-to-Box CMF', 'Hole Player AMF/SS', 'Goal Poacher CF', 'Prolific Winger'],
    individualInstructions: ['Deep Line on DMF if opponent has fast CF', 'Defensive on weak-side fullback', 'Counter Target on CF against high press'],
    advancedAdjustments: ['Narrow the front three slightly', 'Keep one CMF behind the ball', 'Do not push both fullbacks at once'],
    confidence: 'Medium'
  },
  {
    id: 'klopp-zeitzler-quick-counter',
    name: 'Jürgen Klopp / G. Zeitzler',
    alias: 'Klopp',
    primaryPlaystyle: 'Quick Counter',
    secondaryPlaystyles: ['Out Wide'],
    proficiency: 87,
    bestFormations: ['4-3-3', '4-2-1-3', '4-2-3-1'],
    tacticalDNA: 'High-energy pressing, fast vertical attacks and early wide-to-central combinations.',
    buildUpPattern: 'Simple first pass, then accelerate into winger/CF channels.',
    chanceCreation: 'Use LWF/RWF runs behind the line and AMF second-ball support.',
    defensivePattern: 'Front pressure with compact midfield; dangerous if stamina collapses.',
    bestAgainst: ['Slow possession', 'wide build-up', 'teams with weak passing CBs'],
    weakAgainst: ['Long Ball Counter', 'two-target-man systems', 'patient low blocks'],
    roleFits: ['Destroyer CB', 'Box-to-Box CMF', 'Hole Player AMF', 'Prolific Winger', 'Goal Poacher CF'],
    individualInstructions: ['Defensive on one fullback', 'Tight Marking on opponent AMF if needed', 'Counter Target on fastest forward late game'],
    advancedAdjustments: ['Keep compactness high', 'Use medium depth if opponent spams through balls', 'Rotate press intensity by match state'],
    confidence: 'Medium'
  },
  {
    id: 'capello-lbc',
    name: 'Fabio Capello',
    primaryPlaystyle: 'Long Ball Counter',
    secondaryPlaystyles: ['Long Ball'],
    proficiency: 88,
    bestFormations: ['4-2-2-2', '5-2-1-2', '4-2-3-1'],
    tacticalDNA: 'Compact defending, direct progression and ruthless transition efficiency.',
    buildUpPattern: 'Win it, secure first pass, then hit CF/SS or wide runner early.',
    chanceCreation: 'Attack the space behind advanced backlines with CF + SS/AMF pairings.',
    defensivePattern: 'Deep or medium compact block; protect central zone first.',
    bestAgainst: ['Quick Counter', 'high defensive line', 'possession with advanced fullbacks'],
    weakAgainst: ['Patient wide circulation', 'teams that force you to build short'],
    roleFits: ['Defensive Full-back', 'Anchor Man DMF', 'Destroyer CB', 'Target Man CF', 'Goal Poacher CF'],
    individualInstructions: ['Deep Line on DMF', 'Defensive on both fullbacks against elite wingers', 'Counter Target on CF'],
    advancedAdjustments: ['Keep CBs narrow', 'Do not drag DMF too high', 'Use two forwards if opponent plays a high line'],
    confidence: 'Medium'
  },
  {
    id: 'deschamps-lbc',
    name: 'Didier Deschamps',
    primaryPlaystyle: 'Long Ball Counter',
    secondaryPlaystyles: ['Quick Counter'],
    proficiency: 87,
    bestFormations: ['4-2-3-1', '4-3-2-1', '5-3-2'],
    tacticalDNA: 'Pragmatic block, athletic transitions and strong central protection.',
    buildUpPattern: 'Secure through DMF/CMF, then release direct to CF or wide outlet.',
    chanceCreation: 'Use power runners and late AMF support after the first long outlet.',
    defensivePattern: 'Compact medium-low block with strong DMF screen.',
    bestAgainst: ['Possession Game', 'narrow attacks', 'fragile fullbacks'],
    weakAgainst: ['Out Wide crossing overloads', 'teams with two AMFs between lines'],
    roleFits: ['Anchor Man DMF', 'Box-to-Box CMF', 'Goal Poacher CF', 'Wide Midfielder', 'Destroyer CB'],
    individualInstructions: ['Defensive on one fullback', 'Deep Line on DMF', 'Man Mark dangerous AMF'],
    advancedAdjustments: ['Keep one winger deeper', 'Use CF as outlet', 'Avoid overpressing with CBs'],
    confidence: 'Estimated'
  },
  {
    id: 'mourinho-lbc',
    name: 'José Mourinho',
    primaryPlaystyle: 'Long Ball Counter',
    secondaryPlaystyles: ['Long Ball'],
    proficiency: 87,
    bestFormations: ['4-2-3-1', '5-2-1-2', '4-4-2'],
    tacticalDNA: 'Low-risk defence, set-piece threat, vertical release and game-state control.',
    buildUpPattern: 'Avoid risky central build-up; play into strong CF or wide channel.',
    chanceCreation: 'Use AMF + CF combinations and cross/second-ball pressure.',
    defensivePattern: 'Compact block, protect lead early, invite opponent into low-value zones.',
    bestAgainst: ['Overaggressive press', 'teams that leave space behind fullbacks'],
    weakAgainst: ['Patient possession with elite AMF', 'constant switch of play'],
    roleFits: ['Defensive Full-back', 'Anchor Man DMF', 'Target Man CF', 'Classic No.10/Creative AMF', 'Destroyer CB'],
    individualInstructions: ['Defensive on fullbacks', 'Counter Target on CF', 'Tight Marking on main creator'],
    advancedAdjustments: ['Lower both fullbacks when leading', 'Keep AMF close to CF', 'Use two banks of four under pressure'],
    confidence: 'Estimated'
  },
  {
    id: 'arteta-possession',
    name: 'Mikel Arteta',
    primaryPlaystyle: 'Possession Game',
    secondaryPlaystyles: ['Out Wide', 'Quick Counter'],
    proficiency: 87,
    bestFormations: ['4-3-3', '4-2-3-1', '3-2-4-1'],
    tacticalDNA: 'Structured possession, inverted support, winger isolation and strong counter-press.',
    buildUpPattern: 'CB + DMF platform with one fullback supporting inside or conservatively.',
    chanceCreation: 'Isolate winger, overload AMF/CMF lane, then cut back.',
    defensivePattern: 'Counter-press with good rest defence; vulnerable if both sides push together.',
    bestAgainst: ['Low block', 'teams weak against wing isolation'],
    weakAgainst: ['Fast LBC into fullback space', 'strong target CF'],
    roleFits: ['Build Up CB', 'Orchestrator DMF', 'Creative Playmaker AMF', 'Prolific Winger', 'Offensive Full-back'],
    individualInstructions: ['Defensive on one fullback', 'Anchoring on DMF', 'Counter Target on winger only late'],
    advancedAdjustments: ['One winger wide, one inside', 'Keep AMF between lines', 'Avoid isolating DMF'],
    confidence: 'Estimated'
  },
  {
    id: 'flick-out-wide-qc',
    name: 'Hansi Flick',
    primaryPlaystyle: 'Out Wide',
    secondaryPlaystyles: ['Quick Counter', 'Possession Game'],
    proficiency: 87,
    bestFormations: ['4-2-3-1', '4-3-3', '4-2-2-2'],
    tacticalDNA: 'Aggressive wide pressure, vertical attacks and box occupation from crosses/cutbacks.',
    buildUpPattern: 'Fast release to wide players, CMF support underneath, fullback overlap selectively.',
    chanceCreation: 'Cross/cutback with CF + AMF attacking the box.',
    defensivePattern: 'High press can dominate but needs cover against direct balls.',
    bestAgainst: ['Narrow blocks', 'slow fullbacks', 'teams weak at far post'],
    weakAgainst: ['LBC behind high fullbacks', 'calm possession switches'],
    roleFits: ['Offensive Full-back', 'Prolific Winger', 'Hole Player AMF', 'Goal Poacher CF', 'Box-to-Box CMF'],
    individualInstructions: ['Defensive on weak-side fullback', 'Counter Target on CF', 'Deep Line on DMF when exposed'],
    advancedAdjustments: ['Push only one fullback at a time', 'Keep far winger attacking back post', 'Use AMF close to CF'],
    confidence: 'Estimated'
  },
  {
    id: 'amorim-wide-hybrid',
    name: 'Rúben Amorim',
    primaryPlaystyle: 'Out Wide',
    secondaryPlaystyles: ['Quick Counter', 'Possession Game'],
    proficiency: 86,
    bestFormations: ['3-4-2-1', '3-5-2', '5-2-1-2'],
    tacticalDNA: 'Back-three stability, wingback width and two creators close to the striker.',
    buildUpPattern: 'Three CBs circulate, wingbacks stretch, SS/AMF receive between lines.',
    chanceCreation: 'Wingback delivery or half-space combination into CF.',
    defensivePattern: 'Back five on defence, quick jump from wingback on pressing cues.',
    bestAgainst: ['4-3-3 wide attacks', 'single-striker systems'],
    weakAgainst: ['Two CF pressing your outside CBs', 'strong central AMF overloads'],
    roleFits: ['Build Up CB', 'Wingback', 'Hole Player SS/AMF', 'Target Man/Goal Poacher CF', 'Anchor Man DMF'],
    individualInstructions: ['Defensive on one wingback when leading', 'Deep Line on DMF', 'Counter Target on CF'],
    advancedAdjustments: ['Keep outside CBs wide', 'Do not leave both wingbacks too high', 'Use two SS close to CF'],
    confidence: 'Estimated'
  },
  {
    id: 'rijkaard-quick-counter',
    name: 'Frank Rijkaard',
    primaryPlaystyle: 'Quick Counter',
    secondaryPlaystyles: ['Possession Game'],
    proficiency: 87,
    bestFormations: ['4-2-1-3', '4-3-3', '4-2-3-1'],
    tacticalDNA: 'Balanced Quick Counter with midfield control and safer rest defence than pure all-out press.',
    buildUpPattern: 'DMF gives cover while CMF/AMF launch vertical attacks.',
    chanceCreation: 'Quick third-man runs and fast wide-to-CF combinations.',
    defensivePattern: 'Compact press with a reliable midfield screen.',
    bestAgainst: ['Possession Game', 'mid-block teams', 'wide but slow attacks'],
    weakAgainst: ['Deep LBC', 'target-man long ball'],
    roleFits: ['Anchor Man DMF', 'Box-to-Box CMF', 'Creative AMF', 'Goal Poacher CF', 'Prolific Winger'],
    individualInstructions: ['Deep Line on DMF against fast CF', 'Defensive on one fullback', 'Counter Target on CF late'],
    advancedAdjustments: ['Keep midfield triangle close', 'Avoid both CMFs running beyond ball', 'Use compact front three'],
    confidence: 'Estimated'
  },
  {
    id: 'simone-inzaghi-lbc',
    name: 'Simone Inzaghi',
    primaryPlaystyle: 'Long Ball Counter',
    secondaryPlaystyles: ['Quick Counter', 'Out Wide'],
    proficiency: 88,
    bestFormations: ['3-5-2', '5-3-2', '3-4-2-1'],
    tacticalDNA: 'Back-three security, wingback outlets and two-striker counters after deep defending.',
    buildUpPattern: 'Use three CBs and a DMF/CMF screen, then release wingbacks or the front two quickly.',
    chanceCreation: 'Crosses, second balls and fast combinations between CF and SS.',
    defensivePattern: 'Medium-low compact block with wingbacks dropping into a back five.',
    bestAgainst: ['Quick Counter', 'wide 4-3-3', 'high fullbacks'],
    weakAgainst: ['Patient possession', 'central AMF overloads'],
    roleFits: ['Build Up CB', 'Destroyer CB', 'Anchor Man DMF', 'Cross Specialist', 'Goal Poacher CF'],
    individualInstructions: ['Defensive on one wingback when leading', 'Counter Target on fastest CF', 'Deep Line on DMF'],
    advancedAdjustments: ['Do not leave outside CB isolated', 'Keep one forward close to second striker', 'Use wingbacks as first outlet'],
    confidence: 'Estimated'
  },
  {
    id: 'vincent-kompany-possession',
    name: 'Vincent Kompany',
    primaryPlaystyle: 'Possession Game',
    secondaryPlaystyles: ['Out Wide'],
    proficiency: 88,
    bestFormations: ['4-3-3', '4-2-3-1', '3-2-4-1'],
    tacticalDNA: 'High possession, proactive build-up and aggressive rest defence.',
    buildUpPattern: 'CBs split, DMF supports short passing and one fullback can step inside.',
    chanceCreation: 'Wide-to-inside combinations with AMF and winger rotations.',
    defensivePattern: 'High line with counter-press; requires fast CB recovery.',
    bestAgainst: ['Low block', 'slow midfield pressure'],
    weakAgainst: ['Long Ball Counter', 'fast target runners'],
    roleFits: ['Build Up CB', 'Orchestrator DMF', 'Creative Playmaker', 'Prolific Winger', 'Offensive Full-back'],
    individualInstructions: ['Defensive on one fullback', 'Anchoring on DMF', 'Tight Marking only on elite AMF'],
    advancedAdjustments: ['Keep one fullback conservative', 'Avoid both CMFs ahead of ball', 'Create triangle around DMF'],
    confidence: 'Estimated'
  },
  {
    id: 'ronald-koeman-out-wide',
    name: 'Ronald Koeman',
    primaryPlaystyle: 'Out Wide',
    secondaryPlaystyles: ['Possession Game', 'Long Ball Counter'],
    proficiency: 87,
    bestFormations: ['4-2-3-1', '4-3-3', '3-4-3'],
    tacticalDNA: 'Wide progression, crossing lanes and direct switches to isolate fullbacks.',
    buildUpPattern: 'Secure DMF base, switch early to wide players and overlap selectively.',
    chanceCreation: 'Crosses, cutbacks and far-post winger/CF attacks.',
    defensivePattern: 'Medium block; protect centre when wide players push high.',
    bestAgainst: ['Narrow blocks', 'teams weak on fullback zones'],
    weakAgainst: ['Quick central counter', 'overloaded AMF zones'],
    roleFits: ['Cross Specialist', 'Offensive Full-back', 'Target Man', 'Box-to-Box CMF', 'Build Up CB'],
    individualInstructions: ['Defensive on weak-side fullback', 'Counter Target on CF', 'Deep Line on DMF if needed'],
    advancedAdjustments: ['Do not cross without box presence', 'Keep opposite winger attacking far post', 'Use one CMF for cover'],
    confidence: 'Estimated'
  },
  {
    id: 'luis-enrique-possession',
    name: 'Luis Enrique',
    primaryPlaystyle: 'Possession Game',
    secondaryPlaystyles: ['Quick Counter'],
    proficiency: 87,
    bestFormations: ['4-3-3', '4-2-1-3', '4-2-3-1'],
    tacticalDNA: 'High-tempo possession, positional rotations and sharp front-three movements.',
    buildUpPattern: 'DMF plus two interiors create passing lanes before releasing wingers.',
    chanceCreation: 'Inside winger runs, AMF support and quick wall passes around the box.',
    defensivePattern: 'Counter-press immediately after loss with compact midfield.',
    bestAgainst: ['Low block', 'wide but slow teams'],
    weakAgainst: ['Direct LBC', 'physical target man'],
    roleFits: ['Creative Playmaker', 'Orchestrator', 'Hole Player', 'Prolific Winger', 'Goal Poacher'],
    individualInstructions: ['Anchoring on DMF', 'Defensive on one fullback', 'Counter Target only when protecting lead'],
    advancedAdjustments: ['Keep front three close enough', 'Use one winger wide', 'Do not overcrowd AMF space'],
    confidence: 'Estimated'
  },
  {
    id: 'gasperini-qc',
    name: 'Gian Piero Gasperini',
    primaryPlaystyle: 'Quick Counter',
    secondaryPlaystyles: ['Out Wide'],
    proficiency: 87,
    bestFormations: ['3-4-2-1', '3-4-1-2', '3-5-2'],
    tacticalDNA: 'Aggressive man-oriented pressure, wingback intensity and vertical attacks.',
    buildUpPattern: 'Outside CBs carry forward while wingbacks stretch the pitch.',
    chanceCreation: 'Fast entries into two AMF/SS zones behind the striker.',
    defensivePattern: 'High pressure; vulnerable if first line is bypassed.',
    bestAgainst: ['Slow possession', 'single pivot teams'],
    weakAgainst: ['Long balls behind wingbacks', 'two fast CFs'],
    roleFits: ['Extra Frontman', 'Destroyer CB', 'Box-to-Box CMF', 'Hole Player', 'Offensive Full-back'],
    individualInstructions: ['Defensive on one wingback late game', 'Tight Marking on pivot', 'Counter Target on CF'],
    advancedAdjustments: ['Do not overpress with all CBs', 'Keep one CMF holding', 'Use wide overloads quickly'],
    confidence: 'Estimated'
  },
  {
    id: 'spalletti-possession',
    name: 'Luciano Spalletti',
    primaryPlaystyle: 'Possession Game',
    secondaryPlaystyles: ['Out Wide'],
    proficiency: 87,
    bestFormations: ['4-3-3', '4-2-3-1', '4-1-2-3'],
    tacticalDNA: 'Fluid possession, overloads around AMF/CMF and winger isolation.',
    buildUpPattern: 'DMF orchestrates while fullbacks offer staggered support.',
    chanceCreation: 'Fast switches then winger 1v1 or cutback into CF/AMF.',
    defensivePattern: 'Mid-high counter-press with central protection.',
    bestAgainst: ['Low block', 'narrow midfield'],
    weakAgainst: ['LBC behind fullbacks', 'strong pressing front two'],
    roleFits: ['Orchestrator DMF', 'Prolific Winger', 'Creative Playmaker', 'Goal Poacher', 'Build Up CB'],
    individualInstructions: ['Defensive on one fullback', 'Anchoring on DMF', 'Counter Target on CF late'],
    advancedAdjustments: ['One winger wide, one inside', 'Keep AMF near CF', 'Protect weak-side fullback'],
    confidence: 'Estimated'
  },
  {
    id: 'southgate-balanced-lbc',
    name: 'Gareth Southgate',
    primaryPlaystyle: 'Long Ball Counter',
    secondaryPlaystyles: ['Possession Game'],
    proficiency: 85,
    bestFormations: ['4-2-3-1', '3-4-2-1', '5-2-3'],
    tacticalDNA: 'Controlled risk, defensive protection and direct release to fast forwards.',
    buildUpPattern: 'Double pivot protects centre and releases wide runners.',
    chanceCreation: 'Attack space after turnovers, use AMF as support runner.',
    defensivePattern: 'Compact medium block; avoid exposing CBs.',
    bestAgainst: ['Quick Counter', 'wide pressure'],
    weakAgainst: ['Patient possession', 'creative AMF overload'],
    roleFits: ['Anchor Man', 'Box-to-Box', 'Goal Poacher', 'Defensive Full-back', 'Build Up CB'],
    individualInstructions: ['Deep Line on DMF', 'Defensive on one fullback', 'Counter Target on CF'],
    advancedAdjustments: ['Keep double pivot close', 'Do not overcommit fullbacks', 'Use AMF only as second runner'],
    confidence: 'Estimated'
  },
  {
    id: 'ancelotti-possession-lbc',
    name: 'Carlo Ancelotti',
    primaryPlaystyle: 'Possession Game',
    secondaryPlaystyles: ['Long Ball Counter', 'Quick Counter'],
    proficiency: 86,
    bestFormations: ['4-3-1-2', '4-3-3', '4-2-3-1'],
    tacticalDNA: 'Flexible control, midfield quality and game-state adaptation.',
    buildUpPattern: 'Build through CMF/DMF quality with safe fullback timing.',
    chanceCreation: 'AMF/SS links with CF and late CMF runs.',
    defensivePattern: 'Balanced block; adjust pressure to match state.',
    bestAgainst: ['Balanced teams', 'mid-blocks'],
    weakAgainst: ['Extreme wing overloads', 'very high press if slow CBs'],
    roleFits: ['Orchestrator', 'Box-to-Box', 'Hole Player', 'Goal Poacher', 'Build Up CB'],
    individualInstructions: ['Anchoring on DMF', 'Defensive on one fullback', 'Counter Target on CF when leading'],
    advancedAdjustments: ['Use narrow midfield if opponent weak central', 'Switch to wider shape vs low block', 'Protect fullback side'],
    confidence: 'Estimated'
  },
  {
    id: 'zidane-possession',
    name: 'Zinedine Zidane',
    primaryPlaystyle: 'Possession Game',
    secondaryPlaystyles: ['Quick Counter'],
    proficiency: 86,
    bestFormations: ['4-3-1-2', '4-3-3', '4-2-3-1'],
    tacticalDNA: 'Midfield control, elegant overloads and decisive final-third quality.',
    buildUpPattern: 'Triangle around DMF with CMFs controlling tempo.',
    chanceCreation: 'AMF finds pockets, CF pins CBs and wingers/SS attack space.',
    defensivePattern: 'Balanced compactness with selective pressing.',
    bestAgainst: ['Central blocks', 'teams with weak DMF'],
    weakAgainst: ['Wide crossing overload', 'direct LBC behind fullbacks'],
    roleFits: ['Creative Playmaker', 'Orchestrator', 'Box-to-Box', 'Goal Poacher', 'Build Up CB'],
    individualInstructions: ['Anchoring on DMF', 'Defensive on one fullback', 'Counter Target on CF late'],
    advancedAdjustments: ['Keep AMF between lines', 'Do not isolate CF', 'Use CMF support around AMF'],
    confidence: 'Estimated'
  },
  {
    id: 'cruyff-possession',
    name: 'Johan Cruyff',
    primaryPlaystyle: 'Possession Game',
    secondaryPlaystyles: ['Out Wide'],
    proficiency: 88,
    bestFormations: ['3-4-3', '4-3-3', '3-2-4-1'],
    tacticalDNA: 'Total-football spacing, rotations and aggressive positional superiority.',
    buildUpPattern: 'Create triangles everywhere, use one spare defender and central support.',
    chanceCreation: 'Rotations between winger, AMF and CF create free man in the box.',
    defensivePattern: 'High counter-press; relies on good rest defence.',
    bestAgainst: ['Low block', 'passive mid-block'],
    weakAgainst: ['Direct counters', 'pace behind advanced line'],
    roleFits: ['Creative Playmaker', 'Hole Player', 'Orchestrator', 'Prolific Winger', 'Build Up CB'],
    individualInstructions: ['Defensive on one fullback/CB support', 'Anchoring on DMF', 'Avoid Counter Target unless late game'],
    advancedAdjustments: ['Use wide triangles', 'Keep one central cover player', 'Do not abandon rest defence'],
    confidence: 'Estimated'
  },
  {
    id: 'tuchel-out-wide',
    name: 'Thomas Tuchel',
    primaryPlaystyle: 'Out Wide',
    secondaryPlaystyles: ['Possession Game', 'Long Ball Counter'],
    proficiency: 86,
    bestFormations: ['3-4-2-1', '4-2-3-1', '3-4-3'],
    tacticalDNA: 'Structured width, half-space creators and strong defensive rotations.',
    buildUpPattern: 'Back three or double pivot creates safe progression to wingbacks.',
    chanceCreation: 'Wingback/AMF combinations and cutbacks into CF.',
    defensivePattern: 'Compact block with good transition protection.',
    bestAgainst: ['Narrow teams', '4-3-1-2'],
    weakAgainst: ['Fast switches', 'high press on outside CB'],
    roleFits: ['Wingback', 'Hole Player', 'Anchor Man', 'Build Up CB', 'Goal Poacher'],
    individualInstructions: ['Defensive on weak-side wingback', 'Deep Line on DMF', 'Tight Marking on AMF'],
    advancedAdjustments: ['Keep two creators behind CF', 'Do not empty central midfield', 'Switch play when wing is crowded'],
    confidence: 'Estimated'
  }
];

let runtimeEfootballManagers: EfootballManagerPreset[] = [];

export function normalizeEfootballManagerPreset(input: Partial<EfootballManagerPreset>): EfootballManagerPreset | null {
  if (!input.id || !input.name || !input.primaryPlaystyle) return null;
  if (!EFOOTBALL_PLAYSTYLES.includes(input.primaryPlaystyle)) return null;
  const list = (value: unknown, fallback: string[] = []) => Array.isArray(value) ? value.map(String).filter(Boolean) : fallback;
  return {
    id: String(input.id),
    name: String(input.name),
    alias: input.alias ? String(input.alias) : undefined,
    primaryPlaystyle: input.primaryPlaystyle,
    secondaryPlaystyles: list(input.secondaryPlaystyles).filter((x): x is EfootballPlaystyle => EFOOTBALL_PLAYSTYLES.includes(x as EfootballPlaystyle)),
    proficiency: Math.max(0, Math.min(99, Number(input.proficiency ?? 80))),
    bestFormations: list(input.bestFormations, ['4-2-3-1']).slice(0, 6),
    tacticalDNA: String(input.tacticalDNA || 'Custom eFootball manager DNA controlled from Admin Command Center.'),
    buildUpPattern: String(input.buildUpPattern || 'Admin-defined build-up pattern.'),
    chanceCreation: String(input.chanceCreation || 'Admin-defined chance creation pattern.'),
    defensivePattern: String(input.defensivePattern || 'Admin-defined defensive pattern.'),
    bestAgainst: list(input.bestAgainst),
    weakAgainst: list(input.weakAgainst),
    roleFits: list(input.roleFits),
    individualInstructions: list(input.individualInstructions),
    advancedAdjustments: list(input.advancedAdjustments),
    linkUpNote: input.linkUpNote ? String(input.linkUpNote) : undefined,
    confidence: input.confidence === 'High' || input.confidence === 'Medium' || input.confidence === 'Estimated' ? input.confidence : 'Estimated'
  };
}

export function setRuntimeEfootballManagers(managers: Partial<EfootballManagerPreset>[]) {
  const normalized = managers.map(normalizeEfootballManagerPreset).filter(Boolean) as EfootballManagerPreset[];
  runtimeEfootballManagers = normalized;
}

export function activeEfootballManagers(): EfootballManagerPreset[] {
  if (!runtimeEfootballManagers.length) return EFOOTBALL_DEFAULT_MANAGERS;
  const customIds = new Set(runtimeEfootballManagers.map(m => m.id));
  return [...runtimeEfootballManagers, ...EFOOTBALL_DEFAULT_MANAGERS.filter(m => !customIds.has(m.id))];
}

export const EFOOTBALL_MANAGERS = activeEfootballManagers();


const arPlaystyle: Record<EfootballPlaystyle, string> = {
  'Possession Game': 'استحواذ',
  'Quick Counter': 'مرتدات سريعة',
  'Long Ball Counter': 'مرتدات كرات طويلة',
  'Out Wide': 'لعب على الأطراف',
  'Long Ball': 'كرات طويلة'
};

export function isEfootballGame(gameId?: string): boolean {
  return Boolean(gameId?.toLowerCase().includes('efootball'));
}

export function getEfootballManager(id?: string): EfootballManagerPreset | undefined {
  return activeEfootballManagers().find(manager => manager.id === id);
}

export function managerPlaystyleLabel(playstyle: EfootballPlaystyle, lang: string): string {
  return lang === 'ar' ? `${arPlaystyle[playstyle]} (${playstyle})` : playstyle;
}

export function bestManagerForStyle(style: string): EfootballManagerPreset {
  const managers = activeEfootballManagers();
  const normalized = `${style}`.toLowerCase();
  if (/possession|استحواذ/.test(normalized)) return managers.find(m => m.primaryPlaystyle === 'Possession Game') || managers[0];
  if (/long ball counter|lbc|مرتدات كرات طويلة/.test(normalized)) return managers.find(m => m.primaryPlaystyle === 'Long Ball Counter') || managers[3] || managers[0];
  if (/out wide|wide|الأطراف|عرض/.test(normalized)) return managers.find(m => m.primaryPlaystyle === 'Out Wide') || managers[7] || managers[0];
  if (/long ball|كرات طويلة/.test(normalized)) return managers.find(m => m.primaryPlaystyle === 'Long Ball') || managers.find(m => m.id === 'mourinho-lbc') || managers[5] || managers[0];
  return managers.find(m => m.primaryPlaystyle === 'Quick Counter') || managers[1] || managers[0];
}

export function buildEfootballManagerDetails(manager: EfootballManagerPreset, lang: string): Record<string, string> {
  const ar = lang === 'ar';
  return {
    [ar ? 'المدرب' : 'Manager']: manager.name,
    [ar ? 'أسلوب المدرب' : 'Manager Playstyle']: managerPlaystyleLabel(manager.primaryPlaystyle, lang),
    [ar ? 'أفضل التشكيلات' : 'Best Formations']: manager.bestFormations.join(' / '),
    [ar ? 'محاكاة المدرب' : 'Manager Simulation']: manager.tacticalDNA,
    [ar ? 'البناء' : 'Build-up']: manager.buildUpPattern,
    [ar ? 'صناعة الفرص' : 'Chance Creation']: manager.chanceCreation,
    [ar ? 'الدفاع' : 'Defensive Pattern']: manager.defensivePattern,
    [ar ? 'ثقة البيانات' : 'Data Confidence']: manager.confidence
  };
}

export function buildEfootballManagerInstructions(manager: EfootballManagerPreset, lang: string): string[] {
  const ar = lang === 'ar';
  const title = ar ? `محاكاة ${manager.name}:` : `${manager.name} simulation:`;
  return [
    `${title} ${manager.tacticalDNA}`,
    ...(ar
      ? [
          `أفضل تشكيلات لهذا المدرب: ${manager.bestFormations.join(' / ')}.`,
          `الأدوار المناسبة: ${manager.roleFits.join('، ')}.`,
          `تعليمات فردية مقترحة: ${manager.individualInstructions.join('، ')}.`,
          `تعديلات متقدمة: ${manager.advancedAdjustments.join('، ')}.`
        ]
      : [
          `Best formations for this manager: ${manager.bestFormations.join(' / ')}.`,
          `Best role fits: ${manager.roleFits.join(', ')}.`,
          `Suggested individual instructions: ${manager.individualInstructions.join(', ')}.`,
          `Advanced adjustments: ${manager.advancedAdjustments.join(', ')}.`
        ]),
    ...(manager.linkUpNote ? [ar ? `ملاحظة Link-up: ${manager.linkUpNote}` : `Link-up note: ${manager.linkUpNote}`] : [])
  ];
}

function parseFormationNumbers(formation: string): number[] {
  const clean = formation.replace(/\s+/g, '').split('(')[0];
  const nums = clean.match(/\d+/g)?.map(Number) || [4, 3, 3];
  return nums.filter(n => n > 0 && n <= 5);
}

function rolesForLine(lineIndex: number, count: number, totalLines: number, manager: EfootballManagerPreset): string[] {
  if (lineIndex === 0) {
    if (count === 3) return ['CB', 'CB', 'CB'];
    if (count === 5) return ['LB', 'CB', 'CB', 'CB', 'RB'];
    return ['LB', 'CB', 'CB', 'RB'].slice(0, count);
  }
  if (lineIndex === totalLines - 1) {
    if (count === 1) return ['CF'];
    if (count === 2) return manager.primaryPlaystyle === 'Long Ball Counter' ? ['CF', 'SS'] : ['SS', 'CF'];
    return ['LWF', 'CF', 'RWF'].slice(0, count);
  }
  if (count === 1) return ['DMF'];
  if (count === 2) return lineIndex === 1 ? ['DMF', 'CMF'] : ['AMF', 'AMF'];
  if (count === 3) return lineIndex === 1 ? ['CMF', 'DMF', 'CMF'] : ['LMF', 'AMF', 'RMF'];
  if (count === 4) return ['LMF', 'CMF', 'CMF', 'RMF'];
  return ['LMF', 'CMF', 'DMF', 'CMF', 'RMF'];
}

function styleYAdjust(role: string, y: number, manager: EfootballManagerPreset): number {
  if (manager.primaryPlaystyle === 'Possession Game') {
    if (['LB', 'RB', 'CMF', 'DMF'].includes(role)) return y - 5;
    if (role === 'AMF') return y + 2;
  }
  if (manager.primaryPlaystyle === 'Quick Counter') {
    if (['LWF', 'RWF', 'CF', 'SS'].includes(role)) return y - 5;
    if (role === 'DMF') return y + 3;
  }
  if (manager.primaryPlaystyle === 'Long Ball Counter') {
    if (['LB', 'RB', 'CB', 'DMF'].includes(role)) return y + 4;
    if (['CF', 'SS'].includes(role)) return y - 3;
  }
  if (manager.primaryPlaystyle === 'Out Wide') {
    if (['LWF', 'RWF', 'LMF', 'RMF', 'LB', 'RB'].includes(role)) return y - 3;
  }
  if (manager.primaryPlaystyle === 'Long Ball') {
    if (['CF'].includes(role)) return y - 4;
    if (['CMF', 'DMF'].includes(role)) return y + 2;
  }
  return y;
}

function spreadX(count: number, lineIndex: number, manager: EfootballManagerPreset): number[] {
  const narrow = manager.primaryPlaystyle === 'Quick Counter' || manager.primaryPlaystyle === 'Long Ball Counter';
  const wide = manager.primaryPlaystyle === 'Out Wide';
  if (count === 1) return [50];
  const min = wide ? 8 : narrow ? 26 : 18;
  const max = wide ? 92 : narrow ? 74 : 82;
  if (lineIndex === 0 && count === 4) return [15, 36, 64, 85];
  if (lineIndex === 0 && count === 5) return [9, 28, 50, 72, 91];
  return Array.from({ length: count }, (_, i) => min + ((max - min) / (count - 1)) * i);
}

export function buildEfootballManagerBoard(formation: string, opponentFormation: string, manager: EfootballManagerPreset): TacticalBoardState {
  const nums = parseFormationNumbers(formation || manager.bestFormations[0]);
  const totalLines = nums.length;
  const yLines = totalLines === 3 ? [70, 47, 18] : totalLines === 4 ? [72, 56, 37, 17] : [72, 58, 43, 29, 16];
  const own: TacticalPlayer[] = [{ id: 'home-gk', role: 'GK', name: '', x: 50, y: 88, isOpponent: false }];
  nums.forEach((count, lineIndex) => {
    const roles = rolesForLine(lineIndex, count, totalLines, manager);
    const xs = spreadX(count, lineIndex, manager);
    roles.forEach((role, i) => own.push({
      id: `home-${lineIndex}-${i}`,
      role,
      name: '',
      x: Math.max(5, Math.min(95, xs[i] ?? 50)),
      y: Math.max(6, Math.min(94, styleYAdjust(role, yLines[lineIndex] ?? 45, manager))),
      isOpponent: false
    }));
  });

  const opponentNums = parseFormationNumbers(opponentFormation || '4-2-3-1');
  const opponentTotal = opponentNums.length;
  const oppY = opponentTotal === 3 ? [30, 53, 82] : opponentTotal === 4 ? [28, 44, 63, 83] : [28, 42, 57, 71, 84];
  const opp: TacticalPlayer[] = [{ id: 'opp-gk', role: 'GK', name: '', x: 50, y: 12, isOpponent: true }];
  opponentNums.forEach((count, lineIndex) => {
    const roles = rolesForLine(lineIndex, count, opponentTotal, manager);
    const xs = spreadX(count, lineIndex, { ...manager, primaryPlaystyle: 'Possession Game' });
    roles.forEach((role, i) => opp.push({ id: `opp-${lineIndex}-${i}`, role, name: '', x: xs[i] ?? 50, y: oppY[lineIndex] ?? 55, isOpponent: true }));
  });

  return { players: [...own.slice(0, 11), ...opp.slice(0, 11)], teamColor: '#8b5cf6', opponentColor: '#ef4444' };
}

export function applyEfootballManagerToResult(input: GeneratorInput, result: any, gameId: string | undefined, lang: string): any {
  if (!isEfootballGame(gameId)) return result;
  const manager = getEfootballManager(input.efootballManagerId) || bestManagerForStyle(input.myStyle);
  const ar = lang === 'ar';
  return {
    ...result,
    formation: input.myFormation || manager.bestFormations[0],
    reason: ar
      ? `${result.reason} تمت إضافة محاكاة مدرب eFootball: ${manager.name} بأسلوب ${managerPlaystyleLabel(manager.primaryPlaystyle, lang)}، مع اختيار تمركز وتعليمات تناسب أفضل تشكيلاته.`
      : `${result.reason} eFootball manager simulation added: ${manager.name} with ${manager.primaryPlaystyle}, using positioning and instructions that fit his strongest formations.`,
    defensiveDetails: {
      ...result.defensiveDetails,
      ...buildEfootballManagerDetails(manager, lang)
    },
    attackingDetails: {
      ...result.attackingDetails,
      [ar ? 'أفضل ضد' : 'Best Against']: manager.bestAgainst.join(' / '),
      [ar ? 'احذر من' : 'Weak Against']: manager.weakAgainst.join(' / ')
    },
    playerInstructions: [
      ...buildEfootballManagerInstructions(manager, lang),
      ...result.playerInstructions
    ].slice(0, 12),
    mistakesToAvoid: [
      ...(ar
        ? [`لا تستخدم ${manager.name} خارج أسلوبه الأساسي بدون تعديل التمركز.`, 'لا ترفع الظهيرين معًا إلا إذا كان DMF ثابتًا.', 'لا تنسخ التشكيل فقط؛ راجع Playing Style لكل لاعب.']
        : [`Do not use ${manager.name} outside his primary playstyle without position adjustments.`, 'Do not push both fullbacks unless the DMF is anchored.', 'Do not copy the formation only; check every player Playing Style.']),
      ...result.mistakesToAvoid
    ].slice(0, 10),
    confidence: manager.confidence === 'High' ? '94%' : manager.confidence === 'Medium' ? '90%' : '86%'
  };
}
