import { GameItem } from './gameData';
import { SupportedLang } from './lang';
import { TacticResult, TacticalBoardState } from '../types';
import { analyzeBoardShape, applyBoardIntelligence } from './boardIntelligence';
import { generateLocalTactic } from './tacticalEngine';

export interface TacticDevelopmentInput {
  formation: string;
  style: string;
  team: string;
  goal: string;
  notes: string;
}

export interface TacticDevelopmentResult {
  score: number;
  level: string;
  summary: string;
  recommendedFormation: string;
  alternativeFormations: string[];
  strengths: string[];
  priorities: string[];
  roleChanges: string[];
  nextMatchPlan: string[];
  boardInsights: string[];
  tactic: TacticResult;
}

const text = (lang: SupportedLang, ar: string, en: string, es: string, fr: string) => ({ ar, en, es, fr }[lang]);

const unique = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

function recommendedShape(input: TacticDevelopmentInput, insights: string[]): string {
  const style = input.style;
  const goal = input.goal.toLowerCase();
  if (insights.some(item => /ارتكاز|holding|pivote|sentinelle/i.test(item))) return '4-2-3-1';
  if (/دفاع|protect|defen|défen|defensa/i.test(goal)) return '4-2-3-1';
  if (/هجوم|attack|ataque|attaque/i.test(goal)) return style.includes('استحواذ') ? '4-3-3' : '4-2-4';
  if (style.includes('ضغط عالي')) return '4-3-3';
  if (style.includes('مرتدات')) return '4-2-3-1';
  if (style.includes('دفاعي')) return '5-3-2';
  if (style.includes('استحواذ')) return '4-3-3';
  return input.formation || '4-2-3-1';
}

