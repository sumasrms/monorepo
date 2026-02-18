"use client";

import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, X } from "lucide-react";
import {
  useUploadResults,
  useEnrolledStudents,
} from "@/features/results/hooks/useResults";
import { getErrorMessage } from "@/lib/graphql-client";
import { graphqlFetch } from "@/lib/api";
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

interface CSVRow {
  matricNumber: string;
  caScore: number;
  examScore: number;
}

interface BulkUploadProps {
  courseId: string;
  semester: string;
  session: string;
  canSubmit?: boolean;
  onPermissionDenied?: () => void;
  onSuccess?: () => void;
}

export default function BulkCSVUpload({
  courseId,
  semester,
  session,
  canSubmit = true,
  onPermissionDenied,
  onSuccess,
}: BulkUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadResults();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      setErrors(["Please select a valid CSV file"]);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    parseCSV(selectedFile);
  };

  const parseCSV = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          setErrors(["CSV file is empty or has no data rows"]);
          setIsProcessing(false);
          return;
        }

        // Parse header
        const firstLine = lines[0];
        if (!firstLine) {
          setErrors(["CSV header is empty"]);
          setIsProcessing(false);
          return;
        }

        const headers = firstLine.split(",").map((h) => h.trim().toLowerCase());
        const matricIndex = headers.findIndex((h) => h.includes("matric"));
        const caIndex = headers.findIndex((h) => h.includes("ca"));
        const examIndex = headers.findIndex((h) => h.includes("exam"));

        if (matricIndex === -1 || caIndex === -1 || examIndex === -1) {
          setErrors([
            "CSV must have columns for Matric Number, CA Score, and Exam Score",
          ]);
          setIsProcessing(false);
          return;
        }

        // Parse data rows
        const data: CSVRow[] = [];
        const parseErrors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const currentLine = lines[i];
          if (!currentLine) continue;

          const values = currentLine.split(",").map((v) => v.trim());

          if (values.length < 3) continue;

          const matricNumber = values[matricIndex];
          const caValue = values[caIndex];
          const examValue = values[examIndex];

          if (!matricNumber) {
            parseErrors.push(`Row ${i + 1}: Missing matric number`);
            continue;
          }

          const caScore = caValue ? parseFloat(caValue) : 0;
          const examScore = examValue ? parseFloat(examValue) : 0;

          if (!matricNumber) {
            parseErrors.push(`Row ${i + 1}: Missing matric number`);
            continue;
          }

          if (isNaN(caScore) || caScore < 0 || caScore > 30) {
            parseErrors.push(`Row ${i + 1}: Invalid CA score (must be 0-30)`);
            continue;
          }

          if (isNaN(examScore) || examScore < 0 || examScore > 70) {
            parseErrors.push(`Row ${i + 1}: Invalid Exam score (must be 0-70)`);
            continue;
          }

          data.push({ matricNumber, caScore, examScore });
        }

        if (parseErrors.length > 0) {
          setErrors(parseErrors);
        }

        setParsedData(data);
        setIsProcessing(false);
      } catch (parseError) {
        setErrors(["Failed to parse CSV file. Please check the format."]);
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrors(["Failed to read file"]);
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const { data: course } = useEnrolledStudents(courseId);

  const handleUpload = async () => {
    if (!canSubmit) {
      onPermissionDenied?.();
      return;
    }
    if (parsedData.length === 0) {
      setErrors(["No valid data to upload"]);
      return;
    }

    const enrollments = course?.enrollments ?? [];
    if (enrollments.length === 0) {
      setErrors(["Could not verify enrolled students. Please try again."]);
      return;
    }

    setIsProcessing(true);

    try {
      const resultsToUpload = parsedData.map((row) => {
        const enrollment = enrollments.find(
          (e) => e.student.matricNumber === row.matricNumber,
        );

        if (!enrollment) {
          throw new Error(
            `Student with matric number ${row.matricNumber} is not enrolled in this course.`,
          );
        }

        return {
          studentId: enrollment.student.id,
          ca: row.caScore,
          exam: row.examScore,
        };
      });

      await uploadMutation.mutateAsync({
        courseId,
        semester,
        session,
        results: resultsToUpload,
      });

      // Success
      setFile(null);
      setParsedData([]);
      setErrors([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      const errorLines = errorMessage
        .split("\n")
        .filter((line: string) => line.trim());
      setErrors(errorLines);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setParsedData([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="rounded-lg bg-blue-50 p-4">
        <h3 className="font-medium mb-2">CSV Format Instructions</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• First row must contain headers</li>
          <li>• Required columns: Matric Number, CA Score, Exam Score</li>
          <li>• Student Name column is optional (for reference only)</li>
          <li>• CA Score: 0-30 points</li>
          <li>• Exam Score: 0-70 points</li>
          <li>
            • Example:{" "}
            <code className="bg-white px-1 rounded">
              Matric Number,Student Name,CA Score,Exam Score
            </code>
          </li>
        </ul>
      </div>

      {/* Download Template */}
      <div className="flex items-center justify-between p-4 rounded-lg border">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium text-sm">Download CSV Template</p>
            <p className="text-xs text-muted-foreground">
              Pre-filled with enrolled students
            </p>
          </div>
        </div>
        <button
          onClick={async () => {
            try {
              const data = await graphqlFetch<{
                course: { enrollments: { student: { matricNumber: string; user: { name: string } } }[] } | null;
              }>(
                `
                  query GetEnrolledStudents($courseId: ID!) {
                    course(id: $courseId) {
                      enrollments {
                        student {
                          matricNumber
                          user {
                            name
                          }
                        }
                      }
                    }
                  }
                `,
                { courseId },
              );
              const enrollments = data.course?.enrollments || [];
              let csv = "Matric Number,Student Name,CA Score,Exam Score\n";
              enrollments.forEach((enrollment) => {
                csv += `${enrollment.student.matricNumber},${enrollment.student.user.name},,\n`;
              });
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "results_template.csv";
              a.click();
            } catch {
              // Fallback to basic template
              const csv = "Matric Number,Student Name,CA Score,Exam Score\n";
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "results_template.csv";
              a.click();
            }
          }}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Download Template
        </button>
      </div>

      {/* File Upload */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          id="csv-upload"
        />
        <label
          htmlFor="csv-upload"
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 cursor-pointer hover:border-primary transition-colors"
        >
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm font-medium mb-1">
            {file ? file.name : "Click to upload CSV file"}
          </p>
          <p className="text-xs text-muted-foreground">
            or drag and drop your file here
          </p>
        </label>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900 mb-2">
                {errors.length} Error{errors.length > 1 ? "s" : ""} Found
              </h4>
              <ul className="text-sm text-red-700 space-y-2">
                {errors.slice(0, 5).map((error, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="shrink-0">•</span>
                    <span className="whitespace-pre-line">{error}</span>
                  </li>
                ))}
                {errors.length > 5 && (
                  <li className="text-xs text-red-600 pl-4">
                    ... and {errors.length - 5} more errors
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {parsedData.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-medium">
                {parsedData.length} Record{parsedData.length > 1 ? "s" : ""}{" "}
                Ready to Upload
              </h3>
            </div>
            <button
              onClick={handleClear}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">
                      #
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium">
                      Matric Number
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium">
                      CA Score
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium">
                      Exam Score
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parsedData.map((row, index) => (
                    <tr key={index} className="hover:bg-muted/50">
                      <td className="px-4 py-2 text-sm">{index + 1}</td>
                      <td className="px-4 py-2 text-sm">{row.matricNumber}</td>
                      <td className="px-4 py-2 text-sm">{row.caScore}</td>
                      <td className="px-4 py-2 text-sm">{row.examScore}</td>
                      <td className="px-4 py-2 text-sm font-medium">
                        {row.caScore + row.examScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClear}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  disabled={isProcessing || parsedData.length === 0}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing
                    ? "Uploading..."
                    : `Upload ${parsedData.length} Results`}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm submission</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to submit {parsedData.length} results for
                    {" "}
                    {semester} semester, {session} session. Once submitted,
                    the results move to pending HOD approval.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Review</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleUpload}
                    disabled={isProcessing}
                  >
                    Confirm submission
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}
