// Public runtime configuration. The Supabase URL and anon key are safe to expose. Never place a service-role key here.
window.__TACTIC_BOSS_SUPABASE__ = window.__TACTIC_BOSS_SUPABASE__ || {
  url: 'https://otxpxadscieofoostrly.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90eHB4YWRzY2llb2Zvb3N0cmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1OTA0MDksImV4cCI6MjA5NjE2NjQwOX0.dxBgUQ7C3L47XWzsfWmk7eLswgAFIb6ifZ86MyritH8',
  googleOAuthEnabled: true,
  rewardedAdsEnabled: false
};

// Optional external AI proxy for static Netlify deploys. Keep API keys on the proxy, never in this file.
window.__TACTIC_BOSS_AI__ = window.__TACTIC_BOSS_AI__ || {
  coachEndpoint: '/api/tactical-coach'
};
