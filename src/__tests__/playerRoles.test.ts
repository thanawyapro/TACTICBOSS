import { describe, expect, it } from 'vitest';
import { playerRoleAbbreviation, playerRoleLabel } from '../utils/playerRoles';

describe('player role labels', () => {
  it('adds internationally familiar abbreviations to Arabic labels', () => {
    expect(playerRoleLabel('CB', 'ar')).toBe('قلب دفاع (CB)');
    expect(playerRoleLabel('Poacher', 'ar')).toBe('مهاجم صريح قناص (CF)');
  });

  it('keeps the role abbreviation available for board markers', () => {
    expect(playerRoleAbbreviation('Advanced Playmaker')).toBe('CAM');
    expect(playerRoleAbbreviation('Holding Midfielder')).toBe('CDM');
  });
});
