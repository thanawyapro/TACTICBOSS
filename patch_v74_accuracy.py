from pathlib import Path
p=Path('/mnt/data/work_v73/src/App.tsx')
s=p.read_text()
# add translations after Counter Target replacement
old="""      'Counter Target': uiText('هدف للمرتدات','Counter Target','Objetivo de contra','Cible de contre'),\n      'Defensive on': uiText('تعليمات دفاعية على','Defensive on','Defensivo en','Défensif sur')"""
new="""      'Counter Target': uiText('هدف للمرتدات','Counter Target','Objetivo de contra','Cible de contre'),
      'False 9': uiText('مهاجم وهمي','False 9','Falso 9','Faux 9'),
      'Tiki-Taka': uiText('تيكي تاكا','Tiki-Taka','Tiki-Taka','Tiki-Taka'),
      'Hug the Touchline': uiText('الالتزام بالخط','Hug the Touchline','Pegarse a la banda','Coller à la ligne'),
      'Wing Rotation': uiText('دوران الأجنحة','Wing Rotation','Rotación de bandas','Rotation des ailes'),
      'Attacking Fullbacks': uiText('ظهيران مهاجمان','Attacking Fullbacks','Laterales ofensivos','Latéraux offensifs'),
      'False Fullbacks': uiText('ظهيران وهميان','False Fullbacks','Laterales falsos','Faux latéraux'),
      'Defensive': uiText('دفاعي','Defensive','Defensivo','Défensif'),
      'Deep Defensive Line': uiText('خط دفاع متأخر','Deep Defensive Line','Línea defensiva baja','Ligne défensive basse'),
      'Gegenpress': uiText('ضغط عكسي','Gegenpress','Gegenpress','Gegenpress'),
      'Swarm the Box': uiText('التكدس داخل المنطقة','Swarm the Box','Poblar el área','Surnombre dans la surface'),
      'Tight Marking': uiText('مراقبة لصيقة','Tight Marking','Marcaje estrecho','Marquage serré'),
      'Man Marking': uiText('مراقبة رجل لرجل','Man Marking','Marcaje al hombre','Marquage individuel'),
      'Attack 1': uiText('تعليمة هجومية 1','Attack instruction 1','Instrucción ataque 1','Consigne attaque 1'),
      'Attack 2': uiText('تعليمة هجومية 2','Attack instruction 2','Instrucción ataque 2','Consigne attaque 2'),
      'Defence 1': uiText('تعليمة دفاعية 1','Defence instruction 1','Instrucción defensa 1','Consigne défense 1'),
      'Defence 2': uiText('تعليمة دفاعية 2','Defence instruction 2','Instrucción defensa 2','Consigne défense 2'),
      'Player Style': uiText('نوع اللاعب','Player Style','Estilo jugador','Style joueur'),
      'Defensive on': uiText('تعليمات دفاعية على','Defensive on','Defensivo en','Défensif sur')"""
if old not in s:
    print('translation anchor not found')
else:
    s=s.replace(old,new)
