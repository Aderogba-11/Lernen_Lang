"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { markAllReadAction, markReadAction } from "./actions";
import { Button } from "@/components/ui/button";

export function MarkAllReadButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = await markAllReadAction();
      if (result.ok) {
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not mark as read.");
      }
    });
  }

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={disabled || isPending}
      onClick={run}
    >
      {isPending ? "Marking…" : "Mark all as read"}
    </Button>
  );
}

export function MarkReadButton({
  notificationId,
}: {
  notificationId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = await markReadAction([notificationId]);
      if (result.ok) {
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not mark as read.");
      }
    });
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={isPending}
      onClick={run}
    >
      {isPending ? "Marking…" : "Mark read"}
    </Button>
  );
}