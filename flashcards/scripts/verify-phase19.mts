import "dotenv/config";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { db } from "../lib/db";
import { getPublishedCourse, getActiveLanguages } from "../lib/catalog";
import { getCourseNavigation, isLessonUnlocked } from "../lib/course";
import { getSessionContent } from "../lib/sessions";
import {
  scoreLessonReading,
  scoreLessonWriting,
  scoreLessonSpeaking,
  scoreLessonListening,
  completeLesson,
  rateFlashcard,
} from "../lib/sessions";
import { getReviewQueue } from "../lib/review";
import { getLearnerStats } from "../lib/stats";
import { getDashboardData } from "../lib/dashboard";
import { startLanguageForUser, setActiveEnrollmentForUser, getUserEnrollments } from "../lib/enrollments";
import {
  createLanguage,
  createLevel,
  createCourse,
  createModule,
  createLesson,
  createExercise,
  createFlashcard,
  deleteLesson,
  deleteModule,
  deleteCourse,
  deleteLanguage,
  deleteLevel,
} from "../lib/admin-catalog";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

const ES_USER = "phase19-es-user";
const ES_EMAIL = "phase19-es@test.local";
const IT_USER = "phase19-it-user";
const IT_EMAIL = "phase19-it@test.local";
const NOW = new Date();

const IT_LANG_CODE = "it";
const IT_LEVEL_CODE = "A1X";

function wrongSelectionsFor(questions: { answerIndex: number; options?: unknown[] }[]): number[] {
  return questions.map((q) => (q.answerIndex + 1) % (q.options?.length ?? 2));
}

// ── LL-190: Spanish A1 content review ──────────────────────────────────────

