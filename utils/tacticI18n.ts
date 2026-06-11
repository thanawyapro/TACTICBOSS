import { SupportedLang } from './lang';
import { TacticResult } from '../types';

const termMap: Record<string, Partial<Record<SupportedLang,string>>> = {
  'Balanced': {ar:'متوازن (Balanced)',es:'Equilibrado',fr:'Équilibré'},
  'Possession': {ar:'استحواذ (Possession)',es:'Posesión',fr:'Possession'},
  'Quick Counter': {ar:'هجمة مرتدة سريعة (Quick Counter)',es:'Contraataque rápido',fr:'Contre-attaque rapide'},
  'Long Ball Counter': {ar:'مرتدات بالكرات الطويلة (Long Ball Counter)',es:'Contraataque con balón largo',fr:'Contre au ballon long'},
  'Out Wide': {ar:'لعب على الأطراف (Out Wide)',es:'Juego por bandas',fr:'Jeu sur les ailes'},
  'High Press': {ar:'ضغط عالٍ (High Press)',es:'Presión alta',fr:'Pressing haut'},
  'Direct Passing': {ar:'تمرير مباشر (Direct Passing)',es:'Pase directo',fr:'Passes directes'},
  'Fast Build Up': {ar:'بناء سريع (Fast Build Up)',es:'Construcción rápida',fr:'Construction rapide'},
  'All-out Defence': {ar:'دفاع شامل (All-out Defence)',es:'Defensa total',fr:'Défense totale'},
  'Aggressive': {ar:'ضغط هجومي (Aggressive)',es:'Agresivo',fr:'Agressif'},
  'Conservative': {ar:'ضغط محافظ (Conservative)',es:'Conservador',fr:'Prudent'},
  'Middle': {ar:'العمق (Middle)',es:'Centro',fr:'Axe'},
  'Wide': {ar:'الأطراف (Wide)',es:'Bandas',fr:'Largeur'},
  'Short-pass': {ar:'تمرير قصير (Short-pass)',es:'Pase corto',fr:'Passe courte'},
  'Flexible': {ar:'مرن (Flexible)',es:'Flexible',fr:'Flexible'},
  'Defensive Style': {ar:'الأسلوب الدفاعي',es:'Estilo defensivo',fr:'Style défensif'},
  'Defensive Approach': {ar:'النهج الدفاعي',es:'Enfoque defensivo',fr:'Approche défensive'},
  'Defensive Line': {ar:'ارتفاع خط الدفاع',es:'Línea defensiva',fr:'Ligne défensive'},
  'Compactness': {ar:'تقارب الخطوط',es:'Compacidad',fr:'Compacité'},
  'Containment Area': {ar:'منطقة الاحتواء',es:'Zona de contención',fr:'Zone de confinement'},
  'Pressuring': {ar:'نوع الضغط',es:'Presión',fr:'Pressing'},
  'Team Playstyle': {ar:'أسلوب لعب الفريق',es:'Estilo de equipo',fr:'Style collectif'},
  'Individual Instructions': {ar:'التعليمات الفردية',es:'Instrucciones individuales',fr:'Consignes individuelles'},
  'Build Up': {ar:'بناء اللعب',es:'Construcción',fr:'Construction'},
  'Build Up Play': {ar:'طريقة بناء اللعب',es:'Construcción de juego',fr:'Construction du jeu'},
  'Build Up Style': {ar:'أسلوب البناء',es:'Estilo de construcción',fr:'Style de construction'},
  'Build Up Focus': {ar:'تركيز البناء',es:'Enfoque de construcción',fr:'Priorité de construction'},
  'Attacking Area': {ar:'منطقة الهجوم',es:'Zona de ataque',fr:'Zone offensive'},
  'Positioning': {ar:'التمركز',es:'Posicionamiento',fr:'Positionnement'},
  'Support Range': {ar:'مدى الدعم',es:'Distancia de apoyo',fr:'Distance de soutien'},
  'Advanced Instructions': {ar:'التعليمات المتقدمة',es:'Instrucciones avanzadas',fr:'Consignes avancées'},
  'Chance Creation': {ar:'صناعة الفرص',es:'Creación de ocasiones',fr:'Création d’occasions'},
  'Width': {ar:'العرض',es:'Anchura',fr:'Largeur'},
  'Depth': {ar:'العمق الدفاعي',es:'Profundidad',fr:'Profondeur'},
  'Players In Box': {ar:'عدد اللاعبين داخل المنطقة',es:'Jugadores en el área',fr:'Joueurs dans la surface'},
  'Corners / Free Kicks': {ar:'الركنيات / الركلات الحرة',es:'Córners / faltas',fr:'Corners / coups francs'},
  'Player Roles': {ar:'أدوار اللاعبين',es:'Roles de jugadores',fr:'Rôles des joueurs'},
  'Smart Tactics': {ar:'التكتيكات الذكية',es:'Tácticas inteligentes',fr:'Tactiques intelligentes'},
  'Counter Adjustment': {ar:'تعديل مضاد للخصم',es:'Ajuste contra el rival',fr:'Ajustement anti-adversaire'},
  'Medium': {ar:'متوسط',es:'Medio',fr:'Moyen'},
  'High': {ar:'مرتفع',es:'Alto',fr:'Élevé'},
  'Very High': {ar:'مرتفع جدًا',es:'Muy alto',fr:'Très élevé'},
  'Medium-Low': {ar:'متوسط إلى منخفض',es:'Medio-bajo',fr:'Moyen-bas'},
  'Centre': {ar:'العمق (Centre)',es:'Centro',fr:'Axe'},
  'Role-led': {ar:'حسب أدوار اللاعبين',es:'Guiado por roles',fr:'Guidé par les rôles'}
};

