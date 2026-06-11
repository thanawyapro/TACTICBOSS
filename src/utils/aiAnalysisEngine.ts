import { SupportedLang } from './lang';

export type AnalysisMode = 'squad' | 'opponent' | 'formation' | 'match_result' | 'stats' | 'heatmap' | 'board';

export interface ScreenshotAnalysisResult {
  id: string;
  mode: AnalysisMode;
  imageName: string;
  detectedFormation: string;
  detectedPlaystyle: string;
  confidence: number;
  strongZones: string[];
  weakZones: string[];
  dangerZones: string[];
  generatorAutofill: {
    myFormation?: string;
    oppFormation?: string;
    myStyle?: string;
    opponentStyle?: string;
    notes: string;
  };
  createdAt: string;
}

export interface MatchContextInput {
  myTeam?: string;
  opponentTeam?: string;
  myFormation?: string;
  opponentFormation?: string;
  myStyle?: string;
  opponentStyle?: string;
  scoreline: string;
  myGoals?: string;
  opponentGoals?: string;
  possession: string;
  shots: string;
  matchState?: string;
  notes?: string;
}

export interface MatchAnalysisResult {
  id: string;
  imageName: string;
  myTeam?: string;
  opponentTeam?: string;
  myFormation?: string;
  opponentFormation?: string;
  myStyle?: string;
  opponentStyle?: string;
  matchState?: string;
  notes?: string;
  scoreline: string;
  myGoals?: string;
  opponentGoals?: string;
  possession: string;
  shots: string;
  tacticalVerdict: string;
  keyBattle: string;
  scoreReading: string;
  teamReport: string[];
  opponentReport: string[];
  diagnosis: string[];
  mistakes: string[];
  weakAreas: string[];
  recommendations: string[];
  training: string[];
  counterStrategy: string;
  recommendedFormation: string;
  coachScore: number;
  attackScore: number;
  defenseScore: number;
  balanceScore: number;
  riskLevel: string;
  beforeScore: number;
  afterScore: number;
  nextMatchSetup: string[];
  storagePolicy: 'local_first';
  createdAt: string;
}

const pick = <T,>(rows: T[], seed: number) => rows[Math.abs(seed) % rows.length];
const seedFrom = (text: string) => Array.from(text).reduce((sum, c) => sum + c.charCodeAt(0), 0);

const tr = (lang: SupportedLang, ar: string, en: string, es: string, fr: string) => ({ ar, en, es, fr }[lang]);

