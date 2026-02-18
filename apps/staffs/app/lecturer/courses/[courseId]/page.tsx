"use client";

import { useParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  BookOpen,
  Users,
  Upload,
  FileText,
  AlertCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import { useMemo, useState } from "react";
import { StatCard } from "@workspace/ui/components/stat-card";
import { Enrollment, Result, ResultAudit } from "@/features/results/types";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { useAcademicSettings } from "@/lib/graphql/session-hooks";
import { useAssignedCourses } from "@/features/lecturers/hooks/useLecturer";
import Link from "next/link";

// Feature Imports
import {
  useResultsByCourse,
  useEnrolledStudents,
  useSubmitResultsToHod,
  useRequestResultEdit,
  useEditRequests,
  useResultAuditsByCourse,
} from "@/features/results/hooks/useResults";
import BulkCSVUpload from "@/features/results/components/BulkCSVUpload/BulkCSVUpload";
import ManualResultEntry from "@/features/results/components/ManualResultEntry/ManualResultEntry";
import { useQueryClient } from "@tanstack/react-query";

const tabs = [
  { id: "overview", label: "Overview & Results" },
  { id: "upload", label: "Bulk Upload (CSV)" },
  { id: "manual", label: "Excel Entry" },
  { id: "history", label: "Upload History" },
  { id: "roster", label: "Student Roster" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function CoursePage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedResults, setSelectedResults] = useState<Result[]>([]);
  const [showDraftsOnly, setShowDraftsOnly] = useState(false);
  const [editRequestOpen, setEditRequestOpen] = useState(false);
  const [editRequestReason, setEditRequestReason] = useState("");
  const [editRequestTarget, setEditRequestTarget] = useState<Result | null>(
    null,
  );

  const { data: settingsData, isLoading: settingsLoading } =
    useAcademicSettings();
  const currentSettings = settingsData?.getAcademicSettings;
  const currentSemester = currentSettings?.currentSemester;
  const currentSession = currentSettings?.currentSession?.session;

  const { data: results, isLoading } = useResultsByCourse(
    courseId,
    currentSemester || "",
    currentSession || "",
  );
  const { data: courseAudits, isLoading: auditsLoading } =
    useResultAuditsByCourse(courseId);
  // Fetch enrolled students
  const { data: enrollments, isLoading: enrollmentsLoading } =
    useEnrolledStudents(courseId);

  const staffId =
    (session?.user as { staffProfile?: { id?: string } | null } | undefined)
      ?.staffProfile?.id;

  const refreshCourseData = () => {
    queryClient.invalidateQueries({
      queryKey: ["results", courseId, currentSemester || "", currentSession || ""],
    });
    queryClient.invalidateQueries({
      queryKey: ["resultAudits", "course", courseId],
    });
    queryClient.invalidateQueries({ queryKey: ["editRequests"] });
    queryClient.invalidateQueries({ queryKey: ["enrolledStudents", courseId] });
  };

  const { data: editRequests } = useEditRequests();
  const editRequestByResultId = useMemo(() => {
    const map = new Map<string, { status: string }>();
    (editRequests || []).forEach((request) => {
      map.set(request.resultId, { status: request.status });
    });
    return map;
  }, [editRequests]);

  const requestableStatuses = useMemo(
    () =>
      new Set([
        "HOD_APPROVED",
        "DEAN_APPROVED",
        "SENATE_APPROVED",
        "PUBLISHED",
      ]),
    [],
  );

  const columns = useMemo<ColumnDef<Result>[]>(
    () => [
      {
        id: "sn",
        header: "S/N",
        enableSorting: false,
        meta: {
          headerClassName: "text-left",
          cellClassName: "text-left",
        },
        cell: ({ row, table }) => {
          const { pageIndex, pageSize } = table.getState().pagination;
          const displayIndex = pageIndex * pageSize + row.index + 1;

          return (
            <span className="text-muted-foreground font-mono">
              {String(displayIndex).padStart(2, "0")}
            </span>
          );
        },
      },
      {
        id: "matricNumber",
        header: "Matric Number",
        accessorFn: (row) => row.student?.matricNumber || "-",
        meta: {
          headerClassName: "text-left",
          cellClassName: "text-left",
        },
        cell: ({ getValue }) => (
          <span className="font-semibold tracking-tight">
            {getValue() as string}
          </span>
        ),
      },
      {
        id: "studentName",
        header: "Student Name",
        accessorFn: (row) => row.student?.user?.name || "-",
        meta: {
          headerClassName: "text-left",
          cellClassName: "text-left",
        },
        cell: ({ getValue }) => (
          <span
            className="truncate max-w-[200px] block"
            title={getValue() as string}
          >
            {getValue() as string}
          </span>
        ),
      },
      {
        id: "ca",
        header: "CA",
        accessorFn: (row) => row.ca ?? 0,
        meta: {
          headerClassName: "text-center",
          cellClassName: "text-center",
        },
        cell: ({ getValue }) => (
          <span className="font-mono text-center block">
            {getValue() as number}
          </span>
        ),
      },
      {
        id: "exam",
        header: "Exam",
        accessorFn: (row) => row.exam ?? 0,
        meta: {
          headerClassName: "text-center",
          cellClassName: "text-center",
        },
        cell: ({ getValue }) => (
          <span className="font-mono text-center block">
            {getValue() as number}
          </span>
        ),
      },
      {
        id: "total",
        header: "Total",
        accessorFn: (row) => row.score ?? 0,
        meta: {
          headerClassName: "text-center",
          cellClassName: "text-center",
        },
        cell: ({ getValue }) => (
          <span className="font-bold text-primary text-center block">
            {getValue() as number}
          </span>
        ),
      },
      {
        id: "grade",
        header: "Grade",
        accessorFn: (row) => row.grade || "-",
        meta: {
          headerClassName: "text-center",
          cellClassName: "text-center",
        },
        cell: ({ getValue }) => (
          <span className="font-bold text-center block">
            {getValue() as string}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => row.status,
        meta: {
          headerClassName: "text-center",
          cellClassName: "text-center",
        },
        cell: ({ row }) => {
          const status = row.original.status;
          const hodRemarks = row.original.approval?.hodRemarks;

          return (
            <div className="flex flex-col items-center gap-1">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ring-inset ${
                  status === "PUBLISHED"
                    ? "bg-green-100 text-green-700 ring-green-600/20"
                    : status === "SENATE_APPROVED"
                      ? "bg-blue-100 text-blue-700 ring-blue-600/20"
                      : status === "DEAN_APPROVED"
                        ? "bg-purple-100 text-purple-700 ring-purple-600/20"
                        : status === "HOD_APPROVED"
                          ? "bg-indigo-100 text-indigo-700 ring-indigo-600/20"
                          : status === "DRAFT"
                            ? "bg-gray-100 text-gray-700 ring-gray-600/20"
                          : status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700 ring-yellow-600/20"
                            : status === "REJECTED"
                              ? "bg-red-100 text-red-700 ring-red-600/20"
                              : "bg-gray-100 text-gray-700 ring-gray-600/20"
                }`}
              >
                {status.replace("_", " ")}
              </span>
              {status === "REJECTED" && hodRemarks && (
                <span
                  className="text-[9px] text-red-500 font-medium max-w-[100px] truncate"
                  title={hodRemarks}
                >
                  Ref: {hodRemarks}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        meta: {
          headerClassName: "text-right",
          cellClassName: "text-right",
        },
        cell: ({ row }) => {
          const result = row.original;
          const existingRequest = editRequestByResultId.get(result.id);
          const hasActiveRequest =
            existingRequest && existingRequest.status !== "REJECTED";
          const canRequestEdit =
            result.uploadedBy?.id === staffId &&
            requestableStatuses.has(result.status) &&
            !hasActiveRequest;

          return (
            <button
              type="button"
              disabled={!canRequestEdit}
              onClick={() => {
                setEditRequestTarget(result);
                setEditRequestReason("");
                setEditRequestOpen(true);
              }}
              className={`rounded-md border px-2.5 py-1 text-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                hasActiveRequest
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "hover:bg-muted"
              }`}
              title={
                canRequestEdit
                  ? "Request an edit for this result"
                  : "Edits can only be requested for HOD-approved or later results you uploaded"
              }
            >
              {hasActiveRequest ? "Requested" : "Request edit"}
            </button>
          );
        },
      },
    ],
    [editRequestByResultId, requestableStatuses, staffId],
  );


  const { data: assignedCourses } = useAssignedCourses(staffId || "");
  const isPrimaryInstructor =
    assignedCourses?.find((assignment) => assignment.courseId === courseId)
      ?.isPrimary ?? false;
  const submitMutation = useSubmitResultsToHod();
  const requestEditMutation = useRequestResultEdit();

  // Extract course info from first result (if available)
  const courseInfo = results?.[0]?.course;
  const enrolledStudentsCount = enrollments?.enrollments?.length || 0;
  const myDraftResults =
    results?.filter(
      (result) =>
        result.status === "DRAFT" && result.uploadedBy?.id === staffId,
    ) || [];
  const myPendingResults =
    results?.filter(
      (result) =>
        result.status === "PENDING" && result.uploadedBy?.id === staffId,
    ) || [];
  const displayedResults = showDraftsOnly
    ? results?.filter(
        (result) =>
          result.status === "DRAFT" && result.uploadedBy?.id === staffId,
      ) || []
    : results || [];

  const submissionBatches = useMemo(() => {
    const audits = (courseAudits || []).filter(
      (audit) => audit.action === "SUBMIT_TO_HOD",
    );

    const batches = new Map<
      string,
      { key: string; label: string; count: number; timestamp: string }
    >();

    audits.forEach((audit) => {
      const timestamp = new Date(audit.createdAt);
      const bucket = timestamp.toISOString().slice(0, 16);
      const label = timestamp.toLocaleString();
      const key = `${bucket}`;

      const existing = batches.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        batches.set(key, { key, label, count: 1, timestamp: audit.createdAt });
      }
    });

    return Array.from(batches.values()).sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    );
  }, [courseAudits]);

  const auditsByResult = useMemo(() => {
    const map = new Map<string, ResultAudit[]>();
    (courseAudits || []).forEach((audit) => {
      const key = audit.resultId;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(audit);
    });
    map.forEach((list, key) => {
      map.set(
        key,
        [...list].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        ),
      );
    });
    return map;
  }, [courseAudits]);

  const rosterColumns = useMemo<ColumnDef<Enrollment>[]>(
    () => [
      {
        id: "matric",
        header: "Matric Number",
        accessorFn: (row) => row.student?.matricNumber || "-",
        cell: ({ getValue }) => (
          <span className="font-semibold">{getValue() as string}</span>
        ),
      },
      {
        id: "name",
        header: "Student Name",
        accessorFn: (row) => row.student?.user?.name || "-",
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() as string}</span>
        ),
      },
    ],
    [],
  );

  const gradeDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    (results || []).forEach((result) => {
      const grade = result.grade || "N/A";
      counts.set(grade, (counts.get(grade) || 0) + 1);
    });

    const gradeOrder = ["A", "B", "C", "D", "E", "F", "N/A"];
    const items = gradeOrder
      .filter((grade) => counts.has(grade))
      .map((grade) => ({
        grade,
        count: counts.get(grade) || 0,
      }));

    counts.forEach((count, grade) => {
      if (!gradeOrder.includes(grade)) {
        items.push({ grade, count });
      }
    });

    const maxCount = Math.max(1, ...items.map((item) => item.count));
    return { items, maxCount };
  }, [results]);

  const showPrimaryWarning = () => {
    toast.warning(
      "Only the primary lecturer can upload or submit results for this course.",
    );
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <p>Please log in to view course details</p>
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

  if (isLoading || enrollmentsLoading || settingsLoading || auditsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Clock className="h-8 w-8 animate-spin" />
          <p>Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!currentSemester || !currentSession) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="font-semibold">Academic session not configured</p>
          <p className="text-sm">
            {currentSemester} Semester, {currentSession} session
            Please set an active session and semester before uploading results.
          </p>
        </div>
      </div>
    );
  }


  const handleSubmitResults = async (resultIds?: string[]) => {
    if (!isPrimaryInstructor) {
      showPrimaryWarning();
      return;
    }
    if (!currentSemester || !currentSession) {
      return;
    }

    try {
      const submitted = await submitMutation.mutateAsync({
        courseId,
        semester: currentSemester,
        session: currentSession,
        ...(resultIds && resultIds.length > 0 ? { resultIds } : {}),
      });
      toast.success(
        `Submitted ${submitted.length} result${submitted.length === 1 ? "" : "s"} to HOD`,
      );
    } catch {
      toast.error("Failed to submit results. Please try again.");
    }
  };

  const handleRequestEdit = async () => {
    if (!editRequestTarget) {
      return;
    }

    const reason = editRequestReason.trim();
    if (!reason) {
      toast.error("Please provide a reason for the edit request.");
      return;
    }

    try {
      await requestEditMutation.mutateAsync({
        resultId: editRequestTarget.id,
        reason,
      });
      toast.success("Edit request submitted to HOD.");
      setEditRequestOpen(false);
      setEditRequestTarget(null);
      setEditRequestReason("");
    } catch {
      toast.error("Failed to submit edit request. Please try again.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between">
          <h1 className="text-4xl font-extrabold tracking-tight">
            {courseInfo?.code || courseId}
          </h1>
          <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            LIVE DATA
          </div>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {courseInfo?.title || "Result Management Portal"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-4">
        <StatCard
          title="Course Code"
          value={courseInfo?.code || courseId}
          trend={{ label: "Active", direction: "up" }}
          footerLabel="Current Semester"
          footerIcon={BookOpen}
        />
        <StatCard
          title="Enrolled Students"
          value={enrolledStudentsCount}
          trend={{ label: "Confirmed", direction: "up" }}
          footerLabel="Total Class Size"
          footerIcon={Users}
        />
        <StatCard
          title="Results Uploaded"
          value={
            results?.filter((r: Result) => (r.ca || 0) > 0 || (r.exam || 0) > 0)
              .length || 0
          }
          trend={{ label: "In Progress", direction: "up" }}
          footerLabel="Processed Records"
          footerIcon={Upload}
        />
        <StatCard
          title="Credits"
          value={courseInfo?.credits || "-"}
          trend={{ label: "Standard", direction: "up" }}
          footerLabel="Unit Weight"
          footerIcon={FileText}
        />
      </div>

      {/* Tabs */}
      <div className="border-b relative">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 text-sm font-semibold transition-all relative ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px] space-y-4">
        <AlertDialog
          open={editRequestOpen}
          onOpenChange={(open) => {
            setEditRequestOpen(open);
            if (!open) {
              setEditRequestTarget(null);
              setEditRequestReason("");
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Request result edit</AlertDialogTitle>
              <AlertDialogDescription>
                Provide a clear reason for this edit request. The HOD will
                review it before you can make changes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Reason
              </label>
              <textarea
                value={editRequestReason}
                onChange={(event) => setEditRequestReason(event.target.value)}
                placeholder="Explain what needs to change and why..."
                rows={4}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRequestEdit}
                disabled={requestEditMutation.isPending}
              >
                Submit request
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {!isPrimaryInstructor && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            You are not the primary lecturer for this course. You can review
            results, but only the primary lecturer can upload or submit them.
          </div>
        )}
        {activeTab === "overview" && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Student Results</h2>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-accent rounded-md text-sm font-medium">
                {currentSemester} Semester • {currentSession}
              </div>
            </div>

            {myPendingResults.length > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-900">
                Submitted — pending HOD approval ({myPendingResults.length} result
                {myPendingResults.length === 1 ? "" : "s"}).
              </div>
            )}

            {myDraftResults.length > 0 && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-900">
                Drafts not submitted ({myDraftResults.length} result
                {myDraftResults.length === 1 ? "" : "s"}).
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
              <div className="text-sm text-muted-foreground">
                Draft results ready: {myDraftResults.length}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDraftsOnly((prev) => !prev)}
                  disabled={myDraftResults.length === 0}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    showDraftsOnly
                      ? "border-primary text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  View drafts
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {myDraftResults.length}
                  </span>
                </button>
                {isPrimaryInstructor ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        disabled={myDraftResults.length === 0 || submitMutation.isPending}
                        className="rounded-md border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Submit all drafts
                        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                          {myDraftResults.length}
                        </span>
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Submit all drafts?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will submit {myDraftResults.length} draft result
                          {myDraftResults.length === 1 ? "" : "s"} for HOD
                          approval.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            handleSubmitResults(myDraftResults.map((r) => r.id))
                          }
                        >
                          Confirm submission
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <button
                    type="button"
                    onClick={showPrimaryWarning}
                    disabled={myDraftResults.length === 0}
                    className="rounded-md border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Submit all drafts
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {myDraftResults.length}
                    </span>
                  </button>
                )}

                {isPrimaryInstructor ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        disabled={selectedResults.length === 0 || submitMutation.isPending}
                        className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Submit selected ({selectedResults.length})
                        <span className="ml-2 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                          {myDraftResults.length}
                        </span>
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Submit selected results?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will submit {selectedResults.length} selected result
                          {selectedResults.length === 1 ? "" : "s"} for HOD
                          approval.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            handleSubmitResults(selectedResults.map((r) => r.id))
                          }
                        >
                          Confirm submission
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <button
                    type="button"
                    onClick={showPrimaryWarning}
                    disabled={selectedResults.length === 0}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Submit selected ({selectedResults.length})
                    <span className="ml-2 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {myDraftResults.length}
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Grade Distribution</h3>
                    <p className="text-xs text-muted-foreground">
                      Based on uploaded results
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {results?.length || 0} result{(results?.length || 0) === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {gradeDistribution.items.length === 0 ? (
                  <div className="text-xs text-muted-foreground">
                    No grades to analyze yet.
                  </div>
                ) : (
                  gradeDistribution.items.map((item) => (
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
                  ))
                )}
              </div>
            </div>

            {displayedResults.length > 0 ? (
              <DataTable
                columns={columns}
                data={displayedResults}
                searchPlaceholder="Search by name, matric number, or status..."
                pageSizeOptions={[10, 25, 50]}
                initialPageSize={10}
                enableRowSelection
                canSelectRow={(row) =>
                  row.status === "DRAFT" && row.uploadedBy?.id === staffId
                }
                onSelectionChange={setSelectedResults}
                emptyMessage={
                  showDraftsOnly
                    ? "No draft results yet."
                    : "No results."
                }
              />
            ) : (
              <div className="rounded-xl border-2 border-dashed p-16 text-center bg-muted/20">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">No results found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                  Get started by uploading results using the Bulk Upload or
                  Excel Entry tabs above.
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:shadow-lg transition-all"
                  >
                    Bulk Upload CSV
                  </button>
                  <button
                    onClick={() => setActiveTab("manual")}
                    className="rounded-lg border bg-background px-6 py-2.5 text-sm font-bold hover:bg-muted transition-all"
                  >
                    Excel Entry
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "upload" && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <BulkCSVUpload
              courseId={courseId}
              semester={currentSemester}
              session={currentSession}
              canSubmit={isPrimaryInstructor}
              onPermissionDenied={showPrimaryWarning}
              onSuccess={() => {
                refreshCourseData();
                setActiveTab("overview");
              }}
            />
          </div>
        )}

        {activeTab === "manual" && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <ManualResultEntry
              courseId={courseId}
              semester={currentSemester}
              session={currentSession}
              existingResults={results || []}
              canSubmit={isPrimaryInstructor}
              onPermissionDenied={showPrimaryWarning}
              onSuccess={() => {
                refreshCourseData();
                setActiveTab("overview");
              }}
            />
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Upload History</h2>
              <div className="text-xs text-muted-foreground">
                Includes submissions and approval actions
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
              <div className="text-xs text-muted-foreground">
                Need the full timeline with filters?
              </div>
              <Link
                href={`/lecturer/courses/${courseId}/history`}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Open full history
              </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-xl border bg-card p-4 lg:col-span-1">
                <h3 className="text-sm font-semibold">Submission Batches</h3>
                <p className="text-xs text-muted-foreground">
                  Grouped by submission time
                </p>
                <div className="mt-4 space-y-3">
                  {submissionBatches.length === 0 ? (
                    <div className="text-xs text-muted-foreground">
                      No submissions yet.
                    </div>
                  ) : (
                    submissionBatches.map((batch) => (
                      <div
                        key={batch.key}
                        className="rounded-lg border px-3 py-2"
                      >
                        <div className="text-xs font-semibold">
                          Submitted to HOD
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {batch.label}
                        </div>
                        <div className="mt-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                          {batch.count} result{batch.count === 1 ? "" : "s"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4 lg:col-span-2">
                <h3 className="text-sm font-semibold">Per-Result Timeline</h3>
                <p className="text-xs text-muted-foreground">
                  Status changes for each student result
                </p>
                <div className="mt-4 space-y-4">
                  {(results || []).length === 0 && (
                    <div className="text-xs text-muted-foreground">
                      No results yet.
                    </div>
                  )}
                  {(results || []).map((result) => {
                    const timeline = auditsByResult.get(result.id) || [];

                    return (
                      <div key={result.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold">
                              {result.student?.user?.name || "-"}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {result.student?.matricNumber || "-"}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">
                            {result.status?.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="mt-3 space-y-2">
                          {timeline.length === 0 ? (
                            <div className="text-xs text-muted-foreground">
                              No history events yet.
                            </div>
                          ) : (
                            timeline.map((entry) => (
                              <div
                                key={entry.id}
                                className="flex items-center justify-between text-xs"
                              >
                                <div className="font-semibold">
                                  {entry.action.replace(/_/g, " ")}
                                </div>
                                <div className="text-muted-foreground">
                                  {new Date(entry.createdAt).toLocaleString()}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "roster" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Student Roster</h2>
              <div className="text-xs text-muted-foreground">
                {enrollments?.enrollments?.length || 0} enrolled student
                {(enrollments?.enrollments?.length || 0) === 1 ? "" : "s"}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <DataTable
                columns={rosterColumns}
                data={enrollments?.enrollments || []}
                searchKey="matric"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
