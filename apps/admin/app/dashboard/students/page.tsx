"use client";

import React, { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Plus, UserPlus } from "lucide-react";
import StudentBulkUpload from "./bulk-upload";
import AddStudentDialog from "./add-student-dialog";
import { columns } from "./columns";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/data-table";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_STUDENTS } from "@/lib/graphql/students";

interface Student {
  id: string;
  matricNumber: string;
  admissionDate: string;
  level: number;
  user: {
    name: string;
    email: string;
    image: string | null;
  };
  department: {
    name: string;
  };
}

interface GetStudentsQuery {
  students: Student[];
}

export default function StudentsPage() {
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["students"],
    queryFn: async () => graphqlClient.request<GetStudentsQuery>(GET_STUDENTS),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground">
            Manage student records and admissions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsAddOpen(true)}>
            <UserPlus size={16} className="mr-2" />
            Add Student
          </Button>
          <Button onClick={() => setIsBulkOpen(true)}>
            <Plus size={16} className="mr-2" />
            Bulk Upload
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.students || []}
        searchKey="name"
      />

      <StudentBulkUpload
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onSuccess={() => setIsBulkOpen(false)}
      />

      <AddStudentDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />
    </div>
  );
}
