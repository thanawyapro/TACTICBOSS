# Tactic Boss AI V83 — Professional AI Activation

## Important security
Do not place Gemini or OpenAI API keys inside `runtime-config.js`, `index.html`, or frontend code.
Put AI keys only in Netlify Environment Variables.

## Required Netlify environment variables
Add at least one:

```text
GEMINI_API_KEY=your_gemini_key
```

Optional model override:

```text
GEMINI_MODEL=gemini-3.5-flash
```

Or use OpenAI instead:

```text
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4.1-mini
```

## Supabase
The public Supabase URL and anon key are already configured in `public/runtime-config.js`.
Do not use a service-role key in the frontend.

## Netlify build settings
Build command:

```text
npm run build:web
```

Publish directory:

```text
dist
```

Functions directory:

```text
netlify/functions
```

## AI features included
- Tactical Coach chat after plans.
- Vision screenshot/match analysis through Netlify Function.
- Game-safe prompts: AI must not invent settings outside the selected game.
- Language-safe responses for Arabic, English, Spanish, and French.
- Fallback local tips if no API key exists.

## Recommended test
After deployment, open a generated plan and write in the AI coach chat:

```text
The opponent is very fast on the wings and presses high.
```

A real AI response should mention your note directly, not generic tips.
