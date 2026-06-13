const json = (status, body) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  },
  body: JSON.stringify(body),
});

function getBearer(event) {
  const header = event.headers.authorization || event.headers.Authorization || '';
  return String(header || '').startsWith('Bearer ') ? String(header) : '';
}

function supabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return { supabaseUrl: supabaseUrl.replace(/\/$/, ''), supabaseAnonKey };
}

async function validateUser(event) {
  if (process.env.REQUIRE_AUTH_FOR_AI === 'false') return { ok: true, user: null, bearer: '' };
  const bearer = getBearer(event);
  if (!bearer) return { ok: false, status: 401, error: 'Authentication required' };
  const cfg = supabaseConfig();
  if (!cfg) return { ok: false, status: 503, error: 'Auth verification is not configured' };
  const response = await fetch(`${cfg.supabaseUrl}/auth/v1/user`, {
    headers: { apikey: cfg.supabaseAnonKey, Authorization: bearer },
  });
  if (!response.ok) return { ok: false, status: 401, error: 'Invalid session' };
  return { ok: true, user: await response.json().catch(() => null), bearer };
}

async function consumeServerQuota(kind, bearer) {
  if (process.env.REQUIRE_AUTH_FOR_AI === 'false') return { ok: true, skipped: true };
  const cfg = supabaseConfig();
  if (!cfg || !bearer) return { ok: false, status: 503, error: 'Usage guard is not configured' };
  const response = await fetch(`${cfg.supabaseUrl}/rest/v1/rpc/consume_daily_ai_usage`, {
    method: 'POST',
    headers: {
      apikey: cfg.supabaseAnonKey,
      Authorization: bearer,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_kind: kind }),
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const message = String(data?.message || data?.error || data || 'Usage guard rejected request');
    if (process.env.ALLOW_AI_WITHOUT_USAGE_GUARD === 'true') return { ok: true, warning: message, unsafeFallback: true };
    return { ok: false, status: message.includes('DAILY_AI_LIMIT_REACHED') ? 429 : 503, error: message };
  }
  return { ok: true, data };
}

const L = (lang, ar, en, es, fr) => {
  if (lang === 'ar') return ar;
  if (lang === 'es') return es || en;
  if (lang === 'fr') return fr || en;
  return en;
};

function isClassicPes(body) {
  const value = `${body.gameId || ''} ${body.game || ''}`.toLowerCase();
  return /pes[- ]?20(19|20|21)/.test(value);
}

