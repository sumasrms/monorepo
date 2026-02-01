"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_COURSES, CREATE_COURSE } from "@/lib/graphql/course";
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
  Plus,
  Search,
  Filter,
  MoreVertical,
  GraduationCap,
  Building2,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";

interface Course {
  id: string;
  code: string;
  title: string;
  credits: number;
  semester: string;
  level: number;
  department: {
    id: string;
    name: string;
  };
}

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function CoursesPage() {
  const queryClient = useQueryClient();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [formState, setFormState] = useState<"idle" | "loading" | "success">(
    "idle",
  );
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    credits: 3,
    departmentId: "",
    semester: "FIRST",
    academicYear: "2023/2024",
    level: 100,
  });

  const { data: coursesData, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["courses"],
    queryFn: () => graphqlClient.request<{ courses: Course[] }>(GET_COURSES),
  });

  const { data: deptsData } = useQuery({
    queryKey: ["departments"],
    queryFn: () =>
      graphqlClient.request<{ departments: Department[] }>(GET_DEPARTMENTS),
  });

  const createMutation = useMutation({
    mutationFn: (input: any) => graphqlClient.request(CREATE_COURSE, { input }),
    onSuccess: () => {
      setFormState("success");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setTimeout(() => {
        setIsPopoverOpen(false);
        setFormState("idle");
        setFormData({
          code: "",
          title: "",
          description: "",
          credits: 3,
          departmentId: "",
          semester: "FIRST",
          academicYear: "2023/2024",
          level: 100,
        });
      }, 2000);
    },
    onError: () => setFormState("idle"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("loading");
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Course Management
          </h1>
          <p className="text-muted-foreground">
            Manage university courses, assignments, and curriculum.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PopoverForm
            title="Create Course"
            open={isPopoverOpen}
            setOpen={setIsPopoverOpen}
            width="400px"
            height="580px"
            showCloseButton={formState !== "success"}
            showSuccess={formState === "success"}
            openChild={
              <form onSubmit={handleSubmit} className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Course Code
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md bg-transparent"
                      placeholder="e.g. CSC 101"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Credits/Units
                    </label>
                    <input
                      type="number"
                      value={formData.credits}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          credits: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md bg-transparent"
                      min={1}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Course Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                    placeholder="e.g. Introduction to Computing"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Primary Department
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) =>
                      setFormData({ ...formData, departmentId: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                    required
                  >
                    <option value="">Select Department</option>
                    {deptsData?.departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Semester
                    </label>
                    <select
                      value={formData.semester}
                      onChange={(e) =>
                        setFormData({ ...formData, semester: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md bg-transparent"
                      required
                    >
                      <option value="FIRST">First Semester</option>
                      <option value="SECOND">Second Semester</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Level
                    </label>
                    <select
                      value={formData.level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          level: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md bg-transparent"
                      required
                    >
                      {[100, 200, 300, 400, 500, 600].map((l) => (
                        <option key={l} value={l}>
                          {l} Level
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-transparent resize-none"
                    rows={3}
                    placeholder="Optional course overview..."
                  />
                </div>

                <div className="relative flex h-12 items-center">
                  <PopoverFormSeparator />
                  <div className="absolute left-0 top-0 -translate-x-[1.5px] -translate-y-1/2">
                    <PopoverFormCutOutLeftIcon />
                  </div>
                  <div className="absolute right-0 top-0 translate-x-[1.5px] -translate-y-1/2 rotate-180">
                    <PopoverFormCutOutRightIcon />
                  </div>
                  <PopoverFormButton
                    loading={formState === "loading"}
                    text="Create Course"
                  />
                </div>
              </form>
            }
            successChild={
              <PopoverFormSuccess
                title="Course Created"
                description="The new course has been successfully added to the curriculum."
              />
            }
          />
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Search courses by code or title..."
            className="w-full pl-10 pr-4 py-2 border rounded-xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 shrink-0">
            <Filter size={18} />
            Filter
          </Button>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingCourses
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-48 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"
              />
            ))
          : coursesData?.courses.map((course) => (
              <Link key={course.id} href={`/dashboard/courses/${course.code}`}>
                <div className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BookOpen size={24} />
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-primary block">
                        {course.code}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {course.level} Level
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg mb-1 leading-tight group-hover:text-primary transition-colors line-clamp-1">
                    {course.title}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Building2 size={14} />
                    <span className="line-clamp-1">
                      {course.department.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex gap-3">
                      <div className="flex items-center gap-1">
                        <GraduationCap
                          size={14}
                          className="text-muted-foreground"
                        />
                        <span className="text-xs font-medium">
                          {course.credits} Units
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-muted-foreground" />
                        <span className="text-xs font-medium">
                          {course.semester === "FIRST" ? "1st Sem" : "2nd Sem"}
                        </span>
                      </div>
                    </div>
                    <div className="h-8 w-8 flex items-center justify-center rounded-full bg-neutral-50 dark:bg-neutral-800 text-neutral-400 group-hover:bg-primary group-hover:text-white transition-all">
                      <Plus size={16} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
      </div>

      {coursesData?.courses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="h-16 w-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
            <BookOpen size={32} className="text-neutral-400" />
          </div>
          <h2 className="text-xl font-bold mb-1">No courses found</h2>
          <p className="text-muted-foreground">
            Start by creating your first university course.
          </p>
        </div>
      )}
    </div>
  );
}
