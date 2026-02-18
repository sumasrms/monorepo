import React from "react";
import { cn } from "../lib/utils";
import { LucideIcon } from "lucide-react";

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: LucideIcon;
  status?: "pending" | "approved" | "rejected" | "info";
}

interface ActivityListProps {
  items: ActivityItem[];
  className?: string;
}

export function ActivityList({ items, className }: ActivityListProps) {
  if (items.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        No recent activity to display
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {items.map((item) => (
        <div key={item.id} className="flex gap-4 group">
          <div className="relative flex flex-col items-center">
            <div
              className={cn(
                "p-2 rounded-full ring-2 ring-background z-10",
                item.status === "approved" && "bg-green-100 text-green-600",
                item.status === "pending" && "bg-yellow-100 text-yellow-600",
                item.status === "rejected" && "bg-red-100 text-red-600",
                (!item.status || item.status === "info") &&
                  "bg-blue-100 text-blue-600",
              )}
            >
              <item.icon className="h-4 w-4" />
            </div>
            <div className="absolute top-8 bottom-0 w-0.5 bg-muted group-last:hidden" />
          </div>
          <div className="flex-1 pb-4 group-last:pb-0">
            <div className="flex justify-between items-start mb-1">
              <h4 className="text-sm font-semibold">{item.title}</h4>
              <span className="text-xs text-muted-foreground">
                {item.timestamp}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
