import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  isEmpty,
  className,
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: LucideIcon;
  isEmpty?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn(className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {Icon ? (
            <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
              <Icon className="h-3.5 w-3.5 text-primary" />
            </div>
          ) : null}
        </div>
        <p
          className={cn(
            "mt-2 font-display text-2xl font-semibold tabular-nums",
            isEmpty && "text-muted-foreground"
          )}
        >
          {value}
        </p>
        {delta ? (
          <p className={cn("mt-1 text-xs", isEmpty ? "text-muted-foreground" : "text-success")}>
            {delta}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}