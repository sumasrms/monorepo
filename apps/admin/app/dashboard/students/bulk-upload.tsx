"use client";
import React, { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { BULK_UPLOAD_STUDENTS } from "@/lib/graphql/students";
import { Button } from "@workspace/ui/components/button";
import {
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
} from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface BulkUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TEMPLATE_HEADERS = [
  "Full Name",
  "Matric Number",
  "Date of Birth",
  "Admission Date",
  "Gender",
  "Department",
  "Level",
  "Program",
  "Email",
  "Credential Key",
];

export default function StudentBulkUpload({
  isOpen,
  onClose,
  onSuccess,
}: BulkUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadStep, setUploadStep] = useState<"select" | "preview" | "result">(
    "select",
  );
  const [bulkResult, setBulkResult] = useState<any>(null);

  const uploadMutation = useMutation({
    mutationFn: (inputs: any[]) =>
      graphqlClient.request(BULK_UPLOAD_STUDENTS, { inputs }),
    onSuccess: (res: any) => {
      setBulkResult(res.bulkUploadStudents);
      setUploadStep("result");
      if (res.bulkUploadStudents.errorCount === 0) {
        toast.success("Bulk upload completed successfully!");
        onSuccess();
      } else {
        toast.warning(
          `Completed with ${res.bulkUploadStudents.errorCount} errors.`,
        );
      }
    },
    onError: (err) => {
      toast.error("Failed to upload student data.");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    setIsParsing(true);
    setErrors([]);
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          validateAndSetData(results.data);
          setIsParsing(false);
        },
        error: (err) => {
          setErrors([`Error parsing CSV: ${err.message}`]);
          setIsParsing(false);
        },
      });
    } else if (extension === "xlsx" || extension === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const bstr = e.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          if (!wsname) {
            setErrors(["Invalid Excel file: No sheets found"]);
            setIsParsing(false);
            return;
          }
          const ws = wb.Sheets[wsname];
          if (!ws) {
            setErrors(["Invalid Excel file: Sheet is empty or invalid"]);
            setIsParsing(false);
            return;
          }
          const data = XLSX.utils.sheet_to_json(ws);
          validateAndSetData(data);
        } catch (err: any) {
          setErrors([`Error parsing Excel: ${err.message}`]);
        }
        setIsParsing(false);
      };
      reader.readAsBinaryString(file);
    } else {
      setErrors(["Unsupported file format. Please use CSV or Excel."]);
      setIsParsing(false);
    }
  };

  // Helper to parse various date formats
  const parseDate = (dateStr: any): string | null => {
    if (!dateStr) return null;

    // Try standard date parsing first
    let date = new Date(dateStr);

    // If invalid, try DD/MM/YYYY format which is common in CSVs
    if (isNaN(date.getTime()) && typeof dateStr === "string") {
      const parts = dateStr.split(/[\/\-\.]/);
      if (parts.length === 3) {
        const [day, month, year] = parts;
        // Case: DD/MM/YYYY
        if (
          day &&
          month &&
          year &&
          day.length <= 2 &&
          month.length <= 2 &&
          year.length === 4
        ) {
          date = new Date(`${year}-${month}-${day}`);
        }
      }
    }

    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }

    return null;
  };

  const validateAndSetData = (rawData: any[]) => {
    const validationErrors: string[] = [];
    const formattedData = rawData.map((row, index) => {
      // Basic mapping
      const mapped: any = {
        name: row["Full Name"] || row["name"],
        matricNumber: row["Matric Number"] || row["matricNumber"],
        rawDob: row["Date of Birth"] || row["dateOfBirth"],
        rawAdmDate: row["Admission Date"] || row["admissionDate"],
        gender: (row["Gender"] || row["gender"] || "MALE").toUpperCase(),
        email: row["Email"] || row["email"],
        credentialKey: row["Credential Key"] || row["credentialKey"],
        programId: row["Program"] || row["programId"],
        departmentId: row["Department"] || row["departmentId"],
        level: parseInt(row["Level"] || row["level"] || "100"),
      };

      // Safe date parsing
      mapped.dateOfBirth = parseDate(mapped.rawDob);
      mapped.admissionDate = parseDate(mapped.rawAdmDate);

      // Basic validation
      if (!mapped.name)
        validationErrors.push(`Row ${index + 1}: Full Name is missing`);
      if (!mapped.matricNumber)
        validationErrors.push(`Row ${index + 1}: Matric Number is missing`);
      if (!mapped.email)
        validationErrors.push(`Row ${index + 1}: Email is missing`);

      if (!mapped.rawDob) {
        validationErrors.push(`Row ${index + 1}: Date of Birth is missing`);
      } else if (!mapped.dateOfBirth) {
        validationErrors.push(
          `Row ${index + 1}: Invalid Date of Birth format (Use YYYY-MM-DD)`,
        );
      }

      if (
        mapped.gender &&
        !["MALE", "FEMALE", "OTHER"].includes(mapped.gender)
      ) {
        mapped.gender = "MALE";
      }

      return mapped;
    });

    setErrors(validationErrors);
    setData(formattedData);
    setUploadStep("preview");
  };

  const handleUpload = () => {
    if (errors.length > 0) {
      toast.error("Please fix validation errors before uploading.");
      return;
    }
    const sanitizedData = data.map((d) => ({
      name: d.name,
      matricNumber: d.matricNumber.toString(),
      admissionDate: d.admissionDate || new Date().toISOString(),
      dateOfBirth: d.dateOfBirth,
      gender: d.gender,
      email: d.email,
      credentialKey: d.credentialKey,
      departmentId: d.departmentId,
      programId: d.programId,
      level: d.level,
    }));
    uploadMutation.mutate(sanitizedData);
  };

  const downloadTemplate = () => {
    const csvContent = TEMPLATE_HEADERS.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "student_onboarding_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/50">
          <div>
            <h2 className="text-xl font-bold">Bulk Student Onboarding</h2>
            <p className="text-sm text-muted-foreground">
              Upload multiple students using CSV or Excel.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {uploadStep === "select" && (
            <div className="space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors group"
              >
                <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload size={32} />
                </div>
                <h3 className="text-lg font-bold">Drop your file here</h3>
                <p className="text-muted-foreground text-center max-w-xs">
                  Supported formats: .csv, .xlsx, .xls. Make sure to use the
                  provided template.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle
                  className="text-blue-500 shrink-0 mt-0.5"
                  size={18}
                />
                <div className="text-sm">
                  <p className="font-bold text-blue-700 dark:text-blue-300">
                    Important Note
                  </p>
                  <p className="text-blue-600/80 dark:text-blue-400/80">
                    System will automatically link student profiles to user
                    accounts and generate initial credentials.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="w-full gap-2 py-6 text-lg rounded-xl"
              >
                <Download size={20} />
                Download Onboarding Template
              </Button>
            </div>
          )}

          {uploadStep === "preview" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="text-primary" size={20} />
                  <span className="font-bold">{file?.name}</span>
                  <span className="text-xs text-muted-foreground bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                    {data.length} Rows Detected
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadStep("select")}
                >
                  Change File
                </Button>
              </div>

              {errors.length > 0 ? (
                <div className="border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 rounded-xl overflow-hidden">
                  <div className="p-3 bg-red-100 dark:bg-red-900/20 flex items-center gap-2 text-red-700 dark:text-red-400 font-bold border-b border-red-200 dark:border-red-900/50">
                    <AlertCircle size={18} />
                    Validation Errors ({errors.length})
                  </div>
                  <div className="p-4 max-h-48 overflow-y-auto space-y-1">
                    {errors.map((err, i) => (
                      <p
                        key={i}
                        className="text-xs text-red-600 dark:text-red-400"
                      >
                        • {err}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/10 p-4 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="text-green-500" size={24} />
                  <div>
                    <p className="font-bold text-green-700 dark:text-green-400">
                      Data Validated
                    </p>
                    <p className="text-sm text-green-600/80 dark:text-green-400/80">
                      All {data.length} rows are ready for import.
                    </p>
                  </div>
                </div>
              )}

              <div className="border rounded-xl overflow-hidden bg-neutral-50 dark:bg-neutral-800/30">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 dark:bg-neutral-800 text-muted-foreground font-medium uppercase tracking-wider">
                      <th className="p-2 border-b">Name</th>
                      <th className="p-2 border-b">Email</th>
                      <th className="p-2 border-b">Matric No.</th>
                      <th className="p-2 border-b">Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="p-2">{row.name}</td>
                        <td className="p-2">{row.email}</td>
                        <td className="p-2">{row.matricNumber}</td>
                        <td className="p-2">{row.level}</td>
                      </tr>
                    ))}
                    {data.length > 5 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-2 text-center text-muted-foreground italic"
                        >
                          ...and {data.length - 5} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {uploadStep === "result" && bulkResult && (
            <div className="space-y-8 py-4 flex flex-col items-center text-center">
              <div className="h-24 w-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h3 className="text-3xl font-bold">Import Complete</h3>
                <p className="text-muted-foreground mt-2">
                  Successfully imported {bulkResult.successCount} students.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                  <span className="text-sm text-muted-foreground block">
                    Success
                  </span>
                  <span className="text-2xl font-bold text-green-500">
                    {bulkResult.successCount}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                  <span className="text-sm text-muted-foreground block">
                    Errors
                  </span>
                  <span className="text-2xl font-bold text-red-500">
                    {bulkResult.errorCount}
                  </span>
                </div>
              </div>

              {bulkResult.errors.length > 0 && (
                <div className="w-full text-left">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-500" />
                    Error Details
                  </h4>
                  <div className="border rounded-xl p-4 bg-red-50 dark:bg-red-900/10 max-h-48 overflow-y-auto space-y-2">
                    {bulkResult.errors.map((err: any, i: number) => (
                      <p
                        key={i}
                        className="text-xs text-red-600 dark:text-red-400 font-mono"
                      >
                        Row {err.row}: {err.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-neutral-50 dark:bg-neutral-800/50 flex gap-3">
          {uploadStep === "result" ? (
            <Button
              className="flex-1 py-6 text-lg rounded-xl"
              onClick={onClose}
            >
              Done
            </Button>
          ) : (
            <>
              <Button variant="ghost" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                className="flex-1 gap-2 py-6 text-lg rounded-xl"
                disabled={
                  isParsing || uploadMutation.isPending || data.length === 0
                }
                onClick={handleUpload}
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Upload size={20} />
                )}
                {uploadMutation.isPending
                  ? "Uploading..."
                  : `Upload ${data.length} Students`}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
