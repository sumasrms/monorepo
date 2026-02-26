"use client";

import React, { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { UPDATE_STAFF } from "@/lib/graphql/staff";
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
import { toast } from "sonner";

interface Staff {
  id: string;
  staffNumber: string;
  institutionalRank: string;
  designation?: string;
  dateOfBirth: string;
  employmentDate: string;
  employmentType: string;
  departmentId?: string;
  user: {
    id: string;
    name: string;
    email: string;
    gender?: string;
  };
}

interface EditStaffDialogProps {
  staff: Staff | null;
  isOpen: boolean;
  onClose: () => void;
  faculties: { id: string; name: string }[];
  departments: { id: string; name: string }[];
}

function formatDateForInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toISOString().split("T")[0];
}

export function EditStaffDialog({
  staff,
  isOpen,
  onClose,
  faculties,
  departments,
}: EditStaffDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = React.useState({
    name: "",
    institutionalRank: "",
    designation: "",
    dateOfBirth: "",
    employmentDate: "",
    gender: "MALE",
    employmentType: "FULL_TIME",
    departmentId: "",
    facultyId: "",
  });

  useEffect(() => {
    if (staff && isOpen) {
      setFormData({
        name: staff.user.name,
        institutionalRank: staff.institutionalRank,
        designation: staff.designation ?? "",
        dateOfBirth: formatDateForInput(staff.dateOfBirth),
        employmentDate: formatDateForInput(staff.employmentDate),
        gender: (staff.user.gender as string) ?? "MALE",
        employmentType: staff.employmentType ?? "FULL_TIME",
        departmentId: staff.departmentId ?? "",
        facultyId: "",
      });
    }
  }, [staff, isOpen]);

  const updateMutation = useMutation({
    mutationFn: (input: { id: string; input: any }) =>
      graphqlClient.request(UPDATE_STAFF, input),
    onSuccess: () => {
      toast.success("Staff updated successfully");
      queryClient.invalidateQueries({ queryKey: ["staffs"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update staff");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) return;
    const input: any = {};
    if (formData.name !== staff.user.name) input.name = formData.name;
    if (formData.institutionalRank !== staff.institutionalRank)
      input.institutionalRank = formData.institutionalRank;
    if (formData.designation !== (staff.designation ?? ""))
      input.designation = formData.designation || undefined;
    if (formData.dateOfBirth !== formatDateForInput(staff.dateOfBirth))
      input.dateOfBirth = new Date(formData.dateOfBirth).toISOString();
    if (formData.employmentDate !== formatDateForInput(staff.employmentDate))
      input.employmentDate = new Date(formData.employmentDate).toISOString();
    if (formData.gender !== (staff.user.gender ?? "MALE"))
      input.gender = formData.gender;
    if (formData.employmentType !== (staff.employmentType ?? "FULL_TIME"))
      input.employmentType = formData.employmentType;
    if (formData.departmentId !== (staff.departmentId ?? ""))
      input.departmentId = formData.departmentId || undefined;
    if (formData.facultyId) input.facultyId = formData.facultyId;
    if (Object.keys(input).length === 0) {
      onClose();
      return;
    }
    updateMutation.mutate({ id: staff.id, input });
  };

  if (!staff) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Staff</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Staff Number</Label>
            <Input value={staff.staffNumber} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-rank">Rank</Label>
              <select
                id="edit-rank"
                value={formData.institutionalRank}
                onChange={(e) =>
                  setFormData({ ...formData, institutionalRank: e.target.value })
                }
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
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
            <div className="space-y-2">
              <Label htmlFor="edit-designation">Designation</Label>
              <select
                id="edit-designation"
                value={formData.designation}
                onChange={(e) =>
                  setFormData({ ...formData, designation: e.target.value })
                }
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
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
            <div className="space-y-2">
              <Label htmlFor="edit-dob">Date of Birth</Label>
              <Input
                id="edit-dob"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-employment">Employment Date</Label>
              <Input
                id="edit-employment"
                type="date"
                value={formData.employmentDate}
                onChange={(e) =>
                  setFormData({ ...formData, employmentDate: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-gender">Gender</Label>
              <select
                id="edit-gender"
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-employmentType">Employment</Label>
              <select
                id="edit-employmentType"
                value={formData.employmentType}
                onChange={(e) =>
                  setFormData({ ...formData, employmentType: e.target.value })
                }
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="VISITING">Visiting</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-faculty">Faculty</Label>
              <select
                id="edit-faculty"
                value={formData.facultyId}
                onChange={(e) =>
                  setFormData({ ...formData, facultyId: e.target.value })
                }
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Select Faculty</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-department">Department</Label>
              <select
                id="edit-department"
                value={formData.departmentId}
                onChange={(e) =>
                  setFormData({ ...formData, departmentId: e.target.value })
                }
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
