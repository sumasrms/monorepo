'use client';

import { useQuery } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { useAuth } from '@/lib/auth-client';
import Link from 'next/link';
import { graphqlClient } from '@/lib/graphql-client';

const STUDENT_COURSES_QUERY = gql`
  query GetStudentCourses($studentId: ID!) {
    studentCourses(studentId: $studentId) {
      id
      course {
        id
        code
        title
        credits
        semester
        instructors {
          id
          instructor {
            user {
              name
            }
          }
        }
      }
      status
      grade {
        score
        grade
        remarks
      }
    }
  }
`;

export default function CoursesSection() {
  const { data: session } = useAuth();
  const studentId = session?.user?.studentProfile?.id;

  if (session && !studentId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
        Student profile not found for this account.
      </div>
    );
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['studentCourses', studentId],
    queryFn: () =>
      graphqlClient.request(STUDENT_COURSES_QUERY, { studentId }),
    enabled: !!studentId,
  });

  if (isLoading) {
    return <div className="animate-pulse">Loading courses...</div>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        Failed to load courses
      </div>
    );
  }

  const courses = data?.studentCourses || [];

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-xl font-bold text-gray-900">Registered Courses</h2>
        <p className="text-sm text-gray-600 mt-1">
          Your current and past course enrollments
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-500">
          <p>No courses found. Register for courses to see them here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-t bg-gray-50">
              <tr>
                <th className="border-b px-6 py-3 text-left font-semibold text-gray-700">
                  Course Code
                </th>
                <th className="border-b px-6 py-3 text-left font-semibold text-gray-700">
                  Title
                </th>
                <th className="border-b px-6 py-3 text-center font-semibold text-gray-700">
                  Credits
                </th>
                <th className="border-b px-6 py-3 text-center font-semibold text-gray-700">
                  Grade
                </th>
                <th className="border-b px-6 py-3 text-center font-semibold text-gray-700">
                  Instructor
                </th>
              </tr>
            </thead>
            <tbody>
              {courses.map((enrollment: any) => (
                <tr
                  key={enrollment.id}
                  className="border-t hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {enrollment.course.code}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {enrollment.course.title}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-700">
                    {enrollment.course.credits}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {enrollment.grade ? (
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                        {enrollment.grade.grade}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-700">
                    {enrollment.course.instructors[0]?.instructor?.user?.name ||
                      'TBA'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t px-6 py-4">
        <Link
          href="/courses"
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
        >
          View All Courses →
        </Link>
      </div>
    </div>
  );
}