start=s.index('  const getDirectGamePlan = ')
end=s.index('\n\n\n  const actionPlanDirectInstructions', start)
new_func=r'''  const getDirectGamePlan = (gameId: string | undefined, styleRaw: string, formation: string, oppFormation: string) => {
    const id = gameId || '';
    const styleText = `${styleRaw || ''}`.toLowerCase();
    const opponentText = `${formData.opponentStyle || ''} ${formData.oppFormation || oppFormation || ''}`.toLowerCase();
    const isPossession = /possession|استحواذ|تيكي|tiki/.test(styleText);
    const isWide = /wide|out wide|أطراف|عرض|wing/.test(styleText) || /عرضيات|wide|wing|أطراف/.test(opponentText);
    const isLongBall = /long ball|كرات طويلة|lbc/.test(styleText);
    const isPress = /press|ضغط|gegen/.test(styleText) || /ضغط عالي|high press|press/.test(opponentText);
    const againstFastCounter = /سرعة|fast|pace|counter|مرتدات|quick/.test(opponentText);
    const againstLowBlock = /دفاع متأخر|low block|park|خمسة/.test(opponentText);
    const matchState = `${formData.matchSituation || ''}`.toLowerCase();
    const chasing = /متأخر|خسر|trailing|need goal|هدف/.test(matchState);

    // PES values are single actionable numbers, not ranges. They vary by context.
    const support = isPossession ? (isWide ? '5' : '3') : isLongBall ? '7' : againstLowBlock ? '6' : againstFastCounter ? '4' : '5';
    const line = againstFastCounter ? '4' : chasing ? '7' : isPress ? '6' : againstLowBlock ? '5' : '5';
    const compact = isWide ? '7' : againstLowBlock ? '6' : againstFastCounter ? '9' : '8';
    const attackArea = isWide ? uiText('الأطراف','Wide','Bandas','Ailes') : uiText('العمق','Centre','Centro','Centre');
    const build = isLongBall ? uiText('تمرير طويل','Long Pass','Pase largo','Passe longue') : uiText('تمرير قصير','Short Pass','Pase corto','Passe courte');
    const attackingStyle = isPossession ? uiText('استحواذ','Possession','Posesión','Possession') : uiText('هجوم مرتد','Counter Attack','Contraataque','Contre-attaque');
    const positioning = isPossession ? uiText('الحفاظ على التشكيل','Maintain Formation','Mantener formación','Garder la formation') : uiText('مرن','Flexible','Flexible','Flexible');
    const defensiveStyle = line === '4' ? uiText('دفاع شامل','All-out Defence','Repliegue','Défense totale') : uiText('ضغط من الأمام','Frontline Pressure','Presión alta','Pressing haut');
    const pressuring = againstFastCounter ? uiText('محافظ','Conservative','Conservador','Conservateur') : uiText('عدواني','Aggressive','Agresivo','Agressif');

    const pesAttack: Array<[string,string]> = [
      ['Attacking Style', attackingStyle],
      ['Build Up', build],
      ['Attacking Area', attackArea],
      ['Positioning', positioning],
      ['Support Range', support]
    ];
    const pesDefence: Array<[string,string]> = [
      ['Defensive Style', defensiveStyle],
      ['Containment Area', isWide ? uiText('الأطراف','Wide','Bandas','Ailes') : uiText('العمق','Centre','Centro','Centre')],
      ['Pressuring', pressuring],
      ['Defensive Line', line],
      ['Compactness', compact]
    ];
    const pesAttackInstructions = isWide
      ? [['Attack 1', 'Hug the Touchline'], ['Attack 2', chasing ? 'Attacking Fullbacks' : 'Wing Rotation']]
      : isPossession
        ? [['Attack 1', 'Tiki-Taka'], ['Attack 2', 'False Fullbacks']]
        : [['Attack 1', 'Counter Target'], ['Attack 2', againstLowBlock ? 'False 9' : 'Attacking Fullbacks']];
    const pesDefenceInstructions = againstFastCounter
      ? [['Defence 1', 'Deep Defensive Line'], ['Defence 2', 'Tight Marking']]
      : isPress
        ? [['Defence 1', 'Gegenpress'], ['Defence 2', 'Man Marking']]
        : [['Defence 1', 'Swarm the Box'], ['Defence 2', 'Defensive']];
    const pesAdvanced: Array<[string,string]> = [...pesAttackInstructions, ...pesDefenceInstructions];

    if (id.includes('pes')) return {
      attack: pesAttack,
      defence: pesDefence,
      advanced: pesAdvanced,
      match: [
        uiText(`طبّق ${formation}: ${attackingStyle} + ${build} + ${attackArea}.`, `Apply ${formation}: ${attackingStyle} + ${build} + ${attackArea}.`, `Aplica ${formation}.`, `Appliquez ${formation}.`),
        uiText(`القيم المهمة: Support ${support} / Line ${line} / Compactness ${compact}.`, `Key values: Support ${support} / Line ${line} / Compactness ${compact}.`, `Valores clave.`, `Valeurs clés.`),
        uiText(`التعليمات المتقدمة: ${pesAdvanced.map(([,v]) => cleanTacticText(v)).join(' + ')}.`, `Advanced: ${pesAdvanced.map(([,v]) => v).join(' + ')}.`, `Avanzadas.`, `Avancées.`)
      ]
    };
    if (id.includes('efootball')) return {
      attack: [['Team Playstyle', isPossession ? 'Possession Game' : isWide ? 'Out Wide' : isLongBall ? 'Long Ball Counter' : 'Quick Counter'], ['Counter Shape', formation]],
      defence: [['Defence 1','Deep Line'], ['Defence 2','Defensive'], ['Marking','Man Marking']],
      advanced: [['Individual 1','Anchoring'], ['Individual 2','Counter Target'], ['Individual 3','Deep Line'], ['Individual 4','Defensive']],
      match: [uiText('استخدم تعليمة واحدة فقط للهجوم المرتد، ولا تثبت أكثر من لاعب.', 'Use only one counter instruction; do not fix too many players.', 'Una instrucción de contra.', 'Une seule consigne de contre.'), uiText('Deep Line عند حماية التقدم أو ضد مهاجم سريع.', 'Deep Line when protecting a lead or facing pace.', 'Deep Line si ganas.', 'Deep Line si vous menez.')]
    };
    return {
      attack: [['Build-Up Style', isPossession ? 'Short Passing' : 'Counter'], ['Chance Creation', isWide ? 'Wing Play' : 'Direct Passing'], ['Width', isWide ? '55' : '45'], ['Players In Box', againstLowBlock ? '6' : '5']],
      defence: [['Defensive Approach', againstFastCounter ? 'Balanced' : isPress ? 'High' : 'Balanced'], ['Depth', againstFastCounter ? '45' : isPress ? '65' : '55']],
      advanced: [['ST Role','Advanced Forward'], ['CDM Role','Holding'], ['Fullback Role','Fullback / Defend'], ['CAM Role','Playmaker']],
      match: [uiText('استخدم أدوار FC IQ فقط، ولا تخلط معها تعليمات PES.', 'Use FC IQ roles only; do not mix PES instructions.', 'Usa FC IQ.', 'Utilisez FC IQ.'), uiText('لا ترفع Depth ضد مهاجم سريع.', 'Do not raise Depth against pace.', 'No subas Depth.', 'Ne montez pas Depth.')]
    };
  };'''
