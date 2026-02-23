"use client";

import { useQuery } from "@tanstack/react-query";
import { gql } from "graphql-request";
import { useAuth } from "@/lib/auth-client";
import Link from "next/link";
import { graphqlClient } from "@/lib/graphql-client";
import { Button } from "@workspace/ui/components/button";
import { useRouter } from "next/navigation";
import { MoveRight } from "lucide-react";

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
  const router = useRouter();
  const userWithProfile = session?.user as
    | {
        studentProfile?: { id?: string };
      }
    | undefined;
  const studentId = userWithProfile?.studentProfile?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ["studentCourses", studentId],
    queryFn: () => graphqlClient.request(STUDENT_COURSES_QUERY, { studentId }),
    enabled: !!studentId,
  });

  if (session && !studentId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
        Student profile not found for this account.
      </div>
    );
  }

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
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-xl font-bold text-foreground">
          Registered Courses
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your current and past course enrollments
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="px-6 py-8 text-center text-muted-foreground">
          <p>No courses found. Register for courses to see them here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-t bg-muted">
              <tr>
                <th className="border-b px-6 py-3 text-left font-semibold text-muted-foreground">
                  Course Code
                </th>
                <th className="border-b px-6 py-3 text-left font-semibold text-muted-foreground">
                  Title
                </th>
                <th className="border-b px-6 py-3 text-center font-semibold text-muted-foreground">
                  Credits
                </th>
                <th className="border-b px-6 py-3 text-center font-semibold text-muted-foreground">
                  Grade
                </th>
                <th className="border-b px-6 py-3 text-center font-semibold text-muted-foreground">
                  Instructor
                </th>
              </tr>
            </thead>
            <tbody>
              {courses.map((enrollment: any) => (
                <tr
                  key={enrollment.id}
                  className="border-t hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-foreground">
                    {enrollment.course.code}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {enrollment.course.title}
                  </td>
                  <td className="px-6 py-4 text-center text-muted-foreground">
                    {enrollment.course.credits}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {enrollment.grade ? (
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                        {enrollment.grade.grade}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-muted-foreground">
                    {enrollment.course.instructors[0]?.instructor?.user?.name ||
                      "TBA"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t px-6 py-4">
        <Button
          onClick={() => router.push("/dashboard/courses")}
          className="text-sm bg-primary px-4 py-3 rounded-2xl "
        >
          View All Courses <MoveRight />
        </Button>
      </div>
    </div>
  );
}
