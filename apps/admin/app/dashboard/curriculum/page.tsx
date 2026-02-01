"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { GET_FACULTIES, GET_FACULTY_BY_CODE } from "@/lib/graphql/faculty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { CurriculumManagement } from "../faculty/[code]/department/[deptCode]/curriculum-management";

export default function CurriculumPage() {
  const [selectedFacultyCode, setSelectedFacultyCode] = useState<string>("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");

  const { data: facultiesData, isLoading: isLoadingFaculties } = useQuery({
    queryKey: ["faculties"],
    queryFn: () => graphqlClient.request<{ faculties: any[] }>(GET_FACULTIES),
  });

  const { data: facultyData, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ["faculty", selectedFacultyCode],
    queryFn: () =>
      graphqlClient.request<{ facultyByCode: any }>(GET_FACULTY_BY_CODE, {
        code: selectedFacultyCode,
      }),
    enabled: !!selectedFacultyCode,
  });

  const departments = facultyData?.facultyByCode?.departments || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Curriculum Management
        </h1>
        <p className="text-muted-foreground">
          Manage course offerings for any department.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Department</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Faculty</label>
            <Select
              value={selectedFacultyCode}
              onValueChange={(val) => {
                setSelectedFacultyCode(val);
                setSelectedDepartmentId(""); // Reset department when faculty changes
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Faculty" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingFaculties ? (
                  <div className="p-2 text-center text-sm">Loading...</div>
                ) : (
                  facultiesData?.faculties.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.code}>
                      {faculty.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Department</label>
            <Select
              value={selectedDepartmentId}
              onValueChange={setSelectedDepartmentId}
              disabled={!selectedFacultyCode || isLoadingDepartments}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingDepartments ? (
                  <div className="p-2 text-center text-sm">Loading...</div>
                ) : departments.length === 0 && selectedFacultyCode ? (
                  <div className="p-2 text-center text-sm">
                    No departments found
                  </div>
                ) : (
                  departments.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedDepartmentId && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CurriculumManagement departmentId={selectedDepartmentId} />
        </div>
      )}
    </div>
  );
}
