"use client";

import { useState, useEffect, useMemo } from "react";
import {
  DataSheetGrid,
  textColumn,
  keyColumn,
  floatColumn,
} from "react-datasheet-grid";
import type { Column } from "react-datasheet-grid";
import "react-datasheet-grid/dist/style.css";
import { Save, Loader2, Undo2 } from "lucide-react";
import { useUploadResults, useEnrolledStudents } from "../../hooks/useResults";
import { toast } from "sonner";
import { Enrollment, Result } from "../../types";
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

interface StudentRow {
  studentId: string;
  matricNumber: string | null;
  name: string | null;
  caScore: number | null;
  examScore: number | null;
  total: number | null;
  status?: string | null;
  isLocked: boolean;
}

interface ManualEntryProps {
  courseId: string;
  semester: string;
  session: string;
  existingResults?: Result[];
  canSubmit?: boolean;
  onPermissionDenied?: () => void;
  onSuccess?: () => void;
}

export default function ManualResultEntry({
  courseId,
  semester,
  session,
  existingResults = [],
  canSubmit = true,
  onPermissionDenied,
  onSuccess,
}: ManualEntryProps) {
  const [data, setData] = useState<StudentRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const uploadMutation = useUploadResults();
  const { data: course, isLoading: isLoadingEnrollments } =
    useEnrolledStudents(courseId);

  const lockedStatuses = useMemo(
    () =>
      new Set([
        "PENDING",
        "HOD_APPROVED",
        "DEAN_APPROVED",
        "SENATE_APPROVED",
        "PUBLISHED",
      ]),
    [],
  );

  const resultByStudentId = useMemo(() => {
    const map = new Map<string, Result>();
    existingResults.forEach((result) => {
      const key = result.studentId || result.student?.id;
      if (key) {
        map.set(key, result);
      }
    });
    return map;
  }, [existingResults]);

  const normalizeScore = (value: number | null | undefined) =>
    value === null || value === undefined ? null : Number(value);

  const isRowChanged = (row: StudentRow) => {
    const existingResult = resultByStudentId.get(row.studentId);
    if (!existingResult) {
      return row.caScore !== null || row.examScore !== null;
    }

    const nextCa = normalizeScore(row.caScore);
    const nextExam = normalizeScore(row.examScore);
    const prevCa = normalizeScore(existingResult.ca);
    const prevExam = normalizeScore(existingResult.exam);

    return nextCa !== prevCa || nextExam !== prevExam;
  };

  // Initialize data from enrolled students
  useEffect(() => {
    if (course?.enrollments && course.enrollments.length > 0) {
      const initialRows = (course.enrollments as Enrollment[]).map(
        (enrollment) => {
          const existingResult = existingResults.find(
            (r) =>
              r.studentId === enrollment.student.id ||
              r.student?.id === enrollment.student.id,
          );

          const ca = existingResult?.ca ?? null;
          const exam = existingResult?.exam ?? null;
          const status = existingResult?.status ?? null;
          const isLocked = status ? lockedStatuses.has(status) : false;

          return {
            studentId: enrollment.student.id,
            matricNumber: enrollment.student.matricNumber,
            name: enrollment.student.user.name,
            caScore: ca,
            examScore: exam,
            total: (ca || 0) + (exam || 0),
            status,
            isLocked,
          };
        },
      );
      setData(initialRows);
    }
  }, [course, existingResults, lockedStatuses]);

  const columns = useMemo<Column<StudentRow>[]>(
    () => [
      {
        ...keyColumn("matricNumber", textColumn),
        title: "Matric Number",
        disabled: true,
      },
      {
        ...keyColumn("name", textColumn),
        title: "Student Name",
        disabled: true,
        grow: 2,
      },
      {
        id: "lockBadge",
        title: "Status",
        basis: 110,
        grow: 0,
        shrink: 0,
        minWidth: 110,
        maxWidth: 140,
        disabled: true,
        disableKeys: true,
        component: ({ rowData }: { rowData: StudentRow }) => (
          <div className="px-2">
            {rowData.isLocked && (
              <span
                className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
                title="Locked because this result is already submitted or approved. Request an edit to change it."
              >
                Locked
              </span>
            )}
          </div>
        ),
        deleteValue: ({ rowData }: { rowData: StudentRow }) => rowData,
        copyValue: () => "",
        pasteValue: ({ rowData }: { rowData: StudentRow }) => rowData,
        isCellEmpty: () => true,
      },
      {
        ...keyColumn("caScore", floatColumn),
        title: "CA (0-30)",
        minWidth: 100,
        disabled: ({ rowData }: { rowData: StudentRow }) => rowData.isLocked,
      },
      {
        ...keyColumn("examScore", floatColumn),
        title: "Exam (0-70)",
        minWidth: 100,
        disabled: ({ rowData }: { rowData: StudentRow }) => rowData.isLocked,
      },
      {
        ...keyColumn("total", floatColumn),
        title: "Total",
        disabled: true,
        minWidth: 80,
        valueViewer: ({ value }: { value: number | null }) => (
          <div className="font-bold text-primary">{value || 0}</div>
        ),
      },
    ],
    [],
  );

  const submissionCount = data.filter(
    (row) =>
      !row.isLocked &&
      isRowChanged(row) &&
      (row.caScore !== null || row.examScore !== null),
  ).length;

  const handleDataChange = (newData: StudentRow[]) => {
    const updatedData = newData.map((row) => ({
      ...row,
      total: (Number(row.caScore) || 0) + (Number(row.examScore) || 0),
    })) as StudentRow[];
    setData(updatedData);
  };

  const handleSave = async () => {
    if (!canSubmit) {
      onPermissionDenied?.();
      return;
    }
    const resultsToUpload = data
      .filter(
        (row) =>
          !row.isLocked &&
          isRowChanged(row) &&
          (row.caScore !== null || row.examScore !== null),
      )
      .map((row) => ({
        studentId: row.studentId,
        ca: Number(row.caScore) || 0,
        exam: Number(row.examScore) || 0,
      }));

    if (resultsToUpload.length === 0) {
      toast.error("Please enter at least one score");
      return;
    }

    // Basic validation
    const invalidRow = data.find(
      (row) =>
        !row.isLocked &&
        isRowChanged(row) &&
        ((row.caScore !== null && (row.caScore < 0 || row.caScore > 30)) ||
          (row.examScore !== null &&
            (row.examScore < 0 || row.examScore > 70))),
    );

    if (invalidRow) {
      toast.error(
        `Invalid scores for ${invalidRow.matricNumber ?? "student"}. CA: 0-30, Exam: 0-70`,
      );
      return;
    }

    setIsSaving(true);
    try {
      await uploadMutation.mutateAsync({
        courseId,
        semester,
        session,
        results: resultsToUpload,
      });
      toast.success("Results saved successfully");
      onSuccess?.();
    } catch {
      toast.error("Failed to save results. Please check your inputs.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingEnrollments) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">
          Loading enrollment data...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            Excel Manual Entry
            <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Beta
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Use arrow keys to navigate. Copy-paste supported.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              setData(
                data.map((r) => ({
                  ...r,
                  caScore: r.isLocked ? r.caScore : null,
                  examScore: r.isLocked ? r.examScore : null,
                  total: r.isLocked ? r.total : 0,
                })),
              )
            }
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-muted/50 transition-colors"
          >
            <Undo2 className="h-4 w-4" />
            Clear
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                disabled={isSaving || submissionCount === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-all font-medium shadow-sm"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Review & Submit
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm submission</AlertDialogTitle>
                <AlertDialogDescription>
                  You are about to submit {submissionCount} result
                  {submissionCount === 1 ? "" : "s"} for {semester} semester,{" "}
                  {session} session. Once submitted, the results move to pending
                  HOD approval.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Review</AlertDialogCancel>
                <AlertDialogAction onClick={handleSave} disabled={isSaving}>
                  Confirm submission
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
          title="Locked because this result is already submitted or approved. Request an edit to change it."
        >
          Locked
        </span>
        <span>Row locked after submission or approval.</span>
      </div>

      <div className="rounded-lg border overflow-hidden shadow-sm dsg-wrapper">
        <DataSheetGrid
          value={data}
          onChange={handleDataChange}
          columns={columns}
          height={500}
          rowHeight={40}
          headerRowHeight={40}
          autoAddRow={false}
          lockRows={true}
          rowClassName={({ rowData }) =>
            rowData.isLocked ? "bg-muted/40 text-muted-foreground" : undefined
          }
        />
      </div>
    </div>
  );
}
