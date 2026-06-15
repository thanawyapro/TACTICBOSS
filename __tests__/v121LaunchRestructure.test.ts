import { describe, expect, it } from 'vitest';
import { getGameDnaProfile, gameDnaOptionLabel } from '../utils/gameDnaEngine';
import fs from 'node:fs';

describe('V121 launch restructure', () => {
  it('keeps classic PES to possession and counter attack only', () => {
    const dna = getGameDnaProfile('pes-2021', 'PES 2021');
    expect(dna.family).toBe('pes_classic');
    expect(dna.playstyles.map(item => item.value)).toEqual(['Possession Game', 'Counter Attack']);
    expect(dna.playstyles.some(item => /Quick Counter|Long Ball Counter|Out Wide/.test(item.value))).toBe(false);
  });

  it('localizes modern playstyles in Arabic without changing internal values', () => {
    const dna = getGameDnaProfile('efootball-modern', 'eFootball Current');
    expect(gameDnaOptionLabel(dna, 'Quick Counter', 'ar')).toBe('هجمة مرتدة سريعة');
    expect(gameDnaOptionLabel(dna, 'Possession Game', 'ar')).toBe('لعب استحواذ');
  });

  it('ships manual builder while removing the retired match analyst from the user app', () => {
    const source = fs.readFileSync('src/App.tsx', 'utf8');
    expect(source).toContain('ابنِ خطتك');
    expect(source).not.toContain('screen === "match-analyst" && (');
    expect(source).not.toContain('شات المدرب الذكي');
    expect(source).not.toContain('askAiCoachForTips');
  });
});
