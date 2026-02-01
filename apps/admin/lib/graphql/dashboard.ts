import { gql } from "graphql-request";

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      studentCount
      staffCount
      courseCount
      departmentCount
      facultyCount
    }
  }
`;

export const GET_DASHBOARD_ANALYTICS = gql`
  query GetDashboardAnalytics {
    dashboardAnalytics {
      studentsByFaculty {
        name
        value
      }
    }
  }
`;

export const GET_RECENT_ACTIVITIES = gql`
  query GetRecentActivities {
    recentActivities {
      id
      type
      description
      timestamp
    }
  }
`;
