import { db } from "@/lib/db";
import { addDays } from "@/lib/streak";

export const NOTIFICATION_ACHIEVEMENT = "ACHIEVEMENT";
export const NOTIFICATION_COURSE_COMPLETE = "COURSE_COMPLETE";
export const NOTIFICATION_DAILY_REMINDER = "DAILY_REMINDER";
export const NOTIFICATION_STREAK_AT_RISK = "STREAK_AT_RISK";

export type NotificationType =
  | "ACHIEVEMENT"
  | "COURSE_COMPLETE"
  | "DAILY_REMINDER"
  | "STREAK_AT_RISK";

export type NotificationRow = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  createdAt: Date;
  readAt: Date | null;
};

function startOfUtcDay(now: Date): Date {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export function createNotification(
  userId: string,
  input: { type: NotificationType; title: string; body?: string; link?: string },
) {
  return db.notification.create({
    data: {
      userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
    },
  });
}

export async function getNotifications(userId: string): Promise<
  (NotificationRow & { unread: boolean })[]
> {
  const rows = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((n) => ({ ...n, unread: n.readAt === null }));
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return db.notification.count({
    where: { userId, readAt: null },
  });
}

export async function markNotificationsRead(
  userId: string,
  ids?: string[],
): Promise<number> {
  const now = new Date();
  const res = await db.notification.updateMany({
    where: {
      userId,
      readAt: null,
      ...(ids && ids.length > 0 ? { id: { in: ids } } : {}),
    },
    data: { readAt: now },
  });
  return res.count;
}

/**
 * Synthesises the opening nudges (daily reminder + streak-at-risk) that have no
 * push/cron channel on serverless. Fired once per app open; de-duplicated so at
 * most one row of each type is created per UTC day.
 *
 * - Daily reminder: learner has studied before, but has 0 XP today.
 * - Streak at risk: an active streak exists, but no XP has been earned today yet.
 */
export async function syncActionNotifications(userId: string): Promise<{
  created: NotificationType[];
}> {
  const now = new Date();
  const start = startOfUtcDay(now);
  const end = addDays(start, 1);

  const [sum, prior, gam, existing] = await Promise.all([
    db.xpEvent.aggregate({
      _sum: { amount: true },
      where: { userId, createdAt: { gte: start, lt: end } },
    }),
    db.xpEvent.findFirst({
      where: { userId, createdAt: { lt: start } },
      select: { id: true },
    }),
    db.userGamification.findUnique({
      where: { userId },
      select: { currentStreak: true },
    }),
    db.notification.findMany({
      where: {
        userId,
        type: { in: [NOTIFICATION_DAILY_REMINDER, NOTIFICATION_STREAK_AT_RISK] },
        createdAt: { gte: start },
      },
      select: { type: true },
    }),
  ]);

  const todayXp = sum._sum.amount ?? 0;
  const seen = new Set(existing.map((n) => n.type));
  const created: NotificationType[] = [];

  if (todayXp === 0) {
    if (prior && !seen.has(NOTIFICATION_DAILY_REMINDER)) {
      await createNotification(userId, {
        type: "DAILY_REMINDER",
        title: "Daily goal reminder",
        body: "You haven't earned today's 50 XP yet — keep your habit alive.",
        link: "/dashboard",
      });
      created.push(NOTIFICATION_DAILY_REMINDER);
    }

    if (gam && gam.currentStreak >= 1 && !seen.has(NOTIFICATION_STREAK_AT_RISK)) {
      await createNotification(userId, {
        type: "STREAK_AT_RISK",
        title: "Streak at risk",
        body: `Study today to keep your ${gam.currentStreak}-day streak going.`,
        link: "/dashboard",
      });
      created.push(NOTIFICATION_STREAK_AT_RISK);
    }
  }

  return { created };
}