export function translateTacticText(value: string, lang: SupportedLang): string {
  if (lang === 'en') return value;
  if (termMap[value]?.[lang]) return termMap[value]![lang]!;
  let result = value;
  Object.entries(termMap).forEach(([source, translations]) => {
    const translated = translations[lang];
    if (translated && result.includes(source)) result = result.replaceAll(source, translated);
  });
  return result;
}

const generic: Record<SupportedLang, {
  reason:(formation:string,opp:string,style:string)=>string;
  instructions:string[]; mistakes:string[]; inGame:string; emergency:string; protect:string; difficulty:string;
}> = {
  ar: {
    reason:(f,o,s)=>`تم اختيار ${f} لمواجهة ${o} وأسلوب ${s}. تم تحليل توزيع اللاعبين على السبورة، ويُنصح بالحفاظ على لاعب ارتكاز يغطي المساحات أثناء التحول.`,
    instructions:['حافظ على توازن واضح بين من يتقدم ومن يغطي.','اجعل لاعب الارتكاز قريبًا من قلبي الدفاع.','غيّر اتجاه اللعب بعد جذب ضغط الخصم.'],
    mistakes:['لا ترسل الظهيرين للأمام في نفس اللحظة.','لا تسحب قلب الدفاع بعيدًا عن الخط.','تجنب الضغط العشوائي بدون تغطية.'],
    inGame:'ابدأ بإيقاع متوازن، راقب أول عشر دقائق، ثم استغل الجهة الأضعف التي تظهر على السبورة.',
    emergency:'عند التأخر، زِد لاعبًا بين الخطوط مع الاحتفاظ بارتكاز واحد لحماية المرتدات.',
    protect:'عند التقدم، خفّض المخاطرة وثبّت الظهيرين وحافظ على كتلة متوسطة متقاربة.',
    difficulty:'متوسطة — تحتاج التزامًا بالأدوار'
  },
  en: {
    reason:(f,o,s)=>`${f} is selected to face ${o} and the opponent's ${s} approach. The board shape was reviewed, with one holding midfielder recommended to protect transitions.`,
    instructions:['Keep a clear balance between runners and cover players.','Keep the holding midfielder close to the center-backs.','Switch play after attracting the opponent press.'],
    mistakes:['Do not send both fullbacks forward at the same time.','Do not drag a center-back out of the defensive line.','Avoid unstructured pressing without cover.'],
    inGame:'Start balanced, read the first ten minutes, then attack the weaker side shown by the board.',
    emergency:'When trailing, add a player between the lines while keeping one midfielder protecting counters.',
    protect:'When leading, reduce risk, hold the fullbacks and defend in a compact medium block.',
    difficulty:'Medium — requires role discipline'
  },
  es: {
    reason:(f,o,s)=>`Se recomienda ${f} para enfrentar ${o} y el estilo ${s}. La disposición de la pizarra fue analizada y conviene mantener un mediocentro de cobertura.`,
    instructions:['Mantén equilibrio entre los jugadores que avanzan y los que cubren.','Coloca al mediocentro cerca de los centrales.','Cambia de orientación después de atraer la presión.'],
    mistakes:['No subas ambos laterales al mismo tiempo.','No saques a un central de la línea defensiva.','Evita presionar sin una cobertura organizada.'],
    inGame:'Empieza con equilibrio, analiza los primeros diez minutos y ataca el lado más débil.',
    emergency:'Si vas perdiendo, añade un jugador entre líneas y conserva un mediocentro para frenar contras.',
    protect:'Si vas ganando, reduce riesgos, fija los laterales y mantén un bloque medio compacto.',
    difficulty:'Media — exige disciplina táctica'
  },
  fr: {
    reason:(f,o,s)=>`${f} est recommandé face au ${o} et au style ${s}. La disposition du tableau a été analysée; gardez un milieu sentinelle pour protéger les transitions.`,
    instructions:['Gardez un équilibre entre les joueurs projetés et ceux qui couvrent.','Maintenez le milieu défensif proche des défenseurs centraux.','Renversez le jeu après avoir attiré le pressing adverse.'],
    mistakes:['Ne faites pas monter les deux latéraux en même temps.','Ne sortez pas un défenseur central de la ligne.','Évitez un pressing désorganisé sans couverture.'],
    inGame:'Commencez de manière équilibrée, observez les dix premières minutes, puis attaquez le côté le plus faible.',
    emergency:'En cas de retard, ajoutez un joueur entre les lignes tout en gardant une sentinelle contre les contres.',
    protect:'En cas d’avance, réduisez les risques, bloquez les latéraux et gardez un bloc médian compact.',
    difficulty:'Moyenne — demande de la discipline tactique'
  }
};

