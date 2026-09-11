import Link from "next/link";
import { BellIcon } from "lucide-react";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { Button } from "@/components/ui/button";

export async function NotificationBell({
  user,
}: {
  user: { id: string };
}) {
  const unread = await getUnreadNotificationCount(user.id);

  return (
    <Button asChild variant="outline" size="sm" aria-label="Notifications">
      <Link href="/notifications" className="relative">
        <BellIcon className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none text-destructive-foreground">
            {unread}
          </span>
        )}
      </Link>
    </Button>
  );
}