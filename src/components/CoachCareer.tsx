import React from 'react';
import { Award, Flame, Trophy, Target, ClipboardList, Brain, ShieldCheck } from 'lucide-react';
import { SupportedLang } from '../utils/lang';
import { ProgressionState } from '../utils/growthEngine';

const tx = (lang: SupportedLang, ar: string, en: string, es: string, fr: string) => ({ ar, en, es, fr }[lang]);

function coachIdentity(lang: SupportedLang, generatedCount: number, analysisCount: number, streak: number) {
  if (analysisCount >= generatedCount && analysisCount >= 3) return tx(lang, 'محلل مباريات', 'Match Analyst', 'Analista de partidos', 'Analyste de match');
  if (generatedCount >= 5 && streak >= 5) return tx(lang, 'مهندس تكتيكي', 'Tactical Architect', 'Arquitecto táctico', 'Architecte tactique');
  if (streak >= 7) return tx(lang, 'مدرب يومي منضبط', 'Daily Discipline Coach', 'Entrenador constante', 'Coach régulier');
  if (generatedCount >= 3) return tx(lang, 'صانع خطط', 'Plan Builder', 'Creador de planes', 'Créateur de plans');
  return tx(lang, 'مدرب صاعد', 'Rising Coach', 'Entrenador emergente', 'Coach montant');
}

function weeklyFocus(lang: SupportedLang, generatedCount: number, analysisCount: number) {
  if (analysisCount < 2) return tx(lang, 'حلّل مباراتين هذا الأسبوع حتى يعرف التطبيق نقاط ضعفك الحقيقية.', 'Analyze two matches this week so the app can learn your real weak points.', 'Analiza dos partidos esta semana.', 'Analysez deux matchs cette semaine.');
  if (generatedCount < 2) return tx(lang, 'ابنِ خطتين مختلفتين بدل الاعتماد على شكل واحد.', 'Build two different tactics instead of relying on one shape.', 'Crea dos tácticas distintas.', 'Créez deux tactiques différentes.');
  return tx(lang, 'اختبر الخطة الأفضل ضد خصم سريع ثم احفظ النسخة الناجحة فقط.', 'Test your best tactic against a fast rival, then save only the working version.', 'Prueba tu mejor táctica contra un rival rápido.', 'Testez votre meilleure tactique contre un adversaire rapide.');
}

export default function CoachCareer({ lang, coachName, xp, levelName, progression }: { lang: SupportedLang; coachName: string; xp: number; levelName: string; progression: ProgressionState }) {
  const rank = xp > 6000 ? 'Legend' : xp > 3500 ? 'Tactical Master' : xp > 1800 ? 'Elite Coach' : xp > 700 ? 'Manager' : 'Rookie Coach';
  const generatedCount = progression.activity.filter(item => item.type === 'generate').length;
  const analysisCount = progression.activity.filter(item => item.type === 'screenshot_analysis' || item.type === 'match_analysis').length;
  const saveCount = progression.activity.filter(item => item.type === 'save').length;
  const identity = coachIdentity(lang, generatedCount, analysisCount, progression.streak || 0);
  const badges = [
    { icon: <Target size={14}/>, label: tx(lang, 'صانع خطط', 'Plan Builder', 'Creador', 'Créateur'), value: `${generatedCount}` },
    { icon: <Trophy size={14}/>, label: tx(lang, 'محلل مباريات', 'Match Analyst', 'Analista', 'Analyste'), value: `${analysisCount}` },
    { icon: <Flame size={14}/>, label: tx(lang, 'السلسلة', 'Streak', 'Racha', 'Série'), value: `${progression.streak || 0}` },
  ];

  return <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/25 to-slate-950/70 p-4 space-y-3">
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-[10px] font-black text-amber-300">{tx(lang, 'مسيرة المدرب', 'Coach Career', 'Carrera', 'Carrière')}</div>
        <h3 className="mt-1 text-lg font-black text-white">{coachName}</h3>
        <p className="text-[11px] text-slate-400">{levelName} • {rank}</p>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black text-emerald-200"><Brain size={12}/>{identity}</div>
      </div>
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-center"><Award size={22} className="mx-auto text-amber-300"/><div className="mt-1 text-[10px] font-black text-amber-100">{xp} XP</div></div>
    </div>
    <div className="grid grid-cols-3 gap-2">{badges.map((badge) => <div key={badge.label} className="rounded-2xl border border-white/5 bg-slate-950/45 p-3 text-center"><div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-amber-300">{badge.icon}</div><div className="mt-2 text-sm font-black text-white">{badge.value}</div><div className="mt-0.5 text-[9px] text-slate-500">{badge.label}</div></div>)}</div>
    <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-3 space-y-2">
      <div className="flex items-center gap-2 text-[11px] font-black text-cyan-200"><ClipboardList size={14}/>{tx(lang, 'تقرير المدرب الأسبوعي', 'Weekly Coach Report', 'Informe semanal', 'Rapport hebdo')}</div>
      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
        <div className="rounded-xl bg-slate-950/45 border border-white/5 p-2"><div className="font-black text-white">{generatedCount}</div><div className="text-slate-500">{tx(lang, 'خطط', 'Plans', 'Planes', 'Plans')}</div></div>
        <div className="rounded-xl bg-slate-950/45 border border-white/5 p-2"><div className="font-black text-white">{analysisCount}</div><div className="text-slate-500">{tx(lang, 'تحليلات', 'Analyses', 'Análisis', 'Analyses')}</div></div>
        <div className="rounded-xl bg-slate-950/45 border border-white/5 p-2"><div className="font-black text-white">{saveCount}</div><div className="text-slate-500">{tx(lang, 'محفوظات', 'Saves', 'Guardados', 'Sauvegardes')}</div></div>
      </div>
      <div className="flex items-start gap-2 rounded-xl bg-slate-950/45 border border-white/5 p-2 text-[10px] text-slate-300 leading-relaxed"><ShieldCheck size={13} className="text-emerald-300 shrink-0 mt-0.5"/><span>{weeklyFocus(lang, generatedCount, analysisCount)}</span></div>
    </div>
  </div>;
}
