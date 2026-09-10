import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(70, "Name must be at most 70 characters"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(70, "Name must be at most 70 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

export const rateFlashcardSchema = z.object({
  flashcardId: z.string().min(1),
  rating: z.enum(["AGAIN", "HARD", "GOOD", "EASY"]),
});

export const scoreExerciseSchema = z.object({
  lessonId: z.string().min(1),
  exerciseId: z.string().min(1),
});

export const scoreReadingSchema = scoreExerciseSchema.extend({
  selections: z.array(z.number().min(0).max(20)).min(1).max(20),
});

export const scoreListeningSchema = scoreExerciseSchema.extend({
  selections: z.array(z.number().min(0).max(20)).min(1).max(20),
});

export const scoreWritingSchema = scoreExerciseSchema.extend({
  response: z.string().trim().min(1, "Response is required").max(2000),
});

export const scoreSpeakingSchema = scoreExerciseSchema.extend({
  transcript: z.string().trim().min(1, "Transcript is required").max(2000),
});

export const completeLessonSchema = z.object({
  lessonId: z.string().min(1),
});
