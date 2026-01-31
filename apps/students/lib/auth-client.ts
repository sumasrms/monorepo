import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { ac } from "../../backend/lib/permissions";

export const authClient = createAuthClient({
  baseURL: "http://localhost:4000",
  fetchOptions: {
    headers: {
      "x-portal-type": "student",
    },
  },
  plugins: [
    adminClient({
      ac,
    }),
  ],
});

export const { useSession, signIn, signOut } = authClient;
