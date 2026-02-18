import { GraphQLClient } from "graphql-request";
import { getAuthHeaders, getGraphqlEndpoint } from "./api";

const endpoint = getGraphqlEndpoint();

export const graphqlClient = new GraphQLClient(endpoint, {
  requestMiddleware: (request) => ({
    ...request,
    headers: {
      ...request.headers,
      ...getAuthHeaders(),
      "Content-Type": "application/json",
      "x-portal-type": "staff",
    },
  }),
});

export const getErrorMessage = (error: any): string => {
  if (error.response?.errors?.[0]?.message) {
    return error.response.errors[0].message;
  }
  return error.message || "An unexpected error occurred";
};

