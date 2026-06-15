import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, Check, Copy, ExternalLink, Flag, Heart, Loader2, Search, Share2, Sparkles, Trophy, Upload, Users } from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';
import type { SavedTactic } from '../types';
import type { SupportedLang } from '../utils/lang';
import { hasBlockedLanguage, sanitizeUserText, moderationMessage } from '../utils/contentModeration';

type CommunityTactic = {
  id: string;
  creator_id: string;
  creator_name: string;
  title: string;
  description: string;
  game: string;
  formation: string;
  playstyle: string;
  tactic_data: Record<string, unknown>;
  likes_count: number;
  saves_count: number;
  uses_count: number;
  score: number;
  created_at: string;
  liked_by_me?: boolean;
  saved_by_me?: boolean;
};

type Props = {
  userId: string;
  coachName: string;
  lang: SupportedLang;
  savedTactics: SavedTactic[];
  onUseTactic: (tactic: SavedTactic) => void;
  onToast: (message: string) => void;
};

const CACHE_MS = 15 * 60 * 1000;
const cacheKey = (userId: string, tab: string) => `tb_community_cache:${userId}:${tab}`;

const text = (lang: SupportedLang, ar: string, en: string, es = en, fr = en) => ({ ar, en, es, fr }[lang]);

const buildShareCard = async (item: CommunityTactic, url: string): Promise<File> => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('CANVAS_UNAVAILABLE');
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
  gradient.addColorStop(0, '#111827'); gradient.addColorStop(0.5, '#4c1d95'); gradient.addColorStop(1, '#064e3b');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1080);
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(70, 70, 940, 940);
  ctx.fillStyle = '#c4b5fd'; ctx.font = '700 38px sans-serif'; ctx.fillText('TACTIC BOSS • COMMUNITY', 110, 150);
  ctx.fillStyle = '#ffffff'; ctx.font = '900 76px sans-serif'; ctx.fillText(item.title.slice(0, 24), 110, 295);
  ctx.fillStyle = '#a7f3d0'; ctx.font = '800 54px sans-serif'; ctx.fillText(`${item.formation}  •  ${item.playstyle}`.slice(0, 34), 110, 400);
  ctx.fillStyle = '#fde68a'; ctx.font = '900 130px sans-serif'; ctx.fillText(String(item.score), 110, 620);
  ctx.fillStyle = '#fef3c7'; ctx.font = '700 32px sans-serif'; ctx.fillText('TACTICAL SCORE', 110, 675);
  ctx.fillStyle = '#e2e8f0'; ctx.font = '700 34px sans-serif'; ctx.fillText(`Coach: ${item.creator_name}`.slice(0, 40), 110, 790);
  ctx.fillStyle = '#cbd5e1'; ctx.font = '500 25px sans-serif'; ctx.fillText(url.slice(0, 68), 110, 920);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('CARD_FAILED')), 'image/png'));
  return new File([blob], `tactic-boss-${item.id}.png`, { type: 'image/png' });
};

const mapCommunityToSaved = (row: CommunityTactic): SavedTactic => {
  const data = row.tactic_data || {};
  return {
    id: crypto.randomUUID(),
    title: row.title,
    game: row.game,
    myFormation: String(data.myFormation || row.formation || '4-3-3'),
    oppFormation: String(data.oppFormation || '4-2-3-1'),
    opponentStyle: String(data.opponentStyle || 'متوازن'),
    myStyle: String(data.myStyle || row.playstyle || 'متوازن'),
    matchState: String(data.matchState || 'بداية الماتش'),
    myTeam: String(data.myTeam || ''),
    oppTeam: String(data.oppTeam || ''),
    notes: String(data.notes || row.description || ''),
    result: (data.result || {}) as SavedTactic['result'],
    board: (data.board || null) as SavedTactic['board'],
    createdAt: new Date().toISOString()
  };
};

