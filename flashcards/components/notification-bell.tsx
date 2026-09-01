import Link from "next/link";
import { BellIcon } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { Button } from "@/components/ui/button";

export async function NotificationBell() {
  const user = await getSessionUser();
  if (!user) return null;
  const unread = await getUnreadNotificationCount(user.id);

  return (
    <Button asChild variant="outline" size="sm" aria-label="Notifications">
      <Link href="/notifications" className="relative">
        <BellIcon className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] leading-none text-white">
            {unread}
          </span>
        )}
      </Link>
    </Button>
  );
}