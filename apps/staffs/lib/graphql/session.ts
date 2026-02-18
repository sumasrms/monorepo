import { gql } from "graphql-request";

export const GET_ALL_SESSIONS = gql`
  query GetAllSessions {
    getAllSessions {
      id
      session
      startDate
      endDate
      isCurrent
      isActive
    }
  }
`;

export const GET_ACADEMIC_SETTINGS = gql`
  query GetAcademicSettings {
    getAcademicSettings {
      id
      currentSessionId
      currentSemester
      currentSession {
        id
        session
      }
      registrationOpen
      resultAccessFee
      lateRegistrationFee
      resultPublishEnabled
      maintenanceMode
    }
  }
`;

export const GET_CURRENT_SESSION = gql`
  query GetCurrentSession {
    getCurrentSession {
      id
      session
      isCurrent
      isActive
    }
  }
`;

export const CREATE_SESSION = gql`
  mutation CreateSession($input: CreateSessionInput!) {
    createSession(input: $input) {
      id
      session
    }
  }
`;

export const ACTIVATE_SESSION = gql`
  mutation ActivateSession($sessionId: ID!, $semester: Semester!) {
    activateSession(sessionId: $sessionId, semester: $semester) {
      id
      session
      isCurrent
    }
  }
`;

export const UPDATE_SESSION = gql`
  mutation UpdateSession($input: UpdateSessionInput!) {
    updateSession(input: $input) {
      id
      session
      isActive
    }
  }
`;
