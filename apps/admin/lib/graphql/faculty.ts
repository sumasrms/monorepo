import { gql } from "graphql-request";

export const GET_FACULTIES = gql`
  query GetFaculties {
    faculties {
      id
      name
      code
      description
      deanId
      createdAt
      updatedAt
      stats {
        studentCount
        staffCount
        courseCount
        departmentCount
      }
    }
  }
`;

export const GET_FACULTY_BY_CODE = gql`
  query GetFacultyByCode($code: String!) {
    facultyByCode(code: $code) {
      id
      name
      code
      description
      deanId
      dean {
        id
        name
        email
        image
      }
      createdAt
      updatedAt
      stats {
        studentCount
        staffCount
        courseCount
        departmentCount
      }
      departments {
        id
        name
        code
        description
        stats {
          studentCount
          staffCount
          courseCount
        }
      }
    }
  }
`;

export const CREATE_FACULTY = gql`
  mutation CreateFaculty($input: CreateFacultyInput!) {
    createFaculty(input: $input) {
      id
      name
      code
      description
      deanId
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_FACULTY = gql`
  mutation UpdateFaculty($id: ID!, $input: UpdateFacultyInput!) {
    updateFaculty(id: $id, input: $input) {
      id
      deanId
      dean {
        id
        name
      }
    }
  }
`;

export const REMOVE_FACULTY = gql`
  mutation RemoveFaculty($id: ID!) {
    removeFaculty(id: $id) {
      id
    }
  }
`;
