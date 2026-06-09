# AI without uploading the full source

Static Netlify Drag & Drop cannot run internal Netlify Functions. To enable real AI while keeping static deploys, use an external AI proxy endpoint.

## Option A — existing Netlify Function from another site
Deploy only `netlify/functions/tactical-coach.mjs` once in any Netlify Functions site, add `GEMINI_API_KEY` or `OPENAI_API_KEY`, then set this in `public/runtime-config.js` before building or in deployed `runtime-config.js`:

```js
window.__TACTIC_BOSS_AI__ = {
  coachEndpoint: 'https://YOUR-PROXY-SITE.netlify.app/.netlify/functions/tactical-coach'
};
```

## Option B — localStorage quick test
Open the app console and run:

```js
localStorage.setItem('tb_ai_coach_endpoint','https://YOUR-PROXY-SITE.netlify.app/.netlify/functions/tactical-coach');
location.reload();
```

Never put Gemini/OpenAI API keys in browser files.
