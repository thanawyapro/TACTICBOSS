import { GameItem } from './gameData';
import { TacticResult } from '../types';
import { applyEfootballManagerToResult } from './efootballManagerEngine';
import { officialDnaForGame, officialDnaSummary } from './officialGameDNA';
import { compactEfootballProfiles, efootballProfileLines } from './efootballPlayerProfiles';
import { generatePESTactic } from './engines/pesEngine';
import { generateEfootballTactic } from './engines/efootballEngine';
import { generateFCTactic } from './engines/fcEngine';

export interface GeneratorInput {
  myFormation: string;
  oppFormation: string;
  opponentStyle: string;
  myStyle: string;
  matchState: string;
  myTeam: string;
  oppTeam: string;
  notes: string;
  efootballManagerId?: string;
}

type GameProfile = {
  formation: string;
  identityAr: string;
  identityEn: string;
  defensiveStyle: string;
  defensiveDetails: Record<string, string>;
  attackingStyle: string;
  attackingDetails: Record<string, string>;
  instructions: string[];
  mistakes: string[];
};

const profiles: Record<string, GameProfile> = {
  'pes-2019': {
    formation: '4-3-1-2',
    identityAr: 'PES 2019 يكافئ زوايا التمرير، تماسك الخطوط، واللعب المباشر المنظم أكثر من الضغط العشوائي.',
    identityEn: 'PES 2019 rewards passing angles, compact lines and organized direct play more than random pressure.',
    defensiveStyle: 'All-out Defence / Conservative',
    defensiveDetails: { 'Containment Area': 'Middle', 'Pressuring': 'Conservative', 'Defensive Line': '4', 'Compactness': '8' },
    attackingStyle: 'Possession Game / Short Pass',
    attackingDetails: { 'Build Up': 'Short-pass', 'Attacking Area': 'Centre', 'Positioning': 'Flexible', 'Support Range': '5', 'Advanced Instructions': 'Anchoring + Defensive' },
    instructions: ['ثبّت لاعب ارتكاز أمام قلبي الدفاع.', 'استخدم صانع اللعب بين الخطوط بدل الجري المستمر.', 'خلّي مهاجم واحد يستلم والثاني يهاجم المساحة.'],
    mistakes: ['رفع الخط الدفاعي زيادة أمام مهاجم سريع.', 'الضغط بقلب الدفاع وترك العمق.', 'التمرير من لمسة واحدة بدون زاوية واضحة.']
  },
  'pes-2020': {
    formation: '4-2-3-1',
    identityAr: 'PES 2020 أبطأ نسبيًا ويحتاج خروجًا هادئًا من الضغط مع استخدام Finesse Dribble في المناطق الآمنة.',
    identityEn: 'PES 2020 is relatively slower and needs calm build-up plus safe use of Finesse Dribble.',
    defensiveStyle: 'All-out Defence / Aggressive',
    defensiveDetails: { 'Containment Area': 'Middle', 'Pressuring': 'Aggressive', 'Defensive Line': '4', 'Compactness': '8' },
    attackingStyle: 'Possession Game / Short Pass',
    attackingDetails: { 'Build Up': 'Short-pass', 'Attacking Area': 'Wide', 'Positioning': 'Flexible', 'Support Range': '6', 'Advanced Instructions': 'Tiki-Taka + Anchoring' },
    instructions: ['استخدم Finesse Dribble للخروج من الضغط وليس أمام منطقة جزائك.', 'ثبّت أحد لاعبي الارتكاز.', 'بدّل اللعب للطرف العكسي عند ضغط الخصم.'],
    mistakes: ['المراوغة قرب المرمى.', 'اندفاع الظهيرين معًا.', 'تغيير المدافع متأخرًا أثناء التحول.']
  },
  'pes-2021': {
    formation: '4-3-1-2',
    identityAr: 'PES 2021 يعتمد بقوة على Team Spirit، تعليمات المدرب، Compactness، وAdvanced Instructions.',
    identityEn: 'PES 2021 strongly depends on Team Spirit, manager instructions, Compactness and Advanced Instructions.',
    defensiveStyle: 'All-out Defence / Aggressive',
    defensiveDetails: { 'Containment Area': 'Middle', 'Pressuring': 'Aggressive', 'Defensive Line': '5', 'Compactness': '9' },
    attackingStyle: 'Counter Attack / Short Pass',
    attackingDetails: { 'Build Up': 'Short-pass', 'Attacking Area': 'Centre', 'Positioning': 'Flexible', 'Support Range': '5', 'Advanced Instructions': 'Anchoring + Counter Target' },
    instructions: ['ارفع Team Spirit قبل تغيير الخطة جذريًا.', 'ضع Counter Target على أخطر مهاجم.', 'خلّي الارتكاز Anchoring ولا تسحبه بعيدًا.'],
    mistakes: ['استخدام تعليمات متقدمة متعارضة.', 'فتح Compactness ضد لعب العمق.', 'رفع Defensive Line أمام مهاجمين سريعين.']
  },
  'efootball-modern': {
    formation: '4-2-1-3',
    identityAr: 'eFootball الحديثة ليست إصدارات سنوية منفصلة؛ هي Live Service يعتمد على Team Playstyle، المدرب، الأدوار الفردية، وتوازن Rest Defence.',
    identityEn: 'Modern eFootball is not separate yearly editions; it is a live-service game built around Team Playstyle, manager fit, individual instructions and rest-defence balance.',
    defensiveStyle: 'Style-aware compact block',
    defensiveDetails: { 'Team Playstyle': 'Quick Counter / Possession / Long Ball Counter / Out Wide / Long Ball', 'Rest Defence': '2 CB + DMF minimum', 'Individual Defence 1': 'Deep Line on DMF when protecting lead or facing pace', 'Individual Defence 2': 'Defensive on one fullback only' },
    attackingStyle: 'Team Playstyle-led attack',
    attackingDetails: { 'Quick Counter': 'vertical 4-2-1-3 with fixed DMF', 'Possession': 'short triangles + Orchestrator', 'Long Ball Counter': 'compact block + direct release', 'Out Wide': 'wide overload + weak-side cover', 'Long Ball': 'target outlet + second-ball midfield' },
    instructions: ['اختار Team Playstyle قبل التشكيلة.', 'ثبّت DMF أو ظهير دفاعي لحماية المرتدة.', 'استخدم 2 Attack + 2 Defence Instructions فقط عند الحاجة ولا تخلط المتعارض.', 'غيّر الخطة حسب Mobile/Console كإحساس لعب لا كسنة مختلفة.'],
    mistakes: ['اعتبار eFootball 2022-2026 ألعابًا منفصلة.', 'نسخ إعداد PES الرقمية داخل eFootball الحديثة.', 'رفع الظهيرين معًا بدون تغطية.', 'اختيار مدرب لا يناسب Playstyle.']
  },
  'efootball-2022': {
    formation: '4-2-3-1',
    identityAr: 'eFootball 2022 إصدار انتقالي؛ اللعب البسيط، التغطية، وقلة المخاطرة أهم من التركيبات المعقدة.',
    identityEn: 'eFootball 2022 is transitional; simple play, cover and low-risk decisions are essential.',
    defensiveStyle: 'Long Ball Counter / Medium Block',
    defensiveDetails: { 'Team Playstyle': 'Long Ball Counter', 'Defensive Line': 'Medium-Low', 'Compactness': 'High', 'Individual Instructions': 'Defensive on one fullback' },
    attackingStyle: 'Long Ball Counter',
    attackingDetails: { 'Team Playstyle': 'Long Ball Counter', 'Build Up Focus': 'Safe first pass', 'Attacking Area': 'Mixed', 'Support': 'Keep midfield triangle' },
    instructions: ['ثبّت ظهيرًا واحدًا.', 'اخرج بتمريرة آمنة قبل التسريع.', 'لا تترك قلب الدفاع في مواجهة فردية.'],
    mistakes: ['الضغط المستمر بلا تغطية.', 'تمريرات مخاطرة في العمق الدفاعي.', 'توسيع الفريق أكثر من اللازم.']
  },
  'efootball-2023': {
    formation: '4-2-1-3',
    identityAr: 'eFootball 2023 قوي في Quick Counter والتمرير البيني اليدوي مع أهمية تغطية العمق.',
    identityEn: 'eFootball 2023 favors Quick Counter and manual through passes while protecting central space.',
    defensiveStyle: 'Quick Counter / Front Pressure',
    defensiveDetails: { 'Team Playstyle': 'Quick Counter', 'Defensive Line': 'Medium', 'Compactness': 'High', 'Individual Instructions': 'Deep Line on DMF when needed' },
    attackingStyle: 'Quick Counter',
    attackingDetails: { 'Team Playstyle': 'Quick Counter', 'Build Up Focus': 'Vertical', 'Attacking Area': 'Centre to Wide', 'Player Playstyles': 'Goal Poacher + Hole Player' },
    instructions: ['استخدم Hole Player خلف المهاجم.', 'اربط الارتكاز بالخط الخلفي.', 'مرّر بينيًا بعد جذب لاعب الوسط.'],
    mistakes: ['تمرير بيني مبكر بلا حركة.', 'ترك العمق بعد فقد الكرة.', 'ضغط ثنائي يفتح الطرف العكسي.']
  },
  'efootball-2024': {
    formation: '4-2-3-1',
    identityAr: 'eFootball 2024 مرن في التحولات ويحتاج اختيار Team Playstyle مناسب لخصائص اللاعبين.',
    identityEn: 'eFootball 2024 is transition-heavy and requires a Team Playstyle that matches player profiles.',
    defensiveStyle: 'Quick Counter / Organized Press',
    defensiveDetails: { 'Team Playstyle': 'Quick Counter', 'Defensive Line': 'Medium', 'Compactness': 'High', 'Individual Instructions': 'Defensive fullback + Deep Line DMF' },
    attackingStyle: 'Quick Counter / Possession Hybrid',
    attackingDetails: { 'Team Playstyle': 'Quick Counter', 'Build Up Focus': 'One-two combinations', 'Attacking Area': 'Wide then inside', 'Player Playstyles': 'Prolific Winger + Hole Player' },
    instructions: ['استخدم جناحًا يثبت العرض وآخر يدخل للعمق.', 'فعّل Deep Line عند حماية التقدم.', 'غيّر الإيقاع بدل اللعب بسرعة واحدة.'],
    mistakes: ['اختيار Playstyle لا يناسب التشكيلة.', 'رفع الخط أمام السرعة.', 'الضغط المستمر مع لياقة منخفضة.']
  },
  'efootball-2025': {
    formation: '4-2-1-3',
    identityAr: 'eFootball 2025 سريع في التحولات؛ Quick Counter فعال لكن يحتاج ارتكازًا ثابتًا وتغطية الأظهرة.',
    identityEn: 'eFootball 2025 is fast in transition; Quick Counter works best with an anchored midfielder and covered fullbacks.',
    defensiveStyle: 'Quick Counter / Compact Press',
    defensiveDetails: { 'Team Playstyle': 'Quick Counter', 'Defensive Line': 'Medium', 'Compactness': 'Very High', 'Individual Instructions': 'Defensive on weak-side fullback' },
    attackingStyle: 'Quick Counter',
    attackingDetails: { 'Team Playstyle': 'Quick Counter', 'Build Up Focus': 'Fast vertical combinations', 'Attacking Area': 'Half-spaces', 'Player Playstyles': 'Goal Poacher + Creative Playmaker' },
    instructions: ['ثبّت الارتكاز كحارس للمساحة.', 'هاجم نصف المساحة بدل الجناح فقط.', 'احفظ تمريرة أمان عند فشل المرتدة.'],
    mistakes: ['إرسال الظهيرين معًا.', 'استمرار الاندفاع بعد ضياع المرتدة.', 'استخدام مهاجم لا يناسب Quick Counter.']
  },
  'efootball-2026': {
    formation: '4-2-3-1',
    identityAr: 'eFootball 2026 يعتمد على Playstyle DNA وتوازن الأدوار؛ لا تغيّر أسلوب الفريق بدون لاعبين مناسبين.',
    identityEn: 'eFootball 2026 relies on Playstyle DNA and role balance; avoid switching styles without suitable players.',
    defensiveStyle: 'Balanced Playstyle / Compact Block',
    defensiveDetails: { 'Team Playstyle': 'Quick Counter or Possession by squad', 'Defensive Line': 'Medium', 'Compactness': 'High', 'Individual Instructions': 'Role-based cover' },
    attackingStyle: 'Playstyle-led Build Up',
    attackingDetails: { 'Team Playstyle': 'Match squad DNA', 'Build Up Focus': 'Role-led', 'Attacking Area': 'Adaptive', 'Player Playstyles': 'Balanced combinations' },
    instructions: ['ابنِ الخطة حول أدوار اللاعبين الأساسيين.', 'احفظ توازنًا بين صانع اللعب والعدّاء.', 'استخدم تعليمات فردية محدودة وواضحة.'],
    mistakes: ['خلط Playstyles متعارضة.', 'تغيير الخطة بلا سبب.', 'إهمال التغطية أثناء التحول.']
  },
  'fifa-19': {
    formation: '4-2-3-1',
    identityAr: 'FIFA 19 يعتمد على Dynamic Tactics وTimed Finishing، لذلك تحتاج Presets واضحة وتحكمًا في التسديد.',
    identityEn: 'FIFA 19 relies on Dynamic Tactics and Timed Finishing, so clear presets and shot control matter.',
    defensiveStyle: 'Balanced',
    defensiveDetails: { 'Defensive Style': 'Balanced', 'Width': '45', 'Depth': '50', 'Dynamic Tactic Preset': 'Defensive / Balanced / Attacking prepared' },
    attackingStyle: 'Fast Build Up',
    attackingDetails: { 'Build Up Play': 'Fast Build Up', 'Chance Creation': 'Balanced', 'Width': '55', 'Players In Box': '6', 'Corners / Free Kicks': '2 / 2' },
    instructions: ['جهّز أكثر من Dynamic Tactic.', 'استخدم Stay Back على ارتكاز.', 'لا تعتمد على Timed Finishing في كل فرصة.'],
    mistakes: ['رفع العمق ضد السرعة.', 'التسديد المتسرع.', 'ترك منطقة الارتكاز فارغة.']
  },
  'fifa-20': {
    formation: '4-2-3-1',
    identityAr: 'FIFA 20 يكافئ الدفاع اليدوي، الصبر، والتمرير البيني في اللحظة الصحيحة.',
    identityEn: 'FIFA 20 rewards manual defending, patience and correctly timed through balls.',
    defensiveStyle: 'Balanced',
    defensiveDetails: { 'Defensive Style': 'Balanced', 'Width': '42', 'Depth': '45', 'Manual Defending': 'Jockey first, tackle second' },
    attackingStyle: 'Balanced / Possession',
    attackingDetails: { 'Build Up Play': 'Balanced', 'Chance Creation': 'Possession', 'Width': '50', 'Players In Box': '5', 'Corners / Free Kicks': '2 / 2' },
    instructions: ['CDM: Stay Back + Cover Center.', 'الظهيران: Stay Back ضد خصم سريع.', 'المهاجم: Stay Central + Get In Behind.'],
    mistakes: ['سحب قلب الدفاع خارج الخط.', 'تمرير بيني بلا توقيت.', 'ضغط Sprint أثناء الدفاع طوال الوقت.']
  },
  'fifa-21': {
    formation: '4-4-2',
    identityAr: 'FIFA 21 سريع ويبرز Agile Dribbling وCreative Runs؛ حماية الأطراف والعمق ضرورية.',
    identityEn: 'FIFA 21 is fast and highlights Agile Dribbling and Creative Runs; protect flanks and central gaps.',
    defensiveStyle: 'Balanced',
    defensiveDetails: { 'Defensive Style': 'Balanced', 'Width': '45', 'Depth': '48', 'Fullback Instruction': 'Stay Back While Attacking' },
    attackingStyle: 'Long Ball / Direct Runs',
    attackingDetails: { 'Build Up Play': 'Long Ball', 'Chance Creation': 'Forward Runs', 'Width': '55', 'Players In Box': '6', 'Corners / Free Kicks': '2 / 2' },
    instructions: ['استخدم Creative Runs بدل الجري المستقيم.', 'خلي جناحًا يرجع دفاعيًا.', 'لاعب الوسط: Cover Center.'],
    mistakes: ['ترك الظهير في 1v1 بلا مساعدة.', 'رفع Depth مع دفاع بطيء.', 'المبالغة في Agile Dribbling.']
  },
  'fifa-22': {
    formation: '4-2-2-2',
    identityAr: 'FIFA 22 أكثر تنظيمًا؛ البناء المتوازن والتمرير القصير داخل العمق أكثر أمانًا.',
    identityEn: 'FIFA 22 is more structured; balanced build-up and short central passing are safer.',
    defensiveStyle: 'Balanced',
    defensiveDetails: { 'Defensive Style': 'Balanced', 'Width': '45', 'Depth': '50', 'Second Man Press': 'Use selectively' },
    attackingStyle: 'Balanced / Direct Passing',
    attackingDetails: { 'Build Up Play': 'Balanced', 'Chance Creation': 'Direct Passing', 'Width': '48', 'Players In Box': '5', 'Corners / Free Kicks': '2 / 2' },
    instructions: ['أحد المهاجمين Come Back / False 9 حسب أسلوبك.', 'CDM ثابت والآخر Balanced.', 'استخدم التمرير القصير لجذب الخصم.'],
    mistakes: ['ضغط مبالغ فيه.', 'التمرير المركزي بلا دعم.', 'فتح المسافة بين ثنائي الارتكاز.']
  },
  'fifa-23': {
    formation: '4-3-2-1',
    identityAr: 'FIFA 23 يغيّر قيمة اللاعبين حسب AcceleRATE؛ اختَر الأدوار والجري وفق نوع اللاعب.',
    identityEn: 'FIFA 23 changes player value through AcceleRATE; choose roles and runs for each player type.',
    defensiveStyle: 'Balanced',
    defensiveDetails: { 'Defensive Style': 'Balanced', 'Width': '42', 'Depth': '55', 'AcceleRATE Cover': 'Keep a fast recovery defender' },
    attackingStyle: 'Balanced / Direct Passing',
    attackingDetails: { 'Build Up Play': 'Balanced', 'Chance Creation': 'Direct Passing', 'Width': '45', 'Players In Box': '6', 'Corners / Free Kicks': '2 / 2' },
    instructions: ['استخدم لاعب Lengthy في المساحات الطويلة.', 'ثبّت ظهيرًا واحدًا.', 'CF الجانبي يدخل للعمق.'],
    mistakes: ['دفاع بطيء أمام السرعة.', 'إرسال كلا الظهيرين.', 'اختيار أدوار لا تناسب AcceleRATE.']
  },
  'ea-fc-24': {
    formation: '4-2-3-1',
    identityAr: 'EA FC 24 يعتمد على PlayStyles وAcceleRATE؛ استغل قدرات اللاعبين بدل نسخ خطة عامة.',
    identityEn: 'EA FC 24 depends on PlayStyles and AcceleRATE; exploit player strengths instead of copying a generic tactic.',
    defensiveStyle: 'Balanced',
    defensiveDetails: { 'Defensive Style': 'Balanced', 'Width': '45', 'Depth': '55', 'PlayStyles Focus': 'Anticipate / Intercept in midfield' },
    attackingStyle: 'Balanced / Direct Passing',
    attackingDetails: { 'Build Up Play': 'Balanced', 'Chance Creation': 'Direct Passing', 'Width': '50', 'Players In Box': '5', 'PlayStyles Focus': 'Technical / Rapid / Pinged Pass' },
    instructions: ['استغل PlayStyle الأساسي لكل لاعب.', 'CDM: Cover Center.', 'الجناح الأسرع: Get In Behind.'],
    mistakes: ['اختيار لاعبين لا يناسبون الخطة.', 'ضغط دائم يهلك اللياقة.', 'تمريرات صعبة بلا PlayStyle مناسب.']
  },
  'ea-fc-25': {
    formation: '4-2-3-1',
    identityAr: 'EA FC 25 مبني على FC IQ وPlayer Roles؛ الدور والتركيز أهم من مجرد رقم التشكيل.',
    identityEn: 'EA FC 25 is built around FC IQ and Player Roles; role and focus matter more than formation numbers.',
    defensiveStyle: 'FC IQ Balanced Approach',
    defensiveDetails: { 'Defensive Approach': 'Balanced', 'Line Height': '45–55', 'CB Roles': 'Defender / Ball-Playing Defender', 'Fullback Roles': 'Fullback / Wingback by side' },
    attackingStyle: 'FC IQ Role-led Build Up',
    attackingDetails: { 'Build Up Style': 'Balanced', 'CAM Role': 'Playmaker', 'CM Roles': 'Holding + Box-to-Box', 'ST Role': 'Advanced Forward', 'Smart Tactics': 'Use situationally' },
    instructions: ['راجع Role Familiarity لكل لاعب.', 'ضع Holding أمام الدفاع.', 'استخدم Playmaker بين الخطوط.'],
    mistakes: ['تضارب Player Roles.', 'اختيار Focus هجومي لكل اللاعبين.', 'تجاهل Familiarity.']
  },
  'ea-fc-26': {
    formation: '4-3-2-1',
    identityAr: 'EA FC 26 يوسّع FC IQ وSmart Tactics؛ توازن الأدوار وتوافقها هو مفتاح الخطة.',
    identityEn: 'EA FC 26 expands FC IQ and Smart Tactics; balanced, compatible roles are the key.',
    defensiveStyle: 'FC IQ Balanced / Compact',
    defensiveDetails: { 'Defensive Approach': 'Balanced', 'Line Height': '50', 'GK Role': 'Ball-Playing Keeper when suitable', 'Backline Roles': 'One conservative, one progressive side' },
    attackingStyle: 'Smart Tactics / Role-led',
    attackingDetails: { 'Build Up Style': 'Balanced', 'Midfield Roles': 'Holding + Box Crasher + Playmaker', 'Wide Roles': 'Inside Forward / Wide Forward mix', 'Smart Tactics': 'Trigger only for match state' },
    instructions: ['وازن بين Box Crasher وHolding.', 'استخدم Ball-Playing Keeper فقط لو مناسب.', 'فعّل Smart Tactics حسب حالة المباراة.'],
    mistakes: ['تضارب الأدوار.', 'المبالغة في الأدوار الهجومية.', 'تغيير Smart Tactic كل دقيقة.']
  }
};


