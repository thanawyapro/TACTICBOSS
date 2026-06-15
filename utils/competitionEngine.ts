import { SupportedLang } from './lang';

export type CompetitionEventType =
  | 'generate_plan'
  | 'save_tactic'
  | 'rival_profile'
  | 'daily_challenge'
  | 'screenshot_analysis'
  | 'match_analysis'
  | 'share_card'
  | 'board_scan'
  | 'improve_tactic';

export type AiUsageKind = 'text_generation' | 'vision_analysis' | 'match_analysis' | 'coach_tip';

export interface CompetitionEvent {
  type: CompetitionEventType;
  points: number;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export interface DailyUsageState {
  date: string;
  textGenerations: number;
  visionAnalyses: number;
  matchAnalyses: number;
  coachTips: number;
}

export interface CoachCompetitionState {
  totalPoints: number;
  weeklyPoints: number;
  seasonPoints: number;
  weekKey: string;
  seasonKey: string;
  currentStreak: number;
  lastActiveDate: string;
  completedDailyChallengeDate?: string;
  badges: string[];
  events: CompetitionEvent[];
  usage: DailyUsageState;
}

const dateKey = (date = new Date()) => date.toISOString().slice(0, 10);
const weekKey = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};
const seasonKey = (date = new Date()) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

export const defaultUsageState = (): DailyUsageState => ({
  date: dateKey(),
  textGenerations: 0,
  visionAnalyses: 0,
  matchAnalyses: 0,
  coachTips: 0,
});

export const defaultCompetitionState = (): CoachCompetitionState => ({
  totalPoints: 0,
  weeklyPoints: 0,
  seasonPoints: 0,
  weekKey: weekKey(),
  seasonKey: seasonKey(),
  currentStreak: 1,
  lastActiveDate: dateKey(),
  badges: [],
  events: [],
  usage: defaultUsageState(),
});

export const normalizeCompetitionState = (state?: Partial<CoachCompetitionState> | null): CoachCompetitionState => {
  const base = defaultCompetitionState();
  const today = dateKey();
  const currentWeek = weekKey();
  const currentSeason = seasonKey();
  const usage = state?.usage?.date === today ? state.usage : defaultUsageState();
  return {
    ...base,
    ...state,
    weekKey: currentWeek,
    seasonKey: currentSeason,
    weeklyPoints: state?.weekKey === currentWeek ? Number(state?.weeklyPoints || 0) : 0,
    seasonPoints: state?.seasonKey === currentSeason ? Number(state?.seasonPoints || 0) : 0,
    currentStreak: Math.max(1, Number(state?.currentStreak || 1)),
    badges: Array.isArray(state?.badges) ? state!.badges!.slice(0, 30) : [],
    events: Array.isArray(state?.events) ? state!.events!.slice(0, 100) : [],
    usage,
  };
};

export const competitionReward = (type: CompetitionEventType) => ({
  generate_plan: 20,
  save_tactic: 30,
  rival_profile: 40,
  daily_challenge: 80,
  screenshot_analysis: 60,
  match_analysis: 70,
  share_card: 25,
  board_scan: 20,
  improve_tactic: 45,
}[type] || 10);

const dailyEventLimit = (type: CompetitionEventType) => ({
  generate_plan: 3,
  save_tactic: 5,
  rival_profile: 3,
  daily_challenge: 1,
  screenshot_analysis: 1,
  match_analysis: 1,
  share_card: 3,
  board_scan: 3,
  improve_tactic: 2,
}[type] || 3);

export function awardLocalCompetition(
  rawState: CoachCompetitionState,
  type: CompetitionEventType,
  meta: Record<string, unknown> = {},
) {
  const state = normalizeCompetitionState(rawState);
  const today = dateKey();
  const todayCount = state.events.filter((event) => event.type === type && event.createdAt.slice(0, 10) === today).length;
  if (todayCount >= dailyEventLimit(type)) return { state, gained: 0, capped: true };
  const yesterday = dateKey(new Date(Date.now() - 86400000));
  const currentStreak = state.lastActiveDate === today
    ? state.currentStreak
    : state.lastActiveDate === yesterday
      ? state.currentStreak + 1
      : 1;
  const points = competitionReward(type);
  const nextEvents = [{ type, points, createdAt: new Date().toISOString(), meta }, ...state.events].slice(0, 100);
  const next: CoachCompetitionState = addBadges({
    ...state,
    totalPoints: state.totalPoints + points,
    weeklyPoints: state.weeklyPoints + points,
    seasonPoints: state.seasonPoints + points,
    currentStreak,
    lastActiveDate: today,
    completedDailyChallengeDate: type === 'daily_challenge' ? today : state.completedDailyChallengeDate,
    events: nextEvents,
  });
  return { state: next, gained: points, capped: false };
}

