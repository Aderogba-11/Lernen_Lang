import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/enrollments";
import { isRating, RATINGS, type Rating } from "@/lib/ratings";
import {
  scoreMcq,
  scoreWriting,
  type ReadingQuestion,
  type ReadingScore,
} from "@/lib/scoring";

export { isRating, RATINGS };
export type { Rating };

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

export type SessionReading = {
  id: string;
  prompt: string;
  passage: string;
  questions: { prompt: string; options: string[] }[];
};

export type SessionListening = {
  id: string;
  prompt: string;
  audioUrl: string;
  questions: { prompt: string; options: string[] }[];
};

export type SessionWriting = {
  id: string;
  prompt: string;
  kind: string;
  display: string;
};

export type SessionSpeaking = {
  id: string;
  prompt: string;
  targetText: string;
  audioUrl: string;
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
  writings: SessionWriting[];
  reading: SessionReading | null;
  listening: SessionListening | null;
  speaking: SessionSpeaking | null;
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

  const [cards, writings, readings, listenings, speakings, progress] = await Promise.all([
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
    db.exercise.findMany({
      where: { lessonId: lesson.id, status: "PUBLISHED", type: "WRITING" },
      orderBy: { order: "asc" },
    }),
    db.exercise.findMany({
      where: { lessonId: lesson.id, status: "PUBLISHED", type: "READING" },
      orderBy: { order: "asc" },
    }),
    db.exercise.findMany({
      where: { lessonId: lesson.id, status: "PUBLISHED", type: "LISTENING" },
      orderBy: { order: "asc" },
    }),
    db.exercise.findMany({
      where: { lessonId: lesson.id, status: "PUBLISHED", type: "SPEAKING" },
      orderBy: { order: "asc" },
    }),
    db.userProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId: lesson.id } },
      select: { status: true },
    }),
  ]);

  let reading: SessionReading | null = null;
  const readingExercise = readings[0];
  if (readingExercise) {
    const content = readingExercise.content as {
      kind?: string;
      passage?: string;
      questions?: ReadingQuestion[];
    };
    if (
      content?.kind === "reading" &&
      typeof content.passage === "string" &&
      Array.isArray(content.questions)
    ) {
      reading = {
        id: readingExercise.id,
        prompt: readingExercise.prompt,
        passage: content.passage,
        questions: content.questions.map((q) => ({
          prompt: q.prompt,
          options: q.options,
        })),
      };
    }
  }

  let listening: SessionListening | null = null;
  const listeningExercise = listenings[0];
  if (listeningExercise) {
    const content = listeningExercise.content as {
      kind?: string;
      audioUrl?: string;
      questions?: ReadingQuestion[];
    };
    if (
      content?.kind === "listening" &&
      typeof content.audioUrl === "string" &&
      Array.isArray(content.questions)
    ) {
      listening = {
        id: listeningExercise.id,
        prompt: listeningExercise.prompt,
        audioUrl: content.audioUrl,
        questions: content.questions.map((q) => ({
          prompt: q.prompt,
          options: q.options,
        })),
      };
    }
  }

  const writingsClient: SessionWriting[] = [];
  for (const exercise of writings) {
    const content = exercise.content as {
      kind?: string;
      source?: string;
      sentence?: string;
      hint?: string;
      words?: string[];
    };
    let display: string | null = null;
    if (content?.kind === "translation" && typeof content.source === "string") {
      display = content.source;
    } else if (
      content?.kind === "fill-blank" &&
      typeof content.sentence === "string"
    ) {
      display = `${content.sentence} (${content.hint ?? ""})`;
    } else if (
      content?.kind === "word-order" &&
      Array.isArray(content.words)
    ) {
      display = content.words.join(" / ");
    }
    if (display && content.kind) {
      writingsClient.push({
        id: exercise.id,
        prompt: exercise.prompt,
        kind: content.kind,
        display,
      });
    }
  }

  let speaking: SessionSpeaking | null = null;
  const speakingExercise = speakings[0];
  if (speakingExercise) {
    const content = speakingExercise.content as {
      kind?: string;
      targetText?: string;
      audioUrl?: string;
    };
    if (
      content?.kind === "speaking" &&
      typeof content.targetText === "string" &&
      typeof content.audioUrl === "string"
    ) {
      speaking = {
        id: speakingExercise.id,
        prompt: speakingExercise.prompt,
        targetText: content.targetText,
        audioUrl: content.audioUrl,
      };
    }
  }

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
    writings: writingsClient,
    reading,
    listening,
    speaking,
    completed: progress?.status === "COMPLETED",
  };
}

