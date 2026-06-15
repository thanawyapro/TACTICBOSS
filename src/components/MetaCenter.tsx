import React, { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Copy, Shield, Sparkles, Target, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { MetaItem } from '../utils/growthEngine';
import { SupportedLang } from '../utils/lang';

interface Props { lang: SupportedLang; items: MetaItem[]; gameName: string; premium: boolean; onUse: (item: MetaItem) => void; }

export default function MetaCenter({ lang, items, gameName, onUse }: Props) {
  const text=(ar:string,en:string,es:string= en,fr:string = en)=>({ar,en,es,fr}[lang]);
  const [openKey, setOpenKey] = useState<string | null>(() => items[0] ? `${items[0].formation}-0` : null);
  const [filterFormation, setFilterFormation] = useState<string | null>(null);

  const filteredItems = filterFormation 
    ? items.filter(item => item.formation === filterFormation)
    : items;

  const formations = Array.from(new Set(items.map(i => i.formation)));
  const copyPlan = async (item: MetaItem) => {
    const content = `${item.formation} — ${item.playstyle}\n${text('القوة','Score')}: ${item.score}/100\n${text('سبب الترند','Trend reason')}: ${item.whyItWorks}\n${text('نقطة الضعف','Weakness')}: ${item.weakness}\n${text('المضاد','Counter')}: ${item.counter}`;
    await navigator.clipboard?.writeText(content).catch(()=>{});
  };

  return <div className="space-y-4">
    <div className="rounded-3xl border border-rose-400/20 bg-gradient-to-br from-rose-500/15 via-violet-500/10 to-slate-950 p-4 shadow-2xl shadow-rose-950/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-rose-300"><BarChart3 size={18}/><span className="text-[10px] font-black tracking-[.18em]">{text('مركز الميتا','META CENTER')}</span></div>
          <h2 className="mt-1 text-lg font-black text-white">{text('خطط ترند قابلة للتطبيق','Actionable meta plans')}</h2>
          <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{text('افتح أي خطة لمعرفة سبب صعودها، قوتها، نقطة ضعفها، والمضاد المناسب لها.','Open any plan to see why it is trending, its score, weakness and best counter.')}</p>
        </div>
        <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-[10px] font-black text-cyan-100">{gameName}</span>
      </div>

      {/* V131.6: Simple formation filter for better usability */}
      {formations.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button 
            onClick={() => setFilterFormation(null)} 
            className={`px-3 py-1 text-[9px] rounded-full border ${!filterFormation ? 'bg-white/10 border-white/30 text-white' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}>
            {text('الكل','All')}
          </button>
          {formations.map(f => (
            <button 
              key={f} 
              onClick={() => setFilterFormation(f)} 
              className={`px-3 py-1 text-[9px] rounded-full border ${filterFormation === f ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}>
              {f}
            </button>
          ))}
        </div>
      )}
    </div>

    <div className="space-y-3">
      {filteredItems.map((item,index)=>{
        const key = `${item.formation}-${index}`;
        const opened = openKey === key;
        const trendUp = (item.trend || 0) >= 0;
        return <article key={key} className="rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-xl shadow-black/10">
          <button type="button" onClick={()=>setOpenKey(opened ? null : key)} className="w-full text-right">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-black text-emerald-100">{item.score}/100</span>
                <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${trendUp?'bg-emerald-400/10 text-emerald-300':'bg-rose-400/10 text-rose-300'}`}>{trendUp?<TrendingUp size={13}/>:<TrendingDown size={13}/>} {trendUp?text('صاعدة','Rising'):text('هابطة','Falling')} {item.trend>0?'+':''}{item.trend}%</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">{opened?<ChevronUp size={18}/>:<ChevronDown size={18}/>}</div>
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-black text-rose-200">{text(`اتجاه #${index+1}`,`Trend #${index+1}`)}</div>
                <h3 className="mt-1 text-xl font-black text-white leading-snug">{item.formation} — {item.playstyle}</h3>
                <p className="mt-2 text-[10px] leading-relaxed text-slate-400">{item.label || item.whyItWorks}</p>
              </div>
            </div>
          </button>

          {opened && <div className="mt-4 space-y-3 animate-fade-in">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-amber-300/10 bg-amber-300/5 p-3"><div className="flex items-center gap-1.5 text-[10px] font-black text-amber-200"><Zap size={13}/>{text('سبب الترند','Trend reason')}</div><p className="mt-1 text-[10px] leading-relaxed text-slate-300">{item.whyItWorks || text('توازن جيد بين البناء والتحول.','Good build-up and transition balance.')}</p></div>
              <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-3"><div className="flex items-center gap-1.5 text-[10px] font-black text-cyan-200"><Shield size={13}/>{text('أفضل مضاد','Best counter')}</div><p className="mt-1 text-[10px] leading-relaxed text-slate-300">{item.counter || text('خطة مضادة متوازنة','Balanced counter')}</p></div>
            </div>
            <div className="rounded-2xl border border-rose-300/10 bg-rose-300/5 p-3"><div className="text-[10px] font-black text-rose-200">{text('نقطة الضعف','Weakness')}</div><p className="mt-1 text-[10px] leading-relaxed text-slate-300">{item.weakness || text('تحتاج مراقبة المساحة خلف الأظهرة.','Watch the space behind fullbacks.')}</p></div>
            <div className="rounded-2xl border border-white/8 bg-slate-950/45 p-3"><div className="flex items-center gap-1.5 text-[10px] font-black text-violet-200"><Target size={13}/>{text('التطبيق داخل اللعبة','In-game application')}</div><div className="mt-2 grid grid-cols-1 gap-1.5">{[...(item.playerProfiles || []), ...(item.individualInstructions || []), ...(item.advancedAdjustments || [])].slice(0,7).map((line,i)=><div key={i} className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-[10px] text-slate-300">{line}</div>)}</div></div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button type="button" onClick={()=>onUse(item)} className="rounded-2xl bg-violet-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-violet-950/20 flex items-center justify-center gap-2"><Sparkles size={14}/>{text('استخدم الخطة','Use plan')}</button>
              <button type="button" onClick={()=>copyPlan(item)} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white"><Copy size={15}/></button>
            </div>
          </div>}
        </article>;
      })}
    </div>
  </div>;
}
