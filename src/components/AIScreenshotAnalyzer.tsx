import React, { useMemo, useState } from 'react';
import { Upload, Camera, Sparkles, Target, AlertTriangle, Wand2, Lock, Shield, Brain, Save } from 'lucide-react';
import { SupportedLang } from '../utils/lang';
import { AnalysisMode, ScreenshotAnalysisResult, analyzeScreenshotLocally } from '../utils/aiAnalysisEngine';
import { enhanceScreenshotWithVision } from '../utils/visionAnalysis';

interface Props {
  lang: SupportedLang;
  plan: 'free' | 'pro' | 'elite';
  usedToday: number;
  onAnalyze: (result: ScreenshotAnalysisResult, fileDataUrl?: string) => Promise<boolean> | boolean;
  onBeforeAnalyze?: () => Promise<boolean> | boolean;
  onAutofill: (result: ScreenshotAnalysisResult) => void;
  history: ScreenshotAnalysisResult[];
}

const tx = (lang: SupportedLang, ar: string, en: string, es: string, fr: string) => ({ ar, en, es, fr }[lang]);
const limitFor = (plan: string) => plan === 'elite' ? 999 : plan === 'pro' ? 20 : 1;

const counterPlan = (lang: SupportedLang, result: ScreenshotAnalysisResult) => {
  const style = result.detectedPlaystyle;
  const formation = result.detectedFormation;
  return {
    title: tx(lang, 'الخطة المضادة الجاهزة من نفس الصفحة', 'Ready counter plan on this page', 'Plan de contra listo aquí', 'Plan anti-adversaire prêt ici'),
    formation: result.generatorAutofill.myFormation || '4-2-3-1',
    playstyle: result.generatorAutofill.myStyle || tx(lang, 'متوازن', 'Balanced', 'Equilibrado', 'Équilibré'),
    diagnosis: tx(lang, `الصورة تشير إلى ${formation} بأسلوب ${style}. الأولوية هي إغلاق العمق ثم ضرب المساحة خلف الظهير المتقدم.`, `The image suggests ${formation} with a ${style} approach. Priority: close the center, then attack behind the advanced fullback.`, `La captura sugiere ${formation} con estilo ${style}. Prioridad: cerrar el centro y atacar la espalda del lateral.`, `La capture suggère ${formation} avec un style ${style}. Priorité : fermer l’axe puis attaquer le dos du latéral.`),
    roles: [
      tx(lang, 'DMF: Anchor Man / ارتكاز ثابت أمام قلبي الدفاع', 'DMF: Anchor Man holding in front of the center-backs', 'MCD: Anchor Man delante de los centrales', 'MDC : Anchor Man devant les centraux'),
      tx(lang, 'AMF: Hole Player لاستغلال المساحة بين الخطوط', 'AMF: Hole Player to attack the pocket between the lines', 'MCO: Hole Player entre líneas', 'MOC : Hole Player entre les lignes'),
      tx(lang, 'CF: Goal Poacher أو Advanced Forward للهجوم خلف الدفاع', 'CF/ST: Goal Poacher or Advanced Forward attacking behind', 'DC: Goal Poacher o Advanced Forward', 'BU : Goal Poacher ou Advanced Forward')
    ],
    instructions: [
      tx(lang, 'ثبّت ظهيرًا واحدًا ولا ترفع الظهيرين معًا.', 'Keep one fullback fixed; do not push both fullbacks together.', 'Fija un lateral; no subas ambos laterales.', 'Bloquez un latéral ; ne montez pas les deux.'),
      tx(lang, 'اضغط فقط عند سوء استلام الخصم أو تمريرة للخلف.', 'Press only on bad touches or backward passes.', 'Presiona solo en mal control o pase atrás.', 'Pressez seulement sur mauvais contrôle ou passe arrière.'),
      tx(lang, 'حوّل اللعب سريعًا للطرف الأضعف بعد جذب الضغط.', 'Switch quickly to the weaker side after attracting pressure.', 'Cambia rápido al lado débil tras atraer presión.', 'Renversez vite vers le côté faible après avoir attiré le pressing.')
    ],
    weakness: tx(lang, 'الخطر الأساسي: لو اندفع الظهيران معًا ستظهر مرتدة مباشرة خلفهم.', 'Main risk: if both fullbacks push together, direct counters appear behind them.', 'Riesgo: si suben ambos laterales, habrá contras directas.', 'Risque : si les deux latéraux montent, contres directs dans leur dos.')
  };
};

