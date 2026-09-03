"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import {
  createCourse as createCourseLib,
  createLanguage as createLanguageLib,
  createLevel as createLevelLib,
  createModule as createModuleLib,
  deleteCourse as deleteCourseLib,
  deleteLanguage as deleteLanguageLib,
  deleteLevel as deleteLevelLib,
  deleteModule as deleteModuleLib,
  updateCourse as updateCourseLib,
  updateLanguage as updateLanguageLib,
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