import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eraser, MousePointerClick, Pencil, RotateCcw, Save, UserRoundCog, Layers, ShieldCheck, Route, Wand2 } from 'lucide-react';
import { TacticalBoardState, TacticalPlayer } from '../types';
import { PLAYER_ROLE_OPTIONS, playerRoleAbbreviation, playerRoleLabel } from '../utils/playerRoles';

interface TacticalBoardProps {
  formation: string;
  opponentFormation: string;
  lang: 'ar' | 'en' | 'es' | 'fr';
  value?: TacticalBoardState | null;
  onChange?: (state: TacticalBoardState) => void;
  readOnly?: boolean;
  showOpponent?: boolean;
  compact?: boolean;
}

const ROLE_OPTIONS = PLAYER_ROLE_OPTIONS;
const roleLabel = (role:string, lang:'ar'|'en'|'es'|'fr') => playerRoleLabel(role, lang);

const ui = {
  ar:{move:'تحريك',draw:'رسم',reset:'إعادة التوزيع',yourColor:'لون فريقك',oppColor:'لون الخصم',edit:'تعديل اللاعب المحدد',name:'اسم اللاعب (اختياري)',saved:'يتم حفظ الموقع والدور تلقائيًا مع الخطة.'},
  en:{move:'Move',draw:'Draw',reset:'Reset shape',yourColor:'Your color',oppColor:'Opponent color',edit:'Edit selected player',name:'Player name (optional)',saved:'Position and role are saved automatically with the tactic.'},
  es:{move:'Mover',draw:'Dibujar',reset:'Reiniciar',yourColor:'Color de tu equipo',oppColor:'Color del rival',edit:'Editar jugador',name:'Nombre del jugador (opcional)',saved:'La posición y el rol se guardan automáticamente.'},
  fr:{move:'Déplacer',draw:'Dessiner',reset:'Réinitialiser',yourColor:'Couleur de votre équipe',oppColor:'Couleur adverse',edit:'Modifier le joueur',name:'Nom du joueur (facultatif)',saved:'La position et le rôle sont enregistrés automatiquement.'}
};

function coordinates(form: string, opponent: boolean): Array<Pick<TacticalPlayer, 'role' | 'x' | 'y'>> {
  const f = form.replace(/\s+/g, '').split('(')[0] || '4-3-3';
  const flip = (y: number) => opponent ? 100 - y : y;
  const base = (roles: Array<[string, number, number]>) => roles.map(([role, x, y]) => ({ role, x, y: flip(y) }));

  if (f.includes('4-2-3-1')) return base([
    ['GK',50,88],['CB',35,74],['CB',65,74],['LB',15,68],['RB',85,68],
    ['Holding Midfielder',35,56],['Box to Box',65,56],['Winger',15,35],['Winger',85,35],['Advanced Playmaker',50,32],['Poacher',50,15]
  ]);
  if (f.includes('4-4-2')) return base([
    ['GK',50,88],['CB',35,74],['CB',65,74],['LB',15,68],['RB',85,68],
    ['Box to Box',35,48],['Holding Midfielder',65,48],['Wide Midfielder',15,38],['Wide Midfielder',85,38],['Poacher',35,18],['Target Man',65,18]
  ]);
  if (f.includes('3-5-2')) return base([
    ['GK',50,88],['CB',30,75],['Ball Playing Defender',50,77],['CB',70,75],
    ['Wingback',12,48],['Wingback',88,48],['Holding Midfielder',35,54],['Box to Box',65,54],['Advanced Playmaker',50,35],['Poacher',35,18],['Target Man',65,18]
  ]);
  if (f.includes('5-3-2') || f.includes('5-2-1-2')) return base([
    ['GK',50,88],['CB',30,75],['CB',50,77],['CB',70,75],['Wingback',10,58],['Wingback',90,58],
    ['Holding Midfielder',35,48],['Box to Box',65,48],['Advanced Playmaker',50,34],['Poacher',35,18],['Target Man',65,18]
  ]);
  if (f.includes('4-2-4')) return base([
    ['GK',50,88],['CB',35,74],['CB',65,74],['LB',15,68],['RB',85,68],['Holding Midfielder',35,50],['Box to Box',65,50],
    ['Winger',14,22],['Winger',86,22],['Poacher',38,16],['Target Man',62,16]
  ]);
  if (f.includes('4-3-1-2')) return base([
    ['GK',50,88],['CB',35,74],['CB',65,74],['LB',15,68],['RB',85,68],['Holding Midfielder',50,55],['Box to Box',30,45],['Box to Box',70,45],['Advanced Playmaker',50,32],['Poacher',35,17],['Target Man',65,17]
  ]);
  if (f.includes('3-2-4-1')) return base([
    ['GK',50,88],['CB',28,75],['Ball Playing Defender',50,77],['CB',72,75],
    ['Holding Midfielder',38,58],['Holding Midfielder',62,58],['Wingback',10,38],['Advanced Playmaker',38,35],['Advanced Playmaker',62,35],['Wingback',90,38],['Poacher',50,15]
  ]);
  if (f.includes('4-2-1-3')) return base([
    ['GK',50,88],['CB',35,74],['CB',65,74],['LB',15,68],['RB',85,68],
    ['Holding Midfielder',35,55],['Box to Box',65,55],['Advanced Playmaker',50,38],['Winger',14,22],['Winger',86,22],['Poacher',50,14]
  ]);
  if (f.includes('4-3-2-1')) return base([
    ['GK',50,88],['CB',35,74],['CB',65,74],['LB',15,68],['RB',85,68],['Holding Midfielder',50,55],['Box to Box',30,46],['Box to Box',70,46],['Inside Forward',35,30],['Inside Forward',65,30],['Poacher',50,15]
  ]);
  return base([
    ['GK',50,88],['CB',35,74],['CB',65,74],['LB',15,68],['RB',85,68],['Holding Midfielder',50,54],['Box to Box',30,43],['Advanced Playmaker',70,43],['Winger',15,22],['Winger',85,22],['Poacher',50,15]
  ]);
}

