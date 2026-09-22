import { db } from "@/lib/db";

const SESSION_SIZE = 15;
const NEW_PER_DAY = 5;

export type ReviewCard = {
  id: string;
  targetText: string;
  translation: string;
  pronunciation: string | null;
  exampleSentence: string | null;
  exampleTranslation: string | null;
  partOfSpeech: string | null;
  audioUrl: string | null;
  state: string;
  progressId: string | null;
  languageCode: string;
  languageName: string;
  levelCode: string | null;
};

type FlashcardRow = {
  id: string;
  targetText: string;
  translation: string;
  pronunciation: string | null;
  exampleSentence: string | null;
  exampleTranslation: string | null;
  partOfSpeech: string | null;
  audioUrl: string | null;
  progress?: { id: string; state: string; dueAt: Date | null; reviewCount: number; lastReviewedAt: Date | null }[];
};

export async function getReviewQueue(
  userId: string,
): Promise<ReviewCard[]> {
  const enrollment = await db.userLanguage.findFirst({
    where: { userId, isActive: true },
    include: {
      language: {
        select: {
          id: true,
          code: true,
          name: true,
          courses: {
            select: {
              id: true,
              level: { select: { code: true } },
              modules: {
                select: {
                  lessons: {
                    select: { id: true },
                  },
                },
              },
            },
            where: { status: "PUBLISHED" },
            orderBy: { id: "asc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!enrollment?.language.courses[0]) {
    return [];
  }

  const course = enrollment.language.courses[0];
  const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));

  if (lessonIds.length === 0) {
    return [];
  }

  const completed = await db.userProgress.findMany({
    where: { userId, lessonId: { in: lessonIds }, status: "COMPLETED" },
    select: { lessonId: true },
  });
  const completedIds = new Set(completed.map((p) => p.lessonId));

  if (completedIds.size === 0) {
    return [];
  }

  const languageName = enrollment.language.name;
  const levelCode = course.level?.code ?? null;

  const toReviewCard = (
    card: FlashcardRow,
    state: string,
    progressId: string | null,
  ): ReviewCard => ({
    id: card.id,
    targetText: card.targetText,
    translation: card.translation,
    pronunciation: card.pronunciation,
    exampleSentence: card.exampleSentence,
    exampleTranslation: card.exampleTranslation,
    partOfSpeech: card.partOfSpeech,
    audioUrl: card.audioUrl,
    state,
    progressId,
    languageCode: enrollment!.language.code,
    languageName,
    levelCode,
  });

  const cards = await db.flashcard.findMany({
    where: {
      lessonId: { in: [...completedIds] },
      status: "PUBLISHED",
    },
    select: {
      id: true,
      targetText: true,
      translation: true,
      pronunciation: true,
      exampleSentence: true,
      exampleTranslation: true,
      partOfSpeech: true,
      audioUrl: true,
      progress: {
        where: { userId },
        select: {
          id: true,
          state: true,
          dueAt: true,
          reviewCount: true,
          lastReviewedAt: true,
        },
      },
    },
  });

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const due: ReviewCard[] = [];
  const newCards: ReviewCard[] = [];

  for (const card of cards) {
    const progress = card.progress[0] ?? null;

    if (!progress || progress.state === "NEW") {
      newCards.push(toReviewCard(card, "NEW", progress?.id ?? null));
      continue;
    }

    if (progress.dueAt && progress.dueAt <= now) {
      due.push(toReviewCard(card, progress.state, progress.id));
    }
  }

  due.sort((a, b) => {
    if (a.state === "LEARNING" && b.state !== "LEARNING") return -1;
    if (b.state === "LEARNING" && a.state !== "LEARNING") return 1;
    return 0;
  });

  let todayNewCount = 0;
  for (const card of cards) {
    if (card.progress[0]) {
      const p = card.progress[0];
      if (p.lastReviewedAt && p.lastReviewedAt >= todayStart && p.reviewCount <= 1) {
        todayNewCount++;
      }
    }
  }

  const newBudget = Math.max(0, NEW_PER_DAY - todayNewCount);
  const selectedNew = newCards.slice(0, newBudget);

  const queue = [...due, ...selectedNew].slice(0, SESSION_SIZE);

  return queue;
}