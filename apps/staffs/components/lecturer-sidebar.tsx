"use client";

import * as React from "react";
import {
  BookOpen,
  Command,
  FileEdit,
  LayoutDashboard,
  LifeBuoy,
  Send,
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

export function LecturerSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();

  const user = {
    name: session?.user?.name || "Lecturer",
    email: session?.user?.email || "",
    avatar: session?.user?.image || "/avatars/default.jpg",
  };

  const navMain = [
    {
      title: "Dashboard",
      url: "/lecturer",
      icon: LayoutDashboard,
    },
    {
      title: "My Courses",
      url: "/lecturer/courses",
      icon: BookOpen,
    },
    {
      title: "Edit Requests",
      url: "/lecturer/requests",
      icon: FileEdit,
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
              <Link href="/lecturer">
                {/* <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"> */}
                <Image
                  src="/logo.png"
                  width={16}
                  height={16}
                  className="size-8"
                  alt="Logo"
                />
                {/* </div> */}
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">SUMAS</span>
                  <span className="truncate text-xs">Lecturer Portal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