export default function AIScreenshotAnalyzer({ lang, plan, usedToday, onAnalyze, onBeforeAnalyze, onAutofill, history }: Props) {
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<string | undefined>();
  const [fileDataUrl, setFileDataUrl] = useState<string | undefined>();
  const [mode, setMode] = useState<AnalysisMode>('opponent');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ScreenshotAnalysisResult | null>(null);
  const [fileError, setFileError] = useState('');
  const limit = limitFor(plan);
  const blocked = usedToday >= limit;
  const readyPlan = result ? counterPlan(lang, result) : null;
  const modeLabel = useMemo(() => ({
    squad: tx(lang, 'تشكيلة فريقي', 'My squad', 'Mi plantilla', 'Mon équipe'),
    opponent: tx(lang, 'تشكيلة الخصم', 'Opponent squad', 'Plantilla rival', 'Équipe adverse'),
    formation: tx(lang, 'صورة تشكيل', 'Formation screenshot', 'Captura de formación', 'Capture formation'),
    match_result: tx(lang, 'نتيجة مباراة', 'Match result', 'Resultado', 'Résultat'),
    stats: tx(lang, 'إحصائيات', 'Stats', 'Estadísticas', 'Stats'),
    heatmap: tx(lang, 'خريطة حرارية', 'Heat map', 'Mapa de calor', 'Carte thermique'),
    board: tx(lang, 'سبورة تكتيكية', 'Tactical board', 'Pizarra táctica', 'Tableau tactique')
  }), [lang]);

  const handleFile = (file?: File) => {
    if (!file) return;
    setFileError('');
    if (!['image/png','image/jpeg','image/webp'].includes(file.type)) {
      setFileName(''); setPreview(undefined); setFileDataUrl(undefined); setFileDataUrl(undefined);
      setFileError(tx(lang, 'صيغة الصورة غير مدعومة. استخدم PNG أو JPG أو WEBP.', 'Unsupported image format. Use PNG, JPG or WEBP.', 'Formato no compatible. Usa PNG, JPG o WEBP.', 'Format non pris en charge. Utilisez PNG, JPG ou WEBP.'));
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      setFileName(''); setPreview(undefined); setFileDataUrl(undefined); setFileDataUrl(undefined);
      setFileError(tx(lang, 'حجم الصورة أكبر من 1.5MB. اختر صورة أصغر لتقليل تكلفة التحليل.', 'Image is larger than 1.5MB. Choose a smaller image to reduce analysis cost.', 'La imagen supera 1.5 MB.', 'L’image dépasse 1,5 Mo.'));
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => { const data = String(reader.result); setPreview(data); setFileDataUrl(data); };
    reader.readAsDataURL(file);
    setResult(null);
  };

  const run = async () => {
    if (!fileName || blocked) return;
    const allowed = await onBeforeAnalyze?.();
    if (allowed === false) return;
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 650));
    const localResult = analyzeScreenshotLocally(fileName, mode, lang);
    const next = await enhanceScreenshotWithVision({ fileDataUrl, fileName, mode, lang, localResult });
    const accepted = await onAnalyze(next);
    if (accepted) setResult(next);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 to-slate-950/70 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black text-cyan-200">{tx(lang, 'أداة مستقلة • تحليل + خطة داخل نفس الصفحة', 'STANDALONE • scan + plan on this page', 'INDEPENDIENTE • análisis + plan aquí', 'AUTONOME • analyse + plan ici')}</div>
            <h2 className="mt-3 text-xl font-black text-white">{tx(lang, 'محلل الصور التكتيكي', 'Screenshot Tactical Analyzer', 'Analizador táctico de capturas', 'Analyseur tactique de captures')}</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{tx(lang, 'ارفع صورة أو التقطها بالكاميرا. التحليل والخطة المضادة يظهران هنا مباشرة بدون نقلك لمولد آخر.', 'Upload or capture a screenshot. Diagnosis and counter plan appear here without moving you to another tool.', 'Sube o toma una captura. Diagnóstico y contra plan aquí mismo.', 'Importez ou prenez une capture. Diagnostic et plan ici sans changer d’outil.')}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
            <Camera className="mx-auto text-cyan-300" size={22} />
            <div className="mt-1 text-[9px] font-black text-slate-300">{usedToday}/{limit === 999 ? '∞' : limit}</div>
          </div>
        </div>
      </div>

      {blocked && <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-4 text-xs font-bold text-amber-200 flex gap-2"><Lock size={16} />{tx(lang, 'وصلت لحد التحليل اليومي. الترقية تفتح تحليلات أكثر.', 'Daily analyzer limit reached. Upgrade for more scans.', 'Límite diario alcanzado. Mejora para más análisis.', 'Limite quotidienne atteinte. Passez à une offre supérieure.')}</div>}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
        <select value={mode} onChange={e => setMode(e.target.value as AnalysisMode)} className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-xs text-white outline-none focus:border-cyan-400">
          {(Object.keys(modeLabel) as AnalysisMode[]).map(key => <option key={key} value={key}>{modeLabel[key]}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <label className="cursor-pointer rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-3 text-center text-[11px] font-black text-cyan-100 hover:border-cyan-300">
            <Upload size={16} className="mx-auto mb-1" />{tx(lang, 'رفع صورة', 'Upload', 'Subir', 'Importer')}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
          </label>
          <label className="cursor-pointer rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-center text-[11px] font-black text-emerald-100 hover:border-emerald-300">
            <Camera size={16} className="mx-auto mb-1" />{tx(lang, 'التقاط بالكاميرا', 'Camera capture', 'Cámara', 'Caméra')}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
          </label>
        </div>
        <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-500/30 bg-slate-950/50 p-4 text-center">
          {preview ? <img src={preview} alt="preview" className="max-h-52 rounded-xl object-contain" /> : <><Upload className="text-cyan-300" size={32} /><span className="mt-2 text-xs font-black text-slate-200">{tx(lang, 'ارفع أو التقط صورة للبدء', 'Upload or capture to start', 'Sube o toma una foto', 'Importez ou prenez une photo')}</span><span className="mt-1 text-[10px] text-slate-500">PNG / JPG / WEBP • max 5MB</span></>}
        </div>
        {fileName && <div className="text-[10px] text-slate-400">{fileName}</div>}
        {fileError && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-[10px] font-bold text-rose-200">{fileError}</div>}
        <button disabled={!fileName || blocked || isAnalyzing} onClick={run} className="w-full rounded-xl bg-cyan-600 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-cyan-500">
          {isAnalyzing ? tx(lang, 'جاري تحليل الصورة بالـ Vision AI...', 'Running Vision AI...', 'Analizando con Vision AI...', 'Analyse Vision AI...') : tx(lang, 'حلّل الصورة واصنع الخطة', 'Analyze image and build plan', 'Analizar y crear plan', 'Analyser et créer le plan')}
        </button>
      </div>

      {result && readyPlan && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 space-y-4">
        <div className="flex items-center justify-between"><h3 className="text-sm font-black text-emerald-200">{tx(lang, 'النتيجة والخطة الجاهزة', 'Result and ready plan', 'Resultado y plan listo', 'Résultat et plan prêt')}</h3><span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[9px] font-black text-emerald-300">{result.confidence}%</span></div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-950/50 p-3"><div className="text-[9px] text-slate-500">{tx(lang,'تشكيل الخصم','Opponent shape','Formación rival','Dispositif adverse')}</div><div className="text-base font-black text-white">{result.detectedFormation}</div></div>
          <div className="rounded-xl bg-slate-950/50 p-3"><div className="text-[9px] text-slate-500">{tx(lang,'أسلوب الخصم','Opponent style','Estilo rival','Style adverse')}</div><div className="text-xs font-black text-white">{result.detectedPlaystyle}</div></div>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-950/45 p-3 text-[11px] text-slate-300">{readyPlan.diagnosis}</div>
        <div className="rounded-xl border border-emerald-400/20 bg-slate-950/60 p-3">
          <div className="flex items-center gap-2 text-[10px] font-black text-emerald-200"><Shield size={13}/>{readyPlan.title}</div>
          <div className="mt-2 grid grid-cols-2 gap-2"><div className="rounded-lg bg-white/5 p-2"><span className="block text-[9px] text-slate-500">Formation</span><span className="font-black text-white">{readyPlan.formation}</span></div><div className="rounded-lg bg-white/5 p-2"><span className="block text-[9px] text-slate-500">Playstyle</span><span className="font-black text-white">{readyPlan.playstyle}</span></div></div>
        </div>
        <Section icon={<Target size={14}/>} title={tx(lang, 'الأدوار المطلوبة', 'Required roles', 'Roles necesarios', 'Rôles requis')} rows={readyPlan.roles} />
        <Section icon={<Brain size={14}/>} title={tx(lang, 'تعليمات التنفيذ', 'Execution instructions', 'Instrucciones', 'Consignes')} rows={readyPlan.instructions} />
        <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-3 text-[11px] font-bold text-rose-100"><AlertTriangle size={14} className="inline me-1" />{readyPlan.weakness}</div>
        <button onClick={() => onAutofill(result)} className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-black text-white hover:bg-white/10 flex items-center justify-center gap-2"><Wand2 size={15} />{tx(lang, 'اختياري: افتحها داخل مولد الخطط', 'Optional: open in generator', 'Opcional: abrir en generador', 'Optionnel : ouvrir dans le générateur')}</button>
      </div>}

      {history.length > 0 && <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><h3 className="mb-3 text-xs font-black text-white">{tx(lang, 'آخر التحليلات', 'Recent scans', 'Análisis recientes', 'Analyses récentes')}</h3><div className="space-y-2">{history.slice(0, 5).map(item => <button key={item.id} onClick={() => setResult(item)} className="w-full rounded-xl border border-white/5 bg-slate-950/40 p-3 text-start hover:bg-white/5"><div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-200">{item.detectedFormation} • {item.detectedPlaystyle}</span><Sparkles size={13} className="text-cyan-300" /></div><div className="mt-1 text-[9px] text-slate-500">{item.imageName}</div></button>)}</div></div>}
    </div>
  );
}

function Section({ icon, title, rows }: { icon: React.ReactNode; title: string; rows: string[] }) {
  return <div className="space-y-2"><div className="flex items-center gap-2 text-xs font-black text-slate-200">{icon}{title}</div><ul className="space-y-1">{rows.map((row, i) => <li key={i} className="rounded-xl bg-slate-950/40 p-2 text-[11px] text-slate-300">{row}</li>)}</ul></div>;
}
