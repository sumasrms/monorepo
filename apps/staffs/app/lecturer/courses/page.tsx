"use client";

import { useAssignedCourses } from "@/features/lecturers/hooks/useLecturer";
import { useSession } from "@/lib/auth-client";
import { BookOpen, Users, Upload, Clock } from "lucide-react";
import Link from "next/link";
import { AssignedCourse } from "@/features/lecturers/hooks/useLecturer";

export default function CoursesPage() {
  const { data: session } = useSession();
  const staffId = (session?.user as any)?.staffProfile?.id;
  const { data: courses, isLoading } = useAssignedCourses(staffId || "");

  if (!session) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <p>Please log in to view your courses</p>
      </div>
    );
  }

  if (!staffId) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <p>No staff profile found for your account</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-5 w-5 animate-spin" />
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">
          Courses assigned to you for the current semester
        </p>
      </div>

      {courses && courses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((assignment: AssignedCourse) => (
            <Link
              key={assignment.id}
              href={`/lecturer/courses/${assignment.courseId}`}
              className="group rounded-lg border p-6 transition-all hover:border-primary hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-lg bg-primary/10 p-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                {assignment.isPrimary && (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    Primary
                  </span>
                )}
              </div>

              <h3 className="mb-1 font-semibold group-hover:text-primary">
                {assignment.course.code}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {assignment.course.title}
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>Level {assignment.course.level}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  <span>{assignment.course.credits} Credits</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border p-12 text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No courses assigned</h3>
          <p className="text-sm text-muted-foreground">
            You don't have any courses assigned for this semester
          </p>
        </div>
      )}
    </div>
  );
}