function isBuildMode(input: GeneratorInput): boolean {
  return /BUILD_MY_TACTIC|بناء خطة المستخدم|Build user-owned/i.test(`${input.notes || ''} ${input.opponentStyle || ''} ${input.matchState || ''}`);
}

function normalizeArabicStyle(value = ''): string {
  const s = value.toLowerCase();
  if (/استحواذ|possession|تيكي|tiki/.test(s)) return 'استحواذ';
  if (/ضغط|press|gegen/.test(s)) return 'ضغط عالي';
  if (/دفاع|defen|low|متأخر/.test(s)) return 'دفاعي';
  if (/مرتد|counter|quick|fast/.test(s)) return 'مرتدات';
  if (/هجومي|attack/.test(s)) return 'هجومي';
  return 'متوازن';
}

function chooseBuildFormation(style: string, preferred = ''): string {
  if (preferred && preferred !== '4-3-3') return preferred;
  const s = normalizeArabicStyle(style);
  if (s === 'استحواذ') return '4-3-3';
  if (s === 'ضغط عالي') return '4-2-1-3';
  if (s === 'دفاعي') return '4-2-3-1';
  if (s === 'مرتدات') return '4-2-3-1';
  if (s === 'هجومي') return '3-2-4-1';
  return '4-3-3';
}