s=s[:start]+new_func+s[end:]
start=s.index('  const actionPlanDirectInstructions = ')
end=s.index('\n\n\n  const getActionPlan', start)
new_inst=r'''  const actionPlanDirectInstructions = (gameId: string | undefined, styleRaw: string) => {
    const id = gameId || '';
    if (id.includes('pes')) return [
      uiText('CF: Goal Poacher / Target Man حسب نوع المهاجم المتاح','CF: Goal Poacher / Target Man depending on available striker','CF: Goal Poacher / Target Man','CF : Goal Poacher / Target Man'),
      uiText('AMF: Hole Player أو Creative Playmaker','AMF: Hole Player or Creative Playmaker','AMF: Hole Player o Creative Playmaker','MO : Hole Player ou Creative Playmaker'),
      uiText('DMF: Anchor Man أو Destroyer','DMF: Anchor Man or Destroyer','DMF: Anchor Man o Destroyer','MDF : Anchor Man ou Destroyer'),
      uiText('Fullback: Offensive Full-back / Defensive Full-back حسب الخطة','Fullback: Offensive or Defensive Full-back by plan','Lateral ofensivo/defensivo','Latéral offensif/défensif')
    ];
    if (id.includes('efootball')) return [
      uiText('CF: Goal Poacher / Fox in the Box','CF: Goal Poacher / Fox in the Box','CF: Goal Poacher','CF : Goal Poacher'),
      uiText('AMF: Hole Player / Creative Playmaker','AMF: Hole Player / Creative Playmaker','AMF: Hole Player','MO : Hole Player'),
      uiText('DMF: Anchor Man / Orchestrator','DMF: Anchor Man / Orchestrator','DMF: Anchor Man','MDF : Anchor Man'),
      uiText('CB: Build Up + Destroyer','CB: Build Up + Destroyer','CB: Build Up + Destroyer','DC : Build Up + Destroyer')
    ];
    return [
      uiText('ST: Advanced Forward أو Poacher حسب FC IQ','ST: Advanced Forward or Poacher by FC IQ','DC: Advanced Forward','BU : Advanced Forward'),
      uiText('CDM: Holding','CDM: Holding','MCD: Holding','MDC : Holding'),
      uiText('CAM: Playmaker','CAM: Playmaker','MCO: Playmaker','MOC : Meneur'),
      uiText('Fullback: Fullback / Wingback حسب الخطة','Fullback: Fullback / Wingback by plan','Lateral','Latéral')
    ];
  };'''
s=s[:start]+new_inst+s[end:]
# Remove duplicate misleading individual instructions, rename section
s=s.replace("{uiText('التعليمات المتقدمة والفردية','Advanced & individual instructions','Instrucciones avanzadas','Consignes avancées')}", "{uiText('التعليمات المتقدمة داخل اللعبة','In-game advanced instructions','Instrucciones avanzadas','Consignes avancées')}")
s=s.replace("{uiText('تعليمات فردية جاهزة للتنفيذ','Direct individual instructions','Instrucciones individuales','Consignes individuelles')}", "{uiText('نوع اللاعبين المناسب','Recommended player styles','Estilos recomendados','Styles recommandés')}")
# Delete match instructions verbose block? Keep, but not critical.
p.write_text(s)
print('patched')
