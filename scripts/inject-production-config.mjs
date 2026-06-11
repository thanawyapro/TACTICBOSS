import fs from 'node:fs';
const url = (process.env.SUPABASE_URL || '').trim();
const anonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
const googleOAuthEnabled = String(process.env.GOOGLE_OAUTH_ENABLED || 'false').toLowerCase() === 'true';
if (!url || !anonKey) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required.');
if (!/^https:\/\//i.test(url)) throw new Error('SUPABASE_URL must use HTTPS.');
try {
  const payload = JSON.parse(Buffer.from(anonKey.split('.')[1], 'base64url').toString('utf8'));
  if (payload.role === 'service_role') throw new Error('Refusing to write a service-role key into the frontend.');
} catch (error) {
  if (String(error.message).includes('service-role')) throw error;
}
const output = `// Generated public production runtime configuration. Never place a service-role key here.\nwindow.__TACTIC_BOSS_SUPABASE__ = {\n  url: ${JSON.stringify(url)},\n  anonKey: ${JSON.stringify(anonKey)},\n  googleOAuthEnabled: ${googleOAuthEnabled}\n};\n`;
fs.writeFileSync('public/runtime-config.js', output);
console.log('Production runtime configuration written to public/runtime-config.js');
