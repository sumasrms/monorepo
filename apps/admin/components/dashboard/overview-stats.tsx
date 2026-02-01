import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Users,
  BookOpen,
  GraduationCap,
  Building2,
  School,
} from "lucide-react";

interface Stats {
  studentCount: number;
  staffCount: number;
  courseCount: number;
  departmentCount: number;
  facultyCount: number;
}

export function OverviewStats({ stats }: { stats?: Stats }) {
  const items = [
    {
      title: "Total Students",
      value: stats?.studentCount || 0,
      icon: GraduationCap,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Staff",
      value: stats?.staffCount || 0,
      icon: Users,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Active Courses",
      value: stats?.courseCount || 0,
      icon: BookOpen,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "Departments",
      value: stats?.departmentCount || 0,
      icon: Building2,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Faculties",
      value: stats?.facultyCount || 0,
      icon: School,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <div className={`p-2 rounded-full ${item.bg}`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {item.value.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
