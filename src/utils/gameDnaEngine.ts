import type { GameItem } from "./gameData";

export type GameDnaFamily = "pes_classic" | "efootball_modern" | "ea_fc";
export type DnaLang = "ar" | "en" | "es" | "fr";

export type GameDnaOption = {
  value: string;
  label: Record<DnaLang, string>;
};

export type GameDnaProfile = {
  family: GameDnaFamily;
  badge: string;
  title: Record<DnaLang, string>;
  description: Record<DnaLang, string>;
  playstyles: GameDnaOption[];
  defensiveModes: GameDnaOption[];
  tacticalFocus: GameDnaOption[];
  formations: string[];
  rules: Record<DnaLang, string[]>;
};

export type DailyTacticalChallenge = {
  id: string;
  date: string;
  gameId: string;
  family: GameDnaFamily;
  formation: string;
  opponentStyle: string;
  problem: Record<DnaLang, string>;
  objective: Record<DnaLang, string>;
  reward: number;
  slotHours: number;
  opponentProfile: Record<DnaLang, string[]>;
  boardInstructions: Record<DnaLang, string[]>;
  advancedInstructions: Record<DnaLang, string[]>;
  hint: Record<DnaLang, string>;
  ideal: {
    formations: string[];
    playstyles: string[];
    defensiveModes: string[];
    focus: string[];
  };
};

export type DailyChallengeInput = {
  formation: string;
  playstyle: string;
  defensiveMode: string;
  focus: string;
  note?: string;
  hintUsed?: boolean;
};

export type DailyChallengeEvaluation = {
  score: number;
  xp: number;
  maxXp: number;
  grade: "S" | "A" | "B" | "C" | "D";
  summary: Record<DnaLang, string>;
  strengths: Record<DnaLang, string[]>;
  improvements: Record<DnaLang, string[]>;
  numbers: {
    formation: number;
    playstyle: number;
    defensiveMode: number;
    focus: number;
    note: number;
    hintPenalty: number;
  };
};

const L = (ar: string, en: string, es = en, fr = en): Record<DnaLang, string> => ({ ar, en, es, fr });

const pesClassic: GameDnaProfile = {
  family: "pes_classic",
  badge: "PES DNA",
  title: L("DNA بيس الكلاسيكية", "Classic PES DNA", "ADN PES clásico", "ADN PES classique"),
  description: L(
    "PES 19/20/21 تعتمد على تعليمات تكتيكية: استحواذ/مرتدة، تمرير قصير/طويل، منطقة هجوم، ضغط، احتواء.",
    "PES 19/20/21 uses tactical instructions: possession/counter, short/long build-up, attacking area, pressure and containment.",
  ),
  playstyles: [
    { value: "Possession Game", label: L("استحواذ", "Possession Game") },
    { value: "Counter Attack", label: L("هجمة مرتدة", "Counter Attack") },
  ],
  defensiveModes: [
    { value: "Frontline Pressure + Aggressive", label: L("ضغط أمامي + عدواني", "Frontline Pressure + Aggressive") },
    { value: "All-out Defence + Conservative", label: L("دفاع متأخر + محافظ", "All-out Defence + Conservative") },
    { value: "Center Containment", label: L("احتواء العمق", "Center Containment") },
    { value: "Wide Containment", label: L("احتواء الأطراف", "Wide Containment") },
  ],
  tacticalFocus: [
    { value: "Compact center", label: L("تقارب الخطوط وغلق العمق", "Compact center") },
    { value: "Attack wide space", label: L("استغلال المساحة خلف الظهير", "Attack space behind fullbacks") },
    { value: "Early long outlet", label: L("مخرج طويل مبكر", "Early long outlet") },
    { value: "Mark AMF zone", label: L("غلق منطقة صانع اللعب", "Mark AMF zone") },
  ],
  formations: ["4-2-3-1", "4-3-3", "4-4-2", "4-1-4-1", "5-3-2"],
  rules: {
    ar: ["لا تستخدم أساليب eFootball الحديثة هنا.", "اختر منطق Attacking Style وBuild Up وDefensive Style.", "ضد الاستحواذ: غلق العمق + مرتدة واضحة غالبًا أفضل."],
    en: ["Do not use modern eFootball playstyle language here.", "Use Attacking Style, Build Up and Defensive Style logic.", "Against possession: compact center + clear counter is usually safer."],
    es: ["No uses lenguaje moderno de eFootball aquí.", "Usa lógica de estilo ofensivo, construcción y defensa.", "Contra posesión: centro compacto y contra clara."],
    fr: ["N’utilisez pas le langage eFootball moderne ici.", "Utilisez la logique style offensif, construction et défense.", "Contre possession : centre compact et contre claire."],
  },
};

