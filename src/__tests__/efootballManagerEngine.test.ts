import { describe, expect, it } from 'vitest';
import { EFOOTBALL_MANAGERS, buildEfootballManagerBoard, bestManagerForStyle, getEfootballManager } from '../utils/efootballManagerEngine';
import { playerRoleAbbreviation, playerRoleLabel } from '../utils/playerRoles';

describe('eFootball manager simulation layer', () => {
  it('ships manager presets with best formations and tactical DNA', () => {
    expect(EFOOTBALL_MANAGERS.length).toBeGreaterThanOrEqual(8);
    const pep = getEfootballManager('guardiola-possession');
    expect(pep?.primaryPlaystyle).toBe('Possession Game');
    expect(pep?.bestFormations).toContain('4-2-3-1');
    expect(pep?.individualInstructions.length).toBeGreaterThan(1);
  });

  it('auto-draws a legal tactical board with eFootball position codes', () => {
    const manager = bestManagerForStyle('Possession Game');
    const board = buildEfootballManagerBoard('4-2-3-1', '4-3-3', manager);
    expect(board.players).toHaveLength(22);
    expect(board.players.filter(p => !p.isOpponent)).toHaveLength(11);
    expect(board.players.some(p => playerRoleAbbreviation(p.role) === 'CF')).toBe(true);
    expect(board.players.every(p => p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100)).toBe(true);
  });

  it('shows eFootball abbreviations next to Arabic position labels', () => {
    expect(playerRoleLabel('CF', 'ar')).toContain('(CF)');
    expect(playerRoleLabel('CMF', 'ar')).toContain('(CMF)');
    expect(playerRoleLabel('LWF', 'ar')).toContain('(LWF)');
  });
});
