"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import {
  updateAccountSchema,
  type UpdateAccountInput,
} from "@/lib/validation";
import { updateAccountName } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";

export function AccountPanel({
  initialName,
  email,
  createdAt,
}: {
  initialName: string;
  email: string;
  createdAt: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateAccountInput>({
    resolver: zodResolver(updateAccountSchema),
    defaultValues: { name: initialName },
  });

  async function signOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  function onSubmit(values: UpdateAccountInput) {
    startTransition(async () => {
      const result = await updateAccountName(values);
      if (result.ok) {
        toast.success("Account updated.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Your account</CardTitle>
        <CardDescription>
          Member since{" "}
          {new Date(createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input id="name" type="text" {...register("name")} />
              {errors.name && <FieldError errors={[errors.name]} />}
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" value={email} disabled />
            </Field>
            <Button type="submit" disabled={isPending || !isDirty}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </FieldGroup>
        </form>
        <Separator className="my-6" />
        <div className="flex flex-col gap-2">
          <Button asChild variant="outline" className="w-full">
            <Link href="/progress">My progress</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/languages">My languages</Link>
          </Button>
          <Button variant="outline" onClick={signOut} className="w-full">
            Sign out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
