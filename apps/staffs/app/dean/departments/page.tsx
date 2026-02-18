"use client";

import {
  useMyFacultyDepartments,
  useMyFacultyAnalytics,
} from "@/features/dean/hooks/useDeanFaculty";
import {
  Building2,
  Users,
  BookOpen,
  Search,
  Filter,
  MoreVertical,
  Plus,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function DeanDepartmentsPage() {
  const { data: departments, isLoading } = useMyFacultyDepartments();
  const { data: analytics } = useMyFacultyAnalytics();
  const [searchTerm, setSearchTerm] = useState("");

  type DepartmentMetric = {
    id: string;
    submissionRate: number;
    pendingApprovals: number;
  };

  const filteredDepts = departments?.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Faculty Departments
          </h1>
          <p className="text-muted-foreground">
            Manage and oversee all departments within your faculty
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:shadow-lg transition-all">
          <Plus className="h-4 w-4" />
          Request New Department
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by department name or code..."
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

      {filteredDepts && filteredDepts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepts.map((dept) => (
            <div
              key={dept.id}
              className="group relative rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/50"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Building2 className="h-6 w-6" />
                </div>
                <button className="p-1 hover:bg-muted rounded-md transition-colors">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/5 rounded-full uppercase tracking-widest border border-primary/10">
                    {dept.code}
                  </span>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                    Active Unit
                  </p>
                </div>
                <h3 className="font-bold text-xl leading-tight group-hover:text-primary transition-colors">
                  {dept.name}
                </h3>
              </div>

              <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold opacity-60">
                    Submission Rate
                  </p>
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    {(
                      analytics?.departmentMetrics.find(
                        (metric: DepartmentMetric) => metric.id === dept.id,
                      )?.submissionRate ?? 0
                    ).toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold opacity-60">
                    Pending Approvals
                  </p>
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    {analytics?.departmentMetrics.find(
                      (metric: DepartmentMetric) => metric.id === dept.id,
                    )?.pendingApprovals || 0}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href={`/dean/departments/${dept.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold border border-primary/20 text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-all group"
                >
                  Manage Department
                  <ExternalLink className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed p-16 text-center bg-muted/20">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-bold mb-2">No departments found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search or filters to find what you're looking
            for.
          </p>
        </div>
      )}
    </div>
  );
}
