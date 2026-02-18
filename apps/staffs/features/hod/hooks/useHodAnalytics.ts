import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { gql } from "graphql-request";

export const GET_MY_DEPARTMENT_ANALYTICS = gql`
  query GetMyDepartmentAnalytics {
    myDepartmentAnalytics {
      gradeDistribution {
        name
        value
      }
      passRate
      avgGPByLevel {
        name
        value
      }
    }
  }
`;

export interface DepartmentAnalytics {
  gradeDistribution: { name: string; value: number }[];
  passRate: number;
  avgGPByLevel: { name: string; value: number }[];
}

export function useMyDepartmentAnalytics() {
  return useQuery({
    queryKey: ["departmentAnalytics"],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        myDepartmentAnalytics: DepartmentAnalytics;
      }>(GET_MY_DEPARTMENT_ANALYTICS);
      return data.myDepartmentAnalytics;
    },
  });
}
