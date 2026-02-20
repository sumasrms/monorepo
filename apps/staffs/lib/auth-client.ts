import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { customSessionClient } from "better-auth/client/plugins";
import { ac } from "../../backend/lib/permissions";
import { getApiBaseUrl } from "./api";

export const authClient = createAuthClient({
  baseURL: getApiBaseUrl(),
  fetchOptions: {
    headers: {
      "x-portal-type": "staff",
    },
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token");
      if (authToken) {
        localStorage.setItem("bearer_token", authToken);
      }
    },
  },
  plugins: [
    adminClient({
      ac,
    }),
    customSessionClient(),
  ],
});

export const { useSession, signIn, signOut } = authClient;
