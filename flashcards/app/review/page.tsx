import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getReviewQueue } from "@/lib/review";
import { Button } from "@/components/ui/button";
import { ReviewSession } from "./review-client";

export const metadata = { title: "Review — Lernen Lang" };

export default async function ReviewPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const queue = await getReviewQueue(user.id);

  return (
    <main className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 p-6 dark:bg-black">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">
          Review
          {queue.length > 0 && (
            <span className="ml-2 text-sm font-normal text-zinc-500">
              {queue.length} card{queue.length === 1 ? "" : "s"} due
            </span>
          )}
        </h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/learn">Back to course</Link>
        </Button>
      </div>

      <ReviewSession queue={queue} />
    </main>
  );
}