export async function scoreLessonReading(
  userId: string,
  lessonId: string,
  exerciseId: string,
  selections: number[],
): Promise<(ReadingScore & { ok: true }) | { ok: false; error: string }> {
  const lesson = await loadAccessibleLesson(userId, lessonId);
  if ("error" in lesson) {
    return { ok: false, error: lesson.error };
  }

  const exercise = await db.exercise.findUnique({ where: { id: exerciseId } });
  if (
    !exercise ||
    exercise.lessonId !== lesson.id ||
    exercise.status !== "PUBLISHED" ||
    exercise.type !== "READING"
  ) {
    return { ok: false, error: "Reading exercise not found." };
  }

  const content = exercise.content as {
    kind?: string;
    questions?: ReadingQuestion[];
  };
  if (content?.kind !== "reading" || !Array.isArray(content.questions)) {
    return { ok: false, error: "Malformed reading content." };
  }

  const scored = scoreMcq(content.questions, selections);
  if ("error" in scored) {
    return { ok: false, error: scored.error };
  }

  return { ok: true, ...scored };
}

export async function scoreLessonWriting(
  userId: string,
  lessonId: string,
  exerciseId: string,
  response: string,
): Promise<
  | { ok: true; correct: boolean; expected: string }
  | { ok: false; error: string }
> {
  const lesson = await loadAccessibleLesson(userId, lessonId);
  if ("error" in lesson) {
    return { ok: false, error: lesson.error };
  }

  const exercise = await db.exercise.findUnique({ where: { id: exerciseId } });
  if (
    !exercise ||
    exercise.lessonId !== lesson.id ||
    exercise.status !== "PUBLISHED" ||
    exercise.type !== "WRITING"
  ) {
    return { ok: false, error: "Writing exercise not found." };
  }

  const answer = exercise.answer as {
    expected?: string;
    accept?: string[];
  } | null;
  if (!answer || typeof answer.expected !== "string") {
    return { ok: false, error: "Malformed writing answer." };
  }

  if (!response.trim()) {
    return { ok: false, error: "Please write an answer." };
  }

  const correct = scoreWriting(answer.expected, answer.accept ?? [], response);
  return { ok: true, correct, expected: answer.expected };
}

export async function scoreLessonSpeaking(
  userId: string,
  lessonId: string,
  exerciseId: string,
  transcript: string,
): Promise<
  | { ok: true; correct: boolean; expected: string }
  | { ok: false; error: string }
> {
  const lesson = await loadAccessibleLesson(userId, lessonId);
  if ("error" in lesson) {
    return { ok: false, error: lesson.error };
  }

  const exercise = await db.exercise.findUnique({ where: { id: exerciseId } });
  if (
    !exercise ||
    exercise.lessonId !== lesson.id ||
    exercise.status !== "PUBLISHED" ||
    exercise.type !== "SPEAKING"
  ) {
    return { ok: false, error: "Speaking exercise not found." };
  }

  const content = exercise.content as {
    kind?: string;
    targetText?: string;
  };
  if (content?.kind !== "speaking" || typeof content.targetText !== "string") {
    return { ok: false, error: "Malformed speaking content." };
  }

  if (!transcript.trim()) {
    return { ok: false, error: "Please speak into the microphone." };
  }

  const correct = scoreWriting(content.targetText, [], transcript);
  return { ok: true, correct, expected: content.targetText };
}

export async function scoreLessonListening(
  userId: string,
  lessonId: string,
  exerciseId: string,
  selections: number[],
): Promise<(ReadingScore & { ok: true }) | { ok: false; error: string }> {
  const lesson = await loadAccessibleLesson(userId, lessonId);
  if ("error" in lesson) {
    return { ok: false, error: lesson.error };
  }

  const exercise = await db.exercise.findUnique({ where: { id: exerciseId } });
  if (
    !exercise ||
    exercise.lessonId !== lesson.id ||
    exercise.status !== "PUBLISHED" ||
    exercise.type !== "LISTENING"
  ) {
    return { ok: false, error: "Listening exercise not found." };
  }

  const content = exercise.content as {
    kind?: string;
    questions?: ReadingQuestion[];
  };
  if (content?.kind !== "listening" || !Array.isArray(content.questions)) {
    return { ok: false, error: "Malformed listening content." };
  }

  const scored = scoreMcq(content.questions, selections);
  if ("error" in scored) {
    return { ok: false, error: scored.error };
  }

  return { ok: true, ...scored };
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
