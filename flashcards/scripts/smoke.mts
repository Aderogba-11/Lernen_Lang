import "dotenv/config";
import { db } from "../lib/db";

async function main() {
  const before = {
    languages: await db.language.count(),
    levels: await db.level.count(),
    courses: await db.course.count(),
    modules: await db.module.count(),
    lessons: await db.lesson.count(),
    flashcards: await db.flashcard.count(),
  };

  await db.userLanguage.deleteMany({ where: { language: { code: "zz" } } });
  await db.course.deleteMany({ where: { language: { code: "zz" } } });
  await db.language.deleteMany({ where: { code: "zz" } });
  await db.level.deleteMany({ where: { code: "Z9" } });

  const language = await db.language.create({
    data: { code: "zz", name: "Smokeish", nativeName: "Smokeish" },
  });
  const level = await db.level.create({
    data: { code: "Z9", name: "Smoke Level", order: 99 },
  });
  const course = await db.course.create({
    data: {
      languageId: language.id,
      levelId: level.id,
      title: "Smokeish Z9",
      status: "PUBLISHED",
    },
  });
  const module_ = await db.module.create({
    data: { courseId: course.id, title: "Foundations", order: 1 },
  });
  const lesson = await db.lesson.create({
    data: {
      moduleId: module_.id,
      title: "Greetings",
      objective: "Greet people at different times of day",
      order: 1,
      status: "PUBLISHED",
    },
  });
  const flashcard = await db.flashcard.create({
    data: {
      lessonId: lesson.id,
      targetText: "Buenos días",
      translation: "Good morning",
      pronunciation: "bweh-nos DEE-as",
      exampleSentence: "Buenos días, Ana.",
      exampleTranslation: "Good morning, Ana.",
      partOfSpeech: "phrase",
      topic: "greetings",
      order: 1,
      status: "PUBLISHED",
    },
  });

  await db.user.deleteMany({ where: { email: "smoke@test.local" } });
  const user = await db.user.create({
    data: {
      id: "smoke-test-user",
      name: "Smoke Tester",
      email: "smoke@test.local",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  await db.userLanguage.create({
    data: { userId: user.id, languageId: language.id, courseId: course.id, isActive: true },
  });
  await db.userProgress.create({
    data: { userId: user.id, lessonId: lesson.id, status: "IN_PROGRESS" },
  });
  await db.flashcardProgress.create({
    data: {
      userId: user.id,
      flashcardId: flashcard.id,
      lastRating: "GOOD",
      reviewCount: 1,
      lastReviewedAt: new Date(),
      dueAt: new Date(Date.now() + 86_400_000),
    },
  });

  const fetched = await db.user.findUniqueOrThrow({
    where: { email: "smoke@test.local" },
    include: {
      languages: { include: { language: true, course: true } },
      lessonProgress: { include: { lesson: { include: { module: { include: { course: true } } } } } },
      flashcardProgress: { include: { flashcard: true } },
    },
  });

  console.log("user:", fetched.name);
  console.log("active language:", fetched.languages[0].language.nativeName);
  console.log("course:", fetched.languages[0].course?.title);
  console.log("lesson:", fetched.lessonProgress[0].lesson.title);
  console.log("module:", fetched.lessonProgress[0].lesson.module.title);
  console.log("flashcard:", fetched.flashcardProgress[0].flashcard.targetText);
  console.log("rating:", fetched.flashcardProgress[0].lastRating);

  await db.user.delete({ where: { id: user.id } });
  await db.course.delete({ where: { id: course.id } });
  await db.language.delete({ where: { id: language.id } });
  await db.level.delete({ where: { id: level.id } });

  const after = {
    languages: await db.language.count(),
    levels: await db.level.count(),
    courses: await db.course.count(),
    modules: await db.module.count(),
    lessons: await db.lesson.count(),
    flashcards: await db.flashcard.count(),
  };
  console.log("counts before:", JSON.stringify(before));
  console.log("counts after: ", JSON.stringify(after));

  if (JSON.stringify(before) !== JSON.stringify(after)) {
    throw new Error("Cascade cleanup failed — counts drifted");
  }
  console.log("SMOKE TEST PASSED");
}

main()
  .catch((e) => {
    console.error("SMOKE TEST FAILED:", e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
