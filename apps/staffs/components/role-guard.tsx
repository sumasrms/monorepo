"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/unauthorized",
];

const ROLE_BASE_PATHS: Record<string, string> = {
  lecturer: "/lecturer",
  hod: "/hod",
  dean: "/dean",
  senate: "/senate",
};

const ROLE_PREFIXES = Object.values(ROLE_BASE_PATHS);

function getRoleBase(role?: string | null) {
  if (!role) return null;
  return ROLE_BASE_PATHS[role] || null;
}

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { session, isPending } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (isPending) return;

    const isPublic = PUBLIC_PATHS.some((path) =>
      pathname === path || pathname.startsWith(`${path}/`),
    );

    if (isPublic) {
      return;
    }

    if (!session) {
      router.replace("/login");
      return;
    }

    const role = session.user.role?.toLowerCase();
    if (role === "student" || role === "admin") {
      router.replace("/unauthorized");
      return;
    }

    const roleBase = getRoleBase(role);
    if (!roleBase) {
      router.replace("/unauthorized");
      return;
    }

    const isRoleRoot = pathname === "/" || pathname.startsWith("/dashboard");
    if (isRoleRoot) {
      router.replace(roleBase);
      return;
    }

    const isRolePrefix = ROLE_PREFIXES.some((prefix) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

    if (isRolePrefix && !(pathname === roleBase || pathname.startsWith(`${roleBase}/`))) {
      router.replace(roleBase);
    }
  }, [session, isPending, pathname, router]);

  return <>{children}</>;
}
