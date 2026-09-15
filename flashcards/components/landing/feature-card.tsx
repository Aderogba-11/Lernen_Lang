import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
};

export function FeatureCard({ icon: Icon, title, description, className }: FeatureCardProps) {
  return (
    <Card
      className={cn(
        "group h-full border-border/70 bg-card p-6 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_12px_32px_-12px_rgba(16,185,129,0.25)]",
        className
      )}
    >
      <CardContent className="flex h-full flex-col items-start gap-3 px-0 py-0">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-colors group-hover:bg-primary/15">
          <Icon aria-hidden className="size-5" />
        </div>
        <CardTitle className="font-heading text-base">{title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
