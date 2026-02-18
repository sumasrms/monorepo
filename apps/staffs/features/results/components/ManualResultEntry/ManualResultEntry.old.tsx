"use client";

import { useState, useEffect } from "react";
import { Save, AlertCircle, Loader2 } from "lucide-react";
import { useUploadResults, useEnrolledStudents } from "@/lib/graphql/hooks";
import { getErrorMessage } from "@/lib/graphql-client";

interface StudentRow {
  studentId: string;
  matricNumber: string;
  name: string;
  caScore: number;
  examScore: number;
}

interface ManualEntryProps {
  courseId: string;
  semester: string;
  session: string;
  existingResults?: any[];
  onSuccess?: () => void;
}

export default function ManualResultEntry({
  courseId,
  semester,
  session,
  existingResults = [],
  onSuccess,
}: ManualEntryProps) {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const uploadMutation = useUploadResults();
  const { data: enrollments, isLoading: isLoadingEnrollments } =
    useEnrolledStudents(courseId);

  // Initialize rows from enrolled students
  useEffect(() => {
    if (enrollments && enrollments.length > 0) {
      const initialRows = enrollments.map((enrollment: any) => {
        // Check if there's an existing result for this student
        const existingResult = existingResults.find(
          (r: any) => r.student.id === enrollment.student.id,
        );

        return {
          studentId: enrollment.student.id,
          matricNumber: enrollment.student.matricNumber,
          name: enrollment.student.user.name,
          caScore: existingResult?.ca || 0,
          examScore: existingResult?.exam || 0,
        };
      });
      setRows(initialRows);
    }
  }, [enrollments, existingResults]);

  const validateScore = (
    score: number,
    max: number,
    field: string,
    index: number,
  ) => {
    const key = `${index}-${field}`;
    if (score < 0 || score > max) {
      setErrors((prev) => ({
        ...prev,
        [key]: `Must be between 0 and ${max}`,
      }));
      return false;
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
      return true;
    }
  };

  const handleScoreChange = (
    index: number,
    field: "caScore" | "examScore",
    value: string,
  ) => {
    const numValue = parseFloat(value) || 0;
    const max = field === "caScore" ? 30 : 70;

    validateScore(numValue, max, field, index);

    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: numValue } : row)),
    );
  };

  const handleSave = async () => {
    // Validate all scores
    let hasErrors = false;
    rows.forEach((row, index) => {
      if (!validateScore(row.caScore, 30, "caScore", index)) hasErrors = true;
      if (!validateScore(row.examScore, 70, "examScore", index))
        hasErrors = true;
    });

    if (hasErrors) {
      return;
    }

    setIsSaving(true);

    try {
      const results = rows
        .filter((row) => row.caScore > 0 || row.examScore > 0)
        .map((row) => ({
          studentId: row.studentId,
          ca: row.caScore,
          exam: row.examScore,
        }));

      if (results.length === 0) {
        setErrors({ general: "Please enter at least one result" });
        setIsSaving(false);
        return;
      }

      await uploadMutation.mutateAsync({
        courseId,
        semester,
        session,
        results,
      });

      onSuccess?.();
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      // Split error message by newlines for better display
      const errorLines = errorMessage
        .split("\n")
        .filter((line: string) => line.trim());
      setErrors({ general: errorLines.join("\n") });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingEnrollments) {
    return (
      <div className="rounded-lg border p-12 text-center">
        <Loader2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground animate-spin" />
        <h3 className="mb-2 text-lg font-semibold">Loading students...</h3>
        <p className="text-sm text-muted-foreground">
          Fetching enrolled students for this course.
        </p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border p-12 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No students enrolled</h3>
        <p className="text-sm text-muted-foreground">
          There are no students enrolled in this course for the current
          semester.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="rounded-lg bg-blue-50 p-4">
        <h3 className="font-medium mb-2">Manual Entry Instructions</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• CA Score: 0-30 points</li>
          <li>• Exam Score: 0-70 points</li>
          <li>• Total score will be calculated automatically</li>
          <li>• Click Save to upload all results at once</li>
        </ul>
      </div>

      {/* General Error */}
      {errors.general && (
        <div className="rounded-lg bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900 mb-2">Error</h4>
              <div className="text-sm text-red-700 whitespace-pre-line">
                {errors.general}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">S/N</th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Matric Number
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Student Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  CA Score (0-30)
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Exam Score (0-70)
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row, index) => {
                const caError = errors[`${index}-caScore`];
                const examError = errors[`${index}-examScore`];
                const total = row.caScore + row.examScore;

                return (
                  <tr key={row.studentId} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {row.matricNumber}
                    </td>
                    <td className="px-4 py-3 text-sm">{row.name}</td>
                    <td className="px-4 py-3">
                      <div>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          step="0.5"
                          value={row.caScore}
                          onChange={(e) =>
                            handleScoreChange(index, "caScore", e.target.value)
                          }
                          className={`w-20 rounded-md border px-2 py-1 text-sm ${
                            caError
                              ? "border-red-500 focus:ring-red-500"
                              : "focus:ring-primary"
                          }`}
                        />
                        {caError && (
                          <p className="text-xs text-red-600 mt-1">{caError}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <input
                          type="number"
                          min="0"
                          max="70"
                          step="0.5"
                          value={row.examScore}
                          onChange={(e) =>
                            handleScoreChange(
                              index,
                              "examScore",
                              e.target.value,
                            )
                          }
                          className={`w-20 rounded-md border px-2 py-1 text-sm ${
                            examError
                              ? "border-red-500 focus:ring-red-500"
                              : "focus:ring-primary"
                          }`}
                        />
                        {examError && (
                          <p className="text-xs text-red-600 mt-1">
                            {examError}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
            setRows(rows.map((row) => ({ ...row, caScore: 0, examScore: 0 })));
            setErrors({});
          }}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          disabled={isSaving}
        >
          Clear All
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || Object.keys(errors).length > 0}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Results
            </>
          )}
        </button>
      </div>
    </div>
  );
}