const efootballModern: GameDnaProfile = {
  family: "efootball_modern",
  badge: "eFootball DNA",
  title: L("DNA إي فوتبول الحديثة", "Modern eFootball DNA"),
  description: L(
    "eFootball Current تعتمد على Team Playstyle: Possession, Quick Counter, Long Ball Counter, Out Wide, Long Ball.",
    "Modern eFootball uses Team Playstyles: Possession, Quick Counter, Long Ball Counter, Out Wide and Long Ball.",
  ),
  playstyles: [
    { value: "Possession Game", label: L("لعب استحواذ", "Possession Game") },
    { value: "Quick Counter", label: L("هجمة مرتدة سريعة", "Quick Counter") },
    { value: "Long Ball Counter", label: L("هجمة مرتدة بكرات طويلة", "Long Ball Counter") },
    { value: "Out Wide", label: L("اللعب على الأطراف", "Out Wide") },
    { value: "Long Ball", label: L("كرات طويلة", "Long Ball") },
  ],
  defensiveModes: [
    { value: "Mid block", label: L("بلوك متوسط", "Mid block") },
    { value: "Deep line", label: L("خط دفاع أعمق", "Deep line") },
    { value: "High press", label: L("ضغط عالي", "High press") },
    { value: "Narrow compactness", label: L("تضييق العمق", "Narrow compactness") },
  ],
  tacticalFocus: [
    { value: "Exploit fullback space", label: L("اضرب خلف الظهيرين", "Exploit fullback space") },
    { value: "Protect AMF lane", label: L("اقفل مسار AMF", "Protect AMF lane") },
    { value: "Fast outlet to CF", label: L("مخرج سريع للمهاجم", "Fast outlet to CF") },
    { value: "Switch to wings", label: L("اعكس اللعب للأطراف", "Switch to wings") },
  ],
  formations: ["4-2-3-1", "4-2-1-3", "4-3-3", "4-4-2", "5-3-2", "3-2-4-1"],
  rules: {
    ar: ["استخدم أسماء Team Playstyle الحديثة.", "Quick Counter وLong Ball Counter مفيدان ضد الضغط العالي والاستحواذ البطيء.", "راقب AMF والمساحة خلف الظهيرين."],
    en: ["Use modern Team Playstyle names.", "Quick Counter and Long Ball Counter work well against high press or slow possession.", "Watch the AMF lane and the space behind fullbacks."],
    es: ["Usa nombres modernos de Team Playstyle.", "Quick Counter y Long Ball Counter van bien contra presión alta.", "Vigila el carril AMF y la espalda de laterales."],
    fr: ["Utilisez les noms modernes de Team Playstyle.", "Quick Counter et Long Ball Counter sont utiles contre pressing haut.", "Surveillez le couloir AMF et l’espace derrière les latéraux."],
  },
};

