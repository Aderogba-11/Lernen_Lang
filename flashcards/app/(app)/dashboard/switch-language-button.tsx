"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { setActiveEnrollment } from "@/app/languages/actions";
import { Button } from "@/components/ui/button";

export function SwitchLanguageButton({
  enrollmentId,
}: {
  enrollmentId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo() {
    startTransition(async () => {
      const result = await setActiveEnrollment(enrollmentId);
      if (result.ok) {
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={switchTo}
    >
      {isPending ? "Switching…" : "Switch"}
    </Button>
  );
}