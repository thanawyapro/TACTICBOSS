TACTIC BOSS AI - NO BUILD DEPLOY

This package is prebuilt. Do NOT run npm build on Netlify.

Netlify settings:
- Build command: leave empty
- Publish directory: .
- Functions directory: netlify/functions

Environment variables for AI:
- GEMINI_API_KEY or OPENAI_API_KEY

Supabase public config is already in runtime-config.js.
Never place OpenAI/Gemini keys in runtime-config.js.
