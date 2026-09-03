import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import type { AdminField } from "@/components/admin/admin-form";
import { AdminForm } from "@/components/admin/admin-form";
import {
  createLanguage,
  deleteLanguage,
  updateLanguage,
} from "@/app/admin/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Language — Admin" };

export default async function LanguagePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/dashboard");

  const isNew = params.id === "new";
  const language = isNew
    ? null
    : await db.language.findUnique({ where: { id: params.id } });
  if (!isNew && !language) redirect("/admin");

  const fields: AdminField[] = [
    {
      name: "code",
      label: "Code",
      value: language?.code,
      placeholder: "e.g. es",
      required: true,
    },
    {
      name: "name",
      label: "Name",
      value: language?.name,
      placeholder: "e.g. Spanish",
      required: true,
    },
    {
      name: "nativeName",
      label: "Native name",
      value: language?.nativeName,
      placeholder: "e.g. Español",
      required: true,
    },
    ...(language
      ? [
          {
            name: "isActive",
            label: "Active",
            type: "checkbox" as const,
            value: language.isActive,
            placeholder: "Visible to learners",
          },
        ]
      : []),
  ];

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-black">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{isNew ? "New language" : "Language"}</CardTitle>
          <CardDescription>
            {isNew
              ? "Add a language to the catalogue."
              : `${language!.name} (${language!.code})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminForm
            fields={fields}
            action={(d) =>
              isNew ? createLanguage(d) : updateLanguage(params.id, d)
            }
            successRedirect={isNew ? "/admin" : undefined}
            deleteAction={isNew ? undefined : deleteLanguage}
            deleteId={isNew ? undefined : params.id}
            deleteRedirect="/admin"
          />
        </CardContent>
      </Card>
    </main>
  );
}