"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import {
  createCourse as createCourseLib,
  createExercise as createExerciseLib,
  createFlashcard as createFlashcardLib,
  createLanguage as createLanguageLib,
  createLesson as createLessonLib,
  createLevel as createLevelLib,
  createModule as createModuleLib,
  deleteCourse as deleteCourseLib,
  deleteExercise as deleteExerciseLib,
  deleteFlashcard as deleteFlashcardLib,
  deleteLanguage as deleteLanguageLib,
  deleteLesson as deleteLessonLib,
  deleteLevel as deleteLevelLib,
  deleteModule as deleteModuleLib,
  updateCourse as updateCourseLib,
  updateExercise as updateExerciseLib,
  updateFlashcard as updateFlashcardLib,
  updateLanguage as updateLanguageLib,
  updateLesson as updateLessonLib,
  updateLevel as updateLevelLib,
  updateModule as updateModuleLib,
} from "@/lib/admin-catalog";

async function guard() {
  await requireAdmin();
  revalidatePath("/admin");
}

export async function createLanguage(data: Record<string, unknown>) {
  await guard();
  return createLanguageLib(data);
}

export async function updateLanguage(id: string, data: Record<string, unknown>) {
  await guard();
  return updateLanguageLib(id, data);
}

export async function deleteLanguage(id: string) {
  await guard();
  return deleteLanguageLib(id);
}

export async function createLevel(data: Record<string, unknown>) {
  await guard();
  return createLevelLib(data);
}

export async function updateLevel(id: string, data: Record<string, unknown>) {
  await guard();
  return updateLevelLib(id, data);
}

export async function deleteLevel(id: string) {
  await guard();
  return deleteLevelLib(id);
}

export async function createCourse(data: Record<string, unknown>) {
  await guard();
  return createCourseLib(data);
}

export async function updateCourse(id: string, data: Record<string, unknown>) {
  await guard();
  return updateCourseLib(id, data);
}

export async function deleteCourse(id: string) {
  await guard();
  return deleteCourseLib(id);
}

export async function createModule(data: Record<string, unknown>) {
  await guard();
  return createModuleLib(data);
}

export async function updateModule(id: string, data: Record<string, unknown>) {
  await guard();
  return updateModuleLib(id, data);
}

export async function deleteModule(id: string) {
  await guard();
  return deleteModuleLib(id);
}

export async function createLesson(data: Record<string, unknown>) {
  await guard();
  return createLessonLib(data);
}

export async function updateLesson(id: string, data: Record<string, unknown>) {
  await guard();
  return updateLessonLib(id, data);
}

export async function deleteLesson(id: string) {
  await guard();
  return deleteLessonLib(id);
}

export async function createFlashcard(data: Record<string, unknown>) {
  await guard();
  return createFlashcardLib(data);
}

export async function updateFlashcard(id: string, data: Record<string, unknown>) {
  await guard();
  return updateFlashcardLib(id, data);
}

export async function deleteFlashcard(id: string) {
  await guard();
  return deleteFlashcardLib(id);
}

export async function createExercise(data: Record<string, unknown>) {
  await guard();
  return createExerciseLib(data);
}

export async function updateExercise(id: string, data: Record<string, unknown>) {
  await guard();
  return updateExerciseLib(id, data);
}

export async function deleteExercise(id: string) {
  await guard();
  return deleteExerciseLib(id);
}