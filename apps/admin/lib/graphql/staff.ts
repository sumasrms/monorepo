import { gql } from "graphql-request";

export const GET_STAFFS = gql`
  query GetStaffs {
    staffs {
      id
      staffNumber
      institutionalRank
      designation
      employmentDate
      dateOfBirth
      employmentType
      departmentId
      user {
        id
        name
        email
        gender
      }
    }
  }
`;

export const GET_STAFF = gql`
  query GetStaff($id: ID!) {
    staff(id: $id) {
      id
      staffNumber
      institutionalRank
      designation
      employmentDate
      dateOfBirth
      employmentType
      departmentId
      user {
        id
        name
        email
        gender
      }
    }
  }
`;

export const CREATE_STAFF = gql`
  mutation CreateStaff($input: CreateStaffInput!) {
    createStaff(input: $input) {
      id
      staffNumber
      user {
        name
      }
    }
  }
`;

export const UPDATE_STAFF = gql`
  mutation UpdateStaff($id: ID!, $input: UpdateStaffInput!) {
    updateStaff(id: $id, input: $input) {
      id
      staffNumber
    }
  }
`;

export const REMOVE_STAFF = gql`
  mutation RemoveStaff($id: ID!) {
    removeStaff(id: $id)
  }
`;

export const BULK_UPLOAD_STAFF = gql`
  mutation BulkUploadStaff($inputs: [CreateStaffInput!]!) {
    bulkUploadStaff(inputs: $inputs) {
      successCount
      errorCount
      errors {
        row
        error
      }
    }
  }
`;
