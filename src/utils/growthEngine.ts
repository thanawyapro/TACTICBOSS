import { SavedTactic, Rival } from '../types';
import { SupportedLang } from './lang';

export type ActivityType = 'generate' | 'save' | 'rival' | 'improve' | 'daily_plan' | 'challenge' | 'match_analysis' | 'screenshot_analysis' | 'reward_ad' | 'redeem_generation_credit';

export interface ProgressionState {
  xp: number;
  streak: number;
  lastActiveDate: string;
  completedChallengeIds: string[];
  claimedDailyBonusDate?: string;
  activity: Array<{ type: ActivityType; xp: number; createdAt: string }>;
}

export interface RewardWallet {
  bossCoins: number;
  extraGenerationCredits: number;
  adRewardsClaimedToday: number;
  lastAdRewardDate: string;
  totalAdRewardsClaimed: number;
  events: Array<{ type: 'ad_reward' | 'redeem_generation' | 'consume_generation'; amount: number; createdAt: string }>;
}

export const REWARD_ECONOMY = {
  coinsPerRewardedAd: 25,
  coinsPerExtraGeneration: 100,
  freeDailyRewardedAds: 4,
  proDailyRewardedAds: 2,
  eliteDailyRewardedAds: 0,
  maxExtraGenerationsFromAdsPerDay: 1
};

export const defaultRewardWallet = (): RewardWallet => ({
  bossCoins: 0,
  extraGenerationCredits: 0,
  adRewardsClaimedToday: 0,
  lastAdRewardDate: dateKey(),
  totalAdRewardsClaimed: 0,
  events: []
});

const normalizeWalletDay = (wallet: RewardWallet): RewardWallet => {
  const today = dateKey();
  if (wallet.lastAdRewardDate === today) return wallet;
  return { ...wallet, adRewardsClaimedToday: 0, lastAdRewardDate: today };
};

export const rewardedAdDailyLimit = (plan: 'free' | 'pro' | 'elite' | string) => {
  if (plan === 'elite') return REWARD_ECONOMY.eliteDailyRewardedAds;
  if (plan === 'pro') return REWARD_ECONOMY.proDailyRewardedAds;
  return REWARD_ECONOMY.freeDailyRewardedAds;
};

export function claimRewardedAdCoins(wallet: RewardWallet, plan: 'free' | 'pro' | 'elite' | string) {
  const current = normalizeWalletDay(wallet);
  const limit = rewardedAdDailyLimit(plan);
  if (current.adRewardsClaimedToday >= limit) return { wallet: current, ok: false, reason: 'DAILY_AD_LIMIT_REACHED' as const };
  const next: RewardWallet = {
    ...current,
    bossCoins: current.bossCoins + REWARD_ECONOMY.coinsPerRewardedAd,
    adRewardsClaimedToday: current.adRewardsClaimedToday + 1,
    totalAdRewardsClaimed: current.totalAdRewardsClaimed + 1,
    events: [{ type: 'ad_reward' as const, amount: REWARD_ECONOMY.coinsPerRewardedAd, createdAt: new Date().toISOString() }, ...current.events].slice(0, 80)
  };
  return { wallet: next, ok: true, reason: null };
}

export function redeemCoinsForGeneration(wallet: RewardWallet) {
  const current = normalizeWalletDay(wallet);
  if (current.bossCoins < REWARD_ECONOMY.coinsPerExtraGeneration) return { wallet: current, ok: false, reason: 'NOT_ENOUGH_COINS' as const };
  const next: RewardWallet = {
    ...current,
    bossCoins: current.bossCoins - REWARD_ECONOMY.coinsPerExtraGeneration,
    extraGenerationCredits: current.extraGenerationCredits + 1,
    events: [{ type: 'redeem_generation' as const, amount: -REWARD_ECONOMY.coinsPerExtraGeneration, createdAt: new Date().toISOString() }, ...current.events].slice(0, 80)
  };
  return { wallet: next, ok: true, reason: null };
}

