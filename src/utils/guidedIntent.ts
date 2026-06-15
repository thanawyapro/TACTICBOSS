import { normalizeGuidedIntent } from './tacticI18n';
import { getGameDnaProfile } from './gameDnaEngine';

export const getStableGuidedIntent = (
  formData: any,
  mode: "build" | "counter",
  homeGameId: string,
  selectedGame?: any
) => {
  const notes = String(formData.notes || "");
  const buildMatch = notes.match(/TACTIC_BUILD:([a-z0-9_-]+)/i);
  const counterMatch = notes.match(/TACTIC_COUNTER:([a-z0-9_-]+)/i);
  if (mode === "build" && buildMatch?.[1]) return buildMatch[1].toLowerCase();
  if (mode === "counter" && counterMatch?.[1]) return counterMatch[1].toLowerCase();
  return normalizeGuidedIntent(`${notes} ${formData.opponentStyle || ""} ${formData.matchState || ""}`);
};

export const stripGuidedRuntimeTags = (value = "") =>
  String(value || "")
    .replace(/\|\s*VARIANT:[^|]+/gi, "")
    .replace(/\|\s*RISK:[^|]+/gi, "")
    .replace(/\|\s*SEED:[^|]+/gi, "")
    .replace(/\|\s*TACTIC_ENGINE:[^|]+/gi, "")
    .trim();

export const styleForIntent = (intent: string, gameId: string, selectedGame?: any, homeGameId?: string) => {
  const family = getGameDnaProfile(gameId, selectedGame?.name || "").family;
  if (family === "pes_classic") return intent === "control" || intent === "press" || intent === "low" ? "Possession Game" : "Counter Attack";
  if (intent === "control") return "Possession Game";
  if (intent === "safe" || intent === "lbc") return "Long Ball Counter";
  if (intent === "wide") return "Out Wide";
  if (intent === "longball") return "Long Ball";
  if (intent === "low") return "Possession Game";
  return "Quick Counter";
};

export const planSeed = (value: string) =>
  Array.from(value || "").reduce((sum, char) => sum + char.charCodeAt(0), 0);

export const pickBySeed = <T,>(rows: T[], seed: number, offset = 0): T => {
  if (!rows.length) throw new Error("No rows to pick from");
  const idx = (seed + offset) % rows.length;
  return rows[idx];
};
