import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import type { AdminField } from "@/components/admin/admin-form";
import { AdminForm } from "@/components/admin/admin-form";
import {
  createLevel,
  deleteLevel,
  updateLevel,
} from "@/app/admin/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Level — Admin" };

export default async function LevelPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/dashboard");

  const isNew = params.id === "new";
  const level = isNew
    ? null
    : await db.level.findUnique({ where: { id: params.id } });
  if (!isNew && !level) redirect("/admin");

  const fields: AdminField[] = [
    {
      name: "code",
      label: "Code",
      value: level?.code,
      placeholder: "e.g. A1",
      required: true,
    },
    {
      name: "name",
      label: "Name",
      value: level?.name,
      placeholder: "e.g. Beginner",
      required: true,
    },
    {
      name: "order",
      label: "Order",
      type: "number",
      value: level?.order,
      required: true,
    },
  ];

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-black">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{isNew ? "New level" : "Level"}</CardTitle>
          <CardDescription>
            Levels are shared across all languages (e.g. A1, A2, B1).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminForm
            fields={fields}
            action={(d) =>
              isNew ? createLevel(d) : updateLevel(params.id, d)
            }
            successRedirect={isNew ? "/admin" : undefined}
            deleteAction={isNew ? undefined : deleteLevel}
            deleteId={isNew ? undefined : params.id}
            deleteRedirect="/admin"
          />
        </CardContent>
      </Card>
    </main>
  );
}