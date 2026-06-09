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
  Dribbble,
  Languages,
  Brain,
  Sparkles,
  CalendarDays,
  ChevronDown,
  Camera,
  BarChart3,
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
import GrowthHub from "./components/GrowthHub";
import MetaCenter from "./components/MetaCenter";
import AIScreenshotAnalyzer from "./components/AIScreenshotAnalyzer";
import AIMatchAnalyst from "./components/AIMatchAnalyst";
import CommunityLite from "./components/CommunityLite";
import CoachCareer from "./components/CoachCareer";
import ScoutCenter from "./components/ScoutCenter";
import {
  MatchAnalysisResult,
  ScreenshotAnalysisResult,
} from "./utils/aiAnalysisEngine";
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
  const [screen, setScreen] = useState<string>("home");

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
    normalizeGameId(localStorage.getItem("tb_home_game_id")),
  );

  // Stepper stage indicator: 1, 2, 3, 4
  const [step, setStep] = useState<number>(1);
  const [generatorMode, setGeneratorMode] = useState<"build" | "counter">(
    "counter",
  );
  const [efootballPlaystyleFilter, setEfootballPlaystyleFilter] =
    useState<string>("all");
  const [showAdvancedPlan, setShowAdvancedPlan] = useState(false);
  const [showInstructionDetails, setShowInstructionDetails] = useState(false);
  const [showDefenceDetails, setShowDefenceDetails] = useState(false);
  const [showAttackDetails, setShowAttackDetails] = useState(false);
  const [showOpponentOnBoard, setShowOpponentOnBoard] = useState(true);
  const [analyzeMode, setAnalyzeMode] = useState<"match" | "screenshot">(
    "match",
  );

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
  const [cloudMeta, setCloudMeta] = useState<MetaItem[]>([]);
  const [screenshotAnalyses, setScreenshotAnalyses] = useState<
    ScreenshotAnalysisResult[]
  >([]);
  const [matchAnalyses, setMatchAnalyses] = useState<MatchAnalysisResult[]>([]);
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
    setShowOpponentOnBoard(true);
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
    setSelectedGame(null);
    setStep(1);
    setScreen("select-game");
  };

  const startCounterOpponent = () => {
    resetToolWorkspace();
    setGeneratorMode("counter");
    setSelectedGame(null);
    setFormData({
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
    setStep(1);
    setScreen("select-game");
  };

  const startAnalyzeMyMatch = () => {
    resetToolWorkspace();
    setAnalyzeMode("match");
    setScreen("match-analyst");
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
        "زر الشراء جاهز. اربطه بمنتج Google Play Billing قبل الرفع النهائي.",
        "Purchase action is ready. Connect it to Google Play Billing product IDs before final upload.",
        "Acción de compra lista.",
        "Action d’achat prête.",
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
  const [coachQuestion, setCoachQuestion] = useState("");
  const [coachTips, setCoachTips] = useState<string[]>([]);
  const [coachTipsLoading, setCoachTipsLoading] = useState(false);
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
    // This catches cached/fallback rules and AI replies that still contain Arabic snippets.
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
        myStyle: manager.primaryPlaystyle,
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
    const matchState = `${formData.matchState || ""}`.toLowerCase();
    const chasing = /متأخر|خسر|trailing|need goal|هدف/.test(matchState);

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
      line <= 4
        ? uiText("دفاع شامل", "All-out Defence", "Repliegue", "Défense totale")
        : uiText(
            "ضغط من الأمام",
            "Frontline Pressure",
            "Presión alta",
            "Pressing haut",
          );
    const pressuring = againstFastCounter
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
            [uiText("Counter Target", "Counter Target", "Objetivo contraataque", "Cible de contre"), `${uiText("على", "on", "en", "sur")}: ${strikerTarget}`],
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
    const style = cleanTacticText(
      manager?.primaryPlaystyle ||
        formData.myStyle ||
        currentResult?.attackingStyle ||
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
    setScreenshotAnalyses(
      readJson<ScreenshotAnalysisResult[]>(
        scopedKey("screenshot_analyses", userId),
        [],
      ),
    );
    setMatchAnalyses(
      readJson<MatchAnalysisResult[]>(scopedKey("match_analyses", userId), []),
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
    setScreenshotAnalyses([]);
    setMatchAnalyses([]);
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

  const syncScreenshotAnalyses = (newList: ScreenshotAnalysisResult[]) => {
    setScreenshotAnalyses(newList);
    if (session?.user?.id)
      localStorage.setItem(
        scopedKey("screenshot_analyses", session.user.id),
        JSON.stringify(newList),
      );
  };

  const syncMatchAnalyses = (newList: MatchAnalysisResult[]) => {
    setMatchAnalyses(newList);
    if (session?.user?.id)
      localStorage.setItem(
        scopedKey("match_analyses", session.user.id),
        JSON.stringify(newList),
      );
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
      if (sb)
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
  };

  const openChallengeAction = (activity: ActivityType) => {
    if (activity === "improve") return setScreen("improve-tactic");
    if (activity === "rival") return setScreen("rivals");
    if (activity === "save" && currentResult) return setScreen("result");
    setSelectedGame(null);
    setStep(1);
    setScreen("select-game");
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
    } = sb.auth.onAuthStateChange((_event, activeSession) => {
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
            "موثقة من Meta Center",
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
          setFavGame(profile.favorite_game);
          localStorage.setItem("tb_fav_game", profile.favorite_game);
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

      const { data: cloudScreens } = await sb
        .from("screenshot_analyses")
        .select("result_data, created_at")
        .eq("user_id", activeSession.user.id)
        .order("created_at", { ascending: false })
        .limit(25);
      if (cloudScreens?.length) {
        const mappedScreens = cloudScreens
          .map((row: any) => ({
            ...row.result_data,
            createdAt: row.result_data?.createdAt || row.created_at,
          }))
          .filter(Boolean);
        setScreenshotAnalyses(mappedScreens);
        localStorage.setItem(
          scopedKey("screenshot_analyses", activeSession.user.id),
          JSON.stringify(mappedScreens),
        );
      }

      const { data: cloudMatches } = await sb
        .from("match_analyses")
        .select("result_data, created_at")
        .eq("user_id", activeSession.user.id)
        .order("created_at", { ascending: false })
        .limit(25);
      if (cloudMatches?.length) {
        const mappedMatches = cloudMatches
          .map((row: any) => ({
            ...row.result_data,
            createdAt: row.result_data?.createdAt || row.created_at,
          }))
          .filter(Boolean);
        setMatchAnalyses(mappedMatches);
        localStorage.setItem(
          scopedKey("match_analyses", activeSession.user.id),
          JSON.stringify(mappedMatches),
        );
      }
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
          favorite_game: favGame,
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
      const c = chooseCounterPlan(
        selectedGame?.id,
        formData.oppFormation,
        formData.opponentStyle,
        formData.matchState,
      );
      updateGeneratorForm({ myFormation: c.formation, myStyle: c.style }, true);
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
      setStep(1);
      setScreen("select-game");
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
        "AI request tracking unavailable; generated result kept:",
        insertError.message,
      );
      return fallback();
    } catch (error) {
      console.warn(
        "AI request tracking temporarily unavailable; generated result kept:",
        error,
      );
      return fallback();
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
      const autoCounter = chooseCounterPlan(
        selectedGame.id,
        formData.oppFormation,
        formData.opponentStyle,
        formData.matchState,
      );
      const modeAwareForm =
        generatorMode === "build"
          ? {
              ...formData,
              opponentStyle: uiText(
                "بناء خطة المستخدم الخاصة",
                "Build user-owned tactic",
                "Crear táctica propia",
                "Créer sa propre tactique",
              ),
              notes: `${formData.notes} | MODE: BUILD_MY_TACTIC`,
            }
          : {
              ...formData,
              myFormation: autoCounter.formation,
              myStyle: autoCounter.style,
              notes: `${formData.notes} | AUTO_COUNTER:${formData.oppFormation}:${formData.opponentStyle}:${formData.matchState}`,
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
      const finalResult = { ...boardAwareResult, boardAnalysis: boardInsights };
      if (isEfootballGame(selectedGame.id)) {
        const manager =
          getEfootballManager(formData.efootballManagerId) ||
          efootballManagers[0];
        setBoardState(
          buildEfootballManagerBoard(
            finalResult.formation,
            formData.oppFormation,
            manager,
          ),
        );
      } else {
        setBoardState(
          buildGameAwareBoard(
            selectedGame.id,
            finalResult.formation,
            formData.oppFormation,
          ),
        );
      }
      const requestPayload = {
        game: selectedGame.name,
        game_id: selectedGame.id,
        generator_mode: generatorMode,
        ...modeAwareForm,
        board: boardState,
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
            provider: "boss_coins_credit_v62",
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

      setCurrentResult(finalResult);
      setCoachQuestion("");
      setCoachTips([]);
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

  const fallbackCoachTips = () => {
    const style = cleanTacticText(
      currentResult?.attackingStyle || formData.myStyle || "",
    );
    const formation = cleanTacticText(
      currentResult?.formation || formData.myFormation || "",
    );
    const note = (coachQuestion || "").toLowerCase();
    const noteTips = [] as string[];
    if (/طرف|جناح|wide|wing|flank/.test(note))
      noteTips.push(
        uiText(
          "بما أن ملاحظتك عن الطرف: ضع Defensive على الظهير المقابل، ولا تضف Counter Target إلا على جناح واحد سريع.",
          "Because your note is about wide danger: put Defensive on the matching fullback, and use Counter Target on only one fast winger.",
          "Defiende banda.",
          "Défendez le côté.",
        ),
      );
    if (/ضغط|press|pressing/.test(note))
      noteTips.push(
        uiText(
          "بما أن المشكلة ضغط: قلّل التمرير في العمق أول 15 دقيقة واستخدم لاعب محطة أو تمرير مباشر حسب اللعبة.",
          "Because the issue is pressure: reduce central buildup for 15 minutes and use a target outlet or direct pass depending on the game.",
          "Contra presión.",
          "Contre pressing.",
        ),
      );
    if (/سرع|pace|fast|سريع/.test(note))
      noteTips.push(
        uiText(
          "بما أن الخصم سريع: لا ترفع خط الدفاع، وفي eFootball ضع Deep Line على DMF فقط.",
          "Because the rival is fast: do not raise the line; in eFootball put Deep Line on DMF only.",
          "Rival rápido.",
          "Adversaire rapide.",
        ),
      );
    const base =
      generatorMode === "counter"
        ? [
            uiText(
              `ابدأ بـ ${formation} ولا تغيّرها أول 15 دقيقة إلا لو استقبلت هدفًا.`,
              `Start with ${formation}; do not change for the first 15 minutes unless you concede.`,
              `Empieza con ${formation}.`,
              `Commencez avec ${formation}.`,
            ),
            uiText(
              "راقب أول تمريرتين للخصم بعد فقدانه الكرة؛ منها ستعرف هل الخطة تحتاج ضغط أم تهدئة.",
              "Watch the opponent first two passes after losing the ball; they tell you whether to press or slow down.",
              "Observa los primeros pases.",
              "Observez les premières passes.",
            ),
            uiText(
              "لو الخصم يهاجم من الأطراف، فعّل التعليمات الدفاعية فقط ولا تزود تعليمات هجومية إضافية.",
              "If the rival attacks wide, apply defensive instructions only; do not add extra attacking instructions.",
              "Si ataca por bandas, defiende.",
              "S’il attaque sur les ailes, défendez.",
            ),
          ]
        : [
            uiText(
              `التزم بأسلوب ${style || "الخطة"} ولا تجمع بين ضغط عالي ودفاع منخفض في نفس الخطة.`,
              `Commit to ${style || "the style"}; do not mix high press and low block in one plan.`,
              `Mantén el estilo.`,
              `Gardez le style.`,
            ),
            uiText(
              "اختبر الخطة مباراة واحدة كاملة قبل تعديل القيم، ولا تغيّر أكثر من إعدادين في نفس الوقت.",
              "Test the plan for a full match before tweaking values; never change more than two settings at once.",
              "Prueba una partida.",
              "Testez un match.",
            ),
            uiText(
              "لو فقدت السيطرة في الوسط، غيّر التشكيلة أولًا قبل تغيير التعليمات المتقدمة.",
              "If you lose midfield control, change the shape before changing advanced instructions.",
              "Cambia formación primero.",
              "Changez le système d’abord.",
            ),
          ];
    return [...noteTips, ...base].slice(0, 5);
  };

  const askAiCoachForTips = async () => {
    if (!currentResult || coachTipsLoading) return;
    setCoachTipsLoading(true);
    try {
      const payload = {
        lang,
        mode: generatorMode,
        game: selectedGame?.name,
        gameId: selectedGame?.id,
        formation: currentResult.formation,
        style: currentResult.attackingStyle || formData.myStyle,
        opponentFormation: formData.oppFormation,
        opponentStyle: formData.opponentStyle,
        matchState: formData.matchState,
        userNote: coachQuestion,
        allowedOnly: true,
      };
      const runtimeCoachEndpoint =
        ((window as any).__TACTIC_BOSS_AI__?.coachEndpoint as string | undefined) ||
        localStorage.getItem("tb_ai_coach_endpoint") ||
        "/.netlify/functions/tactical-coach";
      const res = await fetch(runtimeCoachEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`coach ${res.status}`);
      const data = await res.json();
      const tips = Array.isArray(data?.tips)
        ? data.tips
            .map((x: unknown) => cleanTacticText(String(x)))
            .filter(Boolean)
            .slice(0, 5)
        : [];
      setCoachTips(tips.length ? tips : fallbackCoachTips());
    } catch (error) {
      console.warn("AI coach tips fallback:", error);
      setCoachTips(fallbackCoachTips());
    } finally {
      setCoachTipsLoading(false);
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
    setBoardState(developmentBoard);
    setCurrentResult(developmentResult.tactic);
    setScreen("result");
  };

  const recordScreenshotAnalysis = async (
    analysis: ScreenshotAnalysisResult,
    _imageDataUrl?: string,
  ) => {
    const dailyLimit =
      subscription.plan === "elite"
        ? 999
        : subscription.plan === "pro"
          ? 20
          : 1;
    if (countToday(screenshotAnalyses) >= dailyLimit) {
      setScreen("subs");
      return false;
    }
    const compactAnalysis = {
      ...analysis,
      imageName: analysis.imageName.slice(0, 80),
    };
    const tracking = await trackAiRequestBestEffort(
      "screenshot_analyzer",
      selectedGame?.name || homeGameId,
      "local_first_compact_v64",
      {
        mode: analysis.mode,
        image_name: compactAnalysis.imageName,
        has_preview: false,
        storage: "local_only",
      },
      compactAnalysis,
    );
    if (tracking.blocked) {
      setScreen("subs");
      return false;
    }
    const historyLimit =
      subscription.plan === "elite"
        ? 200
        : subscription.plan === "pro"
          ? 100
          : 10;
    const next = [
      compactAnalysis,
      ...screenshotAnalyses.filter((item) => item.id !== analysis.id),
    ].slice(0, historyLimit);
    syncScreenshotAnalyses(next);
    awardActivity("screenshot_analysis");
    triggerToast(
      uiText(
        "تم تحليل الصورة وحفظ التقرير بنجاح.",
        "Image analyzed and report saved.",
        "Imagen analizada y reporte guardado.",
        "Image analysée et rapport enregistré.",
      ),
    );
    return true;
  };

  const autofillFromScreenshot = (analysis: ScreenshotAnalysisResult) => {
    const game =
      selectedGame ||
      GAMES_LIST.find((g) => g.id === homeGameId) ||
      GAMES_LIST[0];
    setSelectedGame(game);
    setFormData((prev) => ({
      ...prev,
      myFormation: analysis.generatorAutofill.myFormation || prev.myFormation,
      oppFormation:
        analysis.generatorAutofill.oppFormation || prev.oppFormation,
      myStyle: analysis.generatorAutofill.myStyle || prev.myStyle,
      opponentStyle:
        analysis.generatorAutofill.opponentStyle || prev.opponentStyle,
      notes: [prev.notes, analysis.generatorAutofill.notes]
        .filter(Boolean)
        .join("\n"),
    }));
    setStep(3);
    setScreen("generator");
  };

  const recordMatchAnalysis = async (
    analysis: MatchAnalysisResult,
    _imageDataUrl?: string,
  ) => {
    const dailyLimit =
      subscription.plan === "elite"
        ? 999
        : subscription.plan === "pro"
          ? 10
          : 1;
    if (countToday(matchAnalyses) >= dailyLimit) {
      setScreen("subs");
      return false;
    }
    const compactAnalysis = {
      ...analysis,
      imageName: analysis.imageName.slice(0, 80),
      storagePolicy: "local_first" as const,
    };
    const wantsCloud = false;
    const tracking = await trackAiRequestBestEffort(
      "match_analyst",
      selectedGame?.name || homeGameId,
      "match_context_score_v64",
      {
        scoreline: analysis.scoreline,
        image_name: compactAnalysis.imageName,
        has_preview: false,
        storage: wantsCloud ? "cloud_text_only" : "local_only",
        coach_score: analysis.coachScore,
      },
      compactAnalysis,
    );
    if (tracking.blocked) {
      setScreen("subs");
      return false;
    }
    const historyLimit =
      subscription.plan === "elite"
        ? 200
        : subscription.plan === "pro"
          ? 100
          : 10;
    const next = [
      compactAnalysis,
      ...matchAnalyses.filter((item) => item.id !== analysis.id),
    ].slice(0, historyLimit);
    syncMatchAnalyses(next);
    if (wantsCloud) {
      const sb = getSupabase();
      if (sb && session?.user)
        sb.from("match_analyses")
          .insert({
            user_id: session.user.id,
            image_name: compactAnalysis.imageName,
            result_data: compactAnalysis,
            image_preview: null,
          })
          .then(({ error }) => {
            if (error)
              console.warn("Match analysis cloud save pending:", error.message);
          });
    }
    awardActivity("match_analysis");
    triggerToast(
      uiText(
        "تم التحليل وحفظ التقرير بنجاح.",
        "Analysis completed and report saved.",
        "Análisis completado y reporte guardado.",
        "Analyse terminée et rapport enregistré.",
      ),
    );
    return true;
  };

  const createPlanFromMatchAnalysis = (analysis: MatchAnalysisResult) => {
    const game =
      selectedGame ||
      GAMES_LIST.find((g) => g.id === homeGameId) ||
      GAMES_LIST[0];
    setSelectedGame(game);
    setFormData((prev) => ({
      ...prev,
      myFormation: analysis.recommendedFormation,
      myStyle: uiText("متوازن", "Balanced", "Equilibrado", "Équilibré"),
      efootballManagerId: formData.efootballManagerId,
      matchState: uiText(
        "بعد تحليل المباراة",
        "After match analysis",
        "Tras análisis del partido",
        "Après analyse du match",
      ),
      notes: [
        prev.notes,
        analysis.diagnosis.join(" "),
        analysis.counterStrategy,
        analysis.recommendations.join(" "),
      ]
        .filter(Boolean)
        .join("\n"),
    }));
    setStep(4);
    setScreen("generator");
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
    setBoardState(
      isEfootballGame(game.id)
        ? buildEfootballManagerBoard(
            item.formation,
            opponentFormation,
            selectedEfootballManager,
          )
        : buildGameAwareBoard(game.id, item.formation, opponentFormation),
    );
    setCurrentResult(readyResult);
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
        input_data: { ...formData, board: boardState },
        result_data: currentResult,
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
      result: currentResult,
      board: boardState,
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

  // Share a localized tactic summary using the native share sheet when available.
  const shareTacticInfo = async () => {
    if (!currentResult) return;
    const shareText = `⚽ ${t.appName} - ${selectedGame?.name || ""} ⚽
👉 ${t.yourFormationLabel}: ${currentResult.formation}
🛡️ ${t.defensiveSettingsTitle}: ${currentResult.defensiveStyle}
⚔️ ${t.attackingSettingsTitle}: ${currentResult.attackingStyle}
🧠 ${t.playerInstructionsTitle}:
${currentResult.playerInstructions.map((i) => `• ${i}`).join("\n")}
🔥 ${t.gameplayStrategyTitle}: ${currentResult.inGameStrategy}
- ${t.confidenceTitle}: ${currentResult.confidence}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${t.appName} — ${currentResult.formation}`,
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
      }
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
      triggerToast(
        uiText(
          "الخطة جاهزة للمشاركة.",
          "Tactic ready to share.",
          "Táctica lista para compartir.",
          "Tactique prête à partager.",
        ),
      );
    } catch (error: any) {
      if (String(error?.name || "") !== "AbortError")
        triggerToast(
          uiText(
            "تعذر مشاركة الخطة الآن.",
            "Could not share the tactic now.",
            "No se pudo compartir la táctica.",
            "Impossible de partager la tactique.",
          ),
        );
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

  if (!authReady) {
    return (
      <div
        className="min-h-screen bg-[#05080e] text-white grid place-items-center"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-violet-500/20 border-t-emerald-400 animate-spin" />
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

  return (
    <div
      className={`${theme} min-h-screen text-[var(--text-main)] transition-colors duration-300 relative overflow-x-hidden pb-32 font-sans`}
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
        {/* Localization & Theme Ribbon bar */}
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/5 text-xs text-slate-400">
          <label className="relative flex-1 max-w-[230px]">
            <Gamepad2
              size={13}
              className="absolute top-1/2 -translate-y-1/2 right-2 text-emerald-400 pointer-events-none"
            />
            <select
              aria-label={uiText(
                "اختيار اللعبة",
                "Choose game",
                "Elegir juego",
                "Choisir le jeu",
              )}
              value={homeGameId}
              onChange={(e) => {
                const nextGameId = normalizeGameId(e.target.value);
                setHomeGameId(nextGameId);
                localStorage.setItem("tb_home_game_id", nextGameId);
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
              {screen === "generator" && `${t.inputsHeader} (${step}/4)`}
              {screen === "result" && t.resultsHeader}
              {screen === "library" && t.libraryTitle}
              {screen === "rivals" && t.rivalsTitle}
              {screen === "subs" && t.pricingTitle}
              {screen === "settings" && t.settingsTitle}
              {screen === "meta-center" && "Meta Center"}
              {screen === "progression" &&
                uiText(
                  "التقدم والتحديات",
                  "Progress & Challenges",
                  "Progreso y desafíos",
                  "Progression et défis",
                )}
              {screen === "screenshot-analyzer" && "Screenshot Analyzer"}
              {screen === "match-analyst" && "AI Match Analyst"}
              {screen === "community" &&
                uiText(
                  "خطط المجتمع",
                  "Community Tactics",
                  "Tácticas de la comunidad",
                  "Tactiques communautaires",
                )}
            </div>

            <div className="w-7 h-7 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center font-mono text-[10px] font-bold text-violet-400">
              {coachName.substring(0, 2).toUpperCase()}
            </div>
          </div>
        )}

        {/* PROGRESSIVE FULL LOADING PAGE */}
        {isLoading && (
          <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center p-6 text-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Pulsing neon soccer ball animation */}
            <div className="w-24 h-24 rounded-full border-4 border-dashed border-violet-500 flex items-center justify-center animate-spin mb-8 relative">
              <Gamepad2
                size={36}
                className="text-violet-400 animate-pulse rotate-45"
              />
              <div className="absolute inset-2 rounded-full border border-violet-500/40" />
            </div>

            <div className="space-y-4 max-w-sm">
              <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-indigo-100 to-emerald-300">
                {t.generatingTitle}
              </h2>

              <div className="space-y-2 py-4">
                {/* Loader status progressive state updates */}
                <div
                  className={`text-xs transition-all duration-300 ${loadingStep >= 1 ? "text-emerald-400 font-semibold" : "text-slate-500"}`}
                >
                  {uiText(
                    "✓ تحليل أسلوب الخصم...",
                    "✓ Analyzing opponent playstyle...",
                    "✓ Analizando el estilo rival...",
                    "✓ Analyse du style adverse...",
                  )}
                </div>
                <div
                  className={`text-xs transition-all duration-300 ${loadingStep >= 2 ? "text-emerald-400 font-semibold" : "text-slate-500"}`}
                >
                  {uiText(
                    "✓ اختيار التشكيل المضاد...",
                    "✓ Selecting the counter formation...",
                    "✓ Eligiendo la formación de contra...",
                    "✓ Sélection de la formation de contre...",
                  )}
                </div>
                <div
                  className={`text-xs transition-all duration-300 ${loadingStep >= 3 ? "text-emerald-400 font-semibold" : "text-slate-500"}`}
                >
                  {uiText(
                    "✓ تجهيز تعليمات اللاعبين...",
                    "✓ Preparing player instructions...",
                    "✓ Preparando instrucciones...",
                    "✓ Préparation des consignes...",
                  )}
                </div>
                <div
                  className={`text-xs transition-all duration-300 ${loadingStep >= 4 ? "text-yellow-400 font-extrabold animate-pulse" : "text-slate-500"}`}
                >
                  {uiText(
                    "⚽ الخطة جاهزة!",
                    "⚽ Tactic ready!",
                    "⚽ ¡Táctica lista!",
                    "⚽ Tactique prête !",
                  )}
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
          <div className="space-y-4 pt-2 pb-6 animate-fade-in">
            <div className="text-center py-3 relative">
              <div className="inline-flex items-center gap-2 mb-2 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full text-[10px] font-bold text-violet-200 max-w-full">
                <Flame size={11} className="text-rose-500" />
                <span className="truncate">
                  {coachName} • {favGame}
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-indigo-100 to-emerald-400">
                TACTIC BOSS{" "}
                <span className="font-mono text-violet-500">AI</span>
              </h1>
              <p className="text-slate-400 mt-1 text-[11px] leading-relaxed max-w-sm mx-auto px-4">
                {uiText(
                  "اختار طريقك التكتيكي وابدأ فورًا.",
                  "Choose your tactical path and start instantly.",
                  "Elige tu ruta táctica y empieza.",
                  "Choisissez votre voie tactique et démarrez.",
                )}
              </p>
            </div>

            <button
              onClick={() => setScreen("progression")}
              className="w-full rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2.5 flex items-center justify-between gap-3 text-right hover:bg-white/[0.07] transition"
            >
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <span className="font-black text-white">
                  Lv {currentLevel.level}
                </span>
                <span className="text-slate-500">•</span>
                <span>
                  XP {progression.xp}/{currentLevel.nextLevelXp}
                </span>
                <span className="text-slate-500">•</span>
                <span>{progression.streak || 0} 🔥</span>
              </div>
              <span className="text-[10px] text-violet-300 font-bold">
                {uiText(
                  "عرض التقدم",
                  "View progress",
                  "Ver progreso",
                  "Voir progression",
                )}
              </span>
            </button>

            <div className="space-y-3">
              <button
                onClick={startBuildMyTactic}
                className="group w-full rounded-3xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-600 p-[1px] shadow-2xl shadow-emerald-900/20"
              >
                <div className="rounded-3xl bg-gradient-to-r from-emerald-500/90 via-cyan-500/70 to-violet-600/90 px-5 py-4 flex items-center justify-between gap-4 text-right">
                  <div className="h-12 w-12 rounded-2xl bg-white/12 border border-white/15 flex items-center justify-center shrink-0">
                    <Sparkles size={23} className="text-amber-200" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-white">
                      {uiText(
                        "ابنِ خطتي",
                        "Build My Tactic",
                        "Crear mi táctica",
                        "Créer ma tactique",
                      )}
                    </h3>
                    <p className="text-[12px] text-white/80 mt-1 leading-relaxed">
                      {uiText(
                        "رتّب مراكزك وخلي الذكاء يبني لك أفضل خطة.",
                        "Set your squad and let AI build your best tactic.",
                        "Ordena tu equipo y deja que la IA construya.",
                        "Organisez votre équipe et laissez l’IA créer.",
                      )}
                    </p>
                  </div>
                  <ChevronLeft
                    size={18}
                    className="text-white/80 group-hover:-translate-x-1 transition"
                  />
                </div>
              </button>

              <button
                onClick={startCounterOpponent}
                className="group w-full rounded-3xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 p-[1px] shadow-2xl shadow-violet-900/20"
              >
                <div className="rounded-3xl bg-gradient-to-r from-violet-600/95 via-fuchsia-600/70 to-indigo-600/95 px-5 py-4 flex items-center justify-between gap-4 text-right">
                  <div className="h-12 w-12 rounded-2xl bg-white/12 border border-white/15 flex items-center justify-center shrink-0">
                    <Zap size={23} className="text-yellow-200" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-white">
                      {uiText(
                        "اضرب الخصم",
                        "Counter Opponent",
                        "Contrarrestar rival",
                        "Contrer l’adversaire",
                      )}
                    </h3>
                    <p className="text-[12px] text-white/80 mt-1 leading-relaxed">
                      {uiText(
                        "حلّل أسلوب الخصم وخذ خطة مضادة جاهزة.",
                        "Read the rival and get a ready counter plan.",
                        "Lee al rival y recibe una contra lista.",
                        "Analysez l’adversaire et obtenez un contre.",
                      )}
                    </p>
                  </div>
                  <ChevronLeft
                    size={18}
                    className="text-white/80 group-hover:-translate-x-1 transition"
                  />
                </div>
              </button>

              <button
                onClick={startAnalyzeMyMatch}
                className="group w-full rounded-3xl bg-gradient-to-r from-cyan-500 via-sky-600 to-slate-800 p-[1px] shadow-2xl shadow-cyan-900/20"
              >
                <div className="rounded-3xl bg-gradient-to-r from-cyan-500/85 via-sky-700/75 to-slate-900 px-5 py-4 flex items-center justify-between gap-4 text-right">
                  <div className="h-12 w-12 rounded-2xl bg-white/12 border border-white/15 flex items-center justify-center shrink-0">
                    <BarChart3 size={23} className="text-cyan-100" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-white">
                      {uiText(
                        "حلّل المباراة",
                        "Analyze Match",
                        "Analizar partido",
                        "Analyser le match",
                      )}
                    </h3>
                    <p className="text-[12px] text-white/80 mt-1 leading-relaxed">
                      {uiText(
                        "صورة تشكيل أو نتيجة أو إحصائيات داخل صفحة واحدة.",
                        "Formation, result or stats screenshot in one tool.",
                        "Formación, resultado o estadísticas en una herramienta.",
                        "Formation, résultat ou stats dans un outil.",
                      )}
                    </p>
                  </div>
                  <ChevronLeft
                    size={18}
                    className="text-white/80 group-hover:-translate-x-1 transition"
                  />
                </div>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setScreen("meta-center")}
                className="rounded-2xl border border-rose-400/15 bg-rose-950/15 p-3 text-right hover:bg-rose-500/10 transition"
              >
                <div className="text-[10px] font-black text-rose-300">
                  {uiText(
                    "ميتا اليوم",
                    "Today’s Meta",
                    "Meta de hoy",
                    "Méta du jour",
                  )}
                </div>
                <div className="mt-1 text-2xl font-black text-white font-mono">
                  {currentMeta?.[0]?.formation || "4-2-3-1"}
                </div>
                <div className="mt-1 text-[10px] text-slate-400">
                  {uiText(
                    "خطة جاهزة للاستخدام",
                    "Ready plan",
                    "Plan listo",
                    "Plan prêt",
                  )}
                </div>
              </button>
              <button
                onClick={() => setScreen("progression")}
                className="rounded-2xl border border-violet-400/15 bg-violet-950/15 p-3 text-right hover:bg-violet-500/10 transition"
              >
                <div className="text-[10px] font-black text-violet-300">
                  {uiText(
                    "تحدي اليوم",
                    "Daily Challenge",
                    "Desafío diario",
                    "Défi quotidien",
                  )}
                </div>
                <div className="mt-1 text-2xl font-black text-white">
                  {
                    currentChallenges.filter((c) =>
                      progression.completedChallengeIds.includes(c.id),
                    ).length
                  }
                  /{currentChallenges.length}
                </div>
                <div className="mt-1 text-[10px] text-slate-400">
                  {uiText(
                    "ارفع مستواك يوميًا",
                    "Level up daily",
                    "Sube de nivel",
                    "Progressez",
                  )}
                </div>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setScreen("community")}
                className="rounded-2xl bg-white/[0.04] border border-white/5 p-3 text-center hover:bg-white/[0.08]"
              >
                <Users size={18} className="mx-auto text-cyan-300" />
                <div className="mt-2 text-[10px] text-slate-200 font-bold">
                  {uiText("المجتمع", "Community", "Comunidad", "Communauté")}
                </div>
              </button>
              <button
                onClick={() => {
                  resetToolWorkspace();
                  setScreen("sandbox-board");
                }}
                className="rounded-2xl bg-white/[0.04] border border-white/5 p-3 text-center hover:bg-white/[0.08]"
              >
                <Target size={18} className="mx-auto text-amber-300" />
                <div className="mt-2 text-[10px] text-slate-200 font-bold">
                  {uiText("السبورة", "Board", "Pizarra", "Tableau")}
                </div>
              </button>
            </div>
          </div>
        )}

        {screen === "meta-center" && (
          <div className="space-y-4 animate-fade-in pb-16">
            <label className="block space-y-1">
              <span className="text-[10px] font-bold text-slate-400">
                {uiText(
                  "اختر اللعبة لعرض الميتا",
                  "Choose game for meta insights",
                  "Elige el juego para ver el meta",
                  "Choisissez le jeu pour voir la méta",
                )}
              </span>
              <select
                value={homeGameId}
                onChange={(e) => {
                  const nextGameId = normalizeGameId(e.target.value);
                  setHomeGameId(nextGameId);
                  localStorage.setItem("tb_home_game_id", nextGameId);
                }}
                className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-rose-500"
              >
                {GAMES_LIST.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.name}
                  </option>
                ))}
              </select>
            </label>
            <MetaCenter
              lang={lang}
              items={currentMeta}
              gameName={
                GAMES_LIST.find((g) => g.id === homeGameId)?.name || homeGameId
              }
              premium={subscription.plan !== "free"}
              onUse={useMetaItem}
            />
          </div>
        )}

        {screen === "progression" && (
          <div className="space-y-4 animate-fade-in pb-16">
            <CoachCareer
              lang={lang}
              coachName={coachName}
              xp={progression.xp}
              levelName={currentLevel.title}
              progression={progression}
            />
            <GrowthHub
              lang={lang}
              progression={progression}
              level={currentLevel}
              challenges={currentChallenges}
              onAction={openChallengeAction}
            />
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white">
                  {currentWeeklySummary.title}
                </h3>
                <span className="text-[9px] text-violet-300 bg-violet-500/10 px-2 py-1 rounded-full">
                  WEEKLY
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {currentWeeklySummary.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-slate-950/50 border border-white/5 rounded-xl p-3"
                  >
                    <div className="text-[9px] text-slate-500">
                      {stat.label}
                    </div>
                    <div className="text-sm font-black text-slate-100 mt-1">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {screen === "screenshot-analyzer" && (
          <AIScreenshotAnalyzer
            lang={lang}
            plan={subscription.plan}
            usedToday={countToday(screenshotAnalyses)}
            history={screenshotAnalyses}
            onAnalyze={recordScreenshotAnalysis}
            onAutofill={autofillFromScreenshot}
          />
        )}

        {screen === "match-analyst" && (
          <div className="space-y-4 pb-16 animate-fade-in">
            <div className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-cyan-950/30 to-slate-950/80 p-4">
              <h2 className="text-lg font-black text-white">
                {uiText(
                  "حلّل المباراة",
                  "Analyze Match",
                  "Analizar partido",
                  "Analyser le match",
                )}
              </h2>
              <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                {uiText(
                  "كل أنواع الصور في مكان واحد: تشكيل، سكواد، نتيجة أو إحصائيات.",
                  "All screenshots in one tool: formation, squad, result or stats.",
                  "Todas las capturas en una herramienta.",
                  "Toutes les captures dans un outil.",
                )}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-slate-950/50 p-1 border border-white/5">
                <button
                  onClick={() => setAnalyzeMode("match")}
                  className={`rounded-xl px-3 py-2 text-[11px] font-black transition ${analyzeMode === "match" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  {uiText(
                    "نتيجة وإحصائيات",
                    "Result & stats",
                    "Resultado/stats",
                    "Résultat/stats",
                  )}
                </button>
                <button
                  onClick={() => setAnalyzeMode("screenshot")}
                  className={`rounded-xl px-3 py-2 text-[11px] font-black transition ${analyzeMode === "screenshot" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  {uiText(
                    "صورة تشكيل/سكواد",
                    "Formation/Squad image",
                    "Formación/plantilla",
                    "Formation/effectif",
                  )}
                </button>
              </div>
            </div>
            {analyzeMode === "screenshot" ? (
              <AIScreenshotAnalyzer
                lang={lang}
                plan={subscription.plan}
                usedToday={countToday(screenshotAnalyses)}
                history={screenshotAnalyses}
                onAnalyze={recordScreenshotAnalysis}
                onAutofill={autofillFromScreenshot}
              />
            ) : (
              <AIMatchAnalyst
                lang={lang}
                plan={subscription.plan}
                usedToday={countToday(matchAnalyses)}
                history={matchAnalyses}
                onAnalyze={recordMatchAnalysis}
                onCreatePlan={createPlanFromMatchAnalysis}
              />
            )}
          </div>
        )}

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
              setCurrentResult(tactic.result);
              setBoardState(tactic.board || null);
              setScreen("result");
            }}
          />
        )}

        {screen === "select-game" && (
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
                      if (manager) setEfootballPlaystyleFilter(manager.primaryPlaystyle);
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
                      label: uiText("اللعبة", "Game", "Juego", "Jeu"),
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
                  setStep(1);
                  setScreen("select-game");
                }}
                className="text-[10px] text-violet-400 underline font-semibold focus:outline-none"
              >
                {uiText(
                  "تغيير اللعبة",
                  "Change game",
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
                    <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-3">
                      <h3 className="text-sm font-black text-emerald-300">
                        {uiText(
                          "ابنِ أسلوب لعبك فقط",
                          "Build your own playstyle",
                          "Construye tu estilo",
                          "Construisez votre style",
                        )}
                      </h3>
                      <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                        {uiText(
                          "لا يوجد خصوم هنا. اختر هويتك، التشكيلة، ومستوى المخاطرة وسيخرج التطبيق خطة أساسية جاهزة.",
                          "No opponents here. Choose identity, formation and risk level; the app gives you a ready base tactic.",
                          "Sin rival aquí.",
                          "Pas d’adversaire ici.",
                        )}
                      </p>
                    </div>
                    {efootballMode && (
                      <div className="rounded-3xl border border-sky-400/20 bg-sky-950/10 p-3 space-y-3">
                        <div>
                          <h3 className="text-sm font-black text-sky-200">
                            {uiText(
                              "eFootball: اختَر الأسلوب أو المدرب أولًا",
                              "eFootball: choose playstyle or manager first",
                              "eFootball: elige estilo o mánager",
                              "eFootball : choisissez style ou manager",
                            )}
                          </h3>
                          <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                            {uiText(
                              "بعد الاختيار ستظهر التشكيلات المناسبة فقط، ومنها يتم بناء الخطة.",
                              "Recommended formations appear after the choice, then the tactic is built.",
                              "Después aparecen formaciones recomendadas.",
                              "Les formations recommandées apparaissent ensuite.",
                            )}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <select
                            value={efootballPlaystyleFilter}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEfootballPlaystyleFilter(val);
                              const filtered =
                                val === "all"
                                  ? efootballManagers
                                  : efootballManagers.filter(
                                      (m) =>
                                        m.primaryPlaystyle === val ||
                                        m.secondaryPlaystyles.includes(
                                          val as any,
                                        ),
                                    );
                              const manager =
                                filtered[0] || efootballManagers[0];
                              if (manager) {
                                const nextFormation = manager.bestFormations[0];
                                const next = {
                                  ...formData,
                                  efootballManagerId: manager.id,
                                  myStyle: manager.primaryPlaystyle,
                                  myFormation: nextFormation,
                                };
                                setFormData(next);
                                setTimeout(
                                  () =>
                                    setBoardState(
                                      buildEfootballManagerBoard(
                                        nextFormation,
                                        next.oppFormation,
                                        manager,
                                      ),
                                    ),
                                  0,
                                );
                              }
                            }}
                            className="w-full bg-slate-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-sky-500"
                          >
                            <option value="all">
                              {uiText(
                                "كل أساليب اللعب",
                                "All playstyles",
                                "Todos los estilos",
                                "Tous les styles",
                              )}
                            </option>
                            <option value="Possession Game">
                              {managerPlaystyleLabel("Possession Game", lang)}
                            </option>
                            <option value="Quick Counter">
                              {managerPlaystyleLabel("Quick Counter", lang)}
                            </option>
                            <option value="Long Ball Counter">
                              {managerPlaystyleLabel("Long Ball Counter", lang)}
                            </option>
                            <option value="Out Wide">
                              {managerPlaystyleLabel("Out Wide", lang)}
                            </option>
                            <option value="Long Ball">
                              {managerPlaystyleLabel("Long Ball", lang)}
                            </option>
                          </select>
                          <select
                            value={formData.efootballManagerId}
                            onChange={(e) => {
                              const manager =
                                getEfootballManager(e.target.value) ||
                                efootballManagers[0];
                              const nextFormation = manager.bestFormations[0];
                              const next = {
                                ...formData,
                                efootballManagerId: manager.id,
                                myStyle: manager.primaryPlaystyle,
                                myFormation: nextFormation,
                              };
                              setFormData(next);
                              setEfootballPlaystyleFilter(
                                manager.primaryPlaystyle,
                              );
                              setTimeout(
                                () =>
                                  setBoardState(
                                    buildEfootballManagerBoard(
                                      nextFormation,
                                      next.oppFormation,
                                      manager,
                                    ),
                                  ),
                                0,
                              );
                            }}
                            className="w-full bg-slate-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-sky-500"
                          >
                            {(efootballPlaystyleFilter === "all"
                              ? efootballManagers
                              : efootballManagers.filter(
                                  (m) =>
                                    m.primaryPlaystyle ===
                                      efootballPlaystyleFilter ||
                                    m.secondaryPlaystyles.includes(
                                      efootballPlaystyleFilter as any,
                                    ),
                                )
                            ).map((manager) => (
                              <option key={manager.id} value={manager.id}>
                                {manager.name} —{" "}
                                {managerPlaystyleLabel(
                                  manager.primaryPlaystyle,
                                  lang,
                                )}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                    {!efootballMode && (
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-400">
                          {uiText(
                            "هويتك التكتيكية",
                            "Tactical identity",
                            "Identidad táctica",
                            "Identité tactique",
                          )}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {MY_STYLES.map((style) => (
                            <button
                              key={style.value}
                              type="button"
                              onClick={() => selectBuildStyleAndAutoShape(style.value)}
                              className={`p-2.5 rounded-xl text-[10px] text-right border transition-all ${formData.myStyle === style.value ? "bg-violet-600 border-violet-500 text-white font-extrabold shadow-md" : "bg-slate-900/80 border-white/5 text-slate-400 hover:text-white"}`}
                            >
                              {optionLabel(style.value, lang)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-2 rounded-2xl border border-violet-500/15 bg-violet-500/5 p-3">
                      <div>
                        <h3 className="text-xs font-black text-violet-200">
                          {uiText("التشكيلات المناسبة لأسلوبك", "Recommended shapes for your style", "Formaciones recomendadas", "Formations recommandées")}
                        </h3>
                        <p className="mt-1 text-[10px] text-slate-400 leading-relaxed">
                          {uiText("لا تختار من كل الخطط. اختر واحدة من الخطط المناسبة للأسلوب المختار فقط.", "Do not choose from every shape. Pick one recommended for the selected style.", "Elige una recomendada.", "Choisissez une formation recommandée.")}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {recommendedBuildShapes(selectedGame?.id, formData.myStyle).map((shape) => (
                          <button
                            key={shape}
                            type="button"
                            onClick={() => selectBuildShape(shape)}
                            className={`rounded-2xl border p-3 text-right transition ${formData.myFormation === shape ? "bg-violet-600 text-white border-violet-400" : "bg-slate-950/60 text-slate-300 border-white/5"}`}
                          >
                            <div className="text-sm font-black">{shape}</div>
                            <div className="mt-1 text-[10px] opacity-80">
                              {optionLabel(formData.myStyle, lang)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-rose-500/15 bg-rose-500/5 p-3">
                      <h3 className="text-sm font-black text-rose-300">
                        {uiText(
                          "بيانات الخصم فقط",
                          "Opponent data only",
                          "Datos del rival",
                          "Données adverses",
                        )}
                      </h3>
                      <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                        {uiText(
                          "لا تختار خطتك هنا. أدخل خطة الخصم وأسلوبه وسنولد الخطة المضادة تلقائيًا.",
                          "Do not choose your tactic here. Enter the rival shape/style and we generate the counter automatically.",
                          "No elijas tu táctica aquí.",
                          "Ne choisissez pas votre tactique ici.",
                        )}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-400">
                        {t.oppFormationLabel}
                      </label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          "4-2-3-1",
                          "4-3-3",
                          "4-2-1-3",
                          "4-4-2",
                          "3-5-2",
                          "5-3-2",
                          "3-4-3",
                          "5-4-1",
                          "3-2-4-1",
                          "4-3-1-2",
                        ].map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() =>
                              updateGeneratorForm({ oppFormation: f })
                            }
                            className={`py-2 rounded-lg text-[10px] font-bold border transition ${formData.oppFormation === f ? "bg-violet-600 border-violet-500 text-white font-extrabold shadow-md" : "bg-slate-900/80 border-white/5 text-slate-400 hover:text-white"}`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-400">
                        {t.oppPlaystyleLabel}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {OPPONENT_STYLES.map((style) => (
                          <button
                            key={style.value}
                            type="button"
                            onClick={() =>
                              updateGeneratorForm(
                                { opponentStyle: style.value },
                                false,
                              )
                            }
                            className={`p-2.5 rounded-xl text-[10px] text-right border transition-all ${formData.opponentStyle === style.value ? "bg-violet-600 border-violet-500 text-white font-extrabold shadow-md" : "bg-slate-900/80 border-white/5 text-slate-400 hover:text-white"}`}
                          >
                            {optionLabel(style.value, lang)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-400">
                        {t.matchScenarioLabel}
                      </label>
                      <select
                        value={formData.matchState}
                        onChange={(e) =>
                          updateGeneratorForm(
                            { matchState: e.target.value },
                            false,
                          )
                        }
                        className="w-full bg-slate-900/80 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-violet-600"
                      >
                        {MATCH_STATES.map((ms) => (
                          <option key={ms.value} value={ms.value}>
                            {optionLabel(ms.value, lang)}
                          </option>
                        ))}
                      </select>
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
                      "حط طريقتك المفضلة على السبورة، وسيحللها المدرب الذكي ويقترح تطويرًا وخططًا بديلة.",
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
                          {currentResult.confidence}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-violet-400/25 bg-violet-500/10 p-2 text-center">
                        <div className="text-[9px] text-violet-200">
                          {uiText("التقييم", "Score", "Puntuación", "Score")}
                        </div>
                        <div className="text-lg font-black text-white font-mono">
                          {resultTacticalScore}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-2xl bg-black/20 border border-white/5 p-3 text-[11px] text-slate-300 leading-relaxed">
                    {uiText(
                      "هذه الصفحة تعرض ما تطبقه داخل اللعبة فقط. الشرح المتقدم موجود في زر شرح التكتيك.",
                      "This page shows only what to apply in-game. Advanced reasoning is inside Explain tactic.",
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

                <div className="rounded-3xl border border-amber-400/15 bg-amber-950/10 p-4 space-y-3">
                  <h3 className="text-sm font-black text-amber-200">
                    {uiText(
                      "3 أوامر فورية داخل المباراة",
                      "3 immediate in-match orders",
                      "3 órdenes inmediatas",
                      "3 consignes immédiates",
                    )}
                  </h3>
                  <div className="space-y-2">
                    {actionPlan.direct.match.slice(0, 3).map((item, index) => (
                      <div
                        key={index}
                        className="rounded-2xl bg-slate-950/55 border border-white/5 px-3 py-2 text-[11px] font-bold text-slate-100"
                      >
                        {index + 1}. {cleanTacticText(item)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-cyan-400/15 bg-cyan-950/10 p-4 space-y-3">
                  <h3 className="text-sm font-black text-cyan-200 flex items-center gap-2">
                    <Brain size={16} />
                    {uiText(
                      "شات المدرب الذكي",
                      "AI Coach chat",
                      "Chat coach IA",
                      "Chat coach IA",
                    )}
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {uiText(
                      "اكتب ملاحظتك بعد الخطة، والمدرب يطلع لك Tips قصيرة قابلة للتنفيذ بدون تغيير إعدادات اللعبة الأساسية.",
                      "Add your note after the plan; the coach returns short actionable tips without inventing game settings.",
                      "Añade una nota.",
                      "Ajoutez une note.",
                    )}
                  </p>
                  <textarea
                    rows={2}
                    value={coachQuestion}
                    onChange={(e) => setCoachQuestion(e.target.value)}
                    placeholder={uiText(
                      "مثال: خصمي سريع على الطرف، أو أنا بتضغط عليا في آخر المباراة",
                      "Example: rival is fast wide, or I get pressed late game",
                      "Ejemplo...",
                      "Exemple...",
                    )}
                    className="w-full rounded-2xl bg-slate-950/60 border border-white/8 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={askAiCoachForTips}
                    disabled={coachTipsLoading}
                    className="w-full rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-black py-3"
                  >
                    {coachTipsLoading
                      ? uiText(
                          "المدرب بيفكر...",
                          "Coach is thinking...",
                          "Pensando...",
                          "Réflexion...",
                        )
                      : uiText(
                          "اطلع نصايح إضافية",
                          "Generate extra tips",
                          "Generar tips",
                          "Générer conseils",
                        )}
                  </button>
                  {!!coachTips.length && (
                    <div className="space-y-2">
                      {coachTips.map((tip, index) => (
                        <div
                          key={index}
                          className="rounded-2xl bg-slate-950/55 border border-white/5 px-3 py-2 text-[11px] font-bold text-slate-100"
                        >
                          {index + 1}. {cleanTacticText(tip)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-white/8 bg-white/[0.04] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-white">
                        {uiText(
                          "السبورة التنفيذية",
                          "Execution board",
                          "Pizarra de ejecución",
                          "Tableau d’exécution",
                        )}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {uiText(
                          "اضغط لفتح التمركز والتحريك والرسم.",
                          "Open for movement, drawing and adjustments.",
                          "Abrir para mover y dibujar.",
                          "Ouvrir pour déplacer et dessiner.",
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setShowOpponentOnBoard(!showOpponentOnBoard)
                        }
                        className="rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black px-3 py-2"
                      >
                        {showOpponentOnBoard
                          ? uiText(
                              "إخفاء الخصم",
                              "Hide rival",
                              "Ocultar",
                              "Masquer",
                            )
                          : uiText(
                              "إظهار الخصم",
                              "Show rival",
                              "Mostrar",
                              "Afficher",
                            )}
                      </button>
                      <button
                        onClick={() => setScreen("sandbox-board")}
                        className="rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-black px-4 py-2"
                      >
                        {uiText(
                          "تعديل السبورة",
                          "Edit board",
                          "Editar",
                          "Modifier",
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[260px] overflow-hidden rounded-2xl border border-white/5 bg-slate-950/40 pointer-events-none">
                    <TacticalBoard
                      formation={currentResult.formation}
                      opponentFormation={formData.oppFormation}
                      lang={lang}
                      value={boardState}
                      readOnly
                      showOpponent={showOpponentOnBoard}
                      compact
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-amber-400/15 bg-amber-950/10 p-4 space-y-3">
                  <h3 className="text-sm font-black text-amber-200 flex items-center gap-2">
                    <Award size={16} />
                    {uiText(
                      "تعليمات اللعب المباشر",
                      "Match instructions",
                      "Instrucciones de partido",
                      "Consignes de match",
                    )}
                  </h3>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="rounded-2xl bg-slate-950/55 border border-white/5 p-3 text-slate-100 leading-relaxed">
                      {cleanTacticText(actionPlan.inGame)}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-2xl border border-emerald-400/15 bg-emerald-950/20 p-3">
                        <div className="text-[10px] text-emerald-200 font-black mb-1">
                          {uiText(
                            "لو متقدم",
                            "If leading",
                            "Si vas ganando",
                            "Si vous menez",
                          )}
                        </div>
                        <p className="text-[10px] text-slate-300 leading-relaxed">
                          {cleanTacticText(actionPlan.protect)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-rose-400/15 bg-rose-950/20 p-3">
                        <div className="text-[10px] text-rose-200 font-black mb-1">
                          {uiText(
                            "لو متأخر",
                            "If trailing",
                            "Si vas perdiendo",
                            "Si vous êtes mené",
                          )}
                        </div>
                        <p className="text-[10px] text-slate-300 leading-relaxed">
                          {cleanTacticText(actionPlan.emergency)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdvancedPlan(!showAdvancedPlan)}
                  className="w-full rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-xs font-black text-slate-200 flex items-center justify-between"
                >
                  <span>
                    {uiText(
                      "شرح التكتيك والتفاصيل المتقدمة",
                      "Explain tactic and advanced details",
                      "Explicar táctica",
                      "Expliquer la tactique",
                    )}
                  </span>
                  <ChevronDown
                    size={16}
                    className={
                      showAdvancedPlan ? "rotate-180 transition" : "transition"
                    }
                  />
                </button>

                {showAdvancedPlan && (
                  <div className="rounded-3xl border border-white/8 bg-slate-950/55 p-4 space-y-3 text-xs text-slate-300 leading-relaxed">
                    <div>
                      <b className="text-violet-300">
                        {uiText("لماذا؟", "Why?", "¿Por qué?", "Pourquoi ?")}
                      </b>
                      <p className="mt-1">{actionPlan.why}</p>
                    </div>
                    <div>
                      <b className="text-rose-300">
                        {uiText("احذر", "Watch out", "Cuidado", "Attention")}
                      </b>
                      <p className="mt-1">{actionPlan.weakness}</p>
                    </div>
                    {!!currentResult.boardAnalysis?.length && (
                      <div>
                        <b className="text-emerald-300">
                          {uiText(
                            "قراءة السبورة",
                            "Board reading",
                            "Lectura de pizarra",
                            "Lecture tableau",
                          )}
                        </b>
                        <ul className="mt-2 space-y-1">
                          {currentResult.boardAnalysis
                            .slice(0, 4)
                            .map((x, i) => (
                              <li key={i}>• {cleanTacticText(x)}</li>
                            ))}
                        </ul>
                      </div>
                    )}
                    {!!currentResult.mistakesToAvoid?.length && (
                      <div>
                        <b className="text-amber-300">
                          {uiText(
                            "أخطاء شائعة",
                            "Common mistakes",
                            "Errores comunes",
                            "Erreurs communes",
                          )}
                        </b>
                        <ul className="mt-2 space-y-1">
                          {currentResult.mistakesToAvoid
                            .slice(0, 4)
                            .map((x, i) => (
                              <li key={i}>• {cleanTacticText(x)}</li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

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
                  onClick={() => setScreen("select-game")}
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
                      setCurrentResult(item.result);
                      setBoardState(item.board || null);
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
                        <option key={game.id} value={game.name}>
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

            {/* NEW AI Mastermind Feedback Integration Module */}
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
                      "سيقرأ المدرب الذكي توزيع اللاعبين ويقترح خطة مضادة وتعليمات مناسبة.",
                      "The smart coach will read the player shape and recommend a counter tactic.",
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

                  // Trigger the standard AI generator flow sequence
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

            <div className="glass-card rounded-2xl p-4 space-y-3 border border-amber-400/20 bg-amber-500/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xs font-black text-amber-200">
                    {uiText(
                      "Boss Coins ومكافآت الإعلانات",
                      "Boss Coins & rewarded ads",
                      "Boss Coins y anuncios recompensados",
                      "Boss Coins et publicités récompensées",
                    )}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    {uiText(
                      `كل مكافأة إعلان = ${REWARD_ECONOMY.coinsPerRewardedAd} Coins. اجمع ${REWARD_ECONOMY.coinsPerExtraGeneration} Coins لفتح توليدة خطة إضافية.`,
                      `Each rewarded ad = ${REWARD_ECONOMY.coinsPerRewardedAd} Coins. Collect ${REWARD_ECONOMY.coinsPerExtraGeneration} Coins to unlock one extra tactic generation.`,
                      `Cada anuncio = ${REWARD_ECONOMY.coinsPerRewardedAd} Coins.`,
                      `Chaque publicité = ${REWARD_ECONOMY.coinsPerRewardedAd} Coins.`,
                    )}
                  </p>
                </div>
                <span className="text-[9px] font-black px-2 py-1 rounded-full bg-amber-400/10 text-amber-200">
                  v62
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-950/50 rounded-xl p-2 border border-white/5">
                  <div className="text-[9px] text-slate-500">Coins</div>
                  <div className="text-sm font-black text-white">
                    {rewardWallet.bossCoins}
                  </div>
                </div>
                <div className="bg-slate-950/50 rounded-xl p-2 border border-white/5">
                  <div className="text-[9px] text-slate-500">Extra</div>
                  <div className="text-sm font-black text-white">
                    {rewardWallet.extraGenerationCredits}
                  </div>
                </div>
                <div className="bg-slate-950/50 rounded-xl p-2 border border-white/5">
                  <div className="text-[9px] text-slate-500">Ads today</div>
                  <div className="text-sm font-black text-white">
                    {rewardWallet.adRewardsClaimedToday}/
                    {rewardedAdDailyLimit(subscription.plan)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={claimRewardedAd}
                  disabled={
                    !rewardedAdsEnabled ||
                    rewardWallet.adRewardsClaimedToday >=
                      rewardedAdDailyLimit(subscription.plan)
                  }
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black py-2 text-[10px]"
                >
                  {rewardedAdsEnabled
                    ? uiText(
                        "شاهد إعلانًا للمكافأة",
                        "Watch rewarded ad",
                        "Ver anuncio",
                        "Regarder la pub",
                      )
                    : uiText(
                        "AdMob مطلوب",
                        "AdMob required",
                        "AdMob requerido",
                        "AdMob requis",
                      )}
                </button>
                <button
                  type="button"
                  onClick={redeemGenerationCredit}
                  disabled={
                    rewardWallet.bossCoins <
                    REWARD_ECONOMY.coinsPerExtraGeneration
                  }
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-2 text-[10px]"
                >
                  {uiText(
                    "افتح خطة إضافية",
                    "Unlock extra tactic",
                    "Desbloquear táctica",
                    "Débloquer tactique",
                  )}
                </button>
              </div>
              <p className="text-[9px] text-slate-500 leading-relaxed">
                {uiText(
                  "هذا النظام جاهز لـ AdMob Rewarded Ads. فعّل rewardedAdsEnabled بعد إدخال AdMob App ID وAd Unit ID الحقيقيين؛ المكافأة لا يجب أن تُمنح إلا بعد اكتمال الإعلان.",
                  "This economy is ready for AdMob Rewarded Ads. Enable rewardedAdsEnabled only after adding real AdMob App ID and Ad Unit ID; rewards must be granted only after ad completion.",
                  "En Google Play se conectará a AdMob Rewarded Ads.",
                  "Sur Google Play, ce bouton utilisera AdMob Rewarded Ads.",
                )}
              </p>
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
                    "أقوى اتجاه واحد في Meta Center",
                    "Top Meta Center insight",
                    "Mejor tendencia del Meta Center",
                    "Meilleure tendance Meta Center",
                  )}
                </div>
                <div>
                  ✓{" "}
                  {uiText(
                    "مولد الخطط والسبورة الأساسية",
                    "Core generator and tactical board",
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
                    "$6.99 / شهر",
                    "$6.99 / month",
                    "$6.99 / mes",
                    "$6.99 / mois",
                  )}
                </span>
              </div>

              <div className="space-y-1.5 text-[9px] text-slate-200 mb-3">
                <div>
                  ✓{" "}
                  {uiText(
                    "Meta Center كامل",
                    "Full Meta Center",
                    "Meta Center completo",
                    "Meta Center complet",
                  )}
                </div>
                <div>
                  ✓{" "}
                  {uiText(
                    "تطوير خطتي وتقارير أسبوعية",
                    "Improve My Tactic and weekly reports",
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
                  onClick={() => requestPlanPurchase("pro")}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-extrabold py-2.5 rounded-xl text-xs border border-violet-400/30"
                >
                  {uiText(
                    "اشترك عبر Google Play",
                    "Subscribe with Google Play",
                    "Suscribirse con Google Play",
                    "S’abonner avec Google Play",
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
                    "$12.99 / شهر",
                    "$12.99 / month",
                    "$12.99 / mes",
                    "$12.99 / mois",
                  )}
                </span>
              </div>

              <div className="space-y-1.5 text-[9px] text-slate-300 mb-3">
                <div>
                  ✓{" "}
                  {uiText(
                    "أعلى حدود استخدام متاحة",
                    "Highest available usage limits",
                    "Límites de uso más altos",
                    "Limites d’utilisation maximales",
                  )}
                </div>
                <div>
                  ✓{" "}
                  {uiText(
                    "كل مزايا Pro وتقارير النخبة",
                    "All Pro features and elite reports",
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
                  onClick={() => requestPlanPurchase("elite")}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2 rounded-xl text-xs border border-emerald-400/30"
                >
                  {uiText(
                    "اشترك Elite عبر Google Play",
                    "Subscribe Elite with Google Play",
                    "Suscribirse Elite",
                    "S’abonner Elite",
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
                  value={favGame}
                  onChange={(e) => setFavGame(e.target.value)}
                  onBlur={saveProfile}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-violet-600"
                >
                  {GAMES_LIST.map((game) => (
                    <option key={game.id} value={game.name}>
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
                    onClick={handleRequestAccountDeletion}
                    className="w-full bg-red-950/30 hover:bg-red-900/40 text-red-300 py-2 rounded-xl border border-red-500/30 font-bold transition text-xs"
                  >
                    {uiText(
                      "طلب حذف حسابي وبياناتي",
                      "Request account deletion",
                      "Solicitar eliminación de mi cuenta",
                      "Demander la suppression de mon compte",
                    )}
                  </button>
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

      {/* FIXED FOOTER NAVIGATION GRID (PWA NATIVE FEELING) */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-slate-950/90 backdrop-blur-md border-t border-white/5 flex items-center justify-around z-40 select-none max-w-md mx-auto sm:max-w-lg md:max-w-xl rounded-t-2xl shadow-xl">
        <button
          onClick={() => {
            setStep(1);
            setScreen("home");
          }}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold h-full w-14 transition ${screen === "home" ? "text-violet-400 scale-105" : "text-slate-400 hover:text-white"}`}
          id="tab-home"
        >
          <Gamepad2 size={18} />
          <span>{t.navHome}</span>
        </button>

        <button
          onClick={() => setScreen("progression")}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold h-full w-14 transition ${screen === "progression" ? "text-violet-400 scale-105" : "text-slate-400 hover:text-white"}`}
          id="tab-coach"
        >
          <Brain size={18} />
          <span>{uiText("المدرب", "Coach", "Coach", "Coach")}</span>
        </button>

        <button
          onClick={() => setScreen("library")}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold h-full w-14 transition ${screen === "library" ? "text-violet-400 scale-105" : "text-slate-400 hover:text-white"}`}
          id="tab-library"
        >
          <Library size={18} />
          <span>{t.navLibrary}</span>
        </button>

        <button
          onClick={() => setScreen("rivals")}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold h-full w-14 transition ${screen === "rivals" ? "text-violet-400 scale-105" : "text-slate-400 hover:text-white"}`}
          id="tab-rivals"
        >
          <Sword size={18} />
          <span>{t.navRivals}</span>
        </button>

        <button
          onClick={() => setScreen("settings")}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold h-full w-14 transition ${screen === "settings" ? "text-violet-400 scale-105" : "text-slate-400 hover:text-white"}`}
          id="tab-settings"
        >
          <Settings size={18} />
          <span>{t.navSettings}</span>
        </button>
      </div>
    </div>
  );
}
