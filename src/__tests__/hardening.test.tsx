import { describe, expect, it } from 'vitest';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import fs from 'node:fs';
import AuthScreen from '../components/AuthScreen';
import { analyzeBoardShape, applyBoardIntelligence } from '../utils/boardIntelligence';
import { translations } from '../utils/lang';
import { getPopularTeamsForGame } from '../utils/teamData';
import type { TacticResult, TacticalBoardState } from '../types';

describe('authentication hardening', () => {
  it('requires password confirmation when creating an account', () => {
    (window as any).__TACTIC_BOSS_SUPABASE__ = { url: '', anonKey: '', googleOAuthEnabled: false };
    render(<AuthScreen onAuthSuccess={() => {}} lang="en" />);
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(screen.getByText('Confirm Password')).toBeInTheDocument();
    expect(document.querySelectorAll('input[autocomplete="new-password"]').length).toBe(2);
  });
});

describe('board intelligence', () => {
  const baseResult: TacticResult = {
    formation:'4-3-3', reason:'x', defensiveStyle:'Balanced', defensiveDetails:{}, attackingStyle:'Balanced', attackingDetails:{},
    playerInstructions:[], inGameStrategy:'x', emergencyPlan:'x', protectLeadPlan:'x', mistakesToAvoid:[], difficulty:'Medium', confidence:'90%'
  };

  it('detects no anchor and simultaneous advanced fullbacks', () => {
    const board: TacticalBoardState = { teamColor:'#000', opponentColor:'#fff', players:[
      {id:'1',role:'Attacking Fullback',x:10,y:40,isOpponent:false},
      {id:'2',role:'Attacking Fullback',x:90,y:40,isOpponent:false},
      {id:'3',role:'CB',x:40,y:72,isOpponent:false},
      {id:'4',role:'CB',x:60,y:72,isOpponent:false},
    ]};
    const insights = analyzeBoardShape(board, 'en').join(' ');
    expect(insights).toMatch(/fullbacks/i);
    expect(insights).toMatch(/holding midfielder/i);
  });

  it('changes result using opponent board shape', () => {
    const board: TacticalBoardState = { teamColor:'#000', opponentColor:'#fff', players:[
      {id:'o1',role:'CB',x:45,y:60,isOpponent:true}, {id:'o2',role:'CB',x:55,y:60,isOpponent:true}
    ]};
    const changed = applyBoardIntelligence(baseResult, board, 'en');
    expect(JSON.stringify(changed)).not.toEqual(JSON.stringify(baseResult));
  });
});

describe('release data integrity', () => {
  it('keeps translation dictionaries structurally identical', () => {
    const reference = Object.keys(translations.en).sort();
    for (const lang of ['ar','en','es','fr'] as const) expect(Object.keys(translations[lang]).sort()).toEqual(reference);
  });

  it('modern teams have valid 11-player templates and varied formations', () => {
    const teams = getPopularTeamsForGame('ea-fc-26');
    expect(teams.length).toBeGreaterThanOrEqual(30);
    expect(teams.every(team => team.players.length === 11)).toBe(true);
    expect(new Set(teams.map(team => team.defaultFormation)).size).toBeGreaterThanOrEqual(4);
  });

  it('runtime config contains no service-role secret', () => {
    const runtime = fs.readFileSync('public/runtime-config.js','utf8');
    expect(runtime).not.toMatch(/service[_-]?role\s*[:=]\s*['"][A-Za-z0-9._-]{20,}/i);
  });
});
