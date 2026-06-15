export type GameTacticPreset = {
  settings: Array<[string, string]>;
  roles: Array<[string, string]>;
  instructions: string[];
  note: string;
};

const presets: Record<string, GameTacticPreset> = {
  'pes-2019': {
    settings: [
      ['Attacking Style', 'Counter Attack أو Possession حسب قوة التمرير والانتقال'],
      ['Build Up', 'Short Pass للبناء الأرضي / Long Pass فقط مع Target Man أو مساحة خلفية'],
      ['Attacking Area', 'Centre للهجوم من العمق / Wide عند امتلاك أجنحة أو أظهرة قوية'],
      ['Positioning', 'Maintain Formation للثبات / Flexible عند احتياج حركة وخلق مساحات'],
      ['Support Range', '3-4 تقارب لاعبين وتمرير قصير / 5-6 متوازن / 7-10 لعب مباشر ومسافات أكبر'],
      ['Defensive Style', 'Frontline Pressure للضغط العالي / All-out Defence للبلوك المتوسط أو المنخفض'],
      ['Containment Area', 'Centre لغلق العمق / Wide لغلق الأطراف والعرضيات'],
      ['Pressuring', 'Conservative لضبط الشكل / Aggressive للضغط والمطاردة'],
      ['Defensive Line', '4-6 آمن؛ ارفعه فقط مع مدافعين سريعين وضغط منظم'],
      ['Compactness', '7-9 لغلق العمق وتقارب الخطوط / 4-6 لو تحتاج تغطية عرضية أكبر'],
      ['Advanced Attack', 'اختر من تعليمات PES الهجومية مثل Tiki-Taka / False No.9 / Attacking Fullbacks / Wing Rotation / Hug the Touchline / Centring Targets / False Fullbacks / Defensive Fullbacks / Anchoring حسب الخطة'],
      ['Advanced Defence', 'اختر من تعليمات PES الدفاعية مثل Deep Defensive Line / Gegenpress / Swarm the Box / Counter Target / Tight Marking / Wing Back حسب الخطر']
    ],
    roles: [
      ['CF', 'Goal Poacher للمساحة أو Target Man لو Build Up طويل'],
      ['SS/AMF', 'Hole Player للهجوم بين الخطوط أو Creative Playmaker للتمرير'],
      ['DMF', 'Anchor Man ثابت؛ Destroyer فقط مع CMF يغطي'],
      ['CMF', 'Box-to-Box + Orchestrator لتوازن PES 2019'],
      ['FB', 'واحد Offensive Full-back والآخر Defensive/Balanced'],
      ['CB', 'Build Up + Destroyer؛ لا تسحب الاثنين للضغط']
    ],
    instructions: [
      'PES 2019 يسمح بتعليمات متقدمة هجومية ودفاعية داخل Game Plan؛ استخدم حتى 2 هجوم و2 دفاع بدون تضارب.',
      'Visible Fatigue يجعل Gegenpress خطرًا لو شغال طول المباراة؛ استخدمه كمفتاح مؤقت.',
      'لو الخصم يلعب كرات خلف الدفاع: Deep Defensive Line + Compactness عالي.',
      'لو تحتاج هدف: Attacking Fullbacks + Support Range أوسع، مع DMF ثابت خلف الكرة.'
    ],
    note: 'PES 2019 DNA = أرقام تكتيكية واضحة + Advanced Instructions + إدارة لياقة. الدقة هنا أهم من أسماء خطط عامة.'
  },
  'pes-2020': {
    settings: [
      ['Attacking Style', 'Possession للفرق الفنية / Counter Attack ضد ضغط الخصم'],
      ['Build Up', 'Short Pass كافتراضي؛ لا تبالغ في Long Pass بدون مهاجم محطة'],
      ['Attacking Area', 'Centre مع AMF / Wide لو عندك أظهرة وأجنحة'],
      ['Positioning', 'Maintain Formation للحفاظ على المسافات'],
      ['Support Range', '4-6 للسيطرة؛ 6-7 لو الخصم يغلق العمق'],
      ['Defensive Style', 'All-out Defence أو Frontline Pressure حسب سرعة خطك'],
      ['Containment Area', 'Centre ضد الاختراق / Wide ضد Cross Spammer'],
      ['Pressuring', 'Conservative بداية المباراة، Aggressive عند التأخر فقط'],
      ['Defensive Line', '4-6 آمن بسبب حساسية السحب الدفاعي'],
      ['Compactness', '7-8 لحماية منطقة DMF'],
      ['Advanced Attack', 'False Fullbacks أو Wing Rotation حسب التشكيل'],
      ['Advanced Defence', 'Deep Defensive Line ضد الكرات البينية']
    ],
    roles: [['CF','Goal Poacher أو Fox in the Box'],['AMF','Creative Playmaker'],['DMF','Anchor Man'],['CMF','Orchestrator'],['FB','Defensive Full-back ضد جناح سريع'],['CB','Build Up']],
    instructions: ['PES 2020 يعاقب المراوغة في الثلث الدفاعي؛ استخدم Finesse Dribble في الثلث الأخير فقط.', 'لا ترفع الظهيرين معًا بدون DMF ثابت.', 'اضبط Support Range حسب ضغط الخصم بدل نسخ رقم واحد.'],
    note: 'PES 2020 DNA = تحكم أكثر وصبر في البناء، مع أهمية تمركز DMF والتوازن الدفاعي.'
  },
  'pes-2021': {
    settings: [
      ['Attacking Style', 'Counter Attack للانتقال السريع / Possession للفرق ذات Team Spirit عالي'],
      ['Build Up', 'Short Pass غالبًا أفضل من التمرير الطويل العشوائي'],
      ['Attacking Area', 'Centre مع 4-3-1-2 / Wide مع 4-3-3'],
      ['Positioning', 'Maintain Formation كافتراضي، Flexible للاعبين أصحاب حركة ممتازة'],
      ['Support Range', '4-7 حسب مهارة التمرير والمساحات'],
      ['Defensive Style', 'Frontline Pressure لو Team Spirit جيد / All-out Defence للخصوم الأسرع'],
      ['Containment Area', 'Centre لحماية العمق، Wide ضد أجنحة قوية'],
      ['Pressuring', 'Conservative ضد المهاريين، Aggressive فقط مع بلوك متماسك'],
      ['Defensive Line', '5-7 لو دفاعك سريع، 4-5 ضد كرات خلفية'],
      ['Compactness', '7-9 أساس PES 2021 ضد العمق'],
      ['Advanced Attack', 'Tiki-Taka / False 9 / Attacking Fullbacks حسب الهدف'],
      ['Advanced Defence', 'Counter Target لمهاجم مهم أو Deep Defensive Line لحماية التقدم']
    ],
    roles: [['CF','Goal Poacher'],['SS/AMF','Hole Player'],['DMF','Anchor Man'],['CMF','Orchestrator + Box-to-Box'],['FB','واحد يتقدم وواحد يحمي'],['CB','Build Up + Destroyer']],
    instructions: ['Team Spirit والمدرب مهمان؛ لا تنسخ خطة لا تناسب مديرك.', 'ثبت محورًا دفاعيًا قبل رفع الظهيرين.', 'استخدم Counter Target على مهاجم واحد فقط لتوفير اللياقة والهجمة الأولى.'],
    note: 'PES 2021 DNA = توازن + Team Spirit + Advanced Instructions، وليس مجرد Formation.'
  },
  'efootball-modern': {
    settings: [
      ['Game Identity', 'eFootball Current / Modern كلعبة واحدة محدثة باستمرار'],
      ['Team Playstyle', 'Possession Game / Quick Counter / Long Ball Counter / Out Wide / Long Ball'],
      ['Manager Fit', 'اختيار المدرب يكون حسب توافقه مع Team Playstyle الحالي'],
      ['Platform Context', 'Mobile = تمرير آمن وقرارات أسرع / Console-PC = تحكم يدوي ومساحات أوسع'],
      ['Rest Defence', '2 CB + DMF أو 2 CB + ظهير دفاعي ثابت عند الهجوم'],
      ['Attack Instruction 1', 'Anchoring لتثبيت CF/AMF/جناح في منطق الخطة'],
      ['Attack Instruction 2', 'Counter Target على CF/SS واحد فقط لحفظ طاقته للمرتدة'],
      ['Defence Instruction 1', 'Deep Line على DMF ضد الكرات خلف الدفاع أو لحماية التقدم'],
      ['Defence Instruction 2', 'Defensive على ظهير واحد ضد جناح سريع أو عند تقدم الطرف الآخر'],
      ['Quick Counter DNA', 'ضغط وانتقال سريع + DMF ثابت + مهاجم يهاجم المساحة'],
      ['Possession DNA', 'مثلثات تمرير + Orchestrator + ظهير واحد يتقدم فقط'],
      ['Long Ball Counter DNA', 'بلوك متماسك + CF قوي/سريع + تمرير مباشر'],
      ['Out Wide DNA', 'عرض حقيقي + جناح مباشر + تغطية الطرف العكسي']
    ],
    roles: [
      ['CF', 'Goal Poacher للـ Quick Counter / Target Man أو Deep-Lying Forward لـ LBC/Possession'],
      ['SS/AMF', 'Hole Player للهجوم على المساحة / Creative Playmaker لصناعة اللعب'],
      ['DMF', 'Anchor Man هو الاختيار الأكثر أمانًا؛ Orchestrator يحتاج تغطية'],
      ['CMF', 'Box-to-Box للضغط والتحول + Orchestrator للبناء'],
      ['Wide', 'Prolific Winger للعرض / Roaming Flank للدخول للعمق'],
      ['FB', 'ظهير Offensive واحد فقط غالبًا، والآخر Defensive أمام أجنحة سريعة'],
      ['CB', 'Build Up للخروج بالكرة + Destroyer لمواجهة CF محطة']
    ],
    instructions: [
      'لا تستخدم Anchoring + Counter Target على نفس اللاعب إلا لو عايزه يظل ثابتًا ومنعزلًا للأمام.',
      'Quick Counter يحتاج DMF ثابت لأن فقد الكرة يفتح العمق بسرعة.',
      'Possession بدون مثلثات ودعم قريب يتحول إلى تمرير سلبي بلا خطورة.',
      'Out Wide يحتاج حماية الطرف العكسي عند فقد الكرة.',
      'Deep Line أداة ظرفية، ليست إعدادًا دائمًا لكل مباراة.'
    ],
    note: 'eFootball الحديثة Live Service؛ لذلك التطبيق يعتمد على Team Playstyle + Manager Fit + Individual Instructions + Platform بدل إصدارات سنوية وهمية.'
  },
  'ea-fc-26': {
    settings: [['Tactical System','FC IQ / Smart Tactics'],['Build-Up Style','Short Passing أو Counter حسب أدوارك'],['Defensive Approach','Balanced كافتراضي، Aggressive عند الضغط المنظم'],['Line Height','55 كبداية آمنة ثم عدّل حسب سرعة CB'],['Role Logic','لاعب الدور المناسب أهم من اسم المركز'],['Match State','استخدم Smart Tactics عند التقدم أو التأخر']],
    roles: [['ST','Advanced Forward / False 9 حسب الخطة'],['CAM','Playmaker أو Shadow Striker'],['CDM','Holding'],['CM','Box-to-Box'],['CB','Defender + Ball-Playing Defender'],['FB','Fullback/Wingback حسب التغطية']],
    instructions: ['تعامل مع FC 26 كـ Role-first system.', 'لا تضع كل خط الوسط Attack Focus.', 'حافظ على Rest Defence 2+1 عند أي خطة هجومية.'],
    note: 'EA FC 26 امتداد لمنطق FC IQ: الأدوار وSmart Tactics أهم من سلايدر ثابت.'
  },
  'ea-fc-25': {
    settings: [['Tactical System','FC IQ: Player Roles + Team Tactics + Smart Tactics'],['Build-Up Style','Balanced / Short Passing / Counter'],['Defensive Approach','Balanced أو High حسب السرعة والتغطية'],['Line Height','50-60 آمن؛ أعلى من ذلك يحتاج CB سريع'],['Chance Creation','Direct عند المرتدات / Balanced للاستحواذ'],['Role Familiarity','لا تختار Role غير مناسب للاعب حتى لو الخطة جميلة']],
    roles: [['ST','Advanced Forward'],['CAM','Playmaker / Shadow Striker'],['CDM','Holding'],['CM','Box-to-Box'],['CB','Defender / Ball-Playing Defender'],['FB','Fullback أو Wingback بتركيز واضح']],
    instructions: ['FC 25 لا يُدار بمنطق FIFA القديم فقط؛ FC IQ يجعل الدور والسلوك بدون كرة هما الأساس.', 'وزّع Focus: دفاع، توازن، هجوم. لا تجعل الجميع يهاجم.', 'استخدم Smart Tactics بدل تبديل خطة كامل عشوائيًا.'],
    note: 'FC 25 DNA = FC IQ. الدقة هنا تعني توصية أدوار وفوكس، مش مجرد Width/Depth.'
  },
  'ea-fc-24': {
    settings: [['Defensive Style','Balanced'],['Width','45-50'],['Depth','50-60'],['Build Up','Balanced'],['Chance Creation','Direct Passing'],['Players In Box','5-6'],['Corners / Free Kicks','2 / 2']],
    roles: [['ST','Stay Central + Get In Behind'],['CAM','Stay Forward أو Free Roam حسب اللاعب'],['CDM','Stay Back + Cover Center'],['FB','واحد Stay Back والآخر Balanced عند الحاجة'],['Winger','Cut Inside أو Come Back حسب الخطة']],
    instructions: ['FC 24 يعتمد على PlayStyles وControlled Sprint؛ لا تخطط بدون معرفة نقاط قوة لاعبيك.', 'لا ترفع Depth أمام مهاجمين سريعين.', 'CDM يغطي المركز دائمًا في الخطط الهجومية.'],
    note: 'FC 24 DNA = PlayStyles + سرعة + تمرير مباشر، قبل FC IQ الكامل.'
  },
  'fifa-23': {
    settings: [['Defensive Style','Balanced'],['Width','42-48'],['Depth','50-58'],['Build Up','Balanced'],['Chance Creation','Direct Passing'],['Players In Box','5-6']],
    roles: [['ST','Lengthy/Advanced forward'],['CF','Get In Behind'],['CM/CDM','Cover Center'],['FB','واحد Stay Back'],['CB','Fast recovery defender']],
    instructions: ['راعي AcceleRATE؛ المدافع البطيء لا يناسب خط دفاع عالٍ.', 'اصنع مساحة للـ Power Shot بدل التسديد من زوايا ميتة.', 'لا تهاجم بالظهيرين معًا.'],
    note: 'FIFA 23 DNA = HyperMotion2 + AcceleRATE + Power Shots.'
  },
  'fifa-22': {
    settings: [['Defensive Style','Balanced'],['Width','45'],['Depth','48-55'],['Build Up','Balanced'],['Chance Creation','Direct Passing'],['Players In Box','5']],
    roles: [['ST','Stay Central'],['CAM','Get Into Box'],['CDM','Stay Back + Cover Center'],['FB','Stay Back'],['CM','Balanced']],
    instructions: ['استخدم Second Man Press بحذر.', 'اجعل البناء قصيرًا وآمنًا.', 'لا تفتح ثنائي الارتكاز في التحول.'],
    note: 'FIFA 22 DNA = تنظيم أفضل وHyperMotion على الجيل الجديد.'
  },
  'fifa-21': {
    settings: [['Defensive Style','Balanced'],['Width','45'],['Depth','48-55'],['Build Up','Long Ball / Balanced'],['Chance Creation','Forward Runs'],['Players In Box','6']],
    roles: [['ST','Get In Behind'],['CAM','Stay Forward'],['CDM','Cover Center'],['Winger','Get In Behind / Come Back حسب الحاجة'],['FB','Stay Back']],
    instructions: ['Creative Runs مهم جدًا.', 'احم الأطراف من 1v1.', 'لا ترفع العمق بدون مدافعين سريعين.'],
    note: 'FIFA 21 DNA = Agile Dribbling + Creative Runs + سرعة الأطراف.'
  },
  'fifa-20': {
    settings: [['Defensive Style','Balanced'],['Width','42-48'],['Depth','42-50'],['Build Up','Balanced'],['Chance Creation','Possession'],['Players In Box','5']],
    roles: [['ST','Stay Central'],['CAM','Free Roam'],['CDM','Stay Back + Cover Center'],['FB','Stay Back'],['CB','لا تسحبه خارج الخط']],
    instructions: ['دافع بالـ jockey أولًا.', 'لا تسحب قلب الدفاع للضغط اليدوي.', 'مرر في العمق بتوقيت ولا تندفع.'],
    note: 'FIFA 20 DNA = Manual Defending + Strafe Dribbling + 1v1 discipline.'
  },
  'fifa-19': {
    settings: [['Defensive Style','Balanced'],['Width','45'],['Depth','45-50'],['Build Up','Fast Build Up / Balanced'],['Chance Creation','Direct Passing'],['Dynamic Tactics','جهّز Defensive/Balanced/Attacking مسبقًا']],
    roles: [['ST','Stay Central + Get In Behind'],['CAM','Stay Forward'],['CDM','Stay Back + Cover Center'],['FB','Stay Back'],['Winger','Cut Inside']],
    instructions: ['جهّز Dynamic Tactics متعددة.', 'لا تعتمد على Timed Finishing من زوايا سيئة.', 'حافظ على CDM أمام الدفاع.'],
    note: 'FIFA 19 DNA = Dynamic Tactics + Timed Finishing + Active Touch.'
  }
};

const fallback: GameTacticPreset = {
  settings: [['Style','Balanced'],['Defensive Line','Medium'],['Compactness','High'],['Attack Zone','Middle and half-spaces']],
  roles: [['ST','Advanced Forward'],['CAM','Playmaker'],['DMF/CDM','Holding Midfielder'],['CB','Ball Playing Defender'],['FB','Balanced Fullback']],
  instructions: ['ثبت محورًا دفاعيًا واحدًا.', 'لا ترفع الظهيرين معًا.', 'استخدم التمرير الآمن عند فقد السيطرة.'],
  note: 'إعداد عام آمن حسب DNA اللعبة المختارة.'
};

export function getGameTacticPreset(gameId?: string): GameTacticPreset {
  if (!gameId) return fallback;
  return presets[gameId] || fallback;
}
