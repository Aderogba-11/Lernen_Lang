"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type AdminField = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select" | "checkbox";
  value?: string | number | boolean | null;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
};

type AdminFormProps = {
  fields: AdminField[];
  action: (data: Record<string, unknown>) => Promise<{
    ok: boolean;
    error?: string;
  }>;
  successMessage?: string;
  successRedirect?: string;
  deleteAction?: (id: string) => Promise<{
    ok: boolean;
    error?: string;
  }>;
  deleteId?: string;
  deleteRedirect?: string;
};

const inputClass =
  "flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-600";

export function AdminForm({
  fields,
  action,
  successMessage,
  successRedirect,
  deleteAction,
  deleteId,
  deleteRedirect,
}: AdminFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {};
    for (const field of fields) {
      if (field.type === "checkbox") {
        data[field.name] = form.get(field.name) === "on";
      } else if (field.type === "number") {
        const raw = form.get(field.name);
        data[field.name] = raw !== null && raw !== "" ? Number(raw) : null;
      } else {
        data[field.name] = form.get(field.name) ?? "";
      }
    }

    startTransition(async () => {
      const result = await action(data);
      if (result.ok) {
        toast.success(successMessage ?? "Saved");
        if (successRedirect) router.push(successRedirect);
        else router.refresh();
      } else {
        toast.error(result.error ?? "Could not save");
      }
    });
  }

  function handleDelete() {
    if (!deleteAction || !deleteId) return;
    if (!confirm("Are you sure you want to delete this?")) return;
    startTransition(async () => {
      const result = await deleteAction(deleteId);
      if (result.ok) {
        toast.success("Deleted");
        router.push(deleteRedirect ?? "/admin");
      } else {
        toast.error(result.error ?? "Could not delete");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-1.5">
          <Label htmlFor={field.name}>{field.label}</Label>
          {field.type === "textarea" ? (
            <textarea
              id={field.name}
              name={field.name}
              defaultValue={field.value == null ? "" : String(field.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={3}
              className={cn(inputClass, "h-auto py-2")}
            />
          ) : field.type === "select" && field.options ? (
            <select
              id={field.name}
              name={field.name}
              defaultValue={field.value == null ? "" : String(field.value)}
              className={inputClass}
            >
              <option value="" disabled>
                {field.placeholder ?? "Select…"}
              </option>
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : field.type === "checkbox" ? (
            <div className="flex items-center gap-2">
              <input
                id={field.name}
                name={field.name}
                type="checkbox"
                defaultChecked={!!field.value}
                className="h-4 w-4 rounded border-zinc-300"
              />
              <span className="text-sm text-zinc-500">{field.placeholder}</span>
            </div>
          ) : (
            <Input
              id={field.name}
              name={field.name}
              type={field.type ?? "text"}
              defaultValue={field.value == null ? "" : String(field.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          )}
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
        {deleteAction && deleteId && (
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}