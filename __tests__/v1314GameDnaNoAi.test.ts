import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getGameDnaProfile } from '../utils/gameDnaEngine';

const app = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');
const auth = fs.readFileSync(path.resolve(process.cwd(), 'src/components/AuthScreen.tsx'), 'utf8');

describe('V131.4 game DNA and clean product language', () => {
  it('removes the retired smart-chat experience and AI-facing brand text', () => {
    expect(app).not.toContain('شات المدرب الذكي');
    expect(app).not.toContain('askAiCoachForTips');
    expect(app).not.toContain('analyzeFromLibrary');
    expect(app).not.toContain('startAnalyzeMyMatch');
    expect(app).not.toContain('TACTIC BOSS AI');
    expect(app).not.toContain('AI COACH');
    expect(auth).not.toContain('مدربك التكتيكي الذكي');
    expect(fs.existsSync(path.resolve(process.cwd(), 'src/components/AIScreenshotAnalyzer.tsx'))).toBe(false);
    expect(fs.existsSync(path.resolve(process.cwd(), 'src/components/AIMatchAnalyst.tsx'))).toBe(false);
    expect(fs.existsSync(path.resolve(process.cwd(), 'netlify/functions/vision-analysis.mjs'))).toBe(false);
  });

  it('keeps classic PES advanced instructions split into two groups', () => {
    const attackBlock = app.slice(app.indexOf('const attackingInstructions = ['), app.indexOf('const defensiveInstructions = ['));
    const defenceBlock = app.slice(app.indexOf('const defensiveInstructions = ['), app.indexOf('const positions = [', app.indexOf('const defensiveInstructions = [')));
    expect(attackBlock).toContain('Defensive');
    expect(attackBlock).not.toContain('Swarm the Box');
    expect(defenceBlock).toContain('Swarm the Box');
    expect(defenceBlock).toContain('Counter Target');
    expect(app).toContain('selected.length >= 2');
    expect(app).toContain('advancedInstructions.includes("Defensive")');
    expect(app).toContain('advancedInstructions.includes("Counter Target")');
  });

  it('uses the five modern eFootball Team Playstyles and 2+2 instruction slots', () => {
    const dna = getGameDnaProfile('efootball-modern', 'eFootball Current');
    expect(dna.playstyles.map((item) => item.value)).toEqual([
      'Possession Game',
      'Quick Counter',
      'Long Ball Counter',
      'Out Wide',
      'Long Ball',
    ]);
    expect(app).toContain('التعليمة الهجومية الأولى');
    expect(app).toContain('التعليمة الهجومية الثانية');
    expect(app).toContain('التعليمة الدفاعية الأولى');
    expect(app).toContain('التعليمة الدفاعية الثانية');
    expect(app).toContain('كل تعليمة مرتبطة بلاعب');
    expect(app).toContain('لاعب فريقك المكلف بالرقابة');
    expect(app).toContain('لاعب الخصم المطلوب مراقبته');
    expect(app).toContain('allEfStyles = ["Possession Game", "Quick Counter", "Long Ball Counter", "Out Wide", "Long Ball"]');
  });

  it('separates FC IQ editions from legacy Custom Tactics', () => {
    expect(app).toContain('["ea-fc-25", "ea-fc-26"]');
    expect(app).toContain('family: "ea_fc_iq"');
    expect(app).toContain('["fifa-19", "fifa-20", "fifa-21"]');
    expect(app).toContain('family: "ea_fc_legacy"');
    expect(app).toContain('الركلات الحرة');
    expect(app).toContain('gkFocus');
    expect(app).toContain('fullbackFocus');
    expect(app).toContain('forwardFocus');
    expect(app).toContain('legacyInstructionOptionsForTarget');
    expect(app).toContain('Build-Up Style');
    expect(app).toContain('Defensive Approach');
  });
});