export function analyzeScreenshotLocally(fileName: string, mode: AnalysisMode, lang: SupportedLang): ScreenshotAnalysisResult {
  const seed = seedFrom(`${fileName}-${mode}-${new Date().toISOString().slice(0, 10)}`);
  const formations = ['4-2-3-1', '4-3-3', '4-3-2-1', '4-1-2-1-2', '3-5-2', '4-4-2'];
  const styles = [
    tr(lang, 'ضغط عالي', 'High Press', 'Presión alta', 'Pressing haut'),
    tr(lang, 'استحواذ', 'Possession', 'Posesión', 'Possession'),
    tr(lang, 'هجوم مرتد سريع', 'Quick Counter', 'Contra rápida', 'Contre rapide'),
    tr(lang, 'دفاع منخفض', 'Low Block', 'Bloque bajo', 'Bloc bas')
  ];
  const formation = pick(formations, seed);
  const style = pick(styles, seed + 3);
  const weakZones = [
    tr(lang, 'المساحة خلف الظهيرين عند فقد الكرة', 'Space behind fullbacks after turnovers', 'Espacio detrás de laterales tras pérdida', 'Espace derrière les latéraux après perte'),
    tr(lang, 'بطء التحول من الهجوم للدفاع', 'Slow attacking-to-defensive transition', 'Transición defensiva lenta', 'Transition défensive lente'),
    tr(lang, 'عزلة المهاجم عند البناء', 'Striker isolation during build-up', 'Delantero aislado en salida', 'Buteur isolé à la relance')
  ];
  const strongZones = [
    tr(lang, 'تفوق عددي في العمق', 'Central overload', 'Superioridad central', 'Surnombre axial'),
    tr(lang, 'تهديد قوي من أنصاف المساحات', 'Strong half-space threat', 'Amenaza en medios espacios', 'Menace dans les demi-espaces'),
    tr(lang, 'ضغط أول ممتاز على حامل الكرة', 'Strong first press on the ball carrier', 'Buena primera presión', 'Bon premier pressing')
  ];
  const dangerZones = [
    tr(lang, 'القناة اليمنى بين الظهير وقلب الدفاع', 'Right channel between fullback and center back', 'Canal derecho entre lateral y central', 'Couloir droit entre latéral et central'),
    tr(lang, 'منطقة 14 أمام الصندوق', 'Zone 14 in front of the box', 'Zona 14 frontal', 'Zone 14 devant la surface'),
    tr(lang, 'القائم البعيد عند العرضيات', 'Far post on crosses', 'Segundo palo en centros', 'Second poteau sur centres')
  ];
  const notes = tr(
    lang,
    `تحليل صورة ${fileName}: النظام المتوقع ${formation} بأسلوب ${style}. ركّز على غلق ${pick(dangerZones, seed + 9)} واستغل ${pick(weakZones, seed + 5)}.`,
    `Image analysis for ${fileName}: expected shape ${formation} with ${style}. Close ${pick(dangerZones, seed + 9)} and attack ${pick(weakZones, seed + 5)}.`,
    `Análisis de ${fileName}: forma esperada ${formation} con ${style}. Cierra ${pick(dangerZones, seed + 9)} y ataca ${pick(weakZones, seed + 5)}.`,
    `Analyse de ${fileName} : système probable ${formation} avec ${style}. Fermez ${pick(dangerZones, seed + 9)} et attaquez ${pick(weakZones, seed + 5)}.`
  );
  return {
    id: `shot-${Date.now()}`,
    mode,
    imageName: fileName,
    detectedFormation: formation,
    detectedPlaystyle: style,
    confidence: 78 + (seed % 17),
    strongZones: [pick(strongZones, seed), pick(strongZones, seed + 1)],
    weakZones: [pick(weakZones, seed + 2), pick(weakZones, seed + 3)],
    dangerZones: [pick(dangerZones, seed + 4), pick(dangerZones, seed + 5)],
    generatorAutofill: mode === 'squad' ? { myFormation: formation, myStyle: style, notes } : { oppFormation: formation, opponentStyle: style, notes },
    createdAt: new Date().toISOString()
  };
}

