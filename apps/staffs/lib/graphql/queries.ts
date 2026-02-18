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

export const UPLOAD_RESULTS = gql`
  mutation UploadResults($input: UploadResultInput!) {
    uploadResults(input: $input) {
      id
      studentId
      courseId
      ca
      exam
      score
      grade
      gradePoint
      status
      student {
        id
        matricNumber
        user {
          name
        }
      }
    }
  }
`;

export const UPDATE_RESULT = gql`
  mutation UpdateResult($input: UpdateResultInput!) {
    updateResult(input: $input) {
      id
      ca
      exam
      score
      grade
      gradePoint
      status
    }
  }
`;

export const REQUEST_RESULT_EDIT = gql`
  mutation RequestResultEdit($input: RequestEditInput!) {
    requestResultEdit(input: $input) {
      id
      resultId
      reason
      status
      createdAt
    }
  }
`;

export const GET_EDIT_REQUESTS = gql`
  query GetMyEditRequests {
    myEditRequests {
      id
      resultId
      reason
      status
      createdAt
      result {
        id
        course {
          code
          title
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

export const GET_RESULTS_BY_COURSE = gql`
  query GetResultsByCourse(
    $courseId: String!
    $semester: String!
    $session: String!
  ) {
    resultsByCourse(
      courseId: $courseId
      semester: $semester
      session: $session
    ) {
      id
      studentId
      ca
      exam
      score
      grade
      gradePoint
      status
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
        credits
      }
    }
  }
`;

export const GET_ENROLLED_STUDENTS = gql`
  query GetEnrolledStudents($courseId: ID!) {
    course(id: $courseId) {
      id
      code
      title
      enrollments {
        id
        student {
          id
          matricNumber
          user {
            id
            name
          }
        }
      }
    }
  }
`;
