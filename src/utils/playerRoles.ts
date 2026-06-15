import type { SupportedLang } from './lang';

export const PLAYER_ROLE_OPTIONS = [
  'GK', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'AMF', 'LMF', 'RMF', 'LWF', 'RWF', 'SS', 'CF',
  'Sweeper Keeper', 'Ball Playing Defender', 'Defensive Fullback',
  'Attacking Fullback', 'Wingback', 'Anchor Man', 'Holding Midfielder', 'Box to Box',
  'Deep Lying Playmaker', 'Advanced Playmaker', 'Wide Midfielder', 'Winger',
  'Inside Forward', 'Shadow Striker', 'False 9', 'Target Man', 'Poacher',
  'Complete Forward', 'Free Role'
] as const;

export const PLAYER_ROLE_ABBREVIATIONS: Record<string, string> = {
  GK: 'GK',
  'Sweeper Keeper': 'SK',
  CB: 'CB',
  'Ball Playing Defender': 'BPD',
  'Defensive Fullback': 'FB',
  'Attacking Fullback': 'FB',
  Wingback: 'WB',
  'Anchor Man': 'CDM',
  'Holding Midfielder': 'CDM',
  'Box to Box': 'CM',
  'Deep Lying Playmaker': 'CM',
  'Advanced Playmaker': 'CAM',
  'Wide Midfielder': 'LM/RM',
  Winger: 'LW/RW',
  'Inside Forward': 'LW/RW',
  'Shadow Striker': 'SS',
  'False 9': 'CF',
  'Target Man': 'CF',
  Poacher: 'CF',
  'Complete Forward': 'CF',
  'Free Role': 'FREE',
  LB: 'LB',
  RB: 'RB',
  DMF: 'DMF',
  CMF: 'CMF',
  AMF: 'AMF',
  LMF: 'LMF',
  RMF: 'RMF',
  LWF: 'LWF',
  RWF: 'RWF',
  SS: 'SS',
  CF: 'CF',
};

const labels: Record<string, Record<SupportedLang, string>> = {
  GK: { ar: 'حارس مرمى', en: 'Goalkeeper', es: 'Portero', fr: 'Gardien' },
  'Sweeper Keeper': { ar: 'حارس متقدم', en: 'Sweeper Keeper', es: 'Portero líbero', fr: 'Gardien libéro' },
  CB: { ar: 'قلب دفاع', en: 'Center Back', es: 'Defensa central', fr: 'Défenseur central' },
  'Ball Playing Defender': { ar: 'مدافع صانع لعب', en: 'Ball Playing Defender', es: 'Central con salida', fr: 'Défenseur relanceur' },
  'Defensive Fullback': { ar: 'ظهير دفاعي', en: 'Defensive Fullback', es: 'Lateral defensivo', fr: 'Latéral défensif' },
  'Attacking Fullback': { ar: 'ظهير هجومي', en: 'Attacking Fullback', es: 'Lateral ofensivo', fr: 'Latéral offensif' },
  Wingback: { ar: 'ظهير جناح', en: 'Wingback', es: 'Carrilero', fr: 'Piston' },
  'Anchor Man': { ar: 'ارتكاز ثابت', en: 'Anchor Man', es: 'Pivote ancla', fr: 'Sentinelle' },
  'Holding Midfielder': { ar: 'وسط دفاعي', en: 'Holding Midfielder', es: 'Mediocentro defensivo', fr: 'Milieu défensif' },
  'Box to Box': { ar: 'وسط شامل', en: 'Box to Box', es: 'Box to box', fr: 'Box-to-box' },
  'Deep Lying Playmaker': { ar: 'صانع لعب متأخر', en: 'Deep Lying Playmaker', es: 'Organizador retrasado', fr: 'Meneur reculé' },
  'Advanced Playmaker': { ar: 'صانع لعب متقدم', en: 'Advanced Playmaker', es: 'Mediapunta organizador', fr: 'Meneur avancé' },
  'Wide Midfielder': { ar: 'وسط طرف', en: 'Wide Midfielder', es: 'Volante de banda', fr: 'Milieu excentré' },
  Winger: { ar: 'جناح', en: 'Winger', es: 'Extremo', fr: 'Ailier' },
  'Inside Forward': { ar: 'جناح داخلي', en: 'Inside Forward', es: 'Delantero interior', fr: 'Attaquant intérieur' },
  'Shadow Striker': { ar: 'مهاجم ظل', en: 'Shadow Striker', es: 'Segundo punta', fr: 'Attaquant de soutien' },
  'False 9': { ar: 'مهاجم وهمي', en: 'False 9', es: 'Falso 9', fr: 'Faux 9' },
  'Target Man': { ar: 'رأس حربة محطة', en: 'Target Forward', es: 'Delantero objetivo', fr: 'Point d’appui' },
  Poacher: { ar: 'مهاجم صريح قناص', en: 'Poacher', es: 'Cazagoles', fr: 'Renard des surfaces' },
  'Complete Forward': { ar: 'مهاجم صريح متكامل', en: 'Complete Forward', es: 'Delantero completo', fr: 'Attaquant complet' },
  'Free Role': { ar: 'دور حر', en: 'Free Role', es: 'Rol libre', fr: 'Rôle libre' },
  LB: { ar: 'ظهير أيسر', en: 'Left Back', es: 'Lateral izquierdo', fr: 'Latéral gauche' },
  RB: { ar: 'ظهير أيمن', en: 'Right Back', es: 'Lateral derecho', fr: 'Latéral droit' },
  DMF: { ar: 'وسط دفاعي', en: 'Defensive Midfielder', es: 'Mediocentro defensivo', fr: 'Milieu défensif' },
  CMF: { ar: 'وسط مركزي', en: 'Central Midfielder', es: 'Mediocentro', fr: 'Milieu central' },
  AMF: { ar: 'صانع لعب متقدم', en: 'Attacking Midfielder', es: 'Mediapunta', fr: 'Milieu offensif' },
  LMF: { ar: 'وسط أيسر', en: 'Left Midfielder', es: 'Interior izquierdo', fr: 'Milieu gauche' },
  RMF: { ar: 'وسط أيمن', en: 'Right Midfielder', es: 'Interior derecho', fr: 'Milieu droit' },
  LWF: { ar: 'جناح أيسر', en: 'Left Wing Forward', es: 'Extremo izquierdo', fr: 'Ailier gauche' },
  RWF: { ar: 'جناح أيمن', en: 'Right Wing Forward', es: 'Extremo derecho', fr: 'Ailier droit' },
  SS: { ar: 'مهاجم ثانٍ', en: 'Second Striker', es: 'Segundo delantero', fr: 'Second attaquant' },
  CF: { ar: 'رأس حربة / مهاجم صريح', en: 'Centre Forward', es: 'Delantero centro', fr: 'Avant-centre' },
};

export function playerRoleAbbreviation(role: string): string {
  return PLAYER_ROLE_ABBREVIATIONS[role] || role.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || role;
}

export function playerRoleLabel(role: string, lang: SupportedLang, includeAbbreviation = true): string {
  const label = labels[role]?.[lang] || role;
  const abbreviation = playerRoleAbbreviation(role);
  if (!includeAbbreviation || label === abbreviation) return label;
  return `${label} (${abbreviation})`;
}
