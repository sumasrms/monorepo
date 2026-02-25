import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { gql } from "graphql-request";

export const ASSIGN_COURSE_TO_STAFF = gql`
  mutation AssignCourseToStaff($input: AssignCourseToStaffInput!) {
    assignCourseToStaff(input: $input) {
      id
      courseId
      instructorId
      isPrimary
      course {
        id
        code
        title
      }
      instructor {
        id
        user {
          id
          name
        }
      }
    }
  }
`;

export function useAssignCourseToStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { courseId: string; staffId: string; isPrimary?: boolean }) => {
      return graphqlClient.request(ASSIGN_COURSE_TO_STAFF, { input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myDepartmentalCourses"] });
      queryClient.invalidateQueries({ queryKey: ["departmentStaff"] });
    },
  });
}