export function consumeExtraGenerationCredit(wallet: RewardWallet) {
  const current = normalizeWalletDay(wallet);
  if (current.extraGenerationCredits <= 0) return { wallet: current, ok: false, reason: 'NO_GENERATION_CREDIT' as const };
  const next: RewardWallet = {
    ...current,
    extraGenerationCredits: current.extraGenerationCredits - 1,
    events: [{ type: 'consume_generation' as const, amount: -1, createdAt: new Date().toISOString() }, ...current.events].slice(0, 80)
  };
  return { wallet: next, ok: true, reason: null };
}

export interface LevelInfo {
  level: number;
  title: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  xp: number;
  tier: 'easy' | 'medium' | 'hard';
  action: ActivityType;
}

export interface MetaItem {
  formation: string;
  playstyle: string;
  counter: string;
  score: number;
  trend: number;
  label: string;
  tier?: 'free' | 'pro' | 'elite';
  manager?: string;
  playerProfiles?: string[];
  individualInstructions?: string[];
  advancedAdjustments?: string[];
  whyItWorks?: string;
  weakness?: string;
  boardPreview?: string;
}


const dateKey = (date = new Date()) => date.toISOString().slice(0, 10);
const dayNumber = () => Math.floor(Date.now() / 86400000);

export const defaultProgression = (): ProgressionState => ({
  xp: 0,
  streak: 1,
  lastActiveDate: dateKey(),
  completedChallengeIds: [],
  activity: []
});

const titleByLevel = (level: number, lang: SupportedLang) => {
  const rows = [
    { min: 50, ar: 'العقل التكتيكي', en: 'Tactical Mastermind', es: 'Mente Táctica', fr: 'Maître Tacticien' },
    { min: 25, ar: 'مدرب نخبة', en: 'Elite Coach', es: 'Entrenador Élite', fr: 'Coach Élite' },
    { min: 10, ar: 'مدير تكتيكي', en: 'Tactical Manager', es: 'Mánager Táctico', fr: 'Manager Tactique' },
    { min: 1, ar: 'مبتدئ تكتيكي', en: 'Tactical Rookie', es: 'Novato Táctico', fr: 'Débutant Tactique' }
  ];
  const row = rows.find(item => level >= item.min) || rows[rows.length - 1];
  return row[lang];
};

