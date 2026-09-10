"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  setActiveEnrollment,
} from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type EnrollmentView = {
  id: string;
  isActive: boolean;
  languageName: string;
  languageCode: string;
  nativeName: string;
  courseTitle: string | null;
  levelCode: string | null;
};

export function EnrollmentList({ enrollments }: { enrollments: EnrollmentView[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function makeActive(id: string) {
    startTransition(async () => {
      const result = await setActiveEnrollment(id);
      if (result.ok) {
        toast.success("Active language updated.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (enrollments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your languages</CardTitle>
          <CardDescription>
            You have not started learning any language yet. Pick one below to
            begin.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {enrollments.map((enrollment) => (
        <Card key={enrollment.id}>
          <CardHeader>
            <CardTitle>
              {enrollment.languageName}
              <span className="ml-2 text-base font-normal text-zinc-500">
                {enrollment.nativeName}
              </span>
            </CardTitle>
            <CardDescription>
              {enrollment.courseTitle
                ? `${enrollment.courseTitle}`
                : "No course selected yet"}
            </CardDescription>
            <CardAction>
              {enrollment.isActive ? (
                <Badge>Active</Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => makeActive(enrollment.id)}
                >
                  Make active
                </Button>
              )}
            </CardAction>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
