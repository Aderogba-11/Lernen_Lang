import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { AccountPanel } from "./account-panel";

export const metadata = { title: "Account — Lernen Lang" };

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-black">
      <AccountPanel
        initialName={user.name}
        email={user.email}
        createdAt={user.createdAt.toISOString()}
      />
    </main>
  );
}
