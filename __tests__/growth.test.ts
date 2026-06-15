import { describe, expect, it } from 'vitest';
import { addXp, buildMetaCenter, completeMatchingChallenges, dailyChallenges, defaultProgression, levelInfo } from '../utils/growthEngine';

describe('growth and retention engine', () => {
  it('awards XP and calculates levels', () => {
    const next = addXp(defaultProgression(), 'generate');
    expect(next.xp).toBe(25);
    expect(levelInfo(6000, 'en').level).toBeGreaterThan(1);
  });

  it('completes a matching daily challenge once', () => {
    const challenges = dailyChallenges('en');
    const target = challenges[0];
    const next = completeMatchingChallenges(defaultProgression(), target.action, challenges);
    expect(next.completedChallengeIds).toContain(target.id);
    const repeated = completeMatchingChallenges(next, target.action, challenges);
    expect(repeated.xp).toBe(next.xp);
  });

  it('builds game-specific meta recommendations', () => {
    const pes = buildMetaCenter('pes-2021', []);
    const ea = buildMetaCenter('ea-fc-26', []);
    expect(pes.length).toBeGreaterThanOrEqual(3);
    expect(ea.length).toBeGreaterThanOrEqual(3);
    expect(pes[0].playstyle).not.toBe(ea[0].playstyle);
  });
});
