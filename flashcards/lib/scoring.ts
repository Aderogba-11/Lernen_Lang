export type ReadingQuestion = {
  prompt: string;
  options: string[];
  answerIndex: number;
};

export type ReadingScore = {
  total: number;
  correct: number;
  results: boolean[];
  correctAnswers: number[];
};

export function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function scoreMcq(
  questions: ReadingQuestion[],
  selections: number[],
): ReadingScore | { error: string } {
  if (selections.length !== questions.length) {
    return { error: "Please answer every question." };
  }

  const results: boolean[] = [];
  const correctAnswers: number[] = [];

  for (const [index, question] of questions.entries()) {
    const selection = selections[index];
    if (
      !Number.isInteger(selection) ||
      selection < 0 ||
      selection >= question.options.length
    ) {
      return { error: `Invalid selection for question ${index + 1}.` };
    }
    results.push(selection === question.answerIndex);
    correctAnswers.push(question.answerIndex);
  }

  const correct = results.filter(Boolean).length;
  return { total: questions.length, correct, results, correctAnswers };
}

export const scoreReading = scoreMcq;

export function normalizeWriting(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.,;:!?¡¿"'“”‘’()[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function scoreWriting(
  expected: string,
  accept: string[],
  response: string,
): boolean {
  const normalized = normalizeWriting(response);
  if (normalized.length === 0) return false;
  return normalizeWriting(expected) === normalized ||
    accept.some((variant) => normalizeWriting(variant) === normalized);
}
