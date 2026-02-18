import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { gql } from "graphql-request";
import { toast } from "sonner";

export const GET_MY_FACULTY_STATS = gql`
  query GetMyFacultyStats {
    myFacultyStats {
      studentCount
      staffCount
      courseCount
      departmentCount
    }
  }
`;

export const GET_MY_FACULTY_DEPARTMENTS = gql`
  query GetMyFacultyDepartments {
    myFacultyDepartments {
      id
      name
      code
    }
  }
`;

export const GET_PENDING_RESULTS_BY_FACULTY = gql`
  query GetPendingResultsByFaculty {
    pendingResultsByFaculty {
      id
      ca
      exam
      score
      grade
      status
      semester
      session
      student {
        id
        matricNumber
        user {
          name
        }
      }
      course {
        id
        code
        title
        department {
          name
          code
        }
      }
      uploadedBy {
        user {
          name
        }
      }
      approval {
        hodRemarks
        hodApprovedBy {
          name
        }
      }
    }
  }
`;

export const GET_MY_FACULTY_ANALYTICS = gql`
  query GetMyFacultyAnalytics {
    myFacultyAnalytics {
      avgGPA
      passRate
      submissionRate
      departmentMetrics {
        id
        name
        code
        avgGPA
        passRate
        submissionRate
        pendingApprovals
        anomalyCount
      }
      levelPerformance {
        name
        avgGPA
        passRate
      }
      semesterPerformance {
        name
        avgGPA
        passRate
      }
      pendingApprovalsByDepartment {
        id
        name
        code
        count
      }
      anomalyCountsByDepartment {
        id
        name
        code
        count
      }
    }
  }
`;

export const GET_FACULTY_RESULTS = gql`
  query GetResultsByFaculty(
    $departmentId: ID
    $courseId: String
    $semester: String
    $session: String
  ) {
    resultsByFaculty(
      departmentId: $departmentId
      courseId: $courseId
      semester: $semester
      session: $session
    ) {
      id
      ca
      exam
      score
      grade
      gradePoint
      status
      semester
      session
      createdAt
      course {
        id
        code
        title
        department {
          id
          name
          code
        }
      }
      student {
        id
        matricNumber
        user {
          name
        }
      }
      approval {
        hodStatus
        hodRemarks
        deanStatus
        deanRemarks
        senateStatus
        senateRemarks
      }
    }
  }
`;

export const GET_FACULTY_RESULT_AUDITS = gql`
  query GetResultAuditsByFaculty($departmentId: ID) {
    resultAuditsByFaculty(departmentId: $departmentId) {
      id
      resultId
      action
      reason
      actorRole
      createdAt
      result {
        id
        status
        course {
          code
          title
          department {
            id
            name
            code
          }
        }
        student {
          matricNumber
          user {
            name
          }
        }
      }
    }
  }
`;

export const GET_FACULTY_DEPARTMENT = gql`
  query GetFacultyDepartment($id: ID!) {
    facultyDepartment(id: $id) {
      id
      name
      code
      facultyId
      stats {
        studentCount
        staffCount
        courseCount
      }
      hod {
        id
        name
      }
    }
  }
`;

export const GET_DEPARTMENT_OFFERINGS = gql`
  query GetDepartmentOfferings($departmentId: String!) {
    departmentOfferings(departmentId: $departmentId) {
      id
      courseType
      semester
      level
      course {
        id
        code
        title
        credits
      }
    }
  }
`;

export const GET_STAFF_BY_DEPARTMENT = gql`
  query GetStaffByDepartment($departmentId: String!) {
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
`;

export const DEAN_APPROVE_RESULTS = gql`
  mutation DeanApproveResults($input: DeanApproveResultsInput!) {
    deanApproveResults(input: $input) {
      id
      status
    }
  }
`;

export const DEAN_REJECT_RESULTS = gql`
  mutation DeanRejectResults($input: DeanRejectResultsInput!) {
    deanRejectResults(input: $input) {
      id
      status
    }
  }
`;

export function useMyFacultyStats() {
  return useQuery({
    queryKey: ["myFacultyStats"],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        myFacultyStats: any;
      }>(GET_MY_FACULTY_STATS);
      return data.myFacultyStats;
    },
  });
}

export function useMyFacultyDepartments() {
  return useQuery({
    queryKey: ["myFacultyDepartments"],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        myFacultyDepartments: any[];
      }>(GET_MY_FACULTY_DEPARTMENTS);
      return data.myFacultyDepartments;
    },
  });
}

export function usePendingResultsByFaculty() {
  return useQuery({
    queryKey: ["pendingResultsByFaculty"],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        pendingResultsByFaculty: any[];
      }>(GET_PENDING_RESULTS_BY_FACULTY);
      return data.pendingResultsByFaculty;
    },
  });
}

export function useMyFacultyAnalytics() {
  return useQuery({
    queryKey: ["myFacultyAnalytics"],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        myFacultyAnalytics: any;
      }>(GET_MY_FACULTY_ANALYTICS);
      return data.myFacultyAnalytics;
    },
  });
}

export function useFacultyResults(filters?: {
  departmentId?: string;
  courseId?: string;
  semester?: string;
  session?: string;
}) {
  return useQuery({
    queryKey: ["facultyResults", filters],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        resultsByFaculty: any[];
      }>(GET_FACULTY_RESULTS, {
        departmentId: filters?.departmentId || null,
        courseId: filters?.courseId || null,
        semester: filters?.semester || null,
        session: filters?.session || null,
      });
      return data.resultsByFaculty;
    },
  });
}

export function useFacultyResultAudits(departmentId?: string) {
  return useQuery({
    queryKey: ["facultyResultAudits", departmentId],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        resultAuditsByFaculty: any[];
      }>(GET_FACULTY_RESULT_AUDITS, {
        departmentId: departmentId || null,
      });
      return data.resultAuditsByFaculty;
    },
  });
}

export function useFacultyDepartment(id: string) {
  return useQuery({
    queryKey: ["facultyDepartment", id],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        facultyDepartment: any;
      }>(GET_FACULTY_DEPARTMENT, { id });
      return data.facultyDepartment;
    },
    enabled: !!id,
  });
}

export function useDepartmentOfferings(departmentId: string) {
  return useQuery({
    queryKey: ["departmentOfferings", departmentId],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        departmentOfferings: any[];
      }>(GET_DEPARTMENT_OFFERINGS, { departmentId });
      return data.departmentOfferings;
    },
    enabled: !!departmentId,
  });
}

export function useStaffByDepartment(departmentId: string) {
  return useQuery({
    queryKey: ["staffByDepartment", departmentId],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        staffByDepartment: any[];
      }>(GET_STAFF_BY_DEPARTMENT, { departmentId });
      return data.staffByDepartment;
    },
    enabled: !!departmentId,
  });
}

export function useDeanApproveResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { resultIds: string[]; remarks?: string }) => {
      return graphqlClient.request(DEAN_APPROVE_RESULTS, { input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingResultsByFaculty"] });
      toast.success("Results approved successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to approve results");
    },
  });
}

export function useDeanRejectResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { resultIds: string[]; remarks: string }) => {
      return graphqlClient.request(DEAN_REJECT_RESULTS, { input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingResultsByFaculty"] });
      toast.success("Results rejected successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reject results");
    },
  });
}
