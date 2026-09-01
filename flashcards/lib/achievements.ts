import { db } from "@/lib/db";

export type AchievementCriteria = {
  type: string;
  value?: number;
  skill?: string;
};

export type AchievementRegistration = {
  code: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  criteria: AchievementCriteria[];
};

const REGISTRY: AchievementRegistration[] = [
  {
    code: "FIRST_LESSON",
    title: "First Lesson",
    description: "Complete your first lesson.",
    icon: "🎓",
    order: 1,
    criteria: [{ type: "LESSONS_COMPLETED", value: 1 }],
  },
  {
    code: "FIRST_100_CARDS",
    title: "Centurion",
    description: "Review 100 flashcards.",
    icon: "🃏",
    order: 2,
    criteria: [{ type: "CARDS_REVIEWED", value: 100 }],
  },
  {
    code: "XP_500",
    title: "500 XP",
    description: "Earn 500 total XP.",
    icon: "⚡",
    order: 3,
    criteria: [{ type: "TOTAL_XP", value: 500 }],
  },
  {
    code: "XP_1000",
    title: "1000 XP",
    description: "Earn 1000 total XP.",
    icon: "💯",
    order: 4,
    criteria: [{ type: "TOTAL_XP", value: 1000 }],
  },
  {
    code: "STREAK_7",
    title: "7-Day Streak",
    description: "Study seven days in a row.",
    icon: "🔥",
    order: 5,
    criteria: [{ type: "LONGEST_STREAK", value: 7 }],
  },
  {
    code: "STREAK_30",
    title: "30-Day Streak",
    description: "Study thirty days in a row.",
    icon: "🌋",
    order: 6,
    criteria: [{ type: "LONGEST_STREAK", value: 30 }],
  },
  {
    code: "FIRST_LISTENING",
    title: "Ear for Spanish",
    description: "Pass your first listening exercise.",
    icon: "🎧",
    order: 7,
    criteria: [{ type: "SKILL_PASSED", skill: "LISTENING" }],
  },
  {
    code: "FIRST_SPEAKING",
    title: "On the Record",
    description: "Pass your first speaking exercise.",
    icon: "🎤",
    order: 8,
    criteria: [{ type: "SKILL_PASSED", skill: "SPEAKING" }],
  },
  {
    code: "A1_COMPLETE",
    title: "Spanish A1 Complete",
    description: "Finish the entire Spanish A1 course.",
    icon: "🏆",
    order: 9,
    criteria: [{ type: "COURSE_COMPLETE", value: 1 }],
  },
];

export async function ensureAchievementDefs(): Promise<void> {
  const count = await db.achievementDef.count();
  if (count >= REGISTRY.length) return;
  await db.$transaction(
    REGISTRY.map((reg) =>
      db.achievementDef.upsert({
        where: { code: reg.code },
        update: {
          title: reg.title,
          description: reg.description,
          icon: reg.icon,
          criteria: reg.criteria,
          order: reg.order,
        },
        create: {
          code: reg.code,
          title: reg.title,
          description: reg.description,
          icon: reg.icon,
          criteria: reg.criteria,
          order: reg.order,
        },
      }),
    ),
    { maxWait: 60_000, timeout: 120_000 },
  );
}

type Snapshot = {
  totalXp: number;
  longestStreak: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  cardsReviewed: number;
  skillPassed: Set<string>;
};

async function loadSnapshot(userId: string): Promise<Snapshot> {
  const gam = await db.userGamification.findUnique({ where: { userId } });

  const course = await db.course.findFirst({
    where: { status: "PUBLISHED" },
    include: {
      modules: {
        include: { lessons: { select: { id: true } } },
      },
    },
  });
  const lessonIds = course?.modules.flatMap((m) => m.lessons.map((l) => l.id)) ?? [];

  const [completed, cardProgress, exercises] = await Promise.all([
    lessonIds.length > 0
      ? db.userProgress.count({
          where: { userId, lessonId: { in: lessonIds }, status: "COMPLETED" },
        })
      : Promise.resolve(0),
    db.flashcardProgress.count({
      where: { userId, reviewCount: { gte: 1 } },
    }),
    db.exercise.findMany({
      where: lessonIds.length > 0 ? { lessonId: { in: lessonIds } } : {},
      select: { id: true, type: true },
    }),
  ]);

  const exerciseIds = exercises.map((e) => e.id);
  const passedExerciseIds = new Set(
    exerciseIds.length > 0
      ? (
          await db.exerciseProgress.findMany({
            where: { userId, exerciseId: { in: exerciseIds }, completed: true },
            select: { exerciseId: true },
          })
        ).map((p) => p.exerciseId)
      : [],
  );

  const skillPassed = new Set<string>();
  for (const ex of exercises) {
    if (passedExerciseIds.has(ex.id)) {
      skillPassed.add(ex.type);
    }
  }

  return {
    totalXp: gam?.totalXp ?? 0,
    longestStreak: gam?.longestStreak ?? 0,
    lessonsCompleted: completed,
    lessonsTotal: lessonIds.length,
    cardsReviewed: cardProgress,
    skillPassed,
  };
}

function qualifies(snap: Snapshot, criteria: AchievementCriteria[]): boolean {
  return criteria.every((c) => {
    switch (c.type) {
      case "LESSONS_COMPLETED":
        return snap.lessonsCompleted >= (c.value ?? 1);
      case "CARDS_REVIEWED":
        return snap.cardsReviewed >= (c.value ?? 1);
      case "TOTAL_XP":
        return snap.totalXp >= (c.value ?? 1);
      case "LONGEST_STREAK":
        return snap.longestStreak >= (c.value ?? 1);
      case "SKILL_PASSED":
        return snap.skillPassed.has(c.skill ?? "");
      case "COURSE_COMPLETE":
        return snap.lessonsTotal > 0 && snap.lessonsCompleted >= snap.lessonsTotal;
      default:
        return true;
    }
  });
}

export async function evaluateAchievements(
  userId: string,
): Promise<string[]> {
  await ensureAchievementDefs();
  const defs = await db.achievementDef.findMany({ orderBy: { order: "asc" } });

  const owned = new Set(
    (
      await db.userAchievement.findMany({
        where: { userId },
        select: { defId: true },
      })
    ).map((a) => a.defId),
  );

  if (owned.size >= defs.length) return [];

  const snap = await loadSnapshot(userId);

  const newlyAwarded: string[] = [];
  for (const def of defs) {
    if (owned.has(def.id)) continue;
    const criteria = def.criteria as AchievementCriteria[];
    if (qualifies(snap, criteria)) {
      await db.userAchievement.create({
        data: { userId, defId: def.id },
      });
      newlyAwarded.push(def.code);
    }
  }

  return newlyAwarded;
}
