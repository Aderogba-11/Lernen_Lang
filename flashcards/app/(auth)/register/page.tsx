import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Create account — Lernen Lang" };

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/account");
  }
  return <RegisterForm />;
}
