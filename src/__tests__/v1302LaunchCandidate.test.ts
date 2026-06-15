import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const app = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');

describe('V130.2 launch candidate navigation and product scope', () => {
  it('keeps the permanent bottom navigation with the essential tabs', () => {
    expect(app).toContain('id="tab-home"');
    expect(app).toContain('id="tab-counter"');
    expect(app).toContain('id="tab-builder"');
    expect(app).toContain('id="tab-library"');
    expect(app).toContain('id="tab-settings"');
  });

  it('removes the retired Tactic Trap and rescue duplicate from user-facing screens', () => {
    expect(app).not.toContain('screen === "competition"');
    expect(app).not.toContain('screen === "daily-challenge"');
    expect(app).not.toContain('Trap Arena');
    expect(app).not.toContain('ساحة الفخ');
    expect(app).not.toContain('startLiveRescue');
    expect(app).not.toContain('إنقاذ سريع أثناء المباراة');
    expect(app).not.toContain('LIVE_RESCUE');
  });

  it('keeps meta and community as primary home tools', () => {
    expect(app).toContain('setScreen("meta-center")');
    expect(app).toContain('setScreen("community")');
    expect(app).toContain('اضرب خصمك');
    expect(app).toContain('ابنِ خطتك');
  });
  it('supports a complete password recovery flow and hides deployment instructions', () => {
    expect(app).toContain('PASSWORD_RECOVERY');
    expect(app).toContain('updateUser({ password: newPassword })');
    expect(app).not.toContain('Google Play Billing before final upload');
    expect(app).not.toContain('product IDs before final upload');
  });
});

describe('V130.2 authentic manual builder controls', () => {
  it('exposes the classic PES numeric settings', () => {
    expect(app).toContain('supportRange');
    expect(app).toContain('defensiveLineLevel');
    expect(app).toContain('compactness');
    expect(app).toContain('مدى الدعم');
    expect(app).toContain('مستوى خط الدفاع');
    expect(app).toContain('التكتل');
  });

  it('separates PES and eFootball instruction assignment rules', () => {
    expect(app).toContain('attackingPlayer1');
    expect(app).toContain('defensivePlayer1');
    expect(app).toContain('طبّق دفاعي على');
    expect(app).toContain('طبّق هجوم ضاغط على');
    expect(app).toContain('تعليمات eFootball الفردية');
    expect(app).toContain('كل تعليمة مرتبطة بلاعب');
  });

  it('separates FC IQ from older FIFA custom tactics', () => {
    expect(app).toContain('["ea-fc-25", "ea-fc-26"]');
    expect(app).toContain('["fifa-19", "fifa-20", "fifa-21"]');
    expect(app).toContain('family: "ea_fc_iq"');
    expect(app).toContain('FC IQ');
    expect(app).toContain('الأسلوب الهجومي — داخل اللعبة');
  });
});
