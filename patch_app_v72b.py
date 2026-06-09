from pathlib import Path
p=Path('/mnt/data/v72work/src/App.tsx')
s=p.read_text()
# add states once
if 'showOpponentOnBoard' not in s:
    s=s.replace("const [showAttackDetails, setShowAttackDetails] = useState(false);", "const [showAttackDetails, setShowAttackDetails] = useState(false);\n  const [showOpponentOnBoard, setShowOpponentOnBoard] = useState(true);")
# reset extra states
if 'setShowOpponentOnBoard(true);' not in s:
    s=s.replace("setSearchGameQuery('');\n  };", "setSearchGameQuery('');\n    setShowInstructionDetails(false);\n    setShowAdvancedPlan(false);\n    setShowOpponentOnBoard(true);\n  };")
# replace getDirectGamePlan
marker="  const getDirectGamePlan = (gameId: string | undefined, styleRaw: string, formation: string, oppFormation: string) => {"
if marker in s and 'const chooseCounterPlan' not in s:
    start=s.index(marker)
    end=s.index("\n\n  const actionPlanDirectInstructions", start)
    new_func=r'''  const chooseCounterPlan = (gameId: string | undefined, oppFormationRaw: string, opponentStyleRaw: string, matchStateRaw = '') => {
    const opp = (oppFormationRaw || '').replace(/\s+/g, '');
    const context = `${opponentStyleRaw || ''} ${matchStateRaw || ''}`.toLowerCase();
    let formation = '4-2-3-1';
    if (/4-2-3-1|4231/.test(opp)) formation = /wide|أطراف|عرضيات/.test(context) ? '4-4-2' : '4-3-2-1';
    else if (/4-3-3|433|4-2-1-3|4213/.test(opp)) formation = /possession|استحواذ/.test(context) ? '4-2-3-1' : '4-4-2';
    else if (/4-4-2|442/.test(opp)) formation = '4-2-3-1';
    else if (/3-5-2|352|3-4-3|343/.test(opp)) formation = '4-2-1-3';
    else if (/5-3-2|532|5-4-1|541/.test(opp)) formation = '3-2-4-1';
    else if (/دفاع متأخر|low block|park/.test(context)) formation = '3-2-4-1';
    const style = /possession|استحواذ/.test(context) ? 'Counter Attack' : /wide|أطراف|عرضيات/.test(context) ? 'Out Wide' : /long ball|كرات طويلة|lbc/.test(context) ? 'Possession Game' : 'Quick Counter';
    return { formation, style };
  };

  const getDirectGamePlan = (gameId: string | undefined, styleRaw: string, formation: string, oppFormation: string) => {
    const id = gameId || '';
    const styleText = `${styleRaw || ''}`.toLowerCase();
    const opponentText = `${formData.opponentStyle || ''}`.toLowerCase();
    const isPossession = /possession|استحواذ/.test(styleText);
    const isWide = /wide|out wide|أطراف|عرض/.test(styleText) || /عرضيات|wide|wing/.test(opponentText);
    const isLongBall = /long ball|كرات طويلة|lbc/.test(styleText);
    const againstHighPress = /ضغط عالي|high press|press/.test(opponentText);
    const againstLowBlock = /دفاع متأخر|low block|park/.test(opponentText);
    const support = againstHighPress ? '4' : isPossession ? '3' : isLongBall ? '7' : '5';
    const line = /سرعة|fast|pace|counter/.test(opponentText) ? '4' : againstLowBlock ? '6' : '5';
    const compact = isWide ? '7' : '8';
    const attackArea = isWide ? uiText('الأطراف','Wide','Bandas','Ailes') : uiText('العمق','Centre','Centro','Centre');
    const build = isLongBall ? uiText('تمرير طويل','Long Pass','Pase largo','Passe longue') : uiText('تمرير قصير','Short Pass','Pase corto','Passe courte');
    const attackingStyle = isPossession ? uiText('استحواذ','Possession','Posesión','Possession') : uiText('هجوم مرتد','Counter Attack','Contraataque','Contre-attaque');
    const pesAttack: Array<[string,string]> = [['Attacking Style', attackingStyle], ['Build Up', build], ['Attacking Area', attackArea], ['Positioning', isPossession ? uiText('ثابت','Maintain Formation','Mantener formación','Garder la formation') : uiText('مرن','Flexible','Flexible','Flexible')], ['Support Range', support]];
    const pesDefence: Array<[string,string]> = [['Defensive Style', line === '4' ? uiText('دفاع شامل','All-out Defence','Repliegue','Défense totale') : uiText('ضغط أمامي','Frontline Pressure','Presión alta','Pressing haut')], ['Containment Area', isWide ? uiText('الأطراف','Wide','Bandas','Ailes') : uiText('العمق','Centre','Centro','Centre')], ['Pressuring', againstHighPress ? uiText('هادئ','Conservative','Conservador','Conservateur') : uiText('هجومي','Aggressive','Agresivo','Agressif')], ['Defensive Line', line], ['Compactness', compact]];
    const pesAdvanced: Array<[string,string]> = [['Attack 1', isWide ? 'Hug the Touchline' : isPossession ? 'Tiki-Taka' : 'Counter Target'], ['Attack 2', isWide ? 'Attacking Fullbacks' : 'Anchoring'], ['Defence 1', line === '4' ? 'Deep Defensive Line' : 'Tight Marking'], ['Defence 2', isWide ? 'Wing Back' : 'Swarm the Box']];
    if (id.includes('pes')) return { attack: pesAttack, defence: pesDefence, advanced: pesAdvanced, match: [uiText(`نفّذ ${formation} فورًا، أغلق ${attackArea}، واجعل أول خروج من الضغط عبر DMF ثم CF.`, `Apply ${formation}, protect ${attackArea}, and exit pressure DMF → CF.`, `Aplica ${formation}.`, `Appliquez ${formation}.`), uiText(`لو تقدمت: Defensive Line ${Math.max(3, Number(line)-1)} وCompactness ${compact}. لو تأخرت: Support Range ${Math.min(8, Number(support)+2)}.`, `If leading: Defensive Line ${Math.max(3, Number(line)-1)} and Compactness ${compact}. If trailing: Support Range ${Math.min(8, Number(support)+2)}.`, `Si ganas, baja línea.`, `Si vous menez, baissez la ligne.`)] };
    if (id.includes('efootball')) return { attack: [['Team Playstyle', isPossession ? 'Possession Game' : isWide ? 'Out Wide' : isLongBall ? 'Long Ball Counter' : 'Quick Counter'], ['Counter Shape', formation], ['Rest Defence', uiText('2 CB + DMF ثابت','2 CB + fixed DMF','2 CB + pivote fijo','2 DC + sentinelle')]], defence: [['Defence 1','Deep Line على DMF'], ['Defence 2','Defensive على الظهير ضد أخطر جناح'], ['Press Rule', uiText('اضغط 6 ثواني فقط ثم ارجع للشكل','Press 6 seconds then recover shape','Presiona 6 segundos','Pressez 6 secondes')]], advanced: [['Attack 1','Anchoring على CF أو AMF'], ['Attack 2','Counter Target على CF فقط'], ['Marking','Man Marking على أخطر AMF/CF عند الحاجة']], match: [uiText('لا تضع Counter Target على أكثر من لاعب.', 'Use Counter Target on one player only.', 'Counter Target en un jugador.', 'Counter Target sur un joueur.'), uiText('ثبت DMF لأن فقد الكرة يفتح العمق في eFootball.', 'Keep DMF fixed because turnovers open the middle.', 'Fija el pivote.', 'Fixez la sentinelle.')] };
    return { attack: [['Build-Up Style', isPossession ? 'Short Passing' : 'Counter'], ['Chance Creation', isWide ? 'Wing Play' : 'Direct Passing'], ['Width', isWide ? '55' : '45'], ['Players In Box', againstLowBlock ? '6' : '5']], defence: [['Defensive Approach', againstHighPress ? 'Balanced' : 'High'], ['Depth','55'], ['Line Height','55'], ['Rest Defence','2 CB + CDM']], advanced: [['ST','Advanced Forward / Get In Behind'], ['CDM','Holding + Cover Center'], ['FB','One Fullback Defend / One Balanced'], ['CAM','Playmaker / Roaming only if safe']], match: [uiText('ابدأ Balanced؛ اضغط بعد الدقيقة 60 فقط لو محتاج هدف.', 'Start Balanced; press after minute 60 only if chasing.', 'Empieza Balanced.', 'Commencez équilibré.'), uiText('لا ترفع Depth فوق 60 ضد مهاجم سريع.', 'Do not raise Depth above 60 against fast striker.', 'No subas Depth sobre 60.', 'Ne montez pas Depth au-dessus de 60.')] };
  };
'''
    s=s[:start]+new_func+s[end:]
