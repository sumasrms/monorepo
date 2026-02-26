"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import {
  GET_DEPARTMENT_BY_CODE,
  UPDATE_DEPARTMENT,
} from "@/lib/graphql/department";
import { Button } from "@workspace/ui/components/button";
import {
  ArrowLeft,
  Settings,
  GraduationCap,
  Users,
  BookOpen,
  ChevronRight,
  School,
  FileText,
  UserCheck,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { CurriculumManagement } from "./curriculum-management";
import { cn } from "@workspace/ui/lib/utils";
import { AssignRoleDialog } from "@/components/assign-role-dialog";
import { toast } from "sonner";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";

interface Stats {
  studentCount: number;
  staffCount: number;
  courseCount: number;
}

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  facultyId: string;
  numberOfYears: number;
  hodId?: string;
  hod?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  stats?: Stats;
  faculty: {
    id: string;
    name: string;
    code: string;
  };
}

export default function DepartmentDetailPage() {
  const { code: facultyCode, deptCode } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "curriculum">(
    "overview",
  );
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    code: "",
    description: "",
    numberOfYears: 4,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["department", deptCode],
    queryFn: () =>
      graphqlClient.request<{ departmentByCode: Department }>(
        GET_DEPARTMENT_BY_CODE,
        {
          code: deptCode,
        },
      ),
    enabled: !!deptCode,
  });

  const department = data?.departmentByCode;

  const updateDepartmentMutation = useMutation({
    mutationFn: (input: { id: string; input: any }) =>
      graphqlClient.request(UPDATE_DEPARTMENT, input),
    onSuccess: (_, variables) => {
      const onlyHod =
        Object.keys(variables.input).length === 1 && "hodId" in variables.input;
      toast.success(
        onlyHod
          ? "Head of Department assigned and saved. The HOD will appear below."
          : "Department updated successfully.",
      );
      queryClient.invalidateQueries({ queryKey: ["department", deptCode] });
      queryClient.invalidateQueries({ queryKey: ["faculty", facultyCode] });
      setIsEditOpen(false);
    },
    onError: (error: any) => {
      const message =
        error?.response?.errors?.[0]?.message ||
        error?.message ||
        "Failed to assign Head of Department.";
      toast.error(message);
    },
  });

  const handleAssignHod = async (userId: string) => {
    if (!department) return;
    await updateDepartmentMutation.mutateAsync({
      id: department.id,
      input: { hodId: userId },
    });
  };

  const openEditDialog = () => {
    if (!department) return;
    setEditFormData({
      name: department.name,
      code: department.code,
      description: department.description ?? "",
      numberOfYears: department.numberOfYears ?? 4,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!department) return;
    const input: any = {};
    if (editFormData.name !== department.name) input.name = editFormData.name;
    if (editFormData.code !== department.code) input.code = editFormData.code;
    if (editFormData.description !== (department.description ?? "")) input.description = editFormData.description || undefined;
    if (editFormData.numberOfYears !== (department.numberOfYears ?? 4)) input.numberOfYears = editFormData.numberOfYears;
    if (Object.keys(input).length === 0) {
      setIsEditOpen(false);
      return;
    }
    updateDepartmentMutation.mutate({ id: department.id, input });
  };

  if (isLoading)
    return <div className="p-8">Loading department details...</div>;
  if (!department)
    return <div className="p-8 text-center">Department not found.</div>;

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
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold font-mono">
                {department.code}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-widest">
                {department.faculty.name}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {department.name}
            </h1>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={openEditDialog}
          >
            <Pencil size={16} />
            Edit Department
          </Button>
          <AssignRoleDialog
            title="Assign Head of Department"
            description="Only staff with the HOD role who belong to this department are listed. Assign the HOD role to a staff member first if needed, then assign them here. The assignment is saved immediately."
            roleName="HOD"
            departmentId={department.id}
            currentAssignee={department.hod}
            onAssign={handleAssignHod}
            trigger={
              <Button variant="outline" size="sm" className="gap-2">
                <UserCheck size={16} />
                {department.hod ? "Change HOD" : "Assign HOD"}
              </Button>
            }
          />
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-dept-name">Name</Label>
              <Input
                id="edit-dept-name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dept-code">Code</Label>
              <Input
                id="edit-dept-code"
                value={editFormData.code}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, code: e.target.value })
                }
                placeholder="e.g. CSC"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dept-description">Description</Label>
              <textarea
                id="edit-dept-description"
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, description: e.target.value })
                }
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dept-years">Years of Study</Label>
              <Input
                id="edit-dept-years"
                type="number"
                min={1}
                value={editFormData.numberOfYears}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    numberOfYears: parseInt(e.target.value) || 4,
                  })
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateDepartmentMutation.isPending}
              >
                {updateDepartmentMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stats Cards - Always Visible */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Students"
          value={department.stats?.studentCount || 0}
          icon={GraduationCap}
          badgeText="Active"
          badgeVariant="success"
        />
        <StatCard
          title="Staff"
          value={department.stats?.staffCount || 0}
          icon={Users}
          badgeText="Academic"
          badgeVariant="default"
        />
        <StatCard
          title="Courses"
          value={department.stats?.courseCount || 0}
          icon={BookOpen}
          badgeText="Offered"
          badgeVariant="secondary"
        />
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "px-4 py-2 border-b-2 text-sm font-medium transition-colors flex items-center gap-2",
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <School size={16} />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("curriculum")}
            className={cn(
              "px-4 py-2 border-b-2 text-sm font-medium transition-colors flex items-center gap-2",
              activeTab === "curriculum"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <FileText size={16} />
            Curriculum
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-xl font-bold mb-4">About Department</h2>
            <p className="text-muted-foreground leading-relaxed">
              {department.description ||
                "The academic hub for " + department.name + "."}
            </p>
            <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Years of Study</span>
                <span className="font-bold">
                  {department.numberOfYears} Years
                </span>
              </div>
              <div className="flex justify-between items-start gap-4 text-sm">
                <span className="text-muted-foreground shrink-0">
                  Head of Department
                </span>
                <span className="font-bold text-right">
                  {department.hod ? (
                    <div className="flex items-center gap-2 justify-end">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={department.hod.image} />
                        <AvatarFallback>
                          {department.hod.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{department.hod.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground font-normal">
                      Not Assigned — use &quot;Assign HOD&quot; above to assign a
                      staff member with the HOD role.
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold px-2">Administrative Actions</h2>
            <div className="grid grid-cols-1 gap-3">
              <Link
                href={`/dashboard/faculty/${facultyCode}/department/${deptCode}/grades`}
              >
                <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 bg-white hover:border-primary/50 hover:shadow-sm transition-all dark:border-neutral-800 dark:bg-neutral-900 group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Settings size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold">Grading System</h3>
                      <p className="text-xs text-muted-foreground">
                        Configure GPA scales and grade letters
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-neutral-300 group-hover:text-primary transition-colors"
                  />
                </div>
              </Link>

              <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/50 opacity-60 cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-neutral-200 text-neutral-500 flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">Staff Management</h3>
                    <p className="text-xs text-muted-foreground">
                      Assign and manage department lecturers
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "curriculum" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <CurriculumManagement departmentId={department.id} />
        </div>
      )}
    </div>
  );
}
