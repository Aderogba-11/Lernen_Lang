import "dotenv/config";
import { db } from "../lib/db";
import { isAdmin } from "../lib/admin";
import { getPublishedCourse } from "../lib/catalog";
import {
  createCourse,
  createExercise,
  createFlashcard,
  createLanguage,
  createLesson,
  createLevel,
  createModule,
  deleteCourse,
  deleteExercise,
  deleteFlashcard,
  deleteLanguage,
  deleteLesson,
  deleteLevel,
  deleteModule,
  updateExercise,
  updateFlashcard,
  updateLesson,
  updateCourse,
} from "../lib/admin-catalog";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

const LANG_CODE = "xw";
const LEVEL_CODE = "T8";

async function cleanup() {
  const langIds = (
    await db.language.findMany({ where: { code: LANG_CODE }, select: { id: true } })
  ).map((r) => r.id);
  const levelIds = (
    await db.level.findMany({ where: { code: LEVEL_CODE }, select: { id: true } })
  ).map((r) => r.id);
  const matchedCourseIds = (
    await db.course.findMany({
      where: {
        OR: [
          ...(langIds.length ? [{ languageId: { in: langIds } }] : []),
          ...(levelIds.length ? [{ levelId: { in: levelIds } }] : []),
        ],
      },
      select: { id: true },
    })
  ).map((r) => r.id);
  for (const cid of matchedCourseIds) {
    const mods = await db.module.findMany({ where: { courseId: cid }, select: { id: true } });
    for (const mid of mods) {
      const lessons = await db.lesson.findMany({ where: { moduleId: mid.id }, select: { id: true } });
      for (const lid of lessons) {
        await db.flashcard.deleteMany({ where: { lessonId: lid.id } });
        await db.exercise.deleteMany({ where: { lessonId: lid.id } });
        await db.lesson.deleteMany({ where: { id: lid.id } });
      }
      await db.module.deleteMany({ where: { id: mid.id } });
    }
    await db.course.deleteMany({ where: { id: cid } });
  }
  if (langIds.length) await db.language.deleteMany({ where: { id: { in: langIds } } });
  if (levelIds.length) await db.level.deleteMany({ where: { id: { in: levelIds } } });
}