function counterFormation(style: string, profile: GameProfile, oppFormation = '', matchState = ''): string {
  const s = `${style} ${oppFormation} ${matchState}`.toLowerCase();
  const f = (oppFormation || '').replace(/\s+/g, '');
  if (/4-3-3|433|4-2-1-3|4213/.test(f)) return /wide|أطراف|عرضيات/.test(s) ? '4-4-2' : '4-2-3-1';
  if (/4-2-3-1|4231/.test(f)) return /press|ضغط|استحواذ|possession/.test(s) ? '4-3-2-1' : '4-4-2';
  if (/4-4-2|442/.test(f)) return /wide|أطراف/.test(s) ? '3-5-2' : '4-2-3-1';
  if (/3-5-2|352|3-4-3|343/.test(f)) return '4-2-1-3';
  if (/5-3-2|532|5-4-1|541/.test(f)) return '3-2-4-1';
  if (/دفاع متأخر|low block|park/.test(s)) return '3-2-4-1';
  if (/ضغط عالي|high press|press/.test(s)) return '4-2-3-1';
  return profile.formation;
}

type CompactPlan = {
  formation: string;
  attackingStyle: string;
  attackingDetails: Record<string,string>;
  defensiveStyle: string;
  defensiveDetails: Record<string,string>;
  instructions: string[];
  matchOrders: string[];
  reason: string;
  mistakes: string[];
};

