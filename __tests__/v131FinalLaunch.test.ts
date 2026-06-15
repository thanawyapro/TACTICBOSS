import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const app = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf8');

describe('V131 final launch experience', () => {
  it('uses one preferred game profile instead of repeating game selection screens', () => {
    expect(app).toContain('setPreferredGame');
    expect(app).toContain('tb_preferred_game_id');
    expect(app).not.toContain('setScreen("select-game")');
    expect(app).toContain('ابنِ خطتك يستخدم هذه اللعبة تلقائيًا');
  });

  it('keeps the bottom navigation and removes retired distractions', () => {
    for (const id of ['tab-home', 'tab-counter', 'tab-builder', 'tab-library', 'tab-settings']) expect(app).toContain(`id="${id}"`);
    expect(app).not.toContain('Trap Arena');
    expect(app).not.toContain('ساحة الفخ');
    expect(app).not.toContain('أنقذني');
  });

  it('adds smart board toggle and board-aware evaluation without duplicate home shortcuts', () => {
    expect(app).toContain('globalBoardOpen');
    expect(app).toContain('إظهار السبورة');
    expect(app).toContain('إخفاء السبورة');
    expect(app).toContain('analyzeManualBoardShape');
    expect(app).toContain('setManualBoardState');
    expect(app).not.toContain('وصول سريع');
  });

  it('autosaves drafts and resumes automatically without a noisy resume card', () => {
    expect(app).toContain('tb_resume_available_v131');
    expect(app).toContain('tb_manual_plan_draft_v131');
    expect(app).toContain('tb_manual_board_draft_v131');
    expect(app).not.toContain('لديك عمل غير مكتمل');
  });

  it('keeps Arabic user-facing labels clean for the main launch UI', () => {
    expect(app).toContain('مركز الميتا');
    expect(app).toContain('مجاني');
    expect(app).not.toContain('موثقة من Meta Center');
    expect(app).not.toContain('FREE" :');
  });
});
