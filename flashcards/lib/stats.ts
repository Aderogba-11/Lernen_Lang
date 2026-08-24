import { db } from "@/lib/db";
import { RATINGS } from "@/lib/ratings";

export type ActivityDay = { date: string; count: number };

export type SkillSummary = {
  skill: string;
  passed: number;
  total: number;
};

export type ModuleStat = {
  id: string;
  title: string;
  order: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  skills: SkillSummary[];
};

export type RecentAttempt = {
  id: string;
  skill: string;
  lessonTitle: string;
  correct: number | null;
  total: number | null;
  passed: boolean;
  createdAt: Date;
};

export type LearnerStats =
  | { enrolled: false }
  | {
      enrolled: true;
      languageName: string;
      courseTitle: string;
      lessonsCompleted: number;
      lessonsTotal: number;
      cardsTouched: number;
      ratingAccuracy: number | null;
      attemptsTotal: number;
      activity: ActivityDay[];
      modules: ModuleStat[];
      recent: RecentAttempt[];
    };

const SKILLS = ["WRITING", "READING", "LISTENING", "SPEAKING"];

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function getLearnerStats(userId: string): Promise<LearnerStats> {
  const enrollment = await db.userLanguage.findFirst({
    where: { userId, isActive: true },
    include: {
      language: { select: { name: true } },
      course: { select: { id: true, title: true } },
    },
  });

  if (!enrollment?.course) {
    return { enrolled: false };
  }

  const modules = await db.module.findMany({
    where: { courseId: enrollment.course.id },
    orderBy: { order: "asc" },
    include: { lessons: { select: { id: true } } },
  });

  const lessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));

  const cards = await db.flashcard.findMany({
    where: { lessonId: { in: lessonIds }, status: "PUBLISHED" },
    select: { id: true },
  });
  const cardIds = cards.map((c) => c.id);

  const [
    completedLessons,
    exercises,
    progressRows,
    ratingGroups,
    attemptsTotal,
    attemptDates,
    recent,
  ] = await Promise.all([
    db.userProgress.findMany({
      where: { userId, lessonId: { in: lessonIds }, status: "COMPLETED" },
      select: { lessonId: true },
    }),
    db.exercise.findMany({
      where: { lessonId: { in: lessonIds }, status: "PUBLISHED" },
      select: { id: true, type: true, lessonId: true },
    }),
    db.exerciseProgress.findMany({
      where: { userId, lessonId: { in: lessonIds } },
    }),
    db.flashcardProgress.groupBy({
      by: ["lastRating"],
      where: { userId, flashcardId: { in: cardIds } },
      _count: { _all: true },
    }),
    db.exerciseAttempt.count({
      where: { userId, lessonId: { in: lessonIds } },
    }),
    db.exerciseAttempt.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000) },
      },
      select: { createdAt: true },
    }),
    db.exerciseAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        correct: true,
        total: true,
        passed: true,
        createdAt: true,
        exercise: { select: { type: true } },
        lesson: { select: { title: true } },
      },
    }),
  ]);

  const completedLessonIds = new Set(completedLessons.map((l) => l.lessonId));
  const progressByExercise = new Map(progressRows.map((p) => [p.exerciseId, p]));

  const activityMap = new Map<string, number>();
  const today = new Date();
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    activityMap.set(dayKey(d), 0);
  }
  for (const row of attemptDates) {
    const key = dayKey(row.createdAt);
    if (activityMap.has(key)) {
      activityMap.set(key, (activityMap.get(key) ?? 0) + 1);
    }
  }

  const ratingCountMap = new Map(
    ratingGroups.map((g) => [g.lastRating ?? "", g._count._all]),
  );
  let rated = 0;
  let good = 0;
  for (const rating of RATINGS) {
    const count = ratingCountMap.get(rating) ?? 0;
    rated += count;
    if (rating === "GOOD" || rating === "EASY") {
      good += count;
    }
  }

  const moduleStats: ModuleStat[] = modules.map((m) => ({
    id: m.id,
    title: m.title,
    order: m.order,
    lessonsCompleted: m.lessons.filter((l) =>
      completedLessonIds.has(l.id),
    ).length,
    lessonsTotal: m.lessons.length,
    skills: SKILLS.map((skill) => {
      const courseExercises = exercises.filter(
        (e) =>
          e.type === skill &&
          m.lessons.some((l) => l.id === e.lessonId),
      );
      const passed = courseExercises.filter((e) => {
        const p = progressByExercise.get(e.id);
        return p?.completed === true;
      }).length;
      return { skill, passed, total: courseExercises.length };
    }).filter((s) => s.total > 0),
  }));

  return {
    enrolled: true,
    languageName: enrollment.language.name,
    courseTitle: enrollment.course.title,
    lessonsCompleted: completedLessonIds.size,
    lessonsTotal: lessonIds.length,
    cardsTouched: rated,
    ratingAccuracy: rated > 0 ? Math.round((good / rated) * 100) : null,
    attemptsTotal,
    activity: [...activityMap.entries()].map(([date, count]) => ({
      date,
      count,
    })),
    modules: moduleStats,
    recent: recent.map((r) => ({
      id: r.id,
      skill: r.exercise.type,
      lessonTitle: r.lesson.title,
      correct: r.correct,
      total: r.total,
      passed: r.passed,
      createdAt: r.createdAt,
    })),
  };
}
