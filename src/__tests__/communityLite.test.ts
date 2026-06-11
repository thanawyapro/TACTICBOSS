import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const migration = fs.readFileSync('supabase-community-lite-v58.sql', 'utf8');
const component = fs.readFileSync('src/components/CommunityLite.tsx', 'utf8');

describe('Community Lite low-load architecture', () => {
  it('avoids heavy realtime, comments and image storage features', () => {
    expect(migration).not.toMatch(/alter publication supabase_realtime|create table if not exists public\.community_comments|storage\.objects/i);
    expect(component).toContain('CACHE_MS = 15 * 60 * 1000');
    expect(component).toContain('p_limit: 12');
  });

  it('uses secure RPC actions and unique use tracking', () => {
    for (const name of ['publish_community_tactic_lite', 'community_feed_lite', 'toggle_community_like_lite', 'toggle_community_save_lite', 'use_community_tactic_lite', 'claim_referral_lite']) {
      expect(migration).toContain(name);
    }
    expect(migration).toContain('primary key (user_id, tactic_id)');
    expect(migration).toContain('security definer');
  });

  it('generates share cards locally without uploading them', () => {
    expect(component).toContain("document.createElement('canvas')");
    expect(component).not.toMatch(/storage\.from|upload\(/i);
  });
});
