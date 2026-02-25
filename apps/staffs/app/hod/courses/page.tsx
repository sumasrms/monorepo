"use client";

import { useMyDepartmentalCourses } from "@/features/hod/hooks/useHodCourses";
import { useAuth } from "@/lib/auth";
import {
  BookOpen,
  Search,
  Filter,
  MoreVertical,
  Plus,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { AssignCourseDialog } from "./assign-course-dialog";
import Link from "next/link";
import { useMyDepartmentId } from "@/features/hod/hooks/useMyDepartmentId";

export default function HodCoursesPage() {
  const { session } = useAuth();
  const { data: departmentId, isLoading: deptLoading } = useMyDepartmentId();
  const { data: offerings, isLoading } = useMyDepartmentalCourses();
  const [searchTerm, setSearchTerm] = useState("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  if (deptLoading || isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredOfferings = offerings?.filter(
    (o) =>
      o.course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.course.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Department Courses</h1>
          <p className="text-muted-foreground">
            Manage and view all course offerings
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:shadow-lg transition-all"
          onClick={() => {
            setSelectedCourseId(null);
            setAssignDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Assign New Course
        </button>
        <AssignCourseDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          courseId={selectedCourseId || ""}
          departmentId={departmentId ?? ""}
        />
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by course code or title..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-muted transition-all">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      {filteredOfferings && filteredOfferings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOfferings.map((offering) => (
            <div
              key={offering.id}
              className="group relative rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/50"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <BookOpen className="h-6 w-6" />
                </div>
                <button className="p-1 hover:bg-muted rounded-md transition-colors">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/5 rounded-full">
                    {offering.course.code}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    Level {offering.level}
                  </span>
                </div>
                <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[3rem]">
                  {offering.course.title}
                </h3>
              </div>

              <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    Credits
                  </p>
                  <p className="text-sm font-semibold">
                    {offering.course.credits} Units
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    Semester
                  </p>
                  <p className="text-sm font-semibold capitalize">
                    {offering.semester.toLowerCase()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    Type
                  </p>
                  <p className="text-sm font-semibold capitalize">
                    {offering.courseType.toLowerCase()}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Link
                  href={`/hod/courses/${offering.course.id}`}
                  className="block flex-1 py-2 text-center text-sm font-bold border border-primary/20 text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  View Course Details
                </Link>
                <button
                  className="block flex-1 py-2 text-center text-sm font-bold border border-secondary/20 text-secondary rounded-lg hover:bg-secondary hover:text-secondary-foreground transition-all"
                  onClick={() => {
                    setSelectedCourseId(offering.course.id);
                    setAssignDialogOpen(true);
                  }}
                >
                  Assign to Staff
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed p-16 text-center bg-muted/20">
          <h3 className="text-xl font-bold mb-2">No courses found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search or filters to find what you're looking
            for.
          </p>
        </div>
      )}
    </div>
  );
}