export function normalizeResultLanguage(result: TacticResult, lang: SupportedLang, oppFormation: string, opponentStyle: string): TacticResult {
  if (lang === 'ar') return {
    ...result,
    defensiveStyle: translateTacticText(result.defensiveStyle, lang),
    attackingStyle: translateTacticText(result.attackingStyle, lang),
    defensiveDetails: Object.fromEntries(Object.entries(result.defensiveDetails).map(([k,v])=>[translateTacticText(k,lang),translateTacticText(v,lang)])),
    attackingDetails: Object.fromEntries(Object.entries(result.attackingDetails).map(([k,v])=>[translateTacticText(k,lang),translateTacticText(v,lang)]))
  };
  const g = generic[lang];
  return {
    ...result,
    reason:g.reason(result.formation, oppFormation, translateTacticText(opponentStyle,lang)),
    defensiveStyle:translateTacticText(result.defensiveStyle,lang),
    attackingStyle:translateTacticText(result.attackingStyle,lang),
    defensiveDetails:Object.fromEntries(Object.entries(result.defensiveDetails).map(([k,v])=>[translateTacticText(k,lang),translateTacticText(v,lang)])),
    attackingDetails:Object.fromEntries(Object.entries(result.attackingDetails).map(([k,v])=>[translateTacticText(k,lang),translateTacticText(v,lang)])),
    playerInstructions:g.instructions,
    mistakesToAvoid:g.mistakes,
    inGameStrategy:g.inGame,
    emergencyPlan:g.emergency,
    protectLeadPlan:g.protect,
    difficulty:g.difficulty
  };
}

const optionLabels: Record<string, Record<SupportedLang,string>> = {
  'ضغط عالي':{ar:'ضغط عالٍ',en:'High press',es:'Presión alta',fr:'Pressing haut'},
  'سرعة من الأطراف':{ar:'سرعة وهجوم من الأطراف',en:'Fast wing attacks',es:'Ataques rápidos por bandas',fr:'Attaques rapides sur les ailes'},
  'استحواذ':{ar:'استحواذ وتمرير قصير',en:'Possession and short passing',es:'Posesión y pases cortos',fr:'Possession et passes courtes'},
  'دفاع متأخر':{ar:'دفاع متراجع ومرتدات',en:'Low block and counters',es:'Bloque bajo y contras',fr:'Bloc bas et contres'},
  'عرضيات':{ar:'اعتماد على العرضيات',en:'Crossing-focused',es:'Juego de centros',fr:'Jeu de centres'},
  'لعب من العمق':{ar:'لعب من العمق',en:'Play through the middle',es:'Juego por el centro',fr:'Jeu dans l’axe'},
  'كرات طويلة':{ar:'كرات طويلة',en:'Long balls',es:'Balones largos',fr:'Longs ballons'},
  'مهارات وفرديات':{ar:'مهارات وفرديات',en:'Dribbling and skills',es:'Regates y filigranas',fr:'Dribbles et gestes techniques'},
  'متوازن':{ar:'متوازن',en:'Balanced',es:'Equilibrado',fr:'Équilibré'},
  'هجومي':{ar:'هجومي',en:'Attacking',es:'Ofensivo',fr:'Offensif'},
  'دفاعي':{ar:'دفاعي',en:'Defensive',es:'Defensivo',fr:'Défensif'},
  'مرتدات':{ar:'مرتدات سريعة',en:'Fast counters',es:'Contras rápidas',fr:'Contres rapides'},
  'بداية الماتش':{ar:'بداية المباراة (0-0)',en:'Kick-off (0-0)',es:'Inicio del partido (0-0)',fr:'Début du match (0-0)'},
  'متعادل':{ar:'التعادل والخصم مستحوذ',en:'Level score, opponent controlling',es:'Empate y rival dominando',fr:'Égalité, adversaire dominant'},
  'أنا كسبان':{ar:'متقدم وأريد حماية النتيجة',en:'Leading and protecting the score',es:'Voy ganando y quiero proteger',fr:'Je mène et protège le score'},
  'أنا خسران':{ar:'متأخر وأحتاج للعودة',en:'Trailing and need a comeback',es:'Voy perdiendo y necesito remontar',fr:'Je suis mené et dois revenir'},
  'آخر 10 دقائق':{ar:'آخر 10 دقائق',en:'Final 10 minutes',es:'Últimos 10 minutos',fr:'10 dernières minutes'}
};
export function optionLabel(value:string, lang:SupportedLang):string { return optionLabels[value]?.[lang] || value; }
