export interface TranslationDict {
  appName: string;
  tagline: string;
  startBtn: string;
  rivalBtn: string;
  homeTitle: string;
  activeGameBadge: string;
  savedPlansCount: string;
  rivalsObserved: string;
  remainingCredits: string;
  unlimited: string;
  backBtn: string;
  chooseGameHeader: string;
  inputsHeader: string;
  yourTeamLabel: string;
  oppTeamLabel: string;
  yourFormationLabel: string;
  oppFormationLabel: string;
  oppPlaystyleLabel: string;
  yourPlaystyleLabel: string;
  matchScenarioLabel: string;
  notesLabel: string;
  notesPlaceholder: string;
  generateBtn: string;
  generatingTitle: string;
  resultsHeader: string;
  saveBtn: string;
  shareBtn: string;
  copyBtn: string;
  copiedSuccess: string;
  editInputsBtn: string;
  defensiveSettingsTitle: string;
  attackingSettingsTitle: string;
  playerInstructionsTitle: string;
  gameplayStrategyTitle: string;
  emergencyPlanTitle: string;
  protectLeadPlanTitle: string;
  mistakesTitle: string;
  difficultyTitle: string;
  confidenceTitle: string;
  libraryTitle: string;
  emptyLibraryTitle: string;
  emptyLibraryDesc: string;
  rivalsTitle: string;
  addRivalBtn: string;
  allGamesTab: string;
  fifatab: string;
  pesTab: string;
  scoutingReportTitle: string;
  breakHisTacticBtn: string;
  pricingTitle: string;
  pricingDesc: string;
  bestValueBadge: string;
  seriousPlayersBadge: string;
  eliteCoachBadge: string;
  freeTitle: string;
  proTitle: string;
  eliteTitle: string;
  freeDesc: string;
  proDesc: string;
  eliteDesc: string;
  startFreeBtn: string;
  upgradeProBtn: string;
  joinEliteBtn: string;
  activePlanBadge: string;
  settingsTitle: string;
  userPrefsTitle: string;
  usernameLabel: string;
  favGameLabel: string;
  navHome: string;
  navGenerator: string;
  navLibrary: string;
  navRivals: string;
  navSubs: string;
  navSettings: string;
  searchGamesPlaceholder: string;
}

export type SupportedLang = 'ar' | 'en' | 'es' | 'fr';

export const countryFlags: Record<SupportedLang, { name: string; flag: string }> = {
  ar: { name: 'العربية (مصر)', flag: '🇪🇬' },
  en: { name: 'English (US)', flag: '🇺🇸' },
  es: { name: 'Español (ES)', flag: '🇪🇸' },
  fr: { name: 'Français (FR)', flag: '🇫🇷' },
};

