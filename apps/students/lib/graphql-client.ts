import { GraphQLClient } from "graphql-request";
import { getAuthHeaders, getGraphqlEndpoint } from "./api";

const endpoint = getGraphqlEndpoint();

export const graphqlClient = new GraphQLClient(endpoint, {
  requestMiddleware: (request) => ({
    ...request,
    headers: {
      ...request.headers,
      ...getAuthHeaders(),
      "x-portal-type": "student",
      "Content-Type": "application/json",
    },
  }),
});

export const getErrorMessage = (error: any): string => {
  if (error.response?.errors?.[0]?.message) {
    return error.response.errors[0].message;
  }
  return error.message || "An unexpected error occurred";
};