const eaFc: GameDnaProfile = {
  family: "ea_fc",
  badge: "FC IQ",
  title: L("DNA فيفا / EA FC", "FIFA / EA FC DNA"),
  description: L(
    "EA FC يعتمد أكثر على Build Up, Defensive Approach, Roles, With/Without Ball Shape.",
    "EA FC is more about build-up, defensive approach, player roles and in/out-of-possession shape.",
  ),
  playstyles: [
    { value: "Balanced Build Up", label: L("Build Up متوازن", "Balanced Build Up") },
    { value: "Short Passing Possession", label: L("استحواذ وتمرير قصير", "Short Passing Possession") },
    { value: "Direct Passing", label: L("تمرير مباشر", "Direct Passing") },
    { value: "Wing Play", label: L("لعب على الأطراف", "Wing Play") },
  ],
  defensiveModes: [
    { value: "Balanced Defensive Approach", label: L("Defensive Approach متوازن", "Balanced Defensive Approach") },
    { value: "High Depth Press", label: L("ضغط بخط دفاع متقدم", "High Depth Press") },
    { value: "Mid Block", label: L("كتلة دفاعية متوسطة", "Mid Block") },
    { value: "Low Block", label: L("دفاع متأخر", "Low Block") },
  ],
  tacticalFocus: [
    { value: "Holding CDM", label: L("CDM ثابت Holding", "Holding CDM") },
    { value: "Fullbacks Stay Back", label: L("الأظهرة Stay Back", "Fullbacks Stay Back") },
    { value: "CAM Playmaker", label: L("CAM Playmaker", "CAM Playmaker") },
    { value: "Attack Half Spaces", label: L("هاجم أنصاف المساحات", "Attack half spaces") },
  ],
  formations: ["4-2-3-1", "4-3-3", "4-4-2", "4-1-2-1-2", "5-2-1-2", "3-4-2-1"],
  rules: {
    ar: ["لا تقيم EA FC بأسلوب eFootball.", "ركز على Roles والـ Defensive Approach والـ Build Up.", "ضد Direct Passing لا ترفع الخط الدفاعي زيادة."],
    en: ["Do not evaluate EA FC as eFootball.", "Focus on roles, defensive approach and build-up.", "Against direct passing, avoid excessive high depth."],
    es: ["No evalúes EA FC como eFootball.", "Enfócate en roles, defensa y construcción.", "Contra pase directo, evita profundidad alta excesiva."],
    fr: ["N’évaluez pas EA FC comme eFootball.", "Concentrez-vous sur les rôles, l’approche défensive et la construction.", "Contre le jeu direct, évitez une ligne trop haute."],
  },
};

export const getGameDnaProfile = (gameId?: string, gameName = ""): GameDnaProfile => {
  const id = `${gameId || ""} ${gameName || ""}`.toLowerCase();
  if (/pes|winning|2021|2020|2019/.test(id) && !/efootball-modern|current|202[2-6]/.test(id)) return pesClassic;
  if (/efootball/.test(id)) return efootballModern;
  if (/fifa|fc|ea/.test(id)) return eaFc;
  return efootballModern;
};

const seedNumber = (value: string) => Array.from(value).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
const pick = <T,>(rows: T[], seed: number, offset = 0): T => rows[Math.abs(seed + offset) % rows.length];