# replace instructions
marker="  const actionPlanDirectInstructions = (gameId: string | undefined, styleRaw: string) => {"
if marker in s:
    start=s.index(marker)
    end=s.index("\n\n  const getActionPlan", start)
    new_instr=r'''  const actionPlanDirectInstructions = (gameId: string | undefined, styleRaw: string) => {
    const id = gameId || '';
    if (id.includes('pes')) return [uiText('CF: Counter Target لو هتخرج بمرتدة / False 9 لو محتاج يسحب CB','CF: Counter Target for counters / False 9 to drag CB','CF: Counter Target o Falso 9','CF : Counter Target ou Faux 9'), uiText('DMF: Defensive أو Anchoring لحماية العمق','DMF: Defensive or Anchoring to protect the middle','MCD: Defensive o Anchoring','MDF : Defensive ou Anchoring'), uiText('RB/LB: Attacking Fullbacks عند الحاجة لهدف فقط','RB/LB: Attacking Fullbacks only when chasing','Laterales: atacar solo si persigues','Latéraux : attaquer si besoin'), uiText('CB/AMF: Tight Marking على أخطر صانع لعب أو مهاجم','CB/AMF: Tight Marking on the main creator/striker','Marcaje al creador','Marquage du créateur')];
    if (id.includes('efootball')) return [uiText('CF: Counter Target على لاعب واحد فقط','CF: Counter Target on one player only','CF: Counter Target en uno','CF : Counter Target sur un seul'), uiText('CF/AMF: Anchoring لو عايزه يثبت في مكانه','CF/AMF: Anchoring if you need him fixed','CF/AMF: Anchoring','CF/AMF : Anchoring'), uiText('DMF: Deep Line عند حماية التقدم أو ضد السرعة','DMF: Deep Line when protecting lead or facing pace','MCD: Deep Line','MDF : Deep Line'), uiText('FB: Defensive على الظهير المواجه لأخطر جناح','FB: Defensive on the fullback facing the dangerous winger','Lateral: Defensive','Latéral : Defensive')];
    return [uiText('ST: Advanced Forward + Attack / Get In Behind','ST: Advanced Forward + Attack / Get In Behind','DC: Advanced Forward','BU : Advanced Forward'), uiText('CDM: Holding + Defend + Cover Center','CDM: Holding + Defend + Cover Center','MCD: Holding','MDC : Holding'), uiText('RB/LB: ظهير واحد Defend والآخر Balanced','RB/LB: one Defend, one Balanced','Un lateral defiende','Un latéral défend'), uiText('CAM/CM: Playmaker أو Box-to-Box حسب الخطة','CAM/CM: Playmaker or Box-to-Box by plan','MCO/MC: Playmaker','MOC/MC : Meneur')];
  };
'''
    s=s[:start]+new_instr+s[end:]
