const DEFAULT_GRAPHQL_ENDPOINT = "http://localhost:4000/graphql";

export const getGraphqlEndpoint = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) {
    return DEFAULT_GRAPHQL_ENDPOINT;
  }
  if (envUrl.endsWith("/graphql")) {
    return envUrl;
  }
  return `${envUrl.replace(/\/$/, "")}/graphql`;
};

export const getApiBaseUrl = () => {
  const endpoint = getGraphqlEndpoint();
  return endpoint.replace(/\/graphql\/?$/, "");
};

export const getAuthToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;

export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function graphqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(getGraphqlEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message || "GraphQL request failed");
  }

  return json.data as T;
}
