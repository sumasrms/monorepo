"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import {
  GET_GRADE_SCALES,
  CREATE_GRADE_SCALE,
  REMOVE_GRADE_SCALE,
} from "@/lib/graphql/grade-scale";
import { GET_DEPARTMENT_BY_CODE } from "@/lib/graphql/department";
import {
  PopoverForm,
  PopoverFormButton,
  PopoverFormSeparator,
  PopoverFormSuccess,
} from "@workspace/ui/components/popover-form";
import { Button } from "@workspace/ui/components/button";
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";

interface GradeScale {
  id: string;
  grade: string;
  minScore: number;
  maxScore: number;
  gradePoint: number;
  description?: string;
}

export default function DepartmentGradesPage() {
  const { code: facultyCode, deptCode } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [formState, setFormState] = useState<"idle" | "loading" | "success">(
    "idle",
  );
  const [formData, setFormData] = useState({
    grade: "",
    minScore: 0,
    maxScore: 100,
    gradePoint: 0,
    description: "",
  });

  const { data: deptData } = useQuery({
    queryKey: ["department", deptCode],
    queryFn: () =>
      graphqlClient.request<any>(GET_DEPARTMENT_BY_CODE, { code: deptCode }),
    enabled: !!deptCode,
  });

  const department = deptData?.departmentByCode;

  const { data: scalesData, isLoading } = useQuery({
    queryKey: ["gradeScales", department?.id],
    queryFn: () =>
      graphqlClient.request<{ gradeScales: GradeScale[] }>(GET_GRADE_SCALES, {
        departmentId: department.id,
      }),
    enabled: !!department?.id,
  });

  const createMutation = useMutation({
    mutationFn: (input: any) =>
      graphqlClient.request(CREATE_GRADE_SCALE, { input }),
    onSuccess: () => {
      setFormState("success");
      queryClient.invalidateQueries({
        queryKey: ["gradeScales", department?.id],
      });
      setTimeout(() => {
        setIsPopoverOpen(false);
        setFormState("idle");
        setFormData({
          grade: "",
          minScore: 0,
          maxScore: 100,
          gradePoint: 0,
          description: "",
        });
      }, 2000);
    },
    onError: () => setFormState("idle"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) =>
      graphqlClient.request(REMOVE_GRADE_SCALE, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["gradeScales", department?.id],
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!department) return;
    setFormState("loading");
    createMutation.mutate({ ...formData, departmentId: department.id });
  };

  if (isLoading) return <div className="p-8">Loading grading scale...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Grading System
            </h1>
            <p className="text-muted-foreground">
              {department?.name} • Configure academic standards
            </p>
          </div>
        </div>

        <PopoverForm
          title="Add Grade"
          open={isPopoverOpen}
          setOpen={setIsPopoverOpen}
          width="360px"
          height="450px"
          showCloseButton={formState !== "success"}
          showSuccess={formState === "success"}
          openChild={
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Grade Letter
                  </label>
                  <input
                    type="text"
                    value={formData.grade}
                    onChange={(e) =>
                      setFormData({ ...formData, grade: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                    placeholder="e.g. A"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Grade Point
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.gradePoint}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gradePoint: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Min Score
                  </label>
                  <input
                    type="number"
                    value={formData.minScore}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minScore: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Max Score
                  </label>
                  <input
                    type="number"
                    value={formData.maxScore}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxScore: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  Remark/Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md bg-transparent"
                  placeholder="e.g. Excellent"
                />
              </div>
              <div className="relative flex h-12 items-center">
                <PopoverFormSeparator />
                <PopoverFormButton
                  loading={formState === "loading"}
                  text="Save Grade"
                />
              </div>
            </form>
          }
          successChild={
            <PopoverFormSuccess
              title="Grade Added"
              description="The new grade configuration has been saved."
            />
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-3">
          <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-4 font-bold text-sm">Grade</th>
                  <th className="px-6 py-4 font-bold text-sm">Score Range</th>
                  <th className="px-6 py-4 font-bold text-sm text-center">
                    Grade Point
                  </th>
                  <th className="px-6 py-4 font-bold text-sm">Remark</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {scalesData?.gradeScales.map((scale) => (
                  <tr
                    key={scale.id}
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary font-bold">
                        {scale.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {scale.minScore} - {scale.maxScore}%
                    </td>
                    <td className="px-6 py-4 font-bold text-center">
                      {scale.gradePoint.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground italic">
                      {scale.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => removeMutation.mutate(scale.id)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {scalesData?.gradeScales.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-muted-foreground italic"
                    >
                      No grading scale configured for this department.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Info size={20} />
              <h3 className="font-bold">Grading Context</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Define the score boundaries and weightage for this department.
              These settings directly affect GPA calculation for all students in
              this department.
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-2 rounded-lg">
              <CheckCircle2 size={14} />
              Nigerian University Standard (5.0 Scale)
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30 space-y-3">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle size={20} />
              <h3 className="font-bold">Important</h3>
            </div>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
              Changes to the grading scale will only apply to new result uploads
              and recalculations. Historical GPAs are preserved unless
              re-evaluated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
