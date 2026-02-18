import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_ASSIGNED_COURSES } from "../queries";

export interface AssignedCourse {
  id: string;
  courseId: string;
  isPrimary: boolean;
  course: {
    id: string;
    code: string;
    title: string;
    credits: number;
    semester: string;
    academicYear: string;
    level: number;
  };
}

export function useAssignedCourses(staffId: string) {
  return useQuery({
    queryKey: ["assignedCourses", staffId],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        staff: { assignedCourses: AssignedCourse[] };
      }>(GET_ASSIGNED_COURSES, {
        staffId,
      });
      return data.staff.assignedCourses;
    },
    enabled: !!staffId,
  });
}
