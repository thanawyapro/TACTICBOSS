import React from 'react';
import { Crosshair, ShieldAlert, Sword, Users } from 'lucide-react';
import { SupportedLang } from '../utils/lang';
import { Rival } from '../types';

const tx = (lang: SupportedLang, ar: string, en: string, es: string, fr: string) => ({ ar, en, es, fr }[lang]);

export default function ScoutCenter({ lang, rivals }: { lang: SupportedLang; rivals: Rival[] }) {
  const topFormation = rivals[0]?.favoriteFormation || '4-2-3-1';
  const topStyle = rivals[0]?.playstyle || tx(lang, 'ضغط عالي', 'High Press', 'Presión alta', 'Pressing haut');
  const knownWeaknesses = rivals.filter(r => r.weaknesses).length;
  return <div className="rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-950/25 to-slate-950/70 p-4 space-y-3">
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-[10px] font-black text-rose-300">{tx(lang, 'مركز الاستكشاف', 'Scout Center', 'Centro Scout', 'Centre Scout')}</div>
        <h3 className="mt-1 text-lg font-black text-white">{tx(lang, 'ذكاء الخصوم', 'Rival Intelligence', 'Inteligencia rival', 'Intelligence adversaire')}</h3>
        <p className="text-[11px] text-slate-400">{tx(lang, 'ملخص سريع عن خصومك المحفوظين قبل بناء الخطة المضادة.', 'Fast summary of saved rivals before counter-building.', 'Resumen rápido de rivales.', 'Résumé rapide des adversaires.')}</p>
      </div>
      <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-center"><Users size={22} className="mx-auto text-rose-300"/><div className="mt-1 text-[10px] font-black text-rose-100">{rivals.length}</div></div>
    </div>
    <div className="grid grid-cols-3 gap-2 text-center">
      <Metric icon={<Crosshair size={14}/>} label={tx(lang, 'أشهر خطة', 'Top shape', 'Forma top', 'Système top')} value={topFormation}/>
      <Metric icon={<Sword size={14}/>} label={tx(lang, 'أشهر أسلوب', 'Top style', 'Estilo', 'Style')} value={topStyle}/>
      <Metric icon={<ShieldAlert size={14}/>} label={tx(lang, 'نقاط ضعف معروفة', 'Known weaknesses', 'Debilidades', 'Faiblesses')} value={`${knownWeaknesses}`}/>
    </div>
  </div>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-white/5 bg-slate-950/45 p-3"><div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-rose-300">{icon}</div><div className="mt-2 truncate text-xs font-black text-white">{value}</div><div className="mt-0.5 text-[9px] text-slate-500">{label}</div></div>;
}