function makeInitial(formation: string, opponentFormation: string, showOpponent = true): TacticalBoardState {
  const own = coordinates(formation, false).map((p, i) => ({ ...p, id: `home-${i}`, name: '', isOpponent: false }));
  const opp = showOpponent ? coordinates(opponentFormation || '4-4-2', true).map((p, i) => ({ ...p, id: `opp-${i}`, name: '', isOpponent: true })) : [];
  return { players: [...own, ...opp], teamColor: '#8b5cf6', opponentColor: '#ef4444' };
}

export default function TacticalBoard({ formation, opponentFormation, lang, value, onChange, readOnly = false, showOpponent = true, compact = false }: TacticalBoardProps) {
  const copy = ui[lang];
  const [board, setBoard] = useState<TacticalBoardState>(() => value?.players?.length ? value : makeInitial(formation, opponentFormation, showOpponent));
  const [dragId, setDragId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'drag' | 'draw'>('drag');
  const [drawColor, setDrawColor] = useState('#facc15');
  const [phase, setPhase] = useState<'base' | 'possession' | 'defence' | 'transition'>('base');
  const formationKeyRef = useRef(`${formation}|${opponentFormation}|${showOpponent}`);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const moveFrame = useRef<number | null>(null);
  const pendingMove = useRef<{ x: number; y: number } | null>(null);

  const selected = useMemo(() => board.players.find(p => p.id === selectedId) || null, [board.players, selectedId]);
  const visiblePlayers = useMemo(() => board.players.filter(p => showOpponent || !p.isOpponent), [board.players, showOpponent]);

  const emit = (next: TacticalBoardState) => {
    setBoard(next);
    onChange?.(next);
  };

  const reset = () => {
    const next = makeInitial(formation, opponentFormation, showOpponent);
    clearLines();
    emit(next);
    setSelectedId(null);
  };

  useEffect(() => {
    const key = `${formation}|${opponentFormation}|${showOpponent}`;
    const formationChanged = formationKeyRef.current !== key;
    if (formationChanged) {
      formationKeyRef.current = key;
      if (value?.players?.length) {
        // V101 Final Plan Lock: when a locked board is supplied, never rebuild it
        // from formation text because that was the root cause of plan/card drift.
        setBoard(value);
        setSelectedId(null);
        return;
      }
      const next = makeInitial(formation, opponentFormation, showOpponent);
      next.teamColor = value?.teamColor || board.teamColor;
      next.opponentColor = value?.opponentColor || board.opponentColor;
      clearLines();
      setBoard(next);
      onChange?.(next);
      setSelectedId(null);
      return;
    }
    if (value?.players?.length) {
      setBoard(value);
      if (value.drawingDataUrl && canvasRef.current) {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (!canvas || !ctx) return;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = value.drawingDataUrl;
      }
    } else {
      setBoard(makeInitial(formation, opponentFormation, showOpponent));
    }
  }, [formation, opponentFormation, showOpponent, value]);

  useEffect(() => {
    const resize = () => {
      if (!canvasRef.current || !wrapRef.current) return;
      const previous = canvasRef.current.toDataURL();
      canvasRef.current.width = wrapRef.current.clientWidth;
      canvasRef.current.height = wrapRef.current.clientHeight;
      if (previous && previous !== 'data:,') {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (!canvas || !ctx) return;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = previous;
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      if (moveFrame.current !== null) cancelAnimationFrame(moveFrame.current);
    };
  }, []);

  const updatePlayer = (id: string, patch: Partial<TacticalPlayer>) => emit({ ...board, players: board.players.map(p => p.id === id ? { ...p, ...patch } : p) });

  const move = (clientX: number, clientY: number) => {
    if (!dragId || !wrapRef.current || readOnly) return;
    const r = wrapRef.current.getBoundingClientRect();
    pendingMove.current = {
      x: Math.max(4, Math.min(96, ((clientX - r.left) / r.width) * 100)),
      y: Math.max(4, Math.min(96, ((clientY - r.top) / r.height) * 100))
    };
    if (moveFrame.current !== null) return;
    moveFrame.current = requestAnimationFrame(() => {
      const next = pendingMove.current;
      if (next && dragId) updatePlayer(dragId, next);
      pendingMove.current = null;
      moveFrame.current = null;
    });
  };

  const beginDraw = (x: number, y: number) => {
    if (readOnly || mode !== 'draw' || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const r = canvasRef.current.getBoundingClientRect();
    ctx.strokeStyle = drawColor; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - r.left, y - r.top); drawing.current = true;
  };
  const draw = (x: number, y: number) => {
    if (!drawing.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d'); if (!ctx) return;
    const r = canvasRef.current.getBoundingClientRect(); ctx.lineTo(x - r.left, y - r.top); ctx.stroke();
  };
  const endDraw = () => {
    if (!drawing.current || !canvasRef.current) return;
    drawing.current = false;
    emit({ ...board, drawingDataUrl: canvasRef.current.toDataURL('image/png') });
  };
  const clearLines = () => {
    if (!canvasRef.current) return;
    canvasRef.current.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const next = { ...board }; delete next.drawingDataUrl; emit(next);
  };


  const phaseNotes = {
    base: lang === 'ar' ? 'الشكل الأساسي: تأكد أن الفريق لا يترك فراغًا كبيرًا بين الخطوط.' : 'Base shape: keep compact distances between lines.',
    possession: lang === 'ar' ? 'مع الكرة: اصنع مثلثات تمرير حول حامل الكرة ولا ترفع الجهتين معًا.' : 'In possession: create passing triangles and avoid pushing both sides at once.',
    defence: lang === 'ar' ? 'بدون الكرة: احمِ العمق أولًا ثم اضغط على الأطراف.' : 'Out of possession: protect the middle first, then press wide.',
    transition: lang === 'ar' ? 'التحول: أبقِ 2+1 خلف الكرة ضد المرتدات.' : 'Transition: keep a 2+1 rest defence against counters.'
  } as const;

  const quickFix = (type: 'compact' | 'width' | 'protect') => {
    if (readOnly) return;
    const nextPlayers = board.players.map(player => {
      if (player.isOpponent) return player;
      if (type === 'compact') return { ...player, x: 50 + (player.x - 50) * 0.82, y: 50 + (player.y - 50) * 0.92 };
      if (type === 'width') return { ...player, x: player.x < 50 ? Math.max(7, player.x - 5) : Math.min(93, player.x + 5) };
      if (type === 'protect' && /DMF|Holding|Anchor|Midfielder|CB|Defender/i.test(player.role)) return { ...player, y: Math.min(84, Math.max(48, player.y + 4)) };
      return player;
    });
    emit({ ...board, players: nextPlayers });
  };

  return (
    <div className="space-y-3">
      {!readOnly && (
        <div className="glass-card p-3 rounded-xl space-y-3 text-[10px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-200 font-black"><Layers size={14} className="text-violet-300" /> Tactical Board 2.0</div>
            <div className="flex gap-1.5">{(['base','possession','defence','transition'] as const).map(p => <button key={p} type="button" onClick={() => setPhase(p)} className={`px-2 py-1 rounded-lg border ${phase===p?'bg-violet-600 text-white border-violet-400':'bg-white/5 text-slate-400 border-white/5'}`}>{p}</button>)}</div>
          </div>
          <div className="rounded-xl border border-white/5 bg-slate-950/50 p-2 text-[9px] text-slate-300 flex items-start gap-2"><ShieldCheck size={13} className="text-emerald-300 shrink-0 mt-0.5" /><span>{phaseNotes[phase]}</span></div>
          <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1.5">
            <button type="button" aria-label={copy.move} onClick={() => setMode('drag')} className={`px-3 py-2 rounded-lg flex gap-1.5 items-center ${mode === 'drag' ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-300'}`}><MousePointerClick size={13}/>{copy.move}</button>
            <button type="button" aria-label={copy.draw} onClick={() => setMode('draw')} className={`px-3 py-2 rounded-lg flex gap-1.5 items-center ${mode === 'draw' ? 'bg-amber-600 text-white' : 'bg-white/5 text-slate-300'}`}><Pencil size={13}/>{copy.draw}</button>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'draw' && ['#facc15','#ef4444','#38bdf8','#ffffff'].map(c => <button type="button" aria-label={`${copy.draw} ${c}`} key={c} onClick={() => setDrawColor(c)} style={{backgroundColor:c}} className={`w-4 h-4 rounded-full border-2 ${drawColor === c ? 'border-violet-400 scale-125' : 'border-slate-900'}`}/>) }
            <button type="button" aria-label="Clear drawings" onClick={clearLines} className="p-2 rounded-lg bg-white/5 text-slate-300"><Eraser size={13}/></button>
            <button type="button" aria-label={copy.reset} onClick={reset} className="p-2 rounded-lg bg-white/5 text-slate-300 flex gap-1"><RotateCcw size={13}/>{copy.reset}</button>
          </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => quickFix('compact')} className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 py-2 text-slate-200 flex items-center justify-center gap-1"><ShieldCheck size={12}/>{lang==='ar'?'ضغط الشكل':'Compact'}</button>
            <button type="button" onClick={() => quickFix('width')} className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 py-2 text-slate-200 flex items-center justify-center gap-1"><Route size={12}/>{lang==='ar'?'زود العرض':'Add width'}</button>
            <button type="button" onClick={() => quickFix('protect')} className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 py-2 text-slate-200 flex items-center justify-center gap-1"><Wand2 size={12}/>{lang==='ar'?'احمِ العمق':'Protect'}</button>
          </div>
        </div>
      )}

      <div
        ref={wrapRef}
        className={`pitch-container w-full ${compact ? 'h-[230px]' : readOnly ? 'h-[300px]' : 'h-[390px]'} rounded-2xl relative overflow-hidden shadow-2xl select-none`}
        style={{ touchAction: 'none' }}
        onPointerMove={e => { if (mode === 'drag') move(e.clientX, e.clientY); else draw(e.clientX, e.clientY); }}
        onPointerUp={e => { if (wrapRef.current?.hasPointerCapture(e.pointerId)) wrapRef.current.releasePointerCapture(e.pointerId); setDragId(null); endDraw(); }}
        onPointerCancel={() => { setDragId(null); endDraw(); }}
        onPointerLeave={() => { if (!dragId) endDraw(); }}
        onPointerDown={e => beginDraw(e.clientX, e.clientY)}
      >
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[linear-gradient(rgba(255,255,255,.08)_50%,transparent_50%)] bg-[size:100%_42px]"/>
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/70 -translate-y-1/2 pointer-events-none"/>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white/60 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"/>
        <div className="absolute top-0 left-1/2 w-40 h-20 border-2 border-t-0 border-white/50 -translate-x-1/2 pointer-events-none"/>
        <div className="absolute bottom-0 left-1/2 w-40 h-20 border-2 border-b-0 border-white/50 -translate-x-1/2 pointer-events-none"/>
        <div className="absolute inset-x-[12%] top-[30%] h-px border-t border-dashed border-emerald-300/25 pointer-events-none" />
        <div className="absolute inset-x-[12%] bottom-[30%] h-px border-t border-dashed border-rose-300/25 pointer-events-none" />
        {phase === 'possession' && <>
          <div className="absolute left-[18%] top-[48%] h-[26%] w-px bg-emerald-300/30 rotate-[-28deg] pointer-events-none" />
          <div className="absolute right-[18%] top-[48%] h-[26%] w-px bg-emerald-300/30 rotate-[28deg] pointer-events-none" />
          <div className="absolute left-1/2 top-[24%] h-[30%] w-px bg-cyan-300/35 pointer-events-none" />
        </>}
        {phase === 'defence' && <div className="absolute left-[18%] right-[18%] bottom-[26%] h-[22%] rounded-[40%] border-2 border-emerald-300/25 bg-emerald-300/5 pointer-events-none" />}
        {phase === 'transition' && <>
          <div className="absolute left-[12%] top-[42%] h-[18%] w-[28%] rounded-full border border-amber-300/25 bg-amber-300/5 pointer-events-none" />
          <div className="absolute right-[12%] top-[42%] h-[18%] w-[28%] rounded-full border border-amber-300/25 bg-amber-300/5 pointer-events-none" />
        </>}
        <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none"/>
        {visiblePlayers.map(player => {
          const color = player.isOpponent ? board.opponentColor : board.teamColor;
          return <button
            type="button"
            key={player.id}
            data-player-id={player.id}
            aria-label={`${player.isOpponent ? 'Opponent' : 'Team'}: ${player.name || roleLabel(player.role, lang)}`}
            disabled={readOnly}
            tabIndex={readOnly ? -1 : 0}
            onPointerDown={e => { if (readOnly || mode !== 'drag') return; e.preventDefault(); e.stopPropagation(); wrapRef.current?.setPointerCapture(e.pointerId); setSelectedId(player.id); setDragId(player.id); }}
            className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 ${compact ? 'w-7 h-7 text-[7px]' : 'w-9 h-9 text-[8px]'} rounded-full border-2 border-white/80 text-white shadow-lg flex items-center justify-center font-black ${selectedId === player.id ? 'ring-4 ring-yellow-300/60 scale-110' : ''}`}
            style={{left:`${player.x}%`,top:`${player.y}%`,backgroundColor:color}}
            title={player.name ? `${player.name} — ${roleLabel(player.role, lang)}` : roleLabel(player.role, lang)}
          >
            <span className={`flex ${compact ? "max-w-[26px]" : "max-w-[34px]"} flex-col items-center leading-none`}><span className={`${compact ? "max-w-[24px]" : "max-w-[32px]"} truncate`}>{player.name || playerRoleAbbreviation(player.role)}</span>{player.name && !compact && <span className="mt-0.5 text-[6px] opacity-80">{playerRoleAbbreviation(player.role)}</span>}</span>
          </button>;
        })}
      </div>

      {!readOnly && (
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <label className="glass-card rounded-xl p-2 flex items-center justify-between gap-2"><span>{copy.yourColor}</span><input type="color" value={board.teamColor} onChange={e => emit({...board,teamColor:e.target.value})}/></label>
          <label className="glass-card rounded-xl p-2 flex items-center justify-between gap-2"><span>{copy.oppColor}</span><input type="color" value={board.opponentColor} onChange={e => emit({...board,opponentColor:e.target.value})}/></label>
        </div>
      )}

      {!readOnly && selected && (
        <div className="glass-card rounded-2xl p-3 space-y-2 border border-violet-500/30">
          <div className="flex items-center gap-2 text-xs font-black text-violet-300"><UserRoundCog size={15}/>{copy.edit}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input value={selected.name || ''} maxLength={40} onChange={e => updatePlayer(selected.id,{name:e.target.value})} placeholder={copy.name} className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-violet-500"/>
            <select value={selected.role} onChange={e => updatePlayer(selected.id,{role:e.target.value})} className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-violet-500">
              {ROLE_OPTIONS.map(role => <option key={role} value={role}>{roleLabel(role, lang)}</option>)}
            </select>
          </div>
          <div className="text-[9px] text-slate-400 flex items-center gap-1"><Save size={11}/>{copy.saved}</div>
        </div>
      )}
    </div>
  );
}
