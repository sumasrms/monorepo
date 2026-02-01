"use client";
import React, { useState } from "react";
import {
  LayoutDashboard,
  ShieldCheck,
  BookOpen,
  Building2,
  GraduationCap,
  Users,
  UserCog,
  BarChart3,
  Settings,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@workspace/ui/lib/utils";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarSection,
  Links,
} from "@workspace/ui/components/ui/sidebar";
import { LucideIcon } from "lucide-react";
import { DashboardHeader } from "@/components/header";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import Image from "next/image";

// Type definitions for menu items
type MenuItem = {
  title: string;
  url?: string;
  icon?: LucideIcon;
  children?: MenuItem[];
};

type MenuSection = {
  label?: string;
  items: MenuItem[];
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [open, setOpen] = useState(false);

  // Menu configuration - tree-based structure
  const menuConfig: MenuSection[] = [
    {
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: "Academic",
      items: [
        {
          title: "Governance",
          icon: ShieldCheck,
          children: [
            {
              title: "Faculties",
              url: "/dashboard/faculty",
            },
            {
              title: "Departments",
              url: "/dashboard/governance/departments",
            },
          ],
        },
        {
          title: "Course Assignment",
          url: "/dashboard/courses",
          icon: BookOpen,
        },
        {
          title: "Institution Curriculum",
          url: "/dashboard/curriculum",
          icon: Building2,
        },
      ],
    },
    {
      label: "People",
      items: [
        {
          title: "Students",
          url: "/dashboard/students",
          icon: GraduationCap,
        },
        {
          title: "Staffs",
          url: "/dashboard/staff",
          icon: Users,
        },
        {
          title: "User Management",
          url: "/dashboard/users",
          icon: UserCog,
        },
      ],
    },
    {
      label: "System",
      items: [
        {
          title: "Audits & Analytics",
          url: "/dashboard/analytics",
          icon: BarChart3,
        },
        {
          title: "System Configuration",
          url: "/dashboard/settings",
          icon: Settings,
        },
      ],
    },
  ];

  const mapMenuItemToLink = (item: MenuItem): Links => ({
    label: item.title,
    href: item.url,
    icon: item.icon ? (
      <item.icon className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ) : null,
    children: item.children?.map(mapMenuItemToLink),
  });

  return (
    <div
      className={cn(
        "flex h-screen w-full flex-1 flex-col overflow-hidden bg-sidebar md:flex-row",
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col">
              {menuConfig.map((section, idx) => (
                <SidebarSection key={idx} label={section.label}>
                  {section.items.map((item, itemIdx) => (
                    <SidebarLink key={itemIdx} link={mapMenuItemToLink(item)} />
                  ))}
                </SidebarSection>
              ))}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1 flex-col overflow-hidden px-4 md:px-8 ">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto  ">
          <ScrollArea className="h-full w-full rounded-tl-2xl border bg-background p-4 md:p-8 ">
            {children}
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}

const Logo = () => {
  return (
    <a
      href="/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <Image src="/logo.png" alt="Logo" width={24} height={24} />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black dark:text-white"
      >
        SUMAS Admin
      </motion.span>
    </a>
  );
};

const LogoIcon = () => {
  return (
    <a
      href="/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <Image src="/logo.png" alt="Logo" width={24} height={24} />
      {/* <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" /> */}
    </a>
  );
};
