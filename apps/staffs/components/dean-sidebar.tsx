"use client";

import * as React from "react";
import {
  CheckCircle,
  LayoutDashboard,
  LifeBuoy,
  BarChart3,
  Send,
  Building2,
  Users,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { SessionSwitcher } from "./session-switcher";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import { useSession } from "@/lib/auth-client";
import Image from "next/image";
import Link from "next/link";

const navSecondary = [
  {
    title: "Support",
    url: "#",
    icon: LifeBuoy,
  },
  {
    title: "Feedback",
    url: "#",
    icon: Send,
  },
];

export function DeanSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();

  const user = {
    name: session?.user?.name || "Dean",
    email: session?.user?.email || "",
    avatar: session?.user?.image || "/avatars/default.jpg",
  };

  const navMain = [
    {
      title: "Faculty Dashboard",
      url: "/dean",
      icon: LayoutDashboard,
    },
    {
      title: "Departments",
      url: "/dean/departments",
      icon: Building2,
    },
    {
      title: "Result Approvals",
      url: "/dean/approvals",
      icon: CheckCircle,
    },
    {
      title: "Results History",
      url: "/dean/results-history",
      icon: Users,
    },
    {
      title: "Faculty Analytics",
      url: "/dean/analytics",
      icon: BarChart3,
    },
  ];

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dean">
                <Image
                  src="/logo.png"
                  width={16}
                  height={16}
                  className="size-8"
                  alt="Logo"
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">SUMAS</span>
                  <span className="truncate text-xs">Dean Portal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-2 pt-2 pb-4">
          <SessionSwitcher />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
