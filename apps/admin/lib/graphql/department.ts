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
      hodId
      hod {
        id
        name
        email
        image
      }
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

export const UPDATE_DEPARTMENT = gql`
  mutation UpdateDepartment($id: ID!, $input: UpdateDepartmentInput!) {
    updateDepartment(id: $id, input: $input) {
      id
      hodId
      hod {
        id
        name
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

export const GET_ELIGIBLE_HOD_STAFF = gql`
  query GetEligibleHodStaff($departmentId: ID!) {
    eligibleHodStaff(departmentId: $departmentId) {
      id
      staffNumber
      user {
        id
        name
        email
        image
        role
        managedDepartment {
          id
          name
          code
        }
      }
    }
  }
`;