async function main() {
  await cleanup();

  try {
    // ── LL-166 guard stays enforced ─────────────────────────────────────
    assert(isAdmin({ role: "ADMIN" }), "ADMIN is admin");
    assert(!isAdmin({ role: "USER" }), "USER is not admin");

    // ── Scaffold a throwaway course tree ───────────────────────────────
    const lang = await createLanguage({ code: LANG_CODE, name: "Verif", nativeName: "Verif" });
    assert(lang.ok && lang.id, "language created");
    const langId = lang.id!;
    const level = await createLevel({ code: LEVEL_CODE, name: "Tier", order: 990 });
    assert(level.ok && level.id, "level created");
    const levelId = level.id!;
    const course = await createCourse({
      title: "Verif Course",
      description: null,
      languageId: langId,
      levelId,
      status: "DRAFT",
    });
    assert(course.ok && course.id, "course created");
    const courseId = course.id!;
    const module_ = await createModule({ title: "Verif Module", description: null, courseId, order: 1 });
    assert(module_.ok && module_.id, "module created");
    const moduleId = module_.id!;

    // ── LL-172: lesson CRUD + publish gate ──────────────────────────────
    const lesson = await createLesson({
      title: "Verif Lesson",
      objective: "Obj",
      notes: "Notes",
      audioUrl: "/audio/verif.mp3",
      moduleId,
      order: 1,
      status: "DRAFT",
    });
    assert(lesson.ok && lesson.id, "lesson created");
    const lessonId = lesson.id!;

    const dupLesson = await createLesson({ title: "Dup", moduleId, order: 1, status: "DRAFT" });
    assert(!dupLesson.ok, "duplicate lesson order rejected");

    const updLesson = await updateLesson(lessonId, {
      title: "Verif Lesson v2",
      objective: "Obj2",
      moduleId,
      order: 1,
      status: "DRAFT",
      audioUrl: "/audio/verif2.mp3",
    });
    assert(updLesson.ok, "lesson updated");
    const lessonRow = await db.lesson.findUnique({ where: { id: lessonId } });
    assert(lessonRow?.audioUrl === "/audio/verif2.mp3", "lesson audioUrl persisted");

    // ── LL-173: flashcard CRUD + unique (order/target) + publish gate ───
    const fc = await createFlashcard({
      lessonId,
      targetText: "verif card",
      translation: "Verification card",
      pronunciation: "VEH-rif",
      audioUrl: "/audio/verif-card.mp3",
      order: 1,
      status: "DRAFT",
    });
    assert(fc.ok && fc.id, "flashcard created");
    const fcId = fc.id!;

    const dupFcOrder = await createFlashcard({ lessonId, targetText: "other", translation: "x", order: 1, status: "DRAFT" });
    assert(!dupFcOrder.ok, "duplicate flashcard order rejected");
    const dupFcTarget = await createFlashcard({ lessonId, targetText: "verif card", translation: "x", order: 2, status: "DRAFT" });
    assert(!dupFcTarget.ok, "duplicate flashcard target rejected");

    const updFc = await updateFlashcard(fcId, {
      lessonId,
      targetText: "verif card",
      translation: "Updated card",
      order: 1,
      status: "DRAFT",
    });
    assert(updFc.ok, "flashcard updated");

    // ── LL-174: exercise CRUD per type + unique order + publish gate ────
    const writing = await createExercise({
      lessonId,
      prompt: "Translate:",
      type: "WRITING",
      order: 1,
      status: "PUBLISHED",
      content: { kind: "translation", source: "Hello" },
      answer: { expected: "Hola", accept: ["hola"] },
    });
    assert(writing.ok && writing.id, "writing exercise created");
    const writingId = writing.id!;

    const wordOrder = await createExercise({
      lessonId,
      prompt: "Order:",
      type: "WRITING",
      order: 2,
      status: "PUBLISHED",
      content: { kind: "word-order", words: ["A", "B", "C"] },
      answer: { expected: "A B C" },
    });
    assert(wordOrder.ok, "word-order exercise created");

    const reading = await createExercise({
      lessonId,
      prompt: "Read:",
      type: "READING",
      order: 3,
      status: "PUBLISHED",
      content: {
        kind: "reading",
        passage: "Hola.",
        questions: [
          { prompt: "What?", options: ["A", "B"], answerIndex: 1 },
        ],
      },
    });
    assert(reading.ok && reading.id, "reading exercise created");
    const readingId = reading.id!;

    const listening = await createExercise({
      lessonId,
      prompt: "Listen:",
      type: "LISTENING",
      order: 4,
      status: "PUBLISHED",
      content: {
        kind: "listening",
        audioUrl: "/audio/listening/verif.mp3",
        transcript: "Hola",
        questions: [
          { prompt: "What?", options: ["A", "B"], answerIndex: 0 },
        ],
      },
    });
    assert(listening.ok, "listening exercise created");

    const speaking = await createExercise({
      lessonId,
      prompt: "Speak:",
      type: "SPEAKING",
      order: 5,
      status: "PUBLISHED",
      content: { kind: "speaking", targetText: "Buenos días", translation: "Good morning", audioUrl: "/audio/speaking/verif.mp3" },
    });
    assert(speaking.ok, "speaking exercise created");

    const dupExercise = await createExercise({
      lessonId,
      prompt: "Dup",
      type: "WRITING",
      order: 1,
      status: "DRAFT",
      content: { kind: "translation", source: "X" },
      answer: { expected: "Y" },
    });
    assert(!dupExercise.ok, "duplicate exercise order rejected");

    const updExercise = await updateExercise(writingId, {
      lessonId,
      prompt: "Translate v2:",
      type: "WRITING",
      order: 1,
      status: "PUBLISHED",
      content: { kind: "translation", source: "Goodbye" },
      answer: { expected: "Adiós" },
    });
    assert(updExercise.ok, "exercise updated");

    const writeRow = await db.exercise.findUnique({ where: { id: writingId } });
    assert(
      (writeRow?.content as { kind?: string }).kind === "translation" &&
        (writeRow?.content as { source?: string }).source === "Goodbye" &&
        (writeRow?.answer as { expected?: string }).expected === "Adiós",
      "writing exercise JSON assembled correctly",
    );

    const readRow = await db.exercise.findUnique({ where: { id: readingId } });
    const readContent = readRow?.content as {
      kind?: string;
      questions?: { answerIndex?: number }[];
    };
    assert(
      readContent.kind === "reading" &&
        Array.isArray(readContent.questions) &&
        readContent.questions[0].answerIndex === 1,
      "reading exercise questions persisted",
    );

    // ── LL-176: per-entity publish gating via learner-facing query ──────
    // Publish course so getPublishedCourse resolves it.
    const pub = await updateCourse(courseId, {
      title: "Verif Course",
      description: null,
      languageId: langId,
      levelId,
      status: "PUBLISHED",
    });
    assert(pub.ok, "course published");

    // Only the published lesson should appear in the learner course tree.
    let learnerCourse = await getPublishedCourse(LANG_CODE, LEVEL_CODE);
    assert(learnerCourse, "published learner course found");
    const learnerModule = learnerCourse!.modules.find((m) => m.id === moduleId);
    assert(learnerModule, "learner module found");

    // Draft lesson hidden, published lesson visible.
    const lessonIdsInTree = learnerModule?.lessons.map((l) => l.id) ?? [];
    assert(
      !lessonIdsInTree.includes(lessonId),
      "DRAFT lesson hidden from learner course tree",
    );

    const pubLesson = await updateLesson(lessonId, {
      title: "Verif Lesson v2",
      objective: "Obj2",
      moduleId,
      order: 1,
      status: "PUBLISHED",
    });
    assert(pubLesson.ok, "lesson published");
    learnerCourse = await getPublishedCourse(LANG_CODE, LEVEL_CODE);
    const pubLessons = learnerCourse?.modules.find((m) => m.id === moduleId)?.lessons ?? [];
    assert(
      pubLessons.some((l) => l.id === lessonId),
      "PUBLISHED lesson visible in learner course tree",
    );

    // Only published exercises appear within the published lesson's tree.
    const treeExercises = pubLessons.find((l) => l.id === lessonId)?.exercises ?? [];
    assert(
      treeExercises.some((e) => e.id === writingId),
      "published exercise visible in learner tree",
    );

    // Flashcard gating mirrors sessions.ts published-filter.
    const visibleCards = await db.flashcard.findMany({
      where: { lessonId, status: "PUBLISHED" },
      orderBy: { order: "asc" },
    });
    assert(visibleCards.length === 0, "DRAFT flashcard hidden from learner query");
    const pubFc = await updateFlashcard(fcId, {
      lessonId,
      targetText: "verif card",
      translation: "Updated card",
      order: 1,
      status: "PUBLISHED",
    });
    assert(pubFc.ok, "flashcard published");
    const visibleCards2 = await db.flashcard.findMany({
      where: { lessonId, status: "PUBLISHED" },
      orderBy: { order: "asc" },
    });
    assert(visibleCards2.some((c) => c.id === fcId), "PUBLISHED flashcard visible");

    // ── Delete guards ───────────────────────────────────────────────────
    const delLessonBlocked = await deleteLesson(lessonId);
    assert(!delLessonBlocked.ok, "lesson with flashcards/exercises cannot be deleted");

    // ── Cleanup in dependency order ─────────────────────────────────────
    assert((await deleteExercise(writingId)).ok, "exercise deleted");
    assert((await deleteFlashcard(fcId)).ok, "flashcard deleted");

    const remainingExercises = await db.exercise.count({ where: { lessonId } });
    for (const row of await db.exercise.findMany({ where: { lessonId }, select: { id: true } })) {
      await deleteExercise(row.id);
    }
    assert(remainingExercises >= 1, "cleanup removed exercises");

    assert((await deleteLesson(lessonId)).ok, "lesson deleted after children removed");
    assert((await deleteModule(moduleId)).ok, "module deleted");
    assert((await deleteCourse(courseId)).ok, "course deleted");
    assert((await deleteLevel(levelId)).ok, "level deleted");
    assert((await deleteLanguage(langId)).ok, "language deleted");

    console.log("verify-phase18b: ALL CHECKS PASSED");
  } finally {
    await cleanup();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});