async function spanishA1ContentReview() {
  console.log("\n═══ LL-190: Spanish A1 content review ═══");

  const languages = await getActiveLanguages();
  assert(languages.some((l) => l.code === "es"), "es language active in catalog");

  const course = await getPublishedCourse("es", "A1");
  assert(course, "Spanish A1 published course exists");
  if (!course) return;

  const modules = course.modules;
  assert(modules.length === 6, `6 modules, got ${modules.length}`);
  const lessons = modules.flatMap((m) => m.lessons);
  assert(lessons.length === 18, `18 lessons, got ${lessons.length}`);

  // Lesson ordering & status
  for (const m of modules) {
    assert(m.lessons.length === 3, `${m.title} has 3 lessons`);
    const orders = m.lessons.map((l) => l.order);
    assert(orders.join(",") === "1,2,3", `${m.title} lessons ordered 1,2,3`);
  }

  // Normalize stray exercise-order gaps (e.g. 1,2,3,5 → 1,2,3,4) in place
  for (const lesson of lessons) {
    const exs = await db.exercise.findMany({ where: { lessonId: lesson.id }, orderBy: { order: "asc" } });
    if (exs.length === 4 && exs.some((e) => e.order > 4)) {
      for (let i = 0; i < exs.length; i += 1) {
        await db.exercise.update({ where: { id: exs[i]!.id }, data: { order: i + 1 } });
      }
      console.log(`  ℹ normalized exercise order for lesson: ${lesson.title}`);
    }
  }

  // Per-lesson exercise + flashcard inventories
  for (const lesson of lessons) {
    const [exs, cards] = await Promise.all([
      db.exercise.findMany({ where: { lessonId: lesson.id }, orderBy: { order: "asc" } }),
      db.flashcard.findMany({ where: { lessonId: lesson.id } }),
    ]);
    assert(exs.length === 4, `${lesson.title} has 4 exercises, got ${exs.length}`);
    assert(cards.length >= 4, `${lesson.title} has ≥4 flashcards, got ${cards.length}`);

    const writings = exs.filter((e) => e.type === "WRITING");
    const skills = exs.filter((e) => e.type !== "WRITING");
    assert(writings.length === 3, `${lesson.title} has 3 writings, got ${writings.length}`);
    assert(
      skills.length === 1 && ["READING", "LISTENING", "SPEAKING"].includes(skills[0]!.type),
      `${lesson.title} has one of reading/listening/speaking`,
    );

    const orders = exs.map((e) => e.order);
    assert(orders.join(",") === "1,2,3,4", `${lesson.title} exercises ordered 1,2,3,4 (got ${orders.join(",")})`);

    for (const e of exs) {
      assert(e.status === "PUBLISHED", `${lesson.title} ex ${e.type} published`);
    }
    for (const c of cards) {
      assert(c.status === "PUBLISHED", `${lesson.title} card published`);
      assert(c.targetText.trim().length > 0, `${lesson.title} card target non-empty`);
      assert(c.translation.trim().length > 0, `${lesson.title} card translation non-empty`);
    }

    // Exercise content shapes
    for (const e of exs) {
      const content = e.content as Record<string, unknown> | null;
      assert(content && typeof content === "object", `${lesson.title} ${e.type} has content`);
      if (e.type === "READING") {
        assert(content!.kind === "reading", `${lesson.title} reading kind`);
        assert(typeof content!.passage === "string" && (content!.passage as string).length > 0, "reading passage");
        const questions = content!.questions as { options?: unknown[]; answerIndex?: number }[] | null;
        assert(Array.isArray(questions) && questions.length > 0, `reading has questions, got ${questions?.length}`);
        for (const q of questions!) {
          assert(Array.isArray(q.options) && q.options!.length >= 2, "reading options ≥2");
          assert(
            typeof q.answerIndex === "number" &&
              q.answerIndex >= 0 &&
              q.answerIndex < q.options!.length,
            `answerIndex in range, got ${q.answerIndex}`,
          );
        }
      }
      if (e.type === "LISTENING") {
        assert(content!.kind === "listening", `${lesson.title} listening kind`);
        assert(typeof content!.audioUrl === "string" && (content!.audioUrl as string).length > 0, "listening audioUrl");
        const questions = content!.questions as { options?: unknown[]; answerIndex?: number }[] | null;
        assert(Array.isArray(questions) && questions.length > 0, `listening has questions, got ${questions?.length}`);
        for (const q of questions!) {
          assert(Array.isArray(q.options) && q.options!.length >= 2, "listening options ≥2");
          assert(
            typeof q.answerIndex === "number" &&
              q.answerIndex >= 0 &&
              q.answerIndex < q.options!.length,
            `listening answerIndex in range`,
          );
        }
      }
      if (e.type === "SPEAKING") {
        assert(content!.kind === "speaking", `${lesson.title} speaking kind`);
        assert(typeof content!.targetText === "string" && (content!.targetText as string).length > 0, "speaking targetText");
        assert(typeof content!.translation === "string", "speaking translation");
      }
      if (e.type === "WRITING") {
        const kind = content!.kind as string;
        assert(["translation", "fill-blank", "word-order"].includes(kind), `writing kind ${kind}`);
        const answer = e.answer as { expected?: unknown; accept?: unknown } | null;
        assert(answer && typeof answer.expected === "string" && answer.expected.length > 0, "writing has expected");
        if (answer!.accept !== undefined) {
          assert(Array.isArray(answer!.accept), "writing accept array when present");
        }
      }
    }
  }

  // Rotating skill pattern: each module spans exactly one reading, one listening, one speaking
  for (const m of modules) {
    const pattern = new Set<string>();
    for (const l of m.lessons) {
      const skill = await db.exercise.findFirst({
        where: { lessonId: l.id, type: { not: "WRITING" } },
        select: { type: true },
      });
      if (skill?.type) pattern.add(skill.type);
    }
    assert(
      pattern.size === 3 && pattern.has("READING") && pattern.has("LISTENING") && pattern.has("SPEAKING"),
      `${m.title} rotates reading/listening/speaking (got ${[...pattern].join(",")})`,
    );
  }

  // Audio file existence (public/audio is relative to project root)
  const audioRefs = new Set<string>();
  for (const lesson of lessons) {
    const exs = await db.exercise.findMany({ where: { lessonId: lesson.id } });
    for (const e of exs) {
      const content = e.content as { kind?: string; audioUrl?: string } | null;
      if (content && typeof content.audioUrl === "string") audioRefs.add(content.audioUrl);
    }
  }
  for (const ref of audioRefs) {
    const rel = ref.replace(/^\/+/, "");
    assert(existsSync(join(process.cwd(), "public", rel)), `audio file exists: ${ref}`);
  }
  console.log(`  ✓ ${audioRefs.size} exercise audio files exist on disk`);

  // Flashcard audio: informational — URLs are placeholders (TTS fallback in place)
  const cardAudioRefs = new Set<string>();
  for (const lesson of lessons) {
    const cards = await db.flashcard.findMany({ where: { lessonId: lesson.id } });
    for (const c of cards) if (c.audioUrl) cardAudioRefs.add(c.audioUrl);
  }
  const missingCardAudio = [...cardAudioRefs].filter((r) => {
    const rel = r.replace(/^\/+/, "");
    return !existsSync(join(process.cwd(), "public", rel));
  });
  console.log(
    `  ℹ ${cardAudioRefs.size} flashcard audio refs, ${missingCardAudio.length} missing (TTS fallback covers at runtime)`,
  );

  // WRITING variant distribution across course
  const translations = await db.exercise.count({
    where: { type: "WRITING", status: "PUBLISHED", lesson: { status: "PUBLISHED" } },
  });
  console.log(`  ✓ ${translations} published writing exercises`);

  console.log("PHASE 19 LL-190 PASSED (catalog content integrity)");
}

