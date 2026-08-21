import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in — Lernen Lang" };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/account");
  }
  return <LoginForm />;
}
