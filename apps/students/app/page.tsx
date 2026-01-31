"use client";

import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";

export default function Page() {
  const { session, isPending } = useAuth();

  if (isPending) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-svh">
      <div className="flex flex-col items-center justify-center gap-4">
        {session ? (
          <>
            <h1 className="text-2xl font-bold">Hello {session.user.name}</h1>
            <p className="text-muted-foreground">
              Welcome to the student portal. You are logged in as{" "}
              {session.user.email}
            </p>
            <Button
              size="lg"
              onClick={async () => {
                await authClient.signOut();
                window.location.reload();
              }}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Hello Student</h1>
            <p className="text-muted-foreground">
              Welcome to the student portal, click the button below to login
            </p>
            <Button size="lg" asChild>
              <Link href="/login">Login</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