export const gameDnaOptionLabel = (
  dna: GameDnaProfile,
  value: string,
  lang: DnaLang,
): string => {
  const all = [...dna.playstyles, ...dna.defensiveModes, ...dna.tacticalFocus];
  const found = all.find((item) => item.value === value || item.label.en === value || item.label.ar === value);
  if (found) return found.label[lang] || found.label.ar || value;
  if (lang === "ar") {
    const arMap: Record<string, string> = {
      "Possession Game": "لعب استحواذ",
      "Counter Attack": "هجمة مرتدة",
      "Short Pass": "تمرير قصير",
      "Long Pass": "تمرير طويل",
      "Center": "العمق",
      "Wide": "الأطراف",
      "Maintain Formation": "الحفاظ على التشكيل",
      "Flexible": "مرن",
      "Frontline Pressure": "ضغط أمامي",
      "All-out Defence": "دفاع متأخر",
      "Aggressive": "عدواني",
      "Conservative": "محافظ",
      "Quick Counter": "مرتدة سريعة",
      "Long Ball Counter": "مرتدة بكرات طويلة",
      "Out Wide": "لعب على الأطراف",
      "Long Ball": "كرات طويلة",
      "Counter Attack + Long Pass": "هجمة مرتدة + تمرير طويل",
      "Counter Attack + Short Pass": "هجمة مرتدة + تمرير قصير",
      "Possession Game + Short Pass": "استحواذ + تمرير قصير",
      "Wide Attack + Flexible": "هجوم طرفي + مرونة",
      "Frontline Pressure + Aggressive": "ضغط أمامي + التحام قوي",
      "All-out Defence + Conservative": "دفاع متأخر + تدخل محافظ",
      "Center Containment": "احتواء العمق",
      "Wide Containment": "احتواء الأطراف",
      "Mid block": "بلوك متوسط",
      "Deep line": "خط دفاع أعمق",
      "High press": "ضغط عالي",
      "Narrow compactness": "تقارب دفاعي في العمق",
      "Balanced Build Up": "بناء لعب متوازن",
      "Short Passing Possession": "استحواذ بتمرير قصير",
      "Direct Passing": "تمرير مباشر خلف الدفاع",
      "Wing Play": "لعب طرفي",
      "Balanced Defensive Approach": "نهج دفاعي متوازن",
      "High Depth Press": "ضغط بعمق دفاعي عالٍ",
      "Mid Block": "بلوك متوسط",
      "Low Block": "دفاع متأخر",
      "Holding CDM": "محور دفاعي ثابت",
      "Fullbacks Stay Back": "الأظهرة تبقى في الخلف",
      "CAM Playmaker": "صانع لعب حر",
      "Attack Half Spaces": "هاجم أنصاف المساحات",
      "Compact center": "غلق العمق وتقارب الخطوط",
      "Attack wide space": "اضرب المساحة خلف الظهير",
      "Early long outlet": "مخرج طويل مبكر",
      "Mark AMF zone": "راقب منطقة صانع اللعب",
      "Exploit fullback space": "اضرب خلف الظهيرين",
      "Protect AMF lane": "اقفل مسار صانع اللعب",
      "Fast outlet to CF": "مخرج سريع للمهاجم",
      "Switch to wings": "اعكس اللعب للأطراف",
    };
    return arMap[value] || value;
  }
  return value;
};

