import React, { useState, useEffect } from "react";
import {
  Gamepad2,
  Sword,
  Library,
  Crown,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Save,
  Share2,
  Trash2,
  Shield,
  Zap,
  Target,
  Copy,
  AlertTriangle,
  Info,
  Search,
  Users,
  Star,
  Flame,
  Award,
  Trophy,
  Dribbble,
  Languages,
  Brain,
  Sparkles,
  CalendarDays,
  ChevronDown,
  Camera,
  BarChart3,
  KeyRound,
  SlidersHorizontal,
  Wrench,
  Crosshair,
} from "lucide-react";
import {
  GameItem,
  GAMES_LIST,
  OPPONENT_STYLES,
  MY_STYLES,
  MATCH_STATES,
} from "./utils/gameData";
import {
  getPopularTeamsForGame,
  getTeamByName,
  boardFromTeams,
  dailyTeamPlan,
  teamField,
} from "./utils/teamData";
import {
  TacticResult,
  SavedTactic,
  Rival,
  UserSubscription,
  TacticalBoardState,
} from "./types";
import { translations, countryFlags, SupportedLang } from "./utils/lang";
import { getSupabase } from "./lib/supabaseClient";
import AuthScreen from "./components/AuthScreen";
import TacticalBoard from "./components/TacticalBoard";
import { generateLocalTactic } from "./utils/tacticalEngine";
import {
  normalizeResultLanguage,
  optionLabel,
  translateTacticText,
} from "./utils/tacticI18n";
import {
  analyzeBoardShape,
  applyBoardIntelligence,
} from "./utils/boardIntelligence";
import {
  analyzeTacticDevelopment,
  TacticDevelopmentResult,
} from "./utils/tacticDevelopment";
import {
  getStableGuidedIntent,
  stripGuidedRuntimeTags,
  styleForIntent,
  planSeed,
  pickBySeed,
} from "./utils/guidedIntent";
import { evaluateManualPlan } from "./utils/manualPlanEvaluator";
import GrowthHub from "./components/GrowthHub";
import MetaCenter from "./components/MetaCenter";
import CommunityLite from "./components/CommunityLite";
import ScoutCenter from "./components/ScoutCenter";
import {
  activeEfootballManagers,
  buildEfootballManagerBoard,
  getEfootballManager,
  isEfootballGame,
  managerPlaystyleLabel,
  setRuntimeEfootballManagers,
  type EfootballManagerPreset,
} from "./utils/efootballManagerEngine";
import { buildGameAwareBoard } from "./utils/gameBoardBuilder";
import { getGameTacticPreset } from "./utils/gameTacticPresets";
import {
  gameDnaOptionLabel,
  getGameDnaProfile,
} from "./utils/gameDnaEngine";
import {
  applyManagerResult,
  createManagerLeague,
  evaluateManagerLeaguePlan,
  gameSeparatedLeagueMessage,
  getCurrentManagerMatch,
  managerLeagueTable,
  managerOpponentSummary,
  type ManagerLeague,
  type ManagerLeagueMatchReport,
  type ManagerLeaguePlanInput,
} from "./utils/managerLeagueEngine";
import {
  ActivityType,
  MetaItem,
  ProgressionState,
  RewardWallet,
  REWARD_ECONOMY,
  addXp,
  buildMetaCenter,
  claimRewardedAdCoins,
  completeMatchingChallenges,
  consumeExtraGenerationCredit,
  dailyChallenges,
  defaultProgression,
  defaultRewardWallet,
  levelInfo,
  redeemCoinsForGeneration,
  rewardedAdDailyLimit,
  weeklySummary,
} from "./utils/growthEngine";
import {
  hasBlockedLanguage,
  sanitizeUserText,
  moderationMessage,
} from "./utils/contentModeration";
import {
  FINAL_PLAN_VERSION,
  cloneBoardState,
  lockFinalPlanResult,
  safePercent,
  safeScore10,
} from "./utils/finalPlan";
import {
  AiUsageKind,
  CoachCompetitionState,
  CompetitionEventType,
  awardLocalCompetition,
  badgeLabel,
  canUseLocalAi,
  coachRankTitle,
  consumeLocalAi,
  defaultCompetitionState,
  localLeaderboard,
  normalizeCompetitionState,
} from "./utils/competitionEngine";
import {
  FEATURE_UNLOCKS,
  FeatureUnlockId,
  canUseFeature,
  featureUnlock,
  featureUnlockMessage,
  lockedFeatures,
  nextFeatureUnlock,
  progressionSyncPayload,
  tacticalLevelFromXp,
  unlockedFeatures,
} from "./utils/progressionUnlocks";


const DEFAULT_SUBSCRIPTION: UserSubscription = {
  plan: "free",
  status: "active",
  startedAt: "",
  expiresAt: "",
  aiMonthlyLimit: 30,
  savedTacticsLimit: 25,
  rivalsLimit: 5,
};

const scopedKey = (base: string, userId: string) => `${base}:${userId}`;
const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const BOARD_ENABLED_SCREENS = new Set([
  "generator",
  "manual-builder",
  "result",
  "rivals",
  "library",
  "meta-center",
]);

const BOARD_ANALYSIS_AR = {
  balanced: "تموضع متوازن نسبيًا، لكن راقب المساحة خلف الأظهرة.",
  wideGap: "هناك مسافة أفقية كبيرة بين الخطوط؛ قرّب لاعبي الوسط لتقليل الثغرات.",
  highRisk: "عدد كبير من اللاعبين متقدم جدًا؛ الخطة قوية هجوميًا لكنها معرضة للمرتدات.",
  narrow: "التموضع ضيق جدًا؛ أضف عرضًا هجوميًا أو ظهيرا داعمًا لفتح الملعب.",
};

const analyzeManualBoardShape = (board?: TacticalBoardState | null) => {
  const own = board?.players?.filter((p) => !p.isOpponent) || [];
  if (own.length === 0) return { score: 70, notes: [BOARD_ANALYSIS_AR.balanced] };
  const xs = own.map((p) => p.x);
  const ys = own.map((p) => p.y);
  const spreadX = Math.max(...xs) - Math.min(...xs);
  const advanced = own.filter((p) => p.y < 32).length;
  const midfieldGap = ys.filter((y) => y > 38 && y < 66).length;
  const notes: string[] = [];
  let score = 78;
  if (spreadX < 55) { notes.push(BOARD_ANALYSIS_AR.narrow); score -= 8; }
  if (spreadX > 82) { notes.push(BOARD_ANALYSIS_AR.wideGap); score -= 7; }
  if (advanced >= 4) { notes.push(BOARD_ANALYSIS_AR.highRisk); score -= 9; }
  if (midfieldGap < 3) { notes.push("الوسط غير كافٍ لربط الدفاع بالهجوم؛ أضف لاعب ربط أو ثبّت ارتكازًا."); score -= 8; }
  if (!notes.length) notes.push(BOARD_ANALYSIS_AR.balanced);
  return { score: Math.max(45, Math.min(96, score)), notes };
};


export default function App() {
  // Auth state management
  const [session, setSession] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  // Localization: 'ar' | 'en' | 'es' | 'fr'
  const [lang, setLang] = useState<SupportedLang>(() => {
    const saved = localStorage.getItem("tb_lang");
    if (saved === "ar" || saved === "en" || saved === "es" || saved === "fr")
      return saved;
    return "ar"; // Default RTL Arabic
  });

  const t = translations[lang];
  const uiText = (ar: string, en: string, es = en, fr = en) =>
    ({ ar, en, es, fr })[lang];

  // Themes: 'theme-dark' | 'theme-light' | 'theme-stadium' | 'theme-neon'
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem("tb_theme") || "theme-dark";
  });

  // Navigation Screen: 'home' | 'select-game' | 'generator' | 'result' | 'library' | 'rivals' | 'subs' | 'settings'
  const [screen, setScreen] = useState<string>(() => {
    const saved = localStorage.getItem("tb_last_screen");
    const restorableScreens = new Set([
      "home",
      "library",
      "rivals",
      "settings",
      "meta-center",
      "community",
      "manual-builder",
      "progression",
      "sandbox-board",
      "generator",
      "result",
    ]);
    return saved && restorableScreens.has(saved) ? saved : "home";
  });

  useEffect(() => {
    localStorage.setItem("tb_last_screen", screen);
  }, [screen]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referral = params.get("ref");
    if (referral && /^BOSS-[A-Z0-9]{5,12}$/i.test(referral))
      localStorage.setItem("tb_pending_referral", referral.toUpperCase());
    if (params.get("community")) setScreen("community");
  }, []);
  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);
  const normalizeGameId = (id?: string | null) =>
    id && /^efootball-202[2-6]$/.test(id)
      ? "efootball-modern"
      : id || "ea-fc-26";
  const [homeGameId, setHomeGameId] = useState<string>(() =>
    normalizeGameId(localStorage.getItem("tb_home_game_id") || localStorage.getItem("tb_preferred_game_id")),
  );
  const preferredGameItem = GAMES_LIST.find((game) => game.id === homeGameId) || GAMES_LIST[0];
  const setPreferredGame = (gameId: string) => {
    const nextGameId = normalizeGameId(gameId);
    const nextGame = GAMES_LIST.find((game) => game.id === nextGameId) || GAMES_LIST[0];
    setHomeGameId(nextGame.id);
    setFavGame(nextGame.name);
    localStorage.setItem("tb_home_game_id", nextGame.id);
    localStorage.setItem("tb_preferred_game_id", nextGame.id);
    localStorage.setItem("tb_fav_game", nextGame.name);
    setSelectedGame(nextGame);
    if (screen === "manual-builder") {
      setManualPlan((current) => ({ ...current, gameId: nextGame.id }));
      setManualBoardState(null);
    }
  };

  // Stepper stage indicator: 1, 2, 3, 4
  const [step, setStep] = useState<number>(1);
  const [generatorMode, setGeneratorMode] = useState<"build" | "counter" | "manual">(
    "counter",
  );
  const [efootballPlaystyleFilter, setEfootballPlaystyleFilter] =
    useState<string>("all");
  const [showAdvancedPlan, setShowAdvancedPlan] = useState(false);
  const [showInstructionDetails, setShowInstructionDetails] = useState(false);
  const [showDefenceDetails, setShowDefenceDetails] = useState(false);
  const [showAttackDetails, setShowAttackDetails] = useState(false);
  const [showOpponentOnBoard, setShowOpponentOnBoard] = useState(false);
  const [showExecutionBoard, setShowExecutionBoard] = useState(false);
  const [showBoardScan, setShowBoardScan] = useState(false);

  // User list state
  const [savedTactics, setSavedTactics] = useState<SavedTactic[]>([]);
  const [rivals, setRivals] = useState<Rival[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription>({
    ...DEFAULT_SUBSCRIPTION,
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const [aiUsage, setAiUsage] = useState<number>(0);
  const [progression, setProgression] = useState<ProgressionState>(() =>
    defaultProgression(),
  );
  const [rewardWallet, setRewardWallet] = useState<RewardWallet>(() =>
    defaultRewardWallet(),
  );
  const [competition, setCompetition] = useState<CoachCompetitionState>(() =>
    defaultCompetitionState(),
  );
  const [cloudCoachLeague, setCloudCoachLeague] = useState<
    Array<{ name: string; points: number; badge: string; isCurrentUser?: boolean }>
  >([]);
  const [cloudMeta, setCloudMeta] = useState<MetaItem[]>([]);
  const [boardState, setBoardState] = useState<TacticalBoardState | null>(null);
  const [rivalBoardState, setRivalBoardState] =
    useState<TacticalBoardState | null>(null);
  const [efootballManagers, setEfootballManagers] = useState<
    EfootballManagerPreset[]
  >(() => activeEfootballManagers());
  const [managerDataSource, setManagerDataSource] = useState<
    "built-in" | "admin"
  >(() => "built-in");
  const rewardedAdsEnabled = Boolean(
    (window as any).__TACTIC_BOSS_SUPABASE__?.rewardedAdsEnabled,
  );

  const [coachName, setCoachName] = useState<string>(() => {
    return localStorage.getItem("tb_coach_name") || "Coach";
  });

  const [favGame, setFavGame] = useState<string>(() => {
    return localStorage.getItem("tb_fav_game") || "EA SPORTS FC 26";
  });

  // Search & Categories inside step 1
  const [searchGameQuery, setSearchGameQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "ALL" | "PES/eFootball" | "FIFA/EA FC"
  >("ALL");

  // Generator inputs
  const [formData, setFormData] = useState({
    myFormation: "4-3-3",
    oppFormation: "4-2-3-1",
    opponentStyle: "ضغط عالي",
    myStyle: "متوازن",
    matchState: "بداية الماتش",
    myTeam: "",
    oppTeam: "",
    notes: "",
    efootballManagerId: "guardiola-possession",
  });
  const [manualPlan, setManualPlan] = useState(() => readJson("tb_manual_plan_draft_v131", {
    gameId: homeGameId,
    formation: "4-3-3",
    primaryStyle: "Possession Game",
    buildUp: "Short Pass",
    attackArea: "Center",
    positioning: "Maintain Formation",
    defensiveStyle: "Frontline Pressure",
    containmentArea: "Center",
    pressuring: "Aggressive",
    advancedInstructions: ["Tiki-Taka"],
    supportRange: "5",
    defensiveLineLevel: "5",
    compactness: "8",
    attackingPlayer1: "CF",
    attackingPlayer2: "RWF",
    defensivePlayer1: "AMF",
    defensivePlayer2: "CF",
    defensiveMarker1: "DMF",
    defensiveMarker2: "CB",
    corners: "2",
    freeKicks: "2",
    gkRole: "Goalkeeper",
    cbRole: "Defender",
    wideRole: "Winger",
    roleFocus: "Balanced",
    gkFocus: "Defend",
    cbFocus: "Defend",
    fullbackFocus: "Defend",
    midfieldFocus: "Balanced",
    wideFocus: "Balanced",
    forwardFocus: "Attack",
    legacyInstruction1: "Stay Back While Attacking",
    legacyInstruction2: "Get In Behind",
    legacyInstruction3: "Cover Center",
    legacyInstruction4: "None",
    notes: "",
    tightMarkTarget: "AMF",
  }));
  const [manualBoardState, setManualBoardState] = useState<TacticalBoardState | null>(() => readJson<TacticalBoardState | null>("tb_manual_board_draft_v131", null));
  const [globalBoardOpen, setGlobalBoardOpen] = useState(false);
  const [showManualBoard, setShowManualBoard] = useState(false);

  useEffect(() => {
    localStorage.setItem("tb_manual_plan_draft_v131", JSON.stringify(manualPlan));
    localStorage.setItem("tb_resume_available_v131", "1");
  }, [manualPlan]);

  useEffect(() => {
    if (manualBoardState) localStorage.setItem("tb_manual_board_draft_v131", JSON.stringify(manualBoardState));
  }, [manualBoardState]);

  useEffect(() => {
    localStorage.setItem("tb_generator_form_draft_v131", JSON.stringify(formData));
  }, [formData]);

  const [showDangerZone, setShowDangerZone] = useState(false);
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(() => /(?:type=recovery|recovery=1)/i.test(`${window.location.hash}${window.location.search}`));
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordRecoveryLoading, setPasswordRecoveryLoading] = useState(false);
  const [passwordRecoveryMessage, setPasswordRecoveryMessage] = useState("");
  const [managerLeagues, setManagerLeagues] = useState<ManagerLeague[]>(() =>
    readJson<ManagerLeague[]>("tb_manager_leagues_v106:guest", []),
  );
  const [activeManagerLeagueId, setActiveManagerLeagueId] = useState<string>("");
  const [managerMode, setManagerMode] = useState<"hub" | "create" | "join" | "prepare" | "result">("hub");
  const [managerCreateForm, setManagerCreateForm] = useState({
    name: "دوري الصحاب",
    maxMembers: "4",
    seasonDays: "3",
    roundFrequencyHours: "24",
  });
  const [managerJoinCode, setManagerJoinCode] = useState("");
  const [managerPlan, setManagerPlan] = useState<ManagerLeaguePlanInput>({
    formation: "4-2-3-1",
    playstyle: "Quick Counter",
    defensiveMode: "Mid block",
    focus: "Protect AMF lane",
    advancedInstruction: "",
  });
  const [managerLastReport, setManagerLastReport] = useState<ManagerLeagueMatchReport | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    const stored = readJson<ManagerLeague[]>(scopedKey("manager_leagues_v106", session.user.id), []);
    setManagerLeagues(stored);
    setActiveManagerLeagueId(stored[0]?.id || "");
  }, [session?.user?.id]);

  const initialDevelopmentTeam =
    getPopularTeamsForGame("ea-fc-26")[0]?.name || "";
  const [developmentForm, setDevelopmentForm] = useState({
    gameId: "ea-fc-26",
    team: initialDevelopmentTeam,
    formation: "4-3-3",
    style: "متوازن",
    goal: "balanced",
    notes: "",
  });
  const [developmentBoard, setDevelopmentBoard] =
    useState<TacticalBoardState | null>(() =>
      boardFromTeams("ea-fc-26", initialDevelopmentTeam, "", "4-3-3", "4-4-2"),
    );
  const [developmentResult, setDevelopmentResult] =
    useState<TacticDevelopmentResult | null>(null);
  const [isDeveloping, setIsDeveloping] = useState(false);

  const developmentGoals = [
    {
      value: "balanced",
      label: uiText(
        "تحسين التوازن العام",
        "Improve overall balance",
        "Mejorar el equilibrio general",
        "Améliorer l’équilibre général",
      ),
    },
    {
      value: "attack",
      label: uiText(
        "زيادة القوة الهجومية",
        "Increase attacking threat",
        "Aumentar la fuerza ofensiva",
        "Augmenter la menace offensive",
      ),
    },
    {
      value: "defence",
      label: uiText(
        "تقوية الدفاع والتحولات",
        "Strengthen defense and transitions",
        "Fortalecer defensa y transiciones",
        "Renforcer la défense et les transitions",
      ),
    },
    {
      value: "press",
      label: uiText(
        "تطوير الضغط العالي",
        "Develop the high press",
        "Mejorar la presión alta",
        "Développer le pressing haut",
      ),
    },
    {
      value: "possession",
      label: uiText(
        "تطوير الاستحواذ والبناء",
        "Develop possession and build-up",
        "Mejorar posesión y salida",
        "Développer la possession et la relance",
      ),
    },
  ];
  const developmentGame =
    GAMES_LIST.find((game) => game.id === developmentForm.gameId) ||
    GAMES_LIST[0];
  const developmentTeams = getPopularTeamsForGame(developmentGame?.id);

  useEffect(() => {
    const supabase = getSupabase();
    const cacheKey = "tb_efootball_managers_cache_v1";
    const cached = readJson<{
      savedAt: number;
      managers: EfootballManagerPreset[];
    } | null>(cacheKey, null);
    if (
      cached?.managers?.length &&
      Date.now() - cached.savedAt < 24 * 60 * 60 * 1000
    ) {
      setRuntimeEfootballManagers(cached.managers);
      setEfootballManagers(activeEfootballManagers());
      setManagerDataSource("admin");
    }
    if (!session || !supabase) return;
    let cancelled = false;
    supabase
      .from("efootball_manager_presets")
      .select(
        "id,name,alias,primary_playstyle,secondary_playstyles,proficiency,best_formations,tactical_dna,build_up_pattern,chance_creation,defensive_pattern,best_against,weak_against,role_fits,individual_instructions,advanced_adjustments,link_up_note,confidence,sort_order",
      )
      .eq("is_active", true)
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .limit(80)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.length) return;
        const mapped = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          alias: row.alias || undefined,
          primaryPlaystyle: row.primary_playstyle,
          secondaryPlaystyles: row.secondary_playstyles || [],
          proficiency: row.proficiency,
          bestFormations: row.best_formations || [],
          tacticalDNA: row.tactical_dna,
          buildUpPattern: row.build_up_pattern,
          chanceCreation: row.chance_creation,
          defensivePattern: row.defensive_pattern,
          bestAgainst: row.best_against || [],
          weakAgainst: row.weak_against || [],
          roleFits: row.role_fits || [],
          individualInstructions: row.individual_instructions || [],
          advancedAdjustments: row.advanced_adjustments || [],
          linkUpNote: row.link_up_note || undefined,
          confidence: row.confidence || "Estimated",
        })) as EfootballManagerPreset[];
        setRuntimeEfootballManagers(mapped);
        const merged = activeEfootballManagers();
        setEfootballManagers(merged);
        setManagerDataSource("admin");
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ savedAt: Date.now(), managers: mapped }),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const availableTeams = getPopularTeamsForGame(selectedGame?.id);
  const selectedOwnTeam = getTeamByName(selectedGame?.id, formData.myTeam);
  const selectedOppTeam = getTeamByName(selectedGame?.id, formData.oppTeam);
  const efootballMode = isEfootballGame(selectedGame?.id);
  const selectedEfootballManager =
    getEfootballManager(formData.efootballManagerId) || efootballManagers[0];
  const applyEfootballManagerBoard = (
    managerId = formData.efootballManagerId,
    formation = formData.myFormation,
    opponentFormation = formData.oppFormation,
  ) => {
    if (!isEfootballGame(selectedGame?.id)) return;
    const manager = getEfootballManager(managerId) || efootballManagers[0];
    setBoardState(
      buildEfootballManagerBoard(
        formation || manager.bestFormations[0],
        opponentFormation,
        manager,
      ),
    );
  };
  const todayPlan = dailyTeamPlan(homeGameId);
  const currentChallenges = dailyChallenges(lang);
  const currentLevel = levelInfo(progression.xp, lang);
  const tacticalLevel = tacticalLevelFromXp(progression.xp);
  const unlockedProgressionFeatures = unlockedFeatures(progression.xp);
  const lockedProgressionFeatures = lockedFeatures(progression.xp);
  const nextProgressionUnlock = nextFeatureUnlock(progression.xp);
  const canUseProgressionFeature = (id: FeatureUnlockId) => canUseFeature(progression.xp, id);
  const currentMeta = cloudMeta.length
    ? cloudMeta
    : buildMetaCenter(homeGameId, savedTactics);
  const currentWeeklySummary = weeklySummary(
    savedTactics,
    rivals,
    progression,
    lang,
  );
  const applyTeamToBoard = (
    ownTeamName: string,
    oppTeamName: string,
    myFormation?: string,
    oppFormation?: string,
  ) => {
    const nextBoard = boardFromTeams(
      selectedGame?.id,
      ownTeamName,
      oppTeamName,
      myFormation || formData.myFormation,
      oppFormation || formData.oppFormation,
    );
    if (nextBoard) setBoardState(nextBoard);
  };

  const buildBoardForCurrentGame = (
    nextForm = formData,
    game = selectedGame,
  ) => {
    if (!game) return null;
    if (isEfootballGame(game.id)) {
      const manager =
        getEfootballManager(nextForm.efootballManagerId) ||
        efootballManagers[0];
      return manager
        ? buildEfootballManagerBoard(
            nextForm.myFormation,
            nextForm.oppFormation,
            manager,
          )
        : buildGameAwareBoard(
            game.id,
            nextForm.myFormation,
            nextForm.oppFormation,
          );
    }
    return (
      boardFromTeams(
        game.id,
        nextForm.myTeam,
        nextForm.oppTeam,
        nextForm.myFormation,
        nextForm.oppFormation,
      ) ||
      buildGameAwareBoard(game.id, nextForm.myFormation, nextForm.oppFormation)
    );
  };

  const updateGeneratorForm = (
    patch: Partial<typeof formData>,
    syncBoard = true,
  ) => {
    const nextForm = { ...formData, ...patch };
    setFormData(nextForm);
    if (syncBoard) {
      const nextBoard = buildBoardForCurrentGame(nextForm);
      if (nextBoard) setBoardState(nextBoard);
    }
  };

  const resetToolWorkspace = () => {
    setCurrentResult(null);
    setBoardState(null);
    setRivalBoardState(null);
    setSearchGameQuery("");
    setShowInstructionDetails(false);
    setShowAdvancedPlan(false);
    setSelectedGuidedCardId("best");
    setShowOpponentOnBoard(false);
    setShowExecutionBoard(false);
    setShowBoardScan(false);
  };

  const startBuildMyTactic = () => {
    resetToolWorkspace();
    const game = GAMES_LIST.find((g) => g.id === homeGameId) || GAMES_LIST[0];
    setSelectedGame(game);
    setGeneratorMode("build");
    const manager = isEfootballGame(game.id)
      ? getEfootballManager("guardiola-possession") || efootballManagers[0]
      : null;
    const nextFormation = manager?.bestFormations?.[0] || "4-3-3";
    const nextForm = {
      myFormation: nextFormation,
      oppFormation: "4-4-2",
      opponentStyle: uiText(
        "لا يوجد خصم محدد",
        "No specific opponent",
        "Sin rival específico",
        "Aucun adversaire spécifique",
      ),
      myStyle:
        manager?.primaryPlaystyle ||
        uiText("متوازن", "Balanced", "Equilibrado", "Équilibré"),
      matchState: uiText(
        "بناء خطة لفريقي",
        "Build my own tactic",
        "Crear mi táctica",
        "Créer ma tactique",
      ),
      myTeam: "",
      oppTeam: "",
      notes: "",
      efootballManagerId: manager?.id || "guardiola-possession",
    };
    setFormData(nextForm);
    setBoardState(
      manager
        ? buildEfootballManagerBoard(
            nextFormation,
            nextForm.oppFormation,
            manager,
          )
        : buildGameAwareBoard(game.id, nextFormation, nextForm.oppFormation),
    );
    setSelectedGame(game);
    setStep(2);
    setScreen("generator");
  };

  const startManualBuilder = () => {
    resetToolWorkspace();
    setGeneratorMode("manual");
    const game = GAMES_LIST.find((g) => g.id === homeGameId) || GAMES_LIST.find((g) => g.id === "pes-2021") || GAMES_LIST[0];
    const cfg = manualConfigForGame(game.id);
    setManualPlan((current) => ({
      ...current,
      gameId: game.id,
      formation: getGameDnaProfile(game.id, game.name).formations.includes(current.formation) ? current.formation : (getGameDnaProfile(game.id, game.name).formations[0] || "4-3-3"),
      primaryStyle: cfg.primary.some((item) => item[0] === current.primaryStyle) ? current.primaryStyle : String(cfg.primary[0]?.[0] || ""),
      buildUp: cfg.build.some((item) => item[0] === current.buildUp) ? current.buildUp : String(cfg.build[0]?.[0] || ""),
      attackArea: cfg.area.some((item) => item[0] === current.attackArea) ? current.attackArea : String(cfg.area[0]?.[0] || ""),
      positioning: cfg.positioning.some((item) => item[0] === current.positioning) ? current.positioning : String(cfg.positioning[0]?.[0] || ""),
      defensiveStyle: cfg.defence.some((item) => item[0] === current.defensiveStyle) ? current.defensiveStyle : String(cfg.defence[0]?.[0] || ""),
      containmentArea: cfg.containment.some((item) => item[0] === current.containmentArea) ? current.containmentArea : String(cfg.containment[0]?.[0] || ""),
      pressuring: cfg.pressing.some((item) => item[0] === current.pressuring) ? current.pressuring : String(cfg.pressing[0]?.[0] || ""),
      advancedInstructions: current.advancedInstructions.filter((value) => cfg.advanced.some((item) => item[0] === value)),
    }));
    setSelectedGame(game);
    setManualBoardState(null);
    setShowManualBoard(false);
    setScreen("manual-builder");
  };

  const manualConfigForGame = (gameId: string) => {
    const dna = getGameDnaProfile(gameId, GAMES_LIST.find((g) => g.id === gameId)?.name || "");
    if (dna.family === "pes_classic") return {
      family: dna.family,
      primaryLabel: uiText("أسلوب الهجوم", "Attacking style", "Estilo ofensivo", "Style offensif"),
      primary: [
        ["Possession Game", uiText("استحواذ", "Possession", "Posesión", "Possession")],
        ["Counter Attack", uiText("هجمة مرتدة", "Counter Attack", "Contraataque", "Contre-attaque")],
      ],
      buildLabel: uiText("بناء اللعب", "Build up", "Construcción", "Construction"),
      build: [["Short Pass", uiText("تمرير قصير", "Short Pass", "Pase corto", "Passe courte")], ["Long Pass", uiText("تمرير طويل", "Long Pass", "Pase largo", "Passe longue")]],
      areaLabel: uiText("منطقة الهجوم", "Attacking area", "Zona de ataque", "Zone d’attaque"),
      area: [["Center", uiText("العمق", "Center", "Centro", "Axe")], ["Wide", uiText("الأطراف", "Wide", "Bandas", "Ailes")]],
      positionLabel: uiText("التمركز", "Positioning", "Posicionamiento", "Positionnement"),
      positioning: [["Maintain Formation", uiText("الحفاظ على التشكيل", "Maintain Formation", "Mantener formación", "Garder la formation")], ["Flexible", uiText("مرن", "Flexible", "Flexible", "Flexible")]],
      defenceLabel: uiText("الأسلوب الدفاعي", "Defensive style", "Estilo defensivo", "Style défensif"),
      defence: [["Frontline Pressure", uiText("ضغط أمامي", "Frontline Pressure", "Presión adelantada", "Pressing avancé")], ["All-out Defence", uiText("دفاع متأخر", "All-out Defence", "Defensa total", "Défense totale")]],
      containmentLabel: uiText("منطقة الاحتواء", "Containment area", "Zona de contención", "Zone de confinement"),
      containment: [["Center", uiText("العمق", "Center", "Centro", "Axe")], ["Wide", uiText("الأطراف", "Wide", "Bandas", "Ailes")]],
      pressingLabel: uiText("نوع الضغط", "Pressuring", "Presión", "Pressing"),
      pressing: [["Aggressive", uiText("عدواني", "Aggressive", "Agresivo", "Agressif")], ["Conservative", uiText("محافظ", "Conservative", "Conservador", "Prudent")]],
      advanced: [
        ["Attacking Fullbacks", uiText("أظهرة هجومية", "Attacking Fullbacks", "Laterales ofensivos", "Latéraux offensifs")],
        ["Wing Rotation", uiText("تبادل مراكز الأطراف", "Wing Rotation", "Rotación de bandas", "Rotation des ailes")],
        ["Tiki-Taka", uiText("تيكي تاكا", "Tiki-Taka", "Tiki-Taka", "Tiki-Taka")],
        ["False No.9", uiText("مهاجم وهمي", "False No.9", "Falso 9", "Faux 9")],
        ["Hug the Touchline", uiText("الالتزام بخط التماس", "Hug the Touchline", "Pegarse a la banda", "Coller à la ligne")],
        ["Centering Targets", uiText("أهداف العرضيات", "Centering Targets", "Objetivos de centros", "Cibles de centres")],
        ["False Fullbacks", uiText("أظهرة وهمية", "False Fullbacks", "Laterales falsos", "Faux latéraux")],
        ["Defensive", uiText("دفاعي", "Defensive", "Defensivo", "Défensif")],
        ["Gegenpress", uiText("ضغط عكسي", "Gegenpress", "Gegenpress", "Gegenpress")],
        ["Deep Defensive Line", uiText("خط دفاع عميق", "Deep Defensive Line", "Línea defensiva baja", "Ligne défensive basse")],
        ["Swarm the Box", uiText("تكدس داخل المنطقة", "Swarm the Box", "Cerrar el área", "Densifier la surface")],
        ["Counter Target", uiText("هجوم ضاغط", "Counter Target", "Objetivo de contra", "Cible de contre")],
        ["Tight Marking", uiText("رقابة لصيقة", "Tight Marking", "Marcaje estrecho", "Marquage serré")],
        ["Wing Back", uiText("جناح دفاعي", "Wing Back", "Carrilero defensivo", "Piston défensif")],
      ],
    };
    if (dna.family === "ea_fc" && ["ea-fc-25", "ea-fc-26"].includes(gameId)) {
      const fc26 = gameId === "ea-fc-26";
      return {
        family: "ea_fc_iq",
        primaryLabel: uiText("أسلوب بناء اللعب — داخل اللعبة", "Build-Up Style — in game", "Construcción — en el juego", "Construction — dans le jeu"),
        primary: [
          ["Balanced", uiText("متوازن", "Balanced", "Equilibrado", "Équilibré")],
          ["Short Passing", uiText("تمرير قصير", "Short Passing", "Pase corto", "Passes courtes")],
          ["Counter", uiText("هجوم مرتد", "Counter", "Contraataque", "Contre")],
        ],
        buildLabel: uiText("النهج الدفاعي — داخل اللعبة", "Defensive Approach — in game", "Enfoque defensivo", "Approche défensive"),
        build: [
          ["Deep", uiText("متأخر", "Deep", "Profundo", "Bas")],
          ["Balanced", uiText("متوازن", "Balanced", "Equilibrado", "Équilibré")],
          ["High", uiText("متقدم", "High", "Alto", "Haut")],
          ["Aggressive", uiText("هجومي وضاغط", "Aggressive", "Agresivo", "Agressif")],
        ],
        areaLabel: uiText("ارتفاع الخط — داخل اللعبة", "Line Height — in game", "Altura de línea", "Hauteur de ligne"),
        area: [["35", "35"], ["50", "50"], ["70", "70"], ["90", "90"]],
        positionLabel: uiText("دور لاعب الوسط", "Midfield Role", "Rol de medio", "Rôle du milieu"),
        positioning: [
          ["Holding", uiText("محور ثابت", "Holding", "Pivote", "Sentinelle")],
          ["Centre-Half", uiText("قلب دفاع متقدم من الوسط", "Centre-Half", "Medio central defensivo", "Demi-centre")],
          ["Deep-Lying Playmaker", uiText("صانع لعب متأخر", "Deep-Lying Playmaker", "Organizador retrasado", "Meneur reculé")],
          ["Box-to-Box", uiText("وسط شامل", "Box-to-Box", "Todocampista", "Box-to-box")],
          ["Playmaker", uiText("صانع لعب", "Playmaker", "Organizador", "Meneur")],
          ["Half-Winger", uiText("نصف جناح", "Half-Winger", "Medio banda", "Demi-ailier")],
          ...(fc26 ? [["Box Crasher", uiText("مقتحم الصندوق", "Box Crasher", "Llegador", "Percuteur de surface")]] : []),
        ],
        defenceLabel: uiText("دور الظهير", "Fullback Role", "Rol del lateral", "Rôle du latéral"),
        defence: [
          ["Fullback", uiText("ظهير", "Fullback", "Lateral", "Latéral")],
          ["Wingback", uiText("جناح خلفي", "Wingback", "Carrilero", "Piston")],
          ["Attacking Wingback", uiText("جناح خلفي هجومي", "Attacking Wingback", "Carrilero ofensivo", "Piston offensif")],
          ["Falseback", uiText("ظهير عكسي", "Falseback", "Lateral inverso", "Faux latéral")],
          ...(fc26 ? [["Inverted Wingback", uiText("جناح خلفي عكسي", "Inverted Wingback", "Carrilero invertido", "Piston inversé")]] : []),
        ],
        containmentLabel: uiText("دور المهاجم", "Forward Role", "Rol del delantero", "Rôle de l’attaquant"),
        containment: [
          ["Advanced Forward", uiText("مهاجم متقدم", "Advanced Forward", "Delantero avanzado", "Attaquant avancé")],
          ["Poacher", uiText("قناص", "Poacher", "Cazagoles", "Renard")],
          ["False 9", uiText("مهاجم وهمي", "False 9", "Falso 9", "Faux 9")],
          ["Target Forward", uiText("مهاجم محطة", "Target Forward", "Delantero referencia", "Point d’appui")],
        ],
        pressingLabel: uiText("تركيز الدور", "Role Focus", "Enfoque del rol", "Orientation du rôle"),
        pressing: [
          ["Defend", uiText("دفاع", "Defend", "Defender", "Défendre")],
          ["Balanced", uiText("متوازن", "Balanced", "Equilibrado", "Équilibré")],
          ["Attack", uiText("هجوم", "Attack", "Atacar", "Attaquer")],
        ],
        advanced: [],
      };
    }
    if (dna.family === "ea_fc" && ["fifa-19", "fifa-20", "fifa-21"].includes(gameId)) return {
      family: "ea_fc_legacy",
      primaryLabel: uiText("الأسلوب الدفاعي — داخل اللعبة", "Defensive Style — in game", "Estilo defensivo", "Style défensif"),
      primary: [
        ["Balanced", uiText("متوازن", "Balanced", "Equilibrado", "Équilibré")],
        ["Pressure on Heavy Touch", uiText("ضغط عند اللمسة السيئة", "Pressure on Heavy Touch", "Presión tras toque fuerte", "Pressing sur contrôle raté")],
        ["Press After Possession Loss", uiText("ضغط بعد فقد الكرة", "Press After Possession Loss", "Presión tras pérdida", "Pressing après perte")],
        ["Constant Pressure", uiText("ضغط مستمر", "Constant Pressure", "Presión constante", "Pressing constant")],
        ["Drop Back", uiText("تراجع دفاعي", "Drop Back", "Replegar", "Repli")],
      ],
      buildLabel: uiText("الأسلوب الهجومي — داخل اللعبة", "Offensive Style — in game", "Estilo ofensivo", "Style offensif"),
      build: [
        ["Balanced", uiText("متوازن", "Balanced", "Equilibrado", "Équilibré")],
        ["Possession", uiText("استحواذ", "Possession", "Posesión", "Possession")],
        ["Long Ball", uiText("كرات طويلة", "Long Ball", "Balón largo", "Long ballon")],
        ["Fast Build Up", uiText("بناء سريع", "Fast Build Up", "Construcción rápida", "Construction rapide")],
      ],
      areaLabel: uiText("العرض الهجومي", "Attacking Width", "Anchura ofensiva", "Largeur offensive"),
      area: [["3", "3"], ["5", "5"], ["7", "7"]],
      positionLabel: uiText("اللاعبون داخل المنطقة", "Players in Box", "Jugadores en el área", "Joueurs dans la surface"),
      positioning: [["3", "3"], ["5", "5"], ["7", "7"]],
      defenceLabel: uiText("العرض الدفاعي", "Defensive Width", "Anchura defensiva", "Largeur défensive"),
      defence: [["3", "3"], ["5", "5"], ["7", "7"]],
      containmentLabel: uiText("الركنيات", "Corners", "Córners", "Corners"),
      containment: [["1", "1"], ["3", "3"], ["5", "5"]],
      pressingLabel: uiText("العمق الدفاعي", "Defensive Depth", "Profundidad", "Profondeur"),
      pressing: [["3", "3"], ["5", "5"], ["7", "7"]],
      advanced: [
        ["Stay Back While Attacking", uiText("البقاء في الخلف أثناء الهجوم", "Stay Back While Attacking", "Quedarse atrás", "Rester derrière")],
        ["Join the Attack", uiText("الانضمام للهجوم", "Join the Attack", "Sumarse al ataque", "Participer à l’attaque")],
        ["Overlap", uiText("التقدم من الخارج", "Overlap", "Doblar por fuera", "Déborder")],
        ["Inverted", uiText("الدخول إلى العمق", "Inverted", "Inverso", "Inversé")],
        ["Get In Behind", uiText("التحرك خلف الدفاع", "Get In Behind", "Desmarcarse", "Prendre la profondeur")],
        ["Target Man", uiText("مهاجم محطة", "Target Man", "Hombre objetivo", "Point d’appui")],
        ["False 9", uiText("مهاجم وهمي", "False 9", "Falso 9", "Faux 9")],
        ["Come Back on Defence", uiText("العودة للدفاع", "Come Back on Defence", "Volver a defender", "Revenir défendre")],
        ["Stay Forward", uiText("البقاء في الأمام", "Stay Forward", "Quedarse arriba", "Rester devant")],
        ["Cover Center", uiText("تغطية العمق", "Cover Center", "Cubrir el centro", "Couvrir l’axe")],
        ["Cover Wing", uiText("تغطية الطرف", "Cover Wing", "Cubrir la banda", "Couvrir l’aile")],
        ["Cut Passing Lanes", uiText("قطع خطوط التمرير", "Cut Passing Lanes", "Cortar líneas de pase", "Couper les lignes de passe")],
      ],
    };
    if (dna.family === "ea_fc") return {
      family: "ea_fc_legacy",
      primaryLabel: uiText("الأسلوب الدفاعي — داخل اللعبة", "Defensive Style — in game", "Estilo defensivo", "Style défensif"),
      primary: [
        ["Balanced", uiText("متوازن", "Balanced", "Equilibrado", "Équilibré")],
        ["Pressure on Heavy Touch", uiText("ضغط عند اللمسة السيئة", "Pressure on Heavy Touch", "Presión tras toque fuerte", "Pressing sur contrôle raté")],
        ["Press After Possession Loss", uiText("ضغط بعد فقد الكرة", "Press After Possession Loss", "Presión tras pérdida", "Pressing après perte")],
        ["Constant Pressure", uiText("ضغط مستمر", "Constant Pressure", "Presión constante", "Pressing constant")],
        ["Drop Back", uiText("تراجع دفاعي", "Drop Back", "Replegar", "Repli")],
      ],
      buildLabel: uiText("بناء اللعب — داخل اللعبة", "Build Up Play — in game", "Construcción", "Construction"),
      build: [
        ["Balanced", uiText("متوازن", "Balanced", "Equilibrado", "Équilibré")],
        ["Slow Build Up", uiText("بناء بطيء", "Slow Build Up", "Construcción lenta", "Construction lente")],
        ["Fast Build Up", uiText("بناء سريع", "Fast Build Up", "Construcción rápida", "Construction rapide")],
        ["Long Ball", uiText("كرات طويلة", "Long Ball", "Balón largo", "Long ballon")],
      ],
      areaLabel: uiText("صناعة الفرص — داخل اللعبة", "Chance Creation — in game", "Creación de ocasiones", "Création d’occasions"),
      area: [
        ["Balanced", uiText("متوازن", "Balanced", "Equilibrado", "Équilibré")],
        ["Possession", uiText("استحواذ", "Possession", "Posesión", "Possession")],
        ["Direct Passing", uiText("تمرير مباشر", "Direct Passing", "Pase directo", "Passes directes")],
        ["Forward Runs", uiText("انطلاقات للأمام", "Forward Runs", "Desmarques", "Courses vers l’avant")],
      ],
      positionLabel: uiText("العرض الهجومي", "Attacking Width", "Anchura ofensiva", "Largeur offensive"),
      positioning: [["30", "30"], ["50", "50"], ["70", "70"]],
      defenceLabel: uiText("العرض الدفاعي", "Defensive Width", "Anchura defensiva", "Largeur défensive"),
      defence: [["30", "30"], ["50", "50"], ["70", "70"]],
      containmentLabel: uiText("اللاعبون داخل المنطقة", "Players in Box", "Jugadores en el área", "Joueurs dans la surface"),
      containment: [["4", "4"], ["6", "6"], ["8", "8"]],
      pressingLabel: uiText("العمق الدفاعي", "Defensive Depth", "Profundidad", "Profondeur"),
      pressing: [["35", "35"], ["55", "55"], ["75", "75"]],
      advanced: [
        ["Stay Back While Attacking", uiText("البقاء في الخلف أثناء الهجوم", "Stay Back While Attacking", "Quedarse atrás", "Rester derrière")],
        ["Join the Attack", uiText("الانضمام للهجوم", "Join the Attack", "Sumarse al ataque", "Participer à l’attaque")],
        ["Overlap", uiText("التقدم من الخارج", "Overlap", "Doblar por fuera", "Déborder")],
        ["Inverted", uiText("الدخول إلى العمق", "Inverted", "Inverso", "Inversé")],
        ["Get In Behind", uiText("التحرك خلف الدفاع", "Get In Behind", "Desmarcarse", "Prendre la profondeur")],
        ["Target Man", uiText("مهاجم محطة", "Target Man", "Hombre objetivo", "Point d’appui")],
        ["False 9", uiText("مهاجم وهمي", "False 9", "Falso 9", "Faux 9")],
        ["Come Back on Defence", uiText("العودة للدفاع", "Come Back on Defence", "Volver a defender", "Revenir défendre")],
        ["Stay Forward", uiText("البقاء في الأمام", "Stay Forward", "Quedarse arriba", "Rester devant")],
        ["Cover Center", uiText("تغطية العمق", "Cover Center", "Cubrir el centro", "Couvrir l’axe")],
        ["Cover Wing", uiText("تغطية الطرف", "Cover Wing", "Cubrir la banda", "Couvrir l’aile")],
        ["Cut Passing Lanes", uiText("قطع خطوط التمرير", "Cut Passing Lanes", "Cortar líneas de pase", "Couper les lignes de passe")],
      ],
    };
    return {
      family: "efootball",
      primaryLabel: uiText("أسلوب لعب الفريق", "Team Playstyle", "Estilo de equipo", "Style d’équipe"),
      primary: dna.playstyles.map((x) => [x.value, x.label[lang] || x.label.en]),
      buildLabel: uiText("التعليمة الهجومية الأولى", "Attacking Instruction 1", "Instrucción ofensiva 1", "Consigne offensive 1"),
      build: [
        ["None", uiText("بدون تعليمة", "None", "Ninguna", "Aucune")],
        ["Offensive", uiText("هجومي", "Offensive", "Ofensivo", "Offensif")],
        ["Defensive", uiText("دفاعي", "Defensive", "Defensivo", "Défensif")],
        ["Anchoring", uiText("تثبيت المركز", "Anchoring", "Anclaje", "Ancrage")],
      ],
      areaLabel: uiText("التعليمة الهجومية الثانية", "Attacking Instruction 2", "Instrucción ofensiva 2", "Consigne offensive 2"),
      area: [
        ["None", uiText("بدون تعليمة", "None", "Ninguna", "Aucune")],
        ["Offensive", uiText("هجومي", "Offensive", "Ofensivo", "Offensif")],
        ["Defensive", uiText("دفاعي", "Defensive", "Defensivo", "Défensif")],
        ["Anchoring", uiText("تثبيت المركز", "Anchoring", "Anclaje", "Ancrage")],
      ],
      positionLabel: uiText("التعليمة الدفاعية الأولى", "Defensive Instruction 1", "Instrucción defensiva 1", "Consigne défensive 1"),
      positioning: [
        ["None", uiText("بدون تعليمة", "None", "Ninguna", "Aucune")],
        ["Tight Marking", uiText("رقابة لصيقة", "Tight Marking", "Marcaje estrecho", "Marquage serré")],
        ["Man Marking", uiText("رقابة رجل لرجل", "Man Marking", "Marcaje al hombre", "Marquage individuel")],
        ["Counter Target", uiText("هدف للهجمة المرتدة", "Counter Target", "Objetivo de contra", "Cible de contre")],
        ["Deep Line", uiText("خط متأخر", "Deep Line", "Línea baja", "Ligne basse")],
      ],
      defenceLabel: uiText("التعليمة الدفاعية الثانية", "Defensive Instruction 2", "Instrucción defensiva 2", "Consigne défensive 2"),
      defence: [
        ["None", uiText("بدون تعليمة", "None", "Ninguna", "Aucune")],
        ["Tight Marking", uiText("رقابة لصيقة", "Tight Marking", "Marcaje estrecho", "Marquage serré")],
        ["Man Marking", uiText("رقابة رجل لرجل", "Man Marking", "Marcaje al hombre", "Marquage individuel")],
        ["Counter Target", uiText("هدف للهجمة المرتدة", "Counter Target", "Objetivo de contra", "Cible de contre")],
        ["Deep Line", uiText("خط متأخر", "Deep Line", "Línea baja", "Ligne basse")],
      ],
      containmentLabel: uiText("لا يوجد إعداد إضافي", "No extra setting", "Sin ajuste adicional", "Aucun réglage supplémentaire"),
      containment: [["None", uiText("—", "—", "—", "—")]],
      pressingLabel: uiText("لا يوجد إعداد إضافي", "No extra setting", "Sin ajuste adicional", "Aucun réglage supplémentaire"),
      pressing: [["None", uiText("—", "—", "—", "—")]],
      advanced: [],
    };
  };


  const legacyInstructionOptionsForTarget = (target: string): string[][] => {
    const none: string[][] = [["None", uiText("بدون تعليمة", "None", "Ninguna", "Aucune")]];
    const rows = (values: Array<[string, string, string]>) => values.map(([value, ar, en]) => [value, uiText(ar, en, en, en)]);
    if (target === "GK") return [...none, ...rows([
      ["Comes for Crosses", "الخروج للعرضيات", "Comes for Crosses"],
      ["Cautious with Crosses", "الحذر مع العرضيات", "Cautious with Crosses"],
      ["Sweeper Keeper", "حارس متقدم", "Sweeper Keeper"],
    ])];
    if (target === "CB") return [...none, ...rows([
      ["Stay Back While Attacking", "البقاء في الخلف أثناء الهجوم", "Stay Back While Attacking"],
      ["Join the Attack", "الانضمام للهجوم", "Join the Attack"],
      ["Play As Striker", "اللعب كمهاجم", "Play As Striker"],
      ["Conservative Interceptions", "افتكاك محافظ", "Conservative Interceptions"],
      ["Aggressive Interceptions", "افتكاك عدواني", "Aggressive Interceptions"],
    ])];
    if (["LB", "RB"].includes(target)) return [...none, ...rows([
      ["Stay Back While Attacking", "البقاء في الخلف أثناء الهجوم", "Stay Back While Attacking"],
      ["Balanced Attack", "هجوم متوازن", "Balanced Attack"],
      ["Join the Attack", "الانضمام للهجوم", "Join the Attack"],
      ["Overlap", "التقدم من الخارج", "Overlap"],
      ["Inverted", "الدخول إلى العمق", "Inverted"],
      ["Mixed Attack", "تحرك هجومي متنوع", "Mixed Attack"],
    ])];
    if (target === "CDM") return [...none, ...rows([
      ["Stay Back While Attacking", "البقاء في الخلف أثناء الهجوم", "Stay Back While Attacking"],
      ["Balanced Attack", "هجوم متوازن", "Balanced Attack"],
      ["Get Forward", "التقدم للأمام", "Get Forward"],
      ["Cut Passing Lanes", "قطع خطوط التمرير", "Cut Passing Lanes"],
      ["Man Mark", "رقابة رجل لرجل", "Man Mark"],
      ["Cover Center", "تغطية العمق", "Cover Center"],
      ["Cover Wing", "تغطية الطرف", "Cover Wing"],
    ])];
    if (["CM", "CAM"].includes(target)) return [...none, ...rows([
      ["Stay Back While Attacking", "البقاء في الخلف أثناء الهجوم", "Stay Back While Attacking"],
      ["Balanced Attack", "هجوم متوازن", "Balanced Attack"],
      ["Get Forward", "التقدم للأمام", "Get Forward"],
      ["Get Into Box for Cross", "الدخول للمنطقة مع العرضية", "Get Into Box for Cross"],
      ["Stay on Edge of Box", "البقاء على حدود المنطقة", "Stay on Edge of Box"],
      ["Free Roam", "تحرك حر", "Free Roam"],
      ["Stick to Position", "الالتزام بالمركز", "Stick to Position"],
      ["Cover Center", "تغطية العمق", "Cover Center"],
      ["Cover Wing", "تغطية الطرف", "Cover Wing"],
    ])];
    if (["LM", "RM", "LW", "RW"].includes(target)) return [...none, ...rows([
      ["Come Back on Defence", "العودة للدفاع", "Come Back on Defence"],
      ["Basic Defence Support", "دعم دفاعي متوازن", "Basic Defence Support"],
      ["Stay Forward", "البقاء في الأمام", "Stay Forward"],
      ["Cut Inside", "الدخول إلى العمق", "Cut Inside"],
      ["Balanced Width", "عرض متوازن", "Balanced Width"],
      ["Stay Wide", "البقاء على الطرف", "Stay Wide"],
      ["Get In Behind", "التحرك خلف الدفاع", "Get In Behind"],
      ["Mixed Attack", "تحرك هجومي متنوع", "Mixed Attack"],
      ["Come Short", "الاقتراب للاستلام", "Come Short"],
      ["Target Man", "لاعب محطة", "Target Man"],
      ["Get Into Box for Cross", "الدخول للمنطقة مع العرضية", "Get Into Box for Cross"],
      ["Stay on Edge of Box", "البقاء على حدود المنطقة", "Stay on Edge of Box"],
    ])];
    return [...none, ...rows([
      ["Come Back on Defence", "العودة للدفاع", "Come Back on Defence"],
      ["Basic Defence Support", "دعم دفاعي متوازن", "Basic Defence Support"],
      ["Stay Forward", "البقاء في الأمام", "Stay Forward"],
      ["Drift Wide", "التحرك إلى الطرف", "Drift Wide"],
      ["Stay Central", "البقاء في العمق", "Stay Central"],
      ["Get In Behind", "التحرك خلف الدفاع", "Get In Behind"],
      ["Mixed Attack", "تحرك هجومي متنوع", "Mixed Attack"],
      ["Target Man", "مهاجم محطة", "Target Man"],
      ["False 9", "مهاجم وهمي", "False 9"],
    ])];
  };

  const startCounterOpponent = () => {
    resetToolWorkspace();
    setGeneratorMode("counter");
    const game = GAMES_LIST.find((g) => g.id === homeGameId) || GAMES_LIST[0];
    setSelectedGame(game);
    const nextForm = {
      myFormation: "4-3-3",
      oppFormation: "4-2-3-1",
      opponentStyle: uiText("ضغط عالي", "High press", "Presión alta", "Pressing haut"),
      myStyle: uiText("متوازن", "Balanced", "Equilibrado", "Équilibré"),
      matchState: uiText("بداية المباراة", "Start of match", "Inicio del partido", "Début du match"),
      myTeam: "",
      oppTeam: "",
      notes: "",
      efootballManagerId: "guardiola-possession",
    };
    setFormData(nextForm);
    setBoardState(buildGameAwareBoard(game.id, nextForm.myFormation, nextForm.oppFormation));
    setStep(2);
    setScreen("generator");
  };


  const evaluateManualPlan = async () => {
    const game = GAMES_LIST.find((g) => g.id === homeGameId) || GAMES_LIST.find((g) => g.id === manualPlan.gameId) || GAMES_LIST[0];
    const cfg = manualConfigForGame(game.id);
    const efootballInstructionLabel = (value: string) => {
      const rows = [...(cfg.build as string[][]), ...(cfg.area as string[][]), ...(cfg.positioning as string[][]), ...(cfg.defence as string[][])];
      return String(rows.find(([item]) => item === value)?.[1] || value);
    };
    const formatEfootballInstruction = (value: string, target: string, marker?: string) => {
      if (!value || value === "None") return "";
      const label = efootballInstructionLabel(value);
      if (value === "Man Marking") return `${label}: ${marker || "DMF"} → ${target || "AMF"}`;
      return `${label}: ${target}`;
    };
    const coreComplete = [manualPlan.formation, manualPlan.primaryStyle, manualPlan.buildUp, manualPlan.attackArea, manualPlan.positioning, manualPlan.defensiveStyle, manualPlan.containmentArea, manualPlan.pressuring].filter(Boolean).length;
    const legacyInstructionCount = cfg.family === "ea_fc_legacy"
      ? [manualPlan.legacyInstruction1, manualPlan.legacyInstruction2, manualPlan.legacyInstruction3, manualPlan.legacyInstruction4].filter((value) => value && value !== "None").length
      : 0;
    const complete = coreComplete + (cfg.family === "pes_classic" ? 3 : 0) + (cfg.family === "efootball" ? 4 : 0) + legacyInstructionCount;
    const conflicts: string[] = [];
    if (cfg.family === "ea_fc_iq") {
      const lineHeight = Number(manualPlan.attackArea || 0);
      if (manualPlan.buildUp === "Aggressive" && lineHeight > 0 && lineHeight < 60) conflicts.push(uiText("النهج العدواني يحتاج خطًا أعلى حتى لا تتباعد الخطوط.", "An aggressive approach needs a higher line to keep the team compact."));
      if (manualPlan.buildUp === "Deep" && lineHeight >= 70) conflicts.push(uiText("الدفاع المتأخر لا يتوافق مع ارتفاع خط كبير.", "A deep defensive approach conflicts with a very high line."));
      if (manualPlan.defensiveStyle === "Attacking Wingback" && manualPlan.positioning !== "Holding" && manualPlan.positioning !== "Centre-Half") conflicts.push(uiText("الظهير الهجومي يحتاج لاعب وسط ثابت لتغطية المساحة خلفه.", "An attacking wingback needs a holding midfielder for cover."));
    } else if (cfg.family === "ea_fc_legacy") {
      const depth = Number(manualPlan.pressuring || 0);
      if (manualPlan.primaryStyle === "Drop Back" && depth >= 70) conflicts.push(uiText("التراجع الدفاعي يتعارض مع عمق دفاعي مرتفع.", "Drop Back conflicts with a high defensive depth."));
      if (manualPlan.primaryStyle === "Constant Pressure" && depth > 0 && depth <= 35) conflicts.push(uiText("الضغط المستمر يحتاج عمقًا أعلى من الاختيار الحالي.", "Constant Pressure needs more defensive depth."));
      if (manualPlan.buildUp === "Fast Build Up" && manualPlan.attackArea === "Possession") conflicts.push(uiText("البناء السريع والاستحواذ الهادئ يعطيان تحركات متعارضة.", "Fast Build Up and Possession create conflicting movement patterns."));
    } else if (cfg.family === "efootball") {
      if (manualPlan.buildUp !== "None" && manualPlan.buildUp === manualPlan.attackArea) conflicts.push(uiText("اختر تعليمات هجومية مختلفة بدل تكرار نفس التعليمة مرتين.", "Use two different attacking instructions instead of duplicating one."));
      if (manualPlan.positioning !== "None" && manualPlan.positioning === manualPlan.defensiveStyle) conflicts.push(uiText("اختر تعليمات دفاعية مختلفة بدل تكرار نفس التعليمة مرتين.", "Use two different defensive instructions instead of duplicating one."));
      if (manualPlan.buildUp !== "None" && manualPlan.attackArea !== "None" && manualPlan.attackingPlayer1 === manualPlan.attackingPlayer2) conflicts.push(uiText("لا تضع تعليمتين هجوميتين على نفس اللاعب؛ وزّع الأدوار.", "Do not assign both attacking instructions to the same player."));
      if (manualPlan.positioning !== "None" && manualPlan.defensiveStyle !== "None" && manualPlan.defensivePlayer1 === manualPlan.defensivePlayer2) conflicts.push(uiText("لا تضع تعليمتين دفاعيتين على نفس اللاعب؛ وزّع الرقابة والتغطية.", "Do not assign both defensive instructions to the same player."));
    } else if (cfg.family === "pes_classic") {
      const supportRange = Number(manualPlan.supportRange);
      const defensiveLine = Number(manualPlan.defensiveLineLevel);
      const compactness = Number(manualPlan.compactness);
      if (manualPlan.primaryStyle === "Possession Game" && manualPlan.buildUp === "Long Pass" && manualPlan.positioning === "Flexible") conflicts.push(uiText("الاستحواذ مع تمرير طويل وتمركز مرن قد يفصل خطوط الفريق.", "Possession with long passing and flexible positioning can disconnect the team."));
      if (manualPlan.defensiveStyle === "Frontline Pressure" && manualPlan.pressuring === "Conservative") conflicts.push(uiText("الضغط الأمامي يصبح أقل فاعلية مع ضغط محافظ.", "Frontline Pressure is less effective with conservative pressing."));
      if (manualPlan.primaryStyle === "Possession Game" && supportRange >= 8) conflicts.push(uiText("مدى دعم واسع جدًا يقلل خيارات التمرير القصير في الاستحواذ.", "A very wide support range weakens short-passing options in possession."));
      if (defensiveLine >= 8 && compactness <= 5) conflicts.push(uiText("خط دفاع مرتفع مع تكتل منخفض يفتح مساحات كبيرة بين اللاعبين.", "A high defensive line with low compactness opens large gaps."));
      if (manualPlan.defensiveStyle === "All-out Defence" && defensiveLine >= 8) conflicts.push(uiText("الدفاع المتأخر لا يتناسب مع خط دفاع مرتفع جدًا.", "All-out Defence does not suit a very high defensive line."));
    }
    const board = manualBoardState || buildGameAwareBoard(game.id, manualPlan.formation, "4-2-3-1");
    const boardShape = analyzeManualBoardShape(board);
    const baseScore = 58 + complete * 4 + Math.min(6, manualPlan.advancedInstructions.length * 2);
    const score = Math.max(45, Math.min(96, Math.round((baseScore + boardShape.score) / 2) - conflicts.length * 8));
    const nextForm = {
      myFormation: manualPlan.formation,
      oppFormation: "4-2-3-1",
      opponentStyle: uiText("تقييم خطة مبنية يدويًا", "Manual tactic evaluation", "Evaluación manual", "Évaluation manuelle"),
      myStyle: manualPlan.primaryStyle,
      matchState: uiText("خطة كاملة من إعداد المستخدم", "User-built complete tactic", "Táctica creada", "Tactique créée"),
      myTeam: "",
      oppTeam: "",
      notes: `${manualPlan.notes} | BUILD_UP:${manualPlan.buildUp} | ATTACK_AREA:${manualPlan.attackArea} | POSITIONING:${manualPlan.positioning} | DEFENCE:${manualPlan.defensiveStyle} | CONTAINMENT:${manualPlan.containmentArea} | PRESSURING:${manualPlan.pressuring} | SUPPORT_RANGE:${manualPlan.supportRange} | DEFENSIVE_LINE:${manualPlan.defensiveLineLevel} | COMPACTNESS:${manualPlan.compactness} | EF_ATTACK_1:${manualPlan.buildUp}@${manualPlan.attackingPlayer1} | EF_ATTACK_2:${manualPlan.attackArea}@${manualPlan.attackingPlayer2} | EF_DEFENCE_1:${manualPlan.positioning}@${manualPlan.defensiveMarker1 || "DMF"}>${manualPlan.defensivePlayer1} | EF_DEFENCE_2:${manualPlan.defensiveStyle}@${manualPlan.defensiveMarker2 || "CB"}>${manualPlan.defensivePlayer2} | CORNERS:${manualPlan.corners} | FREE_KICKS:${manualPlan.freeKicks} | GK_ROLE:${manualPlan.gkRole}@${manualPlan.gkFocus || "Defend"} | CB_ROLE:${manualPlan.cbRole}@${manualPlan.cbFocus || "Defend"} | FULLBACK_ROLE:${manualPlan.defensiveStyle}@${manualPlan.fullbackFocus || "Defend"} | MIDFIELD_ROLE:${manualPlan.positioning}@${manualPlan.midfieldFocus || "Balanced"} | WIDE_ROLE:${manualPlan.wideRole}@${manualPlan.wideFocus || "Balanced"} | FORWARD_ROLE:${manualPlan.containmentArea}@${manualPlan.forwardFocus || "Attack"} | LEGACY_1:${manualPlan.legacyInstruction1}@${manualPlan.attackingPlayer1} | LEGACY_2:${manualPlan.legacyInstruction2}@${manualPlan.attackingPlayer2} | LEGACY_3:${manualPlan.legacyInstruction3}@${manualPlan.defensivePlayer1} | LEGACY_4:${manualPlan.legacyInstruction4}@${manualPlan.defensivePlayer2} | ADVANCED:${manualPlan.advancedInstructions.join(",")} | TIGHT_MARK_PES:${manualPlan.tightMarkTarget || ""}`,
      efootballManagerId: formData.efootballManagerId,
    };
    const raw = generateLocalTactic(game, nextForm, lang);
    const normalized = normalizeResultLanguage(raw, lang, nextForm.oppFormation, nextForm.opponentStyle);
    const result: TacticResult = {
      ...normalized,
      formation: manualPlan.formation,
      attackingStyle: gameDnaOptionLabel(getGameDnaProfile(game.id, game.name), manualPlan.primaryStyle, lang),
      defensiveStyle: uiText(
        `${gameDnaOptionLabel(getGameDnaProfile(game.id, game.name), manualPlan.defensiveStyle, lang)} • ${gameDnaOptionLabel(getGameDnaProfile(game.id, game.name), manualPlan.containmentArea, lang)}`,
        `${manualPlan.defensiveStyle} • ${manualPlan.containmentArea}`,
      ),
      reason: uiText(
        `تقييم خطتك اليدوية: بنيت ${manualPlan.formation} بأسلوب ${gameDnaOptionLabel(getGameDnaProfile(game.id, game.name), manualPlan.primaryStyle, lang)}. قوة الخطة تعتمد على ترابط البناء، منطقة الهجوم، والغطاء الدفاعي، وليس على اسم الأسلوب فقط.`,
        `Manual tactic rating: ${manualPlan.formation} with ${manualPlan.primaryStyle}. The score reflects build-up, attack area and defensive cover working together.`,
      ),
      attackingDetails: {
        [cfg.buildLabel]: (cfg.build.find((x) => x[0] === manualPlan.buildUp)?.[1] || manualPlan.buildUp) as string,
        [cfg.areaLabel]: (cfg.area.find((x) => x[0] === manualPlan.attackArea)?.[1] || manualPlan.attackArea) as string,
        ...(cfg.family !== "ea_fc_iq" ? { [cfg.positionLabel]: (cfg.positioning.find((x) => x[0] === manualPlan.positioning)?.[1] || manualPlan.positioning) as string } : {}),
        ...(cfg.family === "pes_classic" ? { [uiText("مدى الدعم", "Support Range")]: manualPlan.supportRange } : {}),
        ...(cfg.family === "efootball" ? {
          [uiText("تعليمة الهجوم 1", "Attacking Instruction 1")]: formatEfootballInstruction(manualPlan.buildUp, manualPlan.attackingPlayer1),
          [uiText("تعليمة الهجوم 2", "Attacking Instruction 2")]: formatEfootballInstruction(manualPlan.attackArea, manualPlan.attackingPlayer2),
        } : {}),
      },
      defensiveDetails: {
        ...(cfg.family !== "ea_fc_iq" ? {
          [cfg.defenceLabel]: (cfg.defence.find((x) => x[0] === manualPlan.defensiveStyle)?.[1] || manualPlan.defensiveStyle) as string,
          [cfg.containmentLabel]: (cfg.containment.find((x) => x[0] === manualPlan.containmentArea)?.[1] || manualPlan.containmentArea) as string,
          [cfg.pressingLabel]: (cfg.pressing.find((x) => x[0] === manualPlan.pressuring)?.[1] || manualPlan.pressuring) as string,
        } : {
          [cfg.buildLabel]: (cfg.build.find((x) => x[0] === manualPlan.buildUp)?.[1] || manualPlan.buildUp) as string,
          [cfg.areaLabel]: manualPlan.attackArea,
        }),
        ...(cfg.family === "pes_classic" ? {
          [uiText("خط الدفاع", "Defensive Line")]: manualPlan.defensiveLineLevel,
          [uiText("التكتل", "Compactness")]: manualPlan.compactness,
          ...(manualPlan.tightMarkTarget ? {
            [uiText("رقابة لصيقة على", "Tight Marking on")]: manualPlan.tightMarkTarget
          } : {}),
        } : {}),
        ...(cfg.family === "efootball" ? {
          [uiText("تعليمة الدفاع 1", "Defensive Instruction 1")]: formatEfootballInstruction(manualPlan.positioning, manualPlan.defensivePlayer1, manualPlan.defensiveMarker1),
          [uiText("تعليمة الدفاع 2", "Defensive Instruction 2")]: formatEfootballInstruction(manualPlan.defensiveStyle, manualPlan.defensivePlayer2, manualPlan.defensiveMarker2),
        } : {}),
      },
      playerInstructions: cfg.family === "efootball"
        ? [
            formatEfootballInstruction(manualPlan.buildUp, manualPlan.attackingPlayer1),
            formatEfootballInstruction(manualPlan.attackArea, manualPlan.attackingPlayer2),
            formatEfootballInstruction(manualPlan.positioning, manualPlan.defensivePlayer1, manualPlan.defensiveMarker1),
            formatEfootballInstruction(manualPlan.defensiveStyle, manualPlan.defensivePlayer2, manualPlan.defensiveMarker2),
          ].filter(Boolean)
        : cfg.family === "ea_fc_legacy"
          ? [
              [manualPlan.legacyInstruction1, manualPlan.attackingPlayer1],
              [manualPlan.legacyInstruction2, manualPlan.attackingPlayer2],
              [manualPlan.legacyInstruction3, manualPlan.defensivePlayer1],
              [manualPlan.legacyInstruction4, manualPlan.defensivePlayer2],
            ].filter(([instruction]) => instruction && instruction !== "None").map(([instruction, target]) => `${String(legacyInstructionOptionsForTarget(String(target)).find((x) => x[0] === instruction)?.[1] || instruction)} — ${target}`)
          : cfg.family === "ea_fc_iq"
            ? [
                `${uiText("الحارس", "Goalkeeper")}: ${manualPlan.gkRole} — ${manualPlan.gkFocus || "Defend"}`,
                `${uiText("قلب الدفاع", "Centre-back")}: ${manualPlan.cbRole} — ${manualPlan.cbFocus || "Defend"}`,
                `${uiText("الظهير", "Fullback")}: ${manualPlan.defensiveStyle} — ${manualPlan.fullbackFocus || "Defend"}`,
                `${uiText("وسط الملعب", "Midfield")}: ${manualPlan.positioning} — ${manualPlan.midfieldFocus || "Balanced"}`,
                `${uiText("الطرف", "Wide player")}: ${manualPlan.wideRole} — ${manualPlan.wideFocus || "Balanced"}`,
                `${uiText("المهاجم", "Forward")}: ${manualPlan.containmentArea} — ${manualPlan.forwardFocus || "Attack"}`,
              ]
            : manualPlan.advancedInstructions.map((value) => String(cfg.advanced.find((x) => x[0] === value)?.[1] || value)),
      boardAnalysis: [
        uiText(`تقييم الخطة اليدوية: ${score}/100`, `Manual tactic score: ${score}/100`),
        ...(conflicts.length ? [uiText("تعارضات تحتاج تعديل:", "Conflicts to fix:"), ...conflicts] : [uiText("الإعدادات مترابطة ولا توجد تعارضات واضحة.", "The selected settings are coherent with no obvious conflicts.")]),
        ...(manualPlan.notes ? [manualPlan.notes] : []),
      ],
      score,
      rating: score,
      confidence: `${score}%`,
    };
    const locked = lockFinalPlanResult(result, board, { sourceTool: "manual-builder", game: game.id, language: lang, formation: manualPlan.formation, playstyle: manualPlan.primaryStyle, confidenceFallback: score });
    setSelectedGame(game);
    setGeneratorMode("manual");
    setFormData(nextForm);
    setBoardState(locked.board);
    setCurrentResult(locked.result);
    setScreen("result");
    awardActivity("generate");
  };

  const requestPasswordReset = async () => {
    const email = session?.user?.email;
    if (!email) return;
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/?recovery=1` });
    triggerToast(error ? uiText("تعذر إرسال رابط تغيير كلمة المرور.", "Could not send password reset link.") : uiText("تم إرسال رابط تغيير كلمة المرور إلى بريدك.", "Password reset link sent to your email."));
  };

  const completePasswordRecovery = async () => {
    setPasswordRecoveryMessage("");
    if (newPassword.length < 8) {
      setPasswordRecoveryMessage(uiText("كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف.", "The new password must contain at least 8 characters."));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordRecoveryMessage(uiText("كلمتا المرور غير متطابقتين.", "The passwords do not match."));
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      setPasswordRecoveryMessage(uiText("تعذر فتح استعادة الحساب الآن.", "Account recovery is unavailable right now."));
      return;
    }
    setPasswordRecoveryLoading(true);
    const { error } = await sb.auth.updateUser({ password: newPassword });
    setPasswordRecoveryLoading(false);
    if (error) {
      setPasswordRecoveryMessage(uiText("تعذر تحديث كلمة المرور. افتح رابط الاستعادة من جديد.", "Could not update the password. Open the recovery link again."));
      return;
    }
    window.history.replaceState({}, document.title, window.location.pathname);
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordRecoveryMode(false);
    triggerToast(uiText("تم تغيير كلمة المرور بنجاح.", "Password changed successfully."));
  };

  const requestPlanPurchase = (plan: "pro" | "elite") => {
    const billingBridge =
      (window as any).TacticBossBilling || (window as any).AndroidBilling;
    if (billingBridge?.purchase) {
      billingBridge.purchase(plan);
      return;
    }
    triggerToast(
      uiText(
        "الاشتراك المدفوع غير متاح من هذه النسخة حاليًا.",
        "Paid subscription is not available in this version yet.",
        "La suscripción de pago aún no está disponible.",
        "L’abonnement payant n’est pas encore disponible.",
      ),
    );
  };

  const applyRivalBoardTemplate = (teamName: string, formation?: string) => {
    if (!rivalGameItem) return;
    const nextBoard = boardFromTeams(
      rivalGameItem.id,
      "",
      teamName,
      "4-3-3",
      formation || rivalForm.favoriteFormation,
    );
    if (nextBoard) setRivalBoardState(nextBoard);
  };

  const prepareDevelopmentBoard = (
    gameId: string,
    teamName: string,
    formation: string,
  ) => {
    const nextBoard = boardFromTeams(gameId, teamName, "", formation, "4-4-2");
    setDevelopmentBoard(nextBoard);
    setDevelopmentResult(null);
  };

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [currentResult, setCurrentResult] = useState<TacticResult | null>(null);

  const [selectedGuidedCardId, setSelectedGuidedCardId] = useState<string>("best");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<null | {
    title: string;
    message: string;
    confirmLabel: string;
    action: () => Promise<void> | void;
  }>(null);
  const resultWarningCount =
    currentResult?.boardAnalysis?.filter(
      (item) => !/متوازن|balanced|equilibr|équilibr/i.test(item),
    ).length || 0;
  const resultTacticalScore = Math.max(
    55,
    Math.min(98, 95 - resultWarningCount * 9 + (formData.myTeam ? 2 : 0)),
  );

  const getLockedBoardState = (result = currentResult, fallback = boardState) =>
    cloneBoardState(fallback || result?.finalBoard);

  const lockExistingResult = (
    result: TacticResult,
    board: TacticalBoardState | null | undefined = boardState,
    sourceTool = generatorMode,
  ) =>
    lockFinalPlanResult(result, board, {
      sourceTool,
      game: selectedGame?.id || homeGameId,
      language: lang,
      formation: result.formation || formData.myFormation,
      playstyle: result.attackingStyle || formData.myStyle,
      confidenceFallback: resultTacticalScore,
    });

  const openLockedResult = (
    result: TacticResult,
    board: TacticalBoardState | null | undefined,
    sourceTool = generatorMode,
  ) => {
    const locked = lockExistingResult(result, board, sourceTool);
    setCurrentResult(locked.result);
    setBoardState(locked.board);
    return locked;
  };

  const cleanTacticText = (value: string) => {
    const raw = translateTacticText(String(value || ""), lang);
    const replacements: Record<string, string> = {
      BUILD_MY_TACTIC: uiText(
        "بناء خطتي",
        "Build My Tactic",
        "Crear mi táctica",
        "Créer ma tactique",
      ),
      "Playstyle-led": uiText(
        "حسب أسلوب اللعب",
        "Playstyle-led",
        "Según el estilo",
        "Selon le style",
      ),
      "Role-based cover": uiText(
        "تغطية حسب الأدوار",
        "Role-based cover",
        "Cobertura por roles",
        "Couverture par rôles",
      ),
      "Match squad DNA": uiText(
        "حسب تشكيلة الفريق",
        "Squad DNA",
        "ADN del equipo",
        "ADN de l’équipe",
      ),
      Adaptive: uiText(
        "متغير حسب المباراة",
        "Adaptive",
        "Adaptable",
        "Adaptatif",
      ),
      Estimated: uiText("تقديري", "Estimated", "Estimado", "Estimé"),
      "Official + inferred meta": uiText(
        "رسمي مع تقدير تكتيكي",
        "Official + inferred meta",
        "Oficial + inferido",
        "Officiel + déduit",
      ),
      "Possession Game": uiText(
        "استحواذ",
        "Possession Game",
        "Posesión",
        "Possession",
      ),
      "Quick Counter": uiText(
        "مرتدات سريعة",
        "Quick Counter",
        "Contra rápida",
        "Contre rapide",
      ),
      "Long Ball Counter": uiText(
        "مرتدات بالكرات الطويلة",
        "Long Ball Counter",
        "Contra con balones largos",
        "Contre longs ballons",
      ),
      "Out Wide": uiText(
        "لعب على الأطراف",
        "Out Wide",
        "Juego por bandas",
        "Jeu sur les ailes",
      ),
      "Long Ball": uiText(
        "كرات طويلة",
        "Long Ball",
        "Balones largos",
        "Longs ballons",
      ),
      "Goal Poacher": uiText(
        "مهاجم يهاجم المساحة",
        "Goal Poacher",
        "Cazagoles",
        "Renard d’espace",
      ),
      "Fox in the Box": uiText(
        "مهاجم صندوق",
        "Fox in the Box",
        "Zorro del área",
        "Renard de surface",
      ),
      "Target Man": uiText(
        "مهاجم محطة",
        "Target Man",
        "Delantero referencia",
        "Point d’appui",
      ),
      "Deep-Lying Forward": uiText(
        "مهاجم رابط",
        "Deep-Lying Forward",
        "Delantero de apoyo",
        "Attaquant de soutien",
      ),
      "Hole Player": uiText(
        "لاعب بين الخطوط",
        "Hole Player",
        "Llegador entre líneas",
        "Joueur entre les lignes",
      ),
      "Creative Playmaker": uiText(
        "صانع لعب",
        "Creative Playmaker",
        "Organizador creativo",
        "Meneur créatif",
      ),
      "Classic No.10": uiText(
        "صانع لعب كلاسيكي",
        "Classic No.10",
        "Clásico 10",
        "Numéro 10 classique",
      ),
      "Anchor Man": uiText(
        "محور ثابت",
        "Anchor Man",
        "Pivote fijo",
        "Sentinelle",
      ),
      Destroyer: uiText(
        "قاطع كرات",
        "Destroyer",
        "Destructor",
        "Récupérateur agressif",
      ),
      "Build Up": uiText("بناء لعب", "Build Up", "Salida de balón", "Relance"),
      Orchestrator: uiText(
        "منظم لعب",
        "Orchestrator",
        "Organizador",
        "Organisateur",
      ),
      "Box-to-Box": uiText(
        "وسط شامل",
        "Box-to-Box",
        "Todocampista",
        "Milieu box-to-box",
      ),
      "Offensive Full-back": uiText(
        "ظهير هجومي",
        "Offensive Full-back",
        "Lateral ofensivo",
        "Latéral offensif",
      ),
      "Defensive Full-back": uiText(
        "ظهير دفاعي",
        "Defensive Full-back",
        "Lateral defensivo",
        "Latéral défensif",
      ),
      "Full-back Finisher": uiText(
        "ظهير يدخل للعمق",
        "Full-back Finisher",
        "Lateral interior",
        "Latéral finisseur",
      ),
      "Prolific Winger": uiText(
        "جناح مباشر",
        "Prolific Winger",
        "Extremo profundo",
        "Ailier percutant",
      ),
      "Roaming Flank": uiText(
        "جناح يدخل للعمق",
        "Roaming Flank",
        "Extremo interior",
        "Ailier rentrant",
      ),
      "Counter Target": uiText(
        "هدف للمرتدات",
        "Counter Target",
        "Objetivo de contra",
        "Cible de contre",
      ),
      "False 9": uiText("مهاجم وهمي", "False 9", "Falso 9", "Faux 9"),
      "Tiki-Taka": uiText("تيكي تاكا", "Tiki-Taka", "Tiki-Taka", "Tiki-Taka"),
      "Hug the Touchline": uiText(
        "الالتزام بالخط",
        "Hug the Touchline",
        "Pegarse a la banda",
        "Coller à la ligne",
      ),
      "Wing Rotation": uiText(
        "دوران الأجنحة",
        "Wing Rotation",
        "Rotación de bandas",
        "Rotation des ailes",
      ),
      "Attacking Fullbacks": uiText(
        "ظهيران مهاجمان",
        "Attacking Fullbacks",
        "Laterales ofensivos",
        "Latéraux offensifs",
      ),
      "False Fullbacks": uiText(
        "ظهيران وهميان",
        "False Fullbacks",
        "Laterales falsos",
        "Faux latéraux",
      ),
      Defensive: uiText("دفاعي", "Defensive", "Defensivo", "Défensif"),
      "Deep Defensive Line": uiText(
        "خط دفاع متأخر",
        "Deep Defensive Line",
        "Línea defensiva baja",
        "Ligne défensive basse",
      ),
      Gegenpress: uiText("ضغط عكسي", "Gegenpress", "Gegenpress", "Gegenpress"),
      "Swarm the Box": uiText(
        "التكدس داخل المنطقة",
        "Swarm the Box",
        "Poblar el área",
        "Surnombre dans la surface",
      ),
      "Tight Marking": uiText(
        "مراقبة لصيقة",
        "Tight Marking",
        "Marcaje estrecho",
        "Marquage serré",
      ),
      "Man Marking": uiText(
        "مراقبة رجل لرجل",
        "Man Marking",
        "Marcaje al hombre",
        "Marquage individuel",
      ),
      "Attack 1": uiText(
        "تعليمة هجومية 1",
        "Attack instruction 1",
        "Instrucción ataque 1",
        "Consigne attaque 1",
      ),
      "Attack 2": uiText(
        "تعليمة هجومية 2",
        "Attack instruction 2",
        "Instrucción ataque 2",
        "Consigne attaque 2",
      ),
      "Defence 1": uiText(
        "تعليمة دفاعية 1",
        "Defence instruction 1",
        "Instrucción defensa 1",
        "Consigne défense 1",
      ),
      "Defence 2": uiText(
        "تعليمة دفاعية 2",
        "Defence instruction 2",
        "Instrucción defensa 2",
        "Consigne défense 2",
      ),
      "Player Style": uiText(
        "نوع اللاعب",
        "Player Style",
        "Estilo jugador",
        "Style joueur",
      ),
      "Defensive on": uiText(
        "تعليمات دفاعية على",
        "Defensive on",
        "Defensivo en",
        "Défensif sur",
      ),
      Anchoring: uiText("تثبيت اللاعب", "Anchoring", "Anclaje", "Ancrage"),
      "Deep Line": uiText(
        "خط دفاع متأخر",
        "Deep Line",
        "Línea baja",
        "Ligne basse",
      ),
      "Individual 1": uiText(
        "تعليمة 1",
        "Individual 1",
        "Individual 1",
        "Individuel 1",
      ),
      "Individual 2": uiText(
        "تعليمة 2",
        "Individual 2",
        "Individual 2",
        "Individuel 2",
      ),
      "Individual 3": uiText(
        "تعليمة 3",
        "Individual 3",
        "Individual 3",
        "Individuel 3",
      ),
      "Individual 4": uiText(
        "تعليمة 4",
        "Individual 4",
        "Individual 4",
        "Individuel 4",
      ),
      DMF: uiText("محور دفاعي DMF", "DMF", "MCD", "MDF"),
      CMF: uiText("وسط CMF", "CMF", "MC", "MC"),
      CF: uiText("رأس حربة CF", "CF", "DC", "AC"),
      LWF: uiText("جناح أيسر LWF", "LWF", "EI", "AG"),
      RWF: uiText("جناح أيمن RWF", "RWF", "ED", "AD"),
      "RB/LB": uiText("ظهير RB/LB", "RB/LB", "LD/LI", "DD/DG"),
    };
    const mixedLanguageFixes: Record<string, string> =
      lang === "en"
        ? {
            "مرتدات سريعة": "Quick Counter",
            "هجوم مرتد سريع": "Quick Counter",
            "مرتدات طويلة": "Long Ball Counter",
            "كرات طويلة": "Long Ball",
            "استحواذ وتمرير قصير": "Possession Game",
            "استحواذ": "Possession",
            "هجومي": "Attacking",
            "دفاعي": "Defensive",
            "متوازن": "Balanced",
            "ضغط عالي": "High Press",
            "العمق": "Centre",
            "الأطراف": "Wide",
            "تمرير قصير": "Short Pass",
            "تمرير طويل": "Long Pass",
            "مرن": "Flexible",
            "الحفاظ على التشكيل": "Maintain Formation",
            "ضغط من الأمام": "Frontline Pressure",
            "دفاع شامل": "All-out Defence",
            "محافظ": "Conservative",
            "عدواني": "Aggressive",
            "هادئ": "Calm",
            "على": "on",
            "الفريق بالكامل": "whole team",
            "رأس الحربة": "CF striker",
            "أسرع جناح": "fastest winger",
            "مدرب": "Manager",
          }
        : lang === "ar"
          ? {
              "Quick Counter": "مرتدات سريعة",
              "Long Ball Counter": "مرتدات طويلة",
              "Possession Game": "استحواذ",
              "Out Wide": "لعب على الأطراف",
              "Long Ball": "كرات طويلة",
              "Counter Attack": "هجوم مرتد",
              "Short Pass": "تمرير قصير",
              "Long Pass": "تمرير طويل",
              "Centre": "العمق",
              "Wide": "الأطراف",
              "Flexible": "مرن",
              "Maintain Formation": "الحفاظ على التشكيل",
              "Frontline Pressure": "ضغط من الأمام",
              "All-out Defence": "دفاع شامل",
              "Conservative": "محافظ",
              "Aggressive": "هجومي",
              "Balanced": "متوازن",
              "on": "على",
              "whole team": "الفريق بالكامل",
            }
          : {};
    const phraseFixes: Record<string, string> =
      lang === "en"
        ? {
            "ابدأ بإيقاع آمن أول 10 دقائق": "Start with a safe tempo for the first 10 minutes",
            "لا ترفع الظهيرين معًا": "Do not push both fullbacks together",
            "غير الرتم بعد أول فرصة واضحة": "change tempo after the first clear chance",
            "غيّر الرتم بعد أول فرصة واضحة": "change tempo after the first clear chance",
            "لو متقدم: قلل المخاطرة وثبت DMF أمام الظهيرين، واحفظ الدفاع": "If leading: reduce risk, keep the DMF in front of the fullbacks, and protect the defence",
            "لو متأخر: زود لاعبًا بين الخطوط ولا تكسر التوازن الدفاعي": "If trailing: add one between-lines runner without breaking defensive balance",
            "لو متأخر زود لاعبًا بين الخطوط ولا تكسر التوازن الدفاعي": "If trailing: add one between-lines runner without breaking defensive balance",
            "أسلوب لعبك فقط بدون خصوم": "Your playstyle only, without rival input",
            "الخطة مبنية على أسلوبك المختار": "The plan is based on your selected playstyle",
            "لا تستخدم تعليمات متعارضة": "Do not use conflicting instructions",
            "لا ترفع خط الدفاع ضد السرعة": "Do not raise the defensive line against pace",
            "لا تفتح التكتل ضد لعب": "Do not open compactness against",
            "خارج أسلوبه الأساسي بدون تعديل": "outside his main style without adjustment",
            "توزيع فريقك متوازن مبدئيًا ويمكن البناء عليه": "Your team shape is initially balanced and can be built on",
            "لكل لاعب Playing Style لا تنسخ التشكيل فقط": "Every player has a playstyle; do not copy the shape only",
            "لا تستخدم Counter Target على أكثر من لاعب": "Do not use Counter Target on more than one player",
            "ثبّت أسلوب الفريق قبل التشكيلة": "Lock the team playstyle before the shape",
            "استخدم تعليمات قليلة وواضحة": "Use only a few clear instructions",
            "احمِ العمق قبل رفع الرتم": "Protect the centre before increasing tempo",
          }
        : lang === "ar"
          ? {
              "If leading: lower risk, hold the fullbacks, and keep DMF in front of defence.": "لو متقدم: قلل المخاطرة، ثبّت الظهيرين، وخلي DMF أمام الدفاع.",
              "If trailing: add a between-lines runner without breaking defensive balance.": "لو متأخر: زوّد لاعب بين الخطوط بدون كسر التوازن الدفاعي.",
              "Start with a safe tempo for the first 10 minutes": "ابدأ بإيقاع آمن أول 10 دقائق",
              "change tempo after the first clear chance": "غيّر الرتم بعد أول فرصة واضحة",
              "Do not push both fullbacks together": "لا ترفع الظهيرين معًا",
              "Your playstyle only, without rival input": "أسلوب لعبك فقط بدون خصوم",
              "Do not use conflicting instructions": "لا تستخدم تعليمات متعارضة",
              "Board reading": "قراءة السبورة",
              "Common mistakes": "أخطاء شائعة",
              "Why?": "لماذا؟",
              "Watch out": "احذر",
              "Save Tactic": "حفظ الخطة",
              "Modify Inputs": "تعديل المدخلات",
            }
          : {};
    let output = Object.entries({ ...replacements, ...mixedLanguageFixes, ...phraseFixes })
      .reduce((text, [from, to]) => text.replaceAll(from, to), raw)
      .replace(/\s+/g, " ")
      .replace(/\(\(/g, "(")
      .replace(/\)\)/g, ")")
      .trim();

    // Hard language guard: never show Arabic fragments while a non-Arabic UI is selected.
    // This catches cached or remote fallback text that still contains Arabic snippets.
    if (lang !== "ar" && /[\u0600-\u06FF]/.test(output)) {
      output = output
        .replace(/[\u0600-\u06FF]+/g, "")
        .replace(/\s*،\s*/g, ", ")
        .replace(/\s*؛\s*/g, "; ")
        .replace(/\s+/g, " ")
        .trim();
      const fallbackByLang: Record<string, string> = {
        en: "Follow the selected plan and avoid conflicting instructions.",
        es: "Sigue el plan elegido y evita instrucciones contradictorias.",
        fr: "Suivez le plan choisi et évitez les consignes contradictoires.",
      };
      if (!output || output.length < 8) output = fallbackByLang[lang] || fallbackByLang.en;
    }
    // Spanish/French guard: translate recurring English labels from tactical cards and coach tips.
    if (lang === "es") {
      output = output
        .replaceAll("If leading", "Si vas ganando")
        .replaceAll("If trailing", "Si vas perdiendo")
        .replaceAll("Why?", "¿Por qué?")
        .replaceAll("Watch out", "Cuidado")
        .replaceAll("Board reading", "Lectura de pizarra")
        .replaceAll("Common mistakes", "Errores comunes")
        .replaceAll("Match instructions", "Instrucciones de partido")
        .replaceAll("Save Tactic", "Guardar táctica")
        .replaceAll("Modify Inputs", "Modificar datos")
        .replaceAll("Follow the selected plan and avoid conflicting instructions.", "Sigue el plan elegido y evita instrucciones contradictorias.")
        .replaceAll("Start with", "Empieza con")
        .replaceAll("do not", "no")
        .replaceAll("Counter Target", "Objetivo de contra")
        .replaceAll("Defensive", "Defensivo")
        .replaceAll("Deep Line", "Línea profunda")
        .replaceAll("Man Marking", "Marcaje al hombre")
        .replaceAll("Tight Marking", "Marcaje estrecho");
    }
    if (lang === "fr") {
      output = output
        .replaceAll("If leading", "Si vous menez")
        .replaceAll("If trailing", "Si vous êtes mené")
        .replaceAll("Why?", "Pourquoi ?")
        .replaceAll("Watch out", "Attention")
        .replaceAll("Board reading", "Lecture du tableau")
        .replaceAll("Common mistakes", "Erreurs fréquentes")
        .replaceAll("Match instructions", "Consignes de match")
        .replaceAll("Save Tactic", "Enregistrer la tactique")
        .replaceAll("Modify Inputs", "Modifier les données")
        .replaceAll("Follow the selected plan and avoid conflicting instructions.", "Suivez le plan choisi et évitez les consignes contradictoires.")
        .replaceAll("Start with", "Commencez avec")
        .replaceAll("do not", "ne")
        .replaceAll("Counter Target", "Cible de contre")
        .replaceAll("Defensive", "Défensif")
        .replaceAll("Deep Line", "Ligne basse")
        .replaceAll("Man Marking", "Marquage individuel")
        .replaceAll("Tight Marking", "Marquage serré");
    }
    return output;
  };

  const splitTacticSettings = (settings: Array<[string, string]>) => {
    const lower = (v: string) => String(v || "").toLowerCase();
    const isAttack = (label: string) =>
      /attacking|attack|build|support|positioning|chance|players in box|corners|free kicks|width|team playstyle|manager fit|platform|tactical system|build-up|line height/i.test(
        label,
      );
    const isDefence = (label: string) =>
      /defensive|defence|defense|pressuring|containment|compactness|rest defence|depth/i.test(
        label,
      );
    const isInstruction = (label: string) =>
      /advanced|instruction|dna|role|game identity|match state/i.test(label);
    const coreNames = new Set([
      "Attacking Style",
      "Build Up",
      "Attacking Area",
      "Positioning",
      "Support Range",
      "Defensive Style",
      "Containment Area",
      "Pressuring",
      "Defensive Line",
      "Compactness",
      "Team Playstyle",
      "Manager Fit",
      "Defensive Approach",
      "Build-Up Style",
      "Build Up",
      "Chance Creation",
      "Width",
      "Depth",
      "Players In Box",
    ]);
    const core = settings.filter(([label]) => coreNames.has(label)).slice(0, 8);
    const attack = settings.filter(
      ([label]) => isAttack(label) && !isInstruction(label),
    );
    const defence = settings.filter(
      ([label]) => isDefence(label) && !isInstruction(label),
    );
    const instructions = settings.filter(
      ([label]) =>
        isInstruction(label) || (!isAttack(label) && !isDefence(label)),
    );
    return {
      core: core.length ? core : settings.slice(0, 6),
      attack,
      defence,
      instructions,
    };
  };

  const compactSettingValue = (label: string, value: string) => {
    const text = cleanTacticText(value);
    if (label === "Support Range")
      return text.replace(
        "4-6 آمن؛ 3 للاستحواذ القصير؛ 7+ للكرات المباشرة",
        "4-6 آمن حسب المسافة بين اللاعبين",
      );
    if (label === "Compactness")
      return text.replace(
        "7-9 لحماية العمق، خصوصًا ضد 4-3-1-2",
        "7-9 لحماية العمق",
      );
    if (label === "Defensive Line")
      return text.replace("4-6؛ لا ترفعها ضد Goal Poacher سريع", "4-6 آمن");
    return text;
  };

  const SettingCard = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-2xl bg-slate-950/55 border border-white/5 p-3">
      <div className="text-[9px] text-slate-500 font-bold">
        {cleanTacticText(label)}
      </div>
      <div className="mt-1 font-black text-slate-100 leading-relaxed">
        {compactSettingValue(label, value)}
      </div>
    </div>
  );

  const directValue = (label: string, fallback = "") => {
    const map: Record<string, string> = {
      "Attacking Style": uiText(
        "هجوم مرتد",
        "Counter Attack",
        "Contraataque",
        "Contre-attaque",
      ),
      "Build Up": uiText(
        "تمرير قصير",
        "Short Pass",
        "Pase corto",
        "Passe courte",
      ),
      "Attacking Area": uiText("العمق", "Centre", "Centro", "Centre"),
      Positioning: uiText("مرن", "Flexible", "Flexible", "Flexible"),
      "Support Range": "4",
      "Defensive Style": uiText(
        "ضغط أمامي",
        "Frontline Pressure",
        "Presión alta",
        "Pressing haut",
      ),
      "Containment Area": uiText("العمق", "Centre", "Centro", "Centre"),
      Pressuring: uiText("هجومي", "Aggressive", "Agresivo", "Agressif"),
      "Defensive Line": "5",
      Compactness: "8",
      "Advanced Attack": uiText(
        "Anchoring + Attacking Fullbacks",
        "Anchoring + Attacking Fullbacks",
        "Anchoring + Laterales ofensivos",
        "Ancrage + latéraux offensifs",
      ),
      "Advanced Defence": uiText(
        "Deep Defensive Line + Tight Marking",
        "Deep Defensive Line + Tight Marking",
        "Línea profunda + Marcaje estrecho",
        "Ligne défensive basse + marquage",
      ),
      "Team Playstyle": uiText(
        "هجوم مرتد سريع",
        "Quick Counter",
        "Contra rápida",
        "Contre rapide",
      ),
      "Manager Fit": uiText(
        "مدرب مناسب لنفس أسلوب اللعب",
        "Manager with matching playstyle",
        "Mánager del mismo estilo",
        "Manager compatible",
      ),
      "Platform Context": uiText(
        "Mobile: تمرير آمن / Console-PC: مساحة ووقت أكبر",
        "Mobile: safe passing / Console-PC: wider timing",
        "Mobile: pase seguro / Consola: más espacio",
        "Mobile: passe sûre / Console: plus d’espace",
      ),
      "Rest Defence": uiText(
        "2 CB + DMF ثابت",
        "2 CB + fixed DMF",
        "2 CB + pivote fijo",
        "2 DC + sentinelle",
      ),
      "Attack Instruction 1": "Anchoring",
      "Attack Instruction 2": "Counter Target",
      "Defence Instruction 1": "Deep Line",
      "Defence Instruction 2": "Defensive Fullback",
      "Tactical System": "FC IQ",
      "Build-Up Style": uiText(
        "تمرير قصير",
        "Short Passing",
        "Pase corto",
        "Passe courte",
      ),
      "Defensive Approach": uiText(
        "متوازن",
        "Balanced",
        "Equilibrado",
        "Équilibré",
      ),
      "Line Height": "55",
      "Chance Creation": uiText(
        "تمرير مباشر",
        "Direct Passing",
        "Pase directo",
        "Passe directe",
      ),
      Width: "45",
      Depth: "55",
      "Players In Box": "5",
      "Corners / Free Kicks": "2 / 2",
    };
    return map[label] || cleanTacticText(fallback);
  };

  const chooseCounterPlan = (
    gameId: string | undefined,
    oppFormationRaw: string,
    opponentStyleRaw: string,
    matchStateRaw = "",
  ) => {
    const opp = (oppFormationRaw || "").replace(/\s+/g, "");
    const context =
      `${opponentStyleRaw || ""} ${matchStateRaw || ""}`.toLowerCase();
    let formation = "4-2-3-1";
    if (/4-2-3-1|4231/.test(opp))
      formation = /wide|أطراف|عرضيات/.test(context) ? "4-4-2" : "4-3-2-1";
    else if (/4-3-3|433|4-2-1-3|4213/.test(opp))
      formation = /possession|استحواذ/.test(context) ? "4-2-3-1" : "4-4-2";
    else if (/4-4-2|442/.test(opp)) formation = "4-2-3-1";
    else if (/3-5-2|352|3-4-3|343/.test(opp)) formation = "4-2-1-3";
    else if (/5-3-2|532|5-4-1|541/.test(opp)) formation = "3-2-4-1";
    else if (/دفاع متأخر|low block|park/.test(context)) formation = "3-2-4-1";
    const style = /possession|استحواذ/.test(context)
      ? "Counter Attack"
      : /wide|أطراف|عرضيات/.test(context)
        ? "Out Wide"
        : /long ball|كرات طويلة|lbc/.test(context)
          ? "Possession Game"
          : "Quick Counter";
    return { formation, style };
  };


  const normalizeEfootballPlaystyle = (value = "") => {
    const v = value.toLowerCase();
    if (/possession|استحواذ|تيكي|tiki/.test(v)) return "Possession Game";
    if (/long ball counter|lbc|كرات طويلة|طويلة/.test(v)) return "Long Ball Counter";
    if (/out wide|wide|أطراف|عرضيات|جناح/.test(v)) return "Out Wide";
    if (/long ball|كرات/.test(v)) return "Long Ball";
    if (/quick|counter|مرتدات|سريعة|ضغط/.test(v)) return "Quick Counter";
    return "Quick Counter";
  };

  const recommendedBuildShapes = (gameId: string | undefined, styleRaw: string) => {
    const id = gameId || "";
    const style = normalizeEfootballPlaystyle(styleRaw);
    const uniqueShapes = (items: string[]) => Array.from(new Set(items.filter(Boolean)));
    const generic: Record<string, string[]> = {
      "Possession Game": ["4-3-3", "4-2-3-1", "3-2-4-1", "4-3-2-1", "4-1-4-1", "3-4-2-1", "4-2-2-2", "4-1-2-3"],
      "Quick Counter": ["4-2-1-3", "4-3-3", "4-2-3-1", "3-4-2-1", "4-3-2-1", "4-2-2-2", "3-2-4-1", "4-2-4"],
      "Long Ball Counter": ["4-2-3-1", "5-2-1-2", "4-2-2-2", "5-3-2", "4-4-2", "5-4-1", "3-5-2", "4-1-4-1"],
      "Out Wide": ["4-2-3-1", "4-3-3", "3-4-3", "4-4-2", "3-4-2-1", "4-2-4", "5-2-3", "3-2-4-1"],
      "Long Ball": ["4-4-2", "5-3-2", "4-2-2-2", "3-5-2", "5-2-1-2", "4-2-3-1", "5-4-1", "4-2-4"],
    };
    if (isEfootballGame(id)) {
      const manager = getEfootballManager(formData.efootballManagerId) || selectedEfootballManager;
      return uniqueShapes([...(manager?.bestFormations || []), ...(generic[style] || generic["Quick Counter"])]).slice(0, 8);
    }
    if (id.includes("pes")) return uniqueShapes(generic[style] || generic["Quick Counter"]).slice(0, 8);
    if (id.includes("fc") || id.includes("fifa")) {
      const fc: Record<string, string[]> = {
        "Possession Game": ["4-3-3", "4-2-3-1", "4-1-2-1-2", "3-2-4-1", "4-1-4-1", "4-3-2-1"],
        "Quick Counter": ["4-2-3-1", "4-4-2", "4-3-2-1", "4-2-4", "4-2-2-2", "3-4-2-1"],
        "Long Ball Counter": ["4-4-2", "5-3-2", "4-2-3-1", "5-4-1", "5-2-1-2", "3-5-2"],
        "Out Wide": ["4-3-3", "4-2-3-1", "3-4-3", "4-4-2", "4-2-4", "3-4-2-1"],
        "Long Ball": ["4-4-2", "5-3-2", "3-5-2", "4-2-4", "5-2-1-2", "4-2-3-1"],
      };
      return uniqueShapes(fc[style] || fc["Quick Counter"]).slice(0, 8);
    }
    return uniqueShapes(generic[style] || generic["Quick Counter"]).slice(0, 8);
  };


  type GuidedRecommendation = {
    id: string;
    title: string;
    badge: string;
    formation: string;
    style: string;
    reason: string;
    matchState: string;
    notes: string;
    risk: "best" | "safe" | "creative" | "aggressive";
  };

  const guidedBuildIntents = () => {
    const family = getGameDnaProfile(selectedGame?.id || homeGameId, selectedGame?.name || "").family;
    if (family === "pes_classic") return [
      { id: "best", title: uiText("اختارلي الأفضل", "Pick the best for me", "Elige lo mejor", "Choisir le meilleur"), desc: uiText("المدرب يختار بين الاستحواذ والهجمة المرتدة وإعدادات بيس الأصلية.", "Coach selects between possession/counter and authentic PES settings.", "El entrenador elige el ajuste PES.", "Le coach choisit le réglage PES."), style: "Counter Attack" },
      { id: "control", title: uiText("استحواذ وبناء قصير", "Possession and short build-up", "Posesión", "Possession"), desc: uiText("استحواذ + تمرير قصير + العمق أو الأطراف.", "Possession + short pass + center or wide.", "Posesión y pase corto.", "Possession et passes courtes."), style: "Possession Game" },
      { id: "speed", title: uiText("هجمة مرتدة", "Counter Attack", "Contraataque", "Contre-attaque"), desc: uiText("تحول سريع مع تمرير قصير أو طويل حسب فريقك.", "Fast transition with short or long passing.", "Contra rápida.", "Contre rapide."), style: "Counter Attack" },
      { id: "press", title: uiText("ضغط أمامي", "Frontline Pressure", "Presión adelantada", "Pressing avancé"), desc: uiText("ضغط أمامي مع تغطية منظمة، بدون خلط بأساليب eFootball.", "Frontline pressure with organized cover, no eFootball terms.", "Presión PES.", "Pressing PES."), style: "Possession Game" },
      { id: "safe", title: uiText("دفاع متأخر ومرتدة", "All-out Defence + Counter", "Defensa y contra", "Défense et contre"), desc: uiText("دفاع متأخر، احتواء العمق، وهجمة مرتدة واضحة.", "Deep defence, center containment and a clear counter.", "Bloque bajo.", "Bloc bas."), style: "Counter Attack" },
    ];
    if (family === "efootball_modern") return [
      { id: "best", title: uiText("رشّح الأنسب", "Recommend the best fit", "Recomendar", "Recommander"), desc: uiText("اختيار متوازن حسب تشكيلك وهدفك.", "A balanced recommendation from your shape and goal.", "Opción equilibrada.", "Choix équilibré."), style: "Quick Counter" },
      { id: "control", title: uiText("لعبة استحواذ", "Possession Game", "Posesión", "Possession"), desc: uiText("دعم قريب وصبر في بناء الهجمة.", "Close support and patient buildup.", "Apoyo cercano.", "Soutien rapproché."), style: "Possession Game" },
      { id: "speed", title: uiText("مرتدات سريعة", "Quick Counter", "Contra rápida", "Contre rapide"), desc: uiText("ضغط وتحول عمودي سريع بعد استعادة الكرة.", "Fast pressure and vertical transition after regaining the ball.", "Transición rápida.", "Transition rapide."), style: "Quick Counter" },
      { id: "lbc", title: uiText("مرتدات بالكرات الطويلة", "Long Ball Counter", "Contra de balón largo", "Contre long"), desc: uiText("كتلة متماسكة وخروج مباشر نحو المهاجم.", "Compact block with direct release to the forward.", "Bloque compacto.", "Bloc compact."), style: "Long Ball Counter" },
      { id: "wide", title: uiText("لعب على الأطراف", "Out Wide", "Juego por bandas", "Jeu sur les ailes"), desc: uiText("توسيع الملعب وصناعة العرضيات والزيادة العددية.", "Stretch the pitch and create wide overloads and crosses.", "Amplitud.", "Largeur."), style: "Out Wide" },
      { id: "longball", title: uiText("كرات طويلة", "Long Ball", "Balón largo", "Long ballon"), desc: uiText("تقدم مباشر وربح الكرة الثانية حول المهاجم.", "Direct progression and second-ball support around the forward.", "Juego directo.", "Jeu direct."), style: "Long Ball" },
    ];
    return [
      { id: "best", title: uiText("رشّح الأنسب", "Recommend the best fit", "Recomendar", "Recommander"), desc: uiText("المحرك يقارن بين الاستحواذ، الهجمة المرتدة السريعة، الهجمة المرتدة بالكرات الطويلة، اللعب على الأطراف والكرات الطويلة قبل اختيار الأنسب.", "The engine compares Possession Game, Quick Counter, Long Ball Counter, Out Wide and Long Ball before selecting the best fit.", "Compara los cinco estilos de equipo.", "Compare les cinq styles d’équipe."), style: "Quick Counter" },
      { id: "control", title: uiText("أريد سيطرة وبناء هادئ", "I want control and calm buildup", "Quiero control", "Je veux le contrôle"), desc: uiText("استحواذ، تمرير قصير، مسافات قريبة.", "Possession, short passing, close support.", "Posesión.", "Possession."), style: "Possession Game" },
      { id: "speed", title: uiText("أريد سرعة ومرتدات", "I want speed and counters", "Velocidad y contras", "Vitesse et contres"), desc: uiText("تحولات عمودية وخطة مباشرة.", "Vertical transitions and a direct plan.", "Transiciones.", "Transitions."), style: "Quick Counter" },
      { id: "press", title: uiText("أريد ضغطًا عاليًا", "I want high press", "Presión alta", "Pressing haut"), desc: uiText("استرجاع سريع وخط دفاع أعلى وضغط بعد الفقد.", "Fast regain, higher line and pressure after loss.", "Presión.", "Pressing."), style: "Quick Counter" },
      { id: "safe", title: uiText("أريد أمانًا دفاعيًا", "I want defensive safety", "Seguridad defensiva", "Sécurité défensive"), desc: uiText("خط أهدأ وتكتل أعلى ومخاطرة أقل.", "Calmer line, higher compactness and lower risk.", "Seguro.", "Sûr."), style: "Long Ball Counter" },
    ];
  };

  const counterProblemOptions = () => {
    const dna = getGameDnaProfile(selectedGame?.id || homeGameId, selectedGame?.name || activeHomeGame?.name || "");
    if (dna.family === "pes_classic") {
      return [
        { id: "pes_counter_long", label: uiText("مرتدة + طويل", "Counter + Long", "Contra + largo", "Contre + long"), text: uiText("الخصم في PES بيلعب Counter Attack + Long Pass وبيكسر خطي بسرعة", "In classic PES, the rival uses Counter Attack + Long Pass and breaks my line quickly", "Contra larga", "Contre long") },
        { id: "pes_possession_short", label: uiText("استحواذ قصير", "Short possession", "Posesión corta", "Possession courte"), text: uiText("الخصم بيسيطر بتمرير قصير وPositioning ثابت", "The rival controls with short passing and fixed positioning", "Posesión", "Possession") },
        { id: "pes_wide", label: uiText("هجوم Wide", "Wide attack", "Bandas", "Ailes"), text: uiText("الخصم بيوسع الملعب وبيضرب العرضيات في PES", "The rival attacks wide and crosses in PES", "Bandas", "Ailes") },
        { id: "pes_frontline", label: uiText("Frontline Pressure", "Frontline Pressure", "Presión", "Pressing"), text: uiText("الخصم عامل Frontline Pressure + Aggressive ومش سايبني أبني", "The rival uses Frontline Pressure + Aggressive and blocks my build-up", "Presión", "Pressing") },
        { id: "pes_amf", label: uiText("AMF بين الخطوط", "AMF lane", "MCO", "MO"), text: uiText("صانع اللعب بين الخطوط محتاج احتواء العمق", "Their playmaker between lines needs center containment", "MCO", "MO") },
        { id: "pes_low", label: uiText("All-out Defence", "All-out Defence", "Bloque bajo", "Bloc bas"), text: uiText("الخصم راجع بدفاع متأخر ومحتاج أفك التكتل", "The rival is in All-out Defence and I need to break the block", "Defensa", "Défense") },
      ];
    }
    if (dna.family === "ea_fc") {
      return [
        { id: "fc_high_depth", label: uiText("High Depth", "High depth", "Profundidad alta", "Ligne haute"), text: uiText("الخصم في EA FC ضاغط High Depth وبيخنق البناء", "The rival uses high depth and squeezes my build-up", "Alta", "Haut") },
        { id: "fc_direct", label: uiText("Direct Passing", "Direct Passing", "Directo", "Direct"), text: uiText("الخصم Direct Passing وبيجري خلف الدفاع", "The rival uses Direct Passing and runs behind my defense", "Directo", "Direct") },
        { id: "fc_wingbacks", label: uiText("أظهرة هجومية", "Attacking fullbacks", "Laterales", "Latéraux"), text: uiText("الأظهرة عنده طالعة وبتعمل زيادة عددية", "Their fullbacks push high and create overloads", "Laterales", "Latéraux") },
        { id: "fc_cam", label: uiText("CAM Playmaker", "CAM Playmaker", "MCO", "MOC"), text: uiText("CAM Playmaker حر بين الخطوط", "Their CAM playmaker is free between the lines", "MCO", "MOC") },
        { id: "fc_roles", label: uiText("Roles مزعجة", "Dangerous roles", "Roles", "Rôles"), text: uiText("الخصم مكسب من Roles وHalf Spaces", "The rival is winning through roles and half spaces", "Roles", "Rôles") },
        { id: "fc_low", label: uiText("Low Block", "Low block", "Bloque bajo", "Bloc bas"), text: uiText("الخصم قافل Low Block ومحتاج أفك المساحات", "The rival sits in a low block and I need to open spaces", "Bloque", "Bloc") },
      ];
    }
    return [
      { id: "wide", label: uiText("سريع من الأطراف", "Fast on the wings", "Rápido por bandas", "Rapide sur les ailes"), text: uiText("الخصم سريع من الأطراف وبيضربني بالعرضيات", "The rival is fast wide and hurts me with crosses", "Rival rápido por bandas", "Adversaire rapide sur les ailes") },
      { id: "press", label: uiText("ضغط عالي", "High press", "Presión alta", "Pressing haut"), text: uiText("الخصم بيضغط عليا من أول الملعب", "The rival presses me from the first third", "Presión alta", "Pressing haut") },
      { id: "possession", label: uiText("استحواذ خانق", "Heavy possession", "Posesión dominante", "Possession étouffante"), text: uiText("الخصم مستحوذ ومش عارف أقطع الكرة", "The rival dominates possession and I cannot win the ball", "Posesión", "Possession") },
      { id: "long", label: uiText("كرات طويلة", "Long balls", "Balones largos", "Longs ballons"), text: uiText("الخصم بيلعب كرات طويلة خلف الدفاع", "The rival plays long balls behind my line", "Balones largos", "Longs ballons") },
      { id: "amf", label: uiText("AMF مزعج", "Annoying AMF", "MCO molesto", "MO dangereux"), text: uiText("عنده صانع لعب AMF بين الخطوط مسبب مشكلة", "Their AMF between the lines is causing problems", "MCO peligroso", "MO dangereux") },
      { id: "low", label: uiText("دفاع متأخر", "Low block", "Bloque bajo", "Bloc bas"), text: uiText("الخصم قافل دفاع ومش بعرف أوصل للمرمى", "The rival sits deep and I cannot reach goal", "Bloque bajo", "Bloc bas") },
    ];
  };

  const normalizeGuidedIntent = (text = "") => {
    const v = text.toLowerCase();
    if (/control|possession|استحواذ|سيطرة|هادئ/.test(v)) return "control";
    if (/press|ضغط/.test(v)) return "press";
    if (/safe|defensive|أمان|دفاع/.test(v)) return "safe";
    if (/wide|wing|طرف|جناح|عرض/.test(v)) return "wide";
    if (/long ball counter|lbc|مرتدات بالكرات الطويلة/.test(v)) return "lbc";
    if (/long ball|كرات طويلة|طويل/.test(v)) return "longball";
    if (/low|قافل|متأخر/.test(v)) return "low";
    if (/amf|صانع|playmaker/.test(v)) return "amf";
    if (/speed|counter|مرتد|سرعة/.test(v)) return "speed";
    return "best";
  };


  // V98: stable intent extraction. Selection variants (SAFE/CREATIVE/etc.) must never
  // recalculate the recommendation list or change the chosen tactic behind the user.
  const getStableGuidedIntent = (mode: "build" | "counter") => {
    const notes = String(formData.notes || "");
    const buildMatch = notes.match(/TACTIC_BUILD:([a-z0-9_-]+)/i);
    const counterMatch = notes.match(/TACTIC_COUNTER:([a-z0-9_-]+)/i);
    if (mode === "build" && buildMatch?.[1]) return buildMatch[1].toLowerCase();
    if (mode === "counter" && counterMatch?.[1]) return counterMatch[1].toLowerCase();
    return normalizeGuidedIntent(`${notes} ${formData.opponentStyle || ""} ${formData.matchState || ""}`);
  };

  const stripGuidedRuntimeTags = (value = "") =>
    String(value || "")
      .replace(/\|\s*VARIANT:[^|]+/gi, "")
      .replace(/\|\s*RISK:[^|]+/gi, "")
      .replace(/\|\s*SEED:[^|]+/gi, "")
      .replace(/\|\s*TACTIC_ENGINE:[^|]+/gi, "")
      .trim();

  const styleForIntent = (intent: string, gameId = selectedGame?.id || homeGameId) => {
    const family = getGameDnaProfile(gameId, selectedGame?.name || "").family;
    if (family === "pes_classic") return intent === "control" || intent === "press" || intent === "low" ? "Possession Game" : "Counter Attack";
    if (intent === "control") return "Possession Game";
    if (intent === "safe" || intent === "lbc") return "Long Ball Counter";
    if (intent === "wide") return "Out Wide";
    if (intent === "longball") return "Long Ball";
    if (intent === "low") return "Possession Game";
    return "Quick Counter";
  };

  const planSeed = (value: string) =>
    Array.from(value || "").reduce((sum, char) => sum + char.charCodeAt(0), 0);

  const pickBySeed = <T,>(rows: T[], seed: number, offset = 0): T =>
    rows[Math.abs(seed + offset) % rows.length];

  const makeGuidedRecommendations = (mode: "build" | "counter"): GuidedRecommendation[] => {
    const stableNotes = stripGuidedRuntimeTags(formData.notes || "");
    const seedText = `${stableNotes} ${formData.opponentStyle} ${formData.matchState} ${formData.myTeam} ${formData.oppTeam}`;
    const intent = getStableGuidedIntent(mode);
    const seed = planSeed(`${mode}-${selectedGame?.id || homeGameId}-${seedText}`);
    const gameId = selectedGame?.id || homeGameId;
    const isFc = /fc|fifa/.test(gameId);
    const isPes = /pes/.test(gameId);
    const efootballStyleFromContext = () => {
      const text = `${intent} ${seedText}`.toLowerCase();
      if (/wide|wing|طرف|عرضيات/.test(text)) return "Out Wide";
      if (/longball|long ball|كرات طويلة|كرة طويلة/.test(text)) return "Long Ball";
      if (/safe|protect|أمان|حماية|fast wing|سريع من الأطراف/.test(text)) return "Long Ball Counter";
      if (/control|possession|استحواذ|بناء هادئ|low block|دفاع متأخر/.test(text)) return "Possession Game";
      if (/speed|press|counter|مرتد|ضغط/.test(text)) return "Quick Counter";
      const allStyles = ["Possession Game", "Quick Counter", "Long Ball Counter", "Out Wide", "Long Ball"];
      return pickBySeed(allStyles, seed);
    };
    const baseStyle = isEfootballGame(gameId) ? efootballStyleFromContext() : styleForIntent(intent, gameId);
    const efStyle = normalizeEfootballPlaystyle(baseStyle) as any;
    const manager = isEfootballGame(gameId)
      ? efootballManagers.find((m) => m.primaryPlaystyle === efStyle || m.secondaryPlaystyles.includes(efStyle as any)) || efootballManagers[0]
      : null;

    const buildMatrix: Record<string, Array<{ formation: string; style: string; safe: string; creative: string }>> = {
      best: [
        { formation: "4-2-3-1", style: "Quick Counter", safe: "4-3-3", creative: "3-2-4-1" },
        { formation: "4-3-3", style: "Possession Game", safe: "4-2-3-1", creative: "3-2-4-1" },
        { formation: "4-2-3-1", style: "Long Ball Counter", safe: "5-3-2", creative: "4-2-2-2" },
        { formation: "4-3-3", style: "Out Wide", safe: "4-4-2", creative: "3-4-3" },
        { formation: "4-4-2", style: "Long Ball", safe: "5-3-2", creative: "3-5-2" },
      ],
      control: [
        { formation: "4-3-3", style: "Possession Game", safe: "4-2-3-1", creative: "3-2-4-1" },
        { formation: "4-2-3-1", style: "Possession Game", safe: "4-1-4-1", creative: "3-4-2-1" },
        { formation: "4-3-2-1", style: "Possession Game", safe: "4-3-3", creative: "3-2-4-1" },
      ],
      speed: [
        { formation: "4-2-1-3", style: "Quick Counter", safe: "4-2-3-1", creative: "4-2-4" },
        { formation: "4-3-3", style: "Quick Counter", safe: "4-4-2", creative: "3-4-2-1" },
        { formation: "4-2-2-2", style: "Quick Counter", safe: "4-2-3-1", creative: "3-2-4-1" },
      ],
      press: [
        { formation: "4-2-3-1", style: "Quick Counter", safe: "4-4-2", creative: "4-2-4" },
        { formation: "4-3-3", style: "Quick Counter", safe: "4-2-3-1", creative: "3-4-3" },
        { formation: "4-2-1-3", style: "Quick Counter", safe: "4-2-3-1", creative: "3-2-4-1" },
      ],
      safe: [
        { formation: "4-2-3-1", style: "Long Ball Counter", safe: "5-3-2", creative: "3-5-2" },
        { formation: "4-4-2", style: "Long Ball Counter", safe: "5-4-1", creative: "5-2-1-2" },
        { formation: "4-1-4-1", style: "Long Ball Counter", safe: "5-3-2", creative: "3-4-2-1" },
      ],
      lbc: [
        { formation: "4-2-3-1", style: "Long Ball Counter", safe: "5-3-2", creative: "4-2-2-2" },
        { formation: "5-2-1-2", style: "Long Ball Counter", safe: "5-4-1", creative: "3-5-2" },
      ],
      longball: [
        { formation: "4-4-2", style: "Long Ball", safe: "5-3-2", creative: "3-5-2" },
        { formation: "5-2-1-2", style: "Long Ball", safe: "5-4-1", creative: "4-2-4" },
      ],
      wide: [
        { formation: "4-2-3-1", style: "Out Wide", safe: "4-4-2", creative: "3-4-3" },
        { formation: "4-3-3", style: "Out Wide", safe: "4-2-3-1", creative: "3-4-2-1" },
        { formation: "3-4-3", style: "Out Wide", safe: "5-4-1", creative: "3-2-4-1" },
      ],
      long: [
        { formation: "4-2-3-1", style: "Long Ball Counter", safe: "5-3-2", creative: "4-2-2-2" },
        { formation: "4-4-2", style: "Long Ball Counter", safe: "5-4-1", creative: "3-5-2" },
        { formation: "5-2-1-2", style: "Long Ball Counter", safe: "5-3-2", creative: "4-2-4" },
      ],
      low: [
        { formation: "4-2-3-1", style: "Possession Game", safe: "4-3-3", creative: "3-2-4-1" },
        { formation: "4-3-3", style: "Out Wide", safe: "4-2-3-1", creative: "3-4-3" },
        { formation: "4-2-4", style: "Quick Counter", safe: "4-3-3", creative: "3-2-4-1" },
      ],
      amf: [
        { formation: "4-2-3-1", style: "Quick Counter", safe: "4-1-4-1", creative: "4-3-1-2" },
        { formation: "4-3-3", style: "Possession Game", safe: "4-2-3-1", creative: "3-4-2-1" },
        { formation: "4-4-2", style: "Long Ball Counter", safe: "5-3-2", creative: "4-2-2-2" },
      ],
    };
    if (isPes) {
      const pesRows: Record<string, Array<{ formation: string; style: string; safe: string; creative: string }>> = {
        best: [{ formation: "4-2-3-1", style: "Counter Attack", safe: "4-3-3", creative: "4-4-2" }],
        control: [{ formation: "4-3-3", style: "Possession Game", safe: "4-2-3-1", creative: "4-3-2-1" }],
        speed: [{ formation: "4-2-3-1", style: "Counter Attack", safe: "4-4-2", creative: "4-3-1-2" }],
        press: [{ formation: "4-3-3", style: "Possession Game", safe: "4-2-3-1", creative: "4-4-2" }],
        safe: [{ formation: "4-2-3-1", style: "Counter Attack", safe: "5-3-2", creative: "4-4-2" }],
        wide: [{ formation: "4-3-3", style: "Possession Game", safe: "4-4-2", creative: "3-4-3" }],
        long: [{ formation: "4-4-2", style: "Counter Attack", safe: "5-3-2", creative: "4-3-1-2" }],
        low: [{ formation: "4-3-3", style: "Possession Game", safe: "4-2-3-1", creative: "4-4-2" }],
        amf: [{ formation: "4-2-3-1", style: "Counter Attack", safe: "4-1-4-1", creative: "4-3-1-2" }],
      };
      Object.assign(buildMatrix, pesRows);
    }

    const counterMatrix: Record<string, Array<{ best: string; safe: string; aggressive: string; style: string; safeStyle: string; aggressiveStyle: string }>> = {
      wide: [
        { best: "4-4-2", safe: "4-2-3-1", aggressive: "3-4-3", style: "Long Ball Counter", safeStyle: "Long Ball Counter", aggressiveStyle: "Out Wide" },
        { best: "4-2-3-1", safe: "5-4-1", aggressive: "4-2-1-3", style: "Quick Counter", safeStyle: "Long Ball Counter", aggressiveStyle: "Quick Counter" },
      ],
      press: [
        { best: "4-2-3-1", safe: "4-4-2", aggressive: "4-2-1-3", style: "Possession Game", safeStyle: "Long Ball Counter", aggressiveStyle: "Quick Counter" },
        { best: "4-3-3", safe: "4-2-3-1", aggressive: "3-2-4-1", style: "Possession Game", safeStyle: "Long Ball Counter", aggressiveStyle: "Quick Counter" },
      ],
      possession: [
        { best: "4-2-3-1", safe: "4-4-2", aggressive: "4-2-1-3", style: "Quick Counter", safeStyle: "Long Ball Counter", aggressiveStyle: "Quick Counter" },
        { best: "4-3-2-1", safe: "4-2-3-1", aggressive: "3-4-2-1", style: "Quick Counter", safeStyle: "Long Ball Counter", aggressiveStyle: "Out Wide" },
      ],
      long: [
        { best: "5-3-2", safe: "5-4-1", aggressive: "4-4-2", style: "Long Ball Counter", safeStyle: "Long Ball Counter", aggressiveStyle: "Quick Counter" },
        { best: "4-2-3-1", safe: "5-3-2", aggressive: "4-2-2-2", style: "Long Ball Counter", safeStyle: "Long Ball Counter", aggressiveStyle: "Quick Counter" },
      ],
      amf: [
        { best: "4-2-3-1", safe: "4-1-4-1", aggressive: "4-3-1-2", style: "Quick Counter", safeStyle: "Long Ball Counter", aggressiveStyle: "Possession Game" },
        { best: "4-3-3", safe: "4-2-3-1", aggressive: "3-4-2-1", style: "Possession Game", safeStyle: "Long Ball Counter", aggressiveStyle: "Quick Counter" },
      ],
      low: [
        { best: "3-2-4-1", safe: "4-3-3", aggressive: "4-2-4", style: "Possession Game", safeStyle: "Possession Game", aggressiveStyle: "Quick Counter" },
        { best: "4-3-3", safe: "4-2-3-1", aggressive: "3-4-3", style: "Out Wide", safeStyle: "Possession Game", aggressiveStyle: "Out Wide" },
      ],
      best: [
        { best: "4-2-3-1", safe: "4-4-2", aggressive: "4-2-1-3", style: "Quick Counter", safeStyle: "Long Ball Counter", aggressiveStyle: "Quick Counter" },
        { best: "4-3-3", safe: "4-2-3-1", aggressive: "3-2-4-1", style: "Possession Game", safeStyle: "Long Ball Counter", aggressiveStyle: "Quick Counter" },
      ],
      speed: [
        { best: "4-2-3-1", safe: "5-3-2", aggressive: "4-2-1-3", style: "Long Ball Counter", safeStyle: "Long Ball Counter", aggressiveStyle: "Quick Counter" },
      ],
      safe: [
        { best: "4-2-3-1", safe: "5-3-2", aggressive: "4-4-2", style: "Long Ball Counter", safeStyle: "Long Ball Counter", aggressiveStyle: "Quick Counter" },
      ],
      control: [
        { best: "4-2-3-1", safe: "4-4-2", aggressive: "4-2-1-3", style: "Quick Counter", safeStyle: "Long Ball Counter", aggressiveStyle: "Quick Counter" },
      ],
    };
    const key = counterMatrix[intent] ? intent : "best";
    const buildRow = pickBySeed(buildMatrix[intent] || buildMatrix.best, seed);
    const counterRow = pickBySeed(counterMatrix[key], seed);
    const selectedManagerFormation = (shape: string, _style: string) => {
      // V98: never replace a recommendation formation with manager default.
      // The exact visible card must be the exact final plan.
      return shape;
    };
    const prefix = mode === "counter" ? "TACTIC_COUNTER" : "TACTIC_BUILD";
    const noteBase = mode === "counter"
      ? `${prefix}:${intent} | ${formData.notes || formData.opponentStyle || formData.matchState || "opponent problem"}`
      : `${prefix}:${intent} | ${formData.notes || "player goal"}`;
    let firstFormation = mode === "counter" ? counterRow.best : selectedManagerFormation(buildRow.formation, buildRow.style);
    let secondFormation = mode === "counter" ? counterRow.safe : selectedManagerFormation(buildRow.safe, isPes ? buildRow.style : mode === "build" && intent === "control" ? "Possession Game" : "Long Ball Counter");
    let thirdFormation = mode === "counter" ? counterRow.aggressive : selectedManagerFormation(buildRow.creative, isPes ? buildRow.style : intent === "safe" ? "Long Ball Counter" : intent === "wide" ? "Out Wide" : "Quick Counter");
    let firstStyle = mode === "counter" ? (isPes ? (intent === "control" || intent === "low" ? "Possession Game" : "Counter Attack") : counterRow.style) : buildRow.style;
    let secondStyle = mode === "counter" ? (isPes ? "Counter Attack" : counterRow.safeStyle) : (isPes ? buildRow.style : intent === "control" ? "Possession Game" : "Long Ball Counter");
    let thirdStyle = mode === "counter" ? (isPes ? (intent === "control" ? "Possession Game" : "Counter Attack") : counterRow.aggressiveStyle) : (isPes ? buildRow.style : intent === "safe" ? "Long Ball Counter" : intent === "wide" ? "Out Wide" : "Quick Counter");

    // Modern eFootball must consider all five Team Playstyles instead of repeatedly
    // returning only Quick Counter / Long Ball Counter. The primary option follows
    // the user's goal; the two alternatives deliberately use different styles.
    if (isEfootballGame(gameId) && mode === "build") {
      const allEfStyles = ["Possession Game", "Quick Counter", "Long Ball Counter", "Out Wide", "Long Ball"];
      const formationByStyle: Record<string, [string, string, string]> = {
        "Possession Game": ["4-3-3", "4-2-3-1", "3-2-4-1"],
        "Quick Counter": ["4-2-1-3", "4-2-3-1", "4-2-4"],
        "Long Ball Counter": ["4-2-3-1", "5-3-2", "4-2-2-2"],
        "Out Wide": ["4-3-3", "4-4-2", "3-4-3"],
        "Long Ball": ["4-4-2", "5-3-2", "3-5-2"],
      };
      const requested = styleForIntent(intent, gameId);
      const start = intent === "best" ? seed % allEfStyles.length : Math.max(0, allEfStyles.indexOf(requested));
      const ordered = [
        allEfStyles[start],
        ...allEfStyles.filter((style) => style !== allEfStyles[start]),
      ];
      // Rotate alternatives by the request seed so every style receives coverage
      // over time, while keeping all three visible cards distinct.
      const tail = ordered.slice(1);
      const rotation = tail.length ? seed % tail.length : 0;
      const rotatedTail = [...tail.slice(rotation), ...tail.slice(0, rotation)];
      [firstStyle, secondStyle, thirdStyle] = [ordered[0], rotatedTail[0], rotatedTail[1]];
      [firstFormation, secondFormation, thirdFormation] = [
        formationByStyle[firstStyle][0],
        formationByStyle[secondStyle][1],
        formationByStyle[thirdStyle][2],
      ];
    }
    const first: GuidedRecommendation = {
      id: "best",
      title: uiText("أفضل اختيار", "Best pick", "Mejor opción", "Meilleur choix"),
      badge: "BEST",
      formation: firstFormation,
      style: firstStyle,
      reason: mode === "counter"
        ? uiText("الخطة المضادة الأقرب لمشكلة الخصم مع توازن بين الأمان والتهديد.", "Best counter for the rival problem while keeping safety and threat.", "Contra equilibrada.", "Contre équilibré.")
        : uiText("اختيار المدرب الأساسي حسب هدفك، مع قيم متوازنة لا تشبه باقي البدائل.", "Coach’s main pick from your goal, with values that differ from the other options.", "Elección principal.", "Choix principal."),
      matchState: uiText("الخيار المتوازن", "Balanced pick", "Opción equilibrada", "Choix équilibré"),
      notes: `${noteBase} | VARIANT:BEST | RISK:BALANCED | SEED:${seed % 97}`,
      risk: "best",
    };
    const second: GuidedRecommendation = {
      id: "safe",
      title: uiText("اختيار آمن", "Safe choice", "Opción segura", "Choix sûr"),
      badge: "SAFE",
      formation: secondFormation,
      style: secondStyle,
      reason: uiText("يقلل المساحات خلفك ويجعل أولويتك منع الهدف قبل صناعة الفرصة.", "Reduces space behind you and prioritizes not conceding before chance creation.", "Menos riesgo.", "Moins de risque."),
      matchState: uiText("الخيار الآمن", "Safe pick", "Opción segura", "Choix sûr"),
      notes: `${noteBase} | VARIANT:SAFE | RISK:LOW | SEED:${(seed + 23) % 97}`,
      risk: "safe",
    };
    const third: GuidedRecommendation = {
      id: "creative",
      title: mode === "counter" ? uiText("اختيار هجومي", "Aggressive choice", "Opción agresiva", "Choix offensif") : uiText("اختيار كرييتڤ", "Creative choice", "Opción creativa", "Choix créatif"),
      badge: mode === "counter" ? "AGG" : "CREATIVE",
      formation: thirdFormation,
      style: thirdStyle,
      reason: uiText("نسخة لكسر التوقعات ورفع الضغط الهجومي مع مخاطرة أعلى.", "A higher-risk version to break expectations and increase attacking pressure.", "Más agresiva.", "Plus agressif."),
      matchState: mode === "counter" ? uiText("الخيار الهجومي", "Aggressive pick", "Opción agresiva", "Choix offensif") : uiText("الخيار المبتكر", "Creative pick", "Opción creativa", "Choix créatif"),
      notes: `${noteBase} | VARIANT:${mode === "counter" ? "AGGRESSIVE" : "CREATIVE"} | RISK:HIGH | SEED:${(seed + 47) % 97}`,
      risk: mode === "counter" ? "aggressive" : "creative",
    };
    return [first, second, third];
  };

  const applyGuidedRecommendation = (rec: GuidedRecommendation) => {
    setSelectedGuidedCardId(rec.id);
    const manager = isEfootballGame(selectedGame?.id)
      ? efootballManagers.find((m) => m.primaryPlaystyle === normalizeEfootballPlaystyle(rec.style) || m.secondaryPlaystyles.includes(normalizeEfootballPlaystyle(rec.style) as any)) || efootballManagers[0]
      : null;
    const formation = manager?.bestFormations?.includes(rec.formation)
      ? rec.formation
      : rec.formation;
    const next = {
      ...formData,
      myFormation: formation,
      myStyle: isEfootballGame(selectedGame?.id) ? normalizeEfootballPlaystyle(rec.style) : rec.style,
      efootballManagerId: manager?.id || formData.efootballManagerId,
      matchState: rec.matchState,
      notes: rec.notes,
    };
    setFormData(next);
    if (isEfootballGame(selectedGame?.id)) setEfootballPlaystyleFilter(normalizeEfootballPlaystyle(next.myStyle));
    const nextBoard = manager
      ? buildEfootballManagerBoard(formation, next.oppFormation, manager)
      : buildGameAwareBoard(selectedGame?.id, formation, next.oppFormation);
    if (nextBoard) setBoardState(nextBoard);
  };

  const selectBuildStyleAndAutoShape = (styleValue: string) => {
    if (isEfootballGame(selectedGame?.id)) {
      const efStyle = normalizeEfootballPlaystyle(styleValue);
      setEfootballPlaystyleFilter(efStyle);
      const filtered = efootballManagers.filter(
        (m) => m.primaryPlaystyle === efStyle || m.secondaryPlaystyles.includes(efStyle as any),
      );
      const manager = filtered[0] || efootballManagers[0];
      const shape = manager?.bestFormations?.[0] || "4-2-1-3";
      const next = {
        ...formData,
        efootballManagerId: manager.id,
        myStyle: efStyle,
        myFormation: shape,
      };
      setFormData(next);
      setBoardState(buildEfootballManagerBoard(shape, next.oppFormation, manager));
      return;
    }
    const shapes = recommendedBuildShapes(selectedGame?.id, styleValue);
    const shape = shapes[0] || formData.myFormation || "4-3-3";
    updateGeneratorForm({ myStyle: styleValue, myFormation: shape }, true);
  };

  const selectBuildShape = (shape: string) => {
    const next = { ...formData, myFormation: shape };
    setFormData(next);
    if (isEfootballGame(selectedGame?.id)) {
      const manager = getEfootballManager(next.efootballManagerId) || selectedEfootballManager;
      setBoardState(buildEfootballManagerBoard(shape, next.oppFormation, manager));
    } else {
      setBoardState(buildGameAwareBoard(selectedGame?.id, shape, next.oppFormation));
    }
  };

  const getDirectGamePlan = (
    gameId: string | undefined,
    styleRaw: string,
    formation: string,
    oppFormation: string,
  ) => {
    const id = gameId || "";
    const styleText = `${styleRaw || ""}`.toLowerCase();
    const opponentText =
      `${formData.opponentStyle || ""} ${formData.oppFormation || oppFormation || ""}`.toLowerCase();
    const isPossession = /possession|استحواذ|تيكي|tiki/.test(styleText);
    const isWide =
      /wide|out wide|أطراف|عرض|wing/.test(styleText) ||
      /عرضيات|wide|wing|أطراف/.test(opponentText);
    const isLongBall = /long ball|كرات طويلة|lbc/.test(styleText);
    const isPress =
      /press|ضغط|gegen/.test(styleText) ||
      /ضغط عالي|high press|press/.test(opponentText);
    const againstFastCounter = /سرعة|fast|pace|counter|مرتدات|quick/.test(
      opponentText,
    );
    const againstLowBlock = /دفاع متأخر|low block|park|خمسة/.test(opponentText);
    const matchState = `${formData.matchState || ""} ${formData.notes || ""}`.toLowerCase();
    const chasing = /متأخر|خسر|trailing|need goal|هدف/.test(matchState);
    const guidedSafe = /variant:safe|آمن|safe/.test(matchState);
    const guidedCreative = /variant:creative|creative|كرييت/.test(matchState);
    const guidedAggressive = /variant:aggressive|aggressive|هجومي/.test(matchState);
    const guidedBest = /variant:best|أفضل|best/.test(matchState);
    const rivalWide = /wide|wing|طرف|جناح|عرضيات/.test(matchState);
    const rivalLong = /long|طويل|كرات طويلة/.test(matchState);
    const rivalPlaymaker = /amf|صانع|playmaker/.test(matchState);

    // V78: values are no longer defaults. They are selected from a formation/style matrix.
    const shapeKey = `${formation || ""}`.replace(/\s+/g, "");
    const isThreeBack = /3-2-4-1|3241|3-4-2-1|3421|3-5-2|352/.test(shapeKey);
    const isDoublePivot = /4-2-3-1|4231|4-2-1-3|4213/.test(shapeKey);
    const isFlat442 = /4-4-2|442/.test(shapeKey);
    const isNarrow = /4-3-2-1|4321|4-3-1-2|4312/.test(shapeKey);
    const matrixSeed = [styleText, opponentText, matchState, shapeKey].join(" ");
    const directStyle = /مرتد|counter|quick/.test(matrixSeed);
    const defensiveMode = /دفاعي|protect|متقدم|متقدم|leading|متقدم/.test(matrixSeed) || againstFastCounter;
    let support = 5;
    if (isPossession) support = isNarrow ? 3 : isWide || isFlat442 ? 5 : 4;
    else if (isLongBall) support = isFlat442 ? 8 : 7;
    else if (directStyle) support = isThreeBack ? 6 : isDoublePivot ? 5 : 6;
    else if (againstLowBlock) support = isThreeBack ? 4 : 6;
    else if (isPress) support = isNarrow ? 3 : 4;
    let line = 5;
    if (defensiveMode) line = isThreeBack ? 4 : 3;
    else if (chasing) line = isThreeBack ? 6 : 7;
    else if (isPress) line = isDoublePivot ? 6 : 7;
    else if (isPossession) line = isThreeBack ? 5 : 6;
    else if (againstLowBlock) line = 6;
    let compact = 7;
    if (againstFastCounter) compact = isDoublePivot ? 9 : 8;
    else if (isNarrow) compact = 9;
    else if (isWide || isFlat442) compact = 6;
    else if (isThreeBack) compact = 7;
    else if (againstLowBlock) compact = 6;
    else compact = isPress ? 8 : 7;

    // V131 tactical variation layer: each recommendation card changes the actual values, not only the label.
    if (guidedSafe) {
      support = isLongBall || directStyle ? Math.max(support, 7) : Math.max(support, 5);
      line = Math.min(line, isThreeBack ? 4 : 4);
      compact = Math.max(compact, rivalWide ? 8 : 8);
    }
    if (guidedCreative) {
      support = isPossession ? 3 : 4;
      line = againstFastCounter ? 5 : 6;
      compact = isWide || rivalWide ? 5 : 6;
    }
    if (guidedAggressive || chasing) {
      support = Math.min(support, 4);
      line = isThreeBack ? 7 : 7;
      compact = rivalWide ? 6 : 7;
    }
    if (guidedBest && !guidedSafe && !guidedCreative && !guidedAggressive) {
      if (rivalWide) { line = Math.min(line, 5); compact = Math.max(compact, 8); }
      if (rivalLong) { line = Math.min(line, 4); compact = Math.max(compact, 8); }
      if (rivalPlaymaker) { compact = Math.max(compact, 8); support = Math.min(Math.max(support, 4), 6); }
    }

    // V89 Tactical Intelligence Engine: add scenario-specific value separation so cards never feel copied.
    const explicitSeed = Number((matchState.match(/seed:(\d+)/i) || [])[1] || 0);
    const scenarioSeed = explicitSeed || (planSeed(matrixSeed) % 97);
    const seedBump = scenarioSeed % 3;
    if (rivalWide) {
      line = guidedAggressive ? Math.max(line, 6) : Math.min(line, 5);
      compact = guidedCreative ? Math.max(compact, 6) : Math.max(compact, 8 + (seedBump % 2));
      support = guidedSafe ? Math.max(support, 6) : Math.max(3, support - 1);
    } else if (rivalLong) {
      line = guidedAggressive ? 6 : Math.min(line, 4);
      compact = Math.max(compact, guidedSafe ? 9 : 8);
      support = Math.max(support, guidedSafe ? 7 : 6);
    } else if (againstLowBlock) {
      line = guidedSafe ? 5 : guidedCreative || guidedAggressive ? 7 : 6;
      compact = guidedAggressive ? 5 : 6;
      support = isPossession ? 3 : 4 + seedBump;
    } else if (rivalPlaymaker) {
      line = guidedSafe ? Math.min(line, 4) : Math.max(line, 5);
      compact = Math.max(compact, 8);
      support = guidedAggressive ? 4 : Math.max(5, support);
    } else if (isPress) {
      line = guidedSafe ? 4 : guidedCreative ? 6 : 7;
      compact = guidedCreative ? 6 : 8;
      support = guidedSafe ? 6 : 4;
    }
    if (guidedCreative && !againstFastCounter) {
      support = Math.max(2, Math.min(5, support - 1));
      compact = Math.max(5, compact - 1);
    }
    if (guidedSafe) {
      line = Math.min(line, 4);
      compact = Math.max(compact, 8);
    }
    support = Math.max(1, Math.min(10, support));
    line = Math.max(1, Math.min(10, line));
    compact = Math.max(1, Math.min(10, compact));
    const attackArea = isWide
      ? uiText("الأطراف", "Wide", "Bandas", "Ailes")
      : uiText("العمق", "Centre", "Centro", "Centre");
    const build = isLongBall
      ? uiText("تمرير طويل", "Long Pass", "Pase largo", "Passe longue")
      : uiText("تمرير قصير", "Short Pass", "Pase corto", "Passe courte");
    const attackingStyle = isPossession
      ? uiText("استحواذ", "Possession", "Posesión", "Possession")
      : uiText("هجوم مرتد", "Counter Attack", "Contraataque", "Contre-attaque");
    const positioning = isPossession
      ? uiText(
          "الحفاظ على التشكيل",
          "Maintain Formation",
          "Mantener formación",
          "Garder la formation",
        )
      : uiText("مرن", "Flexible", "Flexible", "Flexible");
    const defensiveStyle =
      line <= 4 || guidedSafe
        ? uiText("دفاع شامل", "All-out Defence", "Repliegue", "Défense totale")
        : uiText(
            "ضغط من الأمام",
            "Frontline Pressure",
            "Presión alta",
            "Pressing haut",
          );
    const pressuring = guidedSafe || againstFastCounter || rivalLong
      ? uiText("محافظ", "Conservative", "Conservador", "Conservateur")
      : uiText("عدواني", "Aggressive", "Agresivo", "Agressif");

    const pesAttack: Array<[string, string]> = [
      ["Attacking Style", attackingStyle],
      ["Build Up", build],
      ["Attacking Area", attackArea],
      ["Positioning", positioning],
      ["Support Range", `${support}`],
    ];
    const pesDefence: Array<[string, string]> = [
      ["Defensive Style", defensiveStyle],
      [
        "Containment Area",
        isWide
          ? uiText("الأطراف", "Wide", "Bandas", "Ailes")
          : uiText("العمق", "Centre", "Centro", "Centre"),
      ],
      ["Pressuring", pressuring],
      ["Defensive Line", `${line}`],
      ["Compactness", `${compact}`],
    ];
    const strikerTarget = formation.includes("2") && !formation.startsWith("4-2")
      ? uiText("أسرع CF/SS", "fastest CF/SS", "DC/SD más rápido", "AC/SS le plus rapide")
      : uiText("CF الأساسي", "main CF", "DC principal", "AC principal");
    const wideTarget = isWide
      ? uiText("الجناحين LWF/RWF", "LWF/RWF wingers", "extremos", "ailiers")
      : uiText("الفريق بالكامل", "whole team", "todo el equipo", "toute l’équipe");
    const markTarget = opponentText && /amf|صانع|صانع لعب|playmaker|10|ss/i.test(opponentText)
      ? uiText("صانع لعب الخصم AMF/SS", "opponent AMF/SS playmaker", "MCO/SD rival", "MO/SS adverse")
      : uiText("مهاجم الخصم CF", "opponent CF", "DC rival", "AC adverse");
    const defensiveTarget = againstFastCounter
      ? uiText("DMF أو أحد الظهيرين RB/LB", "DMF or one fullback RB/LB", "MCD o lateral", "MDF ou latéral")
      : uiText("DMF", "DMF", "MCD", "MDF");

    const pesAttackInstructions: Array<[string, string]> = isWide
      ? [
          [uiText("Hug the Touchline", "Hug the Touchline", "Abrir a banda", "Coller à la ligne"), `${uiText("على", "on", "en", "sur")}: ${wideTarget}`],
          [chasing ? uiText("Attacking Fullbacks", "Attacking Fullbacks", "Laterales ofensivos", "Latéraux offensifs") : uiText("Wing Rotation", "Wing Rotation", "Rotación de banda", "Rotation aile"), `${uiText("على", "on", "en", "sur")}: ${uiText("الفريق بالكامل", "whole team", "todo el equipo", "toute l’équipe")}`],
        ]
      : isPossession
        ? [
            [uiText("Tiki-Taka", "Tiki-Taka", "Tiki-Taka", "Tiki-Taka"), `${uiText("على", "on", "en", "sur")}: ${uiText("الفريق بالكامل", "whole team", "todo el equipo", "toute l’équipe")}`],
            [uiText("False Fullbacks", "False Fullbacks", "Laterales falsos", "Faux latéraux"), `${uiText("على", "on", "en", "sur")}: ${uiText("RB/LB", "RB/LB", "LD/LI", "DD/DG")}`],
          ]
        : [
            [uiText("هجوم ضاغط", "Counter Target", "Objetivo contraataque", "Cible de contre"), `${uiText("على", "on", "en", "sur")}: ${strikerTarget}`],
            [againstLowBlock ? uiText("False 9", "False 9", "Falso 9", "Faux 9") : uiText("Attacking Fullbacks", "Attacking Fullbacks", "Laterales ofensivos", "Latéraux offensifs"), `${uiText("على", "on", "en", "sur")}: ${againstLowBlock ? strikerTarget : uiText("RB/LB", "RB/LB", "LD/LI", "DD/DG")}`],
          ];
    const pesDefenceInstructions: Array<[string, string]> = againstFastCounter
      ? [
          [uiText("Deep Defensive Line", "Deep Defensive Line", "Línea defensiva retrasada", "Ligne défensive basse"), `${uiText("على", "on", "en", "sur")}: ${uiText("الفريق بالكامل", "whole team", "todo el equipo", "toute l’équipe")}`],
          [uiText("Tight Marking", "Tight Marking", "Marcaje estrecho", "Marquage serré"), `${uiText("على", "on", "en", "sur")}: ${markTarget}`],
        ]
      : isPress
        ? [
            [uiText("Gegenpress", "Gegenpress", "Gegenpress", "Gegenpress"), `${uiText("على", "on", "en", "sur")}: ${uiText("الفريق بالكامل", "whole team", "todo el equipo", "toute l’équipe")}`],
            [uiText("Man Marking", "Man Marking", "Marcaje al hombre", "Marquage individuel"), `${uiText("على", "on", "en", "sur")}: ${markTarget}`],
          ]
        : [
            [uiText("Swarm the Box", "Swarm the Box", "Cerrar el área", "Bloquer la surface"), `${uiText("على", "on", "en", "sur")}: ${uiText("الفريق بالكامل", "whole team", "todo el equipo", "toute l’équipe")}`],
            [uiText("Defensive", "Defensive", "Defensivo", "Défensif"), `${uiText("على", "on", "en", "sur")}: ${defensiveTarget}`],
          ];
    const pesAdvanced: Array<[string, string]> = [
      [uiText("هجوم 1", "Attack 1", "Ataque 1", "Attaque 1"), `${pesAttackInstructions[0][0]} — ${pesAttackInstructions[0][1]}`],
      [uiText("هجوم 2", "Attack 2", "Ataque 2", "Attaque 2"), `${pesAttackInstructions[1][0]} — ${pesAttackInstructions[1][1]}`],
      [uiText("دفاع 1", "Defence 1", "Defensa 1", "Défense 1"), `${pesDefenceInstructions[0][0]} — ${pesDefenceInstructions[0][1]}`],
      [uiText("دفاع 2", "Defence 2", "Defensa 2", "Défense 2"), `${pesDefenceInstructions[1][0]} — ${pesDefenceInstructions[1][1]}`],
    ];

    if (id.includes("pes"))
      return {
        attack: pesAttack,
        defence: pesDefence,
        advanced: pesAdvanced,
        match: [
          uiText(
            `طبّق ${formation}: ${attackingStyle} + ${build} + ${attackArea}.`,
            `Apply ${formation}: ${attackingStyle} + ${build} + ${attackArea}.`,
            `Aplica ${formation}.`,
            `Appliquez ${formation}.`,
          ),
          uiText(
            `القيم المهمة: Support ${support} / Line ${line} / Compactness ${compact}.`,
            `Key values: Support ${support} / Line ${line} / Compactness ${compact}.`,
            `Valores clave.`,
            `Valeurs clés.`,
          ),
          uiText(
            `التعليمات المتقدمة: ${pesAdvanced.map(([, v]) => cleanTacticText(v)).join(" + ")}.`,
            `Advanced: ${pesAdvanced.map(([, v]) => v).join(" + ")}.`,
            `Avanzadas.`,
            `Avancées.`,
          ),
        ],
      };
    if (id.includes("efootball")) {
      const playstyle = isPossession
        ? "Possession Game"
        : isWide
          ? "Out Wide"
          : isLongBall
            ? "Long Ball Counter"
            : "Quick Counter";
      const fastWing =
        /wide|wing|طرف|جناح|اطراف/i.test(opponentText || "") || isWide;
      const counterTargetPos = fastWing
        ? uiText(
            "أسرع جناح LWF/RWF",
            "fastest winger LWF/RWF",
            "extremo más rápido",
            "ailier le plus rapide",
          )
        : uiText("رأس الحربة CF", "CF striker", "DC", "AC");
      return {
        attack: [
          ["Team Playstyle", playstyle],
          [
            uiText(
              "التشكيل المختار",
              "Selected shape",
              "Formación",
              "Formation",
            ),
            formation,
          ],
        ],
        defence: [
          [
            uiText(
              "تعليمة دفاعية 1",
              "Defensive instruction 1",
              "Defensa 1",
              "Défense 1",
            ),
            "Deep Line → DMF",
          ],
          [
            uiText(
              "تعليمة دفاعية 2",
              "Defensive instruction 2",
              "Defensa 2",
              "Défense 2",
            ),
            "Defensive → RB/LB",
          ],
          ["Marking", "Man Marking → AMF/SS"],
        ],
        advanced: [
          [
            "Anchoring",
            uiText(
              "على DMF أو CMF لمنعه من الخروج من مركزه",
              "on DMF/CMF to keep position",
              "en MCD/MC",
              "sur MDF/MC",
            ),
          ],
          ["Counter Target", counterTargetPos],
          [
            "Deep Line",
            uiText(
              "على DMF فقط عند حماية العمق",
              "on DMF only to protect depth",
              "en MCD",
              "sur MDF",
            ),
          ],
          [
            "Defensive",
            uiText(
              "على RB/LB ضد جناح خطير أو على DMF عند التقدم",
              "on RB/LB vs dangerous winger, or DMF when leading",
              "en lateral o MCD",
              "sur latéral ou MDF",
            ),
          ],
        ],
        match: [
          uiText(
            "اختَر مركزًا واحدًا لكل تعليمة؛ لا تفعل Counter Target على أكثر من لاعب.",
            "Choose one target position per instruction; do not use Counter Target on multiple players.",
            "Un jugador por instrucción.",
            "Une cible par consigne.",
          ),
          uiText(
            "Deep Line تكون على DMF فقط عندما الخصم يملك CF سريع أو عندما تحمي التقدم.",
            "Deep Line goes on DMF only against a fast CF or when protecting a lead.",
            "Deep Line en MCD.",
            "Deep Line sur MDF.",
          ),
        ],
      };
    }
    return {
      attack: [
        ["Build-Up Style", isPossession ? "Short Passing" : "Counter"],
        ["Chance Creation", isWide ? "Wing Play" : "Direct Passing"],
        ["Width", isWide ? "55" : "45"],
        ["Players In Box", againstLowBlock ? "6" : "5"],
      ],
      defence: [
        [
          "Defensive Approach",
          againstFastCounter ? "Balanced" : isPress ? "High" : "Balanced",
        ],
        ["Depth", againstFastCounter ? "45" : isPress ? "65" : "55"],
      ],
      advanced: [
        ["ST Role", "Advanced Forward"],
        ["CDM Role", "Holding"],
        ["Fullback Role", "Fullback / Defend"],
        ["CAM Role", "Playmaker"],
      ],
      match: [
        uiText(
          "استخدم أدوار FC IQ فقط، ولا تخلط معها تعليمات PES.",
          "Use FC IQ roles only; do not mix PES instructions.",
          "Usa FC IQ.",
          "Utilisez FC IQ.",
        ),
        uiText(
          "لا ترفع Depth ضد مهاجم سريع.",
          "Do not raise Depth against pace.",
          "No subas Depth.",
          "Ne montez pas Depth.",
        ),
      ],
    };
  };

  const actionPlanDirectInstructions = (
    gameId: string | undefined,
    styleRaw: string,
  ) => {
    const id = gameId || "";
    if (id.includes("pes"))
      return [
        uiText(
          "CF: Goal Poacher / Target Man حسب نوع المهاجم المتاح",
          "CF: Goal Poacher / Target Man depending on available striker",
          "CF: Goal Poacher / Target Man",
          "CF : Goal Poacher / Target Man",
        ),
        uiText(
          "AMF: Hole Player أو Creative Playmaker",
          "AMF: Hole Player or Creative Playmaker",
          "AMF: Hole Player o Creative Playmaker",
          "MO : Hole Player ou Creative Playmaker",
        ),
        uiText(
          "DMF: Anchor Man أو Destroyer",
          "DMF: Anchor Man or Destroyer",
          "DMF: Anchor Man o Destroyer",
          "MDF : Anchor Man ou Destroyer",
        ),
        uiText(
          "Fullback: Offensive Full-back / Defensive Full-back حسب الخطة",
          "Fullback: Offensive or Defensive Full-back by plan",
          "Lateral ofensivo/defensivo",
          "Latéral offensif/défensif",
        ),
      ];
    if (id.includes("efootball"))
      return [
        uiText(
          "CF: Goal Poacher / Fox in the Box",
          "CF: Goal Poacher / Fox in the Box",
          "CF: Goal Poacher",
          "CF : Goal Poacher",
        ),
        uiText(
          "AMF: Hole Player / Creative Playmaker",
          "AMF: Hole Player / Creative Playmaker",
          "AMF: Hole Player",
          "MO : Hole Player",
        ),
        uiText(
          "DMF: Anchor Man / Orchestrator",
          "DMF: Anchor Man / Orchestrator",
          "DMF: Anchor Man",
          "MDF : Anchor Man",
        ),
        uiText(
          "CB: Build Up + Destroyer",
          "CB: Build Up + Destroyer",
          "CB: Build Up + Destroyer",
          "DC : Build Up + Destroyer",
        ),
      ];
    return [
      uiText(
        "ST: Advanced Forward أو Poacher حسب FC IQ",
        "ST: Advanced Forward or Poacher by FC IQ",
        "DC: Advanced Forward",
        "BU : Advanced Forward",
      ),
      uiText("CDM: Holding", "CDM: Holding", "MCD: Holding", "MDC : Holding"),
      uiText(
        "CAM: Playmaker",
        "CAM: Playmaker",
        "MCO: Playmaker",
        "MOC : Meneur",
      ),
      uiText(
        "Fullback: Fullback / Wingback حسب الخطة",
        "Fullback: Fullback / Wingback by plan",
        "Lateral",
        "Latéral",
      ),
    ];
  };

  const getActionPlan = () => {
    const manager = isEfootballGame(selectedGame?.id)
      ? getEfootballManager(formData.efootballManagerId) ||
        selectedEfootballManager
      : null;
    // Final plan style is the source of truth. Do not let a manager default override the selected/generated result.
    const style = cleanTacticText(
      currentResult?.attackingStyle ||
        formData.myStyle ||
        manager?.primaryPlaystyle ||
        "Balanced",
    );
    const profiles = isEfootballGame(selectedGame?.id)
      ? [
          [
            "CF",
            uiText(
              "مهاجم يهاجم المساحة",
              "Goal Poacher",
              "Cazagoles",
              "Attaquant profondeur",
            ),
          ],
          [
            "AMF",
            uiText(
              "لاعب بين الخطوط",
              "Hole Player",
              "Entre líneas",
              "Entre les lignes",
            ),
          ],
          [
            "DMF",
            uiText("محور ثابت", "Anchor Man", "Pivote fijo", "Sentinelle"),
          ],
          [
            "CB",
            uiText(
              "قلب دفاع بناء لعب + قاطع كرات",
              "Build Up + Destroyer",
              "Salida + Destructor",
              "Relance + Récupérateur",
            ),
          ],
          [
            "LB/RB",
            uiText(
              "ظهير متوازن حسب المباراة",
              "Balanced full-back",
              "Lateral equilibrado",
              "Latéral équilibré",
            ),
          ],
        ]
      : [
          [
            "ST/CF",
            uiText(
              "مهاجم متقدم",
              "Advanced forward",
              "Delantero avanzado",
              "Attaquant avancé",
            ),
          ],
          ["CAM/AMF", uiText("صانع لعب", "Playmaker", "Organizador", "Meneur")],
          [
            "CDM/DMF",
            uiText("محور حماية", "Holding midfielder", "Pivote", "Sentinelle"),
          ],
          [
            "CB",
            uiText(
              "قلب دفاع بناء",
              "Ball-playing defender",
              "Central constructor",
              "Défenseur relanceur",
            ),
          ],
          [
            "FB",
            uiText(
              "ظهير متوازن",
              "Balanced full-back",
              "Lateral equilibrado",
              "Latéral équilibré",
            ),
          ],
        ];
    const instructions = (
      manager?.individualInstructions?.length
        ? manager.individualInstructions
        : currentResult?.playerInstructions || []
    )
      .slice(0, 3)
      .map(cleanTacticText);
    const fallbackInstructions = [
      uiText(
        "ثبّت محورًا دفاعيًا واحدًا",
        "Keep one holding midfielder",
        "Mantén un pivote",
        "Gardez une sentinelle",
      ),
      uiText(
        "لا ترفع الظهيرين معًا",
        "Do not push both fullbacks",
        "No subas ambos laterales",
        "Ne montez pas les deux latéraux",
      ),
      uiText(
        "اجعل صانع اللعب بين الخطوط",
        "Keep creator between lines",
        "Creador entre líneas",
        "Meneur entre les lignes",
      ),
    ];
    const preset = getGameTacticPreset(selectedGame?.id);
    const directPlan = getDirectGamePlan(
      selectedGame?.id,
      style,
      currentResult?.formation || formData.myFormation,
      formData.oppFormation,
    );
    return {
      manager,
      style,
      preset,
      direct: directPlan,
      profiles: profiles,
      instructions: selectedGame?.id?.includes("pes")
        ? []
        : instructions.length
          ? instructions
          : fallbackInstructions,
      weakness: cleanTacticText(
        currentResult?.mistakesToAvoid?.[0] ||
          uiText(
            "احذر المساحة خلف الظهيرين",
            "Beware space behind fullbacks",
            "Cuidado con la espalda de laterales",
            "Attention au dos des latéraux",
          ),
      ),
      why: cleanTacticText(currentResult?.reason || preset.note || ""),
      inGame: cleanTacticText(
        currentResult?.inGameStrategy || preset.note || "",
      ),
      emergency: cleanTacticText(currentResult?.emergencyPlan || ""),
      protect: cleanTacticText(currentResult?.protectLeadPlan || ""),
    };
  };

  // Rival creation inputs
  const [isAddingRival, setIsAddingRival] = useState(false);
  const [rivalForm, setRivalForm] = useState({
    name: "",
    favoriteGame: "EA SPORTS FC 26",
    favoriteFormation: "4-2-3-1",
    favoriteTeam: "",
    playstyle: "ضغط عالي",
    strengths: "",
    weaknesses: "",
    notes: "",
  });

  const rivalGameItem =
    GAMES_LIST.find((g) => g.name === rivalForm.favoriteGame) || GAMES_LIST[0];
  const rivalTeams = getPopularTeamsForGame(rivalGameItem?.id);

  // Diagnostics log state

  // User-scoped device cache prevents one account seeing another account's cached data.
  const cacheUserData = (
    userId: string,
    tactics: SavedTactic[],
    rivalList: Rival[],
    sub: UserSubscription,
    usage: number,
  ) => {
    localStorage.setItem(
      scopedKey("saved_tactics", userId),
      JSON.stringify(tactics),
    );
    localStorage.setItem(
      scopedKey("rivals", userId),
      JSON.stringify(rivalList),
    );
    localStorage.setItem(
      scopedKey("subscription", userId),
      JSON.stringify(sub),
    );
    localStorage.setItem(scopedKey("ai_usage", userId), JSON.stringify(usage));
  };

  const todayKey = () => new Date().toISOString().slice(0, 10);
  const countToday = (items: Array<{ createdAt: string }>) =>
    items.filter((item) => item.createdAt?.slice(0, 10) === todayKey()).length;

  const loadUserCache = (userId: string) => {
    setSavedTactics(
      readJson<SavedTactic[]>(scopedKey("saved_tactics", userId), []),
    );
    setRivals(readJson<Rival[]>(scopedKey("rivals", userId), []));
    setSubscription(
      readJson<UserSubscription>(scopedKey("subscription", userId), {
        ...DEFAULT_SUBSCRIPTION,
        startedAt: new Date().toISOString(),
        expiresAt: "",
      }),
    );
    setAiUsage(readJson<number>(scopedKey("ai_usage", userId), 0));
    setProgression(
      readJson<ProgressionState>(
        scopedKey("progression", userId),
        defaultProgression(),
      ),
    );
    setRewardWallet(
      readJson<RewardWallet>(
        scopedKey("reward_wallet", userId),
        defaultRewardWallet(),
      ),
    );
    setCompetition(
      normalizeCompetitionState(
        readJson<CoachCompetitionState>(
          scopedKey("coach_competition", userId),
          defaultCompetitionState(),
        ),
      ),
    );
  };

  const clearUserState = () => {
    setSavedTactics([]);
    setRivals([]);
    setAiUsage(0);
    setBoardState(null);
    setRivalBoardState(null);
    setCurrentResult(null);
    setDevelopmentResult(null);
    setProgression(defaultProgression());
    setRewardWallet(defaultRewardWallet());
    setCompetition(defaultCompetitionState());
    setCloudCoachLeague([]);
    setSubscription({
      ...DEFAULT_SUBSCRIPTION,
      startedAt: new Date().toISOString(),
      expiresAt: "",
    });
    setScreen("home");
  };

  const syncTactics = (newList: SavedTactic[]) => {
    setSavedTactics(newList);
    if (session?.user?.id)
      localStorage.setItem(
        scopedKey("saved_tactics", session.user.id),
        JSON.stringify(newList),
      );
  };

  const syncRivals = (newList: Rival[]) => {
    setRivals(newList);
    if (session?.user?.id)
      localStorage.setItem(
        scopedKey("rivals", session.user.id),
        JSON.stringify(newList),
      );
  };

  const persistCompetition = (nextRaw: CoachCompetitionState) => {
    const next = normalizeCompetitionState(nextRaw);
    setCompetition(next);
    if (session?.user?.id) {
      localStorage.setItem(
        scopedKey("coach_competition", session.user.id),
        JSON.stringify(next),
      );
    }
  };

  const refreshCoachLeague = async () => {
    const sb = getSupabase();
    if (!sb || !session?.user?.id) return;
    const { data, error } = await sb.rpc("get_weekly_coach_leaderboard", { p_limit: 20 });
    if (error || !Array.isArray(data)) return;
    setCloudCoachLeague(
      data.map((row: any) => ({
        name: row.display_name || "Coach",
        points: Number(row.weekly_points || 0),
        badge: row.rank_title || coachRankTitle(Number(row.weekly_points || 0), lang),
        isCurrentUser: row.user_id === session.user.id,
      })),
    );
  };

  const consumeAiQuota = async (kind: AiUsageKind) => {
    const localGuard = canUseLocalAi(competition, subscription.plan, kind);
    if (!localGuard.ok) return { ok: false, used: localGuard.used, limit: localGuard.limit };
    const sb = getSupabase();
    if (sb && session?.user?.id) {
      const { data, error } = await sb.rpc("consume_daily_ai_usage", { p_kind: kind });
      if (!error && data) {
        const cloudUsage = (data as any).usage || {};
        const next = normalizeCompetitionState({
          ...competition,
          usage: {
            date: todayKey(),
            textGenerations: Number(cloudUsage.text_generation ?? competition.usage.textGenerations),
            visionAnalyses: Number(cloudUsage.vision_analysis ?? competition.usage.visionAnalyses),
            matchAnalyses: Number(cloudUsage.match_analysis ?? competition.usage.matchAnalyses),
            coachTips: Number(cloudUsage.coach_tip ?? competition.usage.coachTips),
          },
        });
        persistCompetition(next);
        return { ok: true, used: Number((data as any).used || 0), limit: Number((data as any).limit || localGuard.limit) };
      }
      if (String(error?.message || "").includes("DAILY_AI_LIMIT_REACHED")) {
        return { ok: false, used: localGuard.used, limit: localGuard.limit };
      }
    }
    const next = consumeLocalAi(competition, kind);
    persistCompetition(next);
    return { ok: true, used: localGuard.used + 1, limit: localGuard.limit };
  };

  const awardCompetitionEvent = async (
    type: CompetitionEventType,
    meta: Record<string, unknown> = {},
  ) => {
    const localAward = awardLocalCompetition(competition, type, meta);
    persistCompetition(localAward.state);
    if (localAward.gained > 0) {
      triggerToast(
        uiText(
          `+${localAward.gained} نقطة دوري المدربين`,
          `+${localAward.gained} Coach League points`,
          `+${localAward.gained} puntos de liga`,
          `+${localAward.gained} points ligue`,
        ),
      );
    }
    const sb = getSupabase();
    if (sb && session?.user?.id) {
      const { data, error } = await sb.rpc("award_competition_points", {
        p_event_type: type,
        p_meta: meta,
      });
      if (!error && data) {
        const cloud = data as any;
        persistCompetition({
          ...localAward.state,
          weeklyPoints: Number(cloud.weekly_points ?? localAward.state.weeklyPoints),
          seasonPoints: Number(cloud.season_points ?? localAward.state.seasonPoints),
          totalPoints: Number(cloud.total_points ?? localAward.state.totalPoints),
          currentStreak: Number(cloud.current_streak ?? localAward.state.currentStreak),
          badges: Array.isArray(cloud.badges) ? cloud.badges : localAward.state.badges,
        });
        refreshCoachLeague();
      }
    }
  };

  const persistRewardWallet = (next: RewardWallet) => {
    setRewardWallet(next);
    if (session?.user?.id) {
      localStorage.setItem(
        scopedKey("reward_wallet", session.user.id),
        JSON.stringify(next),
      );
      const sb = getSupabase();
      if (sb) {
        sb.from("user_reward_wallets")
          .upsert(
            {
              user_id: session.user.id,
              boss_coins: next.bossCoins,
              extra_generation_credits: next.extraGenerationCredits,
              ad_rewards_claimed_today: next.adRewardsClaimedToday,
              last_ad_reward_date: next.lastAdRewardDate,
              total_ad_rewards_claimed: next.totalAdRewardsClaimed,
              events: next.events,
            },
            { onConflict: "user_id" },
          )
          .then(({ error }) => {
            if (error)
              console.warn("Reward wallet cloud sync pending:", error.message);
          });
      }
    }
  };

  const claimRewardedAd = async () => {
    const sb = getSupabase();
    if (sb && session?.user?.id) {
      const { data, error } = await sb.rpc("claim_rewarded_ad_coins", {
        p_provider: "manual_launch_placeholder",
      });
      if (!error && data) {
        const next = {
          ...rewardWallet,
          bossCoins: Number(
            (data as any).boss_coins ??
              rewardWallet.bossCoins + REWARD_ECONOMY.coinsPerRewardedAd,
          ),
          extraGenerationCredits: Number(
            (data as any).extra_generation_credits ??
              rewardWallet.extraGenerationCredits,
          ),
          adRewardsClaimedToday: Number(
            (data as any).ad_rewards_claimed_today ??
              rewardWallet.adRewardsClaimedToday + 1,
          ),
          lastAdRewardDate: todayKey(),
          totalAdRewardsClaimed: rewardWallet.totalAdRewardsClaimed + 1,
          events: [
            {
              type: "ad_reward" as const,
              amount: REWARD_ECONOMY.coinsPerRewardedAd,
              createdAt: new Date().toISOString(),
            },
            ...rewardWallet.events,
          ].slice(0, 80),
        };
        persistRewardWallet(next);
        triggerToast(
          uiText(
            `+${REWARD_ECONOMY.coinsPerRewardedAd} Boss Coins`,
            `+${REWARD_ECONOMY.coinsPerRewardedAd} Boss Coins`,
            `+${REWARD_ECONOMY.coinsPerRewardedAd} Boss Coins`,
            `+${REWARD_ECONOMY.coinsPerRewardedAd} Boss Coins`,
          ),
        );
        return;
      }
    }
    const result = claimRewardedAdCoins(rewardWallet, subscription.plan);
    persistRewardWallet(result.wallet);
    if (!result.ok) {
      triggerToast(
        uiText(
          "وصلت للحد اليومي لمكافآت الإعلانات.",
          "You reached today’s rewarded-ad limit.",
          "Alcanzaste el límite diario de anuncios.",
          "Vous avez atteint la limite quotidienne.",
        ),
      );
      return;
    }
    triggerToast(
      uiText(
        `+${REWARD_ECONOMY.coinsPerRewardedAd} Boss Coins — اجمع ${REWARD_ECONOMY.coinsPerExtraGeneration} لفتح خطة إضافية.`,
        `+${REWARD_ECONOMY.coinsPerRewardedAd} Boss Coins — collect ${REWARD_ECONOMY.coinsPerExtraGeneration} for an extra tactic.`,
        `+${REWARD_ECONOMY.coinsPerRewardedAd} Boss Coins`,
        `+${REWARD_ECONOMY.coinsPerRewardedAd} Boss Coins`,
      ),
    );
  };

  const redeemGenerationCredit = async () => {
    const sb = getSupabase();
    if (sb && session?.user?.id) {
      const { data, error } = await sb.rpc(
        "redeem_coins_for_generation_credit",
      );
      if (!error && data) {
        const next = {
          ...rewardWallet,
          bossCoins: Number(
            (data as any).boss_coins ??
              Math.max(
                0,
                rewardWallet.bossCoins - REWARD_ECONOMY.coinsPerExtraGeneration,
              ),
          ),
          extraGenerationCredits: Number(
            (data as any).extra_generation_credits ??
              rewardWallet.extraGenerationCredits + 1,
          ),
          events: [
            {
              type: "redeem_generation" as const,
              amount: -REWARD_ECONOMY.coinsPerExtraGeneration,
              createdAt: new Date().toISOString(),
            },
            ...rewardWallet.events,
          ].slice(0, 80),
        };
        persistRewardWallet(next);
        triggerToast(
          uiText(
            "تم فتح توليدة خطة إضافية.",
            "Extra tactic generation unlocked.",
            "Generación extra desbloqueada.",
            "Génération supplémentaire débloquée.",
          ),
        );
        return;
      }
    }
    const result = redeemCoinsForGeneration(rewardWallet);
    persistRewardWallet(result.wallet);
    if (!result.ok) {
      triggerToast(
        uiText(
          "رصيد Boss Coins غير كافٍ.",
          "Not enough Boss Coins.",
          "No tienes suficientes Boss Coins.",
          "Boss Coins insuffisants.",
        ),
      );
      return;
    }
    triggerToast(
      uiText(
        "تم فتح توليدة خطة إضافية.",
        "Extra tactic generation unlocked.",
        "Generación extra desbloqueada.",
        "Génération supplémentaire débloquée.",
      ),
    );
  };

  const persistProgression = (next: ProgressionState) => {
    setProgression(next);
    if (session?.user?.id) {
      localStorage.setItem(
        scopedKey("progression", session.user.id),
        JSON.stringify(next),
      );
      const sb = getSupabase();
      if (sb) {
        sb.from("user_progression")
          .upsert(
            {
              user_id: session.user.id,
              xp: next.xp,
              streak: next.streak,
              last_active_date: next.lastActiveDate,
              completed_challenge_ids: next.completedChallengeIds,
              activity: next.activity,
            },
            { onConflict: "user_id" },
          )
          .then(({ error }) => {
            if (error) console.warn("Progress sync pending:", error.message);
          });
        sb.rpc("sync_user_feature_unlocks", {
          p_xp: next.xp,
          p_unlocks: progressionSyncPayload(next.xp, lang),
        }).then(({ error }) => {
          if (error) console.warn("Unlock sync pending:", error.message);
        });
      }
    }
  };

  const awardActivity = (activity: ActivityType) => {
    const withBaseXp = addXp(progression, activity);
    const completed = completeMatchingChallenges(
      withBaseXp,
      activity,
      currentChallenges,
    );
    persistProgression(completed);
    const gained = completed.xp - progression.xp;
    if (gained > 0)
      triggerToast(
        uiText(
          `+${gained} XP — تقدمك التكتيكي زاد.`,
          `+${gained} XP — tactical progress increased.`,
          `+${gained} XP — progreso táctico aumentado.`,
          `+${gained} XP — progression tactique augmentée.`,
        ),
      );
    const eventMap: Partial<Record<ActivityType, CompetitionEventType>> = {
      generate: "generate_plan",
      save: "save_tactic",
      rival: "rival_profile",
      improve: "improve_tactic",
      daily_plan: "daily_challenge",
      challenge: "daily_challenge",
      match_analysis: "match_analysis",
      screenshot_analysis: "screenshot_analysis",
    };
    const eventType = eventMap[activity];
    if (eventType) void awardCompetitionEvent(eventType, { source: activity, game: selectedGame?.name || homeGameId });
  };

  const openChallengeAction = (activity: ActivityType) => {
    if (activity === "improve") return setScreen("improve-tactic");
    if (activity === "rival") return setScreen("rivals");
    if (activity === "save" && currentResult) return setScreen("result");
    const game = GAMES_LIST.find((g) => g.id === homeGameId) || GAMES_LIST[0];
    setSelectedGame(game);
    setStep(2);
    setScreen("generator");
  };

  const showLockedFeatureToast = (id: FeatureUnlockId) => {
    const feature = featureUnlock(id);
    triggerToast(
      feature
        ? `${feature.title[lang]} — ${featureUnlockMessage(progression.xp, id, lang)}`
        : uiText("الميزة غير متاحة بعد.", "Feature is not available yet.", "Función no disponible.", "Fonction non disponible."),
    );
  };

  const guardFeature = (id: FeatureUnlockId) => {
    if (canUseProgressionFeature(id)) return true;
    showLockedFeatureToast(id);
    return false;
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  // Restore the authenticated session first, then load only that user's scoped cache.
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      clearUserState();
      setAuthReady(true);
      return;
    }

    sb.auth
      .getSession()
      .then(({ data: { session: activeSession } }) => {
        setSession(activeSession);
        if (activeSession?.user?.id) {
          loadUserCache(activeSession.user.id);
          loadSupabaseData(activeSession);
        } else {
          clearUserState();
        }
      })
      .finally(() => setAuthReady(true));

    const {
      data: { subscription: authSubscription },
    } = sb.auth.onAuthStateChange((event, activeSession) => {
      if (event === "PASSWORD_RECOVERY") setPasswordRecoveryMode(true);
      setSession(activeSession);
      setAuthReady(true);
      if (activeSession?.user?.id) {
        loadUserCache(activeSession.user.id);
        loadSupabaseData(activeSession);
      } else {
        clearUserState();
      }
    });

    return () => authSubscription.unsubscribe();
  }, []);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !session?.user) {
      setCloudMeta([]);
      return;
    }
    sb.from("meta_tactics")
      .select("title, content, last_verified_at")
      .eq("game_version_id", homeGameId)
      .eq("verification_status", "published")
      .order("last_verified_at", { ascending: false })
      .limit(10)
      .then(({ data, error }) => {
        if (error || !data?.length) {
          setCloudMeta([]);
          return;
        }
        const mapped = data.map((row: any, index: number) => ({
          formation: row.content?.formation || row.title || "4-2-3-1",
          playstyle: row.content?.playstyle || "Balanced",
          counter: row.content?.counter || "4-4-2 compact",
          score: Number(row.content?.score || Math.max(75, 92 - index * 3)),
          trend: Number(row.content?.trend || 0),
          label: uiText(
            "موثقة من مركز الميتا",
            "Verified Meta Center",
            "Verificado por Meta Center",
            "Vérifié par Meta Center",
          ),
        }));
        setCloudMeta(mapped);
      });
  }, [session?.user?.id, homeGameId, lang]);

  useEffect(() => {
    if (!isAddingRival) return;
    if (!rivalForm.favoriteTeam) {
      setRivalBoardState(null);
      return;
    }
    applyRivalBoardTemplate(
      rivalForm.favoriteTeam,
      rivalForm.favoriteFormation,
    );
  }, [
    isAddingRival,
    rivalForm.favoriteGame,
    rivalForm.favoriteTeam,
    rivalForm.favoriteFormation,
  ]);

  const loadSupabaseData = async (activeSession: any) => {
    const sb = getSupabase();
    if (!sb || !activeSession?.user) return;

    try {
      // 1. Fetch Profile
      const { data: profile } = await sb
        .from("users_profile")
        .select("*")
        .eq("user_id", activeSession.user.id)
        .maybeSingle();

      if (profile) {
        if (profile.display_name) {
          setCoachName(profile.display_name);
          localStorage.setItem("tb_coach_name", profile.display_name);
        }
        if (profile.favorite_game) {
          const profileGame = GAMES_LIST.find((game) => game.name === profile.favorite_game || game.id === profile.favorite_game);
          const profileGameId = profileGame?.id || homeGameId;
          setFavGame(profileGame?.name || profile.favorite_game);
          setHomeGameId(profileGameId);
          localStorage.setItem("tb_fav_game", profileGame?.name || profile.favorite_game);
          localStorage.setItem("tb_home_game_id", profileGameId);
          localStorage.setItem("tb_preferred_game_id", profileGameId);
        }
      }

      // 2. Fetch Tactics
      const { data: dbTactics } = await sb
        .from("saved_tactics")
        .select("*")
        .eq("user_id", activeSession.user.id)
        .order("created_at", { ascending: false });

      if (dbTactics) {
        const mapped: SavedTactic[] = dbTactics.map((row: any) => ({
          id: row.id,
          title: row.title,
          game: row.game,
          myFormation: row.user_formation,
          oppFormation: row.opponent_formation,
          opponentStyle: row.opponent_style,
          myStyle: row.user_style,
          matchState: row.match_state,
          myTeam: row.team,
          oppTeam: row.opponent_team,
          notes: row.notes || (row.input_data ? row.input_data.notes : ""),
          result: row.result_data,
          board: row.input_data?.board || null,
          createdAt: new Date(row.created_at).toLocaleDateString("ar-EG", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        }));
        setSavedTactics(mapped);
        localStorage.setItem(
          scopedKey("saved_tactics", activeSession.user.id),
          JSON.stringify(mapped),
        );
      }

      // 3. Fetch Rivals
      const { data: dbRivals } = await sb
        .from("rivals")
        .select("*")
        .eq("user_id", activeSession.user.id)
        .order("created_at", { ascending: false });

      if (dbRivals) {
        const mappedRivals: Rival[] = dbRivals.map((row: any) => ({
          id: row.id,
          name: row.name,
          favoriteGame: row.favorite_game,
          favoriteFormation: row.favorite_formation,
          playstyle: row.playstyle,
          strengths: row.strengths,
          weaknesses: row.weaknesses,
          notes: row.notes,
          favoriteTeam: row.favorite_team || "",
          board: row.board_data || null,
          createdAt: new Date(row.created_at).toLocaleDateString("ar-EG"),
        }));
        setRivals(mappedRivals);
        localStorage.setItem(
          scopedKey("rivals", activeSession.user.id),
          JSON.stringify(mappedRivals),
        );
      }

      // 4. Fetch Subscriptions
      const { data: dbSubs } = await sb
        .from("subscriptions")
        .select("*")
        .eq("user_id", activeSession.user.id)
        .maybeSingle();

      if (dbSubs) {
        const subObj: UserSubscription = {
          plan: dbSubs.plan || "free",
          status: dbSubs.status || "active",
          startedAt:
            dbSubs.started_at ||
            dbSubs.current_period_start ||
            new Date().toISOString(),
          expiresAt: dbSubs.expires_at || dbSubs.current_period_end || "",
          aiMonthlyLimit: Number(dbSubs.ai_monthly_limit ?? 30),
          savedTacticsLimit: Number(dbSubs.saved_tactics_limit ?? 25),
          rivalsLimit: Number(dbSubs.rivals_limit ?? 5),
        };
        setSubscription(subObj);
        localStorage.setItem(
          scopedKey("subscription", activeSession.user.id),
          JSON.stringify(subObj),
        );
      }

      const monthStart = new Date();
      monthStart.setUTCDate(1);
      monthStart.setUTCHours(0, 0, 0, 0);
      const { count: usageCount } = await sb
        .from("ai_requests")
        .select("id", { count: "exact", head: true })
        .eq("user_id", activeSession.user.id)
        .eq("success", true)
        .gte("created_at", monthStart.toISOString());
      setAiUsage(usageCount || 0);
      localStorage.setItem(
        scopedKey("ai_usage", activeSession.user.id),
        JSON.stringify(usageCount || 0),
      );

      const { data: cloudSettings } = await sb
        .from("user_settings")
        .select("theme, language")
        .eq("user_id", activeSession.user.id)
        .maybeSingle();
      if (cloudSettings?.theme) {
        setTheme(cloudSettings.theme);
        localStorage.setItem("tb_theme", cloudSettings.theme);
      }
      if (
        cloudSettings?.language &&
        ["ar", "en", "es", "fr"].includes(cloudSettings.language)
      ) {
        setLang(cloudSettings.language as SupportedLang);
        localStorage.setItem("tb_lang", cloudSettings.language);
      }

      const { data: cloudProgress } = await sb
        .from("user_progression")
        .select(
          "xp, streak, last_active_date, completed_challenge_ids, activity",
        )
        .eq("user_id", activeSession.user.id)
        .maybeSingle();
      if (cloudProgress) {
        const nextProgress: ProgressionState = {
          xp: Number(cloudProgress.xp || 0),
          streak: Number(cloudProgress.streak || 1),
          lastActiveDate:
            cloudProgress.last_active_date ||
            new Date().toISOString().slice(0, 10),
          completedChallengeIds: cloudProgress.completed_challenge_ids || [],
          activity: cloudProgress.activity || [],
        };
        setProgression(nextProgress);
        localStorage.setItem(
          scopedKey("progression", activeSession.user.id),
          JSON.stringify(nextProgress),
        );
      }

      const { data: cloudWallet } = await sb
        .from("user_reward_wallets")
        .select(
          "boss_coins, extra_generation_credits, ad_rewards_claimed_today, last_ad_reward_date, total_ad_rewards_claimed, events",
        )
        .eq("user_id", activeSession.user.id)
        .maybeSingle();
      if (cloudWallet) {
        const nextWallet: RewardWallet = {
          bossCoins: Number(cloudWallet.boss_coins || 0),
          extraGenerationCredits: Number(
            cloudWallet.extra_generation_credits || 0,
          ),
          adRewardsClaimedToday: Number(
            cloudWallet.ad_rewards_claimed_today || 0,
          ),
          lastAdRewardDate: cloudWallet.last_ad_reward_date || todayKey(),
          totalAdRewardsClaimed: Number(
            cloudWallet.total_ad_rewards_claimed || 0,
          ),
          events: cloudWallet.events || [],
        };
        setRewardWallet(nextWallet);
        localStorage.setItem(
          scopedKey("reward_wallet", activeSession.user.id),
          JSON.stringify(nextWallet),
        );
      }

      const { data: cloudCompetition } = await sb
        .from("coach_competition_profiles")
        .select("total_points, weekly_points, season_points, week_key, season_key, current_streak, last_active_date, badges, daily_usage")
        .eq("user_id", activeSession.user.id)
        .maybeSingle();
      if (cloudCompetition) {
        const nextCompetition = normalizeCompetitionState({
          totalPoints: Number(cloudCompetition.total_points || 0),
          weeklyPoints: Number(cloudCompetition.weekly_points || 0),
          seasonPoints: Number(cloudCompetition.season_points || 0),
          weekKey: cloudCompetition.week_key,
          seasonKey: cloudCompetition.season_key,
          currentStreak: Number(cloudCompetition.current_streak || 1),
          lastActiveDate: cloudCompetition.last_active_date || todayKey(),
          badges: cloudCompetition.badges || [],
          usage: {
            date: todayKey(),
            textGenerations: Number(cloudCompetition.daily_usage?.text_generation || 0),
            visionAnalyses: Number(cloudCompetition.daily_usage?.vision_analysis || 0),
            matchAnalyses: Number(cloudCompetition.daily_usage?.match_analysis || 0),
            coachTips: Number(cloudCompetition.daily_usage?.coach_tip || 0),
          },
        });
        setCompetition(nextCompetition);
        localStorage.setItem(
          scopedKey("coach_competition", activeSession.user.id),
          JSON.stringify(nextCompetition),
        );
      }
      refreshCoachLeague();

    } catch (err) {
      console.warn("Failed loading Supabase data:", err);
    }
  };

  // Update theme dynamically
  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("tb_theme", newTheme);
    const sb = getSupabase();
    if (sb && session?.user)
      sb.from("user_settings").upsert(
        { user_id: session.user.id, theme: newTheme },
        { onConflict: "user_id" },
      );
    triggerToast(
      uiText(
        "تم تغيير المظهر.",
        "Theme updated.",
        "Tema actualizado.",
        "Thème mis à jour.",
      ),
    );
  };

  // Update language dynamically
  const changeLang = (newLang: SupportedLang) => {
    setLang(newLang);
    localStorage.setItem("tb_lang", newLang);
    const sb = getSupabase();
    if (sb && session?.user)
      sb.from("user_settings").upsert(
        { user_id: session.user.id, language: newLang },
        { onConflict: "user_id" },
      );
    triggerToast(
      (
        {
          ar: "تم تغيير اللغة.",
          en: "Language updated.",
          es: "Idioma actualizado.",
          fr: "Langue mise à jour.",
        } as const
      )[newLang],
    );
  };

  const saveProfile = async () => {
    const sb = getSupabase();
    if (!sb || !session?.user) return;
    if (hasBlockedLanguage(coachName)) {
      triggerToast(moderationMessage(lang));
      return;
    }
    const safeName = sanitizeUserText(coachName, 80) || "Coach";
    const { error } = await sb
      .from("users_profile")
      .upsert(
        {
          user_id: session.user.id,
          display_name: safeName,
          favorite_game: preferredGameItem.name,
        },
        { onConflict: "user_id" },
      );
    if (error) {
      triggerToast(
        uiText(
          "تعذر حفظ بيانات الحساب.",
          "Could not save account details.",
          "No se pudieron guardar los datos.",
          "Impossible d’enregistrer le profil.",
        ),
      );
      return;
    }
    setCoachName(safeName);
    localStorage.setItem("tb_coach_name", safeName);
    localStorage.setItem("tb_fav_game", favGame);
    triggerToast(
      uiText(
        "تم حفظ بيانات الحساب.",
        "Account details saved.",
        "Datos guardados.",
        "Profil enregistré.",
      ),
    );
  };

  // Stepper validation & progression helper
  const nextStep = () => {
    if (step === 1 && !selectedGame) {
      triggerToast(
        uiText(
          "اختر إصدار اللعبة أولًا.",
          "Choose a game version first.",
          "Elige primero una versión del juego.",
          "Choisissez d’abord une version du jeu.",
        ),
      );
      return;
    }
    if (generatorMode === "counter" && step === 2) {
      const rec = makeGuidedRecommendations("counter").find((x) => x.id === selectedGuidedCardId) || makeGuidedRecommendations("counter")[0];
      applyGuidedRecommendation(rec);
      setStep(4);
      return;
    }
    if (generatorMode === "build" && step === 2) {
      const rec = makeGuidedRecommendations("build").find((x) => x.id === selectedGuidedCardId) || makeGuidedRecommendations("build")[0];
      applyGuidedRecommendation(rec);
      setStep(4);
      return;
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    if (generatorMode === "counter" && step === 4) {
      setStep(2);
      return;
    }
    if (generatorMode === "build" && step <= 2) {
      setStep(2);
      setScreen("home");
      return;
    }
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const incrementUsageCache = () => {
    const nextUsage = aiUsage + 1;
    setAiUsage(nextUsage);
    if (session?.user?.id)
      localStorage.setItem(
        scopedKey("ai_usage", session.user.id),
        JSON.stringify(nextUsage),
      );
    return nextUsage;
  };

  // Tracking must never destroy a tactic that was already generated successfully.
  // The secure RPC is preferred; older deployments fall back to a normal request log and local usage cache.
  const trackAiRequestBestEffort = async (
    requestType: string,
    gameName: string,
    provider: string,
    inputData: Record<string, unknown>,
    resultData: unknown,
  ): Promise<{ blocked: boolean; used: number; synced: boolean }> => {
    const fallback = () => ({
      blocked: false,
      used: incrementUsageCache(),
      synced: false,
    });
    const sb = getSupabase();
    if (!sb || !session?.user) return fallback();

    try {
      const { data: usageResult, error: usageError } = await sb.rpc(
        "log_ai_request",
        {
          p_request_type: requestType,
          p_game: gameName,
          p_provider: provider,
          p_input_data: inputData,
          p_result_data: resultData,
          p_success: true,
        },
      );
      if (!usageError) {
        const nextUsage = Number((usageResult as any)?.used ?? aiUsage + 1);
        setAiUsage(nextUsage);
        localStorage.setItem(
          scopedKey("ai_usage", session.user.id),
          JSON.stringify(nextUsage),
        );
        return { blocked: false, used: nextUsage, synced: true };
      }

      const rpcMessage = String(usageError.message || usageError);
      if (rpcMessage.includes("AI_LIMIT_REACHED"))
        return { blocked: true, used: aiUsage, synced: true };

      // Compatibility path for a site deployed before the latest database migration.
      const { error: insertError } = await sb.from("ai_requests").insert({
        user_id: session.user.id,
        request_type: requestType,
        game: gameName,
        provider,
        input_data: inputData,
        result_data: resultData,
        success: true,
      });
      if (!insertError)
        return { blocked: false, used: incrementUsageCache(), synced: true };
      console.warn(
        "Request tracking unavailable; generated result kept:",
        insertError.message,
      );
      return fallback();
    } catch (error) {
      console.warn(
        "Request tracking temporarily unavailable; generated result kept:",
        error,
      );
      return fallback();
    }
  };

  const fetchAiPlanOverride = async (
    rec: GuidedRecommendation | undefined,
    form: typeof formData,
  ): Promise<Partial<typeof formData> & { aiReason?: string; aiQuickActions?: string[] }> => {
    const endpoint =
      ((window as any).__TACTIC_BOSS_AI__?.coachEndpoint as string | undefined) ||
      localStorage.getItem("tb_ai_coach_endpoint") ||
      "/.netlify/functions/tactical-coach";
    if (!endpoint || !selectedGame) return {};
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6500);
    try {
      const sessionToken = await getSupabase()?.auth.getSession().then(({ data }) => data.session?.access_token).catch(() => undefined);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        signal: controller.signal,
        body: JSON.stringify({
          task: generatorMode === "counter" ? "counter_plan" : "build_plan",
          lang,
          mode: generatorMode,
          game: selectedGame.name,
          gameId: selectedGame.id,
          recommendation: rec,
          inputs: form,
          board: boardState,
          allowedOnly: true,
        }),
      });
      if (!res.ok) return {};
      const data = await res.json();
      const aiRec = data?.recommendation || data?.bestPlan || {};
      const formation = typeof aiRec.formation === "string" ? aiRec.formation : "";
      const style = typeof aiRec.style === "string" ? aiRec.style : "";
      const reason = typeof aiRec.reason === "string" ? cleanTacticText(aiRec.reason) : "";
      const quickActions = Array.isArray(data?.quickActions)
        ? data.quickActions.map((x: unknown) => cleanTacticText(String(x))).filter(Boolean).slice(0, 3)
        : [];
      return {
        ...(formation ? { myFormation: formation } : {}),
        ...(style ? { myStyle: style } : {}),
        ...(reason ? { reason } : {}),
        ...(quickActions.length ? { quickActions } : {}),
      };
    } catch (error) {
      console.warn("Plan generation fallback:", error);
      return {};
    } finally {
      window.clearTimeout(timeout);
    }
  };

  // Generate a game-specific tactic. A tracking or connectivity error cannot discard the generated plan.
  const handleGenerateTactic = async () => {
    if (!selectedGame) return;
    const monthlyLimit = subscription.aiMonthlyLimit || 30;
    const willUseExtraCredit =
      aiUsage >= monthlyLimit && rewardWallet.extraGenerationCredits > 0;
    if (aiUsage >= monthlyLimit && !willUseExtraCredit) {
      triggerToast(
        uiText(
          "وصلت للحد الشهري. افتح خطة إضافية عبر Boss Coins أو راجع الباقات.",
          "Monthly limit reached. Unlock an extra tactic with Boss Coins or check plans.",
          "Límite mensual alcanzado. Usa Boss Coins o revisa planes.",
          "Limite mensuelle atteinte. Utilisez Boss Coins ou consultez les offres.",
        ),
      );
      setScreen("subs");
      return;
    }

    if (!willUseExtraCredit) {
      const quota = await consumeAiQuota("text_generation");
      if (!quota.ok) {
        triggerToast(
          uiText(
            "وصلت للحد اليومي المجاني للتوليد. ارجع بكرة أو استخدم Boss Coins/Pro.",
            "Daily free generation limit reached. Come back tomorrow or use Boss Coins/Pro.",
            "Límite diario alcanzado. Vuelve mañana o usa Pro.",
            "Limite quotidienne atteinte. Revenez demain ou utilisez Pro.",
          ),
        );
        setScreen("subs");
        return;
      }
    }

    setIsLoading(true);
    setLoadingStep(0);
    const timers = [
      setTimeout(() => setLoadingStep(1), 350),
      setTimeout(() => setLoadingStep(2), 750),
      setTimeout(() => setLoadingStep(3), 1150),
      setTimeout(() => setLoadingStep(4), 1500),
    ];

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const activeGeneratorMode: "build" | "counter" = generatorMode === "counter" ? "counter" : "build";
      const guidedRec = makeGuidedRecommendations(activeGeneratorMode).find((x) => x.id === selectedGuidedCardId) || makeGuidedRecommendations(activeGeneratorMode)[0];
      let modeAwareForm =
        generatorMode === "build"
          ? {
              ...formData,
              myFormation: guidedRec?.formation || formData.myFormation,
              myStyle: guidedRec?.style || formData.myStyle,
              opponentStyle: uiText(
                "بناء خطة المستخدم الخاصة",
                "Build user-owned tactic",
                "Crear táctica propia",
                "Créer sa propre tactique",
              ),
              notes: `${formData.notes} | MODE: BUILD_MY_TACTIC | ${guidedRec?.notes || "AI_GUIDED"}`,
            }
          : {
              ...formData,
              myFormation: guidedRec?.formation || formData.myFormation,
              myStyle: guidedRec?.style || formData.myStyle,
              notes: `${formData.notes} | AUTO_COUNTER:${formData.oppFormation}:${formData.opponentStyle}:${formData.matchState} | ${guidedRec?.notes || "TACTICAL_COUNTER"}`,
            };
      // V131.4: the product no longer depends on a remote chat/model.
      // All visible recommendations are generated by the local game-DNA engine.
      const planReason = uiText(
        "تم اختيار الخطة من محرك اللعبة المحلي حسب هدفك وتشكيلك ووضع المباراة.",
        "The local game-DNA engine selected this plan from your goal, shape and match context.",
        "El motor local eligió el plan según tu objetivo y contexto.",
        "Le moteur local a choisi ce plan selon votre objectif et le contexte.",
      );
      const quickAdjustments: string[] = [];
      modeAwareForm = {
        ...modeAwareForm,
        notes: `${modeAwareForm.notes || ""} | TACTIC_ENGINE:local-game-dna`,
      };
      const rawResult = generateLocalTactic(selectedGame, modeAwareForm, lang);
      const result = normalizeResultLanguage(
        rawResult,
        lang,
        formData.oppFormation,
        modeAwareForm.opponentStyle,
      );
      const boardInsights = analyzeBoardShape(boardState, lang);
      const boardAwareResult = applyBoardIntelligence(result, boardState, lang);
      const baseFinalResult = {
        ...boardAwareResult,
        formation: modeAwareForm.myFormation || boardAwareResult.formation,
        attackingStyle: modeAwareForm.myStyle || boardAwareResult.attackingStyle,
        reason: `${uiText("اختيار تكتيكي حسب إجاباتك وليس قالبًا ثابتًا.", "Tactical selection from your answers, not a fixed template.", "Selección táctica.", "Sélection tactique.")} ${planReason || boardAwareResult.reason || ""}`,
        boardAnalysis: [
          ...boardInsights,
          ...quickAdjustments.map((item) => `${uiText("تعديل سريع", "Quick adjustment", "Ajuste rápido", "Ajustement rapide")}: ${item}`),
        ],
      };
      const generatedBoard = isEfootballGame(selectedGame.id)
        ? buildEfootballManagerBoard(
            baseFinalResult.formation,
            formData.oppFormation,
            getEfootballManager(formData.efootballManagerId) || efootballManagers[0],
          )
        : buildGameAwareBoard(
            selectedGame.id,
            baseFinalResult.formation,
            formData.oppFormation,
          );
      const lockedPlan = lockFinalPlanResult(baseFinalResult, generatedBoard, {
        sourceTool: generatorMode,
        game: selectedGame.id,
        language: lang,
        formation: baseFinalResult.formation,
        playstyle: baseFinalResult.attackingStyle,
        confidenceFallback: resultTacticalScore,
      });
      const finalResult = lockedPlan.result;
      const finalBoard = lockedPlan.board;
      const requestPayload = {
        game: selectedGame.name,
        game_id: selectedGame.id,
        generator_mode: generatorMode,
        ...modeAwareForm,
        board: finalBoard,
      };

      let tracking = { blocked: false, used: aiUsage, synced: false };
      if (willUseExtraCredit) {
        const consumed = consumeExtraGenerationCredit(rewardWallet);
        if (!consumed.ok) {
          setScreen("subs");
          return;
        }
        persistRewardWallet(consumed.wallet);
        getSupabase()
          ?.from("ai_requests")
          .insert({
            user_id: session?.user?.id,
            request_type: "generate_tactic_extra_credit",
            game: selectedGame.name,
            provider: "boss_coins_credit_",
            input_data: requestPayload,
            result_data: finalResult,
            success: true,
          });
        triggerToast(
          uiText(
            "تم استخدام توليدة إضافية من Boss Coins.",
            "Used one Boss Coins extra generation.",
            "Usaste una generación extra.",
            "Génération supplémentaire utilisée.",
          ),
        );
      } else {
        tracking = await trackAiRequestBestEffort(
          "generate_tactic",
          selectedGame.name,
          "team_board_dna_v54",
          requestPayload,
          finalResult,
        );
        if (tracking.blocked) {
          triggerToast(
            uiText(
              "وصلت للحد الشهري للخطط.",
              "You reached your monthly tactic limit.",
              "Alcanzaste el límite mensual.",
              "Vous avez atteint la limite mensuelle.",
            ),
          );
          setScreen("subs");
          return;
        }
      }

      setFormData(modeAwareForm);
      setBoardState(finalBoard);
      setCurrentResult(finalResult);
              setScreen("result");
      awardActivity("generate");
      if (!tracking.synced) {
        triggerToast(
          uiText(
            "تم إنشاء الخطة، وسيتم حفظ سجل الاستخدام عند عودة الاتصال.",
            "Tactic created. Usage will sync when connection returns.",
            "Táctica creada. El uso se sincronizará al volver la conexión.",
            "Tactique créée. L’utilisation sera synchronisée au retour de la connexion.",
          ),
        );
      }
    } catch (err) {
      console.warn("Tactic generation error:", err);
      triggerToast(
        uiText(
          "تعذر تجهيز الخطة من البيانات الحالية. راجع الاختيارات وحاول مرة أخرى.",
          "The tactic could not be prepared from the current inputs. Review them and try again.",
          "No se pudo preparar la táctica. Revisa los datos e inténtalo de nuevo.",
          "Impossible de préparer la tactique. Vérifiez les choix et réessayez.",
        ),
      );
    } finally {
      timers.forEach(clearTimeout);
      setIsLoading(false);
    }
  };

  const handleDevelopTactic = async () => {
    if (!developmentGame) return;
    if (aiUsage >= (subscription.aiMonthlyLimit || 30)) {
      triggerToast(
        uiText(
          "وصلت للحد الشهري للخطط. راجع الباقات.",
          "You reached your monthly tactic limit. Check plans.",
          "Alcanzaste el límite mensual. Revisa los planes.",
          "Vous avez atteint la limite mensuelle. Consultez les offres.",
        ),
      );
      setScreen("subs");
      return;
    }
    setIsDeveloping(true);
    setDevelopmentResult(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      const selectedGoal =
        developmentGoals.find((goal) => goal.value === developmentForm.goal)
          ?.label || developmentForm.goal;
      const result = analyzeTacticDevelopment(
        developmentGame,
        {
          formation: developmentForm.formation,
          style: developmentForm.style,
          team: developmentForm.team,
          goal: selectedGoal,
          notes: developmentForm.notes,
        },
        developmentBoard,
        lang,
      );
      const payload = {
        ...developmentForm,
        goal_label: selectedGoal,
        board: developmentBoard,
      };
      const tracking = await trackAiRequestBestEffort(
        "improve_tactic",
        developmentGame.name,
        "tactic_development_v54",
        payload,
        result,
      );
      if (tracking.blocked) {
        triggerToast(
          uiText(
            "وصلت للحد الشهري للخطط.",
            "You reached your monthly tactic limit.",
            "Alcanzaste el límite mensual.",
            "Vous avez atteint la limite mensuelle.",
          ),
        );
        setScreen("subs");
        return;
      }
      setDevelopmentResult(result);
      awardActivity("improve");
      triggerToast(
        uiText(
          "تم تحليل خطتك وتجهيز خطة التطوير.",
          "Your tactic was analyzed and the development plan is ready.",
          "Tu táctica fue analizada y el plan de mejora está listo.",
          "Votre tactique a été analysée et le plan de développement est prêt.",
        ),
      );
    } catch (error) {
      console.warn("Tactic development error:", error);
      triggerToast(
        uiText(
          "تعذر تحليل خطتك الآن. حاول مرة أخرى.",
          "Could not analyze your tactic now. Try again.",
          "No se pudo analizar tu táctica. Inténtalo de nuevo.",
          "Impossible d’analyser votre tactique. Réessayez.",
        ),
      );
    } finally {
      setIsDeveloping(false);
    }
  };

  const openDevelopedTactic = () => {
    if (!developmentResult || !developmentGame) return;
    setSelectedGame(developmentGame);
    setFormData({
      myFormation: developmentResult.recommendedFormation,
      oppFormation: "4-2-3-1",
      opponentStyle: "متوازن",
      myStyle: developmentForm.style,
      matchState: "بداية الماتش",
      myTeam: developmentForm.team,
      oppTeam: "",
      notes: developmentForm.notes,
      efootballManagerId: formData.efootballManagerId,
    });
    const lockedDevelopment = lockFinalPlanResult(developmentResult.tactic, developmentBoard, {
      sourceTool: "improve",
      game: developmentGame.id,
      language: lang,
      formation: developmentResult.recommendedFormation,
      playstyle: developmentForm.style,
      confidenceFallback: resultTacticalScore,
    });
    setBoardState(lockedDevelopment.board);
    setCurrentResult(lockedDevelopment.result);
    setScreen("result");
  };

  const useMetaItem = (item: MetaItem) => {
    const game = GAMES_LIST.find((g) => g.id === homeGameId) || GAMES_LIST[0];
    const teams = getPopularTeamsForGame(game.id);
    const own = teams[0];
    const opponent = teams[1] || teams[0];
    const opponentFormation = opponent?.defaultFormation || "4-2-3-1";
    const readyResult: TacticResult = {
      formation: item.formation,
      reason: `${item.whyItWorks || item.label} ${uiText("هذه خطة Meta جاهزة للتطبيق وليست مجرد اقتراح عام.", "This is a ready Meta plan, not a generic suggestion.", "Plan meta listo.", "Plan méta prêt.")}`,
      defensiveStyle: item.counter,
      defensiveDetails: {
        [uiText(
          "أفضل مضاد",
          "Best counter",
          "Mejor contra",
          "Meilleur contre",
        )]: item.counter,
        [uiText("نقطة الضعف", "Weakness", "Debilidad", "Faiblesse")]:
          item.weakness || "",
        [uiText(
          "معاينة السبورة",
          "Board preview",
          "Vista de pizarra",
          "Aperçu tableau",
        )]: item.boardPreview || "",
      },
      attackingStyle: item.playstyle,
      attackingDetails: {
        [uiText("المدرب / الفلسفة", "Manager / DNA", "Manager", "Manager")]:
          item.manager || "Game DNA",
        [uiText("أدوار اللاعبين", "Player profiles", "Roles", "Profils")]: (
          item.playerProfiles || []
        ).join(" • "),
        [uiText("تعديلات متقدمة", "Advanced tweaks", "Ajustes", "Ajustements")]:
          (item.advancedAdjustments || []).join(" • "),
      },
      playerInstructions: [
        ...(item.individualInstructions || []),
        ...(item.playerProfiles || []),
      ],
      inGameStrategy: item.whyItWorks || "",
      emergencyPlan: uiText(
        "لو متأخر: ارفع لاعب وسط هجوميًا وحافظ على DMF ثابت ضد المرتدة.",
        "If trailing: push one midfielder higher and keep one DMF fixed against counters.",
        "Si vas perdiendo, sube un medio.",
        "Si vous perdez, poussez un milieu.",
      ),
      protectLeadPlan: uiText(
        "لو متقدم: ثبّت الظهيرين وقلّل المخاطرة في التمريرة الأولى.",
        "If leading: hold fullbacks and reduce first-pass risk.",
        "Si ganas, protege laterales.",
        "Si vous menez, sécurisez les latéraux.",
      ),
      mistakesToAvoid: [
        item.weakness ||
          uiText(
            "لا تنسخ الخطة بدون مراعاة لاعبيك.",
            "Do not copy without checking your players.",
            "No copies sin revisar jugadores.",
            "Ne copiez pas sans vérifier vos joueurs.",
          ),
      ],
      difficulty:
        item.tier === "elite"
          ? "Advanced"
          : item.tier === "pro"
            ? "Medium"
            : "Easy / Medium",
      confidence: `${item.score}%`,
      boardAnalysis: [item.boardPreview || "", item.whyItWorks || ""],
    };
    setSelectedGame(game);
    setGeneratorMode("build");
    setFormData({
      myFormation: item.formation,
      oppFormation: opponentFormation,
      opponentStyle: item.counter,
      myStyle: item.playstyle,
      matchState: uiText(
        "خطة Meta جاهزة",
        "Ready Meta plan",
        "Plan meta listo",
        "Plan méta prêt",
      ),
      myTeam: own?.name || "",
      oppTeam: opponent?.name || "",
      notes: item.whyItWorks || "",
      efootballManagerId: formData.efootballManagerId,
    });
    const metaBoard = isEfootballGame(game.id)
      ? buildEfootballManagerBoard(
          item.formation,
          opponentFormation,
          selectedEfootballManager,
        )
      : buildGameAwareBoard(game.id, item.formation, opponentFormation);
    const lockedMetaPlan = lockFinalPlanResult(readyResult, metaBoard, {
      sourceTool: "daily",
      game: game.id,
      language: lang,
      formation: item.formation,
      playstyle: item.playstyle,
      confidenceFallback: item.score,
    });
    setBoardState(lockedMetaPlan.board);
    setCurrentResult(lockedMetaPlan.result);
    awardActivity("daily_plan");
    setScreen("result");
  };

  // Save tactic to library
  const handleSaveTactic = async () => {
    if (!selectedGame || !currentResult || !session?.user) return;

    if (savedTactics.length >= (subscription.savedTacticsLimit || 10)) {
      triggerToast(
        uiText(
          `وصلت لحد حفظ الخطط (${subscription.savedTacticsLimit}).`,
          `You reached your saved tactics limit (${subscription.savedTacticsLimit}).`,
          `Alcanzaste el límite de tácticas guardadas (${subscription.savedTacticsLimit}).`,
          `Vous avez atteint la limite de tactiques enregistrées (${subscription.savedTacticsLimit}).`,
        ),
      );
      setScreen("subs");
      return;
    }

    const sb = getSupabase();
    if (!sb) {
      triggerToast(
        uiText(
          "تعذر الحفظ الآن. تحقق من الاتصال.",
          "Could not save now. Check your connection.",
          "No se pudo guardar. Revisa tu conexión.",
          "Impossible d’enregistrer. Vérifiez votre connexion.",
        ),
      );
      return;
    }

    const lockedForSave = lockExistingResult(currentResult, getLockedBoardState());
    const saveResult = lockedForSave.result;
    const saveBoard = lockedForSave.board;
    const title = `${selectedGame.name} - ${formData.myTeam || uiText("فريقك", "Your team", "Tu equipo", "Votre équipe")} 🆚 ${formData.oppTeam || uiText("الخصم", "Opponent", "Rival", "Adversaire")}`;
    const { data: savedRow, error } = await sb
      .from("saved_tactics")
      .insert({
        title,
        game: selectedGame.name,
        user_formation: formData.myFormation,
        opponent_formation: formData.oppFormation,
        user_style: formData.myStyle,
        opponent_style: formData.opponentStyle,
        match_state: formData.matchState,
        team: formData.myTeam || "Your team",
        opponent_team: formData.oppTeam || "Opponent",
        input_data: { ...formData, board: saveBoard, finalPlanVersion: FINAL_PLAN_VERSION },
        result_data: saveResult,
        user_id: session.user.id,
      })
      .select("*")
      .single();

    if (error) {
      const msg = String(error.message || "");
      if (msg.includes("SAVED_TACTICS_LIMIT_REACHED")) setScreen("subs");
      triggerToast(
        msg.includes("SAVED_TACTICS_LIMIT_REACHED")
          ? uiText(
              "وصلت لحد حفظ الخطط في باقتك.",
              "You reached your saved tactics limit.",
              "Alcanzaste el límite de tácticas guardadas.",
              "Vous avez atteint la limite de tactiques enregistrées.",
            )
          : uiText(
              "تعذر حفظ الخطة الآن. حاول مرة أخرى.",
              "Could not save the tactic now. Try again.",
              "No se pudo guardar la táctica.",
              "Impossible d’enregistrer la tactique.",
            ),
      );
      return;
    }

    const newSaved: SavedTactic = {
      id: savedRow.id,
      title,
      game: selectedGame.name,
      myFormation: formData.myFormation,
      oppFormation: formData.oppFormation,
      opponentStyle: formData.opponentStyle,
      myStyle: formData.myStyle,
      matchState: formData.matchState,
      myTeam: formData.myTeam,
      oppTeam: formData.oppTeam,
      notes: formData.notes,
      result: saveResult,
      board: saveBoard,
      createdAt: new Date(savedRow.created_at || Date.now()).toLocaleDateString(
        lang === "ar" ? "ar-EG" : "en-US",
        { day: "numeric", month: "short", year: "numeric" },
      ),
    };
    syncTactics([
      newSaved,
      ...savedTactics.filter((item) => item.id !== newSaved.id),
    ]);
    awardActivity("save");
    triggerToast(
      uiText(
        "تم حفظ الخطة بنجاح.",
        "Tactic saved successfully.",
        "Táctica guardada.",
        "Tactique enregistrée.",
      ),
    );
  };

  // Delete saved tactic
  const handleDeleteTactic = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingConfirm({
      title: uiText(
        "حذف الخطة",
        "Delete tactic",
        "Eliminar táctica",
        "Supprimer la tactique",
      ),
      message: uiText(
        "لن تتمكن من استعادة هذه الخطة بعد الحذف.",
        "This tactic cannot be restored after deletion.",
        "Esta táctica no se podrá recuperar.",
        "Cette tactique ne pourra pas être restaurée.",
      ),
      confirmLabel: uiText("حذف", "Delete", "Eliminar", "Supprimer"),
      action: async () => {
        const sb = getSupabase();
        if (!sb || !session?.user) return;
        const { error } = await sb
          .from("saved_tactics")
          .delete()
          .eq("id", id)
          .eq("user_id", session.user.id);
        if (error) {
          triggerToast(
            uiText(
              "تعذر حذف الخطة. حاول مرة أخرى.",
              "Could not delete the tactic. Try again.",
              "No se pudo eliminar la táctica.",
              "Impossible de supprimer la tactique.",
            ),
          );
          return;
        }
        syncTactics(savedTactics.filter((item) => item.id !== id));
        triggerToast(
          uiText(
            "تم حذف الخطة.",
            "Tactic deleted.",
            "Táctica eliminada.",
            "Tactique supprimée.",
          ),
        );
      },
    });
  };

  // Active Rival specific preset
  const handleTriggerRivalTactic = (rival: Rival) => {
    const matched =
      GAMES_LIST.find((g) => g.name === rival.favoriteGame) || GAMES_LIST[0];
    setSelectedGame(matched);
    setFormData({
      myFormation: "4-3-3",
      oppFormation: rival.favoriteFormation,
      opponentStyle: rival.playstyle,
      myStyle: "مرتدات",
      efootballManagerId: formData.efootballManagerId,
      matchState: "بداية الماتش",
      myTeam: "",
      oppTeam: rival.favoriteTeam || rival.name,
      notes: uiText(
        `تحدي ${rival.name}. نقاط القوة: ${rival.strengths}. نقاط الضعف: ${rival.weaknesses}. ${rival.notes || ""}`,
        `Counter ${rival.name}. Strengths: ${rival.strengths}. Weaknesses: ${rival.weaknesses}. ${rival.notes || ""}`,
        `Contra ${rival.name}. Fortalezas: ${rival.strengths}. Debilidades: ${rival.weaknesses}. ${rival.notes || ""}`,
        `Contrer ${rival.name}. Forces : ${rival.strengths}. Faiblesses : ${rival.weaknesses}. ${rival.notes || ""}`,
      ),
    });
    if (rival.board) setBoardState(rival.board);
    else if (rival.favoriteTeam) {
      const nextBoard = boardFromTeams(
        matched.id,
        "",
        rival.favoriteTeam,
        "4-3-3",
        rival.favoriteFormation,
      );
      if (nextBoard) setBoardState(nextBoard);
    }
    setStep(3);
    setScreen("generator");
    triggerToast(
      uiText(
        `تم تحميل سبورة ${rival.name} وتجهيز الخطة المضادة.`,
        `Loaded ${rival.name}'s board and prepared the counter tactic.`,
        `Se cargó la pizarra de ${rival.name}.`,
        `Le tableau de ${rival.name} a été chargé.`,
      ),
    );
  };

  const openDevelopmentAgainstRival = (rival: Rival) => {
    const game =
      GAMES_LIST.find((item) => item.name === rival.favoriteGame) ||
      GAMES_LIST[0];
    const teams = getPopularTeamsForGame(game.id);
    const preferredTeam =
      teams.find((team) => team.name === formData.myTeam) || teams[0];
    const formation =
      preferredTeam?.defaultFormation || formData.myFormation || "4-3-3";
    setDevelopmentForm({
      gameId: game.id,
      team: preferredTeam?.name || "",
      formation,
      style: formData.myStyle || "متوازن",
      goal: "balanced",
      notes: uiText(
        `طوّر خطتي لمواجهة ${rival.name}. أسلوبه: ${rival.playstyle}. نقاط قوته: ${rival.strengths || "غير معروفة"}.`,
        `Develop my tactic to face ${rival.name}. Style: ${rival.playstyle}. Strengths: ${rival.strengths || "unknown"}.`,
        `Mejora mi táctica para enfrentar a ${rival.name}. Estilo: ${rival.playstyle}.`,
        `Développez ma tactique pour affronter ${rival.name}. Style : ${rival.playstyle}.`,
      ),
    });
    const nextBoard = boardFromTeams(
      game.id,
      preferredTeam?.name || "",
      rival.favoriteTeam || "",
      formation,
      rival.favoriteFormation,
    );
    setDevelopmentBoard(nextBoard || rival.board || null);
    setDevelopmentResult(null);
    setScreen("improve-tactic");
  };

  // Add Rival
  const handleAddRival = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    if (rivals.length >= (subscription.rivalsLimit || 3)) {
      triggerToast(
        uiText(
          `وصلت لحد ملفات الخصوم (${subscription.rivalsLimit}).`,
          `You reached your rival profiles limit (${subscription.rivalsLimit}).`,
          `Alcanzaste el límite de rivales (${subscription.rivalsLimit}).`,
          `Vous avez atteint la limite de rivaux (${subscription.rivalsLimit}).`,
        ),
      );
      setScreen("subs");
      return;
    }

    const sb = getSupabase();
    if (!sb) {
      triggerToast(
        uiText(
          "تعذر حفظ ملف الخصم الآن.",
          "Could not save the rival profile now.",
          "No se pudo guardar el rival.",
          "Impossible d’enregistrer le rival.",
        ),
      );
      return;
    }

    const { data: row, error } = await sb
      .from("rivals")
      .insert({
        name: rivalForm.name || uiText("خصم", "Rival", "Rival", "Rival"),
        favorite_game: rivalForm.favoriteGame,
        favorite_formation: rivalForm.favoriteFormation,
        playstyle: rivalForm.playstyle,
        strengths: rivalForm.strengths,
        weaknesses: rivalForm.weaknesses,
        notes: rivalForm.notes,
        favorite_team: rivalForm.favoriteTeam || null,
        board_data: rivalBoardState,
        user_id: session.user.id,
      })
      .select("*")
      .single();

    if (error) {
      const message = String(error.message || "");
      if (message.includes("RIVALS_LIMIT_REACHED")) setScreen("subs");
      triggerToast(
        message.includes("RIVALS_LIMIT_REACHED")
          ? uiText(
              "وصلت لحد ملفات الخصوم في باقتك.",
              "You reached your rival profiles limit.",
              "Alcanzaste el límite de rivales.",
              "Vous avez atteint la limite de rivaux.",
            )
          : uiText(
              "تعذر حفظ ملف الخصم. حاول مرة أخرى.",
              "Could not save the rival profile. Try again.",
              "No se pudo guardar el rival.",
              "Impossible d’enregistrer le rival.",
            ),
      );
      return;
    }

    const newR: Rival = {
      id: row.id,
      name: row.name,
      favoriteGame: row.favorite_game,
      favoriteFormation: row.favorite_formation,
      favoriteTeam: row.favorite_team || "",
      playstyle: row.playstyle,
      strengths: row.strengths,
      weaknesses: row.weaknesses,
      notes: row.notes,
      board: row.board_data || rivalBoardState,
      createdAt: new Date(row.created_at || Date.now()).toLocaleDateString(
        lang === "ar" ? "ar-EG" : "en-US",
      ),
    };
    syncRivals([newR, ...rivals.filter((item) => item.id !== newR.id)]);
    awardActivity("rival");
    setIsAddingRival(false);
    setRivalBoardState(null);
    setRivalForm({
      name: "",
      favoriteGame: "EA SPORTS FC 26",
      favoriteFormation: "4-2-3-1",
      favoriteTeam: "",
      playstyle: "ضغط عالي",
      strengths: "",
      weaknesses: "",
      notes: "",
    });
    triggerToast(
      uiText(
        "تم حفظ ملف الخصم والسبورة.",
        "Rival profile and board saved.",
        "Rival y pizarra guardados.",
        "Rival et tableau enregistrés.",
      ),
    );
  };

  // Delete Rival
  const handleDeleteRival = (id: string) => {
    setPendingConfirm({
      title: uiText(
        "حذف ملف الخصم",
        "Delete rival profile",
        "Eliminar perfil rival",
        "Supprimer le profil rival",
      ),
      message: uiText(
        "سيتم حذف بيانات الخصم والسبورة المحفوظة معه.",
        "The rival data and saved board will be deleted.",
        "Se eliminarán los datos y la pizarra del rival.",
        "Les données et le tableau du rival seront supprimés.",
      ),
      confirmLabel: uiText("حذف", "Delete", "Eliminar", "Supprimer"),
      action: async () => {
        const sb = getSupabase();
        if (!sb || !session?.user) return;
        const { error } = await sb
          .from("rivals")
          .delete()
          .eq("id", id)
          .eq("user_id", session.user.id);
        if (error) {
          triggerToast(
            uiText(
              "تعذر حذف ملف الخصم.",
              "Could not delete the rival profile.",
              "No se pudo eliminar el perfil.",
              "Impossible de supprimer le profil.",
            ),
          );
          return;
        }
        syncRivals(rivals.filter((item) => item.id !== id));
        triggerToast(
          uiText(
            "تم حذف ملف الخصم.",
            "Rival profile deleted.",
            "Perfil rival eliminado.",
            "Profil rival supprimé.",
          ),
        );
      },
    });
  };

  const getSafeGameProfile = () => {
    const id = selectedGame?.id || "";
    if (id.includes("efootball")) return uiText("ملف تكتيكي حديث", "EFB Current Profile", "Perfil EFB actual", "Profil EFB actuel");
    if (id.includes("pes")) return uiText("ملف كلاسيكي", "Classic Profile", "Perfil clásico", "Profil classique");
    if (id.includes("fc") || id.includes("fifa")) return uiText("ملف حديث", "FC Modern Profile", "Perfil moderno", "Profil moderne");
    return uiText("ملف تكتيكي", "Tactical Profile", "Perfil táctico", "Profil tactique");
  };

  const miniPitchPositions = (formation = "4-2-3-1") => {
    const f = formation.replace(/\s+/g, "");
    const defaults: Record<string, Array<[string, number, number]>> = {
      "4-2-3-1": [["GK",50,91],["LB",16,75],["CB",38,76],["CB",62,76],["RB",84,75],["DMF",38,58],["CMF",62,58],["LWF",22,34],["AMF",50,43],["RWF",78,34],["CF",50,15]],
      "4-2-1-3": [["GK",50,91],["LB",16,75],["CB",38,76],["CB",62,76],["RB",84,75],["DMF",38,58],["DMF",62,58],["AMF",50,43],["LWF",22,23],["RWF",78,23],["CF",50,12]],
      "4-3-3": [["GK",50,91],["LB",16,75],["CB",38,76],["CB",62,76],["RB",84,75],["DMF",50,60],["CMF",32,48],["CMF",68,48],["LWF",22,24],["RWF",78,24],["CF",50,12]],
      "3-2-4-1": [["GK",50,91],["CB",28,76],["CB",50,78],["CB",72,76],["DMF",38,60],["DMF",62,60],["LMF",16,42],["AMF",40,38],["AMF",60,38],["RMF",84,42],["CF",50,13]],
      "4-4-2": [["GK",50,91],["LB",16,75],["CB",38,76],["CB",62,76],["RB",84,75],["LMF",18,48],["CMF",40,53],["CMF",60,53],["RMF",82,48],["SS",42,18],["CF",58,18]],
      "5-3-2": [["GK",50,91],["LB",12,74],["CB",30,77],["CB",50,79],["CB",70,77],["RB",88,74],["DMF",50,58],["CMF",34,48],["CMF",66,48],["SS",40,20],["CF",60,20]],
      "5-2-1-2": [["GK",50,91],["LB",12,74],["CB",30,77],["CB",50,79],["CB",70,77],["RB",88,74],["DMF",38,58],["DMF",62,58],["AMF",50,40],["SS",42,18],["CF",58,18]],
      "5-2-2-1": [["GK",50,91],["LB",12,74],["CB",30,77],["CB",50,79],["CB",70,77],["RB",88,74],["DMF",38,58],["DMF",62,58],["LWF",24,30],["RWF",76,30],["CF",50,13]],
      "3-5-2": [["GK",50,91],["CB",30,77],["CB",50,79],["CB",70,77],["LMF",15,50],["DMF",50,60],["CMF",35,45],["CMF",65,45],["RMF",85,50],["SS",40,18],["CF",60,18]],
      "4-2-2-2": [["GK",50,91],["LB",16,75],["CB",38,76],["CB",62,76],["RB",84,75],["DMF",38,58],["DMF",62,58],["AMF",34,38],["AMF",66,38],["SS",42,18],["CF",58,18]],
      "4-3-2-1": [["GK",50,91],["LB",16,75],["CB",38,76],["CB",62,76],["RB",84,75],["DMF",50,60],["CMF",32,50],["CMF",68,50],["AMF",40,32],["AMF",60,32],["CF",50,13]],
    };
    return defaults[f] || defaults["4-2-3-1"];
  };

  const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  };

  const fitText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, font: string, color: string, align: CanvasTextAlign = "left") => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    let t = cleanTacticText(text || "");
    while (ctx.measureText(t).width > maxWidth && t.length > 4) t = t.slice(0, -2);
    if (t !== text && t.length > 4) t = t.slice(0, -1) + "…";
    ctx.fillText(t, x, y);
  };

  const createProShareCardBlob = async () => {
    if (!currentResult) return null;
    const actionPlan = getActionPlan();
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 1280;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    try { await document.fonts?.ready; } catch {}

    const isAr = lang === "ar";
    const dir: CanvasDirection = isAr ? "rtl" : "ltr";
    const fontFamily = isAr
      ? "Cairo, Tajawal, 'Noto Sans Arabic', Arial, sans-serif"
      : "Inter, Arial, sans-serif";
    const roleBadge = (role: string) => {
      const raw = String(role || "").trim();
      const alpha = raw.replace(/[^A-Za-z]/g, " ").trim();
      if (!alpha && raw.length <= 4) return raw.toUpperCase();
      if (!alpha) return "P";
      const known: Record<string, string> = {
        goalkeeper: "GK", keeper: "GK", defender: "CB", midfielder: "CM", winger: "WG", forward: "CF", poacher: "CF",
      };
      const key = alpha.toLowerCase();
      if (known[key]) return known[key];
      if (alpha.length <= 4) return alpha.toUpperCase();
      return alpha.split(/\s+/).map((word) => word[0]).join("").slice(0, 4).toUpperCase();
    };
    const cleanCardText = (value: unknown, fallback = "—") => {
      const cleaned = cleanTacticText(String(value ?? "")).replace(/\s+/g, " ").trim();
      return cleaned || fallback;
    };
    const shortText = (value: unknown, max = isAr ? 46 : 58) => {
      const textValue = cleanCardText(value, "");
      return textValue.length > max ? `${textValue.slice(0, max - 1).trim()}…` : textValue;
    };
    const ratingNumber = safeScore10((currentResult as any).score ?? (currentResult as any).rating, resultTacticalScore);
    const confidenceNumber = Math.max(35, Math.min(99, safePercent(currentResult.confidence, 86)));
    const formation = cleanCardText(currentResult.formation || formData.myFormation || "4-2-3-1");
    const styleLabelRaw = cleanCardText(optionLabel(actionPlan.style, lang) || actionPlan.style || currentResult.attackingStyle || formData.myStyle || "Balanced");
    const styleTitle = isAr ? shortText(styleLabelRaw, 28) : shortText(styleLabelRaw.toUpperCase(), 32);
    const userName = shortText(coachName || "Tactic Boss", 24);
    const planType = generatorMode === "counter"
      ? uiText("خطة مضادة", "Counter Plan", "Plan contra", "Plan de contre")
      : uiText("خطة شخصية", "My Tactic", "Mi táctica", "Ma tactique");
    const finalBoardForCard = getLockedBoardState();
    const boardPitchPositions: Array<[string, number, number]> = finalBoardForCard?.players
      ?.filter((player) => !player.isOpponent)
      .slice(0, 11)
      .map((player) => [roleBadge(player.role), player.x, player.y]) || [];

    const drawRR = (x:number, y:number, w:number, h:number, r:number, fill?: string | CanvasGradient, stroke?: string, lw = 1.5) => {
      if (fill) { ctx.fillStyle = fill; drawRoundRect(ctx, x, y, w, h, r); ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; drawRoundRect(ctx, x, y, w, h, r); ctx.stroke(); }
    };
    const setText = (font: string, color: string, align: CanvasTextAlign, direction: CanvasDirection = dir) => {
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.direction = direction;
      ctx.textBaseline = "alphabetic";
    };
    const drawText = (value: unknown, x: number, y: number, maxWidth: number, font: string, color: string, align: CanvasTextAlign = isAr ? "right" : "left", direction: CanvasDirection = dir) => {
      ctx.save();
      setText(font, color, align, direction);
      let t = cleanCardText(value, "");
      while (ctx.measureText(t).width > maxWidth && t.length > 3) t = t.slice(0, -1);
      if (cleanCardText(value, "") !== t && t.length > 3) t = `${t.slice(0, -1)}…`;
      ctx.fillText(t, x, y);
      ctx.restore();
    };
    const wrapLines = (value: unknown, maxWidth: number, font: string, maxLines = 3) => {
      ctx.save();
      ctx.font = font;
      ctx.direction = dir;
      const words = cleanCardText(value, "").split(/\s+/).filter(Boolean);
      const lines: string[] = [];
      let line = "";
      words.forEach((word) => {
        const next = line ? `${line} ${word}` : word;
        if (ctx.measureText(next).width <= maxWidth || !line) {
          line = next;
        } else {
          lines.push(line);
          line = word;
        }
      });
      if (line) lines.push(line);
      ctx.restore();
      if (lines.length > maxLines) {
        const clipped = lines.slice(0, maxLines);
        clipped[maxLines - 1] = `${clipped[maxLines - 1].replace(/…$/, "")}…`;
        return clipped;
      }
      return lines;
    };
    const drawWrappedText = (value: unknown, x: number, y: number, maxWidth: number, font: string, color: string, lineHeight: number, align: CanvasTextAlign = isAr ? "right" : "left", maxLines = 3) => {
      ctx.save();
      setText(font, color, align);
      wrapLines(value, maxWidth, font, maxLines).forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
      ctx.restore();
    };

    const bg = ctx.createLinearGradient(0, 0, 1280, 1280);
    bg.addColorStop(0, "#020617");
    bg.addColorStop(0.52, "#071426");
    bg.addColorStop(1, "#12051f");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1280, 1280);
    const cyanGlow = ctx.createRadialGradient(1020, 130, 20, 1020, 130, 600);
    cyanGlow.addColorStop(0, "rgba(34,211,238,.22)");
    cyanGlow.addColorStop(1, "rgba(34,211,238,0)");
    ctx.fillStyle = cyanGlow; ctx.fillRect(0, 0, 1280, 1280);
    const violetGlow = ctx.createRadialGradient(120, 1060, 20, 120, 1060, 620);
    violetGlow.addColorStop(0, "rgba(168,85,247,.22)");
    violetGlow.addColorStop(1, "rgba(168,85,247,0)");
    ctx.fillStyle = violetGlow; ctx.fillRect(0, 0, 1280, 1280);

    ctx.shadowColor = "rgba(168,85,247,.8)"; ctx.shadowBlur = 18;
    drawRR(24, 24, 1232, 1232, 28, undefined, "rgba(168,85,247,.9)", 3);
    ctx.shadowColor = "rgba(34,211,238,.45)"; ctx.shadowBlur = 12;
    drawRR(42, 42, 1196, 1196, 24, undefined, "rgba(34,211,238,.38)", 2);
    ctx.shadowBlur = 0;

    // Logo, loaded before drawing to avoid clipped/late canvas output.
    try {
      const logo = new Image();
      logo.crossOrigin = "anonymous";
      logo.src = "/assets/brand-logo-tactic-boss.png?v=1314";
      await new Promise((res) => { logo.onload = res; logo.onerror = res; });
      ctx.drawImage(logo, isAr ? 820 : 56, 58, 360, 98);
    } catch {
      drawText("TACTIC BOSS", isAr ? 1180 : 70, 120, 360, `900 42px ${fontFamily}`, "#ffffff", isAr ? "right" : "left", "ltr");
    }

    const badgeX = isAr ? 56 : 890;
    const badgeGrad = ctx.createLinearGradient(badgeX, 58, badgeX + 330, 118);
    badgeGrad.addColorStop(0, "rgba(168,85,247,.32)");
    badgeGrad.addColorStop(1, "rgba(34,211,238,.20)");
    drawRR(badgeX, 58, 330, 64, 14, badgeGrad, "rgba(34,211,238,.65)", 2);
    drawText(uiText("تقرير تكتيكي", "TACTICAL REPORT", "INFORME TÁCTICO", "RAPPORT TACTIQUE"), badgeX + 165, 99, 280, `900 27px ${fontFamily}`, "#ffffff", "center");

    const heroX = isAr ? 1180 : 70;
    drawText(formation, heroX, 300, 520, `900 118px ${fontFamily}`, "#ffffff", isAr ? "right" : "left", "ltr");
    drawText(isAr ? uiText("أسلوب اللعب", "Playstyle") : "PLAYSTYLE", heroX, 372, 520, `900 24px ${fontFamily}`, "#38bdf8", isAr ? "right" : "left");
    drawText(styleTitle, heroX, 426, 560, `900 45px ${fontFamily}`, "#22d3ee", isAr ? "right" : "left");
    drawWrappedText(
      isAr ? uiText("قرار مختصر قابل للتنفيذ بدون زحمة أو نصوص مقطوعة.", "A clean actionable tactic.") : "A clean actionable tactic built for quick decisions.",
      heroX,
      470,
      560,
      `700 24px ${fontFamily}`,
      "#cbd5e1",
      32,
      isAr ? "right" : "left",
      2,
    );

    // Mini pitch with safe global role abbreviations only.
    const px = isAr ? 76 : 650, py = 205, pw = 540, ph = 395;
    const pitchGrad = ctx.createLinearGradient(px, py, px + pw, py + ph);
    pitchGrad.addColorStop(0, "rgba(8,92,78,.75)");
    pitchGrad.addColorStop(1, "rgba(2,6,23,.95)");
    drawRR(px, py, pw, ph, 20, pitchGrad, "rgba(34,211,238,.7)", 2);
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 2;
    ctx.strokeRect(px + 28, py + 24, pw - 56, ph - 48);
    ctx.beginPath(); ctx.moveTo(px + 28, py + ph / 2); ctx.lineTo(px + pw - 28, py + ph / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(px + pw / 2, py + ph / 2, 48, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    (boardPitchPositions.length ? boardPitchPositions : miniPitchPositions(formation)).forEach(([pos, x, y]) => {
      const cx = px + (x / 100) * pw;
      const cy = py + (y / 100) * ph;
      const isGk = pos === "GK";
      const grd = ctx.createRadialGradient(cx - 7, cy - 8, 2, cx, cy, 21);
      grd.addColorStop(0, isGk ? "#67e8f9" : "#ddd6fe");
      grd.addColorStop(1, isGk ? "#0891b2" : "#7c3aed");
      ctx.shadowColor = isGk ? "rgba(34,211,238,.7)" : "rgba(168,85,247,.8)";
      ctx.shadowBlur = 11;
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(cx, cy, 21, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.strokeStyle = "rgba(255,255,255,.68)"; ctx.lineWidth = 2; ctx.stroke();
      drawText(pos, cx, cy + 6, 42, `900 15px Arial`, "#ffffff", "center", "ltr");
    });

    const infoX = isAr ? 650 : 58;
    drawRR(infoX, 540, 555, 126, 18, "rgba(15,23,42,.74)", "rgba(168,85,247,.45)", 1.6);
    const leftCol = infoX + 38;
    const rightCol = infoX + 318;
    if (isAr) {
      drawText(uiText("المستخدم", "User"), infoX + 515, 582, 210, `900 18px ${fontFamily}`, "#94a3b8", "right");
      drawText(userName, infoX + 515, 618, 210, `800 25px ${fontFamily}`, "#ffffff", "right");
      drawText(uiText("الوضع", "Mode"), infoX + 250, 582, 210, `900 18px ${fontFamily}`, "#94a3b8", "right");
      drawText(planType, infoX + 250, 618, 210, `800 25px ${fontFamily}`, "#ffffff", "right");
    } else {
      drawText("USER", leftCol, 582, 210, `900 18px ${fontFamily}`, "#94a3b8", "left");
      drawText(userName, leftCol, 618, 210, `800 25px ${fontFamily}`, "#ffffff", "left");
      drawText("MODE", rightCol, 582, 210, `900 18px ${fontFamily}`, "#94a3b8", "left");
      drawText(planType, rightCol, 618, 210, `800 25px ${fontFamily}`, "#ffffff", "left");
    }

    const statCard = (x:number, y:number, w:number, label:string, value:string, color:string) => {
      drawRR(x, y, w, 138, 18, "rgba(15,23,42,.82)", color, 2);
      drawText(label, isAr ? x + w - 28 : x + 28, y + 42, w - 56, `900 21px ${fontFamily}`, color, isAr ? "right" : "left");
      drawText(value, isAr ? x + w - 28 : x + 28, y + 108, w - 56, `900 58px ${fontFamily}`, "#ffffff", isAr ? "right" : "left", "ltr");
    };
    statCard(isAr ? 350 : 58, 705, 260, uiText("تقييم", "Rating", "Nota", "Note"), `${ratingNumber.toFixed(1)}/10`, "#a855f7");
    statCard(isAr ? 58 : 340, 705, 260, uiText("الثقة", "Confidence", "Confianza", "Confiance"), `${Math.round(confidenceNumber)}%`, "#22d3ee");

    const panel = (x:number, y:number, w:number, h:number, title:string, color:string) => {
      drawRR(x, y, w, h, 18, "rgba(15,23,42,.78)", color, 1.5);
      drawText(title, isAr ? x + w - 26 : x + 26, y + 40, w - 52, `900 23px ${fontFamily}`, color, isAr ? "right" : "left");
    };
    const instructions = [
      ...(actionPlan.direct.match || []),
      ...((actionPlan.direct.attack || []).map(([k, v]) => `${k}: ${v}`)),
    ].map((x) => shortText(x, 54)).filter(Boolean).slice(0, 3);
    const settings = actionPlan.direct.defence.slice(0, 3).map(([k, v]) => `${cleanCardText(k)}: ${cleanCardText(v)}`);
    const indexRows = [
      [uiText("هجوم", "Attack", "Ataque", "Attaque"), 88],
      [uiText("تحولات", "Transitions", "Transiciones", "Transitions"), 90],
      [uiText("دفاع", "Defence", "Defensa", "Défense"), 78],
      [uiText("ثبات", "Stability", "Estabilidad", "Stabilité"), 84],
    ];

    panel(58, 880, 360, 235, uiText("أوامر مختصرة", "Key orders", "Órdenes", "Ordres"), "rgba(168,85,247,.72)");
    instructions.forEach((item, i) => drawWrappedText(`${i + 1}. ${item}`, isAr ? 390 : 86, 940 + i * 52, 295, `800 21px ${fontFamily}`, "#f8fafc", 28, isAr ? "right" : "left", 2));

    panel(460, 880, 360, 235, uiText("أهم الإعدادات", "Key settings", "Ajustes", "Réglages"), "rgba(34,211,238,.72)");
    settings.forEach((item, i) => drawWrappedText(item, isAr ? 792 : 488, 940 + i * 52, 295, `800 21px ${fontFamily}`, "#f8fafc", 28, isAr ? "right" : "left", 2));

    panel(862, 880, 360, 235, uiText("مؤشر الخطة", "Tactic index", "Índice", "Index"), "rgba(168,85,247,.60)");
    indexRows.forEach(([k, v], i) => {
      const x = 900 + (i % 2) * 160;
      const y = 950 + Math.floor(i / 2) * 78;
      drawText(String(k), isAr ? x + 110 : x, y, 130, `800 18px ${fontFamily}`, "#cbd5e1", isAr ? "right" : "left");
      drawText(String(v), isAr ? x + 110 : x, y + 36, 80, `900 36px ${fontFamily}`, i % 2 ? "#22d3ee" : "#a855f7", isAr ? "right" : "left", "ltr");
    });

    drawRR(58, 1155, 1164, 76, 16, "rgba(2,6,23,.92)", "rgba(168,85,247,.45)", 1.5);
    drawText(uiText("شارك خطتك", "SHARE YOUR TACTIC", "COMPARTE TU TÁCTICA", "PARTAGEZ"), isAr ? 1180 : 95, 1202, 340, `900 25px ${fontFamily}`, "#ffffff", isAr ? "right" : "left");
    drawText("★★★★★", 640, 1203, 280, "900 36px Arial", "#a855f7", "center", "ltr");
    drawText("TACTIC BOSS", isAr ? 95 : 1180, 1202, 340, `900 24px ${fontFamily}`, "#e5e7eb", isAr ? "left" : "right", "ltr");

    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.98));
  };

  // Share a generated premium tactic image. Fallback: download the PNG.
  const shareTacticInfo = async () => {
    if (!currentResult) return;
    try {
      const blob = await createProShareCardBlob();
      if (!blob) throw new Error("No card blob");
      const file = new File([blob], `tactic-boss-${currentResult.formation}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({
          title: `Tactic Boss — ${currentResult.formation}`,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
      void awardCompetitionEvent("share_card", { formation: currentResult.formation, game: selectedGame?.name || homeGameId });
      triggerToast(uiText("تم تجهيز كارت المشاركة كصورة.", "Share card image ready.", "Imagen lista.", "Image prête."));
    } catch (error: any) {
      triggerToast(uiText("تعذر إنشاء صورة المشاركة الآن.", "Could not create the share image now.", "No se pudo crear la imagen.", "Impossible de créer l’image."));
    }
  };

  // Upload legacy/local device data to the authenticated Supabase account.
  const handleCloudSync = async () => {
    const sb = getSupabase();
    if (!sb || !session?.user) {
      triggerToast(
        uiText(
          "سجّل دخولك أولًا.",
          "Sign in first.",
          "Inicia sesión primero.",
          "Connectez-vous d’abord.",
        ),
      );
      return;
    }
    try {
      const legacyTactics = JSON.parse(
        localStorage.getItem("tb_tactics") || "[]",
      );
      const legacyRivals = JSON.parse(
        localStorage.getItem("tb_rivals") || "[]",
      );
      const localTactics: SavedTactic[] = [
        ...savedTactics,
        ...legacyTactics,
      ].filter(
        (v, i, a) =>
          a.findIndex((x) => x.title === v.title && x.game === v.game) === i,
      );
      const localRivals: Rival[] = [...rivals, ...legacyRivals].filter(
        (v, i, a) =>
          a.findIndex(
            (x) => x.name === v.name && x.favoriteGame === v.favoriteGame,
          ) === i,
      );

      for (const tactic of localTactics) {
        const { count } = await sb
          .from("saved_tactics")
          .select("id", { count: "exact", head: true })
          .eq("user_id", session.user.id)
          .eq("title", tactic.title);
        if (!count)
          await sb.from("saved_tactics").insert({
            user_id: session.user.id,
            title: tactic.title,
            game: tactic.game,
            user_formation: tactic.myFormation,
            opponent_formation: tactic.oppFormation,
            user_style: tactic.myStyle,
            opponent_style: tactic.opponentStyle,
            match_state: tactic.matchState,
            team: tactic.myTeam || "فريقك",
            opponent_team: tactic.oppTeam || "الخصم",
            input_data: { notes: tactic.notes, board: tactic.board || null },
            result_data: tactic.result,
          });
      }
      for (const rival of localRivals) {
        const { count } = await sb
          .from("rivals")
          .select("id", { count: "exact", head: true })
          .eq("user_id", session.user.id)
          .eq("name", rival.name);
        if (!count)
          await sb.from("rivals").insert({
            user_id: session.user.id,
            name: rival.name,
            favorite_game: rival.favoriteGame,
            favorite_formation: rival.favoriteFormation,
            playstyle: rival.playstyle,
            strengths: rival.strengths,
            weaknesses: rival.weaknesses,
            notes: rival.notes,
            favorite_team: rival.favoriteTeam || null,
            board_data: rival.board || null,
          });
      }
      await loadSupabaseData(session);
      triggerToast(
        uiText(
          "تمت مزامنة بياناتك.",
          "Your data was synchronized.",
          "Tus datos se sincronizaron.",
          "Vos données ont été synchronisées.",
        ),
      );
    } catch (error: any) {
      console.warn("Cloud sync error:", error);
      triggerToast(
        uiText(
          "تعذر مزامنة بعض البيانات.",
          "Some data could not be synchronized.",
          "Algunos datos no se pudieron sincronizar.",
          "Certaines données n’ont pas pu être synchronisées.",
        ),
      );
    }
  };

  const handleRequestAccountDeletion = () => {
    if (!session?.user) return;
    setPendingConfirm({
      title: uiText(
        "طلب حذف الحساب",
        "Request account deletion",
        "Solicitar eliminación de cuenta",
        "Demander la suppression du compte",
      ),
      message: uiText(
        "سيتم إرسال طلب لحذف حسابك وكل بياناتك، ثم سيتم تسجيل خروجك.",
        "A request to delete your account and data will be sent, then you will be signed out.",
        "Se enviará una solicitud para eliminar tu cuenta y tus datos.",
        "Une demande de suppression de votre compte et de vos données sera envoyée.",
      ),
      confirmLabel: uiText(
        "إرسال الطلب",
        "Send request",
        "Enviar solicitud",
        "Envoyer la demande",
      ),
      action: async () => {
        const sb = getSupabase();
        if (!sb) {
          triggerToast(
            uiText(
              "تعذر إرسال الطلب الآن.",
              "Could not send the request now.",
              "No se pudo enviar la solicitud.",
              "Impossible d’envoyer la demande.",
            ),
          );
          return;
        }
        const { error } = await sb.rpc("request_account_deletion");
        if (error) {
          triggerToast(
            uiText(
              "تعذر إرسال طلب الحذف.",
              "Could not send the deletion request.",
              "No se pudo enviar la solicitud.",
              "Impossible d’envoyer la demande.",
            ),
          );
          return;
        }
        triggerToast(
          uiText(
            "تم استلام طلب حذف الحساب.",
            "Your account deletion request was received.",
            "Se recibió tu solicitud.",
            "Votre demande a été reçue.",
          ),
        );
        await sb.auth.signOut();
        setSession(null);
        clearUserState();
      },
    });
  };

  // Coordinate mapper helper for Pitch Formation Visualizer
  const getCoordinatesForFormation = (formationStr: string) => {
    const cleanForm = formationStr.replace(/\s+/g, "").split("-")[0] || "433";

    // Default 4-3-3 positions
    let positions = [
      { role: "GK", top: "88%", left: "50%" },
      { role: "CB1", top: "74%", left: "35%" },
      { role: "CB2", top: "74%", left: "65%" },
      { role: "LB", top: "68%", left: "15%" },
      { role: "RB", top: "68%", left: "85%" },
      { role: "DMF", top: "50%", left: "50%" },
      { role: "CM1", top: "42%", left: "30%" },
      { role: "CM2", top: "42%", left: "70%" },
      { role: "LW", top: "20%", left: "15%" },
      { role: "RW", top: "20%", left: "85%" },
      { role: "ST", top: "15%", left: "50%" },
    ];

    if (formationStr.includes("4-2-3-1")) {
      positions = [
        { role: "GK", top: "88%", left: "50%" },
        { role: "CB1", top: "74%", left: "35%" },
        { role: "CB2", top: "74%", left: "65%" },
        { role: "LB", top: "68%", left: "15%" },
        { role: "RB", top: "68%", left: "85%" },
        { role: "LDM", top: "56%", left: "35%" },
        { role: "RDM", top: "56%", left: "65%" },
        { role: "LM", top: "35%", left: "15%" },
        { role: "RM", top: "35%", left: "85%" },
        { role: "AM", top: "32%", left: "50%" },
        { role: "ST", top: "15%", left: "50%" },
      ];
    } else if (formationStr.includes("4-4-2")) {
      positions = [
        { role: "GK", top: "88%", left: "50%" },
        { role: "CB1", top: "74%", left: "35%" },
        { role: "CB2", top: "74%", left: "65%" },
        { role: "LB", top: "68%", left: "15%" },
        { role: "RB", top: "68%", left: "85%" },
        { role: "LCM", top: "48%", left: "35%" },
        { role: "RCM", top: "48%", left: "65%" },
        { role: "LM", top: "38%", left: "15%" },
        { role: "RM", top: "38%", left: "85%" },
        { role: "ST1", top: "18%", left: "35%" },
        { role: "ST2", top: "18%", left: "65%" },
      ];
    } else if (formationStr.includes("3-5-2") || formationStr.includes("352")) {
      positions = [
        { role: "GK", top: "88%", left: "50%" },
        { role: "CB1", top: "74%", left: "30%" },
        { role: "CB", top: "76%", left: "50%" },
        { role: "CB2", top: "74%", left: "70%" },
        { role: "LDM", top: "52%", left: "35%" },
        { role: "RDM", top: "52%", left: "65%" },
        { role: "LM", top: "44%", left: "12%" },
        { role: "RM", top: "44%", left: "88%" },
        { role: "CAM", top: "34%", left: "50%" },
        { role: "ST1", top: "18%", left: "35%" },
        { role: "ST2", top: "18%", left: "65%" },
      ];
    } else if (formationStr.includes("5-3-2")) {
      positions = [
        { role: "GK", top: "88%", left: "50%" },
        { role: "CB1", top: "74%", left: "35%" },
        { role: "CB2", top: "75%", left: "50%" },
        { role: "CB3", top: "74%", left: "65%" },
        { role: "LWB", top: "64%", left: "12%" },
        { role: "RWB", top: "64%", left: "88%" },
        { role: "LCM", top: "46%", left: "33%" },
        { role: "RCM", top: "46%", left: "67%" },
        { role: "AM", top: "33%", left: "50%" },
        { role: "ST1", top: "18%", left: "35%" },
        { role: "ST2", top: "18%", left: "65%" },
      ];
    } else if (formationStr.includes("4-2-4") || formationStr.includes("424")) {
      positions = [
        { role: "GK", top: "88%", left: "50%" },
        { role: "CB1", top: "74%", left: "35%" },
        { role: "CB2", top: "74%", left: "65%" },
        { role: "LB", top: "68%", left: "15%" },
        { role: "RB", top: "68%", left: "85%" },
        { role: "LCM", top: "48%", left: "35%" },
        { role: "RCM", top: "48%", left: "65%" },
        { role: "LW", top: "22%", left: "15%" },
        { role: "RW", top: "22%", left: "85%" },
        { role: "ST1", top: "16%", left: "35%" },
        { role: "ST2", top: "16%", left: "65%" },
      ];
    }
    return positions;
  };


  const managerStorageKey = () =>
    session?.user?.id
      ? scopedKey("manager_leagues_v106", session.user.id)
      : "tb_manager_leagues_v106:guest";

  const persistManagerLeagues = (next: ManagerLeague[]) => {
    setManagerLeagues(next);
    localStorage.setItem(managerStorageKey(), JSON.stringify(next));
  };

  const currentLeagueGame = () =>
    GAMES_LIST.find((game) => game.id === homeGameId) || GAMES_LIST[0];

  const resetManagerPlanForGame = (gameId = homeGameId) => {
    const game = GAMES_LIST.find((item) => item.id === gameId) || currentLeagueGame();
    const dna = getGameDnaProfile(game.id, game.name);
    setManagerPlan({
      formation: dna.formations[0] || "4-2-3-1",
      playstyle: dna.playstyles[0]?.value || "Quick Counter",
      defensiveMode: dna.defensiveModes[0]?.value || "Mid block",
      focus: dna.tacticalFocus[0]?.value || "Protect AMF lane",
      advancedInstruction: "",
    });
  };

  const syncManagerLeagueCreateBestEffort = async (league: ManagerLeague) => {
    const sb = getSupabase();
    if (!sb || !session?.user?.id) return;
    try {
      await sb.from("manager_leagues").upsert(
        {
          id: league.id,
          created_by: session.user.id,
          game_key: league.gameId,
          game_name: league.gameName,
          name: league.name,
          join_code: league.joinCode,
          league_type: league.type,
          status: league.status,
          max_members: league.maxMembers,
          season_days: league.seasonDays,
          round_frequency_hours: league.roundFrequencyHours,
          league_data: league,
        },
        { onConflict: "id" },
      );
      const me = league.members.find((member) => member.id === (session.user.id || "me")) || league.members[0];
      await sb.from("manager_league_members").upsert(
        {
          league_id: league.id,
          user_id: session.user.id,
          game_key: league.gameId,
          coach_name: coachName || "Tactic Boss",
          is_ai: false,
          points: me?.points || 0,
          played: me?.played || 0,
          wins: me?.wins || 0,
          draws: me?.draws || 0,
          losses: me?.losses || 0,
          goals_for: me?.goalsFor || 0,
          goals_against: me?.goalsAgainst || 0,
        },
        { onConflict: "league_id,user_id" },
      );
    } catch (error) {
      console.warn("Manager league cloud sync skipped:", error);
    }
  };

  const syncManagerLeagueMemberBestEffort = async (league: ManagerLeague) => {
    const sb = getSupabase();
    if (!sb || !session?.user?.id) return;
    try {
      const me = league.members.find((member) => member.id === session.user.id);
      if (!me) return;
      await sb.from("manager_league_members").upsert(
        {
          league_id: league.id,
          user_id: session.user.id,
          game_key: league.gameId,
          coach_name: coachName || "Tactic Boss",
          is_ai: false,
          points: me.points,
          played: me.played,
          wins: me.wins,
          draws: me.draws,
          losses: me.losses,
          goals_for: me.goalsFor,
          goals_against: me.goalsAgainst,
        },
        { onConflict: "league_id,user_id" },
      );
    } catch (error) {
      console.warn("Manager member cloud sync skipped:", error);
    }
  };

  const createPrivateManagerLeague = async () => {
    const game = currentLeagueGame();
    const league = createManagerLeague({
      game,
      coachName,
      userId: session?.user?.id || "me",
      lang,
      name: sanitizeUserText(managerCreateForm.name, 60) || uiText("دوري الصحاب", "Friends League", "Liga privada", "Ligue privée"),
      type: "private",
      maxMembers: Number(managerCreateForm.maxMembers) || 4,
      seasonDays: Number(managerCreateForm.seasonDays) || 3,
      roundFrequencyHours: Number(managerCreateForm.roundFrequencyHours) || 24,
    });
    const next = [league, ...managerLeagues.filter((item) => item.id !== league.id)];
    persistManagerLeagues(next);
    setActiveManagerLeagueId(league.id);
    setManagerMode("hub");
    resetManagerPlanForGame(game.id);
    void syncManagerLeagueCreateBestEffort(league);
    triggerToast(uiText(`تم إنشاء الدوري. الكود: ${league.joinCode}`, `League created. Code: ${league.joinCode}`, `Código: ${league.joinCode}`, `Code : ${league.joinCode}`));
  };

  const joinManagerLeagueByCode = async () => {
    const code = managerJoinCode.trim().toUpperCase();
    if (!code) {
      triggerToast(uiText("اكتب كود الدوري أولًا.", "Enter the league code first.", "Introduce el código.", "Saisissez le code."));
      return;
    }
    const game = currentLeagueGame();
    const localLeague = managerLeagues.find((league) => league.joinCode.toUpperCase() === code);
    if (localLeague) {
      const message = gameSeparatedLeagueMessage(localLeague, game, lang);
      if (message) {
        triggerToast(message);
        return;
      }
      setActiveManagerLeagueId(localLeague.id);
      setManagerMode("hub");
      triggerToast(uiText("أنت داخل هذا الدوري بالفعل.", "You are already in this league.", "Ya estás dentro.", "Vous êtes déjà dedans."));
      return;
    }

    const sb = getSupabase();
    if (sb && session?.user?.id) {
      try {
        const { data, error } = await sb
          .from("manager_leagues")
          .select("*")
          .eq("join_code", code)
          .maybeSingle();
        if (!error && data) {
          const league = data.league_data as ManagerLeague;
          if (league.gameId !== game.id) {
            triggerToast(gameSeparatedLeagueMessage(league, game, lang));
            return;
          }
          const already = league.members.some((member) => member.id === session.user.id);
          const currentMember = {
            id: session.user.id,
            userId: session.user.id,
            name: coachName || "Tactic Boss",
            points: 0,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            badge: getGameDnaProfile(game.id, game.name).badge,
          };
          const joinedLeague = already || league.members.length >= league.maxMembers
            ? league
            : { ...league, members: [currentMember, ...league.members].slice(0, league.maxMembers) };
          const next = [joinedLeague, ...managerLeagues.filter((item) => item.id !== joinedLeague.id)];
          persistManagerLeagues(next);
          setActiveManagerLeagueId(joinedLeague.id);
          setManagerMode("hub");
          await syncManagerLeagueMemberBestEffort(joinedLeague);
          triggerToast(uiText("تم الانضمام للدوري.", "Joined league.", "Unido.", "Rejoint."));
          return;
        }
      } catch (error) {
        console.warn("Join cloud league failed:", error);
      }
    }

    triggerToast(uiText("لم يتم العثور على دوري بهذا الكود. تأكد من كتابته بشكل صحيح ثم حاول مرة أخرى.", "No league was found with this code. Check it and try again.", "No se encontró la liga.", "Aucune ligue trouvée."));
  };

  const copyManagerLeagueCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      triggerToast(uiText("تم نسخ كود الدوري.", "League code copied.", "Código copiado.", "Code copié."));
    } catch {
      triggerToast(code);
    }
  };

  const submitManagerLeaguePlan = async () => {
    const game = currentLeagueGame();
    const league = managerLeagues.find((item) => item.id === activeManagerLeagueId) || managerLeagues.find((item) => item.gameId === game.id);
    if (!league) {
      triggerToast(uiText("أنشئ دوري أو ادخل بكود أولًا.", "Create or join a league first.", "Crea o entra en una liga.", "Créez ou rejoignez une ligue."));
      return;
    }
    const gameMismatch = gameSeparatedLeagueMessage(league, game, lang);
    if (gameMismatch) {
      triggerToast(gameMismatch);
      return;
    }
    const report = evaluateManagerLeaguePlan(game, managerPlan, lang);
    const updated = applyManagerResult(league, session?.user?.id || "me", report);
    const next = managerLeagues.map((item) => item.id === updated.id ? updated : item);
    persistManagerLeagues(next);
    setActiveManagerLeagueId(updated.id);
    setManagerLastReport(report);
    setManagerMode("result");
    void syncManagerLeagueMemberBestEffort(updated);
    const nextProgress = { ...progression, xp: progression.xp + report.xp };
    persistProgression(nextProgress);
    void awardCompetitionEvent("daily_challenge", { source: "manager_league", game: game.name, score: report.score, result: report.result });
  };

  if (!authReady) {
    return (
      <div
        className="min-h-screen bg-[#05080e] text-white grid place-items-center"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <div className="text-center space-y-4">
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-300/20 bg-cyan-400/5 shadow-[0_0_45px_rgba(34,211,238,0.16)]">
            <div className="absolute inset-[-6px] rounded-[1.8rem] border-2 border-transparent border-t-cyan-300 border-r-violet-400 animate-spin" />
            <img src="/assets/icon-192.png?v=1314" alt="Tactic Boss" className="h-14 w-14 object-contain" />
          </div>
          <p className="text-sm font-bold text-slate-300">
            {uiText(
              "جاري تجهيز حسابك...",
              "Preparing your account...",
              "Preparando tu cuenta...",
              "Préparation de votre compte...",
            )}
          </p>
        </div>
      </div>
    );
  }

  if (passwordRecoveryMode && session) {
    return (
      <div className="min-h-screen bg-[#050b14] p-4 text-white grid place-items-center" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="w-full max-w-sm rounded-[2rem] border border-cyan-300/15 bg-slate-950/90 p-6 shadow-2xl shadow-cyan-950/20">
          <div className="mb-6 text-center">
            <img src="/assets/brand-logo-tactic-boss.png?v=1314" alt="Tactic Boss" className="mx-auto h-14 max-w-[220px] object-contain" />
            <h1 className="mt-5 text-xl font-black">{uiText("تعيين كلمة مرور جديدة", "Set a new password")}</h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{uiText("اكتب كلمة مرور قوية لحماية خططك وحسابك.", "Choose a strong password to protect your account and tactics.")}</p>
          </div>
          <div className="space-y-3">
            <input type="password" autoComplete="new-password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} placeholder={uiText("كلمة المرور الجديدة", "New password")} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-cyan-400" />
            <input type="password" autoComplete="new-password" value={confirmNewPassword} onChange={(e)=>setConfirmNewPassword(e.target.value)} placeholder={uiText("تأكيد كلمة المرور", "Confirm password")} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-cyan-400" />
            {passwordRecoveryMessage && <p className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-[11px] text-amber-100">{passwordRecoveryMessage}</p>}
            <button type="button" disabled={passwordRecoveryLoading} onClick={completePasswordRecovery} className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-3.5 text-sm font-black text-slate-950 disabled:opacity-60">{passwordRecoveryLoading ? uiText("جارٍ الحفظ...", "Saving...") : uiText("حفظ كلمة المرور", "Save password")}</button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <AuthScreen
        onAuthSuccess={(activeSession) => {
          setSession(activeSession);
          loadSupabaseData(activeSession);
        }}
        lang={lang}
      />
    );
  }


  const getLoadingCopy = () => {
    if (generatorMode === "build") {
      return {
        title: uiText("المحرك التكتيكي يبني خطتك...", "Building your tactic...", "Creando tu táctica...", "Création de votre tactique..."),
        steps: [
          uiText("✓ تحليل أسلوب لعبك...", "✓ Analyzing your playstyle...", "✓ Analizando tu estilo...", "✓ Analyse de votre style..."),
          uiText("✓ اختيار التشكيلة الأنسب...", "✓ Selecting the best formation...", "✓ Eligiendo la formación...", "✓ Choix de la meilleure formation..."),
          uiText("✓ تجهيز تعليمات اللاعبين...", "✓ Preparing player instructions...", "✓ Preparando instrucciones...", "✓ Préparation des consignes..."),
          uiText("⚽ الخطة جاهزة!", "⚽ Tactic ready!", "⚽ ¡Táctica lista!", "⚽ Tactique prête !"),
        ],
      };
    }
    return {
      title: uiText("المحرك التكتيكي يقرأ خصمك...", "Reading your rival...", "Analizando al rival...", "Analyse de l’adversaire..."),
      steps: [
        uiText("✓ تحليل أسلوب الخصم...", "✓ Analyzing rival playstyle...", "✓ Analizando al rival...", "✓ Analyse du style adverse..."),
        uiText("✓ اختيار الخطة المضادة...", "✓ Selecting the counter plan...", "✓ Eligiendo el plan de contra...", "✓ Choix du plan de contre..."),
        uiText("✓ تجهيز تعليمات اللاعبين...", "✓ Preparing player instructions...", "✓ Preparando instrucciones...", "✓ Préparation des consignes..."),
        uiText("⚽ الخطة جاهزة!", "⚽ Tactic ready!", "⚽ ¡Táctica lista!", "⚽ Tactique prête !"),
      ],
    };
  };

  const loadingCopy = getLoadingCopy();

  const activeHomeGame = GAMES_LIST.find((g) => g.id === homeGameId) || GAMES_LIST[0];

  return (
    <div
      className={`${theme} tb-v130-shell min-h-screen text-[var(--text-main)] transition-colors duration-300 relative overflow-x-hidden pb-32 font-sans`}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {!isOnline && (
        <div
          className="fixed top-2 left-1/2 -translate-x-1/2 z-[80] w-[calc(100%-2rem)] max-w-md rounded-2xl border border-amber-500/30 bg-amber-950/95 px-4 py-3 text-center text-xs font-bold text-amber-200 shadow-2xl"
          role="status"
        >
          {uiText(
            "أنت غير متصل بالإنترنت. يمكنك مشاهدة بياناتك المحفوظة، لكن الحفظ والتوليد يحتاجان اتصالًا.",
            "You are offline. Saved data remains available, but saving and generation need a connection.",
            "Estás sin conexión. Puedes ver tus datos guardados, pero guardar y generar requiere conexión.",
            "Vous êtes hors ligne. Les données enregistrées restent visibles, mais la sauvegarde et la génération nécessitent une connexion.",
          )}
        </div>
      )}
      {/* Dynamic Background Overlays of the chosen soccer game atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-gradient-from)] via-[var(--bg-primary)] to-[var(--bg-gradient-to)] pointer-events-none z-0" />

      {/* Interactive Floating Stadium Grid & Ambient Floodlight effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-[radial-gradient(ellipse_at_top,_var(--accent-glow),transparent_65%)] pointer-events-none z-0" />
      <div className="absolute top-20 left-10 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Global Interactive Header */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-4 sm:max-w-lg md:max-w-xl">
        {/* Compact utility ribbon only outside Home. Home has its own calm command header. */}
        {screen !== "home" && (
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/5 text-xs text-slate-400">
            <label className="relative flex-1 max-w-[230px]">
              <Gamepad2
                size={13}
                className="absolute top-1/2 -translate-y-1/2 right-2 text-emerald-400 pointer-events-none"
              />
              <select
                aria-label={uiText(
                  "اللعبة الحالية",
                  "Current game",
                  "Elegir juego",
                  "Choisir le jeu",
                )}
                value={homeGameId}
                onChange={(e) => {
                  setPreferredGame(e.target.value);
                }}
                className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl pr-7 pl-7 py-2 text-[10px] text-slate-200 outline-none focus:border-emerald-500"
              >
                {GAMES_LIST.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute top-1/2 -translate-y-1/2 left-2 text-slate-500 pointer-events-none"
              />
            </label>
            <div className="flex items-center gap-2">
              <label className="relative">
                <Languages
                  size={13}
                  className="absolute top-1/2 -translate-y-1/2 right-2 text-violet-400 pointer-events-none"
                />
                <select
                  aria-label="Language"
                  value={lang}
                  onChange={(e) => changeLang(e.target.value as SupportedLang)}
                  className="appearance-none bg-white/5 border border-white/10 rounded-xl pr-7 pl-6 py-2 text-[10px] text-slate-200 outline-none focus:border-violet-500"
                >
                  {(Object.keys(countryFlags) as SupportedLang[]).map((l) => (
                    <option key={l} value={l}>
                      {countryFlags[l].flag} {l.toUpperCase()}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={11}
                  className="absolute top-1/2 -translate-y-1/2 left-2 text-slate-500 pointer-events-none"
                />
              </label>
              <button
                type="button"
                onClick={() => setScreen("subs")}
                className="bg-gradient-to-r from-amber-500/15 to-yellow-600/15 border border-amber-500/40 px-2.5 py-1.5 rounded-lg text-amber-300 font-black uppercase text-[8px] tracking-wider hover:bg-amber-500/20 transition"
              >
                {subscription.plan === "free"
                  ? uiText("ترقية", "Upgrade", "Mejorar", "Upgrade")
                  : subscription.plan.toUpperCase()}
              </button>
            </div>
          </div>
        )}

        {/* Screen Title Banner (If Not Home Screen) */}
        {screen !== "home" && (
          <div className="flex items-center justify-between py-3 px-4 glass-panel rounded-2xl mb-4 sticky top-1 z-30">
            <button
              onClick={() => {
                if (screen === "result") {
                  setScreen("generator");
                  setStep(3);
                } else if (screen === "generator" && step > 1) {
                  prevStep();
                } else {
                  setScreen("home");
                }
              }}
              className="p-1 px-3 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl transition flex items-center gap-1 text-xs"
              id="back-button"
            >
              <ChevronRight
                size={15}
                className={lang === "ar" ? "" : "rotate-180"}
              />
              <span>{t.backBtn}</span>
            </button>

            <div className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-indigo-100">
              {screen === "select-game" && t.chooseGameHeader}
              {screen === "generator" && `${generatorMode === "build" ? uiText("مدربك التكتيكي", "Your Tactical Coach", "Tu entrenador táctico", "Votre coach tactique") : generatorMode === "counter" ? uiText("اضرب خصمك", "Counter Your Rival", "Contrarresta a tu rival", "Contrez votre adversaire") : t.inputsHeader} (${step}/4)`}
              {screen === "result" && t.resultsHeader}
              {screen === "library" && t.libraryTitle}
              {screen === "rivals" && t.rivalsTitle}
              {screen === "subs" && t.pricingTitle}
              {screen === "settings" && t.settingsTitle}
              {screen === "meta-center" && uiText("مركز الميتا", "Meta Center", "Centro meta", "Centre méta")}
              {screen === "progression" &&
                uiText(
                  "التقدم والتحديات",
                  "Progress & Challenges",
                  "Progreso y desafíos",
                  "Progression et défis",
                )}
              
              {screen === "manual-builder" && uiText("ابنِ خطتك", "Build Your Tactic", "Construir táctica", "Construire la tactique")}
              {screen === "community" &&
                uiText(
                  "خطط المجتمع",
                  "Community Tactics",
                  "Tácticas de la comunidad",
                  "Tactiques communautaires",
                )}
            </div>

            <button
              type="button"
              onClick={() => setScreen("home")}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/15 bg-slate-950/70 p-1.5 shadow-[0_0_18px_rgba(34,211,238,0.12)]"
              aria-label={uiText("العودة للرئيسية", "Back to home", "Volver al inicio", "Retour à l’accueil")}
            >
              <img src="/assets/icon-192.png?v=1314" alt="Tactic Boss" className="h-full w-full object-contain" />
            </button>
          </div>
        )}

        {/* PROGRESSIVE FULL LOADING PAGE */}
        {isLoading && (
          <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center p-6 text-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Branded loading mark */}
            <div className="relative mb-8 flex h-28 w-28 items-center justify-center">
              <div className="absolute inset-0 rounded-[2rem] border border-cyan-300/20 bg-cyan-400/5 shadow-[0_0_55px_rgba(34,211,238,0.18)]" />
              <div className="absolute inset-[-8px] rounded-[2.3rem] border-2 border-transparent border-t-cyan-300/80 border-r-violet-400/70 animate-spin" />
              <img
                src="/assets/icon-192.png?v=1314"
                alt="Tactic Boss"
                className="relative z-10 h-20 w-20 object-contain drop-shadow-[0_0_22px_rgba(34,211,238,0.3)]"
              />
            </div>

            <div className="space-y-4 max-w-sm">
              <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-indigo-100 to-emerald-300">
                {loadingCopy.title}
              </h2>

              <div className="space-y-2 py-4">
                {/* Loader status progressive state updates */}
                <div
                  className={`text-xs transition-all duration-300 ${loadingStep >= 1 ? "text-emerald-400 font-semibold" : "text-slate-500"}`}
                >
                  {loadingCopy.steps[0]}
                </div>
                <div
                  className={`text-xs transition-all duration-300 ${loadingStep >= 2 ? "text-emerald-400 font-semibold" : "text-slate-500"}`}
                >
                  {loadingCopy.steps[1]}
                </div>
                <div
                  className={`text-xs transition-all duration-300 ${loadingStep >= 3 ? "text-emerald-400 font-semibold" : "text-slate-500"}`}
                >
                  {loadingCopy.steps[2]}
                </div>
                <div
                  className={`text-xs transition-all duration-300 ${loadingStep >= 4 ? "text-yellow-400 font-extrabold animate-pulse" : "text-slate-500"}`}
                >
                  {loadingCopy.steps[3]}
                </div>
              </div>

              {/* Fake progress bar */}
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${(loadingStep / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* TOAST SYSTEM POPUP */}
        {toastMessage && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 border-2 border-violet-500 hover:border-violet-400 p-3 px-5 rounded-2xl shadow-2xl z-[999] select-none text-xs text-white font-semibold flex items-center gap-2 animate-bounce">
            <Zap
              size={14}
              className="text-yellow-400 animate-pulse animate-spin"
            />
            <span>{toastMessage}</span>
          </div>
        )}


        {/* ======================================================= */}
        {/* 1. HOME SCREEN SECTION */}
        {/* ======================================================= */}

        {screen === "home" && (
          <div className="space-y-4 pt-3 pb-24 animate-fade-in">
            <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.16),transparent_35%),linear-gradient(145deg,rgba(15,23,42,.96),rgba(2,6,23,.98))] p-5 shadow-2xl shadow-cyan-950/20">
              <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="min-w-0 text-right">
                  <img src="/assets/brand-logo-tactic-boss.png?v=1314" alt="Tactic Boss" className="h-12 max-w-[190px] object-contain object-right drop-shadow-[0_0_18px_rgba(34,211,238,.24)]" />
                  <h1 className="mt-4 text-xl font-black text-white">{uiText(`أهلاً ${coachName || "Coach"}`, `Welcome ${coachName || "Coach"}`, `Hola ${coachName || "Coach"}`, `Bonjour ${coachName || "Coach"}`)}</h1>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{uiText("اختَر أداتك وابدأ فورًا؛ كل لعبة تحتفظ بإعداداتها التكتيكية الحقيقية.", "Choose a tool and start instantly; every game keeps its authentic tactical settings.", "Elige una herramienta.", "Choisissez un outil.")}</p>
                </div>
                <button type="button" onClick={() => setScreen("subs")} className="shrink-0 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-[10px] font-black text-amber-100">{subscription.plan === "free" ? uiText("مجاني", "FREE", "GRATIS", "GRATUIT") : subscription.plan.toUpperCase()}</button>
              </div>
            </section>

            <button onClick={startBuildMyTactic} className="group relative w-full overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-gradient-to-l from-cyan-500/15 via-blue-500/10 to-slate-950/80 p-5 text-right shadow-xl shadow-cyan-950/10 transition hover:border-cyan-300/35">
              <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10"><Brain size={27} className="text-cyan-100" /></div>
                <div className="flex-1">
                  <div className="text-[10px] font-black tracking-[.18em] text-cyan-300">{uiText("المدرب التكتيكي", "TACTICAL COACH", "ENTRENADOR TÁCTICO", "COACH TACTIQUE")}</div>
                  <h2 className="mt-1 text-lg font-black text-white">{uiText("مدربك التكتيكي", "Your Tactical Coach", "Tu entrenador táctico", "Votre coach tactique")}</h2>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{uiText("مولد تكتيكي مضبوط تلقائيًا على لعبتك الحالية؛ حدّد هدفك وسيجهّز لك خطة قابلة للتنفيذ.", "A tactical generator automatically set to your current game; choose your goal and receive an actionable tactic.", "Generador táctico adaptado a tu juego.", "Générateur tactique adapté à votre jeu.")}</p>
                </div>
                <ChevronLeft size={19} className="text-cyan-200" />
              </div>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={startCounterOpponent} className="rounded-3xl border border-violet-300/20 bg-white/[0.04] p-4 text-right transition hover:bg-violet-400/[0.08]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-400/10"><Sword size={23} className="text-violet-100" /></div>
                <h3 className="text-base font-black text-white">{uiText("اضرب خصمك", "Counter Your Rival", "Contrarresta a tu rival", "Contrez votre adversaire")}</h3>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{uiText("حلّل تشكيله وأسلوبه وابنِ الخطة المضادة.", "Analyze the rival and build the counter plan.", "Analiza al rival.", "Analysez l’adversaire.")}</p>
              </button>
              <button onClick={startManualBuilder} className="rounded-3xl border border-emerald-300/20 bg-white/[0.04] p-4 text-right transition hover:bg-emerald-400/[0.08]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10"><SlidersHorizontal size={23} className="text-emerald-100" /></div>
                <h3 className="text-base font-black text-white">{uiText("ابنِ خطتك", "Build Your Tactic", "Construye tu táctica", "Construisez votre tactique")}</h3>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{uiText("تحكّم في الإعدادات الفعلية لكل إصدار.", "Control the real settings for every edition.", "Ajustes reales.", "Réglages réels.")}</p>
              </button>
              <button onClick={() => setScreen("meta-center")} className="rounded-3xl border border-rose-300/15 bg-white/[0.035] p-4 text-right transition hover:bg-rose-400/[0.07]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-300/20 bg-rose-400/10"><Target size={23} className="text-rose-100" /></div>
                <h3 className="text-base font-black text-white">{uiText("الميتا", "Meta Center", "Meta", "Méta")}</h3>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{uiText("أحدث الاتجاهات ونقاط القوة والردود المناسبة.", "Current trends, strengths and counters.", "Tendencias actuales.", "Tendances actuelles.")}</p>
              </button>
              <button onClick={() => setScreen("community")} className="rounded-3xl border border-sky-300/15 bg-white/[0.035] p-4 text-right transition hover:bg-sky-400/[0.07]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/10"><Users size={23} className="text-sky-100" /></div>
                <h3 className="text-base font-black text-white">{uiText("المجتمع", "Community", "Comunidad", "Communauté")}</h3>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{uiText("استكشف خطط المدربين واحفظ ما يناسبك.", "Explore coach tactics and save what fits you.", "Explora tácticas.", "Explorez les tactiques.")}</p>
              </button>
            </div>


          </div>
        )}


{screen === "manual-builder" && (() => {
          const game = GAMES_LIST.find((g) => g.id === manualPlan.gameId) || GAMES_LIST[0];
          const cfg = manualConfigForGame(game.id);
          const board = buildGameAwareBoard(game.id, manualPlan.formation, "4-2-3-1");
          const selectClass = "w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-xs text-white outline-none focus:border-emerald-400";
          const Field = ({ label, value, options, onChange }: { label: string; value: string; options: string[][]; onChange: (value: string) => void }) => (
            <label className="space-y-1.5"><span className="text-[10px] font-black text-slate-400">{label}</span><select className={selectClass} value={value} onChange={(e) => onChange(e.target.value)}>{options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          );
          return <div className="space-y-4 pb-16 animate-fade-in">
            <section className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/35 to-slate-950/85 p-5">
              <div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-black tracking-[.2em] text-emerald-300">{uiText("مختبر الخطط", "TACTIC LAB", "LABORATORIO TÁCTICO", "LABORATOIRE TACTIQUE")}</div><h2 className="mt-2 text-xl font-black text-white">{uiText("ابنِ خطتك", "Build Your Tactic", "Construye tu táctica", "Construisez votre tactique")}</h2><p className="mt-1 text-[11px] leading-relaxed text-slate-400">{uiText("اختيارات كل لعبة مستقلة. لا توجد مصطلحات eFootball داخل PES، ولا إعدادات PES داخل EA FC.", "Each game has its own settings. No cross-game tactical terms.", "Cada juego tiene sus ajustes.", "Chaque jeu garde ses réglages.")}</p></div><Wrench className="text-emerald-300" size={24}/></div>
            </section>
            <div className="flex flex-wrap gap-2 rounded-2xl border border-white/7 bg-slate-950/45 p-3 text-[9px] font-black">
              <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-2.5 py-1 text-cyan-100">{uiText("إعداد موجود داخل اللعبة", "In-game setting", "Ajuste del juego", "Réglage du jeu")}</span>
              <span className="rounded-full border border-amber-300/15 bg-amber-400/10 px-2.5 py-1 text-amber-100">{uiText("توصية تكتيكية من المدرب", "Coach recommendation", "Recomendación del coach", "Recommandation du coach")}</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/5 p-3 text-[10px] leading-relaxed text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-black text-emerald-100">{uiText("اللعبة الحالية", "Current game", "Juego actual", "Jeu actuel")}</span>
                  <button type="button" onClick={() => setScreen("settings")} className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 font-black text-emerald-100">{preferredGameItem.name}</button>
                </div>
                <p className="mt-2 text-slate-400">{uiText("ابنِ خطتك يستخدم هذه اللعبة تلقائيًا. لتغييرها استخدم الشريط العلوي أو الإعدادات.", "The builder uses this game automatically. Change it from the top bar or settings.", "El constructor usa este juego automáticamente.", "Le constructeur utilise ce jeu automatiquement.")}</p>
              </div>
              <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-3"><div className="text-xs font-black text-emerald-100">{getGameDnaProfile(game.id,game.name).title[lang]}</div><p className="mt-1 text-[10px] leading-relaxed text-slate-400">{getGameDnaProfile(game.id,game.name).description[lang]}</p></div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={uiText("التشكيلة", "Formation", "Formación", "Formation")} value={manualPlan.formation} options={getGameDnaProfile(game.id,game.name).formations.map(x=>[x,x])} onChange={(v)=>setManualPlan(p=>({...p,formation:v}))}/>
                <Field label={cfg.primaryLabel} value={manualPlan.primaryStyle} options={cfg.primary as string[][]} onChange={(v)=>setManualPlan(p=>({...p,primaryStyle:v}))}/>
                {cfg.family !== "efootball" && <Field label={cfg.buildLabel} value={manualPlan.buildUp} options={cfg.build as string[][]} onChange={(v)=>setManualPlan(p=>({...p,buildUp:v}))}/>} 
                {cfg.family !== "efootball" && <Field label={cfg.areaLabel} value={manualPlan.attackArea} options={cfg.area as string[][]} onChange={(v)=>setManualPlan(p=>({...p,attackArea:v}))}/>} 
                {cfg.family !== "efootball" && cfg.family !== "ea_fc_iq" && <Field label={cfg.positionLabel} value={manualPlan.positioning} options={cfg.positioning as string[][]} onChange={(v)=>setManualPlan(p=>({...p,positioning:v}))}/>} 
                {cfg.family !== "efootball" && cfg.family !== "ea_fc_iq" && <Field label={cfg.defenceLabel} value={manualPlan.defensiveStyle} options={cfg.defence as string[][]} onChange={(v)=>setManualPlan(p=>({...p,defensiveStyle:v}))}/>} 
                {cfg.family !== "efootball" && cfg.family !== "ea_fc_iq" && <Field label={cfg.containmentLabel} value={manualPlan.containmentArea} options={cfg.containment as string[][]} onChange={(v)=>setManualPlan(p=>({...p,containmentArea:v}))}/>} 
                {cfg.family !== "efootball" && cfg.family !== "ea_fc_iq" && <Field label={cfg.pressingLabel} value={manualPlan.pressuring} options={cfg.pressing as string[][]} onChange={(v)=>setManualPlan(p=>({...p,pressuring:v}))}/>} 
              </div>
              {cfg.family === "pes_classic" && (
                <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.04] p-4 space-y-4">
                  <div><h3 className="text-xs font-black text-cyan-100">{uiText("إعدادات PES الرقمية", "PES Numeric Settings")}</h3><p className="mt-1 text-[10px] text-slate-400">{uiText("اضبط القيم من 1 إلى 10 كما تظهر في Game Plan.", "Set values from 1 to 10 as shown in Game Plan.")}</p></div>
                  <label className="block"><div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-black text-slate-300">{uiText("مدى الدعم", "Support Range")}</span><span className="rounded-lg bg-cyan-300/10 px-2 py-1 text-xs font-black text-cyan-100">{manualPlan.supportRange}</span></div><input type="range" min="1" max="10" step="1" value={manualPlan.supportRange} onChange={(e)=>setManualPlan(p=>({...p,supportRange:e.target.value}))} className="w-full accent-cyan-400" /></label>
                  <label className="block"><div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-black text-slate-300">{uiText("مستوى خط الدفاع", "Defensive Line")}</span><span className="rounded-lg bg-cyan-300/10 px-2 py-1 text-xs font-black text-cyan-100">{manualPlan.defensiveLineLevel}</span></div><input type="range" min="1" max="10" step="1" value={manualPlan.defensiveLineLevel} onChange={(e)=>setManualPlan(p=>({...p,defensiveLineLevel:e.target.value}))} className="w-full accent-cyan-400" /></label>
                  <label className="block"><div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-black text-slate-300">{uiText("التكتل", "Compactness")}</span><span className="rounded-lg bg-cyan-300/10 px-2 py-1 text-xs font-black text-cyan-100">{manualPlan.compactness}</span></div><input type="range" min="1" max="10" step="1" value={manualPlan.compactness} onChange={(e)=>setManualPlan(p=>({...p,compactness:e.target.value}))} className="w-full accent-cyan-400" /></label>
                </div>
              )}

              {cfg.family === "efootball" && (() => {
                const ownPositions = ["GK","CB","LB","RB","DMF","CMF","AMF","LWF","RWF","SS","CF"];
                const opponentPositions = ["CB","LB","RB","DMF","CMF","AMF","LWF","RWF","SS","CF"];
                const InstructionSlot = ({ label, value, options, player, marker, onValue, onPlayer, onMarker }: { label: string; value: string; options: string[][]; player: string; marker?: string; onValue: (value: string) => void; onPlayer: (value: string) => void; onMarker?: (value: string) => void }) => {
                  const isTightMarking = value === "Tight Marking";
                  const isManMarking = value === "Man Marking";
                  return <div className="rounded-2xl border border-white/8 bg-slate-950/50 p-3 space-y-2">
                    <Field label={label} value={value} options={options} onChange={onValue}/>
                    {value !== "None" && !isManMarking && <label className="block space-y-1.5">
                      <span className="text-[9px] font-black text-slate-400">{isTightMarking ? uiText("حدد لاعب الخصم المطلوب تضييق المساحة عليه", "Select the opponent to mark tightly") : uiText("حدد لاعب فريقك", "Select your player")}</span>
                      <select className={selectClass} value={player || (isTightMarking ? "AMF" : "DMF")} onChange={(e)=>onPlayer(e.target.value)}>{(isTightMarking ? opponentPositions : ownPositions).map(pos=><option key={pos} value={pos}>{pos}</option>)}</select>
                    </label>}
                    {isManMarking && <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <label className="block space-y-1.5"><span className="text-[9px] font-black text-slate-400">{uiText("لاعب فريقك المكلف بالرقابة", "Your assigned marker")}</span><select className={selectClass} value={marker || "DMF"} onChange={(e)=>onMarker?.(e.target.value)}>{ownPositions.map(pos=><option key={pos} value={pos}>{pos}</option>)}</select></label>
                      <label className="block space-y-1.5"><span className="text-[9px] font-black text-slate-400">{uiText("لاعب الخصم المطلوب مراقبته", "Opponent to mark")}</span><select className={selectClass} value={player || "AMF"} onChange={(e)=>onPlayer(e.target.value)}>{opponentPositions.map(pos=><option key={pos} value={pos}>{pos}</option>)}</select></label>
                    </div>}
                  </div>;
                };
                return <div className="rounded-2xl border border-violet-300/15 bg-violet-400/[0.04] p-4 space-y-4">
                  <div>
                    <h3 className="text-xs font-black text-violet-100">{uiText("تعليمات eFootball الفردية", "eFootball individual instructions")}</h3>
                    <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{uiText("اختر حتى تعليمتين للهجوم وتعليمتين للدفاع. كل تعليمة مرتبطة بلاعب، والرقابة تختار لاعبًا من الخصم.", "Choose up to two attacking and two defensive instructions. Each instruction is assigned to a player; marking targets an opponent.")}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.035] p-3 space-y-3">
                    <div className="text-[10px] font-black text-emerald-100">{uiText("تعليمات هجومية", "Attacking instructions")}</div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <InstructionSlot label={uiText("التعليمة الهجومية الأولى", "Attacking instruction 1")} value={manualPlan.buildUp} options={cfg.build as string[][]} player={manualPlan.attackingPlayer1} onValue={(v)=>setManualPlan(p=>({...p,buildUp:v,...(v !== "None" && p.attackArea === v ? { attackArea: "None" } : {})}))} onPlayer={(v)=>setManualPlan(p=>({...p,attackingPlayer1:v}))}/>
                      <InstructionSlot label={uiText("التعليمة الهجومية الثانية", "Attacking instruction 2")} value={manualPlan.attackArea} options={cfg.area as string[][]} player={manualPlan.attackingPlayer2} onValue={(v)=>setManualPlan(p=>({...p,attackArea:v,...(v !== "None" && p.buildUp === v ? { buildUp: "None" } : {})}))} onPlayer={(v)=>setManualPlan(p=>({...p,attackingPlayer2:v}))}/>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.035] p-3 space-y-3">
                    <div className="text-[10px] font-black text-cyan-100">{uiText("تعليمات دفاعية", "Defensive instructions")}</div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <InstructionSlot label={uiText("التعليمة الدفاعية الأولى", "Defensive instruction 1")} value={manualPlan.positioning} options={cfg.positioning as string[][]} player={manualPlan.defensivePlayer1} marker={manualPlan.defensiveMarker1} onValue={(v)=>setManualPlan(p=>({...p,positioning:v,...(v !== "None" && p.defensiveStyle === v ? { defensiveStyle: "None" } : {})}))} onPlayer={(v)=>setManualPlan(p=>({...p,defensivePlayer1:v}))} onMarker={(v)=>setManualPlan(p=>({...p,defensiveMarker1:v}))}/>
                      <InstructionSlot label={uiText("التعليمة الدفاعية الثانية", "Defensive instruction 2")} value={manualPlan.defensiveStyle} options={cfg.defence as string[][]} player={manualPlan.defensivePlayer2} marker={manualPlan.defensiveMarker2} onValue={(v)=>setManualPlan(p=>({...p,defensiveStyle:v,...(v !== "None" && p.positioning === v ? { positioning: "None" } : {})}))} onPlayer={(v)=>setManualPlan(p=>({...p,defensivePlayer2:v}))} onMarker={(v)=>setManualPlan(p=>({...p,defensiveMarker2:v}))}/>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-slate-950/45 p-3 text-[10px] leading-relaxed text-slate-400">{uiText("أسلوب لعب الفريق يحدد الحركة الجماعية، بينما التعليمات الفردية تعدّل سلوك لاعبين محددين فقط.", "Team Playstyle controls collective movement, while Individual Instructions adjust specific players only.")}</div>
                </div>;
              })()}

              {cfg.family === "ea_fc_iq" && (() => {
                const fc26 = game.id === "ea-fc-26";
                const focusMap: Record<string, string[][]> = {
                  "Goalkeeper": [["Defend",uiText("دفاع","Defend")],["Balanced",uiText("متوازن","Balanced")]],
                  "Sweeper Keeper": [["Balanced",uiText("متوازن","Balanced")]],
                  "Ball-Playing Keeper": [["Build-Up",uiText("بناء اللعب","Build-Up")]],
                  "Defender": [["Defend",uiText("دفاع","Defend")],["Balanced",uiText("متوازن","Balanced")]],
                  "Ball-Playing Defender": [["Defend",uiText("دفاع","Defend")],["Build-Up",uiText("بناء اللعب","Build-Up")]],
                  "Stopper": [["Balanced",uiText("متوازن","Balanced")],["Aggressive",uiText("هجومي في الافتكاك","Aggressive")]],
                  "Wide Back": [["Defend",uiText("دفاع","Defend")],["Aggressive",uiText("هجومي في الافتكاك","Aggressive")],["Support",uiText("دعم","Support")]],
                  "Fullback": [["Defend",uiText("دفاع","Defend")],["Balanced",uiText("متوازن","Balanced")],...(fc26 ? [["Versatile",uiText("مرن","Versatile")]] : [])],
                  "Wingback": [["Balanced",uiText("متوازن","Balanced")],["Support",uiText("دعم","Support")]],
                  "Attacking Wingback": [[fc26?"Support":"Balanced",uiText(fc26?"دعم":"متوازن",fc26?"Support":"Balanced")],["Attack",uiText("هجوم","Attack")]],
                  "Falseback": [["Defend",uiText("دفاع","Defend")],["Balanced",uiText("متوازن","Balanced")]],
                  "Inverted Wingback": [["Build-Up",uiText("بناء اللعب","Build-Up")],["Attack",uiText("هجوم","Attack")]],
                  "Holding": [["Defend",uiText("دفاع","Defend")],["Roaming",uiText("تحرك حر","Roaming")]],
                  "Centre-Half": [["Defend",uiText("دفاع","Defend")]],
                  "Deep-Lying Playmaker": [["Defend",uiText("دفاع","Defend")],["Build-Up",uiText("بناء اللعب","Build-Up")],["Roaming",uiText("تحرك حر","Roaming")]],
                  "Box-to-Box": [["Balanced",uiText("متوازن","Balanced")],...(fc26 ? [["Ball-Winning",uiText("افتكاك الكرة","Ball-Winning")]] : [])],
                  "Playmaker": [["Build-Up",uiText("بناء اللعب","Build-Up")],["Roaming",uiText("تحرك حر","Roaming")],["Attack",uiText("هجوم","Attack")]],
                  "Half-Winger": [["Balanced",uiText("متوازن","Balanced")],[fc26?"Support":"Attack",uiText(fc26?"دعم":"هجوم",fc26?"Support":"Attack")],["Roaming",uiText("تحرك حر","Roaming")]],
                  "Box Crasher": [["Balanced",uiText("متوازن","Balanced")]],
                  "Winger": [["Balanced",uiText("متوازن","Balanced")],["Attack",uiText("هجوم","Attack")],["Roaming",uiText("تحرك حر","Roaming")],...(fc26 ? [["Versatile",uiText("مرن","Versatile")]] : [])],
                  "Inside Forward": [["Balanced",uiText("متوازن","Balanced")],["Attack",uiText("هجوم","Attack")],["Roaming",uiText("تحرك حر","Roaming")]],
                  "Wide Playmaker": [["Build-Up",uiText("بناء اللعب","Build-Up")],["Attack",uiText("هجوم","Attack")]],
                  "Advanced Forward": [["Attack",uiText("هجوم","Attack")],[fc26?"Versatile":"Complete",uiText(fc26?"مرن":"شامل",fc26?"Versatile":"Complete")]],
                  "Poacher": [["Attack",uiText("هجوم","Attack")],...(fc26 ? [["Versatile",uiText("مرن","Versatile")]] : [])],
                  "False 9": [["Build-Up",uiText("بناء اللعب","Build-Up")],["Attack",uiText("هجوم","Attack")]],
                  "Target Forward": [["Balanced",uiText("متوازن","Balanced")],["Attack",uiText("هجوم","Attack")],["Wide",uiText("تحرك واسع","Wide")]],
                };
                const RoleCard = ({ title, role, roleOptions, focus, onRole, onFocus }: { title:string; role:string; roleOptions:string[][]; focus:string; onRole:(value:string)=>void; onFocus:(value:string)=>void }) => {
                  const focuses = focusMap[role] || [["Balanced",uiText("متوازن","Balanced")]];
                  const validFocus = focuses.some(([value])=>value===focus) ? focus : focuses[0][0];
                  const changeRole = (nextRole: string) => {
                    onRole(nextRole);
                    const nextFocuses = focusMap[nextRole] || [["Balanced",uiText("متوازن","Balanced")]];
                    if (!nextFocuses.some(([value])=>value===focus)) onFocus(nextFocuses[0][0]);
                  };
                  return <div className="rounded-2xl border border-white/8 bg-slate-950/55 p-3 space-y-3">
                    <div className="text-[10px] font-black text-blue-100">{title}</div>
                    <Field label={uiText("الدور","Role")} value={role} options={roleOptions} onChange={changeRole}/>
                    <Field label={uiText("تركيز الدور","Role focus")} value={validFocus} options={focuses} onChange={onFocus}/>
                  </div>;
                };
                const gkRoles = [["Goalkeeper",uiText("حارس مرمى","Goalkeeper")],["Sweeper Keeper",uiText("حارس متقدم","Sweeper Keeper")],...(fc26 ? [["Ball-Playing Keeper",uiText("حارس صانع لعب","Ball-Playing Keeper")]] : [])] as string[][];
                const cbRoles = [["Defender",uiText("مدافع","Defender")],["Ball-Playing Defender",uiText("مدافع صانع لعب","Ball-Playing Defender")],["Stopper",uiText("مدافع متقدم","Stopper")],...(fc26 ? [["Wide Back",uiText("قلب دفاع واسع","Wide Back")]] : [])] as string[][];
                const wideRoles = [["Winger",uiText("جناح","Winger")],["Inside Forward",uiText("جناح داخلي","Inside Forward")],["Wide Playmaker",uiText("صانع لعب على الطرف","Wide Playmaker")]] as string[][];
                return <div className="space-y-3">
                  <div className="rounded-2xl border border-blue-300/15 bg-blue-400/[0.04] p-3 text-[10px] leading-relaxed text-slate-300"><b className="text-blue-100">{uiText("نظام تكتيكات اللعبة:","Game tactics system:")}</b> {uiText("أسلوب بناء اللعب والنهج الدفاعي وارتفاع الخط، ثم دور وتركيز مستقل لكل مجموعة مراكز.","Build-Up Style, Defensive Approach and Line Height, followed by a separate Role and Focus for each position group.")}</div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <RoleCard title={uiText("حارس المرمى","Goalkeeper")} role={manualPlan.gkRole} roleOptions={gkRoles} focus={manualPlan.gkFocus || "Defend"} onRole={(v)=>setManualPlan(p=>({...p,gkRole:v}))} onFocus={(v)=>setManualPlan(p=>({...p,gkFocus:v}))}/>
                    <RoleCard title={uiText("قلب الدفاع","Centre-back")} role={manualPlan.cbRole} roleOptions={cbRoles} focus={manualPlan.cbFocus || "Defend"} onRole={(v)=>setManualPlan(p=>({...p,cbRole:v}))} onFocus={(v)=>setManualPlan(p=>({...p,cbFocus:v}))}/>
                    <RoleCard title={uiText("الظهير","Fullback")} role={manualPlan.defensiveStyle} roleOptions={cfg.defence as string[][]} focus={manualPlan.fullbackFocus || "Defend"} onRole={(v)=>setManualPlan(p=>({...p,defensiveStyle:v}))} onFocus={(v)=>setManualPlan(p=>({...p,fullbackFocus:v}))}/>
                    <RoleCard title={uiText("وسط الملعب","Midfield")} role={manualPlan.positioning} roleOptions={cfg.positioning as string[][]} focus={manualPlan.midfieldFocus || "Balanced"} onRole={(v)=>setManualPlan(p=>({...p,positioning:v}))} onFocus={(v)=>setManualPlan(p=>({...p,midfieldFocus:v}))}/>
                    <RoleCard title={uiText("لاعب الطرف","Wide player")} role={manualPlan.wideRole} roleOptions={wideRoles} focus={manualPlan.wideFocus || "Balanced"} onRole={(v)=>setManualPlan(p=>({...p,wideRole:v}))} onFocus={(v)=>setManualPlan(p=>({...p,wideFocus:v}))}/>
                    <RoleCard title={uiText("المهاجم","Forward")} role={manualPlan.containmentArea} roleOptions={cfg.containment as string[][]} focus={manualPlan.forwardFocus || "Attack"} onRole={(v)=>setManualPlan(p=>({...p,containmentArea:v}))} onFocus={(v)=>setManualPlan(p=>({...p,forwardFocus:v}))}/>
                  </div>
                </div>;
              })()}
              {cfg.family === "ea_fc_legacy" && (
                <div className="rounded-2xl border border-amber-300/15 bg-amber-400/[0.035] p-4 space-y-3">
                  <div><h3 className="text-xs font-black text-amber-100">{uiText("الكرات الثابتة", "Set pieces")}</h3><p className="mt-1 text-[10px] text-slate-400">{uiText("اضبط عدد اللاعبين المتقدمين في الركنيات والركلات الحرة كما في Custom Tactics.", "Set the number of players committed to corners and free kicks in Custom Tactics.")}</p></div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={uiText("الركنيات", "Corners")} value={manualPlan.corners} options={[["1","1"],["2","2"],["3","3"],["4","4"],["5","5"]]} onChange={(v)=>setManualPlan(p=>({...p,corners:v}))}/>
                    <Field label={uiText("الركلات الحرة", "Free Kicks")} value={manualPlan.freeKicks} options={[["1","1"],["2","2"],["3","3"],["4","4"],["5","5"]]} onChange={(v)=>setManualPlan(p=>({...p,freeKicks:v}))}/>
                  </div>
                </div>
              )}

              {cfg.family === "ea_fc_legacy" && (() => {
                const targets = ["GK","CB","LB","RB","CDM","CM","CAM","LM","RM","LW","RW","ST"];
                const LegacySlot = ({ label, value, target, onValue, onTarget }: { label: string; value: string; target: string; onValue: (value: string) => void; onTarget: (value: string) => void }) => {
                  const options = legacyInstructionOptionsForTarget(target);
                  const visibleValue = options.some(([item])=>item===value) ? value : "None";
                  const changeTarget = (nextTarget: string) => {
                    onTarget(nextTarget);
                    if (!legacyInstructionOptionsForTarget(nextTarget).some(([item])=>item===value)) onValue("None");
                  };
                  return <div className="rounded-2xl border border-white/8 bg-slate-950/50 p-3 space-y-2">
                    <label className="block space-y-1.5"><span className="text-[9px] font-black text-slate-400">{uiText("المركز أو اللاعب","Player position")}</span><select className={selectClass} value={target} onChange={(e)=>changeTarget(e.target.value)}>{targets.map(pos=><option key={pos} value={pos}>{pos}</option>)}</select></label>
                    <Field label={label} value={visibleValue} options={options} onChange={onValue}/>
                  </div>;
                };
                return <div className="rounded-2xl border border-violet-300/15 bg-violet-400/[0.035] p-4 space-y-3">
                  <div><h3 className="text-xs font-black text-violet-100">{uiText("تعليمات اللاعبين","Player instructions")}</h3><p className="mt-1 text-[10px] leading-relaxed text-slate-400">{uiText("اختر المركز أولًا؛ ستظهر له فقط التعليمات المتاحة فعليًا في هذا الجيل من FIFA وFC 24.","Choose the position first; only the instructions available to that position in this FIFA/FC 24 generation are shown.")}</p></div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <LegacySlot label={uiText("التعليمة الأولى", "Instruction 1")} value={manualPlan.legacyInstruction1} target={manualPlan.attackingPlayer1} onValue={(v)=>setManualPlan(p=>({...p,legacyInstruction1:v}))} onTarget={(v)=>setManualPlan(p=>({...p,attackingPlayer1:v}))}/>
                    <LegacySlot label={uiText("التعليمة الثانية", "Instruction 2")} value={manualPlan.legacyInstruction2} target={manualPlan.attackingPlayer2} onValue={(v)=>setManualPlan(p=>({...p,legacyInstruction2:v}))} onTarget={(v)=>setManualPlan(p=>({...p,attackingPlayer2:v}))}/>
                    <LegacySlot label={uiText("التعليمة الثالثة", "Instruction 3")} value={manualPlan.legacyInstruction3} target={manualPlan.defensivePlayer1} onValue={(v)=>setManualPlan(p=>({...p,legacyInstruction3:v}))} onTarget={(v)=>setManualPlan(p=>({...p,defensivePlayer1:v}))}/>
                    <LegacySlot label={uiText("التعليمة الرابعة", "Instruction 4")} value={manualPlan.legacyInstruction4} target={manualPlan.defensivePlayer2} onValue={(v)=>setManualPlan(p=>({...p,legacyInstruction4:v}))} onTarget={(v)=>setManualPlan(p=>({...p,defensivePlayer2:v}))}/>
                  </div>
                </div>;
              })()}

              {cfg.family === "pes_classic" && (() => {
                const attackingInstructions = [
                  ["Attacking Fullbacks", uiText("أظهرة هجومية", "Attacking Fullbacks")],
                  ["Wing Rotation", uiText("تبادل مراكز الأطراف", "Wing Rotation")],
                  ["Tiki-Taka", uiText("تيكي تاكا", "Tiki-Taka")],
                  ["False No.9", uiText("مهاجم وهمي", "False No.9")],
                  ["Hug the Touchline", uiText("الالتزام بخط التماس", "Hug the Touchline")],
                  ["Centering Targets", uiText("أهداف العرضيات", "Centering Targets")],
                  ["False Fullbacks", uiText("أظهرة وهمية", "False Fullbacks")],
                  ["Defensive", uiText("دفاعي", "Defensive")],
                ] as string[][];
                const defensiveInstructions = [
                  ["Gegenpress", uiText("ضغط عكسي", "Gegenpress")],
                  ["Deep Defensive Line", uiText("خط دفاع عميق", "Deep Defensive Line")],
                  ["Swarm the Box", uiText("تكدس داخل المنطقة", "Swarm the Box")],
                  ["Counter Target", uiText("هجوم ضاغط", "Counter Target")],
                  ["Tight Marking", uiText("رقابة لصيقة", "Tight Marking")],
                  ["Wing Back", uiText("جناح دفاعي", "Wing Back")],
                ] as string[][];
                const positions = ["GK","CB","LB","RB","DMF","CMF","AMF","LWF","RWF","SS","CF"];
                const selectedAttack = manualPlan.advancedInstructions.filter(x => attackingInstructions.some(([v]) => v === x));
                const selectedDefence = manualPlan.advancedInstructions.filter(x => defensiveInstructions.some(([v]) => v === x));
                const toggleAdvanced = (value: string, group: "attack" | "defence") => setManualPlan(p => {
                  const list = group === "attack" ? attackingInstructions : defensiveInstructions;
                  const selected = p.advancedInstructions.filter(x => list.some(([v]) => v === x));
                  const active = p.advancedInstructions.includes(value);
                  if (active) return { ...p, advancedInstructions: p.advancedInstructions.filter(x => x !== value) };
                  if (selected.length >= 2) return p;
                  return { ...p, advancedInstructions: [...p.advancedInstructions, value] };
                });
                const renderGroup = (title: string, subtitle: string, rows: string[][], group: "attack" | "defence", selected: string[]) => (
                  <div className="rounded-2xl border border-white/8 bg-slate-950/45 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-black text-slate-100">{title}</div>
                        <div className="text-[9px] text-slate-500">{subtitle}</div>
                      </div>
                      <span className="rounded-full bg-white/10 px-2 py-1 text-[9px] font-black text-slate-300">{selected.length}/2</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {rows.map(([value,label]) => {
                        const active = manualPlan.advancedInstructions.includes(value);
                        const disabled = !active && selected.length >= 2;
                        return <button type="button" key={value} onClick={() => toggleAdvanced(value, group)} disabled={disabled} className={`rounded-xl border px-3 py-2 text-[10px] font-bold transition ${active ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100" : disabled ? "border-white/5 bg-slate-950/35 text-slate-600" : "border-white/8 bg-slate-950/70 text-slate-300"}`}>{label}</button>;
                      })}
                    </div>
                  </div>
                );
                return <div className="rounded-2xl border border-violet-300/15 bg-violet-400/[0.04] p-4 space-y-3">
                  <div>
                    <h3 className="text-xs font-black text-violet-100">{uiText("تعليمات PES المتقدمة", "PES advanced instructions")}</h3>
                    <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{uiText("اختر حتى تعليمتين هجومية وتعليمتين دفاعية فقط. دفاعي وهجوم ضاغط: اختر لاعبًا من فريقك. رقابة لصيقة: اختر مركز لاعب الخصم.", "Choose up to two attacking and two defensive instructions. Defensive & Counter Target: select your player. Tight Marking: select opponent position to mark.")}</p>
                  </div>
                  {renderGroup(uiText("تعليمات هجومية", "Attacking instructions"), uiText("اختر 2 بحد أقصى", "Maximum 2"), attackingInstructions, "attack", selectedAttack)}
                  {manualPlan.advancedInstructions.includes("Defensive") && <label className="block space-y-1.5"><span className="text-[9px] font-black text-slate-400">{uiText("طبّق دفاعي على", "Apply Defensive on")}</span><select className={selectClass} value={manualPlan.defensivePlayer1} onChange={(e)=>setManualPlan(p=>({...p,defensivePlayer1:e.target.value}))}>{positions.map(pos=><option key={pos} value={pos}>{pos}</option>)}</select></label>}
                  {renderGroup(uiText("تعليمات دفاعية", "Defensive instructions"), uiText("اختر 2 بحد أقصى", "Maximum 2"), defensiveInstructions, "defence", selectedDefence)}
                  {manualPlan.advancedInstructions.includes("Counter Target") && <label className="block space-y-1.5"><span className="text-[9px] font-black text-slate-400">{uiText("طبّق هجوم ضاغط على", "Apply Counter Target on")}</span><select className={selectClass} value={manualPlan.attackingPlayer1} onChange={(e)=>setManualPlan(p=>({...p,attackingPlayer1:e.target.value}))}>{positions.map(pos=><option key={pos} value={pos}>{pos}</option>)}</select></label>}
                  {manualPlan.advancedInstructions.includes("Tight Marking") && <label className="block space-y-1.5"><span className="text-[9px] font-black text-slate-400">{uiText("حدد مركز اللاعب المنافس المستهدف", "Select the opponent position to mark")}</span><select className={selectClass} value={manualPlan.tightMarkTarget || "AMF"} onChange={(e)=>setManualPlan(p=>({...p,tightMarkTarget:e.target.value}))}>{["CF","SS","AMF","LWF","RWF","LMF","RMF","CMF","DMF","LB","RB","CB"].map(pos=><option key={pos} value={pos}>{pos}</option>)}</select></label>}
                </div>;
              })()}
              {cfg.family !== "pes_classic" && cfg.family !== "ea_fc_legacy" && (cfg.advanced as string[][]).length > 0 && <div><div className="mb-2 text-[10px] font-black text-slate-400">{uiText("التعليمات المتقدمة — اختر حتى 4", "Advanced instructions — choose up to 4", "Instrucciones avanzadas", "Consignes avancées")}</div><div className="grid grid-cols-2 gap-2">{(cfg.advanced as string[][]).map(([value,label])=>{const active=manualPlan.advancedInstructions.includes(value);return <button type="button" key={value} onClick={()=>setManualPlan(p=>({...p,advancedInstructions:active?p.advancedInstructions.filter(x=>x!==value):p.advancedInstructions.length<4?[...p.advancedInstructions,value]:p.advancedInstructions}))} className={`rounded-xl border px-3 py-2 text-[10px] font-bold ${active?"border-emerald-400/40 bg-emerald-400/15 text-emerald-100":"border-white/8 bg-slate-950/50 text-slate-400"}`}>{label}</button>})}</div></div>}
              <textarea value={manualPlan.notes} onChange={(e)=>setManualPlan(p=>({...p,notes:e.target.value}))} placeholder={uiText("ملاحظاتك: مثلًا الظهير الأيسر يتقدم كثيرًا أو أريد مهاجمًا وهميًا...", "Your notes: e.g. left fullback pushes high, I want a false nine...", "Notas...", "Notes...")} className="min-h-24 w-full rounded-xl border border-white/10 bg-slate-950/70 p-3 text-xs text-white outline-none focus:border-emerald-400"/>
              <button type="button" onClick={()=>setShowManualBoard(v=>!v)} className="w-full rounded-xl border border-cyan-400/20 bg-cyan-400/10 py-3 text-xs font-black text-cyan-100">{showManualBoard?uiText("إخفاء السبورة","Hide board"):uiText("إظهار السبورة","Show board")}</button>
              {showManualBoard && <TacticalBoard formation={manualPlan.formation} opponentFormation="4-2-3-1" lang={lang} value={manualBoardState || board} onChange={setManualBoardState} showOpponent={false} compact />}
              <button type="button" onClick={evaluateManualPlan} className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3.5 text-sm font-black text-slate-950">{uiText("قيّم خطتي واعرض النتيجة", "Rate my tactic", "Evaluar táctica", "Évaluer la tactique")}</button>
            </div>
          </div>;
        })()}

        {/* ======================================================= */}
        {/* 2. CHOOSE GAME / LIBRARY SELECTION SCREEN */}
        {/* ======================================================= */}
        {screen === "community" && session?.user?.id && (
          <CommunityLite
            userId={session.user.id}
            coachName={coachName}
            lang={lang}
            savedTactics={savedTactics}
            onToast={triggerToast}
            onUseTactic={(tactic) => {
              setSelectedGame(
                GAMES_LIST.find(
                  (game) =>
                    game.name === tactic.game || game.id === tactic.game,
                ) || GAMES_LIST[0],
              );
              setFormData({
                myFormation: tactic.myFormation,
                oppFormation: tactic.oppFormation,
                opponentStyle: tactic.opponentStyle,
                myStyle: tactic.myStyle,
                matchState: tactic.matchState,
                myTeam: tactic.myTeam,
                oppTeam: tactic.oppTeam,
                notes: tactic.notes,
                efootballManagerId: formData.efootballManagerId,
              });
              const locked = lockFinalPlanResult(tactic.result, tactic.board || tactic.result.finalBoard || null, {
                sourceTool: "community",
                game: tactic.game,
                language: lang,
                formation: tactic.myFormation,
                playstyle: tactic.myStyle,
                confidenceFallback: resultTacticalScore,
              });
              setCurrentResult(locked.result);
              setBoardState(locked.board);
              setScreen("result");
            }}
          />
        )}

        {screen === "meta-center" && (
          <div className="space-y-4 pb-24 animate-fade-in">
            <MetaCenter
              lang={lang}
              items={currentMeta.length ? currentMeta : buildMetaCenter(homeGameId, savedTactics)}
              gameName={preferredGameItem.name}
              premium={subscription.plan !== "free"}
              onUse={useMetaItem}
            />
          </div>
        )}

        {false && screen === "select-game" && (
          <div className="space-y-4 animate-fade-in">
            {/* Search and Filters panel */}
            <div className="space-y-3">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder={t.searchGamesPlaceholder}
                  value={searchGameQuery}
                  onChange={(e) => setSearchGameQuery(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/5 text-slate-200 py-2.5 pr-9 pl-4 rounded-xl text-xs outline-none focus:border-violet-600 transition"
                />
              </div>

              {/* Category selector */}
              <div className="grid grid-cols-3 gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setSelectedCategory("ALL")}
                  className={`py-1.5 rounded-lg text-[10px] font-bold transition ${selectedCategory === "ALL" ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
                >
                  {t.allGamesTab}
                </button>
                <button
                  onClick={() => setSelectedCategory("FIFA/EA FC")}
                  className={`py-1.5 rounded-lg text-[10px] font-bold transition ${selectedCategory === "FIFA/EA FC" ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
                >
                  {t.fifatab}
                </button>
                <button
                  onClick={() => setSelectedCategory("PES/eFootball")}
                  className={`py-1.5 rounded-lg text-[10px] font-bold transition ${selectedCategory === "PES/eFootball" ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
                >
                  {t.pesTab}
                </button>
              </div>
            </div>

            {/* List Array of football games */}
            <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-1">
              {GAMES_LIST.filter((g) => {
                const matchesSearch = g.name
                  .toLowerCase()
                  .includes(searchGameQuery.toLowerCase());
                const matchesCat =
                  selectedCategory === "ALL" || g.category === selectedCategory;
                return matchesSearch && matchesCat;
              }).map((game) => (
                <button
                  key={game.id}
                  onClick={() => {
                    setSelectedGame(game);
                    if (generatorMode === "build") {
                      const manager = isEfootballGame(game.id)
                        ? getEfootballManager(formData.efootballManagerId) ||
                          efootballManagers.find((m) => m.primaryPlaystyle === normalizeEfootballPlaystyle(formData.myStyle)) ||
                          efootballManagers[0]
                        : null;
                      const nextFormation =
                        manager?.bestFormations?.[0] ||
                        formData.myFormation ||
                        "4-3-3";
                      const nextForm = {
                        ...formData,
                        myFormation: nextFormation,
                        myStyle: manager?.primaryPlaystyle || formData.myStyle,
                        efootballManagerId: manager?.id || formData.efootballManagerId,
                        opponentStyle: uiText(
                          "لا يوجد خصم محدد",
                          "No specific opponent",
                          "Sin rival específico",
                          "Aucun adversaire spécifique",
                        ),
                      };
                      if (isEfootballGame(game.id)) setEfootballPlaystyleFilter(normalizeEfootballPlaystyle(nextForm.myStyle));
                      setFormData(nextForm);
                      setBoardState(
                        manager
                          ? buildEfootballManagerBoard(
                              nextFormation,
                              nextForm.oppFormation,
                              manager,
                            )
                          : buildGameAwareBoard(
                              game.id,
                              nextFormation,
                              nextForm.oppFormation,
                            ),
                      );
                      setStep(2);
                    } else {
                      setStep(2);
                    }
                    setScreen("generator");
                  }}
                  className="w-full text-right bg-white/5 hover:bg-white/10 border border-white/5 hover:border-violet-600/30 p-3.5 rounded-xl flex items-center justify-between group transition-all"
                  id={`game-option-${game.id}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-slate-950/80 border border-white/5 flex items-center justify-center font-mono text-xs font-bold text-violet-400 group-hover:scale-105 transition-transform">
                      {game.iconText}
                    </span>
                    <div className="text-right">
                      <h4 className="text-xs font-extrabold text-slate-200 group-hover:text-violet-400 transition-colors">
                        {game.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {game.category} • {game.year}
                      </p>
                    </div>
                  </div>
                  <ChevronLeft
                    size={16}
                    className="text-slate-500 group-hover:text-slate-200 transition-transform translate-x-1"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* 3. STEPPER TACTIC GENERATOR SCREEN (WIZARD FLOW) */}
        {/* ======================================================= */}
        {screen === "generator" && selectedGame && (
          <div className="space-y-4 animate-fade-in pb-12">
            {/* Horizontal Stepper Progress Indicator */}
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-[11px]">
              {generatorMode === "build" ? (
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    {
                      n: 1,
                      active: step >= 2,
                      label: uiText(
                        "أسلوبك",
                        "Your style",
                        "Tu estilo",
                        "Votre style",
                      ),
                    },
                    {
                      n: 2,
                      active: step >= 3,
                      label: uiText("السبورة", "Board", "Pizarra", "Tableau"),
                    },
                    {
                      n: 3,
                      active: step >= 4,
                      label: uiText(
                        "المراجعة والتوليد",
                        "Review & generate",
                        "Revisión",
                        "Révision",
                      ),
                    },
                  ].map((item) => (
                    <div
                      key={item.n}
                      className={`rounded-xl border px-2 py-2 ${item.active ? "bg-violet-600/20 border-violet-500/40 text-violet-200" : "bg-slate-900/60 border-white/5 text-slate-500"}`}
                    >
                      <span
                        className={`mx-auto mb-1 w-5 h-5 rounded-full flex items-center justify-center font-black ${item.active ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400"}`}
                      >
                        {item.n}
                      </span>
                      <span className="font-bold">{item.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    {
                      n: 1,
                      active: step >= 1,
                      label: uiText("الخصم", "Opponent", "Rival", "Adversaire"),
                    },
                    {
                      n: 2,
                      active: step >= 2,
                      label: uiText("الخصم", "Opponent", "Rival", "Adversaire"),
                    },
                    {
                      n: 3,
                      active: step >= 4,
                      label: uiText(
                        "التوليد",
                        "Generate",
                        "Generar",
                        "Générer",
                      ),
                    },
                  ].map((item) => (
                    <div
                      key={item.n}
                      className={`rounded-xl border px-2 py-2 ${item.active ? "bg-violet-600/20 border-violet-500/40 text-violet-200" : "bg-slate-900/60 border-white/5 text-slate-500"}`}
                    >
                      <span
                        className={`mx-auto mb-1 w-5 h-5 rounded-full flex items-center justify-center font-black ${item.active ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400"}`}
                      >
                        {item.n}
                      </span>
                      <span className="font-bold">{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stepper Active Arena Preview */}
            <div className="bg-violet-950/15 p-3 rounded-xl border border-violet-900/35 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Gamepad2 size={15} className="text-violet-400 animate-pulse" />
                <span className="font-extrabold text-slate-200">
                  {selectedGame.name}
                </span>
              </div>
              <button
                onClick={() => {
                  setScreen("settings");
                }}
                className="text-[10px] text-violet-400 underline font-semibold focus:outline-none"
              >
                {uiText(
                  "تغيير من الإعدادات",
                  "Change in settings",
                  "Cambiar juego",
                  "Changer de jeu",
                )}
              </button>
            </div>

            {/* STEP 2: BUILD STYLE OR OPPONENT DATA */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                {generatorMode === "build" ? (
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-200 shrink-0">
                          <Brain size={18} />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-emerald-200">
                            {uiText("المدرب يختار لك الخطة", "Coach picks the tactic for you", "El coach elige", "Le coach choisit")}
                          </h3>
                          <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                            {uiText("جاوب بإحساسك فقط. لا تختار خطة من الصفر؛ اختَر هدفك وسيظهر لك أفضل 3 اختيارات قابلة للتنفيذ.", "Answer with your feeling only. Do not pick a shape from scratch; choose your goal and get 3 playable recommendations.", "Elige objetivo.", "Choisissez l’objectif.")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {guidedBuildIntents().map((intent) => {
                        const active = normalizeGuidedIntent(formData.notes || selectedGuidedCardId) === intent.id || (!formData.notes && intent.id === "best");
                        return (
                          <button
                            key={intent.id}
                            type="button"
                            onClick={() => {
                              setSelectedGuidedCardId("best");
                              updateGeneratorForm({
                                myStyle: intent.style,
                                notes: `TACTIC_BUILD:${intent.id} | ${intent.title}`,
                                matchState: uiText("اختيار حسب هدف اللاعب", "Pick from player goal", "Según el objetivo", "Selon l’objectif"),
                              }, true);
                              const rec = makeGuidedRecommendations("build")[0];
                              setTimeout(() => applyGuidedRecommendation({ ...rec, style: intent.style, notes: `TACTIC_BUILD:${intent.id} | ${intent.title} | VARIANT:BEST` }), 0);
                            }}
                            className={`w-full rounded-3xl border p-4 text-right transition ${active ? "bg-emerald-500/15 border-emerald-400/35 shadow-lg shadow-emerald-900/10" : "bg-slate-950/55 border-white/5 hover:border-emerald-400/20"}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="h-9 w-9 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-[10px] font-black text-emerald-300">GO</span>
                              <div className="flex-1">
                                <div className="text-sm font-black text-white">{intent.title}</div>
                                <div className="mt-1 text-[11px] text-slate-400">{intent.desc}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="rounded-3xl border border-violet-500/20 bg-violet-950/10 p-4 space-y-3">
                      <div>
                        <h3 className="text-sm font-black text-violet-200">
                          {uiText("اختيارات مقترحة من المدرب", "Coach recommendations", "Recomendaciones", "Recommandations")}
                        </h3>
                        <p className="mt-1 text-[10px] text-slate-400 leading-relaxed">
                          {uiText("اختَر كارت واحد فقط. بعدها ستظهر السبورة والتفاصيل التنفيذية.", "Choose only one card. The board and execution details will follow.", "Elige una.", "Choisissez une.")}
                        </p>
                      </div>
                      {makeGuidedRecommendations("build").map((rec) => {
                        const active = selectedGuidedCardId === rec.id;
                        return (
                          <button
                            key={rec.id}
                            type="button"
                            onClick={() => applyGuidedRecommendation(rec)}
                            className={`w-full rounded-3xl border p-4 text-right transition ${active ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 border-violet-300 text-white shadow-xl" : "bg-slate-950/65 border-white/5 text-slate-300 hover:border-violet-400/30"}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-black">{rec.title}</div>
                                <div className="mt-3 text-lg font-black text-emerald-300">{optionLabel(rec.style, lang)}</div>
                                <div className="mt-1 text-[11px] opacity-80 leading-relaxed">{rec.reason}</div>
                              </div>
                              <div className="text-left">
                                <span className="inline-flex rounded-2xl bg-white/10 px-3 py-1 text-[10px] font-black">{rec.badge}</span>
                                <div className="mt-4 text-xl font-black font-mono">{rec.formation}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-rose-400/20 bg-gradient-to-br from-rose-500/10 to-violet-500/5 p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-rose-400/10 border border-rose-400/20 flex items-center justify-center text-rose-200 shrink-0">
                          <Target size={18} />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-rose-200">
                            {uiText("احكيلي خصمك بيلعب إزاي", "Tell me how your rival plays", "Cuéntame el rival", "Décris l’adversaire")}
                          </h3>
                          <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                            {uiText("مش محتاج تختار خطتك. اختار المشكلة أو اكتبها، والمدرب يطلع لك خطة مضادة.", "No need to choose your tactic. Pick or write the problem and the coach gives you a counter plan.", "Elige problema.", "Choisissez le problème.")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {counterProblemOptions().map((problem) => {
                        const active = formData.notes.includes(problem.id) || formData.opponentStyle === problem.text;
                        return (
                          <button
                            key={problem.id}
                            type="button"
                            onClick={() => {
                              setSelectedGuidedCardId("best");
                              updateGeneratorForm({
                                opponentStyle: problem.text,
                                matchState: uiText("خصم موصوف يدويًا", "Manually described rival", "Rival descrito", "Adversaire décrit"),
                                notes: `TACTIC_COUNTER:${problem.id} | ${problem.text}`,
                              }, false);
                              const rec = makeGuidedRecommendations("counter")[0];
                              setTimeout(() => applyGuidedRecommendation({ ...rec, notes: `TACTIC_COUNTER:${problem.id} | ${problem.text} | VARIANT:BEST` }), 0);
                            }}
                            className={`rounded-2xl border p-3 text-right text-[11px] font-black transition ${active ? "bg-rose-500/15 border-rose-400/35 text-white" : "bg-slate-950/60 border-white/5 text-slate-300 hover:border-rose-400/25"}`}
                          >
                            {problem.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-400">
                        {uiText("ملاحظة الخصم الاختيارية", "Optional rival note", "Nota opcional", "Note facultative")}
                      </label>
                      <textarea
                        rows={2}
                        value={formData.notes.replace(/^TACTIC_COUNTER:[^|]+\|\s*/i, "")}
                        onChange={(e) => {
                          setSelectedGuidedCardId("best");
                          updateGeneratorForm({
                            notes: `TACTIC_COUNTER:custom | ${e.target.value}`,
                            opponentStyle: e.target.value || formData.opponentStyle,
                          }, false);
                        }}
                        placeholder={uiText("مثال: بيضغط جامد وبيلعب كرات طويلة للجناح الأيمن", "Example: presses hard and plays long balls to the right wing", "Ejemplo...", "Exemple...")}
                        className="w-full rounded-2xl bg-slate-950/60 border border-white/8 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-rose-500"
                      />
                    </div>

                    <div className="rounded-3xl border border-violet-500/20 bg-violet-950/10 p-4 space-y-3">
                      <div>
                        <h3 className="text-sm font-black text-violet-200">
                          {uiText("الخطة المضادة المقترحة", "Suggested counter plans", "Contras sugeridas", "Contres proposés")}
                        </h3>
                        <p className="mt-1 text-[10px] text-slate-400 leading-relaxed">
                          {uiText("اختَر كارت واحد: أفضل حل، حل آمن، أو حل هجومي.", "Pick one card: best, safe or aggressive.", "Elige una.", "Choisissez une.")}
                        </p>
                      </div>
                      {makeGuidedRecommendations("counter").map((rec) => {
                        const active = selectedGuidedCardId === rec.id;
                        return (
                          <button
                            key={rec.id}
                            type="button"
                            onClick={() => applyGuidedRecommendation(rec)}
                            className={`w-full rounded-3xl border p-4 text-right transition ${active ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 border-violet-300 text-white shadow-xl" : "bg-slate-950/65 border-white/5 text-slate-300 hover:border-violet-400/30"}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-black">{rec.title}</div>
                                <div className="mt-3 text-lg font-black text-emerald-300">{optionLabel(rec.style, lang)}</div>
                                <div className="mt-1 text-[11px] opacity-80 leading-relaxed">{rec.reason}</div>
                              </div>
                              <div className="text-left">
                                <span className="inline-flex rounded-2xl bg-white/10 px-3 py-1 text-[10px] font-black">{rec.badge}</span>
                                <div className="mt-4 text-xl font-black font-mono">{rec.formation}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: BOARD PREVIEW ONLY — no duplicate style/formation choices */}
            {step === 3 && generatorMode === "build" && (
              <div className="space-y-4 animate-fade-in">
                <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-3">
                  <h3 className="text-sm font-black text-emerald-300">
                    {uiText("السبورة حسب اختيارك", "Board from your choice", "Pizarra según tu elección", "Tableau selon votre choix")}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                    {uiText("هنا لا نكرر اختيار الأسلوب أو التشكيلة. السبورة تتحرك تلقائيًا حسب الخطة التي اخترتها في الخطوة السابقة.", "No repeated style or formation choices here. The board follows the shape selected in the previous step.", "Sin repetición.", "Pas de répétition.")}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3">
                    <b className="text-violet-300">{uiText("الأسلوب", "Style", "Estilo", "Style")}</b>
                    <br />
                    {isEfootballGame(selectedGame?.id)
                      ? managerPlaystyleLabel(normalizeEfootballPlaystyle(formData.myStyle) as any, lang)
                      : optionLabel(formData.myStyle, lang)}
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-3">
                    <b className="text-violet-300">{uiText("التشكيلة", "Shape", "Formación", "Formation")}</b>
                    <br />
                    {formData.myFormation}
                  </div>
                </div>
                <TacticalBoard
                  key={`${selectedGame?.id}-${formData.myFormation}-${formData.oppFormation}-${showOpponentOnBoard}-build-step3`}
                  formation={formData.myFormation}
                  opponentFormation={formData.oppFormation}
                  lang={lang}
                  value={boardState}
                  onChange={setBoardState}
                  showOpponent={false}
                  compact
                />
              </div>
            )}

            {/* STEP 4: REVIEW & TRIGGER PLAYBOOK ACTION */}
            {step === 4 && (
              <div className="space-y-4 animate-fade-in text-xs">
                {/* Chalkboard review graphic */}
                <div className="bg-slate-950 border-2 border-dashed border-violet-500/40 p-4 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-2 right-2 font-mono text-[9px] text-violet-500 font-bold uppercase tracking-widest">
                    TACTIC BOARD
                  </div>
                  <h4 className="font-extrabold text-violet-400 mb-2.5 text-sm">
                    📋{" "}
                    {generatorMode === "build"
                      ? uiText(
                          "مراجعة أسلوبك",
                          "Your style review",
                          "Revisión de estilo",
                          "Résumé du style",
                        )
                      : uiText(
                          "مراجعة الخصم",
                          "Opponent review",
                          "Revisión rival",
                          "Résumé adversaire",
                        )}
                  </h4>

                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-slate-400">
                        {uiText(
                          "إصدار اللعبة:",
                          "Game version:",
                          "Versión del juego:",
                          "Version du jeu :",
                        )}
                      </span>
                      <span className="font-bold text-white">
                        {selectedGame.name}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-slate-400">
                        {generatorMode === "build"
                          ? uiText(
                              "تشكيلتك:",
                              "Your formation:",
                              "Tu formación:",
                              "Votre formation :",
                            )
                          : uiText(
                              "خطة الخصم:",
                              "Opponent formation:",
                              "Formación rival:",
                              "Formation adverse :",
                            )}
                      </span>
                      <span className="font-bold text-white font-mono">
                        {generatorMode === "build"
                          ? formData.myFormation
                          : formData.oppFormation}
                      </span>
                    </div>
                    {generatorMode === "counter" && (
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-slate-400">
                          {uiText(
                            "طريقة لعب الخصم:",
                            "Opponent playstyle:",
                            "Estilo del rival:",
                            "Style adverse :",
                          )}
                        </span>
                        <span className="font-bold text-red-400">
                          {optionLabel(formData.opponentStyle, lang)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-slate-400">
                        {uiText(
                          "أسلوبك الكروي:",
                          "Your playstyle:",
                          "Tu estilo:",
                          "Votre style :",
                        )}
                      </span>
                      <span className="font-bold text-emerald-400">
                        {optionLabel(formData.myStyle, lang)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        {uiText(
                          "ملاحظات التكتيك:",
                          "Tactical notes:",
                          "Notas tácticas:",
                          "Notes tactiques :",
                        )}
                      </span>
                      <span className="font-bold text-white truncate max-w-[180px]">
                        {formData.notes ||
                          uiText("لا يوجد", "None", "Ninguna", "Aucune")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400 italic">
                  {uiText(
                    "* النتيجة القادمة ستكون خطة تنفيذ مباشرة بدون حشو.",
                    "* The next result will be a direct execution plan with no filler.",
                    "* El resultado será directo.",
                    "* Le résultat sera direct.",
                  )}
                </div>
              </div>
            )}

            {/* Stepper Wizard navigation buttons */}
            <div className="flex items-center gap-3 pt-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="w-1/3 bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-xl transition text-xs"
                >
                  {uiText("السابق", "Back", "Atrás", "Retour")}
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className={`font-bold py-3 px-4 rounded-xl transition text-xs ${step === 1 ? "w-full bg-violet-600 text-white" : "flex-1 bg-violet-600 text-white"}`}
                >
                  {uiText("التالي", "Next", "Siguiente", "Suivant")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerateTactic}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-emerald-600 active:from-violet-700 active:to-emerald-700 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-violet-950/20 text-xs tracking-wider border border-violet-400/20 cursor-pointer text-center"
                  id="final-generate-btn"
                >
                  {t.generateBtn}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* TACTIC DEVELOPMENT — IMPROVE THE USER'S OWN STYLE */}
        {/* ======================================================= */}
        {screen === "improve-tactic" && (
          <div className="space-y-5 animate-fade-in pb-16">
            <div className="bg-gradient-to-br from-emerald-500/15 to-violet-600/15 border border-emerald-400/20 p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute -top-10 -left-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start justify-between gap-3 relative">
                <div>
                  <span className="text-[9px] font-black text-emerald-300 uppercase tracking-[0.18em]">
                    TACTIC DEVELOPMENT
                  </span>
                  <h2 className="text-lg font-black text-white mt-1 flex items-center gap-2">
                    <Brain size={19} className="text-emerald-300" />
                    {uiText(
                      "تطوير خطتي",
                      "Develop My Tactic",
                      "Desarrollar mi táctica",
                      "Développer ma tactique",
                    )}
                  </h2>
                  <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                    {uiText(
                      "ضع طريقتك المفضلة على السبورة، وسيحلل المحرك التكتيكي التوزيع ويقترح تطويرًا وخططًا بديلة.",
                      "Place your preferred setup on the board. The coach will evaluate it and suggest upgrades and alternatives.",
                      "Coloca tu sistema favorito en la pizarra. El entrenador lo evaluará y sugerirá mejoras.",
                      "Placez votre système favori sur le tableau. Le coach l’évaluera et proposera des améliorations.",
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setScreen("home")}
                  className="bg-white/5 hover:bg-white/10 text-slate-200 text-[10px] font-bold px-3 py-2 rounded-xl border border-white/5"
                >
                  {t.backBtn}
                </button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="block text-slate-400 font-bold">
                    {uiText(
                      "اللعبة والإصدار",
                      "Game and edition",
                      "Juego y edición",
                      "Jeu et édition",
                    )}
                  </label>
                  <select
                    value={developmentForm.gameId}
                    onChange={(e) => {
                      const gameId = e.target.value;
                      const teams = getPopularTeamsForGame(gameId);
                      const team = teams[0];
                      const formation = team?.defaultFormation || "4-3-3";
                      setDevelopmentForm({
                        ...developmentForm,
                        gameId,
                        team: team?.name || "",
                        formation,
                      });
                      prepareDevelopmentBoard(
                        gameId,
                        team?.name || "",
                        formation,
                      );
                    }}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    {GAMES_LIST.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-400 font-bold">
                    {uiText("فريقك", "Your team", "Tu equipo", "Votre équipe")}
                  </label>
                  <select
                    value={developmentForm.team}
                    onChange={(e) => {
                      const teamName = e.target.value;
                      const team = getTeamByName(developmentGame.id, teamName);
                      const formation =
                        team?.defaultFormation || developmentForm.formation;
                      setDevelopmentForm({
                        ...developmentForm,
                        team: teamName,
                        formation,
                      });
                      prepareDevelopmentBoard(
                        developmentGame.id,
                        teamName,
                        formation,
                      );
                    }}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    {developmentTeams.map((team) => (
                      <option key={team.id} value={team.name}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-400 font-bold">
                    {uiText(
                      "تشكيلتك الحالية",
                      "Current formation",
                      "Formación actual",
                      "Formation actuelle",
                    )}
                  </label>
                  <select
                    value={developmentForm.formation}
                    onChange={(e) => {
                      const formation = e.target.value;
                      setDevelopmentForm({ ...developmentForm, formation });
                      prepareDevelopmentBoard(
                        developmentGame.id,
                        developmentForm.team,
                        formation,
                      );
                    }}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    {[
                      "4-3-3",
                      "4-2-3-1",
                      "4-4-2",
                      "4-3-2-1",
                      "4-3-1-2",
                      "3-5-2",
                      "3-2-4-1",
                      "5-3-2",
                      "4-2-4",
                    ].map((shape) => (
                      <option key={shape} value={shape}>
                        {shape}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-400 font-bold">
                    {uiText(
                      "أسلوبك المفضل",
                      "Preferred style",
                      "Estilo preferido",
                      "Style préféré",
                    )}
                  </label>
                  <select
                    value={developmentForm.style}
                    onChange={(e) => {
                      setDevelopmentForm({
                        ...developmentForm,
                        style: e.target.value,
                      });
                      setDevelopmentResult(null);
                    }}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    {MY_STYLES.map((style) => (
                      <option key={style.value} value={style.value}>
                        {optionLabel(style.value, lang)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-400 font-bold">
                    {uiText(
                      "هدف التطوير",
                      "Development goal",
                      "Objetivo de mejora",
                      "Objectif de développement",
                    )}
                  </label>
                  <select
                    value={developmentForm.goal}
                    onChange={(e) => {
                      setDevelopmentForm({
                        ...developmentForm,
                        goal: e.target.value,
                      });
                      setDevelopmentResult(null);
                    }}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    {developmentGoals.map((goal) => (
                      <option key={goal.value} value={goal.value}>
                        {goal.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-400 font-bold">
                  {uiText(
                    "إيه اللي حاسس إنه ناقص في خطتك؟",
                    "What feels missing from your tactic?",
                    "¿Qué falta en tu táctica?",
                    "Que manque-t-il à votre tactique ?",
                  )}
                </label>
                <textarea
                  rows={2}
                  value={developmentForm.notes}
                  onChange={(e) => {
                    setDevelopmentForm({
                      ...developmentForm,
                      notes: e.target.value,
                    });
                    setDevelopmentResult(null);
                  }}
                  placeholder={uiText(
                    "مثال: بصنع فرص لكن بستقبل مرتدات كتير...",
                    "Example: I create chances but concede too many counters...",
                    "Ejemplo: creo ocasiones pero recibo muchas contras...",
                    "Exemple : je crée des occasions mais je subis trop de contres...",
                  )}
                  className="w-full bg-slate-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-black text-emerald-300">
                    {uiText(
                      "ارسم طريقتك الحالية",
                      "Draw your current setup",
                      "Dibuja tu sistema actual",
                      "Dessinez votre système actuel",
                    )}
                  </h3>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    {uiText(
                      "حرّك اللاعبين وغيّر الأدوار قبل التحليل.",
                      "Move players and adjust roles before analysis.",
                      "Mueve jugadores y ajusta roles antes del análisis.",
                      "Déplacez les joueurs et ajustez les rôles avant l’analyse.",
                    )}
                  </p>
                </div>
                <span className="text-[9px] px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-bold">
                  LIVE ANALYSIS
                </span>
              </div>
              <TacticalBoard
                formation={developmentForm.formation}
                opponentFormation="4-4-2"
                lang={lang}
                value={developmentBoard}
                onChange={(board) => {
                  setDevelopmentBoard(board);
                  setDevelopmentResult(null);
                }}
                showOpponent={false}
                compact
              />
            </div>

            <button
              onClick={handleDevelopTactic}
              disabled={isDeveloping}
              className="w-full bg-gradient-to-r from-emerald-600 via-cyan-600 to-violet-600 disabled:opacity-60 text-white font-black py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-xs border border-emerald-400/20"
            >
              {isDeveloping ? (
                <>
                  <Sparkles size={16} className="animate-spin" />
                  {uiText(
                    "جاري تحليل وتطوير خطتك...",
                    "Analyzing and developing your tactic...",
                    "Analizando y mejorando tu táctica...",
                    "Analyse et développement de votre tactique...",
                  )}
                </>
              ) : (
                <>
                  <Brain size={16} />
                  {uiText(
                    "حلّل وطوّر خطتي الآن",
                    "Analyze and develop my tactic",
                    "Analizar y mejorar mi táctica",
                    "Analyser et développer ma tactique",
                  )}
                </>
              )}
            </button>

            {developmentResult && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-gradient-to-br from-violet-500/15 to-emerald-500/10 border border-violet-400/20 p-4 rounded-2xl">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[9px] text-violet-300 font-black uppercase">
                        TACTIC SCORE
                      </span>
                      <div className="text-3xl font-black text-white font-mono mt-1">
                        {developmentResult.score}
                        <span className="text-sm text-slate-400">/100</span>
                      </div>
                      <p className="text-[10px] font-bold text-emerald-300 mt-1">
                        {developmentResult.level}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400">
                        {uiText(
                          "التطوير المقترح",
                          "Recommended upgrade",
                          "Mejora recomendada",
                          "Amélioration recommandée",
                        )}
                      </span>
                      <div className="text-2xl font-black text-violet-300 font-mono">
                        {developmentResult.recommendedFormation}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-3 leading-relaxed">
                    {developmentResult.summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                    <h4 className="text-xs font-black text-emerald-300 mb-2">
                      ✅{" "}
                      {uiText(
                        "نقاط القوة الحالية",
                        "Current strengths",
                        "Fortalezas actuales",
                        "Forces actuelles",
                      )}
                    </h4>
                    <div className="space-y-1.5">
                      {developmentResult.strengths.map((item, index) => (
                        <div
                          key={index}
                          className="text-[10px] text-slate-300 bg-slate-950/40 p-2 rounded-xl"
                        >
                          • {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                    <h4 className="text-xs font-black text-yellow-300 mb-2">
                      🎯{" "}
                      {uiText(
                        "أولويات التطوير",
                        "Development priorities",
                        "Prioridades de mejora",
                        "Priorités de développement",
                      )}
                    </h4>
                    <div className="space-y-1.5">
                      {developmentResult.priorities.map((item, index) => (
                        <div
                          key={index}
                          className="text-[10px] text-slate-300 bg-slate-950/40 p-2 rounded-xl"
                        >
                          • {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                    <h4 className="text-xs font-black text-cyan-300 mb-2">
                      🧩{" "}
                      {uiText(
                        "تغييرات الأدوار",
                        "Role changes",
                        "Cambios de roles",
                        "Changements de rôles",
                      )}
                    </h4>
                    <div className="space-y-1.5">
                      {developmentResult.roleChanges.map((item, index) => (
                        <div
                          key={index}
                          className="text-[10px] text-slate-300 bg-slate-950/40 p-2 rounded-xl"
                        >
                          • {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                    <h4 className="text-xs font-black text-violet-300 mb-2">
                      🔁{" "}
                      {uiText(
                        "خطط بديلة للتجربة",
                        "Alternative shapes to test",
                        "Formaciones alternativas",
                        "Formations alternatives",
                      )}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {developmentResult.alternativeFormations.map((shape) => (
                        <span
                          key={shape}
                          className="px-3 py-1.5 rounded-xl bg-violet-500/10 text-violet-200 border border-violet-500/20 font-mono text-[10px] font-black"
                        >
                          {shape}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={openDevelopedTactic}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2"
                >
                  <Zap size={15} />
                  {uiText(
                    "افتح الخطة المطورة واحفظها",
                    "Open and save the developed tactic",
                    "Abrir y guardar la táctica mejorada",
                    "Ouvrir et enregistrer la tactique développée",
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================= */}
        {/* 4. TACTICAL REPORT RESULTS OUTCOME (WITH PITCH VISUALIZER) */}
        {/* ======================================================= */}
        {screen === "result" &&
          currentResult &&
          (() => {
            const actionPlan = getActionPlan();
            return (
              <div className="space-y-4 animate-fade-in pb-16">
                <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-violet-950/35 p-4 shadow-2xl">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-right">
                      <div className="text-[10px] font-black text-emerald-300 uppercase tracking-wide">
                        {uiText(
                          "خطة قابلة للتطبيق",
                          "Playable plan",
                          "Plan aplicable",
                          "Plan applicable",
                        )}
                      </div>
                      <h2 className="mt-1 text-3xl font-black text-white tracking-widest font-mono">
                        {currentResult.formation}
                      </h2>
                      <p className="mt-1 text-[11px] text-slate-300">
                        {actionPlan.style}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 min-w-[118px]">
                      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-2 text-center">
                        <div className="text-[9px] text-emerald-200">
                          {uiText(
                            "الثقة",
                            "Confidence",
                            "Confianza",
                            "Confiance",
                          )}
                        </div>
                        <div className="text-lg font-black text-emerald-300 font-mono">
                          {`${safePercent(currentResult.confidence, 86)}%`}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-violet-400/25 bg-violet-500/10 p-2 text-center">
                        <div className="text-[9px] text-violet-200">
                          {uiText("التقييم", "Score", "Puntuación", "Score")}
                        </div>
                        <div className="text-lg font-black text-white font-mono">
                          {`${safeScore10(currentResult.score ?? currentResult.rating, resultTacticalScore).toFixed(1)}/10`}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-2xl bg-black/20 border border-white/5 p-3 text-[11px] text-slate-300 leading-relaxed">
                    {uiText(
                      "هذه الصفحة تعرض القيم والتعليمات التي تطبقها داخل اللعبة فقط.",
                      "This page shows only the values and instructions you apply in-game.",
                      "Esta página muestra solo lo que aplicas en el juego.",
                      "Cette page affiche seulement ce à appliquer en jeu.",
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-cyan-400/15 bg-cyan-950/10 p-4 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-cyan-200 flex items-center gap-2">
                      <Settings size={16} />
                      {uiText(
                        "خطة التنفيذ داخل اللعبة",
                        "In-game execution plan",
                        "Plan dentro del juego",
                        "Plan en jeu",
                      )}
                    </h3>
                    <span className="rounded-full bg-emerald-400/10 border border-emerald-400/20 px-2 py-1 text-[9px] text-emerald-200 font-black">
                      READY
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {uiText(
                      "هذه ليست شروحات. هذه هي القيم التي تدخلها مباشرة داخل اللعبة.",
                      "These are not explanations. These are the exact values to apply in-game.",
                      "No son explicaciones; son valores directos.",
                      "Ce ne sont pas des explications; ce sont les valeurs à appliquer.",
                    )}
                  </p>

                  <div className="rounded-3xl border border-emerald-400/15 bg-emerald-950/10 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-emerald-200">
                        {uiText(
                          "إعدادات الهجوم",
                          "Attack settings",
                          "Ataque",
                          "Attaque",
                        )}
                      </h4>
                      <span className="text-[9px] text-emerald-300 font-black">
                        APPLY
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {actionPlan.direct.attack.map(([label, value]) => (
                        <SettingCard
                          key={`attack-${label}`}
                          label={label}
                          value={value}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-sky-400/15 bg-sky-950/10 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-sky-200">
                        {uiText(
                          "إعدادات الدفاع",
                          "Defence settings",
                          "Defensa",
                          "Défense",
                        )}
                      </h4>
                      <span className="text-[9px] text-sky-300 font-black">
                        APPLY
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {actionPlan.direct.defence.map(([label, value]) => (
                        <SettingCard
                          key={`defence-${label}`}
                          label={label}
                          value={value}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowInstructionDetails(!showInstructionDetails)
                    }
                    className="w-full rounded-2xl border border-violet-400/15 bg-violet-950/20 px-4 py-3 text-xs font-black text-violet-100 flex items-center justify-between"
                  >
                    <span>
                      {uiText(
                        "التعليمات المتقدمة داخل اللعبة",
                        "In-game advanced instructions",
                        "Instrucciones avanzadas",
                        "Consignes avancées",
                      )}
                    </span>
                    <ChevronDown
                      size={16}
                      className={
                        showInstructionDetails
                          ? "rotate-180 transition"
                          : "transition"
                      }
                    />
                  </button>
                  {showInstructionDetails && (
                    <div className="rounded-3xl border border-violet-400/15 bg-violet-950/10 p-3 space-y-3 animate-fade-in">
                      <div className="grid grid-cols-1 gap-2 text-[11px]">
                        {actionPlan.direct.advanced.map(([label, value]) => (
                          <SettingCard
                            key={`advanced-${label}`}
                            label={label}
                            value={value}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Removed noisy immediate match-orders block: duplicated advanced instructions and crowded the result page. */}


                <div className="rounded-3xl border border-white/8 bg-white/[0.04] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-white">
                        {uiText("السبورة التنفيذية", "Execution board", "Pizarra de ejecución", "Tableau d’exécution")}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {uiText("افتحها عند الحاجة فقط للحفاظ على النتيجة مختصرة وواضحة.", "Open only when needed to keep the result clean.", "Ábrela solo cuando haga falta.", "Ouvrez uniquement si nécessaire.")}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowExecutionBoard(!showExecutionBoard)}
                        className="rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-black px-4 py-2"
                      >
                        {showExecutionBoard
                          ? uiText("إخفاء السبورة", "Hide board", "Ocultar", "Masquer")
                          : uiText("إظهار السبورة", "Show board", "Mostrar", "Afficher")}
                      </button>
                    </div>
                  </div>

                  {showExecutionBoard && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!guardFeature("advanced_board")) return;
                            setShowOpponentOnBoard(!showOpponentOnBoard);
                          }}
                          className={`rounded-2xl border text-[10px] font-black px-3 py-2 ${canUseProgressionFeature("advanced_board") ? "bg-white/5 border-white/10 text-white" : "bg-slate-900/70 border-white/5 text-slate-500"}` }
                        >
                          {showOpponentOnBoard
                            ? uiText("إخفاء الخصم", "Hide rival", "Ocultar", "Masquer")
                            : uiText("إظهار الخصم", "Show rival", "Mostrar", "Afficher")}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!guardFeature("board_ai_read")) return;
                            setShowBoardScan(!showBoardScan);
                          }}
                          className={`rounded-2xl border text-[10px] font-black px-3 py-2 flex items-center gap-1.5 ${canUseProgressionFeature("board_ai_read") ? "bg-emerald-500/10 border-emerald-300/20 text-emerald-100" : "bg-slate-900/70 border-white/5 text-slate-500"}` }
                        >
                          <Brain size={13} />
                          {showBoardScan
                            ? uiText("إخفاء تحليل السبورة", "Hide board analysis", "Ocultar análisis", "Masquer l’analyse")
                            : uiText("تحليل السبورة", "Board analysis", "Análisis de pizarra", "Analyse du tableau")}
                        </button>
                        <button
                          onClick={() => setScreen("sandbox-board")}
                          className="rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-black px-3 py-2"
                        >
                          {uiText("تعديل السبورة", "Edit board", "Editar", "Modifier")}
                        </button>
                      </div>
                      {(!canUseProgressionFeature("board_ai_read") || !canUseProgressionFeature("advanced_board")) && (
                        <div className="rounded-2xl border border-amber-300/15 bg-amber-500/8 px-3 py-2 text-[10px] font-bold text-amber-100">
                          {uiText("ارفع مستوى التقدم لفتح التحليل المتقدم وإظهار الخصم داخل السبورة.", "Earn progress to unlock advanced analysis and the rival layer on the board.", "Avanza para desbloquear el análisis avanzado.", "Progressez pour débloquer l’analyse avancée.")}
                        </div>
                      )}
                      <div className="max-h-[230px] overflow-hidden rounded-2xl border border-white/5 bg-slate-950/40 pointer-events-none">
                        <TacticalBoard
                          formation={currentResult.formation}
                          opponentFormation={formData.oppFormation}
                          lang={lang}
                          value={getLockedBoardState()}
                          readOnly
                          showOpponent={showOpponentOnBoard}
                          compact
                        />
                      </div>
                      {showBoardScan && (
                        <div className="rounded-3xl border border-emerald-400/15 bg-emerald-950/10 p-4 space-y-3">
                          <h3 className="text-sm font-black text-emerald-200 flex items-center gap-2">
                            <Brain size={16} />
                            {uiText("تحليل السبورة", "Board analysis", "Análisis de pizarra", "Analyse du tableau")}
                          </h3>
                          <div className="grid grid-cols-1 gap-2 text-[11px]">
                            {(currentResult.boardAnalysis?.length ? currentResult.boardAnalysis : [
                              uiText("توزيع فريقك متوازن مبدئيًا ويمكن البناء عليه.", "Your shape is balanced enough to build on.", "Distribución equilibrada.", "Structure équilibrée."),
                              uiText("راقب المسافة بين المحور وصانع اللعب قبل رفع الظهيرين.", "Watch the DM-AM gap before pushing both fullbacks.", "Vigila la distancia central.", "Surveillez l’écart milieu-créateur."),
                            ]).slice(0, 3).map((item, index) => (
                              <div key={index} className="rounded-2xl border border-emerald-400/10 bg-slate-950/55 px-3 py-2 text-slate-100 font-bold">
                                {index + 1}. {cleanTacticText(item)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-fuchsia-400/20 bg-slate-950/70 p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-black text-fuchsia-200 uppercase tracking-widest">TACTIC BOSS</div>
                    <div className="text-xs font-black text-white truncate">{uiText("مشاركة الخطة", "Share tactic", "Compartir imagen", "Partager l’image")}</div>
                  </div>
                  <button type="button" onClick={shareTacticInfo} className="rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-black px-4 py-2.5 flex items-center justify-center gap-2 shrink-0">
                    <Share2 size={15}/>
                    {uiText("شارك", "Share", "Compartir", "Partager")}
                  </button>
                </div>

                <div className="grid grid-cols-[1fr_auto_auto] gap-2 sticky bottom-20 z-20">
                  <button
                    onClick={handleSaveTactic}
                    className="bg-violet-600 hover:bg-violet-500 text-white font-extrabold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-xl"
                  >
                    <Save size={15} />
                    {t.saveBtn}
                  </button>
                  <button
                    onClick={shareTacticInfo}
                    className="bg-slate-900/95 hover:bg-white/10 text-white p-3.5 rounded-2xl border border-white/10"
                    title={t.shareBtn}
                  >
                    <Share2 size={15} />
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${currentResult.formation} - ${actionPlan.style}`,
                      );
                      triggerToast(t.copiedSuccess);
                    }}
                    className="bg-slate-900/95 hover:bg-white/10 text-white p-3.5 rounded-2xl border border-white/10"
                    title={t.copyBtn}
                  >
                    <Copy size={15} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    setStep(2);
                    setScreen("generator");
                  }}
                  className="w-full text-center text-xs text-violet-300 hover:text-violet-200 underline font-semibold focus:outline-none"
                >
                  {t.editInputsBtn}
                </button>
              </div>
            );
          })()}

        {/* ======================================================= */}
        {/* 5. SAVED ARCHIVES/TACTICS LIBRARY SCREEN */}
        {/* ======================================================= */}
        {screen === "library" && (
          <div className="space-y-4 animate-fade-in pb-12">
            <section className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-950/35 to-slate-950/85 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-black tracking-[.18em] text-cyan-300">{uiText("خططك المحفوظة", "SAVED TACTICS", "TÁCTICAS", "TACTIQUES")}</div><h2 className="mt-1 text-base font-black text-white">{uiText("مكتبة الخطط", "Tactics Library", "Biblioteca", "Bibliothèque")}</h2><p className="mt-1 text-[10px] leading-relaxed text-slate-400">{uiText("احفظ خططك وافتحها أو انسخها بدون أدوات تحليل إضافية تشتت التجربة.", "Save, open and copy your tactics without extra analysis tools crowding the screen.", "Guarda y abre tácticas.", "Enregistrez et ouvrez vos tactiques.")}</p></div><Library size={22} className="text-cyan-300"/></div>
            </section>
            {savedTactics.length === 0 ? (
              <div className="text-center py-16 bg-white/5 border border-white/5 rounded-2xl p-6">
                <div className="w-14 h-14 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 mx-auto mb-4">
                  <Library size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-200">
                  {t.emptyLibraryTitle}
                </h3>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed max-w-xs mx-auto">
                  {t.emptyLibraryDesc}
                </p>
                <button
                  onClick={startManualBuilder}
                  className="mt-5 bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-5 rounded-lg text-xs"
                >
                  {t.startBtn}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {savedTactics.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedGame(
                        GAMES_LIST.find((g) => g.name === item.game) || null,
                      );
                      const locked = lockFinalPlanResult(item.result, item.board || item.result.finalBoard || null, {
                        sourceTool: "library",
                        game: item.game,
                        language: lang,
                        formation: item.myFormation,
                        playstyle: item.myStyle,
                        confidenceFallback: resultTacticalScore,
                      });
                      setCurrentResult(locked.result);
                      setBoardState(locked.board);
                      setFormData({
                        myFormation: item.myFormation,
                        oppFormation: item.oppFormation,
                        opponentStyle: item.opponentStyle,
                        myStyle: item.myStyle,
                        matchState: item.matchState,
                        myTeam: item.myTeam,
                        oppTeam: item.oppTeam,
                        notes: item.notes,
                        efootballManagerId: formData.efootballManagerId,
                      });
                      setScreen("result");
                    }}
                    className="bg-white/5 hover:bg-white/10 border border-white/5 p-4 rounded-xl text-right block cursor-pointer group transition duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-violet-500/10 text-violet-300 p-1 px-2.5 rounded border border-violet-500/20 font-mono">
                        {item.result.formation}
                      </span>
                      <button
                        onClick={(e) => handleDeleteTactic(item.id, e)}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <h4 className="text-xs font-black text-slate-200 mt-2.5 truncate">
                      {item.title}
                    </h4>
                    {item.board && (
                      <div className="mt-3 rounded-2xl overflow-hidden border border-white/5 bg-slate-950/40">
                        <TacticalBoard
                          formation={item.myFormation}
                          opponentFormation={item.oppFormation}
                          lang={lang}
                          value={item.board}
                          readOnly
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2.5 border-t border-white/5 mt-2.5 font-mono">
                      <span>{item.game}</span>
                      <span>{item.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================= */}
        {/* 6. COMPETITOR TRACKING SC Scouting RIVAL MODE */}
        {/* ======================================================= */}
        {screen === "rivals" && (
          <div className="space-y-4 animate-fade-in pb-12">
            <ScoutCenter lang={lang} rivals={rivals} />
            <button
              onClick={() => setScreen("improve-tactic")}
              className="w-full bg-gradient-to-r from-emerald-500/15 to-violet-600/15 hover:from-emerald-500/25 border border-emerald-400/20 p-4 rounded-2xl text-right flex items-center justify-between transition"
            >
              <div>
                <h3 className="text-xs font-black text-emerald-300">
                  {uiText(
                    "طوّر خطتك أنت أولًا",
                    "Develop your own tactic first",
                    "Mejora primero tu táctica",
                    "Développez d’abord votre tactique",
                  )}
                </h3>
                <p className="text-[9px] text-slate-400 mt-1">
                  {uiText(
                    "قيّم أسلوبك والسبورة ثم ارجع لبناء خطة مضادة للخصم.",
                    "Evaluate your style and board before building a rival counter.",
                    "Evalúa tu estilo antes de crear una contra táctica.",
                    "Évaluez votre style avant de créer un contre.",
                  )}
                </p>
              </div>
              <Brain size={19} className="text-emerald-300" />
            </button>

            {/* Toggle Adding form banner */}
            {!isAddingRival ? (
              <button
                onClick={() => setIsAddingRival(true)}
                className="w-full bg-gradient-to-r from-rose-600/10 to-transparent hover:from-rose-600/20 border border-rose-500/20 p-4 rounded-2xl text-right flex items-center justify-between font-bold text-xs text-rose-400 cursor-pointer"
                id="add-rival-banner-btn"
              >
                <span>{t.addRivalBtn}</span>
                <Plus size={16} />
              </button>
            ) : (
              <form
                onSubmit={handleAddRival}
                className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3 text-xs"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h4 className="font-extrabold text-rose-400 flex items-center gap-1">
                    <Sword size={14} />
                    <span>
                      {uiText(
                        "إضافة ملف خصم",
                        "Add rival profile",
                        "Añadir rival",
                        "Ajouter un rival",
                      )}
                    </span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingRival(false)}
                    className="text-slate-500 text-[10px] hover:underline"
                  >
                    {uiText("إلغاء", "Cancel", "Cancelar", "Annuler")}
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-400 font-bold">
                    {uiText(
                      "اسم اللاعب المنافس",
                      "Rival player name",
                      "Nombre del rival",
                      "Nom du rival",
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={uiText(
                      "مثال: يوسف",
                      "Example: Alex",
                      "Ejemplo: Alex",
                      "Exemple : Alex",
                    )}
                    value={rivalForm.name}
                    onChange={(e) =>
                      setRivalForm({ ...rivalForm, name: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-slate-400 font-bold">
                      {uiText(
                        "لعبته المفضلة",
                        "Favorite game",
                        "Juego favorito",
                        "Jeu favori",
                      )}
                    </label>
                    <select
                      value={rivalForm.favoriteGame}
                      onChange={(e) =>
                        setRivalForm({
                          ...rivalForm,
                          favoriteGame: e.target.value,
                          favoriteTeam: "",
                        })
                      }
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      {GAMES_LIST.map((game) => (
                        <option key={game.id} value={game.id}>
                          {game.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-400 font-bold">
                      {uiText(
                        "تشكيلته المعتادة",
                        "Usual formation",
                        "Formación habitual",
                        "Formation habituelle",
                      )}
                    </label>
                    <input
                      type="text"
                      value={rivalForm.favoriteFormation}
                      onChange={(e) =>
                        setRivalForm({
                          ...rivalForm,
                          favoriteFormation: e.target.value,
                        })
                      }
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-400 font-bold">
                    {uiText(
                      "الفريق الذي يلعب به",
                      "Team used",
                      "Equipo usado",
                      "Équipe utilisée",
                    )}
                  </label>
                  <select
                    value={rivalForm.favoriteTeam}
                    onChange={(e) =>
                      setRivalForm({
                        ...rivalForm,
                        favoriteTeam: e.target.value,
                      })
                    }
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="">
                      {uiText(
                        "اختَر الفريق",
                        "Choose team",
                        "Elige equipo",
                        "Choisir une équipe",
                      )}
                    </option>
                    {rivalTeams.map((team) => (
                      <option key={team.id} value={team.name}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-400 font-bold">
                      {uiText(
                        "سبورة الخصم",
                        "Rival board",
                        "Pizarra rival",
                        "Tableau rival",
                      )}
                    </label>
                    <span className="text-[10px] text-emerald-400">
                      {uiText(
                        "تُستخدم مباشرة في الخطة المضادة",
                        "Used directly in the counter tactic",
                        "Se usa en la contra táctica",
                        "Utilisé dans la tactique de contre",
                      )}
                    </span>
                  </div>
                  <TacticalBoard
                    formation={rivalForm.favoriteFormation}
                    opponentFormation={formData.myFormation}
                    lang={lang}
                    value={rivalBoardState}
                    onChange={setRivalBoardState}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-400 font-bold">
                    {uiText(
                      "أسلوبه الطاغي",
                      "Dominant playstyle",
                      "Estilo dominante",
                      "Style dominant",
                    )}
                  </label>
                  <select
                    value={rivalForm.playstyle}
                    onChange={(e) =>
                      setRivalForm({ ...rivalForm, playstyle: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {OPPONENT_STYLES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-slate-400 font-bold">
                      {uiText(
                        "نقاط القوة",
                        "Strengths",
                        "Fortalezas",
                        "Forces",
                      )}
                    </label>
                    <input
                      type="text"
                      value={rivalForm.strengths}
                      onChange={(e) =>
                        setRivalForm({
                          ...rivalForm,
                          strengths: e.target.value,
                        })
                      }
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-400 font-bold">
                      {uiText(
                        "نقاط الضعف",
                        "Weaknesses",
                        "Debilidades",
                        "Faiblesses",
                      )}
                    </label>
                    <input
                      type="text"
                      value={rivalForm.weaknesses}
                      onChange={(e) =>
                        setRivalForm({
                          ...rivalForm,
                          weaknesses: e.target.value,
                        })
                      }
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-500 font-extrabold py-2.5 rounded-xl"
                >
                  {uiText(
                    "حفظ ملف الخصم والسبورة",
                    "Save rival profile and board",
                    "Guardar rival y pizarra",
                    "Enregistrer le rival et le tableau",
                  )}
                </button>
              </form>
            )}

            {/* List rivals profiles */}
            <div className="space-y-3">
              {rivals.map((rival) => (
                <div
                  key={rival.id}
                  className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3 shadow-lg relative"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-100 flex items-center gap-1">
                        <span>👤 {rival.name}</span>
                        <span className="text-[9px] bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/25">
                          RIVAL
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {rival.favoriteGame} • {rival.favoriteFormation}
                        {rival.favoriteTeam ? ` • ${rival.favoriteTeam}` : ""}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteRival(rival.id)}
                      className="text-slate-500 hover:text-red-400 p-1"
                      title={uiText(
                        "حذف الخصم",
                        "Delete rival",
                        "Eliminar rival",
                        "Supprimer le rival",
                      )}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Scouting metrics cards */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                      <span className="text-slate-400 block">
                        💪{" "}
                        {uiText(
                          "نقاط القوة:",
                          "Strengths:",
                          "Fortalezas:",
                          "Forces :",
                        )}
                      </span>
                      <span className="font-bold text-slate-200 block truncate mt-0.5">
                        {rival.strengths ||
                          uiText(
                            "غير معروف",
                            "Unknown",
                            "Desconocido",
                            "Inconnu",
                          )}
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                      <span className="text-slate-400 block">
                        📉{" "}
                        {uiText(
                          "نقاط الضعف:",
                          "Weaknesses:",
                          "Debilidades:",
                          "Faiblesses :",
                        )}
                      </span>
                      <span className="font-bold text-yellow-400 block truncate mt-0.5">
                        {rival.weaknesses ||
                          uiText(
                            "غير معروف",
                            "Unknown",
                            "Desconocido",
                            "Inconnu",
                          )}
                      </span>
                    </div>
                  </div>

                  {rival.board && (
                    <div className="rounded-2xl overflow-hidden border border-white/5 bg-slate-950/40">
                      <TacticalBoard
                        formation={rival.favoriteFormation}
                        opponentFormation={formData.myFormation}
                        lang={lang}
                        value={rival.board}
                        readOnly
                      />
                    </div>
                  )}

                  {/* Rival actions */}
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => handleTriggerRivalTactic(rival)}
                      className="w-full bg-rose-600/15 hover:bg-rose-600/30 text-rose-400 font-extrabold py-2 rounded-xl border border-rose-500/20 text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.99]"
                    >
                      <Sword size={13} />
                      <span>{t.breakHisTacticBtn}</span>
                    </button>
                    <button
                      onClick={() => openDevelopmentAgainstRival(rival)}
                      className="w-full bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-300 font-extrabold py-2 rounded-xl border border-emerald-500/20 text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.99]"
                    >
                      <Brain size={13} />
                      <span>
                        {uiText(
                          "طوّر خطتي لمواجهة هذا الخصم",
                          "Develop my tactic for this rival",
                          "Mejorar mi táctica para este rival",
                          "Développer ma tactique pour ce rival",
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              ))}

              {rivals.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-xs">
                  {uiText(
                    "لا يوجد خصوم محفوظون حاليًا.",
                    "No rival profiles saved yet.",
                    "Aún no hay rivales guardados.",
                    "Aucun rival enregistré pour le moment.",
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* FREE EXPERIMENTAL SANDBOX TACTICAL BOARD SCREEN */}
        {/* ======================================================= */}
        {screen === "sandbox-board" && (
          <div className="space-y-4 animate-fade-in pb-12">
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
              <h3 className="text-sm font-black text-white">
                {uiText(
                  "تجهيز اللوحة التكتيكية الحرة ⚙️",
                  "Free Sandbox Setup ⚙️",
                  "Configuración de pizarra libre ⚙️",
                  "Configuration du tableau libre ⚙️",
                )}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {uiText(
                  "اختر تشكيلة فريقك وتشكيلة الخصم لتوزيع اللاعبين يدويًا على الملعب.",
                  "Choose both formations, then arrange players and draw movements.",
                  "Elige ambas formaciones, organiza jugadores y dibuja movimientos.",
                  "Choisissez les deux formations, placez les joueurs et dessinez les mouvements.",
                )}
              </p>

              <div className="grid grid-cols-2 gap-3 mt-4 text-right">
                <div className="space-y-1 text-xs">
                  <label className="block text-slate-400 font-bold">
                    {uiText(
                      "تشكيلة فريقك",
                      "Your Formation",
                      "Tu formación",
                      "Votre formation",
                    )}
                  </label>
                  <select
                    value={formData.myFormation}
                    onChange={(e) =>
                      updateGeneratorForm({ myFormation: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white outline-none focus:border-violet-500"
                  >
                    {["4-3-3", "4-2-3-1", "4-4-2", "3-5-2", "4-2-4"].map(
                      (f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="block text-slate-400 font-bold">
                    {uiText(
                      "تشكيلة الخصم",
                      "Opponent Formation",
                      "Formación rival",
                      "Formation adverse",
                    )}
                  </label>
                  <select
                    value={formData.oppFormation}
                    onChange={(e) =>
                      updateGeneratorForm({ oppFormation: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white outline-none focus:border-violet-500"
                  >
                    {["4-2-3-1", "4-3-3", "4-4-2", "3-5-2", "5-3-2"].map(
                      (f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-extrabold text-slate-400 flex items-center gap-1">
                <Target size={14} className="text-emerald-400 animate-pulse" />
                <span>
                  {uiText(
                    "اللوحة التكتيكية التفاعلية — حرّك اللاعبين وارسم التحركات",
                    "Interactive Tactical Board — move players and draw runs",
                    "Pizarra táctica interactiva — mueve jugadores y dibuja recorridos",
                    "Tableau tactique interactif — déplacez les joueurs et dessinez les courses",
                  )}
                </span>
              </h3>

              <TacticalBoard
                formation={formData.myFormation}
                opponentFormation={formData.oppFormation}
                lang={lang}
                value={boardState}
                onChange={setBoardState}
              />
            </div>

            {/* Tactical feedback module */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 space-y-3 mt-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-violet-600/10 text-violet-400 border border-violet-500/20">
                  <Brain size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">
                    {uiText(
                      "تحليل السبورة التكتيكية 🧠",
                      "Tactical Board Analysis 🧠",
                      "Análisis de la pizarra táctica 🧠",
                      "Analyse du tableau tactique 🧠",
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {uiText(
                      "سيقرأ المحرك التكتيكي توزيع اللاعبين ويقترح خطة مضادة وتعليمات مناسبة.",
                      "The tactical engine will read the player shape and recommend a counter tactic.",
                      "El entrenador inteligente analizará la distribución y propondrá una táctica de respuesta.",
                      "Le coach intelligent analysera le dispositif et proposera une tactique adaptée.",
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-right">
                <div className="space-y-1 text-xs">
                  <label className="block text-slate-400 font-bold">
                    {uiText(
                      "اللعبة المستهدفة",
                      "Target game",
                      "Juego objetivo",
                      "Jeu cible",
                    )}
                  </label>
                  <select
                    value={
                      selectedGame ? selectedGame.id : GAMES_LIST[0]?.id || ""
                    }
                    onChange={(e) => {
                      const gameObj = GAMES_LIST.find(
                        (g) => g.id === e.target.value,
                      );
                      if (gameObj) setSelectedGame(gameObj);
                    }}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white outline-none focus:border-violet-500 text-xs"
                  >
                    {GAMES_LIST.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="block text-slate-400 font-bold">
                    {uiText(
                      "تركيز تكتيكي إضافي (اختياري)",
                      "Additional tactical focus (optional)",
                      "Enfoque táctico adicional (opcional)",
                      "Objectif tactique supplémentaire (facultatif)",
                    )}
                  </label>
                  <input
                    type="text"
                    placeholder={uiText(
                      "مثال: دفاع متأخر أو لعب سريع على الأطراف",
                      "e.g. low block or quick wing play",
                      "p. ej., bloque bajo o juego rápido por bandas",
                      "ex. bloc bas ou jeu rapide sur les ailes",
                    )}
                    value={formData.notes}
                    onChange={(e) =>
                      updateGeneratorForm({ notes: e.target.value }, false)
                    }
                    className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white placeholder-slate-600 outline-none focus:border-violet-500 text-xs"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  const originalNotes = formData.notes;
                  const customPromptNotes = uiText(
                    `حلّل توزيع السبورة: ${formData.myFormation} ضد ${formData.oppFormation}. ${originalNotes ? "ملاحظة المستخدم: " + originalNotes : ""}`,
                    `Analyze the tactical board: ${formData.myFormation} against ${formData.oppFormation}. ${originalNotes ? "User note: " + originalNotes : ""}`,
                    `Analiza la pizarra táctica: ${formData.myFormation} contra ${formData.oppFormation}. ${originalNotes ? "Nota del usuario: " + originalNotes : ""}`,
                    `Analysez le tableau tactique : ${formData.myFormation} contre ${formData.oppFormation}. ${originalNotes ? "Note utilisateur : " + originalNotes : ""}`,
                  );

                  // Setup temporary sandbox analysis notes
                  setFormData((prev) => ({
                    ...prev,
                    notes: customPromptNotes,
                  }));

                  // Trigger the standard tactical generator flow sequence
                  await handleGenerateTactic();
                }}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 active:scale-[0.99] transition shadow-lg mt-2 cursor-pointer"
              >
                <Sparkles size={14} className="animate-pulse" />
                <span>
                  {uiText(
                    "حلل السبورة وأنشئ الخطة المضادة ⚡",
                    "Analyze the board and generate a counter tactic ⚡",
                    "Analiza la pizarra y genera una táctica de respuesta ⚡",
                    "Analysez le tableau et générez une tactique adaptée ⚡",
                  )}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* 7. PREMIUM PLAN BILLING MEMBERSHIP SCREEN */}
        {/* ======================================================= */}
        {screen === "subs" && (
          <div className="space-y-5 animate-fade-in pb-12">
            <div className="text-center space-y-1 py-2">
              <h2 className="text-base font-extrabold text-white">
                {t.pricingTitle}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.pricingDesc}
              </p>
            </div>
            <div className="glass-card rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-black">
                <span>
                  {uiText(
                    "الخطط المستخدمة هذا الشهر",
                    "Tactics used this month",
                    "Tácticas usadas este mes",
                    "Tactiques utilisées ce mois-ci",
                  )}
                </span>
                <span className="font-mono text-violet-300">
                  {aiUsage} / {subscription.aiMonthlyLimit}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-900 overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-emerald-400 transition-all"
                  style={{
                    width: `${Math.min(100, (aiUsage / Math.max(1, subscription.aiMonthlyLimit)) * 100)}%`,
                  }}
                />
              </div>
            </div>


            <div className="glass-card rounded-2xl p-4 space-y-3 border border-emerald-400/15 bg-emerald-500/5">
              <div className="flex items-center gap-2">
                <Crown size={16} className="text-emerald-300" />
                <h3 className="text-xs font-black text-white">
                  {uiText("توزيع مزايا Free / Pro / Elite", "Free / Pro / Elite feature map", "Mapa de planes", "Carte des offres")}
                </h3>
              </div>
              {[
                ["Free", uiText("تجربة يومية خفيفة", "Daily light trial", "Prueba diaria", "Essai quotidien"), uiText("3 خطط مضادة يوميًا • سبورة أساسية • مشاركة نصية", "3 counters/day • basic board • text share", "3 counters/día", "3 contres/jour")],
                ["Pro", uiText("قلب المنتج الحقيقي", "The real product core", "Núcleo Pro", "Cœur Pro"), uiText("خطط مضادة موسعة • بطاقات مشاركة • تحليل متقدم للسبورة • حفظ خصوم أكثر", "Expanded counter plans • Share Cards • advanced board analysis • more saved rivals", "Límites altos", "Limites élevées")],
                ["Elite", uiText("مدرب نخبة كامل", "Full elite coach", "Coach élite", "Coach élite"), uiText("أدوات موسعة • سجل تكتيكي • تقارير متقدمة • أولوية المزايا الجديدة", "Expanded tools • tactical history • advanced reports • priority features", "Casi ilimitado", "Quasi illimité")],
              ].map(([name, title, desc]) => (
                <div key={name} className="rounded-2xl border border-white/8 bg-slate-950/50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <b className="text-sm text-white">{name}</b>
                    <span className="text-[10px] font-black text-emerald-300">{title}</span>
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{desc}</p>
                </div>
              ))}
            </div>


            {/* Bronze free trial plan card */}
            <div
              className={`p-4 rounded-2xl border transition relative ${subscription.plan === "free" ? "bg-indigo-950/20 border-violet-500/40" : "bg-white/5 border-white/5"}`}
            >
              {subscription.plan === "free" && (
                <span className="absolute top-2 left-2 bg-violet-600/30 text-violet-300 font-bold px-2 py-0.5 rounded text-[8px] uppercase tracking-widest">
                  {t.activePlanBadge}
                </span>
              )}

              <h3 className="text-xs font-black text-slate-100">
                {t.freeTitle}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">{t.freeDesc}</p>

              <div className="my-3 flex items-baseline gap-1">
                <span className="text-xl font-black font-mono text-white">
                  $0
                </span>
                <span className="text-[10px] text-slate-500">
                  / {uiText("دائمًا", "forever", "para siempre", "à vie")}
                </span>
              </div>

              <div className="space-y-1.5 text-[9px] text-slate-300 mb-3">
                <div>
                  ✓{" "}
                  {uiText(
                    "تحديات يومية ونظام XP",
                    "Daily challenges and XP",
                    "Desafíos diarios y XP",
                    "Défis quotidiens et XP",
                  )}
                </div>
                <div>
                  ✓{" "}
                  {uiText(
                    "أقوى اتجاه في مركز الميتا",
                    "Top Meta Center insight",
                    "Mejor tendencia del Meta Center",
                    "Meilleure tendance Meta Center",
                  )}
                </div>
                <div>
                  ✓{" "}
                  {uiText(
                    "3 خطط مضادة يوميًا + سبورة أساسية",
                    "3 counter plans/day + basic board",
                    "Generador y pizarra básicos",
                    "Générateur et tableau de base",
                  )}
                </div>
              </div>

              {subscription.plan !== "free" && (
                <button
                  onClick={() =>
                    triggerToast(
                      uiText(
                        "تغيير الباقة سيكون متاحًا عبر الدفع الآمن قريبًا.",
                        "Plan changes will be available through secure billing soon.",
                        "Los cambios de plan estarán disponibles pronto.",
                        "Les changements d’offre seront bientôt disponibles.",
                      ),
                    )
                  }
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-extrabold py-1.5 rounded-lg text-xs"
                >
                  {uiText(
                    "الرجوع للباقة العادية",
                    "Return to free plan",
                    "Volver al plan gratuito",
                    "Retour à l’offre gratuite",
                  )}
                </button>
              )}
            </div>

            {/* Pro Boss Core Plan Tier Card */}
            <div
              className={`p-4.5 rounded-2xl border-2 transition relative ${subscription.plan === "pro" ? "bg-violet-950/35 border-violet-500 shadow-xl" : "bg-white/5 border-white/5"}`}
            >
              <span className="absolute top-2.5 left-2.5 bg-yellow-600/30 text-yellow-300 font-bold px-2 py-0.5 rounded text-[8px] uppercase tracking-widest">
                {t.bestValueBadge}
              </span>

              <h3 className="text-sm font-extrabold text-violet-400">
                {t.proTitle}
              </h3>
              <p className="text-[10px] text-slate-300 mt-1">{t.proDesc}</p>

              <div className="my-3 flex items-baseline gap-1">
                <span className="text-lg font-black text-white">
                  {uiText(
                    "قريبًا عبر دفع آمن",
                    "Coming soon with secure billing",
                    "Próximamente con pago seguro",
                    "Bientôt avec paiement sécurisé",
                  )}
                </span>
              </div>

              <div className="space-y-1.5 text-[9px] text-slate-200 mb-3">
                <div>
                  ✓{" "}
                  {uiText(
                    "خطط مضادة موسعة + بطاقات مشاركة",
                    "Expanded counter plans + Share Cards",
                    "مركز الميتا الكامل",
                    "Meta Center complet",
                  )}
                </div>
                <div>
                  ✓{" "}
                  {uiText(
                    "Deep Board Scan + خطط متقدمة",
                    "Deep Board Scan + advanced plans",
                    "Mejora de táctica e informes semanales",
                    "Développement tactique et rapports hebdomadaires",
                  )}
                </div>
                <div>
                  ✓{" "}
                  {uiText(
                    "حدود أكبر للخطط والخصوم",
                    "Higher tactic and rival limits",
                    "Límites superiores",
                    "Limites supérieures",
                  )}
                </div>
              </div>

              {subscription.plan === "pro" ? (
                <div className="bg-violet-600/10 border border-violet-500/20 p-2 rounded-xl text-center text-[10px] text-violet-300 font-bold">
                  ✓ {t.activePlanBadge} (Pro Manager)
                </div>
              ) : (
                <button
                  onClick={() => triggerToast(uiText("الإصدار الحالي مجاني، وسيتم تفعيل الدفع الآمن فقط بعد ربط المتجر.", "The current release is free. Secure billing will be enabled only after store integration.", "La versión actual es gratuita.", "La version actuelle est gratuite."))}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-extrabold py-2.5 rounded-xl text-xs border border-violet-400/30"
                >
                  {uiText(
                    "قائمة الانتظار",
                    "Join Waitlist",
                    "Lista de espera",
                    "Liste d’attente",
                  )}
                </button>
              )}
            </div>

            {/* Elite Coach Plan Card */}
            <div
              className={`p-4 rounded-2xl border transition relative ${subscription.plan === "elite" ? "bg-emerald-950/20 border-emerald-500" : "bg-white/5 border-white/5"}`}
            >
              <span className="absolute top-2 left-2 bg-emerald-600/30 text-emerald-300 font-bold px-2 py-0.5 rounded text-[8px] uppercase tracking-widest">
                {t.eliteCoachBadge}
              </span>

              <h3 className="text-xs font-black text-slate-100">
                {t.eliteTitle}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">{t.eliteDesc}</p>

              <div className="my-3 flex items-baseline gap-1">
                <span className="text-lg font-black text-white">
                  {uiText(
                    "قريبًا عبر دفع آمن",
                    "Coming soon with secure billing",
                    "Próximamente con pago seguro",
                    "Bientôt avec paiement sécurisé",
                  )}
                </span>
              </div>

              <div className="space-y-1.5 text-[9px] text-slate-300 mb-3">
                <div>
                  ✓{" "}
                  {uiText(
                    "استخدام موسع لكل الأدوات التكتيكية",
                    "Expanded usage across tactical tools",
                    "Límites de uso más altos",
                    "Limites d’utilisation maximales",
                  )}
                </div>
                <div>
                  ✓{" "}
                  {uiText(
                    "سجل تكتيكي + تقارير متقدمة",
                    "Tactical history + advanced reports",
                    "Todas las funciones Pro",
                    "Toutes les fonctions Pro",
                  )}
                </div>
                <div>
                  ✓{" "}
                  {uiText(
                    "أولوية في المزايا القادمة",
                    "Priority access to upcoming features",
                    "Acceso prioritario",
                    "Accès prioritaire",
                  )}
                </div>
              </div>

              {subscription.plan === "elite" ? (
                <div className="bg-emerald-600/10 border border-emerald-500/20 p-2 rounded-xl text-center text-[10px] text-emerald-300 font-bold">
                  ✓ {t.activePlanBadge} (Elite Coach)
                </div>
              ) : (
                <button
                  onClick={() => triggerToast(uiText("الإصدار الحالي مجاني، وسيتم تفعيل الدفع الآمن فقط بعد ربط المتجر.", "The current release is free. Secure billing will be enabled only after store integration.", "La versión actual es gratuita.", "La version actuelle est gratuite."))}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2 rounded-xl text-xs border border-emerald-400/30"
                >
                  {uiText(
                    "قائمة انتظار Elite",
                    "Join Elite Waitlist",
                    "Lista Elite",
                    "Liste Elite",
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* 8. EXPANDED SYSTEM SETTINGS & DIAGNOSTIC PANEL SCREEN */}
        {/* ======================================================= */}
        {screen === "settings" && (
          <div className="space-y-5 animate-fade-in pb-12">
            <section className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-950/35 to-slate-950/85 p-5">
              <div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-black tracking-[.18em] text-violet-300">{uiText("إعدادات التطبيق", "APP SETTINGS", "AJUSTES", "PARAMÈTRES")}</div><h2 className="mt-1 text-lg font-black text-white">{uiText("إعدادات التجربة", "Experience Settings", "Ajustes", "Paramètres")}</h2><p className="mt-1 text-[10px] leading-relaxed text-slate-400">{uiText("خصص اللعبة المفضلة، المظهر، وأمان حسابك من مكان واحد.", "Choose your preferred game, appearance and account security.", "Personaliza la experiencia.", "Personnalisez l’expérience.")}</p></div><Settings className="text-violet-300" size={23}/></div>
            </section>
            {/* Theme switcher panel */}
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3">
              <h3 className="text-xs font-extrabold text-violet-400">
                🎨{" "}
                {uiText(
                  "اختيار مظهر التطبيق",
                  "Choose app theme",
                  "Elige el tema",
                  "Choisir le thème",
                )}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => changeTheme("theme-dark")}
                  className={`p-3 rounded-xl text-xs text-right border transition ${theme === "theme-dark" ? "bg-violet-600 border-violet-500 text-white font-bold" : "bg-slate-900 border-white/5 text-slate-400"}`}
                >
                  🌑 {uiText("داكن", "Dark", "Oscuro", "Sombre")}
                </button>
                <button
                  onClick={() => changeTheme("theme-light")}
                  className={`p-3 rounded-xl text-xs text-right border transition ${theme === "theme-light" ? "bg-emerald-600 border-emerald-500 text-slate-100 font-bold" : "bg-slate-900 border-white/5 text-slate-400"}`}
                >
                  ☀️ {uiText("فاتح", "Light", "Claro", "Clair")}
                </button>
                <button
                  onClick={() => changeTheme("theme-stadium")}
                  className={`p-3 rounded-xl text-xs text-right border transition ${theme === "theme-stadium" ? "bg-yellow-600 border-yellow-500 text-white font-bold" : "bg-slate-900 border-white/5 text-slate-400"}`}
                >
                  🏟️ {uiText("الاستاد", "Stadium", "Estadio", "Stade")}
                </button>
                <button
                  onClick={() => changeTheme("theme-neon")}
                  className={`p-3 rounded-xl text-xs text-right border transition ${theme === "theme-neon" ? "bg-cyan-600 border-cyan-500 text-white font-bold" : "bg-slate-900 border-white/5 text-slate-400"}`}
                >
                  ⚡ {uiText("نيون", "Neon", "Neón", "Néon")}
                </button>
                <button
                  onClick={() => changeTheme("theme-classic")}
                  className={`p-3 rounded-xl text-xs text-right border transition ${theme === "theme-classic" ? "bg-green-700 border-white/40 text-white font-bold" : "bg-slate-900 border-white/5 text-slate-400"}`}
                >
                  ⚽ {uiText("كلاسيكي", "Classic", "Clásico", "Classique")}
                </button>
              </div>
            </div>

            {/* Profile fields customize & Cloud Sync controls */}
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs font-extrabold text-violet-400">
                  {t.userPrefsTitle}
                </h3>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold ${session?.user ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}
                >
                  {uiText(
                    "✓ بياناتك محفوظة",
                    "✓ Data saved",
                    "✓ Datos guardados",
                    "✓ Données enregistrées",
                  )}
                </span>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-400 font-bold">
                  {t.usernameLabel}
                </label>
                <input
                  type="text"
                  value={coachName}
                  maxLength={80}
                  autoComplete="name"
                  onChange={(e) => setCoachName(e.target.value)}
                  onBlur={saveProfile}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-violet-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-400 font-bold">
                  {t.favGameLabel}
                </label>
                <select
                  value={homeGameId}
                  onChange={(e) => setPreferredGame(e.target.value)}
                  onBlur={saveProfile}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-violet-600"
                >
                  {GAMES_LIST.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={saveProfile}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-bold transition text-xs"
              >
                {uiText(
                  "حفظ بيانات الحساب",
                  "Save account details",
                  "Guardar datos de la cuenta",
                  "Enregistrer le profil",
                )}
              </button>

              {session?.user && (
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <p className="text-[10px] text-slate-400">{`${uiText("البريد الإلكتروني", "Email", "Correo", "E-mail")}: ${session.user.email}`}</p>
                  <button
                    type="button"
                    onClick={requestPasswordReset}
                    className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-200 py-2.5 rounded-xl border border-cyan-400/20 font-bold transition text-xs flex items-center justify-center gap-2"
                  >
                    <KeyRound size={14}/>{uiText("تغيير كلمة المرور", "Change password", "Cambiar contraseña", "Changer le mot de passe")}
                  </button>
                  <a
                    href="/privacy.html"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-white/5 hover:bg-white/10 text-slate-300 py-2 rounded-xl border border-white/10 font-bold transition text-xs block text-center"
                  >
                    {uiText(
                      "الخصوصية واستخدام البيانات",
                      "Privacy and data use",
                      "Privacidad y uso de datos",
                      "Confidentialité et données",
                    )}
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowDangerZone((value) => !value)}
                    className="w-full bg-white/5 hover:bg-white/10 text-slate-300 py-2.5 rounded-xl border border-white/10 font-bold transition text-xs"
                  >
                    {showDangerZone ? uiText("إخفاء إعدادات الحساب المتقدمة", "Hide advanced account settings") : uiText("إعدادات الحساب المتقدمة", "Advanced account settings")}
                  </button>
                  {showDangerZone && (
                    <div className="rounded-2xl border border-red-500/25 bg-red-950/20 p-3 space-y-2">
                      <div className="text-[10px] font-black text-red-300">{uiText("المنطقة الخطرة", "Danger zone", "Zona peligrosa", "Zone dangereuse")}</div>
                      <p className="text-[9px] leading-relaxed text-slate-400">{uiText("حذف الحساب إجراء نهائي. ستظهر لك خطوة تأكيد إضافية قبل إرسال الطلب.", "Account deletion is final. An additional confirmation is required.", "La eliminación es definitiva.", "La suppression est définitive.")}</p>
                      <button onClick={handleRequestAccountDeletion} className="w-full bg-red-950/40 hover:bg-red-900/50 text-red-300 py-2.5 rounded-xl border border-red-500/30 font-bold transition text-xs">{uiText("طلب حذف الحساب والبيانات", "Request account and data deletion", "Eliminar cuenta", "Supprimer le compte")}</button>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      const sb = getSupabase();
                      if (sb) {
                        sb.auth.signOut().then(() => {
                          setSession(null);
                          clearUserState();
                          triggerToast(
                            uiText(
                              "تم تسجيل خروجك بنجاح.",
                              "Signed out successfully.",
                              "Sesión cerrada.",
                              "Déconnexion réussie.",
                            ),
                          );
                        });
                      }
                    }}
                    className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-400 py-2 rounded-xl border border-red-500/20 font-bold transition text-xs"
                  >
                    {uiText(
                      "تسجيل الخروج",
                      "Sign out",
                      "Cerrar sesión",
                      "Se déconnecter",
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {pendingConfirm && (
        <div
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <div className="w-full max-w-sm bg-slate-950 border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 animate-fade-in">
            <div className="space-y-1">
              <h2
                id="confirm-dialog-title"
                className="text-base font-black text-white"
              >
                {pendingConfirm.title}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {pendingConfirm.message}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingConfirm(null)}
                className="py-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 font-bold text-xs"
              >
                {uiText("إلغاء", "Cancel", "Cancelar", "Annuler")}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = pendingConfirm.action;
                  setPendingConfirm(null);
                  await action();
                }}
                className="py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs"
              >
                {pendingConfirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}


      {BOARD_ENABLED_SCREENS.has(screen) && screen !== "sandbox-board" && (
        <button
          type="button"
          onClick={() => setGlobalBoardOpen((v) => !v)}
          className="fixed bottom-24 right-4 z-50 rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-4 py-3 text-[11px] font-black text-cyan-100 shadow-2xl backdrop-blur-xl"
        >
          {globalBoardOpen ? uiText("إخفاء السبورة", "Hide board", "Ocultar pizarra", "Masquer le tableau") : uiText("إظهار السبورة", "Show board", "Mostrar pizarra", "Afficher le tableau")}
        </button>
      )}

      {globalBoardOpen && BOARD_ENABLED_SCREENS.has(screen) && (
        <div className="fixed inset-x-0 bottom-20 z-40 mx-auto max-w-md rounded-t-[2rem] border border-cyan-300/15 bg-slate-950/98 p-3 shadow-[0_-16px_50px_rgba(8,47,73,.55)] backdrop-blur-xl sm:max-w-lg md:max-w-xl">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-white">{uiText("السبورة التكتيكية", "Tactical board", "Pizarra inteligente", "Tableau intelligent")}</h3>
              <p className="text-[9px] text-slate-400">{uiText("حرّك اللاعبين، ثم راقب تأثير التموضع على التقييم.", "Move players and watch positioning affect the analysis.", "Mueve jugadores y revisa el análisis.", "Déplacez les joueurs et analysez.")}</p>
            </div>
            <button type="button" onClick={() => setGlobalBoardOpen(false)} className="rounded-xl border border-white/10 px-3 py-1 text-[10px] font-black text-slate-300">{uiText("إغلاق", "Close", "Cerrar", "Fermer")}</button>
          </div>
          <TacticalBoard
            formation={manualPlan.formation || formData.myFormation}
            opponentFormation={formData.oppFormation || "4-2-3-1"}
            lang={lang}
            value={manualBoardState || boardState || buildGameAwareBoard(homeGameId, manualPlan.formation || formData.myFormation, formData.oppFormation || "4-2-3-1")}
            onChange={(next) => { setManualBoardState(next); setBoardState(next); }}
            showOpponent={screen !== "manual-builder"}
            compact
          />
          <div className="mt-2 rounded-xl border border-white/8 bg-white/[0.04] p-2 text-[10px] leading-relaxed text-slate-300">
            {analyzeManualBoardShape(manualBoardState || boardState).notes[0]}
          </div>
        </div>
      )}

      {/* ثابت في كل الشاشات: وصول فوري للمسارات الأساسية */}
      <nav className="fixed bottom-0 left-1/2 z-50 flex h-[70px] w-full max-w-md -translate-x-1/2 items-center justify-around rounded-t-[1.6rem] border-t border-cyan-300/10 bg-slate-950/95 px-1 shadow-[0_-12px_38px_rgba(2,6,23,.6)] backdrop-blur-xl sm:max-w-lg md:max-w-xl" aria-label={uiText("التنقل الرئيسي", "Main navigation")}>
        <button onClick={() => { setStep(1); setScreen("home"); }} className={`flex h-full min-w-14 flex-col items-center justify-center gap-1 text-[9px] font-black transition ${screen === "home" ? "text-cyan-300" : "text-slate-500 hover:text-white"}`} id="tab-home"><Gamepad2 size={19}/><span>{t.navHome}</span></button>
        <button onClick={startCounterOpponent} className={`flex h-full min-w-14 flex-col items-center justify-center gap-1 text-[9px] font-black transition ${generatorMode === "counter" && ["select-game","generator","result"].includes(screen) ? "text-violet-300" : "text-slate-500 hover:text-white"}`} id="tab-counter"><Sword size={19}/><span>{uiText("خصمك","Counter","Rival","Rival")}</span></button>
        <button onClick={startManualBuilder} className={`-mt-5 flex h-14 w-14 flex-col items-center justify-center rounded-2xl border border-emerald-300/25 bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-950/40 transition active:scale-95 ${screen === "manual-builder" ? "ring-2 ring-white/40" : ""}`} id="tab-builder"><SlidersHorizontal size={21}/><span className="mt-0.5 text-[8px] font-black">{uiText("ابنِ","Build","Crear","Créer")}</span></button>
        <button onClick={() => setScreen("library")} className={`flex h-full min-w-14 flex-col items-center justify-center gap-1 text-[9px] font-black transition ${screen === "library" ? "text-cyan-300" : "text-slate-500 hover:text-white"}`} id="tab-library"><Library size={19}/><span>{t.navLibrary}</span></button>
        <button onClick={() => setScreen("settings")} className={`flex h-full min-w-14 flex-col items-center justify-center gap-1 text-[9px] font-black transition ${screen === "settings" ? "text-cyan-300" : "text-slate-500 hover:text-white"}`} id="tab-settings"><Settings size={19}/><span>{uiText("الإعدادات","Settings","Ajustes","Réglages")}</span></button>
      </nav>
    </div>
  );
}
