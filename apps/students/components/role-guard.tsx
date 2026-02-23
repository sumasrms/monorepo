"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/unauthorized",
];

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { session, isPending } = useAuth();
  const pathname = usePathname();

  React.useEffect(() => {
    if (isPending) return;

    const isPublic = PUBLIC_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    );

    if (isPublic) {
      return;
    }

    if (!session) {
      window.location.href = "/login";
      return;
    }

    const role = session.user.role;
    if (role?.toLowerCase() !== "student") {
      window.location.href = "/unauthorized";
    }
  }, [session, isPending, pathname]);

  return <>{children}</>;
}
