import { gql } from "graphql-request";

export const ENROLL_STUDENTS_BATCH = gql`
  mutation EnrollStudentsInCurriculumBatch($input: EnrollStudentsInput!) {
    enrollStudentsInCurriculumBatch(input: $input) {
      enrolledCount
      totalStudents
      totalCourses
      message
    }
  }
`;
