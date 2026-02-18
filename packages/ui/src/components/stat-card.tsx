"use client";

import * as React from "react";
import {
  IconTrendingDown,
  IconTrendingUp,
  type Icon,
} from "@tabler/icons-react";
import { cn } from "@workspace/ui/lib/utils";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

export interface StatCardProps extends React.ComponentProps<typeof Card> {
  title: string;
  value: string | number;
  trend?: {
    label: string;
    direction: "up" | "down";
  };
  description?: string;
  footerLabel?: string;
  footerIcon?: Icon | React.ElementType;
}

export function StatCard({
  title,
  value,
  trend,
  description,
  footerLabel,
  footerIcon: FooterIcon,
  className,
  ...props
}: StatCardProps) {
  const TrendIcon =
    trend?.direction === "up" ? IconTrendingUp : IconTrendingDown;

  return (
    <Card className={cn("@container/card", className)} {...props}>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        {trend && (
          <CardAction>
            <Badge variant="outline">
              <TrendIcon className="size-3.5" />
              {trend.label}
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      {(footerLabel || description) && (
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          {footerLabel && (
            <div className="line-clamp-1 flex gap-2 font-medium">
              {footerLabel} {FooterIcon && <FooterIcon className="size-4" />}
            </div>
          )}
          {description && (
            <div className="text-muted-foreground whitespace-nowrap">
              {description}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
