import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import AuthScreen from '../components/AuthScreen';
import TacticalBoard from '../components/TacticalBoard';
import { GAMES_LIST } from '../utils/gameData';
import { boardFromTeams, getPopularTeamsForGame, getTeamByName } from '../utils/teamData';
import { generateLocalTactic } from '../utils/tacticalEngine';
import { optionLabel } from '../utils/tacticI18n';

describe('release-critical UI', () => {
  it('requires authentication and does not expose guest mode', () => {
    (window as any).__TACTIC_BOSS_SUPABASE__ = { url: '', anonKey: '', googleOAuthEnabled: false };
    render(<AuthScreen onAuthSuccess={() => {}} lang="ar" />);
    expect(screen.getByText('Tactic Boss')).toBeInTheDocument();
    expect(screen.queryByText(/الدخول كضيف|Continue as guest/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Google — قريبًا/).closest('button')).toBeDisabled();
  });

  it('renders a tactical board with both teams and translated role controls', () => {
    const { container } = render(<TacticalBoard formation="4-3-3" opponentFormation="4-2-3-1" lang="ar" />);
    expect(container.querySelectorAll('.pitch-container button').length).toBeGreaterThanOrEqual(22);
    expect(screen.getByText(/تحريك/)).toBeInTheDocument();
    expect(screen.getByText(/رسم/)).toBeInTheDocument();
  });
});

describe('team and game verification', () => {
  it('contains at least 30 featured teams for modern EA FC editions', () => {
    for (const id of ['ea-fc-24', 'ea-fc-25', 'ea-fc-26']) {
      expect(getPopularTeamsForGame(id).length).toBeGreaterThanOrEqual(30);
    }
  });

  it('contains required popular clubs', () => {
    const names = getPopularTeamsForGame('ea-fc-26').map(t => t.name);
    for (const required of ['Real Madrid','FC Barcelona','Atlético Madrid','Manchester City','Liverpool','Arsenal','Chelsea','Manchester United','Tottenham Hotspur','Paris SG','FC Bayern München','Borussia Dortmund','Bayer Leverkusen','Inter','AC Milan','Napoli','Juventus','Roma','Benfica','FC Porto','Ajax','PSV Eindhoven','Galatasaray','Fenerbahçe','CR Flamengo','SE Palmeiras','Boca Juniors','River Plate']) {
      expect(names).toContain(required);
    }
  });

  it('builds a 22-player board from selected real teams', () => {
    const board = boardFromTeams('ea-fc-26', 'Real Madrid', 'Inter', '4-3-3', '3-5-2');
    expect(board?.players.length).toBe(22);
    expect(board?.players.filter(p => p.isOpponent).length).toBe(11);
    expect(board?.players.filter(p => !p.isOpponent).length).toBe(11);
  });

  it('maps game-specific tactical engines to different outputs', () => {
    const input = { myFormation:'4-3-3', oppFormation:'4-2-3-1', opponentStyle:'ضغط عالي', myStyle:'متوازن', matchState:'بداية الماتش', myTeam:'Real Madrid', oppTeam:'Inter', notes:'' };
    const pes = generateLocalTactic(GAMES_LIST.find(g=>g.id==='pes-2021')!, input, 'ar');
    const fc = generateLocalTactic(GAMES_LIST.find(g=>g.id==='ea-fc-25')!, input, 'ar');
    expect(pes.defensiveStyle).not.toEqual(fc.defensiveStyle);
    expect(JSON.stringify(pes.attackingDetails)).not.toEqual(JSON.stringify(fc.attackingDetails));
  });

  it('has core tactical option translations in all supported languages', () => {
    for (const lang of ['ar','en','es','fr'] as const) {
      expect(optionLabel('ضغط عالي', lang)).toBeTruthy();
      expect(optionLabel('استحواذ', lang)).toBeTruthy();
      expect(optionLabel('أنا خسران', lang)).toBeTruthy();
    }
  });

  it('does not silently return the wrong team', () => {
    expect(getTeamByName('ea-fc-26', 'Not A Club')).toBeUndefined();
  });
});
