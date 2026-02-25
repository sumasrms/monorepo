import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { useDepartmentStaff } from "@/features/hod/hooks/useDepartmentStaff";
import { useAssignCourseToStaff } from "@/features/hod/hooks/useAssignCourseToStaff";
import { toast } from "sonner";

interface AssignCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  departmentId: string;
}

export function AssignCourseDialog({ open, onOpenChange, courseId, departmentId }: AssignCourseDialogProps) {
  const { data: staff, isLoading } = useDepartmentStaff(departmentId);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const assignMutation = useAssignCourseToStaff();

  const handleAssign = async () => {
    if (!selectedStaffId) return;
    try {
      await assignMutation.mutateAsync({ courseId, staffId: selectedStaffId, isPrimary });
      toast.success("Course assigned successfully");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || "Failed to assign course");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Assign Course to Staff</DialogTitle>
        <div className="space-y-4">
          <select
            className="w-full border rounded p-2"
            value={selectedStaffId}
            onChange={e => setSelectedStaffId(e.target.value)}
            disabled={isLoading}
          >
            <option value="">Select staff</option>
            {staff?.map((s: { id: string; user: { name: string }; institutionalRank: string }) => (
              <option key={s.id} value={s.id}>
                {s.user.name} ({s.institutionalRank})
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} />
            Set as primary instructor
          </label>
        </div>
        <DialogFooter>
          <Button onClick={handleAssign} disabled={!selectedStaffId || assignMutation.status === "pending"}>
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
