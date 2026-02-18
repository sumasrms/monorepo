import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "graphql-request";
import {
  GET_ALL_SESSIONS,
  GET_ACADEMIC_SETTINGS,
  CREATE_SESSION,
  ACTIVATE_SESSION,
} from "./session";

import { getAuthHeaders, getGraphqlEndpoint } from "../api";

const GQL_URL = getGraphqlEndpoint();

type CreateSessionInput = {
  session: string;
  startDate: Date;
  endDate: Date;
};

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async () =>
      request(GQL_URL, GET_ALL_SESSIONS, undefined, getAuthHeaders()),
  });
}

export function useAcademicSettings() {
  return useQuery({
    queryKey: ["academic-settings"],
    queryFn: async () =>
      request(GQL_URL, GET_ACADEMIC_SETTINGS, undefined, getAuthHeaders()),
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSessionInput) =>
      request(GQL_URL, CREATE_SESSION, { input }, getAuthHeaders()),
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
    }) =>
      request(
        GQL_URL,
        ACTIVATE_SESSION,
        { sessionId, semester },
        getAuthHeaders(),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["academic-settings"] });
    },
  });
}
