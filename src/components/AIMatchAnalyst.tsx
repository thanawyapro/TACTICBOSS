import React, { useState } from 'react';
import { Upload, Camera, Brain, Shield, Activity, Save, Lock, Target, ClipboardCheck, Users, Sword, BarChart3, FileText, Gauge, TrendingUp, Download } from 'lucide-react';
import { SupportedLang } from '../utils/lang';
import { MatchAnalysisResult, analyzeMatchLocally, MatchContextInput } from '../utils/aiAnalysisEngine';
import { enhanceMatchWithVision } from '../utils/visionAnalysis';

interface Props {
  lang: SupportedLang;
  plan: 'free' | 'pro' | 'elite';
  usedToday: number;
  history: MatchAnalysisResult[];
  onAnalyze: (result: MatchAnalysisResult, fileDataUrl?: string) => Promise<boolean> | boolean;
  onBeforeAnalyze?: () => Promise<boolean> | boolean;
  onCreatePlan: (result: MatchAnalysisResult) => void;
}

const tx = (lang: SupportedLang, ar: string, en: string, es: string, fr: string) => ({ ar, en, es, fr }[lang]);
const limitFor = (plan: string) => plan === 'elite' ? 999 : plan === 'pro' ? 10 : 1;
const FORMATIONS = ['4-3-3', '4-2-3-1', '4-4-2', '4-1-2-1-2', '4-3-2-1', '3-5-2', '3-4-3', '5-3-2'];
const PLAYSTYLES = ['Possession Game', 'Quick Counter', 'Long Ball Counter', 'Out Wide', 'High Press', 'Defensive Block', 'Fast Build Up'];

