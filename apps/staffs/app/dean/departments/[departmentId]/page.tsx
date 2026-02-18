"use client";

import { useParams } from "next/navigation";
import {
  useFacultyDepartment,
  useDepartmentOfferings,
  useStaffByDepartment,
  useFacultyResults,
  useFacultyResultAudits,
} from "@/features/dean/hooks/useDeanFaculty";
import { Clock, BookOpen, Users, GraduationCap, ShieldCheck } from "lucide-react";

export default function DeanDepartmentDetailPage() {
  const params = useParams<{ departmentId: string }>();
  const departmentId = params?.departmentId as string;

  const { data: department, isLoading: departmentLoading } =
    useFacultyDepartment(departmentId);
  const { data: offerings, isLoading: offeringsLoading } =
    useDepartmentOfferings(departmentId);
  const { data: staff, isLoading: staffLoading } =
    useStaffByDepartment(departmentId);
  const { data: results, isLoading: resultsLoading } = useFacultyResults({
    departmentId,
  });
  const { data: audits, isLoading: auditsLoading } =
    useFacultyResultAudits(departmentId);

  if (
    departmentLoading ||
    offeringsLoading ||
    staffLoading ||
    resultsLoading ||
    auditsLoading
  ) {
    return (
      <div className="flex items-center justify-center p-12">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const recentResults = results?.slice(0, 8) || [];
  const recentAudits = audits?.slice(0, 8) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{department?.name}</h1>
        <p className="text-muted-foreground">
          Department overview and recent activity ({department?.code})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                Students
              </p>
              <p className="text-2xl font-bold">
                {department?.stats?.studentCount || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                Staff
              </p>
              <p className="text-2xl font-bold">
                {department?.stats?.staffCount || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                Courses
              </p>
              <p className="text-2xl font-bold">
                {department?.stats?.courseCount || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-bold mb-4">Course Offerings</h2>
          <div className="space-y-3">
            {offerings?.length ? (
              offerings.map((offering) => (
                <div
                  key={offering.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {offering.course.code} - {offering.course.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {offering.level} Level • {offering.semester} Semester
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary">
                    {offering.courseType}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No course offerings available.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-bold mb-4">Staff</h2>
          <div className="space-y-3">
            {staff?.length ? (
              staff.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {member.user?.name || "Unnamed"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {member.designation || member.institutionalRank || "Staff"}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {member.user?.email || ""}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No staff members listed.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-bold mb-4">Recent Results</h2>
          <div className="space-y-3">
            {recentResults.length ? (
              recentResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {result.course?.code} - {result.student?.user?.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {result.session} • {result.semester}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {result.status.replace(/_/g, " ")}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent results found.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-bold mb-4">Audit Trail</h2>
          <div className="space-y-3">
            {recentAudits.length ? (
              recentAudits.map((audit) => (
                <div
                  key={audit.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {audit.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {audit.result?.course?.code} • {audit.result?.student?.matricNumber}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    {audit.actorRole || "SYSTEM"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No audit entries found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