function fallbackResponse(lang = 'ar', body = {}) {
  const formation = body.formation || body?.inputs?.myFormation || '4-2-3-1';
  const note = String(body.userNote || body?.inputs?.notes || '').trim().toLowerCase();
  const pes = isClassicPes(body);
  let answer = L(
    lang,
    `الخطة ${formation} متوازنة كبداية، لكن التعديل الصحيح يتحدد من المشكلة التي كتبتها. ثبّت التشكيل أولًا وعدّل إعدادًا أو اثنين فقط حتى تعرف أثر كل قرار.`,
    `${formation} is a balanced starting point, but the right adjustment depends on the issue you described. Keep the shape stable and change only one or two settings so you can read the effect.`,
    `${formation} es un buen punto de partida. Cambia solo uno o dos ajustes.`,
    `${formation} est un bon point de départ. Modifiez seulement un ou deux réglages.`,
  );

  if (/طرف|جناح|wide|wing|flank|banda|aile|côté/.test(note)) {
    answer = L(
      lang,
      'المشكلة عندك على الطرف، لذلك لا تغيّر التشكيلة كلها. ثبّت الظهير في جهة الخطر، قرّب لاعب الوسط للمساندة، واجعل التحول الهجومي من الجهة العكسية حتى لا تخسر التوازن.',
      'Your issue is on the flank, so do not rebuild the whole shape. Hold the fullback on the threatened side, move a midfielder closer for cover, and attack from the opposite side to keep balance.',
      'El problema está en la banda: fija el lateral y acerca un centrocampista.',
      'Le problème vient du côté : bloquez le latéral et rapprochez un milieu.',
    );
  } else if (/ضغط|press|pressing|presión|pression/.test(note)) {
    answer = L(
      lang,
      pes
        ? 'أمام الضغط في PES، استخدم تمريرًا قصيرًا لو عندك دعم قريب أو تمريرًا طويلًا لو المهاجم يثبت الكرة. لا تستخدم أسماء أساليب eFootball؛ قرارك هنا بين الاستحواذ والهجمة المرتدة مع ضبط بناء اللعب.'
        : 'أمام الضغط، جهّز مخرج تمرير واضح بدل إضافة تعليمات كثيرة. قرّب لاعب الوسط من حامل الكرة، واترك لاعبًا واحدًا فقط يهاجم المساحة خلف أول خط ضغط.',
      pes
        ? 'Against pressure in classic PES, use Short Pass when support is close or Long Pass when the forward can hold the ball. The attacking choice is Possession Game or Counter Attack, not modern eFootball playstyles.'
        : 'Against pressure, create one clear passing outlet instead of stacking instructions. Bring a midfielder closer and send only one runner behind the first press.',
      'Contra la presión, crea una salida clara y no acumules instrucciones.',
      'Face au pressing, créez une sortie claire sans empiler les consignes.',
    );
  } else if (/amf|صانع|playmaker|mediapunta|créateur/.test(note)) {
    answer = L(
      lang,
      'الخطر الحقيقي هو اللاعب بين الخطوط. اجعل محورك قريبًا منه، وامنع قلب الدفاع من الخروج للمراقبة حتى لا تفتح العمق. لو استمر في الاستلام، استخدم رقابة لصيقة فقط على هذا اللاعب.',
      'The real danger is the player between the lines. Keep your holding midfielder close and do not pull a center-back out. If he keeps receiving, use tight marking only on that player.',
      'El peligro está entre líneas: usa el pivote y no saques al central.',
      'Le danger est entre les lignes : utilisez la sentinelle sans sortir le défenseur central.',
    );
  } else if (/سرع|سريع|pace|fast|rápido|vitesse|rapide/.test(note)) {
    answer = L(
      lang,
      'بما أن الخصم أسرع في المساحة، خفّض مخاطرة خطك الدفاعي وثبّت جهة واحدة فقط. هدفك أن تجبره يستلم أمامك بدل أن يجري خلفك.',
      'Because the opponent is faster in space, reduce the risk of your defensive line and hold one side. Force him to receive in front of you instead of running behind you.',
      'Como el rival es rápido, baja el riesgo de la línea y obliga a recibir de frente.',
      'Puisque l’adversaire est rapide, réduisez le risque de la ligne et forcez-le à recevoir face au jeu.',
    );
  }

  const tips = pes
    ? [
        L(lang, 'في PES اختر فقط استحواذ أو هجمة مرتدة كأسلوب هجومي.', 'In classic PES, use only Possession Game or Counter Attack as the attacking style.', 'En PES usa posesión o contraataque.', 'Dans PES utilisez possession ou contre-attaque.'),
        L(lang, 'اضبط بناء اللعب: تمرير قصير أو تمرير طويل.', 'Set Build Up to Short Pass or Long Pass.', 'Ajusta pase corto o largo.', 'Réglez passes courtes ou longues.'),
        L(lang, 'حدّد منطقة الهجوم والاحتواء: العمق أو الأطراف.', 'Choose attacking and containment areas: Centre or Wide.', 'Elige centro o bandas.', 'Choisissez axe ou ailes.'),
      ]
    : [
        L(lang, 'غيّر إعدادًا واحدًا في كل مرة.', 'Change one setting at a time.', 'Cambia un ajuste cada vez.', 'Modifiez un réglage à la fois.'),
        L(lang, 'راقب أول 15 دقيقة قبل رفع المخاطرة.', 'Read the first 15 minutes before increasing risk.', 'Observa los primeros 15 minutos.', 'Observez les 15 premières minutes.'),
        L(lang, 'احتفظ بلاعب يغطي التحول دائمًا.', 'Always keep one player protecting the transition.', 'Mantén un jugador de cobertura.', 'Gardez toujours un joueur en couverture.'),
      ];

  return { answer, tips, conflicts: [], quickActions: [] };
}

function langNameFor(lang) {
  return lang === 'ar' ? 'Arabic' : lang === 'es' ? 'Spanish' : lang === 'fr' ? 'French' : 'English';
}

function extractJson(text) {
  const cleaned = String(text || '').replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleaned || '{}');
}

function modelCandidates() {
  const configured = process.env.GEMINI_MODEL;
  const configuredIsLegacyDefault = !configured || configured === 'gemini-2.5-flash-lite';
  return [...new Set([
    configuredIsLegacyDefault ? null : configured,
    'gemini-3.1-flash-lite',
    configured,
    'gemini-2.5-flash-lite',
  ].filter(Boolean))];
}

