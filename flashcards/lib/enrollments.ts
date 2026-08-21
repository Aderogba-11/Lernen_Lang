import { db } from "@/lib/db";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function getUserEnrollments(userId: string) {
  return db.userLanguage.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    include: {
      language: true,
      course: { include: { level: true } },
    },
  });
}

export async function getActiveEnrollment(userId: string) {
  return db.userLanguage.findFirst({
    where: { userId, isActive: true },
    include: {
      language: true,
      course: { include: { level: true } },
    },
  });
}

export async function startLanguageForUser(
  userId: string,
  languageCode: string,
  levelCode: string,
): Promise<ActionResult> {
  const language = await db.language.findUnique({
    where: { code: languageCode },
  });
  if (!language || !language.isActive) {
    return { ok: false, error: "That language is not available." };
  }

  const course = await db.course.findFirst({
    where: {
      languageId: language.id,
      status: "PUBLISHED",
      level: { code: levelCode },
    },
  });
  if (!course) {
    return {
      ok: false,
      error: `No ${language.name} course is available at that level yet.`,
    };
  }

  await db.$transaction(async (tx) => {
    await tx.userLanguage.updateMany({
      where: { userId },
      data: { isActive: false },
    });
    await tx.userLanguage.upsert({
      where: {
        userId_languageId: { userId, languageId: language.id },
      },
      update: { courseId: course.id, isActive: true },
      create: {
        userId,
        languageId: language.id,
        courseId: course.id,
        isActive: true,
      },
    });
  });

  return { ok: true };
}

export async function setActiveEnrollmentForUser(
  userId: string,
  enrollmentId: string,
): Promise<ActionResult> {
  const enrollment = await db.userLanguage.findUnique({
    where: { id: enrollmentId },
    include: { course: true },
  });
  if (!enrollment || enrollment.userId !== userId) {
    return { ok: false, error: "Enrollment not found." };
  }
  if (enrollment.course && enrollment.course.status !== "PUBLISHED") {
    return { ok: false, error: "That course is no longer available." };
  }

  await db.$transaction(async (tx) => {
    await tx.userLanguage.updateMany({
      where: { userId },
      data: { isActive: false },
    });
    await tx.userLanguage.update({
      where: { id: enrollment.id },
      data: { isActive: true },
    });
  });

  return { ok: true };
}
