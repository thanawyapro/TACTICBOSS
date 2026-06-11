import { SupportedLang } from './lang';
import { TacticResult, TacticalBoardState } from '../types';

export const analyzeBoardShape = (board: TacticalBoardState | null, activeLang: SupportedLang): string[] => {
  if (!board?.players?.length) return [];
  const own = board.players.filter(p => !p.isOpponent);
  if (!own.length) return [];
  const messages: Record<SupportedLang, Record<string,string>> = {
    ar: {
      balanced: 'توزيع فريقك متوازن مبدئيًا ويمكن البناء عليه.',
      fullbacks: 'الظهيران متقدمان في نفس الوقت؛ اترك لاعب ارتكاز ثابتًا أو ثبّت أحدهما.',
      noAnchor: 'لا يوجد لاعب ارتكاز واضح أمام الدفاع؛ العمق معرض للمرتدات.',
      narrow: 'الفريق متقارب جدًا أفقيًا؛ وسّع لاعبًا واحدًا لفتح مسار تمرير جديد.',
      wide: 'الفريق واسع جدًا؛ قلّل المسافة بين الوسط والأطراف عند فقد الكرة.',
      highCB: 'خط الدفاع متقدم؛ تأكد من وجود مدافع سريع للتغطية خلفه.',
      crowd: 'هناك لاعبان أو أكثر في نفس المساحة تقريبًا؛ حرّك أحدهما لخلق زاوية تمرير.'
    },
    en: {
      balanced: 'Your current board shape is balanced and ready to build on.',
      fullbacks: 'Both fullbacks are advanced at the same time; keep a holding midfielder or hold one fullback.',
      noAnchor: 'There is no clear holding midfielder in front of the defense; central counters are a risk.',
      narrow: 'The team is too narrow; move one player wider to create a new passing lane.',
      wide: 'The team is very wide; reduce distances when possession is lost.',
      highCB: 'The defensive line is high; make sure a fast defender can cover behind it.',
      crowd: 'Two or more players occupy almost the same space; move one to create a passing angle.'
    },
    es: {
      balanced: 'La estructura actual está equilibrada y lista para ajustarse.',
      fullbacks: 'Los dos laterales están adelantados; mantén un mediocentro de cobertura o fija uno.',
      noAnchor: 'No hay un mediocentro defensivo claro; las contras por el centro son un riesgo.',
      narrow: 'El equipo está demasiado cerrado; abre a un jugador para crear una línea de pase.',
      wide: 'El equipo está demasiado abierto; reduce distancias al perder el balón.',
      highCB: 'La línea defensiva está alta; necesitas un defensor rápido para cubrir.',
      crowd: 'Hay jugadores ocupando casi el mismo espacio; mueve uno para crear un ángulo de pase.'
    },
    fr: {
      balanced: 'La structure actuelle est équilibrée et prête à être ajustée.',
      fullbacks: 'Les deux latéraux sont projetés; gardez une sentinelle ou bloquez un latéral.',
      noAnchor: 'Aucune sentinelle claire ne protège la défense; les contres axiaux sont dangereux.',
      narrow: 'L’équipe est trop resserrée; écartez un joueur pour créer une ligne de passe.',
      wide: 'L’équipe est très large; réduisez les distances à la perte du ballon.',
      highCB: 'La ligne défensive est haute; prévoyez un défenseur rapide en couverture.',
      crowd: 'Plusieurs joueurs occupent presque la même zone; déplacez-en un pour créer un angle.'
    }
  };
  const m = messages[activeLang];
  const insights: string[] = [];
  const fullbacks = own.filter(p => /Fullback|Wingback|LWB|RWB|LB|RB/i.test(p.role));
  if (fullbacks.filter(p => p.y < 64).length >= 2) insights.push(m.fullbacks);
  const anchors = own.filter(p => /Anchor|Holding|DMF|CDM/i.test(p.role));
  if (!anchors.length) insights.push(m.noAnchor);
  const xs = own.map(p => p.x);
  const width = Math.max(...xs) - Math.min(...xs);
  if (width < 58) insights.push(m.narrow);
  if (width > 90) insights.push(m.wide);
  const centerBacks = own.filter(p => /CB|Defender/i.test(p.role));
  if (centerBacks.length && centerBacks.filter(p => p.y < 66).length >= Math.max(1, centerBacks.length - 1)) insights.push(m.highCB);
  let crowded = false;
  for (let i=0;i<own.length;i++) for (let j=i+1;j<own.length;j++) {
    const dx=own[i].x-own[j].x, dy=own[i].y-own[j].y;
    if (Math.sqrt(dx*dx+dy*dy) < 8) crowded = true;
  }
  if (crowded) insights.push(m.crowd);
  if (!insights.length) insights.push(m.balanced);
  return insights.slice(0,4);
};

