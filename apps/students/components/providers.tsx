"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth";
import { RoleGuard } from "@/components/role-guard";

import { QueryProvider } from "./query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      <AuthProvider>
        <RoleGuard>
          <QueryProvider>{children}</QueryProvider>
        </RoleGuard>
      </AuthProvider>
    </NextThemesProvider>
  );
}