export function analyzeMatchLocally(fileName: string, inputs: MatchContextInput, lang: SupportedLang): MatchAnalysisResult {
  const seed = seedFrom(`${fileName}-${inputs.myTeam}-${inputs.opponentTeam}-${inputs.myFormation}-${inputs.opponentFormation}-${inputs.scoreline}-${inputs.possession}-${inputs.shots}-${inputs.notes || ''}`);
  const conceded = /0-?2|1-?3|lost|loss|خس/i.test(inputs.scoreline) || seed % 2 === 0;
  const myTeam = inputs.myTeam || tr(lang, 'فريقي', 'My team', 'Mi equipo', 'Mon équipe');
  const opponentTeam = inputs.opponentTeam || tr(lang, 'الخصم', 'Opponent', 'Rival', 'Adversaire');
  const myFormation = inputs.myFormation || '4-3-3';
  const opponentFormation = inputs.opponentFormation || '4-2-3-1';
  const myStyle = inputs.myStyle || tr(lang, 'متوازن', 'Balanced', 'Equilibrado', 'Équilibré');
  const opponentStyle = inputs.opponentStyle || tr(lang, 'غير معروف', 'Unknown', 'Desconocido', 'Inconnu');
  const centralBattle = myFormation.includes('2') && opponentFormation.includes('3')
    ? tr(lang, 'معركة العمق بين محورين وثلاثي صناعة لعب', 'Central battle: double pivot vs creative three', 'Batalla central: doble pivote contra tres creativos', 'Bataille axiale : double pivot contre trois créatifs')
    : tr(lang, 'المعركة الحاسمة في التحولات خلف الأظهرة', 'Decisive battle: transitions behind fullbacks', 'Batalla clave: transiciones tras laterales', 'Bataille clé : transitions derrière les latéraux');
  const directGoalsFor = Number(String(inputs.myGoals || '').replace(/[^0-9]/g, ''));
  const directGoalsAgainst = Number(String(inputs.opponentGoals || '').replace(/[^0-9]/g, ''));
  const scoreParts = (inputs.scoreline || '').match(/(\d+)\s*[-:]\s*(\d+)/);
  const goalsFor = Number.isFinite(directGoalsFor) && inputs.myGoals !== undefined && inputs.myGoals !== '' ? directGoalsFor : (scoreParts ? Number(scoreParts[1]) : (conceded ? 0 : 1));
  const goalsAgainst = Number.isFinite(directGoalsAgainst) && inputs.opponentGoals !== undefined && inputs.opponentGoals !== '' ? directGoalsAgainst : (scoreParts ? Number(scoreParts[2]) : (conceded ? 2 : 1));
  const normalizedScoreline = `${goalsFor}-${goalsAgainst}`;
  const goalDiff = goalsFor - goalsAgainst;
  const possessionNum = Number(String(inputs.possession || '50').replace(/[^0-9.]/g, '')) || 50;
  const shotNums = String(inputs.shots || '').match(/(\d+)\D+(\d+)/);
  const shotsFor = shotNums ? Number(shotNums[1]) : 6 + (seed % 6);
  const shotsAgainst = shotNums ? Number(shotNums[2]) : 6 + ((seed + 3) % 7);
  const attackScore = Math.max(35, Math.min(96, 62 + goalDiff * 8 + (shotsFor - shotsAgainst) * 2 + (possessionNum > 55 ? 5 : 0) + (seed % 7)));
  const defenseScore = Math.max(30, Math.min(96, 70 - goalsAgainst * 9 - Math.max(0, shotsAgainst - shotsFor) * 2 + (myFormation.includes('2') ? 6 : 0) + ((seed + 2) % 8)));
  const balanceScore = Math.max(35, Math.min(95, Math.round((attackScore + defenseScore) / 2) + (Math.abs(possessionNum - 50) < 10 ? 4 : -2)));
  const coachScore = Math.max(30, Math.min(97, Math.round(attackScore * 0.35 + defenseScore * 0.4 + balanceScore * 0.25)));
  const beforeScore = Math.max(25, coachScore - (conceded ? 12 : 7) - (seed % 5));
  const afterScore = Math.min(98, coachScore + 8 + (myFormation === '4-3-3' ? 5 : 3));
  const riskLevel = defenseScore < 55 || goalsAgainst >= 3
    ? tr(lang, 'مرتفع', 'High', 'Alto', 'Élevé')
    : balanceScore < 70 ? tr(lang, 'متوسط', 'Medium', 'Medio', 'Moyen') : tr(lang, 'منخفض', 'Low', 'Bajo', 'Faible');
  const diagnosis = conceded ? [
    tr(lang, 'الخسارة مرتبطة بفشل إغلاق العمق بعد فقد الكرة.', 'Main loss pattern: central protection failed after turnovers.', 'Patrón principal: falló la protección central tras pérdida.', 'Schéma principal : protection axiale faible après perte.'),
    tr(lang, 'الضغط الأول لا يوجه الخصم للطرف بالشكل الكافي.', 'The first press is not forcing the opponent wide enough.', 'La primera presión no fuerza al rival a banda.', 'Le premier pressing ne force pas assez sur les côtés.')
  ] : [
    tr(lang, 'الأداء متوازن لكن يحتاج تحويل الاستحواذ إلى فرص أوضح.', 'The performance is balanced, but possession needs clearer chance creation.', 'Rendimiento equilibrado, pero falta convertir posesión en ocasiones.', 'Performance équilibrée, mais possession peu convertie en occasions.'),
    tr(lang, 'المشكلة الأساسية في جودة القرار بالثلث الأخير.', 'The main issue is decision quality in the final third.', 'El problema está en la decisión en último tercio.', 'Le problème est la décision dans le dernier tiers.')
  ];
  return {
    id: `match-${Date.now()}`,
    imageName: fileName,
    myTeam,
    opponentTeam,
    myFormation,
    opponentFormation,
    myStyle,
    opponentStyle,
    matchState: inputs.matchState,
    notes: inputs.notes,
    scoreline: normalizedScoreline || inputs.scoreline || tr(lang, 'غير محدد', 'Not specified', 'No especificado', 'Non spécifié'),
    possession: inputs.possession || '50%',
    shots: inputs.shots || '—',
    tacticalVerdict: conceded
      ? tr(lang, `${myTeam} خسر المساحات الحاسمة ضد ${opponentTeam} لأن ${myFormation} لم يحمِ العمق أمام ${opponentFormation}.`, `${myTeam} lost decisive spaces against ${opponentTeam}: ${myFormation} did not protect the center against ${opponentFormation}.`, `${myTeam} perdió espacios decisivos ante ${opponentTeam}.`, `${myTeam} a perdu les espaces clés face à ${opponentTeam}.`)
      : tr(lang, `${myTeam} كان قريبًا من السيطرة، لكن يحتاج تحويل ${myStyle} إلى فرص أعلى جودة ضد ${opponentFormation}.`, `${myTeam} was close to control, but must turn ${myStyle} into higher-quality chances against ${opponentFormation}.`, `${myTeam} estuvo cerca de controlar.`, `${myTeam} était proche du contrôle.`),
    keyBattle: centralBattle,
    scoreReading: tr(lang, `قراءة النتيجة ${normalizedScoreline || inputs.scoreline || '—'} مع استحواذ ${inputs.possession || '50%'} وتسديدات ${inputs.shots || '—'} توضح أن المشكلة ليست رقمية فقط بل في أماكن صناعة الفرص ومنع المرتدة.`, `Score ${normalizedScoreline || inputs.scoreline || '—'}, possession ${inputs.possession || '50%'} and shots ${inputs.shots || '—'} show the issue is not just numbers; it is chance locations and counter prevention.`, `La lectura del marcador muestra problema táctico.`, `La lecture du score montre un problème tactique.`),
    teamReport: [
      tr(lang, `${myTeam}: الخطة ${myFormation} بأسلوب ${myStyle} تحتاج لاعب ارتكاز ثابت وقت تقدم الظهير.`, `${myTeam}: ${myFormation} with ${myStyle} needs a fixed pivot when a fullback advances.`, `${myTeam}: necesita pivote fijo.`, `${myTeam} : besoin d'une sentinelle fixe.`),
      tr(lang, `أفضل تعديل لفريقك: تقليل المخاطرة في التمريرة الأولى وزيادة الدعم حول حامل الكرة.`, `Best own-team tweak: reduce first-pass risk and add support around the ball carrier.`, `Mejor ajuste: menos riesgo en primer pase.`, `Meilleur ajustement : réduire le risque première passe.`)
    ],
    opponentReport: [
      tr(lang, `${opponentTeam}: ${opponentFormation} مع ${opponentStyle} يترك مساحة يمكن ضربها عند التحول السريع.`, `${opponentTeam}: ${opponentFormation} with ${opponentStyle} leaves space to attack in quick transition.`, `${opponentTeam}: deja espacio en transición.`, `${opponentTeam} : laisse de l'espace en transition.`),
      tr(lang, `نقطة استهداف الخصم: القناة بين الظهير وقلب الدفاع عند سحب الجناح للداخل.`, `Opponent target: channel between fullback and center back when the winger moves inside.`, `Objetivo: canal lateral-central.`, `Cible : couloir latéral-central.`)
    ],
    diagnosis,
    mistakes: [
      tr(lang, 'الظهير يتقدم بدون تغطية من لاعب الارتكاز.', 'Fullback advances without pivot cover.', 'Lateral sube sin cobertura del pivote.', 'Latéral monte sans couverture du sentinelle.'),
      tr(lang, 'تأخر في التحول الدفاعي بعد فقد الكرة.', 'Late defensive transition after losing the ball.', 'Transición defensiva tardía tras pérdida.', 'Transition défensive tardive après perte.'),
      tr(lang, 'تمريرات خطرة في العمق تحت الضغط.', 'Risky central passes under pressure.', 'Pases centrales arriesgados bajo presión.', 'Passes axiales risquées sous pression.')
    ],
    weakAreas: [
      tr(lang, 'منطقة 14', 'Zone 14', 'Zona 14', 'Zone 14'),
      tr(lang, 'خلف الظهير الأيسر', 'Behind the left fullback', 'Detrás del lateral izquierdo', 'Derrière le latéral gauche'),
      tr(lang, 'المسافة بين خط الوسط والدفاع', 'Gap between midfield and defense', 'Espacio entre medio y defensa', 'Espace milieu-défense')
    ],
    recommendations: [
      tr(lang, 'حوّل الخطة إلى 4-2-3-1 عند الدفاع للحفاظ على محورين.', 'Defend in a 4-2-3-1 to keep two pivots protecting the center.', 'Defiende en 4-2-3-1 con doble pivote.', 'Défendez en 4-2-3-1 avec double pivot.'),
      tr(lang, 'استخدم تعليمات البقاء بالخلف لأحد الظهيرين.', 'Keep one fullback on stay back instructions.', 'Deja un lateral con quedarse atrás.', 'Gardez un latéral en rester derrière.'),
      tr(lang, 'اضغط بعد فقد الكرة 5 ثوانٍ فقط ثم ارجع لبلوك متوسط.', 'Counter-press for 5 seconds, then drop into a mid block.', 'Presiona 5 segundos y vuelve a bloque medio.', 'Contre-pressez 5 secondes puis bloc médian.')
    ],
    training: [
      tr(lang, 'تدريب خروج الكرة تحت الضغط', 'Build-up under pressure drill', 'Salida bajo presión', 'Relance sous pression'),
      tr(lang, 'تدريب التحول الدفاعي 6 ضد 4', '6v4 defensive transition drill', 'Transición defensiva 6v4', 'Transition défensive 6v4')
    ],
    counterStrategy: tr(lang, 'ابدأ ببلوك متوسط، أغلق العمق، وهاجم المساحة خلف الظهير المتقدم.', 'Start in a mid block, close the center, and attack behind the advanced fullback.', 'Bloque medio, cerrar centro y atacar espalda del lateral.', 'Bloc médian, fermer l’axe et attaquer le dos du latéral.'),
    recommendedFormation: myFormation === '4-3-3' ? '4-2-3-1' : pick(['4-2-3-1', '4-4-2', '4-3-3'], seed),
    coachScore,
    attackScore,
    defenseScore,
    balanceScore,
    riskLevel,
    beforeScore,
    afterScore,
    nextMatchSetup: [
      tr(lang, `ابدأ بـ ${myFormation === '4-3-3' ? '4-2-3-1' : myFormation} ضد ${opponentFormation} مع محور ثابت.`, `Start with ${myFormation === '4-3-3' ? '4-2-3-1' : myFormation} against ${opponentFormation} with one fixed pivot.`, `Empieza con ajuste defensivo ante ${opponentFormation}.`, `Commencez avec un pivot fixe face au ${opponentFormation}.`),
      tr(lang, 'أول 15 دقيقة: بلوك متوسط بدون ضغط عشوائي.', 'First 15 minutes: mid block, no random pressing.', 'Primeros 15 min: bloque medio.', '15 premières minutes : bloc médian.'),
      tr(lang, 'لو استقبلت هدفًا: افتح جناح واحد فقط ولا تهاجم بالظهيرين معًا.', 'If you concede: open only one wing; do not attack with both fullbacks.', 'Si encajas: abre solo una banda.', 'Si vous encaissez : ouvrez une seule aile.')
    ],
    storagePolicy: 'local_first',
    createdAt: new Date().toISOString()
  };
}