export const createDailyTacticalChallenge = (game: Pick<GameItem, "id" | "name"> | { id: string; name: string }, date: string): DailyTacticalChallenge => {
  const dna = getGameDnaProfile(game.id, game.name);
  const seed = seedNumber(`${game.id}-${date}-${dna.family}`);
  const formation = pick(["4-2-3-1", "4-3-3", "4-1-2-1-2", "3-4-3", "5-3-2", "4-2-1-3"], seed, 1);
  const opponentStyle = pick(dna.playstyles, seed, 2).value;
  const focus = pick(dna.tacticalFocus, seed, 3).value;
  const styleAr = gameDnaOptionLabel(dna, opponentStyle, "ar");
  const styleEn = gameDnaOptionLabel(dna, opponentStyle, "en");
  const focusAr = gameDnaOptionLabel(dna, focus, "ar");
  const focusEn = gameDnaOptionLabel(dna, focus, "en");
  const familyProblem = {
    pes_classic: L("خصمك يستخدم منطق بيس الكلاسيكي: تعليمات هجوم ودفاع واضحة، تمرير، ضغط، واحتواء. المطلوب تختار رد مناسب من نفس إعدادات PES.", "Your rival uses classic PES logic: attack/defense instructions, passing, pressure and containment. Choose an answer from PES-style settings."),
    efootball_modern: L("خصمك يلعب بمنطق إي فوتبول الحديثة: أسلوب لعب جماعي، صانع لعب بين الخطوط، ومساحات خلف الظهيرين.", "Your rival uses modern eFootball logic: team playstyle, AMF lane and space behind fullbacks."),
    ea_fc: L("خصمك يعتمد على منطق فيفا / EA FC: أدوار لاعبين، بناء لعب، ضغط، وظهيرين بيطلعوا في التوقيت الخطير.", "Your rival uses EA FC logic: roles, build-up, pressure and fullback timing."),
  }[dna.family];
  const objective = L(
    `أوقف ${formation} بأسلوب ${styleAr}. ركز على: ${focusAr}.`,
    `Stop ${formation} with ${styleEn}. Focus on: ${focusEn}.`,
    `Detén ${formation} con ${styleEn}.`,
    `Stoppez ${formation} avec ${styleEn}.`,
  );
  const ideal = dna.family === "pes_classic"
    ? {
        formations: ["4-2-3-1", "4-4-2", "5-3-2"],
        playstyles: ["Counter Attack", "Possession Game"],
        defensiveModes: ["All-out Defence + Conservative", "Center Containment"],
        focus: ["Compact center", "Early long outlet", "Mark AMF zone"],
      }
    : dna.family === "ea_fc"
      ? {
          formations: ["4-2-3-1", "4-3-3", "5-2-1-2"],
          playstyles: ["Balanced Build Up", "Direct Passing"],
          defensiveModes: ["Balanced Defensive Approach", "Mid Block"],
          focus: ["Holding CDM", "Fullbacks Stay Back", "Attack Half Spaces"],
        }
      : {
          formations: ["4-2-3-1", "4-2-1-3", "5-3-2"],
          playstyles: ["Quick Counter", "Long Ball Counter"],
          defensiveModes: ["Mid block", "Deep line", "Narrow compactness"],
          focus: ["Exploit fullback space", "Protect AMF lane", "Fast outlet to CF"],
        };
  const opponentProfile = dna.family === "pes_classic"
    ? {
        ar: ["الخصم يهاجم بتعليمات واضحة داخل بيس: اتجاه هجوم + طريقة بناء + ضغط.", `الخطر الأساسي: ${styleAr}.`, "لو فتحت العمق، صانع اللعب أو المهاجم الثاني هيستقبل بين الخطوط."],
        en: ["Rival uses classic PES instructions: attacking area, build-up and pressure.", `Main threat: ${styleEn}.`, "If the center opens, the AMF/SS receives between lines."],
        es: ["Rival con instrucciones PES clásicas.", `Amenaza: ${styleEn}.`, "Cierra el centro."],
        fr: ["Adversaire avec instructions PES classiques.", `Menace : ${styleEn}.`, "Fermez le centre."],
      }
    : dna.family === "ea_fc"
      ? {
          ar: ["الخصم يعتمد على أدوار اللاعبين والتمركز بدون كرة.", `الخطر الأساسي: ${styleAr}.`, "الظهير المتقدم أو CAM الحر يخلق زيادة عددية بسرعة."],
          en: ["Rival relies on player roles and off-ball positioning.", `Main threat: ${styleEn}.`, "Advanced fullbacks or a free CAM create overloads quickly."],
          es: ["Rival basado en roles.", `Amenaza: ${styleEn}.`, "Controla laterales/CAM."],
          fr: ["Adversaire basé sur les rôles.", `Menace : ${styleEn}.`, "Contrôlez latéraux/CAM."],
        }
      : {
          ar: ["الخصم يلعب بأسلوب جماعي واضح داخل eFootball.", `الخطر الأساسي: ${styleAr}.`, "راقب AMF والمساحة خلف الظهيرين قبل ما تختار الرد."],
          en: ["Rival uses a clear eFootball team playstyle.", `Main threat: ${styleEn}.`, "Watch AMF lane and fullback space before choosing."],
          es: ["Rival con Team Playstyle claro.", `Amenaza: ${styleEn}.`, "Vigila AMF/laterales."],
          fr: ["Adversaire avec Team Playstyle clair.", `Menace : ${styleEn}.`, "Surveillez AMF/latéraux."],
        };
  const boardInstructions = {
    ar: ["افتح السبورة قبل الحل وشوف مكان الخطر الرئيسي.", "لو الخصم عنده صانع لعب حر: ضيق المسافة بين الوسط والدفاع.", "لو الخصم يهاجم من الطرف: لا تطلع الظهيرين معًا."],
    en: ["Open the board before answering and read the main threat.", "If AMF is free: reduce the gap between midfield and defense.", "If the rival attacks wide: do not push both fullbacks together."],
    es: ["Abre la pizarra antes de responder.", "Cierra el carril del creador.", "No subas ambos laterales."],
    fr: ["Ouvrez le tableau avant de répondre.", "Fermez le couloir du créateur.", "Ne montez pas les deux latéraux."],
  };
  const advancedInstructions = dna.family === "pes_classic"
    ? {
        ar: ["تعليمات PES المقترحة: دفاع متأخر عند الحاجة، احتواء العمق، تمرير أول مباشر وقت الضغط.", "لو عندك Advanced Instructions: استخدم تغطية العمق أو مراقبة صانع اللعب، ولا تزود تعليمات هجومية كثيرة."],
        en: ["Suggested PES instructions: deeper defense when needed, center containment, direct first outlet under pressure.", "If using Advanced Instructions: cover center or mark playmaker; avoid too many attacking instructions."],
        es: ["Instrucciones PES: bloque bajo, centro compacto, salida directa."],
        fr: ["Consignes PES : bloc plus bas, centre compact, sortie directe."],
      }
    : dna.family === "ea_fc"
      ? {
          ar: ["تعليمات EA FC: محور ثابت، أظهرة تبقى في الخلف ضد السرعة، وعمق دفاعي متوسط بدل العالي.", "لا تجعل كل الأدوار هجومية؛ خلي لاعب واحد على الأقل يحمي التحولات."],
          en: ["EA FC instructions: holding CDM, fullbacks stay back against pace, medium defensive depth.", "Do not make every role attacking; keep at least one transition protector."],
          es: ["EA FC: CDM fijo, laterales atrás, profundidad media."],
          fr: ["EA FC : MDC fixe, latéraux prudents, profondeur moyenne."],
        }
      : {
          ar: ["تعليمات eFootball: اختار أسلوب اللعب الجماعي المناسب أولًا، ثم اضبط الخط والضغط.", "ضد الاستحواذ: مرتدة سريعة أو كرات طويلة مع بلوك متوسط غالبًا أأمن."],
          en: ["eFootball instructions: pick the team playstyle first, then adjust line and pressure.", "Against possession: quick/long counter with a mid block is usually safer."],
          es: ["eFootball: elige Team Playstyle y luego línea/presión."],
          fr: ["eFootball : choisissez le Team Playstyle puis ligne/pression."],
        };
  const hint = L(
    `فكّر في ${gameDnaOptionLabel(dna, ideal.playstyles[0], "ar")} مع ${gameDnaOptionLabel(dna, ideal.defensiveModes[0], "ar")}. لا تنسَ ${gameDnaOptionLabel(dna, ideal.focus[0], "ar")}.`,
    `Think about ${gameDnaOptionLabel(dna, ideal.playstyles[0], "en")} with ${gameDnaOptionLabel(dna, ideal.defensiveModes[0], "en")}. Do not forget ${gameDnaOptionLabel(dna, ideal.focus[0], "en")}.`,
  );
  return {
    id: `challenge-${date}-${game.id}`,
    date,
    gameId: game.id,
    family: dna.family,
    formation,
    opponentStyle,
    problem: familyProblem,
    objective,
    reward: 80,
    slotHours: 3,
    opponentProfile,
    boardInstructions,
    advancedInstructions,
    hint,
    ideal,
  };
};

