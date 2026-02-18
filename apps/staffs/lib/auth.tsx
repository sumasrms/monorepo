"use client";

import React, { createContext, useContext, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "./auth-client";

type AuthContextType = {
  session: ReturnType<typeof authClient.useSession>["data"];
  isPending: boolean;
  error: Error | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending, error } = authClient.useSession();

  return (
    <AuthContext.Provider value={{ session, isPending, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useRequireAuth() {
  const { session, isPending } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.replace("/login");
      } else if (session.user.role === "student") {
        // Students cannot access staff portal
        router.replace("/unauthorized");
      }
    }
  }, [session, isPending, router]);

  return { session, isPending };
}
