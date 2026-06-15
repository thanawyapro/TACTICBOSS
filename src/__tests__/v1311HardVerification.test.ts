import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const app = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf8');
const metaComponent = readFileSync(resolve(process.cwd(), 'src/components/MetaCenter.tsx'), 'utf8');

describe('V131.1+ hard verification launch fixes', () => {
  it('removes duplicate home quick access and duplicate share-image card', () => {
    expect(app).not.toContain('وصول سريع');
    expect(app).not.toContain('شارك الخطة كصورة');
  });

  it('keeps meta center as a real interactive renderable screen', () => {
    expect(app).toContain('screen === "meta-center"');
    expect(app).toContain('<MetaCenter');
    expect(app).toContain('currentMeta.length');
    expect(metaComponent).toContain('openKey');
    expect(metaComponent).toContain('صاعدة');
    expect(metaComponent).toContain('هابطة');
    expect(metaComponent).toContain('استخدم الخطة');
  });

  it('keeps internal counter markers hidden from the rival note field', () => {
    expect(app).toContain('TACTIC_COUNTER');
    expect(app).toContain('formData.notes.replace(/^TACTIC_COUNTER');
    expect(app).not.toContain('AI_COUNTER_RESCUE');
  });

  it('limits PES advanced instructions and targets only Defensive / Counter Target', () => {
    expect(app).toContain('تعليمات PES المتقدمة');
    expect(app).toContain('تعليمات هجومية');
    expect(app).toContain('تعليمات دفاعية');
    expect(app).toContain('selected.length >= 2');
    expect(app).toContain('طبّق دفاعي على');
    expect(app).toContain('طبّق هجوم ضاغط على');
  });

  it('shows the global game selector on home and non-home screens', () => {
    expect(app).toContain('setPreferredGame(e.target.value)');
    expect(app).toContain('preferredGameItem.name');
  });
});
