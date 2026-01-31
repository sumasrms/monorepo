import { GraphQLClient } from "graphql-request";

const endpoint =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql";
const token = localStorage.getItem("bearer_token");

export const graphqlClient = new GraphQLClient(endpoint, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
