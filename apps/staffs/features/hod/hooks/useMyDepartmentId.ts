import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { gql } from "graphql-request";

const GET_MY_DEPARTMENT_ID = gql`
  query GetMyDepartmentId {
    me {
      staffProfile {
        departmentId
      }
    }
  }
`;

export function useMyDepartmentId() {
  return useQuery({
    queryKey: ["myDepartmentId"],
    queryFn: async () => {
      const data = await graphqlClient.request<{ me: { staffProfile: { departmentId: string } } }>(GET_MY_DEPARTMENT_ID);
      return data.me.staffProfile?.departmentId || "";
    },
  });
}
