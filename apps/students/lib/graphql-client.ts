import { GraphQLClient } from "graphql-request";

const endpoint =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql";

export const graphqlClient = new GraphQLClient(endpoint, {
  headers: {
    // Add any global headers here (e.g., authorization)
  },
});
