import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { gql } from "graphql-request";

export const GET_MY_DEPARTMENTAL_COURSES = gql`
  query GetMyDepartmentalCourses {
    myDepartmentOfferings {
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

export const GET_COURSE_DETAILS = gql`
  query GetCourseDetails($id: ID!) {
    course(id: $id) {
      id
      code
      title
      description
      credits
      semester
      academicYear
      level
      instructors {
        id
        isPrimary
        instructor {
          user {
            name
          }
          institutionalRank
        }
      }
      enrollments {
        id
      }
    }
  }
`;

export interface DepartmentCourse {
  id: string;
  courseType: string;
  semester: string;
  level: number;
  course: {
    id: string;
    code: string;
    title: string;
    credits: number;
  };
}

export function useMyDepartmentalCourses() {
  return useQuery({
    queryKey: ["myDepartmentalCourses"],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        myDepartmentOfferings: DepartmentCourse[];
      }>(GET_MY_DEPARTMENTAL_COURSES);
      return data.myDepartmentOfferings;
    },
  });
}

export function useCourseDetails(id: string) {
  return useQuery({
    queryKey: ["courseDetails", id],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        course: any;
      }>(GET_COURSE_DETAILS, { id });
      return data.course;
    },
    enabled: !!id,
  });
}
