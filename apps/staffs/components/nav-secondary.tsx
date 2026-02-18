"use client";

import * as React from "react";
import { type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import Link from "next/link";
import { SupportFeedbackDialog } from "@/components/support-feedback-dialog";

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    onAction?: () => void;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const [supportOpen, setSupportOpen] = React.useState(false);
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);

  return (
    <>
      <SidebarGroup {...props}>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => {
              const title = item.title.toLowerCase();
              const isSupport = title === "support";
              const isFeedback = title === "feedback";

              if (item.onAction || ((isSupport || isFeedback) && item.url === "#")) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      size="sm"
                      onClick={() => {
                        if (item.onAction) {
                          item.onAction();
                          return;
                        }

                        if (isSupport) {
                          setSupportOpen(true);
                        } else if (isFeedback) {
                          setFeedbackOpen(true);
                        }
                      }}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="sm">
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SupportFeedbackDialog
        type="SUPPORT"
        open={supportOpen}
        onOpenChange={setSupportOpen}
      />
      <SupportFeedbackDialog
        type="FEEDBACK"
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
      />
    </>
  );
}
