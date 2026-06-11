export type ModerationLang = 'ar' | 'en' | 'es' | 'fr';

const BLOCKED_TERMS = [
  'fuck','shit','bitch','asshole','bastard','dick','pussy','nigger','nigga','faggot','slut','whore',
  'كس','كسم','نيك','منيك','خول','عرص','شرموط','شرموطة','متناك','زب','طيز','قحبة','لبوة','احا','خرا','وسخ'
];

const normalize = (value: string) => value
  .toLowerCase()
  .replace(/[اأإآ]/g, 'ا')
  .replace(/[ة]/g, 'ه')
  .replace(/[ى]/g, 'ي')
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export function hasBlockedLanguage(value: string): boolean {
  const clean = normalize(value || '');
  if (!clean) return false;
  return BLOCKED_TERMS.some(term => clean.includes(normalize(term)));
}

export function sanitizeUserText(value: string, maxLength = 120): string {
  const trimmed = (value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
  return hasBlockedLanguage(trimmed) ? '' : trimmed;
}

export function moderationMessage(lang: ModerationLang): string {
  return ({
    ar: 'استخدم اسم أو وصف مناسب بدون ألفاظ خارجة.',
    en: 'Use a clean name or description without offensive words.',
    es: 'Usa un nombre o descripción apropiados, sin insultos.',
    fr: 'Utilisez un nom ou une description appropriés, sans propos offensants.'
  } as const)[lang];
}
