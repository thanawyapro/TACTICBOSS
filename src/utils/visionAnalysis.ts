import { SupportedLang } from './lang';
import { AnalysisMode, MatchAnalysisResult, MatchContextInput, ScreenshotAnalysisResult } from './aiAnalysisEngine';
import { getSupabase } from '../lib/supabaseClient';

const hasUsefulText = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
const hasUsefulArray = (value: unknown) => Array.isArray(value) && value.some(hasUsefulText);

function safeMergeMatch(local: MatchAnalysisResult, remote: Partial<MatchAnalysisResult>): MatchAnalysisResult {
  return {
    ...local,
    tacticalVerdict: hasUsefulText(remote.tacticalVerdict) ? String(remote.tacticalVerdict) : local.tacticalVerdict,
    keyBattle: hasUsefulText(remote.keyBattle) ? String(remote.keyBattle) : local.keyBattle,
    scoreReading: hasUsefulText(remote.scoreReading) ? String(remote.scoreReading) : local.scoreReading,
    teamReport: hasUsefulArray(remote.teamReport) ? remote.teamReport as string[] : local.teamReport,
    opponentReport: hasUsefulArray(remote.opponentReport) ? remote.opponentReport as string[] : local.opponentReport,
    diagnosis: hasUsefulArray(remote.diagnosis) ? remote.diagnosis as string[] : local.diagnosis,
    mistakes: hasUsefulArray(remote.mistakes) ? remote.mistakes as string[] : local.mistakes,
    weakAreas: hasUsefulArray(remote.weakAreas) ? remote.weakAreas as string[] : local.weakAreas,
    recommendations: hasUsefulArray(remote.recommendations) ? remote.recommendations as string[] : local.recommendations,
    training: hasUsefulArray(remote.training) ? remote.training as string[] : local.training,
    counterStrategy: hasUsefulText(remote.counterStrategy) ? String(remote.counterStrategy) : local.counterStrategy,
    recommendedFormation: hasUsefulText(remote.recommendedFormation) ? String(remote.recommendedFormation) : local.recommendedFormation,
    coachScore: typeof remote.coachScore === 'number' ? Math.max(1, Math.min(100, remote.coachScore)) : local.coachScore,
    attackScore: typeof remote.attackScore === 'number' ? Math.max(1, Math.min(100, remote.attackScore)) : local.attackScore,
    defenseScore: typeof remote.defenseScore === 'number' ? Math.max(1, Math.min(100, remote.defenseScore)) : local.defenseScore,
    balanceScore: typeof remote.balanceScore === 'number' ? Math.max(1, Math.min(100, remote.balanceScore)) : local.balanceScore,
    riskLevel: hasUsefulText(remote.riskLevel) ? String(remote.riskLevel) : local.riskLevel,
    beforeScore: typeof remote.beforeScore === 'number' ? Math.max(1, Math.min(100, remote.beforeScore)) : local.beforeScore,
    afterScore: typeof remote.afterScore === 'number' ? Math.max(1, Math.min(100, remote.afterScore)) : local.afterScore,
    nextMatchSetup: hasUsefulArray(remote.nextMatchSetup) ? remote.nextMatchSetup as string[] : local.nextMatchSetup,
    storagePolicy: 'local_first',
    id: local.id,
    imageName: local.imageName,
    createdAt: local.createdAt
  };
}

function safeMergeScreenshot(local: ScreenshotAnalysisResult, remote: Partial<ScreenshotAnalysisResult>): ScreenshotAnalysisResult {
  return {
    ...local,
    detectedFormation: hasUsefulText(remote.detectedFormation) ? String(remote.detectedFormation) : local.detectedFormation,
    detectedPlaystyle: hasUsefulText(remote.detectedPlaystyle) ? String(remote.detectedPlaystyle) : local.detectedPlaystyle,
    confidence: typeof remote.confidence === 'number' ? Math.max(1, Math.min(100, remote.confidence)) : local.confidence,
    strongZones: hasUsefulArray(remote.strongZones) ? remote.strongZones as string[] : local.strongZones,
    weakZones: hasUsefulArray(remote.weakZones) ? remote.weakZones as string[] : local.weakZones,
    dangerZones: hasUsefulArray(remote.dangerZones) ? remote.dangerZones as string[] : local.dangerZones,
    generatorAutofill: remote.generatorAutofill ? { ...local.generatorAutofill, ...remote.generatorAutofill } : local.generatorAutofill,
    id: local.id,
    imageName: local.imageName,
    mode: local.mode,
    createdAt: local.createdAt
  };
}

async function callVision(payload: Record<string, unknown>) {
  const session = await getSupabase()?.auth.getSession().then(({ data }) => data.session).catch(() => null);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  const response = await fetch('/.netlify/functions/vision-analysis', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Vision API failed: ${response.status}`);
  const data = await response.json();
  if (!data?.result) throw new Error('Vision API returned no result');
  return data.result;
}

export async function enhanceMatchWithVision(params: {
  fileDataUrl?: string;
  fileName: string;
  context: MatchContextInput;
  lang: SupportedLang;
  localResult: MatchAnalysisResult;
}): Promise<MatchAnalysisResult> {
  if (!params.fileDataUrl) return params.localResult;
  try {
    const remote = await callVision({ kind: 'match', ...params });
    return safeMergeMatch(params.localResult, remote as Partial<MatchAnalysisResult>);
  } catch (error) {
    console.warn('Vision match fallback:', error);
    return params.localResult;
  }
}

export async function enhanceScreenshotWithVision(params: {
  fileDataUrl?: string;
  fileName: string;
  mode: AnalysisMode;
  lang: SupportedLang;
  localResult: ScreenshotAnalysisResult;
}): Promise<ScreenshotAnalysisResult> {
  if (!params.fileDataUrl) return params.localResult;
  try {
    const remote = await callVision({ kind: 'screenshot', ...params });
    return safeMergeScreenshot(params.localResult, remote as Partial<ScreenshotAnalysisResult>);
  } catch (error) {
    console.warn('Vision screenshot fallback:', error);
    return params.localResult;
  }
}
