import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import {
  Users,
  GraduationCap,
  Building2,
  School,
  FilePlus2,
  UserPlus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

export function QuickActions() {
  const actions = [
    {
      label: "Manage Students",
      href: "/dashboard/students",
      icon: GraduationCap,
      variant: "default" as const,
    },
    {
      label: "Manage Staff",
      href: "/dashboard/staffs",
      icon: Users,
      variant: "outline" as const,
    },
    {
      label: "Manage Departments",
      href: "/dashboard/faculty", // Assuming this is the entry point
      icon: Building2,
      variant: "outline" as const,
    },
    {
      label: "Manage Faculties",
      href: "/dashboard/faculty",
      icon: School,
      variant: "outline" as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant}
            className="h-auto py-4 flex flex-col items-center gap-2"
            asChild
          >
            <Link href={action.href}>
              <action.icon size={24} />
              <span>{action.label}</span>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
