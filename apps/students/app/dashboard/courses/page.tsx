"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { gql } from "graphql-request";
import { useRequireAuth } from "@/lib/auth";
import { graphqlClient } from "@/lib/graphql-client";
import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";

type Semester = "FIRST" | "SECOND";

type CourseInstructor = {
  id: string;
  instructor?: {
    user?: {
      name?: string | null;
    } | null;
  } | null;
};

type StudentEnrollment = {
  id: string;
  status: string;
  grade?: {
    grade?: string | null;
    score?: number | null;
    remarks?: string | null;
  } | null;
  course?: {
    id: string;
    code: string;
    title: string;
    credits: number;
    level: number;
    semester: Semester;
    instructors?: CourseInstructor[];
  } | null;
};

type CoursesPageQueryResult = {
  student?: {
    id: string;
    level?: number | null;
    department?: {
      id: string;
      name: string;
      code: string;
      numberOfYears: number;
    } | null;
  } | null;
  studentCourses: StudentEnrollment[];
};

const COURSES_PAGE_QUERY = gql`
  query GetStudentCoursesPage($studentId: ID!) {
    student(id: $studentId) {
      id
      level
      department {
        id
        name
        code
        numberOfYears
      }
    }
    studentCourses(studentId: $studentId) {
      id
      status
      grade {
        grade
        score
        remarks
      }
      course {
        id
        code
        title
        credits
        level
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
    }
  }
`;

function semesterLabel(semester: Semester) {
  return semester === "FIRST" ? "First Semester" : "Second Semester";
}

export default function CoursesPage() {
  const { session, isPending } = useRequireAuth();
  const userWithProfile = session?.user as
    | {
        studentProfile?: { id?: string };
      }
    | undefined;

  const studentId = userWithProfile?.studentProfile?.id;

  const { data, isLoading, error } = useQuery<CoursesPageQueryResult>({
    queryKey: ["studentCoursesPage", studentId],
    queryFn: () =>
      graphqlClient.request<CoursesPageQueryResult>(COURSES_PAGE_QUERY, {
        studentId,
      }),
    enabled: !!studentId,
  });

  const student = data?.student;
  const courses = useMemo(
    () => data?.studentCourses ?? [],
    [data?.studentCourses],
  );

  const levels = useMemo(() => {
    const numberOfYears = student?.department?.numberOfYears ?? 4;
    return Array.from(
      { length: numberOfYears },
      (_, index) => (index + 1) * 100,
    );
  }, [student?.department?.numberOfYears]);

  const [activeLevel, setActiveLevel] = useState<string>("100");
  const [activeSemester, setActiveSemester] = useState<Semester>("FIRST");

  useEffect(() => {
    const firstLevel = levels[0] ?? 100;
    const currentLevel = student?.level ?? firstLevel;
    const defaultLevel = levels.includes(currentLevel)
      ? currentLevel
      : levels[0];

    if (!levels.includes(Number(activeLevel))) {
      setActiveLevel(String(defaultLevel ?? firstLevel));
    }
  }, [activeLevel, levels, student?.level]);

  const filteredCourses = useMemo(() => {
    const selectedLevel = Number(activeLevel);
    return courses.filter(
      (enrollment) =>
        enrollment.course?.level === selectedLevel &&
        enrollment.course?.semester === activeSemester,
    );
  }, [activeLevel, activeSemester, courses]);

  if (isPending) {
    return (
      <main className="flex h-screen w-full items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-muted-foreground">Loading...</div>
      </main>
    );
  }

  if (session && !studentId) {
    return (
      <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          Student profile not found for this account.
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border bg-white p-6 text-sm text-gray-600 shadow-sm">
          Loading courses...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          Failed to load courses.
        </div>
      </main>
    );
  }

  return (
    <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
        <p className="mt-2 text-gray-600">
          Browse your courses by level and semester.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant="outline">{student?.department?.code ?? "N/A"}</Badge>
        <Badge variant="outline">
          {student?.department?.name ?? "Department not set"}
        </Badge>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <Tabs value={activeLevel} onValueChange={setActiveLevel}>
          <TabsList className="mb-4 w-full justify-start overflow-x-auto">
            {levels.map((level) => (
              <TabsTrigger key={level} value={String(level)}>
                {level}lv
              </TabsTrigger>
            ))}
          </TabsList>

          {levels.map((level) => (
            <TabsContent key={level} value={String(level)}>
              <Tabs
                value={activeSemester}
                onValueChange={(value) => setActiveSemester(value as Semester)}
              >
                <TabsList className="mb-4 w-full justify-start">
                  <TabsTrigger value="FIRST">First Semester</TabsTrigger>
                  <TabsTrigger value="SECOND">Second Semester</TabsTrigger>
                </TabsList>

                <TabsContent value="FIRST">
                  {activeSemester === "FIRST" &&
                    Number(activeLevel) === level && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          {semesterLabel("FIRST")}
                        </p>
                        {filteredCourses.length === 0 ? (
                          <div className="rounded-md border bg-gray-50 p-4 text-sm text-gray-600">
                            No courses found for {level}lv, First Semester.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Code</TableHead>
                                  <TableHead>Title</TableHead>
                                  <TableHead className="text-center">
                                    Credits
                                  </TableHead>
                                  <TableHead className="text-center">
                                    Instructor
                                  </TableHead>
                                  <TableHead className="text-center">
                                    Status
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredCourses.map((enrollment) => (
                                  <TableRow key={enrollment.id}>
                                    <TableCell className="font-medium">
                                      {enrollment.course?.code}
                                    </TableCell>
                                    <TableCell>
                                      {enrollment.course?.title}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {enrollment.course?.credits}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {enrollment.course?.instructors?.[0]
                                        ?.instructor?.user?.name || "TBA"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Badge variant="outline">
                                        {enrollment.status}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    )}
                </TabsContent>

                <TabsContent value="SECOND">
                  {activeSemester === "SECOND" &&
                    Number(activeLevel) === level && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          {semesterLabel("SECOND")}
                        </p>
                        {filteredCourses.length === 0 ? (
                          <div className="rounded-md border bg-gray-50 p-4 text-sm text-gray-600">
                            No courses found for {level}lv, Second Semester.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Code</TableHead>
                                  <TableHead>Title</TableHead>
                                  <TableHead className="text-center">
                                    Credits
                                  </TableHead>
                                  <TableHead className="text-center">
                                    Instructor
                                  </TableHead>
                                  <TableHead className="text-center">
                                    Status
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredCourses.map((enrollment) => (
                                  <TableRow key={enrollment.id}>
                                    <TableCell className="font-medium">
                                      {enrollment.course?.code}
                                    </TableCell>
                                    <TableCell>
                                      {enrollment.course?.title}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {enrollment.course?.credits}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {enrollment.course?.instructors?.[0]
                                        ?.instructor?.user?.name || "TBA"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Badge variant="outline">
                                        {enrollment.status}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    )}
                </TabsContent>
              </Tabs>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </main>
  );
}
