"use client";

import {
  usePendingResultsByDepartment,
  useHodApproveResults,
  useHodRejectResults,
} from "@/features/results/hooks/useResults";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Check,
  X,
  FileDown,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  Calendar,
  Users,
  Award,
} from "lucide-react";
import { Result } from "@/features/results/types";

interface ResultSet {
  id: string; // generated key
  courseId: string;
  courseCode: string;
  courseTitle: string;
  semester: string;
  session: string;
  uploadedBy: string;
  count: number;
  results: Result[];
}

export default function ApprovalsPage() {
  const { data: results, isLoading } = usePendingResultsByDepartment();
  const approveMutation = useHodApproveResults();
  const rejectMutation = useHodRejectResults();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [remarks, setRemarks] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [selectedSet, setSelectedSet] = useState<ResultSet | null>(null);

  const resultSets = useMemo(() => {
    if (!results) return [];
    const groups: Record<string, ResultSet> = {};

    results.forEach((r) => {
      const key = `${r.courseId}-${r.semester}-${r.session}`;
      if (!groups[key]) {
        groups[key] = {
          id: key,
          courseId: r.courseId,
          courseCode: r.course.code,
          courseTitle: r.course.title,
          semester: r.semester,
          session: r.session,
          uploadedBy: r.uploadedBy?.user.name || "Unknown",
          count: 0,
          results: [],
        };
      }
      groups[key].count++;
      groups[key].results.push(r);
    });

    return Object.values(groups);
  }, [results]);

  const selectedResults = useMemo(() => {
    if (!selectedSet) return [];
    return selectedSet.results.filter((r) => selectedIds.includes(r.id));
  }, [selectedSet, selectedIds]);

  const anomaliesByResult = useMemo(() => {
    const map = new Map<string, string[]>();

    const analyze = (result: Result) => {
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

      if (score < 0 || score > 100 || (ca || 0) < 0 || (ca || 0) > 30 || (exam || 0) < 0 || (exam || 0) > 70) {
        issues.push("Out of Range");
      }

      if (result.gradePoint < 0 || result.gradePoint > 5) {
        issues.push("Invalid Grade Point");
      }

      return issues;
    };

    (selectedSet?.results || []).forEach((result) => {
      map.set(result.id, analyze(result));
    });

    return map;
  }, [selectedSet]);

  const anomalySummary = useMemo(() => {
    const summary = new Map<string, number>();
    selectedResults.forEach((result) => {
      const issues = anomaliesByResult.get(result.id) || [];
      issues.forEach((issue) => {
        summary.set(issue, (summary.get(issue) || 0) + 1);
      });
    });

    return Array.from(summary.entries());
  }, [selectedResults, anomaliesByResult]);

  const hasBlockingAnomalies = anomalySummary.length > 0;

  const gradeDistribution = useMemo(() => {
    if (!selectedSet) return { items: [], maxCount: 1 };
    const counts = new Map<string, number>();
    selectedSet.results.forEach((result) => {
      const grade = result.grade || "N/A";
      counts.set(grade, (counts.get(grade) || 0) + 1);
    });

    const order = ["A", "B", "C", "D", "E", "F", "N/A"];
    const items = order
      .filter((grade) => counts.has(grade))
      .map((grade) => ({ grade, count: counts.get(grade) || 0 }));

    counts.forEach((count, grade) => {
      if (!order.includes(grade)) {
        items.push({ grade, count });
      }
    });

    return {
      items,
      maxCount: Math.max(1, ...items.map((item) => item.count)),
    };
  }, [selectedSet]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAllInSet = (setResults: Result[]) => {
    const setIds = setResults.map((r) => r.id);
    const allSelected = setIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !setIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...setIds])]);
    }
  };

  const handleApprove = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await approveMutation.mutateAsync({
        resultIds: ids,
        remarks: remarks || "Approved by HOD",
      });
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      setRemarks("");
      if (selectedSet) setSelectedSet(null);
        toast.success("Results approved successfully");
    } catch (err) {
        toast.error("Failed to approve results");
    }
  };

  const handleReject = async (ids: string[]) => {
    if (ids.length === 0 || !remarks) {
        toast.error("Please provide a reason for rejection");
      return;
    }
    try {
      await rejectMutation.mutateAsync({
        resultIds: ids,
        remarks,
      });
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      setRemarks("");
      setIsRejecting(false);
      if (selectedSet) setSelectedSet(null);
        toast.success("Results rejected successfully");
    } catch (err) {
        toast.error("Failed to reject results");
    }
  };

  const exportToCSV = (set: ResultSet) => {
    const headers = ["Matric Number", "Name", "CA", "Exam", "Score", "Grade"];
    const rows = set.results.map((r) => [
      r.student.matricNumber,
      r.student.user.name,
      r.ca,
      r.exam,
      r.score,
      r.grade,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${set.courseCode}_${set.semester}_${set.session}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {selectedSet && (
            <button
              onClick={() => setSelectedSet(null)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h1 className="text-3xl font-bold tracking-tight">
            {selectedSet
              ? `Review: ${selectedSet.courseCode}`
              : "Result Approvals"}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {selectedSet
            ? `Detailed results for ${selectedSet.courseTitle} (${selectedSet.semester}, ${selectedSet.session})`
            : "Review and approve departmental results grouped by course"}
        </p>
      </div>

      {!selectedSet ? (
        /* Summary View - Result Sets */
        <div className="space-y-4">
          {resultSets.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {resultSets.map((set) => (
                <div
                  key={set.id}
                  className="group relative p-6 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-black">
                            {set.courseCode}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {set.count} Students
                          </span>
                        </div>
                        <h3 className="font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                          {set.courseTitle}
                        </h3>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {set.semester} - {set.session}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            By: {set.uploadedBy}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => exportToCSV(set)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold hover:bg-muted rounded-xl transition-colors"
                      >
                        <FileDown className="h-4 w-4" />
                        Export
                      </button>
                      <button
                        onClick={() => setSelectedSet(set)}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-black shadow-sm hover:shadow-md active:scale-95 transition-all"
                      >
                        Review Results
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed p-16 text-center bg-muted/20">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Check className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">All caught up!</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                There are no pending results awaiting your approval at the
                moment.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Detail View - Individual Results in a Set */
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold">Grade Distribution</h3>
              <span className="text-[10px] text-muted-foreground">
                {selectedSet.results.length} results
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {gradeDistribution.items.map((item) => (
                <div key={item.grade} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">Grade {item.grade}</span>
                    <span className="text-muted-foreground">
                      {item.count}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${
                        item.grade === "A"
                          ? "bg-emerald-500"
                          : item.grade === "F"
                            ? "bg-destructive"
                            : item.grade === "E"
                              ? "bg-orange-400"
                              : "bg-primary/70"
                      }`}
                      style={{
                        width: `${(item.count / gradeDistribution.maxCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {hasBlockingAnomalies && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="font-semibold">Anomaly checks failed</div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {anomalySummary.map(([issue, count]) => (
                  <span
                    key={issue}
                    className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold"
                  >
                    {issue}: {count}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs">
                Resolve anomalies before approving these results.
              </p>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-muted/30 rounded-2xl border">
            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleSelectAllInSet(selectedSet.results)}
                className="text-sm font-bold text-primary hover:underline"
              >
                {selectedSet.results.every((r) => selectedIds.includes(r.id))
                  ? "Deselect All"
                  : "Select All Students"}
              </button>
              <div className="h-4 w-px bg-border" />
              <span className="text-sm font-medium">
                {
                  selectedSet.results.filter((r) => selectedIds.includes(r.id))
                    .length
                }{" "}
                Selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportToCSV(selectedSet)}
                className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                title="Download CSV"
              >
                <FileDown className="h-5 w-5" />
              </button>
              {isRejecting ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Provide reason for rejection..."
                    className="px-3 py-2 text-sm rounded-xl border bg-background w-64 focus:ring-2 focus:ring-primary outline-none transition-all"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                  <button
                    onClick={() =>
                      handleReject(
                        selectedSet.results
                          .filter((r) => selectedIds.includes(r.id))
                          .map((r) => r.id),
                      )
                    }
                    disabled={!remarks}
                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-xl text-sm font-bold disabled:opacity-50 shadow-sm"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setIsRejecting(false)}
                    className="p-2 hover:bg-muted rounded-xl"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() =>
                      handleApprove(
                        selectedSet.results
                          .filter((r) => selectedIds.includes(r.id))
                          .map((r) => r.id),
                      )
                    }
                    disabled={
                      !selectedSet.results.some((r) =>
                        selectedIds.includes(r.id),
                      ) || hasBlockingAnomalies
                    }
                    className="flex items-center gap-2 px-6 ml-2 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-black shadow-sm disabled:opacity-50"
                    title={
                      hasBlockingAnomalies
                        ? "Resolve anomalies before approval"
                        : "Approve selected"
                    }
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve Selected
                  </button>
                  <button
                    onClick={() => setIsRejecting(true)}
                    disabled={
                      !selectedSet.results.some((r) =>
                        selectedIds.includes(r.id),
                      )
                    }
                    className="flex items-center gap-2 px-6 py-2 bg-destructive/10 text-destructive rounded-xl text-sm font-black hover:bg-destructive/20 disabled:opacity-50 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl border shadow-sm overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="px-6 py-4 text-left font-bold w-12">
                      <input
                        type="checkbox"
                        checked={selectedSet.results.every((r) =>
                          selectedIds.includes(r.id),
                        )}
                        onChange={() =>
                          toggleSelectAllInSet(selectedSet.results)
                        }
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </th>
                    <th className="px-6 py-4 text-left font-bold">Student</th>
                    <th className="px-6 py-4 text-center font-bold">CA</th>
                    <th className="px-6 py-4 text-center font-bold">Exam</th>
                    <th className="px-6 py-4 text-center font-bold">Total</th>
                    <th className="px-6 py-4 text-center font-bold">Grade</th>
                    <th className="px-6 py-4 text-center font-bold">GP</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedSet.results.map((result) => (
                    <tr
                      key={result.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        selectedIds.includes(result.id) ? "bg-primary/5" : ""
                      } ${
                        (anomaliesByResult.get(result.id) || []).length > 0
                          ? "bg-amber-50"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(result.id)}
                          onChange={() => toggleSelect(result.id)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">
                              {result.student.user.name}
                            </span>
                            {result.approval?.hodStatus === "REJECTED" && (
                              <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                Resubmitted
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {result.student.matricNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-center">
                        {result.ca}
                      </td>
                      <td className="px-6 py-4 font-mono text-center">
                        {result.exam}
                      </td>
                      <td className="px-6 py-4 font-black text-primary text-center">
                        {result.score}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-black ${
                            result.grade === "F"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-green-500/10 text-green-600"
                          }`}
                        >
                          {result.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-center">
                        {result.gradePoint.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
