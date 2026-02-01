import { gql } from "graphql-request";

export const GET_GRADE_SCALES = gql`
  query GetGradeScales($departmentId: String!) {
    gradeScales(departmentId: $departmentId) {
      id
      grade
      minScore
      maxScore
      gradePoint
      description
    }
  }
`;

export const CREATE_GRADE_SCALE = gql`
  mutation CreateGradeScale($input: CreateGradeScaleInput!) {
    createGradeScale(input: $input) {
      id
      grade
    }
  }
`;

export const UPDATE_GRADE_SCALE = gql`
  mutation UpdateGradeScale($id: String!, $input: UpdateGradeScaleInput!) {
    updateGradeScale(id: $id, input: $input) {
      id
      grade
    }
  }
`;

export const REMOVE_GRADE_SCALE = gql`
  mutation RemoveGradeScale($id: ID!) {
    removeGradeScale(id: $id) {
      id
    }
  }
`;