export default function AIMatchAnalyst({ lang, plan, usedToday, history, onAnalyze, onBeforeAnalyze, onCreatePlan }: Props) {
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<string | undefined>();
  const [fileDataUrl, setFileDataUrl] = useState<string | undefined>();
  const [context, setContext] = useState<MatchContextInput>({
    myTeam: '', opponentTeam: '', myFormation: '4-3-3', opponentFormation: '4-2-3-1', myStyle: 'Possession Game', opponentStyle: 'Quick Counter', scoreline: '', myGoals: '', opponentGoals: '', possession: '', shots: '', matchState: '', notes: ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<MatchAnalysisResult | null>(null);
  const [fileError, setFileError] = useState('');
  const [formError, setFormError] = useState('');
  const [exported, setExported] = useState(false);
  const limit = limitFor(plan);
  const blocked = usedToday >= limit;

  const update = (key: keyof MatchContextInput, value: string) => {
    setContext(prev => ({ ...prev, [key]: value }));
    setFormError('');
    setResult(null);
  };

  const handleFile = (file?: File) => {
    if (!file) return;
    setFileError('');
    if (!['image/png','image/jpeg','image/webp'].includes(file.type)) {
      setFileName(''); setPreview(undefined); setFileDataUrl(undefined);
      setFileError(tx(lang, 'صيغة الصورة غير مدعومة. استخدم PNG أو JPG أو WEBP.', 'Unsupported image format. Use PNG, JPG or WEBP.', 'Formato no compatible. Usa PNG, JPG o WEBP.', 'Format non pris en charge. Utilisez PNG, JPG ou WEBP.'));
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      setFileName(''); setPreview(undefined); setFileDataUrl(undefined);
      setFileError(tx(lang, 'حجم الصورة أكبر من 1.5MB. اختر صورة أصغر لتقليل تكلفة التحليل.', 'Image is larger than 1.5MB. Choose a smaller image to reduce analysis cost.', 'La imagen supera 1.5 MB.', 'L’image dépasse 1,5 Mo.'));
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => { const data = String(reader.result); setPreview(data); setFileDataUrl(data); };
    reader.readAsDataURL(file);
    setResult(null);
  };

  const isReady = Boolean(fileName && context.myTeam.trim() && context.opponentTeam.trim() && context.myFormation && context.opponentFormation && context.myGoals?.trim() && context.opponentGoals?.trim());

  const run = async () => {
    if (blocked) return;
    if (!isReady) {
      setFormError(tx(lang, 'لازم تدخل: الصورة، اسم فريقك، اسم الخصم، تشكيلتك، تشكيلته، وأهداف كل فريق.', 'Required: image, both teams, both formations, and goals for each side.', 'Falta imagen/equipos/formaciones/goles.', 'Image/équipes/formations/buts requis.')); 
      return;
    }
    const allowed = await onBeforeAnalyze?.();
    if (allowed === false) return;
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 650));
    const normalizedContext = { ...context, scoreline: `${context.myGoals || '0'}-${context.opponentGoals || '0'}` };
    const localResult = analyzeMatchLocally(fileName, normalizedContext, lang);
    const next = await enhanceMatchWithVision({ fileDataUrl, fileName, context: normalizedContext, lang, localResult });
    const accepted = await onAnalyze(next, undefined);
    if (accepted) setResult(next);
    setIsAnalyzing(false);
  };

  return <div className="space-y-4 animate-fade-in pb-16">
    <div className="rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-950/40 to-slate-950/70 p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-[10px] font-black text-fuchsia-200">{tx(lang, 'تحليل شامل • مش تحليل أعمى', 'FULL CONTEXT • not blind analysis', 'CONTEXTO COMPLETO', 'CONTEXTE COMPLET')}</div>
          <h2 className="mt-3 text-xl font-black text-white">{tx(lang, 'محلل المباراة الاحترافي', 'Pro Match Analyst', 'Analista Pro', 'Analyste Pro')}</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{tx(lang, 'الأداة تقارن بيانات فريقك وبيانات الخصم والنتيجة والصورة لتطلع تقرير حقيقي وخطة علاجية داخل نفس الصفحة.', 'Enter teams, formations, score and image to get a grounded report and corrective plan in the same page.', 'Introduce contexto y captura para análisis real.', 'Ajoutez contexte et capture pour une analyse ancrée.')}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center"><Brain className="mx-auto text-fuchsia-300" size={22} /><div className="mt-1 text-[9px] font-black text-slate-300">{usedToday}/{limit === 999 ? '∞' : limit}</div></div>
      </div>
    </div>

    {blocked && <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-4 text-xs font-bold text-amber-200 flex gap-2"><Lock size={16} />{tx(lang, 'وصلت لحد تحليل المباريات اليومي.', 'Daily match analysis limit reached.', 'Límite diario alcanzado.', 'Limite quotidienne atteinte.')}</div>}

    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
      <div className="flex items-center gap-2 text-xs font-black text-white"><Camera size={15}/>{tx(lang, 'مصدر الصورة', 'Image source', 'Imagen', 'Image')}</div>
      <div className="grid grid-cols-2 gap-2">
        <label className="cursor-pointer rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-3 text-center text-[11px] font-black text-fuchsia-100 hover:border-fuchsia-300"><Upload size={16} className="mx-auto mb-1" />{tx(lang, 'رفع صورة', 'Upload', 'Subir', 'Importer')}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => handleFile(e.target.files?.[0])} /></label>
        <label className="cursor-pointer rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-center text-[11px] font-black text-emerald-100 hover:border-emerald-300"><Camera size={16} className="mx-auto mb-1" />{tx(lang, 'تصوير مباشر', 'Take photo', 'Cámara', 'Caméra')}<input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFile(e.target.files?.[0])} /></label>
      </div>
      <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-fuchsia-500/30 bg-slate-950/50 p-4 text-center">
        {preview ? <img src={preview} alt="match preview" className="max-h-52 rounded-xl object-contain" /> : <><Upload className="text-fuchsia-300" size={32} /><span className="mt-2 text-xs font-black text-slate-200">{tx(lang, 'ارفع/صور نتيجة، إحصائيات، أو شاشة نهاية المباراة', 'Upload/capture score, stats or end-match screen', 'Sube resultado/stats', 'Importez résultat/stats')}</span></>}
      </div>
      {fileError && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-[10px] font-bold text-rose-200">{fileError}</div>}
    </div>

    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <TeamCard
        title={tx(lang, 'فريقي', 'My team', 'Mi equipo', 'Mon équipe')}
        accent="emerald"
        team={context.myTeam || ''}
        onTeam={v => update('myTeam', v)}
        teamPlaceholder={tx(lang, 'اسم فريقك', 'Your team name', 'Tu equipo', 'Votre équipe')}
        goals={context.myGoals || ''}
        onGoals={v => update('myGoals', v)}
        goalsPlaceholder={tx(lang, 'أهداف فريقي', 'My goals', 'Mis goles', 'Mes buts')}
        formation={context.myFormation || '4-3-3'}
        onFormation={v => update('myFormation', v)}
        style={context.myStyle || 'Possession Game'}
        onStyle={v => update('myStyle', v)}
      />
      <TeamCard
        title={tx(lang, 'فريق الخصم', 'Opponent team', 'Rival', 'Adversaire')}
        accent="rose"
        team={context.opponentTeam || ''}
        onTeam={v => update('opponentTeam', v)}
        teamPlaceholder={tx(lang, 'اسم الخصم', 'Opponent name', 'Rival', 'Adversaire')}
        goals={context.opponentGoals || ''}
        onGoals={v => update('opponentGoals', v)}
        goalsPlaceholder={tx(lang, 'أهداف الخصم', 'Opponent goals', 'Goles rival', 'Buts adverses')}
        formation={context.opponentFormation || '4-2-3-1'}
        onFormation={v => update('opponentFormation', v)}
        style={context.opponentStyle || 'Quick Counter'}
        onStyle={v => update('opponentStyle', v)}
      />
    </div>

    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-black text-white"><BarChart3 size={15}/>{tx(lang, 'تفاصيل المباراة الاختيارية', 'Optional match details', 'Detalles opcionales', 'Détails optionnels')}</div>
      <div className="grid grid-cols-2 gap-2">
        <Input value={context.possession || ''} onChange={v => update('possession', v)} placeholder={tx(lang,'استحواذ فريقي %','My possession %','Posesión %','Possession %')} inputMode="numeric" />
        <Input value={context.shots || ''} onChange={v => update('shots', v)} placeholder={tx(lang, 'تسديداتي/تسديدات الخصم', 'Shots for/against', 'Tiros', 'Tirs')} />
      </div>
      <textarea value={context.notes || ''} onChange={e => update('notes', e.target.value)} placeholder={tx(lang, 'ملاحظات اختيارية: الهدف من مرتدة؟ ضغط؟ مشكلة دفاعية؟', 'Optional notes: counter goal? pressure? defensive issue?', 'Notas opcionales', 'Notes optionnelles')} className="min-h-20 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-xs text-white outline-none focus:border-fuchsia-400" />
      {formError && <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-[10px] font-bold text-amber-100">{formError}</div>}
      <button disabled={blocked || isAnalyzing} onClick={run} className="w-full rounded-xl bg-fuchsia-600 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-fuchsia-500">{isAnalyzing ? tx(lang, 'جاري تحليل الصورة بالـ Vision AI وبناء تقرير تكتيكي كامل...', 'Running Vision AI and building full tactical report...', 'Analizando con Vision AI...', 'Analyse Vision AI...') : tx(lang, 'حلّل المباراة', 'Analyze match', 'Analizar partido', 'Analyser le match')}</button>
    </div>

    {result && <div className="rounded-2xl border border-fuchsia-500/20 bg-fuchsia-950/20 p-4 space-y-4">
      <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-black text-fuchsia-100">{tx(lang, 'تقرير المباراة الشامل', 'Full match report', 'Reporte completo', 'Rapport complet')}</h3><span className="rounded-full bg-slate-950/60 px-2 py-1 text-[9px] text-slate-300">{result.myTeam} {result.scoreline} {result.opponentTeam}</span></div>
      <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3 text-[12px] font-bold text-white"><Sword size={14} className="inline me-1 text-fuchsia-300" />{result.tacticalVerdict}</div>
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-950/20 p-4">
        <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs font-black text-emerald-100"><Gauge size={15}/>{tx(lang, 'Coach Score', 'Coach Score', 'Coach Score', 'Coach Score')}</div><div className="text-2xl font-black text-white">{result.coachScore}<span className="text-xs text-slate-400">/100</span></div></div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center"><Metric label={tx(lang,'هجوم','Attack','Ataque','Attaque')} value={`${result.attackScore}`}/><Metric label={tx(lang,'دفاع','Defense','Defensa','Défense')} value={`${result.defenseScore}`}/><Metric label={tx(lang,'توازن','Balance','Balance','Équilibre')} value={`${result.balanceScore}`}/></div>
        <div className="mt-2 rounded-xl bg-slate-950/40 p-2 text-[10px] font-bold text-slate-300"><TrendingUp size={13} className="inline me-1 text-emerald-300" />{tx(lang, 'قبل العلاج', 'Before fix', 'Antes', 'Avant')}: {result.beforeScore}/100 → {tx(lang, 'بعد العلاج', 'After fix', 'Después', 'Après')}: {result.afterScore}/100 • {tx(lang, 'المخاطرة', 'Risk', 'Riesgo', 'Risque')}: {result.riskLevel}</div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center"><Metric label={tx(lang,'خطتي','My shape','Mi forma','Mon système')} value={result.myFormation || '—'}/><Metric label={tx(lang,'خطة الخصم','Opp shape','Rival','Adverse')} value={result.opponentFormation || '—'}/><Metric label={tx(lang,'استحواذ','Poss','Pos','Poss')} value={result.possession}/><Metric label={tx(lang,'التسديدات','Shots','Tiros','Tirs')} value={result.shots}/></div>
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-[11px] font-bold text-cyan-100"><FileText size={14} className="inline me-1" />{result.scoreReading}</div>
      <div className="rounded-2xl border border-amber-400/20 bg-amber-950/15 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-black text-amber-100"><Brain size={16}/>{tx(lang, 'تشخيص → علاج → خطة معدلة', 'Diagnosis → Fix → Adjusted tactic', 'Diagnóstico → Solución', 'Diagnostic → Correction')}</div>
        <div className="grid grid-cols-1 gap-2 text-[11px]">
          <div className="rounded-xl bg-slate-950/50 p-3"><b className="text-rose-200">{tx(lang,'ما الذي حدث؟','What happened?','Qué pasó?','Que s’est-il passé ?')}</b><p className="mt-1 text-slate-300">{result.diagnosis[0]}</p></div>
          <div className="rounded-xl bg-slate-950/50 p-3"><b className="text-cyan-200">{tx(lang,'ما العلاج؟','What is the fix?','Solución','Correction')}</b><p className="mt-1 text-slate-300">{result.recommendations[0]}</p></div>
          <div className="rounded-xl bg-slate-950/50 p-3"><b className="text-emerald-200">{tx(lang,'الخطة المعدلة','Adjusted tactic','Táctica ajustada','Tactique ajustée')}</b><p className="mt-1 text-slate-300">{result.recommendedFormation} • {result.counterStrategy}</p></div>
        </div>
      </div>
      <Section icon={<Activity size={14}/>} title={tx(lang, 'المعركة التكتيكية', 'Key tactical battle', 'Batalla táctica', 'Bataille tactique')} rows={[result.keyBattle]} />
      <Section icon={<Shield size={14}/>} title={tx(lang, 'تقرير فريقي', 'My team report', 'Mi equipo', 'Mon équipe')} rows={result.teamReport} />
      <Section icon={<Target size={14}/>} title={tx(lang, 'تقرير الخصم', 'Opponent report', 'Rival', 'Adversaire')} rows={result.opponentReport} />
      <Section icon={<Activity size={14}/>} title={tx(lang, 'سبب المشكلة', 'Why it happened', 'Por qué pasó', 'Pourquoi ?')} rows={result.diagnosis} />
      <Section icon={<Shield size={14}/>} title={tx(lang, 'الأخطاء المكتشفة', 'Mistakes detected', 'Errores detectados', 'Erreurs détectées')} rows={result.mistakes} />
      <Section icon={<Target size={14}/>} title={tx(lang, 'خطة العلاج', 'Corrective plan', 'Plan correctivo', 'Plan correctif')} rows={result.recommendations} />
      <Section icon={<ClipboardCheck size={14}/>} title={tx(lang, 'إعداد المباراة القادمة', 'Next match setup', 'Siguiente partido', 'Prochain match')} rows={result.nextMatchSetup || []} />
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-[11px] font-bold text-emerald-100"><ClipboardCheck size={14} className="inline me-1" />{result.counterStrategy}</div>
      <button onClick={() => { navigator.clipboard?.writeText(`${result.myTeam} ${result.scoreline} ${result.opponentTeam}\nCoach Score: ${result.coachScore}/100\n${result.tacticalVerdict}\n${result.counterStrategy}`); setExported(true); }} className="w-full rounded-xl border border-cyan-400/20 bg-cyan-500/10 py-3 text-xs font-black text-cyan-100 hover:bg-cyan-500/20 flex items-center justify-center gap-2"><Download size={15}/>{exported ? tx(lang, 'تم نسخ كارت التقرير', 'Report card copied', 'Copiado', 'Copié') : tx(lang, 'Export Tactic Card خفيف', 'Export lightweight tactic card', 'Exportar tarjeta', 'Exporter carte')}</button>
      <button onClick={() => onCreatePlan(result)} className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-black text-white hover:bg-white/10 flex items-center justify-center gap-2"><Save size={15}/>{tx(lang, 'افتح العلاج في مولد الخطط', 'Open fix in generator', 'Abrir en generador', 'Ouvrir dans le générateur')}</button>
    </div>}

    {history.length > 0 && <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><h3 className="mb-3 text-xs font-black text-white">{tx(lang, 'تقارير محفوظة', 'Saved reports', 'Informes guardados', 'Rapports enregistrés')}</h3><div className="space-y-2">{history.slice(0, 5).map(item => <button key={item.id} onClick={() => setResult(item)} className="w-full rounded-xl border border-white/5 bg-slate-950/40 p-3 text-start hover:bg-white/5"><div className="text-xs font-bold text-slate-200">{item.myTeam || 'Team'} {item.scoreline} {item.opponentTeam || 'Opponent'} • {item.recommendedFormation}</div><div className="mt-1 text-[9px] text-slate-500">{item.imageName}</div></button>)}</div></div>}
  </div>;
}

function Input({ value, onChange, placeholder, inputMode }: { value: string; onChange: (value: string) => void; placeholder: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'] }) {
  return <input value={value} inputMode={inputMode} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-xs text-white outline-none focus:border-fuchsia-400" />;
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return <select value={value} onChange={e => onChange(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-xs text-white outline-none focus:border-fuchsia-400">{options.map(option => <option key={option} value={option}>{option}</option>)}</select>;
}

function TeamCard({ title, accent, team, onTeam, teamPlaceholder, goals, onGoals, goalsPlaceholder, formation, onFormation, style, onStyle }: {
  title: string; accent: 'emerald' | 'rose'; team: string; onTeam: (value: string) => void; teamPlaceholder: string; goals: string; onGoals: (value: string) => void; goalsPlaceholder: string; formation: string; onFormation: (value: string) => void; style: string; onStyle: (value: string) => void;
}) {
  const accentClass = accent === 'emerald' ? 'border-emerald-400/20 bg-emerald-950/15 text-emerald-100 focus:border-emerald-400' : 'border-rose-400/20 bg-rose-950/15 text-rose-100 focus:border-rose-400';
  return <div className={`rounded-2xl border p-4 space-y-3 ${accentClass}`}>
    <div className="flex items-center gap-2 text-sm font-black"><Users size={16}/>{title}</div>
    <Input value={team} onChange={onTeam} placeholder={teamPlaceholder} />
    <div className="grid grid-cols-2 gap-2">
      <Input value={goals} onChange={onGoals} placeholder={goalsPlaceholder} inputMode="numeric" />
      <Select value={formation} onChange={onFormation} options={FORMATIONS} />
    </div>
    <Select value={style} onChange={onStyle} options={PLAYSTYLES} />
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-950/50 p-2"><div className="text-[9px] text-slate-500">{label}</div><div className="text-xs font-black text-white">{value || '—'}</div></div>;
}

function Section({ icon, title, rows }: { icon: React.ReactNode; title: string; rows: string[] }) {
  return <div className="space-y-2"><div className="flex items-center gap-2 text-xs font-black text-slate-200">{icon}{title}</div><ul className="space-y-1">{rows.map((row, i) => <li key={i} className="rounded-xl bg-slate-950/40 p-2 text-[11px] text-slate-300">{row}</li>)}</ul></div>;
}
