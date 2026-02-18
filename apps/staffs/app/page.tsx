"use client";

import { Button } from "@workspace/ui/components/button";
import { useAuth } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Page() {
  const { session, isPending } = useAuth();
  const router = useRouter();

  if (isPending) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold">Staff Portal</h1>
          <p className="text-muted-foreground">
            Please login to access the portal
          </p>
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">Welcome, {session.user.name}</h1>
        <p className="text-muted-foreground">
          Staff Dashboard - {session.user.email}
        </p>
        <Button
          variant="outline"
          onClick={async () => {
            await authClient.signOut();
            if (typeof window !== "undefined") {
              localStorage.removeItem("bearer_token");
            }
            router.replace("/login");
          }}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
