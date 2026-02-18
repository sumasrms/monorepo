import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { gql } from "graphql-request";

export const GET_PENDING_EDIT_REQUESTS_BY_DEPARTMENT = gql`
  query GetPendingEditRequestsByDepartment {
    pendingEditRequestsByDepartment {
      id
      reason
      status
      createdAt
      result {
        id
        score
        grade
        course {
          code
          title
        }
        student {
          user {
            name
          }
          matricNumber
        }
        uploadedBy {
          user {
            name
          }
        }
      }
    }
  }
`;

export const HOD_APPROVE_EDIT_REQUEST = gql`
  mutation ApproveEditRequest($id: ID!) {
    approveEditRequest(id: $id) {
      id
      status
    }
  }
`;

export const HOD_REJECT_EDIT_REQUEST = gql`
  mutation RejectEditRequest($id: ID!, $remarks: String!) {
    rejectEditRequest(id: $id, remarks: $remarks) {
      id
      status
    }
  }
`;

export interface HodEditRequest {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  result: {
    id: string;
    score: number;
    grade: string;
    course: {
      code: string;
      title: string;
    };
    student: {
      user: {
        name: string;
      };
      matricNumber: string;
    };
    uploadedBy: {
      user: {
        name: string;
      };
    };
  };
}

export function usePendingEditRequestsByDepartment() {
  return useQuery({
    queryKey: ["pendingEditRequestsByDepartment"],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        pendingEditRequestsByDepartment: HodEditRequest[];
      }>(GET_PENDING_EDIT_REQUESTS_BY_DEPARTMENT);
      return data.pendingEditRequestsByDepartment;
    },
  });
}

export function useApproveEditRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return graphqlClient.request(HOD_APPROVE_EDIT_REQUEST, { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pendingEditRequestsByDepartment"],
      });
    },
  });
}

export function useRejectEditRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, remarks }: { id: string; remarks: string }) => {
      return graphqlClient.request(HOD_REJECT_EDIT_REQUEST, { id, remarks });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pendingEditRequestsByDepartment"],
      });
    },
  });
}
