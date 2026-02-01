"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import {
  GET_DEPARTMENT_OFFERINGS,
  REMOVE_COURSE_FROM_DEPARTMENT,
} from "@/lib/graphql/course";
import { AddCourseDialog } from "./add-course-dialog";
import { Button } from "@workspace/ui/components/button";
import { Trash2, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@workspace/ui/components/pagination";

interface CurriculumManagementProps {
  departmentId: string;
}

export function CurriculumManagement({
  departmentId,
}: CurriculumManagementProps) {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [semesterFilter, setSemesterFilter] = useState<
    "ALL" | "FIRST" | "SECOND"
  >("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // We need department details to get numberOfYears
  // Ideally this should be passed down or fetched if not available
  // For now, let's derive levels from the data itself or default to 4 years if no data
  // But strictly, we should fetch the department. Let's assume passed prop or fetch it.
  // Since we don't have deptCode here easily without prop drilling or fetching,
  // we will infer levels from the data + a default range.

  const { data: offeringsData, isLoading: isLoadingOfferings } = useQuery({
    queryKey: ["department-offerings", departmentId],
    queryFn: () =>
      graphqlClient.request<{ departmentOfferings: any[] }>(
        GET_DEPARTMENT_OFFERINGS,
        { departmentId },
      ),
  });

  const removeMutation = useMutation({
    mutationFn: (courseId: string) =>
      graphqlClient.request(REMOVE_COURSE_FROM_DEPARTMENT, {
        departmentId,
        courseId,
      }),
    onSuccess: () => {
      toast.success("Course removed from curriculum");
      queryClient.invalidateQueries({
        queryKey: ["department-offerings", departmentId],
      });
    },
    onError: (error: any) => {
      toast.error("Failed to remove course: " + error.message);
    },
  });

  const offerings = useMemo(
    () => offeringsData?.departmentOfferings || [],
    [offeringsData],
  );

  // Determine levels (e.g., 100, 200, 300, 400...)
  // We'll find the max level in the data, default to 400 if empty or low.
  const levels = useMemo(() => {
    const dataLevels = offerings.map((o: any) => o.level);
    const maxLevel = dataLevels.length > 0 ? Math.max(...dataLevels) : 400;
    // Round up to nearest 100
    const max = Math.ceil(maxLevel / 100) * 100;
    const lvls = [];
    for (let i = 100; i <= Math.max(max, 400); i += 100) {
      lvls.push(i);
    }
    return lvls.sort((a, b) => a - b);
  }, [offerings]);

  const [activeTab, setActiveTab] = useState<string>(
    levels[0]?.toString() || "100",
  );

  const filteredOfferings = useMemo(() => {
    return offerings.filter((offering: any) => {
      const levelMatch = offering.level === parseInt(activeTab);
      const semesterMatch =
        semesterFilter === "ALL" || offering.semester === semesterFilter;
      return levelMatch && semesterMatch;
    });
  }, [offerings, activeTab, semesterFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredOfferings.length / itemsPerPage);
  const paginatedOfferings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOfferings.slice(start, start + itemsPerPage);
  }, [filteredOfferings, currentPage]);

  if (isLoadingOfferings) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading curriculum...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Curriculum Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage courses for each level.
          </p>
        </div>
        <AddCourseDialog departmentId={departmentId} />
      </div>

      <div className="flex flex-col gap-4">
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val);
            setCurrentPage(1);
          }}
          className="w-full"
        >
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              {levels.map((level) => (
                <TabsTrigger key={level} value={level.toString()}>
                  {level} Level
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex items-center gap-2">
              <Select
                value={semesterFilter}
                onValueChange={(val: any) => {
                  setSemesterFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Semesters</SelectItem>
                  <SelectItem value="FIRST">First Semester</SelectItem>
                  <SelectItem value="SECOND">Second Semester</SelectItem>
                </SelectContent>
              </Select>

              <div className="border rounded-md flex p-1 bg-muted/50">
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("table")}
                >
                  <List size={16} />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid size={16} />
                </Button>
              </div>
            </div>
          </div>

          <TabsContent value={activeTab} className="space-y-4">
            {paginatedOfferings.length === 0 ? (
              <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground">
                No courses found for this level and filter.
              </div>
            ) : (
              <>
                {viewMode === "table" ? (
                  <div className="border rounded-lg overflow-hidden bg-white dark:bg-neutral-900">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Units</TableHead>
                          <TableHead>Semester</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedOfferings.map((offering: any) => (
                          <TableRow key={offering.id}>
                            <TableCell className="font-medium">
                              {offering.course.code}
                            </TableCell>
                            <TableCell>{offering.course.title}</TableCell>
                            <TableCell>{offering.course.credits}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {offering.semester}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  offering.courseType === "COMPULSORY"
                                    ? "primary"
                                    : "secondary"
                                }
                              >
                                {offering.courseType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Remove Course?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove{" "}
                                      <span className="font-bold">
                                        {offering.course.code}
                                      </span>
                                      ?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive hover:bg-destructive/90"
                                      onClick={() =>
                                        removeMutation.mutate(
                                          offering.course.id,
                                        )
                                      }
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedOfferings.map((offering: any) => (
                      <Card key={offering.id} className="relative group">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">
                                {offering.course.code}
                              </CardTitle>
                              <CardDescription>
                                {offering.course.credits} Units
                              </CardDescription>
                            </div>
                            <Badge
                              variant={
                                offering.courseType === "COMPULSORY"
                                  ? "primary"
                                  : "secondary"
                              }
                            >
                              {offering.courseType}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {offering.course.title}
                          </p>
                          <div className="flex justify-between items-center">
                            <Badge variant="outline">{offering.semester}</Badge>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Remove Course?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove{" "}
                                    <span className="font-bold">
                                      {offering.course.code}
                                    </span>
                                    ?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive hover:bg-destructive/90"
                                    onClick={() =>
                                      removeMutation.mutate(offering.course.id)
                                    }
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                        </PaginationItem>
                        <PaginationItem>
                          <span className="text-sm text-muted-foreground px-4">
                            Page {currentPage} of {totalPages}
                          </span>
                        </PaginationItem>
                        <PaginationItem>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setCurrentPage((p) => Math.min(totalPages, p + 1))
                            }
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
