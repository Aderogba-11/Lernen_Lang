import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getReviewQueue } from "@/lib/review";
import { ReviewSession } from "./review-client";

export const metadata = { title: "Review — Lernen Lang" };

export default async function ReviewPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const queue = await getReviewQueue(user.id);

  return (
    <main className="flex flex-1 flex-col items-center gap-6 bg-background p-4 sm:p-6">
      <h1 className="w-full max-w-2xl text-2xl font-bold tracking-tight">
        Review
        {queue.length > 0 && (
          <span className="ml-2 text-base font-normal text-muted-foreground">
            {queue.length} card{queue.length === 1 ? "" : "s"} due
          </span>
        )}
      </h1>

      <ReviewSession queue={queue} />
    </main>
  );
}
