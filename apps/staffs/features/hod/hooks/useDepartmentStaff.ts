
import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { gql } from "graphql-request";

export interface DepartmentStaff {
  id: string;
  staffNumber: string;
  designation: string;
  institutionalRank: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export const GET_DEPARTMENT_STAFF = gql`
  query GetDepartmentStaff {
    me {
      staffProfile {
        departmentId
      }
    }
    staffByDepartment(departmentId: "") {
      id
      staffNumber
      designation
      institutionalRank
      user {
        id
        name
        email
      }
    }
  }
`;

export function useDepartmentStaff(departmentId: string) {
  return useQuery({
    queryKey: ["departmentStaff", departmentId],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        staffByDepartment: DepartmentStaff[];
      }>(
        gql`
          query($departmentId: String!) {
            staffByDepartment(departmentId: $departmentId) {
              id
              staffNumber
              designation
              institutionalRank
              user {
                id
                name
                email
              }
            }
          }
        `,
        { departmentId }
      );
      return data.staffByDepartment;
    },
    enabled: !!departmentId,
  });
}
