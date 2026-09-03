"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type QuestionRow = { prompt: string; options: string; answerIndex: number };

export type ExerciseFormValue = {
  id?: string;
  prompt: string;
  type: string;
  order: number;
  status: string;
  content: Record<string, unknown> | null;
  answer: Record<string, unknown> | null;
};

type Props = {
  exercise?: ExerciseFormValue | null;
  create: (data: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>;
  update: (id: string, data: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>;
  remove: (id: string) => Promise<{ ok: boolean; error?: string }>;
  successRedirect?: string;
};

const inputClass =
  "flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-600";

const WRITING_KINDS = ["translation", "fill-blank", "word-order"] as const;

type FormState = {
  prompt: string;
  type: string;
  order: number;
  status: string;
  kind: string;
  source: string;
  sentence: string;
  hint: string;
  words: string;
  expected: string;
  accept: string;
  passage: string;
  audioUrl: string;
  transcript: string;
  targetText: string;
  translation: string;
  questions: QuestionRow[];
};

function parseQuestions(
  content: Record<string, unknown> | null,
): QuestionRow[] {
  const qs = Array.isArray(content?.questions)
    ? (content.questions as unknown[])
    : [];
  return qs.map((q) => {
    const row = q as { prompt?: string; options?: unknown[]; answerIndex?: unknown };
    return {
      prompt: typeof row.prompt === "string" ? row.prompt : "",
      options: Array.isArray(row.options) ? row.options.join("\n") : "",
      answerIndex: typeof row.answerIndex === "number" ? row.answerIndex : 0,
    };
  });
}

export function ExerciseForm({
  exercise,
  create,
  update,
  remove,
  successRedirect,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isNew = !exercise;
  const initialKind =
    typeof exercise?.content?.kind === "string"
      ? exercise.content.kind
      : "translation";

  const initialState: FormState = {
    prompt: exercise?.prompt ?? "",
    type: exercise?.type ?? "WRITING",
    order: exercise?.order ?? 1,
    status: exercise?.status ?? "DRAFT",
    kind:
      WRITING_KINDS.includes(initialKind as (typeof WRITING_KINDS)[number])
        ? initialKind
        : "translation",
    source: stringOf(exercise?.content?.source),
    sentence: stringOf(exercise?.content?.sentence),
    hint: stringOf(exercise?.content?.hint),
    words: Array.isArray(exercise?.content?.words)
      ? (exercise.content.words as unknown[]).join("\n")
      : "",
    expected: stringOf(exercise?.answer?.expected) || stringOf(exercise?.content?.targetText),
    accept: Array.isArray(exercise?.answer?.accept)
      ? (exercise.answer.accept as unknown[]).join("\n")
      : "",
    passage: stringOf(exercise?.content?.passage),
    audioUrl: stringOf(exercise?.content?.audioUrl),
    transcript: stringOf(exercise?.content?.transcript),
    targetText: stringOf(exercise?.content?.targetText),
    translation: stringOf(exercise?.content?.translation),
    questions: parseQuestions(exercise?.content ?? null),
  };

  const [form, setForm] = useState<FormState>(initialState);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm({ ...form, [key]: value });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const payload = buildPayload(form);
      if (!payload) {
        toast.error("Please fill in the required fields.");
        return;
      }
      const result = isNew ? await create(payload) : await update(exercise.id!, payload);
      if (result.ok) {
        toast.success(isNew ? "Created" : "Saved");
        if (successRedirect) router.push(successRedirect);
        else router.refresh();
      } else {
        toast.error(result.error ?? "Could not save");
      }
    });
  }

  function handleDelete() {
    if (!exercise) return;
    if (!confirm("Are you sure you want to delete this exercise?")) return;
    startTransition(async () => {
      const result = await remove(exercise.id!);
      if (result.ok) {
        toast.success("Deleted");
        router.push(successRedirect ?? "/admin");
      } else {
        toast.error(result.error ?? "Could not delete");
      }
    });
  }

  const isWriting = form.type === "WRITING";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Prompt" required>
        <Input
          name="prompt"
          value={form.prompt}
          onChange={(e) => set("prompt", e.target.value)}
          placeholder="e.g. Translate to Spanish:"
          required
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Type" required>
          <select
            className={inputClass}
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
          >
            <option value="WRITING">Writing</option>
            <option value="READING">Reading</option>
            <option value="LISTENING">Listening</option>
            <option value="SPEAKING">Speaking</option>
          </select>
        </Field>
        <Field label="Order" required>
          <Input
            name="order"
            type="number"
            value={form.order}
            onChange={(e) => set("order", Number(e.target.value))}
            required
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Status" required>
        <select
          className={inputClass}
          value={form.status}
          onChange={(e) => set("status", e.target.value)}
        >
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </Field>

      {isWriting && (
        <>
          <Field label="Writing kind" required>
            <select
              className={inputClass}
              value={form.kind}
              onChange={(e) => set("kind", e.target.value)}
            >
              {WRITING_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k.replace("-", " ")}
                </option>
              ))}
            </select>
          </Field>

          {form.kind === "translation" && (
            <>
              <Field label="Source text" required>
                <Input
                  value={form.source}
                  onChange={(e) => set("source", e.target.value)}
                  placeholder="e.g. Good morning"
                  className={inputClass}
                />
              </Field>
            </>
          )}

          {form.kind === "fill-blank" && (
            <>
              <Field label="Sentence (use ___ for blank)" required>
                <Input
                  value={form.sentence}
                  onChange={(e) => set("sentence", e.target.value)}
                  placeholder="e.g. ___ noches."
                  className={inputClass}
                />
              </Field>
              <Field label="Hint">
                <Input
                  value={form.hint}
                  onChange={(e) => set("hint", e.target.value)}
                  placeholder="e.g. said when going to bed"
                  className={inputClass}
                />
              </Field>
            </>
          )}

          {form.kind === "word-order" && (
            <>
              <Field label="Words (one per line)" required>
                <textarea
                  value={form.words}
                  onChange={(e) => set("words", e.target.value)}
                  rows={3}
                  className={cn(inputClass, "h-auto py-2")}
                  placeholder={"Buenas\nnoches\nseñor"}
                />
              </Field>
            </>
          )}

          <Field label="Expected answer" required>
            <Input
              value={form.expected}
              onChange={(e) => set("expected", e.target.value)}
              placeholder="e.g. Buenos días"
              className={inputClass}
            />
          </Field>
          <Field label="Accepted variations (one per line)">
            <textarea
              value={form.accept}
              onChange={(e) => set("accept", e.target.value)}
              rows={2}
              className={cn(inputClass, "h-auto py-2")}
              placeholder={"Buenos dias"}
            />
          </Field>
        </>
      )}

      {form.type === "READING" && (
        <>
          <Field label="Passage" required>
            <textarea
              value={form.passage}
              onChange={(e) => set("passage", e.target.value)}
              rows={5}
              className={cn(inputClass, "h-auto py-2")}
            />
          </Field>
          <QuestionsEditor
            questions={form.questions}
            onChange={(questions) => set("questions", questions)}
          />
        </>
      )}

      {form.type === "LISTENING" && (
        <>
          <Field label="Audio URL" required>
            <Input
              value={form.audioUrl}
              onChange={(e) => set("audioUrl", e.target.value)}
              placeholder="/audio/es/listening/example.mp3"
              className={inputClass}
            />
          </Field>
          <Field label="Transcript">
            <textarea
              value={form.transcript}
              onChange={(e) => set("transcript", e.target.value)}
              rows={3}
              className={cn(inputClass, "h-auto py-2")}
            />
          </Field>
          <QuestionsEditor
            questions={form.questions}
            onChange={(questions) => set("questions", questions)}
          />
        </>
      )}

      {form.type === "SPEAKING" && (
        <>
          <Field label="Target text" required>
            <Input
              value={form.targetText}
              onChange={(e) => set("targetText", e.target.value)}
              placeholder="e.g. Buenos días"
              className={inputClass}
            />
          </Field>
          <Field label="Translation">
            <Input
              value={form.translation}
              onChange={(e) => set("translation", e.target.value)}
              placeholder="e.g. Good morning"
              className={inputClass}
            />
          </Field>
          <Field label="Audio URL">
            <Input
              value={form.audioUrl}
              onChange={(e) => set("audioUrl", e.target.value)}
              placeholder="/audio/es/speaking/example.mp3"
              className={inputClass}
            />
          </Field>
        </>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : isNew ? "Create" : "Save"}
        </Button>
        {!isNew && (
          <Button type="button" variant="destructive" disabled={isPending} onClick={handleDelete}>
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}

function QuestionsEditor({
  questions,
  onChange,
}: {
  questions: QuestionRow[];
  onChange: (q: QuestionRow[]) => void;
}) {
  function updateRow(index: number, patch: Partial<QuestionRow>) {
    const next = questions.map((q, i) => (i === index ? { ...q, ...patch } : q));
    onChange(next);
  }
  function removeRow(index: number) {
    onChange(questions.filter((_, i) => i !== index));
  }
  function addRow() {
    onChange([...questions, { prompt: "", options: "", answerIndex: 0 }]);
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <Label>Questions</Label>
        <Button type="button" size="sm" variant="outline" onClick={addRow}>
          Add question
        </Button>
      </div>
      {questions.length === 0 && (
        <p className="text-sm text-zinc-500">No questions yet.</p>
      )}
      {questions.map((q, i) => {
        const options = q.options
          .split("\n")
          .map((o) => o.trim())
          .filter(Boolean);
        return (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-400">Q{i + 1}</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="ml-auto text-zinc-400"
                onClick={() => removeRow(i)}
              >
                Remove
              </Button>
            </div>
            <Input
              value={q.prompt}
              onChange={(e) => updateRow(i, { prompt: e.target.value })}
              placeholder="Question prompt"
              className={inputClass}
            />
            <textarea
              value={q.options}
              onChange={(e) => updateRow(i, { options: e.target.value })}
              rows={2}
              placeholder={"Option A\nOption B\nOption C"}
              className={cn(inputClass, "h-auto py-2")}
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">Correct answer:</span>
              <select
                value={q.answerIndex}
                onChange={(e) => updateRow(i, { answerIndex: Number(e.target.value) })}
                className={cn(inputClass, "w-auto")}
              >
                {options.map((_, oi) => (
                  <option key={oi} value={oi}>
                    {oi + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        {label}
        {required && <span className="text-zinc-400"> *</span>}
      </Label>
      {children}
    </div>
  );
}

function stringOf(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function buildPayload(form: FormState): Record<string, unknown> | null {
  const base = {
    prompt: form.prompt.trim(),
    type: form.type,
    order: Number(form.order),
    status: form.status,
  };
  if (!base.prompt) return null;

  let content: Record<string, unknown> | null = null;
  let answer: Record<string, unknown> | null = null;

  if (form.type === "WRITING") {
    const expected = form.expected.trim();
    const accept = form.accept.split("\n").map((a: string) => a.trim()).filter(Boolean);
    if (!expected) return null;
    answer = { expected, ...(accept.length ? { accept } : {}) };
    if (form.kind === "translation") {
      const source = form.source.trim();
      if (!source) return null;
      content = { kind: "translation", source };
    } else if (form.kind === "fill-blank") {
      const sentence = form.sentence.trim();
      if (!sentence) return null;
      content = { kind: "fill-blank", sentence, hint: form.hint.trim() || undefined };
    } else if (form.kind === "word-order") {
      const words = form.words.split("\n").map((w: string) => w.trim()).filter(Boolean);
      if (words.length === 0) return null;
      content = { kind: "word-order", words };
    }
  } else if (form.type === "READING") {
    const passage = form.passage.trim();
    const questions = buildQuestions(form.questions);
    if (!passage || questions.length === 0) return null;
    content = { kind: "reading", passage, questions };
  } else if (form.type === "LISTENING") {
    const audioUrl = form.audioUrl.trim();
    const questions = buildQuestions(form.questions);
    if (!audioUrl || questions.length === 0) return null;
    content = {
      kind: "listening",
      audioUrl,
      transcript: form.transcript.trim() || undefined,
      questions,
    };
  } else if (form.type === "SPEAKING") {
    const targetText = form.targetText.trim();
    if (!targetText) return null;
    content = {
      kind: "speaking",
      targetText,
      translation: form.translation.trim() || undefined,
      audioUrl: form.audioUrl.trim() || undefined,
    };
  }

  if (!content) return null;
  return { ...base, content, answer };
}

function buildQuestions(rows: QuestionRow[]): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  for (const row of rows) {
    const prompt = row.prompt.trim();
    const options = row.options
      .split("\n")
      .map((o) => o.trim())
      .filter(Boolean);
    if (!prompt || options.length < 2) continue;
    const answerIndex = Math.min(Math.max(row.answerIndex, 0), options.length - 1);
    result.push({ prompt, options, answerIndex });
  }
  return result;
}