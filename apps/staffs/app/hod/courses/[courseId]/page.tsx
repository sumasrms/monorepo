"use client";

import { useParams, useRouter } from "next/navigation";
import { useCourseDetails } from "@/features/hod/hooks/useHodCourses";
import {
  BookOpen,
  Users,
  ChevronLeft,
  Calendar,
  Layers,
  FileText,
  User,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { StatCard } from "@workspace/ui/components/stat-card";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const { data: course, isLoading } = useCourseDetails(courseId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="p-4 bg-muted rounded-full mb-4">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">Course not found</h2>
        <p className="text-muted-foreground mb-4">
          The course you are looking for does not exist or you don't have
          permission to view it.
        </p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Breadcrumb / Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Department Courses
      </button>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <BookOpen className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary px-2 py-0.5 bg-primary/5 rounded-full uppercase tracking-wider">
                {course.code}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {course.academicYear}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {course.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Enrollments"
          value={course.enrollments?.length || 0}
          trend={{ label: "Confirmed Students", direction: "up" }}
          footerLabel="Enrolled this session"
          footerIcon={Users}
        />
        <StatCard
          title="Course Weight"
          value={`${course.credits} Units`}
          trend={{ label: "Standard", direction: "up" }}
          footerLabel="Credit units"
          footerIcon={Layers}
        />
        <StatCard
          title="Current Level"
          value={course.level}
          trend={{ label: "Year", direction: "up" }}
          footerLabel="Academic Level"
          footerIcon={FileText}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Instructors & Description */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Course Description
            </h2>
            <div className="p-6 rounded-xl border bg-card text-muted-foreground leading-relaxed">
              {course.description || "No description provided for this course."}
            </div>
          </section>

          {/* Instructors */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Assigned Instructors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {course.instructors && course.instructors.length > 0 ? (
                course.instructors.map((ci: any) => (
                  <div
                    key={ci.id}
                    className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary/50 transition-all shadow-sm group"
                  >
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{ci.instructor.user.name}</p>
                        {ci.isPrimary && (
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full uppercase">
                            <ShieldCheck className="h-2 w-2" />
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {ci.instructor.institutionalRank}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-8 border-2 border-dashed rounded-xl text-center text-muted-foreground bg-muted/20">
                  No instructors assigned yet
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Col: Metadata & Quick Actions */}
        <div className="space-y-6">
          <section className="p-6 rounded-xl border bg-card space-y-6">
            <h2 className="font-bold border-b pb-4">Course Info</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Semester</span>
                <span className="font-bold capitalize">
                  {course.semester.toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Academic Year</span>
                <span className="font-bold">{course.academicYear}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="flex items-center gap-1.5 font-bold text-green-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Active
                </span>
              </div>
            </div>
          </section>

          <section className="p-6 rounded-xl border bg-card space-y-4">
            <h2 className="font-bold">Quick Actions</h2>
            <div className="flex flex-col gap-2">
              <button
                onClick={() =>
                  router.push(`/hod/approvals?courseId=${courseId}`)
                }
                className="flex items-center justify-between p-3 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:shadow-lg transition-all"
              >
                View Pending Results
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </button>
              <button className="flex items-center justify-between p-3 rounded-lg border text-sm font-bold hover:bg-muted transition-all">
                Export Student List
                <FileText className="h-4 w-4" />
              </button>
              <button className="flex items-center justify-between p-3 rounded-lg border text-sm font-bold hover:bg-muted transition-all text-red-500 border-red-100 bg-red-50/20">
                Unassign Course
                <Layers className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
