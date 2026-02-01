import { gql } from "graphql-request";

export const GET_ALL_SETTINGS = gql`
  query GetAllSettings {
    getAllSettings {
      id
      key
      value
      category
      createdAt
      updatedAt
    }
  }
`;

export const GET_SETTINGS_BY_CATEGORY = gql`
  query GetSettingsByCategory($input: GetSettingsByCategoryInput!) {
    getSettingsByCategory(input: $input) {
      id
      key
      value
      category
      createdAt
      updatedAt
    }
  }
`;

export const GET_SETTING = gql`
  query GetSetting($input: GetSettingInput!) {
    getSetting(input: $input) {
      id
      key
      value
      category
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_SETTING = gql`
  mutation UpdateSetting($input: UpdateSettingInput!) {
    updateSetting(input: $input) {
      id
      key
      value
      category
      updatedAt
    }
  }
`;

export const UPDATE_MULTIPLE_SETTINGS = gql`
  mutation UpdateMultipleSettings($inputs: [UpdateSettingInput!]!) {
    updateMultipleSettings(inputs: $inputs) {
      id
      key
      value
      category
      updatedAt
    }
  }
`;

export const DELETE_SETTING = gql`
  mutation DeleteSetting($key: String!) {
    deleteSetting(key: $key) {
      id
      key
    }
  }
`;

export const RESET_SETTINGS_CATEGORY = gql`
  mutation ResetSettingsCategory($category: String!) {
    resetSettingsCategory(category: $category)
  }
`;