async function callGemini(system, user) {
  let lastError = null;
  for (const model of modelCandidates()) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${system}\n\n${user}` }] }],
          generationConfig: {
            temperature: 0.45,
            maxOutputTokens: 700,
            responseMimeType: 'application/json',
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || `Gemini ${response.status}`);
      const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '{}';
      return { model, parsed: extractJson(text) };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Gemini request failed');
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const auth = await validateUser(event);
  if (!auth.ok) return json(auth.status || 401, { error: auth.error || 'Unauthorized' });

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }
  if (JSON.stringify(body).length > 18000) return json(413, { error: 'Payload too large' });

  const lang = body.lang || 'ar';
  const fallback = fallbackResponse(lang, body);
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return json(200, { provider: 'local-fallback', ...fallback });

  const usageKind = body.task === 'match_analysis' ? 'match_analysis' : 'coach_tip';
  const usage = await consumeServerQuota(usageKind, auth.bearer);
  if (!usage.ok) return json(usage.status || 429, { error: usage.error || 'Daily AI limit reached', ...fallback });

  const langName = langNameFor(lang);
  const pesRules = isClassicPes(body)
    ? 'This is PES 2019/2020/2021. The ONLY attacking styles are Possession Game and Counter Attack. Use classic PES Game Plan fields such as Short Pass/Long Pass, Centre/Wide, Flexible/Maintain Formation, Frontline Pressure/All-out Defence, and genuine Advanced Instructions. Never mention Quick Counter, Long Ball Counter or Out Wide as PES attacking styles.'
    : '';
  const system = `You are the conversational Tactic Boss AI Coach. Return ONLY valid JSON. Write every user-visible word in ${langName} only; never mix languages. Answer the user's exact note naturally and directly, like a real coach, not as a generic numbered tutorial. Connect the answer to the selected game, formation, style, opponent and match state. Ask no follow-up question unless essential. Never invent settings that do not exist in the selected game. ${pesRules} If eFootball, use modern Team Playstyles and supported individual instructions. If EA FC, use build-up, defensive approach and player roles. The JSON for coaching must be {"answer":"one natural contextual response","tips":["up to 3 short supporting actions"],"conflicts":["only genuine conflicts"],"quickActions":["up to 3 concise actions"]}.`;

  const wantsPlan = body.task === 'build_plan' || body.task === 'counter_plan';
  const wantsMatchAnalysis = body.task === 'match_analysis';
  const user = wantsPlan
    ? `Task: ${body.task}\nLanguage: ${lang}\nMode: ${body.mode}\nGame: ${body.game}\nGame ID: ${body.gameId || ''}\nInputs: ${JSON.stringify(body.inputs || {}).slice(0, 5000)}\nRecommendation: ${JSON.stringify(body.recommendation || {}).slice(0, 2500)}\nReturn {"recommendation":{"formation":"...","style":"...","reason":"natural contextual reason"},"quickActions":["...","...","..."]}. Respect the selected game's real tactical vocabulary.`
    : wantsMatchAnalysis
      ? `Task: match_analysis\nLanguage: ${lang}\nGame: ${body.game}\nGame ID: ${body.gameId || ''}\nMy formation/style: ${body.formation} / ${body.style}\nOpponent formation/style: ${body.opponentFormation} / ${body.opponentStyle}\nMatch state or score: ${body.matchState || ''}\nUser description: ${body.userNote || ''}\nStructured context: ${JSON.stringify(body.inputs || {}).slice(0, 4500)}\nLocal diagnostic context: ${JSON.stringify(body.plan || {}).slice(0, 3000)}\nGive one natural diagnosis that directly answers what happened, then up to 3 precise adjustments. Use conflicts for the actual causes and quickActions for the next-match setup. Never write generic numbered steps.`
      : `Task: ${body.task}\nLanguage: ${lang}\nMode: ${body.mode}\nGame: ${body.game}\nGame ID: ${body.gameId || ''}\nFormation: ${body.formation}\nStyle: ${body.style}\nOpponent: ${body.opponentFormation} / ${body.opponentStyle}\nMatch state: ${body.matchState}\nUser note: ${body.userNote || ''}\nCurrent plan context: ${JSON.stringify(body.plan || {}).slice(0, 4500)}\nDirect settings: ${JSON.stringify(body.direct || {}).slice(0, 2500)}\nRespond to the user's note first. Do not output headings like Step 1, Step 2 or generic fallback language.`;

  try {
    if (process.env.GEMINI_API_KEY) {
      const { model, parsed } = await callGemini(system, user);
      if (wantsPlan) {
        return json(200, {
          provider: 'gemini',
          model,
          usage: usage.data || null,
          recommendation: parsed.recommendation || {},
          quickActions: Array.isArray(parsed.quickActions) ? parsed.quickActions.slice(0, 3) : [],
        });
      }
      return json(200, {
        provider: 'gemini',
        model,
        usage: usage.data || null,
        answer: String(parsed.answer || fallback.answer),
        tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3) : fallback.tips,
        conflicts: Array.isArray(parsed.conflicts) ? parsed.conflicts.slice(0, 3) : [],
        quickActions: Array.isArray(parsed.quickActions) ? parsed.quickActions.slice(0, 3) : [],
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        temperature: 0.45,
        max_tokens: 700,
        response_format: { type: 'json_object' },
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || `OpenAI ${response.status}`);
    const parsed = extractJson(data?.choices?.[0]?.message?.content || '{}');
    if (wantsPlan) return json(200, { provider: 'openai', usage: usage.data || null, recommendation: parsed.recommendation || {}, quickActions: Array.isArray(parsed.quickActions) ? parsed.quickActions.slice(0, 3) : [] });
    return json(200, {
      provider: 'openai',
      usage: usage.data || null,
      answer: String(parsed.answer || fallback.answer),
      tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3) : fallback.tips,
      conflicts: Array.isArray(parsed.conflicts) ? parsed.conflicts.slice(0, 3) : [],
      quickActions: Array.isArray(parsed.quickActions) ? parsed.quickActions.slice(0, 3) : [],
    });
  } catch (error) {
    return json(200, { provider: 'local-fallback', ...fallback, warning: String(error?.message || error) });
  }
}
