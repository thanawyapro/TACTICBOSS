import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function getStored(key: string, legacyKey: string): string {
  const current = localStorage.getItem(key) || '';
  const legacy = localStorage.getItem(legacyKey) || '';
  let settingsValue = '';
  try {
    const rawSettings = localStorage.getItem('settings');
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      if (key.includes('url')) settingsValue = parsed?.supabaseUrl || '';
      if (key.includes('key')) settingsValue = parsed?.supabaseAnonKey || '';
    }
  } catch {}
  const fallback = (window as any).__TACTIC_BOSS_SUPABASE__ || {};
  const globalValue = key.includes('url') ? (fallback.url || '') : (fallback.anonKey || '');
  const finalValue = current || legacy || settingsValue || globalValue;
  if (finalValue) {
    localStorage.setItem(key, finalValue);
    localStorage.setItem(legacyKey, finalValue);
  }
  return finalValue;
}

export function initSupabase(url?: string, anonKey?: string): SupabaseClient | null {
  const finalUrl = url || (import.meta as any).env?.VITE_SUPABASE_URL || getStored('tb_sb_url', 'tb_supabase_url');
  const finalKey = anonKey || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || getStored('tb_sb_key', 'tb_supabase_key');

  if (!finalUrl || !finalKey || !finalUrl.startsWith('http')) {
    supabaseInstance = null;
    return null;
  }

  try {
    localStorage.setItem('tb_sb_url', finalUrl);
    localStorage.setItem('tb_supabase_url', finalUrl);
    localStorage.setItem('tb_sb_key', finalKey);
    localStorage.setItem('tb_supabase_key', finalKey);
    supabaseInstance = createClient(finalUrl, finalKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    });
    return supabaseInstance;
  } catch (error) {
    console.warn('Supabase client creation error:', error);
    supabaseInstance = null;
    return null;
  }
}

export function getSupabase(): SupabaseClient | null {
  if (!supabaseInstance) return initSupabase();
  return supabaseInstance;
}
