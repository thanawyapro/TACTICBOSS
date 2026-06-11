import React from 'react';
import { BarChart3, Crown, Flame, Shield, Sparkles, TrendingDown, TrendingUp, Zap, Brain, Target, Eye } from 'lucide-react';
import { MetaItem } from '../utils/growthEngine';
import { SupportedLang } from '../utils/lang';

interface Props { lang: SupportedLang; items: MetaItem[]; gameName: string; premium: boolean; onUse: (item: MetaItem) => void; }

const tierClass: Record<string, string> = {
  free: 'border-emerald-400/25 bg-emerald-500/5',
  pro: 'border-violet-400/25 bg-violet-500/5',
  elite: 'border-amber-400/25 bg-amber-500/5'
};

export default function MetaCenter({ lang, items, gameName, premium, onUse }: Props) {
  const text=(ar:string,en:string,es:string,fr:string)=>({ar,en,es,fr}[lang]);
  const tierName = (tier?: string) => (tier || 'free').toUpperCase();
  return <div className="space-y-4">
    <div className="bg-gradient-to-br from-rose-500/15 via-violet-500/10 to-slate-950 border border-rose-400/20 p-4 rounded-2xl relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-500/10 blur-3xl rounded-full" />
      <div className="flex items-start justify-between relative gap-3">
        <div>
          <div className="flex items-center gap-2"><Flame size={18} className="text-rose-400"/><h2 className="text-base font-black text-white">META CENTER</h2></div>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{text('خطط يومية جاهزة للتطبيق، وليست مجرد ترندات. كل كارت يحتوي تشكيل، أدوار، تعليمات، ونقطة ضعف.', 'Ready daily tactics, not just trends. Each card includes shape, roles, instructions and weakness.', 'Tácticas diarias listas.', 'Tactiques quotidiennes prêtes.')}</p>
        </div>
        <span className="text-[9px] rounded-full px-2 py-1 bg-rose-500/15 text-rose-300 border border-rose-400/20 shrink-0">DAILY READY</span>
      </div>
      <div className="mt-3 bg-slate-950/50 rounded-xl p-2.5 border border-white/5 flex items-center justify-between"><span className="text-[10px] text-slate-400">{text('اللعبة النشطة','Active game','Juego activo','Jeu actif')}</span><span className="text-[11px] font-extrabold text-white">{gameName}</span></div>
    </div>

    <div className="space-y-3">
      {items.map((item,index)=>{
        const locked=!premium && index>0;
        return <div key={`${item.formation}-${index}`} className={`border rounded-2xl p-4 space-y-3 relative overflow-hidden ${tierClass[item.tier || (index===0?'free':index===1?'pro':'elite')] || 'bg-white/5 border-white/5'}`}>
          {locked && <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] z-10 flex items-center justify-center"><div className="text-center px-4"><Crown size={24} className="text-amber-400 mx-auto"/><div className="text-[10px] font-black text-amber-300 mt-1">{text('افتح هذه الخطة في Pro / Elite','Unlock this plan with Pro / Elite','Disponible en Pro / Elite','Disponible avec Pro / Elite')}</div><div className="text-[9px] text-slate-400 mt-1">{text('تظل الخطة الأساسية متاحة مجانًا يوميًا.','The core daily plan stays free every day.','Plan básico gratis.','Plan de base gratuit.')}</div></div></div>}
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><span className="text-[9px] rounded-full px-2 py-0.5 bg-white/10 text-slate-200 font-black">{tierName(item.tier)}</span><span className="text-[9px] text-slate-500">{item.label}</span></div>
              <div className="text-2xl font-black text-white font-mono mt-1">{item.formation}</div>
              <div className="text-[10px] text-slate-300 font-bold">{item.playstyle}</div>
            </div>
            <div className="text-end"><div className="text-xl font-black text-emerald-300">{item.score}</div><div className={`text-[10px] flex items-center gap-1 justify-end ${item.trend>=0?'text-emerald-400':'text-rose-400'}`}>{item.trend>=0?<TrendingUp size={12}/>:<TrendingDown size={12}/>} {item.trend>0?'+':''}{item.trend}%</div></div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[9px]"><div className="bg-slate-950/50 border border-white/5 rounded-xl p-2"><Zap size={12} className="text-violet-400 mb-1"/><span className="text-slate-500 block">{text('المدرب / الفلسفة','Manager / DNA','Entrenador','Manager')}</span><span className="text-slate-200 font-bold">{item.manager || 'Game-aware DNA'}</span></div><div className="bg-slate-950/50 border border-white/5 rounded-xl p-2"><Shield size={12} className="text-emerald-400 mb-1"/><span className="text-slate-500 block">{text('أفضل مضاد','Best counter','Mejor contra','Meilleur contre')}</span><span className="text-slate-200 font-bold">{item.counter}</span></div></div>

          <div className="rounded-xl border border-white/5 bg-slate-950/45 p-3 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-cyan-200"><Target size={13}/>{text('أدوار اللاعبين المقترحة','Suggested player profiles','Roles sugeridos','Profils suggérés')}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">{(item.playerProfiles || []).slice(0,6).map((line,i)=><div key={i} className="text-[9px] text-slate-300 bg-white/5 rounded-lg px-2 py-1 border border-white/5">{line}</div>)}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3"><div className="flex items-center gap-1.5 text-[10px] font-black text-violet-200"><Brain size={12}/>{text('تعليمات فردية','Individual instructions','Instrucciones','Instructions')}</div><ul className="mt-1 space-y-1">{(item.individualInstructions || []).slice(0,3).map((x,i)=><li key={i} className="text-[9px] text-slate-400">• {x}</li>)}</ul></div>
            <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3"><div className="flex items-center gap-1.5 text-[10px] font-black text-amber-200"><Eye size={12}/>{text('تعديلات متقدمة','Advanced tweaks','Ajustes','Ajustements')}</div><ul className="mt-1 space-y-1">{(item.advancedAdjustments || []).slice(0,3).map((x,i)=><li key={i} className="text-[9px] text-slate-400">• {x}</li>)}</ul></div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-1.5 text-[9px]"><div><span className="text-emerald-300 font-black">{text('لماذا تعمل؟','Why it works','Por qué funciona','Pourquoi ça marche')}: </span><span className="text-slate-300">{item.whyItWorks}</span></div><div><span className="text-rose-300 font-black">{text('نقطة الضعف','Weakness','Debilidad','Faiblesse')}: </span><span className="text-slate-300">{item.weakness}</span></div><div><span className="text-cyan-300 font-black">Board: </span><span className="text-slate-300">{item.boardPreview}</span></div></div>

          <button type="button" onClick={()=>onUse(item)} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-extrabold rounded-xl py-2.5 text-[10px] flex items-center justify-center gap-2"><Sparkles size={13}/>{text('استخدم الخطة الجاهزة','Use ready plan','Usar plan listo','Utiliser le plan prêt')}</button>
        </div>;
      })}
    </div>
    <div className="text-[9px] text-slate-500 flex gap-2 items-start bg-white/5 border border-white/5 rounded-xl p-3"><BarChart3 size={14} className="shrink-0 text-violet-400"/><span>{text('الميتا هنا خطط قابلة للتطبيق ومبنية على DNA اللعبة. عدّلها حسب لاعبيك ومستوى خصمك.', 'These meta cards are actionable and game-DNA aware. Adapt them to your squad and opponent level.', 'Planes aplicables según el DNA del juego.', 'Plans exploitables selon l’ADN du jeu.')}</span></div>
  </div>;
}
