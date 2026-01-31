import { gql } from "graphql-request";

export const GET_DEPARTMENTS = gql`
  query GetDepartments {
    departments {
      id
      name
      code
      facultyId
      stats {
        studentCount
        staffCount
        courseCount
      }
    }
  }
`;

export const CREATE_DEPARTMENT = gql`
  mutation CreateDepartment($input: CreateDepartmentInput!) {
    createDepartment(input: $input) {
      id
      name
      code
    }
  }
`;

export const GET_DEPARTMENT_BY_CODE = gql`
  query GetDepartmentByCode($code: String!) {
    departmentByCode(code: $code) {
      id
      name
      code
      description
      facultyId
      numberOfYears
      stats {
        studentCount
        staffCount
        courseCount
      }
      faculty {
        id
        name
        code
      }
    }
  }
`;

export const REMOVE_DEPARTMENT = gql`
  mutation RemoveDepartment($id: ID!) {
    removeDepartment(id: $id) {
      id
    }
  }
`;