export const applyBoardIntelligence = (result: TacticResult, board: TacticalBoardState | null, activeLang: SupportedLang): TacticResult => {
  if (!board?.players?.length) return result;
  const own = board.players.filter(p => !p.isOpponent);
  const opp = board.players.filter(p => p.isOpponent);
  const next: TacticResult = {
    ...result,
    defensiveDetails: { ...result.defensiveDetails },
    attackingDetails: { ...result.attackingDetails },
    playerInstructions: [...result.playerInstructions]
  };
  const text = {
    ar: {
      oppHigh: 'السبورة تظهر خط دفاع خصم متقدم؛ استخدم جريًا خلف الدفاع وتمريرات مبكرة.',
      oppNarrow: 'الخصم متقارب في العمق؛ وسّع اللعب واضرب المساحة خلف الظهير.',
      oppWide: 'الخصم واسع؛ هاجم أنصاف المساحات وبين الظهير وقلب الدفاع.',
      oppNoAnchor: 'لا يوجد ارتكاز واضح للخصم؛ مرّر بين الخطوط وادفع صانع اللعب للأمام.',
      ownFullbacks: 'ثبّت ارتكازًا واحدًا لتغطية تقدم الظهيرين الظاهر على السبورة.'
    },
    en: {
      oppHigh: 'The board shows a high opponent line; use runs in behind and early passes.',
      oppNarrow: 'The opponent is narrow; stretch play and attack behind the fullback.',
      oppWide: 'The opponent is wide; attack the half-spaces between fullback and center-back.',
      oppNoAnchor: 'No clear opponent holding midfielder; play between the lines and advance the playmaker.',
      ownFullbacks: 'Keep one holding midfielder to cover both advanced fullbacks shown on the board.'
    },
    es: {
      oppHigh: 'La pizarra muestra una línea rival alta; ataca la espalda con pases tempranos.',
      oppNarrow: 'El rival está cerrado; abre el campo y ataca detrás del lateral.',
      oppWide: 'El rival está muy abierto; ataca los medios espacios.',
      oppNoAnchor: 'No hay pivote rival claro; juega entre líneas.',
      ownFullbacks: 'Mantén un pivote para cubrir a los dos laterales adelantados.'
    },
    fr: {
      oppHigh: 'Le tableau montre une ligne adverse haute; attaquez la profondeur tôt.',
      oppNarrow: 'L’adversaire est resserré; écartez le jeu et attaquez derrière le latéral.',
      oppWide: 'L’adversaire est large; attaquez les demi-espaces.',
      oppNoAnchor: 'Aucune sentinelle adverse claire; jouez entre les lignes.',
      ownFullbacks: 'Gardez une sentinelle pour couvrir les deux latéraux projetés.'
    }
  }[activeLang];
  if (opp.length) {
    const xs = opp.map(p => p.x); const width = Math.max(...xs) - Math.min(...xs);
    const cbs = opp.filter(p => /CB|Defender/i.test(p.role));
    const anchors = opp.filter(p => /Anchor|Holding|DMF|CDM/i.test(p.role));
    if (cbs.length && cbs.filter(p => p.y > 34).length >= Math.max(1, cbs.length - 1)) {
      next.attackingDetails['Board Counter'] = text.oppHigh;
      next.playerInstructions.push(text.oppHigh);
    } else if (width < 58) next.attackingDetails['Board Counter'] = text.oppNarrow;
    else if (width > 90) next.attackingDetails['Board Counter'] = text.oppWide;
    if (!anchors.length) next.playerInstructions.push(text.oppNoAnchor);
  }
  const ownFullbacks = own.filter(p => /Fullback|Wingback|LWB|RWB|LB|RB/i.test(p.role));
  if (ownFullbacks.filter(p => p.y < 64).length >= 2) {
    next.defensiveDetails['Board Safety'] = text.ownFullbacks;
    next.playerInstructions.push(text.ownFullbacks);
  }
  return next;
};

