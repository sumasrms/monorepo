import { gql } from "graphql-request";

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
    uploadResults(input: $input) {
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
      uploadedBy {
        id
        user {
          name
        }
      }
      approval {
        hodRemarks
        deanRemarks
        senateRemarks
      }
    }
  }
`;

export const SUBMIT_RESULTS_TO_HOD = gql`
  mutation SubmitResultsToHod($input: SubmitResultsInput!) {
    submitResultsToHod(input: $input) {
      id
      status
    }
  }
`;

export const GET_RESULT_AUDITS_BY_DEPARTMENT = gql`
  query GetResultAuditsByDepartment {
    resultAuditsByDepartment {
      id
      resultId
      action
      reason
      actorId
      actorRole
      metadata
      createdAt
      result {
        id
        status
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

export const GET_RESULT_AUDITS_BY_COURSE = gql`
  query GetResultAuditsByCourse($courseId: String!) {
    resultAuditsByCourse(courseId: $courseId) {
      id
      resultId
      action
      reason
      actorId
      actorRole
      metadata
      createdAt
      result {
        id
        status
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

export const GET_RESULT_AUDITS_FOR_SENATE = gql`
  query GetResultAuditsForSenate {
    resultAuditsForSenate {
      id
      resultId
      action
      reason
      actorId
      actorRole
      metadata
      createdAt
      result {
        id
        status
        course {
          code
          title
          department {
            name
            faculty {
              name
            }
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

export const GET_PENDING_RESULTS_BY_DEPARTMENT = gql`
  query GetPendingResultsByDepartment {
    pendingResultsByDepartment {
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
      student {
        matricNumber
        user {
          name
        }
      }
      course {
        code
        title
      }
      uploadedBy {
        user {
          name
        }
      }
      approval {
        hodRemarks
      }
    }
  }
`;

export const GET_RESULTS_BY_DEPARTMENT = gql`
  query GetResultsByDepartment(
    $courseId: String
    $semester: String
    $session: String
  ) {
    resultsByDepartment(
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
      student {
        matricNumber
        user {
          name
        }
      }
      course {
        id
        code
        title
      }
      uploadedBy {
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

export const HOD_APPROVE_RESULTS = gql`
  mutation HodApproveResults($input: HodApproveResultsInput!) {
    hodApproveResults(input: $input) {
      id
      status
    }
  }
`;

export const HOD_REJECT_RESULTS = gql`
  mutation HodRejectResults($input: HodRejectResultsInput!) {
    hodRejectResults(input: $input) {
      id
      status
    }
  }
`;

export const GET_MY_DEPARTMENT_STATS = gql`
  query GetMyDepartmentStats {
    myDepartmentStats {
      studentCount
      staffCount
      courseCount
      departmentCount
      facultyCount
    }
  }
`;
