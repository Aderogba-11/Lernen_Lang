import { db } from "@/lib/db";
import { updateStreak } from "@/lib/streak";
import { evaluateAchievements } from "@/lib/achievements";

export const XP_FLASHCARD = 5;
export const XP_EXERCISE = 10;
export const XP_LESSON = 25;
export const XP_DAILY_GOAL = 50;
export const DAILY_GOAL_XP = 50;

export type XpReason =
  | "FLASHCARD"
  | "EXERCISE"
  | "LESSON"
  | "DAILY_GOAL";

export type AwardResult = {
  amount: number;
  reason: XpReason;
  totalXp: number;
  level: number;
  streak: { current: number; longest: number };
  dailyGoalBonus: boolean;
  awardedAchievements: string[];
};

export async function ensureGamification(userId: string) {
  const existing = await db.userGamification.findUnique({ where: { userId } });
  if (existing) return existing;
  return db.userGamification.create({ data: { userId } });
}

async function checkDailyGoal(
  userId: string,
  now: Date,
  candidate: number,
): Promise<boolean> {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const [sum, alreadyBonus] = await Promise.all([
    db.xpEvent.aggregate({
      _sum: { amount: true },
      where: { userId, createdAt: { gte: start, lt: end } },
    }),
    db.xpEvent.findFirst({
      where: { userId, reason: "DAILY_GOAL", createdAt: { gte: start, lt: end } },
    }),
  ]);

  const total = (sum._sum.amount ?? 0) + candidate;
  return total >= DAILY_GOAL_XP && !alreadyBonus;
}

export async function awardXp(
  userId: string,
  amount: number,
  reason: XpReason,
  opts: { refType?: string; refId?: string; now?: Date } = {},
): Promise<AwardResult> {
  const now = opts.now ?? new Date();

  const gam = await ensureGamification(userId);

  const streak = updateStreak(
    {
      currentStreak: gam.currentStreak,
      longestStreak: gam.longestStreak,
      lastActivityDate: gam.lastActivityDate,
    },
    now,
  );

  let totalXp = gam.totalXp + amount;

  let dailyGoalBonus = false;
  if (reason !== "DAILY_GOAL") {
    dailyGoalBonus = await checkDailyGoal(userId, now, amount);
    if (dailyGoalBonus) {
      totalXp += XP_DAILY_GOAL;
    }
  }

  await db.$transaction(
    [
      db.xpEvent.create({
        data: {
          userId,
          amount,
          reason,
          refType: opts.refType,
          refId: opts.refId,
          createdAt: now,
        },
      }),
      ...(dailyGoalBonus
        ? [
            db.xpEvent.create({
              data: {
                userId,
                amount: XP_DAILY_GOAL,
                reason: "DAILY_GOAL",
                createdAt: now,
              },
            }),
          ]
        : []),
      db.userGamification.upsert({
        where: { userId },
        update: {
          totalXp,
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastActivityDate: streak.lastActivityDate,
        },
        create: {
          userId,
          totalXp,
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastActivityDate: streak.lastActivityDate,
        },
      }),
    ],
    { maxWait: 60_000, timeout: 120_000 },
  );

  const awardedAchievements = await evaluateAchievements(userId);

  return {
    amount,
    reason,
    totalXp,
    level: 1 + Math.floor(totalXp / 100),
    streak: { current: streak.currentStreak, longest: streak.longestStreak },
    dailyGoalBonus,
    awardedAchievements,
  };
}

export async function getLearnerLevel(userId: string): Promise<number> {
  const gam = await db.userGamification.findUnique({ where: { userId } });
  return 1 + Math.floor((gam?.totalXp ?? 0) / 100);
}
