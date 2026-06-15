import { describe, expect, it } from 'vitest';
import { GAMES_LIST } from '../utils/gameData';
import { officialDnaForGame } from '../utils/officialGameDNA';
import { buildGameAwareBoard } from '../utils/gameBoardBuilder';
import { generateLocalTactic } from '../utils/tacticalEngine';

describe('official game DNA hard verification layer', () => {
  it('covers every supported game with a verification score', () => {
    for (const game of GAMES_LIST) {
      const dna = officialDnaForGame(game);
      expect(dna.score).toBeGreaterThanOrEqual(80);
      expect(dna.officialBasis.length).toBeGreaterThan(0);
      expect(dna.appMustPrioritize.length).toBeGreaterThan(0);
    }
  });

  it('draws a legal game-aware board for every supported game', () => {
    for (const game of GAMES_LIST) {
      const board = buildGameAwareBoard(game.id, '4-2-3-1', '4-4-2');
      expect(board.players.filter(p => !p.isOpponent)).toHaveLength(11);
      expect(board.players.filter(p => p.isOpponent)).toHaveLength(11);
      for (const player of board.players) {
        expect(player.x).toBeGreaterThanOrEqual(5);
        expect(player.x).toBeLessThanOrEqual(95);
        expect(player.y).toBeGreaterThanOrEqual(5);
        expect(player.y).toBeLessThanOrEqual(95);
      }
    }
  });

  it('adds official DNA evidence into generated tactics', () => {
    const game = GAMES_LIST.find(g => g.id === 'ea-fc-25')!;
    const result = generateLocalTactic(game, { myFormation:'4-2-3-1', oppFormation:'4-3-3', opponentStyle:'ضغط عالي', myStyle:'استحواذ', matchState:'متعادلان', myTeam:'Arsenal', oppTeam:'Liverpool', notes:'' }, 'en');
    expect(result.defensiveDetails['Official DNA']).toContain('EA FC IQ');
    expect(result.defensiveDetails['Verification Score']).toMatch(/\/100/);
    expect(result.attackingDetails['Avoid']).toContain('Old custom-tactics-only logic');
  });
});
