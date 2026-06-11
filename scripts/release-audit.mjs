import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checks = [];
const warnings = [];
const add = (name, ok, detail = '') => checks.push({ name, ok, detail });
const exists = p => fs.existsSync(path.join(root, p));
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

for (const file of ['dist/index.html','dist/manifest.json','dist/service-worker.js','dist/offline.html','dist/privacy.html','dist/terms.html','dist/delete-account.html','dist/assets/icon-192.png','dist/assets/icon-512.png']) {
  add(`required:${file}`, exists(file), exists(file) ? 'present' : 'missing');
}

const runtime = read('public/runtime-config.js');
add('runtime:no-service-role', !/service[_-]?role\s*[:=]\s*['"][^'"]+/i.test(runtime), 'no service-role value');
if (/url:\s*''/.test(runtime) || /anonKey:\s*''/.test(runtime)) warnings.push('Supabase runtime configuration is blank; a fresh-device login cannot work until public URL/anon key are injected.');

const sourceFiles = ['src/App.tsx','src/components/AuthScreen.tsx','src/components/TacticalBoard.tsx','src/lib/supabaseClient.ts','public/runtime-config.js'];
const source = sourceFiles.map(read).join('\n');
add('source:no-guest-mode', !/Continue as guest|الدخول كضيف/i.test(source), 'guest access absent');
add('source:no-service-role-key', !/service[_-]?role\s*[:=]\s*['"][A-Za-z0-9._-]{20,}/i.test(source), 'no secret value detected');
add('source:no-raw-alert-confirm', !/\b(?:alert|confirm)\s*\(/.test(source), 'uses in-app user dialogs');
add('source:auth-loading-gate', source.includes('authReady') && source.includes('Preparing your account'), 'session restoration gate present');
add('source:account-scoped-cache', source.includes('scopedKey') && source.includes('session?.user?.id'), 'local user cache is account-scoped');
add('source:no-browser-subscription-write', !/from\(['"]subscriptions['"]\)\.(?:insert|update|upsert|delete)/.test(source), 'no browser subscription writes');

const distText = fs.readdirSync(path.join(root,'dist/assets')).filter(f=>f.endsWith('.js')).map(f=>read(`dist/assets/${f}`)).join('\n');
add('dist:no-visible-diagnostics', !/LOCAL MODE|runDiagnostics|Factory Reset|Supabase Config/i.test(distText), 'no developer UI strings in production bundle');
add('dist:no-guest-mode', !/Continue as guest|الدخول كضيف/i.test(distText), 'guest access absent from production bundle');

const sql = read('release-pack/supabase-release-migration-v53.sql');
for (const token of ['enable row level security','log_ai_request','request_account_deletion','revoke all on table public.subscriptions','for update','REQUEST_TOO_LARGE']) {
  add(`sql:${token}`, sql.toLowerCase().includes(token.toLowerCase()), token);
}

const manifest = JSON.parse(read('public/manifest.json'));
add('pwa:standalone', manifest.display === 'standalone', manifest.display);
add('pwa:icons', Array.isArray(manifest.icons) && manifest.icons.length >= 2, String(manifest.icons?.length || 0));
const sw = read('public/service-worker.js');
add('pwa:runtime-config-network-only', !/PRECACHE[^;]*runtime-config/s.test(sw) && sw.includes('runtime-config.js'), 'runtime config is not pre-cached');
const headers = read('public/_headers');
for (const header of ['Content-Security-Policy','Strict-Transport-Security','X-Content-Type-Options','Referrer-Policy']) add(`headers:${header}`, headers.includes(header), header);
const capacitor = JSON.parse(read('capacitor.config.json'));
add('android:package-id', /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(capacitor.appId), capacitor.appId);

const result = { generatedAt: new Date().toISOString(), passed: checks.every(c=>c.ok), checks, warnings };
fs.mkdirSync(path.join(root,'release-pack'), { recursive: true });
fs.writeFileSync(path.join(root,'release-pack','release-audit-results.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exit(1);