# mode aware form
old="const modeAwareForm = generatorMode === 'build' ? { ...formData, opponentStyle: uiText('بناء خطة المستخدم الخاصة','Build user-owned tactic','Crear táctica propia','Créer sa propre tactique'), notes: `${formData.notes} | MODE: BUILD_MY_TACTIC` } : formData;"
if old in s:
    new="const autoCounter = chooseCounterPlan(selectedGame.id, formData.oppFormation, formData.opponentStyle, formData.matchState);\n      const modeAwareForm = generatorMode === 'build' ? { ...formData, opponentStyle: uiText('بناء خطة المستخدم الخاصة','Build user-owned tactic','Crear táctica propia','Créer sa propre tactique'), notes: `${formData.notes} | MODE: BUILD_MY_TACTIC` } : { ...formData, myFormation: autoCounter.formation, myStyle: autoCounter.style, notes: `${formData.notes} | AUTO_COUNTER:${formData.oppFormation}:${formData.opponentStyle}:${formData.matchState}` };"
    s=s.replace(old,new)
# board components
s=s.replace("<TacticalBoard formation={currentResult.formation} opponentFormation={formData.oppFormation} lang={lang} value={boardState} readOnly />", "<TacticalBoard formation={currentResult.formation} opponentFormation={formData.oppFormation} lang={lang} value={boardState} readOnly showOpponent={showOpponentOnBoard} compact />")
s=s.replace("<TacticalBoard formation={formData.myFormation} opponentFormation={formData.oppFormation} lang={lang} value={boardState} onChange={setBoardState} />", "<div className=\"flex items-center justify-between gap-2 rounded-2xl bg-slate-950/50 border border-white/5 p-2\"><span className=\"text-[10px] text-slate-300 font-bold\">{uiText('إظهار فريق منافس على السبورة؟','Show opponent on board?','¿Mostrar rival?','Afficher adversaire ?')}</span><button type=\"button\" onClick={() => setShowOpponentOnBoard(!showOpponentOnBoard)} className={`px-3 py-1.5 rounded-xl text-[10px] font-black ${showOpponentOnBoard ? 'bg-rose-600 text-white' : 'bg-white/5 text-slate-300'}`}>{showOpponentOnBoard ? uiText('مفعل','On','Sí','Oui') : uiText('غير مفعل','Off','No','Non')}</button></div><TacticalBoard formation={formData.myFormation} opponentFormation={formData.oppFormation} lang={lang} value={boardState} onChange={setBoardState} showOpponent={showOpponentOnBoard} compact />")
s=s.replace("<TacticalBoard formation={developmentForm.formation} opponentFormation=\"4-4-2\" lang={lang} value={developmentBoard} onChange={(board) => { setDevelopmentBoard(board); setDevelopmentResult(null); }} />", "<TacticalBoard formation={developmentForm.formation} opponentFormation=\"4-4-2\" lang={lang} value={developmentBoard} onChange={(board) => { setDevelopmentBoard(board); setDevelopmentResult(null); }} showOpponent={false} compact />")
# replace result roles + instructions with instructions + match orders
start_text='''            <div className="rounded-3xl border border-emerald-400/15 bg-emerald-950/10 p-4 space-y-3">\n              <h3 className="text-sm font-black text-emerald-200 flex items-center gap-2"><Users size={16}/>{uiText('أدوار اللاعبين المطلوبة','Player roles','Roles de jugadores','Rôles joueurs')}</h3>'''
if start_text in s:
    start=s.index(start_text)
    end=s.index('''\n\n            <div className="rounded-3xl border border-white/8 bg-white/[0.04] p-4 space-y-3">''', start)
    new_block='''            <div className="rounded-3xl border border-emerald-400/15 bg-emerald-950/10 p-4 space-y-3">\n              <h3 className="text-sm font-black text-emerald-200 flex items-center gap-2"><Users size={16}/>{uiText('تعليمات فردية جاهزة للتنفيذ','Direct individual instructions','Instrucciones individuales','Consignes individuelles')}</h3>\n              <div className="grid grid-cols-1 gap-2">\n                {actionPlan.instructions.map((instruction, index) => (\n                  <div key={index} className="rounded-2xl bg-slate-950/55 border border-white/5 px-3 py-2.5 text-xs font-bold text-slate-100">{instruction}</div>\n                ))}\n              </div>\n            </div>\n\n            <div className="rounded-3xl border border-amber-400/15 bg-amber-950/10 p-4 space-y-3">\n              <h3 className="text-sm font-black text-amber-200">{uiText('3 أوامر فورية داخل المباراة','3 immediate in-match orders','3 órdenes inmediatas','3 consignes immédiates')}</h3>\n              <div className="space-y-2">\n                {actionPlan.direct.match.slice(0,3).map((item, index) => <div key={index} className="rounded-2xl bg-slate-950/55 border border-white/5 px-3 py-2 text-[11px] font-bold text-slate-100">{index + 1}. {item}</div>)}\n              </div>\n            </div>'''
    s=s[:start]+new_block+s[end:]
