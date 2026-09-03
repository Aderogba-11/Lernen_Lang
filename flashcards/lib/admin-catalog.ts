import { db } from "@/lib/db";
import { Prisma } from "@/app/generated/prisma/client";

export type AdminCatalogResult = { ok: boolean; error?: string; id?: string };

function handleUnique(err: unknown, message: string): AdminCatalogResult {
  if (err instanceof Error && (err as { code?: string }).code === "P2002") {
    return { ok: false, error: message };
  }
  return { ok: false, error: "Something went wrong." };
}

// ── Languages ──────────────────────────────────────────────────────────────

export async function createLanguage(
  input: Record<string, unknown>,
): Promise<AdminCatalogResult> {
  const code = String(input.code ?? "").trim().toLowerCase();
  const name = String(input.name ?? "").trim();
  const nativeName = String(input.nativeName ?? "").trim();
  if (!code || !name || !nativeName) {
    return { ok: false, error: "Code, name and native name are required." };
  }
  try {
    const created = await db.language.create({ data: { code, name, nativeName } });
    return { ok: true, id: created.id };
  } catch (err) {
    return handleUnique(err, "A language with that code already exists.");
  }
}

export async function updateLanguage(
  id: string,
  input: Record<string, unknown>,
): Promise<AdminCatalogResult> {
  const code = String(input.code ?? "").trim().toLowerCase();
  const name = String(input.name ?? "").trim();
  const nativeName = String(input.nativeName ?? "").trim();
  const isActive = input.isActive !== false && input.isActive !== "false";
  if (!code || !name || !nativeName) {
    return { ok: false, error: "Code, name and native name are required." };
  }
  try {
    await db.language.update({ where: { id }, data: { code, name, nativeName, isActive } });
    return { ok: true };
  } catch (err) {
    return handleUnique(err, "A language with that code already exists.");
  }
}

export async function deleteLanguage(id: string): Promise<AdminCatalogResult> {
  const deps = await db.course.count({ where: { languageId: id } });
  if (deps > 0) {
    return { ok: false, error: "Delete its courses first." };
  }
  await db.language.delete({ where: { id } });
  return { ok: true };
}

// ── Levels ─────────────────────────────────────────────────────────────────

export async function createLevel(
  input: Record<string, unknown>,
): Promise<AdminCatalogResult> {
  const code = String(input.code ?? "").trim().toUpperCase();
  const name = String(input.name ?? "").trim();
  const order = typeof input.order === "number" ? input.order : null;
  if (!code || !name || order == null) {
    return { ok: false, error: "Code, name and order are required." };
  }
  try {
    const created = await db.level.create({ data: { code, name, order } });
    return { ok: true, id: created.id };
  } catch (err) {
    return handleUnique(err, "A level with that code or order already exists.");
  }
}

export async function updateLevel(
  id: string,
  input: Record<string, unknown>,
): Promise<AdminCatalogResult> {
  const code = String(input.code ?? "").trim().toUpperCase();
  const name = String(input.name ?? "").trim();
  const order = typeof input.order === "number" ? input.order : null;
  if (!code || !name || order == null) {
    return { ok: false, error: "Code, name and order are required." };
  }
  try {
    await db.level.update({ where: { id }, data: { code, name, order } });
    return { ok: true };
  } catch (err) {
    return handleUnique(err, "A level with that code or order already exists.");
  }
}

export async function deleteLevel(id: string): Promise<AdminCatalogResult> {
  const deps = await db.course.count({ where: { levelId: id } });
  if (deps > 0) {
    return { ok: false, error: "Delete its courses first." };
  }
  await db.level.delete({ where: { id } });
  return { ok: true };
}

// ── Courses ────────────────────────────────────────────────────────────────

export async function createCourse(
  input: Record<string, unknown>,
): Promise<AdminCatalogResult> {
  const title = String(input.title ?? "").trim();
  const description = String(input.description ?? "").trim() || null;
  const languageId = String(input.languageId ?? "");
  const levelId = String(input.levelId ?? "");
  const status = String(input.status ?? "DRAFT");
  if (!title || !languageId || !levelId) {
    return { ok: false, error: "Title, language and level are required." };
  }
  try {
    const created = await db.course.create({
      data: { title, description, languageId, levelId, status },
    });
    return { ok: true, id: created.id };
  } catch (err) {
    return handleUnique(err, "That language already has this level.");
  }
}

export async function updateCourse(
  id: string,
  input: Record<string, unknown>,
): Promise<AdminCatalogResult> {
  const title = String(input.title ?? "").trim();
  const description = String(input.description ?? "").trim() || null;
  const languageId = String(input.languageId ?? "");
  const levelId = String(input.levelId ?? "");
  const status = String(input.status ?? "DRAFT");
  if (!title || !languageId || !levelId) {
    return { ok: false, error: "Title, language and level are required." };
  }
  try {
    await db.course.update({
      where: { id },
      data: { title, description, languageId, levelId, status },
    });
    return { ok: true };
  } catch (err) {
    return handleUnique(err, "That language already has this level.");
  }
}

