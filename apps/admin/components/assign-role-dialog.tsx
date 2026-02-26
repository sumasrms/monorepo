"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_STAFFS } from "@/lib/graphql/staff";
import { GET_ELIGIBLE_HOD_STAFF } from "@/lib/graphql/department";
import { GET_ELIGIBLE_DEAN_STAFF } from "@/lib/graphql/faculty";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { toast } from "sonner";

interface AssignRoleDialogProps {
  title: string;
  description: string;
  roleName: string; // e.g., "Dean" or "HOD"
  /** When assigning HOD, pass the department id to list only HOD-role staff in this department with Assigned/Available tags */
  departmentId?: string | null;
  /** When assigning Dean, pass the faculty id to list only Dean-role staff in this faculty with Assigned/Available tags */
  facultyId?: string | null;
  currentAssignee?: {
    id: string;
    name: string;
    image?: string | null;
  } | null;
  trigger?: React.ReactNode;
  onAssign: (userId: string) => Promise<void>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type StaffOption = {
  value: string;
  label: string;
  email: string;
  image?: string | null;
  staffNumber?: string;
  tag?: "Available" | string; // "Assigned to {name}" or "Available"
};

export function AssignRoleDialog({
  title,
  description,
  roleName,
  departmentId,
  facultyId,
  currentAssignee,
  trigger,
  onAssign,
  isOpen,
  onOpenChange,
}: AssignRoleDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(currentAssignee?.id || "");
  const [isAssigning, setIsAssigning] = React.useState(false);
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  const isDialogOpen = isOpen !== undefined ? isOpen : open;
  const setDialogOpen = onOpenChange || setOpen;

  const useHodEligible = roleName === "HOD" && !!departmentId;
  const useDeanEligible = roleName === "Dean" && !!facultyId;
  const useEligibleList = useHodEligible || useDeanEligible;

  const { data: staffData, isLoading: isLoadingStaffs } = useQuery({
    queryKey: ["staffs"],
    queryFn: () => graphqlClient.request<{ staffs: { user: { id: string; name: string; email: string; image?: string | null }; staffNumber: string }[] }>(GET_STAFFS),
    enabled: !useEligibleList,
  });

  const { data: eligibleHodData, isLoading: isLoadingHod } = useQuery({
    queryKey: ["eligibleHodStaff", departmentId],
    queryFn: () =>
      graphqlClient.request<{
        eligibleHodStaff: {
          id: string;
          staffNumber: string;
          user: {
            id: string;
            name: string;
            email: string;
            image?: string | null;
            role?: string;
            managedDepartment?: { id: string; name: string; code: string } | null;
          };
        }[];
      }>(GET_ELIGIBLE_HOD_STAFF, { departmentId: departmentId! }),
    enabled: useHodEligible && !!departmentId,
  });

  const { data: eligibleDeanData, isLoading: isLoadingDean } = useQuery({
    queryKey: ["eligibleDeanStaff", facultyId],
    queryFn: () =>
      graphqlClient.request<{
        eligibleDeanStaff: {
          id: string;
          staffNumber: string;
          user: {
            id: string;
            name: string;
            email: string;
            image?: string | null;
            role?: string;
            managedFaculty?: { id: string; name: string; code: string } | null;
          };
        }[];
      }>(GET_ELIGIBLE_DEAN_STAFF, { facultyId: facultyId! }),
    enabled: useDeanEligible && !!facultyId,
  });

  const staffs = React.useMemo((): StaffOption[] => {
    if (useHodEligible && eligibleHodData?.eligibleHodStaff) {
      return eligibleHodData.eligibleHodStaff.map((s) => ({
        value: s.user.id,
        label: s.user.name,
        email: s.user.email,
        image: s.user.image,
        staffNumber: s.staffNumber,
        tag: s.user.managedDepartment
          ? `Assigned to ${s.user.managedDepartment.name}`
          : "Available",
      }));
    }
    if (useDeanEligible && eligibleDeanData?.eligibleDeanStaff) {
      return eligibleDeanData.eligibleDeanStaff.map((s) => ({
        value: s.user.id,
        label: s.user.name,
        email: s.user.email,
        image: s.user.image,
        staffNumber: s.staffNumber,
        tag: s.user.managedFaculty
          ? `Assigned to ${s.user.managedFaculty.name}`
          : "Available",
      }));
    }
    return (
      staffData?.staffs?.map((s) => ({
        value: s.user.id,
        label: s.user.name,
        email: s.user.email,
        image: s.user.image,
        staffNumber: s.staffNumber,
      })) || []
    );
  }, [useHodEligible, useDeanEligible, staffData, eligibleHodData, eligibleDeanData]);

  const isLoading = useHodEligible ? isLoadingHod : useDeanEligible ? isLoadingDean : isLoadingStaffs;

  const handleAssign = async () => {
    if (!value) return;
    try {
      setIsAssigning(true);
      await onAssign(value);
      setDialogOpen(false);
    } catch (error) {
      const errorMessage =
        (error as any)?.response?.errors?.[0]?.message ||
        (error as any)?.message ||
        "Failed to assign role.";
      toast.error(errorMessage);
    } finally {
      setIsAssigning(false);
    }
  };

  const selectedStaff: StaffOption | null =
    staffs.find((s) => s.value === value) ||
    (currentAssignee
      ? {
          value: currentAssignee.id,
          label: currentAssignee.name,
          email: "",
          image: currentAssignee.image,
        }
      : null);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Assign {roleName}</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Staff</label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-full justify-between h-auto py-3"
                >
                  {selectedStaff ? (
                    <div className="flex items-center gap-3 text-left">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={selectedStaff.image || ""} />
                        <AvatarFallback>
                          {selectedStaff.label.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium leading-none">
                          {selectedStaff.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {selectedStaff.staffNumber || selectedStaff.email}
                        </span>
                        {selectedStaff.tag && (
                          <Badge
                            variant={selectedStaff.tag === "Available" ? "default" : "secondary"}
                            className="mt-1 w-fit text-[10px]"
                          >
                            {selectedStaff.tag}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    `Select ${roleName}...`
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder={`Search staff...`} />
                  <CommandList>
                    {isLoading ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        Loading staff...
                      </div>
                    ) : (
                      <>
                        <CommandEmpty>
                          {useHodEligible
                            ? "No staff with HOD role in this department. Assign the HOD role to a staff member in this department first."
                            : useDeanEligible
                              ? "No staff with Dean role in this faculty. Assign the Dean role to a staff member in this faculty first."
                              : "No staff found."}
                        </CommandEmpty>
                        <CommandGroup>
                          {staffs.map((staff) => (
                        <CommandItem
                          key={staff.value}
                          value={staff.label}
                          onSelect={() => {
                            setValue(staff.value);
                            setPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              value === staff.value
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={staff.image || ""} />
                              <AvatarFallback>
                                {staff.label.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="font-medium">{staff.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {staff.staffNumber} • {staff.email}
                              </span>
                              {staff.tag && (
                                <Badge
                                  variant={
                                    staff.tag === "Available"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="mt-1 w-fit text-[10px]"
                                >
                                  {staff.tag}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {currentAssignee && currentAssignee.id !== value && (
            <div className="rounded-lg bg-orange-50 border border-orange-100 p-3 text-sm text-orange-800 dark:bg-orange-950/20 dark:border-orange-900 dark:text-orange-300">
              <p>
                <span className="font-semibold">Note:</span> You are replacing{" "}
                <span className="font-bold">{currentAssignee.name}</span> as the
                current {roleName}.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!value || isAssigning || currentAssignee?.id === value}
          >
            {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
