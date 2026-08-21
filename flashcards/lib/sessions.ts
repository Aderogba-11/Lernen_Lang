import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/enrollments";

export const RATINGS = ["AGAIN", "HARD", "GOOD", "EASY"] as const;
export type Rating = (typeof RATINGS)[number];

export function isRating(value: unknown): value is Rating {
  return typeof value === "string" && (RATINGS as readonly string[]).includes(value);
}

export type SessionCard = {
  id: string;
  targetText: string;
  translation: string;
  pronunciation: string | null;
  exampleSentence: string | null;
  exampleTranslation: string | null;
  partOfSpeech: string | null;
  audioUrl: string | null;
};

export type LessonSession = {
  lessonId: string;
  lessonTitle: string;
  objective: string | null;
  notes: string | null;
  moduleTitle: string;
  moduleOrder: number;
  lessonOrder: number;
  courseTitle: string;
  languageCode: string;
  cards: SessionCard[];
  completed: boolean;
};

type AccessibleLesson = {
  id: string;
  title: string;
  objective: string | null;
  notes: string | null;
  order: number;
  moduleId: string;
  module: {
    title: string;
    order: number;
    course: {
      id: string;
      title: string;
      status: string;
      languageId: string;
      language: {
        code: string;
        name: string;
      };
    };
  };
};

async function loadAccessibleLesson(
  userId: string,
  lessonId: string,
): Promise<AccessibleLesson | { error: string }> {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: {
            include: { language: true },
          },
        },
      },
    },
  });

  if (!lesson || lesson.status !== "PUBLISHED") {
    return { error: "Lesson not found." };
  }
  if (lesson.module.course.status !== "PUBLISHED") {
    return { error: "The course for this lesson is not available." };
  }

  const enrollment = await db.userLanguage.findFirst({
    where: {
      userId,
      languageId: lesson.module.course.languageId,
    },
  });
  if (!enrollment) {
    return { error: "You are not enrolled in this language." };
  }

  return lesson;
}

export async function getSessionContent(
  userId: string,
  lessonId: string,
): Promise<LessonSession | { error: string }> {
  const lesson = await loadAccessibleLesson(userId, lessonId);
  if ("error" in lesson) {
    return lesson;
  }

  const [cards, progress] = await Promise.all([
    db.flashcard.findMany({
      where: { lessonId: lesson.id, status: "PUBLISHED" },
      orderBy: { order: "asc" },
      select: {
        id: true,
        targetText: true,
        translation: true,
        pronunciation: true,
        exampleSentence: true,
        exampleTranslation: true,
        partOfSpeech: true,
        audioUrl: true,
      },
    }),
    db.userProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId: lesson.id } },
      select: { status: true },
    }),
  ]);

  return {
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    objective: lesson.objective,
    notes: lesson.notes,
    moduleTitle: lesson.module.title,
    moduleOrder: lesson.module.order,
    lessonOrder: lesson.order,
    courseTitle: lesson.module.course.title,
    languageCode: lesson.module.course.language.code,
    cards,
    completed: progress?.status === "COMPLETED",
  };
}

export async function rateFlashcard(
  userId: string,
  flashcardId: string,
  rating: Rating,
): Promise<ActionResult> {
  if (!isRating(rating)) {
    return { ok: false, error: "Invalid rating." };
  }

  const flashcard = await db.flashcard.findUnique({
    where: { id: flashcardId },
    include: { lesson: { include: { module: { include: { course: true } } } } },
  });
  if (
    !flashcard ||
    flashcard.status !== "PUBLISHED" ||
    flashcard.lesson.status !== "PUBLISHED" ||
    flashcard.lesson.module.course.status !== "PUBLISHED"
  ) {
    return { ok: false, error: "Flashcard not found." };
  }

  const enrollment = await db.userLanguage.findFirst({
    where: {
      userId,
      languageId: flashcard.lesson.module.course.languageId,
    },
  });
  if (!enrollment) {
    return { ok: false, error: "You are not enrolled in this language." };
  }

  await db.flashcardProgress.upsert({
    where: { userId_flashcardId: { userId, flashcardId } },
    update: {
      lastRating: rating,
      reviewCount: { increment: 1 },
      lastReviewedAt: new Date(),
    },
    create: {
      userId,
      flashcardId,
      lastRating: rating,
      reviewCount: 1,
      lastReviewedAt: new Date(),
    },
  });

  return { ok: true };
}

export async function completeLesson(userId: string, lessonId: string): Promise<ActionResult> {
  const lesson = await loadAccessibleLesson(userId, lessonId);
  if ("error" in lesson) {
    return { ok: false, error: lesson.error };
  }

  const now = new Date();
  await db.userProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { status: "COMPLETED", completedAt: now },
    create: { userId, lessonId, status: "COMPLETED", completedAt: now },
  });

  return { ok: true };
}

export async function getCompletedLessonIds(userId: string, lessonIds: string[]) {
  if (lessonIds.length === 0) return [];
  const rows = await db.userProgress.findMany({
    where: { userId, lessonId: { in: lessonIds }, status: "COMPLETED" },
    select: { lessonId: true },
  });
  return rows.map((r) => r.lessonId);
}
