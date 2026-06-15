import type { GameItem } from "./gameData";
import { gameDnaOptionLabel, getGameDnaProfile, type DnaLang } from "./gameDnaEngine";

export type ManagerLeagueStatus = "open" | "active" | "finished";
export type ManagerLeagueMember = {
  id: string;
  userId?: string;
  name: string;
  isAi?: boolean;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  badge?: string;
};

export type ManagerLeagueMatchReport = {
  score: number;
  result: "win" | "draw" | "loss";
  scoreline: string;
  xp: number;
  summary: Record<DnaLang, string>;
  positives: Record<DnaLang, string[]>;
  improvements: Record<DnaLang, string[]>;
};

export type ManagerLeagueMatch = {
  id: string;
  round: number;
  homeId: string;
  awayId: string;
  deadlineAt: string;
  submitted?: boolean;
  report?: ManagerLeagueMatchReport;
};

export type ManagerLeague = {
  id: string;
  name: string;
  gameId: string;
  gameName: string;
  gameFamily: string;
  joinCode: string;
  type: "public" | "private";
  createdBy?: string;
  createdAt: string;
  maxMembers: number;
  seasonDays: number;
  roundFrequencyHours: number;
  status: ManagerLeagueStatus;
  currentRound: number;
  members: ManagerLeagueMember[];
  matches: ManagerLeagueMatch[];
};

export type ManagerLeaguePlanInput = {
  formation: string;
  playstyle: string;
  defensiveMode: string;
  focus: string;
  advancedInstruction?: string;
};

export const managerGamePrefix = (gameId: string, gameName = "") => {
  const raw = `${gameId} ${gameName}`.toLowerCase();
  if (/pes.*2021|2021|pes-2021/.test(raw)) return "PES21";
  if (/pes.*2020|2020|pes-2020/.test(raw)) return "PES20";
  if (/pes.*2019|2019|pes-2019/.test(raw)) return "PES19";
  if (/fifa|fc|ea/.test(raw)) return "FC";
  return "EF";
};

const seedNumber = (value: string) => Array.from(value).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
const pick = <T,>(items: T[], seed: number, offset = 0) => items[Math.abs(seed + offset) % items.length];

export const createManagerJoinCode = (gameId: string, gameName = "", entropy = Date.now()) => {
  const prefix = managerGamePrefix(gameId, gameName);
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seed = seedNumber(`${gameId}-${gameName}-${entropy}`);
  let code = "";
  for (let i = 0; i < 4; i += 1) code += alphabet[(seed + i * 11) % alphabet.length];
  return `${prefix}-${code}`;
};

export const aiCoachesForGame = (game: Pick<GameItem, "id" | "name">, lang: DnaLang): ManagerLeagueMember[] => {
  const dna = getGameDnaProfile(game.id, game.name);
  const labels = dna.playstyles.slice(0, 4).map((item) => gameDnaOptionLabel(dna, item.value, lang));
  const fallback = lang === "ar" ? ["مدرب الاستحواذ", "مدرب المرتدات", "مدرب الأطراف", "مدرب الضغط"] : ["Possession Coach", "Counter Coach", "Wide Coach", "Press Coach"];
  return [0, 1, 2].map((i) => ({
    id: `ai-${i + 1}`,
    name: labels[i] ? `Coach ${labels[i]}` : fallback[i],
    isAi: true,
    points: 1 + ((seedNumber(game.id) + i) % 5),
    played: 1,
    wins: i === 0 ? 1 : 0,
    draws: i === 1 ? 1 : 0,
    losses: i === 2 ? 1 : 0,
    goalsFor: 1 + ((seedNumber(game.name) + i) % 3),
    goalsAgainst: 1 + ((seedNumber(game.id) + i + 1) % 3),
    badge: dna.badge,
  }));
};