export const evaluateDailyChallenge = (
  challenge: DailyTacticalChallenge,
  input: DailyChallengeInput,
): DailyChallengeEvaluation => {
  const formation = challenge.ideal.formations.includes(input.formation) ? 22 : 10;
  const playstyle = challenge.ideal.playstyles.includes(input.playstyle) ? 25 : 12;
  const defensiveMode = challenge.ideal.defensiveModes.includes(input.defensiveMode) ? 22 : 10;
  const focus = challenge.ideal.focus.includes(input.focus) ? 21 : 10;
  const note = input.note && input.note.trim().length >= 15 ? 10 : input.note?.trim() ? 5 : 0;
  const hintPenalty = input.hintUsed ? 8 : 0;
  const score = Math.max(35, Math.min(100, formation + playstyle + defensiveMode + focus + note - hintPenalty));
  const maxXp = challenge.reward;
  const rawXp = Math.round((score / 100) * maxXp);
  const xp = Math.max(10, rawXp - (input.hintUsed ? 20 : 0));
  const grade = score >= 92 ? "S" : score >= 80 ? "A" : score >= 68 ? "B" : score >= 55 ? "C" : "D";
  const strongPlaystyle = challenge.ideal.playstyles.includes(input.playstyle);
  const strongDefence = challenge.ideal.defensiveModes.includes(input.defensiveMode);
  return {
    score,
    xp,
    maxXp,
    grade,
    summary: L(
      score >= 80 ? "حل قوي ومناسب لـ DNA اللعبة. اختيارك قابل للتنفيذ ويستحق مكافأة عالية." : "حل مقبول، لكن يحتاج ضبط أكبر حسب DNA اللعبة قبل ما يكون مثاليًا.",
      score >= 80 ? "Strong answer for this game DNA. Your plan is playable and deserves a high reward." : "Acceptable answer, but it needs more game-DNA tuning before it is ideal.",
    ),
    strengths: {
      ar: [
        strongPlaystyle ? "أسلوب اللعب مناسب لطبيعة التحدي." : "اخترت تشكيلًا يمكن البناء عليه.",
        strongDefence ? "الوضع الدفاعي يقلل خطر الخصم." : "وجود هدف تكتيكي واضح أفضل من حل عشوائي.",
        input.note ? "الملاحظة الخاصة رفعت دقة التقييم." : "الحل سريع ومباشر.",
      ],
      en: [
        strongPlaystyle ? "The playstyle fits the challenge." : "The formation can be built on.",
        strongDefence ? "The defensive mode reduces the rival threat." : "A clear tactical focus is better than a random answer.",
        input.note ? "Your custom note improved the evaluation." : "The answer is quick and direct.",
      ],
      es: ["Buen enfoque táctico.", "La respuesta es jugable.", "La idea principal está clara."],
      fr: ["Bonne orientation tactique.", "La réponse est jouable.", "L’idée principale est claire."],
    },
    improvements: {
      ar: [
        challenge.ideal.playstyles.includes(input.playstyle) ? "حافظ على نفس الأسلوب لكن اضبط التعليمات الدقيقة." : `الأفضل هنا: ${challenge.ideal.playstyles[0]}.`,
        challenge.ideal.defensiveModes.includes(input.defensiveMode) ? "لا تبالغ في الضغط لو الخصم سريع." : `الوضع الدفاعي الأنسب: ${challenge.ideal.defensiveModes[0]}.`,
        input.hintUsed ? "استخدمت تلميحًا؛ لذلك تم تقليل المكافأة قليلًا." : "جرب إضافة ملاحظة تكتيكية أطول لرفع الدقة.",
      ],
      en: [
        challenge.ideal.playstyles.includes(input.playstyle) ? "Keep the style but tune the micro-instructions." : `Better playstyle here: ${challenge.ideal.playstyles[0]}.`,
        challenge.ideal.defensiveModes.includes(input.defensiveMode) ? "Do not over-press if the rival is fast." : `Better defensive mode: ${challenge.ideal.defensiveModes[0]}.`,
        input.hintUsed ? "A hint was used, so the reward was slightly reduced." : "Add a longer tactical note for better precision.",
      ],
      es: ["Ajusta instrucciones finas.", "Evita presión excesiva.", "Añade una nota más concreta."],
      fr: ["Ajustez les consignes fines.", "Évitez le pressing excessif.", "Ajoutez une note plus précise."],
    },
    numbers: { formation, playstyle, defensiveMode, focus, note, hintPenalty },
  };
};