function buildCompactPlan(game: GameItem, input: GeneratorInput, lang: string): CompactPlan {
  const ar = lang === 'ar';
  const gameId = game.id;
  const buildMode = isBuildMode(input);
  const style = normalizeArabicStyle(buildMode ? input.myStyle : input.opponentStyle);
  const context = `${input.opponentStyle || ''} ${input.matchState || ''} ${input.oppFormation || ''}`.toLowerCase();
  const againstWide = /wide|wing|أطراف|عرضيات|سرعة من الأطراف/.test(context);
  const againstPress = /press|ضغط/.test(context);
  const againstLow = /low block|park|دفاع متأخر/.test(context);
  const againstLong = /long|كرات طويلة/.test(context);
  const againstPoss = /possession|استحواذ/.test(context);
  const formation = buildMode ? chooseBuildFormation(input.myStyle, input.myFormation) : counterFormation(input.opponentStyle, profiles[gameId] || profiles['ea-fc-25'], input.oppFormation, input.matchState);

  const shapeKey = `${formation || ''}`.replace(/\s+/g, '');
  const isThreeBack = /3-2-4-1|3241|3-4-2-1|3421|3-5-2|352/.test(shapeKey);
  const isDoublePivot = /4-2-3-1|4231|4-2-1-3|4213/.test(shapeKey);
  const isFlat442 = /4-4-2|442/.test(shapeKey);
  const isNarrow = /4-3-2-1|4321|4-3-1-2|4312/.test(shapeKey);
  const decisionText = `${style} ${context} ${input.matchState || ''} ${shapeKey}`.toLowerCase();
  const directStyle = /مرتد|counter|quick/.test(decisionText);
  const defensiveMode = /دفاعي|protect|متقدم|leading|حماية/.test(decisionText) || /سرعة|pace|counter/.test(context);
  let supportValue = 5;
  if (style === 'استحواذ') supportValue = isNarrow ? 3 : againstWide || isFlat442 ? 5 : 4;
  else if (againstLong) supportValue = isFlat442 ? 8 : 7;
  else if (directStyle || style === 'مرتدات') supportValue = isThreeBack ? 6 : isDoublePivot ? 5 : 6;
  else if (againstLow) supportValue = isThreeBack ? 4 : 6;
  else if (againstPress || style === 'ضغط عالي') supportValue = isNarrow ? 3 : 4;

  let lineValue = 5;
  if (defensiveMode || style === 'دفاعي') lineValue = isThreeBack ? 4 : 3;
  else if (/متأخر|trailing|need goal|هدف/.test(decisionText)) lineValue = isThreeBack ? 6 : 7;
  else if (againstPress || style === 'ضغط عالي') lineValue = isDoublePivot ? 6 : 7;
  else if (style === 'استحواذ') lineValue = isThreeBack ? 5 : 6;
  else if (againstLow) lineValue = 6;

  let compactValue = 7;
  if (/سرعة|pace|counter/.test(context)) compactValue = isDoublePivot ? 9 : 8;
  else if (isNarrow) compactValue = 9;
  else if (againstWide || isFlat442) compactValue = 6;
  else if (isThreeBack) compactValue = 7;
  else if (againstLow) compactValue = 6;
  else compactValue = againstPress || style === 'ضغط عالي' ? 8 : 7;

  const support = `${Math.max(1, Math.min(10, supportValue))}`;
  const line = `${Math.max(1, Math.min(10, lineValue))}`;
  const compact = `${Math.max(1, Math.min(10, compactValue))}`;
  const attackArea = againstWide ? 'الأطراف' : 'العمق';
  const isPes = gameId.includes('pes');
  const isEF = gameId.includes('efootball');
  const isFC = gameId.includes('fc') || gameId.includes('fifa');

  // Extract Tight Marking target from manual plan notes (V131.6 improvement)
  const tightMarkMatch = (input.notes || '').match(/TIGHT_MARK_PES:([A-Z]+)/);
  const tightMarkTarget = tightMarkMatch ? tightMarkMatch[1] : null;

  if (isPes) {
    // Using modular PES engine (V131.8 efficiency plan)
    const pesResult = generatePESTactic({ style, againstLow, againstWide });
    
    const pesStyle = buildMode ? (style === 'استحواذ' ? 'استحواذ' : 'هجوم مرتد') : (againstLow ? 'استحواذ' : 'هجوم مرتد');
    const attack: Record<string,string> = {
      'أسلوب الهجوم': pesStyle,
      'طريقة البناء': (againstLong || style === 'مرتدات') ? 'تمرير طويل' : 'تمرير قصير',
      'منطقة الهجوم': attackArea,
      'تمركز اللاعبين': style === 'استحواذ' ? 'الحفاظ على الشكل' : 'مرن',
      'تقارب اللاعبين': support
    };
    const defence: Record<string,string> = {
      'أسلوب الدفاع': (Number(line) <= 4 || style === 'دفاعي') ? 'دفاع متأخر' : 'ضغط من الأمام',
      'منطقة الاحتواء': againstWide ? 'الأطراف' : 'العمق',
      'طريقة الضغط': againstPress ? 'هادئ' : 'هجومي',
      'خط الدفاع': pesResult.line || line,
      'التكتل': pesResult.compact || compact
    };
    const adv1 = againstLow ? 'تيكي تاكا' : againstWide ? 'توسيع الأطراف' : 'هدف للمرتدات';
    const adv2 = style === 'هجومي' || againstLow ? 'ظهيران مهاجمان' : 'لاعب ثابت في العمق';
    const def1 = Number(line) <= 4 ? 'خط دفاع منخفض' : 'رقابة لصيقة';
    const def2 = againstWide ? 'مساندة الظهير' : 'تكدس داخل الصندوق';

    // V131.6 Deep Improvement: Contextual advanced instructions based on Tight Marking target
    if (isPes && tightMarkTarget) {
      defence['رقابة لصيقة على'] = tightMarkTarget;
      
      // Smarter contextual advice
      let contextualNote = `رقابة لصيقة مستهدفة على ${tightMarkTarget}`;
      if (['AMF', 'CMF', 'DMF'].includes(tightMarkTarget)) {
        contextualNote += ' — ركز على إغلاق ممرات التمرير في الوسط';
        def2 = 'رقابة لصيقة + تغطية العمق';
      } else if (['LWF', 'RWF', 'SS'].includes(tightMarkTarget)) {
        contextualNote += ' — اضغط على الأطراف وامنع العرضيات';
      }
      
      if (!defence['ملاحظات إضافية']) defence['ملاحظات إضافية'] = '';
      defence['ملاحظات إضافية'] += ` | ${contextualNote}`;
    }

    return {
      formation,
      attackingStyle: pesStyle,
      attackingDetails: attack,
      defensiveStyle: defence['أسلوب الدفاع'],
      defensiveDetails: defence,
      instructions: [
        `هجوم 1: ${adv1}`,
        `هجوم 2: ${adv2}`,
        `دفاع 1: ${def1}`,
        `دفاع 2: ${def2}`
      ],
      matchOrders: buildMode ? ['ابدأ بإيقاع آمن أول 10 دقائق', 'لا ترفع الظهيرين معًا', 'غيّر الرتم بعد أول فرصة واضحة'] : ['أغلق مسار الخصم الأساسي أولًا', 'لا تضغط بقلب الدفاع', 'اضرب المساحة خلف أضعف ظهير'],
      reason: buildMode ? 'الخطة مبنية على أسلوب لعبك فقط بدون خصوم.' : `تم اختيار ${formation} لأنها تعالج ${input.oppFormation} و${input.opponentStyle}.`,
      mistakes: ['لا تستخدم تعليمات متعارضة', 'لا ترفع خط الدفاع ضد السرعة', 'لا تفتح التكتل ضد لعب العمق']
    };
  }

  if (isEF) {
    const efootballResult = generateEfootballTactic({ style, againstLow, againstWide });
    const playstyle = style === 'استحواذ' ? 'استحواذ' : againstWide ? 'لعب على الأطراف' : againstLong ? 'مرتدات كرات طويلة' : 'مرتدات سريعة';
    return {
      formation,
      attackingStyle: efootballResult.attackingStyle || playstyle,
      attackingDetails: {
        'أسلوب الفريق': playstyle,
        'شكل الهجمة': formation,
        'مخرج التمرير': againstPress ? 'DMF ثم AMF' : 'CB ثم DMF',
        'حماية المرتدة': '2 CB + DMF ثابت'
      },
      defensiveStyle: 'كتلة متوسطة متماسكة',
      defensiveDetails: {
        'التعليمات الدفاعية 1': Number(line) <= 4 ? 'خط دفاع منخفض على DMF' : 'دفاعي على الظهير الأخطر',
        'التعليمات الدفاعية 2': againstWide ? 'رقابة رجل لرجل على الجناح' : 'رقابة لصيقة على AMF/CF',
        'قاعدة الضغط': 'اضغط 6 ثواني ثم ارجع للشكل',
        'توازن الخلف': 'لا ترفع الظهيرين معًا'
      },
      instructions: [
        `CF: ${style === 'استحواذ' ? 'تثبيت في العمق' : 'هدف للمرتدات'}`,
        `AMF: ${againstLow ? 'تحرك بين الخطوط' : 'تثبيت / Anchoring عند الحاجة'}`,
        `DMF: ${Number(line) <= 4 ? 'خط دفاع منخفض' : 'تثبيت في العمق'}`,
        `RB/LB: ${againstWide ? 'دفاعي على جهة الخطر' : 'ظهير واحد فقط يتقدم'}`,
        `أخطر لاعب خصم: رقابة رجل لرجل عند الحاجة`
      ],
      matchOrders: buildMode ? ['ثبت أسلوب الفريق قبل التشكيلة', 'استخدم تعليمات قليلة وواضحة', 'احمِ العمق قبل رفع الرتم'] : ['اقفل العمق أولًا', 'ثبت DMF عند فقد الكرة', 'Counter Target على لاعب واحد فقط'],
      reason: buildMode ? 'الخطة تبني هوية لعبك في eFootball بدون إدخال خصم.' : `الخطة المضادة مبنية على أسلوب ${input.opponentStyle} وتمنع نفس الخطة المتكررة بتغيير الشكل والتعليمات.`,
      mistakes: ['لا تضع Counter Target على أكثر من لاعب', 'لا ترفع الظهيرين معًا', 'لا تخلط أسلوب مدرب مع لاعبين غير مناسبين']
    };
  }

  const buildStyle = style === 'استحواذ' ? 'تمرير قصير' : againstLow ? 'متوازن' : 'هجوم مرتد';
  const defApproach = againstLong ? 'متراجع' : againstLow ? 'مرتفع' : againstPress ? 'متوازن' : 'متوسط';
  return {
    formation,
    attackingStyle: buildStyle,
    attackingDetails: {
      'أسلوب البناء': buildStyle,
      'الخطة التكتيكية': 'مخصص',
      'الدور المحوري': againstLow ? 'صانع لعب + مهاجم متقدم' : 'محور دفاعي + جناح مباشر',
      'العرض الهجومي': againstWide ? '50' : '45'
    },
    defensiveStyle: defApproach,
    defensiveDetails: {
      'أسلوب الدفاع': defApproach,
      'ارتفاع الخط': againstLong ? '45' : againstLow ? '70' : '55',
      'الضغط': againstPress ? 'متوازن' : 'حسب فقد الكرة',
      'حماية العمق': 'CDM دفاعي يغطي العمق'
    },
    instructions: [
      'ST: مهاجم متقدم / اختراق خلف الدفاع',
      'CAM: صانع لعب أو تحرك حر حسب الأمان',
      'CDM: محور دفاعي + تغطية العمق',
      'RB/LB: ظهير واحد دفاعي والآخر متوازن',
      'CB: ابقَ في الخلف ولا تندفع للضغط'
    ],
    matchOrders: buildMode ? ['ابدأ متوازن ثم ارفع الرتم', 'لا تترك CDM يتقدم كثيرًا', 'استغل الجناح الأسرع'] : ['اضرب خلف الظهير الأضعف', 'لا ترفع الخط فوق 60 ضد السرعة', 'اضغط بعد الدقيقة 60 فقط لو محتاج هدف'],
    reason: buildMode ? 'الخطة تبني أسلوبك داخل EA FC بدون خصم.' : `الخطة تضاد ${input.oppFormation} و${input.opponentStyle} بأدوار FC IQ واضحة.`,
    mistakes: ['لا تستخدم دورين هجوميّين للأظهرة معًا', 'لا ترفع الخط ضد مهاجم سريع', 'لا تغير كل الأدوار مرة واحدة']
  };
}

