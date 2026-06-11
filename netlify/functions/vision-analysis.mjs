const MAX_IMAGE_CHARS = Number(process.env.MAX_VISION_IMAGE_CHARS || 1_800_000);

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

function parseDataUrl(dataUrl = '') {
  const match = String(dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

function compact(value) {
  return JSON.stringify(value, null, 2).slice(0, 2200);
}

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

function promptFor(kind, payload) {
  const langInstruction = payload.lang === 'ar'
    ? 'اكتب كل النصوص بالعربية الواضحة المختصرة.'
    : 'Write concise clear English.';
  if (kind === 'match') {
    return `${langInstruction}\nYou are a football gaming tactical analyst for PES/eFootball/EA FC. Analyze the uploaded match screenshot together with the user-entered context. Do not invent unreadable text from the image. If the image is unclear, rely on context and say what is inferred. Return JSON only with these keys: tacticalVerdict, keyBattle, scoreReading, teamReport array, opponentReport array, diagnosis array, mistakes array, weakAreas array, recommendations array, training array, counterStrategy, recommendedFormation, coachScore number 1-100, attackScore number 1-100, defenseScore number 1-100, balanceScore number 1-100, riskLevel, beforeScore number, afterScore number, nextMatchSetup array.\nContext:\n${compact(payload.context)}`;
  }
  return `${langInstruction}\nYou are a football gaming screenshot analyst. Analyze the uploaded image for formation, tactical style, strong zones, weak zones, danger zones, and a generator autofill suggestion. Do not invent unreadable text. Return JSON only with keys: detectedFormation, detectedPlaystyle, confidence number 1-100, strongZones array, weakZones array, dangerZones array, generatorAutofill object with myFormation, oppFormation, myStyle, opponentStyle, notes.\nScreenshot mode: ${payload.mode || 'opponent'}`;
}

async function callGemini({ prompt, image }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Missing GEMINI_API_KEY');
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }, { inline_data: { mime_type: image.mimeType, data: image.base64 } }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2, maxOutputTokens: 800 }
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Gemini ${res.status}`);
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  return JSON.parse(text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim());
}

async function callOpenAI({ prompt, dataUrl }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('Missing OPENAI_API_KEY');
  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }, { type: 'input_image', image_url: dataUrl }] }],
      temperature: 0.2,
      max_output_tokens: 900
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `OpenAI ${res.status}`);
  const text = data?.output_text || data?.output?.flatMap((o) => o.content || []).map((c) => c.text || '').join('') || '';
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleaned);
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  try {
    const auth = await validateUser(event);
    if (!auth.ok) return json(auth.status || 401, { error: auth.error || 'Unauthorized' });
    const payload = JSON.parse(event.body || '{}');
    const image = parseDataUrl(payload.fileDataUrl);
    if (!image) return json(400, { error: 'Invalid image data URL' });
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(image.mimeType)) return json(415, { error: 'Unsupported image type' });
    if (image.base64.length > MAX_IMAGE_CHARS) return json(413, { error: 'Image too large' });

    const hasProvider = Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
    if (!hasProvider) return json(501, { error: 'No vision provider configured. Add GEMINI_API_KEY or OPENAI_API_KEY.' });

    const usageKind = payload.kind === 'match' ? 'match_analysis' : 'vision_analysis';
    const usage = await consumeServerQuota(usageKind, auth.bearer);
    if (!usage.ok) return json(usage.status || 429, { error: usage.error || 'Daily AI limit reached' });

    const prompt = promptFor(payload.kind, payload);
    let result;
    if (process.env.GEMINI_API_KEY) result = await callGemini({ prompt, image });
    else result = await callOpenAI({ prompt, dataUrl: payload.fileDataUrl });
    return json(200, { ok: true, provider: process.env.GEMINI_API_KEY ? 'gemini' : 'openai', usage: usage.data || null, result });
  } catch (error) {
    return json(500, { error: error?.message || 'Vision analysis failed' });
  }
}