export function levelInfo(xp: number, lang: SupportedLang): LevelInfo {
  const level = Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 60)) + 1);
  const currentLevelXp = Math.pow(level - 1, 2) * 60;
  const nextLevelXp = Math.pow(level, 2) * 60;
  const progress = Math.max(0, Math.min(100, Math.round(((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)));
  return { level, title: titleByLevel(level, lang), currentLevelXp, nextLevelXp, progress };
}

export const xpReward: Record<ActivityType, number> = {
  generate: 25,
  save: 15,
  rival: 35,
  improve: 40,
  daily_plan: 30,
  challenge: 50,
  match_analysis: 50,
  screenshot_analysis: 35,
  reward_ad: 2,
  redeem_generation_credit: 0
};

export function addXp(state: ProgressionState, type: ActivityType, customXp?: number): ProgressionState {
  const today = dateKey();
  const yesterday = dateKey(new Date(Date.now() - 86400000));
  const streak = state.lastActiveDate === today ? state.streak : state.lastActiveDate === yesterday ? state.streak + 1 : 1;
  const reward = customXp ?? xpReward[type];
  return {
    ...state,
    xp: state.xp + reward,
    streak,
    lastActiveDate: today,
    activity: [{ type, xp: reward, createdAt: new Date().toISOString() }, ...state.activity].slice(0, 100)
  };
}

export function dailyChallenges(lang: SupportedLang): DailyChallenge[] {
  const d = dayNumber();
  const text = (ar: string, en: string, es: string, fr: string) => ({ ar, en, es, fr }[lang]);
  const pool: DailyChallenge[] = [
    { id: `daily-counter-${d}`, title: text('تحدي اليوم: اضرب خصم AI','Daily challenge: counter an AI rival','Reto diario: contrarresta rival','Défi du jour : contrer un rival'), description: text('افتح اضرب خصمك واختر مشكلة اليوم لتحصل على Rescue Card قابل للمشاركة.', 'Open AI Counter Rescue and solve today’s rival problem with a shareable Rescue Card.', 'Abre Counter Rescue.', 'Ouvrez Counter Rescue.'), xp: 60, tier: 'hard', action: 'rival' },
    { id: `live-rescue-${d}`, title: text('إنقاذ مباشر في دقيقة','One-minute live rescue','Rescate en un minuto','Sauvetage en une minute'), description: text('استخدم Live Match Rescue لموقف سريع: متأخر، ضغط، أو دفاع متأخر.', 'Use Live Match Rescue for one fast scenario: trailing, pressure or low block.', 'Usa rescate en vivo.', 'Utilisez sauvetage live.'), xp: 45, tier: 'medium', action: 'generate' },
    { id: `build-own-${d}`, title: text('ابنِ خطتك بالـ AI','Build your tactic with AI','Crea tu táctica con IA','Créez votre tactique avec IA'), description: text('استخدم مسار Build My Tactic لاختيار أفضل/آمن/كرييتڤ.', 'Use Build My Tactic to choose Best/Safe/Creative.', 'Usa Build My Tactic.', 'Utilisez Build My Tactic.'), xp: 35, tier: 'easy', action: 'generate' },
    { id: `board-fix-${d}`, title: text('افحص السبورة بالـ AI','AI board scan','Escaneo IA de pizarra','Scan IA du tableau'), description: text('راجع قراءة السبورة ونقطة الضعف قبل حفظ الخطة.', 'Review the board scan and weak point before saving.', 'Revisa pizarra.', 'Vérifiez le tableau.'), xp: 35, tier: 'medium', action: 'improve' },
    { id: `share-rescue-${d}`, title: text('شارك Rescue Card','Share a Rescue Card','Comparte tarjeta','Partagez une carte'), description: text('شارك خطة مضادة أو احفظها للرجوع قبل المباراة.', 'Share or save a counter plan before the match.', 'Comparte o guarda.', 'Partagez ou sauvegardez.'), xp: 30, tier: 'easy', action: 'save' }
  ];
  const start = d % pool.length;
  return [pool[start], pool[(start + 1) % pool.length], pool[(start + 2) % pool.length]];
}

export function challengeCompleted(challenge: DailyChallenge, state: ProgressionState): boolean {
  return state.completedChallengeIds.includes(challenge.id);
}

export function completeMatchingChallenges(state: ProgressionState, action: ActivityType, challenges: DailyChallenge[]): ProgressionState {
  let next = state;
  challenges.filter(c => c.action === action && !next.completedChallengeIds.includes(c.id)).forEach(challenge => {
    next = addXp(next, 'challenge', challenge.xp);
    next = { ...next, completedChallengeIds: [...next.completedChallengeIds, challenge.id] };
  });
  return next;
}

export function buildMetaCenter(gameId: string, saved: SavedTactic[]): MetaItem[] {
  const byGame = saved.filter(item => item.game.toLowerCase().includes(gameId.replace(/-/g, ' ').split(' ')[0].toLowerCase()));
  const personalCounts = byGame.reduce<Record<string, number>>((acc, item) => {
    acc[item.result.formation] = (acc[item.result.formation] || 0) + 1;
    return acc;
  }, {});
  type Row = Omit<MetaItem, 'label'> & { label?: string };
  const rows: Record<string, Row[]> = {
    efootball: [
      { tier:'free', formation:'4-2-3-1', playstyle:'Possession Game', manager:'Guardiola / Luis A. Roman style', counter:'4-4-2 compact + fast wing outlet', score:92, trend:11, playerProfiles:['CB: Build Up + Destroyer','DMF: Anchor Man أو Orchestrator','AMF: Hole Player','CF: Goal Poacher'], individualInstructions:['Defensive على DMF','Counter Target على CF عند التقدم','Anchoring للـAMF لو الخصم يضغط'], advancedAdjustments:['ظهير واحد فقط يتقدم','CMF قريب من DMF في البناء','الجناح العكسي يدخل نصف المساحة'], whyItWorks:'يعطي مثلثات تمرير آمنة ويستغل Hole Player بين الخطوط.', weakness:'يتعب ضد Long Ball Counter لو تقدم الظهيران معًا.', boardPreview:'2-3 build-up → AMF between lines → CF attack box' },
      { tier:'pro', formation:'3-4-2-1', playstyle:'Out Wide / Quick Counter hybrid', manager:'Xabi Alonso / Amorim style', counter:'4-2-3-1 with wide AMF press', score:90, trend:8, playerProfiles:['CB: Build Up في الوسط','WB: Offensive Full-back','DMF: Destroyer + Orchestrator','SS: Hole Player','CF: Deep-Lying Forward'], individualInstructions:['Deep Line على أحد DMF','Defensive على الظهير العكسي','Counter Target على CF'], advancedAdjustments:['لا ترفع الجناحين معًا','حافظ على 3 لاعبين خلف الكرة','SS قريب من CF'], whyItWorks:'ينقل الملعب بسرعة من 3 خلفية إلى 5 مهاجمين بدون فقدان الحماية.', weakness:'يضعف إذا ضغط الخصم على الـoutside CBs.', boardPreview:'3-2 rest defence → wingback width → SS half-space overload' },
      { tier:'elite', formation:'4-3-1-2', playstyle:'Quick Counter', manager:'Klopp / Zeitzler style', counter:'5-3-2 low block', score:94, trend:13, playerProfiles:['CB: Destroyer + Build Up','DMF: Anchor Man','CMF: Box-to-Box','AMF: Creative Playmaker أو Hole Player','CF: Goal Poacher + SS'], individualInstructions:['Tight Marking على صانع اللعب','Counter Target على أسرع مهاجم','Defensive على LB/RB حسب جهة الخصم'], advancedAdjustments:['AMF لا يهبط كثيرًا','CMF يغطي خلف الظهير','الضغط يبدأ من SS'], whyItWorks:'يضرب العمق بسرعة ويمنع الخصم من البناء الهادئ.', weakness:'لو فشل الضغط الأول، تظهر مساحة خلف CMF.', boardPreview:'narrow press trap → fast AMF outlet → two-striker finish' }
    ],
    ea: [
      { tier:'free', formation:'4-2-3-1', playstyle:'FC IQ Balanced', manager:'Role-balanced coach', counter:'4-4-2 compact press', score:93, trend:9, playerProfiles:['GK: Goalkeeper / Ball-Playing if safe','CB: Defender + Ball-Playing Defender','CDM: Holding','CAM: Playmaker','ST: Advanced Forward'], individualInstructions:['Line Height 45–55','Fullback على جهة واحدة فقط يتقدم','CAM Playmaker focus'], advancedAdjustments:['Holding يبقى أمام CBs','Wide player واحد Inside Forward','لا تضع Focus هجومي لكل الأدوار'], whyItWorks:'متوافق مع FC IQ لأنه يوازن الأدوار بدل نسخ رقم تشكيل فقط.', weakness:'يقل إذا كانت Role Familiarity ضعيفة.', boardPreview:'Holding base → Playmaker pocket → Advanced Forward run' },
      { tier:'pro', formation:'4-3-2-1', playstyle:'Role-led Direct Passing', manager:'FC IQ vertical coach', counter:'4-2-3-1 wide', score:91, trend:7, playerProfiles:['CM: Holding + Box-to-Box + Playmaker','LF/RF: Inside Forward','ST: Advanced Forward','FB: Fullback + Wingback'], individualInstructions:['Box-to-Box يغطي عند فقد الكرة','Inside Forward يهاجم نصف المساحة','Fullback العكسي Stay Back'], advancedAdjustments:['لا ترفع الظهيرين معًا','ثبّت لاعب Holding','استخدم Smart Tactics حسب حالة المباراة'], whyItWorks:'يخلق 3 لاعبين بين الخطوط مع حماية محور واحدة.', weakness:'الأطراف قد تصبح مكشوفة إذا تحول الخصم بسرعة.', boardPreview:'narrow front three → late CM support → protected rest defence' },
      { tier:'elite', formation:'4-3-3', playstyle:'High Press / Smart Tactics', manager:'Elite FC IQ press', counter:'4-2-3-1 counter', score:95, trend:12, playerProfiles:['GK: Ball-Playing Keeper','CB: Ball-Playing + Defender','CM: Box Crasher / Playmaker','W: Inside Forward + Winger','ST: Advanced Forward'], individualInstructions:['Press only in triggers','One CM attacks box late','Wide Back/Inverted side حسب FC 26'], advancedAdjustments:['Smart Tactic للضغط بعد فقد الكرة','حافظ على Rest Defence 2+1','لا تجعل Box Crasher وFullback يتقدمان بنفس الجهة'], whyItWorks:'يستغل أحدث FC IQ roles ويعطي انتقالات أقوى.', weakness:'يحتاج لاعبين مناسبين للأدوار وليس مجرد Overall عالي.', boardPreview:'2+1 rest defence → press trigger → box crasher arrival' }
    ],
    fifa: [
      { tier:'free', formation:'4-2-3-1', playstyle:'Balanced / Direct Passing', counter:'4-4-2 press', score:88, trend:5, playerProfiles:['CDM: Stay Back + Cover Center','CAM: Free Roam بحذر','ST: Get In Behind','Fullbacks: Stay Back'], individualInstructions:['Depth متوسط','عرض 45–50','لا تسحب CB يدويًا'], advancedAdjustments:['استخدم تمريرة آمنة قبل Direct Pass','غيّر الإيقاع بعد الدقيقة 60','قلل الاندفاع عند التقدم'], whyItWorks:'أكثر أمانًا عبر أجيال FIFA القديمة والمتوسطة.', weakness:'قد يفتقد العرض ضد دفاع منخفض.', boardPreview:'double pivot cover → CAM link → ST run' },
      { tier:'pro', formation:'4-3-2-1', playstyle:'Direct Passing / AcceleRATE aware', counter:'4-2-3-1 wide', score:87, trend:4, playerProfiles:['CF side runners','CM cover center','Fast recovery CB','One attacking fullback'], individualInstructions:['ثبّت ظهيرًا واحدًا','استغل اللاعب السريع في القناة','لا تبالغ في through balls'], advancedAdjustments:['الجناح الداخلي يدخل للعمق','CM يغطي الظهير','Depth حسب سرعة الدفاع'], whyItWorks:'يناسب FIFA 23/22 عندما تكون السرعة وتوقيت التمريرة مهمة.', weakness:'يتأثر ضد ضغط الأطراف المتكرر.', boardPreview:'narrow front → side channel run → CM cover' },
      { tier:'elite', formation:'4-4-2', playstyle:'Compact balanced meta', counter:'4-3-3 possession', score:86, trend:-1, playerProfiles:['ST: Target + Runner','Wide Midfielder support','CDM/CM Cover Center','Fullbacks conservative'], individualInstructions:['Wide mids يرجعوا دفاعيًا','مهاجم يستلم ومهاجم يركض','ضغط متقطع فقط'], advancedAdjustments:['استدرج الخصم للوسط','بدّل اللعب للطرف','لا تفتح الخطوط'], whyItWorks:'سهل التطبيق ويقلل أخطاء الدفاع اليدوي.', weakness:'ليس الأفضل أمام لاعب يجيد الاستحواذ الهادئ.', boardPreview:'two banks of four → outlet striker → wide switch' }
    ],
    pes: [
      { tier:'free', formation:'4-3-1-2', playstyle:'Short Pass / Flexible', counter:'4-4-2 compact', score:89, trend:6, playerProfiles:['DMF: Anchor Man','AMF: Hole Player','CF: Goal Poacher','CB: Build Up'], individualInstructions:['Advanced Instruction: Defensive on DMF','Counter Target on CF','Fullbacks conservative'], advancedAdjustments:['حافظ على Team Spirit','لا تفتح المسافة بين CMF وDMF','AMF قريب من الثنائي'], whyItWorks:'يناسب PES بتمرير قصير واتصال قوي بين الخطوط.', weakness:'العرض محدود إذا واجهت 5 دفاع.', boardPreview:'diamond midfield → AMF pocket → two CF combinations' },
      { tier:'pro', formation:'4-2-3-1', playstyle:'Possession / Counter Control', counter:'4-3-2-1', score:86, trend:3, playerProfiles:['DMF: Destroyer + Orchestrator','AMF: Classic No.10','W: Prolific Winger','CF: Fox in the Box'], individualInstructions:['Tight Marking on AMF','Defensive fullback side','Counter Target late'], advancedAdjustments:['لا ترفع الـAMF أكثر من اللازم','استخدم الأطراف وقت الزحام','حافظ على compactness'], whyItWorks:'يعطي تحكمًا واضحًا في الرتم وتحولات آمنة.', weakness:'قد يكون بطيئًا ضد ضغط عالي.', boardPreview:'double pivot → AMF tempo → winger isolation' },
      { tier:'elite', formation:'3-5-2', playstyle:'Wide Attack / Advanced Instructions', counter:'4-3-3 press', score:87, trend:5, playerProfiles:['CB: Extra Frontman + Build Up','WB: Cross Specialist','DMF: Anchor Man','SS: Creative Playmaker','CF: Target Man'], individualInstructions:['Attacking fullbacks situational','Deep defensive line if leading','Man mark winger'], advancedAdjustments:['Wingbacks لا يصعدان معًا','DMF يبقى بين CBs','SS يستلم بين الخطوط'], whyItWorks:'يستخدم عرض الملعب بدون خسارة قلب الدفاع.', weakness:'الأطراف خلف الWingback أخطر نقطة.', boardPreview:'back three → wingback width → SS/CF box attack' }
    ]
  };
  const key = gameId.startsWith('pes') ? 'pes' : gameId.startsWith('efootball') ? 'efootball' : gameId.startsWith('fifa') ? 'fifa' : 'ea';
  return rows[key].map((item) => ({
    ...item,
    score: Math.min(99, item.score + Math.min(4, personalCounts[item.formation] || 0)),
    label: personalCounts[item.formation] ? 'Personal + Verified Meta' : 'Ready Daily Meta Plan'
  }));
}

export function weeklySummary(saved: SavedTactic[], rivals: Rival[], progression: ProgressionState, lang: SupportedLang) {
  const text = (ar: string, en: string, es: string, fr: string) => ({ ar, en, es, fr }[lang]);
  const formations = saved.reduce<Record<string, number>>((acc, item) => { acc[item.result.formation] = (acc[item.result.formation] || 0) + 1; return acc; }, {});
  const favorite = Object.entries(formations).sort((a,b) => b[1] - a[1])[0]?.[0] || '—';
  return {
    title: text('تقريرك التكتيكي الأسبوعي','Your weekly tactical report','Tu informe táctico semanal','Votre rapport tactique hebdomadaire'),
    stats: [
      { label: text('الخطط المحفوظة','Saved tactics','Tácticas guardadas','Tactiques enregistrées'), value: saved.length },
      { label: text('الخصوم تحت الرصد','Rivals scouted','Rivales analizados','Rivaux analysés'), value: rivals.length },
      { label: text('أكثر تشكيل استخدامًا','Most-used formation','Formación más usada','Formation la plus utilisée'), value: favorite },
      { label: text('سلسلة الأيام','Day streak','Racha diaria','Série quotidienne'), value: `${progression.streak}` }
    ]
  };
}