export const createManagerLeague = ({
  game,
  coachName,
  userId,
  lang,
  name,
  type = "private",
  maxMembers = 4,
  seasonDays = 3,
  roundFrequencyHours = 24,
}: {
  game: Pick<GameItem, "id" | "name">;
  coachName: string;
  userId?: string;
  lang: DnaLang;
  name?: string;
  type?: "public" | "private";
  maxMembers?: number;
  seasonDays?: number;
  roundFrequencyHours?: number;
}): ManagerLeague => {
  const now = new Date();
  const dna = getGameDnaProfile(game.id, game.name);
  const currentUserMember: ManagerLeagueMember = {
    id: userId || "me",
    userId,
    name: coachName || "Tactic Boss",
    points: 0,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    badge: dna.badge,
  };
  const members = [currentUserMember, ...aiCoachesForGame(game, lang)].slice(0, maxMembers);
  const deadline = new Date(now.getTime() + roundFrequencyHours * 60 * 60 * 1000).toISOString();
  const matches: ManagerLeagueMatch[] = [
    {
      id: `m-${now.getTime()}-1`,
      round: 1,
      homeId: currentUserMember.id,
      awayId: members[1]?.id || "ai-1",
      deadlineAt: deadline,
    },
  ];
  return {
    id: `league-${now.getTime()}`,
    name: name || (lang === "ar" ? "دوري المدربين" : "Manager League"),
    gameId: game.id,
    gameName: game.name,
    gameFamily: dna.family,
    joinCode: createManagerJoinCode(game.id, game.name, now.getTime()),
    type,
    createdBy: userId,
    createdAt: now.toISOString(),
    maxMembers,
    seasonDays,
    roundFrequencyHours,
    status: "open",
    currentRound: 1,
    members,
    matches,
  };
};

export const gameSeparatedLeagueMessage = (league: ManagerLeague, game: Pick<GameItem, "id" | "name">, lang: DnaLang) => {
  if (league.gameId === game.id) return "";
  return lang === "ar"
    ? `هذا الدوري مخصص للعبة ${league.gameName}. غيّر اللعبة للدخول بدون لخبطة.`
    : `This league is for ${league.gameName}. Switch game first to avoid mixing leagues.`;
};

export const getCurrentManagerMatch = (league: ManagerLeague, userId?: string) => {
  const myId = userId || "me";
  return league.matches.find((match) => (match.homeId === myId || match.awayId === myId) && match.round === league.currentRound) || league.matches[0];
};

export const managerLeagueTable = (league: ManagerLeague) => [...league.members].sort((a, b) => {
  if (b.points !== a.points) return b.points - a.points;
  const gdB = b.goalsFor - b.goalsAgainst;
  const gdA = a.goalsFor - a.goalsAgainst;
  if (gdB !== gdA) return gdB - gdA;
  return b.goalsFor - a.goalsFor;
});

export const managerOpponentSummary = (league: ManagerLeague, userId?: string) => {
  const match = getCurrentManagerMatch(league, userId);
  const opponentId = match?.homeId === (userId || "me") ? match.awayId : match?.homeId;
  return league.members.find((member) => member.id === opponentId) || league.members.find((m) => m.isAi) || league.members[1];
};

