import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gql } from "graphql-request";
import { Result, Faculty } from "@/features/results/types";
import { graphqlFetch } from "@/lib/api";

export interface UniversityStats {
  studentCount: number;
  staffCount: number;
  courseCount: number;
  departmentCount: number;
  facultyCount: number;
}

export interface UniversityAnalytics {
  gradeDistribution: {
    name: string;
    value: number;
  }[];
  passRate: number;
  avgGPByLevel: {
    name: string;
    value: number;
  }[];
}

const GET_UNIVERSITY_STATS = gql`
  query GetUniversityStats {
    dashboardStats {
      studentCount
      staffCount
      courseCount
      departmentCount
      facultyCount
    }
  }
`;

const GET_UNIVERSITY_ANALYTICS = gql`
  query GetUniversityAnalytics {
    universityAnalytics {
      gradeDistribution {
        name
        value
      }
      passRate
      avgGPByLevel {
        name
        value
      }
    }
  }
`;

const GET_PENDING_RESULTS_FOR_SENATE = gql`
  query GetPendingResultsForSenate {
    pendingResultsForSenate {
      id
      score
      grade
      status
      semester
      session
      createdAt
      student {
        user {
          name
        }
      }
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
      uploadedBy {
        user {
          name
        }
      }
      approval {
        hodRemarks
        deanRemarks
        hodApprovedBy {
          name
        }
        deanApprovedBy {
          name
        }
      }
    }
  }
`;

const SENATE_APPROVE_RESULTS = gql`
  mutation SenateApproveResults($input: SenateApproveResultsInput!) {
    senateApproveResults(input: $input) {
      id
      status
    }
  }
`;

const SENATE_REJECT_RESULTS = gql`
  mutation SenateRejectResults($input: SenateRejectResultsInput!) {
    senateRejectResults(input: $input) {
      id
      status
    }
  }
`;

const SENATE_PUBLISH_RESULTS = gql`
  mutation SenatePublishResults($resultIds: [ID!]!) {
    senatePublishResults(resultIds: $resultIds)
  }
`;

const GET_ALL_FACULTIES = gql`
  query GetAllFaculties {
    faculties {
      id
      name
      code
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
        stats {
          studentCount
          staffCount
          courseCount
        }
      }
    }
  }
`;

const GET_RESULTS_FOR_SENATE = gql`
  query GetResultsForSenate(
    $facultyId: ID
    $departmentId: ID
    $courseId: String
    $semester: String
    $session: String
    $status: String
  ) {
    resultsForSenate(
      facultyId: $facultyId
      departmentId: $departmentId
      courseId: $courseId
      semester: $semester
      session: $session
      status: $status
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
        department {
          id
          name
          code
          faculty {
            id
            name
            code
          }
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

const GET_FACULTY_DETAILS = gql`
  query GetFacultyDetails($id: ID!) {
    faculty(id: $id) {
      id
      name
      code
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
        stats {
          studentCount
          staffCount
          courseCount
        }
      }
    }
  }
`;

export const useAllFaculties = () => {
  return useQuery<Faculty[]>({
    queryKey: ["all-faculties"],
    queryFn: async () => {
      const data = await graphqlFetch<{ faculties: Faculty[] }>(
        GET_ALL_FACULTIES,
      );
      return data.faculties;
    },
  });
};

export const useUniversityStats = () => {
  return useQuery<UniversityStats>({
    queryKey: ["university-stats"],
    queryFn: async () => {
      const data = await graphqlFetch<{ dashboardStats: UniversityStats }>(
        GET_UNIVERSITY_STATS,
      );
      return data.dashboardStats;
    },
  });
};

export const useUniversityAnalytics = () => {
  return useQuery<UniversityAnalytics>({
    queryKey: ["university-analytics"],
    queryFn: async () => {
      const data = await graphqlFetch<{
        universityAnalytics: UniversityAnalytics;
      }>(GET_UNIVERSITY_ANALYTICS);
      return data.universityAnalytics;
    },
  });
};

export const usePendingResultsForSenate = () => {
  return useQuery<Result[]>({
    queryKey: ["pending-results-senate"],
    queryFn: async () => {
      const data = await graphqlFetch<{
        pendingResultsForSenate: Result[];
      }>(GET_PENDING_RESULTS_FOR_SENATE);
      return data.pendingResultsForSenate;
    },
  });
};

export const useSenateApproveResults = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { resultIds: string[]; remarks?: string }) => {
      return graphqlFetch(SENATE_APPROVE_RESULTS, { input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-results-senate"] });
    },
  });
};

export const useSenateRejectResults = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { resultIds: string[]; remarks: string }) => {
      return graphqlFetch(SENATE_REJECT_RESULTS, { input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-results-senate"] });
    },
  });
};

export const useSenatePublishResults = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (resultIds: string[]) => {
      return graphqlFetch(SENATE_PUBLISH_RESULTS, { resultIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-results-senate"] });
    },
  });
};

export const useSenateResultsHistory = (filters?: {
  facultyId?: string;
  departmentId?: string;
  courseId?: string;
  semester?: string;
  session?: string;
  status?: string;
}) => {
  return useQuery<Result[]>({
    queryKey: ["senate-results-history", filters],
    queryFn: async () => {
      const data = await graphqlFetch<{ resultsForSenate: Result[] }>(
        GET_RESULTS_FOR_SENATE,
        {
          facultyId: filters?.facultyId || null,
          departmentId: filters?.departmentId || null,
          courseId: filters?.courseId || null,
          semester: filters?.semester || null,
          session: filters?.session || null,
          status: filters?.status || null,
        },
      );
      return data.resultsForSenate;
    },
  });
};

export const useSenateFacultyDetail = (id: string) => {
  return useQuery({
    queryKey: ["senate-faculty", id],
    queryFn: async () => {
      const data = await graphqlFetch<{ faculty: Faculty }>(
        GET_FACULTY_DETAILS,
        { id },
      );
      return data.faculty;
    },
    enabled: !!id,
  });
};
