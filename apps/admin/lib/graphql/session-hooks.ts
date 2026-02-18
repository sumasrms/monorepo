import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "../graphql-client";
import {
  GET_ALL_SESSIONS,
  GET_ACADEMIC_SETTINGS,
  CREATE_SESSION,
  ACTIVATE_SESSION,
  AcademicSession,
  AcademicSettings,
} from "./session";

export function useSessions() {
  return useQuery<{ getAllSessions: AcademicSession[] }>({
    queryKey: ["sessions"],
    queryFn: async () => graphqlClient.request(GET_ALL_SESSIONS),
  });
}

export function useAcademicSettings() {
  return useQuery<{ getAcademicSettings: AcademicSettings }>({
    queryKey: ["academic-settings"],
    queryFn: async () => graphqlClient.request(GET_ACADEMIC_SETTINGS),
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      session: string;
      startDate: Date;
      endDate: Date;
    }) => graphqlClient.request(CREATE_SESSION, { input }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useActivateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      semester,
    }: {
      sessionId: string;
      semester: string;
    }) => graphqlClient.request(ACTIVATE_SESSION, { sessionId, semester }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["academic-settings"] });
    },
  });
}
