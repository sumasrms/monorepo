import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GET_ALL_SETTINGS,
  GET_SETTINGS_BY_CATEGORY,
  UPDATE_SETTING,
  UPDATE_MULTIPLE_SETTINGS,
} from "../../graphql/settings";
import { graphqlClient } from "../graphql-client";

interface Setting {
  id: string;
  key: string;
  value: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateSettingInput {
  key: string;
  value: string;
  category?: string;
}

export function useSettings() {
  return useQuery<Setting[]>({
    queryKey: ["settings"],
    queryFn: async () => {
      const data = await graphqlClient.request<{ getAllSettings: Setting[] }>(
        GET_ALL_SETTINGS,
      );
      return data.getAllSettings;
    },
  });
}

export function useSettingsByCategory(category: string) {
  return useQuery<Setting[]>({
    queryKey: ["settings", category],
    queryFn: async () => {
      const data = await graphqlClient.request<{
        getSettingsByCategory: Setting[];
      }>(GET_SETTINGS_BY_CATEGORY, {
        input: { category },
      });
      return data.getSettingsByCategory;
    },
    enabled: !!category,
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSettingInput) => {
      const data = await graphqlClient.request<{ updateSetting: Setting }>(
        UPDATE_SETTING,
        { input },
      );
      return data.updateSetting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useUpdateMultipleSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inputs: UpdateSettingInput[]) => {
      const data = await graphqlClient.request<{
        updateMultipleSettings: Setting[];
      }>(UPDATE_MULTIPLE_SETTINGS, { inputs });
      return data.updateMultipleSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

// Helper function to convert settings array to key-value map
export function settingsToMap(settings: Setting[]): Record<string, string> {
  return settings.reduce(
    (acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    },
    {} as Record<string, string>,
  );
}

// Helper to get a single setting value from the array
export function getSettingValue(
  settings: Setting[] | undefined,
  key: string,
  defaultValue: string = "",
): string {
  if (!settings) return defaultValue;
  const setting = settings.find((s) => s.key === key);
  return setting?.value || defaultValue;
}
