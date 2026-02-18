"use client";

import { useAllFaculties } from "@/features/senate/hooks/useSenateUniversity";
import { Building2, Search, Plus, Clock, ChevronRight } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function SenateFacultiesPage() {
  const { data: faculties, isLoading } = useAllFaculties();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFaculties = faculties?.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.code.toLowerCase().includes(searchTerm.toLowerCase()),
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
            University Hierarchy
          </h1>
          <p className="text-muted-foreground">
            Overview of all faculties and their constituent departments
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:shadow-lg transition-all">
          <Plus className="h-4 w-4" />
          Propose New Faculty
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by faculty name or code..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 shadow-sm outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredFaculties && filteredFaculties.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredFaculties.map((faculty) => (
            <div
              key={faculty.id}
              className="group relative rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/50"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-primary px-2 py-0.5 bg-primary/5 rounded-full uppercase tracking-widest border border-primary/10">
                        {faculty.code}
                      </span>
                    </div>
                    <h3 className="font-bold text-2xl group-hover:text-primary transition-colors">
                      {faculty.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">
                      Primary Academic Division
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-8 lg:border-l lg:pl-8">
                  <div className="text-center">
                    <p className="text-2xl font-black">
                      {faculty.departments.length}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Departments
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black">
                      {faculty.stats?.studentCount?.toLocaleString() || 0}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Students
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black">
                      {faculty.stats?.staffCount?.toLocaleString() || 0}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Staff
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/senate/faculties/${faculty.id}`}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold bg-muted hover:bg-muted/80 rounded-xl transition-all"
                  >
                    View Structure
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Departments Preview */}
              <div className="mt-8 pt-6 border-t">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">
                  Constituent Departments
                </p>
                <div className="flex flex-wrap gap-2">
                  {faculty.departments.slice(0, 5).map((dept) => (
                    <span
                      key={dept.id}
                      className="px-3 py-1.5 bg-muted/50 rounded-lg text-xs font-bold border hover:border-primary/30 transition-all cursor-default"
                    >
                      {dept.name}
                    </span>
                  ))}
                  {faculty.departments.length > 5 && (
                    <span className="px-3 py-1.5 bg-primary/5 text-primary rounded-lg text-xs font-bold border border-primary/10">
                      +{faculty.departments.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed p-20 text-center bg-muted/20">
          <Building2 className="h-16 w-16 mx-auto mb-6 opacity-10" />
          <h3 className="text-xl font-bold mb-2">No faculties found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto font-medium">
            Try adjusting your search to find the academic division you&apos;re
            looking for.
          </p>
        </div>
      )}
    </div>
  );
}
