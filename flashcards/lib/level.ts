export const XP_PER_LEVEL = 100;

export type LevelInfo = {
  level: number;
  xpIntoLevel: number;
  xpToNext: number;
};

export function levelForXp(totalXp: number): number {
  return 1 + Math.floor(totalXp / XP_PER_LEVEL);
}

export function levelProgress(totalXp: number): LevelInfo {
  const level = levelForXp(totalXp);
  const xpIntoLevel = totalXp - (level - 1) * XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - xpIntoLevel;
  return { level, xpIntoLevel, xpToNext };
}