export async function deleteCourse(id: string): Promise<AdminCatalogResult> {
  const [modules, learners] = await Promise.all([
    db.module.count({ where: { courseId: id } }),
    db.userLanguage.count({ where: { courseId: id } }),
  ]);
  if (modules > 0) {
    return { ok: false, error: "Delete its modules first." };
  }
  if (learners > 0) {
    return { ok: false, error: "Learners are enrolled in this course." };
  }
  await db.course.delete({ where: { id } });
  return { ok: true };
}

// ── Modules ────────────────────────────────────────────────────────────────

export async function createModule(
  input: Record<string, unknown>,
): Promise<AdminCatalogResult> {
  const title = String(input.title ?? "").trim();
  const description = String(input.description ?? "").trim() || null;
  const courseId = String(input.courseId ?? "");
  const order = typeof input.order === "number" ? input.order : null;
  if (!title || !courseId || order == null) {
    return { ok: false, error: "Title, course and order are required." };
  }
  try {
    const created = await db.module.create({
      data: { title, description, courseId, order },
    });
    return { ok: true, id: created.id };
  } catch (err) {
    return handleUnique(err, "A module with that order already exists in this course.");
  }
}

export async function updateModule(
  id: string,
  input: Record<string, unknown>,
): Promise<AdminCatalogResult> {
  const title = String(input.title ?? "").trim();
  const description = String(input.description ?? "").trim() || null;
  const order = typeof input.order === "number" ? input.order : null;
  if (!title || order == null) {
    return { ok: false, error: "Title and order are required." };
  }
  try {
    await db.module.update({ where: { id }, data: { title, description, order } });
    return { ok: true };
  } catch (err) {
    return handleUnique(err, "A module with that order already exists in this course.");
  }
}

export async function deleteModule(id: string): Promise<AdminCatalogResult> {
  const lessons = await db.lesson.count({ where: { moduleId: id } });
  if (lessons > 0) {
    return { ok: false, error: "Delete its lessons first." };
  }
  await db.module.delete({ where: { id } });
  return { ok: true };
}

// ── Lessons ────────────────────────────────────────────────────────────────

export async function createLesson(
  input: Record<string, unknown>,
): Promise<AdminCatalogResult> {
  const title = String(input.title ?? "").trim();
  const objective = String(input.objective ?? "").trim() || null;
  const notes = String(input.notes ?? "").trim() || null;
  const audioUrl = String(input.audioUrl ?? "").trim() || null;
  const status = String(input.status ?? "DRAFT");
  const moduleId = String(input.moduleId ?? "");
  const order = typeof input.order === "number" ? input.order : null;
  if (!title || !moduleId || order == null) {
    return { ok: false, error: "Title, module and order are required." };
  }
  try {
    const created = await db.lesson.create({
      data: { title, objective, notes, audioUrl, status, moduleId, order },
    });
    return { ok: true, id: created.id };
  } catch (err) {
    return handleUnique(err, "A lesson with that order already exists in this module.");
  }
}

export async function updateLesson(
  id: string,
  input: Record<string, unknown>,
): Promise<AdminCatalogResult> {
  const title = String(input.title ?? "").trim();
  const objective = String(input.objective ?? "").trim() || null;
  const notes = String(input.notes ?? "").trim() || null;
  const audioUrl = String(input.audioUrl ?? "").trim() || null;
  const status = String(input.status ?? "DRAFT");
  const order = typeof input.order === "number" ? input.order : null;
  if (!title || order == null) {
    return { ok: false, error: "Title and order are required." };
  }
  try {
    await db.lesson.update({
      where: { id },
      data: { title, objective, notes, audioUrl, status, order },
    });
    return { ok: true };
  } catch (err) {
    return handleUnique(err, "A lesson with that order already exists in this module.");
  }
}

export async function deleteLesson(id: string): Promise<AdminCatalogResult> {
  const [flashcards, exercises] = await Promise.all([
    db.flashcard.count({ where: { lessonId: id } }),
    db.exercise.count({ where: { lessonId: id } }),
  ]);
  if (flashcards > 0 || exercises > 0) {
    return { ok: false, error: "Delete its flashcards and exercises first." };
  }
  await db.lesson.delete({ where: { id } });
  return { ok: true };
}

// ── Flashcards ─────────────────────────────────────────────────────────────

