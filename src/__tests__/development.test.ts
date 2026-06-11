import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { analyzeTacticDevelopment } from '../utils/tacticDevelopment';
import { GAMES_LIST } from '../utils/gameData';
import type { TacticalBoardState } from '../types';

describe('tactic development coach', () => {
  it('returns a scored development plan with alternatives and a full tactic', () => {
    const game = GAMES_LIST.find(item => item.id === 'pes-2019')!;
    const board: TacticalBoardState = {
      teamColor: '#fff', opponentColor: '#f00', players: [
        { id:'gk', role:'GK', x:50, y:88, isOpponent:false },
        { id:'cb1', role:'CB', x:40, y:72, isOpponent:false },
        { id:'cb2', role:'CB', x:60, y:72, isOpponent:false },
        { id:'dm', role:'Anchor Man', x:50, y:55, isOpponent:false },
        { id:'lw', role:'Winger', x:15, y:24, isOpponent:false },
        { id:'rw', role:'Winger', x:85, y:24, isOpponent:false },
      ]
    };
    const result = analyzeTacticDevelopment(game, { formation:'4-3-3', style:'استحواذ', team:'Real Madrid', goal:'تحسين التوازن العام', notes:'أستقبل مرتدات' }, board, 'ar');
    expect(result.score).toBeGreaterThanOrEqual(55);
    expect(result.recommendedFormation).toBeTruthy();
    expect(result.alternativeFormations.length).toBeGreaterThan(0);
    expect(result.priorities.length).toBeGreaterThan(0);
    expect(result.tactic.formation).toBe(result.recommendedFormation);
  });

  it('identifies a risky board and produces development priorities', () => {
    const game = GAMES_LIST.find(item => item.id === 'ea-fc-25')!;
    const board: TacticalBoardState = {
      teamColor: '#fff', opponentColor: '#f00', players: [
        { id:'fb1', role:'Attacking Fullback', x:10, y:35, isOpponent:false },
        { id:'fb2', role:'Attacking Fullback', x:90, y:35, isOpponent:false },
        { id:'cb1', role:'CB', x:48, y:55, isOpponent:false },
        { id:'cb2', role:'CB', x:52, y:55, isOpponent:false },
      ]
    };
    const result = analyzeTacticDevelopment(game, { formation:'4-3-3', style:'ضغط عالي', team:'Arsenal', goal:'تقوية الدفاع والتحولات', notes:'' }, board, 'en');
    expect(result.boardInsights.join(' ')).toMatch(/fullbacks|holding|same space|high/i);
    expect(result.priorities.length).toBeGreaterThanOrEqual(2);
    expect(result.score).toBeLessThan(90);
  });
});

describe('generation resilience', () => {
  it('keeps successfully generated results when request tracking is unavailable', () => {
    const app = fs.readFileSync('src/App.tsx', 'utf8');
    expect(app).toContain('trackAiRequestBestEffort');
    expect(app).toContain('generated result kept');
    expect(app).toContain("setCurrentResult(finalResult)");
  });
});
