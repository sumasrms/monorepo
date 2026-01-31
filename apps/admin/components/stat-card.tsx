import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { LucideIcon } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  badgeText?: string;
  badgeVariant?:
    | "default"
    | "secondary"
    | "outline"
    | "destructive"
    | "success";
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  badgeText,
  badgeVariant = "default",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-0">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Icon size={18} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold tracking-tight">
            {typeof value === "number" ? value.toLocaleString() : value}
          </div>
          {badgeText && (
            <Badge
              variant={badgeVariant as any}
              appearance="light"
              className="text-[10px] px-1.5 py-0"
            >
              {badgeText}
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
