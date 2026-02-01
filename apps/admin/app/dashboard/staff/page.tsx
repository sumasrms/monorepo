"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_STAFFS, CREATE_STAFF } from "@/lib/graphql/staff";
import { GET_FACULTIES } from "@/lib/graphql/faculty";
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
  Users,
  Plus,
  Search,
  Filter,
  UserPlus,
  Upload,
  Building2,
  Mail,
  Award,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";
import StaffBulkUpload from "./bulk-upload";

interface Staff {
  id: string;
  staffNumber: string;
  institutionalRank: string;
  designation?: string;
  dateOfBirth: string;
  employmentDate: string;
  gender: string;
  employmentType: string;
  facultyId?: string;
  departmentId?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [formState, setFormState] = useState<"idle" | "loading" | "success">(
    "idle",
  );
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    staffNumber: "",
    institutionalRank: "",
    designation: "",
    dateOfBirth: "",
    employmentDate: new Date().toISOString().split("T")[0],
    gender: "MALE",
    employmentType: "FULL_TIME",
    facultyId: "",
    departmentId: "",
    credentialKey: "",
  });

  const { data: staffData, isLoading: isLoadingStaff } = useQuery({
    queryKey: ["staffs"],
    queryFn: () => graphqlClient.request<{ staffs: Staff[] }>(GET_STAFFS),
  });

  const { data: facultiesData } = useQuery({
    queryKey: ["faculties"],
    queryFn: () => graphqlClient.request<{ faculties: any[] }>(GET_FACULTIES),
  });

  const { data: deptsData } = useQuery({
    queryKey: ["departments"],
    queryFn: () =>
      graphqlClient.request<{ departments: any[] }>(GET_DEPARTMENTS),
  });

  const createMutation = useMutation({
    mutationFn: (input: any) => graphqlClient.request(CREATE_STAFF, { input }),
    onSuccess: () => {
      setFormState("success");
      queryClient.invalidateQueries({ queryKey: ["staffs"] });
      setTimeout(() => {
        setIsPopoverOpen(false);
        setFormState("idle");
        setFormData({
          name: "",
          email: "",
          staffNumber: "",
          institutionalRank: "",
          designation: "",
          dateOfBirth: "",
          employmentDate: new Date().toISOString().split("T")[0],
          gender: "MALE",
          employmentType: "FULL_TIME",
          facultyId: "",
          departmentId: "",
          credentialKey: "",
        });
      }, 2000);
    },
    onError: () => setFormState("idle"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("loading");
    createMutation.mutate({
      ...formData,
      dateOfBirth: new Date(formData.dateOfBirth || "").toISOString(),
      employmentDate: new Date(formData.employmentDate || "").toISOString(),
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Staff Management
          </h1>
          <p className="text-muted-foreground">
            Onboard and manage teaching and non-teaching staff members.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsBulkUploadOpen(true)}
          >
            <Upload size={18} />
            Bulk Upload
          </Button>

          <PopoverForm
            title="Onboard Staff"
            open={isPopoverOpen}
            setOpen={setIsPopoverOpen}
            width="450px"
            height="700px"
            showCloseButton={formState !== "success"}
            showSuccess={formState === "success"}
            openChild={
              <form
                onSubmit={handleSubmit}
                className="space-y-4 p-4 overflow-y-auto max-h-[550px]"
              >
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md bg-transparent"
                      placeholder="Official email"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Staff ID Number
                    </label>
                    <input
                      type="text"
                      value={formData.staffNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          staffNumber: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md bg-transparent"
                      placeholder="Unique ID"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Rank
                    </label>
                    <select
                      value={formData.institutionalRank}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          institutionalRank: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md bg-transparent"
                      required
                    >
                      <option value="">Select Rank</option>
                      {[
                        "Professor",
                        "Associate Professor",
                        "Senior Lecturer",
                        "Lecturer I",
                        "Lecturer II",
                        "Assistant Lecturer",
                        "Graduate Assistant",
                      ].map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Designation
                    </label>
                    <select
                      value={formData.designation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          designation: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md bg-transparent"
                    >
                      <option value="">Select Designation</option>
                      {[
                        "Academic Lecturer",
                        "HOD",
                        "Dean",
                        "Senate Member",
                        "Registry Staff",
                      ].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dateOfBirth: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md bg-transparent"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      1st Appointment
                    </label>
                    <input
                      type="date"
                      value={formData.employmentDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          employmentDate: e.target.value,
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
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md bg-transparent"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Employment
                    </label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          employmentType: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md bg-transparent"
                    >
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="VISITING">Visiting</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Faculty
                    </label>
                    <select
                      value={formData.facultyId}
                      onChange={(e) =>
                        setFormData({ ...formData, facultyId: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md bg-transparent"
                    >
                      <option value="">Select Faculty</option>
                      {facultiesData?.faculties.map((f: any) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Department
                    </label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          departmentId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md bg-transparent"
                    >
                      <option value="">Select Department</option>
                      {deptsData?.departments.map((d: any) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    Initial Password (Key)
                  </label>
                  <input
                    type="text"
                    value={formData.credentialKey}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        credentialKey: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                    placeholder="Leave blank for random"
                  />
                </div>

                <div className="relative flex h-12 items-center mt-6">
                  <PopoverFormSeparator />
                  <div className="absolute left-0 top-0 -translate-x-[1.5px] -translate-y-1/2">
                    <PopoverFormCutOutLeftIcon />
                  </div>
                  <div className="absolute right-0 top-0 translate-x-[1.5px] -translate-y-1/2 rotate-180">
                    <PopoverFormCutOutRightIcon />
                  </div>
                  <PopoverFormButton
                    loading={formState === "loading"}
                    text="Onboard Staff"
                  />
                </div>
              </form>
            }
            successChild={
              <PopoverFormSuccess
                title="Staff Onboarded"
                description="The staff member has been successfully created and linked."
              />
            }
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Search staff by name, email or ID..."
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingStaff
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-48 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"
              />
            ))
          : staffData?.staffs.map((staff) => (
              <div
                key={staff.id}
                className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                    <Users size={24} />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-blue-500 block">
                      {staff.staffNumber}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {staff.institutionalRank}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-lg mb-1 leading-tight group-hover:text-blue-500 transition-colors line-clamp-1">
                  {staff.user.name}
                </h3>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Mail size={14} />
                  <span className="line-clamp-1">{staff.user.email}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex gap-3">
                    <div className="flex items-center gap-1">
                      <Award size={14} className="text-muted-foreground" />
                      <span className="text-xs font-medium">
                        {staff.designation || "Lecturer"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} className="text-muted-foreground" />
                      <span className="text-xs font-medium">
                        Joined {new Date(staff.employmentDate).getFullYear()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {staffData?.staffs.length === 0 && !isLoadingStaff && (
        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="h-16 w-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
            <UserPlus size={32} className="text-neutral-400" />
          </div>
          <h2 className="text-xl font-bold mb-1">No staff found</h2>
          <p className="text-muted-foreground">
            Start by onboarding your first staff member.
          </p>
        </div>
      )}

      {isBulkUploadOpen && (
        <StaffBulkUpload
          isOpen={isBulkUploadOpen}
          onClose={() => setIsBulkUploadOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["staffs"] });
          }}
        />
      )}
    </div>
  );
}
