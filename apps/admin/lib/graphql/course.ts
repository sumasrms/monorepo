import { gql } from "graphql-request";

export const GET_COURSES = gql`
  query GetCourses {
    courses {
      id
      code
      title
      credits
      semester
      level
      department {
        id
        name
      }
    }
  }
`;

export const GET_COURSE_BY_CODE = gql`
  query GetCourseByCode($code: String!) {
    courseByCode(code: $code) {
      id
      code
      title
      description
      credits
      departmentId
      semester
      academicYear
      level
      isActive
      department {
        id
        name
        code
      }
      instructors {
        instructorId
        isPrimary
        instructor {
          id
          staffNumber
          user {
            name
            email
          }
        }
      }
      departmentOfferings {
        departmentId
        courseType
        semester
        level
        department {
          id
          name
          code
        }
      }
    }
  }
`;

export const CREATE_COURSE = gql`
  mutation CreateCourse($input: CreateCourseInput!) {
    createCourse(input: $input) {
      id
      code
      title
    }
  }
`;

export const UPDATE_COURSE = gql`
  mutation UpdateCourse($id: String!, $input: UpdateCourseInput!) {
    updateCourse(id: $id, input: $input) {
      id
      code
      title
    }
  }
`;

export const REMOVE_COURSE = gql`
  mutation RemoveCourse($id: ID!) {
    removeCourse(id: $id) {
      id
    }
  }
`;

export const ASSIGN_INSTRUCTOR = gql`
  mutation AssignInstructor($input: AssignInstructorInput!) {
    assignInstructor(input: $input)
  }
`;

export const BORROW_COURSE = gql`
  mutation BorrowCourse($input: BorrowCourseInput!) {
    borrowCourse(input: $input)
  }
`;

export const GET_DEPARTMENT_OFFERINGS = gql`
  query GetDepartmentOfferings($departmentId: String!) {
    departmentOfferings(departmentId: $departmentId) {
      id
      courseType
      semester
      level
      academicYear
      course {
        id
        code
        title
        credits
        semester
        level
      }
    }
  }
`;

export const REMOVE_COURSE_FROM_DEPARTMENT = gql`
  mutation RemoveCourseFromDepartment(
    $departmentId: String!
    $courseId: String!
  ) {
    removeCourseFromDepartment(departmentId: $departmentId, courseId: $courseId)
  }
`;

export const ADD_COURSE_TO_DEPARTMENT = BORROW_COURSE;
