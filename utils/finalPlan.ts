import { TacticalBoardState, TacticResult } from '../types';

export const FINAL_PLAN_VERSION = 'v104-launch-candidate-stability' as const;

export type FinalPlanSourceTool = 'build' | 'counter' | 'analyze' | 'improve' | 'daily' | string;

export type FinalPlanMeta = {
  sourceTool?: FinalPlanSourceTool;
  game?: string;
  language?: string;
  formation?: string;
  playstyle?: string;
  confidenceFallback?: number;
};

export function createFinalPlanId() {
  return `fp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace('%', '').replace('/10', '').trim();
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function safePercent(value: unknown, fallback = 82): number {
  const n = safeNumber(value, fallback);
  const pct = n <= 10 ? n * 10 : n;
  return Math.max(0, Math.min(99, Math.round(pct)));
}

export function safeScore10(value: unknown, fallbackPercent = 82): number {
  const n = safeNumber(value, fallbackPercent / 10);
  const score = n > 10 ? n / 10 : n;
  return Math.max(0, Math.min(9.9, Number(score.toFixed(1))));
}

export function cloneBoardState(board?: TacticalBoardState | null): TacticalBoardState | null {
  if (!board?.players?.length) return null;
  return {
    ...board,
    players: board.players.map((player) => ({ ...player })),
  };
}

export function lockFinalPlanResult(
  input: TacticResult,
  board: TacticalBoardState | null | undefined,
  meta: FinalPlanMeta = {},
): { result: TacticResult; board: TacticalBoardState | null } {
  const lockedBoard = cloneBoardState(board);
  const formation = (meta.formation || input.formation || '4-2-3-1').trim();
  const playstyle = (meta.playstyle || input.attackingStyle || 'Balanced').trim();
  const confidence = safePercent(input.confidence, meta.confidenceFallback || 82);
  const existingScore = (input as any).score ?? (input as any).rating;
  const score = safeScore10(existingScore, confidence);
  const rating = Math.round(score * 10);
  const finalPlanId = (input as any).finalPlanId || createFinalPlanId();

  const result: TacticResult = {
    ...input,
    formation,
    attackingStyle: playstyle,
    confidence: String(confidence),
    finalPlanLocked: true,
    finalPlanVersion: FINAL_PLAN_VERSION,
    finalPlanId,
    finalPlanSourceTool: meta.sourceTool || (input as any).finalPlanSourceTool || 'build',
    finalPlanGame: meta.game || (input as any).finalPlanGame || '',
    finalPlanLanguage: meta.language || (input as any).finalPlanLanguage || 'en',
    finalBoard: lockedBoard,
    score,
    rating,
  };

  return Object.freeze({ result: Object.freeze(result), board: lockedBoard });
}
