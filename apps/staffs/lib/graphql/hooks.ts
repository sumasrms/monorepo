"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "../graphql-client";
import {
  GET_ASSIGNED_COURSES,
  UPLOAD_RESULTS,
  UPDATE_RESULT,
  REQUEST_RESULT_EDIT,
  GET_EDIT_REQUESTS,
  GET_RESULTS_BY_COURSE,
  GET_ENROLLED_STUDENTS,
} from "./queries";

export function useAssignedCourses(staffId: string) {
  return useQuery({
    queryKey: ["assignedCourses", staffId],
    queryFn: async () => {
      const data: any = await graphqlClient.request(GET_ASSIGNED_COURSES, {
        staffId,
      });
      return data.staff.assignedCourses;
    },
    enabled: !!staffId,
  });
}

export function useUploadResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: any) => {
      const data: any = await graphqlClient.request(UPLOAD_RESULTS, { input });
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
      const data: any = await graphqlClient.request(UPDATE_RESULT, { input });
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
      const data: any = await graphqlClient.request(REQUEST_RESULT_EDIT, {
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
      const data: any = await graphqlClient.request(GET_EDIT_REQUESTS);
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
      const data: any = await graphqlClient.request(GET_RESULTS_BY_COURSE, {
        courseId,
        semester,
        session,
      });
      return data.resultsByCourse;
    },
    enabled: !!courseId && !!semester && !!session,
  });
}

export function useEnrolledStudents(courseId: string) {
  return useQuery({
    queryKey: ["enrolledStudents", courseId],
    queryFn: async () => {
      const data: any = await graphqlClient.request(GET_ENROLLED_STUDENTS, {
        courseId,
      });
      return data.course?.enrollments || [];
    },
    enabled: !!courseId,
  });
}
