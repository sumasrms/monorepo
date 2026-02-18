import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import {
  UPLOAD_RESULTS,
  UPDATE_RESULT,
  REQUEST_RESULT_EDIT,
  GET_EDIT_REQUESTS,
  GET_RESULTS_BY_COURSE,
  GET_ENROLLED_STUDENTS,
  GET_PENDING_RESULTS_BY_DEPARTMENT,
  GET_RESULTS_BY_DEPARTMENT,
  HOD_APPROVE_RESULTS,
  HOD_REJECT_RESULTS,
  GET_MY_DEPARTMENT_STATS,
  SUBMIT_RESULTS_TO_HOD,
  GET_RESULT_AUDITS_BY_DEPARTMENT,
  GET_RESULT_AUDITS_BY_COURSE,
  GET_RESULT_AUDITS_FOR_SENATE,
} from "../queries";
import {
  Result,
  Enrollment,
  EditRequest,
  UploadResultInput,
  ResultAudit,
} from "../types";

export function useMyDepartmentStats() {
  return useQuery({
    queryKey: ["departmentStats"],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        myDepartmentStats: {
          studentCount: number;
          staffCount: number;
          courseCount: number;
        };
      }>(GET_MY_DEPARTMENT_STATS);
      return data.myDepartmentStats;
    },
  });
}

export function useUploadResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UploadResultInput) => {
      const data = await graphqlClient.request<{ uploadResults: Result[] }>(
        UPLOAD_RESULTS,
        { input },
      );
      return data.uploadResults;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results"] });
    },
  });
}

export function useUpdateResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: any) => {
      const data = await graphqlClient.request<{ updateResult: Result }>(
        UPDATE_RESULT,
        { input },
      );
      return data.updateResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results"] });
    },
  });
}

export function useRequestResultEdit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: any) => {
      const data = await graphqlClient.request<{
        requestResultEdit: EditRequest;
      }>(REQUEST_RESULT_EDIT, {
        input,
      });
      return data.requestResultEdit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["editRequests"] });
    },
  });
}

export function useEditRequests() {
  return useQuery({
    queryKey: ["editRequests"],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        myEditRequests: EditRequest[];
      }>(GET_EDIT_REQUESTS);
      return data.myEditRequests;
    },
  });
}

export function useResultsByCourse(
  courseId: string,
  semester: string,
  session: string,
) {
  return useQuery({
    queryKey: ["results", courseId, semester, session],
    queryFn: async () => {
      const data = await graphqlClient.request<{ resultsByCourse: Result[] }>(
        GET_RESULTS_BY_COURSE,
        {
          courseId,
          semester,
          session,
        },
      );
      return data.resultsByCourse;
    },
    enabled: !!courseId && !!semester && !!session,
  });
}

export function useResultAuditsByCourse(courseId: string) {
  return useQuery({
    queryKey: ["resultAudits", "course", courseId],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        resultAuditsByCourse: ResultAudit[];
      }>(GET_RESULT_AUDITS_BY_COURSE, { courseId });
      return data.resultAuditsByCourse;
    },
    enabled: !!courseId,
  });
}

export function useEnrolledStudents(courseId: string) {
  return useQuery({
    queryKey: ["enrolledStudents", courseId],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        course: { enrollments: Enrollment[], code: string, title: string };
      }>(GET_ENROLLED_STUDENTS, {
        courseId,
      });
      return { enrollments: data.course?.enrollments || [], code: data.course?.code, title: data.course?.title };
    },
    enabled: !!courseId,
  });
}

export function usePendingResultsByDepartment() {
  return useQuery({
    queryKey: ["pendingResults"],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        pendingResultsByDepartment: Result[];
      }>(GET_PENDING_RESULTS_BY_DEPARTMENT);
      return data.pendingResultsByDepartment;
    },
  });
}

export function useResultsByDepartment(filters?: {
  courseId?: string;
  semester?: string;
  session?: string;
}) {
  return useQuery({
    queryKey: ["resultsByDepartment", filters],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        resultsByDepartment: Result[];
      }>(GET_RESULTS_BY_DEPARTMENT, {
        courseId: filters?.courseId || null,
        semester: filters?.semester || null,
        session: filters?.session || null,
      });
      return data.resultsByDepartment;
    },
  });
}

export function useHodApproveResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { resultIds: string[]; remarks?: string }) => {
      const data = await graphqlClient.request<{ hodApproveResults: Result[] }>(
        HOD_APPROVE_RESULTS,
        { input },
      );
      return data.hodApproveResults;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingResults"] });
      queryClient.invalidateQueries({ queryKey: ["results"] });
    },
  });
}

export function useHodRejectResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { resultIds: string[]; remarks: string }) => {
      const data = await graphqlClient.request<{ hodRejectResults: Result[] }>(
        HOD_REJECT_RESULTS,
        { input },
      );
      return data.hodRejectResults;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingResults"] });
      queryClient.invalidateQueries({ queryKey: ["results"] });
    },
  });
}

export function useSubmitResultsToHod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      courseId: string;
      semester: string;
      session: string;
      resultIds?: string[];
    }) => {
      const data = await graphqlClient.request<{ submitResultsToHod: Result[] }>(
        SUBMIT_RESULTS_TO_HOD,
        { input },
      );
      return data.submitResultsToHod;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results"] });
      queryClient.invalidateQueries({ queryKey: ["pendingResults"] });
    },
  });
}

export function useResultAuditsByDepartment() {
  return useQuery({
    queryKey: ["resultAudits", "department"],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        resultAuditsByDepartment: ResultAudit[];
      }>(GET_RESULT_AUDITS_BY_DEPARTMENT);
      return data.resultAuditsByDepartment;
    },
  });
}

export function useResultAuditsForSenate() {
  return useQuery({
    queryKey: ["resultAudits", "senate"],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        resultAuditsForSenate: ResultAudit[];
      }>(GET_RESULT_AUDITS_FOR_SENATE);
      return data.resultAuditsForSenate;
    },
  });
}