export function generateLocalTactic(game: GameItem, input: GeneratorInput, lang: string): TacticResult {
  const ar = lang === 'ar';
  const plan = buildCompactPlan(game, input, lang);
  const dna = officialDnaForGame(game.id);
  const dnaSummary = officialDnaSummary(game.id, lang);
  const baseResult: TacticResult = {
    formation: plan.formation,
    reason: plan.reason,
    defensiveStyle: plan.defensiveStyle,
    defensiveDetails: {
      ...plan.defensiveDetails,
      ...dnaSummary,
    },
    attackingStyle: plan.attackingStyle,
    attackingDetails: {
      ...plan.attackingDetails,
      [ar ? 'تجنب' : 'Avoid']: dna.avoid.join(' • '),
    },
    playerInstructions: plan.instructions,
    inGameStrategy: plan.matchOrders.join(' • '),
    emergencyPlan: ar ? 'لو متأخر: زوّد لاعبًا بين الخطوط ولا تكسر التوازن الدفاعي.' : 'If trailing: add a between-lines runner without breaking rest defence.',
    protectLeadPlan: ar ? 'لو متقدم: قلل المخاطرة، ثبت الظهيرين، واحفظ DMF أمام الدفاع.' : 'If leading: lower risk, hold fullbacks and keep DMF in front of defence.',
    mistakesToAvoid: plan.mistakes,
    difficulty: ar ? 'سهلة التنفيذ — القيم جاهزة داخل اللعبة' : 'Easy to execute — direct in-game values',
    confidence: `${Math.min(98, dna.score + (isBuildMode(input) ? 1 : 3))}%`
  };
  return applyEfootballManagerToResult(input, baseResult, game.id, lang) as TacticResult;
}
