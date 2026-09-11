"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { startLanguage } from "../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type LevelStatus = "new" | "switch" | "active";

export type LevelOption = {
  code: string;
  name: string;
  available: boolean;
  status: LevelStatus;
};

export function LevelPicker({
  languageCode,
  languageName,
  levels,
}: {
  languageCode: string;
  languageName: string;
  levels: LevelOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function choose(levelCode: string) {
    startTransition(async () => {
      const result = await startLanguage(languageCode, levelCode);
      if (result.ok) {
        router.push("/learn");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      {levels.map((level) => (
        <Card
          key={level.code}
          className={level.available ? "" : "opacity-60"}
        >
          <CardHeader>
            <CardTitle>
              {level.code}
              <span className="ml-2 text-base font-normal text-zinc-500">
                {level.name}
              </span>
            </CardTitle>
            <CardDescription>
              {level.available
                ? level.status === "active"
                  ? `You are learning ${languageName} at ${level.code}`
                  : level.status === "switch"
                    ? `Switch ${languageName} to ${level.code}`
                    : `Start ${languageName} at ${level.code}`
                : "No course published yet"}
            </CardDescription>
            <CardAction>
              {level.status === "active" && level.available ? (
                <Badge>Active</Badge>
              ) : (
                <Button
                  size="sm"
                  disabled={!level.available || isPending}
                  onClick={() => choose(level.code)}
                >
                  {!level.available
                    ? "Unavailable"
                    : isPending
                      ? "Starting…"
                      : level.status === "switch"
                        ? `Switch to ${level.code}`
                        : "Start"}
                </Button>
              )}
            </CardAction>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
