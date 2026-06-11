export interface GameItem {
  id: string;
  name: string;
  category: 'PES/eFootball' | 'FIFA/EA FC';
  year: number;
  badgeColor: string;
  iconText: string;
  gameplayDescription: {
    ar: string;
    en: string;
    es: string;
    fr: string;
  };
}

export const GAMES_LIST: GameItem[] = [
  // EA SPORTS FC & FIFA
  { 
    id: 'ea-fc-26', 
    name: 'EA SPORTS FC 26', 
    category: 'FIFA/EA FC', 
    year: 2026, 
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', 
    iconText: 'FC26',
    gameplayDescription: {
      ar: 'جيم بلاي مبني على الـ FC IQ الذكي، تحركات أسرع بالكرة وأهمية كروية للتكتيك والأدوار الفردية.',
      en: 'Gameplay built on advanced FC IQ, faster ball control, and significant emphasis on individual player roles.',
      es: 'Jugabilidad basada en FC IQ avanzado, control de balón más rápido y gran énfasis en los roles de los jugadores.',
      fr: 'Gameplay basé sur la technologie FC IQ, contrôle de balle accéléré et importance accrue des rôles de joueurs.'
    }
  },
  { 
    id: 'ea-fc-25', 
    name: 'EA SPORTS FC 25', 
    category: 'FIFA/EA FC', 
    year: 2025, 
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', 
    iconText: 'FC25',
    gameplayDescription: {
      ar: 'تركيز على الدفاع المنظم بأسلوب خططي جديد وميتا الجري السريع عبر الأطراف.',
      en: 'Focus on organized defense with a new tactical approach and wings overload sprint meta.',
      es: 'Enfoque en defensa organizada con un nuevo enfoque táctico y meta de sprint por las bandas.',
      fr: 'Priorité à la défense structurée et méta de débordements rapides sur les ailes.'
    }
  },
  { 
    id: 'ea-fc-24', 
    name: 'EA SPORTS FC 24', 
    category: 'FIFA/EA FC', 
    year: 2024, 
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', 
    iconText: 'FC24',
    gameplayDescription: {
      ar: 'جيم بلاي سريع، لعب مهاري مكثف، وتأثير قوي لتمريرات اللمسة الواحدة الحاسم.',
      en: 'Very fast-paced gameplay, skill moves heavy, and massive effect of precise one-touch passing.',
      es: 'Jugabilidad muy rápida, uso constante de filigranas y gran efectividad de pases al primer toque.',
      fr: 'Rythme rapide, gestes techniques indispensables et impact décisif des passes en une touche.'
    }
  },
  { 
    id: 'fifa-23', 
    name: 'FIFA 23', 
    category: 'FIFA/EA FC', 
    year: 2023, 
    badgeColor: 'bg-teal-500/15 text-teal-400 border-teal-500/30', 
    iconText: 'F23',
    gameplayDescription: {
      ar: 'قوة بدنية واضحة، تفوق المهاجمين الطوال (مؤشر Lengthy) مع التسديدات الخارقة من خارج الـ Box.',
      en: 'Strong physical traits, Lengthy running meta dominance, and powerful power-shots from distance.',
      es: 'Atributos físicos determinantes, predominio del meta Lengthy y potentes tiros directos.',
      fr: 'Dualités physiques marquées, domination de la course Lengthy et tirs puissants de loin.'
    }
  },
  { 
    id: 'fifa-22', 
    name: 'FIFA 22', 
    category: 'FIFA/EA FC', 
    year: 2022, 
    badgeColor: 'bg-teal-500/15 text-teal-400 border-teal-500/30', 
    iconText: 'F22',
    gameplayDescription: {
      ar: 'سرعة ردة فاعلية حراس المرمى مع تفوق اللعب من العمق بالتمرير القصير السريع.',
      en: 'Super goalkeeper reflexes with meta preference for tiki-taka short passes down the middle.',
      es: 'Reflejos de porteros mejorados, con preferencia por pases cortos en zona central.',
      fr: 'Réflexes de gardiens sensationnels, propension aux passes rapides dans l\'axe.'
    }
  },
  { 
    id: 'fifa-21', 
    name: 'FIFA 21', 
    category: 'FIFA/EA FC', 
    year: 2021, 
    badgeColor: 'bg-teal-500/15 text-teal-400 border-teal-500/30', 
    iconText: 'F21',
    gameplayDescription: {
      ar: 'اعتماد كلي على مهارات المراوغة الفردية وسرعة انطلاقات لاعبي الأجنحة الهجومية.',
      en: 'Highly dependent on dribbling skills and pure speed burst on vertical wing attacks.',
      es: 'Gran dependencia de regates individuales y aceleración brutal en las bandas.',
      fr: 'Accent sur les dribbles agiles et les sprints dévastateurs des ailiers.'
    }
  },
  { 
    id: 'fifa-20', 
    name: 'FIFA 20', 
    category: 'FIFA/EA FC', 
    year: 2020, 
    badgeColor: 'bg-teal-500/15 text-teal-400 border-teal-500/30', 
    iconText: 'F20',
    gameplayDescription: {
      ar: 'صعوبة في الدفاع اليدوي وميتا التمرير البيني السريع الساقط خلف قلبي الدفاع.',
      en: 'Manual defending is extremely challenging with a meta of lobbed through balls.',
      es: 'Defensa manual muy exigente y meta de pases elevados a la espalda de la zaga.',
      fr: 'Défense manuelle pointue et passes lobées en profondeur très efficaces.'
    }
  },
  { 
    id: 'fifa-19', 
    name: 'FIFA 19', 
    category: 'FIFA/EA FC', 
    year: 2019, 
    badgeColor: 'bg-teal-500/15 text-teal-400 border-teal-500/30', 
    iconText: 'F19',
    gameplayDescription: {
      ar: 'ميتا التسديد بلمسة واحدة (Timed Finishing) والضربات المقصية والرأسية الموجهة بدقة.',
      en: 'Unstoppable Timed Finishing outside the box and overpowered bicycle kicks/headers.',
      es: 'Finalización exacta implacable desde fuera del área y chilenas/cabezazos demoledores.',
      fr: 'Tirs synchronisés destructeurs de loin et bicyclettes/têtes imparables.'
    }
  },

  // eFootball is a live-service game after 2022, so the app exposes one modern entry instead of confusing yearly duplicates.
  {
    id: 'efootball-modern',
    name: 'eFootball Current / Modern',
    category: 'PES/eFootball',
    year: 2026,
    badgeColor: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    iconText: 'eF',
    gameplayDescription: {
      ar: 'eFootball الحديثة لعبة Live Service مستمرة؛ DNA الحقيقي مبني على Team Playstyle، المدرب، التعليمات الفردية، وتحديث الميتا الحالي بدل سنة منفصلة.',
      en: 'Modern eFootball is a live-service game; its real DNA depends on Team Playstyle, manager fit, individual instructions and current meta updates rather than separate yearly editions.',
      es: 'eFootball moderno es un servicio vivo; su ADN depende del estilo de equipo, mánager, instrucciones individuales y meta actual.',
      fr: 'eFootball moderne est un live service ; son ADN dépend du style d’équipe, du manager, des consignes individuelles et de la méta actuelle.'
    }
  },
  { 
    id: 'pes-2021', 
    name: 'PES 2021', 
    category: 'PES/eFootball', 
    year: 2021, 
    badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30', 
    iconText: 'PES21',
    gameplayDescription: {
      ar: 'أفضل توازن تكتيكي على الإطلاق، تحركات واقعية وتأثير قوي لقوة روح الفريق والمدرب.',
      en: 'The most balanced PES gameplay ever, smooth transitions, and high impact of Team Spirit.',
      es: 'La jugabilidad de PES más nivelada, transiciones impecables y enorme peso del Espíritu de Equipo.',
      fr: 'Le gameplay PES le plus équilibré à ce jour, transitions excellentes et impact fort de l\'esprit d\'équipe.'
    }
  },
  { 
    id: 'pes-2020', 
    name: 'PES 2020', 
    category: 'PES/eFootball', 
    year: 2020, 
    badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30', 
    iconText: 'PES20',
    gameplayDescription: {
      ar: 'تفوق واضح للـ Finesse Dribble الجديد وتأخر طفيف بحركة استجابة المدافعين عند الضغط.',
      en: 'Overpowered Finesse Dribbling with slight delay in defensive switching.',
      es: 'Regates sutiles dominantes y ligero retardo al cambiar de defensor al presionar.',
      fr: 'Dribbles en finesse ravageurs et commutations défensives parfois décalées.'
    }
  },
  { 
    id: 'pes-2019', 
    name: 'PES 2019', 
    category: 'PES/eFootball', 
    year: 2019, 
    badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30', 
    iconText: 'PES19',
    gameplayDescription: {
      ar: 'فيزيائية كرات مذهلة وأهمية كبرى لتحديد زوايا التمرير المباشر والمتقاطع بصورة دقيقة.',
      en: 'Spectacular ball physics and enormous importance of direct angled short passes.',
      es: 'Física de balón espectacular y alta importancia de pases rasos angulados.',
      fr: 'Physique de balle remarquable et importance capitale des ouvertures courtes et latérales.'
    }
  },
];

