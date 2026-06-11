import { SupportedLang } from './lang';

export type FeatureUnlockId =
  | 'basic_tools'
  | 'daily_challenge'
  | 'daily_command_center'
  | 'board_ai_read'
  | 'advanced_board'
  | 'premium_share_card'
  | 'deep_weakness_report'
  | 'advanced_daily_rival'
  | 'weekly_tactical_report'
  | 'tactical_duel_basic'
  | 'coach_personality'
  | 'elite_coach_badge';

export interface FeatureUnlock {
  id: FeatureUnlockId;
  level: number;
  xp: number;
  tier: 'core' | 'retention' | 'board' | 'sharing' | 'competition' | 'coach';
  title: Record<SupportedLang, string>;
  description: Record<SupportedLang, string>;
}

const label = (ar: string, en: string, es: string, fr: string): Record<SupportedLang, string> => ({ ar, en, es, fr });

export const XP_LEVEL_THRESHOLDS: Array<{ level: number; xp: number }> = [
  { level: 1, xp: 0 },
  { level: 2, xp: 100 },
  { level: 3, xp: 250 },
  { level: 4, xp: 500 },
  { level: 5, xp: 850 },
  { level: 6, xp: 1300 },
  { level: 7, xp: 1900 },
  { level: 8, xp: 2600 },
  { level: 9, xp: 3500 },
  { level: 10, xp: 4500 },
  { level: 12, xp: 6500 },
  { level: 15, xp: 9000 },
  { level: 20, xp: 16000 },
];

export const FEATURE_UNLOCKS: FeatureUnlock[] = [
  {
    id: 'basic_tools',
    level: 1,
    xp: 0,
    tier: 'core',
    title: label('الأدوات الأساسية', 'Core tactical tools', 'Herramientas base', 'Outils essentiels'),
    description: label('ابنِ خطتي، اضرب خصمي، حفظ الخطط، وكارت مشاركة أساسي.', 'Build, counter, save tactics and use the basic share card.', 'Crear, contrarrestar y guardar tácticas.', 'Créer, contrer et sauvegarder des tactiques.'),
  },
  {
    id: 'daily_challenge',
    level: 2,
    xp: 100,
    tier: 'retention',
    title: label('تحدي اليوم', 'Daily challenge', 'Reto diario', 'Défi du jour'),
    description: label('افتح مهمة يومية تكسب XP وتزود السلسلة.', 'Unlock a daily mission that gives XP and streak progress.', 'Misión diaria con XP.', 'Mission quotidienne avec XP.'),
  },
  {
    id: 'daily_command_center',
    level: 3,
    xp: 250,
    tier: 'retention',
    title: label('مركز اليوم الكامل', 'Full daily command center', 'Centro diario completo', 'Centre quotidien complet'),
    description: label('الميتا، السلسلة، وتوصية اليوم تظهر كخطة رجوع يومية.', 'Meta, streak and daily recommendation become your daily loop.', 'Meta y racha diaria.', 'Méta et série quotidienne.'),
  },
  {
    id: 'board_ai_read',
    level: 4,
    xp: 500,
    tier: 'board',
    title: label('قراءة AI للسبورة', 'AI board scan', 'Lectura IA de pizarra', 'Lecture IA du tableau'),
    description: label('افتح زر تحليل السبورة داخل شاشة النتيجة.', 'Unlock the board analysis button inside results.', 'Análisis de la pizarra.', 'Analyse du tableau.'),
  },
  {
    id: 'advanced_board',
    level: 5,
    xp: 850,
    tier: 'board',
    title: label('سبورة متقدمة', 'Advanced tactical board', 'Pizarra avanzada', 'Tableau avancé'),
    description: label('إظهار الخصم على السبورة وتعديل العرض بين فريقك والخصم.', 'Show the rival board layer and switch tactical views.', 'Capa del rival.', 'Calque adversaire.'),
  },
  {
    id: 'premium_share_card',
    level: 6,
    xp: 1300,
    tier: 'sharing',
    title: label('كارت مشاركة فاخر', 'Premium share card', 'Tarjeta premium', 'Carte premium'),
    description: label('افتح شكل كارت مشاركة أنضف مع Badge التقدم.', 'Unlock a cleaner share card style with progression badge.', 'Tarjeta con insignia.', 'Carte avec badge.'),
  },
  {
    id: 'deep_weakness_report',
    level: 7,
    xp: 1900,
    tier: 'coach',
    title: label('تقرير نقاط الضعف', 'Weakness report', 'Informe de debilidades', 'Rapport des faiblesses'),
    description: label('تحليل أعمق لأخطر نقطة في خطتك.', 'Deeper explanation of the most dangerous tactical weakness.', 'Debilidad principal.', 'Faiblesse principale.'),
  },
  {
    id: 'advanced_daily_rival',
    level: 8,
    xp: 2600,
    tier: 'competition',
    title: label('خصم اليوم المتقدم', 'Advanced daily rival', 'Rival diario avanzado', 'Rival du jour avancé'),
    description: label('تحدي يومي أصعب مع تقييم أقوى ومكافأة أعلى.', 'A harder daily rival with stronger scoring and bigger reward.', 'Reto más difícil.', 'Défi plus difficile.'),
  },
  {
    id: 'weekly_tactical_report',
    level: 10,
    xp: 4500,
    tier: 'retention',
    title: label('تقرير أسبوعي', 'Weekly tactical report', 'Informe semanal', 'Rapport hebdo'),
    description: label('ملخص أسبوعي عن أسلوبك، خططك، ونقطة التطوير القادمة.', 'Weekly summary of your style, tactics and next improvement.', 'Resumen semanal.', 'Résumé hebdo.'),
  },
  {
    id: 'tactical_duel_basic',
    level: 12,
    xp: 6500,
    tier: 'competition',
    title: label('مواجهة تكتيكية', 'Tactical duel', 'Duelo táctico', 'Duel tactique'),
    description: label('قارن خطة ضد خطة واعرف من يتفوق تكتيكيًا.', 'Compare tactic vs tactic and see which one wins tactically.', 'Compara tácticas.', 'Comparer les tactiques.'),
  },
  {
    id: 'coach_personality',
    level: 15,
    xp: 9000,
    tier: 'coach',
    title: label('شخصية المدرب', 'Coach personality', 'Personalidad del coach', 'Personnalité du coach'),
    description: label('المدرب يبدأ يديك نصائح شخصية حسب عاداتك.', 'The coach starts giving personal advice based on habits.', 'Consejos personalizados.', 'Conseils personnalisés.'),
  },
  {
    id: 'elite_coach_badge',
    level: 20,
    xp: 16000,
    tier: 'competition',
    title: label('شارة المدرب النخبة', 'Elite coach badge', 'Insignia élite', 'Badge élite'),
    description: label('شارة خاصة تظهر في الدوري وكروت المشاركة.', 'A special badge shown in league and share cards.', 'Insignia especial.', 'Badge spécial.'),
  },
];

