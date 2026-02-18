const DEFAULT_GRAPHQL_ENDPOINT = "http://localhost:3001/graphql";

export const getGraphqlEndpoint = () => {
  const envUrl =
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || process.env.NEXT_PUBLIC_API_URL;
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
