"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import {
  GET_FACULTY_BY_CODE,
  REMOVE_FACULTY,
  UPDATE_FACULTY,
} from "@/lib/graphql/faculty";
import { CREATE_DEPARTMENT } from "@/lib/graphql/department";
import {
  PopoverForm,
  PopoverFormButton,
  PopoverFormCutOutLeftIcon,
  PopoverFormCutOutRightIcon,
  PopoverFormSeparator,
  PopoverFormSuccess,
} from "@workspace/ui/components/popover-form";
import { Button } from "@workspace/ui/components/button";
import {
  Users,
  GraduationCap,
  BookOpen,
  Trash2,
  UserPlus,
  LayoutGrid,
  List,
  ChevronRight,
  UserCheck,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";
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
  departmentCount?: number;
}

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  stats?: Stats;
}

interface Faculty {
  id: string;
  name: string;
  code: string;
  description?: string;
  deanId?: string;
  dean?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  createdAt: string;
  updatedAt: string;
  stats?: Stats;
  departments: Department[];
}

export default function FacultyDetailPage() {
  const { code } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    code: "",
    description: "",
    deanId: "",
  });

  // Department Form State
  const [isDeptPopoverOpen, setIsDeptPopoverOpen] = useState(false);
  const [deptFormState, setDeptFormState] = useState<
    "idle" | "loading" | "success"
  >("idle");
  const [deptFormData, setDeptFormData] = useState({
    name: "",
    code: "",
    description: "",
    facultyId: "",
    numberOfYears: 4,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["faculty", code],
    queryFn: () =>
      graphqlClient.request<{ facultyByCode: Faculty }>(GET_FACULTY_BY_CODE, {
        code,
      }),
    enabled: !!code,
  });

  const faculty = data?.facultyByCode;

  const createDeptMutation = useMutation({
    mutationFn: (input: any) =>
      graphqlClient.request(CREATE_DEPARTMENT, { input }),
    onSuccess: () => {
      setDeptFormState("success");
      queryClient.invalidateQueries({ queryKey: ["faculty", code] });
      setTimeout(() => {
        setIsDeptPopoverOpen(false);
        setDeptFormState("idle");
        setDeptFormData({
          ...deptFormData,
          name: "",
          code: "",
          description: "",
        });
      }, 2000);
    },
    onError: () => setDeptFormState("idle"),
  });

  const updateFacultyMutation = useMutation({
    mutationFn: (input: {
      id: string;
      input: { name?: string; code?: string; description?: string; deanId?: string };
    }) =>
      graphqlClient.request(UPDATE_FACULTY, {
        id: input.id,
        input: input.input,
      }),
    onSuccess: (_, variables) => {
      const onlyDean =
        Object.keys(variables.input).length === 1 && "deanId" in variables.input;
      toast.success(
        onlyDean ? "Dean assigned successfully" : "Faculty updated successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["faculty", code] });
      setIsEditOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update faculty");
    },
  });

  const removeFacultyMutation = useMutation({
    mutationFn: (id: string) => graphqlClient.request(REMOVE_FACULTY, { id }),
    onSuccess: () => {
      router.push("/dashboard/faculty");
      queryClient.invalidateQueries({ queryKey: ["faculties"] });
    },
  });

  const handleDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faculty) return;
    setDeptFormState("loading");
    createDeptMutation.mutate({ ...deptFormData, facultyId: faculty.id });
  };

  const handleAssignDean = async (userId: string) => {
    if (!faculty) return;
    await updateFacultyMutation.mutateAsync({
      id: faculty.id,
      input: { deanId: userId },
    });
  };

  const openEditDialog = () => {
    setEditFormData({
      name: faculty!.name,
      code: faculty!.code,
      description: faculty!.description ?? "",
      deanId: faculty!.deanId ?? "",
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faculty) return;
    const input: { name?: string; code?: string; description?: string; deanId?: string } = {};
    if (editFormData.name !== faculty.name) input.name = editFormData.name;
    if (editFormData.code !== faculty.code) input.code = editFormData.code;
    if (editFormData.description !== (faculty.description ?? "")) input.description = editFormData.description || undefined;
    if (editFormData.deanId !== (faculty.deanId ?? "")) input.deanId = editFormData.deanId || undefined;
    if (Object.keys(input).length === 0) {
      setIsEditOpen(false);
      return;
    }
    updateFacultyMutation.mutate({ id: faculty.id, input });
  };

  if (isLoading) return <div className="p-8">Loading faculty details...</div>;
  if (!faculty)
    return <div className="p-8 text-center">Faculty not found.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{faculty.name}</h1>
          <p className="text-muted-foreground">
            Faculty Overview and Department Management
          </p>
        </div>
        <div className="flex flex-wrap gap-2 relative">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={openEditDialog}
          >
            <Pencil size={16} />
            Edit Faculty
          </Button>
          <AssignRoleDialog
            title="Assign Dean"
            description="Select a staff member to assign as the Dean of this faculty. Only staff with the Dean role in this faculty are listed."
            roleName="Dean"
            facultyId={faculty.id}
            currentAssignee={faculty.dean}
            onAssign={handleAssignDean}
            trigger={
              <Button variant="outline" size="sm" className="gap-2">
                <UserCheck size={16} />
                {faculty.dean ? "Change Dean" : "Assign Dean"}
              </Button>
            }
          />

          <PopoverForm
            title="Create Department"
            open={isDeptPopoverOpen}
            setOpen={setIsDeptPopoverOpen}
            width="364px"
            height="420px"
            showCloseButton={deptFormState !== "success"}
            showSuccess={deptFormState === "success"}
            openChild={
              <form onSubmit={handleDeptSubmit} className="space-y-4">
                <div className="px-4 pt-4">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Dept Name
                  </label>
                  <input
                    type="text"
                    value={deptFormData.name}
                    onChange={(e) =>
                      setDeptFormData({ ...deptFormData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-black"
                    required
                  />
                </div>
                <div className="px-4">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    value={deptFormData.code}
                    onChange={(e) =>
                      setDeptFormData({ ...deptFormData, code: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-black"
                    required
                    placeholder="e.g. computer-science"
                  />
                </div>
                <div className="px-4">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Years of Study
                  </label>
                  <input
                    type="number"
                    value={deptFormData.numberOfYears}
                    onChange={(e) =>
                      setDeptFormData({
                        ...deptFormData,
                        numberOfYears: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-black"
                    required
                    min={1}
                  />
                </div>
                <div className="relative flex h-12 items-center px-[10px]">
                  <PopoverFormSeparator />
                  <div className="absolute left-0 top-0 -translate-x-[1.5px] -translate-y-1/2">
                    <PopoverFormCutOutLeftIcon />
                  </div>
                  <div className="absolute right-0 top-0 translate-x-[1.5px] -translate-y-1/2 rotate-180">
                    <PopoverFormCutOutRightIcon />
                  </div>
                  <PopoverFormButton
                    loading={deptFormState === "loading"}
                    text="Create"
                  />
                </div>
              </form>
            }
            successChild={
              <PopoverFormSuccess
                title="Department Created"
                description="The new department has been added to this faculty."
              />
            }
          />

          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={() => {
              if (
                confirm(
                  "Are you sure you want to delete this faculty? This action cannot be undone.",
                )
              ) {
                removeFacultyMutation.mutate(faculty.id);
              }
            }}
          >
            <Trash2 size={16} />
            Delete Faculty
          </Button>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Faculty</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code">Code</Label>
              <Input
                id="edit-code"
                value={editFormData.code}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, code: e.target.value })
                }
                placeholder="e.g. SCI"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, description: e.target.value })
                }
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-deanId">Dean ID (optional)</Label>
              <Input
                id="edit-deanId"
                value={editFormData.deanId}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, deanId: e.target.value })
                }
                placeholder="User ID of dean"
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
                disabled={updateFacultyMutation.isPending}
              >
                {updateFacultyMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dean Card if assigned - Optional visual improvement */}
      {faculty.dean && (
        <div className="rounded-xl border bg-white p-4 dark:bg-neutral-950 flex items-center gap-4">
          <Avatar className="h-12 w-12 border">
            <AvatarImage src={faculty.dean.image} />
            <AvatarFallback className="text-lg">
              {faculty.dean.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Dean of Faculty
            </p>
            <p className="font-bold text-lg">{faculty.dean.name}</p>
            {/* We could fetch more dean details if needed */}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={faculty.stats?.studentCount || 0}
          icon={GraduationCap}
          badgeText="Students"
          badgeVariant="default"
        />
        <StatCard
          title="Total Courses"
          value={faculty.stats?.courseCount || 0}
          icon={BookOpen}
          badgeText="Courses"
          badgeVariant="secondary"
        />
        <StatCard
          title="Total Staffs"
          value={faculty.stats?.staffCount || 0}
          icon={Users}
          badgeText="Staffs"
          badgeVariant="outline"
        />
        <StatCard
          title="Lecturers"
          value={faculty.stats?.staffCount || 0}
          icon={UserPlus}
          badgeText="Academic"
          badgeVariant="success"
        />
      </div>

      {/* Departments Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold italic">Departments</h2>
          <div className="flex items-center border rounded-lg p-1 bg-white dark:bg-neutral-900 shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "grid"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800",
              )}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "list"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800",
              )}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {faculty.departments.map((dept) => (
              <Link
                key={dept.id}
                href={`/dashboard/faculty/${faculty.code}/department/${dept.code}`}
              >
                <div className="group rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:border-primary/50 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{dept.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">
                        {dept.code}
                      </p>
                    </div>
                    <ChevronRight
                      size={18}
                      className="text-neutral-300 group-hover:text-primary transition-colors"
                    />
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold">
                        {dept.stats?.studentCount || 0}
                      </span>
                      <span className="text-[10px] uppercase text-muted-foreground">
                        Students
                      </span>
                    </div>
                    <div className="w-[1px] h-8 bg-neutral-200 dark:bg-neutral-800" />
                    <div className="flex flex-col">
                      <span className="text-lg font-bold">
                        {dept.stats?.courseCount || 0}
                      </span>
                      <span className="text-[10px] uppercase text-muted-foreground">
                        Courses
                      </span>
                    </div>
                    <div className="w-[1px] h-8 bg-neutral-200 dark:bg-neutral-800" />
                    <div className="flex flex-col">
                      <span className="text-lg font-bold">
                        {dept.stats?.staffCount || 0}
                      </span>
                      <span className="text-[10px] uppercase text-muted-foreground">
                        Staff
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {faculty.departments.length === 0 && (
              <div className="col-span-full py-12 text-center border-2 border-dashed rounded-2xl text-muted-foreground">
                No departments found in this faculty.
              </div>
            )}
          </div>
        ) : (
          <div className="border rounded-xl bg-white dark:bg-neutral-950 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-900 border-b">
                <tr>
                  <th className="px-6 py-3 font-medium">Department Name</th>
                  <th className="px-6 py-3 font-medium text-center font-mono">
                    Code
                  </th>
                  <th className="px-6 py-3 font-medium text-center">
                    Students
                  </th>
                  <th className="px-6 py-3 font-medium text-center">Staff</th>
                  <th className="px-6 py-3 font-medium text-center">Courses</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {faculty.departments.map((dept) => (
                  <tr
                    key={dept.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors group cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/dashboard/faculty/${faculty.code}/department/${dept.code}`,
                      )
                    }
                  >
                    <td className="px-6 py-4 font-medium">{dept.name}</td>
                    <td className="px-6 py-4 text-center text-xs font-mono">
                      {dept.code}
                    </td>
                    <td className="px-6 py-4 text-center font-bold">
                      {dept.stats?.studentCount || 0}
                    </td>
                    <td className="px-6 py-4 text-center font-bold">
                      {dept.stats?.staffCount || 0}
                    </td>
                    <td className="px-6 py-4 text-center font-bold">
                      {dept.stats?.courseCount || 0}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <ChevronRight
                        size={16}
                        className="text-neutral-300 group-hover:translate-x-1 transition-transform"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
