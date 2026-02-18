import { gql } from "graphql-request";

export const GET_ASSIGNED_COURSES = gql`
  query GetAssignedCourses($staffId: ID!) {
    staff(id: $staffId) {
      id
      assignedCourses {
        id
        courseId
        isPrimary
        course {
          id
          code
          title
          description
          credits
          semester
          academicYear
          level
          department {
            id
            name
          }
        }
      }
    }
  }
`;
