# V83 Netlify Build Fix

Use this package for GitHub + Netlify deploy.

Netlify settings:
- Build command: npm run build
- Publish directory: dist
- Functions directory: netlify/functions

AI Environment Variables:
- GEMINI_API_KEY or OPENAI_API_KEY

Do not upload the static zip to GitHub when you want AI Functions. Upload this source package instead.
