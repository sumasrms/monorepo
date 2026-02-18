"use client";

import { useParams, useRouter } from "next/navigation";
import { Clock, Building2, Users, BookOpen, ChevronLeft } from "lucide-react";
import { StatCard } from "@workspace/ui/components/stat-card";

import { useSenateFacultyDetail } from "@/features/senate/hooks/useSenateUniversity";

type FacultyDetail = {
  id: string;
  name: string;
  code: string;
  stats?: {
    studentCount: number;
    staffCount: number;
    courseCount: number;
    departmentCount: number;
  };
  departments?: {
    id: string;
    name: string;
    code: string;
    stats?: {
      studentCount: number;
      staffCount: number;
      courseCount: number;
    };
  }[];
};

export default function SenateFacultyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const facultyId = params.facultyId as string;

  const { data: faculty, isLoading } = useSenateFacultyDetail(facultyId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className="space-y-4 rounded-xl border p-12 text-center">
        <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-bold">Faculty not found</h2>
        <p className="text-muted-foreground">
          The requested faculty record is unavailable.
        </p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-bold"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Faculties
        </button>
      </div>
    );
  }

  const facultyDetail = faculty as FacultyDetail;

  return (
    <div className="space-y-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to University Overview
      </button>

      <div>
        <h1 className="text-3xl font-bold">{facultyDetail.name}</h1>
        <p className="text-muted-foreground">
          Faculty code: {facultyDetail.code}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          title="Departments"
          value={facultyDetail.stats?.departmentCount || 0}
          footerLabel="Academic units"
          footerIcon={Building2}
        />
        <StatCard
          title="Students"
          value={facultyDetail.stats?.studentCount || 0}
          footerLabel="Total enrollment"
          footerIcon={Users}
        />
        <StatCard
          title="Staff"
          value={facultyDetail.stats?.staffCount || 0}
          footerLabel="Academic staff"
          footerIcon={Users}
        />
        <StatCard
          title="Courses"
          value={facultyDetail.stats?.courseCount || 0}
          footerLabel="Curriculum offerings"
          footerIcon={BookOpen}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Departments & Curriculum Snapshot</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {facultyDetail.departments?.map((dept) => (
            <div
              key={dept.id}
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">
                    {dept.code}
                  </p>
                  <h3 className="text-lg font-bold">{dept.name}</h3>
                </div>
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-sm font-bold">
                    {dept.stats?.studentCount || 0}
                  </p>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Students
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold">
                    {dept.stats?.staffCount || 0}
                  </p>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Staff
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold">
                    {dept.stats?.courseCount || 0}
                  </p>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Courses
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