export const translations: Record<SupportedLang, TranslationDict> = {
  ar: {
    appName: "Tactic Boss",
    tagline: "خطتك تبدأ قبل المباراة. ابنِ تكتيكك، افهم خصمك، وادخل الملعب بقرار واضح.",
    startBtn: "ابدأ خطة الفوز",
    rivalBtn: "اعمل خطة ضد خصمك",
    homeTitle: "مركز المدرب التكتيكي",
    activeGameBadge: "الموسم المحدث 2026",
    savedPlansCount: "خطط محفوظة",
    rivalsObserved: "خصوم تحت الرصد",
    remainingCredits: "الخطط المجانية المتبقية",
    unlimited: "مفتوح",
    backBtn: "رجوع",
    chooseGameHeader: "اختر إصدار اللعبة",
    inputsHeader: "مدخلات الخطة التكتيكية",
    yourTeamLabel: "النادي أو المنتخب المختار من طرفك",
    oppTeamLabel: "النادي أو المنتخب الخاص بالخصم",
    yourFormationLabel: "خطة وتشكيلة فريقك",
    oppFormationLabel: "خطة تشكيلة الخصم المتوقعة",
    oppPlaystyleLabel: "أسلوب لعب الخصم الطاغي",
    yourPlaystyleLabel: "أسلوب اللعب المفضل لديك",
    matchScenarioLabel: "حالة وجو المباراة",
    notesLabel: "أي ملاحظات إضافية للمدرب التكتيكي؟",
    notesPlaceholder: "مثال: مهاجمي بطيء جداً، أو خصمي يهاجم كالأهوج من الأطراف فقط...",
    generateBtn: "ولّد الخطة التكتيكية الفتاكة",
    generatingTitle: "المدرب التكتيكي بيحلل خطة الخصم بامتياز...",
    resultsHeader: "تقرير التكتيك الموصى به لقطع خصمك",
    saveBtn: "حفظ التكتيك",
    shareBtn: "مشاركة الخطة",
    copyBtn: "نسخ التكتيك",
    copiedSuccess: "تم النسخ بنجاح لحافظة جهازك!",
    editInputsBtn: "تعديل المدخلات",
    defensiveSettingsTitle: "الخيارات والتعليمات الدفاعية المحددة",
    attackingSettingsTitle: "الخيارات والتعليمات الهجومية المحددة",
    playerInstructionsTitle: "تعليمات وتوصيف أدوار اللاعبين بدقة",
    gameplayStrategyTitle: "التعليمات الفورية وتكتيك اللعب المباشر",
    emergencyPlanTitle: "خطة الطوارئ بحال التأخر في النتيجة",
    protectLeadPlanTitle: "تكتيك الحفاظ على التقدم وحماية الشباك النظيفة",
    mistakesTitle: "أخطاء كارثية تجنب ارتكابها أثناء التنافس",
    difficultyTitle: "مستوى صعوبة تطبيق تكتيك المباراة",
    confidenceTitle: "مؤشر الثقة التكتيكية",
    libraryTitle: "مكتبة خططي",
    emptyLibraryTitle: "سجل خططك فارغ حالياً يا كوتش",
    emptyLibraryDesc: "عند إنشاء خطة، اضغط على الحفظ لتجدها هنا جاهزة قبل المباراة.",
    rivalsTitle: "ملفات الخصوم",
    addRivalBtn: "رصد خصم جديد",
    allGamesTab: "جميع الألعاب",
    fifatab: "FIFA / EA FC",
    pesTab: "PES / eFootball",
    scoutingReportTitle: "تقرير رصد الخصم",
    breakHisTacticBtn: "اكسر تكتيك هذا الخصم عاجلاً",
    pricingTitle: "باقات اشتراك المدربين",
    pricingDesc: "تحكّم في الملعب والمنافسة، افتح قفل ميزات المحرك التكتيكي المتقدمة مع أسلوب الميتا الحديث.",
    bestValueBadge: "القيمة الأفضل",
    seriousPlayersBadge: "للاعبين الجادين",
    eliteCoachBadge: "المدرب النخبة",
    freeTitle: "الباقة المجانية",
    proTitle: "الباقة الاحترافية",
    eliteTitle: "باقة النخبة",
    freeDesc: "مناسبة للبداية الجادة: 30 خطة شهريًا و3 خطط يوميًا مع تحديات وMeta يومية.",
    proDesc: "توليدات غير محدودة، تجسس كامل على 5 خصوم، وتحميل مجاني لتكتيكات الميتا.",
    eliteDesc: "أولوية لمحرك سحابي فائق السرعة، دعم لجميع ألعاب كرة القدم، وتجسس وخطط طوارئ مخصصة.",
    startFreeBtn: "ابدأ مجانًا",
    upgradeProBtn: "الترقية للباقة الاحترافية",
    joinEliteBtn: "الانضمام للمدربين النخبة",
    activePlanBadge: "خطتك الفعالة حالياً",
    settingsTitle: "إعدادات الحساب والتطبيق",
    userPrefsTitle: "بيانات الحساب واللعبة",
    usernameLabel: "اسم المدرب أو الجيمر",
    favGameLabel: "اللعبة الأساسية",
    navHome: "الرئيسية",
    navGenerator: "الخطط",
    navLibrary: "خططي",
    navRivals: "الخصوم",
    navSubs: "الاشتراك",
    navSettings: "الضبط",
    searchGamesPlaceholder: "ابحث عن اللعبة... (مثال: FC 26)",
  },
  en: {
    appName: "Tactic Boss",
    tagline: "Build authentic tactics, counter rivals and prepare for every match.",
    startBtn: "Start Winning Tactic",
    rivalBtn: "Counter specific Rival",
    homeTitle: "Tactical Manager",
    activeGameBadge: "Updated Season 2026",
    savedPlansCount: "Saved Tactics",
    rivalsObserved: "Rivals Watched",
    remainingCredits: "Free Tactic Credits Left",
    unlimited: "Unlimited",
    backBtn: "Back",
    chooseGameHeader: "Select Game Version",
    inputsHeader: "Tactical Inputs",
    yourTeamLabel: "Your Selected Team",
    oppTeamLabel: "Opponent's Selected Team",
    yourFormationLabel: "Your Current Formation",
    oppFormationLabel: "Opponent's Custom Formation",
    oppPlaystyleLabel: "Opponent's Dominant Playstyle",
    yourPlaystyleLabel: "Your Preferred Playstyle",
    matchScenarioLabel: "Match Air / Scenario State",
    notesLabel: "Any Extra Notes for the Tactical Coach?",
    notesPlaceholder: "e.g. My striker is too slow, or opponent keeps abusing wings crossed...",
    generateBtn: "Generate Critical Tactical Plan",
    generatingTitle: "Tactical Coach is breaking down opponent systems...",
    resultsHeader: "Recommended Pro Tactic Report",
    saveBtn: "Save Tactic",
    shareBtn: "Share / Broadcast",
    copyBtn: "Copy Text",
    copiedSuccess: "Successfully copied to your clipboard!",
    editInputsBtn: "Modify Inputs",
    defensiveSettingsTitle: "Detailed Custom Defensive Settings",
    attackingSettingsTitle: "Detailed Custom Offensive Settings",
    playerInstructionsTitle: "Custom Player Instructions",
    gameplayStrategyTitle: "Immediate In-game Gameplay Strategy",
    emergencyPlanTitle: "Emergency Playbook (Chasing Game)",
    protectLeadPlanTitle: "Scoreboard Defense (Protecting Lead)",
    mistakesTitle: "Fatal Mistakes to Avoid in-game",
    difficultyTitle: "Implementation / Execution Difficulty",
    confidenceTitle: "Tactical Confidence",
    libraryTitle: "My Saved BOSS Tactics",
    emptyLibraryTitle: "Tactics vault is vacant",
    emptyLibraryDesc: "Generate a tactic, save the result, and find it here before match start.",
    rivalsTitle: "Observed Game Competitors (Rivals)",
    addRivalBtn: "Observe New Rival",
    allGamesTab: "All Games",
    fifatab: "FIFA / EA FC",
    pesTab: "PES / eFootball",
    scoutingReportTitle: "Scouting Report Analysis",
    breakHisTacticBtn: "Generate Counter-Tactic Instantly",
    pricingTitle: "Pro Manager Plans",
    pricingDesc: "Dominate division matches, unlock advanced modern meta integrations and limitless saved slots.",
    bestValueBadge: "Best Value",
    seriousPlayersBadge: "For Serious Pro Players",
    eliteCoachBadge: "Elite Pro Coach",
    freeTitle: "Casual Coach (Free)",
    proTitle: "Pro Boss Tactic",
    eliteTitle: "Elite Coach System",
    freeDesc: "Includes up to 3 custom tactician outputs every month.",
    proDesc: "Unlimited outputs, total observation of up to 5 rivals and free download of meta blueprints.",
    eliteDesc: "Server priority cloud speed, instant compatibility with every simulator and custom game emergency plans.",
    startFreeBtn: "Start for Free",
    upgradeProBtn: "Upgrade to Pro Boss",
    joinEliteBtn: "Join Elite Coaches",
    activePlanBadge: "Your Current Plan status",
    settingsTitle: "Tactics Boss System Configuration",
    userPrefsTitle: "Account and Game Profile",
    usernameLabel: "Coach / Gamer Tag",
    favGameLabel: "Favorite Primary Simulator Game",
    navHome: "Home",
    navGenerator: "Tactics",
    navLibrary: "My Tactics",
    navRivals: "Rivals",
    navSubs: "Premium",
    navSettings: "Settings",
    searchGamesPlaceholder: "Look up a game... (e.g., FC 26)",
  },
  es: {
    appName: "Tactic Boss",
    tagline: "¡Destruye las tácticas de tus rivales antes del silbatazo! Inteligencia para gamers.",
    startBtn: "Iniciar Táctica de Victoria",
    rivalBtn: "Contrarrestar Rival",
    homeTitle: "Centro táctico",
    activeGameBadge: "Temporada 2026 Actualizada",
    savedPlansCount: "Tácticas Guardadas",
    rivalsObserved: "Rivales Observados",
    remainingCredits: "Créditos tácticos restantes",
    unlimited: "Ilimitado",
    backBtn: "Atrás",
    chooseGameHeader: "Seleccionar Versión del Juego",
    inputsHeader: "Entradas tácticas",
    yourTeamLabel: "Tu Equipo Seleccionado",
    oppTeamLabel: "Equipo Rival",
    yourFormationLabel: "Tu Formación Actual",
    oppFormationLabel: "Formación del Rival",
    oppPlaystyleLabel: "Estilo Dominante del Rival",
    yourPlaystyleLabel: "Tu Estilo Preferido",
    matchScenarioLabel: "Escenario de Partido",
    notesLabel: "¿Notas Adicionales para el Entrenador?",
    notesPlaceholder: "Ej. Mi delantero es lento, o el rival abusa de centros por las bandas...",
    generateBtn: "Generar Plan Táctico Crítico",
    generatingTitle: "El motor táctico está analizando el sistema rival...",
    resultsHeader: "Informe Táctico Profesional Recomendado",
    saveBtn: "Guardar Táctica",
    shareBtn: "Compartir / Emitir",
    copyBtn: "Copiar Táctica",
    copiedSuccess: "¡Copiado correctamente al portapapeles!",
    editInputsBtn: "Modificar Entradas",
    defensiveSettingsTitle: "Configuraciones Defensivas Detalladas",
    attackingSettingsTitle: "Configuraciones Ofensivas Detalladas",
    playerInstructionsTitle: "Instrucciones de Jugador Personalizadas",
    gameplayStrategyTitle: "Estrategia de Juego Directa e Inmediata",
    emergencyPlanTitle: "Manual de Emergencia (En Desventaja)",
    protectLeadPlanTitle: "Defensa del Marcador (Protegiendo Liderazgo)",
    mistakesTitle: "Errores Fatales a Evitar en el Juego",
    difficultyTitle: "Dificultad de Implementación / Ejecución",
    confidenceTitle: "Confianza táctica",
    libraryTitle: "Mis Tácticas BOSS Guardadas",
    emptyLibraryTitle: "La bóveda de tácticas está vacía",
    emptyLibraryDesc: "Genera una táctica, guárdala y encuéntrala aquí antes del partido.",
    rivalsTitle: "Rivales de Juego Observados",
    addRivalBtn: "Observar Nuevo Rival",
    allGamesTab: "Todos los Juegos",
    fifatab: "FIFA / EA FC",
    pesTab: "PES / eFootball",
    scoutingReportTitle: "Análisis del Reporte de Escultismo",
    breakHisTacticBtn: "Generar Contra-Táctica Instantáneamente",
    pricingTitle: "Planes de Entrenador Pro",
    pricingDesc: "Domina las divisiones, desbloquea las integraciones meta avanzadas y ranuras ilimitadas.",
    bestValueBadge: "Mejor Valor",
    seriousPlayersBadge: "Para Jugadores Serios",
    eliteCoachBadge: "Entrenador de Élite",
    freeTitle: "Entrenador Casual (Gratis)",
    proTitle: "Táctica Pro Boss",
    eliteTitle: "Sistema de Entrenador Élite",
    freeDesc: "Incluye hasta 3 planes tácticos al mes.",
    proDesc: "Tácticas ilimitadas, observación de hasta 5 rivales y descargas gratis de metas.",
    eliteDesc: "Prioridad de servicio, compatibilidad y planes de emergencia extra.",
    startFreeBtn: "Comenzar Gratis",
    upgradeProBtn: "Mejorar a Pro Boss",
    joinEliteBtn: "Unirse a Entrenadores Élite",
    activePlanBadge: "Estado de tu Plan Activo",
    settingsTitle: "Configuración del Sistema Tactics Boss",
    userPrefsTitle: "Cuenta y juego principal",
    usernameLabel: "Nombre de Entrenador",
    favGameLabel: "Simulador Favorito Principal",
    navHome: "Inicio",
    navGenerator: "Tácticas",
    navLibrary: "Mis Tácticas",
    navRivals: "Rivales",
    navSubs: "Premium",
    navSettings: "Ajustes",
    searchGamesPlaceholder: "Buscar un juego... (ej., FC 26)",
  },
  fr: {
    appName: "Tactic Boss",
    tagline: "Détruisez les plans de vos rivaux avant le coup d'envoi ! Outils tactiques professionnels.",
    startBtn: "Lancer la Tactique Gagnante",
    rivalBtn: "Contrer un Rival Spécifique",
    homeTitle: "Centre tactique",
    activeGameBadge: "Saison 2026 Mise à Jour",
    savedPlansCount: "Tactiques Enregistrées",
    rivalsObserved: "Rivaux Observés",
    remainingCredits: "Crédits tactiques restants",
    unlimited: "Illimité",
    backBtn: "Retour",
    chooseGameHeader: "Choisir la Version",
    inputsHeader: "Données tactiques",
    yourTeamLabel: "Votre Équipe Sélectionnée",
    oppTeamLabel: "Équipe Adverse",
    yourFormationLabel: "Votre Schéma Tactique",
    oppFormationLabel: "Schéma Tactique Adverse",
    oppPlaystyleLabel: "Style de Jeu Écrasant du Rival",
    yourPlaystyleLabel: "Votre Style de Jeu Préféré",
    matchScenarioLabel: "Scénario et Climat du Match",
    notesLabel: "Remarques Supplémentaires pour le Coach ?",
    notesPlaceholder: "Ex. Mon buteur est très lent, ou l'adversaire abuse des centres verticaux...",
    generateBtn: "Générer la Tactique Implacable",
    generatingTitle: "Le moteur tactique analyse les faiblesses adverses...",
    resultsHeader: "Rapport Tactique Pro Recommandé",
    saveBtn: "Sauvegarder",
    shareBtn: "Partager / Diffuser",
    copyBtn: "Copier le Texte",
    copiedSuccess: "Copié avec succès de façon instantanée !",
    editInputsBtn: "Modifier les Paramètres",
    defensiveSettingsTitle: "Instructions Défensives Rigoureuses",
    attackingSettingsTitle: "Instructions Offensives Avancées",
    playerInstructionsTitle: "Rôles Individuels Précis des Joueurs",
    gameplayStrategyTitle: "Stratégie Directe en Plein Match",
    emergencyPlanTitle: "Plan d'Urgence (En Cas de Retard)",
    protectLeadPlanTitle: "Tactique Block-Bas pour Verrouiller la Victoire",
    mistakesTitle: "Erreurs Fatales à Éviter Absolument",
    difficultyTitle: "Difficulté de Prise en Main Tactique",
    confidenceTitle: "Niveau de confiance tactique",
    libraryTitle: "Mon Coffre-Fort de Tactiques BOSS",
    emptyLibraryTitle: "Le coffre-fort est vide pour l'instant",
    emptyLibraryDesc: "Générez une tactique, sauvegardez-la et retrouvez-la ici avant le coup d'envoi.",
    rivalsTitle: "Rivaux sous Surveillance de Jeu",
    addRivalBtn: "Surveiller un Nouveau Rival",
    allGamesTab: "Tous les Jeux",
    fifatab: "FIFA / EA FC",
    pesTab: "PES / eFootball",
    scoutingReportTitle: "Rapport d'Espionnage Sportif",
    breakHisTacticBtn: "Générer une Contre-Tactique Immédiate",
    pricingTitle: "Abonnements d'Entraîneur",
    pricingDesc: "Dominez vos adversaires en ligne, débloquez les analyses méta premium et les slots de sauvegarde illimités.",
    bestValueBadge: "Meilleur Choix",
    seriousPlayersBadge: "Pour Compétiteurs Hors-Pair",
    eliteCoachBadge: "Entraîneur d'Élite",
    freeTitle: "Coach Occasionnel (Gratuit)",
    proTitle: "Tactique Pro Boss",
    eliteTitle: "Système de Management Élite",
    freeDesc: "Comprend jusqu'à 3 fiches de contre-tactiques générées mensuellement.",
    proDesc: "Générations illimitées, fiches d'espionnage complètes pour 5 rivaux et téléchargement méta.",
    eliteDesc: "Accès prioritaire, compatibilité globale et plans d'urgence personnalisés.",
    startFreeBtn: "Démarrer Gratuitement",
    upgradeProBtn: "Passer à l'offre Pro Boss",
    joinEliteBtn: "Rejoindre l'Élite des Entraîneurs",
    activePlanBadge: "Votre Statut d'Abonnement Actuel",
    settingsTitle: "Configuration Tactic Boss",
    userPrefsTitle: "Compte et jeu principal",
    usernameLabel: "Pseudo / Identifiant de Joueur",
    favGameLabel: "Votre Simulateur Spatial Préféré",
    navHome: "Accueil",
    navGenerator: "Tácticas",
    navLibrary: "Mes Tactiques",
    navRivals: "Rivales",
    navSubs: "Abonnement",
    navSettings: "Ajustements",
    searchGamesPlaceholder: "Chercher un simulateur... (ex., FC 26)",
  }
};
