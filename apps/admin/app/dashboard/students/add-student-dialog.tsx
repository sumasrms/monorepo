"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { CREATE_STUDENT } from "@/lib/graphql/students";
import { GET_DEPARTMENTS } from "@/lib/graphql/department";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const studentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  matricNumber: z.string().min(1, "Matric number is required"),
  admissionDate: z.string().min(1, "Admission date is required"),
  level: z.coerce.number(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  departmentId: z.string().min(1, "Department is required"),
  programId: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface AddStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddStudentDialog({
  isOpen,
  onClose,
}: AddStudentDialogProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      gender: "MALE",
      level: 100,
    },
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => graphqlClient.request(GET_DEPARTMENTS),
  });

  const createStudentMutation = useMutation({
    mutationFn: async (data: StudentFormValues) => {
      // Ensure date is ISO
      const formattedData = {
        ...data,
        admissionDate: new Date(data.admissionDate).toISOString(),
      };
      return graphqlClient.request(CREATE_STUDENT, { input: formattedData });
    },
    onSuccess: () => {
      toast.success("Student created successfully");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.errors?.[0]?.message || "Failed to create student",
      );
    },
  });

  const onSubmit = (data: StudentFormValues) => {
    createStudentMutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/50">
          <h2 className="text-xl font-bold">Add New Student</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form
            id="add-student-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register("name")} placeholder="John Doe" />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="john.doe@example.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matricNumber">Matric Number</Label>
                <Input
                  id="matricNumber"
                  {...register("matricNumber")}
                  placeholder="SCI/2024/001"
                />
                {errors.matricNumber && (
                  <p className="text-sm text-red-500">
                    {errors.matricNumber.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="admissionDate">Admission Date</Label>
                <Input
                  id="admissionDate"
                  type="date"
                  {...register("admissionDate")}
                />
                {errors.admissionDate && (
                  <p className="text-sm text-red-500">
                    {errors.admissionDate.message}
                  </p>
                )}
              </div>
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
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  {...register("gender")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.gender && (
                  <p className="text-sm text-red-500">
                    {errors.gender.message}
                  </p>
                )}
              </div>
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="programId">Program (Optional)</Label>
              <Input
                id="programId"
                {...register("programId")}
                placeholder="Computer Science"
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t bg-neutral-50 dark:bg-neutral-800/50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-student-form"
            disabled={createStudentMutation.isPending}
          >
            {createStudentMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Student
          </Button>
        </div>
      </div>
    </div>
  );
}
