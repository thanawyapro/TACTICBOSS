# Required actions before public web launch

Only these actions remain outside the source code:

1. Obtain the public Supabase Project URL and anon/public key from the production Supabase project.
2. Build with `npm run build:web-launch` using those two public values.
3. Upload the generated `dist/` contents to Netlify and set the production domain in Supabase Auth URL Configuration.
4. Run a live acceptance test with two separate user accounts and confirm Row Level Security isolation.

Do not enable paid checkout yet. Do not use a Supabase service-role key in the web app.
