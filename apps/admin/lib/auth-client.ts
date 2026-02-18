import { passkeyClient } from "@better-auth/passkey/client";
import { twoFactorClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac } from "../../backend/lib/permissions";
import { getApiBaseUrl } from "./api";

export const authClient = createAuthClient({
  baseURL: getApiBaseUrl(),
  fetchOptions: {
    headers: {
      "x-portal-type": "admin",
    },
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token");
      if (authToken) {
        localStorage.setItem("bearer_token", authToken);
      }
    },
  },
  plugins: [
    passkeyClient(),
    twoFactorClient(),
    adminClient({
      ac,
    }),
  ],
});
