import { gql } from "graphql-request";

export const UPDATE_PROFILE_IMAGE = gql`
  mutation UpdateProfileImage($image: String!) {
    updateProfileImage(image: $image) {
      id
      email
      name
      image
    }
  }
`;