export function tacticalLevelFromXp(xp: number) {
  const value = Math.max(0, Number(xp || 0));
  let current = XP_LEVEL_THRESHOLDS[0];
  for (const row of XP_LEVEL_THRESHOLDS) {
    if (value >= row.xp) current = row;
  }
  const next = XP_LEVEL_THRESHOLDS.find(row => row.xp > value) || current;
  const denominator = Math.max(1, next.xp - current.xp);
  const progress = current === next ? 100 : Math.max(0, Math.min(100, Math.round(((value - current.xp) / denominator) * 100)));
  return {
    level: current.level,
    currentLevelXp: current.xp,
    nextLevel: next.level,
    nextLevelXp: next.xp,
    progress,
    xpToNext: Math.max(0, next.xp - value),
  };
}

export function unlockedFeatures(xp: number) {
  const value = Math.max(0, Number(xp || 0));
  return FEATURE_UNLOCKS.filter(item => value >= item.xp);
}

export function lockedFeatures(xp: number) {
  const value = Math.max(0, Number(xp || 0));
  return FEATURE_UNLOCKS.filter(item => value < item.xp);
}

export function canUseFeature(xp: number, id: FeatureUnlockId) {
  const feature = FEATURE_UNLOCKS.find(item => item.id === id);
  return !feature || Math.max(0, Number(xp || 0)) >= feature.xp;
}

export function featureUnlock(id: FeatureUnlockId) {
  return FEATURE_UNLOCKS.find(item => item.id === id);
}

export function nextFeatureUnlock(xp: number) {
  return lockedFeatures(xp).sort((a, b) => a.xp - b.xp)[0] || null;
}

export function featureUnlockMessage(xp: number, id: FeatureUnlockId, lang: SupportedLang) {
  const feature = featureUnlock(id);
  if (!feature) return '';
  const missing = Math.max(0, feature.xp - Math.max(0, Number(xp || 0)));
  const map = {
    ar: `تفتح عند Level ${feature.level} — باقي ${missing} XP`,
    en: `Unlocks at Level ${feature.level} — ${missing} XP left`,
    es: `Se abre en Nivel ${feature.level} — faltan ${missing} XP`,
    fr: `Débloqué au niveau ${feature.level} — ${missing} XP restants`,
  };
  return map[lang];
}

export function progressionSyncPayload(xp: number, lang: SupportedLang) {
  return unlockedFeatures(xp).map(item => ({
    feature_id: item.id,
    level_required: item.level,
    xp_required: item.xp,
    title: item.title[lang],
  }));
}
