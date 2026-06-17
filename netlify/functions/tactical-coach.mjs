const json = (status, body) => ({
  statusCode: status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  },
  body: JSON.stringify(body)
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
  const res = await fetch(`${cfg.supabaseUrl}/auth/v1/user`, {
    headers: { apikey: cfg.supabaseAnonKey, Authorization: bearer }
  });
  if (!res.ok) return { ok: false, status: 401, error: 'Invalid session' };
  return { ok: true, user: await res.json().catch(() => null), bearer };
}

async function consumeServerQuota(kind, bearer) {
  if (process.env.REQUIRE_AUTH_FOR_AI === 'false') return { ok: true, skipped: true };
  const cfg = supabaseConfig();
  if (!cfg || !bearer) return { ok: false, status: 503, error: 'Usage guard is not configured' };
  const res = await fetch(`${cfg.supabaseUrl}/rest/v1/rpc/consume_daily_ai_usage`, {
    method: 'POST',
    headers: {
      apikey: cfg.supabaseAnonKey,
      Authorization: bearer,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_kind: kind })
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
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

const fallbackTips = (lang = 'ar', body = {}) => {
  const formation = body.formation || body?.inputs?.myFormation || '4-2-3-1';
  const game = String(body.game || body.gameId || '');
  const note = String(body.userNote || body?.inputs?.notes || '').toLowerCase();
  const tips = [];
  if (/طرف|جناح|wide|wing|flank|banda|aile|côté/.test(note)) {
    tips.push(L(lang,
      'ملاحظتك عن الأطراف: فعّل التعليمة الدفاعية على جهة الخطر فقط، ولا تستخدم Counter Target إلا على جناح واحد سريع.',
      'Wide danger note: apply the defensive instruction only on the threatened side, and use Counter Target on one fast winger only.',
      'Peligro por banda: usa la instrucción defensiva solo en el lado amenazado y Counter Target en un solo extremo rápido.',
      'Danger sur le côté : appliquez la consigne défensive uniquement côté danger et Counter Target sur un seul ailier rapide.'
    ));
  }
  if (/ضغط|press|pressing|presión|pression/.test(note)) {
    tips.push(L(lang,
      'ملاحظتك عن الضغط: لا تزود التعليمات؛ اختَر مخرج تمرير مباشر، وفي PES استخدم Counter Target فقط لو عندك مهاجم يستلم.',
      'Pressure note: do not add many instructions; use a direct outlet, and in PES use Counter Target only if you have a receiving forward.',
      'Nota de presión: no añadas muchas instrucciones; usa una salida directa y en PES usa Counter Target solo con un delantero receptor.',
      'Note pressing : n’ajoutez pas trop de consignes ; utilisez une sortie directe, et dans PES Counter Target seulement avec un attaquant relais.'
    ));
  }
  if (/سرع|سريع|pace|fast|rápido|vitesse|rapide/.test(note)) {
    tips.push(L(lang,
      'ملاحظتك عن السرعة: لا ترفع خط الدفاع، وفي eFootball اجعل Deep Line على DMF فقط لحماية العمق.',
      'Pace note: do not raise the line; in eFootball use Deep Line on DMF only to protect depth.',
      'Rival rápido: no subas la línea; en eFootball usa Deep Line solo en el MCD para proteger la profundidad.',
      'Adversaire rapide : ne montez pas la ligne ; dans eFootball utilisez Deep Line sur le MDF seulement.'
    ));
  }
  if (/amf|صانع|playmaker|10|mediapunta|créateur/.test(note)) {
    tips.push(L(lang,
      'لو الخطر من صانع اللعب: استخدم Man Marking أو Tight Marking على AMF/SS حسب اللعبة، ولا تسحب قلبي الدفاع للمراقبة.',
      'If danger is the playmaker: use Man Marking/Tight Marking on AMF/SS where supported; do not pull CBs out.',
      'Si el peligro es el mediapunta: usa Man Marking/Tight Marking sobre AMF/SS si el juego lo permite; no saques a los centrales.',
      'Si le danger vient du créateur : utilisez Man Marking/Tight Marking sur AMF/SS si disponible ; ne sortez pas les DC.'
    ));
  }
  const generic = [
    L(lang,
      `ابدأ بـ ${formation} كما هي، ولا تغيّر أكثر من تعليماتين قبل الدقيقة 30.`,
      `Start with ${formation}; do not change more than two instructions before minute 30.`,
      `Empieza con ${formation}; no cambies más de dos instrucciones antes del minuto 30.`,
      `Commencez avec ${formation}; ne changez pas plus de deux consignes avant la 30e minute.`),
    L(lang,
      game.includes('PES') ? 'في PES استخدم فقط Advanced Instructions الموجودة داخل Game Plan، ولا تعرض Player Styles كأنها تعليمات.' : 'التزم بتعليمات اللعبة المتاحة فقط، ولا تخلط بين PES و eFootball و EA FC.',
      game.includes('PES') ? 'In PES, use only Advanced Instructions from Game Plan; do not present Player Styles as instructions.' : 'Use only instructions available in the selected game; do not mix PES, eFootball and EA FC.',
      game.includes('PES') ? 'En PES, usa solo Advanced Instructions de Game Plan; no presentes Player Styles como instrucciones.' : 'Usa solo instrucciones disponibles en el juego elegido; no mezcles PES, eFootball and EA FC.',
      game.includes('PES') ? 'Dans PES, utilisez seulement les Advanced Instructions du Game Plan ; ne présentez pas les Player Styles comme consignes.' : 'Utilisez seulement les consignes disponibles dans le jeu choisi ; ne mélangez pas PES, eFootball et EA FC.'),
    L(lang,
      body.mode === 'counter' ? 'راقب جهة هجوم الخصم أول 10 دقائق، ثم فعّل التعليمات الدفاعية المناسبة فقط.' : 'لو الخطة لا تخلق فرصًا، غيّر منطقة الهجوم قبل تغيير التشكيلة.',
      body.mode === 'counter' ? 'Watch the rival attack side for 10 minutes, then apply only the matching defensive instruction.' : 'If chances are weak, change attack area before changing shape.',
      body.mode === 'counter' ? 'Observa el lado de ataque rival durante 10 minutos y aplica solo la instrucción defensiva adecuada.' : 'Si no creas ocasiones, cambia la zona de ataque antes de cambiar la formación.',
      body.mode === 'counter' ? 'Observez le côté d’attaque adverse pendant 10 minutes, puis appliquez seulement la consigne défensive adaptée.' : 'Si vous créez peu d’occasions, changez la zone d’attaque avant le système.')
  ];
  return [...tips, ...generic].slice(0, 5);
};

function fallbackConversation(lang = 'ar', body = {}) {
  const note = String(body.userNote || '').trim();
  const tactic = body.savedTactic || {};
  const formation = tactic.formation || 'الخطة الحالية';
  const style = tactic.style || '';
  if (lang === 'ar') {
    if (/يمين|طرف|جناح/.test(note)) return `من كلامك، المشكلة ليست في ${formation} نفسها بل في تغطية الجهة وقت التحول. ثبّت الظهير في جهة الخطر، قرّب لاعب الوسط الدفاعي منه، ولا تغيّر أكثر من تعليمة واحدة في نفس الوقت. ${style ? `حافظ على ${style} لكن قلّل المخاطرة على الطرف المصاب.` : ''}`.trim();
    if (/ضغط|بناء|خروج/.test(note)) return `واضح أن المشكلة في أول مرحلة من البناء. استخدم مخرج تمرير قريب، اجعل لاعب ارتكاز يظهر أمام قلبي الدفاع، ولا تجبر التمرير في العمق. جرّب التعديل لعشر دقائق ثم قيّم هل الخصم ما زال يغلق نفس المسار.`;
    return `فهمت ملاحظتك: ${note || 'تحتاج مراجعة الخطة'}. ابدأ بتحديد أين تفقد السيطرة بالضبط، ثم غيّر تعليمة واحدة مرتبطة بالمشكلة بدل تغيير التشكيلة كلها. لو عندك خطة محفوظة، اربط السؤال بها للحصول على قراءة أدق.`;
  }
  return `I understood your note: ${note || 'the tactic needs review'}. Identify exactly where control is lost, then change one instruction tied to that problem instead of changing the whole formation. Select a saved tactic for a more precise answer.`;
}

function langNameFor(lang) {
  return lang === 'ar' ? 'Arabic' : lang === 'es' ? 'Spanish' : lang === 'fr' ? 'French' : 'English';
}

function extractJson(text) {
  const regexJson = new RegExp('```json\\s*', 'i');
  const cleaned = String(text || '').replace(regexJson, '').replace(/```$/i, '').trim();
  return JSON.parse(cleaned || '{}');
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const auth = await validateUser(event);
  if (!auth.ok) return json(auth.status || 401, { error: auth.error || 'Unauthorized' });

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }
  if (JSON.stringify(body).length > 18000) return json(413, { error: 'Payload too large' });

  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return body.task === 'plan_analysis' ? json(200, { provider: 'local-context', answer: fallbackConversation(body.lang, body) }) : json(200, { provider: 'local-fallback', tips: fallbackTips(body.lang, body) });

  const usage = await consumeServerQuota('coach_tip', auth.bearer);
  if (!usage.ok) return json(usage.status || 429, { error: usage.error || 'Daily AI limit reached', tips: fallbackTips(body.lang, body) });

  const lang = body.lang || 'ar';
  const langName = langNameFor(lang);
  const isConversation = body.task === 'plan_analysis';
  const system = isConversation
    ? `You are Tactic Boss AI, a natural football gaming tactical coach. Answer in ${langName} only. Respond directly to the user's exact observation in natural prose, not a numbered checklist unless explicitly requested. Use the saved tactic context when present. Never mix PES, eFootball, and EA FC settings. Be honest when context is missing. Return ONLY JSON: {"answer":"...","relatedSection":"library"}.`
    : `You are Tactic Boss AI Coach. Return ONLY JSON. Write ALL text in ${langName} only. Keep it short and actionable. Do not invent settings outside the selected football game. If PES, only mention PES Game Plan or Advanced Instructions. If eFootball, only mention Team Playstyle/Individual Instructions. If EA FC, only mention FC IQ/Player Roles/Team Tactics.`;

  const wantsPlan = body.task === 'build_plan' || body.task === 'counter_plan';
  const user = isConversation
    ? `Task: plan_analysis
Game: ${body.game || ''}
Explanation level: ${body.explanationLevel || 'balanced'}
Saved tactic: ${JSON.stringify(body.savedTactic || {}).slice(0, 6500)}
User observation/question: ${String(body.userNote || '').slice(0, 2500)}
Answer naturally and specifically. Do not output generic fallback steps.`
    : wantsPlan
      ? `Task: ${body.task}
Lang: ${lang}
Mode: ${body.mode}
Game: ${body.game}
Inputs: ${JSON.stringify(body.inputs || {}).slice(0, 5000)}
Recommendation: ${JSON.stringify(body.recommendation || {}).slice(0, 2500)}
Return JSON only: {"recommendation":{"formation":"...","style":"...","reason":"..."},"quickActions":["...","...","..."]}. Formation/style must respect the user's chosen recommendation and selected game.`
      : `Task: ${body.task}
Lang: ${lang}
Mode: ${body.mode}
Game: ${body.game}
Formation: ${body.formation}
Style: ${body.style}
Opponent: ${body.opponentFormation} ${body.opponentStyle}
Match state: ${body.matchState}
User note: ${body.userNote || ''}
Direct settings: ${JSON.stringify(body.direct || {}).slice(0, 3500)}
Return JSON only: {"tips":["...","...","..."],"conflicts":["..."],"quickActions":["..."]}.`;

  try {
    if (process.env.GEMINI_API_KEY) {
      const configuredModel = String(process.env.GEMINI_MODEL || '').trim();
      const preferredModels = Array.from(new Set([
        ...(configuredModel && !configuredModel.includes('lite') ? [configuredModel] : []),
        'gemini-3.5-flash',
        'gemini-2.5-flash',
        ...(configuredModel ? [configuredModel] : []),
      ]));
      let data = null;
      let usedModel = '';
      let lastError = '';
      for (const geminiModel of preferredModels) {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `${system}\n\n${user}` }] }], generationConfig: { temperature: isConversation ? 0.48 : 0.25, maxOutputTokens: isConversation ? 850 : 500, responseMimeType: 'application/json' } })
        });
        data = await res.json();
        if (res.ok) { usedModel = geminiModel; break; }
        lastError = data?.error?.message || `Gemini ${res.status}`;
      }
      if (!usedModel) throw new Error(lastError || 'Gemini request failed');
      const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '{}';
      const parsed = extractJson(text);
      if (isConversation) return json(200, { provider: `gemini:${usedModel}`, usage: usage.data || null, answer: String(parsed.answer || fallbackConversation(lang, body)), relatedSection: parsed.relatedSection || 'library' });
      if (wantsPlan) return json(200, { provider: `gemini:${usedModel}`, usage: usage.data || null, recommendation: parsed.recommendation || {}, quickActions: Array.isArray(parsed.quickActions) ? parsed.quickActions.slice(0,3) : [] });
      return json(200, { provider: `gemini:${usedModel}`, usage: usage.data || null, tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0,5) : fallbackTips(lang, body), conflicts: Array.isArray(parsed.conflicts) ? parsed.conflicts.slice(0,4) : [], quickActions: Array.isArray(parsed.quickActions) ? parsed.quickActions.slice(0,3) : [] });
    }
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature: 0.25, max_tokens: 450, response_format: { type: 'json_object' } })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `OpenAI ${res.status}`);
    const parsed = extractJson(data?.choices?.[0]?.message?.content || '{}');
    if (isConversation) return json(200, { provider: 'openai', usage: usage.data || null, answer: String(parsed.answer || fallbackConversation(lang, body)), relatedSection: parsed.relatedSection || 'library' });
    if (wantsPlan) return json(200, { provider: 'openai', usage: usage.data || null, recommendation: parsed.recommendation || {}, quickActions: Array.isArray(parsed.quickActions) ? parsed.quickActions.slice(0,3) : [] });
    return json(200, { provider: 'openai', usage: usage.data || null, tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0,5) : fallbackTips(lang, body), conflicts: Array.isArray(parsed.conflicts) ? parsed.conflicts.slice(0,4) : [], quickActions: Array.isArray(parsed.quickActions) ? parsed.quickActions.slice(0,3) : [] });
  } catch (error) {
    return isConversation ? json(200, { provider: 'local-context', answer: fallbackConversation(lang, body), warning: String(error?.message || error) }) : json(200, { provider: 'local-fallback', tips: fallbackTips(lang, body), warning: String(error?.message || error) });
  }
}