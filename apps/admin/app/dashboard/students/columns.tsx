"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { format } from "date-fns";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

export type Student = {
  id: string;
  matricNumber: string;
  admissionDate: string;
  level: number;
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  department?: {
    name: string;
  };
};

export const columns: ColumnDef<Student>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "user.name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Student
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.image || undefined} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "matricNumber",
    header: "Matric No",
  },
  {
    accessorKey: "department.name",
    header: "Department",
    cell: ({ row }) => row.original.department?.name || "N/A",
  },
  {
    accessorKey: "level",
    header: "Level",
    cell: ({ row }) => `${row.original.level} L`,
  },
  {
    accessorKey: "admissionDate",
    header: "Admission Date",
    cell: ({ row }) => {
      return format(new Date(row.original.admissionDate), "MMM d, yyyy");
    },
  },
];
