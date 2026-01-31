"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_FACULTIES, CREATE_FACULTY } from "@/lib/graphql/faculty";
import {
  PopoverForm,
  PopoverFormButton,
  PopoverFormCutOutLeftIcon,
  PopoverFormCutOutRightIcon,
  PopoverFormSeparator,
  PopoverFormSuccess,
} from "@workspace/ui/components/popover-form";
import { Users, GraduationCap, BookOpen, Building2 } from "lucide-react";
import Link from "next/link";

interface FacultyStats {
  studentCount: number;
  staffCount: number;
  courseCount: number;
  departmentCount: number;
}

interface CreateFacultyInput {
  name: string;
  code: string;
  description?: string;
  deanId?: string;
}

interface Faculty {
  id: string;
  name: string;
  code: string;
  description?: string;
  deanId?: string;
  createdAt: string;
  updatedAt: string;
  stats?: FacultyStats;
}

export default function FacultyPage() {
  const queryClient = useQueryClient();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [formState, setFormState] = useState<"idle" | "loading" | "success">(
    "idle",
  );
  const [formData, setFormData] = useState<CreateFacultyInput>({
    name: "",
    code: "",
    description: "",
    deanId: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["faculties"],
    queryFn: () =>
      graphqlClient.request<{ faculties: Faculty[] }>(GET_FACULTIES),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateFacultyInput) =>
      graphqlClient.request(CREATE_FACULTY, { input }),
    onSuccess: () => {
      setFormState("success");
      queryClient.invalidateQueries({ queryKey: ["faculties"] });
      setTimeout(() => {
        setIsPopoverOpen(false);
        setFormState("idle");
        setFormData({ name: "", code: "", description: "", deanId: "" });
      }, 2000);
    },
    onError: () => {
      setFormState("idle");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("loading");
    // Only send deanId if it's not empty
    const payload = { ...formData };
    if (!payload.deanId) delete (payload as any).deanId;
    createMutation.mutate(payload);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faculties</h1>
          <p className="text-muted-foreground">
            Manage and view all academic faculties.
          </p>
        </div>
        <div className="flex gap-2 relative">
          <PopoverForm
            title="Create Faculty"
            open={isPopoverOpen}
            setOpen={setIsPopoverOpen}
            width="364px"
            height="440px"
            showCloseButton={formState !== "success"}
            showSuccess={formState === "success"}
            openChild={
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="px-4 pt-4">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-black"
                    required
                  />
                </div>
                <div className="px-4 flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Code (Slug)
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-black"
                      required
                      placeholder="e.g. science-tech"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Dean ID
                    </label>
                    <input
                      type="text"
                      value={formData.deanId}
                      onChange={(e) =>
                        setFormData({ ...formData, deanId: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-black"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="px-4">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-black"
                    rows={2}
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
                    loading={formState === "loading"}
                    text="Create"
                  />
                </div>
              </form>
            }
            successChild={
              <PopoverFormSuccess
                title="Faculty Created"
                description="The new faculty has been successfully added to the system."
              />
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.faculties.map((faculty) => (
          <Link key={faculty.id} href={`/dashboard/faculty/${faculty.code}`}>
            <div className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Building2 size={24} />
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-semibold">{faculty.name}</h3>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    {faculty.code}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
                {faculty.description ||
                  "No description available for this faculty."}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-blue-500" />
                  <span className="text-sm font-medium">
                    {faculty.stats?.studentCount || 0} Students
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-green-500" />
                  <span className="text-sm font-medium">
                    {faculty.stats?.staffCount || 0} Staffs
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-purple-500" />
                  <span className="text-sm font-medium">
                    {faculty.stats?.courseCount || 0} Courses
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap size={16} className="text-orange-500" />
                  <span className="text-sm font-medium">
                    {faculty.stats?.departmentCount || 0} Depts
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
