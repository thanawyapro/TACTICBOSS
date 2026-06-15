import { SupportedLang } from './lang';

export interface EfootballProfileRecommendation {
  position: string;
  primary: string;
  alternatives: string[];
  whyAr: string;
  whyEn: string;
}

export const EFOOTBALL_PLAYER_PROFILES: EfootballProfileRecommendation[] = [
  { position: 'CF', primary: 'Goal Poacher', alternatives: ['Fox in the Box', 'Target Man', 'Deep-Lying Forward'], whyAr: 'Goal Poacher يهاجم المساحة، Fox in the Box للصندوق، Target Man للكرات الطويلة.', whyEn: 'Goal Poacher attacks space, Fox in the Box owns the box and Target Man supports long outlets.' },
  { position: 'SS', primary: 'Deep-Lying Forward', alternatives: ['Hole Player', 'Creative Playmaker'], whyAr: 'SS يربط بين CF والوسط ويخلق زاوية ثانية للهجوم.', whyEn: 'SS connects the striker with midfield and creates a second attacking lane.' },
  { position: 'AMF', primary: 'Hole Player', alternatives: ['Creative Playmaker', 'Classic No.10'], whyAr: 'Hole Player الأفضل لاختراق المساحة بين الخطوط، والـCreative Playmaker للتحكم.', whyEn: 'Hole Player attacks the gap between lines, Creative Playmaker controls tempo.' },
  { position: 'CMF', primary: 'Box-to-Box', alternatives: ['Orchestrator', 'Hole Player'], whyAr: 'Box-to-Box يعطي ضغط وتغطية، Orchestrator للبناء الهادئ.', whyEn: 'Box-to-Box gives energy and coverage, Orchestrator improves build-up.' },
  { position: 'DMF', primary: 'Anchor Man', alternatives: ['Destroyer', 'Orchestrator'], whyAr: 'Anchor Man يحمي قلبي الدفاع، Destroyer للضغط، Orchestrator للخروج بالكرة.', whyEn: 'Anchor Man protects CBs, Destroyer presses, Orchestrator builds play.' },
  { position: 'CB', primary: 'Build Up', alternatives: ['Destroyer', 'Extra Frontman'], whyAr: 'Build Up يساعد على التمرير من الخلف، Destroyer مناسب للالتحامات.', whyEn: 'Build Up supports passing from the back, Destroyer handles duels.' },
  { position: 'LB/RB', primary: 'Offensive Full-back', alternatives: ['Defensive Full-back', 'Full-back Finisher'], whyAr: 'اختر Offensive للعرض، Defensive للحماية، Full-back Finisher للدخول للعمق.', whyEn: 'Use Offensive for width, Defensive for cover, Full-back Finisher for inside runs.' },
  { position: 'LWF/RWF', primary: 'Prolific Winger', alternatives: ['Roaming Flank', 'Cross Specialist'], whyAr: 'Prolific Winger للهجوم المباشر، Roaming Flank للدخول للعمق.', whyEn: 'Prolific Winger attacks directly, Roaming Flank cuts inside.' },
  { position: 'GK', primary: 'Offensive Goalkeeper', alternatives: ['Defensive Goalkeeper'], whyAr: 'Offensive GK يفيد الخط العالي، Defensive GK أفضل للبلوك المتأخر.', whyEn: 'Offensive GK fits a high line, Defensive GK fits deeper blocks.' }
];

export function efootballProfileLines(lang: SupportedLang | string): string[] {
  const ar = lang === 'ar';
  return EFOOTBALL_PLAYER_PROFILES.map(p => `${p.position}: ${p.primary} (${p.alternatives.slice(0,2).join(' / ')}) — ${ar ? p.whyAr : p.whyEn}`);
}

export function compactEfootballProfiles(): string {
  return EFOOTBALL_PLAYER_PROFILES.map(p => `${p.position}: ${p.primary}`).join(' • ');
}