export function analyzeTacticDevelopment(
  game: GameItem,
  input: TacticDevelopmentInput,
  board: TacticalBoardState | null,
  lang: SupportedLang
): TacticDevelopmentResult {
  const boardInsights = analyzeBoardShape(board, lang);
  const recommendedFormation = recommendedShape(input, boardInsights);
  const riskCount = boardInsights.filter(item => !/متوازن|balanced|equilibr|équilibr/i.test(item)).length;
  const score = Math.max(55, Math.min(96, 90 - riskCount * 7 + (input.team ? 3 : 0) + (input.notes.trim() ? 2 : 0)));

  const opponentStyle = input.style.includes('استحواذ')
    ? 'ضغط عالي'
    : input.style.includes('مرتدات')
      ? 'استحواذ'
      : input.style.includes('دفاعي')
        ? 'سرعة من الأطراف'
        : 'دفاع متأخر';

  const raw = generateLocalTactic(game, {
    myFormation: recommendedFormation,
    oppFormation: '4-2-3-1',
    opponentStyle,
    myStyle: input.style,
    matchState: 'بداية الماتش',
    myTeam: input.team,
    oppTeam: '',
    notes: input.notes
  }, lang);
  const tactic = applyBoardIntelligence(raw, board, lang);

  const strengths = unique([
    input.team
      ? text(lang, `الهوية الحالية واضحة مع ${input.team}.`, `The current identity is clear with ${input.team}.`, `La identidad actual está clara con ${input.team}.`, `L’identité actuelle est claire avec ${input.team}.`)
      : text(lang, 'لديك فكرة لعب واضحة يمكن البناء عليها.', 'You have a clear playing idea to build on.', 'Tienes una idea de juego clara.', 'Votre idée de jeu est claire.'),
    input.style.includes('ضغط عالي')
      ? text(lang, 'الرغبة في افتكاك الكرة مبكرًا.', 'Strong intent to recover the ball early.', 'Buena intención de recuperar pronto.', 'Bonne volonté de récupérer haut.')
      : input.style.includes('استحواذ')
        ? text(lang, 'الاستحواذ يمنحك تحكمًا أفضل في إيقاع المباراة.', 'Possession gives you better control of the match tempo.', 'La posesión mejora el control del ritmo.', 'La possession améliore le contrôle du rythme.')
        : text(lang, 'الأسلوب الحالي يسمح بانتقالات مرنة.', 'The current style supports flexible transitions.', 'El estilo actual permite transiciones flexibles.', 'Le style actuel permet des transitions flexibles.'),
    score >= 82
      ? text(lang, 'توزيع السبورة قريب من الشكل المتوازن.', 'The board shape is close to balanced.', 'La pizarra está cerca del equilibrio.', 'Le tableau est proche de l’équilibre.')
      : text(lang, 'الأساس جيد ويحتاج تعديلات محددة فقط.', 'The base is good and needs focused adjustments.', 'La base es buena y necesita ajustes concretos.', 'La base est bonne et nécessite des ajustements ciblés.')
  ]);

  const priorities = unique([
    ...boardInsights.filter(item => !/متوازن|balanced|equilibr|équilibr/i.test(item)),
    recommendedFormation !== input.formation
      ? text(lang, `جرّب التحول من ${input.formation} إلى ${recommendedFormation} لزيادة التوازن.`, `Test a shift from ${input.formation} to ${recommendedFormation} for better balance.`, `Prueba cambiar de ${input.formation} a ${recommendedFormation} para mejorar el equilibrio.`, `Testez le passage de ${input.formation} à ${recommendedFormation} pour plus d’équilibre.`)
      : text(lang, `احتفظ بـ ${input.formation} لكن غيّر الأدوار قبل تغيير الرسم بالكامل.`, `Keep ${input.formation}, but adjust roles before changing the whole shape.`, `Mantén ${input.formation}, pero ajusta los roles antes de cambiar todo el sistema.`, `Gardez le ${input.formation}, mais ajustez les rôles avant de changer tout le système.`),
    input.goal
      ? text(lang, `اربط كل تعديل بهدفك: ${input.goal}.`, `Tie every adjustment to your goal: ${input.goal}.`, `Relaciona cada ajuste con tu objetivo: ${input.goal}.`, `Reliez chaque ajustement à votre objectif : ${input.goal}.`)
      : text(lang, 'حدد هدفًا واحدًا للخطة في كل مباراة.', 'Set one clear tactical objective for each match.', 'Define un objetivo táctico claro por partido.', 'Fixez un objectif tactique clair par match.')
  ]).slice(0, 5);

  const roleChanges = unique([
    text(lang, 'اجعل لاعب وسط واحدًا على الأقل مسؤولًا عن التغطية أمام الدفاع.', 'Assign at least one midfielder to protect the defense.', 'Asigna al menos un mediocampista para proteger la defensa.', 'Affectez au moins un milieu à la protection de la défense.'),
    input.style.includes('استحواذ')
      ? text(lang, 'استخدم صانع لعب متأخر وجناحًا واحدًا يحافظ على العرض.', 'Use a deep playmaker and keep one winger wide.', 'Usa un organizador retrasado y un extremo abierto.', 'Utilisez un meneur reculé et gardez un ailier large.')
      : text(lang, 'اجعل أحد المهاجمين يثبت الدفاع والآخر يهاجم المساحة.', 'Use one forward to pin defenders and another to attack space.', 'Usa un delantero para fijar y otro para atacar el espacio.', 'Utilisez un attaquant pour fixer et un autre pour attaquer la profondeur.'),
    input.style.includes('ضغط عالي')
      ? text(lang, 'لا تضغط بكل اللاعبين؛ اترك خط تغطية خلف أول موجة ضغط.', 'Do not press with everyone; keep a cover line behind the first wave.', 'No presiones con todos; mantén una línea de cobertura.', 'Ne pressez pas avec tout le monde ; gardez une ligne de couverture.')
      : text(lang, 'وازن بين ظهير متقدم وظهير أكثر تحفظًا.', 'Balance one advancing fullback with one more conservative fullback.', 'Equilibra un lateral ofensivo con otro más conservador.', 'Équilibrez un latéral offensif avec un latéral plus prudent.')
  ]);

  const alternatives = unique([
    recommendedFormation,
    input.style.includes('مرتدات') ? '4-4-2' : '4-2-3-1',
    input.style.includes('استحواذ') ? '3-2-4-1' : '4-3-3',
    input.style.includes('دفاعي') ? '5-3-2' : '4-3-2-1'
  ]).filter(shape => shape !== input.formation).slice(0, 3);

  const nextMatchPlan = [
    text(lang, 'أول 15 دقيقة: التزم بالشكل الأساسي واقرأ ضغط الخصم.', 'First 15 minutes: keep the base shape and read the opponent press.', 'Primeros 15 minutos: mantén la estructura y analiza la presión rival.', '15 premières minutes : gardez la structure et lisez le pressing adverse.'),
    text(lang, 'بعد الاستحواذ: حرّك لاعبًا بين الخطوط بدل إرسال الجميع للأمام.', 'In possession: move one player between the lines instead of sending everyone forward.', 'Con balón: mueve un jugador entre líneas en lugar de atacar con todos.', 'Avec le ballon : placez un joueur entre les lignes au lieu de projeter tout le monde.'),
    text(lang, 'عند فقد الكرة: أول لاعب يضغط والباقي يغلق زوايا التمرير.', 'After losing the ball: one player presses while the rest close passing lanes.', 'Tras perder el balón: uno presiona y el resto cierra líneas de pase.', 'À la perte : un joueur presse et les autres ferment les lignes de passe.')
  ];

  const level = score >= 90
    ? text(lang, 'جاهزة للمنافسة', 'Competition ready', 'Lista para competir', 'Prête pour la compétition')
    : score >= 78
      ? text(lang, 'قوية وتحتاج ضبطًا', 'Strong, needs tuning', 'Fuerte, necesita ajustes', 'Solide, à ajuster')
      : text(lang, 'تحتاج تطويرًا واضحًا', 'Needs clear development', 'Necesita mejoras claras', 'Nécessite un développement clair');

  const summary = text(
    lang,
    `خطتك ${input.formation} بأسلوب ${input.style} لديها أساس جيد. أفضل تطوير حالي هو ${recommendedFormation} مع تعديل الأدوار حسب السبورة.`,
    `Your ${input.formation} using ${input.style} has a good base. The best current development is ${recommendedFormation} with board-led role adjustments.`,
    `Tu ${input.formation} con ${input.style} tiene una buena base. La mejor evolución es ${recommendedFormation} con ajustes de roles según la pizarra.`,
    `Votre ${input.formation} en ${input.style} possède une bonne base. La meilleure évolution est le ${recommendedFormation} avec des rôles ajustés selon le tableau.`
  );

  return {
    score,
    level,
    summary,
    recommendedFormation,
    alternativeFormations: alternatives,
    strengths,
    priorities,
    roleChanges,
    nextMatchPlan,
    boardInsights,
    tactic: {
      ...tactic,
      formation: recommendedFormation,
      reason: summary,
      boardAnalysis: boardInsights
    }
  };
}