# enhance board preview header
s=s.replace("<h3 className=\"text-sm font-black text-white\">{uiText('معاينة السبورة','Board preview','Vista de pizarra','Aperçu tableau')}</h3>", "<h3 className=\"text-sm font-black text-white\">{uiText('السبورة التنفيذية','Execution board','Pizarra de ejecución','Tableau d’exécution')}</h3>")
s=s.replace("<button onClick={() => setScreen('sandbox-board')} className=\"rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-black px-4 py-2\">{uiText('افتح السبورة','Open board','Abrir','Ouvrir')}</button>", "<div className=\"flex gap-2\"><button type=\"button\" onClick={() => setShowOpponentOnBoard(!showOpponentOnBoard)} className=\"rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black px-3 py-2\">{showOpponentOnBoard ? uiText('إخفاء الخصم','Hide rival','Ocultar','Masquer') : uiText('إظهار الخصم','Show rival','Mostrar','Afficher')}</button><button onClick={() => setScreen('sandbox-board')} className=\"rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-black px-4 py-2\">{uiText('تعديل السبورة','Edit board','Editar','Modifier')}</button></div>")
# counter stepper label
s=s.replace("{uiText('تكتيكك','Your Tactic','Tu táctica','Votre tactique')}", "{uiText('الخطة المضادة','Counter plan','Contra plan','Plan anti')}")
# add counter notice before formation controls
needle="""{/* Your team deployment formation */}
                <div className="space-y-1.5">"""
if needle in s:
    s=s.replace(needle, """{generatorMode === 'counter' && (() => { const c = chooseCounterPlan(selectedGame.id, formData.oppFormation, formData.opponentStyle, formData.matchState); if (formData.myFormation !== c.formation) setTimeout(() => updateGeneratorForm({ myFormation: c.formation, myStyle: c.style }, true), 0); return <div className=\"rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-[11px] text-emerald-100 font-bold\">{uiText('تم اختيار الخطة المضادة تلقائيًا حسب الخصم. لا تحتاج تختار خطتك يدويًا.','Counter plan selected automatically from opponent data. No manual tactic selection needed.','Plan elegido automáticamente.','Plan choisi automatiquement.')}</div>; })()}
                {/* Your team deployment formation */}
                <div className="space-y-1.5">""")
p.write_text(s)
