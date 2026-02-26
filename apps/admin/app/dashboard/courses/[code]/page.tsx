"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { graphqlClient } from "@/lib/graphql-client";
import {
  GET_COURSE_BY_CODE,
  GET_ELIGIBLE_COURSE_INSTRUCTORS,
  ASSIGN_INSTRUCTOR,
  BORROW_COURSE,
  UPDATE_COURSE,
} from "@/lib/graphql/course";
import { GET_DEPARTMENTS } from "@/lib/graphql/department";
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
  BookOpen,
  Users,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  Trash2,
  UserPlus,
  ArrowLeft,
  Share2,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";

export default function CourseDetailPage() {
  const { code } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Instructor Form State
  const [isInstructorPopoverOpen, setIsInstructorPopoverOpen] = useState(false);
  const [instructorFormState, setInstructorFormState] = useState<
    "idle" | "loading" | "success"
  >("idle");
  const [instructorFormData, setInstructorFormData] = useState({
    courseId: "",
    instructorId: "",
    isPrimary: false,
  });

  // Borrow Form State
  const [isBorrowPopoverOpen, setIsBorrowPopoverOpen] = useState(false);
  const [borrowFormState, setBorrowFormState] = useState<
    "idle" | "loading" | "success"
  >("idle");
  const [borrowFormData, setBorrowFormData] = useState({
    courseId: "",
    departmentId: "",
    courseType: "ELECTIVE",
    semester: "FIRST",
    level: 100,
  });

  // Edit Course State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    credits: 3,
    semester: "FIRST",
    academicYear: "",
    level: 100,
    isActive: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["course", code],
    queryFn: () => graphqlClient.request<any>(GET_COURSE_BY_CODE, { code }),
    enabled: !!code,
  });

  const course = data?.courseByCode;

  const { data: eligibleInstructorsData, isLoading: isLoadingEligibleInstructors } = useQuery({
    queryKey: ["eligibleCourseInstructors", course?.id],
    queryFn: () =>
      graphqlClient.request<{
        eligibleCourseInstructors: {
          id: string;
          staffNumber: string;
          user: { id: string; name: string; email?: string; image?: string | null };
        }[];
      }>(GET_ELIGIBLE_COURSE_INSTRUCTORS, { courseId: course!.id }),
    enabled: !!course?.id,
  });

  const { data: deptsData } = useQuery({
    queryKey: ["departments"],
    queryFn: () => graphqlClient.request<any>(GET_DEPARTMENTS),
  });

  const assignInstructorMutation = useMutation({
    mutationFn: (input: any) =>
      graphqlClient.request(ASSIGN_INSTRUCTOR, { input }),
    onSuccess: (data: any) => {
      setInstructorFormState("success");
      if (data.assignInstructor?.warning) {
        toast.warning(data.assignInstructor.warning, {
          description: "The instructor was assigned but check the curriculum.",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["course", code] });
      queryClient.invalidateQueries({ queryKey: ["eligibleCourseInstructors"] });
      setTimeout(() => {
        setIsInstructorPopoverOpen(false);
        setInstructorFormState("idle");
        setInstructorFormData({
          ...instructorFormData,
          instructorId: "",
          isPrimary: false,
        });
      }, 2000);
    },
    onError: () => setInstructorFormState("idle"),
  });

  const borrowCourseMutation = useMutation({
    mutationFn: (input: any) => graphqlClient.request(BORROW_COURSE, { input }),
    onSuccess: () => {
      setBorrowFormState("success");
      queryClient.invalidateQueries({ queryKey: ["course", code] });
      setTimeout(() => {
        setIsBorrowPopoverOpen(false);
        setBorrowFormState("idle");
        setBorrowFormData({
          ...borrowFormData,
          departmentId: "",
          courseType: "ELECTIVE",
        });
      }, 2000);
    },
    onError: () => setBorrowFormState("idle"),
  });

  const updateCourseMutation = useMutation({
    mutationFn: (input: { id: string; input: any }) =>
      graphqlClient.request(UPDATE_COURSE, input),
    onSuccess: () => {
      toast.success("Course updated successfully");
      queryClient.invalidateQueries({ queryKey: ["course", code] });
      setIsEditOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update course");
    },
  });

  const handleAssignInstructor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    setInstructorFormState("loading");
    assignInstructorMutation.mutate({
      ...instructorFormData,
      courseId: course.id,
    });
  };

  const handleBorrowCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    setBorrowFormState("loading");
    borrowCourseMutation.mutate({ ...borrowFormData, courseId: course.id });
  };

  const openEditDialog = () => {
    if (!course) return;
    setEditFormData({
      title: course.title,
      description: course.description ?? "",
      credits: course.credits ?? 3,
      semester: course.semester ?? "FIRST",
      academicYear: course.academicYear ?? "",
      level: course.level ?? 100,
      isActive: course.isActive ?? true,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;
    const input: any = {};
    if (editFormData.title !== course.title) input.title = editFormData.title;
    if (editFormData.description !== (course.description ?? "")) input.description = editFormData.description || undefined;
    if (editFormData.credits !== (course.credits ?? 3)) input.credits = editFormData.credits;
    if (editFormData.semester !== (course.semester ?? "FIRST")) input.semester = editFormData.semester;
    if (editFormData.academicYear !== (course.academicYear ?? "")) input.academicYear = editFormData.academicYear || undefined;
    if (editFormData.level !== (course.level ?? 100)) input.level = editFormData.level;
    if (editFormData.isActive !== (course.isActive ?? true)) input.isActive = editFormData.isActive;
    if (Object.keys(input).length === 0) {
      setIsEditOpen(false);
      return;
    }
    updateCourseMutation.mutate({ id: course.id, input });
  };

  if (isLoading) return <div className="p-8">Loading course details...</div>;
  if (!course) return <div className="p-8 text-center">Course not found.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
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
                {course.code}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-widest">
                {course.level} Level •{" "}
                {course.semester === "FIRST" ? "1st Semester" : "2nd Semester"}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {course.title}
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={openEditDialog}
          >
            <Pencil size={16} />
            Edit Course
          </Button>
          <PopoverForm
            title="Assign Instructor"
            open={isInstructorPopoverOpen}
            setOpen={setIsInstructorPopoverOpen}
            width="360px"
            height="320px"
            showCloseButton={instructorFormState !== "success"}
            showSuccess={instructorFormState === "success"}
            openChild={
              <form onSubmit={handleAssignInstructor} className="space-y-4 p-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Select Instructor
                  </label>
                  <select
                    value={instructorFormData.instructorId}
                    onChange={(e) =>
                      setInstructorFormData({
                        ...instructorFormData,
                        instructorId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                    required
                    disabled={isLoadingEligibleInstructors}
                  >
                    <option value="">
                      {isLoadingEligibleInstructors
                        ? "Loading staff..."
                        : "Choose staff in this department"}
                    </option>
                    {eligibleInstructorsData?.eligibleCourseInstructors?.map((staff) => {
                      const alreadyAssigned =
                        course?.instructors?.some(
                          (ci: { instructorId: string }) => ci.instructorId === staff.id
                        );
                      return (
                        <option key={staff.id} value={staff.id}>
                          {staff.user.name} ({staff.staffNumber})
                          {alreadyAssigned ? " — Already assigned to this course" : ""}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Only staff in this course&apos;s department are listed.
                  </p>
                </div>
                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="isPrimary"
                    checked={instructorFormData.isPrimary}
                    onChange={(e) =>
                      setInstructorFormData({
                        ...instructorFormData,
                        isPrimary: e.target.checked,
                      })
                    }
                    className="rounded border-neutral-300"
                  />
                  <label htmlFor="isPrimary" className="text-sm font-medium">
                    Set as Primary Lecturer
                  </label>
                </div>
                <div className="relative flex h-12 items-center">
                  <PopoverFormSeparator />
                  <PopoverFormButton
                    loading={instructorFormState === "loading"}
                    text="Assign"
                  />
                </div>
              </form>
            }
            successChild={
              <PopoverFormSuccess
                title="Instructor Assigned"
                description="The staff member has been assigned to this course."
              />
            }
          />

          <PopoverForm
            title="Offer in Dept"
            open={isBorrowPopoverOpen}
            setOpen={setIsBorrowPopoverOpen}
            width="360px"
            height="420px"
            showCloseButton={borrowFormState !== "success"}
            showSuccess={borrowFormState === "success"}
            openChild={
              <form onSubmit={handleBorrowCourse} className="space-y-4 p-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Select Department
                  </label>
                  <select
                    value={borrowFormData.departmentId}
                    onChange={(e) =>
                      setBorrowFormData({
                        ...borrowFormData,
                        departmentId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                    required
                  >
                    <option value="">Choose Dept</option>
                    {deptsData?.departments
                      .filter((d: any) => d.id !== course.departmentId)
                      .map((dept: any) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Course Type
                  </label>
                  <select
                    value={borrowFormData.courseType}
                    onChange={(e) =>
                      setBorrowFormData({
                        ...borrowFormData,
                        courseType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                  >
                    <option value="COMPULSORY">Compulsory</option>
                    <option value="ELECTIVE">Elective</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Semester
                    </label>
                    <select
                      value={borrowFormData.semester}
                      onChange={(e) =>
                        setBorrowFormData({
                          ...borrowFormData,
                          semester: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md bg-transparent"
                    >
                      <option value="FIRST">1st Semester</option>
                      <option value="SECOND">2nd Semester</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Level
                    </label>
                    <select
                      value={borrowFormData.level}
                      onChange={(e) =>
                        setBorrowFormData({
                          ...borrowFormData,
                          level: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md bg-transparent"
                    >
                      {[100, 200, 300, 400, 500, 600].map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="relative flex h-12 items-center">
                  <PopoverFormSeparator />
                  <PopoverFormButton
                    loading={borrowFormState === "loading"}
                    text="Add Offering"
                  />
                </div>
              </form>
            }
            successChild={
              <PopoverFormSuccess
                title="Course Offered"
                description="The course is now available in the selected department."
              />
            }
          />
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, title: e.target.value })
                }
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-credits">Credits</Label>
                <Input
                  id="edit-credits"
                  type="number"
                  min={1}
                  value={editFormData.credits}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      credits: parseInt(e.target.value) || 3,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-level">Level</Label>
                <select
                  id="edit-level"
                  value={editFormData.level}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      level: parseInt(e.target.value),
                    })
                  }
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  {[100, 200, 300, 400, 500, 600].map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-semester">Semester</Label>
                <select
                  id="edit-semester"
                  value={editFormData.semester}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, semester: e.target.value })
                  }
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="FIRST">First</option>
                  <option value="SECOND">Second</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-academicYear">Academic Year</Label>
                <Input
                  id="edit-academicYear"
                  value={editFormData.academicYear}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      academicYear: e.target.value,
                    })
                  }
                  placeholder="e.g. 2024/2025"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={editFormData.isActive}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, isActive: e.target.checked })
                }
                className="rounded border-input"
              />
              <Label htmlFor="edit-isActive">Active</Label>
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
                disabled={updateCourseMutation.isPending}
              >
                {updateCourseMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Layers size={20} className="text-primary" />
              Course Overview
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {course.description || "No description provided for this course."}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                  Credits
                </span>
                <p className="font-semibold">{course.credits} Units</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                  Department
                </span>
                <p className="font-semibold">{course.department.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                  Status
                </span>
                <div className="flex items-center gap-1.5 text-green-500">
                  <CheckCircle2 size={14} />
                  <span className="font-semibold text-sm">Active</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                  Year
                </span>
                <p className="font-semibold">{course.academicYear}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 px-2">
              <Users size={20} className="text-primary" />
              Instructional Team
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {course.instructors.map((ci: any) => (
                <div
                  key={ci.instructorId}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 group"
                >
                  <div className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-500">
                    {ci.instructor.user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold truncate">
                        {ci.instructor.user.name}
                      </p>
                      {ci.isPrimary && (
                        <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ci.instructor.staffNumber}
                    </p>
                  </div>
                </div>
              ))}
              {course.instructors.length === 0 && (
                <div className="col-span-full py-8 text-center border-2 border-dashed rounded-2xl text-muted-foreground italic">
                  No instructors assigned yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side Panel - Offerings */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Share2 size={18} className="text-primary" />
              Dept Distribution
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div>
                  <p className="text-xs font-bold text-primary uppercase mb-0.5">
                    Primary Department
                  </p>
                  <p className="text-sm font-semibold">
                    {course.department.name}
                  </p>
                </div>
                <CheckCircle2 size={16} className="text-primary" />
              </div>

              {course.departmentOfferings.map((offering: any) => (
                <div
                  key={offering.departmentId}
                  className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 dark:border-neutral-800"
                >
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-0.5">
                      {offering.courseType}
                    </p>
                    <p className="text-sm font-semibold">
                      {offering.department.name}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Lvl {offering.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