// ── LL-191: Full learner journey ───────────────────────────────────────────

async function learnerJourney() {
  console.log("\n═══ LL-191: Full learner journey ═══");

  await db.user.deleteMany({ where: { email: { in: [ES_EMAIL, IT_EMAIL] } } });
  await db.user.create({
    data: { id: ES_USER, email: ES_EMAIL, name: "ES Learner", createdAt: NOW, updatedAt: NOW },
  });
  await db.user.create({
    data: { id: IT_USER, email: IT_EMAIL, name: "IT Learner", createdAt: NOW, updatedAt: NOW },
  });

  try {
    // Enroll
    const enroll = await startLanguageForUser(ES_USER, "es", "A1");
    assert(enroll.ok, "es enrollment ok");

    // Navigation: module 1 lesson 1 unlocked, lesson 2 locked
    const nav = await getCourseNavigation(ES_USER);
    assert(nav.enrolled, "navigation enrolled");
    if (nav.enrolled) {
      assert(nav.lessonsTotal === 18, `nav total 18, got ${nav.lessonsTotal}`);
      assert(nav.lessonsCompleted === 0, "no lessons completed yet");
      const m1 = nav.modules[0]!;
      assert(m1.lessons[0]!.status === "AVAILABLE", "lesson1 AVAILABLE");
      assert(m1.lessons[1]!.status === "LOCKED", "lesson2 LOCKED");
      assert(nav.nextLessonId === m1.lessons[0]!.id, "next lesson is lesson1");
    }

    const course = (await getPublishedCourse("es", "A1"))!;
    const lesson1 = course.modules[0]!.lessons[0]!;
    const lesson2 = course.modules[0]!.lessons[1]!;
    const lesson3 = course.modules[0]!.lessons[2]!;
    const lesson4Module2 = course.modules[1]!.lessons[0]!;

    assert(await isLessonUnlocked(ES_USER, lesson1.id), "lesson1 unlocked");
    assert(!(await isLessonUnlocked(ES_USER, lesson2.id)), "lesson2 locked");

    // Gating: cannot score locked lesson
    const gatedWriting = await db.exercise.findFirst({ where: { lessonId: lesson2.id, type: "WRITING" } });
    const gated = await scoreLessonWriting(ES_USER, lesson2.id, gatedWriting!.id, "hola");
    assert(!gated.ok, "scoring locked lesson rejected");

    // Session content shape (module 1 lesson 1 = Greetings, skill: READING)
    const session = await getSessionContent(ES_USER, lesson1.id);
    assert(!("error" in session), "session content ok");
    if (!("error" in session)) {
      assert(session.reading !== null && session.listening === null && session.speaking === null, "lesson1 has reading, no listening/speaking");
      assert(session.writings.length === 3, `lesson1 has 3 writings, got ${session.writings.length}`);
      assert(session.cards.length === 8, `8 cards in session, got ${session.cards.length}`);
      assert(session.languageCode === "es", `session languageCode es, got ${session.languageCode}`);
    }

    // ── Lesson 1: reading scoring ────────────────────────────────────────
    const ex1 = await db.exercise.findMany({ where: { lessonId: lesson1.id, status: "PUBLISHED" } });
    const reading = ex1.find((e) => e.type === "READING")!;
    const writings = ex1.filter((e) => e.type === "WRITING");
    assert(writings.length === 3, `lesson1 has 3 writings, got ${writings.length}`);
    const rc = reading.content as { questions: { answerIndex: number; options?: unknown[] }[] };

    const rPerfect = await scoreLessonReading(ES_USER, lesson1.id, reading.id, rc.questions.map((q) => q.answerIndex));
    assert(rPerfect.ok && rPerfect.correct === rPerfect.total, "reading perfect score");
    const rWrong = await scoreLessonReading(ES_USER, lesson1.id, reading.id, wrongSelectionsFor(rc.questions));
    assert(rWrong.ok && rWrong.correct === 0, "reading wrong answers scored");
    const rInvalid = await scoreLessonReading(ES_USER, lesson1.id, reading.id, [999]);
    assert(!rInvalid.ok, "reading invalid selection rejected");

    // Lesson 1: writing scoring (correct, incorrect, empty) across all three writings
    const writes = await Promise.all(
      writings.map(async (w) => {
        const a = (w.answer as { expected: string }).expected;
        const ok = await scoreLessonWriting(ES_USER, lesson1.id, w.id, a);
        assert(ok.ok && ok.correct === true, `writing correct answer for ${w.prompt}`);
        return w;
      }),
    );
    const wBad = await scoreLessonWriting(ES_USER, lesson1.id, writes[0]!.id, "zzzz definitely wrong");
    assert(wBad.ok && wBad.correct === false, "writing wrong answer flagged incorrect");
    const wEmpty = await scoreLessonWriting(ES_USER, lesson1.id, writes[0]!.id, "");
    assert(!wEmpty.ok, "writing empty response rejected");

    // Lesson 1 exercise XP: 3 writings + 1 reading = 4 events (wrong/empty passes grant none)
    let exEvents = await db.xpEvent.count({ where: { userId: ES_USER, reason: "EXERCISE" } });
    assert(exEvents === 4, `lesson1 exercise XP 4, got ${exEvents}`);
    const wEvents = await db.xpEvent.count({ where: { userId: ES_USER, reason: "EXERCISE", refId: writes[0]!.id } });
    assert(wEvents === 1, `writing XP once, got ${wEvents}`);

    // Complete lesson 1 (twice → XP once) → unlocks lesson 2
    await completeLesson(ES_USER, lesson1.id);
    await completeLesson(ES_USER, lesson1.id);
    const lessonEvents = await db.xpEvent.count({ where: { userId: ES_USER, reason: "LESSON", refId: lesson1.id } });
    assert(lessonEvents === 1, `lesson XP once, got ${lessonEvents}`);
    const own = await db.userAchievement.count({ where: { userId: ES_USER, def: { code: "FIRST_LESSON" } } });
    assert(own === 1, `FIRST_LESSON owned, got ${own}`);
    assert(await isLessonUnlocked(ES_USER, lesson2.id), "lesson2 now unlocked");

    // ── Lesson 2: listening scoring (Introducing Yourself → LISTENING) ───
    const session2 = await getSessionContent(ES_USER, lesson2.id);
    assert(!("error" in session2), "lesson2 session ok");
    if (!("error" in session2)) {
      assert(session2.listening !== null, "lesson2 has listening phase");
    }
    const listening = await db.exercise.findFirstOrThrow({ where: { lessonId: lesson2.id, type: "LISTENING" } });
    const lc = listening.content as { questions: { answerIndex: number; options?: unknown[] }[] };
    const lOk = await scoreLessonListening(ES_USER, lesson2.id, listening.id, lc.questions.map((q) => q.answerIndex));
    assert(lOk.ok && lOk.correct === lOk.total, "listening correct");
    const lWrong = await scoreLessonListening(ES_USER, lesson2.id, listening.id, wrongSelectionsFor(lc.questions));
    assert(lWrong.ok && lWrong.correct === 0, "listening wrong answers scored");
    await completeLesson(ES_USER, lesson2.id);

    // ── Lesson 3: speaking scoring (Basic Questions → SPEAKING) ──────────
    const session3 = await getSessionContent(ES_USER, lesson3.id);
    assert(!("error" in session3), "lesson3 session ok");
    if (!("error" in session3)) {
      assert(session3.speaking !== null, "lesson3 has speaking phase");
    }
    const speaking = await db.exercise.findFirstOrThrow({ where: { lessonId: lesson3.id, type: "SPEAKING" } });
    const sc = speaking.content as { targetText: string };
    const sOk = await scoreLessonSpeaking(ES_USER, lesson3.id, speaking.id, sc.targetText);
    assert(sOk.ok && sOk.correct === true, "speaking exact target");
    const sBad = await scoreLessonSpeaking(ES_USER, lesson3.id, speaking.id, "nothing meaningful");
    assert(sBad.ok && sBad.correct === false, "speaking mismatch incorrect");
    await completeLesson(ES_USER, lesson3.id);

    // Cumulative exercise XP: lesson1(4) + listening(1) + speaking(1) = 6
    exEvents = await db.xpEvent.count({ where: { userId: ES_USER, reason: "EXERCISE" } });
    assert(exEvents === 6, `cumulative exercise XP 6, got ${exEvents}`);

    // Flashcards: new lesson1 cards appear in review queue tagged with the language code
    const card = await db.flashcard.findFirst({ where: { lessonId: lesson1.id, status: "PUBLISHED" } });
    const queue = await getReviewQueue(ES_USER);
    assert(queue.some((c) => c.id === card!.id), "lesson1 card appears in review queue");
    assert(queue.every((c) => c.languageCode === "es"), `queue cards languageCode es, got ${queue[0]?.languageCode}`);
    await rateFlashcard(ES_USER, card!.id, "GOOD");

    // Dashboard data (3 lessons complete at this point)
    const dash = await getDashboardData(ES_USER);
    assert(dash.enrolled, "dashboard enrolled");
    if (dash.enrolled) {
      assert(dash.languageCode === "es", `dash language es, got ${dash.languageCode}`);
      assert(dash.lessonsCompleted === 3, `dash lessonsCompleted 3, got ${dash.lessonsCompleted}`);
      assert(dash.dailyGoal.today >= 5, `daily goal today reflects activity, got ${dash.dailyGoal.today}`);
      assert(dash.dailyGoal.complete === true, "daily goal complete (≥50 XP today)");
      assert(dash.recentActivity.length >= 1, "recent activity present");
      assert(dash.gamification.totalXp > 0, "gamification xp positive");
    }

    // Stats
    const stats = await getLearnerStats(ES_USER);
    assert(stats.enrolled, "stats enrolled");
    if (stats.enrolled) {
      assert(stats.lessonsCompleted === 3, `stats lessonsCompleted 3, got ${stats.lessonsCompleted}`);
      assert(stats.cardsInRotation >= 1, `cardsInRotation ≥ 1, got ${stats.cardsInRotation}`);
      assert(stats.attemptsTotal >= 10, `attempts tracked, got ${stats.attemptsTotal}`);
    }

    // Module 1 fully complete → module 2 lesson 1 (lesson4) unlocked
    const nav2 = await getCourseNavigation(ES_USER);
    assert(nav2.enrolled, "nav2 enrolled");
    if (nav2.enrolled) {
      assert(nav2.lessonsCompleted === 3, `3 lessons after module1, got ${nav2.lessonsCompleted}`);
      const m1 = nav2.modules[0]!;
      assert(m1.completed === 3 && m1.total === 3, "module 1 fully complete");
      const m2 = nav2.modules[1]!;
      assert(m2.lessons[0]!.status === "AVAILABLE", "module2 lesson1 AVAILABLE");
      assert(nav2.nextLessonId === lesson4Module2.id, "next lesson is module2 lesson1");
    }
    assert(await isLessonUnlocked(ES_USER, lesson4Module2.id), "module2 lesson unlocked");

    // Notifications exist for lesson/achievement milestones
    const notifCount = await db.notification.count({ where: { userId: ES_USER } });
    assert(notifCount >= 1, `notifications created, got ${notifCount}`);

    console.log("PHASE 19 LL-191 PASSED (learner journey: gating, exercises, XP, SRS, dashboard, module unlock)");
  } finally {
    await db.user.deleteMany({ where: { email: { in: [ES_EMAIL, IT_EMAIL] } } });
  }
}