function addBadges(state: CoachCompetitionState): CoachCompetitionState {
  const badges = new Set(state.badges || []);
  if (state.currentStreak >= 3) badges.add('streak-3');
  if (state.currentStreak >= 7) badges.add('streak-7');
  if (state.weeklyPoints >= 250) badges.add('weekly-250');
  if (state.seasonPoints >= 1000) badges.add('season-1000');
  if (state.events.some((event) => event.type === 'daily_challenge')) badges.add('daily-rival');
  if (state.events.some((event) => event.type === 'screenshot_analysis')) badges.add('vision-scout');
  if (state.events.some((event) => event.type === 'save_tactic')) badges.add('plan-keeper');
  return { ...state, badges: Array.from(badges).slice(0, 30) };
}

export const aiDailyCaps = (plan: string, kind: AiUsageKind) => {
  const elite = { text_generation: 60, vision_analysis: 20, match_analysis: 20, coach_tip: 60 };
  const pro = { text_generation: 15, vision_analysis: 5, match_analysis: 5, coach_tip: 20 };
  const free = { text_generation: 3, vision_analysis: 1, match_analysis: 1, coach_tip: 5 };
  const row = plan === 'elite' ? elite : plan === 'pro' ? pro : free;
  return row[kind];
};

export function canUseLocalAi(rawState: CoachCompetitionState, plan: string, kind: AiUsageKind) {
  const state = normalizeCompetitionState(rawState);
  const limit = aiDailyCaps(plan, kind);
  const used = kind === 'text_generation'
    ? state.usage.textGenerations
    : kind === 'vision_analysis'
      ? state.usage.visionAnalyses
      : kind === 'match_analysis'
        ? state.usage.matchAnalyses
        : state.usage.coachTips;
  return { ok: used < limit, used, limit, state };
}

export function consumeLocalAi(rawState: CoachCompetitionState, kind: AiUsageKind) {
  const state = normalizeCompetitionState(rawState);
  const usage = { ...state.usage };
  if (kind === 'text_generation') usage.textGenerations += 1;
  if (kind === 'vision_analysis') usage.visionAnalyses += 1;
  if (kind === 'match_analysis') usage.matchAnalyses += 1;
  if (kind === 'coach_tip') usage.coachTips += 1;
  return { ...state, usage };
}

export function coachRankTitle(points: number, lang: SupportedLang) {
  const t = (ar: string, en: string, es: string, fr: string) => ({ ar, en, es, fr }[lang]);
  if (points >= 3000) return t('أسطورة Tactic Boss', 'Tactic Boss Legend', 'Leyenda Tactic Boss', 'Légende Tactic Boss');
  if (points >= 1500) return t('سيد الميتا', 'Meta Master', 'Maestro meta', 'Maître méta');
  if (points >= 750) return t('خبير تكتيكي', 'Elite Tactician', 'Táctico élite', 'Tacticien élite');
  if (points >= 300) return t('محلل محترف', 'Pro Analyst', 'Analista pro', 'Analyste pro');
  if (points >= 100) return t('مدرب تكتيكي', 'Tactical Coach', 'Coach táctico', 'Coach tactique');
  return t('مدرب ناشئ', 'Rookie Coach', 'Coach novato', 'Coach débutant');
}

export function badgeLabel(id: string, lang: SupportedLang) {
  const t = (ar: string, en: string, es: string, fr: string) => ({ ar, en, es, fr }[lang]);
  const labels: Record<string, string> = {
    'streak-3': t('سلسلة 3 أيام', '3-day streak', 'Racha 3 días', 'Série 3 jours'),
    'streak-7': t('أسبوع تكتيكي كامل', 'Full tactical week', 'Semana táctica', 'Semaine tactique'),
    'weekly-250': t('منافس أسبوعي', 'Weekly contender', 'Competidor semanal', 'Compétiteur hebdo'),
    'season-1000': t('سيد الموسم', 'Season Master', 'Maestro temporada', 'Maître saison'),
    'daily-rival': t('قاهر خصم اليوم', 'Daily Rival Slayer', 'Cazador diario', 'Vainqueur du rival'),
    'vision-scout': t('كشاف الصور', 'Vision Scout', 'Scout visual', 'Scout vision'),
    'plan-keeper': t('حارس الخطط', 'Plan Keeper', 'Guardián de planes', 'Gardien des plans'),
  };
  return labels[id] || id;
}

export function localLeaderboard(coachName: string, state: CoachCompetitionState, lang: SupportedLang) {
  const t = (ar: string, en: string, es: string, fr: string) => ({ ar, en, es, fr }[lang]);
  return [
    { name: coachName || 'Tactic Boss', points: Math.max(120, state.weeklyPoints), badge: t('أنت', 'You', 'Tú', 'Vous'), isCurrentUser: true },
    { name: 'Meta Master', points: 1420, badge: t('سيد الميتا', 'Meta Master', 'Meta', 'Méta') },
    { name: 'Counter King', points: 1295, badge: t('قاهر الخصوم', 'Counter King', 'Contra', 'Contre') },
    { name: 'Possession Pro', points: 1180, badge: t('خبير استحواذ', 'Possession Pro', 'Posesión', 'Possession') },
  ].sort((a, b) => b.points - a.points).slice(0, 10);
}
