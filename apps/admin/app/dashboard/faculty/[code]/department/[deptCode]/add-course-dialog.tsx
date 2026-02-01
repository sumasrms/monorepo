import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql-client";
import { ADD_COURSE_TO_DEPARTMENT, GET_COURSES } from "@/lib/graphql/course";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

const courseSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  level: z.coerce.number().min(100, "Level is required"),
  semester: z.enum(["FIRST", "SECOND"]),
  courseType: z.enum(["COMPULSORY", "ELECTIVE"]),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface AddCourseDialogProps {
  departmentId: string;
}

export function AddCourseDialog({ departmentId }: AddCourseDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: coursesData, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["courses"],
    queryFn: () => graphqlClient.request<{ courses: any[] }>(GET_COURSES),
  });

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      level: 100,
      semester: "FIRST",
      courseType: "COMPULSORY",
    },
  });

  const addCourseMutation = useMutation({
    mutationFn: (values: CourseFormValues) =>
      graphqlClient.request(ADD_COURSE_TO_DEPARTMENT, {
        input: {
          ...values,
          departmentId,
        },
      }),
    onSuccess: () => {
      toast.success("Course added to curriculum");
      queryClient.invalidateQueries({
        queryKey: ["department-offerings", departmentId],
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error("Failed to add course: " + error.message);
    },
  });

  const onSubmit = (values: CourseFormValues) => {
    addCourseMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Course to Curriculum</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            control={form.control}
            name="courseId"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Course</FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingCourses ? (
                      <div className="p-2 text-center text-sm">Loading...</div>
                    ) : (
                      coursesData?.courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code} - {course.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={form.control}
              name="level"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Level</FieldLabel>
                  <Select
                    onValueChange={(val) => field.onChange(parseInt(val))}
                    defaultValue={field.value?.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {[100, 200, 300, 400, 500, 600].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {level} Level
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="semester"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Semester</FieldLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIRST">First Semester</SelectItem>
                      <SelectItem value="SECOND">Second Semester</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="courseType"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Course Type</FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPULSORY">Compulsory</SelectItem>
                    <SelectItem value="ELECTIVE">Elective</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={addCourseMutation.isPending}
          >
            {addCourseMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Add to Curriculum
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