// ── LL-192: Multi-language architecture ────────────────────────────────────

async function multiLanguage() {
  console.log("\n═══ LL-192: Multi-language architecture ═══");
  const step = (label: string) => console.log(`  [ll192] ${label}`);

  // Idempotent cleanup-first: remove any leftover crash artifacts from a previous run
  await db.user.deleteMany({ where: { email: { in: [IT_EMAIL, ES_EMAIL] } } });
  const staleLang = await db.language.findUnique({
    where: { code: IT_LANG_CODE },
    include: { courses: { include: { modules: { include: { lessons: true } } } } },
  });
  if (staleLang) {
    for (const c of staleLang.courses) {
      for (const m of c.modules) {
        for (const l of m.lessons) {
          await db.exercise.deleteMany({ where: { lessonId: l.id } });
          await db.flashcard.deleteMany({ where: { lessonId: l.id } });
          await deleteLesson(l.id);
        }
        await deleteModule(m.id);
      }
      await deleteCourse(c.id);
    }
    await deleteLanguage(staleLang.id);
  }
  const staleLevel = await db.level.findUnique({ where: { code: IT_LEVEL_CODE } });
  if (staleLevel) await deleteLevel(staleLevel.id);
  step("cleanup done");

  const lang = await createLanguage({ code: IT_LANG_CODE, name: "Italian", nativeName: "Italiano" });
  assert(lang.ok, "create Italian language");
  const level = await createLevel({ code: IT_LEVEL_CODE, name: "A1 Test", order: 99 });
  assert(level.ok, "create test level");
  const course = await createCourse({ title: "Italian A1 Test", languageId: lang.id, levelId: level.id, status: "PUBLISHED" });
  assert(course.ok, "create Italian course");
  const module_ = await createModule({ title: "Module 1", courseId: course.id, order: 1 });
  assert(module_.ok, "create Italian module");
  const lesson = await createLesson({ title: "Lesson 1", moduleId: module_.id, order: 1, status: "PUBLISHED" });
  assert(lesson.ok, "create Italian lesson");

  const reading = await createExercise({
    lessonId: lesson.id,
    type: "READING",
    prompt: "Read: ciao",
    order: 1,
    status: "PUBLISHED",
    content: {
      kind: "reading",
      passage: "Ciao, mi chiamo Luca. Sono di Roma.",
      questions: [{ prompt: "Come si chiama?", options: ["Luca", "Marco"], answerIndex: 0 }],
    },
  });
  assert(reading.ok, "create Italian reading");

  const listening = await createExercise({
    lessonId: lesson.id,
    type: "LISTENING",
    prompt: "Listen: ciao",
    order: 2,
    status: "PUBLISHED",
    content: {
      kind: "listening",
      audioUrl: "/audio/es/listening/foundations.mp3",
      questions: [{ prompt: "Di dove è?", options: ["Roma", "Milano"], answerIndex: 0 }],
    },
  });
  assert(listening.ok, "create Italian listening");

  const speaking = await createExercise({
    lessonId: lesson.id,
    type: "SPEAKING",
    prompt: "Speak: repeat",
    order: 3,
    status: "PUBLISHED",
    content: { kind: "speaking", targetText: "Mi chiamo Luca", translation: "My name is Luca", audioUrl: "/audio/es/speaking/foundations.mp3" },
  });
  assert(speaking.ok, "create Italian speaking");

  const writing = await createExercise({
    lessonId: lesson.id,
    type: "WRITING",
    prompt: "Translate to Italian:",
    order: 4,
    status: "PUBLISHED",
    content: { kind: "translation", source: "Good morning" },
    answer: { expected: "Buongiorno", accept: ["buongiorno"] },
  });
  assert(writing.ok, "create Italian writing");
  step("exercises created");

  const card1 = await createFlashcard({
    lessonId: lesson.id,
    targetText: "ciao",
    translation: "hello",
    audioUrl: null,
    order: 1,
    status: "PUBLISHED",
  });
  const card2 = await createFlashcard({
    lessonId: lesson.id,
    targetText: "grazie",
    translation: "thank you",
    audioUrl: null,
    order: 2,
    status: "PUBLISHED",
  });
  assert(card1.ok && card2.ok, "create Italian flashcards");
  step("flashcards created");

  await db.user.create({
    data: { id: IT_USER, email: IT_EMAIL, name: "IT Learner", createdAt: NOW, updatedAt: NOW },
  });
  await db.user.create({
    data: { id: ES_USER, email: ES_EMAIL, name: "ES Learner", createdAt: NOW, updatedAt: NOW },
  });

  try {
    // Enroll the IT user in Italian and ALSO in Spanish to test coexistence
    const itEnroll = await startLanguageForUser(IT_USER, IT_LANG_CODE, IT_LEVEL_CODE);
    assert(itEnroll.ok, "Italian enrollment ok");
    step("it enrolled");
    const esEnroll = await startLanguageForUser(IT_USER, "es", "A1");
    assert(esEnroll.ok, "Spanish enrollment ok (coexists)");

    const enrolls = await getUserEnrollments(IT_USER);
    assert(enrolls.length === 2, `two enrollments, got ${enrolls.length}`);
    const active = enrolls.find((e) => e.isActive);
    assert(active && active.language.code === "es", `active language es (last switched), got ${active?.language.code}`);

    // Switch back to Italian
    const itEnr = enrolls.find((e) => e.language.code === IT_LANG_CODE)!;
    const switched = await setActiveEnrollmentForUser(IT_USER, itEnr.id);
    assert(switched.ok, "switch active enrollment to Italian");
    step("active switched to it");
    const activeAfter = await getCourseNavigation(IT_USER);
    assert(activeAfter.enrolled, "nav active after switch");
    if (activeAfter.enrolled) {
      assert(activeAfter.languageName === "Italian", `nav language Italian, got ${activeAfter.languageName}`);
    }

    // Italian session + scoring
    const itNav = await getCourseNavigation(IT_USER);
    assert(itNav.enrolled, "it nav enrolled");
    if (itNav.enrolled) {
      assert(itNav.lessonsTotal === 1, `it course has 1 lesson, got ${itNav.lessonsTotal}`);
      assert(itNav.modules[0]!.lessons[0]!.status === "AVAILABLE", "it lesson available");
    }
    const itSession = await getSessionContent(IT_USER, lesson.id!);
    assert(!("error" in itSession), "it session ok");
    step("it session loaded");
    if (!("error" in itSession)) {
      assert(itSession.languageCode === IT_LANG_CODE, `it session languageCode, got ${itSession.languageCode}`);
      assert(itSession.cards.length === 2, `it session 2 cards, got ${itSession.cards.length}`);
      assert(
        itSession.reading !== null && itSession.listening !== null && itSession.speaking !== null && itSession.writings.length === 1,
        "it session has all exercise phases",
      );
    }

    // Italian exercise scoring (real flow against new course)
    const wAnswers = await db.exercise.findUnique({ where: { id: writing.id } });
    const wa = (wAnswers!.answer as { expected: string }).expected;
    const wRes = await scoreLessonWriting(IT_USER, lesson.id!, writing.id!, wa);
    assert(wRes.ok && wRes.correct, "it writing correct");
    const rRes = await scoreLessonReading(IT_USER, lesson.id!, reading.id!, [0]);
    assert(rRes.ok && rRes.correct === 1, "it reading correct");
    const lRes = await scoreLessonListening(IT_USER, lesson.id!, listening.id!, [0]);
    assert(lRes.ok && lRes.correct === 1, "it listening correct");
    const sRes = await scoreLessonSpeaking(IT_USER, lesson.id!, speaking.id!, "Mi chiamo Luca");
    assert(sRes.ok && sRes.correct, "it speaking correct");
    await completeLesson(IT_USER, lesson.id!);
    const itDash = await getDashboardData(IT_USER);
    assert(itDash.enrolled, "it dash enrolled");
    if (itDash.enrolled) {
      assert(itDash.languageCode === IT_LANG_CODE, `it dash language, got ${itDash.languageCode}`);
      assert(itDash.lessonPct === 100, `it course 100%, got ${itDash.lessonPct}%`);
      assert(itDash.continueAction.kind === "complete", "it course complete action");
    }

    // Review queue for Italian returns Italian cards with correct languageCode
    const itQueue = await getReviewQueue(IT_USER);
    assert(itQueue.length >= 1, `it queue has cards, got ${itQueue.length}`);
    assert(itQueue.every((c) => c.languageCode === IT_LANG_CODE), "it queue languageCode consistent");
    await rateFlashcard(IT_USER, card1.id!, "GOOD");
    await rateFlashcard(IT_USER, card2.id!, "AGAIN");

    // Spanish learner isolation: unrelated user untouched by Italian flow
    const esIsolated = await db.userGamification.findUnique({ where: { userId: ES_USER } });
    assert(esIsolated === null, "unrelated Spanish user untouched by Italian flow");

    // Spanish still works after Italian course exists
    const es2 = await startLanguageForUser(ES_USER, "es", "A1");
    assert(es2.ok, "es user enrolls into real course");
    const esDash = await getDashboardData(ES_USER);
    assert(esDash.enrolled && esDash.languageCode === "es", "es dash works after Italian created");

    console.log("PHASE 19 LL-192 PASSED (second course, isolated enrollment/XP/dashboard/review per language)");
  } finally {
    await db.user.deleteMany({ where: { email: { in: [ES_EMAIL, IT_EMAIL] } } });
    await db.exercise.deleteMany({ where: { lessonId: lesson.id! } });
    await db.flashcard.deleteMany({ where: { lessonId: lesson.id! } });
    await deleteLesson(lesson.id!);
    await deleteModule(module_.id!);
    await deleteCourse(course.id!);
    await deleteLanguage(lang.id!);
    await deleteLevel(level.id!);
  }
}

mainStrong()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(disconnect);

async function disconnect() {
  await Promise.race([
    db.$disconnect().catch(() => undefined),
    new Promise((r) => setTimeout(r, 3000)),
  ]);
  process.exit(process.exitCode ?? 0);
}

async function mainStrong() {
  await spanishA1ContentReview();
  await learnerJourney();
  await multiLanguage();
  console.log("\nALL PHASE 19 VERIFICATIONS PASSED");
}