export const OPPONENT_STYLES = [
  { value: 'ضغط عالي', label: 'ضغط عالي (High Press)' },
  { value: 'سرعة من الأطراف', label: 'سرعة وهجوم من الأطراف (Wings Overload)' },
  { value: 'استحواذ', label: 'استحواذ وتمرير قصير (Tiki-Taka / Possession)' },
  { value: 'دفاع متأخر', label: 'دفاع متراجع ومرتدات (Drop Back / Counters)' },
  { value: 'عرضيات', label: 'عرضيات مكثفة (Cross Spammer)' },
  { value: 'لعب من العمق', label: 'تغلغل ولعب من العمق (Through the Middle)' },
  { value: 'كرات طويلة', label: 'كرات طويلة عشوائية (Long Ball Spammer)' },
  { value: 'مهارات وفرديات', label: 'فرديات ومهارات (Skiller / Dribble heavy)' },
];

export const MY_STYLES = [
  { value: 'متوازن', label: 'متوازن (Balanced)' },
  { value: 'هجومي', label: 'هجومي ضاغط (Attacking)' },
  { value: 'دفاعي', label: 'دفاعي صلب (Defensive)' },
  { value: 'استحواذ', label: 'استحواذ وبناء منظم (Possession / Tiki-Taka)' },
  { value: 'مرتدات', label: 'مرتدات سريعة (Fast Break / Counters)' },
  { value: 'ضغط عالي', label: 'ضغط عالي وعكسي (Gegenpress / High Press)' },
];

export const MATCH_STATES = [
  { value: 'بداية الماتش', label: 'بداية الماتش (0 - 0)' },
  { value: 'متعادل', label: 'النتيجة تعادل والخصم يستحوذ' },
  { value: 'أنا كسبان', label: 'أنا متقدم وأريد حماية النتيجة' },
  { value: 'أنا خسران', label: 'أنا متأخر بالنتيجة وأحتاج للتعادل' },
  { value: 'آخر 10 دقائق', label: 'آخر 10 دقائق (خيار الطوارئ الهجومي أو الدفاعي)' },
];
