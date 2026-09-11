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
    <main className="flex flex-1 items-center justify-center bg-background p-4 sm:p-6">
      <AccountPanel
        initialName={user.name}
        email={user.email}
        createdAt={user.createdAt.toISOString()}
      />
    </main>
  );
}
