import { gql } from "graphql-request";

export const GET_STUDENTS = gql`
  query GetStudents {
    students {
      id
      matricNumber
      admissionDate
      level
      department {
        name
      }
      user {
        id
        name
        email
        gender
        image
      }
    }
  }
`;

export const GET_STUDENT = gql`
  query GetStudent($id: ID!) {
    student(id: $id) {
      id
      matricNumber
      admissionDate
      level
      departmentId
      programId
      user {
        id
        name
        email
        gender
      }
    }
  }
`;

export const CREATE_STUDENT = gql`
  mutation CreateStudent($input: CreateStudentInput!) {
    createStudent(input: $input) {
      id
      matricNumber
      user {
        name
      }
    }
  }
`;

export const UPDATE_STUDENT = gql`
  mutation UpdateStudent($id: ID!, $input: UpdateStudentInput!) {
    updateStudent(id: $id, input: $input) {
      id
      matricNumber
    }
  }
`;

export const BULK_UPLOAD_STUDENTS = gql`
  mutation BulkUploadStudents($inputs: [CreateStudentInput!]!) {
    bulkUploadStudents(inputs: $inputs) {
      successCount
      errorCount
      errors {
        row
        error
      }
    }
  }
`;
