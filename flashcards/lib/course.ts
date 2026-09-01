import { db } from "@/lib/db";
import { getActiveEnrollment } from "@/lib/enrollments";
import { getPublishedCourse } from "@/lib/catalog";

export type LessonStatus = "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED";

export type CourseLessonNav = {
  id: string;
  title: string;
  objective: string | null;
  order: number;
  status: LessonStatus;
};

export type CourseModuleNav = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  completed: number;
  total: number;
  lessons: CourseLessonNav[];
};

export type CourseNavigation =
  | { enrolled: false }
  | {
      enrolled: true;
      languageName: string;
      nativeName: string;
      courseTitle: string;
      description: string | null;
      levelCode: string;
      lessonsCompleted: number;
      lessonsTotal: number;
      modules: CourseModuleNav[];
      nextLessonId: string | null;
    };

export async function getCourseNavigation(
  userId: string,
): Promise<CourseNavigation> {
  const enrollment = await getActiveEnrollment(userId);
  if (!enrollment?.course) {
    return { enrolled: false };
  }

  const course = await getPublishedCourse(
    enrollment.language.code,
    enrollment.course.level.code,
  );
  if (!course) {
    return { enrolled: false };
  }

  const lessons = course.modules.flatMap((m) => m.lessons);
  const lessonIds = lessons.map((l) => l.id);

  const flashcards = await db.flashcard.findMany({
    where: { lessonId: { in: lessonIds } },
    select: { id: true, lessonId: true },
  });
  const cardToLesson = new Map(flashcards.map((c) => [c.id, c.lessonId]));

  const [completedRows, exerciseAttempts, exerciseProgress, ratedCards] =
    await Promise.all([
      db.userProgress.findMany({
        where: { userId, lessonId: { in: lessonIds }, status: "COMPLETED" },
        select: { lessonId: true },
      }),
      db.exerciseAttempt.findMany({
        where: { userId, lessonId: { in: lessonIds } },
        select: { lessonId: true },
      }),
      db.exerciseProgress.findMany({
        where: { userId, lessonId: { in: lessonIds }, attemptCount: { gt: 0 } },
        select: { lessonId: true },
      }),
      db.flashcardProgress.findMany({
        where: {
          userId,
          lastReviewedAt: { not: null },
          flashcardId: { in: [...cardToLesson.keys()] },
        },
        select: { flashcardId: true },
      }),
    ]);

  const completed = new Set(completedRows.map((r) => r.lessonId));
  const activity = new Set([
    ...exerciseAttempts.map((a) => a.lessonId),
    ...exerciseProgress.map((p) => p.lessonId),
    ...ratedCards.map((c) => cardToLesson.get(c.flashcardId)).filter((id): id is string => Boolean(id)),
  ]);

  const modules: CourseModuleNav[] = course.modules.map((module_, i) => {
    const previousComplete =
      i === 0 ||
      course.modules[i - 1]!.lessons.every((l) => completed.has(l.id));

    let seenIncomplete = false;
    const navLessons: CourseLessonNav[] = module_.lessons.map((l) => {
      let status: LessonStatus;
      if (completed.has(l.id)) {
        status = "COMPLETED";
      } else if (!previousComplete || seenIncomplete) {
        status = "LOCKED";
      } else {
        seenIncomplete = true;
        status = activity.has(l.id) ? "IN_PROGRESS" : "AVAILABLE";
      }
      return {
        id: l.id,
        title: l.title,
        objective: l.objective,
        order: l.order,
        status,
      };
    });

    return {
      id: module_.id,
      title: module_.title,
      description: module_.description,
      order: module_.order,
      completed: navLessons.filter((l) => l.status === "COMPLETED").length,
      total: navLessons.length,
      lessons: navLessons,
    };
  });

  let nextLessonId: string | null = null;
  for (const module_ of modules) {
    for (const lesson of module_.lessons) {
      if (lesson.status === "AVAILABLE" || lesson.status === "IN_PROGRESS") {
        nextLessonId = lesson.id;
        break;
      }
    }
    if (nextLessonId) break;
  }

  const lessonsCompleted = completed.size;
  return {
    enrolled: true,
    languageName: course.language.name,
    nativeName: course.language.nativeName,
    courseTitle: course.title,
    description: course.description,
    levelCode: course.level.code,
    lessonsCompleted,
    lessonsTotal: lessonIds.length,
    modules,
    nextLessonId,
  };
}

export async function isLessonUnlocked(
  userId: string,
  lessonId: string,
): Promise<boolean> {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, module: { select: { id: true, courseId: true } } },
  });
  if (!lesson) return false;

  const enrollment = await db.userLanguage.findFirst({
    where: { userId, courseId: lesson.module.courseId },
    select: { id: true },
  });
  if (!enrollment) return false;

  const modules = await db.module.findMany({
    where: { courseId: lesson.module.courseId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      order: true,
      lessons: {
        where: { status: "PUBLISHED" },
        orderBy: { order: "asc" },
        select: { id: true },
      },
    },
  });

  const allLessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
  const completedRows = await db.userProgress.findMany({
    where: { userId, lessonId: { in: allLessonIds }, status: "COMPLETED" },
    select: { lessonId: true },
  });
  const completed = new Set(completedRows.map((r) => r.lessonId));

  const moduleIndex = modules.findIndex((m) => m.id === lesson.module.id);
  if (moduleIndex < 0) return false;

  if (moduleIndex > 0) {
    const previousModule = modules[moduleIndex - 1]!;
    const previousComplete = previousModule.lessons.every((l) =>
      completed.has(l.id),
    );
    if (!previousComplete) return false;
  }

  const moduleLessons = modules[moduleIndex]!.lessons;
  const lessonIndex = moduleLessons.findIndex((l) => l.id === lessonId);
  if (lessonIndex < 0) return false;

  for (let i = 0; i < lessonIndex; i += 1) {
    if (!completed.has(moduleLessons[i]!.id)) return false;
  }

  return true;
}