export default function CommunityLite({ userId, coachName, lang, savedTactics, onUseTactic, onToast }: Props) {
  const [items, setItems] = useState<CommunityTactic[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'trending' | 'new' | 'saved'>('trending');
  const [publishOpen, setPublishOpen] = useState(false);
  const [selectedTacticId, setSelectedTacticId] = useState(savedTactics[0]?.id || '');
  const [publishTitle, setPublishTitle] = useState('');
  const [publishDescription, setPublishDescription] = useState('');
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [claimCode, setClaimCode] = useState(() => localStorage.getItem('tb_pending_referral') || '');

  const load = async (force = false) => {
    const cached = localStorage.getItem(cacheKey(userId, tab));
    if (!force && cached) {
      try {
        const parsed = JSON.parse(cached) as { at: number; items: CommunityTactic[]; referralCode?: string };
        if (Date.now() - parsed.at < CACHE_MS) {
          setItems(parsed.items);
          setReferralCode(parsed.referralCode || '');
          setLoading(false);
          return;
        }
      } catch { /* ignore cache */ }
    }

    setLoading(true);
    const sb = getSupabase();
    if (!sb) { setLoading(false); return; }
    const { data, error } = await sb.rpc('community_feed_lite', { p_limit: 12, p_offset: 0, p_mode: tab });
    if (error) onToast(text(lang, 'تعذر تحميل خطط المجتمع الآن. حاول مرة أخرى بعد قليل.', 'Community tactics could not load right now. Please try again shortly.'));
    let next = Array.isArray(data) ? data as CommunityTactic[] : [];
    const sharedId = new URLSearchParams(window.location.search).get('community');
    if (sharedId && !next.some(item => item.id === sharedId)) {
      const { data: sharedData } = await sb.rpc('community_tactic_by_id_lite', { p_tactic_id: sharedId });
      const shared = Array.isArray(sharedData) ? sharedData[0] as CommunityTactic | undefined : undefined;
      if (shared) next = [shared, ...next].slice(0, 12);
    }
    let code = referralCode;
    if (!code) {
      const { data: codeData } = await sb.rpc('get_my_referral_code');
      code = typeof codeData === 'string' ? codeData : '';
      setReferralCode(code);
    }
    setItems(next);
    localStorage.setItem(cacheKey(userId, tab), JSON.stringify({ at: Date.now(), items: next, referralCode: code }));
    setLoading(false);
  };

  useEffect(() => { void load(); }, [tab, userId]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(item => `${item.title} ${item.creator_name} ${item.game} ${item.formation} ${item.playstyle}`.toLowerCase().includes(needle));
  }, [items, query]);

  const runAction = async (id: string, rpc: string, success: string) => {
    const sb = getSupabase();
    if (!sb) return;
    setWorkingId(id);
    const { data, error } = await sb.rpc(rpc, { p_tactic_id: id });
    setWorkingId(null);
    if (error) return onToast(error.message);
    onToast(success);

    if (rpc === 'toggle_community_like_lite' || rpc === 'toggle_community_save_lite') {
      const added = data === true;
      setItems(current => current.map(item => {
        if (item.id !== id) return item;
        const likes = rpc === 'toggle_community_like_lite' ? Math.max(0, item.likes_count + (added ? 1 : -1)) : item.likes_count;
        const saves = rpc === 'toggle_community_save_lite' ? Math.max(0, item.saves_count + (added ? 1 : -1)) : item.saves_count;
        return { ...item, likes_count: likes, saves_count: saves, score: likes * 2 + saves * 3 + item.uses_count * 5, liked_by_me: rpc === 'toggle_community_like_lite' ? added : item.liked_by_me, saved_by_me: rpc === 'toggle_community_save_lite' ? added : item.saved_by_me };
      }));
    }
    localStorage.removeItem(cacheKey(userId, tab));
  };

  const publish = async () => {
    const selected = savedTactics.find(item => item.id === selectedTacticId);
    if (!selected) return onToast(text(lang, 'اختر خطة محفوظة أولًا.', 'Choose a saved tactic first.'));
    if (hasBlockedLanguage(publishTitle) || hasBlockedLanguage(publishDescription) || hasBlockedLanguage(coachName)) {
      return onToast(moderationMessage(lang));
    }
    const sb = getSupabase();
    if (!sb) return;
    setWorkingId('publish');
    const { error } = await sb.rpc('publish_community_tactic_lite', {
      p_saved_tactic_id: selected.id,
      p_title: sanitizeUserText(publishTitle, 80) || selected.title,
      p_description: sanitizeUserText(publishDescription, 500),
      p_creator_name: sanitizeUserText(coachName, 60) || 'Coach'
    });
    setWorkingId(null);
    if (error) return onToast(error.message);
    setPublishOpen(false);
    setPublishTitle('');
    setPublishDescription('');
    localStorage.removeItem(cacheKey(userId, tab));
    onToast(text(lang, 'تم نشر الخطة في المجتمع.', 'Tactic published to the community.'));
    await load(true);
  };

  const useTactic = async (item: CommunityTactic) => {
    const sb = getSupabase();
    if (sb) void sb.rpc('use_community_tactic_lite', { p_tactic_id: item.id });
    onUseTactic(mapCommunityToSaved(item));
  };

  const share = async (item: CommunityTactic) => {
    const url = `${window.location.origin}${window.location.pathname}?community=${item.id}&ref=${referralCode}`;
    const message = `${item.title} — ${item.formation} • ${item.playstyle}`;
    try {
      const card = await buildShareCard(item, url);
      if (navigator.share && navigator.canShare?.({ files: [card] })) await navigator.share({ title: item.title, text: message, url, files: [card] });
      else if (navigator.share) await navigator.share({ title: item.title, text: message, url });
      else await navigator.clipboard.writeText(`${message}\n${url}`);
      onToast(text(lang, 'تم إنشاء كارت المشاركة محليًا وتجهيز الرابط.', 'Share card created locally and link is ready.'));
    } catch { /* user canceled or browser fallback unavailable */ }
  };

  const claimReferral = async () => {
    if (!claimCode.trim()) return;
    const sb = getSupabase();
    if (!sb) return;
    setWorkingId('referral');
    const { error } = await sb.rpc('claim_referral_lite', { p_code: claimCode.trim().toUpperCase() });
    setWorkingId(null);
    if (error) return onToast(error.message);
    localStorage.removeItem('tb_pending_referral');
    setClaimCode('');
    onToast(text(lang, 'تم تأكيد الإحالة وإضافة المكافأة.', 'Referral confirmed and reward added.'));
  };

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      <section className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/15 via-slate-950 to-emerald-500/10 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-[10px] font-black text-violet-200"><Users size={13}/> COMMUNITY LITE</div>
            <h2 className="text-xl font-black text-white">{text(lang, 'خطط المجتمع', 'Community Tactics', 'Tácticas de la comunidad', 'Tactiques communautaires')}</h2>
            <p className="mt-1 text-[11px] leading-5 text-slate-400">{text(lang, 'اكتشف خطط المدربين، استخدمها، وشارك أفضل أفكارك بدون تحميل زائد.', 'Discover, use and share coach tactics with a lightweight community experience.')}</p>
          </div>
          <button onClick={() => setPublishOpen(v => !v)} className="rounded-2xl bg-violet-600 px-4 py-3 text-[11px] font-black text-white hover:bg-violet-500"><Upload size={15} className="mb-1 mx-auto"/>{text(lang, 'انشر', 'Publish')}</button>
        </div>
      </section>

      <section className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/5 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-fuchsia-100">{text(lang, 'Trending Counter Cards', 'Trending Counter Cards', 'Counter Cards populares', 'Counter Cards tendance')}</h3>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{text(lang, 'أسرع كروت قابلة للمشاركة اليوم: مشكلة الخصم + الحل + أوامر فورية.', 'Fast shareable cards today: rival problem + solution + quick orders.', 'Tarjetas rápidas.', 'Cartes rapides.')}</p>
          </div>
          <Sparkles size={18} className="text-fuchsia-200" />
        </div>
        <div className="grid grid-cols-1 gap-2">
          {[
            [text(lang,'ضد الضغط العالي','Vs high press'), '4-2-3-1', 'Possession → Direct outlet'],
            [text(lang,'ضد جناح سريع','Vs fast winger'), '4-4-2', 'Fullback Defensive'],
            [text(lang,'ضد دفاع متأخر','Vs low block'), '3-2-4-1', 'Width ثم العمق'],
          ].map(([title, shape, cue]) => (
            <div key={title} className="rounded-2xl border border-white/8 bg-slate-950/60 p-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black text-white">{title}</div>
                <div className="mt-1 text-[10px] text-slate-400">{cue}</div>
              </div>
              <div className="rounded-xl bg-fuchsia-500/10 px-3 py-2 text-xs font-black text-fuchsia-200 font-mono">{shape}</div>
            </div>
          ))}
        </div>
      </section>

      {publishOpen && <section className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
        <h3 className="text-sm font-black text-white">{text(lang, 'نشر خطة محفوظة', 'Publish a saved tactic')}</h3>
        <select value={selectedTacticId} onChange={e => setSelectedTacticId(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-xs text-white">
          <option value="">{text(lang, 'اختر خطة', 'Choose tactic')}</option>
          {savedTactics.map(tactic => <option key={tactic.id} value={tactic.id}>{tactic.title} — {tactic.myFormation}</option>)}
        </select>
        <input value={publishTitle} onChange={e => setPublishTitle(e.target.value)} maxLength={80} placeholder={text(lang, 'عنوان اختياري', 'Optional title')} className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-xs text-white"/>
        <textarea value={publishDescription} onChange={e => setPublishDescription(e.target.value)} maxLength={500} placeholder={text(lang, 'اشرح طريقة استخدام الخطة باختصار', 'Briefly explain how to use the tactic')} className="min-h-24 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-xs text-white"/>
        <button disabled={workingId === 'publish'} onClick={publish} className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-black text-white disabled:opacity-50">{workingId === 'publish' ? <Loader2 size={16} className="mx-auto animate-spin"/> : text(lang, 'نشر الخطة', 'Publish tactic')}</button>
      </section>}

      <section className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4">
        <div className="flex items-center gap-2 text-amber-200"><Sparkles size={16}/><h3 className="text-xs font-black">{text(lang, 'رابط الإحالة الخاص بك', 'Your referral link')}</h3></div>
        <div className="mt-3 flex gap-2"><code className="flex-1 rounded-xl bg-slate-950 px-3 py-3 text-xs font-black text-amber-300">{referralCode || '—'}</code><button onClick={() => referralCode && navigator.clipboard.writeText(`${window.location.origin}?ref=${referralCode}`)} className="rounded-xl border border-white/10 bg-white/5 px-4 text-slate-200"><Copy size={15}/></button></div>
        <div className="mt-3 flex gap-2"><input value={claimCode} onChange={e => setClaimCode(e.target.value)} placeholder={text(lang, 'عندك كود دعوة؟', 'Have an invite code?')} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-xs text-white"/><button onClick={claimReferral} disabled={workingId === 'referral'} className="rounded-xl bg-amber-500 px-4 text-xs font-black text-slate-950">{text(lang, 'تأكيد', 'Claim')}</button></div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['trending','new','saved'] as const).map(value => <button key={value} onClick={() => setTab(value)} className={`whitespace-nowrap rounded-full px-4 py-2 text-[10px] font-black ${tab === value ? 'bg-violet-600 text-white' : 'border border-white/10 bg-white/5 text-slate-400'}`}>{value === 'trending' ? text(lang,'الأكثر انتشارًا','Trending') : value === 'new' ? text(lang,'الأحدث','Newest') : text(lang,'المحفوظة','Saved')}</button>)}
      </div>
      <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"><Search size={15} className="text-slate-500"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={text(lang,'ابحث بالتشكيل أو اللعبة أو المدرب','Search formation, game or coach')} className="w-full bg-transparent text-xs text-white outline-none"/></label>

      {loading ? <div className="py-12 text-center"><Loader2 className="mx-auto animate-spin text-violet-400"/></div> : filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-500">{text(lang,'لا توجد خطط بعد. كن أول من ينشر خطة.','No tactics yet. Be the first to publish.')}</div> : <div className="space-y-3">{filtered.map(item => <article key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
        <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-black text-white">{item.title}</h3><div className="mt-1 text-[10px] text-slate-500">{item.creator_name} • {item.game}</div></div><div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-black text-amber-300"><Trophy size={11}/>{item.score}</div></div>
        <p className="mt-3 line-clamp-3 text-[11px] leading-5 text-slate-400">{item.description || text(lang,'خطة مجتمعية جاهزة للتجربة.','Community tactic ready to try.')}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold"><span className="rounded-full bg-violet-500/10 px-2 py-1 text-violet-300">{item.formation}</span><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">{item.playstyle}</span></div>
        <div className="mt-4 grid grid-cols-5 gap-2">
          <button disabled={workingId === item.id} onClick={() => runAction(item.id,'toggle_community_like_lite',text(lang,'تم تحديث الإعجاب.','Like updated.'))} className={`rounded-xl border py-2 text-[10px] font-bold ${item.liked_by_me ? 'border-rose-400/40 bg-rose-500/10 text-rose-300' : 'border-white/10 text-slate-400'}`}><Heart size={13} className="mx-auto mb-1"/>{item.likes_count}</button>
          <button disabled={workingId === item.id} onClick={() => runAction(item.id,'toggle_community_save_lite',text(lang,'تم تحديث الحفظ.','Save updated.'))} className={`rounded-xl border py-2 text-[10px] font-bold ${item.saved_by_me ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300' : 'border-white/10 text-slate-400'}`}><Bookmark size={13} className="mx-auto mb-1"/>{item.saves_count}</button>
          <button onClick={() => useTactic(item)} className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 py-2 text-[10px] font-bold text-cyan-300"><Check size={13} className="mx-auto mb-1"/>{item.uses_count}</button>
          <button onClick={() => share(item)} className="rounded-xl border border-white/10 py-2 text-[10px] font-bold text-slate-400"><Share2 size={13} className="mx-auto mb-1"/>{text(lang,'شارك','Share')}</button>
          <button onClick={() => runAction(item.id,'report_community_tactic_lite',text(lang,'تم إرسال البلاغ.','Report submitted.'))} className="rounded-xl border border-white/10 py-2 text-[10px] font-bold text-slate-500"><Flag size={13} className="mx-auto mb-1"/>{text(lang,'بلاغ','Report')}</button>
        </div>
      </article>)}</div>}
      <button onClick={() => load(true)} className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-slate-300"><ExternalLink size={14} className="inline me-2"/>{text(lang,'تحديث القائمة','Refresh feed')}</button>
    </div>
  );
}
