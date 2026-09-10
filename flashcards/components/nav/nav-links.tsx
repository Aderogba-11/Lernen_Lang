"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3Icon,
  BookOpenIcon,
  GlobeIcon,
  RefreshCwIcon,
  type LucideIcon,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon };

const ITEMS: NavItem[] = [
  { href: "/learn", label: "Learn", icon: BookOpenIcon },
  { href: "/review", label: "Review", icon: RefreshCwIcon },
  { href: "/progress", label: "Progress", icon: BarChart3Icon },
  { href: "/languages", label: "Languages", icon: GlobeIcon },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex min-w-0 items-center gap-1 overflow-x-auto">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/languages"
            ? pathname === "/languages" || pathname.startsWith("/languages/")
            : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium ${
              active
                ? "bg-zinc-200/70 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}