import { describe, expect, it } from 'vitest';
import { analyzeMatchLocally, analyzeScreenshotLocally } from '../utils/aiAnalysisEngine';

describe('v56 AI analysis engine', () => {
  it('creates screenshot analysis with generator autofill', () => {
    const result = analyzeScreenshotLocally('opponent.png', 'opponent', 'en');
    expect(result.detectedFormation).toMatch(/\d/);
    expect(result.generatorAutofill.oppFormation).toBe(result.detectedFormation);
    expect(result.confidence).toBeGreaterThanOrEqual(78);
  });

  it('creates match analysis with a recommended plan', () => {
    const result = analyzeMatchLocally('stats.jpg', { scoreline: '1-2', possession: '47%', shots: '6-11' }, 'en');
    expect(result.diagnosis.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendedFormation).toMatch(/\d/);
  });
});
