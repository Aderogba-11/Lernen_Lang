import "dotenv/config";
import { db } from "../lib/db";
import { getPublishedCourse } from "../lib/catalog";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

async function main() {
  const course = await getPublishedCourse("es", "A1");
  assert(course, "Spanish A1 course not found");

  const lessons = course!.modules.flatMap((m) => m.lessons);
  assert(lessons.length === 18, `expected 18 lessons, got ${lessons.length}`);

  const cards = await db.flashcard.findMany({
    where: { lessonId: { in: lessons.map((l) => l.id) }, status: "PUBLISHED" },
    orderBy: [{ lessonId: "asc" }, { order: "asc" }],
  });
  assert(cards.length === 176, `expected 176 published cards, got ${cards.length}`);

  const byLesson = new Map<string, typeof cards>();
  for (const c of cards) {
    const list = byLesson.get(c.lessonId) ?? [];
    list.push(c);
    byLesson.set(c.lessonId, list);
  }
  for (const lesson of lessons) {
    const list = byLesson.get(lesson.id) ?? [];
    const expected = lesson.title === "Numbers 1–100" ? 40 : 8;
    assert(list.length === expected, `${lesson.title}: expected ${expected} cards, got ${list.length}`);
    list.forEach((c, i) => assert(c.order === i + 1, `${lesson.title}: card order gap at ${i + 1}`));
  }

  const audioRe = /^\/audio\/es\/[a-z0-9-]+-l\d+-\d+\.mp3$/;
  for (const c of cards) {
    const label = `${c.topic}/${c.targetText}`;
    assert(c.targetText.length > 0 && c.translation.length > 0, `${label}: missing text/translation`);
    assert(!!c.pronunciation && c.pronunciation.length > 2, `${label}: missing pronunciation`);
    assert(
      !!c.exampleSentence && !!c.exampleTranslation,
      `${label}: missing example sentence pair`,
    );
    assert(!!c.partOfSpeech && c.partOfSpeech.length > 1, `${label}: missing part of speech`);
    assert(
      c.difficulty !== null && c.difficulty >= 1 && c.difficulty <= 3,
      `${label}: difficulty out of range`,
    );
    assert(!!c.audioUrl && audioRe.test(c.audioUrl), `${label}: bad audioUrl (${c.audioUrl})`);
    assert(c.topic === lessons.find((l) => l.id === c.lessonId)!.title, `${label}: topic mismatch`);
  }

  const dupCheck = await db.flashcard.groupBy({
    by: ["lessonId", "targetText"],
    _count: { _all: true },
    having: { targetText: { _count: { gt: 1 } } },
  });
  assert(dupCheck.length === 0, `duplicate targets found: ${JSON.stringify(dupCheck)}`);

  console.log(`PHASE 5 VERIFICATION PASSED (${cards.length} cards across ${byLesson.size} lessons)`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
