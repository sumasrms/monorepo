import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "../graphql-client";
import { UPLOAD_IMAGE, DELETE_UPLOAD } from "../../graphql/upload";

interface UploadImageResponse {
  uploadImage: {
    url: string;
    secureUrl: string;
    publicId: string;
    format?: string;
    width?: number;
    height?: number;
    bytes?: number;
  };
}

interface DeleteUploadResponse {
  deleteUpload: boolean;
}

export function useUploadImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      // For GraphQL file uploads, we need to use FormData or a special client
      // Since graphql-request doesn't natively support file uploads,
      // we'll use fetch directly
      const formData = new FormData();

      const operations = {
        query: `
          mutation UploadImage($file: Upload!) {
            uploadImage(file: $file) {
              url
              secureUrl
              publicId
              format
              width
              height
              bytes
            }
          }
        `,
        variables: {
          file: null,
        },
      };

      const map = {
        "0": ["variables.file"],
      };

      formData.append("operations", JSON.stringify(operations));
      formData.append("map", JSON.stringify(map));
      formData.append("0", file);

      const response = await fetch(
        process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql",
        {
          method: "POST",
          body: formData,
          headers: {
            // Don't set Content-Type, let browser set it with boundary
            Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
          },
        },
      );

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      return result.data.uploadImage;
    },
    onSuccess: () => {
      // Invalidate session to refresh user image
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

export function useDeleteUpload() {
  return useMutation({
    mutationFn: async ({
      publicId,
      resourceType = "image",
    }: {
      publicId: string;
      resourceType?: "image" | "video" | "raw";
    }) => {
      const data = await graphqlClient.request<DeleteUploadResponse>(
        DELETE_UPLOAD,
        {
          publicId,
          resourceType,
        },
      );
      return data.deleteUpload;
    },
  });
}
