"use client";

import {
  usePendingResultsForSenate,
  useSenateApproveResults,
  useSenateRejectResults,
  useSenatePublishResults,
} from "@/features/senate/hooks/useSenateUniversity";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Building2,
  Lock,
  Eye,
  Send,
  Loader2,
  Users,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function SenateApprovalsPage() {
  const {
    data: results,
    isLoading,
    isFetching,
    refetch,
  } = usePendingResultsForSenate();
  const approveMutation = useSenateApproveResults();
  const rejectMutation = useSenateRejectResults();
  const publishMutation = useSenatePublishResults();

  const [expandedFaculties, setExpandedFaculties] = useState<string[]>([]);
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [remarks, setRemarks] = useState("");

  const deanApprovedResults = useMemo(
    () => (results || []).filter((result) => result.status === "DEAN_APPROVED"),
    [results],
  );

  const groupedResults = useMemo(() => {
    if (deanApprovedResults.length === 0) return {};
    return deanApprovedResults.reduce(
      (acc, result) => {
        const faculty = result.course.department.faculty.name;
        const dept = result.course.department.name;
        const course = result.course.code;

        if (!acc[faculty]) acc[faculty] = {};
        if (!acc[faculty][dept]) acc[faculty][dept] = {};
        if (!acc[faculty][dept][course]) acc[faculty][dept][course] = [];

        acc[faculty][dept][course].push(result);
        return acc;
      },
      {} as Record<
        string,
        Record<string, Record<string, typeof deanApprovedResults>>
      >,
    );
  }, [deanApprovedResults]);

  const refreshSelection = async () => {
    const latest = await refetch();
    const latestResults = latest.data || results || [];
    const latestIds = new Set(latestResults.map((result) => result.id));
    const validIds = selectedResults.filter((id) => latestIds.has(id));

    if (validIds.length !== selectedResults.length) {
      setSelectedResults(validIds);
      toast.error(
        "Some results are no longer Dean-approved. Selection updated.",
      );
    }

    return validIds;
  };

  const toggleFaculty = (faculty: string) => {
    setExpandedFaculties((prev) =>
      prev.includes(faculty)
        ? prev.filter((f) => f !== faculty)
        : [...prev, faculty],
    );
  };

  const handleApprove = async () => {
    if (selectedResults.length === 0) return;
    try {
      const validIds = await refreshSelection();
      if (validIds.length === 0) return;
      await approveMutation.mutateAsync({
        resultIds: validIds,
        remarks,
      });
      toast.success(`${validIds.length} results approved by Senate`);
      setSelectedResults([]);
      setRemarks("");
    } catch {
      toast.error("Failed to approve results");
    }
  };

  const handleReject = async () => {
    if (selectedResults.length === 0 || !remarks) {
      toast.error("Remarks are required for rejection");
      return;
    }
    try {
      const validIds = await refreshSelection();
      if (validIds.length === 0) return;
      await rejectMutation.mutateAsync({ resultIds: validIds, remarks });
      toast.success(`${validIds.length} results rejected back to Dean`);
      setSelectedResults([]);
      setRemarks("");
    } catch {
      toast.error("Failed to reject results");
    }
  };

  const handlePublish = async () => {
    if (selectedResults.length === 0) return;
    try {
      await publishMutation.mutateAsync(selectedResults);
      toast.success(`${selectedResults.length} results published successfully`);
      setSelectedResults([]);
    } catch {
      toast.error("Failed to publish results");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse">
          Retrieving institutional results...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Stage 4: Senate Validation
          </h1>
          <p className="text-muted-foreground">
            Final institutional review and publication authorization
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-xl">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-primary">
            High-Level Authority Access
          </span>
        </div>
      </div>

      {/* Global Actions Bar */}
      {selectedResults.length > 0 && (
        <div className="sticky top-4 z-50 bg-card/80 backdrop-blur-md border border-primary/20 p-4 rounded-2xl shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-bold">
                <span className="text-primary">{selectedResults.length}</span>{" "}
                Results Selected for Final Action
              </p>
              <input
                type="text"
                placeholder="Add final Senate remarks (required for rejection)..."
                className="w-full mt-2 bg-background border-none ring-1 ring-border focus:ring-2 focus:ring-primary/20 rounded-lg px-3 py-1.5 text-xs outline-none transition-all"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReject}
                disabled={
                  approveMutation.isPending ||
                  rejectMutation.isPending ||
                  isFetching
                }
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-destructive/10 text-destructive rounded-lg hover:bg-destructive hover:text-white transition-all disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" /> Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={
                  approveMutation.isPending ||
                  rejectMutation.isPending ||
                  isFetching
                }
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md shadow-green-600/20 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" /> Approve
              </button>
              <button
                onClick={handlePublish}
                disabled={publishMutation.isPending || isFetching}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
              >
                <Send className="h-4 w-4" /> Publish to Students
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Hierarchy View */}
      <div className="space-y-6">
        {Object.entries(groupedResults).map(([faculty, departamentos]) => (
          <div
            key={faculty}
            className="rounded-2xl border bg-card/50 overflow-hidden"
          >
            <button
              onClick={() => toggleFaculty(faculty)}
              className="w-full flex items-center justify-between p-6 bg-muted/20 hover:bg-muted/30 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary text-primary-foreground rounded-xl shadow-lg ring-4 ring-primary/5">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
                    {faculty}
                  </h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                    Faculty Hierarchy
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black px-3 py-1 bg-background border rounded-full">
                  {Object.values(departamentos).length} Departments
                </span>
                {expandedFaculties.includes(faculty) ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </div>
            </button>

            {expandedFaculties.includes(faculty) && (
              <div className="p-6 space-y-8 animate-in slide-in-from-top-4 duration-300">
                {Object.entries(departamentos).map(([dept, courses]) => (
                  <div key={dept} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-8 bg-primary rounded-full" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                        {dept}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(courses).map(([courseCode, results]) => (
                        <div
                          key={courseCode}
                          className="p-5 rounded-xl border bg-background hover:border-primary/40 hover:shadow-lg transition-all"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-xs font-bold text-primary mb-1">
                                {courseCode}
                              </p>
                              <h4 className="font-bold leading-tight line-clamp-1">
                                {results[0]?.course.title}
                              </h4>
                            </div>
                            <input
                              type="checkbox"
                              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                              checked={results.every((r) =>
                                selectedResults.includes(r.id),
                              )}
                              onChange={(e) => {
                                const ids = results.map((r) => r.id);
                                if (e.target.checked) {
                                  setSelectedResults((prev) => [
                                    ...new Set([...prev, ...ids]),
                                  ]);
                                } else {
                                  setSelectedResults((prev) =>
                                    prev.filter((id) => !ids.includes(id)),
                                  );
                                }
                              }}
                            />
                          </div>

                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1 font-bold">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              {results.length} Students
                            </div>
                            <div className="flex items-center gap-1 font-bold">
                              <ShieldCheck className="h-3 w-3 text-green-600" />
                              Dean Approved
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t flex items-center justify-between">
                            <button className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 group">
                              <Eye className="h-3 w-3 group-hover:scale-110 transition-transform" />
                              Review Detail
                            </button>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">
                              By: {results[0]?.approval?.deanApprovedBy?.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {Object.keys(groupedResults).length === 0 && (
          <div className="p-20 text-center rounded-2xl border-2 border-dashed bg-muted/20">
            <Lock className="h-16 w-16 mx-auto mb-6 opacity-10" />
            <h2 className="text-2xl font-bold text-muted-foreground">
              Institutional Queue Empty
            </h2>
            <p className="max-w-xs mx-auto text-sm text-muted-foreground mt-2 font-medium">
              There are no Dean-approved results currently waiting for Senate
              validation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
