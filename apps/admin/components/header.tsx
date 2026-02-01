"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  Settings,
  User,
  Calendar,
  Layers,
  GraduationCap,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Button } from "@workspace/ui/components/button";
import { ModeToggle } from "@workspace/ui/components/mode-toggle";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";

export function DashboardHeader() {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter((segment) => segment !== "");
  const [user, setUser] = useState<any>(null);

  const [session, setSession] = useState("2024/2025");
  const [semester, setSemester] = useState("First Semester");
  const [faculty, setFaculty] = useState("Science & Technology");

  const sessions = ["2023/2024", "2024/2025", "2025/2026"];
  const semesters = ["First Semester", "Second Semester"];

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await authClient.getSession();
      setUser(data?.user);
    };
    fetchSession();
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-neutral-200 bg-background px-6 dark:border-neutral-700 rounded-2xl my-3 ">
      <div className="flex items-center gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {pathSegments.slice(1).map((segment, index) => {
              const href = `/${pathSegments.slice(0, index + 2).join("/")}`;
              const isLast = index === pathSegments.length - 2;
              const title = segment.charAt(0).toUpperCase() + segment.slice(1);

              return (
                <React.Fragment key={href}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{title}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={href}>{title}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-neutral-200 dark:border-neutral-700"
              >
                <Calendar className="h-4 w-4 text-neutral-500" />
                <span>{session}</span>
                <ChevronDown className="h-4 w-4 text-neutral-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Academic Session</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sessions.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => setSession(s)}
                  disabled={s === "2025/2026"}
                >
                  {s} {s === "2025/2026" && "(Disabled)"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-neutral-200 dark:border-neutral-700"
              >
                <Layers className="h-4 w-4 text-neutral-500" />
                <span>{semester}</span>
                <ChevronDown className="h-4 w-4 text-neutral-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Semester</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {semesters.map((s) => (
                <DropdownMenuItem key={s} onClick={() => setSemester(s)}>
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-neutral-200 dark:border-neutral-700"
              >
                <GraduationCap className="h-4 w-4 text-neutral-500" />
                <span>{faculty}</span>
                <ChevronDown className="h-4 w-4 text-neutral-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Default Faculty</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setFaculty("Science & Technology")}
              >
                Science & Technology
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFaculty("Arts & Humanities")}>
                Arts & Humanities
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFaculty("Social Sciences")}>
                Social Sciences
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700 mx-2 hidden lg:block" />

        <ModeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Image
                src="https://assets.aceternity.com/manu.png"
                alt="Avatar"
                className="rounded-full object-cover"
                fill
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={async () => {
                await authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      window.location.href = "/login";
                    },
                  },
                });
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
