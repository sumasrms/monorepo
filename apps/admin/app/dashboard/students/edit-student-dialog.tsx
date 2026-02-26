"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_STUDENT, UPDATE_STUDENT } from "@/lib/graphql/students";
import { GET_DEPARTMENTS } from "@/lib/graphql/department";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const editStudentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  matricNumber: z.string().min(1, "Matric number is required"),
  admissionDate: z.string().min(1, "Admission date is required"),
  level: z.coerce.number(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  departmentId: z.string().min(1, "Department is required"),
  programId: z.string().optional(),
});

type EditStudentFormValues = z.infer<typeof editStudentSchema>;

interface EditStudentDialogProps {
  studentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditStudentDialog({
  studentId,
  isOpen,
  onClose,
}: EditStudentDialogProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EditStudentFormValues>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: {
      gender: "MALE",
      level: 100,
    },
  });

  const { data: studentData } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () =>
      graphqlClient.request<{ student: any }>(GET_STUDENT, { id: studentId }),
    enabled: !!studentId && isOpen,
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["departments"],
    queryFn: () => graphqlClient.request(GET_DEPARTMENTS),
    enabled: isOpen,
  });

  const student = studentData?.student;

  useEffect(() => {
    if (student && isOpen) {
      setValue("name", student.user?.name ?? "");
      setValue("email", student.user?.email ?? "");
      setValue("matricNumber", student.matricNumber ?? "");
      setValue(
        "admissionDate",
        student.admissionDate
          ? new Date(student.admissionDate).toISOString().split("T")[0]
          : "",
      );
      setValue("level", student.level ?? 100);
      setValue("gender", (student.user?.gender as any) ?? "MALE");
      setValue("departmentId", student.departmentId ?? "");
      setValue("programId", student.programId ?? "");
    }
  }, [student, isOpen, setValue]);

  const updateMutation = useMutation({
    mutationFn: async (data: EditStudentFormValues) => {
      const input = {
        ...data,
        admissionDate: new Date(data.admissionDate).toISOString(),
      };
      return graphqlClient.request(UPDATE_STUDENT, {
        id: studentId!,
        input,
      });
    },
    onSuccess: () => {
      toast.success("Student updated successfully");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.errors?.[0]?.message || "Failed to update student",
      );
    },
  });

  const onSubmit = (data: EditStudentFormValues) => {
    if (!studentId) return;
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          {!student && studentId ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : student ? (
            <form
              id="edit-student-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  {...register("name")}
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  {...register("email")}
                  placeholder="john.doe@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-matricNumber">Matric Number</Label>
                  <Input
                    id="edit-matricNumber"
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
                  <Label htmlFor="edit-admissionDate">Admission Date</Label>
                  <Input
                    id="edit-admissionDate"
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
                  <Label htmlFor="edit-level">Level</Label>
                  <select
                    id="edit-level"
                    {...register("level")}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={300}>300</option>
                    <option value={400}>400</option>
                    <option value={500}>500</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-gender">Gender</Label>
                  <select
                    id="edit-gender"
                    {...register("gender")}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-departmentId">Department</Label>
                <select
                  id="edit-departmentId"
                  {...register("departmentId")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
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
                <Label htmlFor="edit-programId">Program (Optional)</Label>
                <Input
                  id="edit-programId"
                  {...register("programId")}
                  placeholder="Program ID"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="edit-student-form"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          ) : null}
      </DialogContent>
    </Dialog>
  );
}
