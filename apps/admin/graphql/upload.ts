import { gql } from "graphql-request";

export const UPLOAD_IMAGE = gql`
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
`;

export const DELETE_UPLOAD = gql`
  mutation DeleteUpload($publicId: String!, $resourceType: String) {
    deleteUpload(publicId: $publicId, resourceType: $resourceType)
  }
`;

export const UPLOAD_FILE = gql`
  mutation UploadFile($file: Upload!, $folder: String) {
    uploadFile(file: $file, folder: $folder) {
      url
      secureUrl
      publicId
      format
      bytes
      resourceType
    }
  }
`;
