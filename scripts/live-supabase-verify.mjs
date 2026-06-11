import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const required = ['SUPABASE_URL','SUPABASE_ANON_KEY','TEST_USER_A_EMAIL','TEST_USER_A_PASSWORD','TEST_USER_B_EMAIL','TEST_USER_B_PASSWORD'];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(2);
}

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;
const clientFor = () => createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
const a = clientFor();
const b = clientFor();
const marker = `rls-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
const results = [];
const record = (name, ok, detail='') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`); };

async function signIn(client, email, password, label) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`${label} sign-in failed`);
  record(`${label}:sign-in`, true, data.user.id);
  return data.user;
}

let tacticId;
let rivalId;
try {
  const userA = await signIn(a, process.env.TEST_USER_A_EMAIL, process.env.TEST_USER_A_PASSWORD, 'user-a');
  const userB = await signIn(b, process.env.TEST_USER_B_EMAIL, process.env.TEST_USER_B_PASSWORD, 'user-b');
  if (userA.id === userB.id) throw new Error('Test users must be different accounts');

  const { data: tactic, error: tacticError } = await b.from('saved_tactics').insert({
    user_id: userB.id,
    title: marker,
    game: 'EA SPORTS FC 26',
    user_formation: '4-3-3',
    opponent_formation: '4-2-3-1',
    user_style: 'balanced',
    opponent_style: 'press',
    match_state: 'start',
    input_data: { verification_marker: marker, board: { players: [] } },
    result_data: { verification_marker: marker }
  }).select('id,user_id').single();
  if (tacticError) throw new Error(`User B tactic insert failed: ${tacticError.message}`);
  tacticId = tactic.id;
  record('user-b:create-own-tactic', tactic.user_id === userB.id);

  const { data: visibleToA, error: queryError } = await a.from('saved_tactics').select('id,user_id').eq('id', tacticId);
  record('user-a:cannot-read-user-b-tactic', !queryError && Array.isArray(visibleToA) && visibleToA.length === 0, queryError?.message || `rows=${visibleToA?.length ?? 'unknown'}`);

  const { data: ownVisible, error: ownQueryError } = await b.from('saved_tactics').select('id,user_id,input_data').eq('id', tacticId).single();
  record('user-b:can-read-own-tactic-and-board', !ownQueryError && ownVisible?.user_id === userB.id && ownVisible?.input_data?.board != null, ownQueryError?.message || 'board present');

  const { error: aDeleteError } = await a.from('saved_tactics').delete().eq('id', tacticId);
  const { data: stillThere } = await b.from('saved_tactics').select('id').eq('id', tacticId).single();
  record('user-a:cannot-delete-user-b-tactic', !aDeleteError && stillThere?.id === tacticId, aDeleteError?.message || 'row remains');

  const { data: rival, error: rivalError } = await b.from('rivals').insert({
    user_id: userB.id,
    name: marker,
    favorite_game: 'EA SPORTS FC 26',
    favorite_formation: '4-2-3-1',
    playstyle: 'press',
    strengths: 'verification',
    weaknesses: 'verification',
    notes: marker,
    board_data: { players: [] }
  }).select('id,user_id').single();
  if (rivalError) throw new Error(`User B rival insert failed: ${rivalError.message}`);
  rivalId = rival.id;
  const { data: rivalVisibleToA } = await a.from('rivals').select('id').eq('id', rivalId);
  record('user-a:cannot-read-user-b-rival', Array.isArray(rivalVisibleToA) && rivalVisibleToA.length === 0, `rows=${rivalVisibleToA?.length ?? 'unknown'}`);

  const { error: subscriptionWriteError } = await a.from('subscriptions').update({ plan: 'elite' }).eq('user_id', userA.id);
  record('browser:cannot-change-subscription', Boolean(subscriptionWriteError), subscriptionWriteError?.message || 'unexpectedly allowed');

  const { error: directAiInsertError } = await a.from('ai_requests').insert({ user_id: userA.id, request_type: marker, success: true });
  record('browser:cannot-direct-insert-ai-request', Boolean(directAiInsertError), directAiInsertError?.message || 'unexpectedly allowed');

  if (results.some(x => !x.ok)) process.exitCode = 1;
} catch (error) {
  console.error(`BLOCKED/FAILED: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (tacticId) await b.from('saved_tactics').delete().eq('id', tacticId);
  if (rivalId) await b.from('rivals').delete().eq('id', rivalId);
  await a.auth.signOut(); await b.auth.signOut();
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), marker, results }, null, 2));
}
