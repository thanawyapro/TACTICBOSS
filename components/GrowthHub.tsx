import React from 'react';
import { Award, CalendarDays, CheckCircle2, Flame, Lock, Sparkles, Trophy, Zap } from 'lucide-react';
import { DailyChallenge, LevelInfo, ProgressionState, challengeCompleted } from '../utils/growthEngine';
import { SupportedLang } from '../utils/lang';

interface Props {
  lang: SupportedLang;
  progression: ProgressionState;
  level: LevelInfo;
  challenges: DailyChallenge[];
  compact?: boolean;
  onAction: (action: DailyChallenge['action']) => void;
}

export default function GrowthHub({ lang, progression, level, challenges, compact = false, onAction }: Props) {
  const text = (ar:string,en:string,es:string,fr:string) => ({ar,en,es,fr}[lang]);
  const tierLabel = (tier: DailyChallenge['tier']) => tier === 'easy' ? text('سهل','Easy','Fácil','Facile') : tier === 'medium' ? text('متوسط','Medium','Medio','Moyen') : text('صعب','Hard','Difícil','Difficile');

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-br from-violet-600/20 via-slate-950/80 to-emerald-500/15 border border-violet-400/20 rounded-2xl p-4 space-y-3 overflow-hidden relative">
        <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="flex items-start justify-between relative">
          <div>
            <div className="flex items-center gap-2">
              <Trophy size={17} className="text-amber-400" />
              <h3 className="text-sm font-black text-white">{level.title}</h3>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{text('تقدمك التكتيكي اليومي','Your daily tactical progression','Tu progreso táctico diario','Votre progression tactique quotidienne')}</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-violet-300 font-mono">{level.level}</div>
            <div className="text-[8px] text-slate-500 uppercase">LEVEL</div>
          </div>
        </div>
        <div className="relative">
          <div className="h-2.5 rounded-full bg-slate-950/80 overflow-hidden border border-white/5">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-all duration-500" style={{width:`${level.progress}%`}} />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono"><span>{progression.xp} XP</span><span>{level.nextLevelXp} XP</span></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-950/45 border border-white/5 rounded-xl p-2.5 flex items-center gap-2">
            <Flame size={15} className="text-orange-400" />
            <div><div className="text-sm font-black text-white">{progression.streak}</div><div className="text-[8px] text-slate-500">{text('سلسلة أيام','Day streak','Racha diaria','Série quotidienne')}</div></div>
          </div>
          <div className="bg-slate-950/45 border border-white/5 rounded-xl p-2.5 flex items-center gap-2">
            <Award size={15} className="text-emerald-400" />
            <div><div className="text-sm font-black text-white">{progression.completedChallengeIds.length}</div><div className="text-[8px] text-slate-500">{text('مهمات مكتملة','Missions done','Misiones completadas','Missions terminées')}</div></div>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><CalendarDays size={16} className="text-emerald-400"/><h3 className="text-xs font-black text-white">{text('تحديات اليوم','Daily Challenges','Desafíos diarios','Défis quotidiens')}</h3></div>
            <span className="text-[9px] text-emerald-300 bg-emerald-500/10 border border-emerald-400/20 px-2 py-1 rounded-full">+XP</span>
          </div>
          <div className="space-y-2">
            {challenges.map(challenge => {
              const completed = challengeCompleted(challenge, progression);
              return <button key={challenge.id} type="button" disabled={completed} onClick={() => onAction(challenge.action)} className={`w-full text-start p-3 rounded-xl border transition flex items-center gap-3 ${completed ? 'bg-emerald-500/10 border-emerald-400/20 opacity-75' : 'bg-slate-950/50 border-white/5 hover:border-violet-400/30'}`}>
                <span className={`p-2 rounded-xl ${completed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-violet-500/10 text-violet-300'}`}>{completed ? <CheckCircle2 size={16}/> : <Zap size={16}/>}</span>
                <span className="flex-1"><span className="block text-[11px] font-extrabold text-slate-100">{challenge.title}</span><span className="block text-[9px] text-slate-400 mt-0.5">{challenge.description}</span></span>
                <span className="text-end"><span className="block text-[10px] font-black text-amber-300">+{challenge.xp} XP</span><span className="block text-[8px] text-slate-500">{tierLabel(challenge.tier)}</span></span>
              </button>
            })}
          </div>
          <div className="flex items-center gap-2 text-[9px] text-slate-500"><Sparkles size={12}/><span>{text('أكمل المهمات يوميًا لرفع مستواك وفتح مزايا مستقبلية.','Complete missions daily to level up and unlock future benefits.','Completa misiones cada día para subir de nivel.','Terminez les missions chaque jour pour progresser.')}</span></div>
        </div>
      )}
    </div>
  );
}
