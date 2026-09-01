import { db } from "@/lib/db";
import { levelProgress } from "@/lib/level";
import { ensureAchievementDefs } from "@/lib/achievements";

export type GamificationSummary = {
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpToNext: number;
  currentStreak: number;
  longestStreak: number;
  achievements: {
    code: string;
    title: string;
    description: string;
    icon: string | null;
    earned: boolean;
    awardedAt: Date | null;
  }[];
};

export async function getGamificationSummary(
  userId: string,
): Promise<GamificationSummary> {
  await ensureAchievementDefs();

  const [gam, defs, awarded] = await Promise.all([
    db.userGamification.findUnique({ where: { userId } }),
    db.achievementDef.findMany({ orderBy: { order: "asc" } }),
    db.userAchievement.findMany({ where: { userId }, select: { defId: true, awardedAt: true } }),
  ]);

  const awardedMap = new Map(awarded.map((a) => [a.defId, a.awardedAt]));
  const totalXp = gam?.totalXp ?? 0;
  const prog = levelProgress(totalXp);

  return {
    totalXp,
    level: prog.level,
    xpIntoLevel: prog.xpIntoLevel,
    xpToNext: prog.xpToNext,
    currentStreak: gam?.currentStreak ?? 0,
    longestStreak: gam?.longestStreak ?? 0,
    achievements: defs.map((d) => ({
      code: d.code,
      title: d.title,
      description: d.description,
      icon: d.icon,
      earned: awardedMap.has(d.id),
      awardedAt: awardedMap.get(d.id) ?? null,
    })),
  };
}
