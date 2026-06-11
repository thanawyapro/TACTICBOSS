import { TacticalBoardState, TacticalPlayer } from '../types';
import { officialDnaForGame } from './officialGameDNA';

function parseFormation(formation: string): number[] {
  const nums = (formation || '4-3-3').replace(/\s+/g, '').split('(')[0].match(/\d+/g)?.map(Number) || [4, 3, 3];
  return nums.filter(n => n > 0 && n <= 5);
}

function yLines(count: number, opponent: boolean): number[] {
  const own = count === 3 ? [72, 48, 18] : count === 4 ? [73, 57, 38, 17] : [74, 60, 45, 30, 16];
  return opponent ? own.map(y => 100 - y) : own;
}

function spread(count: number, width: 'narrow' | 'normal' | 'wide', defence = false): number[] {
  if (count === 1) return [50];
  if (defence && count === 4) return [15, 36, 64, 85];
  if (defence && count === 5) return [9, 28, 50, 72, 91];
  const min = width === 'wide' ? 8 : width === 'narrow' ? 25 : 18;
  const max = width === 'wide' ? 92 : width === 'narrow' ? 75 : 82;
  return Array.from({ length: count }, (_, i) => min + ((max - min) / (count - 1)) * i);
}

function roleForLine(line: number, total: number, count: number, family: string): string[] {
  if (line === 0) {
    if (count === 3) return family.includes('FC_IQ') ? ['Defender', 'Ball-Playing Defender', 'Defender'] : ['CB', 'CB', 'CB'];
    if (count === 5) return family.includes('FC_IQ') ? ['Fullback', 'Defender', 'Ball-Playing Defender', 'Defender', 'Fullback'] : ['LB', 'CB', 'CB', 'CB', 'RB'];
    return family.includes('FC_IQ') ? ['Fullback', 'Defender', 'Ball-Playing Defender', 'Fullback'].slice(0, count) : ['LB', 'CB', 'CB', 'RB'].slice(0, count);
  }
  if (line === total - 1) {
    if (count === 1) return family.includes('FC_IQ') ? ['Advanced Forward'] : ['CF'];
    if (count === 2) return family.includes('FC_IQ') ? ['False 9', 'Advanced Forward'] : ['SS', 'CF'];
    return family.includes('FC_IQ') ? ['Inside Forward', 'Advanced Forward', 'Winger'].slice(0, count) : ['LWF', 'CF', 'RWF'].slice(0, count);
  }
  if (family.includes('FC_IQ')) {
    if (count === 1) return ['Holding'];
    if (count === 2) return line === 1 ? ['Holding', 'Box-to-Box'] : ['Playmaker', 'Shadow Striker'];
    if (count === 3) return line === 1 ? ['Box-to-Box', 'Holding', 'Playmaker'] : ['Wide Midfielder', 'Playmaker', 'Wide Midfielder'];
    return ['Wide Midfielder', 'Box-to-Box', 'Holding', 'Wide Midfielder'].slice(0, count);
  }
  if (count === 1) return ['DMF'];
  if (count === 2) return line === 1 ? ['DMF', 'CMF'] : ['AMF', 'SS'];
  if (count === 3) return line === 1 ? ['CMF', 'DMF', 'CMF'] : ['LMF', 'AMF', 'RMF'];
  return ['LMF', 'CMF', 'CMF', 'RMF'].slice(0, count);
}

function widthFor(gameId: string): 'narrow' | 'normal' | 'wide' {
  if (/fifa-19|fifa-20|pes-2021|pes-2019/.test(gameId)) return 'narrow';
  if (/ea-fc-24|efootball-modern|efootball-2024|pes-2020/.test(gameId)) return 'wide';
  return 'normal';
}

function adjustY(gameId: string, role: string, y: number, opponent: boolean): number {
  const dir = opponent ? -1 : 1;
  if (/ea-fc-25|ea-fc-26/.test(gameId) && /Inside Forward|Advanced Forward|Playmaker/.test(role)) return y - 3 * dir;
  if (/fifa-21|fifa-23/.test(gameId) && /Winger|Inside Forward|CF|Advanced Forward/.test(role)) return y - 4 * dir;
  if (/pes-2021|pes-2019|efootball-2022/.test(gameId) && /CB|DMF|Holding|Defender/.test(role)) return y + 3 * dir;
  if (/efootball-modern|efootball-2024|efootball-2025|efootball-2026/.test(gameId) && /DMF|CMF|Fullback|LB|RB/.test(role)) return y - 2 * dir;
  return y;
}

function buildSide(gameId: string, formation: string, opponent = false): TacticalPlayer[] {
  const dna = officialDnaForGame(gameId);
  const lines = parseFormation(formation);
  const ys = yLines(lines.length, opponent);
  const width = widthFor(gameId);
  const players: TacticalPlayer[] = [{ id: opponent ? 'opp-gk' : 'home-gk', role: dna.family.includes('FC_IQ') ? 'Goalkeeper' : 'GK', name: '', x: 50, y: opponent ? 12 : 88, isOpponent: opponent }];
  lines.forEach((count, line) => {
    const roles = roleForLine(line, lines.length, count, dna.family);
    const xs = spread(count, width, line === 0);
    roles.slice(0, count).forEach((role, i) => players.push({
      id: `${opponent ? 'opp' : 'home'}-${line}-${i}`,
      role,
      name: '',
      x: Math.max(5, Math.min(95, xs[i] ?? 50)),
      y: Math.max(5, Math.min(95, adjustY(gameId, role, ys[line] ?? 50, opponent))),
      isOpponent: opponent
    }));
  });
  return players.slice(0, 11);
}

export function buildGameAwareBoard(gameId: string | undefined, formation: string, opponentFormation: string): TacticalBoardState {
  const id = gameId || 'ea-fc-25';
  return {
    players: [...buildSide(id, formation || '4-3-3'), ...buildSide(id, opponentFormation || '4-4-2', true)],
    teamColor: id.includes('efootball') || id.includes('pes') ? '#8b5cf6' : '#10b981',
    opponentColor: '#ef4444'
  };
}
