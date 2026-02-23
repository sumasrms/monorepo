"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { ENROLL_STUDENTS_BATCH } from "@/lib/graphql/enrollment";
import { GET_DEPARTMENTS } from "@/lib/graphql/department";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const autoEnrollSchema = z.object({
  departmentId: z.string().min(1, "Department is required"),
  level: z.coerce.number().min(100),
  semester: z.enum(["FIRST", "SECOND"]),
  session: z.string().min(1, "Session is required"),
});

type AutoEnrollFormValues = z.infer<typeof autoEnrollSchema>;

interface AutoEnrollDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AutoEnrollDialog({
  isOpen,
  onClose,
}: AutoEnrollDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AutoEnrollFormValues>({
    resolver: zodResolver(autoEnrollSchema),
    defaultValues: {
      level: 100,
      semester: "FIRST",
      session: "2023/2024",
    },
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => graphqlClient.request(GET_DEPARTMENTS),
  });

  const autoEnrollMutation = useMutation({
    mutationFn: async (data: AutoEnrollFormValues) => {
      return graphqlClient.request(ENROLL_STUDENTS_BATCH, { input: data });
    },
    onSuccess: (data: {
      enrollStudentsInCurriculumBatch: { message?: string };
    }) => {
      const result = data.enrollStudentsInCurriculumBatch;
      toast.success(result.message || "Students enrolled successfully");
      reset();
      onClose();
    },
    onError: (
      error: Error & { response?: { errors?: { message: string }[] } },
    ) => {
      toast.error(
        error.response?.errors?.[0]?.message ||
          "Failed to auto-enroll students",
      );
    },
  });

  const onSubmit = (data: AutoEnrollFormValues) => {
    autoEnrollMutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/50">
          <h2 className="text-xl font-bold">Auto-Enroll Students</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <form
            id="auto-enroll-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department</Label>
              <select
                id="departmentId"
                {...register("departmentId")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Department</option>
                {(
                  departmentsData as {
                    departments: { id: string; name: string }[];
                  }
                )?.departments?.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {errors.departmentId && (
                <p className="text-sm text-red-500">
                  {errors.departmentId.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <select
                  id="level"
                  {...register("level")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="300">300</option>
                  <option value="400">400</option>
                  <option value="500">500</option>
                </select>
                {errors.level && (
                  <p className="text-sm text-red-500">{errors.level.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <select
                  id="semester"
                  {...register("semester")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="FIRST">First</option>
                  <option value="SECOND">Second</option>
                </select>
                {errors.semester && (
                  <p className="text-sm text-red-500">
                    {errors.semester.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session">Session</Label>
              <Input
                id="session"
                {...register("session")}
                placeholder="2023/2024"
              />
              {errors.session && (
                <p className="text-sm text-red-500">{errors.session.message}</p>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              This will automatically enroll all active students matching the
              criteria into their respective compulsory curriculum courses.
              Existing enrollments will be skipped without error.
            </p>
          </form>
        </div>

        <div className="p-6 border-t bg-neutral-50 dark:bg-neutral-800/50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="auto-enroll-form"
            disabled={autoEnrollMutation.isPending}
          >
            {autoEnrollMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Auto-Enroll Batch
          </Button>
        </div>
      </div>
    </div>
  );
}
