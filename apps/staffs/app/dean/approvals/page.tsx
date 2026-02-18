"use client";

import {
  usePendingResultsByFaculty,
  useDeanApproveResults,
  useDeanRejectResults,
} from "@/features/dean/hooks/useDeanFaculty";
import {
  CheckCircle,
  XCircle,
  BookOpen,
  Users,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  MessageSquare,
  Building2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function DeanApprovalsPage() {
  const { data: results, isLoading } = usePendingResultsByFaculty();
  const approveMutation = useDeanApproveResults();
  const rejectMutation = useDeanRejectResults();

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const analyzeResult = (result: any) => {
    const issues: string[] = [];
    const ca = result.ca;
    const exam = result.exam;
    const score = result.score;

    if (ca === null || ca === undefined || exam === null || exam === undefined) {
      issues.push("Missing CA/Exam");
    }

    if (!result.grade) {
      issues.push("Missing Grade");
    }

    const computedScore = (ca || 0) + (exam || 0);
    if (score === null || score === undefined) {
      issues.push("Missing Score");
    } else if (Math.abs(score - computedScore) > 0.5) {
      issues.push("Score Mismatch");
    }

    if (
      score < 0 ||
      score > 100 ||
      (ca || 0) < 0 ||
      (ca || 0) > 30 ||
      (exam || 0) < 0 ||
      (exam || 0) > 70
    ) {
      issues.push("Out of Range");
    }

    if (result.gradePoint < 0 || result.gradePoint > 5) {
      issues.push("Invalid Grade Point");
    }

    return issues;
  };

  // Group results by Course (within Department)
  const groupedResults = useMemo(() => {
    if (!results) return {};
    return results.reduce((acc: any, result: any) => {
      const groupKey = `${result.course.department.code} - ${result.course.code}`;
      if (!acc[groupKey]) {
        acc[groupKey] = {
          department: result.course.department.name,
          courseCode: result.course.code,
          courseTitle: result.course.title,
          results: [],
        };
      }
      acc[groupKey].results.push(result);
      return acc;
    }, {});
  }, [results]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const anomaliesByGroup = useMemo(() => {
    const summaryMap = new Map<string, { total: number; issues: [string, number][] }>();

    Object.entries(groupedResults).forEach(([key, group]: any) => {
      const issueCounts = new Map<string, number>();
      let total = 0;
      group.results.forEach((result: any) => {
        const issues = analyzeResult(result);
        total += issues.length;
        issues.forEach((issue) => {
          issueCounts.set(issue, (issueCounts.get(issue) || 0) + 1);
        });
      });

      summaryMap.set(key, {
        total,
        issues: Array.from(issueCounts.entries()),
      });
    });

    return summaryMap;
  }, [groupedResults]);

  const handleApprove = async (resultIds: string[], groupKey: string) => {
    setIsSubmitting(true);
    try {
      await approveMutation.mutateAsync({ resultIds });
      // Optionally collapsed the group on success
      setExpandedGroups((prev) => prev.filter((k) => k !== groupKey));
    } catch (e) {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (resultIds: string[], groupKey: string) => {
    const remarks = window.prompt("Enter rejection reason for the HOD:");
    if (!remarks) return;

    setIsSubmitting(true);
    try {
      await rejectMutation.mutateAsync({ resultIds, remarks });
      setExpandedGroups((prev) => prev.filter((k) => k !== groupKey));
    } catch (e) {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const groupKeys = Object.keys(groupedResults).filter(
    (key) =>
      key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      groupedResults[key].courseTitle
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Stage 3 Approvals
          </h1>
          <p className="text-muted-foreground">
            Review and approve HOD-verified results for the entire faculty
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-lg border border-primary/10">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            Faculty Oversight
          </span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by department or course code..."
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

      {/* Grouped Results List */}
      <div className="space-y-4">
        {groupKeys.length > 0 ? (
          groupKeys.map((key) => {
            const group = groupedResults[key];
            const isExpanded = expandedGroups.includes(key);
            const resultIds = group.results.map((r: any) => r.id);
            const anomalySummary = anomaliesByGroup.get(key);
            const hasAnomalies = (anomalySummary?.total || 0) > 0;

            return (
              <div
                key={key}
                className="group border rounded-xl bg-card overflow-hidden transition-all hover:border-primary/50 shadow-sm"
              >
                {/* Group Header */}
                <div
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-muted/30 transition-colors ${
                    isExpanded ? "bg-muted/20 border-b" : ""
                  }`}
                  onClick={() => toggleGroup(key)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-background border rounded-lg text-muted-foreground group-hover:text-primary transition-colors">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded uppercase tracking-tighter">
                          {group.courseCode}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                          {group.department}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg leading-none">
                        {group.courseTitle}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {hasAnomalies && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                        {anomalySummary?.total} anomaly
                        {anomalySummary?.total === 1 ? "" : "ies"}
                      </span>
                    )}
                    <div className="text-right mr-4 hidden md:block">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">
                        Results
                      </p>
                      <p className="text-sm font-bold">
                        {group.results.length}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(resultIds, key);
                        }}
                        disabled={isSubmitting || hasAnomalies}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Approve Set
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReject(resultIds, key);
                        }}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-all disabled:opacity-50"
                      >
                        <XCircle className="h-3 w-3" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>

                {/* Group Content (Individual Results) */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    {hasAnomalies && (
                      <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                        <p className="font-bold">Anomalies detected:</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {anomalySummary?.issues.map(([issue, count]) => (
                            <span
                              key={issue}
                              className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-semibold"
                            >
                              {issue} ({count})
                            </span>
                          ))}
                        </div>
                        <p className="mt-2 text-[10px]">
                          Resolve anomalies before approving this set.
                        </p>
                      </div>
                    )}
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                        <tr>
                          <th className="px-6 py-3">Student</th>
                          <th className="px-6 py-3">CA</th>
                          <th className="px-6 py-3">Exam</th>
                          <th className="px-6 py-3">Total</th>
                          <th className="px-6 py-3">Grade</th>
                          <th className="px-6 py-3">HOD Remark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {group.results.map((result: any) => (
                          <tr
                            key={result.id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold">
                                  {result.student.user.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono italic">
                                  {result.student.matricNumber}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-medium">
                              {result.ca}
                            </td>
                            <td className="px-6 py-4 font-medium">
                              {result.exam}
                            </td>
                            <td className="px-6 py-4 font-bold text-primary">
                              {result.score}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 bg-primary/5 text-primary rounded font-bold">
                                {result.grade}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {result.approval?.hodRemarks ? (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg border border-dashed">
                                  <MessageSquare className="h-3 w-3 flex-shrink-0" />
                                  <span className="italic">
                                    "{result.approval.hodRemarks}"
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">
                                  No remarks
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-16 border-2 border-dashed rounded-xl bg-muted/20 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-20 text-primary" />
            <h3 className="text-xl font-bold">All caught up</h3>
            <p className="text-muted-foreground">
              No pending results for faculty-level review at this time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