export async function createFlashcard(
  input: Record<string, unknown>,
): Promise<AdminCatalogResult> {
  const lessonId = String(input.lessonId ?? "");
  const targetText = String(input.targetText ?? "").trim();
  const translation = String(input.translation ?? "").trim();
  const pronunciation = strOrNull(input.pronunciation);
  const exampleSentence = strOrNull(input.exampleSentence);
  const exampleTranslation = strOrNull(input.exampleTranslation);
  const partOfSpeech = strOrNull(input.partOfSpeech);
  const audioUrl = strOrNull(input.audioUrl);
  const imageUrl = strOrNull(input.imageUrl);
  const topic = strOrNull(input.topic);
  const difficulty = numOrNull(input.difficulty);
  const order = typeof input.order === "number" ? input.order : null;
  const status = String(input.status ?? "DRAFT");
  if (!lessonId || !targetText || !translation || order == null) {
    return { ok: false, error: "Lesson, target, translation and order are required." };
  }
  try {
    const created = await db.flashcard.create({
      data: {
        lessonId,
        targetText,
        translation,
        pronunciation,
        exampleSentence,
        exampleTranslation,
        partOfSpeech,
        audioUrl,
        imageUrl,
        topic,
        difficulty,
        order,
        status,
      },
    });
    return { ok: true, id: created.id };
  } catch (err) {
    return handleUnique(err, "A card with that order or target already exists in this lesson.");
  }
}

export async function updateFlashcard(
  id: string,
  input: Record<string, unknown>,
): Promise<AdminCatalogResult> {
  const targetText = String(input.targetText ?? "").trim();
  const translation = String(input.translation ?? "").trim();
  const pronunciation = strOrNull(input.pronunciation);
  const exampleSentence = strOrNull(input.exampleSentence);
  const exampleTranslation = strOrNull(input.exampleTranslation);
  const partOfSpeech = strOrNull(input.partOfSpeech);
  const audioUrl = strOrNull(input.audioUrl);
  const imageUrl = strOrNull(input.imageUrl);
  const topic = strOrNull(input.topic);
  const difficulty = numOrNull(input.difficulty);
  const order = typeof input.order === "number" ? input.order : null;
  const status = String(input.status ?? "DRAFT");
  if (!targetText || !translation || order == null) {
    return { ok: false, error: "Target, translation and order are required." };
  }
  try {
    await db.flashcard.update({
      where: { id },
      data: {
        targetText,
        translation,
        pronunciation,
        exampleSentence,
        exampleTranslation,
        partOfSpeech,
        audioUrl,
        imageUrl,
        topic,
        difficulty,
        order,
        status,
      },
    });
    return { ok: true };
  } catch (err) {
    return handleUnique(err, "A card with that order or target already exists in this lesson.");
  }
}

export async function deleteFlashcard(id: string): Promise<AdminCatalogResult> {
  await db.flashcard.delete({ where: { id } });
  return { ok: true };
}

// ── Exercises ──────────────────────────────────────────────────────────────

export async function createExercise(
  input: Record<string, unknown>,
): Promise<AdminCatalogResult> {
  const lessonId = String(input.lessonId ?? "");
  const prompt = String(input.prompt ?? "").trim();
  const type = String(input.type ?? "").trim();
  const order = typeof input.order === "number" ? input.order : null;
  const status = String(input.status ?? "DRAFT");
  const content = asJson(input.content);
  const answer = asJson(input.answer);
  if (!lessonId || !prompt || !type || order == null) {
    return { ok: false, error: "Lesson, prompt, type and order are required." };
  }
  if (content === undefined) {
    return { ok: false, error: "Exercise content is required." };
  }
  try {
    const created = await db.exercise.create({
      data: { lessonId, prompt, type, status, order, content, answer },
    });
    return { ok: true, id: created.id };
  } catch (err) {
    return handleUnique(err, "An exercise with that order already exists in this lesson.");
  }
}

export async function updateExercise(
  id: string,
  input: Record<string, unknown>,
): Promise<AdminCatalogResult> {
  const prompt = String(input.prompt ?? "").trim();
  const type = String(input.type ?? "").trim();
  const order = typeof input.order === "number" ? input.order : null;
  const status = String(input.status ?? "DRAFT");
  const content = asJson(input.content);
  const answer = asJson(input.answer);
  if (!prompt || !type || order == null) {
    return { ok: false, error: "Prompt, type and order are required." };
  }
  if (content === undefined) {
    return { ok: false, error: "Exercise content is required." };
  }
  try {
    await db.exercise.update({
      where: { id },
      data: { prompt, type, status, order, content, answer },
    });
    return { ok: true };
  } catch (err) {
    return handleUnique(err, "An exercise with that order already exists in this lesson.");
  }
}

export async function deleteExercise(id: string): Promise<AdminCatalogResult> {
  await db.exercise.delete({ where: { id } });
  return { ok: true };
}

// ── helpers ────────────────────────────────────────────────────────────────

function strOrNull(value: unknown): string | null {
  const s = String(value ?? "").trim();
  return s ? s : null;
}

function numOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Prisma.InputJsonValue;
    } catch {
      return undefined;
    }
  }
  return value as Prisma.InputJsonValue;
}