export const evaluateManagerLeaguePlan = (
  game: Pick<GameItem, "id" | "name">,
  input: ManagerLeaguePlanInput,
  lang: DnaLang,
): ManagerLeagueMatchReport => {
  const dna = getGameDnaProfile(game.id, game.name);
  const seed = seedNumber(`${game.id}-${input.formation}-${input.playstyle}-${input.defensiveMode}-${input.focus}`);
  const preferredPlaystyles = dna.family === "pes_classic"
    ? ["Counter Attack + Long Pass", "Counter Attack + Short Pass", "Possession Game + Short Pass"]
    : dna.family === "ea_fc"
      ? ["Balanced Build Up", "Direct Passing", "Short Passing Possession"]
      : ["Quick Counter", "Long Ball Counter", "Possession Game"];
  const preferredDefence = dna.family === "pes_classic"
    ? ["All-out Defence + Conservative", "Center Containment", "Frontline Pressure + Aggressive"]
    : dna.family === "ea_fc"
      ? ["Balanced Defensive Approach", "Mid Block", "Low Block"]
      : ["Mid block", "Deep line", "Narrow compactness"];
  const playstyleScore = preferredPlaystyles.includes(input.playstyle) ? 28 : 16;
  const defenceScore = preferredDefence.includes(input.defensiveMode) ? 24 : 13;
  const formationScore = dna.formations.includes(input.formation) ? 18 : 10;
  const focusScore = dna.tacticalFocus.some((x) => x.value === input.focus) ? 18 : 9;
  const instructionScore = input.advancedInstruction && input.advancedInstruction.trim().length >= 8 ? 10 : 4;
  const variance = (seed % 7) - 3;
  const score = Math.max(40, Math.min(100, playstyleScore + defenceScore + formationScore + focusScore + instructionScore + variance));
  const result = score >= 76 ? "win" : score >= 61 ? "draw" : "loss";
  const scoreline = result === "win" ? pick(["2-1", "1-0", "3-1"], seed) : result === "draw" ? pick(["1-1", "0-0", "2-2"], seed) : pick(["1-2", "0-1", "1-3"], seed);
  const xp = result === "win" ? 90 : result === "draw" ? 55 : 30;
  const playLabel = gameDnaOptionLabel(dna, input.playstyle, lang);
  const defLabel = gameDnaOptionLabel(dna, input.defensiveMode, lang);
  return {
    score,
    result,
    scoreline,
    xp,
    summary: {
      ar: result === "win"
        ? `فزت ${scoreline}. خطتك مناسبة لـ ${dna.title.ar}: ${playLabel} مع ${defLabel}.`
        : result === "draw"
          ? `تعادلت ${scoreline}. الخطة قابلة للعب لكن تحتاج تعليمات أدق حسب DNA اللعبة.`
          : `خسرت ${scoreline}. الفكرة تحتاج ضبط دفاعي أو اختيار أسلوب أنسب للعبة.`,
      en: result === "win"
        ? `You won ${scoreline}. Your plan fits ${dna.title.en}: ${playLabel} with ${defLabel}.`
        : result === "draw"
          ? `Draw ${scoreline}. Playable plan, but it needs tighter game-DNA instructions.`
          : `Lost ${scoreline}. The idea needs better defensive tuning or a better game-specific style.`,
      es: `Resultado ${scoreline}.`,
      fr: `Résultat ${scoreline}.`,
    },
    positives: {
      ar: ["اختيارك مرتبط بلعبة الدوري وليس لعبة أخرى.", "تم تقييم الخطة مباشرة داخل الدوري.", "النقاط تحتسب داخل دوري منفصل بالكود."],
      en: ["Your choice matches the league game.", "The result was scored directly inside the league.", "Points count inside a separated code league."],
      es: ["Liga separada por juego.", "Evaluación directa.", "Puntos en liga privada."],
      fr: ["Ligue séparée par jeu.", "Évaluation directe.", "Points en ligue privée."],
    },
    improvements: {
      ar: ["اكتب تعليمة متقدمة أوضح لزيادة التقييم.", "راجع سبورة الخصم قبل اعتماد خطة الجولة.", "لا تخلط إعدادات PES مع eFootball أو EA FC."],
      en: ["Write a clearer advanced instruction to raise your score.", "Read the rival board before submitting the round plan.", "Do not mix PES settings with eFootball or EA FC."],
      es: ["Mejora instrucciones.", "Lee la pizarra.", "No mezcles juegos."],
      fr: ["Améliorez les consignes.", "Lisez le tableau.", "Ne mélangez pas les jeux."],
    },
  };
};

export const applyManagerResult = (league: ManagerLeague, userId: string | undefined, report: ManagerLeagueMatchReport): ManagerLeague => {
  const myId = userId || "me";
  const match = getCurrentManagerMatch(league, myId);
  const [gf, ga] = report.scoreline.split("-").map((x) => Number(x) || 0);
  const nextMembers = league.members.map((member) => {
    if (member.id !== myId) return member;
    return {
      ...member,
      played: member.played + 1,
      points: member.points + (report.result === "win" ? 3 : report.result === "draw" ? 1 : 0),
      wins: member.wins + (report.result === "win" ? 1 : 0),
      draws: member.draws + (report.result === "draw" ? 1 : 0),
      losses: member.losses + (report.result === "loss" ? 1 : 0),
      goalsFor: member.goalsFor + gf,
      goalsAgainst: member.goalsAgainst + ga,
    };
  });
  const nextMatches = league.matches.map((item) => item.id === match?.id ? { ...item, submitted: true, report } : item);
  return { ...league, status: "active", members: nextMembers, matches: nextMatches };
};
