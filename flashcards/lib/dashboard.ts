import { db } from "@/lib/db";
import { getActiveEnrollment } from "@/lib/enrollments";
import { getPublishedCourse } from "@/lib/catalog";
import { getCompletedLessonIds } from "@/lib/sessions";
import { getGamificationSummary, type GamificationSummary } from "@/lib/gamification";
import { getLearnerStats } from "@/lib/stats";
import { DAILY_GOAL_XP } from "@/lib/xp";

export type DashboardSkill = {
  skill: string;
  passed: number;
  total: number;
};

export type DashboardActivity = {
  id: string;
  reason: string;
  amount: number;
  createdAt: Date;
};

export type DashboardNextLesson = {
  id: string;
  title: string;
  order: number;
  moduleTitle: string;
  moduleOrder: number;
};

export type DashboardAdditionalLanguage = {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  levelCode: string;
  lessonsCompleted: number;
  lessonsTotal: number;
  pct: number;
};

export type DashboardData =
  | { enrolled: false; hasEnrollments: boolean }
  | {
      enrolled: true;
      languageCode: string;
      languageName: string;
      nativeName: string;
      courseTitle: string;
      levelCode: string;
      lessonsCompleted: number;
      lessonsTotal: number;
      lessonPct: number;
      fourSkills: DashboardSkill[];
      wordsLearned: number;
      accuracy: number | null;
      dueNow: number;
      continueAction:
        | { kind: "review"; count: number }
        | { kind: "lesson"; lesson: DashboardNextLesson }
        | { kind: "complete" };
      gamification: GamificationSummary;
      dailyGoal: { today: number; target: number; complete: boolean };
      recentActivity: DashboardActivity[];
      additionalLanguages: DashboardAdditionalLanguage[];
    };

const SKILL_LABELS = ["WRITING", "READING", "LISTENING", "SPEAKING"];

async function getTodayXp(userId: string): Promise<number> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const res = await db.xpEvent.aggregate({
    _sum: { amount: true },
    where: { userId, createdAt: { gte: start } },
  });
  return res._sum.amount ?? 0;
}

async function getAdditionalLanguages(
  userId: string,
  activeLanguageId: string | null,
): Promise<DashboardAdditionalLanguage[]> {
  const enrollments = await db.userLanguage.findMany({
    where: { userId },
    include: {
      language: { select: { id: true, code: true, name: true, nativeName: true } },
      course: {
        include: {
          level: { select: { code: true } },
          modules: { include: { lessons: { select: { id: true } } } },
        },
      },
    },
  });

  const others = enrollments.filter(
    (e) => e.course && e.language.id !== activeLanguageId,
  );
  if (others.length === 0) return [];

  const lessonIds = others.flatMap((e) =>
    e.course!.modules.flatMap((m) => m.lessons.map((l) => l.id)),
  );
  const completed = lessonIds.length
    ? await db.userProgress.findMany({
        where: { userId, lessonId: { in: lessonIds }, status: "COMPLETED" },
        select: { lessonId: true },
      })
    : [];
  const completedSet = new Set(completed.map((c) => c.lessonId));

  return others.map((e) => {
    const lessons = e.course!.modules.flatMap((m) => m.lessons);
    const lessonsCompleted = lessons.filter((l) => completedSet.has(l.id)).length;
    const lessonsTotal = lessons.length;
    return {
      id: e.id,
      code: e.language.code,
      name: e.language.name,
      nativeName: e.language.nativeName,
      levelCode: e.course!.level.code,
      lessonsCompleted,
      lessonsTotal,
      pct: lessonsTotal === 0 ? 0 : Math.round((lessonsCompleted / lessonsTotal) * 100),
    };
  });
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const enrollment = await getActiveEnrollment(userId);

  if (!enrollment?.course) {
    const hasEnrollments =
      (await db.userLanguage.count({ where: { userId } })) > 0;
    return { enrolled: false, hasEnrollments };
  }

  const course = await getPublishedCourse(
    enrollment.language.code,
    enrollment.course.level.code,
  );
  if (!course) {
    return { enrolled: false, hasEnrollments: true };
  }

  const stats = await getLearnerStats(userId);
  if (!stats.enrolled) {
    return { enrolled: false, hasEnrollments: true };
  }

  const allLessons = course.modules.flatMap((module_) => module_.lessons);
  const completedIds = new Set(
    await getCompletedLessonIds(
      userId,
      allLessons.map((l) => l.id),
    ),
  );
  const lessonsCompleted = completedIds.size;
  const lessonsTotal = allLessons.length;

  const skillMap = new Map<string, { passed: number; total: number }>();
  for (const mod of stats.modules) {
    for (const s of mod.skills) {
      const current = skillMap.get(s.skill) ?? { passed: 0, total: 0 };
      current.passed += s.passed;
      current.total += s.total;
      skillMap.set(s.skill, current);
    }
  }
  const fourSkills: DashboardSkill[] = SKILL_LABELS.map((skill) => {
    const current = skillMap.get(skill) ?? { passed: 0, total: 0 };
    return { skill, passed: current.passed, total: current.total };
  }).filter((s) => s.total > 0);

  let nextLesson: DashboardNextLesson | null = null;
  for (const module_ of course.modules) {
    if (nextLesson) break;
    for (const lesson of module_.lessons) {
      if (!completedIds.has(lesson.id)) {
        nextLesson = {
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          moduleTitle: module_.title,
          moduleOrder: module_.order,
        };
        break;
      }
    }
  }

  const continueAction =
    stats.dueNow > 0
      ? ({ kind: "review", count: stats.dueNow } as const)
      : nextLesson
        ? ({ kind: "lesson", lesson: nextLesson } as const)
        : ({ kind: "complete" } as const);

  const [gamification, today, recent, additionalLanguages] = await Promise.all([
    getGamificationSummary(userId),
    getTodayXp(userId),
    db.xpEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, reason: true, amount: true, createdAt: true },
    }),
    getAdditionalLanguages(userId, enrollment.language.id),
  ]);

  return {
    enrolled: true,
    languageCode: enrollment.language.code,
    languageName: enrollment.language.name,
    nativeName: enrollment.language.nativeName,
    courseTitle: enrollment.course.title,
    levelCode: enrollment.course.level.code,
    lessonsCompleted,
    lessonsTotal,
    lessonPct:
      lessonsTotal === 0 ? 0 : Math.round((lessonsCompleted / lessonsTotal) * 100),
    fourSkills,
    wordsLearned: stats.cardsTouched,
    accuracy: stats.ratingAccuracy,
    dueNow: stats.dueNow,
    continueAction,
    gamification,
    dailyGoal: {
      today,
      target: DAILY_GOAL_XP,
      complete: today >= DAILY_GOAL_XP,
    },
    recentActivity: recent.map((r) => ({
      id: r.id,
      reason: r.reason,
      amount: r.amount,
      createdAt: r.createdAt,
    })),
    additionalLanguages,
  };
}